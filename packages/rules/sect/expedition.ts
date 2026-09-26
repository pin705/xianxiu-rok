// Xuất chinh PvE: hành quân đánh yêu thú / tông môn tà đạo (giải lúc tới nơi), bí cảnh và Thông Thiên Tháp (đánh ngay).
import { no, ok, type Actions } from '../core/action.ts'
import { addGain, admit, armyError, battle, grant, marchTime, targetError, marchError, launch } from '../core/battle.ts'
import { dayOf, weekOf } from '../core/calendar.ts'
import { int, isElder, pickArmy, pickTarget } from '../core/parse.ts'
import { deputyOf } from '../core/stats.ts'
import { type Army, type March, type Result, type State, type Target } from '../core/types.ts'
import { minus, nextSeed, compact } from '../core/util.ts'
import {
  REALMS,
  TOWER_CHEST_COIN,
  TOWER_CHEST_STEP,
  TOWER_COIN,
  TOWER_SHOP,
  TOWER_STARS,
  towerChest,
  type ElderId,
} from '../data.ts'

export type ExpeditionAction =
  | { type: 'march'; target: Target; elder: ElderId; army: Army }
  | { type: 'realm'; i: number; elder: ElderId; army: Army }
  | { type: 'tower'; elder: ElderId; army: Army }
  | { type: 'towerChest' } // Tĩnh tọa ngộ đạo: rương ngày theo tầng tháp
  | { type: 'towerBuy'; i: number } // Trấn Tháp Các: đổi Tháp Lệnh

// Trấn Tháp Các: Tháp Lệnh đang có, số đã mua mỗi món tuần của lúc t, trưởng lão của tuần (món star)
export const towerCoins = (s: State) => s.tower * TOWER_COIN + (s.tshop?.earn ?? 0) - (s.tshop?.spent ?? 0)
export const towerBought = (s: State, t: number) => (s.tshop?.week === weekOf(t) ? s.tshop.n : TOWER_SHOP.map(() => 0))
export const towerStar = (t: number) => TOWER_STARS[weekOf(t) % TOWER_STARS.length]

// Bí cảnh, tháp: đánh ngay tại chỗ, thương binh về Đan phòng, thưởng trao ngay
function fightNow(s: State, target: Target, elder: ElderId, army: Army): Result {
  const e = targetError(s, target) ?? armyError(s, elder, army)
  if (e) return no(e)
  const r = battle({ ...s, seed: nextSeed(s.seed) }, target, elder, army, s.seed, s.time, deputyOf(s, elder))
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
      const e = targetError(s, a.target) ?? marchError(s, a.elder, a.army)
      if (e) return no(e)
      const army = compact(a.army)
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
      return ok({ ...launch(s, army, m), seed: nextSeed(s.seed) })
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
  towerChest: {
    pick: () => ({ type: 'towerChest' }),
    run: s => {
      if (s.tower < 1) return no('locked')
      if (s.towerDay === dayOf(s.time)) return no('claimed')
      const coin = TOWER_CHEST_COIN * (Math.floor(s.tower / TOWER_CHEST_STEP) + 1) // thêm Tháp Lệnh theo phần rương
      const tshop = { earn: 0, spent: 0, week: -1, n: [], ...s.tshop }
      return ok(
        grant({ ...s, towerDay: dayOf(s.time), tshop: { ...tshop, earn: tshop.earn + coin } }, towerChest(s.tower)),
      )
    },
  },
  towerBuy: {
    pick: a => (int(0, TOWER_SHOP.length - 1)(a.i) ? { type: 'towerBuy', i: a.i } : null),
    run: (s, a) => {
      if (s.tower < 1) return no('locked')
      const g = TOWER_SHOP[a.i]
      const n = towerBought(s, s.time)
      if (n[a.i] >= g.week) return no('limit')
      if (towerCoins(s) < g.price) return no('not_enough')
      const r = g.star ? { tokens: { [towerStar(s.time)]: g.star } } : (g.r ?? {})
      const tshop = {
        earn: s.tshop?.earn ?? 0,
        spent: (s.tshop?.spent ?? 0) + g.price,
        week: weekOf(s.time),
        n: TOWER_SHOP.map((_, k) => (n[k] ?? 0) + (k === a.i ? 1 : 0)),
      }
      return ok(grant({ ...s, tshop }, r))
    },
  },
}
