// Phá Yêu Trại hết khung (advance.ts gọi mỗi nhịp): top TRIBE_TOP.length tiên minh theo điểm, mọi người trong minh nhận thư quà
// theo hạng; mỗi tuần một lần. Điểm cộng lúc yêu vương đổ (base.ts tribeBank).
import { TRIBE_TOP } from '../data.ts'
import { mail } from '../sect/inbox.ts'
import { tribeEnd, tribeOf, type Players, type World } from './base.ts'

export function tribeStep(ps: Players, w: World, now: number): { changed: Players; world: World } {
  const changed: Players = new Map()
  const tr = w.tribe
  if (!tr || tr.done || now < tribeEnd(tr.week)) return { changed, world: w }
  const top = Object.entries(tr.pts)
    .map(([aid, pts]) => [Number(aid), Math.round(pts)] as const)
    .filter(([aid, pts]) => pts > 0 && w.allies[aid])
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, TRIBE_TOP.length)
  const at = tribeEnd(tr.week)
  top.forEach(([aid, pts], k) => {
    for (const p of Object.keys(w.allies[aid].members).map(Number)) {
      const s = changed.get(p) ?? ps.get(p)
      if (s) changed.set(p, mail(s, { at, k: 'tribeTop', a: [k + 1, pts], gift: TRIBE_TOP[k] }))
    }
  })
  return { changed, world: { ...w, tribe: { ...tribeOf(w, at - 1), done: true } } }
}
