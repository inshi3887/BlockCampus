import {randomUUID} from 'node:crypto'
import type {FastifyInstance} from 'fastify'
import {z} from 'zod'
import type {DB} from './db.js'
import {fail} from './app.js'
import {adminGuard} from './content.js'
import {chinaTime} from './identity.js'
export const AD_SLOTS=[{id:'school:gdut-lightbox',landmark:'school:gdut-library',name:'图书馆灯箱'},{id:'school:gdut-market',landmark:'school:gdut-market',name:'校园超市'}]
export function adsModule(app:FastifyInstance,db:DB,play:any,auth:any) {
 const admin=adminGuard(auth)
 app.get('/api/admin/ads',{preHandler:admin},async()=>({slots:AD_SLOTS,ads:(await db.query(`SELECT a.*,'/api/admin/media/'||u.id::text AS url,(SELECT count(*)::int FROM ad_metrics m WHERE m.ad_id=a.id) AS metrics FROM ads a JOIN uploads u ON u.id=a.upload_id ORDER BY starts_at DESC`)).rows}))
 app.post('/api/admin/ads',{preHandler:admin},async req=>{const b=z.object({advertiser:z.string().min(1).max(100),slot:z.enum(['school:gdut-lightbox','school:gdut-market']),uploadId:z.string().uuid(),startsAt:z.iso.datetime(),endsAt:z.iso.datetime()}).strict().parse(req.body);if(b.endsAt<=b.startsAt)fail('结束时间必须晚于开始时间');if(!(await db.query('SELECT 1 FROM uploads WHERE id=$1 AND account_id=$2',[b.uploadId,req.account.id])).rows.length)fail('素材不存在');const id=randomUUID();await db.query('INSERT INTO ads(id,advertiser,slot,landmark,upload_id,starts_at,ends_at) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,b.advertiser,b.slot,AD_SLOTS.find(s=>s.id===b.slot)!.landmark,b.uploadId,b.startsAt,b.endsAt]);return {id,active:false}})
 app.put('/api/admin/ads/:id',{preHandler:admin},async req=>{const id=z.string().uuid().parse((req.params as any).id);const b=z.object({active:z.boolean()}).parse(req.body);if(b.active)await db.query("UPDATE uploads SET status='approved' WHERE id=(SELECT upload_id FROM ads WHERE id=$1) AND status='pending'",[id]);await db.query('UPDATE ads SET active=$2 WHERE id=$1',[id,b.active]);return {ok:true}})
 app.get('/api/ads',async()=> (await db.query(`SELECT DISTINCT ON(a.slot) a.id,a.slot,a.landmark,a.advertiser,'/api/media/'||u.id::text AS url FROM ads a JOIN uploads u ON u.id=a.upload_id WHERE u.status='approved' AND a.active=true AND now() BETWEEN a.starts_at AND a.ends_at ORDER BY a.slot,a.starts_at DESC`)).rows)
 app.post('/api/ads/:id/metric',{preHandler:play},async req=>{const id=z.string().uuid().parse((req.params as any).id);const b=z.object({kind:z.enum(['impression','click'])}).parse(req.body);await db.query('INSERT INTO ad_metrics(ad_id,account_id,day,kind) SELECT id,$2,$3,$4 FROM ads WHERE id=$1 AND active=true AND now() BETWEEN starts_at AND ends_at ON CONFLICT DO NOTHING',[id,req.account.id,chinaTime().day,b.kind]);return {ok:true}})
}
