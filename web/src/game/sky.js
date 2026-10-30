// 天空、昼夜循环、天气（晴/阴/雨/台风）
import * as THREE from 'three'
import { mulberry32, clamp, lerp } from './util.js'

const WEATHERS = {
  sunny: { name: '晴天', icon: '☀️', fog: 0.00075, cloud: 0.35, light: 1, rain: 0, dark: 0 },
  cloudy: { name: '阴天', icon: '☁️', fog: 0.0011, cloud: 0.8, light: 0.65, rain: 0, dark: 0.35 },
  rain: { name: '下雨', icon: '🌧️', fog: 0.0019, cloud: 1, light: 0.45, rain: 1, dark: 0.6 },
  typhoon: { name: '台风', icon: '🌀', fog: 0.003, cloud: 1, light: 0.3, rain: 2.2, dark: 0.8 }
}
export { WEATHERS }

const skyVert = `
varying vec3 vDir;
void main(){ vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w; }`
const skyFrag = `
uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSun; uniform vec3 uSunColor; uniform float uNight; uniform float uFlash;
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir);
  float h = clamp(d.y, -0.2, 1.0);
  vec3 col = mix(uHorizon, uTop, pow(max(h,0.0), 0.55));
  if (d.y < 0.0) col = uHorizon * 0.9;
  float s = max(dot(d, normalize(uSun)), 0.0);
  col += uSunColor * pow(s, 8.0) * 0.35 * (1.0 - uNight);
  // 城市光污染（夜晚地平线泛紫）
  col += vec3(0.25,0.12,0.3) * uNight * pow(1.0 - max(h,0.0), 6.0) * 0.5;
  col += vec3(uFlash);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`

export class SkySystem {
  constructor(scene, renderer) {
    this.scene = scene
    this.renderer = renderer
    this.hour = 9
    this.speed = 24 / (20 * 60) // 20 分钟一天
    this.weather = 'sunny'
    this.weatherLock = null
    this.nextWeatherChange = 2 + Math.random() * 2
    this.wf = { ...WEATHERS.sunny } // 平滑过渡值
    this.flash = 0
    this.flashTimer = 5
    this.rng = mulberry32(Date.now() & 0xffff)
    this.onWeatherChange = null

    this.fog = new THREE.FogExp2(0xbfe0ff, 0.0008)
    scene.fog = this.fog
    // 天空球
    this.skyUniforms = {
      uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3(0, 1, 0) },
      uSunColor: { value: new THREE.Color(1, 0.9, 0.7) }, uNight: { value: 0 }, uFlash: { value: 0 }
    }
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(4000, 32, 16), new THREE.ShaderMaterial({ uniforms: this.skyUniforms, vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide, depthWrite: false, fog: false }))
    this.sky.renderOrder = -10
    this.sky.frustumCulled = false
    scene.add(this.sky)
    // 方块太阳/月亮
    this.sun = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), new THREE.MeshBasicMaterial({ color: 0xfff4c0, fog: false, transparent: true, depthWrite: false }))
    this.moon = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), new THREE.MeshBasicMaterial({ color: 0xe8eef8, fog: false, transparent: true, depthWrite: false }))
    this.sun.renderOrder = this.moon.renderOrder = -9
    scene.add(this.sun, this.moon)
    // 星空
    const sp = []
    const r = mulberry32(7)
    for (let i = 0; i < 1500; i++) {
      const u = r() * 2 - 1, a = r() * Math.PI * 2
      const y = Math.abs(u)
      const s = Math.sqrt(1 - y * y)
      sp.push(Math.cos(a) * s * 3500, y * 3500, Math.sin(a) * s * 3500)
    }
    const sg = new THREE.BufferGeometry()
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3))
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, fog: false, transparent: true, depthWrite: false }))
    scene.add(this.stars)
    // 灯光
    this.hemi = new THREE.HemisphereLight(0xcfe6ff, 0x8a7a68, 1.2)
    scene.add(this.hemi)
    this.dir = new THREE.DirectionalLight(0xffffff, 2.2)
    this.dir.castShadow = true
    this.dir.shadow.mapSize.set(2048, 2048)
    const sc = this.dir.shadow.camera
    sc.left = -140; sc.right = 140; sc.top = 140; sc.bottom = -140; sc.near = 10; sc.far = 800
    this.dir.shadow.bias = -0.0006
    this.dir.shadow.normalBias = 0.6
    scene.add(this.dir, this.dir.target)
    // 云层
    this.clouds = this.makeClouds()
    scene.add(this.clouds)
    // 雨
    this.rain = this.makeRain()
    scene.add(this.rain)
  }
  makeClouds() {
    const g = new THREE.Group()
    const r = mulberry32(99)
    const N = 48, S = 70
    const grid = []
    for (let i = 0; i < N; i++) {
      grid[i] = []
      for (let j = 0; j < N; j++) grid[i][j] = r()
    }
    // 平滑
    const sm = (i, j) => {
      let s = 0
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) s += grid[(i + a + N) % N][(j + b + N) % N]
      return s / 9
    }
    const geos = [[], []]
    const box = new THREE.BoxGeometry(S, 10, S)
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) {
        const v = sm(i, j)
        const layer = v > 0.58 ? 0 : v > 0.5 ? 1 : -1
        if (layer < 0) continue
        const m = new THREE.Matrix4().makeTranslation((i - N / 2) * S, 0, (j - N / 2) * S)
        geos[layer].push(box.clone().applyMatrix4(m))
      }
    this.cloudMats = []
    for (let l = 0; l < 2; l++) {
      if (!geos[l].length) continue
      const merged = mergeBoxes(geos[l])
      const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false, depthWrite: false })
      this.cloudMats.push(mat)
      const mesh = new THREE.Mesh(merged, mat)
      mesh.userData.layer = l
      g.add(mesh)
    }
    g.position.y = 260
    this.cloudSpan = N * S
    return g
  }
  makeRain() {
    const N = 16000
    const pos = new Float32Array(N * 6)
    const r = mulberry32(3)
    for (let i = 0; i < N; i++) {
      const x = (r() - 0.5) * 100, y = r() * 60, z = (r() - 0.5) * 100
      pos.set([x, y, z, x, y, z], i * 6)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    this.rainU = { uTime: { value: 0 }, uWind: { value: new THREE.Vector2() }, uOrigin: { value: new THREE.Vector3() }, uAlpha: { value: 0 } }
    const mat = new THREE.ShaderMaterial({
      uniforms: this.rainU,
      transparent: true,
      depthWrite: false,
      vertexShader: `uniform float uTime; uniform vec2 uWind; uniform vec3 uOrigin;
        void main(){ vec3 p = position; float fall = mod(p.y - uTime*42.0, 60.0);
          p.y = fall; p.xz += uWind * (60.0 - fall) * 0.25;
          if (mod(float(gl_VertexID),2.0) > 0.5) { p.y -= 1.6; p.xz += uWind*0.4; }
          vec3 w = vec3(mod(p.x - uOrigin.x + 50.0, 100.0) - 50.0 + uOrigin.x, uOrigin.y - 20.0 + p.y, mod(p.z - uOrigin.z + 50.0, 100.0) - 50.0 + uOrigin.z);
          gl_Position = projectionMatrix * viewMatrix * vec4(w,1.0); }`,
      fragmentShader: `uniform float uAlpha; void main(){ gl_FragColor = vec4(0.75,0.82,0.95,uAlpha); }`
    })
    const ls = new THREE.LineSegments(g, mat)
    ls.frustumCulled = false
    ls.visible = false
    return ls
  }
  setWeather(w, lock = false) {
    if (!WEATHERS[w]) return
    this.weather = w
    if (lock) this.weatherLock = w
    if (this.onWeatherChange) this.onWeatherChange(w)
  }
  unlock() {
    this.weatherLock = null
  }
  get night() {
    return this._night || 0
  }
  update(dt, cam, focus) {
    const prevHour = this.hour
    this.hour = (this.hour + dt * this.speed) % 24
    // 天气自动变化
    if (!this.weatherLock) {
      this.nextWeatherChange -= dt * this.speed
      if (this.nextWeatherChange <= 0) {
        const x = this.rng()
        const w = x < 0.45 ? 'sunny' : x < 0.75 ? 'cloudy' : x < 0.93 ? 'rain' : 'typhoon'
        this.nextWeatherChange = 2 + this.rng() * 3
        if (w !== this.weather) this.setWeather(w)
      }
    }
    // 平滑过渡
    const target = WEATHERS[this.weather]
    const k = Math.min(1, dt * 0.4)
    for (const key of ['fog', 'cloud', 'light', 'rain', 'dark']) this.wf[key] = lerp(this.wf[key], target[key], k)
    const wf = this.wf
    // 太阳
    const th = ((this.hour - 6) / 12) * Math.PI
    const sunDir = new THREE.Vector3(Math.cos(th), Math.sin(th), 0.35).normalize()
    const sy = sunDir.y
    const night = clamp((0.06 - sy) / 0.22, 0, 1)
    this._night = night
    const dusk = clamp(1 - Math.abs(sy - 0.05) / 0.22, 0, 1) * (1 - night * 0.6)
    this.dusk = dusk
    // 天空颜色
    const top = new THREE.Color(0x3d86e0), hor = new THREE.Color(0xbfe0ff)
    top.lerp(new THREE.Color(0x3a4a8a), dusk * 0.6).lerp(new THREE.Color(0x04060f), night)
    hor.lerp(new THREE.Color(0xff9a5a), dusk * 0.85).lerp(new THREE.Color(0x14182e), night)
    const grey = new THREE.Color(0x8a9098).multiplyScalar(1 - night * 0.85)
    top.lerp(grey, wf.dark * 0.85)
    hor.lerp(grey, wf.dark * 0.75)
    this.flashTimer -= dt
    if (wf.rain > 0.5 && this.flashTimer < 0) {
      this.flashTimer = (this.weather === 'typhoon' ? 3 : 9) + Math.random() * 8
      this.flash = 1
    }
    this.flash = Math.max(0, this.flash - dt * 4)
    const fl = this.flash > 0.5 || (this.flash > 0.2 && this.flash < 0.3) ? this.flash : 0
    this.skyUniforms.uTop.value.copy(top)
    this.skyUniforms.uHorizon.value.copy(hor)
    this.skyUniforms.uSun.value.copy(sunDir)
    this.skyUniforms.uNight.value = night
    this.skyUniforms.uFlash.value = fl * 0.6
    this.fog.color.copy(hor)
    this.fog.density = wf.fog
    // 灯光
    const dayL = clamp(sy * 3 + 0.2, 0, 1) * wf.light
    this.hemi.color.copy(new THREE.Color(0xcfe6ff).lerp(new THREE.Color(0x7080c0), night))
    this.hemi.groundColor.copy(new THREE.Color(0x8a7a68).lerp(new THREE.Color(0x5a4a50), night))
    this.hemi.intensity = 0.35 + dayL * 1.0 + night * 0.75 + fl * 2.5
    const moonDir = sunDir.clone().multiplyScalar(-1)
    const useMoon = sy < 0
    const ld = useMoon ? moonDir : sunDir
    this.dir.intensity = useMoon ? 0.5 * wf.light + 0.1 : 2.4 * dayL
    this.dir.color.copy(useMoon ? new THREE.Color(0x8ea8ff) : new THREE.Color(0xffffff).lerp(new THREE.Color(0xffa060), dusk))
    this.dir.position.copy(focus).addScaledVector(ld, 400)
    this.dir.target.position.copy(focus)
    // 阴影相机吸附到网格，减少闪烁
    // 天空球跟随相机
    this.sky.position.copy(cam.position)
    this.stars.position.copy(cam.position)
    this.stars.material.opacity = night * (1 - wf.dark) * 0.9
    this.stars.rotation.y = this.hour * 0.05
    this.sun.position.copy(cam.position).addScaledVector(sunDir, 3200)
    this.sun.lookAt(cam.position)
    this.sun.material.opacity = (1 - wf.dark) * clamp(sy * 6 + 0.6, 0, 1)
    this.sun.material.color.copy(new THREE.Color(0xfff4c0).lerp(new THREE.Color(0xff8040), dusk))
    this.moon.position.copy(cam.position).addScaledVector(moonDir, 3200)
    this.moon.lookAt(cam.position)
    this.moon.material.opacity = (1 - wf.dark) * clamp(-sy * 6 + 0.4, 0, 1)
    // 云
    this.cloudT = (this.cloudT || 0) + dt * (this.weather === 'typhoon' ? 30 : 4)
    this.clouds.position.x = Math.floor(cam.position.x / 70) * 70 + (this.cloudT % 70)
    this.clouds.position.z = Math.floor(cam.position.z / 70) * 70
    const cc = new THREE.Color(0xffffff).lerp(new THREE.Color(0x707680), wf.dark).lerp(new THREE.Color(0x1a1e2a), night).lerp(new THREE.Color(0xffb080), dusk * 0.5 * (1 - wf.dark))
    this.clouds.children.forEach((m) => {
      m.visible = m.userData.layer === 0 ? true : wf.cloud > 0.6
      m.material.color.copy(cc)
      m.material.opacity = 0.55 + wf.cloud * 0.4
    })
    // 雨
    this.rain.visible = wf.rain > 0.05
    this.rainU.uTime.value += dt
    this.rainU.uAlpha.value = clamp(wf.rain * 0.6, 0, 0.8)
    this.rainU.uOrigin.value.copy(cam.position)
    const wind = this.weather === 'typhoon' ? 2.2 : 0.3
    this.rainU.uWind.value.set(wind, wind * 0.4)
    return { night, dusk, flash: fl, crossedHour: Math.floor(prevHour) !== Math.floor(this.hour) }
  }
  get period() {
    const h = this.hour
    if (h >= 5 && h < 11) return '早晨'
    if (h >= 11 && h < 17) return '下午'
    if (h >= 17 && h < 19.5) return '黄昏'
    return '夜晚'
  }
}

function mergeBoxes(geos) {
  let count = 0
  for (const g of geos) count += g.attributes.position.count
  const pos = new Float32Array(count * 3), nor = new Float32Array(count * 3)
  const idx = []
  let off = 0
  for (const g of geos) {
    pos.set(g.attributes.position.array, off * 3)
    nor.set(g.attributes.normal.array, off * 3)
    for (const i of g.index.array) idx.push(i + off)
    off += g.attributes.position.count
  }
  const m = new THREE.BufferGeometry()
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  m.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  m.setIndex(idx.length > 65000 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1))
  return m
}
