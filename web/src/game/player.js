// 玩家控制器：行走/奔跑/跳跃、碰撞、第一/第三人称、自拍、乘坐载具
import * as THREE from 'three'
import { Character } from './character.js'
import { terrainHeight, walkableWater, isBridge, BRIDGE_Y, isWater } from './geo.js'
import { platformContains } from './physics.js'
import { clamp } from './util.js'

const R = 0.32
const HEIGHT = 1.8
const STEP = 1.05
const GRAV = 30

export class Player {
  constructor(scene, world, skinCanvas, accessories = []) {
    this.scene = scene
    this.world = world
    this.char = new Character(skinCanvas, { accessories })
    this.char.showAccessory('camera', false)
    scene.add(this.char.group)
    this.pos = new THREE.Vector3()
    this.vy = 0
    this.onGround = true
    this.yaw = 0
    this.modelYaw = 0
    this.camYaw = 0
    this.camPitch = 0.3
    this.camDist = 6
    this.view = 'third' // third | first | selfie
    this.speed = 0
    this.ride = null
    this.scripted = null
    this.frozen = false
    this.distance = 0
    this.fly = false
    this._tmp = []
    this.camPos = new THREE.Vector3()
    this.camTarget = new THREE.Vector3()
  }
  setSkin(canvas) {
    this.char.setSkin(canvas)
  }
  teleport(x, y, z, yaw) {
    this.pos.set(x, y, z)
    this.vy = 0
    if (yaw != null) {
      this.camYaw = yaw
      this.modelYaw = yaw + Math.PI
    }
    this.ride = null
    this.scripted = null
  }
  groundAt(x, z, feet) {
    let g = terrainHeight(x, z)
    if (isWater(x, z)) g = -3
    if (isBridge(x, z)) g = Math.max(g, BRIDGE_Y)
    const s = this.world.supportAt(x, z, feet + STEP, R)
    return Math.max(g, s)
  }
  blocked(x, z) {
    const feet = this.pos.y
    if (feet < 2.5 && !walkableWater(x, z)) {
      // 落在平台（如码头/岛屿）上则允许
      if (this.world.supportAt(x, z, feet + STEP, R) < feet - 0.5) return true
    }
    if (terrainHeight(x, z) > feet + STEP) return true
    const boxes = this.world.query(x - R, z - R, x + R, z + R, this._tmp)
    for (const b of boxes) if (b.y1 > feet + STEP && b.y0 < feet + HEIGHT - 0.1) return true
    for (const p of this.world.platforms) {
      if (!p.wall) continue
      if (Math.abs(feet - p.y) > 1.2) continue
      if (platformContains(p, this.pos.x, this.pos.z) && !platformContains(p, x, z)) return true
    }
    return false
  }
  update(dt, input, sky) {
    const look = input.consumeLook()
    const sens = 0.0026 * (this.sensitivity || 1)
    this.camYaw -= look.x * sens
    this.camPitch = clamp(this.camPitch + look.y * sens, -1.2, 1.35)
    if (input.wheel && this.view === 'third') this.camDist = clamp(this.camDist + input.wheel * 0.8, 2.5, 16)

    if (this.scripted) {
      this.scripted(dt, this)
      this.char.update(dt, 0)
      this.syncModel(dt)
      return
    }
    if (this.ride) {
      this.updateRide(dt, input)
      this.syncModel(dt)
      return
    }
    const ax = this.frozen ? { x: 0, y: 0 } : input.axis()
    const sprint = input.down('ShiftLeft') || input.down('ShiftRight') || input.joy.sprint
    const maxSp = sprint ? 15 : 7
    const fx = Math.sin(this.camYaw), fz = Math.cos(this.camYaw)
    // 相机朝向为 -forward（相机在背后），移动方向沿相机朝向
    let mx = -fx * ax.y + fz * ax.x
    let mz = -fz * ax.y - fx * ax.x
    const want = Math.hypot(mx, mz) > 0.01
    const targetSp = want ? maxSp * Math.min(1, Math.hypot(ax.x, ax.y)) : 0
    this.speed += (targetSp - this.speed) * Math.min(1, dt * 10)
    if (want) {
      const l = Math.hypot(mx, mz)
      mx /= l
      mz /= l
      this.moveDir = Math.atan2(mx, mz)
    }
    const step = this.speed * dt
    if (step > 0.0001 && this.moveDir != null) {
      const dx = Math.sin(this.moveDir) * step, dz = Math.cos(this.moveDir) * step
      // 分段移动，防止穿透
      const n = Math.ceil(step / 0.3)
      for (let i = 0; i < n; i++) {
        const sx = dx / n, sz = dz / n
        if (!this.blocked(this.pos.x + sx, this.pos.z)) this.pos.x += sx
        if (!this.blocked(this.pos.x, this.pos.z + sz)) this.pos.z += sz
        const g = this.groundAt(this.pos.x, this.pos.z, this.pos.y)
        if (this.onGround && g > this.pos.y && g <= this.pos.y + STEP) this.pos.y = g
      }
      this.distance += step
    }
    // 跳跃 / 重力
    if ((input.hit('Space') || input.joy.jump) && this.onGround && !this.frozen) {
      this.vy = 10
      this.onGround = false
      input.joy.jump = false
    }
    this.vy -= GRAV * dt
    let ny = this.pos.y + this.vy * dt
    const g = this.groundAt(this.pos.x, this.pos.z, this.pos.y)
    if (this.vy > 0) {
      const boxes = this.world.query(this.pos.x - R, this.pos.z - R, this.pos.x + R, this.pos.z + R, this._tmp)
      for (const b of boxes)
        if (b.y0 >= this.pos.y + HEIGHT - 0.05 && b.y0 < ny + HEIGHT) {
          ny = b.y0 - HEIGHT
          this.vy = 0
        }
    }
    if (ny <= g) {
      ny = g
      this.vy = 0
      this.onGround = true
    } else this.onGround = ny - g < 0.05
    this.pos.y = ny
    // 旋转平台（旋转餐厅）
    for (const p of this.world.platforms) {
      if (p.spin && Math.abs(this.pos.y - p.y) < 0.2 && platformContains(p, this.pos.x, this.pos.z)) {
        const a = p.spin * dt
        const dx = this.pos.x - p.cx, dz = this.pos.z - p.cz
        const c = Math.cos(a), s = Math.sin(a)
        const nx = p.cx + dx * c - dz * s, nz = p.cz + dx * s + dz * c
        if (platformContains(p, nx, nz)) {
          this.pos.x = nx
          this.pos.z = nz
          this.camYaw -= a
          if (this.moveDir != null) this.moveDir -= a
          this.modelYaw -= a
        }
      }
    }
    if (this.pos.y < -20) this.pos.y = this.groundAt(this.pos.x, this.pos.z, 500)
    // 雨天打伞
    const raining = sky && (sky.weather === 'rain' || sky.weather === 'typhoon')
    this.char.showAccessory('umbrella', raining && this.view !== 'selfie')
    if (this.view !== 'selfie') this.char.setAnim(raining ? 'umbrella' : 'idle')
    this.char.update(dt, this.speed)
    if (this.view === 'first') this.modelYaw = this.camYaw + Math.PI
    else if (want) {
      let d = this.moveDir - this.modelYaw
      d = Math.atan2(Math.sin(d), Math.cos(d))
      this.modelYaw += d * Math.min(1, dt * 12)
    }
    this.syncModel(dt)
  }
  updateRide(dt, input) {
    const r = this.ride
    if (r.free) {
      const ax = input.axis()
      const fx = Math.sin(this.camYaw - r.obj.rotation.y), fz = Math.cos(this.camYaw - r.obj.rotation.y)
      const mx = -fx * ax.y + fz * ax.x, mz = -fz * ax.y - fx * ax.x
      const sp = 4 * dt
      r.local.x = clamp(r.local.x + mx * sp, r.bounds[0], r.bounds[1])
      r.local.z = clamp(r.local.z + mz * sp, r.bounds[2], r.bounds[3])
      this.speed = Math.hypot(mx, mz) * 4
      if (this.speed > 0.1) this.modelYaw = Math.atan2(mx, mz) + r.obj.rotation.y
    } else this.speed = 0
    r.obj.updateMatrixWorld()
    const w = r.local.clone().applyMatrix4(r.obj.matrixWorld)
    this.pos.copy(w)
    if (!r.free) this.modelYaw = r.obj.rotation.y + (r.faceYaw || 0)
    this.char.setAnim(r.sit ? 'sit' : 'idle')
    this.char.update(dt, this.speed)
  }
  syncModel() {
    this.char.group.position.copy(this.pos)
    this.char.group.rotation.y = this.modelYaw
    this.char.group.visible = this.view !== 'first' || !!this.forceVisible
  }
  // 计算相机位置
  updateCamera(camera, dt, collide = true) {
    const eye = new THREE.Vector3(this.pos.x, this.pos.y + 1.62 * this.char.scale, this.pos.z)
    const dir = new THREE.Vector3(Math.sin(this.camYaw) * Math.cos(this.camPitch), Math.sin(this.camPitch), Math.cos(this.camYaw) * Math.cos(this.camPitch))
    if (this.view === 'first') {
      camera.position.copy(eye).addScaledVector(dir, -0.15)
      camera.lookAt(eye.clone().addScaledVector(dir, -10))
      return
    }
    if (this.view === 'selfie') {
      // 相机在玩家正前方，看向玩家
      const fy = this.modelYaw
      const f = new THREE.Vector3(Math.sin(fy), 0, Math.cos(fy))
      const d = this.selfieDist || 2.6
      const pos = eye.clone().addScaledVector(f, d)
      pos.y += 0.25 + Math.sin(this.camPitch) * 1.2
      pos.addScaledVector(new THREE.Vector3(f.z, 0, -f.x), Math.sin(this.camYaw - fy) * 1.2)
      camera.position.copy(pos)
      camera.lookAt(eye.x, eye.y - 0.1, eye.z)
      return
    }
    const target = eye.clone()
    target.y += 0.25
    let D = this.camDist
    if (collide) {
      // 简单遮挡检测：向后步进
      const stepN = Math.ceil(D / 0.5)
      for (let i = 1; i <= stepN; i++) {
        const t = (i / stepN) * D
        const p = target.clone().addScaledVector(dir, t)
        const boxes = this.world.query(p.x - 0.2, p.z - 0.2, p.x + 0.2, p.z + 0.2, this._tmp)
        let hit = terrainHeight(p.x, p.z) > p.y - 0.3
        for (const b of boxes) if (p.y > b.y0 && p.y < b.y1 + 0.2) hit = true
        if (hit) {
          D = Math.max(0.8, t - 0.4)
          break
        }
      }
    }
    this.camDistEff = this.camDistEff == null ? D : this.camDistEff + (D - this.camDistEff) * Math.min(1, dt * (D < this.camDistEff ? 20 : 4))
    camera.position.copy(target).addScaledVector(dir, this.camDistEff)
    camera.lookAt(target)
  }
}
