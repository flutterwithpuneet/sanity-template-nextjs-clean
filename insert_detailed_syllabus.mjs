import pg from 'pg'
import fs from 'fs'

const pool = new pg.Pool({
  host: '1m3ur6d1ukkdkt94.gateway01.us-east-1.prod.aws.pg.tidbcloud.com',
  port: 5432,
  user: '1m3ur6d1ukkdkt94.postgres',
  password: 'OI9j3fqXI41kT2ciiCLd9fm1Du2dHKwR',
  database: 'exam',
  ssl: { rejectUnauthorized: false },
})

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 180)
}

function determinePriority(subjectId, sectionName, subsectionName) {
  const s = (sectionName + ' ' + (subsectionName || '')).toLowerCase()
  if (subjectId === 1) {
    if (s.includes('programming') || s.includes('algorithm') || s.includes('flowchart') || s.includes('search') || s.includes('sort') || s.includes('ide') || s.includes(' c ') || s.includes('c language')) {
      return 'very_high'
    }
    if (s.includes('network') || s.includes('internet') || s.includes('osi') || s.includes('tcp') || s.includes('ip') || s.includes('protocol')) {
      return 'very_high'
    }
    if (s.includes('fundamental') || s.includes('hardware') || s.includes('number system') || s.includes('cpu') || s.includes('memory') || s.includes('binary')) {
      return 'very_high'
    }
    return 'high' // MS Office, Cyber security, OS
  }
  if (subjectId === 2) {
    return 'high' // All reasoning is high priority
  }
  if (subjectId === 3) {
    if (s.includes('percentage') || s.includes('average') || s.includes('permutation') || s.includes('combination')) {
      return 'medium'
    }
    return 'high' // Number system, HCF/LCM, simplification, algebra, DI
  }
  if (subjectId === 4) {
    if (s.includes('rajasthan')) {
      return 'high'
    }
    return 'medium' // India geography, general science, sports, current affairs
  }
  return 'medium'
}

async function run() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    console.log('--- STARTING DETAILED SYLLABUS INGESTION ---')

    // 1. Synchronize 4 Subjects
    const subjects = [
      { id: 1, name: 'Computer Knowledge', code: 'CIT', desc: 'Computer Knowledge: Fundamentals, Number Systems, OS, Office, Networking, Security, Programming & Algorithms (90 Questions)' },
      { id: 2, name: 'Reasoning', code: 'RMA', desc: 'Reasoning: Series, Coding-Decoding, Blood Relations, Puzzles, Data Sufficiency, Logical & Non-Verbal (30 Questions)' },
      { id: 3, name: 'Mathematics / Quantitative Aptitude', code: 'MATH', desc: 'Mathematics: Number System, HCF/LCM, Simplification, Algebra, DI, Percentage, Average, P&C (20 Questions)' },
      { id: 4, name: 'General Knowledge (GK)', code: 'GK', desc: 'General Knowledge: Rajasthan GK (History, Geography, Culture, Polity), Indian Geography, Science & Current Affairs (10 Questions)' },
    ]

    for (const sub of subjects) {
      await client.query(`
        INSERT INTO subjects (id, name, code, description, icon, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'book', 'active', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            code = EXCLUDED.code,
            description = EXCLUDED.description,
            status = 'active',
            updated_at = NOW()
      `, [sub.id, sub.name, sub.code, sub.desc])
    }
    console.log('✓ 4 Core Subjects updated.')

    // 2. Clear previous topics except 408 & 409
    await client.query('DELETE FROM topics WHERE id NOT IN (408, 409)')
    console.log('✓ Cleaned existing topics (preserved 408, 409 for active questions).')

    // 3. Read and parse syllabus_raw.md
    const raw = fs.readFileSync('syllabus_raw.md', 'utf8')
    const lines = raw.split(/\r?\n/)

    let currentSubjectId = null
    let currentL1Id = null
    let currentL1Name = ''
    let currentL2Id = null
    let currentL2Name = ''
    let orderIndex = 1

    let insertedCount = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      if (line.startsWith('# SUBJECT 1')) {
        currentSubjectId = 1
        currentL1Id = null
        currentL2Id = null
        continue
      }
      if (line.startsWith('# SUBJECT 2')) {
        currentSubjectId = 2
        currentL1Id = null
        currentL2Id = null
        continue
      }
      if (line.startsWith('# SUBJECT 3')) {
        currentSubjectId = 3
        currentL1Id = null
        currentL2Id = null
        continue
      }
      if (line.startsWith('# SUBJECT 4')) {
        currentSubjectId = 4
        currentL1Id = null
        currentL2Id = null
        continue
      }
      if (line.startsWith('# 2. Study priority') || line.startsWith('# 3. Topics')) {
        break
      }

      if (!currentSubjectId) continue

      // LEVEL 1: Section Header (e.g. "## A. Computer Fundamentals and Hardware" or "## A. Number and Alphabet Series")
      if (line.startsWith('## ') && !line.startsWith('## 1.')) {
        const rawTitle = line.replace(/^##\s+([A-Z]\.\s*)?/, '').trim()
        const priority = determinePriority(currentSubjectId, rawTitle, null)
        const slug = slugify(rawTitle) + `-${orderIndex}`
        orderIndex++

        const res = await client.query(`
          INSERT INTO topics (subject_id, parent_id, name, slug, priority, level, order_index, status, created_at, updated_at)
          VALUES ($1, NULL, $2, $3, $4, 1, $5, 'active', NOW(), NOW())
          RETURNING id
        `, [currentSubjectId, rawTitle, slug, priority, orderIndex])

        currentL1Id = Number(res.rows[0].id)
        currentL1Name = rawTitle
        currentL2Id = null
        currentL2Name = ''
        insertedCount++
        continue
      }

      // LEVEL 2: Subsection Header (e.g. "### A1. Computer basics")
      if (line.startsWith('### ')) {
        const rawTitle = line.replace(/^###\s+([A-Z0-9]+\.\s*)?/, '').trim()
        const priority = determinePriority(currentSubjectId, currentL1Name, rawTitle)
        const slug = slugify(rawTitle) + `-${orderIndex}`
        orderIndex++

        const res = await client.query(`
          INSERT INTO topics (subject_id, parent_id, name, slug, priority, level, order_index, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, 2, $6, 'active', NOW(), NOW())
          RETURNING id
        `, [currentSubjectId, currentL1Id, rawTitle, slug, priority, orderIndex])

        currentL2Id = Number(res.rows[0].id)
        currentL2Name = rawTitle
        insertedCount++
        continue
      }

      // SUBTOPIC: Bullet Item (e.g. "- Number series: addition, subtraction, multiplication and division patterns")
      if (line.startsWith('- ')) {
        const rawItem = line.replace(/^-\s+/, '').trim()
        const priority = determinePriority(currentSubjectId, currentL1Name, currentL2Name)
        const parentId = currentL2Id || currentL1Id
        const level = currentL2Id ? 3 : 2
        const slug = slugify(rawItem) + `-${orderIndex}`
        orderIndex++

        // Check if this bullet corresponds to preserved topic 408 (Algorithm Fundamentals) or 409 (Flowcharts and Symbols)
        if (currentSubjectId === 1 && rawItem.toLowerCase().startsWith('algorithm: definition') || rawItem.toLowerCase() === 'algorithm fundamentals') {
          // Update topic 408
          await client.query(`
            UPDATE topics
            SET subject_id = $1, parent_id = $2, name = $3, slug = $4, priority = $5, level = $6, order_index = $7, status = 'active', updated_at = NOW()
            WHERE id = 408
          `, [currentSubjectId, parentId, rawItem, slug, priority, level, orderIndex])
          insertedCount++
          continue
        }

        if (currentSubjectId === 1 && rawItem.toLowerCase().startsWith('flowchart symbols:') || rawItem.toLowerCase() === 'flowcharts and symbols') {
          // Update topic 409
          await client.query(`
            UPDATE topics
            SET subject_id = $1, parent_id = $2, name = $3, slug = $4, priority = $5, level = $6, order_index = $7, status = 'active', updated_at = NOW()
            WHERE id = 409
          `, [currentSubjectId, parentId, rawItem, slug, priority, level, orderIndex])
          insertedCount++
          continue
        }

        await client.query(`
          INSERT INTO topics (subject_id, parent_id, name, slug, priority, level, order_index, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW(), NOW())
        `, [currentSubjectId, parentId, rawItem, slug, priority, level, orderIndex])

        insertedCount++
      }
    }

    // Ensure 408 and 409 have valid parent_id if they weren't matched directly
    const check408 = await client.query('SELECT parent_id FROM topics WHERE id = 408')
    if (!check408.rows[0]?.parent_id && currentL1Id) {
      // Find the algorithms subsection or section
      const algoParent = await client.query(`SELECT id FROM topics WHERE subject_id = 1 AND name ILIKE '%algorithm%' AND level IN (1, 2) LIMIT 1`)
      const pId = algoParent.rows[0]?.id || currentL1Id
      await client.query(`UPDATE topics SET parent_id = $1 WHERE id IN (408, 409)`, [pId])
    }

    await client.query('COMMIT')
    console.log(`--- FINISHED! Inserted/Updated ${insertedCount} topics & subtopics ---`)

    // Verify
    const counts = await client.query(`
      SELECT s.name as subject, t.level, COUNT(t.id) as count
      FROM topics t
      JOIN subjects s ON t.subject_id = s.id
      GROUP BY s.id, s.name, t.level
      ORDER BY s.id, t.level
    `)
    console.log('\nBreakdown by Subject and Level:')
    console.table(counts.rows)

    const sample = await client.query(`
      SELECT p.name as section, t.name as subtopic, t.level
      FROM topics t
      JOIN topics p ON t.parent_id = p.id
      WHERE p.name ILIKE '%Number and Alphabet Series%'
      ORDER BY t.order_index
    `)
    console.log('\nVerification of "Number and Alphabet Series" Subtopics in Database:')
    console.table(sample.rows)

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Migration failed and ROLLED BACK:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
