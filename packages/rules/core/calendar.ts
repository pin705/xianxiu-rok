// Lịch: ngày / tuần giờ VN, nhiệm vụ ngày / tuần, sự kiện tuần, cuối tuần.
import { type Daily, type Ev, type State, type Weekly } from './types.ts'
import { DAY } from './util.ts'
import {
  DAILY,
  DAILY_HALL,
  DAILY_RES,
  DAY_OFFSET,
  EVENT_GOALS,
  EVENT_PTS,
  EVENTS,
  WEEKEND,
  WEEKLY,
  WEEKLY_RES,
  type DailyId,
  type EventId,
} from '../data.ts'

export const dayOf = (t: number) => Math.floor((t + DAY_OFFSET) / DAY)
export const nextDay = (t: number) => (dayOf(t) + 1) * DAY - DAY_OFFSET // lúc làm mới kế tiếp
export const freshDaily = (t: number): Daily => ({
  day: dayOf(t),
  n: { build: 0, train: 0, win: 0, brew: 0 },
  got: DAILY.map(() => false),
  bonus: false,
})
// Tuần bắt đầu 0h thứ Hai giờ VN (ngày 4 kể từ 1/1/1970 — thứ Năm — là thứ Hai 5/1/1970)
export const weekOf = (t: number) => Math.floor((dayOf(t) - 4) / 7)
export const nextWeek = (t: number) => ((weekOf(t) + 1) * 7 + 4) * DAY - DAY_OFFSET
export const freshWeekly = (t: number): Weekly => ({
  week: weekOf(t),
  n: { build: 0, train: 0, win: 0, brew: 0, days: 0 },
  got: WEEKLY.map(() => false),
  bonus: false,
})
export const freshEv = (t: number): Ev => ({ week: weekOf(t), pts: 0, got: EVENT_GOALS.map(() => false) })
export const eventOf = (week: number): EventId => EVENTS[((week % EVENTS.length) + EVENTS.length) % EVENTS.length]
export const rollDay = (s: State, t: number): State => {
  if (dayOf(t) > s.daily.day) s = { ...s, daily: freshDaily(t) }
  if (weekOf(t) > s.ev.week) s = { ...s, ev: freshEv(t) }
  return weekOf(t) > s.weekly.week ? { ...s, weekly: freshWeekly(t) } : s
}
// Điểm sự kiện tuần khi làm đúng việc của chủ đề tuần này (tuyển: mỗi 5 đệ tử một lần)
export const evBump = (s: State, id: EventId, k = 1): State =>
  eventOf(s.ev.week) !== id
    ? s
    : { ...s, ev: { ...s.ev, pts: s.ev.pts + EVENT_PTS[id] * (id === 'train' ? Math.floor(k / 5) : k) } }
export const bump = (s: State, id: DailyId, k = 1): State =>
  evBump(
    {
      ...s,
      daily: { ...s.daily, n: { ...s.daily.n, [id]: s.daily.n[id] + k } },
      weekly: { ...s.weekly, n: { ...s.weekly.n, [id]: s.weekly.n[id] + k } },
    },
    id,
    k,
  )
export const dailyDone = (s: State, i: number) => s.daily.n[DAILY[i].id] >= DAILY[i].n
export const dailyReward = (s: State) => DAILY_RES * s.levels.chuDien
// Sự kiện cuối tuần: thứ Bảy, Chủ nhật giờ VN (ngày 0 kể từ 1/1/1970 là thứ Năm)
export const isWeekend = (t: number) => [2, 3].includes(((dayOf(t) % 7) + 7) % 7)
export const eventMul = (t: number) => (isWeekend(t) ? WEEKEND : 1)
export const weeklyDone = (s: State, i: number) => s.weekly.n[WEEKLY[i].id] >= WEEKLY[i].n
export const weeklyReward = (s: State) => WEEKLY_RES * s.levels.chuDien
// số phần thưởng đang chờ nhận (ngày + tuần) — huy hiệu trên nút nhiệm vụ
export const dailyReady = (s: State) =>
  s.levels.chuDien < DAILY_HALL
    ? 0
    : DAILY.filter((_, i) => dailyDone(s, i) && !s.daily.got[i]).length +
      (s.daily.got.every(Boolean) && !s.daily.bonus ? 1 : 0) +
      WEEKLY.filter((_, i) => weeklyDone(s, i) && !s.weekly.got[i]).length +
      (s.weekly.got.every(Boolean) && !s.weekly.bonus ? 1 : 0)
