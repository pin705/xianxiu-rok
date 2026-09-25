// Minh sự lịch (Alliance Schedule / RSVP của RoK): trưởng lão / minh chủ hẹn giờ việc chung của minh (kết trận, giữ linh mạch,
// Linh Châu…) kèm lời nhắn; người trong minh bấm Tham gia (bấm lại để rút). PLAN_WARN trước giờ server nhắc người đã tham gia
// (planStep, Web Push). Việc đã qua một giờ thì tự bỏ khỏi lịch.
import { no } from '../core/action.ts'
import { cleanText, isId } from '../core/parse.ts'
import { HOUR } from '../core/util.ts'
import { PLAN_AHEAD, PLAN_MAX, PLAN_TEXT, PLAN_WARN } from '../data.ts'
import { allyOf, put, type Alliance, type Plan, type World, type WorldActions } from './base.ts'

const officer = (al: Alliance, pid: number) => (al.members[pid] ?? -9) >= 1
const live = (al: Alliance, t: number) => (al.plans ?? []).filter(p => p.at > t - HOUR)
const withPlans = (w: World, al: Alliance, plans: Plan[]) => put(w, { ...al, plans })

export type PlanAction =
  { type: 'planAdd'; at: number; text: string } | { type: 'planDel'; id: number } | { type: 'planGo'; id: number }
export const planActions: WorldActions<PlanAction> = {
  planAdd: {
    pick: a => {
      const text = cleanText(a.text)
      return Number.isSafeInteger(a.at) && text.length >= 1 && text.length <= PLAN_TEXT
        ? { type: 'planAdd', at: a.at as number, text }
        : null
    },
    run: ({ w, pid, s }, a) => {
      const al = allyOf(w, pid)
      const t = s.time
      if (!al || !officer(al, pid)) return no('locked')
      if (a.at <= t + PLAN_WARN || a.at > t + PLAN_AHEAD) return no('bad')
      const plans = live(al, t)
      if (plans.filter(p => p.at > t).length >= PLAN_MAX) return no('limit')
      const plan: Plan = { id: Math.max(0, ...plans.map(p => p.id)) + 1, by: pid, at: a.at, text: a.text, go: [pid] }
      return {
        ok: true,
        changed: new Map(),
        world: withPlans(
          w,
          al,
          [...plans, plan].sort((x, y) => x.at - y.at),
        ),
      }
    },
  },
  planDel: {
    pick: a => (isId(a.id) ? { type: 'planDel', id: a.id } : null),
    run: ({ w, pid, s }, a) => {
      const al = allyOf(w, pid)
      if (!al || !officer(al, pid)) return no('locked')
      const plans = live(al, s.time)
      if (!plans.some(p => p.id === a.id)) return no('gone')
      return {
        ok: true,
        changed: new Map(),
        world: withPlans(
          w,
          al,
          plans.filter(p => p.id !== a.id),
        ),
      }
    },
  },
  planGo: {
    pick: a => (isId(a.id) ? { type: 'planGo', id: a.id } : null),
    run: ({ w, pid, s }, a) => {
      const al = allyOf(w, pid)
      const plans = al ? live(al, s.time) : []
      const p = plans.find(x => x.id === a.id)
      if (!al || !p || p.at <= s.time) return no('gone')
      const go = p.go.includes(pid) ? p.go.filter(x => x !== pid) : [...p.go, pid]
      return {
        ok: true,
        changed: new Map(),
        world: withPlans(
          w,
          al,
          plans.map(x => (x === p ? { ...x, go } : x)),
        ),
      }
    },
  },
}

// Nhắc trước giờ: việc tới trong PLAN_WARN mà chưa nhắc — đánh dấu đã nhắc, trả [người tham gia, lời nhắn] để server gửi Web Push
export function planStep(w: World, now: number): { world: World; remind: [number, string][] } {
  let out = w
  const remind: [number, string][] = []
  for (const al of Object.values(w.allies)) {
    const due = (al.plans ?? []).filter(p => !p.warned && p.at > now && p.at - PLAN_WARN <= now)
    if (!due.length) continue
    for (const p of due) for (const pid of p.go) if (al.members[pid] !== undefined) remind.push([pid, p.text])
    out = withPlans(
      out,
      al,
      (al.plans ?? []).map(p => (due.includes(p) ? { ...p, warned: true } : p)),
    )
  }
  return { world: out, remind }
}
