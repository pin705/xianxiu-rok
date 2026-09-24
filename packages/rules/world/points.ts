// Điểm trên bản đồ giới: trạng thái lúc now (mỏ còn bao nhiêu, yêu vương hồi chưa), phe giữ, điểm mùa khi giữ.
// Dùng chung cho các tính năng của world/ (như base.ts, fight.ts).
import { type Atlas, type Point, type PointKind } from '../atlas.ts'
import { type Side } from '../combat.ts'
import { mob } from '../core/battle.ts'
import { HOUR } from '../core/util.ts'
import { BEATS, BOSSES, MINE_STOCK, SEASON_GATE, SEASON_HEAVEN, SEASON_VEIN, TYPES } from '../data.ts'
import { setSpot, type MapCtx, type Players, type Spot, type Task, type World } from './base.ts'

export const TASK_OF: Record<PointKind, Task> = {
  vein: 'take',
  gate: 'take',
  heaven: 'take',
  mine: 'gather',
  boss: 'hit',
}

// Trạng thái điểm lúc now (mỏ cạn / yêu vương chết đã tới giờ hồi thì như mới)
export function spotOf(w: World, map: MapCtx, i: number, now: number): Spot {
  const p = map.atlas.points[i]
  const sp = w.spots[i] ?? {}
  if (p.kind === 'mine')
    return sp.until && sp.until <= now
      ? { left: MINE_STOCK[p.lv - 1] }
      : { ...sp, left: sp.left ?? MINE_STOCK[p.lv - 1] }
  if (p.kind === 'boss')
    return sp.until && sp.until <= now ? { hp: BOSSES[p.lv]!.str } : { ...sp, hp: sp.hp ?? BOSSES[p.lv]?.str }
  return sp
}
// Một "lát" của yêu vương ở điểm i: đội đánh gặp đúng chừng này (client dùng để ước lượng tỉ lệ thắng)
export function bossSlice(a: Atlas, i: number): Side | null {
  const p = a.points[i],
    boss = p && BOSSES[p.lv]
  if (!boss || p.kind !== 'boss') return null
  const type = TYPES[i % TYPES.length]
  return mob(
    boss.str / boss.slices,
    boss.tier,
    [
      [type, 0.5],
      [BEATS[type], 0.3],
      [BEATS[BEATS[type]], 0.2],
    ],
    1 + p.lv * 10,
  )
}

// Điểm mùa mỗi giờ giữ một điểm: linh mạch (theo cấp), trận nhãn, Thiên Môn; mỏ và yêu vương không tính
const SEASON_RATE: Partial<Record<PointKind, number>> = { gate: SEASON_GATE, heaven: SEASON_HEAVEN }
export const seasonRate = (p: Point) => (p.kind === 'vein' ? (SEASON_VEIN[p.lv - 1] ?? 0) : (SEASON_RATE[p.kind] ?? 0))
export const bank = (w: World, side: number, pts: number): World =>
  pts > 0 ? { ...w, pts: { ...w.pts, [side]: (w.pts[side] ?? 0) + pts } } : w
// Đặt lại điểm i lúc at; đổi phe giữ thì chốt điểm mùa cho phe cũ theo số giờ đã giữ
export function hold(w: World, map: MapCtx | undefined, i: number, sp: Spot, at: number): World {
  const old = w.spots[i]
  const next = setSpot(w, i, sp)
  if (!map || old?.own === undefined || old.own === sp.own) return next
  return bank(next, old.own, ((at - (old.since ?? at)) / HOUR) * seasonRate(map.atlas.points[i]))
}
// Điểm mùa lúc now: đã chốt + phần đang giữ
export function seasonPts(w: World, map: MapCtx, now: number): Record<number, number> {
  const pts = { ...w.pts }
  for (const [k, sp] of Object.entries(w.spots))
    if (sp.own !== undefined && sp.since !== undefined)
      pts[sp.own] = (pts[sp.own] ?? 0) + (Math.max(0, now - sp.since) / HOUR) * seasonRate(map.atlas.points[Number(k)])
  return pts
}
export type SeasonRow = { side: number; name: string; pts: number } // side > 0: tiên minh; < 0: người đi một mình
export function seasonBoard(w: World, ps: Players, map: MapCtx, now: number): SeasonRow[] {
  const name = (side: number) =>
    side > 0 ? w.allies[side] && `[${w.allies[side].tag}] ${w.allies[side].name}` : ps.get(-side)?.name
  return Object.entries(seasonPts(w, map, now))
    .map(([k, pts]) => ({ side: Number(k), name: name(Number(k)) ?? '', pts: Math.floor(pts) }))
    .filter(r => r.name && r.pts > 0)
    .sort((a, b) => b.pts - a.pts || a.side - b.side)
}
