// 方块建造器：在局部坐标系中堆砌方块，最终按材质合并为少量网格
import * as THREE from 'three'
import { getMaterials, signMaterial } from './materials.js'

const colorCache = new Map()
function lin(hex) {
  let c = colorCache.get(hex)
  if (!c) {
    const k = new THREE.Color().setHex(hex)
    c = [k.r, k.g, k.b]
    colorCache.set(hex, c)
  }
  return c
}

const NON_SOLID = new Set(['leaf', 'lamp', 'neon', 'glow', 'glass'])

// 6 面: [法线, 4 个角(0/1 选择 min/max)]
const FACES = [
  { n: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], uv: [2, 1] },
  { n: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], uv: [2, 1] },
  { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], uv: [0, 2] },
  { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], uv: [0, 2] },
  { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], uv: [0, 1] },
  { n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], uv: [0, 1] }
]
const SHADE = [0.86, 0.86, 1, 0.6, 0.93, 0.93]

class Bucket {
  constructor() {
    this.pos = []
    this.nor = []
    this.uv = []
    this.col = []
    this.idx = []
    this.n = 0
  }
}

export class Builder {
  constructor(ox = 0, oy = 0, oz = 0, rotY = 0, world = null, owner = 'static') {
    this.ox = ox
    this.oy = oy
    this.oz = oz
    this.rot = rotY
    this.cos = Math.cos(rotY)
    this.sin = Math.sin(rotY)
    this.world = world
    this.owner = owner
    this.buckets = {}
    this.extras = []
    this.mats = getMaterials()
    this.jitter = true
  }
  // 局部 → 世界
  wx(x, z) {
    return this.ox + x * this.cos + z * this.sin
  }
  wz(x, z) {
    return this.oz - x * this.sin + z * this.cos
  }
  toWorld(x, y, z) {
    return new THREE.Vector3(this.wx(x, z), this.oy + y, this.wz(x, z))
  }
  bucket(mat) {
    return this.buckets[mat] || (this.buckets[mat] = new Bucket())
  }
  _opt(opt) {
    if (!opt) return { mat: 'block' }
    if (typeof opt === 'string') return { mat: opt }
    return { mat: 'block', ...opt }
  }
  // 轴对齐方块（局部坐标 min/max）
  box(x0, y0, z0, x1, y1, z1, color, opt) {
    const o = this._opt(opt)
    if (x0 > x1) [x0, x1] = [x1, x0]
    if (y0 > y1) [y0, y1] = [y1, y0]
    if (z0 > z1) [z0, z1] = [z1, z0]
    const B = this.bucket(o.mat)
    const uvs = (this.mats[o.mat] || this.mats.block).uv
    let [r, g, b] = lin(color)
    if (this.jitter && o.jitter !== false) {
      const j = 1 + (Math.sin(x0 * 12.9898 + z0 * 78.233 + y0 * 37.719) * 43758.5453 % 1) * 0.06
      r *= j; g *= j; b *= j
    }
    const top = o.top != null ? lin(o.top) : null
    const mn = [x0, y0, z0], mx = [x1, y1, z1]
    const skip = o.skip || 0
    for (let f = 0; f < 6; f++) {
      if (skip & (1 << f)) continue
      const F = FACES[f]
      const base = B.n
      const nx = F.n[0] * this.cos + F.n[2] * this.sin
      const nz = -F.n[0] * this.sin + F.n[2] * this.cos
      const sh = o.flat ? 1 : SHADE[f]
      const cc = f === 2 && top ? top : [r, g, b]
      for (let k = 0; k < 4; k++) {
        const c = F.c[k]
        const lx = c[0] ? mx[0] : mn[0], ly = c[1] ? mx[1] : mn[1], lz = c[2] ? mx[2] : mn[2]
        B.pos.push(this.wx(lx, lz), this.oy + ly, this.wz(lx, lz))
        B.nor.push(nx, F.n[1], nz)
        const L = [lx, ly, lz]
        B.uv.push(L[F.uv[0]] * uvs * (F.n[0] < 0 || F.n[2] > 0 ? 1 : -1), L[F.uv[1]] * uvs)
        B.col.push(cc[0] * sh, cc[1] * sh, cc[2] * sh)
      }
      B.idx.push(base, base + 1, base + 2, base, base + 2, base + 3)
      B.n += 4
    }
    const solid = o.solid != null ? o.solid : !NON_SOLID.has(o.mat) && (x1 - x0 >= 0.45 || z1 - z0 >= 0.45) && y1 - y0 >= 0.3
    if (solid && this.world) this.collider(x0, y0, z0, x1, y1, z1)
  }
  // 以底面中心定位
  boxC(cx, y, cz, w, h, d, color, opt) {
    this.box(cx - w / 2, y, cz - d / 2, cx + w / 2, y + h, cz + d / 2, color, opt)
  }
  collider(x0, y0, z0, x1, y1, z1) {
    if (!this.world) return
    const xs = [this.wx(x0, z0), this.wx(x1, z0), this.wx(x0, z1), this.wx(x1, z1)]
    const zs = [this.wz(x0, z0), this.wz(x1, z0), this.wz(x0, z1), this.wz(x1, z1)]
    this.world.add({ x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), y0: this.oy + y0, y1: this.oy + y1 }, this.owner)
  }
  platform(p) {
    if (!this.world) return
    this.world.addPlatform(p, this.owner)
  }
  // 任意旋转的方块（中心、尺寸、欧拉角），默认不参与碰撞
  rbox(cx, cy, cz, sx, sy, sz, rx, ry, rz, color, opt) {
    const o = this._opt(opt)
    const B = this.bucket(o.mat)
    const uvs = (this.mats[o.mat] || this.mats.block).uv
    const [r, g, b] = lin(color)
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'))
    const v = new THREE.Vector3()
    const nrm = new THREE.Vector3()
    for (let f = 0; f < 6; f++) {
      const F = FACES[f]
      const base = B.n
      nrm.set(F.n[0], F.n[1], F.n[2]).applyQuaternion(q)
      const nx = nrm.x * this.cos + nrm.z * this.sin
      const nz = -nrm.x * this.sin + nrm.z * this.cos
      const sh = o.flat ? 1 : 0.75 + 0.25 * Math.max(0, nrm.y) + 0.12 * Math.abs(nrm.x)
      for (let k = 0; k < 4; k++) {
        const c = F.c[k]
        v.set((c[0] - 0.5) * sx, (c[1] - 0.5) * sy, (c[2] - 0.5) * sz).applyQuaternion(q)
        const lx = cx + v.x, ly = cy + v.y, lz = cz + v.z
        B.pos.push(this.wx(lx, lz), this.oy + ly, this.wz(lx, lz))
        B.nor.push(nx, nrm.y, nz)
        const L = [(c[0] - 0.5) * sx, (c[1] - 0.5) * sy, (c[2] - 0.5) * sz]
        B.uv.push(L[F.uv[0]] * uvs, L[F.uv[1]] * uvs)
        B.col.push(r * sh, g * sh, b * sh)
      }
      B.idx.push(base, base + 1, base + 2, base, base + 2, base + 3)
      B.n += 4
    }
    if (o.solid && this.world) {
      const h = Math.max(sx, sz) / 2
      this.collider(cx - h, cy - sy / 2, cz - h, cx + h, cy + sy / 2, cz + h)
    }
  }
  // 连接两点的细梁
  beam(ax, ay, az, bx, by, bz, t, color, opt) {
    const dx = bx - ax, dy = by - ay, dz = bz - az
    const L = Math.hypot(dx, dy, dz)
    if (L < 1e-4) return
    const o = this._opt(opt)
    const B = this.bucket(o.mat)
    const [r, g, b] = lin(color)
    const dir = new THREE.Vector3(dx / L, dy / L, dz / L)
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    const v = new THREE.Vector3(), nrm = new THREE.Vector3()
    const cx = (ax + bx) / 2, cy = (ay + by) / 2, cz = (az + bz) / 2
    const tz = o.tz || t
    for (let f = 0; f < 6; f++) {
      if (f === 2 || f === 3) {
        if (o.noCaps) continue
      }
      const F = FACES[f]
      const base = B.n
      nrm.set(F.n[0], F.n[1], F.n[2]).applyQuaternion(q)
      const nx = nrm.x * this.cos + nrm.z * this.sin
      const nz = -nrm.x * this.sin + nrm.z * this.cos
      const sh = 0.78 + 0.22 * Math.max(0, nrm.y) + 0.1 * Math.abs(nrm.x)
      for (let k = 0; k < 4; k++) {
        const c = F.c[k]
        v.set((c[0] - 0.5) * t, (c[1] - 0.5) * L, (c[2] - 0.5) * tz).applyQuaternion(q)
        const lx = cx + v.x, ly = cy + v.y, lz = cz + v.z
        B.pos.push(this.wx(lx, lz), this.oy + ly, this.wz(lx, lz))
        B.nor.push(nx, nrm.y, nz)
        B.uv.push(c[0] * 0.3, c[1] * L * 0.3)
        B.col.push(r * sh, g * sh, b * sh)
      }
      B.idx.push(base, base + 1, base + 2, base, base + 2, base + 3)
      B.n += 4
    }
  }
  // 多边形棱柱（椭圆/八角等），seg 段
  prism(cx, cz, y0, y1, rx, rz, seg, color, opt) {
    const o = this._opt(opt)
    const B = this.bucket(o.mat)
    const uvs = (this.mats[o.mat] || this.mats.block).uv
    const [r, g, b] = lin(color)
    const a0 = o.rot || 0
    const rx1 = o.rx1 != null ? o.rx1 : rx, rz1 = o.rz1 != null ? o.rz1 : rz
    const pts0 = [], pts1 = []
    for (let i = 0; i < seg; i++) {
      const a = a0 + (i / seg) * Math.PI * 2
      pts0.push([cx + Math.cos(a) * rx, cz + Math.sin(a) * rz])
      pts1.push([cx + Math.cos(a) * rx1, cz + Math.sin(a) * rz1])
    }
    let perim = 0
    for (let i = 0; i < seg; i++) {
      const p = pts0[i], q = pts0[(i + 1) % seg], p1 = pts1[i], q1 = pts1[(i + 1) % seg]
      const ex = q[0] - p[0], ez = q[1] - p[1]
      const el = Math.hypot(ex, ez)
      let nx = ez / el, nz = -ex / el
      const wnx = nx * this.cos + nz * this.sin, wnz = -nx * this.sin + nz * this.cos
      const base = B.n
      const sh = 0.82 + 0.12 * Math.abs(nx)
      const quad = [[p[0], y0, p[1]], [q[0], y0, q[1]], [q1[0], y1, q1[1]], [p1[0], y1, p1[1]]]
      const us = [perim, perim + el, perim + el, perim]
      quad.forEach((c, k) => {
        B.pos.push(this.wx(c[0], c[2]), this.oy + c[1], this.wz(c[0], c[2]))
        B.nor.push(wnx, 0, wnz)
        B.uv.push(us[k] * uvs, c[1] * uvs)
        B.col.push(r * sh, g * sh, b * sh)
      })
      perim += el
      B.idx.push(base, base + 2, base + 1, base, base + 3, base + 2)
      B.n += 4
    }
    if (!o.open) {
      const topc = o.top != null ? lin(o.top) : [r, g, b]
      for (const [yy, pts, ny] of [[y1, pts1, 1], [y0, pts0, -1]]) {
        if (ny < 0 && o.noBottom) continue
        const base = B.n
        B.pos.push(this.wx(cx, cz), this.oy + yy, this.wz(cx, cz))
        B.nor.push(0, ny, 0)
        B.uv.push(cx * uvs, cz * uvs)
        B.col.push(topc[0], topc[1], topc[2])
        for (const p of pts) {
          B.pos.push(this.wx(p[0], p[1]), this.oy + yy, this.wz(p[0], p[1]))
          B.nor.push(0, ny, 0)
          B.uv.push(p[0] * uvs, p[1] * uvs)
          B.col.push(topc[0], topc[1], topc[2])
        }
        for (let i = 0; i < seg; i++) {
          const a = base + 1 + i, c = base + 1 + ((i + 1) % seg)
          if (ny > 0) B.idx.push(base, c, a)
          else B.idx.push(base, a, c)
        }
        B.n += seg + 1
      }
    }
    if (o.solid !== false && this.world && y1 - y0 > 0.3) {
      const R = Math.max(rx, rz) * (seg <= 8 ? 0.85 : 0.8)
      this.collider(cx - R, y0, cz - R, cx + R, y1, cz + R)
    }
  }
  // 双坡阶梯屋顶（沿 x 方向的屋脊），返回屋脊高度
  gableRoof(x0, x1, z0, z1, y, rise, color, opt = {}) {
    const steps = Math.max(2, Math.round(rise / (opt.step || 0.5)))
    const sh = rise / steps
    const dz = (z1 - z0) / 2 / steps
    const over = opt.over != null ? opt.over : 0.6
    for (let i = 0; i < steps; i++) {
      const zz0 = z0 - over + dz * i + (i ? over * (i / steps) : 0)
      const zz1 = z1 + over - dz * i - (i ? over * (i / steps) : 0)
      this.box(x0 - (opt.ox || 0), y + i * sh, zz0, x1 + (opt.ox || 0), y + (i + 1) * sh, zz1, i === 0 && opt.eave ? opt.eave : color, { mat: opt.mat || 'roof', solid: opt.solid != null ? opt.solid : i === 0 })
    }
    return y + rise
  }
  // 四坡/攒尖阶梯屋顶
  hipRoof(cx, cz, w, d, y, rise, color, opt = {}) {
    const steps = Math.max(2, Math.round(rise / (opt.step || 0.5)))
    const sh = rise / steps
    const over = opt.over != null ? opt.over : 0.6
    for (let i = 0; i < steps; i++) {
      const k = 1 - i / steps
      const ww = (w + over * 2) * k + (opt.minW || 0.6) * (1 - k)
      const dd = (d + over * 2) * k + (opt.minD || 0.6) * (1 - k)
      this.boxC(cx, y + i * sh, cz, ww, sh, dd, i === 0 && opt.eave ? opt.eave : color, { mat: opt.mat || 'roof', solid: i === 0 })
    }
    return y + rise
  }
  // 文字招牌（平面），朝向局部 +z（facing 角度旋转）
  sign(text, cx, cy, cz, h, facing = 0, opts = {}) {
    const { mat, aspect } = signMaterial(text, opts)
    const w = opts.w || h * aspect
    const geo = new THREE.PlaneGeometry(w, h)
    const m = new THREE.Mesh(geo, mat)
    m.position.copy(this.toWorld(cx, cy, cz))
    m.rotation.y = this.rot + facing
    m.userData.sign = true
    this.extras.push(m)
    if (opts.back) {
      const m2 = m.clone()
      m2.rotation.y += Math.PI
      this.extras.push(m2)
    }
    return m
  }
  add(obj) {
    this.extras.push(obj)
    return obj
  }
  build(shadows = true) {
    const group = new THREE.Group()
    for (const key in this.buckets) {
      const B = this.buckets[key]
      if (!B.n) continue
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3))
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3))
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2))
      geo.setAttribute('color', new THREE.Float32BufferAttribute(B.col, 3))
      geo.setIndex(B.n > 65000 ? new THREE.Uint32BufferAttribute(B.idx, 1) : new THREE.Uint16BufferAttribute(B.idx, 1))
      geo.computeBoundingSphere()
      const mesh = new THREE.Mesh(geo, (this.mats[key] || this.mats.block).mat)
      mesh.castShadow = shadows && key !== 'glass' && key !== 'lamp' && key !== 'neon' && key !== 'glow'
      mesh.receiveShadow = shadows
      mesh.userData.matKey = key
      group.add(mesh)
    }
    for (const e of this.extras) group.add(e)
    this.buckets = {}
    this.extras = []
    return group
  }
}

export function disposeGroup(g) {
  g.traverse((o) => {
    if (o.geometry) o.geometry.dispose()
  })
  if (g.parent) g.parent.remove(g)
}
