import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireAdmin, logAudit } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth.response) return auth.response

  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('student_id')
    const mockTestId = searchParams.get('mock_test_id')
    const status = searchParams.get('status')

    let whereClauses: string[] = []
    let params: any[] = []

    if (studentId) {
      whereClauses.push('mta.student_id = ?')
      params.push(studentId)
    }
    if (mockTestId) {
      whereClauses.push('mta.mock_test_id = ?')
      params.push(mockTestId)
    }
    if (status && status !== 'all') {
      whereClauses.push('mta.assignment_status = ?')
      params.push(status)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const [assignments]: any = await db.query(
      `SELECT 
        mta.id,
        mta.student_id,
        mta.mock_test_id,
        mta.assignment_status,
        mta.assigned_at,
        mta.revoked_at,
        s.full_name as student_name,
        s.email as student_email,
        s.username as student_username,
        s.account_status as student_status,
        a.title as mock_test_title,
        a.slug as mock_test_slug,
        a.assessment_type,
        a.duration_minutes,
        a.total_questions,
        a.total_marks,
        sub.name as subject_name,
        admin.full_name as assigned_by_name,
        (
          SELECT att.status 
          FROM assessment_attempts att 
          WHERE att.student_id = mta.student_id AND att.assessment_id = mta.mock_test_id 
          ORDER BY att.id DESC LIMIT 1
        ) as latest_attempt_status,
        (
          SELECT att.percentage 
          FROM assessment_attempts att 
          WHERE att.student_id = mta.student_id AND att.assessment_id = mta.mock_test_id AND att.status = 'submitted'
          ORDER BY att.id DESC LIMIT 1
        ) as latest_score
      FROM mock_test_assignments mta
      JOIN students s ON mta.student_id = s.id
      JOIN assessments a ON mta.mock_test_id = a.id
      LEFT JOIN subjects sub ON a.subject_id = sub.id
      LEFT JOIN admin_users admin ON mta.assigned_by = admin.id
      ${whereSql}
      ORDER BY mta.id DESC`,
      params
    )

    return NextResponse.json({ success: true, assignments })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    const { student_ids, mock_test_ids } = body

    const stdIds: number[] = Array.isArray(student_ids) ? student_ids.map(Number) : []
    const testIds: number[] = Array.isArray(mock_test_ids) ? mock_test_ids.map(Number) : []

    if (stdIds.length === 0 || testIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one student and one mock test must be selected.' },
        { status: 400 }
      )
    }

    let assignedCount = 0

    for (const studentId of stdIds) {
      for (const testId of testIds) {
        await db.query(
          `INSERT INTO mock_test_assignments (student_id, mock_test_id, assigned_by, assignment_status, assigned_at, revoked_at, updated_at)
           VALUES (?, ?, ?, 'assigned', NOW(), NULL, NOW())
           ON CONFLICT (student_id, mock_test_id) DO UPDATE SET 
             assignment_status = 'assigned', 
             revoked_at = NULL, 
             assigned_by = EXCLUDED.assigned_by, 
             updated_at = NOW()`,
          [studentId, testId, auth.user.id]
        )
        assignedCount++

        await logAudit({
          actorId: auth.user.id,
          actorRole: 'admin',
          action: 'MOCK_TEST_ASSIGNED',
          affectedStudentId: studentId,
          targetId: testId,
          targetType: 'assessment',
          details: { studentId, testId, assignedBy: auth.user.id },
          ipAddress: req.headers.get('x-forwarded-for') || null,
          userAgent: req.headers.get('user-agent') || null,
        })
      }
    }

    return NextResponse.json({
      success: true,
      assignedCount,
      message: `Successfully assigned ${testIds.length} test(s) to ${stdIds.length} student(s).`,
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
    const { id, assignment_status } = body

    if (!id || !assignment_status) {
      return NextResponse.json({ success: false, error: 'Assignment ID and status are required' }, { status: 400 })
    }

    const revokedAt = assignment_status === 'revoked' ? new Date() : null

    await db.query(
      `UPDATE mock_test_assignments 
       SET assignment_status = ?, revoked_at = ?, updated_at = NOW() 
       WHERE id = ?`,
      [assignment_status, revokedAt, id]
    )

    await logAudit({
      actorId: auth.user.id,
      actorRole: 'admin',
      action: assignment_status === 'revoked' ? 'MOCK_TEST_REVOKED' : 'MOCK_TEST_ASSIGNED',
      targetId: Number(id),
      targetType: 'mock_test_assignment',
      details: { newStatus: assignment_status },
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    })

    return NextResponse.json({ success: true, message: `Assignment status updated to ${assignment_status}` })
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
    const studentId = searchParams.get('student_id')
    const mockTestId = searchParams.get('mock_test_id')

    if (id) {
      await db.query(
        `UPDATE mock_test_assignments 
         SET assignment_status = 'revoked', revoked_at = NOW(), updated_at = NOW() 
         WHERE id = ?`,
        [id]
      )

      await logAudit({
        actorId: auth.user.id,
        actorRole: 'admin',
        action: 'MOCK_TEST_REVOKED',
        targetId: Number(id),
        targetType: 'mock_test_assignment',
        ipAddress: req.headers.get('x-forwarded-for') || null,
        userAgent: req.headers.get('user-agent') || null,
      })

      return NextResponse.json({ success: true, message: 'Mock test assignment revoked successfully' })
    } else if (studentId && mockTestId) {
      await db.query(
        `UPDATE mock_test_assignments 
         SET assignment_status = 'revoked', revoked_at = NOW(), updated_at = NOW() 
         WHERE student_id = ? AND mock_test_id = ?`,
        [studentId, mockTestId]
      )

      await logAudit({
        actorId: auth.user.id,
        actorRole: 'admin',
        action: 'MOCK_TEST_REVOKED',
        affectedStudentId: Number(studentId),
        targetId: Number(mockTestId),
        targetType: 'assessment',
        ipAddress: req.headers.get('x-forwarded-for') || null,
        userAgent: req.headers.get('user-agent') || null,
      })

      return NextResponse.json({ success: true, message: 'Mock test assignment revoked successfully' })
    } else {
      return NextResponse.json(
        { success: false, error: 'Provide either assignment ID or both student_id and mock_test_id' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
