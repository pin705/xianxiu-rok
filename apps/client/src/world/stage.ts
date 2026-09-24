// Một ứng dụng WebGL (PixiJS) cho cả game: cảnh núi, bản đồ… là các Container gắn vào stage.
// Hình vẽ tay nướng một lần ra texture (bake), sau đó GPU chỉ việc ghép và diễn chuyển động.
import { Application, Container, Sprite, Texture } from 'pixi.js'
import { bake, type Asset } from '@rok/art'

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

let app: Application | undefined
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
    return (app = a)
  })()
  return booting
}
export const appNow = () => app

// ---------- Texture ----------

export type Painted<M = unknown> = { tex: Texture; anchor: readonly [number, number]; scale: number; meta: M }
const cache = new Map<string, Painted<unknown>>()

// Nướng một asset vẽ tay (một lần mỗi key + độ phân giải)
export function painted<M>(key: string, make: () => Asset<M>, scale = texScale()): Painted<M> {
  const k = `${key}@${scale}`
  let p = cache.get(k) as Painted<M> | undefined
  if (!p) {
    const b = bake(make(), scale)
    p = { tex: Texture.from(b.canvas as HTMLCanvasElement), anchor: b.anchor, scale, meta: b.meta }
    cache.set(k, p)
  }
  return p
}

// Texture từ canvas sinh sẵn (sương, quầng sáng…) — không theo DU
const raw = new Map<string, Texture>()
export function texOf(key: string, make: () => HTMLCanvasElement | OffscreenCanvas) {
  let t = raw.get(key)
  if (!t) raw.set(key, (t = Texture.from(make() as HTMLCanvasElement)))
  return t
}

// ---------- Nét VFX ba lớp ----------
// Cùng một hình trắng vẽ ba bề ngang: bóng mực (thường) → sắc khoáng (thường) → lõi sáng (cộng).
// Trên nền giấy sáng mà chỉ cộng sáng thì hình bị loá mất; lớp mực giữ dáng, chỉ lõi mới phát sáng.
export type Hue = readonly [ink: string, pigment: string, glow: string]
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
export const last = DRY.length - 1
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
    s.tint = parseInt(hue[li].slice(1), 16)
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
