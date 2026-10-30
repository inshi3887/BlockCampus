import {randomBytes,randomUUID,scrypt as rawScrypt,timingSafeEqual,createHash} from 'node:crypto'
import {promisify} from 'node:util'
import {z} from 'zod'
import type {FastifyInstance,FastifyRequest,FastifyReply} from 'fastify'
import type {DB} from './db.js'
import type {Cache} from './app.js'
import {fail} from './app.js'
const scrypt=promisify(rawScrypt)
export async function hashPassword(password:string,salt=randomBytes(16).toString('hex')) {return salt+':'+(await scrypt(password,salt,64) as Buffer).toString('hex')}
export async function verifyPassword(password:string,hash:string) {const actual=await hashPassword(password,hash.split(':')[0]);return timingSafeEqual(Buffer.from(actual),Buffer.from(hash))}
export const tokenKey=(token:string)=>'session:'+createHash('sha256').update(token).digest('hex')
export function authModule(app:FastifyInstance,db:DB,cache:Cache) {
 const schema=z.object({username:z.string().regex(/^[a-zA-Z0-9_]{3,24}$/),password:z.string().min(10).max(128),phone:z.string().regex(/^1[3-9]\d{9}$/)})
 async function issue(id:string,reply:FastifyReply) {const token=randomBytes(32).toString('hex');await cache.set(tokenKey(token),id,{EX:86400});reply.setCookie('campus_session',token,{httpOnly:true,sameSite:'strict',secure:process.env.COOKIE_SECURE==='true',path:'/',maxAge:86400});return {id}}
 app.post('/api/auth/register',async(req,reply)=>{
  const b=schema.parse(req.body);const id=randomUUID()
  try {await db.query('INSERT INTO accounts(id,username,phone,password_hash) VALUES($1,$2,$3,$4)',[id,b.username,b.phone,await hashPassword(b.password)])} catch(e:any){if(e.code==='23505') fail('账号或手机号已注册',409);throw e}
  return issue(id,reply)
 })
 app.post('/api/auth/login',async(req,reply)=>{
  const b=schema.omit({phone:true}).parse(req.body)
  const key='login:'+req.ip+':'+b.username; const n=await cache.incr(key);if(n===1)await cache.expire(key,900);if(n>10)fail('登录尝试过多，请15分钟后重试',429)
  const user=(await db.query('SELECT * FROM accounts WHERE username=$1',[b.username])).rows[0]
  // Always perform scrypt, including unknown accounts.
  const hash=user?.password_hash || await hashPassword('dummy-password-for-timing')
  if(!await verifyPassword(b.password,hash)||!user)fail('账号或密码错误',401)
  await cache.del(key); return issue(user.id,reply)
 })
 const auth=async(req:FastifyRequest)=>{const token=req.cookies.campus_session;if(!token)fail('请先登录',401);const id=await cache.get(tokenKey(token));if(!id)fail('会话已过期',401);req.account=(await db.query('SELECT id,username FROM accounts WHERE id=$1',[id])).rows[0];if(!req.account)fail('账号不存在',401)}
 app.get('/api/auth/me',{preHandler:auth},async req=>req.account)
 app.post('/api/auth/logout',async(req,reply)=>{if(req.cookies.campus_session)await cache.del(tokenKey(req.cookies.campus_session));reply.clearCookie('campus_session',{path:'/'});return {ok:true}})
 return auth
}
