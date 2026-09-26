// Công pháp ở Tàng Kinh Các.
import { no, ok, pay, type Actions } from '../core/action.ts'
import { stallCost, stallTake } from '../core/stall.ts'
import { oneOf } from '../core/parse.ts'
import { techCost, techTime } from '../core/stats.ts'
import { type Err, type State } from '../core/types.ts'
import { afford, TECH_IDS } from '../core/util.ts'
import { TECH_ROWS, TECHS, type TechId } from '../data.ts'

export function techError(s: State, t: TechId): Err | null {
  const level = (s.tech[t] ?? 0) + 1
  if (level > TECHS[t].max) return 'max_level'
  if (s.levels.tangKinhCac < TECH_ROWS[TECHS[t].row]) return 'locked'
  if (s.study) return 'busy'
  return afford(s.res, stallCost(s, 'tech', techCost(t, level))) ? null : 'not_enough' // Cát Tường Hạ Giá
}

export type ResearchAction = { type: 'study'; tech: TechId }

export const researchActions: Actions<ResearchAction> = {
  study: {
    pick: a => (oneOf(TECH_IDS)(a.tech) ? { type: 'study', tech: a.tech } : null),
    run: (s, a) => {
      const e = techError(s, a.tech)
      if (e) return no(e)
      const level = (s.tech[a.tech] ?? 0) + 1
      const t = stallTake(s, 'tech', techCost(a.tech, level))
      return ok({
        ...t.s,
        res: pay(t.s, t.cost),
        study: { tech: a.tech, level, startAt: s.time, finishAt: s.time + techTime(s, a.tech, level) },
      })
    },
  },
}
