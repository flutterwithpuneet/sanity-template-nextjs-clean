import { client } from './db.mjs'

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
