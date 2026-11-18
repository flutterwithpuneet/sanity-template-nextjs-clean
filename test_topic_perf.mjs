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
  const res = await client.query(`
    SELECT 
      t.name as topic_name,
      sub.name as subject_name,
      COUNT(aa.id) as total_attempts,
      COALESCE(SUM(CASE WHEN aa.is_correct = 1 THEN 1 ELSE 0 END), 0) as correct_count,
      ROUND((COALESCE(SUM(CASE WHEN aa.is_correct = 1 THEN 1 ELSE 0 END), 0)::numeric / NULLIF(COUNT(aa.id), 0)::numeric) * 100) as accuracy_pct,
      ROUND(AVG(aa.time_spent_seconds)) as avg_seconds
    FROM attempt_answers aa
    JOIN assessment_attempt_questions aaq ON aa.attempt_question_id = aaq.id
    JOIN questions q ON aaq.question_id = q.id
    LEFT JOIN topics t ON q.topic_id = t.id
    LEFT JOIN subjects sub ON q.subject_id = sub.id
    GROUP BY t.id, t.name, sub.name
    ORDER BY total_attempts DESC
    LIMIT 8
  `);
  console.log('Topic perf query ok:', res.rows);
} catch (e) {
  console.error('Topic perf query err:', e.message);
}
await client.end();
