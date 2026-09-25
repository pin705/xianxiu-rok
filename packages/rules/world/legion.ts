// Ma Triều Công Sơn (Shadow Legion của RoK): trưởng lão / minh chủ ghi danh tiên minh cả tuần; tối thứ Tư LEGION_WAVES đợt ma
// triều đánh vào tông môn từng người trong minh (server gọi legionStep mỗi nhịp, mỗi đợt giải đúng một lần). Sức địch theo lực
// phòng thủ của chính người bị đánh; viện binh đồng minh đang đóng ở nhà cùng thủ — giữ được thì điểm. Quân mất chỉ bị thương.
import { might, fight, type Side } from '../combat.ts'
import { no } from '../core/action.ts'
import { marchSide, mob, pushReport, snap, tierFor } from '../core/battle.ts'
import { weekOf } from '../core/calendar.ts'
import { elderLevel } from '../core/stats.ts'
import { advance } from '../core/time.ts'
import type { Army, State } from '../core/types.ts'
import { DAY, minus, noGain, plus } from '../core/util.ts'
import {
  DAY_OFFSET,
  HONOR_LEGION,
  LEGION_DAY,
  LEGION_GAP,
  LEGION_GIFTS,
  LEGION_HOUR,
  LEGION_POW,
  LEGION_PTS,
  LEGION_TOP,
  LEGION_WAVES,
  TYPES,
  UNITS,
} from '../data.ts'
import { mail } from '../sect/inbox.ts'
import { addHonor, aidAt, allyOf, type Legion, type Players, type World, type WorldActions } from './base.ts'
import { combine, defense, flipRounds, guardOf } from './fight.ts'

// Lúc đợt k (0..) của tuần wk giáng (thứ Tư LEGION_HOUR giờ VN + k × LEGION_GAP)
export const legionAt = (wk: number, k: number) =>
  (wk * 7 + 4 + LEGION_DAY) * DAY - DAY_OFFSET + LEGION_HOUR * 3_600_000 + k * LEGION_GAP
const fresh = (week: number): Legion => ({ week, signed: [], done: 0, pts: {}, by: {}, held: {} })
// Ma triều tuần của lúc t (sang tuần: bảng mới)
export const legionOf = (w: World, t: number): Legion => {
  const week = weekOf(t)
  return w.legion?.week === week ? w.legion : fresh(week)
}
// Tuần ghi danh / đang chờ lúc t: trước giờ đánh tuần này thì tuần này, qua rồi thì tuần sau; null — đang đánh dở
export function signWeek(w: World, t: number): number | null {
  const wk = weekOf(t)
  if (t < legionAt(wk, 0)) return wk
  const cur = w.legion
  return cur?.week === wk && cur.signed.length && cur.done < LEGION_WAVES ? null : wk + 1
}
// Đội ma triều sức ngang `target` lực chiến (ba hệ đều nhau), bậc theo tầng Chủ điện người bị đánh
export function legionSide(target: number, hall: number): Side {
  const tier = tierFor(hall)
  const parts = TYPES.map(t => [t, 1 / TYPES.length] as [(typeof TYPES)[number], number])
  const unit = might(mob(1000, tier, parts))
  return mob(unit ? (1000 * target) / unit : 0, tier, parts)
}

export type LegionAction = { type: 'legionSign' } | { type: 'legionUnsign' }
const officer = (w: World, pid: number) => {
  const al = allyOf(w, pid)
  return al && al.members[pid] >= 1 ? al : undefined
}
export const legionActions: WorldActions<LegionAction> = {
  legionSign: {
    pick: () => ({ type: 'legionSign' }),
    run: ({ w, pid, s }) => {
      const al = officer(w, pid)
      const wk = signWeek(w, s.time)
      if (!al || wk === null) return no('locked') // đang đánh dở: chờ xong rồi ghi cho tuần sau
      const lg = w.legion?.week === wk ? w.legion : fresh(wk)
      if (lg.signed.includes(al.id)) return no('claimed')
      return { ok: true, changed: new Map(), world: { ...w, legion: { ...lg, signed: [...lg.signed, al.id] } } }
    },
  },
  legionUnsign: {
    pick: () => ({ type: 'legionUnsign' }),
    run: ({ w, pid, s }) => {
      const al = officer(w, pid)
      const wk = signWeek(w, s.time)
      const lg = w.legion
      if (!al || wk === null || lg?.week !== wk || !lg.signed.includes(al.id)) return no('locked')
      return {
        ok: true,
        changed: new Map(),
        world: { ...w, legion: { ...lg, signed: lg.signed.filter(x => x !== al.id) } },
      }
    },
  },
}

// Một đợt vào một tông môn lúc at: nhà (đệ tử ở nhà, trưởng lão giữ nhà, Hộ Sơn Đại Trận) + viện binh đang đóng cùng thủ.
// Quân nhà mất thì vào Đan phòng (không tử trận, kể cả khi hết chỗ); viện binh không mất quân (chỉ góp sức).
function defend(ps: Players, pid: number, s: State, k: number, at: number, seed: number) {
  const home = defense(s)
  if (!home.troops.length) return { s, held: false }
  const foe = legionSide(might(home) * LEGION_POW[k], s.levels.chuDien)
  const helpers = aidAt(ps, pid).map(([hp, hm]) => marchSide(ps.get(hp)!, hm))
  const { side: def } = combine([home, ...helpers])
  const f = fight(foe, def, seed)
  const held = !f.win
  const left = f.rounds.at(-1)?.n[1] ?? def.troops.map(t => t.n)
  const ids = UNITS.filter(u => s.troops[u] > 0)
  const hurt = Object.fromEntries(ids.map((u, i) => [u, s.troops[u] - left[i]]).filter(([, n]) => n)) as Army
  const g = guardOf(s)
  const st = pushReport(
    { ...s, troops: minus(s.troops, hurt), wounded: plus(s.wounded, hurt) },
    {
      at,
      kind: 'legion',
      i: k,
      def: true,
      win: held,
      hurt,
      dead: {},
      gain: noGain(),
      fights: [
        { a: snap(def, g ?? undefined, g ? elderLevel(s.elders[g]) : 1), b: snap(foe), rounds: flipRounds(f.rounds) },
      ],
    },
  )
  return { s: st, held }
}

// Giải mọi đợt đã tới giờ (≤ now) chưa giải; đợt cuối xong thì phát quà. Không có gì để giải: trả lại đúng w.
export function legionStep(ps: Players, w: World, now: number, seed: number): { changed: Players; world: World } {
  const changed: Players = new Map()
  let lg = legionOf(w, now)
  if (!lg.signed.length || lg.done >= LEGION_WAVES || now < legionAt(lg.week, lg.done)) return { changed, world: w }
  const cur = (pid: number) => changed.get(pid) ?? ps.get(pid)!
  const view = (): Players => new Map([...ps.keys()].map(id => [id, cur(id)]))
  while (lg.done < LEGION_WAVES && now >= legionAt(lg.week, lg.done)) {
    const k = lg.done,
      at = legionAt(lg.week, k)
    const pts = { ...lg.pts },
      by = { ...lg.by },
      held = { ...lg.held }
    for (const aid of lg.signed)
      for (const p of Object.keys(w.allies[aid]?.members ?? {}).map(Number)) {
        if (!ps.has(p)) continue
        const r = defend(view(), p, advance(cur(p), at), k, at, (seed + p * 7919 + k * 104_729) >>> 0)
        changed.set(p, r.held ? addHonor(r.s, HONOR_LEGION) : r.s)
        if (!r.held) continue
        by[p] = (by[p] ?? 0) + LEGION_PTS[k]
        held[p] = (held[p] ?? 0) + 1
        pts[aid] = (pts[aid] ?? 0) + LEGION_PTS[k]
      }
    lg = { ...lg, done: k + 1, pts, by, held }
  }
  if (lg.done >= LEGION_WAVES) {
    const at = legionAt(lg.week, LEGION_WAVES - 1)
    const top = [...lg.signed].sort((a, b) => (lg.pts[b] ?? 0) - (lg.pts[a] ?? 0) || a - b).slice(0, LEGION_TOP.length)
    for (const aid of lg.signed)
      for (const p of Object.keys(w.allies[aid]?.members ?? {}).map(Number)) {
        if (!ps.has(p)) continue
        const n = lg.by[p] ?? 0
        const tier = LEGION_GIFTS.filter(x => n >= x.pts).at(-1)
        let st = mail(cur(p), { at, k: 'legion', a: [n, lg.held[p] ?? 0], ...(tier && { gift: tier.reward }) })
        const rank = top.indexOf(aid)
        if (rank >= 0 && (lg.pts[aid] ?? 0) > 0)
          st = mail(st, { at, k: 'legionTop', a: [rank + 1], gift: LEGION_TOP[rank] })
        changed.set(p, st)
      }
  }
  return { changed, world: { ...w, legion: lg } }
}
