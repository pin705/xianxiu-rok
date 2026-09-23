// Phòng thử art (chỉ bản dev): mở /lab.html để xem hình vẽ tay trên giấy.
import { bake, building, paper, type Asset, type Kind } from '@rok/art'

const W = 390, H = 844, S = 2
const cv = document.createElement('canvas')
cv.width = W * S
cv.height = H * S
cv.style.width = `${W}px`
document.body.append(cv)
const out = cv.getContext('2d')!
out.fillStyle = out.createPattern(paper(256) as HTMLCanvasElement, 'repeat')!
out.fillRect(0, 0, cv.width, cv.height)

const put = <M,>(a: Asset<M>, x: number, y: number, sc = S) => {
  const b = bake(a, sc)
  out.drawImage(b.canvas as HTMLCanvasElement, (x + a.x) * S, (y + a.y) * S, a.w * S, a.h * S)
  return b.meta
}
await new FontFace('Seal', 'url(/fonts/seal.woff2)').load().then(f => document.fonts.add(f))
const t0 = performance.now()
const lv = Number(new URLSearchParams(location.search).get('lv') ?? 1)
const ids: Kind[] = ['chuDien', 'tangKinhCac', 'danPhong', 'tangBaoCac', 'dienVoTruong', 'tuLinhTran', 'khoangMach', 'linhDien']
const pos: [number, number][] = [[195, 120], [80, 250], [290, 250], [80, 400], [270, 400], [100, 560], [290, 560], [195, 720]]
ids.forEach((id, i) => put(building(id, lv, '殿阵田矿库武经丹'[i]).art, ...pos[i]))
console.log('bake ms', (performance.now() - t0).toFixed(1))
Object.assign(globalThis, { labReady: true })
