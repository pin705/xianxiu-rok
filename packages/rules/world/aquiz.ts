// Luận Đạo Vấn Đáp (Alliance Quiz của RoK): đường chủ / minh chủ mở trong ngày (mỗi minh một lần mỗi ngày), đếm ngược AQUIZ_WAIT rồi
// AQUIZ_N câu, mỗi câu AQUIZ_Q; người trong minh chọn đáp án câu đang hỏi (đổi được tới lúc hết câu). Hết giờ: điểm minh = tổng câu
// đúng của mọi người, đạt mốc AQUIZ_TIERS thì ai có trả lời nhận quà theo mốc qua thư (aquizStep, server gọi mỗi nhịp). Câu hỏi lấy
// từ bộ câu Vấn Đạo Đài (QUIZ_KEY), xáo tất định theo minh và ngày.
import { no } from '../core/action.ts'
import { dayOf } from '../core/calendar.ts'
import { int } from '../core/parse.ts'
import { AQUIZ_N, AQUIZ_PRIZES, AQUIZ_Q, AQUIZ_TIERS, AQUIZ_WAIT, QUIZ_KEY } from '../data.ts'
import { mail } from '../sect/inbox.ts'
import { allyOf, put, type Alliance, type Players, type World, type WorldActions } from './base.ts'

// Bộ câu của phiên (mã câu trong QUIZ_KEY), xáo theo minh và ngày bắt đầu
export function aquizQs(aid: number, at: number): number[] {
  const idx = QUIZ_KEY.map((_, i) => i)
  let x = (Math.imul(aid, 2654435761) ^ dayOf(at)) >>> 0
  for (let i = idx.length - 1; i > 0; i--) {
    x = (Math.imul(x ^ (x >>> 15), 2246822519) + 3266489917) >>> 0
    const j = x % (i + 1)
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx.slice(0, AQUIZ_N)
}
// Câu đang hỏi lúc t: −1 đang đếm ngược, AQUIZ_N đã hết
export const aquizK = (q: { at: number }, t: number) =>
  t < q.at ? -1 : Math.min(AQUIZ_N, Math.floor((t - q.at) / AQUIZ_Q))
// Số câu đúng của từng người trong phiên
export function aquizScores(w: World, al: Alliance): [number, number][] {
  const q = al.quiz
  if (!q) return []
  const qs = aquizQs(al.id, q.at)
  return Object.entries(w.aquizAns?.[al.id] ?? {}).map(([p, a]) => [
    Number(p),
    qs.filter((k, i) => a[i] === QUIZ_KEY[k]).length,
  ])
}
export const aquizTier = (total: number) => AQUIZ_TIERS.filter(n => total >= n).length

export type AquizAction = { type: 'aquizStart' } | { type: 'aquiz'; pick: number }
export const aquizActions: WorldActions<AquizAction> = {
  aquizStart: {
    pick: () => ({ type: 'aquizStart' }),
    run: ({ w, pid, s }) => {
      const al = allyOf(w, pid)
      if (!al || (al.members[pid] ?? 0) < 1) return no('locked') // đường chủ trở lên
      if (al.quiz && dayOf(al.quiz.at) === dayOf(s.time)) return no('claimed') // mỗi ngày một phiên
      const world = put(w, { ...al, quiz: { at: s.time + AQUIZ_WAIT, by: pid } })
      return { ok: true, world: { ...world, aquizAns: { ...w.aquizAns, [al.id]: {} } }, changed: new Map() }
    },
  },
  aquiz: {
    pick: a => (int(0, 3)(a.pick) ? { type: 'aquiz', pick: a.pick as number } : null),
    run: ({ w, pid, s }, a) => {
      const al = allyOf(w, pid)
      const q = al?.quiz
      const k = q ? aquizK(q, s.time) : -1
      if (!al || !q || q.done || k < 0 || k >= AQUIZ_N) return no('locked')
      const room = w.aquizAns?.[al.id] ?? {}
      const mine = [...(room[pid] ?? [])]
      mine[k] = a.pick
      return {
        ok: true,
        world: { ...w, aquizAns: { ...w.aquizAns, [al.id]: { ...room, [pid]: mine } } },
        changed: new Map(),
      }
    },
  },
}

// Phiên đã hết giờ chưa chấm: chấm điểm minh, người có trả lời nhận thư (quà theo mốc nếu đạt)
export function aquizStep(ps: Players, w: World, now: number): { world: World; changed: Players } {
  let world = w
  const changed: Players = new Map()
  for (const al of Object.values(w.allies)) {
    const q = al.quiz
    if (!q || q.done || aquizK(q, now) < AQUIZ_N) continue
    const scores = aquizScores(world, al)
    const total = scores.reduce((sum, [, n]) => sum + n, 0)
    const tier = aquizTier(total)
    for (const [pid, n] of scores) {
      const s = changed.get(pid) ?? ps.get(pid)
      if (s)
        changed.set(
          pid,
          mail(s, { at: now, k: 'aquiz', a: [n, total, tier], ...(tier && { gift: AQUIZ_PRIZES[tier - 1] }) }),
        )
    }
    const { [al.id]: _gone, ...rest } = world.aquizAns ?? {}
    world = { ...put(world, { ...al, quiz: { ...q, done: true } }), aquizAns: rest }
  }
  return { world, changed }
}
