// Lưu Danh Sử Sách (Hall of Fame "Go Down In History" của RoK — doc 6 A13): VOTE_DAYS ngày cuối mùa (cùng khung Thiên Mệnh Chọn Luật,
// world/vote.ts) ai trong giới cũng bình chọn anh kiệt mùa ở từng hạng mục (HERO_KINDS) — ứng viên là HERO_PICKS người dẫn đầu chỉ số
// mùa của hạng mục đó, server chốt lúc mở bình chọn (heroStep). Đổi phiếu được tới hết mùa; không tự bầu mình. Hết mùa người nhiều phiếu
// nhất mỗi hạng mục (bằng phiếu: người đứng trước — chỉ số cao hơn) nhận thư + quà (world/season.ts), server ghi vào Phong Thần Bảng.
import { SEASON_DAYS } from '../atlas.ts'
import { no } from '../core/action.ts'
import { int, isId } from '../core/parse.ts'
import type { State } from '../core/types.ts'
import { HERO_KINDS, HERO_PICKS, VOTE_DAYS } from '../data.ts'
import type { Players, World, WorldActions } from './base.ts'

export const heroOpen = (day: number | undefined) => day !== undefined && day >= SEASON_DAYS - VOTE_DAYS
// Chỉ số mùa của hạng mục k: chiến công / yêu thú / khai mỏ tính phần tăng từ đầu mùa (yb), Công Huân vốn về 0 mỗi mùa
export function heroValue(s: State | undefined, k: number) {
  if (!s) return 0
  const kind = HERO_KINDS[k]
  if (kind === 'honor') return s.honor ?? 0
  return (s.stats[kind] ?? 0) - (s.yb?.[kind] ?? 0)
}
// Mở bình chọn: chốt ứng viên mỗi hạng mục (bỏ skip: NPC; chỉ người có chỉ số mùa > 0), một lần mỗi mùa
export function heroStep(ps: Players, w: World, day: number | undefined, skip: Set<number>): World {
  if (!heroOpen(day) || w.heroes) return w
  const picks = HERO_KINDS.map((_, k) =>
    [...ps]
      .filter(([pid, s]) => !skip.has(pid) && heroValue(s, k) > 0)
      .sort((a, b) => heroValue(b[1], k) - heroValue(a[1], k) || a[0] - b[0])
      .slice(0, HERO_PICKS)
      .map(([pid]) => pid),
  )
  return { ...w, heroes: { picks, votes: HERO_KINDS.map(() => ({})) } }
}
// Số phiếu từng ứng viên của hạng mục k (theo thứ tự ứng viên)
const tally = (w: World, k: number) =>
  (w.heroes?.picks[k] ?? []).map(pid => Object.values(w.heroes?.votes[k] ?? {}).filter(x => x === pid).length)
// Anh kiệt mỗi hạng mục: nhiều phiếu nhất (ít nhất một phiếu), bằng phiếu thì người đứng trước
export const heroWinners = (w: World) =>
  HERO_KINDS.map((_, k) => {
    const t = tally(w, k)
    const best = Math.max(0, ...t)
    return best > 0 ? { pid: w.heroes!.picks[k][t.indexOf(best)], votes: best } : undefined
  })

export type HeroAction = { type: 'heroVote'; k: number; pid: number }
export const heroActions: WorldActions<HeroAction> = {
  heroVote: {
    pick: a =>
      int(0, HERO_KINDS.length - 1)(a.k) && isId(a.pid)
        ? { type: 'heroVote', k: a.k as number, pid: a.pid as number }
        : null,
    run: ({ w, pid, map }, a) => {
      const h = w.heroes
      if (!heroOpen(map?.day) || !h) return no('locked')
      if (!h.picks[a.k]?.includes(a.pid) || a.pid === pid) return no('bad')
      const votes = h.votes.map((v, k) => (k === a.k ? { ...v, [pid]: a.pid } : v))
      return { ok: true, changed: new Map(), world: { ...w, heroes: { ...h, votes } } }
    },
  },
}

// Cho client (tab Mùa): đang bình chọn không, ứng viên từng hạng mục (tên, chỉ số mùa, số phiếu, có phải mình), phiếu của người hỏi
export type HeroView = ReturnType<typeof heroView>
export const heroView = (w: World, ps: Players, pid: number, day: number | undefined) => ({
  open: heroOpen(day) && !!w.heroes,
  picks: (w.heroes?.picks ?? []).map((ids, k) => {
    const t = tally(w, k)
    return ids.map((id, i) => ({
      pid: id,
      name: ps.get(id)?.name ?? '?',
      v: heroValue(ps.get(id), k),
      n: t[i],
      me: id === pid,
    }))
  }),
  mine: HERO_KINDS.map((_, k) => w.heroes?.votes[k]?.[pid] ?? 0),
})
