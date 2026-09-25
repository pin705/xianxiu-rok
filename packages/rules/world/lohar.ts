// Yêu Vương Tuần Sơn (Lohar's Trial của RoK): đủ LOHAR_BONES yêu cốt thì triệu hồi một yêu vương đang sống thành bản Tuần Sơn —
// máu ×LOHAR_HP trong LOHAR_TIME, hạ được thì quà thêm (hitBoss ở arrive.ts). Hết giờ chưa hạ: trở lại yêu vương thường.
import { no } from '../core/action.ts'
import { isId } from '../core/parse.ts'
import { BOSSES, LOHAR_BONES, LOHAR_HP, LOHAR_TIME } from '../data.ts'
import { setSpot, type MapCtx, type World, type WorldActions } from './base.ts'
import { spotOf } from './points.ts'

export type LoharAction = { type: 'summon'; i: number }
export const loharActions: WorldActions<LoharAction> = {
  summon: {
    pick: a => (isId(a.i) || a.i === 0 ? { type: 'summon', i: a.i as number } : null),
    run: ({ w, pid, s, map }, a) => {
      const p = map?.atlas.points[a.i]
      const boss = p?.kind === 'boss' ? BOSSES[p.lv] : undefined
      if (!map || !boss) return no('bad')
      const sp = spotOf(w, map, a.i, s.time)
      if ((sp.until ?? 0) > s.time || (sp.lohar && sp.lohar.until > s.time)) return no('busy') // đang hồi / đã có Tuần Sơn
      if ((s.bones ?? 0) < LOHAR_BONES) return no('not_enough')
      const lohar = { by: pid, until: s.time + LOHAR_TIME }
      return {
        ok: true,
        world: setSpot(w, a.i, { ...sp, hp: boss.str * LOHAR_HP, dmg: {}, lohar }),
        changed: new Map([[pid, { ...s, bones: (s.bones ?? 0) - LOHAR_BONES }]]),
      }
    },
  },
}

// Tuần Sơn hết giờ chưa hạ: bỏ dấu, máu về không quá yêu vương thường (sát thương đã đánh vẫn tính)
export function loharStep(w: World, map: MapCtx, now: number): World {
  let out = w
  for (const [k, sp] of Object.entries(w.spots)) {
    if (!sp.lohar || sp.lohar.until > now) continue
    const { lohar: _gone, ...rest } = sp
    const str = BOSSES[map.atlas.points[Number(k)].lv]?.str ?? 0
    out = setSpot(out, Number(k), { ...rest, hp: Math.min(rest.hp ?? str, str) })
  }
  return out
}
