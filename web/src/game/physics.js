// 碰撞世界：AABB 空间哈希 + 特殊平台（椭圆/矩形楼面）
const CELL = 32

export class CollisionWorld {
  constructor() {
    this.grid = new Map()
    this.owners = new Map()
    this.platforms = []
  }
  add(b, owner = 'static') {
    b.owner = owner
    const x0 = Math.floor(b.x0 / CELL), x1 = Math.floor(b.x1 / CELL)
    const z0 = Math.floor(b.z0 / CELL), z1 = Math.floor(b.z1 / CELL)
    const keys = []
    for (let gx = x0; gx <= x1; gx++)
      for (let gz = z0; gz <= z1; gz++) {
        const k = gx * 100003 + gz
        let arr = this.grid.get(k)
        if (!arr) this.grid.set(k, (arr = []))
        arr.push(b)
        keys.push(k)
      }
    b.keys = keys
    let list = this.owners.get(owner)
    if (!list) this.owners.set(owner, (list = []))
    list.push(b)
  }
  addPlatform(p, owner = 'static') {
    p.owner = owner
    this.platforms.push(p)
  }
  removeOwner(owner) {
    const list = this.owners.get(owner)
    if (list) {
      for (const b of list)
        for (const k of b.keys) {
          const arr = this.grid.get(k)
          if (!arr) continue
          const i = arr.indexOf(b)
          if (i >= 0) arr.splice(i, 1)
          if (!arr.length) this.grid.delete(k)
        }
      this.owners.delete(owner)
    }
    this.platforms = this.platforms.filter((p) => p.owner !== owner)
  }
  query(x0, z0, x1, z1, out = []) {
    out.length = 0
    const gx0 = Math.floor(x0 / CELL), gx1 = Math.floor(x1 / CELL)
    const gz0 = Math.floor(z0 / CELL), gz1 = Math.floor(z1 / CELL)
    for (let gx = gx0; gx <= gx1; gx++)
      for (let gz = gz0; gz <= gz1; gz++) {
        const arr = this.grid.get(gx * 100003 + gz)
        if (!arr) continue
        for (const b of arr) if (b.x1 > x0 && b.x0 < x1 && b.z1 > z0 && b.z0 < z1 && out.indexOf(b) < 0) out.push(b)
      }
    return out
  }
  // 点 (x,z) 处、低于 maxY 的最高支撑面
  supportAt(x, z, maxY, r = 0.3) {
    let best = -Infinity
    const arr = this.query(x - r, z - r, x + r, z + r, this._tmp || (this._tmp = []))
    for (const b of arr) if (b.y1 <= maxY && b.y1 > best) best = b.y1
    for (const p of this.platforms) {
      if (p.y > maxY || p.y <= best) continue
      if (platformContains(p, x, z)) best = p.y
    }
    return best
  }
}

export function platformContains(p, x, z) {
  if (p.type === 'ellipse') {
    const dx = (x - p.cx) / p.rx, dz = (z - p.cz) / p.rz
    const d = dx * dx + dz * dz
    if (p.inner) {
      const ix = (x - p.cx) / p.inner.rx, iz = (z - p.cz) / p.inner.rz
      if (ix * ix + iz * iz < 1) return false
    }
    return d <= 1
  }
  return x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1
}
