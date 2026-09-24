// Icon vật phẩm vẽ tay (tài nguyên, đan dược, pháp bảo) — cùng bút lông với cảnh. Khung 24 × 24 DU, neo ở tâm.
// Nét viền đậm, hình khối rõ để vẫn đọc được khi hiện nhỏ 14–22 px.
import { blot, ellipse, erase, grain, stroke, wash, type Asset, type G, type Pt, radial, vgrad } from './brush'
import { spiral } from './landscape'
import { rng } from './noise'
import { PIGMENT as C, mix, WHITE } from './palette'

export const ITEMS = ['linhThach', 'linhThao', 'linhKhoang', 'tuKhi', 'boiNguyen', 'doKiep', 'hoiXuan', 'ngungThan', 'daiTuKhi', 'phaCanh', 'taiTuy'] as const
export type Item = (typeof ITEMS)[number]
export const isItem = (n: string): n is Item => (ITEMS as readonly string[]).includes(n)
// Pháp bảo (Luyện Khí Phòng): cùng khung, cùng itemIcon()
export const GEAR_ICONS = ['thanhSuong', 'xichViem', 'kimCang', 'huyenVu', 'hoTam', 'thienLoi', 'tuBao', 'ngocGian', 'tiLoi'] as const
export type Gear = (typeof GEAR_ICONS)[number]
export const isGear = (n: string): n is Gear => (GEAR_ICONS as readonly string[]).includes(n)

// Viền mực: chèn điểm dọc cạnh để spline không bo tròn góc (tinh thể phải sắc cạnh)
const ink = (g: G, pts: Pt[], w = 1.3, a = 0.92, close = true) => {
  const path = close ? [...pts, pts[0]] : pts
  const dense: Pt[] = []
  path.forEach((p, i) => {
    const q = path[i + 1]
    if (!q) return dense.push(p)
    const k = Math.max(1, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / 0.8))
    for (let j = 0; j < k; j++) dense.push([p[0] + ((q[0] - p[0]) * j) / k, p[1] + ((q[1] - p[1]) * j) / k])
  })
  stroke(g, dense, { w, color: C.ink, press: 'even', alpha: a, rough: 0.3 })
}
const grad = (g: G, y0: number, y1: number, a: string, b: string) => vgrad(g, y0, y1, [[0, a], [1, b]])
// Lấp lánh bốn cánh
const sparkle = (g: G, x: number, y: number, r: number, color: string) => {
  g.save()
  g.fillStyle = color
  g.beginPath()
  g.moveTo(x, y - r)
  g.quadraticCurveTo(x, y, x + r, y)
  g.quadraticCurveTo(x, y, x, y + r)
  g.quadraticCurveTo(x, y, x - r, y)
  g.quadraticCurveTo(x, y, x, y - r)
  g.fill()
  g.restore()
}

// Viên đan: sắc tố loang nhiều lớp (không bóng nhựa), bóng khối trăng khuyết, lấm tấm hạt đan, chấm sáng loang,
// viền mực đầu đinh khô tước sợi, hai làn đan khí uốn lên từ đỉnh
function pill(g: G, light: string, deep: string, mark: (g: G) => void, seed = 5) {
  blot(g, 0, 0.5, 10.5, light, 0.16, 3, 1)
  stroke(g, [[-0.8, -7.3], [1, -8.8], [-0.2, -10.2], [1.4, -11.6]], { w: 1.3, color: light, press: 'fade', alpha: 0.75, dry: 0.25, seed: seed + 20 })
  stroke(g, [[2.6, -6.9], [4, -8.3], [3.3, -9.6]], { w: 0.9, color: light, press: 'fade', alpha: 0.5, dry: 0.25, seed: seed + 21 })
  const at = (a: number, r: number, cx = 0, cy = 0.5): Pt => [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
  const ring: Pt[] = Array.from({ length: 14 }, (_, i) => at((i / 14) * Math.PI * 2, 8))
  const body = () => {
    const gr = g.createRadialGradient(-2.8, -2.4, 0.5, 0, 0.5, 9)
    gr.addColorStop(0, mix(light, C.silk, 0.35))
    gr.addColorStop(0.5, light)
    gr.addColorStop(1, deep)
    return gr
  }
  wash(g, ring, { fill: body, alpha: 1, jitter: 0.3, layers: 3, edge: 0.9, seed })
  const arc = (a0: number, a1: number, r: number, cx: number, cy: number) => Array.from({ length: 8 }, (_, i) => at(a0 + ((a1 - a0) * i) / 7, r, cx, cy))
  wash(g, [...arc(-0.2 * Math.PI, 0.85 * Math.PI, 7.9, 0, 0.5), ...arc(0.85 * Math.PI, -0.2 * Math.PI, 6.6, -1.3, -0.7)], { fill: deep, alpha: 0.42, jitter: 0.2, layers: 2, seed: seed + 1 })
  const r = rng(seed)
  for (let i = 0; i < 7; i++) {
    const a = r() * Math.PI * 2, d = 2 + r() * 4.2
    blot(g, Math.cos(a) * d, 0.5 + Math.sin(a) * d, 0.4 + r() * 0.35, deep, 0.35, seed + 30 + i, 0.8)
  }
  mark(g)
  blot(g, -3.1, -2.9, 1.7, mix(light, WHITE, 0.7), 0.85, seed + 2, 0.65, -0.7)
  stroke(g, [...ring, ring[0], ring[1]], { w: 1.4, color: C.ink, press: 'nail', dry: 0.35, rough: 0.35, alpha: 0.9, seed: seed + 3 })
}

const circle = (x: number, y: number, rx: number, ry = rx, n = 20) => ellipse(x, y, rx, ry, n)
// Tia sét gấp khúc nhỏ: lõi sáng, viền mực
const zap = (g: G, pts: Pt[], color: string, w = 1.1) => {
  stroke(g, pts, { w: w + 0.8, color: C.ink, press: 'nail', alpha: 0.75, rough: 0.2 })
  stroke(g, pts, { w, color, press: 'nail', alpha: 1, rough: 0.2 })
}
// Đĩa trong bị khoét (vòng tay, lỗ tiền)
const hole = (g: G, pts: Pt[]) => erase(g, () => wash(g, pts, { fill: '#000000', alpha: 1, jitter: 0.1, layers: 1 }))

// Hình từng tài nguyên, đan dược, pháp bảo
const ITEM_DRAW: Record<Item | Gear, (d: { g: G }) => void> = {
  linhThach: ({ g }) => {
    const p: Pt[] = [[0, -10.5], [7.6, -4.2], [5.8, 9], [0, 11], [-5.8, 9], [-7.6, -4.2]]
    blot(g, 0, 0, 11, C.spirit, 0.22, 7, 1)
    wash(g, p, { fill: g2 => grad(g2, -10, 11, mix(C.spirit, WHITE, 0.35), C.azuriteD), alpha: 1, jitter: 0.2, layers: 2, sharp: true, seed: 1 })
    wash(g, [[0, -10.5], [3, -3.8], [0, 11], [-3, -3.8]], { fill: C.silk, alpha: 0.42, jitter: 0.1, layers: 1, sharp: true, seed: 2 })
    wash(g, [[-7.6, -4.2], [-3, -3.8], [0, 11], [-5.8, 9]], { fill: C.indigo, alpha: 0.35, jitter: 0.1, layers: 1, sharp: true, seed: 3 })
    ink(g, [[-7.6, -4.2], [-3, -3.8], [3, -3.8], [7.6, -4.2]], 0.6, 0.6, false)
    ink(g, [[-3, -3.8], [0, -10.5], [3, -3.8]], 0.6, 0.6, false)
    ink(g, [[-3, -3.8], [0, 11], [3, -3.8]], 0.55, 0.45, false)
    ink(g, p, 1.35)
    sparkle(g, 5.5, -8, 2.6, C.goldL)
  },
  linhThao: ({ g }) => {
    blot(g, 0, -6, 6.5, C.goldL, 0.3, 4, 1)
    stroke(g, [[0.5, 11], [-0.8, 5], [0.6, -1], [0, -5]], { w: 1.6, color: C.malachiteD, press: 'rise', alpha: 1 })
    const leafL: Pt[] = [[0, 4], [-4, 3.2], [-8.6, -0.6], [-9.6, -4.2], [-5, -2.8], [-1.2, 1.2]]
    const leafR: Pt[] = [[0.4, 1], [3.6, -0.6], [8, -4.6], [9.4, -8.4], [4.6, -6.6], [1, -2.2]]
    wash(g, leafL, { fill: C.malachite, alpha: 1, jitter: 0.2, layers: 2, seed: 4 })
    wash(g, leafR, { fill: C.malachiteL, alpha: 1, jitter: 0.2, layers: 2, seed: 5 })
    ink(g, leafL, 1, 0.85)
    ink(g, leafR, 1, 0.85)
    stroke(g, [[-0.6, 2.6], [-4.8, 0.2], [-8.4, -3.2]], { w: 0.55, color: C.malachiteD, press: 'taper', alpha: 0.9 })
    stroke(g, [[0.8, -0.6], [4.8, -3.8], [8.4, -7.2]], { w: 0.55, color: C.malachiteD, press: 'taper', alpha: 0.9 })
    wash(g, Array.from({ length: 10 }, (_, i) => [Math.cos((i / 10) * Math.PI * 2) * 3.3, -7 + Math.sin((i / 10) * Math.PI * 2) * 3.1] as Pt), {
      fill: g2 => grad(g2, -10, -4, C.goldL, C.gamboge), alpha: 1, jitter: 0.15, layers: 2, seed: 6,
    })
    ink(g, Array.from({ length: 10 }, (_, i) => [Math.cos((i / 10) * Math.PI * 2) * 3.3, -7 + Math.sin((i / 10) * Math.PI * 2) * 3.1] as Pt), 0.9, 0.85)
    blot(g, -1, -8, 0.9, C.silk, 1, 7, 1)
  },
  linhKhoang: ({ g }) => {
    const rock: Pt[] = [[-10, 5.5], [-8.6, -3.4], [-3, -7.4], [4.6, -6.2], [9.6, -1], [9.2, 6.4], [3.4, 9.4], [-5.2, 9.2]]
    wash(g, rock, { fill: g2 => grad(g2, -8, 9, C.ochreL, mix(C.ink3, C.ink2, 0.4)), alpha: 1, jitter: 0.3, layers: 2, seed: 7 })
    wash(g, [[-8.6, -3.4], [-3, -7.4], [4.6, -6.2], [0.6, -2.4]], { fill: C.paper, alpha: 0.5, jitter: 0.2, layers: 1, seed: 8 })
    const shard = (pts: Pt[], seed: number) => {
      wash(g, pts, { fill: g2 => grad(g2, -6, 7, '#c9bbf6', '#6a58b8'), alpha: 1, jitter: 0.1, layers: 1, sharp: true, seed })
      ink(g, pts, 0.7, 0.85)
    }
    shard([[-3.6, 6], [-1.6, -2.6], [0.8, 6]], 9)
    shard([[1.2, 6.6], [4, -0.6], [6, 6]], 10)
    ink(g, rock, 1.35)
    stroke(g, [[-6, 0], [-3.8, 2.8]], { w: 0.6, color: C.ink, press: 'taper', alpha: 0.5 })
    sparkle(g, -1.6, -3.2, 2.2, C.silk)
  },
  tuKhi: ({ g }) => {
    pill(g, '#7fe0e6', '#1f7a83', g2 => stroke(g2, spiral(0.2, 0.8, 4.2, 1.1, 1), { w: 1.1, color: '#135a61', press: 'rise', alpha: 0.85 }))
  },
  boiNguyen: ({ g }) => {
    pill(g, '#f7d774', '#9a6a18', g2 => {
      stroke(g2, Array.from({ length: 13 }, (_, i) => [Math.cos((i / 12) * Math.PI * 2) * 3.6, 0.8 + Math.sin((i / 12) * Math.PI * 2) * 3.6] as Pt), { w: 1, color: '#7a4f0f', press: 'even', alpha: 0.8 })
      blot(g2, 0, 0.8, 1.2, '#7a4f0f', 0.8, 3, 1)
    }, 13)
  },
  doKiep: ({ g }) => {
    pill(g, '#c7a3f5', '#4a2d8c', g2 => {
      wash(g2, [[1.6, -4.6], [-2.4, 1.4], [0.2, 1.4], [-1.4, 5.6], [3, -0.8], [0.4, -0.8]], { fill: '#f3edff', alpha: 1, jitter: 0.05, layers: 1, sharp: true, seed: 12 })
      stroke(g2, [[1.6, -4.6], [-2.4, 1.4], [0.2, 1.4], [-1.4, 5.6], [3, -0.8], [0.4, -0.8], [1.6, -4.6]], { w: 0.6, color: '#2e1a63', press: 'even', alpha: 0.9 })
    }, 21)
  },
  hoiXuan: ({ g }) => {
    // Hồi Xuân: ngọc bích, cành lá non
    pill(g, '#9fe3b4', '#23704a', g2 => {
      stroke(g2, [[-2.6, 4.4], [-0.4, 1.4], [1.6, -2.8]], { w: 0.9, color: '#1b5237', press: 'rise', alpha: 0.9 })
      for (const [pts, sd] of [[[[-0.6, 1.2], [-3.6, -0.4], [-4.2, -2.8], [-1.4, -1.2]], 31], [[[0.8, -1], [3.8, -1.6], [5, -4], [1.8, -3.2]], 32]] as [Pt[], number][]) {
        wash(g2, pts, { fill: '#e8fbe9', alpha: 0.95, jitter: 0.1, layers: 1, seed: sd })
        stroke(g2, [...pts, pts[0]], { w: 0.5, color: '#1b5237', press: 'even', alpha: 0.85 })
      }
    }, 29)
  },
  ngungThan: ({ g }) => {
    // Ngưng Thần: son đỏ, thần nhãn dọc giữa viên
    pill(g, '#f08070', '#7e1a16', g2 => {
      const eye: Pt[] = [[0, -4.4], [2, -1.6], [2.2, 1.6], [0, 5.2], [-2.2, 1.6], [-2, -1.6]]
      wash(g2, eye, { fill: '#ffe6c8', alpha: 0.95, jitter: 0.1, layers: 1, seed: 33 })
      stroke(g2, [...eye, eye[0]], { w: 0.7, color: '#5a0f0c', press: 'even', alpha: 0.95 })
      blot(g2, 0, 0.5, 1.2, '#5a0f0c', 1, 34, 1)
      blot(g2, -0.3, 0.1, 0.35, WHITE, 1, 35, 1)
    }, 37)
  },
  daiTuKhi: ({ g }) => {
    // Đại Tụ Khí: to hơn Tụ Khí Đan một cỡ, vỏ vàng, xoáy linh khí lam như Tụ Khí, vòng khí bao quanh
    blot(g, 0, 1, 11.5, C.spirit, 0.2, 38, 1)
    g.save()
    g.translate(0, 1.2)
    g.scale(1.16, 1.16)
    pill(g, '#f5cf62', '#8c5a12', g2 => {
      stroke(g2, spiral(0.2, 0.8, 4.4, 1.25, 1), { w: 1.3, color: '#1f7a83', press: 'rise', alpha: 0.95 })
      stroke(g2, spiral(0.2, 0.8, 4.4, 1.25, 1), { w: 0.5, color: '#bff5f7', press: 'rise', alpha: 0.9 })
    }, 41)
    g.restore()
    stroke(g, circle(0, 1.8, 11, 3.2, 24).slice(2, 14), { w: 0.9, color: C.spirit, press: 'taper', alpha: 0.9 })
    sparkle(g, 7.6, -6.4, 2.2, C.goldL)
  },
  phaCanh: ({ g }) => {
    // Phá Cảnh: tím thẫm, vết nứt lôi quang loé sáng
    pill(g, '#a57be8', '#2c1263', g2 => {
      for (const [pts, w] of [[[[-5.6, -2.6], [-2.4, -0.6], [-0.6, -3.2], [1.4, 0.4], [4.6, -1], [6.4, 1.6]], 1], [[[-0.6, -3.2], [-0.2, -6.2]], 0.6], [[[1.4, 0.4], [0.6, 3.4], [2.6, 5.6]], 0.8], [[[-2.4, -0.6], [-3.6, 2.8]], 0.6]] as [Pt[], number][]) {
        stroke(g2, pts, { w: w + 0.9, color: '#1a0840', press: 'even', alpha: 0.9 })
        stroke(g2, pts, { w: w * 0.6, color: '#f0e6ff', press: 'even', alpha: 1 })
      }
    }, 43)
    sparkle(g, 6.6, 1.8, 1.8, '#f0e6ff')
  },
  taiTuy: ({ g }) => {
    // Tẩy Tủy: trắng sữa, ba làn sóng nước gột rửa
    pill(g, '#fbf6ea', '#a8977c', g2 => {
      for (const [y, sd] of [[-2.6, 44], [0.6, 45], [3.8, 46]] as const) stroke(g2, [[-4.4, y + 0.6], [-2.2, y - 0.6], [0, y + 0.6], [2.2, y - 0.6], [4.4, y + 0.6]], { w: 0.8, color: '#7fa6c0', press: 'taper', alpha: 0.9, seed: sd })
    }, 47)
  },
  thanhSuong: ({ g }) => {
    // Thanh Sương kiếm: lưỡi lam băng chéo góc, chắn tay bạc, tua lam, sương giá lấp lánh
    const P = (t: number, n: number): Pt => [-8.4 + (t + n) * 0.7071, 8.4 + (n - t) * 0.7071]
    blot(g, 3.4, -3.4, 8, '#cfeaff', 0.3, 50, 0.5, -0.785)
    const blade: Pt[] = [P(7, -1.7), P(22.2, -1.7), P(25.4, 0), P(22.2, 1.7), P(7, 1.7)]
    wash(g, blade, { fill: g2 => grad(g2, -10, 4, '#f4fbff', '#5f98c4'), alpha: 1, jitter: 0.1, layers: 2, sharp: true, seed: 51 })
    stroke(g, [P(8, 0.3), P(21.6, 0.3)], { w: 0.5, color: '#3d6f96', press: 'even', alpha: 0.9 })
    stroke(g, [P(8, -0.8), P(20.6, -0.8)], { w: 0.5, color: WHITE, press: 'taper', alpha: 0.9 })
    ink(g, blade, 1.1)
    const guard: Pt[] = [P(5.4, -4.4), P(7, -3.8), P(7, 3.8), P(5.4, 4.4)]
    wash(g, guard, { fill: '#b8d6ea', alpha: 1, jitter: 0.1, layers: 1, sharp: true, seed: 52 })
    ink(g, guard, 0.9)
    const grip: Pt[] = [P(1.2, -1), P(5.4, -1), P(5.4, 1), P(1.2, 1)]
    wash(g, grip, { fill: mix(C.indigo, C.ink, 0.3), alpha: 1, jitter: 0.1, layers: 1, sharp: true, seed: 53 })
    for (let t = 2; t < 5.4; t += 1.1) stroke(g, [P(t, -1), P(t + 0.6, 1)], { w: 0.35, color: '#b8d6ea', press: 'even', alpha: 0.9 })
    ink(g, grip, 0.8)
    blot(g, ...P(0.4, 0), 1.5, '#b8d6ea', 1, 54, 1)
    stroke(g, [P(0, 0), [-10.6, 10.6], [-9.4, 11.8], [-11.4, 11.6]], { w: 1, color: C.azuriteL, press: 'fade', alpha: 1 })
    sparkle(g, 1.4, -7.4, 2.4, WHITE)
    sparkle(g, 8.8, -0.4, 1.6, '#e6f6ff')
  },
  xichViem: ({ g }) => {
    // Xích Viêm phiến: quạt xoè đỏ son, nan mực, ngọn lửa bốc từ mép quạt
    const cx = 0, cy = 9.4, at = (a: number, r: number): Pt => [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
    const A = Array.from({ length: 13 }, (_, i) => -Math.PI * (0.84 - (i / 12) * 0.68))
    for (const [x, y, s, sd] of [[-5.4, -4.4, 0.8, 55], [0, -6.4, 1.1, 56], [5.4, -4.4, 0.8, 57]] as const) {
      const f: Pt[] = [[x - 2.6 * s, y + 3], [x - 1.8 * s, y - 1], [x - 0.4 * s, y - 2.2], [x, y - 5 * s], [x + 1.4 * s, y - 1.6], [x + 2.4 * s, y + 3]]
      wash(g, f, { fill: g2 => grad(g2, y - 5, y + 3, C.gamboge, C.cinnabarL), alpha: 0.95, jitter: 0.2, layers: 2, seed: sd })
    }
    const leaf = [...A.map(a => at(a, 12.6)), ...A.slice().reverse().map(a => at(a, 4.6))]
    wash(g, leaf, { fill: g2 => radial(g2, [cx, cy, 3, cx, cy, 13], [[0, C.gamboge], [0.45, C.cinnabar], [1, '#6e150e']]), alpha: 1, jitter: 0.2, layers: 2, seed: 58 })
    A.forEach((a, i) => i % 2 || stroke(g, [at(a, 4.8), at(a, 12.4)], { w: 0.45, color: '#3a0a06', press: 'even', alpha: 0.6 }))
    wash(g, [at(-Math.PI * 0.62, 7), at(-Math.PI * 0.55, 11.2), at(-Math.PI * 0.5, 8.6), at(-Math.PI * 0.43, 11.4), at(-Math.PI * 0.38, 7)], { fill: C.goldL, alpha: 0.85, jitter: 0.15, layers: 1, seed: 59 })
    ink(g, leaf, 1.2)
    for (const a of [A[0], A[12]]) stroke(g, [[cx, cy], at(a, 12.8)], { w: 1.3, color: C.lacquer2, press: 'even', alpha: 1 })
    blot(g, cx, cy, 1.5, C.gold, 1, 60, 1)
    stroke(g, [[cx, cy + 1], [cx - 1.4, cy + 2.6], [cx - 0.6, cy + 3]], { w: 1, color: C.cinnabar, press: 'fade', alpha: 1 })
  },
  kimCang: ({ g }) => {
    // Kim Cang trạc: vòng vàng dày nghiêng, khắc chấm, ánh kim
    blot(g, 0, 0.6, 11, C.goldL, 0.22, 61, 0.7)
    const outer = circle(0, 1, 10.2, 7, 28), inner = circle(0, 0, 6.2, 3.4, 24)
    wash(g, outer, { fill: g2 => grad(g2, -6, 8, C.goldL, C.goldD), alpha: 1, jitter: 0.15, layers: 2, seed: 62 })
    hole(g, inner)
    wash(g, [...circle(0, 0, 6.2, 3.4, 24).slice(12), ...circle(0, 1.4, 6, 2.6, 24).slice(12).reverse()], { fill: C.goldD, alpha: 0.8, jitter: 0.1, layers: 1, seed: 63 })
    stroke(g, [...circle(0, 0.5, 8.2, 5.2, 28), [8.2, 0.5]], { w: 0.5, color: C.goldD, press: 'even', alpha: 0.8 })
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      blot(g, Math.cos(a) * 8.2, 0.5 + Math.sin(a) * 5.2, 0.55, i % 2 ? C.cinnabar : '#fff4c8', 1, 64 + i, 1)
    }
    stroke(g, circle(0, 1, 9.4, 6.2, 28).slice(3, 11), { w: 1, color: WHITE, press: 'taper', alpha: 0.6 })
    ink(g, outer, 1.2)
    ink(g, inner, 0.8, 0.8)
    sparkle(g, 7.4, -5.6, 2.4, '#fff6d8')
  },
  huyenVu: ({ g }) => {
    // Huyền Vũ giáp: giáp ngực đen ánh lục, vân mai rùa lục giác, viền vàng
    const body: Pt[] = [[-9.4, -6.6], [-5, -9.8], [-2.4, -7.8], [2.4, -7.8], [5, -9.8], [9.4, -6.6], [8.8, 1.2], [6.4, 8.4], [0, 11], [-6.4, 8.4], [-8.8, 1.2]]
    wash(g, body, { fill: g2 => grad(g2, -10, 11, '#4a5e5a', '#131a1b'), alpha: 1, jitter: 0.2, layers: 2, seed: 70 })
    const hex = (x: number, y: number, r: number): Pt[] => Array.from({ length: 6 }, (_, i) => [x + Math.cos((i / 6) * Math.PI * 2 + Math.PI / 6) * r, y + Math.sin((i / 6) * Math.PI * 2 + Math.PI / 6) * r] as Pt)
    const plates = [[0, 1.4], [-4.8, -1.4], [4.8, -1.4], [-4.8, 4.2], [4.8, 4.2], [0, -4.2], [0, 7]] as const
    for (const [x, y] of plates) {
      const h = hex(x, y, 2.9)
      wash(g, h, { fill: '#2c3d3b', alpha: 0.9, jitter: 0.1, layers: 1, sharp: true, seed: 71 + x + y })
      stroke(g, [...h, h[0], h[1]], { w: 0.5, color: '#79a89c', press: 'even', alpha: 0.85 })
    }
    stroke(g, [[-2.4, -7.8], [0, -5.6], [2.4, -7.8]], { w: 1, color: C.gold, press: 'even', alpha: 1 })
    stroke(g, [[-6.4, 8.4], [0, 11], [6.4, 8.4]], { w: 0.9, color: C.gold, press: 'even', alpha: 1 })
    for (const s of [-1, 1]) stroke(g, [[s * 5, -9.8], [s * 9.4, -6.6]], { w: 1.4, color: C.gold, press: 'even', alpha: 1 })
    stroke(g, [[-7.6, -4], [-7.8, 2], [-6, 6.6]], { w: 0.9, color: WHITE, press: 'taper', alpha: 0.35 })
    ink(g, body, 1.3)
  },
  hoTam: ({ g }) => {
    // Hộ Tâm kính: gương đồng tròn, vành nổi, núm giữa, dây son buộc trên
    stroke(g, [[-3.6, -8.6], [-2.4, -11.4], [0, -12], [2.4, -11.4], [3.6, -8.6]], { w: 1.2, color: C.cinnabar, press: 'even', alpha: 1 })
    const bronze = mix(C.ochre, C.gold, 0.4)
    const disc = circle(0, 0.6, 10, 10, 30)
    wash(g, disc, { fill: g2 => radial(g2, [-3, -2.4, 1, 0, 0.6, 11], [[0, mix(bronze, WHITE, 0.45)], [0.6, bronze], [1, mix(C.ochre, C.ink, 0.45)]]), alpha: 1, jitter: 0.15, layers: 2, seed: 75 })
    stroke(g, [...circle(0, 0.6, 8.2, 8.2, 28), [8.2, 0.6]], { w: 1.1, color: mix(C.ochre, C.ink, 0.4), press: 'even', alpha: 0.85 })
    stroke(g, [...circle(0, 0.6, 5.2, 5.2, 24), [5.2, 0.6]], { w: 0.5, color: mix(C.ochre, C.ink, 0.4), press: 'even', alpha: 0.7 })
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4
      blot(g, Math.cos(a) * 6.8, 0.6 + Math.sin(a) * 6.8, 0.8, C.goldL, 1, 76 + i, 1)
    }
    blot(g, 0, 0.6, 2.2, mix(C.ochre, C.ink, 0.3), 1, 80, 1)
    blot(g, -0.6, 0, 0.8, C.goldL, 1, 81, 1)
    stroke(g, [[-6, -2.4], [-3, -5.8]], { w: 1.2, color: WHITE, press: 'taper', alpha: 0.6 })
    ink(g, disc, 1.3)
    stroke(g, [[-0.6, -11.8], [-2.6, -9.6]], { w: 0.8, color: C.cinnabarL, press: 'fade', alpha: 1 })
  },
  thienLoi: ({ g }) => {
    // Thiên Lôi chuỳ: đầu chuỳ trống tím thép, đai vàng hai đầu, cán chéo, sét toé
    // x: ngang đầu chuỳ (vuông góc cán), y: dọc theo cán
    const R = (x: number, y: number): Pt => [2.6 + x * 0.7071 - y * 0.7071, -2.8 + x * 0.7071 + y * 0.7071]
    stroke(g, [[-9.4, 10.6], [1.6, -1.6]], { w: 2.4, color: C.ink, press: 'even', alpha: 0.9 })
    stroke(g, [[-9.4, 10.6], [1.6, -1.6]], { w: 1.5, color: C.ochre, press: 'even', alpha: 1 })
    for (let i = 0; i < 4; i++) stroke(g, [[-7.4 + i * 1.6, 8.2 - i * 1.6], [-6.6 + i * 1.6, 9 - i * 1.6]], { w: 0.5, color: C.lacquer2, press: 'even', alpha: 0.9 })
    blot(g, -9.6, 10.8, 1.3, C.gold, 1, 82, 1)
    const head: Pt[] = [R(-6.2, -4), R(6.2, -4), R(6.2, 4), R(-6.2, 4)]
    wash(g, head, { fill: g2 => grad(g2, -11, 4, '#9a88d8', '#2e2466'), alpha: 1, jitter: 0.1, layers: 2, sharp: true, seed: 83 })
    for (const x of [-6.2, 6.2]) {
      const b: Pt[] = [R(x - 1, -4.6), R(x + 1, -4.6), R(x + 1, 4.6), R(x - 1, 4.6)]
      wash(g, b, { fill: C.gold, alpha: 1, jitter: 0.1, layers: 1, sharp: true, seed: 84 + x })
      ink(g, b, 0.7)
    }
    stroke(g, [R(-4.4, -2.4), R(4.4, -2.4)], { w: 0.9, color: WHITE, press: 'taper', alpha: 0.45 })
    blot(g, ...R(0, 0), 1.5, C.goldL, 1, 86, 1)
    ink(g, head, 1.1)
    zap(g, [[8.4, -11.2], [9.6, -9], [8.6, -8.6], [10.8, -6.2]], C.goldL)
    zap(g, [[-3.6, -7.4], [-5.8, -8.4], [-5, -9.6], [-8.2, -10.6]], C.goldL, 0.9)
    zap(g, [[9.8, 2.4], [10.8, 4.4], [9.6, 4.8], [11, 7.4]], '#e6dcff', 0.8)
  },
  tuBao: ({ g }) => {
    // Tụ Bảo bồn: chậu vàng, nguyên bảo và tiền chất đầy, ánh báu
    blot(g, 0, -3, 10, C.goldL, 0.3, 90, 0.7)
    const coin = (x: number, y: number, r: number, sd: number) => {
      wash(g, circle(x, y, r, r * 0.8, 14), { fill: C.gamboge, alpha: 1, jitter: 0.05, layers: 1, seed: sd })
      ink(g, circle(x, y, r, r * 0.8, 14), 0.5, 0.85)
      wash(g, [[x - r * 0.3, y - r * 0.25], [x + r * 0.3, y - r * 0.25], [x + r * 0.3, y + r * 0.25], [x - r * 0.3, y + r * 0.25]], { fill: C.goldD, alpha: 1, jitter: 0, layers: 1, sharp: true, seed: sd + 1 })
    }
    const ingot = (x: number, y: number, k: number, sd: number) => {
      const p: Pt[] = [[x - 5 * k, y - 2.6 * k], [x - 3 * k, y - 2 * k], [x - 1.8 * k, y - 4.4 * k], [x + 1.8 * k, y - 4.4 * k], [x + 3 * k, y - 2 * k], [x + 5 * k, y - 2.6 * k], [x + 3.4 * k, y], [x - 3.4 * k, y]]
      wash(g, p, { fill: g2 => grad(g2, y - 4.4 * k, y, C.goldL, C.gold), alpha: 1, jitter: 0.1, layers: 2, seed: sd })
      stroke(g, [[x - 1.2 * k, y - 3.6 * k], [x + 0.8 * k, y - 3.8 * k]], { w: 0.6, color: WHITE, press: 'taper', alpha: 0.8 })
      ink(g, p, 0.8)
    }
    ingot(-4.6, 0.4, 0.8, 91)
    ingot(4.8, 0.2, 0.8, 92)
    coin(-0.4, -1.4, 2, 93)
    ingot(0, -2.6, 1.05, 94)
    coin(7.6, -3.4, 1.5, 96)
    const body: Pt[] = [[-11, 0], [11, 0], [9, 5.8], [5.6, 8.2], [-5.6, 8.2], [-9, 5.8]]
    wash(g, body, { fill: g2 => grad(g2, 0, 8, mix(C.ochre, C.gold, 0.6), mix(C.ochre, C.ink, 0.35)), alpha: 1, jitter: 0.2, layers: 2, seed: 97 })
    stroke(g, [[-9.6, 3], [0, 3.8], [9.6, 3]], { w: 0.9, color: C.goldL, press: 'even', alpha: 0.85 })
    for (let x = -7; x <= 7; x += 3.5) blot(g, x, 3.4 + (1 - (x / 9.6) ** 2) * 0.5, 0.6, C.cinnabar, 1, 98 + x, 1)
    ink(g, body, 1.2)
    const foot: Pt[] = [[-4.4, 8.2], [4.4, 8.2], [5.2, 10.4], [-5.2, 10.4]]
    wash(g, foot, { fill: mix(C.ochre, C.ink, 0.4), alpha: 1, jitter: 0.1, layers: 1, sharp: true, seed: 99 })
    ink(g, foot, 0.9)
    stroke(g, [[-11.4, -0.2], [0, 0.8], [11.4, -0.2]], { w: 1.6, color: C.gold, press: 'even', alpha: 1 })
    sparkle(g, -7.4, -6.6, 2, '#fff6d8')
    sparkle(g, 3.6, -9, 2.4, '#fff6d8')
  },
  ngocGian: ({ g }) => {
    // Ngọc giản: năm thẻ ngọc bích xếp liền, dây son buộc hai ngấn, chữ khắc mờ
    const xs = [-8, -4.8, -1.6, 1.6, 4.8]
    xs.forEach((x, i) => {
      const t = -9.6 + (i % 2) * 0.8, slip: Pt[] = [[x, t], [x + 3, t], [x + 3, 9.8], [x, 9.8]]
      wash(g, slip, { fill: g2 => grad(g2, -10, 10, mix(C.malachiteL, C.silk, 0.35), C.malachite), alpha: 1, jitter: 0.1, layers: 2, sharp: true, seed: 100 + i })
      for (let y = t + 2.2; y < 8; y += 2.4) stroke(g, [[x + 1, y], [x + 2, y + 0.3]], { w: 0.5, color: C.malachiteD, press: 'taper', alpha: 0.7 })
      stroke(g, [[x + 0.6, t + 1], [x + 0.6, 8.6]], { w: 0.5, color: WHITE, press: 'taper', alpha: 0.5 })
      ink(g, slip, 0.8)
    })
    for (const y of [-4.6, 4.8]) stroke(g, [[-8.6, y], [-4, y + 0.5], [0, y - 0.3], [4, y + 0.4], [8.4, y]], { w: 1.1, color: C.cinnabar, press: 'even', alpha: 1 })
    stroke(g, [[8.2, 4.8], [10.2, 6.8], [9.4, 9.6]], { w: 0.9, color: C.cinnabar, press: 'fade', alpha: 1 })
    sparkle(g, 8.8, -8.4, 2.2, C.goldL)
  },
  tiLoi: ({ g }) => {
    // Tị Lôi châu: ngọc trắng ánh tím trên đế vàng, vòng hộ quang bẻ gãy tia sét
    stroke(g, circle(0, -1, 10.4, 10.4, 30).slice(16, 29), { w: 0.9, color: '#b9a4ff', press: 'taper', alpha: 0.85 })
    zap(g, [[-11.4, -9.6], [-9.6, -7.8], [-10.8, -7], [-8.6, -5.8]], C.goldL, 0.9)
    zap(g, [[9.8, -11.4], [8.6, -9.2], [9.8, -8.8], [7.8, -7]], C.goldL, 0.9)
    blot(g, 0, -1, 8.6, '#d9ccff', 0.35, 110, 1)
    const pearl = circle(0, -1.6, 6.4, 6.4, 24)
    wash(g, pearl, { fill: g2 => radial(g2, [-2, -3.8, 0.5, 0, -1.6, 7], [[0, WHITE], [0.55, '#d8ccfa'], [1, '#6a58b8']]), alpha: 1, jitter: 0.1, layers: 2, seed: 111 })
    stroke(g, [[-1.4, -4.2], [0.6, -2.4], [-0.6, -1.6], [1.6, 0.8]], { w: 0.7, color: '#8a70e0', press: 'even', alpha: 0.7 })
    blot(g, -2.4, -4.2, 1.3, WHITE, 0.95, 112, 0.7, -0.6)
    ink(g, pearl, 1.1)
    const cup: Pt[] = [[-5.6, 3], [-3.6, 6.2], [3.6, 6.2], [5.6, 3], [3.4, 4.4], [0, 4.8], [-3.4, 4.4]]
    wash(g, cup, { fill: g2 => grad(g2, 3, 7, C.goldL, C.goldD), alpha: 1, jitter: 0.1, layers: 1, seed: 113 })
    ink(g, cup, 0.9)
    for (const s of [-1, 1]) stroke(g, [[s * 4.6, 3.8], [s * 6.4, 0.4], [s * 5.8, -2.6]], { w: 1, color: C.gold, press: 'nail', alpha: 1 })
    const foot: Pt[] = [[-2.4, 6.2], [2.4, 6.2], [4, 9.6], [-4, 9.6]]
    wash(g, foot, { fill: C.goldD, alpha: 1, jitter: 0.1, layers: 1, sharp: true, seed: 114 })
    ink(g, foot, 0.9)
  },
}

export function itemIcon(name: Item | Gear): Asset {
  return {
    x: -12, y: -12, w: 24, h: 24,
    draw(g) {
      ITEM_DRAW[name]({ g })
      grain(g, 0.25)
    },
  }
}
