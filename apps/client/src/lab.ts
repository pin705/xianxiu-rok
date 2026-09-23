// Phòng thử art (chỉ bản dev): /lab.html — xem hình vẽ tay trên giấy. ?view=icons|faces|buildings (mặc định)
import {
  ITEMS, badgeSkin, bake, buttonSkin, cardSkin, dotsSkin, fieldSkin, fillSkin, grooveSkin, knobSkin, lacquerSkin, plankSkin, rodSkin, scrollSkin, switchSkin,
  tagSkin, toastSkin, trackSkin, type Skin, PIGMENT, BEAST_EMBLEMS, SECT_EMBLEMS, REALM_EMBLEMS, medal, emblemArt, type Emblem, type MedalTone, bamboo, battlefield, beast, blossom, building, butterfly, flyingSword, itemIcon, paper, portrait, soldier, splashTex, stairway, stoneLantern, vortexTex, type Asset, type Kind, type Look } from '@rok/art'
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
const view = new URLSearchParams(location.search).get('view') ?? 'buildings'
const t0 = performance.now()
if (view === 'chrome') {
  // da giao diện ghép thật bằng border-image (xem giãn 9 mảnh có lộ không)
  const url = (sk: Skin) => (sk.cv as HTMLCanvasElement).toDataURL()
  const bi = (sk: Skin) => {
    const [t, r, b, l] = sk.slice
    return `border-style:solid;border-width:0;border-image:url(${url(sk)}) ${t * S} ${r * S} ${b * S} ${l * S} fill / ${t}px ${r}px ${b}px ${l}px / ${sk.outset ?? 0}px stretch`
  }
  const root = document.createElement('div')
  root.style.cssText = `position:absolute;inset:0;padding:10px;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start;font:600 14px Alegreya, serif;color:${PIGMENT.ink}`
  document.body.append(root)
  const el = (css: string, html = '') => {
    const d = document.createElement('div')
    d.style.cssText = css
    d.innerHTML = html
    root.append(d)
    return d
  }
  const panel = el(`position:relative;width:370px;height:190px;${bi(scrollSkin(S))};box-sizing:border-box;padding:6px`, '<b style="font-size:22px">Chủ điện</b><p>Nơi chưởng môn toạ thiền. Tầng Chủ điện là cảnh giới của bạn.</p>')
  const rod = document.createElement('div')
  rod.style.cssText = `position:absolute;left:-30px;right:-30px;top:-32px;height:22px;box-sizing:border-box;${bi(rodSkin(S))}`
  panel.append(rod)
  for (const t of ['paper', 'glow', 'selected', 'lacquer', 'plain'] as const)
    el(`width:180px;height:64px;box-sizing:border-box;${bi(cardSkin(S, t))};padding:14px 16px;color:${t === 'lacquer' ? PIGMENT.silk : PIGMENT.ink}`, `Thẻ ${t}`)
  el(`width:370px;height:64px;box-sizing:border-box;${bi(plankSkin(S))};color:${PIGMENT.silk};padding:20px 26px`, 'Ván sơn mài HUD')
  for (const t of ['primary', 'gold', 'danger', 'ghost', 'off'] as const) {
    const fg = t === 'gold' || t === 'ghost' ? PIGMENT.ink : t === 'off' ? PIGMENT.ink3 : PIGMENT.silk
    el(`width:${t === 'primary' ? 370 : 180}px;height:52px;box-sizing:border-box;${bi(buttonSkin(S, t))};color:${fg};display:grid;place-items:center;font-size:17px;font-weight:800`, `Nâng cấp`)
  }
  el(`width:120px;height:40px;box-sizing:border-box;${bi(buttonSkin(S, 'gold', 9))};display:grid;place-items:center;font-weight:800`, 'Nhận')
  for (const t of ['plain', 'good', 'bad', 'gold', 'dark', 'red'] as const)
    el(`height:26px;box-sizing:border-box;${bi(tagSkin(S, t))};padding:0 10px;display:flex;align-items:center;font-size:12.5px;color:${t === 'dark' || t === 'red' ? PIGMENT.silk : PIGMENT.ink}`, t === 'red' ? 'Đầy' : '2.684')
  el(`height:20px;min-width:20px;box-sizing:border-box;${bi(badgeSkin(S))};color:${PIGMENT.silk};font:800 11px/1 Alegreya;display:grid;place-items:center;padding:0 5px`, '3')
  el(`height:20px;min-width:20px;box-sizing:border-box;${bi(badgeSkin(S, true))};font:800 11px/1 Alegreya;display:grid;place-items:center;padding:0 5px`, '!')
  const m = el(`position:relative;width:200px;height:12px;box-sizing:border-box;${bi(trackSkin(S))}`)
  const f = document.createElement('div')
  f.style.cssText = `position:absolute;left:-6px;top:-5px;bottom:-5px;width:60%;box-sizing:border-box;${bi(fillSkin(S, PIGMENT.spirit))}`
  m.append(f)
  const m2 = el(`position:relative;width:150px;height:12px;box-sizing:border-box;${bi(trackSkin(S, true))};background:${PIGMENT.lacquer}`)
  const f2 = document.createElement('div')
  f2.style.cssText = `position:absolute;left:-6px;top:-5px;bottom:-5px;width:35%;box-sizing:border-box;${bi(fillSkin(S, PIGMENT.gold))}`
  m2.append(f2)
  el(`width:80px;height:38px;box-sizing:border-box;${bi(fieldSkin(S))};display:grid;place-items:center;font-size:18px`, '12')
  const gr = el(`width:370px;height:44px;box-sizing:border-box;${bi(grooveSkin(S))};display:grid;grid-template-columns:1fr 1fr;gap:3px;padding:0`)
  gr.style.padding = '3px'
  gr.innerHTML = `<div style="${bi(buttonSkin(S, 'danger', 5))};box-sizing:border-box;display:grid;place-items:center;color:${PIGMENT.silk}">Tiếng Việt</div><div style="display:grid;place-items:center">English</div>`
  el(`height:30px;box-sizing:border-box;${bi(lacquerSkin(S))};color:${PIGMENT.silk};display:flex;align-items:center;padding:0 14px`, '⏱ 41:02')
  el(`height:28px;box-sizing:border-box;${bi(lacquerSkin(S, 31, 'notch'))};color:${PIGMENT.silk};display:flex;align-items:center;padding:0 16px`, 'Chủ điện')
  el(`width:370px;height:46px;box-sizing:border-box;${bi(toastSkin(S))};color:${PIGMENT.silk};display:flex;align-items:center;padding:0 36px`, 'Thắng · Hắc Phong Trại')
  el(`width:370px;height:46px;box-sizing:border-box;${bi(toastSkin(S, true))};color:${PIGMENT.silk};display:flex;align-items:center;padding:0 36px`, 'Không đủ tài nguyên')
  el(`width:54px;height:30px;background:url(${url(switchSkin(S, false))}) 0 0/100% 100%;position:relative`, `<span style="position:absolute;left:2px;top:2px;width:26px;height:26px;background:url(${url(knobSkin(S))}) 0 0/100% 100%"></span>`)
  el(`width:54px;height:30px;background:url(${url(switchSkin(S, true))}) 0 0/100% 100%;position:relative`, `<span style="position:absolute;right:2px;top:2px;width:26px;height:26px;background:url(${url(knobSkin(S))}) 0 0/100% 100%"></span>`)
  el(`width:200px;height:20px;display:flex;align-items:baseline;gap:6px`, `Thể lực<span style="flex:1;height:6px;background:url(${url(dotsSkin(S))}) 0 0/12px 6px repeat-x"></span><b>+320</b>`)
} else if (view === 'medals') {
  const list: [Emblem, MedalTone][] = [
    ...BEAST_EMBLEMS.map(e => [e, 'beast'] as [Emblem, MedalTone]),
    ...SECT_EMBLEMS.map(e => [e, 'sect'] as [Emblem, MedalTone]),
    ...REALM_EMBLEMS.map(e => [e, 'realm'] as [Emblem, MedalTone]),
    ['thunder', 'thunder'], ['sword', 'kiem'], ['orb', 'phap'], ['fist', 'the'], ['win', 'red'], ['lose', 'ink'], ['rebirth', 'gold'], ['lotus', 'jade'], ['crest', 'gold'], ['tick', 'gold'],
  ]
  list.forEach(([e, t], i) => put(medal(e, t), 40 + (i % 5) * 78, 44 + Math.floor(i / 5) * 78, 70))
  list.forEach(([e, t], i) => put(medal(e, t), 20 + (i % 10) * 37, 620 + Math.floor(i / 10) * 38, 32))
  ;(['win', 'lose', 'tick', 'crest', 'lotus'] as Emblem[]).forEach((e, i) => put(emblemArt(e), 40 + i * 76, 790, 64))
} else if (view === 'icons') {
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
  ids.forEach((id, i) => put(building(id, lv).art, ...pos[i]))
}
console.log('bake ms', (performance.now() - t0).toFixed(1))
