// Trung tâm sự kiện: nhận quà (ngày đăng nhập, mục tiêu, mốc điểm) của sự kiện đang mở; quay vòng quà (Thiên Cơ Luân).
import { no, ok, type Actions } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import { dayOf } from '../core/calendar.ts'
import {
  FEST_IDS,
  cardsAt,
  diceAt,
  digAt,
  festEnds,
  raceAt,
  wishAt,
  WISH_BLOOM,
  festCode,
  festDone,
  festGot,
  festOpen,
  festRewards,
  festTokens,
  luck,
  passXp,
  wheelElder,
  wheelFree,
} from '../core/fest.ts'
import { int, oneOf } from '../core/parse.ts'
import { type Err, type State } from '../core/types.ts'
import { addItems, nextSeed } from '../core/util.ts'
import {
  FESTS,
  NHAT_KHOA_DAY,
  PASS_CHEST,
  RACE_LATE,
  RACE_MS,
  RACE_RUNS,
  SPEED_MIN,
  type BagId,
  type FestDef,
  type FestId,
} from '../data.ts'

export type FestAction =
  | { type: 'fest'; id: FestId; i: number }
  | { type: 'flip'; id: FestId; i: number } // lật bài: lật lá i
  | { type: 'race' } // Trảm Yêu Tốc Chiến: bắt đầu lượt đua
  | { type: 'spin'; id: FestId; n: 1 | 10; pick?: number } // pick: món chủ lực đã chọn (đập trứng)
  | { type: 'delve'; id: FestId; cell: number; pick: number } // khảo cổ: cuốc ô cell, giải tối thượng đã chọn
  | { type: 'swap'; id: FestId; i: number; n: number } // đổi phù: n lá mệnh giá SPEED_MIN[i]
  | { type: 'offer'; id: FestId; n: number } // nộp lên cấp: n lệnh bài lễ

// Một lượt quay: ô theo trọng số từ mầm; lượt thứ pity, 2·pity… (k: số lượt đã quay trước đó) chắc trúng ô đầu
function wheelPick(d: Extract<FestDef, { kind: 'wheel' }>, seed: number, k: number): number {
  if ((k + 1) % d.pity === 0) return 0
  let x = ((seed >>> 0) / 2 ** 32) * d.slots.reduce((a, q) => a + q.w, 0)
  const i = d.slots.findIndex(q => (x -= q.w) < 0)
  return i < 0 ? d.slots.length - 1 : i
}

// Bàn xúc xắc: mặt 1–6 theo mầm, đi từ ô đang đứng, nhận quà ô dừng; qua Khởi điểm thì thêm quà vòng
function roll(s: State, id: FestId, d: Extract<FestDef, { kind: 'dice' }>): State {
  const f = s.fest[id]!
  const free = wheelFree(s, id, s.time)
  const face = 1 + Math.floor(((s.seed >>> 0) / 2 ** 32) * 6)
  const { pos } = diceAt(s, id)
  let st = grant(s, d.board[(pos + face) % d.board.length])
  if (pos + face >= d.board.length) st = grant(st, d.lap)
  const next = { ...f, got: [...f.got, -face], days: f.days + (free ? 1 : 0), last: free ? dayOf(s.time) : f.last }
  return { ...st, seed: nextSeed(s.seed), fest: { ...st.fest, [id]: next } }
}

// Đập n quả linh noãn: mỗi quả ch trúng món chủ lực đã chọn (ghi −1), còn lại rút theo trọng số pool (ghi −(k + 2))
function smash(s: State, id: FestId, d: Extract<FestDef, { kind: 'egg' }>, n: number, pick: number): State {
  const f = s.fest[id]!
  const free = wheelFree(s, id, s.time)
  const total = d.pool.reduce((a, p) => a + p.w, 0)
  let st = s,
    seed = s.seed
  const got = [...f.got]
  for (let k = 0; k < n; k++) {
    const x = (seed >>> 0) / 2 ** 32
    seed = nextSeed(seed)
    if (x < d.ch) {
      st = grant(st, d.picks[pick])
      got.push(-1)
      continue
    }
    let y = ((x - d.ch) / (1 - d.ch)) * total
    const k0 = d.pool.findIndex(p => (y -= p.w) < 0)
    const i = k0 < 0 ? d.pool.length - 1 : k0
    st = grant(st, d.pool[i].r)
    got.push(-(i + 2))
  }
  const next = { ...f, got, days: f.days + (free ? 1 : 0), last: free ? dayOf(s.time) : f.last }
  return { ...st, seed, fest: { ...st.fest, [id]: next } }
}

// Khảo cổ: lựa chọn giải tối thượng của tầng (tầng 5, 10… lấy bảng grand)
export const digPicks = (d: Extract<FestDef, { kind: 'dig' }>, layer: number) => ((layer + 1) % 5 ? d.picks : d.grand)
export function delveError(s: State, id: FestId, cell: number, pick: number): Err | null {
  const d = FESTS[id]
  if (d.kind !== 'dig' || !festOpen(s, id, s.time)) return 'locked'
  const { layer, dug } = digAt(s, id)
  if (cell >= d.cells || dug.some(x => x.cell === cell) || !digPicks(d, layer)[pick]) return 'bad'
  return wheelFree(s, id, s.time) || festTokens(s, id) >= d.cost ? null : 'not_enough'
}
// Một nhát: còn n ô chưa đào thì ô này có giải với xác suất 1/n (như xếp giải ngẫu nhiên từ đầu tầng); không thì quà thường theo trọng số
function delve(s: State, id: FestId, d: Extract<FestDef, { kind: 'dig' }>, cell: number, pick: number): State {
  const f = s.fest[id]!
  const free = wheelFree(s, id, s.time)
  const { layer, dug } = digAt(s, id)
  const x = (s.seed >>> 0) / 2 ** 32
  const left = d.cells - dug.length
  let st: State, r: number
  if (x < 1 / left) [st, r] = [grant(s, digPicks(d, layer)[pick]), 0]
  else {
    let y = ((x - 1 / left) / (1 - 1 / left)) * d.pool.reduce((a, p) => a + p.w, 0)
    const k0 = d.pool.findIndex(p => (y -= p.w) < 0)
    const k = k0 < 0 ? d.pool.length - 1 : k0
    ;[st, r] = [grant(s, d.pool[k].r), k + 1]
  }
  const got = [...f.got, -(cell * 100 + r + 1)]
  const next = { ...f, got, days: f.days + (free ? 1 : 0), last: free ? dayOf(s.time) : f.last }
  return { ...st, seed: nextSeed(s.seed), fest: { ...st.fest, [id]: next } }
}

// Cầu duyên một lượt: rút một quà còn trên cây theo trọng số; rút đủ quà đặc biệt thì nhận nốt phần còn lại, cây nở lại
function wish(s: State, id: FestId, d: Extract<FestDef, { kind: 'wish' }>): State {
  const f = s.fest[id]!
  const free = wheelFree(s, id, s.time)
  const { drawn } = wishAt(s, id)
  const left = d.pool.map((_, k) => k).filter(k => !drawn.includes(k))
  let y = ((s.seed >>> 0) / 2 ** 32) * left.reduce((a, k) => a + d.pool[k].w, 0)
  const k = left.find(x => (y -= d.pool[x].w) < 0) ?? left[left.length - 1]
  let st = grant(s, d.pool[k].r)
  const got = [...f.got, -(k + 1)]
  const bigs = d.pool.map((p, x) => (p.big ? x : -1)).filter(x => x >= 0)
  if (bigs.every(x => x === k || drawn.includes(x))) {
    for (const x of left) if (x !== k) st = grant(st, d.pool[x].r)
    got.push(WISH_BLOOM)
  }
  const next = { ...f, got, days: f.days + (free ? 1 : 0), last: free ? dayOf(s.time) : f.last }
  return { ...st, seed: nextSeed(s.seed), fest: { ...st.fest, [id]: next } }
}

// Xin xăm: n quẻ, mỗi quẻ một bậc theo trọng số (mầm server), nhận quà của bậc; got ghi −(bậc + 1)
function omen(s: State, id: FestId, d: Extract<FestDef, { kind: 'omen' }>, n: number): State {
  const f = s.fest[id]!
  const free = wheelFree(s, id, s.time)
  const total = d.tiers.reduce((a, t) => a + t.w, 0)
  let st = s,
    seed = s.seed
  const got = [...f.got]
  for (let k = 0; k < n; k++) {
    let x = ((seed >>> 0) / 2 ** 32) * total
    const i = d.tiers.findIndex(t => (x -= t.w) < 0)
    const tier = i < 0 ? d.tiers.length - 1 : i
    seed = nextSeed(seed)
    got.push(-(tier + 1))
    st = grant(st, d.tiers[tier].r)
  }
  const next = { ...f, got, days: f.days + (free ? 1 : 0), last: free ? dayOf(s.time) : f.last }
  return { ...st, seed, fest: { ...st.fest, [id]: next } }
}

export function spinError(s: State, id: FestId, n: number, pick?: number): Err | null {
  const d = FESTS[id]
  if (!luck(d) || !festOpen(s, id, s.time)) return 'locked'
  if ((d.kind === 'dice' || d.kind === 'wish') && n !== 1) return 'bad' // xúc xắc, cầu duyên: từng lượt
  if (d.kind === 'egg' && (pick === undefined || !d.picks[pick])) return 'bad' // đập trứng: phải chọn món chủ lực
  const paid = n - (wheelFree(s, id, s.time) ? 1 : 0)
  return festTokens(s, id) >= d.cost * paid ? null : 'not_enough'
}

export function festError(s: State, id: FestId, i: number): Err | null {
  if (!festOpen(s, id, s.time)) return 'locked'
  if (!festRewards(id)[i]) return 'bad'
  if (festGot(s, id, i)) return 'claimed'
  return festDone(s, id, i) ? null : 'not_done'
}

// Lật bài: lá i lật được (chưa ghép, không phải lá đang chờ), còn ván, còn lá miễn phí hay đủ lệnh
export function flipError(s: State, id: FestId, i: number): Err | null {
  const d = FESTS[id]
  if (d.kind !== 'cards' || !festOpen(s, id, s.time)) return 'locked'
  const c = cardsAt(s, id)
  if (c.games >= d.games) return 'limit'
  if (i > 11 || c.cards[i] > 10 || c.pending === i) return 'bad'
  return c.flips < d.free || festTokens(s, id) >= d.cost ? null : 'not_enough'
}
// Lật một lá: lá úp chưa rõ thì rút mặt trong số mặt còn thiếu (mỗi mặt hai lá — như xáo sẵn cả bộ); lá thứ hai của cặp giống lá
// đang chờ thì ghép, nhận quà đôi; lật hết 6 đôi thì quà ván và ván mới
function flip(s: State, id: FestId, d: Extract<FestDef, { kind: 'cards' }>, i: number): State {
  const f = s.fest[id]!
  const c = cardsAt(s, id)
  const cards = [...c.cards]
  let seed = s.seed
  if (!cards[i]) {
    const left = [1, 2, 3, 4, 5, 6].flatMap(k => Array(2 - cards.filter(x => x % 10 === k).length).fill(k))
    cards[i] = left[Math.floor(((seed >>> 0) / 2 ** 32) * left.length)]
    seed = nextSeed(seed)
  }
  let st: State = s
  let pending = i
  if (c.pending >= 0) {
    pending = -1
    if (cards[c.pending] === cards[i]) {
      st = grant(st, d.pairs[cards[i] - 1])
      cards[i] += 10
      cards[c.pending] += 10
    }
  }
  let games = c.games
  const paid = c.flips >= d.free ? 1 : 0
  let flips = c.flips + 1
  if (cards.every(x => x > 10)) {
    st = grant(st, d.done)
    games += 1
    cards.fill(0)
    flips = 0
  }
  const next = { ...f, sp: [...cards, pending + 1, flips, games], days: f.days + paid }
  return { ...st, seed, fest: { ...st.fest, [id]: next } }
}

// Trảm Yêu Tốc Chiến: bắt đầu một lượt đua (còn lượt hôm nay, không đang đua, không quá sát giờ đóng lễ)
export function raceError(s: State): Err | null {
  if (FESTS.tocChien.kind !== 'race' || !festOpen(s, 'tocChien', s.time)) return 'locked'
  const r = raceAt(s, s.time)
  if (r.live) return 'busy'
  if (r.runs >= RACE_RUNS) return 'limit'
  return festEnds(s, 'tocChien', s.time) - s.time < RACE_LATE ? 'locked' : null
}

// Đổi phù (Hoá Kiến Vi Binh): mã hai loại phù cùng mệnh giá i; đổi được khi lễ mở, còn hạn mức mệnh giá đó và đủ phù trong túi
const swapIds = (d: Extract<FestDef, { kind: 'swap' }>, i: number) =>
  [`${d.from}${SPEED_MIN[i]}`, `${d.to}${SPEED_MIN[i]}`] as [BagId, BagId]
export function swapError(s: State, id: FestId, i: number, n: number): Err | null {
  const d = FESTS[id]
  if (d.kind !== 'swap' || !festOpen(s, id, s.time)) return 'locked'
  if (!SPEED_MIN[i] || n < 1) return 'bad'
  if ((s.fest[id]?.sp?.[i] ?? 0) + n > d.max) return 'limit'
  return (s.items[swapIds(d, i)[0]] ?? 0) >= n ? null : 'not_enough'
}

export const festActions: Actions<FestAction> = {
  // Nộp lên cấp: n lệnh bài lễ, kinh nghiệm = n × hệ số chí mạng rút bằng mầm server (client mầm 0: chờ patch)
  offer: {
    pick: a => (oneOf(FEST_IDS)(a.id) && int(1, 99_999)(a.n) ? { type: 'offer', id: a.id, n: a.n as number } : null),
    run: (s, a) => {
      const d = FESTS[a.id]
      if (d.kind !== 'offer' || !festOpen(s, a.id, s.time)) return no('locked')
      if (festTokens(s, a.id) < a.n) return no('not_enough')
      if (!s.seed) return ok(s)
      let r = ((s.seed >>> 0) / 2 ** 32) * d.crit.reduce((n, c) => n + c.w, 0)
      const x = (d.crit.find(c => (r -= c.w) < 0) ?? d.crit[0]).x
      const f = s.fest[a.id]!
      const [spent = 0, exp = 0] = f.sp ?? []
      return ok({
        ...s,
        seed: nextSeed(s.seed),
        fest: { ...s.fest, [a.id]: { ...f, sp: [spent + a.n, exp + a.n * x, x] } },
      })
    },
  },
  swap: {
    pick: a =>
      oneOf(FEST_IDS)(a.id) && int(0, 5)(a.i) && int(1, 200)(a.n)
        ? { type: 'swap', id: a.id, i: a.i as number, n: a.n as number }
        : null,
    run: (s, a) => {
      const e = swapError(s, a.id, a.i, a.n)
      if (e) return no(e)
      const d = FESTS[a.id] as Extract<FestDef, { kind: 'swap' }>
      const f = s.fest[a.id]!
      const [from, to] = swapIds(d, a.i)
      const sp = SPEED_MIN.map((_, k) => (f.sp?.[k] ?? 0) + (k === a.i ? a.n : 0)) // lá đã đổi mỗi mệnh giá
      const items = addItems(s.items, { [from]: -a.n, [to]: a.n })
      return ok({ ...s, items, fest: { ...s.fest, [a.id]: { ...f, sp } } })
    },
  },
  fest: {
    pick: a => (oneOf(FEST_IDS)(a.id) && int(0, 99)(a.i) ? { type: 'fest', id: a.id, i: a.i } : null),
    run: (s, a) => {
      const e = festError(s, a.id, a.i)
      if (e) return no(e)
      const f = s.fest[a.id]!
      const code = festCode(s, a.id, a.i)
      const got = { ...grant(s, festRewards(a.id)[a.i]), fest: { ...s.fest, [a.id]: { ...f, got: [...f.got, code] } } }
      const st = a.id === 'nhatKhoa' ? passXp(got, PASS_CHEST) : got // rương Nhật Khóa: điểm Tu Tiên Lệnh
      // rương mốc 60 của Nhật Khóa = một hôm "mở rương ngày" cho nhiệm vụ tuần
      if (a.id !== 'nhatKhoa' || a.i !== NHAT_KHOA_DAY) return ok(st)
      return ok({ ...st, weekly: { ...st.weekly, n: { ...st.weekly.n, days: st.weekly.n.days + 1 } } })
    },
  },
  flip: {
    pick: a => (oneOf(FEST_IDS)(a.id) && int(0, 11)(a.i) ? { type: 'flip', id: a.id, i: a.i } : null),
    run: (s, a) => {
      const e = flipError(s, a.id, a.i)
      if (e) return no(e)
      const d = FESTS[a.id]
      // lá úp chưa rõ: mặt rút bằng mầm server — client chờ; lá đã lộ thì tất định
      if (!s.seed && !cardsAt(s, a.id).cards[a.i]) return ok(s)
      return ok(d.kind === 'cards' ? flip(s, a.id, d, a.i) : s)
    },
  },
  race: {
    pick: () => ({ type: 'race' }),
    run: s => {
      const e = raceError(s)
      if (e) return no(e)
      const f = s.fest.tocChien!
      const r = raceAt(s, s.time)
      const next = { ...f, sp: [s.time + RACE_MS, 0, s.time], days: r.runs + 1, last: dayOf(s.time) }
      return ok({ ...s, fest: { ...s.fest, tocChien: next } })
    },
  },
  // Khảo cổ: cuốc một ô của tầng đang đào (nhát miễn phí hôm nay dùng trước); ô có giải hay không rút bằng mầm server
  delve: {
    pick: a =>
      oneOf(FEST_IDS)(a.id) && int(0, 99)(a.cell) && int(0, 9)(a.pick)
        ? { type: 'delve', id: a.id, cell: a.cell as number, pick: a.pick as number }
        : null,
    run: (s, a) => {
      const e = delveError(s, a.id, a.cell, a.pick)
      if (e) return no(e)
      const d = FESTS[a.id]
      return ok(s.seed && d.kind === 'dig' ? delve(s, a.id, d, a.cell, a.pick) : s)
    },
  },
  // Quay vòng quà n lượt / đổ xúc xắc một lượt (lượt miễn phí hôm nay dùng trước). Ô trúng / mặt xúc xắc rút bằng mầm của server:
  // client (mầm 0) chưa đổi gì, quà và got tới cùng patch của server
  spin: {
    pick: a =>
      oneOf(FEST_IDS)(a.id) && (a.n === 1 || a.n === 10) && (a.pick === undefined || int(0, 9)(a.pick))
        ? { type: 'spin', id: a.id, n: a.n, ...(a.pick !== undefined && { pick: a.pick as number }) }
        : null,
    run: (s, a) => {
      const e = spinError(s, a.id, a.n, a.pick)
      if (e) return no(e)
      if (!s.seed) return ok(s)
      const dd = FESTS[a.id]
      if (dd.kind === 'dice') return ok(roll(s, a.id, dd))
      if (dd.kind === 'egg') return ok(smash(s, a.id, dd, a.n, a.pick!))
      if (dd.kind === 'wish') return ok(wish(s, a.id, dd))
      if (dd.kind === 'omen') return ok(omen(s, a.id, dd, a.n))
      const d = dd as Extract<FestDef, { kind: 'wheel' }>
      const f = s.fest[a.id]!
      const free = wheelFree(s, a.id, s.time)
      const elder = wheelElder(s, a.id)!
      let st = s,
        seed = s.seed
      const got = [...f.got]
      for (let k = 0; k < a.n; k++) {
        const i = wheelPick(d, seed, got.length)
        seed = nextSeed(seed)
        got.push(i)
        const slot = d.slots[i]
        st = slot.token
          ? { ...st, tokens: { ...st.tokens, [elder]: (st.tokens[elder] ?? 0) + slot.token } }
          : grant(st, slot.r ?? {})
      }
      const next = { ...f, got, days: f.days + (free ? 1 : 0), last: free ? dayOf(s.time) : f.last }
      return ok({ ...st, seed, fest: { ...st.fest, [a.id]: next } })
    },
  },
}
