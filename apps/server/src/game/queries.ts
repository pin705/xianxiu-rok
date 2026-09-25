// Truy vấn chỉ đọc của client: mỗi khoá một hàm, trả đúng kiểu Answer[k] (@rok/protocol). Thêm truy vấn: thêm khoá vào
// Query/Answer ở protocol — thiếu hàm ở đây là lỗi biên dịch.
import type { Report } from '@rok/rules'
import { weekOf } from '@rok/rules'
import {
  allyInfo,
  allyOf,
  allyRows,
  arenaBoard,
  arenaFoes,
  boonLeft,
  honorBoard,
  lordOf,
  marketOf,
  profileOf,
  rivals,
  seasonBoard,
  sideKey,
  supplyRoom,
  territoryTiles,
} from '@rok/rules/world'
import type { Answer, Query, QueryOf } from '@rok/protocol'
import * as store from '../db/store.ts'
import { channel, dmsOf, groupViews, sharedIn } from './talk.ts'
import type { Sock, World } from './world.ts'

const SEASON_ROWS = 20 // bảng điểm mùa gửi client: top này
const ARENA_ROWS = 20 // bảng tuần Luận Kiếm Đài: top này
const HONOR_ROWS = 20 // bảng Công Huân mùa: top này

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
  allies: sock => allyRows(w.shared, w.ps, sock.data.pid),
  profile: (sock, q) => {
    if (w.npc.has(q.pid)) return null
    const now = w.now(),
      lord = lordOf(w.shared, w.ps, w.map(now), now)
    const p = profileOf(w.shared, w.ps, q.pid, !!w.slots.get(q.pid)?.conns.size, now, lord)
    const mine = allyOf(w.shared, sock.data.pid)
    const invite = !p?.ally && !!mine && (mine.members[sock.data.pid] ?? 0) >= 1 && q.pid !== sock.data.pid
    const crown = lord === sock.data.pid
    // Vận Linh Trận: còn gửi được bao nhiêu cho người này (chỉ người cùng minh; chợ tắt thì tắt cả tiếp tế)
    const supply = w.info.market ? supplyRoom(w.shared, w.ps, sock.data.pid, q.pid, now) : null
    return p && { ...p, crown, boon: crown ? boonLeft(w.shared, now) : 0, invite, supply }
  },
  dms: sock => dmsOf(w, sock.data.pid),
  groups: sock => groupViews(w, sock.data.pid),
  arena: sock => {
    const now = w.now()
    w.tick(now)
    const board = arenaBoard(w.ps, weekOf(now))
    const k = board.findIndex(([pid]) => pid === sock.data.pid)
    return {
      foes: arenaFoes(w.ps, sock.data.pid, now, Math.random),
      board: board.slice(0, ARENA_ROWS).map(([pid, s]) => ({ pid, name: s.name, pts: s.arena!.pts })),
      rank: k < 0 ? null : k + 1,
    }
  },
  honor: sock => {
    const board = honorBoard(w.ps, w.npc)
    const k = board.findIndex(([pid]) => pid === sock.data.pid)
    return {
      top: board.slice(0, HONOR_ROWS).map(([pid, s]) => ({ pid, name: s.name, n: s.honor ?? 0 })),
      me: k < 0 ? null : { rank: k + 1, n: board[k][1].honor ?? 0 },
    }
  },
  ally: sock => {
    const info = allyInfo(w.shared, w.ps, sock.data.pid, p => !!w.slots.get(p)?.conns.size)
    const now = w.now()
    return info && { ...info, terr: territoryTiles(w.ps, w.shared, w.map(now), now).get(info.id) ?? 0 }
  },
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
  // Chiến báo người khác chia sẻ: chỉ khi trong kênh mình nghe được có tin của chính người đó mang mã "#r<id>"
  shared: async (sock, q) => {
    if (!sharedIn(w, sock.data.pid, q.pid, q.id)) return null
    const mem = [...(w.persist.inflight?.reports ?? []), ...w.persist.pending.reports].find(
      r => r.pid === q.pid && r.id === q.id,
    )
    return (mem?.body ?? (await store.playerReport(w.env.db, q.pid, q.id))) as Report | null
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
