// Trận nhiều bên: phòng thủ nhà (trưởng lão giữ nhà, Hộ Sơn Đại Trận), dò thám, gộp / tách đội, sức mang; điều kiện cướp.
import { fight, type Side, type Round } from '../combat.ts'
import { sideOf, chance } from '../core/battle.ts'
import { bonus, deputyOf, elderLevel, unitOf, isMarching, lead, power } from '../core/stats.ts'
import { type Army, type Buff, type Err, type March, type State } from '../core/types.ts'
import {
  ALLY_GIFTS,
  ALLY_GIFT_LV,
  ARK_ADJ,
  ARK_CENTER,
  ARK_CHARGE,
  ARK_HOLD,
  ARK_HOLD_DEF,
  ARK_HOME,
  ARK_OBELISKS,
  ARK_ORB_AT,
  ARK_SC,
  ARK_SKILLS,
  ARK_OUTPOSTS,
  ARK_SHRINE,
  ARK_SHRINES,
  ARK_TAKE,
  CARRY,
  GIFT_PTS,
  DAY_OFFSET,
  GUARD_STEP,
  PVP_FLOOR,
  PVP_HALL,
  RALLY_MAX,
  RALLY_UP,
  REVENGE_TIME,
  TIER,
  TRIBE_DAY,
  TRIBE_LEN,
  TRIBE_PTS,
  HOLM_BUFF,
  HOLM_HOUR,
  UNIT_CARRY,
  UNITS,
  type ArkSkill,
  type ElderId,
} from '../data.ts'
import { compact, DAY } from '../core/util.ts'
import { weekOf } from '../core/calendar.ts'
import { arenaSide, lineupOf } from '../sect/arena.ts'
import { mail } from '../sect/inbox.ts'
import {
  allyOf,
  farErr,
  put,
  napBetween,
  raidPath,
  sideKey,
  type Alliance,
  type ArkFight,
  type ArkUnit,
  type MapCtx,
  type Party,
  type Players,
  type Tribe,
  type World,
} from './base.ts'

// Trưởng lão giữ nhà chỉ tính khi đang ở tông môn
export const guardOf = (s: State) =>
  s.guard && s.elders[s.guard] !== undefined && !isMarching(s, s.guard) ? s.guard : null

// Bên thủ: mọi đệ tử đang ở nhà, trưởng lão giữ nhà dẫn (không có thì chỉ bonus tông môn), Hộ Sơn Đại Trận thêm thủ và máu
// brk: phần sức Hộ Sơn Đại Trận bị khôi lỗi phá (Cơ Quan Khôi Lỗi)
export function defense(s: State, brk = 0): Side {
  const g = guardOf(s)
  const side = sideOf(s, g, compact(s.troops), deputyOf(s, g), s.form) // thủ nhà theo trận đang bày
  const k = (1 + GUARD_STEP * s.levels.hoSonDaiTran * (1 - brk)) * (1 + (g ? lead(s, g, 'guard') : 0)) // Trấn Thủ
  return { ...side, troops: side.troops.map(t => ({ ...t, def: t.def * k, hp: t.hp * k })) }
}

// Dò thám: phòng thủ với quân số làm tròn (biết đại khái, không biết chính xác) — đủ để client ước lượng tỉ lệ thắng
export type Scout = { side: Side; guard: ElderId | null; level: number; wall: number }
export function scout(s: State): Scout {
  const side = defense(s)
  const round = (n: number) => (n < 50 ? n : Math.round(n / 10) * 10)
  const g = guardOf(s)
  return {
    side: { ...side, troops: side.troops.map(t => ({ ...t, n: round(t.n) })) },
    guard: g,
    level: g ? elderLevel(s.elders[g]) : 0,
    wall: s.levels.hoSonDaiTran,
  }
}

export const carryOf = (army: Army) =>
  UNITS.reduce((sum, u) => sum + (army[u] ?? 0) * CARRY * TIER[unitOf(u).tier].stat * UNIT_CARRY[unitOf(u).type], 0)
// Gộp nhiều đội thành một bên (quân đóng ở điểm, kết trận): nối các nhóm quân; công pháp (cả của phó) và hành của đội đầu
// at[j]: nhóm quân đầu tiên của đội j trong bên gộp
export function combine(parts: Side[]): { side: Side; at: number[] } {
  const at: number[] = []
  let k = 0
  for (const p of parts) {
    at.push(k)
    k += p.troops.length
  }
  const head = parts[0]
  return {
    side: {
      troops: parts.flatMap(p => p.troops),
      skill: head?.skill,
      ...(head?.skill2 && { skill2: head.skill2 }),
      el: head?.el,
    },
    at,
  }
}
// số còn lại của đội thứ j (nhóm quân theo thứ tự UNITS có mặt) từ mảng n của trận gộp
export function split(m: March, n: number[], from: number): { left: Army; hurt: Army } {
  const ids = UNITS.filter(u => (m.army[u] ?? 0) > 0)
  const left = Object.fromEntries(ids.map((u, k) => [u, n[from + k]])) as Army
  const hurt = Object.fromEntries(ids.map((u, k) => [u, m.army[u]! - n[from + k]])) as Army
  return { left, hurt }
}
export const addArmy = (a: Army = {}, b: Army) =>
  Object.fromEntries(UNITS.filter(u => (a[u] ?? 0) + (b[u] ?? 0) > 0).map(u => [u, (a[u] ?? 0) + (b[u] ?? 0)])) as Army

// Tỉ lệ thắng ước lượng khi đi cướp, đánh thử với phòng thủ đã dò thám (9 mầm cố định như winChance, không phải mầm thật)
export function raidChance(s: State, elder: ElderId, army: Army, foe: Side) {
  if (!Object.values(army).some(Boolean) || s.elders[elder] === undefined) return 0
  const d = deputyOf(s, elder)
  return chance(seed => fight(sideOf(s, elder, army, d), foe, seed).win)
}

// Trận nhìn từ phía bên kia (chiến báo của bên thủ)
export const flipRounds = (rounds: Round[]): Round[] =>
  rounds.map(r => ({
    n: [r.n[1], r.n[0]],
    cast: [r.cast[1], r.cast[0]],
    ...(r.rage && { rage: [r.rage[1], r.rage[0]] }),
  }))

// Số đội tối đa của kết trận do by mở (RALLY_MAX, thêm theo tầng Chủ điện người mở — RALLY_UP)
export const rallyCap = (ps: Players, by: number) =>
  RALLY_MAX + Math.floor(Math.max(0, (ps.get(by)?.levels.chuDien ?? 0) - RALLY_UP[0]) / RALLY_UP[1])
// Phản kết trận (trang Binh Thư Vây Ngụy Cứu Triệu): đoàn đánh tông môn defPid vừa đánh một người trong đoàn (trong REVENGE_TIME)
// thì đội nào cài trang đó thêm công
export function counterSides(party: Party, parts: Side[], defPid: number, at: number): Side[] {
  if (!party.some(([, s]) => s.foes.some(f => f.pid === defPid && f.at + REVENGE_TIME > at))) return parts
  return parts.map((x, j) => {
    const k = bonus(party[j][1], 'counter')
    return k > 0 ? { ...x, troops: x.troops.map(t => ({ ...t, atk: t.atk * (1 + k) })) } : x
  })
}
// Kẻ đã đánh mình trong REVENGE_TIME: báo thù được (bỏ giới hạn chênh lực chiến)
export const revenge = (att: State, pid: number, now: number) =>
  att.foes.some(f => f.pid === pid && f.at + REVENGE_TIME > now)
// Lúc này attPid có cướp được defPid không (một đội, mở / góp kết trận đều dùng) — null: được
export function raidError(
  att: State,
  def: State | undefined,
  attPid: number,
  defPid: number,
  now: number,
  map?: MapCtx,
  w?: World,
): Err | null {
  if (!def || attPid === defPid) return 'gone'
  if (w && allyOf(w, attPid)?.members[defPid] !== undefined) return 'friend' // không cướp đồng minh
  if (w && napBetween(w, attPid, defPid)) return 'friend' // minh ước
  if (!raidPath(att, def, map)) return map && att.seat && def.seat ? farErr(map, att.seat, def.seat) : 'far'
  if (att.levels.chuDien < PVP_HALL || def.levels.chuDien < PVP_HALL) return 'locked'
  if (def.shield > now) return 'shield'
  if (!revenge(att, defPid, now) && power(def) < PVP_FLOOR * power(att)) return 'weak' // báo thù thì bỏ giới hạn
  if (att.marches.some(m => m.target.kind === 'pvp' && m.target.i === defPid)) return 'busy'
  return null
}

// Khung Phá Yêu Trại của tuần wk (thứ Ba 0h → thứ Năm 0h giờ VN)
export const tribeStart = (wk: number) => (wk * 7 + 4 + TRIBE_DAY) * DAY - DAY_OFFSET
export const tribeEnd = (wk: number) => tribeStart(wk) + TRIBE_LEN * DAY
export const tribeOf = (w: World, t: number): Tribe =>
  w.tribe?.week === weekOf(t) ? w.tribe : { week: weekOf(t), pts: {} }
// Yêu vương cấp lv vừa đổ lúc at (trong khung): điểm TRIBE_PTS[lv] chia theo sát thương cho minh của từng người
export function tribeBank(w: World, at: number, lv: number, dmgs: Record<number, number>): World {
  const wk = weekOf(at)
  if (at < tribeStart(wk) || at >= tribeEnd(wk)) return w
  const sum = Object.values(dmgs).reduce((a, b) => a + b, 0) || 1
  const tr = tribeOf(w, at)
  const pts = { ...tr.pts }
  for (const [p, d] of Object.entries(dmgs)) {
    const al = allyOf(w, Number(p))
    if (al) pts[al.id] = (pts[al.id] ?? 0) + ((TRIBE_PTS[lv] ?? 0) * d) / sum
  }
  return { ...w, tribe: { ...tr, pts } }
}

// Sinh Tử Đài: lúc đấu của ngày d (HOLM_HOUR giờ VN); tăng ích của phái thắng trận gần nhất, tới trận hôm sau
export const holmAt = (d: number) => d * DAY - DAY_OFFSET + HOLM_HOUR * 3_600_000
export function holmBuffs(w: World, pid: number, at: number): Buff[] {
  const h = w.holm
  if (!h || h.win === null || ((sideKey(w, pid) % 2) + 2) % 2 !== h.win) return []
  const until = holmAt(h.day + 1)
  return at >= until
    ? []
    : Object.entries(HOLM_BUFF).map(([key, v]) => ({ key: key as Buff['key'], v: v ?? 0, until, src: 'holm' }))
}

// Luật hiệp chiến trường Linh Châu (11 ô, dùng chung: Tranh Đoạt Linh Châu của minh, Tán Tu Tranh Châu của người lẻ)
// Ô kế tiếp trên đường ngắn nhất from → to (không đi qua Linh Đài bên kia). Tụ Linh Nhãn phe mình giữ nối thẳng với nhau
// (đứng ở một nhãn thì một hiệp tới nhãn kia)
function hop(from: number, to: number, side: 0 | 1, own: (0 | 1 | null)[] = []): number {
  if (from === to) return from
  const ban = ARK_HOME[side ? 0 : 1]
  const prev = new Map<number, number>([[from, from]])
  const queue = [from]
  const link = (x: number) =>
    ARK_OBELISKS.includes(x) && own[x] === side
      ? [...ARK_ADJ[x], ...ARK_OBELISKS.filter(y => y !== x && own[y] === side)]
      : ARK_ADJ[x]
  while (queue.length) {
    const x = queue.shift()!
    for (const y of link(x))
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

type Orb = ArkFight['orb']
type Scores = Map<number, number>
const credit = (sc: Scores, pid: number, n: number) => sc.set(pid, (sc.get(pid) ?? 0) + n)
// Chiến pháp của bên sd có hiệu lực ở hiệp r
const skillOn = (f: ArkFight, sd: number, k: ArkSkill, r: number) =>
  !!f.buffs?.some(b => b.side === sd && b.k === k && b.r === r)
// 2. đánh ở ô node (có đủ hai bên): bên giữ ô thêm thủ, mỗi Linh Tháp phe mình giữ thêm công, chiến pháp Cổ Vũ / Kiên Thủ; bên thua về Linh
// Đài nghỉ hết hiệp sau (giữ cả hai Linh Tháp — Hồi Tháp — thì khỏi nghỉ). Trả đội sau trận; ghi nhật ký, công huân
function arkFight(
  ps: Players,
  f: ArkFight,
  here: ArkUnit[][],
  node: number,
  r: number,
  seed: number,
  orb: Orb,
  sc: Scores,
) {
  const sides = here.map((us, sd) => {
    const c = combine(us.map(u => sideOfUnit(ps, u)!))
    const def =
      (f.own[node] === sd ? 1 + ARK_HOLD_DEF : 1) * (skillOn(f, sd, 'kienThu', r) ? 1 + ARK_SKILLS.kienThu : 1)
    const atk =
      (1 + ARK_SHRINE * ARK_SHRINES.filter(x => f.own[x] === sd).length) *
      (skillOn(f, sd, 'coVu', r) ? 1 + ARK_SKILLS.coVu : 1)
    return { ...c, side: { ...c.side, troops: c.side.troops.map(t => ({ ...t, def: t.def * def, atk: t.atk * atk })) } }
  })
  const res = fight(sides[0].side, sides[1].side, (seed + r * 7919 + node * 104_729) >>> 0)
  const last = res.rounds.at(-1)?.n ?? sides.map(x => x.side.troops.map(t => t.n))
  // bên thắng: bên duy nhất còn quân; hoà (hết lượt, hai bên còn quân — hay cùng hết) thì bên đang giữ ô thắng, ô trống thì không ai lui
  const alive = last.map(n => n.some(x => x > 0))
  let win: 0 | 1 | null = f.own[node]
  if (alive[0] !== alive[1]) win = alive[0] ? 0 : 1
  if (win !== null) f.log.push([r, 'win', win, node])
  const after = new Map<number, ArkUnit>()
  const dropped = orb?.by !== undefined && here.some(us => us.some(u => u.pid === orb.by))
  here.forEach((us, sd) => {
    const life = ARK_SHRINES.every(x => f.own[x] === sd) // Hồi Tháp
    us.forEach((u, j) => {
      const from = sides[sd].at[j]
      const n = (sideOfUnit(ps, u)?.troops ?? []).map((_, g) => last[sd][from + g])
      const lost = (win !== null && sd !== win) || !n.some(x => x > 0)
      credit(sc, u.pid, sd === win ? ARK_SC.win : ARK_SC.fight)
      after.set(u.pid, lost ? { ...u, at: ARK_HOME[u.side], n: [], rest: life ? r : r + 1 } : { ...u, n })
      if (lost && orb?.by === u.pid) Object.assign(orb, { by: undefined, at: node }) // Châu rơi tại ô
    })
  })
  if (dropped && orb?.by === undefined) f.log.push([r, 'drop', win === 0 ? 1 : 0, node])
  return after
}
// 3. chiếm (ô chỉ còn một bên) — lần đầu mỗi bên mỗi ô ra điểm; giữ mỗi hiệp ra điểm (và công huân cho đội đứng trên ô phe mình)
function arkHold(f: ArkFight, units: ArkUnit[], r: number, sc: Scores) {
  const active = (u: ArkUnit) => !u.rest || u.rest < r
  for (const node of ARK_ADJ.keys()) {
    if (node === ARK_HOME[0] || node === ARK_HOME[1]) continue
    const on = units.filter(u => active(u) && u.at === node)
    const sd = [0, 1].filter(x => on.some(u => u.side === x))
    if (sd.length === 1 && f.own[node] !== sd[0]) {
      const s1 = sd[0] as 0 | 1
      f.own[node] = s1
      const first = !f.taken[s1].includes(node)
      if (first) f.taken = s1 ? [f.taken[0], [...f.taken[1], node]] : [[...f.taken[0], node], f.taken[1]]
      f.pts[s1] += first ? ARK_TAKE[node] : 0
      f.log.push([r, 'take', s1, node, first ? ARK_TAKE[node] : 0])
      for (const u of on) credit(sc, u.pid, first ? ARK_SC.take : ARK_SC.retake)
    }
    const o = f.own[node]
    if (o !== null) f.pts[o] += ARK_HOLD[node]
    for (const u of on) if (u.side === o) credit(sc, u.pid, ARK_SC.hold)
  }
}
// 4. Linh Châu: hiện ở Trung Điện; ai giữ ô Châu nằm (không ai mang) thì đội mạnh nhất ở đó nhặt; tới ô nạp được thì nạp
function arkOrb(ps: Players, f: ArkFight, units: ArkUnit[], orb: Orb, r: number, sc: Scores): Orb {
  const active = (u: ArkUnit) => !u.rest || u.rest < r
  let o2 = orb
  if (!o2 && r === ARK_ORB_AT) {
    o2 = { at: ARK_CENTER, n: 0 }
    f.log.push([r, 'orb', 0, ARK_CENTER])
  }
  if (o2 && o2.by === undefined && o2.back === undefined) {
    const holder = f.own[o2.at]
    const pick = units
      .filter(u => active(u) && u.at === o2!.at && u.side === holder)
      .sort((x, y) => strength(ps, y) - strength(ps, x) || x.pid - y.pid)[0]
    if (pick) o2.by = pick.pid
  }
  const carrier = o2?.by !== undefined ? units.find(u => u.pid === o2!.by) : undefined
  if (o2 && carrier && ARK_OUTPOSTS.includes(carrier.at) && f.own[carrier.at] === carrier.side) {
    if (!f.charged[carrier.side].includes(carrier.at)) {
      const pts = Math.round(ARK_CHARGE * 1.5 ** o2.n)
      f.pts[carrier.side] += pts
      f.charged = carrier.side
        ? [f.charged[0], [...f.charged[1], carrier.at]]
        : [[...f.charged[0], carrier.at], f.charged[1]]
      f.log.push([r, 'charge', carrier.side, carrier.at, pts])
      credit(sc, carrier.pid, ARK_SC.charge)
      o2 = { at: carrier.at, n: o2.n + 1, back: r }
    }
  }
  return o2 ?? null
}
// Một hiệp r: đi → đánh → chiếm / giữ → Linh Châu. seed: mầm của server (tất định từ đây)
export function arkRound(ps: Players, f0: ArkFight, seed: number): ArkFight {
  const r = f0.round + 1
  const f: ArkFight = { ...f0, round: r, pts: [...f0.pts], own: [...f0.own], log: [...f0.log] }
  const orb = f0.orb && { ...f0.orb }
  const sc: Scores = new Map()
  const active = (u: ArkUnit) => !u.rest || u.rest < r
  // Linh Châu về Trung Điện sau một hiệp nạp
  if (orb?.back !== undefined && orb.back <= r - 1)
    Object.assign(orb, { at: ARK_CENTER, back: undefined, by: undefined })
  // 1. đi: người mang Châu tới Tiểu Trận mình giữ chưa nạp gần nhất; còn lại theo lệnh (Thần Tốc: đi thanToc ô)
  const goal = (u: ArkUnit) => {
    if (orb?.by !== u.pid) return u.to
    const ok = ARK_OUTPOSTS.filter(x => f.own[x] === u.side && !f.charged[u.side].includes(x))
    const far = (x: number) => Number(hop(u.at, x, u.side, f0.own) !== x)
    return ok.sort((x, y) => far(x) - far(y))[0] ?? u.at
  }
  const walk = (u: ArkUnit) => {
    let at = u.at
    for (let k = 0; k < (skillOn(f0, u.side, 'thanToc', r) ? ARK_SKILLS.thanToc : 1); k++)
      at = hop(at, goal({ ...u, at }), u.side, f0.own)
    return at
  }
  let units = f0.units.map(u => (active(u) ? { ...u, at: walk(u), rest: undefined } : u))
  if (orb?.by !== undefined) orb.at = units.find(u => u.pid === orb.by)?.at ?? orb.at
  for (let node = 0; node < ARK_ADJ.length; node++) {
    const here = [0, 1].map(sd => units.filter(u => active(u) && u.at === node && u.side === sd && sideOfUnit(ps, u)))
    if (!here[0].length || !here[1].length) continue
    const after = arkFight(ps, f, here, node, r, seed, orb, sc)
    units = units.map(u => after.get(u.pid) ?? u)
  }
  arkHold(f, units, r, sc)
  const o2 = arkOrb(ps, f, units, orb, r, sc)
  units = units.map(u => (sc.has(u.pid) ? { ...u, sc: (u.sc ?? 0) + sc.get(u.pid)! } : u))
  return { ...f, units, orb: o2 }
}

// Minh lễ: người trong các minh vừa góp sức hạ yêu vương cấp lv → mọi người trong minh đó nhận quà qua thư (theo cấp quà
// hiện tại), minh thêm điểm quà. Ghi state người nhận vào changed.
export const giftLevel = (al: Alliance) => ALLY_GIFT_LV.filter(p => (al.gift ?? 0) >= p).length
export function allyGifts(ps: Players, changed: Players, w: World, pids: number[], lv: number, at: number): World {
  const pts = GIFT_PTS[lv]
  if (!pts) return w
  let next = w
  for (const al of new Set(pids.map(p => allyOf(w, p)).filter(x => x !== undefined))) {
    const glv = giftLevel(al)
    for (const p of Object.keys(al.members).map(Number)) {
      const st = changed.get(p) ?? ps.get(p)
      if (st) changed.set(p, mail(st, { at, k: 'allyGift', a: [lv, glv], gift: ALLY_GIFTS[glv - 1] }))
    }
    next = put(next, { ...al, gift: (al.gift ?? 0) + pts })
  }
  return next
}
