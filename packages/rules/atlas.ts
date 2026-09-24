// Bản đồ giới (P3): 150 × 150 ô sinh từ seed — thuần, tất định, client và server dựng ra y hệt nhau.
// Lưới 5 × 5 ô 30, mỗi ô một tâm xê dịch ±6 → 25 vùng Voronoi (vùng lồi: đường thẳng giữa hai điểm cùng vùng không ra khỏi vùng).
// Vòng ngoài 16 vùng, vòng giữa 8, tâm 1. Giữa hai vùng kề nhau là một cổng (trận nhãn), mở theo pha mùa — không theo chủ.
// Điểm trên bản đồ: linh mạch, mỏ, yêu vương, cổng, Thiên Môn ở tâm. Đi 12 giây mỗi ô.
import { rng } from './combat.ts'
import { TIDE_EVERY, TIDE_LEN } from './data.ts'

export const MAP_W = 150
export const GRID = 5
export const CELL = MAP_W / GRID
export const JITTER = 6
export const TILE_TIME = 12_000 // ms đi một ô
// Pha mùa theo ngày của giới: Khai giới (chưa mở cổng nào) / Tranh mạch (cổng vòng ngoài) / Trận nhãn (vào vòng giữa) / Phi thăng (vào tâm)
export const PHASES = [0, 5, 14, 35]
export const SEASON_DAYS = 49

export type Ring = 0 | 1 | 2 // ngoài · giữa · tâm
export type Region = { i: number; cx: number; cy: number; ring: Ring }
export type Gate = { i: number; a: number; b: number; x: number; y: number; phase: number }
export type PointKind = 'vein' | 'mine' | 'boss' | 'gate' | 'heaven'
export type Point = { i: number; kind: PointKind; region: number; x: number; y: number; lv: number }
export type Atlas = { seed: number; regions: Region[]; gates: Gate[]; points: Point[]; tiles: Uint8Array }
export type Pos = { x: number; y: number }

// số điểm mỗi vùng theo vòng [ngoài, giữa, tâm]
const PER: Record<'vein' | 'mine' | 'boss', [number, number, number]> = {
  vein: [2, 3, 1],
  mine: [6, 6, 0],
  boss: [0, 1, 1],
}

const ringOf = (gx: number, gy: number): Ring =>
  gx === 2 && gy === 2 ? 2 : gx === 0 || gy === 0 || gx === GRID - 1 || gy === GRID - 1 ? 0 : 1
export const dist = (a: Pos, b: Pos) => Math.hypot(a.x - b.x, a.y - b.y)

const cache = new Map<number, Atlas>()
export function atlas(seed: number): Atlas {
  const hit = cache.get(seed)
  if (hit) return hit
  const rand = rng(seed ^ 0x5eed)
  const regions: Region[] = []
  for (let gy = 0; gy < GRID; gy++)
    for (let gx = 0; gx < GRID; gx++) {
      const ring = ringOf(gx, gy)
      const j = ring === 2 ? 0 : JITTER // Thiên Môn nằm đúng tâm giới
      regions.push({
        i: regions.length,
        cx: Math.round(gx * CELL + CELL / 2 + (rand() * 2 - 1) * j),
        cy: Math.round(gy * CELL + CELL / 2 + (rand() * 2 - 1) * j),
        ring,
      })
    }
  // mỗi ô thuộc vùng có tâm gần nhất
  const tiles = new Uint8Array(MAP_W * MAP_W)
  for (let y = 0; y < MAP_W; y++)
    for (let x = 0; x < MAP_W; x++) {
      let best = 0,
        bd = Infinity
      for (const r of regions) {
        const d = (r.cx - x) ** 2 + (r.cy - y) ** 2
        if (d < bd) {
          bd = d
          best = r.i
        }
      }
      tiles[y * MAP_W + x] = best
    }
  const regionAt = (x: number, y: number) =>
    tiles[Math.min(MAP_W - 1, Math.max(0, y)) * MAP_W + Math.min(MAP_W - 1, Math.max(0, x))]
  // cổng: giữa hai vùng kề (lưới 4 hướng), ở trung điểm hai tâm (nằm trên đường biên Voronoi của hai vùng)
  const gates: Gate[] = []
  for (const r of regions) {
    const gx = r.i % GRID,
      gy = Math.floor(r.i / GRID)
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
    ]) {
      if (gx + dx >= GRID || gy + dy >= GRID) continue
      const o = regions[(gy + dy) * GRID + gx + dx]
      const x = Math.round((r.cx + o.cx) / 2),
        y = Math.round((r.cy + o.cy) / 2)
      if (![r.i, o.i].includes(regionAt(x, y))) continue // biên lệch (hiếm): không mở cổng ở cặp này
      const rings = [r.ring, o.ring].sort()
      const phase = rings[1] === 2 ? 3 : rings[0] === 0 && rings[1] === 0 ? 1 : 2
      gates.push({ i: gates.length, a: r.i, b: o.i, x, y, phase })
    }
  }
  // điểm: rải ngẫu nhiên trong vùng, cách tâm, cổng, biên vùng và nhau đủ xa
  const points: Point[] = []
  const add = (kind: PointKind, region: number, x: number, y: number, lv: number) =>
    points.push({ i: points.length, kind, region, x, y, lv })
  for (const g of gates) add('gate', g.a, g.x, g.y, g.phase)
  add('heaven', regions[12].i, regions[12].cx, regions[12].cy, 3)
  const inside = (x: number, y: number, region: number, pad: number) => {
    for (let dy = -pad; dy <= pad; dy++)
      for (let dx = -pad; dx <= pad; dx++) if (regionAt(x + dx, y + dy) !== region) return false
    return x >= pad && y >= pad && x < MAP_W - pad && y < MAP_W - pad
  }
  // thử tối đa 200 chỗ quanh tâm vùng: lọt hẳn trong vùng, không sát tâm, không sát điểm khác
  const place = (kind: keyof typeof PER, r: Region) => {
    for (let tries = 0; tries < 200; tries++) {
      const x = Math.round(r.cx + (rand() * 2 - 1) * CELL * 0.6),
        y = Math.round(r.cy + (rand() * 2 - 1) * CELL * 0.6)
      if (!inside(x, y, r.i, 2) || dist({ x, y }, { x: r.cx, y: r.cy }) < (r.ring === 2 ? 5 : 2)) continue
      if (points.some(p => dist(p, { x, y }) < 5)) continue
      add(kind, r.i, x, y, r.ring + 1)
      return
    }
  }
  for (const r of regions)
    for (const kind of ['boss', 'vein', 'mine'] as const) for (let k = 0; k < PER[kind][r.ring]; k++) place(kind, r)
  const a = { seed, regions, gates, points, tiles }
  cache.set(seed, a)
  return a
}

export const regionOf = (a: Atlas, p: Pos) => a.tiles[Math.round(p.y) * MAP_W + Math.round(p.x)]
export const dayIn = (openedAt: number, now: number) => Math.max(0, Math.floor((now - openedAt) / 86_400_000))
export const phaseOf = (day: number) => PHASES.filter(d => day >= d).length - 1

// Đường đi qua các cổng đang mở (Dijkstra trên cổng — ≤ 40 nút). Trong một vùng đi thẳng (vùng lồi).
// Trả về các điểm dừng [đi, …cổng, tới] và độ dài (ô); null nếu chưa có đường (cổng chưa mở).
export function route(a: Atlas, from: Pos, to: Pos, phase: number): { path: Pos[]; len: number } | null {
  const ra = regionOf(a, from),
    rb = regionOf(a, to)
  if (ra === rb) return { path: [from, to], len: dist(from, to) }
  const open = a.gates.filter(g => g.phase <= phase)
  const best = new Map<number, number>(),
    prev = new Map<number, number>()
  const q = open.filter(g => g.a === ra || g.b === ra)
  for (const g of q) best.set(g.i, dist(from, g))
  const done = new Set<number>()
  let end: { g: number; len: number } | null = null
  while (q.length) {
    q.sort((x, y) => best.get(x.i)! - best.get(y.i)!)
    const g = q.shift()!
    if (done.has(g.i)) continue
    done.add(g.i)
    const d = best.get(g.i)!
    if ((g.a === rb || g.b === rb) && (!end || d + dist(g, to) < end.len)) end = { g: g.i, len: d + dist(g, to) }
    for (const h of open) {
      if (done.has(h.i) || ![h.a, h.b].some(r => r === g.a || r === g.b)) continue
      const nd = d + dist(g, h)
      if (nd < (best.get(h.i) ?? Infinity)) {
        best.set(h.i, nd)
        prev.set(h.i, g.i)
        q.push(h)
      }
    }
  }
  if (!end) return null
  const via: Pos[] = []
  for (let g: number | undefined = end.g; g !== undefined; g = prev.get(g))
    via.unshift({ x: a.gates[g].x, y: a.gates[g].y })
  return { path: [from, ...via, to], len: end.len }
}

// Chỗ đặt tông môn mới: vùng ngoài ít người nhất, ô trống cách tông môn khác ≥ 3 ô và cách mọi điểm ≥ 3 ô
export function spawn(a: Atlas, taken: Pos[], rand: () => number): Pos | null {
  const outer = a.regions.filter(r => r.ring === 0)
  const count = (r: Region) => taken.filter(p => regionOf(a, p) === r.i).length
  for (const r of [...outer].sort((x, y) => count(x) - count(y) || x.i - y.i))
    for (let tries = 0; tries < 300; tries++) {
      const p = {
        x: Math.round(r.cx + (rand() * 2 - 1) * CELL * 0.55),
        y: Math.round(r.cy + (rand() * 2 - 1) * CELL * 0.55),
      }
      if (p.x < 2 || p.y < 2 || p.x >= MAP_W - 2 || p.y >= MAP_W - 2 || regionOf(a, p) !== r.i) continue
      if (taken.some(t => dist(t, p) < 3) || a.points.some(t => dist(t, p) < 3)) continue
      return p
    }
  return null
}

// Thời tiết theo vùng, đổi mỗi 3 giờ
export type Weather = 'clear' | 'mist' | 'rain' | 'snow'
export function weather(a: Atlas, region: number, t: number): Weather {
  const r = rng((a.seed * 31 + region * 997 + Math.floor(t / 10_800_000)) >>> 0)()
  const cold = a.regions[region].cy < MAP_W * 0.25 // phương bắc lạnh
  return r < 0.55 ? 'clear' : r < 0.75 ? 'mist' : cold ? 'snow' : 'rain'
}

// Linh triều: mỗi TIDE_EVERY một vùng (theo seed + số chu kỳ) có triều trong TIDE_LEN đầu chu kỳ
export function tide(a: Atlas, t: number) {
  const cycle = Math.floor(t / TIDE_EVERY)
  const start = cycle * TIDE_EVERY
  const region = Math.floor(rng((a.seed * 7919 + cycle * 104729) >>> 0)() * a.regions.length)
  return { cycle, region, start, end: start + TIDE_LEN, active: t < start + TIDE_LEN }
}
