// Kho minh (Alliance Storehouse của RoK): mỗi ô lãnh thổ sinh TERR_FUND Minh khố mỗi giờ cho tiên minh — mở rộng lãnh thổ thì
// thêm quỹ cắm cờ / nhập hàng. Chốt theo giờ tròn (advance.ts gọi mỗi nhịp, chỉ tính lãnh thổ khi có minh tới giờ chốt).
import { HOUR } from '../core/util.ts'
import { TERR_FUND } from '../data.ts'
import { put, type MapCtx, type Players, type World } from './base.ts'
import { claimsOf, territoryGrid } from './points.ts'

// Số ô lãnh thổ của từng minh lúc now
export function territoryTiles(ps: Players, w: World, map: MapCtx, now: number): Map<number, number> {
  const tiles = new Map<number, number>()
  for (const o of territoryGrid(claimsOf(ps, w, map.atlas, now))) if (o) tiles.set(o, (tiles.get(o) ?? 0) + 1)
  return tiles
}

export function storeStep(ps: Players, w: World, map: MapCtx, now: number): World {
  const due = Object.values(w.allies).filter(al => al.fundAt === undefined || now - al.fundAt >= HOUR)
  if (!due.length) return w
  const tiles = territoryTiles(ps, w, map, now)
  for (const al of due) {
    const hours = al.fundAt === undefined ? 0 : Math.floor((now - al.fundAt) / HOUR)
    const fund = (al.fund ?? 0) + Math.floor((tiles.get(al.id) ?? 0) * TERR_FUND * hours)
    w = put(w, { ...al, fund, fundAt: al.fundAt === undefined ? now : al.fundAt + hours * HOUR })
  }
  return w
}
