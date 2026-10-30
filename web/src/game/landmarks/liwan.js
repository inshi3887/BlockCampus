// 荔湾区：陈家祠（S级）、沙面（S级）、永庆坊、上下九、荔枝湾
import * as THREE from 'three'
import { Builder } from '../builder.js'
import { C, banyan, kapok, roundTree, palm, lamp, bench, railing, paving, flowerBed, statue, stoneLion, qilouRow, europeanBuilding, paifang, stall, chineseHall, bamboo } from './common.js'
import { mulberry32 } from '../util.js'
import { isWater } from '../geo.js'

const RIDGE_COLORS = [0xe8c050, 0x3a9a5a, 0x3a6ab0, 0xc0392b, 0xf0f0e8, 0x8a5a3a, 0x2a8a8a, 0xe07a30]

// 陶塑瓦脊：彩色人物、亭台楼阁
function ceramicRidge(b, x0, x1, z, y, h, seed) {
  const r = mulberry32(seed)
  b.box(x0, y, z - 0.35, x1, y + 0.6, z + 0.35, 0xe8c050, { solid: false })
  b.box(x0, y + 0.6, z - 0.3, x1, y + 0.8, z + 0.3, 0x2f7a55, { solid: false })
  for (let x = x0 + 0.6; x < x1 - 0.6; x += 0.45) {
    const hh = 0.4 + r() * h
    const c = RIDGE_COLORS[Math.floor(r() * RIDGE_COLORS.length)]
    b.box(x, y + 0.8, z - 0.2, x + 0.35, y + 0.8 + hh, z + 0.2, c, { solid: false })
    if (r() < 0.35) b.box(x - 0.05, y + 0.8 + hh, z - 0.25, x + 0.4, y + 1.0 + hh, z + 0.25, 0x2f7a55, { solid: false })
    if (r() < 0.25) b.box(x + 0.05, y + 1.0 + hh, z - 0.12, x + 0.3, y + 1.25 + hh, z + 0.12, 0xf0d8b0, { solid: false })
  }
  // 两端鳌鱼（龙头卷尾）
  for (const [xx, s] of [[x0, 1], [x1, -1]]) {
    b.box(xx - 0.4, y, z - 0.4, xx + 0.4, y + h + 1.6, z + 0.4, 0x2a6a4a, { solid: false })
    b.box(xx + s * 0.1, y + h + 1.2, z - 0.3, xx + s * 1.0, y + h + 1.9, z + 0.3, 0x2a6a4a, { solid: false })
    b.box(xx - 0.2, y + h + 1.6, z - 0.2, xx + 0.2, y + h + 2.3, z + 0.2, 0xe8c050, { solid: false })
  }
}

// 灰塑：檐下彩色浮雕带
function huisuBand(b, x0, x1, z, y, face, seed) {
  const r = mulberry32(seed)
  b.box(x0, y, z, x1, y + 0.9, z + face * 0.15, 0xf0ece0, { solid: false })
  for (let x = x0 + 0.3; x < x1 - 0.3; x += 0.6) {
    const c = RIDGE_COLORS[Math.floor(r() * RIDGE_COLORS.length)]
    b.box(x, y + 0.15, z + face * 0.15, x + 0.45, y + 0.75, z + face * 0.28, c, { solid: false })
  }
}

// 木雕挂落
function woodCarving(b, x0, x1, z, y, seed) {
  const r = mulberry32(seed)
  b.box(x0, y, z - 0.15, x1, y + 1.0, z + 0.15, 0x8a5a24, { mat: 'wood', solid: false })
  for (let x = x0 + 0.2; x < x1 - 0.2; x += 0.5) {
    const c = r() < 0.5 ? 0xc8922e : 0xa06a22
    b.box(x, y + 0.1, z + 0.15, x + 0.35, y + 0.85, z + 0.25, c, { mat: 'wood', solid: false })
  }
  b.box(x0, y - 0.25, z - 0.1, x1, y, z + 0.1, 0xd8a838, { mat: 'wood', solid: false })
}

// 陈家祠单体厅堂，ridge 沿 x
function clanHall(b, x0, x1, z0, z1, h, opt = {}) {
  const wall = C.greyBrick
  const base = 0.5
  b.box(x0, 0, z0, x1, base, z1, C.granite)
  // 山墙
  b.box(x0, base, z0, x0 + 0.6, base + h, z1, wall, 'brick')
  b.box(x1 - 0.6, base, z0, x1, base + h, z1, wall, 'brick')
  // 后墙（可选开门）
  if (opt.backDoor) {
    const g = opt.backDoor
    const cx = (x0 + x1) / 2
    b.box(x0, base, z0, cx - g / 2, base + h, z0 + 0.6, wall, 'brick')
    b.box(cx + g / 2, base, z0, x1, base + h, z0 + 0.6, wall, 'brick')
    b.box(cx - g / 2, base + 4, z0, cx + g / 2, base + h, z0 + 0.6, wall, { mat: 'brick', solid: false })
  } else b.box(x0, base, z0, x1, base + h, z0 + 0.6, wall, 'brick')
  if (opt.facade) {
    // 正立面：砖墙 + 中门
    const cx = (x0 + x1) / 2
    const g = opt.gate || 4
    b.box(x0, base, z1 - 0.7, cx - g / 2, base + h, z1, wall, 'brick')
    b.box(cx + g / 2, base, z1 - 0.7, x1, base + h, z1, wall, 'brick')
    b.box(cx - g / 2, base + 5, z1 - 0.7, cx + g / 2, base + h, z1, wall, { mat: 'brick', solid: false })
    b.box(x0, base, z1 - 0.75, x1, base + 1.2, z1 + 0.05, C.granite, { solid: false })
    // 门板（门神彩绘）
    for (const s of [-1, 1]) {
      const dx = cx + s * (g / 2 - 0.15)
      b.box(dx - 0.15, base, z1 - 0.7 - 2, dx + 0.15, base + 4.9, z1 - 0.7, 0x8a2a1a, { mat: 'wood', solid: false })
      b.box(dx - 0.2 * -s, base + 1.2, z1 - 2.4, dx - 0.2 * -s + 0.05 * s, base + 3.8, z1 - 1.1, 0xd8a838, { solid: false })
    }
    b.box(cx - g / 2, base + 5, z1 + 0.05, cx + g / 2, base + 5.2, z1 + 0.1, 0x2a2a2a, { solid: false })
    // 砖雕
    for (const s of [-1, 1]) {
      const px = cx + s * (g / 2 + 3.5)
      b.box(px - 2.6, base + 3.6, z1, px + 2.6, base + 5.6, z1 + 0.18, 0x9a7a5a, { solid: false })
      const r = mulberry32(Math.floor(px * 10))
      for (let x = px - 2.4; x < px + 2.4; x += 0.4)
        for (let y = base + 3.8; y < base + 5.4; y += 0.4) if (r() < 0.6) b.box(x, y, z1 + 0.18, x + 0.32, y + 0.32, z1 + 0.3, r() < 0.5 ? 0x7a5a3a : 0xb08a62, { solid: false })
    }
    huisuBand(b, x0 + 0.5, x1 - 0.5, z1, base + h - 1.2, 1, opt.seed || 1)
  } else {
    // 敞厅：前檐柱
    const n = Math.max(2, Math.round((x1 - x0) / 3))
    for (let i = 0; i <= n; i++) b.boxC(x0 + 0.6 + (i * (x1 - x0 - 1.2)) / n, base, z1 - 0.5, 0.45, h, 0.45, 0x6a2a1a, 'wood')
    woodCarving(b, x0 + 0.6, x1 - 0.6, z1 - 0.5, base + h - 1.4, opt.seed || 2)
    b.box(x0 + 0.6, base, z0 + 0.6, x1 - 0.6, base + 0.08, z1 - 0.6, 0xb8a482, { mat: 'stone', solid: false })
  }
  // 屋顶（绿琉璃剪边 + 灰筒瓦）
  const ry = base + h
  b.box(x0 - 0.4, ry, z0 - 0.6, x1 + 0.4, ry + 0.35, z1 + 0.6, C.glazedGreen, { solid: false })
  const top = b.gableRoof(x0 - 0.2, x1 + 0.2, z0, z1, ry + 0.35, (z1 - z0) * 0.3, C.roofGrey, { over: 0.4, step: 0.45 })
  // 山墙博古顶
  for (const xx of [x0 + 0.3, x1 - 0.3]) {
    b.box(xx - 0.35, ry, (z0 + z1) / 2 - 1, xx + 0.35, top + 0.4, (z0 + z1) / 2 + 1, wall, { mat: 'brick', solid: false })
    b.box(xx - 0.4, top + 0.4, (z0 + z1) / 2 - 1.3, xx + 0.4, top + 0.8, (z0 + z1) / 2 + 1.3, 0x2a2a2a, { solid: false })
  }
  if (opt.ridge) ceramicRidge(b, x0 + 0.5, x1 - 0.5, (z0 + z1) / 2, top, opt.ridge, opt.seed || 3)
  else b.box(x0, top, (z0 + z1) / 2 - 0.3, x1, top + 0.6, (z0 + z1) / 2 + 0.3, 0x5a6066, { solid: false })
  return top
}

export function buildChenClanHall(b, ctx) {
  // 前广场
  paving(b, -30, 17, 30, 40, 0, 0xc4bca8)
  for (const s of [-1, 1]) {
    b.box(s * 12, 0, 22, s * 26, 0.3, 34, C.grass, { mat: 'grass', solid: false })
    banyan(b, s * 21, 0.3, 28, 1, s > 0 ? 11 : 12)
    kapok(b, s * 14, 0.3, 32, 0.9)
  }
  paifang(b, 0, 38, 14, 8, '陈氏书院', C.granite, C.glazedGreen)
  // 周边园林（后花园）
  paving(b, -30, -30, 30, -17, 0, 0xb8b0a0)
  for (let i = 0; i < 6; i++) bamboo(b, -26 + i * 10, 0, -26)
  b.box(-8, 0, -28, 8, 0.1, -20, C.water, { mat: 'pond', solid: false })
  for (let i = -2; i <= 2; i++) b.boxC(i * 3, 0, -24, 0.6, 1.2, 0.6, 0x8a8478)
  // 中路：头门 / 聚贤堂 / 后堂
  clanHall(b, -6, 6, 10, 17, 6.8, { facade: true, gate: 4, ridge: 1.4, seed: 11 })
  // 正门前石柱门廊、抱鼓石、石狮
  for (const x of [-5, -2.4, 2.4, 5]) b.boxC(x, 0.5, 18.2, 0.6, 6, 0.6, C.granite)
  b.box(-5.5, 6.5, 17.8, 5.5, 7.1, 18.6, C.granite, { solid: false })
  for (const s of [-1, 1]) {
    b.boxC(s * 2.6, 0.5, 17.6, 0.8, 1.6, 0.8, 0xa8a49a)
    b.prism(s * 2.6, 17.6, 1.4, 2.2, 0.5, 0.5, 8, 0xb0aca2, { solid: false })
    stoneLion(b, s * 4, 0, 21, 1)
  }
  b.sign('陈氏书院', 0, 6.1, 17.12, 1.0, 0, { bg: '#1a1a1a', fg: '#e8c050', border: '#8a6a2a' })
  // 中门两侧侧门
  for (const s of [-1, 1]) clanHall(b, s > 0 ? 7.5 : -14.5, s > 0 ? 14.5 : -7.5, 10, 17, 5.6, { facade: true, gate: 2.6, seed: 20 + s })
  // 青云巷入口
  for (const s of [-1, 1]) {
    b.box(s * 6, 0, 16.6, s * 7.5, 0.5, 17, C.granite, { solid: false })
    b.box(s * 6, 5.2, 16.6, s * 7.5, 6.4, 17, C.greyBrick, { mat: 'brick', solid: false })
    b.sign('青云巷', s * 6.75, 5.8, 17.05, 0.35, 0, { bg: '#3a3a3a', fg: '#ffffff', px: 32 })
  }
  // 东西厢房（沿 z）
  for (const s of [-1, 1]) {
    const xa = s > 0 ? 14.5 : -18, xb = s > 0 ? 18 : -14.5
    b.box(xa, 0, -17, xb, 0.5, 17, C.granite)
    b.box(xa, 0.5, -17, xb, 5.3, 17, C.greyBrick, 'brick')
    b.box(xa - 0.3, 5.3, -17.3, xb + 0.3, 5.6, 17.3, C.glazedGreen, { solid: false })
    for (let i = 0; i < 4; i++) b.box(xa + 0.2 + i * 0.4, 5.6 + i * 0.4, -17.2, xb - 0.2 - i * 0.4, 6.0 + i * 0.4, 17.2, C.roofGrey, { mat: 'roof', solid: false })
    b.box(s > 0 ? xa - 0.05 : xb, 1.5, 3, s > 0 ? xa : xb + 0.05, 4, 9, 0x8ab0c8, { mat: 'window', solid: false })
  }
  // 第一进院落 + 月台
  paving(b, -14.5, 3.5, 14.5, 10, 0.5, 0xc8c0aa, 0.05)
  b.box(-5, 0.5, 3.5, 5, 1.4, 7, 0xd8d4cc)
  for (let x = -5; x <= 5; x += 1) if (Math.abs(x) > 1) b.boxC(x, 1.4, 6.9, 0.25, 0.9, 0.25, 0xf0ece4, { solid: false })
  b.box(-5, 2.1, 6.75, -1, 2.3, 7.05, 0xf0ece4, { solid: false })
  b.box(1, 2.1, 6.75, 5, 2.3, 7.05, 0xf0ece4, { solid: false })
  for (let i = 0; i < 3; i++) b.box(-1, 0.5 + i * 0.3, 7 + i * 0.4, 1, 0.8 + i * 0.3, 7.4 + i * 0.4, 0xd8d4cc)
  for (const s of [-1, 1]) {
    // 院落两侧连廊
    b.box(s * 5.6 - 0.5, 0.5, 3.5, s * 5.6 + 0.5, 4.5, 3.6, C.greyBrick, { solid: false })
    for (const z of [4, 6.5, 9]) b.boxC(s * 5.6, 0.5, z, 0.35, 4.5, 0.35, 0x6a2a1a, 'wood')
    b.box(s * 5.6 - 0.8, 5, 3.5, s * 5.6 + 0.8, 5.4, 10, C.roofGrey, { mat: 'roof', solid: false })
    // 铁铸花架盆景
    b.boxC(s * 9, 0.5, 6.5, 1.2, 0.8, 1.2, 0x6a6a6a)
    roundTree(b, s * 9, 1.3, 6.5, 0.5, 0x4a8a3a)
  }
  // 聚贤堂（主殿，最高大）
  const t2 = clanHall(b, -6, 6, -4.5, 3.5, 8, { ridge: 2.0, seed: 33, backDoor: 3 })
  // 聚贤堂内屏门与匾
  woodCarving(b, -5, 5, -3.6, 5.5, 44)
  b.box(-5, 0.5, -3.9, 5, 5.5, -3.7, 0x9a6a2a, { mat: 'wood', solid: false })
  b.sign('聚贤堂', 0, 7.2, 3.2, 0.8, 0, { bg: '#1a1a1a', fg: '#e8c050' })
  for (const s of [-1, 1]) clanHall(b, s > 0 ? 7.5 : -14.5, s > 0 ? 14.5 : -7.5, -4.5, 3.5, 6.4, { seed: 40 + s, ridge: 0.8 })
  // 第二进院落
  paving(b, -14.5, -9.5, 14.5, -4.5, 0.5, 0xc8c0aa, 0.05)
  for (const s of [-1, 1]) {
    b.boxC(s * 3, 0.5, -7, 1, 0.6, 1, 0x8a8478)
    roundTree(b, s * 3, 1.1, -7, 0.45, 0x3d8a3a)
  }
  // 后堂（祖先神龛）
  clanHall(b, -6, 6, -17, -9.5, 7.4, { ridge: 1.2, seed: 55 })
  b.box(-4.5, 0.5, -16, 4.5, 4.5, -14.6, 0xa87a2a, { mat: 'wood' })
  for (let i = 0; i < 4; i++) b.box(-4 + i * 0.3, 4.5 + i * 0.4, -16, 4 - i * 0.3, 4.9 + i * 0.4, -14.6, i % 2 ? 0xd8a838 : 0x8a2a1a, { mat: 'wood', solid: false })
  for (let i = -3; i <= 3; i++) b.box(i * 1.2 - 0.3, 1.5, -14.6, i * 1.2 + 0.3, 3.2, -14.5, 0xd8a838, { solid: false })
  for (const s of [-1, 1]) clanHall(b, s > 0 ? 7.5 : -14.5, s > 0 ? 14.5 : -7.5, -17, -9.5, 6.2, { seed: 60 + s })
  // 灯笼
  for (const x of [-4, 4]) b.boxC(x, 4.8, 18.6, 0.8, 1.1, 0.8, 0xd83020, 'neon')

  // 交互
  ctx.interact({ x: 0, z: 5, r: 5, label: '欣赏聚贤堂陶塑瓦脊与灰塑', type: 'culture', id: 'huisu' })
  ctx.interact({ x: 0, z: -2, r: 4, label: '欣赏木雕屏门', type: 'info', text: '陈家祠的木雕、石雕、砖雕、陶塑、灰塑、铜铁铸和彩绘被誉为“三雕二塑一铸一绘”，是岭南建筑装饰艺术的集大成者。' })
  ctx.interact({ x: 9, z: 13, r: 3, label: '广彩纪念品店', type: 'shop', shop: 'chenclan' })

  // 醒狮表演（广场）
  const lions = makeLions()
  lions.position.set(0, 0.12, 28)
  ctx.add(lions)
  ctx.onUpdate((dt, t) => {
    lions.children.forEach((l, i) => {
      const ph = t * 2 + i * Math.PI
      l.position.x = (i ? 3 : -3) + Math.sin(t * 0.6 + i) * 2.5
      l.position.y = Math.max(0, Math.sin(ph) * 1.2)
      l.rotation.y = Math.sin(t * 0.8 + i * 2) * 0.8
      l.children[1].rotation.x = Math.sin(t * 6 + i) * 0.25
    })
  })
  ctx.interact({ x: 0, z: 28, r: 7, label: '观看醒狮表演', type: 'culture', id: 'lion' })
  ctx.crowd(0, 28, 10, 8)
}

export function makeLions() {
  const g = new THREE.Group()
  const cols = [[0xe03a2a, 0xf2c230], [0xf2c230, 0x2a9a5a]]
  for (let i = 0; i < 2; i++) {
    const L = new THREE.Group()
    const bb = new Builder()
    const [c1, c2] = cols[i]
    bb.boxC(0, 0.6, -0.8, 1.6, 1.2, 2.6, c1, { solid: false })
    bb.boxC(0, 1.8, -1.2, 1.4, 0.2, 1.8, c2, { solid: false })
    for (const dx of [-0.5, 0.5]) for (const dz of [-1.8, 0.2]) bb.boxC(dx, 0, dz, 0.35, 0.7, 0.35, 0xf0f0f0, { solid: false })
    const body = bb.build(false)
    const hb = new Builder()
    hb.boxC(0, 0, 0, 1.8, 1.6, 1.4, c1, { solid: false })
    hb.boxC(0, 1.6, -0.1, 1.2, 0.5, 0.8, c2, { solid: false })
    hb.boxC(-0.45, 0.8, 0.7, 0.4, 0.4, 0.1, 0xffffff, { solid: false })
    hb.boxC(0.45, 0.8, 0.7, 0.4, 0.4, 0.1, 0xffffff, { solid: false })
    hb.boxC(-0.45, 0.85, 0.75, 0.2, 0.2, 0.05, 0x111111, { solid: false })
    hb.boxC(0.45, 0.85, 0.75, 0.2, 0.2, 0.05, 0x111111, { solid: false })
    hb.boxC(0, 0.1, 0.7, 1.4, 0.5, 0.2, 0xffffff, { solid: false })
    hb.boxC(0, 2.0, 0.2, 0.3, 0.6, 0.3, 0xf2f2f2, { solid: false })
    const head = hb.build(false)
    head.position.set(0, 1.2, 0.6)
    L.add(body, head)
    g.add(L)
  }
  return g
}

// ---------------- 沙面 ----------------
export function buildShamian(b, ctx) {
  // 自动贴合江岸：向南/北探测水体
  let zs = 30, zn = -30
  for (let z = 0; z < 80; z += 1) if (isWater(b.wx(0, z), b.wz(0, z))) { zs = z; break }
  for (let z = 0; z > -80; z -= 1) if (isWater(b.wx(0, z), b.wz(0, z))) { zn = z; break }
  zs = Math.max(zs, 28) + 3
  zn = Math.min(zn, -30) + 0.5
  const X0 = -92, X1 = 92
  ctx.landOverride(X0 - 4, zn, X1 + 4, zs)
  // 岛体与花岗岩堤岸
  b.box(X0 - 4, -1.5, zn, X1 + 4, 0.3, zs, 0xa8a090)
  b.box(X0 - 4, 0.3, zs - 0.6, X1 + 4, 1.4, zs, 0x8a8478)
  b.box(X0 - 4, 0.3, zn, X1 + 4, 1.0, zn + 0.5, 0x8a8478)
  b.box(X0 - 4.5, 0.3, zn, X0 - 4, 1.4, zs, 0x8a8478)
  b.box(X1 + 4, 0.3, zn, X1 + 4.5, 1.4, zs, 0x8a8478)
  // 沙面大街中央绿化带
  b.box(X0 + 4, 0.3, -7, X1 - 4, 0.55, 7, C.grass, { mat: 'grass', solid: false })
  for (let x = X0 + 8; x < X1 - 4; x += 14) {
    banyan(b, x, 0.55, -3, 1.1, x)
    flowerBed(b, x + 4, -5, x + 9, -1, 0.55, x * 7)
    bench(b, x + 6, 0.55, 3)
    lamp(b, x + 2, 0.55, 5.5, 4, 'old')
  }
  // 铜像
  statue(b, -40, 0.55, 2, 0x7a5a32, 1, 1) // 撑伞女士
  statue(b, -10, 0.55, -2, 0x7a5a32, 1, 0) // 摄影师
  statue(b, 30, 0.55, 2, 0x7a5a32, 0.9, 1)
  statue(b, 62, 0.55, -1, 0x7a5a32, 1.1, 0)
  b.sign('沙面', -86, 3, 7.1, 1.4, 0, { bg: '#2a4a3a', fg: '#ffffff', border: '#d9c890' })
  const r = mulberry32(2024)
  const colors = [0xe8d29a, 0xf2ece0, 0xc8603e, 0xd9b0a0, 0xb8c8a0, 0xe0c080, 0xf0e0c8, 0xa8b8c8]
  const lanes = [-60, -20, 20, 60]
  const blocks = [[X0 + 2, -63], [-57, -23], [-17, 17], [23, 57], [63, X1 - 2]]
  const doors = []
  // 北排（朝南）
  blocks.forEach(([x0, x1], bi) => {
    if (bi === 3) {
      // 露德圣母堂（天主教堂，白色哥特式）
      const cx = (x0 + x1) / 2
      b.box(cx - 6, 0.3, -24, cx + 6, 8, -12, 0xf4f2ec)
      b.gableRoof(cx - 6, cx + 6, -24, -12, 8, 0, 0x6a6a72, {})
      for (let i = 0; i < 6; i++) b.box(cx - 6 + i, 8 + i * 0.9, -24, cx + 6 - i, 8.9 + i * 0.9, -12, 0x7a6a62, { mat: 'roof', solid: i === 0 })
      b.box(cx - 2.5, 0.3, -12.5, cx + 2.5, 14, -9.5, 0xf4f2ec)
      for (let i = 0; i < 5; i++) b.boxC(cx, 14 + i * 1.6, -11, 4.4 - i * 0.9, 1.6, 2.4 - i * 0.4, 0xf4f2ec)
      b.boxC(cx, 22, -11, 0.25, 2.2, 0.25, C.gold, { solid: false })
      b.box(cx - 0.8, 22.9, -11.1, cx + 0.8, 23.2, -10.9, C.gold, { solid: false })
      b.box(cx - 1.2, 0.3, -9.55, cx + 1.2, 4.5, -9.45, 0x5a3a2a, { mat: 'wood', solid: false })
      b.prism(cx, -9.45, 7, 7.1, 1.2, 1.2, 12, 0x6a8ac8, { mat: 'glow', solid: false, rot: 0 })
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) b.box(cx + s * 6 - 0.3, 0.3, -22 + k * 4, cx + s * 6 + 0.3, 7, -21 + k * 4, 0xe8e4dc)
      b.sign('露德圣母堂', cx, 5.5, -9.4, 0.6, 0, { bg: '#f4f2ec', fg: '#333333' })
      europeanBuilding(b, x1 - 6, -21, 10, 16, 2, colors[2], 1, 1, 77)
      ctx.interact({ x: cx, z: -7, r: 5, label: '参观露德圣母堂', type: 'info', text: '露德圣母堂建于1892年，是沙面法租界内的天主教堂，小巧的哥特式尖塔是沙面最具代表性的景观之一。' })
      return
    }
    let x = x0
    while (x < x1 - 8) {
      const w = Math.min(x1 - x, 12 + Math.floor(r() * 8))
      const d = 14 + Math.floor(r() * 4)
      const style = bi === 4 && x === x0 ? 2 : r() < 0.4 ? 1 : 0
      const res = europeanBuilding(b, x + w / 2, -12 - d / 2, w - 1, d, 2 + Math.floor(r() * 2), colors[Math.floor(r() * colors.length)], 1, style, Math.floor(r() * 1e6))
      doors.push(res.door)
      x += w
    }
  })
  // 南排（朝北）
  blocks.forEach(([x0, x1], bi) => {
    if (bi === 0) {
      // 白天鹅宾馆（1983，现代主义白色板楼，临江）
      const zA = 12, zB = Math.min(zs - 6, 30)
      b.box(x0 + 2, 0.3, zA, x1 + 2, 6, zB, 0xf2f2ee, 'window')
      b.box(x0 + 6, 6, zA + 3, x1 - 2, 52, zA + 11, 0xf6f6f2, 'window')
      for (let y = 8; y < 52; y += 1.6) b.box(x0 + 5.9, y, zA + 2.9, x1 - 1.9, y + 0.3, zA + 11.1, 0xffffff, { solid: false })
      b.box(x0 + 6, 52, zA + 3, x1 - 2, 54, zA + 11, 0xe0e0dc)
      b.sign('白天鹅宾馆', (x0 + x1) / 2 + 2, 49, zA + 2.85, 2, Math.PI, { bg: '#f6f6f2', fg: '#c03030' })
      b.sign('WHITE SWAN HOTEL', (x0 + x1) / 2 + 2, 4.5, zA - 0.05, 0.9, Math.PI, { bg: '#f2f2ee', fg: '#2a4a6a' })
      ctx.interact({ x: (x0 + x1) / 2, z: zA - 2, r: 5, label: '白天鹅宾馆', type: 'info', text: '白天鹅宾馆1983年开业，是中国第一家中外合作的五星级酒店，大堂“故乡水”园林景观闻名遐迩。' })
      return
    }
    if (bi === 2) {
      // 沙面咖啡馆 + 户外座位
      europeanBuilding(b, -6, 19, 16, 14, 2, 0xf0e0c8, -1, 1, 99)
      b.sign('沙面咖啡馆 CAFÉ', -6, 7.7, 11.9, 0.8, Math.PI, { bg: '#3a2a1a', fg: '#f0d8a8' })
      for (let i = 0; i < 4; i++) {
        const tx = -12 + i * 4
        b.boxC(tx, 0.3, 9.5, 0.2, 1, 0.2, 0x444444, { solid: false })
        b.boxC(tx, 1.3, 9.5, 1.2, 0.1, 1.2, 0xf0f0f0, { solid: false })
        b.boxC(tx, 1.4, 9.5, 0.1, 1.6, 0.1, 0x666666, { solid: false })
        b.prism(tx, 9.5, 3, 3.6, 1.8, 1.8, 8, i % 2 ? 0x2a6a4a : 0xe8e0d0, { rx1: 0.1, rz1: 0.1, solid: false })
      }
      europeanBuilding(b, 10, 19, 12, 14, 3, 0xe8d29a, -1, 0, 101)
      ctx.interact({ x: -6, z: 10.5, r: 3, label: '沙面咖啡馆', type: 'shop', shop: 'cafe' })
      return
    }
    let x = x0
    while (x < x1 - 8) {
      const w = Math.min(x1 - x, 12 + Math.floor(r() * 8))
      const d = 12 + Math.floor(r() * 3)
      const style = bi === 4 && x + w >= x1 - 8 ? 2 : r() < 0.4 ? 1 : 0
      const res = europeanBuilding(b, x + w / 2, 12 + d / 2, w - 1, d, 2 + Math.floor(r() * 3), colors[Math.floor(r() * colors.length)], -1, style, Math.floor(r() * 1e6))
      doors.push(res.door)
      x += w
    }
  })
  // 十字街道两侧树
  for (const lx of lanes) {
    for (let z = -26; z <= -12; z += 7) roundTree(b, lx + 2.5, 0.3, z, 0.8)
  }
  // 南侧江边道路（沙面南街）
  const zp = Math.max(28, zs - 5)
  for (let x = X0; x < X1; x += 10) {
    banyan(b, x + 3, 0.3, zp - 2.5, 0.9, x + 300)
    lamp(b, x + 8, 0.3, zs - 1.5, 4, 'old')
    bench(b, x + 6, 0.3, zs - 2)
  }
  railing(b, X0 - 4, zs - 0.8, X1 + 4, zs - 0.8, 1.4, 1.0, 0x5a5a5a, 2)
  // 北侧连接桥（跨沙基涌）
  for (const bx of [-40, 40]) {
    ctx.landOverride(bx - 4, zn - 14, bx + 4, zn + 1)
    b.box(bx - 4, 0, zn - 14, bx + 4, 0.35, zn + 1, 0xb8b0a0, { solid: false })
    railing(b, bx - 4, zn - 14, bx - 4, zn, 0.35, 1, 0x8a8478, 2)
    railing(b, bx + 4, zn - 14, bx + 4, zn, 0.35, 1, 0x8a8478, 2)
    b.box(bx - 4, -2, zn - 9, bx + 4, 0, zn - 5, 0x8a8478, { solid: false })
  }
  ctx.interact({ x: 0, z: zs - 3, r: 8, label: '在沙面江边散步', type: 'view' })
  ctx.crowd(0, 0, 80, 18)
  ctx.crowd(0, zs - 4, 70, 8)
}

// ---------------- 上下九步行街 ----------------
export function buildShangxiajiu(b, ctx) {
  paving(b, -85, -5, 85, 5, 0, 0xb8a888)
  qilouRow(b, -80, -69, -5, 1, { seed: 911, depth: 10 })
  qilouRow(b, -51, 80, -5, 1, { seed: 912, depth: 10 })
  qilouRow(b, -80, 80, 5, -1, { seed: 922, depth: 10 })
  // 入口牌坊
  for (const x of [-82, 82]) {
    b.boxC(x, 0, -4, 0.8, 7, 0.8, 0x8a2a1a)
    b.boxC(x, 0, 4, 0.8, 7, 0.8, 0x8a2a1a)
    b.box(x - 0.5, 7, -4.6, x + 0.5, 8.4, 4.6, 0x8a2a1a, { solid: false })
    b.box(x - 0.8, 8.4, -5, x + 0.8, 8.8, 5, C.glazedGreen, { solid: false })
    b.sign('上下九步行街', x + (x < 0 ? -0.55 : 0.55), 7.7, 0, 1.1, x < 0 ? -Math.PI / 2 : Math.PI / 2, { bg: '#7a1a14', fg: '#ffe08a' })
  }
  // 街心红灯笼（夜晚亮起）
  for (let x = -76; x <= 76; x += 8) {
    b.box(x - 0.05, 6.4, -4, x + 0.05, 6.5, 4, 0x3a3a3a, { solid: false })
    for (const z of [-2, 0, 2]) b.boxC(x, 5.5, z, 0.6, 0.8, 0.6, 0xe03020, 'neon')
  }
  // 老字号店铺（交互）
  const shops = [
    [-60, -1, '老字号茶楼·早茶', 'teahouse'],
    [-25, 1, '南信双皮奶', 'dessert'],
    [10, -1, '云吞面世家', 'noodle'],
    [45, 1, '深井烧鹅', 'goose']
  ]
  for (const [x, s, name, shop] of shops) {
    const z = s * 5
    b.sign(name, x, 3.85, z + -s * 0.05 + -s * 0.6, 0.75, s > 0 ? Math.PI : 0, { bg: '#7a1a14', fg: '#ffe08a', glow: true })
    ctx.interact({ x, z: s * 3.2, r: 3.2, label: name, type: 'shop', shop })
  }
  // 茶楼：更高大的三层岭南茶楼
  b.box(-68, 0, -18, -52, 14, -5.2, 0xc8a070, 'window')
  b.hipRoof(-60, -11.6, 16, 13, 14, 3, C.glazedGreen, { over: 0.8 })
  b.sign('陶 陶 居', -60, 11.5, -5.1, 1.4, 0, { bg: '#2a1a0a', fg: '#e8c050', border: '#a87a2a' })
  ctx.interact({ x: 0, z: 0, r: 6, label: '了解西关骑楼', type: 'culture', id: 'qilou' })
  ctx.crowd(0, 0, 75, 22)
}

// ---------------- 永庆坊 / 恩宁路 ----------------
export function buildYongqingfang(b, ctx) {
  paving(b, -62, -5, 62, 5, 0, 0xb0a490)
  // 恩宁路骑楼（南侧整排，北侧东段）
  qilouRow(b, -60, 60, 5, -1, { seed: 1001, depth: 9 })
  qilouRow(b, 22, 60, -5, 1, { seed: 1002, depth: 9 })
  qilouRow(b, -60, -28, -5, 1, { seed: 1003, depth: 9 })
  // 永庆坊入口
  b.box(-27, 0, -6, -23, 6, -5, 0x6a6a68, 'brick')
  b.box(17, 0, -6, 21, 6, -5, 0x6a6a68, 'brick')
  b.box(-27, 6, -6.5, 21, 7.2, -4.5, 0x5a5a58, { mat: 'brick', solid: false })
  b.sign('永庆坊', -3, 6.6, -4.45, 1.1, 0, { bg: '#2a2a2a', fg: '#f0e0b0' })
  // 西关民居：青砖、镬耳墙、趟栊门
  const r = mulberry32(1200)
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 5; i++) {
      const x = -22 + i * 9, z = -14 - row * 12
      if (row === 1 && i === 2) {
        // 小广场 + 李小龙祖居
        paving(b, x - 4, z - 5, x + 4, z + 5, 0, 0xb8b0a0)
        roundTree(b, x, 0, z, 0.8)
        continue
      }
      xiguanHouse(b, x, z, 8, 10, r)
    }
  }
  // 李小龙祖居
  b.box(-29, 0, -40, -23, 7, -30, 0x707a76, 'brick')
  b.gableRoof(-29.2, -22.8, -40, -30, 7, 2.2, C.roofGrey, { over: 0.4 })
  b.sign('李小龙祖居', -26, 5, -29.9, 0.6, 0, { bg: '#1a1a1a', fg: '#f2c230' })
  ctx.interact({ x: -26, z: -28, r: 3, label: '参观李小龙祖居', type: 'info', text: '功夫巨星李小龙的祖居位于恩宁路永庆坊13号，是一座典型的西关民居。' })
  // 粤剧艺术博物馆（南侧，岭南园林 + 戏台）
  const mx = 38, mz = 22
  b.box(mx - 20, 0, mz - 8, mx + 20, 0.3, mz + 14, 0xb8b0a0, { solid: false })
  b.box(mx - 14, 0.3, mz - 2, mx + 14, 0.32, mz + 8, C.water, { mat: 'pond', solid: false })
  // 戏台（朝北）
  b.box(mx - 7, 0, mz + 8, mx + 7, 1.6, mz + 14, 0x8a2a1a, 'wood')
  for (const dx of [-6.5, -2, 2, 6.5]) b.boxC(mx + dx, 1.6, mz + 8.5, 0.5, 5, 0.5, 0x8a2a1a, 'wood')
  b.box(mx - 7, 1.6, mz + 13.5, mx + 7, 6.6, mz + 14, 0xa87a2a, { mat: 'wood' })
  b.hipRoof(mx, mz + 11, 15, 7, 6.6, 3, C.glazedGreen, { over: 0.8, eave: 0xd8a838 })
  woodCarving(b, mx - 6.5, mx + 6.5, mz + 8.5, 5.4, 1300)
  b.sign('粤剧艺术博物馆', mx, 10.4, mz + 9, 0.8, Math.PI, { bg: '#1a1a1a', fg: '#e8c050' })
  for (const s of [-1, 1]) {
    b.box(mx + s * 16 - 3, 0, mz - 6, mx + s * 16 + 3, 7, mz + 12, 0x707a76, 'brick')
    b.gableRoof(mx + s * 16 - 3.2, mx + s * 16 + 3.2, mz - 6, mz + 12, 7, 2.5, C.roofGrey, { over: 0.4 })
  }
  // 戏台演员（粤剧人物）
  const actors = new THREE.Group()
  const costume = [[0xd83030, 0xf2c230], [0x3060c8, 0xf0f0f0], [0xe070a0, 0xf2c230]]
  costume.forEach(([a, c], i) => {
    const ab = new Builder()
    ab.boxC(0, 0, 0, 0.8, 1.2, 0.5, a, { solid: false })
    ab.boxC(0, 1.2, 0, 0.9, 1.0, 0.55, c, { solid: false })
    ab.boxC(0, 2.2, 0, 0.6, 0.6, 0.6, 0xf2d8c0, { solid: false })
    ab.boxC(0, 2.8, 0, 0.8, 0.5, 0.7, 0x1a1a1a, { solid: false })
    ab.boxC(0, 3.3, 0, 0.2, 0.9, 0.2, c, { solid: false })
    ab.box(-0.9, 1.6, -0.1, -0.45, 1.8, 0.1, 0xffffff, { solid: false })
    ab.box(0.45, 1.6, -0.1, 0.9, 1.8, 0.1, 0xffffff, { solid: false })
    const g = ab.build(false)
    g.position.set(mx - 3 + i * 3, 1.6, mz + 11)
    g.rotation.y = Math.PI
    actors.add(g)
  })
  ctx.add(actors)
  ctx.onUpdate((dt, t) => {
    actors.children.forEach((a, i) => {
      a.rotation.y = Math.PI + Math.sin(t * 1.2 + i * 2) * 0.6
      a.position.y = 1.6 + Math.abs(Math.sin(t * 2 + i)) * 0.15
    })
  })
  ctx.interact({ x: mx, z: mz + 3, r: 7, label: '观看粤剧表演', type: 'culture', id: 'opera' })
  ctx.crowd(0, 0, 55, 12)
  ctx.crowd(-3, -26, 18, 6)
}

function xiguanHouse(b, x, z, w, d, r) {
  const wall = r() < 0.5 ? 0x6e7a76 : 0x7a8480
  b.box(x - w / 2, 0, z - d / 2, x + w / 2, 6, z + d / 2, wall, 'brick')
  b.box(x - w / 2, 0, z + d / 2 - 0.1, x + w / 2, 0.8, z + d / 2 + 0.05, C.granite, { solid: false })
  // 趟栊门
  b.box(x - 1, 0.8, z + d / 2, x + 1, 3.6, z + d / 2 + 0.1, 0x4a2a16, { mat: 'wood', solid: false })
  for (let i = 0; i < 9; i++) b.box(x - 0.95 + i * 0.22, 0.9, z + d / 2 + 0.1, x - 0.85 + i * 0.22, 3.4, z + d / 2 + 0.2, 0x5a3a1e, { mat: 'wood', solid: false })
  b.box(x - 1.4, 3.6, z + d / 2, x + 1.4, 4.0, z + d / 2 + 0.3, 0x5a5a5a, { solid: false })
  // 满洲窗
  b.box(x + 1.8, 2.2, z + d / 2, x + 3.2, 3.6, z + d / 2 + 0.1, 0x3a8ab0, { mat: 'glow', solid: false })
  b.box(x + 1.7, 2.1, z + d / 2 + 0.1, x + 3.3, 3.7, z + d / 2 + 0.15, 0xe0c060, { solid: false })
  // 屋顶 + 镬耳墙
  b.gableRoof(x - w / 2 - 0.1, x + w / 2 + 0.1, z - d / 2, z + d / 2, 6, 2, C.roofGrey, { over: 0.3 })
  for (const s of [-1, 1]) {
    const xx = x + s * (w / 2 - 0.2)
    for (let k = 0; k < 6; k++) {
      const hz = Math.sin((k / 5) * Math.PI) * 2.8
      b.box(xx - 0.25, 6, z - d / 2 + k * (d / 6), xx + 0.25, 6 + 1.2 + hz, z - d / 2 + (k + 1) * (d / 6), wall, { mat: 'brick', solid: false })
    }
    b.box(xx - 0.3, 6 + 3.6, z - 1.2, xx + 0.3, 6 + 4.2, z + 1.2, 0x2a2a2a, { solid: false })
  }
}

// ---------------- 荔枝湾 ----------------
export function buildLizhiwan(b, ctx) {
  // 涌两岸石板路、西关大屋、石桥、艇仔
  const r = mulberry32(777)
  for (const s of [-1, 1]) {
    paving(b, s > 0 ? 3.5 : -10, -40, s > 0 ? 10 : -3.5, 40, 0, 0xa8a090)
    railing(b, s * 3.6, -40, s * 3.6, 40, 0, 0.9, 0x8a8478, 2)
    for (let z = -36; z <= 36; z += 12) {
      xiguanHouse(b, s * 16, z, 10, 11, r)
      if (z % 24 === 0) kapok(b, s * 8, 0, z + 6, 0.7)
      else roundTree(b, s * 8, 0, z + 6, 0.7, 0x4a8a3a)
      lamp(b, s * 5, 0, z, 3.5, 'old')
    }
  }
  // 拱桥
  for (const z of [-20, 14]) {
    ctx.landOverride(-4.5, z - 2, 4.5, z + 2)
    for (let i = 0; i < 5; i++) {
      const y = Math.sin((i / 4) * Math.PI) * 1.3
      b.box(-4.5 + i * 1.8, 0.1 + y, z - 2, -2.7 + i * 1.8, 0.4 + y, z + 2, 0xb0aaa0, { solid: false })
    }
    b.box(-0.9, 0, z - 2, 0.9, 1.7, z + 2, 0xb0aaa0)
    b.sign(z < 0 ? '荔枝湾' : '西关', 0, 2.4, z + 2.05, 0.5, 0, { bg: '#b0aaa0', fg: '#2a2a2a' })
  }
  // 艇仔（小船）
  for (const z of [-30, -6, 26]) {
    b.box(-1.2, -0.6, z - 3, 1.2, 0, z + 3, 0x6a3a1a, { mat: 'wood', solid: false })
    b.box(-1.1, 0, z - 1.5, 1.1, 1.6, z + 1.5, 0x3a2a1a, { mat: 'wood', solid: false })
    b.box(-1.3, 1.6, z - 1.8, 1.3, 1.8, z + 1.8, 0xc8a050, { mat: 'roof', solid: false })
  }
  stall(b, 7, -8, 0, 0xb8322a, '艇仔粥', -1)
  ctx.interact({ x: 6, z: -11, r: 3, label: '艇仔粥摊', type: 'shop', shop: 'congee' })
  ctx.crowd(-6, 0, 30, 8)
  ctx.crowd(6, 0, 30, 8)
}
