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
  HOUR,
  IDS,
  plus,
  rateLevels,
  TECH_IDS,
  troops,
} from './util.ts'
import {
  BASE_CAP,
  PROTECT,
  PROTECT_STEP,
  BASE_RATE,
  DAOS,
  STRATS,
  FOLIO,
  PRIME_SKILL,
  AWAKEN_MAX,
  AWAKEN_STEP,
  AWAKEN_V,
  CTECH,
  HERMITS,
  HERMIT_FAVOR,
  HERMIT_IDS,
  type HermitId,
  ELITE,
  STUDY_CUT,
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
  GEAR_SETS,
  GEAR_SLOTS,
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
  TALENT_NODES,
  TALENT_STAR,
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
  UNIT_SPEED,
  DAO_UNITS,
  UNITS,
  STAR_BONUS,
  EXPERTISE,
  RELIC_BONUS,
  PASSIVE_LV,
  AUX_HALLS,
  AUX_SHARE,
  DIVINE_SKILL,
  SKILL_LV_POWER,
  SKILL_MAX,
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
  if (key === 'study') v += STUDY_CUT * s.levels.tangKinhCac
  for (const b of s.buffs) if (b.key === key) v += b.v
  if (s.dao) v += (DAOS[s.dao.id] as Partial<Record<Bonus, number>>)[key] ?? 0
  if (s.strat) v += (STRATS[s.strat] as Partial<Record<Bonus, number>>)[key] ?? 0
  s.ctech?.forEach((lv, i) => (v += CTECH[i]?.key === key ? CTECH[i].v * lv : 0)) // Linh Tinh Trận Pháp (mùa)
  for (const h of HERMIT_IDS)
    if (hermitLv(s, h) > HERMIT_FAVOR.length) v += (HERMITS[h] as Partial<Record<Bonus, number>>)[key] ?? 0
  if (s.folio && s.buffs.some(b => b.key === 'folio'))
    s.folio.p.forEach((pg, k) => (v += pg !== null && FOLIO[k][pg]?.key === key ? FOLIO[k][pg].v : 0)) // Binh Thư (chỉ mùa có luật)
  return v + (VIP_PERKS[vipLevel(s)][key] ?? 0)
}
// Tinh Binh Luận Kiếm: hệ số công / máu của đệ tử bậc 5 hệ type đã luyện tinh binh — chỉ mùa có luật, không thì 1 (giữ nguyên từng số)
export function eliteK(s: State, type: UnitType, tier: Tier) {
  const lv = tier === 5 && s.elite?.[type] && s.buffs.some(b => b.key === 'elite') ? s.elite[type] : 0
  return { atk: 1 + ELITE[type].atk * lv, hp: 1 + ELITE[type].hp * lv }
}
// Ẩn Sĩ Động Phủ: cấp hảo cảm của ẩn sĩ h (1 — tột cấp HERMIT_FAVOR.length + 1)
export const hermitLv = (s: State, h: HermitId) => 1 + HERMIT_FAVOR.filter(n => (s.hermit?.fav[h] ?? 0) >= n).length
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
// Tầng [công pháp, tâm pháp 1, 2…] đã ngộ; mọi môn đều tầng cuối: Bản Mệnh Thần Thông
export const skillLv = (s: State, e: ElderId) => s.skl?.[e] ?? [1, ...ELDERS[e].passives.map(() => 1)]
export const expertOf = (s: State, e: ElderId) => skillLv(s, e).every(x => x >= SKILL_MAX)
// Tâm pháp (bị động) đã mở của trưởng lão e cho chỉ số key (theo tầng đã ngộ) — phó trưởng lão chỉ góp phần này
export function passive(s: State, e: ElderId, key: Bonus) {
  const lv = elderLevel(s.elders[e]),
    sk = skillLv(s, e)
  return ELDERS[e].passives.reduce(
    (sum, p, i) => sum + (lv >= p.at && p.key === key ? p.v * (1 + PASSIVE_LV * (sk[i + 1] - 1)) : 0),
    0,
  )
}
// Thần Binh mùa này: người cầm (gắn trong mùa giới hiện tại) — công pháp người đó áp cho mọi hệ
export const divineOf = (s: State) => (s.divine && s.divine.season === s.seasonAt ? s.divine.elder : undefined)
export function skillOf(s: State, e: ElderId) {
  const sk = ELDERS[e].skill
  return (divineOf(s) === e || s.prime?.includes(e)) && sk.type ? { ...sk, type: undefined } : sk // Thần Binh / bản mệnh pháp bảo
}
// Mượn Pháp: số ô (trong mùa giới, theo tầng Chủ điện) và người cho trưởng lão e mượn tâm pháp (đã thu nhận, không phải chính mình)
export const auxSlots = (s: State) =>
  s.seasonAt === undefined ? 0 : AUX_HALLS.filter(h => s.levels.chuDien >= h).length
export const auxOf = (s: State, e: ElderId) =>
  (s.aux?.[e] ?? []).filter(x => x !== e && s.elders[x] !== undefined).slice(0, auxSlots(s))
// bonus của cả tông môn + của riêng trưởng lão dẫn đội: bị động (cả tâm pháp mượn), pháp bảo đang đeo, thiên phú, Thần Binh
export function lead(s: State, elder: ElderId, key: Bonus) {
  let v = bonus(s, key) + passive(s, elder, key)
  for (const x of auxOf(s, elder)) v += AUX_SHARE * passive(s, x, key)
  if (key === 'skill' && divineOf(s) === elder) v += DIVINE_SKILL
  if (key === 'skill' && s.prime?.includes(elder)) v += PRIME_SKILL // Chân Thân
  for (const g of GEAR_IDS) {
    const x = s.gear[g]
    if (x?.on !== elder) continue
    if (GEAR[g].key === key) v += GEAR[g].v * x.lv * (1 + AWAKEN_STEP * (x.aw ?? 0)) // khai linh: × 1 khi chưa khai
    if ((x.aw ?? 0) >= AWAKEN_MAX && AWAKEN_V[GEAR[g].slot].key === key) v += AWAKEN_V[GEAR[g].slot].v
  }
  gearSets(s, elder).forEach(([t, n]) => {
    const d = GEAR_SETS[t]
    if (n >= 2 && d.two.key === key) v += d.two.v
    if (n >= 3 && d.three.key === key) v += d.three.v
  })
  const t = s.talents[elder]
  const own = (k: string) => k.replace('.own', `.${ELDERS[elder].type}`) // nút theo hệ của chính trưởng lão
  if (t) TALENT_NODES.forEach((d, i) => own(d.key) === key && (v += d.v * (t[i] ?? 0)))
  if (key === 'skill') v += SKILL_LV_POWER * (skillLv(s, elder)[0] - 1) // tầng công pháp đã ngộ
  if (expertOf(s, elder)) v += EXPERTISE[key] ?? 0 // Bản Mệnh Thần Thông
  v += (RELIC_BONUS[key] ?? 0) * (s.relics?.[elder] ?? 0) // Anh Linh Điện (di vật trong mùa)
  return v + (STAR_BONUS[key] ?? 0) * ((s.stars?.[elder] ?? 1) - 1) // sao trưởng lão (Chiêu Hiền Đài)
}
export const talentPoints = (s: State, elder: ElderId) =>
  elderLevel(s.elders[elder]) - 1 + TALENT_STAR * ((s.stars?.[elder] ?? 1) - 1)
export const talentUsed = (s: State, elder: ElderId) => (s.talents[elder] ?? []).reduce((a, b) => a + b, 0)
// pháp bảo trưởng lão đang đeo theo ô (binh khí, hộ thân, linh bảo; ô trống: undefined)
export const gearsOf = (s: State, elder: ElderId) =>
  Array.from({ length: GEAR_SLOTS }, (_, k) => GEAR_IDS.find(g => GEAR[g].slot === k && s.gear[g]?.on === elder))
// số món mỗi bộ trưởng lão đang đeo (chỉ bộ có món)
export const gearSets = (s: State, elder: ElderId) =>
  (Object.keys(GEAR_SETS) as UnitType[])
    .map(t => [t, GEAR_IDS.filter(g => GEAR[g].set === t && s.gear[g]?.on === elder).length] as const)
    .filter(([, n]) => n > 0)

export const cost = (b: BuildingId, level: number) =>
  bag(r => climb(BUILDINGS[b].cost[r], COST_GROWTH, COST_GROWTH2, level - 1))
export const buildTime = (s: State, b: BuildingId, level: number) =>
  Math.round(climb(BUILDINGS[b].time, TIME_GROWTH, TIME_GROWTH2, level - 1) * cutOf(s, 'build')) * 1000
export const capAt = (vaultLevel: number) => grow(BASE_CAP, CAP_GROWTH, vaultLevel)
export const storage = (s: State) => Math.round(capAt(s.levels.tangBaoCac) * (1 + bonus(s, 'storage')))
// Kho bảo hộ mỗi loại (phần không bị cướp): phần sức chứa kho tăng theo tầng Tàng Bảo Các
export const protectOf = (s: State) => Math.floor(storage(s) * (PROTECT + PROTECT_STEP * s.levels.tangBaoCac))
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
// Linh khí tự nhiên (BASE_RATE, cùng tăng ích) chảy thẳng vào kho; phần còn lại của rate là sản lượng công trình, chờ chạm thu
export const wildRate = (s: State, r: Res) => Math.round(BASE_RATE * (1 + bonus(s, 'prod') + bonus(s, `prod.${r}`)))
export const yardOf = (s: State, r: Res) => Math.floor((s.yard?.[r] ?? 0) / HOUR)

// Tốc của một đội trên bản đồ Giới: hệ chậm nhất có mặt (đội trống: 1)
// Tốc cả đội = hệ chậm nhất; hệ đệ tử đặc trưng của tông môn s (DAO_UNITS.speed) nhanh hơn. Đội rỗng: 1.15
export function armySpeed(a: Army, s?: State) {
  const d = daoUnit(s)
  const v = UNITS.filter(u => (a[u] ?? 0) > 0).map(u => {
    const t = unitOf(u).type
    return UNIT_SPEED[t] * (d?.type === t ? 1 + (d.speed ?? 0) : 1)
  })
  return v.length ? Math.min(...v) : 1.15
}
// Đệ tử đặc trưng của tông môn (đạo thống đang theo), nếu có
export const daoUnit = (s?: State) => (s?.dao ? DAO_UNITS[s.dao.id] : undefined)
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
export const techTime = (s: State, t: TechId, level: number) =>
  Math.round(grow(TECHS[t].time, TECH_TIME_GROWTH, level - 1) * cutOf(s, 'study')) * 1000
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
// Thế lực theo nguồn (bảng Thế lực ở HUD); power cộng đúng thứ tự này nên số không đổi
export function powerParts(s: State) {
  const out = away(s)
  return {
    build: IDS.reduce((sum, id) => sum + (BUILDINGS[id].power * s.levels[id] * (s.levels[id] + 1)) / 2, 0),
    troops: UNITS.reduce((sum, u) => sum + TIER[unitOf(u).tier].power * (s.troops[u] + out[u]), 0),
    tech: techSum(s) * 30,
    gear: gearSum(s) * 25,
    elders: ELDER_IDS.reduce((sum, e) => sum + (s.elders[e] === undefined ? 0 : elderLevel(s.elders[e]) * 50), 0),
  }
}
export function power(s: State) {
  const p = powerParts(s)
  return p.build + p.troops + p.tech + p.gear + p.elders
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
    (MARCH_CAP + MARCH_CAP_STEP * (elderLevel(s.elders[e]) - 1)) *
      (1 + MARCH_CAP_STAR * ((s.stars?.[e] ?? 1) - 1)) *
      (1 + lead(s, e, 'cap')), // Khuếch Trận Kỳ, thiên phú Công mạch
  )
// Phó trưởng lão đi cùng chủ tướng e lúc này: đã ghép, đã mở (Chủ điện), đang ở nhà (không dẫn / không làm phó đội khác)
export function deputyOf(s: State, e: ElderId | null): ElderId | undefined {
  const d = e ? s.pairs?.[e] : undefined
  return d && d !== e && s.levels.chuDien >= DEPUTY_HALL && s.elders[d] !== undefined && !isMarching(s, d)
    ? d
    : undefined
}
// Hành lực lúc t (chưa từng dùng: đầy)
// quá AP_MAX (nhờ Hành Lực Đan) thì không hồi thêm, tiêu dần xuống
export const apOf = (s: State, t: number) =>
  !s.ap
    ? AP_MAX
    : s.ap.n >= AP_MAX
      ? s.ap.n
      : Math.min(AP_MAX, s.ap.n + Math.floor(Math.max(0, t - s.ap.at) / AP_EVERY))
// Tiêu n hành lực lúc t (phần lẻ chưa đủ một lượt hồi vẫn giữ: mốc tính từ lúc hồi gần nhất)
export function spendAp(s: State, t: number, n: number): State {
  const have = apOf(s, t)
  const at = have >= AP_MAX || !s.ap ? t : s.ap.at + Math.floor((t - s.ap.at) / AP_EVERY) * AP_EVERY
  return { ...s, ap: { n: have - n, at } }
}
// Tự vận hành (G8): bật tự chữa thì thương binh tự vào đợt chữa khi Đan phòng rảnh và đủ tài nguyên (không thì chờ như thường)
export function autoHeal(s: State): State {
  if (!s.auto?.heal || s.heal || !s.levels.danPhong || !count(s.wounded)) return s
  const c = healCost(s, s.wounded)
  if (!afford(s.res, c)) return s
  const hurt = { ...s.wounded }
  return {
    ...s,
    res: bag(r => s.res[r] - c[r]),
    heal: { troops: hurt, startAt: s.time, finishAt: s.time + healTime(s, hurt) },
  }
}
