import { client } from './db.mjs'

const ALLOWED_SUBJECT_NAMES = [
  'Computer & Information Technology',
  'Reasoning & Mental Ability',
  'Mathematics',
  'General Knowledge (GK)'
]

async function clean() {
  await client.connect()
  console.log('Connected to DB for cleanup...')

  // 1. Delete ALL question data from all related tables
  console.log('Deleting all question relations and answers...')
  await client.query('DELETE FROM attempt_answers;')
  await client.query('DELETE FROM attempt_results;')
  await client.query('DELETE FROM assessment_attempt_questions;')
  await client.query('DELETE FROM student_bookmarks;')
  await client.query('DELETE FROM student_question_reports;')
  await client.query('DELETE FROM question_tag_map;')
  await client.query('DELETE FROM question_tags;')
  await client.query('DELETE FROM question_options;')
  await client.query('DELETE FROM assessment_questions;')
  await client.query('DELETE FROM questions;')
  console.log('Successfully deleted all MCQs and questions!')

  // Reset total_questions to 0 on assessments
  await client.query('UPDATE assessments SET total_questions = 0;')

  // 2. Find IDs of allowed subjects
  const allowedRes = await client.query(
    'SELECT id, name FROM subjects WHERE name = ANY($1)',
    [ALLOWED_SUBJECT_NAMES]
  )
  const allowedIds = allowedRes.rows.map(r => r.id)
  console.log('Allowed Subject IDs:', allowedIds, allowedRes.rows)

  // 3. Delete any topics, exam_subjects, assessments referencing other subjects
  await client.query('DELETE FROM topics WHERE subject_id IS NOT NULL AND NOT (subject_id = ANY($1))', [allowedIds])
  await client.query('DELETE FROM exam_subjects WHERE NOT (subject_id = ANY($1))', [allowedIds])
  await client.query('DELETE FROM assessments WHERE subject_id IS NOT NULL AND NOT (subject_id = ANY($1))', [allowedIds])

  // 4. Delete all other subjects
  const deletedSubs = await client.query(
    'DELETE FROM subjects WHERE NOT (id = ANY($1)) RETURNING id, name',
    [allowedIds]
  )
  console.log('Deleted Other Subjects:', deletedSubs.rows)

  // 5. Verify final remaining subjects
  const finalSubjects = await client.query('SELECT id, name FROM subjects ORDER BY id ASC')
  console.log('FINAL REMAINING SUBJECTS:', finalSubjects.rows)

  // 6. Verify questions count
  const finalQCount = await client.query('SELECT count(*) FROM questions')
  console.log('FINAL QUESTIONS COUNT:', finalQCount.rows[0])

  await client.end()
}

clean().catch(console.error)
