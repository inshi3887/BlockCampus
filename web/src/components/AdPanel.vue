<template><section v-if="account.tab==='ads'" class="campus-modal mc-panel"><header><h2>校园灯箱 · 广告</h2><button class="mc-btn" @click="close">关闭</button></header><p v-if="!selected">该广告位暂无投放，校园公告正在准备中。</p><template v-else><img class="ad-image" :src="selected.url" alt="校园广告素材"><h3>{{selected.advertiser}}</h3><p>靠近灯箱拍照，并在校园广场发布照片。审核通过后由服务端结算每日前5次广告掉落。</p><button class="mc-btn primary" @click="photograph">去拍一张打卡照</button><button class="mc-btn" @click="share">发布打卡照</button></template><p role="alert" class="error">{{error}}</p></section></template>
<script setup>
import {ref,computed,watch,onMounted,onBeforeUnmount} from 'vue'
import * as THREE from 'three'
import {account,api} from '../campus/session.js'
import {store} from '../game/store.js'
import {G} from '../game/instance.js'
const selected=computed(()=>account.ads.find(a=>a.slot===account.adSlot)),error=ref('')
const mounts=new Map(),seen=new Set();let poll,renderTimer
function close(){account.tab=null;store.ui.panel=null}
function photograph(){close();G.game?.togglePhoto(true)}
function share(){account.tab='social'}
async function load(){try{account.ads=await api('/ads')}catch(e){error.value=e.message}}
function dispose(slot){const old=mounts.get(slot);if(old){old.mesh.removeFromParent();old.mesh.geometry.dispose();old.mesh.material.map?.dispose();old.mesh.material.dispose();mounts.delete(slot)}}
async function render(){const game=G.game;if(!game)return;for(const [slot,old] of mounts){if(!account.ads.some(a=>a.slot===slot&&a.id===old.id)||!game.landmarks.byId[old.landmark]?.loaded)dispose(slot)}for(const ad of account.ads){const lm=game.landmarks.byId[ad.landmark];if(!lm?.loaded)continue;if(!mounts.has(ad.slot)){const image=new THREE.TextureLoader().load(ad.url);image.colorSpace=THREE.SRGBColorSpace;image.minFilter=image.magFilter=THREE.NearestFilter;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(ad.slot.endsWith('lightbox')?2:9,1.5),new THREE.MeshBasicMaterial({map:image}));const p=game.landmarks.toWorld(ad.landmark,ad.slot.endsWith('lightbox')?22:0,ad.slot.endsWith('lightbox')?2.5:4,ad.slot.endsWith('lightbox')?7.15:8.15);mesh.position.copy(p);lm.group.add(mesh);mounts.set(ad.slot,{id:ad.id,landmark:ad.landmark,mesh})}const screen=mounts.get(ad.slot).mesh.position.clone().project(game.camera);if(!account.guest&&account.user&&Math.hypot(lm.x-game.player.pos.x,lm.z-game.player.pos.z)<45&&screen.z<1&&Math.abs(screen.x)<1&&Math.abs(screen.y)<1&&!seen.has(ad.id)){seen.add(ad.id);api('/ads/'+ad.id+'/metric',{kind:'impression'}).catch(()=>seen.delete(ad.id))}}}
watch(()=>account.tab,async tab=>{if(tab==='ads'&&selected.value&&!account.guest){try{await api('/ads/'+selected.value.id+'/metric',{kind:'click'})}catch(e){error.value=e.message}}})
onMounted(()=>{load();poll=setInterval(load,60000);renderTimer=setInterval(render,1000)})
onBeforeUnmount(()=>{clearInterval(poll);clearInterval(renderTimer);for(const slot of mounts.keys())dispose(slot)})
</script>
<style scoped>.ad-image{width:100%;max-height:350px;object-fit:contain;image-rendering:pixelated}</style>
