import {test} from 'node:test'
import assert from 'node:assert/strict'
import Fastify from 'fastify'
import {PGlite} from '@electric-sql/pglite'
import {readFile,readdir} from 'node:fs/promises'
import {createServer} from 'node:http'
import {once} from 'node:events'
import {randomUUID} from 'node:crypto'
import {contentModule} from '../src/content.js'
import {cleanupUploads} from '../src/cleanup-uploads.js'
test('media proxy enforces approval/privacy, rejection deletes, cleanup keeps referenced pending',async()=>{
 const pg=new PGlite(),db={query:async(sql:string,params?:any[])=>({rows:(await pg.query(sql,params)).rows as any[]})}
 for(const name of (await readdir(new URL('../migrations/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort())await pg.exec(await readFile(new URL('../migrations/'+name,import.meta.url),'utf8'))
 const owner=randomUUID(),other=randomUUID(),upload=randomUUID(),post=randomUUID(),orphan=randomUUID(),kept=randomUUID()
 for(const [id,name] of [[owner,'owner'],[other,'other']])await db.query("INSERT INTO accounts(id,username,phone,password_hash) VALUES($1,$2,$2,'test')",[id,name])
 for(const id of [upload,orphan,kept])await db.query("INSERT INTO uploads(id,account_id,object_key,url,mime,created_at) VALUES($1::uuid,$2,$1::text,'http://old-public/image','image/png',now()-interval '8 days')",[id,owner])
 await db.query("INSERT INTO posts(id,account_id,channel,body,upload_id) VALUES($1,$2,'friends','test',$3)",[post,owner,upload])
 await db.query("INSERT INTO posts(id,account_id,channel,body,upload_id) VALUES($1,$2,'forum','keep',$3)",[randomUUID(),owner,kept])
 const deleted:string[]=[];const server=createServer((req,res)=>{if(req.method==='DELETE')deleted.push(req.url!);res.setHeader('content-type','image/png');res.end(req.method==='GET'?'image-bytes':'')})
 server.listen(0,'127.0.0.1');await once(server,'listening')
 Object.assign(process.env,{NODE_ENV:'test',ADMIN_ACCOUNTS:'owner',S3_ENDPOINT:`http://127.0.0.1:${(server.address() as any).port}`,S3_ACCESS_KEY:'test',S3_SECRET_KEY:'test',S3_BUCKET:'test'})
 const app=Fastify();app.decorateRequest('account',null)
 const auth=async(req:any)=>{req.account={id:req.headers['x-user']||owner,username:req.headers['x-user']?'other':'owner'}}
 app.setErrorHandler((error:any,req,reply)=>reply.code(error.statusCode||500).send({error:error.message}))
 contentModule(app,db,auth,auth)
 try{
  assert.equal((await app.inject('/api/media/'+upload)).statusCode,404)
  await db.query("UPDATE uploads SET status='approved' WHERE id=$1",[upload])
  const approved=await app.inject('/api/media/'+upload);assert.equal(approved.statusCode,200);assert.equal(approved.body,'image-bytes');assert.equal(approved.headers['cache-control'],'private, no-store')
  assert.equal((await app.inject({url:'/api/media/'+upload,headers:{'x-user':other}})).statusCode,404)
  await db.query("UPDATE posts SET status='approved',channel='forum' WHERE id=$1",[post])
  assert.equal((await app.inject({url:'/api/media/'+upload,headers:{'x-user':other}})).statusCode,200)
  const feed=(await app.inject('/api/posts?channel=forum')).json();assert.equal(feed.find((p:any)=>p.id===post).url,'/api/media/'+upload)
  await db.query("UPDATE posts SET status='pending' WHERE id=$1",[post])
  const rejection=await app.inject({method:'POST',url:'/api/admin/review/'+post,payload:{type:'post',approved:false}});assert.equal(rejection.statusCode,200,rejection.body)
  assert.ok(deleted.some(url=>url.includes(upload)));assert.equal((await app.inject('/api/media/'+upload)).statusCode,404)
  assert.equal(await cleanupUploads(db),1);assert.ok(deleted.some(url=>url.includes(orphan)))
  assert.equal((await db.query('SELECT id FROM uploads WHERE id=$1',[kept])).rows.length,1)
 }finally{await app.close();server.close();await once(server,'close');await pg.close()}
})

