// Do thám (Scout của RoK): thả một linh điểu tới tông môn khác — tốn linh thạch theo tầng Chủ điện bên kia, linh điểu bận tới khi
// bay về; báo cáo tức thì qua thư (tài nguyên ước cướp được, quân giữ nhà, viện binh, trấn thủ, trận lực, khiên). Bên kia nhận thư
// "bị do thám" — biết có người đang nhắm mình để bật khiên, kéo viện binh. Do thám linh địa (spySpot): linh mạch / trận nhãn / Thiên
// Môn phe khác đang giữ — số đội đóng, tổng đệ tử, lực chiến (bảng điểm chỉ ghi số đội).
import { might } from '../combat.ts'
import { no } from '../core/action.ts'
import { cellOf, cranes, cranesOut, fogOf, fold } from '../core/fog.ts'
import { int, isId } from '../core/parse.ts'
import { elderLevel, storage } from '../core/stats.ts'
import { count } from '../core/util.ts'
import type { State } from '../core/types.ts'
import { wallHp, wallMax } from '../core/wall.ts'
import { CRANE_TIME, PROTECT, PVP_HALL, RAID_SHARE, RESOURCES, SPY_COST } from '../data.ts'
import { mail } from '../sect/inbox.ts'
import { aidAt, garrison, guardMight, napBetween, sideKey, sideName, type WorldActions } from './base.ts'
import { defense, guardOf } from './fight.ts'
import { spotOf, troopsOf } from './points.ts'

// Tài nguyên ước cướp được (chưa tính chiến lợi phẩm của người dẫn và sức mang)
const lootable = (d: State) => RESOURCES.map(r => Math.floor(Math.max(0, d.res[r] - PROTECT * storage(d)) * RAID_SHARE))

export type SpyAction = { type: 'spy'; pid: number } | { type: 'spySpot'; i: number }
export const spyActions: WorldActions<SpyAction> = {
  spy: {
    pick: a => (isId(a.pid) ? { type: 'spy', pid: a.pid } : null),
    run: ({ ps, w, pid, s }, a) => {
      const d = ps.get(a.pid)
      const t = s.time
      if (!d?.seat || !s.seat || a.pid === pid) return no('gone')
      if (s.levels.chuDien < PVP_HALL || d.levels.chuDien < PVP_HALL) return no('locked')
      if (sideKey(w, pid) === sideKey(w, a.pid) || napBetween(w, pid, a.pid)) return no('friend')
      const f = fold(fogOf(s), t)
      if (cranesOut(f, t) >= cranes(s)) return no('busy')
      const cost = SPY_COST * d.levels.chuDien
      if (s.res.linhThach < cost) return no('not_enough')
      const [a0, b0] = [cellOf(s.seat), cellOf(d.seat)]
      const trip = CRANE_TIME * Math.max(1, Math.abs(a0.cx - b0.cx), Math.abs(a0.cy - b0.cy))
      const g = guardOf(d)
      const [thach, thao, khoang] = lootable(d)
      const paid = {
        ...s,
        res: { ...s.res, linhThach: s.res.linhThach - cost },
        fog: { ...f, fly: [...f.fly, { cells: [], at: t + trip, back: t + 2 * trip }] },
      }
      // Ẩn Tung Phù: linh điểu về tay không (vẫn tốn, bên kia vẫn biết bị do thám)
      const veiled = (d.veil ?? 0) > t
      const report = veiled
        ? mail(paid, { at: t, k: 'spyVeil', a: [d.name, d.seat.x, d.seat.y] })
        : mail(paid, {
            at: t,
            k: 'spy',
            a: [
              d.name,
              d.seat.x,
              d.seat.y,
              thach,
              thao,
              khoang,
              count(d.troops),
              Math.round(might(defense(d))),
              aidAt(ps, a.pid).length,
              Math.round((wallHp(d, t) / wallMax(d)) * 100),
              d.shield > t ? 1 : 0,
              g ?? '',
              g ? elderLevel(d.elders[g]!) : 0,
            ],
          })
      const told = mail(d, { at: t, k: 'spied', a: [s.name] })
      return {
        ok: true,
        world: w,
        changed: new Map([
          [pid, report],
          [a.pid, told],
        ]),
      }
    },
  },
  spySpot: {
    pick: a => (int(0, 1e6)(a.i) ? { type: 'spySpot', i: a.i } : null),
    run: ({ ps, w, pid, s, map }, a) => {
      const p = map?.atlas.points[a.i]
      const t = s.time
      if (!map || !p || !s.seat) return no('gone')
      if (s.levels.chuDien < PVP_HALL) return no('locked')
      const sp = spotOf(w, map, a.i, t)
      const party = garrison(ps, a.i).map(([q, m]) => [q, ps.get(q)!, m] as [number, State, typeof m])
      if (sp.own === undefined || !party.length) return no('empty') // chưa ai đóng: bảng điểm đã ghi đủ
      if (sp.own === sideKey(w, pid) || party.some(([q]) => napBetween(w, pid, q))) return no('friend')
      const f = fold(fogOf(s), t)
      if (cranesOut(f, t) >= cranes(s)) return no('busy')
      const cost = SPY_COST * (p.lv + 5)
      if (s.res.linhThach < cost) return no('not_enough')
      const [a0, b0] = [cellOf(s.seat), cellOf(p)]
      const trip = CRANE_TIME * Math.max(1, Math.abs(a0.cx - b0.cx), Math.abs(a0.cy - b0.cy))
      const paid = {
        ...s,
        res: { ...s.res, linhThach: s.res.linhThach - cost },
        fog: { ...f, fly: [...f.fly, { cells: [], at: t + trip, back: t + 2 * trip }] },
      }
      const owner = sideName(w, ps, sp.own) ?? '?'
      const a2 = [p.kind, p.x, p.y, owner, party.length, troopsOf(party), guardMight(party)] as const
      return { ok: true, world: w, changed: new Map([[pid, mail(paid, { at: t, k: 'spySpot', a: [...a2] })]]) }
    },
  },
}
