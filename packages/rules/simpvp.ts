// Sim tranh đoạt: N bot chung một giới (nửa giỏi, nửa thường), mỗi phiên thử cướp trước rồi chơi như thường.
//   npm run sim -- 30 4 --pvp 20
// Cổng (plan M5): trung vị tầng ≥ 15 sau 30 ngày; đồ bị cướp ≤ 25 % sản lượng; người không đi cướp (giữ được khiên) không bị cướp
// thành công > 3 lần/ngày. Ai vừa đi cướp thì tự bỏ khiên (đúng luật), bị đánh lại nhiều là chuyện họ chọn — không tính.
import {
  RESOURCES,
  SHIELD_TIME,
  TRIBS,
  UNITS,
  advance,
  dayOf,
  newGame,
  rate,
  type ElderId,
  type State,
} from './index.ts'
import { advanceWorld, raidChance, rivals, worldAct, type Players } from './world.ts'
import { turn } from './bot.ts'

const DAY = 86_400_000,
  HOUR = 3_600_000
const args = process.argv.slice(2)
const n = Number(args[args.indexOf('--pvp') + 1] || 20)
const [daysArg, perDayArg] = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--pvp')
const days = Number(daysArg ?? 30)
const SESSIONS = [8, 12.5, 18, 22.5, 10, 15, 20, 7].slice(0, Number(perDayArg ?? 4)).sort((a, b) => a - b)

let seed = 1
const rand = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296
const ps: Players = new Map(
  Array.from(
    { length: n },
    (_, i) => [i + 1, { ...newGame(0, `Bot ${i + 1}`), seed: i * 7919 + 1 }] as [number, State],
  ),
)
const casual = (pid: number) => pid % 2 === 0

let produced = 0,
  stolen = 0,
  raids = 0,
  wins = 0
const hits = new Map<string, number>() // `${pid}:${ngày}` → số lần bị cướp thành công (lúc không tự bỏ khiên)
const attacked = new Map<number, number>() // lần cuối đi cướp
const set = (changed: Players) => {
  for (const [id, s] of changed) {
    const prev = ps.get(id)!
    for (const r of s.reports.filter(r => r.id >= prev.nextId && r.kind === 'pvp' && r.def)) {
      raids++
      if (!r.win) {
        wins++
        stolen += RESOURCES.reduce((sum, x) => sum + (r.lost?.[x] ?? 0), 0)
        const k = `${id}:${dayOf(r.at)}`
        if ((attacked.get(id) ?? -Infinity) + SHIELD_TIME < r.at) hits.set(k, (hits.get(k) ?? 0) + 1)
      }
    }
    ps.set(id, s)
  }
}

let prev = 0
for (let d = 0; d < days; d++)
  for (const h of SESSIONS) {
    const t = d * DAY + h * HOUR
    for (const s of ps.values()) produced += RESOURCES.reduce((sum, r) => sum + rate(s, r), 0) * ((t - prev) / HOUR) // ước lượng sản lượng
    prev = t
    for (const pid of ps.keys()) {
      let s = advance(ps.get(pid)!, t)
      ps.set(pid, s)
      // thử cướp trước (đội đang ở nhà, chắc thắng theo dò thám), rồi chơi như thường
      const e = (Object.keys(s.elders) as ElderId[]).find(x => !s.marches.some(m => m.elder === x))
      const army = Object.fromEntries(UNITS.filter(u => s.troops[u] > 0).map(u => [u, s.troops[u]]))
      const trib = TRIBS[s.trib]?.hall === s.levels.chuDien // sắp độ kiếp: giữ quân ở nhà
      if (e && Object.keys(army).length && !trib)
        for (const r of rivals(ps, pid, t, rand)) {
          if (raidChance(s, e, army, r.scout.side) < 0.8) continue
          const res = worldAct(ps, pid, { type: 'raid', pid: r.pid, elder: e, army }, t, (rand() * 2 ** 32) >>> 0 || 1)
          if (res.ok) (set(res.changed), attacked.set(pid, t))
          break
        }
      s = turn(ps.get(pid)!, { casual: casual(pid) })
      ps.set(pid, s)
    }
    set(advanceWorld(ps, t + 20 * 60_000)) // các đội vừa đi cướp tới nơi
  }

const halls = [...ps.values()].map(s => s.levels.chuDien).sort((a, b) => a - b)
const median = halls[Math.floor(halls.length / 2)]
const share = stolen / produced
const most = Math.max(0, ...hits.values())
console.log(`${n} tông môn, ${days} ngày: tầng ${halls.join(' ')} (trung vị ${median})`)
console.log(
  `Trận cướp ${raids}, thành công ${wins}; bị cướp ${Math.round(stolen).toLocaleString('vi')} / sản lượng ${Math.round(produced).toLocaleString('vi')} = ${(share * 100).toFixed(1)} %; nhiều nhất ${most} lần/ngày một người`,
)
console.log(
  `Điểm tranh đoạt: ${[...ps.values()]
    .map(s => s.pvp.pts)
    .sort((a, b) => b - a)
    .join(' ')}`,
)
const bad = [
  days >= 30 && median < 15 && `trung vị tầng ${median} < 15`,
  share > 0.25 && `bị cướp ${(share * 100).toFixed(1)} % > 25 %`,
  most > 3 && `có người bị cướp ${most} lần/ngày > 3`,
].filter(Boolean)
if (bad.length) {
  console.error(`\nLỖI CÂN BẰNG PVP: ${bad.join('; ')}`)
  process.exitCode = 1
}
