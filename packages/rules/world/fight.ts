// Trận nhiều bên: phòng thủ nhà (trưởng lão giữ nhà, Hộ Sơn Đại Trận), dò thám, gộp / tách đội, sức mang.
import { fight, type Side, type Round } from '../combat.ts'
import { sideOf, chance } from '../core/battle.ts'
import { elderLevel, unitOf, isMarching } from '../core/stats.ts'
import { type Army, type March, type State } from '../core/types.ts'
import { CARRY, GUARD_STEP, TIER, UNITS, type ElderId } from '../data.ts'
import { compact } from '../core/util.ts'

// Trưởng lão giữ nhà chỉ tính khi đang ở tông môn
export const guardOf = (s: State) =>
  s.guard && s.elders[s.guard] !== undefined && !isMarching(s, s.guard) ? s.guard : null

// Bên thủ: mọi đệ tử đang ở nhà, trưởng lão giữ nhà dẫn (không có thì chỉ bonus tông môn), Hộ Sơn Đại Trận thêm thủ và máu
export function defense(s: State): Side {
  const side = sideOf(s, guardOf(s), compact(s.troops))
  const k = 1 + GUARD_STEP * s.levels.hoSonDaiTran
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
  UNITS.reduce((sum, u) => sum + (army[u] ?? 0) * CARRY * TIER[unitOf(u).tier].stat, 0)
// Gộp nhiều đội thành một bên (quân đóng ở điểm, kết trận): nối các nhóm quân; công pháp và hành của đội đầu
// at[j]: nhóm quân đầu tiên của đội j trong bên gộp
export function combine(parts: Side[]): { side: Side; at: number[] } {
  const at: number[] = []
  let k = 0
  for (const p of parts) {
    at.push(k)
    k += p.troops.length
  }
  return { side: { troops: parts.flatMap(p => p.troops), skill: parts[0]?.skill, el: parts[0]?.el }, at }
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
  return chance(seed => fight(sideOf(s, elder, army), foe, seed).win)
}

// Trận nhìn từ phía bên kia (chiến báo của bên thủ)
export const flipRounds = (rounds: Round[]): Round[] =>
  rounds.map(r => ({ n: [r.n[1], r.n[0]], cast: [r.cast[1], r.cast[0]] }))
