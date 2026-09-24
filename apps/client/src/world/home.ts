// Cảnh núi tông môn trên WebGL. Hình tĩnh vẽ tay nướng thành texture một lần; mọi chuyển động
// (sương trôi, thác chảy, hạc bay, khói, lửa, linh khí, đèn đêm) do GPU diễn mỗi khung hình.
import { Container, Graphics, Sprite, TilingSprite, type Texture } from 'pixi.js'
import {
  PIGMENT as C,
  bamboo,
  beamTex,
  bird,
  blossom,
  boltTex,
  building,
  burstTex,
  butterfly,
  cloud,
  crane,
  disciple,
  fallTex,
  farRange,
  flag,
  glowTex,
  ledge,
  mistTex,
  mix,
  moon,
  orbTex,
  paper,
  pearl,
  itemIcon,
  peak,
  petalTex,
  pine,
  plot,
  puffTex,
  rainTex,
  rayTex,
  ringTex,
  rng,
  rock,
  scaffold,
  sparkTex,
  stairway,
  stoneLantern,
  sun,
  tierOf,
  vortexTex,
  type Fx,
  type Kind,
  type Pt,
} from '@rok/art'
import { BUILDINGS, IDS, storage, type BuildingId, type State } from '@rok/rules'
import { DECOR, HOME, LEDGES, MISTS, PINES, SLOT, STAIRS } from './layout'
import { DRY, back, ink, last, painted, texOf, type Hue, type Painted } from './stage'

export type Phase = 'dawn' | 'day' | 'dusk' | 'night'
export type HomeView = {
  game: State
  selected: BuildingId | null
  storm: number // độ kiếp: số đợt sét sẽ đánh (0 = trời yên)
  phase: Phase
}

const hex = (c: string) => parseInt(c.slice(1), 16)
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const sprite = (p: Painted, x = 0, y = 0) => {
  const s = new Sprite(p.tex)
  s.anchor.set(p.anchor[0], p.anchor[1])
  s.scale.set(1 / p.scale)
  s.position.set(x, y)
  return s
}
const soft = (tex: Texture, color: string, size: number, alpha = 1) => {
  const s = new Sprite(tex)
  s.anchor.set(0.5)
  s.width = s.height = size
  s.tint = hex(color)
  s.alpha = alpha
  s.blendMode = 'add'
  return s
}
// Trộn hai màu 0xRRGGBB
const lerpC = (a: number, b: number, k: number) => {
  const ch = (s: number) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * k)
  return (ch(16) << 16) | (ch(8) << 8) | ch(0)
}

const THUNDER: Hue = ['#7a5cff', '#cbb8ff', '#ffffff']
const FIRE: Hue = [C.cinnabar, '#f08a4a', C.gamboge]
const GOLD: Hue = [C.goldD, C.gold, C.goldL]

// Bầu trời là giấy; trên đó quệt một lớp màu theo giờ
const SKY: Record<Phase | 'storm', [string, number, string, number]> = {
  day: [C.azuriteL, 0.55, C.paper, 0],
  dawn: ['#e3a98a', 0.6, '#f2dcc8', 0.2],
  dusk: ['#c9765a', 0.7, '#ecc9a8', 0.35],
  night: ['#0e1a2c', 0.97, '#26344e', 0.92],
  storm: ['#150f26', 0.98, '#342c4a', 0.95],
}
// Nhuộm cả cảnh (nhân màu) và độ sáng đèn theo giờ
const MOOD: Record<Phase | 'storm', { tint: number; lights: number; stars: number; sun: number; moon: number }> = {
  day: { tint: 0xffffff, lights: 0, stars: 0, sun: 1, moon: 0 },
  dawn: { tint: 0xf8e6da, lights: 0.15, stars: 0, sun: 0.9, moon: 0 },
  dusk: { tint: 0xf0cfb8, lights: 0.55, stars: 0.1, sun: 0.8, moon: 0 },
  night: { tint: 0x7482a3, lights: 1, stars: 1, sun: 0, moon: 1 },
  storm: { tint: 0x5f5878, lights: 0.8, stars: 0, sun: 0, moon: 0 },
}

function skyTex(p: Phase | 'storm') {
  return texOf(`sky:${p}`, () => {
    const [top, ta, bot, ba] = SKY[p]
    const cv = document.createElement('canvas')
    cv.width = 4
    cv.height = 256
    const g = cv.getContext('2d')!
    const gr = g.createLinearGradient(0, 0, 0, 256)
    const rgb = (c: string, a: number) => `rgba(${hex(c) >> 16},${(hex(c) >> 8) & 255},${hex(c) & 255},${a})`
    gr.addColorStop(0, rgb(top, ta))
    gr.addColorStop(0.55, rgb(bot, ba))
    gr.addColorStop(1, rgb(bot, ba * 0.6))
    g.fillStyle = gr
    g.fillRect(0, 0, 4, 256)
    return cv
  })
}

type Anim = (t: number, dt: number) => void
const MAKERS = IDS.filter(id => BUILDINGS[id].makes)
// Hiệu ứng thoáng qua (pháo hoa, sét…): tự huỷ sau dur giây
type Play = { t0: number; dur: number; c: Container; step: (e: number) => void }

type Slot = {
  root: Container
  body?: Sprite
  key: string
  fx: Container // hiệu ứng động của công trình
  glow: Container // đèn, linh khí của công trình (lớp cộng sáng)
  anims: Anim[]
  lights: Sprite[]
  top: number
}

export class Home {
  readonly root = new Container()
  private world = new Container() // giấy nền (nhuộm theo giờ)
  private land: Container // núi, công trình… (nhuộm theo giờ, nằm trên lớp trời)
  private glow = new Container() // đèn + linh khí (cộng sáng, không nhuộm màu theo giờ)
  private far: Container[] = []
  private sky = new Sprite()
  private stormSky = new Sprite()
  private sun: Container
  private moon: Container
  private stars = new Container()
  private slots = new Map<BuildingId, Slot>()
  private bLayer = new Container()
  private aura = new Container() // sau công trình: tia vàng lúc lên tầng (背光)
  private ring: Sprite
  private scene = new Container() // mọi thứ rung khi sét đánh
  private vortex = new Container() // xoáy kiếp vân: sau núi, không nhuộm theo giờ
  private stormFx = new Container() // sét: trước công trình
  private rain: TilingSprite[] = []
  private flash = new Graphics()
  private flashA = 0
  private shakeA = 0
  private plays: Play[] = []
  private lamps: Sprite[] = []
  private fair: Container[] = [] // mây lành, hạc: tan khi trời kiếp
  private day: Container[] = [] // tia nắng, bướm: chỉ ban ngày, trời yên
  private night: Container[] = [] // đom đóm: chỉ khi tối
  private dust = new Container() // bụi dưới chân công trình (nhuộm theo giờ)
  private over = new Container() // vật phẩm bay lên (không nhuộm)
  private picked: BuildingId | null = null
  private makeAt = 3
  private maker = 0
  private anims: Anim[] = []
  private t = 0 // đồng hồ cảnh (đứng yên khi giảm chuyển động)
  private rt = 0 // đồng hồ thật, cho hiệu ứng thoáng qua
  private mood = MOOD.day
  private stormK = 0 // 0 trời yên … 1 kiếp vân phủ kín
  private cloud = false
  private storm = { n: 0, at: 0, struck: 0, eye: [0, 0] as Pt, flare: 0 }
  private lightsLevel = 0
  private view?: HomeView
  private still: boolean
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  constructor(opts: { still?: boolean } = {}) {
    this.still = !!opts.still
    const glowT = texOf('glow', () => glowTex(64))
    const sparkT = texOf('spark', () => sparkTex(24))

    // Giấy + trời (rộng ra hai bên cho màn hình ngang)
    const pap = new TilingSprite({ texture: texOf('paper', () => paper(256)), width: 3000, height: HOME.h + 800 })
    pap.position.set(-1300, -400)
    pap.tileScale.set(0.5)
    this.world.addChild(pap)
    this.sky.position.set(-1300, -400)
    this.sky.width = 3000
    this.sky.height = HOME.h + 800
    this.stormSky.texture = skyTex('storm')
    this.stormSky.position.set(-1300, -400)
    this.stormSky.width = 3000
    this.stormSky.height = HOME.h + 800
    this.stormSky.alpha = 0
    this.root.addChild(this.world, this.sky, this.stormSky)
    // mặt trời son, trăng trắng chì: đĩa vẽ tay, quầng sáng mờ phía sau
    const disc = (p: Painted, halo: string, hs: number, x: number, y: number) => {
      const c = new Container()
      c.addChild(soft(glowT, halo, hs, 0.4), sprite(p))
      c.position.set(x, y)
      return c
    }
    // cùng một khoảng trời trống giữa thẻ nhiệm vụ và nút cuộn sổ (mặt trời và trăng không hiện cùng lúc)
    this.sun = disc(
      painted('sun', () => sun(21)),
      '#f7cf9a',
      120,
      296,
      152,
    )
    this.moon = disc(
      painted('moon', () => moon(19)),
      '#f2efe2',
      110,
      298,
      150,
    )
    this.root.addChild(this.sun, this.moon, this.stars)
    this.land = new Container()
    this.scene.addChild(this.land)
    this.vortex.visible = false
    this.root.addChild(this.vortex, this.scene)
    for (let i = 0; i < 36; i++) {
      const s = soft(sparkT, '#ffffff', 3 + (i % 3) * 2, 0.8)
      s.position.set(((i * 97) % 440) - 20, 20 + ((i * 53) % 300))
      this.stars.addChild(s)
      this.anims.push(t => (s.alpha = 0.5 + 0.5 * Math.sin(t * 1.3 + i)))
    }

    // Núi xa: hai lớp mực nhạt, trôi chậm hơn khi cuộn (thị sai)
    // rộng -1100…1500 DU: desktop (cảnh phóng 1,5×, dịch trái khi ngăn kéo mở) trên màn 2560 px vẫn không lộ mép cắt
    const far1 = sprite(
      painted('far1', () => farRange(2600, 150, 21, C.azuriteL, 0.55), 1),
      -1100,
      330,
    )
    const far2 = sprite(
      painted('far2', () => farRange(2600, 120, 22, mix(C.azurite, C.indigo, 0.5), 0.5), 1),
      -1100,
      410,
    )
    for (const f of [far1, far2]) {
      const c = new Container()
      c.addChild(f)
      this.far.push(c)
      this.land.addChild(c)
    }
    // Mây tường vân trên trời
    for (const [x, y, w, seed, sp] of [
      [70, 230, 96, 1, 6],
      [330, 280, 76, 4, -5],
      [210, 170, 60, 9, 4],
    ] as const) {
      const c = sprite(
        painted(`cloud:${w}:${seed}`, () => cloud(w, seed)),
        x,
        y,
      )
      this.land.addChild(c)
      this.fair.push(c)
      this.anims.push(t => (c.x = x + Math.sin(t / 18 + seed) * 16 + sp * Math.sin(t / 40)))
    }
    // Hạc bay ngang trời
    const flock = new Container()
    const wings = [painted('crane:up', () => crane(true)), painted('crane:down', () => crane(false))]
    const birds = [
      [0, 0, 1],
      [30, 12, 0.78],
    ].map(([dx, dy, s], i) => {
      const b = sprite(wings[0], dx, dy)
      b.scale.set(s / wings[0].scale)
      flock.addChild(b)
      return { b, i }
    })
    this.land.addChild(flock)
    this.fair.push(flock)
    this.anims.push(t => {
      const k = (t % 34) / 34
      flock.position.set(470 - k * 560, 170 - k * 50 + Math.sin(t * 0.8) * 4)
      for (const { b, i } of birds) b.texture = wings[Math.floor(t * 2.2 + i * 0.5) % 2].tex
    })

    // Núi chính sau Chủ điện + sương lưng chừng
    this.land.addChild(
      sprite(
        painted('peak:l', () => peak(220, 130, 33, -0.1)),
        96,
        400,
      ),
    )
    this.land.addChild(
      sprite(
        painted('peak:r', () => peak(230, 150, 35, 0.12)),
        318,
        404,
      ),
    )
    this.land.addChild(
      sprite(
        painted('peak:main', () => peak(300, 190, 31, 0.03)),
        205,
        396,
      ),
    )
    this.mist(262, 70, 3, 0.85)

    // Các tầng núi, xen sương; vách thác ở phải
    const byLedge = (i: number) => {
      const [x, y, w, h, seed] = LEDGES[i]
      this.land.addChild(
        sprite(
          painted(`ledge:${i}`, () => ledge(w, h, seed)),
          x,
          y,
        ),
      )
      for (const [px, py, s, ps] of PINES)
        if (Math.abs(py - y) < 8)
          this.land.addChild(
            sprite(
              painted(`pine:${ps}`, () => pine(s, ps)),
              px,
              py,
            ),
          )
      for (const [path, sw, after] of STAIRS)
        if (after === i) {
          this.land.addChild(sprite(painted(`stair:${path[0]}`, () => stairway(path, sw, i + 1))))
          if (i !== 2) this.walker(path, i)
        }
    }
    byLedge(0)
    this.mist(...MISTS[0])
    byLedge(1)
    byLedge(2)
    this.land.addChild(
      sprite(
        painted('peak:cliff', () => peak(250, 250, 37, 0.3)),
        372,
        730,
      ),
    )
    // thác nước đổ từ dưới Đan phòng
    const fall = new TilingSprite({ texture: texOf('fall', () => fallTex()), width: 16, height: 150 })
    fall.position.set(368, 448)
    fall.alpha = 0.9
    this.land.addChild(fall)
    this.anims.push((_, dt) => (fall.tilePosition.y += dt * 70))
    const spray = soft(glowT, '#ffffff', 50, 0.5)
    spray.blendMode = 'normal'
    spray.position.set(376, 598)
    spray.scale.y *= 0.4
    this.land.addChild(spray)
    this.anims.push(t => (spray.alpha = 0.45 + 0.2 * Math.sin(t * 2.6)))
    this.mist(...MISTS[1])
    byLedge(3)
    this.mist(...MISTS[2])
    byLedge(4)
    byLedge(6)
    this.mist(...MISTS[3])
    byLedge(5)
    byLedge(7)
    byLedge(8)
    this.mist(...MISTS[4])
    this.mist(...MISTS[5])

    this.life(sparkT)

    // Công trình
    this.ring = new Sprite(texOf('ring', () => ringTex(160, 48, 2.5)))
    this.ring.anchor.set(0.5)
    this.ring.tint = hex(C.goldL)
    this.ring.visible = false
    this.land.addChild(this.ring, this.aura, this.bLayer, this.dust)
    this.bLayer.sortableChildren = true
    for (const id of IDS) {
      const [x, y] = SLOT[id]
      const root = new Container()
      root.position.set(x, y)
      root.zIndex = y
      const fx = new Container()
      root.addChild(fx)
      this.bLayer.addChild(root)
      const glow = new Container()
      glow.position.set(x, y)
      this.glow.addChild(glow)
      this.slots.set(id, { root, key: '', fx, glow, anims: [], lights: [], top: 0 })
    }
    for (const [kind, x, y, s, seed] of DECOR) {
      const p =
        kind === 'blossom'
          ? painted(`blossom:${s}:${seed}`, () => blossom(s, seed))
          : kind === 'bamboo'
            ? painted(`bamboo:${s}:${seed}`, () => bamboo(s, seed))
            : painted(`lantern:${s}`, () => stoneLantern(s))
      const d = sprite(p, x, y)
      d.zIndex = y - 0.5
      this.bLayer.addChild(d)
      if (kind === 'lantern') {
        const [lx, ly] = p.meta as [number, number]
        const l = soft(glowT, '#ffc86b', 26 * s, 0)
        l.position.set(x + lx, y + ly)
        this.glow.addChild(l)
        this.lamps.push(l)
      }
    }

    // Tiền cảnh: đá mực và tùng lớn sát mép dưới
    this.land.addChild(
      sprite(
        painted('rock:l', () => rock(110, 70, 41)),
        36,
        880,
      ),
    )
    this.land.addChild(
      sprite(
        painted('rock:r', () => rock(90, 56, 43)),
        372,
        886,
      ),
    )
    this.land.addChild(
      sprite(
        painted('pine:fg1', () => pine(1.9, 45)),
        40,
        850,
      ),
    )
    this.land.addChild(
      sprite(
        painted('pine:fg2', () => pine(1.5, 47)),
        368,
        872,
      ),
    )

    // Kiếp vân, mưa (không nhuộm theo giờ), rồi lớp cộng sáng
    const rainT = texOf('rain', () => rainTex(128))
    this.rain = [0.9, 0.55].map(sc => {
      const r = new TilingSprite({ texture: rainT, width: 2600, height: HOME.h + 800 })
      r.position.set(-1100, -400)
      r.tileScale.set(sc)
      r.visible = false
      return r
    })
    this.scene.addChild(this.stormFx, ...this.rain)
    this.stormFx.visible = false

    // Linh khí bay lên
    this.scene.addChild(this.glow, this.over)
    for (let i = 0; i < 18; i++) {
      const m = soft(sparkT, C.spirit, 5, 0)
      const x0 = 40 + ((i * 71) % 320),
        y0 = 480 + ((i * 37) % 320),
        dur = 7 + (i % 5),
        off = (i * 1.7) % dur
      this.glow.addChild(m)
      this.anims.push(t => {
        const k = ((t + off) % dur) / dur
        m.position.set(x0 + Math.sin(t + i) * 6, y0 - k * 170)
        m.alpha = Math.sin(k * Math.PI) * 0.9
      })
    }
    this.flash.rect(-1300, -400, 3000, 2000).fill({ color: 0xffffff })
    this.flash.alpha = 0
    this.root.addChild(this.flash)
    // nướng sẵn kiếp vân lúc rảnh để khi độ kiếp không bị khựng
    if (!this.still)
      (globalThis.requestIdleCallback ?? setTimeout)(
        () => this.root.destroyed || this.vortex.children.length || this.buildStorm(),
      )
  }

  // Đệ tử lên xuống bậc đá: nhún theo bước, nhỏ dần khi lên cao, hiện ra từ sương ở chân bậc
  private walker(path: readonly (readonly [number, number])[], seed: number) {
    const seg = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]))
    const len = seg.reduce((a, b) => a + b, 0)
    const at = (d: number): Pt => {
      for (let i = 0; i < seg.length; d -= seg[i], i++)
        if (d <= seg[i] || i === seg.length - 1) {
          const k = Math.min(1, d / seg[i])
          return [lerp(path[i][0], path[i + 1][0], k), lerp(path[i][1], path[i + 1][1], k)]
        }
      return path[0]
    }
    const p = painted(`walker:${seed % 2}`, () => disciple(seed % 2 === 0))
    const s = sprite(p)
    s.tint = hex(seed % 2 ? C.silk : mix(C.azuriteL, C.silk, 0.55))
    this.land.addChild(s)
    const trip = len / 5,
      rest = 3,
      cycle = 2 * (trip + rest),
      off = seed * 7.3
    this.anims.push(t => {
      const c = (t + off) % cycle
      const up = c < trip + rest
      const k = Math.min(1, (up ? c : c - trip - rest) / trip)
      const d = (up ? k : 1 - k) * len
      const [x, y] = at(d)
      s.position.set(x + 2, y - (k < 1 ? Math.abs(Math.sin(t * 7)) * 0.9 : 0))
      const sc = lerp(0.85, 0.66, d / len) / p.scale
      s.scale.set(up ? sc : -sc, sc)
      s.alpha = Math.min(1, d / 14)
    })
  }

  // Sinh khí của núi: tia nắng qua sương, bướm quanh mai, cánh mai rơi, đàn chim nhỏ; đêm thì đom đóm
  private life(sparkT: Texture) {
    // tia nắng xiên từ phía mặt trời
    const rayT = texOf('ray', () => rayTex())
    const rays = new Container()
    for (const [a, w, ph] of [
      [0.62, 120, 0],
      [0.78, 80, 2],
      [0.95, 140, 4],
      [1.12, 70, 1],
    ] as const) {
      const r = new Sprite(rayT)
      r.anchor.set(0.5, 0)
      r.position.set(330, 120)
      r.rotation = a
      r.width = w
      r.height = 760
      r.tint = 0xfff0cc
      r.blendMode = 'add'
      rays.addChild(r)
      this.anims.push(t => (r.alpha = 0.1 + 0.06 * Math.sin(t * 0.35 + ph)))
    }
    this.land.addChild(rays)
    this.day.push(rays)
    // đàn chim nhỏ bay ngang, thưa
    const wing = [painted('bird:up', () => bird(true)), painted('bird:down', () => bird(false))]
    const flock = new Container()
    const birds = [
      [0, 0],
      [11, -5],
      [20, 3],
      [-9, 6],
      [28, -2],
    ].map(([dx, dy], i) => {
      const b = sprite(wing[0], dx, dy)
      b.scale.set((0.7 - i * 0.05) / wing[0].scale)
      flock.addChild(b)
      return b
    })
    this.land.addChild(flock)
    this.fair.push(flock)
    this.anims.push(t => {
      const k = ((t + 12) % 46) / 26
      flock.visible = k < 1
      flock.position.set(-60 + k * 520, 262 - k * 30 + Math.sin(t * 0.9) * 5)
      birds.forEach((b, i) => (b.texture = wing[Math.floor(t * 5 + i * 0.7) % 2].tex))
    })
    // quanh mỗi cây mai: cánh hoa rơi, cây chẵn có bướm (ban ngày)
    const petalT = texOf('petal', () => petalTex(16))
    const fly = [painted('fly:open', () => butterfly(true)), painted('fly:shut', () => butterfly(false))]
    DECOR.filter(d => d[0] === 'blossom').forEach(([, bx, by, bs], n) => {
      for (let i = 0; i < 3; i++) {
        const pt = new Sprite(petalT)
        pt.anchor.set(0.5)
        pt.scale.set(0.34)
        this.land.addChild(pt)
        const dur = 5 + i * 1.3,
          off = n * 2.1 + i * 1.9,
          x0 = bx + (i - 1) * 9 * bs,
          y0 = by - 30 * bs
        this.anims.push(t => {
          const k = ((t + off) % dur) / dur
          pt.position.set(x0 + Math.sin(t * 1.7 + i) * 6 + k * 14, y0 + k * 44)
          pt.rotation = t * 2 + i
          pt.alpha = Math.sin(k * Math.PI)
        })
      }
      if (n % 2) return
      const b = sprite(fly[0])
      b.scale.set(0.7 / fly[0].scale)
      this.land.addChild(b)
      this.day.push(b)
      this.anims.push(t => {
        const u = t * 0.6 + n
        b.position.set(bx + Math.sin(u) * 22 + Math.sin(u * 2.3) * 6, by - 26 + Math.sin(u * 1.4) * 10)
        b.texture = fly[Math.floor(t * 11) % 2].tex
      })
    })
    // đom đóm quanh các tầng thấp, chỉ hiện khi tối
    for (let i = 0; i < 16; i++) {
      const f = soft(sparkT, '#e9f7a0', 5, 0)
      const x0 = 20 + ((i * 89) % 360),
        y0 = 430 + ((i * 131) % 380)
      this.glow.addChild(f)
      this.night.push(f)
      this.anims.push(t => f.position.set(x0 + Math.sin(t * 0.5 + i) * 14, y0 + Math.sin(t * 0.7 + i * 2) * 8))
    }
  }

  // Dải sương ghép liền trôi ngang
  private mist(y: number, h: number, speed: number, alpha: number, w = 2600) {
    const m = new TilingSprite({
      texture: texOf(`mist:${Math.round(y) % 3}`, () => mistTex(512, 96, 1 + (Math.round(y) % 3))),
      width: w,
      height: h * 1.6,
    })
    m.position.set(-(w - 400) / 2, y - h * 0.8)
    m.tileScale.set(1.1, (h * 1.6) / 96)
    m.alpha = alpha
    this.land.addChild(m)
    this.anims.push((_, dt) => (m.tilePosition.x += speed * dt))
  }

  // Cập nhật theo state game: hình công trình theo tầng, đang xây, chưa mở, đang chọn, trời theo giờ
  set(v: HomeView) {
    this.view = v
    this.mood = MOOD[v.phase]
    this.sky.texture = skyTex(v.phase)
    // kiếp vân công khai đang tụ (server giải lúc giáng): trời tối sẵn, chưa có sét
    this.cloud = v.game.marches.some(m => m.target.kind === 'trib')
    if ((v.storm || this.cloud) && !this.vortex.children.length) this.buildStorm()
    if (v.storm && !this.storm.n) Object.assign(this.storm, { at: this.rt, struck: 0 })
    this.storm.n = v.storm
    const g = v.game
    for (const id of IDS) this.place(id, g)
    if (v.selected && v.selected !== this.picked && !this.still) this.poke(v.selected)
    this.picked = v.selected
    const sel = v.selected && this.slots.get(v.selected)
    this.ring.visible = !!sel && !this.still
    if (sel && v.selected) {
      const [x, y, w] = SLOT[v.selected]
      this.ring.position.set(x, y + 1)
      this.ring.width = w + 12
      this.ring.height = 18
    }
  }

  private place(id: BuildingId, g: State) {
    const slot = this.slots.get(id)!
    const lv = g.levels[id]
    const locked = lv === 0 && g.levels.chuDien < BUILDINGS[id].unlock
    const job = g.queue.find(j => j.building === id)
    const shown = Math.max(1, lv)
    const key = `${locked ? 'lock' : lv ? 'b' : 'ghost'}:${tierOf(shown)}:${lv ? Math.min(6, 1 + Math.floor(lv / 2)) : 0}:${job ? 1 : 0}`
    if (key === slot.key) return
    slot.key = key
    const keep = slot.fx
    slot.root.removeChildren()
    keep.removeChildren().forEach(c => c.destroy())
    slot.glow.removeChildren().forEach(c => c.destroy())
    slot.root.addChild(keep)
    slot.anims = []
    slot.lights = []
    const b = building(id as Kind, shown)
    slot.top = b.top
    const p = painted(
      `bld:${id}:${tierOf(shown)}:${id === 'dienVoTruong' ? Math.min(6, 1 + Math.floor(shown / 2)) : 0}`,
      () => b.art,
    )
    const [, , w] = SLOT[id]
    if (locked) {
      // mây che: ba đám mây chồng nhau, nhấp nhô
      for (const [dx, dy, cw, seed] of [
        [-w * 0.2, -b.top * 0.15, w * 0.8, 51],
        [w * 0.22, -b.top * 0.35, w * 0.7, 53],
        [0, -b.top * 0.05, w * 1.05, 57],
      ] as const) {
        const c = sprite(
          painted(`fog:${Math.round(cw)}:${seed}`, () => cloud(cw, seed)),
          dx,
          dy,
        )
        slot.root.addChild(c)
        slot.anims.push(t => (c.y = dy + Math.sin(t * 1.2 + seed) * 2))
      }
      return
    }
    if (!lv) {
      slot.root.addChildAt(sprite(painted(`plot:${w}`, () => plot(w))), 0)
      const ghost = sprite(p)
      ghost.alpha = 0.28
      slot.root.addChildAt(ghost, 1)
      return
    }
    slot.body = sprite(p)
    slot.root.addChildAt(slot.body, 0)
    this.effects(slot, p.meta as Fx[])
    if (id === 'tuLinhTran') this.qi(slot, w)
    if (job) {
      slot.root.addChild(sprite(painted(`scaffold:${w}:${b.top}`, () => scaffold(w * 0.9, b.top * 0.95))))
      const worker = sprite(
        painted('worker', () => disciple(false)),
        w * 0.36,
        -1,
      )
      worker.tint = hex(C.ochreL)
      slot.root.addChild(worker)
      slot.anims.push(t => (worker.rotation = Math.sin(t * 12) * 0.12))
      // tia lửa mỗi nhát búa (chu kỳ theo nhịp tay thợ) + bụi đá bốc lên ở chân giàn
      const sparkT = texOf('spark', () => sparkTex(24))
      const hand = [w * 0.36 - 5, -9]
      for (let i = 0; i < 4; i++) {
        const sp = soft(sparkT, i % 2 ? '#ffd27a' : '#fff4d6', 4, 0)
        const vx = (i - 1.5) * 9,
          vy = -16 - (i % 2) * 8
        slot.glow.addChild(sp)
        slot.anims.push(t => {
          const k = ((t * 12) / (Math.PI * 2) + 0.25) % 1 // 0 lúc búa chạm
          sp.position.set(hand[0] + vx * k, hand[1] + vy * k + 60 * k * k)
          sp.alpha = k < 0.45 ? 1 - k / 0.45 : 0
        })
      }
      const puffT = texOf('puff', () => puffTex())
      for (let i = 0; i < 3; i++) {
        const d = new Sprite(puffT)
        d.anchor.set(0.5)
        d.tint = hex(mix(C.paper2, C.ochre, 0.35))
        slot.fx.addChild(d)
        const x0 = (i - 1) * w * 0.28
        slot.anims.push(t => {
          const k = ((t + i * 0.9) % 2.7) / 2.7
          d.position.set(x0 + k * 6, -2 - k * 14)
          d.width = d.height = 8 + k * 14
          d.alpha = Math.sin(k * Math.PI) * 0.45
        })
      }
    }
  }

  // Tụ Linh Trận hút linh khí: hạt sáng xoáy dần vào tâm trận rồi bốc lên theo cột sáng
  private qi(slot: Slot, w: number) {
    const sparkT = texOf('spark', () => sparkTex(24))
    for (let i = 0; i < 14; i++) {
      const m = soft(sparkT, C.spirit, 6, 0)
      slot.glow.addChild(m)
      const a0 = (i / 14) * Math.PI * 2,
        dur = 2.4 + (i % 4) * 0.5,
        off = i * 0.37
      slot.anims.push(t => {
        const k = ((t + off) % dur) / dur
        const r = w * 0.75 * (1 - k),
          a = a0 + k * 4
        m.position.set(Math.cos(a) * r, -6 + Math.sin(a) * r * 0.32 - k ** 3 * 26)
        m.alpha = Math.sin(k * Math.PI) * 0.9
      })
    }
  }

  // Hiệu ứng động của công trình (toạ độ DU từ chân)
  private effects(slot: Slot, fx: Fx[]) {
    const glowT = texOf('glow', () => glowTex(64))
    const sparkT = texOf('spark', () => sparkTex(24))
    for (const f of fx) {
      if (f.k === 'light') {
        const l = soft(glowT, '#ffc86b', f.r * 2.4, 0)
        l.position.set(f.x, f.y)
        slot.lights.push(l)
        slot.glow.addChild(l)
      } else if (f.k === 'fire') {
        // lửa lò: ba khung lưỡi lửa vẽ tay thay nhau (như hoạt hoạ vẽ tay), phụt lên từ miệng đỉnh; quầng ấm hắt qua bụng đỉnh
        const l = soft(glowT, '#ff9a3c', 34 * f.s, 0.5)
        l.position.set(f.x, f.y)
        const size = 17 * f.s
        const fl = ink('flame', (i, k) => orbTex(96, 64, 7 + i * 6, 0.2, k), FIRE, size, 3)
        fl.c.rotation = Math.PI / 2 // đầu hoả cầu xuống dưới: lưỡi lửa bốc lên
        fl.c.position.set(f.x, f.y - 9 * f.s - size * 0.2)
        const s0 = fl.c.scale.x
        slot.glow.addChild(l, fl.c)
        slot.anims.push(t => {
          fl.frame(Math.floor(t * 9) % 3)
          fl.c.scale.x = s0 * (1 + 0.1 * Math.sin(t * 13) * Math.sin(t * 5.3))
          l.alpha = 0.4 + 0.2 * Math.sin(t * 7) * Math.sin(t * 3.1)
        })
      } else if (f.k === 'orb') {
        // linh châu vẽ tay lơ lửng; quầng linh khí mờ ban ngày, sáng dần khi tối
        const p = sprite(
          painted(`pearl:${f.s}`, () => pearl(2.6 * f.s)),
          f.x,
          f.y,
        )
        slot.fx.addChild(p)
        const l = soft(glowT, C.spirit, 16 * f.s, 0)
        slot.glow.addChild(l)
        slot.anims.push(t => {
          const y = f.y + Math.sin(t * 2 + f.x) * 0.8
          p.y = y
          l.position.set(f.x, y)
          l.alpha = (0.2 + 0.8 * this.lightsLevel) * (0.7 + 0.3 * Math.sin(t * 2 + f.x))
        })
      } else if (f.k === 'beam') {
        const l = new Sprite(texOf('beam', () => beamTex()))
        l.anchor.set(0.5, 1)
        l.width = 14
        l.height = f.h
        l.tint = hex(C.spirit)
        l.blendMode = 'add'
        l.position.set(f.x, f.y)
        slot.glow.addChild(l)
        slot.anims.push(t => (l.alpha = 0.45 + 0.35 * Math.sin(t * 1.8)))
      } else if (f.k === 'rune') {
        const r = new Sprite(texOf('ring', () => ringTex(160, 48, 2.5)))
        r.anchor.set(0.5)
        r.width = f.rx * 2.1
        r.height = f.ry * 2.4
        r.tint = hex(C.spirit)
        r.blendMode = 'add'
        r.position.set(f.x, f.y)
        slot.glow.addChild(r)
        slot.anims.push(t => (r.alpha = 0.35 + 0.35 * Math.sin(t * 1.6 + f.rx)))
      } else if (f.k === 'herb' || f.k === 'spark') {
        const l = soft(sparkT, f.k === 'herb' ? C.goldL : C.spirit, 7 * f.s, 0)
        l.position.set(f.x, f.y)
        slot.glow.addChild(l)
        slot.anims.push(t => (l.alpha = Math.max(0, Math.sin(t * 1.4 + f.x))))
      } else if (f.k === 'smoke') {
        const puffT = texOf('puff', () => puffTex())
        for (let i = 0; i < 3; i++) {
          const p = new Sprite(puffT)
          p.anchor.set(0.5)
          slot.fx.addChild(p)
          slot.anims.push(t => {
            const k = ((t + i * 1.2) % 3.6) / 3.6
            p.position.set(f.x + k * 5, f.y - k * 28)
            p.width = p.height = 8 + k * 16
            p.alpha = Math.sin(k * Math.PI) * 0.85
          })
        }
      } else if (f.k === 'flag') {
        const s = sprite(painted('flag', flag), f.x, f.y)
        s.scale.set(f.s / painted('flag', flag).scale)
        slot.fx.addChild(s)
        slot.anims.push(t => (s.skew.y = Math.sin(t * 2.6 + f.x) * 0.12))
      } else if (f.k === 'disciple') {
        const s = sprite(
          painted('disciple', () => disciple(true)),
          f.x,
          f.y,
        )
        slot.fx.addChild(s)
        slot.anims.push(t => (s.y = f.y - Math.max(0, Math.sin(t * 3.5 + f.x)) * 1.2))
      }
    }
  }

  // Kiếp vân: xoáy mây hai lớp ép dẹt (nhìn từ dưới lên), lớp trong quay nhanh hơn nên mây như bị hút vào mắt bão;
  // chớp loé trong mây; sét đánh theo lịch trong tick()
  private buildStorm() {
    const [x, y] = SLOT.chuDien
    // mắt bão lệch sang khoảng trời trống bên phải (chỗ mặt trời/trăng, đã tắt khi trời kiếp): trên điện thoại
    // thẻ nhiệm vụ che ngay phía trên Chủ điện; sét quật chéo xuống mái cũng dữ hơn đánh thẳng
    const eye: Pt = [x + 100, y - 165]
    this.storm.eye = eye
    const glowT = texOf('glow', () => glowTex(64))
    const disk = new Container()
    disk.position.set(...eye)
    disk.scale.y = 0.4
    const layers = (
      [
        [256, 5, 3, 1.6, 460],
        [192, 11, 2, 2.3, 230],
      ] as const
    ).map(([px, seed, arms, tw, size]) => {
      const s = new Sprite(texOf(`vortex:${seed}`, () => vortexTex(px, seed, arms, tw)))
      s.anchor.set(0.5)
      s.width = s.height = size
      disk.addChild(s)
      return s
    })
    const halo = soft(glowT, '#9b82ff', 150, 0.5)
    halo.scale.y *= 0.5
    halo.position.set(...eye)
    const core = soft(glowT, '#f1ebff', 34, 0.9)
    core.scale.y *= 0.6
    core.position.set(...eye)
    const flick = soft(glowT, '#b9a4ff', 90, 0)
    flick.scale.y *= 0.45
    this.vortex.addChild(disk, halo, core, flick)
    const r = rng(77)
    let next = 0,
      fl = 0
    this.anims.push((t, dt) => {
      if (!this.vortex.visible) return
      layers[0].rotation += dt * 0.32
      layers[1].rotation += dt * 0.75
      const f = this.storm.flare
      halo.alpha = 0.45 + 0.12 * Math.sin(t * 2.4) + f * 0.5
      core.alpha = 0.75 + 0.2 * Math.sin(t * 5.3) + f
      // chớp trong mây: loé ngắn ở chỗ ngẫu nhiên giữa các đợt sét
      if (t > next) {
        flick.position.set(eye[0] + (r() - 0.5) * 300, eye[1] + (r() - 0.5) * 80)
        fl = 0.5 + r() * 0.5
        next = t + 0.25 + r() * 0.9
      }
      flick.alpha = fl
      fl *= Math.exp(-dt * 14)
    })
  }

  // Một đợt sét từ mắt bão xuống mái Chủ điện: chớp — tắt — chớp lại theo nhánh khác, loé trắng, rung cảnh
  private strike(big: boolean) {
    const [x, y] = SLOT.chuDien
    const hit: Pt = [x + (Math.random() - 0.5) * 30, y - this.topOf('chuDien') * 0.8]
    const glowT = texOf('glow', () => glowTex(64))
    const sparkT = texOf('spark', () => sparkTex(24))
    const c = new Container()
    // tia sét nét bút từ mắt bão xuống mái: hai dáng khác nhau thay phiên (chớp — tắt — chớp lại)
    const eye = this.storm.eye,
      len = Math.hypot(hit[0] - eye[0], hit[1] - eye[1])
    const n = Math.floor(Math.random() * 3)
    const [g, g2] = [n, (n + 1) % 3].map(v => {
      // đoạn ngắn (~80 DU): texture 1:2, bề ngang cố định để thân sét không mảnh như chỉ
      const b = ink(`hbolt:${v}`, (_, k) => boltTex(160, 320, 20 + v, k), THUNDER, big ? 84 : 60)
      b.c.pivot.set(0, -160) // neo ở đỉnh tia (trong mây)
      b.c.scale.y = len / 320
      b.c.rotation = Math.atan2(hit[1] - eye[1], hit[0] - eye[0]) - Math.PI / 2
      b.c.position.set(...eye)
      return b.c
    })
    g2.visible = false
    const bloom = soft(glowT, '#e6dcff', big ? 150 : 100, 0)
    bloom.position.set(...hit)
    const parts = Array.from({ length: big ? 22 : 12 }, (_, i) => {
      const s = soft(sparkT, i % 3 ? '#cbb8ff' : '#ffffff', 5 + (i % 4) * 2, 0)
      const a = -Math.PI * (0.1 + Math.random() * 0.8),
        v = 60 + Math.random() * (big ? 120 : 70)
      c.addChild(s)
      return { s, vx: Math.cos(a) * v, vy: Math.sin(a) * v }
    })
    c.addChild(g, g2, bloom)
    let re = false
    this.play(
      c,
      0.9,
      e => {
        if (!re && e > 0.12) ((re = true), (g.visible = false), (g2.visible = true))
        g.alpha = g2.alpha = e < 0.07 ? 1 : e < 0.12 ? 0.12 : e < 0.26 ? 0.95 : Math.max(0, 1 - (e - 0.26) / 0.25)
        bloom.alpha = Math.max(0, 1 - e / 0.5)
        bloom.scale.set(((big ? 150 : 100) / 64) * (0.6 + e))
        for (const p of parts) {
          p.s.position.set(hit[0] + p.vx * e, hit[1] + p.vy * e + 160 * e * e)
          p.s.alpha = Math.max(0, 1 - e / 0.8)
        }
      },
      this.stormFx,
    )
    this.flashAt(big ? 0.6 : 0.38, 0xf3edff)
    this.shakeA = big ? 9 : 5
    this.storm.flare = 1
  }

  // Lên tầng: cột sáng vàng, sóng vòng, tia vàng rơi theo trọng lực, loé sáng.
  // Chủ điện (đột phá cảnh giới sau độ kiếp) thì lớn gấp bội, thêm hào quang toả tia.
  burst(id: BuildingId) {
    const slot = this.slots.get(id)
    if (!slot) return
    const big = id === 'chuDien'
    const [x, y, w] = SLOT[id]
    const mid = -slot.top * 0.5
    const glowT = texOf('glow', () => glowTex(64))
    const sparkT = texOf('spark', () => sparkTex(24))
    const add = (s: Sprite, ax = 0.5, ay = 0.5) => (
      s.anchor.set(ax, ay),
      (s.tint = hex(C.goldL)),
      (s.blendMode = 'add'),
      s
    )
    const c = new Container()
    c.position.set(x, y)
    const rays = big ? Array.from({ length: 12 }, () => add(new Sprite(texOf('ray', () => rayTex())), 0.5, 1)) : []
    rays.forEach(r => r.position.set(0, mid))
    const pillar = add(new Sprite(texOf('beam', () => beamTex())), 0.5, 1)
    pillar.height = big ? 760 : 260
    pillar.tint = hex(C.gold)
    const halo = soft(glowT, C.gold, w * (big ? 2 : 1.3), 0)
    halo.position.set(0, mid)
    // tia bút vàng mảnh toả sau lưng công trình (背光) + vòng mực vàng lan trên đất: bung vượt cỡ rồi thu, khô tan dần
    const star = ink('lvstar', (f, k) => burstTex(128, 17, DRY[f], k * 0.5), GOLD, w * (big ? 1.7 : 1.15))
    star.c.position.set(x, y + mid)
    this.aura.addChild(star.c)
    const s0 = star.c.scale.x
    const ring = ink('lvring', (f, k) => ringTex(256, 80, 7, 5, DRY[f], k), GOLD, 24)
    const r0 = ring.c.scale.x
    c.addChild(...rays, pillar, halo, ring.c)
    const r = rng(Math.floor(this.rt * 1000) + 1)
    const parts = Array.from({ length: big ? 60 : 24 }, () => {
      const s = soft(sparkT, r() < 0.3 ? '#ffffff' : C.goldL, 5 + r() * 6, 0)
      const a = -Math.PI / 2 + (r() - 0.5) * 2.4,
        v = (big ? 130 : 80) * (0.45 + r())
      c.addChild(s)
      return { s, x: (r() - 0.5) * w * 0.5, y: mid * (0.4 + r()), vx: Math.cos(a) * v, vy: Math.sin(a) * v }
    })
    const dur = big ? 2.8 : 1.6
    this.play(c, dur, e => {
      const k = e / dur
      pillar.width = (big ? 80 : 34) * Math.min(1, e / 0.12) * (1 - k * 0.75)
      pillar.alpha = Math.min(1, e / 0.08) * (1 - k) ** 1.6
      halo.alpha = 0.5 * Math.min(1, e / 0.1) * Math.max(0, 1 - e / (dur * 0.6))
      const sk = Math.min(1, e / 0.18)
      star.c.scale.set(s0 * (sk < 1 ? 0.3 + back(sk) * 0.7 : 1 + (e - 0.18) * 0.1))
      star.c.rotation = e * 0.25
      star.frame(Math.max(0, (k - 0.15) / 0.6) * (last + 0.99))
      star.c.alpha = k < 0.55 ? 1 : Math.max(0, 1 - (k - 0.55) / 0.35)
      if (e >= dur) star.c.destroy({ children: true })
      const rk = e / (big ? 1.3 : 0.9)
      ring.c.scale.set(r0 * (1 + e * (big ? 19 : 10)))
      ring.frame(rk * (last + 0.99))
      ring.c.alpha = Math.max(0, 1 - rk)
      rays.forEach((ry, i) => {
        ry.rotation = (i / rays.length) * Math.PI * 2 + e * 0.3
        ry.width = 34
        ry.height = 150 + e * 70
        ry.alpha = Math.sin(Math.min(1, k * 1.3) * Math.PI) * 0.6
      })
      for (const p of parts) {
        p.s.position.set(p.x + p.vx * e, p.y + p.vy * e + 110 * e * e)
        p.s.alpha = Math.min(1, e / 0.05) * Math.max(0, 1 - e / (dur * 0.85))
      }
    })
    this.flashAt(big ? 0.65 : 0.22, 0xfff0c4)
    if (big) this.shakeA = 6
  }

  // Chạm công trình: nén xuống rồi bật lên (chân đứng yên), bụi toả hai bên
  private poke(id: BuildingId) {
    const slot = this.slots.get(id)
    if (!slot) return
    const [x, y, w] = SLOT[id]
    const c = new Container()
    c.position.set(x, y)
    const puffT = texOf('puff', () => puffTex())
    const puffs = Array.from({ length: 6 }, (_, i) => {
      const d = new Sprite(puffT)
      d.anchor.set(0.5)
      d.tint = hex(mix(C.paper2, C.ochre, 0.3))
      c.addChild(d)
      return { d, dir: i % 2 ? 1 : -1, sp: 0.6 + (i >> 1) * 0.25 }
    })
    const dur = 0.7
    this.play(
      c,
      dur,
      e => {
        const b = Math.sin(e * 26) * Math.exp(-e * 6) * (1 - e / dur)
        slot.root.scale.set(1 + b * 0.05, 1 - b * 0.08)
        for (const p of puffs) {
          const k = e / dur
          p.d.position.set(p.dir * w * (0.25 + k * 0.3 * p.sp), -2 - k * 6 * p.sp)
          p.d.width = p.d.height = 6 + k * 16
          p.d.alpha = Math.sin(Math.min(1, k * 1.2) * Math.PI) * 0.55
        }
      },
      this.dust,
    )
  }

  // Công trình sản xuất nhả vật phẩm vẽ tay bay lên (kho đầy thì thôi)
  private make(id: BuildingId) {
    const slot = this.slots.get(id)
    const r = BUILDINGS[id].makes
    if (!slot || !r) return
    const [x, y] = SLOT[id]
    const p = painted(`item:${r}`, () => itemIcon(r))
    const c = new Container()
    c.position.set(x + (Math.random() - 0.5) * 30, y - slot.top - 2)
    const halo = soft(
      texOf('glow', () => glowTex(64)),
      C.goldL,
      30,
      0,
    )
    const icon = sprite(p)
    c.addChild(halo, icon)
    const base = 0.72 / p.scale
    this.play(
      c,
      1.8,
      e => {
        const pop = e < 0.25 ? Math.sin((e / 0.25) * Math.PI * 0.75) / Math.sin(Math.PI * 0.75) : 1
        icon.scale.set(base * Math.min(1.15, pop))
        icon.y = halo.y = -e * 22
        const a = e < 0.15 ? e / 0.15 : Math.max(0, 1 - (e - 1) / 0.8)
        icon.alpha = a
        halo.alpha = a * 0.5
      },
      this.over,
    )
  }

  private play(c: Container, dur: number, step: (e: number) => void, layer: Container = this.glow) {
    layer.addChild(c)
    this.plays.push({ t0: this.rt, dur, c, step })
    step(0)
  }
  private flashAt(a: number, color: number) {
    if (this.reduced) a *= 0.4
    this.flash.tint = color
    this.flashA = Math.max(this.flashA, a)
  }

  // Mỗi khung hình. cam: DU đang cuộn tới (để thị sai núi xa)
  tick(dt: number, cam: number) {
    this.rt += dt
    if (!this.reduced) this.t += dt
    const t = this.t
    for (const a of this.anims) a(t, this.reduced ? 0 : dt)
    for (const s of this.slots.values()) for (const a of s.anims) a(t, dt)
    this.far.forEach((f, i) => (f.y = cam * (0.5 - i * 0.2)))
    // trời chuyển dần sang kiếp vân và trở lại
    const st = this.storm
    this.stormK += ((st.n || this.cloud ? 1 : 0) - this.stormK) * Math.min(1, dt * 2.2)
    const k = this.stormK,
      m = this.mood,
      sm = MOOD.storm
    this.world.tint = this.land.tint = lerpC(m.tint, sm.tint, k)
    this.stormSky.alpha = k
    this.sun.alpha = m.sun * (1 - k)
    this.moon.alpha = m.moon * (1 - k)
    this.stars.alpha = m.stars * (1 - k)
    for (const f of this.fair) f.alpha = 1 - k
    this.stormFx.visible = this.vortex.visible = k > 0.01
    this.stormFx.alpha = this.vortex.alpha = k
    this.rain.forEach((r, i) => {
      r.visible = k > 0.01
      r.alpha = k * (i ? 0.35 : 0.6)
      r.tilePosition.x -= dt * (i ? 50 : 110)
      r.tilePosition.y += dt * (i ? 240 : 420)
    })
    if (st.n) while (st.struck < st.n && this.rt - st.at >= 0.7 + st.struck * 1.2) this.strike(++st.struck === st.n)
    st.flare *= Math.exp(-dt * 4)
    if (this.view && !this.still && !st.n && !this.reduced && this.rt > this.makeAt) {
      this.makeAt = this.rt + 1.7
      const g = this.view.game,
        cap = storage(g)
      const ids = MAKERS.filter(id => g.levels[id] > 0 && g.res[BUILDINGS[id].makes!] < cap)
      if (ids.length) this.make(ids[this.maker++ % ids.length])
    }
    // đèn theo giờ, chập chờn nhẹ
    this.lightsLevel += (m.lights + (sm.lights - m.lights) * k - this.lightsLevel) * Math.min(1, dt * 2)
    let i = 0
    for (const s of this.slots.values())
      for (const l of s.lights) l.alpha = this.lightsLevel * (0.75 + 0.2 * Math.sin(t * 3 + i++))
    for (const l of this.lamps) l.alpha = this.lightsLevel * (0.7 + 0.25 * Math.sin(t * 4.3 + l.x))
    const dark = Math.min(1, this.lightsLevel * 1.4)
    for (const d of this.day) ((d.alpha = (1 - dark) * (1 - k)), (d.visible = d.alpha > 0.02))
    for (const n of this.night) n.alpha = dark * (1 - k) * Math.max(0, Math.sin(t * 1.9 + n.x))
    // hiệu ứng thoáng qua, loé sáng, rung
    this.plays = this.plays.filter(p => {
      const e = this.rt - p.t0
      if (e >= p.dur) return (void (p.step(p.dur), p.c.destroy({ children: true })), false)
      p.step(e)
      return true
    })
    this.flash.alpha = this.flashA
    this.flashA *= Math.exp(-dt * 5)
    const sh = this.reduced ? 0 : this.shakeA
    this.scene.position.set((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh)
    this.shakeA *= Math.exp(-dt * 7)
    if (this.ring.visible) this.ring.alpha = 0.65 + 0.35 * Math.sin(t * 4.5)
  }

  topOf(id: BuildingId) {
    return this.slots.get(id)?.top ?? 60
  }

  destroy() {
    this.root.destroy({ children: true })
  }
}
