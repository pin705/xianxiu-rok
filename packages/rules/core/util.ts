// Tiện ích thuần không cần State: danh sách id, phép cộng trừ túi tài nguyên / quân, nhân lặp tất định.
import { type Army, type Items, type Troops } from './types.ts'
import {
  BUILDINGS,
  ELDERS,
  GEAR,
  KNEE,
  PILLS,
  RATE_HIGH,
  RESOURCES,
  TECHS,
  UNITS,
  type Bag,
  type BuildingId,
  type ElderId,
  type GearId,
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
export const GEAR_IDS = Object.keys(GEAR) as GearId[]
export const bag = (f: (r: Res) => number) => Object.fromEntries(RESOURCES.map(r => [r, f(r)])) as Bag
export const troops = (f: (u: UnitId) => number) => Object.fromEntries(UNITS.map(u => [u, f(u)])) as Troops
export const count = (a: Army) => UNITS.reduce((sum, u) => sum + (a[u] ?? 0), 0)
export const plus = (a: Troops, b: Army) => troops(u => a[u] + (b[u] ?? 0))
export const minus = (a: Troops, b: Army) => troops(u => a[u] - (b[u] ?? 0))
export const addBag = (a: Bag, b: Partial<Bag>) => bag(r => a[r] + (b[r] ?? 0))
export const addItems = (a: Items, b: Items) =>
  Object.fromEntries(PILL_IDS.map(p => [p, (a[p] ?? 0) + (b[p] ?? 0)])) as Items
export const afford = (have: Bag, c: Bag) => RESOURCES.every(r => have[r] >= c[r])
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
