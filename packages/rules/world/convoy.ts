// Linh Thương Hộ Tống (Silk Road Speculators của RoK, giản lược): trưởng lão / minh chủ tốn Minh khố khởi hành đoàn buôn, người trong
// minh ghi danh hộ tống bằng đội đầu Luận Kiếm Đài (không mất quân); hết giờ chờ (hay đủ người) server giải (convoyStep, gọi mỗi nhịp):
// cả đoàn đánh CONVOY_WAVES đợt tà tu, % hàng còn ra điểm của minh và quà qua thư cho người hộ tống.
import { fight, might, type Side } from '../combat.ts'
import { no } from '../core/action.ts'
import { mob } from '../core/battle.ts'
import { dayOf } from '../core/calendar.ts'
import { int } from '../core/parse.ts'
import type { State } from '../core/types.ts'
import {
  CONVOY_COST,
  CONVOY_GROW,
  CONVOY_HALL,
  CONVOY_HIT,
  CONVOY_MAX,
  CONVOY_MIGHT,
  CONVOY_WAIT,
  CONVOY_WAVES,
  MAIN_SHARE,
  TYPES,
  convoyGift,
} from '../data.ts'
import { arenaSide, lineupOf } from '../sect/arena.ts'
import { mail } from '../sect/inbox.ts'
import { allyOf, put, type Alliance, type Convoy, type Players, type World, type WorldActions } from './base.ts'
import { combine } from './fight.ts'

const rode = (s: State) => s.convoyDay === dayOf(s.time)
const officer = (al: Alliance, pid: number) => (al.members[pid] ?? -9) >= 1
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const drop = (al: Alliance): Alliance => {
  const { convoy: _, ...rest } = al
  return rest
}
// độ khó cao nhất mở được: qua độ khó n (điểm n × 100 + 1 … (n + 1) × 100) thì mở n + 1
export const convoyTop = (al: Alliance) =>
  Math.min(CONVOY_MIGHT.length, Math.max(1, Math.ceil((al.convoyBest ?? 0) / 100)))

export type ConvoyAction = { type: 'convoyGo'; lv: number } | { type: 'convoyGuard' }
export const convoyActions: WorldActions<ConvoyAction> = {
  convoyGo: {
    pick: a => (int(1, CONVOY_MIGHT.length)(a.lv) ? { type: 'convoyGo', lv: a.lv as number } : null),
    run: ({ w, pid, s }, a) => {
      const al = allyOf(w, pid)
      if (!al || !officer(al, pid) || s.levels.chuDien < CONVOY_HALL || a.lv > convoyTop(al)) return no('locked')
      if (al.convoy) return no('busy')
      if (rode(s)) return no('claimed')
      const cost = CONVOY_COST[a.lv - 1]
      if ((al.fund ?? 0) < cost) return no('not_enough')
      const convoy: Convoy = { by: pid, lv: a.lv, at: s.time + CONVOY_WAIT, guards: [pid] }
      const world = put(w, { ...al, fund: (al.fund ?? 0) - cost, convoy })
      return { ok: true, world, changed: new Map([[pid, { ...s, convoyDay: dayOf(s.time) }]]) }
    },
  },
  convoyGuard: {
    pick: () => ({ type: 'convoyGuard' }),
    run: ({ w, pid, s }) => {
      const al = allyOf(w, pid)
      const cv = al?.convoy
      if (!al || !cv || cv.at <= s.time || s.levels.chuDien < CONVOY_HALL) return no('gone')
      if (cv.guards.length >= CONVOY_MAX || cv.guards.includes(pid)) return no('full')
      if (rode(s)) return no('claimed')
      const world = put(w, { ...al, convoy: { ...cv, guards: [...cv.guards, pid] } })
      return { ok: true, world, changed: new Map([[pid, { ...s, convoyDay: dayOf(s.time) }]]) }
    },
  },
}

// Một chuyến: cả đoàn gộp làm một bên đánh từng đợt, quân không hồi; thua một đợt thì mất tới CONVOY_HIT % hàng theo phần giặc còn
// sống. Trả về % hàng còn (0: mất sạch).
export function convoyRun(ps: Players, cv: Convoy, seed: number): number {
  const teams = cv.guards.flatMap(p => {
    const s = ps.get(p)
    const team = s && lineupOf(s)[0]
    return s && team ? [arenaSide(s, team)] : []
  })
  let side: Side | null = teams.length ? combine(teams).side : null
  let hp = 100
  for (let k = 0; k < CONVOY_WAVES; k++) {
    if (!side || !sum(side.troops.map(t => t.n))) {
      hp -= CONVOY_HIT // hết người hộ tống: xe tự chịu đợt này
      continue
    }
    const type = TYPES[(cv.lv + k) % TYPES.length]
    const parts = TYPES.map(
      x => [x, x === type ? MAIN_SHARE : (1 - MAIN_SHARE) / 2] as [(typeof TYPES)[number], number],
    )
    const unit = might(mob(1000, 3, parts))
    const foe = mob(unit ? (1000 * CONVOY_MIGHT[cv.lv - 1] * CONVOY_GROW ** k) / unit : 0, 3, parts, 1 + k * 2)
    const f = fight(side, foe, (seed + k * 7919) >>> 0)
    const end = f.rounds.at(-1)?.n
    const rest = sum(end?.[1] ?? []) / Math.max(1, sum(foe.troops.map(t => t.n)))
    if (!f.win) hp -= Math.round(CONVOY_HIT * rest)
    const left = end?.[0] ?? side.troops.map(t => t.n)
    side = { ...side, troops: side.troops.map((t, g) => ({ ...t, n: left[g] })) }
  }
  return Math.max(0, hp)
}

// Mỗi nhịp: đoàn tới giờ khởi hành hay đủ người thì giải — thư quà cho người hộ tống, minh giữ điểm cao nhất, bỏ đoàn
export function convoyStep(ps: Players, w: World, now: number, seed: number): { changed: Players; world: World } {
  const changed: Players = new Map()
  let out = w
  for (const al of Object.values(w.allies)) {
    const cv = al.convoy
    if (!cv || (cv.at > now && cv.guards.length < CONVOY_MAX)) continue
    const hp = convoyRun(ps, cv, (seed + al.id * 104_729) >>> 0)
    const score = hp > 0 ? cv.lv * 100 + hp : 0
    const gift = convoyGift(cv.lv, hp)
    for (const p of cv.guards) {
      const s = changed.get(p) ?? ps.get(p)
      if (s) changed.set(p, mail(s, { at: now, k: 'convoy', a: [cv.lv, hp, cv.guards.length], gift }))
    }
    const cur = out.allies[al.id] ?? al
    out = put(out, { ...drop(cur), convoyBest: Math.max(cur.convoyBest ?? 0, score) })
  }
  return { changed, world: out }
}
