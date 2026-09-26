// Trung tâm sự kiện: nhận quà (ngày đăng nhập, mục tiêu, mốc điểm) của sự kiện đang mở; quay vòng quà (Thiên Cơ Luân).
import { no, ok, type Actions } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import { dayOf } from '../core/calendar.ts'
import {
  FEST_IDS,
  diceAt,
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
import { nextSeed } from '../core/util.ts'
import { FESTS, NHAT_KHOA_DAY, PASS_CHEST, type FestDef, type FestId } from '../data.ts'

export type FestAction = { type: 'fest'; id: FestId; i: number } | { type: 'spin'; id: FestId; n: 1 | 10 }

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
  const next = { ...f, got: [...f.got, face], days: f.days + (free ? 1 : 0), last: free ? dayOf(s.time) : f.last }
  return { ...st, seed: nextSeed(s.seed), fest: { ...st.fest, [id]: next } }
}

export function spinError(s: State, id: FestId, n: number): Err | null {
  const d = FESTS[id]
  if (!luck(d) || !festOpen(s, id, s.time)) return 'locked'
  if (d.kind === 'dice' && n !== 1) return 'bad' // xúc xắc: đổ từng lượt
  const paid = n - (wheelFree(s, id, s.time) ? 1 : 0)
  return festTokens(s, id) >= d.cost * paid ? null : 'not_enough'
}

export function festError(s: State, id: FestId, i: number): Err | null {
  if (!festOpen(s, id, s.time)) return 'locked'
  if (!festRewards(id)[i]) return 'bad'
  if (festGot(s, id, i)) return 'claimed'
  return festDone(s, id, i) ? null : 'not_done'
}

export const festActions: Actions<FestAction> = {
  fest: {
    pick: a => (oneOf(FEST_IDS)(a.id) && int(0, 99)(a.i) ? { type: 'fest', id: a.id, i: a.i } : null),
    run: (s, a) => {
      const e = festError(s, a.id, a.i)
      if (e) return no(e)
      const f = s.fest[a.id]!
      const got = { ...grant(s, festRewards(a.id)[a.i]), fest: { ...s.fest, [a.id]: { ...f, got: [...f.got, a.i] } } }
      const st = a.id === 'nhatKhoa' ? passXp(got, PASS_CHEST) : got // rương Nhật Khóa: điểm Tu Tiên Lệnh
      // rương mốc 60 của Nhật Khóa = một hôm "mở rương ngày" cho nhiệm vụ tuần
      if (a.id !== 'nhatKhoa' || a.i !== NHAT_KHOA_DAY) return ok(st)
      return ok({ ...st, weekly: { ...st.weekly, n: { ...st.weekly.n, days: st.weekly.n.days + 1 } } })
    },
  },
  // Quay vòng quà n lượt / đổ xúc xắc một lượt (lượt miễn phí hôm nay dùng trước). Ô trúng / mặt xúc xắc rút bằng mầm của server:
  // client (mầm 0) chưa đổi gì, quà và got tới cùng patch của server
  spin: {
    pick: a => (oneOf(FEST_IDS)(a.id) && (a.n === 1 || a.n === 10) ? { type: 'spin', id: a.id, n: a.n } : null),
    run: (s, a) => {
      const e = spinError(s, a.id, a.n)
      if (e) return no(e)
      if (!s.seed) return ok(s)
      const dd = FESTS[a.id]
      if (dd.kind === 'dice') return ok(roll(s, a.id, dd))
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
