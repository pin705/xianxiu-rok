// Tông vụ (Side Quests của RoK): 4 dòng song song, mỗi dòng một việc theo công thức — nhận từng việc, không có "nhận tất".
// Nhắm đúng lỗ PLAN đã ghi: người chỉ theo nhiệm vụ chính bỏ quên công trình tài nguyên và công pháp.
import { no, ok, type Actions } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import { int } from '../core/parse.ts'
import { techSum } from '../core/stats.ts'
import type { State } from '../core/types.ts'
import { TECH_IDS } from '../core/util.ts'
import { MAX_LEVEL, SIDE_GIFTS, SIDE_LINES, TECHS, type BuildingId, type Reward, type SideLine } from '../data.ts'

const RES_HALLS: BuildingId[] = ['tuLinhTran', 'linhDien', 'khoangMach']
const TECH_MAX = TECH_IDS.reduce((n, t) => n + TECHS[t].max, 0)
const tri = (k: number) => ((k + 1) * (k + 2)) / 2 // 1, 3, 6, 10, 15…

// Việc thứ k của một dòng (null: dòng đã xong hết). id: công trình (dòng linh mạch)
export type SideGoal = { line: SideLine; n: number; id?: BuildingId; reward: Reward }
export function sideGoal(line: SideLine, k: number): SideGoal | null {
  const gift = (t: number) => SIDE_GIFTS[line][Math.min(SIDE_GIFTS[line].length - 1, t)]
  if (line === 'linhMach') {
    // ba công trình tài nguyên lần lượt lên tầng 2, 3, … 25
    const n = 2 + Math.floor(k / 3)
    return n > MAX_LEVEL ? null : { line, n, id: RES_HALLS[k % 3], reward: gift(Math.floor((n - 2) / 5)) }
  }
  if (line === 'truyenCong')
    return 3 * (k + 1) > TECH_MAX ? null : { line, n: 3 * (k + 1), reward: gift(Math.floor(k / 6)) }
  if (line === 'hangYeu') return { line, n: 5 * tri(k), reward: gift(Math.floor(k / 4)) } // thắng trận (mọi loại)
  return { line, n: 100 * tri(k), reward: gift(Math.floor(k / 4)) } // tổng đệ tử đã tuyển
}
export function sideProgress(s: State, g: SideGoal): number {
  if (g.line === 'linhMach') return s.levels[g.id!]
  if (g.line === 'truyenCong') return techSum(s)
  return g.line === 'hangYeu' ? s.stats.won : s.stats.trained
}
export const sideAt = (s: State, i: number) => sideGoal(SIDE_LINES[i], s.side?.[i] ?? 0)
// Số việc đã xong chờ nhận (huy hiệu)
export const sideReady = (s: State) =>
  SIDE_LINES.filter((_, i) => {
    const g = sideAt(s, i)
    return !!g && sideProgress(s, g) >= g.n
  }).length

export type SideAction = { type: 'side'; line: number }
export const sideActions: Actions<SideAction> = {
  side: {
    pick: a => (int(0, SIDE_LINES.length - 1)(a.line) ? { type: 'side', line: a.line } : null),
    run: (s, a) => {
      const g = sideAt(s, a.line)
      if (!g) return no('max_level')
      if (sideProgress(s, g) < g.n) return no('not_done')
      const side = SIDE_LINES.map((_, i) => (s.side?.[i] ?? 0) + (i === a.line ? 1 : 0))
      return ok(grant({ ...s, side }, g.reward))
    },
  },
}
