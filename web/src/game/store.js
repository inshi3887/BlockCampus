// 全局响应式状态（Vue）+ 存档 + 任务进度
import { reactive } from 'vue'
import { NOVICE, QUESTS, DAILY_POOL, FOODS, CULTURE, SOUVENIRS } from './data.js'
import { mulberry32, todayKey } from './util.js'

const SAVE_KEY = 'block-guangzhou-save-v1'

function defaultSave() {
  return {
    profile: null, // {name, gender, skinParams, customSkin(dataURL)}
    money: 500,
    discovered: [],
    photographed: {}, // id -> count
    nightPhotos: [],
    foods: [],
    culture: [],
    items: {}, // souvenirId -> count
    novice: 0,
    quests: {}, // id -> done
    views: [],
    flags: {},
    talked: 0,
    districts: [],
    stats: { photos: 0, walk: 0, bus: 0, metro: 0, cruise: 0 },
    daily: { date: '', ids: [], progress: {}, done: {} },
    settings: { quality: 'high', reflect: true, shadows: true, timeSpeed: 1, sensitivity: 1, showMinimap: true },
    lastPos: null
  }
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY))
    if (s) return { ...defaultSave(), ...s, settings: { ...defaultSave().settings, ...(s.settings || {}) }, stats: { ...defaultSave().stats, ...(s.stats || {}) } }
  } catch (e) {}
  return defaultSave()
}

export const store = reactive({
  save: load(),
  ui: {
    screen: 'menu', // menu | create | spawn | game
    panel: null, // map | album | dex | bag | tasks | settings | shop | metro | dialog | help
    photoMode: false,
    photoView: 'third',
    filter: 'none',
    prompt: null,
    toasts: [],
    banner: null,
    hud: { district: '', place: '', time: '09:00', period: '早晨', weather: 'sunny', weatherName: '晴天', weatherIcon: '☀️', fps: 0, heading: 0, ride: null, loading: 0 },
    dialog: null,
    shop: null,
    flash: false,
    lastPhoto: null,
    fade: false,
    fadeText: '',
    rideInfo: null,
    pointerLocked: false,
    mobile: false,
    portrait: false, // 移动端竖屏
    fullscreen: false,
    ignorePortrait: false, // 用户选择继续竖屏游玩
    waypoint: null,
    loadingText: ''
  }
})

let saveTimer = null
export function persist() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(store.save))
    } catch (e) {}
  }, 300)
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY)
  Object.assign(store.save, defaultSave())
}

export function toast(text, kind = 'info', ms = 3200) {
  const id = Math.random()
  store.ui.toasts.push({ id, text, kind })
  setTimeout(() => {
    const i = store.ui.toasts.findIndex((t) => t.id === id)
    if (i >= 0) store.ui.toasts.splice(i, 1)
  }, ms)
}

export function banner(title, sub = '', ms = 3500) {
  store.ui.banner = { title, sub, id: Math.random() }
  const id = store.ui.banner.id
  setTimeout(() => {
    if (store.ui.banner && store.ui.banner.id === id) store.ui.banner = null
  }, ms)
}

// ---------- 每日任务 ----------
export function ensureDaily() {
  const d = store.save.daily
  const k = todayKey()
  if (d.date === k) return
  const seed = k.split('-').reduce((a, b) => a * 31 + Number(b), 7)
  const r = mulberry32(seed)
  const pool = DAILY_POOL.slice()
  const ids = []
  while (ids.length < 3) {
    const i = Math.floor(r() * pool.length)
    ids.push(pool.splice(i, 1)[0].id)
  }
  store.save.daily = { date: k, ids, progress: { photos: [], talk: 0, districts: [], counts: {} }, done: {} }
  persist()
}

function grant(reward, title) {
  if (!reward) return
  if (reward.money) store.save.money += reward.money
  if (reward.item) addItem(reward.item)
  toast(`🎁 任务完成「${title}」 +¥${reward.money || 0}${reward.item ? ' · ' + SOUVENIRS[reward.item].icon + SOUVENIRS[reward.item].name : ''}`, 'reward', 4500)
}

export function addItem(id, n = 1) {
  const had = store.save.items[id] || 0
  store.save.items[id] = had + n
  if (!had) toast(`获得纪念品：${SOUVENIRS[id].icon} ${SOUVENIRS[id].name}`, 'item')
  persist()
}

function condMet(c) {
  const s = store.save
  switch (c.type) {
    case 'photo': return !!s.photographed[c.id]
    case 'discover': return s.discovered.includes(c.id)
    case 'buy': return s.foods.includes(c.id)
    case 'deck': return !!s.flags.deck
    case 'photoSet': return c.ids.filter((i) => s.photographed[i]).length >= c.n
    case 'discoverSet': return c.ids.filter((i) => s.discovered.includes(i)).length >= c.n
    case 'nightPhoto': return s.nightPhotos.includes(c.id)
    case 'cruise': return s.stats.cruise > 0
    case 'view': return s.views.includes(c.id)
    case 'foodCount': return s.foods.length >= c.n
    case 'cultureCount': return s.culture.length >= c.n
    case 'multi': return c.parts.every(condMet)
  }
  return false
}

export function condProgress(c) {
  const s = store.save
  switch (c.type) {
    case 'photoSet': return [c.ids.filter((i) => s.photographed[i]).length, c.n]
    case 'discoverSet': return [c.ids.filter((i) => s.discovered.includes(i)).length, c.n]
    case 'foodCount': return [s.foods.length, c.n]
    case 'cultureCount': return [s.culture.length, c.n]
    case 'multi': return [c.parts.filter(condMet).length, c.parts.length]
  }
  return [condMet(c) ? 1 : 0, 1]
}

function dailyValue(c) {
  const p = store.save.daily.progress
  switch (c.type) {
    case 'dailyPhotos': return p.photos.length
    case 'dailyTalk': return p.talk
    case 'dailyDistricts': return p.districts.length
    case 'dailyCount': return p.counts[c.key] || 0
  }
  return 0
}
export function dailyProgress(t) {
  return [Math.min(t.cond.n, Math.floor(dailyValue(t.cond))), t.cond.n]
}

export function checkTasks() {
  const s = store.save
  // 新手链
  while (s.novice < NOVICE.length && condMet(NOVICE[s.novice].cond)) {
    const t = NOVICE[s.novice]
    s.novice++
    grant(t.reward, t.title)
    if (s.novice < NOVICE.length) toast(`📌 新任务：${NOVICE[s.novice].title}`, 'task', 4500)
    else banner('🎉 广州旅行完成！', '你已成为“羊城旅行家”，继续探索更多景点吧')
  }
  for (const q of QUESTS) {
    if (s.quests[q.id]) continue
    if (condMet(q.cond)) {
      s.quests[q.id] = true
      grant(q.reward, q.title)
    }
  }
  ensureDaily()
  const d = s.daily
  for (const id of d.ids) {
    if (d.done[id]) continue
    const t = DAILY_POOL.find((x) => x.id === id)
    if (t && dailyValue(t.cond) >= t.cond.n) {
      d.done[id] = true
      grant(t.reward, '每日：' + t.title)
    }
  }
  persist()
}

// ---------- 事件 ----------
export const events = {
  discover(id, name) {
    const s = store.save
    if (s.discovered.includes(id)) return false
    s.discovered.push(id)
    checkTasks()
    return true
  },
  photo(ids, { night, selfie }) {
    const s = store.save
    ensureDaily()
    s.stats.photos++
    const fresh = []
    for (const id of ids) {
      if (!s.photographed[id]) fresh.push(id)
      s.photographed[id] = (s.photographed[id] || 0) + 1
      if (night && !s.nightPhotos.includes(id)) s.nightPhotos.push(id)
      if (!s.daily.progress.photos.includes(id)) s.daily.progress.photos.push(id)
    }
    const c = s.daily.progress.counts
    if (night) c.nightPhoto = (c.nightPhoto || 0) + 1
    if (selfie) c.selfie = (c.selfie || 0) + 1
    if (s.stats.photos === 10) addItem('s_postcard')
    checkTasks()
    return fresh
  },
  buy(id, price) {
    const s = store.save
    if (s.money < price) return false
    s.money -= price
    ensureDaily()
    if (FOODS[id]) {
      if (!s.foods.includes(id)) {
        s.foods.push(id)
        toast(`🍽️ 图鉴解锁：${FOODS[id].icon} ${FOODS[id].name}`, 'dex')
      }
      s.daily.progress.counts.food = (s.daily.progress.counts.food || 0) + 1
      if (id === 'dimsum') events.culture('teaculture')
    } else if (SOUVENIRS[id]) addItem(id)
    checkTasks()
    return true
  },
  culture(id) {
    const s = store.save
    ensureDaily()
    if (!s.culture.includes(id)) {
      s.culture.push(id)
      toast(`🏮 图鉴解锁：${CULTURE[id].icon} ${CULTURE[id].name}`, 'dex')
      s.daily.progress.counts.culture = (s.daily.progress.counts.culture || 0) + 1
      const rewards = { lion: 's_lion', wuyang: 's_ram', kapok: 's_kapok', opera: 's_opera' }
      if (rewards[id]) addItem(rewards[id])
    }
    checkTasks()
  },
  talk() {
    ensureDaily()
    store.save.talked++
    store.save.daily.progress.talk++
    checkTasks()
  },
  district(id) {
    const s = store.save
    ensureDaily()
    if (!s.districts.includes(id)) s.districts.push(id)
    if (!s.daily.progress.districts.includes(id)) s.daily.progress.districts.push(id)
    checkTasks()
  },
  count(key, n = 1) {
    const s = store.save
    ensureDaily()
    if (s.stats[key] != null) s.stats[key] += n
    s.daily.progress.counts[key] = (s.daily.progress.counts[key] || 0) + n
    if (key === 'metro' && !s.items.s_card) addItem('s_card')
    if (key === 'cruise' && !s.items.s_cruise) addItem('s_cruise')
    if (key === 'cable' && !s.items.s_cable) addItem('s_cable')
    checkTasks()
  },
  deck() {
    const s = store.save
    if (!s.flags.deck) {
      s.flags.deck = true
      addItem('s_tower')
    }
    checkTasks()
  },
  view(id) {
    const s = store.save
    if (id && !s.views.includes(id)) s.views.push(id)
    checkTasks()
  }
}

export function totalCollect() {
  return Object.keys(FOODS).length + Object.keys(CULTURE).length
}

if (import.meta.env.DEV) window.__S = store
