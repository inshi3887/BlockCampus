// 海珠区 & 珠江沿线：广州塔（S级）、海心沙、琶洲、中山大学、桥梁
import * as THREE from 'three'
import { C, banyan, kapok, roundTree, palm, lamp, bench, railing, paving, flowerBed, statue, modernTower } from './common.js'
import { nightUniform, getMaterials } from '../materials.js'

// ---------------- 广州塔（小蛮腰） ----------------
// 1 格 ≈ 2.5m：塔身 454m≈182 格，天线至 600m≈240 格；底部椭圆 80×60m，顶部 54×40.5m，扭转 135°
export const TOWER = {
  H: 182, MAST: 240, R0: [16, 12], R1: [10.8, 8.1], TWIST: (135 * Math.PI) / 180, N: 24,
  DECK_Y: 182.5, RESTAURANT_Y: 168, CORE: [3.0, 3.8]
}

function towerPoint(i, t) {
  const { R0, R1, TWIST, N, H } = TOWER
  const a0 = (i / N) * Math.PI * 2
  const a1 = a0 + TWIST
  const p0 = [Math.cos(a0) * R0[0], Math.sin(a0) * R0[1]]
  const p1 = [Math.cos(a1) * R1[0], Math.sin(a1) * R1[1]]
  return [p0[0] + (p1[0] - p0[0]) * t, t * H, p0[1] + (p1[1] - p0[1]) * t]
}

let towerLightMat = null
function getTowerLightMaterial() {
  if (towerLightMat) return towerLightMat
  const m = new THREE.MeshLambertMaterial({ vertexColors: true })
  m.userData.uTime = { value: 0 }
  m.userData.uBase = { value: new THREE.Vector3() }
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = m.userData.uTime
    sh.uniforms.uTowerBase = m.userData.uBase
    sh.uniforms.uNight = nightUniform
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed,1.0)).xyz;')
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vWP; uniform float uTime; uniform float uNight;
vec3 hsv2rgb(vec3 c){ vec3 p = abs(fract(c.xxx + vec3(0.,2./3.,1./3.))*6.-3.); return c.z*mix(vec3(1.),clamp(p-1.,0.,1.),c.y);}
uniform vec3 uTowerBase;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  float h = (vWP.y) / 182.0;
  float ang = atan(vWP.z - uTowerBase.z, vWP.x - uTowerBase.x);
  float mode = mod(floor(uTime / 16.0), 5.0);
  vec3 c;
  if (mode < 0.5) c = hsv2rgb(vec3(fract(h * 0.8 - uTime * 0.12), 0.85, 1.0));
  else if (mode < 1.5) c = mix(vec3(1.0,0.15,0.3), vec3(1.0,0.6,0.1), 0.5 + 0.5*sin(h*12.0 - uTime*3.0));
  else if (mode < 2.5) c = hsv2rgb(vec3(fract(ang / 6.2832 + uTime * 0.1), 0.8, 1.0)) * (0.6 + 0.4*sin(h*30.0+uTime*4.0));
  else if (mode < 3.5) c = mix(vec3(0.1,0.4,1.0), vec3(0.9,0.2,1.0), smoothstep(0.0,1.0, fract(h*2.0 - uTime*0.25)));
  else c = vec3(1.0, 0.95, 0.8) * step(0.6, fract(sin(dot(floor(vWP.xy*0.5), vec2(12.9898,78.233)) + floor(uTime*6.0)) * 43758.5453)) + vec3(0.9,0.3,0.6)*0.35;
  totalEmissiveRadiance += c * uNight * 1.6;
}`)
  }
  towerLightMat = m
  getMaterials().tower = { mat: m, uv: 1 }
  return m
}

export function updateTowerMaterial(time) {
  if (towerLightMat) towerLightMat.userData.uTime.value = time
}

export function buildCantonTower(b, ctx) {
  getTowerLightMaterial().userData.uBase.value.set(b.ox, 0, b.oz)
  const { N, H, MAST, CORE, DECK_Y, RESTAURANT_Y } = TOWER
  // 广场与裙楼（塔基入口）
  paving(b, -45, -40, 45, 32, 0, 0xc8c2b4)
  b.box(-26, 0, -22, 26, 0.6, 20, 0xd8d4cc, { mat: 'stone', solid: false })
  for (let i = 0; i < 4; i++) flowerBed(b, -40 + i * 22, 22, -30 + i * 22, 28, 0, 30 + i)
  for (let x = -40; x <= 40; x += 10) {
    palm(b, x, 0, -36, 0.9)
    lamp(b, x + 5, 0, 30)
  }
  // 塔下裙楼：围绕塔基的低矮玻璃建筑（游客中心、入口）
  b.box(-8, 0.6, 12, 8, 6, 19, 0x9fc6e0, 'curtain')
  b.box(-9, 6, 11, 9, 6.6, 20, 0xe0e0e0)
  b.sign('广州塔', 0, 7.6, 20.05, 1.6, 0, { bg: '#0a1a2a', fg: '#ff4d8d', glow: true })
  b.sign('CANTON TOWER', 0, 4.8, 19.05, 0.8, 0, { bg: '#0a1a2a', fg: '#9fe0ff', glow: true })
  // 核心筒
  b.prism(0, 0, 0.6, H + 2, CORE[0], CORE[1], 16, 0xd8d8d0, { mat: 'block' })
  // 核心筒内楼层簇（不同高度的功能层）
  const levels = [[24, 32], [80, 90], [110, 118], [150, 158], [164, 180]]
  for (const [y0, y1] of levels) {
    const t0 = y0 / H, t1 = y1 / H
    const r = (t) => {
      // 估算当前高度格网椭圆半径
      let rx = Infinity, rz = Infinity
      let mx = 0, mz = 0
      for (let i = 0; i < N; i++) {
        const p = towerPoint(i, t)
        mx = Math.max(mx, Math.abs(p[0]))
        mz = Math.max(mz, Math.abs(p[2]))
      }
      rx = mx * 0.88
      rz = mz * 0.88
      return [rx, rz]
    }
    const [ax, az] = r(t0), [bx, bz] = r(t1)
    b.prism(0, 0, y0, y1, ax, az, 20, 0x5a7890, { mat: 'curtain', rx1: bx, rz1: bz })
  }
  // 斜交网格：24 根倾斜立柱 + 环梁 + 斜撑
  const lightB = { mat: 'tower' }
  for (let i = 0; i < N; i++) {
    const a = towerPoint(i, 0), c = towerPoint(i, 1)
    b.beam(a[0], a[1], a[2], c[0], c[1], c[2], 1.1, 0xeef0f2, lightB)
    b.boxC(a[0], 0, a[2], 2.2, 2, 2.2, 0xcfcfc8)
  }
  const RINGS = 46
  for (let k = 1; k <= RINGS; k++) {
    const t = k / RINGS
    for (let i = 0; i < N; i++) {
      const p = towerPoint(i, t), q = towerPoint((i + 1) % N, t)
      b.beam(p[0], p[1], p[2], q[0], q[1], q[2], 0.5, 0xe4e6e8, lightB)
    }
  }
  // 斜撑（螺旋方向的细杆）
  for (let k = 0; k < 23; k++) {
    const t0 = (k * 2) / RINGS, t1 = (k * 2 + 2) / RINGS
    for (let i = 0; i < N; i += 2) {
      const p = towerPoint(i, t0), q = towerPoint((i + 1) % N, t1)
      b.beam(p[0], p[1], p[2], q[0], q[1], q[2], 0.3, 0xd8dade, lightB)
    }
  }
  // 顶部：旋转餐厅玻璃环、观景层、露天平台、摩天轮轨道
  const top = towerPoint(0, 1)
  const R1x = TOWER.R1[0], R1z = TOWER.R1[1]
  b.prism(0, 0, RESTAURANT_Y - 0.5, RESTAURANT_Y, R1x * 1.05, R1z * 1.05, 24, 0xcccccc)
  b.prism(0, 0, DECK_Y - 1, DECK_Y, R1x + 0.6, R1z + 0.6, 24, 0xbfc4c8, { top: 0xa8adb2 })
  // 平台护栏（玻璃）
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2, a2 = ((i + 1) / 32) * Math.PI * 2
    const r0 = [Math.cos(a) * (R1x + 0.3), Math.sin(a) * (R1z + 0.3)], r1 = [Math.cos(a2) * (R1x + 0.3), Math.sin(a2) * (R1z + 0.3)]
    b.beam(r0[0], DECK_Y + 1.2, r0[1], r1[0], DECK_Y + 1.2, r1[1], 0.15, 0xdddddd)
    b.boxC(r0[0], DECK_Y, r0[1], 0.15, 1.2, 0.15, 0xdddddd, { solid: false })
  }
  b.box(-1.5, DECK_Y, -1.5, 1.5, DECK_Y + 3, 1.5, 0xc8c8c8) // 电梯厅
  b.box(-1.6, DECK_Y + 0.2, 1.5, 1.6, DECK_Y + 2.6, 1.55, 0x9fc6e0, { mat: 'glass', solid: false })
  // 天线桅杆
  b.prism(0, 0, DECK_Y, DECK_Y + 6, 2.4, 2.4, 8, 0xd0d0d0, { rx1: 1.6, rz1: 1.6 })
  b.prism(0, 0, DECK_Y + 6, MAST, 1.4, 1.4, 8, 0xe0e0e0, { rx1: 0.35, rz1: 0.35, mat: 'tower' })
  b.boxC(0, MAST, 0, 0.8, 0.8, 0.8, 0xff2020, 'lamp')
  for (let y = DECK_Y + 10; y < MAST; y += 12) b.boxC(0, y, 0, 1.6 - (y - DECK_Y) / 50, 0.5, 1.6 - (y - DECK_Y) / 50, 0xff4040, 'lamp')

  // 走上观景台的平台（碰撞）
  b.platform({ type: 'ellipse', cx: b.ox, cz: b.oz, rx: R1x + 0.2, rz: R1z + 0.2, y: DECK_Y, wall: true, inner: { rx: 1.4, rz: 1.4 } })
  b.platform({ type: 'ellipse', cx: b.ox, cz: b.oz, rx: R1x * 0.98, rz: R1z * 0.98, y: RESTAURANT_Y, wall: true, inner: { rx: CORE[0], rz: CORE[1] }, spin: 0.04 })
  b.box(-CORE[0] - 0.1, RESTAURANT_Y, -0.5, -CORE[0], RESTAURANT_Y + 3, 0.5, 0x333333, { solid: false })

  // 摩天轮（极速云霄/摩天轮观光舱）
  const wheel = new THREE.Group()
  const capMat = new THREE.MeshLambertMaterial({ color: 0xf2f2f2, emissive: 0x3388ff, emissiveIntensity: 0 })
  const glassM = new THREE.MeshLambertMaterial({ color: 0x8fc8f0, transparent: true, opacity: 0.6 })
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    const pod = new THREE.Group()
    const s = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), glassM)
    const c = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 1.8), capMat)
    c.position.y = 0.95
    pod.add(s, c)
    pod.position.set(Math.cos(a) * (R1x + 1.3), DECK_Y + 2.3, Math.sin(a) * (R1z + 1.3))
    wheel.add(pod)
  }
  wheel.userData.capMat = capMat
  ctx.add(wheel)
  ctx.onUpdate((dt, time, night) => {
    wheel.rotation.y += dt * 0.03
    capMat.emissiveIntensity = night * 0.8
  })

  // 交互：电梯
  ctx.interact({ x: 0, z: 21.5, r: 4, label: '乘坐电梯登塔', type: 'elevator' })
  ctx.interact({ x: 0, z: -1.4, y: DECK_Y, r: 3, label: '乘坐电梯下塔 / 去旋转餐厅', type: 'elevatorTop' })
  ctx.interact({ x: -CORE[0] - 1, z: 0, y: RESTAURANT_Y, r: 3, label: '乘坐电梯', type: 'elevatorTop' })
}

export function towerLOD(b) {
  getTowerLightMaterial().userData.uBase.value.set(b.ox, 0, b.oz)
  // 远景：堆叠扭转的椭圆体
  const { H, N } = TOWER
  for (let k = 0; k < 12; k++) {
    const t0 = k / 12, t1 = (k + 1) / 12
    let mx0 = 0, mz0 = 0, mx1 = 0, mz1 = 0
    for (let i = 0; i < N; i++) {
      const p = towerPoint(i, t0), q = towerPoint(i, t1)
      mx0 = Math.max(mx0, Math.abs(p[0])); mz0 = Math.max(mz0, Math.abs(p[2]))
      mx1 = Math.max(mx1, Math.abs(q[0])); mz1 = Math.max(mz1, Math.abs(q[2]))
    }
    b.prism(0, 0, t0 * H, t1 * H, mx0, mz0, 12, 0xe8eaec, { rx1: mx1, rz1: mz1, mat: 'tower', solid: false, rot: t0 * TOWER.TWIST })
  }
  b.prism(0, 0, H, TOWER.MAST, 1.6, 1.6, 6, 0xe0e0e0, { rx1: 0.3, rz1: 0.3, mat: 'tower', solid: false })
}

export function towerMaterial() {
  return getTowerLightMaterial()
}

// ---------------- 海心沙 ----------------
export function buildHaixinsha(b, ctx) {
  paving(b, -40, -30, 40, 18, 0, 0xd0cabc)
  // 亚运会开幕式“风帆”看台（白色帆形结构）
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const x = side * (12 + i * 6)
      for (let k = 0; k < 10; k++) {
        const h = 4 + k * 1.6
        b.box(x - 2.4 + k * 0.08 * side, 0, -14 + k * 0.4, x + 2.4 - k * 0.12 * side, h, -13.2 + k * 0.4, 0xf4f6f8, { solid: k < 2 })
      }
    }
  }
  // 中央大草坪、喷泉台
  b.box(-10, 0, -20, 10, 0.25, 5, C.grass, { mat: 'grass', solid: false })
  b.prism(0, -8, 0.25, 0.8, 4, 4, 16, 0xcfd8dc)
  b.prism(0, -8, 0.8, 0.85, 3.6, 3.6, 16, 0x4a90c8, { mat: 'pond', solid: false })
  for (let i = 0; i < 8; i++) b.boxC(Math.cos(i) * 2, 0.85, -8 + Math.sin(i) * 2, 0.2, 2 + (i % 3), 0.2, 0xe0f4ff, { mat: 'glow', solid: false })
  for (let x = -36; x <= 36; x += 6) lamp(b, x, 0, 15)
  railing(b, -40, 17.5, 40, 17.5, 0, 1.1, 0xcfcfcf, 2)
  b.sign('海心沙亚运公园', 0, 3, 16, 1.2, 0, { bg: '#1c3c5c', fg: '#ffffff' })
  ctx.interact({ x: 0, z: 12, r: 6, label: '远眺广州塔', type: 'view' })
}

// ---------------- 花城广场 + 西塔/东塔 已在天河区 ----------------

// ---------------- 琶洲会展中心 & 琶洲塔 ----------------
export function buildPazhou(b) {
  // 广交会展馆：长条形展厅 + 波浪形屋顶
  paving(b, -110, -40, 110, 34, 0, 0xc0bcb0)
  for (let i = 0; i < 5; i++) {
    const x0 = -100 + i * 40
    b.box(x0, 0, -26, x0 + 36, 12, 8, 0xd8dde2, 'curtain')
    for (let k = 0; k < 18; k++) {
      const x = x0 + k * 2
      const y = 12 + Math.sin((k / 17) * Math.PI) * 4
      b.box(x, 12, -28, x + 2, y + 0.6, 10, 0xeef2f4)
    }
  }
  // 连廊
  b.box(-102, 6, 8, 102, 8, 14, 0xb8c4cc, { mat: 'window' })
  b.box(-102, 0, 13, -98, 6, 14, 0x888888)
  for (let x = -96; x <= 96; x += 12) b.boxC(x, 0, 13.5, 0.8, 6, 0.8, 0x999999)
  b.sign('中国进出口商品交易会展馆', 0, 10, 14.1, 1.6, 0, { bg: '#ffffff', fg: '#b8222a' })
  for (let x = -100; x <= 100; x += 8) palm(b, x, 0, 26, 0.8)
  // 琶洲塔（明代九层八角砖塔，位于展馆东侧）
  const px = 120, pz = 0
  b.prism(px, pz, 0, 1.5, 4.4, 4.4, 8, C.granite)
  for (let f = 0; f < 9; f++) {
    const r = 3.4 - f * 0.22, y = 1.5 + f * 2.9
    b.prism(px, pz, y, y + 2.4, r, r, 8, 0xb8a888, { mat: 'brick' })
    b.prism(px, pz, y + 2.4, y + 2.9, r + 0.9, r + 0.9, 8, 0x8a7a6a, { rx1: r + 0.2, rz1: r + 0.2 })
  }
  b.prism(px, pz, 27.6, 30, 0.9, 0.9, 8, C.gold, { rx1: 0.2, rz1: 0.2 })
  b.sign('琶洲塔', px, 2.5, pz + 4.6, 0.8, 0, { bg: '#4a3020', fg: '#ffe08a' })
}

// ---------------- 中山大学南校区 ----------------
export function buildSYSU(b, ctx) {
  // 北门牌坊（"国立中山大学"）—— 朝北（-z）
  b.boxC(0, 0, -40, 14, 0.2, 4, 0xbcb6aa, { solid: false })
  for (const dx of [-5, -1.8, 1.8, 5]) b.boxC(dx, 0, -40, 1, 7, 1, 0xf2f0ea)
  b.box(-5.8, 7, -40.7, 5.8, 8.2, -39.3, 0xf2f0ea)
  b.box(-6.2, 8.2, -41, 6.2, 9, -39, C.glazedBlue)
  b.sign('国立中山大学', 0, 7.6, -40.75, 0.9, Math.PI, { bg: '#f2f0ea', fg: '#1a1a1a' })
  // 中轴大草坪
  b.box(-10, 0, -34, 10, 0.25, 10, C.grass, { mat: 'grass', solid: false })
  // 怀士堂（小礼堂）：红砖绿瓦 + 中央塔楼
  const hx = 0, hz = 22
  b.box(hx - 12, 0, hz - 6, hx + 12, 9, hz + 6, 0xa8442e, 'brick')
  for (let i = -5; i <= 5; i++) b.box(hx + i * 2 - 0.5, 1.5, hz - 6.05, hx + i * 2 + 0.5, 3.8, hz - 6.0, 0x8ab0c8, { mat: 'window', solid: false })
  for (let i = -5; i <= 5; i++) b.box(hx + i * 2 - 0.5, 5.2, hz - 6.05, hx + i * 2 + 0.5, 7.5, hz - 6.0, 0x8ab0c8, { mat: 'window', solid: false })
  b.hipRoof(hx, hz, 24, 12, 9, 3.6, 0x3a7a4a, { over: 0.8 })
  b.box(hx - 3.5, 0, hz - 9, hx + 3.5, 13, hz - 4, 0xa8442e, 'brick')
  b.hipRoof(hx, hz - 6.5, 7, 5, 13, 3, 0x3a7a4a, { over: 0.6 })
  b.box(hx - 1.5, 0.2, hz - 9.05, hx + 1.5, 4, hz - 9, 0x4a3020, { mat: 'wood', solid: false })
  b.sign('怀士堂', hx, 9.5, hz - 9.05, 0.9, Math.PI, { bg: '#f2f0ea', fg: '#3a2a1a' })
  // 两侧红楼
  for (const sx of [-1, 1])
    for (let k = 0; k < 3; k++) {
      const x = sx * 26, z = -26 + k * 18
      b.box(x - 7, 0, z - 5, x + 7, 8, z + 5, 0xb04a32, 'brick')
      b.hipRoof(x, z, 14, 10, 8, 3, 0x3a7a4a, { over: 0.6 })
      for (let i = -2; i <= 2; i++) b.box(x - sx * 7.05, 2, z + i * 1.8 - 0.4, x - sx * 7, 6.5, z + i * 1.8 + 0.4, 0x8ab0c8, { mat: 'window', solid: false })
    }
  for (let z = -32; z <= 8; z += 8) {
    banyan(b, -14, 0, z, 0.8, z + 5)
    banyan(b, 14, 0, z, 0.8, z + 9)
  }
  statue(b, 0, 0, 2, 0x5a5a5a, 1.6)
  ctx.interact({ x: 0, z: -36, r: 6, label: '了解中山大学', type: 'info', text: '中山大学由孙中山先生于1924年亲手创办，南校区（康乐园）保留大量红砖绿瓦的早期建筑。' })
}

// ---------------- 二沙岛 星海音乐厅 ----------------
export function buildErsha(b) {
  b.box(-40, 0, -24, 40, 0.25, 24, C.grass, { mat: 'grass', solid: false })
  // 星海音乐厅：倾斜双曲抛物面屋顶，形似展翅的天鹅
  const steps = 14
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    const h = 6 + Math.abs(t - 0.35) * 22
    b.box(-14 + i * 2, 0, -10 + t * 3, -12 + i * 2, h, 10 - t * 3, 0xd8dce0, { mat: i % 3 === 0 ? 'curtain' : 'block' })
  }
  b.box(-14, 0, 9.5, 14, 5, 10.5, 0x8ab0c8, { mat: 'curtain' })
  b.sign('星海音乐厅', 0, 6, 10.6, 1.1, 0, { bg: '#1a2a3a', fg: '#e8e8ff' })
  statue(b, -20, 0, 14, 0x6a5a3a, 1.4, 1)
  // 广东美术馆
  b.box(18, 0, -18, 34, 9, -4, 0xe8e4dc)
  b.box(22, 9, -14, 30, 12, -8, 0xe8e4dc)
  b.sign('广东美术馆', 26, 6, -3.95, 0.8, 0, { bg: '#e8e4dc', fg: '#333' })
  for (let i = 0; i < 8; i++) kapok(b, -36 + i * 10, 0, 20, 0.8)
  for (let i = 0; i < 6; i++) banyan(b, -34 + i * 13, 0, -20, 0.8, i)
}

// ---------------- 桥梁装饰 ----------------
export function buildHaizhuBridge(b) {
  // 海珠桥：三孔钢拱桥（1933），沿 z 方向跨江
  const L = 70
  for (const [z0, z1] of [[-L / 2, -L / 6], [-L / 6, L / 6], [L / 6, L / 2]]) {
    for (const x of [-6.5, 6.5]) {
      const n = 12
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n
        const y0 = Math.sin(t0 * Math.PI) * 7 + 0.5, y1 = Math.sin(t1 * Math.PI) * 7 + 0.5
        b.beam(x, y0, z0 + (z1 - z0) * t0, x, y1, z0 + (z1 - z0) * t1, 0.6, 0x5a6a7a)
        b.beam(x, y0, z0 + (z1 - z0) * t0, x, 0.6, z0 + (z1 - z0) * t0, 0.18, 0x5a6a7a)
      }
    }
    b.beam(-6.5, 6, (z0 + z1) / 2, 6.5, 6, (z0 + z1) / 2, 0.4, 0x5a6a7a)
  }
  for (const z of [-L / 6, L / 6]) b.boxC(0, -4, z, 14, 4.4, 3, 0x8a8a84)
  b.sign('海珠桥', 7.2, 5, -L / 2 + 2, 0.8, Math.PI / 2, { bg: '#2a3a4a', fg: '#fff' })
}

export function buildLiedeBridge(b, ctx) {
  // 猎德村龙舟（江面）
  for (const [x, z, c] of [[-22, -8, 0xd83030], [-30, 6, 0xf2c230]]) {
    b.box(x - 1, -0.9, z - 9, x + 1, -0.4, z + 9, 0x6a3a1a, { mat: 'wood', solid: false })
    b.box(x - 0.6, -0.4, z + 9, x + 0.6, 1.2, z + 10.4, c, { solid: false })
    b.box(x - 0.4, 0.6, z + 10.4, x + 0.4, 1.0, z + 11.2, c, { solid: false })
    for (let k = -7; k <= 7; k += 1.6) b.box(x - 0.9, -0.4, z + k - 0.2, x + 0.9, 0.3, z + k + 0.2, 0xf0d8b0, { solid: false })
    b.box(x - 0.15, -0.4, z - 9.6, x + 0.15, 1.4, z - 9.3, c, { solid: false })
  }
  if (ctx) ctx.interact({ x: 0, z: -40, r: 8, label: '观看猎德龙舟', type: 'culture', id: 'dragonboat' })
  // 猎德大桥：独塔自锚式悬索桥，主塔形似贝壳
  const y0 = 0.35
  for (let k = 0; k < 16; k++) {
    const t = k / 15
    const w = 4 + Math.sin(t * Math.PI) * 6
    b.boxC(0, y0 + k * 3.2, 0, w, 3.2, 3 + Math.cos(t * Math.PI * 0.5) * 2, 0xe8e8e2)
  }
  b.boxC(0, y0 + 51, 0, 3, 2, 2, 0xf0f0ea)
  for (const x of [-8, 8])
    for (const s of [-1, 1])
      for (let i = 0; i < 10; i++) {
        const z = s * (8 + i * 6)
        b.beam(x * 0.3, y0 + 46 - i * 2, 0, x, y0 + 1, z, 0.12, 0xdddddd)
      }
  b.boxC(0, -4, 0, 16, 4.4, 5, 0x9a9a94)
}

export function buildHaixinBridge(b) {
  // 海心桥：步行桥，大跨度倾斜钢拱（“琴弦”）
  const L = 70
  const n = 24
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n
    const z0 = -L / 2 + L * t0, z1 = -L / 2 + L * t1
    const y0 = Math.sin(t0 * Math.PI) * 26, y1 = Math.sin(t1 * Math.PI) * 26
    const x0 = -Math.sin(t0 * Math.PI) * 10 - 3, x1 = -Math.sin(t1 * Math.PI) * 10 - 3
    b.beam(x0, y0, z0, x1, y1, z1, 1.2, 0xf4f4f4)
    if (i % 2 === 0) b.beam(x0, y0, z0, 2.5, 0.5, z0, 0.1, 0xe8e8e8)
  }
  for (let z = -L / 2; z <= L / 2; z += 4) b.boxC(3, 0.35, z, 0.2, 1.1, 0.2, 0xcfcfcf, { solid: false })
  for (let z = -L / 2; z <= L / 2; z += 4) b.boxC(-3, 0.35, z, 0.2, 1.1, 0.2, 0xcfcfcf, { solid: false })
  b.box(-3, 1.35, -L / 2, 3, 1.5, L / 2, 0x7ad0ff, { mat: 'neon', solid: false })
}

export function buildGuangzhouBridge(b) {
  for (let z = -30; z <= 30; z += 15) b.boxC(0, -4, z, 16, 4.4, 3, 0x9a9a94)
  for (let z = -32; z <= 32; z += 8) {
    lamp(b, -7.5, 0.35, z, 5)
    lamp(b, 7.5, 0.35, z, 5)
  }
}

// ---------------- 珠江（江景观景点） ----------------
export function buildZhujiang(b, ctx) {
  // 江边观景栈道
  paving(b, -30, -4, 30, 4, 0, 0xb8a888)
  railing(b, -30, 4, 30, 4, 0, 1.1, 0x666666, 2)
  for (let x = -28; x <= 28; x += 7) {
    lamp(b, x, 0, -3, 4, 'old')
    bench(b, x + 3.5, 0, -2)
  }
  b.sign('珠江 · 广州母亲河', 0, 2.2, 4.2, 0.9, 0, { bg: '#20405a', fg: '#ffffff' })
  ctx.interact({ x: 0, z: 2, r: 8, label: '欣赏珠江景色', type: 'view' })
}
