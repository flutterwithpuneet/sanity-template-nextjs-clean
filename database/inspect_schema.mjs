import { client } from './db.mjs'

async function run() {
  await client.connect()
  const qCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'questions'")
  console.log('Q_COLS:', qCols.rows)
  const optCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'question_options'")
  console.log('OPT_COLS:', optCols.rows)
  await client.end()
}
run().catch(console.error)
