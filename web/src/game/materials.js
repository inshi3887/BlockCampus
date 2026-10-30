// 程序化像素纹理 + 共享材质（方块风格）
import * as THREE from 'three'
import { mulberry32 } from './util.js'

function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  draw(g, w, h)
  const t = new THREE.CanvasTexture(c)
  t.magFilter = THREE.NearestFilter
  t.minFilter = opts.mip === false ? THREE.NearestFilter : THREE.NearestMipmapLinearFilter
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function noiseFill(g, w, h, base, amp, rng) {
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = Math.max(0, Math.min(255, base + (rng() - 0.5) * amp))
      g.fillStyle = `rgb(${v},${v},${v})`
      g.fillRect(x, y, 1, 1)
    }
}

const texCache = {}
export function getTextures() {
  if (texCache.block) return texCache
  const rng = mulberry32(42)
  texCache.block = canvasTex(16, 16, (g, w, h) => {
    noiseFill(g, w, h, 225, 40, rng)
    g.fillStyle = 'rgba(0,0,0,0.13)'
    g.fillRect(0, 15, 16, 1)
    g.fillRect(15, 0, 1, 16)
    g.fillStyle = 'rgba(255,255,255,0.1)'
    g.fillRect(0, 0, 16, 1)
    g.fillRect(0, 0, 1, 16)
  })
  texCache.leaf = canvasTex(16, 16, (g, w, h) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const r = rng()
        const v = r < 0.15 ? 150 : r < 0.5 ? 200 : 240
        g.fillStyle = `rgb(${v},${v},${v})`
        g.fillRect(x, y, 1, 1)
      }
  })
  texCache.brick = canvasTex(16, 16, (g) => {
    noiseFill(g, 16, 16, 215, 30, rng)
    g.fillStyle = 'rgba(40,40,40,0.35)'
    for (let r = 0; r < 4; r++) {
      g.fillRect(0, r * 4 + 3, 16, 1)
      const off = r % 2 ? 4 : 0
      g.fillRect(off + 0, r * 4, 1, 3)
      g.fillRect(off + 8, r * 4, 1, 3)
    }
  })
  texCache.roof = canvasTex(16, 16, (g) => {
    noiseFill(g, 16, 16, 200, 25, rng)
    g.fillStyle = 'rgba(0,0,0,0.3)'
    for (let x = 0; x < 16; x += 4) g.fillRect(x, 0, 1, 16)
    g.fillStyle = 'rgba(255,255,255,0.15)'
    for (let x = 2; x < 16; x += 4) g.fillRect(x, 0, 1, 16)
    g.fillStyle = 'rgba(0,0,0,0.2)'
    g.fillRect(0, 15, 16, 1)
  })
  texCache.wood = canvasTex(16, 16, (g) => {
    noiseFill(g, 16, 16, 205, 30, rng)
    g.fillStyle = 'rgba(0,0,0,0.25)'
    for (let y = 3; y < 16; y += 4) g.fillRect(0, y, 16, 1)
  })
  // 窗户：8×8 窗格 / 128px 对应 16 格
  const lit = []
  for (let i = 0; i < 64; i++) lit.push(rng() < 0.55)
  texCache.window = canvasTex(64, 64, (g) => {
    g.fillStyle = '#e8e8e8'
    g.fillRect(0, 0, 64, 64)
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 8; j++) {
        const v = 120 + Math.floor(rng() * 50)
        g.fillStyle = `rgb(${v - 20},${v},${v + 30})`
        g.fillRect(i * 8 + 1, j * 8 + 1, 6, 6)
        g.fillStyle = 'rgba(255,255,255,0.35)'
        g.fillRect(i * 8 + 1, j * 8 + 1, 2, 1)
      }
  })
  texCache.windowLit = canvasTex(64, 64, (g) => {
    g.fillStyle = '#000'
    g.fillRect(0, 0, 64, 64)
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 8; j++) {
        if (!lit[i * 8 + j]) continue
        const warm = rng() < 0.7
        g.fillStyle = warm ? '#ffd890' : '#cfe8ff'
        g.fillRect(i * 8 + 1, j * 8 + 1, 6, 6)
      }
  })
  // 玻璃幕墙
  texCache.curtain = canvasTex(32, 32, (g) => {
    for (let y = 0; y < 32; y++) {
      const v = 150 + Math.floor((y / 32) * 70)
      g.fillStyle = `rgb(${v},${v},${v})`
      g.fillRect(0, y, 32, 1)
    }
    g.fillStyle = 'rgba(255,255,255,0.8)'
    for (let x = 0; x < 32; x += 8) g.fillRect(x, 0, 1, 32)
    for (let y = 0; y < 32; y += 8) g.fillRect(0, y, 32, 1)
  })
  texCache.curtainLit = canvasTex(32, 32, (g) => {
    g.fillStyle = '#000'
    g.fillRect(0, 0, 32, 32)
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        if (rng() < 0.45) continue
        g.fillStyle = rng() < 0.6 ? '#ffe2a8' : '#d8ecff'
        g.fillRect(i * 8 + 1, j * 8 + 1, 7, 7)
      }
  })
  texCache.road = canvasTex(32, 32, (g) => {
    noiseFill(g, 32, 32, 90, 18, rng)
    g.fillStyle = '#d8d8d0'
    g.fillRect(0, 0, 2, 32)
    g.fillRect(30, 0, 2, 32)
    g.fillStyle = '#e8c840'
    g.fillRect(15, 0, 2, 16)
  }, { mip: true })
  texCache.grass = canvasTex(16, 16, (g) => {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const v = 200 + Math.floor(rng() * 55)
        g.fillStyle = `rgb(${v},${v},${v})`
        g.fillRect(x, y, 1, 1)
      }
  })
  texCache.water = canvasTex(64, 64, (g) => {
    for (let y = 0; y < 64; y++)
      for (let x = 0; x < 64; x++) {
        const v = 128 + Math.sin(x * 0.4 + Math.sin(y * 0.3) * 2) * 40 + (rng() - 0.5) * 30
        g.fillStyle = `rgb(${v},${v},${v})`
        g.fillRect(x, y, 1, 1)
      }
  }, { linear: true })
  return texCache
}

// 材质注册：每种材质有 UV 缩放（世界单位 → 纹理重复）
let MATS = null
export const nightUniform = { value: 0 }

export function getMaterials() {
  if (MATS) return MATS
  const T = getTextures()
  const lam = (o) => new THREE.MeshLambertMaterial({ vertexColors: true, ...o })
  MATS = {
    block: { mat: lam({ map: T.block }), uv: 1 },
    stone: { mat: lam({ map: T.block }), uv: 0.5 },
    brick: { mat: lam({ map: T.brick }), uv: 1 },
    roof: { mat: lam({ map: T.roof }), uv: 1 },
    wood: { mat: lam({ map: T.wood }), uv: 1 },
    leaf: { mat: lam({ map: T.leaf }), uv: 0.7 },
    grass: { mat: lam({ map: T.grass }), uv: 0.5 },
    window: { mat: lam({ map: T.window, emissiveMap: T.windowLit, emissive: 0xffffff, emissiveIntensity: 0 }), uv: 1 / 8 },
    curtain: { mat: new THREE.MeshPhongMaterial({ vertexColors: true, map: T.curtain, emissiveMap: T.curtainLit, emissive: 0xffffff, emissiveIntensity: 0, shininess: 80, specular: 0x666666 }), uv: 1 / 8 },
    glass: { mat: new THREE.MeshPhongMaterial({ vertexColors: true, transparent: true, opacity: 0.45, shininess: 100, specular: 0xffffff, depthWrite: false }), uv: 1 },
    lamp: { mat: new THREE.MeshBasicMaterial({ vertexColors: true, color: 0x777777 }), uv: 1, night: 'lamp' },
    neon: { mat: new THREE.MeshBasicMaterial({ vertexColors: true, color: 0x888888 }), uv: 1, night: 'neon' },
    glow: { mat: new THREE.MeshBasicMaterial({ vertexColors: true }), uv: 1 },
    pond: { mat: new THREE.MeshPhongMaterial({ vertexColors: true, map: T.water, shininess: 90, specular: 0x9ab8d0 }), uv: 0.08 },
    sign: { mat: lam({}), uv: 1 }
  }
  MATS.lamp.mat.userData.noFog = false
  return MATS
}

export function updateNightMaterials(night) {
  const M = getMaterials()
  nightUniform.value = night
  M.window.mat.emissiveIntensity = night * 1.0
  M.curtain.mat.emissiveIntensity = night * 0.9
  const l = 0.45 + night * 0.65
  M.lamp.mat.color.setRGB(l, l, l)
  const n = 0.6 + night * 0.6
  M.neon.mat.color.setRGB(n, n, n)
}

// 文字招牌纹理
const signCache = new Map()
export function textTexture(text, opts = {}) {
  const key = text + JSON.stringify(opts)
  if (signCache.has(key)) return signCache.get(key)
  const { bg = '#1a1a1a', fg = '#ffd76a', font = 'bold', vertical = false, border = null, px = 64 } = opts
  const c = document.createElement('canvas')
  const g = c.getContext('2d')
  const chars = [...text]
  if (vertical) {
    c.width = px * 1.25
    c.height = px * chars.length * 1.1 + px * 0.4
  } else {
    g.font = `${font} ${px}px "Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif`
    c.width = Math.ceil(g.measureText(text).width + px * 0.8)
    c.height = px * 1.4
  }
  g.fillStyle = bg
  g.fillRect(0, 0, c.width, c.height)
  if (border) {
    g.strokeStyle = border
    g.lineWidth = px * 0.12
    g.strokeRect(px * 0.08, px * 0.08, c.width - px * 0.16, c.height - px * 0.16)
  }
  g.font = `${font} ${px}px "Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif`
  g.fillStyle = fg
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  if (vertical) chars.forEach((ch, i) => g.fillText(ch, c.width / 2, px * 0.75 + i * px * 1.1))
  else g.fillText(text, c.width / 2, c.height / 2 + px * 0.04)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  const res = { tex: t, aspect: c.width / c.height }
  signCache.set(key, res)
  return res
}

const signMatCache = new Map()
export function signMaterial(text, opts = {}) {
  const key = text + JSON.stringify(opts)
  if (signMatCache.has(key)) return signMatCache.get(key)
  const { tex, aspect } = textTexture(text, opts)
  const m = opts.glow
    ? new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })
    : new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25 })
  const r = { mat: m, aspect }
  signMatCache.set(key, r)
  return r
}
