// Phần chung của một giới (actor giữ, lưu ở worlds.state) và khung cho thao tác giới.
import { route, TILE_TIME, type Atlas, type Pos } from '../atlas.ts'
import { might } from '../combat.ts'
import { type Pick } from '../core/action.ts'
import { marchSide, marchTime } from '../core/battle.ts'
import { armySpeed, cutOf } from '../core/stats.ts'
import { dayOf, weekOf } from '../core/calendar.ts'
import { type Army, type Buff, type Contrib, type Err, type JobKind, type March, type State } from '../core/types.ts'
import {
  ALLY_WELCOME,
  ALLY_GIFT_LV,
  ALLY_GIFTS,
  ALLY_HELPS,
  ALLY_MAX,
  ALLY_TECH_IDS,
  ALLY_TECH_PTS,
  ALLY_TECHS,
  ELO_K,
  OFFICE_IDS,
  OFFICES,
  GIFT_PTS,
  HELP_CREDIT,
  HELP_CREDIT_DAY,
  HONOR_KP,
  DAY_OFFSET,
  TRIBE_DAY,
  TRIBE_LEN,
  TRIBE_PTS,
  BLESSINGS,
  TITLE_IDS,
  TITLES,
  type TitleId,
  type AllyTechId,
  type BlessKey,
  type Bonus,
  type ItemId,
  type OfficeId,
  type PillId,
} from '../data.ts'
import { DAY, noGain } from '../core/util.ts'
import { mail } from '../sect/inbox.ts'

// Bản đồ giới của lần tính này (server: seed + pha mùa của giới). Không có (sim, test): đi cướp ra mép vùng như P2.
export type MapCtx = { atlas: Atlas; phase: number }
// Đường đi cướp giữa hai chỗ ngồi; null: chưa có đường (cổng chưa mở)
export function raidPath(att: State, def: State, map?: MapCtx, army?: Army): { path?: Pos[]; ms: number } | null {
  if (!map || !att.seat || !def.seat) return { ms: marchTime(att, { kind: 'pvp', i: 0 }) }
  const r = route(map.atlas, att.seat, def.seat, map.phase)
  return r && { path: r.path, ms: routeMs(att, r.len, army) }
}
// Thời gian đi hết len ô đường trên bản đồ giới (công pháp hành quân rút ngắn; có đội thì theo tốc hệ chậm nhất)
export const routeMs = (s: State, len: number, army?: Army) =>
  Math.round((len * TILE_TIME * cutOf(s, 'march')) / (army ? armySpeed(army) : 1))

export type Players = Map<number, State>

// Cho client: danh sách minh (tìm để vào), minh của mình với người trong đó
// closed: phải xin vào · asked: mình đã gửi đơn · invited: minh đã mời mình
export type AllyRow = {
  id: number
  name: string
  tag: string
  n: number
  max: number
  power: number
  closed: boolean
  asked: boolean
  invited: boolean
}
// seen: ngày (dayOf) vào game gần nhất — minh chủ vắng lâu thì đường chủ nhận thay (allyClaim)
export type Member = {
  pid: number
  name: string
  role: Role
  hall: number
  power: number
  online: boolean
  seen: number
}

// Bậc trong minh R1–R5: −2 ngoại môn · −1 nội môn · 0 chân truyền · 1 đường chủ (R4: duyệt đơn, cắm cờ, ghi danh…) · 2 minh
// chủ (R5). Số âm để dữ liệu cũ (0 thành viên · 1 trưởng lão · 2 minh chủ) giữ nguyên nghĩa; người mới vào là R1.
export type Role = -2 | -1 | 0 | 1 | 2
export type Help = { pid: number; job: JobKind; startAt: number; ms: number; by: number[] } // một việc đang nhờ giúp; ms: mỗi lần giúp bớt (chốt lúc nhờ)
export type Alliance = {
  id: number
  name: string
  tag: string
  members: Record<number, Role>
  notice: string
  at: number
  helps: Help[]
  // Hộ Minh Đại Trận, Cống Hiến Các, Minh lễ (blob cũ chưa có: coi như 0 / trống)
  tech?: Partial<Record<AllyTechId, number>> // điểm trận đã góp mỗi trận
  star?: AllyTechId // trận minh chủ điểm: góp được gấp đôi
  fund?: number // Minh khố: nhập hàng Cống Hiến Các
  stock?: Partial<Record<ItemId, number>> // hàng đang có ở Cống Hiến Các
  gift?: number // điểm quà minh (cấp Minh lễ)
  marks?: Mark[] // dấu trên bản đồ giới cho cả minh
  mob?: MobBoard // Minh vụ đường tuần này
  closed?: boolean // phải duyệt đơn mới vào được (mặc định: vào tự do)
  apps?: number[] // người xin vào đang chờ duyệt
  invites?: number[] // người được mời: vào thẳng dù minh đóng
  naps?: number[] // minh ước bất xâm phạm (NAP) với các minh này
  napIn?: number[] // lời đề nghị minh ước đang chờ minh mình trả lời
  mailAt?: number // lúc gửi thư minh gần nhất
  fundAt?: number // kho minh: lãnh thổ đã sinh Minh khố tới lúc này
  offices?: Partial<Record<OfficeId, number>> // chức vị đường chủ: ai giữ
}
// Bảng Minh vụ của minh: tuần, điểm cả minh, số thứ tự việc kế tiếp, các việc trên bảng (số thứ tự — việc suy ra từ mã minh,
// tuần và số thứ tự nên client tự vẽ được), điểm từng người đã góp
export type MobBoard = { week: number; pts: number; next: number; board: number[]; by: Record<number, number> }
// Dấu của minh trên bản đồ giới: ô, lời ghi, ai đặt, lúc nào
export type Mark = { x: number; y: number; text: string; by: number; at: number }
// Trạng thái một điểm trên bản đồ giới. own: phe giữ (mã minh > 0, người giữ một mình = −mã người chơi), since: từ lúc nào.
// Mỏ: còn left, cạn thì hồi đầy lúc until. Yêu vương: còn hp, sát thương từng người; chết thì hồi sinh lúc until.
export type Spot = {
  own?: number
  since?: number
  left?: number
  until?: number
  hp?: number
  dmg?: Record<number, number>
}
// Kết trận: người trong minh góp đội, mọi đội tới cùng lúc `at` rồi đánh như một bên — điểm i (chiếm / đánh yêu vương),
// hay tông môn người chơi i (công sơn, foe: tên lúc mở)
export type Rally = {
  id: number
  ally: number
  by: number
  i: number
  task: 'take' | 'hit' | 'raid'
  at: number
  foe?: string
}
// Chợ: lệnh bán đang treo (hàng đã rời người bán; price: cả lô, linh thạch), mua / treo bán trong ngày của từng người
export type Good = 'linhThao' | 'linhKhoang' | PillId
export type Order = { id: number; pid: number; good: Good; n: number; price: number; at: number }
export type Trades = { day: number; buys: number; sold: number }
// Phá Yêu Trại: tuần, điểm từng minh, đã phát quà chưa
export type Tribe = { week: number; pts: Record<number, number>; done?: boolean }
// Khung Phá Yêu Trại của tuần wk (thứ Ba 0h → thứ Năm 0h giờ VN)
export const tribeStart = (wk: number) => (wk * 7 + 4 + TRIBE_DAY) * DAY - DAY_OFFSET
export const tribeEnd = (wk: number) => tribeStart(wk) + TRIBE_LEN * DAY
export const tribeOf = (w: World, t: number): Tribe =>
  w.tribe?.week === weekOf(t) ? w.tribe : { week: weekOf(t), pts: {} }
// Yêu vương cấp lv vừa đổ lúc at (trong khung): điểm TRIBE_PTS[lv] chia theo sát thương cho minh của từng người
export function tribeBank(w: World, at: number, lv: number, dmgs: Record<number, number>): World {
  const wk = weekOf(at)
  if (at < tribeStart(wk) || at >= tribeEnd(wk)) return w
  const sum = Object.values(dmgs).reduce((a, b) => a + b, 0) || 1
  const tr = tribeOf(w, at)
  const pts = { ...tr.pts }
  for (const [p, d] of Object.entries(dmgs)) {
    const al = allyOf(w, Number(p))
    if (al) pts[al.id] = (pts[al.id] ?? 0) + ((TRIBE_PTS[lv] ?? 0) * d) / sum
  }
  return { ...w, tribe: { ...tr, pts } }
}
// Nhóm chat tự tạo: tên, người giữ nhóm, người trong nhóm (theo thứ tự vào)
export type Group = { id: number; name: string; owner: number; members: number[] }
// Vận Linh Trận trong ngày của một người: đã gửi (trước hao tổn), đã nhận (sau hao tổn)
export type Supply = { day: number; sent: number; got: number }
// pts: điểm mùa đã chốt theo phe (sideKey) — phần đang giữ tính thêm ở seasonPts
export type World = {
  allies: Record<number, Alliance>
  nextAlly: number
  spots: Record<number, Spot>
  rallies: Record<number, Rally>
  nextRally: number
  pts: Record<number, number>
  orders: Record<number, Order>
  nextOrder: number
  mkt: Record<number, Trades>
  titles: Partial<Record<TitleId, Title>> // sắc phong của Giới Chủ
  book: { ch: number; done: number[] } // Thiên Đạo Biên Niên: chương đang mở, các chương đã xong
  bosses: number // yêu vương đã hạ trong mùa
  war: War // Luận Kiếm Minh Chiến
  bless?: { key: BlessKey; until: number; day: number } // Giới Chủ ban phúc cả giới (ngày dayOf đã ban)
  boon?: { week: number; left: number } // Thiên Ân lễ Giới Chủ còn ban được trong tuần
  flags?: Record<number, Flag> // trận kỳ các tiên minh đã cắm
  nextFlag?: number
  legion?: Legion // Ma Triều Công Sơn tuần này
  sup?: Record<number, Supply> // Vận Linh Trận hôm nay của từng người
  groups?: Record<number, Group> // nhóm chat tự tạo
  tribe?: Tribe // Phá Yêu Trại tuần này
  firsts?: number[] // điểm đã có tiên minh chiếm lần đầu trong mùa (quà chiếm lần đầu)
  nextGroup?: number
}
// Ma triều: tuần, minh đã ghi danh, số đợt đã đánh, điểm từng minh, điểm và số đợt giữ được của từng người
export type Legion = {
  week: number
  signed: number[]
  done: number
  pts: Record<number, number>
  by: Record<number, number>
  held: Record<number, number>
}
// Trận kỳ: của minh aid, ở ô (x, y), dựng xong lúc done (từ đó mới nới lãnh thổ); hp / hit: độ bền còn lại sau lần bị đánh gần nhất
export type Flag = { id: number; aid: number; x: number; y: number; done: number; hp?: number; hit?: number }
// Minh chiến: tuần đã giải gần nhất, các minh ghi danh tuần này, điểm minh chiến (Elo) từng minh, kết quả lần giải gần nhất
export type WarResult = { a: number; b: number; an: string; bn: string; wa: number; wb: number }
export type War = { done: number; signed: number[]; pts: Record<number, number>; last: WarResult[] }
// Một tước: ai giữ, phong lúc nào, tới lúc nào
export type Title = { pid: number; at: number; until: number }
export const freshWorld = (): World => ({
  allies: {},
  nextAlly: 1,
  spots: {},
  rallies: {},
  nextRally: 1,
  pts: {},
  orders: {},
  nextOrder: 1,
  mkt: {},
  titles: {},
  book: { ch: 0, done: [] },
  bosses: 0,
  war: { done: -1, signed: [], pts: {}, last: [] },
})
// Điểm kiểu Elo cho bên đánh (bên thủ mất/được đúng bấy nhiêu): cướp, Luận Kiếm Đài. Chỉ server tính.
export const elo = (a: number, d: number, win: boolean) =>
  Math.round(ELO_K * ((win ? 1 : 0) - 1 / (1 + 10 ** ((d - a) / 400))))
// Hai người thuộc hai tiên minh đã kết minh ước (không cướp, không tranh điểm của nhau)
export function napBetween(w: World, a: number, b: number) {
  const x = allyOf(w, a),
    y = allyOf(w, b)
  return !!x && !!y && x.id !== y.id && !!x.naps?.includes(y.id)
}
export const put = (w: World, al: Alliance): World => ({ ...w, allies: { ...w.allies, [al.id]: al } })
// Người trong các minh vừa đổi (bản ghi minh, hay kết trận của minh mở / giải) — server báo họ hỏi lại
export function allyTouched(prev: World, next: World): number[] {
  const rallies = (w: World, aid: number) =>
    Object.values(w.rallies)
      .filter(r => r.ally === aid)
      .map(r => r.id)
      .join()
  const out = new Set<number>()
  for (const al of [...Object.values(prev.allies), ...Object.values(next.allies)])
    if (
      prev.allies[al.id] !== next.allies[al.id] ||
      (prev.rallies !== next.rallies && rallies(prev, al.id) !== rallies(next, al.id))
    )
      for (const pid of Object.keys(al.members)) out.add(Number(pid))
  return [...out]
}
export const allyOf = (w: World, pid: number) => Object.values(w.allies).find(a => a.members[pid] !== undefined)
// Lễ nhập minh: lần đầu vào (hay lập) một tiên minh thì nhận quà qua thư, một lần mỗi tông môn
export const welcome = (s: State, name: string, t: number): State =>
  s.joined !== undefined ? s : mail({ ...s, joined: t }, { at: t, k: 'allyWelcome', a: [name], gift: ALLY_WELCOME })
// Ai ở minh nào (đổi khi có người vào / rời / minh giải tán): lãnh thổ trên bản đồ theo đó mà đổi
export const memberKey = (w: World) =>
  Object.values(w.allies)
    .map(a => `${a.id}:${Object.keys(a.members)}`)
    .join('|')

// world: phần chung sau thao tác (cùng tham chiếu nếu không đổi)
export type WorldResult = { ok: true; changed: Players; world: World } | { ok: false; error: Err }
export type Task = 'take' | 'gather' | 'hit' | 'hunt'

// Một thao tác giới: s là state người làm đã đưa tới lúc now (t = s.time); seed mới cho trận; map: bản đồ lúc này
export type Ctx = { ps: Players; w: World; pid: number; s: State; now: number; seed: number; map?: MapCtx }
export type WorldRun<A> = (c: Ctx, a: A) => WorldResult
export type WorldActions<A extends { type: string }> = {
  [K in A['type']]: { pick: Pick<Extract<A, { type: K }>>; run: WorldRun<Extract<A, { type: K }>> }
}

export type Party = [pid: number, s: State, m: March][] // các đội đi cùng (kết trận), state đã đưa tới lúc tới nơi
// Viện binh đang đóng ở nhà người chơi pid
export const aidAt = (ps: Players, pid: number): [number, March][] =>
  [...ps].flatMap(([p, s]) =>
    s.marches.filter(m => m.task === 'aid' && m.stay && m.target.i === pid).map(m => [p, m] as [number, March]),
  )

// Đội quay về tay không (mục tiêu không còn, vừa có khiên, điểm đầy quân)
export const turnBack = (s: State, m: March, at: number): State => ({
  ...s,
  marches: s.marches.map(x =>
    x.id === m.id
      ? {
          ...m,
          stay: false,
          back: m.army,
          hurt: m.hurt ?? {},
          gain: noGain(),
          returnAt: at + (at - m.startAt),
        }
      : x,
  ),
})
// Phe của một người: tiên minh (mã > 0) hoặc chính mình (−mã người chơi)
export const sideKey = (w: World, pid: number) => allyOf(w, pid)?.id ?? -pid
// Tên một phe: tiên minh "[tag] tên" (side > 0) hoặc người đi một mình (side = -pid)
export const sideName = (w: World, ps: Players, side: number) =>
  side > 0 ? w.allies[side] && `[${w.allies[side].tag}] ${w.allies[side].name}` : ps.get(-side)?.name
// Quân đang đóng ở điểm i
// Đội đóng quân giữ trận kỳ id (đồng minh gửi tới, đứng lại tới khi gọi về / cờ đổ)
export const flagGuards = (ps: Players, id: number): Party =>
  [...ps].flatMap(([pid, s]) =>
    s.marches
      .filter(m => m.stay && m.task === 'aid' && m.target.kind === 'flag' && m.target.i === id)
      .map(m => [pid, s, m] as [number, State, March]),
  )
export const guardMight = (g: Party) => Math.round(g.reduce((n, [, s, m]) => n + might(marchSide(s, m)), 0))
export const garrison = (ps: Players, i: number): [number, March][] =>
  [...ps].flatMap(([pid, s]) =>
    s.marches.filter(m => m.stay && m.target.kind === 'spot' && m.target.i === i).map(m => [pid, m] as [number, March]),
  )
// Công Huân trong mùa (HONOR_* ở data.ts) và chiến công (cộng Công Huân theo HONOR_KP)
export const addHonor = (s: State, n: number): State => (n >= 1 ? { ...s, honor: (s.honor ?? 0) + Math.floor(n) } : s)
export const addKp = (s: State, n: number): State =>
  n >= 1 ? addHonor({ ...s, stats: { ...s.stats, kp: (s.stats.kp ?? 0) + Math.round(n) } }, n / HONOR_KP) : s
// Vị trí (ô) của đội lúc t theo đường đi (đi: path; về: path ngược); không có đường thì null
export function marchAt(m: March, t: number): Pos | null {
  const path = m.path
  if (!path?.length) return null
  const home = m.returnAt > 0 && t >= m.arriveAt
  const f = home
    ? (t - m.arriveAt) / Math.max(1, m.returnAt - m.arriveAt)
    : (t - m.startAt) / Math.max(1, m.arriveAt - m.startAt)
  const pts = home ? [...path].reverse() : path
  const seg = pts.slice(1).map((p, k) => Math.hypot(p.x - pts[k].x, p.y - pts[k].y))
  let d = Math.min(1, Math.max(0, f)) * seg.reduce((a, b) => a + b, 0)
  for (let k = 0; k < seg.length; k++) {
    if (d <= seg[k] || k === seg.length - 1) {
      const u = seg[k] ? Math.min(1, d / seg[k]) : 0
      return {
        x: Math.round(pts[k].x + (pts[k + 1].x - pts[k].x) * u),
        y: Math.round(pts[k].y + (pts[k + 1].y - pts[k].y) * u),
      }
    }
    d -= seg[k]
  }
  return { ...pts[0] }
}
export const withMarch = (s: State, m: March): State => ({ ...s, marches: s.marches.map(x => (x.id === m.id ? m : x)) })
export const travel = (m: March) => m.arriveAt - m.startAt
export const setSpot = (w: World, i: number, sp: Spot): World => ({ ...w, spots: { ...w.spots, [i]: sp } })

// ---------- Tiên minh: Hộ Minh Đại Trận, cống hiến, Minh lễ (dùng chung cho alliance / guild / spots / arrive) ----------

// Tầng một trận theo điểm đã góp; tổng tăng ích theo khoá của mọi trận
export const techLevel = (al: Alliance, id: AllyTechId) => ALLY_TECH_PTS.filter(p => (al.tech?.[id] ?? 0) >= p).length
const techSum = (al: Alliance, key: string) =>
  ALLY_TECH_IDS.reduce((sum, id) => sum + (ALLY_TECHS[id].key === key ? ALLY_TECHS[id].v * techLevel(al, id) : 0), 0)
export const helpsOf = (al: Alliance) => ALLY_HELPS + techSum(al, 'helps')
export const seatsOf = (al: Alliance) => ALLY_MAX + techSum(al, 'seats')
// Tăng ích tông môn từ các trận (worldBuffs gắn vào state từng người trong minh, nguồn 'ally')
// Chức vị đường chủ của pid (còn là R4 mới có hiệu lực): tăng ích nguồn 'office'
export const officeBuffs = (al: Alliance | undefined, pid: number): Buff[] =>
  al && al.members[pid] === 1
    ? OFFICE_IDS.filter(o => al.offices?.[o] === pid).map(o => ({
        key: OFFICES[o].key,
        v: OFFICES[o].v,
        until: 0,
        src: 'office',
      }))
    : []
export const allyBuffs = (al: Alliance | undefined): Buff[] =>
  al
    ? ALLY_TECH_IDS.flatMap(id => {
        const d = ALLY_TECHS[id],
          lv = techLevel(al, id)
        return lv && d.key !== 'helps' && d.key !== 'seats'
          ? [{ key: d.key as Bonus, v: Math.round(d.v * lv * 1000) / 1000, until: 0, src: 'ally' }]
          : []
      })
    : []

export const contribOf = (s: State): Contrib => s.contrib ?? { credit: 0, full: 0, day: 0, helped: 0 }
// Cống hiến cho người vừa giúp n lượt (trần HELP_CREDIT_DAY mỗi ngày giờ VN)
export function helpCredit(s: State, n: number, t: number): State {
  const c = contribOf(s),
    day = dayOf(t)
  const helped = c.day === day ? c.helped : 0
  const got = Math.max(0, Math.min(n * HELP_CREDIT, HELP_CREDIT_DAY - helped))
  return {
    ...s,
    contrib: { ...c, credit: c.credit + got, day, helped: helped + got },
    stats: { ...s.stats, allied: (s.stats.allied ?? 0) + n },
  }
}

// Minh lễ: người trong các minh vừa góp sức hạ yêu vương cấp lv → mọi người trong minh đó nhận quà qua thư (theo cấp quà
// hiện tại), minh thêm điểm quà. Ghi state người nhận vào changed.
export const giftLevel = (al: Alliance) => ALLY_GIFT_LV.filter(p => (al.gift ?? 0) >= p).length
export function allyGifts(ps: Players, changed: Players, w: World, pids: number[], lv: number, at: number): World {
  const pts = GIFT_PTS[lv]
  if (!pts) return w
  let next = w
  for (const al of new Set(pids.map(p => allyOf(w, p)).filter(x => x !== undefined))) {
    const glv = giftLevel(al)
    for (const p of Object.keys(al.members).map(Number)) {
      const st = changed.get(p) ?? ps.get(p)
      if (st) changed.set(p, mail(st, { at, k: 'allyGift', a: [lv, glv], gift: ALLY_GIFTS[glv - 1] }))
    }
    next = put(next, { ...al, gift: (al.gift ?? 0) + pts })
  }
  return next
}
// Phúc của Giới Chủ ban cho cả giới (còn hạn lúc at): worldBuffs gắn vào mọi tông môn, nguồn 'bless'
export const blessBuffs = (w: World, at: number): Buff[] =>
  w.bless && w.bless.until > at
    ? [{ key: w.bless.key as Bonus, v: BLESSINGS[w.bless.key], until: w.bless.until, src: 'bless' }]
    : []
// Tăng ích (hay hoạ) từ tước Giới Chủ phong cho pid, còn hạn lúc at (worldBuffs gắn vào state, nguồn 'title')
export const titleBuffs = (w: World, pid: number, at: number): Buff[] =>
  TITLE_IDS.flatMap(id => {
    const t = w.titles?.[id]
    return t && t.pid === pid && t.until > at
      ? Object.entries(TITLES[id].fx).map(([key, v]) => ({ key: key as Bonus, v, until: t.until, src: 'title' }))
      : []
  })
