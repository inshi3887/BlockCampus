export function validateConfig(){
 const required=['DATABASE_URL','REDIS_URL','IDENTITY_HASH_SECRET','S3_ENDPOINT','S3_ACCESS_KEY','S3_SECRET_KEY','S3_BUCKET','S3_PUBLIC_URL','APP_ORIGIN']
 for(const key of required)if(!process.env[key])throw new Error(`Missing configuration: ${key}`)
 if(process.env.IDENTITY_HASH_SECRET!.length<32||process.env.IDENTITY_HASH_SECRET!.startsWith('replace-'))throw new Error('Set IDENTITY_HASH_SECRET to a random secret of at least 32 characters')
 const origin=new URL(process.env.APP_ORIGIN!);if(origin.origin!==process.env.APP_ORIGIN)throw new Error('APP_ORIGIN must be an exact URL origin without trailing slash')
}
