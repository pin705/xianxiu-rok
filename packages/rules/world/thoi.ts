// Thiên Thời (Tides of War của RoK): mỗi thời (THOI_DAYS ngày) tông môn chọn một trong ba chỉ lệnh cho riêng mình tới hết thời —
// chọn rồi không đổi. Cần ngày của mùa nên là thao tác giới (MapCtx.day); tăng ích gắn ở worldBuffs (thoiBuffs).
import { no } from '../core/action.ts'
import { int } from '../core/parse.ts'
import { thoiAt } from '../data.ts'
import type { WorldActions } from './base.ts'

export type ThoiAction = { type: 'thoi'; pick: number }
export const thoiActions: WorldActions<ThoiAction> = {
  thoi: {
    pick: a => (int(0, 2)(a.pick) ? { type: 'thoi', pick: a.pick } : null),
    run: ({ w, pid, s, map }, a) => {
      if (map?.day === undefined) return no('locked')
      const n = thoiAt(map.day).n
      if (s.thoi?.n === n) return no('claimed')
      return { ok: true, world: w, changed: new Map([[pid, { ...s, thoi: { n, pick: a.pick } }]]) }
    },
  },
}
