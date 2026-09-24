// Hương Hỏa (như VIP của RoK, không bán): điểm theo chuỗi ngày vào game, cấp → tăng ích (stats.bonus), rương mỗi ngày,
// việc còn ít phút thì xong miễn phí.
import { dayOf } from './calendar.ts'
import { vipLevel } from './stats.ts'
import { type State, type Vip } from './types.ts'
import { VIP_DAILY, VIP_FREE } from '../data.ts'

export const freshVip = (): Vip => ({ pts: 0, streak: 0, day: -1, chest: -1 })
// Vào game hôm nay: nối chuỗi (hôm qua có vào) hay bắt đầu lại, cộng điểm ngày thứ n của chuỗi
export function vipLogin(s: State, t: number): State {
  const day = dayOf(t)
  const v = s.vip
  if (v.day === day) return s
  const streak = v.day === day - 1 ? v.streak + 1 : 1
  return { ...s, vip: { ...v, day, streak, pts: v.pts + VIP_DAILY[Math.min(streak, VIP_DAILY.length) - 1] } }
}
// Điểm hôm nay nhận được (để hiện "mai được +N")
export const vipToday = (streak: number) => VIP_DAILY[Math.min(Math.max(1, streak), VIP_DAILY.length) - 1]
export const vipFree = (s: State) => VIP_FREE[vipLevel(s)] * 60_000
