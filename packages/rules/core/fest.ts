// Trung tâm sự kiện: khung giờ, tiến độ, điểm, quà đã nhận của mọi sự kiện trong FESTS (data.ts).
// Tiến độ = chỉ số bây giờ − chỉ số lúc sự kiện (hay giai đoạn) bắt đầu: mọi thao tác tự được tính, không phải gọi từng nơi.
// rollFest chạy trong advance() trước mỗi việc hẹn giờ (như rollDay) nên việc xong trước giờ mở không lọt vào sự kiện mới.
import { dayOf, weekOf } from './calendar.ts'
import { elderLevel, power } from './stats.ts'
import { type Fest, type State } from './types.ts'
import { DAY, ELDER_IDS, GEAR_IDS, IDS, TECH_IDS } from './util.ts'
import { DAY_OFFSET, FESTS, type FestDef, type FestId, type Metric } from '../data.ts'

export const FEST_IDS = Object.keys(FESTS) as FestId[]
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

// Chỉ số tích luỹ của một tông môn
const METRIC: Record<Metric, (s: State) => number> = {
  power: s => power(s),
  build: s => sum(IDS.map(id => s.levels[id])),
  hall: s => s.levels.chuDien,
  tech: s => sum(TECH_IDS.map(t => s.tech[t] ?? 0)),
  forge: s => sum(GEAR_IDS.map(g => s.gear[g]?.lv ?? 0)),
  elder: s => sum(ELDER_IDS.map(e => (s.elders[e] === undefined ? 0 : elderLevel(s.elders[e])))),
  train: s => s.stats.trained,
  heal: s => s.stats.healed,
  brew: s => s.stats.brewed,
  win: s => s.stats.won,
  hunt: s => s.stats.hunted ?? 0,
  realm: s => sum(s.realms),
  tower: s => s.tower,
  speed: s => s.stats.sped ?? 0,
  draw: s => s.stats.drawn ?? 0,
  raid: s => s.stats.raided ?? 0,
  gather: s => s.stats.gathered ?? 0,
  ally: s => s.stats.allied ?? 0,
}
export const metric = (s: State, m: Metric) => METRIC[m](s)

// Giai đoạn thứ mấy trong khung (0 = ngày mở), mã lần mở (đổi mã = sự kiện mới) và lúc đóng (ms); null = đang đóng.
// Tân thủ tính theo từng 24 giờ kể từ lúc lập tông môn; lịch tuần / chu kỳ theo ngày giờ VN.
export function festWindow(s: State, d: FestDef, t: number): { key: number; stage: number; endAt: number } | null {
  const day = dayOf(t)
  const at = (dayNo: number) => dayNo * DAY - DAY_OFFSET // 0h giờ VN của ngày dayNo
  const w = d.window
  if (w.kind === 'newbie') {
    if (s.born === undefined) return null
    const i = Math.floor((t - s.born) / DAY)
    return i >= w.from && i <= w.to ? { key: 0, stage: i - w.from, endAt: s.born + (w.to + 1) * DAY } : null
  }
  if (w.kind === 'week') {
    const wd = (((day - 4) % 7) + 7) % 7 // 0 = thứ Hai (ngày 4 kể từ 1/1/1970 là thứ Hai)
    if (!w.days.includes(wd)) return null
    return { key: weekOf(t), stage: w.days.indexOf(wd), endAt: at(day - wd + Math.max(...w.days) + 1) }
  }
  const k = day - w.offset
  const i = ((k % w.every) + w.every) % w.every
  return i < w.len ? { key: Math.floor(k / w.every), stage: i, endAt: at(day - i + w.len) } : null
}

const used = (d: FestDef): Metric[] => {
  if (d.kind === 'tasks' || d.kind === 'activity') return [...new Set(d.tasks.map(x => x.m))]
  return d.kind === 'points' ? [...new Set(d.stages.flatMap(st => Object.keys(st) as Metric[]))] : []
}
const snap = (s: State, d: FestDef) => Object.fromEntries(used(d).map(m => [m, metric(s, m)])) as Fest['base']
// Điểm giai đoạn đang chạy (chưa dồn vào bank)
function stagePts(s: State, d: FestDef, f: Fest) {
  if (d.kind !== 'points') return 0
  const w = d.stages[Math.min(f.stage, d.stages.length - 1)]
  return sum(
    (Object.keys(w) as Metric[]).map(m => Math.floor((w[m] ?? 0) * Math.max(0, metric(s, m) - (f.base[m] ?? 0)))),
  )
}

// Mở sự kiện mới (chụp chỉ số), sang giai đoạn mới (dồn điểm giai đoạn trước)
export function rollFest(s: State, t: number): State {
  let fest = s.fest
  for (const id of FEST_IDS) {
    const d = FESTS[id]
    const w = festWindow(s, d, t)
    if (!w) continue
    const cur = fest[id]
    let f: Fest
    if (!cur || cur.key !== w.key)
      f = { key: w.key, stage: w.stage, base: snap(s, d), bank: 0, got: [], days: 0, last: -1 }
    else if (cur.stage !== w.stage)
      f = { ...cur, stage: w.stage, bank: cur.bank + stagePts(s, d, cur), base: snap(s, d) }
    else continue
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
    return { day, ids: FEST_IDS.filter(id => s.levels.chuDien >= (FESTS[id].hall ?? 1) && festWindow(s, FESTS[id], at)) }
  })
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
  return f.bank + stagePts(s, d, f)
}
// Tiến độ một chỉ số từ lúc mở lượt này (việc của sự kiện tasks)
export const festProgress = (s: State, id: FestId, m: Metric) =>
  Math.max(0, metric(s, m) - (s.fest[id]?.base[m] ?? metric(s, m)))
// Giá trị so với đích của một việc: tuyệt đối (abs: đạt tầng n) hay tăng thêm từ lúc mở
export const festValue = (s: State, id: FestId, m: Metric) => {
  const d = FESTS[id]
  return d.kind === 'tasks' && d.abs ? metric(s, m) : festProgress(s, id, m)
}

// Phần quà i nhận được chưa (chưa tính đã nhận)
export function festDone(s: State, id: FestId, i: number) {
  const d = FESTS[id]
  const f = s.fest[id]
  if (!f) return false
  if (d.kind === 'login') return i < Math.min(f.days, d.rewards.length)
  if (d.kind === 'tasks') return !!d.tasks[i] && festValue(s, id, d.tasks[i].m) >= d.tasks[i].n
  return i < d.goals.length && festPoints(s, id) >= d.goals[i] // tích điểm, hoạt lực
}
export const festRewards = (id: FestId) => {
  const d = FESTS[id]
  return d.kind === 'tasks' ? d.tasks.map(x => x.reward) : d.rewards
}
// Số quà đang chờ nhận ở mọi sự kiện đang mở của một bảng — chấm đỏ trên nút Sự kiện (bảng mặc định) hay Nhiệm vụ ngày
export const festReady = (s: State, t: number, panel?: 'daily') =>
  FEST_IDS.filter(id => FESTS[id].panel === panel && festOpen(s, id, t)).reduce(
    (n, id) => n + festRewards(id).filter((_, i) => festDone(s, id, i) && !s.fest[id]!.got.includes(i)).length,
    0,
  )
