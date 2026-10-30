import {account} from './session.js'
import {G} from '../game/instance.js'
import {Builder,disposeGroup} from '../game/builder.js'
let decor=null
export function equip(sku){if(!account.economy?.inventory.includes(sku))return;const game=G.game;if(!game)return
 if(sku==='cap'){game.player.char.addAccessory('cap');game.player.char.showAccessory('cap',true);return}
 if(sku==='frame'){document.documentElement.dataset.photoFrame='campus';return}
 if(sku==='profile5'||sku==='copper-border'){document.documentElement.dataset.profileFrame=sku;return}
 if(sku==='silver-sticker'){document.documentElement.dataset.sticker='silver';return}
 if(sku==='plant'){if(decor){disposeGroup(decor);decor=null}const room=game.landmarks.byId['school:gdut-dorm'];if(!room)return;const b=new Builder(room.x+5,room.y+.3,room.z-5);b.box(-.5,0,-.5,.5,.8,.5,0xa26849,'brick');b.box(-.1,.8,-.1,.1,1.8,.1,0x5a7545,'wood');b.box(-.8,1,-.8,.8,2,.8,0x6e9b56,{mat:'leaf',solid:false});decor=b.build(false);game.scene.add(decor)}
}
window.addEventListener('campus:equip',e=>equip(e.detail))
