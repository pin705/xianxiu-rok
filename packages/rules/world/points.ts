// Điểm trên bản đồ giới: trạng thái lúc now (mỏ còn bao nhiêu, yêu vương hồi chưa), phe giữ, điểm mùa khi giữ.
// Dùng chung cho các tính năng của world/ (như base.ts, fight.ts).
import { MAP_W, type Atlas, type Point, type PointKind } from '../atlas.ts'
import { type Side } from '../combat.ts'
import { beastStr, mob, tierFor } from '../core/battle.ts'
import { HOUR } from '../core/util.ts'
import {
  BEATS,
  BOSSES,
  MAIN_SHARE,
  MINE_STOCK,
  SEASON_GATE,
  SEASON_HEAVEN,
  SEASON_VEIN,
  FLAG_R,
  TERR_POINT,
  TERR_SEAT,
  TYPES,
} from '../data.ts'
import { allyOf, setSpot, sideName, type MapCtx, type Players, type Spot, type Task, type World } from './base.ts'

export const TASK_OF: Record<PointKind, Task> = {
  vein: 'take',
  gate: 'take',
  heaven: 'take',
  mine: 'gather',
  boss: 'hit',
  wild: 'hunt',
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
// Yêu thú giới ở điểm i: sức như yêu thú cùng cấp ở bản đồ vùng, hệ chính theo vị trí (client ước lượng tỉ lệ thắng)
export function wildSide(a: Atlas, i: number): Side | null {
  const p = a.points[i]
  if (p?.kind !== 'wild') return null
  const type = TYPES[i % TYPES.length]
  const rest = TYPES.filter(x => x !== type).map(x => [x, (1 - MAIN_SHARE) / 2] as [(typeof TYPES)[number], number])
  return mob(beastStr(p.lv), tierFor(p.lv), [[type, MAIN_SHARE], ...rest])
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
  return Object.entries(seasonPts(w, map, now))
    .map(([k, pts]) => ({ side: Number(k), name: sideName(w, ps, Number(k)) ?? '', pts: Math.floor(pts) }))
    .filter(r => r.name && r.pts > 0)
    .sort((a, b) => b.pts - a.pts || a.side - b.side)
}

// ---------- Lãnh thổ tiên minh (Alliance Territory của RoK) ----------
// Mốc lãnh thổ: tông môn người trong minh (bán kính TERR_SEAT ô), điểm minh đang giữ — linh mạch, cổng, Thiên Môn (TERR_POINT),
// trận kỳ đã dựng xong (FLAG_R).
// Mỗi ô thuộc minh có mốc gần nhất (khoảng cách ô Chebyshev, trong bán kính); hai minh cùng gần nhất: ô tranh chấp, không của ai.
export type Claim = { x: number; y: number; r: number; side: number }
const TERR_KINDS: PointKind[] = ['vein', 'gate', 'heaven']
export const claim = (a: Atlas, i: number, side: number): Claim | null => {
  const p = a.points[i]
  return p && side > 0 && TERR_KINDS.includes(p.kind) ? { x: p.x, y: p.y, r: TERR_POINT, side } : null
}
export function claimsOf(ps: Players, w: World, a: Atlas, now: number): Claim[] {
  const out: Claim[] = []
  for (const [pid, s] of ps) {
    const al = s.seat && allyOf(w, pid)
    if (al) out.push({ x: s.seat!.x, y: s.seat!.y, r: TERR_SEAT, side: al.id })
  }
  for (const [k, sp] of Object.entries(w.spots)) {
    const c = sp.own !== undefined ? claim(a, Number(k), sp.own) : null
    if (c) out.push(c)
  }
  for (const f of Object.values(w.flags ?? {})) if (f.done <= now && w.allies[f.aid]) out.push(flagClaim(f))
  return out
}
export const flagClaim = (f: { x: number; y: number; aid: number }): Claim => ({
  x: f.x,
  y: f.y,
  r: FLAG_R,
  side: f.aid,
})
// Chủ ô (x, y): id tiên minh; 0 — không của ai hoặc tranh chấp
export function ownerAt(claims: Claim[], x: number, y: number): number {
  let best = Infinity,
    side = 0,
    split = false
  for (const c of claims) {
    const d = Math.max(Math.abs(c.x - x), Math.abs(c.y - y))
    if (d > c.r || d > best) continue
    if (d < best) [best, side, split] = [d, c.side, false]
    else if (c.side !== side) split = true
  }
  return split ? 0 : side
}
// Cả bản đồ một lượt (client tô màu lãnh thổ): ô → id tiên minh, 0 không của ai / tranh chấp. Cùng luật với ownerAt.
export function territoryGrid(claims: Claim[]): Int32Array {
  const own = new Int32Array(MAP_W * MAP_W),
    best = new Uint8Array(MAP_W * MAP_W).fill(255),
    split = new Uint8Array(MAP_W * MAP_W)
  for (const c of claims)
    for (let y = Math.max(0, c.y - c.r); y <= Math.min(MAP_W - 1, c.y + c.r); y++)
      for (let x = Math.max(0, c.x - c.r); x <= Math.min(MAP_W - 1, c.x + c.r); x++) {
        const i = y * MAP_W + x,
          d = Math.max(Math.abs(c.x - x), Math.abs(c.y - y))
        if (d < best[i]) [best[i], own[i], split[i]] = [d, c.side, 0]
        else if (d === best[i] && own[i] !== c.side) split[i] = 1
      }
  for (let i = 0; i < own.length; i++) if (split[i]) own[i] = 0
  return own
}
