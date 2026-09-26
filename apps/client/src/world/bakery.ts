// Nướng mảnh địa hình cho bản đồ giới (worldmap.ts): worker nếu có (OffscreenCanvas), không thì trên luồng chính (Safari cũ) — chậm
// hơn nhưng vẫn ra hình
import { atlas, MAP_W } from '@rok/rules/world'
import { WORLD_TILE as T, bake, worldPiece } from '@rok/art'
import type { BakeJob } from './bake.worker'

export class Bakery {
  private worker: Worker | null = null
  private n = 0
  private wait = new Map<
    number,
    { job: Omit<BakeJob, 'id'>; ok: (b: ImageBitmap | HTMLCanvasElement | null) => void }
  >()
  constructor() {
    try {
      if (typeof OffscreenCanvas !== 'undefined') {
        this.worker = new Worker(new URL('./bake.worker.ts', import.meta.url), { type: 'module' })
        this.worker.onmessage = (e: MessageEvent<{ id: number; bmp: ImageBitmap }>) => {
          this.wait.get(e.data.id)?.ok(e.data.bmp)
          this.wait.delete(e.data.id)
        }
        // worker hỏng (trình duyệt không cho canvas trong worker…): nướng các việc đang chờ trên luồng chính
        this.worker.onerror = e => {
          console.warn('bake worker failed, baking on main thread', e.message)
          this.worker?.terminate()
          this.worker = null
          for (const [id, w] of this.wait) {
            this.wait.delete(id)
            w.ok(this.here(w.job))
          }
        }
      }
    } catch {
      this.worker = null
    }
  }
  private here(j: Omit<BakeJob, 'id'>) {
    const a = atlas(j.seed)
    const piece = worldPiece(
      { seed: j.seed, tiles: a.tiles, rings: a.regions.map(r => r.ring), w: MAP_W },
      j.x0,
      j.y0,
      j.n,
      j.fine,
    )
    return bake(piece, j.px / (j.n * T)).canvas as HTMLCanvasElement
  }
  bake(j: Omit<BakeJob, 'id'>): Promise<ImageBitmap | HTMLCanvasElement | null> {
    if (!this.worker) return Promise.resolve(this.here(j))
    const id = ++this.n
    return new Promise(ok => {
      this.wait.set(id, { job: j, ok })
      this.worker!.postMessage({ ...j, id })
    })
  }
  destroy() {
    this.worker?.terminate()
    for (const w of this.wait.values()) w.ok(null)
  }
}
