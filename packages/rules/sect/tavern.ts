// Chiêu Hiền Đài (như Tavern của RoK, không bán): mở thiếp bạc / vàng (miễn phí theo giờ hoặc bằng thiếp trong túi),
// thu nhận trưởng lão bằng tín vật, nâng sao trưởng lão, ngộ công pháp (tầng ngẫu nhiên, mầm server), truyền công.
// Phần quà rút bằng mầm của server; client có mầm 0 (ẩn) nên chỉ trừ thiếp — quà tới cùng patch của server.
import { no, ok, use, type Actions } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import { int, isElder, oneOf } from '../core/parse.ts'
import { festOpen } from '../core/fest.ts'
import { elderLevel, isMarching, skillLv } from '../core/stats.ts'
import { type Err, type State, type Tavern } from '../core/types.ts'
import { addBag, addItems, bag, nextSeed } from '../core/util.ts'
import {
  ELDERS,
  GOLD_PITY,
  RARITY,
  SKILL_COST,
  SKILL_MAX,
  STAR_COST,
  STAR_MAX,
  TAVERN,
  TAVERN_ELDERS,
  TAVERN_HALL,
  TAVERN_POOL,
  TOKEN_SUMMON,
  TRUYEN_MIN,
  TRUYEN_PER,
  type ElderId,
  type Reward,
  type TavernKind,
} from '../data.ts'

export type TavernAction =
  | { type: 'draw'; kind: TavernKind; n: number } // n lần (1 hoặc 10)
  | { type: 'recruit'; elder: ElderId }
  | { type: 'star'; elder: ElderId }
  | { type: 'ngo'; elder: ElderId } // ngộ công pháp
  | { type: 'truyen'; a: ElderId; b: ElderId } // truyền công: đổi tầng công pháp của a và b

const KINDS = Object.keys(TAVERN) as TavernKind[]
// Lần miễn phí đang có không (để dành tối đa một lượt): lúc lượt kế <= bây giờ
export const tavernFree = (s: State, k: TavernKind) => s.levels.chuDien >= TAVERN_HALL && s.tavern[k] <= s.time
export const starOf = (s: State, e: ElderId) => s.stars[e] ?? 1
export const starCost = (s: State, e: ElderId) => STAR_COST[starOf(s, e) - 1] ?? 0
// Ngộ công pháp: giá lần ngộ tới (theo số lần đã ngộ), các môn ngộ được (đã mở, chưa tầng cuối)
export const ngoCost = (s: State, e: ElderId) => SKILL_COST[skillLv(s, e).reduce((n, x) => n + x - 1, 0)] ?? 0
export const ngoOpen = (s: State, e: ElderId) =>
  skillLv(s, e).flatMap((x, i) =>
    x < SKILL_MAX && (i === 0 || elderLevel(s.elders[e]) >= ELDERS[e].passives[i - 1].at) ? [i] : [],
  )
export function ngoError(s: State, e: ElderId): Err | null {
  if (s.elders[e] === undefined) return 'locked'
  if (!ngoOpen(s, e).length) return 'max_level'
  return (s.tokens[e] ?? 0) < ngoCost(s, e) ? 'not_enough' : null
}

// Truyền công: hai trưởng lão đổi được cho nhau (cùng phẩm, cùng số tâm pháp), giá theo chênh lệch số tầng đã ngộ
export const truyenPair = (a: ElderId, b: ElderId) =>
  a !== b && RARITY[a] === RARITY[b] && ELDERS[a].passives.length === ELDERS[b].passives.length
const ngoCount = (s: State, e: ElderId) => skillLv(s, e).reduce((n, x) => n + x - 1, 0)
export const truyenCost = (s: State, a: ElderId, b: ElderId) =>
  TRUYEN_MIN + TRUYEN_PER * Math.abs(ngoCount(s, a) - ngoCount(s, b))
export function truyenError(s: State, a: ElderId, b: ElderId): Err | null {
  if (!festOpen(s, 'truyenCong', s.time) || s.elders[a] === undefined || s.elders[b] === undefined) return 'locked'
  if (!truyenPair(a, b) || skillLv(s, a).join() === skillLv(s, b).join()) return 'bad'
  if (isMarching(s, a) || isMarching(s, b)) return 'busy' // đội đang đi mang theo công pháp lúc xuất quân
  return (s.items.truyenCong ?? 0) >= truyenCost(s, a, b) ? null : 'not_enough'
}

export function drawError(s: State, k: TavernKind, n: number): Err | null {
  if (s.levels.chuDien < TAVERN_HALL) return 'locked'
  const keys = s.items[TAVERN[k].key] ?? 0
  return keys + (tavernFree(s, k) ? 1 : 0) >= n ? null : 'no_item'
}

// Rút một phần quà: trả (quà, mầm kế). Tín vật: n tín vật một trưởng lão ngẫu nhiên của loại thiếp.
function pick(k: TavernKind, seed: number): [Reward, Map<ElderId, number>, number] {
  const pool = TAVERN_POOL[k]
  const total = pool.reduce((a, p) => a + p.w, 0)
  let x = ((seed >>> 0) / 2 ** 32) * total
  let s2 = nextSeed(seed)
  const p = pool.find(q => (x -= q.w) < 0) ?? pool[pool.length - 1]
  if (!p.token) return [p.r ?? {}, new Map(), s2]
  const list = TAVERN_ELDERS[k]
  const e = list[Math.floor(((s2 >>> 0) / 2 ** 32) * list.length) % list.length]
  s2 = nextSeed(s2)
  return [{}, new Map([[e, p.token]]), s2]
}

// Một lần mở; `last` gộp quà của cả lượt mở (nhiều lần) để giao diện hiện một lần
function draw(s: State, k: TavernKind, last: Tavern['last']): State {
  const free = tavernFree(s, k)
  const paid: State = free
    ? { ...s, tavern: { ...s.tavern, [k]: s.time + TAVERN[k].free } }
    : { ...s, items: use(s, TAVERN[k].key) }
  let st: State = { ...paid, stats: { ...paid.stats, drawn: (paid.stats.drawn ?? 0) + 1 } }
  if (!s.seed) return st // client: chưa biết quà
  let seed = s.seed
  let got: Reward = last?.got ?? {}
  const tokens = { ...st.tokens }
  const shown = { ...last?.tokens }
  const addTokens = (e: ElderId, n: number) => {
    tokens[e] = (tokens[e] ?? 0) + n
    shown[e] = (shown[e] ?? 0) + n
  }
  for (let i = 0; i < TAVERN[k].slots; i++) {
    const [r, t, next] = pick(k, seed)
    seed = next
    st = grant(st, r)
    got = {
      res: addBag(
        bag(x => got.res?.[x] ?? 0),
        r.res ?? {},
      ),
      items: addItems(got.items ?? {}, r.items ?? {}),
    }
    for (const [e, n] of t) addTokens(e, n)
  }
  let pity = st.tavern.pity
  if (k === 'gold' && ++pity >= GOLD_PITY) {
    pity = 0
    const list = TAVERN_ELDERS.gold
    addTokens(list[Math.floor(((seed >>> 0) / 2 ** 32) * list.length) % list.length], TOKEN_SUMMON)
    seed = nextSeed(seed)
  }
  return { ...st, seed, tokens, tavern: { ...st.tavern, pity, last: { at: s.time, got, tokens: shown } } }
}

export const tavernActions: Actions<TavernAction> = {
  draw: {
    pick: a => (oneOf(KINDS)(a.kind) && int(1, 10)(a.n) ? { type: 'draw', kind: a.kind, n: a.n } : null),
    run: (s, a) => {
      const e = drawError(s, a.kind, a.n)
      if (e) return no(e)
      let st = s
      for (let i = 0; i < a.n; i++) st = draw(st, a.kind, i ? st.tavern.last : null)
      return ok(st)
    },
  },
  recruit: {
    pick: a => (isElder(a.elder) ? { type: 'recruit', elder: a.elder } : null),
    run: (s, a) => {
      if (s.elders[a.elder] !== undefined) return no('claimed')
      if ((s.tokens[a.elder] ?? 0) < TOKEN_SUMMON) return no('not_enough')
      return ok({
        ...s,
        elders: { ...s.elders, [a.elder]: 0 },
        tokens: { ...s.tokens, [a.elder]: s.tokens[a.elder]! - TOKEN_SUMMON },
      })
    },
  },
  // Ngộ công pháp: mầm server chọn một môn trong ngoOpen lên một tầng (client mầm 0: chờ patch của server)
  ngo: {
    pick: a => (isElder(a.elder) ? { type: 'ngo', elder: a.elder } : null),
    run: (s, a) => {
      const e = ngoError(s, a.elder)
      if (e) return no(e)
      if (!s.seed) return ok(s)
      const open = ngoOpen(s, a.elder)
      const i = open[Math.floor(((s.seed >>> 0) / 2 ** 32) * open.length)]
      const lv = skillLv(s, a.elder).map((x, k) => (k === i ? x + 1 : x))
      return ok({
        ...s,
        seed: nextSeed(s.seed),
        skl: { ...s.skl, [a.elder]: lv },
        tokens: { ...s.tokens, [a.elder]: s.tokens[a.elder]! - ngoCost(s, a.elder) },
      })
    },
  },
  truyen: {
    pick: a => (isElder(a.a) && isElder(a.b) ? { type: 'truyen', a: a.a, b: a.b } : null),
    run: (s, a) => {
      const e = truyenError(s, a.a, a.b)
      if (e) return no(e)
      const items = addItems(s.items, { truyenCong: -truyenCost(s, a.a, a.b) })
      return ok({ ...s, items, skl: { ...s.skl, [a.a]: skillLv(s, a.b), [a.b]: skillLv(s, a.a) } })
    },
  },
  star: {
    pick: a => (isElder(a.elder) ? { type: 'star', elder: a.elder } : null),
    run: (s, a) => {
      if (s.elders[a.elder] === undefined) return no('locked')
      if (starOf(s, a.elder) >= STAR_MAX) return no('max_level')
      const c = starCost(s, a.elder)
      if ((s.tokens[a.elder] ?? 0) < c) return no('not_enough')
      return ok({
        ...s,
        stars: { ...s.stars, [a.elder]: starOf(s, a.elder) + 1 },
        tokens: { ...s.tokens, [a.elder]: s.tokens[a.elder]! - c },
      })
    },
  },
}
