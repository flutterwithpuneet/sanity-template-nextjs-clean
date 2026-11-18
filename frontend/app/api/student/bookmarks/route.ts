import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/student/bookmarks
 * Fetches all bookmarked questions for a student, with complete question data,
 * options, explanations, subject, and topic information.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentIdParam = searchParams.get('student_id')
    const subjectIdParam = searchParams.get('subject_id')

    if (!studentIdParam) {
      return NextResponse.json(
        { success: false, error: 'student_id is required' },
        { status: 400 }
      )
    }

    const studentId = Number(studentIdParam)
    if (isNaN(studentId) || studentId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid student_id' },
        { status: 400 }
      )
    }

    let query = `
      SELECT 
        b.id AS bookmark_id,
        b.student_id,
        b.question_id,
        b.note,
        b.created_at AS bookmarked_at,
        q.question_text,
        q.question_text_hi,
        q.question_type,
        q.difficulty,
        q.explanation,
        q.explanation_hi,
        q.default_marks,
        q.default_negative_marks,
        q.language_code,
        s.id AS subject_id,
        s.name AS subject_name,
        s.code AS subject_code,
        t.id AS topic_id,
        t.name AS topic_name
      FROM student_bookmarks b
      INNER JOIN questions q ON b.question_id = q.id
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN topics t ON q.topic_id = t.id
      WHERE b.student_id = ?
    `
    const params: any[] = [studentId]

    if (subjectIdParam && subjectIdParam !== 'all') {
      query += ` AND q.subject_id = ?`
      params.push(Number(subjectIdParam))
    }

    query += ` ORDER BY b.created_at DESC`

    const [bookmarks]: any = await db.query(query, params)

    if (!bookmarks || bookmarks.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        bookmarks: [],
        question_ids: [],
      })
    }

    // Fetch options for all returned questions
    const questionIds = bookmarks.map((b: any) => b.question_id)
    const placeholders = questionIds.map(() => '?').join(',')
    const [options]: any = await db.query(
      `SELECT id, question_id, option_key, option_text, option_text_hi, is_correct, order_index
       FROM question_options
       WHERE question_id IN (${placeholders})
       ORDER BY question_id ASC, order_index ASC`,
      questionIds
    )

    // Map options to questions
    const optionsByQId: Record<number, any[]> = {}
    for (const opt of options || []) {
      if (!optionsByQId[opt.question_id]) {
        optionsByQId[opt.question_id] = []
      }
      optionsByQId[opt.question_id].push({
        id: opt.id,
        key: opt.option_key,
        text: opt.option_text,
        text_hi: opt.option_text_hi,
        is_correct: opt.is_correct === 1,
      })
    }

    const formattedBookmarks = bookmarks.map((b: any) => ({
      ...b,
      options: optionsByQId[b.question_id] || [],
    }))

    return NextResponse.json({
      success: true,
      count: formattedBookmarks.length,
      bookmarks: formattedBookmarks,
      question_ids: questionIds,
    })
  } catch (error: any) {
    console.error('Error in GET /api/student/bookmarks:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/student/bookmarks
 * Toggle, add, or update notes for a student bookmark.
 * Body: { student_id, question_id, note?, action?: 'toggle' | 'add' | 'remove' }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { student_id, question_id, note = null, action = 'toggle' } = body

    if (!student_id || !question_id) {
      return NextResponse.json(
        { success: false, error: 'student_id and question_id are required' },
        { status: 400 }
      )
    }

    const studentId = Number(student_id)
    const questionId = Number(question_id)

    // Verify question exists
    const [qExists]: any = await db.query(
      `SELECT id FROM questions WHERE id = ? LIMIT 1`,
      [questionId]
    )
    if (!qExists || qExists.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      )
    }

    // Check existing bookmark
    const [existing]: any = await db.query(
      `SELECT id, note FROM student_bookmarks WHERE student_id = ? AND question_id = ? LIMIT 1`,
      [studentId, questionId]
    )
    const isCurrentlyBookmarked = existing && existing.length > 0

    if (action === 'remove' || (action === 'toggle' && isCurrentlyBookmarked)) {
      // Remove bookmark
      await db.query(
        `DELETE FROM student_bookmarks WHERE student_id = ? AND question_id = ?`,
        [studentId, questionId]
      )
      return NextResponse.json({
        success: true,
        is_bookmarked: false,
        message: 'Bookmark removed successfully',
      })
    }

    if (action === 'add' || (action === 'toggle' && !isCurrentlyBookmarked)) {
      // Add or update bookmark
      const [insertRes]: any = await db.query(
        `INSERT INTO student_bookmarks (student_id, question_id, note, created_at)
         VALUES (?, ?, ?, NOW())
         ON CONFLICT (student_id, question_id) DO UPDATE 
         SET note = EXCLUDED.note`,
        [studentId, questionId, note]
      )
      const bookmarkId = insertRes?.insertId || existing?.[0]?.id

      return NextResponse.json({
        success: true,
        is_bookmarked: true,
        bookmark_id: bookmarkId,
        message: 'Question bookmarked successfully',
      })
    }

    return NextResponse.json({
      success: true,
      is_bookmarked: isCurrentlyBookmarked,
    })
  } catch (error: any) {
    console.error('Error in POST /api/student/bookmarks:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/student/bookmarks
 * Removes a bookmark.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    let studentId = searchParams.get('student_id')
    let questionId = searchParams.get('question_id')
    let bookmarkId = searchParams.get('bookmark_id')

    if (!bookmarkId && (!studentId || !questionId)) {
      // Check body
      try {
        const body = await req.json()
        studentId = body.student_id
        questionId = body.question_id
        bookmarkId = body.bookmark_id
      } catch {
        // body optional if searchParams provided
      }
    }

    if (bookmarkId) {
      await db.query(`DELETE FROM student_bookmarks WHERE id = ?`, [Number(bookmarkId)])
      return NextResponse.json({
        success: true,
        is_bookmarked: false,
        message: 'Bookmark deleted',
      })
    }

    if (studentId && questionId) {
      await db.query(
        `DELETE FROM student_bookmarks WHERE student_id = ? AND question_id = ?`,
        [Number(studentId), Number(questionId)]
      )
      return NextResponse.json({
        success: true,
        is_bookmarked: false,
        message: 'Bookmark deleted',
      })
    }

    return NextResponse.json(
      { success: false, error: 'bookmark_id or (student_id and question_id) required' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error in DELETE /api/student/bookmarks:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
