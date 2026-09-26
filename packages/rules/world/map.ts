// Ảnh chụp bản đồ giới (server gửi cho người đang mở bản đồ).
import { type BlessKey } from '../data.ts'
import { type Pos } from '../atlas.ts'
import { power } from '../core/stats.ts'
import { might } from '../combat.ts'
import { marchSide } from '../core/battle.ts'
import { type Atlas } from '../atlas.ts'
import { TERR_SEAT } from '../data.ts'
import {
  allyOf,
  flagGuards,
  freshWorld,
  garrison,
  guardMight,
  sideName,
  type Flag,
  type Players,
  type World,
} from './base.ts'
import { claim, flagClaim, runesLeft, troopsOf, type Claim, type Rune } from './points.ts'

// Biên niên của giới: chữ dựng ở client theo khoá (@rok/i18n chronText). Thêm loại: thêm khoá ở đây — i18n báo thiếu chữ.
export type ChronArgs = {
  found: [name: string]
  raid: [attacker: string, defender: string, win: 0 | 1]
  trib: [name: string, hall: number]
  season: [season: number]
  boss: [lv: number]
  book: [ch: number, ok: 0 | 1] // chương Thiên Đạo Biên Niên: xong / hụt
  war: [a: string, b: string, wa: number, wb: number] // Luận Kiếm Minh Chiến: hiệu hai minh và số cặp thắng
  cup: [tag: string] // quán quân Cửu Thiên Luận Đạo Hội
  duel: [name: string] // Kiếm Khôi: vô địch Luận Kiếm Đại Hội
}
export type ChronKind = keyof ChronArgs
export type Chron = { [K in ChronKind]: { at: number; k: K; a: ChronArgs[K] } }[ChronKind]
export type Seat = {
  pid: number
  name: string
  x: number
  y: number
  hall: number
  power: number
  npc: boolean
  shield: boolean
  cloud?: number
  aid?: number
  fire?: number
} // cloud: kiếp vân giáng lúc này · aid: tiên minh (lãnh thổ) · fire: linh hỏa thiêu núi tới lúc này
export type MapMarch = {
  pid: number
  id: number
  path: Pos[]
  startAt: number
  arriveAt: number
  returnAt: number
  foe?: string
  spot?: string
  dig?: number // đang khai mỏ tới lúc này (cướp khoáng được)
  might?: number // lực chiến đội đang khai
}
// Điểm khác mặc định: phe giữ (tên minh/tông môn), số đội đóng, mỏ còn bao nhiêu, yêu vương còn máu, lúc hồi
// side: phe giữ (> 0: tiên minh — mốc lãnh thổ)
export type SpotView = {
  i: number
  own?: string
  side?: number
  n?: number
  left?: number
  hp?: number
  until?: number
  lohar?: string // Yêu Vương Tuần Sơn: tên người triệu hồi
  loharUntil?: number
  tamed?: 1 // hộ trận linh thú đã bị đánh bại (mùa này)
  ctl?: string // linh mạch: tên phe kiểm soát
  ctlSide?: number
  since?: number // lúc phe đang đóng quân chiếm được (tính giờ giữ để kiểm soát)
}
// lord: Giới Chủ · book: Thiên Đạo Biên Niên (chương đang mở và tiến độ)
export type MapSnap = {
  seats: Seat[]
  marches: MapMarch[]
  chron: Chron[]
  spots: SpotView[]
  lord?: number | null
  book?: { ch: number; done: number[]; value: number; by?: [number, number][] } // by: đóng góp từng người (chương có chỉ số riêng)
  bless?: { key: BlessKey; until: number; day: number } // phúc Giới Chủ ban cả giới
  allies?: { id: number; tag: string }[] // tiên minh có lãnh thổ (hiệu để ghi trên bản đồ)
  flags?: (Flag & { guard?: [n: number, might: number, troops: number] })[] // trận kỳ (đang dựng: done > lúc xem); guard: đội giữ, lực chiến, số đệ tử
  firsts?: number[] // điểm đã có minh chiếm lần đầu trong mùa
  eve?: { tag: string; pts: number }[] // Khai Giới Trảm Tà: giới vận các minh đầu (pha Khai giới)
  eveWin?: { tags: string[]; until: number } // minh đứng đầu lúc cổng mở, tăng ích tới until
  digs?: { x: number; y: number; pid: number; name: string }[] // điểm đào Tàng Bảo Đồ (ai cũng thấy, chỉ chủ đào được)
  runes?: Rune[] // phù văn còn trên bản đồ (chu kỳ này, chưa ai nhặt)
}

// atl: bản đồ của giới (có thì kèm phù văn còn trên bản đồ)
export function mapOf(
  ps: Players,
  now: number,
  npc: Set<number>,
  chron: Chron[],
  w: World = freshWorld(),
  atl?: Atlas,
): MapSnap {
  const seats: Seat[] = [],
    marches: MapMarch[] = []
  for (const [pid, s] of ps) {
    if (!s.seat) continue
    const cloud = s.marches.find(m => m.target.kind === 'trib')?.arriveAt
    const al = allyOf(w, pid)
    seats.push({
      pid,
      ...(al && { aid: al.id }),
      name: s.name,
      x: s.seat.x,
      y: s.seat.y,
      hall: s.levels.chuDien,
      power: Math.round(power(s)),
      npc: npc.has(pid),
      shield: s.shield > now,
      ...(cloud && { cloud }),
      ...(s.wall && s.wall.fire > now && { fire: s.wall.fire }),
    })
    for (const m of s.marches)
      if (m.path)
        marches.push({
          pid,
          id: m.id,
          path: m.path,
          startAt: m.startAt,
          arriveAt: m.arriveAt,
          returnAt: m.returnAt,
          ...(m.foe && { foe: m.foe }),
          ...(m.spot && { spot: m.spot }),
          ...(m.mine && m.mine.end > now && { dig: m.mine.end, might: might(marchSide(s, m)) }),
        })
  }
  const spots: SpotView[] = []
  for (const [k, sp] of Object.entries(w.spots)) {
    const i = Number(k)
    const own = sp.own === undefined ? undefined : sideName(w, ps, sp.own)
    const lohar =
      sp.lohar && sp.lohar.until > now ? { lohar: ps.get(sp.lohar.by)?.name ?? '?', loharUntil: sp.lohar.until } : {}
    spots.push({
      i,
      own,
      side: sp.own,
      n: garrison(ps, i).length,
      left: sp.left,
      hp: sp.hp,
      until: sp.until,
      ...lohar,
      ...(sp.tamed && { tamed: 1 as const }),
      ...(sp.ctl !== undefined && { ctl: sideName(w, ps, sp.ctl), ctlSide: sp.ctl }),
      ...(sp.since !== undefined && { since: sp.since }),
    })
  }
  const allies = Object.values(w.allies).map(al => ({ id: al.id, tag: al.tag }))
  const flags = Object.values(w.flags ?? {})
    .filter(f => w.allies[f.aid])
    .map(f => {
      const g = flagGuards(ps, f.id)
      return g.length ? { ...f, guard: [g.length, guardMight(g), troopsOf(g)] as [number, number, number] } : f
    })
  const eve = Object.entries(w.eve ?? {})
    .filter(([id]) => w.allies[Number(id)])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, pts]) => ({ tag: w.allies[Number(id)].tag, pts }))
  const eveWin = w.eveWin && {
    tags: w.eveWin.ids.flatMap(id => (w.allies[id] ? [w.allies[id].tag] : [])),
    until: w.eveWin.until,
  }
  const digs = [...ps].flatMap(([pid, s]) => (s.digs ?? []).map(d => ({ ...d, pid, name: s.name })))
  const runes = atl ? runesLeft(w, atl, now) : []
  return {
    seats,
    marches,
    chron,
    spots,
    allies,
    flags,
    ...(digs.length && { digs }),
    ...(runes.length && { runes }),
    firsts: w.firsts ?? [],
    ...(eve.length && { eve }),
    ...(eveWin && { eveWin }),
  }
}

// Mốc lãnh thổ từ ảnh chụp (client tô bản đồ): cùng luật với claimsOf phía server
export function snapClaims(snap: MapSnap, a: Atlas, now: number): Claim[] {
  const out: Claim[] = []
  for (const s of snap.seats) if (s.aid) out.push({ x: s.x, y: s.y, r: TERR_SEAT, side: s.aid })
  for (const sp of snap.spots) {
    const c = sp.side !== undefined ? claim(a, sp.i, sp.side) : null
    if (c) out.push(c)
  }
  for (const f of snap.flags ?? []) if (f.done <= now && !f.mine) out.push(flagClaim(f)) // Minh khoáng không nới lãnh thổ
  return out
}
