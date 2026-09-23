// Chất liệu cho giao diện, vẽ bằng cùng bút lông với cảnh: khung mực viền tay, sơn mài, dấu triện, nét gạch chân.
// Trả về canvas (px thật); client biến thành biến CSS (border-image, mask, background).
import { blot, canvas, stroke, type G, type Pt } from './brush'
import { noise2, rng } from './noise'
import { PIGMENT as C, rgba } from './palette'

const ctx = (w: number, h: number) => {
  const cv = canvas(w, h)
  const g = cv.getContext('2d') as G
  g.lineCap = 'round'
  g.lineJoin = 'round'
  return { cv, g }
}

// Sơn mài: nâu đen có vân gỗ ngang mờ, ghép liền
export function lacquerTex(size = 128, tone: string = C.lacquer) {
  const { cv, g } = ctx(size, size)
  const img = g.createImageData(size, size)
  const n = parseInt(tone.slice(1), 16)
  const R = n >> 16, Gc = (n >> 8) & 255, B = n & 255
  for (let i = 0; i < size * size; i++) {
    const x = i % size, y = (i / size) | 0
    const grain = noise2(x / 40, y / 2.5, 5, size / 40, size / 2.5) * 0.7 + noise2(x / 8, y / 8, 6, size / 8, size / 8) * 0.3
    const v = 1 + (grain - 0.5) * 0.35
    img.data[i * 4] = R * v
    img.data[i * 4 + 1] = Gc * v
    img.data[i * 4 + 2] = B * v
    img.data[i * 4 + 3] = 255
  }
  g.putImageData(img, 0, 0)
  return cv
}

// Khung mực viền tay 9 mảnh (双边: nét ngoài đậm, nét trong mảnh), góc có móc 回纹 nhỏ.
// size px, nét vẽ theo đơn vị px. Dùng: border-image: var(--frame-ink) <slice> fill? / <width> stretch
export function inkFrame(size = 120, color: string = C.ink, seed = 3) {
  const { cv, g } = ctx(size, size)
  const m = size * 0.1, i2 = size * 0.2
  const side = (a: Pt, b: Pt, w: number, s: number, alpha: number) => stroke(g, [a, [(a[0] + b[0]) / 2 + (s % 3) - 1, (a[1] + b[1]) / 2 + (s % 2) - 0.5], b], { w, color, press: 'even', alpha, rough: 0.5, dry: 0.15, seed: seed + s })
  const S = size
  // nét ngoài
  side([m, m], [S - m, m], 3.2, 1, 0.9)
  side([S - m, m], [S - m, S - m], 3.2, 2, 0.9)
  side([S - m, S - m], [m, S - m], 3.2, 3, 0.9)
  side([m, S - m], [m, m], 3.2, 4, 0.9)
  // nét trong
  side([i2, i2], [S - i2, i2], 1.3, 5, 0.7)
  side([S - i2, i2], [S - i2, S - i2], 1.3, 6, 0.7)
  side([S - i2, S - i2], [i2, S - i2], 1.3, 7, 0.7)
  side([i2, S - i2], [i2, i2], 1.3, 8, 0.7)
  // móc góc: chữ L nhỏ cuộn vào
  for (const [x, y, dx, dy] of [[i2, i2, 1, 1], [S - i2, i2, -1, 1], [S - i2, S - i2, -1, -1], [i2, S - i2, 1, -1]]) {
    stroke(g, [[x + dx * 2, y + dy * 9], [x + dx * 5, y + dy * 5], [x + dx * 9, y + dy * 2]], { w: 1.4, color, press: 'taper', alpha: 0.75, seed: seed + x + y })
    blot(g, x + dx * 4.5, y + dy * 4.5, 1.4, C.cinnabar, 0.9, seed + x * 3 + y)
  }
  return cv
}

// Viền vàng mảnh hai đường cho mặt sơn mài, góc cắt vát, có điểm vàng ở góc
export function goldFrame(size = 96, seed = 5) {
  const { cv, g } = ctx(size, size)
  const S = size
  const cut = S * 0.14
  const oct = (inset: number): Pt[] => {
    const a = inset, b = S - inset, c = cut + inset * 0.4
    return [[a + c, a], [b - c, a], [b, a + c], [b, b - c], [b - c, b], [a + c, b], [a, b - c], [a, a + c], [a + c, a]]
  }
  g.strokeStyle = rgba(C.gold, 0.95)
  g.lineWidth = 2
  g.beginPath()
  oct(3).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
  g.stroke()
  g.strokeStyle = rgba(C.goldL, 0.45)
  g.lineWidth = 1
  g.beginPath()
  oct(7).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
  g.stroke()
  const r = rng(seed)
  for (const [x, y] of [[cut * 0.9, cut * 0.9], [S - cut * 0.9, cut * 0.9], [S - cut * 0.9, S - cut * 0.9], [cut * 0.9, S - cut * 0.9]]) {
    g.fillStyle = rgba(C.goldL, 0.9)
    g.beginPath()
    g.moveTo(x, y - 3.2)
    g.lineTo(x + 3.2, y)
    g.lineTo(x, y + 3.2)
    g.lineTo(x - 3.2, y)
    g.closePath()
    g.fill()
    r()
  }
  return cv
}

// Mặt nạ dấu triện: vuông, mép mực ăn giấy lởm chởm, lòng có chấm hở như mực đóng không đều
export function sealMask(size = 96, seed = 7) {
  const { cv, g } = ctx(size, size)
  const img = g.createImageData(size, size)
  const r = rng(seed)
  const pad = size * 0.06
  for (let i = 0; i < size * size; i++) {
    const x = i % size, y = (i / size) | 0
    const d = Math.min(x - pad, y - pad, size - pad - x, size - pad - y) // khoảng cách tới mép
    const edge = d + (noise2(x / 3, y / 3, seed) - 0.5) * 5 + (noise2(x / 9, y / 9, seed + 1) - 0.5) * 4
    let a = Math.max(0, Math.min(1, edge / 1.5))
    if (a > 0 && noise2(x / 2.2, y / 2.2, seed + 2) > 0.8) a *= 0.35 // chỗ mực mỏng
    if (r() < 0.004) a *= 0.2
    img.data[i * 4 + 3] = Math.round(a * 255)
  }
  g.putImageData(img, 0, 0)
  return cv
}

// Một nét bút ngang (gạch chân tiêu đề, dải phân cách) — kéo giãn theo bề ngang
export function brushBar(w = 320, h = 28, color: string = C.ink, seed = 9) {
  const { cv, g } = ctx(w, h)
  stroke(g, [[h * 0.3, h * 0.55], [w * 0.35, h * 0.45], [w * 0.7, h * 0.52], [w - h * 0.3, h * 0.46]], { w: h * 0.42, color, press: 'nail', dry: 0.55, ink: 0.4, alpha: 0.9, seed })
  return cv
}

// Dải lụa nền cho nút: màu khoáng loang nhẹ + hạt (ghép liền ngang)
export function washTex(w: number, h: number, color: string, seed = 11) {
  const { cv, g } = ctx(w, h)
  const img = g.createImageData(w, h)
  const n = parseInt(color.slice(1), 16)
  const R = n >> 16, Gc = (n >> 8) & 255, B = n & 255
  for (let i = 0; i < w * h; i++) {
    const x = i % w, y = (i / w) | 0
    const v = 1 + (noise2(x / 14, y / 6, seed, w / 14, 0) - 0.5) * 0.18 + (noise2(x / 2, y / 2, seed + 1, w / 2, 0) - 0.5) * 0.08 - (y / h) * 0.12
    img.data[i * 4] = R * v
    img.data[i * 4 + 1] = Gc * v
    img.data[i * 4 + 2] = B * v
    img.data[i * 4 + 3] = 255
  }
  g.putImageData(img, 0, 0)
  return cv
}


// Vết mực loang (mặt nạ chuyển cảnh): tròn nhoè, mép răng cưa, vài giọt bắn quanh. Trắng = hiện.
export function inkBlot(size = 256, seed = 17) {
  const { cv, g } = ctx(size, size)
  const r = rng(seed)
  const c = size / 2
  const k = 48
  g.fillStyle = '#fff'
  g.beginPath()
  for (let i = 0; i <= k; i++) {
    const a = (i / k) * Math.PI * 2
    const rr = size * (0.36 + noise2(Math.cos(a) * 2 + 5, Math.sin(a) * 2 + 5, seed) * 0.1)
    const x = c + Math.cos(a) * rr, y = c + Math.sin(a) * rr
    i ? g.lineTo(x, y) : g.moveTo(x, y)
  }
  g.fill()
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, d = size * (0.4 + r() * 0.08)
    g.beginPath()
    g.arc(c + Math.cos(a) * d, c + Math.sin(a) * d, size * (0.006 + r() * 0.02), 0, Math.PI * 2)
    g.fill()
  }
  return cv
}
