// Mê vụ (Fog of War của RoK): bản đồ sương riêng của mỗi tông môn trên bản đồ giới. Ô sương FOG_CELL × FOG_CELL ô bản đồ
// (FOG_N × FOG_N ô sương); đã khai là bitset theo hàng. Linh điểu đang bay chưa gộp vào bitset: ô sương tan lúc at.
import { MAP_W } from '../atlas.ts'
import { CRANE_MAX, CRANE_PER, FOG_CELL, FOG_HOME } from '../data.ts'
import { type Fog, type State } from './types.ts'

export const FOG_N = MAP_W / FOG_CELL
export const cellOf = (p: { x: number; y: number }) => ({
  cx: Math.floor(p.x / FOG_CELL),
  cy: Math.floor(p.y / FOG_CELL),
})
const inside = (cx: number, cy: number) => cx >= 0 && cy >= 0 && cx < FOG_N && cy < FOG_N
// Các ô sương trong vuông bán kính r quanh (cx, cy)
export function around(cx: number, cy: number, r: number): number[] {
  const out: number[] = []
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++) if (inside(x, y)) out.push(y * FOG_N + x)
  return out
}
export const lift = (rows: number[], cells: number[]) => {
  const next = [...rows]
  for (const c of cells) next[Math.floor(c / FOG_N)] |= 1 << (c % FOG_N)
  return next
}
// Mê vụ của tông môn (chưa từng khai: chỉ quanh chỗ ngồi)
export function fogOf(s: State): Fog {
  if (s.fog) return s.fog
  const rows = Array.from({ length: FOG_N }, () => 0)
  if (!s.seat) return { rows, fly: [] }
  const { cx, cy } = cellOf(s.seat)
  return { rows: lift(rows, around(cx, cy, FOG_HOME)), fly: [] }
}
// Ô sương (cx, cy) đã tan lúc t chưa
export const clear = (f: Fog, cx: number, cy: number, t: number) =>
  inside(cx, cy) && (((f.rows[cy] >>> cx) & 1) === 1 || f.fly.some(x => x.at <= t && x.cells.includes(cy * FOG_N + cx)))
// Gộp điểu đã tới nơi vào bitset, bỏ điểu đã về
export function fold(f: Fog, t: number): Fog {
  const landed = f.fly.filter(x => x.at <= t)
  if (!landed.length) return f
  return {
    rows: lift(
      f.rows,
      landed.flatMap(x => x.cells),
    ),
    fly: f.fly.filter(x => x.back > t).map(x => ({ ...x, cells: x.at <= t ? [] : x.cells })),
  }
}
export const cranes = (s: State) => Math.min(CRANE_MAX, 1 + Math.floor(s.levels.chuDien / CRANE_PER))
export const cranesOut = (f: Fog, t: number) => f.fly.filter(x => x.back > t).length
