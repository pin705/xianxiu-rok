// Cổ Di Tích / Huyết Tế Đàn đóng cửa (Ancient Ruins / Altars of Darkness của RoK — advance.ts gọi mỗi nhịp): phe đang giữ chốt
// điểm mùa theo giờ đã giữ, mỗi người đang đóng quân nhận Công Huân theo phút đã giữ; quân về, điểm trống chờ lần mở sau.
import { HOUR } from '../core/util.ts'
import { HONOR_ALTAR, HONOR_RUIN } from '../data.ts'
import { addHonor, garrison, setSpot, turnBack, type MapCtx, type Players, type World } from './base.ts'
import { bank, ruinWindow, seasonRate } from './points.ts'

export function ruinClose(ps: Players, w: World, map: MapCtx, now: number): { changed: Players; world: World } {
  const changed: Players = new Map()
  for (const [k, sp] of Object.entries(w.spots)) {
    const i = Number(k),
      p = map.atlas.points[i]
    if ((p?.kind !== 'ruin' && p?.kind !== 'altar') || sp.own === undefined || sp.since === undefined) continue
    const end = ruinWindow(map.atlas, p, sp.since).end // cửa sổ lúc chiếm được
    if (now < end) continue
    const held = Math.max(0, end - sp.since)
    w = setSpot(bank(w, sp.own, (held / HOUR) * seasonRate(p)), i, {})
    const honor = (p.kind === 'altar' ? HONOR_ALTAR : HONOR_RUIN) * (held / 60_000)
    for (const [pid, m] of garrison(ps, i)) {
      const s = changed.get(pid) ?? ps.get(pid)
      if (s) changed.set(pid, turnBack(addHonor(s, honor), m, end))
    }
  }
  return { changed, world: w }
}
