// Anh Linh Điện (Hall of Heroes của RoK): hồi sinh ngay mọi đệ tử tử trận còn giữ hồn (FALLEN_KEEP), tốn REVIVE_COST chi phí tuyển
import { no, ok, pay, type Actions } from '../core/action.ts'
import { trainCost } from '../core/stats.ts'
import type { Army, State } from '../core/types.ts'
import { afford, bag, count } from '../core/util.ts'
import { REVIVE_COST, UNITS } from '../data.ts'

// Đệ tử tử trận còn hồi sinh được lúc t (hết hạn: rỗng)
export const fallenOf = (s: State, t = s.time): Army => (s.fallen && s.fallen.until > t ? s.fallen.army : {})
export const reviveCost = (a: Army) =>
  bag(r => Math.round(UNITS.reduce((sum, u) => sum + (a[u] ?? 0) * trainCost(u, 1)[r], 0) * REVIVE_COST))

export type HeroAction = { type: 'revive' }
export const heroActions: Actions<HeroAction> = {
  revive: {
    pick: () => ({ type: 'revive' }),
    run: s => {
      const army = fallenOf(s)
      if (!count(army)) return no('empty')
      const c = reviveCost(army)
      if (!afford(s.res, c)) return no('not_enough')
      const troops = Object.fromEntries(UNITS.map(u => [u, s.troops[u] + (army[u] ?? 0)])) as State['troops']
      const { fallen: _gone, ...rest } = s
      return ok({ ...rest, res: pay(s, c), troops })
    },
  },
}
