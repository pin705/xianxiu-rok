// Luận Võ Liên Hoàn (Arms Training của RoK): đội ảo đấu liên tiếp giáo đầu mạnh dần, quân không hồi giữa các trận; cứ vài trận
// thắng tự chọn công pháp cho giáo đầu (roguelite ngược). Số liệu: DRILL_* ở data.ts. Trận có mầm bí mật nên client chờ server.
import { fight, might, rng, type Side } from '../combat.ts'
import { no, ok, type Actions } from '../core/action.ts'
import { armyError, grant, mob, pushReport, sideOf, snap, tierFor } from '../core/battle.ts'
import { dayOf } from '../core/calendar.ts'
import { int, isElder, pickArmy } from '../core/parse.ts'
import { deputyOf, elderLevel } from '../core/stats.ts'
import type { Army, Drill, State } from '../core/types.ts'
import { compact, mainType, nextSeed, noGain } from '../core/util.ts'
import {
  BEATS,
  DRILL_BASE,
  DRILL_EVERY,
  DRILL_GIFTS,
  DRILL_GROW,
  DRILL_HALL,
  DRILL_MODS,
  MAIN_SHARE,
  TYPES,
  UNITS,
  type DrillMod,
  type ElderId,
} from '../data.ts'

const MODS = Object.keys(DRILL_MODS) as DrillMod[]
// Phiên hôm nay (hết ngày: phiên mới)
export const drillToday = (s: State) => (s.drill?.day === dayOf(s.time) ? s.drill : undefined)
// Giáo đầu trận kế tiếp: sức theo lực chiến đội lúc vào phiên × DRILL_GROW^thắng, hệ chính xoay vòng (Khắc Chế: hệ khắc hệ chính
// đội mình), công pháp đã chọn cộng dồn
export function drillFoe(s: State, d: Drill): Side {
  const tier = tierFor(s.levels.chuDien)
  const type = d.mods.includes('khac') ? TYPES.find(x => BEATS[x] === mainType(d.army))! : TYPES[d.wins % TYPES.length]
  const parts = TYPES.map(x => [x, x === type ? MAIN_SHARE : (1 - MAIN_SHARE) / 2] as [(typeof TYPES)[number], number])
  const unit = might(mob(1000, tier, parts))
  const side = mob(unit ? (1000 * d.base * DRILL_GROW ** d.wins) / unit : 0, tier, parts, 1 + d.wins)
  const k = (key: 'atk' | 'def' | 'hp' | 'n') =>
    1 + d.mods.reduce((x, m) => x + ((DRILL_MODS[m] as Partial<Record<typeof key, number>>)[key] ?? 0), 0)
  return {
    ...side,
    troops: side.troops.map(t => ({
      ...t,
      atk: t.atk * k('atk'),
      def: t.def * k('def'),
      hp: t.hp * k('hp'),
      n: Math.round(t.n * k('n')),
    })),
  }
}

export type DrillAction =
  { type: 'drillStart'; elder: ElderId; army: Army } | { type: 'drillFight' } | { type: 'drillPick'; i: number }

export const drillActions: Actions<DrillAction> = {
  drillStart: {
    pick: a => {
      const army = pickArmy(a.army)
      return army && isElder(a.elder) ? { type: 'drillStart', elder: a.elder, army } : null
    },
    run: (s, a) => {
      if (s.levels.chuDien < DRILL_HALL) return no('locked')
      if (drillToday(s)) return no('claimed') // mỗi ngày một phiên
      const e = armyError(s, a.elder, a.army)
      if (e) return no(e)
      const army = compact(a.army)
      const base = might(sideOf(s, a.elder, army, deputyOf(s, a.elder))) * DRILL_BASE
      return ok({ ...s, drill: { day: dayOf(s.time), elder: a.elder, army, base, wins: 0, mods: [], got: 0 } })
    },
  },
  drillFight: {
    pick: () => ({ type: 'drillFight' }),
    run: s => {
      const d = drillToday(s)
      if (!d || d.over) return no('locked')
      if (d.offer) return no('busy') // chọn công pháp cho giáo đầu trước
      const deputy = deputyOf(s, d.elder)
      const me = sideOf(s, d.elder, d.army, deputy)
      const foe = drillFoe(s, d)
      const f = fight(me, foe, s.seed)
      const ids = UNITS.filter(u => (d.army[u] ?? 0) > 0)
      const left = f.rounds.at(-1)?.n[0] ?? ids.map(u => d.army[u]!)
      const army = compact(Object.fromEntries(ids.map((u, k) => [u, left[k]])) as Army)
      const wins = d.wins + (f.win ? 1 : 0)
      // ba công pháp khác nhau cho giáo đầu (tất định theo mầm)
      const r = rng(s.seed ^ 0xd411)
      const offer = f.win && wins % DRILL_EVERY === 0 ? [...MODS].sort(() => r() - 0.5).slice(0, 3) : undefined
      let st = pushReport(
        { ...s, seed: nextSeed(s.seed) },
        {
          at: s.time,
          kind: 'drill',
          i: d.wins,
          win: f.win,
          hurt: {}, // đội ảo: không có thương binh thật
          dead: {},
          gain: noGain(),
          fights: [
            {
              a: snap(me, d.elder, elderLevel(s.elders[d.elder]), deputy),
              b: snap(foe, undefined, 1 + d.wins),
              rounds: f.rounds,
            },
          ],
        },
      )
      let got = d.got
      while (DRILL_GIFTS[got] && wins >= DRILL_GIFTS[got].n) st = grant(st, DRILL_GIFTS[got++].reward)
      return ok({ ...st, drill: { ...d, army, wins, got, ...(offer && { offer }), ...(!f.win && { over: true }) } })
    },
  },
  drillPick: {
    pick: a => (int(0, 2)(a.i) ? { type: 'drillPick', i: a.i } : null),
    run: (s, a) => {
      const d = drillToday(s)
      const m = d?.offer?.[a.i]
      if (!d || !m) return no('locked')
      const { offer: _, ...rest } = d
      return ok({ ...s, drill: { ...rest, mods: [...d.mods, m] } })
    },
  },
}
