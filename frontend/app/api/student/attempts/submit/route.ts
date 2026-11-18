import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { authenticateUser, checkAccountStatus, checkMockTestAssignment, logAudit } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateUser(req)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required to submit exam', code: 'UNAUTHENTICATED' },
        { status: 401 }
      )
    }

    // 1. Account status verification
    const { active, reason } = await checkAccountStatus(user.id, user.role)
    if (!active) {
      return NextResponse.json(
        { success: false, error: reason || 'Unauthorized: Account is inactive or deleted', code: 'ACCOUNT_INACTIVE' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { attempt_id, answers = [], time_taken_seconds = 0 } = body

    if (!attempt_id) {
      return NextResponse.json({ success: false, error: 'Attempt ID is required' }, { status: 400 })
    }

    // 2. Get attempt & assessment info
    const [[attempt]]: any = await db.query(
      `SELECT a.id, a.assessment_id, a.student_id, a.status, asm.passing_percentage, asm.total_marks
       FROM assessment_attempts a
       JOIN assessments asm ON a.assessment_id = asm.id
       WHERE a.id = ?`,
      [attempt_id]
    )

    if (!attempt) {
      return NextResponse.json({ success: false, error: 'Attempt record not found' }, { status: 404 })
    }

    // 3. Verify attempt belongs to current authenticated student (prevent student from submitting another student's test)
    if (user.role === 'student' && Number(attempt.student_id) !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not own this attempt record', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 4. Verify assignment status is still valid and not revoked
    if (user.role === 'student') {
      const { assigned, status } = await checkMockTestAssignment(user.id, attempt.assessment_id)
      if (!assigned) {
        await logAudit({
          actorId: user.id,
          actorRole: user.role,
          action: 'UNAUTHORIZED_EXAM_SUBMISSION_ATTEMPT',
          affectedStudentId: user.id,
          targetId: attempt.id,
          targetType: 'assessment_attempt',
          details: { assignmentStatus: status, assessmentId: attempt.assessment_id },
          ipAddress: req.headers.get('x-forwarded-for') || null,
          userAgent: req.headers.get('user-agent') || null,
        })

        return NextResponse.json(
          {
            success: false,
            error:
              status === 'revoked'
                ? 'Submission rejected: Your assignment to this mock test was revoked.'
                : 'Submission rejected: No active assignment for this mock test.',
            code: 'NOT_ASSIGNED',
          },
          { status: 403 }
        )
      }
    }

    // Prevent re-submitting an already submitted attempt
    if (attempt.status === 'submitted') {
      return NextResponse.json({
        success: true,
        attemptId: attempt.id,
        message: 'Exam has already been submitted',
      })
    }

    // Get all questions snapshotted for this attempt
    const [attemptQuestions]: any = await db.query(
      `SELECT id, question_id, order_index, marks, negative_marks 
       FROM assessment_attempt_questions 
       WHERE attempt_id = ?`,
      [attempt_id]
    )

    // Get correct answers for all questions
    const questionIds = attemptQuestions.map((q: any) => q.question_id)
    const [correctOptions]: any = await db.query(
      `SELECT question_id, option_key 
       FROM question_options 
       WHERE question_id IN (${questionIds.map(() => '?').join(',')}) AND is_correct = 1`,
      questionIds
    )

    const correctKeyMap: Record<number, string> = {}
    for (const opt of correctOptions) {
      correctKeyMap[opt.question_id] = opt.option_key
    }

    // Index answers sent from client by question_id
    const clientAnswersMap: Record<number, { selected_option_key?: string; answer_status?: string; time_spent_seconds?: number }> = {}
    if (Array.isArray(answers)) {
      for (const a of answers) {
        clientAnswersMap[Number(a.question_id)] = a
      }
    }

    let attempted_questions = 0
    let correct_answers = 0
    let incorrect_answers = 0
    let unanswered_questions = 0
    let positive_marks = 0
    let negative_marks = 0

    // Process each question
    for (const aq of attemptQuestions) {
      const qId = Number(aq.question_id)
      const clientAns = clientAnswersMap[qId]
      const selectedKey = clientAns?.selected_option_key || null
      const rawStatus = clientAns?.answer_status || (selectedKey ? 'answered' : 'unanswered')
      const timeSpent = Math.max(0, Number(clientAns?.time_spent_seconds || 0))

      let is_correct: number | null = null
      let marks_awarded = 0
      let answer_status = rawStatus

      if (selectedKey) {
        attempted_questions++
        const expectedKey = correctKeyMap[qId]
        if (expectedKey && selectedKey.toUpperCase() === expectedKey.toUpperCase()) {
          is_correct = 1
          marks_awarded = Number(aq.marks)
          correct_answers++
          positive_marks += marks_awarded
        } else {
          is_correct = 0
          marks_awarded = -Number(aq.negative_marks)
          incorrect_answers++
          negative_marks += Number(aq.negative_marks)
        }
      } else {
        unanswered_questions++
        answer_status = 'unanswered'
      }

      await db.query(
        `INSERT INTO attempt_answers 
         (attempt_id, attempt_question_id, answer_status, selected_option_key, is_correct, marks_awarded, time_spent_seconds, first_answered_at, last_answered_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
         ON DUPLICATE KEY UPDATE 
           answer_status = VALUES(answer_status),
           selected_option_key = VALUES(selected_option_key),
           is_correct = VALUES(is_correct),
           marks_awarded = VALUES(marks_awarded),
           time_spent_seconds = VALUES(time_spent_seconds),
           last_answered_at = NOW(),
           updated_at = NOW()`,
        [attempt_id, aq.id, answer_status, selectedKey, is_correct, marks_awarded, timeSpent]
      )
    }

    const rawTotalMarks = Number(attempt.total_marks || 0)
    const total_questions = attemptQuestions.length
    const total_marks = rawTotalMarks > 0 ? rawTotalMarks : total_questions * 1.0
    const obtained_marks = Math.max(0, Math.round((positive_marks - negative_marks) * 100) / 100)
    const percentage = total_marks > 0 ? Math.min(100, Math.round((obtained_marks / total_marks) * 10000) / 100) : 0
    const accuracy = attempted_questions > 0 ? Math.round((correct_answers / attempted_questions) * 10000) / 100 : 0
    const passing_percentage = Number(attempt.passing_percentage || 40)
    const passed = percentage >= passing_percentage

    // Update assessment_attempts
    await db.query(
      `UPDATE assessment_attempts 
       SET status = 'submitted',
           submission_time = NOW(),
           attempted_questions = ?,
           correct_answers = ?,
           incorrect_answers = ?,
           unanswered_questions = ?,
           obtained_marks = ?,
           percentage = ?,
           accuracy = ?,
           time_taken_seconds = ?,
           passed = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        attempted_questions,
        correct_answers,
        incorrect_answers,
        unanswered_questions,
        obtained_marks,
        percentage,
        accuracy,
        time_taken_seconds,
        passed ? 1 : 0,
        attempt_id,
      ]
    )

    // Store in attempt_results table
    await db.query(
      `INSERT INTO attempt_results 
       (attempt_id, total_questions, attempted_questions, correct_answers, incorrect_answers, unanswered_questions, positive_marks, negative_marks, obtained_marks, total_marks, percentage, accuracy, passed, calculated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
         total_questions = VALUES(total_questions),
         attempted_questions = VALUES(attempted_questions),
         correct_answers = VALUES(correct_answers),
         incorrect_answers = VALUES(incorrect_answers),
         unanswered_questions = VALUES(unanswered_questions),
         positive_marks = VALUES(positive_marks),
         negative_marks = VALUES(negative_marks),
         obtained_marks = VALUES(obtained_marks),
         total_marks = VALUES(total_marks),
         percentage = VALUES(percentage),
         accuracy = VALUES(accuracy),
         passed = VALUES(passed),
         calculated_at = NOW()`,
      [
        attempt_id,
        total_questions,
        attempted_questions,
        correct_answers,
        incorrect_answers,
        unanswered_questions,
        positive_marks,
        negative_marks,
        obtained_marks,
        total_marks,
        percentage,
        accuracy,
        passed ? 1 : 0,
      ]
    )

    // Update assignment status to 'completed'
    await db.query(
      `UPDATE mock_test_assignments 
       SET assignment_status = 'completed', updated_at = NOW() 
       WHERE student_id = ? AND mock_test_id = ? AND assignment_status = 'assigned'`,
      [user.id, attempt.assessment_id]
    )

    await logAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'EXAM_ATTEMPT_SUBMITTED',
      affectedStudentId: user.id,
      targetId: attempt.id,
      targetType: 'assessment_attempt',
      details: {
        obtained_marks,
        total_marks,
        percentage,
        passed,
        correct_answers,
        incorrect_answers,
      },
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    })

    return NextResponse.json({
      success: true,
      attemptId: attempt_id,
      results: {
        total_questions,
        attempted_questions,
        correct_answers,
        incorrect_answers,
        unanswered_questions,
        positive_marks,
        negative_marks,
        obtained_marks,
        total_marks,
        percentage,
        accuracy,
        passed,
        time_taken_seconds,
      },
      message: 'Exam submitted and evaluated successfully',
    })
  } catch (error: any) {
    console.error('Error submitting attempt:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
