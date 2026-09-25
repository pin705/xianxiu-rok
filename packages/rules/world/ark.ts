// Tranh Đoạt Linh Châu (Ark of Osiris giản lược — doc 6 mục 3.2 bước 2): tiên minh đấu tiên minh trên chiến trường 5 ô theo hiệp.
// Ghi danh cả tuần (trưởng lão / minh chủ); 20h Chủ nhật server dựng trận (arkStep), mỗi ARK_ROUND giải một hiệp tất định: đội đi
// theo lệnh đứng, ô có hai bên thì đánh, chiếm / giữ ra điểm, Linh Châu hộ tống về Tiểu Trận mình giữ. Hết hiệp cuối: quà + điểm minh chiến.
import { fight, type Side } from '../combat.ts'
import { no } from '../core/action.ts'
import { weekOf } from '../core/calendar.ts'
import { int } from '../core/parse.ts'
import { power } from '../core/stats.ts'
import type { State } from '../core/types.ts'
import { DAY } from '../core/util.ts'
import {
  ARK_ADJ,
  ARK_CHARGE,
  ARK_DAY,
  ARK_HOLD,
  ARK_HOLD_DEF,
  ARK_HOUR,
  ARK_LOSE,
  ARK_MAX,
  ARK_MIN,
  ARK_ORB_AT,
  ARK_ROUND,
  ARK_ROUNDS,
  ARK_TAKE,
  ARK_WIN,
  DAY_OFFSET,
  PVP_HALL,
  PVP_START,
} from '../data.ts'
import { arenaSide, lineupOf } from '../sect/arena.ts'
import { mail } from '../sect/inbox.ts'
import {
  allyOf,
  elo,
  type Alliance,
  type Ark,
  type ArkFight,
  type ArkUnit,
  type Players,
  type World,
  type WorldActions,
} from './base.ts'
import { combine } from './fight.ts'

// Lúc dựng trận tuần wk (20h Chủ nhật giờ VN); hiệp r (1..ARK_ROUNDS) giải lúc start + r × ARK_ROUND
export const arkAt = (wk: number) => (wk * 7 + 4 + ARK_DAY) * DAY - DAY_OFFSET + ARK_HOUR * 3_600_000
export const arkOf = (w: World): Ark => w.ark ?? { on: -1, done: -1, signed: [], live: [], last: [] }
const home = (side: 0 | 1) => (side ? 4 : 0)
// Chiến binh: người tầng ≥ PVP_HALL, lực chiến cao trước, tối đa ARK_MAX
const warriors = (al: Alliance, ps: Players) =>
  Object.keys(al.members)
    .map(Number)
    .filter(p => (ps.get(p)?.levels.chuDien ?? 0) >= PVP_HALL)
    .sort((x, y) => power(ps.get(y)!) - power(ps.get(x)!) || x - y)
    .slice(0, ARK_MAX)
// Ô kế tiếp trên đường ngắn nhất from → to (không đi qua Linh Đài bên kia)
function hop(from: number, to: number, side: 0 | 1): number {
  if (from === to) return from
  const ban = home(side ? 0 : 1)
  const prev = new Map<number, number>([[from, from]])
  const queue = [from]
  while (queue.length) {
    const x = queue.shift()!
    for (const y of ARK_ADJ[x])
      if (y !== ban && !prev.has(y)) {
        prev.set(y, x)
        queue.push(y)
      }
  }
  let at = to
  while (prev.get(at) !== from && prev.has(at)) at = prev.get(at)!
  return prev.has(at) ? at : from
}
// Đội của một người trên chiến trường: đội đầu đội hình Luận Kiếm Đài, quân còn lại n ([] = đủ)
function sideOfUnit(ps: Players, u: ArkUnit): Side | null {
  const s = ps.get(u.pid)
  const team = s && lineupOf(s)[0]
  if (!s || !team) return null
  const full = arenaSide(s, team)
  return u.n.length ? { ...full, troops: full.troops.map((t, k) => ({ ...t, n: u.n[k] ?? t.n })) } : full
}
const strength = (ps: Players, u: ArkUnit) => sideOfUnit(ps, u)?.troops.reduce((n, t) => n + t.n, 0) ?? 0

export type ArkAction = { type: 'arkSign' } | { type: 'arkUnsign' } | { type: 'arkOrder'; to: number; all?: boolean }
const officer = (w: World, pid: number) => {
  const al = allyOf(w, pid)
  return al && al.members[pid] >= 1 ? al : undefined
}
export const arkActions: WorldActions<ArkAction> = {
  arkSign: {
    pick: () => ({ type: 'arkSign' }),
    run: ({ ps, w, pid }) => {
      const al = officer(w, pid)
      if (!al) return no('locked')
      const ark = arkOf(w)
      if (ark.signed.includes(al.id)) return no('claimed')
      if (warriors(al, ps).length < ARK_MIN) return no('weak')
      return { ok: true, changed: new Map(), world: { ...w, ark: { ...ark, signed: [...ark.signed, al.id] } } }
    },
  },
  arkUnsign: {
    pick: () => ({ type: 'arkUnsign' }),
    run: ({ w, pid }) => {
      const al = officer(w, pid)
      const ark = arkOf(w)
      if (!al || !ark.signed.includes(al.id)) return no('locked')
      return {
        ok: true,
        changed: new Map(),
        world: { ...w, ark: { ...ark, signed: ark.signed.filter(x => x !== al.id) } },
      }
    },
  },
  // lệnh đứng: đội mình (hay cả minh — trưởng lão / minh chủ) tới ô `to` (Linh Đài mình, Tiểu Trận, Trung Điện)
  arkOrder: {
    pick: a =>
      int(0, 4)(a.to) ? { type: 'arkOrder', to: a.to as number, ...(a.all === true && { all: true }) } : null,
    run: ({ w, pid }, a) => {
      const ark = arkOf(w)
      const k = ark.live.findIndex(f => f.units.some(u => u.pid === pid))
      if (k < 0) return no('locked')
      const f = ark.live[k]
      const me = f.units.find(u => u.pid === pid)!
      if (a.to === home(me.side ? 0 : 1)) return no('bad') // Linh Đài bên kia: không vào được
      if (a.all && !officer(w, pid)) return no('locked')
      const units = f.units.map(u => ((a.all ? u.side === me.side : u.pid === pid) ? { ...u, to: a.to } : u))
      const live = ark.live.map((x, j) => (j === k ? { ...f, units } : x))
      return { ok: true, changed: new Map(), world: { ...w, ark: { ...ark, live } } }
    },
  },
}

// Dựng một trận: đội ở Linh Đài mình, lệnh mặc định tới Trung Điện
function setup(ps: Players, A: Alliance, B: Alliance): ArkFight {
  const units = ([A, B] as const).flatMap((al, side) =>
    warriors(al, ps).map(pid => ({ pid, side: side as 0 | 1, at: home(side as 0 | 1), to: 2, n: [] })),
  )
  return {
    a: A.id,
    b: B.id,
    an: A.tag,
    bn: B.tag,
    round: 0,
    units,
    own: [0, null, null, null, 1],
    pts: [0, 0],
    taken: [[], []],
    charged: [[], []],
    orb: null,
    log: [],
  }
}

// Một hiệp r: đi → đánh → chiếm / giữ → Linh Châu. seed: mầm của server (tất định từ đây)
export function arkRound(ps: Players, f0: ArkFight, seed: number): ArkFight {
  const r = f0.round + 1
  const f: ArkFight = { ...f0, round: r, pts: [...f0.pts], own: [...f0.own], log: [...f0.log] }
  const orb = f0.orb && { ...f0.orb }
  const active = (u: ArkUnit) => !u.rest || u.rest < r
  // Linh Châu về Trung Điện sau một hiệp nạp
  if (orb?.back !== undefined && orb.back <= r - 1) Object.assign(orb, { at: 2, back: undefined, by: undefined })
  // 1. đi: người mang Châu tới Tiểu Trận mình giữ chưa nạp gần nhất; còn lại theo lệnh
  const goal = (u: ArkUnit) => {
    if (orb?.by !== u.pid) return u.to
    const ok = [1, 3].filter(x => f.own[x] === u.side && !f.charged[u.side].includes(x))
    return ok.sort((x, y) => Number(hop(u.at, x, u.side) !== x) - Number(hop(u.at, y, u.side) !== y))[0] ?? u.at
  }
  let units = f0.units.map(u => (active(u) ? { ...u, at: hop(u.at, goal(u), u.side), rest: undefined } : u))
  if (orb?.by !== undefined) orb.at = units.find(u => u.pid === orb.by)?.at ?? orb.at
  // 2. đánh ở mỗi ô có hai bên (bên giữ ô được thêm thủ); bên thua về Linh Đài, nghỉ hết hiệp sau
  for (let node = 0; node < 5; node++) {
    const here = [0, 1].map(sd => units.filter(u => active(u) && u.at === node && u.side === sd && sideOfUnit(ps, u)))
    if (!here[0].length || !here[1].length) continue
    const sides = here.map((us, sd) => {
      const parts = us.map(u => sideOfUnit(ps, u)!)
      const c = combine(parts)
      const k = f.own[node] === sd ? 1 + ARK_HOLD_DEF : 1
      return { ...c, side: { ...c.side, troops: c.side.troops.map(t => ({ ...t, def: t.def * k })) } }
    })
    const res = fight(sides[0].side, sides[1].side, (seed + r * 7919 + node * 104_729) >>> 0)
    const last = res.rounds.at(-1)?.n ?? sides.map(x => x.side.troops.map(t => t.n))
    const win = res.win ? 0 : 1
    f.log.push([r, 'win', win as 0 | 1, node])
    const after = new Map<number, ArkUnit>()
    here.forEach((us, sd) =>
      us.forEach((u, j) => {
        const from = sides[sd].at[j]
        const n = (sideOfUnit(ps, u)?.troops ?? []).map((_, g) => last[sd][from + g])
        const lost = sd !== win || !n.some(x => x > 0)
        after.set(u.pid, lost ? { ...u, at: home(u.side), n: [], rest: r + 1 } : { ...u, n })
        if (lost && orb?.by === u.pid) Object.assign(orb, { by: undefined, at: node }) // Châu rơi tại ô
        if (lost && orb?.by === undefined && orb?.at === node) f.log.push([r, 'drop', u.side, node])
      }),
    )
    units = units.map(u => after.get(u.pid) ?? u)
  }
  // 3. chiếm (ô chỉ còn một bên) — lần đầu mỗi bên mỗi ô ra điểm; giữ mỗi hiệp ra điểm
  for (const node of [1, 2, 3]) {
    const sd = [0, 1].filter(x => units.some(u => active(u) && u.at === node && u.side === x))
    if (sd.length === 1 && f.own[node] !== sd[0]) {
      const s1 = sd[0] as 0 | 1
      f.own[node] = s1
      const first = !f.taken[s1].includes(node)
      if (first) f.taken = s1 ? [f.taken[0], [...f.taken[1], node]] : [[...f.taken[0], node], f.taken[1]]
      f.pts[s1] += first ? ARK_TAKE[node] : 0
      f.log.push([r, 'take', s1, node, first ? ARK_TAKE[node] : 0])
    }
    const o = f.own[node]
    if (o !== null) f.pts[o] += ARK_HOLD[node]
  }
  // 4. Linh Châu: hiện ở Trung Điện; ai giữ ô Châu nằm (không ai mang) thì đội mạnh nhất ở đó nhặt; tới ô nạp được thì nạp
  let o2 = orb
  if (!o2 && r === ARK_ORB_AT) {
    o2 = { at: 2, n: 0 }
    f.log.push([r, 'orb', 0, 2])
  }
  if (o2 && o2.by === undefined && o2.back === undefined) {
    const holder = f.own[o2.at]
    const pick = units
      .filter(u => active(u) && u.at === o2!.at && u.side === holder)
      .sort((x, y) => strength(ps, y) - strength(ps, x) || x.pid - y.pid)[0]
    if (pick) o2.by = pick.pid
  }
  const carrier = o2?.by !== undefined ? units.find(u => u.pid === o2!.by) : undefined
  if (o2 && carrier && [1, 3].includes(carrier.at) && f.own[carrier.at] === carrier.side) {
    if (!f.charged[carrier.side].includes(carrier.at)) {
      const pts = Math.round(ARK_CHARGE * 1.5 ** o2.n)
      f.pts[carrier.side] += pts
      f.charged = carrier.side
        ? [f.charged[0], [...f.charged[1], carrier.at]]
        : [[...f.charged[0], carrier.at], f.charged[1]]
      f.log.push([r, 'charge', carrier.side, carrier.at, pts])
      o2 = { at: carrier.at, n: o2.n + 1, back: r }
    }
  }
  return { ...f, units, orb: o2 ?? null }
}

// Mỗi lần server gọi (theo giờ): tới 20h Chủ nhật thì dựng trận cho các minh đã ghi danh (ghép theo điểm minh chiến), rồi giải từng
// hiệp tới hạn; hết hiệp cuối thì quà qua thư, đổi điểm minh chiến (dùng chung với Luận Kiếm Minh Chiến), lưu kết quả
export function arkStep(ps: Players, w: World, now: number, seed: number) {
  const changed: Players = new Map()
  const ark = arkOf(w)
  const wk = weekOf(now)
  const start = arkAt(wk)
  if (now < start || ark.done >= wk) return { changed, world: w }
  let next: Ark = ark
  if (ark.on < wk) {
    const pts = (id: number) => w.war?.pts[id] ?? PVP_START
    const teams = ark.signed
      .map(id => w.allies[id])
      .filter((al): al is Alliance => !!al && warriors(al, ps).length >= ARK_MIN)
      .sort((x, y) => pts(y.id) - pts(x.id) || x.id - y.id)
    const live: ArkFight[] = []
    for (let k = 0; k + 1 < teams.length; k += 2) live.push(setup(ps, teams[k], teams[k + 1]))
    next = { ...ark, on: wk, live }
  }
  const due = Math.min(ARK_ROUNDS, Math.floor((now - start) / ARK_ROUND))
  if (next.live.some(f => f.round < due))
    next = {
      ...next,
      live: next.live.map((f, k) => {
        let x = f
        while (x.round < due) x = arkRound(ps, x, (seed + k * 31) >>> 0)
        return x
      }),
    }
  // chưa hết trận: chỉ đổi phần chung khi vừa dựng trận hay vừa giải hiệp (không thì server khỏi báo lại mỗi nhịp)
  if (due < ARK_ROUNDS && next.live.length) return { changed, world: next === ark ? w : { ...w, ark: next } }
  // hết trận: minh nhiều điểm thắng (bằng điểm: minh ít điểm minh chiến hơn thắng); đổi điểm minh chiến, quà cho mọi người
  const war = { ...(w.war ?? { done: -1, signed: [], pts: {}, last: [] }), pts: { ...w.war?.pts } }
  const last = next.live.map(f => {
    const pa = war.pts[f.a] ?? PVP_START,
      pb = war.pts[f.b] ?? PVP_START
    const aWins = f.pts[0] > f.pts[1] || (f.pts[0] === f.pts[1] && pa < pb)
    const d = elo(pa, pb, aWins)
    war.pts[f.a] = pa + d
    war.pts[f.b] = pb - d
    for (const [id, win, foe] of [
      [f.a, aWins, f.bn],
      [f.b, !aWins, f.an],
    ] as const)
      for (const pid of Object.keys(w.allies[id]?.members ?? {}).map(Number)) {
        const s: State | undefined = changed.get(pid) ?? ps.get(pid)
        if (s)
          changed.set(
            pid,
            mail(s, {
              at: now,
              k: 'ark',
              a: [win ? 1 : 0, foe, f.pts[id === f.a ? 0 : 1], f.pts[id === f.a ? 1 : 0]],
              gift: win ? ARK_WIN : ARK_LOSE,
            }),
          )
      }
    return { a: f.a, b: f.b, an: f.an, bn: f.bn, wa: f.pts[0], wb: f.pts[1] }
  })
  return {
    changed,
    world: { ...w, war, ark: { on: wk, done: wk, signed: [], live: [], last: last.length ? last : ark.last } },
  }
}

// Phần client cần (bảng ally): minh mình đã ghi danh chưa, trận đang đánh của minh mình, kết quả tuần trước
export type ArkRow = ReturnType<typeof arkRow>
export function arkRow(w: World, aid: number) {
  const ark = arkOf(w)
  return {
    signed: ark.signed.includes(aid),
    live: ark.live.find(f => f.a === aid || f.b === aid) ?? null,
    last: ark.last.filter(x => x.a === aid || x.b === aid),
  }
}
