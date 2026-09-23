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

// Kiếm khí hình trăng khuyết (bay ngang, tô màu bằng tint)
export function slashTex(w = 96, h = 48) {
  const cv = canvas(w, h)
  const g = cv.getContext('2d') as G
  const gr = g.createLinearGradient(0, 0, w, 0)
  gr.addColorStop(0, 'rgba(255,255,255,0)')
  gr.addColorStop(0.7, 'rgba(255,255,255,0.9)')
  gr.addColorStop(1, 'rgba(255,255,255,1)')
  g.fillStyle = gr
  g.beginPath()
  g.moveTo(w * 0.05, h * 0.5)
  g.quadraticCurveTo(w * 0.7, -h * 0.05, w * 0.98, h * 0.5)
  g.quadraticCurveTo(w * 0.7, h * 0.28, w * 0.05, h * 0.5)
  g.fill()
  g.globalAlpha = 0.5
  g.beginPath()
  g.moveTo(w * 0.1, h * 0.5)
  g.quadraticCurveTo(w * 0.72, h * 1.02, w * 0.96, h * 0.52)
  g.quadraticCurveTo(w * 0.7, h * 0.7, w * 0.1, h * 0.5)
  g.fill()
  return cv
}

// Vết vuốt: ba đường cong song song
export function clawTex(size = 64) {
  const cv = canvas(size, size)
  const g = cv.getContext('2d') as G
  g.lineCap = 'round'
  for (let i = 0; i < 3; i++) {
    const o = (i - 1) * size * 0.2
    const gr = g.createLinearGradient(size * 0.2, 0, size * 0.8, size)
    gr.addColorStop(0, 'rgba(255,255,255,0)')
    gr.addColorStop(0.5, 'rgba(255,255,255,1)')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.strokeStyle = gr
    g.lineWidth = size * 0.07
    g.beginPath()
    g.moveTo(size * 0.25 + o, size * 0.1)
    g.quadraticCurveTo(size * 0.62 + o, size * 0.45, size * 0.55 + o, size * 0.92)
    g.stroke()
  }
  return cv
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
export type Theme = 'wild' | 'forest' | 'fire' | 'ice' | 'storm' | 'sect'
const SCENE_TONE: Record<Theme, { sky: string; ground: string; far: string }> = {
  wild: { sky: C.azuriteL, ground: C.malachiteL, far: C.azuriteL },
  forest: { sky: C.malachiteL, ground: C.malachite, far: C.malachiteD },
  fire: { sky: '#e0a07a', ground: C.ochre, far: '#8a4a36' },
  ice: { sky: '#cfe6f0', ground: '#e4eef2', far: '#8fb3c8' },
  storm: { sky: '#3b3356', ground: '#5d5870', far: '#2a2540' },
  sect: { sky: C.ochreL, ground: C.paper2, far: C.ink3 },
}
export function battlefield(w: number, h: number, theme: Theme): Asset {
  const t = SCENE_TONE[theme]
  return {
    x: 0, y: 0, w, h,
    draw(g) {
      const sky = g.createLinearGradient(0, 0, 0, h * 0.5)
      sky.addColorStop(0, rgba(t.sky, theme === 'storm' ? 0.95 : 0.55))
      sky.addColorStop(1, rgba(t.sky, 0))
      g.fillStyle = sky
      g.fillRect(0, 0, w, h * 0.5)
      // núi xa
      const far = farRange(w, h * 0.16, 77, t.far, theme === 'storm' ? 0.7 : 0.45)
      g.save()
      g.translate(0, h * 0.3)
      far.draw(g)
      g.restore()
      // mặt đất: dải loang từ giữa xuống, đậm dần
      const ground: Pt[] = [[-10, h * 0.34], [w * 0.3, h * 0.33], [w * 0.7, h * 0.35], [w + 10, h * 0.33], [w + 10, h + 10], [-10, h + 10]]
      wash(g, ground, { fill: g2 => { const r = g2.createLinearGradient(0, h * 0.33, 0, h); r.addColorStop(0, rgba(t.ground, 0.25)); r.addColorStop(1, rgba(t.ground, 0.7)); return r }, alpha: 1, jitter: 4, layers: 3, seed: 5 })
      // vệt đất, cỏ
      const r = rng(9)
      for (let i = 0; i < 26; i++) {
        const x = r() * w, y = h * (0.4 + r() * 0.55), l = 8 + r() * 26
        stroke(g, [[x, y], [x + l * 0.5, y - 1 + r() * 2], [x + l, y]], { w: 1 + r(), color: mix(t.ground, C.ink, 0.5), press: 'taper', alpha: 0.25 + r() * 0.2, dry: 0.5, seed: i })
      }
      // đá hai mép
      for (const [x, y, rw, rh, s] of [[18, h * 0.58, 70, 46, 1], [w - 16, h * 0.52, 60, 40, 2], [10, h * 0.92, 90, 60, 3], [w - 8, h * 0.96, 80, 56, 4]] as const) {
        const rock: Pt[] = [[x - rw / 2, y], [x - rw * 0.4, y - rh * 0.6], [x - rw * 0.1, y - rh], [x + rw * 0.25, y - rh * 0.8], [x + rw / 2, y]]
        wash(g, rock, { fill: g2 => { const r2 = g2.createLinearGradient(0, y - rh, 0, y); r2.addColorStop(0, mix(t.far, C.ink, 0.2)); r2.addColorStop(1, mix(t.far, C.ink, 0.6)); return r2 }, alpha: 0.9, jitter: 2, layers: 2, edge: 1.5, seed: s * 11 })
        stroke(g, rock.slice(0, 3), { w: 2, color: C.ink, press: 'nail', dry: 0.35, alpha: 0.8, seed: s * 13 })
      }
      grain(g, 0.35)
    },
  }
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
  blot(g, c, c, size * 0.2, '#ffffff', 1, seed, 0.95)
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, l = size * (0.22 + r() * 0.22)
    stroke(g, [[c + Math.cos(a) * size * 0.1, c + Math.sin(a) * size * 0.1], [c + Math.cos(a) * l, c + Math.sin(a) * l]], { w: size * (0.03 + r() * 0.04), color: '#ffffff', press: 'nail', alpha: 1, seed: seed + i })
  }
  for (let i = 0; i < 16; i++) {
    const a = r() * Math.PI * 2, d = size * (0.25 + r() * 0.2)
    blot(g, c + Math.cos(a) * d, c + Math.sin(a) * d, size * (0.01 + r() * 0.025), '#ffffff', 1, seed + 50 + i, 1)
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
    stroke(g, pts, { w: size * 0.03, color: '#ffffff', press: 'nail', alpha: 1, seed: seed + i })
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
