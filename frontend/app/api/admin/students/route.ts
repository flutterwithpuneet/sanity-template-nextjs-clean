import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireAdmin, hashPassword, revokeAllUserSessions, logAudit } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth.response) return auth.response

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const includeDeleted = searchParams.get('include_deleted') === 'true'

    let whereClauses: string[] = []
    let params: any[] = []

    if (!includeDeleted) {
      whereClauses.push('(s.deleted_at IS NULL AND s.account_status != "deleted")')
    }

    if (status && status !== 'all') {
      whereClauses.push('s.account_status = ?')
      params.push(status)
    }
    if (search && search.trim()) {
      whereClauses.push('(s.full_name LIKE ? OR s.email LIKE ? OR s.username LIKE ?)')
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const [students]: any = await db.query(
      `SELECT 
        s.id,
        s.full_name,
        s.username,
        s.email,
        s.mobile,
        s.account_status,
        s.state,
        s.district,
        s.last_login_at,
        s.created_at,
        s.deleted_at,
        COUNT(DISTINCT mta.id) as assigned_tests_count,
        COUNT(DISTINCT att.id) as attempts_count,
        AVG(att.percentage) as avg_score,
        AVG(att.accuracy) as avg_accuracy,
        MAX(att.submission_time) as last_attempt_at
      FROM students s
      LEFT JOIN mock_test_assignments mta ON s.id = mta.student_id AND mta.assignment_status = 'assigned'
      LEFT JOIN assessment_attempts att ON s.id = att.student_id
      ${whereSql}
      GROUP BY s.id, s.full_name, s.username, s.email, s.mobile, s.account_status, s.state, s.district, s.last_login_at, s.created_at, s.deleted_at
      ORDER BY s.id DESC`,
      params
    )

    return NextResponse.json({ success: true, students })
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
      full_name,
      email,
      username,
      password = "asdfghjkl;'",
      mobile,
      state = 'Rajasthan',
      district = 'Jaipur',
      account_status = 'active',
    } = body

    if (!full_name || !email) {
      return NextResponse.json({ success: false, error: 'Full name and email are required' }, { status: 400 })
    }

    const uname = (username || email.split('@')[0] + Math.floor(Math.random() * 1000)).trim().toLowerCase()
    const { hash, salt } = hashPassword(password)

    const [result]: any = await db.query(
      `INSERT INTO students (full_name, username, email, password_hash, password_salt, mobile, state, district, account_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [full_name, uname, email.trim().toLowerCase(), hash, salt, mobile || null, state, district, account_status]
    )

    const newStudentId = result.insertId

    await logAudit({
      actorId: auth.user.id,
      actorRole: 'admin',
      action: 'STUDENT_CREATED',
      affectedStudentId: newStudentId,
      targetId: newStudentId,
      targetType: 'student',
      details: { full_name, email, username: uname, account_status },
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    })

    return NextResponse.json({
      success: true,
      studentId: newStudentId,
      message: 'Student registered successfully',
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    const { id, full_name, mobile, state, district, account_status, password } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Student ID is required' }, { status: 400 })
    }

    let passwordUpdates = ''
    const params: any[] = [full_name, mobile, state, district, account_status]

    if (password && password.trim()) {
      const { hash, salt } = hashPassword(password.trim())
      passwordUpdates = `, password_hash = ?, password_salt = ?`
      params.push(hash, salt)
    }

    params.push(id)

    await db.query(
      `UPDATE students 
       SET full_name = COALESCE(?, full_name),
           mobile = COALESCE(?, mobile),
           state = COALESCE(?, state),
           district = COALESCE(?, district),
           account_status = COALESCE(?, account_status)
           ${passwordUpdates},
           updated_at = NOW()
       WHERE id = ?`,
      params
    )

    // If account was deactivated or suspended, revoke all active sessions immediately
    if (account_status && account_status !== 'active') {
      await revokeAllUserSessions(Number(id), 'student')
    }

    await logAudit({
      actorId: auth.user.id,
      actorRole: 'admin',
      action: 'STUDENT_UPDATED',
      affectedStudentId: Number(id),
      targetId: Number(id),
      targetType: 'student',
      details: { full_name, account_status, passwordChanged: Boolean(password) },
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, message: 'Student profile updated successfully' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * DELETE: Soft deletes the student and immediately revokes all authentication sessions & mock test assignments
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth.response) return auth.response

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Student ID is required' }, { status: 400 })
    }

    const studentId = Number(id)

    // 1. Soft delete student and update status to deleted
    await db.query(
      `UPDATE students 
       SET account_status = 'deleted', deleted_at = NOW(), updated_at = NOW() 
       WHERE id = ?`,
      [studentId]
    )

    // 2. Immediately revoke all active authentication sessions
    await revokeAllUserSessions(studentId, 'student')

    // 3. Immediately revoke all mock test assignments
    await db.query(
      `UPDATE mock_test_assignments 
       SET assignment_status = 'revoked', revoked_at = NOW(), updated_at = NOW() 
       WHERE student_id = ? AND assignment_status = 'assigned'`,
      [studentId]
    )

    // 4. Log deletion in audit logs
    await logAudit({
      actorId: auth.user.id,
      actorRole: 'admin',
      action: 'STUDENT_DELETED',
      affectedStudentId: studentId,
      targetId: studentId,
      targetType: 'student',
      details: { reason: 'Deleted by administrator', immediateRevocation: true },
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    })

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully. All sessions and test access revoked immediately.',
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
