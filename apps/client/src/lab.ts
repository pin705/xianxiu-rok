// Phòng thử art (chỉ bản dev): /lab.html — xem hình vẽ tay trên giấy. ?view=icons|faces|troops|decor|chrome|medals|fx|battle|result|home|tiers|buildings (mặc định)
import {
  ITEMS,
  GEAR_ICONS,
  colorIcon,
  badgeSkin,
  bake,
  buttonSkin,
  cardSkin,
  dotsSkin,
  fieldSkin,
  fillSkin,
  grooveSkin,
  knobSkin,
  lacquerSkin,
  plankSkin,
  rodSkin,
  scrollSkin,
  switchSkin,
  tagSkin,
  toastSkin,
  trackSkin,
  type Skin,
  PIGMENT,
  BEAST_EMBLEMS,
  SECT_EMBLEMS,
  REALM_EMBLEMS,
  ELEMENT_EMBLEMS,
  medal,
  emblemArt,
  type Emblem,
  type MedalTone,
  bamboo,
  battlefield,
  beast,
  blossom,
  building,
  butterfly,
  flyingSword,
  itemIcon,
  paper,
  portrait,
  soldier,
  splashTex,
  stairway,
  stoneLantern,
  vortexTex,
  type Asset,
  type Kind,
  type Look,
  PIGMENT as C,
  boltTex,
  burstTex,
  canvas,
  clawTex,
  mix,
  orbTex,
  puffTex,
  ringTex,
  rng,
  slashTex,
  type G,
} from '@rok/art'
import type { Report, Skill } from '@rok/rules'
import type { Outcome } from './Result.svelte'
import { LOOK } from './lib'
import { Battle } from './world/battle'
import { cssPerDU, getApp } from './world/stage'

const W = 390,
  H = 844,
  S = 2
const cv = document.createElement('canvas')
cv.width = W * S
cv.height = H * S
cv.style.width = `${W}px`
document.body.append(cv)
const out = cv.getContext('2d')!
out.fillStyle = out.createPattern(paper(256) as HTMLCanvasElement, 'repeat')!
out.fillRect(0, 0, cv.width, cv.height)

// đặt asset: neo (0,0) của asset tại (x, y), cỡ hiện `px` theo cạnh dài (mặc định: 1 DU = 1 px)
const put = <M>(a: Asset<M>, x: number, y: number, px = Math.max(a.w, a.h)) => {
  const k = px ? px / Math.max(a.w, a.h) : 1
  const b = bake(a, k * S)
  out.drawImage(b.canvas as HTMLCanvasElement, (x + a.x * k) * S, (y + a.y * k) * S, a.w * k * S, a.h * k * S)
}
const view = new URLSearchParams(location.search).get('view') ?? 'buildings'
const KINDS: Kind[] = [
  'chuDien',
  'tangKinhCac',
  'danPhong',
  'tangBaoCac',
  'dienVoTruong',
  'tuLinhTran',
  'khoangMach',
  'linhDien',
  'luyenKhiPhong',
  'hoSonDaiTran',
]
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
  const panel = el(
    `position:relative;width:370px;height:190px;${bi(scrollSkin(S))};box-sizing:border-box;padding:6px`,
    '<b style="font-size:22px">Chủ điện</b><p>Nơi chưởng môn toạ thiền. Tầng Chủ điện là cảnh giới của bạn.</p>',
  )
  const rod = document.createElement('div')
  rod.style.cssText = `position:absolute;left:-30px;right:-30px;top:-32px;height:22px;box-sizing:border-box;${bi(rodSkin(S))}`
  panel.append(rod)
  for (const t of ['paper', 'glow', 'selected', 'lacquer', 'plain'] as const)
    el(
      `width:180px;height:64px;box-sizing:border-box;${bi(cardSkin(S, t))};padding:14px 16px;color:${t === 'lacquer' ? PIGMENT.silk : PIGMENT.ink}`,
      `Thẻ ${t}`,
    )
  el(
    `width:370px;height:64px;box-sizing:border-box;${bi(plankSkin(S))};color:${PIGMENT.silk};padding:20px 26px`,
    'Ván sơn mài HUD',
  )
  for (const t of ['primary', 'gold', 'danger', 'ghost', 'off'] as const) {
    const fg = t === 'gold' || t === 'ghost' ? PIGMENT.ink : t === 'off' ? PIGMENT.ink3 : PIGMENT.silk
    el(
      `width:${t === 'primary' ? 370 : 180}px;height:52px;box-sizing:border-box;${bi(buttonSkin(S, t))};color:${fg};display:grid;place-items:center;font-size:17px;font-weight:800`,
      `Nâng cấp`,
    )
  }
  el(
    `width:120px;height:40px;box-sizing:border-box;${bi(buttonSkin(S, 'gold', 9))};display:grid;place-items:center;font-weight:800`,
    'Nhận',
  )
  for (const t of ['plain', 'good', 'bad', 'gold', 'dark', 'red'] as const)
    el(
      `height:26px;box-sizing:border-box;${bi(tagSkin(S, t))};padding:0 10px;display:flex;align-items:center;font-size:12.5px;color:${t === 'dark' || t === 'red' ? PIGMENT.silk : PIGMENT.ink}`,
      t === 'red' ? 'Đầy' : '2.684',
    )
  el(
    `height:20px;min-width:20px;box-sizing:border-box;${bi(badgeSkin(S))};color:${PIGMENT.silk};font:800 11px/1 Alegreya;display:grid;place-items:center;padding:0 5px`,
    '3',
  )
  el(
    `height:20px;min-width:20px;box-sizing:border-box;${bi(badgeSkin(S, true))};font:800 11px/1 Alegreya;display:grid;place-items:center;padding:0 5px`,
    '!',
  )
  const m = el(`position:relative;width:200px;height:12px;box-sizing:border-box;${bi(trackSkin(S))}`)
  const f = document.createElement('div')
  f.style.cssText = `position:absolute;left:-6px;top:-5px;bottom:-5px;width:60%;box-sizing:border-box;${bi(fillSkin(S, PIGMENT.spirit))}`
  m.append(f)
  const m2 = el(
    `position:relative;width:150px;height:12px;box-sizing:border-box;${bi(trackSkin(S, true))};background:${PIGMENT.lacquer}`,
  )
  const f2 = document.createElement('div')
  f2.style.cssText = `position:absolute;left:-6px;top:-5px;bottom:-5px;width:35%;box-sizing:border-box;${bi(fillSkin(S, PIGMENT.gold))}`
  m2.append(f2)
  el(
    `width:80px;height:38px;box-sizing:border-box;${bi(fieldSkin(S))};display:grid;place-items:center;font-size:18px`,
    '12',
  )
  const gr = el(
    `width:370px;height:44px;box-sizing:border-box;${bi(grooveSkin(S))};display:grid;grid-template-columns:1fr 1fr;gap:3px;padding:0`,
  )
  gr.style.padding = '3px'
  gr.innerHTML = `<div style="${bi(buttonSkin(S, 'danger', 5))};box-sizing:border-box;display:grid;place-items:center;color:${PIGMENT.silk}">Tiếng Việt</div><div style="display:grid;place-items:center">English</div>`
  el(
    `height:30px;box-sizing:border-box;${bi(lacquerSkin(S))};color:${PIGMENT.silk};display:flex;align-items:center;padding:0 14px`,
    '⏱ 41:02',
  )
  el(
    `height:28px;box-sizing:border-box;${bi(lacquerSkin(S, 31, 'notch'))};color:${PIGMENT.silk};display:flex;align-items:center;padding:0 16px`,
    'Chủ điện',
  )
  el(
    `width:370px;height:46px;box-sizing:border-box;${bi(toastSkin(S))};color:${PIGMENT.silk};display:flex;align-items:center;padding:0 36px`,
    'Thắng · Hắc Phong Trại',
  )
  el(
    `width:370px;height:46px;box-sizing:border-box;${bi(toastSkin(S, true))};color:${PIGMENT.silk};display:flex;align-items:center;padding:0 36px`,
    'Không đủ tài nguyên',
  )
  el(
    `width:54px;height:30px;background:url(${url(switchSkin(S, false))}) 0 0/100% 100%;position:relative`,
    `<span style="position:absolute;left:2px;top:2px;width:26px;height:26px;background:url(${url(knobSkin(S))}) 0 0/100% 100%"></span>`,
  )
  el(
    `width:54px;height:30px;background:url(${url(switchSkin(S, true))}) 0 0/100% 100%;position:relative`,
    `<span style="position:absolute;right:2px;top:2px;width:26px;height:26px;background:url(${url(knobSkin(S))}) 0 0/100% 100%"></span>`,
  )
  el(
    `width:200px;height:20px;display:flex;align-items:baseline;gap:6px`,
    `Thể lực<span style="flex:1;height:6px;background:url(${url(dotsSkin(S))}) 0 0/12px 6px repeat-x"></span><b>+320</b>`,
  )
} else if (view === 'appicon') {
  // icon ứng dụng: nền sơn mài vân gỗ tràn viền (an toàn cho icon maskable), huy hiệu tông môn vàng ở giữa
  const px = Number(new URLSearchParams(location.search).get('px') ?? 512)
  const ic = document.createElement('canvas')
  ic.width = ic.height = px
  ic.id = 'icon'
  const g = ic.getContext('2d')!
  const pk = plankSkin(px / 390, 7)
  g.drawImage(
    pk.cv as HTMLCanvasElement,
    30 * (px / 390),
    30 * (px / 390),
    330 * (px / 390),
    60 * (px / 390),
    0,
    0,
    px,
    px,
  )
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
    ...Object.entries(ELEMENT_EMBLEMS).map(([el, e]) => [e, el] as [Emblem, MedalTone]),
    ['anvil', 'ink'],
    ['crest', 'pvp'],
    ['thunder', 'thunder'],
    ['sword', 'kiem'],
    ['orb', 'phap'],
    ['fist', 'the'],
    ['win', 'red'],
    ['lose', 'ink'],
    ['rebirth', 'gold'],
    ['lotus', 'jade'],
    ['crest', 'gold'],
    ['tick', 'gold'],
  ]
  list.forEach(([e, t], i) => put(medal(e, t), 34 + (i % 6) * 64, 36 + Math.floor(i / 6) * 64, 60))
  list.forEach(([e, t], i) => put(medal(e, t), 16 + (i % 12) * 30, 634 + Math.floor(i / 12) * 30, 26))
  ;(['win', 'lose', 'tick', 'crest', 'lotus'] as Emblem[]).forEach((e, i) => put(emblemArt(e), 40 + i * 76, 800, 56))
} else if (view === 'icons') {
  // vật phẩm + đan (hàng 1–2), pháp bảo (hàng 3–4), mỗi thứ bốn cỡ 56/32/22/16
  const rows = [ITEMS.slice(0, 6), ITEMS.slice(6), GEAR_ICONS.slice(0, 5), GEAR_ICONS.slice(5)]
  rows.forEach((names, r) =>
    names.forEach((n, i) =>
      [56, 32, 22, 16].forEach((px, k) => put(itemIcon(n), 36 + i * 64, 44 + r * 200 + [0, 60, 104, 140][k], px)),
    ),
  )
  // icon nhiều màu (actions.ts), góc dưới phải
  ;[56, 32, 22].forEach((px, k) => put(colorIcon('shield'), 290, [640, 700, 740][k], px))
} else if (view === 'troops') {
  put(battlefield(390, 844, 'wild'), 0, 0, 844)
  // hàng dưới: bậc 1–3 (một dáng) · bậc 4 · bậc 5; hàng trên: quân địch cùng thứ tự
  ;(['kiem', 'phap', 'the'] as const).forEach((t, i) => {
    ;[1, 4, 5].forEach((tier, j) => {
      put(soldier(t, false, tier), 40 + i * 38 + j * 124, 640, tier > 3 ? 64 : 52)
      put(soldier(t, true, tier), 40 + i * 38 + j * 124, 330, tier > 3 ? 64 : 52)
    })
    put(beast(t), 90 + i * 110, 450, 90)
  })
  put(flyingSword(), 340, 740, 40)
} else if (view === 'decor') {
  put(
    stairway(
      [
        [80, 420],
        [70, 360],
        [92, 300],
        [86, 240],
      ],
      16,
      3,
    ),
    0,
    0,
    0,
  )
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
  // Bảng VFX nét bút (fx.ts), ghép ba lớp như battle.ts: bóng mực → sắc khoáng → lõi sáng (cộng); mỗi cột một khung khô tan
  put(battlefield(390, 640, 'wild'), 0, 0, 640)
  out.fillStyle = '#2a2540'
  out.fillRect(0, 640 * S, 390 * S, 204 * S)
  type Src = HTMLCanvasElement | OffscreenCanvas
  const tinted = (src: Src, color: string) => {
    const t = canvas(src.width, src.height)
    const tg = t.getContext('2d') as G
    tg.drawImage(src as HTMLCanvasElement, 0, 0)
    tg.globalCompositeOperation = 'source-in'
    tg.fillStyle = color
    tg.fillRect(0, 0, t.width, t.height)
    return t as HTMLCanvasElement
  }
  const layered = (
    make: (dry: number, k: number) => Src,
    cx: number,
    cy: number,
    dw: number,
    dh: number,
    hue: readonly string[],
    dry: number,
  ) =>
    (
      [
        [1, 'source-over', 0.9],
        [0.62, 'source-over', 1],
        [0.3, 'lighter', 1],
      ] as const
    ).forEach(([k, op, a], i) => {
      out.globalCompositeOperation = op
      out.globalAlpha = a
      out.drawImage(tinted(make(dry, k), hue[i]), (cx - dw / 2) * S, (cy - dh / 2) * S, dw * S, dh * S)
      out.globalCompositeOperation = 'source-over'
      out.globalAlpha = 1
    })
  const label = (t: string, x: number, y: number, dark = false) => {
    out.font = `700 ${11 * S}px Alegreya, serif`
    out.lineWidth = 4 * S
    out.strokeStyle = dark ? '#1c1730' : PIGMENT.paper
    out.fillStyle = dark ? PIGMENT.silk : PIGMENT.ink
    out.strokeText(t, x * S, y * S)
    out.fillText(t, x * S, y * S)
  }
  const DRY = [0.12, 0.3, 0.55, 0.78, 0.95]
  const X = DRY.map((_, i) => 44 + i * 76)
  const rows: [string, (d: number, k: number) => Src, number, number, readonly string[]][] = [
    ['kiếm khí', (d, k) => slashTex(128, 64, 1, d, k), 64, 32, [C.indigo, C.azurite, C.spirit]],
    ['hoả cầu', (d, k) => orbTex(96, 64, 7, d, k), 60, 40, [C.cinnabar, '#f08a4a', C.gamboge]],
    ['vuốt', (d, k) => clawTex(96, 2, d, k), 54, 54, [C.lacquer, C.cinnabar, '#ffd0c0']],
    ['sóng chấn', (d, k) => ringTex(256, 80, 7, 3, d, k), 70, 22, [C.goldD, C.gold, C.goldL]],
    ['trúng đòn', (d, k) => burstTex(128, 5, d, k), 58, 58, [C.ink, C.ochre, '#fff2c8']],
  ]
  rows.forEach(([name, make, w, h, hue], r) => {
    const y = 40 + r * 92
    label(name, 8, y - 18)
    X.forEach((x, i) => layered(make, x, y + 20, w, h, hue, DRY[i]))
  })
  label('khói · bụi · mực tan (puffTex)', 8, 506)
  ;[C.ink, mix(C.paper2, C.ochre, 0.35), '#6a4a9a', C.silk].forEach((c, i) =>
    out.drawImage(tinted(puffTex(64, 5 + i), c), (20 + i * 90) * S, 520 * S, 70 * S, 70 * S),
  )
  label('sét (nền tối)', 8, 662, true)
  ;[1, 2, 3].forEach((n, i) =>
    layered((_, k) => boltTex(160, 640, n, k), 40 + i * 62, 752, 44, 176, ['#7a5cff', '#cbb8ff', '#ffffff'], 0),
  )
  label('vòng chọn / trận văn', 230, 662, true)
  out.globalCompositeOperation = 'lighter'
  out.drawImage(tinted(ringTex(160, 48, 2.5), C.goldL), 220 * S, 690 * S, 150 * S, 40 * S)
  out.drawImage(tinted(ringTex(160, 48, 2.5), C.spirit), 220 * S, 750 * S, 150 * S, 50 * S)
  out.globalCompositeOperation = 'source-over'
} else if (view === 'battle') {
  // Trận thật trên WebGL, đứng hình ở giây t của lượt 1: &kind=sect|beast|trib|realm &t=0.4 &skill=burst|shield|heal|weaken &seed=1
  cv.remove()
  const q = new URLSearchParams(location.search)
  Math.random = rng(Number(q.get('seed') ?? 1))
  const kind = (q.get('kind') ?? 'sect') as Report['kind']
  const sk = q.get('skill')
  const troops = (['kiem', 'phap', 'the'] as const).map(type => ({ type, tier: 1, n: 30 }))
  const report = {
    id: 0,
    at: 0,
    kind,
    i: 0,
    win: true,
    hurt: {},
    dead: {},
    gain: {},
    fights: [
      {
        a: { level: 1, troops },
        b: { level: 1, troops },
        rounds: [
          {
            n: [
              [27, 26, 28],
              [24, 25, 23],
            ],
            cast: [!!sk, false],
          },
        ],
      },
    ],
  } as unknown as Report
  getApp().then(app => {
    document.body.append(app.canvas)
    app.ticker.stop()
    const k = cssPerDU()
    const b = new Battle(
      report,
      [sk ? ({ kind: sk, v: 0.3 } as unknown as Skill) : undefined, undefined],
      innerWidth / k,
      innerHeight / k,
    )
    b.root.scale.set(k)
    app.stage.addChild(b.root)
    b.round(0, 1, 0.85)
    const T = Number(q.get('t') ?? 0.4)
    for (let t = 0; t < T; t += 1 / 120) b.tick(1 / 120)
    app.render()
    document.title = 'ready'
  })
} else if (view === 'home') {
  // Cảnh núi thật trên WebGL, mọi công trình ở tầng &lv= (mặc định 1), đứng hình; &phase=day|dawn|dusk|night
  cv.remove()
  const q = new URLSearchParams(location.search)
  const lv = Number(q.get('lv') ?? 1)
  Promise.all([getApp(), import('./world/home'), import('@rok/rules')]).then(([app, H, rules]) => {
    document.body.append(app.canvas)
    app.ticker.stop()
    const game = rules.newGame(0)
    for (const id of rules.IDS) game.levels[id] = lv
    const home = new H.Home({ still: true })
    home.root.scale.set(cssPerDU())
    app.stage.addChild(home.root)
    home.set({ game, selected: null, storm: 0, phase: (q.get('phase') ?? 'day') as 'day' })
    home.tick(0.5, 0)
    app.render()
    document.title = 'ready'
  })
} else if (view === 'world') {
  // Bản đồ giới thật trên WebGL với ảnh chụp giả: &seed= (mặc định 7), &z= độ phóng (px CSS mỗi DU), &x=&y= tâm (ô)
  cv.remove()
  const q = new URLSearchParams(location.search)
  const seed = Number(q.get('seed') ?? 7)
  Promise.all([getApp(), import('./world/worldmap'), import('@rok/rules/world')]).then(async ([app, W, R]) => {
    document.body.append(app.canvas)
    const a = R.atlas(seed)
    const taken: { x: number; y: number }[] = []
    let k = 1
    const rand = () => (k = (Math.imul(k, 1103515245) + 12345) >>> 0) / 4294967296
    for (let i = 0; i < 120; i++) taken.push(R.spawn(a, taken, rand)!)
    const seats = taken.map((p, i) => ({
      pid: i + 1,
      name: `Tông ${i + 1}`,
      x: p.x,
      y: p.y,
      hall: 5 + (i % 15),
      power: 5000 + i * 300,
      npc: i % 4 === 0,
      shield: i % 7 === 0,
      ...(i % 5 === 1 && { cloud: 1_000_000 + 300_000 }),
    })) // vài tông môn đang độ kiếp
    const vein = a.points.find(p => p.kind === 'vein')!
    const now = 1_000_000
    const marches = [0, 1, 2].map(i => {
      const r = R.route(a, taken[i], i === 2 ? vein : taken[i + 3], 3)!
      return { pid: i + 1, id: i + 1, path: r.path, startAt: now - 60_000, arriveAt: now + 120_000, returnAt: 0 }
    })
    const scene = new W.WorldScene(seed)
    app.stage.addChild(scene.root)
    scene.setData(
      { seats, marches, chron: [], spots: [{ i: vein.i, own: '[VK] Vạn Kiếm', n: 2 }] },
      pid => (pid === 1 ? 'me' : pid === 2 ? 'ally' : seats[pid - 1].npc ? 'npc' : 'other'),
      1,
      now,
    )
    const z = Number(q.get('z') ?? 0.16)
    const cx = (Number(q.get('x') ?? 75) + 0.5) * 16,
      cy = (Number(q.get('y') ?? 75) + 0.5) * 16
    // chờ worker nướng xong ảnh tổng quan (và mảnh nét nếu phóng to) rồi vẽ
    const t0 = performance.now()
    await Promise.race([scene.ready, new Promise(r => setTimeout(r, 30_000))])
    console.log('overview ms', Math.round(performance.now() - t0))
    for (let t = 0; t < 40; t++) {
      scene.tick({ x: cx, y: cy, z }, innerWidth / 2, innerHeight / 2, now)
      await new Promise(r => setTimeout(r, 150))
    }
    app.render()
    document.title = 'ready'
  })
} else if (view === 'result') {
  // Màn Kết quả (đột phá / thất bại / luân hồi) với theme thật: &kind=win|fail|rebirth
  cv.remove()
  const kind = new URLSearchParams(location.search).get('kind') ?? 'win'
  Promise.all([
    import('./fonts.css'),
    import('./ui/theme.css'),
    import('./ui/theme'),
    import('svelte'),
    import('./Result.svelte'),
    import('@rok/rules'),
  ]).then(async ([, , th, sv, R, rules]) => {
    await th.applyTheme()
    const report = {
      id: 1,
      at: 0,
      kind: 'trib',
      i: 0,
      win: kind === 'win',
      fights: [],
      hurt: {},
      dead: {},
      gain: { res: {}, items: {}, exp: 0 },
    } as unknown as Report
    const outcome: Outcome = kind === 'rebirth' ? { kind: 'rebirth', n: 1 } : { kind: 'trib', report }
    const host = document.createElement('div')
    document.body.append(host)
    sv.mount(R.default, {
      target: host,
      props: { outcome, onclose: () => {}, onreplay: () => {} },
      context: new Map([
        ['rok.game', { game: rules.newGame(Date.now()), now: Date.now(), act: () => null, busy: false }],
      ]),
    })
    setTimeout(() => (document.title = 'ready'), 900)
  })
} else if (view === 'faces') {
  ;(Object.values(LOOK) as Look[]).forEach((l, i) => {
    put(portrait(l), 20 + (i % 3) * 124, 30 + Math.floor(i / 3) * 130, 110)
    put(portrait(l), 20 + (i % 6) * 60, 570 + Math.floor(i / 6) * 60, 40)
  })
} else if (view === 'tiers') {
  // Một công trình qua 5 bậc (&id=, mặc định Chủ điện), mỗi bậc một hàng, cỡ thật; &id=all: lưới mọi công trình × bậc, thu nhỏ
  const id = (new URLSearchParams(location.search).get('id') ?? 'chuDien') as Kind | 'all'
  if (id === 'all')
    KINDS.forEach((k, r) =>
      [1, 6, 11, 16, 21].forEach((lv, c) => put(building(k, lv).art, 39 + c * 78, 76 + r * 83, 74)),
    )
  else [1, 6, 11, 16, 21].forEach((lv, i) => put(building(id, lv).art, 195, 130 + i * 160))
} else {
  const lv = Number(new URLSearchParams(location.search).get('lv') ?? 1)
  const pos: [number, number][] = [
    [195, 110],
    [80, 235],
    [290, 235],
    [80, 370],
    [270, 370],
    [100, 500],
    [290, 500],
    [100, 640],
    [290, 640],
    [195, 800],
  ]
  KINDS.forEach((id, i) => put(building(id, lv).art, ...pos[i]))
}
console.log('bake ms', (performance.now() - t0).toFixed(1))
