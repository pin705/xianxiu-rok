// Điểm trên bản đồ giới: trạng thái lúc now (mỏ còn bao nhiêu, yêu vương hồi chưa), phe giữ, điểm mùa khi giữ.
// Dùng chung cho các tính năng của world/ (như base.ts, fight.ts).
import { MAP_W, sitesOf, type Atlas, type Point, type PointKind, type Pos } from '../atlas.ts'
import { type Side } from '../combat.ts'
import { beastStr, mob, tierFor } from '../core/battle.ts'
import { HOUR, count } from '../core/util.ts'
import {
  BEATS,
  BOSSES,
  MAIN_SHARE,
  MINE_STOCK,
  ALTAR_EVERY,
  ALTAR_OPEN,
  RUIN_EVERY,
  RUIN_OPEN,
  VEIN_EVERY,
  VEIN_HOLD,
  VEIN_OPEN,
  SEASON_ALTAR,
  SEASON_GATE,
  SEASON_HEAVEN,
  SEASON_RUIN,
  SEASON_VEIN,
  CAMP_STAGE_PTS,
  BUILD_MAX,
  BUILD_PER,
  FLAG_R,
  FORT_BUFFS,
  FORT_R,
  GUARDIANS,
  TERR_POINT,
  TERR_SEAT,
  TYPES,
  SHRINES,
  ALLY_ORDERS,
  VEIN_BUFF,
  EVE_BUFF,
  thoiAt,
  RUNE_CYCLE,
  RUNE_KINDS,
  RUNE_R,
  RUNE_TIERS,
  ALLY_SKILL_IDS,
  ALLY_SKILLS,
  ALLY_TECH_IDS,
  ALLY_TECHS,
  type Bonus,
} from '../data.ts'
import {
  allyOf,
  techLevel,
  type Alliance,
  setSpot,
  sideKey,
  sideName,
  type MapCtx,
  type Party,
  type Players,
  type Spot,
  type Task,
  type World,
} from './base.ts'
import type { Buff, March, State } from '../core/types.ts'

export const TASK_OF: Record<PointKind, Task> = {
  vein: 'take',
  gate: 'take',
  heaven: 'take',
  mine: 'gather',
  boss: 'hit',
  wild: 'hunt',
  ruin: 'take',
  altar: 'take',
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
// Hộ trận linh thú ở điểm i (linh mạch / trận nhãn / Thiên Môn chưa thuần phục): đội tới chiếm gặp đúng chừng này
export function guardSide(a: Atlas, i: number): Side | null {
  const p = a.points[i],
    g = p && GUARDIANS[p.kind as keyof typeof GUARDIANS]?.[p.lv - 1]
  if (!g) return null
  const type = TYPES[(i + 1) % TYPES.length]
  return mob(g[0], g[1], [
    [type, 0.5],
    [BEATS[type], 0.3],
    [BEATS[BEATS[type]], 0.2],
  ])
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

// Cổ Di Tích / Huyết Tế Đàn: cửa sổ mở chứa lúc t (open), hay cửa sổ kế tiếp; mỗi điểm lệch giờ riêng theo seed + số thứ tự.
// Điểm khác: luôn mở.
export function ruinWindow(a: Atlas, p: Point, t: number): { open: boolean; start: number; end: number } {
  if (p.kind !== 'ruin' && p.kind !== 'altar') return { open: true, start: -Infinity, end: Infinity }
  const [every, len] = p.kind === 'altar' ? [ALTAR_EVERY, ALTAR_OPEN] : [RUIN_EVERY, RUIN_OPEN]
  return windowAt(a, p, t, every, len)
}
function windowAt(a: Atlas, p: Point, t: number, every: number, len: number) {
  const off = ((a.seed * 7919 + p.i * 104_729) >>> 0) % every
  const start = Math.floor((t - off) / every) * every + off
  return t < start + len
    ? { open: true, start, end: start + len }
    : { open: false, start: start + every, end: start + every + len }
}
// Kỳ tranh chấp của một linh mạch: cửa sổ đang mở chứa lúc t, hay cửa sổ kế tiếp (lệch giờ riêng từng điểm)
export const contestWindow = (a: Atlas, p: Point, t: number) => windowAt(a, p, t, VEIN_EVERY, VEIN_OPEN)
// Linh mạch đang bảo hộ với phe side: đã có phe kiểm soát khác, ngoài kỳ tranh chấp, side cũng không đang đóng quân ở đó
export const veinShut = (a: Atlas, p: Point, sp: Spot | undefined, side: number, t: number) =>
  p.kind === 'vein' && sp?.ctl !== undefined && sp.ctl !== side && sp.own !== side && !contestWindow(a, p, t).open
// Đội tới chiếm phải quay về: di tích đã đóng cửa, hay linh mạch đang bảo hộ với phe side
export const closedTo = (a: Atlas, p: Point, sp: Spot | undefined, side: number, t: number) =>
  !ruinWindow(a, p, t).open || veinShut(a, p, sp, side, t)
// Phe đang đóng quân giữ liên tục VEIN_HOLD thì thành phe kiểm soát: linh mạch chưa ai kiểm soát tính từ lúc chiếm, đã có phe kiểm soát
// thì chỉ tính phần giữ trong kỳ tranh chấp gần nhất (đang mở hay vừa đóng)
export function contestStep(w: World, map: MapCtx, now: number): World {
  let next = w
  for (const [k, sp] of Object.entries(w.spots)) {
    const p = map.atlas.points[Number(k)]
    if (p?.kind !== 'vein' || sp.own === undefined || sp.own === sp.ctl || sp.since === undefined) continue
    const cur = contestWindow(map.atlas, p, now)
    const win = cur.open ? cur : { start: cur.start - VEIN_EVERY, end: cur.end - VEIN_EVERY }
    const held = sp.ctl === undefined ? now - sp.since : Math.min(now, win.end) - Math.max(sp.since, win.start)
    if (held >= VEIN_HOLD) next = setSpot(next, Number(k), { ...sp, ctl: sp.own })
  }
  return next
}
// Tăng ích linh mạch cho phe giữ (Sanctum / Altar / Shrine của RoK): cấp 1 một trong sản lượng · xây · tuyển · chữa; cấp 2 một
// trong công · thủ · sinh lực · hành quân, trừ thần miếu (buff kép SHRINES); cấp 3 (tâm) sản lượng + công — theo số thứ tự
// điểm, độ lớn VEIN_BUFF theo cấp
const VEIN_KEYS: Bonus[][] = [
  ['prod', 'build', 'train', 'heal'],
  ['atk', 'def', 'hp', 'march'],
]
// Thần miếu: linh mạch vòng giữa có số thứ tự chia hết cho 3 — ba linh mạch của một vùng giữa đặt liền nhau nên mỗi vùng đúng
// một miếu; loại miếu (chỉ số trong SHRINES) theo số vùng — tám vùng giữa, mỗi loại hai miếu. −1: không phải miếu
export const shrineOf = (p: Point) =>
  p.kind === 'vein' && p.lv === 2 && p.i % 3 === 0 ? p.region % SHRINES.length : -1
export function veinBuffs(p: Point): { key: Bonus; v: number }[] {
  const k = shrineOf(p)
  if (k >= 0) return SHRINES[k]
  const v = VEIN_BUFF[p.lv - 1] ?? 0
  if (p.lv >= 3)
    return [
      { key: 'prod', v },
      { key: 'atk', v },
    ]
  const keys = VEIN_KEYS[p.lv - 1]
  return [{ key: keys[p.i % keys.length], v }]
}
// Điểm mùa mỗi giờ giữ một điểm: linh mạch (theo cấp), trận nhãn, Thiên Môn, di tích; mỏ và yêu vương không tính
const SEASON_RATE: Partial<Record<PointKind, number>> = {
  gate: SEASON_GATE,
  heaven: SEASON_HEAVEN,
  ruin: SEASON_RUIN,
  altar: SEASON_ALTAR,
}
export const seasonRate = (p: Point) => (p.kind === 'vein' ? (SEASON_VEIN[p.lv - 1] ?? 0) : (SEASON_RATE[p.kind] ?? 0))
export const bank = (w: World, side: number, pts: number): World =>
  pts > 0 ? { ...w, pts: { ...w.pts, [side]: (w.pts[side] ?? 0) + pts } } : w
// Đặt lại điểm i lúc at; đổi phe giữ thì chốt điểm mùa cho phe cũ theo số giờ đã giữ
export function hold(w: World, map: MapCtx | undefined, i: number, sp: Spot, at: number): World {
  const old = w.spots[i]
  // linh thú đã thuần phục thì giữ vậy cả mùa; phe kiểm soát linh mạch giữ nguyên tới khi phe khác giữ đủ (contestStep)
  const next = setSpot(w, i, {
    ...sp,
    ...(old?.tamed && { tamed: 1 as const }),
    ...(old?.ctl !== undefined && { ctl: old.ctl }),
  })
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
// Chính Tà Phân Tranh: phái của một phe (tiên minh theo mã minh, người đi một mình theo mã người) — 0 Chính phái, 1 Tà phái.
// ponytail: chia theo chẵn lẻ (đều về số phe, không cân lực chiến); cân theo lực chiến lúc lập minh nếu hai phái lệch nhiều
export const campOf = (side: number) => (((side % 2) + 2) % 2) as 0 | 1
export const campPts = (rows: SeasonRow[]): [number, number] =>
  rows.reduce<[number, number]>((t, r) => (campOf(r.side) ? [t[0], t[1] + r.pts] : [t[0] + r.pts, t[1]]), [0, 0])
// Điểm phái cả mùa: điểm mùa các phe + CAMP_STAGE_PTS mỗi chặng thi đua thắng
export const campTotal = (rows: SeasonRow[], w: World): [number, number] => {
  const [a, b] = campPts(rows),
    [x, y] = w.stageWins ?? [0, 0]
  return [a + x * CAMP_STAGE_PTS, b + y * CAMP_STAGE_PTS]
}
export function seasonBoard(w: World, ps: Players, map: MapCtx, now: number): SeasonRow[] {
  return Object.entries(seasonPts(w, map, now))
    .map(([k, pts]) => ({ side: Number(k), name: sideName(w, ps, Number(k)) ?? '', pts: Math.floor(pts) }))
    .filter(r => r.name && r.pts > 0)
    .sort((a, b) => b.pts - a.pts || a.side - b.side)
}

// ---------- Lãnh thổ tiên minh (Alliance Territory của RoK) ----------
// Mốc lãnh thổ: tông môn người trong minh (bán kính TERR_SEAT ô), điểm minh đang giữ — linh mạch, cổng, Thiên Môn (TERR_POINT),
// trận kỳ đã dựng xong (FLAG_R), Tổng đà đã dựng xong (FORT_R).
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
  for (const f of Object.values(w.flags ?? {})) if (f.done <= now && w.allies[f.aid] && !f.mine) out.push(flagClaim(f))
  return out
}
export const flagClaim = (f: { x: number; y: number; aid: number; fort?: boolean }): Claim => ({
  x: f.x,
  y: f.y,
  r: f.fort ? FORT_R : FLAG_R,
  side: f.aid,
})
// Phù văn của chu kỳ cyc (RUNE_CYCLE): mỗi linh mạch / trận nhãn / Thiên Môn một phù văn ở ô trống gần đó — tất định theo mầm bản đồ
export type Rune = { i: number; x: number; y: number; k: number; t: number }
export function runesAt(a: Atlas, cyc: number): Rune[] {
  const taken = new Set([...a.points, ...sitesOf(a)].map(p => p.y * MAP_W + p.x))
  const out: Rune[] = []
  for (const p of a.points) {
    if (p.kind !== 'vein' && p.kind !== 'gate' && p.kind !== 'heaven') continue
    let h = (Math.imul(a.seed ^ (cyc * 0x9e3779b1), 2654435761) ^ Math.imul(p.i + 1, 0x85ebca6b)) >>> 0
    const next = () => (h = (Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) + 0x6d2b79f5) >>> 0)
    const x = p.x + (next() % (2 * RUNE_R + 1)) - RUNE_R,
      y = p.y + (next() % (2 * RUNE_R + 1)) - RUNE_R
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_W || taken.has(y * MAP_W + x)) continue
    taken.add(y * MAP_W + x)
    const ring = p.kind === 'heaven' ? 2 : p.kind === 'gate' ? 1 : 0
    const t = Math.min(RUNE_TIERS.length - 1, (next() % 3) + ring)
    out.push({ i: out.length, x, y, k: next() % RUNE_KINDS.length, t })
  }
  return out
}
export const runeCycle = (t: number) => Math.floor(t / RUNE_CYCLE)
// phù văn còn (chưa ai nhặt) lúc t
export const runesLeft = (w: World, a: Atlas, t: number) => {
  const cyc = runeCycle(t)
  const got = w.runes?.cyc === cyc ? w.runes.got : []
  return runesAt(a, cyc).filter(r => !got.includes(r.i))
}
// Tăng ích tông môn từ các trận Hộ Minh Đại Trận (nguồn 'ally')
export const allyBuffs = (al: Alliance | undefined): Buff[] =>
  al
    ? ALLY_TECH_IDS.flatMap(id => {
        const d = ALLY_TECHS[id],
          lv = techLevel(al, id)
        return lv && d.key !== 'helps' && d.key !== 'seats'
          ? [{ key: d.key as Bonus, v: Math.round(d.v * lv * 1000) / 1000, until: 0, src: 'ally' }]
          : []
      })
    : []
// Minh trận thần thông đang hiệu lực lúc t (nguồn 'askill', tự hết lúc until)
export const skillBuffs = (al: Alliance | undefined, t: number): Buff[] =>
  ALLY_SKILL_IDS.flatMap(id => {
    const until = al?.skills?.[id] ?? 0
    return until > t ? [{ key: ALLY_SKILLS[id].key as Bonus, v: ALLY_SKILLS[id].v, until, src: 'askill' }] : []
  })
// Tổng đà của minh đã dựng xong lúc t: người trong minh có FORT_BUFFS
export function fortBuffs(w: World, pid: number, t: number): Buff[] {
  const al = allyOf(w, pid)
  const done = !!al && Object.values(w.flags ?? {}).some(f => f.fort && f.aid === al.id && f.done <= t)
  return done ? FORT_BUFFS.map(b => ({ ...b, until: 0, src: 'fort' })) : []
}
// Góp quân xây: tốc dựng theo số đệ tử đang đóng ở công trình (trần BUILD_MAX)
export const buildRate = (troops: number) => 1 + Math.min(BUILD_MAX - 1, troops / BUILD_PER)
export const troopsOf = (g: Party) => g.reduce((n, [, , m]) => n + count(m.army), 0)
// Người góp đổi lúc t (đội tới / gọi về): việc còn lại giữ nguyên, thời gian còn lại co giãn theo tốc mới
export function rebuild(w: World, id: number, t: number, before: Party, after: Party): World {
  const f = w.flags?.[id]
  if (!f || f.done <= t) return w
  const done = t + Math.ceil(((f.done - t) * buildRate(troopsOf(before))) / buildRate(troopsOf(after)))
  return { ...w, flags: { ...w.flags, [id]: { ...f, done } } }
}
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

// Khai Giới Trảm Tà: tàn quyển cộng giới vận cho tiên minh của pid; minh đứng đầu lúc cổng mở được tăng ích sản lượng (nguồn 'eve')
export const eveAdd = (w: World, pid: number, n: number): World => {
  const al = allyOf(w, pid)
  return al && n > 0 ? { ...w, eve: { ...w.eve, [al.id]: (w.eve?.[al.id] ?? 0) + n } } : w
}
export const eveBuffs = (w: World, pid: number, at: number): Buff[] => {
  const id = allyOf(w, pid)?.id
  return w.eveWin && w.eveWin.until > at && id !== undefined && w.eveWin.ids.includes(id)
    ? [{ key: 'prod', v: EVE_BUFF, until: w.eveWin.until, src: 'eve' }]
    : []
}
// Thiên Thời: tăng ích chung của thời đang chạy + chỉ lệnh tông môn đã chọn cho thời này (nguồn 'thoi'; sang thời mới thì
// worldBuffs thay cả bộ)
export function thoiBuffs(map: MapCtx, s: State): Buff[] {
  if (map.day === undefined) return []
  const t = thoiAt(map.day)
  const pick = s.thoi?.n === t.n ? t.picks[s.thoi.pick] : undefined
  return [...Object.entries(t.fx), ...Object.entries(pick ?? {})].map(([key, v]) => ({
    key: key as Bonus,
    v,
    until: 0,
    src: 'thoi',
  }))
}

// Minh lệnh của thời đang chạy (minh của người đó ban)
export function orderBuffs(map: MapCtx, al: Alliance | undefined): Buff[] {
  const o = al?.order
  if (map.day === undefined || !o || o.n !== thoiAt(map.day).n) return []
  return [{ ...ALLY_ORDERS[o.k], until: 0, src: 'order' }]
}
// Vị trí (ô) của đội lúc t theo đường đi (đi: path; về: path ngược); không có đường thì null
export function marchAt(m: March, t: number): Pos | null {
  const path = m.path
  if (!path?.length) return null
  const home = m.returnAt > 0 && t >= m.arriveAt
  const f = home
    ? (t - m.arriveAt) / Math.max(1, m.returnAt - m.arriveAt)
    : (t - m.startAt) / Math.max(1, m.arriveAt - m.startAt)
  const pts = home ? [...path].reverse() : path
  const seg = pts.slice(1).map((p, k) => Math.hypot(p.x - pts[k].x, p.y - pts[k].y))
  let d = Math.min(1, Math.max(0, f)) * seg.reduce((a, b) => a + b, 0)
  for (let k = 0; k < seg.length; k++) {
    if (d <= seg[k] || k === seg.length - 1) {
      const u = seg[k] ? Math.min(1, d / seg[k]) : 0
      return {
        x: Math.round(pts[k].x + (pts[k + 1].x - pts[k].x) * u),
        y: Math.round(pts[k].y + (pts[k + 1].y - pts[k].y) * u),
      }
    }
    d -= seg[k]
  }
  return { ...pts[0] }
}

// Cửa ải (Passes của RoK): trận nhãn phe khác đang giữ (không minh ước) thì không đi qua được — phải đánh chiếm trước. Điểm trận
// nhãn i trùng cổng i của atlas. spots: [điểm, phe giữ] (client đọc từ ảnh chụp bản đồ, server từ w.spots)
export function shutFrom(
  spots: Iterable<[number, number | undefined]>,
  gates: number,
  side: number,
  naps: readonly number[] = [],
) {
  const out = new Set<number>()
  for (const [i, own] of spots) if (i < gates && own !== undefined && own !== side && !naps.includes(own)) out.add(i)
  return out
}
export const shutGates = (w: World, a: Atlas, pid: number) =>
  shutFrom(
    Object.entries(w.spots).map(([k, sp]) => [Number(k), sp.own] as [number, number | undefined]),
    a.gates.length,
    sideKey(w, pid),
    allyOf(w, pid)?.naps,
  )
