import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {once} from 'node:events'
import {putImage,initBucket} from '../src/storage.js'
test('AWS S3 SDK writes real HTTP objects, bucket policy and safe content types',async()=>{
 const requests:{url:string,body:Buffer,type:string|undefined}[]=[]
 const server=createServer(async(req,res)=>{const chunks=[];for await(const b of req)chunks.push(Buffer.from(b));requests.push({url:req.url||'',body:Buffer.concat(chunks),type:req.headers['content-type']});res.setHeader('ETag','"qa-etag"');res.end()})
 server.listen(0,'127.0.0.1');await once(server,'listening');const addr=server.address() as any
 Object.assign(process.env,{S3_ENDPOINT:`http://127.0.0.1:${addr.port}`,S3_ACCESS_KEY:'test-key',S3_SECRET_KEY:'test-secret',S3_BUCKET:'campus-test',S3_PUBLIC_URL:`http://127.0.0.1:${addr.port}/campus-test`})
 try{await initBucket();const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=','base64');const image=await putImage(bytes);assert.equal(image.mime,'image/png');assert.ok(image.key.startsWith('images/'));assert.ok(image.url.endsWith(image.key));assert.equal(requests.length,3);assert.ok(requests.some(r=>r.url.includes('policy')));assert.equal(requests[2].type,'image/png');assert.deepEqual(requests[2].body,bytes);await assert.rejects(putImage(Buffer.from('<svg>invalid</svg>')))}finally{server.close();await once(server,'close')}
})
