// Cổ Khư Loạn Chiến (War of the Ruins của RoK, bất đồng bộ): hàng chờ cả giới; đủ ROYALE_N người (hay chờ quá ROYALE_WAIT thì bù tông
// môn NPC) server giải ngay (royaleStep, gọi mỗi nhịp): mỗi vòng ghép cặp ngẫu nhiên người còn lại bằng đội đầu Luận Kiếm Đài (không mất
// quân), mỗi trận mỗi bên một kỳ ngộ ngẫu nhiên; thua 2 lần bị loại, hạng theo thứ tự bị loại. Thư hạng + quà, điểm cộng dồn.
import { fight, rng, type Side } from '../combat.ts'
import { no } from '../core/action.ts'
import { dayOf } from '../core/calendar.ts'
import type { State } from '../core/types.ts'
import { ROYALE_BOON, ROYALE_DAILY, ROYALE_HALL, ROYALE_N, ROYALE_PTS, ROYALE_WAIT, royaleGift } from '../data.ts'
import { arenaSide, lineupOf } from '../sect/arena.ts'
import { mail } from '../sect/inbox.ts'
import type { Players, World, WorldActions } from './base.ts'

// lượt đã vào hôm nay
export const royaleUsed = (s: State, t: number) => (s.royale?.day === dayOf(t) ? s.royale.n : 0)
const queue = (w: World) => w.royale?.q ?? []

export type RoyaleAction = { type: 'royaleJoin' } | { type: 'royaleLeave' }
export const royaleActions: WorldActions<RoyaleAction> = {
  royaleJoin: {
    pick: () => ({ type: 'royaleJoin' }),
    run: ({ w, pid, s }) => {
      if (s.levels.chuDien < ROYALE_HALL || !lineupOf(s).length) return no('locked')
      if (queue(w).includes(pid)) return no('claimed')
      const used = royaleUsed(s, s.time)
      if (used >= ROYALE_DAILY) return no('limit')
      const q = [...queue(w), pid]
      const me = { ...s, royale: { day: dayOf(s.time), n: used + 1, pts: s.royale?.pts ?? 0 } }
      return { ok: true, world: { ...w, royale: { q, at: w.royale?.at ?? s.time } }, changed: new Map([[pid, me]]) }
    },
  },
  royaleLeave: {
    pick: () => ({ type: 'royaleLeave' }),
    run: ({ w, pid, s }) => {
      if (!queue(w).includes(pid)) return no('gone')
      const q = queue(w).filter(x => x !== pid)
      const me = s.royale ? { ...s, royale: { ...s.royale, n: Math.max(0, s.royale.n - 1) } } : s // rời hàng: trả lượt
      const { royale: _, ...rest } = w
      return { ok: true, world: q.length ? { ...w, royale: { ...w.royale!, q } } : rest, changed: new Map([[pid, me]]) }
    },
  },
}

// Một trận loạn chiến: xếp hạng từ nhất tới bét (pid). Mỗi vòng xáo người còn lại, ghép từng đôi (lẻ một người được nghỉ); mỗi bên
// một kỳ ngộ: công ×ROYALE_BOON hay quân ×ROYALE_BOON
export function royaleRun(ps: Players, pids: number[], seed: number): number[] {
  const rand = rng(seed || 1)
  const side = (p: number): Side => {
    const s = ps.get(p)!
    const base = arenaSide(s, lineupOf(s)[0])
    const atk = rand() < 0.5
    return {
      ...base,
      troops: base.troops.map(t =>
        atk ? { ...t, atk: t.atk * ROYALE_BOON } : { ...t, n: Math.round(t.n * ROYALE_BOON) },
      ),
    }
  }
  const strikes = new Map(pids.map(p => [p, 0]))
  const out: number[] = [] // thứ tự bị loại
  let alive = [...pids]
  for (let round = 0; alive.length > 1; round++) {
    const order = [...alive].sort(() => rand() - 0.5)
    for (let k = 0; k + 1 < order.length; k += 2) {
      const [a, b] = [order[k], order[k + 1]]
      const lose = fight(side(a), side(b), (seed + round * 7919 + k) >>> 0).win ? b : a
      strikes.set(lose, strikes.get(lose)! + 1)
      if (strikes.get(lose)! >= 2) out.push(lose)
    }
    alive = alive.filter(p => strikes.get(p)! < 2)
  }
  return [...alive, ...out.reverse()]
}

// Mỗi nhịp: hàng đủ người (hay chờ quá lâu thì bù NPC từ bots) thì giải — thư hạng, quà, điểm cho người thật
export function royaleStep(
  ps: Players,
  w: World,
  now: number,
  seed: number,
  bots: number[],
): { changed: Players; world: World } {
  const changed: Players = new Map()
  const q = queue(w)
  if (!q.length || (q.length < ROYALE_N && now - w.royale!.at < ROYALE_WAIT)) return { changed, world: w }
  const fill = bots.filter(b => !q.includes(b) && ps.get(b) && lineupOf(ps.get(b)!).length)
  const pids = [...q.slice(0, ROYALE_N), ...fill.slice(0, Math.max(0, ROYALE_N - q.length))]
  if (pids.length < 2) return { changed, world: w } // chưa ai để đấu: chờ tiếp
  const places = royaleRun(ps, pids, seed)
  for (const [k, p] of places.entries()) {
    const s = ps.get(p)
    if (!s || !q.includes(p)) continue
    const pts = ROYALE_PTS[k] ?? 0
    const got = mail(s, { at: now, k: 'royale', a: [k + 1, pids.length, pts], gift: royaleGift(k + 1) })
    changed.set(p, {
      ...got,
      royale: { day: s.royale?.day ?? dayOf(now), n: s.royale?.n ?? 1, pts: (s.royale?.pts ?? 0) + pts },
    })
  }
  const rest = q.slice(ROYALE_N)
  const { royale: _, ...base } = w
  return { changed, world: rest.length ? { ...w, royale: { q: rest, at: now } } : base }
}
