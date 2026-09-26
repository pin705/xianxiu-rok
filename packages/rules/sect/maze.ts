// Hoàng Kim Mê Cảnh (Golden Kingdom của RoK): trong lễ meCanh mỗi ngày một lượt đi mê cung MAZE_FLOORS tầng bằng tối đa MAZE_TEAMS
// đội ảo (quân chụp lúc vào — không mất quân thật, không hồi giữa đường trừ suối linh). Mỗi tầng MAZE_W × MAZE_W ô phủ sương, mở ô
// kề ô đã mở; ô chưa mở chưa có gì — lúc mở mới rút (mầm server): thủ lĩnh với xác suất 1 / số ô sương còn lại (tầng nào cũng chắc có),
// còn lại theo MAZE_ODDS. Hạ thủ lĩnh thì xuống tầng sau; mọi đội ngã thì hết lượt. Kỷ lục số tầng qua được (bank) mở mốc quà.
import { fight, might, type Side } from '../combat.ts'
import { no, ok, type Actions } from '../core/action.ts'
import { grant, mob, pushReport, sideOf, snap, tierFor } from '../core/battle.ts'
import { dayOf } from '../core/calendar.ts'
import { festOpen } from '../core/fest.ts'
import { int, isElder, pickArmy } from '../core/parse.ts'
import { capOf, elderLevel } from '../core/stats.ts'
import type { Army, Maze, State } from '../core/types.ts'
import { compact, count, nextSeed, noGain } from '../core/util.ts'
import {
  MAIN_SHARE,
  MAZE_BLESS,
  MAZE_BOSS,
  MAZE_FLOORS,
  MAZE_FOE,
  MAZE_GIFTS,
  MAZE_KINDS,
  MAZE_ODDS,
  MAZE_SPRING,
  MAZE_TEAMS,
  MAZE_TRAP,
  MAZE_W,
  TYPES,
  UNITS,
  type ElderId,
} from '../data.ts'

type Kind = (typeof MAZE_KINDS)[number]
const K = (k: Kind) => MAZE_KINDS.indexOf(k)
const DONE = 8
// Ô i của tầng: −1 sương; kind (đã mở, chưa xong — yêu binh / thủ lĩnh chưa hạ); kind + DONE đã xong
export const mazeKind = (t: number): Kind | null => (t < 0 ? null : MAZE_KINDS[t % DONE])
export const mazeDone = (t: number) => t >= DONE
const fresh = (): number[] => [K('start') + DONE, ...Array(MAZE_W * MAZE_W - 1).fill(-1)]
// Ô kề (4 hướng) một ô đã mở
export function mazeNear(tiles: number[], i: number) {
  const [x, y] = [i % MAZE_W, Math.floor(i / MAZE_W)]
  const near = [x > 0 && i - 1, x < MAZE_W - 1 && i + 1, y > 0 && i - MAZE_W, y < MAZE_W - 1 && i + MAZE_W]
  return near.some(j => j !== false && tiles[j] >= 0)
}
// Lượt hôm nay (ngày khác: chưa đi)
export const mazeToday = (s: State) => (s.maze && s.maze.day === dayOf(s.time) ? s.maze : undefined)
// Đội còn quân
export const mazeAlive = (m: Maze, t: number) => !!m.teams[t] && count(m.teams[t].army) > 0

// Phe mình: đội với phúc đã chọn (công / thủ / máu nhân lên)
function teamSide(s: State, m: Maze, t: number): Side {
  const team = m.teams[t]
  const side = sideOf(s, team.elder, team.army)
  const add = (key: 'atk' | 'def' | 'hp') => 1 + m.bless.reduce((sum, b) => sum + (MAZE_BLESS[b]?.[key] ?? 0), 0)
  return {
    ...side,
    troops: side.troops.map(x => ({ ...x, atk: x.atk * add('atk'), def: x.def * add('def'), hp: x.hp * add('hp') })),
  }
}
// Địch ở ô i tầng f: mạnh theo lực chiến lúc vào của đội đánh × hệ số tầng; hệ chính đổi theo ô
export function mazeFoe(s: State, m: Maze, t: number, i: number, boss: boolean): Side {
  const [a, b] = boss ? MAZE_BOSS : MAZE_FOE
  const aim = m.teams[t].base * (a + b * m.floor)
  const type = TYPES[(m.floor + i) % TYPES.length]
  const parts = TYPES.map(x => [x, x === type ? MAIN_SHARE : (1 - MAIN_SHARE) / 2] as [(typeof TYPES)[number], number])
  const tier = tierFor(s.levels.chuDien)
  return mob((1000 * aim) / Math.max(1, might(mob(1000, tier, parts))), tier, parts, 1 + m.floor)
}
// Rút loại ô vừa mở: thủ lĩnh 1 / số ô sương còn lại (chưa gặp thủ lĩnh ở tầng này), còn lại theo trọng số
function draw(m: Maze, seed: number): number {
  const x = (seed >>> 0) / 2 ** 32
  const fog = m.tiles.filter(t => t < 0).length
  if (!m.tiles.some(t => mazeKind(t) === 'boss') && x < 1 / fog) return K('boss')
  let y = (((x * 7919) % 1) * MAZE_ODDS.reduce((a, b) => a + b, 0)) as number
  const k = MAZE_ODDS.findIndex(w => (y -= w) < 0)
  return k < 0 ? 0 : k
}
// Hồi mỗi đội phần f số đã mất so với lúc vào
const mend = (m: Maze, f: number, only?: number): Maze => ({
  ...m,
  teams: m.teams.map((tm, k) =>
    only !== undefined && k !== only
      ? tm
      : {
          ...tm,
          army: compact(
            Object.fromEntries(
              UNITS.map(u => [u, (tm.army[u] ?? 0) + Math.floor(((tm.full[u] ?? 0) - (tm.army[u] ?? 0)) * f)]),
            ),
          ),
        },
  ),
})

export type MazeAction =
  | { type: 'mazeStart'; teams: { elder: ElderId; army: Army }[] }
  | { type: 'mazeOpen'; i: number; team: number }
  | { type: 'mazePick'; k: number }

export function mazeStartError(s: State, teams: { elder: ElderId; army: Army }[]) {
  if (!festOpen(s, 'meCanh', s.time)) return 'locked'
  if (mazeToday(s)) return 'claimed'
  if (!teams.length || teams.length > MAZE_TEAMS || new Set(teams.map(t => t.elder)).size < teams.length) return 'bad'
  if (teams.some(t => s.elders[t.elder] === undefined || !count(t.army) || count(t.army) > capOf(s, t.elder)))
    return 'cap'
  return UNITS.some(u => teams.reduce((n, t) => n + (t.army[u] ?? 0), 0) > s.troops[u]) ? 'not_enough' : null
}

export const mazeActions: Actions<MazeAction> = {
  mazeStart: {
    pick: a => {
      if (!Array.isArray(a.teams) || a.teams.length > MAZE_TEAMS) return null
      const teams = a.teams.map((t: { elder?: unknown; army?: unknown }) => ({
        elder: t?.elder,
        army: pickArmy(t?.army),
      }))
      return teams.every(t => isElder(t.elder) && t.army)
        ? { type: 'mazeStart', teams: teams as { elder: ElderId; army: Army }[] }
        : null
    },
    run: (s, a) => {
      const e = mazeStartError(s, a.teams)
      if (e) return no(e)
      const teams = a.teams.map(t => {
        const army = compact(t.army)
        return { elder: t.elder, full: army, army, base: might(sideOf(s, t.elder, army)) }
      })
      return ok({ ...s, maze: { day: dayOf(s.time), floor: 0, tiles: fresh(), teams, bless: [] } })
    },
  },
  mazeOpen: {
    pick: a =>
      int(0, MAZE_W * MAZE_W - 1)(a.i) && int(0, MAZE_TEAMS - 1)(a.team)
        ? { type: 'mazeOpen', i: a.i as number, team: a.team as number }
        : null,
    run: (s, a) => {
      const m = mazeToday(s)
      if (!m || m.over || m.floor >= MAZE_FLOORS || m.offer || !festOpen(s, 'meCanh', s.time)) return no('locked')
      const t = m.tiles[a.i]
      if (mazeDone(t) || (t < 0 && !mazeNear(m.tiles, a.i))) return no('bad')
      if (!mazeAlive(m, a.team)) return no('empty')
      if (!s.seed) return ok(s) // mầm của server: client chờ
      const kind = t < 0 ? draw(m, s.seed) : t % DONE
      const tiles = [...m.tiles]
      tiles[a.i] = kind
      const at: Maze = { ...m, tiles }
      const st = { ...s, seed: nextSeed(s.seed) }
      if (MAZE_KINDS[kind] === 'foe' || MAZE_KINDS[kind] === 'boss') return ok(battle(st, at, a.i, a.team))
      tiles[a.i] = kind + DONE
      const what = MAZE_KINDS[kind]
      if (what === 'gift') return ok({ ...grant(st, MAZE_GIFTS[s.seed % MAZE_GIFTS.length]), maze: at })
      if (what === 'spring') return ok({ ...st, maze: mend(at, MAZE_SPRING) })
      if (what === 'trap') {
        const hurt = (a0: Army) =>
          compact(Object.fromEntries(UNITS.map(u => [u, Math.floor((a0[u] ?? 0) * (1 - MAZE_TRAP))])))
        return ok({ ...st, maze: { ...at, teams: at.teams.map(tm => ({ ...tm, army: hurt(tm.army) })) } })
      }
      // thần đàn: mời chọn một trong ba phúc chưa có
      const left = Object.keys(MAZE_BLESS).filter(b => !at.bless.includes(b))
      const offer = [0, 1, 2].map(k => left[(s.seed + k * 7) % left.length]).filter((b, k, l) => l.indexOf(b) === k)
      return ok({ ...st, maze: { ...at, ...(offer.length && { offer }) } })
    },
  },
  mazePick: {
    pick: a => (int(0, 2)(a.k) ? { type: 'mazePick', k: a.k as number } : null),
    run: (s, a) => {
      const m = mazeToday(s)
      const b = m?.offer?.[a.k]
      if (!m || !b) return no('bad')
      const { offer: _, ...rest } = m
      return ok({ ...s, maze: { ...rest, bless: [...m.bless, b] } })
    },
  },
}

// Trận ở ô i với đội t: thua thì ô còn đó (đội khác đánh tiếp); thắng yêu binh thì ô xong, hạ thủ lĩnh thì xuống tầng sau
function battle(s: State, m: Maze, i: number, t: number): State {
  const boss = MAZE_KINDS[m.tiles[i]] === 'boss'
  const me = teamSide(s, m, t)
  const foe = mazeFoe(s, m, t, i, boss)
  const f = fight(me, foe, s.seed)
  const team = m.teams[t]
  const ids = UNITS.filter(u => (team.army[u] ?? 0) > 0)
  const left = f.rounds.at(-1)?.n[0] ?? ids.map(u => team.army[u]!)
  const army = compact(Object.fromEntries(ids.map((u, k) => [u, left[k]])))
  let next: Maze = { ...m, teams: m.teams.map((tm, k) => (k === t ? { ...tm, army } : tm)) }
  const mendF = m.bless.reduce((sum, b) => sum + (MAZE_BLESS[b]?.mend ?? 0), 0)
  if (f.win && mendF) next = mend(next, mendF, t)
  if (f.win) next = { ...next, tiles: next.tiles.map((x, k) => (k === i ? x + DONE : x)) }
  if (f.win && boss) next = { ...next, floor: m.floor + 1, tiles: fresh() }
  if (!next.teams.some(tm => count(tm.army) > 0)) next = { ...next, over: true }
  const fest = s.fest.meCanh
  const best =
    f.win && boss && fest ? { ...s.fest, meCanh: { ...fest, bank: Math.max(fest.bank, m.floor + 1) } } : s.fest
  return pushReport(
    { ...s, maze: next, fest: best },
    {
      at: s.time,
      kind: 'maze',
      i: m.floor * 100 + i,
      win: f.win,
      hurt: {},
      dead: {},
      gain: noGain(),
      fights: [
        {
          a: snap(me, team.elder, elderLevel(s.elders[team.elder])),
          b: snap(foe, undefined, 1 + m.floor),
          rounds: f.rounds,
        },
      ],
    },
  )
}
