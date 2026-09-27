// Cơ Quan Khôi Lỗi (Shifting Gears của RoK): trong mùa có luật Khôi Lỗi (cờ 'puppet' của RULES[RULE_PUPPET]) Luyện Khí Phòng chế khôi lỗi
// phá trận — PUPPET_COST mỗi con, giữ tối đa PUPPET_CAP × tầng Luyện Khí Phòng. Đội đi cướp tự mang theo (world/raid.ts)
import { no, ok, pay, type Actions } from '../core/action.ts'
import { int } from '../core/parse.ts'
import { bonus } from '../core/stats.ts'
import type { State } from '../core/types.ts'
import { afford, bag } from '../core/util.ts'
import { PUPPET_CAP, PUPPET_COST } from '../data.ts'

export const puppetOn = (s: State) => bonus(s, 'puppet') > 0
export const puppetCap = (s: State) => PUPPET_CAP * s.levels.luyenKhiPhong

export type PuppetAction = { type: 'puppet'; n: number }
export const puppetActions: Actions<PuppetAction> = {
  puppet: {
    pick: a => (int(1, 500)(a.n) ? { type: 'puppet', n: a.n as number } : null),
    run: (s, a) => {
      if (!puppetOn(s) || s.levels.luyenKhiPhong < 1) return no('locked')
      if ((s.puppet ?? 0) + a.n > puppetCap(s)) return no('full')
      const cost = bag(r => PUPPET_COST[r] * a.n)
      if (!afford(s.res, cost)) return no('not_enough')
      return ok({ ...s, res: pay(s, cost), puppet: (s.puppet ?? 0) + a.n })
    },
  },
}
