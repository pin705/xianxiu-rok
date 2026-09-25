// Khai Giới Trảm Tà (Eve of the Crusade của RoK): cổng mở (hết pha Khai giới) thì chốt giới vận — EVE_TOP minh đầu được tăng ích
// sản lượng (eveBuffs ở base.ts), mỗi người trong minh một thư báo hạng; bảng giới vận xoá để mùa sau tính lại.
import { EVE_BUFF_TIME, EVE_TOP } from '../data.ts'
import { mail } from '../sect/inbox.ts'
import type { MapCtx, Players, World } from './base.ts'

export function eveStep(ps: Players, w: World, map: MapCtx, now: number): { changed: Players; world: World } {
  const changed: Players = new Map()
  if (map.phase === 0 || !w.eve) return { changed, world: w }
  const { eve, ...rest } = w
  const top = Object.entries(eve)
    .map(([id, pts]) => [Number(id), pts] as const)
    .filter(([id, pts]) => w.allies[id] && pts > 0)
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, EVE_TOP)
  top.forEach(([id, pts], k) => {
    for (const pid of Object.keys(w.allies[id].members).map(Number)) {
      const s = ps.get(pid)
      if (s) changed.set(pid, mail(s, { at: now, k: 'eveTop', a: [k + 1, pts] }))
    }
  })
  return {
    changed,
    world: top.length ? { ...rest, eveWin: { ids: top.map(([id]) => id), until: now + EVE_BUFF_TIME } } : rest,
  }
}
