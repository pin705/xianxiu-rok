// Mê vụ trên bản đồ giới (Fog of War của RoK): ô sương chưa khai phủ mây giấy xám dày (che cả huy hiệu bên dưới), mép loang
// mềm như mây. Vẽ trên một canvas nhỏ (mỗi ô sương PX điểm ảnh) rồi phóng lên cả giới — một sprite, một texture.
// Tan / chưa tan theo rules (core/fog.ts `clear`), linh điểu đang bay tới thì tan đúng lúc tới.
import { Sprite, Texture } from 'pixi.js'
import { FOG_N, clear, type Fog } from '@rok/rules'
import { WORLD_TILE } from '@rok/art'
import { MAP_W } from '@rok/rules/world'

const PX = 24
export class FogLayer {
  readonly sprite: Sprite
  private canvas = document.createElement('canvas')
  private shape = document.createElement('canvas') // ô sương sắc cạnh; mờ một lần khi chép sang canvas chính
  private tex: Texture
  private key = '' // mê vụ đã vẽ (vẽ lại chỉ khi đổi)
  constructor() {
    this.canvas.width = this.canvas.height = this.shape.width = this.shape.height = FOG_N * PX
    this.tex = Texture.from(this.canvas)
    this.sprite = new Sprite(this.tex)
    this.sprite.width = this.sprite.height = MAP_W * WORLD_TILE
  }
  paint(f: Fog | null, now: number) {
    this.sprite.visible = !!f
    if (!f) return
    const open: boolean[] = []
    for (let cy = 0; cy < FOG_N; cy++) for (let cx = 0; cx < FOG_N; cx++) open.push(clear(f, cx, cy, now))
    const key = open.map(Number).join('')
    if (key === this.key) return
    this.key = key
    const g = this.canvas.getContext('2d')!,
      sh = this.shape.getContext('2d')!
    g.clearRect(0, 0, this.canvas.width, this.canvas.height)
    sh.clearRect(0, 0, this.shape.width, this.shape.height)
    // mây: ô sương tô xám giấy + vân sáng loang (tất định theo ô: vẽ lại không nhấp nháy)
    sh.fillStyle = '#a2a9ac'
    open.forEach((o, i) => o || sh.fillRect((i % FOG_N) * PX - 2, Math.floor(i / FOG_N) * PX - 2, PX + 4, PX + 4))
    sh.fillStyle = 'rgba(236,232,222,0.3)'
    open.forEach((o, i) => {
      const cx = i % FOG_N,
        cy = Math.floor(i / FOG_N)
      if (o || (cx * 7 + cy * 13) % 3) return
      sh.beginPath()
      sh.ellipse((cx + 0.5) * PX, (cy + 0.4) * PX, PX * 0.55, PX * 0.3, 0, 0, Math.PI * 2)
      sh.fill()
    })
    // mép mềm: mờ một lần cả tấm (trình duyệt không có filter thì mép thẳng — vẫn đúng)
    g.filter = 'blur(5px)'
    g.drawImage(this.shape, 0, 0)
    g.filter = 'none'
    this.tex.source.update()
  }
  destroy() {
    this.tex.destroy(true)
  }
}
// Lúc linh điểu kế tiếp tới nơi (vẽ lại mê vụ đúng lúc đó); Infinity: không có
export const nextLand = (f: Fog, now: number) => Math.min(Infinity, ...f.fly.map(x => x.at).filter(t => t > now))
