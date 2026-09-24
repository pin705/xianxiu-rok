// Điểm mùa (giữ điểm trên bản đồ theo giờ), bảng mùa, hết mùa; top sự kiện tuần.
import { type Point } from '../atlas.ts'
import { HOUR } from '../core/util.ts'
import { ASCEND, ASCEND_HALL, EVENT_TOP, MAX_LEVEL, SEASON_GATE, SEASON_HEAVEN, SEASON_VEIN } from '../data.ts'
import { mail } from '../sect/inbox.ts'
import { seasonEnd } from '../sect/rebirth.ts'
import { freshWorld, setSpot, sideKey, type MapCtx, type Players, type Spot, type World } from './base.ts'
import { unsold } from './market.ts'

export const seasonRate = (p: Point) =>
  p.kind === 'vein'
    ? (SEASON_VEIN[p.lv - 1] ?? 0)
    : p.kind === 'gate'
      ? SEASON_GATE
      : p.kind === 'heaven'
        ? SEASON_HEAVEN
        : 0
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

// Hết mùa cho cả giới (trừ skip: NPC, server làm mới riêng): minh đứng đầu (người từ ASCEND_HALL) và ai ở tầng cao nhất phi thăng,
// còn lại luân hồi một kiếp; ai cũng nhận thư kết quả. Phần chung làm mới, giữ tiên minh (bỏ các việc đang nhờ giúp).
export function endSeason(
  ps: Players,
  w: World,
  map: MapCtx,
  now: number,
  season: number,
  skip: Set<number>,
): { changed: Players; world: World; top: SeasonRow[] } {
  const top = seasonBoard(w, ps, map, now)
  const first = top.find(r => r.side > 0)?.side
  const rank = new Map(top.map((r, k) => [r.side, k + 1]))
  const changed: Players = new Map()
  for (const [pid, s] of ps) {
    if (skip.has(pid)) continue
    const side = sideKey(w, pid)
    const up = (side === first && s.levels.chuDien >= ASCEND_HALL) || s.levels.chuDien >= MAX_LEVEL
    changed.set(
      pid,
      mail(seasonEnd(s, now, up ? ASCEND : 1, up ? season : undefined), {
        at: now,
        k: 'season',
        a: [season, rank.get(side) ?? 0, up ? 1 : 0],
      }),
    )
  }
  // hàng đang treo trên chợ: trả về qua thư (thư giữ qua luân hồi)
  for (const [k, v] of unsold(new Map([...ps, ...changed]), w, Object.values(w.orders)).changed) changed.set(k, v)
  const allies = Object.fromEntries(Object.entries(w.allies).map(([k, a]) => [k, { ...a, helps: [] }]))
  return {
    changed,
    world: { ...freshWorld(), allies, nextAlly: w.nextAlly, nextRally: w.nextRally, nextOrder: w.nextOrder },
    top,
  }
}

// Top EVENT_TOP của tuần week (người có điểm), cao nhất trước
export const eventTop = (ps: Players, week: number) =>
  [...ps]
    .filter(([, s]) => s.ev.week === week && s.ev.pts > 0)
    .sort((a, b) => b[1].ev.pts - a[1].ev.pts || a[0] - b[0])
    .slice(0, EVENT_TOP)
    .map(([id]) => id)
