// Đánh giá một câu cho chiến báo (Battle Report của RoK có "đánh giá trận"): vì sao thắng / thua, và thua thì nên làm gì.
// Xét trận quyết định (trận cuối): hệ chiếm nhiều thế lực nhất mỗi bên, tổng thế lực, phần quân mình ngã.
import { BEATS, TIER, TYPES, type Report, type UnitType } from '@rok/rules'
import { L } from './lib'

type Snap = Report['fights'][number]['a']
const pow = (s: Snap) => s.troops.reduce((n, t) => n + t.n * TIER[t.tier].power, 0)
function main(s: Snap): UnitType | null {
  const by = new Map<UnitType, number>()
  for (const t of s.troops) by.set(t.type, (by.get(t.type) ?? 0) + t.n * TIER[t.tier].power)
  return [...by].sort((x, y) => y[1] - x[1])[0]?.[0] ?? null
}

// counter: hệ nên tuyển thêm (thua vì bị khắc)
export type Verdict = { text: string; counter?: UnitType }
export function verdictOf(r: Report): Verdict | null {
  const f = r.fights.at(-1)
  if (!f || r.kind === 'trib') return null // độ kiếp có màn riêng
  const us = main(f.a),
    them = main(f.b)
  const pa = pow(f.a),
    pb = pow(f.b)
  const start = f.a.troops.reduce((n, t) => n + t.n, 0)
  const left = f.rounds.at(-1)?.n[0].reduce((n, x) => n + x, 0) ?? start
  if (r.win) {
    if (us && them && BEATS[us] === them) return { text: L.verdict.winCounter(L.units[us], L.units[them]) }
    if (pa >= 2 * pb) return { text: L.verdict.winBig }
    return { text: left >= 0.75 * start ? L.verdict.winClean : L.verdict.winHard }
  }
  if (us && them && BEATS[them] === us) {
    const counter = TYPES.find(x => BEATS[x] === them)!
    return { text: L.verdict.loseCounter(L.units[us], L.units[them], L.units[counter]), counter }
  }
  return { text: pb >= 1.5 * pa ? L.verdict.loseBig : L.verdict.loseClose }
}
