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
} as const satisfies Record<(typeof BAG)[BagId]['use'], BagTab>
export const BAG_TABS: BagTab[] = ['speed', 'res', 'buff', 'other']
export const tabOf = (id: BagId): BagTab => TAB_OF[BAG[id].use]

export function denom(id: BagId) {
  const d = BAG[id]
  if (d.use === 'speed') return L.bag.denom.min(d.min)
  if (d.use === 'buff' || d.use === 'shield' || d.use === 'builder') return L.bag.denom.hours(d.hours)
  return d.use === 'key' ? '' : L.bag.denom.n(d.n)
}
export const itemName = (id: BagId) => `${L.bag.family[bagFamily(id)].name} · ${denom(id)}`

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
