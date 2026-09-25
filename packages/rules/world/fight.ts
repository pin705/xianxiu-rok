// Trận nhiều bên: phòng thủ nhà (trưởng lão giữ nhà, Hộ Sơn Đại Trận), dò thám, gộp / tách đội, sức mang; điều kiện cướp.
import { fight, type Side, type Round } from '../combat.ts'
import { sideOf, chance } from '../core/battle.ts'
import { deputyOf, elderLevel, unitOf, isMarching, power } from '../core/stats.ts'
import { type Army, type Err, type March, type State } from '../core/types.ts'
import { CARRY, GUARD_STEP, PVP_FLOOR, PVP_HALL, REVENGE_TIME, TIER, UNIT_CARRY, UNITS, type ElderId } from '../data.ts'
import { compact } from '../core/util.ts'
import { allyOf, farErr, napBetween, raidPath, type MapCtx, type World } from './base.ts'

// Trưởng lão giữ nhà chỉ tính khi đang ở tông môn
export const guardOf = (s: State) =>
  s.guard && s.elders[s.guard] !== undefined && !isMarching(s, s.guard) ? s.guard : null

// Bên thủ: mọi đệ tử đang ở nhà, trưởng lão giữ nhà dẫn (không có thì chỉ bonus tông môn), Hộ Sơn Đại Trận thêm thủ và máu
export function defense(s: State): Side {
  const g = guardOf(s)
  const side = sideOf(s, g, compact(s.troops), deputyOf(s, g))
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
