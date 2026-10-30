<template>
  <div class="gv">
    <div ref="host" class="host"></div>

    <template v-if="ready">
      <!-- 顶部信息 -->
      <div class="hud-tl" v-show="!ui.photoMode">
        <div class="loc mc-panel">
          <div class="dist">{{ hud.district }} <span v-if="hud.place" class="place">· {{ hud.place }}</span></div>
          <div class="meta">
            <span>{{ hud.weatherIcon }} {{ hud.weatherName }}</span>
            <span>🕒 {{ hud.time }} {{ hud.period }}</span>
            <span>💰 ¥{{ store.save.money }}</span>
            <span v-if="hud.alt > 30">⛰ {{ hud.alt }}m</span>
          </div>
        </div>
        <div class="tasks mc-panel" v-if="trackTask || dailyLeft.length">
          <div class="tt">📌 任务</div>
          <div v-if="trackTask" class="task"><b>□ {{ trackTask.title }}</b><div class="muted">{{ trackTask.desc }}</div></div>
          <div v-for="t in dailyLeft" :key="t.id" class="task small">{{ t.done ? '☑' : '□' }} {{ t.title }} <span class="muted">{{ t.p[0] }}/{{ t.p[1] }}</span></div>
        </div>
      </div>

      <div class="compass" v-show="!ui.photoMode">
        <div class="strip" :style="{ transform: `translateX(${compassX}px)` }">
          <span v-for="m in compassMarks" :key="m.k" :style="{ left: m.x + 'px' }" :class="{ major: m.major }">{{ m.t }}</span>
        </div>
        <div class="wp" v-if="wpInfo" :style="{ left: wpInfo.x + 'px' }">▼<small>{{ wpInfo.d }}</small></div>
        <div class="needle"></div>
      </div>

      <canvas v-show="!ui.photoMode && store.save.settings.showMinimap" ref="mini" class="minimap" width="200" height="200" @click="ui.panel = 'map'"></canvas>

      <div class="banner" v-if="ui.banner" :key="ui.banner.id">
        <div class="bt">{{ ui.banner.title }}</div>
        <div class="bs">{{ ui.banner.sub }}</div>
      </div>

      <div class="toasts">
        <div v-for="t in ui.toasts" :key="t.id" class="toast" :class="t.kind">{{ t.text }}</div>
      </div>

      <div class="prompt" v-if="ui.prompt && !ui.dialog && !ui.panel" @click="act('E')"><kbd>E</kbd> {{ ui.prompt.label }}</div>
      <div class="ride mc-panel" v-if="hud.ride && !ui.photoMode">{{ hud.ride }}</div>
      <div class="cross" v-if="isFirst && !ui.photoMode">+</div>

      <!-- 底部菜单 -->
      <div class="bottom" v-show="!ui.photoMode">
        <button class="mc-btn small" @click="toggle('bag')">🎒 背包<kbd>B</kbd></button>
        <button class="mc-btn small" @click="toggle('album')">📷 相册<kbd>P</kbd></button>
        <button class="mc-btn small" @click="toggle('map')">🗺 地图<kbd>M</kbd></button>
        <button class="mc-btn small" @click="toggle('dex')">📖 图鉴<kbd>N</kbd></button>
        <button class="mc-btn small" @click="toggle('tasks')">📌 任务<kbd>J</kbd></button>
        <button class="mc-btn small" @click="toggle('settings')">⚙ 设置</button>
        <button class="mc-btn small" @click="toggle('help')">❓<kbd>H</kbd></button>
        <button v-if="ui.mobile && !ui.portrait && canFs" class="mc-btn small" @click="toggleFullscreen">{{ ui.fullscreen ? '⛶ 退出全屏' : '⛶ 全屏' }}</button>
      </div>
      <div class="lock-hint" v-if="!ui.pointerLocked && !ui.mobile && !ui.panel && !ui.dialog && !ui.photoMode">点击画面锁定鼠标以旋转视角 · <kbd>C</kbd> 拍照 · <kbd>V</kbd> 切换视角</div>

      <!-- 摄影模式 -->
      <div class="photo" v-if="ui.photoMode">
        <div class="grid"><i></i><i></i><i></i><i></i></div>
        <div class="corners"><b></b><b></b><b></b><b></b></div>
        <div class="ph-top mc-panel">
          <span class="mc-title" style="font-size:16px">📷 摄影模式</span>
          <button v-for="v in views" :key="v.id" class="mc-btn small" :class="{ active: ui.photoView === v.id }" @click="setView(v.id)">{{ v.n }}</button>
          <span class="muted">V 切换 · 滚轮/滑块 变焦</span>
          <button class="mc-btn small" @click="exitPhoto">✕ 退出 (C)</button>
        </div>
        <div class="ph-left mc-panel">
          <div class="muted">滤镜（1-6）</div>
          <button v-for="(f, i) in FILTERS" :key="f.id" class="mc-btn small" :class="{ active: ui.filter === f.id }" @click="ui.filter = f.id">{{ i + 1 }}. {{ f.name }}</button>
          <template v-if="ui.photoView === 'selfie'">
            <div class="muted" style="margin-top:8px">姿势</div>
            <button v-for="ps in poses" :key="ps.id" class="mc-btn small" :class="{ active: pose === ps.id }" @click="setPose(ps.id)">{{ ps.n }}</button>
          </template>
          <div class="muted" style="margin-top:8px">变焦 {{ fov }}°</div>
          <input type="range" min="20" max="90" v-model.number="fov" @input="setFov" />
        </div>
        <button class="shutter" @click="shoot" title="拍照（点击画面 / F / Enter）"></button>
      </div>
      <div class="flash" v-if="ui.flash"></div>
      <div class="lastphoto mc-panel" v-if="ui.lastPhoto"><img :src="ui.lastPhoto.thumb" /><div>{{ ui.lastPhoto.title }}</div></div>

      <!-- 对话框 -->
      <div class="dialog mc-panel" v-if="ui.dialog">
        <div class="d-head"><span class="mc-title" style="font-size:17px">{{ ui.dialog.title }}</span><span v-if="ui.dialog.sub" class="tag">{{ ui.dialog.sub }}</span></div>
        <div class="d-text">{{ ui.dialog.text }}</div>
        <div class="d-opts">
          <button v-for="(o, i) in ui.dialog.options" :key="i" class="mc-btn small" :class="{ primary: i === 0 }" @click="o.action()">{{ o.label }}</button>
        </div>
      </div>

      <Panels />

      <!-- 移动端控制 -->
      <template v-if="ui.mobile && !ui.panel && !ui.dialog">
        <div class="joy" ref="joyEl" @touchstart.prevent="joyStart" @touchmove.prevent="joyMove" @touchend.prevent="joyEnd" @touchcancel.prevent="joyEnd">
          <div class="knob" :style="{ transform: `translate(${joy.x * 40}px, ${-joy.y * 40}px)` }"></div>
        </div>
        <div class="mbtns">
          <button class="mb" @touchstart.prevent="act('jump')">跳</button>
          <button class="mb" :class="{ on: sprint }" @touchstart.prevent="sprint = !sprint; G.game.input.joy.sprint = sprint">跑</button>
          <button class="mb" @touchstart.prevent="act('E')">E</button>
          <button class="mb" @touchstart.prevent="act('C')">📷</button>
          <button class="mb" @touchstart.prevent="act('V')">👁</button>
          <button v-if="ui.photoMode" class="mb big" @touchstart.prevent="shoot">●</button>
        </div>
      </template>
    </template>

    <!-- 移动端竖屏：提示横屏操作 -->
    <div class="rotate-hint" v-if="ui.mobile && ui.portrait && !ui.ignorePortrait && !ui.panel && !ui.dialog && !ui.photoMode">
      <div class="rh-icon">📱</div>
      <div class="rh-text">请横屏操作</div>
      <div class="rh-sub">将手机旋转至横屏，获得最佳视野与操作体验</div>
      <button class="mc-btn small" @click="ui.ignorePortrait = true">仍要竖屏继续</button>
    </div>

    <div class="fade" :class="{ on: ui.fade }"><div>{{ ui.fadeText }}</div></div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, reactive } from 'vue'
import { store } from '../game/store.js'
import { Game } from '../game/Game.js'
import { G } from '../game/instance.js'
import { FILTERS } from '../game/photo.js'
import { NOVICE, DAILY_POOL } from '../game/data.js'
import { dailyProgress } from '../game/store.js'
import { METRO_STATIONS } from '../game/geo.js'
import Panels from './Panels.vue'

const host = ref(null)
const mini = ref(null)
const ready = ref(false)
const ui = store.ui
const hud = ui.hud
const sprint = ref(false)
const joy = reactive({ x: 0, y: 0 })
const fov = ref(55)
const pose = ref('pose')
const views = [{ id: 'third', n: '第三人称' }, { id: 'first', n: '第一人称' }, { id: 'selfie', n: '自拍' }]
const poses = [{ id: 'pose', n: '✌ 比耶' }, { id: 'wave', n: '👋 挥手' }, { id: 'idle', n: '🧍 站立' }, { id: 'photo', n: '📸 举相机' }]
let mmTimer = null

const isFirst = computed(() => G.game && G.game.player && G.game.player.view === 'first' && hud.fps >= 0)
const trackTask = computed(() => {
  const i = store.save.novice
  return i < NOVICE.length ? NOVICE[i] : null
})
const dailyLeft = computed(() => {
  const d = store.save.daily
  return (d.ids || []).map((id) => {
    const t = DAILY_POOL.find((x) => x.id === id)
    return { ...t, done: !!d.done[id], p: dailyProgress(t) }
  })
})

// 指南针
const W = 360
const compassX = computed(() => {
  const bearing = ((-hud.heading * 180) / Math.PI) % 360
  return -((bearing + 360) % 360) * 2 + W / 2 - 360 * 2
})
const compassMarks = computed(() => {
  const out = []
  const names = { 0: '北', 45: '东北', 90: '东', 135: '东南', 180: '南', 225: '西南', 270: '西', 315: '西北' }
  for (let rep = 0; rep < 3; rep++)
    for (let a = 0; a < 360; a += 15) out.push({ k: rep + '-' + a, x: (rep * 360 + a) * 2, t: names[a] || '·', major: !!names[a] })
  return out
})
const wpInfo = computed(() => {
  const wp = ui.waypoint
  if (!wp || hud.x == null) return null
  const dx = wp.x - hud.x, dz = wp.z - hud.z
  const d = Math.hypot(dx, dz)
  const bearing = (Math.atan2(dx, -dz) * 180) / Math.PI
  const head = (-hud.heading * 180) / Math.PI
  let rel = ((bearing - head + 540) % 360) - 180
  rel = Math.max(-88, Math.min(88, rel))
  return { x: W / 2 + rel * 2 - 6, d: d > 1000 ? (d * 0.005).toFixed(1) + 'km' : Math.round(d * 5) + 'm' }
})

async function boot(spawn, onProgress) {
  if (!G.game) {
    G.game = new Game(host.value)
    ui.mobile = 'ontouchstart' in window && navigator.maxTouchPoints > 0
  }
  updateOrientation()
  await G.game.spawnAt(spawn, onProgress)
  G.game.start()
  ready.value = true
  clearInterval(mmTimer)
  mmTimer = setInterval(drawMinimap, 200)
}
defineExpose({ boot })

// 竖屏检测（移动端竖屏时提示横屏操作）
function updateOrientation() {
  ui.portrait = window.innerHeight > window.innerWidth
}
window.addEventListener('resize', updateOrientation)
window.addEventListener('orientationchange', updateOrientation)
updateOrientation()

// 全屏（移动端横屏显示按钮）
const canFs = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)
function toggleFullscreen() {
  const el = document.documentElement
  const cur = document.fullscreenElement || document.webkitFullscreenElement
  try {
    if (cur) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document)
    } else {
      const req = el.requestFullscreen || el.webkitRequestFullscreen
      const p = req.call(el)
      if (p && p.then) p.then(() => {
        try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}) } catch (e) {}
      }).catch(() => {})
    }
  } catch (e) {}
}
function onFsChange() {
  ui.fullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement)
}
document.addEventListener('fullscreenchange', onFsChange)
document.addEventListener('webkitfullscreenchange', onFsChange)

function toggle(p) {
  ui.panel = ui.panel === p ? null : p
  if (ui.panel) G.game.input.exitLock()
}
function act(k) {
  const g = G.game
  if (!g) return
  if (k === 'jump') g.input.joy.jump = true
  else g.onKey('Key' + k)
}
function setView(v) {
  G.game.setPhotoView(v)
}
function exitPhoto() {
  G.game.togglePhoto(false)
}
function shoot() {
  G.game.shutter()
}
function setFov() {
  G.game.photoFov = fov.value
}
function setPose(p) {
  pose.value = p
  G.game.selfiePose = p
}
// 鼠标滚轮变焦（摄影模式）
window.addEventListener('wheel', (e) => {
  if (ui.photoMode && G.game) {
    fov.value = Math.max(20, Math.min(90, fov.value + Math.sign(e.deltaY) * 3))
    G.game.photoFov = fov.value
  }
}, { passive: true })

// 摇杆
let joyId = null, joyC = null
function joyStart(e) {
  const t = e.changedTouches[0]
  joyId = t.identifier
  const r = e.currentTarget.getBoundingClientRect()
  joyC = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  joyMove(e)
}
function joyMove(e) {
  for (const t of e.changedTouches) {
    if (t.identifier !== joyId) continue
    let dx = (t.clientX - joyC.x) / 50, dy = -(t.clientY - joyC.y) / 50
    const l = Math.hypot(dx, dy)
    if (l > 1) { dx /= l; dy /= l }
    joy.x = dx
    joy.y = dy
    Object.assign(G.game.input.joy, { x: dx, y: dy, active: true })
  }
}
function joyEnd() {
  joy.x = joy.y = 0
  Object.assign(G.game.input.joy, { x: 0, y: 0, active: false })
}

// 小地图
function drawMinimap() {
  const g = G.game
  const c = mini.value
  if (!g || !c || ui.photoMode) return
  const ctx = c.getContext('2d')
  const bm = g.baseMap
  const p = g.player.pos
  const R = 320 // 世界单位半径
  const S = bm.scale
  const sx = (p.x - R - bm.bounds.x0) * S, sz = (p.z - R - bm.bounds.z0) * S
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#6fa8d8'
  ctx.fillRect(0, 0, 200, 200)
  ctx.drawImage(bm.canvas, sx, sz, R * 2 * S, R * 2 * S, 0, 0, 200, 200)
  const k = 200 / (R * 2)
  const T = (x, z) => [(x - p.x + R) * k, (z - p.z + R) * k]
  // 地铁
  for (const m of METRO_STATIONS) {
    const [x, y] = T(m.x, m.z)
    if (x < -5 || y < -5 || x > 205 || y > 205) continue
    ctx.fillStyle = '#b8222a'
    ctx.fillRect(x - 4, y - 4, 8, 8)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 7px sans-serif'
    ctx.fillText('M', x - 3, y + 3)
  }
  for (const it of g.landmarks.items) {
    if (it.def.hidden) continue
    const [x, y] = T(it.x, it.z)
    if (x < -5 || y < -5 || x > 205 || y > 205) continue
    const found = store.save.discovered.includes(it.def.id)
    const shot = store.save.photographed[it.def.id]
    ctx.fillStyle = shot ? '#ffd040' : found ? '#ffffff' : '#555'
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, it.def.grade === 'S' ? 5 : 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    if (found) {
      ctx.font = 'bold 10px "Microsoft YaHei",sans-serif'
      ctx.lineWidth = 3
      ctx.strokeText(it.def.name, x + 6, y + 4)
      ctx.fillText(it.def.name, x + 6, y + 4)
    }
  }
  // 巴士
  const bus = g.transport.bus.position
  {
    const [x, y] = T(bus.x, bus.z)
    ctx.fillStyle = '#e8302a'
    ctx.fillRect(x - 3, y - 3, 6, 6)
  }
  if (ui.waypoint) {
    let [x, y] = T(ui.waypoint.x, ui.waypoint.z)
    x = Math.max(6, Math.min(194, x))
    y = Math.max(6, Math.min(194, y))
    ctx.fillStyle = '#ffd040'
    ctx.beginPath()
    ctx.moveTo(x, y + 6)
    ctx.lineTo(x - 6, y - 6)
    ctx.lineTo(x + 6, y - 6)
    ctx.fill()
  }
  // 玩家箭头
  ctx.save()
  ctx.translate(100, 100)
  ctx.rotate(-g.player.camYaw)
  ctx.fillStyle = '#ff3a3a'
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, -9)
  ctx.lineTo(6, 7)
  ctx.lineTo(0, 3)
  ctx.lineTo(-6, 7)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 12px sans-serif'
  ctx.fillText('N', 95, 13)
}

onBeforeUnmount(() => {
  clearInterval(mmTimer)
  window.removeEventListener('resize', updateOrientation)
  window.removeEventListener('orientationchange', updateOrientation)
  document.removeEventListener('fullscreenchange', onFsChange)
  document.removeEventListener('webkitfullscreenchange', onFsChange)
  if (G.game) G.game.dispose()
  G.game = null
})
</script>

<style scoped>
.gv { position: fixed; inset: 0; }
.host { position: absolute; inset: 0; }
.host :deep(canvas) { display: block; width: 100%; height: 100%; }
.hud-tl { position: absolute; left: 12px; top: 12px; display: flex; flex-direction: column; gap: 8px; max-width: min(360px, 60vw); pointer-events: none; }
.loc { padding: 8px 12px; }
.dist { font-size: 18px; font-weight: 800; color: var(--accent); text-shadow: 2px 2px 0 #000; }
.place { color: #fff; font-size: 15px; }
.meta { display: flex; gap: 10px; flex-wrap: wrap; font-size: 13px; margin-top: 3px; }
.tasks { padding: 8px 12px; font-size: 13px; }
.tt { font-weight: 800; margin-bottom: 4px; color: #ffd76a; }
.task { margin: 3px 0; }
.task .muted { font-size: 12px; }
.task.small { font-size: 12px; }
.compass { position: absolute; top: 10px; left: 50%; width: 360px; height: 30px; margin-left: -180px; overflow: hidden; background: rgba(0,0,0,0.45); border: 2px solid #111; pointer-events: none; }
.strip { position: absolute; top: 0; left: 0; height: 100%; }
.strip span { position: absolute; top: 6px; transform: translateX(-50%); font-size: 11px; color: #ccc; white-space: nowrap; }
.strip span.major { color: #fff; font-weight: 800; font-size: 13px; top: 5px; }
.needle { position: absolute; left: 50%; top: 0; width: 2px; height: 100%; background: #ff4040; }
.wp { position: absolute; top: -3px; color: #ffd040; font-size: 14px; text-shadow: 1px 1px 0 #000; display: flex; flex-direction: column; align-items: center; }
.wp small { font-size: 9px; margin-top: -4px; }
.minimap { position: absolute; right: 12px; top: 12px; width: 200px; height: 200px; border: 3px solid #0d0e11; box-shadow: 0 0 0 2px #4a4e58; cursor: pointer; image-rendering: pixelated; }
.banner { position: absolute; top: 18%; left: 50%; transform: translateX(-50%); text-align: center; pointer-events: none; animation: bin 3.5s ease forwards; }
.bt { font-size: clamp(22px, 4vw, 38px); font-weight: 900; color: #ffd76a; text-shadow: 3px 3px 0 #000, 0 0 20px rgba(0,0,0,0.6); letter-spacing: 3px; }
.bs { font-size: 15px; color: #fff; text-shadow: 2px 2px 0 #000; margin-top: 6px; }
@keyframes bin { 0% { opacity: 0; transform: translate(-50%, -10px); } 10% { opacity: 1; transform: translate(-50%, 0); } 85% { opacity: 1; } 100% { opacity: 0; } }
.toasts { position: absolute; right: 12px; top: 226px; display: flex; flex-direction: column; gap: 6px; align-items: flex-end; pointer-events: none; max-width: min(380px, 70vw); }
.toast { background: rgba(15,16,20,0.88); border: 2px solid #000; border-left: 5px solid #8af; padding: 7px 12px; font-size: 13px; animation: tin 0.3s; }
.toast.reward { border-left-color: #ffd040; } .toast.dex { border-left-color: #6ad04a; } .toast.warn { border-left-color: #ff6040; } .toast.item { border-left-color: #e070ff; } .toast.task { border-left-color: #ffa040; }
@keyframes tin { from { transform: translateX(30px); opacity: 0; } }
.prompt { position: absolute; left: 50%; bottom: 120px; transform: translateX(-50%); background: rgba(0,0,0,0.65); border: 2px solid #111; padding: 8px 16px; font-size: 15px; font-weight: 700; cursor: pointer; white-space: nowrap; }
.ride { position: absolute; left: 50%; bottom: 168px; transform: translateX(-50%); padding: 6px 14px; font-size: 14px; white-space: nowrap; }
.cross { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 22px; color: #fff; text-shadow: 0 0 3px #000; pointer-events: none; }
.bottom { position: absolute; left: 50%; bottom: 12px; transform: translateX(-50%); display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; width: max-content; max-width: 96vw; }
.bottom kbd { margin-left: 4px; font-size: 10px; min-width: 16px; padding: 0 3px; }
.lock-hint { position: absolute; left: 50%; bottom: 62px; transform: translateX(-50%); font-size: 12px; color: #ddd; text-shadow: 1px 1px 0 #000; pointer-events: none; white-space: nowrap; }
.photo { position: absolute; inset: 0; pointer-events: none; }
.photo > * { pointer-events: auto; }
.grid { position: absolute; inset: 0; pointer-events: none !important; }
.grid i { position: absolute; background: rgba(255,255,255,0.25); }
.grid i:nth-child(1) { left: 33.3%; top: 0; bottom: 0; width: 1px; } .grid i:nth-child(2) { left: 66.6%; top: 0; bottom: 0; width: 1px; }
.grid i:nth-child(3) { top: 33.3%; left: 0; right: 0; height: 1px; } .grid i:nth-child(4) { top: 66.6%; left: 0; right: 0; height: 1px; }
.corners { position: absolute; inset: 24px; pointer-events: none !important; }
.corners b { position: absolute; width: 40px; height: 40px; border: 4px solid #fff; }
.corners b:nth-child(1) { left: 0; top: 0; border-right: 0; border-bottom: 0; } .corners b:nth-child(2) { right: 0; top: 0; border-left: 0; border-bottom: 0; }
.corners b:nth-child(3) { left: 0; bottom: 0; border-right: 0; border-top: 0; } .corners b:nth-child(4) { right: 0; bottom: 0; border-left: 0; border-top: 0; }
.ph-top { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; align-items: center; padding: 8px 12px; flex-wrap: wrap; justify-content: center; max-width: 96vw; font-size: 12px; }
.ph-left { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 6px; padding: 10px; font-size: 12px; }
.ph-left input { width: 150px; }
.shutter { position: absolute; right: 40px; top: 50%; margin-top: -40px; width: 80px; height: 80px; border-radius: 50%; border: 6px solid #fff; background: radial-gradient(circle, #ff4040 55%, #a01010 56%); cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.6); }
.shutter:active { transform: scale(0.92); }
.flash { position: absolute; inset: 0; background: #fff; animation: fl 0.18s; pointer-events: none; }
@keyframes fl { from { opacity: 1; } to { opacity: 0; } }
.lastphoto { position: absolute; right: 130px; bottom: 30px; padding: 6px; width: 220px; font-size: 12px; animation: tin 0.3s; transform: rotate(2deg); }
.lastphoto img { width: 100%; display: block; border: 2px solid #fff; }
.dialog { position: absolute; left: 50%; bottom: 70px; transform: translateX(-50%); width: min(640px, 94vw); padding: 14px 18px; }
.d-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.d-text { font-size: 15px; line-height: 1.7; white-space: pre-line; margin-bottom: 10px; }
.d-opts { display: flex; gap: 8px; flex-wrap: wrap; }
.fade { position: fixed; inset: 0; background: #000; opacity: 0; pointer-events: none; transition: opacity 0.6s; display: flex; align-items: center; justify-content: center; z-index: 50; font-size: 20px; }
.fade.on { opacity: 1; pointer-events: auto; }
.rotate-hint { position: absolute; inset: 0; z-index: 60; background: radial-gradient(circle at 50% 40%, #2a3550, #0d0f14 90%); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: #fff; text-align: center; padding: 24px; }
.rh-icon { font-size: 72px; line-height: 1; animation: rotate-phone 2.2s ease-in-out infinite; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5)); }
@keyframes rotate-phone { 0%, 25% { transform: rotate(0deg); } 65%, 90% { transform: rotate(-90deg); } 100% { transform: rotate(-90deg); } }
.rh-text { font-size: 30px; font-weight: 900; color: #ffd76a; text-shadow: 3px 3px 0 #000; letter-spacing: 4px; }
.rh-sub { font-size: 14px; color: #ddd; text-shadow: 1px 1px 0 #000; }
.joy { position: absolute; left: 24px; bottom: 90px; width: 130px; height: 130px; border-radius: 50%; background: rgba(255,255,255,0.12); border: 3px solid rgba(255,255,255,0.35); display: flex; align-items: center; justify-content: center; touch-action: none; }
.knob { width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.55); border: 3px solid #fff; }
.mbtns { position: absolute; right: 18px; bottom: 90px; display: grid; grid-template-columns: repeat(3, 58px); gap: 8px; }
.mb { width: 58px; height: 58px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.6); background: rgba(0,0,0,0.45); color: #fff; font-size: 18px; font-weight: 800; touch-action: none; }
.mb.on { background: rgba(232,176,74,0.7); }
.mb.big { background: rgba(220,40,40,0.8); }
@media (max-width: 720px), (max-height: 520px) {
  .minimap { width: 110px; height: 110px; }
  .joy { bottom: 60px; width: 110px; height: 110px; }
  .mbtns { bottom: 56px; grid-template-columns: repeat(3, 48px); }
  .mb { width: 48px; height: 48px; font-size: 15px; }
  .hud-tl { max-width: 46vw; }
  .loc { padding: 4px 8px; }
  .dist { font-size: 14px; }
  .meta { font-size: 11px; gap: 6px; }
  .prompt { bottom: 64px; font-size: 13px; }
  .ride { bottom: 100px; font-size: 12px; }
  .dialog { bottom: 50px; padding: 8px 12px; }
  .d-text { font-size: 13px; }
  .toasts { top: 130px; }
  .compass { width: 240px; margin-left: -120px; }
  .tasks { display: none; }
  .lock-hint { display: none; }
  .bottom .mc-btn { padding: 4px 6px; font-size: 11px; }
  .bottom kbd { display: none; }
  .shutter { right: 20px; width: 64px; height: 64px; }
  .rh-icon { font-size: 56px; }
  .rh-text { font-size: 24px; letter-spacing: 3px; }
  .rh-sub { font-size: 13px; }
}
</style>
