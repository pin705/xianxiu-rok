// Chặng thi đua Chính Tà (các chặng của Light and Darkness): mùa chia chặng CAMP_STAGE_DAYS ngày, mỗi chặng một việc xoay vòng
// (khai mỏ, tăng tốc, săn yêu, tuyển đệ tử, chiến công). Phần tăng của mỗi người (từ lúc chặng mở, hay lúc thấy lần đầu) cộng
// cho phái mình; hết chặng phái nhiều hơn thắng — người phái thắng có góp nhận quà qua thư, phái được điểm mùa. Chạy mỗi nhịp
// server (advance.ts hourly); cần ngày của mùa (map.day) nên sim không chạy.
import { metric } from '../core/fest.ts'
import { CAMP_STAGES, CAMP_STAGE_DAYS, CAMP_STAGE_GIFT } from '../data.ts'
import { mail } from '../sect/inbox.ts'
import { sideKey, type MapCtx, type Players, type World } from './base.ts'
import { campOf } from './points.ts'

export const stageOf = (day: number) => Math.floor(day / CAMP_STAGE_DAYS)
export const stageMetric = (n: number) => CAMP_STAGES[n % CAMP_STAGES.length]
// Phần tăng từng người trong chặng đang chạy (chỉ người có mốc)
function gains(ps: Players, w: World): [pid: number, gain: number][] {
  const st = w.stage
  if (!st) return []
  const m = stageMetric(st.n)
  return Object.entries(st.base).flatMap(([k, b]) => {
    const s = ps.get(Number(k))
    return s ? [[Number(k), Math.max(0, metric(s, m) - b)] as [number, number]] : []
  })
}
// Điểm hai phái trong chặng đang chạy
export function stageScore(ps: Players, w: World): [number, number] {
  const score: [number, number] = [0, 0]
  for (const [pid, g] of gains(ps, w)) score[campOf(sideKey(w, pid))] += g
  return score
}
export const stageGain = (ps: Players, w: World, pid: number) => gains(ps, w).find(([p]) => p === pid)?.[1] ?? 0

export function campStep(ps: Players, w: World, map: MapCtx, now: number): { changed: Players; world: World } {
  const changed: Players = new Map()
  if (map.day === undefined) return { changed, world: w }
  const n = stageOf(map.day),
    m = stageMetric(n),
    st = w.stage
  if (st?.n === n) {
    // người mới vào giới giữa chặng: mốc từ lúc thấy lần đầu
    const miss = [...ps].filter(([pid]) => st.base[pid] === undefined)
    if (!miss.length) return { changed, world: w }
    const base = { ...st.base, ...Object.fromEntries(miss.map(([pid, s]) => [pid, metric(s, m)])) }
    return { changed, world: { ...w, stage: { n, base } } }
  }
  let out = w
  if (st) {
    // hết chặng cũ: phái thắng, quà cho người phái thắng có góp
    const score = stageScore(ps, w)
    const won = score[0] === score[1] ? null : score[0] > score[1] ? 0 : 1
    if (won !== null)
      for (const [pid, g] of gains(ps, w))
        if (g > 0 && campOf(sideKey(w, pid)) === won)
          changed.set(
            pid,
            mail(ps.get(pid)!, {
              at: now,
              k: 'campStage',
              a: [st.n + 1, stageMetric(st.n), won, ...score],
              gift: CAMP_STAGE_GIFT,
            }),
          )
    const wins: [number, number] = [...(w.stageWins ?? [0, 0])]
    if (won !== null) wins[won]++
    out = { ...out, stageWins: wins, stageLast: { n: st.n, score, won } }
  }
  const base = Object.fromEntries([...ps].map(([pid, s]) => [pid, metric(s, m)]))
  return { changed, world: { ...out, stage: { n, base } } }
}
