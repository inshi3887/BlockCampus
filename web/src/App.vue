<template>
  <div class="app">
    <AccountGate v-if="!authorized" @ready="authorized=true" />
    <Menu v-else-if="store.ui.screen !== 'game'" @start="startGame" />
    <GameView v-if="gameMounted" v-show="store.ui.screen === 'game'" ref="gv" />
    <CampusHUD v-if="authorized" />
    <Classroom v-if="authorized" />
    <SocialPanel v-if="authorized" />
    <AdPanel v-if="authorized" />
    <div v-if="loading" class="loading">
      <div class="mc-panel load-box">
        <div class="mc-title">方块校园</div>
        <div class="load-text">{{ loadText }}</div>
        <div class="bar"><div class="fill" :style="{ width: (progress * 100).toFixed(0) + '%' }"></div></div>
        <div class="muted tip">{{ tip }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick,onMounted,onBeforeUnmount } from 'vue'
import {account,api} from './campus/session.js'
import AccountGate from './components/AccountGate.vue'
import CampusHUD from './components/CampusHUD.vue'
import Classroom from './components/Classroom.vue'
import SocialPanel from './components/SocialPanel.vue'
import AdPanel from './components/AdPanel.vue'
import './campus/cosmetics.js'
import { store,toast } from './game/store.js'
import Menu from './components/Menu.vue'
import GameView from './components/GameView.vue'

const gameMounted = ref(false)
const authorized=ref(false)
const loading = ref(false)
const progress = ref(0)
const loadText = ref('')
const gv = ref(null)
const TIPS = [
  '小贴士：按 C 进入摄影模式，拍下景点即可解锁图鉴。',
  '小贴士：广州塔夜晚有灯光秀，按 T 可以快速跳转时间。',
  '小贴士：在地铁口按 E 可以快速传送到其他站点。',
  '小贴士：和路人聊天可以完成每日任务“找到5个NPC”。',
  '小贴士：珠江夜游在天字码头和广州塔码头登船。',
  '小贴士：上下九的老字号茶楼可以叹早茶。'
]
const tip = ref(TIPS[0])

function blocked(){authorized.value=false;gameMounted.value=false}
onMounted(()=>window.addEventListener('campus:blocked',blocked))
onBeforeUnmount(()=>window.removeEventListener('campus:blocked',blocked))
async function startGame(spawn) {
  if(!account.guest){try{account.identity=await api('/play/heartbeat',{});if(!account.identity.allowed){blocked();return}}catch{blocked();return}}
  loading.value = true
  progress.value = 0
  tip.value = TIPS[Math.floor(Math.random() * TIPS.length)]
  loadText.value = '正在初始化广州世界…'
  await new Promise((r) => setTimeout(r, 30))
  if (!gameMounted.value) {
    gameMounted.value = true
    await nextTick()
  }
  try {
  await gv.value.boot(spawn, (p, t) => {
    progress.value = p
    if (t) loadText.value = t
  })
  progress.value = 1
  store.ui.screen = 'game'
  }catch(e){store.ui.screen='menu';toast('场景初始化失败：'+e.message,'warn');window.alert('场景初始化失败：'+e.message)}finally{loading.value=false}
}
</script>

<style scoped>
.app { width: 100%; height: 100%; position: relative; }
.loading { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 40%, #2a3550, #0d0f14); }
.load-box { width: min(520px, 90vw); padding: 28px; text-align: center; }
.load-text { margin: 16px 0 12px; font-size: 15px; }
.bar { height: 18px; border: 3px solid #0d0e11; background: #333; box-shadow: inset 0 0 0 2px #555; }
.fill { height: 100%; background: linear-gradient(#6ad04a, #3a9a2a); transition: width 0.2s; }
.tip { margin-top: 14px; font-size: 13px; }
</style>
