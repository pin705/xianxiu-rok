// Bố cục cảnh núi (hệ toạ độ 400 × 860 DU). Dùng chung cho cảnh WebGL và lớp HTML đè lên (biển tên, đồng hồ).
import type { BuildingId } from '@rok/rules'

export const HOME = { w: 400, h: 860 }

// Chân công trình và bề ngang vùng chạm
export const SLOT: Record<BuildingId, [number, number, number]> = {
  chuDien: [200, 312, 120],
  tangKinhCac: [92, 412, 70],
  danPhong: [314, 418, 96],
  tangBaoCac: [80, 512, 80],
  dienVoTruong: [236, 514, 124],
  tuLinhTran: [142, 616, 104],
  khoangMach: [326, 624, 120],
  linhDien: [118, 718, 128],
}

// Đỉnh núi có mặt bằng: tâm x, y mép trước, bề ngang mặt bằng, độ sâu tới lúc tan vào sương, seed
export const LEDGES: [number, number, number, number, number][] = [
  [200, 312, 176, 92, 3],
  [92, 412, 150, 84, 7],
  [312, 418, 146, 80, 11],
  [168, 514, 316, 92, 5],
  [142, 616, 206, 86, 13],
  [122, 718, 232, 96, 17],
]

// Dải sương giữa các tầng: y, độ cao, tốc độ trôi (DU/giây), độ đậm
export const MISTS: [number, number, number, number][] = [
  [376, 60, 4, 0.9],
  [470, 62, -3, 0.95],
  [572, 58, 5, 0.9],
  [676, 62, -4, 0.95],
  [778, 64, 3, 0.95],
  [846, 70, -2, 0.9],
]

export const PINES: [number, number, number, number][] = [
  [268, 306, 1, 2],
  [24, 410, 0.9, 5],
  [368, 516, 0.8, 8],
  [240, 612, 0.9, 11],
  [14, 716, 1, 14],
]
