// Nướng địa hình bản đồ giới ngoài luồng chính (OffscreenCanvas): mỗi yêu cầu một mảnh, trả ImageBitmap (chuyển, không chép).
import { atlas } from '@rok/rules/world'
import { WORLD_TILE, bake, worldPiece } from '@rok/art/world'

export type BakeJob = { id: number; seed: number; x0: number; y0: number; n: number; px: number; fine: boolean }

self.onmessage = (e: MessageEvent<BakeJob>) => {
  const j = e.data
  const a = atlas(j.seed)
  const piece = worldPiece(
    { seed: j.seed, tiles: a.tiles, rings: a.regions.map(r => r.ring), w: 150 },
    j.x0,
    j.y0,
    j.n,
    j.fine,
  )
  const { canvas } = bake(piece, j.px / (j.n * WORLD_TILE))
  const bmp = (canvas as OffscreenCanvas).transferToImageBitmap()
  ;(self as unknown as Worker).postMessage({ id: j.id, bmp }, [bmp])
}
