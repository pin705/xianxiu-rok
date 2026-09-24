// Truy vấn chỉ đọc của client: mỗi khoá một hàm, trả đúng kiểu Answer[k] (@rok/protocol). Thêm truy vấn: thêm khoá vào
// Query/Answer ở protocol — thiếu hàm ở đây là lỗi biên dịch.
import type { Report } from '@rok/rules'
import { allyInfo, allyRows, marketOf, rivals, seasonBoard, sideKey } from '@rok/rules/world'
import type { Answer, Query, QueryOf } from '@rok/protocol'
import * as store from '../db/store.ts'
import { channel } from './talk.ts'
import type { Sock, World } from './world.ts'

const SEASON_ROWS = 20 // bảng điểm mùa gửi client: top này

export type Answers = { [K in Query['k']]: (sock: Sock, q: QueryOf<K>) => Answer[K] | Promise<Answer[K]> }

export const answersOf = (w: World): Answers => ({
  rivals: (sock, q) => {
    const now = w.now()
    w.tick(now)
    return rivals(w.ps, sock.data.pid, now, Math.random, w.map(now), q.pid, w.shared)
  },
  chat: (sock, q) => {
    const key = channel(w, sock.data.pid, q.ch)
    return key ? w.chat.history(key) : []
  },
  allies: () => allyRows(w.shared, w.ps),
  ally: sock => allyInfo(w.shared, w.ps, sock.data.pid, p => !!w.slots.get(p)?.conns.size),
  market: (sock, q) => (w.info.market ? marketOf(w.ps, w.shared, sock.data.pid, w.now(), q.good) : null),
  season: sock => {
    const rows = seasonBoard(w.shared, w.ps, w.map(w.now()), w.now())
    const side = sideKey(w.shared, sock.data.pid),
      k = rows.findIndex(r => r.side === side)
    return {
      rows: rows.slice(0, SEASON_ROWS).map(({ name, pts }) => ({ name, pts })),
      me: k < 0 ? null : { rank: k + 1, pts: rows[k].pts },
      fame: w.fame,
    }
  },
  map: sock => {
    const now = w.now()
    w.maps.watch(sock, now)
    return w.snapshot(now)
  },
  // chiến báo chưa kịp ghi DB (đang chờ / đang commit) cộng chiến báo đã ghi
  reports: async (sock, q) => {
    const pid = sock.data.pid
    const mem = [...(w.persist.inflight?.reports ?? []), ...w.persist.pending.reports]
      .filter(r => r.pid === pid && (q.before === undefined || r.id < q.before))
      .map(r => r.body as Report)
    const rows = (await store.playerReports(w.env.db, pid, q.before)) as Report[]
    const byId = new Map<number, Report>()
    for (const r of [...rows, ...mem]) byId.set(r.id, r)
    return [...byId.values()].sort((x, y) => y.id - x.id).slice(0, store.REPORTS_PAGE)
  },
})
