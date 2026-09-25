// Thôn Trang Gặp Nạn (Strange Incidents của RoK): trong kỳ lễ thonTrang, mỗi giờ một phần thôn trang bị tà tu đốt — tất định
// theo giờ nên ai cũng thấy như nhau. Ghé thôn đang cháy trong vùng đã khai nhận một việc cứu nạn có hạn giờ; báo công ở
// sect/nan.ts (không cần bản đồ nên đoán trước được).
import { sitesOf, type Atlas } from '../atlas.ts'
import { rng } from '../combat.ts'
import { no } from '../core/action.ts'
import { dayOf } from '../core/calendar.ts'
import { festWindow, metric } from '../core/fest.ts'
import { cellOf, clear, fogOf, fold } from '../core/fog.ts'
import { isId } from '../core/parse.ts'
import type { State } from '../core/types.ts'
import { FESTS, NAN_DAY, NAN_ODDS, NAN_TASKS, NAN_TIME } from '../data.ts'
import type { WorldActions } from './base.ts'

const HOUR = 3_600_000
const roll = (a: Atlas, i: number, t: number) => rng((a.seed * 31 + i * 7919 + Math.floor(t / HOUR) * 104_729) >>> 0)()
// Kỳ lễ đang mở với tông môn này (đủ tầng Chủ điện)
export const nanOpen = (s: State, t: number) =>
  s.levels.chuDien >= (FESTS.thonTrang.hall ?? 1) && !!festWindow(s, FESTS.thonTrang, t)
// Các thôn đang cháy trong giờ của t (không xét kỳ lễ — nơi gọi xét nanOpen)
export const fires = (a: Atlas, t: number) =>
  sitesOf(a)
    .filter(st => st.kind === 'village' && roll(a, st.i, t) < 1 / NAN_ODDS)
    .map(st => st.i)
// Việc cứu nạn của thôn i trong giờ của t
export const nanTask = (a: Atlas, i: number, t: number) =>
  NAN_TASKS[Math.floor(roll(a, i + 100_000, t) * NAN_TASKS.length)]
// Số việc đã nhận hôm nay
export const nanToday = (s: State, t: number) => (s.nan?.day === dayOf(t) ? s.nan.n : 0)

export type RescueAction = { type: 'rescue'; i: number }
export const rescueActions: WorldActions<RescueAction> = {
  rescue: {
    pick: a => (isId(a.i) || a.i === 0 ? { type: 'rescue', i: a.i as number } : null),
    run: ({ w, pid, s, map }, a) => {
      const t = s.time
      const st = map ? sitesOf(map.atlas)[a.i] : undefined
      if (!map || st?.kind !== 'village') return no('bad')
      if (!nanOpen(s, t)) return no('locked')
      const c = cellOf(st)
      if (!clear(fold(fogOf(s), t), c.cx, c.cy, t) || !fires(map.atlas, t).includes(a.i)) return no('gone')
      if (s.nan?.q && s.nan.q.until > t) return no('busy') // mỗi lúc một việc
      const n = nanToday(s, t)
      if (n >= NAN_DAY) return no('limit')
      const task = nanTask(map.atlas, a.i, t)
      const q = { i: a.i, m: task.m, n: task.n, from: metric(s, task.m), until: t + NAN_TIME }
      return { ok: true, world: w, changed: new Map([[pid, { ...s, nan: { day: dayOf(t), n: n + 1, q } }]]) }
    },
  },
}
