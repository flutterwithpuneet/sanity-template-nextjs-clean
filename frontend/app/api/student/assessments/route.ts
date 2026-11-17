import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const subjectId = searchParams.get('subject_id')
    const type = searchParams.get('type')
    const difficulty = searchParams.get('difficulty')

    let query = `
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.description,
        a.assessment_type,
        a.duration_minutes,
        a.total_questions,
        a.total_marks,
        a.passing_percentage,
        COALESCE(a.difficulty_level, 'medium') as difficulty_level,
        a.subject_id,
        s.name as subject_name,
        s.code as subject_code,
        e.name as exam_name
      FROM assessments a
      LEFT JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN exams e ON a.exam_id = e.id
      WHERE a.status = 'published'
    `
    const params: any[] = []

    if (subjectId && subjectId !== 'all') {
      if (subjectId === 'full_mock') {
        query += ` AND a.subject_id IS NULL`
      } else {
        query += ` AND a.subject_id = ?`
        params.push(subjectId)
      }
    }

    if (type && type !== 'all') {
      query += ` AND a.assessment_type = ?`
      params.push(type)
    }

    if (difficulty && difficulty !== 'all') {
      query += ` AND LOWER(a.difficulty_level) = LOWER(?)`
      params.push(difficulty)
    }

    query += ` ORDER BY a.id ASC`

    const [assessments]: any = await db.query(query, params)

    return NextResponse.json({ success: true, assessments })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
