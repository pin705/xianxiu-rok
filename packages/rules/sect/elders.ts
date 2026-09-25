// Trưởng lão: Bồi Nguyên Đan (kinh nghiệm), thiên phú, Tẩy Tủy Đan, giữ nhà, ghép phó trưởng lão.
import { no, ok, use, type Actions } from '../core/action.ts'
import { giveExp } from '../core/battle.ts'
import { int, isElder, oneOf } from '../core/parse.ts'
import { talentPoints, talentUsed, isMarching } from '../core/stats.ts'
import { type Talent } from '../core/types.ts'
import {
  STRAT_HALL,
  STRAT_IDS,
  type StratId,
  BOI_NGUYEN_EXP,
  DAO_COOL,
  DAO_HALL,
  DAO_IDS,
  DEPUTY_HALL,
  TALENT_MAX,
  type DaoId,
  type ElderId,
} from '../data.ts'

export type ElderAction =
  | { type: 'feed'; elder: ElderId; n: number }
  | { type: 'talent'; elder: ElderId; branch: 0 | 1 | 2 }
  | { type: 'wash'; elder: ElderId } // Tẩy Tủy Đan
  | { type: 'guard'; elder: ElderId | null } // trưởng lão giữ nhà
  | { type: 'pair'; elder: ElderId; deputy: ElderId | null } // phó trưởng lão của chủ tướng elder (null: bỏ ghép)
  | { type: 'dao'; id: DaoId } // theo đạo thống (lần đầu miễn phí, đổi lại sau DAO_COOL)
  | { type: 'strat'; id: StratId } // chiến lược mùa (một lần mỗi mùa)

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
      isElder(a.elder) && int(0, 2)(a.branch)
        ? { type: 'talent', elder: a.elder, branch: a.branch as 0 | 1 | 2 }
        : null,
    run: (s, a) => {
      if (s.elders[a.elder] === undefined) return no('locked')
      if (isMarching(s, a.elder)) return no('busy')
      const cur = s.talents[a.elder] ?? [0, 0, 0]
      if (cur[a.branch] >= TALENT_MAX) return no('max_level')
      if (talentUsed(s, a.elder) >= talentPoints(s, a.elder)) return no('not_enough')
      const next = cur.map((x, i) => (i === a.branch ? x + 1 : x)) as Talent
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
