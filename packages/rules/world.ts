// Luật giữa các tông môn trong một giới: cướp, thư, ghép đối thủ, sự kiện tuần. Thuần như index.ts (không I/O, giờ truyền vào).
// Giải trận cướp cần state của cả hai bên và mầm thật nên chỉ server gọi (actor của giới, tuần tự: cướp là nguyên tử).
// Client chỉ dùng defense/scout/raidError để vẽ và ước lượng.
import {
  ALLY_COST, ALLY_ELDERS, ALLY_HALL, ALLY_HELPS, ALLY_MAX, HELP_MIN, HELP_SHARE, RESOURCES as RES,
  CARRY, ELDER_IDS, ELO_K, EVENT_TOP, FOES_MAX, GUARD_STEP, MAIL_MAX, MATCH_PICK, MATCH_POOL, PROTECT, PVP_FLOOR, PVP_HALL,
  RAID_SHARE, RESOURCES, REVENGE_TIME, SHIELD_TIME, TIER, UNITS, BEATS, BOSSES, GARRISON_MAX, MINE_RATE, MINE_RESPAWN, MINE_STOCK, TIDE_MINE,
  TIDE_PROD, TYPES, VEIN_BUFF, VEIN_CAP, RALLY_MAX, RALLY_WAIT, REINFORCE_MAX, HO_PHAP, HO_PHAP_EXP, PHA_KIEP, TRIB_AID, TRIB_EXP, might,
  ASCEND, ASCEND_HALL, MAX_LEVEL, SEASON_BOSS, SEASON_GATE, SEASON_HEAVEN, SEASON_VEIN,
  admit, advance, armyError, bump, elderLevel, evBump, fight, lead, marchSlots, marchTime, minus, mob, pickArmy, power, pushReport, sideOf,
  snap, storage, unitOf, cutOf, hasten, jobOf, giveExp, tribEnd, seasonEnd,
  type Buff, type Reward,
  type JobKind,
  type Army, type Bag, type ElderId, type Err, type Mail, type March, type Report, type Side, type State,
} from './index.ts'
import { TILE_TIME, regionOf, route, tide, type Atlas, type Point, type PointKind, type Pos } from './atlas.ts'

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
// Trạng thái một điểm trên bản đồ giới. own: phe giữ (mã minh > 0, người giữ một mình = −mã người chơi), since: từ lúc nào.
// Mỏ: còn left, cạn thì hồi đầy lúc until. Yêu vương: còn hp, sát thương từng người; chết thì hồi sinh lúc until.
export type Spot = { own?: number; since?: number; left?: number; until?: number; hp?: number; dmg?: Record<number, number> }
// Kết trận: người trong minh góp đội, mọi đội tới điểm i cùng lúc `at` rồi đánh như một bên
export type Rally = { id: number; ally: number; by: number; i: number; task: 'take' | 'hit'; at: number }
// pts: điểm mùa đã chốt theo phe (sideKey) — phần đang giữ tính thêm ở seasonPts
export type World = { allies: Record<number, Alliance>; nextAlly: number; spots: Record<number, Spot>; rallies: Record<number, Rally>; nextRally: number; pts: Record<number, number> }
export const freshWorld = (): World => ({ allies: {}, nextAlly: 1, spots: {}, rallies: {}, nextRally: 1, pts: {} })
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
  | { type: 'go'; i: number; task: Task; elder: ElderId; army: Army } // tới một điểm trên bản đồ giới
  | { type: 'recall'; id: number } // gọi đội đang đóng quân / đang khai mỏ / đang viện binh về
  | { type: 'rally'; i: number; wait: 0 | 1 | 2; elder: ElderId; army: Army } // mở kết trận ở điểm i (chiếm / đánh yêu vương)
  | { type: 'rallyJoin'; id: number; elder: ElderId; army: Army } // góp đội vào kết trận
  | { type: 'aid'; pid: number; elder: ElderId; army: Army } // viện binh: đóng quân ở nhà đồng minh
export type Task = 'take' | 'gather' | 'hit'
export const WORLD_ACTIONS: readonly WorldAction['type'][] = [
  'raid', 'allyFound', 'allyJoin', 'allyLeave', 'allyKick', 'allyRole', 'allyNotice', 'helpAsk', 'helpAll', 'go', 'recall', 'rally', 'rallyJoin', 'aid',
]
const TASKS: readonly Task[] = ['take', 'gather', 'hit']

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
    case 'go': {
      const army = pickArmy(a.army)
      return Number.isSafeInteger(a.i) && (a.i as number) >= 0 && TASKS.includes(a.task as Task) && army && ELDER_IDS.includes(a.elder as ElderId)
        ? { type: 'go', i: a.i as number, task: a.task as Task, elder: a.elder as ElderId, army }
        : null
    }
    case 'recall': return id(a.id) ? { type: 'recall', id: a.id } : null
    case 'rally': {
      const army = pickArmy(a.army)
      return Number.isSafeInteger(a.i) && (a.i as number) >= 0 && [0, 1, 2].includes(a.wait as number) && army && ELDER_IDS.includes(a.elder as ElderId)
        ? { type: 'rally', i: a.i as number, wait: a.wait as 0 | 1 | 2, elder: a.elder as ElderId, army }
        : null
    }
    case 'rallyJoin':
    case 'aid': {
      const army = pickArmy(a.army)
      if (!army || !ELDER_IDS.includes(a.elder as ElderId)) return null
      if (a.type === 'aid') return id(a.pid) ? { type: 'aid', pid: a.pid, elder: a.elder as ElderId, army } : null
      return id(a.id) ? { type: 'rallyJoin', id: a.id, elder: a.elder as ElderId, army } : null
    }
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
  if (a.type === 'go') return goAct(ps, w, pid, a, now, seed, map)
  if (a.type === 'recall') return recallAct(ps, w, pid, a.id, now, map)
  if (a.type === 'rally' || a.type === 'rallyJoin') return rallyAct(ps, w, pid, a, now, seed, map)
  if (a.type === 'aid') return aidAct(ps, w, pid, a, now, seed, map)
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
export type AllyInfo = Alliance & { people: Member[]; rallies: Rally[] }
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
  return { ...al, people: people.sort((a, b) => b.role - a.role || b.power - a.power), rallies: Object.values(w.rallies).filter(r => r.ally === al.id) }
}

export const helpMs = (job: { startAt: number; finishAt: number }) => Math.max(HELP_MIN, Math.round((job.finishAt - job.startAt) * HELP_SHARE))

function allyAct(w: World, ps: Players, pid: number, a: Exclude<WorldAction, { type: 'raid' | 'go' | 'recall' | 'rally' | 'rallyJoin' | 'aid' }>, now: number): WorldResult {
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

// Lúc đội kế tiếp tới nơi cần server giải (cướp, điểm trên bản đồ) — để server hẹn giờ.
// ponytail: quét mọi hành quân của giới (~1k), đổi sang heap nếu giới to lên nhiều.
const waiting = (m: March) => (m.target.kind === 'pvp' || m.target.kind === 'spot' || m.target.kind === 'trib') && !m.returnAt && !m.stay && !m.back
type Party = [pid: number, s: State, m: March][] // các đội đi cùng (kết trận), state đã đưa tới lúc tới nơi
// Viện binh đang đóng ở nhà người chơi pid
export const aidAt = (ps: Players, pid: number): [number, March][] =>
  [...ps].flatMap(([p, s]) => s.marches.filter(m => m.task === 'aid' && m.stay && m.target.i === pid).map(m => [p, m] as [number, March]))
export function nextRaid(ps: Players) {
  let at = Infinity
  for (const s of ps.values()) for (const m of s.marches) if (waiting(m) && m.arriveAt < at) at = m.arriveAt
  return at
}

// Đội quay về tay không (mục tiêu không còn, vừa có khiên, điểm đầy quân)
const turnBack = (s: State, m: March, at: number): State => ({
  ...s, marches: s.marches.map(x => (x.id === m.id ? { ...m, stay: false, back: m.army, hurt: m.hurt ?? {}, gain: { res: {}, items: {}, exp: 0 }, returnAt: at + (at - m.startAt) } : x)),
})

// Giải mọi đội đã tới nơi (≤ now) theo thứ tự thời gian: trận cướp (đổi state cả hai bên), điểm trên bản đồ (đổi phần chung)
export function advanceAll(ps: Players, w: World, now: number, map?: MapCtx): { changed: Players; world: World } {
  const due: [at: number, pid: number, id: number][] = []
  for (const [pid, s] of ps) for (const m of s.marches) if (waiting(m) && m.arriveAt <= now) due.push([m.arriveAt, pid, m.id])
  const changed: Players = new Map()
  due.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])
  const cur = (id: number) => changed.get(id) ?? ps.get(id)
  const view = (): Players => new Map([...ps.keys()].map(id => [id, cur(id)!])) // cả giới như lúc này (quân đóng ở điểm)
  const done = new Set<string>() // đội đã giải cùng nhóm kết trận
  for (const [at, pid, id] of due) {
    if (done.has(`${pid}:${id}`)) continue
    const att = advance(cur(pid)!, at)
    const m = att.marches.find(x => x.id === id)!
    if (m.target.kind === 'trib') {
      // kiếp vân giáng: đồng minh đóng ở nhà là hộ pháp (nhẹ kiếp, nhận kinh nghiệm), mỗi lần bị cướp trúng lúc tụ làm nặng kiếp
      const guards = aidAt(view(), pid).slice(0, TRIB_AID)
      changed.set(pid, tribEnd(att, id, at, (1 - HO_PHAP * guards.length) * (1 + PHA_KIEP * Math.min(TRIB_AID, m.foil ?? 0))))
      const exp = Math.round(TRIB_EXP[m.target.i] * HO_PHAP_EXP)
      for (const [hp, hm] of guards) changed.set(hp, giveExp(advance(cur(hp)!, at), hm.elder, exp))
      continue
    }
    if (m.target.kind === 'spot') {
      // kết trận: mọi đội cùng mã, cùng lúc tới, giải một lần như một bên
      const group: Party = m.rally === undefined ? [[pid, att, m]] : due.flatMap(([a2, p2, id2]) => {
        if (a2 !== at) return []
        const s2 = p2 === pid ? att : advance(cur(p2)!, at)
        const m2 = s2.marches.find(x => x.id === id2)!
        return m2.rally === m.rally ? [[p2, s2, m2] as [number, State, March]] : []
      })
      for (const [p2, , m2] of group) done.add(`${p2}:${m2.id}`)
      const r = map ? spotArrive(view(), w, map, group, at) : { changed: new Map(group.map(([p2, s2, m2]) => [p2, turnBack(s2, m2, at)])), world: w }
      for (const [k, v] of r.changed) changed.set(k, v)
      w = r.world
      if (m.rally !== undefined) w = { ...w, rallies: Object.fromEntries(Object.entries(w.rallies).filter(([k]) => Number(k) !== m.rally)) }
      continue
    }
    const d = cur(m.target.i)
    if (m.task === 'aid') {
      // viện binh tới nơi: còn cùng minh và nhà đó chưa đủ viện binh thì đóng lại, không thì về
      const ok = d && allyOf(w, pid)?.members[m.target.i] !== undefined && aidAt(view(), m.target.i).length < REINFORCE_MAX
      changed.set(pid, ok ? withMarch(att, { ...m, stay: true }) : turnBack(att, m, at))
      continue
    }
    // tông môn kia không còn (xoá tài khoản), hoặc vừa có khiên (người khác cướp trước): quay về tay không
    if (!d || d.shield > at) {
      changed.set(pid, turnBack(att, m, at))
      continue
    }
    const helpers = aidAt(view(), m.target.i).map(([hp, hm]) => [hp, advance(cur(hp)!, at), hm] as [number, State, March])
    const r = raid(att, pid, advance(d, at), m.target.i, m, at, helpers)
    changed.set(pid, r.att)
    changed.set(m.target.i, r.def)
    for (const [k, v] of r.helpers) changed.set(k, v)
  }
  return { changed, world: w }
}
// Chỉ trận cướp, không bản đồ (sim, test P2)
export const advanceWorld = (ps: Players, now: number): Players => advanceAll(ps, freshWorld(), now).changed

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
// Viện binh (helpers) đứng cùng quân nhà: thua thì bị đánh bật về, thắng thì ở lại với phần còn lại.
export function raid(att: State, attPid: number, def: State, defPid: number, m: March, at: number, helpers: Party = []): { att: State; def: State; helpers: Players } {
  const me = sideOf(att, m.elder, m.army)
  const { side: foe, at: hOffs } = combine([defense(def), ...helpers.map(([, hs, hm]) => sideOf(hs, hm.elder, armyOf(hm)))])
  const f = fight(me, foe, m.seed)
  const last = f.rounds.at(-1)
  const ids = UNITS.filter(u => (m.army[u] ?? 0) > 0)
  const left = last?.n[0] ?? ids.map(u => m.army[u]!)
  const back = Object.fromEntries(ids.map((u, k) => [u, left[k]])) as Army
  const hurt = Object.fromEntries(ids.map((u, k) => [u, m.army[u]! - left[k]])) as Army
  const dIds = UNITS.filter(u => def.troops[u] > 0)
  const n1 = last?.n[1] ?? foe.troops.map(t => t.n)
  const dLeft = n1.slice(0, dIds.length)
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
    marches: f.win ? dd.marches.map(x => (x.target.kind === 'trib' ? { ...x, foil: (x.foil ?? 0) + 1 } : x)) : dd.marches, // phá kiếp
  }
  const hs: Players = new Map()
  helpers.forEach(([hp, st, hm], j) => {
    const d = split({ ...hm, army: armyOf(hm) }, n1, hOffs[j + 1])
    let x = pushReport(st, { at, kind: 'pvp', i: attPid, foe: att.name, def: true, win: !f.win, hurt: d.hurt, dead: {}, gain: { res: {}, items: {}, exp: 0 }, fights: flip })
    x = withMarch(x, f.win ? { ...hm, stay: false, back: d.left, hurt: addArmy(hm.hurt, d.hurt), gain: { res: {}, items: {}, exp: 0 }, returnAt: at + travel(hm) } : { ...hm, army: d.left, hurt: addArmy(hm.hurt, d.hurt) })
    hs.set(hp, x)
  })
  return { att: a, def: dd, helpers: hs }
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
export type Seat = { pid: number; name: string; x: number; y: number; hall: number; power: number; npc: boolean; shield: boolean; cloud?: number } // cloud: kiếp vân giáng lúc này
export type MapMarch = { pid: number; id: number; path: Pos[]; startAt: number; arriveAt: number; returnAt: number; foe?: string; spot?: string }
// Điểm khác mặc định: phe giữ (tên minh/tông môn), số đội đóng, mỏ còn bao nhiêu, yêu vương còn máu, lúc hồi
export type SpotView = { i: number; own?: string; n?: number; left?: number; hp?: number; until?: number }
export type MapSnap = { seats: Seat[]; marches: MapMarch[]; chron: Chron[]; spots: SpotView[] }

export function mapOf(ps: Players, now: number, npc: Set<number>, chron: Chron[], w: World = freshWorld()): MapSnap {
  const seats: Seat[] = [], marches: MapMarch[] = []
  for (const [pid, s] of ps) {
    if (!s.seat) continue
    const cloud = s.marches.find(m => m.target.kind === 'trib')?.arriveAt
    seats.push({ pid, name: s.name, x: s.seat.x, y: s.seat.y, hall: s.levels.chuDien, power: Math.round(power(s)), npc: npc.has(pid), shield: s.shield > now, ...(cloud && { cloud }) })
    for (const m of s.marches)
      if (m.path) marches.push({ pid, id: m.id, path: m.path, startAt: m.startAt, arriveAt: m.arriveAt, returnAt: m.returnAt, ...(m.foe && { foe: m.foe }), ...(m.spot && { spot: m.spot }) })
  }
  const spots: SpotView[] = []
  for (const [k, sp] of Object.entries(w.spots)) {
    const i = Number(k)
    const own = sp.own === undefined ? undefined : sp.own > 0 ? (w.allies[sp.own] ? `[${w.allies[sp.own].tag}] ${w.allies[sp.own].name}` : undefined) : ps.get(-sp.own)?.name
    spots.push({ i, own, n: garrison(ps, i).length, left: sp.left, hp: sp.hp, until: sp.until })
  }
  return { seats, marches, chron, spots }
}

// ---------- Điểm trên bản đồ giới: chiếm, khai mỏ, đánh yêu vương ----------

const HOUR = 3_600_000
const TASK_OF: Record<PointKind, Task> = { vein: 'take', gate: 'take', heaven: 'take', mine: 'gather', boss: 'hit' }
// Phe của một người: tiên minh (mã > 0) hoặc chính mình (−mã người chơi)
export const sideKey = (w: World, pid: number) => allyOf(w, pid)?.id ?? -pid
// Quân đang đóng ở điểm i
export const garrison = (ps: Players, i: number): [number, March][] =>
  [...ps].flatMap(([pid, s]) => s.marches.filter(m => m.stay && m.target.kind === 'spot' && m.target.i === i).map(m => [pid, m] as [number, March]))
// Trạng thái điểm lúc now (mỏ cạn / yêu vương chết đã tới giờ hồi thì như mới)
export function spotOf(w: World, map: MapCtx, i: number, now: number): Spot {
  const p = map.atlas.points[i]
  const sp = w.spots[i] ?? {}
  if (p.kind === 'mine') return sp.until && sp.until <= now ? { left: MINE_STOCK[p.lv - 1] } : { ...sp, left: sp.left ?? MINE_STOCK[p.lv - 1] }
  if (p.kind === 'boss') return sp.until && sp.until <= now ? { hp: BOSSES[p.lv]!.str } : { ...sp, hp: sp.hp ?? BOSSES[p.lv]?.str }
  return sp
}
// Một "lát" của yêu vương ở điểm i: đội đánh gặp đúng chừng này (client dùng để ước lượng tỉ lệ thắng)
export function bossSlice(a: Atlas, i: number): Side | null {
  const p = a.points[i], boss = p && BOSSES[p.lv]
  if (!boss || p.kind !== 'boss') return null
  const type = TYPES[i % TYPES.length]
  return mob(boss.str / boss.slices, boss.tier, [[type, 0.5], [BEATS[type], 0.3], [BEATS[BEATS[type]], 0.2]], 1 + p.lv * 10)
}
const setSpot = (w: World, i: number, sp: Spot): World => ({ ...w, spots: { ...w.spots, [i]: sp } })

// ---------- Điểm mùa ----------
export const seasonRate = (p: Point) => (p.kind === 'vein' ? (SEASON_VEIN[p.lv - 1] ?? 0) : p.kind === 'gate' ? SEASON_GATE : p.kind === 'heaven' ? SEASON_HEAVEN : 0)
const bank = (w: World, side: number, pts: number): World => (pts > 0 ? { ...w, pts: { ...w.pts, [side]: (w.pts[side] ?? 0) + pts } } : w)
// Đặt lại điểm i lúc at; đổi phe giữ thì chốt điểm mùa cho phe cũ theo số giờ đã giữ
function hold(w: World, map: MapCtx | undefined, i: number, sp: Spot, at: number): World {
  const old = w.spots[i]
  const next = setSpot(w, i, sp)
  if (!map || old?.own === undefined || old.own === sp.own) return next
  return bank(next, old.own, ((at - (old.since ?? at)) / HOUR) * seasonRate(map.atlas.points[i]))
}
// Điểm mùa lúc now: đã chốt + phần đang giữ
export function seasonPts(w: World, map: MapCtx, now: number): Record<number, number> {
  const pts = { ...w.pts }
  for (const [k, sp] of Object.entries(w.spots))
    if (sp.own !== undefined && sp.since !== undefined) pts[sp.own] = (pts[sp.own] ?? 0) + (Math.max(0, now - sp.since) / HOUR) * seasonRate(map.atlas.points[Number(k)])
  return pts
}
export type SeasonRow = { side: number; name: string; pts: number } // side > 0: tiên minh; < 0: người đi một mình
export function seasonBoard(w: World, ps: Players, map: MapCtx, now: number): SeasonRow[] {
  const name = (side: number) => (side > 0 ? w.allies[side] && `[${w.allies[side].tag}] ${w.allies[side].name}` : ps.get(-side)?.name)
  return Object.entries(seasonPts(w, map, now))
    .map(([k, pts]) => ({ side: Number(k), name: name(Number(k)) ?? '', pts: Math.floor(pts) }))
    .filter(r => r.name && r.pts > 0)
    .sort((a, b) => b.pts - a.pts || a.side - b.side)
}

// Hết mùa cho cả giới (trừ skip: NPC, server làm mới riêng): minh đứng đầu (người từ ASCEND_HALL) và ai ở tầng cao nhất phi thăng,
// còn lại luân hồi một kiếp; ai cũng nhận thư kết quả. Phần chung làm mới, giữ tiên minh (bỏ các việc đang nhờ giúp).
export function endSeason(ps: Players, w: World, map: MapCtx, now: number, season: number, skip: Set<number>): { changed: Players; world: World; top: SeasonRow[] } {
  const top = seasonBoard(w, ps, map, now)
  const first = top.find(r => r.side > 0)?.side
  const rank = new Map(top.map((r, k) => [r.side, k + 1]))
  const changed: Players = new Map()
  for (const [pid, s] of ps) {
    if (skip.has(pid)) continue
    const side = sideKey(w, pid)
    const up = (side === first && s.levels.chuDien >= ASCEND_HALL) || s.levels.chuDien >= MAX_LEVEL
    changed.set(pid, mail(seasonEnd(s, now, up ? ASCEND : 1, up ? season : undefined), { at: now, k: 'season', a: [season, rank.get(side) ?? 0, up ? 1 : 0] }))
  }
  const allies = Object.fromEntries(Object.entries(w.allies).map(([k, a]) => [k, { ...a, helps: [] }]))
  return { changed, world: { ...freshWorld(), allies, nextAlly: w.nextAlly, nextRally: w.nextRally }, top }
}
const carryOf = (army: Army) => UNITS.reduce((sum, u) => sum + (army[u] ?? 0) * CARRY * TIER[unitOf(u).tier].stat, 0)
const withMarch = (s: State, m: March): State => ({ ...s, marches: s.marches.map(x => (x.id === m.id ? m : x)) })
const travel = (m: March) => m.arriveAt - m.startAt

function goAct(ps: Players, w: World, pid: number, a: Extract<WorldAction, { type: 'go' }>, now: number, seed: number, map?: MapCtx): WorldResult {
  const s = advance(ps.get(pid)!, now)
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
  if (a.task === 'take' && garrison(ps, a.i).filter(([id]) => sideKey(w, id) === sideKey(w, pid)).length >= GARRISON_MAX) return no('full')
  if (s.marches.some(m => m.target.kind === 'spot' && m.target.i === a.i)) return no('busy') // mỗi người một đội mỗi điểm
  const e = armyError(s, a.elder, a.army) ?? (s.marches.length >= marchSlots(s) ? 'slots' : null)
  if (e) return no(e)
  const army = Object.fromEntries(UNITS.filter(u => a.army[u]).map(u => [u, a.army[u]])) as Army
  const m: March = {
    id: s.nextId, elder: a.elder, army, target: { kind: 'spot', i: a.i }, task: a.task, spot: p.kind, seed, startAt: t,
    arriveAt: t + Math.round(r.len * TILE_TIME * cutOf(s, 'march')), returnAt: 0, path: r.path,
  }
  return { ok: true, world: w, changed: new Map([[pid, { ...s, troops: minus(s.troops, army), marches: [...s.marches, m], nextId: s.nextId + 1 }]]) }
}

// Gọi về: đội đóng quân về nhà (còn ai của phe mình ở đó thì điểm vẫn giữ); đội đang khai mỏ mang về phần đã khai theo tỉ lệ thời gian
function recallAct(ps: Players, w: World, pid: number, mid: number, now: number, map?: MapCtx): WorldResult {
  const s = advance(ps.get(pid)!, now)
  const t = s.time
  const m = s.marches.find(x => x.id === mid)
  if (!m || !(m.target.kind === 'spot' || m.task === 'aid') || !(m.stay || (m.mine && m.mine.end > t))) return no('bad')
  const i = m.target.i
  if (m.task === 'aid') return { ok: true, world: w, changed: new Map([[pid, withMarch(s, { ...m, stay: false, back: m.army, hurt: m.hurt ?? {}, gain: { res: {}, items: {}, exp: 0 }, returnAt: t + travel(m) })]]) }
  if (m.stay) {
    const next = withMarch(s, { ...m, stay: false, back: m.army, hurt: m.hurt ?? {}, gain: { res: {}, items: {}, exp: 0 }, returnAt: t + travel(m) })
    const left = garrison(new Map([...ps, [pid, next]]), i).filter(([id]) => sideKey(w, id) === w.spots[i]?.own)
    return { ok: true, changed: new Map([[pid, next]]), world: left.length ? w : hold(w, map, i, {}, t) }
  }
  const mine = m.mine!
  const got = Math.floor((mine.amount * (t - m.arriveAt)) / Math.max(1, mine.end - m.arriveAt))
  const next = withMarch(s, { ...m, mine: { ...mine, end: t, amount: got }, gain: { res: { [mine.res]: got }, items: {}, exp: 0 }, returnAt: t + travel(m) })
  const sp = map ? spotOf(w, map, i, t) : (w.spots[i] ?? {})
  return { ok: true, changed: new Map([[pid, next]]), world: setSpot(w, i, { left: (sp.left ?? 0) + (mine.amount - got) }) }
}

// Gộp nhiều đội thành một bên (quân đóng ở điểm, kết trận): nối các nhóm quân; công pháp và hành của đội đầu
// at[j]: nhóm quân đầu tiên của đội j trong bên gộp
function combine(parts: Side[]): { side: Side; at: number[] } {
  const at: number[] = []
  let k = 0
  for (const p of parts) at.push(k), (k += p.troops.length)
  return { side: { troops: parts.flatMap(p => p.troops), skill: parts[0]?.skill, el: parts[0]?.el }, at }
}
const armyOf = (m: March) => Object.fromEntries(UNITS.filter(u => (m.army[u] ?? 0) > 0).map(u => [u, m.army[u]!])) as Army
// số còn lại của đội thứ j (nhóm quân theo thứ tự UNITS có mặt) từ mảng n của trận gộp
function split(m: March, n: number[], from: number): { left: Army; hurt: Army } {
  const ids = UNITS.filter(u => (m.army[u] ?? 0) > 0)
  const left = Object.fromEntries(ids.map((u, k) => [u, n[from + k]])) as Army
  const hurt = Object.fromEntries(ids.map((u, k) => [u, m.army[u]! - n[from + k]])) as Army
  return { left, hurt }
}
const addArmy = (a: Army = {}, b: Army) => Object.fromEntries(UNITS.filter(u => (a[u] ?? 0) + (b[u] ?? 0) > 0).map(u => [u, (a[u] ?? 0) + (b[u] ?? 0)])) as Army

function spotArrive(ps: Players, w: World, map: MapCtx, group: Party, at: number): { changed: Players; world: World } {
  const [pid, att, m] = group[0]
  const i = m.target.i, p = map.atlas.points[i]
  const changed: Players = new Map()
  const back = (): { changed: Players; world: World } => ({ changed: new Map(group.map(([p2, s2, m2]) => [p2, turnBack(s2, m2, at)])), world: w })
  const me = sideKey(w, pid)
  const sp = spotOf(w, map, i, at)
  const empty = { res: {}, items: {}, exp: 0 }

  if (m.task === 'gather') {
    if (!sp.left || (sp.until ?? 0) > at) return back()
    const amount = Math.min(carryOf(m.army), sp.left)
    const t = tide(map.atlas, at)
    const rate = MINE_RATE[p.lv - 1] * (t.active && t.region === p.region ? 1 + TIDE_MINE : 1)
    const end = at + Math.round((amount / rate) * HOUR)
    const res = RESOURCES[i % RESOURCES.length]
    changed.set(pid, withMarch(att, { ...m, mine: { end, amount, res }, back: m.army, hurt: {}, gain: { res: { [res]: amount }, items: {}, exp: 0 }, returnAt: end + travel(m) }))
    const left = sp.left - amount
    return { changed, world: setSpot(w, i, left > 0 ? { left } : { left: 0, until: at + MINE_RESPAWN }) }
  }

  // bên đánh: một đội, hoặc cả nhóm kết trận gộp làm một (công pháp của đội mở trận)
  const parts = group.map(([, s2, m2]) => sideOf(s2, m2.elder, armyOf(m2)))
  const { side: mine, at: aOffs } = combine(parts)
  const lead0 = snap(mine, m.elder, elderLevel(att.elders[m.elder]))

  if (m.task === 'hit') {
    const boss = BOSSES[p.lv]
    if (!boss || (sp.until ?? 0) > at) return back()
    const slice = bossSlice(map.atlas, i)!
    const f = fight(mine, slice, m.seed)
    const last = f.rounds.at(-1)
    const k = TIER[boss.tier].stat
    const dmg = Math.round(slice.troops.reduce((sum, t, g) => sum + (t.n - (last?.n[1][g] ?? t.n)) * k, 0))
    // sát thương của từng đội theo phần lực chiến góp vào
    const mights = parts.map(x => might(x)), total = mights.reduce((a, b) => a + b, 0) || 1
    const dmgs = { ...sp.dmg }
    group.forEach(([p2, s2, m2], j) => {
      const mine2 = Math.round((dmg * mights[j]) / total)
      dmgs[p2] = (dmgs[p2] ?? 0) + mine2
      const { left, hurt } = split(m2, last?.n[0] ?? mine.troops.map(t => t.n), aOffs[j])
      const exp = Math.round((mine2 / 20) * (1 + lead(s2, m2.elder, 'exp')))
      let x = pushReport(s2, { at, kind: 'spot', i, spot: p.kind, win: f.win, hurt, dead: {}, gain: { ...empty, exp }, fights: [{ a: lead0, b: snap(slice, undefined, 1 + p.lv * 10), rounds: f.rounds }] })
      x = withMarch(x, { ...m2, back: left, hurt, gain: { ...empty, exp }, report: x.nextId - 1, returnAt: at + travel(m2) })
      changed.set(p2, x)
    })
    const hp = (sp.hp ?? boss.str) - dmg
    if (hp > 0) return { changed, world: setSpot(w, i, { hp, dmg: dmgs }) }
    // hạ yêu vương: thưởng chia theo sát thương (qua thư); người đánh nhiều nhất nhận trưởng lão (nếu có)
    const sum = Object.values(dmgs).reduce((a, b) => a + b, 0) || 1
    Object.entries(dmgs).sort((a, b) => b[1] - a[1]).forEach(([id2, d], n) => {
      const who = Number(id2), st = changed.get(who) ?? ps.get(who)
      if (!st) return
      const share = d / sum
      const gift: Reward = {
        res: Object.fromEntries(RESOURCES.map(r => [r, Math.floor((boss.reward.res?.[r] ?? 0) * share)])),
        items: Object.fromEntries(Object.entries(boss.reward.items ?? {}).map(([pk, v]) => [pk, Math.max(n === 0 ? 1 : 0, Math.floor(v! * share))])),
        ...(n === 0 && boss.reward.elder && st.elders[boss.reward.elder] === undefined && { elder: boss.reward.elder }),
      }
      changed.set(who, mail(st, { at, k: 'boss', a: [p.lv, n + 1, Math.round(share * 100)], gift }))
    })
    let dead = setSpot(w, i, { until: at + boss.respawn })
    for (const [id2, d] of Object.entries(dmgs)) dead = bank(dead, sideKey(w, Number(id2)), ((SEASON_BOSS[p.lv] ?? 0) * d) / sum)
    return { changed, world: dead }
  }

  // take: điểm trống hoặc của phe mình → đóng quân (tới khi đầy); của phe khác → đánh cả quân đang đóng
  const gar = garrison(ps, i)
  const foes = gar.filter(([id2]) => sideKey(w, id2) !== me)
  const station = (list: Party, n0?: number[]) => {
    let room = GARRISON_MAX - gar.filter(([id2]) => sideKey(w, id2) === me).length
    list.forEach(([p2, s2, m2], j) => {
      const d = n0 ? split(m2, n0, aOffs[j]) : { left: m2.army, hurt: {} }
      const cur2 = changed.get(p2) ?? s2
      changed.set(p2, room-- > 0 ? withMarch(cur2, { ...m2, army: d.left, hurt: addArmy(m2.hurt, d.hurt), stay: true }) : turnBack(withMarch(cur2, { ...m2, army: d.left, hurt: addArmy(m2.hurt, d.hurt) }), { ...m2, army: d.left }, at))
    })
  }
  if (!foes.length) {
    if (gar.length >= GARRISON_MAX) return back()
    station(group)
    return { changed, world: sp.own === me ? w : hold(w, map, i, { own: me, since: at }, at) }
  }
  const { side: def, at: offs } = combine(foes.map(([id2, x]) => sideOf(ps.get(id2)!, x.elder, armyOf(x))))
  const f = fight(mine, def, m.seed)
  const last = f.rounds.at(-1)
  const n0 = last?.n[0] ?? mine.troops.map(t => t.n), n1 = last?.n[1] ?? def.troops.map(t => t.n)
  const dSnap = snap(def, foes[0][1].elder, elderLevel(ps.get(foes[0][0])!.elders[foes[0][1].elder]))
  group.forEach(([p2, s2, m2], j) => {
    const a = split(m2, n0, aOffs[j])
    changed.set(p2, pushReport(s2, { at, kind: 'spot', i, spot: p.kind, foe: ps.get(foes[0][0])!.name, win: f.win, hurt: a.hurt, dead: {}, gain: empty, fights: [{ a: lead0, b: dSnap, rounds: f.rounds }] }))
  })
  if (f.win) station(group, n0)
  else group.forEach(([p2, , m2], j) => {
    const a = split(m2, n0, aOffs[j])
    changed.set(p2, withMarch(changed.get(p2)!, { ...m2, back: a.left, hurt: addArmy(m2.hurt, a.hurt), gain: empty, returnAt: at + travel(m2) }))
  })
  const flip = f.rounds.map(r => ({ n: [r.n[1], r.n[0]] as [number[], number[]], cast: [r.cast[1], r.cast[0]] as [boolean, boolean] }))
  foes.forEach(([id2, x], j) => {
    const st = changed.get(id2) ?? ps.get(id2)!
    const d = split({ ...x, army: armyOf(x) }, n1, offs[j])
    const hurt = addArmy(x.hurt, d.hurt)
    let ds = pushReport(st, { at, kind: 'spot', i, spot: p.kind, foe: att.name, def: true, win: !f.win, hurt: d.hurt, dead: {}, gain: empty, fights: [{ a: dSnap, b: lead0, rounds: flip }] })
    // bị đánh bật: về nhà với phần còn lại; giữ được: ở lại, bớt quân
    ds = withMarch(ds, f.win ? { ...x, stay: false, back: d.left, hurt, gain: empty, report: ds.nextId - 1, returnAt: at + travel(x) } : { ...x, army: d.left, hurt })
    changed.set(id2, ds)
  })
  return { changed, world: f.win ? hold(w, map, i, { own: me, since: at }, at) : w }
}

// Mở kết trận / góp đội: chỉ trong minh; mọi đội tới đích đúng lúc `at` (đội ở gần đi chậm lại cho khớp)
function rallyAct(ps: Players, w: World, pid: number, a: Extract<WorldAction, { type: 'rally' | 'rallyJoin' }>, now: number, seed: number, map?: MapCtx): WorldResult {
  const s = advance(ps.get(pid)!, now)
  const t = s.time
  const al = allyOf(w, pid)
  if (!map || !s.seat) return no('far')
  if (!al) return no('locked')
  const rally = a.type === 'rallyJoin' ? w.rallies[a.id] : undefined
  if (a.type === 'rallyJoin' && (!rally || rally.ally !== al.id || rally.at <= t)) return no('gone')
  const i = rally?.i ?? (a as { i: number }).i
  const p = map.atlas.points[i]
  const task = rally?.task ?? (p?.kind === 'boss' ? 'hit' : p && ['vein', 'gate', 'heaven'].includes(p.kind) ? 'take' : null)
  if (!p || !task) return no('bad')
  const r = route(map.atlas, s.seat, p, map.phase)
  if (!r) return no('far')
  const ms = Math.round(r.len * TILE_TIME * cutOf(s, 'march'))
  if (task === 'hit' && (spotOf(w, map, i, t).until ?? 0) > t) return no('cooldown')
  const members = [...ps.values()].flatMap(x => x.marches.filter(m => rally && m.rally === rally.id)).length
  if (rally && (members >= RALLY_MAX || s.marches.some(m => m.rally === rally.id))) return no('full')
  if (rally && t + ms > rally.at) return no('far') // không kịp tới lúc hẹn
  const e = armyError(s, a.elder, a.army) ?? (s.marches.length >= marchSlots(s) ? 'slots' : null)
  if (e) return no(e)
  const army = Object.fromEntries(UNITS.filter(u => a.army[u]).map(u => [u, a.army[u]])) as Army
  const at = rally?.at ?? t + Math.max(RALLY_WAIT[(a as { wait: 0 | 1 | 2 }).wait], ms)
  const id2 = rally?.id ?? w.nextRally
  const m: March = { id: s.nextId, elder: a.elder, army, target: { kind: 'spot', i }, task, spot: p.kind, rally: id2, seed, startAt: t, arriveAt: at, returnAt: 0, path: r.path }
  const next = { ...s, troops: minus(s.troops, army), marches: [...s.marches, m], nextId: s.nextId + 1 }
  const world = rally ? w : { ...w, rallies: { ...w.rallies, [id2]: { id: id2, ally: al.id, by: pid, i, task, at } }, nextRally: id2 + 1 }
  return { ok: true, world, changed: new Map([[pid, next]]) }
}

// Viện binh: đóng quân ở nhà người cùng minh, tối đa REINFORCE_MAX đội; nhà đó bị cướp thì cùng thủ
function aidAct(ps: Players, w: World, pid: number, a: Extract<WorldAction, { type: 'aid' }>, now: number, seed: number, map?: MapCtx): WorldResult {
  const s = advance(ps.get(pid)!, now)
  const t = s.time
  const to = ps.get(a.pid)
  if (!to || a.pid === pid) return no('gone')
  if (allyOf(w, pid)?.members[a.pid] === undefined) return no('locked')
  if (aidAt(ps, a.pid).length >= REINFORCE_MAX) return no('full')
  if (s.marches.some(m => m.task === 'aid' && m.target.i === a.pid)) return no('busy')
  const go = raidPath(s, to, map)
  if (!go) return no('far')
  const e = armyError(s, a.elder, a.army) ?? (s.marches.length >= marchSlots(s) ? 'slots' : null)
  if (e) return no(e)
  const army = Object.fromEntries(UNITS.filter(u => a.army[u]).map(u => [u, a.army[u]])) as Army
  const m: March = { id: s.nextId, elder: a.elder, army, target: { kind: 'pvp', i: a.pid }, task: 'aid', foe: to.name, seed, startAt: t, arriveAt: t + go.ms, returnAt: 0, ...(go.path && { path: go.path }) }
  return { ok: true, world: w, changed: new Map([[pid, { ...s, troops: minus(s.troops, army), marches: [...s.marches, m], nextId: s.nextId + 1 }]]) }
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
      ...(t.active && regionOf(map.atlas, s.seat) === t.region ? [{ key: 'prod' as const, v: TIDE_PROD, until: t.end, src: `tide${t.cycle}` }] : []),
    ]
    const keep = s.buffs.filter(b => b.src !== 'vein' && !b.src.startsWith('tide'))
    const have = s.buffs.filter(b => b.src === 'vein' || b.src.startsWith('tide'))
    if (JSON.stringify(have) === JSON.stringify(want)) continue
    const st = advance(s, at) // sản lượng trước lúc đổi tính theo buff cũ
    changed.set(pid, { ...st, buffs: [...keep, ...want] })
  }
  return changed
}
