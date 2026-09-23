// Icon vật phẩm vẽ tay (tài nguyên, đan dược) — cùng bút lông với cảnh. Khung 24 × 24 DU, neo ở tâm.
// Nét viền đậm, hình khối rõ để vẫn đọc được khi hiện nhỏ 14–22 px.
import { blot, grain, stroke, wash, type Asset, type G, type Pt } from './brush'
import { spiral } from './landscape'
import { PIGMENT as C, mix } from './palette'

export const ITEMS = ['linhThach', 'linhThao', 'linhKhoang', 'tuKhi', 'boiNguyen', 'doKiep'] as const
export type Item = (typeof ITEMS)[number]
export const isItem = (n: string): n is Item => (ITEMS as readonly string[]).includes(n)

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
const grad = (g: G, y0: number, y1: number, a: string, b: string) => {
  const gr = g.createLinearGradient(0, y0, 0, y1)
  gr.addColorStop(0, a)
  gr.addColorStop(1, b)
  return gr
}
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

function pill(g: G, light: string, deep: string, mark: (g: G) => void) {
  blot(g, 0, 0.5, 11, light, 0.25, 3, 1)
  const gr = g.createRadialGradient(-2.5, -2.5, 1, 0, 0.5, 8.5)
  gr.addColorStop(0, mix(light, '#ffffff', 0.55))
  gr.addColorStop(0.55, light)
  gr.addColorStop(1, deep)
  const ring: Pt[] = Array.from({ length: 14 }, (_, i) => [Math.cos((i / 14) * Math.PI * 2) * 8, 0.5 + Math.sin((i / 14) * Math.PI * 2) * 8])
  wash(g, ring, { fill: () => gr, alpha: 1, jitter: 0.25, layers: 2, seed: 5 })
  mark(g)
  stroke(g, [[-5.2, -3.2], [-3.6, -5.2], [-1, -6.2]], { w: 1.5, color: C.silk, press: 'taper', alpha: 0.9 })
  ink(g, ring, 1.3, 0.9)
}

export function itemIcon(name: Item): Asset {
  return {
    x: -12, y: -12, w: 24, h: 24,
    draw(g) {
      if (name === 'linhThach') {
        const p: Pt[] = [[0, -10.5], [7.6, -4.2], [5.8, 9], [0, 11], [-5.8, 9], [-7.6, -4.2]]
        blot(g, 0, 0, 11, C.spirit, 0.22, 7, 1)
        wash(g, p, { fill: g2 => grad(g2, -10, 11, mix(C.spirit, '#ffffff', 0.35), C.azuriteD), alpha: 1, jitter: 0.2, layers: 2, sharp: true, seed: 1 })
        wash(g, [[0, -10.5], [3, -3.8], [0, 11], [-3, -3.8]], { fill: C.silk, alpha: 0.42, jitter: 0.1, layers: 1, sharp: true, seed: 2 })
        wash(g, [[-7.6, -4.2], [-3, -3.8], [0, 11], [-5.8, 9]], { fill: C.indigo, alpha: 0.35, jitter: 0.1, layers: 1, sharp: true, seed: 3 })
        ink(g, [[-7.6, -4.2], [-3, -3.8], [3, -3.8], [7.6, -4.2]], 0.6, 0.6, false)
        ink(g, [[-3, -3.8], [0, -10.5], [3, -3.8]], 0.6, 0.6, false)
        ink(g, [[-3, -3.8], [0, 11], [3, -3.8]], 0.55, 0.45, false)
        ink(g, p, 1.35)
        sparkle(g, 5.5, -8, 2.6, C.goldL)
      } else if (name === 'linhThao') {
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
      } else if (name === 'linhKhoang') {
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
      } else if (name === 'tuKhi') {
        pill(g, '#7fe0e6', '#1f7a83', g2 => stroke(g2, spiral(0.2, 0.8, 4.2, 1.1, 1), { w: 1.1, color: '#135a61', press: 'rise', alpha: 0.85 }))
      } else if (name === 'boiNguyen') {
        pill(g, '#f7d774', '#9a6a18', g2 => {
          stroke(g2, Array.from({ length: 13 }, (_, i) => [Math.cos((i / 12) * Math.PI * 2) * 3.6, 0.8 + Math.sin((i / 12) * Math.PI * 2) * 3.6] as Pt), { w: 1, color: '#7a4f0f', press: 'even', alpha: 0.8 })
          blot(g2, 0, 0.8, 1.2, '#7a4f0f', 0.8, 3, 1)
        })
      } else if (name === 'doKiep') {
        pill(g, '#c7a3f5', '#4a2d8c', g2 => {
          wash(g2, [[1.6, -4.6], [-2.4, 1.4], [0.2, 1.4], [-1.4, 5.6], [3, -0.8], [0.4, -0.8]], { fill: '#f3edff', alpha: 1, jitter: 0.05, layers: 1, sharp: true, seed: 12 })
          stroke(g2, [[1.6, -4.6], [-2.4, 1.4], [0.2, 1.4], [-1.4, 5.6], [3, -0.8], [0.4, -0.8], [1.6, -4.6]], { w: 0.6, color: '#2e1a63', press: 'even', alpha: 0.9 })
        })
      }
      grain(g, 0.25)
    },
  }
}
