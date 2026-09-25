// Sơn môn thất thủ (bị buộc dời thành của RoK): trận lực về 0 trong lúc núi cháy thì tông môn bị đánh bật sang chỗ trống ngẫu
// nhiên ở vùng ngoài (chọn như lúc lập tông môn), mê vụ quanh chỗ mới tan, lửa tắt, trận lực còn WALL_FALL phần; thư báo chỗ
// mới. Server gọi mỗi nhịp (mầm ngẫu nhiên của server). Đội địch đang kéo tới chỗ cũ tới nơi thì về tay không (như dời núi).
import { spawn, type Atlas } from '../atlas.ts'
import { rng } from '../combat.ts'
import { around, cellOf, fogOf, lift } from '../core/fog.ts'
import { wallFallAt, wallMax } from '../core/wall.ts'
import { FOG_HOME, WALL_FALL } from '../data.ts'
import { mail } from '../sect/inbox.ts'
import type { State } from '../core/types.ts'
import type { Players } from './base.ts'

export function wallStep(ps: Players, a: Atlas, now: number, seed: number, skip: Set<number> = new Set()): Players {
  const changed: Players = new Map()
  const rand = rng(seed)
  for (const [pid, s] of ps) {
    if (skip.has(pid) || !s.seat || wallFallAt(s, now) === null) continue
    const taken = [...ps].flatMap(([p, o]) => ((changed.get(p) ?? o).seat ? [(changed.get(p) ?? o).seat!] : []))
    const seat = spawn(a, taken, rand)
    if (!seat) continue
    const f = fogOf(s),
      c = cellOf(seat)
    const moved: State = {
      ...s,
      seat,
      fog: { ...f, rows: lift(f.rows, around(c.cx, c.cy, FOG_HOME)) },
      wall: { hp: wallMax(s) * WALL_FALL, at: now, fire: 0, ...(s.wall?.mend !== undefined && { mend: s.wall.mend }) },
    }
    changed.set(pid, mail(moved, { at: now, k: 'wallFall', a: [seat.x, seat.y] }))
  }
  return changed
}
