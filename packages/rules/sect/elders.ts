// Trưởng lão: Bồi Nguyên Đan (kinh nghiệm), thiên phú, Tẩy Tủy Đan, giữ nhà.
import { isMarching, no, ok, use, type Actions } from '../core/action.ts'
import { giveExp } from '../core/battle.ts'
import { int, isElder } from '../core/parse.ts'
import { talentPoints, talentUsed } from '../core/stats.ts'
import { type Talent } from '../core/types.ts'
import { BOI_NGUYEN_EXP, TALENT_MAX, type ElderId } from '../data.ts'

export type ElderAction =
  | { type: 'feed'; elder: ElderId; n: number }
  | { type: 'talent'; elder: ElderId; branch: 0 | 1 | 2 }
  | { type: 'wash'; elder: ElderId } // Tẩy Tủy Đan
  | { type: 'guard'; elder: ElderId | null } // trưởng lão giữ nhà

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
}
