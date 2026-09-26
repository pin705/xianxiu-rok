// Công trình: nâng tầng, tăng tốc việc đang chờ bằng đan, đổi tài nguyên ở Tàng Bảo Các.
import { no, ok, pay, use, type Actions } from '../core/action.ts'
import { bump } from '../core/calendar.ts'
import { int, JOB_KINDS, oneOf } from '../core/parse.ts'
import { buildTime, cost, storage, tradeKeep } from '../core/stats.ts'
import { advance, jobOf, shorten } from '../core/time.ts'
import { type Err, type JobKind, type State } from '../core/types.ts'
import { afford, IDS } from '../core/util.ts'
import {
  BUILDINGS,
  MAX_LEVEL,
  QUEUE_SIZE,
  RESOURCES,
  SPEEDUP,
  SPEEDUP_BIG,
  TRIBS,
  type BuildingId,
  type Res,
} from '../data.ts'

// Số việc xây cùng lúc: một tạp dịch, thêm một khi đang thuê tạp dịch thứ hai (việc đang xây dở vẫn xong khi hết thuê)
export const queueSize = (s: State) => QUEUE_SIZE + ((s.builder2 ?? 0) > s.time ? 1 : 0)
export function upgradeError(s: State, b: BuildingId): Err | null {
  const level = s.levels[b] + 1
  if (level > MAX_LEVEL) return 'max_level'
  if (b === 'chuDien' && TRIBS.some(t => t.hall === s.levels.chuDien)) return 'trib'
  if (b !== 'chuDien' && s.levels.chuDien < Math.max(level, BUILDINGS[b].unlock)) return 'need_main_hall'
  if (s.queue.some(j => j.building === b)) return 'busy'
  if (s.queue.length >= queueSize(s)) return 'queue_full'
  return afford(s.res, cost(b, level)) ? null : 'not_enough'
}

export type BuildingAction =
  | { type: 'upgrade'; building: BuildingId }
  | { type: 'collect'; res?: Res } // chạm bong bóng: thu sản lượng một loại (không nói: cả ba)
  | { type: 'speed'; job: JobKind; n: number; pill?: 'daiTuKhi' } // mặc định Tụ Khí Đan
  | { type: 'trade'; from: Res; to: Res; n: number }

export const buildingActions: Actions<BuildingAction> = {
  upgrade: {
    pick: a => (oneOf(IDS)(a.building) ? { type: 'upgrade', building: a.building } : null),
    run: (s, a) => {
      const e = upgradeError(s, a.building)
      if (e) return no(e)
      const level = s.levels[a.building] + 1
      const job = { building: a.building, level, startAt: s.time, finishAt: s.time + buildTime(s, a.building, level) }
      return ok(bump({ ...s, res: pay(s, cost(a.building, level)), queue: [...s.queue, job] }, 'build'))
    },
  },
  // Thu sản lượng nằm ở công trình vào kho, tới sức chứa (phần thừa nằm lại); không có gì thu được thì báo đầy / trống
  collect: {
    pick: a =>
      a.res === undefined || oneOf(RESOURCES)(a.res) ? { type: 'collect', ...(a.res && { res: a.res }) } : null,
    run: (s, a) => {
      if (!s.yard) return no('empty')
      const cap = storage(s)
      const res = { ...s.res },
        yard = { ...s.yard }
      for (const r of a.res ? [a.res] : RESOURCES) {
        const n = Math.floor(Math.min(yard[r], cap - res[r]))
        if (n > 0) [res[r], yard[r]] = [res[r] + n, yard[r] - n]
      }
      if (RESOURCES.every(r => res[r] === s.res[r])) return no(RESOURCES.some(r => s.yard![r] >= 1) ? 'full' : 'empty')
      return ok({ ...s, res, yard })
    },
  },
  speed: {
    pick: a =>
      oneOf(JOB_KINDS)(a.job) && int(1, 1e4)(a.n) && (a.pill === undefined || a.pill === 'daiTuKhi')
        ? { type: 'speed', job: a.job, n: a.n, ...(a.pill && { pill: a.pill }) }
        : null,
    run: (s, a) => {
      if (a.job === 'brew') return no('bad') // đan không rút ngắn việc luyện đan: có giảm thời gian từ công pháp là thành vòng lặp đẻ đan
      const pill = a.pill ?? 'tuKhi'
      if (a.n > (s.items[pill] ?? 0)) return no('no_item')
      if (!jobOf(s, a.job)) return no('empty')
      const ms = (pill === 'daiTuKhi' ? SPEEDUP_BIG : SPEEDUP) * a.n
      const next = shorten(s, a.job, ms)
      const stats = { ...next.stats, sped: (next.stats.sped ?? 0) + ms / 60_000 }
      return ok(advance({ ...next, stats, items: use(s, pill, a.n) }, s.time))
    },
  },
  trade: {
    pick: a =>
      oneOf(RESOURCES)(a.from) && oneOf(RESOURCES)(a.to) && int(1, 1e12)(a.n)
        ? { type: 'trade', from: a.from, to: a.to, n: a.n }
        : null,
    run: (s, a) => {
      if (s.levels.tangBaoCac < 1 || a.from === a.to) return no('locked')
      if (a.n > Math.floor(s.res[a.from])) return no('not_enough')
      const got = Math.floor(a.n * tradeKeep(s))
      return ok({ ...s, res: { ...s.res, [a.from]: s.res[a.from] - a.n, [a.to]: s.res[a.to] + got } })
    },
  },
}
