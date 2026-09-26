// Dạ Hành Đạo Tặc (Thief in the Night của RoK): trong lễ daTac mỗi ngày THIEF_TRIES lượt đánh đạo tặc bằng đội ảo (không mất quân,
// trưởng lão không cần rảnh), tối đa 10 hiệp. Đạo tặc mạnh gấp THIEF_K đội đầy trận dung của trưởng lão dẫn đội — sát thương (phần
// nghìn lực chiến đạo tặc mất) đo độ tinh của đội: hệ khắc, công pháp, trưởng lão. Kỷ lục cả lượt lên bảng xếp hạng (FEST_RANKED),
// sát thương cao nhất hôm nay mở rương ngày theo mốc. Trận có mầm của server: client chờ.
import { fight, might, type Side } from '../combat.ts'
import { no, ok, type Actions } from '../core/action.ts'
import { capArmy, mob, pushReport, sideOf, snap, tierFor } from '../core/battle.ts'
import { dayOf } from '../core/calendar.ts'
import { festOpen } from '../core/fest.ts'
import { isElder, pickArmy } from '../core/parse.ts'
import { deputyOf, elderLevel } from '../core/stats.ts'
import type { Army, State } from '../core/types.ts'
import { compact, nextSeed, noGain } from '../core/util.ts'
import { FESTS, MAIN_SHARE, THIEF_K, THIEF_TRIES, TYPES, UNITS, type ElderId } from '../data.ts'

export type ThiefAction = { type: 'thief'; elder: ElderId; army: Army }

// Lượt còn hôm nay (days: số lượt đã đánh ở ngày last), sát thương cao nhất hôm nay (sp theo ngày của khung), kỷ lục (bank)
export function thiefNow(s: State) {
  const f = s.fest.daTac
  const used = f && f.last === dayOf(s.time) ? f.days : 0
  return { left: THIEF_TRIES - used, best: f?.sp?.[f.stage] ?? 0, record: f?.bank ?? 0 }
}
// Đạo tặc ứng với trưởng lão dẫn đội: mạnh gấp THIEF_K đội đầy trận dung (mọi đệ tử ở nhà) của người đó; hệ chính đổi theo ngày
export function thiefFoe(s: State, elder: ElderId): Side {
  const full = capArmy(s, elder, compact(s.troops))
  const aim = THIEF_K * Math.max(1, might(sideOf(s, elder, full, deputyOf(s, elder))))
  const type = TYPES[dayOf(s.time) % TYPES.length]
  const parts = TYPES.map(x => [x, x === type ? MAIN_SHARE : (1 - MAIN_SHARE) / 2] as [(typeof TYPES)[number], number])
  const tier = tierFor(s.levels.chuDien)
  return mob((1000 * aim) / Math.max(1, might(mob(1000, tier, parts))), tier, parts, s.levels.chuDien)
}

export const thiefActions: Actions<ThiefAction> = {
  thief: {
    pick: a => {
      const army = pickArmy(a.army)
      return army && isElder(a.elder) ? { type: 'thief', elder: a.elder, army } : null
    },
    run: (s, a) => {
      if (FESTS.daTac.kind !== 'thief' || !festOpen(s, 'daTac', s.time)) return no('locked')
      if (s.elders[a.elder] === undefined) return no('bad')
      const army = compact(a.army)
      if (!UNITS.some(u => (army[u] ?? 0) > 0) || UNITS.some(u => (army[u] ?? 0) > s.troops[u])) return no('not_enough')
      const now = thiefNow(s)
      if (now.left <= 0) return no('limit')
      if (!s.seed) return ok(s) // mầm của server: client chờ kết quả
      const deputy = deputyOf(s, a.elder)
      const me = sideOf(s, a.elder, army, deputy)
      const foe = thiefFoe(s, a.elder)
      const f = fight(me, foe, s.seed)
      const left = f.rounds.at(-1)?.n[1] ?? foe.troops.map(t => t.n)
      const pm = Math.round(
        1000 * (1 - might({ ...foe, troops: foe.troops.map((t, k) => ({ ...t, n: left[k] })) }) / might(foe)),
      )
      const fest = s.fest.daTac!
      const sp = [...Array(fest.stage + 1)].map((_, k) => fest.sp?.[k] ?? 0)
      sp[fest.stage] = Math.max(sp[fest.stage], pm)
      const next = {
        ...fest,
        days: 1 + (THIEF_TRIES - now.left),
        last: dayOf(s.time),
        sp,
        bank: Math.max(fest.bank, pm),
      }
      const st = pushReport(
        { ...s, seed: nextSeed(s.seed), fest: { ...s.fest, daTac: next } },
        {
          at: s.time,
          kind: 'thief',
          i: pm,
          win: f.win,
          hurt: {},
          dead: {},
          gain: noGain(),
          fights: [
            {
              a: snap(me, a.elder, elderLevel(s.elders[a.elder]), deputy),
              b: snap(foe, undefined, 1),
              rounds: f.rounds,
            },
          ],
        },
      )
      return ok(st)
    },
  },
}
