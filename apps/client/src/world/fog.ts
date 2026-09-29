// Mê vụ trên bản đồ giới (Fog of War của RoK): ô sương chưa khai phủ mây giấy xám dày (che cả huy hiệu bên dưới), mép loang
// mềm như mây. Vẽ trên một canvas nhỏ (mỗi ô sương PX điểm ảnh) rồi phóng lên cả giới — một sprite, một texture.
// Tan / chưa tan theo rules (core/fog.ts `clear`), linh điểu đang bay tới thì tan đúng lúc tới.
import { Sprite, Texture } from 'pixi.js'
import { FOG_N, clear, type Fog } from '@rok/rules'
import { WORLD_TILE, artOf } from '@rok/art'
import { MAP_W } from '@rok/rules/world'

// canvas mỗi ô sương PX điểm ảnh: 48 (24 cũ) — bản đồ mở gần (WorldView Z_OPEN) thì mây vẫn mềm, không vỡ hạt
const PX = 48
// số giả ngẫu nhiên tất định theo ô (vẽ lại không nhảy): mỗi ô một bố cục mây riêng, không lặp thành lưới
const rnd = (cx: number, cy: number, k: number) => {
  let h = Math.imul(cx + 1, 73856093) ^ Math.imul(cy + 1, 19349663) ^ Math.imul(k + 1, 83492791)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
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
    // nền: ô sương tô xám giấy
    sh.fillStyle = '#a2a9ac'
    open.forEach((o, i) => o || sh.fillRect((i % FOG_N) * PX - 2, Math.floor(i / FOG_N) * PX - 2, PX + 4, PX + 4))
    // mây vẽ tay (fog:*) rải lệch trên nền: mỗi ô vài đám, vị trí / cỡ / độ trong / lật theo ô — các elip đặt đều cũ phóng gần
    // thành lưới chấm tròn. source-atop: mây chỉ nằm trong vùng sương, không tràn sang ô đã tan
    const clouds = [0, 1, 2].map(k => artOf(`fog:*${k}`)).filter(e => e?.img)
    sh.globalCompositeOperation = 'source-atop'
    open.forEach((o, i) => {
      if (o) return
      const cx = i % FOG_N,
        cy = Math.floor(i / FOG_N)
      for (let k = 0; k < 3; k++) {
        const w = PX * (0.8 + rnd(cx, cy, k * 5) * 1.1),
          x = (cx + rnd(cx, cy, k * 5 + 1)) * PX,
          y = (cy + rnd(cx, cy, k * 5 + 2)) * PX
        sh.globalAlpha = 0.28 + rnd(cx, cy, k * 5 + 3) * 0.4
        const e = clouds[Math.floor(rnd(cx, cy, k * 5 + 4) * clouds.length)]
        if (e?.img) {
          const [fx, fy, fw, fh] = e.frame ?? [0, 0, e.img.naturalWidth, e.img.naturalHeight]
          const flip = rnd(cx, cy, k * 5 + 9) < 0.5 ? -1 : 1
          sh.setTransform(flip, 0, 0, 1, x, y)
          sh.drawImage(e.img, fx, fy, fw, fh, -w / 2, -w / 4, w, w / 2)
          sh.setTransform(1, 0, 0, 1, 0, 0)
        } else {
          // tắt art: vệt sáng loang lệch (không đều như lưới)
          sh.fillStyle = 'rgb(236 232 222)'
          sh.beginPath()
          sh.ellipse(x, y, w * 0.45, w * 0.22, 0, 0, Math.PI * 2)
          sh.fill()
        }
      }
    })
    sh.globalAlpha = 1
    sh.globalCompositeOperation = 'source-over'
    // mép mềm: mờ một lần cả tấm (trình duyệt không có filter thì mép thẳng — vẫn đúng)
    g.filter = `blur(${PX / 5}px)`
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
