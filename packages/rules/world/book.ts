// Thiên Đạo Biên Niên (Monument của RoK): mục tiêu chung của cả giới theo chương. Server gọi bookStep định kỳ; chương xong
// thì phát quà cho mọi người (rollover.ts), quá hạn thì hụt, sang chương sau.
import { no } from '../core/action.ts'
import { metric } from '../core/fest.ts'
import { obj } from '../core/parse.ts'
import { bag } from '../core/util.ts'
import { BOOK, BOOK_TOP, REPAIR_HONOR, RESOURCES, type Bag, type BookGoal } from '../data.ts'
import type { State } from '../core/types.ts'
import { addHonor, type MapCtx, type Players, type World, type WorldActions } from './base.ts'
import { spotOf } from './points.ts'

// Giá trị hiện tại của một mục tiêu (npc: phân đà NPC không tính)
export function bookValue(w: World, ps: Players, map: MapCtx, now: number, m: BookGoal, npc = new Set<number>()) {
  const real = [...ps].filter(([pid]) => !npc.has(pid)).map(([, s]) => s)
  const held = (kind: string) =>
    map.atlas.points.filter(p => p.kind === kind && spotOf(w, map, p.i, now).own !== undefined).length
  const hall = (n: number) => () => real.filter(s => s.levels.chuDien >= n).length
  const values: Record<BookGoal, () => number> = {
    hall5: hall(5),
    hall8: hall(8),
    hall15: hall(15),
    hall20: hall(20),
    explore: () => real.reduce((sum, s) => sum + metric(s, 'explore'), 0),
    gates: () => held('gate'),
    flags: () => Object.values(w.flags ?? {}).filter(f => f.done <= now && !f.mine).length,
    kp: () => real.reduce((sum, s) => sum + (s.stats.kp ?? 0), 0),
    allies5: () => Object.values(w.allies).filter(al => Object.keys(al.members).length >= 5).length,
    veins: () => held('vein'),
    bosses: () => w.bosses ?? 0,
    heaven: () => held('heaven'),
    repair: () => w.repair ?? 0,
  }
  return values[m]()
}
// Chỉ số riêng từng người của chương (đóng góp = tăng thêm từ lúc chương mở); Tu Bổ Thiên Môn tính theo số đã góp (repairBy)
const OWN: Partial<Record<BookGoal, (s: State) => number>> = {
  explore: s => metric(s, 'explore'),
  kp: s => s.stats.kp ?? 0,
}
// Đóng góp của từng người vào chương đang mở (người có đóng góp, cao trước): [mã, lượng]
export function bookBy(w: World, ps: Players, npc = new Set<number>()): [number, number][] {
  const g = BOOK[w.book?.ch ?? 0]
  const f = g && OWN[g.m]
  const by: [number, number][] =
    g?.m === 'repair'
      ? Object.entries(w.repairBy ?? {}).map(([p, n]) => [Number(p), n])
      : f
        ? [...ps].map(([pid, s]) => [pid, f(s) - (w.bookBase?.[pid] ?? f(s))])
        : []
  return by.filter(([pid, n]) => n > 0 && !npc.has(pid)).sort((a, b) => b[1] - a[1] || a[0] - b[0])
}
// Chỉ số lúc bắt đầu của mọi người cho chương ch (người mới vào giữa chương: tính từ lúc thấy lần đầu)
function based(w: World, ps: Players, ch: number): World {
  const f = BOOK[ch] && OWN[BOOK[ch].m]
  if (!f) return w.bookBase ? { ...w, bookBase: undefined } : w
  const base = { ...w.bookBase }
  let fresh = !w.bookBase
  for (const [pid, s] of ps) if (base[pid] === undefined) [base[pid], fresh] = [f(s), true]
  return fresh ? { ...w, bookBase: base } : w
}
// Chương đang mở và tiến độ (null: đã qua hết các chương); chương có chỉ số riêng thêm đóng góp từng người
export function bookView(w: World, ps: Players, map: MapCtx, now: number, npc?: Set<number>) {
  const b = w.book ?? { ch: 0, done: [] }
  const by = bookBy(w, ps, npc)
  return {
    ...b,
    value: b.ch < BOOK.length ? bookValue(w, ps, map, now, BOOK[b.ch].m, npc) : 0,
    ...(by.length && { by }),
  }
}
// Một bước: chương đang mở đủ mục tiêu → xong (done, kèm top người góp nhiều nhất); quá ngày hạn → hụt (missed); còn không thì
// giữ nguyên (chỉ ghi chỉ số bắt đầu cho người mới)
export function bookStep(w: World, ps: Players, map: MapCtx, now: number, day: number, npc?: Set<number>) {
  const b = w.book ?? { ch: 0, done: [] }
  const g = BOOK[b.ch]
  if (!g) return { world: w }
  if (bookValue(w, ps, map, now, g.m, npc) >= g.n) {
    const top = bookBy(w, ps, npc).slice(0, BOOK_TOP)
    const next = { ...w, book: { ch: b.ch + 1, done: [...b.done, b.ch] }, bookBase: undefined }
    return { world: based(next, ps, b.ch + 1), done: b.ch, top }
  }
  if (day > g.day)
    return {
      world: based({ ...w, book: { ch: b.ch + 1, done: b.done }, bookBase: undefined }, ps, b.ch + 1),
      missed: b.ch,
    }
  return { world: based(w, ps, b.ch) }
}

// Tu Bổ Thiên Môn (Past Glory của RoK): lúc chương này đang mở, ai cũng góp tài nguyên vào thanh chung của giới; góp REPAIR_HONOR
// thì được 1 Công Huân
export type BookAction = { type: 'repair'; res: Partial<Bag> }
export const bookActions: WorldActions<BookAction> = {
  repair: {
    pick: a => {
      if (!obj(a.res)) return null
      const res = Object.fromEntries(RESOURCES.map(r => [r, (a.res as Record<string, unknown>)[r] ?? 0]))
      return Object.values(res).every(n => Number.isInteger(n) && (n as number) >= 0) &&
        Object.values(res).some(n => (n as number) > 0)
        ? { type: 'repair', res: res as Partial<Bag> }
        : null
    },
    run: ({ w, pid, s }, a) => {
      if (BOOK[w.book?.ch ?? 0]?.m !== 'repair') return no('locked')
      if (RESOURCES.some(r => s.res[r] < (a.res[r] ?? 0))) return no('not_enough')
      const paid = { ...s, res: bag(r => s.res[r] - (a.res[r] ?? 0)) }
      const n = RESOURCES.reduce((sum, r) => sum + (a.res[r] ?? 0), 0)
      return {
        ok: true,
        world: { ...w, repair: (w.repair ?? 0) + n, repairBy: { ...w.repairBy, [pid]: (w.repairBy?.[pid] ?? 0) + n } },
        changed: new Map([[pid, addHonor(paid, Math.floor(n / REPAIR_HONOR))]]),
      }
    },
  },
}
