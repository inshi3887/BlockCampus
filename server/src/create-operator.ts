import {randomUUID} from 'node:crypto'
import {pool} from './db.js'
import {hashPassword} from './auth.js'
const username=process.env.OPERATOR_USERNAME,password=process.env.OPERATOR_PASSWORD,phone=process.env.OPERATOR_PHONE
if(!username||!password||password.length<12||!/^1[3-9]\d{9}$/.test(phone||''))throw Error('设置 OPERATOR_USERNAME / OPERATOR_PASSWORD（至少12位）/ OPERATOR_PHONE，然后运行此脚本')
if(!(process.env.ADMIN_ACCOUNTS||'').split(',').includes(username))throw Error('运营账号必须在 ADMIN_ACCOUNTS 中配置')
await pool.query('INSERT INTO accounts(id,username,phone,password_hash) VALUES($1,$2,$3,$4)',[randomUUID(),username,phone,await hashPassword(password)])
await pool.end();console.log('Operator provisioned')
