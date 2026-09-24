// Điểm trên bản đồ giới: chiếm (đóng quân), khai mỏ, đánh yêu vương, kết trận; buff linh mạch / linh triều.
import { regionOf, route, tide, type Atlas, type PointKind, type Point } from '../atlas.ts'
import { fight, might, type Side } from '../combat.ts'
import { no } from '../core/action.ts'
import { mob, pushReport, sideOf, snap, marchError, launch } from '../core/battle.ts'
import { isId, int, isElder, oneOf, pickArmy } from '../core/parse.ts'
import { elderLevel, lead } from '../core/stats.ts'
import { advance } from '../core/time.ts'
import { type Army, type Buff, type March } from '../core/types.ts'
import { HOUR, compact, noGain } from '../core/util.ts'
import {
  BEATS,
  BOSSES,
  GARRISON_MAX,
  MINE_RATE,
  MINE_RESPAWN,
  MINE_STOCK,
  RALLY_MAX,
  RALLY_WAIT,
  RESOURCES,
  SEASON_BOSS,
  TIDE_MINE,
  TIDE_PROD,
  TIER,
  TYPES,
  VEIN_BUFF,
  VEIN_CAP,
  type ElderId,
  type Reward,
} from '../data.ts'
import { mail } from '../sect/inbox.ts'
import {
  allyOf,
  garrison,
  setSpot,
  sideKey,
  travel,
  turnBack,
  withMarch,
  type Ctx,
  type MapCtx,
  type Party,
  type Players,
  type Spot,
  type Task,
  type World,
  type WorldActions,
  type WorldResult,
  routeMs,
} from './base.ts'
import { addArmy, carryOf, combine, split, flipRounds } from './fight.ts'
import { bank, hold } from './season.ts'

export const TASK_OF: Record<PointKind, Task> = {
  vein: 'take',
  gate: 'take',
  heaven: 'take',
  mine: 'gather',
  boss: 'hit',
}
// Kết trận chỉ để chiếm hoặc đánh yêu vương (khai mỏ đi riêng từng đội)
const rallyTask = (p: Point) => (TASK_OF[p.kind] === 'gather' ? null : (TASK_OF[p.kind] as 'take' | 'hit'))
// Trạng thái điểm lúc now (mỏ cạn / yêu vương chết đã tới giờ hồi thì như mới)
export function spotOf(w: World, map: MapCtx, i: number, now: number): Spot {
  const p = map.atlas.points[i]
  const sp = w.spots[i] ?? {}
  if (p.kind === 'mine')
    return sp.until && sp.until <= now
      ? { left: MINE_STOCK[p.lv - 1] }
      : { ...sp, left: sp.left ?? MINE_STOCK[p.lv - 1] }
  if (p.kind === 'boss')
    return sp.until && sp.until <= now ? { hp: BOSSES[p.lv]!.str } : { ...sp, hp: sp.hp ?? BOSSES[p.lv]?.str }
  return sp
}
// Một "lát" của yêu vương ở điểm i: đội đánh gặp đúng chừng này (client dùng để ước lượng tỉ lệ thắng)
export function bossSlice(a: Atlas, i: number): Side | null {
  const p = a.points[i],
    boss = p && BOSSES[p.lv]
  if (!boss || p.kind !== 'boss') return null
  const type = TYPES[i % TYPES.length]
  return mob(
    boss.str / boss.slices,
    boss.tier,
    [
      [type, 0.5],
      [BEATS[type], 0.3],
      [BEATS[BEATS[type]], 0.2],
    ],
    1 + p.lv * 10,
  )
}

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

type Arrived = { changed: Players; world: World }

// Các đội tới điểm cùng lúc (một đội, hoặc cả nhóm kết trận): khai mỏ, đánh yêu vương, hay chiếm điểm
export function spotArrive(ps: Players, w: World, map: MapCtx, group: Party, at: number): Arrived {
  const m = group[0][2]
  const sp = spotOf(w, map, m.target.i, at)
  const back = (): Arrived => ({
    changed: new Map(group.map(([p2, s2, m2]) => [p2, turnBack(s2, m2, at)])),
    world: w,
  })
  if (m.task === 'gather') return !sp.left || (sp.until ?? 0) > at ? back() : gather(w, map, group[0], sp, at)
  if (m.task === 'hit')
    return !BOSSES[map.atlas.points[m.target.i].lv] || (sp.until ?? 0) > at
      ? back()
      : hitBoss(ps, w, map, group, sp, at)
  return take(ps, w, map, group, sp, at) ?? back()
}

// Bên đánh: một đội, hoặc cả nhóm kết trận gộp làm một (công pháp của đội mở trận)
function attackers(group: Party) {
  const [, att, m] = group[0]
  const parts = group.map(([, s2, m2]) => sideOf(s2, m2.elder, compact(m2.army)))
  const { side, at: offs } = combine(parts)
  return { parts, side, offs, leadSnap: snap(side, m.elder, elderLevel(att.elders[m.elder])) }
}

// Khai mỏ: mang về theo sức mang (linh triều ở vùng này khai nhanh hơn); mỏ cạn thì hồi đầy sau MINE_RESPAWN
function gather(w: World, map: MapCtx, [pid, att, m]: Party[number], sp: Spot, at: number): Arrived {
  const i = m.target.i,
    p = map.atlas.points[i]
  const amount = Math.min(carryOf(m.army), sp.left!)
  const t = tide(map.atlas, at)
  const rate = MINE_RATE[p.lv - 1] * (t.active && t.region === p.region ? 1 + TIDE_MINE : 1)
  const end = at + Math.round((amount / rate) * HOUR)
  const res = RESOURCES[i % RESOURCES.length]
  const changed: Players = new Map()
  changed.set(
    pid,
    withMarch(att, {
      ...m,
      mine: { end, amount, res },
      back: m.army,
      hurt: {},
      gain: { res: { [res]: amount }, items: {}, exp: 0 },
      returnAt: end + travel(m),
    }),
  )
  const left = sp.left! - amount
  return { changed, world: setSpot(w, i, left > 0 ? { left } : { left: 0, until: at + MINE_RESPAWN }) }
}

// Yêu vương: kho máu chung, mỗi đội đánh một lát; sát thương chia theo lực chiến góp vào. Hạ thì thưởng qua thư, rồi hồi sinh
function hitBoss(ps: Players, w: World, map: MapCtx, group: Party, sp: Spot, at: number): Arrived {
  const m = group[0][2]
  const i = m.target.i,
    p = map.atlas.points[i]
  const { parts, side: mine, offs: aOffs, leadSnap: lead0 } = attackers(group)
  const changed: Players = new Map()
  const boss = BOSSES[p.lv]!
  const slice = bossSlice(map.atlas, i)!
  const f = fight(mine, slice, m.seed)
  const last = f.rounds.at(-1)
  const k = TIER[boss.tier].stat
  const dmg = Math.round(slice.troops.reduce((sum, t, g) => sum + (t.n - (last?.n[1][g] ?? t.n)) * k, 0))
  // sát thương của từng đội theo phần lực chiến góp vào
  const mights = parts.map(x => might(x)),
    total = mights.reduce((a, b) => a + b, 0) || 1
  const dmgs = { ...sp.dmg }
  group.forEach(([p2, s2, m2], j) => {
    const mine2 = Math.round((dmg * mights[j]) / total)
    dmgs[p2] = (dmgs[p2] ?? 0) + mine2
    const { left, hurt } = split(m2, last?.n[0] ?? mine.troops.map(t => t.n), aOffs[j])
    const exp = Math.round((mine2 / 20) * (1 + lead(s2, m2.elder, 'exp')))
    let x = pushReport(s2, {
      at,
      kind: 'spot',
      i,
      spot: p.kind,
      win: f.win,
      hurt,
      dead: {},
      gain: { ...noGain(), exp },
      fights: [{ a: lead0, b: snap(slice, undefined, 1 + p.lv * 10), rounds: f.rounds }],
    })
    x = withMarch(x, {
      ...m2,
      back: left,
      hurt,
      gain: { ...noGain(), exp },
      report: x.nextId - 1,
      returnAt: at + travel(m2),
    })
    changed.set(p2, x)
  })
  const hp = (sp.hp ?? boss.str) - dmg
  if (hp > 0) return { changed, world: setSpot(w, i, { hp, dmg: dmgs }) }
  // hạ yêu vương: thưởng chia theo sát thương (qua thư); người đánh nhiều nhất nhận trưởng lão (nếu có)
  const sum = Object.values(dmgs).reduce((a, b) => a + b, 0) || 1
  Object.entries(dmgs)
    .sort((a, b) => b[1] - a[1])
    .forEach(([id2, d], n) => {
      const who = Number(id2),
        st = changed.get(who) ?? ps.get(who)
      if (!st) return
      const share = d / sum
      const gift: Reward = {
        res: Object.fromEntries(RESOURCES.map(r => [r, Math.floor((boss.reward.res?.[r] ?? 0) * share)])),
        items: Object.fromEntries(
          Object.entries(boss.reward.items ?? {}).map(([pk, v]) => [
            pk,
            Math.max(n === 0 ? 1 : 0, Math.floor(v! * share)),
          ]),
        ),
        ...(n === 0 && boss.reward.elder && st.elders[boss.reward.elder] === undefined && { elder: boss.reward.elder }),
      }
      changed.set(who, mail(st, { at, k: 'boss', a: [p.lv, n + 1, Math.round(share * 100)], gift }))
    })
  let dead = setSpot(w, i, { until: at + boss.respawn })
  for (const [id2, d] of Object.entries(dmgs))
    dead = bank(dead, sideKey(w, Number(id2)), ((SEASON_BOSS[p.lv] ?? 0) * d) / sum)
  return { changed, world: dead }
}

// Chiếm điểm: trống hoặc của phe mình → đóng quân (tới khi đầy; đầy rồi thì null: quay về); của phe khác → đánh cả quân đang đóng
function take(ps: Players, w: World, map: MapCtx, group: Party, sp: Spot, at: number): Arrived | null {
  const [pid, att, m] = group[0]
  const i = m.target.i,
    p = map.atlas.points[i]
  const me = sideKey(w, pid)
  const { side: mine, offs: aOffs, leadSnap: lead0 } = attackers(group)
  const changed: Players = new Map()
  const gar = garrison(ps, i)
  const foes = gar.filter(([id2]) => sideKey(w, id2) !== me)
  const station = (list: Party, n0?: number[]) => {
    let room = GARRISON_MAX - gar.filter(([id2]) => sideKey(w, id2) === me).length
    list.forEach(([p2, s2, m2], j) => {
      const d = n0 ? split(m2, n0, aOffs[j]) : { left: m2.army, hurt: {} }
      const cur2 = changed.get(p2) ?? s2
      changed.set(
        p2,
        room-- > 0
          ? withMarch(cur2, { ...m2, army: d.left, hurt: addArmy(m2.hurt, d.hurt), stay: true })
          : turnBack(
              withMarch(cur2, { ...m2, army: d.left, hurt: addArmy(m2.hurt, d.hurt) }),
              { ...m2, army: d.left },
              at,
            ),
      )
    })
  }
  if (!foes.length) {
    if (gar.length >= GARRISON_MAX) return null
    station(group)
    return { changed, world: sp.own === me ? w : hold(w, map, i, { own: me, since: at }, at) }
  }
  const { side: def, at: offs } = combine(foes.map(([id2, x]) => sideOf(ps.get(id2)!, x.elder, compact(x.army))))
  const f = fight(mine, def, m.seed)
  const last = f.rounds.at(-1)
  const n0 = last?.n[0] ?? mine.troops.map(t => t.n),
    n1 = last?.n[1] ?? def.troops.map(t => t.n)
  const dSnap = snap(def, foes[0][1].elder, elderLevel(ps.get(foes[0][0])!.elders[foes[0][1].elder]))
  group.forEach(([p2, s2, m2], j) => {
    const a = split(m2, n0, aOffs[j])
    changed.set(
      p2,
      pushReport(s2, {
        at,
        kind: 'spot',
        i,
        spot: p.kind,
        foe: ps.get(foes[0][0])!.name,
        win: f.win,
        hurt: a.hurt,
        dead: {},
        gain: noGain(),
        fights: [{ a: lead0, b: dSnap, rounds: f.rounds }],
      }),
    )
  })
  if (f.win) station(group, n0)
  else
    group.forEach(([p2, , m2], j) => {
      const a = split(m2, n0, aOffs[j])
      changed.set(
        p2,
        withMarch(changed.get(p2)!, {
          ...m2,
          back: a.left,
          hurt: addArmy(m2.hurt, a.hurt),
          gain: noGain(),
          returnAt: at + travel(m2),
        }),
      )
    })
  const flip = flipRounds(f.rounds)
  foes.forEach(([id2, x], j) => {
    const st = changed.get(id2) ?? ps.get(id2)!
    const d = split(x, n1, offs[j])
    const hurt = addArmy(x.hurt, d.hurt)
    let ds = pushReport(st, {
      at,
      kind: 'spot',
      i,
      spot: p.kind,
      foe: att.name,
      def: true,
      win: !f.win,
      hurt: d.hurt,
      dead: {},
      gain: noGain(),
      fights: [{ a: dSnap, b: lead0, rounds: flip }],
    })
    // bị đánh bật: về nhà với phần còn lại; giữ được: ở lại, bớt quân
    ds = withMarch(
      ds,
      f.win
        ? { ...x, stay: false, back: d.left, hurt, gain: noGain(), report: ds.nextId - 1, returnAt: at + travel(x) }
        : { ...x, army: d.left, hurt },
    )
    changed.set(id2, ds)
  })
  return { changed, world: f.win ? hold(w, map, i, { own: me, since: at }, at) : w }
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
  for (const [pid, s] of ps) {
    if (!s.seat) continue
    const v = Math.min(VEIN_CAP, veins.get(sideKey(w, pid)) ?? 0)
    const want: Buff[] = [
      ...(v ? [{ key: 'prod' as const, v, until: 0, src: 'vein' }] : []),
      ...(t.active && regionOf(map.atlas, s.seat) === t.region
        ? [{ key: 'prod' as const, v: TIDE_PROD, until: t.end, src: `tide${t.cycle}` }]
        : []),
    ]
    const keep = s.buffs.filter(b => b.src !== 'vein' && !b.src.startsWith('tide'))
    const have = s.buffs.filter(b => b.src === 'vein' || b.src.startsWith('tide'))
    if (JSON.stringify(have) === JSON.stringify(want)) continue
    const st = advance(s, at) // sản lượng trước lúc đổi tính theo buff cũ
    changed.set(pid, { ...st, buffs: [...keep, ...want] })
  }
  return changed
}
