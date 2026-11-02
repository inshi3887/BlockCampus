import {S3Client,PutObjectCommand,CreateBucketCommand,DeleteBucketPolicyCommand,GetObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3'
import {randomUUID} from 'node:crypto'
import {fail} from './app.js'
function client(){return new S3Client({endpoint:process.env.S3_ENDPOINT,region:process.env.S3_REGION||'us-east-1',forcePathStyle:true,credentials:{accessKeyId:process.env.S3_ACCESS_KEY||'',secretAccessKey:process.env.S3_SECRET_KEY||''}})}
export function imageType(bytes:Buffer) {if(bytes.length>=8&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')return 'image/webp';fail('只允许 PNG/JPEG/WebP 图片')}
export async function putImage(bytes:Buffer) {const mime=imageType(bytes);const key='images/'+randomUUID()+'.'+mime.split('/')[1];const s3=client();try{await s3.send(new PutObjectCommand({Bucket:process.env.S3_BUCKET,Key:key,Body:bytes,ContentType:mime,CacheControl:'private,no-store'}))}finally{s3.destroy()}return {key,mime,url:process.env.S3_PUBLIC_URL+'/'+key}}
export async function initBucket(){const s3=client();try{const Bucket=process.env.S3_BUCKET!;try{await s3.send(new CreateBucketCommand({Bucket}))}catch(e:any){if(!['BucketAlreadyOwnedByYou','BucketAlreadyExists'].includes(e.name))throw e}try{await s3.send(new DeleteBucketPolicyCommand({Bucket}))}catch(e:any){if(e.name!=='NoSuchBucketPolicy')throw e}}finally{s3.destroy()}}

export async function readImage(key:string){const s3=client();try{
 const object=await s3.send(new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key:key}))
 const body=object.Body as import('node:stream').Readable
 body.once('close',()=>s3.destroy());body.once('error',()=>s3.destroy())
 return body
}catch(error:any){s3.destroy();if(error.name==='NoSuchKey'||error.$metadata?.httpStatusCode===404)fail('图片不存在',404);throw error}}
export async function deleteImage(key:string){const s3=client();try{await s3.send(new DeleteObjectCommand({Bucket:process.env.S3_BUCKET,Key:key}))}finally{s3.destroy()}}
