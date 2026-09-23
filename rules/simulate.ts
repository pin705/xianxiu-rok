// Bot chơi `rules` N ngày ảo, 4 phiên mỗi ngày (mỗi phiên 2 lượt cách nhau 5 phút), in mốc tiến độ.
// Chỉnh nhịp bằng số liệu ở đây, không bằng cảm giác. Mục tiêu: Chủ điện tầng 15 sau ~14 ngày.
//   npm run sim                    → 30 ngày, bot giỏi: "xem trước" đúng kết quả trận (luật tất định)
//   npm run sim -- 45 6            → 45 ngày, 6 phiên/ngày
//   npm run sim -- 45 3 --casual   → người chơi thường: mỗi phiên 1 lượt, chỉ đánh khi giao diện báo ≥ 80% thắng
import {
  BEASTS, ELDER_IDS, IDS, MAX_LEVEL, PILL_IDS, QUESTS, REALMS, SECTS, TECH_IDS, TRIBS, TYPES, UNITS,
  apply, advance, batch, cost, count, elderLevel, enemyOf, fight, newGame, sideOf, tierOpen, unitOf, winChance,
  type Action, type Army, type ElderId, type State, type Target, type UnitId,
} from './index.ts'

const DAY = 86_400_000
const casual = process.argv.includes('--casual')
const [daysArg, perDayArg] = process.argv.slice(2).filter(a => !a.startsWith('--'))
const days = Number(daysArg ?? 30)
const perDay = Number(perDayArg ?? 4)
const SESSIONS = [8, 12.5, 18, 22.5, 10, 15, 20, 7].slice(0, perDay).sort((a, b) => a - b)

let s = newGame(0, 'Bot Tông')
const log: string[] = []
const when = (t: number) => `ngày ${String(Math.floor(t / DAY) + 1).padStart(2)} ${String(Math.floor((t % DAY) / 3_600_000)).padStart(2, '0')}h`
const note = (msg: string) => log.push(`${when(s.time)}  ${msg}`)

function tryDo(a: Action) {
  const r = apply(s, a, s.time)
  if (r.ok) s = r.state
  return r.ok
}

const home = (st: State): Army => Object.fromEntries(UNITS.filter(u => st.troops[u] > 0).map(u => [u, st.troops[u]]))
const idleElders = (st: State) =>
  ELDER_IDS.filter(e => st.elders[e] !== undefined && !st.marches.some(m => m.elder === e))
    .sort((a, b) => elderLevel(st.elders[b]) - elderLevel(st.elders[a]))
// Bot giỏi biết trước kết quả thật; người chơi thường chỉ thấy tỉ lệ thắng ước lượng trên giao diện
const wins = (st: State, e: ElderId, army: Army, t: Target | 'trib', pill = false) =>
  casual ? winChance(st, e, army, t, pill) >= 0.8 : t === 'trib' ? true : fight(sideOf(st, e, army), enemyOf(st, t), st.seed).win

function build() {
  const hall = s.levels.chuDien
  // Như chuỗi nhiệm vụ dạy: có đủ 3 công trình tài nguyên (tầng 2) rồi mới dồn Chủ điện
  for (const id of ['tuLinhTran', 'linhDien', 'khoangMach'] as const)
    if (s.levels[id] < Math.min(hall - 1, 2) && tryDo({ type: 'upgrade', building: id })) return true
  if (tryDo({ type: 'upgrade', building: 'chuDien' })) return true
  // Kho sắp không đủ chứa chi phí Chủ điện tầng sau → nâng Tàng Bảo Các trước
  const want = IDS.filter(id => id !== 'chuDien').sort((a, b) => s.levels[a] - s.levels[b] || cost(a, s.levels[a] + 1).linhThach - cost(b, s.levels[b] + 1).linhThach)
  const need = cost('chuDien', Math.min(MAX_LEVEL, hall + 1))
  if (Math.max(need.linhThach, need.linhThao, need.linhKhoang) > 0.9 * capOf(s) && tryDo({ type: 'upgrade', building: 'tangBaoCac' })) return true
  for (const id of want) if (tryDo({ type: 'upgrade', building: id })) return true
  return false
}
const capOf = (st: State) => Math.round(2000 * 1.3 ** st.levels.tangBaoCac)

function train() {
  if (s.train || !s.levels.dienVoTruong) return false
  const tier = ([3, 2, 1] as const).find(t => tierOpen(s, t))!
  // giữ ba hệ cân nhau
  const type = [...TYPES].sort((a, b) => sumType(a) - sumType(b))[0]
  const u = `${type}${tier}` as UnitId
  for (let n = batch(s); n >= 5; n = Math.floor(n / 2)) if (tryDo({ type: 'train', unit: u, n })) return true
  return false
}
const sumType = (t: string) => UNITS.filter(u => unitOf(u).type === t).reduce((sum, u) => sum + s.troops[u] * unitOf(u).tier, 0)

function fightAll() {
  let acted = false
  // Độ kiếp khi đủ sức (thử trên bản sao, luật tất định)
  const tr = TRIBS[s.trib]
  if (tr && s.levels.chuDien === tr.hall && count(s.troops)) {
    const e = idleElders(s)[0]
    if (e) {
      const pill = !!s.items.doKiep
      const r = apply(s, { type: 'trib', elder: e, army: home(s), pill }, s.time)
      if (casual && r.ok && wins(s, e, home(s), 'trib', pill)) {
        s = r.state // người chơi thường đánh theo ước lượng: có thể thua, phải chờ
        note(`${r.state.reports.at(-1)!.win ? 'ĐỘ KIẾP thành công' : 'độ kiếp THẤT BẠI'} → Chủ điện ${s.levels.chuDien} (${count(r.state.troops)} đệ tử)`)
        acted = true
      } else if (!casual && r.ok && r.state.reports.at(-1)!.win) {
        s = r.state
        note(`ĐỘ KIẾP thành công → Chủ điện ${s.levels.chuDien} (${count(s.troops)} đệ tử, trưởng lão ${elderLevel(s.elders[e])})`)
        acted = true
      }
    }
  }
  // Bí cảnh
  for (let i = 0; i < REALMS.length; i++) {
    const e = idleElders(s)[0]
    if (!e || !count(s.troops)) break
    const t: Target = { kind: 'realm', i }
    const r = apply(s, { type: 'realm', i, elder: e, army: home(s) }, s.time)
    if (r.ok && wins(s, e, home(s), t) && (casual || r.state.reports.at(-1)!.win)) {
      s = r.state
      if (r.state.reports.at(-1)!.win) note(`bí cảnh ${i + 1} tầng ${s.realms[i]}`)
      acted = true
      if (r.state.reports.at(-1)!.win) i--
    }
  }
  // Xuất quân: tông môn chưa hạ trước, rồi yêu thú cấp cao nhất đánh thắng được
  for (const e of idleElders(s)) {
    if (!count(s.troops)) break
    const army = home(s)
    const targets: Target[] = [
      ...SECTS.map((_, i) => ({ kind: 'sect', i }) as Target).filter(t => !s.sects[t.i]),
      ...BEASTS.map((_, i) => ({ kind: 'beast', i }) as Target).reverse(),
    ]
    for (const t of targets) {
      if (!wins(s, e, army, t)) continue
      if (tryDo({ type: 'march', target: t, elder: e, army })) {
        acted = true
        break
      }
    }
  }
  return acted
}

function turn() {
  for (let guard = 0; guard < 60; guard++) {
    let acted = false
    if (tryDo({ type: 'claim' })) acted = true
    for (let i = 0; i < 4; i++) if (tryDo({ type: 'daily', i })) acted = true
    if (tryDo({ type: 'dailyBonus' })) acted = true
    if (count(s.wounded) && tryDo({ type: 'heal' })) acted = true
    if (build()) acted = true
    if (!s.study) for (const t of [...TECH_IDS].sort((a, b) => (s.tech[a] ?? 0) - (s.tech[b] ?? 0))) if (tryDo({ type: 'study', tech: t })) { acted = true; break }
    if (!s.brew) for (const p of [...PILL_IDS].reverse()) if (tryDo({ type: 'brew', pill: p, n: 1 })) { acted = true; break }
    if (s.items.tuKhi && s.queue[0] && s.queue[0].finishAt - s.time > 20 * 60_000 && tryDo({ type: 'speed', job: 'build', n: 1 })) acted = true
    for (const e of ELDER_IDS) if (s.items.boiNguyen && s.elders[e] !== undefined && tryDo({ type: 'feed', elder: e, n: 1 })) acted = true
    if (train()) acted = true
    if (fightAll()) acted = true
    if (!acted) break
  }
}

let lastHall = s.levels.chuDien, lastBeast = 0, lastQuest = 0
const seenElders = new Set(ELDER_IDS.filter(e => s.elders[e] !== undefined))
for (let d = 0; d < days; d++) {
  for (const h of SESSIONS) {
    for (const extra of casual ? [0] : [0, 5 * 60_000]) {
      s = advance(s, d * DAY + h * 3_600_000 + extra)
      turn()
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
console.log(`\nSau ${days} ngày: Chủ điện ${s.levels.chuDien}, yêu thú ${s.beast}, tông môn ${s.sects.filter(Boolean).length}/${SECTS.length}, bí cảnh ${s.realms.join('/')}, nhiệm vụ ${s.quest}/${QUESTS.length}`)
console.log(`Công trình: ${IDS.map(id => `${id} ${s.levels[id]}`).join(', ')}`)
console.log(`Đệ tử: ${tot}`)
console.log(`Trưởng lão: ${ELDER_IDS.filter(e => s.elders[e] !== undefined).map(e => `${e} ${elderLevel(s.elders[e])}`).join(', ')}`)
console.log(`Công pháp: ${TECH_IDS.map(t => s.tech[t] ?? 0).join('')}  · thắng ${s.stats.won} thua ${s.stats.lost} · tài nguyên ${JSON.stringify(s.res)}`)

// Chốt chặn cho CI: đổi số liệu mà bot không còn tới được Chủ điện tầng 15 là nhịp game đã gãy
if (s.levels.chuDien < MAX_LEVEL) {
  console.error(`\nLỖI NHỊP: sau ${days} ngày bot mới tới Chủ điện tầng ${s.levels.chuDien}/${MAX_LEVEL}`)
  process.exitCode = 1
}
