// Chinh Chiến Công Tích: nhận quà các mốc Công Huân trong mùa, lần lượt từng mốc (điểm và mốc về 0 khi hết mùa — world/season.ts)
import { no, ok, type Actions } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import { int } from '../core/parse.ts'
import type { State } from '../core/types.ts'
import { COIN_PER, COIN_SHOP, HONOR_TIERS } from '../data.ts'

// Phi Thăng Tệ đang có: mỗi COIN_PER Công Huân kiếm được cả đời một đồng, trừ phần đã tiêu
export const coins = (s: State) => Math.floor((s.honorAll ?? 0) / COIN_PER) - (s.coinSpent ?? 0)

export type HonorAction = { type: 'honorClaim' } | { type: 'coinBuy'; i: number } // coinBuy: đổi món i ở Thiên Môn Thương Điếm
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
  coinBuy: {
    pick: a => (int(0, COIN_SHOP.length - 1)(a.i) ? { type: 'coinBuy', i: a.i as number } : null),
    run: (s, a) => {
      const it = COIN_SHOP[a.i]
      if (coins(s) < it.price) return no('not_enough')
      return ok(grant({ ...s, coinSpent: (s.coinSpent ?? 0) + it.price }, it.reward))
    },
  },
}
