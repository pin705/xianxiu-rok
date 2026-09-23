import {
  BASE_CAP, BUILDINGS, CAP_GROWTH, COST_GROWTH, MAX_LEVEL, QUEUE_SIZE, RESOURCES, START, TIME_GROWTH,
  type Bag, type BuildingId, type Res,
} from './data.ts'

export * from './data.ts'

// Luật game thuần: không I/O, không tự đọc đồng hồ — thời gian (ms) luôn được truyền vào.
// Client và server chạy chung đúng file này.

export type Job = { building: BuildingId; level: number; finishAt: number }

export type State = {
  v: 1                               // phiên bản save
  time: number                       // tài nguyên đã tính tới mốc này
  res: Bag
  carry: Bag                         // phần lẻ chưa đủ 1 đơn vị (đơn vị × ms), để kết quả không phụ thuộc số lần gọi advance
  levels: Record<BuildingId, number>
  queue: Job[]
}

export type Action = { type: 'upgrade'; building: BuildingId }
export type Err = 'max_level' | 'need_main_hall' | 'busy' | 'queue_full' | 'not_enough'
export type Result = { ok: true; state: State } | { ok: false; error: Err }

const HOUR = 3_600_000
export const IDS = Object.keys(BUILDINGS) as BuildingId[]
const bag = (f: (r: Res) => number) => Object.fromEntries(RESOURCES.map(r => [r, f(r)])) as Bag

// Nhân lặp thay cho Math.pow: phép nhân IEEE cho cùng kết quả trên mọi engine, pow thì không chắc.
function grow(base: number, factor: number, times: number) {
  let v = base
  for (let i = 0; i < times; i++) v *= factor
  return Math.round(v)
}

export function newGame(now: number): State {
  const levels = Object.fromEntries(IDS.map(id => [id, 0])) as Record<BuildingId, number>
  levels.chuDien = 1
  return { v: 1, time: now, res: { ...START }, carry: bag(() => 0), levels, queue: [] }
}

export const cost = (b: BuildingId, level: number) => bag(r => grow(BUILDINGS[b].cost[r], COST_GROWTH, level - 1))
export const buildTime = (b: BuildingId, level: number) => grow(BUILDINGS[b].time, TIME_GROWTH, level - 1) * 1000
export const capAt = (vaultLevel: number) => grow(BASE_CAP, CAP_GROWTH, vaultLevel)
export const storage = (s: State) => capAt(s.levels.tangBaoCac)
export const rate = (s: State, r: Res) =>
  IDS.reduce((sum, id) => (BUILDINGS[id].makes === r ? sum + (BUILDINGS[id].rate ?? 0) * s.levels[id] : sum), 0)

function accrue(s: State, t: number): State {
  const dt = t - s.time
  if (dt <= 0) return s // đồng hồ lùi: đứng yên chờ, không trừ
  const cap = storage(s)
  const res = { ...s.res }
  const carry = { ...s.carry }
  for (const r of RESOURCES) {
    const total = rate(s, r) * dt + carry[r]
    const gained = Math.floor(total / HOUR)
    if (res[r] + gained >= cap) {
      res[r] = Math.max(res[r], cap) // đầy kho thì ngừng sản xuất, nhưng không cắt phần đang vượt
      carry[r] = 0
    } else {
      res[r] += gained
      carry[r] = total % HOUR
    }
  }
  return { ...s, time: t, res, carry }
}

// Đưa state tới thời điểm now. Công trình xong theo đúng thứ tự thời gian:
// sản lượng trước lúc xong tính theo tầng cũ, sau đó theo tầng mới.
export function advance(s: State, now: number): State {
  const due = s.queue.filter(j => j.finishAt <= now).sort((a, b) => a.finishAt - b.finishAt)
  let state = s
  for (const job of due) {
    state = accrue(state, job.finishAt)
    state = { ...state, levels: { ...state.levels, [job.building]: job.level } }
  }
  if (due.length) state = { ...state, queue: s.queue.filter(j => j.finishAt > now) }
  return accrue(state, now)
}

// ponytail: Chủ điện chưa cần độ kiếp — tầng 5→6 và 10→11 sẽ phải vượt lôi kiếp (P1 mốc 1.3).
export function upgradeError(s: State, b: BuildingId): Err | null {
  const level = s.levels[b] + 1
  if (level > MAX_LEVEL) return 'max_level'
  if (b !== 'chuDien' && s.levels.chuDien < Math.max(level, BUILDINGS[b].unlock)) return 'need_main_hall'
  if (s.queue.some(j => j.building === b)) return 'busy'
  if (s.queue.length >= QUEUE_SIZE) return 'queue_full'
  const c = cost(b, level)
  if (RESOURCES.some(r => s.res[r] < c[r])) return 'not_enough'
  return null
}

export function apply(s: State, a: Action, now: number): Result {
  const state = advance(s, now)
  const error = upgradeError(state, a.building)
  if (error) return { ok: false, error }
  const level = state.levels[a.building] + 1
  const c = cost(a.building, level)
  const job = { building: a.building, level, finishAt: state.time + buildTime(a.building, level) }
  return { ok: true, state: { ...state, res: bag(r => state.res[r] - c[r]), queue: [...state.queue, job] } }
}
