import pg from 'pg';
const client = new pg.Client({
  host: process.env.DB_HOST || '1m3ur6d1ukkdkt94.gateway01.us-east-1.prod.aws.pg.tidbcloud.com',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || '1m3ur6d1ukkdkt94.postgres',
  password: process.env.DB_PASSWORD || 'OI9j3fqXI41kT2ciiCLd9fm1Du2dHKwR',
  database: process.env.DB_NAME || 'exam',
  ssl: { rejectUnauthorized: false }
});
await client.connect();
try {
  const res2 = await client.query(`
    SELECT 
      aa.id as answer_id,
      aa.selected_option_key,
      aa.is_correct,
      aa.marks_awarded,
      aa.time_spent_seconds,
      aa.answer_status,
      q.id as question_id,
      q.question_text,
      q.question_text_hi,
      q.explanation,
      q.explanation_hi,
      q.difficulty,
      sub.name as subject_name,
      tp.name as topic_name,
      aaq.order_index,
      aaq.marks as max_marks,
      aaq.negative_marks
    FROM attempt_answers aa
    JOIN assessment_attempt_questions aaq ON aa.attempt_question_id = aaq.id
    JOIN questions q ON aaq.question_id = q.id
    LEFT JOIN subjects sub ON q.subject_id = sub.id
    LEFT JOIN topics tp ON q.topic_id = tp.id
    WHERE aa.attempt_id = $1
    ORDER BY aaq.order_index ASC
  `, [10]);
  console.log('Answers query with alias tp ok, row count:', res2.rows.length);
} catch (e) {
  console.error('Answers query err with tp:', e.message);
}
await client.end();
