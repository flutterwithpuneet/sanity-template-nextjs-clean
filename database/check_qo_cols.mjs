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
  const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'question_options'")
  console.log('QUESTION_OPTIONS COLS:', cols.rows)
  await client.end()
}
run().catch(console.error)
