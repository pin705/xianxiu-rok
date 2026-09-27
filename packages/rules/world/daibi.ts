// Tiên Môn Đại Bỉ (Champions of Olympia của RoK, bản nhanh bất đồng bộ): hàng chờ cả giới, mỗi người chọn một chiến thuật (3 đội đầu
// Luận Kiếm Đài đứng ở cờ nào); đủ 2 × DAIBI_TEAM người (chờ lâu thì bù NPC) server chia hai đội cân theo điểm đài (rắn: A B B A A B…) và
// giải DAIBI_ROUNDS hiệp trên 5 cờ (daibiStep, gọi mỗi nhịp). Thư: điểm hai đội, số cờ mình góp giữ; đội thắng có quà lớn hơn.
import { fight, type Side } from '../combat.ts'
import { no } from '../core/action.ts'
import { dayOf } from '../core/calendar.ts'
import { oneOf } from '../core/parse.ts'
import type { State } from '../core/types.ts'
import {
  DAIBI_DAILY,
  DAIBI_HALL,
  DAIBI_ROUNDS,
  DAIBI_TACTICS,
  DAIBI_TEAM,
  DAIBI_WAIT,
  daibiGift,
  type DaibiTactic,
} from '../data.ts'
import { arenaSide, lineupOf } from '../sect/arena.ts'
import { mail } from '../sect/inbox.ts'
import type { Players, World, WorldActions } from './base.ts'
import { combine } from './fight.ts'

const TACTICS = Object.keys(DAIBI_TACTICS) as DaibiTactic[]
const FLAGS = 5 // 0 cờ nhà A · 1 cánh trái · 2 giữa · 3 cánh phải · 4 cờ nhà B (bên B nhìn lật: cờ f của B là 4 − f)
export const daibiUsed = (s: State, t: number) => (s.daibi?.day === dayOf(t) ? s.daibi.n : 0)
const queue = (w: World) => w.daibi?.q ?? []

export type DaibiAction = { type: 'daibiJoin'; tactic: DaibiTactic } | { type: 'daibiLeave' }
export const daibiActions: WorldActions<DaibiAction> = {
  daibiJoin: {
    pick: a => (oneOf(TACTICS)(a.tactic) ? { type: 'daibiJoin', tactic: a.tactic as DaibiTactic } : null),
    run: ({ w, pid, s }, a) => {
      if (s.levels.chuDien < DAIBI_HALL || !lineupOf(s).length) return no('locked')
      if (queue(w).some(([p]) => p === pid)) return no('claimed')
      const used = daibiUsed(s, s.time)
      if (used >= DAIBI_DAILY) return no('limit')
      const q: [number, DaibiTactic][] = [...queue(w), [pid, a.tactic]]
      const me = { ...s, daibi: { day: dayOf(s.time), n: used + 1, win: s.daibi?.win ?? 0 } }
      return { ok: true, world: { ...w, daibi: { q, at: w.daibi?.at ?? s.time } }, changed: new Map([[pid, me]]) }
    },
  },
  daibiLeave: {
    pick: () => ({ type: 'daibiLeave' }),
    run: ({ w, pid, s }) => {
      if (!queue(w).some(([p]) => p === pid)) return no('gone')
      const q = queue(w).filter(([p]) => p !== pid)
      const me = s.daibi ? { ...s, daibi: { ...s.daibi, n: Math.max(0, s.daibi.n - 1) } } : s // rời hàng: trả lượt
      const { daibi: _, ...rest } = w
      return { ok: true, world: q.length ? { ...w, daibi: { ...w.daibi!, q } } : rest, changed: new Map([[pid, me]]) }
    },
  },
}

type Squad = { pid: number; team: 0 | 1; flag: number; side: Side; rest: number }
// Một trận: hai đội [người, chiến thuật]; trả điểm hai đội và số cờ từng người góp giữ (mỗi hiệp mỗi cờ tính một lần)
export function daibiRun(ps: Players, teams: [number, DaibiTactic][][], seed: number) {
  const squads: Squad[] = teams.flatMap((team, side) =>
    team.flatMap(([pid, tactic]) => {
      const s = ps.get(pid)
      if (!s) return []
      return lineupOf(s)
        .slice(0, 3)
        .map((t, k): Squad => {
          const f = DAIBI_TACTICS[tactic][k] ?? 2
          return { pid, team: side as 0 | 1, flag: side ? FLAGS - 1 - f : f, side: arenaSide(s, t), rest: -1 }
        })
    }),
  )
  const pts: [number, number] = [0, 0]
  const flags = new Map<number, number>()
  for (let r = 1; r <= DAIBI_ROUNDS; r++) {
    for (let f = 0; f < FLAGS; f++) {
      const here = squads.filter(q => q.flag === f && q.rest < r)
      const by = [0, 1].map(sd => here.filter(q => q.team === sd))
      let win: 0 | 1 | null = by[0].length ? (by[1].length ? null : 0) : by[1].length ? 1 : null
      if (win === null && by[0].length && by[1].length) {
        // gộp mỗi bên một đạo; đội thắng giữ cờ và hồi đủ ngay, đội thua nghỉ một hiệp rồi về đủ quân
        const [a, b] = by.map(g => combine(g.map(q => q.side)).side)
        win = fight(a, b, (seed + r * 131 + f * 7919) >>> 0).win ? 0 : 1
        for (const q of by[win ? 0 : 1]) q.rest = r + 1
      }
      if (win === null) continue
      pts[win] += r * (f === 2 ? 2 : 1)
      for (const pid of new Set(by[win].map(q => q.pid))) flags.set(pid, (flags.get(pid) ?? 0) + 1)
    }
  }
  return { pts, flags }
}

// Mỗi nhịp: hàng đủ người (hay chờ lâu thì bù NPC chiến thuật dàn đều) thì chia đội, giải — thư cho người thật
export function daibiStep(
  ps: Players,
  w: World,
  now: number,
  seed: number,
  bots: number[],
): { changed: Players; world: World } {
  const changed: Players = new Map()
  const q = queue(w),
    need = 2 * DAIBI_TEAM
  if (!q.length || (q.length < need && now - w.daibi!.at < DAIBI_WAIT)) return { changed, world: w }
  const fill = bots.filter(b => !q.some(([p]) => p === b) && ps.get(b) && lineupOf(ps.get(b)!).length)
  const all: [number, DaibiTactic][] = [
    ...q.slice(0, need),
    ...fill.slice(0, Math.max(0, need - q.length)).map((b): [number, DaibiTactic] => [b, 'even']),
  ]
  if (all.length < 2) return { changed, world: w }
  // chia rắn theo điểm đài: A B B A A B B A…
  const sorted = [...all].sort(([a], [b]) => (ps.get(b)?.arena?.pts ?? 0) - (ps.get(a)?.arena?.pts ?? 0))
  const teams: [number, DaibiTactic][][] = [[], []]
  sorted.forEach((x, k) => teams[k % 4 === 0 || k % 4 === 3 ? 0 : 1].push(x))
  const { pts, flags } = daibiRun(ps, teams, seed)
  teams.forEach((team, side) => {
    for (const [p] of team) {
      const s = ps.get(p)
      if (!s || !q.some(([x]) => x === p)) continue
      const won = pts[side] > pts[side ? 0 : 1]
      const got = mail(s, {
        at: now,
        k: 'daibi',
        a: [pts[side], pts[side ? 0 : 1], flags.get(p) ?? 0],
        gift: daibiGift(won),
      })
      changed.set(p, {
        ...got,
        daibi: { day: s.daibi?.day ?? dayOf(now), n: s.daibi?.n ?? 1, win: (s.daibi?.win ?? 0) + (won ? 1 : 0) },
      })
    }
  })
  const rest = q.slice(need)
  const { daibi: _, ...base } = w
  return { changed, world: rest.length ? { ...w, daibi: { q: rest, at: now } } : base }
}
