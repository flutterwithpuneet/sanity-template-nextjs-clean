import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { authenticateUser, checkAccountStatus, checkMockTestAssignment, logAudit } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateUser(req)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Valid candidate session required to start exam', code: 'UNAUTHENTICATED' },
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
    const { assessment_id } = body

    if (!assessment_id) {
      return NextResponse.json({ success: false, error: 'Assessment ID is required' }, { status: 400 })
    }

    const assessmentId = Number(assessment_id)
    const studentId = user.id

    // 2. Student mock test assignment verification
    if (user.role === 'student') {
      const { assigned, status } = await checkMockTestAssignment(studentId, assessmentId)
      if (!assigned) {
        await logAudit({
          actorId: user.id,
          actorRole: user.role,
          action: 'UNAUTHORIZED_EXAM_START_ATTEMPT',
          affectedStudentId: user.id,
          targetId: assessmentId,
          targetType: 'assessment',
          details: { assignmentStatus: status },
          ipAddress: req.headers.get('x-forwarded-for') || null,
          userAgent: req.headers.get('user-agent') || null,
        })

        return NextResponse.json(
          {
            success: false,
            error:
              status === 'revoked'
                ? 'Your assignment to this mock test was revoked.'
                : 'Forbidden: You do not have an active assignment for this mock test.',
            code: 'NOT_ASSIGNED',
          },
          { status: 403 }
        )
      }
    }

    // 3. Verify mock test exists and is published
    const [[assessment]]: any = await db.query(
      `SELECT id, total_questions, total_marks, duration_minutes, status, start_at, end_at, max_attempts 
       FROM assessments 
       WHERE id = ?`,
      [assessmentId]
    )

    if (!assessment || assessment.status !== 'published') {
      return NextResponse.json({ success: false, error: 'Assessment is not available or unpublished' }, { status: 404 })
    }

    // 4. Scheduling checks
    const now = new Date()
    if (assessment.start_at && new Date(assessment.start_at) > now) {
      return NextResponse.json({ success: false, error: 'Assessment has not started yet' }, { status: 403 })
    }
    if (assessment.end_at && new Date(assessment.end_at) < now) {
      return NextResponse.json({ success: false, error: 'Assessment has already closed' }, { status: 403 })
    }

    // 5. Determine attempt number
    const [[attemptCountRow]]: any = await db.query(
      `SELECT COUNT(*) as cnt FROM assessment_attempts WHERE student_id = ? AND assessment_id = ?`,
      [studentId, assessmentId]
    )
    const attempt_number = Number(attemptCountRow?.cnt || 0) + 1

    if (assessment.max_attempts && attempt_number > assessment.max_attempts) {
      return NextResponse.json(
        { success: false, error: `Maximum attempt limit (${assessment.max_attempts}) reached for this test.` },
        { status: 403 }
      )
    }

    // 6. Insert into assessment_attempts
    const [attRes]: any = await db.query(
      `INSERT INTO assessment_attempts 
       (student_id, assessment_id, attempt_number, status, start_time, total_questions, total_marks, created_at)
       VALUES (?, ?, ?, 'in_progress', NOW(), ?, ?, NOW())`,
      [studentId, assessmentId, attempt_number, assessment.total_questions || 0, assessment.total_marks || 0]
    )

    const attemptId = attRes.insertId

    // 7. Snapshot questions into assessment_attempt_questions
    const [aqList]: any = await db.query(
      `SELECT aq.question_id, aq.order_index, aq.marks, aq.negative_marks, q.question_text
       FROM assessment_questions aq
       JOIN questions q ON aq.question_id = q.id
       WHERE aq.assessment_id = ?
       ORDER BY aq.order_index ASC`,
      [assessmentId]
    )

    const questionMap: Record<number, number> = {}

    for (const item of aqList) {
      const snapshot = JSON.stringify({ question_id: item.question_id, text: item.question_text })
      const [snapRes]: any = await db.query(
        `INSERT INTO assessment_attempt_questions 
         (attempt_id, question_id, question_version, order_index, marks, negative_marks, question_snapshot, created_at)
         VALUES (?, ?, 1, ?, ?, ?, ?, NOW())`,
        [attemptId, item.question_id, item.order_index, item.marks, item.negative_marks, snapshot]
      )
      questionMap[item.question_id] = snapRes.insertId
    }

    await logAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'EXAM_ATTEMPT_STARTED',
      affectedStudentId: studentId,
      targetId: attemptId,
      targetType: 'assessment_attempt',
      details: { assessmentId, attempt_number },
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    })

    return NextResponse.json({
      success: true,
      attemptId,
      questionMap,
      durationMinutes: assessment.duration_minutes,
      message: 'Attempt initialized successfully',
    })
  } catch (error: any) {
    console.error('Error starting attempt:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
