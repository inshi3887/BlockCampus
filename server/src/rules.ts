export const RULES={normalCap:20,adCap:5,overlapCap:63,normalExpected:24,adExpected:87.95,pointsPerLesson:10,lessonSeconds:600,heartbeatSeconds:300}
export const levelGold=(from:number)=>from<=4?11-from:2
export function growth(points:number) {let level=1;while(points>=5*level*(level+1))level++;return {level,progress:points-5*(level-1)*level,required:10*level}}
export function drop(kind:'normal'|'ad',r:number,s:number) {if(kind==='ad'&&r<.005)return {gold_copper:10000,silver_copper:0,copper:0};if(r<(kind==='ad'?.205:.1))return {gold_copper:0,silver_copper:s<.5?100:200,copper:0};return {gold_copper:0,silver_copper:0,copper:10}}
export const CATALOG=[
 {id:'cap',name:'木棉红帽',kind:'appearance',currency:'gold_copper',price:10000,unlock:{level:1}},
 {id:'frame',name:'校园纪念相框',kind:'photography',currency:'gold_copper',price:20000,unlock:{level:1}},
 {id:'plant',name:'宿舍绿植',kind:'decoration',currency:'gold_copper',price:10000,unlock:{level:1}},
 {id:'profile5',name:'五级校友名片',kind:'appearance',currency:'gold_copper',price:0,unlock:{level:5}},
 {id:'copper-border',name:'朋友圈木纹边框',kind:'appearance',currency:'copper',price:100,consumable:true,unlock:{level:1}},
 {id:'silver-sticker',name:'银色校园贴纸',kind:'photography',currency:'silver_copper',price:10000,consumable:true,unlock:{level:1}}
] as const
