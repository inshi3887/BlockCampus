// 天河区：花城广场、西塔、东塔、大剧院、省博物馆、体育中心、正佳、太古汇、中信广场、广州东站
import * as THREE from 'three'
import { Builder } from '../builder.js'
import { C, banyan, kapok, roundTree, palm, lamp, bench, railing, paving, flowerBed, statue, modernTower } from './common.js'
import { mulberry32 } from '../util.js'

// ---------------- 花城广场（城市新中轴线） ----------------
export function buildHuacheng(b, ctx) {
  paving(b, -22, -50, 22, 85, 0, 0xc8c4bc)
  for (const s of [-1, 1]) {
    b.box(s * 3, 0, -46, s * 16, 0.3, 82, C.grass, { mat: 'grass', solid: false })
    for (let z = -44; z <= 80; z += 9) {
      roundTree(b, s * 18, 0, z, 0.8, 0x4a9a42)
      lamp(b, s * 20, 0, z + 4)
    }
  }
  // 中轴水景 + 喷泉
  b.box(-2, 0, -40, 2, 0.15, 70, 0x4a90c8, { mat: 'pond', solid: false })
  for (let z = -36; z < 70; z += 6) b.boxC(0, 0.15, z, 0.3, 1.5, 0.3, 0xdff4ff, { mat: 'glow', solid: false })
  // 地标灯柱（夜晚变色）
  for (let z = -40; z <= 70; z += 10) for (const s of [-1, 1]) b.boxC(s * 3.5, 0, z, 0.4, 2.2, 0.4, 0x7ad0ff, 'neon')
  // 广州图书馆（"之"字形叠层体量）
  const lx = 47, lz = 27
  for (let i = 0; i < 6; i++) {
    const off = (i % 2 ? 1 : -1) * 3
    b.box(lx - 12 + off, i * 6, lz - 10, lx + 12 + off, (i + 1) * 6, lz + 10, 0xe4e0d8, 'window')
    for (let x = -11; x <= 11; x += 2) b.box(lx + x + off - 0.2, i * 6, lz - 10.2, lx + x + off + 0.2, (i + 1) * 6, lz - 10, 0xf6f4ee, { solid: false })
  }
  b.sign('广州图书馆', lx, 3, lz - 10.3, 0.9, Math.PI, { bg: '#e4e0d8', fg: '#333' })
  b.sign('花城广场', 0, 2, -48, 1.4, Math.PI, { bg: '#ffffff', fg: '#c0392b' })
  ctx.interact({ x: 0, z: 0, r: 8, label: '在花城广场看城市中轴线', type: 'view' })
  ctx.crowd(0, 15, 16, 60, 28)
}

// ---------------- 广州国际金融中心（西塔，440m） ----------------
export function buildIFC(b, ctx) {
  b.box(-22, 0, -22, 22, 8, 22, 0xb8c0c8, 'curtain')
  b.box(-23, 8, -23, 23, 8.8, 23, 0xe0e0e0)
  const H = 176
  const sec = 14
  const radius = (t) => 13.5 * (1 + 0.1 * Math.sin(Math.PI * t)) * (1 - 0.22 * t)
  for (let i = 0; i < sec; i++) {
    const t0 = i / sec, t1 = (i + 1) / sec
    b.prism(0, 0, 8.8 + t0 * (H - 8.8), 8.8 + t1 * (H - 8.8), radius(t0), radius(t0), 6, 0x9ec4dc, { mat: 'curtain', rx1: radius(t1), rz1: radius(t1), rot: Math.PI / 6, open: i < sec - 1 })
  }
  // 斜交网格（白色）
  for (let i = 0; i < sec; i++) {
    const t0 = i / sec, t1 = (i + 1) / sec
    const y0 = 8.8 + t0 * (H - 8.8), y1 = 8.8 + t1 * (H - 8.8)
    const r0 = radius(t0) + 0.25, r1 = radius(t1) + 0.25
    for (let k = 0; k < 6; k++) {
      const a0 = Math.PI / 6 + (k / 6) * Math.PI * 2, a1 = Math.PI / 6 + ((k + 1) / 6) * Math.PI * 2
      const p0 = [Math.cos(a0) * r0, Math.sin(a0) * r0], p1 = [Math.cos(a1) * r0, Math.sin(a1) * r0]
      const q0 = [Math.cos(a0) * r1, Math.sin(a0) * r1], q1 = [Math.cos(a1) * r1, Math.sin(a1) * r1]
      const flip = (i + k) % 2
      if (flip) b.beam(p0[0], y0, p0[1], q1[0], y1, q1[1], 0.5, 0xf4f6f8)
      else b.beam(p1[0], y0, p1[1], q0[0], y1, q0[1], 0.5, 0xf4f6f8)
      b.beam(p0[0], y0, p0[1], q0[0], y1, q0[1], 0.35, 0xf4f6f8)
    }
  }
  b.prism(0, 0, H, H + 4, radius(1), radius(1), 6, 0xe8ecef, { rot: Math.PI / 6 })
  b.boxC(0, H + 4, 0, 2, 3, 2, 0xd0d0d0)
  b.boxC(0, H + 7, 0, 0.8, 0.8, 0.8, 0xff3030, 'lamp')
  b.sign('广州国际金融中心', 0, 6, 22.1, 1.0, 0, { bg: '#1a2a3a', fg: '#ffffff' })
}

export function ifcLOD(b) {
  const H = 176
  for (let i = 0; i < 6; i++) {
    const t0 = i / 6, t1 = (i + 1) / 6
    const r = (t) => 13.5 * (1 + 0.1 * Math.sin(Math.PI * t)) * (1 - 0.22 * t)
    b.prism(0, 0, t0 * H, t1 * H, r(t0), r(t0), 6, 0x9ec4dc, { mat: 'curtain', rx1: r(t1), rz1: r(t1), rot: Math.PI / 6, solid: false })
  }
}

// ---------------- 周大福金融中心（东塔，530m） ----------------
export function buildCTF(b, ctx) {
  b.box(-26, 0, -24, 26, 10, 24, 0xc8ccd0, 'curtain')
  const tiers = [[13, 0, 120], [11.5, 120, 160], [10, 160, 190], [8.5, 190, 210]]
  for (const [hw, y0, y1] of tiers) {
    b.box(-hw, Math.max(10, y0), -hw, hw, y1, hw, 0xaec4d4, 'curtain')
    // 白色陶土竖向肋
    for (let k = -hw; k <= hw; k += 2.2) {
      b.box(k - 0.25, Math.max(10, y0), hw, k + 0.25, y1, hw + 0.4, 0xf2efe8, { solid: false })
      b.box(k - 0.25, Math.max(10, y0), -hw - 0.4, k + 0.25, y1, -hw, 0xf2efe8, { solid: false })
      b.box(hw, Math.max(10, y0), k - 0.25, hw + 0.4, y1, k + 0.25, 0xf2efe8, { solid: false })
      b.box(-hw - 0.4, Math.max(10, y0), k - 0.25, -hw, y1, k + 0.25, 0xf2efe8, { solid: false })
    }
    b.box(-hw - 0.5, y1 - 0.8, -hw - 0.5, hw + 0.5, y1, hw + 0.5, 0xf2efe8, { solid: false })
  }
  // 塔冠
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.box(sx * 8.5 - 2, 210, sz * 8.5 - 2, sx * 8.5 + 2, 216, sz * 8.5 + 2, 0xf2efe8)
  b.boxC(0, 210, 0, 6, 3, 6, 0xd8d8d8)
  b.boxC(0, 216, 0, 0.8, 0.8, 0.8, 0xff3030, 'lamp')
  b.sign('周大福金融中心', 0, 7, 24.1, 1.0, 0, { bg: '#2a1a0a', fg: '#e8c050' })
}

export function ctfLOD(b) {
  for (const [hw, y0, y1] of [[13, 0, 120], [11.5, 120, 160], [10, 160, 190], [8.5, 190, 214]]) b.box(-hw, y0, -hw, hw, y1, hw, 0xaec4d4, { mat: 'curtain', solid: false })
}

// ---------------- 广州大剧院（"圆润双砾"） ----------------
export function buildOperaHouse(b, ctx) {
  paving(b, -36, -28, 36, 30, 0, 0xc8c4bc)
  b.box(-36, 0, -28, 36, 0.4, 30, 0xb8c0b0, { mat: 'grass', solid: false })
  // 大石头（歌剧厅）：深灰色不规则体块
  const big = [[18, 15, 0], [17, 14.5, 4], [16, 14, 8], [14.5, 12.5, 12], [12, 10.5, 16], [9, 8, 19], [5.5, 5, 21.5]]
  for (let i = 0; i < big.length - 1; i++) {
    const [rx, rz, y] = big[i], [rx1, rz1, y1] = big[i + 1]
    b.prism(-10, 0, y, y1, rx, rz, 7, 0x4a4c50, { rx1, rz1, rot: 0.4 + i * 0.08 })
  }
  // 小石头（多功能厅）：浅灰
  const small = [[11, 9, 0], [10.5, 8.5, 3], [9, 7.5, 6], [7, 5.5, 9], [4, 3, 11]]
  for (let i = 0; i < small.length - 1; i++) {
    const [rx, rz, y] = small[i], [rx1, rz1, y1] = small[i + 1]
    b.prism(19, 8, y, y1, rx, rz, 6, 0xc8ccd0, { rx1, rz1, rot: 1.1 + i * 0.1 })
  }
  // 三角形玻璃分格线
  for (let k = 0; k < 7; k++) {
    const a = 0.4 + (k / 7) * Math.PI * 2
    b.beam(-10 + Math.cos(a) * 18.1, 0.5, Math.sin(a) * 15.1, -10 + Math.cos(a + 0.5) * 12.2, 16, Math.sin(a + 0.5) * 10.7, 0.25, 0xd8dce0)
  }
  b.box(-20, 0.4, 12, 0, 6, 14.5, 0x9ec4dc, { mat: 'curtain' })
  b.sign('广州大剧院', -10, 7.5, 15, 1.1, 0, { bg: '#2a2a2e', fg: '#ffffff' })
  ctx.interact({ x: -10, z: 20, r: 6, label: '了解广州大剧院', type: 'info', text: '广州大剧院由扎哈·哈迪德设计，2010年落成，造型如珠江边被冲刷的两块“圆润双砾”。' })
}

// ---------------- 广东省博物馆（"宝盒"） ----------------
export function buildGDMuseum(b, ctx) {
  paving(b, -30, -30, 30, 30, 0, 0xc8c4bc)
  // 架空底层
  for (const x of [-18, 18]) for (const z of [-18, 18]) b.boxC(x, 0, z, 6, 8, 6, 0x6a6a6a)
  b.box(-6, 0, -6, 6, 8, 6, 0x9ec4dc, 'curtain')
  // 宝盒主体：黑色外框 + 镂空雕刻
  b.box(-26, 8, -26, 26, 30, 26, 0x2a2626)
  const r = mulberry32(316)
  for (const face of [0, 1, 2, 3]) {
    for (let i = 0; i < 26; i++) {
      const u = -24 + r() * 46, v = 9 + r() * 19
      const w = 1 + r() * 5, h = 0.6 + r() * 3
      const c = r() < 0.3 ? 0x8a3a2a : r() < 0.6 ? 0x9ec4dc : 0x4a4444
      const m = c === 0x9ec4dc ? 'window' : 'block'
      if (face === 0) b.box(u, v, 26, u + w, v + h, 26.2, c, { mat: m, solid: false })
      if (face === 1) b.box(u, v, -26.2, u + w, v + h, -26, c, { mat: m, solid: false })
      if (face === 2) b.box(26, v, u, 26.2, v + h, u + w, c, { mat: m, solid: false })
      if (face === 3) b.box(-26.2, v, u, -26, v + h, u + w, c, { mat: m, solid: false })
    }
  }
  b.box(-26.5, 30, -26.5, 26.5, 31, 26.5, 0x3a3434)
  b.sign('广东省博物馆', 0, 5, 26.3, 1.0, 0, { bg: '#2a2626', fg: '#e8c050' })
  ctx.interact({ x: 0, z: 30, r: 6, label: '参观广东省博物馆', type: 'info', text: '广东省博物馆新馆外形如一只精美的“宝盒”，寓意“盛载珍宝的容器”，藏有大量潮州木雕、端砚、广彩等文物。' })
}

// ---------------- 天河体育中心 ----------------
export function buildSportsCenter(b, ctx) {
  // 主体育场：椭圆看台（南北向）
  b.prism(0, 0, 0, 0.3, 26, 34, 24, 0x5a9a4a, { mat: 'grass', solid: false })
  b.prism(0, 0, 0.3, 0.35, 21, 29, 24, 0x4a9a3a, { mat: 'grass', solid: false })
  for (let i = 0; i < 6; i++) {
    const t = i / 6
    const rx0 = 27 + i * 2.2, rz0 = 35 + i * 2.2
    // 看台环（以多段拼成，留出入口）
    for (let k = 0; k < 24; k++) {
      if (k % 6 === 0) continue
      const a = (k / 24) * Math.PI * 2, a1 = ((k + 1) / 24) * Math.PI * 2
      const p = [Math.cos(a) * rx0, Math.sin(a) * rz0], q = [Math.cos(a1) * rx0, Math.sin(a1) * rz0]
      b.beam(p[0], 1 + i * 1.4, p[1], q[0], 1 + i * 1.4, q[1], 2.4, i % 2 ? 0xd84040 : 0xe8e8e8, { tz: 2.8 })
    }
  }
  // 外墙环与顶棚
  for (let k = 0; k < 32; k++) {
    const a = (k / 32) * Math.PI * 2, a1 = ((k + 1) / 32) * Math.PI * 2
    const R = [41, 49]
    const p = [Math.cos(a) * R[0], Math.sin(a) * R[1]], q = [Math.cos(a1) * R[0], Math.sin(a1) * R[1]]
    b.beam(p[0], 6, p[1], q[0], 6, q[1], 10, 0xd8dce0, { tz: 1 })
    b.boxC(p[0], 0, p[1], 0.8, 13, 0.8, 0xc8ccd0)
    const P2 = [Math.cos(a) * 34, Math.sin(a) * 42], Q2 = [Math.cos(a1) * 34, Math.sin(a1) * 42]
    b.beam(P2[0], 13, P2[1], Q2[0], 13, Q2[1], 0.6, 0xf0f0f0)
    b.beam(p[0], 13, p[1], P2[0], 13, P2[1], 0.5, 0xf0f0f0)
  }
  b.collider(-42, 0, -50, -36, 12, 50)
  b.collider(36, 0, -50, 42, 12, 50)
  b.sign('天河体育中心', 0, 8, 49.5, 1.4, 0, { bg: '#1a3a6a', fg: '#ffffff' })
  // 体育馆 / 游泳馆
  for (const [x, c] of [[-62, 0xd8d8d8], [62, 0xc8d8e8]]) {
    b.box(x - 14, 0, -12, x + 14, 10, 12, c, 'window')
    for (let i = 0; i < 6; i++) b.box(x - 14 + i * 1.5, 10 + i * 0.8, -12, x + 14 - i * 1.5, 10.8 + i * 0.8, 12, 0xe8ecf0)
  }
  for (let z = -56; z <= 56; z += 8) {
    palm(b, -48, 0, z, 0.8)
    palm(b, 48, 0, z, 0.8)
  }
  ctx.interact({ x: 0, z: 52, r: 6, label: '天河体育中心', type: 'info', text: '天河体育中心于1987年为第六届全运会建成，是天河区乃至广州新城市中心发展的起点。' })
  ctx.crowd(0, 56, 30, 10)
}

// ---------------- 正佳广场 ----------------
export function buildGrandview(b, ctx) {
  b.box(-36, 0, -22, 36, 30, 22, 0xd8d0c8, 'window')
  b.box(-12, 0, 21, 12, 30, 23, 0x9ec4dc, 'curtain')
  // 巨型 LED 屏
  b.box(14, 10, 22, 34, 24, 22.4, 0x3a8ae0, 'neon')
  b.box(-34, 10, 22, -14, 24, 22.4, 0xe04aa0, 'neon')
  b.sign('正佳广场', 0, 26, 23.1, 2.6, 0, { bg: '#c0392b', fg: '#ffffff', glow: true })
  b.box(-37, 30, -23, 37, 31, 23, 0xe8e8e8)
  ctx.interact({ x: 0, z: 26, r: 5, label: '正佳广场购物', type: 'shop', shop: 'mall' })
  ctx.crowd(0, 28, 30, 5, 12)
}

// ---------------- 太古汇 ----------------
export function buildTaikoo(b, ctx) {
  b.box(-34, 0, -18, 34, 16, 18, 0xc8ccd0, 'curtain')
  b.box(-34, 16, -18, 34, 17, 18, 0xe0e0e0)
  modernTower(b, -18, -4, 16, 14, 82, 0x7ea4c0)
  modernTower(b, 18, -4, 14, 12, 64, 0x8ab0c8)
  for (let x = -30; x <= 30; x += 5) b.box(x, 0, 18, x + 0.4, 16, 18.6, 0xf2f2f2, { solid: false })
  b.sign('太古汇 TAIKOO HUI', 0, 13, 18.7, 1.4, 0, { bg: '#1a1a1a', fg: '#ffffff', glow: true })
  ctx.crowd(0, 22, 30, 4, 10)
}

// ---------------- 中信广场（391m） ----------------
export function buildCitic(b, ctx) {
  b.box(-30, 0, -28, 30, 12, 28, 0xa8b8c4, 'window')
  const H = 152
  b.box(-11, 12, -11, 11, H - 20, 11, 0x5a7a94, 'curtain')
  for (const [x, z] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) b.boxC(x, 12, z, 3, H - 32, 3, 0x9aa8b4)
  b.box(-9, H - 20, -9, 9, H - 6, 9, 0x5a7a94, 'curtain')
  b.box(-6.5, H - 6, -6.5, 6.5, H, 6.5, 0x8a9aa8)
  for (const s of [-1, 1]) {
    b.boxC(s * 3, H, 0, 0.8, 22, 0.8, 0xd0d0d0, { solid: false })
    b.boxC(s * 3, H + 22, 0, 0.6, 0.6, 0.6, 0xff3030, 'lamp')
  }
  b.sign('中信广场', 0, 9, 28.1, 1.2, 0, { bg: '#1a2a3a', fg: '#ffffff' })
}

export function citicLOD(b) {
  b.box(-11, 0, -11, 11, 132, 11, 0x5a7a94, { mat: 'curtain', solid: false })
  b.box(-9, 132, -9, 9, 152, 9, 0x5a7a94, { mat: 'curtain', solid: false })
  b.boxC(-3, 152, 0, 0.8, 22, 0.8, 0xd0d0d0, { solid: false })
  b.boxC(3, 152, 0, 0.8, 22, 0.8, 0xd0d0d0, { solid: false })
}

// ---------------- 广州东站 ----------------
export function buildEastStation(b, ctx) {
  // 站房（朝南），后方铁路股道
  paving(b, -60, -10, 60, 40, 0, 0xc8c4bc)
  b.box(-56, 0, -30, 56, 16, -6, 0xd8dce0, 'window')
  b.box(-22, 0, -8, 22, 28, -4, 0xe8eaec)
  b.box(-18, 4, -4.1, 18, 24, -3.9, 0x9ec4dc, { mat: 'curtain', solid: false })
  b.box(-24, 28, -9, 24, 30, -3, 0xf0f0f0)
  b.sign('广州东站', 0, 26, -2.8, 2.4, 0, { bg: '#1a3a6a', fg: '#ffffff', glow: true })
  // 站前广场：喷泉与“东站大钟”
  b.prism(0, 18, 0, 1, 10, 10, 16, 0xc8c8c8)
  b.prism(0, 18, 1, 1.05, 9, 9, 16, 0x4a90c8, { mat: 'pond', solid: false })
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    b.boxC(Math.cos(a) * 6, 1, 18 + Math.sin(a) * 6, 0.25, 2 + (i % 3) * 1.2, 0.25, 0xe0f4ff, { mat: 'glow', solid: false })
  }
  b.boxC(0, 1, 18, 1.4, 6, 1.4, 0xd8d8d8)
  for (let x = -54; x <= 54; x += 9) palm(b, x, 0, 36, 0.9)
  // 铁轨
  for (let k = 0; k < 6; k++) {
    const z = -40 - k * 5
    b.box(-140, 0, z - 1.6, 140, 0.15, z + 1.6, 0x6a6058, { solid: false })
    b.box(-140, 0.15, z - 0.8, 140, 0.3, z - 0.65, 0x9a9a9a, { solid: false })
    b.box(-140, 0.15, z + 0.65, 140, 0.3, z + 0.8, 0x9a9a9a, { solid: false })
  }
  for (let x = -40; x <= 40; x += 20) b.box(x - 8, 0, -66, x + 8, 6, -36, 0xd0d4d8, { mat: 'window', solid: false })
  // 和谐号列车（移动）
  const tb = new Builder()
  for (let i = 0; i < 8; i++) {
    const x = i * 13
    tb.box(x, 0.4, -1.5, x + 12.5, 4, 1.5, 0xf4f4f4, { solid: false })
    tb.box(x, 2, -1.55, x + 12.5, 2.9, 1.55, 0x3a5ac8, { mat: 'window', solid: false })
    tb.box(x, 0.8, -1.56, x + 12.5, 1.1, 1.56, 0xd83030, { solid: false })
  }
  tb.box(104, 0.4, -1.5, 110, 3, 1.5, 0xf4f4f4, { solid: false })
  tb.box(110, 0.4, -1.2, 113, 2, 1.2, 0xf4f4f4, { solid: false })
  const train = tb.build()
  train.position.set(-200, 0, -50)
  ctx.add(train)
  ctx.onUpdate((dt, t) => {
    const ph = (t * 18) % 600
    train.position.x = -300 + ph
    train.visible = ph < 560
  })
  ctx.interact({ x: 0, z: 6, r: 6, label: '广州东站', type: 'info', text: '广州东站是广州重要的铁路客运站之一，连通广深城际，与地铁1号线、3号线换乘。' })
  ctx.crowd(0, 14, 40, 14, 22)
}

// ---------------- 珠江新城 CBD 天际线 ----------------
export function buildCBD(b, ctx) {
  // 利通广场 / 富力盈凯 / 广州银行等风格化高楼
  b.box(-12, 0, -12, 12, 150, 12, 0x6a8aa8, 'curtain')
  b.box(-12.5, 150, -12.5, 12.5, 156, 12.5, 0xd0d8e0)
  b.box(-8, 156, -8, 8, 168, 8, 0x8aa8c0, 'curtain')
  ctx.interact({ x: 0, z: 16, r: 8, label: '仰望珠江新城天际线', type: 'view' })
  ctx.crowd(0, 16, 40, 40, 16)
}
