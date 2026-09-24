// Luật giữa các tông môn trong một giới: cướp, thư, ghép đối thủ, sự kiện tuần. Thuần như index.ts (không I/O, giờ truyền vào).
// Giải trận cướp cần state của cả hai bên và mầm thật nên chỉ server gọi (actor của giới, tuần tự: cướp là nguyên tử).
// Client chỉ dùng defense/scout/raidError để vẽ và ước lượng.
import {
  ALLY_COST, ALLY_ELDERS, ALLY_HALL, ALLY_HELPS, ALLY_MAX, HELP_MIN, HELP_SHARE, RESOURCES as RES,
  CARRY, ELDER_IDS, ELO_K, EVENT_TOP, FOES_MAX, GUARD_STEP, MAIL_MAX, MATCH_PICK, MATCH_POOL, PROTECT, PVP_FLOOR, PVP_HALL,
  RAID_SHARE, RESOURCES, REVENGE_TIME, SHIELD_TIME, TIER, UNITS,
  admit, advance, armyError, bump, elderLevel, evBump, fight, lead, marchSlots, marchTime, minus, pickArmy, power, pushReport, sideOf,
  snap, storage, unitOf, cutOf, hasten, jobOf,
  type JobKind,
  type Army, type Bag, type ElderId, type Err, type Mail, type March, type Report, type Side, type State,
} from './index.ts'
import { TILE_TIME, route, type Atlas, type Pos } from './atlas.ts'

export * from './atlas.ts'

// Bản đồ giới của lần tính này (server: seed + pha mùa của giới). Không có (sim, test): đi cướp ra mép vùng như P2.
export type MapCtx = { atlas: Atlas; phase: number }
// Đường đi cướp giữa hai chỗ ngồi; null: chưa có đường (cổng chưa mở)
export function raidPath(att: State, def: State, map?: MapCtx): { path?: Pos[]; ms: number } | null {
  if (!map || !att.seat || !def.seat) return { ms: marchTime(att, { kind: 'pvp', i: 0 }) }
  const r = route(map.atlas, att.seat, def.seat, map.phase)
  return r && { path: r.path, ms: Math.round(r.len * TILE_TIME * cutOf(att, 'march')) }
}

export type Players = Map<number, State>

// ---------- Phần chung của giới (actor giữ, lưu ở worlds.state) ----------

export type Role = 0 | 1 | 2 // thành viên · trưởng lão · minh chủ
export type Help = { pid: number; job: JobKind; startAt: number; ms: number; by: number[] } // một việc đang nhờ giúp; ms: mỗi lần giúp bớt (chốt lúc nhờ)
export type Alliance = { id: number; name: string; tag: string; members: Record<number, Role>; notice: string; at: number; helps: Help[] }
export type World = { allies: Record<number, Alliance>; nextAlly: number }
export const freshWorld = (): World => ({ allies: {}, nextAlly: 1 })
export const allyOf = (w: World, pid: number) => Object.values(w.allies).find(a => a.members[pid] !== undefined)

export type WorldAction =
  | { type: 'raid'; pid: number; elder: ElderId; army: Army }
  | { type: 'allyFound'; name: string; tag: string }
  | { type: 'allyJoin'; id: number }
  | { type: 'allyLeave' }
  | { type: 'allyKick'; pid: number }
  | { type: 'allyRole'; pid: number; role: Role }
  | { type: 'allyNotice'; text: string }
  | { type: 'helpAsk'; job: JobKind }
  | { type: 'helpAll' }
export const WORLD_ACTIONS: readonly WorldAction['type'][] = ['raid', 'allyFound', 'allyJoin', 'allyLeave', 'allyKick', 'allyRole', 'allyNotice', 'helpAsk', 'helpAll']

const id = (x: unknown): x is number => Number.isSafeInteger(x) && (x as number) >= 1
const clean = (x: unknown) => (typeof x === 'string' ? x.normalize('NFC').trim().replace(/\s+/g, ' ') : '')
const JOBS: readonly JobKind[] = ['build', 'train', 'heal', 'study', 'forge']
export function parseWorldAction(raw: unknown): WorldAction | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const a = raw as Record<string, unknown>
  switch (a.type) {
    case 'raid': {
      const army = pickArmy(a.army)
      return id(a.pid) && army && ELDER_IDS.includes(a.elder as ElderId) ? { type: 'raid', pid: a.pid, elder: a.elder as ElderId, army } : null
    }
    case 'allyFound': {
      const name = clean(a.name), tag = clean(a.tag).toUpperCase()
      return /^[\p{L}\p{N} ]{2,20}$/u.test(name) && /^[\p{Lu}\p{N}]{2,4}$/u.test(tag) ? { type: 'allyFound', name, tag } : null
    }
    case 'allyJoin': return id(a.id) ? { type: 'allyJoin', id: a.id } : null
    case 'allyLeave': return { type: 'allyLeave' }
    case 'allyKick': return id(a.pid) ? { type: 'allyKick', pid: a.pid } : null
    case 'allyRole': return id(a.pid) && [0, 1, 2].includes(a.role as number) ? { type: 'allyRole', pid: a.pid, role: a.role as Role } : null
    case 'allyNotice': {
      const t = clean(a.text)
      return t.length <= 200 ? { type: 'allyNotice', text: t } : null
    }
    case 'helpAsk': return JOBS.includes(a.job as JobKind) ? { type: 'helpAsk', job: a.job as JobKind } : null
    case 'helpAll': return { type: 'helpAll' }
  }
  return null
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

export function raidError(att: State, def: State | undefined, attPid: number, defPid: number, now: number, map?: MapCtx, w?: World): Err | null {
  if (!def || attPid === defPid) return 'gone'
  if (w && allyOf(w, attPid)?.members[defPid] !== undefined) return 'friend' // không cướp đồng minh
  if (!raidPath(att, def, map)) return 'far'
  if (att.levels.chuDien < PVP_HALL || def.levels.chuDien < PVP_HALL) return 'locked'
  if (def.shield > now) return 'shield'
  if (!revenge(att, defPid, now) && power(def) < PVP_FLOOR * power(att)) return 'weak' // báo thù thì bỏ giới hạn
  if (att.marches.some(m => m.target.kind === 'pvp' && m.target.i === defPid)) return 'busy'
  return null
}

// ---------- Thao tác giữa các tông môn ----------

// world: phần chung sau thao tác (cùng tham chiếu nếu không đổi)
export type WorldResult = { ok: true; changed: Players; world: World } | { ok: false; error: Err }

export function worldAct(ps: Players, pid: number, raw: WorldAction, now: number, seed: number, map?: MapCtx, w: World = freshWorld()): WorldResult {
  const a = parseWorldAction(raw) // kiểm ở đây cho mọi nơi gọi (server, NPC, sim) — như apply() với parseAction
  if (!a) return { ok: false, error: 'bad' }
  const me = ps.get(pid)
  if (!me) return { ok: false, error: 'gone' }
  if (a.type !== 'raid') return allyAct(w, ps, pid, a, now)
  const att = advance(me, now)
  const t = att.time
  const other = ps.get(a.pid)
  const e = raidError(att, other && advance(other, now), pid, a.pid, t, map, w) ?? armyError(att, a.elder, a.army) ?? (att.marches.length >= marchSlots(att) ? 'slots' : null)
  if (e) return { ok: false, error: e }
  const army = Object.fromEntries(UNITS.filter(u => a.army[u]).map(u => [u, a.army[u]])) as Army
  const go = raidPath(att, other!, map)!
  const m: March = { id: att.nextId, elder: a.elder, army, target: { kind: 'pvp', i: a.pid }, seed, startAt: t, arriveAt: t + go.ms, returnAt: 0, foe: other!.name, ...(go.path && { path: go.path }) }
  // đi đánh người khác thì mất khiên
  return { ok: true, world: w, changed: new Map([[pid, { ...att, troops: minus(att.troops, army), marches: [...att.marches, m], nextId: att.nextId + 1, shield: 0 }]]) }
}

// ---------- Tiên minh ----------

const no = (error: Err): WorldResult => ({ ok: false, error })
const put = (w: World, al: Alliance): World => ({ ...w, allies: { ...w.allies, [al.id]: al } })
const drop = (w: World, aid: number): World => {
  const { [aid]: _, ...allies } = w.allies
  return { ...w, allies }
}
// Rời minh: bỏ luôn các việc đang nhờ; minh chủ đi thì người chức cao nhất (vào sớm nhất) lên thay; còn mỗi mình thì giải tán
function leave(w: World, al: Alliance, pid: number): World {
  const { [pid]: role, ...members } = al.members
  const rest = Object.keys(members).map(Number)
  if (!rest.length) return drop(w, al.id)
  if (role === 2) {
    const heir = rest.sort((x, y) => members[y] - members[x] || x - y)[0]
    members[heir] = 2
  }
  return put(w, { ...al, members, helps: al.helps.filter(h => h.pid !== pid) })
}
// Cho client: danh sách minh (tìm để vào), minh của mình với người trong đó
export type AllyRow = { id: number; name: string; tag: string; n: number; power: number }
export type Member = { pid: number; name: string; role: Role; hall: number; power: number; online: boolean }
export type AllyInfo = Alliance & { people: Member[] }
export const allyRows = (w: World, ps: Players): AllyRow[] =>
  Object.values(w.allies)
    .map(al => ({ id: al.id, name: al.name, tag: al.tag, n: Object.keys(al.members).length, power: Object.keys(al.members).reduce((sum, p) => sum + Math.round(power(ps.get(Number(p)) ?? ps.values().next().value!)), 0) }))
    .sort((a, b) => b.power - a.power || a.id - b.id)
export function allyInfo(w: World, ps: Players, pid: number, online: (pid: number) => boolean): AllyInfo | null {
  const al = allyOf(w, pid)
  if (!al) return null
  const people = Object.entries(al.members).map(([p, role]) => {
    const s = ps.get(Number(p))
    return { pid: Number(p), name: s?.name ?? '?', role, hall: s?.levels.chuDien ?? 0, power: s ? Math.round(power(s)) : 0, online: online(Number(p)) }
  })
  return { ...al, people: people.sort((a, b) => b.role - a.role || b.power - a.power) }
}

export const helpMs = (job: { startAt: number; finishAt: number }) => Math.max(HELP_MIN, Math.round((job.finishAt - job.startAt) * HELP_SHARE))

function allyAct(w: World, ps: Players, pid: number, a: Exclude<WorldAction, { type: 'raid' }>, now: number): WorldResult {
  const mine = allyOf(w, pid)
  const role = mine?.members[pid] ?? -1
  const same = (x: WorldResult) => x
  switch (a.type) {
    case 'allyFound': {
      const s = advance(ps.get(pid)!, now)
      if (mine) return no('busy')
      if (s.levels.chuDien < ALLY_HALL) return no('locked')
      if (Object.values(w.allies).some(x => x.name.toLowerCase() === a.name.toLowerCase() || x.tag === a.tag)) return no('taken')
      if (RES.some(r => s.res[r] < ALLY_COST)) return no('not_enough')
      const al: Alliance = { id: w.nextAlly, name: a.name, tag: a.tag, members: { [pid]: 2 }, notice: '', at: now, helps: [] }
      const paid = { ...s, res: Object.fromEntries(RES.map(r => [r, s.res[r] - ALLY_COST])) as State['res'] }
      return { ok: true, world: { ...put(w, al), nextAlly: w.nextAlly + 1 }, changed: new Map([[pid, paid]]) }
    }
    case 'allyJoin': {
      const al = w.allies[a.id]
      if (mine) return no('busy')
      if (!al) return no('gone')
      if (Object.keys(al.members).length >= ALLY_MAX) return no('full')
      // ponytail: vào tự do (không duyệt đơn) — thêm duyệt nếu bị phá
      return same({ ok: true, changed: new Map(), world: put(w, { ...al, members: { ...al.members, [pid]: 0 } }) })
    }
    case 'allyLeave':
      return mine ? { ok: true, changed: new Map(), world: leave(w, mine, pid) } : no('locked')
    case 'allyKick': {
      const their = mine?.members[a.pid]
      if (!mine || their === undefined || a.pid === pid) return no('bad')
      if (role < 1 || their >= role) return no('locked')
      return { ok: true, changed: new Map(), world: leave(w, mine, a.pid) }
    }
    case 'allyRole': {
      const their = mine?.members[a.pid]
      if (!mine || their === undefined || a.pid === pid) return no('bad')
      if (role !== 2) return no('locked')
      if (a.role === 1 && Object.values(mine.members).filter(r => r === 1).length >= ALLY_ELDERS && their !== 1) return no('full')
      // nhường minh chủ: mình xuống trưởng lão
      const members = { ...mine.members, [a.pid]: a.role, ...(a.role === 2 && { [pid]: 1 as Role }) }
      return { ok: true, changed: new Map(), world: put(w, { ...mine, members }) }
    }
    case 'allyNotice':
      if (!mine || role < 1) return no('locked')
      return { ok: true, changed: new Map(), world: put(w, { ...mine, notice: a.text }) }
    case 'helpAsk': {
      if (!mine) return no('locked')
      const j = jobOf(advance(ps.get(pid)!, now), a.job)
      if (!j || a.job === 'brew') return no('empty')
      if (mine.helps.some(h => h.pid === pid && h.job === a.job && h.startAt === j.startAt)) return no('max_level')
      const helps = [...mine.helps.filter(h => !(h.pid === pid && h.job === a.job)), { pid, job: a.job, startAt: j.startAt, ms: helpMs(j), by: [] }]
      return { ok: true, changed: new Map(), world: put(w, { ...mine, helps }) }
    }
    case 'helpAll': {
      if (!mine) return no('locked')
      const changed: Players = new Map()
      const helps: Help[] = []
      let n = 0
      for (const h of mine.helps) {
        const s = changed.get(h.pid) ?? ps.get(h.pid)
        const j = s && jobOf(advance(s, now), h.job)
        if (!s || !j || j.startAt !== h.startAt || mine.members[h.pid] === undefined) continue // việc đã xong/đổi: bỏ lời nhờ
        if (h.pid === pid || h.by.includes(pid) || h.by.length >= ALLY_HELPS) {
          helps.push(h)
          continue
        }
        changed.set(h.pid, hasten(s, h.job, h.startAt, h.ms, now))
        n++
        const next = { ...h, by: [...h.by, pid] }
        if (next.by.length < ALLY_HELPS) helps.push(next)
      }
      if (!n) return no('empty')
      return { ok: true, changed, world: put(w, { ...mine, helps }) }
    }
  }
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
    // tông môn kia không còn (xoá tài khoản), hoặc vừa có khiên (người khác cướp trước): quay về tay không
    if (!d || d.shield > at) {
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

// Tỉ lệ thắng ước lượng khi đi cướp, đánh thử với phòng thủ đã dò thám (9 mầm cố định như winChance, không phải mầm thật)
export function raidChance(s: State, elder: ElderId, army: Army, foe: Side) {
  if (!Object.values(army).some(Boolean) || s.elders[elder] === undefined) return 0
  let won = 0
  for (let k = 1; k <= 9; k++) if (fight(sideOf(s, elder, army), foe, Math.imul(k, 0x9e3779b1) >>> 0).win) won++
  return won / 9
}

// ---------- Ghép đối thủ ----------

export type Rival = { pid: number; name: string; hall: number; power: number; pts: number; revenge: boolean; scout: Scout; ms: number }

// Kẻ đã đánh mình (báo thù, 24 giờ) + MATCH_PICK người ngẫu nhiên trong MATCH_POOL người gần lực chiến nhất, đánh được lúc này
// only: chỉ hỏi một tông môn (chạm trên bản đồ) — trả [] nếu lúc này không đánh được
export function rivals(ps: Players, pid: number, now: number, rand: () => number, map?: MapCtx, only?: number, w?: World): Rival[] {
  const me = ps.get(pid)
  if (!me || me.levels.chuDien < PVP_HALL) return []
  const mine = power(me)
  const row = (id: number, s: State, rev: boolean): Rival => ({
    pid: id, name: s.name, hall: s.levels.chuDien, power: Math.round(power(s)), pts: s.pvp.pts, revenge: rev, scout: scout(s), ms: raidPath(me, s, map)!.ms,
  })
  const open = [...ps].filter(([id, s]) => (only === undefined || id === only) && !raidError(me, s, pid, id, now, map, w))
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

// ---------- Ảnh chụp bản đồ giới (server gửi cho người đang mở bản đồ) ----------

export type Chron = { at: number; k: string; a: (string | number)[] } // biên niên của giới: chữ dựng ở client theo khoá
export type Seat = { pid: number; name: string; x: number; y: number; hall: number; power: number; npc: boolean; shield: boolean }
export type MapMarch = { pid: number; id: number; path: Pos[]; startAt: number; arriveAt: number; returnAt: number; foe?: string }
export type MapSnap = { seats: Seat[]; marches: MapMarch[]; chron: Chron[] }

export function mapOf(ps: Players, now: number, npc: Set<number>, chron: Chron[]): MapSnap {
  const seats: Seat[] = [], marches: MapMarch[] = []
  for (const [pid, s] of ps) {
    if (!s.seat) continue
    seats.push({ pid, name: s.name, x: s.seat.x, y: s.seat.y, hall: s.levels.chuDien, power: Math.round(power(s)), npc: npc.has(pid), shield: s.shield > now })
    for (const m of s.marches) if (m.path) marches.push({ pid, id: m.id, path: m.path, startAt: m.startAt, arriveAt: m.arriveAt, returnAt: m.returnAt, ...(m.foe && { foe: m.foe }) })
  }
  return { seats, marches, chron }
}
