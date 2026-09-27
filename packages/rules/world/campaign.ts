// Viễn Chinh (Expedition của RoK): chuỗi VC_STAGES màn đánh bằng đội hình Luận Kiếm Đài (đệ tử ảo — không mất quân), mỗi màn một đạo quân
// dựng sẵn; các đội của mình đánh xa luân (đội sau vào khi đội trước ngã hay hết lượt). Trận tất định (mầm cố định từng màn) nên client tính
// ngay kết quả. Sao, Huân Chương Viễn Chinh, rương ngày theo tổng sao, cửa hàng huân chương.
import { fight, type Side } from '../combat.ts'
import { no } from '../core/action.ts'
import { grant, mob } from '../core/battle.ts'
import { dayOf, weekOf } from '../core/calendar.ts'
import { int } from '../core/parse.ts'
import type { State } from '../core/types.ts'
import { addItems } from '../core/util.ts'
import {
  MAIN_SHARE,
  TYPES,
  VC_BOSS,
  VC_BOSS_EVERY,
  VC_BOSS_GIFT,
  VC_CHEST,
  VC_CHEST_GIFT,
  VC_FIRST,
  VC_GROW,
  VC_HALL,
  VC_KEEP,
  VC_MEDAL,
  VC_SHOP,
  VC_STAGES,
  VC_STR,
  VC_TEAMS,
} from '../data.ts'
import { arenaSide, lineupOf } from '../sect/arena.ts'
import type { WorldActions } from './base.ts'

const bits = (x: number) => (x & 1) + ((x >> 1) & 1) + ((x >> 2) & 1)
const vcOf = (s: State) => s.vc ?? { stars: [], medals: 0, spent: 0, chest: -1 }
export const vcStars = (s: State) => vcOf(s).stars.reduce((n, x) => n + bits(x), 0)
export const vcMedals = (s: State) => vcOf(s).medals - vcOf(s).spent
export const vcTeams = (k: number) => VC_TEAMS.filter(x => k >= x).length
export const vcBoss = (k: number) => k % VC_BOSS_EVERY === VC_BOSS_EVERY - 1
// Màn mở chưa: màn đầu, hay màn trước đã thắng
export const vcOpen = (s: State, k: number) => k === 0 || (vcOf(s).stars[k - 1] ?? 0) & 1
export const vcChestTier = (s: State) => VC_CHEST.filter(n => vcStars(s) >= n).length
export const vcBought = (s: State, t: number) => (vcOf(s).week === weekOf(t) ? (vcOf(s).n ?? []) : [])

// Đạo quân màn k: hệ xoay vòng, sức tăng theo màn; thủ lĩnh mạnh hơn, có công pháp
export function vcFoe(k: number): Side {
  const type = TYPES[k % TYPES.length]
  const parts = TYPES.map(x => [x, x === type ? MAIN_SHARE : (1 - MAIN_SHARE) / 2] as [(typeof TYPES)[number], number])
  const boss = vcBoss(k)
  return mob(
    VC_STR * VC_GROW ** k * (boss ? VC_BOSS : 1),
    3,
    parts,
    1 + k,
    boss ? { kind: 'burst', v: 0.8 } : undefined,
  )
}
// Một lượt màn k: các đội mang theo đánh xa luân; trả thắng không, phần quân còn, sao (bit 1 thắng · 2 còn ≥ VC_KEEP quân · 4 không đội ngã)
export function vcRun(s: State, k: number) {
  const teams = lineupOf(s)
    .slice(0, vcTeams(k))
    .map(t => arenaSide(s, t))
  const count = (x: Side) => x.troops.reduce((n, t) => n + t.n, 0)
  const full = teams.reduce((n, x) => n + count(x), 0)
  let foe = vcFoe(k),
    left = full,
    fallen = 0,
    win = false
  for (const [j, me] of teams.entries()) {
    const f = fight(me, foe, (9001 + k * 131 + j * 7919) >>> 0)
    const last = f.rounds.at(-1)?.n ?? [me.troops.map(t => t.n), foe.troops.map(t => t.n)]
    const mine = last[0].reduce((a, b) => a + b, 0)
    left -= count(me) - mine
    if (!mine) fallen++
    foe = { ...foe, troops: foe.troops.map((t, g) => ({ ...t, n: last[1][g] })) }
    if (!last[1].some(n => n > 0)) {
      win = true
      break
    }
  }
  const keep = full ? left / full : 0
  const star = win ? 1 | (keep >= VC_KEEP ? 2 : 0) | (fallen ? 0 : 4) : 0
  return { win, keep, star, teams: teams.length }
}

export type CampaignAction = { type: 'vcFight'; k: number } | { type: 'vcChest' } | { type: 'vcBuy'; i: number }
export const campaignActions: WorldActions<CampaignAction> = {
  vcFight: {
    pick: a => (int(0, VC_STAGES - 1)(a.k) ? { type: 'vcFight', k: a.k as number } : null),
    run: ({ w, pid, s }, a) => {
      if (s.levels.chuDien < VC_HALL || !lineupOf(s).length || !vcOpen(s, a.k)) return no('locked')
      const v = vcOf(s)
      const { star } = vcRun(s, a.k)
      const old = v.stars[a.k] ?? 0,
        fresh = star & ~old
      if (!fresh) return no('claimed') // không có sao mới (kết quả vẫn xem được ở client)
      const first = fresh & 1
      const medals = v.medals + bits(fresh) * VC_MEDAL + (first ? VC_FIRST : 0)
      const stars = Array.from(
        { length: Math.max(v.stars.length, a.k + 1) },
        (_, i) => (v.stars[i] ?? 0) | (i === a.k ? star : 0),
      )
      const me = first && vcBoss(a.k) ? grant(s, VC_BOSS_GIFT) : s // thủ lĩnh qua lần đầu: thêm quà
      return { ok: true, world: w, changed: new Map([[pid, { ...me, vc: { ...v, stars, medals } }]]) }
    },
  },
  vcChest: {
    pick: () => ({ type: 'vcChest' }),
    run: ({ w, pid, s }) => {
      const v = vcOf(s),
        tier = vcChestTier(s)
      if (!tier) return no('locked')
      if (v.chest === dayOf(s.time)) return no('claimed')
      return {
        ok: true,
        world: w,
        changed: new Map([[pid, { ...grant(s, VC_CHEST_GIFT[tier - 1]), vc: { ...v, chest: dayOf(s.time) } }]]),
      }
    },
  },
  vcBuy: {
    pick: a => (int(0, VC_SHOP.length - 1)(a.i) ? { type: 'vcBuy', i: a.i as number } : null),
    run: ({ w, pid, s }, a) => {
      const g = VC_SHOP[a.i],
        v = vcOf(s)
      const n = vcBought(s, s.time)
      if ((n[a.i] ?? 0) >= g.week) return no('limit')
      if (vcMedals(s) < g.price) return no('not_enough')
      const next = VC_SHOP.map((_, i) => (n[i] ?? 0) + (i === a.i ? 1 : 0))
      const items = addItems(s.items, { [g.item]: g.n })
      return {
        ok: true,
        world: w,
        changed: new Map([
          [pid, { ...s, items, vc: { ...v, spent: v.spent + g.price, week: weekOf(s.time), n: next } }],
        ]),
      }
    },
  },
}
