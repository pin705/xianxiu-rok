// Thao tác Hộ Minh Đại Trận (cung phụng, minh chủ điểm trận) và Cống Hiến Các (nhập hàng, đổi hàng) — như Alliance
// Technology / Shop của RoK. Phần dùng chung (tầng trận, tăng ích, cống hiến, Minh lễ) ở base.ts.
import { no } from '../core/action.ts'
import { MAP_W } from '../atlas.ts'
import { cleanText, int, oneOf } from '../core/parse.ts'
import type { State } from '../core/types.ts'
import {
  ALLY_MARKS,
  ALLY_SHOP,
  ALLY_SHOP_MAX,
  ALLY_TECH_IDS,
  ALLY_TECH_PTS,
  DONATE_COST,
  DONATE_EVERY,
  DONATE_MAX,
  DONATE_PTS,
  DONATE_STAR,
  RESOURCES,
  type AllyTechId,
  type ItemId,
  type Res,
} from '../data.ts'
import { allyOf, contribOf, put, techLevel, type Alliance, type World, type WorldActions } from './base.ts'

// Lượt cung phụng còn lúc t (hồi đầy lúc contrib.full) và bao lâu nữa hồi thêm một lượt (0: đang đầy)
export const donateLeft = (s: State, t: number) =>
  Math.min(DONATE_MAX, DONATE_MAX - Math.ceil(Math.max(0, contribOf(s).full - t) / DONATE_EVERY))
export function donateWait(s: State, t: number) {
  const r = contribOf(s).full - t
  return r > 0 ? r - (Math.ceil(r / DONATE_EVERY) - 1) * DONATE_EVERY : 0
}
export const donateCost = (al: Alliance, id: AllyTechId) => DONATE_COST * (techLevel(al, id) + 1)

export type GuildAction =
  | { type: 'allyDonate'; tech: AllyTechId; res: Res }
  | { type: 'allyStar'; tech: AllyTechId }
  | { type: 'allyStock'; item: ItemId; n: number }
  | { type: 'allyBuy'; item: ItemId; n: number }
  | { type: 'allyMark'; x: number; y: number; text: string }
  | { type: 'allyUnmark'; x: number; y: number }

export const SHOP_IDS = Object.keys(ALLY_SHOP) as ItemId[]
const isTech = oneOf(ALLY_TECH_IDS)
const isGood = oneOf(SHOP_IDS)
const isN = int(1, ALLY_SHOP_MAX)
const isXY = int(0, MAP_W - 1)
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
  // Dấu bản đồ cho cả minh (trưởng lão / minh chủ): đặt lại cùng ô thì đổi lời ghi; tối đa ALLY_MARKS dấu
  allyMark: {
    pick: a => {
      const text = cleanText(a.text)
      return isXY(a.x) && isXY(a.y) && text && [...text].length <= 20 ? { type: 'allyMark', x: a.x, y: a.y, text } : null
    },
    run: ({ w, pid, now }, a) => {
      const al = officer(w, pid)
      if (!al) return no('locked')
      const rest = (al.marks ?? []).filter(m => m.x !== a.x || m.y !== a.y)
      if (rest.length >= ALLY_MARKS) return no('full')
      const marks = [...rest, { x: a.x, y: a.y, text: a.text, by: pid, at: now }]
      return { ok: true, changed: new Map(), world: put(w, { ...al, marks }) }
    },
  },
  allyUnmark: {
    pick: a => (isXY(a.x) && isXY(a.y) ? { type: 'allyUnmark', x: a.x, y: a.y } : null),
    run: ({ w, pid }, a) => {
      const al = officer(w, pid)
      if (!al) return no('locked')
      const marks = (al.marks ?? []).filter(m => m.x !== a.x || m.y !== a.y)
      if (marks.length === (al.marks ?? []).length) return no('gone')
      return { ok: true, changed: new Map(), world: put(w, { ...al, marks }) }
    },
  },
}
