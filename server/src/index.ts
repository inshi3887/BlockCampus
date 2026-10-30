import {createClient} from 'redis'
import {pool} from './db.js'
import {createApp} from './app.js'
import {validateConfig} from './config.js'
validateConfig()
const cache=createClient({url:process.env.REDIS_URL}); cache.on('error',e=>console.error('Redis unavailable',e.message)); await cache.connect()
const app=createApp(pool,cache)
await app.listen({port:Number(process.env.PORT||3001),host:'127.0.0.1'})
for(const signal of ['SIGINT','SIGTERM']) process.on(signal,async()=>{await app.close(); await cache.quit(); await pool.end(); process.exit(0)})
