// Thông Thiên Tháp (tách từ battle.ts): sức địch tầng f (0 = tầng 1), hệ chính đổi theo vòng, thưởng lần đầu
import {
  TOWER_ELDERS,
  TOWER_GROW,
  TOWER_RES,
  TOWER_RES_GROW,
  TOWER_STR,
  TYPES,
  type Reward,
  type UnitType,
} from '../data.ts'
import { bag, grow } from './util.ts'

export const towerStr = (f: number) => grow(TOWER_STR, TOWER_GROW, f)
export const towerType = (f: number): UnitType => TYPES[f % TYPES.length]
export function towerReward(f: number): Reward {
  const n = f + 1
  return {
    res: bag(() => grow(TOWER_RES, TOWER_RES_GROW, f)),
    items: n % 10 === 0 ? { doKiep: 1, boiNguyen: 1 } : n % 5 === 0 ? { tuKhi: 3 } : undefined,
    elder: TOWER_ELDERS[n],
    exp: 300 + 40 * f,
  }
}
