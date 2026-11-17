import { client } from './db.mjs'

async function run() {
  await client.connect()
  console.log('Connected to DB to add bilingual columns...')

  await client.query(`
    ALTER TABLE questions 
    ADD COLUMN IF NOT EXISTS question_text_hi TEXT,
    ADD COLUMN IF NOT EXISTS explanation_hi TEXT;
  `)
  console.log('Added question_text_hi, explanation_hi to questions')

  await client.query(`
    ALTER TABLE question_options 
    ADD COLUMN IF NOT EXISTS option_text_hi TEXT;
  `)
  console.log('Added option_text_hi to question_options')

  const qCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'questions'")
  console.log('Updated questions columns:', qCols.rows.map(r => r.column_name))

  const optCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'question_options'")
  console.log('Updated question_options columns:', optCols.rows.map(r => r.column_name))

  await client.end()
}

run().catch(console.error)
