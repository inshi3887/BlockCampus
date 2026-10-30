<template><section v-if="account.tab==='social'" class="campus-modal mc-panel social"><header><h2>校园广场</h2><button class="mc-btn" @click="close">关闭</button></header><nav><button class="mc-btn" @click="channel='forum'">公开论坛</button><button class="mc-btn" @click="channel='friends'">我的朋友圈</button><button class="mc-btn" @click="load">刷新</button></nav><p v-if="channel==='friends'" class="muted">好友系统将在阶段二开放，当前朋友圈仅本人可见。</p><form @submit.prevent="publish"><textarea v-model="body" maxlength="2000" required placeholder="今天在校园，有什么新发现？" rows="3"></textarea><label><input type="checkbox" v-model="attach" :disabled="!account.photo">附上刚拍的照片 {{account.photo?.title||'（先按C拍照）'}}</label><p v-if="attach&&account.photo?.eventId" class="muted">已关联景点打卡，广告奖励会在审核通过后补发。</p><button class="mc-btn primary" :disabled="busy||account.guest">发布并提交审核</button></form><p class="error" role="alert">{{error}}</p><p class="muted" v-if="!posts.length">还没有内容，成为第一个记录校园的人。</p><article v-for="p in posts" :key="p.id" class="post"><div><b>{{p.username}}</b><small>{{new Date(p.created_at).toLocaleString('zh-CN')}} · {{status[p.status]}}</small></div><p class="post-body">{{p.body}}</p><img v-if="p.url" :src="p.url" loading="lazy" alt="校园照片"><div v-if="p.status==='approved'" class="row"><button class="mc-btn small" @click="like(p)">喜欢 {{p.likes}}</button><button class="mc-btn small" @click="showComments(p)">评论</button><button class="mc-btn small" @click="report(p)">举报</button></div><div v-if="selected===p.id"><p v-for="c in comments" :key="c.id">{{c.username}}：{{c.body}}</p><form @submit.prevent="comment(p)"><input :disabled="commentBusy" v-model="commentBody" placeholder="评论（需审核）" maxlength="500" required><button class="mc-btn small" :disabled="commentBusy">提交评论</button></form></div></article></section></template>
<script setup>
import {ref,watch} from 'vue'
import {account,api,eventKey,refreshEconomy} from '../campus/session.js'
import {store,toast} from '../game/store.js'
const channel=ref('forum'),body=ref(''),posts=ref([]),attach=ref(false),busy=ref(false),error=ref(''),selected=ref(null),comments=ref([]),commentBody=ref(''),status={pending:'审核中',approved:'已发布',rejected:'未通过'}
const commentBusy=ref(false),commentIntents=new Map()
let publishKey=eventKey(),uploadId=null,uploadPhoto=null
function close(){account.tab=null;store.ui.panel=null}
async function load(){if(account.guest){error.value='游客不能参与社交';return}try{posts.value=await api('/posts?channel='+channel.value);await refreshEconomy()}catch(e){error.value=e.message}}
async function publish(){busy.value=true;try{error.value='';let photo=attach.value?account.photo:null;if(photo&&(!uploadId||uploadPhoto!==photo.id)){const blob=await (await fetch(photo.full)).blob();const fd=new FormData();fd.append('file',blob,'campus.jpg');uploadId=(await api('/uploads',fd)).id;uploadPhoto=photo.id}
 const payload={key:publishKey,channel:channel.value,body:body.value};if(photo){payload.uploadId=uploadId;if(photo.eventId){payload.photoEvent=photo.eventId;payload.adSlot=photo.adSlot||undefined}}
 await api('/posts',payload);publishKey=eventKey();body.value='';attach.value=false;toast('已提交审核，审核通过后展示与结算');await load()
 }catch(e){error.value=e.message}finally{busy.value=false}}
async function like(p){try{await api('/posts/'+p.id+'/like',{});await load()}catch(e){error.value=e.message}}
async function showComments(p){try{selected.value=p.id;comments.value=await api('/posts/'+p.id+'/comments')}catch(e){error.value=e.message}}
async function comment(p){
 if(commentBusy.value)return
 commentBusy.value=true
 const text=commentBody.value,intent=JSON.stringify([account.user?.id,p.id,text])
 const key=commentIntents.get(intent)||eventKey();commentIntents.set(intent,key)
 try{error.value='';await api('/posts/'+p.id+'/comments',{key,body:text});commentIntents.delete(intent);if(commentBody.value===text)commentBody.value='';toast('评论已提交审核')}
 catch(e){error.value=e.message}finally{commentBusy.value=false}
}
async function report(p){const reason=window.prompt('请填写举报原因');if(!reason)return;try{await api('/posts/'+p.id+'/report',{reason});toast('举报已提交运营端')}catch(e){error.value=e.message}}
watch([()=>account.tab,channel],()=>{if(account.tab==='social')load()})
</script>
<style scoped>.social form{display:grid;gap:12px;margin:18px 0}.social nav,.row{display:flex;gap:8px;flex-wrap:wrap}.social textarea{width:100%;resize:vertical}.post{border-top:2px solid #52675b;padding:24px 0}.post small{display:block;color:#a9b9ae;margin-top:6px}.post-body{white-space:pre-wrap;line-height:1.8}.post img{max-width:100%;max-height:340px;object-fit:contain;image-rendering:pixelated;margin-bottom:12px}</style>
