// Thiên Thời (Tides of War của RoK): mỗi thời (THOI_DAYS ngày) tông môn chọn một trong ba chỉ lệnh cho riêng mình tới hết thời —
// chọn rồi không đổi; đường chủ / minh chủ ban một Minh lệnh cho cả minh (Alliance Directives). Cần ngày của mùa nên là thao tác
// giới (MapCtx.day); tăng ích gắn ở worldBuffs (thoiBuffs, orderBuffs).
import { no } from '../core/action.ts'
import { int } from '../core/parse.ts'
import { ALLY_ORDERS, thoiAt } from '../data.ts'
import { allyOf, put, type WorldActions } from './base.ts'

export type ThoiAction = { type: 'thoi'; pick: number } | { type: 'allyOrder'; k: number }
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
  allyOrder: {
    pick: a => (int(0, ALLY_ORDERS.length - 1)(a.k) ? { type: 'allyOrder', k: a.k } : null),
    run: ({ w, pid, map }, a) => {
      const al = allyOf(w, pid)
      if (map?.day === undefined || !al || (al.members[pid] ?? 0) < 1) return no('locked')
      const n = thoiAt(map.day).n
      if (al.order?.n === n) return no('claimed')
      return { ok: true, changed: new Map(), world: put(w, { ...al, order: { n, k: a.k, by: pid } }) }
    },
  },
}
