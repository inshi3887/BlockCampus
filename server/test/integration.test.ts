import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile,readdir} from 'node:fs/promises'
import {randomUUID} from 'node:crypto'
import {PGlite} from '@electric-sql/pglite'
import pg from 'pg'
import {createClient} from 'redis'
import {createApp} from '../src/app.js'
import {LANDMARKS} from '../src/places.js'
import type {DB} from '../src/db.js'
process.env.NODE_ENV='test';process.env.IDENTITY_HASH_SECRET='integration-only-secret-with-32-characters';process.env.ADMIN_ACCOUNTS='operator'
class TestCache {
 values=new Map<string,string>()
 async get(k:string){return this.values.get(k)||null}async set(k:string,v:string){this.values.set(k,v)}async del(k:string){this.values.delete(k)}async incr(k:string){const n=Number(this.values.get(k)||0)+1;this.values.set(k,''+n);return n}async expire(){}
}
test('full PostgreSQL API: auth/save/economy/lessons/moderation/ads and abuse boundaries',async()=>{
 const native=process.env.DATABASE_URL?new pg.Pool({connectionString:process.env.DATABASE_URL}):null
 const embedded=native?null:new PGlite()
 let tail=Promise.resolve()
 const raw:DB=native||{query:async(sql,params)=>{const r=await embedded!.query(sql,params);return {rows:r.rows as any[],rowCount:r.affectedRows}}}
 const db:DB=native||Object.assign(raw,{connect:async()=>{let unlock!:()=>void;const next=new Promise<void>(r=>unlock=r),previous=tail;tail=next;await previous;return {...raw,release:unlock}}})
 for(const name of (await readdir(new URL('../migrations/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort()){const sql=await readFile(new URL('../migrations/'+name,import.meta.url),'utf8');if(embedded)await embedded.exec(sql);else if(!(await raw.query("SELECT to_regclass('accounts') AS exists")).rows[0].exists||name!=='001_accounts.sql'){try{await raw.query(sql)}catch(e:any){if(e.code!=='42P07')throw e}}}
 const realCache=process.env.REDIS_URL?createClient({url:process.env.REDIS_URL}):null;if(realCache)await realCache.connect();const cache=realCache||new TestCache(),app=createApp(db,cache);await app.ready()
 let requests=0
 async function call(method:any,url:string,body?:any,cookie?:string){requests++;return app.inject({method,url,headers:{origin:'http://127.0.0.1:5173',...(cookie?{cookie}:{})},payload:body,remoteAddress:'127.0.0.'+(1+Math.floor(requests/100))})}
 const suffix=randomUUID().slice(0,6),username='student_'+suffix
 try {
 if(realCache){const ttlKey='qa:ttl:'+suffix;await realCache.set(ttlKey,'1',{EX:60});assert.ok((await realCache.ttl(ttlKey))>0);await realCache.del(ttlKey)}
 const reg=await call('POST','/api/auth/register',{username,password:'test-password-123',phone:'139'+String(Date.now()).slice(-8)});assert.equal(reg.statusCode,200,reg.body);const cookie=reg.cookies[0].name+'='+reg.cookies[0].value,id=reg.json().id
 assert.equal((await call('GET','/api/economy',undefined,cookie)).statusCode,403)
 assert.equal((await call('POST','/api/auth/register',{username:'operator',password:'test-password-123',phone:'13700000000'})).statusCode,403)
 assert.equal((await call('POST','/api/identity',{name:'测试姓名',identity:'11010519491231002X'},cookie)).statusCode,200)
 assert.equal((await call('GET','/api/auth/me',undefined,cookie)).json().username,username)
 assert.equal((await app.inject({method:'GET',url:'/api/save',headers:{cookie,'x-campus-account':randomUUID()}})).statusCode,401)
 const forged=await app.inject({method:'POST',url:'/api/shop/buy',payload:{sku:'cap',key:randomUUID()},headers:{cookie,origin:'https://untrusted.example'}});assert.equal(forged.statusCode,403)
 const save=(await call('GET','/api/save',undefined,cookie)).json();assert.equal(save.version,0)
 assert.equal((await call('PUT','/api/save',{version:0,schema_version:1,data:{money:999999}},cookie)).statusCode,400)
 assert.equal((await call('PUT','/api/save',{version:0,schema_version:1,data:{lastPos:{x:0,y:0,z:0,yaw:0}}},cookie)).statusCode,200)
 assert.equal((await call('PUT','/api/save',{version:0,schema_version:1,data:{}},cookie)).statusCode,409)
 const place=LANDMARKS.find(p=>p.id==='school:gdut-library')!,key=randomUUID()
 assert.equal((await call('POST','/api/progress/discover',{landmark:place.id,position:{x:place.x,z:place.z}},cookie)).statusCode,200)
 assert.ok((await call('GET','/api/progress',undefined,cookie)).json().discovered.includes(place.id))
 const photoBody={key,landmark:place.id,position:{x:place.x,z:place.z}}
 const first=await call('POST','/api/photos/event',photoBody,cookie);assert.equal(first.statusCode,200,first.body)
 const duplicate=await call('POST','/api/photos/event',photoBody,cookie);assert.deepEqual(duplicate.json(),first.json())
 assert.equal((await call('POST','/api/photos/event',{...photoBody,key:randomUUID()},cookie)).statusCode,429)
 for(let i=1;i<22;i++){await raw.query("UPDATE photo_events SET created_at=now()-interval '11 seconds' WHERE account_id=$1",[id]);const response=await call('POST','/api/photos/event',{...photoBody,key:randomUUID()},cookie);assert.equal(response.statusCode,200,response.body);if(i>=20)assert.equal(response.json().capped,true)}
 assert.equal((await raw.query("SELECT count FROM daily_drops WHERE account_id=$1 AND kind='normal'",[id])).rows[0].count,20)
 await raw.query('UPDATE wallets SET gold_copper=10000 WHERE account_id=$1',[id])
 const buyKey=randomUUID();const buys=await Promise.all([call('POST','/api/shop/buy',{key:buyKey,sku:'cap'},cookie),call('POST','/api/shop/buy',{key:buyKey,sku:'cap'},cookie)])
 for(const result of buys)assert.equal(result.statusCode,200,result.body)
 assert.equal(Number((await raw.query('SELECT gold_copper FROM wallets WHERE account_id=$1',[id])).rows[0].gold_copper),0)
 await raw.query('UPDATE wallets SET gold_copper=20000 WHERE account_id=$1',[id]);const distinct=await Promise.all([call('POST','/api/shop/buy',{key:randomUUID(),sku:'frame'},cookie),call('POST','/api/shop/buy',{key:randomUUID(),sku:'plant'},cookie)]);assert.deepEqual(distinct.map(r=>r.statusCode).sort(),[200,400]);assert.ok(Number((await raw.query('SELECT gold_copper FROM wallets WHERE account_id=$1',[id])).rows[0].gold_copper)>=0)
 assert.equal((await call('POST','/api/shop/buy',{key:randomUUID(),sku:'profile5'},cookie)).statusCode,400)
 assert.equal((await call('POST','/api/economy/convert',{gold:1},cookie)).statusCode,404)
 const lesson=(await call('POST','/api/lessons/start',{key:randomUUID(),seat:1,speed:1},cookie)).json();assert.ok(lesson.id)
 assert.equal((await call('POST',`/api/lessons/${lesson.id}/event`,{key:randomUUID(),type:'finish'},cookie)).statusCode,400)
 await raw.query("UPDATE lessons SET started_at=now()-interval '601 seconds',watched_seconds=600 WHERE id=$1",[lesson.id])
 const finishKey=randomUUID();const finish=await call('POST',`/api/lessons/${lesson.id}/event`,{key:finishKey,type:'finish'},cookie);assert.equal(finish.statusCode,200,finish.body);assert.equal(finish.json().points,10)
 assert.deepEqual((await call('POST',`/api/lessons/${lesson.id}/event`,{key:finishKey,type:'finish'},cookie)).json(),finish.json())
 const interrupted=(await call('POST','/api/lessons/start',{key:randomUUID(),seat:2,speed:1.25},cookie)).json()
 await raw.query("UPDATE lessons SET last_seen=now()-interval '121 seconds' WHERE id=$1",[interrupted.id]);assert.equal((await call('POST',`/api/lessons/${interrupted.id}/event`,{key:randomUUID(),type:'pulse'},cookie)).json().status,'interrupted')
 const confirmation=(await call('POST','/api/lessons/start',{key:randomUUID(),seat:3,speed:1},cookie)).json()
 await raw.query("UPDATE lessons SET confirmed_at=now()-interval '301 seconds',last_seen=now()-interval '15 seconds' WHERE id=$1",[confirmation.id]);const pulse=(await call('POST',`/api/lessons/${confirmation.id}/event`,{key:randomUUID(),type:'pulse'},cookie)).json();assert.equal(pulse.watched,0);assert.equal(pulse.needsConfirm,true)
 await call('POST',`/api/lessons/${confirmation.id}/event`,{key:randomUUID(),type:'confirm'},cookie)
 await call('POST',`/api/lessons/${confirmation.id}/event`,{key:randomUUID(),type:'hidden'},cookie)
 const hidden=(await call('POST',`/api/lessons/${confirmation.id}/event`,{key:randomUUID(),type:'pulse'},cookie)).json();assert.equal(hidden.hidden,true)
 await raw.query("UPDATE lessons SET hidden_at=now()-interval '121 seconds' WHERE id=$1",[confirmation.id]);assert.equal((await call('POST',`/api/lessons/${confirmation.id}/event`,{key:randomUUID(),type:'visible'},cookie)).json().status,'interrupted')
 assert.equal((await call('POST','/api/posts',{key:randomUUID(),channel:'forum',body:'赌博'},cookie)).statusCode,400)
 const post=(await call('POST','/api/posts',{key:randomUUID(),channel:'forum',body:'图书馆真好看'},cookie)).json();assert.equal(post.status,'pending')
 assert.equal((await call('GET','/api/admin/review',undefined,cookie)).statusCode,403)
 // Operator is provisioned directly in test DB, never granted by a client-supplied role.
 const adminId=randomUUID();await raw.query("INSERT INTO accounts(id,username,phone,password_hash) VALUES($1,'operator',$2,'test')",[adminId,'138'+String(Date.now()).slice(-8)])
 await cache.set('unused','');const {tokenKey}=await import('../src/auth.js');await cache.set(tokenKey('test-admin-session'),adminId);const adminCookie='campus_session=test-admin-session'
 const review=await call('POST','/api/admin/review/'+post.id,{type:'post',approved:true},adminCookie);assert.equal(review.statusCode,200,review.body)
 assert.equal((await call('POST','/api/posts/'+post.id+'/like',{},cookie)).statusCode,200)
 assert.equal((await call('POST','/api/posts/'+post.id+'/like',{},cookie)).statusCode,200)
 assert.equal((await raw.query('SELECT count(*)::int AS n FROM likes WHERE post_id=$1',[post.id])).rows[0].n,1)
 const upload=randomUUID(),ad=randomUUID();await raw.query("INSERT INTO uploads VALUES($1,$2,'test.png','http://localhost/test.png','image/png','approved',now())",[upload,id]);await raw.query("INSERT INTO ads VALUES($1,'内测广告','school:gdut-lightbox','school:gdut-library',$2,now()-interval '1 day',now()+interval '1 day',true)",[ad,upload])
 assert.equal((await call('GET','/api/ads')).json().length,1)
 await raw.query("UPDATE photo_events SET created_at=now()-interval '11 seconds' WHERE account_id=$1",[id]);const adCapture=(await call('POST','/api/photos/event',{...photoBody,key:randomUUID()},cookie)).json();assert.equal(adCapture.awaitingPublication,true);assert.equal(adCapture.reward,null);assert.equal(adCapture.adSlot,'school:gdut-lightbox');assert.equal((await raw.query("SELECT count FROM daily_drops WHERE account_id=$1 AND kind='normal'",[id])).rows[0].count,20)
 for(let i=0;i<6;i++){const eventId=randomUUID();await raw.query("INSERT INTO photo_events(id,account_id,landmark,campaign_id) VALUES($1,$2,'school:gdut-library',$3)",[eventId,id,ad]);const p=(await call('POST','/api/posts',{key:randomUUID(),channel:'friends',body:'校园广告打卡'+i,uploadId:upload,photoEvent:eventId,adSlot:'school:gdut-lightbox'},cookie)).json();assert.equal(p.status,'pending');const r=await call('POST','/api/admin/review/'+p.id,{type:'post',approved:true},adminCookie);assert.equal(r.statusCode,200,r.body);assert.equal(r.json().settlement?.capped,i===5?true:undefined);await call('POST','/api/admin/review/'+p.id,{type:'post',approved:true},adminCookie)}
 assert.equal((await raw.query("SELECT count FROM daily_drops WHERE account_id=$1 AND kind='ad'",[id])).rows[0].count,5)
 const other=randomUUID();await raw.query("INSERT INTO accounts(id,username,phone,password_hash) VALUES($1,$2,$3,'test')",[other,'other_'+suffix,'136'+String(Date.now()).slice(-8)]);await raw.query("INSERT INTO identities(account_id,identity_hash,birth_date) VALUES($1,$2,'2000-01-01')",[other,'fake-'+suffix]);await cache.set(tokenKey('other-session'),other);const otherCookie='campus_session=other-session'
 assert.equal((await call('GET','/api/posts?channel=friends',undefined,otherCookie)).json().length,0)
 assert.ok((await call('GET','/api/posts?channel=forum',undefined,otherCookie)).json().some((p:any)=>p.id===post.id))
 const economy=(await call('GET','/api/economy',undefined,cookie)).json();assert.equal(economy.points,10);assert.equal(economy.level,2);assert.ok(economy.inventory.includes('cap'))
 await call('POST','/api/auth/logout',{},cookie);assert.equal((await call('GET','/api/auth/me',undefined,cookie)).statusCode,401)
 console.log('API integration completed:',requests,'requests; storage:',native?'PostgreSQL':'embedded PostgreSQL/PGlite')
 } finally {await app.close();if(embedded)await embedded.close();if(native)await native.end();if(realCache)await realCache.quit()}
})
