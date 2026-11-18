import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireAdmin, logAudit } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth.response) return auth.response

  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')

    let whereClauses: string[] = []
    let params: any[] = []

    if (type && type !== 'all') {
      whereClauses.push('a.assessment_type = ?')
      params.push(type)
    }
    if (status && status !== 'all') {
      whereClauses.push('a.status = ?')
      params.push(status)
    }
    if (difficulty && difficulty !== 'all') {
      whereClauses.push('LOWER(a.difficulty_level) = LOWER(?)')
      params.push(difficulty)
    }
    if (search && search.trim()) {
      whereClauses.push('(a.title LIKE ? OR a.description LIKE ?)')
      params.push(`%${search.trim()}%`, `%${search.trim()}%`)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const [tests]: any = await db.query(
      `SELECT 
        a.id,
        a.title,
        a.slug,
        a.description,
        a.exam_id,
        a.subject_id,
        a.topic_id,
        a.assessment_type,
        a.duration_minutes,
        a.total_questions,
        a.total_marks,
        a.passing_percentage,
        COALESCE(a.difficulty_level, 'medium') as difficulty_level,
        a.status,
        a.created_at,
        e.name as exam_name,
        s.name as subject_name,
        COUNT(DISTINCT aq.question_id) as actual_question_count,
        COUNT(DISTINCT att.id) as attempts_count,
        COUNT(DISTINCT mta.student_id) as assigned_students_count,
        AVG(att.percentage) as avg_score
      FROM assessments a
      LEFT JOIN exams e ON a.exam_id = e.id
      LEFT JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN assessment_questions aq ON a.id = aq.assessment_id
      LEFT JOIN assessment_attempts att ON a.id = att.assessment_id
      LEFT JOIN mock_test_assignments mta ON a.id = mta.mock_test_id AND mta.assignment_status = 'assigned'
      ${whereSql}
      GROUP BY a.id, a.title, a.slug, a.description, a.exam_id, a.subject_id, a.topic_id, a.assessment_type, a.duration_minutes, a.total_questions, a.total_marks, a.passing_percentage, a.difficulty_level, a.status, a.created_at, e.name, s.name
      ORDER BY a.id DESC`,
      params
    )

    return NextResponse.json({ success: true, tests })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    const {
      title,
      description,
      exam_id = 1,
      subject_id = null,
      topic_id = null,
      assessment_type = 'mock',
      difficulty_level = 'medium',
      duration_minutes = 60,
      passing_percentage = 40.0,
      status = 'published',
      selected_question_ids = [],
      marks_per_question = 1.0,
      negative_marks_per_question = 0.25,
    } = body

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${Date.now()}`
    const total_questions = Array.isArray(selected_question_ids) ? selected_question_ids.length : 0
    const total_marks = total_questions * Number(marks_per_question)

    const [res]: any = await db.query(
      `INSERT INTO assessments 
       (title, slug, description, exam_id, subject_id, topic_id, assessment_type, difficulty_level, duration_minutes, total_questions, total_marks, passing_percentage, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        title,
        slug,
        description || null,
        exam_id || null,
        subject_id || null,
        topic_id || null,
        assessment_type,
        difficulty_level || 'medium',
        duration_minutes,
        total_questions,
        total_marks,
        passing_percentage,
        status,
      ]
    )

    const assessmentId = res.insertId

    // Insert linked questions
    if (selected_question_ids && selected_question_ids.length > 0) {
      for (let i = 0; i < selected_question_ids.length; i++) {
        const qId = selected_question_ids[i]
        await db.query(
          `INSERT INTO assessment_questions 
           (assessment_id, question_id, order_index, marks, negative_marks)
           VALUES (?, ?, ?, ?, ?)`,
          [assessmentId, qId, i + 1, marks_per_question, negative_marks_per_question]
        )
      }
    }

    await logAudit({
      actorId: auth.user.id,
      actorRole: 'admin',
      action: 'MOCK_TEST_CREATED',
      targetId: assessmentId,
      targetType: 'assessment',
      details: { title, total_questions, assessment_type },
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    })

    return NextResponse.json({
      success: true,
      assessmentId,
      message: 'Assessment created successfully',
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth.response) return auth.response

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
    }

    await db.query(`DELETE FROM assessment_questions WHERE assessment_id = ?`, [id])
    await db.query(`DELETE FROM mock_test_assignments WHERE mock_test_id = ?`, [id])
    await db.query(`DELETE FROM assessments WHERE id = ?`, [id])

    await logAudit({
      actorId: auth.user.id,
      actorRole: 'admin',
      action: 'MOCK_TEST_DELETED',
      targetId: Number(id),
      targetType: 'assessment',
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, message: 'Assessment deleted' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
