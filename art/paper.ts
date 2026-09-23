// Giấy xuyến chỉ ghép liền (tileable): nền cho bản đồ, lớp phủ cảnh núi, nền bảng giao diện.
import { canvas, type G } from './brush'
import { noise2, rng } from './noise'
import { PIGMENT, mix, rgba } from './palette'

export function paper(size = 256, tone: string = PIGMENT.paper, seed = 7) {
  const cv = canvas(size, size)
  const g = cv.getContext('2d') as G
  const img = g.createImageData(size, size)
  const n = parseInt(tone.slice(1), 16)
  const R = n >> 16, Gc = (n >> 8) & 255, B = n & 255
  const P = size / 32
  for (let i = 0; i < size * size; i++) {
    const x = i % size, y = (i / size) | 0
    // loang lớn + mịn, sợi giấy chạy ngang
    const v =
      (noise2(x / 32, y / 32, seed, P, P) - 0.5) * 0.05 +
      (noise2(x / 6, y / 1.5, seed + 1, size / 6, size / 1.5) - 0.5) * 0.025 +
      (noise2(x / 2, y / 2, seed + 2, size / 2, size / 2) - 0.5) * 0.02
    img.data[i * 4] = R * (1 + v)
    img.data[i * 4 + 1] = Gc * (1 + v)
    img.data[i * 4 + 2] = B * (1 + v * 1.2)
    img.data[i * 4 + 3] = 255
  }
  g.putImageData(img, 0, 0)
  // sợi xơ: nét cong ngắn đậm/nhạt hơn nền, vẽ lặp 9 ô để ghép liền
  const r = rng(seed)
  const dark = mix(tone, PIGMENT.ochre, 0.35), light = mix(tone, '#ffffff', 0.5)
  for (let k = 0; k < size * 0.9; k++) {
    const x = r() * size, y = r() * size, len = 3 + r() * 14, a = (r() - 0.5) * 1.2, bend = (r() - 0.5) * 6
    g.strokeStyle = rgba(r() < 0.6 ? dark : light, 0.18 + r() * 0.25)
    g.lineWidth = 0.4 + r() * 0.7
    for (const ox of [-size, 0, size])
      for (const oy of [-size, 0, size]) {
        g.beginPath()
        g.moveTo(x + ox, y + oy)
        g.quadraticCurveTo(x + ox + Math.cos(a) * len * 0.5, y + oy + Math.sin(a) * len * 0.5 + bend, x + ox + Math.cos(a) * len, y + oy + Math.sin(a) * len)
        g.stroke()
      }
  }
  // hạt: chấm li ti
  for (let k = 0; k < size * 0.5; k++) {
    g.fillStyle = rgba(r() < 0.7 ? PIGMENT.ink3 : PIGMENT.ochreL, 0.15 + r() * 0.25)
    g.fillRect(r() * size, r() * size, 0.8 + r(), 0.8 + r())
  }
  return cv
}
