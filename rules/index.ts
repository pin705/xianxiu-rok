import { fight, type Round, type Side, type Troop } from './combat.ts'
import {
  BASE_CAP, BASE_RATE, BATCH_BASE, BATCH_STEP, BEASTS, BEAST_COOLDOWN, BEAST_EXP, BEAST_LOOT, BEAST_STR, BEATS, BOI_NGUYEN_EXP,
  BREW_MAX, BUILDINGS, CAP_GROWTH, COST_GROWTH, DAILY, DAILY_BONUS, DAILY_HALL, DAILY_RES, DAY_OFFSET, DO_KIEP, ELDERS, ELDER_MAX, ELDER_STEP, EXP_BASE, FIRST_ELDER, HEAL_COST,
  HEAL_TIME, HOME, HOSPITAL_BASE, HOSPITAL_STEP, LOSS_EXP, MAIN_SHARE, MAP_HALL, MARCH_MIN, MARCH_SLOTS, MARCH_SPEED,
  MAX_CUT, MAX_LEVEL, PILLS, QUESTS, QUEUE_SIZE, REALMS, REBIRTH_BUILD, REBIRTH_HEAD, REBIRTH_HEAD_MAX, REBIRTH_PROD, RESOURCES, SECTS, SECT_COOLDOWN,
  SECT_SHARE, SPEEDUP, START, TECHS, TECH_COST_GROWTH, TECH_ROWS, TECH_TIME_GROWTH, TIER, TIME_GROWTH, TRIBS, TRIB_COOLDOWN,
  TRIB_EXP, TYPES, UNITS, UNIT_BASE,
  type Bag, type Bonus, type BuildingId, type DailyId, type ElderId, type PillId, type Quest, type Res, type Reward, type Skill,
  type TechId, type Tier, type UnitId, type UnitType,
} from './data.ts'

export * from './data.ts'
export { advantage, fight, might, rng, type Fight, type Round, type Side, type Troop } from './combat.ts'

// Luật game thuần: không I/O, không tự đọc đồng hồ — thời gian (ms) luôn được truyền vào.
// Client và server chạy chung đúng file này.

export type Troops = Record<UnitId, number>
export type Army = Partial<Troops>
export type Items = Partial<Record<PillId, number>>
export type Job = { building: BuildingId; level: number; startAt: number; finishAt: number }
export type TrainJob = { unit: UnitId; n: number; startAt: number; finishAt: number }
export type HealJob = { troops: Army; startAt: number; finishAt: number }
export type StudyJob = { tech: TechId; level: number; startAt: number; finishAt: number }
export type BrewJob = { pill: PillId; n: number; startAt: number; finishAt: number }
export type Target = { kind: 'beast' | 'sect' | 'realm'; i: number }
export type Gain = { res: Partial<Bag>; items: Items; elder?: ElderId; exp: number }
export type March = {
  id: number
  elder: ElderId
  army: Army
  target: Target
  seed: number
  startAt: number
  arriveAt: number
  returnAt: number
  back?: Army // sau trận: đệ tử còn đứng được, thương binh và chiến lợi phẩm mang về
  hurt?: Army
  gain?: Gain
  report?: number
}
export type Snap = { elder?: ElderId; level: number; troops: { type: UnitType; tier: Tier; n: number }[] }
export type Report = {
  id: number
  at: number
  kind: 'beast' | 'sect' | 'realm' | 'trib'
  i: number
  f?: number // bí cảnh: tầng
  win: boolean
  fights: { a: Snap; b: Snap; rounds: Round[] }[]
  hurt: Army // thương vong
  dead: Army // phần Đan phòng không còn chỗ nằm
  gain: Gain
}
export type Stats = { trained: number; healed: number; brewed: number; won: number; lost: number }
export type Daily = { day: number; n: Record<DailyId, number>; got: boolean[]; bonus: boolean }

export type State = {
  v: 3                               // phiên bản save
  name: string                       // tên tông môn
  quest: number                      // chỉ số nhiệm vụ hiện tại trong QUESTS
  time: number                       // tài nguyên đã tính tới mốc này
  res: Bag
  carry: Bag                         // phần lẻ chưa đủ 1 đơn vị (đơn vị × ms), để kết quả không phụ thuộc số lần gọi advance
  levels: Record<BuildingId, number>
  queue: Job[]
  troops: Troops                     // đệ tử đang ở tông môn
  wounded: Troops                    // thương binh nằm ở Đan phòng (kể cả đang được chữa)
  train: TrainJob | null
  heal: HealJob | null
  study: StudyJob | null
  brew: BrewJob | null
  tech: Partial<Record<TechId, number>>
  items: Items
  elders: Partial<Record<ElderId, number>> // trưởng lão đã thu nhận → kinh nghiệm
  marches: March[]
  reports: Report[]
  seen: number                       // id chiến báo mới nhất đã đọc
  beast: number                      // cấp yêu thú cao nhất đã hạ
  cool: Record<string, number>       // mục tiêu đã hạ → lúc có lại
  sects: boolean[]                   // đã hạ lần đầu
  realms: number[]                   // số tầng bí cảnh đã qua
  trib: number                       // số lần độ kiếp đã vượt
  tribCool: number
  rebirths: number
  seed: number                       // mầm ngẫu nhiên cho trận kế tiếp
  nextId: number
  stats: Stats
  daily: Daily                       // nhiệm vụ ngày: tiến độ hôm nay, việc đã nhận thưởng
}

export type Action =
  | { type: 'upgrade'; building: BuildingId }
  | { type: 'claim' }
  | { type: 'train'; unit: UnitId; n: number }
  | { type: 'heal' }
  | { type: 'study'; tech: TechId }
  | { type: 'brew'; pill: PillId; n: number }
  | { type: 'march'; target: Target; elder: ElderId; army: Army }
  | { type: 'realm'; i: number; elder: ElderId; army: Army }
  | { type: 'trib'; elder: ElderId; army: Army; pill: boolean }
  | { type: 'speed'; job: JobKind; n: number }
  | { type: 'feed'; elder: ElderId; n: number }
  | { type: 'seen' }
  | { type: 'rebirth' }
  | { type: 'daily'; i: number }
  | { type: 'dailyBonus' }
export type JobKind = 'build' | 'train' | 'heal' | 'study' | 'brew'
export type Err =
  | 'max_level' | 'need_main_hall' | 'busy' | 'queue_full' | 'not_enough' | 'not_done' | 'locked' | 'cooldown'
  | 'empty' | 'no_item' | 'slots' | 'trib' | 'bad'
export type Result = { ok: true; state: State } | { ok: false; error: Err }

const HOUR = 3_600_000
export const IDS = Object.keys(BUILDINGS) as BuildingId[]
export const TECH_IDS = Object.keys(TECHS) as TechId[]
export const ELDER_IDS = Object.keys(ELDERS) as ElderId[]
export const PILL_IDS = Object.keys(PILLS) as PillId[]
const bag = (f: (r: Res) => number) => Object.fromEntries(RESOURCES.map(r => [r, f(r)])) as Bag
const troops = (f: (u: UnitId) => number) => Object.fromEntries(UNITS.map(u => [u, f(u)])) as Troops
export const count = (a: Army) => UNITS.reduce((sum, u) => sum + (a[u] ?? 0), 0)
const plus = (a: Troops, b: Army) => troops(u => a[u] + (b[u] ?? 0))
const minus = (a: Troops, b: Army) => troops(u => a[u] - (b[u] ?? 0))
const addBag = (a: Bag, b: Partial<Bag>) => bag(r => a[r] + (b[r] ?? 0))
const addItems = (a: Items, b: Items) => Object.fromEntries(PILL_IDS.map(p => [p, (a[p] ?? 0) + (b[p] ?? 0)])) as Items
export const afford = (have: Bag, c: Bag) => RESOURCES.every(r => have[r] >= c[r])
const nextSeed = (seed: number) => (Math.imul(seed, 1664525) + 1013904223) >>> 0

// Nhân lặp thay cho Math.pow: phép nhân IEEE cho cùng kết quả trên mọi engine, pow thì không chắc.
function grow(base: number, factor: number, times: number) {
  let v = base
  for (let i = 0; i < times; i++) v *= factor
  return Math.round(v)
}

export const DEFAULT_NAME = 'Thanh Vân Tông'

export function newGame(now: number, name = DEFAULT_NAME): State {
  const levels = Object.fromEntries(IDS.map(id => [id, 0])) as Record<BuildingId, number>
  levels.chuDien = 1
  const clean = name.trim().replace(/\s+/g, ' ').slice(0, 20) || DEFAULT_NAME
  return {
    v: 3, name: clean, quest: 0, time: now, res: { ...START }, carry: bag(() => 0), levels, queue: [],
    troops: troops(() => 0), wounded: troops(() => 0), train: null, heal: null, study: null, brew: null,
    tech: {}, items: {}, elders: { [FIRST_ELDER]: 0 }, marches: [], reports: [], seen: 0,
    beast: 0, cool: {}, sects: SECTS.map(() => false), realms: REALMS.map(() => 0), trib: 0, tribCool: 0, rebirths: 0,
    seed: now >>> 0 || 1, nextId: 1, stats: { trained: 0, healed: 0, brewed: 0, won: 0, lost: 0 }, daily: freshDaily(now),
  }
}

// ---------- Nhiệm vụ ngày ----------

const DAY = 86_400_000
export const dayOf = (t: number) => Math.floor((t + DAY_OFFSET) / DAY)
export const nextDay = (t: number) => (dayOf(t) + 1) * DAY - DAY_OFFSET // lúc làm mới kế tiếp
const freshDaily = (t: number): Daily => ({ day: dayOf(t), n: { build: 0, train: 0, win: 0, brew: 0 }, got: DAILY.map(() => false), bonus: false })
const rollDay = (s: State, t: number): State => (dayOf(t) > s.daily.day ? { ...s, daily: freshDaily(t) } : s)
const bump = (s: State, id: DailyId, k = 1): State => ({ ...s, daily: { ...s.daily, n: { ...s.daily.n, [id]: s.daily.n[id] + k } } })
export const dailyDone = (s: State, i: number) => s.daily.n[DAILY[i].id] >= DAILY[i].n
export const dailyReward = (s: State) => DAILY_RES * s.levels.chuDien
// Số việc làm xong mà chưa nhận thưởng (kể cả rương) — để hiện huy hiệu
export const dailyReady = (s: State) =>
  s.levels.chuDien < DAILY_HALL ? 0 : DAILY.filter((_, i) => dailyDone(s, i) && !s.daily.got[i]).length + (s.daily.got.every(Boolean) && !s.daily.bonus ? 1 : 0)

// ---------- Chỉ số ----------

// Công pháp + luân hồi. Bonus giảm (thời gian, chi phí) dùng qua cut().
export function bonus(s: State, key: Bonus) {
  let v = 0
  for (const id of TECH_IDS) if (TECHS[id].key === key) v += TECHS[id].v * (s.tech[id] ?? 0)
  if (key === 'prod') v += REBIRTH_PROD * s.rebirths
  if (key === 'build') v += REBIRTH_BUILD * s.rebirths
  return v
}
const cut = (s: State, key: Bonus) => 1 - Math.min(MAX_CUT, bonus(s, key))

export const elderLevel = (exp = 0) => {
  let n = 1
  while (n < ELDER_MAX && EXP_BASE * (n + 1) * n <= exp) n++
  return n
}
export const expAt = (level: number) => EXP_BASE * level * (level - 1)
// bonus của cả tông môn + bị động của trưởng lão dẫn đội
export function lead(s: State, elder: ElderId, key: Bonus) {
  const lv = elderLevel(s.elders[elder])
  return bonus(s, key) + ELDERS[elder].passives.reduce((sum, p) => sum + (lv >= p.at && p.key === key ? p.v : 0), 0)
}

export const cost = (b: BuildingId, level: number) => bag(r => grow(BUILDINGS[b].cost[r], COST_GROWTH, level - 1))
export const buildTime = (s: State, b: BuildingId, level: number) =>
  Math.round(grow(BUILDINGS[b].time, TIME_GROWTH, level - 1) * cut(s, 'build')) * 1000
export const capAt = (vaultLevel: number) => grow(BASE_CAP, CAP_GROWTH, vaultLevel)
export const storage = (s: State) => Math.round(capAt(s.levels.tangBaoCac) * (1 + bonus(s, 'storage')))
// Tầng Tàng Bảo Các cần để kho chứa nổi chi phí c (0: đã đủ tiền hoặc kho đủ chỗ).
// Sản lượng dừng khi kho đầy: chi phí vượt sức chứa thì chờ bao lâu cũng không đủ, chỉ còn thưởng/chiến lợi phẩm vượt kho.
export function storeNeed(s: State, c: Bag) {
  const most = Math.max(...RESOURCES.map(r => c[r]))
  if (afford(s.res, c) || most <= storage(s)) return 0
  let l = s.levels.tangBaoCac
  while (l < MAX_LEVEL && storage({ ...s, levels: { ...s.levels, tangBaoCac: l } }) < most) l++
  return l
}
export const baseRate = (s: State, r: Res) =>
  IDS.reduce((sum, id) => (BUILDINGS[id].makes === r ? sum + (BUILDINGS[id].rate ?? 0) * s.levels[id] : sum), BASE_RATE)
export const rate = (s: State, r: Res) => Math.round(baseRate(s, r) * (1 + bonus(s, 'prod') + bonus(s, `prod.${r}`)))

export const unitOf = (u: UnitId) => ({ type: u.slice(0, -1) as UnitType, tier: Number(u.slice(-1)) as Tier })
export const trainCost = (u: UnitId, n: number) => {
  const { type, tier } = unitOf(u)
  return bag(r => Math.round(UNIT_BASE[type].cost[r] * TIER[tier].cost) * n)
}
const unitSeconds = (u: UnitId) => UNIT_BASE[unitOf(u).type].time * TIER[unitOf(u).tier].time
export const trainTime = (s: State, u: UnitId, n: number) => Math.round(unitSeconds(u) * n * cut(s, 'train')) * 1000
export const batch = (s: State) => BATCH_BASE + BATCH_STEP * s.levels.dienVoTruong
export const tierOpen = (s: State, tier: Tier) => s.levels.dienVoTruong >= TIER[tier].unlock
export const hospital = (s: State) => Math.round((HOSPITAL_BASE + HOSPITAL_STEP * s.levels.danPhong) * (1 + bonus(s, 'hospital')))
export const healCost = (s: State, a: Army) =>
  bag(r => Math.round(UNITS.reduce((sum, u) => sum + (a[u] ?? 0) * trainCost(u, 1)[r], 0) * HEAL_COST * cut(s, 'heal')))
export const healTime = (s: State, a: Army) =>
  Math.round(UNITS.reduce((sum, u) => sum + (a[u] ?? 0) * unitSeconds(u), 0) * HEAL_TIME * cut(s, 'heal')) * 1000

export const techCost = (t: TechId, level: number) => bag(r => grow(TECHS[t].cost[r], TECH_COST_GROWTH, level - 1))
export const techTime = (t: TechId, level: number) => grow(TECHS[t].time, TECH_TIME_GROWTH, level - 1) * 1000
export const techSum = (s: State) => TECH_IDS.reduce((sum, t) => sum + (s.tech[t] ?? 0), 0)
export const brewCost = (s: State, p: PillId, n: number) => bag(r => Math.round(PILLS[p].cost[r] * n * cut(s, 'brew')))
export const brewTime = (s: State, p: PillId, n: number) => Math.round(PILLS[p].time * n * cut(s, 'brew')) * 1000

export const away = (s: State) => s.marches.reduce((a, m) => plus(a, m.army), troops(() => 0))
export const totalTroops = (s: State) => count(s.troops) + count(s.wounded) + count(away(s))
export function power(s: State) {
  const out = away(s)
  return (
    IDS.reduce((sum, id) => sum + (BUILDINGS[id].power * s.levels[id] * (s.levels[id] + 1)) / 2, 0) +
    UNITS.reduce((sum, u) => sum + TIER[unitOf(u).tier].power * (s.troops[u] + out[u]), 0) +
    techSum(s) * 30 +
    ELDER_IDS.reduce((sum, e) => sum + (s.elders[e] === undefined ? 0 : elderLevel(s.elders[e]) * 50), 0)
  )
}

// ---------- Bản đồ ----------

export const realmOf = (level: number) => Math.min(3, Math.ceil(level / 5)) // 1 Luyện Khí · 2 Trúc Cơ · 3 Kim Đan
export const marchSlots = (s: State) => MARCH_SLOTS[realmOf(s.levels.chuDien) - 1]
export const tierFor = (level: number): Tier => (level <= 5 ? 1 : level <= 10 ? 2 : 3)
export const beastStr = (level: number) => grow(BEAST_STR[0], BEAST_STR[1], level - 1)
export const beastLoot = (level: number) => grow(BEAST_LOOT[0], BEAST_LOOT[1], level - 1)
export const beastExp = (level: number) => grow(BEAST_EXP[0], BEAST_EXP[1], level - 1)
export const place = (t: Target) => (t.kind === 'beast' ? BEASTS[t.i] : t.kind === 'sect' ? SECTS[t.i] : REALMS[t.i])
export const marchTime = (s: State, t: Target) => {
  const p = place(t)
  return Math.round(Math.max(MARCH_MIN, Math.hypot(p.x - HOME.x, p.y - HOME.y) * MARCH_SPEED) * cut(s, 'march')) * 1000
}
export const coolKey = (t: Target) => `${t.kind}${t.i}`
const same = (a: Target, b: Target) => a.kind === b.kind && a.i === b.i

export function targetError(s: State, t: Target, at = s.time): Err | null {
  const hall = s.levels.chuDien
  if (hall < MAP_HALL) return 'locked'
  if (t.kind === 'beast' && (t.i < 0 || t.i >= BEASTS.length || t.i > s.beast)) return 'locked'
  if (t.kind === 'sect' && (!SECTS[t.i] || hall < SECTS[t.i].hall)) return 'locked'
  if (t.kind === 'realm') {
    if (!REALMS[t.i] || hall < REALMS[t.i].hall) return 'locked'
    if (s.realms[t.i] >= REALMS[t.i].floors.length) return 'max_level'
  }
  if ((s.cool[coolKey(t)] ?? 0) > at) return 'cooldown'
  if (s.marches.some(m => !m.back && same(m.target, t))) return 'busy'
  return null
}

// Đội địch: str tính bằng số đệ tử bậc 1, chia theo tỉ lệ các hệ
export function mob(str: number, tier: Tier, parts: [UnitType, number][], level = 1, skill?: Skill, weaken = 1): Side {
  const k = TIER[tier].stat
  const m = k * (1 + ELDER_STEP * (level - 1))
  return {
    skill,
    troops: parts.map(([type, share]) => ({
      type, tier, n: Math.max(1, Math.round((str * share) / k)),
      atk: UNIT_BASE[type].atk * m * weaken, def: UNIT_BASE[type].def * k, hp: UNIT_BASE[type].hp * m,
    })),
  }
}
const pair = (type: UnitType, share: number): [UnitType, number][] => [[type, share], [BEATS[type], 1 - share]]

export function enemyOf(s: State, t: Target): Side {
  if (t.kind === 'beast') {
    const level = t.i + 1
    return mob(beastStr(level), tierFor(level), pair(BEASTS[t.i].type, MAIN_SHARE))
  }
  if (t.kind === 'sect') {
    const d = SECTS[t.i]
    const rest = TYPES.filter(x => x !== d.type).map(x => [x, (1 - SECT_SHARE) / 2] as [UnitType, number])
    return mob(d.str, tierFor(d.hall), [[d.type, SECT_SHARE], ...rest], d.elder.level, d.elder.skill)
  }
  const d = REALMS[t.i]
  const f = Math.min(s.realms[t.i], d.floors.length - 1)
  return mob(d.floors[f].str, d.tier, pair(d.type, MAIN_SHARE))
}

export function sideOf(s: State, elder: ElderId, army: Army): Side {
  const m = 1 + ELDER_STEP * (elderLevel(s.elders[elder]) - 1)
  const b = (k: Bonus) => lead(s, elder, k)
  return {
    skill: ELDERS[elder].skill,
    troops: UNITS.filter(u => (army[u] ?? 0) > 0).map(u => {
      const { type, tier } = unitOf(u)
      const base = UNIT_BASE[type], k = TIER[tier].stat
      return {
        type, tier, n: army[u]!,
        atk: base.atk * k * m * (1 + b('atk') + b(`atk.${type}`)),
        def: base.def * k * (1 + b('def')),
        hp: base.hp * k * m * (1 + b('hp') + b(`hp.${type}`)),
      }
    }),
  }
}

export function armyError(s: State, elder: ElderId, army: Army): Err | null {
  if (!(elder in ELDERS) || s.elders[elder] === undefined) return 'locked'
  if (s.marches.some(m => m.elder === elder)) return 'busy'
  for (const u of Object.keys(army)) if (!UNITS.includes(u as UnitId)) return 'bad'
  for (const u of UNITS) {
    const n = army[u] ?? 0
    if (!Number.isInteger(n) || n < 0) return 'bad'
    if (n > s.troops[u]) return 'not_enough'
  }
  return count(army) ? null : 'empty'
}

const snap = (side: Side, elder?: ElderId, level = 1): Snap => ({
  elder, level, troops: side.troops.map(t => ({ type: t.type, tier: t.tier, n: t.n })),
})

// Thương binh về Đan phòng; hết chỗ thì phần dư tử trận. Nhận bậc cao trước.
function admit(s: State, hurt: Army): { state: State; dead: Army } {
  let room = Math.max(0, hospital(s) - count(s.wounded))
  const wounded = { ...s.wounded }
  const dead: Army = {}
  for (const u of [...UNITS].sort((a, b) => unitOf(b).tier - unitOf(a).tier)) {
    const n = hurt[u] ?? 0
    const inn = Math.min(n, room)
    room -= inn
    wounded[u] += inn
    if (n > inn) dead[u] = n - inn
  }
  return { state: { ...s, wounded }, dead }
}

function giveExp(s: State, elder: ElderId, exp: number): State {
  const cur = s.elders[elder]
  if (cur === undefined) return s
  return { ...s, elders: { ...s.elders, [elder]: Math.min(expAt(ELDER_MAX), cur + exp) } }
}

function gain(s: State, elder: ElderId, g: Gain): State {
  let st: State = { ...s, res: addBag(s.res, g.res), items: addItems(s.items, g.items) }
  if (g.elder && st.elders[g.elder] === undefined) st = { ...st, elders: { ...st.elders, [g.elder]: 0 } }
  return giveExp(st, elder, g.exp)
}

const fromReward = (r: Reward, lootMul: number, exp: number): Gain => ({
  res: Object.fromEntries(RESOURCES.map(x => [x, Math.round((r.res?.[x] ?? 0) * lootMul)])),
  items: { ...r.items }, elder: r.elder, exp: Math.round(exp),
})

const pushReport = (s: State, r: Omit<Report, 'id'>): State => ({
  ...s, nextId: s.nextId + 1, reports: [...s.reports, { ...r, id: s.nextId }].slice(-30),
  stats: { ...s.stats, won: s.stats.won + (r.win ? 1 : 0), lost: s.stats.lost + (r.win ? 0 : 1) },
})

// Đánh một mục tiêu trên bản đồ. Cập nhật tiến độ bản đồ + chiến báo; phần thưởng trả về để người gọi trao
// (hành quân: lúc về tới tông môn; bí cảnh: ngay).
function battle(s: State, t: Target, elder: ElderId, army: Army, seed: number, at: number) {
  const ids = UNITS.filter(u => (army[u] ?? 0) > 0)
  const me = sideOf(s, elder, army)
  const foe = enemyOf(s, t)
  const f = fight(me, foe, seed)
  const left = f.rounds.at(-1)?.n[0] ?? ids.map(u => army[u]!)
  const back = Object.fromEntries(ids.map((u, k) => [u, left[k]])) as Army
  const hurt = Object.fromEntries(ids.map((u, k) => [u, army[u]! - left[k]])) as Army
  const loot = 1 + lead(s, elder, 'loot')
  const expMul = (1 + lead(s, elder, 'exp')) * (f.win ? 1 : LOSS_EXP)
  let st = s
  let g: Gain = { res: {}, items: {}, exp: 0 }
  let floor: number | undefined
  let foeLevel = 1

  if (t.kind === 'beast') {
    const level = t.i + 1
    g.exp = Math.round(beastExp(level) * expMul)
    if (f.win) {
      g = fromReward({ res: bag(() => beastLoot(level)) }, loot, g.exp)
      st = { ...st, beast: Math.max(st.beast, level), cool: { ...st.cool, [coolKey(t)]: at + BEAST_COOLDOWN } }
    }
  } else if (t.kind === 'sect') {
    const d = SECTS[t.i]
    foeLevel = d.elder.level
    g.exp = Math.round(d.exp * expMul)
    if (f.win) {
      g = st.sects[t.i] ? fromReward({ res: bag(() => d.loot) }, loot, g.exp) : fromReward(d.first, 1, g.exp)
      st = { ...st, sects: st.sects.map((x, k) => x || k === t.i), cool: { ...st.cool, [coolKey(t)]: at + SECT_COOLDOWN } }
    }
  } else {
    floor = st.realms[t.i]
    const r = REALMS[t.i].floors[floor].reward
    g.exp = Math.round((r.exp ?? 0) * expMul)
    if (f.win) {
      g = fromReward(r, 1, g.exp)
      st = { ...st, realms: st.realms.map((x, k) => (k === t.i ? x + 1 : x)) }
    }
  }
  if (f.win) st = bump(st, 'win')
  st = pushReport(st, {
    at, kind: t.kind, i: t.i, f: floor, win: f.win, hurt, dead: {}, gain: g,
    fights: [{ a: snap(me, elder, elderLevel(s.elders[elder])), b: snap(foe, undefined, foeLevel), rounds: f.rounds }],
  })
  return { state: st, back, hurt, gain: g, report: st.nextId - 1 }
}

// ---------- Thời gian ----------

function accrue(s: State, t: number): State {
  const dt = t - s.time
  if (dt <= 0) return s // đồng hồ lùi: đứng yên chờ, không trừ
  const cap = storage(s)
  const res = { ...s.res }
  const carry = { ...s.carry }
  for (const r of RESOURCES) {
    const total = rate(s, r) * dt + carry[r]
    const gained = Math.floor(total / HOUR)
    if (res[r] + gained >= cap) {
      res[r] = Math.max(res[r], cap) // đầy kho thì ngừng sản xuất, nhưng không cắt phần đang vượt
      carry[r] = 0
    } else {
      res[r] += gained
      carry[r] = total % HOUR
    }
  }
  return { ...s, time: t, res, carry }
}

function arrive(s: State, id: number): State {
  const m = s.marches.find(x => x.id === id)!
  const others = s.marches.filter(x => x.id !== id)
  // Mục tiêu đã bị hạ trước khi tới: quay về tay không
  if ((s.cool[coolKey(m.target)] ?? 0) > m.arriveAt)
    return { ...s, marches: [...others, { ...m, back: m.army, hurt: {}, gain: { res: {}, items: {}, exp: 0 } }] }
  const r = battle({ ...s, marches: others }, m.target, m.elder, m.army, m.seed, m.arriveAt)
  const done = { ...m, back: r.back, hurt: r.hurt, gain: r.gain, report: r.report }
  return { ...r.state, marches: [...r.state.marches, done].sort((a, b) => a.id - b.id) }
}

function home(s: State, id: number): State {
  const m = s.marches.find(x => x.id === id)!
  const { state, dead } = admit({ ...s, marches: s.marches.filter(x => x.id !== id) }, m.hurt ?? {})
  let st = gain({ ...state, troops: plus(state.troops, m.back ?? m.army) }, m.elder, m.gain ?? { res: {}, items: {}, exp: 0 })
  // Báo cho chiến báo của chuyến này biết bao nhiêu người không qua khỏi
  if (count(dead)) st = { ...st, reports: st.reports.map(r => (r.id === m.report ? { ...r, dead } : r)) }
  return st
}

type Ev = [at: number, run: (s: State) => State]
function due(s: State, now: number): Ev[] {
  const ev: Ev[] = []
  for (const j of s.queue)
    if (j.finishAt <= now)
      ev.push([j.finishAt, st => ({ ...st, levels: { ...st.levels, [j.building]: j.level }, queue: st.queue.filter(q => q.building !== j.building) })])
  const t = s.train
  if (t && t.finishAt <= now)
    ev.push([t.finishAt, st => ({ ...st, train: null, troops: plus(st.troops, { [t.unit]: t.n }), stats: { ...st.stats, trained: st.stats.trained + t.n } })])
  const h = s.heal
  if (h && h.finishAt <= now)
    ev.push([h.finishAt, st => ({ ...st, heal: null, troops: plus(st.troops, h.troops), wounded: minus(st.wounded, h.troops), stats: { ...st.stats, healed: st.stats.healed + count(h.troops) } })])
  const r = s.study
  if (r && r.finishAt <= now) ev.push([r.finishAt, st => ({ ...st, study: null, tech: { ...st.tech, [r.tech]: r.level } })])
  const b = s.brew
  if (b && b.finishAt <= now)
    ev.push([b.finishAt, st => ({ ...st, brew: null, items: addItems(st.items, { [b.pill]: b.n }), stats: { ...st.stats, brewed: st.stats.brewed + b.n } })])
  for (const m of s.marches) {
    if (!m.back && m.arriveAt <= now) ev.push([m.arriveAt, st => arrive(st, m.id)])
    if (m.returnAt <= now) ev.push([m.returnAt, st => home(st, m.id)])
  }
  return ev.sort((a, b) => a[0] - b[0])
}

// Đưa state tới thời điểm now. Mọi việc hẹn giờ xong theo đúng thứ tự thời gian:
// sản lượng trước lúc xong tính theo chỉ số cũ, sau đó theo chỉ số mới.
export function advance(s: State, now: number): State {
  let st = s
  for (const [at, run] of due(s, now)) st = run(rollDay(accrue(st, at), at))
  return rollDay(accrue(st, now), now)
}

// ---------- Kiểm tra ----------

export function upgradeError(s: State, b: BuildingId): Err | null {
  const level = s.levels[b] + 1
  if (level > MAX_LEVEL) return 'max_level'
  if (b === 'chuDien' && TRIBS.some(t => t.hall === s.levels.chuDien)) return 'trib'
  if (b !== 'chuDien' && s.levels.chuDien < Math.max(level, BUILDINGS[b].unlock)) return 'need_main_hall'
  if (s.queue.some(j => j.building === b)) return 'busy'
  if (s.queue.length >= QUEUE_SIZE) return 'queue_full'
  return afford(s.res, cost(b, level)) ? null : 'not_enough'
}

export function techError(s: State, t: TechId): Err | null {
  const level = (s.tech[t] ?? 0) + 1
  if (level > TECHS[t].max) return 'max_level'
  if (s.levels.tangKinhCac < TECH_ROWS[TECHS[t].row]) return 'locked'
  if (s.study) return 'busy'
  return afford(s.res, techCost(t, level)) ? null : 'not_enough'
}

export function trainError(s: State, u: UnitId, n: number): Err | null {
  if (!UNITS.includes(u) || !Number.isInteger(n) || n < 1 || n > batch(s)) return 'bad'
  if (!s.levels.dienVoTruong || !tierOpen(s, unitOf(u).tier)) return 'locked'
  if (s.train) return 'busy'
  return afford(s.res, trainCost(u, n)) ? null : 'not_enough'
}

export function healError(s: State): Err | null {
  if (!s.levels.danPhong) return 'locked'
  if (s.heal) return 'busy'
  if (!count(s.wounded)) return 'empty'
  return afford(s.res, healCost(s, s.wounded)) ? null : 'not_enough'
}

export function brewError(s: State, p: PillId, n: number): Err | null {
  if (!(p in PILLS) || !Number.isInteger(n) || n < 1 || n > BREW_MAX) return 'bad'
  if (s.levels.danPhong < PILLS[p].unlock) return 'locked'
  if (s.brew) return 'busy'
  return afford(s.res, brewCost(s, p, n)) ? null : 'not_enough'
}

export function tribError(s: State): Err | null {
  const tr = TRIBS[s.trib]
  if (!tr || s.levels.chuDien !== tr.hall) return 'locked'
  if (s.tribCool > s.time) return 'cooldown'
  return afford(s.res, cost('chuDien', tr.hall + 1)) ? null : 'not_enough'
}

// Căn cơ của kiếp thứ n + 1 (n = số lần đã luân hồi): Chủ điện và mọi công trình đã mở ở tầng đó
export function rebirthLevels(n: number) {
  const hall = Math.min(REBIRTH_HEAD_MAX, 1 + REBIRTH_HEAD * n)
  return Object.fromEntries(IDS.map(id => [id, BUILDINGS[id].unlock <= hall ? hall : 0])) as Record<BuildingId, number>
}

export const jobOf = (s: State, k: JobKind) => (k === 'build' ? s.queue[0] ?? null : s[k])

// Ba đợt lôi kiếp nối nhau; đệ tử còn đứng được đi tiếp sang đợt sau.
function tribulation(s: State, elder: ElderId, army: Army, pill: boolean, seed: number) {
  const tr = TRIBS[s.trib]
  const weaken = (1 - Math.min(MAX_CUT, lead(s, elder, 'trib'))) * (pill ? 1 - DO_KIEP : 1)
  const lv = elderLevel(s.elders[elder])
  let me = sideOf(s, elder, army)
  let win = true
  const fights: Report['fights'] = []
  for (const w of tr.waves) {
    const foe = mob(w.str, tr.tier, [[w.type, 1]], 1, undefined, weaken)
    const f = fight(me, foe, seed)
    seed = nextSeed(seed)
    fights.push({ a: snap(me, elder, lv), b: snap(foe), rounds: f.rounds })
    const left = f.rounds.at(-1)?.n[0]
    if (left) me = { ...me, troops: me.troops.map((x, i) => ({ ...x, n: left[i] })) }
    if (!f.win) {
      win = false
      break
    }
  }
  return { win, fights, left: me.troops.map(x => x.n), seed }
}

// Tỉ lệ thắng ước lượng để hiện cho người chơi: đánh thử với 9 mầm cố định, khác mầm thật (không lộ đúng kết quả).
// Tính đủ hệ khắc, công pháp trưởng lão, lôi kiếp — lực chiến thô thì không (đội bị khắc hệ hiện "áp đảo" mà thua 1/4).
export function winChance(s: State, elder: ElderId, army: Army, t: Target | 'trib', pill = false) {
  if (!count(army) || s.elders[elder] === undefined) return 0
  if (t === 'trib' && !TRIBS[s.trib]) return 0
  let won = 0
  for (let k = 1; k <= 9; k++) {
    const seed = Math.imul(k, 0x9e3779b1) >>> 0
    if (t === 'trib' ? tribulation(s, elder, army, pill, seed).win : fight(sideOf(s, elder, army), enemyOf(s, t), seed).win) won++
  }
  return won / 9
}

// ---------- Thao tác ----------

export function apply(s: State, a: Action, now: number): Result {
  const state = advance(s, now)
  const t = state.time
  const ok = (st: State): Result => ({ ok: true, state: st })
  const no = (error: Err): Result => ({ ok: false, error })
  const pay = (c: Bag) => bag(r => state.res[r] - c[r])

  switch (a.type) {
    case 'upgrade': {
      const e = upgradeError(state, a.building)
      if (e) return no(e)
      const level = state.levels[a.building] + 1
      const job = { building: a.building, level, startAt: t, finishAt: t + buildTime(state, a.building, level) }
      return ok(bump({ ...state, res: pay(cost(a.building, level)), queue: [...state.queue, job] }, 'build'))
    }
    case 'claim': {
      const q = QUESTS[state.quest]
      if (!q || !questDone(state)) return no('not_done')
      return ok({ ...state, quest: state.quest + 1, res: addBag(state.res, q.reward), items: addItems(state.items, q.items ?? {}) })
    }
    case 'train': {
      const e = trainError(state, a.unit, a.n)
      if (e) return no(e)
      return ok(bump({ ...state, res: pay(trainCost(a.unit, a.n)), train: { unit: a.unit, n: a.n, startAt: t, finishAt: t + trainTime(state, a.unit, a.n) } }, 'train', a.n))
    }
    case 'heal': {
      const e = healError(state)
      if (e) return no(e)
      const hurt = { ...state.wounded }
      return ok({ ...state, res: pay(healCost(state, hurt)), heal: { troops: hurt, startAt: t, finishAt: t + healTime(state, hurt) } })
    }
    case 'study': {
      const e = techError(state, a.tech)
      if (e) return no(e)
      const level = (state.tech[a.tech] ?? 0) + 1
      return ok({ ...state, res: pay(techCost(a.tech, level)), study: { tech: a.tech, level, startAt: t, finishAt: t + techTime(a.tech, level) } })
    }
    case 'brew': {
      const e = brewError(state, a.pill, a.n)
      if (e) return no(e)
      return ok(bump({ ...state, res: pay(brewCost(state, a.pill, a.n)), brew: { pill: a.pill, n: a.n, startAt: t, finishAt: t + brewTime(state, a.pill, a.n) } }, 'brew'))
    }
    case 'march': {
      if (a.target?.kind !== 'beast' && a.target?.kind !== 'sect') return no('bad')
      const e = targetError(state, a.target) ?? armyError(state, a.elder, a.army)
      if (e) return no(e)
      if (state.marches.length >= marchSlots(state)) return no('slots')
      const army = Object.fromEntries(UNITS.filter(u => a.army[u]).map(u => [u, a.army[u]])) as Army
      const dt = marchTime(state, a.target)
      const m: March = { id: state.nextId, elder: a.elder, army, target: { ...a.target }, seed: state.seed, startAt: t, arriveAt: t + dt, returnAt: t + 2 * dt }
      return ok({ ...state, troops: minus(state.troops, army), marches: [...state.marches, m], nextId: state.nextId + 1, seed: nextSeed(state.seed) })
    }
    case 'realm': {
      const target: Target = { kind: 'realm', i: a.i }
      const e = targetError(state, target) ?? armyError(state, a.elder, a.army)
      if (e) return no(e)
      const r = battle({ ...state, seed: nextSeed(state.seed) }, target, a.elder, a.army, state.seed, t)
      const { state: st, dead } = admit({ ...r.state, troops: minus(r.state.troops, r.hurt) }, r.hurt)
      const done = gain(st, a.elder, r.gain)
      return ok({ ...done, reports: done.reports.map(x => (x.id === r.report ? { ...x, dead } : x)) })
    }
    case 'trib': {
      const e = tribError(state) ?? armyError(state, a.elder, a.army)
      if (e) return no(e)
      if (a.pill && !state.items.doKiep) return no('no_item')
      const k = state.trib
      const tr = TRIBS[k]
      const { win, fights, left, seed } = tribulation(state, a.elder, a.army, a.pill, state.seed)
      const ids = UNITS.filter(u => (a.army[u] ?? 0) > 0)
      const hurt = Object.fromEntries(ids.map((u, i) => [u, a.army[u]! - left[i]])) as Army
      let st: State = { ...state, seed, troops: minus(state.troops, hurt), items: a.pill ? { ...state.items, doKiep: state.items.doKiep! - 1 } : state.items }
      const adm = admit(st, hurt)
      st = adm.state
      const exp = Math.round(TRIB_EXP[k] * (1 + lead(state, a.elder, 'exp')) * (win ? 1 : LOSS_EXP))
      st = giveExp(st, a.elder, exp)
      st = win
        ? bump({ ...st, trib: k + 1, res: bag(r => st.res[r] - cost('chuDien', tr.hall + 1)[r]), levels: { ...st.levels, chuDien: tr.hall + 1 } }, 'win')
        : { ...st, tribCool: t + TRIB_COOLDOWN }
      return ok(pushReport(st, { at: t, kind: 'trib', i: k, win, fights, hurt, dead: adm.dead, gain: { res: {}, items: {}, exp } }))
    }
    case 'speed': {
      if (a.job === 'brew') return no('bad') // đan không rút ngắn việc luyện đan: có giảm thời gian từ công pháp là thành vòng lặp đẻ đan
      if (!Number.isInteger(a.n) || a.n < 1 || a.n > (state.items.tuKhi ?? 0)) return no('no_item')
      const job = jobOf(state, a.job)
      if (!job) return no('empty')
      const sped = { ...job, finishAt: Math.max(t, job.finishAt - SPEEDUP * a.n) }
      const next: State =
        a.job === 'build'
          ? { ...state, queue: state.queue.map(j => (j === job ? (sped as Job) : j)) }
          : { ...state, [a.job]: sped }
      return ok(advance({ ...next, items: { ...state.items, tuKhi: state.items.tuKhi! - a.n } }, t))
    }
    case 'feed': {
      if (state.elders[a.elder] === undefined) return no('locked')
      if (!Number.isInteger(a.n) || a.n < 1 || a.n > (state.items.boiNguyen ?? 0)) return no('no_item')
      return ok(giveExp({ ...state, items: { ...state.items, boiNguyen: state.items.boiNguyen! - a.n } }, a.elder, BOI_NGUYEN_EXP * a.n))
    }
    case 'seen':
      return ok({ ...state, seen: state.nextId - 1 })
    case 'rebirth': {
      if (state.levels.chuDien < MAX_LEVEL) return no('locked')
      if (state.marches.length) return no('busy')
      const fresh = newGame(t, state.name)
      const levels = rebirthLevels(state.rebirths + 1)
      return ok({
        ...fresh, levels, tech: state.tech, study: state.study, items: state.items, brew: state.brew, elders: state.elders,
        rebirths: state.rebirths + 1, stats: state.stats, seed: state.seed, nextId: state.nextId, seen: state.nextId - 1,
        daily: state.daily, // cùng ngày: không nhận lại thưởng ngày
      })
    }
    case 'daily': {
      if (state.levels.chuDien < DAILY_HALL || !DAILY[a.i]) return no('locked')
      if (state.daily.got[a.i]) return no('max_level')
      if (!dailyDone(state, a.i)) return no('not_done')
      const n = dailyReward(state)
      return ok({ ...state, res: bag(r => state.res[r] + n), daily: { ...state.daily, got: state.daily.got.map((x, k) => x || k === a.i) } })
    }
    case 'dailyBonus': {
      if (state.levels.chuDien < DAILY_HALL) return no('locked')
      if (state.daily.bonus) return no('max_level')
      if (!state.daily.got.every(Boolean)) return no('not_done')
      return ok({ ...state, items: addItems(state.items, DAILY_BONUS), daily: { ...state.daily, bonus: true } })
    }
  }
}

// ---------- Nhiệm vụ ----------

export const questOf = (s: State): Quest | undefined => QUESTS[s.quest]
export function questProgress(s: State, q: Quest): [number, number] {
  switch (q.k) {
    case 'build': return [s.levels[q.id as BuildingId], q.n]
    case 'train': return [totalTroops(s), q.n]
    case 'hunt': return [s.beast, q.n]
    case 'sect': return [s.sects[Number(q.id)] ? 1 : 0, 1]
    case 'realm': return [s.realms[Number(q.id)], q.n]
    case 'tech': return [techSum(s), q.n]
    case 'brew': return [s.stats.brewed + (s.brew?.n ?? 0), q.n] // tính cả mẻ đang luyện: không bắt người mới chờ 20 phút giữa hướng dẫn
  }
}
export const questDone = (s: State) => {
  const q = QUESTS[s.quest]
  if (!q) return false
  const [cur, need] = questProgress(s, q)
  return cur >= need
}

// ---------- Save cũ ----------

// Đọc save từ mọi phiên bản trước. Không nhận ra → null (người gọi cất bản sao rồi cho chơi mới).
const V2_QUESTS: [BuildingId, number][] = [
  ['tuLinhTran', 1], ['linhDien', 1], ['khoangMach', 1], ['chuDien', 2], ['tangBaoCac', 1], ['dienVoTruong', 1], ['tuLinhTran', 2],
  ['linhDien', 2], ['khoangMach', 2], ['chuDien', 3], ['tangBaoCac', 2], ['chuDien', 4], ['tangKinhCac', 1], ['danPhong', 1], ['chuDien', 5],
]
export function migrate(raw: unknown): State | null {
  try {
    const s = upgrade(raw)
    return s && valid(s) ? s : null
  } catch {
    return null // khuôn lạ tới mức nâng bản cũng vỡ
  }
}

// Save từ ngoài vào (nhập tay, file, bản sửa tay) có thể thiếu hay sai trường. Kiểm đủ khuôn trước khi chơi:
// thiếu là từ chối (người chơi được báo "save không hợp lệ"), không để game vỡ lúc vẽ rồi kẹt vòng lặp lỗi.
const num = (x: unknown) => typeof x === 'number' && Number.isFinite(x)
const obj = (x: unknown): x is Record<string, any> => !!x && typeof x === 'object' && !Array.isArray(x)
const isBag = (x: unknown) => obj(x) && RESOURCES.every(r => num(x[r]))
const isTroops = (x: unknown) => obj(x) && UNITS.every(u => num(x[u]) && x[u] >= 0)
const isTimed = (j: unknown) => j === null || (obj(j) && num(j.startAt) && num(j.finishAt))
function valid(s: any): s is State {
  return (
    s.v === 3 && typeof s.name === 'string' && num(s.quest) && num(s.time) && isBag(s.res) && isBag(s.carry) &&
    obj(s.levels) && IDS.every(id => num(s.levels[id]) && s.levels[id] >= 0 && s.levels[id] <= MAX_LEVEL) &&
    Array.isArray(s.queue) && s.queue.every((j: any) => isTimed(j) && j && IDS.includes(j.building) && num(j.level)) &&
    isTroops(s.troops) && isTroops(s.wounded) &&
    [s.train, s.heal, s.study, s.brew].every(isTimed) &&
    obj(s.tech) && obj(s.items) && obj(s.elders) && Object.keys(s.elders).every(e => e in ELDERS && num(s.elders[e])) &&
    Array.isArray(s.marches) &&
    s.marches.every((m: any) => obj(m) && m.elder in ELDERS && obj(m.army) && obj(m.target) && ['beast', 'sect'].includes(m.target.kind) &&
      num(m.target.i) && num(m.seed) && num(m.startAt) && num(m.arriveAt) && num(m.returnAt)) &&
    Array.isArray(s.reports) && s.reports.every((r: any) => obj(r) && num(r.id) && Array.isArray(r.fights) && obj(r.gain) && obj(r.hurt) && obj(r.dead)) &&
    num(s.seen) && num(s.beast) && obj(s.cool) &&
    Array.isArray(s.sects) && s.sects.length === SECTS.length && Array.isArray(s.realms) && s.realms.length === REALMS.length &&
    num(s.trib) && num(s.tribCool) && num(s.rebirths) && num(s.seed) && num(s.nextId) &&
    obj(s.stats) && ['trained', 'healed', 'brewed', 'won', 'lost'].every(k => num(s.stats[k])) &&
    obj(s.daily) && num(s.daily.day) && obj(s.daily.n) && Array.isArray(s.daily.got) && s.daily.got.length === DAILY.length
  )
}

function upgrade(raw: unknown) {
  let s = raw as any
  if (!s || typeof s !== 'object') return null
  if (s.v === 1) s = { ...s, v: 2, name: DEFAULT_NAME, quest: 0 }
  if (s.v === 2) {
    const fresh = newGame(s.time, s.name)
    const at = (i: number) => QUESTS.findIndex(q => q.k === 'build' && q.id === V2_QUESTS[i][0] && q.n === V2_QUESTS[i][1])
    const quest = s.quest < V2_QUESTS.length ? at(s.quest) : at(V2_QUESTS.length - 1) + 1
    const levels = { ...fresh.levels, ...s.levels }
    s = {
      ...fresh, quest, time: s.time, res: s.res, carry: s.carry, levels,
      queue: s.queue.map((j: Job) => ({ ...j, startAt: j.finishAt - buildTime(fresh, j.building, j.level) })),
      trib: TRIBS.filter(t => t.hall < levels.chuDien).length, // bản cũ chưa có độ kiếp: coi như đã vượt
    }
  }
  if (s.v !== 3 || typeof s.time !== 'number') return null
  if (!s.daily) s = { ...s, daily: freshDaily(s.time) } // save bản 3 làm trước khi có nhiệm vụ ngày
  return s
}
