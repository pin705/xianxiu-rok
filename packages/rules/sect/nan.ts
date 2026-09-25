// Thôn Trang Gặp Nạn: báo công việc cứu nạn đã xong (nhận việc ở world/rescue.ts) — NAN_GIFT + một lượt cứu nạn (chỉ số
// `rescue`, ra Hộ Thôn Lệnh ở kho đổi của lễ)
import { no, ok, type Actions } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import { metric } from '../core/fest.ts'
import type { State } from '../core/types.ts'
import { NAN_GIFT } from '../data.ts'

// Tiến độ việc đang làm (đã tăng bao nhiêu so với lúc nhận)
export const nanDone = (s: State) => (s.nan?.q ? metric(s, s.nan.q.m) - s.nan.q.from : 0)

export type NanAction = { type: 'rescueDone' }
export const nanActions: Actions<NanAction> = {
  rescueDone: {
    pick: () => ({ type: 'rescueDone' }),
    run: s => {
      const q = s.nan?.q
      if (!q || q.until < s.time) return no('gone')
      if (nanDone(s) < q.n) return no('not_done')
      const { q: _done, ...nan } = s.nan!
      return ok(grant({ ...s, nan, stats: { ...s.stats, rescued: (s.stats.rescued ?? 0) + 1 } }, NAN_GIFT))
    },
  },
}
