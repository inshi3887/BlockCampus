import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {S3Client,PutObjectCommand,GetBucketPolicyCommand,DeleteObjectCommand,DeleteBucketPolicyCommand,DeleteBucketCommand} from '@aws-sdk/client-s3'
import {initBucket,putImage} from '../src/storage.js'

// Opt-in test against a real S3 service. Uses and removes its own unique bucket.
test('real S3: repeatable init, signed upload, public images and denied anonymous writes',async()=>{
 const endpoint=process.env.S3_ENDPOINT
 assert.ok(endpoint&&process.env.S3_ACCESS_KEY&&process.env.S3_SECRET_KEY,'Set S3_ENDPOINT/S3_ACCESS_KEY/S3_SECRET_KEY for a real test service')
 const Bucket='blockcampus-check-'+randomUUID(),base=endpoint.replace(/\/$/,'')+'/'+Bucket
 const oldBucket=process.env.S3_BUCKET,oldPublic=process.env.S3_PUBLIC_URL
 process.env.S3_BUCKET=Bucket;process.env.S3_PUBLIC_URL=base
 const client=new S3Client({endpoint,region:process.env.S3_REGION||'us-east-1',forcePathStyle:true,credentials:{accessKeyId:process.env.S3_ACCESS_KEY!,secretAccessKey:process.env.S3_SECRET_KEY!}})
 const keys:string[]=[];let created=false
 async function anonymous(path:string,init?:RequestInit){return fetch(base+path,{...init,signal:AbortSignal.timeout(10000)})}
 try {
  await initBucket();created=true;await initBucket()
  const policy=await client.send(new GetBucketPolicyCommand({Bucket}))
  // S3 policies allow a single Action/Resource as either a string or an array.
  const statements=JSON.parse(policy.Policy!).Statement
  assert.equal(statements.length,1)
  const statement=statements[0]
  assert.equal(statement.Effect,'Allow');assert.equal(statement.Principal,'*')
  assert.deepEqual([statement.Action].flat(),['s3:GetObject'])
  assert.deepEqual([statement.Resource].flat(),[`arn:aws:s3:::${Bucket}/images/*`])
  const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=','base64')
  const image=await putImage(bytes);keys.push(image.key)
  const imageResponse=await anonymous('/'+image.key)
  assert.equal(imageResponse.status,200);assert.equal(imageResponse.headers.get('content-type'),'image/png')
  assert.deepEqual(Buffer.from(await imageResponse.arrayBuffer()),bytes)
  keys.push('private/check.txt');await client.send(new PutObjectCommand({Bucket,Key:'private/check.txt',Body:'private'}))
  for(const [path,options] of [
   ['/private/check.txt',undefined],
   ['?list-type=2',undefined],
   ['/images/unsigned.txt',{method:'PUT',body:'must not be accepted'}],
   ['/'+image.key,{method:'DELETE'}],
  ] as const){const response=await anonymous(path,options);await response.arrayBuffer();assert.equal(response.status,403,`${options?.method||'GET'} ${path} must be forbidden`)}
  console.log('REAL S3 PASS: init twice; policy readback; signed PNG upload; anonymous GET bytes match; private GET/list/PUT/DELETE all 403')
 }finally{
  try{if(created){for(const Key of [...keys,'images/unsigned.txt'])await client.send(new DeleteObjectCommand({Bucket,Key}));await client.send(new DeleteBucketPolicyCommand({Bucket}));await client.send(new DeleteBucketCommand({Bucket}))}}
  finally{client.destroy();if(oldBucket===undefined)delete process.env.S3_BUCKET;else process.env.S3_BUCKET=oldBucket;if(oldPublic===undefined)delete process.env.S3_PUBLIC_URL;else process.env.S3_PUBLIC_URL=oldPublic}
 }
})
