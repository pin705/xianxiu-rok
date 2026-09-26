// Lật mùa và lật tuần của cả giới: hết mùa (phi thăng / luân hồi, trả hàng chợ, làm mới phần chung), top sự kiện tuần.
// Điều phối nhiều tính năng (như act.ts, advance.ts) nên được import các file tính năng khác trong world/.
import {
  ASCEND,
  ASCEND_HALL,
  CAMP_WIN,
  EVENT_PRIZES,
  EVENT_TOP,
  FEST_PRIZES,
  HONOR_RANKS,
  LEAGUE_PRIZES,
  MAX_LEVEL,
  honorPrize,
  type FestId,
} from '../data.ts'
import { festPoints, festStagePts } from '../core/fest.ts'
import type { State } from '../core/types.ts'
import { advance } from '../core/time.ts'
import { mail } from '../sect/inbox.ts'
import { seasonEnd } from '../sect/rebirth.ts'
import { allyOf, freshWorld, sideKey, type MapCtx, type Players, type World } from './base.ts'
import { unsold } from './market.ts'
import { leagueRank } from './ark.ts'
import { campOf, campTotal, type SeasonRow, seasonBoard } from './points.ts'

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
  const honors = honorBoard(ps, skip).slice(0, HONOR_RANKS)
  const camps = campTotal(top, w)
  const league = new Map(
    leagueRank(w)
      .slice(0, LEAGUE_PRIZES.length)
      .map((id, k) => [id, k]),
  ) // Cửu Thiên: minh → hạng (playoff trước, rồi bảng giải)
  const won = camps[0] === camps[1] ? null : camps[0] > camps[1] ? 0 : 1 // Chính Tà Phân Tranh: phái thắng mùa
  const changed: Players = new Map()
  for (const [pid, s0] of ps) {
    if (skip.has(pid)) continue
    const s = advance(s0, now) // việc xong lúc offline (Chủ điện vừa lên tầng…) cũng tính cho phi thăng, tổng kết
    const side = sideKey(w, pid)
    const up = (side === first && s.levels.chuDien >= ASCEND_HALL) || s.levels.chuDien >= MAX_LEVEL
    // Công Huân: top HONOR_RANKS nhận quà theo hạng (thư trước thư kết mùa); mùa mới mọi người về 0
    let x: State = { ...seasonEnd(s, now, up ? ASCEND : 1, up ? season : undefined), honor: 0, honorGot: 0 }
    const hr = honors.findIndex(([id]) => id === pid)
    if (hr >= 0) x = mail(x, { at: now, k: 'honorTop', a: [hr + 1, s.honor ?? 0], gift: honorPrize(hr) })
    if (hr === 0) x = { ...x, crowns: [...(x.crowns ?? []), season] } // danh hiệu mùa: đệ nhất Công Huân
    // Cửu Thiên Luận Đạo Hội: người trong minh top giải có quà theo hạng
    const lr = side > 0 ? league.get(side) : undefined
    if (lr !== undefined) x = mail(x, { at: now, k: 'league', a: [lr + 1], gift: LEAGUE_PRIZES[lr] })
    // Chính Tà Phân Tranh: người phái thắng mùa có quà (thư trước thư kết mùa)
    if (won !== null && campOf(side) === won)
      x = mail(x, { at: now, k: 'camp', a: [won, camps[won], camps[won ? 0 : 1]], gift: CAMP_WIN })
    x = mail(x, { at: now, k: 'season', a: [season, rank.get(side) ?? 0, up ? 1 : 0] })
    // Tổng kết mùa: phần bộ đếm tăng trong mùa (so với lúc đầu mùa), rồi ghi mốc cho mùa sau
    const now4 = {
      kp: s.stats.kp ?? 0,
      hunted: s.stats.hunted ?? 0,
      raided: s.stats.raided ?? 0,
      gathered: s.stats.gathered ?? 0,
    }
    const d = (k: keyof typeof now4) => now4[k] - (s.yb?.[k] ?? 0)
    const book = [
      season,
      s.levels.chuDien,
      s.honor ?? 0,
      hr + 1,
      d('kp'),
      d('hunted'),
      d('raided'),
      d('gathered'),
    ] as const
    changed.set(pid, { ...mail(x, { at: now, k: 'yearbook', a: [...book] }), yb: now4 })
  }
  // hàng đang treo trên chợ: trả về qua thư (thư giữ qua luân hồi)
  for (const [k, v] of unsold(new Map([...ps, ...changed]), w, Object.values(w.orders)).changed) changed.set(k, v)
  // minh giữ sang mùa sau, bỏ lời nhờ giúp và Minh lệnh (thời Thiên Thời đếm lại từ đầu mùa)
  const allies = Object.fromEntries(
    Object.entries(w.allies).map(([k, a]) => [k, { ...a, helps: [], order: undefined }]),
  )
  return {
    changed,
    world: { ...freshWorld(), allies, nextAlly: w.nextAlly, nextRally: w.nextRally, nextOrder: w.nextOrder },
    top,
  }
}

// Bảng Công Huân trong mùa (người có điểm, cao nhất trước; bỏ skip: NPC)
export const honorBoard = (ps: Players, skip = new Set<number>()) =>
  [...ps]
    .filter(([id, s]) => !skip.has(id) && (s.honor ?? 0) > 0)
    .sort((a, b) => (b[1].honor ?? 0) - (a[1].honor ?? 0) || a[0] - b[0])

// Quà thư hết tuần theo hạng (0: hạng 1): hạng 1 · 2–3 · 4–10
export const eventPrize = (rank: number) => EVENT_PRIZES[rank === 0 ? 0 : rank < 3 ? 1 : 2]
// Bảng lễ có xếp hạng (FEST_RANKED, như Mightiest Governor): người có điểm trong lượt lễ `key`, cao trước — [mã, điểm].
// skip: tông môn NPC (phân đà) không lên bảng; stage: chỉ điểm của ải đó (bảng ải của lễ FEST_STAGED)
export const festBoard = (
  ps: Players,
  id: FestId,
  key: number,
  skip: ReadonlySet<number> = new Set(),
  stage?: number,
): [number, number][] =>
  [...ps]
    .filter(([pid]) => !skip.has(pid))
    .flatMap(([pid, s]) =>
      s.fest[id]?.key === key
        ? [[pid, stage === undefined ? festPoints(s, id) : festStagePts(s, id, stage)] as [number, number]]
        : [],
    )
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
export const festPrize = (rank: number) => FEST_PRIZES[rank === 0 ? 0 : rank < 3 ? 1 : 2]
// Bảng tiên minh của lễ (FEST_ALLY, như Clarion Call): tổng điểm lễ người trong minh ở lượt key, cao trước — [mã minh, điểm]
export function festAllyBoard(ps: Players, w: World, id: FestId, key: number, skip: ReadonlySet<number> = new Set()) {
  const sum = new Map<number, number>()
  for (const [pid, n] of festBoard(ps, id, key, skip)) {
    const al = allyOf(w, pid)
    if (al) sum.set(al.id, (sum.get(al.id) ?? 0) + n)
  }
  return [...sum].sort((a, b) => b[1] - a[1] || a[0] - b[0])
}
// Top EVENT_TOP của tuần week (người có điểm; skip: tông môn NPC không tranh quà), cao nhất trước
export const eventTop = (ps: Players, week: number, skip: ReadonlySet<number> = new Set()) =>
  [...ps]
    .filter(([id, s]) => !skip.has(id) && s.ev.week === week && s.ev.pts > 0)
    .sort((a, b) => b[1].ev.pts - a[1].ev.pts || a[0] - b[0])
    .slice(0, EVENT_TOP)
    .map(([id]) => id)
