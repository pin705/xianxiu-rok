// Bản đồ giới vẽ tay (P3): 150 × 150 ô, mỗi ô WORLD_TILE DU. Nền màu nước loang (mỗi ô một điểm màu, phóng mịn), sông hồ,
// rừng, núi mực; vòng giữa ngả ngọc, tâm giới ngả vàng; biên vùng nét mực đứt. Cùng một hàm vẽ ảnh tổng quan (cả giới)
// lẫn mảnh nét (một khung ô) — mảnh nét thêm nét tùng, sống núi. Chạy được trong worker (OffscreenCanvas, không DOM).
import { blot, canvas, grain, stroke, wash, type Asset, type G, type Pt } from './brush'
import { fbm, rng } from './noise'
import { PIGMENT as C, mix } from './palette'

export { bake } from './brush' // worker nướng mảnh bản đồ chỉ cần file này (không kéo component Svelte)

export const WORLD_TILE = 16
export type Land = 'water' | 'plain' | 'forest' | 'hill' | 'mount'

// Địa hình ô (x, y) theo seed: cao độ + ẩm độ từ fbm. Chỉ để vẽ — luật không dùng (đi lại chỉ theo vùng và cổng).
export function landAt(seed: number, x: number, y: number): Land {
  const h = fbm(x * 0.06, y * 0.06, seed, 4)
  const m = fbm(x * 0.09 + 31, y * 0.09 + 77, seed + 5, 3)
  return h < 0.33 ? 'water' : h > 0.66 ? 'mount' : h > 0.58 ? 'hill' : m > 0.55 ? 'forest' : 'plain'
}

const LAND: Record<Land, string> = {
  water: mix(C.azuriteL, C.paper, 0.35),
  plain: mix(C.paper2, C.malachiteL, 0.18),
  forest: mix(C.malachiteL, C.paper2, 0.35),
  hill: mix(C.ochreL, C.paper2, 0.45),
  mount: mix(C.ink3, C.paper2, 0.45),
}
const RING = [C.paper2, C.malachiteL, C.goldL] // tông của vòng ngoài, giữa, tâm

export type WorldData = { seed: number; tiles: Uint8Array; rings: number[]; w: number } // w: số ô mỗi cạnh

// Mảnh bản đồ: ô [x0, x0+n) × [y0, y0+n). fine: vẽ thêm nét chi tiết (mảnh phóng to)
export function worldPiece(d: WorldData, x0: number, y0: number, n: number, fine: boolean): Asset {
  const T = WORLD_TILE
  return {
    x: x0 * T, y: y0 * T, w: n * T, h: n * T,
    draw(g) {
      const region = (x: number, y: number) => d.tiles[Math.min(d.w - 1, Math.max(0, y)) * d.w + Math.min(d.w - 1, Math.max(0, x))]
      // 1. màu nước: một điểm màu mỗi ô (thêm viền 1 ô để mảnh ghép liền), phóng lên mịn
      const pad = 1, m = n + 2 * pad
      const field = canvas(m, m)
      const fg = field.getContext('2d') as G
      const img = fg.createImageData(m, m)
      for (let j = 0; j < m; j++)
        for (let i = 0; i < m; i++) {
          const x = x0 + i - pad, y = y0 + j - pad
          const land = landAt(d.seed, x, y)
          const ring = d.rings[region(x, y)] ?? 0
          const c = mix(LAND[land], RING[ring], land === 'water' ? 0.1 : ring ? 0.35 : 0)
          const k = (j * m + i) * 4
          img.data[k] = parseInt(c.slice(1, 3), 16)
          img.data[k + 1] = parseInt(c.slice(3, 5), 16)
          img.data[k + 2] = parseInt(c.slice(5, 7), 16)
          img.data[k + 3] = 255
        }
      fg.putImageData(img, 0, 0)
      g.save()
      g.imageSmoothingEnabled = true
      g.imageSmoothingQuality = 'high'
      g.drawImage(field as CanvasImageSource, (x0 - pad) * T, (y0 - pad) * T, m * T, m * T)
      g.restore()
      const rn = rng(d.seed ^ (x0 * 131 + y0 * 7919))
      // 2. núi: sống núi mực nhạt trên ô núi (thưa ở ảnh tổng quan), rừng: chấm / tùng nhỏ
      const step = fine ? 2 : 3
      for (let y = y0; y < y0 + n; y += step)
        for (let x = x0; x < x0 + n; x += step) {
          const land = landAt(d.seed, x, y)
          const cx = (x + 0.5 + (rn() - 0.5) * 1.4) * T, cy = (y + 0.5 + (rn() - 0.5) * 1.4) * T
          if (land === 'mount') {
            const w = T * (fine ? 2.4 : 2.8), h = T * (fine ? 1.8 : 2.2)
            const top: Pt = [cx + (rn() - 0.5) * w * 0.3, cy - h]
            const pts: Pt[] = [[cx - w / 2, cy], [cx - w * 0.2, cy - h * 0.55], top, [cx + w * 0.25, cy - h * 0.5], [cx + w / 2, cy]]
            wash(g, pts, { fill: mix(C.ink3, C.indigo, 0.25), alpha: 0.35, jitter: 1, layers: 2, seed: x * 31 + y })
            stroke(g, pts.slice(0, 4), { w: fine ? 1.1 : 1.6, color: C.ink, press: 'nail', alpha: 0.5, dry: 0.45, seed: x * 17 + y })
          } else if (land === 'hill' && rn() < 0.5) {
            stroke(g, [[cx - T, cy], [cx, cy - T * 0.6], [cx + T, cy]], { w: fine ? 0.9 : 1.2, color: C.ink2, press: 'taper', alpha: 0.35, seed: x * 13 + y })
          } else if (land === 'forest') {
            for (let k = 0; k < (fine ? 3 : 1); k++) blot(g, cx + (rn() - 0.5) * T, cy + (rn() - 0.5) * T, T * (fine ? 0.32 : 0.45), mix(C.malachiteD, C.ink, 0.25), 0.55, x * 7 + y * 3 + k)
          } else if (land === 'water' && fine && rn() < 0.25) {
            stroke(g, [[cx - T * 0.6, cy], [cx, cy - 1.5], [cx + T * 0.6, cy]], { w: 0.7, color: C.azuriteD, press: 'taper', alpha: 0.35, seed: x * 11 + y })
          }
        }
      // 3. biên vùng: nét mực đứt giữa hai ô khác vùng
      g.save()
      g.strokeStyle = 'rgba(33,28,23,0.42)'
      g.lineWidth = fine ? 1.4 : 2.4
      g.setLineDash(fine ? [5, 4] : [9, 7])
      g.beginPath()
      for (let y = y0; y < y0 + n; y++)
        for (let x = x0; x < x0 + n; x++) {
          const r = region(x, y)
          if (x + 1 < d.w && region(x + 1, y) !== r) g.moveTo((x + 1) * T, y * T), g.lineTo((x + 1) * T, (y + 1) * T)
          if (y + 1 < d.w && region(x, y + 1) !== r) g.moveTo(x * T, (y + 1) * T), g.lineTo((x + 1) * T, (y + 1) * T)
        }
      g.stroke()
      g.restore()
      grain(g, fine ? 0.25 : 0.15)
    },
  }
}
