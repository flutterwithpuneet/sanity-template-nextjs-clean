import { query } from './db.mjs'

async function run() {
  const cols = await query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'topics' ORDER BY ordinal_position")
  console.log('topics cols:', cols.rows)

  const top408 = await query("SELECT * FROM topics WHERE id = 408")
  console.log('topic 408:', top408.rows)
  process.exit(0)
}

run().catch(console.error)
