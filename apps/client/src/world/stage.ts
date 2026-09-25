// Một ứng dụng WebGL (PixiJS) cho cả game: cảnh núi, bản đồ… là các Container gắn vào stage.
// Hình vẽ tay nướng một lần ra texture (bake), sau đó GPU chỉ việc ghép và diễn chuyển động.
import { Application, Container, Rectangle, Sprite, Texture, type TextureSource } from 'pixi.js'
import {
  artOf,
  artPack,
  bake,
  beamTex,
  dump,
  noteArt,
  glowTex,
  paper,
  puffTex,
  rayTex,
  ringTex,
  sparkTex,
  type Asset,
} from '@rok/art'

export const DPR = Math.min(globalThis.devicePixelRatio || 1, 2)
// Cảnh rộng 400 DU. Màn hẹp: cả bề ngang, tối đa bề rộng cột (--col: 480px điện thoại, 620px máy tính bảng).
// Desktop (theme.css đặt --rail): vùng bên phải cột trái, tối đa WIDE px. Số đọc từ CSS để cảnh và HTML luôn khớp.
export const WIDE = 600
let box: { rail: number; col: number } | undefined
const css = (k: string) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(k))
const measure = () => ({ rail: css('--rail') || 0, col: css('--col') || 480 })
if (typeof addEventListener !== 'undefined') addEventListener('resize', () => (box = measure()))
// đọc lười: lần gọi đầu CSS đã nạp xong
const layout = () => (box ??= typeof document === 'undefined' ? { rail: 0, col: 480 } : measure())
// bề ngang cột trái (0 trên màn hẹp)
export const railPx = () => layout().rail
export const cssPerDU = () => Math.min(innerWidth - railPx(), railPx() ? WIDE : layout().col) / 400
// ngăn kéo desktop đang mở (ui/Sheet ghi --dockw lên <html>): cảnh dịch sang trái cho khỏi bị che
const dockPx = () =>
  typeof document === 'undefined' ? 0 : parseFloat(document.documentElement.style.getPropertyValue('--dockw')) || 0
// mép trái của cảnh (px CSS): giữa vùng còn lại giữa cột trái và ngăn kéo
export const sceneX = (k: number) => railPx() + (innerWidth - railPx() - dockPx() - 400 * k) / 2
// Độ phân giải texture: đủ nét cho màn hình hiện tại, làm tròn để cache không vỡ khi đổi cỡ nhỏ
export const texScale = () => Math.ceil(cssPerDU() * DPR * 4) / 4

let booting: Promise<Application> | undefined

export function getApp() {
  booting ??= (async () => {
    const a = new Application()
    await a.init({
      resizeTo: window,
      backgroundAlpha: 0,
      antialias: false,
      resolution: DPR,
      autoDensity: true,
      preference: 'webgl',
      powerPreference: 'high-performance',
    })
    a.canvas.setAttribute('aria-hidden', 'true')
    Object.assign(a.canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', touchAction: 'none' })
    return a
  })()
  return booting
}

// Gắn một cảnh vào ứng dụng WebGL chung, chạy tick mỗi khung; trả hàm gỡ (gọi được cả khi app chưa kịp khởi động).
// host: canvas vào đây, phủ lên mọi cảnh khác (xem trận) — gỡ ra thì trả về làm nền trang. Không có: canvas là nền trang.
// Mất context WebGL (máy yếu, nhiều tab): ẩn cảnh tới khi có lại.
type Scene = { root: Container; destroy(): void }
export function mountScene<S extends Scene>(o: {
  make: (app: Application) => S
  tick: (s: S, app: Application) => void
  ready?: (s: S) => void
  host?: HTMLElement
  art?: readonly string[] // gói tranh cảnh này cần (artPack): dựng cảnh khi đã về, như màn nạp của engine
}): () => void {
  let dead = false
  let off = () => {}
  void Promise.all([getApp(), ...(o.art ?? []).map(artPack)]).then(([app]) => {
    if (dead) return
    const covered = o.host ? app.stage.children.filter(c => c.visible) : []
    const s = o.make(app)
    for (const c of covered) c.visible = false
    app.stage.addChild(s.root)
    if (o.host) o.host.prepend(app.canvas)
    else if (!app.canvas.isConnected) document.body.prepend(app.canvas)
    const run = () => o.tick(s, app)
    app.ticker.add(run)
    let shown = true
    const lost = () => {
      shown = s.root.visible
      s.root.visible = false
    }
    const restored = () => {
      s.root.visible = shown
    }
    app.canvas.addEventListener('webglcontextlost', lost)
    app.canvas.addEventListener('webglcontextrestored', restored)
    o.ready?.(s)
    off = () => {
      app.ticker.remove(run)
      app.canvas.removeEventListener('webglcontextlost', lost)
      app.canvas.removeEventListener('webglcontextrestored', restored)
      s.destroy()
      for (const c of covered) c.visible = true
      if (o.host) document.body.prepend(app.canvas)
    }
  })
  return () => {
    dead = true
    off()
  }
}

// ---------- Texture ----------

export type Painted<M = unknown> = {
  tex: Texture
  anchor: readonly [number, number]
  scale: number
  meta: M
  art?: boolean
}
const cache = new Map<string, Painted<unknown>>()
dump.painted = cache // ?art=0: tools/art/export.ts xuất các texture vẽ bằng code
const pages = new Map<HTMLImageElement, TextureSource>()
// Key động (mây: fog:<rộng>:<hạt>…) không khai được từng cái: manifest có vài tranh chung 'fog:*0'…, chọn theo key cho khỏi giống hệt
function artFor(key: string) {
  const e = artOf(key)
  if (e) return e
  const fam = key.slice(0, key.indexOf(':'))
  let h = 0
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return artOf(`${fam}:*${h % 3}`)
} // mỗi trang atlas một nguồn GPU, texture từng hình là một khung trên trang

// Nướng một asset (một lần mỗi key + độ phân giải). Có tranh vẽ tay thì dùng tranh; tranh thuộc gói chưa tải xong thì vẽ bằng
// code tạm và gọi tải gói — lần gọi sau khi gói về sẽ đổi sang tranh (bản tạm không giữ chỗ trong cache).
export function painted<M>(key: string, make: () => Asset<M>, scale = texScale()): Painted<M> {
  const k = `${key}@${scale}`
  const e = artFor(key)
  let p = cache.get(k) as Painted<M> | undefined
  if (p && (p.art || !e?.img)) return p
  if (e?.pack && !e.img) void artPack(e.pack)
  const a = make()
  if (e?.img) {
    // tranh vẽ tay khít hộp asset: neo theo asset, cỡ theo ảnh; meta (điểm chạm, chỗ treo biển…) vẫn lấy từ bản vẽ code
    const meta = bake(a, 1 / 64).meta
    const [fx, fy, fw, fh] = e.frame ?? [0, 0, e.img.naturalWidth, e.img.naturalHeight]
    let source = pages.get(e.img)
    if (!source) pages.set(e.img, (source = Texture.from(e.img).source))
    const tex = new Texture({ source, frame: new Rectangle(fx, fy, fw, fh) })
    p = { tex, anchor: [-a.x / a.w, -a.y / a.h], scale: fw / a.w, meta, art: true }
  } else {
    noteArt(key, { kind: 'tex', w: a.w, h: a.h, px: scale })
    const b = bake(a, scale)
    p = { tex: Texture.from(b.canvas as HTMLCanvasElement), anchor: b.anchor, scale, meta: b.meta }
  }
  cache.set(k, p)
  return p
}

// Texture từ canvas sinh sẵn (sương, quầng sáng…) — không theo DU
const raw = new Map<string, Texture>()
export function texOf(key: string, make: () => HTMLCanvasElement | OffscreenCanvas) {
  let t = raw.get(key)
  if (!t) raw.set(key, (t = Texture.from(make() as HTMLCanvasElement)))
  return t
}

export const hex = (c: string) => parseInt(c.slice(1), 16) // '#rrggbb' → số màu (tint)
// Sprite từ texture nướng sẵn: đúng điểm neo, đúng cỡ DU
export function sprite(p: Painted, x = 0, y = 0) {
  const s = new Sprite(p.tex)
  s.anchor.set(p.anchor[0], p.anchor[1])
  s.scale.set(1 / p.scale)
  s.position.set(x, y)
  return s
}

// Texture chung của các cảnh: mỗi khoá đúng một cỡ (cùng khoá khác cỡ thì cache trả nhầm) — gọi fxTex.spark()…
export const fxTex = {
  spark: () => texOf('spark', () => sparkTex(24)),
  glow: () => texOf('glow', () => glowTex(64)),
  puff: () => texOf('puff', () => puffTex()),
  paper: () => texOf('paper', () => paper(256)),
  ring: () => texOf('ring', () => ringTex(160, 48, 2.5)),
  ray: () => texOf('ray', () => rayTex()),
  beam: () => texOf('beam', () => beamTex()),
}

// ---------- Nét VFX ba lớp ----------
// Cùng một hình trắng vẽ ba bề ngang: bóng mực (thường) → sắc khoáng (thường) → lõi sáng (cộng).
// Trên nền giấy sáng mà chỉ cộng sáng thì hình bị loá mất; lớp mực giữ dáng, chỉ lõi mới phát sáng.
export type Hue = readonly [ink: string, pigment: string, glow: string]
export const THUNDER: Hue = ['#7a5cff', '#cbb8ff', '#ffffff'] // sét: lớp ngoài tím sáng làm quầng trên trời tối
type Canvas = HTMLCanvasElement | OffscreenCanvas
const LAYERS = [
  [1, 'normal', 0.9],
  [0.62, 'normal', 1],
  [0.3, 'add', 1],
] as const
// Khung tan: mỗi khung vẽ lại khô hơn, đuôi nét tước sợi rồi hết (đầu nét vẫn đậm) — thay cho mờ dần đều
export const DRY = [0.12, 0.3, 0.55, 0.78, 0.95]
// vượt quá rồi thu về: khung "BÙNG" khi hiệu ứng vừa bung ra
export const back = (k: number) => 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2
export const LAST_DRY = DRY.length - 1
export type Ink = { c: Container; frame: (f: number) => void }
// make(f, k): khung f (0..frames-1), hệ số bề ngang k. size: bề ngang hiện ra (DU)
export function ink(
  key: string,
  make: (f: number, k: number) => Canvas,
  hue: Hue,
  size: number,
  frames = DRY.length,
): Ink {
  const c = new Container()
  const tex = (li: number, f: number) => texOf(`${key}:${li}:${f}`, () => make(f, LAYERS[li][0]))
  const layers = LAYERS.map(([, blend, alpha], li) => {
    const s = new Sprite(tex(li, 0))
    s.anchor.set(0.5)
    s.tint = hex(hue[li])
    s.blendMode = blend
    s.alpha = alpha
    return c.addChild(s)
  })
  c.scale.set(size / layers[0].texture.width)
  const frame = (f: number) =>
    layers.forEach((s, li) => (s.texture = tex(li, Math.max(0, Math.min(frames - 1, Math.floor(f))))))
  return { c, frame }
}
// Nướng sẵn mọi khung của các nét VFX lúc rảnh, mỗi lần một hình (~5 ms), để lần hiện đầu không khựng
export function warm(list: [key: string, make: (f: number, k: number) => Canvas][], frames = DRY.length) {
  const idle = globalThis.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 30))
  const next = () => {
    const it = list.shift()
    if (!it) return
    for (let f = 0; f < frames; f++) LAYERS.forEach(([k], li) => texOf(`${it[0]}:${li}:${f}`, () => it[1](f, k)))
    idle(next)
  }
  idle(next)
}
