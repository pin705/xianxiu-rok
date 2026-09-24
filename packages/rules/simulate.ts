// Bot chơi `rules` N ngày ảo, 4 phiên mỗi ngày (mỗi phiên 2 lượt cách nhau 5 phút), in mốc tiến độ.
// Chỉnh nhịp bằng số liệu ở đây, không bằng cảm giác. Mục tiêu: Chủ điện tầng 15 sau ~14 ngày.
//   npm run sim                    → 30 ngày, bot giỏi: "xem trước" đúng kết quả trận (luật tất định)
//   npm run sim -- 45 6            → 45 ngày, 6 phiên/ngày
//   npm run sim -- 45 3 --casual   → người chơi thường: mỗi phiên 1 lượt, chỉ đánh khi giao diện báo ≥ 80% thắng
//   npm run sim -- 60 4 --rebirth  → luân hồi khi xong kiếp đầu, xem kiếp sau nhanh hơn bao nhiêu
//   npm run sim -- 60 4 --goal 25  → không luân hồi, leo tiếp tầng 16–25 (CI: phải tới 25)
import { ELDER_IDS, GEAR_IDS, IDS, QUESTS, REBIRTH_HALL, SECTS, TECH_IDS, UNITS, apply, advance, elderLevel, newGame, type Action } from './index.ts'
import { ready, turn, type BotOpts } from './bot.ts'

const DAY = 86_400_000
const [daysArg, perDayArg] = process.argv.slice(2).filter((a, i, all) => !a.startsWith('--') && all[i - 1] !== '--goal')
const days = Number(daysArg ?? 30)
const perDay = Number(perDayArg ?? 4)
const SESSIONS = [8, 12.5, 18, 22.5, 10, 15, 20, 7].slice(0, perDay).sort((a, b) => a - b)

let s = newGame(0, 'Bot Tông')
const log: string[] = []
const when = (t: number) => `ngày ${String(Math.floor(t / DAY) + 1).padStart(2)} ${String(Math.floor((t % DAY) / 3_600_000)).padStart(2, '0')}h`
const note = (msg: string, at = s.time) => log.push(`${when(at)}  ${msg}`)
const bot: BotOpts = { casual: process.argv.includes('--casual'), rebirth: process.argv.includes('--rebirth'), note: (at, msg) => note(msg, at) }
const casual = bot.casual
const goal = Number(process.argv[process.argv.indexOf('--goal') + 1] || 0) || REBIRTH_HALL // tầng bot phải tới (CI)

function tryDo(a: Action) {
  const r = apply(s, a, s.time)
  if (r.ok) s = r.state
  return r.ok
}

let lastHall = s.levels.chuDien, lastBeast = 0, lastQuest = 0
let peak = 0, lifeStart = 0
const seenElders = new Set(ELDER_IDS.filter(e => s.elders[e] !== undefined))
for (let d = 0; d < days; d++) {
  for (const h of SESSIONS) {
    for (const extra of casual ? [0] : [0, 5 * 60_000]) {
      s = advance(s, d * DAY + h * 3_600_000 + extra)
      s = turn(s, bot)
      peak = Math.max(peak, s.levels.chuDien)
      if (ready(s, bot) && tryDo({ type: 'rebirth' })) {
        note(`LUÂN HỒI lần ${s.rebirths} — kiếp vừa rồi dài ${((s.time - lifeStart) / DAY).toFixed(1)} ngày`)
        lifeStart = s.time
        lastHall = s.levels.chuDien
      }
      if (s.levels.chuDien !== lastHall) note(`Chủ điện tầng ${(lastHall = s.levels.chuDien)}`)
      if (s.beast !== lastBeast) note(`hạ yêu thú cấp ${(lastBeast = s.beast)}`)
      if (s.quest !== lastQuest && s.quest === QUESTS.length) note('XONG CHUỖI NHIỆM VỤ')
      lastQuest = s.quest
      for (const e of ELDER_IDS) if (s.elders[e] !== undefined && !seenElders.has(e)) {
        seenElders.add(e)
        note(`thu nhận trưởng lão ${e}`)
      }
    }
  }
}

console.log(log.join('\n'))
const tot = UNITS.map(u => `${u}:${s.troops[u] + s.wounded[u]}`).filter(x => !x.endsWith(':0')).join(' ')
console.log(`\nSau ${days} ngày: Chủ điện ${s.levels.chuDien}, yêu thú ${s.beast}, tông môn ${s.sects.filter(Boolean).length}/${SECTS.length}, bí cảnh ${s.realms.join('/')}, tháp ${s.tower}, nhiệm vụ ${s.quest}/${QUESTS.length}`)
console.log(`Công trình: ${IDS.map(id => `${id} ${s.levels[id]}`).join(', ')}`)
console.log(`Đệ tử: ${tot}`)
console.log(`Trưởng lão: ${ELDER_IDS.filter(e => s.elders[e] !== undefined).map(e => `${e} ${elderLevel(s.elders[e])}`).join(', ')}`)
console.log(`Công pháp: ${TECH_IDS.map(t => s.tech[t] ?? 0).join('')}  · thắng ${s.stats.won} thua ${s.stats.lost} · tài nguyên ${JSON.stringify(s.res)}`)

console.log(`Pháp bảo: ${GEAR_IDS.filter(g => s.gear[g]).map(g => `${g} ${s.gear[g]!.lv}${s.gear[g]!.on ? `→${s.gear[g]!.on}` : ''}`).join(', ') || '—'}`)

// Chốt chặn cho CI: đổi số liệu mà bot không còn tới được tầng goal là nhịp game đã gãy
if (Math.max(peak, s.levels.chuDien) < goal) {
  console.error(`\nLỖI NHỊP: sau ${days} ngày bot mới tới Chủ điện tầng ${Math.max(peak, s.levels.chuDien)}/${goal}`)
  process.exitCode = 1
}
