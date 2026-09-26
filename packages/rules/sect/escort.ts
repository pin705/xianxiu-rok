// Áp Tiêu Hộ Hàng (Protect the Supplies của RoK — doc 5 D12): trong lễ kiểu 'escort', mỗi lượt tốn hành lực, chọn độ khó (sao, mở dần
// theo lượt tốt nhất), đội ảo (trưởng lão + đệ tử đang ở nhà — không mất quân thật) hộ tống xe hàng qua các đợt phục kích. Quân không hồi
// giữa các đợt; thua một đợt thì xe hàng mất tới `hit` % theo phần giặc còn sống (hết quân hộ tống: mất trọn `hit`). Còn hàng là tới
// làng: điểm = sao × 100 + % hàng còn, giữ lượt tốt nhất (fest.sp[0]). Trận có mầm bí mật nên client chờ server (chiến báo 'escort').
import { fight, might, type Side } from '../combat.ts'
import { no, ok, type Actions } from '../core/action.ts'
import { armyError, capArmy, mob, pushReport, sideOf, snap, tierFor } from '../core/battle.ts'
import { festOpen, FEST_IDS } from '../core/fest.ts'
import { int, isElder, oneOf, pickArmy } from '../core/parse.ts'
import { apOf, deputyOf, elderLevel, spendAp } from '../core/stats.ts'
import type { Army, Err, State } from '../core/types.ts'
import { compact, count, nextSeed, noGain } from '../core/util.ts'
import { FESTS, MAIN_SHARE, TYPES, UNITS, type ElderId, type FestId } from '../data.ts'

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
export const escortBest = (s: State, id: FestId) => s.fest[id]?.sp?.[0] ?? 0
// sao cao nhất được chọn: qua sao n (điểm n × 100 + % hàng, tức n × 100 + 1 … (n + 1) × 100) thì mở sao n + 1
export function escortTop(s: State, id: FestId) {
  const d = FESTS[id]
  return d.kind === 'escort' ? Math.min(d.lv, Math.max(1, Math.ceil(escortBest(s, id) / 100))) : 0
}
export function escortError(s: State, id: FestId, lv: number, elder: ElderId, army: Army): Err | null {
  const d = FESTS[id]
  if (d.kind !== 'escort' || !festOpen(s, id, s.time)) return 'locked'
  if (lv > escortTop(s, id)) return 'locked'
  if (apOf(s, s.time) < d.cost) return 'limit'
  return armyError(s, elder, army)
}
// Toán phục kích đợt k: lực chiến = hệ số đợt × lực chiến đội đầy của trưởng lão dẫn (mọi đệ tử ở nhà, như Đạo Tặc — mang thiếu quân
// thì khó hơn) × độ khó; hệ chính xoay vòng kiếm → pháp → thể
function ambush(s: State, base: number, share: number, k: number): Side {
  const tier = tierFor(s.levels.chuDien)
  const parts = TYPES.map(
    x => [x, x === TYPES[k % 3] ? MAIN_SHARE : (1 - MAIN_SHARE) / 2] as [(typeof TYPES)[number], number],
  )
  const unit = might(mob(1000, tier, parts))
  return mob(unit ? (1000 * base * share) / unit : 0, tier, parts)
}

export type EscortAction = { type: 'escort'; id: FestId; lv: number; elder: ElderId; army: Army }
export const escortActions: Actions<EscortAction> = {
  escort: {
    pick: a => {
      const army = pickArmy(a.army)
      return oneOf(FEST_IDS)(a.id) && int(1, 9)(a.lv) && isElder(a.elder) && army
        ? { type: 'escort', id: a.id, lv: a.lv as number, elder: a.elder, army }
        : null
    },
    run: (s, a) => {
      const e = escortError(s, a.id, a.lv, a.elder, a.army)
      if (e) return no(e)
      const d = FESTS[a.id]
      if (!s.seed || d.kind !== 'escort') return ok(s)
      const deputy = deputyOf(s, a.elder)
      let army = compact(a.army)
      const full = capArmy(s, a.elder, compact(s.troops))
      const base = might(sideOf(s, a.elder, full, deputy)) * (1 + d.step * (a.lv - 1))
      const ids = UNITS.filter(u => (army[u] ?? 0) > 0)
      let hp = 100,
        seed = s.seed
      const fights = []
      for (const [k, share] of d.waves.entries()) {
        if (!count(army)) {
          hp -= d.hit // hết quân hộ tống: xe hàng tự chịu đợt này
          continue
        }
        const me = sideOf(s, a.elder, army, deputy)
        const foe = ambush(s, base, share, k)
        const f = fight(me, foe, seed)
        seed = nextSeed(seed)
        fights.push({
          a: snap(me, a.elder, elderLevel(s.elders[a.elder]), deputy),
          b: snap(foe, undefined, a.lv),
          rounds: f.rounds,
        })
        const end = f.rounds.at(-1)?.n
        const left = end?.[0] ?? ids.map(u => army[u]!)
        army = compact(Object.fromEntries(ids.map((u, i) => [u, left[i]])) as Army)
        // giặc còn sống cướp hàng: mất tới `hit` % theo phần toán phục kích còn lại
        const rest = sum(end?.[1] ?? []) / Math.max(1, sum(foe.troops.map(x => x.n)))
        hp -= Math.round(d.hit * (f.win ? 0 : rest))
      }
      hp = Math.max(0, hp)
      const score = hp > 0 ? a.lv * 100 + hp : 0
      const f = s.fest[a.id]!
      const st = pushReport(
        { ...spendAp(s, s.time, d.cost), seed },
        { at: s.time, kind: 'escort', i: a.lv, win: hp > 0, hurt: {}, dead: {}, gain: noGain(), fights },
      )
      const sp = [Math.max(escortBest(s, a.id), score), hp, a.lv]
      return ok({ ...st, fest: { ...st.fest, [a.id]: { ...f, sp } } })
    },
  },
}
