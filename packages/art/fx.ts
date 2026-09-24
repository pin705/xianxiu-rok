// Texture cho phần chuyển động của cảnh (GPU diễn): sương, thác, hào quang, khói, cờ, hạc, đệ tử, tia sáng.
import { bake, blot, canvas, ellipse, grain, lerp, stroke, wash, type Asset, type G, type Pt, vgrad } from './brush'
import { ring } from './chrome'
import { cloud } from './landscape'
import { fbm, noise2, rng } from './noise'
import { PIGMENT as C, mix, rgba, WHITE } from './palette'

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

// Mặt trời son (朱砂日): đĩa loang nhiều lớp, sáng lệch về một góc, mép sắc tố dồn đậm, ăn hạt giấy — neo ở tâm
export const sun = (r = 22): Asset => ({
  x: -r - 3, y: -r - 3, w: r * 2 + 6, h: r * 2 + 6,
  draw(g) {
    const fill = (g2: G) => {
      const gr = g2.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r * 1.05)
      gr.addColorStop(0, C.cinnabarL)
      gr.addColorStop(1, C.cinnabar)
      return gr
    }
    wash(g, ellipse(0, 0, r, r * 0.98, 16), { fill, alpha: 0.95, layers: 4, jitter: r * 0.05, edge: r * 0.09, seed: 3 })
    grain(g, 0.45)
  },
})

// Trăng: đĩa trắng chì loang, vài mảng bóng ngả vàng giấy, viền mực nhạt khô đứt quãng — neo ở tâm
export const moon = (r = 20): Asset => ({
  x: -r - 3, y: -r - 3, w: r * 2 + 6, h: r * 2 + 6,
  draw(g) {
    wash(g, ellipse(0, 0, r, r, 16), { fill: C.silk, alpha: 1, layers: 3, jitter: r * 0.04, edge: r * 0.05, seed: 5 })
    for (const [x, y, rr, sd] of [[-0.32, -0.12, 0.3, 1], [0.28, 0.22, 0.22, 2], [0.04, -0.48, 0.14, 3], [-0.1, 0.5, 0.12, 4]])
      wash(g, ellipse(x * r, y * r, rr * r, rr * r * 0.8, 9), { fill: C.paper3, alpha: 0.32, layers: 2, jitter: rr * r * 0.25, seed: 10 + sd })
    const rim = ellipse(0, 0, r, r, 18)
    stroke(g, [...rim, rim[0], rim[1]], { w: r * 0.07, color: C.ink3, press: 'taper', alpha: 0.4, dry: 0.55, seed: 8 })
    grain(g, 0.3)
  },
})

// Linh châu trên cột Tụ Linh Trận: hạt ngọc lam, mép đậm, chấm sáng lệch góc, viền mực mảnh — neo ở tâm
export const pearl = (r = 3): Asset => ({
  x: -r - 1, y: -r - 1, w: r * 2 + 2, h: r * 2 + 2,
  draw(g) {
    const fill = (g2: G) => {
      const gr = g2.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r)
      gr.addColorStop(0, mix(C.spirit, C.silk, 0.5))
      gr.addColorStop(1, C.azurite)
      return gr
    }
    wash(g, ellipse(0, 0, r, r, 12), { fill, alpha: 1, layers: 2, jitter: r * 0.04, edge: r * 0.12, seed: 21 })
    blot(g, -r * 0.35, -r * 0.38, r * 0.26, C.silk, 0.95, 22, 0.8)
    stroke(g, [...ellipse(0, 0, r, r, 12), [r, 0]], { w: r * 0.16, color: C.ink, press: 'even', alpha: 0.6 })
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

// Thanh phi kiếm nhỏ (mưa kiếm của công pháp)
export const flyingSword = (): Asset => ({
  x: -3, y: -16, w: 6, h: 20,
  draw(g) {
    stroke(g, [[0, 2], [0, -14]], { w: 1.4, color: mix(C.silk, C.azuriteL, 0.3), press: 'taper', alpha: 1 })
    stroke(g, [[0, 2], [0, -14]], { w: 0.4, color: C.ink, press: 'even', alpha: 0.6 })
    stroke(g, [[-2, -1.6], [2, -1.6]], { w: 1, color: C.gold, press: 'even', alpha: 1 })
    stroke(g, [[0, -1.6], [0, 2.4]], { w: 1.1, color: C.lacquer2, press: 'even', alpha: 1 })
  },
})

// Sân trận: giấy + trời theo cảnh + dãy núi xa + mặt đất loang + đá/tùng hai mép. Neo góc trên trái, w × h DU.
export type Theme = 'wild' | 'forest' | 'fire' | 'ice' | 'storm' | 'sect' | 'tower'
const SCENE_TONE: Record<Theme, { sky: string; ground: string; far: string }> = {
  wild: { sky: C.azuriteL, ground: C.malachiteL, far: C.azuriteL },
  forest: { sky: C.malachiteL, ground: C.malachite, far: C.malachiteD },
  fire: { sky: '#e0a07a', ground: C.ochre, far: '#8a4a36' },
  ice: { sky: '#cfe6f0', ground: '#e4eef2', far: '#8fb3c8' },
  storm: { sky: '#3b3356', ground: '#5d5870', far: '#2a2540' },
  sect: { sky: C.ochreL, ground: C.paper2, far: C.ink3 },
  tower: { sky: '#e6c98f', ground: mix(C.paper2, C.ink3, 0.3), far: C.azuriteL },
}
export function battlefield(w: number, h: number, theme: Theme): Asset {
  const t = SCENE_TONE[theme]
  return {
    x: 0, y: 0, w, h,
    draw(g) {
      if (theme === 'tower') return towerTop(g, w, h, t)
      const sky = g.createLinearGradient(0, 0, 0, h * 0.5)
      sky.addColorStop(0, rgba(t.sky, theme === 'storm' ? 0.95 : 0.55))
      sky.addColorStop(1, rgba(t.sky, 0))
      g.fillStyle = sky
      g.fillRect(0, 0, w, h * 0.5)
      // núi xa
      stamp(g, farRange(w, h * 0.16, 77, t.far, theme === 'storm' ? 0.7 : 0.45), 0, h * 0.3)
      // mặt đất: dải loang từ giữa xuống, đậm dần
      const ground: Pt[] = [[-10, h * 0.34], [w * 0.3, h * 0.33], [w * 0.7, h * 0.35], [w + 10, h * 0.33], [w + 10, h + 10], [-10, h + 10]]
      wash(g, ground, { fill: g2 => vgrad(g2, h * 0.33, h, [[0, rgba(t.ground, 0.25)], [1, rgba(t.ground, 0.7)]]), alpha: 1, jitter: 4, layers: 3, seed: 5 })
      // vệt đất, cỏ
      const r = rng(9)
      for (let i = 0; i < 26; i++) {
        const x = r() * w, y = h * (0.4 + r() * 0.55), l = 8 + r() * 26
        stroke(g, [[x, y], [x + l * 0.5, y - 1 + r() * 2], [x + l, y]], { w: 1 + r(), color: mix(t.ground, C.ink, 0.5), press: 'taper', alpha: 0.25 + r() * 0.2, dry: 0.5, seed: i })
      }
      // đá hai mép
      for (const [x, y, rw, rh, s] of [[18, h * 0.58, 70, 46, 1], [w - 16, h * 0.52, 60, 40, 2], [10, h * 0.92, 90, 60, 3], [w - 8, h * 0.96, 80, 56, 4]] as const) {
        const rock: Pt[] = [[x - rw / 2, y], [x - rw * 0.4, y - rh * 0.6], [x - rw * 0.1, y - rh], [x + rw * 0.25, y - rh * 0.8], [x + rw / 2, y]]
        wash(g, rock, { fill: g2 => vgrad(g2, y - rh, y, [[0, mix(t.far, C.ink, 0.2)], [1, mix(t.far, C.ink, 0.6)]]), alpha: 0.9, jitter: 2, layers: 2, edge: 1.5, seed: s * 11 })
        stroke(g, rock.slice(0, 3), { w: 2, color: C.ink, press: 'nail', dry: 0.35, alpha: 0.8, seed: s * 13 })
      }
      grain(g, 0.35)
    },
  }
}

// Vẽ một asset lên g qua canvas riêng: asset tự rắc hạt giấy lên cả canvas nó vẽ, vẽ thẳng thì hạt phủ đốm cả sân
function stamp(g: G, a: Asset, x: number, y: number) {
  const m = g.getTransform()
  g.drawImage(bake(a, Math.hypot(m.a, m.b)).canvas as HTMLCanvasElement, x + a.x, y + a.y, a.w, a.h)
}

// Đỉnh Thông Thiên Tháp: trời ráng vàng, biển mây (vài đỉnh núi nhô lên), mặt tháp lát đá nhìn phối cảnh,
// lan can đá trắng ở mép xa, vòng 圆相 khắc giữa sân, mây 如意 ôm hai góc dưới
function towerTop(g: G, w: number, h: number, t: { sky: string; ground: string; far: string }) {
  const sky = g.createLinearGradient(0, 0, 0, h * 0.4)
  sky.addColorStop(0, rgba(t.sky, 0.75))
  sky.addColorStop(1, rgba(C.silk, 0.2))
  g.fillStyle = sky
  g.fillRect(0, 0, w, h * 0.4)
  // đỉnh núi xa nhô khỏi mây
  stamp(g, farRange(w, h * 0.1, 91, t.far, 0.4), 0, h * 0.27)
  // biển mây: mảng loang trắng lụa, bụng mây hắt lam
  const r = rng(13)
  for (let i = 0; i < 14; i++) {
    const x = (i / 13) * w + (r() - 0.5) * 30, y = h * (0.27 + r() * 0.06), rx = 40 + r() * 50, ry = 10 + r() * 8
    wash(g, ellipse(x, y + ry * 0.5, rx, ry * 0.7, 12), { fill: C.azuriteL, alpha: 0.25, layers: 2, jitter: 3, seed: 40 + i })
    wash(g, ellipse(x, y, rx, ry, 12), { fill: C.silk, alpha: 0.85, layers: 3, jitter: 3, edge: 1.2, seed: 60 + i })
  }
  // mặt tháp: hình thang phối cảnh, đá đậm dần về phía người xem
  const y0 = h * 0.35, y1 = h + 10, L0 = w * 0.06, R0 = w * 0.94, L1 = -w * 0.35, R1 = w * 1.35
  // đá cẩm thạch: sáng ở mép xa, ngả xám ấm về phía người xem; vệt loang đá nhạt
  wash(g, [[L0, y0], [R0, y0], [R1, y1], [L1, y1]], { fill: g2 => vgrad(g2, y0, y1, [[0, mix(C.paper, C.silk, 0.4)], [1, mix(t.ground, C.paper, 0.3)]]), alpha: 1, jitter: 1.5, layers: 2, sharp: true, seed: 71 })
  for (let i = 0; i < 7; i++) {
    const x = w * (0.1 + r() * 0.8), y = h * (0.45 + r() * 0.5)
    wash(g, ellipse(x, y, 30 + r() * 40, 5 + r() * 5, 10), { fill: C.ink3, alpha: 0.08, layers: 2, jitter: 4, seed: 240 + i })
  }
  // mạch đá: hàng ngang dày dần về xa, cột chụm về phía chân trời
  for (let i = 1; i < 6; i++) {
    const k = (i / 6) ** 1.8, y = lerp(y0, y1, k)
    stroke(g, [[lerp(L0, L1, k), y], [lerp(R0, R1, k), y + 0.5]], { w: 0.5 + k * 1.1, color: C.ink2, press: 'taper', alpha: 0.1 + k * 0.08, dry: 0.5, seed: 80 + i })
  }
  for (let i = 1; i < 8; i++) {
    const u = i / 8
    stroke(g, [[lerp(L0, R0, u), y0], [lerp(L1, R1, u), y1]], { w: 1, color: C.ink2, press: 'taper', alpha: 0.1, dry: 0.5, seed: 100 + i })
  }
  // vòng 圆相 khắc chìm giữa sân (ép dẹt theo phối cảnh)
  g.save()
  g.translate(w / 2, h * 0.62)
  g.scale(1, 0.32)
  ring(g, 0, 0, w * 0.3, 3.2, C.goldD, 23, 0.35, 0.1, 0.45)
  ring(g, 0, 0, w * 0.2, 1.6, C.ink2, 24, 0.25, 0.3, 0.5)
  g.restore()
  // lan can đá trắng dọc mép xa: trụ + tay vịn
  const railY = y0 - 1, H = 17
  // bậc đá mép xa (gờ dày) rồi lan can: thanh vịn trên + thanh dưới, trụ có đầu búp sen
  wash(g, [[L0 - 4, y0 - 2], [R0 + 4, y0 - 2], [R0 + 6, y0 + 5], [L0 - 6, y0 + 5]], { fill: mix(C.paper2, C.ink3, 0.35), alpha: 1, jitter: 0.4, layers: 2, sharp: true, seed: 119 })
  stroke(g, [[L0 - 6, y0 + 5], [R0 + 6, y0 + 5]], { w: 1.2, color: C.ink, press: 'even', alpha: 0.55, dry: 0.3, seed: 118 })
  wash(g, [[L0, railY - H], [R0, railY - H], [R0, railY - H + 3.4], [L0, railY - H + 3.4]], { fill: C.silk, alpha: 1, jitter: 0.3, layers: 1, sharp: true, seed: 120 })
  wash(g, [[L0, railY - 5], [R0, railY - 5], [R0, railY - 2.6], [L0, railY - 2.6]], { fill: C.silk, alpha: 1, jitter: 0.3, layers: 1, sharp: true, seed: 123 })
  stroke(g, [[L0, railY - H], [R0, railY - H]], { w: 1.1, color: C.ink, press: 'even', alpha: 0.75, seed: 121 })
  stroke(g, [[L0, railY - H + 3.4], [R0, railY - H + 3.4]], { w: 0.6, color: C.ink, press: 'even', alpha: 0.5, seed: 122 })
  stroke(g, [[L0, railY - 2.6], [R0, railY - 2.6]], { w: 0.6, color: C.ink, press: 'even', alpha: 0.5, seed: 124 })
  const posts = 10
  for (let i = 0; i <= posts; i++) {
    const x = lerp(L0, R0, i / posts)
    wash(g, [[x - 2.6, railY + 1], [x - 2.6, railY - H - 1], [x + 2.6, railY - H - 1], [x + 2.6, railY + 1]], { fill: C.silk, alpha: 1, jitter: 0.2, layers: 1, sharp: true, seed: 130 + i })
    wash(g, [[x + 0.6, railY + 1], [x + 0.6, railY - H - 1], [x + 2.6, railY - H - 1], [x + 2.6, railY + 1]], { fill: C.ink3, alpha: 0.25, jitter: 0.1, layers: 1, sharp: true, seed: 140 + i })
    blot(g, x, railY - H - 2.6, 3, C.silk, 1, 150 + i, 0.85)
    stroke(g, [[x - 2.6, railY + 1], [x - 2.6, railY - H - 1]], { w: 0.6, color: C.ink, press: 'nail', alpha: 0.7, seed: 170 + i })
    stroke(g, [[x + 2.6, railY - H - 1], [x + 2.6, railY + 1]], { w: 1, color: C.ink, press: 'nail', alpha: 0.75, seed: 190 + i })
    stroke(g, [[x - 3, railY - H - 2.2], [x, railY - H - 5.4], [x + 3, railY - H - 2.2]], { w: 0.8, color: C.ink, press: 'taper', alpha: 0.75, seed: 210 + i })
  }
  // mây 如意 ôm hai góc dưới: tháp như nổi giữa trời
  for (const [x, y, cw, sd] of [[-6, h * 0.97, 150, 11], [w + 8, h * 0.99, 160, 17], [w * 0.1, h * 0.7, 90, 23]] as const) {
    stamp(g, cloud(cw, sd), x, y)
  }
  grain(g, 0.12) // mặt đá đục: hạt giấy nặng tay sẽ thành đốm rằn ri
}

// ---------- VFX: kiếp vân, tia nắng, mưa, mực văng, nứt đất, bướm, chim, cánh hoa ----------

// Kiếp vân nhìn từ trên xuống (cảnh ép dẹt theo chiều dọc để thành đĩa nghiêng): các nhánh mây đen xoắn ốc về tâm,
// Xoáy kiếp vân nhìn từ dưới lên: nhánh mây xoắn ốc log quanh mắt bão, mép tan, lõi rỗng (cảnh ép dẹt + quay).
// Mây đặc thì mực tím sẫm, mép mây hắt ánh tím từ mắt bão.
export function vortexTex(size = 256, seed = 5, arms = 3, twist = 1.6) {
  const cv = canvas(size, size)
  const g = cv.getContext('2d') as G
  const img = g.createImageData(size, size)
  const c = size / 2
  const sm = (a: number, b: number, x: number) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)
  }
  const dark = [20, 14, 38], mid = [62, 48, 104], rim = [182, 160, 240]
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5 - c) / c, dy = (y + 0.5 - c) / c
      const r = Math.hypot(dx, dy)
      if (r >= 1) continue
      const lr = Math.log(r + 0.02)
      const phi = Math.atan2(dy, dx) - lr * twist // càng vào trong càng xoắn
      const u = (phi / (Math.PI * 2)) * 6 // chu kỳ 6 ô noise mỗi vòng: liền mạch quanh tâm
      const warp = fbm(u, lr * 2.2, seed, 3, 6)
      const arm = 0.5 + 0.5 * Math.cos(phi * arms + (warp - 0.5) * 6)
      const cl = fbm(u * 2, lr * 5, seed + 7, 4, 12)
      const d = Math.max(0, Math.min(1, (arm * 0.6 + cl * 0.8 - 0.36) * 2.4)) * sm(1, 0.62, r) * sm(0.07, 0.3, r)
      if (d <= 0) continue
      const lit = (1 - d) * sm(0.75, 0.15, r) * 0.85 // mép mỏng gần mắt bão sáng lên
      const i = (y * size + x) * 4
      for (let k = 0; k < 3; k++) {
        const base = mid[k] + (dark[k] - mid[k]) * d
        img.data[i + k] = base + (rim[k] - base) * lit
      }
      img.data[i + 3] = Math.min(255, d * 330)
    }
  g.putImageData(img, 0, 0)
  return cv
}

// Tia nắng: dải sáng mờ hai mép, tan hai đầu (tô màu bằng tint)
export function rayTex(w = 64, h = 256) {
  const cv = canvas(w, h)
  const g = cv.getContext('2d') as G
  const img = g.createImageData(w, h)
  for (let i = 0; i < w * h; i++) {
    const x = i % w, y = (i / w) | 0
    const across = Math.exp(-(((x / (w - 1) - 0.5) / 0.28) ** 2))
    const along = Math.sin((y / (h - 1)) * Math.PI) ** 0.8 * (1 - (y / h) * 0.4)
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 255
    img.data[i * 4 + 3] = Math.round(across * along * 200)
  }
  g.putImageData(img, 0, 0)
  return cv
}

// Mưa xiên ghép liền
export function rainTex(size = 128, seed = 9) {
  const cv = canvas(size, size)
  const g = cv.getContext('2d') as G
  const r = rng(seed)
  g.strokeStyle = 'rgba(230,236,255,0.55)'
  g.lineCap = 'round'
  for (let i = 0; i < 70; i++) {
    const x = r() * size, y = r() * size, l = 6 + r() * 10
    g.lineWidth = 0.6 + r() * 0.8
    for (const ox of [-size, 0, size])
      for (const oy of [-size, 0, size]) {
        g.beginPath()
        g.moveTo(x + ox, y + oy)
        g.lineTo(x + ox - l * 0.3, y + oy + l)
        g.stroke()
      }
  }
  return cv
}

// Mực văng: một vệt loang giữa, tia bắn và giọt quanh (đen — tô màu bằng tint)
export function splashTex(size = 128, seed = 3) {
  const cv = canvas(size, size)
  const g = cv.getContext('2d') as G
  const c = size / 2
  const r = rng(seed)
  blot(g, c, c, size * 0.2, WHITE, 1, seed, 0.95)
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, l = size * (0.22 + r() * 0.22)
    stroke(g, [[c + Math.cos(a) * size * 0.1, c + Math.sin(a) * size * 0.1], [c + Math.cos(a) * l, c + Math.sin(a) * l]], { w: size * (0.03 + r() * 0.04), color: WHITE, press: 'nail', alpha: 1, seed: seed + i })
  }
  for (let i = 0; i < 16; i++) {
    const a = r() * Math.PI * 2, d = size * (0.25 + r() * 0.2)
    blot(g, c + Math.cos(a) * d, c + Math.sin(a) * d, size * (0.01 + r() * 0.025), WHITE, 1, seed + 50 + i, 1)
  }
  return cv
}

// Vết nứt đất toả tia (thể tu dậm đất)
export function crackTex(size = 128, seed = 4) {
  const cv = canvas(size, size)
  const g = cv.getContext('2d') as G
  const c = size / 2
  const r = rng(seed)
  for (let i = 0; i < 7; i++) {
    let a = (i / 7) * Math.PI * 2 + r() * 0.4, x = c, y = c
    const pts: Pt[] = [[x, y]]
    for (let k = 0; k < 4; k++) {
      a += (r() - 0.5) * 0.7
      const l = size * (0.08 + r() * 0.06)
      x += Math.cos(a) * l
      y += Math.sin(a) * l
      pts.push([x, y])
    }
    stroke(g, pts, { w: size * 0.03, color: WHITE, press: 'nail', alpha: 1, seed: seed + i })
  }
  return cv
}

// Bướm (hai khung: cánh mở/khép), neo ở thân
export const butterfly = (open: boolean, tone = '#f2b8c6'): Asset => ({
  x: -7, y: -6, w: 14, h: 12,
  draw(g) {
    const w = open ? 6 : 2.2
    for (const s of [-1, 1]) {
      const up: Pt[] = [[0, -0.5], [s * w * 0.9, -4.5], [s * w, -1.5], [s * 1, 0.4]]
      const lo: Pt[] = [[0, 0.5], [s * w * 0.75, 3.8], [s * w * 0.4, 4.6], [s * 0.6, 1]]
      wash(g, up, { fill: tone, alpha: 1, jitter: 0.1, layers: 1, seed: 3 + s })
      wash(g, lo, { fill: mix(tone, C.silk, 0.4), alpha: 1, jitter: 0.1, layers: 1, seed: 5 + s })
      stroke(g, [...up, up[0]], { w: 0.4, color: C.ink, press: 'even', alpha: 0.7 })
      blot(g, s * w * 0.6, -2.5, 0.5, C.ink, 0.8, 7 + s, 1)
    }
    stroke(g, [[0, -2.5], [0, 2.8]], { w: 0.8, color: C.ink, press: 'taper', alpha: 0.9 })
  },
})

// Chim nhỏ bay xa: nét "v" mực, hai khung
export const bird = (up: boolean): Asset => ({
  x: -6, y: -4, w: 12, h: 8,
  draw(g) {
    const y = up ? -2.8 : 1.4
    stroke(g, [[-5, y], [-2.4, y * 0.3], [0, 0.6]], { w: 1, color: C.ink, press: 'nail', alpha: 0.85 })
    stroke(g, [[5, y], [2.4, y * 0.3], [0, 0.6]], { w: 1, color: C.ink, press: 'nail', alpha: 0.85 })
  },
})

// Cánh hoa mai rơi
export function petalTex(size = 16) {
  const cv = canvas(size, size)
  const g = cv.getContext('2d') as G
  blot(g, size / 2, size / 2, size * 0.36, '#f2b8c6', 1, 2, 0.6, 0.6)
  blot(g, size / 2 - 1, size / 2 - 1, size * 0.14, '#fbe3e8', 1, 3, 0.8)
  return cv
}

// ---------- VFX nét bút (trắng — tô màu bằng tint) ----------
// dry: độ khô của nét. Khung sau vẽ khô hơn → đuôi nét tước sợi rồi tan (飞白), thay cho mờ dần đều.
// k: hệ số bề ngang. Cùng hình vẽ mảnh hơn làm lõi sáng đè lên bóng mực (battle.ts ghép ba lớp).
const W = WHITE
function blank(w: number, h: number) {
  const cv = canvas(w, h)
  return { cv, g: cv.getContext('2d') as G }
}

// Kiếm khí trăng khuyết: đầu (phải, hướng bay) nhọn rồi phình nhanh, đuôi dài vuốt nhỏ; một nét phụ khô bám dưới
export function slashTex(w = 128, h = 64, seed = 1, dry = 0.3, k = 1) {
  const { cv, g } = blank(w, h)
  const arc: Pt[] = [[w * 0.95, h * 0.6], [w * 0.8, h * 0.36], [w * 0.52, h * 0.27], [w * 0.24, h * 0.35], [w * 0.05, h * 0.55]]
  const press = (t: number) => (t < 0.12 ? 0.2 + 0.8 * Math.sin(((t / 0.12) * Math.PI) / 2) : (1 - (t - 0.12) / 0.88) ** 0.8)
  stroke(g, arc, { w: h * 0.3 * k, color: W, alpha: 1, press, dry, ink: 0.3, rough: 0.4, seed })
  const low = arc.slice(0, 4).map(([x, y], i): Pt => [x - w * 0.04, y + h * (0.13 + i * 0.02)])
  stroke(g, low, { w: h * 0.1 * k, color: W, alpha: 0.8, press: 'nail', dry: Math.min(1, dry + 0.25), rough: 0.5, seed: seed + 7 })
  return cv
}

// Ba vết vuốt: nhọn hai đầu, khô dần về cuối. n: số vết đã hiện (vuốt lần lượt từng vết)
export function clawTex(size = 96, seed = 2, dry = 0.4, k = 1, n = 3) {
  const { cv, g } = blank(size, size)
  ;[0.82, 1, 0.88].slice(0, n).forEach((len, i) => {
    const o = (i - 1) * size * 0.2
    stroke(g, [[size * 0.24 + o, size * 0.1], [size * 0.6 + o, size * 0.46], [size * 0.52 + o, size * 0.1 + size * 0.8 * len]], {
      w: size * 0.13 * k, color: W, alpha: 1, press: 'taper', dry, rough: 0.45, seed: seed + i,
    })
  })
  return cv
}

// Vòng mực một nét (圆相) ép dẹt thành elip nằm trên đất + vòng mảnh lệch pha: sóng chấn, vòng chọn, trận văn, khiên
export function ringTex(w = 160, h = 48, width = 2.5, seed = 3, dry = 0.5, k = 1) {
  const { cv, g } = blank(w, h)
  g.translate(w / 2, h / 2)
  g.scale(1, h / w)
  ring(g, 0, 0, w * 0.43, width * 2.4 * k, W, seed, 1, 0.1, dry)
  ring(g, 0, 0, w * 0.34, width * 0.9 * k, W, seed + 5, 0.7, 0.4, Math.min(1, dry + 0.2))
  return cv
}

// Trúng đòn: tâm loang + tia bút toả ra dài ngắn không đều, đầu đậm ở tâm
export function burstTex(size = 128, seed = 5, dry = 0.3, k = 1) {
  const { cv, g } = blank(size, size)
  const c = size / 2, r = rng(seed)
  blot(g, c, c, size * 0.13 * k, W, 1, seed, 0.85)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + (r() - 0.5) * 0.6, l = size * (0.2 + r() * 0.24), bend = (r() - 0.5) * 0.3
    stroke(g, [[c + Math.cos(a) * size * 0.05, c + Math.sin(a) * size * 0.05], [c + Math.cos(a + bend) * l * 0.55, c + Math.sin(a + bend) * l * 0.55], [c + Math.cos(a) * l, c + Math.sin(a) * l]], {
      w: size * (0.05 + r() * 0.05) * k, color: W, alpha: 1, press: 'nail', dry, rough: 0.45, seed: seed + i,
    })
  }
  return cv
}

// Hoả cầu / cầu linh khí đang bay: đầu tròn (phải, hướng bay), năm lưỡi lửa uốn sóng vuốt về sau, lưỡi giữa dài nhất
export function orbTex(w = 96, h = 64, seed = 7, dry = 0.25, k = 1) {
  const { cv, g } = blank(w, h)
  const hx = w * 0.7, hy = h * 0.5, R = h * 0.26, r = rng(seed)
  ;[-2, -1, 0, 1, 2].forEach((s, i) => {
    const a = Math.abs(s), len = w * (0.6 - a * 0.1 + r() * 0.06), ph = r() * 6, amp = h * (0.04 + a * 0.01)
    const pts: Pt[] = []
    // lưỡi lửa toả ra từ đầu rồi chụm về đuôi (hình giọt), uốn sóng mạnh dần về cuối
    for (let j = 0; j <= 5; j++) {
      const u = j / 5
      pts.push([hx + R * 0.3 - len * u, hy + s * R * 0.45 * (1 - u * 0.7) + Math.sin(u * 5 + ph) * amp * u])
    }
    stroke(g, pts, { w: R * (1.5 - a * 0.35) * k, color: W, alpha: 1, press: 'nail', dry: Math.min(1, dry + a * 0.1), ink: 0.45, rough: 0.45, seed: seed + i })
  })
  blot(g, hx, hy, R * k, W, 1, seed + 9, 0.95)
  return cv
}

// Sét: đường chia đôi nhiều lần (giữ góc gãy), thân to ở gốc nhỏ dần, vài nhánh; mép sần như nét bút quật.
// Nướng đúng tỉ lệ nơi dùng (cao hẹp ~1:4) để khỏi kéo giãn làm góc gãy thành sợi thẳng.
export function boltTex(w = 160, h = 640, seed = 1, k = 1) {
  const { cv, g } = blank(w, h)
  const r = rng(seed)
  const jag = (a: Pt, b: Pt, rough: number, depth: number) => {
    let pts: Pt[] = [a, b]
    let off = Math.hypot(b[0] - a[0], b[1] - a[1]) * rough
    for (let d = 0; d < depth; d++, off /= 2)
      pts = pts.flatMap((p, i): Pt[] => {
        if (!i) return [p]
        const q = pts[i - 1], nx = q[1] - p[1], ny = p[0] - q[0], l = Math.hypot(nx, ny) || 1, o = (r() - 0.5) * off
        return [[(p[0] + q[0]) / 2 + (nx / l) * o, (p[1] + q[1]) / 2 + (ny / l) * o], p]
      })
    return pts.map(([x, y]): Pt => [Math.max(w * 0.08, Math.min(w * 0.92, x)), y])
  }
  const main = jag([w * 0.5, 0], [w * (0.4 + r() * 0.2), h], 0.12, 6)
  stroke(g, main, { w: w * 0.09 * k, color: W, alpha: 1, press: 'nail', rough: 0.55, dry: 0.08, wobble: 0, seed })
  for (let i = 0; i < 4; i++) {
    const from = main[Math.floor((0.1 + r() * 0.6) * (main.length - 1))]
    const an = Math.PI / 2 + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.45), l = h * (0.1 + r() * 0.14)
    stroke(g, jag(from, [from[0] + Math.cos(an) * l, from[1] + Math.sin(an) * l], 0.25, 4), { w: w * 0.045 * k, color: W, alpha: 1, press: 'nail', rough: 0.5, dry: 0.2, wobble: 0, seed: seed + i + 1 })
  }
  return cv
}

// Khói, bụi, mực tan: vài mảng loang chồng lệch, mép mềm có vệt sắc tố (墨晕) — không phải quầng tròn đều
export function puffTex(size = 64, seed = 5) {
  const { cv, g } = blank(size, size)
  const r = rng(seed)
  for (let i = 0; i < 4; i++) {
    const x = size * (0.38 + r() * 0.24), y = size * (0.4 + r() * 0.22), rr = size * (0.14 + r() * 0.1)
    wash(g, ellipse(x, y, rr, rr * 0.86, 9), { fill: W, alpha: 0.4, layers: 4, jitter: rr * 0.3, edge: size * 0.025, seed: seed + i * 3 })
  }
  return cv
}

// Vệt bay thẳng (mưa kiếm, vật rơi nhanh): đầu (dưới) đậm, kéo lên trên khô tước sợi
export function streakTex(w = 24, h = 128, seed = 11, dry = 0.55, k = 1) {
  const { cv, g } = blank(w, h)
  stroke(g, [[w * 0.5, h * 0.95], [w * 0.54, h * 0.5], [w * 0.5, h * 0.04]], { w: w * 0.5 * k, color: W, alpha: 1, press: 'nail', dry, ink: 0.5, rough: 0.4, seed })
  return cv
}

// Một vệt mực ngắn của nét đứt (đường đi trên bản đồ): hai đầu thu nhỏ, mép sần — tô màu bằng tint
export function dashTex(w = 32, h = 10, seed = 3) {
  const { cv, g } = blank(w, h)
  stroke(g, [[w * 0.1, h * 0.55], [w * 0.5, h * 0.42], [w * 0.9, h * 0.52]], { w: h * 0.55, color: W, alpha: 1, press: 'taper', rough: 0.5, dry: 0.2, seed })
  return cv
}

// Cờ quân hành quân trên bản đồ: đĩa sơn mài viền vàng một nét (圆相), cán vàng, lá cờ son — neo ở tâm đĩa
export const marchToken = (): Asset => ({
  x: -10, y: -10, w: 20, h: 21,
  draw(g) {
    blot(g, 0.4, 1.2, 8.6, C.ink, 0.22, 3, 0.9)
    wash(g, ellipse(0, 0, 8, 8, 14), { fill: C.lacquer, alpha: 1, layers: 2, jitter: 0.25, edge: 0.8, seed: 4 })
    ring(g, 0, 0, 7.5, 1.3, C.gold, 5, 0.95, 0.06)
    stroke(g, [[-2.5, 5], [-2.4, -6.2]], { w: 1.1, color: C.goldL, press: 'nail', alpha: 1 })
    const flag: Pt[] = [[-2.2, -6], [5.2, -4.6], [3.6, -3.3], [5, -1.6], [-2.2, -1.1]]
    wash(g, flag, { fill: C.cinnabar, alpha: 1, layers: 2, jitter: 0.15, seed: 6 })
    stroke(g, [...flag, flag[0]], { w: 0.4, color: C.ink, press: 'even', alpha: 0.6 })
    grain(g, 0.3)
  },
})
