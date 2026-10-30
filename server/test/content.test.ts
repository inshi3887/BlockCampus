import {test} from 'node:test'
import assert from 'node:assert/strict'
import {imageType} from '../src/storage.js'
import {blocked} from '../src/content.js'
test('upload magic validation rejects SVG/HTML and recognizes PNG',()=>{assert.equal(imageType(Buffer.from([137,80,78,71,13,10,26,10])),'image/png');assert.throws(()=>imageType(Buffer.from('<svg onload="alert(1)">')));assert.ok(blocked('赌博广告'));assert.ok(!blocked('今天在校园拍了照')))})
