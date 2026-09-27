// Tán Tu Tranh Châu (Ark of Osiris — Silver của RoK): hàng chờ người chơi lẻ, mỗi người một hướng đánh (ô đích trên chiến trường Linh Châu);
// đủ 2 × SILVER_TEAM người (chờ lâu thì bù NPC) server chia hai đội tán tu "Thanh" / "Xích" cân theo điểm đài (rắn A B B A…) và giải trọn
// ARK_ROUNDS hiệp ngay bằng chính luật hiệp của Tranh Đoạt Linh Châu (arkRound, đội đầu Luận Kiếm Đài, không mất quân). Thư điểm hai đội,
// quà như Linh Châu; trận gần nhất giữ ở w.silverLast cho khán giả xem lại.
import { no } from '../core/action.ts'
import { dayOf } from '../core/calendar.ts'
import { oneOf } from '../core/parse.ts'
import type { State } from '../core/types.ts'
import {
  ARK_ADJ,
  ARK_HOME,
  ARK_LOSE,
  ARK_ROUNDS,
  ARK_WIN,
  SILVER_DAILY,
  SILVER_HALL,
  SILVER_TACTICS,
  SILVER_TEAM,
  SILVER_WAIT,
  type SilverTactic,
} from '../data.ts'
import { lineupOf } from '../sect/arena.ts'
import { mail } from '../sect/inbox.ts'
import type { ArkFight, Players, World, WorldActions } from './base.ts'
import { arkRound } from './fight.ts'

const TACTICS = Object.keys(SILVER_TACTICS) as SilverTactic[]
const LAST = ARK_ADJ.length - 1 // bên B nhìn lật: ô x của B là LAST − x
export const silverUsed = (s: State, t: number) => (s.silver?.day === dayOf(t) ? s.silver.n : 0)
const queue = (w: World) => w.silver?.q ?? []

export type SilverAction = { type: 'silverJoin'; tactic: SilverTactic } | { type: 'silverLeave' }
export const silverActions: WorldActions<SilverAction> = {
  silverJoin: {
    pick: a => (oneOf(TACTICS)(a.tactic) ? { type: 'silverJoin', tactic: a.tactic as SilverTactic } : null),
    run: ({ w, pid, s }, a) => {
      if (s.levels.chuDien < SILVER_HALL || !lineupOf(s).length) return no('locked')
      if (queue(w).some(([p]) => p === pid)) return no('claimed')
      const used = silverUsed(s, s.time)
      if (used >= SILVER_DAILY) return no('limit')
      const q: [number, SilverTactic][] = [...queue(w), [pid, a.tactic]]
      const me = { ...s, silver: { day: dayOf(s.time), n: used + 1, win: s.silver?.win ?? 0 } }
      return { ok: true, world: { ...w, silver: { q, at: w.silver?.at ?? s.time } }, changed: new Map([[pid, me]]) }
    },
  },
  silverLeave: {
    pick: () => ({ type: 'silverLeave' }),
    run: ({ w, pid, s }) => {
      if (!queue(w).some(([p]) => p === pid)) return no('gone')
      const q = queue(w).filter(([p]) => p !== pid)
      const me = s.silver ? { ...s, silver: { ...s.silver, n: Math.max(0, s.silver.n - 1) } } : s // rời hàng: trả lượt
      const { silver: _, ...rest } = w
      return { ok: true, world: q.length ? { ...w, silver: { ...w.silver!, q } } : rest, changed: new Map([[pid, me]]) }
    },
  },
}

// Một trận trọn ARK_ROUNDS hiệp: mỗi người đi thẳng tới ô đích theo hướng đánh (người thứ k chọn ô k trong các ô của hướng)
export function silverRun(ps: Players, teams: [number, SilverTactic][][], seed: number): ArkFight {
  const units = teams.flatMap((team, side) =>
    team.map(([pid, tac], k) => {
      const opts = SILVER_TACTICS[tac]
      const to = opts[k % opts.length]
      return {
        pid,
        side: side as 0 | 1,
        at: ARK_HOME[side],
        to: side ? LAST - to : to,
        n: [] as number[],
        nm: ps.get(pid)?.name,
      }
    }),
  )
  let f: ArkFight = {
    a: -1,
    b: -2,
    an: 'Thanh',
    bn: 'Xích',
    round: 0,
    units,
    own: ARK_ADJ.map((_, i) => (i === ARK_HOME[0] ? 0 : i === ARK_HOME[1] ? 1 : null)),
    pts: [0, 0],
    taken: [[], []],
    charged: [[], []],
    orb: null,
    log: [],
  }
  for (let r = 0; r < ARK_ROUNDS; r++) f = arkRound(ps, f, (seed + r * 7919) >>> 0)
  return f
}

// Mỗi nhịp: hàng đủ người (hay chờ lâu thì bù NPC hướng Trung Điện) thì chia đội, giải trọn trận — thư cho người thật
export function silverStep(
  ps: Players,
  w: World,
  now: number,
  seed: number,
  bots: number[],
): { changed: Players; world: World } {
  const changed: Players = new Map()
  const q = queue(w),
    need = 2 * SILVER_TEAM
  if (!q.length || (q.length < need && now - w.silver!.at < SILVER_WAIT)) return { changed, world: w }
  const fill = bots.filter(b => !q.some(([p]) => p === b) && ps.get(b) && lineupOf(ps.get(b)!).length)
  const all: [number, SilverTactic][] = [
    ...q.slice(0, need),
    ...fill.slice(0, Math.max(0, need - q.length)).map((b): [number, SilverTactic] => [b, 'center']),
  ]
  if (all.length < 2) return { changed, world: w }
  const sorted = [...all].sort(([a], [b]) => (ps.get(b)?.arena?.pts ?? 0) - (ps.get(a)?.arena?.pts ?? 0))
  const teams: [number, SilverTactic][][] = [[], []]
  sorted.forEach((x, k) => teams[k % 4 === 0 || k % 4 === 3 ? 0 : 1].push(x))
  const f = silverRun(ps, teams, seed)
  teams.forEach((team, side) => {
    const won = f.pts[side] > f.pts[side ? 0 : 1]
    for (const [p] of team) {
      const s = ps.get(p)
      if (!s || !q.some(([x]) => x === p)) continue
      const got = mail(s, {
        at: now,
        k: 'silver',
        a: [f.pts[side], f.pts[side ? 0 : 1], f.units.find(u => u.pid === p)?.sc ?? 0], // + công huân cá nhân
        gift: won ? ARK_WIN : ARK_LOSE,
      })
      changed.set(p, {
        ...got,
        silver: { day: s.silver?.day ?? dayOf(now), n: s.silver?.n ?? 1, win: (s.silver?.win ?? 0) + (won ? 1 : 0) },
      })
    }
  })
  const rest = q.slice(need)
  const { silver: _, ...base } = w
  return { changed, world: { ...(rest.length ? { ...w, silver: { q: rest, at: now } } : base), silverLast: f } }
}
