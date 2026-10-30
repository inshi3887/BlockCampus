import {randomInt,randomUUID} from 'node:crypto'
import type {FastifyInstance} from 'fastify'
import {z} from 'zod'
import {transaction,type DB} from './db.js'
import {fail} from './app.js'
import {chinaTime} from './identity.js'
import {RULES,CATALOG,drop,growth,levelGold} from './rules.js'
import {LANDMARKS} from './places.js'
const keySchema=z.string().uuid()
export async function wallet(tx:DB,id:string) {await tx.query('INSERT INTO wallets(account_id) VALUES($1) ON CONFLICT DO NOTHING',[id]);const w=(await tx.query('SELECT * FROM wallets WHERE account_id=$1 FOR UPDATE',[id])).rows[0];return {...w,gold_copper:Number(w.gold_copper),silver_copper:Number(w.silver_copper),copper:Number(w.copper)}}
export async function credit(tx:DB,id:string,reason:string,d:any) {await wallet(tx,id);await tx.query('UPDATE wallets SET gold_copper=gold_copper+$2,silver_copper=silver_copper+$3,copper=copper+$4 WHERE account_id=$1',[id,d.gold_copper||0,d.silver_copper||0,d.copper||0]);await tx.query('INSERT INTO ledger(account_id,reason,delta) VALUES($1,$2,$3)',[id,reason,d])}
export async function idempotent(db:DB,id:string,key:string,action:string,fn:(tx:DB)=>Promise<any>) {
 keySchema.parse(key)
 return transaction(db,async tx=>{await tx.query('SELECT id FROM accounts WHERE id=$1 FOR UPDATE',[id]);const old=(await tx.query('SELECT action,result FROM receipts WHERE account_id=$1 AND key=$2',[id,key])).rows[0];if(old){if(old.action!==action)fail('幂等键已用于其他请求',409);return old.result}const result=await fn(tx);await tx.query('INSERT INTO receipts VALUES($1,$2,$3,$4)',[id,key,action,result]);return result})
}
export async function settlePhoto(tx:DB,id:string,eventId:string,kind:'normal'|'ad') {
 const field=kind==='normal'?'normal_claimed':'ad_claimed'
 const p=(await tx.query(`SELECT * FROM photo_events WHERE id=$1 AND account_id=$2 FOR UPDATE`,[eventId,id])).rows[0]
 if(!p)fail('照片事件不存在',404);if(p[field])return {reward:null,already:true}
 await tx.query(`UPDATE photo_events SET ${field}=true WHERE id=$1`,[eventId])
 const day=chinaTime().day
 await tx.query('INSERT INTO daily_drops(account_id,day,kind) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[id,day,kind])
 const count=(await tx.query('SELECT count FROM daily_drops WHERE account_id=$1 AND day=$2 AND kind=$3 FOR UPDATE',[id,day,kind])).rows[0].count
 const cap=kind==='normal'?RULES.normalCap:RULES.adCap
 if(count>=cap)return {reward:null,capped:true,count,cap}
 const reward=drop(kind,randomInt(1000000)/1000000,randomInt(2)/2)
 await credit(tx,id,kind+'-photo',reward)
 await tx.query('UPDATE daily_drops SET count=count+1 WHERE account_id=$1 AND day=$2 AND kind=$3',[id,day,kind])
 return {reward,count:count+1,cap}
}
export function economyModule(app:FastifyInstance,db:DB,play:any) {
 app.get('/api/economy',{preHandler:play},req=>transaction(db,async tx=>{const w=await wallet(tx,req.account.id);return {...w,...growth(w.points),catalog:CATALOG,inventory:(await tx.query('SELECT sku FROM inventory WHERE account_id=$1',[req.account.id])).rows.map(r=>r.sku),daily:(await tx.query('SELECT kind,count FROM daily_drops WHERE account_id=$1 AND day=$2',[req.account.id,chinaTime().day])).rows,rules:RULES}}))
 app.post('/api/shop/buy',{preHandler:play},req=>{const b=z.object({key:keySchema,sku:z.string()}).strict().parse(req.body);return idempotent(db,req.account.id,b.key,'buy:'+b.sku,async tx=>{
  const item=CATALOG.find(c=>c.id===b.sku);if(!item)fail('商品不存在',404);const w=await wallet(tx,req.account.id);if(w.level<item.unlock.level)fail('未达到解锁等级');if((await tx.query('SELECT 1 FROM inventory WHERE account_id=$1 AND sku=$2',[req.account.id,b.sku])).rows.length)fail('已拥有该装扮',409);if(w[item.currency]<item.price)fail('对应币种余额不足')
  await credit(tx,req.account.id,'purchase:'+b.sku,{[item.currency]:-item.price});await tx.query('INSERT INTO inventory VALUES($1,$2)',[req.account.id,b.sku]);return {ok:true,sku:b.sku}
 })})
 app.post('/api/photos/event',{preHandler:play},req=>{
  const b=z.object({key:keySchema,landmark:z.string(),position:z.object({x:z.number().finite(),z:z.number().finite()})}).strict().parse(req.body)
  return idempotent(db,req.account.id,b.key,'photo:'+b.landmark,async tx=>{
   const place=LANDMARKS.find(p=>p.id===b.landmark);if(!place)fail('未知景点');if(Math.hypot(b.position.x-place.x,b.position.z-place.z)>place.radius)fail('请靠近景点拍照')
   const recent=(await tx.query("SELECT 1 FROM photo_events WHERE account_id=$1 AND created_at>now()-interval '10 seconds'",[req.account.id])).rows.length;if(recent)fail('拍照过于频繁',429)
   const id=randomUUID();await tx.query('INSERT INTO photo_events(id,account_id,landmark) VALUES($1,$2,$3)',[id,req.account.id,b.landmark]);return {eventId:id,...await settlePhoto(tx,req.account.id,id,'normal')}
  })
 })
 app.get('/api/places',()=>LANDMARKS)
 app.get('/api/lessons',{preHandler:play},async()=>({duration:RULES.lessonSeconds,heartbeat:RULES.heartbeatSeconds,rooms:[{id:'school:gdut-classroom',name:'高教授 · 方块城市导论',seats:50}]}))
 app.post('/api/lessons/start',{preHandler:play},req=>{const b=z.object({key:keySchema,seat:z.number().int().min(1).max(50),speed:z.union([z.literal(1),z.literal(1.25)])}).strict().parse(req.body);return idempotent(db,req.account.id,b.key,'lesson-start',async tx=>{
  await tx.query("UPDATE lessons SET status='interrupted' WHERE status='active' AND last_seen<now()-interval '2 minutes'")
  if((await tx.query("SELECT 1 FROM lessons WHERE account_id=$1 AND status='active'",[req.account.id])).rows.length)fail('已有进行中的课程',409)
  const id=randomUUID();try {await tx.query('INSERT INTO lessons(id,account_id,room,seat,speed) VALUES($1,$2,$3,$4,$5)',[id,req.account.id,'school:gdut-classroom',b.seat,b.speed])}catch(e:any){if(e.code==='23505')fail('该座位已被占用',409);throw e}return {id,startedAt:new Date().toISOString(),duration:RULES.lessonSeconds,speed:b.speed}
 })})
 app.post('/api/lessons/:id/event',{preHandler:play},req=>{const lessonId=keySchema.parse((req.params as any).id);const b=z.object({key:keySchema,type:z.enum(['pulse','confirm','finish','leave','hidden','visible'])}).strict().parse(req.body);return idempotent(db,req.account.id,b.key,'lesson:'+lessonId+':'+b.type,async tx=>{
  const lesson=(await tx.query('SELECT * FROM lessons WHERE id=$1 AND account_id=$2 FOR UPDATE',[lessonId,req.account.id])).rows[0];if(!lesson)fail('课程不存在',404);if(lesson.status!=='active')return {status:lesson.status,awarded:false}
  const now=Date.now(),sinceSeen=(now-new Date(lesson.last_seen).getTime())/1000,sinceConfirm=(now-new Date(lesson.confirmed_at).getTime())/1000
  if(b.type==='leave'||sinceSeen>120){await tx.query("UPDATE lessons SET status='interrupted' WHERE id=$1",[lessonId]);return {status:'interrupted',awarded:false}}
  // Credit only bounded, foreground intervals with a valid five-minute confirmation.
  const watched=lesson.watched_seconds+(sinceSeen<=45&&sinceConfirm<=300&&b.type!=='visible'?Math.max(0,sinceSeen)*Number(lesson.speed):0)
  await tx.query('UPDATE lessons SET last_seen=now(),watched_seconds=$2,confirmed_at=CASE WHEN $3 THEN now() ELSE confirmed_at END WHERE id=$1',[lessonId,watched,b.type==='confirm'&&sinceConfirm>=295])
  if(b.type==='hidden') { // no pulses are accepted by the UI while hidden; next visible gap is discarded
   return {status:'active',watched,needsConfirm:sinceConfirm>=300}
  }
  if(b.type==='finish') {
   if(watched<RULES.lessonSeconds||now-new Date(lesson.started_at).getTime()<RULES.lessonSeconds/Number(lesson.speed)*1000)fail('课程未完整播放或需要观看确认')
   const w=await wallet(tx,req.account.id);const next=growth(w.points+10);let gold=0;for(let lv=w.level;lv<next.level;lv++)gold+=levelGold(lv)*10000
   await tx.query('UPDATE wallets SET points=points+10,level=$2 WHERE account_id=$1',[req.account.id,next.level]);await credit(tx,req.account.id,'lesson-complete',{gold_copper:gold,points:10});await tx.query("UPDATE lessons SET status='completed' WHERE id=$1",[lessonId]);return {status:'completed',awarded:true,points:10,gold_copper:gold}
  }
  return {status:'active',watched,needsConfirm:sinceConfirm>=300,nextConfirmIn:Math.max(0,300-sinceConfirm)}
 })})
}
