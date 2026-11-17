import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const [subjects]: any = await db.query(`
      SELECT 
        s.id,
        s.name,
        s.code,
        s.description,
        s.icon,
        COUNT(DISTINCT a.id) as tests_count,
        COUNT(DISTINCT CASE WHEN a.difficulty_level = 'low' THEN a.id END) as low_tests_count,
        COUNT(DISTINCT CASE WHEN a.difficulty_level = 'medium' THEN a.id END) as medium_tests_count,
        COUNT(DISTINCT CASE WHEN a.difficulty_level = 'high' THEN a.id END) as high_tests_count
      FROM subjects s
      LEFT JOIN assessments a ON s.id = a.subject_id AND a.status = 'published'
      WHERE s.status = 'active'
      GROUP BY s.id, s.name, s.code, s.description, s.icon
      ORDER BY s.id ASC
    `)

    // Overall stats for all published tests
    const [[overall]]: any = await db.query(`
      SELECT 
        COUNT(id) as total_tests,
        COUNT(CASE WHEN difficulty_level = 'low' THEN id END) as low_tests,
        COUNT(CASE WHEN difficulty_level = 'medium' THEN id END) as medium_tests,
        COUNT(CASE WHEN difficulty_level = 'high' THEN id END) as high_tests
      FROM assessments
      WHERE status = 'published'
    `)

    return NextResponse.json({ success: true, subjects, overall })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
