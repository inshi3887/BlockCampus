import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import type { DB } from './db.js'
import {authModule} from './auth.js'
import {identityModule} from './identity.js'
export interface Cache { get(k:string):Promise<string|null>; set(k:string,v:string,opts?:any):Promise<any>; del(k:string):Promise<any>; incr(k:string):Promise<number>; expire(k:string,s:number):Promise<any> }
export function createApp(db: DB, cache: Cache) {
 const app = Fastify({logger: process.env.NODE_ENV !== 'test', bodyLimit: 6*1024*1024})
 app.register(cookie); app.register(multipart, {limits:{fileSize:5*1024*1024, files:1}})
 app.decorateRequest('account', null)
 app.addHook('onRequest', async (req,reply) => {
   if (['POST','PUT','DELETE','PATCH'].includes(req.method) && req.headers.origin !== (process.env.APP_ORIGIN || 'http://127.0.0.1:5173')) return reply.code(403).send({error:'请求来源无效'})
   if (req.url.startsWith('/api/')) {
    const key=`rate:${req.ip}:${Math.floor(Date.now()/60000)}`; const n=await cache.incr(key); if(n===1) await cache.expire(key,65)
    if(n>180) return reply.code(429).send({error:'操作太频繁，请稍后重试'})
   }
 })
 app.setErrorHandler((err:any,req,reply)=>{ const status=err.statusCode || (err.name==='ZodError'?400:500); if(status===500) req.log.error(err); reply.code(status).send({error:status===500?'服务暂时不可用':err.message}) })
 app.get('/api/health',async()=>{await db.query('SELECT 1'); await cache.get('health'); return {ok:true}})
 const auth=authModule(app,db,cache)
 const play=identityModule(app,db,auth)
 return app
}
export function fail(message:string,statusCode=400):never { throw Object.assign(new Error(message),{statusCode}) }
declare module 'fastify' {interface FastifyRequest {account:any}}
