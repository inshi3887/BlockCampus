// 白云区 / 番禺区 / 南沙区
import * as THREE from 'three'
import { Builder } from '../builder.js'
import { C, banyan, kapok, roundTree, palm, lamp, bench, railing, paving, flowerBed, statue, pine, bamboo, chineseHall, paifang } from './common.js'
import { mulberry32 } from '../util.js'

// ---------------- 白云山 · 摩星岭 ----------------
export function buildMoxingling(b, ctx) {
  b.box(-14, -12, -14, 14, 0.4, 14, 0x9a948a)
  paving(b, -12, -12, 12, 12, 0.4, 0xb8b2a6)
  railing(b, -14, 14, 14, 14, 0.4, 1, 0x7a7468, 2)
  railing(b, -14, -14, 14, -14, 0.4, 1, 0x7a7468, 2)
  railing(b, -14, -14, -14, 14, 0.4, 1, 0x7a7468, 2)
  railing(b, 14, -14, 14, 14, 0.4, 1, 0x7a7468, 2)
  // 摩星岭石碑
  b.boxC(0, 0.4, 4, 2.4, 1, 1.2, 0x7a7468)
  b.boxC(0, 1.4, 4, 1.6, 4.5, 0.6, 0xc8c2b4)
  b.sign('摩星岭', 0, 4.3, 4.31, 0.7, 0, { bg: '#c8c2b4', fg: '#b02a22', vertical: true, px: 48 })
  b.sign('海拔382米', 0, 1.9, 4.31, 0.35, 0, { bg: '#c8c2b4', fg: '#3a2a1a', px: 32 })
  // 观景亭
  for (const [x, z] of [[-6, -4], [-2, -4], [-6, -8], [-2, -8]]) b.boxC(x, 0.4, z, 0.4, 3.6, 0.4, 0xb02a22, 'wood')
  b.hipRoof(-4, -6, 5, 5, 4, 2, C.glazedGreen, { over: 0.6, minW: 0.4, minD: 0.4 })
  b.boxC(-4, 6, -6, 0.3, 0.8, 0.3, C.gold, { solid: false })
  for (let i = 0; i < 6; i++) bench(b, 6, 0.4, -9 + i * 3, 'z')
  // 索道上站
  b.box(6, 0.4, -12, 12, 5, -6, 0xd8d8d8, 'window')
  b.sign('白云索道', 9, 4, -5.9, 0.6, 0, { bg: '#1a5a3a', fg: '#ffffff' })
  ctx.interact({ x: 0, z: 10, r: 6, label: '登高远眺：俯瞰广州', type: 'view', id: 'peak' })
  ctx.interact({ x: 9, z: -4, r: 3, label: '乘坐白云索道下山', type: 'cable', dir: -1 })
  ctx.crowd(0, 0, 10, 6)
}

export function buildBaiyunGate(b, ctx) {
  // 白云山南门：牌坊 + 索道下站
  paving(b, -20, -10, 20, 14, 0, 0xb8b2a6)
  paifang(b, 0, 6, 16, 9, '白云山', C.granite, C.glazedGreen)
  b.box(14, 0, -8, 22, 6, 0, 0xd8d8d8, 'window')
  b.sign('白云索道', 18, 5, 0.05, 0.7, 0, { bg: '#1a5a3a', fg: '#ffffff' })
  b.boxC(18, 6, -4, 1, 12, 1, 0x888888, { solid: false })
  for (let i = 0; i < 6; i++) {
    pine(b, -18 + i * 3, 0, -8, 1)
    bamboo(b, 24, 0, -8 + i * 3)
  }
  ctx.interact({ x: 18, z: 2, r: 3, label: '乘坐白云索道上山（摩星岭）', type: 'cable', dir: 1 })
  ctx.interact({ x: 0, z: 9, r: 6, label: '白云山', type: 'info', text: '白云山由30多座山峰组成，主峰摩星岭海拔382米，自古有“羊城第一秀”之称，“白云晚望”“蒲涧濂泉”曾入选羊城八景。' })
  ctx.crowd(0, 10, 14, 6)
}

// ---------------- 云台花园 ----------------
export function buildYuntai(b, ctx) {
  paving(b, -40, -30, 40, 30, 0, 0xc8c2b4)
  const r = mulberry32(8)
  // 规则式欧式花坛
  for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) if (i || j) flowerBed(b, i * 10 - 3.5, j * 10 - 3.5, i * 10 + 3.5, j * 10 + 3.5, 0, i * 13 + j)
  // 中央喷泉
  b.prism(0, 0, 0, 1, 6, 6, 16, 0xd8d4cc)
  b.prism(0, 0, 1, 1.05, 5.4, 5.4, 16, 0x4a90c8, { mat: 'pond', solid: false })
  b.prism(0, 0, 1, 3, 1, 1, 8, 0xd8d4cc)
  for (let i = 0; i < 10; i++) b.boxC(Math.cos(i) * 3, 1, Math.sin(i) * 3, 0.2, 2.5, 0.2, 0xdff4ff, { mat: 'glow', solid: false })
  // 玻璃温室
  for (let i = 0; i < 6; i++) b.boxC(30, i * 1.8, -20, 14 - i * 2, 1.8, 10 - i * 1.4, 0xbfe0f0, { mat: i % 2 ? 'glass' : 'curtain', solid: i === 0 })
  // 花钟
  b.prism(-28, 18, 0, 0.8, 5, 5, 16, 0x5a9a3a, { top: 0x5a9a3a })
  for (let k = 0; k < 12; k++) b.boxC(-28 + Math.cos((k / 12) * 6.283) * 4, 0.8, 18 + Math.sin((k / 12) * 6.283) * 4, 0.6, 0.3, 0.6, 0xf2c230, { solid: false })
  b.box(-28, 0.85, 17.8, -25, 1.0, 18.2, 0x222222, { solid: false })
  b.sign('云台花园', 0, 3, 30.05, 1.2, 0, { bg: '#2a6a3a', fg: '#ffffff' })
  for (let x = -38; x <= 38; x += 8) palm(b, x, 0, 27, 0.7)
  ctx.interact({ x: 0, z: 8, r: 6, label: '欣赏云台花园', type: 'view' })
  ctx.crowd(0, 0, 30, 20, 10)
}

// ---------------- 长隆欢乐世界 ----------------
function coasterPath(t) {
  // 参数化轨道：环形主线 + 两个垂直回环
  const a = t * Math.PI * 2
  let x = Math.cos(a) * 50, z = Math.sin(a) * 26, y = 12 + Math.sin(a * 3) * 8 + Math.cos(a * 2) * 4
  const loopC = [0.25, 0.7]
  for (const c of loopC) {
    const d = t - c
    if (Math.abs(d) < 0.04) {
      const u = (d / 0.04 + 1) * Math.PI
      const lx = Math.cos(c * Math.PI * 2) * 50, lz = Math.sin(c * Math.PI * 2) * 26
      x = lx + Math.sin(u) * 2 + (d / 0.04) * 6
      z = lz
      y = 14 - Math.cos(u) * 10
    }
  }
  return [x, Math.max(2, y), z]
}

export function buildChimelong(b, ctx) {
  paving(b, -70, -45, 70, 50, 0, 0xc8c0b0)
  // 入口城堡
  b.box(-16, 0, 36, 16, 10, 42, 0xe8d8b8)
  for (const x of [-16, -6, 6, 16]) {
    b.prism(x, 39, 0, 16, 3, 3, 8, 0xf0e0c0)
    b.prism(x, 39, 16, 21, 3.4, 3.4, 8, 0x3a6ab0, { rx1: 0.2, rz1: 0.2 })
  }
  b.box(-4, 0, 41.9, 4, 7, 42.1, 0x3a2a1a, { solid: false })
  b.sign('长隆欢乐世界', 0, 12.4, 42.1, 2, 0, { bg: '#c0392b', fg: '#ffe08a', glow: true })
  // 过山车轨道 + 支柱
  const N = 220
  let prev = coasterPath(0)
  for (let i = 1; i <= N; i++) {
    const p = coasterPath(i / N)
    b.beam(prev[0], prev[1], prev[2], p[0], p[1], p[2], 0.7, i % 2 ? 0xe03a2a : 0xf2c230)
    if (i % 6 === 0 && p[1] > 3) b.beam(p[0], 0, p[2], p[0], p[1] - 0.4, p[2], 0.4, 0x8a8a8a)
    prev = p
  }
  // 跳楼机
  b.boxC(-52, 0, -30, 3, 60, 3, 0xe8e8e8)
  b.boxC(-52, 60, -30, 5, 2, 5, 0xc0392b)
  // 旋转木马
  b.prism(48, -30, 0, 0.8, 8, 8, 12, 0xe8c050)
  for (let i = 0; i < 12; i++) b.boxC(48 + Math.cos(i * 0.52) * 6, 0.8, -30 + Math.sin(i * 0.52) * 6, 0.2, 4, 0.2, 0xf2f2f2, { solid: false })
  b.prism(48, -30, 4.8, 7.5, 8.5, 8.5, 12, 0xd83a6a, { rx1: 0.5, rz1: 0.5 })
  // 动态：过山车列车、跳楼机座舱、木马
  const carB = new Builder()
  carB.box(-1, 0, -0.9, 1, 1.2, 0.9, 0x2a7ae0, { solid: false })
  carB.box(-0.8, 1.2, -0.7, 0.8, 1.5, 0.7, 0xf2c230, { solid: false })
  const cars = []
  for (let i = 0; i < 5; i++) {
    const m = carB.build(false)
    if (i < 4) carB.box(-1, 0, -0.9, 1, 1.2, 0.9, 0x2a7ae0, { solid: false }), carB.box(-0.8, 1.2, -0.7, 0.8, 1.5, 0.7, 0xf2c230, { solid: false })
    ctx.add(m)
    cars.push(m)
  }
  const dropB = new Builder()
  dropB.boxC(0, 0, 0, 6, 1.5, 6, 0xf2c230, { solid: false })
  const drop = dropB.build(false)
  drop.position.set(-52, 2, -30)
  ctx.add(drop)
  ctx.onUpdate((dt, t) => {
    const base = (t * 0.035) % 1
    cars.forEach((m, i) => {
      const u = (base - i * 0.006 + 1) % 1
      const p = coasterPath(u), q = coasterPath((u + 0.002) % 1)
      m.position.set(p[0], p[1] + 0.4, p[2])
      m.rotation.y = Math.atan2(q[0] - p[0], q[2] - p[2])
    })
    const ph = (t * 0.15) % 1
    drop.position.y = ph < 0.6 ? 2 + (ph / 0.6) * 54 : ph < 0.7 ? 56 : 56 - ((ph - 0.7) / 0.08) * 54
    if (drop.position.y < 2) drop.position.y = 2
  })
  ctx.interact({ x: 0, z: 46, r: 6, label: '长隆欢乐世界', type: 'info', text: '长隆欢乐世界位于番禺区，拥有十环过山车、垂直过山车等大型游乐设备，是华南地区著名的主题乐园。' })
  ctx.crowd(0, 30, 50, 20, 26)
}

// ---------------- 长隆野生动物世界 ----------------
function animal(kind) {
  const ab = new Builder()
  if (kind === 'giraffe') {
    ab.boxC(0, 2.4, 0, 1.2, 1.4, 2.4, 0xd8a040, { solid: false })
    for (const [x, z] of [[-0.4, -0.9], [0.4, -0.9], [-0.4, 0.9], [0.4, 0.9]]) ab.boxC(x, 0, z, 0.3, 2.4, 0.3, 0xd8a040, { solid: false })
    ab.boxC(0, 3.6, 1.0, 0.45, 3.2, 0.45, 0xd8a040, { solid: false })
    ab.boxC(0, 6.6, 1.3, 0.6, 0.6, 1.0, 0xd8a040, { solid: false })
    for (let i = 0; i < 6; i++) ab.boxC(((i % 2) - 0.5) * 0.9, 2.6 + (i % 3) * 0.4, -0.8 + i * 0.35, 0.3, 0.3, 0.3, 0x8a5a20, { solid: false })
  } else if (kind === 'elephant') {
    ab.boxC(0, 1.6, 0, 2.4, 2.2, 3.6, 0x8a8a8a, { solid: false })
    for (const [x, z] of [[-0.8, -1.2], [0.8, -1.2], [-0.8, 1.2], [0.8, 1.2]]) ab.boxC(x, 0, z, 0.7, 1.6, 0.7, 0x7a7a7a, { solid: false })
    ab.boxC(0, 2.4, 2.2, 1.6, 1.6, 1.2, 0x8a8a8a, { solid: false })
    ab.boxC(0, 0.6, 2.9, 0.4, 2, 0.4, 0x7a7a7a, { solid: false })
    ab.box(-1.6, 2, 1.8, -0.8, 3.4, 2.2, 0x9a9a9a, { solid: false })
    ab.box(0.8, 2, 1.8, 1.6, 3.4, 2.2, 0x9a9a9a, { solid: false })
  } else if (kind === 'tiger') {
    ab.boxC(0, 0.8, 0, 0.9, 0.8, 2, 0xf4f4f0, { solid: false })
    for (let i = 0; i < 4; i++) ab.boxC(0, 1.2, -0.7 + i * 0.45, 0.92, 0.2, 0.15, 0x222222, { solid: false })
    for (const [x, z] of [[-0.3, -0.7], [0.3, -0.7], [-0.3, 0.7], [0.3, 0.7]]) ab.boxC(x, 0, z, 0.25, 0.8, 0.25, 0xf4f4f0, { solid: false })
    ab.boxC(0, 1.1, 1.2, 0.8, 0.7, 0.6, 0xf4f4f0, { solid: false })
    ab.boxC(0, 1.2, -1.4, 0.15, 0.15, 0.9, 0xf4f4f0, { solid: false })
  } else if (kind === 'panda') {
    ab.boxC(0, 0.6, 0, 1.2, 1.1, 1.6, 0xf4f4f4, { solid: false })
    ab.boxC(0, 0.6, 0, 1.25, 0.5, 0.6, 0x1a1a1a, { solid: false })
    for (const [x, z] of [[-0.4, -0.5], [0.4, -0.5], [-0.4, 0.5], [0.4, 0.5]]) ab.boxC(x, 0, z, 0.4, 0.6, 0.4, 0x1a1a1a, { solid: false })
    ab.boxC(0, 1.3, 0.9, 0.9, 0.8, 0.7, 0xf4f4f4, { solid: false })
    ab.boxC(-0.35, 2.1, 0.9, 0.25, 0.25, 0.2, 0x1a1a1a, { solid: false })
    ab.boxC(0.35, 2.1, 0.9, 0.25, 0.25, 0.2, 0x1a1a1a, { solid: false })
    ab.boxC(-0.2, 1.65, 1.26, 0.2, 0.2, 0.05, 0x1a1a1a, { solid: false })
    ab.boxC(0.2, 1.65, 1.26, 0.2, 0.2, 0.05, 0x1a1a1a, { solid: false })
  } else {
    ab.boxC(0, 1.6, 0, 0.6, 0.6, 0.9, 0xf08a9a, { solid: false })
    ab.boxC(0, 0, 0, 0.1, 1.6, 0.1, 0xf08a9a, { solid: false })
    ab.boxC(0, 2.2, 0.3, 0.12, 1, 0.12, 0xf08a9a, { solid: false })
    ab.boxC(0, 3.1, 0.45, 0.25, 0.25, 0.4, 0xf08a9a, { solid: false })
  }
  return ab.build(false)
}

export function buildSafari(b, ctx) {
  b.box(-70, 0, -50, 70, 0.3, 50, 0x8aaa5a, { mat: 'grass', solid: false })
  const r = mulberry32(31)
  // 围栏分区
  railing(b, -70, -50, 70, -50, 0.3, 1.4, 0x6a4a2a, 3)
  railing(b, -70, 50, -10, 50, 0.3, 1.4, 0x6a4a2a, 3)
  railing(b, 10, 50, 70, 50, 0.3, 1.4, 0x6a4a2a, 3)
  railing(b, -70, -50, -70, 50, 0.3, 1.4, 0x6a4a2a, 3)
  railing(b, 70, -50, 70, 50, 0.3, 1.4, 0x6a4a2a, 3)
  for (let i = 0; i < 26; i++) {
    const x = -64 + r() * 128, z = -44 + r() * 88
    if (r() < 0.5) banyan(b, x, 0.3, z, 0.8, i)
    else palm(b, x, 0.3, z, 0.9)
  }
  b.box(-20, 0, 20, 0, 0.32, 36, C.water, { mat: 'pond', solid: false })
  for (let i = 0; i < 8; i++) bamboo(b, 40 + (i % 4) * 3, 0.3, -40 + Math.floor(i / 4) * 3)
  // 大门
  for (const x of [-10, 10]) b.boxC(x, 0, 50, 2, 9, 2, 0x6a4a2a, 'wood')
  b.box(-11, 9, 49, 11, 11, 51, 0x6a4a2a, 'wood')
  b.sign('长隆野生动物世界', 0, 10, 51.1, 1.4, 0, { bg: '#2a4a1a', fg: '#f2c230' })
  // 动物
  const animals = []
  const zone = { giraffe: [-40, -20, 12], elephant: [20, -10, 14], tiger: [-40, 25, 10], panda: [45, -35, 8], flamingo: [-10, 28, 8] }
  const counts = { giraffe: 4, elephant: 3, tiger: 3, panda: 2, flamingo: 8 }
  for (const k in zone) {
    for (let i = 0; i < counts[k]; i++) {
      const m = animal(k)
      const [cx, cz, rad] = zone[k]
      m.userData = { cx, cz, rad, a: r() * 6.28, sp: 0.05 + r() * 0.1 }
      m.position.set(cx, 0.3, cz)
      ctx.add(m)
      animals.push(m)
    }
  }
  ctx.onUpdate((dt, t) => {
    for (const m of animals) {
      const u = m.userData
      u.a += dt * u.sp
      const x = u.cx + Math.cos(u.a) * u.rad * 0.7, z = u.cz + Math.sin(u.a * 1.3) * u.rad * 0.6
      m.rotation.y = Math.atan2(x - m.position.x, z - m.position.z)
      m.position.x = x
      m.position.z = z
    }
  })
  ctx.interact({ x: 0, z: 54, r: 6, label: '长隆野生动物世界', type: 'info', text: '长隆野生动物世界拥有500余种、2万余只珍稀动物，包括大熊猫、白虎、考拉，是全国唯一的国家级重点动物园。' })
  ctx.crowd(0, 54, 20, 6)
}

// ---------------- 大夫山森林公园 ----------------
export function buildDafushan(b, ctx) {
  paving(b, -14, -6, 14, 8, 0, 0xb8b2a6)
  paifang(b, 0, 4, 14, 7, '大夫山森林公园', 0x8a6a4a, 0x3a6a3a, { px: 48 })
  for (let i = 0; i < 6; i++) {
    const x = -10 + i * 4
    b.box(x - 0.8, 0, -4, x + 0.8, 0.9, -3.4, 0x2a6ab0, { solid: false })
    b.boxC(x - 0.6, 0, -3.7, 0.5, 0.5, 0.05, 0x222222, { solid: false })
    b.boxC(x + 0.6, 0, -3.7, 0.5, 0.5, 0.05, 0x222222, { solid: false })
  }
  b.sign('单车租赁', 0, 2, -3.2, 0.5, 0, { bg: '#2a6ab0', fg: '#fff' })
  ctx.interact({ x: 0, z: 7, r: 6, label: '大夫山森林公园', type: 'info', text: '大夫山森林公园位于番禺区，森林覆盖率高，环山自行车道深受市民喜爱，被誉为番禺的“绿肺”。' })
  ctx.crowd(0, 8, 12, 6)
}

// ---------------- 南沙湿地公园 ----------------
export function buildWetland(b, ctx) {
  const r = mulberry32(64)
  b.box(-90, 0, -70, 90, 0.06, 70, 0x3a7ab0, { mat: 'pond', solid: false })
  for (let i = 0; i < 60; i++) {
    const x = -85 + r() * 170, z = -65 + r() * 130
    const w = 3 + r() * 10, d = 3 + r() * 10
    b.box(x - w / 2, 0, z - d / 2, x + w / 2, 0.3, z + d / 2, 0x6a9a4a, { mat: 'grass', solid: false })
    for (let k = 0; k < 4; k++) b.boxC(x + (r() - 0.5) * w, 0.3, z + (r() - 0.5) * d, 0.3, 1 + r() * 1.2, 0.3, r() < 0.5 ? 0x8aaa4a : 0xc8b86a, { mat: 'leaf', solid: false })
  }
  // 木栈道
  for (const [x0, z0, x1, z1] of [[-80, 0, 80, 0], [0, -60, 0, 60], [-50, -40, -50, 40], [50, -40, 50, 40]]) {
    b.box(Math.min(x0, x1) - 1.5, 0.3, Math.min(z0, z1) - 1.5, Math.max(x0, x1) + 1.5, 0.6, Math.max(z0, z1) + 1.5, 0x8a6a4a, { mat: 'wood', solid: false })
    for (let t = 0; t <= 1; t += 0.05) b.boxC(x0 + (x1 - x0) * t, -0.4, z0 + (z1 - z0) * t, 0.3, 0.9, 0.3, 0x6a4a2a, { solid: false })
  }
  ctx.platform({ x0: -82, z0: -1.5, x1: 82, z1: 1.5, y: 0.6 })
  ctx.platform({ x0: -1.5, z0: -62, x1: 1.5, z1: 62, y: 0.6 })
  ctx.platform({ x0: -51.5, z0: -42, x1: -48.5, z1: 42, y: 0.6 })
  ctx.platform({ x0: 48.5, z0: -42, x1: 51.5, z1: 42, y: 0.6 })
  // 观鸟塔
  for (const [x, z] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) b.boxC(20 + x, 0, 20 + z, 0.6, 14, 0.6, 0x6a4a2a, 'wood')
  b.box(15, 14, 15, 25, 14.5, 25, 0x8a6a4a, 'wood')
  b.hipRoof(20, 20, 10, 10, 16, 2.5, 0x6a4a2a, { over: 0.5, minW: 0.4, minD: 0.4 })
  b.sign('南沙湿地公园', 0, 2, 2, 1, 0, { bg: '#2a5a3a', fg: '#ffffff' })
  // 白鹭群（飞行）
  const birds = new THREE.Group()
  const bb = new Builder()
  bb.boxC(0, 0, 0, 0.3, 0.3, 0.8, 0xffffff, { solid: false })
  bb.box(-1, 0.1, -0.1, 1, 0.15, 0.2, 0xffffff, { solid: false })
  for (let i = 0; i < 14; i++) {
    const m = bb.build(false)
    bb.boxC(0, 0, 0, 0.3, 0.3, 0.8, 0xffffff, { solid: false })
    bb.box(-1, 0.1, -0.1, 1, 0.15, 0.2, 0xffffff, { solid: false })
    m.userData.p = i * 0.45
    birds.add(m)
  }
  ctx.add(birds)
  ctx.onUpdate((dt, t) => {
    birds.children.forEach((m) => {
      const a = t * 0.15 + m.userData.p
      m.position.set(Math.cos(a) * (40 + m.userData.p * 4), 12 + Math.sin(a * 3) * 3, Math.sin(a) * (30 + m.userData.p * 3))
      m.rotation.y = a + Math.PI
      m.scale.x = 0.6 + Math.abs(Math.sin(t * 6 + m.userData.p)) * 0.6
    })
  })
  ctx.interact({ x: 0, z: 4, r: 8, label: '湿地观鸟', type: 'view' })
  ctx.crowd(0, 0, 70, 2, 10)
}

// ---------------- 南沙滨海公园 ----------------
export function buildSeaside(b, ctx) {
  ctx.landOverride(-82, -12, 82, 31)
  b.box(-80, -3, 0, 80, 0.2, 30, C.sand)
  paving(b, -80, -10, 80, 0, 0, 0xc8c2b4)
  for (let x = -76; x <= 76; x += 8) {
    palm(b, x, 0, -6, 1)
    lamp(b, x + 4, 0, -1)
  }
  for (let i = 0; i < 6; i++) {
    const x = -50 + i * 20
    b.boxC(x, 0.2, 14, 0.15, 2.4, 0.15, 0xeeeeee, { solid: false })
    b.prism(x, 14, 2.4, 3.2, 1.8, 1.8, 8, [0xe03a2a, 0x2a7ae0, 0xf2c230][i % 3], { rx1: 0.1, rz1: 0.1, solid: false })
  }
  // 灯塔
  b.prism(70, 22, 0, 14, 2.2, 2.2, 8, 0xf4f4f4, { rx1: 1.6, rz1: 1.6 })
  for (let y = 2; y < 14; y += 4) b.prism(70, 22, y, y + 2, 2.1, 2.1, 8, 0xd83030, { rx1: 1.9, rz1: 1.9 })
  b.prism(70, 22, 14, 16, 1.4, 1.4, 8, 0xfff2a0, { mat: 'lamp', solid: false })
  b.prism(70, 22, 16, 17.5, 1.8, 1.8, 8, 0x2a2a2a, { rx1: 0.3, rz1: 0.3 })
  b.sign('南沙滨海公园', 0, 2.5, -10.05, 1, Math.PI, { bg: '#1a4a6a', fg: '#ffffff' })
  ctx.interact({ x: 0, z: 6, r: 8, label: '看伶仃洋海景', type: 'view' })
  ctx.crowd(0, 6, 60, 8, 16)
}

// ---------------- 南沙天后宫 ----------------
export function buildTinHau(b, ctx) {
  b.box(-26, -16, -34, 26, 0.3, 30, 0x9a948a)
  // 台阶
  for (let i = 0; i < 10; i++) b.box(-6, -10 + i, 30 + (9 - i) * 1.2, 6, -9 + i, 30 + (10 - i) * 1.2, 0xc8c2b4)
  paifang(b, 0, 28, 14, 8, '天后宫', C.granite, 0xd8a838)
  // 层层殿宇（红墙黄瓦）
  const halls = [[14, 18, 8, 6], [0, 22, 10, 7], [-16, 24, 10, 8]]
  for (const [z, w, d, h] of halls) {
    b.box(-w / 2 - 1, 0.3, z - d / 2 - 1, w / 2 + 1, 1.5, z + d / 2 + 1, 0xd8d4cc)
    const sub = Object.create(b)
    sub.oy = b.oy + 1.2
    chineseHall(sub, 0, z, w, d, h, { wall: 0xb8322a, col: 0xc83a2a, roof: 0xe0a828, eave: 0xd09020, ridge: 0xe0a828, wallMat: 'block', hip: true })
  }
  // 天后（妈祖）白色石像
  const sx = 0, sz = -28
  b.box(sx - 4, 0.3, sz - 4, sx + 4, 3, sz + 4, 0xd8d4cc)
  b.boxC(sx, 3, sz, 3, 6, 2.4, 0xf4f2ee)
  b.boxC(sx, 9, sz, 2.4, 4, 2, 0xf4f2ee)
  b.boxC(sx, 13, sz, 1.6, 1.6, 1.6, 0xf4f2ee)
  b.boxC(sx, 14.6, sz, 2.2, 0.8, 1.2, 0xf4f2ee)
  b.boxC(sx - 1.6, 9, sz + 0.4, 0.7, 3.4, 0.7, 0xf4f2ee)
  b.boxC(sx + 1.6, 9, sz + 0.4, 0.7, 3.4, 0.7, 0xf4f2ee)
  ctx.interact({ x: 0, z: 22, r: 6, label: '南沙天后宫', type: 'info', text: '南沙天后宫依大角山而建，是东南亚规模最大的妈祖庙，被誉为“天下天后第一宫”。' })
  for (let i = 0; i < 8; i++) {
    roundTree(b, -22, 0.3, -28 + i * 7, 0.8)
    roundTree(b, 22, 0.3, -28 + i * 7, 0.8)
  }
  ctx.crowd(0, 20, 12, 8)
}
