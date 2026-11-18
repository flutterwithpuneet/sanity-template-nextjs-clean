import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireAdmin, logAudit } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Student ID is required' }, { status: 400 })
    }

    const studentId = Number(id)

    await db.query(
      `UPDATE students 
       SET account_status = 'active', 
           deleted_at = NULL, 
           locked_until = NULL, 
           failed_login_attempts = 0, 
           updated_at = NOW() 
       WHERE id = ?`,
      [studentId]
    )

    await logAudit({
      actorId: auth.user.id,
      actorRole: 'admin',
      action: 'STUDENT_REACTIVATED',
      affectedStudentId: studentId,
      targetId: studentId,
      targetType: 'student',
      details: { reactivated: true },
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    })

    return NextResponse.json({
      success: true,
      message: 'Student account reactivated successfully.',
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
