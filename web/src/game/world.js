// 珠江水面（反射倒影）与道路/桥梁网格
import * as THREE from 'three'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import { RIVERS, ROADS, WATER_Y, BRIDGE_Y, riverAt } from './geo.js'
import { getTextures, getMaterials } from './materials.js'
import { Builder } from './builder.js'

function riverGeometry() {
  const pos = [], idx = []
  let n = 0
  const toL = (x, z) => [x, -z]
  for (const r of RIVERS) {
    const P = r.pts
    for (let i = 0; i < P.length; i++) {
      const a = P[Math.max(0, i - 1)], c = P[Math.min(P.length - 1, i + 1)]
      let tx = c.x - a.x, tz = c.z - a.z
      const l = Math.hypot(tx, tz) || 1
      tx /= l
      tz /= l
      const nx = -tz, nz = tx
      const h = P[i].w / 2
      const L = toL(P[i].x + nx * h, P[i].z + nz * h), R = toL(P[i].x - nx * h, P[i].z - nz * h)
      pos.push(L[0], L[1], 0, R[0], R[1], 0)
      if (i > 0) idx.push(n - 2, n - 1, n, n - 1, n + 1, n)
      n += 2
    }
    // 节点圆盘：平滑转角
    for (const p of P) {
      const c = toL(p.x, p.z)
      const base = n
      pos.push(c[0], c[1], 0)
      n++
      const seg = 16
      for (let k = 0; k < seg; k++) {
        const ang = (k / seg) * Math.PI * 2
        pos.push(c[0] + Math.cos(ang) * p.w / 2, c[1] + Math.sin(ang) * p.w / 2, 0)
        n++
      }
      for (let k = 0; k < seg; k++) idx.push(base, base + 1 + k, base + 1 + ((k + 1) % seg))
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  // 统一朝向（法线 +z）
  const p = g.attributes.position.array
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3
    const cross = (p[b] - p[a]) * (p[c + 1] - p[a + 1]) - (p[b + 1] - p[a + 1]) * (p[c] - p[a])
    if (cross < 0) {
      const t = idx[i + 1]
      idx[i + 1] = idx[i + 2]
      idx[i + 2] = t
    }
  }
  g.setIndex(idx)
  g.computeVertexNormals()
  const uv = []
  for (let i = 0; i < p.length; i += 3) uv.push(p[i] / 40, p[i + 1] / 40)
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeBoundingSphere()
  return g
}

const WaterShader = {
  name: 'GZWater',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uTime: { value: 0 },
    uCam: { value: new THREE.Vector3() },
    uFogColor: { value: new THREE.Color() },
    uFogDensity: { value: 0.0006 },
    uDeep: { value: new THREE.Color(0x1d4a5a) }
  },
  vertexShader: `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec3 uCam;
    uniform vec3 uFogColor;
    uniform float uFogDensity;
    uniform vec3 uDeep;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vec2 w = vec2(
        sin(vWorld.x * 0.09 + uTime * 1.3) + sin(vWorld.z * 0.13 + uTime * 0.9) + sin((vWorld.x - vWorld.z) * 0.31 + uTime * 2.1) * 0.4,
        cos(vWorld.z * 0.08 - uTime * 1.1) + sin((vWorld.x + vWorld.z) * 0.05 + uTime * 0.7) + cos((vWorld.x + vWorld.z) * 0.27 - uTime * 1.7) * 0.4
      ) * 0.01;
      vec4 uv = vUv;
      uv.xy += w * uv.w;
      vec3 refl = texture2DProj(tDiffuse, uv).rgb;
      vec3 V = normalize(uCam - vWorld);
      float fres = 0.3 + 0.7 * pow(1.0 - clamp(V.y, 0.0, 1.0), 2.5);
      vec3 col = mix(uDeep, refl * color, fres);
      // 方块化像素波光
      vec2 cell = floor(vWorld.xz * 0.5);
      float sp = step(0.985, fract(sin(dot(cell, vec2(12.9898, 78.233)) + floor(uTime * 3.0)) * 43758.5453));
      col += sp * 0.12;
      float d = length(uCam - vWorld);
      float fog = 1.0 - exp(-uFogDensity * uFogDensity * d * d);
      gl_FragColor = vec4(mix(col, uFogColor, fog), 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
}

export class WaterSystem {
  constructor(scene, reflect = true) {
    this.scene = scene
    this.geo = riverGeometry()
    this.reflect = reflect
    this.create()
  }
  create() {
    if (this.mesh) {
      this.scene.remove(this.mesh)
      if (this.mesh.dispose) this.mesh.dispose()
    }
    if (this.reflect) {
      const s = Math.min(1, 1024 / window.innerWidth)
      const m = new Reflector(this.geo, {
        textureWidth: Math.floor(window.innerWidth * 0.5 * s * (window.devicePixelRatio || 1)),
        textureHeight: Math.floor(window.innerHeight * 0.5 * s * (window.devicePixelRatio || 1)),
        color: 0xb8c8d0,
        clipBias: 0.003,
        shader: WaterShader
      })
      m.material.uniforms.color.value = new THREE.Color(0xb8c8d0)
      this.uniforms = m.material.uniforms
      this.mesh = m
    } else {
      const T = getTextures()
      const mat = new THREE.MeshPhongMaterial({ color: 0x2f6a80, specular: 0x88aacc, shininess: 60, transparent: true, opacity: 0.92, map: T.water })
      this.mesh = new THREE.Mesh(this.geo, mat)
      this.uniforms = null
    }
    this.mesh.rotation.x = -Math.PI / 2
    this.mesh.position.y = WATER_Y
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = -1
    this.scene.add(this.mesh)
  }
  setReflect(v) {
    if (v === this.reflect) return
    this.reflect = v
    this.create()
  }
  update(t, camera, fog, night) {
    if (this.uniforms) {
      this.uniforms.uTime.value = t
      this.uniforms.uCam.value.copy(camera.position)
      if (fog) {
        this.uniforms.uFogColor.value.copy(fog.color)
        this.uniforms.uFogDensity.value = fog.density
      }
      this.uniforms.uDeep.value.setRGB(0.05 + 0.04 * (1 - night), 0.14 * (1 - night) + 0.03, 0.2 * (1 - night) + 0.06)
    } else if (this.mesh.material.map) {
      this.mesh.material.map.offset.set(t * 0.01, t * 0.007)
    }
  }
}

// 道路与桥梁
export function buildRoads(scene) {
  const T = getTextures()
  const pos = [], uv = [], idx = []
  let n = 0
  const bb = new Builder(0, 0, 0, 0, null)
  const sidePos = [], sideIdx = []
  let sn = 0
  ROADS.forEach((road, ri) => {
    const P = road.pts
    let vacc = 0
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], c = P[i]
      const L = Math.hypot(c.x - a.x, c.z - a.z)
      const pieces = Math.max(1, Math.ceil(L / 16))
      const dx = (c.x - a.x) / L, dz = (c.z - a.z) / L
      const nx = -dz, nz = dx
      const hw = road.w / 2
      for (let k = 0; k < pieces; k++) {
        const t0 = k / pieces, t1 = (k + 1) / pieces
        const x0 = a.x + (c.x - a.x) * t0, z0 = a.z + (c.z - a.z) * t0
        const x1 = a.x + (c.x - a.x) * t1, z1 = a.z + (c.z - a.z) * t1
        const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2
        const wet = !!riverAt(mx, mz, 2) || !!riverAt(x0, z0) || !!riverAt(x1, z1)
        const y = wet ? BRIDGE_Y + 0.03 : 0.04 + ri * 0.0015
        const ext = 0.6
        const ex0 = x0 - dx * ext, ez0 = z0 - dz * ext, ex1 = x1 + dx * ext, ez1 = z1 + dz * ext
        pos.push(ex0 + nx * hw, y, ez0 + nz * hw, ex0 - nx * hw, y, ez0 - nz * hw, ex1 + nx * hw, y, ez1 + nz * hw, ex1 - nx * hw, y, ez1 - nz * hw)
        const segL = L / pieces
        const v0 = vacc / 10, v1 = (vacc + segL) / 10
        uv.push(0, v0, 1, v0, 0, v1, 1, v1)
        idx.push(n, n + 2, n + 1, n + 1, n + 2, n + 3)
        n += 4
        vacc += segL
        // 人行道
        const sw = hw + 2.2
        const sy = y - 0.015
        sidePos.push(ex0 + nx * sw, sy, ez0 + nz * sw, ex0 - nx * sw, sy, ez0 - nz * sw, ex1 + nx * sw, sy, ez1 + nz * sw, ex1 - nx * sw, sy, ez1 - nz * sw)
        sideIdx.push(sn, sn + 2, sn + 1, sn + 1, sn + 2, sn + 3)
        sn += 4
        if (wet) {
          // 桥面结构 + 栏杆 + 桥墩
          const ang = Math.atan2(dx, dz)
          const len = segL + 1.2
          bb.rbox(mx, BRIDGE_Y - 0.9, mz, hw * 2 + 3, 1.8, len, 0, ang, 0, 0x8a8a84)
          for (const s of [-1, 1]) {
            bb.rbox(mx + nx * (hw + 1.3) * s, BRIDGE_Y + 0.55, mz + nz * (hw + 1.3) * s, 0.35, 1.1, len, 0, ang, 0, 0xc8c8c0)
            bb.rbox(mx + nx * (hw + 1.3) * s, BRIDGE_Y + 1.15, mz + nz * (hw + 1.3) * s, 0.25, 0.18, len, 0, ang, 0, 0xf0e0a0, { mat: 'lamp' })
          }
          if (Math.floor(vacc / 16) % 3 === 0) bb.rbox(mx, -4, mz, hw * 2 - 2, 6, 3, 0, ang, 0, 0x7a7a74)
        }
      }
    }
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  const roadTex = T.road
  const mat = new THREE.MeshLambertMaterial({ map: roadTex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
  const mesh = new THREE.Mesh(g, mat)
  mesh.receiveShadow = true
  mesh.frustumCulled = false
  const sg = new THREE.BufferGeometry()
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sidePos, 3))
  sg.setIndex(sideIdx)
  sg.computeVertexNormals()
  const smesh = new THREE.Mesh(sg, new THREE.MeshLambertMaterial({ color: 0xb4ada0, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }))
  smesh.receiveShadow = true
  smesh.frustumCulled = false
  const group = new THREE.Group()
  group.add(smesh, mesh, bb.build(false))
  scene.add(group)
  return group
}
