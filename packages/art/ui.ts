// Chất liệu nền cho giao diện, vẽ bằng cùng bút lông với cảnh: sơn mài, nét gạch chân, vết mực loang (chuyển cảnh).
// Da giao diện 9 mảnh (khung, nút, nhãn…) ở chrome.ts.
// Trả về canvas (px thật); client biến thành biến CSS (border-image, mask, background).
import { canvas, stroke, type G } from './brush'
import { noise2, rng } from './noise'
import { PIGMENT as C } from './palette'

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

// Một nét bút ngang (gạch chân tiêu đề, dải phân cách) — kéo giãn theo bề ngang
export function brushBar(w = 320, h = 28, color: string = C.ink, seed = 9) {
  const { cv, g } = ctx(w, h)
  stroke(g, [[h * 0.3, h * 0.55], [w * 0.35, h * 0.45], [w * 0.7, h * 0.52], [w - h * 0.3, h * 0.46]], { w: h * 0.42, color, press: 'nail', dry: 0.55, ink: 0.4, alpha: 0.9, seed })
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
