// 交通系统：观光巴士、地铁快速传送、珠江夜游、广州塔电梯、白云索道、城市车流；交互点注册表
import * as THREE from 'three'
import { Builder, disposeGroup } from './builder.js'
import { BUS_ROUTE, METRO_STATIONS, PIERS, ROADS, cruiseRoute, WATER_Y, terrainHeight, isWater, roadAt, project } from './geo.js'
import { busShelter, metroEntrance } from './landmarks/common.js'
import { polyLength, samplePoly, mulberry32, pick, clamp, smooth } from './util.js'

// ---------------- 交互点 ----------------
export class InteractRegistry {
  constructor() {
    this.items = []
  }
  add(it, owner = 'static') {
    it.owner = owner
    this.items.push(it)
    return it
  }
  removeOwner(owner) {
    this.items = this.items.filter((i) => i.owner !== owner)
  }
  nearest(x, y, z, maxR = 6) {
    let best = null, bd = Infinity
    for (const it of this.items) {
      // 交互点高度：未指定时取所在地形高度（山顶等高处同样可用）
      if (it.y == null) it.y = terrainHeight(it.x, it.z)
      if (Math.abs(it.y - y) > 5) continue
      const d = Math.hypot(it.x - x, it.z - z)
      if (d < it.r && d < bd) {
        bd = d
        best = it
      }
    }
    return best
  }
  nearestOfType(x, z, type, maxR) {
    let best = null, bd = maxR
    for (const it of this.items) {
      if (it.type !== type || it.high) continue
      const d = Math.hypot(it.x - x, it.z - z)
      if (d < bd) {
        bd = d
        best = it
      }
    }
    return best
  }
}

function busModel() {
  const b = new Builder()
  // 红色敞篷双层观光巴士（局部 +z 为车头）
  b.box(-1.4, 0.5, -6, 1.4, 2.9, 6, 0xc8282a, { solid: false })
  b.box(-1.42, 1.3, -5.5, 1.42, 2.5, 5.2, 0x2a3a4a, { mat: 'window', solid: false })
  b.box(-1.3, 1.3, 5.95, 1.3, 2.6, 6.05, 0x2a3a4a, { mat: 'window', solid: false })
  b.box(-1.45, 0.5, -6.02, 1.45, 1.0, 6.02, 0xf2f2f2, { solid: false })
  // 上层敞篷：栏板 + 座椅
  b.box(-1.4, 2.9, -6, -1.25, 3.9, 6, 0xc8282a, { solid: false })
  b.box(1.25, 2.9, -6, 1.4, 3.9, 6, 0xc8282a, { solid: false })
  b.box(-1.4, 2.9, 5.85, 1.4, 4.0, 6, 0xc8282a, { solid: false })
  b.box(-1.4, 2.9, -6, 1.4, 3.9, -5.85, 0xc8282a, { solid: false })
  b.box(-1.3, 3.9, 5.6, 1.3, 4.3, 6, 0x9fc6e0, { mat: 'glass', solid: false })
  for (let z = -5; z <= 4.5; z += 1.5) for (const x of [-0.7, 0.7]) {
    b.box(x - 0.45, 2.9, z - 0.3, x + 0.45, 3.35, z + 0.3, 0x2a2a6a, { solid: false })
    b.box(x - 0.45, 3.35, z - 0.35, x + 0.45, 3.9, z - 0.25, 0x2a2a6a, { solid: false })
  }
  for (const z of [-4, 4]) for (const x of [-1.25, 1.25]) b.box(x - 0.25, 0, z - 0.6, x + 0.25, 1.1, z + 0.6, 0x1a1a1a, { solid: false })
  b.box(-1.0, 0.9, 6.02, -0.5, 1.2, 6.1, 0xfff2c0, { mat: 'lamp', solid: false })
  b.box(0.5, 0.9, 6.02, 1.0, 1.2, 6.1, 0xfff2c0, { mat: 'lamp', solid: false })
  b.sign('广州观光巴士 1路', 1.46, 3.4, 0, 0.45, Math.PI / 2, { bg: '#c8282a', fg: '#ffffff', px: 40 })
  b.sign('广州观光巴士 1路', -1.46, 3.4, 0, 0.45, -Math.PI / 2, { bg: '#c8282a', fg: '#ffffff', px: 40 })
  b.sign('1 广州塔⇄陈家祠', 0, 2.7, 6.06, 0.32, 0, { bg: '#111', fg: '#ffb020', px: 40, glow: true })
  return b.build()
}

function carModel(color, taxi) {
  const b = new Builder()
  b.box(-0.95, 0.35, -2.2, 0.95, 1.15, 2.2, color, { solid: false })
  b.box(-0.85, 1.15, -1.2, 0.85, 1.85, 1.0, color, { solid: false })
  b.box(-0.87, 1.2, -1.1, 0.87, 1.75, 0.9, 0x2a3a4a, { mat: 'window', solid: false })
  for (const z of [-1.4, 1.4]) for (const x of [-0.9, 0.9]) b.box(x - 0.15, 0, z - 0.4, x + 0.15, 0.7, z + 0.4, 0x111111, { solid: false })
  b.box(-0.8, 0.6, 2.2, -0.4, 0.85, 2.25, 0xfff2c0, { mat: 'lamp', solid: false })
  b.box(0.4, 0.6, 2.2, 0.8, 0.85, 2.25, 0xfff2c0, { mat: 'lamp', solid: false })
  b.box(-0.8, 0.6, -2.25, -0.4, 0.85, -2.2, 0xff3030, { mat: 'lamp', solid: false })
  b.box(0.4, 0.6, -2.25, 0.8, 0.85, -2.2, 0xff3030, { mat: 'lamp', solid: false })
  if (taxi) {
    b.box(-0.85, 0.35, -2.2, 0.85, 0.75, 2.2, 0xf2f2f2, { solid: false })
    b.box(-0.3, 1.85, -0.2, 0.3, 2.1, 0.2, 0xf2c230, { mat: 'neon', solid: false })
  }
  return b.build()
}

function cruiseModel() {
  const b = new Builder()
  // 珠江夜游船：三层白色游船 + 霓虹灯带（局部 +z 为船头）
  b.box(-4, -0.8, -14, 4, 1.2, 12, 0xf2f2f2, { solid: false })
  for (let i = 0; i < 4; i++) b.box(-4 + i * 0.9, -0.8, 12 + i * 1.2, 4 - i * 0.9, 1.2, 13.2 + i * 1.2, 0xf2f2f2, { solid: false })
  b.box(-4.05, 0.2, -14, 4.05, 0.5, 12, 0x2a5aa8, { solid: false })
  b.box(-3.6, 1.2, -12, 3.6, 4, 8, 0xe8e8e8, { mat: 'window', solid: false })
  b.box(-3.7, 4, -12.2, 3.7, 4.3, 8.2, 0xf4f4f4, { solid: false })
  b.box(-3, 4.3, -10, 3, 6.6, 4, 0xe8e8e8, { mat: 'window', solid: false })
  b.box(-3.1, 6.6, -10.2, 3.1, 6.9, 4.2, 0xf4f4f4, { solid: false })
  b.box(-1.5, 6.9, -6, 1.5, 8.4, 0, 0xe0e0e0, { mat: 'window', solid: false })
  // 霓虹
  for (const y of [1.25, 4.35, 6.95]) {
    b.box(-3.75, y, -12.3, -3.65, y + 0.12, 8.3, 0xff40a0, { mat: 'neon', solid: false })
    b.box(3.65, y, -12.3, 3.75, y + 0.12, 8.3, 0x40c0ff, { mat: 'neon', solid: false })
  }
  for (let z = -12; z <= 8; z += 2) b.boxC(3.8, 1.2, z, 0.12, 1, 0.12, 0xcccccc, { solid: false }), b.boxC(-3.8, 1.2, z, 0.12, 1, 0.12, 0xcccccc, { solid: false })
  b.sign('珠江夜游', 0, 5.4, 4.05, 0.9, 0, { bg: '#0a1a3a', fg: '#ffd76a', glow: true })
  return b.build()
}

function gondola() {
  const b = new Builder()
  b.box(-1, -2.4, -1, 1, -0.4, 1, 0xd83030, { solid: false })
  b.box(-1.02, -1.8, -0.8, 1.02, -0.8, 0.8, 0x9fc6e0, { mat: 'window', solid: false })
  b.boxC(0, -0.4, 0, 0.15, 0.6, 0.15, 0x444444, { solid: false })
  return b.build()
}

export class TransportSystem {
  constructor(scene, world, game) {
    this.scene = scene
    this.world = world
    this.game = game
    this.static = new THREE.Group()
    scene.add(this.static)
    // ---------- 巴士 ----------
    const route = BUS_ROUTE.pts
    this.busRoute = route
    this.busLen = polyLength(route)
    this.stops = BUS_ROUTE.stops.map((s) => {
      // 求站点在线路上的弧长
      let best = 0, bd = Infinity, acc = 0
      for (let i = 1; i < route.length; i++) {
        const a = route[i - 1], c = route[i]
        const L = Math.hypot(c.x - a.x, c.z - a.z)
        for (let t = 0; t <= 1; t += 0.02) {
          const x = a.x + (c.x - a.x) * t, z = a.z + (c.z - a.z) * t
          const d = Math.hypot(x - s.x, z - s.z)
          if (d < bd) {
            bd = d
            best = acc + L * t
          }
        }
        acc += L
      }
      const p = samplePoly(route, best)
      const nx = Math.cos(p.dir), nz = -Math.sin(p.dir)
      return { ...s, s: best, wx: p.x + nx * 9.5, wz: p.z + nz * 9.5, dir: p.dir }
    })
    this.bus = busModel()
    scene.add(this.bus)
    this.busS = 0
    this.busDir = 1
    this.busWait = 5
    this.busStopIdx = 0
    this.busSpeed = 24
    const sb = new Builder(0, 0, 0, 0, world, 'transport')
    for (const st of this.stops) {
      const sub = new Builder(st.wx, 0, st.wz, st.dir - Math.PI / 2, world, 'transport')
      busShelter(sub, 0, 0, 0, '观光巴士·' + st.name)
      this.static.add(sub.build())
      game.interact.add({ x: st.wx, z: st.wz, r: 4.5, type: 'bus', label: '观光巴士 · ' + st.name + '站', stop: st }, 'transport')
    }
    // ---------- 地铁 ----------
    for (const m of METRO_STATIONS) {
      const sub = new Builder(m.x, terrainHeight(m.x, m.z), m.z, 0, world, 'transport')
      metroEntrance(sub, 0, 0, m.name)
      this.static.add(sub.build())
      game.interact.add({ x: m.x, z: m.z + 2, r: 4, type: 'metro', label: '进入地铁 · ' + m.name, station: m }, 'transport')
    }
    // ---------- 夜游船 ----------
    this.cruisePath = cruiseRoute()
    this.cruiseLen = polyLength(this.cruisePath)
    this.boat = cruiseModel()
    this.boat.visible = true
    scene.add(this.boat)
    this.boatState = { s: 0, dir: 1, active: false }
    this.placeIdleBoat()
    // ---------- 车流 ----------
    this.cars = []
    this.carModels = []
    const cols = [0xf2f2f2, 0x1a1a1a, 0x9a9aa0, 0xc03030, 0x3a5a9a, 0x6a6a70, 0xe8e0d0]
    for (let i = 0; i < 8; i++) this.carModels.push({ color: cols[i % cols.length], taxi: i >= 6 })
    this.carRoads = ROADS.filter((r) => !r.ped).map((r) => ({ road: r, len: polyLength(r.pts) }))
    this.rng = mulberry32(5)
    // ---------- 电梯厢 ----------
    const eb = new Builder()
    eb.box(-1.1, 0, -1.1, 1.1, 2.6, 1.1, 0x9fc6e0, { mat: 'glass', solid: false })
    eb.box(-1.2, -0.2, -1.2, 1.2, 0, 1.2, 0xcccccc, { solid: false })
    eb.box(-1.2, 2.6, -1.2, 1.2, 2.8, 1.2, 0xcccccc, { solid: false })
    this.elevatorCab = eb.build(false)
    this.elevatorCab.visible = false
    scene.add(this.elevatorCab)
    // ---------- 索道 ----------
    this.cable = null
    this.gondolas = []
  }
  placeIdleBoat() {
    const p = samplePoly(this.cruisePath, this.cruiseLen * 0.82)
    this.boat.position.set(p.x, WATER_Y + 0.6, p.z)
    this.boat.rotation.y = p.dir
  }
  nearestStop(x, z, r) {
    let best = null, bd = r
    for (const s of this.stops) {
      const d = Math.hypot(s.wx - x, s.wz - z)
      if (d < bd) {
        bd = d
        best = s
      }
    }
    return best
  }
  busAt(stop) {
    return this.busWait > 0 && this.stops[this.busStopIdx] === stop
  }
  busETA(stop) {
    // 粗略估计
    let d = (stop.s - this.busS) * this.busDir
    if (d < 0) d = Math.abs(d) + (this.busDir > 0 ? (this.busLen - this.busS) * 2 : this.busS * 2) * 0.5
    return Math.round(d / this.busSpeed + Math.max(0, this.busWait))
  }
  updateBus(dt) {
    if (this.busWait > 0) {
      this.busWait -= dt
      if (this.busWait <= 0 && this.game.onBusDepart) this.game.onBusDepart(this.stops[this.busStopIdx])
    } else {
      const prev = this.busS
      this.busS += this.busDir * this.busSpeed * dt
      // 到站检测
      for (let i = 0; i < this.stops.length; i++) {
        const st = this.stops[i]
        const a = prev - st.s, c = this.busS - st.s
        if (a !== 0 && a * c <= 0) {
          this.busS = st.s
          this.busWait = 8
          this.busStopIdx = i
          if (i === 0) this.busDir = 1
          if (i === this.stops.length - 1) this.busDir = -1
          if (this.game.onBusArrive) this.game.onBusArrive(st)
          break
        }
      }
      if (this.busS > this.busLen) {
        this.busS = this.busLen
        this.busDir = -1
      }
      if (this.busS < 0) {
        this.busS = 0
        this.busDir = 1
      }
    }
    const p = samplePoly(this.busRoute, this.busS)
    const dir = this.busDir > 0 ? p.dir : p.dir + Math.PI
    // 右侧通行
    const nx = Math.cos(dir), nz = -Math.sin(dir)
    const tx = p.x - nx * 3.5, tz = p.z - nz * 3.5
    let y = 0.05
    const r = roadAt(tx, tz)
    if (isWater(tx, tz)) y = 0.4
    this.bus.position.set(tx, y, tz)
    let d = dir - this.bus.rotation.y
    d = Math.atan2(Math.sin(d), Math.cos(d))
    this.bus.rotation.y += d * Math.min(1, dt * 5)
  }
  updateCars(dt, px, pz) {
    const want = 26
    // 生成
    let tries = 0
    while (this.cars.length < want && tries++ < 4) {
      const cr = pick(this.rng, this.carRoads)
      const s = this.rng() * cr.len
      const p = samplePoly(cr.road.pts, s)
      const d = Math.hypot(p.x - px, p.z - pz)
      if (d > 260 || d < 40) continue
      const m = pick(this.rng, this.carModels)
      const obj = carModel(m.color, m.taxi)
      this.scene.add(obj)
      this.cars.push({ cr, s, dir: this.rng() < 0.5 ? 1 : -1, sp: 9 + this.rng() * 7, obj, lane: cr.road.w / 4 })
    }
    for (const c of this.cars.slice()) {
      const p0 = samplePoly(c.cr.road.pts, c.s)
      const d = Math.hypot(p0.x - px, p0.z - pz)
      if (d > 320 || c.s < 0 || c.s > c.cr.len) {
        disposeGroup(c.obj)
        this.cars.splice(this.cars.indexOf(c), 1)
        continue
      }
      // 礼让玩家
      const ahead = samplePoly(c.cr.road.pts, c.s + c.dir * 6)
      const dirA = c.dir > 0 ? ahead.dir : ahead.dir + Math.PI
      const nx = Math.cos(dirA), nz = -Math.sin(dirA)
      const ax = ahead.x - nx * c.lane, az = ahead.z - nz * c.lane
      const g = this.game.player
      const blockedByPlayer = Math.hypot(ax - g.pos.x, az - g.pos.z) < 3.5 && g.pos.y < 3
      const blockedByBus = Math.hypot(ax - this.bus.position.x, az - this.bus.position.z) < 6
      const target = blockedByPlayer || blockedByBus ? 0 : c.sp
      c.v = (c.v || c.sp) + (target - (c.v || c.sp)) * Math.min(1, dt * 3)
      c.s += c.dir * c.v * dt
      const p = samplePoly(c.cr.road.pts, c.s)
      const dir = c.dir > 0 ? p.dir : p.dir + Math.PI
      const lx = Math.cos(dir), lz = -Math.sin(dir)
      const x = p.x - lx * c.lane, z = p.z - lz * c.lane
      c.obj.position.set(x, isWater(x, z) ? 0.4 : 0.05, z)
      let dd = dir - c.obj.rotation.y
      dd = Math.atan2(Math.sin(dd), Math.cos(dd))
      c.obj.rotation.y += dd * Math.min(1, dt * 6)
      c.honk = blockedByPlayer
    }
  }
  // ---------- 夜游 ----------
  startCruise(pier) {
    // 找到码头在航线上的位置
    let best = 0, bd = Infinity
    for (let s = 0; s < this.cruiseLen; s += 5) {
      const p = samplePoly(this.cruisePath, s)
      const d = Math.hypot(p.x - pier.x, p.z - pier.z)
      if (d < bd) {
        bd = d
        best = s
      }
    }
    this.boatState = { active: true, s: best, start: best, dir: 1, leg: 0, t: 0 }
    const p = samplePoly(this.cruisePath, best)
    this.boat.position.set(p.x, WATER_Y + 0.6, p.z)
    this.boat.rotation.y = p.dir
    return this.boat
  }
  updateBoat(dt) {
    const b = this.boatState
    b.t = (b.t || 0) + dt
    const bob = Math.sin(b.t * 1.4) * 0.08
    if (!b.active) {
      this.boat.position.y = WATER_Y + 0.6 + bob
      return null
    }
    const sp = 22
    b.s += b.dir * sp * dt
    let done = false
    if (b.leg === 0 && b.s >= this.cruiseLen - 4) {
      b.leg = 1
      b.dir = -1
    } else if (b.leg === 1 && b.s <= 4) {
      b.leg = 2
      b.dir = 1
    } else if (b.leg === 2 && b.s >= b.start) done = true
    b.s = clamp(b.s, 0, this.cruiseLen)
    const p = samplePoly(this.cruisePath, b.s)
    const dir = b.dir > 0 ? p.dir : p.dir + Math.PI
    const nx = Math.cos(dir), nz = -Math.sin(dir)
    this.boat.position.set(p.x - nx * 7, WATER_Y + 0.6 + bob, p.z - nz * 7)
    let dd = dir - this.boat.rotation.y
    dd = Math.atan2(Math.sin(dd), Math.cos(dd))
    this.boat.rotation.y += dd * Math.min(1, dt * 1.2)
    this.boat.rotation.z = Math.sin(b.t * 0.9) * 0.01
    if (done) {
      b.active = false
      return 'done'
    }
    return b.leg
  }
  // ---------- 索道 ----------
  setupCable(a, b) {
    if (this.cable) return
    this.cableA = a
    this.cableB = b
    const g = new THREE.Group()
    const bb = new Builder()
    const N = 30
    this.cablePts = []
    for (let i = 0; i <= N; i++) {
      const t = i / N
      const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t
      const y = a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * 12
      const ground = terrainHeight(x, z)
      this.cablePts.push(new THREE.Vector3(x, Math.max(y, ground + 8), z))
    }
    for (let i = 1; i <= N; i++) {
      const p = this.cablePts[i - 1], q = this.cablePts[i]
      bb.beam(p.x, p.y, p.z, q.x, q.y, q.z, 0.12, 0x333333)
      bb.beam(p.x + 2, p.y, p.z, q.x + 2, q.y, q.z, 0.12, 0x333333)
      if (i % 6 === 0) {
        const gr = terrainHeight(q.x, q.z)
        bb.beam(q.x + 1, gr, q.z, q.x + 1, q.y + 1, q.z, 0.8, 0x8a8a8a)
        bb.beam(q.x - 0.5, q.y + 0.6, q.z, q.x + 2.5, q.y + 0.6, q.z, 0.4, 0x8a8a8a)
      }
    }
    g.add(bb.build())
    for (let i = 0; i < 8; i++) {
      const gd = gondola()
      gd.userData.u = i / 8
      g.add(gd)
      this.gondolas.push(gd)
    }
    this.cable = g
    this.scene.add(g)
  }
  cablePoint(u) {
    const P = this.cablePts
    const f = clamp(u, 0, 1) * (P.length - 1)
    const i = Math.min(P.length - 2, Math.floor(f))
    return P[i].clone().lerp(P[i + 1], f - i)
  }
  updateCable(dt) {
    if (!this.cable) return
    for (const gd of this.gondolas) {
      if (gd.userData.ridden) continue
      gd.userData.u = (gd.userData.u + dt * 0.02) % 1
      const u = gd.userData.u
      const p = this.cablePoint(u < 0.5 ? u * 2 : 2 - u * 2)
      gd.position.copy(p)
      gd.position.x += u < 0.5 ? 0 : 2
    }
  }
  update(dt, px, pz) {
    this.updateBus(dt)
    this.updateCars(dt, px, pz)
    this.updateCable(dt)
    return this.updateBoat(dt)
  }
}
