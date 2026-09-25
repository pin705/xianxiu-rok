// Tụ Bảo Minh Đỉnh (rương liên minh ngày lễ của RoK): mỗi tuần người trong minh góp tài nguyên vào đỉnh hương; mỗi lần đỉnh đầy
// (POT_FULL điểm) thì ai đã góp từ POT_MIN điểm tuần này mở được một rương (tối đa POT_MAX) — người góp nhiều nuôi cả minh.
import { no } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import { weekOf } from '../core/calendar.ts'
import { obj } from '../core/parse.ts'
import { bag } from '../core/util.ts'
import { POT_CHEST, POT_FULL, POT_MAX, POT_MIN, POT_RATE, RESOURCES, type Bag } from '../data.ts'
import { allyOf, type Alliance, type Pot, type WorldActions } from './base.ts'

// Đỉnh của tuần có t (tuần mới: đỉnh trống)
export const potOf = (al: Alliance, t: number): Pot =>
  al.pot?.week === weekOf(t) ? al.pot : { week: weekOf(t), pts: 0, by: {}, opened: {} }
// Số rương pid còn mở được
export function potChests(al: Alliance, pid: number, t: number) {
  const p = potOf(al, t)
  if ((p.by[pid] ?? 0) < POT_MIN) return 0
  return Math.max(0, Math.min(POT_MAX, Math.floor(p.pts / POT_FULL)) - (p.opened[pid] ?? 0))
}

export type PotAction = { type: 'potGive'; res: Partial<Bag> } | { type: 'potOpen' }
export const potActions: WorldActions<PotAction> = {
  potGive: {
    pick: a => {
      if (!obj(a.res)) return null
      const res = Object.fromEntries(RESOURCES.map(r => [r, (a.res as Record<string, unknown>)[r] ?? 0]))
      const ns = Object.values(res)
      return ns.every(n => Number.isInteger(n) && (n as number) >= 0) && ns.some(n => (n as number) >= POT_RATE)
        ? { type: 'potGive', res: res as Partial<Bag> }
        : null
    },
    run: ({ w, pid, s }, a) => {
      const al = allyOf(w, pid)
      if (!al) return no('locked')
      if (RESOURCES.some(r => s.res[r] < (a.res[r] ?? 0))) return no('not_enough')
      const pts = Math.floor(RESOURCES.reduce((n, r) => n + (a.res[r] ?? 0), 0) / POT_RATE)
      const p = potOf(al, s.time)
      const pot = { ...p, pts: p.pts + pts, by: { ...p.by, [pid]: (p.by[pid] ?? 0) + pts } }
      return {
        ok: true,
        world: { ...w, allies: { ...w.allies, [al.id]: { ...al, pot } } },
        changed: new Map([[pid, { ...s, res: bag(r => s.res[r] - (a.res[r] ?? 0)) }]]),
      }
    },
  },
  potOpen: {
    pick: () => ({ type: 'potOpen' }),
    run: ({ w, pid, s }) => {
      const al = allyOf(w, pid)
      if (!al) return no('locked')
      if (!potChests(al, pid, s.time)) return no('not_done')
      const week = weekOf(s.time)
      const had = s.potOpened?.week === week ? s.potOpened.n : 0
      if (had >= POT_MAX) return no('limit') // đã mở đủ tuần này (kể cả ở minh khác)
      const p = potOf(al, s.time)
      const pot = { ...p, opened: { ...p.opened, [pid]: (p.opened[pid] ?? 0) + 1 } }
      return {
        ok: true,
        world: { ...w, allies: { ...w.allies, [al.id]: { ...al, pot } } },
        changed: new Map([[pid, grant({ ...s, potOpened: { week, n: had + 1 } }, POT_CHEST)]]),
      }
    },
  },
}
