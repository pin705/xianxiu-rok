// Sinh Tử Đài (Holmgang của King of All Britain — Nhân Yêu Tranh Bá): mỗi ngày lúc HOLM_HOUR giờ VN, HOLM_PICKS cao thủ Luận Kiếm Đài
// mỗi phái Chính / Tà (điểm đài cao nhất, cả người đi một mình) đấu tay đôi xa luân từng cặp theo thứ hạng bằng đội hình Luận Kiếm Đài
// (không mất quân, mầm theo ngày); phái thắng nhiều cặp hơn được HOLM_BUFF cả phái tới trận hôm sau (holmBuffs ở fight.ts). Chạy
// trong hourly của advance.ts; cần ngày của mùa (map.day) nên sim không chạy.
import { dayOf } from '../core/calendar.ts'
import type { State } from '../core/types.ts'
import { HOLM_PICKS } from '../data.ts'
import { arenaSide, duel, lineupOf } from '../sect/arena.ts'
import { sideKey, type MapCtx, type Players, type World } from './base.ts'
import { holmAt } from './fight.ts'
import { campOf } from './points.ts'

const pts = (s: State) => s.arena?.pts ?? 0
export function holmStep(ps: Players, w: World, map: MapCtx, now: number): { changed: Players; world: World } {
  const d = dayOf(now)
  if (map.day === undefined || now < holmAt(d) || w.holm?.day === d) return { changed: new Map(), world: w }
  const champs = ([0, 1] as const).map(c =>
    [...ps]
      .filter(([pid, s]) => campOf(sideKey(w, pid)) === c && pts(s) > 0 && lineupOf(s).length)
      .sort(([, a], [, b]) => pts(b) - pts(a))
      .slice(0, HOLM_PICKS),
  )
  const duels = champs[0].slice(0, champs[1].length).map(([pa, a], k): [number, number, 0 | 1] => {
    const [pb, b] = champs[1][k]
    const side = (s: State) => lineupOf(s).map(t => arenaSide(s, t))
    return [pa, pb, duel(side(a), side(b), (d * 2_654_435_761 + k * 7919) >>> 0).win ? 0 : 1]
  })
  const wins = duels.filter(x => x[2] === 0).length
  const win = !duels.length || wins * 2 === duels.length ? null : wins * 2 > duels.length ? 0 : 1
  return { changed: new Map(), world: { ...w, holm: { day: d, duels, win } } }
}
