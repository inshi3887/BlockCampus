import {allowedOrigins,trustedProxies} from './config.js'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import type { DB } from './db.js'
import {authModule} from './auth.js'
import {identityModule} from './identity.js'
import {saveModule} from './saves.js'
import {economyModule} from './economy.js'
import {contentModule} from './content.js'
import {adsModule} from './ads.js'
import {progressModule} from './progress.js'
export interface Cache { get(k:string):Promise<string|null>; set(k:string,v:string,opts?:any):Promise<any>; del(k:string):Promise<any>; incr(k:string):Promise<number>; expire(k:string,s:number):Promise<any> }
export function createApp(db: DB, cache: Cache) {
 const origins=allowedOrigins()
 const app = Fastify({trustProxy:trustedProxies(),logger: process.env.NODE_ENV !== 'test', bodyLimit: 6*1024*1024})
 app.register(cookie); app.register(multipart, {limits:{fileSize:5*1024*1024, files:1}})
 app.decorateRequest('account', null)
 app.addHook('onRequest', async (req,reply) => {
   if (['POST','PUT','DELETE','PATCH'].includes(req.method)) {
    const origin=req.headers.origin,site=req.headers['sec-fetch-site']
    if(origin!==undefined ? !origins.has(origin) : site!==undefined&&!['same-origin','none'].includes(String(site))) return reply.code(403).send({error:'请求来源无效'})
   }
   if (req.url.startsWith('/api/')&&req.url.split('?')[0]!=='/api/health') {
    let n=0
    try{const key=`rate:${req.ip}:${Math.floor(Date.now()/60000)}`; n=await cache.incr(key); if(n===1) await cache.expire(key,65)}catch(error){n=0;req.log.warn({err:error},'Redis rate limit unavailable; allowing request')}
    if(n>180) return reply.code(429).send({error:'操作太频繁，请稍后重试'})
   }
 })
 app.setErrorHandler((err:any,req,reply)=>{ const status=err.statusCode || (err.name==='ZodError'?400:500); if(status===500) req.log.error(err); reply.code(status).send({error:status===500?'服务暂时不可用':err.message}) })
 app.get('/api/health',async()=>{await db.query('SELECT 1'); await cache.get('health'); return {ok:true}})
 const auth=authModule(app,db,cache)
 const play=identityModule(app,db,auth)
 saveModule(app,db,play)
 economyModule(app,db,play)
 contentModule(app,db,play,auth)
 adsModule(app,db,play,auth)
 progressModule(app,db,play)
 return app
}
export function fail(message:string,statusCode=400):never { throw Object.assign(new Error(message),{statusCode}) }
declare module 'fastify' {interface FastifyRequest {account:any}}
