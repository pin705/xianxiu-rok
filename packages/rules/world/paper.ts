// Giới Báo (Kingdom Newspaper của RoK — doc 4 G4): 0h mỗi ngày server ra một số báo cho hôm trước (paperStep) — ai dẫn đầu từng mục
// (PAPER_KINDS: khai mỏ, săn yêu, chiến công, cướp thắng — phần tăng so với mốc 0h hôm trước) và tổng cả giới; giữ PAPER_KEEP số.
// Người đọc bấm thích từng bài (mỗi bài một lần), đọc số hôm nay nhận PAPER_GIFT (mỗi ngày một lần). Hết mùa phần chung làm mới:
// báo tính lại từ mốc mới.
import { grant } from '../core/battle.ts'
import { no } from '../core/action.ts'
import { dayOf } from '../core/calendar.ts'
import { int } from '../core/parse.ts'
import { PAPER_GIFT, PAPER_KEEP, PAPER_KINDS } from '../data.ts'
import type { Issue, Players, World, WorldActions } from './base.ts'

// Mỗi nhịp server: qua 0h thì ra số báo của hôm trước và lấy mốc mới (lần đầu chỉ lấy mốc). Bỏ skip: NPC
export function paperStep(ps: Players, w: World, now: number, skip: Set<number>): World {
  const day = dayOf(now)
  const p = w.paper
  if (p?.day === day) return w
  const live = [...ps].filter(([pid]) => !skip.has(pid))
  const base = Object.fromEntries(live.map(([pid, s]) => [pid, PAPER_KINDS.map(k => s.stats[k] ?? 0)]))
  if (!p) return { ...w, paper: { day, base, issues: [], read: [] } }
  const gain = live.flatMap(([pid, s]) => {
    const b = p.base[pid]
    return b ? [{ pid, name: s.name, d: PAPER_KINDS.map((k, i) => Math.max(0, (s.stats[k] ?? 0) - b[i])) }] : []
  })
  const top: Issue['top'] = []
  PAPER_KINDS.forEach((_, i) => {
    const best = gain.reduce<(typeof gain)[number] | null>((m, g) => (g.d[i] > (m?.d[i] ?? 0) ? g : m), null)
    if (best) top.push([i, best.pid, best.name, best.d[i]])
  })
  const sum = PAPER_KINDS.map((_, i) => gain.reduce((t, g) => t + g.d[i], 0))
  const issue: Issue = { day: p.day, top, sum, likes: top.map(() => []) }
  return { ...w, paper: { day, base, issues: [issue, ...p.issues].slice(0, PAPER_KEEP), read: [] } }
}

export type PaperAction = { type: 'paperLike'; day: number; i: number } | { type: 'paperRead' }
export const paperActions: WorldActions<PaperAction> = {
  paperLike: {
    pick: a =>
      int(0, 1e7)(a.day) && int(0, PAPER_KINDS.length - 1)(a.i)
        ? { type: 'paperLike', day: a.day as number, i: a.i as number }
        : null,
    run: ({ w, pid }, a) => {
      const p = w.paper
      const issue = p?.issues.find(x => x.day === a.day)
      if (!p || !issue || a.i >= issue.top.length) return no('gone')
      if (issue.likes[a.i].includes(pid)) return no('claimed')
      const likes = issue.likes.map((l, k) => (k === a.i ? [...l, pid] : l))
      const issues = p.issues.map(x => (x === issue ? { ...x, likes } : x))
      return { ok: true, changed: new Map(), world: { ...w, paper: { ...p, issues } } }
    },
  },
  // quà đọc báo: số hôm nay (server đã ra số sáng nay), mỗi người một lần
  paperRead: {
    pick: () => ({ type: 'paperRead' }),
    run: ({ w, pid, s, now }) => {
      const p = w.paper
      if (!p?.issues.length || p.day !== dayOf(now)) return no('locked')
      if (p.read.includes(pid)) return no('claimed')
      return {
        ok: true,
        changed: new Map([[pid, grant(s, PAPER_GIFT)]]),
        world: { ...w, paper: { ...p, read: [...p.read, pid] } },
      }
    },
  },
}

// Cho client: các số báo (mới trước) — bài dẫn đầu, tổng cả giới, số lượt thích, mình đã thích bài nào; đã nhận quà đọc số hôm nay chưa
export type PaperView = ReturnType<typeof paperView>
export const paperView = (w: World, pid: number, now: number) => ({
  issues: (w.paper?.issues ?? []).map(x => ({
    day: x.day,
    top: x.top,
    sum: x.sum,
    likes: x.likes.map(l => l.length),
    mine: x.likes.flatMap((l, k) => (l.includes(pid) ? [k] : [])),
  })),
  gift: !!w.paper?.issues.length && w.paper.day === dayOf(now) && !w.paper.read.includes(pid),
})
