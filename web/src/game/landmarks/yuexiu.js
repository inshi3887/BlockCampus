// 越秀区：越秀公园/镇海楼、五羊石像、中山纪念堂、北京路、南越王博物馆、圣心大教堂、六榕寺、天字码头
import { C, banyan, kapok, roundTree, palm, lamp, bench, railing, paving, flowerBed, statue, qilouRow, stall, chineseHall, boatModel, pine } from './common.js'
import { mulberry32 } from '../util.js'

// ---------------- 越秀公园 · 镇海楼 ----------------
export function buildYuexiuPark(b, ctx) {
  // 镇海楼（五层楼）：红墙绿瓦，明代古城楼，现为广州博物馆
  b.box(-12, 0, -8, 12, 2, 8, 0x8a8478)
  const floors = [[22, 14, 4.2], [20, 12.5, 3.6], [18, 11, 3.4], [16, 9.6, 3.2], [14, 8.4, 3.0]]
  let y = 2
  floors.forEach(([w, d, h], i) => {
    b.box(-w / 2, y, -d / 2, w / 2, y + h, d / 2, i === 0 ? 0xb03a2a : 0xa83428, 'brick')
    // 正面窗格
    for (let k = -3; k <= 3; k++) b.box(k * (w / 8) - 0.6, y + 0.8, d / 2, k * (w / 8) + 0.6, y + h - 0.8, d / 2 + 0.1, i === 0 ? 0x3a2a1a : 0x6a2a1a, { mat: 'wood', solid: false })
    y += h
    b.box(-w / 2 - 1, y, -d / 2 - 1, w / 2 + 1, y + 0.5, d / 2 + 1, C.glazedGreen, { solid: i === 4 })
    y += 0.5
  })
  const top = b.hipRoof(0, 0, 14, 8.4, y, 4, C.glazedGreen, { over: 0.8, minW: 8, minD: 0.6 })
  b.box(-4.5, top, -0.3, 4.5, top + 0.8, 0.3, 0x2a6a4a, { solid: false })
  b.sign('镇海楼', 0, 2 + 4.2 + 3.6 * 0.5 + 1.2, 6.31, 1.2, 0, { bg: '#1a1a1a', fg: '#e8c050', border: '#8a6a2a' })
  b.sign('广州博物馆', 0, 3.2, 7.12, 0.6, 0, { bg: '#f0e8d0', fg: '#3a2a1a' })
  // 城墙残段与古炮
  b.box(-30, 0, 10, -14, 5, 13, 0x7a7468, 'brick')
  for (let x = -29; x < -14; x += 2) b.box(x, 5, 10, x + 1, 6, 13, 0x7a7468, { mat: 'brick', solid: false })
  for (const x of [-8, 8]) {
    b.box(x - 1.5, 0, 11, x + 1.5, 0.6, 13, 0x8a8478)
    b.beam(x, 1.2, 11.5, x, 1.6, 15, 0.6, 0x2a2a2a)
  }
  // 中山纪念碑（越秀山顶，花岗岩方尖碑）
  const mx = 0, mz = 50
  b.box(mx - 8, 0, mz - 8, mx + 8, 1, mz + 8, 0xc8c4bc)
  b.box(mx - 4, 1, mz - 4, mx + 4, 4, mz + 4, 0xd8d4cc)
  for (let i = 0; i < 10; i++) {
    const w = 3.6 - i * 0.22
    b.boxC(mx, 4 + i * 2.4, mz, w, 2.4, w, 0xe8e4dc)
  }
  b.boxC(mx, 28, mz, 1.2, 1.4, 1.2, 0xe8e4dc)
  b.sign('孙中山先生纪念碑', mx, 6, mz + 1.65, 0.5, 0, { bg: '#e8e4dc', fg: '#2a2a2a', vertical: true, px: 40 })
  // 林荫与湖
  const r = mulberry32(55)
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2, d = 18 + r() * 60
    const x = Math.cos(a) * d, z = Math.sin(a) * d
    if (Math.abs(x) < 14 && Math.abs(z) < 14) continue
    if (Math.abs(x - mx) < 10 && Math.abs(z - mz) < 10) continue
    const ty = ctx.height(x, z)
    if (r() < 0.25) kapok(b, x, ty, z, 0.8)
    else if (r() < 0.5) pine(b, x, ty, z, 1.1)
    else banyan(b, x, ty, z, 0.8, i)
  }
  ctx.interact({ x: 0, z: 10, r: 6, label: '了解镇海楼', type: 'info', text: '镇海楼始建于明洪武十三年（1380年），高五层，俗称“五层楼”，有“岭南第一胜览”之称，现为广州博物馆。' })
  ctx.crowd(0, 18, 20, 8)
}

// ---------------- 五羊石像 ----------------
function ram(b, x, y, z, s, rot, color = 0xb8b2a6) {
  const c = Math.cos(rot), si = Math.sin(rot)
  const P = (lx, lz) => [x + lx * c + lz * si, z - lx * si + lz * c]
  const bx = (lx, ly, lz, w, h, d, col = color) => {
    const [px, pz] = P(lx * s, lz * s)
    const ww = Math.abs(c) > 0.7 ? w : d, dd = Math.abs(c) > 0.7 ? d : w
    b.boxC(px, y + ly * s, pz, ww * s, h * s, dd * s, col, { solid: false })
  }
  bx(0, 1.2, 0, 1.6, 1.4, 2.8)
  for (const [lx, lz] of [[-0.5, -1], [0.5, -1], [-0.5, 1], [0.5, 1]]) bx(lx, 0, lz, 0.4, 1.2, 0.4)
  bx(0, 2.2, 1.5, 1.0, 1.4, 1.0)
  bx(0, 2.5, 2.1, 0.7, 0.7, 0.6)
  bx(-0.6, 3.2, 1.3, 0.4, 0.4, 0.9, color - 0x101010)
  bx(0.6, 3.2, 1.3, 0.4, 0.4, 0.9, color - 0x101010)
  bx(-0.75, 2.8, 0.9, 0.3, 0.6, 0.3, color - 0x101010)
  bx(0.75, 2.8, 0.9, 0.3, 0.6, 0.3, color - 0x101010)
  bx(0, 1.8, -1.5, 0.4, 0.5, 0.4)
}

export function buildWuyang(b, ctx) {
  // 五羊石像（1959），位于越秀山木壳岗，大羊口衔稻穗
  b.prism(0, 0, 0, 1.5, 9, 9, 10, 0x8a8478)
  b.prism(0, 0, 1.5, 4, 6, 6, 9, 0x9a948a, { rx1: 4.6, rz1: 4.2 })
  b.prism(0, 0, 4, 6, 4.6, 4.2, 7, 0xa8a296, { rx1: 3.2, rz1: 2.8 })
  ram(b, 0, 6, 0, 1.8, 0, 0xc8c2b6) // 大羊
  b.box(-0.3, 6 + 2.6 * 1.8, 2.2 * 1.8 + 0.4, 0.3, 6 + 2.7 * 1.8, 2.2 * 1.8 + 1.6, 0xe8c050, { solid: false }) // 稻穗
  ram(b, -4, 4, 1.5, 1.0, 0.6)
  ram(b, 4, 4, 1.5, 1.0, -0.6)
  ram(b, -3, 1.5, -4, 0.9, 2.6)
  ram(b, 3.6, 1.5, -3.5, 0.8, -2.4)
  b.sign('五羊石像', 0, 1.0, 9.05, 0.7, 0, { bg: '#5a5248', fg: '#ffffff' })
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2
    roundTree(b, Math.cos(a) * 16, ctx.height(Math.cos(a) * 16, Math.sin(a) * 16), Math.sin(a) * 16, 0.9, i % 2 ? C.leaf : C.darkLeaf)
  }
  ctx.interact({ x: 0, z: 10, r: 6, label: '听五羊传说', type: 'culture', id: 'wuyang' })
  ctx.crowd(0, 13, 8, 5)
}

// ---------------- 中山纪念堂 ----------------
export function buildMemorialHall(b, ctx) {
  // 八角形平面、宝蓝色琉璃瓦重檐攒尖顶、红柱、四面门廊（正面朝南）
  paving(b, -30, -28, 30, 44, 0, 0xd0ccc0)
  b.box(-12, 0, 16, 12, 0.25, 40, C.grass, { mat: 'grass', solid: false })
  b.box(-1.5, 0.25, 16, 1.5, 0.27, 40, 0xd0ccc0, { mat: 'stone', solid: false })
  b.prism(0, 0, 0, 1.6, 20, 20, 8, 0xe8e4dc, { rot: Math.PI / 8 })
  b.prism(0, 0, 1.6, 12, 17, 17, 8, 0xf2ece0, { rot: Math.PI / 8 })
  // 四面门廊
  for (let k = 0; k < 4; k++) {
    const rot = (k * Math.PI) / 2
    const c = Math.cos(rot), s = Math.sin(rot)
    const P = (x, z) => [x * c + z * s, -x * s + z * c]
    const cz = 17.5
    const w = k === 0 ? 16 : 12
    const [px, pz] = P(0, cz)
    const W = Math.abs(c) > 0.5 ? w : 6, D = Math.abs(c) > 0.5 ? 6 : w
    b.boxC(px, 1.6, pz, W, 9, D, 0xf2ece0)
    for (let i = 0; i < (k === 0 ? 6 : 4); i++) {
      const off = -w / 2 + 1 + (i * (w - 2)) / ((k === 0 ? 6 : 4) - 1)
      const [cx, cz2] = P(off, cz + 3.4)
      b.boxC(cx, 1.6, cz2, 0.9, 8.4, 0.9, 0xb02a22)
    }
    const [rx, rz] = P(0, cz + 0.5)
    b.boxC(rx, 10, rz, W + 2, 0.6, D + 2, C.glazedBlue)
    b.boxC(rx, 10.6, rz, W + 1, 0.6, D + 1, C.glazedBlue)
    b.boxC(rx, 11.2, rz, W - 1, 0.8, D - 1, C.glazedBlue)
  }
  // 重檐八角攒尖顶
  b.prism(0, 0, 12, 13, 19, 19, 8, C.glazedBlue, { rot: Math.PI / 8 })
  b.prism(0, 0, 13, 16, 15, 15, 8, 0xf2ece0, { rot: Math.PI / 8 })
  b.prism(0, 0, 16, 17, 16.5, 16.5, 8, C.glazedBlue, { rot: Math.PI / 8 })
  b.prism(0, 0, 17, 24, 14, 14, 8, C.glazedBlue, { rot: Math.PI / 8, rx1: 1.2, rz1: 1.2 })
  b.prism(0, 0, 24, 26, 1.2, 1.2, 8, C.gold, { rot: Math.PI / 8, rx1: 0.3, rz1: 0.3 })
  b.sign('天下为公', 0, 8.6, 20.55, 1.1, 0, { bg: '#1e3a6a', fg: '#e8c050' })
  b.sign('中山纪念堂', 0, 1.0, 44.05, 0.8, 0, { bg: '#e8e4dc', fg: '#1e3a6a' })
  // 孙中山铜像
  statue(b, 0, 0.25, 30, 0x5a4a32, 2.2)
  // 三百年木棉
  kapok(b, -18, 0, 10, 1.6, true)
  b.box(-20, 0, 8, -16, 0.6, 12, 0x8a8478)
  ctx.interact({ x: -18, z: 13, r: 4, label: '赏三百年木棉（英雄树）', type: 'culture', id: 'kapok' })
  for (let z = 18; z < 42; z += 6) {
    roundTree(b, -16, 0, z, 0.9)
    roundTree(b, 16, 0, z, 0.9)
  }
  ctx.interact({ x: 0, z: 24, r: 6, label: '了解中山纪念堂', type: 'info', text: '中山纪念堂建于1929-1931年，由建筑师吕彦直设计，八角形宫殿式建筑，宝蓝色琉璃瓦顶，内部大跨度无柱。' })
  ctx.crowd(0, 30, 16, 10)
}

// ---------------- 北京路步行街 ----------------
export function buildBeijingRoad(b, ctx) {
  // 南北向步行街：z 由北(-) 到南(+)，街宽 10
  paving(b, -5, -62, 5, 62, 0, 0xb8b0a0)
  // 两侧骑楼/商场（以 x 为面宽方向：在旋转局部坐标里按 z 排列）
  qilouAlongZ(b, -62, 62, -5, 1, 2101)
  qilouAlongZ(b, -62, 62, 5, -1, 2102)
  // 千年古道遗址（玻璃罩下的历代路面）
  b.box(-2.5, -1.6, -12, 2.5, 0, 0, 0x8a6a4a, { solid: false })
  const layers = [0x9a7a5a, 0x8a6a4a, 0xa88a62, 0x7a5a3a, 0xb09a7a]
  layers.forEach((c, i) => b.box(-2.4, -1.6 + i * 0.3, -11.8 + i * 1.5, 2.4, -1.35 + i * 0.3, -1.2, c, { solid: false }))
  b.box(-2.6, 0, -12.1, 2.6, 0.12, 0.1, 0xbfe0f0, { mat: 'glass', solid: false })
  b.sign('千年古道遗址', 0, 0.5, 0.2, 0.5, 0, { bg: '#2a2a2a', fg: '#e8c050' })
  ctx.interact({ x: 0, z: -6, r: 4, label: '观看千年古道遗址', type: 'info', text: '北京路地下发现了唐、南汉、宋、元、明、清至民国共11层路面，是广州两千多年城市中轴线的见证。' })
  // 北端：广东省财政厅旧楼（新古典主义，带穹顶）
  b.box(-14, 0, -106, 14, 14, -90, 0xe8dcc0)
  for (let i = -5; i <= 5; i++) b.boxC(i * 2.4, 1, -89.6, 0.8, 11, 0.8, 0xf4efe2)
  b.box(-14.5, 13, -106.5, 14.5, 14.5, -89.2, 0xf4efe2)
  b.prism(0, -98, 14.5, 18, 4, 4, 12, 0xe8dcc0)
  b.prism(0, -98, 18, 21, 4, 4, 12, 0x6a9a8a, { rx1: 0.6, rz1: 0.6 })
  b.sign('广东省财政厅', 0, 12, -89.1, 0.8, 0, { bg: '#e8dcc0', fg: '#3a2a1a' })
  // 南北牌坊
  for (const z of [-60, 60]) {
    for (const x of [-5.5, 5.5]) b.boxC(x, 0, z, 0.8, 7.5, 0.8, 0x2a2a2a)
    b.box(-6.5, 7.5, z - 0.6, 6.5, 8.8, z + 0.6, 0x2a2a2a, { solid: false })
    b.sign('北京路', 0, 8.15, z + (z > 0 ? 0.65 : -0.65), 1, z > 0 ? 0 : Math.PI, { bg: '#2a2a2a', fg: '#ffd76a', glow: true })
  }
  // 广府文化源地雕塑
  b.box(-1.5, 0, 20, 1.5, 1, 23, C.granite)
  b.box(-0.6, 1, 21, 0.6, 5, 22, 0xb8a070)
  b.sign('广府文化源地', 0, 3, 22.05, 0.45, 0, { bg: '#b8a070', fg: '#2a1a0a', vertical: true, px: 40 })
  ctx.interact({ x: 0, z: 25, r: 4, label: '了解广府文化', type: 'culture', id: 'guangfu' })
  // 小吃：肠粉、牛杂
  stall(b, 2, 34, 0, 0xc0392b, '银记肠粉', -1)
  stall(b, -2, 44, 0, 0xd36a1a, '牛杂', 1)
  ctx.interact({ x: 2, z: 31.5, r: 3, label: '银记肠粉', type: 'shop', shop: 'cheungfun' })
  ctx.interact({ x: -2, z: 46.5, r: 3, label: '牛杂档', type: 'shop', shop: 'beef' })
  ctx.interact({ x: 3.5, z: 10, r: 3, label: '广州手信店', type: 'shop', shop: 'souvenir' })
  // 霓虹招牌
  const r = mulberry32(88)
  const brands = ['广州手信', '老字号', '岭南茶艺', '新华书店', '凉茶铺', '广绣', '珠宝', '糖水']
  for (let i = 0; i < 12; i++) {
    const z = -54 + i * 9.5
    const s = i % 2 ? 1 : -1
    b.sign(brands[i % brands.length], s * 4.3, 5.2 + r() * 2, z, 0.9, s > 0 ? -Math.PI / 2 : Math.PI / 2, { bg: ['#c0392b', '#1a5aa0', '#2a8a4a', '#8a2ab0'][i % 4], fg: '#ffffff', glow: true, vertical: true, px: 40 })
  }
  for (let z = -56; z <= 56; z += 8) lamp(b, 0, 0, z, 4.5, 'old')
  ctx.crowd(0, 0, 4, 50, 26)
}

// 沿 z 方向的骑楼排（通过临时旋转构建器实现）
function qilouAlongZ(b, z0, z1, xFront, face, seed) {
  // 将 x/z 互换：调用 qilouRow 于一个 90° 旋转的子坐标系中
  const sub = Object.create(b)
  const rot = face > 0 ? Math.PI / 2 : -Math.PI / 2
  sub.rot = b.rot + rot
  sub.cos = Math.cos(sub.rot)
  sub.sin = Math.sin(sub.rot)
  // 局部点 (x', z') 在子坐标系下 → 原坐标系 (x, z)
  const ox = b.wx(xFront, 0), oz = b.wz(xFront, 0)
  sub.ox = ox
  sub.oz = oz
  // face>0（西侧，面朝 +x）：子坐标 +z → 原 +x
  const L0 = face > 0 ? -z1 : z0, L1 = face > 0 ? -z0 : z1
  qilouRow(sub, L0, L1, 0, 1, { seed, depth: 11, floors: 3 })
}

// ---------------- 南越王博物馆 ----------------
export function buildNanyueMuseum(b, ctx) {
  // 红砂岩外墙，正面高台阶入口，后部玻璃金字塔覆盖古墓
  const red = 0xa8503a
  b.box(-20, 0, -14, 20, 4, 14, red)
  for (let i = 0; i < 8; i++) b.box(-5 + 0 * i, i * 0.5, 14 + (8 - i) * 0.8 - 0.8, 5, (i + 1) * 0.5, 14 + (8 - i) * 0.8, 0xc8beb0)
  b.box(-20, 4, -14, -6, 16, 14, red)
  b.box(6, 4, -14, 20, 16, 14, red)
  b.box(-6, 4, 2, 6, 16, 14, 0x8a3a2a)
  b.box(-4, 4, 13.9, 4, 12, 14.05, 0x3a2a1a, { solid: false })
  for (let k = 0; k < 4; k++) b.box(-20 + k * 0.3, 16 + k * 0.5, -14 + k * 0.3, 20 - k * 0.3, 16.5 + k * 0.5, 14 - k * 0.3, 0x9a4a36, { solid: k === 0 })
  // 浮雕：守门石兽
  for (const s of [-1, 1]) b.box(s * 10 - 3, 6, 14, s * 10 + 3, 12, 14.3, 0x8a4030, { solid: false })
  b.sign('西汉南越王博物馆', 0, 13.5, 14.06, 1.0, 0, { bg: '#8a3a2a', fg: '#f0d8b0' })
  // 后部玻璃金字塔（古墓保护罩）
  for (let i = 0; i < 6; i++) b.boxC(0, 4 + i * 1.6, -24, 18 - i * 3, 1.6, 14 - i * 2.3, 0x9fc6e0, { mat: i % 2 ? 'glass' : 'curtain', solid: i === 0 })
  b.box(-9, 0, -31, 9, 4, -17, 0x8a4030)
  ctx.interact({ x: 0, z: 22, r: 5, label: '参观南越王博物馆', type: 'info', text: '1983年在象岗山发现西汉南越国第二代王赵眜之墓，出土“丝缕玉衣”等珍贵文物，博物馆建于原址之上。' })
  for (let x = -18; x <= 18; x += 6) palm(b, x, 0, 24, 0.7)
  ctx.crowd(0, 26, 12, 4)
}

// ---------------- 圣心大教堂（石室） ----------------
export function buildSacredHeart(b, ctx) {
  // 花岗岩哥特式双塔，塔高约58米（≈23格），正面朝南
  const g = 0x8e8b84, g2 = 0x7a7770
  paving(b, -20, 14, 20, 30, 0, 0xc8c4b8)
  // 中殿
  b.box(-7, 0, -30, 7, 14, 10, g, 'stone')
  b.gableRoof(-7.4, 7.4, -30, 10, 14, 0, 0x55575a, {})
  for (let i = 0; i < 8; i++) b.box(-7 + i * 0.85, 14 + i * 0.9, -30, 7 - i * 0.85, 14.9 + i * 0.9, 10, 0x55575a, { mat: 'roof', solid: i === 0 })
  // 侧廊与飞扶壁
  for (const s of [-1, 1]) {
    b.box(s * 7, 0, -28, s * 12, 8, 8, g2, 'stone')
    for (let z = -26; z <= 6; z += 4) {
      b.box(s * 12, 0, z - 0.6, s * 13, 10, z + 0.6, g, 'stone')
      b.beam(s * 12.5, 10, z, s * 7, 13, z, 0.6, g)
      b.box(s * 7 - 0.05 * s, 3, z + 1, s * 7.05, 7, z + 2.6, 0x8a5ad0, { mat: 'glow', solid: false })
    }
  }
  // 后殿半圆
  b.prism(0, -30, 0, 13, 7, 6, 10, g, { mat: 'stone' })
  // 双塔
  for (const s of [-1, 1]) {
    const x = s * 6
    b.box(x - 3.5, 0, 8, x + 3.5, 28, 15, g, 'stone')
    for (let y = 4; y < 26; y += 6) {
      b.box(x - 1, y, 14.95, x + 1, y + 3.5, 15.05, 0x2a2a3a, { solid: false })
      b.box(x - 0.6, y + 3.5, 14.95, x + 0.6, y + 4.1, 15.05, 0x2a2a3a, { solid: false })
    }
    for (const dx of [-3.5, 3.5]) b.box(x + dx - 0.4, 28, 8, x + dx + 0.4, 31, 15, g, { solid: false })
    // 尖顶
    for (let i = 0; i < 12; i++) b.boxC(x, 28 + i * 2.2, 11.5, 6 - i * 0.48, 2.2, 6 - i * 0.48, g2, { solid: i === 0 })
    b.boxC(x, 54.4, 11.5, 0.3, 3, 0.3, 0xe8e4dc, { solid: false })
    b.boxC(x, 56, 11.5, 1.6, 0.3, 0.3, 0xe8e4dc, { solid: false })
  }
  // 玫瑰窗
  b.prism(0, 15.06, 15, 15.1, 3, 3, 16, 0x6a4ab0, { mat: 'glow', solid: false })
  const rw = [0xd83030, 0x3060d8, 0xf2c230, 0x30a860]
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    b.boxC(Math.cos(a) * 1.8, 15 + Math.sin(a) * 1.8, 15.12, 0.8, 0.8, 0.05, rw[i % 4], { mat: 'glow', solid: false })
  }
  b.box(-3, 0, 14.95, 3, 9, 15.2, 0x5a4030, { mat: 'wood', solid: false })
  b.box(-3.4, 9, 14.9, 3.4, 11, 15.3, g, { solid: false })
  b.box(-1, 11, 14.9, 1, 12, 15.3, g, { solid: false })
  b.sign('圣心大教堂', 0, 2, 22.5, 0.7, 0, { bg: '#4a4a52', fg: '#ffffff' })
  b.box(-2, 0, 22, 2, 1.4, 22.4, 0x4a4a52)
  ctx.interact({ x: 0, z: 18, r: 5, label: '了解石室圣心大教堂', type: 'info', text: '圣心大教堂建于1863-1888年，全部以花岗岩砌成，俗称“石室”，是全球四座全石结构哥特式教堂之一。' })
  ctx.crowd(0, 20, 14, 5)
}

// ---------------- 六榕寺花塔 ----------------
export function buildLiurong(b, ctx) {
  // 八角九层（外观九层，内部十七层）楼阁式塔，塔身彩绘如花
  paving(b, -16, -16, 16, 16, 0, 0xc0b8a8)
  b.prism(0, 0, 0, 1.5, 6, 6, 8, C.granite, { rot: Math.PI / 8 })
  let y = 1.5
  for (let f = 0; f < 9; f++) {
    const r = 4.2 - f * 0.28
    const h = 2.4 - f * 0.05
    b.prism(0, 0, y, y + h, r, r, 8, f % 2 ? 0xe8d8b0 : 0xd8c090, { rot: Math.PI / 8 })
    for (let k = 0; k < 8; k++) {
      const a = Math.PI / 8 + (k / 8) * Math.PI * 2 + Math.PI / 8
      b.boxC(Math.cos(a) * (r - 0.1), y + 0.4, Math.sin(a) * (r - 0.1), 0.5, h * 0.6, 0.5, 0xb02a22, { solid: false })
    }
    y += h
    b.prism(0, 0, y, y + 0.5, r + 1.1, r + 1.1, 8, C.glazedGreen, { rot: Math.PI / 8, rx1: r + 0.3, rz1: r + 0.3 })
    b.prism(0, 0, y + 0.5, y + 0.7, r + 0.3, r + 0.3, 8, 0xc0392b, { rot: Math.PI / 8, solid: false })
    y += 0.7
  }
  b.prism(0, 0, y, y + 4, 1.2, 1.2, 8, C.gold, { rx1: 0.2, rz1: 0.2, solid: false })
  // 山门与大殿
  chineseHall(b, 0, 26, 18, 9, 6, { wall: 0xd8a040, col: 0xb02a22, roof: 0xd8a838, eave: 0xc89020, ridge: 0xd8a838, wallMat: 'block' })
  b.sign('六榕寺', 0, 5.5, 30.6, 1.0, 0, { bg: '#1a1a1a', fg: '#e8c050' })
  for (let i = 0; i < 6; i++) banyan(b, -14 + (i % 3) * 14, 0, -12 + Math.floor(i / 3) * 24, 0.8, i * 3)
  ctx.interact({ x: 0, z: 8, r: 6, label: '了解六榕寺花塔', type: 'info', text: '六榕寺始建于南朝梁（537年），北宋苏东坡见寺内六株老榕题“六榕”二字。花塔高57.6米，色彩绚丽如花。' })
  ctx.crowd(0, 14, 10, 4)
}

// ---------------- 天字码头（珠江夜游） ----------------
export function buildTianziPier(b, ctx) {
  // 码头建筑位于江岸，浮桥伸向江面（局部 +z 指向南/江面）
  b.box(-14, 0, -8, 14, 7, 0, 0xe8e0d0)
  b.hipRoof(0, -4, 28, 8, 7, 2.5, C.glazedGreen, { over: 0.8 })
  for (let x = -12; x <= 12; x += 4) b.boxC(x, 0, 0.6, 0.6, 7, 0.6, 0xb02a22)
  b.sign('天字码头', 0, 5.4, 0.05, 1.2, 0, { bg: '#1a1a1a', fg: '#e8c050', border: '#8a6a2a' })
  b.sign('珠江夜游', 10, 9.8, -4, 1.0, 0, { bg: '#0a2a4a', fg: '#7ad0ff', glow: true })
  // 浮桥 / 趸船（伸入江中）
  ctx.landOverride(-4, 0, 4, 34)
  b.box(-3, 0.1, 0, 3, 0.4, 28, 0x8a7a6a, { mat: 'wood', solid: false })
  railing(b, -3, 0, -3, 28, 0.4, 1, 0x666666, 2)
  railing(b, 3, 0, 3, 28, 0.4, 1, 0x666666, 2)
  b.box(-10, -0.6, 28, 10, 0.4, 34, 0x5a5a5a, { solid: false })
  ctx.landOverride(-10, 28, 10, 34)
  for (let x = -9; x <= 9; x += 6) lamp(b, x, 0.4, 33, 3.5)
  ctx.interact({ x: 0, z: 30, r: 5, label: '登船：珠江夜游', type: 'cruise', pier: 'tianzi' })
  ctx.crowd(0, -2, 12, 3)
}
