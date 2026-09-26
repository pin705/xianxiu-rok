// Hương Hỏa (như VIP của RoK, không bán): điểm theo chuỗi ngày vào game, cấp → tăng ích (stats.bonus), rương mỗi ngày,
// việc còn ít phút thì xong miễn phí.
import { dayOf, weekOf } from './calendar.ts'
import { num, obj } from './parse.ts'
import { vipLevel } from './stats.ts'
import { type State, type Vip } from './types.ts'
import { NEWBIE_FREE, NEWBIE_FREE_HALL, VIP_DAILY, VIP_FREE } from '../data.ts'

export const freshVip = (): Vip => ({ pts: 0, streak: 0, day: -1, chest: -1 })
// Hương Hỏa trong save hợp lệ: điểm, chuỗi, ngày, rương; Hương Hỏa Các (lượt mua trong tuần), Lễ vật tấn cấp đã mua
export const validVip = (v: Vip | undefined) =>
  obj(v) &&
  [v.pts, v.streak, v.day, v.chest].every(num) &&
  (v.shop === undefined ||
    (obj(v.shop) && num(v.shop.week) && obj(v.shop.got) && Object.values(v.shop.got).every(num))) &&
  (v.gifts === undefined || (Array.isArray(v.gifts) && v.gifts.every(num)))
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
export const vipFree = (s: State) =>
  Math.max(VIP_FREE[vipLevel(s)], s.levels.chuDien < NEWBIE_FREE_HALL ? NEWBIE_FREE : 0) * 60_000
// Hương Hỏa Các: số lần đã mua từng món tuần này (thứ Hai làm mới)
export const vipGot = (s: State, t: number) => (s.vip.shop?.week === weekOf(t) ? s.vip.shop.got : {})
