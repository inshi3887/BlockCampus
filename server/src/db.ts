import pg from 'pg'
export type DB = { query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount?: number | null }> }
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
export async function transaction<T>(db: DB, fn: (db: DB) => Promise<T>): Promise<T> {
  const client = 'connect' in db ? await (db as pg.Pool).connect() : db
  try { await client.query('BEGIN'); const value = await fn(client); await client.query('COMMIT'); return value }
  catch (e) { await client.query('ROLLBACK'); throw e }
  finally { if ('release' in client) (client as pg.PoolClient).release() }
}
