// Phòng thử art (chỉ bản dev): /lab.html — xem hình vẽ tay trên giấy. ?view=icons|faces|buildings (mặc định)
import {
  ITEMS, badgeSkin, bake, buttonSkin, cardSkin, dotsSkin, fieldSkin, fillSkin, grooveSkin, knobSkin, lacquerSkin, plankSkin, rodSkin, scrollSkin, switchSkin,
  tagSkin, toastSkin, trackSkin, type Skin, PIGMENT, BEAST_EMBLEMS, SECT_EMBLEMS, REALM_EMBLEMS, medal, emblemArt, type Emblem, type MedalTone, bamboo, battlefield, beast, blossom, building, butterfly, flyingSword, itemIcon, paper, portrait, soldier, splashTex, stairway, stoneLantern, vortexTex, type Asset, type Kind, type Look,
  PIGMENT as C, blot, boltTex, canvas, clawTex, glowTex, ring, ringTex, rng, slashTex, sparkTex, stroke, type G, type Pt } from '@rok/art'
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
} else if (view === 'appicon') {
  // icon ứng dụng: nền sơn mài vân gỗ tràn viền (an toàn cho icon maskable), huy hiệu tông môn vàng ở giữa
  const px = Number(new URLSearchParams(location.search).get('px') ?? 512)
  const ic = document.createElement('canvas')
  ic.width = ic.height = px
  ic.id = 'icon'
  const g = ic.getContext('2d')!
  const pk = plankSkin(px / 390, 7)
  g.drawImage(pk.cv as HTMLCanvasElement, 30 * (px / 390), 30 * (px / 390), 330 * (px / 390), 60 * (px / 390), 0, 0, px, px)
  const vg = g.createRadialGradient(px / 2, px * 0.42, px * 0.1, px / 2, px / 2, px * 0.72)
  vg.addColorStop(0, 'rgba(255,220,160,0.18)')
  vg.addColorStop(1, 'rgba(0,0,0,0.45)')
  g.fillStyle = vg
  g.fillRect(0, 0, px, px)
  const m = medal('crest', 'gold')
  const k = (px * 0.74) / m.w
  const b = bake(m, k)
  g.drawImage(b.canvas as HTMLCanvasElement, (px - m.w * k) / 2, (px - m.h * k) / 2)
  document.body.innerHTML = ''
  document.body.append(ic)
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
} else if (view === 'fx') {
  // VFX trận: texture hiện tại (gradient) ↔ vẽ bằng bút lông (cùng cách tô tint + add); bản bút có thêm lớp màu mực → khoáng → sáng
  put(battlefield(390, 640, 'wild'), 0, 0, 640)
  const label = (t: string, x: number, y: number, dark = false) => {
    out.font = `700 ${12 * S}px Alegreya, serif`
    out.lineWidth = 4 * S
    out.strokeStyle = dark ? '#1c1730' : PIGMENT.paper
    out.fillStyle = dark ? PIGMENT.silk : PIGMENT.ink
    out.strokeText(t, x * S, y * S)
    out.fillText(t, x * S, y * S)
  }
  type Src = HTMLCanvasElement | OffscreenCanvas
  // vẽ texture trắng tô màu `color` tâm (cx, cy) cỡ dw × dh — như Sprite.tint + blendMode trong Pixi
  const fx = (src: Src, cx: number, cy: number, dw: number, dh: number, color: string, add = true, alpha = 1, rot = 0) => {
    const t = canvas(src.width, src.height)
    const tg = t.getContext('2d') as G
    tg.drawImage(src as HTMLCanvasElement, 0, 0)
    tg.globalCompositeOperation = 'source-in'
    tg.fillStyle = color
    tg.fillRect(0, 0, t.width, t.height)
    out.save()
    out.globalCompositeOperation = add ? 'lighter' : 'source-over'
    out.globalAlpha = alpha
    out.translate(cx * S, cy * S)
    out.rotate(rot)
    out.drawImage(t as HTMLCanvasElement, (-dw * S) / 2, (-dh * S) / 2, dw * S, dh * S)
    out.restore()
  }
  // ba lớp: bóng mực (thường) → sắc khoáng (thường) → lõi sáng (add). make(k): k = hệ số bề ngang nét
  const layered = (make: (k: number) => Src, cx: number, cy: number, dw: number, dh: number, ink: string, pig: string, glow: string, rot = 0, a = 1) => {
    fx(make(1), cx, cy, dw, dh, ink, false, 0.9 * a, rot)
    fx(make(0.62), cx, cy, dw, dh, pig, false, a, rot)
    fx(make(0.3), cx, cy, dw, dh, glow, true, a, rot)
  }
  const X = [45, 120, 195, 272, 345]
  label('VFX trận: hiện tại ↔ bút lông   (?view=fx)', 10, 20)
  label('1. Hiện tại: gradient + tint + add', 10, 44)
  fx(slashTex(192, 96), X[0], 88, 70, 35, '#dff4ff')
  fx(clawTex(128), X[1], 88, 56, 56, C.silk)
  fx(ringTex(320, 96, 5), X[2], 88, 70, 21, C.goldL)
  fx(sparkTex(48), X[3], 88, 30, 30, C.goldL)
  fx(glowTex(128), X[4], 88, 60, 60, '#fff2c8')
  label('2. Bút lông: cùng tint + add', 10, 138)
  fx(bSlash(192, 96), X[0], 182, 70, 35, '#dff4ff')
  fx(bClaw(128), X[1], 182, 56, 56, C.silk)
  fx(bRing(320, 96), X[2], 182, 70, 21, C.goldL)
  fx(bSpark(48), X[3], 182, 30, 30, C.goldL)
  fx(bBurst(128), X[4], 182, 60, 60, '#fff2c8')
  label('3. Bút lông + lớp màu: mực → khoáng → sáng', 10, 232)
  layered(k => bSlash(192, 96, 1, 0.35, k), X[0], 276, 70, 35, C.indigo, C.azurite, C.spirit)
  layered(k => bClaw(128, 2, 0.4, k), X[1], 276, 56, 56, C.lacquer, C.cinnabar, '#ffd0c0')
  layered(k => bRing(320, 96, 3, k), X[2], 276, 70, 21, C.goldD, C.gold, C.goldL)
  layered(k => bSpark(48, 4, k), X[3], 276, 30, 30, C.goldD, C.gamboge, '#fff2c8')
  layered(k => bBurst(128, 5, 0.3, k), X[4], 276, 60, 60, C.ink, C.ochre, '#fff2c8')
  label('4. Cỡ thật trong trận: trên hiện tại, dưới bút lông', 10, 326)
  fx(slashTex(), X[0], 352, 34, 17, '#dff4ff', true, 1, -0.5)
  fx(clawTex(64), X[1], 352, 34, 34, C.silk)
  fx(ringTex(160, 48, 2.5), X[2], 352, 64, 20, C.goldL)
  fx(sparkTex(24), X[3], 352, 8, 8, C.goldL)
  fx(glowTex(64), X[4], 352, 46, 46, '#fff2c8')
  layered(k => bSlash(96, 48, 1, 0.35, k), X[0], 392, 34, 17, C.indigo, C.azurite, C.spirit, -0.5)
  layered(k => bClaw(64, 2, 0.4, k), X[1], 392, 34, 34, C.lacquer, C.cinnabar, '#ffd0c0')
  layered(k => bRing(160, 48, 3, k), X[2], 392, 64, 20, C.goldD, C.gold, C.goldL)
  layered(k => bSpark(24, 4, k), X[3], 392, 8, 8, C.goldD, C.gamboge, '#fff2c8')
  layered(k => bBurst(64, 5, 0.3, k), X[4], 392, 46, 46, C.ink, C.ochre, '#fff2c8')
  // Diễn biến: mỗi khung vẽ lại với độ khô tăng dần → đuôi nét tước sợi rồi tan (thay cho alpha mờ dần)
  label('5. Kiếm khí theo khung: nhỏ → BÙNG → giữ → khô tan', 10, 442)
  const beat = [
    { ms: 0, dry: 0.1, sc: 0.6, a: 0.9 }, { ms: 40, dry: 0.12, sc: 1.15, a: 1 }, { ms: 90, dry: 0.2, sc: 1, a: 1 },
    { ms: 170, dry: 0.5, sc: 1.03, a: 0.9 }, { ms: 260, dry: 0.75, sc: 1.06, a: 0.75 }, { ms: 400, dry: 0.93, sc: 1.1, a: 0.5 },
  ]
  beat.forEach((f, i) => {
    layered(k => bSlash(192, 96, 1, f.dry, k), 36 + i * 64, 486, 58 * f.sc, 29 * f.sc, C.indigo, C.azurite, C.spirit, 0, f.a)
    label(`${f.ms}ms`, 22 + i * 64, 520)
  })
  label('6. Mực văng khi trúng đòn, cùng nhịp', 10, 556)
  beat.forEach((f, i) => layered(k => bBurst(128, 5, f.dry, k * (0.7 + f.sc * 0.3)), 36 + i * 64, 598, 52 * f.sc, 52 * f.sc, C.ink, C.cinnabar, '#ffb4a4', 0, f.a))
  // nền tối (trời kiếp): add sáng rõ ở đây
  out.fillStyle = '#2a2540'
  out.fillRect(0, 640 * S, 390 * S, 204 * S)
  label('7. Nền tối (kiếp vân): trái hiện tại, phải bút lông', 10, 662, true)
  fx(boltTex(64, 256, 1), 40, 755, 24, 150, '#ffffff')
  fx(bBolt(64, 256, 1), 90, 755, 24, 150, '#ffffff')
  fx(ringTex(320, 96, 5), 200, 710, 110, 33, C.goldL)
  fx(bRing(320, 96), 200, 790, 110, 33, C.goldL)
  fx(glowTex(128), 320, 710, 60, 60, '#b9a4ff')
  fx(bBurst(128), 320, 790, 60, 60, '#b9a4ff')
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

// ---------- Nháp VFX vẽ bằng bút (?view=fx) — trắng, tô màu bằng tint như texture trong fx.ts ----------
// k: hệ số bề ngang nét (lớp lõi vẽ mảnh hơn trên cùng đường nét → mép mực, giữa sáng)
function surf(w: number, h: number) {
  const cv = canvas(w, h)
  return { cv, g: cv.getContext('2d') as G }
}
// Kiếm khí trăng khuyết: đầu (bên phải, hướng bay) tròn đậm, đuôi dài tước sợi
function bSlash(w: number, h: number, seed = 1, dry = 0.35, k = 1) {
  const { cv, g } = surf(w, h)
  const arc: Pt[] = [[w * 0.94, h * 0.55], [w * 0.8, h * 0.24], [w * 0.52, h * 0.12], [w * 0.24, h * 0.22], [w * 0.06, h * 0.44]]
  const press = (t: number) => (t < 0.14 ? 0.35 + 0.65 * Math.sin(((t / 0.14) * Math.PI) / 2) : (1 - (t - 0.14) / 0.86) ** 0.85)
  stroke(g, arc, { w: h * 0.36 * k, color: '#ffffff', alpha: 1, press, dry, ink: 0.3, rough: 0.4, seed })
  // nét phụ bám dưới (lực quét), khô hơn
  const low = arc.map(([x, y], i): Pt => [x - w * 0.03, y + h * (0.16 + i * 0.02)]).slice(0, 4)
  stroke(g, low, { w: h * 0.14 * k, color: '#ffffff', alpha: 0.8, press: 'nail', dry: Math.min(1, dry + 0.25), rough: 0.5, seed: seed + 7 })
  return cv
}
// Ba vết vuốt: nhọn hai đầu, khô dần về cuối
function bClaw(s: number, seed = 2, dry = 0.4, k = 1) {
  const { cv, g } = surf(s, s)
  ;[0.82, 1, 0.88].forEach((len, i) => {
    const o = (i - 1) * s * 0.2
    stroke(g, [[s * 0.24 + o, s * 0.1], [s * 0.6 + o, s * 0.46], [s * 0.52 + o, s * 0.1 + s * 0.82 * len]], { w: s * 0.13 * k, color: '#ffffff', alpha: 1, press: 'taper', dry, rough: 0.45, seed: seed + i })
  })
  return cv
}
// Sóng chấn: vòng mực một nét (圆相) ép dẹt thành elip, thêm vòng mảnh lệch pha
function bRing(w: number, h: number, seed = 3, k = 1) {
  const { cv, g } = surf(w, h)
  g.translate(w / 2, h / 2)
  g.scale(1, h / w)
  ring(g, 0, 0, w * 0.44, w * 0.05 * k, '#ffffff', seed, 1, 0.1)
  ring(g, 0, 0, w * 0.35, w * 0.02 * k, '#ffffff', seed + 5, 0.7, 0.4)
  return cv
}
// Tia sáng bốn cánh lệch nhau (không đối xứng tuyệt đối)
function bSpark(s: number, seed = 4, k = 1) {
  const { cv, g } = surf(s, s)
  const c = s / 2
  stroke(g, [[c - s * 0.02, s * 0.03], [c + s * 0.03, c], [c, s * 0.97]], { w: s * 0.22 * k, color: '#ffffff', alpha: 1, press: 'taper', rough: 0.3, seed })
  stroke(g, [[s * 0.1, c + s * 0.03], [c, c], [s * 0.86, c - s * 0.04]], { w: s * 0.16 * k, color: '#ffffff', alpha: 1, press: 'taper', rough: 0.3, seed: seed + 1 })
  blot(g, c, c, s * 0.09 * k, '#ffffff', 1, seed + 2, 0.9)
  return cv
}
// Trúng đòn: tâm loang + tia bút toả ra, dài ngắn không đều, đầu đậm ở tâm
function bBurst(s: number, seed = 5, dry = 0.3, k = 1) {
  const { cv, g } = surf(s, s)
  const c = s / 2, r = rng(seed)
  blot(g, c, c, s * 0.13 * k, '#ffffff', 1, seed, 0.85)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + (r() - 0.5) * 0.6, l = s * (0.2 + r() * 0.26)
    const bend = (r() - 0.5) * 0.3
    stroke(g, [[c + Math.cos(a) * s * 0.05, c + Math.sin(a) * s * 0.05], [c + Math.cos(a + bend) * l * 0.55, c + Math.sin(a + bend) * l * 0.55], [c + Math.cos(a) * l, c + Math.sin(a) * l]], {
      w: s * (0.05 + r() * 0.05) * k, color: '#ffffff', alpha: 1, press: 'nail', dry, rough: 0.45, seed: seed + i,
    })
  }
  return cv
}
// Sét: đường gãy (chèn điểm để spline không uốn tròn góc), đầu to đuôi nhỏ, quầng mực loang quanh
function bBolt(w: number, h: number, seed = 6) {
  const { cv, g } = surf(w, h)
  const r = rng(seed)
  const branch = (x: number, y: number, len: number, width: number, depth: number) => {
    const knots: Pt[] = [[x, y]]
    for (let i = 0; i < 9; i++) knots.push([Math.max(4, Math.min(w - 4, knots[i][0] + (r() - 0.5) * w * 0.3)), knots[i][1] + len / 9])
    const pts: Pt[] = []
    knots.forEach((p, i) => {
      const q = knots[i + 1]
      if (!q) return pts.push(p)
      for (let j = 0; j < 4; j++) pts.push([p[0] + ((q[0] - p[0]) * j) / 4, p[1] + ((q[1] - p[1]) * j) / 4])
    })
    stroke(g, pts, { w: width, color: '#ffffff', alpha: 1, press: 'nail', rough: 0.5, dry: 0.15, bleed: 1, wobble: 0, seed: seed + depth })
    if (depth < 1) for (let i = 2; i < 8; i += 3) if (r() < 0.7) branch(knots[i][0], knots[i][1], len * 0.3, width * 0.5, depth + 1)
  }
  branch(w / 2, 2, h - 6, w * 0.13, 0)
  return cv
}
