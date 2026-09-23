// Số tạm để chơi thử. Sau này sinh từ sheet và chỉnh nhịp bằng simulate.

export const RESOURCES = ['linhThach', 'linhThao', 'linhKhoang'] as const
export type Res = (typeof RESOURCES)[number]
export type Bag = Record<Res, number>

export const MAX_LEVEL = 15
export const QUEUE_SIZE = 1
export const START: Bag = { linhThach: 1000, linhThao: 1000, linhKhoang: 1000 }
export const BASE_CAP = 2000   // sức chứa mỗi loại khi chưa có Tàng Bảo Các
export const CAP_GROWTH = 1.3  // mỗi tầng Tàng Bảo Các
export const COST_GROWTH = 1.6 // mỗi tầng công trình
export const TIME_GROWTH = 1.7

export type BuildingDef = {
  unlock: number // tầng Chủ điện cần để xây
  cost: Bag      // chi phí lên tầng 1, tầng sau nhân COST_GROWTH
  time: number   // giây lên tầng 1, tầng sau nhân TIME_GROWTH
  makes?: Res    // tài nguyên sản xuất
  rate?: number  // sản lượng mỗi giờ, cho mỗi tầng
}

// Chủ điện bắt đầu ở tầng 1, nên lần nâng đầu là lên tầng 2.
const defs = {
  chuDien:      { unlock: 1, time: 60, cost: { linhThach: 100, linhThao: 100, linhKhoang: 100 } },
  tuLinhTran:   { unlock: 1, time: 10, cost: { linhThach: 0, linhThao: 80, linhKhoang: 80 }, makes: 'linhThach', rate: 600 },
  linhDien:     { unlock: 1, time: 10, cost: { linhThach: 80, linhThao: 0, linhKhoang: 80 }, makes: 'linhThao', rate: 600 },
  khoangMach:   { unlock: 1, time: 10, cost: { linhThach: 80, linhThao: 80, linhKhoang: 0 }, makes: 'linhKhoang', rate: 600 },
  tangBaoCac:   { unlock: 2, time: 20, cost: { linhThach: 100, linhThao: 60, linhKhoang: 100 } },
  dienVoTruong: { unlock: 2, time: 30, cost: { linhThach: 120, linhThao: 120, linhKhoang: 60 } },
  tangKinhCac:  { unlock: 4, time: 45, cost: { linhThach: 150, linhThao: 80, linhKhoang: 150 } },
  danPhong:     { unlock: 4, time: 45, cost: { linhThach: 100, linhThao: 150, linhKhoang: 100 } },
} satisfies Record<string, BuildingDef>

export type BuildingId = keyof typeof defs
export const BUILDINGS: Record<BuildingId, BuildingDef> = defs
