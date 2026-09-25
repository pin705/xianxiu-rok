// Khám phá (Fog of War + Scout + Tribal Village / Mysterious Cave của RoK): thả linh điểu vào ô sương kề vùng đã khai — bay
// CRANE_TIME mỗi ô sương từ tông môn, tới nơi tan mê vụ 3 × 3 ô sương quanh đó, rồi bay về. Thôn trang, động phủ lộ ra trong
// vùng đã khai thì ghé một lần nhận quà (theo vòng của vùng).
import { sitesOf } from '../atlas.ts'
import { no } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import { FOG_N, around, cellOf, clear, cranes, cranesOut, fogOf, fold } from '../core/fog.ts'
import { int } from '../core/parse.ts'
import { CAVE_GIFTS, CRANE_TIME, VILLAGE_GIFTS } from '../data.ts'
import { type WorldActions } from './base.ts'

export type ExploreAction = { type: 'scout'; cx: number; cy: number } | { type: 'visit'; i: number }
// Ô sương kề (cả chéo) vùng đã khai lúc t: thả điểu vào được
export const frontier = (f: ReturnType<typeof fogOf>, cx: number, cy: number, t: number) =>
  !clear(f, cx, cy, t) && around(cx, cy, 1).some(c => clear(f, c % FOG_N, Math.floor(c / FOG_N), t))
// Thời gian bay tới ô sương (cx, cy) từ tông môn
export const craneTime = (seat: { x: number; y: number }, cx: number, cy: number) => {
  const h = cellOf(seat)
  return CRANE_TIME * Math.max(1, Math.abs(h.cx - cx), Math.abs(h.cy - cy))
}

export const exploreActions: WorldActions<ExploreAction> = {
  scout: {
    pick: a => (int(0, FOG_N - 1)(a.cx) && int(0, FOG_N - 1)(a.cy) ? { type: 'scout', cx: a.cx, cy: a.cy } : null),
    run: ({ w, pid, s }, a) => {
      if (!s.seat) return no('locked')
      const t = s.time,
        f = fold(fogOf(s), t)
      if (cranesOut(f, t) >= cranes(s)) return no('busy')
      if (!frontier(f, a.cx, a.cy, t)) return no('bad')
      const dt = craneTime(s.seat, a.cx, a.cy)
      const fog = { ...f, fly: [...f.fly, { cells: around(a.cx, a.cy, 1), at: t + dt, back: t + 2 * dt }] }
      return { ok: true, world: w, changed: new Map([[pid, { ...s, fog }]]) }
    },
  },
  visit: {
    pick: a => (int(0, 9999)(a.i) ? { type: 'visit', i: a.i } : null),
    run: ({ w, pid, s, map }, a) => {
      const site = map && sitesOf(map.atlas)[a.i]
      if (!site) return no('bad')
      const { cx, cy } = cellOf(site)
      if (!clear(fogOf(s), cx, cy, s.time)) return no('locked')
      if (s.visited?.includes(a.i)) return no('claimed')
      const gift = (site.kind === 'village' ? VILLAGE_GIFTS : CAVE_GIFTS)[site.ring]
      const me = grant({ ...s, visited: [...(s.visited ?? []), a.i] }, gift)
      return { ok: true, world: w, changed: new Map([[pid, me]]) }
    },
  },
}
