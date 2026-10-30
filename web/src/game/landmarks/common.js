// 景点共享构件：树木、骑楼、欧式建筑、路灯、长椅、雕像……
import { mulberry32 } from '../util.js'

export const C = {
  white: 0xf2f0ea, cream: 0xeadcb4, yellow: 0xe8c66a, red: 0xb5322a, darkRed: 0x7a2420, wood: 0x6b3f22, darkWood: 0x4a2a16,
  greyBrick: 0x7d8580, blueBrick: 0x66706e, stone: 0xb8b4a8, granite: 0x9a978f, darkStone: 0x6a6862, roofGrey: 0x4d5258,
  green: 0x3f8a4a, glazedGreen: 0x2f7a55, glazedBlue: 0x2a5aa8, gold: 0xd9a628, black: 0x222222, glass: 0x9fc6e0,
  grass: 0x6fae4a, leaf: 0x3d8a3a, darkLeaf: 0x2c6b2e, kapok: 0xd7332a, trunk: 0x6a4a30, water: 0x3a7ab0, pave: 0xbcb6aa,
  sand: 0xd8c690, concrete: 0xa8a8a2, asphalt: 0x45474a
}

// 榕树：粗干 + 气根 + 宽冠
export function banyan(b, x, y, z, s = 1, seed = 1) {
  const r = mulberry32(seed)
  b.boxC(x, y, z, 1.4 * s, 4 * s, 1.4 * s, C.trunk, 'wood')
  for (let i = 0; i < 4; i++) {
    const a = r() * Math.PI * 2, d = 2 + r() * 2.5
    b.boxC(x + Math.cos(a) * d * s, y, z + Math.sin(a) * d * s, 0.25, 4.5 * s, 0.25, 0x7a5c40, { mat: 'wood', solid: false })
  }
  b.boxC(x, y + 3.5 * s, z, 8 * s, 2.5 * s, 7 * s, C.darkLeaf, 'leaf')
  b.boxC(x + 0.5 * s, y + 5.5 * s, z - 0.5 * s, 6 * s, 1.8 * s, 6 * s, C.leaf, 'leaf')
  b.boxC(x - 1 * s, y + 4 * s, z + 1, 4 * s, 1.5 * s, 4 * s, 0x4a9a40, 'leaf')
}

// 木棉（英雄树，广州市花）
export function kapok(b, x, y, z, s = 1, bloom = true) {
  b.boxC(x, y, z, 0.7 * s, 7 * s, 0.7 * s, 0x7a6a58, 'wood')
  for (const [dx, dy, dz, w] of [[0, 5, 0, 5], [0, 7, 0, 3.6], [1.2, 6, 0.6, 2.2], [-1.2, 6.2, -0.6, 2.2]]) {
    b.boxC(x + dx * s, y + dy * s, z + dz * s, w * s, 1 * s, w * s, bloom ? C.kapok : C.leaf, 'leaf')
    if (bloom) b.boxC(x + dx * s, y + dy * s + 1 * s, z + dz * s, w * 0.6 * s, 0.5 * s, w * 0.6 * s, 0xe8573a, 'leaf')
  }
  b.boxC(x, y + 3 * s, z, 3 * s, 0.4 * s, 0.3 * s, 0x7a6a58, { mat: 'wood', solid: false })
}

export function roundTree(b, x, y, z, s = 1, color = C.leaf) {
  b.boxC(x, y, z, 0.5 * s, 3 * s, 0.5 * s, C.trunk, 'wood')
  b.boxC(x, y + 2.2 * s, z, 3.2 * s, 2.6 * s, 3.2 * s, color, 'leaf')
  b.boxC(x, y + 4.8 * s, z, 2 * s, 1 * s, 2 * s, color, 'leaf')
}

export function palm(b, x, y, z, s = 1) {
  b.boxC(x, y, z, 0.45 * s, 6 * s, 0.45 * s, 0x8a7a5a, 'wood')
  const c = 0x4f9a3a
  b.boxC(x, y + 6 * s, z, 1 * s, 0.6 * s, 1 * s, c, 'leaf')
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    b.box(x + Math.min(0, dx * 3) * s, y + 5.8 * s, z + Math.min(0, dz * 3) * s, x + Math.max(0, dx * 3) * s + (dx ? 0 : 0.6), y + 6.2 * s, z + Math.max(0, dz * 3) * s + (dz ? 0 : 0.6), c, 'leaf')
  }
}

export function pine(b, x, y, z, s = 1) {
  b.boxC(x, y, z, 0.5 * s, 2 * s, 0.5 * s, C.trunk, 'wood')
  b.boxC(x, y + 1.5 * s, z, 3.4 * s, 1.6 * s, 3.4 * s, 0x2a5e30, 'leaf')
  b.boxC(x, y + 3.1 * s, z, 2.4 * s, 1.6 * s, 2.4 * s, 0x2f6a34, 'leaf')
  b.boxC(x, y + 4.7 * s, z, 1.2 * s, 1.4 * s, 1.2 * s, 0x347238, 'leaf')
}

export function bamboo(b, x, y, z, s = 1) {
  for (let i = 0; i < 4; i++) b.boxC(x + (i % 2) * 0.6, y, z + Math.floor(i / 2) * 0.6, 0.18, 5 * s + i * 0.4, 0.18, 0x6a9a3a, { mat: 'wood', solid: false })
  b.boxC(x + 0.3, y + 4 * s, z + 0.3, 2.4, 2 * s, 2.4, 0x5a9a3a, 'leaf')
}

export function flowerBed(b, x0, z0, x1, z1, y = 0, seed = 3) {
  const r = mulberry32(seed)
  b.box(x0, y, z0, x1, y + 0.5, z1, 0x8a8478, { solid: false })
  b.box(x0 + 0.2, y + 0.5, z0 + 0.2, x1 - 0.2, y + 0.6, z1 - 0.2, 0x5a3a20, { solid: false })
  const cols = [0xe23c5a, 0xf2c230, 0xf07a2a, 0xd94ab0, 0xffffff]
  for (let x = x0 + 0.5; x < x1 - 0.3; x += 0.8)
    for (let z = z0 + 0.5; z < z1 - 0.3; z += 0.8)
      if (r() < 0.75) b.box(x, y + 0.6, z, x + 0.45, y + 0.9 + r() * 0.3, z + 0.45, cols[Math.floor(r() * cols.length)], { mat: 'leaf', solid: false })
}

export function lamp(b, x, y, z, h = 4.5, style = 'modern') {
  if (style === 'old') {
    b.boxC(x, y, z, 0.25, h, 0.25, 0x2a2a2a, { solid: false })
    b.boxC(x, y + h, z, 0.7, 0.8, 0.7, 0xffe0a0, 'lamp')
    b.boxC(x, y + h + 0.8, z, 0.9, 0.2, 0.9, 0x2a2a2a, { solid: false })
  } else {
    b.boxC(x, y, z, 0.22, h, 0.22, 0x666a70, { solid: false })
    b.box(x - 0.1, y + h - 0.2, z - 0.1, x + 1.2, y + h, z + 0.1, 0x666a70, { solid: false })
    b.box(x + 0.6, y + h - 0.35, z - 0.2, x + 1.3, y + h - 0.15, z + 0.2, 0xfff2c8, 'lamp')
  }
}

export function bench(b, x, y, z, along = 'x') {
  if (along === 'x') {
    b.box(x - 1, y + 0.45, z - 0.3, x + 1, y + 0.6, z + 0.3, C.wood, { mat: 'wood', solid: false })
    b.box(x - 1, y + 0.6, z + 0.25, x + 1, y + 1.1, z + 0.35, C.wood, { mat: 'wood', solid: false })
    b.box(x - 0.9, y, z - 0.25, x - 0.8, y + 0.45, z + 0.25, 0x333333, { solid: false })
    b.box(x + 0.8, y, z - 0.25, x + 0.9, y + 0.45, z + 0.25, 0x333333, { solid: false })
  } else {
    b.box(x - 0.3, y + 0.45, z - 1, x + 0.3, y + 0.6, z + 1, C.wood, { mat: 'wood', solid: false })
    b.box(x + 0.25, y + 0.6, z - 1, x + 0.35, y + 1.1, z + 1, C.wood, { mat: 'wood', solid: false })
  }
}

// 简易人物雕像（铜像/石像）
export function statue(b, x, y, z, color = 0x8a6a3a, s = 1, pose = 0) {
  b.boxC(x, y, z, 1.2 * s, 0.9 * s, 1.2 * s, C.granite)
  const yy = y + 0.9 * s
  b.boxC(x - 0.17 * s, yy, z, 0.3 * s, 0.9 * s, 0.3 * s, color, { solid: false })
  b.boxC(x + 0.17 * s, yy, z, 0.3 * s, 0.9 * s, 0.3 * s, color, { solid: false })
  b.boxC(x, yy + 0.9 * s, z, 0.7 * s, 0.9 * s, 0.38 * s, color, { solid: false })
  b.boxC(x, yy + 1.8 * s, z, 0.5 * s, 0.5 * s, 0.5 * s, color, { solid: false })
  b.boxC(x - 0.45 * s, yy + 0.95 * s, z, 0.2 * s, 0.85 * s, 0.25 * s, color, { solid: false })
  if (pose === 1) b.boxC(x + 0.45 * s, yy + 1.6 * s, z, 0.2 * s, 0.8 * s, 0.25 * s, color, { solid: false })
  else b.boxC(x + 0.45 * s, yy + 0.95 * s, z, 0.2 * s, 0.85 * s, 0.25 * s, color, { solid: false })
}

export function stoneLion(b, x, y, z, face = 1) {
  b.boxC(x, y, z, 1.2, 0.6, 1.4, C.granite)
  b.boxC(x, y + 0.6, z, 0.9, 0.7, 1.2, 0xa8a49a, { solid: false })
  b.boxC(x, y + 1.3, z + 0.3 * face, 0.9, 0.8, 0.8, 0xb0aca2, { solid: false })
  b.boxC(x, y + 1.4, z + 0.75 * face, 0.5, 0.4, 0.15, 0x8a867c, { solid: false })
}

export function railing(b, x0, z0, x1, z1, y, h = 1, color = 0xd8d4c8, step = 1.5, opt = {}) {
  const L = Math.hypot(x1 - x0, z1 - z0)
  const n = Math.max(1, Math.round(L / step))
  for (let i = 0; i <= n; i++) {
    const t = i / n
    b.boxC(x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t, 0.25, h, 0.25, color, { solid: false })
  }
  const t = 0.15
  b.box(Math.min(x0, x1) - t, y + h - 0.15, Math.min(z0, z1) - t, Math.max(x0, x1) + t, y + h, Math.max(z0, z1) + t, color, { solid: false })
  if (opt.solid !== false) b.collider(Math.min(x0, x1) - t, y, Math.min(z0, z1) - t, Math.max(x0, x1) + t, y + h + 0.6, Math.max(z0, z1) + t)
}

export function paving(b, x0, z0, x1, z1, y = 0, color = C.pave, h = 0.12) {
  b.box(x0, y, z0, x1, y + h, z1, color, { mat: 'stone', solid: false })
}

// ---------- 骑楼（岭南骑楼街） ----------
// 沿局部 x 方向一排骑楼，正面朝 +z (face=1) 或 -z (face=-1)，z 为街面线（骑楼柱廊外沿）
const QILOU_COLORS = [0xe8d7b0, 0xd9b27a, 0xc96a4a, 0xe0c9a0, 0xb8c9a8, 0xd8a8a0, 0xf0e4c8, 0xc8b48a, 0x9ab8c0, 0xe6c07a]
export function qilouRow(b, x0, x1, zFront, face = 1, opt = {}) {
  const r = mulberry32(opt.seed || 7)
  const depth = opt.depth || 9
  const arc = 2.6 // 骑楼走廊深度
  let x = x0
  const shops = []
  while (x < x1 - 3) {
    const w = Math.min(x1 - x, 4 + Math.floor(r() * 3) * 1)
    const floors = opt.floors || 2 + Math.floor(r() * 2)
    const fh = 3.2
    const col = QILOU_COLORS[Math.floor(r() * QILOU_COLORS.length)]
    const zf = zFront, zb = zFront - face * depth
    const za = zFront - face * arc
    const H = 3.6 + floors * fh
    // 底层商铺（退后）
    b.box(x, 0, Math.min(za, zb), x + w, 3.6, Math.max(za, zb), 0x5a4030, { mat: 'wood' })
    // 店铺门面玻璃/卷闸
    b.box(x + 0.4, 0.2, za - face * 0.05, x + w - 0.4, 3.0, za + face * 0.02, r() < 0.5 ? 0x9fc6e0 : 0xc8a060, { mat: r() < 0.5 ? 'window' : 'wood', solid: false })
    // 柱子
    b.box(x, 0, zf - face * 0.6, x + 0.6, 3.6, zf, col)
    // 拱券
    b.box(x + 0.6, 2.9, zf - face * 0.6, x + w, 3.6, zf, col, { solid: false })
    b.box(x + 1.0, 2.6, zf - face * 0.5, x + w - 0.4, 2.9, zf - face * 0.1, col, { solid: false })
    // 骑楼走廊地面
    b.box(x, 0, Math.min(zf, za), x + w, 0.15, Math.max(zf, za), 0xb8a890, { mat: 'stone', solid: false })
    // 上层楼体
    b.box(x, 3.6, Math.min(zf, zb), x + w, H, Math.max(zf, zb), col)
    // 窗户（满洲窗/百叶）
    for (let f = 0; f < floors; f++) {
      const wy = 3.6 + f * fh + 0.7
      const nwin = Math.max(1, Math.floor((w - 0.6) / 1.6))
      const sp = (w - 0.6) / nwin
      for (let i = 0; i < nwin; i++) {
        const wx = x + 0.3 + i * sp + sp / 2
        const wc = r() < 0.4 ? 0x2f6a4a : r() < 0.6 ? 0x6a3a2a : 0x8ab0c8
        b.box(wx - 0.5, wy, zf + face * 0.0, wx + 0.5, wy + 1.8, zf + face * 0.08, wc, { mat: wc === 0x8ab0c8 ? 'window' : 'wood', solid: false })
        b.box(wx - 0.65, wy - 0.15, zf, wx + 0.65, wy, zf + face * 0.2, 0xf0ead8, { solid: false })
      }
      b.box(x, 3.6 + f * fh, zf, x + w, 3.6 + f * fh + 0.25, zf + face * 0.15, 0xf0ead8, { solid: false })
    }
    // 山花女儿墙
    const ph = 0.8 + r() * 0.8
    b.box(x, H, zf - face * 0.4, x + w, H + 0.6, zf, col, { solid: false })
    b.box(x + w * 0.25, H + 0.6, zf - face * 0.4, x + w * 0.75, H + 0.6 + ph, zf, col, { solid: false })
    b.box(x + w * 0.4, H + 0.6 + ph, zf - face * 0.4, x + w * 0.6, H + 1.0 + ph, zf, col, { solid: false })
    // 屋顶
    b.box(x, H, Math.min(zf - face * 0.4, zb), x + w, H + 0.2, Math.max(zf - face * 0.4, zb), 0x8a7a68, { solid: false })
    shops.push({ x: x + w / 2, z: za + face * 0.8, w })
    x += w
  }
  return shops
}

// ---------- 欧式建筑（沙面） ----------
export function europeanBuilding(b, cx, cz, w, d, floors, color, face = 1, style = 0, seed = 1) {
  const r = mulberry32(seed)
  const fh = 3.4
  const H = floors * fh + 1
  const zf = cz + (face * d) / 2
  b.box(cx - w / 2, 0, cz - d / 2, cx + w / 2, 1, cz + d / 2, 0xd8d0bc) // 台基
  b.box(cx - w / 2 + 0.3, 1, cz - d / 2 + 0.3, cx + w / 2 - 0.3, H, cz + d / 2 - 0.3, color)
  // 横向线脚
  for (let f = 0; f <= floors; f++) b.box(cx - w / 2 + 0.1, 1 + f * fh - 0.2, zf - face * 0.3, cx + w / 2 - 0.1, 1 + f * fh + 0.15, zf + face * 0.15, 0xf4efe2, { solid: false })
  // 拱窗 / 柱廊
  const bays = Math.max(2, Math.floor(w / 3))
  const bw = (w - 1) / bays
  for (let f = 0; f < floors; f++) {
    for (let i = 0; i < bays; i++) {
      const bx = cx - w / 2 + 0.5 + i * bw + bw / 2
      const y0 = 1 + f * fh
      if (style === 1 && f < floors) {
        // 券廊：深色开口 + 立柱
        b.box(bx - bw / 2 + 0.35, y0 + 0.2, zf - face * 0.32, bx + bw / 2 - 0.35, y0 + fh - 0.6, zf - face * 0.28, 0x3a3428, { solid: false })
        b.box(bx - bw / 2 + 0.35, y0 + fh - 0.9, zf - face * 0.3, bx + bw / 2 - 0.35, y0 + fh - 0.5, zf + face * 0.05, 0xf4efe2, { solid: false })
        b.box(bx - bw / 2, y0, zf - face * 0.3, bx - bw / 2 + 0.35, y0 + fh, zf + face * 0.2, 0xf8f4ea, { solid: false })
      } else {
        b.box(bx - 0.55, y0 + 0.8, zf - face * 0.32, bx + 0.55, y0 + 2.6, zf - face * 0.25, 0x5a7a8a, { mat: 'window', solid: false })
        b.box(bx - 0.7, y0 + 2.6, zf - face * 0.3, bx + 0.7, y0 + 3.0, zf + face * 0.1, 0xf4efe2, { solid: false })
        b.box(bx - 0.75, y0 + 0.6, zf - face * 0.3, bx + 0.75, y0 + 0.8, zf + face * 0.25, 0xf4efe2, { solid: false })
        if (f > 0 && r() < 0.4) b.box(bx - 0.9, y0, zf, bx + 0.9, y0 + 0.15, zf + face * 0.8, 0xe8e2d2, { solid: false })
      }
    }
  }
  // 入口门廊与立柱
  b.box(cx - 1.6, 1, zf - face * 0.35, cx + 1.6, 3.6, zf - face * 0.25, 0x4a3020, { mat: 'wood', solid: false })
  for (const dx of [-2.2, 2.2]) b.boxC(cx + dx, 1, zf + face * 0.5, 0.6, 4, 0.6, 0xf8f4ea)
  b.box(cx - 2.8, 5, zf - face * 0.3, cx + 2.8, 5.5, zf + face * 1.0, 0xf4efe2, { solid: false })
  // 檐口与女儿墙
  b.box(cx - w / 2, H, cz - d / 2, cx + w / 2, H + 0.5, cz + d / 2, 0xf4efe2)
  for (let x = cx - w / 2 + 0.5; x < cx + w / 2; x += 1) b.box(x, H + 0.5, zf - face * 0.4, x + 0.35, H + 1.2, zf, 0xf4efe2, { solid: false })
  b.box(cx - w / 2, H + 1.2, zf - face * 0.4, cx + w / 2, H + 1.4, zf, 0xf4efe2, { solid: false })
  // 三角山花 / 穹顶
  if (style === 2) {
    b.prism(cx, cz, H + 0.5, H + 2.5, 2.2, 2.2, 8, 0xf0e8d0)
    b.prism(cx, cz, H + 2.5, H + 4, 2.2, 2.2, 8, 0x5a8a7a, { rx1: 0.5, rz1: 0.5 })
    b.boxC(cx, H + 4, cz, 0.2, 1, 0.2, C.gold, { solid: false })
  } else if (r() < 0.6) {
    for (let i = 0; i < 4; i++) b.box(cx - 3 + i * 0.75, H + 1.4 + i * 0.4, zf - face * 0.4, cx + 3 - i * 0.75, H + 1.8 + i * 0.4, zf, 0xf4efe2, { solid: false })
  }
  // 屋顶
  b.box(cx - w / 2 + 0.5, H + 0.5, cz - d / 2 + 0.5, cx + w / 2 - 0.5, H + 1.5, cz + d / 2 - 0.5, 0x9a4a3a, { mat: 'roof', solid: false })
  return { door: { x: cx, z: zf + face * 1.2 } }
}

// ---------- 现代塔楼 ----------
export function modernTower(b, cx, cz, w, d, h, color = 0x9fc0d8, opt = {}) {
  const mat = opt.mat || 'curtain'
  b.box(cx - w / 2 - 1, 0, cz - d / 2 - 1, cx + w / 2 + 1, 5, cz + d / 2 + 1, opt.podium || 0x8a9098, { mat: 'window' })
  b.box(cx - w / 2, 5, cz - d / 2, cx + w / 2, h, cz + d / 2, color, { mat })
  if (opt.crown !== false) {
    b.box(cx - w / 2 + 1, h, cz - d / 2 + 1, cx + w / 2 - 1, h + 2, cz + d / 2 - 1, 0xd8dce0)
    b.boxC(cx, h + 2, cz, 0.3, 4, 0.3, 0xe0e0e0, { solid: false })
    b.boxC(cx, h + 6, cz, 0.6, 0.6, 0.6, 0xff3030, 'lamp')
  }
}

export function busShelter(b, x, z, rot = 0, name = '') {
  b.box(x - 3, 0, z - 0.8, x + 3, 0.15, z + 0.8, 0x9a9a9a, { solid: false })
  for (const dx of [-2.8, 2.8]) b.boxC(x + dx, 0, z - 0.6, 0.15, 2.8, 0.15, 0x3a6a9a, { solid: false })
  b.box(x - 3, 2.8, z - 0.9, x + 3, 3.0, z + 0.9, 0x3a6a9a, { solid: false })
  b.box(x - 2.8, 0.4, z - 0.7, x + 2.8, 2.6, z - 0.6, 0x9fc6e0, { mat: 'glass', solid: false })
  b.box(x - 2.2, 0.5, z - 0.5, x + 2.2, 0.7, z - 0.1, 0x8a8a8a, { solid: false })
  b.boxC(x + 3.4, 0, z, 0.15, 3.2, 0.15, 0x666666, { solid: false })
  b.boxC(x + 3.4, 3.2, z, 1.1, 0.8, 0.12, 0x2a6ab0, { solid: false })
  if (name) b.sign(name, x, 3.35, z + 0.95, 0.6, 0, { bg: '#2a6ab0', fg: '#ffffff', px: 48 })
}

// 地铁口（广州地铁红色 logo 风格）
export function metroEntrance(b, x, z, name) {
  b.box(x - 2.5, 0, z - 3, x + 2.5, 0.2, z + 3, 0x8a8a8a, { solid: false })
  b.box(x - 2.5, 0.2, z - 3, x - 2.2, 3.2, z + 3, 0xc8c8c8)
  b.box(x + 2.2, 0.2, z - 3, x + 2.5, 3.2, z + 3, 0xc8c8c8)
  b.box(x - 2.5, 0.2, z - 3, x + 2.5, 3.2, z - 2.7, 0xc8c8c8)
  b.box(x - 2.8, 3.2, z - 3.3, x + 2.8, 3.6, z + 3.3, 0xb8222a)
  b.box(x - 1.8, 0.21, z - 2.2, x + 1.8, 0.25, z + 2.6, 0x333333, { solid: false })
  b.boxC(x + 3.2, 0, z + 2.8, 0.3, 4.2, 0.3, 0x888888, { solid: false })
  b.boxC(x + 3.2, 4.2, z + 2.8, 1.2, 1.2, 0.3, 0xb8222a, 'neon')
  b.sign('M', x + 3.2, 4.8, z + 2.97, 0.9, 0, { bg: '#b8222a', fg: '#ffffff', px: 64, glow: true })
  b.sign(name, x, 3.4, z + 3.32, 0.4, 0, { bg: '#b8222a', fg: '#ffffff', px: 48 })
}

// 小吃档 / 店铺
export function stall(b, x, z, rot, color = 0xc0392b, name = '', face = 1) {
  b.box(x - 1.6, 0, z - 1.2, x + 1.6, 1.1, z + 1.2, 0x8a6a4a, { mat: 'wood' })
  b.box(x - 1.7, 1.1, z - 1.3, x + 1.7, 1.2, z + 1.3, 0xe8e0d0, { solid: false })
  for (const dx of [-1.5, 1.5]) for (const dz of [-1.1, 1.1]) b.boxC(x + dx, 1.2, z + dz, 0.12, 1.8, 0.12, 0x444444, { solid: false })
  b.box(x - 2, 3, z - 1.6, x + 2, 3.3, z + 1.6, color, { solid: false })
  b.box(x - 2, 2.7, z + face * 1.6, x + 2, 3.0, z + face * 1.65, 0xffffff, { solid: false })
  if (name) b.sign(name, x, 3.6, z + face * 1.2, 0.6, face > 0 ? 0 : Math.PI, { bg: '#7a1a14', fg: '#ffe08a', px: 48 })
}

export function boatModel(b, x, y, z, len, color = 0xf0f0f0, opt = {}) {
  const w = opt.w || len * 0.28
  b.box(x - len / 2, y, z - w / 2, x + len / 2, y + 1.2, z + w / 2, color, { solid: false })
  b.box(x + len / 2 - 0.2, y + 0.2, z - w / 2 + 0.4, x + len / 2 + 1.2, y + 1.2, z + w / 2 - 0.4, color, { solid: false })
  b.box(x - len / 2 + 1, y + 1.2, z - w / 2 + 0.3, x + len / 2 - 2, y + 2.6, z + w / 2 - 0.3, opt.cabin || 0x9fc6e0, { mat: 'window', solid: false })
  b.box(x - len / 2 + 0.8, y + 2.6, z - w / 2 + 0.2, x + len / 2 - 1.8, y + 2.8, z + w / 2 - 0.2, color, { solid: false })
}

// 中式牌坊
export function paifang(b, cx, z, w, h, text, color = C.granite, roof = C.glazedGreen, signOpts = {}) {
  const cols = [-w / 2, -w / 6, w / 6, w / 2]
  for (const dx of cols) {
    b.boxC(cx + dx, 0, z, 0.9, h, 0.9, color)
    b.boxC(cx + dx, 0, z, 1.4, 1, 1.4, color)
  }
  b.box(cx - w / 2 - 0.5, h - 1.5, z - 0.4, cx + w / 2 + 0.5, h - 0.8, z + 0.4, color, { solid: false })
  b.box(cx - w / 6, h - 3.2, z - 0.35, cx + w / 6, h - 1.5, z + 0.35, color, { solid: false })
  // 三间屋顶
  b.hipRoof(cx, z, w / 3 + 1.2, 1.6, h, 1.3, roof, { over: 0.5, eave: roof, minW: w / 3 })
  b.hipRoof(cx - w / 3, z, w / 3, 1.4, h - 0.9, 1.0, roof, { over: 0.4, minW: w / 4 })
  b.hipRoof(cx + w / 3, z, w / 3, 1.4, h - 0.9, 1.0, roof, { over: 0.4, minW: w / 4 })
  if (text) {
    b.sign(text, cx, h - 2.35, z + 0.4, 1.3, 0, { bg: '#1e3a5a', fg: '#ffd76a', border: '#d9a628', ...signOpts })
    b.sign(text, cx, h - 2.35, z - 0.4, 1.3, Math.PI, { bg: '#1e3a5a', fg: '#ffd76a', border: '#d9a628', ...signOpts })
  }
}

// 中式殿堂（硬山/歇山），正面朝 +z
export function chineseHall(b, cx, cz, w, d, h, opt = {}) {
  const wall = opt.wall || C.greyBrick
  const col = opt.col || C.darkRed
  const roof = opt.roof || C.roofGrey
  const base = opt.base != null ? opt.base : 0.6
  b.box(cx - w / 2 - 0.5, 0, cz - d / 2 - 0.5, cx + w / 2 + 0.5, base, cz + d / 2 + 0.5, opt.baseColor || C.granite)
  // 后墙、山墙
  b.box(cx - w / 2, base, cz - d / 2, cx + w / 2, base + h, cz - d / 2 + 0.6, wall, opt.wallMat || 'brick')
  b.box(cx - w / 2, base, cz - d / 2, cx - w / 2 + 0.6, base + h, cz + d / 2, wall, opt.wallMat || 'brick')
  b.box(cx + w / 2 - 0.6, base, cz - d / 2, cx + w / 2, base + h, cz + d / 2, wall, opt.wallMat || 'brick')
  if (opt.frontWall) {
    const gw = opt.gateW || 3
    b.box(cx - w / 2, base, cz + d / 2 - 0.6, cx - gw / 2, base + h, cz + d / 2, wall, opt.wallMat || 'brick')
    b.box(cx + gw / 2, base, cz + d / 2 - 0.6, cx + w / 2, base + h, cz + d / 2, wall, opt.wallMat || 'brick')
    b.box(cx - gw / 2, base + h * 0.72, cz + d / 2 - 0.6, cx + gw / 2, base + h, cz + d / 2, wall, { mat: opt.wallMat || 'brick', solid: false })
  } else {
    // 前檐柱廊
    const n = Math.max(2, Math.round(w / 3.2))
    for (let i = 0; i <= n; i++) b.boxC(cx - w / 2 + 0.5 + (i * (w - 1)) / n, base, cz + d / 2 - 0.5, 0.5, h, 0.5, col)
    b.box(cx - w / 2, base + h - 0.8, cz + d / 2 - 0.8, cx + w / 2, base + h, cz + d / 2 - 0.2, opt.beam || C.wood, { mat: 'wood', solid: false })
    // 内部隔扇（后部）
    b.box(cx - w / 2 + 0.6, base, cz - d / 2 + 0.6, cx + w / 2 - 0.6, base + 0.1, cz + d / 2 - 0.6, 0xa89a80, { mat: 'stone', solid: false })
  }
  // 屋顶
  const ry = base + h
  b.box(cx - w / 2 - 0.3, ry, cz - d / 2 - 0.3, cx + w / 2 + 0.3, ry + 0.4, cz + d / 2 + 0.3, opt.eave || C.glazedGreen, { solid: false })
  const top = opt.hip
    ? b.hipRoof(cx, cz, w, d, ry + 0.4, opt.rise || d * 0.32, roof, { over: 0.5, minW: w * 0.5, minD: 0.6 })
    : b.gableRoof(cx - w / 2 - 0.2, cx + w / 2 + 0.2, cz - d / 2, cz + d / 2, ry + 0.4, opt.rise || d * 0.32, roof, { over: 0.5 })
  // 屋脊
  b.box(cx - w / 2 - 0.2, top, cz - 0.35, cx + w / 2 + 0.2, top + 0.6, cz + 0.35, opt.ridge || 0x5a6066, { solid: false })
  return top + 0.6
}
