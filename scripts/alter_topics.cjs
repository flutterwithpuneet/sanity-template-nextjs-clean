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
  
  await client.query(`
    ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
    ALTER TABLE topics ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
  `);
  console.log("Columns added successfully to topics!");

  // Let's check a sample of topics
  const res = await client.query(`SELECT id, name, is_completed, status FROM topics LIMIT 5;`);
  console.log("Sample rows:", res.rows);

  client.release();
  await pool.end();
}
main().catch(console.error);
