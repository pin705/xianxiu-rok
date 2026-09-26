// Điểm trên bản đồ giới: chiếm (đóng quân), khai mỏ, đánh yêu vương, kết trận; buff linh mạch / linh triều.
import { regionOf, route, tide, type Point } from '../atlas.ts'
import { no } from '../core/action.ts'
import { fieldError, launch } from '../core/battle.ts'
import { isId, int, isElder, oneOf, pickArmy } from '../core/parse.ts'
import { apOf, spendAp } from '../core/stats.ts'
import { advance } from '../core/time.ts'
import { type Army, type Buff, type March, type State } from '../core/types.ts'
import { compact, noGain } from '../core/util.ts'
import { AP_HUNT, BOSSES, GARRISON_MAX, RALLY_MAX, RALLY_WAIT, TIDE_PROD, type Bonus, type ElderId } from '../data.ts'
import {
  allyOf,
  farErr,
  dropIncoming,
  officeBuffs,
  blessBuffs,
  titleBuffs,
  flagGuards,
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
import {
  allyBuffs,
  skillBuffs,
  eveBuffs,
  fortBuffs,
  hold,
  marchAt,
  rebuild,
  ruinWindow,
  veinShut,
  TASK_OF,
  spotOf,
  thoiBuffs,
  orderBuffs,
  veinBuffs,
} from './points.ts'

// Kết trận chỉ để chiếm hoặc đánh yêu vương (khai mỏ đi riêng từng đội)
const rallyTask = (p: Point) => (TASK_OF[p.kind] === 'gather' ? null : (TASK_OF[p.kind] as 'take' | 'hit'))
export type SpotAction =
  | { type: 'go'; i: number; task: Task; elder: ElderId; army: Army } // tới một điểm trên bản đồ giới
  | { type: 'recall'; id: number } // gọi đội về: đang đi (quay đầu giữa đường), đóng quân, khai mỏ, viện binh
  | { type: 'rally'; i: number; wait: 0 | 1 | 2; elder: ElderId; army: Army } // mở kết trận ở điểm i (chiếm / đánh yêu vương)
  | { type: 'rallyJoin'; id: number; elder: ElderId; army: Army } // góp đội vào kết trận
  | { type: 'huntChain'; id: number; i: number } // săn liên hoàn: đội săn đang về đi thẳng tới yêu thú giới khác
const TASKS: readonly Task[] = ['take', 'gather', 'hit', 'hunt']
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
  huntChain: {
    pick: a => (isId(a.id) && spotIndex(a.i) ? { type: 'huntChain', id: a.id, i: a.i } : null),
    run: chainAct,
  },
}

// Săn liên hoàn (chain farming của RoK): đội vừa săn yêu thú giới, đang về, đi thẳng từ chỗ đang đứng tới con khác — quân còn lại
// giữ nguyên (không hồi), chiến lợi phẩm và thương vong cộng dồn; tốn hành lực như một lần săn
function chainAct({ w, pid, s, map }: Ctx, a: Extract<SpotAction, { type: 'huntChain' }>): WorldResult {
  const t = s.time
  const m = s.marches.find(x => x.id === a.id)
  const p = map?.atlas.points[a.i]
  if (!map || !p || p.kind !== 'wild') return no('bad')
  if (!m || m.task !== 'hunt' || !(m.returnAt > t) || !m.back || !Object.values(m.back).some(n => (n ?? 0) > 0))
    return no('locked')
  if ((spotOf(w, map, a.i, t).until ?? 0) > t) return no('cooldown')
  if (apOf(s, t) < AP_HUNT) return no('limit')
  const from = marchAt(m, t) ?? s.seat
  const r = from && route(map.atlas, from, p, map.phase, map.shut)
  if (!r) return no(from ? farErr(map, from, p) : 'far')
  const next: March = {
    ...m,
    army: compact(m.back),
    target: { kind: 'spot', i: a.i },
    spot: p.kind,
    startAt: t,
    arriveAt: t + routeMs(s, r.len, m.back),
    returnAt: 0,
    path: r.path,
    back: undefined,
    report: undefined,
    chain: true,
  }
  return { ok: true, world: w, changed: new Map([[pid, withMarch(spendAp(s, t, AP_HUNT), next)]]) }
}

function goAct({ ps, w, pid, s, seed, map }: Ctx, a: Extract<SpotAction, { type: 'go' }>): WorldResult {
  const t = s.time
  const p = map?.atlas.points[a.i]
  if (!map || !p) return no('gone')
  if (TASK_OF[p.kind] !== a.task) return no('bad')
  if ((p.kind === 'gate' && p.lv > map.phase) || (p.kind === 'heaven' && map.phase < 3)) return no('locked') // trận nhãn mở theo pha mùa
  if (!ruinWindow(map.atlas, p, t).open) return no('locked') // di tích: chỉ lúc mở cửa
  if (a.task === 'take' && veinShut(map.atlas, p, w.spots[a.i], sideKey(w, pid), t)) return no('locked') // linh mạch đang bảo hộ
  if (!s.seat) return no('far')
  const r = route(map.atlas, s.seat, p, map.phase, map.shut)
  if (!r) return no(farErr(map, s.seat, p))
  const sp = spotOf(w, map, a.i, t)
  if (a.task === 'hit' && (!BOSSES[p.lv] || (sp.until ?? 0) > t)) return no('cooldown')
  if (a.task === 'gather' && ((sp.until ?? 0) > t || !sp.left)) return no('empty')
  if (a.task === 'hunt' && (sp.until ?? 0) > t) return no('cooldown') // vừa có người hạ, chưa hồi
  if (a.task === 'take' && sp.own && sp.own > 0 && allyOf(w, pid)?.naps?.includes(sp.own)) return no('friend') // minh ước
  if (a.task === 'hunt' && apOf(s, t) < AP_HUNT) return no('limit') // hết hành lực
  if (
    a.task === 'take' &&
    garrison(ps, a.i).filter(([id]) => sideKey(w, id) === sideKey(w, pid)).length >= GARRISON_MAX
  )
    return no('full')
  if (s.marches.some(m => m.target.kind === 'spot' && m.target.i === a.i)) return no('busy') // mỗi người một đội mỗi điểm
  const e = fieldError(s, a.elder, a.army)
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
    arriveAt: t + routeMs(s, r.len, army),
    returnAt: 0,
    path: r.path,
  }
  const paid = a.task === 'hunt' ? spendAp(s, t, AP_HUNT) : s
  return { ok: true, world: w, changed: new Map([[pid, launch(paid, army, m)]]) }
}

// Gọi về: đội đóng quân về nhà (còn ai của phe mình ở đó thì điểm vẫn giữ); đội đang khai mỏ mang về phần đã khai theo tỉ lệ thời gian
// Đội đang đi trên bản đồ giới (chưa tới, không thuộc kết trận, không phải kiếp vân) — gọi về giữa đường được
const outbound = (m: March, t: number) =>
  !!m.path &&
  ['pvp', 'spot', 'flag'].includes(m.target.kind) &&
  m.arriveAt > t &&
  !m.returnAt &&
  !m.back &&
  !m.stay &&
  m.rally === undefined
// Gọi về được lúc t: đang đi (quay đầu giữa đường), đang đóng quân / viện binh, đang khai mỏ
export const recallable = (m: March, t: number) =>
  outbound(m, t) ||
  (!!m.stay && (m.target.kind === 'spot' || m.target.kind === 'camp' || m.task === 'aid')) ||
  (!!m.mine && m.mine.end > t)

// Đường đã đi tới phần f (0..1) của lộ trình: các điểm dừng đã qua + chỗ đang đứng
function walked(path: { x: number; y: number }[], f: number) {
  const seg = path.slice(1).map((p, k) => Math.hypot(p.x - path[k].x, p.y - path[k].y))
  let d = Math.min(1, Math.max(0, f)) * seg.reduce((a, b) => a + b, 0)
  for (let k = 0; k < seg.length; k++) {
    if (d <= seg[k]) {
      const u = seg[k] ? d / seg[k] : 0
      const at = { x: path[k].x + (path[k + 1].x - path[k].x) * u, y: path[k].y + (path[k + 1].y - path[k].y) * u }
      return [...path.slice(0, k + 1), at]
    }
    d -= seg[k]
  }
  return path
}
// Gọi về giữa đường (Recall của RoK): quay đầu từ chỗ đang đứng, về mất bằng thời gian đã đi, đi săn thì hoàn hành lực; bên
// bị nhắm (cướp tông môn / cướp khoáng) thôi thấy đội kéo tới
function turnAround(ps: Players, w: World, pid: number, s: State, m: March, t: number): WorldResult {
  const path = walked(m.path!, (t - m.startAt) / Math.max(1, m.arriveAt - m.startAt))
  const back = {
    ...m,
    path,
    arriveAt: t,
    back: m.army,
    hurt: m.hurt ?? {},
    gain: noGain(),
    returnAt: 2 * t - m.startAt,
  }
  const me = withMarch(m.task === 'hunt' ? spendAp(s, t, -AP_HUNT) : s, back)
  const changed: Players = new Map([[pid, me]])
  const foe = m.target.kind === 'pvp' ? m.target.i : m.prey?.pid
  const d = foe === undefined ? undefined : ps.get(foe)
  if (foe !== undefined && d) changed.set(foe, dropIncoming(d, pid, m.id))
  return { ok: true, world: w, changed }
}

function recallAct({ ps, w, pid, s, map }: Ctx, mid: number): WorldResult {
  const t = s.time
  const m = s.marches.find(x => x.id === mid)
  if (m && outbound(m, t)) return turnAround(ps, w, pid, s, m, t)
  const where =
    m && (m.target.kind === 'spot' || m.target.kind === 'flag' || m.target.kind === 'camp' || m.task === 'aid')
  if (!m || !where || !(m.stay || (m.mine && m.mine.end > t))) return no('bad')
  const i = m.target.i
  const home = () =>
    withMarch(s, { ...m, stay: false, back: m.army, hurt: m.hurt ?? {}, gain: noGain(), returnAt: t + travel(m) })
  if (m.target.kind === 'camp') return { ok: true, world: w, changed: new Map([[pid, home()]]) } // nhổ trại
  if (m.task === 'aid') {
    // rời trận kỳ / Tổng đà đang dựng: dựng chậm lại theo số quân còn đóng
    const g = m.target.kind === 'flag' ? flagGuards(ps, i) : []
    const world = g.length
      ? rebuild(
          w,
          i,
          t,
          g,
          g.filter(([p]) => p !== pid),
        )
      : w
    return { ok: true, world, changed: new Map([[pid, home()]]) }
  }
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
  if (m.target.kind === 'flag') {
    // Minh khoáng: phần chưa khai trả lại kho (đã tháo thì thôi)
    const f = w.flags?.[i]
    const back = f?.mine && { ...f, mine: { ...f.mine, left: f.mine.left + (mine.amount - got) } }
    return { ok: true, changed: new Map([[pid, next]]), world: back ? { ...w, flags: { ...w.flags, [i]: back } } : w }
  }
  const sp = map ? spotOf(w, map, i, t) : (w.spots[i] ?? {})
  return {
    ok: true,
    changed: new Map([[pid, next]]),
    world: setSpot(w, i, { ...sp, left: (sp.left ?? 0) + (mine.amount - got) }), // giữ đồng hồ hồi mỏ
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
  if (rally?.task === 'raid') return no('bad') // công sơn: raidJoin
  const i = a.type === 'rally' ? a.i : rally!.i
  const p = map.atlas.points[i]
  const task = rally?.task ?? (p && rallyTask(p))
  if (!p || !task) return no('bad')
  if (!ruinWindow(map.atlas, p, t).open) return no('locked')
  if (task === 'take' && veinShut(map.atlas, p, w.spots[i], al.id, t)) return no('locked') // linh mạch đang bảo hộ
  const r = route(map.atlas, s.seat, p, map.phase, map.shut)
  if (!r) return no(farErr(map, s.seat, p))
  const ms = routeMs(s, r.len, a.army)
  if (task === 'hit' && (spotOf(w, map, i, t).until ?? 0) > t) return no('cooldown')
  const members = [...ps.values()].flatMap(x => x.marches.filter(m => rally && m.rally === rally.id)).length
  if (rally && (members >= RALLY_MAX || s.marches.some(m => m.rally === rally.id))) return no('full')
  if (rally && t + ms > rally.at) return no('far') // không kịp tới lúc hẹn
  const e = fieldError(s, a.elder, a.army)
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
  // linh mạch: mỗi loại tăng ích lấy mức cao nhất trong các điểm phe đang giữ (không cộng dồn)
  const veins = new Map<number, Map<Bonus, number>>()
  for (const [k, sp] of Object.entries(w.spots)) {
    const p = map.atlas.points[Number(k)]
    if (p?.kind !== 'vein' || sp.ctl === undefined) continue // tăng ích cho phe kiểm soát (kỳ tranh chấp)
    const m = veins.get(sp.ctl) ?? new Map<Bonus, number>()
    for (const b of veinBuffs(p)) m.set(b.key, Math.max(m.get(b.key) ?? 0, b.v))
    veins.set(sp.ctl, m)
  }
  const t = tide(map.atlas, at)
  const changed: Players = new Map()
  const mapped = (b: Buff) =>
    b.src === 'vein' ||
    b.src === 'ally' ||
    b.src === 'office' ||
    b.src === 'title' ||
    b.src === 'bless' ||
    b.src === 'eve' ||
    b.src === 'thoi' ||
    b.src === 'order' ||
    b.src === 'fort' ||
    b.src === 'askill' ||
    b.src.startsWith('tide')
  for (const [pid, s] of ps) {
    const want: Buff[] = [
      ...[...(veins.get(sideKey(w, pid)) ?? [])].map(([key, v]) => ({
        key,
        v,
        until: 0,
        src: 'vein',
      })),
      ...(s.seat && t.active && regionOf(map.atlas, s.seat) === t.region
        ? [{ key: 'prod' as const, v: TIDE_PROD, until: t.end, src: `tide${t.cycle}` }]
        : []),
      ...allyBuffs(allyOf(w, pid)), // Hộ Minh Đại Trận
      ...skillBuffs(allyOf(w, pid), at), // Minh trận thần thông đang bật
      ...officeBuffs(allyOf(w, pid), pid), // chức vị đường chủ
      ...titleBuffs(w, pid, at), // sắc phong của Giới Chủ
      ...blessBuffs(w, at), // Giới Chủ ban phúc cả giới
      ...eveBuffs(w, pid, at), // Khai Giới Trảm Tà: minh đứng đầu giới vận
      ...thoiBuffs(map, s), // Thiên Thời: thời đang chạy + chỉ lệnh đã chọn
      ...orderBuffs(map, allyOf(w, pid)), // Minh lệnh của thời
      ...fortBuffs(w, pid, at), // Tổng đà của minh
    ]
    const keep = s.buffs.filter(b => !mapped(b))
    const have = s.buffs.filter(mapped)
    if (JSON.stringify(have) === JSON.stringify(want)) continue
    const st = advance(s, at) // sản lượng trước lúc đổi tính theo buff cũ
    changed.set(pid, { ...st, buffs: [...keep, ...want] })
  }
  return changed
}
