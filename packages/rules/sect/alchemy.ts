// Luyện đan ở Đan phòng; Ngưng Thần Đan (buff công).
import { no, ok, pay, use, type Actions } from '../core/action.ts'
import { bump } from '../core/calendar.ts'
import { int, oneOf } from '../core/parse.ts'
import { brewCost, brewNeed, brewTime } from '../core/stats.ts'
import { type Buff, type Err, type Items, type State } from '../core/types.ts'
import { afford, PILL_IDS } from '../core/util.ts'
import { BREW_MAX, FOCUS, FOCUS_TIME, PILLS, type PillId } from '../data.ts'

export function brewError(s: State, p: PillId, n: number): Err | null {
  if (!Object.hasOwn(PILLS, p) || !Number.isInteger(n) || n < 1 || n > BREW_MAX) return 'bad'
  if (s.levels.danPhong < PILLS[p].unlock) return 'locked'
  if (s.brew) return 'busy'
  const need = brewNeed(p, n)
  if (PILL_IDS.some(q => (need[q] ?? 0) > (s.items[q] ?? 0))) return 'no_item'
  return afford(s.res, brewCost(s, p, n)) ? null : 'not_enough'
}

export type AlchemyAction = { type: 'brew'; pill: PillId; n: number } | { type: 'focus' } // focus: Ngưng Thần Đan

export const alchemyActions: Actions<AlchemyAction> = {
  brew: {
    pick: a => (oneOf(PILL_IDS)(a.pill) && int(1, BREW_MAX)(a.n) ? { type: 'brew', pill: a.pill, n: a.n } : null),
    run: (s, a) => {
      const e = brewError(s, a.pill, a.n)
      if (e) return no(e)
      const need = brewNeed(a.pill, a.n)
      const items = Object.fromEntries(PILL_IDS.map(p => [p, (s.items[p] ?? 0) - (need[p] ?? 0)])) as Items
      const brew = { pill: a.pill, n: a.n, startAt: s.time, finishAt: s.time + brewTime(s, a.pill, a.n) }
      return ok(bump({ ...s, res: pay(s, brewCost(s, a.pill, a.n)), items, brew }, 'brew'))
    },
  },
  focus: {
    pick: () => ({ type: 'focus' }),
    run: s => {
      if (!s.items.ngungThan) return no('no_item')
      // uống thêm thì kéo dài, không cộng dồn sức
      const cur = s.buffs.find(x => x.src === 'ngungThan')
      const buff: Buff = {
        key: 'atk',
        v: FOCUS,
        until: Math.max(cur?.until ?? 0, s.time) + FOCUS_TIME,
        src: 'ngungThan',
      }
      return ok({ ...s, items: use(s, 'ngungThan'), buffs: [...s.buffs.filter(x => x !== cur), buff] })
    },
  },
}
