// Chợ: ký gửi trong biên giá, mua nhận ngay, người bán nhận tiền (trừ thuế) qua thư; hết hạn / hết mùa trả hàng.
import { no } from '../core/action.ts'
import { dayOf } from '../core/calendar.ts'
import { isId, oneOf } from '../core/parse.ts'
import { storage } from '../core/stats.ts'
import { type State } from '../core/types.ts'
import { PILL_IDS } from '../core/util.ts'
import {
  MARKET_BAND,
  MARKET_BUYS,
  MARKET_CAP,
  MARKET_HALL,
  MARKET_ORDERS,
  MARKET_TAX,
  MARKET_TTL,
  PILLS,
  RESOURCES,
  type Reward,
} from '../data.ts'
import { mail } from '../sect/inbox.ts'
import {
  type Ctx,
  type Good,
  type Order,
  type Players,
  type Trades,
  type World,
  type WorldActions,
  type WorldResult,
} from './base.ts'

const isRes = (g: Good): g is 'linhThao' | 'linhKhoang' => g === 'linhThao' || g === 'linhKhoang'
// Giá gốc một đơn vị (linh thạch): tài nguyên 1; đan = tài nguyên để luyện, cộng cả đan làm nguyên liệu
export const basePrice = (g: Good): number =>
  isRes(g)
    ? 1
    : RESOURCES.reduce((sum, r) => sum + PILLS[g].cost[r], 0) +
      Object.entries(PILLS[g].need ?? {}).reduce((sum, [q, k]) => sum + basePrice(q as Good) * (k ?? 0), 0)
export const priceBand = (g: Good, n: number): [number, number] => [
  Math.ceil(basePrice(g) * n * MARKET_BAND[0]),
  Math.floor(basePrice(g) * n * MARKET_BAND[1]),
]
export const goodOf = (s: State, g: Good) => (isRes(g) ? s.res[g] : (s.items[g] ?? 0))
const addGood = (s: State, g: Good, n: number): State =>
  isRes(g)
    ? { ...s, res: { ...s.res, [g]: s.res[g] + n } }
    : { ...s, items: { ...s.items, [g]: (s.items[g] ?? 0) + n } }
const giftOf = (g: Good, n: number): Reward => (isRes(g) ? { res: { [g]: n } } : { items: { [g]: n } })
export const tradesOf = (w: World, pid: number, t: number): Trades =>
  w.mkt[pid]?.day === dayOf(t) ? w.mkt[pid] : { day: dayOf(t), buys: 0, sold: 0 }
export const sellCap = (s: State) => Math.floor(MARKET_CAP * storage(s))
const without = (w: World, id: number): World => ({
  ...w,
  orders: Object.fromEntries(Object.entries(w.orders).filter(([k]) => Number(k) !== id)),
})

export type MarketAction =
  | { type: 'sell'; good: Good; n: number; price: number } // treo một lô
  | { type: 'buy'; id: number }
  | { type: 'cancel'; id: number } // gỡ lệnh của mình, hàng về ngay
export const GOODS: readonly Good[] = ['linhThao', 'linhKhoang', ...PILL_IDS]

export const marketActions: WorldActions<MarketAction> = {
  sell: {
    pick: a =>
      oneOf(GOODS)(a.good) && isId(a.n) && isId(a.price)
        ? { type: 'sell', good: a.good, n: a.n, price: a.price }
        : null,
    run: marketAct,
  },
  buy: { pick: a => (isId(a.id) ? { type: 'buy', id: a.id } : null), run: marketAct },
  cancel: { pick: a => (isId(a.id) ? { type: 'cancel', id: a.id } : null), run: marketAct },
}
export const MARKET_ACTIONS: readonly string[] = Object.keys(marketActions)

function marketAct({ ps, w, pid, s }: Ctx, a: MarketAction): WorldResult {
  const t = s.time
  if (s.levels.chuDien < MARKET_HALL) return no('locked')
  const day = tradesOf(w, pid, t)
  if (a.type === 'sell') {
    if (Object.values(w.orders).filter(o => o.pid === pid).length >= MARKET_ORDERS) return no('slots')
    const [lo, hi] = priceBand(a.good, a.n)
    if (a.price < lo || a.price > hi) return no('bad')
    if (goodOf(s, a.good) < a.n) return no(isRes(a.good) ? 'not_enough' : 'no_item')
    if (day.sold + a.price > sellCap(s)) return no('limit') // tính cả lệnh đã gỡ: treo / gỡ không lách được trần
    const o: Order = { id: w.nextOrder, pid, good: a.good, n: a.n, price: a.price, at: t }
    return {
      ok: true,
      changed: new Map([[pid, addGood(s, a.good, -a.n)]]),
      world: {
        ...w,
        orders: { ...w.orders, [o.id]: o },
        nextOrder: o.id + 1,
        mkt: { ...w.mkt, [pid]: { ...day, sold: day.sold + a.price } },
      },
    }
  }
  const o = w.orders[a.id]
  if (!o || o.at + MARKET_TTL <= t) return no('gone')
  if (a.type === 'cancel')
    return o.pid === pid
      ? { ok: true, changed: new Map([[pid, addGood(s, o.good, o.n)]]), world: without(w, o.id) }
      : no('bad')
  if (o.pid === pid) return no('bad')
  if (day.buys >= MARKET_BUYS) return no('limit')
  if (s.res.linhThach < o.price) return no('not_enough')
  // người mua nhận hàng ngay; người bán nhận linh thạch (trừ thuế) qua thư
  const changed: Players = new Map([
    [pid, addGood({ ...s, res: { ...s.res, linhThach: s.res.linhThach - o.price } }, o.good, o.n)],
  ])
  const seller = ps.get(o.pid),
    net = Math.floor(o.price * (1 - MARKET_TAX))
  if (seller)
    changed.set(o.pid, mail(seller, { at: t, k: 'sold', a: [o.good, o.n, net], gift: { res: { linhThach: net } } }))
  const next = without(w, o.id)
  return { ok: true, changed, world: { ...next, mkt: { ...next.mkt, [pid]: { ...day, buys: day.buys + 1 } } } }
}

// Lệnh hết hạn / hết mùa: trả hàng cho người bán qua thư
export function unsold(ps: Players, w: World, list: Order[]): { changed: Players; world: World } {
  const changed: Players = new Map()
  for (const o of list) {
    const s = changed.get(o.pid) ?? ps.get(o.pid)
    if (s)
      changed.set(
        o.pid,
        mail(s, { at: Math.min(o.at + MARKET_TTL, s.time), k: 'unsold', a: [o.good, o.n], gift: giftOf(o.good, o.n) }),
      )
    w = without(w, o.id)
  }
  return { changed, world: w }
}

// Chợ để hiện: lệnh còn hạn (một loại hàng nếu chọn; rẻ nhất theo giá gốc trước) + lệnh của mình; kèm tên người bán
export type OrderView = Order & { name: string }
export function marketOf(
  ps: Players,
  w: World,
  pid: number,
  now: number,
  good?: Good,
): { orders: OrderView[]; mine: OrderView[]; day: Trades } {
  const view = (o: Order): OrderView => ({ ...o, name: ps.get(o.pid)?.name ?? '' })
  const live = Object.values(w.orders).filter(o => o.at + MARKET_TTL > now)
  const unit = (o: Order) => o.price / (basePrice(o.good) * o.n)
  return {
    orders: live
      .filter(o => o.pid !== pid && (!good || o.good === good))
      .sort((a, b) => unit(a) - unit(b) || a.id - b.id)
      .slice(0, 40)
      .map(view),
    mine: live.filter(o => o.pid === pid).map(view),
    day: tradesOf(w, pid, now),
  }
}
