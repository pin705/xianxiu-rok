// Vào game (điểm danh Hương Hỏa, ngày đăng nhập của sự kiện), rương Hương Hỏa mỗi ngày, xong ngay miễn phí việc sắp xong.
import { no, ok, type Actions } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import { dayOf, weekOf } from '../core/calendar.ts'
import { festLogin } from '../core/fest.ts'
import { JOB_KINDS, oneOf } from '../core/parse.ts'
import { vipLevel } from '../core/stats.ts'
import { advance, jobOf, shorten } from '../core/time.ts'
import { type JobKind } from '../core/types.ts'
import { vipFree, vipGot, vipLogin } from '../core/vip.ts'
import { VIP_CHEST, VIP_SHOP } from '../data.ts'

export type VipAction =
  | { type: 'login' }
  | { type: 'vipChest' }
  | { type: 'vipBuy'; item: string } // mua ở Hương Hỏa Các
  | { type: 'finish'; job: JobKind }

export const vipActions: Actions<VipAction> = {
  // client gửi mỗi lần vào game; gửi lại trong ngày không đổi gì
  login: {
    pick: () => ({ type: 'login' }),
    run: s => ok(festLogin(vipLogin(s, s.time), s.time)),
  },
  vipChest: {
    pick: () => ({ type: 'vipChest' }),
    run: s => {
      const day = dayOf(s.time)
      if (s.vip.chest === day) return no('claimed')
      return ok({ ...grant(s, VIP_CHEST[vipLevel(s)]), vip: { ...s.vip, chest: day } })
    },
  },
  vipBuy: {
    pick: a => (oneOf(VIP_SHOP.map(x => x.item))(a.item) ? { type: 'vipBuy', item: a.item } : null),
    run: (s, a) => {
      const x = VIP_SHOP.find(y => y.item === a.item)!
      if (vipLevel(s) < x.lv) return no('locked')
      const got = vipGot(s, s.time)
      if ((got[x.item] ?? 0) >= x.week) return no('claimed')
      const cost = x.price * s.levels.chuDien
      if (s.res[x.res] < cost) return no('not_enough')
      return ok({
        ...s,
        res: { ...s.res, [x.res]: s.res[x.res] - cost },
        items: { ...s.items, [x.item]: (s.items[x.item] ?? 0) + x.n },
        vip: { ...s.vip, shop: { week: weekOf(s.time), got: { ...got, [x.item]: (got[x.item] ?? 0) + 1 } } },
      })
    },
  },
  // luyện đan không rút ngắn được (như phù và đan tăng tốc)
  finish: {
    pick: a => (oneOf(JOB_KINDS)(a.job) && a.job !== 'brew' ? { type: 'finish', job: a.job } : null),
    run: (s, a) => {
      const j = jobOf(s, a.job)
      if (!j) return no('empty')
      if (j.finishAt - s.time > vipFree(s)) return no('not_done')
      return ok(advance(shorten(s, a.job, j.finishAt - s.time), s.time))
    },
  },
}
