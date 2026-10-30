// Isolated QA harness only. Production always uses src/index.ts + PostgreSQL/Redis/S3.
import {PGlite} from '@electric-sql/pglite'
import {readFile,readdir} from 'node:fs/promises'
import {randomUUID} from 'node:crypto'
import {createApp} from '../src/app.js'
import {hashPassword} from '../src/auth.js'
import type {DB} from '../src/db.js'
process.env.NODE_ENV='test';process.env.ADMIN_ACCOUNTS='qa_operator';process.env.IDENTITY_HASH_SECRET='local-qa-only-placeholder-secret-32bytes';process.env.APP_ORIGIN=process.env.APP_ORIGIN||'http://127.0.0.1:5175'
const pg=new PGlite();for(const f of (await readdir(new URL('../migrations/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort())await pg.exec(await readFile(new URL('../migrations/'+f,import.meta.url),'utf8'))
const db:any={query:async(sql:string,params?:any[])=>{const r=await pg.query(sql,params);return {rows:r.rows,rowCount:r.affectedRows}}};let tail=Promise.resolve();db.connect=async()=>{let release!:()=>void;const next=new Promise<void>(r=>release=r),before=tail;tail=next;await before;return {query:db.query,release}}
const cache:any={values:new Map(),async get(k:string){return this.values.get(k)||null},async set(k:string,v:string){this.values.set(k,v)},async del(k:string){this.values.delete(k)},async incr(k:string){const n=Number(this.values.get(k)||0)+1;this.values.set(k,''+n);return n},async expire(){}}
for(const [username,phone] of [['qa_student','13900000001'],['qa_operator','13900000002']]){const id=randomUUID();await db.query('INSERT INTO accounts(id,username,phone,password_hash) VALUES($1,$2,$3,$4)',[id,username,phone,await hashPassword('campus-qa-only-2026')]);await db.query("INSERT INTO identities(account_id,identity_hash,birth_date) VALUES($1,$2,'2000-01-01')",[id,'qa-'+id])}
const app=createApp(db as DB,cache);await app.listen({port:3001,host:'127.0.0.1'});console.log('QA ONLY: in-memory PostgreSQL + cache. No S3. Accounts qa_student / qa_operator; password campus-qa-only-2026. No initial economy grants. Data discarded on exit.')
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await app.close();await pg.close();process.exit(0)})
