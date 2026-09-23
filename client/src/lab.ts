// Phòng thử art (chỉ bản dev): /lab.html — xem hình vẽ tay trên giấy. ?view=icons|faces|buildings (mặc định)
import { ITEMS, bake, bamboo, battlefield, beast, blossom, building, butterfly, flyingSword, itemIcon, paper, portrait, soldier, splashTex, stairway, stoneLantern, vortexTex, type Asset, type Kind, type Look } from '@rok/art'
import { LOOK } from './lib'

const W = 390, H = 844, S = 2
const cv = document.createElement('canvas')
cv.width = W * S
cv.height = H * S
cv.style.width = `${W}px`
document.body.append(cv)
const out = cv.getContext('2d')!
out.fillStyle = out.createPattern(paper(256) as HTMLCanvasElement, 'repeat')!
out.fillRect(0, 0, cv.width, cv.height)

// đặt asset: neo (0,0) của asset tại (x, y), cỡ hiện `px` theo cạnh dài (mặc định: 1 DU = 1 px)
const put = <M,>(a: Asset<M>, x: number, y: number, px = Math.max(a.w, a.h)) => {
  const k = px ? px / Math.max(a.w, a.h) : 1
  const b = bake(a, k * S)
  out.drawImage(b.canvas as HTMLCanvasElement, (x + a.x * k) * S, (y + a.y * k) * S, a.w * k * S, a.h * k * S)
}
await new FontFace('Seal', 'url(/fonts/seal.woff2)').load().then(f => document.fonts.add(f))
const view = new URLSearchParams(location.search).get('view') ?? 'buildings'
const t0 = performance.now()
if (view === 'icons') {
  ;[64, 32, 22, 16].forEach((px, row) => ITEMS.forEach((n, i) => put(itemIcon(n), 40 + i * 62, 60 + row * 90, px)))
} else if (view === 'troops') {
  put(battlefield(390, 844, 'wild'), 0, 0, 844)
  ;(['kiem', 'phap', 'the'] as const).forEach((t, i) => {
    put(soldier(t, false), 60 + i * 60, 620, 60)
    put(soldier(t, true), 60 + i * 60, 320, 60)
    put(beast(t), 90 + i * 110, 450, 90)
  })
  put(flyingSword(), 340, 620, 40)
} else if (view === 'decor') {
  put(stairway([[80, 420], [70, 360], [92, 300], [86, 240]], 16, 3), 0, 0, 0)
  put(blossom(1.3, 2), 200, 180)
  put(blossom(1, 7), 320, 180)
  put(stoneLantern(1.4), 190, 300)
  put(stoneLantern(1.4), 240, 300)
  put(bamboo(1.2, 4), 320, 330)
  put(butterfly(true), 200, 380, 40)
  put(butterfly(false), 260, 380, 40)
  put(beast('the'), 300, 470, 110)
  const v = vortexTex(256, 5)
  out.fillStyle = '#342c4a'
  out.fillRect(0, 490 * S, 240 * S, 320 * S)
  out.drawImage(v as HTMLCanvasElement, 20 * S, 500 * S, 200 * S, 200 * S)
  out.drawImage(v as HTMLCanvasElement, 20 * S, 710 * S, 200 * S, 84 * S)
  const sp = splashTex(128)
  out.drawImage(sp as HTMLCanvasElement, 250 * S, 560 * S, 100 * S, 100 * S)
} else if (view === 'faces') {
  ;(Object.values(LOOK) as Look[]).forEach((l, i) => {
    put(portrait(l), 20 + (i % 3) * 124, 30 + Math.floor(i / 3) * 130, 110)
    put(portrait(l), 20 + (i % 3) * 124, 300 + Math.floor(i / 3) * 60, 40)
  })
} else {
  const lv = Number(new URLSearchParams(location.search).get('lv') ?? 1)
  const ids: Kind[] = ['chuDien', 'tangKinhCac', 'danPhong', 'tangBaoCac', 'dienVoTruong', 'tuLinhTran', 'khoangMach', 'linhDien']
  const pos: [number, number][] = [[195, 120], [80, 250], [290, 250], [80, 400], [270, 400], [100, 560], [290, 560], [195, 720]]
  ids.forEach((id, i) => put(building(id, lv, '殿经丹库武阵矿田'[i]).art, ...pos[i]))
}
console.log('bake ms', (performance.now() - t0).toFixed(1))
