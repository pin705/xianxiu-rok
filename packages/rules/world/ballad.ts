// Tứ Nhân Thám Bí (Ian's Ballads của RoK, bất đồng bộ): phòng mở cho cả giới, tối đa BALLAD_MAX người; đủ người hay hết giờ chờ thì server
// giải cả đội đi hết lộ trình trại yêu + ba trùm (balladRun). Thư cho từng người: chặng xa nhất, quà nếu tuần này chưa nhận.
import { fight, might, type Side } from '../combat.ts'
import { no } from '../core/action.ts'
import { mob } from '../core/battle.ts'
import { weekOf } from '../core/calendar.ts'
import { int } from '../core/parse.ts'
import type { State } from '../core/types.ts'
import {
  BALLAD_BOSS,
  BALLAD_CAMP,
  BALLAD_LV,
  BALLAD_MAX,
  BALLAD_ROUTE,
  BALLAD_STEP,
  BALLAD_TOTEM,
  BALLAD_WAIT,
  MAIN_SHARE,
  TYPES,
  balladGift,
} from '../data.ts'
import { arenaSide, lineupOf } from '../sect/arena.ts'
import { mail } from '../sect/inbox.ts'
import type { Players, World, WorldActions } from './base.ts'
import { combine } from './fight.ts'

type Room = NonNullable<World['ballads']>[number]
const rooms = (w: World) => w.ballads ?? []
export const balladIn = (w: World, pid: number) => rooms(w).find(r => r.members.includes(pid))
export const balladGifted = (s: State, t: number) => s.ballad === weekOf(t)
const set = (w: World, list: Room[]): World => {
  const { ballads: _, ...rest } = w
  return list.length ? { ...w, ballads: list } : rest
}

export type BalladAction =
  { type: 'balladOpen'; lv: number } | { type: 'balladJoin'; id: number } | { type: 'balladLeave' }
export const balladActions: WorldActions<BalladAction> = {
  balladOpen: {
    pick: a => (int(0, BALLAD_LV.length - 1)(a.lv) ? { type: 'balladOpen', lv: a.lv as number } : null),
    run: ({ w, pid, s }, a) => {
      if (s.levels.chuDien < BALLAD_LV[a.lv].hall || !lineupOf(s).length) return no('locked')
      if (balladIn(w, pid)) return no('busy')
      const id = w.nextBallad ?? 1
      const room: Room = { id, by: pid, lv: a.lv, at: s.time + BALLAD_WAIT, members: [pid] }
      return { ok: true, world: { ...set(w, [...rooms(w), room]), nextBallad: id + 1 }, changed: new Map() }
    },
  },
  balladJoin: {
    pick: a => (int(1, 2 ** 31)(a.id) ? { type: 'balladJoin', id: a.id as number } : null),
    run: ({ w, pid, s }, a) => {
      const r = rooms(w).find(x => x.id === a.id)
      if (!r || r.at <= s.time) return no('gone')
      if (s.levels.chuDien < BALLAD_LV[r.lv].hall || !lineupOf(s).length) return no('locked')
      if (balladIn(w, pid)) return no('busy')
      if (r.members.length >= BALLAD_MAX) return no('full')
      const list = rooms(w).map(x => (x.id === r.id ? { ...x, members: [...x.members, pid] } : x))
      return { ok: true, world: set(w, list), changed: new Map() }
    },
  },
  balladLeave: {
    pick: () => ({ type: 'balladLeave' }),
    run: ({ w, pid }) => {
      const r = balladIn(w, pid)
      if (!r) return no('gone')
      // chủ phòng rời thì giải tán phòng
      const list =
        r.by === pid
          ? rooms(w).filter(x => x !== r)
          : rooms(w).map(x => (x === r ? { ...x, members: x.members.filter(p => p !== pid) } : x))
      return { ok: true, world: set(w, list), changed: new Map() }
    },
  },
}

// Một chuyến: cả đội gộp làm một bên đi từng chặng; thắng thì đi tiếp với quân còn lại (qua trại hồi một phần quân ngã), thua thì dừng.
// Trùm cuối: mỗi người đã ngã hết quân thì trùm thêm công (vật tổ). Trả số chặng qua
export function balladRun(ps: Players, r: Room, seed: number): number {
  const teams = r.members.flatMap(pid => {
    const s = ps.get(pid)
    const t = s && lineupOf(s)[0]
    return s && t ? [arenaSide(s, t)] : []
  })
  if (!teams.length) return 0
  const c = combine(teams)
  let side: Side = c.side
  const full = side.troops.map(t => t.n)
  for (let k = 0; k < BALLAD_ROUTE.length; k++) {
    const boss = BALLAD_ROUTE[k] === 'boss'
    const type = TYPES[k % TYPES.length]
    const parts = TYPES.map(
      x => [x, x === type ? MAIN_SHARE : (1 - MAIN_SHARE) / 2] as [(typeof TYPES)[number], number],
    )
    const unit = might(mob(1000, 3, parts))
    const target = BALLAD_LV[r.lv].might * (1 + BALLAD_STEP * k) * (boss ? BALLAD_BOSS : 1)
    // vật tổ của trùm cuối: người trong đội đã ngã hết quân
    const fallen = c.at.filter(
      (from, j) => !side.troops.slice(from, c.at[j + 1] ?? side.troops.length).some(t => t.n > 0),
    ).length
    const totem = k === BALLAD_ROUTE.length - 1 ? 1 + BALLAD_TOTEM * fallen : 1
    const foe = mob(
      unit ? (1000 * target) / unit : 0,
      3,
      parts,
      1 + k * 2,
      boss ? { kind: 'burst', v: 0.7 } : undefined,
      totem,
    )
    const f = fight(side, foe, (seed + k * 7919) >>> 0)
    if (!f.win) return k
    const left = f.rounds.at(-1)?.n[0] ?? side.troops.map(t => t.n)
    const heal = BALLAD_ROUTE[k] === 'camp' ? BALLAD_CAMP : 0
    side = {
      ...side,
      troops: side.troops.map((t, g) => ({
        ...t,
        n: Math.min(full[g], left[g] + Math.floor((full[g] - left[g]) * heal)),
      })),
    }
  }
  return BALLAD_ROUTE.length
}

// Mỗi nhịp: phòng đủ người hay hết giờ chờ thì giải — thư (quà nếu tuần này chưa nhận), bỏ phòng
export function balladStep(ps: Players, w: World, now: number, seed: number): { changed: Players; world: World } {
  const changed: Players = new Map()
  const due = rooms(w).filter(r => r.members.length >= BALLAD_MAX || r.at <= now)
  if (!due.length) return { changed, world: w }
  for (const r of due) {
    const reached = balladRun(ps, r, (seed + r.id * 104_729) >>> 0)
    for (const pid of r.members) {
      const s = changed.get(pid) ?? ps.get(pid)
      if (!s) continue
      const gift = !balladGifted(s, now)
      const m = mail(s, {
        at: now,
        k: 'ballad',
        a: [r.lv, reached, gift ? 1 : 0],
        ...(gift && { gift: balladGift(r.lv, reached) }),
      })
      changed.set(pid, gift ? { ...m, ballad: weekOf(now) } : m)
    }
  }
  return {
    changed,
    world: set(
      w,
      rooms(w).filter(r => !due.includes(r)),
    ),
  }
}
