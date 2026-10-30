import {createHmac} from 'node:crypto'
import type {FastifyInstance} from 'fastify'
import {z} from 'zod'
import {fail} from './app.js'
import {transaction,type DB} from './db.js'
export function chinaTime(now=new Date()) {const d=new Date(now.getTime()+8*3600000);return {day:d.toISOString().slice(0,10),weekday:d.getUTCDay(),hour:d.getUTCHours()}}
export function parseIdentity(id:string,now=new Date()) {
 if(!/^[1-9]\d{16}[\dX]$/.test(id))fail('身份证格式不正确')
 const weights=[7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2];const checks='10X98765432'
 if(checks[weights.reduce((sum,w,i)=>sum+w*Number(id[i]),0)%11]!==id[17])fail('身份证校验位不正确')
 const birth=id.slice(6,10)+'-'+id.slice(10,12)+'-'+id.slice(12,14);const date=new Date(birth)
 if(!Number.isFinite(+date)||date.toISOString().slice(0,10)!==birth||birth>chinaTime(now).day||Number(birth.slice(0,4))<1900)fail('出生日期无效')
 return birth
}
export function allowed(birth:string,seconds:number,now=new Date(),holidays=(process.env.HOLIDAYS||'').split(',')) {
 const t=chinaTime(now); const adult=t.day>=`${Number(birth.slice(0,4))+18}${birth.slice(4)}`
 return adult || (([5,6,0].includes(t.weekday)||holidays.includes(t.day))&&t.hour===20&&seconds<3600)
}
export function identityModule(app:FastifyInstance,db:DB,auth:any) {
 const status=async(id:string,tick=false)=>transaction(db,async tx=>{
  const identity=(await tx.query('SELECT birth_date::text FROM identities WHERE account_id=$1',[id])).rows[0]
  if(!identity)return {verified:false,allowed:false,seconds:0,provider:'self-hosted-placeholder'}
  const day=chinaTime().day
  await tx.query('INSERT INTO play_days(account_id,day) VALUES($1,$2) ON CONFLICT DO NOTHING',[id,day])
  const p=(await tx.query('SELECT * FROM play_days WHERE account_id=$1 AND day=$2 FOR UPDATE',[id,day])).rows[0]
  let seconds=p.seconds
  if(tick) {seconds+=p.last_seen?Math.min(60,Math.max(0,Math.ceil((Date.now()-new Date(p.last_seen).getTime())/1000))):0;await tx.query('UPDATE play_days SET seconds=$3,last_seen=now() WHERE account_id=$1 AND day=$2',[id,day,seconds])}
  return {verified:true,allowed:allowed(identity.birth_date,seconds),seconds,provider:'self-hosted-placeholder'}
 })
 app.post('/api/identity',{preHandler:auth},async req=>{
 const b=z.object({name:z.string().regex(/^[\p{Script=Han}·]{2,30}$/u),identity:z.string().max(18)}).parse(req.body);const birth=parseIdentity(b.identity)
 const secret=process.env.IDENTITY_HASH_SECRET;if(!secret||secret.length<32)fail('服务端实名密钥尚未配置',503)
 const hash=createHmac('sha256',secret).update(b.identity).digest('hex')
 try {await db.query('INSERT INTO identities(account_id,identity_hash,birth_date) VALUES($1,$2,$3)',[req.account.id,hash,birth])}catch(e:any){if(e.code==='23505')fail('该账号或实名信息已认证',409);throw e}
 return status(req.account.id)
 })
 app.get('/api/identity',{preHandler:auth},req=>status(req.account.id))
 app.post('/api/play/heartbeat',{preHandler:auth},req=>status(req.account.id,true))
 return async(req:any)=>{await auth(req);const s=await status(req.account.id,true);if(!s.verified)fail('请先完成实名占位认证',403);if(!s.allowed)fail('当前不在可游戏时段或已达时长上限',403)}
}
