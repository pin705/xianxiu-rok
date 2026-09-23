// Cảnh núi tông môn trên WebGL. Hình tĩnh vẽ tay nướng thành texture một lần; mọi chuyển động
// (sương trôi, thác chảy, hạc bay, khói, lửa, linh khí, đèn đêm) do GPU diễn mỗi khung hình.
import { Container, Graphics, Sprite, TilingSprite, type Texture } from 'pixi.js'
import {
  PIGMENT as C, beamTex, boltTex, building, cloud, crane, disciple, fallTex, farRange, flag, glowTex, ledge, mistTex, mix, paper,
  peak, pine, plot, puffTex, ringTex, rock, scaffold, sparkTex, tierOf, type Fx, type Kind,
} from '@rok/art'
import { BUILDINGS, IDS, type BuildingId, type State } from '@rok/rules'
import { HOME, LEDGES, MISTS, PINES, SLOT } from './layout'
import { painted, texOf, type Painted } from './stage'

export type Phase = 'dawn' | 'day' | 'dusk' | 'night'
export type HomeView = {
  game: State
  seal: Record<BuildingId, string>
  selected: BuildingId | null
  storm: boolean
  phase: Phase
}

const hex = (c: string) => parseInt(c.slice(1), 16)
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
  private sun: Sprite
  private moon: Sprite
  private stars = new Container()
  private slots = new Map<BuildingId, Slot>()
  private bLayer = new Container()
  private ring: Sprite
  private stormFx = new Container()
  private flash = new Graphics()
  private bursts: { c: Container; t0: number; parts: { s: Sprite; vx: number; vy: number }[] }[] = []
  private anims: Anim[] = []
  private t = 0
  private mood = MOOD.day
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
    this.root.addChild(this.world, this.sky)
    this.sun = soft(glowT, '#fff2d0', 120)
    this.sun.position.set(318, 150)
    this.moon = soft(glowT, '#f2efe2', 60)
    this.moon.position.set(86, 140)
    this.root.addChild(this.sun, this.moon, this.stars)
    this.land = new Container()
    this.root.addChild(this.land)
    for (let i = 0; i < 36; i++) {
      const s = soft(sparkT, '#ffffff', 3 + (i % 3) * 2, 0.8)
      s.position.set(((i * 97) % 440) - 20, 20 + ((i * 53) % 300))
      this.stars.addChild(s)
      this.anims.push(t => (s.alpha = 0.5 + 0.5 * Math.sin(t * 1.3 + i)))
    }

    // Núi xa: hai lớp mực nhạt, trôi chậm hơn khi cuộn (thị sai)
    const far1 = sprite(painted('far1', () => farRange(1400, 150, 21, C.azuriteL, 0.55), 1), -500, 330)
    const far2 = sprite(painted('far2', () => farRange(1400, 120, 22, mix(C.azurite, C.indigo, 0.5), 0.5), 1), -500, 410)
    for (const f of [far1, far2]) {
      const c = new Container()
      c.addChild(f)
      this.far.push(c)
      this.land.addChild(c)
    }
    // Mây tường vân trên trời
    for (const [x, y, w, seed, sp] of [[70, 230, 96, 1, 6], [330, 280, 76, 4, -5], [210, 170, 60, 9, 4]] as const) {
      const c = sprite(painted(`cloud:${w}:${seed}`, () => cloud(w, seed)), x, y)
      this.land.addChild(c)
      this.anims.push(t => (c.x = x + Math.sin(t / 18 + seed) * 16 + sp * Math.sin(t / 40)))
    }
    // Hạc bay ngang trời
    const flock = new Container()
    const wings = [painted('crane:up', () => crane(true)), painted('crane:down', () => crane(false))]
    const birds = [[0, 0, 1], [30, 12, 0.78]].map(([dx, dy, s], i) => {
      const b = sprite(wings[0], dx, dy)
      b.scale.set(s / wings[0].scale)
      flock.addChild(b)
      return { b, i }
    })
    this.land.addChild(flock)
    this.anims.push(t => {
      const k = (t % 34) / 34
      flock.position.set(470 - k * 560, 170 - k * 50 + Math.sin(t * 0.8) * 4)
      for (const { b, i } of birds) b.texture = wings[Math.floor(t * 2.2 + i * 0.5) % 2].tex
    })

    // Núi chính sau Chủ điện + sương lưng chừng
    this.land.addChild(sprite(painted('peak:main', () => peak(236, 228, 31, 0.02)), 205, 392))
    this.mist(262, 70, 3, 0.85, 700)

    // Các tầng núi, xen sương; vách thác ở phải
    const byLedge = (i: number) => {
      const [x, y, w, h, seed] = LEDGES[i]
      this.land.addChild(sprite(painted(`ledge:${i}`, () => ledge(w, h, seed)), x, y))
      for (const [px, py, s, ps] of PINES) if (Math.abs(py - y) < 8) this.land.addChild(sprite(painted(`pine:${ps}`, () => pine(s, ps)), px, py))
    }
    byLedge(0)
    this.mist(...MISTS[0])
    byLedge(1)
    byLedge(2)
    this.land.addChild(sprite(painted('peak:cliff', () => peak(250, 250, 37, 0.3)), 372, 730))
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
    this.mist(...MISTS[3])
    byLedge(5)
    this.mist(...MISTS[4])
    this.mist(...MISTS[5])

    // Công trình
    this.ring = new Sprite(texOf('ring', () => ringTex(160, 48, 2.5)))
    this.ring.anchor.set(0.5)
    this.ring.tint = hex(C.goldL)
    this.ring.visible = false
    this.land.addChild(this.ring, this.bLayer)
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
    this.land.addChild(this.stormFx)

    // Tiền cảnh: đá mực và tùng lớn sát mép dưới
    this.land.addChild(sprite(painted('rock:l', () => rock(110, 70, 41)), 36, 880))
    this.land.addChild(sprite(painted('rock:r', () => rock(90, 56, 43)), 372, 886))
    this.land.addChild(sprite(painted('pine:fg1', () => pine(1.9, 45)), 40, 850))
    this.land.addChild(sprite(painted('pine:fg2', () => pine(1.5, 47)), 368, 872))

    // Linh khí bay lên
    this.root.addChild(this.glow)
    for (let i = 0; i < 18; i++) {
      const m = soft(sparkT, C.spirit, 5, 0)
      const x0 = 40 + ((i * 71) % 320), y0 = 480 + ((i * 37) % 320), dur = 7 + (i % 5), off = (i * 1.7) % dur
      this.glow.addChild(m)
      this.anims.push(t => {
        const k = ((t + off) % dur) / dur
        m.position.set(x0 + Math.sin(t + i) * 6, y0 - k * 170)
        m.alpha = Math.sin(k * Math.PI) * 0.9
      })
    }
    this.flash.rect(-1300, -400, 3000, 2000).fill({ color: 0xf3edff })
    this.flash.alpha = 0
    this.root.addChild(this.flash)
  }

  // Dải sương ghép liền trôi ngang
  private mist(y: number, h: number, speed: number, alpha: number, w = 1400) {
    const m = new TilingSprite({ texture: texOf(`mist:${Math.round(y) % 3}`, () => mistTex(512, 96, 1 + (Math.round(y) % 3))), width: w, height: h * 1.6 })
    m.position.set(-(w - 400) / 2, y - h * 0.8)
    m.tileScale.set(1.1, (h * 1.6) / 96)
    m.alpha = alpha
    this.land.addChild(m)
    this.anims.push((_, dt) => (m.tilePosition.x += speed * dt))
  }

  // Cập nhật theo state game: hình công trình theo tầng, đang xây, chưa mở, đang chọn, trời theo giờ
  set(v: HomeView) {
    this.view = v
    const moodKey = v.storm ? 'storm' : v.phase
    this.mood = MOOD[moodKey]
    this.sky.texture = skyTex(moodKey)
    this.world.tint = this.land.tint = this.mood.tint
    this.sun.alpha = this.mood.sun
    this.moon.alpha = this.mood.moon
    this.stars.alpha = this.mood.stars
    const g = v.game
    for (const id of IDS) this.place(id, g)
    const sel = v.selected && this.slots.get(v.selected)
    this.ring.visible = !!sel && !this.still
    if (sel && v.selected) {
      const [x, y, w] = SLOT[v.selected]
      this.ring.position.set(x, y + 1)
      this.ring.width = w + 12
      this.ring.height = 18
    }
    this.stormFx.visible = v.storm
    if (v.storm && !this.stormFx.children.length) this.buildStorm()
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
    const b = building(id as Kind, shown, this.view!.seal[id])
    slot.top = b.top
    const p = painted(`bld:${id}:${tierOf(shown)}:${id === 'dienVoTruong' ? Math.min(6, 1 + Math.floor(shown / 2)) : 0}`, () => b.art)
    const [, , w] = SLOT[id]
    if (locked) {
      // mây che: ba đám mây chồng nhau, nhấp nhô
      for (const [dx, dy, cw, seed] of [[-w * 0.2, -b.top * 0.15, w * 0.8, 51], [w * 0.22, -b.top * 0.35, w * 0.7, 53], [0, -b.top * 0.05, w * 1.05, 57]] as const) {
        const c = sprite(painted(`fog:${Math.round(cw)}:${seed}`, () => cloud(cw, seed)), dx, dy)
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
    if (job) {
      slot.root.addChild(sprite(painted(`scaffold:${w}:${b.top}`, () => scaffold(w * 0.9, b.top * 0.95))))
      const worker = sprite(painted('worker', () => disciple(false)), w * 0.36, -1)
      worker.tint = hex(C.ochreL)
      slot.root.addChild(worker)
      slot.anims.push(t => (worker.rotation = Math.sin(t * 12) * 0.12))
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
        const l = soft(glowT, '#ff9a3c', 34 * f.s, 0.7)
        l.position.set(f.x, f.y)
        slot.glow.addChild(l)
        slot.anims.push(t => (l.alpha = 0.55 + 0.25 * Math.sin(t * 7) * Math.sin(t * 3.1)))
      } else if (f.k === 'orb') {
        const l = soft(glowT, C.spirit, 14 * f.s, 0.8)
        l.position.set(f.x, f.y)
        slot.glow.addChild(l)
        slot.anims.push(t => (l.alpha = 0.55 + 0.4 * Math.sin(t * 2 + f.x)))
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
        const s = sprite(painted('disciple', () => disciple(true)), f.x, f.y)
        slot.fx.addChild(s)
        slot.anims.push(t => (s.y = f.y - Math.max(0, Math.sin(t * 3.5 + f.x)) * 1.2))
      }
    }
  }

  // Kiếp vân tụ trên Chủ điện, sét đánh ba lần
  private buildStorm() {
    const [x, y] = SLOT.chuDien
    const clouds: Sprite[] = []
    for (const [dx, dy, w, seed] of [[-50, -110, 120, 61], [44, -118, 130, 63], [0, -128, 110, 67]] as const) {
      const c = sprite(painted(`storm:${seed}`, () => cloud(w, seed, true)), x + dx, y + dy)
      clouds.push(c)
      this.stormFx.addChild(c)
    }
    const boltT = [1, 2, 3].map(s => texOf(`bolt:${s}`, () => boltTex(64, 256, s)))
    const bolts = boltT.map((t, i) => {
      const b = new Sprite(t)
      b.anchor.set(0.5, 0)
      b.width = 44
      b.height = 130
      b.position.set(x - 20 + i * 20, y - 118)
      b.blendMode = 'add'
      b.alpha = 0
      this.stormFx.addChild(b)
      return b
    })
    const t0 = this.t
    this.anims.push(t => {
      if (!this.stormFx.visible) return
      clouds.forEach((c, i) => (c.x = x + [-50, 44, 0][i] + Math.sin(t * 1.4 + i) * 6))
      const e = t - t0
      let fl = 0
      bolts.forEach((b, i) => {
        const k = e - 0.7 - i * 1.2
        const on = k > 0 && k < 0.25 ? (k < 0.06 || (k > 0.12 && k < 0.2) ? 1 : 0.3) : 0
        b.alpha = on
        fl = Math.max(fl, on)
      })
      this.flash.alpha = fl * 0.35
    })
  }

  // Pháo hoa khi lên tầng: vòng sóng + tia vàng
  burst(id: BuildingId) {
    const slot = this.slots.get(id)
    if (!slot) return
    const [x, y] = SLOT[id]
    const c = new Container()
    c.position.set(x, y - slot.top / 2)
    const ring = new Sprite(texOf('ring', () => ringTex(160, 48, 2.5)))
    ring.anchor.set(0.5)
    ring.tint = hex(C.goldL)
    ring.blendMode = 'add'
    c.addChild(ring)
    const sparkT = texOf('spark', () => sparkTex(24))
    const parts = Array.from({ length: 16 }, (_, i) => {
      const s = soft(sparkT, C.goldL, 8, 1)
      const a = (i / 16) * Math.PI * 2
      c.addChild(s)
      return { s, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 20 }
    })
    this.glow.addChild(c)
    this.bursts.push({ c, t0: this.t, parts })
  }

  // Mỗi khung hình. cam: DU đang cuộn tới (để thị sai núi xa)
  tick(dt: number, cam: number) {
    if (!this.reduced) this.t += dt
    const t = this.t
    for (const a of this.anims) a(t, this.reduced ? 0 : dt)
    for (const s of this.slots.values()) for (const a of s.anims) a(t, dt)
    this.far.forEach((f, i) => (f.y = cam * (0.5 - i * 0.2)))
    // đèn theo giờ, chập chờn nhẹ
    this.lightsLevel += (this.mood.lights - this.lightsLevel) * Math.min(1, dt * 2)
    let i = 0
    for (const s of this.slots.values()) for (const l of s.lights) l.alpha = this.lightsLevel * (0.75 + 0.2 * Math.sin(t * 3 + i++))
    // pháo hoa
    this.bursts = this.bursts.filter(b => {
      const e = t - b.t0
      if (e > 1.4) {
        b.c.destroy({ children: true })
        return false
      }
      const ring = b.c.children[0] as Sprite
      ring.width = 30 + e * 220
      ring.height = ring.width * 0.32
      ring.alpha = Math.max(0, 1 - e / 0.9)
      for (const p of b.parts) {
        p.s.position.set(p.vx * e, p.vy * e + 40 * e * e)
        p.s.alpha = Math.max(0, 1 - e / 1.2)
      }
      return true
    })
    if (this.ring.visible) this.ring.alpha = 0.65 + 0.35 * Math.sin(t * 4.5)
  }

  topOf(id: BuildingId) {
    return this.slots.get(id)?.top ?? 60
  }

  destroy() {
    this.root.destroy({ children: true })
  }
}

