import crypto from 'crypto'
import { client } from './db.mjs'

async function run() {
  await client.connect()
  console.log('Connected to DB...')

  // 1. Add username & password columns to admin_users if needed
  await client.query(`
    ALTER TABLE admin_users 
    ADD COLUMN IF NOT EXISTS username VARCHAR(100),
    ADD COLUMN IF NOT EXISTS password_salt VARCHAR(100)
  `)

  // 2. Hash password "asdfghjkl;'"
  const password = "asdfghjkl;'"
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')

  // Check if puneet_a1 already exists
  const existing = await client.query('SELECT id FROM admin_users WHERE username = $1 OR email = $2', ['puneet_a1', 'puneet_a1@examforge.in'])
  if (existing.rows.length > 0) {
    await client.query(`
      UPDATE admin_users 
      SET username = $1, password_hash = $2, password_salt = $3, status = 'active', updated_at = NOW()
      WHERE id = $4
    `, ['puneet_a1', hash, salt, existing.rows[0].id])
    console.log('Updated existing admin_user for puneet_a1')
  } else {
    await client.query(`
      INSERT INTO admin_users (full_name, username, email, password_hash, password_salt, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'active', NOW())
    `, ['Puneet Sharma', 'puneet_a1', 'puneet_a1@examforge.in', hash, salt])
    console.log('Inserted new admin_user for puneet_a1')
  }

  // 3. Also insert/update students table for candidate sessions
  const existingStudent = await client.query('SELECT id FROM students WHERE username = $1', ['puneet_a1'])
  if (existingStudent.rows.length === 0) {
    await client.query(`
      INSERT INTO students (full_name, username, email, mobile, state, district, account_status, created_at)
      VALUES ($1, $2, $3, '9876543210', 'Rajasthan', 'Jaipur', 'active', NOW())
    `, ['Puneet Sharma', 'puneet_a1', 'puneet_a1@examforge.in'])
    console.log('Inserted student record for puneet_a1')
  } else {
    console.log('Student record already exists for puneet_a1')
  }

  const res = await client.query('SELECT id, full_name, username, email, status FROM admin_users')
  console.log('ALL ADMIN_USERS:', res.rows)

  await client.end()
}
run().catch(console.error)
