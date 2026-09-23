// Một ứng dụng WebGL (PixiJS) cho cả game: cảnh núi, bản đồ… là các Container gắn vào stage.
// Hình vẽ tay nướng một lần ra texture (bake), sau đó GPU chỉ việc ghép và diễn chuyển động.
import { Application, Texture } from 'pixi.js'
import { bake, type Asset } from '@rok/art'

export const DPR = Math.min(globalThis.devicePixelRatio || 1, 2)
// Cảnh rộng 400 DU, hiện trên cột tối đa 480px CSS
export const COL = 480
export const cssPerDU = () => Math.min(innerWidth, COL) / 400
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
