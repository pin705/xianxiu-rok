// Chinh Chiến Công Tích: nhận quà các mốc Công Huân trong mùa, lần lượt từng mốc (điểm và mốc về 0 khi hết mùa — world/season.ts);
// Phi Thăng Tệ đổi ở Thiên Môn Thương Điếm và cung phụng di vật ở Anh Linh Điện.
import { no, ok, type Actions } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import { int, isElder } from '../core/parse.ts'
import type { Err, State } from '../core/types.ts'
import { COIN_PER, COIN_SHOP, HONOR_TIERS, RELIC_COST, RELIC_HALL, RELIC_MAX, type ElderId } from '../data.ts'

// Phi Thăng Tệ đang có: mỗi COIN_PER Công Huân kiếm được cả đời một đồng, trừ phần đã tiêu
export const coins = (s: State) => Math.floor((s.honorAll ?? 0) / COIN_PER) - (s.coinSpent ?? 0)

// Anh Linh Điện: cung phụng (lên một bậc) di vật cho trưởng lão e — trong giới, đủ tầng, đã thu nhận, chưa tối đa bậc, không quá
// RELIC_MAX trưởng lão mỗi mùa, đủ Phi Thăng Tệ
export function relicError(s: State, e: ElderId): Err | null {
  if (!s.seat || s.levels.chuDien < RELIC_HALL || s.elders[e] === undefined) return 'locked'
  const lv = s.relics?.[e] ?? 0
  if (lv >= RELIC_COST.length) return 'max_level'
  if (!lv && Object.keys(s.relics ?? {}).length >= RELIC_MAX) return 'limit'
  return coins(s) >= RELIC_COST[lv] ? null : 'not_enough'
}

export type HonorAction =
  | { type: 'honorClaim' }
  | { type: 'coinBuy'; i: number } // coinBuy: đổi món i ở Thiên Môn Thương Điếm
  | { type: 'relic'; elder: ElderId } // Anh Linh Điện: di vật trưởng lão lên một bậc
export const honorActions: Actions<HonorAction> = {
  honorClaim: {
    pick: () => ({ type: 'honorClaim' }),
    run: s => {
      const k = s.honorGot ?? 0
      const tier = HONOR_TIERS[k]
      if (!tier) return no('claimed')
      if ((s.honor ?? 0) < tier.n) return no('locked')
      return ok(grant({ ...s, honorGot: k + 1 }, tier.reward))
    },
  },
  relic: {
    pick: a => (isElder(a.elder) ? { type: 'relic', elder: a.elder } : null),
    run: (s, a) => {
      const e = relicError(s, a.elder)
      if (e) return no(e)
      const lv = s.relics?.[a.elder] ?? 0
      return ok({ ...s, coinSpent: (s.coinSpent ?? 0) + RELIC_COST[lv], relics: { ...s.relics, [a.elder]: lv + 1 } })
    },
  },
  coinBuy: {
    pick: a => (int(0, COIN_SHOP.length - 1)(a.i) ? { type: 'coinBuy', i: a.i as number } : null),
    run: (s, a) => {
      const it = COIN_SHOP[a.i]
      if (coins(s) < it.price) return no('not_enough')
      return ok(grant({ ...s, coinSpent: (s.coinSpent ?? 0) + it.price }, it.reward))
    },
  },
}
