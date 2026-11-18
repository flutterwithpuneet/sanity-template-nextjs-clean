import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { requireAdmin, logAudit } from '@/lib/auth'

interface OptionInput {
  key: string
  text?: string
  text_hi?: string
  is_correct: boolean
}

interface QuestionInput {
  subject_code?: string
  subject_name?: string
  topic_name?: string
  topic_slug?: string
  question_text?: string
  question_text_hi?: string
  explanation?: string
  explanation_hi?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  marks?: number
  negative_marks?: number
  options: OptionInput[]
}

interface MockTestImportPayload {
  exam_code?: string
  exam_name?: string
  title: string
  description?: string
  difficulty_level?: 'easy' | 'medium' | 'hard'
  duration_minutes?: number
  passing_percentage?: number
  marks_per_question?: number
  negative_marks_per_question?: number
  questions: QuestionInput[]
}

function normalize(str?: string): string {
  if (!str) return ''
  return str.trim().toLowerCase().replace(/[\s\-_]+/g, ' ')
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth.response) return auth.response

  let client: any = null
  try {
    client = await pool.connect()

    const examsRes = await client.query('SELECT id, name, code FROM exams ORDER BY id')
    const subjectsRes = await client.query('SELECT id, name, code, description FROM subjects ORDER BY id')
    const topicsRes = await client.query('SELECT id, subject_id, name, slug FROM topics ORDER BY subject_id, order_index ASC, id ASC')

    // Group topics by subject
    const topicsBySubject: Record<string, any[]> = {}
    topicsRes.rows.forEach((t: any) => {
      const sId = String(t.subject_id)
      if (!topicsBySubject[sId]) {
        topicsBySubject[sId] = []
      }
      topicsBySubject[sId].push({
        id: t.id,
        name: t.name,
        slug: t.slug,
      })
    })

    const subjectsWithTopics = subjectsRes.rows.map((s: any) => ({
      ...s,
      topics: topicsBySubject[String(s.id)] || [],
    }))

    return NextResponse.json({
      success: true,
      exams: examsRes.rows,
      subjects: subjectsWithTopics,
    })
  } catch (error: any) {
    console.error('Failed to get hierarchy metadata:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  } finally {
    if (client) {
      client.release()
    }
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth.response) return auth.response

  let client: any = null

  try {
    const body = await req.json()
    const action = body.action || 'validate' // 'validate' | 'import'
    let payload: MockTestImportPayload = body.payload || body

    // Support stringified payload
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload)
      } catch (err: any) {
        return NextResponse.json(
          {
            success: false,
            valid: false,
            errors: [`Invalid JSON Syntax: ${err.message}`],
          },
          { status: 400 }
        )
      }
    }

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          errors: ['Payload must be a valid JSON object.'],
        },
        { status: 400 }
      )
    }

    client = await pool.connect()

    // 1. Fetch available Exams from Database
    const examsRes = await client.query('SELECT id, name, code FROM exams ORDER BY id')
    const exams = examsRes.rows

    // 2. Fetch available Subjects from Database
    const subjectsRes = await client.query('SELECT id, name, code FROM subjects ORDER BY id')
    const subjects = subjectsRes.rows

    // 3. Fetch available Topics from Database
    const topicsRes = await client.query('SELECT id, subject_id, name, slug FROM topics ORDER BY subject_id, id')
    const topics = topicsRes.rows

    // Build Fast Lookup Dictionaries
    // Subject by code/name
    const subjectLookup: Record<string, any> = {}
    subjects.forEach((s: any) => {
      subjectLookup[s.code.toUpperCase()] = s
      subjectLookup[normalize(s.name)] = s
    })

    // Topics by subject_id + topic_name/slug
    const topicLookup: Record<string, any> = {}
    const topicsBySubject: Record<string, string[]> = {}

    topics.forEach((t: any) => {
      const sId = String(t.subject_id)
      const nameKey = `${sId}:${normalize(t.name)}`
      const slugKey = `${sId}:${normalize(t.slug)}`
      topicLookup[nameKey] = t
      topicLookup[slugKey] = t

      if (!topicsBySubject[sId]) {
        topicsBySubject[sId] = []
      }
      topicsBySubject[sId].push(t.name)
    })

    // Validation checks
    const errors: string[] = []
    const warnings: string[] = []

    // 1. Validate Exam
    let matchedExam: any = null
    if (payload.exam_code) {
      matchedExam = exams.find(
        (e: any) =>
          e.code?.toUpperCase() === payload.exam_code?.toUpperCase() ||
          normalize(e.name) === normalize(payload.exam_code)
      )
    } else if (payload.exam_name) {
      matchedExam = exams.find((e: any) => normalize(e.name) === normalize(payload.exam_name))
    }

    // Default to the first active exam (Rajasthan Informatics Assistant) if not provided or matches
    if (!matchedExam && exams.length > 0) {
      matchedExam = exams[0]
      if (payload.exam_code || payload.exam_name) {
        errors.push(
          `Exam "${payload.exam_code || payload.exam_name}" not found. Allowed exams: ${exams.map((e: any) => `${e.name} (${e.code})`).join(', ')}.`
        )
      }
    }

    // 2. Validate Mock Title
    if (!payload.title || typeof payload.title !== 'string' || !payload.title.trim()) {
      errors.push('Mock Test "title" is required and cannot be empty.')
    }

    // 3. Validate Questions Array
    if (!payload.questions || !Array.isArray(payload.questions) || payload.questions.length === 0) {
      errors.push('Mock Test must include a "questions" array with at least 1 question.')
    }

    const subjectCounts: Record<string, number> = {}
    const topicCounts: Record<string, number> = {}

    if (Array.isArray(payload.questions)) {
      payload.questions.forEach((q, idx) => {
        const qNum = idx + 1

        // A. Match Subject
        const subIdentifier = q.subject_code || q.subject_name
        let matchedSubject: any = null

        if (subIdentifier) {
          matchedSubject =
            subjectLookup[subIdentifier.toUpperCase()] || subjectLookup[normalize(subIdentifier)]
        }

        if (!matchedSubject) {
          const allowedSubjects = subjects.map((s: any) => `${s.code} (${s.name})`).join(', ')
          errors.push(
            `Question #${qNum}: Subject "${subIdentifier || 'UNKNOWN'}" does not exist. Available subjects: ${allowedSubjects}.`
          )
        } else {
          subjectCounts[matchedSubject.code] = (subjectCounts[matchedSubject.code] || 0) + 1

          // B. Match Topic under this subject
          const topicIdentifier = q.topic_name || q.topic_slug
          let matchedTopic: any = null

          if (topicIdentifier) {
            const nameKey = `${matchedSubject.id}:${normalize(topicIdentifier)}`
            matchedTopic = topicLookup[nameKey]
          }

          if (!matchedTopic) {
            const allowedTopics = topicsBySubject[String(matchedSubject.id)] || []
            errors.push(
              `Question #${qNum}: Topic "${topicIdentifier || 'MISSING'}" not found under Subject "${matchedSubject.name}". Allowed topics: ${allowedTopics.slice(0, 10).join(', ')}${allowedTopics.length > 10 ? '...' : ''}.`
            )
          } else {
            topicCounts[matchedTopic.name] = (topicCounts[matchedTopic.name] || 0) + 1
          }
        }

        // C. Question Text
        const hasText = Boolean(q.question_text?.trim() || q.question_text_hi?.trim())
        if (!hasText) {
          errors.push(`Question #${qNum}: Must have either "question_text" (English) or "question_text_hi" (Hindi).`)
        } else if (!q.question_text_hi) {
          warnings.push(`Question #${qNum}: Missing Hindi translation ("question_text_hi"). Bilingual questions are recommended.`)
        }

        // D. Options
        if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
          errors.push(`Question #${qNum}: Must have at least 2 options (standard: 4 options A, B, C, D).`)
        } else {
          let correctCount = 0
          q.options.forEach((opt, oIdx) => {
            if (!opt.key) {
              errors.push(`Question #${qNum}, Option #${oIdx + 1}: Missing "key" (e.g. "A", "B", "C", "D").`)
            }
            if (!opt.text && !opt.text_hi) {
              errors.push(`Question #${qNum}, Option ${opt.key || oIdx + 1}: Missing option text.`)
            }
            if (opt.is_correct === true) {
              correctCount++
            }
          })

          if (correctCount === 0) {
            errors.push(`Question #${qNum}: No correct option specified. Exactly 1 option must have "is_correct": true.`)
          } else if (correctCount > 1) {
            errors.push(`Question #${qNum}: Multiple correct options (${correctCount}) found. Single-choice mock tests require exactly 1 correct option.`)
          }
        }
      })
    }

    const isValid = errors.length === 0
    const totalQuestions = Array.isArray(payload.questions) ? payload.questions.length : 0
    const marksPerQ = Number(payload.marks_per_question) || 1.0
    const negMarksPerQ = Number(payload.negative_marks_per_question) || 0.25
    const totalMarks = totalQuestions * marksPerQ

    // Return Validation Result if action is 'validate' OR if validation failed
    if (action === 'validate' || !isValid) {
      return NextResponse.json({
        success: true,
        valid: isValid,
        action: 'validate',
        summary: {
          title: payload.title,
          exam: matchedExam
            ? { id: matchedExam.id, name: matchedExam.name, code: matchedExam.code }
            : null,
          difficulty_level: payload.difficulty_level || 'medium',
          duration_minutes: payload.duration_minutes || 60,
          total_questions: totalQuestions,
          total_marks: totalMarks,
          marks_per_question: marksPerQ,
          negative_marks_per_question: negMarksPerQ,
          subject_breakdown: subjectCounts,
          topic_breakdown: topicCounts,
        },
        errors,
        warnings,
      })
    }

    // -------------------------------------------------------------
    // ACTION: 'import' (Insert into Database within Transaction)
    // -------------------------------------------------------------
    await client.query('BEGIN')

    const slug = `${payload.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')}-${Date.now()}`

    // 1. Insert Assessment
    const insertAssessmentQuery = `
      INSERT INTO assessments 
      (title, slug, description, exam_id, assessment_type, difficulty_level, duration_minutes, total_questions, total_marks, passing_percentage, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'published', NOW())
      RETURNING id
    `
    const assessmentRes = await client.query(insertAssessmentQuery, [
      payload.title.trim(),
      slug,
      payload.description?.trim() || 'Official ExamForge Computer & General Syllabus Mock Drill.',
      matchedExam ? matchedExam.id : 1,
      'mock',
      payload.difficulty_level || 'medium',
      payload.duration_minutes || 60,
      totalQuestions,
      totalMarks,
      payload.passing_percentage || 40.0,
    ])

    const assessmentId = assessmentRes.rows[0].id

    // 2. Insert Questions & Options
    for (let i = 0; i < payload.questions.length; i++) {
      const q = payload.questions[i]
      const orderIndex = i + 1

      // Resolve matched subject & topic
      const subIdentifier = q.subject_code || q.subject_name
      const matchedSub =
        subjectLookup[subIdentifier!.toUpperCase()] || subjectLookup[normalize(subIdentifier)]
      const topicIdentifier = q.topic_name || q.topic_slug
      const matchedTop = topicLookup[`${matchedSub.id}:${normalize(topicIdentifier)}`]

      const questionMarks = q.marks !== undefined ? Number(q.marks) : marksPerQ
      const questionNegMarks =
        q.negative_marks !== undefined ? Number(q.negative_marks) : negMarksPerQ

      // Insert into questions table
      const insertQQuery = `
        INSERT INTO questions 
        (subject_id, topic_id, question_text, question_text_hi, question_type, difficulty, status, explanation, explanation_hi, default_marks, default_negative_marks, language_code, source, created_at)
        VALUES ($1, $2, $3, $4, 'single_choice', $5, 'active', $6, $7, $8, $9, 'both', 'json_mock_importer', NOW())
        RETURNING id
      `
      const qRes = await client.query(insertQQuery, [
        matchedSub.id,
        matchedTop.id,
        q.question_text?.trim() || q.question_text_hi?.trim(),
        q.question_text_hi?.trim() || null,
        q.difficulty || payload.difficulty_level || 'medium',
        q.explanation?.trim() || null,
        q.explanation_hi?.trim() || null,
        questionMarks,
        questionNegMarks,
      ])

      const questionId = qRes.rows[0].id

      // Insert Options
      for (let oIdx = 0; oIdx < q.options.length; oIdx++) {
        const opt = q.options[oIdx]
        await client.query(
          `INSERT INTO question_options 
           (question_id, option_key, option_text, option_text_hi, is_correct, order_index)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            questionId,
            opt.key.toUpperCase(),
            opt.text?.trim() || opt.text_hi?.trim(),
            opt.text_hi?.trim() || null,
            opt.is_correct ? 1 : 0,
            oIdx + 1,
          ]
        )
      }

      // Link to assessment in assessment_questions
      await client.query(
        `INSERT INTO assessment_questions 
         (assessment_id, question_id, order_index, marks, negative_marks)
         VALUES ($1, $2, $3, $4, $5)`,
        [assessmentId, questionId, orderIndex, questionMarks, questionNegMarks]
      )
    }

    await client.query('COMMIT')

    // Audit log
    await logAudit({
      actorId: auth.user.id,
      actorRole: 'admin',
      action: 'MOCK_TEST_IMPORTED_VIA_JSON',
      targetId: Number(assessmentId),
      targetType: 'assessment',
      details: {
        title: payload.title,
        total_questions: totalQuestions,
        subject_breakdown: subjectCounts,
      },
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    })

    return NextResponse.json({
      success: true,
      valid: true,
      action: 'import',
      assessment_id: assessmentId,
      title: payload.title,
      total_questions: totalQuestions,
      message: `Mock test "${payload.title}" created successfully with ${totalQuestions} questions!`,
    })
  } catch (error: any) {
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch (_) {}
    }
    console.error('Mock Test Import API Error:', error)
    return NextResponse.json(
      {
        success: false,
        valid: false,
        errors: [`Database Transaction Error: ${error.message}`],
      },
      { status: 500 }
    )
  } finally {
    if (client) {
      client.release()
    }
  }
}
