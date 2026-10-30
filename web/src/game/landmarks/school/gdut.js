import {Character,makeSkinCanvas} from '../../character.js'
import {project} from '../../geo.js'
// 示意校园：配色、方块体量参考岭南校园；并非实测建筑复刻。
const lat=23.046,lon=113.401
const origin=project(lat,lon)
function location(dx,dz){ // linear inversion in the uncompressed Guangzhou core
 return {lat:lat-dz/(110.574*200),lon:lon+dx/(111.32*Math.cos(23.118*Math.PI/180)*200)}
}
function ground(b,ctx,w=24,d=20){b.box(-w,-.15,-d,w,.1,d,0xa4ae89,{mat:'stone',solid:false});ctx.platform({x0:-w,z0:-d,x1:w,z1:d,y:.1});ctx.landOverride(-w,-d,w,d)}
function shell(b,ctx,name,w=14,d=10,h=7){ground(b,ctx,w+4,d+4);b.box(-w,0,-d,w,.3,d,0xb8b6a5,{mat:'stone',solid:false});ctx.platform({x0:-w,z0:-d,x1:w,z1:d,y:.3});b.box(-w,.3,-d,-w+.5,h,d,0xd9ccb1);b.box(w-.5,.3,-d,w,h,d,0xd9ccb1);b.box(-w,.3,-d,w,h,-d+.5,0xe5d8b8);b.box(-w,.3,d-.5,-2.5,h,d,0xd9ccb1);b.box(2.5,.3,d-.5,w,h,d,0xd9ccb1);b.box(-w,h,d-.6,w,h+1,d+.2,0x955647,'brick');b.box(-w,h,-d,w,h+.4,d,0xa36d51,{mat:'roof',solid:false});b.sign(name,0,h-1,d+.1,1,0,{bg:'#203f38',fg:'#ffe6a1'});for(let x=-w+2;x<w-1;x+=4)b.box(x,2,-d-.02,x+2,4,-d+.05,0x8db1ae,{mat:'window',solid:false})}
export function buildGate(b,ctx){ground(b,ctx,40,25);for(const x of [-17,17]){b.box(x-2,0,-2,x+2,9,2,0xbb9d75,'stone');b.box(x-2.5,9,-2.5,x+2.5,10,2.5,0x905b42,'roof')}b.box(-19,7,-2,19,9,2,0xd8c7a0);b.sign('广东工业大学',0,8,2.05,1.4,0,{bg:'#d8c7a0',fg:'#69412c'});b.sign('学有所成 · 行有所见',0,5,-2.05,.6,Math.PI,{bg:'#284c40',fg:'#eadcb6'});for(let x=-34;x<=34;x+=4){if(Math.abs(x)<20)continue;b.box(x,0,-1,x+.3,2,.3,0x6c7b6b,'stone')}ctx.crowd(0,12,22,10,8)}
export function buildClassroom(b,ctx){shell(b,ctx,'教学楼 · 高教授课堂',15,10,7);b.box(-6,.3,-8,6,.8,-5,0x92724c,'wood');ctx.platform({x0:-6,z0:-8,x1:6,z1:-5,y:.8});b.box(-10,2,-9.4,10,5.5,-9.1,0x254e40);b.sign('方块城市导论',0,4.3,-9,1,0,{bg:'#254e40',fg:'#ece8c9'});b.box(-1,.8,-7,1,2,-6,0x946f4d,'wood');for(let row=0;row<5;row++)for(let col=0;col<10;col++){const x=-9+col*2,z=1+row*1.5;b.box(x-.65,.3,z-.45,x+.65,1.1,z+.25,0x9a7956,'wood');b.box(x-.5,.3,z+.4,x+.5,.8,z+1,0x6a8069,'wood')}
const professor=new Character(makeSkinCanvas({gender:'m',skin:'#d4a47d',hair:'#444444',hairStyle:'short',shirt:'#ece4d6',pants:'#364947',shoes:'#252525',glasses:true,seed:21}));professor.group.position.set(0,.8,-7.6);ctx.add(professor.group);ctx.onUpdate(dt=>professor.update(dt,0));ctx.interact({x:0,z:11,r:6,label:'进入教室 · 选择座位',type:'campus-classroom'});ctx.interact({x:0,z:2,r:12,label:'落座上课 · 高教授',type:'campus-classroom'})}
export function buildDorm(b,ctx){shell(b,ctx,'学生宿舍 · 欢迎回家',12,9,6);for(const x of [-8,7]){b.box(x,.3,-7,x+3,.9,-1,0x866349,'wood');b.box(x,.9,-7,x+3,1.2,-1,0x97b5a3);b.box(x,1.2,-7,x+3,1.5,-6,0xf3e7c8)}b.box(-3,.3,-7,3,1.5,-5,0xb08a5e,'wood');b.sign('你的校园小角落',0,3,-8.5,.7,0,{bg:'#304b43',fg:'#eedda9'});ctx.interact({x:0,z:3,r:7,label:'宿舍装扮',type:'campus-shop'})}
export function buildLibrary(b,ctx){shell(b,ctx,'图书馆',18,13,11);for(let x=-12;x<=12;x+=6){b.box(x-1,.3,-9,x+1,4,-5,0x90734d,'wood');for(let y=1;y<4;y++)for(let i=0;i<4;i++)b.box(x-.8+i*.4,y,-4.98,x-.5+i*.4,y+.7,-4.8,[0x8b4d42,0x647a66,0xb3955d,0x576b89][i],{solid:false})}b.sign('READ · THINK · CREATE',0,8,13.1,1,0,{bg:'#284a3d',fg:'#dfcd90'});b.box(21,0,6,23,4,7,0x405448,'stone');b.sign('广告 · 校园新鲜事',22,3,7.1,.55,0,{bg:'#446f56',fg:'#ffe7a0'});ctx.interact({x:22,z:10,r:5,label:'查看校园灯箱 · 广告',type:'campus-ad',slot:'school:gdut-lightbox'})}
export function buildMarket(b,ctx){shell(b,ctx,'校园超市 · 广告',12,8,5);for(const x of [-7,0,7])for(let y=1;y<=3;y++){b.box(x-2,y,-5,x+2,y+.15,0,0xa28c65,'wood');for(let z=-4;z<0;z++)b.box(x-1,y+.15,z,x,y+.7,z+.7,[0xa65b4a,0x789367,0xc7aa66][y-1])}ctx.interact({x:0,z:9,r:7,label:'校园超市灯箱 · 广告',type:'campus-ad',slot:'school:gdut-market'})}
export function buildBus(b,ctx){ground(b,ctx,20,10);for(const x of [-10,10])b.box(x,0,-2,x+.4,4,2,0x52695c);b.box(-11,4,-3,11,4.4,3,0x6e8d76,'roof');b.box(-8,0,-1,8,.6,1,0x8d7756,'wood');b.sign('大学城 · 广东工业大学站',0,3,2.1,.8,0,{bg:'#2d5243',fg:'#f3e2a5'});ctx.interact({x:0,z:5,r:6,label:'前往广州塔 · 校园接驳',type:'campus-bus'})}
export const SCHOOL_LANDMARKS=[
 {id:'school:gdut',name:'广东工业大学',...location(0,0),rect:[42,26],focusY:7,build:buildGate},
 {id:'school:gdut-classroom',name:'广东工业大学·教学楼',...location(70,-50),rect:[20,16],focusY:5,build:buildClassroom},
 {id:'school:gdut-dorm',name:'广东工业大学·宿舍',...location(-70,-50),rect:[18,15],focusY:4,build:buildDorm},
 {id:'school:gdut-library',name:'广东工业大学·图书馆',...location(0,-120),rect:[27,20],focusY:8,build:buildLibrary},
 {id:'school:gdut-market',name:'广东工业大学·超市',...location(70,40),rect:[18,14],focusY:4,build:buildMarket},
 {id:'school:gdut-bus',name:'广东工业大学·公交站',...location(-70,40),rect:[24,14],focusY:3,build:buildBus}
].map(p=>({...p,alias:'广工',district:'panyu',grade:'A',photoR:180,loadR:400,desc:'广东工业大学示意校园。MVP程序化方块建模，非实测建筑复刻。',tip:'C拍照，E交互。'}))
