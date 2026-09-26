// Trung tâm sự kiện: khung giờ, tiến độ, điểm, quà đã nhận của mọi sự kiện trong FESTS (data.ts).
// Tiến độ = chỉ số bây giờ − chỉ số lúc sự kiện (hay giai đoạn) bắt đầu: mọi thao tác tự được tính, không phải gọi từng nơi.
// rollFest chạy trong advance() trước mỗi việc hẹn giờ (như rollDay) nên việc xong trước giờ mở không lọt vào sự kiện mới.
import { dayOf, weekOf } from './calendar.ts'
import { elderLevel, power } from './stats.ts'
import { fogOf } from './fog.ts'
import { type Fest, type State } from './types.ts'
import { DAY, ELDER_IDS, GEAR_IDS, IDS, TECH_IDS, nextSeed } from './util.ts'
import { mail } from './mail.ts'
import {
  DAY_OFFSET,
  FEST_STAGED,
  FEST_STAR,
  FESTS,
  PASS_LEVELS,
  PASS_STEP,
  type DropSrc,
  type FestDef,
  type FestId,
  type Metric,
} from '../data.ts'

export const FEST_IDS = Object.keys(FESTS) as FestId[]
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const bits = (n: number) => {
  let k = 0
  for (let x = n >>> 0; x; x &= x - 1) k++
  return k
}

// Chỉ số tích luỹ của một tông môn
const METRIC: Record<Metric, (s: State) => number> = {
  power: s => power(s),
  build: s => sum(IDS.map(id => s.levels[id])),
  hall: s => s.levels.chuDien,
  tech: s => sum(TECH_IDS.map(t => s.tech[t] ?? 0)),
  forge: s => sum(GEAR_IDS.map(g => s.gear[g]?.lv ?? 0)),
  elder: s => sum(ELDER_IDS.map(e => (s.elders[e] === undefined ? 0 : elderLevel(s.elders[e])))),
  train: s => s.stats.trained,
  trainPts: s => s.stats.trainPts ?? 0,
  heal: s => s.stats.healed,
  brew: s => s.stats.brewed,
  win: s => s.stats.won,
  hunt: s => s.stats.hunted ?? 0,
  huntLv: s => s.stats.huntLv ?? 0,
  realm: s => sum(s.realms),
  tower: s => s.tower,
  speed: s => s.stats.sped ?? 0,
  draw: s => s.stats.drawn ?? 0,
  raid: s => s.stats.raided ?? 0,
  gather: s => s.stats.gathered ?? 0,
  ally: s => s.stats.allied ?? 0,
  duel: s => s.stats.duels ?? 0,
  duelWin: s => s.stats.duelWins ?? 0,
  kp: s => s.stats.kp ?? 0,
  explore: s => sum(fogOf(s).rows.map(bits)),
  sites: s => s.visited?.length ?? 0,
  chain: s => s.stats.chained ?? 0,
  rescue: s => s.stats.rescued ?? 0,
  runes: s => s.stats.runes ?? 0,
  guards: s => s.stats.guards ?? 0,
  trial: s => s.stats.trial ?? 0,
}
export const metric = (s: State, m: Metric) => METRIC[m](s)

// Giai đoạn thứ mấy trong khung (0 = ngày mở), mã lần mở (đổi mã = sự kiện mới) và lúc đóng (ms); null = đang đóng.
// Tân thủ tính theo từng 24 giờ kể từ lúc lập tông môn; lịch tuần / chu kỳ theo ngày giờ VN.
export function festWindow(
  s: Pick<State, 'born' | 'seasonAt'>,
  d: FestDef,
  t: number,
): { key: number; stage: number; endAt: number } | null {
  const day = dayOf(t)
  const at = (dayNo: number) => dayNo * DAY - DAY_OFFSET // 0h giờ VN của ngày dayNo
  const w = d.window
  if (w.kind === 'newbie') {
    if (s.born === undefined) return null
    const i = Math.floor((t - s.born) / DAY)
    return i >= w.from && i <= w.to ? { key: 0, stage: i - w.from, endAt: s.born + (w.to + 1) * DAY } : null
  }
  if (w.kind === 'season') {
    if (s.seasonAt === undefined) return null
    const i = Math.floor((t - s.seasonAt) / DAY)
    const key = Math.floor(s.seasonAt / DAY) // mỗi mùa một lượt
    return i >= w.from && i <= w.to ? { key, stage: i - w.from, endAt: s.seasonAt + (w.to + 1) * DAY } : null
  }
  if (w.kind === 'week') {
    const wd = (((day - 4) % 7) + 7) % 7 // 0 = thứ Hai (ngày 4 kể từ 1/1/1970 là thứ Hai)
    if (!w.days.includes(wd)) return null
    return { key: weekOf(t), stage: w.days.indexOf(wd), endAt: at(day - wd + Math.max(...w.days) + 1) }
  }
  if (w.kind === 'dates') {
    const from = w.from.find(f => f <= day && day < f + w.len)
    return from === undefined ? null : { key: from, stage: day - from, endAt: at(from + w.len) }
  }
  const k = day - w.offset
  const i = ((k % w.every) + w.every) % w.every
  return i < w.len ? { key: Math.floor(k / w.every), stage: i, endAt: at(day - i + w.len) } : null
}

// Lễ may rủi (vòng quà, bàn xúc xắc): kiếm lệnh từ việc trong lễ, mỗi ngày một lượt miễn phí, kết quả theo mầm server
export const luck = (d: FestDef): d is Extract<FestDef, { kind: 'wheel' | 'dice' }> =>
  d.kind === 'wheel' || d.kind === 'dice'
const used = (d: FestDef): Metric[] => {
  if (d.kind === 'tasks' || d.kind === 'activity') return [...new Set(d.tasks.map(x => x.m))]
  return d.kind === 'points' || d.kind === 'shop' || luck(d)
    ? [...new Set(d.stages.flatMap(st => Object.keys(st) as Metric[]))]
    : []
}
const snap = (s: State, d: FestDef) => Object.fromEntries(used(d).map(m => [m, metric(s, m)])) as Fest['base']
// Điểm giai đoạn đang chạy (chưa dồn vào bank)
function stagePts(s: State, d: FestDef, f: Fest) {
  if (d.kind !== 'points' && d.kind !== 'shop' && !luck(d)) return 0
  const w = d.stages[Math.min(f.stage, d.stages.length - 1)]
  return sum(
    (Object.keys(w) as Metric[]).map(m => Math.floor((w[m] ?? 0) * Math.max(0, metric(s, m) - (f.base[m] ?? 0)))),
  )
}

// Dồn điểm giai đoạn đang chạy vào bank; lễ FEST_STAGED ghi thêm điểm riêng của ải đó (bảng xếp hạng ải)
function bankStage(s: State, id: FestId, f: Fest): Fest {
  const n = stagePts(s, FESTS[id], f)
  if (!(FEST_STAGED as readonly FestId[]).includes(id)) return { ...f, bank: f.bank + n }
  return { ...f, bank: f.bank + n, sp: [...Array(f.stage)].map((_, k) => f.sp?.[k] ?? 0).concat(n) }
}
// Mở sự kiện mới (chụp chỉ số), sang giai đoạn mới (dồn điểm giai đoạn trước), hết lượt thì khoá điểm (việc làm sau giờ đóng — trước
// lúc server trao quà bảng xếp hạng — không tính)
export function rollFest(s: State, t: number): State {
  let fest = s.fest
  for (const id of FEST_IDS) {
    const d = FESTS[id]
    const w = festWindow(s, d, t)
    const cur = fest[id]
    let f: Fest
    if (!w) {
      if (!cur || cur.shut) continue
      f = { ...bankStage(s, id, cur), shut: true }
    } else if (!cur || cur.key !== w.key)
      f = { key: w.key, stage: w.stage, base: snap(s, d), bank: 0, got: [], days: 0, last: -1 }
    else if (cur.stage !== w.stage || cur.shut) {
      const { shut, ...c } = cur // mở lại cùng lượt (khung ngày có quãng nghỉ): điểm đã dồn lúc đóng
      f = { ...(shut ? c : bankStage(s, id, c)), stage: w.stage, base: snap(s, d) }
    } else continue
    fest = { ...fest, [id]: f }
  }
  return fest === s.fest ? s : { ...s, fest }
}
// Người chơi vào game hôm nay (thao tác login, client gửi mỗi lần vào): mỗi sự kiện đăng nhập đang mở đếm thêm một ngày.
// Không đếm trong advance(): server còn đưa state tới trước lúc xử lý trận, việc hẹn giờ… ngay cả khi người chơi vắng.
export function festLogin(s: State, t: number): State {
  const day = dayOf(t)
  let fest = s.fest
  for (const id of FEST_IDS) {
    const f = fest[id]
    if (FESTS[id].kind !== 'login' || !f || f.last === day || !festWindow(s, FESTS[id], t)) continue
    fest = { ...fest, [id]: { ...f, days: f.days + 1, last: day } }
  }
  return fest === s.fest ? s : { ...s, fest }
}

// Lịch n ngày tới (như Event Calendar của RoK): mỗi ngày giờ VN một danh sách sự kiện mở hôm đó, đủ tầng hiện tại
export function festCalendar(s: State, t: number, n = 7): { day: number; ids: FestId[] }[] {
  return Array.from({ length: n }, (_, k) => {
    const day = dayOf(t) + k
    const noon = day * DAY - DAY_OFFSET + DAY / 2
    const at = k ? noon : t // hôm nay: đúng lúc này (sự kiện tân thủ tính theo giờ)
    return {
      day,
      ids: FEST_IDS.filter(id => s.levels.chuDien >= (FESTS[id].hall ?? 1) && festWindow(s, FESTS[id], at)),
    }
  })
}
// Lễ rơi đồ (kind 'drop', như Strategic Reserve): việc nền src có xác suất rơi Linh Nang — +1 điểm lễ, quà nhỏ tới qua thư. Mầm của
// server (client nhận mầm 0: không đoán, chờ server báo)
export function festDrop(s: State, src: DropSrc, seed: number, t: number): State {
  if (!seed) return s
  let st = s
  FEST_IDS.forEach((id, k) => {
    const d = FESTS[id]
    if (d.kind !== 'drop' || !festOpen(st, id, t)) return
    if (nextSeed((seed ^ Math.imul(k + 1, 0x9e3779b1)) >>> 0) / 2 ** 32 >= (d.chance[src] ?? 0)) return
    const f = st.fest[id]!
    st = { ...st, fest: { ...st.fest, [id]: { ...f, bank: f.bank + 1 } } }
    st = mail(st, { at: t, k: 'drop', a: [id, f.bank + 1], gift: d.gift })
  })
  return st
}
// Trưởng lão của đợt ở lượt key (mỗi người 4 lượt liền rồi đổi); không có: lễ này không có
export const festStar = (id: FestId, key: number) => {
  const xs = FEST_STAR[id]
  return xs?.[Math.floor(key / 4) % xs.length]
}
// Lễ theo lịch (không phải lễ tân thủ): lượt (key) và giai đoạn đang mở lúc t, hay mã lượt (-1 khi đang đóng). seasonAt: lúc mở
// mùa của giới (lễ theo ngày mùa)
export const festAt = (id: FestId, t: number, seasonAt?: number) => festWindow({ seasonAt }, FESTS[id], t)
export const festKey = (id: FestId, t: number, seasonAt?: number) => festAt(id, t, seasonAt)?.key ?? -1
// Mã các lượt lễ id kết thúc trong (from, to] — lật tuần, server trao quà bảng xếp hạng mỗi lượt đúng một lần
export function festEnded(id: FestId, from: number, to: number, seasonAt?: number): number[] {
  const keys: number[] = []
  for (let t = from - 30 * DAY; t <= to; t += DAY) {
    const w = festWindow({ seasonAt }, FESTS[id], t)
    if (w && w.endAt > from && w.endAt <= to && !keys.includes(w.key)) keys.push(w.key)
  }
  return keys
}
// Lúc sự kiện đang mở kết thúc (ms); 0 = không mở
export const festEnds = (s: State, id: FestId, t: number) => festWindow(s, FESTS[id], t)?.endAt ?? 0
// Sự kiện đang mở (và đủ tầng) lúc t; state phải đã advance tới t
export const festOpen = (s: State, id: FestId, t: number) => {
  const d = FESTS[id]
  const w = festWindow(s, d, t)
  return !!w && s.levels.chuDien >= (d.hall ?? 1) && s.fest[id]?.key === w.key
}
export const festPoints = (s: State, id: FestId) => {
  const f = s.fest[id]
  const d = FESTS[id]
  if (!f) return 0
  // hoạt lực: tổng điểm các việc đã xong trong lượt này
  if (d.kind === 'activity') return sum(d.tasks.map(x => (festProgress(s, id, x.m) >= x.n ? x.pts : 0)))
  return f.bank + (f.shut ? 0 : stagePts(s, d, f))
}
// Điểm riêng của ải k trong lượt đang giữ (lễ FEST_STAGED): ải đang chạy tính sống, ải đã xong lấy bản ghi
export function festStagePts(s: State, id: FestId, k: number) {
  const f = s.fest[id]
  if (!f) return 0
  return f.stage === k && !f.shut ? stagePts(s, FESTS[id], f) : (f.sp?.[k] ?? 0)
}
// Tiến độ một chỉ số từ lúc mở lượt này (việc của sự kiện tasks)
export const festProgress = (s: State, id: FestId, m: Metric) =>
  Math.max(0, metric(s, m) - (s.fest[id]?.base[m] ?? metric(s, m)))
// Giá trị so với đích của một việc: tuyệt đối (abs: đạt tầng n) hay tăng thêm từ lúc mở
export const festValue = (s: State, id: FestId, m: Metric) => {
  const d = FESTS[id]
  return d.kind === 'tasks' && d.abs ? metric(s, m) : festProgress(s, id, m)
}

// Kho đổi: số lần đã đổi món i, lệnh bài còn lại (kiếm được − đã tiêu)
export const festBought = (s: State, id: FestId, i: number) => s.fest[id]?.got.filter(x => x === i).length ?? 0
export function festTokens(s: State, id: FestId) {
  const d = FESTS[id]
  const f = s.fest[id]
  // vòng quà / bàn xúc xắc: got — các ô trúng / mặt đã đổ, days — số lượt miễn phí đã dùng
  if (luck(d)) return festPoints(s, id) - d.cost * ((f?.got.length ?? 0) - (f?.days ?? 0))
  if (d.kind !== 'shop') return 0
  return festPoints(s, id) - sum((f?.got ?? []).map(i => d.shop[i]?.price ?? 0))
}
// Vòng quà: hôm nay còn lượt miễn phí (last — ngày đã quay miễn phí), trưởng lão chủ lễ của lượt lễ này
export const wheelFree = (s: State, id: FestId, t: number) => festOpen(s, id, t) && s.fest[id]?.last !== dayOf(t)
// Bàn xúc xắc: ô đang đứng và số vòng đã đi (got — các mặt đã đổ)
export function diceAt(s: State, id: FestId) {
  const d = FESTS[id]
  const n = sum(s.fest[id]?.got ?? [])
  const len = d.kind === 'dice' ? d.board.length : 1
  return { pos: n % len, laps: Math.floor(n / len) }
}
export function wheelElder(s: State, id: FestId) {
  const d = FESTS[id]
  return d.kind === 'wheel' ? d.elders[(s.fest[id]?.key ?? 0) % d.elders.length] : undefined
}
// Phần quà i nhận được chưa (chưa tính đã nhận). Kho đổi: đủ lệnh bài và chưa hết hạn mức
export function festDone(s: State, id: FestId, i: number) {
  const d = FESTS[id]
  const f = s.fest[id]
  if (!f) return false
  if (d.kind === 'login') return i < Math.min(f.days, d.rewards.length)
  if (d.kind === 'tasks') {
    const t = d.tasks[i]
    if (t) return (t.day ?? 0) <= f.stage && festValue(s, id, t.m) >= t.n // việc mở theo ngày
    const c = d.chests?.[i - d.tasks.length] // rương theo số việc đã nhận quà
    return !!c && f.got.filter(k => k < d.tasks.length).length >= c.need
  }
  if (d.kind === 'shop') return !!d.shop[i] && festTokens(s, id) >= d.shop[i].price
  if (luck(d)) return false // vòng quà, bàn xúc xắc: không có quà nhận, chỉ quay / đổ
  return i < d.goals.length && festPoints(s, id) >= d.goals[i] // tích điểm, hoạt lực
}
// Đã nhận hết (kho đổi: đổi đủ max lần)
export function festGot(s: State, id: FestId, i: number) {
  const d = FESTS[id]
  return d.kind === 'shop' ? festBought(s, id, i) >= (d.shop[i]?.max ?? 0) : !!s.fest[id]?.got.includes(i)
}
export const festRewards = (id: FestId) => {
  const d = FESTS[id]
  if (d.kind === 'shop') return d.shop.map(x => x.reward)
  if (luck(d)) return []
  return d.kind === 'tasks' ? [...d.tasks.map(x => x.reward), ...(d.chests ?? []).map(c => c.reward)] : d.rewards
}
// Số quà đang chờ nhận ở mọi sự kiện đang mở của một bảng — chấm đỏ trên nút Sự kiện (bảng mặc định) hay Nhiệm vụ ngày
// (kho đổi tính một chấm khi có món đổi được)
export const festReady = (s: State, t: number, panel?: 'daily') =>
  FEST_IDS.filter(id => FESTS[id].panel === panel && festOpen(s, id, t)).reduce((n, id) => {
    const k = festRewards(id).filter((_, i) => festDone(s, id, i) && !festGot(s, id, i)).length
    if (luck(FESTS[id])) return n + (wheelFree(s, id, t) ? 1 : 0) // chấm đỏ: còn lượt quay / đổ miễn phí
    return n + (FESTS[id].kind === 'shop' ? Math.min(1, k) : k)
  }, 0)

// Tu Tiên Lệnh: cộng điểm lệnh (rương Nhật Khóa, nhiệm vụ tuần); cấp lệnh đang có
export const passXp = (s: State, n: number): State => ({
  ...s,
  pass: { got: [], gold: [], ...s.pass, xp: (s.pass?.xp ?? 0) + n },
})
export const passLevel = (s: State) => Math.min(PASS_LEVELS, Math.floor((s.pass?.xp ?? 0) / PASS_STEP))
