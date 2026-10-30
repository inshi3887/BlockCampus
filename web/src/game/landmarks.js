// 景点管理：按距离分区加载、LOD、发现检测、交互/人群注册
import * as THREE from 'three'
import { Builder, disposeGroup } from './builder.js'
import { LANDMARKS } from './landmarks/index.js'
import { project, terrainHeight, isWater, addLandOverride, LAND_OVERRIDES } from './geo.js'

export class LandmarkManager {
  constructor(scene, world, game) {
    this.scene = scene
    this.world = world
    this.game = game
    this.items = LANDMARKS.map((def) => {
      const p = project(def.lat, def.lon)
      let x = p.x, z = p.z
      if (def.snap) {
        const [dx, dz] = { south: [0, 1], north: [0, -1], east: [1, 0], west: [-1, 0] }[def.snap]
        for (let i = 0; i < 1500; i++) {
          if (isWater(x + dx * i, z + dz * i)) {
            const k = i - (def.snapOff || 0)
            x += dx * k
            z += dz * k
            break
          }
        }
      }
      const y = def.foundation ? terrainHeight(x, z) : Math.max(0, terrainHeight(x, z))
      const rot = def.rot || 0
      return { def, x, y, z, rot, loaded: false, group: null, lodGroup: null, updates: [], dist: Infinity }
    })
    this.byId = {}
    for (const it of this.items) this.byId[it.def.id] = it
    this.loadQueue = []
  }
  exclusions() {
    return this.items
      .filter((it) => it.def.rect)
      .map((it) => ({ x: it.x, z: it.z, hw: it.def.rect[0] + 4, hd: it.def.rect[1] + 4 }))
  }
  nearest(x, z, maxR) {
    let best = null, bd = maxR
    for (const it of this.items) {
      if (it.def.hidden) continue
      const d = Math.hypot(it.x - x, it.z - z)
      if (d < bd) {
        bd = d
        best = it
      }
    }
    return best
  }
  makeCtx(it, b, group) {
    const owner = 'lm:' + it.def.id
    const game = this.game
    const self = this
    return {
      interact(o) {
        const wx = b.wx(o.x, o.z), wz = b.wz(o.x, o.z)
        game.interact.add({ ...o, x: wx, z: wz, y: b.oy + (o.y || 0), high: o.y != null, landmark: it.def.id }, owner)
      },
      add(obj) {
        group.add(obj)
      },
      onUpdate(fn) {
        it.updates.push(fn)
      },
      landOverride(x0, z0, x1, z1) {
        const a = [b.wx(x0, z0), b.wz(x0, z0)], c = [b.wx(x1, z1), b.wz(x1, z1)]
        addLandOverride(a[0], a[1], c[0], c[1])
      },
      platform(p) {
        const a = [b.wx(p.x0, p.z0), b.wz(p.x0, p.z0)], c = [b.wx(p.x1, p.z1), b.wz(p.x1, p.z1)]
        self.world.addPlatform({ type: 'rect', x0: Math.min(a[0], c[0]), z0: Math.min(a[1], c[1]), x1: Math.max(a[0], c[0]), z1: Math.max(a[1], c[1]), y: b.oy + p.y }, owner)
      },
      crowd(x, z, rx, rz, count) {
        if (count == null && rz != null) {
          count = rz
          rz = rx
        }
        game.npcs.addCrowd({ x: b.wx(x, z), z: b.wz(x, z), rx, rz: rz || rx, count: count || 6, owner })
      },
      height(x, z) {
        return Math.max(0, terrainHeight(b.wx(x, z), b.wz(x, z)) - b.oy)
      }
    }
  }
  load(it) {
    const owner = 'lm:' + it.def.id
    const b = new Builder(it.x, it.y, it.z, it.rot, this.world, owner)
    const extra = new THREE.Group()
    extra.position.set(it.x, it.y, it.z)
    extra.rotation.y = it.rot
    const ctx = this.makeCtx(it, b, extra)
    it.updates = []
    it.def.build(b, ctx)
    const g = b.build(this.game.shadows)
    g.add(extra)
    this.scene.add(g)
    it.group = g
    it.loaded = true
    if (it.lodGroup) it.lodGroup.visible = false
  }
  unload(it) {
    const owner = 'lm:' + it.def.id
    disposeGroup(it.group)
    it.group = null
    it.loaded = false
    it.updates = []
    this.world.removeOwner(owner)
    this.game.interact.removeOwner(owner)
    this.game.npcs.removeCrowds(owner)
    if (it.lodGroup) it.lodGroup.visible = true
  }
  buildLODs() {
    for (const it of this.items) {
      if (!it.def.lod) continue
      const b = new Builder(it.x, it.y, it.z, it.rot, null)
      it.def.lod(b)
      it.lodGroup = b.build(false)
      this.scene.add(it.lodGroup)
    }
  }
  update(dt, t, px, pz, night, budget = 1) {
    let built = 0
    const sorted = this.items.slice().sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))
    for (const it of sorted) {
      const d = Math.hypot(it.x - px, it.z - pz)
      it.dist = d
      const R = it.def.loadR || 750
      if (!it.loaded && d < R && built < budget) {
        this.load(it)
        built++
      } else if (it.loaded && d > R + 250) this.unload(it)
      if (it.loaded) for (const fn of it.updates) fn(dt, t, night)
    }
    return built
  }
  pending(px, pz) {
    return this.items.filter((it) => !it.loaded && Math.hypot(it.x - px, it.z - pz) < (it.def.loadR || 750)).length
  }
  setVisibleAll(v) {
    for (const it of this.items) if (it.group) it.group.visible = v
  }
  // 返回局部→世界坐标
  toWorld(id, x, y, z) {
    const it = this.byId[id]
    const c = Math.cos(it.rot), s = Math.sin(it.rot)
    return new THREE.Vector3(it.x + x * c + z * s, it.y + y, it.z - x * s + z * c)
  }
}
