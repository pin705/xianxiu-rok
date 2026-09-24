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
  luyenKhiPhong: [306, 770, 116],
  hoSonDaiTran: [160, 814, 124],
}

// Đỉnh núi có mặt bằng: tâm x, y mép trước, bề ngang mặt bằng, độ sâu tới lúc tan vào sương, seed
export const LEDGES: [number, number, number, number, number][] = [
  [200, 312, 176, 92, 3],
  [92, 412, 150, 84, 7],
  [312, 418, 146, 80, 11],
  [168, 514, 316, 92, 5],
  [142, 616, 206, 86, 13],
  [122, 718, 232, 96, 17],
  [330, 626, 128, 70, 19],
  [308, 770, 150, 66, 23], // Luyện Khí Phòng: mỏm thấp bên phải, dưới Khoáng mạch
  [164, 814, 178, 50, 29], // Hộ Sơn Đại Trận: chân núi, trấn cửa sơn môn
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
  [14, 716, 1, 14],
]

// Bậc đá nối các tầng (từ chân lên đỉnh), vẽ ngay sau tầng núi mà nó leo lên: [đường đi, bề ngang, sau tầng số]
export const STAIRS: [[number, number][], number, number][] = [
  [[[200, 404], [199, 372], [201, 342], [200, 318]], 18, 0], // chính đạo lên Chủ điện
  [[[126, 506], [134, 470], [127, 440], [129, 416]], 13, 1],
  [[[276, 508], [270, 474], [279, 446], [279, 422]], 13, 2],
  [[[150, 606], [158, 574], [149, 544], [150, 518]], 14, 3],
  [[[216, 708], [207, 676], [214, 646], [211, 620]], 14, 4],
]

// Cây cảnh, đèn đá — xếp cùng lớp công trình theo y (gần thì vẽ sau): [loại, x, y chân, cỡ, seed]
export const DECOR: ['blossom' | 'lantern' | 'bamboo', number, number, number, number][] = [
  ['blossom', 126, 309, 0.95, 3],
  ['lantern', 184, 317, 0.9, 1],
  ['lantern', 216, 317, 0.9, 2],
  ['blossom', 158, 410, 0.8, 7],
  ['bamboo', 376, 417, 0.8, 4],
  ['blossom', 22, 512, 1, 11],
  ['lantern', 136, 516, 0.8, 3],
  ['lantern', 165, 516, 0.8, 4],
  ['blossom', 232, 612, 0.9, 13],
  ['bamboo', 244, 717, 0.85, 8],
]
