import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireAdmin, hashPassword, revokeAllUserSessions, logAudit } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth.response) return auth.response

  try {
    const [admins]: any = await db.query(`
      SELECT 
        u.id,
        u.full_name,
        u.username,
        u.email,
        u.status,
        u.last_login_at,
        u.created_at,
        r.id as role_id,
        r.name as role_name,
        r.description as role_description
      FROM admin_users u
      LEFT JOIN admin_role_map arm ON u.id = arm.admin_id
      LEFT JOIN roles r ON arm.role_id = r.id
      WHERE u.deleted_at IS NULL
      ORDER BY u.id ASC
    `)

    const [roles]: any = await db.query(`SELECT id, name, description FROM roles ORDER BY id ASC`)

    return NextResponse.json({ success: true, admins, roles })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    const { full_name, email, username, password = "asdfghjkl;'", role_id = 2, status = 'active' } = body

    if (!full_name || !email) {
      return NextResponse.json({ success: false, error: 'Full name and email are required' }, { status: 400 })
    }

    const uname = (username || email.split('@')[0]).trim().toLowerCase()
    const { hash, salt } = hashPassword(password)

    const [result]: any = await db.query(
      `INSERT INTO admin_users (full_name, username, email, password_hash, password_salt, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [full_name, uname, email.trim().toLowerCase(), hash, salt, status]
    )

    const adminId = result.insertId

    if (role_id) {
      await db.query(`INSERT INTO admin_role_map (admin_id, role_id) VALUES (?, ?)`, [adminId, role_id])
    }

    await logAudit({
      actorId: auth.user.id,
      actorRole: 'admin',
      action: 'ADMIN_CREATED',
      targetId: adminId,
      targetType: 'admin_user',
      details: { full_name, email, role_id },
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, adminId, message: 'Admin user added successfully' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    const { id, status, role_id, password } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Admin ID is required' }, { status: 400 })
    }

    if (status) {
      await db.query(`UPDATE admin_users SET status = ?, updated_at = NOW() WHERE id = ?`, [status, id])
      if (status !== 'active') {
        await revokeAllUserSessions(Number(id), 'admin')
      }
    }

    if (password && password.trim()) {
      const { hash, salt } = hashPassword(password.trim())
      await db.query(`UPDATE admin_users SET password_hash = ?, password_salt = ?, updated_at = NOW() WHERE id = ?`, [hash, salt, id])
    }

    if (role_id) {
      await db.query(`DELETE FROM admin_role_map WHERE admin_id = ?`, [id])
      await db.query(`INSERT INTO admin_role_map (admin_id, role_id) VALUES (?, ?)`, [id, role_id])
    }

    await logAudit({
      actorId: auth.user.id,
      actorRole: 'admin',
      action: 'ADMIN_UPDATED',
      targetId: Number(id),
      targetType: 'admin_user',
      details: { status, role_id },
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, message: 'Admin user updated successfully' })
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
      return NextResponse.json({ success: false, error: 'Admin ID is required' }, { status: 400 })
    }

    const adminId = Number(id)
    if (adminId === auth.user.id) {
      return NextResponse.json({ success: false, error: 'Cannot delete your own admin account' }, { status: 400 })
    }

    await db.query(`UPDATE admin_users SET status = 'inactive', deleted_at = NOW(), updated_at = NOW() WHERE id = ?`, [adminId])
    await revokeAllUserSessions(adminId, 'admin')

    await logAudit({
      actorId: auth.user.id,
      actorRole: 'admin',
      action: 'ADMIN_DELETED',
      targetId: adminId,
      targetType: 'admin_user',
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, message: 'Admin user removed successfully' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
