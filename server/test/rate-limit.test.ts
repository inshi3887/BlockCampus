import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createApp,type Cache} from '../src/app.js'
import {trustedProxies} from '../src/config.js'
process.env.NODE_ENV='test'
function cache(){const counts=new Map<string,number>();return {counts,get:async()=>null,set:async()=>{},del:async()=>{},expire:async()=>{},incr:async(k:string)=>{const n=(counts.get(k)||0)+1;counts.set(k,n);return n}}}
const db={query:async()=>({rows:[]})}
test('trusted proxy isolates forwarded clients, ignores spoofing and health never counts',async()=>{
 assert.deepEqual(trustedProxies({}),['127.0.0.1','::1']);assert.throws(()=>trustedProxies({TRUSTED_PROXY:'true'}));assert.deepEqual(trustedProxies({TRUSTED_PROXY:'10.0.0.0/8'}),['10.0.0.0/8'])
 const c=cache(),app=createApp(db,c);app.get('/api/probe',async req=>({ip:req.ip}))
 try{
  for(let i=0;i<181;i++)assert.equal((await app.inject('/api/health')).statusCode,200)
  assert.equal(c.counts.size,0)
  for(let i=0;i<180;i++)assert.equal((await app.inject({url:'/api/probe',headers:{'x-forwarded-for':'198.51.100.1'}})).statusCode,200)
  assert.equal((await app.inject({url:'/api/probe',headers:{'x-forwarded-for':'198.51.100.1'}})).statusCode,429)
  const other=await app.inject({url:'/api/probe',headers:{'x-forwarded-for':'198.51.100.2'}});assert.equal(other.statusCode,200);assert.equal(other.json().ip,'198.51.100.2')
  const spoof=await app.inject({url:'/api/probe',remoteAddress:'192.0.2.2',headers:{'x-forwarded-for':'198.51.100.3'}});assert.equal(spoof.json().ip,'192.0.2.2')
 }finally{await app.close()}
})
test('login IP and username counters independently stop rotating usernames or IPs',async()=>{
 const app=createApp(db,cache())
 const login=(ip:string,username:string)=>app.inject({method:'POST',url:'/api/auth/login',headers:{'x-forwarded-for':ip},payload:{username,password:'wrong-password'}})
 try{
  for(let i=0;i<10;i++)assert.equal((await login('198.51.100.'+(i+1),'target')).statusCode,401)
  assert.equal((await login('198.51.100.99','target')).statusCode,429)
  for(let i=0;i<10;i++)assert.equal((await login('203.0.113.1','name_'+i)).statusCode,401)
  assert.equal((await login('203.0.113.1','fresh_name')).statusCode,429)
 }finally{await app.close()}
})
test('Redis increment/expiry failures allow requests and login attempts without 500',async()=>{
 for(const failure of ['incr','expire'] as const){const c=cache();c[failure]=async()=>{throw new Error('Redis offline')};const app=createApp(db,c as Cache)
 try{assert.equal((await app.inject('/api/places')).statusCode,200);const r=await app.inject({method:'POST',url:'/api/auth/login',payload:{username:'student',password:'wrong-password'}});assert.equal(r.statusCode,401,r.body)}finally{await app.close()}}
})
