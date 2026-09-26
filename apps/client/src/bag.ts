// Túi đồ: tên, mệnh giá, nhóm tab của vật phẩm; phù nào rút ngắn được việc nào.
import { BAG, BAG_IDS, bagFamily, type BagId, type JobKind, type State } from '@rok/rules'
import { L } from './lib'

export type BagTab = 'speed' | 'res' | 'buff' | 'other'
const TAB_OF = {
  speed: 'speed',
  res: 'res',
  buff: 'buff',
  shield: 'buff',
  exp: 'other',
  key: 'other',
  builder: 'other',
  vip: 'other',
  ap: 'other',
  ticket: 'other',
  map: 'other',
  douse: 'other',
  move: 'other',
  rename: 'other',
  veil: 'buff',
  frag: 'other',
  swap: 'other',
  pick: 'res',
} as const satisfies Record<(typeof BAG)[BagId]['use'], BagTab>
export const BAG_TABS: BagTab[] = ['speed', 'res', 'buff', 'other']
export const tabOf = (id: BagId): BagTab => TAB_OF[BAG[id].use]

export function denom(id: BagId) {
  const d = BAG[id]
  if (d.use === 'speed') return L.bag.denom.min(d.min)
  if (d.use === 'buff' || d.use === 'shield' || d.use === 'builder' || d.use === 'veil')
    return L.bag.denom.hours(d.hours)
  return d.use === 'key' ||
    d.use === 'ticket' ||
    d.use === 'douse' ||
    d.use === 'move' ||
    d.use === 'rename' ||
    d.use === 'frag' ||
    d.use === 'swap'
    ? ''
    : L.bag.denom.n(d.n)
}
export const itemName = (id: BagId) => [L.bag.family[bagFamily(id)].name, denom(id)].filter(Boolean).join(' · ')

// Phù rút ngắn được việc k (đang có trong túi), mệnh giá nhỏ trước — dùng phù nhỏ trước cho đỡ phí
export const speedsFor = (s: State, k: JobKind) =>
  BAG_IDS.filter(id => {
    const d = BAG[id]
    return d.use === 'speed' && (!d.job || d.job === k) && (s.items[id] ?? 0) > 0
  }).sort((a, b) => speedMin(a) - speedMin(b))
export const speedMin = (id: BagId) => {
  const d = BAG[id]
  return d.use === 'speed' ? d.min : 0
}
export const owned = (s: State) => BAG_IDS.filter(id => (s.items[id] ?? 0) > 0)

// "Dùng vừa đủ": tổ hợp phù / đan để xong việc — mệnh giá lớn trước, không vượt thời gian còn lại; phần lẻ cuối dùng một cái
// nhỏ nhất còn lại (cái nào còn trong kho cũng đủ che phần lẻ). Hết đồ mà chưa xong thì rest > 0.
// ponytail: tham lam, không tối ưu tuyệt đối lượng phí — đủ cho vài mệnh giá cố định
export type SpeedStock = { id: string; ms: number; have: number }
export function speedPlan(stock: SpeedStock[], left: number): { use: [SpeedStock, number][]; rest: number } {
  const big = [...stock].sort((a, b) => b.ms - a.ms)
  const use = new Map<SpeedStock, number>()
  let rest = left
  for (const s of big) {
    const n = Math.min(s.have, Math.floor(rest / s.ms))
    if (n > 0) use.set(s, n)
    rest -= n * s.ms
  }
  const cover = rest > 0 ? [...big].reverse().find(s => s.have > (use.get(s) ?? 0)) : undefined
  if (cover) {
    use.set(cover, (use.get(cover) ?? 0) + 1)
    rest = 0
  }
  return { use: big.filter(s => use.has(s)).map(s => [s, use.get(s)!]), rest: Math.max(0, rest) }
}
