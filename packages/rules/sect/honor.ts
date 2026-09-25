// Chinh Chiến Công Tích: nhận quà các mốc Công Huân trong mùa, lần lượt từng mốc (điểm và mốc về 0 khi hết mùa — world/season.ts)
import { no, ok, type Actions } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import { HONOR_TIERS } from '../data.ts'

export type HonorAction = { type: 'honorClaim' }
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
}
