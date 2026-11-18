import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth.response) return auth.response

  try {
    const { searchParams } = new URL(req.url)
    const subjectId = searchParams.get('subject_id')
    const status = searchParams.get('status')

    const whereClauses: string[] = []
    const params: any[] = []

    if (subjectId && subjectId !== 'all') {
      whereClauses.push('ts.subject_id = ?')
      params.push(Number(subjectId))
    }

    if (status && status !== 'all') {
      whereClauses.push('ts.status = ?')
      params.push(status)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const [schedules]: any = await db.query(
      `SELECT 
        ts.id,
        ts.topic_id,
        ts.subject_id,
        ts.title,
        TO_CHAR(ts.start_date, 'YYYY-MM-DD') as start_date,
        TO_CHAR(ts.end_date, 'YYYY-MM-DD') as end_date,
        ts.duration_days,
        ts.target_hours,
        ts.target_questions,
        ts.status,
        ts.color,
        ts.notes,
        ts.completed_at,
        ts.created_at,
        s.name as subject_name,
        s.code as subject_code,
        t.name as topic_name,
        t.level as topic_level,
        t.priority as topic_priority
      FROM topic_schedules ts
      JOIN subjects s ON ts.subject_id = s.id
      JOIN topics t ON ts.topic_id = t.id
      ${whereSql}
      ORDER BY ts.start_date ASC, ts.id ASC`,
      params
    )

    // Compute summary analytics
    const [[statsRow]]: any = await db.query(`
      SELECT 
        COUNT(id) as total_scheduled,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'planned' THEN 1 END) as planned_count,
        COALESCE(SUM(duration_days), 0) as total_planned_days,
        COALESCE(SUM(target_questions), 0) as total_target_questions
      FROM topic_schedules
    `)

    return NextResponse.json({
      success: true,
      schedules,
      stats: {
        total: Number(statsRow?.total_scheduled || 0),
        inProgress: Number(statsRow?.in_progress_count || 0),
        completed: Number(statsRow?.completed_count || 0),
        planned: Number(statsRow?.planned_count || 0),
        totalDays: Number(statsRow?.total_planned_days || 0),
        targetQuestions: Number(statsRow?.total_target_questions || 0),
      },
    })
  } catch (error: any) {
    console.error('Error fetching topic schedules:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    const {
      topic_id,
      subject_id,
      title,
      start_date,
      end_date,
      target_hours = 4.0,
      target_questions = 50,
      status = 'planned',
      color = 'emerald',
      notes = '',
    } = body

    if (!topic_id || !subject_id || !start_date || !end_date) {
      return NextResponse.json(
        { success: false, error: 'Topic, Subject, Start Date and End Date are required' },
        { status: 400 }
      )
    }

    const start = new Date(start_date)
    const end = new Date(end_date)
    if (end < start) {
      return NextResponse.json(
        { success: false, error: 'End date cannot be earlier than start date' },
        { status: 400 }
      )
    }

    // Auto-calculate duration days (inclusive)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const duration_days = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1)

    // Lookup topic name if title is not provided
    let scheduleTitle = title
    if (!scheduleTitle) {
      const [tRows]: any = await db.query('SELECT name FROM topics WHERE id = ?', [topic_id])
      scheduleTitle = tRows[0]?.name || 'Scheduled Topic'
    }

    const [res]: any = await db.query(
      `INSERT INTO topic_schedules (
        topic_id,
        subject_id,
        title,
        start_date,
        end_date,
        duration_days,
        target_hours,
        target_questions,
        status,
        color,
        notes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      RETURNING id`,
      [
        topic_id,
        subject_id,
        scheduleTitle,
        start_date,
        end_date,
        duration_days,
        target_hours,
        target_questions,
        status,
        color,
        notes,
      ]
    )

    return NextResponse.json({
      success: true,
      scheduleId: res.insertId || res[0]?.id,
      message: 'Topic scheduled successfully',
    })
  } catch (error: any) {
    console.error('Error creating topic schedule:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    const {
      id,
      title,
      start_date,
      end_date,
      target_hours,
      target_questions,
      status,
      color,
      notes,
    } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Schedule ID is required' }, { status: 400 })
    }

    let duration_days: number | undefined
    if (start_date && end_date) {
      const start = new Date(start_date)
      const end = new Date(end_date)
      if (end < start) {
        return NextResponse.json(
          { success: false, error: 'End date cannot be earlier than start date' },
          { status: 400 }
        )
      }
      duration_days = Math.max(1, Math.round(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    }

    const completed_at = status === 'completed' ? new Date() : null

    await db.query(
      `UPDATE topic_schedules
       SET 
         title = COALESCE(?, title),
         start_date = COALESCE(?::date, start_date),
         end_date = COALESCE(?::date, end_date),
         duration_days = COALESCE(?, duration_days),
         target_hours = COALESCE(?, target_hours),
         target_questions = COALESCE(?, target_questions),
         status = COALESCE(?, status),
         color = COALESCE(?, color),
         notes = COALESCE(?, notes),
         completed_at = CASE WHEN ? = 'completed' THEN NOW() ELSE NULL END,
         updated_at = NOW()
       WHERE id = ?`,
      [
        title || null,
        start_date || null,
        end_date || null,
        duration_days || null,
        target_hours ?? null,
        target_questions ?? null,
        status || null,
        color || null,
        notes ?? null,
        status || null,
        id,
      ]
    )

    return NextResponse.json({ success: true, message: 'Schedule updated successfully' })
  } catch (error: any) {
    console.error('Error updating topic schedule:', error)
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
      return NextResponse.json({ success: false, error: 'Schedule ID is required' }, { status: 400 })
    }

    await db.query('DELETE FROM topic_schedules WHERE id = ?', [id])
    return NextResponse.json({ success: true, message: 'Schedule removed successfully' })
  } catch (error: any) {
    console.error('Error deleting topic schedule:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
