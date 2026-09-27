// Vân Chu Hội Chiến (Tempest Clash của RoK, bản nhanh bất đồng bộ — biến thể luật của Tiên Môn Đại Bỉ): mọi buff tắt, mỗi người một linh
// chu đồng chỉ số và một thế (công / thủ); đủ 2 × VANCHU_TEAM người (chờ lâu thì bù NPC) server chia hai đội xen kẽ và giải ngay: mỗi hiệp,
// ở Vận Lương Chu của mỗi bên thuyền công địch gộp đánh thuyền thủ, thuyền công còn đứng phá thuyền lương. Thư: máu thuyền lương hai bên,
// số thuyền địch mình góp đánh chìm.
import { fight, type Side } from '../combat.ts'
import { no } from '../core/action.ts'
import { dayOf } from '../core/calendar.ts'
import { oneOf } from '../core/parse.ts'
import type { State } from '../core/types.ts'
import {
  TIER,
  UNIT_BASE,
  VANCHU_DAILY,
  VANCHU_GUARD,
  VANCHU_HALL,
  VANCHU_HIT,
  VANCHU_N,
  VANCHU_ROUNDS,
  VANCHU_SHIPS,
  VANCHU_STANCES,
  VANCHU_SUPPLY,
  VANCHU_TEAM,
  VANCHU_TIER,
  VANCHU_WAIT,
  vanchuGift,
  type VanchuShip,
  type VanchuStance,
} from '../data.ts'
import { mail } from '../sect/inbox.ts'
import type { Players, World, WorldActions } from './base.ts'
import { combine } from './fight.ts'

type Entry = [pid: number, ship: VanchuShip, stance: VanchuStance]
const SHIPS = Object.keys(VANCHU_SHIPS) as VanchuShip[]
export const vanchuUsed = (s: State, t: number) => (s.vanchu?.day === dayOf(t) ? s.vanchu.n : 0)
const queue = (w: World) => w.vanchu?.q ?? []

export type VanchuAction = { type: 'vanchuJoin'; ship: VanchuShip; stance: VanchuStance } | { type: 'vanchuLeave' }
export const vanchuActions: WorldActions<VanchuAction> = {
  vanchuJoin: {
    pick: a =>
      oneOf(SHIPS)(a.ship) && oneOf(VANCHU_STANCES)(a.stance)
        ? { type: 'vanchuJoin', ship: a.ship as VanchuShip, stance: a.stance as VanchuStance }
        : null,
    run: ({ w, pid, s }, a) => {
      if (s.levels.chuDien < VANCHU_HALL) return no('locked')
      if (queue(w).some(([p]) => p === pid)) return no('claimed')
      const used = vanchuUsed(s, s.time)
      if (used >= VANCHU_DAILY) return no('limit')
      const q: Entry[] = [...queue(w), [pid, a.ship, a.stance]]
      const me = { ...s, vanchu: { day: dayOf(s.time), n: used + 1, win: s.vanchu?.win ?? 0 } }
      return { ok: true, world: { ...w, vanchu: { q, at: w.vanchu?.at ?? s.time } }, changed: new Map([[pid, me]]) }
    },
  },
  vanchuLeave: {
    pick: () => ({ type: 'vanchuLeave' }),
    run: ({ w, pid, s }) => {
      if (!queue(w).some(([p]) => p === pid)) return no('gone')
      const q = queue(w).filter(([p]) => p !== pid)
      const me = s.vanchu ? { ...s, vanchu: { ...s.vanchu, n: Math.max(0, s.vanchu.n - 1) } } : s // rời hàng: trả lượt
      const { vanchu: _, ...rest } = w
      return { ok: true, world: q.length ? { ...w, vanchu: { ...w.vanchu!, q } } : rest, changed: new Map([[pid, me]]) }
    },
  },
}

// Linh chu: VANCHU_N đệ tử bậc VANCHU_TIER của hệ thuyền nhân nét thuyền — không công pháp, không buff nào; thuyền thủ thêm VANCHU_GUARD thủ
export function shipSide(ship: VanchuShip, guard = false): Side {
  const k = VANCHU_SHIPS[ship],
    base = UNIT_BASE[k.type],
    st = TIER[VANCHU_TIER].stat
  const def = base.def * st * k.def * (guard ? 1 + VANCHU_GUARD : 1)
  return {
    troops: [
      { type: k.type, tier: VANCHU_TIER, n: VANCHU_N, atk: base.atk * st * k.atk, def, hp: base.hp * st * k.hp },
    ],
  }
}

type Boat = { pid: number; team: 0 | 1; ship: VanchuShip; stance: VanchuStance; rest: number }
// Thuyền công địch đánh thuyền thủ ở Vận Lương Chu của bên home, hiệp r: trả phần quân còn của từng thuyền công (0: chìm / lui),
// thuyền chìm nghỉ hết hiệp sau; mỗi thuyền chìm ghi công cho các thuyền bên kia còn đứng
function clash(atk: Boat[], def: Boat[], r: number, seed: number, sunk: Map<number, number>): number[] {
  if (!def.length) return atk.map(() => 1)
  const A = combine(atk.map(b => shipSide(b.ship))),
    D = combine(def.map(b => shipSide(b.ship, true)))
  const f = fight(A.side, D.side, seed)
  const last = f.rounds.at(-1)?.n ?? [A.side.troops.map(t => t.n), D.side.troops.map(t => t.n)]
  const won = last[0].some(n => n > 0) && !last[1].some(n => n > 0) // hoà thì bên thủ giữ được
  const left = atk.map((_, j) => (won ? last[0][A.at[j]] / VANCHU_N : 0))
  const down = [...atk.filter((_, j) => !left[j]), ...def.filter((_, j) => !last[1][D.at[j]])]
  for (const b of down) {
    b.rest = r + 1
    for (const o of b.stance === 'atk' ? def : atk) if (!down.includes(o)) sunk.set(o.pid, (sunk.get(o.pid) ?? 0) + 1)
  }
  return left
}

// Một trận: hai đội [người, thuyền, thế]; trả máu Vận Lương Chu còn của hai đội, sức phá mỗi đội đã gây (kể cả phần quá tay — hai thuyền
// lương chìm cùng hiệp thì bên phá mạnh hơn thắng), số thuyền địch từng người góp đánh chìm, số hiệp đã đánh
export function vanchuRun(teams: Entry[][], seed: number) {
  const boats: Boat[] = teams.flatMap((t, team) =>
    t.map(([pid, ship, stance]) => ({ pid, team: team as 0 | 1, ship, stance, rest: -1 })),
  )
  const hp: [number, number] = [VANCHU_SUPPLY, VANCHU_SUPPLY],
    dealt: [number, number] = [0, 0]
  const sunk = new Map<number, number>()
  let rounds = 0
  while (rounds < VANCHU_ROUNDS && hp[0] > 0 && hp[1] > 0) {
    const r = ++rounds
    const on = (team: number, stance: VanchuStance) =>
      boats.filter(b => b.team === team && b.stance === stance && b.rest < r)
    // hai Vận Lương Chu đánh cùng lúc: lấy quân từng bên trước rồi mới giải (thuyền chìm ở bên này không ảnh hưởng bên kia trong hiệp)
    const fronts = ([0, 1] as const).map(home => [on(home ? 0 : 1, 'atk'), on(home, 'def')] as const)
    fronts.forEach(([atk, def], home) => {
      const left = clash(atk, def, r, (seed + r * 131 + home * 7919) >>> 0, sunk)
      const hit = Math.round(left.reduce((n, x) => n + x, 0) * VANCHU_HIT)
      hp[home] = Math.max(0, hp[home] - hit)
      dealt[home ? 0 : 1] += hit
    })
  }
  return { hp, dealt, sunk, rounds }
}
// Kết quả với đội side: 1 thắng · 0 hoà · −1 thua — máu thuyền lương còn trước, bằng nhau thì sức phá
export const vanchuResult = ({ hp, dealt }: { hp: number[]; dealt: number[] }, side: 0 | 1) =>
  Math.sign(hp[side] - hp[1 - side] || dealt[side] - dealt[1 - side])

// Mỗi nhịp: hàng đủ người (hay chờ lâu thì bù NPC: thuyền xoay vòng, 3 công 2 thủ) thì chia đội xen kẽ, giải — thư cho người thật
export function vanchuStep(
  ps: Players,
  w: World,
  now: number,
  seed: number,
  bots: number[],
): { changed: Players; world: World } {
  const changed: Players = new Map()
  const q = queue(w),
    need = 2 * VANCHU_TEAM
  if (!q.length || (q.length < need && now - w.vanchu!.at < VANCHU_WAIT)) return { changed, world: w }
  const fill = bots.filter(b => !q.some(([p]) => p === b) && ps.has(b)).slice(0, Math.max(0, need - q.length))
  const all: Entry[] = [
    ...q.slice(0, need),
    ...fill.map((b, k): Entry => [b, SHIPS[(b + seed) % SHIPS.length], k % 5 < 3 ? 'atk' : 'def']),
  ]
  if (all.length < 2) return { changed, world: w }
  const teams: Entry[][] = [all.filter((_, k) => k % 2 === 0), all.filter((_, k) => k % 2 === 1)]
  const run = vanchuRun(teams, seed),
    { hp, sunk, rounds } = run
  teams.forEach((team, side) => {
    const res = vanchuResult(run, side as 0 | 1),
      won = res > 0
    for (const [p] of team) {
      const s = ps.get(p)
      if (!s || !q.some(([x]) => x === p)) continue
      const got = mail(s, {
        at: now,
        k: 'vanchu',
        a: [hp[side], hp[side ? 0 : 1], sunk.get(p) ?? 0, rounds, res],
        gift: vanchuGift(won),
      })
      const v = { day: s.vanchu?.day ?? dayOf(now), n: s.vanchu?.n ?? 1, win: (s.vanchu?.win ?? 0) + (won ? 1 : 0) }
      changed.set(p, { ...got, vanchu: v })
    }
  })
  const rest = q.slice(need)
  const { vanchu: _, ...base } = w
  return { changed, world: rest.length ? { ...w, vanchu: { q: rest, at: now } } : base }
}
