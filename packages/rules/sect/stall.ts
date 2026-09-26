// Cát Tường Hạ Giá (Lucky Stall của RoK — doc 5 C21): trong lễ kiểu 'stall', chọn việc được giảm (STALL_JOBS — trước lần ước đầu còn
// đổi được), rồi ước một mức giảm theo trọng số tiers (mầm server; client chờ patch). Lần ước đầu miễn phí, ước lại tốn `cost` Cát
// Tường Tệ. Chi phí sau giảm tính ở core/stall.ts (chỗ trừ tiền xây / lĩnh ngộ / tuyển dùng chung).
import { no, ok, type Actions } from '../core/action.ts'
import { FEST_IDS, festOpen, festTokens } from '../core/fest.ts'
import { int, oneOf } from '../core/parse.ts'
import type { Err, State } from '../core/types.ts'
import { nextSeed } from '../core/util.ts'
import { FESTS, STALL_JOBS, type FestId } from '../data.ts'

// Trạng thái Cát Tường của lượt lễ: [việc, bậc giảm, đã bớt ×3] (−1: chưa chọn / chưa ước)
export const stallSp = (s: State, id: FestId) => s.fest[id]?.sp ?? [-1, -1, 0, 0, 0]
export function stallError(s: State, id: FestId, wish: boolean): Err | null {
  const d = FESTS[id]
  if (d.kind !== 'stall' || !festOpen(s, id, s.time)) return 'locked'
  const [job, tier] = stallSp(s, id)
  if (!wish) return tier >= 0 ? 'claimed' : null // đổi việc: chỉ trước lần ước đầu
  if (job < 0) return 'bad' // chưa chọn việc
  return tier < 0 || festTokens(s, id) >= d.cost ? null : 'not_enough'
}

export type StallAction = { type: 'stallJob'; id: FestId; job: number } | { type: 'stallWish'; id: FestId }
export const stallActions: Actions<StallAction> = {
  stallJob: {
    pick: a =>
      oneOf(FEST_IDS)(a.id) && int(0, STALL_JOBS.length - 1)(a.job)
        ? { type: 'stallJob', id: a.id, job: a.job as number }
        : null,
    run: (s, a) => {
      const e = stallError(s, a.id, false)
      if (e) return no(e)
      const [, tier, ...saved] = stallSp(s, a.id)
      const f = s.fest[a.id]!
      return ok({ ...s, fest: { ...s.fest, [a.id]: { ...f, sp: [a.job, tier, ...saved] } } })
    },
  },
  stallWish: {
    pick: a => (oneOf(FEST_IDS)(a.id) ? { type: 'stallWish', id: a.id } : null),
    run: (s, a) => {
      const e = stallError(s, a.id, true)
      if (e) return no(e)
      const d = FESTS[a.id]
      if (!s.seed || d.kind !== 'stall') return ok(s)
      const [job, tier, ...saved] = stallSp(s, a.id)
      let x = ((s.seed >>> 0) / 2 ** 32) * d.tiers.reduce((t, q) => t + q.w, 0)
      const i = d.tiers.findIndex(q => (x -= q.w) < 0)
      const f = s.fest[a.id]!
      const next = { ...f, sp: [job, i < 0 ? d.tiers.length - 1 : i, ...saved], days: f.days + (tier >= 0 ? 1 : 0) }
      return ok({ ...s, seed: nextSeed(s.seed), fest: { ...s.fest, [a.id]: next } })
    },
  },
}
