import {isIP} from 'node:net'
export function allowedOrigins(env:NodeJS.ProcessEnv=process.env) {
 const primary=env.APP_ORIGIN||'http://127.0.0.1:5173'
 const values=[primary,...(env.APP_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean)]
 // Default local development aliases follow the configured port and protocol.
 const local=new URL(primary)
 if(!env.APP_ALLOWED_ORIGINS&&['localhost','127.0.0.1'].includes(local.hostname)){
  local.hostname=local.hostname==='localhost'?'127.0.0.1':'localhost';values.push(local.origin)
 }
 for(const value of values){const url=new URL(value);if(!['http:','https:'].includes(url.protocol)||url.origin!==value)throw new Error('Origin allow-list entries must be exact HTTP(S) origins without trailing slash')}
 return new Set(values)
}
export function validateConfig(){
 const required=['DATABASE_URL','REDIS_URL','IDENTITY_HASH_SECRET','S3_ENDPOINT','S3_ACCESS_KEY','S3_SECRET_KEY','S3_BUCKET','S3_PUBLIC_URL','APP_ORIGIN']
 for(const key of required)if(!process.env[key])throw new Error(`Missing configuration: ${key}`)
 if(process.env.IDENTITY_HASH_SECRET!.length<32||process.env.IDENTITY_HASH_SECRET!.startsWith('replace-'))throw new Error('Set IDENTITY_HASH_SECRET to a random secret of at least 32 characters')
 allowedOrigins();trustedProxies()
}

export function trustedProxies(env:NodeJS.ProcessEnv=process.env){
 const values=(env.TRUSTED_PROXY??'127.0.0.1,::1').split(',').map(s=>s.trim()).filter(Boolean)
 for(const value of values){const [ip,bits,...extra]=value.split('/'),version=isIP(ip);if(!version||extra.length||(bits!==undefined&&(!/^\d+$/.test(bits)||Number(bits)>(version===4?32:128))))throw new Error('TRUSTED_PROXY requires explicit IP addresses or CIDR networks')}
 return values
}
