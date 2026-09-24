// Pháp bảo: luyện ở Luyện Khí Phòng, đeo cho trưởng lão.
import { no, ok, pay, type Actions } from '../core/action.ts'
import { evBump } from '../core/calendar.ts'
import { isElder, oneOf } from '../core/parse.ts'
import { gearCap, gearCost, gearTime, isMarching } from '../core/stats.ts'
import { type Err, type State } from '../core/types.ts'
import { afford, GEAR_IDS } from '../core/util.ts'
import { GEAR_MAX, type ElderId, type GearId } from '../data.ts'

export function forgeError(s: State, g: GearId): Err | null {
  if (!s.levels.luyenKhiPhong) return 'locked'
  const level = (s.gear[g]?.lv ?? 0) + 1
  if (level > GEAR_MAX) return 'max_level'
  if (level > gearCap(s)) return 'locked'
  if (s.forge) return 'busy'
  return afford(s.res, gearCost(g, level)) ? null : 'not_enough'
}

export type ForgeAction = { type: 'forge'; gear: GearId } | { type: 'equip'; gear: GearId; elder: ElderId | null } // null: tháo ra

export const forgeActions: Actions<ForgeAction> = {
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
      // mỗi trưởng lão một món: món người nhận đang đeo được tháo ra
      const gear = { ...s.gear }
      for (const id of GEAR_IDS) if (a.elder && gear[id]?.on === a.elder) gear[id] = { lv: gear[id]!.lv }
      gear[a.gear] = a.elder ? { lv: g.lv, on: a.elder } : { lv: g.lv }
      return ok({ ...s, gear })
    },
  },
}
