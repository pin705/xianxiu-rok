// Minh vụ đường (Alliance Mobilization của RoK): bảng việc chung của tiên minh, làm mới mỗi tuần. Nhận một việc trên bảng
// (việc mới thế chỗ), làm trong hạn thì minh được điểm; đủ mốc thì người đã góp nhận quà mốc.
import { rng } from '../combat.ts'
import { no } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import { dayOf, weekOf } from '../core/calendar.ts'
import { metric } from '../core/fest.ts'
import { int } from '../core/parse.ts'
import type { Mob, State } from '../core/types.ts'
import { MOB_GOALS, MOB_MIN, MOB_POOL, MOB_REWARDS, MOB_SLOTS, MOB_TAKES, MOB_TIME } from '../data.ts'
import { allyOf, put, type Alliance, type MobBoard, type WorldActions } from './base.ts'

// Việc thứ i của bảng minh aid tuần week: tất định, client tự suy ra được
export const mobTask = (aid: number, week: number, i: number) =>
  MOB_POOL[Math.floor(rng(aid * 1_000_003 + week * 7919 + i * 104_729)() * MOB_POOL.length)]
// Bảng tuần này (tuần mới: bảng mới, điểm về 0)
export const boardOf = (al: Alliance, t: number): MobBoard => {
  const week = weekOf(t)
  return al.mob?.week === week
    ? al.mob
    : { week, pts: 0, next: MOB_SLOTS, board: Array.from({ length: MOB_SLOTS }, (_, i) => i), by: {} }
}
// Minh vụ của mình lúc t: sang tuần thì quà mốc làm lại, sang ngày thì lượt nhận làm lại
export function mobOf(s: State, t: number): Mob {
  const week = weekOf(t),
    day = dayOf(t)
  const m = s.mob ?? { week, task: null, day, took: 0, got: [] }
  return { ...m, ...(m.week !== week && { week, got: [] }), ...(m.day !== day && { day, took: 0 }) }
}
// Tiến độ việc đang nhận (chỉ số tăng thêm từ lúc nhận)
export const mobProgress = (s: State, m: Mob) => (m.task ? metric(s, m.task.m) - m.task.base : 0)

export type MobAction = { type: 'mobTake'; slot: number } | { type: 'mobDone' } | { type: 'mobClaim'; tier: number }

export const mobActions: WorldActions<MobAction> = {
  mobTake: {
    pick: a => (int(0, MOB_SLOTS - 1)(a.slot) ? { type: 'mobTake', slot: a.slot } : null),
    run: ({ w, pid, s }, a) => {
      const al = allyOf(w, pid)
      if (!al) return no('locked')
      const t = s.time,
        m = mobOf(s, t)
      if (m.task && m.task.until > t) return no('busy')
      if (m.took >= MOB_TAKES) return no('limit')
      const b = boardOf(al, t)
      const def = mobTask(al.id, b.week, b.board[a.slot])
      const task = { ...def, base: metric(s, def.m), until: t + MOB_TIME }
      const board = b.board.map((x, k) => (k === a.slot ? b.next : x))
      return {
        ok: true,
        changed: new Map([[pid, { ...s, mob: { ...m, task, took: m.took + 1 } }]]),
        world: put(w, { ...al, mob: { ...b, board, next: b.next + 1 } }),
      }
    },
  },
  // Nộp việc: đủ trong hạn thì minh được điểm; quá hạn thì bỏ việc (không hoàn lượt)
  mobDone: {
    pick: () => ({ type: 'mobDone' }),
    run: ({ w, pid, s }) => {
      const al = allyOf(w, pid)
      const t = s.time,
        m = mobOf(s, t)
      if (!al || !m.task) return no('empty')
      const me: State = { ...s, mob: { ...m, task: null } }
      if (m.task.until < t) return { ok: true, changed: new Map([[pid, me]]), world: w }
      if (mobProgress(s, m) < m.task.n) return no('not_done')
      const b = boardOf(al, t)
      const mob = { ...b, pts: b.pts + m.task.pts, by: { ...b.by, [pid]: (b.by[pid] ?? 0) + m.task.pts } }
      return { ok: true, changed: new Map([[pid, me]]), world: put(w, { ...al, mob }) }
    },
  },
  mobClaim: {
    pick: a => (int(0, MOB_GOALS.length - 1)(a.tier) ? { type: 'mobClaim', tier: a.tier } : null),
    run: ({ w, pid, s }, a) => {
      const al = allyOf(w, pid)
      if (!al) return no('locked')
      const t = s.time,
        m = mobOf(s, t),
        b = boardOf(al, t)
      if (m.got.includes(a.tier)) return no('claimed')
      if (b.pts < MOB_GOALS[a.tier] || (b.by[pid] ?? 0) < MOB_MIN) return no('not_done')
      const me = grant({ ...s, mob: { ...m, got: [...m.got, a.tier] } }, MOB_REWARDS[a.tier])
      return { ok: true, changed: new Map([[pid, me]]), world: w }
    },
  },
}
