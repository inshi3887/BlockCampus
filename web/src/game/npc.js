// NPC 路人系统：随机生成上班族/学生/老人/游客/小孩/街坊，走路、聊天、拍照、买东西、等公交
import * as THREE from 'three'
import { Character, makeSkinCanvas, npcAppearance } from './character.js'
import { terrainHeight, isWater, walkableWater, roadAt, districtAt, isBridge, BRIDGE_Y } from './geo.js'
import { NPC_TYPES, SURNAMES, NICK, DIALOG, WEATHER_LINES, LANDMARK_LINES } from './data.js'
import { mulberry32, pick, clamp } from './util.js'

const skinCache = new Map()
function getSkin(type, variant) {
  const k = type + variant
  if (!skinCache.has(k)) {
    const ap = npcAppearance(type, variant * 7919 + type.length * 131)
    skinCache.set(k, { canvas: makeSkinCanvas(ap.params), ap })
  }
  return skinCache.get(k)
}

function bubbleSprite(text) {
  const c = document.createElement('canvas')
  const g = c.getContext('2d')
  g.font = 'bold 28px "Microsoft YaHei",sans-serif'
  const w = Math.min(520, g.measureText(text).width + 30)
  c.width = w
  c.height = 50
  g.fillStyle = 'rgba(255,255,255,0.92)'
  g.fillRect(0, 0, w, 42)
  g.fillRect(w / 2 - 6, 42, 12, 8)
  g.strokeStyle = '#333'
  g.lineWidth = 3
  g.strokeRect(1.5, 1.5, w - 3, 39)
  g.font = 'bold 26px "Microsoft YaHei",sans-serif'
  g.fillStyle = '#222'
  g.textBaseline = 'middle'
  g.fillText(text.length > 18 ? text.slice(0, 17) + '…' : text, 15, 22)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: true, transparent: true }))
  s.scale.set(w / 50 * 0.55, 0.55, 1)
  return s
}

export class NPCManager {
  constructor(scene, world, game) {
    this.scene = scene
    this.world = world
    this.game = game
    this.list = []
    this.max = 55
    this.crowds = []
    this.rng = mulberry32(12345)
    this.spawnTimer = 0
    this._tmp = []
    this.uid = 0
  }
  addCrowd(c) {
    this.crowds.push(c)
  }
  removeCrowds(owner) {
    this.crowds = this.crowds.filter((c) => c.owner !== owner)
  }
  groundAt(x, z, y) {
    let g = terrainHeight(x, z)
    if (isBridge(x, z)) g = Math.max(g, BRIDGE_Y)
    const s = this.world.supportAt(x, z, y + 1.05, 0.25)
    return Math.max(g, s)
  }
  free(x, z, y) {
    if (!walkableWater(x, z)) return false
    if (terrainHeight(x, z) > y + 1.05) return false
    const boxes = this.world.query(x - 0.3, z - 0.3, x + 0.3, z + 0.3, this._tmp)
    for (const b of boxes) if (b.y1 > y + 1.05 && b.y0 < y + 1.7) return false
    return true
  }
  chooseType(x, z, nearCrowd) {
    const d = districtAt(x, z)
    const night = this.game.sky.night > 0.5
    const w = { office: 3, student: 2, elder: 2, tourist: 3, kid: 1, local: 3 }
    if (d === 'tianhe') { w.office = 7; w.elder = 1 }
    if (d === 'liwan' || d === 'yuexiu') { w.elder = 4; w.local = 4 }
    if (nearCrowd) w.tourist += 4
    if (night) { w.kid = 0.2; w.elder = 0.6; w.student *= 0.5 }
    const h = this.game.sky.hour
    if (h > 7 && h < 9.5) w.office += 3
    let sum = 0
    for (const k in w) sum += w[k]
    let r = this.rng() * sum
    for (const k in w) {
      r -= w[k]
      if (r <= 0) return k
    }
    return 'local'
  }
  spawnOne(px, pz) {
    const r = this.rng
    let x, z, crowd = null
    const near = this.crowds.filter((c) => Math.hypot(c.x - px, c.z - pz) < 170 + Math.max(c.rx, c.rz))
    if (near.length && r() < 0.7) {
      crowd = pick(r, near)
      x = crowd.x + (r() * 2 - 1) * crowd.rx
      z = crowd.z + (r() * 2 - 1) * crowd.rz
    } else {
      const a = r() * Math.PI * 2, d = 30 + r() * 110
      x = px + Math.cos(a) * d
      z = pz + Math.sin(a) * d
      const road = roadAt(x, z, 8)
      if (road && !road.line.ped) {
        const s = road.seg
        const dx = s.bx - s.ax, dz = s.bz - s.az
        const L = Math.hypot(dx, dz) || 1
        const nx = -dz / L, nz = dx / L
        const t = clamp(((x - s.ax) * dx + (z - s.az) * dz) / (L * L), 0, 1)
        const side = r() < 0.5 ? 1 : -1
        x = s.ax + dx * t + nx * (road.hw - 8 + 1.2) * side
        z = s.az + dz * t + nz * (road.hw - 8 + 1.2) * side
      }
    }
    const dist = Math.hypot(x - px, z - pz)
    if (dist < 18 || dist > 190) return
    const y = this.groundAt(x, z, 400)
    if (y > 60 && !crowd) return
    if (!this.free(x, z, y) || isWater(x, z)) return
    const type = this.chooseType(x, z, !!crowd)
    const variant = Math.floor(r() * 6)
    const sk = getSkin(type, variant)
    const ch = new Character(sk.canvas, { accessories: sk.ap.accessories, scale: sk.ap.scale })
    ch.group.position.set(x, y, z)
    ch.showAccessory('camera', type === 'tourist')
    this.scene.add(ch.group)
    const nameBase = pick(r, SURNAMES)
    const npc = {
      id: ++this.uid,
      type,
      name: type === 'tourist' ? '游客' + nameBase + pick(r, ['先生', '小姐', '同学']) : nameBase + pick(r, NICK[type] || ['师傅']),
      typeName: NPC_TYPES[type].name,
      ch,
      x, y, z,
      yaw: r() * Math.PI * 2,
      state: 'idle',
      timer: 1 + r() * 3,
      target: null,
      speed: type === 'kid' ? 2.6 : type === 'elder' ? 1.2 : 1.8 + r() * 0.6,
      crowd,
      talked: false,
      bubble: null,
      bubbleT: 0
    }
    this.list.push(npc)
  }
  despawn(n) {
    this.scene.remove(n.ch.group)
    if (n.bubble) n.ch.group.remove(n.bubble)
    n.ch.dispose()
    const i = this.list.indexOf(n)
    if (i >= 0) this.list.splice(i, 1)
  }
  clear() {
    for (const n of this.list.slice()) this.despawn(n)
  }
  pickState(n) {
    const r = this.rng
    const weather = this.game.sky.weather
    const x = r()
    if (weather === 'typhoon') {
      n.state = 'walk'
      n.target = this.randomTarget(n, 40)
      return
    }
    if (x < 0.5) {
      n.state = 'walk'
      n.target = this.randomTarget(n, n.crowd ? 0 : 35)
      n.timer = 20
    } else if (x < 0.65 && weather !== 'rain') {
      // 找附近的 NPC 聊天
      const other = this.list.find((o) => o !== n && o.state !== 'chat' && Math.hypot(o.x - n.x, o.z - n.z) < 6)
      if (other) {
        n.state = other.state = 'chat'
        n.partner = other
        other.partner = n
        n.timer = other.timer = 6 + r() * 8
        this.showBubble(n, pick(r, DIALOG[n.type]))
      } else {
        n.state = 'idle'
        n.timer = 2 + r() * 3
      }
    } else if (x < 0.78 && (n.type === 'tourist' || r() < 0.3)) {
      n.state = 'photo'
      n.timer = 3 + r() * 3
      const lm = this.game.landmarks.nearest(n.x, n.z, 400)
      if (lm) n.yaw = Math.atan2(lm.x - n.x, lm.z - n.z)
    } else if (x < 0.86) {
      const shop = this.game.interact.nearestOfType(n.x, n.z, 'shop', 50)
      if (shop) {
        n.state = 'walk'
        n.target = { x: shop.x + (r() - 0.5) * 3, z: shop.z + (r() - 0.5) * 3 }
        n.after = 'shop'
        n.timer = 25
      } else {
        n.state = 'idle'
        n.timer = 2
      }
    } else if (x < 0.93) {
      const stop = this.game.transport.nearestStop(n.x, n.z, 70)
      if (stop) {
        n.state = 'walk'
        n.target = { x: stop.wx + (r() - 0.5) * 4, z: stop.wz + (r() - 0.5) * 2 }
        n.after = 'bus'
        n.busStop = stop
        n.timer = 40
      } else {
        n.state = n.type === 'office' ? 'phone' : 'idle'
        n.timer = 3 + r() * 4
      }
    } else {
      n.state = n.type === 'office' || n.type === 'student' ? 'phone' : 'idle'
      n.timer = 3 + r() * 5
    }
  }
  randomTarget(n, range) {
    const r = this.rng
    if (n.crowd && r() < 0.8) {
      const c = n.crowd
      return { x: c.x + (r() * 2 - 1) * c.rx, z: c.z + (r() * 2 - 1) * c.rz }
    }
    // 沿当前朝向附近
    const a = n.yaw + (r() - 0.5) * 1.5
    const d = 10 + r() * (range || 30)
    return { x: n.x + Math.sin(a) * d, z: n.z + Math.cos(a) * d }
  }
  showBubble(n, text) {
    if (n.bubble) n.ch.group.remove(n.bubble)
    n.bubble = bubbleSprite(text)
    n.bubble.position.y = 2.5 * n.ch.scale + 0.3
    n.ch.group.add(n.bubble)
    n.bubbleT = 4
  }
  // 与玩家对话
  talkLine(n) {
    const r = this.rng
    const lm = this.game.landmarks.nearest(n.x, n.z, 200)
    const w = this.game.sky.weather
    const opts = [...DIALOG[n.type]]
    if (lm && LANDMARK_LINES[lm.def.id]) opts.push(...LANDMARK_LINES[lm.def.id], ...LANDMARK_LINES[lm.def.id])
    if (w === 'rain' || w === 'typhoon') opts.push(...WEATHER_LINES[w], ...WEATHER_LINES[w])
    if (this.game.sky.night > 0.5) opts.push(...WEATHER_LINES.night)
    return pick(r, opts)
  }
  update(dt, player) {
    const px = player.pos.x, pz = player.pos.z
    const weather = this.game.sky.weather
    let max = this.max
    if (weather === 'rain') max = Math.floor(max * 0.6)
    if (weather === 'typhoon') max = Math.floor(max * 0.15)
    if (this.game.sky.night > 0.7) max = Math.floor(max * 0.75)
    if (player.pos.y > 60) max = Math.floor(max * 0.3)
    this.spawnTimer -= dt
    if (this.list.length < max && this.spawnTimer <= 0) {
      for (let i = 0; i < 3 && this.list.length < max; i++) this.spawnOne(px, pz)
      this.spawnTimer = 0.15
    }
    const raining = weather === 'rain' || weather === 'typhoon'
    for (const n of this.list.slice()) {
      const d = Math.hypot(n.x - px, n.z - pz)
      if (d > 230 || (this.list.length > max + 5 && d > 60)) {
        this.despawn(n)
        continue
      }
      if (n.talkingToPlayer) {
        n.yaw = Math.atan2(px - n.x, pz - n.z)
        n.ch.setAnim('talk')
        n.ch.update(dt, 0)
        this.sync(n)
        continue
      }
      n.timer -= dt
      let speed = 0
      if (n.state === 'walk' && n.target) {
        const dx = n.target.x - n.x, dz = n.target.z - n.z
        const L = Math.hypot(dx, dz)
        const sp = n.speed * (raining ? 1.5 : 1) * (weather === 'typhoon' ? 1.6 : 1)
        if (L < 0.6 || n.timer < 0) {
          n.target = null
          if (n.after === 'shop') {
            n.state = 'shop'
            n.timer = 4 + this.rng() * 4
          } else if (n.after === 'bus') {
            n.state = 'bus'
            n.timer = 60
          } else {
            n.state = 'idle'
            n.timer = 1 + this.rng() * 3
          }
          n.after = null
        } else {
          const ny = Math.atan2(dx, dz)
          let dy = ny - n.yaw
          dy = Math.atan2(Math.sin(dy), Math.cos(dy))
          n.yaw += dy * Math.min(1, dt * 6)
          const st = Math.min(L, sp * dt)
          const nx = n.x + Math.sin(n.yaw) * st, nz = n.z + Math.cos(n.yaw) * st
          // 避让玩家
          const pdx = nx - px, pdz = nz - pz
          if (pdx * pdx + pdz * pdz < 0.8 && d < 3) {
            n.timer = Math.min(n.timer, 0.5)
          } else if (this.free(nx, nz, n.y)) {
            n.x = nx
            n.z = nz
            speed = sp
            const g = this.groundAt(n.x, n.z, n.y)
            n.y += (g - n.y) * Math.min(1, dt * 12)
          } else {
            n.target = this.randomTarget(n, 20)
            n.yaw += Math.PI * (0.5 + this.rng())
          }
        }
      } else if (n.timer <= 0) {
        if (n.state === 'chat' && n.partner) {
          n.partner.state = 'idle'
          n.partner.timer = 1
          n.partner.partner = null
          n.partner = null
        }
        if (n.state === 'bus') {
          n.state = 'idle'
          n.busStop = null
        }
        this.pickState(n)
      }
      if (n.state === 'chat' && n.partner) n.yaw = Math.atan2(n.partner.x - n.x, n.partner.z - n.z)
      if (n.state === 'bus' && n.busStop && this.game.transport.busAt(n.busStop)) {
        // 上车离开
        this.despawn(n)
        continue
      }
      const anim = n.state === 'chat' ? 'talk' : n.state === 'photo' ? 'photo' : n.state === 'shop' ? 'shop' : n.state === 'phone' ? 'phone' : raining ? 'umbrella' : 'idle'
      n.ch.setAnim(anim)
      n.ch.showAccessory('umbrella', raining)
      if (d < 90) n.ch.update(dt, speed)
      if (n.bubble) {
        n.bubbleT -= dt
        if (n.bubbleT <= 0) {
          n.ch.group.remove(n.bubble)
          n.bubble.material.map.dispose()
          n.bubble = null
        }
      } else if (n.state === 'chat' && this.rng() < dt * 0.25 && d < 40) this.showBubble(n, pick(this.rng, DIALOG[n.type]))
      this.sync(n)
    }
  }
  sync(n) {
    n.ch.group.position.set(n.x, n.y, n.z)
    n.ch.group.rotation.y = n.yaw
  }
  nearestTo(x, z, r) {
    let best = null, bd = r
    for (const n of this.list) {
      const d = Math.hypot(n.x - x, n.z - z)
      if (d < bd) {
        bd = d
        best = n
      }
    }
    return best
  }
}
