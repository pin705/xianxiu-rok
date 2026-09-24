// Điểm trên bản đồ giới: chiếm (đóng quân), khai mỏ, đánh yêu vương, kết trận; buff linh mạch / linh triều.
import { regionOf, route, tide, type Point } from '../atlas.ts'
import { no } from '../core/action.ts'
import { marchError, launch } from '../core/battle.ts'
import { isId, int, isElder, oneOf, pickArmy } from '../core/parse.ts'
import { advance } from '../core/time.ts'
import { type Army, type Buff, type March } from '../core/types.ts'
import { compact, noGain } from '../core/util.ts'
import { BOSSES, GARRISON_MAX, RALLY_MAX, RALLY_WAIT, TIDE_PROD, VEIN_BUFF, VEIN_CAP, type ElderId } from '../data.ts'
import {
  allyOf,
  garrison,
  setSpot,
  sideKey,
  travel,
  withMarch,
  type Ctx,
  type MapCtx,
  type Players,
  type Task,
  type World,
  type WorldActions,
  type WorldResult,
  routeMs,
} from './base.ts'
import { allyBuffs } from './guild.ts'
import { hold, TASK_OF, spotOf } from './points.ts'

// Kết trận chỉ để chiếm hoặc đánh yêu vương (khai mỏ đi riêng từng đội)
const rallyTask = (p: Point) => (TASK_OF[p.kind] === 'gather' ? null : (TASK_OF[p.kind] as 'take' | 'hit'))
export type SpotAction =
  | { type: 'go'; i: number; task: Task; elder: ElderId; army: Army } // tới một điểm trên bản đồ giới
  | { type: 'recall'; id: number } // gọi đội đang đóng quân / đang khai mỏ / đang viện binh về
  | { type: 'rally'; i: number; wait: 0 | 1 | 2; elder: ElderId; army: Army } // mở kết trận ở điểm i (chiếm / đánh yêu vương)
  | { type: 'rallyJoin'; id: number; elder: ElderId; army: Army } // góp đội vào kết trận
const TASKS: readonly Task[] = ['take', 'gather', 'hit']
const spotIndex = int(0, Number.MAX_SAFE_INTEGER)

export const spotActions: WorldActions<SpotAction> = {
  go: {
    pick: a => {
      const army = pickArmy(a.army)
      return spotIndex(a.i) && oneOf(TASKS)(a.task) && army && isElder(a.elder)
        ? { type: 'go', i: a.i, task: a.task, elder: a.elder, army }
        : null
    },
    run: goAct,
  },
  recall: {
    pick: a => (isId(a.id) ? { type: 'recall', id: a.id } : null),
    run: (c, a) => recallAct(c, a.id),
  },
  rally: {
    pick: a => {
      const army = pickArmy(a.army)
      return spotIndex(a.i) && int(0, 2)(a.wait) && army && isElder(a.elder)
        ? { type: 'rally', i: a.i, wait: a.wait as 0 | 1 | 2, elder: a.elder, army }
        : null
    },
    run: rallyAct,
  },
  rallyJoin: {
    pick: a => {
      const army = pickArmy(a.army)
      return army && isElder(a.elder) && isId(a.id) ? { type: 'rallyJoin', id: a.id, elder: a.elder, army } : null
    },
    run: rallyAct,
  },
}

function goAct({ ps, w, pid, s, seed, map }: Ctx, a: Extract<SpotAction, { type: 'go' }>): WorldResult {
  const t = s.time
  const p = map?.atlas.points[a.i]
  if (!map || !p) return no('gone')
  if (TASK_OF[p.kind] !== a.task) return no('bad')
  if ((p.kind === 'gate' && p.lv > map.phase) || (p.kind === 'heaven' && map.phase < 3)) return no('locked') // trận nhãn mở theo pha mùa
  if (!s.seat) return no('far')
  const r = route(map.atlas, s.seat, p, map.phase)
  if (!r) return no('far')
  const sp = spotOf(w, map, a.i, t)
  if (a.task === 'hit' && (!BOSSES[p.lv] || (sp.until ?? 0) > t)) return no('cooldown')
  if (a.task === 'gather' && ((sp.until ?? 0) > t || !sp.left)) return no('empty')
  if (
    a.task === 'take' &&
    garrison(ps, a.i).filter(([id]) => sideKey(w, id) === sideKey(w, pid)).length >= GARRISON_MAX
  )
    return no('full')
  if (s.marches.some(m => m.target.kind === 'spot' && m.target.i === a.i)) return no('busy') // mỗi người một đội mỗi điểm
  const e = marchError(s, a.elder, a.army)
  if (e) return no(e)
  const army = compact(a.army)
  const m: March = {
    id: s.nextId,
    elder: a.elder,
    army,
    target: { kind: 'spot', i: a.i },
    task: a.task,
    spot: p.kind,
    seed,
    startAt: t,
    arriveAt: t + routeMs(s, r.len),
    returnAt: 0,
    path: r.path,
  }
  return { ok: true, world: w, changed: new Map([[pid, launch(s, army, m)]]) }
}

// Gọi về: đội đóng quân về nhà (còn ai của phe mình ở đó thì điểm vẫn giữ); đội đang khai mỏ mang về phần đã khai theo tỉ lệ thời gian
function recallAct({ ps, w, pid, s, map }: Ctx, mid: number): WorldResult {
  const t = s.time
  const m = s.marches.find(x => x.id === mid)
  if (!m || !(m.target.kind === 'spot' || m.task === 'aid') || !(m.stay || (m.mine && m.mine.end > t))) return no('bad')
  const i = m.target.i
  const home = () =>
    withMarch(s, { ...m, stay: false, back: m.army, hurt: m.hurt ?? {}, gain: noGain(), returnAt: t + travel(m) })
  if (m.task === 'aid') return { ok: true, world: w, changed: new Map([[pid, home()]]) }
  if (m.stay) {
    const next = home()
    const left = garrison(new Map([...ps, [pid, next]]), i).filter(([id]) => sideKey(w, id) === w.spots[i]?.own)
    return { ok: true, changed: new Map([[pid, next]]), world: left.length ? w : hold(w, map, i, {}, t) }
  }
  const mine = m.mine!
  const got = Math.floor((mine.amount * (t - m.arriveAt)) / Math.max(1, mine.end - m.arriveAt))
  const next = withMarch(s, {
    ...m,
    mine: { ...mine, end: t, amount: got },
    gain: { res: { [mine.res]: got }, items: {}, exp: 0 },
    returnAt: t + travel(m),
  })
  const sp = map ? spotOf(w, map, i, t) : (w.spots[i] ?? {})
  return {
    ok: true,
    changed: new Map([[pid, next]]),
    world: setSpot(w, i, { left: (sp.left ?? 0) + (mine.amount - got) }),
  }
}

// Mở kết trận / góp đội: chỉ trong minh; mọi đội tới đích đúng lúc `at` (đội ở gần đi chậm lại cho khớp)
function rallyAct(
  { ps, w, pid, s, seed, map }: Ctx,
  a: Extract<SpotAction, { type: 'rally' | 'rallyJoin' }>,
): WorldResult {
  const t = s.time
  const al = allyOf(w, pid)
  if (!map || !s.seat) return no('far')
  if (!al) return no('locked')
  const rally = a.type === 'rallyJoin' ? w.rallies[a.id] : undefined
  if (a.type === 'rallyJoin' && (!rally || rally.ally !== al.id || rally.at <= t)) return no('gone')
  const i = a.type === 'rally' ? a.i : rally!.i
  const p = map.atlas.points[i]
  const task = rally?.task ?? (p && rallyTask(p))
  if (!p || !task) return no('bad')
  const r = route(map.atlas, s.seat, p, map.phase)
  if (!r) return no('far')
  const ms = routeMs(s, r.len)
  if (task === 'hit' && (spotOf(w, map, i, t).until ?? 0) > t) return no('cooldown')
  const members = [...ps.values()].flatMap(x => x.marches.filter(m => rally && m.rally === rally.id)).length
  if (rally && (members >= RALLY_MAX || s.marches.some(m => m.rally === rally.id))) return no('full')
  if (rally && t + ms > rally.at) return no('far') // không kịp tới lúc hẹn
  const e = marchError(s, a.elder, a.army)
  if (e) return no(e)
  const army = compact(a.army)
  const at = a.type === 'rally' ? t + Math.max(RALLY_WAIT[a.wait], ms) : rally!.at
  const id2 = rally?.id ?? w.nextRally
  const m: March = {
    id: s.nextId,
    elder: a.elder,
    army,
    target: { kind: 'spot', i },
    task,
    spot: p.kind,
    rally: id2,
    seed,
    startAt: t,
    arriveAt: at,
    returnAt: 0,
    path: r.path,
  }
  const next = launch(s, army, m)
  const world = rally
    ? w
    : { ...w, rallies: { ...w.rallies, [id2]: { id: id2, ally: al.id, by: pid, i, task, at } }, nextRally: id2 + 1 }
  return { ok: true, world, changed: new Map([[pid, next]]) }
}

// Buff của bản đồ giới cho mỗi tông môn: linh mạch phe mình đang giữ (cả minh), linh triều ở vùng mình. Trả về state cần đổi.
export function worldBuffs(ps: Players, w: World, map: MapCtx, at: number): Players {
  const veins = new Map<number, number>()
  for (const [k, sp] of Object.entries(w.spots)) {
    const p = map.atlas.points[Number(k)]
    if (p?.kind === 'vein' && sp.own !== undefined) veins.set(sp.own, (veins.get(sp.own) ?? 0) + VEIN_BUFF[p.lv - 1])
  }
  const t = tide(map.atlas, at)
  const changed: Players = new Map()
  const mapped = (b: Buff) => b.src === 'vein' || b.src === 'ally' || b.src.startsWith('tide')
  for (const [pid, s] of ps) {
    const v = Math.min(VEIN_CAP, veins.get(sideKey(w, pid)) ?? 0)
    const want: Buff[] = [
      ...(v ? [{ key: 'prod' as const, v, until: 0, src: 'vein' }] : []),
      ...(s.seat && t.active && regionOf(map.atlas, s.seat) === t.region
        ? [{ key: 'prod' as const, v: TIDE_PROD, until: t.end, src: `tide${t.cycle}` }]
        : []),
      ...allyBuffs(allyOf(w, pid)), // Hộ Minh Đại Trận
    ]
    const keep = s.buffs.filter(b => !mapped(b))
    const have = s.buffs.filter(mapped)
    if (JSON.stringify(have) === JSON.stringify(want)) continue
    const st = advance(s, at) // sản lượng trước lúc đổi tính theo buff cũ
    changed.set(pid, { ...st, buffs: [...keep, ...want] })
  }
  return changed
}
