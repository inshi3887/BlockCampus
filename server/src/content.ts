import {randomUUID} from 'node:crypto'
import type {FastifyInstance} from 'fastify'
import {z} from 'zod'
import {fail} from './app.js'
import {transaction,type DB} from './db.js'
import {idempotent,settlePhoto} from './economy.js'
import {putImage} from './storage.js'
export function blocked(text:string) {return ['赌博','代开发票','毒品交易',...(process.env.BLOCKED_WORDS||'').split(',').filter(Boolean)].some(w=>text.includes(w))}
export function adminGuard(auth:any) {return async(req:any)=>{await auth(req);if(!(process.env.ADMIN_ACCOUNTS||'').split(',').includes(req.account.username))fail('需要运营权限',403)}}
export function contentModule(app:FastifyInstance,db:DB,play:any,auth:any) {
 const admin=adminGuard(auth)
 async function visible(id:string,user:string) {const p=(await db.query('SELECT * FROM posts WHERE id=$1',[id])).rows[0];if(!p||p.status!=='approved'||(p.channel==='friends'&&p.account_id!==user))fail('内容不可见',404);return p}
 app.post('/api/uploads',{preHandler:play},async req=>{const data=await req.file();if(!data)fail('请选择图片');const bytes=await data.toBuffer();if(!bytes.length)fail('图片为空');const image=await putImage(bytes),id=randomUUID();await db.query('INSERT INTO uploads(id,account_id,object_key,url,mime) VALUES($1,$2,$3,$4,$5)',[id,req.account.id,image.key,image.url,image.mime]);return {id,url:image.url,status:'pending'}})
 app.post('/api/posts',{preHandler:play},req=>{
  const b=z.object({key:z.string().uuid(),channel:z.enum(['forum','friends']),body:z.string().min(1).max(2000),uploadId:z.string().uuid().optional(),photoEvent:z.string().uuid().optional(),adSlot:z.string().max(64).optional()}).strict().parse(req.body)
  return idempotent(db,req.account.id,b.key,'post',async tx=>{
   if(blocked(b.body))fail('内容含敏感词，请修改')
   if(b.uploadId&&!(await tx.query('SELECT 1 FROM uploads WHERE id=$1 AND account_id=$2',[b.uploadId,req.account.id])).rows.length)fail('图片不存在')
   if(b.photoEvent&&(!b.uploadId||!(await tx.query('SELECT 1 FROM photo_events WHERE id=$1 AND account_id=$2',[b.photoEvent,req.account.id])).rows.length))fail('打卡必须绑定本人照片与拍照事件')
   if(b.photoEvent){const e=(await tx.query('SELECT * FROM photo_events WHERE id=$1 AND account_id=$2 FOR UPDATE',[b.photoEvent,req.account.id])).rows[0];if(e.upload_id&&e.upload_id!==b.uploadId)fail('该拍照事件已绑定其他图片',409);await tx.query('UPDATE photo_events SET upload_id=$2 WHERE id=$1',[b.photoEvent,b.uploadId]);if(b.adSlot){const campaign=(await tx.query('SELECT slot FROM ads WHERE id=$1',[e.campaign_id])).rows[0];if(campaign?.slot!==b.adSlot)fail('该照片不属于有效广告活动')}}
   const id=randomUUID();await tx.query('INSERT INTO posts(id,account_id,channel,body,upload_id,photo_event,ad_slot) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,req.account.id,b.channel,b.body,b.uploadId||null,b.photoEvent||null,b.adSlot||null]);return {id,status:'pending'}
  })
 })
 app.get('/api/posts',{preHandler:play},async req=>{const q=z.object({channel:z.enum(['forum','friends']).default('forum'),before:z.iso.datetime().optional()}).parse(req.query);return (await db.query(`SELECT p.*,a.username,u.url,(SELECT count(*)::int FROM likes l WHERE l.post_id=p.id) AS likes FROM posts p JOIN accounts a ON a.id=p.account_id LEFT JOIN uploads u ON u.id=p.upload_id WHERE p.channel=$1 AND (p.account_id=$2 OR (p.channel='forum' AND p.status='approved')) AND ($3::timestamptz IS NULL OR p.created_at<$3) ORDER BY p.created_at DESC LIMIT 30`,[q.channel,req.account.id,q.before||null])).rows})
 app.get('/api/posts/:id/comments',{preHandler:play},async req=>{const id=z.string().uuid().parse((req.params as any).id);await visible(id,req.account.id);return (await db.query("SELECT c.id,c.body,a.username,c.created_at FROM comments c JOIN accounts a ON a.id=c.account_id WHERE post_id=$1 AND status='approved' ORDER BY c.created_at LIMIT 100",[id])).rows})
 app.post('/api/posts/:id/comments',{preHandler:play},async req=>{const id=z.string().uuid().parse((req.params as any).id);await visible(id,req.account.id);const b=z.object({body:z.string().min(1).max(500)}).parse(req.body);if(blocked(b.body))fail('评论含敏感词');await db.query('INSERT INTO comments(id,post_id,account_id,body) VALUES($1,$2,$3,$4)',[randomUUID(),id,req.account.id,b.body]);return {status:'pending'}})
 app.post('/api/posts/:id/like',{preHandler:play},async req=>{const id=z.string().uuid().parse((req.params as any).id);await visible(id,req.account.id);await db.query('INSERT INTO likes VALUES($1,$2) ON CONFLICT DO NOTHING',[id,req.account.id]);return {ok:true}})
 app.post('/api/posts/:id/report',{preHandler:play},async req=>{const id=z.string().uuid().parse((req.params as any).id);await visible(id,req.account.id);const b=z.object({reason:z.string().min(1).max(300)}).parse(req.body);await db.query('INSERT INTO reports VALUES($1,$2,$3,$4,now())',[randomUUID(),id,req.account.id,b.reason]);return {ok:true}})
 app.get('/api/admin/review',{preHandler:admin},async()=>({posts:(await db.query("SELECT p.*,u.url FROM posts p LEFT JOIN uploads u ON u.id=p.upload_id WHERE p.status='pending' ORDER BY p.created_at LIMIT 100")).rows,comments:(await db.query("SELECT * FROM comments WHERE status='pending' LIMIT 100")).rows,reports:(await db.query('SELECT * FROM reports ORDER BY created_at DESC LIMIT 100')).rows}))
 app.post('/api/admin/review/:id',{preHandler:admin},async req=>{const id=z.string().uuid().parse((req.params as any).id);const b=z.object({approved:z.boolean(),type:z.enum(['post','comment'])}).parse(req.body);return transaction(db,async tx=>{
  if(b.type==='comment'){await tx.query('UPDATE comments SET status=$2 WHERE id=$1',[id,b.approved?'approved':'rejected']);return {ok:true}}
  const p0=(await tx.query('SELECT account_id FROM posts WHERE id=$1',[id])).rows[0];if(!p0)fail('内容不存在',404)
  await tx.query('SELECT id FROM accounts WHERE id=$1 FOR UPDATE',[p0.account_id])
  const p=(await tx.query('SELECT * FROM posts WHERE id=$1 FOR UPDATE',[id])).rows[0];if(p.status!=='pending')return {ok:true,already:true}
  const decision=b.approved?'approved':'rejected';await tx.query('UPDATE posts SET status=$2 WHERE id=$1',[id,decision]);if(p.upload_id)await tx.query('UPDATE uploads SET status=$2 WHERE id=$1',[p.upload_id,decision]);await tx.query('INSERT INTO moderation_log(operator_id,target,decision) VALUES($1,$2,$3)',[req.account.id,id,decision])
  let settlement=null
  if(b.approved&&p.ad_slot&&p.photo_event) {
   const eligible=(await tx.query('SELECT 1 FROM ads a JOIN photo_events e ON e.campaign_id=a.id WHERE a.slot=$1 AND e.id=$2 AND e.created_at BETWEEN a.starts_at AND a.ends_at',[p.ad_slot,p.photo_event])).rows.length
   if(eligible)settlement=await settlePhoto(tx,p.account_id,p.photo_event,'ad')
  }
  return {ok:true,settlement}
 })})
}
