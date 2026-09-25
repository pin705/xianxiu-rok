// Thiên Đạo Biên Niên (Monument của RoK): mục tiêu chung của cả giới theo chương. Server gọi bookStep định kỳ; chương xong
// thì phát quà cho mọi người (rollover.ts), quá hạn thì hụt, sang chương sau.
import { metric } from '../core/fest.ts'
import { BOOK, type BookGoal } from '../data.ts'
import { type MapCtx, type Players, type World } from './base.ts'
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
    flags: () => Object.values(w.flags ?? {}).filter(f => f.done <= now).length,
    kp: () => real.reduce((sum, s) => sum + (s.stats.kp ?? 0), 0),
    allies5: () => Object.values(w.allies).filter(al => Object.keys(al.members).length >= 5).length,
    veins: () => held('vein'),
    bosses: () => w.bosses ?? 0,
    heaven: () => held('heaven'),
  }
  return values[m]()
}
// Chương đang mở và tiến độ (null: đã qua hết các chương)
export function bookView(w: World, ps: Players, map: MapCtx, now: number, npc?: Set<number>) {
  const b = w.book ?? { ch: 0, done: [] }
  return { ...b, value: b.ch < BOOK.length ? bookValue(w, ps, map, now, BOOK[b.ch].m, npc) : 0 }
}
// Một bước: chương đang mở đủ mục tiêu → xong (done); quá ngày hạn → hụt (missed); còn không thì giữ nguyên
export function bookStep(w: World, ps: Players, map: MapCtx, now: number, day: number, npc?: Set<number>) {
  const b = w.book ?? { ch: 0, done: [] }
  const g = BOOK[b.ch]
  if (!g) return { world: w }
  if (bookValue(w, ps, map, now, g.m, npc) >= g.n)
    return { world: { ...w, book: { ch: b.ch + 1, done: [...b.done, b.ch] } }, done: b.ch }
  if (day > g.day) return { world: { ...w, book: { ch: b.ch + 1, done: b.done } }, missed: b.ch }
  return { world: w }
}
