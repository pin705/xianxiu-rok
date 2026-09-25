// Tu bổ trận cơ (sửa tường của RoK): miễn phí mỗi MEND_COOL, hồi MEND_HP phần trận lực tối đa — cả lúc núi đang cháy (lửa vẫn
// cháy, dập bằng Tức Hỏa Phù ở túi đồ).
import { no, ok, type Actions } from '../core/action.ts'
import type { State } from '../core/types.ts'
import { wallAt, wallHp, wallMax } from '../core/wall.ts'
import { MEND_COOL, MEND_HP } from '../data.ts'

export const mendReady = (s: State, t: number) => (s.wall?.mend ?? -Infinity) + MEND_COOL <= t

export type WallAction = { type: 'mend' }
export const wallActions: Actions<WallAction> = {
  mend: {
    pick: () => ({ type: 'mend' }),
    run: s => {
      const t = s.time,
        max = wallMax(s)
      if (!mendReady(s, t)) return no('cooldown')
      if (wallHp(s, t) >= max) return no('max_level')
      const w = wallAt(s, t)
      return ok({ ...s, wall: { ...w, hp: Math.min(max, w.hp + MEND_HP * max), mend: t } })
    },
  },
}
