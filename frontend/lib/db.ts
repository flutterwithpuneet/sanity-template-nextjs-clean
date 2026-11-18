import pg from 'pg'
import type { Pool as PgPool, Client as PgClient, QueryResult } from 'pg'

const { Pool, Client } = pg

export const dbConfig = {
  host: process.env.DB_HOST || '1m3ur6d1ukkdkt94.gateway01.us-east-1.prod.aws.pg.tidbcloud.com',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || '1m3ur6d1ukkdkt94.postgres',
  password: process.env.DB_PASSWORD || 'OI9j3fqXI41kT2ciiCLd9fm1Du2dHKwR',
  database: process.env.DB_NAME || 'exam',
  ssl: { rejectUnauthorized: false },
}

export function createClient(customConfig: Record<string, any> = {}): PgClient {
  return new Client({ ...dbConfig, ...customConfig })
}

// Common single client instance
export const client: PgClient = createClient()

const globalForDb = globalThis as unknown as {
  pgPool: PgPool | undefined
}

export const pool =
  globalForDb.pgPool ??
  new Pool({
    ...dbConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pgPool = pool
}

/**
 * Normalizes MySQL-style queries to PostgreSQL compatibility:
 * 1. Replaces ? positional parameters with $1, $2, ...
 * 2. Replaces INSERT IGNORE INTO with INSERT INTO ... ON CONFLICT DO NOTHING
 * 3. Replaces ON DUPLICATE KEY UPDATE with ON CONFLICT UPDATE
 * 4. Replaces double quotes used for string literals like "active", "pending", "approved", "submitted"
 * 5. Appends RETURNING id to INSERT queries when missing
 */
function normalizeQuery(sql: string, params: any[]): { text: string; values: any[] } {
  let normalized = sql

  // 1. Replace INSERT IGNORE INTO
  if (/insert\s+ignore\s+into/i.test(normalized)) {
    normalized = normalized.replace(/insert\s+ignore\s+into/gi, 'INSERT INTO')
    if (!/on\s+conflict/i.test(normalized)) {
      normalized = normalized.trim()
      if (normalized.endsWith(';')) normalized = normalized.slice(0, -1)
      normalized += ' ON CONFLICT DO NOTHING'
    }
  }

  // 2. Replace MySQL ON DUPLICATE KEY UPDATE for system_settings or general
  if (/on\s+duplicate\s+key\s+update/i.test(normalized)) {
    if (/system_settings/i.test(normalized)) {
      normalized = normalized.replace(
        /on\s+duplicate\s+key\s+update.*$/gi,
        'ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()'
      )
    } else {
      normalized = normalized.replace(
        /values\s*\(\s*([a-zA-Z0-9_]+)\s*\)/gi,
        'EXCLUDED.$1'
      )
      normalized = normalized.replace(
        /on\s+duplicate\s+key\s+update/gi,
        'ON CONFLICT DO UPDATE SET'
      )
    }
  }

  // 3. Fix double quotes used for enum/string values (e.g. = "active", != "deleted", <> "pending")
  normalized = normalized.replace(
    /(!=|<>|=)\s*"([^"]+)"/g,
    "$1 '$2'"
  )

  // 4. For INSERT statements without RETURNING, append RETURNING id
  const isInsert = /^\s*insert\s+into/i.test(normalized)
  if (isInsert && !/returning/i.test(normalized)) {
    normalized = normalized.trim()
    if (normalized.endsWith(';')) normalized = normalized.slice(0, -1)
    normalized += ' RETURNING id'
  }

  // 5. Replace ? with $1, $2, $3...
  let paramIndex = 1
  normalized = normalized.replace(/\?/g, () => `$${paramIndex++}`)

  return { text: normalized, values: params || [] }
}

export const db = {
  async query(sql: string, params: any[] = []): Promise<any> {
    const { text, values } = normalizeQuery(sql, params)
    const result: QueryResult = await pool.query(text, values)

    const isInsert = /^\s*insert\s+into/i.test(sql)
    const isUpdateOrDelete = /^\s*(update|delete)\s+/i.test(sql)

    const insertId = result.rows?.[0]?.id ? Number(result.rows[0].id) : 0
    const affectedRows = result.rowCount ?? 0

    if (isInsert || isUpdateOrDelete) {
      // MySQL-compatible OkPacket / ResultSetHeader
      const header: any = {
        insertId,
        affectedRows,
        changedRows: affectedRows,
        fieldCount: 0,
        serverStatus: 2,
        warningStatus: 0,
        message: '',
        ...result.rows?.[0],
      }

      // Also support destructuring as array of rows if caller expects [rows]
      Object.assign(result.rows, { insertId, affectedRows })

      return [header, null]
    }

    // For SELECT queries: return [rows, fields]
    // In addition, attach insertId/affectedRows on rows array for maximum compatibility
    const rows: any = result.rows || []
    rows.insertId = insertId
    rows.affectedRows = affectedRows

    return [rows, result.fields]
  },
}

export default db
