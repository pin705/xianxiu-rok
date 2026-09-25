// Vận Linh Trận (Resource Assistance ở Trading Post của RoK): gửi tài nguyên cho người cùng tiên minh, người nhận nhận qua thư
// (trừ hao tổn). Trần mỗi ngày của cả hai bên nằm ở phần chung (w.sup) — số liệu: SUPPLY_* ở data.ts.
import { no } from '../core/action.ts'
import { dayOf } from '../core/calendar.ts'
import { int, isId, obj } from '../core/parse.ts'
import { storage } from '../core/stats.ts'
import { bag } from '../core/util.ts'
import { RESOURCES, SUPPLY_GET, SUPPLY_HALL, SUPPLY_SEND, supplyTax, type Bag } from '../data.ts'
import { mail } from '../sect/inbox.ts'
import { allyOf, type Players, type Supply, type World, type WorldActions } from './base.ts'

const today = (w: World, pid: number, t: number): Supply =>
  w.sup?.[pid]?.day === dayOf(t) ? w.sup[pid] : { day: dayOf(t), sent: 0, got: 0 }
export const bagSum = (b: Bag) => RESOURCES.reduce((n, r) => n + b[r], 0)
export const afterTax = (b: Bag, tax: number) => bag(r => Math.floor(b[r] * (1 - tax)))

// Hôm nay pid còn gửi được (tổng ba loại, trước hao tổn), người nhận còn nhận được (sau hao tổn); null: không gửi cho người đó
export type SupplyRoom = { tax: number; send: number; get: number }
export function supplyRoom(w: World, ps: Players, pid: number, to: number, t: number): SupplyRoom | null {
  const s = ps.get(pid),
    r = ps.get(to)
  if (!s || !r || pid === to || allyOf(w, pid)?.members[to] === undefined) return null
  return {
    tax: supplyTax(s.levels.tangBaoCac),
    send: Math.max(0, Math.floor(SUPPLY_SEND * storage(s)) - today(w, pid, t).sent),
    get: Math.max(0, Math.floor(SUPPLY_GET * storage(r)) - today(w, to, t).got),
  }
}

export type SupplyAction = { type: 'supply'; to: number; res: Bag }
export const supplyActions: WorldActions<SupplyAction> = {
  supply: {
    pick: a => {
      const raw = a.res
      if (!isId(a.to) || !obj(raw)) return null
      const res = bag(r => raw[r] ?? 0)
      return RESOURCES.every(r => int(0, 1e12)(res[r])) && bagSum(res) > 0 ? { type: 'supply', to: a.to, res } : null
    },
    run: ({ w, ps, pid, s }, a) => {
      const room = supplyRoom(w, ps, pid, a.to, s.time)
      if (s.levels.chuDien < SUPPLY_HALL || !room) return no('locked')
      if (RESOURCES.some(r => s.res[r] < a.res[r])) return no('not_enough')
      const got = afterTax(a.res, room.tax)
      if (bagSum(a.res) > room.send || bagSum(got) > room.get) return no('limit')
      const mine = today(w, pid, s.time),
        theirs = today(w, a.to, s.time)
      return {
        ok: true,
        changed: new Map([
          [pid, { ...s, res: bag(r => s.res[r] - a.res[r]) }],
          [a.to, mail(ps.get(a.to)!, { at: s.time, k: 'supply', a: [s.name], gift: { res: got } })],
        ]),
        world: {
          ...w,
          sup: {
            ...w.sup,
            [pid]: { ...mine, sent: mine.sent + bagSum(a.res) },
            [a.to]: { ...theirs, got: theirs.got + bagSum(got) },
          },
        },
      }
    },
  },
}
