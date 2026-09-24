// Phần chung của một giới (actor giữ, lưu ở worlds.state) và khung cho thao tác giới.
import { route, TILE_TIME, type Atlas, type Pos } from '../atlas.ts'
import { type Pick } from '../core/action.ts'
import { marchTime } from '../core/battle.ts'
import { cutOf } from '../core/stats.ts'
import { dayOf } from '../core/calendar.ts'
import { type Buff, type Contrib, type Err, type JobKind, type March, type State } from '../core/types.ts'
import {
  ALLY_GIFT_LV,
  ALLY_GIFTS,
  ALLY_HELPS,
  ALLY_MAX,
  ALLY_TECH_IDS,
  ALLY_TECH_PTS,
  ALLY_TECHS,
  ELO_K,
  GIFT_PTS,
  HELP_CREDIT,
  HELP_CREDIT_DAY,
  type AllyTechId,
  type Bonus,
  type ItemId,
  type PillId,
} from '../data.ts'
import { noGain } from '../core/util.ts'
import { mail } from '../sect/inbox.ts'

// Bản đồ giới của lần tính này (server: seed + pha mùa của giới). Không có (sim, test): đi cướp ra mép vùng như P2.
export type MapCtx = { atlas: Atlas; phase: number }
// Đường đi cướp giữa hai chỗ ngồi; null: chưa có đường (cổng chưa mở)
export function raidPath(att: State, def: State, map?: MapCtx): { path?: Pos[]; ms: number } | null {
  if (!map || !att.seat || !def.seat) return { ms: marchTime(att, { kind: 'pvp', i: 0 }) }
  const r = route(map.atlas, att.seat, def.seat, map.phase)
  return r && { path: r.path, ms: routeMs(att, r.len) }
}
// Thời gian đi hết len ô đường trên bản đồ giới (công pháp hành quân rút ngắn)
export const routeMs = (s: State, len: number) => Math.round(len * TILE_TIME * cutOf(s, 'march'))

export type Players = Map<number, State>

export type Role = 0 | 1 | 2 // thành viên · trưởng lão · minh chủ
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
// Kết trận: người trong minh góp đội, mọi đội tới điểm i cùng lúc `at` rồi đánh như một bên
export type Rally = { id: number; ally: number; by: number; i: number; task: 'take' | 'hit'; at: number }
// Chợ: lệnh bán đang treo (hàng đã rời người bán; price: cả lô, linh thạch), mua / treo bán trong ngày của từng người
export type Good = 'linhThao' | 'linhKhoang' | PillId
export type Order = { id: number; pid: number; good: Good; n: number; price: number; at: number }
export type Trades = { day: number; buys: number; sold: number }
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
}
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
})
// Điểm kiểu Elo cho bên đánh (bên thủ mất/được đúng bấy nhiêu): cướp, Luận Kiếm Đài. Chỉ server tính.
export const elo = (a: number, d: number, win: boolean) =>
  Math.round(ELO_K * ((win ? 1 : 0) - 1 / (1 + 10 ** ((d - a) / 400))))
export const put = (w: World, al: Alliance): World => ({ ...w, allies: { ...w.allies, [al.id]: al } })
export const allyOf = (w: World, pid: number) => Object.values(w.allies).find(a => a.members[pid] !== undefined)

// world: phần chung sau thao tác (cùng tham chiếu nếu không đổi)
export type WorldResult = { ok: true; changed: Players; world: World } | { ok: false; error: Err }
export type Task = 'take' | 'gather' | 'hit'

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
export const garrison = (ps: Players, i: number): [number, March][] =>
  [...ps].flatMap(([pid, s]) =>
    s.marches.filter(m => m.stay && m.target.kind === 'spot' && m.target.i === i).map(m => [pid, m] as [number, March]),
  )
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
