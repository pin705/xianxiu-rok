// Luận Kiếm Minh Chiến: tiên minh đấu tiên minh mỗi tuần bằng đội hình Luận Kiếm Đài của từng người (bước đầu của Ark of Osiris).
// Ghi danh cả tuần; server gọi warResolve lúc 20h thứ Bảy (warAt): ghép cặp, đấu, quà + chiến báo cho từng người.
import { no } from '../core/action.ts'
import { pushReport, snap } from '../core/battle.ts'
import { weekOf } from '../core/calendar.ts'
import { elderLevel, power } from '../core/stats.ts'
import type { State } from '../core/types.ts'
import { DAY, noGain } from '../core/util.ts'
import { DAY_OFFSET, PVP_HALL, PVP_START, WAR_DAY, WAR_HOUR, WAR_LOSE, WAR_MAX, WAR_MIN, WAR_WIN } from '../data.ts'
import { arenaSide, duel, lineupOf } from '../sect/arena.ts'
import { mail } from '../sect/inbox.ts'
import {
  allyOf,
  elo,
  freshWorld,
  type Alliance,
  type Players,
  type War,
  type WarResult,
  type World,
  type WorldActions,
} from './base.ts'

// Lúc giải minh chiến của tuần wk (20h thứ Bảy giờ VN)
export const warAt = (wk: number) => (wk * 7 + 4 + WAR_DAY) * DAY - DAY_OFFSET + WAR_HOUR * 3_600_000
export const warOf = (w: World): War => w.war ?? freshWorld().war
// Chiến binh của một minh: người tầng ≥ PVP_HALL, lực chiến cao trước, tối đa WAR_MAX
export const fighters = (al: Alliance, ps: Players) =>
  Object.keys(al.members)
    .map(Number)
    .filter(p => (ps.get(p)?.levels.chuDien ?? 0) >= PVP_HALL)
    .sort((x, y) => power(ps.get(y)!) - power(ps.get(x)!) || x - y)
    .slice(0, WAR_MAX)

export type WarAction = { type: 'warSign' } | { type: 'warUnsign' }
// trưởng lão / minh chủ của minh mình
const officer = (w: World, pid: number) => {
  const al = allyOf(w, pid)
  return al && al.members[pid] >= 1 ? al : undefined
}
export const warActions: WorldActions<WarAction> = {
  warSign: {
    pick: () => ({ type: 'warSign' }),
    run: ({ ps, w, pid }) => {
      const al = officer(w, pid)
      if (!al) return no('locked')
      const war = warOf(w)
      if (war.signed.includes(al.id)) return no('claimed')
      if (fighters(al, ps).length < WAR_MIN) return no('weak')
      return { ok: true, changed: new Map(), world: { ...w, war: { ...war, signed: [...war.signed, al.id] } } }
    },
  },
  warUnsign: {
    pick: () => ({ type: 'warUnsign' }),
    run: ({ w, pid }) => {
      const al = officer(w, pid)
      const war = warOf(w)
      if (!al || !war.signed.includes(al.id)) return no('locked')
      return {
        ok: true,
        changed: new Map(),
        world: { ...w, war: { ...war, signed: war.signed.filter(x => x !== al.id) } },
      }
    },
  },
}

// Giải minh chiến tuần wk lúc at: ghép theo điểm minh chiến (gần nhau), minh lẻ nghỉ. Mỗi cặp người đấu bằng đội hình đài.
export function warResolve(ps: Players, w: World, at: number, seed: number) {
  const war = warOf(w)
  const pts = (id: number) => war.pts[id] ?? PVP_START
  const teams = war.signed
    .map(id => w.allies[id])
    .filter((al): al is Alliance => !!al && fighters(al, ps).length >= WAR_MIN)
    .sort((x, y) => pts(y.id) - pts(x.id) || x.id - y.id)
  const changed: Players = new Map()
  const get = (p: number) => changed.get(p) ?? ps.get(p)!
  const next: Record<number, number> = { ...war.pts }
  const last: WarResult[] = []
  for (let k = 0; k + 1 < teams.length; k += 2) {
    const [A, B] = [teams[k], teams[k + 1]]
    const fa = fighters(A, ps),
      fb = fighters(B, ps)
    let wa = 0,
      wb = 0
    fa.slice(0, fb.length).forEach((pa, j) => {
      const pb = fb[j]
      const sa = get(pa),
        sb = get(pb)
      const la = lineupOf(sa),
        lb = lineupOf(sb)
      const r = duel(
        la.map(x => arenaSide(sa, x)),
        lb.map(x => arenaSide(sb, x)),
        (seed + k * 7919 + j * 104_729) >>> 0,
      )
      if (r.win) wa++
      else wb++
      const fights = r.bouts.map(b => ({
        a: snap(b.sa, la[b.a].elder, elderLevel(sa.elders[la[b.a].elder])),
        b: snap(b.sd, lb[b.d].elder, elderLevel(sb.elders[lb[b.d].elder])),
        rounds: b.f.rounds,
      }))
      const report = (s: State, foe: State, win: boolean, f: typeof fights) =>
        pushReport(s, { at, kind: 'arena', i: 0, foe: foe.name, win, hurt: {}, dead: {}, gain: noGain(), fights: f })
      changed.set(pa, report(sa, sb, r.win, fights))
      changed.set(
        pb,
        report(
          sb,
          sa,
          !r.win,
          fights.map(x => ({ a: x.b, b: x.a, rounds: x.rounds })),
        ),
      )
    })
    // hoà: minh ít điểm minh chiến hơn thắng (người yếu thế được lợi)
    const aWins = wa > wb || (wa === wb && pts(A.id) < pts(B.id))
    const d = elo(pts(A.id), pts(B.id), aWins)
    next[A.id] = pts(A.id) + d
    next[B.id] = pts(B.id) - d
    last.push({ a: A.id, b: B.id, an: A.tag, bn: B.tag, wa, wb })
    for (const [al, win] of [
      [A, aWins],
      [B, !aWins],
    ] as const)
      for (const p of Object.keys(al.members).map(Number))
        if (ps.has(p))
          changed.set(
            p,
            mail(get(p), { at, k: 'war', a: [win ? 1 : 0, al === A ? B.tag : A.tag], gift: win ? WAR_WIN : WAR_LOSE }),
          )
  }
  const world = { ...w, war: { done: weekOf(at), signed: [], pts: next, last } }
  return { changed, world, results: last }
}
