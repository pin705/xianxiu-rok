// Truy vấn chỉ đọc của client: mỗi khoá một hàm, trả đúng kiểu Answer[k] (@rok/protocol). Thêm truy vấn: thêm khoá vào
// Query/Answer ở protocol — thiếu hàm ở đây là lỗi biên dịch.
import type { Report } from '@rok/rules'
import {
  CAMP_STAGE_DAYS,
  FEST_ALLY,
  FEST_RANKED,
  FEST_STAGED,
  arenaUpper,
  festAt,
  power,
  weekOf,
  type FestId,
  RULE_FOUR,
} from '@rok/rules'
import {
  allyInfo,
  allyOf,
  arkOf,
  allyRows,
  arenaBoard,
  arenaFoes,
  boonLeft,
  honorBoard,
  lordOf,
  lordSide,
  marketOf,
  profileOf,
  rivals,
  seasonBoard,
  sideKey,
  supplyRoom,
  territoryTiles,
  arkRow,
  campOf,
  mysticIn,
  campTotal,
  fourOf,
  fourPts,
  festAllyBoard,
  festBoard,
  stageGain,
  stageMetric,
  stageScore,
  tourneyView,
  voteOpen,
  betView,
  heroView,
  paperView,
  recallsOf,
  awayDays,
  boardView,
  topicView,
  voteTally,
  type Chron,
} from '@rok/rules/world'
import type { Answer, FestView, Query, QueryOf } from '@rok/protocol'
import * as store from '../db/store.ts'
import { channel, dmsOf, groupViews, sharedIn } from './talk.ts'
import type { Sock, World } from './world.ts'

const SEASON_ROWS = 20 // bảng điểm mùa gửi client: top này
const ARENA_ROWS = 20 // bảng tuần Luận Kiếm Đài: top này
const HONOR_ROWS = 20 // bảng Công Huân mùa: top này

// Chặng thi đua Chính Tà đang chạy (bảng mùa): việc, lúc hết, điểm hai phái, phần người hỏi góp, số chặng đã thắng, chặng vừa xong
function stageView(w: World, pid: number) {
  const st = w.shared.stage
  if (!st) return undefined
  return {
    n: st.n,
    m: stageMetric(st.n),
    end: w.opened + (st.n + 1) * CAMP_STAGE_DAYS * 86_400_000,
    score: stageScore(w.ps, w.shared),
    mine: stageGain(w.ps, w.shared, pid),
    wins: w.shared.stageWins ?? ([0, 0] as [number, number]),
    ...(w.shared.stageLast && { last: { n: w.shared.stageLast.n, won: w.shared.stageLast.won } }),
  }
}

const FEST_ROWS = 20 // bảng lễ có xếp hạng: top này
const ALLY_ROWS = 5 // bảng tiên minh của lễ: top này
// Bảng lễ có xếp hạng (Tông Môn Tranh Bá, Trảm Yêu Lệnh) của lượt đang mở; lễ có bảng tiên minh thêm top minh và hạng minh mình
function festView(w: World, pid: number, id: FestId): FestView {
  const now = w.now()
  w.tick(now)
  const at = festAt(id, now, w.opened)
  const key = at?.key ?? -1
  const rows = (board: [number, number][]) => {
    const k = board.findIndex(([p]) => p === pid)
    return {
      top: board.slice(0, FEST_ROWS).map(([p, pts]) => ({ pid: p, name: w.ps.get(p)?.name ?? '?', pts })),
      me: k < 0 ? null : { rank: k + 1, pts: board[k][1] },
    }
  }
  const view: FestView = rows((FEST_RANKED as readonly FestId[]).includes(id) ? festBoard(w.ps, id, key, w.npc) : [])
  if (at && (FEST_STAGED as readonly FestId[]).includes(id))
    view.stage = { k: at.stage, ...rows(festBoard(w.ps, id, key, w.npc, at.stage)) }
  if (!(FEST_ALLY as readonly FestId[]).includes(id)) return view
  const allies = festAllyBoard(w.ps, w.shared, id, key, w.npc)
  const a = allies.findIndex(([aid]) => aid === allyOf(w.shared, pid)?.id)
  return {
    ...view,
    allies: allies.slice(0, ALLY_ROWS).map(([aid, pts]) => ({ id: aid, tag: w.shared.allies[aid]?.tag ?? '?', pts })),
    myAlly: a < 0 ? null : { rank: a + 1, pts: allies[a][1] },
  }
}

export type Answers = { [K in Query['k']]: (sock: Sock, q: QueryOf<K>) => Answer[K] | Promise<Answer[K]> }

// Chiến báo người khác chia sẻ xem được: trong kênh mình nghe được có tin của chính người đó mang mã "#r<id>", hay là trận Luận Kiếm
// Đại Hội (cả giới xem được)
const shareable = (w: World, viewer: number, pid: number, id: number) =>
  !!w.shared.tourney?.games.some(g => g.a === pid && g.rep === id) || sharedIn(w, viewer, pid, id)
// Thiên Mệnh Chọn Luật: luật mùa này, đang mở bỏ phiếu không, số phiếu từng luật, phiếu của người hỏi
const voteView = (w: World, pid: number) => ({
  ...(w.shared.rule !== undefined && { rule: w.shared.rule }),
  open: voteOpen(w.map(w.now()).day),
  tally: voteTally(w.shared),
  ...(w.shared.votes?.[pid] !== undefined && { mine: w.shared.votes[pid] }),
})
// tab Mùa: phiếu chọn luật và Luận Kiếm Đặt Cược (trận playoff đang nhận cược, cược của người hỏi)
const pollsOf = (w: World, pid: number) => ({
  vote: voteView(w, pid),
  bet: betView(w.shared, pid),
  heroes: heroView(w.shared, w.ps, pid, w.map(w.now()).day), // Lưu Danh Sử Sách
})

const FIND_MAX = 10 // số người tìm được mỗi lần
// Tìm đạo hữu theo tên (như tìm thống đốc của RoK): không phân biệt hoa thường, dấu; khớp đầu tên trước, rồi thế lực
const plainKey = (x: string) => x.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi')
function findPlayers(w: World, me: number, q: string) {
  const k = plainKey(q.trim())
  const hits = k ? [...w.ps].filter(([pid, s]) => pid !== me && plainKey(s.name).includes(k)) : []
  const head = (name: string) => Number(plainKey(name).startsWith(k))
  hits.sort(([, a], [, b]) => head(b.name) - head(a.name) || power(b) - power(a))
  return hits.slice(0, FIND_MAX).map(([pid, s]) => {
    const tag = allyOf(w.shared, pid)?.tag
    return { pid, name: s.name, hall: s.levels.chuDien, ...(tag && { tag }) }
  })
}

const NEWS: Chron['k'][] = ['trib', 'boss', 'war', 'cup', 'duel', 'book', 'season'] // loại tin lên dải mực trên núi
// Truy vấn xã giao: truyền âm, nhóm chat, đạo hữu, Giới Báo, tìm người
const social = (
  w: World,
): Pick<Answers, 'dms' | 'groups' | 'friends' | 'paper' | 'board' | 'topic' | 'search' | 'arkWatch' | 'news'> => ({
  search: (sock, q) => findPlayers(w, sock.data.pid, q.q),
  // tin lớn toàn giới (dải mực quét ngang trên núi): đột phá, hạ yêu vương, minh chiến, quán quân, chương biên niên — vài tin mới nhất
  news: () => w.chron.filter(c => NEWS.includes(c.k)).slice(-3),
  // khán giả Tranh Đoạt Linh Châu (như xem Ark of Osiris của RoK) + trận Tán Tu Tranh Châu gần nhất
  arkWatch: () => [...arkOf(w.shared).live, ...(w.shared.silverLast ? [w.shared.silverLast] : [])],
  board: sock => boardView(w.shared, sock.data.pid), // Luận Đạo Bảng
  topic: (_sock, q) => topicView(w.shared, q.id),
  dms: sock => dmsOf(w, sock.data.pid),
  groups: sock => groupViews(w, sock.data.pid),
  paper: sock => paperView(w.shared, sock.data.pid, w.now()),
  // away: số ngày chưa vào game · called: mình đã gọi về (Cố Nhân Tương Phùng), lời gọi còn hạn
  friends: sock =>
    (w.ps.get(sock.data.pid)?.friends ?? []).flatMap(pid => {
      const s = w.ps.get(pid),
        now = w.now()
      if (!s) return []
      const called = recallsOf(w.shared, pid, now).some(x => x.by === sock.data.pid)
      const online = !!w.slots.get(pid)?.conns.size
      return [{ pid, name: s.name, hall: s.levels.chuDien, online, away: awayDays(s, now), called }]
    }),
})

// Các chế độ hàng chờ ở thẻ Hội chiến / Loạn chiến của Luận Kiếm Đài: số người chờ, mình có trong hàng không (Huyễn Vực: cả bảng tuần)
function battles(w: World, pid: number, now: number) {
  const sh = w.shared
  const mb = sh.mysticBoard?.week === weekOf(now) ? sh.mysticBoard : undefined
  return {
    royale: { q: sh.royale?.q.length ?? 0, mine: !!sh.royale?.q.includes(pid) }, // Cổ Khư Loạn Chiến
    daibi: { q: sh.daibi?.q.length ?? 0, mine: !!sh.daibi?.q.some(([p]) => p === pid) }, // Tiên Môn Đại Bỉ
    silver: { q: sh.silver?.q.length ?? 0, mine: !!sh.silver?.q.some(([p]) => p === pid) }, // Tán Tu Tranh Châu
    vanchu: { q: sh.vanchu?.q.length ?? 0, mine: !!sh.vanchu?.q.some(([p]) => p === pid) }, // Vân Chu Hội Chiến
    mystic: {
      q: { normal: sh.mystic?.normal?.q.length ?? 0, legend: sh.mystic?.legend?.q.length ?? 0 },
      mine: mysticIn(sh, pid),
      board: { normal: mb?.normal ?? [], legend: mb?.legend ?? [] },
    }, // Huyễn Vực Bí Cảnh
  }
}

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
    const crowns = w.ps.get(q.pid)?.crowns ?? [], // danh hiệu mùa (đệ nhất Công Huân), các danh hiệu mùa khác
      honors = w.ps.get(q.pid)?.honors ?? []
    return p && { ...p, crown, boon: crown ? boonLeft(w.shared, now) : 0, invite, supply, crowns, honors }
  },
  ...social(w),
  arena: sock => {
    const now = w.now()
    w.tick(now)
    const board = arenaBoard(w.ps, weekOf(now), arenaUpper(w.ps.get(sock.data.pid))) // bảng của tầng đài mình
    const k = board.findIndex(([pid]) => pid === sock.data.pid)
    return {
      foes: arenaFoes(w.ps, sock.data.pid, now, Math.random),
      board: board.slice(0, ARENA_ROWS).map(([pid, s]) => ({ pid, name: s.name, pts: s.arena!.pts })),
      rank: k < 0 ? null : k + 1,
      cup: tourneyView(w.shared, w.ps),
      ...battles(w, sock.data.pid, now),
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
    const now = w.now(),
      t = w.shared.treaty
    return (
      info && {
        ...info,
        terr: territoryTiles(w.ps, w.shared, w.map(now), now).get(info.id) ?? 0,
        ark: arkRow(w.shared, info.id),
        lord: lordSide(w.shared, w.ps, w.map(now), now) === info.id,
        ...(t && (t.by === info.id || t.with.includes(info.id)) && { treaty: { by: t.by, with: t.with } }), // Hiệp Ước Thiên Môn
      }
    )
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
      camps: campTotal(rows, w.shared), // Chính Tà Phân Tranh: điểm mùa hai phái (cả chặng thắng), phái của mình
      camp: campOf(side),
      ...(w.shared.rule === RULE_FOUR && { four: fourPts(rows), fourMine: fourOf(side) }), // Tứ Tượng Tranh Hùng
      stage: stageView(w, sock.data.pid),
      ...pollsOf(w, sock.data.pid),
    }
  },
  map: sock => {
    const now = w.now()
    w.maps.watch(sock, now)
    return w.snapshot(now)
  },
  fest: (sock, q) => festView(w, sock.data.pid, q.id),
  shared: async (sock, q) => {
    if (!shareable(w, sock.data.pid, q.pid, q.id)) return null
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
