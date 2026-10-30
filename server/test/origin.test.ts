import {test} from 'node:test'
import assert from 'node:assert/strict'
import {allowedOrigins} from '../src/config.js'
import {createApp} from '../src/app.js'
import type {DB} from '../src/db.js'
test('configured origin allow-list and local aliases',()=>{
 assert.deepEqual([...allowedOrigins({APP_ORIGIN:'http://localhost:5175'})],['http://localhost:5175','http://127.0.0.1:5175'])
 assert.deepEqual([...allowedOrigins({APP_ORIGIN:'https://game.example',APP_ALLOWED_ORIGINS:'https://ops.example'})],['https://game.example','https://ops.example'])
 for(const value of ['null','*','https://game.example/','https://game.example/path','ftp://game.example'])assert.throws(()=>allowedOrigins({APP_ORIGIN:value}))
})
test('writes accept local aliases and missing same-origin Origin, reject foreign origins',async()=>{
 process.env.NODE_ENV='test';process.env.APP_ORIGIN='http://127.0.0.1:5173';delete process.env.APP_ALLOWED_ORIGINS
 const db={query:async()=>({rows:[]})} as DB
 const cache={get:async()=>null,set:async()=>{},del:async()=>{},incr:async()=>1,expire:async()=>{}}
 const app=createApp(db,cache);app.post('/origin-probe',async()=>({ok:true}))
 try{
  for(const method of ['POST','PUT','PATCH','DELETE'] as const){
   for(const origin of ['http://localhost:5173','http://127.0.0.1:5173'])assert.notEqual((await app.inject({method,url:'/origin-probe',headers:{origin}})).statusCode,403)
   for(const origin of ['null','https://untrusted.example','http://localhost:9999','http://localhost.evil:5173'])assert.equal((await app.inject({method,url:'/origin-probe',headers:{origin}})).statusCode,403)
  }
  for(const headers of [{},{'sec-fetch-site':'same-origin'},{'sec-fetch-site':'none'}])assert.equal((await app.inject({method:'POST',url:'/origin-probe',headers})).statusCode,200)
  for(const site of ['cross-site','same-site'])assert.equal((await app.inject({method:'POST',url:'/origin-probe',headers:{'sec-fetch-site':site}})).statusCode,403)
 }finally{await app.close()}
})
