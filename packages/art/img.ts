// Ảnh vẽ tay cho giao diện HTML: nướng asset ra data URL, nhớ theo key + cỡ điểm ảnh.
import { artOf, noteArt } from './art'
import { bake, type Asset } from './brush'

const cache = new Map<string, string>()
const dpr = () => Math.min(globalThis.devicePixelRatio || 1, 3)
// Ngoài trình duyệt (render thử trên Node) không có canvas: trả ảnh trong suốt 1px thay vì vỡ
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='

// px: cạnh dài nhất muốn hiện (px CSS); làm tròn lên bậc 8 px thật để dùng lại ảnh giữa các cỡ gần nhau
export function paintedUrl(key: string, make: () => Asset<unknown>, px: number) {
  const art = artOf(key)
  if (art) return art.src // có tranh vẽ tay thì dùng tranh
  if (typeof document === 'undefined' && typeof OffscreenCanvas === 'undefined') return BLANK
  const real = Math.ceil((px * dpr()) / 8) * 8
  const k = `${key}@${real}`
  let url = cache.get(k)
  if (!url) {
    const a = make()
    noteArt(key, { kind: 'dom', w: a.w, h: a.h, px: real })
    const b = bake(a, real / Math.max(a.w, a.h))
    url = (b.canvas as HTMLCanvasElement).toDataURL()
    cache.set(k, url)
  }
  return url
}
