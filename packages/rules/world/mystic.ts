// Huyễn Vực Bí Cảnh (Realm of Mystique của RoK): hàng chờ lẻ mỗi độ khó, mỗi người một vai; đủ MYSTIC_TEAM người (chờ lâu thì bù NPC)
// server ghép đội ngẫu nhiên (thứ tự vào hàng) và giải ngay ba màn thủ lĩnh — sức theo lực chiến cả đội, màn cuối là trùm có công pháp.
// Thư: số màn qua, tổng lượt đánh (thời gian), hạng tuần; bảng tuần giữ các đội phá đảo nhanh nhất.
import { fight, might, type Side } from '../combat.ts'
import { no } from '../core/action.ts'
import { mob } from '../core/battle.ts'
import { dayOf, weekOf } from '../core/calendar.ts'
import { oneOf } from '../core/parse.ts'
import type { State } from '../core/types.ts'
import {
  MAIN_SHARE,
  MYSTIC_BOSS,
  MYSTIC_DAILY,
  MYSTIC_HALL,
  MYSTIC_MODES,
  MYSTIC_TEAM,
  MYSTIC_TOP,
  MYSTIC_WAIT,
  PARTY_ROLES,
  TYPES,
  mysticGift,
  type MysticMode,
  type PartyRole,
} from '../data.ts'
import { arenaSide, lineupOf } from '../sect/arena.ts'
import { mail } from '../sect/inbox.ts'
import type { Players, World, WorldActions } from './base.ts'
import { combine } from './fight.ts'

type Entry = [pid: number, role: PartyRole]
const MODES = Object.keys(MYSTIC_MODES) as MysticMode[]
const ROLES = Object.keys(PARTY_ROLES) as PartyRole[]
export const mysticUsed = (s: State, t: number) => (s.mystic?.day === dayOf(t) ? s.mystic.n : 0)
const queue = (w: World, m: MysticMode) => w.mystic?.[m]?.q ?? []
export const mysticIn = (w: World, pid: number) => MODES.find(m => queue(w, m).some(([p]) => p === pid)) ?? null

export type MysticAction = { type: 'mysticJoin'; mode: MysticMode; role: PartyRole } | { type: 'mysticLeave' }
export const mysticActions: WorldActions<MysticAction> = {
  mysticJoin: {
    pick: a =>
      oneOf(MODES)(a.mode) && oneOf(ROLES)(a.role)
        ? { type: 'mysticJoin', mode: a.mode as MysticMode, role: a.role as PartyRole }
        : null,
    run: ({ w, pid, s }, a) => {
      if (s.levels.chuDien < MYSTIC_HALL || !lineupOf(s).length) return no('locked')
      if (mysticIn(w, pid)) return no('claimed')
      const used = mysticUsed(s, s.time)
      if (used >= MYSTIC_DAILY) return no('limit')
      const cur = w.mystic?.[a.mode]
      const q: Entry[] = [...(cur?.q ?? []), [pid, a.role]]
      const me = { ...s, mystic: { day: dayOf(s.time), n: used + 1, win: s.mystic?.win ?? 0 } }
      const mystic = { ...w.mystic, [a.mode]: { q, at: cur?.at ?? s.time } }
      return { ok: true, world: { ...w, mystic }, changed: new Map([[pid, me]]) }
    },
  },
  mysticLeave: {
    pick: () => ({ type: 'mysticLeave' }),
    run: ({ w, pid, s }) => {
      const m = mysticIn(w, pid)
      if (!m) return no('gone')
      const q = queue(w, m).filter(([p]) => p !== pid)
      const me = s.mystic ? { ...s, mystic: { ...s.mystic, n: Math.max(0, s.mystic.n - 1) } } : s // rời hàng: trả lượt
      const { [m]: _, ...rest } = w.mystic ?? {}
      const mystic = q.length ? { ...w.mystic, [m]: { ...w.mystic![m]!, q } } : rest
      return { ok: true, world: { ...w, mystic }, changed: new Map([[pid, me]]) }
    },
  },
}

// Một lượt: đội ghép (vai: Hộ Pháp thêm thủ / máu, Chủ Công thêm công, Trị Liệu hồi quân giữa các màn — mỗi vai tính tối đa hai người)
// đánh ba thủ lĩnh; trả số màn qua và tổng lượt đánh
export function mysticRun(ps: Players, team: Entry[], mode: MysticMode, seed: number) {
  const teams = team.flatMap(([pid]) => {
    const s = ps.get(pid)
    const t = s && lineupOf(s)[0]
    return s && t ? [arenaSide(s, t)] : []
  })
  if (!teams.length) return { stages: 0, rounds: 0 }
  const count = (r: PartyRole) => Math.min(2, team.filter(([, x]) => x === r).length)
  const tank = count('hoPhap') > 0
  const base = combine(teams).side
  let side: Side = {
    ...base,
    troops: base.troops.map(t => ({
      ...t,
      atk: t.atk * (1 + PARTY_ROLES.chuCong.atk * count('chuCong')),
      def: t.def * (tank ? 1 + PARTY_ROLES.hoPhap.def : 1),
      hp: t.hp * (tank ? 1 + PARTY_ROLES.hoPhap.hp : 1),
    })),
  }
  const full = side.troops.map(t => t.n),
    power = might(side)
  let rounds = 0
  for (let k = 0; k < MYSTIC_BOSS.length; k++) {
    const type = TYPES[k % TYPES.length]
    const parts = TYPES.map(
      x => [x, x === type ? MAIN_SHARE : (1 - MAIN_SHARE) / 2] as [(typeof TYPES)[number], number],
    )
    const unit = might(mob(1000, 3, parts))
    const target = power * MYSTIC_BOSS[k] * MYSTIC_MODES[mode]
    const boss = k === MYSTIC_BOSS.length - 1 ? { kind: 'burst' as const, v: 0.8 } : undefined // trùm màn cuối
    const f = fight(side, mob(unit ? (1000 * target) / unit : 0, 3, parts, 1 + k * 3, boss), (seed + k * 7919) >>> 0)
    rounds += f.rounds.length
    if (!f.win) return { stages: k, rounds }
    const left = f.rounds.at(-1)?.n[0] ?? side.troops.map(t => t.n)
    const heal = PARTY_ROLES.triLieu.heal * count('triLieu')
    side = {
      ...side,
      troops: side.troops.map((t, g) => ({
        ...t,
        n: Math.min(full[g], left[g] + Math.floor((full[g] - left[g]) * heal)),
      })),
    }
  }
  return { stages: MYSTIC_BOSS.length, rounds }
}

// Mỗi nhịp, mỗi độ khó: hàng đủ người (hay chờ lâu thì bù NPC, vai xoay vòng) thì ghép đội, giải — thư cho người thật, bảng tuần
export function mysticStep(
  ps: Players,
  w: World,
  now: number,
  seed: number,
  bots: number[],
): { changed: Players; world: World } {
  const changed: Players = new Map()
  let out = w
  const wk = weekOf(now)
  MODES.forEach((mode, mi) => {
    const cur = out.mystic?.[mode]
    const q = cur?.q ?? []
    if (!q.length || (q.length < MYSTIC_TEAM && now - cur!.at < MYSTIC_WAIT)) return
    const fill = bots.filter(b => !q.some(([p]) => p === b) && ps.get(b) && lineupOf(ps.get(b)!).length)
    const team: Entry[] = [
      ...q.slice(0, MYSTIC_TEAM),
      ...fill.slice(0, Math.max(0, MYSTIC_TEAM - q.length)).map((b, k): Entry => [b, ROLES[k % ROLES.length]]),
    ]
    const { stages, rounds } = mysticRun(ps, team, mode, (seed + mi * 104_729) >>> 0)
    // bảng tuần: đội phá đảo, ít lượt trước
    const prev = out.mysticBoard?.week === wk ? out.mysticBoard : { week: wk, normal: [], legend: [] }
    const row = { names: team.map(([p]) => ps.get(p)?.name ?? '?'), rounds }
    const rows =
      stages === MYSTIC_BOSS.length
        ? [...prev[mode], row].sort((a, b) => a.rounds - b.rounds).slice(0, MYSTIC_TOP)
        : prev[mode]
    const rank = rows.indexOf(row) + 1
    for (const [p] of team) {
      const s = changed.get(p) ?? ps.get(p)
      if (!s || !q.some(([x]) => x === p)) continue
      const got = mail(s, { at: now, k: 'mystic', a: [mi, stages, rounds, rank], gift: mysticGift(mode, stages) })
      const win = stages === MYSTIC_BOSS.length ? 1 : 0
      changed.set(p, {
        ...got,
        mystic: { day: s.mystic?.day ?? dayOf(now), n: s.mystic?.n ?? 1, win: (s.mystic?.win ?? 0) + win },
      })
    }
    const rest = q.slice(MYSTIC_TEAM)
    const { [mode]: _, ...others } = out.mystic ?? {}
    const mystic = rest.length ? { ...out.mystic, [mode]: { q: rest, at: now } } : others
    out = { ...out, mystic, mysticBoard: { ...prev, [mode]: rows } }
  })
  return { changed, world: out }
}
