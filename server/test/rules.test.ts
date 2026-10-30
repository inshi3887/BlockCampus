import {test} from 'node:test'
import assert from 'node:assert/strict'
import {drop,growth,levelGold,RULES,CATALOG} from '../src/rules.js'
test('silver sticker costs 100 copper units (1 silver)',()=>{
 const sticker=CATALOG.find(item=>item.id==='silver-sticker')
 assert.ok(sticker)
 assert.equal(sticker.currency,'silver_copper')
 assert.equal(sticker.price,100)
})
test('GDD upgrade ladder and cumulative curve',()=>{assert.deepEqual([1,2,3,4,5,6].map(levelGold),[10,9,8,7,2,2]);assert.equal(growth(10).level,2);assert.equal(growth(100).level,5);assert.equal(growth(150).level,6);assert.equal(growth(0).required,10);assert.equal(RULES.overlapCap,63)})
test('10,000 stratified draws exactly match both GDD expectations',()=>{for(const [kind,expected] of [['normal',24],['ad',87.95]] as const){let sum=0;for(let i=0;i<10000;i++){const d=drop(kind,(i+.5)/10000,i%2===0?.25:.75);sum+=d.gold_copper+d.silver_copper+d.copper}assert.equal(sum/10000,expected)}})
test('catalog has only cosmetic goods and explicit unlock conditions',()=>{for(const item of CATALOG){assert.ok(['appearance','photography','decoration'].includes(item.kind));assert.ok(Number.isInteger(item.price));assert.ok(item.unlock.level>=1)}})
