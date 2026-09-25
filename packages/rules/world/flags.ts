// Trận kỳ (Alliance Flag của RoK): trưởng lão / minh chủ cắm trong lãnh thổ minh mình bằng Minh khố; dựng xong sau FLAG_BUILD
// thì nới lãnh thổ bán kính FLAG_R (points.ts claimsOf). Số trận kỳ theo số người trong minh. Nhổ lại được (không hoàn Minh khố).
// Minh khác (không minh ước) xuất quân tới phá: lực chiến đội đánh trừ độ bền, hết độ bền thì cờ đổ; cả hai bên nhận thư.
import { MAP_W, dist, route } from '../atlas.ts'
import { might } from '../combat.ts'
import { no } from '../core/action.ts'
import { fieldError, launch, marchSide } from '../core/battle.ts'
import { int, isElder, isId, pickArmy } from '../core/parse.ts'
import { type Army, type March, type State } from '../core/types.ts'
import { compact } from '../core/util.ts'
import {
  FLAG_BASE,
  FLAG_BUILD,
  FLAG_COST,
  FLAG_GAP,
  FLAG_HP,
  FLAG_MAX,
  FLAG_PER,
  FLAG_REPAIR,
  HONOR_RAZE,
  PVP_HALL,
  type ElderId,
} from '../data.ts'
import { mail } from '../sect/inbox.ts'
import {
  addHonor,
  allyOf,
  put,
  routeMs,
  turnBack,
  type Alliance,
  type Flag,
  type Players,
  type World,
  type WorldActions,
} from './base.ts'
import { claimsOf, ownerAt } from './points.ts'

// Số trận kỳ tối đa của minh: theo số người
export const flagCap = (al: Alliance) =>
  Math.min(FLAG_MAX, FLAG_BASE + Math.floor(Object.keys(al.members).length / FLAG_PER))
export const flagsOf = (w: World, aid: number) => Object.values(w.flags ?? {}).filter(f => f.aid === aid)

// Độ bền lúc t: không bị đánh FLAG_REPAIR thì liền đầy
export const flagHp = (f: Flag, t: number) =>
  f.hit !== undefined && t - f.hit < FLAG_REPAIR ? (f.hp ?? FLAG_HP) : FLAG_HP

export type FlagAction =
  | { type: 'flag'; x: number; y: number }
  | { type: 'unflag'; id: number }
  | { type: 'raze'; id: number; elder: ElderId; army: Army }

export const flagActions: WorldActions<FlagAction> = {
  flag: {
    pick: a => (int(1, MAP_W - 2)(a.x) && int(1, MAP_W - 2)(a.y) ? { type: 'flag', x: a.x, y: a.y } : null),
    run: ({ ps, w, pid, s, map }, a) => {
      const al = allyOf(w, pid)
      if (!al || (al.members[pid] ?? 0) < 1 || !map) return no('locked')
      if (flagsOf(w, al.id).length >= flagCap(al)) return no('limit')
      if ((al.fund ?? 0) < FLAG_COST) return no('not_enough')
      const at = { x: a.x, y: a.y }
      const near = (p: { x: number; y: number }) => dist(p, at) < FLAG_GAP
      if (
        map.atlas.points.some(near) ||
        [...ps.values()].some(o => o.seat && near(o.seat)) ||
        Object.values(w.flags ?? {}).some(near)
      )
        return no('taken')
      if (ownerAt(claimsOf(ps, w, map.atlas, s.time), a.x, a.y) !== al.id) return no('bad')
      const id = w.nextFlag ?? 1
      const next = put(w, { ...al, fund: (al.fund ?? 0) - FLAG_COST })
      return {
        ok: true,
        changed: new Map(),
        world: {
          ...next,
          flags: { ...next.flags, [id]: { id, aid: al.id, x: a.x, y: a.y, done: s.time + FLAG_BUILD } },
          nextFlag: id + 1,
        },
      }
    },
  },
  unflag: {
    pick: a => (isId(a.id) ? { type: 'unflag', id: a.id } : null),
    run: ({ w, pid }, a) => {
      const al = allyOf(w, pid)
      const f = w.flags?.[a.id]
      if (!al || (al.members[pid] ?? 0) < 1 || !f || f.aid !== al.id) return no('locked')
      const { [a.id]: _, ...flags } = w.flags!
      return { ok: true, changed: new Map(), world: { ...w, flags } }
    },
  },
  raze: {
    pick: a => {
      const army = pickArmy(a.army)
      return isId(a.id) && isElder(a.elder) && army ? { type: 'raze', id: a.id, elder: a.elder, army } : null
    },
    run: ({ w, pid, s, map }, a) => {
      const f = w.flags?.[a.id]
      const mine = allyOf(w, pid)
      if (!f || !map || !s.seat) return no('gone')
      if (s.levels.chuDien < PVP_HALL) return no('locked')
      if (mine && (mine.id === f.aid || mine.naps?.includes(f.aid))) return no('bad')
      const e = fieldError(s, a.elder, a.army)
      if (e) return no(e)
      const r = route(map.atlas, s.seat, f, map.phase)
      if (!r) return no('far')
      const army = compact(a.army),
        t = s.time
      const m: March = {
        id: s.nextId,
        elder: a.elder,
        army,
        target: { kind: 'flag', i: f.id },
        seed: 0,
        startAt: t,
        arriveAt: t + routeMs(s, r.len),
        returnAt: 0,
        path: r.path,
        foe: `[${w.allies[f.aid]?.tag ?? '?'}]`,
      }
      return { ok: true, world: w, changed: new Map([[pid, launch(s, army, m)]]) }
    },
  },
}

// Đội phá cờ tới nơi (advance.ts): trừ độ bền bằng lực chiến đội (không giao tranh, không mất quân), hết thì cờ đổ;
// thư cho người đánh và minh chủ bên kia; đội quay về. Cờ không còn / đã thành cờ minh mình: về tay không.
export function razeArrive(ps: Players, w: World, [pid, s, m]: [number, State, March], at: number) {
  const f = w.flags?.[m.target.i]
  const back = turnBack(s, m, at)
  if (!f || allyOf(w, pid)?.id === f.aid) return { changed: new Map([[pid, back]]) as Players, world: w }
  const before = flagHp(f, at)
  const hp = Math.max(0, before - Math.round(might(marchSide(s, m))))
  const left = Math.ceil((hp / FLAG_HP) * 100)
  const { [f.id]: _, ...rest } = w.flags!
  const flags = hp ? { ...rest, [f.id]: { ...f, hp, hit: at } } : rest
  const changed: Players = new Map([
    [
      pid,
      addHonor(
        mail(back, { at, k: 'razed', a: [w.allies[f.aid]?.tag ?? '?', left, f.x, f.y] }),
        (before - hp) / HONOR_RAZE,
      ),
    ],
  ])
  const lord = Number(Object.entries(w.allies[f.aid]?.members ?? {}).find(([, r]) => r === 2)?.[0])
  const ls = ps.get(lord)
  if (ls) changed.set(lord, mail(ls, { at, k: 'flagHit', a: [s.name, left, f.x, f.y] }))
  return { changed, world: { ...w, flags } }
}
