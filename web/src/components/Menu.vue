<template>
  <div class="menu-root">
    <svg class="skyline" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1a2348" />
          <stop offset="0.6" stop-color="#6a4a7a" />
          <stop offset="1" stop-color="#f09a5a" />
        </linearGradient>
      </defs>
      <rect width="1200" height="400" fill="url(#sk)" />
      <g fill="#14161f">
        <rect x="0" y="300" width="1200" height="100" />
        <rect x="40" y="250" width="40" height="60" /><rect x="90" y="220" width="30" height="90" /><rect x="130" y="260" width="50" height="50" />
        <rect x="200" y="200" width="36" height="110" /><rect x="244" y="230" width="28" height="80" />
        <!-- 西塔 -->
        <polygon points="320,310 330,90 352,80 362,310" />
        <!-- 广州塔（像素化小蛮腰） -->
        <polygon points="560,310 572,240 582,170 586,120 590,170 600,240 612,310" />
        <rect x="583" y="40" width="6" height="85" />
        <!-- 东塔 -->
        <rect x="430" y="70" width="44" height="240" /><rect x="436" y="55" width="32" height="20" />
        <rect x="660" y="180" width="40" height="130" /><rect x="710" y="230" width="34" height="80" />
        <rect x="760" y="150" width="30" height="160" /><rect x="800" y="210" width="50" height="100" />
        <rect x="870" y="250" width="70" height="60" /><rect x="950" y="200" width="30" height="110" />
        <rect x="990" y="240" width="60" height="70" /><rect x="1060" y="190" width="36" height="120" /><rect x="1110" y="260" width="60" height="50" />
      </g>
      <g fill="#ff5ab0" opacity="0.85">
        <rect x="575" y="200" width="22" height="4" /><rect x="579" y="160" width="14" height="3" /><rect x="571" y="260" width="30" height="4" />
      </g>
      <rect x="0" y="330" width="1200" height="70" fill="#1d2a48" />
      <g fill="#ff7ac0" opacity="0.35"><rect x="570" y="335" width="32" height="60" /></g>
    </svg>

    <!-- 主菜单 -->
    <div v-if="step === 'menu'" class="center">
      <div class="logo">
        <div class="big">方块羊城</div>
        <div class="sub">BLOCK GUANGZHOU · 广州城市观光模拟器</div>
      </div>
      <div class="col">
        <button v-if="hasProfile" class="mc-btn primary wide" @click="step = 'spawn'">▶ 继续旅行（{{ store.save.profile.name }}）</button>
        <button class="mc-btn wide" :class="{ primary: !hasProfile }" @click="newChar">{{ hasProfile ? '✎ 修改角色' : '▶ 开始游戏' }}</button>
        <button class="mc-btn wide" @click="showHelp = !showHelp">❓ 操作说明</button>
        <button v-if="hasProfile" class="mc-btn wide small" @click="reset">🗑 清除存档</button>
      </div>
      <div v-if="showHelp" class="mc-panel help">
        <p><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移动 · 鼠标 旋转视角（点击画面锁定鼠标）· <kbd>Shift</kbd> 奔跑 · <kbd>空格</kbd> 跳跃</p>
        <p><kbd>V</kbd> 第一/第三人称 · <kbd>C</kbd> 摄影模式 · <kbd>E</kbd> 交互/对话/乘车 · <kbd>T</kbd> 时间快进</p>
        <p><kbd>M</kbd> 地图 · <kbd>B</kbd> 背包 · <kbd>P</kbd> 相册 · <kbd>N</kbd> 图鉴 · <kbd>J</kbd> 任务 · <kbd>H</kbd> 帮助 · <kbd>Esc</kbd> 关闭</p>
        <p>移动端：建议横屏游玩，左侧虚拟摇杆移动，右侧滑动旋转视角，横屏时可用底部“⛶ 全屏”按钮。</p>
      </div>
      <div class="foot muted">真实广州地图比例缩小 · 1公里 ≈ 200格 · 7大区 40+ 景点</div>
    </div>

    <!-- 角色创建 -->
    <div v-else-if="step === 'create'" class="create mc-panel">
      <div class="mc-title">创建你的方块角色</div>
      <div class="create-body">
        <div class="preview" ref="previewEl"></div>
        <div class="form scroll">
          <label>名字 <input v-model="name" maxlength="10" placeholder="羊城旅行家" /></label>
          <div class="row">
            <span>性别</span>
            <button class="mc-btn small" :class="{ active: p.gender === 'm' }" @click="p.gender = 'm'">男</button>
            <button class="mc-btn small" :class="{ active: p.gender === 'f' }" @click="p.gender = 'f'">女</button>
            <button class="mc-btn small" @click="randomize">🎲 随机</button>
          </div>
          <div class="row"><span>肤色</span><i v-for="c in SKIN_TONES" :key="c" class="sw" :class="{ on: p.skin === c }" :style="{ background: c }" @click="p.skin = c"></i></div>
          <div class="row"><span>发色</span><i v-for="c in HAIR_COLORS" :key="c" class="sw" :class="{ on: p.hair === c }" :style="{ background: c }" @click="p.hair = c"></i></div>
          <div class="row">
            <span>发型</span>
            <button v-for="h in hairStyles" :key="h.v" class="mc-btn small" :class="{ active: p.hairStyle === h.v }" @click="p.hairStyle = h.v">{{ h.n }}</button>
          </div>
          <div class="row"><span>上衣</span><input type="color" v-model="p.shirt" /><span>裤子</span><input type="color" v-model="p.pants" /><span>鞋子</span><input type="color" v-model="p.shoes" /></div>
          <div class="row">
            <label class="ck"><input type="checkbox" v-model="p.longSleeve" /> 长袖</label>
            <label class="ck"><input type="checkbox" v-model="p.shorts" /> 短裤</label>
            <label class="ck"><input type="checkbox" v-model="p.glasses" /> 眼镜</label>
            <label class="ck" v-if="p.gender === 'f'"><input type="checkbox" v-model="p.dress" /> 裙子</label>
          </div>
          <div class="row custom">
            <span>自定义皮肤</span>
            <label class="mc-btn small">上传 64×64 PNG<input type="file" accept="image/png" hidden @change="upload" /></label>
            <button v-if="customSkin" class="mc-btn small" @click="customSkin = null">移除</button>
          </div>
          <div class="muted hint">支持标准 Minecraft 皮肤格式（64×64）。</div>
        </div>
      </div>
      <div class="actions">
        <button class="mc-btn" @click="step = 'menu'">返回</button>
        <button class="mc-btn primary" @click="saveChar">确认角色 ▶</button>
      </div>
    </div>

    <!-- 选择出生地点 -->
    <div v-else-if="step === 'spawn'" class="spawn mc-panel">
      <div class="mc-title">选择出生地点</div>
      <div class="spawn-grid">
        <button v-if="store.save.lastPos" class="spawn-card last" @click="go({ pos: store.save.lastPos, yaw: store.save.lastPos.yaw })">
          <div class="sn">📍 上次位置</div>
          <div class="muted">继续上次的旅程</div>
        </button>
        <button v-for="s in SPAWNS" :key="s.id" class="spawn-card" @click="go(s)">
          <div class="sn">{{ s.name }}</div>
          <div class="muted">{{ s.desc }}</div>
          <div class="found" v-if="store.save.discovered.includes(s.lm)">✔ 已到访</div>
        </button>
      </div>
      <div class="actions"><button class="mc-btn" @click="step = 'menu'">返回</button></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import * as THREE from 'three'
import { store, persist, resetSave } from '../game/store.js'
import { SKIN_TONES, HAIR_COLORS, makeSkinCanvas, Character } from '../game/character.js'
import { SPAWNS } from '../game/Game.js'
import { G } from '../game/instance.js'

const emit = defineEmits(['start'])
const step = ref('menu')
const showHelp = ref(false)
const hasProfile = computed(() => !!store.save.profile)
const name = ref(store.save.profile ? store.save.profile.name : '')
const p = reactive(store.save.profile ? { ...store.save.profile.skinParams } : { gender: 'm', skin: SKIN_TONES[0], hair: HAIR_COLORS[0], hairStyle: 'short', shirt: '#c8282a', pants: '#2a3a5a', shoes: '#222222', longSleeve: false, shorts: false, glasses: false, dress: false, seed: 1 })
const customSkin = ref(store.save.profile ? store.save.profile.customSkin || null : null)
const hairStyles = [{ v: 'short', n: '短发' }, { v: 'long', n: '长发' }, { v: 'bald', n: '寸头' }]
const previewEl = ref(null)
let pv = null

function newChar() {
  step.value = 'create'
}
function reset() {
  if (confirm('确定清除所有存档（含图鉴与进度）吗？')) {
    resetSave()
    location.reload()
  }
}
function randomize() {
  const r = Math.random
  p.gender = r() < 0.5 ? 'm' : 'f'
  p.skin = SKIN_TONES[Math.floor(r() * 4)]
  p.hair = HAIR_COLORS[Math.floor(r() * HAIR_COLORS.length)]
  p.hairStyle = p.gender === 'f' ? 'long' : 'short'
  const hex = () => '#' + Math.floor(r() * 0xffffff).toString(16).padStart(6, '0')
  p.shirt = hex()
  p.pants = hex()
  p.shorts = r() < 0.3
  p.glasses = r() < 0.2
}
function upload(e) {
  const f = e.target.files[0]
  if (!f) return
  const rd = new FileReader()
  rd.onload = () => {
    const img = new Image()
    img.onload = () => {
      if (img.width !== 64 || (img.height !== 64 && img.height !== 32)) return alert('请上传 64×64 的皮肤图片')
      const c = document.createElement('canvas')
      c.width = c.height = 64
      c.getContext('2d').drawImage(img, 0, 0)
      customSkin.value = c.toDataURL('image/png')
    }
    img.src = rd.result
  }
  rd.readAsDataURL(f)
}
function saveChar() {
  store.save.profile = { name: name.value.trim() || '羊城旅行家', skinParams: { ...p }, customSkin: customSkin.value }
  persist()
  if (G.game) G.game.refreshSkin()
  step.value = 'spawn'
}
function go(s) {
  emit('start', s)
}

// ---- 3D 预览 ----
function skinCanvas() {
  if (customSkin.value) {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const img = new Image()
    img.onload = () => {
      c.getContext('2d').drawImage(img, 0, 0)
      if (pv) pv.ch.mat.map.needsUpdate = true
    }
    img.src = customSkin.value
    return c
  }
  return makeSkinCanvas(p)
}
function initPreview() {
  const el = previewEl.value
  if (!el) return
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  r.setPixelRatio(Math.min(2, window.devicePixelRatio))
  r.setSize(el.clientWidth, el.clientHeight)
  r.outputColorSpace = THREE.SRGBColorSpace
  el.appendChild(r.domElement)
  const sc = new THREE.Scene()
  sc.add(new THREE.HemisphereLight(0xffffff, 0x666666, 2.2))
  const dl = new THREE.DirectionalLight(0xffffff, 1.5)
  dl.position.set(2, 3, 4)
  sc.add(dl)
  const cam = new THREE.PerspectiveCamera(35, el.clientWidth / el.clientHeight, 0.1, 50)
  cam.position.set(0, 1.2, 4.4)
  cam.lookAt(0, 0.95, 0)
  const ch = new Character(skinCanvas(), { accessories: ['camera'] })
  sc.add(ch.group)
  const ground = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 1.6), new THREE.MeshLambertMaterial({ color: 0x5f9a3e }))
  ground.position.y = -0.1
  sc.add(ground)
  let raf
  const clock = new THREE.Clock()
  const loop = () => {
    raf = requestAnimationFrame(loop)
    const dt = clock.getDelta()
    ch.group.rotation.y += dt * 0.7
    ch.update(dt, 0)
    r.render(sc, cam)
  }
  loop()
  pv = { r, ch, stop: () => cancelAnimationFrame(raf) }
}
function disposePreview() {
  if (pv) {
    pv.stop()
    pv.r.dispose()
    pv.r.domElement.remove()
    pv = null
  }
}
watch(step, async (s) => {
  disposePreview()
  if (s === 'create') {
    await nextTick()
    initPreview()
  }
})
watch([() => ({ ...p }), customSkin], () => {
  if (pv) pv.ch.setSkin(skinCanvas())
})
onBeforeUnmount(disposePreview)
</script>

<style scoped>
.menu-root { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.skyline { position: absolute; inset: 0; width: 100%; height: 100%; }
.center { position: relative; display: flex; flex-direction: column; align-items: center; gap: 22px; padding: 16px; }
.logo { text-align: center; }
.big { font-size: clamp(44px, 9vw, 88px); font-weight: 900; letter-spacing: 8px; color: #ffd76a; text-shadow: 4px 4px 0 #8a2a1a, 8px 8px 0 rgba(0,0,0,0.4); }
.sub { margin-top: 6px; font-size: clamp(12px, 2vw, 16px); letter-spacing: 4px; color: #fff; text-shadow: 2px 2px 0 #000; }
.col { display: flex; flex-direction: column; gap: 10px; }
.wide { width: min(340px, 80vw); }
.help { padding: 12px 18px; font-size: 13px; max-width: 640px; line-height: 1.9; }
.help p { margin: 4px 0; }
.foot { font-size: 12px; text-shadow: 1px 1px 0 #000; }
.create, .spawn { position: relative; width: min(900px, 94vw); max-height: 92vh; display: flex; flex-direction: column; padding: 18px; gap: 12px; }
.create-body { display: flex; gap: 16px; min-height: 0; flex: 1; }
.preview { width: 260px; min-height: 340px; background: radial-gradient(circle, #4a5a7a, #1a1e2a); border: 3px solid #0d0e11; flex-shrink: 0; }
.form { flex: 1; display: flex; flex-direction: column; gap: 10px; font-size: 14px; max-height: 60vh; }
.form input:not([type]) { margin-left: 8px; padding: 6px 8px; background: #111; color: #fff; border: 2px solid #555; font-size: 14px; width: 200px; }
.row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.row > span { min-width: 34px; }
.sw { width: 26px; height: 26px; border: 3px solid #111; display: inline-block; cursor: pointer; }
.sw.on { outline: 3px solid #ffd76a; }
input[type='color'] { width: 40px; height: 30px; border: 2px solid #111; padding: 0; background: none; }
.ck { display: flex; align-items: center; gap: 4px; margin-right: 8px; }
.hint { font-size: 12px; }
.actions { display: flex; justify-content: flex-end; gap: 10px; }
.spawn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; overflow-y: auto; }
.spawn-card { text-align: left; padding: 14px; background: linear-gradient(#3a3e48, #2a2d35); border: 3px solid #0d0e11; box-shadow: inset 2px 2px 0 rgba(255,255,255,0.15); color: #fff; cursor: pointer; font-family: inherit; position: relative; }
.spawn-card:hover { background: linear-gradient(#4a5a8a, #3a4870); }
.spawn-card.last { background: linear-gradient(#5a7a3a, #3a5a2a); }
.sn { font-size: 17px; font-weight: 800; margin-bottom: 4px; }
.found { position: absolute; right: 8px; top: 8px; font-size: 12px; color: #8f8; }
@media (max-width: 640px) {
  .create-body { flex-direction: column; }
  .preview { width: 100%; min-height: 200px; height: 200px; }
}
</style>
