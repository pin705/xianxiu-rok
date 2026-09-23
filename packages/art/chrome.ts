// Da giao diện vẽ tay: khung cuộn tranh (lụa bồi + giấy), thẻ giấy mép xơ, nút sơn loang viền mực, ván sơn mài
// viền vàng, nhãn giấy, thanh tiến độ, ô nhập, công tắc, bong bóng… Cùng một cây bút với cảnh núi.
// Toạ độ vẽ là px CSS; s = số px thật mỗi px CSS. Client nướng một lần lúc khởi động, dùng làm border-image
// (slice = px CSS × s): góc giữ nguyên hoạ tiết, cạnh và lòng giãn theo khung — vì vậy mọi hoạ tiết nằm ở góc,
// cạnh chỉ là nét gần thẳng, lòng là màu loang mềm (giãn không lộ).
import { blot, canvas, grain, stroke, wash, type Asset, type G, type Pt } from './brush'
import { noise1, noise2, rng } from './noise'
import { paper } from './paper'
import { PIGMENT as C, mix, rgba } from './palette'

export type Skin = {
  cv: HTMLCanvasElement | OffscreenCanvas
  w: number // px CSS
  h: number
  slice: readonly [number, number, number, number] // trên, phải, dưới, trái (px CSS)
  outset?: number // phần vẽ tràn ra ngoài hộp (bóng, mép xơ), px CSS
}

type P = [number, number]

function surface(w: number, h: number, s: number) {
  const cv = canvas(Math.ceil(w * s), Math.ceil(h * s))
  const g = cv.getContext('2d') as G
  g.setTransform(s, 0, 0, s, 0, 0)
  g.lineCap = 'round'
  g.lineJoin = 'round'
  return { cv, g }
}

const path = (g: G, pts: readonly Pt[]) => {
  g.beginPath()
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
  g.closePath()
}

// Hình chữ nhật bo góc vẽ tay: lấy mẫu dọc chu vi, đẩy ra/vào theo noise (tay không kẻ thước)
export function rounded(x0: number, y0: number, x1: number, y1: number, r: number, seed: number, jit = 0.5, step = 1.5): Pt[] {
  const out: P[] = []
  const nrm: P[] = []
  const seg = (ax: number, ay: number, bx: number, by: number, nx: number, ny: number) => {
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step))
    for (let i = 0; i < n; i++) out.push([ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n]), nrm.push([nx, ny])
  }
  const arc = (cx: number, cy: number, a0: number) => {
    const n = Math.max(2, Math.ceil((r * Math.PI) / 2 / step))
    for (let i = 0; i < n; i++) {
      const a = a0 + ((i / n) * Math.PI) / 2
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
      nrm.push([Math.cos(a), Math.sin(a)])
    }
  }
  seg(x0 + r, y0, x1 - r, y0, 0, -1)
  arc(x1 - r, y0 + r, -Math.PI / 2)
  seg(x1, y0 + r, x1, y1 - r, 1, 0)
  arc(x1 - r, y1 - r, 0)
  seg(x1 - r, y1, x0 + r, y1, 0, 1)
  arc(x0 + r, y1 - r, Math.PI / 2)
  seg(x0, y1 - r, x0, y0 + r, -1, 0)
  arc(x0 + r, y0 + r, Math.PI)
  let d = 0
  return out.map(([x, y], i) => {
    if (i) d += Math.hypot(x - out[i - 1][0], y - out[i - 1][1])
    const k = (noise1(d / 11, seed) - 0.5) * 2 * jit + (noise1(d / 2.7, seed + 3) - 0.5) * jit * 0.6
    return [x + nrm[i][0] * k, y + nrm[i][1] * k] as Pt
  })
}

// Mép giấy xé: 4 cạnh lởm chởm lõm vào trong (không tràn khỏi khung), góc hơi tròn mòn
function deckle(x0: number, y0: number, x1: number, y1: number, amp: number, seed: number, step = 1.2): Pt[] {
  const pts: Pt[] = []
  const edge = (ax: number, ay: number, bx: number, by: number, nx: number, ny: number, k: number) => {
    const len = Math.hypot(bx - ax, by - ay)
    const n = Math.max(2, Math.ceil(len / step))
    for (let i = 0; i < n; i++) {
      const t = i / n
      const corner = Math.min(t * len, (1 - t) * len) // gần góc thì mòn vào nhiều hơn
      const wear = corner < 4 ? (4 - corner) * 0.35 : 0
      const d = amp * (0.25 + 0.75 * (noise2(t * len / 6, k, seed) * 0.65 + noise2(t * len / 1.3, k + 9, seed) * 0.35)) + wear
      pts.push([ax + (bx - ax) * t + nx * d, ay + (by - ay) * t + ny * d])
    }
  }
  edge(x0, y0, x1, y0, 0, 1, 1)
  edge(x1, y0, x1, y1, -1, 0, 2)
  edge(x1, y1, x0, y1, 0, -1, 3)
  edge(x0, y1, x0, y0, 1, 0, 4)
  return pts
}

// Nét kẻ tay: hơi võng, đầu nét nhấn, vượt góc một chút như người kẻ bằng bút lông
function rule(g: G, a: Pt, b: Pt, w: number, color: string, seed: number, alpha = 0.85, over = 1) {
  const r = rng(seed)
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len
  const o0 = (0.6 + r() * 1.4) * over, o1 = (0.3 + r() * 1.2) * over
  const A: Pt = [a[0] - ux * o0, a[1] - uy * o0], B: Pt = [b[0] + ux * o1, b[1] + uy * o1]
  const bow = (r() - 0.5) * Math.min(1.6, len * 0.012)
  const M: Pt = [(A[0] + B[0]) / 2 - uy * bow, (A[1] + B[1]) / 2 + ux * bow]
  stroke(g, [A, M, B], {
    w, color, alpha, rough: 0.45, dry: 0.1, seed, wobble: 0.15,
    press: t => (t < 0.025 ? 1 : 0.78 + 0.18 * noise1(t * 7, seed)) * Math.min(1, (1 - t) / 0.02 + 0.55),
  })
}
// Viền kín theo một đường khép (nét bút đi vòng, chỗ bắt đầu/kết thúc chồng lên hơi đậm).
// heavy > 0: thêm một lượt nét ở phía khuất sáng (pháp tuyến hướng xuống-phải) — nét mực dày mỏng theo hướng sáng.
export function outline(g: G, pts: readonly Pt[], w: number, color: string, seed: number, alpha = 0.85, dry = 0.12, heavy = 0.8) {
  const ring = [...pts, pts[0], pts[1], pts[2]]
  stroke(g, ring, { w, color, alpha, rough: 0.5, dry, seed, wobble: 0.12, press: t => 0.72 + 0.28 * noise1(t * 9, seed) })
  if (!heavy) return
  // các đoạn liên tiếp nằm phía khuất sáng (vòng đi theo chiều kim đồng hồ: pháp tuyến ngoài = (dy, −dx))
  const n = pts.length
  const shade = pts.map((p, i) => {
    const q = pts[(i + 1) % n], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1
    return (dy * 0.55 - dx * 0.83) / l > 0.25
  })
  let start = shade.findIndex(v => !v)
  if (start < 0) start = 0
  let run: Pt[] = []
  const flush = () => {
    if (run.length > 4) stroke(g, run, { w: w * (1 + heavy), color, alpha: alpha * 0.9, rough: 0.5, dry: dry + 0.1, seed: seed + run.length, press: 'taper' })
    run = []
  }
  for (let k = 0; k <= n; k++) {
    const i = (start + k) % n
    if (shade[i]) run.push(pts[i])
    else flush()
  }
  flush()
}

// Mây cuộn 如意: vòng xoắn nhỏ + đuôi, hoạ tiết góc
export function curl(g: G, x: number, y: number, r: number, rot: number, color: string, w: number, seed: number, alpha = 0.9) {
  const pts: Pt[] = []
  for (let i = 0; i <= 20; i++) {
    const t = i / 20, a = rot + t * Math.PI * 2.4, rr = r * (1 - t * 0.78)
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr])
  }
  stroke(g, pts.reverse(), { w, color, press: 'rise', alpha, rough: 0.3, seed })
}

// Lấp đầy bằng giấy (hạt giấy giữ đúng cỡ px thật, không phóng theo s)
function paperFill(g: G, s: number, tone: string, seed = 7) {
  const pat = g.createPattern(paper(256, tone, seed) as CanvasImageSource, 'repeat')!
  pat.setTransform(new DOMMatrix().scale(1 / s))
  return pat
}

// Ố vàng dọc mép (giấy cũ): 4 dải chuyển màu từ mép vào, góc chồng lên nên đậm hơn
function age(g: G, x0: number, y0: number, x1: number, y1: number, depth: number, color: string, alpha: number) {
  const band = (gx0: number, gy0: number, gx1: number, gy1: number, rx: number, ry: number, rw: number, rh: number) => {
    const gr = g.createLinearGradient(gx0, gy0, gx1, gy1)
    gr.addColorStop(0, rgba(color, alpha))
    gr.addColorStop(1, rgba(color, 0))
    g.fillStyle = gr
    g.fillRect(rx, ry, rw, rh)
  }
  band(x0, 0, x0 + depth, 0, x0, y0, depth, y1 - y0)
  band(x1, 0, x1 - depth, 0, x1 - depth, y0, depth, y1 - y0)
  band(0, y0, 0, y0 + depth, x0, y0, x1 - x0, depth)
  band(0, y1, 0, y1 - depth, x0, y1 - depth, x1 - x0, depth)
}

// ---------- Khung cuộn tranh (bảng lớn, trang): lụa bồi viền quanh giấy ----------

// Lụa dệt: sợi ngang dọc li ti + hoa văn mây mờ (ô ghép liền, px thật)
function silkTile(tone: string, s: number) {
  const S = Math.round(48 * s)
  const cv = canvas(S, S)
  const g = cv.getContext('2d') as G
  const img = g.createImageData(S, S)
  const n = parseInt(tone.slice(1), 16)
  const R = n >> 16, Gc = (n >> 8) & 255, B = n & 255
  const p = Math.max(2, Math.round(s * 1.2))
  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0
    const warp = ((x % p) / p < 0.5 ? 1 : -1) * ((y % (p * 2)) < p ? 1 : -1) // chéo sợi
    const v = 1 + warp * 0.025 + (noise2(x / (6 * s), y / (40 * s), 4, S / (6 * s), S / (40 * s)) - 0.5) * 0.06
    img.data[i * 4] = R * v
    img.data[i * 4 + 1] = Gc * v
    img.data[i * 4 + 2] = B * v
    img.data[i * 4 + 3] = 255
  }
  g.putImageData(img, 0, 0)
  return cv
}

export function scrollSkin(s: number, silk: string = mix(C.azuriteL, C.paper2, 0.55)): Skin {
  const W = 360, H = 480, band = 11, sl = 24
  const { cv, g } = surface(W, H, s)
  // lụa
  const pat = g.createPattern(silkTile(silk, s) as CanvasImageSource, 'repeat')!
  pat.setTransform(new DOMMatrix().scale(1 / s))
  g.fillStyle = pat
  path(g, rounded(0.5, 0.5, W - 0.5, H - 0.5, 2.5, 3, 0.15))
  g.fill()
  // hoa văn mây chìm trên lụa, chỉ ở góc (cạnh giãn ra vẫn trơn)
  for (const [x, y, rot] of [[band / 2 + 1, band / 2 + 1, 0], [W - band / 2 - 1, band / 2 + 1, Math.PI / 2], [W - band / 2 - 1, H - band / 2 - 1, Math.PI], [band / 2 + 1, H - band / 2 - 1, -Math.PI / 2]] as const) {
    curl(g, x, y, 3.2, rot, mix(silk, '#ffffff', 0.55), 1, 11 + x, 0.55)
  }
  // mép lụa: nét mực mảnh
  outline(g, rounded(0.8, 0.8, W - 0.8, H - 0.8, 2.5, 5, 0.12), 1.1, C.ink2, 5, 0.7, 0)
  // chỉ vàng 隔水 giữa lụa và giấy
  outline(g, rounded(band - 1, band - 1, W - band + 1, H - band + 1, 1.2, 7, 0.1), 0.9, C.goldD, 7, 0.75, 0.2)
  // giấy
  const inner = rounded(band, band, W - band, H - band, 1, 9, 0.12)
  g.fillStyle = paperFill(g, s, C.paper)
  path(g, inner)
  g.fill()
  g.save()
  path(g, inner)
  g.clip()
  age(g, band, band, W - band, H - band, 16, C.ochre, 0.12)
  g.restore()
  // khung mực đôi viền tay trong giấy + mây cuộn son ở góc
  const a = band + 6.5, b = band + 10
  const box = (i: number, w: number, al: number, sd: number) => {
    rule(g, [i, i], [W - i, i], w, C.ink, sd, al)
    rule(g, [W - i, i], [W - i, H - i], w * 1.35, C.ink, sd + 1, al)
    rule(g, [W - i, H - i], [i, H - i], w * 1.35, C.ink, sd + 2, al)
    rule(g, [i, H - i], [i, i], w, C.ink, sd + 3, al)
  }
  box(a, 1.5, 0.8, 21)
  box(b, 0.6, 0.55, 31)
  for (const [x, y, rot] of [[b + 3.5, b + 3.5, Math.PI * 1.25], [W - b - 3.5, b + 3.5, -Math.PI * 0.25], [W - b - 3.5, H - b - 3.5, Math.PI * 0.25], [b + 3.5, H - b - 3.5, Math.PI * 0.75]] as const)
    curl(g, x, y, 2.4, rot, C.cinnabar, 0.9, 41 + x + y, 0.85)
  grain(g, 0.18)
  return { cv, w: W, h: H, slice: [sl, sl, sl, sl] }
}

// Trục cuộn gỗ sơn mài, hai đầu bịt đồng chạm hoa
export function rodSkin(s: number): Skin {
  const W = 240, H = 22, cap = 22
  const { cv, g } = surface(W, H, s)
  const y0 = 5, y1 = H - 5
  // thân trục: sơn mài nâu đen, vệt sáng dọc thân
  const body = g.createLinearGradient(0, y0, 0, y1)
  body.addColorStop(0, mix(C.lacquer2, '#ffffff', 0.18))
  body.addColorStop(0.35, C.lacquer2)
  body.addColorStop(1, mix(C.lacquer, '#000000', 0.35))
  g.fillStyle = body
  path(g, rounded(cap - 6, y0, W - cap + 6, y1, (y1 - y0) / 2, 3, 0.2))
  g.fill()
  stroke(g, [[cap, y0 + 2.6], [W / 2, y0 + 2.2], [W - cap, y0 + 2.6]], { w: 1.4, color: '#ffffff', alpha: 0.28, press: 'even', dry: 0.5, seed: 4 })
  outline(g, rounded(cap - 6, y0, W - cap + 6, y1, (y1 - y0) / 2, 3, 0.2), 0.9, C.ink, 5, 0.7, 0)
  // đầu đồng: khối vàng loang, gờ khắc, nụ tròn
  for (const [x0, dir] of [[2, 1], [W - 2, -1]] as const) {
    const xa = x0, xb = x0 + dir * (cap - 3)
    const pts = rounded(Math.min(xa, xb), 2, Math.max(xa, xb), H - 2, 4, 9 + xa, 0.25)
    wash(g, pts, { fill: C.gold, alpha: 1, layers: 3, jitter: 0.3, edge: 1.4, seed: 13 + xa })
    const hl = g.createLinearGradient(0, 2, 0, H - 2)
    hl.addColorStop(0, rgba(C.goldL, 0.9))
    hl.addColorStop(0.45, rgba(C.goldL, 0))
    hl.addColorStop(1, rgba(C.goldD, 0.6))
    g.fillStyle = hl
    path(g, pts)
    g.fill()
    for (const k of [0.35, 0.7]) rule(g, [x0 + dir * (cap - 3) * k, 4], [x0 + dir * (cap - 3) * k, H - 4], 0.7, C.goldD, 17 + k * 10, 0.8, 0.2)
    outline(g, pts, 0.9, C.ink, 19 + xa, 0.8, 0)
    blot(g, x0 + dir * (cap - 3) * 0.52, H / 2, 1.6, C.goldL, 0.9, 23 + xa, 1)
  }
  grain(g, 0.15)
  return { cv, w: W, h: H, slice: [0, cap, 0, cap] }
}

// ---------- Thẻ giấy (mục trong danh sách) ----------

export type CardTone = 'paper' | 'glow' | 'selected' | 'lacquer' | 'plain'
export function cardSkin(s: number, tone: CardTone = 'paper', seed = 3): Skin {
  const W = 240, H = 132, sl = 14, pad = 3
  const { cv, g } = surface(W, H, s)
  const base = { paper: mix(C.paper, '#ffffff', 0.4), plain: mix(C.paper, '#ffffff', 0.4), glow: mix(C.goldL, C.paper, 0.45), selected: mix(C.paper, '#ffffff', 0.4), lacquer: C.lacquer }[tone]
  const edge = deckle(pad, pad, W - pad, H - pad - 0.5, tone === 'lacquer' ? 0.5 : 1.3, seed)
  // bóng: giấy hơi nhấc khỏi mặt bảng
  g.save()
  g.shadowColor = rgba(C.ink, 0.28)
  g.shadowBlur = 3.5 * s
  g.shadowOffsetY = 1.4 * s
  g.fillStyle = tone === 'lacquer' ? base : paperFill(g, s, base, seed)
  path(g, edge)
  g.fill()
  g.restore()
  g.save()
  path(g, edge)
  g.clip()
  if (tone === 'lacquer') {
    const sheen = g.createLinearGradient(0, 0, 0, H)
    sheen.addColorStop(0, rgba('#ffffff', 0.1))
    sheen.addColorStop(0.5, rgba('#ffffff', 0))
    sheen.addColorStop(1, rgba('#000000', 0.25))
    g.fillStyle = sheen
    g.fillRect(0, 0, W, H)
  } else age(g, pad, pad, W - pad, H - pad, 10, tone === 'glow' ? C.gold : C.ochre, tone === 'glow' ? 0.22 : 0.1)
  g.restore()
  // viền: bốn nét kẻ tay, vượt góc
  const i = pad + 3.2
  const col = { paper: C.ink, plain: C.ink, glow: C.goldD, selected: C.cinnabar, lacquer: C.gold }[tone]
  const w = tone === 'selected' ? 1.9 : tone === 'plain' ? 0.8 : 1.1
  const al = tone === 'plain' ? 0.35 : tone === 'paper' ? 0.55 : 0.9
  rule(g, [i, i], [W - i, i], w, col, seed + 1, al, 0.6)
  rule(g, [W - i, i], [W - i, H - i], w * 1.4, col, seed + 2, al, 0.6)
  rule(g, [W - i, H - i], [i, H - i], w * 1.4, col, seed + 3, al, 0.6)
  rule(g, [i, H - i], [i, i], w, col, seed + 4, al, 0.6)
  if (tone === 'glow' || tone === 'lacquer')
    for (const [x, y, rot] of [[i + 4, i + 4, Math.PI * 1.25], [W - i - 4, i + 4, -Math.PI * 0.25], [W - i - 4, H - i - 4, Math.PI * 0.25], [i + 4, H - i - 4, Math.PI * 0.75]] as const)
      curl(g, x, y, 2.2, rot, tone === 'glow' ? C.goldD : C.goldL, 0.85, seed + x + y, 0.85)
  grain(g, 0.2)
  return { cv, w: W, h: H, slice: [sl, sl, sl, sl] }
}

// ---------- Ván sơn mài viền vàng (thanh HUD, thanh tab, biển) ----------

export function plankSkin(s: number, seed = 5): Skin {
  const W = 390, H = 120, sl = 18
  const { cv, g } = surface(W, H, s)
  const img = g.createImageData(Math.ceil(W * s), Math.ceil(H * s))
  const n = parseInt(C.lacquer.slice(1), 16)
  const R = n >> 16, Gc = (n >> 8) & 255, B = n & 255
  const pw = Math.ceil(W * s), ph = Math.ceil(H * s)
  for (let i = 0; i < pw * ph; i++) {
    const x = i % pw, y = (i / pw) | 0
    // vân gỗ ngang uốn nhẹ + mắt gỗ + sáng trên tối dưới
    const u = x / s, v = y / s
    const bend = noise2(u / 60, v / 30, seed) * 6
    const grainV = noise2(u / 42, (v + bend) / 1.8, seed + 1) * 0.6 + noise2(u / 9, (v + bend) / 0.9, seed + 2) * 0.4
    const shade = 1.12 - (v / H) * 0.3
    const k = shade * (1 + (grainV - 0.5) * 0.42)
    img.data[i * 4] = R * k
    img.data[i * 4 + 1] = Gc * k
    img.data[i * 4 + 2] = B * k
    img.data[i * 4 + 3] = 255
  }
  g.save()
  g.setTransform(1, 0, 0, 1, 0, 0)
  g.putImageData(img, 0, 0)
  g.restore()
  // vệt sáng sơn mài quét ngang
  for (let k = 0; k < 3; k++) stroke(g, [[20 + k * 110, 4 + k * 1.5], [90 + k * 110, 3 + k], [160 + k * 110, 5]], { w: 3, color: '#ffffff', alpha: 0.07, press: 'swell', dry: 0.7, seed: seed + k })
  // chỉ vàng đôi viền tay
  const box = (i: number, w: number, color: string, al: number, sd: number) => {
    rule(g, [i, i], [W - i, i], w, color, sd, al, 0.4)
    rule(g, [W - i, i], [W - i, H - i], w, color, sd + 1, al, 0.4)
    rule(g, [W - i, H - i], [i, H - i], w, color, sd + 2, al, 0.4)
    rule(g, [i, H - i], [i, i], w, color, sd + 3, al, 0.4)
  }
  box(4.5, 1.6, C.gold, 0.95, seed + 10)
  box(8, 0.7, C.goldL, 0.55, seed + 20)
  // ke góc đồng: chữ L vàng loang, đinh tán
  for (const [x, y, dx, dy] of [[0, 0, 1, 1], [W, 0, -1, 1], [W, H, -1, -1], [0, H, 1, -1]] as const) {
    const L = 15, t = 5
    const pts: Pt[] = [[x, y], [x + dx * L, y], [x + dx * L, y + dy * t], [x + dx * t, y + dy * t], [x + dx * t, y + dy * L], [x, y + dy * L]]
    wash(g, pts, { fill: C.gold, alpha: 1, layers: 2, jitter: 0.25, edge: 1.2, sharp: true, seed: seed + x + y })
    stroke(g, [[x + dx * 1.5, y + dy * 1.5], [x + dx * (L - 1), y + dy * 1.5]], { w: 0.8, color: C.goldL, alpha: 0.9, press: 'even' })
    outline(g, pts, 0.7, C.ink, seed + 5 + x, 0.8, 0)
    blot(g, x + dx * 2.8, y + dy * 2.8, 1.2, C.goldL, 1, seed + 7 + x + y, 1)
    blot(g, x + dx * 2.6, y + dy * 2.6, 0.5, C.ink, 0.6, seed + 8 + x + y, 1)
  }
  return { cv, w: W, h: H, slice: [sl, sl + 4, sl, sl + 4] }
}

// ---------- Nút: mảng sơn loang, mép sắc tố dồn đậm, viền mực, gờ sáng ----------

export type ButtonTone = 'primary' | 'gold' | 'danger' | 'ghost' | 'off'
const BTN: Record<ButtonTone, { base: string; light: string; dark: string; line: string }> = {
  primary: { base: C.azurite, light: C.azuriteL, dark: C.azuriteD, line: C.ink },
  gold: { base: C.gold, light: C.goldL, dark: C.goldD, line: C.ink },
  danger: { base: C.cinnabar, light: C.cinnabarL, dark: mix(C.cinnabar, C.ink, 0.35), line: C.ink },
  ghost: { base: mix(C.paper, '#ffffff', 0.3), light: '#ffffff', dark: C.paper3, line: C.ink2 },
  off: { base: mix(C.paper2, C.ink3, 0.28), light: C.paper2, dark: mix(C.paper3, C.ink3, 0.4), line: C.ink3 },
}
export function buttonSkin(s: number, tone: ButtonTone, seed = 7): Skin {
  const W = 200, H = 58, o = 3 // o: bóng đổ tràn xuống
  const { cv, g } = surface(W, H, s)
  const c = BTN[tone]
  const x0 = o, y0 = o, x1 = W - o, y1 = H - o - 2
  const shape = rounded(x0, y0, x1, y1, 11, seed, 0.55)
  // bóng mực dưới chân
  g.save()
  g.shadowColor = rgba(C.ink, tone === 'ghost' || tone === 'off' ? 0.25 : 0.4)
  g.shadowBlur = 3 * s
  g.shadowOffsetY = 2.2 * s
  g.fillStyle = c.base
  path(g, shape)
  g.fill()
  g.restore()
  // màu loang nhiều lớp, mép đậm
  wash(g, shape, { fill: c.base, alpha: 1, layers: 3, jitter: 0.5, edge: 2.4, seed })
  g.save()
  path(g, shape)
  g.clip()
  // sáng trên, sẫm dưới — bằng hai mảng loang chứ không phải gradient trơn
  wash(g, rounded(x0 + 5, y0 + 3, x1 - 5, y0 + (y1 - y0) * 0.5, 7, seed + 2, 1.1), { fill: c.light, alpha: tone === 'ghost' ? 0.6 : 0.3, layers: 3, jitter: 1.8, seed: seed + 2 })
  wash(g, rounded(x0 - 2, y1 - (y1 - y0) * 0.32, x1 + 2, y1 + 4, 6, seed + 4, 1.2), { fill: c.dark, alpha: 0.4, layers: 3, jitter: 1.5, seed: seed + 4 })
  // vệt bút khô chạy ngang (thớ màu)
  const r = rng(seed)
  for (let k = 0; k < 4; k++) {
    const y = y0 + 8 + r() * (y1 - y0 - 16)
    stroke(g, [[x0 + 6 + r() * 20, y], [W / 2, y + (r() - 0.5) * 2], [x1 - 6 - r() * 20, y + (r() - 0.5) * 2]], { w: 3 + r() * 4, color: r() < 0.5 ? c.light : c.dark, alpha: 0.13, press: 'swell', dry: 0.85, seed: seed + 10 + k })
  }
  if (tone === 'gold')
    for (let k = 0; k < 26; k++) blot(g, x0 + 4 + r() * (x1 - x0 - 8), y0 + 3 + r() * (y1 - y0 - 6), 0.35 + r() * 0.6, '#fff6d8', 0.55 + r() * 0.4, seed + 30 + k, 1) // vảy vàng lá
  g.restore()
  // gờ sáng mép trên
  stroke(g, [[x0 + 14, y0 + 3.4], [W * 0.38, y0 + 2.9], [W * 0.62, y0 + 3.3]], { w: 1.2, color: '#ffffff', alpha: tone === 'off' ? 0.2 : 0.35, press: 'swell', dry: 0.6, seed: seed + 50 })
  // viền mực
  outline(g, shape, tone === 'ghost' || tone === 'off' ? 1.3 : 1.6, c.line, seed + 60, tone === 'off' ? 0.5 : 0.88)
  grain(g, 0.22)
  return { cv, w: W, h: H, slice: [18, 24, 22, 24], outset: 0 }
}

// ---------- Nhãn nhỏ: mẩu giấy/lụa viền mực ----------

export type TagTone = 'plain' | 'good' | 'bad' | 'gold' | 'dark' | 'red'
export function tagSkin(s: number, tone: TagTone, seed = 11): Skin {
  const W = 72, H = 28
  const { cv, g } = surface(W, H, s)
  const fill = {
    plain: mix(C.paper2, C.ink3, 0.18), good: mix(C.malachiteL, C.paper, 0.55), bad: mix(C.cinnabarL, C.paper, 0.62),
    gold: mix(C.goldL, C.paper, 0.35), dark: mix(C.lacquer, C.ink, 0.2), red: C.cinnabar,
  }[tone]
  const line = { plain: C.ink2, good: C.malachiteD, bad: C.cinnabar, gold: C.goldD, dark: C.gold, red: mix(C.cinnabar, C.ink, 0.5) }[tone]
  const shape = rounded(1.5, 1.5, W - 1.5, H - 1.5, 5, seed, 0.35)
  wash(g, shape, { fill, alpha: tone === 'dark' ? 0.85 : 1, layers: 3, jitter: 0.35, edge: 1.4, seed })
  outline(g, shape, 0.9, line, seed + 3, tone === 'plain' ? 0.45 : 0.75, 0.2)
  if (tone === 'red' || tone === 'gold') stroke(g, [[8, 4], [W / 2, 3.4], [W - 10, 4.2]], { w: 1, color: '#ffffff', alpha: 0.35, press: 'swell', seed: seed + 5 })
  grain(g, 0.2)
  return { cv, w: W, h: H, slice: [9, 10, 9, 10] }
}

// ---------- Huy hiệu số: giọt son ----------

export function badgeSkin(s: number, fresh = false, seed = 13): Skin {
  const W = 30, H = 22
  const { cv, g } = surface(W, H, s)
  const shape = rounded(2, 1.5, W - 2, H - 2.5, 9, seed, 0.45)
  g.save()
  g.shadowColor = rgba(C.ink, 0.4)
  g.shadowBlur = 2 * s
  g.shadowOffsetY = 1 * s
  wash(g, shape, { fill: fresh ? C.goldL : C.cinnabar, alpha: 1, layers: 3, jitter: 0.4, edge: 1.6, seed })
  g.restore()
  stroke(g, [[8, 4.5], [W / 2, 3.6], [W - 9, 4.6]], { w: 1.1, color: '#ffffff', alpha: 0.4, press: 'swell', seed: seed + 2 })
  outline(g, shape, 0.9, fresh ? C.cinnabar : C.goldL, seed + 4, 0.9, 0.1)
  return { cv, w: W, h: H, slice: [10, 11, 10, 11] }
}

// ---------- Thanh tiến độ: rãnh mực + nét bút màu, đầu nét khô ----------

export function trackSkin(s: number, dark = false, seed = 15): Skin {
  const W = 120, H = 12
  const { cv, g } = surface(W, H, s)
  const shape = rounded(1, 1.5, W - 1, H - 1.5, 4.5, seed, 0.3)
  wash(g, shape, { fill: dark ? '#000000' : C.ink, alpha: dark ? 0.4 : 0.16, layers: 2, jitter: 0.3, seed })
  outline(g, shape, 0.8, dark ? C.goldD : C.ink, seed + 2, dark ? 0.7 : 0.5, 0.25)
  return { cv, w: W, h: H, slice: [5, 6, 5, 6] }
}
export function fillSkin(s: number, color: string, seed = 17): Skin {
  const W = 120, H = 12
  const { cv, g } = surface(W, H, s)
  stroke(g, [[2.5, H / 2 + 0.2], [W * 0.4, H / 2 - 0.3], [W * 0.75, H / 2 + 0.2], [W - 2, H / 2]], {
    w: 8.4, color, alpha: 1, press: t => (t < 0.03 ? 0.85 : 1) * (t > 0.92 ? 1 - (t - 0.92) * 5 : 1), dry: 0.35, rough: 0.35, seed,
  })
  stroke(g, [[5, 4.2], [W * 0.5, 3.8], [W - 8, 4.2]], { w: 1.3, color: '#ffffff', alpha: 0.4, press: 'even', dry: 0.4, seed: seed + 1 })
  return { cv, w: W, h: H, slice: [5, 7, 5, 6] }
}

// ---------- Ô nhập số: nền giấy nhạt, gạch chân mực ----------

export function fieldSkin(s: number, seed = 19): Skin {
  const W = 100, H = 38
  const { cv, g } = surface(W, H, s)
  wash(g, rounded(2, 3, W - 2, H - 4, 5, seed, 0.4), { fill: '#ffffff', alpha: 0.4, layers: 2, jitter: 0.6, seed })
  rule(g, [5, H - 5], [W - 5, H - 5.5], 1.6, C.ink, seed + 1, 0.75)
  rule(g, [5, H - 9], [5, H - 4], 1, C.ink, seed + 2, 0.5, 0.2)
  rule(g, [W - 5, H - 9], [W - 5, H - 4.5], 1, C.ink, seed + 3, 0.5, 0.2)
  return { cv, w: W, h: H, slice: [8, 10, 10, 10] }
}

// ---------- Rãnh thẻ chuyển (Tabs) và thẻ đang chọn ----------

export function grooveSkin(s: number, seed = 21): Skin {
  const W = 200, H = 44
  const { cv, g } = surface(W, H, s)
  const shape = rounded(1.5, 1.5, W - 1.5, H - 1.5, 8, seed, 0.4)
  wash(g, shape, { fill: C.ink, alpha: 0.12, layers: 2, jitter: 0.5, seed })
  outline(g, shape, 0.9, C.ink2, seed + 2, 0.45, 0.2)
  return { cv, w: W, h: H, slice: [12, 12, 12, 12] }
}

// ---------- Bảng nhỏ tối: bong bóng đồng hồ, biển tên, thông báo ----------

// Mảng sơn mài bo tròn viền vàng tay (bong bóng đồng hồ, biển tên)
export function lacquerSkin(s: number, seed = 23, ends: 'round' | 'notch' = 'round'): Skin {
  const W = 120, H = 30
  const { cv, g } = surface(W, H, s)
  const shape: Pt[] =
    ends === 'round'
      ? rounded(1.5, 1.5, W - 1.5, H - 1.5, 13, seed, 0.3)
      : [[8, 1.5], [W - 8, 1.5], [W - 1.5, H / 2], [W - 8, H - 1.5], [8, H - 1.5], [1.5, H / 2]] // biển gỗ: hai đầu vát
  g.save()
  g.shadowColor = rgba(C.ink, 0.45)
  g.shadowBlur = 2.5 * s
  g.shadowOffsetY = 1.2 * s
  wash(g, shape, { fill: C.lacquer, alpha: 1, layers: 3, jitter: 0.3, edge: 1.5, sharp: ends === 'notch', seed })
  g.restore()
  const sheen = g.createLinearGradient(0, 0, 0, H)
  sheen.addColorStop(0, rgba('#ffffff', 0.14))
  sheen.addColorStop(0.5, rgba('#ffffff', 0))
  g.save()
  path(g, shape)
  g.clip()
  g.fillStyle = sheen
  g.fillRect(0, 0, W, H)
  g.restore()
  const inner: Pt[] = ends === 'round' ? rounded(3.2, 3.2, W - 3.2, H - 3.2, 11, seed + 2, 0.25) : [[9, 3.6], [W - 9, 3.6], [W - 4, H / 2], [W - 9, H - 3.6], [9, H - 3.6], [4, H / 2]]
  outline(g, inner, 0.9, C.gold, seed + 3, 0.9, 0.15)
  return { cv, w: W, h: H, slice: [12, 14, 12, 14] }
}

// Thông báo: dải mực quét ngang, hai đầu bút khô tước sợi, chỉ vàng bên trong
export function toastSkin(s: number, bad = false, seed = 25): Skin {
  const W = 320, H = 48
  const { cv, g } = surface(W, H, s)
  const tone = bad ? mix(C.cinnabar, C.lacquer, 0.55) : C.lacquer
  for (let k = 0; k < 3; k++)
    stroke(g, [[6, H / 2 + (k - 1) * 9], [W * 0.3, H / 2 + (k - 1) * 9 - 1], [W * 0.7, H / 2 + (k - 1) * 9 + 1], [W - 6, H / 2 + (k - 1) * 9]], {
      w: 17, color: tone, alpha: 0.97, press: t => Math.min(1, t / 0.035 + 0.35, (1 - t) / 0.035 + 0.35), dry: 0.6, rough: 0.5, seed: seed + k,
    })
  rule(g, [26, 7], [W - 26, 7.5], 0.8, bad ? C.cinnabarL : C.gold, seed + 7, 0.85, 0.3)
  rule(g, [26, H - 7], [W - 26, H - 7.5], 0.8, bad ? C.cinnabarL : C.gold, seed + 8, 0.85, 0.3)
  return { cv, w: W, h: H, slice: [14, 34, 14, 34] }
}

// ---------- Công tắc ----------

export function switchSkin(s: number, on: boolean, seed = 27): Skin {
  const W = 54, H = 30
  const { cv, g } = surface(W, H, s)
  const shape = rounded(2, 3, W - 2, H - 3, 12, seed, 0.35)
  wash(g, shape, { fill: on ? C.malachite : C.ink, alpha: on ? 1 : 0.18, layers: 3, jitter: 0.4, edge: on ? 1.6 : 0, seed })
  if (on) stroke(g, [[10, 7.5], [W / 2, 6.8], [W - 14, 7.6]], { w: 1.4, color: '#ffffff', alpha: 0.35, press: 'swell', seed: seed + 1 })
  outline(g, shape, 1, on ? C.malachiteD : C.ink2, seed + 2, 0.75, 0.15)
  return { cv, w: W, h: H, slice: [0, 0, 0, 0] }
}
// Núm tròn: đĩa giấy, vòng mực một nét (圆相) hở một khe
export function knobSkin(s: number, seed = 29): Skin {
  const W = 26, H = 26
  const { cv, g } = surface(W, H, s)
  g.save()
  g.shadowColor = rgba(C.ink, 0.4)
  g.shadowBlur = 2 * s
  g.shadowOffsetY = 1 * s
  g.fillStyle = paperFill(g, s, mix(C.paper, '#ffffff', 0.5))
  g.beginPath()
  g.arc(W / 2, H / 2, 10, 0, Math.PI * 2)
  g.fill()
  g.restore()
  ring(g, W / 2, H / 2, 9.4, 1.6, C.ink, seed, 0.85)
  return { cv, w: W, h: H, slice: [0, 0, 0, 0] }
}

// Vòng mực một nét (圆相): đi gần trọn vòng, đầu đậm đuôi khô
export function ring(g: G, cx: number, cy: number, r: number, w: number, color: string, seed: number, alpha = 0.9, gap = 0.12) {
  const pts: Pt[] = []
  const a0 = -Math.PI * 0.35 + (noise1(1, seed) - 0.5) * 0.6
  for (let i = 0; i <= 40; i++) {
    const t = i / 40, a = a0 + t * Math.PI * 2 * (1 - gap)
    const rr = r * (1 + (noise1(t * 3, seed + 1) - 0.5) * 0.06)
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr])
  }
  stroke(g, pts, { w, color, alpha, press: 'nail', dry: 0.5, rough: 0.35, seed })
}

// ---------- Chấm dẫn sổ sách (lặp ngang) ----------

export function dotsSkin(s: number, seed = 31): Skin {
  const W = 12, H = 6
  const { cv, g } = surface(W, H, s)
  blot(g, 3, H / 2 + 0.3, 0.75, C.ink, 0.45, seed, 0.8)
  blot(g, 9, H / 2 - 0.1, 0.6, C.ink, 0.38, seed + 1, 0.9)
  return { cv, w: W, h: H, slice: [0, 0, 0, 0] }
}

// ---------- Đĩa tròn: nút một biểu tượng, bong bóng gợi ý ----------

export type DiscTone = 'lacquer' | 'paper' | 'azure' | 'gold'
export function discSkin(s: number, tone: DiscTone, seed = 33): Skin {
  const W = 48, H = 48, c = 24, r = 20.5
  const { cv, g } = surface(W, H, s)
  const base = { lacquer: C.lacquer, paper: mix(C.paper, '#ffffff', 0.45), azure: C.azuriteD, gold: C.gold }[tone]
  const disc = rounded(c - r, c - r, c + r, c + r, r, seed, 0.3)
  g.save()
  g.shadowColor = rgba(C.ink, 0.45)
  g.shadowBlur = 3 * s
  g.shadowOffsetY = 1.6 * s
  g.fillStyle = tone === 'paper' ? paperFill(g, s, base, seed) : base
  path(g, disc)
  g.fill()
  g.restore()
  g.save()
  path(g, disc)
  g.clip()
  if (tone !== 'paper') wash(g, disc, { fill: base, alpha: 1, layers: 3, jitter: 0.4, edge: 1.8, seed })
  const sheen = g.createRadialGradient(c - 6, c - 9, 1, c, c, r + 2)
  sheen.addColorStop(0, rgba('#ffffff', tone === 'gold' ? 0.55 : tone === 'paper' ? 0.2 : 0.22))
  sheen.addColorStop(0.6, rgba('#ffffff', 0))
  sheen.addColorStop(1, rgba('#000000', tone === 'paper' ? 0.08 : 0.3))
  g.fillStyle = sheen
  g.fillRect(0, 0, W, H)
  g.restore()
  if (tone === 'paper') ring(g, c, c, r - 1, 1.7, C.ink2, seed + 1, 0.85, 0.06)
  else {
    ring(g, c, c, r - 2.2, 1.4, tone === 'gold' ? C.goldD : C.goldL, seed + 1, 0.9, 0.03)
    stroke(g, [...disc, disc[0], disc[1]], { w: 1.1, color: C.ink, alpha: 0.9, press: 'even', rough: 0.3, seed: seed + 2 })
  }
  stroke(g, [[c - 12, c - 6], [c - 9, c - 12], [c - 3, c - 15]], { w: 1.4, color: '#ffffff', alpha: tone === 'paper' ? 0.5 : 0.3, press: 'swell', dry: 0.4, seed: seed + 3 })
  return { cv, w: W, h: H, slice: [0, 0, 0, 0] }
}

// Khung chân dung: vòng vàng đôi viền mực, lòng trong suốt (đặt chồng lên ảnh chân dung tròn)
export const portraitRing = (): Asset => ({
  x: -24, y: -24, w: 48, h: 48,
  draw(g) {
    ring(g, 0, 0, 21.6, 3.4, C.gold, 3, 1, 0)
    ring(g, 0, 0, 21.6, 1.4, C.goldL, 4, 0.9, 0.2)
    ring(g, 0, 0, 23.2, 0.9, C.ink, 5, 0.9, 0)
    ring(g, 0, 0, 19.9, 0.8, C.ink, 6, 0.8, 0)
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2
      blot(g, Math.cos(a) * 21.6, Math.sin(a) * 21.6, 1.5, C.goldL, 1, 7 + i, 1)
      blot(g, Math.cos(a) * 21.6, Math.sin(a) * 21.6, 0.6, C.cinnabar, 1, 11 + i, 1)
    }
  },
})

// Mũi tên vàng chỉ đường (nhiệm vụ dẫn tới đây)
export const pointerArt = (): Asset => ({
  x: -12, y: -15, w: 24, h: 31,
  draw(g) {
    const pts: Pt[] = [[0, 14], [-9.5, 1.5], [-3.6, 1.2], [-3.4, -11.6], [3.4, -11.6], [3.6, 1.2], [9.5, 1.5]]
    g.save()
    g.shadowColor = rgba(C.ink, 0.45)
    g.shadowBlur = 2
    g.shadowOffsetY = 1.5
    wash(g, pts, { fill: C.gold, alpha: 1, layers: 3, jitter: 0.3, edge: 1.4, sharp: true, seed: 3 })
    g.restore()
    wash(g, [[-2.2, -10.4], [0.4, -10.4], [0.6, 2.4], [-5.6, 2.6]], { fill: C.goldL, alpha: 0.7, layers: 2, jitter: 0.3, seed: 4 })
    outline(g, [...pts], 1.1, C.ink, 5, 0.9, 0.1, 0.6)
    grain(g, 0.15)
  },
})
