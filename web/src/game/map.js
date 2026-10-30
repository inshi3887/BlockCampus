// 地图底图渲染（分区着色、珠江、道路、山体）
import { RIVERS, ROADS, DISTRICTS, districtAt, rawHeight, isPark, worldBounds, BUS_ROUTE, METRO_STATIONS } from './geo.js'

export function renderBaseMap() {
  const B = worldBounds()
  const W = B.x1 - B.x0, H = B.z1 - B.z0
  const S = 2048 / Math.max(W, H)
  const cw = Math.ceil(W * S), ch = Math.ceil(H * S)
  const c = document.createElement('canvas')
  c.width = cw
  c.height = ch
  const g = c.getContext('2d')
  g.fillStyle = '#dcd6c8'
  g.fillRect(0, 0, cw, ch)
  const cell = 4
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
  const dcol = {}
  for (const k in DISTRICTS) dcol[k] = hex(DISTRICTS[k].color)
  const img = g.createImageData(cw, ch)
  for (let py = 0; py < ch; py += cell)
    for (let px = 0; px < cw; px += cell) {
      const x = B.x0 + (px + cell / 2) / S, z = B.z0 + (py + cell / 2) / S
      const d = districtAt(x, z)
      let [r, gg, b] = dcol[d] || [200, 200, 200]
      // 与米色底混合
      r = r * 0.28 + 228 * 0.72
      gg = gg * 0.28 + 222 * 0.72
      b = b * 0.28 + 208 * 0.72
      const h = rawHeight(x, z)
      if (h > 1) {
        const k = Math.min(1, h / 140)
        r = 150 - k * 60
        gg = 190 - k * 60
        b = 120 - k * 50
      } else if (isPark(x, z)) {
        r = 168; gg = 206; b = 140
      }
      for (let yy = 0; yy < cell && py + yy < ch; yy++)
        for (let xx = 0; xx < cell && px + xx < cw; xx++) {
          const i = ((py + yy) * cw + px + xx) * 4
          img.data[i] = r
          img.data[i + 1] = gg
          img.data[i + 2] = b
          img.data[i + 3] = 255
        }
    }
  g.putImageData(img, 0, 0)
  const tx = (x) => (x - B.x0) * S, tz = (z) => (z - B.z0) * S
  // 分区边界（相邻格不同区）
  g.fillStyle = 'rgba(90,70,60,0.35)'
  const step = 8
  let prevRow = null
  for (let py = 0; py < ch; py += step) {
    let prev = null
    const row = []
    for (let px = 0; px < cw; px += step) {
      const d = districtAt(B.x0 + px / S, B.z0 + py / S)
      row.push(d)
      if ((prev && prev !== d) || (prevRow && prevRow[row.length - 1] !== d)) g.fillRect(px - 1, py - 1, 2, 2)
      prev = d
    }
    prevRow = row
  }
  // 江河
  g.strokeStyle = '#6fa8d8'
  g.lineCap = 'round'
  g.lineJoin = 'round'
  for (const r of RIVERS) {
    for (let i = 1; i < r.pts.length; i++) {
      const a = r.pts[i - 1], b = r.pts[i]
      g.lineWidth = Math.max(1.5, ((a.w + b.w) / 2) * S)
      g.beginPath()
      g.moveTo(tx(a.x), tz(a.z))
      g.lineTo(tx(b.x), tz(b.z))
      g.stroke()
    }
  }
  // 道路
  for (const pass of [0, 1]) {
    for (const r of ROADS) {
      g.strokeStyle = pass === 0 ? '#9a9080' : r.ped ? '#f0e8d0' : r.w >= 14 ? '#ffd88a' : '#ffffff'
      g.lineWidth = Math.max(1, r.w * S) + (pass === 0 ? 1.5 : 0)
      g.beginPath()
      r.pts.forEach((p, i) => (i ? g.lineTo(tx(p.x), tz(p.z)) : g.moveTo(tx(p.x), tz(p.z))))
      g.stroke()
    }
  }
  // 巴士线路
  g.setLineDash([6, 4])
  g.strokeStyle = '#d8302a'
  g.lineWidth = 2
  g.beginPath()
  BUS_ROUTE.pts.forEach((p, i) => (i ? g.lineTo(tx(p.x), tz(p.z)) : g.moveTo(tx(p.x), tz(p.z))))
  g.stroke()
  g.setLineDash([])
  return { canvas: c, bounds: B, scale: S }
}

export function districtLabels() {
  // 各区标签位置（大致中心）
  const pos = {
    yuexiu: [23.133, 113.272], liwan: [23.115, 113.238], tianhe: [23.14, 113.355], haizhu: [23.085, 113.31],
    baiyun: [23.2, 113.27], panyu: [22.96, 113.37], nansha: [22.72, 113.56], huangpu: [23.13, 113.45]
  }
  return pos
}
