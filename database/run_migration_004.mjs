import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { client } from './db.mjs'

async function run() {
  await client.connect()
  console.log('Connected to DB...')

  const sql = fs.readFileSync(path.resolve('database/migrations/004_auth_and_assignments.sql'), 'utf-8')
  await client.query(sql)
  console.log('Applied migration 004 successfully!')

  // Ensure default admin user puneet_a1 has a valid password hash and role
  const salt = crypto.randomBytes(16).toString('hex')
  const defaultPassword = "asdfghjkl;'"
  const hash = crypto.pbkdf2Sync(defaultPassword, salt, 10000, 64, 'sha512').toString('hex')

  // Check admin users
  const adminRes = await client.query('SELECT id, username, email FROM admin_users WHERE username = $1 OR email = $2', ['puneet_a1', 'puneet_a1@examforge.in'])
  if (adminRes.rows.length > 0) {
    await client.query(`
      UPDATE admin_users 
      SET password_hash = $1, password_salt = $2, status = 'active', deleted_at = NULL, updated_at = NOW()
      WHERE id = $3
    `, [hash, salt, adminRes.rows[0].id])
    console.log('Updated admin user puneet_a1 with pbkdf2 hash')
  }

  // Ensure student accounts have password hash set so students can log in
  const students = await client.query('SELECT id, username, email FROM students WHERE password_hash IS NULL')
  for (const s of students.rows) {
    const sSalt = crypto.randomBytes(16).toString('hex')
    const sHash = crypto.pbkdf2Sync(defaultPassword, sSalt, 10000, 64, 'sha512').toString('hex')
    await client.query(`
      UPDATE students 
      SET password_hash = $1, password_salt = $2, account_status = 'active', deleted_at = NULL, updated_at = NOW()
      WHERE id = $3
    `, [sHash, sSalt, s.id])
    console.log(`Updated student #${s.id} (${s.username}) with initial password hash`)
  }

  // Check existing assignments
  const assignCount = await client.query('SELECT count(*) FROM mock_test_assignments')
  console.log('Mock test assignments count:', assignCount.rows[0].count)

  // If there are no assignments yet, assign first 2 mock tests to student 1 (puneet) and student 2 (puneet_a1)
  if (Number(assignCount.rows[0].count) === 0) {
    const tests = await client.query('SELECT id FROM assessments WHERE status = $1 LIMIT 2', ['published'])
    const stds = await client.query('SELECT id FROM students WHERE deleted_at IS NULL LIMIT 2')
    for (const std of stds.rows) {
      for (const t of tests.rows) {
        await client.query(`
          INSERT INTO mock_test_assignments (student_id, mock_test_id, assigned_by, assignment_status, assigned_at)
          VALUES ($1, $2, $3, 'assigned', NOW())
          ON CONFLICT (student_id, mock_test_id) DO NOTHING
        `, [std.id, t.id, adminRes.rows[0]?.id || 1])
      }
    }
    console.log('Seeded initial mock test assignments for demonstration')
  }

  await client.end()
  console.log('Migration completed successfully!')
}

run().catch(console.error)
