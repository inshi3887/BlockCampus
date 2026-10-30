import type {FastifyInstance} from 'fastify'
import {z} from 'zod'
import type {DB} from './db.js'
import {fail} from './app.js'
const pos=z.object({x:z.number().finite().min(-20000).max(20000),y:z.number().finite().min(-100).max(2000),z:z.number().finite().min(-20000).max(20000),yaw:z.number().finite()}).strict()
const color=z.string().regex(/^#[0-9a-fA-F]{6}$/)
const customSkin=z.string().max(100000).refine(s=>{if(!s.startsWith('data:image/png;base64,'))return false;const b=Buffer.from(s.slice(22),'base64');return b.length>=24&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&b.readUInt32BE(16)===64&&b.readUInt32BE(20)===64},'皮肤必须为64×64 PNG').nullable().optional()
const skin=z.object({gender:z.enum(['m','f']),seed:z.number().int().min(0).max(1000000),skin:color.optional(),hair:color.optional(),shirt:color.optional(),pants:color.optional(),shoes:color.optional(),hairStyle:z.enum(['short','long','bald']).optional(),longSleeve:z.boolean().optional(),shorts:z.boolean().optional(),glasses:z.boolean().optional(),dress:z.boolean().optional()}).strict()
export const saveSchema=z.object({profile:z.object({name:z.string().min(1).max(24),gender:z.enum(['m','f']),skinParams:skin,customSkin}).strict().optional(),lastPos:pos.nullable().optional(),settings:z.object({quality:z.enum(['low','medium','high']),reflect:z.boolean(),shadows:z.boolean(),timeSpeed:z.number().min(0).max(10),sensitivity:z.number().min(.1).max(5),showMinimap:z.boolean()}).strict().optional()}).strict()
export function saveModule(app:FastifyInstance,db:DB,play:any) {
 app.get('/api/save',{preHandler:play},async req=>{await db.query('INSERT INTO saves(account_id) VALUES($1) ON CONFLICT DO NOTHING',[req.account.id]);return (await db.query('SELECT version,schema_version,data FROM saves WHERE account_id=$1',[req.account.id])).rows[0]})
 app.put('/api/save',{preHandler:play},async req=>{const b=z.object({version:z.number().int().nonnegative(),schema_version:z.literal(1),data:saveSchema}).strict().parse(req.body);const r=await db.query('UPDATE saves SET data=$3,version=version+1,updated_at=now() WHERE account_id=$1 AND version=$2 RETURNING version,schema_version,data',[req.account.id,b.version,b.data]);if(!r.rows[0])fail('存档已在其他窗口更新，请重新读取',409);return r.rows[0]})
}
