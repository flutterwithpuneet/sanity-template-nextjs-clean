import pg from 'pg'
const { Client } = pg

const client = new Client({
  host: '1m3ur6d1ukkdkt94.gateway01.us-east-1.prod.aws.pg.tidbcloud.com',
  port: 5432,
  user: '1m3ur6d1ukkdkt94.postgres',
  password: 'OI9j3fqXI41kT2ciiCLd9fm1Du2dHKwR',
  database: 'exam',
  ssl: { rejectUnauthorized: false }
})

async function run() {
  await client.connect()
  console.log('Connected to DB...')

  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `)
  console.log('TABLES:', tables.rows.map(r => r.table_name))

  const subjects = await client.query('SELECT id, name FROM subjects ORDER BY id ASC')
  console.log('CURRENT SUBJECTS:', subjects.rows)

  const qCount = await client.query('SELECT count(*) FROM questions')
  console.log('QUESTIONS COUNT:', qCount.rows[0])

  await client.end()
}

run().catch(console.error)
