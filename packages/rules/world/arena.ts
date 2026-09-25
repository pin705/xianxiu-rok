// Luận Kiếm Đài (Sunset Canyon của RoK, bất đồng bộ): đánh đội hình thủ của người khác bằng trận xa luân (mầm của server),
// đổi điểm Elo cả hai bên, ghi nhật ký cả hai; danh sách đối thủ gần điểm; bảng tuần.
import { no } from '../core/action.ts'
import { pushReport, snap } from '../core/battle.ts'
import { isId } from '../core/parse.ts'
import { elderLevel } from '../core/stats.ts'
import { advance } from '../core/time.ts'
import { dayOf } from '../core/calendar.ts'
import type { ArenaLog, ArenaTeam, State } from '../core/types.ts'
import { noGain } from '../core/util.ts'
import {
  ARENA_LOG,
  ARENA_PRIZES,
  ARENA_TOP,
  KY_LOSE,
  KY_REVENGE,
  KY_WIN,
  MATCH_PICK,
  MATCH_POOL,
  PVP_HALL,
  type Reward,
} from '../data.ts'
import { arenaN, arenaOf, arenaSide, duel, lineupOf } from '../sect/arena.ts'
import { elo, type Players, type WorldActions } from './base.ts'

// Đội hình thủ người khác thấy trước (trưởng lão, hệ, cấp, số đệ tử ảo)
export type ArenaFoe = {
  pid: number
  name: string
  hall: number
  pts: number
  lineup: (ArenaTeam & { lv: number; n: number })[]
}
const foeRow = (pid: number, s: State, t: number): ArenaFoe => ({
  pid,
  name: s.name,
  hall: s.levels.chuDien,
  pts: arenaOf(s, t).pts,
  lineup: lineupOf(s).map(x => ({ ...x, lv: elderLevel(s.elders[x.elder]), n: arenaN(s, x.elder) })),
})
// MATCH_PICK người ngẫu nhiên trong MATCH_POOL người điểm đài gần mình nhất (đã tới tầng mở Tranh đoạt)
export function arenaFoes(ps: Players, pid: number, t: number, rand: () => number): ArenaFoe[] {
  const me = ps.get(pid)
  if (!me || me.levels.chuDien < PVP_HALL) return []
  const mine = arenaOf(me, t).pts
  const pool = [...ps]
    .filter(([id, s]) => id !== pid && s.levels.chuDien >= PVP_HALL)
    .sort((a, b) => Math.abs(arenaOf(a[1], t).pts - mine) - Math.abs(arenaOf(b[1], t).pts - mine) || a[0] - b[0])
    .slice(0, MATCH_POOL)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, MATCH_PICK).map(([id, s]) => foeRow(id, s, t))
}
// Bảng tuần: người có đài tuần này, điểm cao trước
export const arenaBoard = (ps: Players, week: number) =>
  [...ps]
    .filter(([, s]) => s.arena?.week === week && s.arena.log.length)
    .sort((a, b) => b[1].arena!.pts - a[1].arena!.pts || a[0] - b[0])
// Thư quà hết tuần theo hạng (0: hạng 1): hạng 1 · 2–3 · 4–10
export const arenaTop = (ps: Players, week: number) =>
  arenaBoard(ps, week)
    .slice(0, ARENA_TOP)
    .map(([id]) => id)
export const arenaPrize = (rank: number): Reward => ARENA_PRIZES[rank === 0 ? 0 : rank < 3 ? 1 : 2]

export type ArenaFight = { type: 'arena'; pid: number; revenge?: boolean }
// Phục thù được người pid lúc t: hôm nay chưa phục thù, và hôm nay người ấy đã thắng mình lúc mình giữ đài
export const canRevenge = (s: State, pid: number, t: number) => {
  const a = arenaOf(s, t)
  return a.revenge !== a.day && a.log.some(e => e.def && !e.win && e.pid === pid && dayOf(e.at) === a.day)
}
const log = (s: State, t: number, e: ArenaLog, pts: number, left?: number, ky = 0): State => {
  const a = arenaOf(s, t)
  return {
    ...s,
    arena: { ...a, pts, left: left ?? a.left, log: [e, ...a.log].slice(0, ARENA_LOG), ky: (a.ky ?? 0) + ky },
  }
}

export const arenaActions: WorldActions<ArenaFight> = {
  arena: {
    pick: a =>
      isId(a.pid) && (a.revenge === undefined || a.revenge === true)
        ? { type: 'arena', pid: a.pid, ...(a.revenge && { revenge: true }) }
        : null,
    run: ({ ps, w, pid, s, seed }, a) => {
      const t = s.time
      if (s.levels.chuDien < PVP_HALL) return no('locked')
      const mine = arenaOf(s, t)
      if (a.revenge ? !canRevenge(s, a.pid, t) : mine.left < 1) return no('limit')
      const foe = ps.get(a.pid)
      if (!foe || a.pid === pid) return no('gone')
      if (foe.levels.chuDien < PVP_HALL) return no('weak')
      const def = advance(foe, t)
      const A = lineupOf(s),
        D = lineupOf(def)
      if (!A.length) return no('empty')
      const r = duel(
        A.map(x => arenaSide(s, x)),
        D.map(x => arenaSide(def, x)),
        seed,
      )
      const theirs = arenaOf(def, t)
      const delta = elo(mine.pts, theirs.pts, r.win)
      const fights = r.bouts.map(b => ({
        a: snap(b.sa, A[b.a].elder, elderLevel(s.elders[A[b.a].elder])),
        b: snap(b.sd, D[b.d].elder, elderLevel(def.elders[D[b.d].elder])),
        rounds: b.f.rounds,
      }))
      const fought = {
        ...s,
        stats: { ...s.stats, duels: (s.stats.duels ?? 0) + 1, duelWins: (s.stats.duelWins ?? 0) + (r.win ? 1 : 0) },
      }
      const me = pushReport(fought, {
        at: t,
        kind: 'arena',
        i: a.pid,
        foe: def.name,
        win: r.win,
        hurt: {},
        dead: {},
        gain: noGain(),
        fights,
      })
      const mark = { at: t, win: r.win, delta }
      const ky = (r.win ? KY_WIN : KY_LOSE) + (a.revenge && r.win ? KY_REVENGE : 0)
      const logged = log(
        me,
        t,
        { ...mark, pid: a.pid, foe: def.name, def: false },
        mine.pts + delta,
        a.revenge ? mine.left : mine.left - 1, // phục thù không tốn lượt
        ky,
      )
      return {
        ok: true,
        world: w,
        changed: new Map([
          [pid, a.revenge ? { ...logged, arena: { ...logged.arena!, revenge: mine.day } } : logged],
          [
            a.pid,
            log(def, t, { ...mark, pid, foe: s.name, win: !r.win, delta: -delta, def: true }, theirs.pts - delta),
          ],
        ]),
      }
    },
  },
}
