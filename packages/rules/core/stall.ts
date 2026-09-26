// Cát Tường Hạ Giá (Lucky Stall — lễ kiểu 'stall'): mức giảm đang có cho một loại việc và phần trần còn lại; chỗ trừ tiền xây / lĩnh
// ngộ / tuyển (sect/buildings.ts, research.ts, army.ts) và bảng hiện chi phí ở client đều qua đây. Trạng thái lễ ở fest.sp:
// [việc (STALL_JOBS, −1 chưa chọn), bậc giảm (tiers, −1 chưa ước), đã bớt linh thạch, linh thảo, linh khoáng].
import { FESTS, RESOURCES, STALL_JOBS, type Bag, type FestId } from '../data.ts'
import { FEST_IDS, festOpen } from './fest.ts'
import type { State } from './types.ts'
import { bag } from './util.ts'

export type StallJob = (typeof STALL_JOBS)[number]
// Lễ Cát Tường đang mở đã chọn việc job và đã ước: mã lễ, mức giảm, phần trần còn lại mỗi loại
export function stallOf(s: State, job: StallJob) {
  for (const id of FEST_IDS) {
    const d = FESTS[id]
    const sp = s.fest[id]?.sp
    if (d.kind !== 'stall' || !sp || STALL_JOBS[sp[0]] !== job || !(sp[1] >= 0) || !festOpen(s, id, s.time)) continue
    return { id, cut: d.tiers[sp[1]].cut, left: RESOURCES.map((_, i) => Math.max(0, d.cap - (sp[2 + i] ?? 0))) }
  }
  return null
}
// Chi phí sau giảm (không có lễ: nguyên giá)
export function stallCost(s: State, job: StallJob, full: Bag): Bag {
  const st = stallOf(s, job)
  if (!st) return full
  return bag(r => full[r] - Math.min(Math.floor(full[r] * st.cut), st.left[RESOURCES.indexOf(r)]))
}
// Trả chi phí sau giảm: phần được bớt cộng vào sổ của lễ (tới trần)
export function stallTake(s: State, job: StallJob, full: Bag): { cost: Bag; s: State } {
  const st = stallOf(s, job)
  if (!st) return { cost: full, s }
  const cost = stallCost(s, job, full)
  const f = s.fest[st.id as FestId]!
  const sp = [...f.sp!]
  RESOURCES.forEach((r, i) => (sp[2 + i] = (sp[2 + i] ?? 0) + full[r] - cost[r]))
  return { cost, s: { ...s, fest: { ...s.fest, [st.id]: { ...f, sp } } } }
}
