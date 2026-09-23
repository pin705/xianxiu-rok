// Ảnh vẽ tay cho giao diện HTML: nướng asset ra data URL, nhớ theo key + cỡ điểm ảnh.
import { bake, type Asset } from './brush'

const cache = new Map<string, string>()
const dpr = () => Math.min(globalThis.devicePixelRatio || 1, 3)

// px: cạnh dài nhất muốn hiện (px CSS); làm tròn lên bậc 8 px thật để dùng lại ảnh giữa các cỡ gần nhau
export function paintedUrl(key: string, make: () => Asset<unknown>, px: number) {
  const real = Math.ceil((px * dpr()) / 8) * 8
  const k = `${key}@${real}`
  let url = cache.get(k)
  if (!url) {
    const a = make()
    const b = bake(a, real / Math.max(a.w, a.h))
    url = (b.canvas as HTMLCanvasElement).toDataURL()
    cache.set(k, url)
  }
  return url
}
