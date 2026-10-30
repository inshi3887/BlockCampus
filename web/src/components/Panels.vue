<template>
  <div v-if="ui.panel" class="overlay" @mousedown.self="close">
    <!-- 地图 -->
    <div v-if="ui.panel === 'map'" class="mc-panel panel big">
      <div class="head"><span class="mc-title">🗺 广州地图</span><span class="muted">滚轮缩放 · 拖动平移 · 点击景点设置导航</span><button class="mc-btn small" @click="close">✕</button></div>
      <div class="map-body">
        <div class="map-wrap" ref="mapWrap">
          <canvas ref="mapCv" @mousedown="mapDown" @mousemove="mapMove" @mouseup="mapUp" @mouseleave="mapUp" @wheel.prevent="mapWheel" @touchstart.prevent="mapTouch" @touchmove.prevent="mapTouchMove"></canvas>
        </div>
        <div class="map-side scroll">
          <div class="legend">
            <div v-for="(d, k) in DISTRICTS" :key="k" class="lg"><i :style="{ background: d.color }"></i>{{ d.name }}<span class="muted"> {{ d.theme }}</span></div>
            <div class="lg"><i style="background:#ffd040;border-radius:50%"></i>已拍摄 <i style="background:#fff;border-radius:50%;margin-left:8px"></i>已发现 <i style="background:#555;border-radius:50%;margin-left:8px"></i>未发现</div>
            <div class="lg"><i style="background:#b8222a"></i>地铁站 <i style="background:#d8302a;width:18px;height:3px;margin-left:8px"></i>观光巴士</div>
          </div>
          <div v-if="sel" class="sel mc-panel">
            <div><span class="tag" :class="sel.def.grade">{{ sel.def.grade }}</span><b>{{ known(sel) ? sel.def.name : '？？？' }}</b></div>
            <div class="muted">{{ DISTRICTS[sel.def.district].name }} · 距离 {{ distOf(sel) }}</div>
            <div class="desc" v-if="known(sel)">{{ sel.def.desc }}</div>
            <div class="desc muted" v-else>尚未发现的景点，前往探索吧！</div>
            <button class="mc-btn small green" @click="navTo(sel)">📍 设为导航目标</button>
          </div>
          <button v-if="ui.waypoint" class="mc-btn small" @click="G.game.setWaypoint(null)">取消导航</button>
          <div class="lmlist">
            <div v-for="it in lmList" :key="it.def.id" class="lmi" :class="{ on: sel === it }" @click="selectLm(it)">
              <span class="tag" :class="it.def.grade">{{ it.def.grade }}</span>{{ known(it) ? it.def.name : '？？？' }}
              <span class="muted">{{ DISTRICTS[it.def.district].name }}</span>
              <span v-if="store.save.photographed[it.def.id]">📷</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 相册 -->
    <div v-else-if="ui.panel === 'album'" class="mc-panel panel big">
      <div class="head"><span class="mc-title">📷 广州旅游相册</span><span class="muted">共 {{ photos.length }} 张</span><button class="mc-btn small" @click="close">✕</button></div>
      <div class="checklist">
        <span v-for="it in lmVisible" :key="it.def.id" class="ck" :class="{ on: store.save.photographed[it.def.id] }">{{ store.save.photographed[it.def.id] ? '☑' : '☐' }} {{ known(it) ? it.def.name : '？？？' }}</span>
      </div>
      <div v-if="viewing" class="viewer">
        <img :src="viewing.full" />
        <div class="vbar">
          <b>{{ viewing.title }}</b><span class="muted">{{ viewing.sub }}</span>
          <a class="mc-btn small green" :href="viewing.full" :download="'方块羊城-' + viewing.id + '.jpg'">⬇ 下载</a>
          <button class="mc-btn small" @click="delPhoto(viewing)">🗑 删除</button>
          <button class="mc-btn small" @click="viewing = null">返回</button>
        </div>
      </div>
      <div v-else class="photos scroll">
        <div v-if="!photos.length" class="muted empty">还没有照片。按 <kbd>C</kbd> 进入摄影模式，点击画面或按 <kbd>F</kbd> 拍照。</div>
        <div v-for="ph in photos" :key="ph.id" class="ph" @click="viewing = ph">
          <img :src="ph.thumb" />
          <div class="pt">{{ ph.title }}</div>
        </div>
      </div>
    </div>

    <!-- 图鉴 -->
    <div v-else-if="ui.panel === 'dex'" class="mc-panel panel big">
      <div class="head"><span class="mc-title">📖 广州百科图鉴</span><span class="muted">完成度 {{ dexDone }}/{{ dexTotal }}</span><button class="mc-btn small" @click="close">✕</button></div>
      <div class="tabs">
        <button v-for="t in dexTabs" :key="t.id" class="mc-btn small" :class="{ active: dexTab === t.id }" @click="dexTab = t.id">{{ t.n }}</button>
      </div>
      <div class="dex scroll">
        <template v-if="dexTab === 'building'">
          <div v-for="it in lmVisible" :key="it.def.id" class="card" :class="{ locked: !store.save.photographed[it.def.id] }">
            <div class="ci">{{ store.save.photographed[it.def.id] ? '🏛️' : '❔' }}</div>
            <div class="cb">
              <div><span class="tag" :class="it.def.grade">{{ it.def.grade }}级</span><b>{{ store.save.photographed[it.def.id] ? it.def.name : known(it) ? it.def.name + '（未拍摄）' : '？？？' }}</b><span v-if="it.def.alias && store.save.photographed[it.def.id]" class="muted"> · {{ it.def.alias }}</span></div>
              <div class="muted small">{{ DISTRICTS[it.def.district].name }} · {{ GRADE_INFO[it.def.grade] }}</div>
              <div class="desc">{{ store.save.photographed[it.def.id] ? it.def.desc : '拍摄该景点以解锁介绍。' }}</div>
            </div>
          </div>
        </template>
        <template v-else-if="dexTab === 'food'">
          <div v-for="(f, id) in FOODS" :key="id" class="card" :class="{ locked: !store.save.foods.includes(id) }">
            <div class="ci">{{ store.save.foods.includes(id) ? f.icon : '❔' }}</div>
            <div class="cb"><b>{{ store.save.foods.includes(id) ? f.name : '？？？' }}</b><div class="desc">{{ store.save.foods.includes(id) ? f.desc : '在广州街头的小吃店购买以解锁。' }}</div></div>
          </div>
        </template>
        <template v-else>
          <div v-for="(c, id) in CULTURE" :key="id" class="card" :class="{ locked: !store.save.culture.includes(id) }">
            <div class="ci">{{ store.save.culture.includes(id) ? c.icon : '❔' }}</div>
            <div class="cb"><b>{{ store.save.culture.includes(id) ? c.name : '？？？' }}</b><div class="desc">{{ store.save.culture.includes(id) ? c.desc : hintCulture[id] }}</div></div>
          </div>
        </template>
      </div>
    </div>

    <!-- 背包 -->
    <div v-else-if="ui.panel === 'bag'" class="mc-panel panel">
      <div class="head"><span class="mc-title">🎒 背包</span><span>💰 ¥{{ store.save.money }}</span><button class="mc-btn small" @click="close">✕</button></div>
      <div class="muted sub">纪念品</div>
      <div class="slots">
        <div v-for="(n, id) in store.save.items" :key="id" class="slot" :title="SOUVENIRS[id].name + '：' + SOUVENIRS[id].desc">
          <span class="si">{{ SOUVENIRS[id].icon }}</span><span class="sn">{{ SOUVENIRS[id].name }}</span><span class="cnt" v-if="n > 1">×{{ n }}</span>
        </div>
        <div v-if="!Object.keys(store.save.items).length" class="muted">空空如也，完成任务获得纪念品吧。</div>
      </div>
      <div class="muted sub">品尝过的美食</div>
      <div class="slots">
        <div v-for="id in store.save.foods" :key="id" class="slot"><span class="si">{{ FOODS[id].icon }}</span><span class="sn">{{ FOODS[id].name }}</span></div>
      </div>
      <div class="muted sub">旅行统计</div>
      <div class="stats">
        <span>📷 拍照 {{ store.save.stats.photos }}</span><span>🚶 步行 {{ Math.round(store.save.stats.walk) }} 米</span><span>🚌 巴士 {{ store.save.stats.bus }}</span><span>🚇 地铁 {{ store.save.stats.metro }}</span><span>🚢 夜游 {{ store.save.stats.cruise }}</span><span>💬 聊天 {{ store.save.talked }}</span><span>📍 景点 {{ store.save.discovered.length }}/{{ lmVisible.length }}</span>
      </div>
    </div>

    <!-- 任务 -->
    <div v-else-if="ui.panel === 'tasks'" class="mc-panel panel">
      <div class="head"><span class="mc-title">📌 任务</span><button class="mc-btn small" @click="close">✕</button></div>
      <div class="scroll tasklist">
        <div class="muted sub">新手任务 · 广州初体验</div>
        <div v-for="(t, i) in NOVICE" :key="t.id" class="trow" :class="{ done: i < store.save.novice, cur: i === store.save.novice }">
          <span>{{ i < store.save.novice ? '☑' : '□' }}</span>
          <div><b>{{ t.title }}</b><div class="muted small">{{ t.desc }}</div></div>
          <span class="rw">¥{{ t.reward.money }}</span>
        </div>
        <div class="muted sub">每日任务 · {{ store.save.daily.date }}</div>
        <div v-for="t in daily" :key="t.id" class="trow" :class="{ done: t.done }">
          <span>{{ t.done ? '☑' : '□' }}</span>
          <div><b>{{ t.title }}</b> <span class="muted">{{ t.p[0] }}/{{ t.p[1] }}</span></div>
          <span class="rw">¥{{ t.reward.money }}</span>
        </div>
        <div class="muted sub">城市任务</div>
        <div v-for="q in QUESTS" :key="q.id" class="trow" :class="{ done: store.save.quests[q.id] }">
          <span>{{ store.save.quests[q.id] ? '☑' : '□' }}</span>
          <div><b>{{ q.title }}</b> <span class="muted">{{ condProgress(q.cond).join('/') }}</span><div class="muted small">{{ q.desc }}</div></div>
          <span class="rw">{{ SOUVENIRS[q.reward.item].icon }}</span>
        </div>
      </div>
    </div>

    <!-- 设置 -->
    <div v-else-if="ui.panel === 'settings'" class="mc-panel panel">
      <div class="head"><span class="mc-title">⚙ 设置</span><button class="mc-btn small" @click="close">✕</button></div>
      <div class="set">
        <div class="srow"><span>画质</span>
          <button v-for="q in qualities" :key="q.v" class="mc-btn small" :class="{ active: st.quality === q.v }" @click="st.quality = q.v; apply()">{{ q.n }}</button>
        </div>
        <div class="srow"><span>珠江倒影</span><button class="mc-btn small" :class="{ active: st.reflect }" @click="st.reflect = !st.reflect; apply()">{{ st.reflect ? '开' : '关' }}</button>
          <span>阴影</span><button class="mc-btn small" :class="{ active: st.shadows }" @click="st.shadows = !st.shadows; apply()">{{ st.shadows ? '开' : '关' }}</button>
          <span>小地图</span><button class="mc-btn small" :class="{ active: st.showMinimap }" @click="st.showMinimap = !st.showMinimap; apply()">{{ st.showMinimap ? '开' : '关' }}</button>
        </div>
        <div class="srow"><span>时间流速</span>
          <button v-for="s in [0, 0.5, 1, 3, 10]" :key="s" class="mc-btn small" :class="{ active: st.timeSpeed === s }" @click="st.timeSpeed = s; apply()">{{ s === 0 ? '暂停' : s + '×' }}</button>
        </div>
        <div class="srow"><span>设定时间</span>
          <button v-for="h in timeOpts" :key="h.h" class="mc-btn small" @click="setHour(h.h)">{{ h.n }}</button>
        </div>
        <div class="srow"><span>天气</span>
          <button class="mc-btn small" :class="{ active: !weatherLocked }" @click="unlockWeather">随机</button>
          <button v-for="(w, k) in WEATHERS" :key="k" class="mc-btn small" :class="{ active: weatherLocked === k }" @click="lockWeather(k)">{{ w.icon }} {{ w.name }}</button>
        </div>
        <div class="srow"><span>鼠标灵敏度</span><input type="range" min="0.3" max="2.5" step="0.1" v-model.number="st.sensitivity" @change="apply" /> {{ st.sensitivity }}</div>
        <div class="srow"><button class="mc-btn small" @click="backToMenu">返回主菜单（修改角色/换出生点）</button></div>
        <div class="muted small">提示：低端设备请选择“流畅”，并关闭珠江倒影与阴影。</div>
      </div>
    </div>

    <!-- 商店 -->
    <div v-else-if="ui.panel === 'shop' && ui.shop" class="mc-panel panel">
      <div class="head"><span class="mc-title">🏮 {{ ui.shop.name }}</span><span>💰 ¥{{ store.save.money }}</span><button class="mc-btn small" @click="close">✕</button></div>
      <div class="greet">“{{ ui.shop.greet }}”</div>
      <div class="shop">
        <div v-for="id in ui.shop.items" :key="id" class="sitem">
          <span class="si">{{ itemOf(id).icon }}</span>
          <div class="cb"><b>{{ itemOf(id).name }}</b><div class="muted small">{{ itemOf(id).desc }}</div></div>
          <button class="mc-btn small primary" @click="G.game.buy(id)">¥{{ itemOf(id).price }} 购买</button>
          <span v-if="store.save.foods.includes(id) || store.save.items[id]" class="have">✔</span>
        </div>
      </div>
    </div>

    <!-- 地铁 -->
    <div v-else-if="ui.panel === 'metro'" class="mc-panel panel">
      <div class="head"><span class="mc-title">🚇 广州地铁 · 快速传送</span><button class="mc-btn small" @click="close">✕</button></div>
      <div class="muted">当前车站：{{ ui.metroFrom && ui.metroFrom.name }} · 选择目的地站点</div>
      <div class="metro scroll">
        <button v-for="s in METRO_STATIONS" :key="s.id" class="mst" :disabled="ui.metroFrom && s.id === ui.metroFrom.id" @click="G.game.metroTravel(s)">
          <b>{{ s.name }}</b>
          <span class="lines"><span v-for="l in s.lines" :key="l" class="ln" :style="{ background: lineColor(l) }">{{ l }}</span></span>
          <span class="muted small">{{ DISTRICTS[districtAt(s.x, s.z)].name }}</span>
        </button>
      </div>
    </div>

    <!-- 帮助 -->
    <div v-else-if="ui.panel === 'help'" class="mc-panel panel">
      <div class="head"><span class="mc-title">❓ 操作说明</span><button class="mc-btn small" @click="close">✕</button></div>
      <div class="help">
        <p><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移动 · 鼠标旋转视角（点击画面锁定）· 右键拖动也可旋转 · <kbd>Shift</kbd> 奔跑 · <kbd>空格</kbd> 跳跃 · 滚轮 镜头远近</p>
        <p><kbd>V</kbd> 第一/第三人称 · <kbd>E</kbd> 交互（对话、乘车、购物、观看表演）· <kbd>T</kbd> 时间快进到下个时段</p>
        <p><kbd>C</kbd> 摄影模式：<kbd>V</kbd> 切换第一人称/第三人称/自拍，<kbd>1</kbd>-<kbd>6</kbd> 切换滤镜（岭南复古、夜广州霓虹…），点击画面或 <kbd>F</kbd> 拍照，滚轮变焦</p>
        <p><kbd>M</kbd> 地图 · <kbd>B</kbd> 背包 · <kbd>P</kbd> 相册 · <kbd>N</kbd> 图鉴 · <kbd>J</kbd> 任务 · <kbd>Esc</kbd> 关闭面板</p>
        <p>🎯 玩法：步行探索 → 发现景点 → 拍照解锁图鉴 → 完成任务获得纪念品。</p>
        <p>🚌 观光巴士 1 路：广州塔 ⇄ 珠江新城 ⇄ 北京路 ⇄ 陈家祠，在站台按 E 候车/上车。</p>
        <p>🚇 地铁：在红色“M”地铁口按 E，可快速传送至全市各站。</p>
        <p>🚢 珠江夜游：在天字码头或广州塔码头登船；🗼 广州塔：塔底入口乘电梯登塔；🚡 白云索道：白云山南门。</p>
        <p>🍜 美食：上下九（早茶、双皮奶、云吞面、烧鹅）、北京路（肠粉、牛杂）、荔枝湾（艇仔粥）、沙面（咖啡）。</p>
        <p>🏮 文化：陈家祠醒狮与陶塑、永庆坊粤剧、北京路广府文化、上下九骑楼、五羊石像、中山纪念堂木棉。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { store, condProgress, dailyProgress, persist } from '../game/store.js'
import { G } from '../game/instance.js'
import { FOODS, CULTURE, SOUVENIRS, NOVICE, QUESTS, DAILY_POOL } from '../game/data.js'
import { DISTRICTS, METRO_STATIONS, districtAt } from '../game/geo.js'
import { GRADE_INFO } from '../game/landmarks/index.js'
import { WEATHERS } from '../game/sky.js'
import { districtLabels } from '../game/map.js'
import { project } from '../game/geo.js'

const ui = store.ui
const st = store.save.settings
const close = () => (ui.panel = null)
const qualities = [{ v: 'low', n: '流畅' }, { v: 'medium', n: '均衡' }, { v: 'high', n: '高清' }]
const timeOpts = [{ h: 7, n: '早晨' }, { h: 14, n: '下午' }, { h: 18.2, n: '黄昏' }, { h: 21, n: '夜晚' }]
const dexTabs = [{ id: 'building', n: '🏛️ 建筑' }, { id: 'food', n: '🍜 食物' }, { id: 'culture', n: '🏮 文化' }]
const dexTab = ref('building')
const hintCulture = { opera: '在永庆坊粤剧艺术博物馆观看表演。', lion: '在陈家祠前广场观看醒狮。', guangfu: '北京路的广府文化源地。', qilou: '漫步上下九步行街。', huisu: '欣赏陈家祠的屋脊装饰。', wuyang: '前往越秀山五羊石像。', kapok: '中山纪念堂前的三百年木棉。', dragonboat: '在猎德大桥附近的珠江边观看龙舟。', teaculture: '在茶楼叹一次早茶。' }

const lmVisible = computed(() => (G.game ? G.game.landmarks.items.filter((i) => !i.def.hidden) : []))
const known = (it) => store.save.discovered.includes(it.def.id) || !!store.save.photographed[it.def.id]
const dexTotal = computed(() => lmVisible.value.length + Object.keys(FOODS).length + Object.keys(CULTURE).length)
const dexDone = computed(() => Object.keys(store.save.photographed).length + store.save.foods.length + store.save.culture.length)
const daily = computed(() => (store.save.daily.ids || []).map((id) => {
  const t = DAILY_POOL.find((x) => x.id === id)
  return { ...t, done: !!store.save.daily.done[id], p: dailyProgress(t) }
}))
const itemOf = (id) => FOODS[id] || SOUVENIRS[id]
const LINE_COLORS = { '1号线': '#f3d03e', '2号线': '#00629b', '3号线': '#ecaa00', '4号线': '#00843d', '5号线': '#c5003e', '6号线': '#80225f', '7号线': '#97d700', '8号线': '#008c95', APM: '#00b5e2' }
const lineColor = (l) => LINE_COLORS[l] || '#888'

function apply() {
  persist()
  if (G.game) {
    G.game.applyQuality()
    G.game.sensitivity = st.sensitivity
  }
}
const weatherLocked = ref(G.game ? G.game.sky.weatherLock : null)
function lockWeather(k) {
  G.game.sky.setWeather(k, true)
  weatherLocked.value = k
}
function unlockWeather() {
  G.game.sky.unlock()
  weatherLocked.value = null
}
function setHour(h) {
  G.game.sky.hour = h
}
function backToMenu() {
  ui.panel = null
  G.game.stop()
  store.ui.screen = 'menu'
  G.game.input.exitLock()
}

// ---- 相册 ----
const photos = ref([])
const viewing = ref(null)
async function loadPhotos() {
  photos.value = G.game ? await G.game.photo.listPhotos() : []
}
async function delPhoto(p) {
  if (!confirm('删除这张照片？')) return
  await G.game.photo.deletePhoto(p.id)
  viewing.value = null
  loadPhotos()
}

// ---- 地图 ----
const mapCv = ref(null)
const mapWrap = ref(null)
const sel = ref(null)
const view = { cx: 0, cz: 0, zoom: 1 }
let drag = null
const lmList = computed(() => lmVisible.value.slice().sort((a, b) => (known(b) ? 1 : 0) - (known(a) ? 1 : 0)))
function distOf(it) {
  const p = G.game.player.pos
  const d = Math.hypot(it.x - p.x, it.z - p.z) * 5
  return d > 1000 ? (d / 1000).toFixed(1) + ' km' : Math.round(d) + ' m'
}
function selectLm(it) {
  sel.value = it
  view.cx = it.x
  view.cz = it.z
  view.zoom = Math.max(view.zoom, 3)
  drawMap()
}
function navTo(it) {
  G.game.setWaypoint({ x: it.x, z: it.z, name: it.def.name })
  drawMap()
}
function drawMap() {
  const c = mapCv.value
  const g = G.game
  if (!c || !g) return
  const w = mapWrap.value.clientWidth, h = mapWrap.value.clientHeight
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  const bm = g.baseMap
  const fit = Math.min(w / bm.canvas.width, h / bm.canvas.height)
  const k = fit * view.zoom * bm.scale // 像素 / 世界单位
  const T = (x, z) => [(x - view.cx) * k + w / 2, (z - view.cz) * k + h / 2]
  ctx.fillStyle = '#5a8ab8'
  ctx.fillRect(0, 0, w, h)
  const [ox, oz] = T(bm.bounds.x0, bm.bounds.z0)
  ctx.imageSmoothingEnabled = view.zoom < 4
  ctx.drawImage(bm.canvas, ox, oz, bm.canvas.width * fit * view.zoom, bm.canvas.height * fit * view.zoom)
  // 区名
  const L = districtLabels()
  ctx.textAlign = 'center'
  for (const id in L) {
    const p = project(L[id][0], L[id][1])
    const [x, y] = T(p.x, p.z)
    ctx.font = `bold ${Math.min(26, 12 + view.zoom * 3)}px "Microsoft YaHei",sans-serif`
    ctx.fillStyle = 'rgba(40,30,20,0.55)'
    ctx.fillText(DISTRICTS[id].name, x, y)
  }
  // 地铁
  for (const m of METRO_STATIONS) {
    const [x, y] = T(m.x, m.z)
    ctx.fillStyle = '#b8222a'
    ctx.fillRect(x - 4, y - 4, 8, 8)
    if (view.zoom > 3) {
      ctx.font = '11px sans-serif'
      ctx.fillStyle = '#7a1010'
      ctx.fillText(m.name, x, y + 15)
    }
  }
  // 景点
  for (const it of lmVisible.value) {
    const [x, y] = T(it.x, it.z)
    const kn = known(it)
    ctx.fillStyle = store.save.photographed[it.def.id] ? '#ffd040' : kn ? '#ffffff' : '#555'
    ctx.strokeStyle = sel.value === it ? '#ff3030' : '#000'
    ctx.lineWidth = sel.value === it ? 3 : 2
    ctx.beginPath()
    ctx.arc(x, y, it.def.grade === 'S' ? 7 : 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    if (view.zoom > 1.6 || it.def.grade === 'S') {
      ctx.font = `bold ${it.def.grade === 'S' ? 13 : 11}px "Microsoft YaHei",sans-serif`
      ctx.lineWidth = 3
      ctx.strokeStyle = '#000'
      const t = kn ? it.def.name : '？'
      ctx.strokeText(t, x, y - 10)
      ctx.fillStyle = '#fff'
      ctx.fillText(t, x, y - 10)
    }
  }
  if (ui.waypoint) {
    const [x, y] = T(ui.waypoint.x, ui.waypoint.z)
    ctx.fillStyle = '#ffd040'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - 8, y - 16)
    ctx.lineTo(x + 8, y - 16)
    ctx.fill()
  }
  // 玩家
  const p = g.player.pos
  const [px, py] = T(p.x, p.z)
  ctx.save()
  ctx.translate(px, py)
  ctx.rotate(-g.player.camYaw)
  ctx.fillStyle = '#ff3a3a'
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, -11)
  ctx.lineTo(8, 9)
  ctx.lineTo(0, 4)
  ctx.lineTo(-8, 9)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
  ctx.textAlign = 'left'
  // 比例尺
  const km = 200 * k
  ctx.fillStyle = '#000'
  ctx.fillRect(16, h - 20, km, 4)
  ctx.font = '12px sans-serif'
  ctx.fillText('1 km', 16, h - 26)
  view.k = k
  view.T = T
}
function mapDown(e) {
  drag = { x: e.clientX, y: e.clientY, cx: view.cx, cz: view.cz, moved: false }
}
function mapMove(e) {
  if (!drag) return
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y
  if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true
  view.cx = drag.cx - dx / view.k
  view.cz = drag.cz - dy / view.k
  drawMap()
}
function mapUp(e) {
  if (drag && !drag.moved && e.type === 'mouseup') {
    // 点击选中最近景点
    const r = mapCv.value.getBoundingClientRect()
    const mx = e.clientX - r.left, my = e.clientY - r.top
    let best = null, bd = 18
    for (const it of lmVisible.value) {
      const [x, y] = view.T(it.x, it.z)
      const d = Math.hypot(x - mx, y - my)
      if (d < bd) {
        bd = d
        best = it
      }
    }
    if (best) {
      sel.value = best
      drawMap()
    }
  }
  drag = null
}
function mapWheel(e) {
  view.zoom = Math.max(0.8, Math.min(14, view.zoom * (e.deltaY < 0 ? 1.2 : 1 / 1.2)))
  drawMap()
}
let touch0 = null
function mapTouch(e) {
  const t = e.touches[0]
  touch0 = { x: t.clientX, y: t.clientY, cx: view.cx, cz: view.cz, d: e.touches.length > 1 ? Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY) : 0, zoom: view.zoom }
}
function mapTouchMove(e) {
  if (!touch0) return
  if (e.touches.length > 1 && touch0.d) {
    const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
    view.zoom = Math.max(0.8, Math.min(14, (touch0.zoom * d) / touch0.d))
  } else {
    const t = e.touches[0]
    view.cx = touch0.cx - (t.clientX - touch0.x) / view.k
    view.cz = touch0.cz - (t.clientY - touch0.y) / view.k
  }
  drawMap()
}

watch(() => ui.panel, async (p) => {
  if (p === 'album') {
    viewing.value = null
    loadPhotos()
  }
  if (p === 'map') {
    await nextTick()
    const pl = G.game.player.pos
    view.cx = pl.x
    view.cz = pl.z
    view.zoom = 3
    drawMap()
  }
  if (p === 'settings') weatherLocked.value = G.game.sky.weatherLock
})
</script>

<style scoped>
.overlay { position: fixed; inset: 0; z-index: 30; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.35); }
.panel { width: min(640px, 96vw); max-height: 90vh; display: flex; flex-direction: column; padding: 14px 16px; gap: 10px; }
.panel.big { width: min(1100px, 97vw); height: 90vh; }
.head { display: flex; align-items: center; gap: 12px; }
.head .mc-btn { margin-left: auto; }
.sub { margin-top: 6px; font-size: 13px; border-bottom: 2px solid #3a3e48; padding-bottom: 3px; }
.small { font-size: 12px; }
.map-body { flex: 1; display: flex; gap: 10px; min-height: 0; }
.map-wrap { flex: 1; position: relative; border: 3px solid #0d0e11; min-height: 0; }
.map-wrap canvas { position: absolute; inset: 0; width: 100%; height: 100%; cursor: grab; }
.map-side { width: 280px; display: flex; flex-direction: column; gap: 8px; font-size: 13px; }
.legend .lg { display: flex; align-items: center; gap: 5px; margin: 2px 0; font-size: 12px; }
.legend i { display: inline-block; width: 12px; height: 12px; border: 1px solid #000; }
.sel { padding: 10px; display: flex; flex-direction: column; gap: 5px; }
.desc { font-size: 12px; line-height: 1.6; }
.lmlist { display: flex; flex-direction: column; gap: 2px; }
.lmi { padding: 4px 6px; cursor: pointer; background: rgba(255,255,255,0.04); display: flex; gap: 4px; align-items: center; }
.lmi:hover, .lmi.on { background: rgba(232,176,74,0.25); }
.lmi .muted { margin-left: auto; font-size: 11px; }
.checklist { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; max-height: 70px; overflow-y: auto; }
.checklist .ck.on { color: #ffd040; }
.photos { flex: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; align-content: start; }
.ph { background: #fff; padding: 6px 6px 20px; cursor: pointer; transform: rotate(-1deg); box-shadow: 0 4px 10px rgba(0,0,0,0.5); color: #222; }
.ph:nth-child(2n) { transform: rotate(1.2deg); }
.ph:hover { transform: scale(1.03); }
.ph img { width: 100%; display: block; }
.pt { font-size: 12px; margin-top: 4px; font-weight: 700; }
.empty { padding: 30px; }
.viewer { flex: 1; display: flex; flex-direction: column; gap: 8px; min-height: 0; }
.viewer img { flex: 1; min-height: 0; object-fit: contain; width: 100%; background: #000; }
.vbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; font-size: 13px; }
.vbar a { text-decoration: none; }
.tabs { display: flex; gap: 6px; }
.dex { flex: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 8px; align-content: start; }
.card { display: flex; gap: 10px; padding: 10px; background: rgba(255,255,255,0.05); border: 2px solid #111; }
.card.locked { opacity: 0.6; }
.ci { font-size: 34px; width: 44px; text-align: center; }
.cb { flex: 1; font-size: 13px; }
.slots { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 6px; }
.slot { background: #3a3a3a; border: 2px solid #111; box-shadow: inset 2px 2px 0 #555, inset -2px -2px 0 #222; padding: 6px; display: flex; flex-direction: column; align-items: center; font-size: 12px; position: relative; }
.si { font-size: 28px; }
.cnt { position: absolute; right: 4px; bottom: 2px; font-weight: 800; }
.stats { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 13px; }
.tasklist { display: flex; flex-direction: column; gap: 4px; max-height: 70vh; }
.trow { display: flex; gap: 10px; align-items: flex-start; padding: 6px 8px; background: rgba(255,255,255,0.04); font-size: 13px; }
.trow > div { flex: 1; }
.trow.done { opacity: 0.55; }
.trow.cur { background: rgba(232,176,74,0.2); border-left: 4px solid #e8b04a; }
.rw { color: #ffd040; font-weight: 800; }
.set { display: flex; flex-direction: column; gap: 10px; font-size: 14px; }
.srow { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.srow > span { min-width: 70px; }
.greet { font-size: 14px; color: #ffe0a0; }
.shop { display: flex; flex-direction: column; gap: 6px; }
.sitem { display: flex; align-items: center; gap: 10px; padding: 8px; background: rgba(255,255,255,0.05); border: 2px solid #111; }
.have { color: #6f6; font-weight: 800; }
.metro { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 6px; max-height: 60vh; }
.mst { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; padding: 8px; background: #2c2f37; border: 2px solid #111; color: #fff; cursor: pointer; font-family: inherit; }
.mst:hover:not(:disabled) { background: #4a3a3a; }
.mst:disabled { opacity: 0.4; }
.lines { display: flex; gap: 3px; flex-wrap: wrap; }
.ln { font-size: 11px; padding: 0 4px; color: #fff; text-shadow: 1px 1px 0 #000; }
.help { font-size: 13px; line-height: 1.8; overflow-y: auto; }
.help p { margin: 4px 0; }
@media (max-width: 720px) {
  .map-body { flex-direction: column; }
  .map-side { width: 100%; max-height: 35%; }
  .dex { grid-template-columns: 1fr; }
}
</style>
