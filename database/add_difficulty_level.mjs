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
  console.log('Adding difficulty_level column if not exists...')
  await client.query(`
    ALTER TABLE assessments 
    ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'medium'
  `)
  console.log('Column added or already exists!')
  
  // Update test 1 difficulty_level to medium
  await client.query(`UPDATE assessments SET difficulty_level = 'medium' WHERE id = 1 AND difficulty_level IS NULL`)
  
  await client.end()
}
run().catch(console.error)
