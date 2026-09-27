// Thí Luyện Yêu Hoàng (Karuak Ceremony của RoK): trong lễ yeuHoang chọn độ khó một lần mỗi lượt, rồi đánh lần lượt TRIAL_GATES cửa bằng
// quân thật (thương binh về Đan phòng, tốn hành lực); cửa thứ 10, 20… là yêu tướng tinh anh. Trận có mầm của server: client chờ.
import { fight, type Side } from '../combat.ts'
import { no, ok, type Actions } from '../core/action.ts'
import { admit, armyError, giveExp, mob, pushReport, sideOf, snap, tierFor } from '../core/battle.ts'
import { festOpen } from '../core/fest.ts'
import { int, isElder, pickArmy } from '../core/parse.ts'
import { apOf, deputyOf, elderLevel, spendAp } from '../core/stats.ts'
import type { Army, State } from '../core/types.ts'
import { compact, minus, nextSeed, noGain } from '../core/util.ts'
import {
  MAIN_SHARE,
  TOWER_STR,
  TRIAL_AP,
  TRIAL_CRYSTAL,
  TRIAL_DIFF,
  TRIAL_ELITE,
  TRIAL_EXP,
  TRIAL_GATES,
  TRIAL_GROW,
  TYPES,
  UNITS,
  type ElderId,
} from '../data.ts'

export type TrialAction = { type: 'trialStart'; d: number } | { type: 'trialFight'; elder: ElderId; army: Army }

// Lượt đang mở của người này (đã chọn độ khó ở lượt lễ này); cửa thứ g có phải tinh anh
export const trialNow = (s: State) =>
  festOpen(s, 'yeuHoang', s.time) && s.trial?.key === s.fest.yeuHoang?.key ? s.trial : undefined
export const trialElite = (g: number) => g % 10 === 9
// Yêu tướng giữ cửa g ở độ khó d: hệ chính xoay vòng, mạnh dần
export function trialFoe(s: State, d: number, g: number): Side {
  const type = TYPES[g % TYPES.length]
  const parts = TYPES.map(x => [x, x === type ? MAIN_SHARE : (1 - MAIN_SHARE) / 2] as [(typeof TYPES)[number], number])
  const str = TOWER_STR * TRIAL_DIFF[d] * TRIAL_GROW ** g * (trialElite(g) ? TRIAL_ELITE : 1)
  return mob(str, tierFor(s.levels.chuDien), parts, 1 + g)
}

export const trialActions: Actions<TrialAction> = {
  trialStart: {
    pick: a => (int(0, TRIAL_DIFF.length - 1)(a.d) ? { type: 'trialStart', d: a.d as number } : null),
    run: (s, a) => {
      if (!festOpen(s, 'yeuHoang', s.time)) return no('locked')
      if (trialNow(s)) return no('claimed') // chọn rồi không đổi trong lượt
      return ok({ ...s, trial: { key: s.fest.yeuHoang!.key, d: a.d, gate: 0 } })
    },
  },
  trialFight: {
    pick: a => {
      const army = pickArmy(a.army)
      return army && isElder(a.elder) ? { type: 'trialFight', elder: a.elder, army } : null
    },
    run: (s, a) => {
      const tr = trialNow(s)
      if (!tr) return no('locked')
      if (tr.gate >= TRIAL_GATES) return no('max_level')
      const e = armyError(s, a.elder, a.army)
      if (e) return no(e)
      if (apOf(s, s.time) < TRIAL_AP) return no('not_enough')
      if (!s.seed) return ok(s) // mầm của server: client chờ kết quả
      const army = compact(a.army)
      const deputy = deputyOf(s, a.elder)
      const me = sideOf(s, a.elder, army, deputy)
      const foe = trialFoe(s, tr.d, tr.gate)
      const f = fight(me, foe, s.seed)
      const ids = UNITS.filter(u => (army[u] ?? 0) > 0)
      const left = f.rounds.at(-1)?.n[0] ?? ids.map(u => army[u]!)
      const hurt = Object.fromEntries(ids.map((u, k) => [u, army[u]! - left[k]])) as Army
      const { state, dead } = admit({ ...spendAp(s, s.time, TRIAL_AP), troops: minus(s.troops, hurt) }, hurt)
      const exp = f.win ? Math.round(TRIAL_EXP * TRIAL_DIFF[tr.d] * (1 + tr.gate / 10)) : 0
      let st = pushReport(
        { ...state, seed: nextSeed(s.seed) },
        {
          at: s.time,
          kind: 'trial',
          i: tr.gate,
          win: f.win,
          hurt,
          dead,
          gain: { ...noGain(), exp },
          fights: [
            {
              a: snap(me, a.elder, elderLevel(s.elders[a.elder]), deputy),
              b: snap(foe, undefined, 1 + tr.gate),
              rounds: f.rounds,
            },
          ],
        },
      )
      if (!f.win) return ok(st)
      st = giveExp(st, a.elder, exp)
      return ok({
        ...st,
        stats: { ...st.stats, trial: (st.stats.trial ?? 0) + 1 + tr.d }, // điểm Thí Luyện: độ khó càng cao càng nhiều
        trial: { ...tr, gate: tr.gate + 1 },
        ...(st.seasonAt !== undefined && { ctechGot: (st.ctechGot ?? 0) + TRIAL_CRYSTAL * (1 + tr.d) }), // linh tinh mùa
      })
    },
  },
}
