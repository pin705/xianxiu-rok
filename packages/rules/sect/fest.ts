// Trung tâm sự kiện: nhận quà (ngày đăng nhập, mục tiêu, mốc điểm) của sự kiện đang mở.
import { no, ok, type Actions } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import { FEST_IDS, festDone, festGot, festOpen, festRewards } from '../core/fest.ts'
import { int, oneOf } from '../core/parse.ts'
import { type Err, type State } from '../core/types.ts'
import { NHAT_KHOA_DAY, type FestId } from '../data.ts'

export type FestAction = { type: 'fest'; id: FestId; i: number }

export function festError(s: State, id: FestId, i: number): Err | null {
  if (!festOpen(s, id, s.time)) return 'locked'
  if (!festRewards(id)[i]) return 'bad'
  if (festGot(s, id, i)) return 'claimed'
  return festDone(s, id, i) ? null : 'not_done'
}

export const festActions: Actions<FestAction> = {
  fest: {
    pick: a => (oneOf(FEST_IDS)(a.id) && int(0, 99)(a.i) ? { type: 'fest', id: a.id, i: a.i } : null),
    run: (s, a) => {
      const e = festError(s, a.id, a.i)
      if (e) return no(e)
      const f = s.fest[a.id]!
      const st = { ...grant(s, festRewards(a.id)[a.i]), fest: { ...s.fest, [a.id]: { ...f, got: [...f.got, a.i] } } }
      // rương mốc 60 của Nhật Khóa = một hôm "mở rương ngày" cho nhiệm vụ tuần
      if (a.id !== 'nhatKhoa' || a.i !== NHAT_KHOA_DAY) return ok(st)
      return ok({ ...st, weekly: { ...st.weekly, n: { ...st.weekly.n, days: st.weekly.n.days + 1 } } })
    },
  },
}
