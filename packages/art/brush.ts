// Bút lông trên giấy xuyến chỉ. Mọi hình trong game vẽ bằng mấy hàm này nên cùng một "tay vẽ":
// nét có lực (đầu to đuôi nhỏ), mép nét sần, cuối nét khô tách sợi (飞白), mảng màu loang không đều, mép màu đậm hơn.
// Toạ độ là đơn vị thiết kế (DU); bake() lo phóng theo độ phân giải màn hình.
import { noise1, noise2, rng } from './noise'
import { rgba } from './palette'

export type Pt = readonly [number, number]
export type G = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
type P = [number, number]

// Số DU trong một pixel thật của canvas đang vẽ
const pxOf = (g: G) => {
  const m = g.getTransform()
  return 1 / Math.hypot(m.a, m.b)
}

// Catmull-Rom qua các điểm, lấy mẫu dày cách nhau ~step
export function spline(pts: readonly Pt[], step: number, closed = false): P[] {
  const n = pts.length
  if (n < 2) return pts.map(p => [p[0], p[1]])
  const at = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))])
  const out: P[] = []
  const segs = closed ? n : n - 1
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2)
    const k = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step))
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])])
    }
  }
  if (!closed) out.push([pts[n - 1][0], pts[n - 1][1]])
  return out
}

// ---------- Nét bút ----------

export type Press = 'taper' | 'nail' | 'even' | 'fade' | 'swell' | 'rise' | ((t: number) => number)
const PRESS: Record<Exclude<Press, Function>, (t: number) => number> = {
  taper: t => Math.pow(Math.sin(Math.PI * Math.min(0.98, Math.max(0.02, t))), 0.55), // 中锋: nhọn hai đầu
  nail: t => (t < 0.07 ? 0.8 + (t / 0.07) * 0.2 : 0.1 + 0.9 * Math.pow(1 - (t - 0.07) / 0.93, 0.75)), // 钉头鼠尾: đầu đinh đuôi chuột
  even: t => 0.6 + 0.4 * Math.min(1, t / 0.06, (1 - t) / 0.06), // 界画: nét thước, hai đầu hơi thu
  fade: t => 1 - 0.8 * t, // quét nhanh, nhạt dần
  swell: t => 0.4 + 0.6 * Math.sin(Math.PI * t), // phình giữa
  rise: t => 0.12 + 0.88 * Math.pow(Math.min(1, t / 0.85), 0.8) * Math.min(1, (1 - t) / 0.08 + 0.3), // nhỏ → to, dừng bút
}

export type StrokeOpts = {
  w: number // bề ngang lớn nhất (DU)
  color: string // '#rrggbb'
  alpha?: number // độ đậm mực
  press?: Press
  dry?: number // 0 ướt … 1 rất khô (tách sợi)
  ink?: number // mực cạn dần về cuối nét, 0..1
  wobble?: number // tay run (DU)
  rough?: number // mép nét sần 0..1
  bleed?: number // mực loang ra giấy 0..1
  seed?: number
}

export function stroke(g: G, pts: readonly Pt[], o: StrokeOpts) {
  const px = pxOf(g)
  const c = spline(pts, Math.max(px * 1.4, o.w * 0.12))
  const n = c.length
  if (n < 2) return
  const seed = o.seed ?? Math.floor(Math.abs(pts[0][0] * 131 + pts[0][1] * 71)) % 9973
  const press = typeof o.press === 'function' ? o.press : PRESS[o.press ?? 'taper']
  const alpha = o.alpha ?? 0.92
  const rough = o.rough ?? 0.35
  const wob = o.wobble ?? o.w * 0.08

  // độ dài tích luỹ
  const s = new Float32Array(n)
  for (let i = 1; i < n; i++) s[i] = s[i - 1] + Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1])
  const len = s[n - 1] || 1

  // tâm nét (có run tay), pháp tuyến, nửa bề ngang trái/phải
  const cx = new Float32Array(n), cy = new Float32Array(n), nx = new Float32Array(n), ny = new Float32Array(n)
  const hl = new Float32Array(n), hr = new Float32Array(n)
  const fq = 1 / Math.max(o.w * 1.6, px * 6)
  const ff = 1 / Math.max(o.w * 0.25, px * 1.5) // sần mịn: mép mực thấm vào sợi giấy
  for (let i = 0; i < n; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)]
    let tx = b[0] - a[0], ty = b[1] - a[1]
    const tl = Math.hypot(tx, ty) || 1
    tx /= tl
    ty /= tl
    nx[i] = -ty
    ny[i] = tx
    const d = (noise1(s[i] * 0.04, seed) - 0.5) * 2 * wob
    cx[i] = c[i][0] + nx[i] * d
    cy[i] = c[i][1] + ny[i] * d
    const t = s[i] / len
    const base = (o.w * press(t)) / 2
    const jag = (k: number) => rough * ((noise1(s[i] * fq, seed + k) - 0.5) * 1.1 + (noise1(s[i] * ff, seed + k + 9) - 0.5) * 0.5)
    hl[i] = Math.max(px * 0.35, base * (1 + jag(1)))
    hr[i] = Math.max(px * 0.35, base * (1 + jag(2)))
  }
  const edge = (i: number, u: number): P => {
    const h = u >= 0 ? hl[i] * u * 2 : hr[i] * u * 2
    return [cx[i] + nx[i] * h, cy[i] + ny[i] * h]
  }
  // Thân nét kín, hai đầu tròn (đầu bút chạm giấy không bao giờ vuông)
  const body = (grow: number) => {
    const cap = (i: number, dir: number, from: number) => {
      const r = ((hl[i] + hr[i]) / 2) * grow
      for (let k = 1; k < 8; k++) {
        const a = (k / 8) * Math.PI * dir + from
        const ux = Math.cos(a), uy = Math.sin(a) // theo hệ (pháp tuyến, tiếp tuyến)
        g.lineTo(cx[i] + (nx[i] * ux + ny[i] * uy) * r, cy[i] + (ny[i] * ux - nx[i] * uy) * r)
      }
    }
    g.beginPath()
    let p = edge(0, 0.5 * grow)
    g.moveTo(p[0], p[1])
    for (let i = 1; i < n; i++) (p = edge(i, 0.5 * grow)), g.lineTo(p[0], p[1])
    cap(n - 1, 1, 0) // vòng qua phía trước
    for (let i = n - 1; i >= 0; i--) (p = edge(i, -0.5 * grow)), g.lineTo(p[0], p[1])
    cap(0, 1, Math.PI) // vòng qua phía sau
    g.closePath()
    g.fill()
  }
  // Một sợi lông từ mẫu a tới b, giữa (u0,u1); hai đầu vuốt nhọn
  const hair = (a: number, b: number, u0: number, u1: number) => {
    const m = Math.max(1, Math.min(4, (b - a) / 2))
    const mid = (u0 + u1) / 2
    const at = (i: number, u: number) => edge(i, mid + (u - mid) * Math.min(1, (i - a) / m, (b - i) / m))
    g.beginPath()
    let p = at(a, u1)
    g.moveTo(p[0], p[1])
    for (let i = a + 1; i <= b; i++) (p = at(i, u1)), g.lineTo(p[0], p[1])
    for (let i = b; i >= a; i--) (p = at(i, u0)), g.lineTo(p[0], p[1])
    g.closePath()
    g.fill()
  }
  // mực cạn: đậm ở đầu, nhạt dần theo hướng nét
  const inked = (a: number) => {
    if (!o.ink) return rgba(o.color, a)
    const gr = g.createLinearGradient(c[0][0], c[0][1], c[n - 1][0], c[n - 1][1])
    gr.addColorStop(0, rgba(o.color, a))
    gr.addColorStop(1, rgba(o.color, a * (1 - o.ink)))
    return gr
  }

  if (o.bleed) {
    g.fillStyle = rgba(o.color, alpha * 0.1 * o.bleed)
    body(1.5)
  }
  const dry = o.dry ?? 0
  if (dry <= 0) {
    g.fillStyle = inked(alpha)
    body(1)
    return
  }
  // Nét khô: bề ngang chia thành các sợi lông to nhỏ ngẫu nhiên; sợi đứt quãng theo noise,
  // đứt nhiều về cuối nét và ở mép. Sợi cạnh nhau đứt gần giống nhau → vệt trắng thành mảng (飞白).
  const r = rng(seed)
  const lanes = Math.max(4, Math.min(16, Math.round(o.w / px / 1.6)))
  const cuts = [-0.5, 0.5]
  for (let k = 1; k < lanes; k++) cuts.push(-0.5 + (k + (r() - 0.5) * 0.8) / lanes)
  cuts.sort((a, b) => a - b)
  const along = 1 / Math.max(o.w * 2.4, px * 8)
  for (let k = 0; k < lanes; k++) {
    const pad = (r() * 0.6 + 0.3) / lanes
    const u0 = cuts[k] - pad, u1 = cuts[k + 1] + pad
    const side = Math.abs((u0 + u1) / 2) * 2
    g.fillStyle = inked(alpha * (0.62 + 0.25 * r()))
    let start = -1
    for (let i = 0; i < n; i++) {
      const t = s[i] / len
      const thr = dry * (0.15 + 0.85 * t * t) + side * dry * 0.3
      const on = noise2(s[i] * along, k * 0.5 + 0.5, seed) * 0.72 + noise2(s[i] * along * 5, k * 2.3, seed + 3) * 0.28 > thr
      if (on && start < 0) start = i
      if ((!on || i === n - 1) && start >= 0) {
        if (i - start >= 2) hair(start, i, u0, u1)
        start = -1
      }
    }
  }
}

// Nét quét nhanh theo một hàm vị trí (tiện cho vân đá, cỏ)
export const line = (g: G, a: Pt, b: Pt, o: StrokeOpts, bend = 0) => {
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend
  stroke(g, [a, [mx, my], b], o)
}

// ---------- Mảng màu loang ----------

export type WashOpts = {
  fill: string | ((g: G) => CanvasGradient | string) // màu hoặc gradient
  alpha?: number
  layers?: number // số lớp chồng: mép loang mềm, giữa đậm
  jitter?: number // độ xô lệch mép mỗi lớp (DU)
  edge?: number // viền đậm do sắc tố dồn ra mép (DU); 0 = không
  sharp?: boolean // giữ cạnh thẳng, góc gọn (tường, cửa) thay vì uốn tròn
  seed?: number
}

export function wash(g: G, pts: readonly Pt[], o: WashOpts) {
  const px = pxOf(g)
  const c = spline(o.sharp ? densify(pts, 1.5) : pts, Math.max(px * 2, 1), true)
  const layers = o.layers ?? 3
  const j = o.jitter ?? 1.5
  const seed = o.seed ?? 7
  const alpha = o.alpha ?? 0.85
  const f = 0.07
  const fill = typeof o.fill === 'string' ? o.fill : o.fill(g)
  g.save()
  g.fillStyle = fill
  for (let l = 0; l < layers; l++) {
    g.globalAlpha = Math.min(1, (alpha / layers) * 1.35)
    g.beginPath()
    c.forEach(([x, y], i) => {
      const dx = (noise2(x * f, y * f, seed + l * 5) - 0.5) * 2 * j
      const dy = (noise2(x * f + 40, y * f, seed + l * 5 + 1) - 0.5) * 2 * j
      i ? g.lineTo(x + dx, y + dy) : g.moveTo(x + dx, y + dy)
    })
    g.closePath()
    g.fill()
  }
  if (o.edge) {
    g.globalAlpha = alpha * 0.22
    g.strokeStyle = fill
    g.lineWidth = o.edge
    g.lineJoin = 'round'
    g.beginPath()
    c.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
    g.closePath()
    g.stroke()
  }
  g.restore()
}

// Chèn điểm dọc các cạnh thẳng để spline không uốn tròn chúng
function densify(pts: readonly Pt[], step: number): Pt[] {
  const out: Pt[] = []
  pts.forEach((a, i) => {
    const b = pts[(i + 1) % pts.length]
    const k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step))
    for (let j = 0; j < k; j++) out.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k])
  })
  return out
}

// Chấm mực không tròn đều (苔点 chấm rêu, lá, vết đá)
export function blot(g: G, x: number, y: number, r: number, color: string, alpha = 0.85, seed = 1, squash = 0.75, rot = 0) {
  const k = 9
  const rn = rng(seed)
  g.save()
  g.translate(x, y)
  g.rotate(rot)
  g.fillStyle = rgba(color, alpha)
  g.beginPath()
  const ps: P[] = []
  for (let i = 0; i < k; i++) {
    const a = (i / k) * Math.PI * 2
    const rr = r * (0.72 + rn() * 0.5)
    ps.push([Math.cos(a) * rr, Math.sin(a) * rr * squash])
  }
  spline(ps, Math.max(r / 4, 0.3), true).forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)))
  g.closePath()
  g.fill()
  g.restore()
}

// ---------- Hạt giấy trên phần đã tô ----------

let tooth: OffscreenCanvas | HTMLCanvasElement | undefined
let mottle: OffscreenCanvas | HTMLCanvasElement | undefined
// Răng giấy: chấm li ti nơi mực không chạm tới
function toothCanvas() {
  if (tooth) return tooth
  const S = 192
  const cv = canvas(S, S)
  const g = cv.getContext('2d') as G
  const img = g.createImageData(S, S)
  const r = rng(99)
  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0
    const fib = noise2(x / 9, y / 1.4, 3, S / 9, S / 1.4) // sợi giấy chạy ngang
    const v = r() * 0.55 + fib * 0.45
    img.data[i * 4 + 3] = v > 0.72 ? Math.round((v - 0.72) * 900) : 0
  }
  g.putImageData(img, 0, 0)
  return (tooth = cv)
}
// Sắc tố lắng không đều: vệt đậm nhạt mảng lớn
function mottleCanvas() {
  if (mottle) return mottle
  const S = 256
  const cv = canvas(S, S)
  const g = cv.getContext('2d') as G
  const img = g.createImageData(S, S)
  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0
    const v = noise2(x / 14, y / 14, 11, S / 14, S / 14) * 0.65 + noise2(x / 4, y / 4, 12, S / 4, S / 4) * 0.35
    img.data[i * 4] = 25
    img.data[i * 4 + 1] = 20
    img.data[i * 4 + 2] = 15
    img.data[i * 4 + 3] = Math.max(0, Math.round((v - 0.45) * 330))
  }
  g.putImageData(img, 0, 0)
  return (mottle = cv)
}

// Cho những gì đã vẽ trong canvas "ăn" vào giấy: lốm đốm răng giấy + sắc tố lắng. Chỗ trống không bị dính.
export function grain(g: G, amount = 0.5) {
  const cover = (src: OffscreenCanvas | HTMLCanvasElement, op: GlobalCompositeOperation, a: number) => {
    const pat = g.createPattern(src as CanvasImageSource, 'repeat')
    if (!pat) return
    g.globalCompositeOperation = op
    g.globalAlpha = a
    g.fillStyle = pat
    g.fillRect(0, 0, g.canvas.width, g.canvas.height)
  }
  g.save()
  g.setTransform(1, 0, 0, 1, 0, 0)
  cover(mottleCanvas(), 'source-atop', amount * 0.35)
  cover(toothCanvas(), 'destination-out', amount * 0.8)
  g.restore()
}

// ---------- Canvas & nướng hình ----------

export function canvas(w: number, h: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    return c
  }
  return new OffscreenCanvas(w, h)
}

// Một hình: khung (DU) quanh điểm neo. Neo (0,0) thường là chân vật thể.
// draw có thể trả về thông tin phụ (vd. vị trí hiệu ứng động) — bake() chuyển tiếp ở `meta`.
export type Asset<M = void> = { x: number; y: number; w: number; h: number; draw: (g: G) => M }

// Vẽ asset ra canvas ở `scale` pixel mỗi DU. Trả về canvas và toạ độ neo tính theo tỉ lệ (0..1) cho sprite.
export function bake<M>(a: Asset<M>, scale: number) {
  const w = Math.max(1, Math.ceil(a.w * scale)), h = Math.max(1, Math.ceil(a.h * scale))
  const cv = canvas(w, h)
  const g = cv.getContext('2d') as G
  g.setTransform(scale, 0, 0, scale, -a.x * scale, -a.y * scale)
  g.lineCap = 'round'
  g.lineJoin = 'round'
  const meta = a.draw(g)
  return { canvas: cv, anchor: [-a.x / a.w, -a.y / a.h] as const, scale, meta }
}

// ---------- Hình học chung ----------

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
// k điểm trên elip tâm (x, y), bán trục rx, ry, xoay rot (radian)
export const ellipse = (x: number, y: number, rx: number, ry: number, k = 12, rot = 0): Pt[] =>
  Array.from({ length: k }, (_, i) => {
    const a = (i / k) * Math.PI * 2
    if (!rot) return [x + Math.cos(a) * rx, y + Math.sin(a) * ry]
    const dx = Math.cos(a) * rx, dy = Math.sin(a) * ry
    return [x + dx * Math.cos(rot) - dy * Math.sin(rot), y + dx * Math.sin(rot) + dy * Math.cos(rot)]
  })
// Xoá phần đã vẽ bằng những gì draw() tô (khoét lỗ, hốc mắt, lỗ khoá)
export function erase(g: G, draw: () => void) {
  g.save()
  g.globalCompositeOperation = 'destination-out'
  draw()
  g.restore()
}

// Chuyển màu: stops là [vị trí 0..1, màu]. vgrad: dọc từ y0 xuống y1; linear: theo đoạn (x0, y0) → (x1, y1); radial: như canvas
export type Stops = [number, string][]
export function linear(g: G, x0: number, y0: number, x1: number, y1: number, stops: Stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1)
  stops.forEach(([t, c]) => gr.addColorStop(t, c))
  return gr
}
export const vgrad = (g: G, y0: number, y1: number, stops: Stops) => linear(g, 0, y0, 0, y1, stops)
export function radial(g: G, [x0, y0, r0, x1, y1, r1]: readonly number[], stops: Stops) {
  const gr = g.createRadialGradient(x0, y0, r0, x1, y1, r1)
  stops.forEach(([t, c]) => gr.addColorStop(t, c))
  return gr
}
