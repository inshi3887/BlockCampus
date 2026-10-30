// 摄影系统：滤镜后期、拍照、景点识别、相册存储（IndexedDB）
import * as THREE from 'three'

export const FILTERS = [
  { id: 'none', name: '原图' },
  { id: 'lingnan', name: '岭南·复古胶片' },
  { id: 'night', name: '夜广州·霓虹' },
  { id: 'fresh', name: '清新' },
  { id: 'bw', name: '黑白' },
  { id: 'pixel', name: '像素' }
]
const FILTER_IDX = { none: 0, lingnan: 1, night: 2, fresh: 3, bw: 4, pixel: 5 }

const frag = `
uniform sampler2D tDiffuse; uniform float uMode; uniform float uTime; uniform vec2 uRes; uniform float uVignette;
varying vec2 vUv;
float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime) * 43758.5453); }
vec3 sat(vec3 c, float s){ float l = dot(c, vec3(0.299,0.587,0.114)); return mix(vec3(l), c, s); }
void main(){
  vec2 uv = vUv;
  if (uMode > 4.5) { vec2 px = vec2(6.0) / uRes; uv = (floor(uv / px) + 0.5) * px; }
  vec3 c = texture2D(tDiffuse, uv).rgb;
  if (uMode > 0.5 && uMode < 1.5) {
    // 岭南：暖黄 + 褪色 + 颗粒
    c = sat(c, 0.75);
    c = c * vec3(1.08, 0.98, 0.78) + vec3(0.06, 0.04, 0.0);
    c = mix(vec3(0.08,0.06,0.04), c, 0.9);
    c = pow(c, vec3(0.95));
    c += (rnd(uv * uRes) - 0.5) * 0.07;
  } else if (uMode > 1.5 && uMode < 2.5) {
    // 夜广州：霓虹增强 + 光晕
    vec3 glow = vec3(0.0);
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.785;
      vec2 o = vec2(cos(a), sin(a)) * 6.0 / uRes;
      vec3 s = texture2D(tDiffuse, uv + o).rgb;
      glow += max(s - 0.55, 0.0);
      s = texture2D(tDiffuse, uv + o * 2.5).rgb;
      glow += max(s - 0.55, 0.0) * 0.6;
    }
    c = sat(c, 1.55);
    c = (c - 0.5) * 1.18 + 0.5;
    float l = dot(c, vec3(0.3,0.59,0.11));
    c += mix(vec3(0.12,0.02,0.18), vec3(0.0), smoothstep(0.0, 0.5, l)) ;
    c += glow * vec3(0.55, 0.45, 0.7) * 0.35;
  } else if (uMode > 2.5 && uMode < 3.5) {
    c = sat(c, 1.15) * 1.06 + vec3(0.0, 0.03, 0.05);
    c = mix(c, vec3(1.0), 0.06);
  } else if (uMode > 3.5 && uMode < 4.5) {
    float l = dot(c, vec3(0.299,0.587,0.114));
    l = (l - 0.5) * 1.25 + 0.5;
    c = vec3(l) + (rnd(uv * uRes) - 0.5) * 0.06;
  }
  vec2 d = vUv - 0.5;
  float v = 1.0 - dot(d, d) * uVignette;
  c *= v;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
  #include <colorspace_fragment>
}`

export class PhotoSystem {
  constructor(renderer) {
    this.renderer = renderer
    this.filter = 'none'
    const size = renderer.getDrawingBufferSize(new THREE.Vector2())
    this.rt = new THREE.WebGLRenderTarget(size.x, size.y, { samples: 4, type: THREE.HalfFloatType })
    this.uniforms = { tDiffuse: { value: this.rt.texture }, uMode: { value: 0 }, uTime: { value: 0 }, uRes: { value: size.clone() }, uVignette: { value: 0.6 } }
    this.quadScene = new THREE.Scene()
    this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: frag,
      depthTest: false,
      depthWrite: false
    })
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat)
    this.quadScene.add(this.quad)
    this.dbp = null
  }
  resize() {
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2())
    this.rt.setSize(size.x, size.y)
    this.uniforms.uRes.value.copy(size)
  }
  render(scene, camera, t) {
    if (this.filter === 'none') {
      this.renderer.setRenderTarget(null)
      this.renderer.render(scene, camera)
      return
    }
    this.uniforms.uMode.value = FILTER_IDX[this.filter] || 0
    this.uniforms.uTime.value = t % 10
    this.uniforms.uVignette.value = this.filter === 'lingnan' ? 1.4 : this.filter === 'bw' ? 1.0 : 0.5
    this.renderer.setRenderTarget(this.rt)
    this.renderer.render(scene, camera)
    this.renderer.setRenderTarget(null)
    this.renderer.render(this.quadScene, this.quadCam)
  }
  // 识别画面中的景点
  recognize(camera, landmarks, world) {
    const found = []
    const v = new THREE.Vector3()
    const camPos = camera.position
    for (const lm of landmarks) {
      if (lm.def.hidden) continue
      v.set(lm.x, lm.y + (lm.def.focusY || 8), lm.z)
      const dist = v.distanceTo(camPos)
      const maxR = lm.def.photoR || 380
      if (dist > maxR) continue
      const size = Math.max(lm.def.rect ? Math.max(lm.def.rect[0], lm.def.rect[1]) : 20, (lm.def.focusY || 8) * 0.8)
      const apparent = size / Math.max(1, dist)
      if (apparent < 0.045) continue
      const p = v.clone().project(camera)
      if (p.z > 1 || Math.abs(p.x) > 0.82 || Math.abs(p.y) > 0.9) {
        // 也检查底部（大型景点只拍到一部分）
        const v2 = new THREE.Vector3(lm.x, lm.y + 2, lm.z).project(camera)
        if (v2.z > 1 || Math.abs(v2.x) > 0.8 || Math.abs(v2.y) > 0.88) continue
      }
      // 遮挡：沿视线采样
      let occ = 0
      const steps = 16
      for (let i = 1; i < steps - 1; i++) {
        const t = i / steps
        const x = camPos.x + (v.x - camPos.x) * t, y = camPos.y + (v.y - camPos.y) * t, z = camPos.z + (v.z - camPos.z) * t
        const boxes = world.query(x - 0.1, z - 0.1, x + 0.1, z + 0.1, [])
        for (const b of boxes) if (y > b.y0 && y < b.y1 && b.owner !== 'lm:' + lm.def.id) occ++
      }
      if (occ > 1) continue
      found.push({ lm, score: apparent * (1 - Math.hypot(p.x, p.y) * 0.4) })
    }
    found.sort((a, b) => b.score - a.score)
    return found.slice(0, 3).map((f) => f.lm)
  }
  capture(canvas, stamp) {
    const W = 1280
    const ratio = canvas.height / canvas.width
    const c = document.createElement('canvas')
    c.width = W
    c.height = Math.round(W * ratio)
    const g = c.getContext('2d')
    g.drawImage(canvas, 0, 0, c.width, c.height)
    // 拍立得边框信息
    if (stamp) {
      const h = 64
      g.fillStyle = 'rgba(0,0,0,0.45)'
      g.fillRect(0, c.height - h, c.width, h)
      g.fillStyle = '#ffd76a'
      g.font = 'bold 30px "Microsoft YaHei",sans-serif'
      g.fillText(stamp.title, 24, c.height - 24)
      g.fillStyle = '#ffffff'
      g.font = '22px "Microsoft YaHei",sans-serif'
      const right = stamp.sub
      const w = g.measureText(right).width
      g.fillText(right, c.width - w - 24, c.height - 26)
    }
    const full = c.toDataURL('image/jpeg', 0.88)
    const t = document.createElement('canvas')
    t.width = 320
    t.height = Math.round(320 * ratio)
    t.getContext('2d').drawImage(c, 0, 0, t.width, t.height)
    return { full, thumb: t.toDataURL('image/jpeg', 0.8) }
  }
  db() {
    if (this.dbp) return this.dbp
    this.dbp = new Promise((res, rej) => {
      const req = indexedDB.open('block-guangzhou', 1)
      req.onupgradeneeded = () => req.result.createObjectStore('photos', { keyPath: 'id' })
      req.onsuccess = () => res(req.result)
      req.onerror = () => rej(req.error)
    })
    return this.dbp
  }
  async savePhoto(rec) {
    try {
      const db = await this.db()
      await new Promise((res, rej) => {
        const tx = db.transaction('photos', 'readwrite')
        tx.objectStore('photos').put(rec)
        tx.oncomplete = res
        tx.onerror = () => rej(tx.error)
      })
    } catch (e) {
      console.warn('save photo failed', e)
    }
  }
  async listPhotos() {
    try {
      const db = await this.db()
      return await new Promise((res, rej) => {
        const tx = db.transaction('photos', 'readonly')
        const req = tx.objectStore('photos').getAll()
        req.onsuccess = () => res(req.result.sort((a, b) => b.id - a.id))
        req.onerror = () => rej(req.error)
      })
    } catch (e) {
      return []
    }
  }
  async deletePhoto(id) {
    const db = await this.db()
    return new Promise((res) => {
      const tx = db.transaction('photos', 'readwrite')
      tx.objectStore('photos').delete(id)
      tx.oncomplete = res
    })
  }
}
