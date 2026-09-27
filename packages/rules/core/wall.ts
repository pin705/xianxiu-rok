// Trận lực Hộ Sơn Đại Trận và linh hỏa thiêu sơn (độ bền tường + thành cháy của RoK), tính lười theo thời gian: lưu trận lực lúc
// at; lúc t thì suy ra — đang cháy (tới fire) tụt FIRE_DRAIN phần mỗi phút, hết cháy hồi WALL_REGEN phần mỗi giờ. Chưa từng bị
// đánh (không có wall): đầy. Luật và số ở data.ts (WALL_*, FIRE_*).
import { EYE, FIRE_DRAIN, FIRE_TIME, WALL_HIT, WALL_HP, WALL_REGEN, WALL_VOLLEY, type ElderId } from '../data.ts'
import type { Army, Incoming, State } from './types.ts'
import { count, mainType } from './util.ts'

const MIN = 60_000
const HOUR = 3_600_000
export const wallMax = (s: State) => WALL_HP * (1 + s.levels.hoSonDaiTran)
export const burning = (s: State, t: number) => (s.wall?.fire ?? 0) > t

export function wallHp(s: State, t: number): number {
  const max = wallMax(s),
    w = s.wall
  if (!w) return max
  const end = Math.max(w.at, w.fire) // lửa tắt lúc này (đã tắt trước at: không cháy nữa)
  const burnt = w.hp - (max * FIRE_DRAIN * Math.max(0, Math.min(t, end) - w.at)) / MIN
  if (burnt <= 0 && t <= end) return 0
  return Math.max(0, Math.min(max, Math.max(0, burnt) + (max * WALL_REGEN * Math.max(0, t - end)) / HOUR))
}

// Lúc trận lực về 0 trong lần cháy này (null: không về 0, hoặc chưa tới lúc now) — server dùng để giải "sơn môn thất thủ"
export function wallFallAt(s: State, now: number): number | null {
  const w = s.wall
  if (!w || w.fire <= w.at) return null
  const max = wallMax(s)
  const at = w.at + (w.hp / (max * FIRE_DRAIN)) * MIN
  return at <= Math.min(now, w.fire) ? at : null
}

// Thủ thua lúc t: mất WALL_HIT phần trận lực tối đa, núi cháy lại từ đầu FIRE_TIME
export function wallHit(s: State, t: number, k = 1): State {
  const hp = Math.max(0, wallHp(s, t) - WALL_HIT * wallMax(s) * k)
  return { ...s, wall: { hp, at: t, fire: t + FIRE_TIME, ...(s.wall?.mend !== undefined && { mend: s.wall.mend }) } }
}

// Chốt trận lực lúc t (để đổi một phần: tu bổ, dập lửa)
export const wallAt = (s: State, t: number) => ({
  hp: wallHp(s, t),
  at: t,
  fire: burning(s, t) ? s.wall!.fire : 0,
  ...(s.wall?.mend !== undefined && { mend: s.wall.mend }),
})

// Thiên Nhãn (Tháp canh của RoK): tầng Hộ Sơn Đại Trận càng cao, thẻ báo đội đang kéo tới càng lộ nhiều — trưởng lão dẫn, quân số,
// hệ chính (EYE)
export function eyeOf(s: State, elder: ElderId, army: Army): Pick<Incoming, 'elder' | 'n' | 'main'> {
  const lv = s.levels.hoSonDaiTran
  return {
    ...(lv >= EYE[0] && { elder }),
    ...(lv >= EYE[1] && { n: count(army) }),
    ...(lv >= EYE[2] && { main: mainType(army) }),
  }
}

// Kiếm trận Hộ Sơn (tháp canh bắn kẻ tới đánh): trận lực còn thì chém trước trận chừng ấy phần mỗi nhóm quân bên đánh
export const volleyOf = (s: State, t: number) => (wallHp(s, t) > 0 ? WALL_VOLLEY * s.levels.hoSonDaiTran : 0)
