import { fight, type Round, type Side, type Troop } from './combat.ts'
import {
  BASE_CAP, BASE_RATE, BATCH_BASE, BATCH_STEP, BEASTS, BEAST_COOLDOWN, BEAST_EXP, BEAST_LOOT, BEAST_STR, BEATS, BOI_NGUYEN_EXP,
  BREW_MAX, BUILDINGS, CAP_GROWTH, EVENTS, EVENT_GOALS, EVENT_PTS, EVENT_REWARDS, NEWBIE_SHIELD, PVP_GATE, PVP_START, COST_GROWTH, COST_GROWTH2, CURE, DAILY, DAILY_BONUS, DAILY_HALL, DAILY_RES, DAY_OFFSET, WEEKEND, TRADE_KEEP, TRADE_KEEP_MAX, TRADE_STEP, TOWER, TOWER_ELDERS, TOWER_GROW, TOWER_RES, TOWER_RES_GROW, TOWER_STR, WEEKLY, WEEKLY_BONUS, WEEKLY_RES, DO_KIEP, ELDERS, ELDER_MAX, ELDER_STEP, EXP_BASE, FIRST_ELDER, FOCUS, FOCUS_TIME,
  GEAR, GEAR_COST_GROWTH, GEAR_MAX, GEAR_TIME_GROWTH, HEAL_COST,
  HEAL_TIME, HOME, HOSPITAL_BASE, HOSPITAL_STEP, KNEE, LOSS_EXP, MAIN_SHARE, MAP_HALL, MARCH_MIN, MARCH_SLOTS, MARCH_SPEED,
  MAX_CUT, MAX_LEVEL, PHA_CANH, PILLS, QUESTS, QUEUE_SIZE, RATE_HIGH, REALMS, REBIRTH_BUILD, REBIRTH_HALL, REBIRTH_HEAD, REBIRTH_HEAD_MAX, REBIRTH_MAX, REBIRTH_PROD, RESOURCES, SECTS, SECT_COOLDOWN,
  SECT_SHARE, SPEEDUP, SPEEDUP_BIG, START, TALENTS, TALENT_EVERY, TALENT_MAX, TECHS, TECH_COST_GROWTH, TECH_ROWS, TECH_TIME_GROWTH, TIER, TIME_GROWTH, TIME_GROWTH2, TRIBS, TRIB_CLOUD, TRIB_COOLDOWN,
  TRIB_EXP, TYPES, UNITS, UNIT_BASE,
  type Bag, type Bonus, type BuildingId, type DailyId, type EventId, type WeeklyId, type ElderId, type GearId, type PillId, type Quest, type Res, type Reward, type Skill,
  type TechId, type Tier, type UnitId, type UnitType,
} from './data.ts'

export * from './data.ts'
export { advantage, elAdv, fight, might, rng, type Fight, type Round, type Side, type Troop } from './combat.ts'

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
export type ForgeJob = { gear: GearId; level: number; startAt: number; finishAt: number }
export type Gear = { lv: number; on?: ElderId } // on: trưởng lão đang đeo
export type Talent = [atk: number, hp: number, skill: number]
// until: lúc hết (due() gỡ đúng giờ, nên sản lượng trước/sau tính đúng); 0 = giữ tới khi server gỡ. src: nguồn, mỗi nguồn một buff
export type Buff = { key: Bonus; v: number; until: number; src: string }
// pvp: i = mã người chơi bị cướp · spot: i = chỉ số điểm trên bản đồ giới (atlas.points) · trib: kiếp vân, i = lần độ kiếp
export type Target = { kind: 'beast' | 'sect' | 'realm' | 'tower' | 'pvp' | 'spot' | 'trib'; i: number }
export type Gain = { res: Partial<Bag>; items: Items; elder?: ElderId; exp: number }
export type March = {
  id: number
  elder: ElderId
  army: Army
  target: Target
  seed: number
  startAt: number
  arriveAt: number
  returnAt: number // 0: chưa hẹn (đi cướp: server giải trận lúc tới nơi rồi mới biết giờ về)
  foe?: string // đi cướp: tên tông môn bên kia (để hiện)
  path?: { x: number; y: number }[] // đi trên bản đồ giới: các điểm dừng (đi, …cổng, tới) — theo ô
  task?: 'take' | 'gather' | 'hit' | 'aid' // điểm trên bản đồ giới: chiếm (đóng quân) · khai mỏ · đánh yêu vương; aid: viện binh nhà đồng minh
  rally?: number // thuộc kết trận này (mọi đội cùng tới lúc hẹn, đánh như một bên)
  spot?: string // loại điểm (để hiện tên): vein, mine, boss, gate, heaven
  stay?: boolean // đang đóng quân ở điểm (chỉ về khi bị đánh bật hoặc gọi về)
  mine?: { end: number; amount: number; res: Res } // đang khai mỏ tới end, mang về amount
  back?: Army // sau trận: đệ tử còn đứng được, thương binh và chiến lợi phẩm mang về
  hurt?: Army
  gain?: Gain
  report?: number
  pill?: PillId // kiếp vân: đan độ kiếp đã dùng lúc tụ
  foil?: number // kiếp vân: số lần bị cướp trúng trong lúc tụ (phá kiếp)
}
export type Snap = { elder?: ElderId; level: number; troops: { type: UnitType; tier: Tier; n: number }[] }
export type Report = {
  id: number
  at: number
  kind: 'beast' | 'sect' | 'realm' | 'tower' | 'trib' | 'pvp' | 'spot'
  i: number
  spot?: string // loại điểm bản đồ giới
  f?: number // bí cảnh: tầng
  foe?: string // PvP: tên tông môn bên kia
  def?: boolean // PvP: mình là bên thủ
  lost?: Partial<Bag> // PvP bên thủ: tài nguyên bị cướp
  win: boolean
  fights: { a: Snap; b: Snap; rounds: Round[] }[]
  hurt: Army // thương vong
  dead: Army // phần Đan phòng không còn chỗ nằm
  gain: Gain
}
export type Stats = { trained: number; healed: number; brewed: number; won: number; lost: number }
export type Daily = { day: number; n: Record<DailyId, number>; got: boolean[]; bonus: boolean }
export type Weekly = { week: number; n: Record<WeeklyId, number>; got: boolean[]; bonus: boolean }
export type Ev = { week: number; pts: number; got: boolean[] } // sự kiện tuần: điểm, mốc đã nhận
export type Foe = { pid: number; name: string; at: number } // ai đã đánh mình (báo thù)
// Thư: chữ dựng ở client theo khoá k (@rok/i18n), quà nhận đúng một lần
export type Mail = { id: number; at: number; k: string; a?: (string | number)[]; gift?: Reward; got?: boolean }

export type State = {
  v: 4                               // phiên bản save
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
  forge: ForgeJob | null             // Luyện Khí Phòng: một món mỗi lúc
  tech: Partial<Record<TechId, number>>
  items: Items
  elders: Partial<Record<ElderId, number>> // trưởng lão đã thu nhận → kinh nghiệm
  talents: Partial<Record<ElderId, Talent>> // điểm thiên phú đã cộng
  gear: Partial<Record<GearId, Gear>>
  buffs: Buff[]
  marches: March[]
  reports: Report[]
  seen: number                       // id chiến báo mới nhất đã đọc
  beast: number                      // cấp yêu thú cao nhất đã hạ
  cool: Record<string, number>       // mục tiêu đã hạ → lúc có lại
  sects: boolean[]                   // đã hạ lần đầu
  realms: number[]                   // số tầng bí cảnh đã qua
  tower: number                      // số tầng Thông Thiên Tháp đã qua (kỷ lục, giữ qua luân hồi)
  trib: number                       // số lần độ kiếp đã vượt
  tribCool: number
  rebirths: number
  seed: number                       // mầm ngẫu nhiên cho trận kế tiếp
  nextId: number
  stats: Stats
  daily: Daily                       // nhiệm vụ ngày: tiến độ hôm nay, việc đã nhận thưởng
  weekly: Weekly                     // nhiệm vụ tuần: tiến độ tuần này (làm mới 0h thứ Hai)
  ev: Ev                             // sự kiện tuần
  shield: number                     // khiên PvP tới lúc này
  guard: ElderId | null              // trưởng lão giữ nhà (phải đang ở tông môn mới tính)
  pvp: { pts: number; win: number; loss: number }
  foes: Foe[]
  mail: Mail[]
  seat: { x: number; y: number } | null // chỗ trên bản đồ giới (server xếp lúc vào giới lần đầu)
  blocks: number[]                   // người chơi đã chặn (ẩn chat của họ)
  ascended: number[]                 // các mùa đã phi thăng (danh hiệu)
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
  | { type: 'tower'; elder: ElderId; army: Army }
  | { type: 'trade'; from: Res; to: Res; n: number }
  | { type: 'trib'; elder: ElderId; army: Army; pill: boolean }
  | { type: 'speed'; job: JobKind; n: number; pill?: 'daiTuKhi' } // mặc định Tụ Khí Đan
  | { type: 'feed'; elder: ElderId; n: number }
  | { type: 'seen' }
  | { type: 'rebirth' }
  | { type: 'daily'; i: number }
  | { type: 'dailyBonus' }
  | { type: 'weekly'; i: number }
  | { type: 'weeklyBonus' }
  | { type: 'forge'; gear: GearId }
  | { type: 'equip'; gear: GearId; elder: ElderId | null } // null: tháo ra
  | { type: 'talent'; elder: ElderId; branch: 0 | 1 | 2 }
  | { type: 'wash'; elder: ElderId } // Tẩy Tủy Đan
  | { type: 'cure' } // Hồi Xuân Đan
  | { type: 'focus' } // Ngưng Thần Đan
  | { type: 'guard'; elder: ElderId | null } // trưởng lão giữ nhà
  | { type: 'mail'; id: number } // nhận quà trong thư
  | { type: 'event'; i: number } // nhận quà mốc sự kiện tuần
  | { type: 'block'; pid: number; on: boolean } // chặn / bỏ chặn một người (chat)
export type JobKind = 'build' | 'train' | 'heal' | 'study' | 'brew' | 'forge'
export type Err =
  | 'max_level' | 'need_main_hall' | 'busy' | 'queue_full' | 'not_enough' | 'not_done' | 'locked' | 'cooldown'
  | 'empty' | 'no_item' | 'slots' | 'trib' | 'bad' | 'shield' | 'weak' | 'gone' | 'far' | 'friend' | 'taken' | 'full' | 'limit'
export type Result = { ok: true; state: State } | { ok: false; error: Err }

const HOUR = 3_600_000
const BLOCKS_MAX = 100
export const IDS = Object.keys(BUILDINGS) as BuildingId[]
export const TECH_IDS = Object.keys(TECHS) as TechId[]
export const ELDER_IDS = Object.keys(ELDERS) as ElderId[]
export const PILL_IDS = Object.keys(PILLS) as PillId[]
export const GEAR_IDS = Object.keys(GEAR) as GearId[]
const bag = (f: (r: Res) => number) => Object.fromEntries(RESOURCES.map(r => [r, f(r)])) as Bag
const troops = (f: (u: UnitId) => number) => Object.fromEntries(UNITS.map(u => [u, f(u)])) as Troops
export const count = (a: Army) => UNITS.reduce((sum, u) => sum + (a[u] ?? 0), 0)
export const plus = (a: Troops, b: Army) => troops(u => a[u] + (b[u] ?? 0))
export const minus = (a: Troops, b: Army) => troops(u => a[u] - (b[u] ?? 0))
const addBag = (a: Bag, b: Partial<Bag>) => bag(r => a[r] + (b[r] ?? 0))
const addItems = (a: Items, b: Items) => Object.fromEntries(PILL_IDS.map(p => [p, (a[p] ?? 0) + (b[p] ?? 0)])) as Items
export const afford = (have: Bag, c: Bag) => RESOURCES.every(r => have[r] >= c[r])
// Mầm 0 = "ẩn": máy này không biết mầm thật (client nhận state từ server với mọi seed = 0), nên không tự giải trận.
// 0 sinh ra 0; mầm khác 0 không bao giờ sinh ra 0.
export const nextSeed = (seed: number) => (seed ? (Math.imul(seed, 1664525) + 1013904223) >>> 0 || 1 : 0)

// Nhân lặp thay cho Math.pow: phép nhân IEEE cho cùng kết quả trên mọi engine, pow thì không chắc.
function grow(base: number, factor: number, times: number) {
  let v = base
  for (let i = 0; i < times; i++) v *= factor
  return Math.round(v)
}
// Hai đoạn: tới tầng KNEE nhân f (số P1 giữ nguyên từng đơn vị), trên đó nhân f2
function climb(base: number, f: number, f2: number, times: number) {
  let v = base
  for (let i = 0; i < times; i++) v *= i < KNEE - 1 ? f : f2
  return Math.round(v)
}
// Tầng trên KNEE sinh RATE_HIGH lần tầng thấp
const rateLevels = (l: number) => (l <= KNEE ? l : KNEE + (l - KNEE) * RATE_HIGH)

export const DEFAULT_NAME = 'Thanh Vân Tông'

export function newGame(now: number, name = DEFAULT_NAME): State {
  const levels = Object.fromEntries(IDS.map(id => [id, 0])) as Record<BuildingId, number>
  levels.chuDien = 1
  const clean = name.trim().replace(/\s+/g, ' ').slice(0, 20) || DEFAULT_NAME
  return {
    v: 4, name: clean, quest: 0, time: now, res: { ...START }, carry: bag(() => 0), levels, queue: [],
    troops: troops(() => 0), wounded: troops(() => 0), train: null, heal: null, study: null, brew: null, forge: null,
    tech: {}, items: {}, elders: { [FIRST_ELDER]: 0 }, talents: {}, gear: {}, buffs: [], marches: [], reports: [], seen: 0,
    beast: 0, cool: {}, sects: SECTS.map(() => false), realms: REALMS.map(() => 0), tower: 0, trib: 0, tribCool: 0, rebirths: 0,
    seed: now >>> 0 || 1, nextId: 1, stats: { trained: 0, healed: 0, brewed: 0, won: 0, lost: 0 }, daily: freshDaily(now), weekly: freshWeekly(now),
    ev: freshEv(now), shield: now + NEWBIE_SHIELD, guard: null, pvp: { pts: PVP_START, win: 0, loss: 0 }, foes: [], mail: [], seat: null, blocks: [], ascended: [],
  }
}

// ---------- Nhiệm vụ ngày ----------

const DAY = 86_400_000
export const dayOf = (t: number) => Math.floor((t + DAY_OFFSET) / DAY)
export const nextDay = (t: number) => (dayOf(t) + 1) * DAY - DAY_OFFSET // lúc làm mới kế tiếp
const freshDaily = (t: number): Daily => ({ day: dayOf(t), n: { build: 0, train: 0, win: 0, brew: 0 }, got: DAILY.map(() => false), bonus: false })
// Tuần bắt đầu 0h thứ Hai giờ VN (ngày 4 kể từ 1/1/1970 — thứ Năm — là thứ Hai 5/1/1970)
export const weekOf = (t: number) => Math.floor((dayOf(t) - 4) / 7)
export const nextWeek = (t: number) => ((weekOf(t) + 1) * 7 + 4) * DAY - DAY_OFFSET
const freshWeekly = (t: number): Weekly => ({ week: weekOf(t), n: { build: 0, train: 0, win: 0, brew: 0, days: 0 }, got: WEEKLY.map(() => false), bonus: false })
const freshEv = (t: number): Ev => ({ week: weekOf(t), pts: 0, got: EVENT_GOALS.map(() => false) })
export const eventOf = (week: number): EventId => EVENTS[((week % EVENTS.length) + EVENTS.length) % EVENTS.length]
const rollDay = (s: State, t: number): State => {
  if (dayOf(t) > s.daily.day) s = { ...s, daily: freshDaily(t) }
  if (weekOf(t) > s.ev.week) s = { ...s, ev: freshEv(t) }
  return weekOf(t) > s.weekly.week ? { ...s, weekly: freshWeekly(t) } : s
}
// Điểm sự kiện tuần khi làm đúng việc của chủ đề tuần này (tuyển: mỗi 5 đệ tử một lần)
export const evBump = (s: State, id: EventId, k = 1): State =>
  eventOf(s.ev.week) !== id ? s : { ...s, ev: { ...s.ev, pts: s.ev.pts + EVENT_PTS[id] * (id === 'train' ? Math.floor(k / 5) : k) } }
export const bump = (s: State, id: DailyId, k = 1): State =>
  evBump({
    ...s,
    daily: { ...s.daily, n: { ...s.daily.n, [id]: s.daily.n[id] + k } },
    weekly: { ...s.weekly, n: { ...s.weekly.n, [id]: s.weekly.n[id] + k } },
  }, id, k)
export const dailyDone = (s: State, i: number) => s.daily.n[DAILY[i].id] >= DAILY[i].n
export const dailyReward = (s: State) => DAILY_RES * s.levels.chuDien
// Số việc làm xong mà chưa nhận thưởng (kể cả rương) — để hiện huy hiệu
// Sự kiện cuối tuần: thứ Bảy, Chủ nhật giờ VN (ngày 0 kể từ 1/1/1970 là thứ Năm)
export const isWeekend = (t: number) => [2, 3].includes(((dayOf(t) % 7) + 7) % 7)
export const eventMul = (t: number) => (isWeekend(t) ? WEEKEND : 1)
// Thương hội: phần giữ lại khi đổi tài nguyên (0..1)
export const tradeKeep = (s: State) => Math.min(TRADE_KEEP_MAX, TRADE_KEEP + TRADE_STEP * (s.levels.tangBaoCac - 1))
export const weeklyDone = (s: State, i: number) => s.weekly.n[WEEKLY[i].id] >= WEEKLY[i].n
export const weeklyReward = (s: State) => WEEKLY_RES * s.levels.chuDien
// số phần thưởng đang chờ nhận (ngày + tuần) — huy hiệu trên nút nhiệm vụ
export const dailyReady = (s: State) =>
  s.levels.chuDien < DAILY_HALL
    ? 0
    : DAILY.filter((_, i) => dailyDone(s, i) && !s.daily.got[i]).length +
      (s.daily.got.every(Boolean) && !s.daily.bonus ? 1 : 0) +
      WEEKLY.filter((_, i) => weeklyDone(s, i) && !s.weekly.got[i]).length +
      (s.weekly.got.every(Boolean) && !s.weekly.bonus ? 1 : 0)

// ---------- Chỉ số ----------

// Công pháp + luân hồi + buff. Bonus giảm (thời gian, chi phí) dùng qua cut().
export function bonus(s: State, key: Bonus) {
  let v = 0
  for (const id of TECH_IDS) if (TECHS[id].key === key) v += TECHS[id].v * (s.tech[id] ?? 0)
  if (key === 'prod') v += REBIRTH_PROD * Math.min(REBIRTH_MAX, s.rebirths)
  if (key === 'build') v += REBIRTH_BUILD * Math.min(REBIRTH_MAX, s.rebirths)
  for (const b of s.buffs) if (b.key === key) v += b.v
  return v
}
const cut = (s: State, key: Bonus) => 1 - Math.min(MAX_CUT, bonus(s, key))
export const cutOf = cut

export const elderLevel = (exp = 0) => {
  let n = 1
  while (n < ELDER_MAX && EXP_BASE * (n + 1) * n <= exp) n++
  return n
}
export const expAt = (level: number) => EXP_BASE * level * (level - 1)
// bonus của cả tông môn + của riêng trưởng lão dẫn đội: bị động, pháp bảo đang đeo, thiên phú
export function lead(s: State, elder: ElderId, key: Bonus) {
  const lv = elderLevel(s.elders[elder])
  let v = bonus(s, key) + ELDERS[elder].passives.reduce((sum, p) => sum + (lv >= p.at && p.key === key ? p.v : 0), 0)
  for (const g of GEAR_IDS) if (s.gear[g]?.on === elder && GEAR[g].key === key) v += GEAR[g].v * s.gear[g]!.lv
  const t = s.talents[elder]
  if (t) TALENTS.forEach((d, i) => d.key === key && (v += d.v * t[i]))
  return v
}
export const talentPoints = (s: State, elder: ElderId) => Math.floor(elderLevel(s.elders[elder]) / TALENT_EVERY)
export const talentUsed = (s: State, elder: ElderId) => (s.talents[elder] ?? [0, 0, 0]).reduce((a, b) => a + b, 0)
export const gearOf = (s: State, elder: ElderId) => GEAR_IDS.find(g => s.gear[g]?.on === elder)

export const cost = (b: BuildingId, level: number) => bag(r => climb(BUILDINGS[b].cost[r], COST_GROWTH, COST_GROWTH2, level - 1))
export const buildTime = (s: State, b: BuildingId, level: number) =>
  Math.round(climb(BUILDINGS[b].time, TIME_GROWTH, TIME_GROWTH2, level - 1) * cut(s, 'build')) * 1000
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
  IDS.reduce((sum, id) => (BUILDINGS[id].makes === r ? sum + (BUILDINGS[id].rate ?? 0) * rateLevels(s.levels[id]) : sum), BASE_RATE)
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
// đan làm nguyên liệu cho n viên
export const brewNeed = (p: PillId, n: number) => Object.fromEntries(Object.entries(PILLS[p].need ?? {}).map(([k, v]) => [k, v! * n])) as Items

// Luyện Khí Phòng
export const gearCap = (s: State) => Math.min(GEAR_MAX, Math.ceil(s.levels.luyenKhiPhong / 2))
export const gearCost = (g: GearId, level: number) => bag(r => grow(GEAR[g].cost[r], GEAR_COST_GROWTH, level - 1))
export const gearTime = (s: State, g: GearId, level: number) => Math.round(grow(GEAR[g].time, GEAR_TIME_GROWTH, level - 1) * cut(s, 'forge')) * 1000
export const gearSum = (s: State) => GEAR_IDS.reduce((sum, g) => sum + (s.gear[g]?.lv ?? 0), 0)

export const away = (s: State) => s.marches.reduce((a, m) => plus(a, m.army), troops(() => 0))
export const totalTroops = (s: State) => count(s.troops) + count(s.wounded) + count(away(s))
export function power(s: State) {
  const out = away(s)
  return (
    IDS.reduce((sum, id) => sum + (BUILDINGS[id].power * s.levels[id] * (s.levels[id] + 1)) / 2, 0) +
    UNITS.reduce((sum, u) => sum + TIER[unitOf(u).tier].power * (s.troops[u] + out[u]), 0) +
    techSum(s) * 30 +
    gearSum(s) * 25 +
    ELDER_IDS.reduce((sum, e) => sum + (s.elders[e] === undefined ? 0 : elderLevel(s.elders[e]) * 50), 0)
  )
}

// ---------- Bản đồ ----------

export const realmOf = (level: number) => Math.min(5, Math.ceil(level / 5)) // 1 Luyện Khí · 2 Trúc Cơ · 3 Kim Đan · 4 Nguyên Anh · 5 Hóa Thần
export const marchSlots = (s: State) => MARCH_SLOTS[realmOf(s.levels.chuDien) - 1]
export const tierFor = (level: number): Tier => (level <= 5 ? 1 : level <= 10 ? 2 : 3)
export const beastStr = (level: number) => grow(BEAST_STR[0], BEAST_STR[1], level - 1)
export const beastLoot = (level: number) => grow(BEAST_LOOT[0], BEAST_LOOT[1], level - 1)
export const beastExp = (level: number) => grow(BEAST_EXP[0], BEAST_EXP[1], level - 1)
export const place = (t: Target) =>
  t.kind === 'beast' ? BEASTS[t.i] : t.kind === 'sect' ? SECTS[t.i] : t.kind === 'tower' ? TOWER : t.kind === 'pvp' || t.kind === 'spot' ? PVP_GATE : REALMS[t.i]
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
  if (t.kind === 'tower' && hall < TOWER.hall) return 'locked'
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

// Thông Thiên Tháp, tầng f (0 = tầng 1): sức địch, hệ chính (đổi theo vòng), thưởng lần đầu
export const towerStr = (f: number) => grow(TOWER_STR, TOWER_GROW, f)
export const towerType = (f: number): UnitType => TYPES[f % TYPES.length]
export function towerReward(f: number): Reward {
  const n = f + 1
  return {
    res: bag(() => grow(TOWER_RES, TOWER_RES_GROW, f)),
    items: n % 10 === 0 ? { doKiep: 1, boiNguyen: 1 } : n % 5 === 0 ? { tuKhi: 3 } : undefined,
    elder: TOWER_ELDERS[n],
    exp: 300 + 40 * f,
  }
}

export function enemyOf(s: State, t: Target): Side {
  if (t.kind === 'tower') return mob(towerStr(s.tower), 3, pair(towerType(s.tower), MAIN_SHARE), 1 + s.tower)
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
  const side = mob(d.floors[f].str, d.tier, pair(d.type, MAIN_SHARE))
  return d.el ? { ...side, el: d.el } : side
}

// elder null: đội không người dẫn (giữ nhà khi không ai trấn thủ) — chỉ có bonus của tông môn
export function sideOf(s: State, elder: ElderId | null, army: Army): Side {
  const m = elder ? 1 + ELDER_STEP * (elderLevel(s.elders[elder]) - 1) : 1
  const b = (k: Bonus) => (elder ? lead(s, elder, k) : bonus(s, k))
  const sk = elder ? ELDERS[elder].skill : undefined, power = elder ? b('skill') : 0
  return {
    el: elder ? ELDERS[elder].el : undefined,
    skill: sk && power ? { ...sk, v: sk.v * (1 + power) } : sk,
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

export const snap = (side: Side, elder?: ElderId, level = 1): Snap => ({
  elder, level, troops: side.troops.map(t => ({ type: t.type, tier: t.tier, n: t.n })),
})

// Thương binh về Đan phòng; hết chỗ thì phần dư tử trận. Nhận bậc cao trước.
export function admit(s: State, hurt: Army): { state: State; dead: Army } {
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

export function giveExp(s: State, elder: ElderId, exp: number): State {
  const cur = s.elders[elder]
  if (cur === undefined) return s
  return { ...s, elders: { ...s.elders, [elder]: Math.min(expAt(ELDER_MAX), cur + exp) } }
}

function gain(s: State, elder: ElderId, g: Gain): State {
  let st: State = { ...s, res: addBag(s.res, g.res), items: addItems(s.items, g.items) }
  if (g.elder && st.elders[g.elder] === undefined) st = { ...st, elders: { ...st.elders, [g.elder]: 0 } }
  return giveExp(st, elder, g.exp)
}

// Quà từ ngoài (thư, mốc sự kiện): tài nguyên, đan, trưởng lão — không có kinh nghiệm
export function grant(s: State, r: Reward): State {
  const st: State = { ...s, res: addBag(s.res, r.res ?? {}), items: addItems(s.items, r.items ?? {}) }
  return r.elder && st.elders[r.elder] === undefined ? { ...st, elders: { ...st.elders, [r.elder]: 0 } } : st
}

const fromReward = (r: Reward, lootMul: number, exp: number): Gain => ({
  res: Object.fromEntries(RESOURCES.map(x => [x, Math.round((r.res?.[x] ?? 0) * lootMul)])),
  items: { ...r.items }, elder: r.elder, exp: Math.round(exp),
})

export const pushReport = (s: State, r: Omit<Report, 'id'>): State => ({
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
  const loot = (1 + lead(s, elder, 'loot')) * eventMul(at)
  const expMul = (1 + lead(s, elder, 'exp')) * (f.win ? 1 : LOSS_EXP) * eventMul(at)
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
  } else if (t.kind === 'tower') {
    floor = st.tower
    foeLevel = 1 + floor
    const r = towerReward(floor)
    g.exp = Math.round((r.exp ?? 0) * expMul)
    if (f.win) {
      g = fromReward(r, 1, g.exp)
      st = { ...st, tower: floor + 1 }
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
  if (!m.back) return s // trận chưa giải (mầm ẩn ở client): chờ server báo kết quả
  const { state, dead } = admit({ ...s, marches: s.marches.filter(x => x.id !== id) }, m.hurt ?? {})
  let st = gain({ ...state, troops: plus(state.troops, m.back ?? m.army) }, m.elder, m.gain ?? { res: {}, items: {}, exp: 0 })
  // Báo cho chiến báo của chuyến này biết bao nhiêu người không qua khỏi
  if (count(dead)) st = { ...st, reports: st.reports.map(r => (r.id === m.report ? { ...r, dead } : r)) }
  return st
}

type Due = [at: number, run: (s: State) => State]
function due(s: State, now: number): Due[] {
  const ev: Due[] = []
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
  const f = s.forge
  if (f && f.finishAt <= now) ev.push([f.finishAt, st => ({ ...st, forge: null, gear: { ...st.gear, [f.gear]: { ...st.gear[f.gear], lv: f.level } } })])
  for (const x of s.buffs)
    if (x.until && x.until <= now) ev.push([x.until, st => ({ ...st, buffs: st.buffs.filter(y => y.src !== x.src || y.until !== x.until) })])
  for (const m of s.marches) {
    // đi cướp: trận cần state của người kia — server giải (world.ts), ở đây chỉ chờ
    if (!m.back && m.seed && m.arriveAt <= now && (m.target.kind === 'beast' || m.target.kind === 'sect')) ev.push([m.arriveAt, st => arrive(st, m.id)])
    if (m.returnAt && m.returnAt <= now) ev.push([m.returnAt, st => home(st, m.id)])
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
  if (!Object.hasOwn(PILLS, p) || !Number.isInteger(n) || n < 1 || n > BREW_MAX) return 'bad'
  if (s.levels.danPhong < PILLS[p].unlock) return 'locked'
  if (s.brew) return 'busy'
  const need = brewNeed(p, n)
  if (PILL_IDS.some(q => (need[q] ?? 0) > (s.items[q] ?? 0))) return 'no_item'
  return afford(s.res, brewCost(s, p, n)) ? null : 'not_enough'
}

export function forgeError(s: State, g: GearId): Err | null {
  if (!s.levels.luyenKhiPhong) return 'locked'
  const level = (s.gear[g]?.lv ?? 0) + 1
  if (level > GEAR_MAX) return 'max_level'
  if (level > gearCap(s)) return 'locked'
  if (s.forge) return 'busy'
  return afford(s.res, gearCost(g, level)) ? null : 'not_enough'
}

// Luân hồi n kiếp: công trình về căn cơ, tài nguyên / đệ tử / hàng đợi / tiến độ bản đồ / nhiệm vụ chính / độ kiếp làm lại.
// Giữ: trưởng lão, thiên phú, công pháp, pháp bảo, đan (và việc đang luyện), tháp, danh hiệu, thư, nhiệm vụ ngày / tuần / sự kiện
function reborn(s: State, t: number, n: number): State {
  const fresh = newGame(t, s.name)
  return {
    ...fresh, levels: rebirthLevels(s.rebirths + n), tech: s.tech, study: s.study, items: s.items, brew: s.brew, elders: s.elders,
    talents: s.talents, gear: s.gear, forge: s.forge, guard: s.guard,
    rebirths: s.rebirths + n, stats: s.stats, seed: s.seed, nextId: s.nextId, seen: s.nextId - 1,
    daily: s.daily, // cùng ngày: không nhận lại thưởng ngày
    weekly: s.weekly, ev: s.ev, mail: s.mail, blocks: s.blocks, ascended: s.ascended,
    tower: s.tower, // kỷ lục tháp giữ qua luân hồi (thưởng chỉ lần đầu nên không cày lại được)
  }
}

// Hết mùa (server, cho mọi người trong giới): luân hồi n kiếp (phi thăng: n = ASCEND, ghi danh hiệu mùa `season`); hành quân huỷ,
// chỗ trên bản đồ bỏ trống (server xếp lại trên bản đồ mùa mới), khiên tân thủ mới
export function seasonEnd(s: State, t: number, n: number, season?: number): State {
  const st = reborn(advance(s, t), t, n)
  return season === undefined ? st : { ...st, ascended: [...st.ascended, season] }
}

export function tribError(s: State): Err | null {
  const tr = TRIBS[s.trib]
  if (!tr || s.levels.chuDien !== tr.hall) return 'locked'
  if (s.marches.some(m => m.target.kind === 'trib')) return 'busy'
  if (s.tribCool > s.time) return 'cooldown'
  return afford(s.res, cost('chuDien', tr.hall + 1)) ? null : 'not_enough'
}

// Căn cơ của kiếp thứ n + 1 (n = số lần đã luân hồi): Chủ điện và mọi công trình đã mở ở tầng đó
export function rebirthLevels(n: number) {
  const hall = Math.min(REBIRTH_HEAD_MAX, 1 + REBIRTH_HEAD * n)
  return Object.fromEntries(IDS.map(id => [id, BUILDINGS[id].unlock <= hall ? hall : 0])) as Record<BuildingId, number>
}

export const jobOf = (s: State, k: JobKind) => (k === 'build' ? s.queue[0] ?? null : s[k])

// Đồng môn giúp: bớt ms cho việc `job` của s (đúng việc đã nhờ — startAt khớp), tại lúc at. Việc đã đổi/xong thì không làm gì.
export function hasten(s: State, job: JobKind, startAt: number, ms: number, at: number): State {
  const st = advance(s, at)
  const j = jobOf(st, job)
  if (!j || j.startAt !== startAt || job === 'brew') return st
  const sped = { ...j, finishAt: Math.max(st.time, j.finishAt - ms) }
  return advance(job === 'build' ? { ...st, queue: st.queue.map(x => (x === j ? (sped as Job) : x)) } : { ...st, [job]: sped }, at)
}

// Đan độ kiếp được dùng khi bật "dùng đan": viên mạnh nhất đang có
export const tribPill = (s: State, want: boolean): 'phaCanh' | 'doKiep' | null =>
  !want ? null : s.items.phaCanh ? 'phaCanh' : s.items.doKiep ? 'doKiep' : null

// Ba đợt lôi kiếp nối nhau; đệ tử còn đứng được đi tiếp sang đợt sau. mul: hộ pháp / phá kiếp (kiếp vân công khai)
function tribulation(s: State, elder: ElderId, army: Army, p: PillId | null, seed: number, mul = 1) {
  const tr = TRIBS[s.trib]
  const weaken = (1 - Math.min(MAX_CUT, lead(s, elder, 'trib'))) * (p === 'phaCanh' ? 1 - PHA_CANH : p ? 1 - DO_KIEP : 1) * mul
  const lv = elderLevel(s.elders[elder])
  let me = sideOf(s, elder, army)
  let win = true
  const fights: Report['fights'] = []
  for (const w of tr.waves) {
    const wave = mob(w.str, tr.tier, [[w.type, 1]], 1, undefined, weaken)
    const foe = w.el ? { ...wave, el: w.el } : wave
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

// Kiếp giáng lúc at: đội độ kiếp (đã rời khỏi s.troops) đánh ba đợt, người còn đứng về nhà, thương binh vào Đan phòng.
// paid: chi phí đã trả lúc kiếp vân tụ (công khai) — thành công không trừ nữa, thất bại hoàn lại.
function settle(s: State, elder: ElderId, army: Army, p: PillId | null, seed: number, at: number, mul: number, paid: boolean) {
  const k = s.trib
  const tr = TRIBS[k]
  const r = tribulation(s, elder, army, p, seed, mul)
  const ids = UNITS.filter(u => (army[u] ?? 0) > 0)
  const hurt = Object.fromEntries(ids.map((u, i) => [u, army[u]! - r.left[i]])) as Army
  const adm = admit({ ...s, troops: plus(s.troops, Object.fromEntries(ids.map((u, i) => [u, r.left[i]]))) }, hurt)
  const exp = Math.round(TRIB_EXP[k] * (1 + lead(s, elder, 'exp')) * (r.win ? 1 : LOSS_EXP))
  const st = giveExp(adm.state, elder, exp)
  const price = cost('chuDien', tr.hall + 1)
  const next = r.win
    ? bump({ ...st, trib: k + 1, res: paid ? st.res : bag(x => st.res[x] - price[x]), levels: { ...st.levels, chuDien: tr.hall + 1 } }, 'win')
    : { ...st, tribCool: at + TRIB_COOLDOWN, res: paid ? addBag(st.res, price) : st.res }
  return { state: pushReport(next, { at, kind: 'trib', i: k, win: r.win, fights: r.fights, hurt, dead: adm.dead, gain: { res: {}, items: {}, exp } }), seed: r.seed }
}

// Kiếp vân giáng (server gọi lúc m.arriveAt; world.ts tính mul từ hộ pháp và phá kiếp)
export function tribEnd(s: State, id: number, at: number, mul: number): State {
  const st = advance(s, at)
  const m = st.marches.find(x => x.id === id)
  if (!m || m.target.kind !== 'trib') return st
  return settle({ ...st, marches: st.marches.filter(x => x !== m) }, m.elder, m.army, m.pill ?? null, m.seed, at, mul, true).state
}

// Tỉ lệ thắng ước lượng để hiện cho người chơi: đánh thử với 9 mầm cố định, khác mầm thật (không lộ đúng kết quả).
// Tính đủ hệ khắc, công pháp trưởng lão, lôi kiếp — lực chiến thô thì không (đội bị khắc hệ hiện "áp đảo" mà thua 1/4).
export function winChance(s: State, elder: ElderId, army: Army, t: Target | 'trib', pill = false) {
  if (!count(army) || s.elders[elder] === undefined) return 0
  if (t === 'trib' && !TRIBS[s.trib]) return 0
  let won = 0
  for (let k = 1; k <= 9; k++) {
    const seed = Math.imul(k, 0x9e3779b1) >>> 0
    if (t === 'trib' ? tribulation(s, elder, army, tribPill(s, pill), seed).win : fight(sideOf(s, elder, army), enemyOf(s, t), seed).win) won++
  }
  return won / 9
}

// ---------- Kiểm dữ liệu vào ----------

// Thao tác từ client là JSON, có thể là bất cứ thứ gì (chuỗi thay số, 'constructor' thay id, thiếu trường, thừa trường).
// apply() kiểm ở đây trước tiên — một chốt cho mọi nơi gọi (server, client, sim): dựng lại object mới chỉ từ trường đã biết,
// id phải là khoá thật của bảng (không nhận khoá thừa kế như 'constructor'), số phải là số nguyên an toàn trong khoảng.
const oneOf = <T extends string>(ids: readonly T[]) => (x: unknown): x is T => typeof x === 'string' && (ids as readonly string[]).includes(x)
const int = (lo: number, hi: number) => (x: unknown): x is number => Number.isSafeInteger(x) && (x as number) >= lo && (x as number) <= hi
const isElder = oneOf(ELDER_IDS)
const JOB_KINDS: readonly JobKind[] = ['build', 'train', 'heal', 'study', 'brew', 'forge']
export function pickArmy(x: unknown): Army | null {
  if (!obj(x)) return null
  const out: Army = {}
  for (const [k, n] of Object.entries(x)) {
    if (!oneOf(UNITS)(k) || !int(0, 1e9)(n)) return null
    if (n) out[k] = n
  }
  return out
}
function pickTarget(x: unknown): Target | null {
  if (!obj(x)) return null
  if (x.kind === 'beast' && int(0, BEASTS.length - 1)(x.i)) return { kind: 'beast', i: x.i }
  if (x.kind === 'sect' && int(0, SECTS.length - 1)(x.i)) return { kind: 'sect', i: x.i }
  return null
}
type Pick<K extends Action['type']> = (a: Record<string, unknown>) => Extract<Action, { type: K }> | null
const PICK: { [K in Action['type']]: Pick<K> } = {
  upgrade: a => (oneOf(IDS)(a.building) ? { type: 'upgrade', building: a.building } : null),
  claim: () => ({ type: 'claim' }),
  train: a => (oneOf(UNITS)(a.unit) && int(1, 1e6)(a.n) ? { type: 'train', unit: a.unit, n: a.n } : null),
  heal: () => ({ type: 'heal' }),
  study: a => (oneOf(TECH_IDS)(a.tech) ? { type: 'study', tech: a.tech } : null),
  brew: a => (oneOf(PILL_IDS)(a.pill) && int(1, BREW_MAX)(a.n) ? { type: 'brew', pill: a.pill, n: a.n } : null),
  march: a => {
    const target = pickTarget(a.target), army = pickArmy(a.army)
    return target && army && isElder(a.elder) ? { type: 'march', target, elder: a.elder, army } : null
  },
  realm: a => {
    const army = pickArmy(a.army)
    return army && isElder(a.elder) && int(0, REALMS.length - 1)(a.i) ? { type: 'realm', i: a.i, elder: a.elder, army } : null
  },
  tower: a => {
    const army = pickArmy(a.army)
    return army && isElder(a.elder) ? { type: 'tower', elder: a.elder, army } : null
  },
  trade: a => (oneOf(RESOURCES)(a.from) && oneOf(RESOURCES)(a.to) && int(1, 1e12)(a.n) ? { type: 'trade', from: a.from, to: a.to, n: a.n } : null),
  trib: a => {
    const army = pickArmy(a.army)
    return army && isElder(a.elder) && typeof a.pill === 'boolean' ? { type: 'trib', elder: a.elder, army, pill: a.pill } : null
  },
  speed: a =>
    oneOf(JOB_KINDS)(a.job) && int(1, 1e4)(a.n) && (a.pill === undefined || a.pill === 'daiTuKhi')
      ? { type: 'speed', job: a.job, n: a.n, ...(a.pill && { pill: a.pill }) }
      : null,
  feed: a => (isElder(a.elder) && int(1, 1e4)(a.n) ? { type: 'feed', elder: a.elder, n: a.n } : null),
  seen: () => ({ type: 'seen' }),
  rebirth: () => ({ type: 'rebirth' }),
  daily: a => (int(0, DAILY.length - 1)(a.i) ? { type: 'daily', i: a.i } : null),
  dailyBonus: () => ({ type: 'dailyBonus' }),
  weekly: a => (int(0, WEEKLY.length - 1)(a.i) ? { type: 'weekly', i: a.i } : null),
  weeklyBonus: () => ({ type: 'weeklyBonus' }),
  forge: a => (oneOf(GEAR_IDS)(a.gear) ? { type: 'forge', gear: a.gear } : null),
  equip: a => (oneOf(GEAR_IDS)(a.gear) && (a.elder === null || isElder(a.elder)) ? { type: 'equip', gear: a.gear, elder: a.elder } : null),
  talent: a => (isElder(a.elder) && int(0, 2)(a.branch) ? { type: 'talent', elder: a.elder, branch: a.branch as 0 | 1 | 2 } : null),
  wash: a => (isElder(a.elder) ? { type: 'wash', elder: a.elder } : null),
  cure: () => ({ type: 'cure' }),
  focus: () => ({ type: 'focus' }),
  guard: a => (a.elder === null || isElder(a.elder) ? { type: 'guard', elder: a.elder } : null),
  mail: a => (int(0, 1e12)(a.id) ? { type: 'mail', id: a.id } : null),
  event: a => (int(0, EVENT_GOALS.length - 1)(a.i) ? { type: 'event', i: a.i } : null),
  block: a => (int(1, 1e12)(a.pid) && typeof a.on === 'boolean' ? { type: 'block', pid: a.pid, on: a.on } : null),
}
export function parseAction(raw: unknown): Action | null {
  if (!obj(raw) || typeof raw.type !== 'string' || !Object.hasOwn(PICK, raw.type)) return null
  return (PICK[raw.type as Action['type']] as (a: Record<string, unknown>) => Action | null)(raw)
}

// ---------- Thao tác ----------

export function apply(s: State, raw: Action, now: number): Result {
  const a = parseAction(raw)
  if (!a) return { ok: false, error: 'bad' }
  const state = advance(s, now)
  const t = state.time
  const ok = (st: State): Result => ({ ok: true, state: st })
  const no = (error: Err): Result => ({ ok: false, error })
  const pay = (c: Bag) => bag(r => state.res[r] - c[r])
  const use = (p: PillId, n = 1): Items => ({ ...state.items, [p]: (state.items[p] ?? 0) - n })
  // Đội đang xuất chinh mang theo trưởng lão như lúc xuất quân: không đổi pháp bảo, thiên phú giữa đường
  const marching = (e?: ElderId | null) => !!e && state.marches.some(m => m.elder === e)

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
      const need = brewNeed(a.pill, a.n)
      const items = Object.fromEntries(PILL_IDS.map(p => [p, (state.items[p] ?? 0) - (need[p] ?? 0)])) as Items
      return ok(bump({ ...state, res: pay(brewCost(state, a.pill, a.n)), items, brew: { pill: a.pill, n: a.n, startAt: t, finishAt: t + brewTime(state, a.pill, a.n) } }, 'brew'))
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
    case 'realm':
    case 'tower': {
      const target: Target = a.type === 'tower' ? { kind: 'tower', i: 0 } : { kind: 'realm', i: a.i }
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
      const p = tribPill(state, a.pill)
      if (a.pill && !p) return no('no_item')
      const army = Object.fromEntries(UNITS.filter(u => a.army[u]).map(u => [u, a.army[u]])) as Army
      const away: State = { ...state, troops: minus(state.troops, army), items: p ? use(p) : state.items }
      if (!state.seat) {
        const r = settle(away, a.elder, army, p, state.seed, t, 1, false)
        return ok({ ...r.state, seed: r.seed })
      }
      // có chỗ trên bản đồ giới: kiếp vân tụ trên núi cho cả giới thấy, trả chi phí ngay, server giải lúc giáng (tribEnd).
      // Đội độ kiếp là một đội xuất quân (chiếm một lượt)
      if (state.marches.length >= marchSlots(state)) return no('slots')
      const k = state.trib
      const price = cost('chuDien', TRIBS[k].hall + 1)
      const m: March = { id: state.nextId, elder: a.elder, army, target: { kind: 'trib', i: k }, seed: state.seed, startAt: t, arriveAt: t + TRIB_CLOUD[k], returnAt: 0, ...(p && { pill: p }) }
      return ok({ ...away, res: bag(r => away.res[r] - price[r]), marches: [...away.marches, m], nextId: state.nextId + 1, seed: nextSeed(state.seed) })
    }
    case 'speed': {
      if (a.job === 'brew') return no('bad') // đan không rút ngắn việc luyện đan: có giảm thời gian từ công pháp là thành vòng lặp đẻ đan
      const pill = a.pill ?? 'tuKhi'
      if (a.n > (state.items[pill] ?? 0)) return no('no_item')
      const job = jobOf(state, a.job)
      if (!job) return no('empty')
      const sped = { ...job, finishAt: Math.max(t, job.finishAt - (pill === 'daiTuKhi' ? SPEEDUP_BIG : SPEEDUP) * a.n) }
      const next: State =
        a.job === 'build'
          ? { ...state, queue: state.queue.map(j => (j === job ? (sped as Job) : j)) }
          : { ...state, [a.job]: sped }
      return ok(advance({ ...next, items: use(pill, a.n) }, t))
    }
    case 'feed': {
      if (state.elders[a.elder] === undefined) return no('locked')
      if (!Number.isInteger(a.n) || a.n < 1 || a.n > (state.items.boiNguyen ?? 0)) return no('no_item')
      return ok(giveExp({ ...state, items: { ...state.items, boiNguyen: state.items.boiNguyen! - a.n } }, a.elder, BOI_NGUYEN_EXP * a.n))
    }
    case 'seen':
      return ok({ ...state, seen: state.nextId - 1 })
    case 'rebirth': {
      if (state.levels.chuDien < REBIRTH_HALL) return no('locked')
      if (state.seat) return no('locked') // trong giới: luân hồi khi hết mùa (seasonEnd)
      if (state.marches.length) return no('busy')
      return ok(reborn(state, t, 1))
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
      const w = state.weekly
      return ok({ ...state, items: addItems(state.items, DAILY_BONUS), daily: { ...state.daily, bonus: true }, weekly: { ...w, n: { ...w.n, days: w.n.days + 1 } } })
    }
    case 'trade': {
      if (state.levels.tangBaoCac < 1) return no('locked')
      if (a.from === a.to || !RESOURCES.includes(a.from) || !RESOURCES.includes(a.to) || !Number.isInteger(a.n) || a.n < 1) return no('locked')
      if (a.n > Math.floor(state.res[a.from])) return no('not_enough')
      const got = Math.floor(a.n * tradeKeep(state))
      return ok({ ...state, res: { ...state.res, [a.from]: state.res[a.from] - a.n, [a.to]: state.res[a.to] + got } })
    }
    case 'weekly': {
      if (state.levels.chuDien < DAILY_HALL || !WEEKLY[a.i]) return no('locked')
      if (state.weekly.got[a.i]) return no('max_level')
      if (!weeklyDone(state, a.i)) return no('not_done')
      const n = weeklyReward(state)
      return ok({ ...state, res: bag(r => state.res[r] + n), weekly: { ...state.weekly, got: state.weekly.got.map((x, k) => x || k === a.i) } })
    }
    case 'weeklyBonus': {
      if (state.levels.chuDien < DAILY_HALL) return no('locked')
      if (state.weekly.bonus) return no('max_level')
      if (!state.weekly.got.every(Boolean)) return no('not_done')
      return ok({ ...state, items: addItems(state.items, WEEKLY_BONUS), weekly: { ...state.weekly, bonus: true } })
    }
    case 'forge': {
      const e = forgeError(state, a.gear)
      if (e) return no(e)
      const level = (state.gear[a.gear]?.lv ?? 0) + 1
      return ok(evBump({ ...state, res: pay(gearCost(a.gear, level)), forge: { gear: a.gear, level, startAt: t, finishAt: t + gearTime(state, a.gear, level) } }, 'forge'))
    }
    case 'equip': {
      const g = state.gear[a.gear]
      if (!g?.lv || (a.elder && state.elders[a.elder] === undefined)) return no('locked')
      if (marching(g.on) || marching(a.elder)) return no('busy')
      // mỗi trưởng lão một món: món người nhận đang đeo được tháo ra
      const gear = { ...state.gear }
      for (const id of GEAR_IDS) if (a.elder && gear[id]?.on === a.elder) gear[id] = { lv: gear[id]!.lv }
      gear[a.gear] = a.elder ? { lv: g.lv, on: a.elder } : { lv: g.lv }
      return ok({ ...state, gear })
    }
    case 'talent': {
      if (state.elders[a.elder] === undefined) return no('locked')
      if (marching(a.elder)) return no('busy')
      const cur = state.talents[a.elder] ?? [0, 0, 0]
      if (cur[a.branch] >= TALENT_MAX) return no('max_level')
      if (talentUsed(state, a.elder) >= talentPoints(state, a.elder)) return no('not_enough')
      return ok({ ...state, talents: { ...state.talents, [a.elder]: cur.map((x, i) => (i === a.branch ? x + 1 : x)) as Talent } })
    }
    case 'wash': {
      if (!state.items.taiTuy) return no('no_item')
      if (!talentUsed(state, a.elder)) return no('empty')
      if (marching(a.elder)) return no('busy')
      const { [a.elder]: _, ...talents } = state.talents
      return ok({ ...state, items: use('taiTuy'), talents })
    }
    case 'cure': {
      if (!state.items.hoiXuan) return no('no_item')
      // thương binh chưa nằm trong đợt đang chữa, bậc cao trước
      const free = minus(state.wounded, state.heal?.troops ?? {})
      let left = CURE
      const up: Army = {}
      for (const u of [...UNITS].sort((a, b) => unitOf(b).tier - unitOf(a).tier)) {
        const n = Math.min(free[u], left)
        if (n > 0) (up[u] = n), (left -= n)
      }
      if (!count(up)) return no('empty')
      return ok({
        ...state, items: use('hoiXuan'), troops: plus(state.troops, up), wounded: minus(state.wounded, up),
        stats: { ...state.stats, healed: state.stats.healed + count(up) },
      })
    }
    case 'guard': {
      if (a.elder && state.elders[a.elder] === undefined) return no('locked')
      return ok({ ...state, guard: a.elder })
    }
    case 'mail': {
      const m = state.mail.find(x => x.id === a.id)
      if (!m?.gift) return no('empty')
      if (m.got) return no('max_level')
      return ok({ ...grant(state, m.gift), mail: state.mail.map(x => (x === m ? { ...x, got: true } : x)) })
    }
    case 'event': {
      if (state.levels.chuDien < DAILY_HALL || !EVENT_GOALS[a.i]) return no('locked')
      if (state.ev.got[a.i]) return no('max_level')
      if (state.ev.pts < EVENT_GOALS[a.i]) return no('not_done')
      return ok({ ...grant(state, EVENT_REWARDS[a.i]), ev: { ...state.ev, got: state.ev.got.map((x, k) => x || k === a.i) } })
    }
    case 'block': {
      const rest = state.blocks.filter(p => p !== a.pid)
      if (a.on && rest.length >= BLOCKS_MAX) return no('full')
      return ok({ ...state, blocks: a.on ? [...rest, a.pid] : rest })
    }
    case 'focus': {
      if (!state.items.ngungThan) return no('no_item')
      // uống thêm thì kéo dài, không cộng dồn sức
      const cur = state.buffs.find(x => x.src === 'ngungThan')
      const buff: Buff = { key: 'atk', v: FOCUS, until: Math.max(cur?.until ?? 0, t) + FOCUS_TIME, src: 'ngungThan' }
      return ok({ ...state, items: use('ngungThan'), buffs: [...state.buffs.filter(x => x !== cur), buff] })
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
    case 'tower': return [s.tower, q.n]
    case 'forge': return [gearSum(s) + (s.forge ? 1 : 0), q.n] // như luyện đan: tính cả món đang luyện
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
    s.v === 4 && typeof s.name === 'string' && num(s.quest) && num(s.time) && isBag(s.res) && isBag(s.carry) &&
    obj(s.levels) && IDS.every(id => num(s.levels[id]) && s.levels[id] >= 0 && s.levels[id] <= MAX_LEVEL) &&
    Array.isArray(s.queue) && s.queue.every((j: any) => isTimed(j) && j && IDS.includes(j.building) && num(j.level)) &&
    isTroops(s.troops) && isTroops(s.wounded) &&
    [s.train, s.heal, s.study, s.brew, s.forge].every(isTimed) && (!s.forge || (Object.hasOwn(GEAR, s.forge.gear) && num(s.forge.level))) &&
    obj(s.tech) && obj(s.items) && obj(s.elders) && Object.keys(s.elders).every(e => Object.hasOwn(ELDERS, e) && num(s.elders[e])) &&
    obj(s.talents) && Object.entries(s.talents).every(([e, t]) => Object.hasOwn(ELDERS, e) && Array.isArray(t) && t.length === 3 && t.every(num)) &&
    obj(s.gear) && Object.entries(s.gear).every(([g, x]: [string, any]) => Object.hasOwn(GEAR, g) && obj(x) && num(x.lv) && (x.on === undefined || Object.hasOwn(ELDERS, x.on))) &&
    Array.isArray(s.buffs) && s.buffs.every((b: any) => obj(b) && typeof b.key === 'string' && num(b.v) && num(b.until) && typeof b.src === 'string') &&
    Array.isArray(s.marches) &&
    s.marches.every((m: any) => obj(m) && Object.hasOwn(ELDERS, m.elder) && obj(m.army) && obj(m.target) && ['beast', 'sect', 'pvp', 'spot', 'trib'].includes(m.target.kind) &&
      num(m.target.i) && num(m.seed) && num(m.startAt) && num(m.arriveAt) && num(m.returnAt)) &&
    Array.isArray(s.reports) && s.reports.every((r: any) => obj(r) && num(r.id) && Array.isArray(r.fights) && obj(r.gain) && obj(r.hurt) && obj(r.dead)) &&
    num(s.seen) && num(s.beast) && obj(s.cool) &&
    num(s.tower) && Array.isArray(s.sects) && s.sects.length === SECTS.length && Array.isArray(s.realms) && s.realms.length === REALMS.length &&
    num(s.trib) && num(s.tribCool) && num(s.rebirths) && num(s.seed) && num(s.nextId) &&
    obj(s.stats) && ['trained', 'healed', 'brewed', 'won', 'lost'].every(k => num(s.stats[k])) &&
    obj(s.daily) && num(s.daily.day) && obj(s.daily.n) && Array.isArray(s.daily.got) && s.daily.got.length === DAILY.length &&
    obj(s.weekly) && num(s.weekly.week) && obj(s.weekly.n) && WEEKLY.every(w => num(s.weekly.n[w.id])) &&
    Array.isArray(s.weekly.got) && s.weekly.got.length === WEEKLY.length &&
    obj(s.ev) && num(s.ev.week) && num(s.ev.pts) && Array.isArray(s.ev.got) && s.ev.got.length === EVENT_GOALS.length &&
    num(s.shield) && (s.guard === null || Object.hasOwn(ELDERS, s.guard)) && obj(s.pvp) && num(s.pvp.pts) && num(s.pvp.win) && num(s.pvp.loss) &&
    Array.isArray(s.foes) && s.foes.every((f: any) => obj(f) && num(f.pid) && typeof f.name === 'string' && num(f.at)) &&
    Array.isArray(s.mail) && s.mail.every((m: any) => obj(m) && num(m.id) && num(m.at) && typeof m.k === 'string') &&
    (s.seat === null || (obj(s.seat) && num(s.seat.x) && num(s.seat.y))) &&
    Array.isArray(s.blocks) && s.blocks.every(num) && Array.isArray(s.ascended) && s.ascended.every(num)
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
  if (s.v === 3 && typeof s.time === 'number') {
    // Bản 4: tầng 16–25 (công trình mới, đệ tử bậc 4–5, bí cảnh mới), pháp bảo, thiên phú, buff
    const zero = troops(() => 0)
    s = {
      ...s, v: 4, levels: { ...Object.fromEntries(IDS.map(id => [id, 0])), ...s.levels }, troops: { ...zero, ...s.troops }, wounded: { ...zero, ...s.wounded },
      realms: REALMS.map((_, i) => s.realms?.[i] ?? 0), forge: null, talents: {}, gear: {}, buffs: [],
    }
  }
  if (s.v !== 4 || typeof s.time !== 'number') return null
  // Trường thêm sau (trong cùng bản): thiếu thì lấy mặc định
  if (!s.daily) s = { ...s, daily: freshDaily(s.time) } // save làm trước khi có nhiệm vụ ngày
  if (!s.weekly) s = { ...s, weekly: freshWeekly(s.time) } // … nhiệm vụ tuần
  if (s.tower === undefined) s = { ...s, tower: 0 } // … Thông Thiên Tháp
  if (!s.ev) s = { ...s, ev: freshEv(s.time) } // … PvP, thư, sự kiện tuần (người cũ không được khiên tân thủ)
  if (s.shield === undefined) s = { ...s, shield: 0, guard: null, pvp: { pts: PVP_START, win: 0, loss: 0 }, foes: [], mail: [] }
  if (s.seat === undefined) s = { ...s, seat: null } // … bản đồ giới
  if (!s.blocks) s = { ...s, blocks: [] } // … chat
  if (!s.ascended) s = { ...s, ascended: [] } // … mùa giải
  return s
}
