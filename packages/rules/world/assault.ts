// Vây Công Yêu Vương — trận 12 người (Ceroli Assault của RoK, giản lược): trong kỳ lễ vayCong người trong minh mở / vào phòng bằng đội
// đầu Luận Kiếm Đài; đủ người hay hết giờ chờ server giải (assaultStep, gọi mỗi nhịp) một trận cả phòng gộp làm một bên với yêu vương.
// Thắng: góp sức hạ yêu vương (stats.forts — Bảo Hạp Phiếu của lễ) + quà thư, minh mở độ khó kế; thua: lượt trong ngày được trả lại.
import { fight, might } from '../combat.ts'
import { no } from '../core/action.ts'
import { mob } from '../core/battle.ts'
import { dayOf } from '../core/calendar.ts'
import { festOpen } from '../core/fest.ts'
import { int } from '../core/parse.ts'
import type { State } from '../core/types.ts'
import { ASSAULT_FORTS, ASSAULT_MAX, ASSAULT_MIGHT, ASSAULT_WAIT, MAIN_SHARE, TYPES, assaultGift } from '../data.ts'
import { arenaSide, lineupOf } from '../sect/arena.ts'
import { mail } from '../sect/inbox.ts'
import { allyOf, put, type Alliance, type Assault, type Players, type World, type WorldActions } from './base.ts'
import { combine } from './fight.ts'

const used = (s: State) => s.assaultDay === dayOf(s.time)
const open = (s: State) => festOpen(s, 'vayCong', s.time)
const drop = (al: Alliance): Alliance => {
  const { assault: _, ...rest } = al
  return rest
}
// độ khó cao nhất mở được: đã hạ độ khó n thì mở n + 1
export const assaultTop = (al: Alliance) => Math.min(ASSAULT_MIGHT.length, (al.assaultTop ?? 0) + 1)

export type AssaultAction = { type: 'assaultOpen'; lv: number } | { type: 'assaultJoin' }
export const assaultActions: WorldActions<AssaultAction> = {
  assaultOpen: {
    pick: a => (int(1, ASSAULT_MIGHT.length)(a.lv) ? { type: 'assaultOpen', lv: a.lv as number } : null),
    run: ({ w, pid, s }, a) => {
      const al = allyOf(w, pid)
      if (!al || !open(s) || a.lv > assaultTop(al)) return no('locked')
      if (al.assault) return no('busy') // minh đang có phòng chờ: vào phòng đó
      if (used(s)) return no('claimed')
      const assault: Assault = { by: pid, lv: a.lv, at: s.time + ASSAULT_WAIT, members: [pid] }
      return {
        ok: true,
        world: put(w, { ...al, assault }),
        changed: new Map([[pid, { ...s, assaultDay: dayOf(s.time) }]]),
      }
    },
  },
  assaultJoin: {
    pick: () => ({ type: 'assaultJoin' }),
    run: ({ w, pid, s }) => {
      const al = allyOf(w, pid)
      const r = al?.assault
      if (!al || !r || r.at <= s.time || !open(s)) return no('gone')
      if (r.members.length >= ASSAULT_MAX || r.members.includes(pid)) return no('full')
      if (used(s)) return no('claimed')
      const world = put(w, { ...al, assault: { ...r, members: [...r.members, pid] } })
      return { ok: true, world, changed: new Map([[pid, { ...s, assaultDay: dayOf(s.time) }]]) }
    },
  },
}

// Một trận: cả phòng gộp làm một bên (đội đầu Luận Kiếm Đài từng người) đánh yêu vương độ khó lv, hệ chính xoay theo độ khó
export function assaultRun(ps: Players, r: Assault, seed: number): boolean {
  const teams = r.members.flatMap(p => {
    const s = ps.get(p)
    const team = s && lineupOf(s)[0]
    return s && team ? [arenaSide(s, team)] : []
  })
  if (!teams.length) return false
  const type = TYPES[r.lv % TYPES.length]
  const parts = TYPES.map(x => [x, x === type ? MAIN_SHARE : (1 - MAIN_SHARE) / 2] as [(typeof TYPES)[number], number])
  const unit = might(mob(1000, 3, parts))
  const boss = mob(unit ? (1000 * ASSAULT_MIGHT[r.lv - 1]) / unit : 0, 3, parts, 1 + r.lv * 2)
  return fight(combine(teams).side, boss, seed >>> 0).win
}

// Mỗi nhịp: phòng đủ người hay hết giờ chờ thì giải — thư cho người trong phòng (thắng: góp sức + quà; thua: trả lượt), bỏ phòng
export function assaultStep(ps: Players, w: World, now: number, seed: number): { changed: Players; world: World } {
  const changed: Players = new Map()
  let out = w
  for (const al of Object.values(w.allies)) {
    const r = al.assault
    if (!r || (r.at > now && r.members.length < ASSAULT_MAX)) continue
    const win = assaultRun(ps, r, (seed + al.id * 104_729) >>> 0)
    for (const p of r.members) {
      const s = changed.get(p) ?? ps.get(p)
      if (!s) continue
      const got = mail(s, {
        at: now,
        k: 'assault',
        a: [r.lv, win ? 1 : 0, r.members.length],
        gift: assaultGift(r.lv, win),
      })
      const forts = (got.stats.forts ?? 0) + ASSAULT_FORTS[r.lv - 1]
      changed.set(p, win ? { ...got, stats: { ...got.stats, forts } } : { ...got, assaultDay: undefined })
    }
    const cur = out.allies[al.id] ?? al
    out = put(out, { ...drop(cur), ...(win && { assaultTop: Math.max(cur.assaultTop ?? 0, r.lv) }) })
  }
  return { changed, world: out }
}
