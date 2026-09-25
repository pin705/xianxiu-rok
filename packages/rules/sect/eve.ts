// Khai Giới Trảm Tà: đổi EVE_CHEST_N tàn quyển (rơi khi hạ yêu thú giới trong pha Khai giới) lấy một rương tiếp tế
import { no, ok, type Actions } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import { EVE_CHEST, EVE_CHEST_N } from '../data.ts'

export type EveAction = { type: 'eveChest' }
export const eveActions: Actions<EveAction> = {
  eveChest: {
    pick: () => ({ type: 'eveChest' }),
    run: s =>
      (s.frag ?? 0) < EVE_CHEST_N
        ? no('not_enough')
        : ok(grant({ ...s, frag: (s.frag ?? 0) - EVE_CHEST_N }, EVE_CHEST)),
  },
}
