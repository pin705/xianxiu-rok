// Thương nhân vân du (Mysterious Merchant của RoK): mỗi 8 giờ một lượt hàng mới ở Thương hội, mua bằng tài nguyên — chỗ tiêu
// tài nguyên dư. Hàng tất định theo tông môn (lúc lập) và lượt: client vẽ đúng, server kiểm lại.
import { rng } from '../combat.ts'
import { no, ok, type Actions } from '../core/action.ts'
import { int } from '../core/parse.ts'
import type { State } from '../core/types.ts'
import { MERCHANT_EVERY, MERCHANT_HALL, MERCHANT_POOL, MERCHANT_SLOTS } from '../data.ts'

export const merchantSlot = (t: number) => Math.floor(t / MERCHANT_EVERY)
// Hàng của lượt lúc t: MERCHANT_SLOTS món khác nhau rút theo trọng số, giá nhân tầng Chủ điện
export function merchantStock(s: State, t: number) {
  const rand = rng(((s.born ?? 0) % 2_147_483_647) ^ (merchantSlot(t) * 2_654_435_761))
  const pool = [...MERCHANT_POOL]
  const out: (typeof MERCHANT_POOL)[number][] = []
  while (out.length < MERCHANT_SLOTS && pool.length) {
    let r = rand() * pool.reduce((sum, x) => sum + x.w, 0)
    const k = pool.findIndex(x => (r -= x.w) < 0)
    out.push(...pool.splice(k < 0 ? pool.length - 1 : k, 1))
  }
  return out.map(x => ({ ...x, cost: x.price * s.levels.chuDien }))
}
export const merchantBought = (s: State, t: number) => (s.merchant?.slot === merchantSlot(t) ? s.merchant.bought : [])

export type MerchantAction = { type: 'buy'; i: number }

export const merchantActions: Actions<MerchantAction> = {
  buy: {
    pick: a => (int(0, MERCHANT_SLOTS - 1)(a.i) ? { type: 'buy', i: a.i } : null),
    run: (s, a) => {
      if (s.levels.tangBaoCac < MERCHANT_HALL) return no('locked')
      const t = s.time
      const x = merchantStock(s, t)[a.i]
      const bought = merchantBought(s, t)
      if (!x || bought.includes(a.i)) return no('claimed')
      if (s.res[x.res] < x.cost) return no('not_enough')
      return ok({
        ...s,
        res: { ...s.res, [x.res]: s.res[x.res] - x.cost },
        items: { ...s.items, [x.item]: (s.items[x.item] ?? 0) + x.n },
        merchant: { slot: merchantSlot(t), bought: [...bought, a.i] },
        stats: { ...s.stats, bought: (s.stats.bought ?? 0) + 1 },
      })
    },
  },
}
