// Tiện ích thuần không cần State: danh sách id, phép cộng trừ túi tài nguyên / quân, nhân lặp tất định.
import { type Army, type Gain, type Items, type Troops } from './types.ts'
import {
  BUILDINGS,
  ELDERS,
  GEAR,
  BAG,
  KNEE,
  PILLS,
  RATE_HIGH,
  RESOURCES,
  TECHS,
  TYPES,
  UNITS,
  type Bag,
  type BuildingId,
  type ElderId,
  type GearId,
  type BagFamily,
  type BagId,
  type ItemId,
  type PillId,
  type Res,
  type TechId,
  type UnitId,
} from '../data.ts'

export const HOUR = 3_600_000
export const DAY = 86_400_000
export const IDS = Object.keys(BUILDINGS) as BuildingId[]
export const TECH_IDS = Object.keys(TECHS) as TechId[]
export const ELDER_IDS = Object.keys(ELDERS) as ElderId[]
export const PILL_IDS = Object.keys(PILLS) as PillId[]
export const BAG_IDS = Object.keys(BAG) as BagId[]
export const ITEM_IDS: ItemId[] = [...PILL_IDS, ...BAG_IDS]
export const isPill = (i: ItemId): i is PillId => Object.hasOwn(PILLS, i)
export const bagFamily = (i: BagId) => i.replace(/\d+k?$/, '') as BagFamily
export const GEAR_IDS = Object.keys(GEAR) as GearId[]
export const bag = (f: (r: Res) => number) => Object.fromEntries(RESOURCES.map(r => [r, f(r)])) as Bag
export const troops = (f: (u: UnitId) => number) => Object.fromEntries(UNITS.map(u => [u, f(u)])) as Troops
export const count = (a: Army) => UNITS.reduce((sum, u) => sum + (a[u] ?? 0), 0)
// hệ chính của đội: hệ đông đệ tử nhất
export const mainType = (a: Army) =>
  TYPES.reduce((best, t) => {
    const n = (x: string) => UNITS.filter(u => u.startsWith(x)).reduce((k, u) => k + (a[u] ?? 0), 0)
    return n(t) > n(best) ? t : best
  })
export const plus = (a: Troops, b: Army) => troops(u => a[u] + (b[u] ?? 0))
export const minus = (a: Troops, b: Army) => troops(u => a[u] - (b[u] ?? 0))
export const addBag = (a: Bag, b: Partial<Bag>) => bag(r => a[r] + (b[r] ?? 0))
// Đan luôn có mặt (kể cả 0) như trước; vật phẩm túi đồ chỉ có mặt khi đã từng có
export const addItems = (a: Items, b: Items) =>
  Object.fromEntries(
    ITEM_IDS.flatMap(i => {
      const n = (a[i] ?? 0) + (b[i] ?? 0)
      return n || isPill(i) || i in a ? [[i, n]] : []
    }),
  ) as Items
export const afford = (have: Bag, c: Bag) => RESOURCES.every(r => have[r] >= c[r])
// Đội gọn: chỉ các loại có người, theo thứ tự UNITS
export const compact = (a: Army) => Object.fromEntries(UNITS.filter(u => (a[u] ?? 0) > 0).map(u => [u, a[u]!])) as Army
export const noGain = (): Gain => ({ res: {}, items: {}, exp: 0 })
// Danh sách "đã nhận": đánh dấu thêm mục i
export const mark = (got: boolean[], i: number) => got.map((x, k) => x || k === i)
// Mầm 0 = "ẩn": máy này không biết mầm thật (client nhận state từ server với mọi seed = 0), nên không tự giải trận.
// 0 sinh ra 0; mầm khác 0 không bao giờ sinh ra 0.
export const nextSeed = (seed: number) => (seed ? (Math.imul(seed, 1664525) + 1013904223) >>> 0 || 1 : 0)

// Nhân lặp thay cho Math.pow: phép nhân IEEE cho cùng kết quả trên mọi engine, pow thì không chắc.
export function grow(base: number, factor: number, times: number) {
  let v = base
  for (let i = 0; i < times; i++) v *= factor
  return Math.round(v)
}
// Hai đoạn: tới tầng KNEE nhân f (số P1 giữ nguyên từng đơn vị), trên đó nhân f2
export function climb(base: number, f: number, f2: number, times: number) {
  let v = base
  for (let i = 0; i < times; i++) v *= i < KNEE - 1 ? f : f2
  return Math.round(v)
}
// Tầng trên KNEE sinh RATE_HIGH lần tầng thấp
export const rateLevels = (l: number) => (l <= KNEE ? l : KNEE + (l - KNEE) * RATE_HIGH)
