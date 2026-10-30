import {readFile,readdir} from 'node:fs/promises'
import {pool,transaction} from './db.js'
export async function migrate(db=pool) {
 await transaction(db,async tx=>{
 await tx.query("SELECT pg_advisory_xact_lock(731120)")
 await tx.query('CREATE TABLE IF NOT EXISTS migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())')
 for(const name of (await readdir(new URL('../migrations/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort()) {
 if((await tx.query('SELECT 1 FROM migrations WHERE name=$1',[name])).rows.length) continue
 await tx.query(await readFile(new URL('../migrations/'+name,import.meta.url),'utf8')); await tx.query('INSERT INTO migrations(name) VALUES($1)',[name])
 }
 })
}
await migrate(); await pool.end()
