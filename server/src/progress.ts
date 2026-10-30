import type {FastifyInstance} from 'fastify'
import {z} from 'zod'
import type {DB} from './db.js'
import {fail} from './app.js'
import {LANDMARKS} from './places.js'
export function progressModule(app:FastifyInstance,db:DB,play:any){
 app.get('/api/progress',{preHandler:play},async req=>({discovered:(await db.query('SELECT landmark FROM discoveries WHERE account_id=$1',[req.account.id])).rows.map(r=>r.landmark),photographed:Object.fromEntries((await db.query('SELECT landmark,count(*)::int AS count FROM photo_events WHERE account_id=$1 GROUP BY landmark',[req.account.id])).rows.map(r=>[r.landmark,r.count]))}))
 app.post('/api/progress/discover',{preHandler:play},async req=>{const b=z.object({landmark:z.string(),position:z.object({x:z.number().finite(),z:z.number().finite()})}).parse(req.body);const p=LANDMARKS.find(p=>p.id===b.landmark);if(!p||Math.hypot(p.x-b.position.x,p.z-b.position.z)>p.radius)fail('景点事件无效');await db.query('INSERT INTO discoveries(account_id,landmark) VALUES($1,$2) ON CONFLICT DO NOTHING',[req.account.id,b.landmark]);return {ok:true}})
}
