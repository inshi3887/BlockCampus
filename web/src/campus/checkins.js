import {account,api,eventKey,refreshEconomy} from './session.js'
import {toast} from '../game/store.js'
export async function recordPhoto(rec,position) {
 if(account.guest||!account.user)return
 account.photo={...rec,eventId:null,error:null,position:{x:position.x,z:position.z}}
 if(!rec.landmarks.length)return
 const key=eventKey(),landmark=rec.landmarks[0]
 try {
  const result=await api('/photos/event',{key,landmark,position:{x:position.x,z:position.z}})
  account.photo={...account.photo,eventId:result.eventId,landmark,key}
  await refreshEconomy()
  const d=result.reward
  toast(result.capped?'今日普通掉落已达20次，仍记录图鉴':d?`打卡成功 +${d.gold_copper/10000}金 ${d.silver_copper/100}银 ${d.copper}铜`:'打卡已记录','reward')
 }catch(e){account.photo.error=e.message;toast('打卡未结算：'+e.message,'warn')}
}
