// Trận pháp (Formations · Armaments của RoK): tăng ích của trận form cho khoá key — gốc của trận + trận khí đang đeo ở trận đó (chỉ số ô
// theo phẩm, các dòng trận văn thường / hiếm / đặc biệt). Không bày trận, hay Chủ điện chưa đủ tầng mở trận đó (sau luân hồi): 0
import { ARM_SLOTS, FORMS, INS, INS_OF, INS_SPECIAL, type Bonus, type FormId } from '../data.ts'
import type { Arm, State } from './types.ts'

export const insOf = (a: Arm, i: number) => (i === INS_SPECIAL ? INS_OF[a.f] : INS[i])
export const armBonus = (a: Arm, key: Bonus) =>
  (ARM_SLOTS[a.slot].key === key ? ARM_SLOTS[a.slot].v[a.q] : 0) +
  a.ins.reduce((n, i) => n + (insOf(a, i).key === key ? insOf(a, i).v : 0), 0)
// Trận khí đang đeo ở 4 ô của trận form (ô trống bỏ qua)
export const armsOn = (s: State, form: FormId) =>
  (s.armOn?.[form] ?? []).flatMap(id => s.arms?.find(a => a.id === id) ?? [])
export const formOpen = (s: State, form: FormId) => s.levels.chuDien >= FORMS[form].hall
export function formBonus(s: State, form: FormId | undefined, key: Bonus) {
  if (!form || !formOpen(s, form)) return 0
  return (FORMS[form].bonus[key] ?? 0) + armsOn(s, form).reduce((n, a) => n + armBonus(a, key), 0)
}
