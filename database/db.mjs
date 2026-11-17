import pg from 'pg'

const { Client, Pool } = pg

export const dbConfig = {
  host: process.env.DB_HOST || '1m3ur6d1ukkdkt94.gateway01.us-east-1.prod.aws.pg.tidbcloud.com',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || '1m3ur6d1ukkdkt94.postgres',
  password: process.env.DB_PASSWORD || 'OI9j3fqXI41kT2ciiCLd9fm1Du2dHKwR',
  database: process.env.DB_NAME || 'exam',
  ssl: { rejectUnauthorized: false },
}

export function createClient(customConfig = {}) {
  return new Client({ ...dbConfig, ...customConfig })
}

// Common single client instance
export const client = createClient()

// Connection pool for concurrent operations
export const pool = new Pool(dbConfig)

export async function query(text, params = []) {
  return pool.query(text, params)
}

export default client
