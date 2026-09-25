// Chỉ số suy ra từ State: bonus, chi phí, thời gian, sức chứa, sản lượng, thế lực.
import { type Army, type Items, type State } from './types.ts'
import {
  afford,
  bag,
  climb,
  count,
  ELDER_IDS,
  GEAR_IDS,
  grow,
  IDS,
  plus,
  rateLevels,
  TECH_IDS,
  troops,
} from './util.ts'
import {
  BASE_CAP,
  BASE_RATE,
  DAOS,
  STRATS,
  DEPUTY_HALL,
  MARCH_CAP,
  MARCH_CAP_STAR,
  MARCH_CAP_STEP,
  BATCH_BASE,
  BATCH_STEP,
  BUILDINGS,
  CAP_GROWTH,
  COST_GROWTH,
  COST_GROWTH2,
  ELDER_MAX,
  ELDERS,
  EXP_BASE,
  GEAR,
  GEAR_COST_GROWTH,
  GEAR_MAX,
  GEAR_TIME_GROWTH,
  HEAL_COST,
  HEAL_TIME,
  HOSPITAL_BASE,
  HOSPITAL_STEP,
  AP_EVERY,
  AP_MAX,
  MARCH_SLOTS,
  MAX_CUT,
  MAX_LEVEL,
  PILLS,
  REBIRTH_BUILD,
  REBIRTH_MAX,
  REBIRTH_PROD,
  RESOURCES,
  TALENT_EVERY,
  TALENTS,
  TECH_COST_GROWTH,
  TECH_TIME_GROWTH,
  TECHS,
  TIER,
  TIME_GROWTH,
  TIME_GROWTH2,
  TRADE_KEEP,
  TRADE_KEEP_MAX,
  TRADE_STEP,
  UNIT_BASE,
  UNITS,
  STAR_BONUS,
  VIP_LEVELS,
  VIP_PERKS,
  type Bag,
  type Bonus,
  type BuildingId,
  type ElderId,
  type GearId,
  type PillId,
  type Res,
  type TechId,
  type Tier,
  type UnitId,
  type UnitType,
} from '../data.ts'

// Công pháp + luân hồi + buff + Hương Hỏa. Bonus giảm (thời gian, chi phí) dùng qua cutOf().
export function bonus(s: State, key: Bonus) {
  let v = 0
  for (const id of TECH_IDS) if (TECHS[id].key === key) v += TECHS[id].v * (s.tech[id] ?? 0)
  if (key === 'prod') v += REBIRTH_PROD * Math.min(REBIRTH_MAX, s.rebirths)
  if (key === 'build') v += REBIRTH_BUILD * Math.min(REBIRTH_MAX, s.rebirths)
  for (const b of s.buffs) if (b.key === key) v += b.v
  if (s.dao) v += (DAOS[s.dao.id] as Partial<Record<Bonus, number>>)[key] ?? 0
  if (s.strat) v += (STRATS[s.strat] as Partial<Record<Bonus, number>>)[key] ?? 0
  return v + (VIP_PERKS[vipLevel(s)][key] ?? 0)
}
// Cấp Hương Hỏa theo tổng điểm (save cũ chưa có: cấp 0)
export const vipLevel = (s: State) => {
  const pts = s.vip?.pts ?? 0
  let lv = 0
  while (lv + 1 < VIP_LEVELS.length && pts >= VIP_LEVELS[lv + 1]) lv++
  return lv
}
export const cutOf = (s: State, key: Bonus) => 1 - Math.min(MAX_CUT, bonus(s, key))

export const elderLevel = (exp = 0) => {
  let n = 1
  while (n < ELDER_MAX && EXP_BASE * (n + 1) * n <= exp) n++
  return n
}
export const expAt = (level: number) => EXP_BASE * level * (level - 1)
// Tâm pháp (bị động) đã mở của trưởng lão e cho chỉ số key — phó trưởng lão chỉ góp phần này
export function passive(s: State, e: ElderId, key: Bonus) {
  const lv = elderLevel(s.elders[e])
  return ELDERS[e].passives.reduce((sum, p) => sum + (lv >= p.at && p.key === key ? p.v : 0), 0)
}
// bonus của cả tông môn + của riêng trưởng lão dẫn đội: bị động, pháp bảo đang đeo, thiên phú
export function lead(s: State, elder: ElderId, key: Bonus) {
  let v = bonus(s, key) + passive(s, elder, key)
  for (const g of GEAR_IDS) if (s.gear[g]?.on === elder && GEAR[g].key === key) v += GEAR[g].v * s.gear[g]!.lv
  const t = s.talents[elder]
  if (t) TALENTS.forEach((d, i) => d.key === key && (v += d.v * t[i]))
  return v + (STAR_BONUS[key] ?? 0) * ((s.stars?.[elder] ?? 1) - 1) // sao trưởng lão (Chiêu Hiền Đài)
}
export const talentPoints = (s: State, elder: ElderId) => Math.floor(elderLevel(s.elders[elder]) / TALENT_EVERY)
export const talentUsed = (s: State, elder: ElderId) => (s.talents[elder] ?? [0, 0, 0]).reduce((a, b) => a + b, 0)
export const gearOf = (s: State, elder: ElderId) => GEAR_IDS.find(g => s.gear[g]?.on === elder)

export const cost = (b: BuildingId, level: number) =>
  bag(r => climb(BUILDINGS[b].cost[r], COST_GROWTH, COST_GROWTH2, level - 1))
export const buildTime = (s: State, b: BuildingId, level: number) =>
  Math.round(climb(BUILDINGS[b].time, TIME_GROWTH, TIME_GROWTH2, level - 1) * cutOf(s, 'build')) * 1000
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
  IDS.reduce(
    (sum, id) => (BUILDINGS[id].makes === r ? sum + (BUILDINGS[id].rate ?? 0) * rateLevels(s.levels[id]) : sum),
    BASE_RATE,
  )
export const rate = (s: State, r: Res) => Math.round(baseRate(s, r) * (1 + bonus(s, 'prod') + bonus(s, `prod.${r}`)))

export const unitOf = (u: UnitId) => ({ type: u.slice(0, -1) as UnitType, tier: Number(u.slice(-1)) as Tier })
export const HIGH_FIRST = [...UNITS].sort((a, b) => unitOf(b).tier - unitOf(a).tier) // bậc cao trước
export const trainCost = (u: UnitId, n: number) => {
  const { type, tier } = unitOf(u)
  return bag(r => Math.round(UNIT_BASE[type].cost[r] * TIER[tier].cost) * n)
}
const unitSeconds = (u: UnitId) => UNIT_BASE[unitOf(u).type].time * TIER[unitOf(u).tier].time
export const trainTime = (s: State, u: UnitId, n: number) => Math.round(unitSeconds(u) * n * cutOf(s, 'train')) * 1000
export const batch = (s: State) => BATCH_BASE + BATCH_STEP * s.levels.dienVoTruong
export const tierOpen = (s: State, tier: Tier) => s.levels.dienVoTruong >= TIER[tier].unlock
export const hospital = (s: State) =>
  Math.round((HOSPITAL_BASE + HOSPITAL_STEP * s.levels.danPhong) * (1 + bonus(s, 'hospital')))
export const healCost = (s: State, a: Army) =>
  bag(r =>
    Math.round(UNITS.reduce((sum, u) => sum + (a[u] ?? 0) * trainCost(u, 1)[r], 0) * HEAL_COST * cutOf(s, 'heal')),
  )
export const healTime = (s: State, a: Army) =>
  Math.round(UNITS.reduce((sum, u) => sum + (a[u] ?? 0) * unitSeconds(u), 0) * HEAL_TIME * cutOf(s, 'heal')) * 1000

export const techCost = (t: TechId, level: number) => bag(r => grow(TECHS[t].cost[r], TECH_COST_GROWTH, level - 1))
export const techTime = (t: TechId, level: number) => grow(TECHS[t].time, TECH_TIME_GROWTH, level - 1) * 1000
export const techSum = (s: State) => TECH_IDS.reduce((sum, t) => sum + (s.tech[t] ?? 0), 0)
export const brewCost = (s: State, p: PillId, n: number) =>
  bag(r => Math.round(PILLS[p].cost[r] * n * cutOf(s, 'brew')))
export const brewTime = (s: State, p: PillId, n: number) => Math.round(PILLS[p].time * n * cutOf(s, 'brew')) * 1000
// đan làm nguyên liệu cho n viên
export const brewNeed = (p: PillId, n: number) =>
  Object.fromEntries(Object.entries(PILLS[p].need ?? {}).map(([k, v]) => [k, v! * n])) as Items

// Luyện Khí Phòng
export const gearCap = (s: State) => Math.min(GEAR_MAX, Math.ceil(s.levels.luyenKhiPhong / 2))
export const gearCost = (g: GearId, level: number) => bag(r => grow(GEAR[g].cost[r], GEAR_COST_GROWTH, level - 1))
export const gearTime = (s: State, g: GearId, level: number) =>
  Math.round(grow(GEAR[g].time, GEAR_TIME_GROWTH, level - 1) * cutOf(s, 'forge')) * 1000
export const gearSum = (s: State) => GEAR_IDS.reduce((sum, g) => sum + (s.gear[g]?.lv ?? 0), 0)

export const away = (s: State) =>
  s.marches.reduce(
    (a, m) => plus(a, m.army),
    troops(() => 0),
  )
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

// Thương hội: phần giữ lại khi đổi tài nguyên (0..1)
export const tradeKeep = (s: State) => Math.min(TRADE_KEEP_MAX, TRADE_KEEP + TRADE_STEP * (s.levels.tangBaoCac - 1))

export const realmOf = (level: number) => Math.min(5, Math.ceil(level / 5)) // 1 Luyện Khí · 2 Trúc Cơ · 3 Kim Đan · 4 Nguyên Anh · 5 Hóa Thần
export const marchSlots = (s: State) => MARCH_SLOTS[realmOf(s.levels.chuDien) - 1]
// Trưởng lão đang dẫn đội (hay làm phó) đi xa: không giữ nhà, không đổi pháp bảo / thiên phú giữa đường
export const isMarching = (s: State, e?: ElderId | null) => !!e && s.marches.some(m => m.elder === e || m.deputy === e)
// Trận dung: số đệ tử tối đa một đội ra bản đồ giới do trưởng lão e dẫn
export const capOf = (s: State, e: ElderId) =>
  Math.floor(
    (MARCH_CAP + MARCH_CAP_STEP * (elderLevel(s.elders[e]) - 1)) * (1 + MARCH_CAP_STAR * ((s.stars?.[e] ?? 1) - 1)),
  )
// Phó trưởng lão đi cùng chủ tướng e lúc này: đã ghép, đã mở (Chủ điện), đang ở nhà (không dẫn / không làm phó đội khác)
export function deputyOf(s: State, e: ElderId | null): ElderId | undefined {
  const d = e ? s.pairs?.[e] : undefined
  return d && d !== e && s.levels.chuDien >= DEPUTY_HALL && s.elders[d] !== undefined && !isMarching(s, d)
    ? d
    : undefined
}
// Hành lực lúc t (chưa từng dùng: đầy)
export const apOf = (s: State, t: number) =>
  s.ap ? Math.min(AP_MAX, s.ap.n + Math.floor(Math.max(0, t - s.ap.at) / AP_EVERY)) : AP_MAX
// Tiêu n hành lực lúc t (phần lẻ chưa đủ một lượt hồi vẫn giữ: mốc tính từ lúc hồi gần nhất)
export function spendAp(s: State, t: number, n: number): State {
  const have = apOf(s, t)
  const at = have >= AP_MAX || !s.ap ? t : s.ap.at + Math.floor((t - s.ap.at) / AP_EVERY) * AP_EVERY
  return { ...s, ap: { n: have - n, at } }
}
