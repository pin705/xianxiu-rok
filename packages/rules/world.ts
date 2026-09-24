// Luật giữa các tông môn trong một giới: cướp, thư, ghép đối thủ, sự kiện tuần. Thuần như index.ts (không I/O, giờ truyền vào).
// Giải trận cướp cần state của cả hai bên và mầm thật nên chỉ server gọi (actor của giới, tuần tự: cướp là nguyên tử).
// Client chỉ dùng defense/scout/raidError để vẽ và ước lượng.
import {
  CARRY, ELDER_IDS, ELO_K, EVENT_TOP, FOES_MAX, GUARD_STEP, MAIL_MAX, MATCH_PICK, MATCH_POOL, PROTECT, PVP_FLOOR, PVP_HALL,
  RAID_SHARE, RESOURCES, REVENGE_TIME, SHIELD_TIME, TIER, UNITS,
  admit, advance, armyError, bump, elderLevel, evBump, fight, lead, marchSlots, marchTime, minus, pickArmy, power, pushReport, sideOf,
  snap, storage, unitOf,
  type Army, type Bag, type ElderId, type Err, type Mail, type March, type Report, type Side, type State,
} from './index.ts'

export type Players = Map<number, State>
export type WorldAction = { type: 'raid'; pid: number; elder: ElderId; army: Army }

export function parseWorldAction(raw: unknown): WorldAction | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const a = raw as Record<string, unknown>
  if (a.type !== 'raid' || !Number.isSafeInteger(a.pid) || (a.pid as number) < 1) return null
  const army = pickArmy(a.army)
  return army && ELDER_IDS.includes(a.elder as ElderId) ? { type: 'raid', pid: a.pid as number, elder: a.elder as ElderId, army } : null
}

// ---------- Phòng thủ ----------

// Trưởng lão giữ nhà chỉ tính khi đang ở tông môn
export const guardOf = (s: State) => (s.guard && s.elders[s.guard] !== undefined && !s.marches.some(m => m.elder === s.guard) ? s.guard : null)

// Bên thủ: mọi đệ tử đang ở nhà, trưởng lão giữ nhà dẫn (không có thì chỉ bonus tông môn), Hộ Sơn Đại Trận thêm thủ và máu
export function defense(s: State): Side {
  const army = Object.fromEntries(UNITS.filter(u => s.troops[u] > 0).map(u => [u, s.troops[u]])) as Army
  const side = sideOf(s, guardOf(s), army)
  const k = 1 + GUARD_STEP * s.levels.hoSonDaiTran
  return { ...side, troops: side.troops.map(t => ({ ...t, def: t.def * k, hp: t.hp * k })) }
}

// Dò thám: phòng thủ với quân số làm tròn (biết đại khái, không biết chính xác) — đủ để client ước lượng tỉ lệ thắng
export type Scout = { side: Side; guard: ElderId | null; level: number; wall: number }
export function scout(s: State): Scout {
  const side = defense(s)
  const round = (n: number) => (n < 50 ? n : Math.round(n / 10) * 10)
  const g = guardOf(s)
  return { side: { ...side, troops: side.troops.map(t => ({ ...t, n: round(t.n) })) }, guard: g, level: g ? elderLevel(s.elders[g]) : 0, wall: s.levels.hoSonDaiTran }
}

const revenge = (att: State, pid: number, now: number) => att.foes.some(f => f.pid === pid && f.at + REVENGE_TIME > now)

export function raidError(att: State, def: State | undefined, attPid: number, defPid: number, now: number): Err | null {
  if (!def || attPid === defPid) return 'gone'
  if (att.levels.chuDien < PVP_HALL || def.levels.chuDien < PVP_HALL) return 'locked'
  if (def.shield > now) return 'shield'
  if (!revenge(att, defPid, now) && power(def) < PVP_FLOOR * power(att)) return 'weak' // báo thù thì bỏ giới hạn
  if (att.marches.some(m => m.target.kind === 'pvp' && m.target.i === defPid)) return 'busy'
  return null
}

// ---------- Thao tác giữa các tông môn ----------

export type WorldResult = { ok: true; changed: Players } | { ok: false; error: Err }

export function worldAct(ps: Players, pid: number, a: WorldAction, now: number, seed: number): WorldResult {
  const me = ps.get(pid)
  if (!me) return { ok: false, error: 'gone' }
  const att = advance(me, now)
  const t = att.time
  const other = ps.get(a.pid)
  const e = raidError(att, other && advance(other, now), pid, a.pid, t) ?? armyError(att, a.elder, a.army) ?? (att.marches.length >= marchSlots(att) ? 'slots' : null)
  if (e) return { ok: false, error: e }
  const army = Object.fromEntries(UNITS.filter(u => a.army[u]).map(u => [u, a.army[u]])) as Army
  const target = { kind: 'pvp', i: a.pid } as const
  const m: March = { id: att.nextId, elder: a.elder, army, target, seed, startAt: t, arriveAt: t + marchTime(att, target), returnAt: 0 }
  // đi đánh người khác thì mất khiên
  return { ok: true, changed: new Map([[pid, { ...att, troops: minus(att.troops, army), marches: [...att.marches, m], nextId: att.nextId + 1, shield: 0 }]]) }
}

// ---------- Giải trận cướp (server) ----------

// Lúc trận cướp kế tiếp tới nơi (để server hẹn giờ). ponytail: quét mọi hành quân của giới (~1k), đổi sang heap nếu giới to lên nhiều.
export function nextRaid(ps: Players) {
  let at = Infinity
  for (const s of ps.values()) for (const m of s.marches) if (m.target.kind === 'pvp' && !m.returnAt && m.arriveAt < at) at = m.arriveAt
  return at
}

// Giải mọi trận cướp đã tới nơi (≤ now) theo thứ tự thời gian; trả về các state đã đổi (cả bên đánh lẫn bên thủ)
export function advanceWorld(ps: Players, now: number): Players {
  const due: [at: number, pid: number, id: number][] = []
  for (const [pid, s] of ps) for (const m of s.marches) if (m.target.kind === 'pvp' && !m.returnAt && m.arriveAt <= now) due.push([m.arriveAt, pid, m.id])
  const changed: Players = new Map()
  due.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])
  const cur = (pid: number) => changed.get(pid) ?? ps.get(pid)
  for (const [at, pid, id] of due) {
    const att = advance(cur(pid)!, at)
    const m = att.marches.find(x => x.id === id)!
    const d = cur(m.target.i)
    if (!d) {
      // tông môn kia không còn (xoá tài khoản): quay về tay không
      changed.set(pid, { ...att, marches: att.marches.map(x => (x === m ? { ...m, back: m.army, hurt: {}, gain: { res: {}, items: {}, exp: 0 }, returnAt: at + (at - m.startAt) } : x)) })
      continue
    }
    const r = raid(att, pid, advance(d, at), m.target.i, m, at)
    changed.set(pid, r.att)
    changed.set(m.target.i, r.def)
  }
  return changed
}

// Điểm kiểu Elo cho bên đánh (bên thủ mất/được đúng bấy nhiêu). Chỉ server tính nên không cần tất định giữa các engine.
const elo = (a: number, d: number, win: boolean) => Math.round(ELO_K * ((win ? 1 : 0) - 1 / (1 + 10 ** ((d - a) / 400))))

// Phần cướp được: RAID_SHARE phần vượt kho bảo hộ (bonus chiến lợi phẩm của người dẫn), không quá sức mang của đội còn đứng
function plunder(att: State, def: State, elder: ElderId, back: Army): Partial<Bag> {
  const room = UNITS.reduce((sum, u) => sum + (back[u] ?? 0) * CARRY * TIER[unitOf(u).tier].stat, 0)
  const keep = PROTECT * storage(def)
  const want = RESOURCES.map(r => {
    const over = Math.max(0, def.res[r] - keep)
    return Math.floor(Math.min(over, over * RAID_SHARE * (1 + lead(att, elder, 'loot'))))
  })
  const total = want.reduce((a, b) => a + b, 0)
  const k = total > room ? room / total : 1
  return Object.fromEntries(RESOURCES.map((r, i) => [r, Math.floor(want[i] * k)]))
}

// Một trận cướp lúc at: cả hai state đã đưa tới at. Bên thủ là mọi đệ tử đang ở nhà.
export function raid(att: State, attPid: number, def: State, defPid: number, m: March, at: number): { att: State; def: State } {
  const me = sideOf(att, m.elder, m.army)
  const foe = defense(def)
  const f = fight(me, foe, m.seed)
  const last = f.rounds.at(-1)
  const ids = UNITS.filter(u => (m.army[u] ?? 0) > 0)
  const left = last?.n[0] ?? ids.map(u => m.army[u]!)
  const back = Object.fromEntries(ids.map((u, k) => [u, left[k]])) as Army
  const hurt = Object.fromEntries(ids.map((u, k) => [u, m.army[u]! - left[k]])) as Army
  const dIds = UNITS.filter(u => def.troops[u] > 0)
  const dLeft = last?.n[1] ?? dIds.map(u => def.troops[u])
  const dHurt = Object.fromEntries(dIds.map((u, k) => [u, def.troops[u] - dLeft[k]])) as Army
  const loot = f.win ? plunder(att, def, m.elder, back) : {}
  const d = elo(att.pvp.pts, def.pvp.pts, f.win)
  const g = guardOf(def)
  const aSnap = snap(me, m.elder, elderLevel(att.elders[m.elder]))
  const dSnap = snap(foe, g ?? undefined, g ? elderLevel(def.elders[g]) : 1)
  const exp = f.win ? Math.round(40 * def.levels.chuDien * (1 + lead(att, m.elder, 'exp'))) : 0

  // bên đánh: chiến báo, đội quay về mang chiến lợi phẩm (nhận lúc về tới nhà như PvE)
  let a: State = pushReport(att, { at, kind: 'pvp', i: defPid, foe: def.name, win: f.win, hurt, dead: {}, gain: { res: loot, items: {}, exp }, fights: [{ a: aSnap, b: dSnap, rounds: f.rounds }] })
  a = {
    ...a,
    marches: a.marches.map(x => (x.id === m.id ? { ...x, back, hurt, gain: { res: loot, items: {}, exp }, report: a.nextId - 1, returnAt: at + (at - m.startAt) } : x)),
    pvp: { pts: Math.max(0, att.pvp.pts + d), win: att.pvp.win + (f.win ? 1 : 0), loss: att.pvp.loss + (f.win ? 0 : 1) },
    foes: f.win ? att.foes.filter(x => x.pid !== defPid) : att.foes, // báo thù xong
  }
  if (f.win) a = evBump(bump(a, 'win'), 'raid')

  // bên thủ: mất tài nguyên, thương binh về Đan phòng, chiến báo nhìn từ phía mình, thua thì được khiên
  const lost = Object.fromEntries(RESOURCES.map(r => [r, loot[r] ?? 0])) as Bag
  const adm = admit({ ...def, troops: minus(def.troops, dHurt), res: Object.fromEntries(RESOURCES.map(r => [r, def.res[r] - lost[r]])) as Bag }, dHurt)
  const flip: Report['fights'] = [{ a: dSnap, b: aSnap, rounds: f.rounds.map(r => ({ n: [r.n[1], r.n[0]], cast: [r.cast[1], r.cast[0]] })) }]
  let dd: State = pushReport(adm.state, { at, kind: 'pvp', i: attPid, foe: att.name, def: true, win: !f.win, hurt: dHurt, dead: adm.dead, lost: loot, gain: { res: {}, items: {}, exp: 0 }, fights: flip })
  dd = {
    ...dd,
    pvp: { pts: Math.max(0, def.pvp.pts - d), win: def.pvp.win + (f.win ? 0 : 1), loss: def.pvp.loss + (f.win ? 1 : 0) },
    foes: [...def.foes.filter(x => x.pid !== attPid), { pid: attPid, name: att.name, at }].slice(-FOES_MAX),
    shield: f.win ? Math.max(def.shield, at + SHIELD_TIME) : def.shield,
  }
  return { att: a, def: dd }
}

// ---------- Ghép đối thủ ----------

export type Rival = { pid: number; name: string; hall: number; power: number; pts: number; revenge: boolean; scout: Scout }

// Kẻ đã đánh mình (báo thù, 24 giờ) + MATCH_PICK người ngẫu nhiên trong MATCH_POOL người gần lực chiến nhất, đánh được lúc này
export function rivals(ps: Players, pid: number, now: number, rand: () => number): Rival[] {
  const me = ps.get(pid)
  if (!me || me.levels.chuDien < PVP_HALL) return []
  const mine = power(me)
  const row = (id: number, s: State, rev: boolean): Rival => ({ pid: id, name: s.name, hall: s.levels.chuDien, power: Math.round(power(s)), pts: s.pvp.pts, revenge: rev, scout: scout(s) })
  const open = [...ps].filter(([id, s]) => !raidError(me, s, pid, id, now))
  const foes = open.filter(([id]) => revenge(me, id, now))
  const pool = open
    .filter(([id]) => !revenge(me, id, now))
    .sort((a, b) => Math.abs(power(a[1]) - mine) - Math.abs(power(b[1]) - mine) || a[0] - b[0])
    .slice(0, MATCH_POOL)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return [...foes.map(([id, s]) => row(id, s, true)), ...pool.slice(0, MATCH_PICK).map(([id, s]) => row(id, s, false))]
}

// ---------- Thư, sự kiện tuần ----------

// Mọi phần thưởng từ ngoài (admin, sự kiện, xếp hạng, bồi thường) chỉ đi qua đây. Đầy thì bỏ thư cũ đã nhận (hoặc không có quà) trước.
export function mail(s: State, m: Omit<Mail, 'id'>): State {
  const box = [...s.mail, { ...m, id: s.nextId }]
  while (box.length > MAIL_MAX) {
    const i = box.findIndex(x => !x.gift || x.got)
    box.splice(i >= 0 ? i : 0, 1)
  }
  return { ...s, mail: box, nextId: s.nextId + 1 }
}

// Top EVENT_TOP của tuần week (người có điểm), cao nhất trước
export const eventTop = (ps: Players, week: number) =>
  [...ps]
    .filter(([, s]) => s.ev.week === week && s.ev.pts > 0)
    .sort((a, b) => b[1].ev.pts - a[1].ev.pts || a[0] - b[0])
    .slice(0, EVENT_TOP)
    .map(([id]) => id)
