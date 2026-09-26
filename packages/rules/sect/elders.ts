// Trưởng lão: Bồi Nguyên Đan (kinh nghiệm), thiên phú, Tẩy Tủy Đan, giữ nhà, ghép phó trưởng lão.
import { no, ok, use, type Actions } from '../core/action.ts'
import { giveExp } from '../core/battle.ts'
import { int, isElder, oneOf } from '../core/parse.ts'
import { talentPoints, talentUsed, isMarching, vipLevel } from '../core/stats.ts'
import { type Err, type State } from '../core/types.ts'
import {
  STRAT_HALL,
  STRAT_IDS,
  type StratId,
  BOI_NGUYEN_EXP,
  DAO_COOL,
  DAO_HALL,
  DAO_IDS,
  DEPUTY_HALL,
  FRAME_DUELS,
  FRAME_VIP,
  FRAMES,
  TALENT_NODES,
  TALENT_TIER,
  TALENT_TREE_SIZE,
  type DaoId,
  type ElderId,
  type FrameId,
} from '../data.ts'

export type ElderAction =
  | { type: 'feed'; elder: ElderId; n: number }
  | { type: 'talent'; elder: ElderId; node: number } // cộng một điểm vào nút thiên phú (TALENT_NODES)
  | { type: 'wash'; elder: ElderId } // Tẩy Tủy Đan
  | { type: 'guard'; elder: ElderId | null } // trưởng lão giữ nhà
  | { type: 'face'; elder: ElderId | null } // đổi chân dung: trưởng lão đã thu nhận (null: chân dung chưởng môn)
  | { type: 'frame'; id: FrameId } // đổi khung chân dung (đã mở)
  | { type: 'pair'; elder: ElderId; deputy: ElderId | null } // phó trưởng lão của chủ tướng elder (null: bỏ ghép)
  | { type: 'dao'; id: DaoId } // theo đạo thống (lần đầu miễn phí, đổi lại sau DAO_COOL)
  | { type: 'strat'; id: StratId } // chiến lược mùa (một lần mỗi mùa)

// Khung chân dung đã mở chưa: thường · Hương Hỏa FRAME_VIP · phi thăng · đệ nhất Công Huân · FRAME_DUELS trận Luận Kiếm thắng ·
// luân hồi
export function frameOpen(s: State, id: FrameId): boolean {
  if (id === 'vip') return vipLevel(s) >= FRAME_VIP
  if (id === 'ascend') return s.ascended.length > 0
  if (id === 'crown') return (s.crowns?.length ?? 0) > 0
  if (id === 'arena') return (s.stats.duelWins ?? 0) >= FRAME_DUELS
  return id === 'rebirth' ? s.rebirths > 0 : true
}

// Thiên phú: điểm đã cộng trong cây của nút i; nút i cộng được không (đủ điểm, chưa tối đa, tầng đã mở)
export const talentSpent = (s: State, e: ElderId, tree: number) =>
  (s.talents[e] ?? []).slice(tree * TALENT_TREE_SIZE, (tree + 1) * TALENT_TREE_SIZE).reduce((a, b) => a + b, 0)
export function talentError(s: State, e: ElderId, i: number): Err | null {
  const d = TALENT_NODES[i]
  if (!d || s.elders[e] === undefined) return 'locked'
  if (isMarching(s, e)) return 'busy'
  if ((s.talents[e]?.[i] ?? 0) >= d.max) return 'max_level'
  if (talentSpent(s, e, Math.floor(i / TALENT_TREE_SIZE)) < TALENT_TIER[d.tier]) return 'locked'
  return talentUsed(s, e) >= talentPoints(s, e) ? 'not_enough' : null
}
export const elderActions: Actions<ElderAction> = {
  feed: {
    pick: a => (isElder(a.elder) && int(1, 1e4)(a.n) ? { type: 'feed', elder: a.elder, n: a.n } : null),
    run: (s, a) => {
      if (s.elders[a.elder] === undefined) return no('locked')
      if (a.n > (s.items.boiNguyen ?? 0)) return no('no_item')
      return ok(giveExp({ ...s, items: use(s, 'boiNguyen', a.n) }, a.elder, BOI_NGUYEN_EXP * a.n))
    },
  },
  talent: {
    pick: a =>
      isElder(a.elder) && int(0, TALENT_NODES.length - 1)(a.node)
        ? { type: 'talent', elder: a.elder, node: a.node as number }
        : null,
    run: (s, a) => {
      const e = talentError(s, a.elder, a.node)
      if (e) return no(e)
      const cur = s.talents[a.elder] ?? TALENT_NODES.map(() => 0)
      const next = cur.map((x, i) => (i === a.node ? x + 1 : x))
      return ok({ ...s, talents: { ...s.talents, [a.elder]: next } })
    },
  },
  wash: {
    pick: a => (isElder(a.elder) ? { type: 'wash', elder: a.elder } : null),
    run: (s, a) => {
      if (!s.items.taiTuy) return no('no_item')
      if (!talentUsed(s, a.elder)) return no('empty')
      if (isMarching(s, a.elder)) return no('busy')
      const { [a.elder]: _, ...talents } = s.talents
      return ok({ ...s, items: use(s, 'taiTuy'), talents })
    },
  },
  guard: {
    pick: a => (a.elder === null || isElder(a.elder) ? { type: 'guard', elder: a.elder } : null),
    run: (s, a) => (a.elder && s.elders[a.elder] === undefined ? no('locked') : ok({ ...s, guard: a.elder })),
  },
  frame: {
    pick: a => (oneOf(FRAMES)(a.id) ? { type: 'frame', id: a.id } : null),
    run: (s, a) => (frameOpen(s, a.id) ? ok({ ...s, frame: a.id }) : no('locked')),
  },
  face: {
    pick: a => (a.elder === null || isElder(a.elder) ? { type: 'face', elder: a.elder } : null),
    run: (s, a) =>
      a.elder && s.elders[a.elder] === undefined ? no('locked') : ok({ ...s, face: a.elder ?? undefined }),
  },
  // Ghép có hiệu lực từ lần xuất quân sau (đội đang đi giữ phó cũ); một phó ghép được cho nhiều chủ tướng,
  // nhưng mỗi lúc chỉ đi cùng một đội
  pair: {
    pick: a =>
      isElder(a.elder) && (a.deputy === null || isElder(a.deputy))
        ? { type: 'pair', elder: a.elder, deputy: a.deputy }
        : null,
    run: (s, a) => {
      if (s.levels.chuDien < DEPUTY_HALL) return no('locked')
      if (s.elders[a.elder] === undefined || (a.deputy && s.elders[a.deputy] === undefined)) return no('locked')
      if (a.deputy === a.elder) return no('bad')
      const { [a.elder]: _, ...rest } = s.pairs ?? {}
      return ok({ ...s, pairs: a.deputy ? { ...rest, [a.elder]: a.deputy } : rest })
    },
  },
  strat: {
    pick: a => (oneOf(STRAT_IDS)(a.id) ? { type: 'strat', id: a.id } : null),
    run: (s, a) => {
      if (s.levels.chuDien < STRAT_HALL) return no('locked')
      if (s.strat) return no('claimed') // mỗi mùa một lần
      return ok({ ...s, strat: a.id })
    },
  },
  dao: {
    pick: a => (oneOf(DAO_IDS)(a.id) ? { type: 'dao', id: a.id } : null),
    run: (s, a) => {
      if (s.levels.chuDien < DAO_HALL) return no('locked')
      if (s.dao?.id === a.id) return no('claimed')
      if (s.dao && s.dao.at + DAO_COOL > s.time) return no('cooldown')
      return ok({ ...s, dao: { id: a.id, at: s.time } })
    },
  },
}
