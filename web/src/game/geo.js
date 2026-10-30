// 地理数据：真实经纬度 → 游戏坐标（1km ≈ 200格，核心区外按比例压缩）
import { distToSeg, pointInPoly } from './util.js'

export const ORIGIN = { lat: 23.118, lon: 113.3 }
export const UPK = 200 // units per km
const KX = 111.32 * Math.cos((ORIGIN.lat * Math.PI) / 180)
const KZ = 110.574
const CORE_R = 12
const COMPRESS = 0.35

export function compressFactor(lat, lon) {
  const ex = (lon - ORIGIN.lon) * KX, nz = (lat - ORIGIN.lat) * KZ
  const d = Math.hypot(ex, nz)
  return d > CORE_R ? COMPRESS : 1
}

export function project(lat, lon) {
  let ex = (lon - ORIGIN.lon) * KX
  let nz = (lat - ORIGIN.lat) * KZ
  const d = Math.hypot(ex, nz)
  if (d > CORE_R) {
    const f = (CORE_R + (d - CORE_R) * COMPRESS) / d
    ex *= f
    nz *= f
  }
  return { x: ex * UPK, z: -nz * UPK }
}

export function unproject(x, z) {
  let ex = x / UPK, nz = -z / UPK
  const d = Math.hypot(ex, nz)
  if (d > CORE_R) {
    const real = CORE_R + (d - CORE_R) / COMPRESS
    ex *= real / d
    nz *= real / d
  }
  return { lat: ORIGIN.lat + nz / KZ, lon: ORIGIN.lon + ex / KX }
}

const P = (lat, lon) => project(lat, lon)

// ---------------- 水系 ----------------
// [lat, lon, 宽度km]
const RIVER_DATA = [
  {
    name: '珠江西航道',
    pts: [[23.18, 113.226, 0.25], [23.15, 113.231, 0.3], [23.128, 113.2325, 0.32], [23.112, 113.234, 0.36], [23.1, 113.238, 0.55]]
  },
  {
    name: '珠江前航道',
    pts: [
      [23.1, 113.238, 0.55], [23.1042, 113.244, 0.34], [23.1045, 113.25, 0.3], [23.108, 113.256, 0.3], [23.112, 113.262, 0.28],
      [23.1145, 113.268, 0.25], [23.1155, 113.276, 0.25], [23.1158, 113.285, 0.28], [23.1135, 113.295, 0.3], [23.1105, 113.305, 0.32],
      [23.11, 113.315, 0.3], [23.1102, 113.3245, 0.3], [23.1095, 113.335, 0.32], [23.108, 113.345, 0.33], [23.106, 113.355, 0.35],
      [23.1045, 113.365, 0.35], [23.1035, 113.375, 0.38], [23.102, 113.39, 0.4], [23.099, 113.405, 0.42], [23.094, 113.425, 0.5],
      [23.09, 113.445, 0.6], [23.085, 113.47, 0.7]
    ]
  },
  {
    name: '珠江后航道',
    pts: [
      [23.1, 113.238, 0.5], [23.088, 113.24, 0.36], [23.075, 113.244, 0.36], [23.064, 113.252, 0.36], [23.058, 113.265, 0.4],
      [23.057, 113.28, 0.4], [23.058, 113.3, 0.4], [23.062, 113.32, 0.4], [23.067, 113.34, 0.4], [23.073, 113.36, 0.4],
      [23.08, 113.385, 0.45], [23.087, 113.41, 0.45], [23.094, 113.425, 0.5]
    ]
  },
  {
    name: '狮子洋',
    pts: [[23.085, 113.47, 0.7], [23.05, 113.5, 1.0], [22.98, 113.54, 1.6], [22.9, 113.575, 2.2], [22.82, 113.625, 3.5], [22.72, 113.69, 6], [22.6, 113.74, 9], [22.45, 113.78, 12]]
  },
  {
    name: '沙基涌',
    pts: [[23.1087, 113.2366, 0.035], [23.1088, 113.243, 0.035], [23.1087, 113.2492, 0.035], [23.106, 113.2512, 0.035]]
  },
  {
    name: '荔枝湾涌',
    pts: [[23.1262, 113.2318, 0.03], [23.1245, 113.234, 0.03], [23.1235, 113.2358, 0.03], [23.1215, 113.236, 0.03], [23.1155, 113.2355, 0.03], [23.1125, 113.2345, 0.03]]
  },
  {
    name: '蕉门水道',
    pts: [[22.86, 113.47, 0.6], [22.8, 113.52, 0.8], [22.74, 113.56, 1.0], [22.69, 113.6, 1.4], [22.64, 113.66, 2.0]]
  }
]

export const RIVERS = RIVER_DATA.map((r) => ({
  name: r.name,
  pts: r.pts.map(([lat, lon, w]) => {
    const p = P(lat, lon)
    return { x: p.x, z: p.z, w: w * UPK * compressFactor(lat, lon) }
  })
}))

// ---------------- 道路 ----------------
const ROAD_DATA = [
  { name: '中山路', w: 14, pts: [[23.1262, 113.232], [23.1264, 113.2455], [23.1268, 113.255], [23.1272, 113.264], [23.1274, 113.269], [23.1278, 113.28], [23.128, 113.29], [23.1282, 113.3], [23.128, 113.314], [23.1265, 113.322], [23.1255, 113.33], [23.125, 113.345], [23.1245, 113.36], [23.123, 113.38], [23.121, 113.41], [23.118, 113.45]] },
  { name: '东风路', w: 12, pts: [[23.1322, 113.236], [23.1322, 113.255], [23.132, 113.265], [23.1328, 113.28], [23.1336, 113.295], [23.134, 113.305], [23.1345, 113.314]] },
  { name: '环市路', w: 12, pts: [[23.1455, 113.25], [23.146, 113.265], [23.1462, 113.28], [23.147, 113.295], [23.148, 113.31], [23.1485, 113.33], [23.149, 113.35]] },
  { name: '天河路', w: 12, pts: [[23.1372, 113.305], [23.1366, 113.317], [23.136, 113.328], [23.1355, 113.34], [23.135, 113.36]] },
  { name: '广州大道', w: 14, pts: [[23.175, 113.323], [23.155, 113.32], [23.14, 113.317], [23.128, 113.314], [23.1205, 113.3128], [23.118, 113.312], [23.11, 113.311], [23.1042, 113.3112], [23.1, 113.311], [23.085, 113.312], [23.065, 113.313], [23.04, 113.315]] },
  { name: '解放路', w: 12, pts: [[23.152, 113.2625], [23.14, 113.2625], [23.1275, 113.263], [23.1178, 113.264]] },
  { name: '起义路-江南大道', w: 12, pts: [[23.1274, 113.2662], [23.119, 113.2672], [23.116, 113.268], [23.11, 113.269], [23.09, 113.2705], [23.06, 113.2715], [23.03, 113.272]] },
  { name: '人民路', w: 12, pts: [[23.146, 113.2565], [23.1268, 113.2572], [23.115, 113.2578], [23.108, 113.2562], [23.095, 113.256], [23.075, 113.255]] },
  { name: '新港路', w: 12, pts: [[23.1055, 113.27], [23.102, 113.29], [23.1008, 113.31], [23.1, 113.33], [23.099, 113.35], [23.0955, 113.37], [23.0945, 113.39], [23.093, 113.42]] },
  { name: '阅江路', w: 12, pts: [[23.1042, 113.3112], [23.1045, 113.316], [23.1045, 113.3245], [23.1045, 113.335], [23.1038, 113.348], [23.1025, 113.36]] },
  { name: '华南快速', w: 14, pts: [[23.175, 113.346], [23.14, 113.344], [23.125, 113.343], [23.1105, 113.342], [23.095, 113.342], [23.07, 113.343], [23.04, 113.343], [23.01, 113.341], [22.98, 113.345], [22.95, 113.35], [22.9, 113.36]] },
  { name: '南沙港快速', w: 14, pts: [[22.9, 113.36], [22.85, 113.42], [22.8, 113.48], [22.76, 113.54], [22.72, 113.585], [22.68, 113.605], [22.64, 113.625], [22.615, 113.632]] },
  { name: '白云大道', w: 12, pts: [[23.1462, 113.28], [23.16, 113.2815], [23.18, 113.276], [23.21, 113.272], [23.25, 113.27]] },
  { name: '广园路', w: 12, pts: [[23.1585, 113.255], [23.159, 113.2815], [23.16, 113.32], [23.161, 113.35], [23.163, 113.39]] },
  { name: '花城大道', w: 12, pts: [[23.1214, 113.3125], [23.1215, 113.33], [23.1213, 113.345]] },
  { name: '迎宾路', w: 12, pts: [[23.0015, 113.29], [23.002, 113.32], [23.0025, 113.345], [23.0, 113.38]] },
  { name: '大石-市桥', w: 10, pts: [[23.0025, 113.345], [22.97, 113.338], [22.94, 113.338], [22.92, 113.345]] },
  { name: '海心桥', w: 6, ped: true, pts: [[23.1121, 113.3245], [23.1102, 113.3245], [23.1083, 113.3245]] }
]

function offsetRiverRoad(name, riverName, fromX, toX, side, gap, w) {
  const r = RIVERS.find((v) => v.name === riverName)
  const pts = []
  for (let i = 0; i < r.pts.length; i++) {
    const p = r.pts[i]
    if (p.x < fromX || p.x > toX) continue
    const a = r.pts[Math.max(0, i - 1)], b = r.pts[Math.min(r.pts.length - 1, i + 1)]
    let dx = b.x - a.x, dz = b.z - a.z
    const l = Math.hypot(dx, dz) || 1
    dx /= l
    dz /= l
    // 左侧法线 (北岸: 河流向东流时法线指向 -z)
    const nx = dz * side, nz = -dx * side
    const off = p.w / 2 + gap
    pts.push({ x: p.x + nx * off, z: p.z + nz * off })
  }
  return { name, w, pts }
}

export const ROADS = ROAD_DATA.map((r) => ({ name: r.name, w: r.w, ped: !!r.ped, pts: r.pts.map(([lat, lon]) => P(lat, lon)) }))
{
  const a = P(23.11, 113.249).x, b = P(23.11, 113.3).x, c = P(23.11, 113.305).x, d = P(23.11, 113.36).x
  ROADS.push(offsetRiverRoad('沿江路', '珠江前航道', a, b, 1, 16, 12))
  ROADS.push(offsetRiverRoad('临江大道', '珠江前航道', c, d, 1, 9, 12))
}

// ---------------- 分区 ----------------
export const DISTRICTS = {
  yuexiu: { name: '越秀区', color: '#e8b04a', theme: '历史探索路线' },
  liwan: { name: '荔湾区', color: '#d9785b', theme: '岭南老广州' },
  tianhe: { name: '天河区', color: '#5b8fd9', theme: '现代都市探索' },
  haizhu: { name: '海珠区', color: '#9b6bd1', theme: '夜景模式' },
  baiyun: { name: '白云区', color: '#5fae6b', theme: '自然风光' },
  panyu: { name: '番禺区', color: '#d1a36b', theme: '欢乐番禺' },
  nansha: { name: '南沙区', color: '#4fb3b8', theme: '滨海湿地' },
  huangpu: { name: '黄埔区', color: '#8f9aa8', theme: '开发区' }
}

const SEEDS = [
  ['yuexiu', 23.13, 113.268], ['yuexiu', 23.14, 113.285], ['yuexiu', 23.1205, 113.278], ['yuexiu', 23.1165, 113.3], ['yuexiu', 23.132, 113.296],
  ['liwan', 23.125, 113.242], ['liwan', 23.107, 113.243], ['liwan', 23.08, 113.232], ['liwan', 23.135, 113.228], ['liwan', 23.118, 113.25],
  ['tianhe', 23.125, 113.33], ['tianhe', 23.145, 113.33], ['tianhe', 23.125, 113.37], ['tianhe', 23.16, 113.36], ['tianhe', 23.1165, 113.322],
  ['baiyun', 23.172, 113.28], ['baiyun', 23.2, 113.29], ['baiyun', 23.23, 113.27], ['baiyun', 23.18, 113.25], ['baiyun', 23.18, 113.31],
  ['panyu', 22.98, 113.35], ['panyu', 22.94, 113.36], ['panyu', 23.01, 113.32], ['panyu', 22.9, 113.4], ['panyu', 23.03, 113.29],
  ['nansha', 22.8, 113.55], ['nansha', 22.7, 113.58], ['nansha', 22.62, 113.62], ['nansha', 22.76, 113.5],
  ['huangpu', 23.11, 113.45], ['huangpu', 23.18, 113.45], ['huangpu', 23.14, 113.42]
].map(([id, lat, lon]) => ({ id, ...P(lat, lon) }))

// 海珠岛：前航道 + 后航道围合
const front = RIVERS.find((r) => r.name === '珠江前航道').pts
const back = RIVERS.find((r) => r.name === '珠江后航道').pts
const HAIZHU_POLY = []
for (const p of front) if (p.x <= back[back.length - 1].x + 1) HAIZHU_POLY.push([p.x, p.z])
for (let i = back.length - 1; i >= 0; i--) HAIZHU_POLY.push([back[i].x, back[i].z])

export function districtAt(x, z) {
  if (pointInPoly(x, z, HAIZHU_POLY)) return 'haizhu'
  let best = null, bd = Infinity
  for (const s of SEEDS) {
    const d = (s.x - x) ** 2 + (s.z - z) ** 2
    if (d < bd) { bd = d; best = s.id }
  }
  return best
}

// ---------------- 地形 ----------------
const HILLS = [
  // 越秀山
  [23.1405, 113.2645, 9, 70], [23.142, 113.27, 6, 60], [23.138, 113.2702, 5, 30],
  // 白云山
  [23.183, 113.297, 120, 220], [23.17, 113.292, 60, 200], [23.198, 113.301, 85, 230], [23.166, 113.297, 30, 150], [23.19, 113.31, 55, 180], [23.212, 113.305, 50, 200],
  // 大夫山
  [22.948, 113.332, 30, 160], [22.94, 113.322, 18, 120],
  // 南沙大角山（天后宫）
  [22.745, 113.618, 22, 90],
  // 番禺莲花山 / 零星丘陵
  [23.02, 113.36, 10, 90]
].map(([lat, lon, h, r]) => ({ ...P(lat, lon), h, r }))

export function rawHeight(x, z) {
  let h = 0
  for (const k of HILLS) {
    const dx = x - k.x, dz = z - k.z
    const d2 = dx * dx + dz * dz
    const r2 = k.r * k.r
    if (d2 < r2 * 6) h += k.h * Math.exp(-d2 / (r2 * 0.6))
  }
  if (h > 1) {
    h += (Math.sin(x * 0.07) * Math.cos(z * 0.05) + Math.sin((x + z) * 0.031)) * Math.min(4, h * 0.08)
  }
  return h < 0.6 ? 0 : h
}

// 方块化地形高度（整数台阶）
export function terrainHeight(x, z) {
  let h = rawHeight(x, z)
  if (h > 0) {
    const r = roadAt(x, z, 18)
    if (r) h *= Math.min(1, Math.max(0, (r.d - r.hw + 18) / 18) ** 2)
  }
  return Math.floor(h)
}

// 绿地 / 公园 [lat, lon, 半径units]
export const PARKS = [
  [23.1405, 113.267, 110], [23.137, 113.2705, 35], [23.135, 113.265, 35], [23.1525, 113.2895, 60], [23.122, 113.2385, 40],
  [23.1125, 113.3245, 45], [23.1185, 113.3245, 35], [23.1146, 113.3015, 70], [23.0965, 113.2985, 80], [23.01, 113.31, 160],
  [22.948, 113.332, 260], [22.62, 113.64, 320], [22.752, 113.62, 120], [23.14, 113.3235, 40]
].map(([lat, lon, r]) => ({ ...P(lat, lon), r }))

export function isPark(x, z) {
  for (const p of PARKS) if ((p.x - x) ** 2 + (p.z - z) ** 2 < p.r * p.r) return true
  return false
}

// ---------------- 空间索引 ----------------
const GRID = 64
function buildSegGrid(lines, widthOf) {
  const grid = new Map()
  for (const line of lines) {
    for (let i = 1; i < line.pts.length; i++) {
      const a = line.pts[i - 1], b = line.pts[i]
      const w = Math.max(widthOf(line, a), widthOf(line, b)) / 2 + 20
      const seg = { ax: a.x, az: a.z, bx: b.x, bz: b.z, wa: widthOf(line, a), wb: widthOf(line, b), line }
      const x0 = Math.floor((Math.min(a.x, b.x) - w) / GRID), x1 = Math.floor((Math.max(a.x, b.x) + w) / GRID)
      const z0 = Math.floor((Math.min(a.z, b.z) - w) / GRID), z1 = Math.floor((Math.max(a.z, b.z) + w) / GRID)
      for (let gx = x0; gx <= x1; gx++)
        for (let gz = z0; gz <= z1; gz++) {
          const k = gx + ',' + gz
          let arr = grid.get(k)
          if (!arr) grid.set(k, (arr = []))
          arr.push(seg)
        }
    }
  }
  return grid
}

const riverGrid = buildSegGrid(RIVERS, (l, p) => p.w)
const roadGrid = buildSegGrid(ROADS, (l) => l.w)

function querySeg(grid, x, z, pad = 0) {
  const arr = grid.get(Math.floor(x / GRID) + ',' + Math.floor(z / GRID))
  if (!arr) return null
  let best = null
  for (const s of arr) {
    const { d, t } = distToSeg(x, z, s.ax, s.az, s.bx, s.bz)
    const hw = (s.wa + (s.wb - s.wa) * t) / 2 + pad
    if (d < hw && (!best || d - hw < best.m)) best = { seg: s, d, hw, m: d - hw, line: s.line }
  }
  return best
}

// 陆地覆盖（岛屿、码头等）: 矩形 {x0,z0,x1,z1}
export const LAND_OVERRIDES = []
export function addLandOverride(x0, z0, x1, z1) {
  LAND_OVERRIDES.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1) })
}
function inLandOverride(x, z) {
  for (const r of LAND_OVERRIDES) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return true
  return false
}

export function riverAt(x, z, pad = 0) {
  return querySeg(riverGrid, x, z, pad)
}
export function isWater(x, z) {
  return !!querySeg(riverGrid, x, z) && !inLandOverride(x, z)
}
export function roadAt(x, z, pad = 0) {
  return querySeg(roadGrid, x, z, pad)
}
export function isBridge(x, z) {
  return isWater(x, z) && !!querySeg(roadGrid, x, z)
}
// 玩家/NPC 是否可在此处站立（水面上只有桥可走）
export function walkableWater(x, z) {
  if (!isWater(x, z)) return true
  return !!querySeg(roadGrid, x, z, -0.5)
}

export const WATER_Y = -0.7
export const BRIDGE_Y = 0.35

// ---------------- 交通 ----------------
export const BUS_ROUTE = {
  name: '观光巴士 1 路',
  pts: [
    [23.1045, 113.3245], [23.1045, 113.316], [23.1042, 113.3112], [23.11, 113.311], [23.118, 113.312], [23.1205, 113.3128],
    [23.128, 113.314], [23.1282, 113.3], [23.128, 113.29], [23.1278, 113.28], [23.1274, 113.269], [23.1272, 113.264],
    [23.1268, 113.255], [23.1264, 113.2455]
  ].map(([a, b]) => P(a, b)),
  stops: [
    { name: '广州塔', lat: 23.1045, lon: 113.3245 },
    { name: '珠江新城', lat: 23.1205, lon: 113.3128 },
    { name: '北京路', lat: 23.1274, lon: 113.269 },
    { name: '陈家祠', lat: 23.1264, lon: 113.2455 }
  ].map((s) => ({ ...s, ...P(s.lat, s.lon) }))
}

export const METRO_STATIONS = [
  { id: 'gzt', name: '广州塔站', lines: ['3号线', 'APM'], lat: 23.1048, lon: 113.329 },
  { id: 'zjxc', name: '珠江新城站', lines: ['3号线', '5号线'], lat: 23.1232, lon: 113.3195 },
  { id: 'tyzx', name: '体育中心站', lines: ['1号线'], lat: 23.1372, lon: 113.319 },
  { id: 'gzdz', name: '广州东站', lines: ['1号线', '3号线'], lat: 23.1495, lon: 113.3195 },
  { id: 'gyq', name: '公园前站', lines: ['1号线', '2号线'], lat: 23.1288, lon: 113.2655 },
  { id: 'jnt', name: '纪念堂站', lines: ['2号线'], lat: 23.1308, lon: 113.2615 },
  { id: 'yxgy', name: '越秀公园站', lines: ['2号线'], lat: 23.1365, lon: 113.2605 },
  { id: 'cjc', name: '陈家祠站', lines: ['1号线', '8号线'], lat: 23.1255, lon: 113.2505 },
  { id: 'hs', name: '黄沙站', lines: ['1号线', '6号线'], lat: 23.1118, lon: 113.2475 },
  { id: 'cyl', name: '长寿路站', lines: ['1号线'], lat: 23.1195, lon: 113.2505 },
  { id: 'hzgc', name: '海珠广场站', lines: ['2号线', '6号线'], lat: 23.1195, lon: 113.2702 },
  { id: 'pz', name: '琶洲站', lines: ['8号线'], lat: 23.0965, lon: 113.3605 },
  { id: 'zsdx', name: '中大站', lines: ['8号线'], lat: 23.1005, lon: 113.294 },
  { id: 'th', name: '同和站', lines: ['3号线'], lat: 23.1675, lon: 113.2855 },
  { id: 'hxcl', name: '汉溪长隆站', lines: ['3号线', '7号线'], lat: 23.0045, lon: 113.3395 },
  { id: 'sq', name: '市桥站', lines: ['3号线'], lat: 22.9575, lon: 113.346 },
  { id: 'jm', name: '蕉门站', lines: ['4号线'], lat: 22.7545, lon: 113.606 },
  { id: 'nsk', name: '南沙客运港站', lines: ['4号线'], lat: 22.633, lon: 113.629 }
].map((s) => ({ ...s, ...P(s.lat, s.lon) }))

// 珠江夜游航线（沿前航道）
export function cruiseRoute() {
  const pts = front
  const out = []
  for (const p of pts) {
    if (p.x < P(23.115, 113.268).x || p.x > P(23.11, 113.35).x) continue
    out.push({ x: p.x, z: p.z })
  }
  return out
}

export const PIERS = [
  { id: 'tianzi', name: '天字码头', lat: 23.1162, lon: 113.2745 },
  { id: 'gzt', name: '广州塔码头', lat: 23.1092, lon: 113.3205 }
].map((s) => ({ ...s, ...P(s.lat, s.lon) }))

export function worldBounds() {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const s of SEEDS) {
    x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); z0 = Math.min(z0, s.z); z1 = Math.max(z1, s.z)
  }
  return { x0: x0 - 600, x1: x1 + 600, z0: z0 - 600, z1: z1 + 600 }
}

export { HAIZHU_POLY }
