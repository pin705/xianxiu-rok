// Ảnh chụp bản đồ giới (server gửi cho người đang mở bản đồ).
import { type Pos } from '../atlas.ts'
import { power } from '../core/stats.ts'
import { freshWorld, garrison, type Players, type World } from './base.ts'

export type Chron = { at: number; k: string; a: (string | number)[] } // biên niên của giới: chữ dựng ở client theo khoá
export type Seat = {
  pid: number
  name: string
  x: number
  y: number
  hall: number
  power: number
  npc: boolean
  shield: boolean
  cloud?: number
} // cloud: kiếp vân giáng lúc này
export type MapMarch = {
  pid: number
  id: number
  path: Pos[]
  startAt: number
  arriveAt: number
  returnAt: number
  foe?: string
  spot?: string
}
// Điểm khác mặc định: phe giữ (tên minh/tông môn), số đội đóng, mỏ còn bao nhiêu, yêu vương còn máu, lúc hồi
export type SpotView = { i: number; own?: string; n?: number; left?: number; hp?: number; until?: number }
export type MapSnap = { seats: Seat[]; marches: MapMarch[]; chron: Chron[]; spots: SpotView[] }

export function mapOf(ps: Players, now: number, npc: Set<number>, chron: Chron[], w: World = freshWorld()): MapSnap {
  const seats: Seat[] = [],
    marches: MapMarch[] = []
  for (const [pid, s] of ps) {
    if (!s.seat) continue
    const cloud = s.marches.find(m => m.target.kind === 'trib')?.arriveAt
    seats.push({
      pid,
      name: s.name,
      x: s.seat.x,
      y: s.seat.y,
      hall: s.levels.chuDien,
      power: Math.round(power(s)),
      npc: npc.has(pid),
      shield: s.shield > now,
      ...(cloud && { cloud }),
    })
    for (const m of s.marches)
      if (m.path)
        marches.push({
          pid,
          id: m.id,
          path: m.path,
          startAt: m.startAt,
          arriveAt: m.arriveAt,
          returnAt: m.returnAt,
          ...(m.foe && { foe: m.foe }),
          ...(m.spot && { spot: m.spot }),
        })
  }
  const spots: SpotView[] = []
  for (const [k, sp] of Object.entries(w.spots)) {
    const i = Number(k)
    const own =
      sp.own === undefined
        ? undefined
        : sp.own > 0
          ? w.allies[sp.own]
            ? `[${w.allies[sp.own].tag}] ${w.allies[sp.own].name}`
            : undefined
          : ps.get(-sp.own)?.name
    spots.push({ i, own, n: garrison(ps, i).length, left: sp.left, hp: sp.hp, until: sp.until })
  }
  return { seats, marches, chron, spots }
}
