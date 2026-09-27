// Binh Thư Phong Vân (Storm of Stratagems của RoK): trong mùa có luật Binh Thư (cờ 'folio' của RULES[RULE_FOLIO]) mỗi tông môn cài một
// trang sách lược vào mỗi ô Công / Thủ / Mưu (FOLIO); trang thứ k mở khi Công Huân mùa ≥ FOLIO_HONOR[k]. Cài vào ô trống lúc nào cũng được,
// thay / gỡ trang đang cài thì chờ FOLIO_COOL từ lần đổi ô đó. Tăng ích cộng trong bonus() (core/stats.ts), phản kết trận ở world/raid.ts
import { no, ok, type Actions } from '../core/action.ts'
import { int } from '../core/parse.ts'
import { bonus } from '../core/stats.ts'
import type { State } from '../core/types.ts'
import { FOLIO, FOLIO_COOL, FOLIO_HONOR } from '../data.ts'

export const folioOn = (s: State) => bonus(s, 'folio') > 0
export const folioOf = (s: State) => s.folio ?? { p: FOLIO.map(() => null), at: FOLIO.map(() => 0) }
// Lúc ô slot đổi được (0: ngay)
export const folioReady = (s: State, slot: number) => {
  const f = folioOf(s)
  return f.p[slot] === null ? 0 : f.at[slot] + FOLIO_COOL
}

export type FolioAction = { type: 'folio'; slot: number; page: number | null }
export const folioActions: Actions<FolioAction> = {
  folio: {
    pick: a =>
      int(0, FOLIO.length - 1)(a.slot) && (a.page === null || int(0, FOLIO_HONOR.length - 1)(a.page))
        ? { type: 'folio', slot: a.slot as number, page: a.page as number | null }
        : null,
    run: (s, a) => {
      if (!folioOn(s)) return no('locked')
      if (a.page !== null && (s.honor ?? 0) < FOLIO_HONOR[a.page]) return no('locked')
      const f = folioOf(s)
      if (f.p[a.slot] === a.page) return no('claimed')
      if (folioReady(s, a.slot) > s.time) return no('cooldown')
      const p = f.p.map((x, k) => (k === a.slot ? a.page : x)),
        at = f.at.map((x, k) => (k === a.slot ? s.time : x))
      return ok({ ...s, folio: { p, at } })
    },
  },
}
