import {test} from 'node:test'
import assert from 'node:assert/strict'
import {saveSchema} from '../src/saves.js'
test('cloud save whitelist rejects economy and malformed coordinates',()=>{assert.ok(saveSchema.safeParse({lastPos:{x:0,y:1,z:0,yaw:0}}).success);for(const b of [{money:1000000},{points:100},{items:{hat:1}},{lastPos:{x:Infinity,y:0,z:0,yaw:0}}])assert.ok(!saveSchema.safeParse(b).success)})
