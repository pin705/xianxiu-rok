// Bế Quan Lệnh (Vacation Permit của RoK): chưởng môn bế quan SECLUDE_DAYS ngày — khiên tới hết hạn nên không ai cướp được, nhưng
// tông môn cũng chỉ làm được SECLUDE_OK (apply / worldAct chặn phần còn lại); phải không có đội ở ngoài, không đang sát khí.
// Xuất quan lúc nào cũng được (khiên trở lại như trước khi bế quan), rồi SECLUDE_COOL mới bế quan lại.
import { no, ok, type Actions } from '../core/action.ts'
import type { State } from '../core/types.ts'
import { SECLUDE_COOL, SECLUDE_DAYS } from '../data.ts'

export const secluded = (s: State) => !!s.seclude && s.seclude.until > s.time

export type SecludeAction = { type: 'seclude'; days: number } | { type: 'unseclude' }
export const secludeActions: Actions<SecludeAction> = {
  seclude: {
    pick: a => (SECLUDE_DAYS.includes(a.days as number) ? { type: 'seclude', days: a.days as number } : null),
    run: (s, a) => {
      if (secluded(s)) return no('busy')
      if ((s.secludeAt ?? 0) > s.time) return no('cooldown')
      if (s.marches.length) return no('busy') // còn đội ở ngoài
      if ((s.frenzy ?? 0) > s.time) return no('frenzy')
      const until = s.time + a.days * 86_400_000
      return ok({ ...s, seclude: { until, shield: s.shield }, shield: Math.max(s.shield, until) })
    },
  },
  unseclude: {
    pick: () => ({ type: 'unseclude' }),
    run: s => {
      if (!secluded(s)) return no('bad')
      const { seclude, ...rest } = s
      return ok({ ...rest, shield: seclude!.shield, secludeAt: s.time + SECLUDE_COOL })
    },
  },
}
