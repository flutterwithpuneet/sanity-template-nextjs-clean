const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '1m3ur6d1ukkdkt94.gateway01.us-east-1.prod.aws.pg.tidbcloud.com',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || '1m3ur6d1ukkdkt94.postgres',
  password: process.env.DB_PASSWORD || 'OI9j3fqXI41kT2ciiCLd9fm1Du2dHKwR',
  database: process.env.DB_NAME || 'exam',
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  const resCols = await client.query(`
    SELECT column_name, data_type, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'topics'
    ORDER BY ordinal_position;
  `);
  console.log("TOPICS COLUMNS:");
  resCols.rows.forEach(r => console.log(r.column_name, '|', r.data_type, '|', r.column_default));

  const resStatus = await client.query(`SELECT status, count(*) FROM topics GROUP BY status;`);
  console.log("STATUS COUNTS:", resStatus.rows);

  // Check if topic_schedules has completed topic statuses or if topics table has completed_at
  const resSchedules = await client.query(`SELECT status, count(*) FROM topic_schedules GROUP BY status;`);
  console.log("SCHEDULES STATUS COUNTS:", resSchedules.rows);

  client.release();
  await pool.end();
}
main().catch(console.error);
