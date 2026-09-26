// Đóng trại ở ô trống (Encamp của RoK): gửi một đội tới một ô trống bất kỳ trên bản đồ giới đứng chốt — dàn trận gần mục tiêu,
// chặn đường vào lãnh thổ. Trại ở ngoài trời: phe khác (không cùng minh / minh ước, cả hai từ tầng Tranh đoạt) xuất quân đánh
// được — thắng thì trại tan, đội trại về với phần còn lại; thua thì trại đứng, bớt quân. Đánh trại mất khiên, nổi sát khí như đi
// cướp. Gọi trại về như đội đóng ở điểm (spots.ts recall).
// Tàng Bảo Đồ (Treasure Hunt của RoK) cũng đi tới ô trống: ghép DIG_FRAGS tàn phiến thành một điểm đào (digMap, mầm server), xuất quân
// tới đào (dig) — tới nơi nhận quà qua thư, đội về ngay.
import { MAP_W, regionOf, route, sitesOf } from '../atlas.ts'
import { fight } from '../combat.ts'
import { no } from '../core/action.ts'
import { fieldError, launch, marchSide, marchSnap, pushReport } from '../core/battle.ts'
import { cellOf, clear, fogOf } from '../core/fog.ts'
import { int, isElder, isId, pickArmy } from '../core/parse.ts'
import { unitOf } from '../core/stats.ts'
import type { Army, March, State } from '../core/types.ts'
import { compact, nextSeed, noGain } from '../core/util.ts'
import {
  DIG_FRAGS,
  DIG_LOOT,
  DIG_MAX,
  DIG_R,
  FESTS,
  FRENZY_TIME,
  GOODS_CYCLE,
  GOODS_GIFTS,
  GOODS_ODDS,
  GOODS_R,
  RUNE_HOURS,
  RUNE_KINDS,
  RUNE_TIERS,
  PVP_HALL,
  TIER,
  UNITS,
  type ElderId,
  type Reward,
} from '../data.ts'
import { mail } from '../sect/inbox.ts'
import {
  addKp,
  farErr,
  napBetween,
  routeMs,
  sideKey,
  travel,
  turnBack,
  withMarch,
  type Party,
  type Players,
  type World,
  type WorldActions,
} from './base.ts'
import { addArmy, flipRounds, split } from './fight.ts'
import { festWindow } from '../core/fest.ts'
import type { Atlas } from '../atlas.ts'
import { nearTile, occupied, runeCycle, runesLeft } from './points.ts'

export type EncampAction =
  | { type: 'camp'; x: number; y: number; elder: ElderId; army: Army }
  | { type: 'hitCamp'; pid: number; id: number; elder: ElderId; army: Army }
  | { type: 'digMap' } // ghép Tàng Bảo Đồ: DIG_FRAGS tàn phiến → một điểm đào
  | { type: 'dig'; x: number; y: number; elder: ElderId; army: Army }
  | { type: 'rune'; x: number; y: number; elder: ElderId; army: Army } // nhặt phù văn ở ô (x, y)
  | { type: 'caravan'; x: number; y: number; elder: ElderId; army: Army } // nhặt kiện hàng rơi ở ô (x, y)

export const campTile = (x: number, y: number) => y * MAP_W + x
// Thương Đội Gặp Nạn: kỳ lễ thuongDoi đang mở (lịch chung cả giới); hàng rơi của chu kỳ cyc — quanh mỗi thôn trang 1/GOODS_ODDS rơi
// một kiện (phẩm 0 thường 60 %, 1 tốt 30 %, 2 quý 10 %); kiện còn (chưa ai nhặt) lúc t
export const goodsOn = (t: number) => !!festWindow({}, FESTS.thuongDoi, t)
export const goodsCycle = (t: number) => Math.floor(t / GOODS_CYCLE)
export type Goods = { i: number; x: number; y: number; t: number }
export function goodsAt(a: Atlas, cyc: number): Goods[] {
  const taken = occupied(a)
  const out: Goods[] = []
  for (const st of sitesOf(a)) {
    const at = st.kind === 'village' ? nearTile(a, st, cyc, 0x51ed270b, GOODS_R, taken) : null
    if (!at || at.next() % GOODS_ODDS) continue
    const r = at.next() % 10
    out.push({ i: out.length, x: at.x, y: at.y, t: r < 6 ? 0 : r < 9 ? 1 : 2 })
  }
  return out
}
export function goodsLeft(w: World, a: Atlas, t: number): Goods[] {
  if (!goodsOn(t)) return []
  const cyc = goodsCycle(t)
  const got = w.goods?.cyc === cyc ? w.goods.got : []
  return goodsAt(a, cyc).filter(g => !got.includes(g.i))
}
const tilePos = (i: number) => ({ x: i % MAP_W, y: Math.floor(i / MAP_W) })
// trại đang đứng: đội đã tới ô, đứng lại
export const campMarch = (s: State, id: number) =>
  s.marches.find(x => x.id === id && x.target.kind === 'camp' && x.stay)
const pow = (a: Army) => UNITS.reduce((n, u) => n + (a[u] ?? 0) * TIER[unitOf(u).tier].power, 0)
const pickSend = (a: Record<string, unknown>) => {
  const army = pickArmy(a.army)
  return isElder(a.elder) && army ? { elder: a.elder, army } : null
}

// Quà một lần đào: theo trọng số DIG_LOOT, mầm của đội
function digLoot(seed: number): Reward {
  let x = (nextSeed(seed >>> 0 || 1) / 2 ** 32) * DIG_LOOT.reduce((a, q) => a + q.w, 0)
  return (DIG_LOOT.find(q => (x -= q.w) < 0) ?? DIG_LOOT[0]).r
}

export const encampActions: WorldActions<EncampAction> = {
  camp: {
    pick: a => {
      const e = pickSend(a)
      return e && int(0, MAP_W - 1)(a.x) && int(0, MAP_W - 1)(a.y) ? { type: 'camp', x: a.x, y: a.y, ...e } : null
    },
    run: ({ ps, w, pid, s, map, seed }, a) => {
      if (!map || !s.seat) return no('gone')
      const here = (p: { x: number; y: number }) => p.x === a.x && p.y === a.y
      if (
        map.atlas.points.some(here) ||
        sitesOf(map.atlas).some(here) ||
        Object.values(w.flags ?? {}).some(here) ||
        [...ps.values()].some(o => o.seat && here(o.seat))
      )
        return no('taken')
      const c = cellOf({ x: a.x, y: a.y })
      if (!clear(fogOf(s), c.cx, c.cy, s.time)) return no('locked') // ô còn mê vụ: phải khai trước
      const i = campTile(a.x, a.y)
      if (s.marches.some(m => m.target.kind === 'camp' && m.target.i === i)) return no('busy')
      const e = fieldError(s, a.elder, a.army)
      if (e) return no(e)
      const r = route(map.atlas, s.seat, { x: a.x, y: a.y }, map.phase, map.shut)
      if (!r) return no(farErr(map, s.seat, { x: a.x, y: a.y }))
      const army = compact(a.army),
        t = s.time
      const m: March = {
        id: s.nextId,
        elder: a.elder,
        army,
        target: { kind: 'camp', i },
        seed,
        startAt: t,
        arriveAt: t + routeMs(s, r.len, army),
        returnAt: 0,
        path: r.path,
      }
      return { ok: true, world: w, changed: new Map([[pid, launch(s, army, m)]]) }
    },
  },
  digMap: {
    pick: () => ({ type: 'digMap' }),
    run: ({ ps, w, pid, s, map, seed }) => {
      if (!map || !s.seat) return no('gone')
      if ((s.items.baoDo ?? 0) < DIG_FRAGS) return no('not_enough')
      if ((s.digs?.length ?? 0) >= DIG_MAX) return no('full')
      const here = (x: number, y: number) => (p: { x: number; y: number }) => p.x === x && p.y === y
      const taken = (x: number, y: number) =>
        map.atlas.points.some(here(x, y)) ||
        sitesOf(map.atlas).some(here(x, y)) ||
        Object.values(w.flags ?? {}).some(here(x, y)) ||
        [...ps.values()].some(o => (o.seat && here(x, y)(o.seat)) || o.digs?.some(here(x, y)))
      // ô trống ngẫu nhiên trong DIG_R ô quanh tông môn, cùng vùng (luôn đi tới được), không sát mép (mầm server)
      const home = regionOf(map.atlas, s.seat)
      let r = seed >>> 0 || 1
      for (let k = 0; k < 60; k++) {
        r = nextSeed(r)
        const x = s.seat.x + (r % (2 * DIG_R + 1)) - DIG_R
        r = nextSeed(r)
        const y = s.seat.y + (r % (2 * DIG_R + 1)) - DIG_R
        if (x < 1 || y < 1 || x >= MAP_W - 1 || y >= MAP_W - 1 || taken(x, y)) continue
        if (regionOf(map.atlas, { x, y }) !== home) continue
        const st = {
          ...s,
          items: { ...s.items, baoDo: s.items.baoDo! - DIG_FRAGS },
          digs: [...(s.digs ?? []), { x, y }],
        }
        return { ok: true, world: w, changed: new Map([[pid, st]]) }
      }
      return no('busy')
    },
  },
  dig: {
    pick: a => {
      const e = pickSend(a)
      return e && int(0, MAP_W - 1)(a.x) && int(0, MAP_W - 1)(a.y) ? { type: 'dig', x: a.x, y: a.y, ...e } : null
    },
    run: ({ w, pid, s, map, seed }, a) => {
      if (!map || !s.seat || !s.digs?.some(d => d.x === a.x && d.y === a.y)) return no('gone')
      const i = campTile(a.x, a.y)
      if (s.marches.some(m => m.dig && m.target.i === i)) return no('busy')
      const e = fieldError(s, a.elder, a.army)
      if (e) return no(e)
      const r = route(map.atlas, s.seat, { x: a.x, y: a.y }, map.phase, map.shut)
      if (!r) return no(farErr(map, s.seat, { x: a.x, y: a.y }))
      const army = compact(a.army),
        t = s.time
      const m: March = {
        id: s.nextId,
        elder: a.elder,
        army,
        target: { kind: 'camp', i },
        dig: true,
        seed,
        startAt: t,
        arriveAt: t + routeMs(s, r.len, army),
        returnAt: 0,
        path: r.path,
      }
      return { ok: true, world: w, changed: new Map([[pid, launch(s, army, m)]]) }
    },
  },
  rune: {
    pick: a => {
      const e = pickSend(a)
      return e && int(0, MAP_W - 1)(a.x) && int(0, MAP_W - 1)(a.y) ? { type: 'rune', x: a.x, y: a.y, ...e } : null
    },
    run: ({ w, pid, s, map, seed }, a) => {
      if (!map || !s.seat) return no('gone')
      const r = runesLeft(w, map.atlas, s.time).find(q => q.x === a.x && q.y === a.y)
      if (!r) return no('gone')
      const i = campTile(a.x, a.y)
      if (s.marches.some(m => m.rune && m.target.i === i)) return no('busy')
      const e = fieldError(s, a.elder, a.army)
      if (e) return no(e)
      const rt = route(map.atlas, s.seat, { x: a.x, y: a.y }, map.phase, map.shut)
      if (!rt) return no(farErr(map, s.seat, { x: a.x, y: a.y }))
      const army = compact(a.army),
        t = s.time
      const m: March = {
        id: s.nextId,
        elder: a.elder,
        army,
        target: { kind: 'camp', i },
        rune: { i: r.i, cyc: runeCycle(t), k: r.k, t: r.t },
        seed,
        startAt: t,
        arriveAt: t + routeMs(s, rt.len, army),
        returnAt: 0,
        path: rt.path,
      }
      return { ok: true, world: w, changed: new Map([[pid, launch(s, army, m)]]) }
    },
  },
  caravan: {
    pick: a => {
      const e = pickSend(a)
      return e && int(0, MAP_W - 1)(a.x) && int(0, MAP_W - 1)(a.y) ? { type: 'caravan', x: a.x, y: a.y, ...e } : null
    },
    run: ({ w, pid, s, map, seed }, a) => {
      if (!map || !s.seat) return no('gone')
      const r = goodsLeft(w, map.atlas, s.time).find(q => q.x === a.x && q.y === a.y)
      if (!r) return no('gone')
      const i = campTile(a.x, a.y)
      if (s.marches.some(m => m.goods && m.target.i === i)) return no('busy')
      const e = fieldError(s, a.elder, a.army)
      if (e) return no(e)
      const rt = route(map.atlas, s.seat, { x: a.x, y: a.y }, map.phase, map.shut)
      if (!rt) return no(farErr(map, s.seat, { x: a.x, y: a.y }))
      const army = compact(a.army),
        t = s.time
      const m: March = {
        id: s.nextId,
        elder: a.elder,
        army,
        target: { kind: 'camp', i },
        goods: { i: r.i, cyc: goodsCycle(t), t: r.t },
        seed,
        startAt: t,
        arriveAt: t + routeMs(s, rt.len, army),
        returnAt: 0,
        path: rt.path,
      }
      return { ok: true, world: w, changed: new Map([[pid, launch(s, army, m)]]) }
    },
  },
  hitCamp: {
    pick: a => {
      const e = pickSend(a)
      return e && isId(a.pid) && isId(a.id) ? { type: 'hitCamp', pid: a.pid, id: a.id, ...e } : null
    },
    run: ({ ps, w, pid, s, map, seed }, a) => {
      const d = ps.get(a.pid)
      const vm = d && campMarch(d, a.id)
      if (!map || !s.seat || !d || !vm) return no('gone')
      if (a.pid === pid || sideKey(w, pid) === sideKey(w, a.pid) || napBetween(w, pid, a.pid)) return no('friend')
      if (s.levels.chuDien < PVP_HALL || d.levels.chuDien < PVP_HALL) return no('locked')
      const e = fieldError(s, a.elder, a.army)
      if (e) return no(e)
      const to = tilePos(vm.target.i)
      const r = route(map.atlas, s.seat, to, map.phase, map.shut)
      if (!r) return no(farErr(map, s.seat, to))
      const army = compact(a.army),
        t = s.time
      const m: March = {
        id: s.nextId,
        elder: a.elder,
        army,
        target: { kind: 'camp', i: vm.target.i },
        prey: { pid: a.pid, id: a.id },
        foe: d.name,
        seed,
        startAt: t,
        arriveAt: t + routeMs(s, r.len, army),
        returnAt: 0,
        path: r.path,
      }
      // như đi cướp: mất khiên, nổi sát khí
      return {
        ok: true,
        world: w,
        changed: new Map([[pid, { ...launch(s, army, m), shield: 0, frenzy: t + FRENZY_TIME }]]),
      }
    },
  },
}

// Đội tới ô trại (advance.ts): đội dựng trại thì đứng lại; đội đánh trại thì giao chiến nếu trại còn đứng ở đó (không thì về)
export function campArrive(ps: Players, w: World, [pid, att, m]: Party[number], at: number) {
  if (m.dig) return digArrive(w, [pid, att, m], at)
  if (m.rune) return runeArrive(w, [pid, att, m], at)
  if (m.goods) return goodsArrive(w, [pid, att, m], at)
  if (!m.prey) return { changed: new Map([[pid, withMarch(att, { ...m, stay: true })]]) as Players, world: w }
  const d = ps.get(m.prey.pid)
  const vm = d && campMarch(d, m.prey.id)
  if (!d || !vm || vm.target.i !== m.target.i)
    return { changed: new Map([[pid, turnBack(att, m, at)]]) as Players, world: w }
  const me = marchSide(att, m),
    foe = marchSide(d, vm)
  const f = fight(me, foe, m.seed)
  const last = f.rounds.at(-1)
  const a = split(m, last?.n[0] ?? me.troops.map(x => x.n), 0)
  const dd = split(vm, last?.n[1] ?? foe.troops.map(x => x.n), 0)
  const aSnap = marchSnap(att, me, m),
    dSnap = marchSnap(d, foe, vm)
  const base = { at, kind: 'camp' as const, i: m.target.i, dead: {}, gain: noGain() }
  const x = pushReport(att, {
    ...base,
    foe: d.name,
    win: f.win,
    hurt: a.hurt,
    fights: [{ a: aSnap, b: dSnap, rounds: f.rounds }],
  })
  const y = pushReport(d, {
    ...base,
    foe: att.name,
    def: true,
    win: !f.win,
    hurt: dd.hurt,
    fights: [{ a: dSnap, b: aSnap, rounds: flipRounds(f.rounds) }],
  })
  const hurt = addArmy(vm.hurt, dd.hurt)
  const beaten: March = f.win
    ? { ...vm, stay: false, back: dd.left, hurt, gain: noGain(), report: y.nextId - 1, returnAt: at + travel(vm) }
    : { ...vm, army: dd.left, hurt }
  const home = { ...m, back: a.left, hurt: a.hurt, gain: noGain(), report: x.nextId - 1, returnAt: at + travel(m) }
  return {
    changed: new Map([
      [pid, addKp(withMarch(x, home), pow(dd.hurt))],
      [m.prey.pid, addKp(withMarch(y, beaten), pow(a.hurt))],
    ]) as Players,
    world: w,
  }
}

// Đội đào tới điểm đào: điểm còn (chưa ai đào) thì nhận quà qua thư, điểm biến mất; đội về ngay
function digArrive(w: World, [pid, att, m]: Party[number], at: number) {
  const { x, y } = tilePos(m.target.i)
  const back = turnBack(att, m, at)
  if (!att.digs?.some(d => d.x === x && d.y === y)) return { changed: new Map([[pid, back]]) as Players, world: w }
  const st = mail(
    { ...back, digs: back.digs!.filter(d => d.x !== x || d.y !== y) },
    { at, k: 'dig', a: [x, y], gift: digLoot(m.seed) },
  )
  return { changed: new Map([[pid, st]]) as Players, world: w }
}

// Đội nhặt phù văn tới nơi: phù văn còn (cùng chu kỳ, chưa ai nhặt) thì có tăng ích RUNE_HOURS giờ (thay phù văn cũ), đánh dấu đã nhặt; đội
// về ngay
function runeArrive(w: World, [pid, att, m]: Party[number], at: number) {
  const r = m.rune!
  const back = turnBack(att, m, at)
  const got = w.runes?.cyc === r.cyc ? w.runes.got : []
  if (runeCycle(at) !== r.cyc || got.includes(r.i)) return { changed: new Map([[pid, back]]) as Players, world: w }
  const buff = { key: RUNE_KINDS[r.k], v: RUNE_TIERS[r.t], until: at + RUNE_HOURS * 3_600_000, src: 'rune' }
  const st = {
    ...back,
    buffs: [...back.buffs.filter(b => b.src !== 'rune'), buff],
    stats: { ...back.stats, runes: (back.stats.runes ?? 0) + 1 },
  }
  return { changed: new Map([[pid, st]]) as Players, world: { ...w, runes: { cyc: r.cyc, got: [...got, r.i] } } }
}

// Đội nhặt hàng tới nơi: kiện còn (cùng chu kỳ, chưa ai nhặt) thì nhận quà theo phẩm qua thư, đánh dấu đã nhặt; đội về ngay
function goodsArrive(w: World, [pid, att, m]: Party[number], at: number) {
  const g = m.goods!
  const back = turnBack(att, m, at)
  const got = w.goods?.cyc === g.cyc ? w.goods.got : []
  if (goodsCycle(at) !== g.cyc || got.includes(g.i)) return { changed: new Map([[pid, back]]) as Players, world: w }
  const { x, y } = tilePos(m.target.i)
  const st = mail(
    { ...back, stats: { ...back.stats, goods: (back.stats.goods ?? 0) + 1 } },
    { at, k: 'goods', a: [x, y, g.t], gift: GOODS_GIFTS[g.t] },
  )
  return { changed: new Map([[pid, st]]) as Players, world: { ...w, goods: { cyc: g.cyc, got: [...got, g.i] } } }
}
