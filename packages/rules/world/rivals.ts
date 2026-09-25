// Tranh đoạt: ghép đối thủ để cướp — kẻ đã đánh mình (báo thù) trước, rồi vài tông môn gần lực chiến.
import { power } from '../core/stats.ts'
import { type State } from '../core/types.ts'
import { MATCH_PICK, MATCH_POOL, PVP_HALL } from '../data.ts'
import { raidPath, type MapCtx, type Players, type World } from './base.ts'
import { raidError, revenge, scout, type Scout } from './fight.ts'

export type Rival = {
  pid: number
  name: string
  hall: number
  power: number
  pts: number
  revenge: boolean
  scout: Scout
  ms: number
}

// Kẻ đã đánh mình (báo thù, 24 giờ) + MATCH_PICK người ngẫu nhiên trong MATCH_POOL người gần lực chiến nhất, đánh được lúc này
// only: chỉ hỏi một tông môn (chạm trên bản đồ) — trả [] nếu lúc này không đánh được
export function rivals(
  ps: Players,
  pid: number,
  now: number,
  rand: () => number,
  map?: MapCtx,
  only?: number,
  w?: World,
): Rival[] {
  const me = ps.get(pid)
  if (!me || me.levels.chuDien < PVP_HALL) return []
  const mine = power(me)
  const row = (id: number, s: State, rev: boolean): Rival => ({
    pid: id,
    name: s.name,
    hall: s.levels.chuDien,
    power: Math.round(power(s)),
    pts: s.pvp.pts,
    revenge: rev,
    scout: scout(s),
    ms: raidPath(me, s, map)!.ms,
  })
  const open = [...ps].filter(
    ([id, s]) => (only === undefined || id === only) && !raidError(me, s, pid, id, now, map, w),
  )
  const foes = open.filter(([id]) => revenge(me, id, now))
  const pool = open
    .filter(([id]) => !revenge(me, id, now))
    .sort((a, b) => Math.abs(power(a[1]) - mine) - Math.abs(power(b[1]) - mine) || a[0] - b[0])
    .slice(0, MATCH_POOL)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return [...foes.map(([id, s]) => row(id, s, true)), ...pool.slice(0, MATCH_PICK).map(([id, s]) => row(id, s, false))]
}
