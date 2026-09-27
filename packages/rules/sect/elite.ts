// Tinh Binh Luận Kiếm (Keener Blades của RoK — quân tinh nhuệ): trong mùa có luật Tinh Binh (cờ 'elite' của RULES[RULE_ELITE]), Diễn Võ
// Trường đã mở bậc 5 thì mỗi hệ luyện tinh binh tới ELITE_MAX cấp — cấp kế tốn ELITE_COST × cấp mỗi loại tài nguyên. Đệ tử bậc 5 hệ đó
// thêm công / máu (eliteK ở core/stats.ts, nhân trong sideOf)
import { no, ok, pay, type Actions } from '../core/action.ts'
import { oneOf } from '../core/parse.ts'
import { bonus, tierOpen } from '../core/stats.ts'
import type { State } from '../core/types.ts'
import { afford, bag } from '../core/util.ts'
import { ELITE_COST, ELITE_MAX, TYPES, type UnitType } from '../data.ts'

export const eliteOn = (s: State) => bonus(s, 'elite') > 0
export const eliteCost = (lv: number) => bag(() => ELITE_COST * (lv + 1)) // cấp lv → lv + 1

export type EliteAction = { type: 'elite'; unit: UnitType }
export const eliteActions: Actions<EliteAction> = {
  elite: {
    pick: a => (oneOf(TYPES)(a.unit) ? { type: 'elite', unit: a.unit as UnitType } : null),
    run: (s, a) => {
      if (!eliteOn(s) || !tierOpen(s, 5)) return no('locked')
      const lv = s.elite?.[a.unit] ?? 0
      if (lv >= ELITE_MAX) return no('max_level')
      const cost = eliteCost(lv)
      if (!afford(s.res, cost)) return no('not_enough')
      return ok({ ...s, res: pay(s, cost), elite: { ...s.elite, [a.unit]: lv + 1 } })
    },
  },
}
