// Thành tựu (như Achievements của RoK): mỗi thành tựu 5 bậc theo một chỉ số tích luỹ, đạt bậc nào nhận quà bậc đó.
import { no, ok, type Actions } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import { metric } from '../core/fest.ts'
import { oneOf } from '../core/parse.ts'
import { type State } from '../core/types.ts'
import { ACH_REWARDS, ACHS, type AchId } from '../data.ts'

export type AchAction = { type: 'ach'; id: AchId }

export const ACH_IDS = Object.keys(ACHS) as AchId[]
// Bậc đã nhận, giá trị hiện tại, đích bậc kế (undefined: đã hết bậc)
export const achGot = (s: State, id: AchId) => s.ach?.[id] ?? 0
export const achValue = (s: State, id: AchId) => metric(s, ACHS[id].m)
export const achNext = (s: State, id: AchId): number | undefined => ACHS[id].tiers[achGot(s, id)]
export const achReady = (s: State, id: AchId) => {
  const next = achNext(s, id)
  return next !== undefined && achValue(s, id) >= next
}
// Số thành tựu đang chờ nhận quà — chấm đỏ trên tab Bảo khố
export const achCount = (s: State) => ACH_IDS.filter(id => achReady(s, id)).length

export const achActions: Actions<AchAction> = {
  ach: {
    pick: a => (oneOf(ACH_IDS)(a.id) ? { type: 'ach', id: a.id } : null),
    run: (s, a) => {
      if (achNext(s, a.id) === undefined) return no('max_level')
      if (!achReady(s, a.id)) return no('not_done')
      const tier = achGot(s, a.id)
      return ok({ ...grant(s, ACH_REWARDS[tier]), ach: { ...s.ach, [a.id]: tier + 1 } })
    },
  },
}
