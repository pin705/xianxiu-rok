// Trận kỳ (Alliance Flag của RoK): trưởng lão / minh chủ cắm trong lãnh thổ minh mình bằng Minh khố; dựng xong sau FLAG_BUILD
// thì nới lãnh thổ bán kính FLAG_R (points.ts claimsOf). Số trận kỳ theo số người trong minh. Nhổ lại được (không hoàn Minh khố).
// Minh khác (không minh ước) xuất quân tới phá: lực chiến đội đánh trừ độ bền, hết độ bền thì cờ đổ; cả hai bên nhận thư.
// Cùng khuôn: Tổng đà (fort) và Minh khoáng (mine — Alliance Resource Center: kho tài nguyên riêng của minh, khai không bị cướp).
import { MAP_W, dist, route } from '../atlas.ts'
import { might } from '../combat.ts'
import { no, type Pick } from '../core/action.ts'
import { fieldError, launch, marchSide } from '../core/battle.ts'
import { int, isElder, isId, oneOf, pickArmy } from '../core/parse.ts'
import { lead } from '../core/stats.ts'
import { type Army, type March, type State } from '../core/types.ts'
import { compact, HOUR, noGain } from '../core/util.ts'
import {
  ALLY_MINE_BUILD,
  ALLY_MINE_COST,
  ALLY_MINE_LIFE,
  ALLY_MINE_RATE,
  ALLY_MINE_STOCK,
  FLAG_BASE,
  FLAG_BUILD,
  FLAG_COST,
  FLAG_GAP,
  FLAG_GUARD_MAX,
  FLAG_HP,
  FLAG_MAX,
  FLAG_PER,
  FLAG_REPAIR,
  FORT_BUILD,
  FORT_COST,
  FORT_HP,
  FORT_MAX,
  FORT_MIN,
  FORT_PER,
  HONOR_GATHER,
  HONOR_RAZE,
  PVP_HALL,
  RESOURCES,
  type ElderId,
  type Res,
} from '../data.ts'
import { mail } from '../sect/inbox.ts'
import {
  addHonor,
  allyOf,
  farErr,
  flagGuards,
  guardMight,
  put,
  routeMs,
  turnBack,
  withMarch,
  travel,
  type Alliance,
  type Ctx,
  type Flag,
  type Players,
  type World,
  type WorldActions,
  type WorldResult,
} from './base.ts'
import { carryOf } from './fight.ts'
import { claimsOf, ownerAt, rebuild } from './points.ts'

// Số trận kỳ tối đa của minh: theo số người (Tổng đà không tính)
export const flagCap = (al: Alliance) =>
  Math.min(FLAG_MAX, FLAG_BASE + Math.floor(Object.keys(al.members).length / FLAG_PER))
export const flagsOf = (w: World, aid: number) =>
  Object.values(w.flags ?? {}).filter(f => f.aid === aid && !f.fort && !f.mine)
// Tổng đà + Phân đà của minh (mã tăng dần: cái đầu là Tổng đà); số tối đa theo số người
export const fortsOf = (w: World, aid: number) => Object.values(w.flags ?? {}).filter(f => f.aid === aid && f.fort)
export const fortCap = (al: { members: Alliance['members'] }) =>
  Math.min(FORT_MAX, 1 + Math.floor(Object.keys(al.members).length / FORT_PER))
export const mineOf = (w: World, aid: number) => Object.values(w.flags ?? {}).find(f => f.aid === aid && f.mine)

// Độ bền lúc t: không bị đánh FLAG_REPAIR thì liền đầy (Tổng đà: FORT_HP)
export const flagMax = (f: { fort?: boolean }) => (f.fort ? FORT_HP : FLAG_HP)
export const flagHp = (f: Flag, t: number) =>
  f.hit !== undefined && t - f.hit < FLAG_REPAIR ? (f.hp ?? flagMax(f)) : flagMax(f)

export type FlagAction =
  | { type: 'flag'; x: number; y: number }
  | { type: 'fort'; x: number; y: number } // dựng Tổng đà
  | { type: 'allyMine'; x: number; y: number; res: Res } // dựng Minh khoáng
  | { type: 'unflag'; id: number }
  | { type: 'raze'; id: number; elder: ElderId; army: Army }
  | { type: 'flagGuard'; id: number; elder: ElderId; army: Army } // đóng quân giữ cờ minh mình
  | { type: 'allyGather'; id: number; elder: ElderId; army: Army } // khai Minh khoáng của minh mình

type Kind = 'flag' | 'fort' | 'mine'
const COST: Record<Kind, number> = { flag: FLAG_COST, fort: FORT_COST, mine: ALLY_MINE_COST }
const BUILD: Record<Kind, number> = { flag: FLAG_BUILD, fort: FORT_BUILD, mine: ALLY_MINE_BUILD }
// đủ rồi: trận kỳ theo số người; Tổng đà (cần FORT_MIN người) + Phân đà theo số người; Minh khoáng mỗi minh một
const full = (w: World, al: Alliance, kind: Kind) => {
  if (kind === 'fort') return fortsOf(w, al.id).length >= fortCap(al) || Object.keys(al.members).length < FORT_MIN
  return kind === 'mine' ? !!mineOf(w, al.id) : flagsOf(w, al.id).length >= flagCap(al)
}

// Cắm trận kỳ / dựng Tổng đà / Minh khoáng ở (x, y): trong lãnh thổ minh mình, cách điểm, tông môn, cờ khác từ FLAG_GAP ô,
// tốn Minh khố
function plant({ ps, w, pid, s, map }: Ctx, a: { x: number; y: number; res?: Res }, kind: Kind): WorldResult {
  const al = allyOf(w, pid)
  if (!al || (al.members[pid] ?? 0) < 1 || !map) return no('locked')
  if (full(w, al, kind)) return no('limit')
  const cost = kind === 'fort' ? FORT_COST * (fortsOf(w, al.id).length + 1) : COST[kind]
  if ((al.fund ?? 0) < cost) return no('not_enough')
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
  const next = put(w, { ...al, fund: (al.fund ?? 0) - cost })
  const done = s.time + BUILD[kind]
  const f: Flag = { id, aid: al.id, x: a.x, y: a.y, done, ...(kind === 'fort' && { fort: true }) }
  if (kind === 'mine' && a.res) f.mine = { res: a.res, left: ALLY_MINE_STOCK, until: done + ALLY_MINE_LIFE }
  return { ok: true, changed: new Map(), world: { ...next, flags: { ...next.flags, [id]: f }, nextFlag: id + 1 } }
}

// Xuất một đội tới trận kỳ f (giữ, phá, khai Minh khoáng): kiểm quân, tìm đường (tránh cửa ải bị chặn), tính giờ tới
function sendTo(
  { w, pid, s, map }: Ctx,
  f: Flag,
  a: { elder: ElderId; army: Army },
  more: Partial<March>,
): WorldResult {
  if (!map || !s.seat) return no('gone')
  const e = fieldError(s, a.elder, a.army)
  if (e) return no(e)
  const r = route(map.atlas, s.seat, f, map.phase, map.shut)
  if (!r) return no(farErr(map, s.seat, f))
  const army = compact(a.army),
    t = s.time
  const m: March = {
    id: s.nextId,
    elder: a.elder,
    army,
    target: { kind: 'flag', i: f.id },
    seed: 0,
    startAt: t,
    arriveAt: t + routeMs(s, r.len, army),
    returnAt: 0,
    path: r.path,
    ...more,
  }
  return { ok: true, world: w, changed: new Map([[pid, launch(s, army, m)]]) }
}
const pickSend =
  <T extends 'raze' | 'flagGuard' | 'allyGather'>(type: T): Pick<{ type: T; id: number; elder: ElderId; army: Army }> =>
  a => {
    const army = pickArmy(a.army)
    return isId(a.id) && isElder(a.elder) && army ? { type, id: a.id, elder: a.elder, army } : null
  }

export const flagActions: WorldActions<FlagAction> = {
  flag: {
    pick: a => (int(1, MAP_W - 2)(a.x) && int(1, MAP_W - 2)(a.y) ? { type: 'flag', x: a.x, y: a.y } : null),
    run: (c, a) => plant(c, a, 'flag'),
  },
  fort: {
    pick: a => (int(1, MAP_W - 2)(a.x) && int(1, MAP_W - 2)(a.y) ? { type: 'fort', x: a.x, y: a.y } : null),
    run: (c, a) => plant(c, a, 'fort'),
  },
  allyMine: {
    pick: a =>
      int(1, MAP_W - 2)(a.x) && int(1, MAP_W - 2)(a.y) && oneOf(RESOURCES)(a.res)
        ? { type: 'allyMine', x: a.x, y: a.y, res: a.res }
        : null,
    run: (c, a) => plant(c, a, 'mine'),
  },
  unflag: {
    pick: a => (isId(a.id) ? { type: 'unflag', id: a.id } : null),
    run: ({ ps, w, pid, s }, a) => {
      const al = allyOf(w, pid)
      const f = w.flags?.[a.id]
      if (!al || (al.members[pid] ?? 0) < 1 || !f || f.aid !== al.id) return no('locked')
      const { [a.id]: _, ...flags } = w.flags!
      return { ok: true, changed: guardsHome(ps, f.id, s.time), world: { ...w, flags } }
    },
  },
  flagGuard: {
    pick: pickSend('flagGuard'),
    run: (c, a) => {
      const f = c.w.flags?.[a.id]
      if (!f) return no('gone')
      if (allyOf(c.w, c.pid)?.id !== f.aid) return no('locked')
      if (flagGuards(c.ps, f.id).length >= FLAG_GUARD_MAX) return no('full')
      if (c.s.marches.some(m => m.target.kind === 'flag' && m.target.i === f.id)) return no('busy')
      return sendTo(c, f, a, { task: 'aid', seed: c.seed })
    },
  },
  allyGather: {
    pick: pickSend('allyGather'),
    run: (c, a) => {
      const f = c.w.flags?.[a.id]
      if (!f?.mine || f.mine.until <= c.s.time) return no('gone')
      if (allyOf(c.w, c.pid)?.id !== f.aid || f.done > c.s.time) return no('locked')
      const here = c.s.marches.find(m => m.target.kind === 'flag' && m.target.i === f.id)
      // đội đã góp xây / đang giữ ở đây: khai tại chỗ, khỏi đi về rồi đi lại
      if (here?.stay) return { ok: true, ...mineArrive(c.ps, c.w, [c.pid, c.s, { ...here, task: 'gather' }], c.s.time) }
      if (here) return no('busy')
      return sendTo(c, f, a, { task: 'gather' })
    },
  },
  raze: {
    pick: pickSend('raze'),
    run: (c, a) => {
      const f = c.w.flags?.[a.id]
      const mine = allyOf(c.w, c.pid)
      if (!f) return no('gone')
      if (c.s.levels.chuDien < PVP_HALL) return no('locked')
      if (mine && (mine.id === f.aid || mine.naps?.includes(f.aid))) return no('bad')
      return sendTo(c, f, a, { foe: `[${c.w.allies[f.aid]?.tag ?? '?'}]` })
    },
  },
}

// Đội phá cờ tới nơi (advance.ts): trừ độ bền bằng lực chiến đội (không giao tranh, không mất quân), hết thì cờ đổ;
// thư cho người đánh và minh chủ bên kia; đội quay về. Cờ không còn / đã thành cờ minh mình: về tay không.
export function razeArrive(ps: Players, w: World, [pid, s, m]: [number, State, March], at: number) {
  const f = w.flags?.[m.target.i]
  const back = turnBack(s, m, at)
  if (m.task === 'aid') return guardArrive(ps, w, [pid, s, m], at)
  if (m.task === 'gather') return mineArrive(ps, w, [pid, s, m], at)
  if (!f || allyOf(w, pid)?.id === f.aid) return { changed: new Map([[pid, back]]) as Players, world: w }
  const before = flagHp(f, at)
  // quân đóng giữ chặn bớt: chỉ phần lực chiến vượt lực chiến của họ mới phá được độ bền
  const hp = Math.max(0, before - Math.max(0, Math.round(might(marchSide(s, m))) - guardMight(flagGuards(ps, f.id))))
  const left = Math.ceil((hp / flagMax(f)) * 100)
  const { [f.id]: _, ...rest } = w.flags!
  const flags = hp ? { ...rest, [f.id]: { ...f, hp, hit: at } } : rest
  const changed: Players = hp ? new Map() : guardsHome(ps, f.id, at) // cờ đổ: quân giữ về
  changed.set(
    pid,
    addHonor(
      mail(back, { at, k: 'razed', a: [w.allies[f.aid]?.tag ?? '?', left, f.x, f.y] }),
      (before - hp) / HONOR_RAZE,
    ),
  )
  const lord = Number(Object.entries(w.allies[f.aid]?.members ?? {}).find(([, r]) => r === 2)?.[0])
  const ls = changed.get(lord) ?? ps.get(lord) // minh chủ có thể cũng đang giữ cờ (vừa được cho về)
  if (ls) changed.set(lord, mail(ls, { at, k: 'flagHit', a: [s.name, left, f.x, f.y] }))
  return { changed, world: { ...w, flags } }
}

// Đội giữ cờ tới nơi: còn là cờ minh mình, chưa đủ đội thì đứng lại (cờ đang dựng: góp quân, dựng nhanh hơn); không thì về
function guardArrive(ps: Players, w: World, [pid, s, m]: [number, State, March], at: number) {
  const f = w.flags?.[m.target.i]
  const g = f ? flagGuards(ps, f.id) : []
  const ok = f && allyOf(w, pid)?.id === f.aid && g.length < FLAG_GUARD_MAX
  const stay = { ...m, stay: true }
  return {
    changed: new Map([[pid, ok ? withMarch(s, stay) : turnBack(s, m, at)]]) as Players,
    world: ok ? rebuild(w, f.id, at, g, [...g, [pid, s, stay]]) : w,
  }
}
// Cờ đổ / bị nhổ: mọi đội đang giữ về nhà
// (đi về mất bằng đường tới — đã đóng bao lâu cũng vậy)
const guardsHome = (ps: Players, id: number, at: number): Players =>
  new Map(
    flagGuards(ps, id).map(([p, s, m]) => [
      p,
      withMarch(s, { ...m, stay: false, back: m.army, hurt: m.hurt ?? {}, gain: noGain(), returnAt: at + travel(m) }),
    ]),
  )

// Đội khai Minh khoáng tới nơi: còn là Minh khoáng của minh mình, đã dựng xong, chưa tháo, kho còn thì khai (sức mang, tốc
// ALLY_MINE_RATE + khoá 'gather' của trưởng lão dẫn đội); không thì về tay không. Kho cạn thì Minh khoáng tự tháo (quân giữ về).
function mineArrive(ps: Players, w: World, [pid, s, m]: [number, State, March], at: number) {
  const f = w.flags?.[m.target.i]
  const mine = f?.mine
  if (!f || !mine || allyOf(w, pid)?.id !== f.aid || f.done > at || mine.until <= at || mine.left <= 0)
    return { changed: new Map([[pid, turnBack(s, m, at)]]) as Players, world: w }
  const amount = Math.min(carryOf(m.army), mine.left)
  const end = at + Math.round((amount / (ALLY_MINE_RATE * (1 + lead(s, m.elder, 'gather')))) * HOUR)
  const next = withMarch(addHonor(s, amount / HONOR_GATHER), {
    ...m,
    stay: false,
    mine: { end, amount, res: mine.res },
    back: m.army,
    hurt: {},
    gain: { res: { [mine.res]: amount }, items: {}, exp: 0 },
    returnAt: end + travel(m),
  })
  const left = mine.left - amount
  const { [f.id]: _, ...rest } = w.flags!
  const flags = left > 0 ? { ...rest, [f.id]: { ...f, mine: { ...mine, left } } } : rest
  const changed: Players = left > 0 ? new Map() : guardsHome(ps, f.id, at)
  return { changed: changed.set(pid, next), world: { ...w, flags } }
}

// Minh khoáng quá hạn (advance.ts gọi mỗi nhịp): tháo, đội đang đóng giữ về nhà (đội đang khai khai nốt phần đã nhận)
export function mineExpire(ps: Players, w: World, now: number): { changed: Players; world: World } {
  const old = Object.values(w.flags ?? {}).filter(f => f.mine && f.mine.until <= now)
  if (!old.length) return { changed: new Map(), world: w }
  const changed: Players = new Map()
  for (const f of old) for (const [p, s] of guardsHome(ps, f.id, now)) changed.set(p, s)
  const flags = Object.fromEntries(Object.entries(w.flags!).filter(([, f]) => !old.includes(f)))
  return { changed, world: { ...w, flags } }
}
