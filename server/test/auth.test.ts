import {test} from 'node:test'
import assert from 'node:assert/strict'
import {hashPassword,verifyPassword,tokenKey} from '../src/auth.js'
test('scrypt password verification and session key hashing',async()=>{const hash=await hashPassword('strong-password');assert.equal(await verifyPassword('strong-password',hash),true);assert.equal(await verifyPassword('wrong-password',hash),false);assert.notEqual(tokenKey('secret'),'session:secret')})
