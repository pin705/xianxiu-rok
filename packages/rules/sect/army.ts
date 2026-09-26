// Đệ tử: tuyển, nâng bậc, chữa thương binh ở Đan phòng, Hồi Xuân Đan.
import { no, ok, pay, use, type Actions } from '../core/action.ts'
import { bump } from '../core/calendar.ts'
import { int, oneOf } from '../core/parse.ts'
import { batch, healCost, healTime, HIGH_FIRST, tierOpen, trainCost, trainTime, unitOf } from '../core/stats.ts'
import { type Army, type Err, type State } from '../core/types.ts'
import { afford, bag, count, minus, plus } from '../core/util.ts'
import { CURE, UNITS, type UnitId } from '../data.ts'

export function trainError(s: State, u: UnitId, n: number): Err | null {
  if (!UNITS.includes(u) || !Number.isInteger(n) || n < 1 || n > batch(s)) return 'bad'
  if (!s.levels.dienVoTruong || !tierOpen(s, unitOf(u).tier)) return 'locked'
  if (s.train) return 'busy'
  return afford(s.res, trainCost(u, n)) ? null : 'not_enough'
}

export function healError(s: State): Err | null {
  if (!s.levels.danPhong) return 'locked'
  if (s.heal) return 'busy'
  if (!count(s.wounded)) return 'empty'
  return afford(s.res, healCost(s, s.wounded)) ? null : 'not_enough'
}

// Nâng bậc (Upgrade Troops của RoK): n đệ tử ở nhà lên bậc kế cùng hệ, trả phần chênh chi phí; thời gian là phần chênh
// (ít nhất 30 % thời gian tuyển thẳng bậc mới). Dùng lượt tuyển của Diễn võ trường.
export function promoteTo(u: UnitId): UnitId | null {
  const { type, tier } = unitOf(u)
  return tier < 5 ? (`${type}${tier + 1}` as UnitId) : null
}
export function promoteCost(u: UnitId, n: number) {
  const hi = trainCost(promoteTo(u) ?? u, n),
    lo = trainCost(u, n)
  return bag(r => Math.max(0, hi[r] - lo[r]))
}
export function promoteTime(s: State, u: UnitId, n: number) {
  const full = trainTime(s, promoteTo(u) ?? u, n)
  return Math.max(full - trainTime(s, u, n), Math.round(full * 0.3))
}
export function promoteError(s: State, u: UnitId, n: number): Err | null {
  const to = promoteTo(u)
  if (!to || !Number.isInteger(n) || n < 1 || n > batch(s)) return 'bad'
  if (!s.levels.dienVoTruong || !tierOpen(s, unitOf(to).tier)) return 'locked'
  if (s.train) return 'busy'
  if (s.troops[u] < n) return 'not_enough'
  return afford(s.res, promoteCost(u, n)) ? null : 'not_enough'
}

export type ArmyAction =
  | { type: 'train'; unit: UnitId; n: number }
  | { type: 'promote'; unit: UnitId; n: number } // unit: bậc đang có
  | { type: 'heal' }
  | { type: 'cure' } // cure: Hồi Xuân Đan

export const armyActions: Actions<ArmyAction> = {
  train: {
    pick: a => (oneOf(UNITS)(a.unit) && int(1, 1e6)(a.n) ? { type: 'train', unit: a.unit, n: a.n } : null),
    run: (s, a) => {
      const e = trainError(s, a.unit, a.n)
      if (e) return no(e)
      const train = { unit: a.unit, n: a.n, startAt: s.time, finishAt: s.time + trainTime(s, a.unit, a.n) }
      return ok(bump({ ...s, res: pay(s, trainCost(a.unit, a.n)), train }, 'train', a.n))
    },
  },
  promote: {
    pick: a => (oneOf(UNITS)(a.unit) && int(1, 1e6)(a.n) ? { type: 'promote', unit: a.unit, n: a.n } : null),
    run: (s, a) => {
      const e = promoteError(s, a.unit, a.n)
      if (e) return no(e)
      const train = {
        unit: promoteTo(a.unit)!,
        n: a.n,
        startAt: s.time,
        finishAt: s.time + promoteTime(s, a.unit, a.n),
        up: true as const,
      }
      const troops = minus(s.troops, { [a.unit]: a.n })
      return ok(bump({ ...s, troops, res: pay(s, promoteCost(a.unit, a.n)), train }, 'train', a.n))
    },
  },
  heal: {
    pick: () => ({ type: 'heal' }),
    run: s => {
      const e = healError(s)
      if (e) return no(e)
      const hurt = { ...s.wounded }
      return ok({
        ...s,
        res: pay(s, healCost(s, hurt)),
        heal: { troops: hurt, startAt: s.time, finishAt: s.time + healTime(s, hurt) },
      })
    },
  },
  cure: {
    pick: () => ({ type: 'cure' }),
    run: s => {
      if (!s.items.hoiXuan) return no('no_item')
      // thương binh chưa nằm trong đợt đang chữa, bậc cao trước
      const free = minus(s.wounded, s.heal?.troops ?? {})
      let left = CURE
      const up: Army = {}
      for (const u of HIGH_FIRST) {
        const n = Math.min(free[u], left)
        if (n > 0) {
          up[u] = n
          left -= n
        }
      }
      if (!count(up)) return no('empty')
      return ok({
        ...s,
        items: use(s, 'hoiXuan'),
        troops: plus(s.troops, up),
        wounded: minus(s.wounded, up),
        stats: { ...s.stats, healed: s.stats.healed + count(up) },
      })
    },
  },
}
