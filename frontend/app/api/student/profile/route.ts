import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { authenticateUser, checkAccountStatus } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateUser(req)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      )
    }

    const { active, reason } = await checkAccountStatus(user.id, user.role)
    if (!active) {
      return NextResponse.json(
        { success: false, error: reason || 'Account is inactive or deleted', code: 'ACCOUNT_INACTIVE' },
        { status: 403 }
      )
    }

    if (user.role === 'admin') {
      const [[admin]]: any = await db.query(
        `SELECT id, full_name, email, username, status, last_login_at, created_at 
         FROM admin_users 
         WHERE id = ?`,
        [user.id]
      )
      return NextResponse.json({
        success: true,
        student: { ...admin, role: 'admin' },
      })
    }

    const [[student]]: any = await db.query(
      `SELECT id, full_name, email, username, mobile, state, district, account_status, last_login_at, created_at 
       FROM students 
       WHERE id = ? AND deleted_at IS NULL`,
      [user.id]
    )

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 })
    }

    // Return the student's assigned test count
    const [[assignedCountRow]]: any = await db.query(
      `SELECT COUNT(*) as cnt 
       FROM mock_test_assignments 
       WHERE student_id = ? AND assignment_status = 'assigned' AND revoked_at IS NULL`,
      [user.id]
    )

    return NextResponse.json({
      success: true,
      student: {
        ...student,
        role: 'student',
        assignedTestsCount: Number(assignedCountRow?.cnt || 0),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
