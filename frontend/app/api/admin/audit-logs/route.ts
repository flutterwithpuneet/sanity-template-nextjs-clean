import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth.response) return auth.response

  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)

    let whereClause = ''
    const params: any[] = []

    if (action && action !== 'all') {
      whereClause = 'WHERE action = ?'
      params.push(action)
    }

    params.push(limit)

    const [logs]: any = await db.query(
      `SELECT 
        l.id,
        l.actor_id,
        l.actor_role,
        l.action,
        l.affected_student_id,
        l.target_id,
        l.target_type,
        l.details,
        l.ip_address,
        l.created_at,
        CASE 
          WHEN l.actor_role = 'admin' THEN (SELECT full_name FROM admin_users WHERE id = l.actor_id)
          WHEN l.actor_role = 'student' THEN (SELECT full_name FROM students WHERE id = l.actor_id)
          ELSE 'System'
        END as actor_name,
        (SELECT full_name FROM students WHERE id = l.affected_student_id) as affected_student_name
      FROM audit_logs l
      ${whereClause}
      ORDER BY l.id DESC
      LIMIT ?`,
      params
    )

    return NextResponse.json({ success: true, logs })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
