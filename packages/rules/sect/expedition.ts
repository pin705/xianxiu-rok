// Xuất chinh PvE: hành quân đánh yêu thú / tông môn tà đạo (giải lúc tới nơi), bí cảnh và Thông Thiên Tháp (đánh ngay).
import { no, ok, type Actions } from '../core/action.ts'
import { addGain, admit, armyError, battle, marchTime, targetError } from '../core/battle.ts'
import { int, isElder, pickArmy, pickTarget } from '../core/parse.ts'
import { marchSlots } from '../core/stats.ts'
import { type Army, type March, type Result, type State, type Target } from '../core/types.ts'
import { minus, nextSeed } from '../core/util.ts'
import { REALMS, UNITS, type ElderId } from '../data.ts'

export type ExpeditionAction =
  | { type: 'march'; target: Target; elder: ElderId; army: Army }
  | { type: 'realm'; i: number; elder: ElderId; army: Army }
  | { type: 'tower'; elder: ElderId; army: Army }

// Bí cảnh, tháp: đánh ngay tại chỗ, thương binh về Đan phòng, thưởng trao ngay
function fightNow(s: State, target: Target, elder: ElderId, army: Army): Result {
  const e = targetError(s, target) ?? armyError(s, elder, army)
  if (e) return no(e)
  const r = battle({ ...s, seed: nextSeed(s.seed) }, target, elder, army, s.seed, s.time)
  const { state: st, dead } = admit({ ...r.state, troops: minus(r.state.troops, r.hurt) }, r.hurt)
  const done = addGain(st, elder, r.gain)
  return ok({ ...done, reports: done.reports.map(x => (x.id === r.report ? { ...x, dead } : x)) })
}

export const expeditionActions: Actions<ExpeditionAction> = {
  march: {
    pick: a => {
      const target = pickTarget(a.target),
        army = pickArmy(a.army)
      return target && army && isElder(a.elder) ? { type: 'march', target, elder: a.elder, army } : null
    },
    run: (s, a) => {
      const e = targetError(s, a.target) ?? armyError(s, a.elder, a.army)
      if (e) return no(e)
      if (s.marches.length >= marchSlots(s)) return no('slots')
      const army = Object.fromEntries(UNITS.filter(u => a.army[u]).map(u => [u, a.army[u]])) as Army
      const t = s.time,
        dt = marchTime(s, a.target)
      const m: March = {
        id: s.nextId,
        elder: a.elder,
        army,
        target: { ...a.target },
        seed: s.seed,
        startAt: t,
        arriveAt: t + dt,
        returnAt: t + 2 * dt,
      }
      return ok({
        ...s,
        troops: minus(s.troops, army),
        marches: [...s.marches, m],
        nextId: s.nextId + 1,
        seed: nextSeed(s.seed),
      })
    },
  },
  realm: {
    pick: a => {
      const army = pickArmy(a.army)
      return army && isElder(a.elder) && int(0, REALMS.length - 1)(a.i)
        ? { type: 'realm', i: a.i, elder: a.elder, army }
        : null
    },
    run: (s, a) => fightNow(s, { kind: 'realm', i: a.i }, a.elder, a.army),
  },
  tower: {
    pick: a => {
      const army = pickArmy(a.army)
      return army && isElder(a.elder) ? { type: 'tower', elder: a.elder, army } : null
    },
    run: (s, a) => fightNow(s, { kind: 'tower', i: 0 }, a.elder, a.army),
  },
}
