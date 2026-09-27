// Linh Tinh Trận Pháp (Crystal Tech của RoK) + Ẩn Sĩ Động Phủ (Bastions): hai lớp tiến trình chỉ có trong mùa giới, tan khi hết mùa
// (world/season.ts). Linh tinh = Công Huân mùa × CTECH_PER − phần đã tiêu; việc vặt của ẩn sĩ tính theo chỉ số (core/fest.ts metric)
import { no, ok, type Actions } from '../core/action.ts'
import { dayOf } from '../core/calendar.ts'
import { metric } from '../core/fest.ts'
import { int, oneOf } from '../core/parse.ts'
import type { State } from '../core/types.ts'
import {
  CTECH,
  CTECH_MAX,
  CTECH_NEED,
  CTECH_PER,
  HERMIT_DAILY,
  HERMIT_HALL,
  HERMIT_IDS,
  HERMIT_TASKS,
  type HermitId,
} from '../data.ts'

export const crystals = (s: State) => Math.floor((s.honor ?? 0) * CTECH_PER) + (s.ctechGot ?? 0) - (s.ctechSpent ?? 0)
export const ctechLv = (s: State, i: number) => s.ctech?.[i] ?? 0
export const ctechCost = (i: number, lv: number) => CTECH[i].cost * (lv + 1) // tầng lv → lv + 1
// Trận trước cùng nhánh (trận đầu nhánh: không cần)
export const ctechPrev = (i: number) => (i > 0 && CTECH[i - 1].branch === CTECH[i].branch ? i - 1 : -1)
export function ctechError(s: State, i: number) {
  if (s.seasonAt === undefined) return 'locked' // chỉ trong mùa giới
  const p = ctechPrev(i)
  if (p >= 0 && ctechLv(s, p) < CTECH_NEED) return 'locked'
  const lv = ctechLv(s, i)
  if (lv >= CTECH_MAX) return 'max_level'
  return crystals(s) < ctechCost(i, lv) ? 'not_enough' : null
}

const hermitOf = (s: State) => {
  const h = s.hermit ?? { day: 0, n: 0, fav: {}, jobs: {} }
  return h.day === dayOf(s.time) ? h : { ...h, day: dayOf(s.time), n: 0 }
}
// Việc ẩn sĩ h đang nhờ: xoay vòng theo ngày, thứ tự ẩn sĩ và số việc đã xong
export const hermitTask = (s: State, h: HermitId) =>
  (dayOf(s.time) + HERMIT_IDS.indexOf(h) + (s.hermit?.fav[h] ?? 0)) % HERMIT_TASKS.length
export const hermitDone = (s: State, h: HermitId) => {
  const j = s.hermit?.jobs[h]
  return j ? Math.max(0, metric(s, HERMIT_TASKS[j.t].m) - j.base) : 0
}
export const hermitLeft = (s: State) => HERMIT_DAILY - hermitOf(s).n

export type CrystalAction =
  { type: 'ctech'; i: number } | { type: 'hermitTake'; h: HermitId } | { type: 'hermitHand'; h: HermitId }
export const crystalActions: Actions<CrystalAction> = {
  ctech: {
    pick: a => (int(0, CTECH.length - 1)(a.i) ? { type: 'ctech', i: a.i as number } : null),
    run: (s, a) => {
      const e = ctechError(s, a.i)
      if (e) return no(e)
      const lv = ctechLv(s, a.i)
      const ctech = CTECH.map((_, k) => ctechLv(s, k) + (k === a.i ? 1 : 0))
      return ok({ ...s, ctech, ctechSpent: (s.ctechSpent ?? 0) + ctechCost(a.i, lv) })
    },
  },
  hermitTake: {
    pick: a => (oneOf(HERMIT_IDS)(a.h) ? { type: 'hermitTake', h: a.h as HermitId } : null),
    run: (s, a) => {
      if (s.seasonAt === undefined || s.levels.chuDien < HERMIT_HALL) return no('locked')
      const h = hermitOf(s)
      if (h.jobs[a.h]) return no('claimed')
      const t = hermitTask(s, a.h)
      return ok({ ...s, hermit: { ...h, jobs: { ...h.jobs, [a.h]: { t, base: metric(s, HERMIT_TASKS[t].m) } } } })
    },
  },
  hermitHand: {
    pick: a => (oneOf(HERMIT_IDS)(a.h) ? { type: 'hermitHand', h: a.h as HermitId } : null),
    run: (s, a) => {
      const h = hermitOf(s)
      const j = h.jobs[a.h]
      if (!j) return no('empty')
      if (hermitDone(s, a.h) < HERMIT_TASKS[j.t].n) return no('not_done')
      if (h.n >= HERMIT_DAILY) return no('limit')
      const { [a.h]: _, ...jobs } = h.jobs
      return ok({ ...s, hermit: { ...h, n: h.n + 1, fav: { ...h.fav, [a.h]: (h.fav[a.h] ?? 0) + 1 }, jobs } })
    },
  },
}
