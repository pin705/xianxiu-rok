// Luận Kiếm Đại Hội (Sunset Canyon Tournament của RoK): từ ngày TOURNEY_DAY của mùa, TOURNEY_N người điểm Luận Kiếm Đài cao nhất (đủ
// tầng Tranh đoạt, có đội hình, không phải tông môn NPC) vào nhánh loại trực tiếp — số người là luỹ thừa của 2 lớn nhất có đủ; hạt giống
// 1 và 2 chỉ gặp ở chung kết. Mỗi ngày một vòng, đánh bằng đội hình thủ (đệ tử ảo, xa luân như Luận Kiếm Đài; mầm server). Chiến báo
// ghi cho bên đánh, cả giới xem lại theo mã; xong chung kết thì quà theo chỗ đứng qua thư, server ghi Kiếm Khôi vào biên niên.
import { rng } from '../combat.ts'
import { pushReport, snap } from '../core/battle.ts'
import { mail } from '../core/mail.ts'
import { elderLevel } from '../core/stats.ts'
import { advance } from '../core/time.ts'
import { noGain } from '../core/util.ts'
import { PVP_HALL, TOURNEY_DAY, TOURNEY_N, TOURNEY_PRIZES } from '../data.ts'
import { arenaOf, arenaSide, duel, lineupOf } from '../sect/arena.ts'
import type { Players, Tourney, World } from './base.ts'

// Thứ tự chỗ ngồi của n hạt giống (theo cặp liền nhau): 1–16, 8–9, 4–13, 5–12…
const bracket = (n: number): number[] => (n <= 1 ? [0] : bracket(n / 2).flatMap(x => [x, n - 1 - x]))
const pairs = (xs: number[], r: number) => xs.flatMap((a, k) => (k % 2 ? [] : [{ r, a, b: xs[k + 1] }]))
function draw(ps: Players, now: number, skip: Set<number>): Tourney {
  const pool = [...ps]
    .filter(([id, s]) => !skip.has(id) && s.levels.chuDien >= PVP_HALL && lineupOf(s).length)
    .sort((a, b) => arenaOf(b[1], now).pts - arenaOf(a[1], now).pts || a[0] - b[0])
  let n = 1
  while (n * 2 <= Math.min(TOURNEY_N, pool.length)) n *= 2
  const seeds = n < 2 ? [] : pool.slice(0, n).map(([id]) => id)
  return {
    seeds,
    games: seeds.length
      ? pairs(
          bracket(n).map(k => seeds[k]),
          0,
        )
      : [],
  }
}

export function tourneyStep(ps: Players, w: World, day: number, now: number, seed: number, skip: Set<number>) {
  const changed: Players = new Map()
  if (day < TOURNEY_DAY || w.tourney?.champ !== undefined || (w.tourney && !w.tourney.seeds.length))
    return { changed, world: w }
  let t = w.tourney ?? draw(ps, now, skip)
  const rand = rng(seed)
  const cur = (pid: number) => changed.get(pid) ?? ps.get(pid)
  const play = (g: Tourney['games'][number]) => {
    const [a0, b0] = [cur(g.a), cur(g.b)]
    if (!a0 || !b0) return { ...g, win: !!a0 } // tông môn không còn: bên kia đi tiếp
    const [sa, sb] = [advance(a0, now), advance(b0, now)]
    const [A, D] = [lineupOf(sa), lineupOf(sb)]
    if (!A.length || !D.length) return { ...g, win: !!A.length }
    const r = duel(
      A.map(x => arenaSide(sa, x)),
      D.map(x => arenaSide(sb, x)),
      Math.floor(rand() * 2 ** 31),
    )
    const fights = r.bouts.map(b => ({
      a: snap(b.sa, A[b.a].elder, elderLevel(sa.elders[A[b.a].elder])),
      b: snap(b.sd, D[b.d].elder, elderLevel(sb.elders[D[b.d].elder])),
      rounds: b.f.rounds,
    }))
    const rep = {
      at: now,
      kind: 'arena' as const,
      i: g.b,
      foe: sb.name,
      win: r.win,
      hurt: {},
      dead: {},
      gain: noGain(),
    }
    changed.set(g.a, pushReport(sa, { ...rep, fights }))
    return { ...g, win: r.win, rep: sa.nextId }
  }
  for (let r = 0; day >= TOURNEY_DAY + r && t.champ === undefined; r++) {
    const round = t.games.filter(g => g.r === r)
    if (!round.length) break
    if (round.every(g => g.win !== undefined)) continue
    const done = round.map(g => (g.win === undefined ? play(g) : g))
    const wins = done.map(g => (g.win ? g.a : g.b))
    t = { ...t, games: [...t.games.filter(g => g.r !== r), ...done, ...(wins.length > 1 ? pairs(wins, r + 1) : [])] }
    if (wins.length === 1) t = { ...t, champ: wins[0] }
  }
  if (t.champ !== undefined) {
    // chỗ đứng: vô địch 1, thua chung kết 2, thua bán kết 3, thua tứ kết 5
    const last = Math.max(...t.games.map(g => g.r))
    const place = new Map<number, number>([[t.champ, 1]])
    for (const g of t.games) {
      const lose = g.win ? g.b : g.a
      const k = last - g.r // 0: chung kết · 1: bán kết · 2: tứ kết
      if (k <= 2) place.set(lose, [2, 3, 5][k])
    }
    for (const [pid, p] of place) {
      const s = cur(pid)
      const gift = TOURNEY_PRIZES[[1, 2, 3, 5].indexOf(p)]
      if (s) changed.set(pid, mail(advance(s, now), { at: now, k: 'tourney', a: [p], gift }))
    }
  }
  return { changed, world: { ...w, tourney: t } }
}
// Cho client: các trận kèm tên hai bên
export const tourneyView = (w: World, ps: Players) =>
  w.tourney && {
    n: w.tourney.seeds.length,
    champ: w.tourney.champ,
    games: w.tourney.games.map(g => ({ ...g, an: ps.get(g.a)?.name ?? '?', bn: ps.get(g.b)?.name ?? '?' })),
  }
export type TourneyView = NonNullable<ReturnType<typeof tourneyView>>
