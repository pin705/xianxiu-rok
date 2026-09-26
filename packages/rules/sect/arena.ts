// Luận Kiếm Đài (Sunset Canyon của RoK, bất đồng bộ): đội hình thủ của mình, rương ngày theo bậc điểm, và luật trận xa luân
// (dùng chung cho thao tác đánh ở world/arena.ts và ước lượng trên giao diện). Không mất quân, không mất tài nguyên.
import { fight, rng, type Fight, type Side } from '../combat.ts'
import { no, ok, use, type Actions } from '../core/action.ts'
import { grant, sideOf } from '../core/battle.ts'
import { dayOf, weekOf } from '../core/calendar.ts'
import { int, isElder, obj, oneOf } from '../core/parse.ts'
import { elderLevel, marchSlots } from '../core/stats.ts'
import type { Arena, ArenaTeam, State } from '../core/types.ts'
import { ELDER_IDS } from '../core/util.ts'
import {
  ARENA_BANDS,
  ARENA_BASE,
  ARENA_CHEST,
  ARENA_STEP,
  ARENA_TIER,
  ARENA_UPPER,
  ARENA_UPPER_TIER,
  ARENA_TRIES,
  ELDERS,
  KY_CHEST,
  KY_SHOP,
  PVP_HALL,
  PVP_START,
  TYPES,
  type ElderId,
} from '../data.ts'

// Đài của mình lúc t: sang tuần thì điểm nén về giữa (như mùa của RoK), sang ngày thì đủ lượt lại
export function arenaOf(s: State, t: number): Arena {
  const week = weekOf(t),
    day = dayOf(t)
  const a = s.arena ?? { lineup: [], pts: PVP_START, week, day, left: ARENA_TRIES, chest: -1, log: [] }
  return {
    ...a,
    ...(a.week !== week && { week, pts: Math.round(PVP_START + (a.pts - PVP_START) / 2) }),
    ...(a.day !== day && { day, left: ARENA_TRIES }),
  }
}
// Bậc điểm: 0 Đồng · 1 Bạc · 2 Vàng · 3 Ngọc
export const arenaBand = (pts: number) => ARENA_BANDS.filter(p => pts >= p).length - 1
// Đội hình ra trận: đã xếp thì theo thứ tự đã xếp (bỏ trưởng lão không còn), chưa xếp thì các trưởng lão cấp cao nhất
// với hệ sở trường — đủ số đội xuất quân
export function lineupOf(s: State): ArenaTeam[] {
  const set = (s.arena?.lineup ?? []).filter(x => s.elders[x.elder] !== undefined)
  if (set.length) return set.slice(0, marchSlots(s))
  return ELDER_IDS.filter(e => s.elders[e] !== undefined)
    .sort((a, b) => (s.elders[b] ?? 0) - (s.elders[a] ?? 0))
    .slice(0, marchSlots(s))
    .map(e => ({ elder: e, type: ELDERS[e].type }))
}
// Một đội trên đài: đệ tử ảo bậc ARENA_TIER, chỉ tính sức của trưởng lão (bỏ công pháp tông môn, phù, Hương Hỏa, luân hồi)
const bare = (s: State): State => ({
  ...s,
  tech: {},
  rebirths: 0,
  buffs: [],
  vip: { ...s.vip, pts: 0 },
  dao: undefined,
})
export const arenaN = (s: State, e: ElderId) => ARENA_BASE + ARENA_STEP * elderLevel(s.elders[e])
// Thượng Tầng: từ Chủ điện ARENA_UPPER — đệ tử ảo bậc cao hơn, ghép và xếp hạng riêng
export const arenaUpper = (s?: State) => (s?.levels.chuDien ?? 0) >= ARENA_UPPER
export const arenaSide = (s: State, t: ArenaTeam): Side =>
  sideOf(bare(s), t.elder, { [`${t.type}${arenaUpper(s) ? ARENA_UPPER_TIER : ARENA_TIER}`]: arenaN(s, t.elder) })

// Trận xa luân: đội đầu hai bên đấu; bên thắng đi tiếp với quân còn lại, gặp đội kế của bên kia; hết lượt chưa phân thắng
// bại thì cả hai đội rút. Bên còn đội thắng; cả hai cùng hết (hay cùng còn) thì so phần quân còn, bằng nhau bên thủ thắng.
export type Bout = { a: number; d: number; sa: Side; sd: Side; f: Fight } // sa, sd: hai đội lúc vào cặp này
export function duel(att: Side[], def: Side[], seed: number): { win: boolean; bouts: Bout[] } {
  const A = att.map(x => ({ ...x })),
    D = def.map(x => ({ ...x }))
  const total = (xs: Side[]) => xs.reduce((sum, x) => sum + x.troops.reduce((k, t) => k + t.n, 0), 0)
  const full = [total(att) || 1, total(def) || 1]
  const rand = rng(seed)
  const bouts: Bout[] = []
  let i = 0,
    j = 0
  while (i < A.length && j < D.length) {
    const f = fight(A[i], D[j], Math.floor(rand() * 2 ** 31))
    bouts.push({ a: i, d: j, sa: A[i], sd: D[j], f })
    const last = f.rounds.at(-1)?.n ?? [A[i].troops.map(t => t.n), D[j].troops.map(t => t.n)]
    const up = [last[0].some(n => n > 0), last[1].some(n => n > 0)]
    A[i] = { ...A[i], troops: A[i].troops.map((t, k) => ({ ...t, n: last[0][k] })) }
    D[j] = { ...D[j], troops: D[j].troops.map((t, k) => ({ ...t, n: last[1][k] })) }
    if (!up[0] || up[1]) i++ // thua, hoặc hết lượt chưa phân thắng bại: cả hai rút
    if (!up[1] || up[0]) j++
  }
  const left = [total(A.slice(i)) / full[0], total(D.slice(j)) / full[1]]
  return { win: left[0] > left[1], bouts }
}

export type ArenaAction =
  | { type: 'arenaSet'; lineup: ArenaTeam[] }
  | { type: 'arenaChest' }
  | { type: 'arenaBuy'; i: number }
  | { type: 'arenaTicket' } // dùng một Luận Kiếm Lệnh: +1 lượt hôm nay

const isType = oneOf(TYPES)
export const arenaActions: Actions<ArenaAction> = {
  arenaTicket: {
    pick: () => ({ type: 'arenaTicket' }),
    run: s => {
      if ((s.items.luanKiem ?? 0) < 1) return no('no_item')
      const a = arenaOf(s, s.time)
      return ok({ ...s, items: use(s, 'luanKiem', 1), arena: { ...a, left: a.left + 1 } })
    },
  },
  arenaSet: {
    pick: a => {
      if (!Array.isArray(a.lineup) || a.lineup.length > 5) return null
      const lineup = a.lineup.filter(obj).map(x => ({ elder: x.elder, type: x.type }))
      const valid = lineup.every(x => isElder(x.elder) && isType(x.type))
      return valid && lineup.length === a.lineup.length && new Set(lineup.map(x => x.elder)).size === lineup.length
        ? { type: 'arenaSet', lineup: lineup as ArenaTeam[] }
        : null
    },
    run: (s, a) => {
      if (s.levels.chuDien < PVP_HALL) return no('locked')
      if (a.lineup.length > marchSlots(s)) return no('slots')
      if (a.lineup.some(x => s.elders[x.elder] === undefined)) return no('locked')
      return { ok: true, state: { ...s, arena: { ...arenaOf(s, s.time), lineup: a.lineup } } }
    },
  },
  arenaChest: {
    pick: () => ({ type: 'arenaChest' }),
    run: s => {
      if (s.levels.chuDien < PVP_HALL) return no('locked')
      const a = arenaOf(s, s.time)
      if (a.chest === a.day) return no('claimed')
      const band = arenaBand(a.pts)
      return {
        ok: true,
        state: grant({ ...s, arena: { ...a, chest: a.day, ky: (a.ky ?? 0) + KY_CHEST[band] } }, ARENA_CHEST[band]),
      }
    },
  },
  // Luận Kiếm Thương Điếm: đổi Kiếm Ý lấy vật phẩm, mỗi món có hạn mỗi tuần
  arenaBuy: {
    pick: a => (int(0, KY_SHOP.length - 1)(a.i) ? { type: 'arenaBuy', i: a.i } : null),
    run: (s, a) => {
      if (s.levels.chuDien < PVP_HALL) return no('locked')
      const ar = arenaOf(s, s.time)
      const g = KY_SHOP[a.i]
      const n = kyBought(s, s.time)
      if (n[a.i] >= g.week) return no('limit')
      if ((ar.ky ?? 0) < g.price) return no('not_enough')
      const buys = { week: ar.week, n: n.map((x, k) => (k === a.i ? x + 1 : x)) }
      return {
        ok: true,
        state: {
          ...s,
          items: { ...s.items, [g.item]: (s.items[g.item] ?? 0) + g.n },
          arena: { ...ar, ky: ar.ky! - g.price, buys },
        },
      }
    },
  },
}
// Số đã mua mỗi món của Thương Điếm trong tuần của lúc t
export const kyBought = (s: State, t: number) => {
  const b = s.arena?.buys
  return b && b.week === weekOf(t) ? b.n : KY_SHOP.map(() => 0)
}
