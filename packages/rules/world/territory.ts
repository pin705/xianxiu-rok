// Dời tông môn vào lãnh thổ tiên minh (Territorial Teleport của RoK): ô trống ở vùng ngoài, thuộc lãnh thổ minh mình,
// cách tông môn khác và các điểm từ 3 ô (như lúc xếp chỗ); mọi đội phải ở nhà; MOVE_COOL một lần.
// Dời núi tân thủ (Beginner's Teleport): chưa dời lần nào và dưới NEWBIE_MOVE_HALL thì tới được mọi ô trống vùng ngoài.
// Đội địch đang kéo tới chỗ cũ thì tới nơi quay về tay không (advance.ts).
import { MAP_W, dist, regionOf } from '../atlas.ts'
import { no } from '../core/action.ts'
import { int } from '../core/parse.ts'
import { FOG_HOME, MOVE_COOL, NEWBIE_MOVE_HALL } from '../data.ts'
import { around, cellOf, fogOf, lift } from '../core/fog.ts'
import { allyOf, type WorldActions } from './base.ts'
import { type State } from '../core/types.ts'
import { claimsOf, ownerAt } from './points.ts'

export type TerritoryAction = { type: 'move'; x: number; y: number }
export const newbieMove = (s: State) => s.moved === undefined && s.levels.chuDien < NEWBIE_MOVE_HALL

export const territoryActions: WorldActions<TerritoryAction> = {
  move: {
    pick: a => (int(2, MAP_W - 3)(a.x) && int(2, MAP_W - 3)(a.y) ? { type: 'move', x: a.x, y: a.y } : null),
    run: ({ ps, w, pid, s, map }, a) => {
      const al = allyOf(w, pid),
        newbie = newbieMove(s)
      if ((!al && !newbie) || !s.seat || !map) return no('locked')
      if ((s.moved ?? -Infinity) + MOVE_COOL > s.time) return no('cooldown')
      if (s.marches.length) return no('busy')
      const at = { x: a.x, y: a.y },
        atlas = map.atlas
      if (atlas.regions[regionOf(atlas, at)]?.ring !== 0) return no('far')
      const near = (p: { x: number; y: number }) => dist(p, at) < 3
      if (atlas.points.some(near) || [...ps].some(([id, o]) => id !== pid && o.seat && near(o.seat))) return no('taken')
      if (!newbie && ownerAt(claimsOf(ps, w, atlas, s.time), a.x, a.y) !== al!.id) return no('bad')
      // mê vụ quanh chỗ mới tan (như lúc lập tông môn)
      const f = fogOf(s),
        c = cellOf(at)
      const fog = { ...f, rows: lift(f.rows, around(c.cx, c.cy, FOG_HOME)) }
      return { ok: true, world: w, changed: new Map([[pid, { ...s, seat: at, moved: s.time, fog }]]) }
    },
  },
}
