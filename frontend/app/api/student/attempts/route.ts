import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { authenticateUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateUser(req)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view student attempts', code: 'UNAUTHENTICATED' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const targetStudentId = searchParams.get('student_id')

    // If user is a student, strictly lock to their own ID
    let studentId = user.id
    if (user.role === 'admin' && targetStudentId) {
      studentId = Number(targetStudentId)
    } else if (user.role === 'student') {
      studentId = user.id
    }

    const [attempts]: any = await db.query(
      `SELECT 
        att.id,
        att.student_id,
        att.assessment_id,
        att.status,
        att.total_questions,
        att.attempted_questions,
        att.correct_answers,
        att.incorrect_answers,
        att.unanswered_questions,
        att.obtained_marks,
        att.total_marks,
        att.percentage,
        att.accuracy,
        att.time_taken_seconds,
        att.passed,
        att.submission_time,
        att.created_at,
        s.full_name as student_name,
        s.email as student_email,
        asm.title as assessment_title,
        asm.duration_minutes
      FROM assessment_attempts att
      JOIN students s ON att.student_id = s.id
      JOIN assessments asm ON att.assessment_id = asm.id
      WHERE att.student_id = ? AND att.status = 'submitted'
      ORDER BY att.id DESC`,
      [studentId]
    )

    return NextResponse.json({
      success: true,
      studentId,
      attempts,
    })
  } catch (error: any) {
    console.error('Error fetching student attempts:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
