// Dời tông môn vào lãnh thổ tiên minh (Territorial Teleport của RoK): ô trống ở vùng ngoài, thuộc lãnh thổ minh mình,
// cách tông môn khác và các điểm từ 3 ô (như lúc xếp chỗ); mọi đội phải ở nhà; MOVE_COOL một lần.
// Dời núi tân thủ (Beginner's Teleport): chưa dời lần nào và dưới NEWBIE_MOVE_HALL thì tới được mọi ô trống vùng ngoài.
// Càn Khôn Phù (Advanced Teleport): tới ô trống bất kỳ ở vùng đã mở theo pha mùa, không chờ MOVE_COOL. Di Sơn Phù (Random
// Teleport): tới chỗ trống ngẫu nhiên ở vùng ngoài (như lúc lập tông môn). Đang sát khí (vừa đi cướp) thì không dời được.
// Đội địch đang kéo tới chỗ cũ thì tới nơi quay về tay không (advance.ts).
import { MAP_W, dist, regionOf, spawn, type Atlas, type Pos } from '../atlas.ts'
import { rng } from '../combat.ts'
import { no, use } from '../core/action.ts'
import { int } from '../core/parse.ts'
import { MOVE_COOL, NEWBIE_MOVE_HALL } from '../data.ts'
import { resettle as relocate } from '../core/fog.ts'
import { allyOf, type Players, type WorldActions } from './base.ts'
import { type State } from '../core/types.ts'
import { claimsOf, ownerAt } from './points.ts'

export type TerritoryAction = { type: 'move'; x: number; y: number; item?: boolean } | { type: 'moveRandom' }
export const newbieMove = (s: State) => s.moved === undefined && s.levels.chuDien < NEWBIE_MOVE_HALL
// Vùng đã mở theo pha mùa (Càn Khôn Phù tới được): vòng ngoài luôn mở, vòng giữa từ pha 2, tâm từ pha 3
export const ringOpen = (ring: number, phase: number) => ring === 0 || (ring === 1 && phase >= 2) || phase >= 3
// Ô (x, y) trống để đặt tông môn: cách mọi điểm và tông môn khác từ 3 ô
const free = (ps: Players, a: Atlas, pid: number, at: Pos) => {
  const near = (p: Pos) => dist(p, at) < 3
  return !a.points.some(near) && ![...ps].some(([id, o]) => id !== pid && o.seat && near(o.seat))
}

export const territoryActions: WorldActions<TerritoryAction> = {
  move: {
    pick: a =>
      int(2, MAP_W - 3)(a.x) && int(2, MAP_W - 3)(a.y)
        ? { type: 'move', x: a.x, y: a.y, ...(a.item === true && { item: true }) }
        : null,
    run: ({ ps, w, pid, s, map }, a) => {
      const al = allyOf(w, pid),
        newbie = newbieMove(s)
      if (!s.seat || !map) return no('locked')
      if (s.marches.length) return no('busy')
      if ((s.frenzy ?? 0) > s.time) return no('frenzy')
      const at = { x: a.x, y: a.y },
        atlas = map.atlas
      const ring = atlas.regions[regionOf(atlas, at)]?.ring
      if (a.item) {
        // Càn Khôn Phù: vùng đã mở, không cần lãnh thổ, không chờ
        if (!s.items.canKhon) return no('no_item')
        if (ring === undefined || !ringOpen(ring, map.phase)) return no('far')
        if (!free(ps, atlas, pid, at)) return no('taken')
        return { ok: true, world: w, changed: new Map([[pid, relocate(s, at, { items: use(s, 'canKhon', 1) })]]) }
      }
      if (!al && !newbie) return no('locked')
      if ((s.moved ?? -Infinity) + MOVE_COOL > s.time) return no('cooldown')
      if (ring !== 0) return no('far')
      if (!free(ps, atlas, pid, at)) return no('taken')
      if (!newbie && ownerAt(claimsOf(ps, w, atlas, s.time), a.x, a.y) !== al!.id) return no('bad')
      return { ok: true, world: w, changed: new Map([[pid, relocate(s, at, { moved: s.time })]]) }
    },
  },
  moveRandom: {
    pick: () => ({ type: 'moveRandom' }),
    run: ({ ps, w, pid, s, map, seed }) => {
      if (!s.seat || !map) return no('locked')
      if (!s.items.diSon) return no('no_item')
      if (s.marches.length) return no('busy')
      if ((s.frenzy ?? 0) > s.time) return no('frenzy')
      const taken = [...ps].flatMap(([id, o]) => (id !== pid && o.seat ? [o.seat] : []))
      const at = spawn(map.atlas, taken, rng(seed || 1))
      if (!at) return no('taken')
      return { ok: true, world: w, changed: new Map([[pid, relocate(s, at, { items: use(s, 'diSon', 1) })]]) }
    },
  },
}
