// Đổi đích giữa đường (Redirect của RoK — "chuyển độn"): đội đang đi tới một điểm trên bản đồ giới (chưa tới, không thuộc kết trận)
// đổi sang điểm khác cùng việc — chiếm → chiếm, khai mỏ → khai mỏ, đánh yêu vương → đánh yêu vương, săn → săn — đi tiếp từ chỗ
// đang đứng. Lộ trình ghi nối: phần đã đi + đường mới (giờ xuất phát giữ nguyên), nên về nhà đi ngược đúng đường đã đi — đổi đích
// sát đích không rút ngắn được đường về.
import { route } from '../atlas.ts'
import { no } from '../core/action.ts'
import { int, isId } from '../core/parse.ts'
import { BOSSES, GARRISON_MAX } from '../data.ts'
import { allyOf, farErr, garrison, routeMs, sideKey, withMarch, type WorldActions } from './base.ts'
import { TASK_OF, ruinWindow, spotOf, veinShut, walked } from './points.ts'

export type RedirectAction = { type: 'redirect'; id: number; i: number }
export const redirectActions: WorldActions<RedirectAction> = {
  redirect: {
    pick: a => (isId(a.id) && int(0, 99_999)(a.i) ? { type: 'redirect', id: a.id, i: a.i as number } : null),
    run: ({ ps, w, pid, s, map }, a) => {
      const t = s.time
      const m = s.marches.find(x => x.id === a.id)
      const p = map?.atlas.points[a.i]
      if (!map || !p || !m?.path || m.target.kind !== 'spot' || m.target.i === a.i) return no('bad')
      if (!(m.arriveAt > t) || m.returnAt || m.back || m.stay || m.rally !== undefined || m.task !== TASK_OF[p.kind])
        return no('bad') // chỉ đội đang đi, đổi sang điểm cùng việc
      if ((p.kind === 'gate' && p.lv > map.phase) || (p.kind === 'heaven' && map.phase < 3)) return no('locked')
      if (
        !ruinWindow(map.atlas, p, t).open ||
        (m.task === 'take' && veinShut(map.atlas, p, w.spots[a.i], sideKey(w, pid), t))
      )
        return no('locked')
      const sp = spotOf(w, map, a.i, t)
      if (m.task !== 'take' && (sp.until ?? 0) > t) return no('cooldown') // mỏ đang hồi, yêu thú / yêu vương vừa bị hạ
      if ((m.task === 'gather' && !sp.left) || (m.task === 'hit' && !BOSSES[p.lv])) return no('empty')
      if (m.task === 'take' && sp.own && sp.own > 0 && allyOf(w, pid)?.naps?.includes(sp.own)) return no('friend')
      if (
        m.task === 'take' &&
        garrison(ps, a.i).filter(([id]) => sideKey(w, id) === sideKey(w, pid)).length >= GARRISON_MAX
      )
        return no('full')
      if (s.marches.some(x => x.target.kind === 'spot' && x.target.i === a.i)) return no('busy') // mỗi người một đội mỗi điểm
      const gone = walked(m.path, (t - m.startAt) / Math.max(1, m.arriveAt - m.startAt))
      const here = gone.at(-1)!
      const from = { x: Math.round(here.x), y: Math.round(here.y) }
      const r = route(map.atlas, from, p, map.phase, map.shut)
      if (!r) return no(farErr(map, from, p))
      const next = {
        ...m,
        target: { kind: 'spot' as const, i: a.i },
        spot: p.kind,
        arriveAt: t + routeMs(s, r.len, m.army),
        path: [...gone, ...r.path],
      }
      return { ok: true, world: w, changed: new Map([[pid, withMarch(s, next)]]) }
    },
  },
}
