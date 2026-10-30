// 程序化城市：方块地形 + 分区建筑 + 行道树（分块加载）
import * as THREE from 'three'
import { Builder, disposeGroup } from './builder.js'
import { terrainHeight, isWater, roadAt, riverAt, districtAt, isPark, project, unproject } from './geo.js'
import { hash2, mulberry32 } from './util.js'
import { getMaterials } from './materials.js'
import { kapok, roundTree, palm, pine, banyan, lamp } from './landmarks/common.js'

export const CHUNK = 240
const CELL = 4
const LOT = 24

// 区域风格
const ZJXC = project(23.1215, 113.326) // 珠江新城核心
const TIANHE_N = project(23.142, 113.33)
const PAZHOU = project(23.099, 113.37)

function profileAt(x, z, dist) {
  const d = districtAt(x, z)
  const dz = Math.hypot(x - ZJXC.x, z - ZJXC.z)
  const d0 = districtAt(x, z)
  if (dz < 400 && d0 === 'tianhe') return { type: 'cbd', dens: 0.68, hmin: 40, hmax: 135 }
  if (Math.hypot(x - TIANHE_N.x, z - TIANHE_N.z) < 420) return { type: 'office', dens: 0.8, hmin: 25, hmax: 80 }
  if (Math.hypot(x - PAZHOU.x, z - PAZHOU.z) < 350) return { type: 'office', dens: 0.6, hmin: 20, hmax: 70 }
  const far = dist > 2600
  switch (d) {
    case 'tianhe': return { type: 'resi', dens: 0.75, hmin: 18, hmax: 55 }
    case 'yuexiu': return { type: 'old', dens: 0.85, hmin: 6, hmax: 24 }
    case 'liwan': return { type: 'old', dens: 0.85, hmin: 5, hmax: 16 }
    case 'haizhu': return { type: 'resi', dens: 0.75, hmin: 14, hmax: 45 }
    case 'baiyun': return { type: 'resi', dens: 0.55, hmin: 10, hmax: 36 }
    case 'panyu': return far ? { type: 'village', dens: 0.35, hmin: 4, hmax: 10 } : { type: 'resi', dens: 0.5, hmin: 16, hmax: 50 }
    case 'nansha': return { type: 'village', dens: 0.3, hmin: 4, hmax: 12 }
    case 'huangpu': return { type: 'resi', dens: 0.45, hmin: 10, hmax: 40 }
    default: return { type: 'resi', dens: 0.5, hmin: 10, hmax: 30 }
  }
}

const WALL_OLD = [0xd8cfc0, 0xc9b9a0, 0xe0d6c4, 0xb8a890, 0xd0c0b0, 0xa8988a, 0xe4dccc, 0xc0a890]
const WALL_RESI = [0xe8e4dc, 0xd8d0c4, 0xc8ccd0, 0xe0d8c8, 0xd4c8b8, 0xf0ece4, 0xb8c0c8, 0xe8dcc8]
const GLASS = [0x8ab0c8, 0x9ec4dc, 0x7a98b0, 0xb0c8d8, 0x6a8aa8, 0x88a8b8]

export class CityManager {
  constructor(scene, world, exclusions) {
    this.scene = scene
    this.world = world
    this.excl = exclusions
    this.chunks = new Map()
    this.queue = []
    this.viewR = 1250
    this.detailR = 560
    this.shadows = true
  }
  excluded(x, z, pad = 0) {
    for (const e of this.excl) {
      if (e.r != null) {
        if ((x - e.x) ** 2 + (z - e.z) ** 2 < (e.r + pad) ** 2) return e
      } else if (Math.abs(x - e.x) < e.hw + pad && Math.abs(z - e.z) < e.hd + pad) return e
    }
    return null
  }
  update(px, pz, maxBuild = 1) {
    const r = Math.ceil(this.viewR / CHUNK)
    const ccx = Math.floor(px / CHUNK), ccz = Math.floor(pz / CHUNK)
    const want = []
    for (let i = -r; i <= r; i++)
      for (let j = -r; j <= r; j++) {
        const cx = ccx + i, cz = ccz + j
        const mx = (cx + 0.5) * CHUNK, mz = (cz + 0.5) * CHUNK
        const d = Math.hypot(mx - px, mz - pz)
        if (d > this.viewR + CHUNK * 0.7) continue
        const key = cx + ',' + cz
        const detail = d < this.detailR
        const ch = this.chunks.get(key)
        if (!ch || (detail && !ch.detail)) want.push({ cx, cz, key, d, detail })
      }
    want.sort((a, b) => a.d - b.d)
    let built = 0
    const t0 = performance.now()
    for (const w of want) {
      if (built >= maxBuild && performance.now() - t0 > 6) break
      const old = this.chunks.get(w.key)
      if (old) this.disposeChunk(w.key, old)
      this.chunks.set(w.key, this.buildChunk(w.cx, w.cz, w.detail))
      built++
    }
    for (const [key, ch] of this.chunks) {
      const mx = (ch.cx + 0.5) * CHUNK, mz = (ch.cz + 0.5) * CHUNK
      if (Math.hypot(mx - px, mz - pz) > this.viewR + CHUNK * 1.5) this.disposeChunk(key, ch)
    }
    return want.length - built
  }
  disposeChunk(key, ch) {
    disposeGroup(ch.group)
    this.world.removeOwner('chunk:' + key)
    this.chunks.delete(key)
  }
  buildChunk(cx, cz, detail) {
    const key = cx + ',' + cz
    const owner = 'chunk:' + key
    const x0 = cx * CHUNK, z0 = cz * CHUNK
    const group = new THREE.Group()
    group.add(this.buildTerrain(x0, z0, owner))
    const b = new Builder(0, 0, 0, 0, this.world, owner)
    this.buildLots(b, x0, z0, detail)
    if (detail) this.buildStreets(b, x0, z0)
    group.add(b.build(this.shadows))
    this.scene.add(group)
    return { cx, cz, group, detail }
  }
  buildTerrain(x0, z0, owner) {
    const N = CHUNK / CELL
    const H = new Int16Array((N + 2) * (N + 2))
    const W = new Uint8Array((N + 2) * (N + 2))
    let flat = true
    for (let i = -1; i <= N; i++)
      for (let j = -1; j <= N; j++) {
        const x = x0 + (i + 0.5) * CELL, z = z0 + (j + 0.5) * CELL
        const w = isWater(x, z)
        let h = w ? -3 : terrainHeight(x, z)
        const k = (i + 1) * (N + 2) + (j + 1)
        H[k] = h
        W[k] = w ? 1 : 0
        if (h !== 0) flat = false
      }
    const b = new Builder(0, 0, 0, 0, null)
    b.jitter = false
    if (flat) {
      const g = isPark(x0 + CHUNK / 2, z0 + CHUNK / 2)
      b.box(x0, -2, z0, x0 + CHUNK, 0, z0 + CHUNK, g ? 0x6aa84a : 0x9a968c, { mat: g ? 'grass' : 'stone', skip: 0b111011 })
    } else {
      const idx = (i, j) => (i + 1) * (N + 2) + (j + 1)
      for (let i = 0; i < N; i++)
        for (let j = 0; j < N; j++) {
          const k = idx(i, j)
          const h = H[k]
          const x = x0 + i * CELL, z = z0 + j * CELL
          const cxw = x + CELL / 2, czw = z + CELL / 2
          let col, side, mat
          if (W[k]) {
            col = 0x6a6a52
            side = 0x5a5a48
            mat = 'stone'
          } else if (h >= 2) {
            const r = hash2(i + x0, j + z0, 5)
            col = h > 110 && r < 0.4 ? 0x8a8a84 : r < 0.1 ? 0x4f8a34 : 0x5f9a3e
            side = 0x7a5a3a
            mat = 'grass'
          } else {
            const nearW = W[idx(i - 1, j)] || W[idx(i + 1, j)] || W[idx(i, j - 1)] || W[idx(i, j + 1)]
            if (nearW) { col = 0x8a8478; mat = 'stone' } else if (isPark(cxw, czw)) { col = 0x6aa84a; mat = 'grass' } else { col = 0x9a968c; mat = 'stone' }
            side = 0x7a7468
          }
          b.box(x, h - 1, z, x + CELL, h, z + CELL, col, { mat, solid: false, skip: 0b001000 | 0b111011 })
          // 侧面：仅向较低邻格
          const nb = [[1, 0, 0], [-1, 0, 1], [0, 1, 4], [0, -1, 5]]
          for (const [di, dj, f] of nb) {
            const hn = H[idx(i + di, j + dj)]
            if (hn < h) {
              const fx0 = di === 1 ? x + CELL : x, fz0 = dj === 1 ? z + CELL : z
              if (di) b.box(fx0 - 0.001, hn, z, fx0 + 0.001, h, z + CELL, side, { mat: 'block', solid: false, skip: ~(1 << f) & 63 })
              else b.box(x, hn, fz0 - 0.001, x + CELL, h, fz0 + 0.001, side, { mat: 'block', solid: false, skip: ~(1 << f) & 63 })
            }
          }
        }
    }
    const g = b.build(false)
    g.traverse((o) => {
      if (o.isMesh) {
        o.receiveShadow = this.shadows
        o.castShadow = false
      }
    })
    return g
  }
  buildLots(b, x0, z0, detail) {
    const n = CHUNK / LOT
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const cx = x0 + (i + 0.5) * LOT, cz = z0 + (j + 0.5) * LOT
        const rnd = mulberry32(Math.floor(hash2(Math.floor(cx), Math.floor(cz), 77) * 1e9))
        const dist = Math.hypot(cx, cz)
        const h0 = terrainHeight(cx, cz)
        if (this.excluded(cx, cz, LOT * 0.5)) continue
        let wet = false
        for (const [dx, dz] of [[0, 0], [-10, -10], [10, -10], [-10, 10], [10, 10]]) if (isWater(cx + dx, cz + dz)) wet = true
        if (wet) continue
        if (roadAt(cx, cz, LOT * 0.5 + 1)) {
          continue
        }
        if (h0 >= 2) {
          // 山林
          if (!detail && rnd() < 0.5) continue
          const k = 2 + Math.floor(rnd() * 3)
          for (let t = 0; t < k; t++) {
            const tx = cx + (rnd() - 0.5) * LOT * 0.8, tz = cz + (rnd() - 0.5) * LOT * 0.8
            const th = terrainHeight(tx, tz)
            if (th < 1) continue
            if (rnd() < 0.5) pine(b, tx, th, tz, 1 + rnd() * 0.6)
            else roundTree(b, tx, th, tz, 1.1 + rnd() * 0.6, rnd() < 0.5 ? 0x3d7a34 : 0x4a8a3a)
          }
          continue
        }
        if (isPark(cx, cz)) {
          if (detail && rnd() < 0.7) {
            const tx = cx + (rnd() - 0.5) * 12, tz = cz + (rnd() - 0.5) * 12
            if (rnd() < 0.3) kapok(b, tx, 0, tz, 0.9)
            else banyan(b, tx, 0, tz, 0.8, Math.floor(rnd() * 99))
          }
          continue
        }
        const p = profileAt(cx, cz, dist)
        if (rnd() > p.dens) {
          if (detail && rnd() < 0.5) {
            b.box(cx - 9, 0, cz - 9, cx + 9, 0.3, cz + 9, 0x6aa84a, { mat: 'grass', solid: false })
            roundTree(b, cx + (rnd() - 0.5) * 8, 0.3, cz + (rnd() - 0.5) * 8, 0.9)
          }
          continue
        }
        this.building(b, cx, cz, p, rnd, detail)
      }
  }
  building(b, cx, cz, p, rnd, detail) {
    const w = 10 + Math.floor(rnd() * 9), d = 10 + Math.floor(rnd() * 9)
    const ox = cx + (rnd() - 0.5) * (LOT - w - 3), oz = cz + (rnd() - 0.5) * (LOT - d - 3)
    const x0 = ox - w / 2, x1 = ox + w / 2, z0 = oz - d / 2, z1 = oz + d / 2
    let h = Math.round(p.hmin + Math.pow(rnd(), 1.6) * (p.hmax - p.hmin))
    if (p.type === 'cbd') {
      const col = GLASS[Math.floor(rnd() * GLASS.length)]
      b.box(x0 - 1, 0, z0 - 1, x1 + 1, 6, z1 + 1, 0xb8bcc0, 'window')
      const style = rnd()
      if (style < 0.35) {
        const h1 = Math.round(h * 0.7)
        b.box(x0, 6, z0, x1, h1, z1, col, 'curtain')
        b.box(x0 + 1.5, h1, z0 + 1.5, x1 - 1.5, h, z1 - 1.5, col, 'curtain')
      } else if (style < 0.6) {
        b.prism(ox, oz, 6, h, w / 2, d / 2, 8, col, { mat: 'curtain', rot: Math.PI / 8 })
      } else {
        b.box(x0, 6, z0, x1, h, z1, col, 'curtain')
        for (let k = x0 + 2; k < x1; k += 3) b.box(k - 0.2, 6, z1, k + 0.2, h, z1 + 0.3, 0xe8ecf0, { solid: false })
      }
      b.box(x0 + 2, h, z0 + 2, x1 - 2, h + 2, z1 - 2, 0xd0d4d8)
      if (rnd() < 0.5) b.boxC(ox, h + 2, oz, 0.3, 6, 0.3, 0xdddddd, { solid: false }), b.boxC(ox, h + 8, oz, 0.6, 0.6, 0.6, 0xff3030, 'lamp')
      return
    }
    if (p.type === 'office') {
      const col = GLASS[Math.floor(rnd() * GLASS.length)]
      b.box(x0, 0, z0, x1, h, z1, col, rnd() < 0.6 ? 'curtain' : 'window')
      b.box(x0 - 0.3, h, z0 - 0.3, x1 + 0.3, h + 1, z1 + 0.3, 0xd8d8d8)
      if (detail) this.roofStuff(b, ox, oz, w, d, h + 1, rnd)
      return
    }
    if (p.type === 'resi') {
      const col = WALL_RESI[Math.floor(rnd() * WALL_RESI.length)]
      b.box(x0, 0, z0, x1, h, z1, col, 'window')
      if (detail) {
        // 阳台横线
        for (let y = 3; y < h - 1; y += 3) {
          b.box(x0 - 0.3, y, z1, x1 + 0.3, y + 0.3, z1 + 0.6, 0xf2f2f2, { solid: false })
        }
        // 底商
        b.box(x0 - 0.2, 0, z0 - 0.2, x1 + 0.2, 4, z1 + 0.2, 0x8a8a90, { mat: 'window' })
        if (rnd() < 0.5) b.box(x0 + 1, 3, z1 + 0.2, x1 - 1, 3.8, z1 + 0.4, [0xc0392b, 0x2a6ab0, 0x2a8a4a, 0xe08a20][Math.floor(rnd() * 4)], 'neon')
      }
      b.box(x0 - 0.2, h, z0 - 0.2, x1 + 0.2, h + 0.8, z1 + 0.2, 0xb8b4ac)
      if (detail) this.roofStuff(b, ox, oz, w, d, h + 0.8, rnd)
      return
    }
    if (p.type === 'old') {
      // 老城：多栋低层并排，颜色多样
      const parts = 1 + Math.floor(rnd() * 3)
      const pw = w / parts
      for (let k = 0; k < parts; k++) {
        const hh = Math.max(4, h + Math.floor((rnd() - 0.5) * 6))
        const col = WALL_OLD[Math.floor(rnd() * WALL_OLD.length)]
        const a = x0 + k * pw, c = a + pw
        b.box(a, 0, z0, c, hh, z1, col, rnd() < 0.25 ? 'brick' : 'window')
        b.box(a - 0.1, hh, z0 - 0.1, c + 0.1, hh + 0.6, z1 + 0.1, 0x9a8a78)
        if (detail) {
          if (rnd() < 0.4) b.box(a + 0.5, hh + 0.6, z0 + 1, c - 0.5, hh + 2.2, z0 + 3, 0x7a8a7a, { solid: false })
          if (rnd() < 0.5) b.box(a + 0.5, 2.8, z1, c - 0.5, 3.4, z1 + 1.2, [0x2a6a4a, 0x8a2a1a, 0x2a4a8a][Math.floor(rnd() * 3)], { solid: false })
        }
      }
      return
    }
    // village：岭南乡村小楼 / 坡屋顶
    const col = WALL_OLD[Math.floor(rnd() * WALL_OLD.length)]
    const hh = Math.max(4, h)
    b.box(x0 + 2, 0, z0 + 2, x1 - 2, hh, z1 - 2, col, 'window')
    if (rnd() < 0.5) b.gableRoof(x0 + 2, x1 - 2, z0 + 2, z1 - 2, hh, 2.2, rnd() < 0.5 ? 0x8a4a3a : 0x5a5a60, { over: 0.4 })
    else b.box(x0 + 1.8, hh, z0 + 1.8, x1 - 1.8, hh + 0.6, z1 - 1.8, 0x9a8a78)
    if (detail && rnd() < 0.6) roundTree(b, x1 - 1, 0, z1 - 1, 0.8)
  }
  roofStuff(b, ox, oz, w, d, y, rnd) {
    if (rnd() < 0.6) b.boxC(ox + (rnd() - 0.5) * (w - 4), y, oz + (rnd() - 0.5) * (d - 4), 2, 1.4, 2, 0xa0a0a0, { solid: false })
    if (rnd() < 0.4) {
      const tx = ox + (rnd() - 0.5) * (w - 4), tz = oz + (rnd() - 0.5) * (d - 4)
      for (const [a, c] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) b.boxC(tx + a, y, tz + c, 0.15, 1.6, 0.15, 0x666666, { solid: false })
      b.prism(tx, tz, y + 1.6, y + 3.2, 1, 1, 8, 0x5a7aa0, { solid: false })
    }
    if (rnd() < 0.3) b.box(ox - w / 2 + 1, y, oz - 1, ox - w / 2 + 3, y + 1, oz + 1, 0xd0d0d0, { solid: false })
  }
  // 行道树、路灯（木棉 + 榕树，广州特色）
  buildStreets(b, x0, z0) {
    const step = 14
    for (let gx = x0 + step / 2; gx < x0 + CHUNK; gx += step)
      for (let gz = z0 + step / 2; gz < z0 + CHUNK; gz += step) {
        const r = roadAt(gx, gz, 4)
        if (!r || r.line.ped) continue
        const s = r.seg
        const dx = s.bx - s.ax, dz = s.bz - s.az
        const L = Math.hypot(dx, dz) || 1
        const nx = -dz / L, nz = dx / L
        // 投影到道路侧边
        const t = Math.max(0, Math.min(1, ((gx - s.ax) * dx + (gz - s.az) * dz) / (L * L)))
        const px = s.ax + dx * t, pz = s.az + dz * t
        const side = (gx - px) * nx + (gz - pz) * nz > 0 ? 1 : -1
        const off = r.hw - 4 + 2.6
        const tx = px + nx * off * side, tz = pz + nz * off * side
        if (isWater(tx, tz) || this.excluded(tx, tz, 2) || terrainHeight(tx, tz) > 0) continue
        if (roadAt(tx, tz, -1.5)) continue
        const hsh = hash2(Math.floor(tx), Math.floor(tz), 3)
        if (hsh < 0.18) kapok(b, tx, 0, tz, 0.75)
        else if (hsh < 0.55) roundTree(b, tx, 0, tz, 0.9, 0x3d8a3a)
        else if (hsh < 0.7) banyan(b, tx, 0, tz, 0.6, Math.floor(hsh * 100))
        else if (hsh < 0.85) lamp(b, tx, 0, tz, 5)
      }
  }
}
