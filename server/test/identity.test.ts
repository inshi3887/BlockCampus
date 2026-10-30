import {test} from 'node:test'
import assert from 'node:assert/strict'
import {parseIdentity,allowed,chinaTime} from '../src/identity.js'
test('identity checksum and calendar date',()=>{assert.equal(parseIdentity('11010519491231002X'),'1949-12-31');assert.throws(()=>parseIdentity('110105194912310020'))})
test('China timezone, adult/minor windows and daily budget',()=>{assert.equal(chinaTime(new Date('2026-10-30T12:00:00Z')).hour,20);assert.ok(allowed('2000-01-01',4000,new Date('2026-10-29T00:00Z')));assert.ok(allowed('2015-01-01',0,new Date('2026-10-30T12:00Z')));assert.ok(!allowed('2015-01-01',3600,new Date('2026-10-30T12:00Z')));assert.ok(!allowed('2015-01-01',0,new Date('2026-10-30T13:00Z')));assert.ok(!allowed('2015-01-01',0,new Date('2026-10-29T12:00Z')))})
