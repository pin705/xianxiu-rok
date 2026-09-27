// Pháp bảo: luyện ở Luyện Khí Phòng, đeo cho trưởng lão.
import { no, ok, pay, use, type Actions } from '../core/action.ts'
import { evBump } from '../core/calendar.ts'
import { isElder, oneOf } from '../core/parse.ts'
import { gearCap, gearCost, gearTime, isMarching } from '../core/stats.ts'
import { type Err, type State } from '../core/types.ts'
import { afford, GEAR_IDS } from '../core/util.ts'
import { AWAKEN_COST, AWAKEN_MAX, GEAR, GEAR_MAX, type ElderId, type GearId } from '../data.ts'

export function forgeError(s: State, g: GearId): Err | null {
  if (!s.levels.luyenKhiPhong) return 'locked'
  const level = (s.gear[g]?.lv ?? 0) + 1
  if (level > GEAR_MAX) return 'max_level'
  if (level > gearCap(s)) return 'locked'
  if (s.forge) return 'busy'
  return afford(s.res, gearCost(g, level)) ? null : 'not_enough'
}

// Khai linh pháp bảo g lên tầng kế: cần cấp ≥ 2 × tầng kế và đủ Khí Linh Tinh
export function awakenError(s: State, g: GearId): Err | null {
  const x = s.gear[g],
    aw = x?.aw ?? 0
  if (aw >= AWAKEN_MAX) return 'max_level'
  if ((x?.lv ?? 0) < 2 * (aw + 1)) return 'locked'
  return (s.items.khiTinh ?? 0) >= AWAKEN_COST[aw] ? null : 'no_item'
}

export type ForgeAction =
  | { type: 'forge'; gear: GearId }
  | { type: 'equip'; gear: GearId; elder: ElderId | null } // null: tháo ra
  | { type: 'awaken'; gear: GearId }

// tháo ra, giữ cấp và tầng khai linh
const off = (x: NonNullable<State['gear'][GearId]>) => {
  const { on: _, ...rest } = x
  return rest
}

export const forgeActions: Actions<ForgeAction> = {
  awaken: {
    pick: a => (oneOf(GEAR_IDS)(a.gear) ? { type: 'awaken', gear: a.gear } : null),
    run: (s, a) => {
      const e = awakenError(s, a.gear)
      if (e) return no(e)
      const x = s.gear[a.gear]!,
        aw = x.aw ?? 0
      return ok({
        ...s,
        items: use(s, 'khiTinh', AWAKEN_COST[aw]),
        gear: { ...s.gear, [a.gear]: { ...x, aw: aw + 1 } },
      })
    },
  },
  forge: {
    pick: a => (oneOf(GEAR_IDS)(a.gear) ? { type: 'forge', gear: a.gear } : null),
    run: (s, a) => {
      const e = forgeError(s, a.gear)
      if (e) return no(e)
      const level = (s.gear[a.gear]?.lv ?? 0) + 1
      const forge = { gear: a.gear, level, startAt: s.time, finishAt: s.time + gearTime(s, a.gear, level) }
      return ok(evBump({ ...s, res: pay(s, gearCost(a.gear, level)), forge }, 'forge'))
    },
  },
  equip: {
    pick: a =>
      oneOf(GEAR_IDS)(a.gear) && (a.elder === null || isElder(a.elder))
        ? { type: 'equip', gear: a.gear, elder: a.elder }
        : null,
    run: (s, a) => {
      const g = s.gear[a.gear]
      if (!g?.lv || (a.elder && s.elders[a.elder] === undefined)) return no('locked')
      if (isMarching(s, g.on) || isMarching(s, a.elder)) return no('busy')
      // mỗi ô một món: món cùng ô người nhận đang đeo được tháo ra
      const gear = { ...s.gear }
      for (const id of GEAR_IDS)
        if (a.elder && gear[id]?.on === a.elder && GEAR[id].slot === GEAR[a.gear].slot) gear[id] = off(gear[id]!)
      gear[a.gear] = a.elder ? { ...off(g), on: a.elder } : off(g)
      return ok({ ...s, gear })
    },
  },
}
