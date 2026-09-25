// Vân Du Khách (Visitors của RoK): tán tu ghé núi theo giờ mang quà nhỏ xoay vòng — tất định nên client đoán trước được
import { no, ok, type Actions } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import type { State } from '../core/types.ts'
import { GUEST_EVERY, GUEST_GIFTS, GUEST_HALL } from '../data.ts'

// Lúc khách kế tiếp ghé (chưa từng: một chu kỳ sau khi lập tông môn)
export const guestAt = (s: State) => s.guestAt ?? (s.born ?? 0) + GUEST_EVERY
export const guestGift = (s: State) => GUEST_GIFTS[(s.guests ?? 0) % GUEST_GIFTS.length]

export type GuestAction = { type: 'guest' }
export const guestActions: Actions<GuestAction> = {
  guest: {
    pick: () => ({ type: 'guest' }),
    run: s => {
      if (s.levels.chuDien < GUEST_HALL || s.time < guestAt(s)) return no('cooldown')
      return ok(grant({ ...s, guestAt: s.time + GUEST_EVERY, guests: (s.guests ?? 0) + 1 }, guestGift(s)))
    },
  },
}
