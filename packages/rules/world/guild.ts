// Hộ Minh Đại Trận (công nghệ minh + cung phụng), cống hiến, Cống Hiến Các (cửa hàng minh), Minh lễ (quà minh) — như
// Alliance Technology / Credits / Shop / Gifts của RoK. Tăng ích của trận tới từng người qua worldBuffs (spots.ts).
import { no } from '../core/action.ts'
import { dayOf } from '../core/calendar.ts'
import { int, oneOf } from '../core/parse.ts'
import type { Buff, Contrib, State } from '../core/types.ts'
import {
  ALLY_GIFT_LV,
  ALLY_GIFTS,
  ALLY_HELPS,
  ALLY_MAX,
  ALLY_SHOP,
  ALLY_SHOP_MAX,
  ALLY_TECH_IDS,
  ALLY_TECH_PTS,
  ALLY_TECHS,
  DONATE_COST,
  DONATE_EVERY,
  DONATE_MAX,
  DONATE_PTS,
  DONATE_STAR,
  GIFT_PTS,
  HELP_CREDIT,
  HELP_CREDIT_DAY,
  RESOURCES,
  type AllyTechId,
  type Bonus,
  type ItemId,
  type Res,
} from '../data.ts'
import { mail } from '../sect/inbox.ts'
import { allyOf, put, type Alliance, type Players, type World, type WorldActions } from './base.ts'

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
// Lượt cung phụng còn lúc t (hồi đầy lúc contrib.full) và bao lâu nữa hồi thêm một lượt (0: đang đầy)
export const donateLeft = (s: State, t: number) =>
  Math.min(DONATE_MAX, DONATE_MAX - Math.ceil(Math.max(0, contribOf(s).full - t) / DONATE_EVERY))
export function donateWait(s: State, t: number) {
  const r = contribOf(s).full - t
  return r > 0 ? r - (Math.ceil(r / DONATE_EVERY) - 1) * DONATE_EVERY : 0
}
export const donateCost = (al: Alliance, id: AllyTechId) => DONATE_COST * (techLevel(al, id) + 1)

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

export type GuildAction =
  | { type: 'allyDonate'; tech: AllyTechId; res: Res }
  | { type: 'allyStar'; tech: AllyTechId }
  | { type: 'allyStock'; item: ItemId; n: number }
  | { type: 'allyBuy'; item: ItemId; n: number }

export const SHOP_IDS = Object.keys(ALLY_SHOP) as ItemId[]
const isTech = oneOf(ALLY_TECH_IDS)
const isGood = oneOf(SHOP_IDS)
const isN = int(1, ALLY_SHOP_MAX)
// trưởng lão / minh chủ của minh mình
const officer = (w: World, pid: number) => {
  const al = allyOf(w, pid)
  return al && al.members[pid] >= 1 ? al : undefined
}

export const guildActions: WorldActions<GuildAction> = {
  allyDonate: {
    pick: a => (isTech(a.tech) && oneOf(RESOURCES)(a.res) ? { type: 'allyDonate', tech: a.tech, res: a.res } : null),
    run: ({ w, pid, s }, a) => {
      const al = allyOf(w, pid)
      if (!al) return no('locked')
      const t = s.time
      if (techLevel(al, a.tech) >= ALLY_TECH_PTS.length) return no('max_level')
      if (donateLeft(s, t) < 1) return no('cooldown')
      const cost = donateCost(al, a.tech)
      if (s.res[a.res] < cost) return no('not_enough')
      const gain = DONATE_PTS * (al.star === a.tech ? DONATE_STAR : 1)
      const c = contribOf(s)
      const me: State = {
        ...s,
        res: { ...s.res, [a.res]: s.res[a.res] - cost },
        contrib: { ...c, credit: c.credit + gain, full: Math.max(c.full, t) + DONATE_EVERY },
        stats: { ...s.stats, allied: (s.stats.allied ?? 0) + 1 },
      }
      const tech = { ...al.tech, [a.tech]: Math.min(ALLY_TECH_PTS.at(-1)!, (al.tech?.[a.tech] ?? 0) + gain) }
      return { ok: true, changed: new Map([[pid, me]]), world: put(w, { ...al, tech, fund: (al.fund ?? 0) + gain }) }
    },
  },
  allyStar: {
    pick: a => (isTech(a.tech) ? { type: 'allyStar', tech: a.tech } : null),
    run: ({ w, pid }, a) => {
      const al = officer(w, pid)
      return al ? { ok: true, changed: new Map(), world: put(w, { ...al, star: a.tech }) } : no('locked')
    },
  },
  allyStock: {
    pick: a => (isGood(a.item) && isN(a.n) ? { type: 'allyStock', item: a.item, n: a.n } : null),
    run: ({ w, pid }, a) => {
      const al = officer(w, pid)
      if (!al) return no('locked')
      const have = al.stock?.[a.item] ?? 0
      if (have + a.n > ALLY_SHOP_MAX) return no('full')
      const cost = ALLY_SHOP[a.item]!.stock * a.n
      if ((al.fund ?? 0) < cost) return no('not_enough')
      const stock = { ...al.stock, [a.item]: have + a.n }
      return { ok: true, changed: new Map(), world: put(w, { ...al, fund: (al.fund ?? 0) - cost, stock }) }
    },
  },
  allyBuy: {
    pick: a => (isGood(a.item) && isN(a.n) ? { type: 'allyBuy', item: a.item, n: a.n } : null),
    run: ({ w, pid, s }, a) => {
      const al = allyOf(w, pid)
      if (!al) return no('locked')
      const have = al.stock?.[a.item] ?? 0
      if (have < a.n) return no('empty')
      const c = contribOf(s),
        price = ALLY_SHOP[a.item]!.price * a.n
      if (c.credit < price) return no('not_enough')
      const me: State = {
        ...s,
        contrib: { ...c, credit: c.credit - price },
        items: { ...s.items, [a.item]: (s.items[a.item] ?? 0) + a.n },
      }
      return {
        ok: true,
        changed: new Map([[pid, me]]),
        world: put(w, { ...al, stock: { ...al.stock, [a.item]: have - a.n } }),
      }
    },
  },
}
