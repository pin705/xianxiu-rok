// Texture cho phần chuyển động của cảnh (GPU diễn): sương, thác, hào quang, khói, cờ, hạc, đệ tử, tia sáng.
import { blot, canvas, grain, stroke, wash, type Asset, type G, type Pt } from './brush'
import { ellipse, vgrad } from './landscape'
import { fbm, noise2, rng } from './noise'
import { PIGMENT as C, mix, rgba } from './palette'

// Dải sương ghép liền theo chiều ngang (px thật, không theo DU — sương vốn mờ)
export function mistTex(w = 512, h = 96, seed = 1) {
  const cv = canvas(w, h)
  const g = cv.getContext('2d') as G
  const img = g.createImageData(w, h)
  const P = 6
  for (let i = 0; i < w * h; i++) {
    const x = i % w, y = (i / w) | 0
    const v = fbm((x / w) * P, (y / h) * 2.2, seed, 4, P, 0)
    const band = Math.exp(-(((y / h - 0.55) / 0.26) ** 2)) // đậm ở giữa dải
    const a = Math.max(0, Math.min(1, (v - 0.36) * 2.4)) * band
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 255
    img.data[i * 4 + 3] = Math.round(a * 235)
  }
  g.putImageData(img, 0, 0)
  return cv
}

// Vệt nước thác, ghép liền theo chiều dọc
export function fallTex(w = 32, h = 128, seed = 3) {
  const cv = canvas(w, h)
  const g = cv.getContext('2d') as G
  const img = g.createImageData(w, h)
  for (let i = 0; i < w * h; i++) {
    const x = i % w, y = (i / w) | 0
    const streak = noise2(x / 2.2, (y / h) * 3, seed, 0, 3)
    const edge = Math.sin((x / (w - 1)) * Math.PI) ** 0.6
    const a = Math.max(0, (streak - 0.3) * 1.6) * edge
    img.data[i * 4] = 255
    img.data[i * 4 + 1] = 255
    img.data[i * 4 + 2] = 255
    img.data[i * 4 + 3] = Math.round(Math.min(1, a) * 230)
  }
  g.putImageData(img, 0, 0)
  return cv
}

// Quầng sáng tròn mềm (đèn, linh khí, lửa) — tô màu bằng tint
export function glowTex(size = 64) {
  const cv = canvas(size, size)
  const g = cv.getContext('2d') as G
  const r = size / 2
  const gr = g.createRadialGradient(r, r, 0, r, r, r)
  gr.addColorStop(0, 'rgba(255,255,255,1)')
  gr.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, size, size)
  return cv
}

// Cột sáng dọc (Tụ Linh Trận): mờ ở trên, đậm ở chân
export function beamTex(w = 32, h = 256) {
  const cv = canvas(w, h)
  const g = cv.getContext('2d') as G
  const img = g.createImageData(w, h)
  for (let i = 0; i < w * h; i++) {
    const x = i % w, y = (i / w) | 0
    const across = Math.exp(-(((x / (w - 1) - 0.5) / 0.22) ** 2))
    const along = (y / h) ** 1.4
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 255
    img.data[i * 4 + 3] = Math.round(across * along * 255)
  }
  g.putImageData(img, 0, 0)
  return cv
}

// Cụm khói: vài vòng mờ chồng nhau, lệch nhau
export function puffTex(size = 64, seed = 5) {
  const cv = canvas(size, size)
  const g = cv.getContext('2d') as G
  const r = rng(seed)
  for (let i = 0; i < 6; i++) {
    const x = size * (0.35 + r() * 0.3), y = size * (0.35 + r() * 0.3), rr = size * (0.18 + r() * 0.14)
    const gr = g.createRadialGradient(x, y, 0, x, y, rr)
    gr.addColorStop(0, 'rgba(255,255,255,0.5)')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, size, size)
  }
  return cv
}

// Vòng sáng hình elip (phù văn Tụ Linh Trận, vòng chọn công trình) — nét mảnh, sáng
export function ringTex(w = 128, h = 40, width = 2) {
  const cv = canvas(w, h)
  const g = cv.getContext('2d') as G
  g.strokeStyle = 'rgba(255,255,255,0.95)'
  g.lineWidth = width
  g.beginPath()
  g.ellipse(w / 2, h / 2, w / 2 - width * 2, h / 2 - width * 2, 0, 0, Math.PI * 2)
  g.stroke()
  g.filter = 'blur(2px)'
  g.globalAlpha = 0.6
  g.stroke()
  return cv
}

// ---------- Hình nhỏ vẽ tay (neo ở chân) ----------

// Cờ đuôi nheo đỏ — neo ở đầu cán
export const flag = (): Asset => ({
  x: -1, y: -2, w: 16, h: 16,
  draw(g) {
    const p: Pt[] = [[0, 0], [13, 1], [10, 6], [13, 11], [0, 12]]
    wash(g, p, { fill: C.cinnabar, alpha: 1, jitter: 0.3, layers: 2, sharp: true, seed: 3 })
    stroke(g, [[0, 0], [13, 1], [10, 6], [13, 11], [0, 12]], { w: 0.6, color: C.ink, press: 'even', alpha: 0.7 })
    blot(g, 5, 6, 2, C.goldL, 0.9, 9)
  },
})

// Đệ tử luyện kiếm (áo trắng, đai lam) — neo ở chân
export const disciple = (sword = true): Asset => ({
  x: -8, y: -14, w: 16, h: 15,
  draw(g) {
    wash(g, [[-2.8, 0], [-1.9, -6.8], [1.9, -6.8], [2.8, 0]], { fill: C.silk, alpha: 1, jitter: 0.2, layers: 1, sharp: true, seed: 1 })
    stroke(g, [[-2.8, 0], [-1.9, -6.8], [1.9, -6.8], [2.8, 0]], { w: 0.4, color: C.ink, press: 'even', alpha: 0.7 })
    wash(g, [[-2, -4.8], [2, -4.8], [2, -3.9], [-2, -3.9]], { fill: C.azurite, alpha: 1, jitter: 0.1, layers: 1, sharp: true, seed: 2 })
    blot(g, 0, -8.6, 1.9, C.paper, 1, 3, 1)
    stroke(g, ellipse(0, -8.6, 1.9, 1.9, 10).concat([[1.9, -8.6]]), { w: 0.35, color: C.ink, press: 'even', alpha: 0.6 })
    blot(g, 0, -10, 1.6, C.ink, 1, 4, 0.6)
    if (sword) stroke(g, [[2, -5.4], [6.6, -10]], { w: 0.7, color: mix(C.silk, C.ink3, 0.3), press: 'even', alpha: 1 })
  },
})

// Hạc tiên — hai khung cánh (up/down), neo ở giữa thân
export const crane = (up: boolean): Asset => ({
  x: -24, y: -18, w: 44, h: 26,
  draw(g) {
    stroke(g, [[-12, 0], [-2, -1], [6, -2], [12, -4], [15, -4.5]], { w: 2.2, color: C.silk, press: 'even', alpha: 1 })
    stroke(g, [[-12, 0], [-2, -1], [6, -2], [12, -4]], { w: 0.5, color: C.ink, press: 'taper', alpha: 0.5 })
    stroke(g, [[8, -2.6], [12, -4.2], [15, -4.4]], { w: 1.1, color: C.ink, press: 'even', alpha: 0.9 })
    blot(g, 14.2, -5.2, 0.9, C.cinnabar, 1, 5)
    stroke(g, [[-12, 0], [-21, 2.4]], { w: 0.8, color: C.ink, press: 'taper', alpha: 0.9 })
    const wing: Pt[] = up ? [[-2, -1], [-5, -9], [-11, -14], [-18, -15], [-11, -8], [-6, -2]] : [[-2, -1], [-6, 5], [-12, 8], [-17, 7], [-10, 2], [-6, 0]]
    wash(g, wing, { fill: C.silk, alpha: 1, jitter: 0.2, layers: 1, seed: 7 })
    stroke(g, [...wing, wing[0]], { w: 0.5, color: C.ink, press: 'even', alpha: 0.7 })
    stroke(g, up ? [[-11, -14], [-18, -15], [-12, -10]] : [[-12, 8], [-17, 7], [-12, 4]], { w: 1.4, color: C.ink, press: 'taper', alpha: 0.9 })
  },
})

// Tia lửa/linh khí nhỏ hình thoi
export function sparkTex(size = 24) {
  const cv = canvas(size, size)
  const g = cv.getContext('2d') as G
  const r = size / 2
  const gr = g.createRadialGradient(r, r, 0, r, r, r)
  gr.addColorStop(0, 'rgba(255,255,255,1)')
  gr.addColorStop(0.25, 'rgba(255,255,255,0.8)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.beginPath()
  g.moveTo(r, 0)
  g.quadraticCurveTo(r, r, size, r)
  g.quadraticCurveTo(r, r, r, size)
  g.quadraticCurveTo(r, r, 0, r)
  g.quadraticCurveTo(r, r, r, 0)
  g.fill()
  return cv
}

// Tia sét: đường gãy khúc có nhánh, vẽ sẵn nhiều biến thể
export function boltTex(w = 64, h = 256, seed = 1) {
  const cv = canvas(w, h)
  const g = cv.getContext('2d') as G
  const r = rng(seed)
  const branch = (x: number, y: number, len: number, width: number, depth: number) => {
    const pts: Pt[] = [[x, y]]
    let cx = x, cy = y
    const steps = 10
    for (let i = 0; i < steps; i++) {
      cx += (r() - 0.5) * w * 0.28
      cy += len / steps
      cx = Math.max(4, Math.min(w - 4, cx))
      pts.push([cx, cy])
      if (depth < 1 && r() < 0.18) branch(cx, cy, len * 0.35, width * 0.5, depth + 1)
    }
    g.strokeStyle = 'rgba(255,255,255,1)'
    g.lineWidth = width
    g.lineJoin = 'miter'
    g.beginPath()
    pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)))
    g.stroke()
  }
  g.shadowColor = 'rgba(200,180,255,1)'
  g.shadowBlur = 8
  branch(w / 2, 0, h - 4, 3, 0)
  return cv
}

// Chân trời mực nhạt: dãy núi xa, rộng, tan vào sương ở dưới
export function farRange(w: number, h: number, seed: number, tone: string, alpha: number): Asset {
  return {
    x: 0, y: -h, w, h: h + 4,
    draw(g) {
      const r = rng(seed)
      const pts: Pt[] = [[0, 0]]
      const n = Math.round(w / 34)
      for (let i = 0; i <= n; i++) {
        const x = (i / n) * w
        const peak = fbm(i * 0.35, 0.5, seed, 3)
        pts.push([x, -h * (0.35 + peak * 0.65) + (r() - 0.5) * h * 0.08])
      }
      pts.push([w, 0])
      wash(g, pts, { fill: g2 => vgrad(g2, -h, 0, [[0, tone], [0.6, rgba(tone, 0.6)], [1, rgba(tone, 0)]]), alpha, jitter: 3, layers: 3, edge: 2, seed })
      // vài nét gân núi mực nhạt
      for (let i = 1; i < n; i += 2) {
        const [x, y] = pts[i + 1]
        stroke(g, [[x, y + 2], [x + (r() - 0.5) * 16, y + h * 0.25], [x + (r() - 0.5) * 24, y + h * 0.5]], { w: 1.2, color: mix(tone, C.ink, 0.4), press: 'nail', alpha: alpha * 0.35, dry: 0.5, seed: seed + i })
      }
      grain(g, 0.3)
    },
  }
}
