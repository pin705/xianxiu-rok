// Cảnh núi tông môn trên WebGL. Hình tĩnh vẽ tay nướng thành texture một lần; mọi chuyển động
// (sương trôi, thác chảy, hạc bay, khói, lửa, linh khí, đèn đêm) do GPU diễn mỗi khung hình.
import { Container, Graphics, Sprite, TilingSprite, type Texture } from 'pixi.js'
import {
  PIGMENT as C, bamboo, beamTex, blossom, building, cloud, crane, disciple, fallTex, farRange, flag, glowTex, ledge, mistTex, mix, paper,
  peak, pine, plot, puffTex, rainTex, rayTex, ringTex, rng, rock, scaffold, sparkTex, stairway, stoneLantern, tierOf, vortexTex,
  type Fx, type Kind, type Pt,
} from '@rok/art'
import { BUILDINGS, IDS, type BuildingId, type State } from '@rok/rules'
import { DECOR, HOME, LEDGES, MISTS, PINES, SLOT, STAIRS } from './layout'
import { painted, texOf, type Painted } from './stage'

export type Phase = 'dawn' | 'day' | 'dusk' | 'night'
export type HomeView = {
  game: State
  seal: Record<BuildingId, string>
  selected: BuildingId | null
  storm: number // độ kiếp: số đợt sét sẽ đánh (0 = trời yên)
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
// Trộn hai màu 0xRRGGBB
const lerpC = (a: number, b: number, k: number) => {
  const ch = (s: number) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * k)
  return (ch(16) << 16) | (ch(8) << 8) | ch(0)
}

// Tia sét phân nhánh: chia đôi đoạn thẳng nhiều lần, lệch ngẫu nhiên; vẽ ba lớp (quầng tím, thân sáng, lõi trắng)
function lightning(g: Graphics, a: Pt, b: Pt, seed: number, size = 1) {
  const r = rng(seed)
  const jag = (p0: Pt, p1: Pt, rough: number, depth: number) => {
    let pts: Pt[] = [p0, p1]
    let off = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * rough
    for (let d = 0; d < depth; d++, off /= 2)
      pts = pts.flatMap((p, i): Pt[] => {
        if (!i) return [p]
        const q = pts[i - 1], nx = q[1] - p[1], ny = p[0] - q[0], l = Math.hypot(nx, ny) || 1, k = (r() - 0.5) * off
        return [[(p[0] + q[0]) / 2 + (nx / l) * k, (p[1] + q[1]) / 2 + (ny / l) * k], p]
      })
    return pts
  }
  const main = jag(a, b, 0.28, 6)
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), dir = Math.atan2(b[1] - a[1], b[0] - a[0])
  const paths: [Pt[], number][] = [[main, 1]]
  for (let i = 0; i < 4; i++) {
    const k = 0.12 + r() * 0.6, from = main[Math.floor(k * (main.length - 1))]
    const l = len * (0.18 + r() * 0.25) * (1 - k * 0.5), an = dir + (r() < 0.5 ? -1 : 1) * (0.45 + r() * 0.6)
    paths.push([jag(from, [from[0] + Math.cos(an) * l, from[1] + Math.sin(an) * l], 0.35, 4), 0.45])
  }
  g.clear()
  for (const [w, color, alpha] of [[10, 0x8d6bff, 0.2], [3.6, 0xcbb8ff, 0.7], [1.4, 0xffffff, 1]] as const)
    for (const [pts, s] of paths) g.poly(pts.flat(), false).stroke({ width: w * s * size, color, alpha, cap: 'round', join: 'round' })
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
  private sun: Sprite
  private moon: Sprite
  private stars = new Container()
  private slots = new Map<BuildingId, Slot>()
  private bLayer = new Container()
  private ring: Sprite
  private scene = new Container() // mọi thứ rung khi sét đánh
  private stormFx = new Container()
  private rain: TilingSprite[] = []
  private flash = new Graphics()
  private flashA = 0
  private shakeA = 0
  private plays: Play[] = []
  private lamps: Sprite[] = []
  private anims: Anim[] = []
  private t = 0 // đồng hồ cảnh (đứng yên khi giảm chuyển động)
  private rt = 0 // đồng hồ thật, cho hiệu ứng thoáng qua
  private mood = MOOD.day
  private stormK = 0 // 0 trời yên … 1 kiếp vân phủ kín
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
    this.sun = soft(glowT, '#f7cf9a', 64)
    this.sun.position.set(318, 150)
    this.moon = soft(glowT, '#f2efe2', 60)
    this.moon.position.set(86, 140)
    this.root.addChild(this.sun, this.moon, this.stars)
    this.land = new Container()
    this.scene.addChild(this.land)
    this.root.addChild(this.scene)
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
    this.land.addChild(sprite(painted('peak:l', () => peak(220, 130, 33, -0.1)), 96, 400))
    this.land.addChild(sprite(painted('peak:r', () => peak(230, 150, 35, 0.12)), 318, 404))
    this.land.addChild(sprite(painted('peak:main', () => peak(300, 190, 31, 0.03)), 205, 396))
    this.mist(262, 70, 3, 0.85, 700)

    // Các tầng núi, xen sương; vách thác ở phải
    const byLedge = (i: number) => {
      const [x, y, w, h, seed] = LEDGES[i]
      this.land.addChild(sprite(painted(`ledge:${i}`, () => ledge(w, h, seed)), x, y))
      for (const [px, py, s, ps] of PINES) if (Math.abs(py - y) < 8) this.land.addChild(sprite(painted(`pine:${ps}`, () => pine(s, ps)), px, py))
      for (const [path, sw, after] of STAIRS) if (after === i) this.land.addChild(sprite(painted(`stair:${path[0]}`, () => stairway(path, sw, i + 1))))
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
    byLedge(6)
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
    for (const [kind, x, y, s, seed] of DECOR) {
      const p =
        kind === 'blossom' ? painted(`blossom:${s}:${seed}`, () => blossom(s, seed))
        : kind === 'bamboo' ? painted(`bamboo:${s}:${seed}`, () => bamboo(s, seed))
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
    this.land.addChild(sprite(painted('rock:l', () => rock(110, 70, 41)), 36, 880))
    this.land.addChild(sprite(painted('rock:r', () => rock(90, 56, 43)), 372, 886))
    this.land.addChild(sprite(painted('pine:fg1', () => pine(1.9, 45)), 40, 850))
    this.land.addChild(sprite(painted('pine:fg2', () => pine(1.5, 47)), 368, 872))

    // Kiếp vân, mưa (không nhuộm theo giờ), rồi lớp cộng sáng
    const rainT = texOf('rain', () => rainTex(128))
    this.rain = [0.9, 0.55].map(sc => {
      const r = new TilingSprite({ texture: rainT, width: 1400, height: HOME.h + 800 })
      r.position.set(-500, -400)
      r.tileScale.set(sc)
      r.visible = false
      return r
    })
    this.scene.addChild(this.stormFx, ...this.rain)
    this.stormFx.visible = false

    // Linh khí bay lên
    this.scene.addChild(this.glow)
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
    this.mood = MOOD[v.phase]
    this.sky.texture = skyTex(v.phase)
    if (v.storm && !this.storm.n) {
      if (!this.stormFx.children.length) this.buildStorm()
      Object.assign(this.storm, { at: this.rt, struck: 0 })
    }
    this.storm.n = v.storm
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

  // Kiếp vân: xoáy mây hai lớp ép dẹt (nhìn từ dưới lên), lớp trong quay nhanh hơn nên mây như bị hút vào mắt bão;
  // chớp loé trong mây; sét đánh theo lịch trong tick()
  private buildStorm() {
    const [x, y] = SLOT.chuDien
    const eye: Pt = [x, y - 196]
    this.storm.eye = eye
    const glowT = texOf('glow', () => glowTex(64))
    const disk = new Container()
    disk.position.set(...eye)
    disk.scale.y = 0.4
    const layers = ([[256, 5, 3, 1.6, 460], [192, 11, 2, 2.3, 230]] as const).map(([px, seed, arms, tw, size]) => {
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
    this.stormFx.addChild(disk, halo, core, flick)
    const r = rng(77)
    let next = 0, fl = 0
    this.anims.push((t, dt) => {
      if (!this.stormFx.visible) return
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
    const g = new Graphics()
    g.blendMode = 'add'
    const seed = Math.floor(Math.random() * 1e6)
    lightning(g, this.storm.eye, hit, seed, big ? 1.5 : 1)
    const bloom = soft(glowT, '#e6dcff', big ? 150 : 100, 0)
    bloom.position.set(...hit)
    const parts = Array.from({ length: big ? 22 : 12 }, (_, i) => {
      const s = soft(sparkT, i % 3 ? '#cbb8ff' : '#ffffff', 5 + (i % 4) * 2, 0)
      const a = -Math.PI * (0.1 + Math.random() * 0.8), v = 60 + Math.random() * (big ? 120 : 70)
      c.addChild(s)
      return { s, vx: Math.cos(a) * v, vy: Math.sin(a) * v }
    })
    c.addChild(g, bloom)
    let re = false
    this.play(
      c,
      0.9,
      e => {
        if (!re && e > 0.12) (re = true), lightning(g, this.storm.eye, hit, seed + 1, big ? 1.5 : 1)
        g.alpha = e < 0.07 ? 1 : e < 0.12 ? 0.12 : e < 0.26 ? 0.95 : Math.max(0, 1 - (e - 0.26) / 0.25)
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
    const add = (s: Sprite, ax = 0.5, ay = 0.5) => (s.anchor.set(ax, ay), (s.tint = hex(C.goldL)), (s.blendMode = 'add'), s)
    const c = new Container()
    c.position.set(x, y)
    const rays = big ? Array.from({ length: 12 }, () => add(new Sprite(texOf('ray', () => rayTex())), 0.5, 1)) : []
    rays.forEach(r => r.position.set(0, mid))
    const pillar = add(new Sprite(texOf('beam', () => beamTex())), 0.5, 1)
    pillar.height = big ? 760 : 260
    const halo = soft(glowT, C.goldL, w * (big ? 2.4 : 1.5), 0)
    halo.position.set(0, mid)
    const ring = add(new Sprite(texOf('ring', () => ringTex(160, 48, 2.5))))
    c.addChild(...rays, pillar, halo, ring)
    const r = rng(Math.floor(this.rt * 1000) + 1)
    const parts = Array.from({ length: big ? 60 : 24 }, () => {
      const s = soft(sparkT, r() < 0.3 ? '#ffffff' : C.goldL, 5 + r() * 6, 0)
      const a = -Math.PI / 2 + (r() - 0.5) * 2.4, v = (big ? 130 : 80) * (0.45 + r())
      c.addChild(s)
      return { s, x: (r() - 0.5) * w * 0.5, y: mid * (0.4 + r()), vx: Math.cos(a) * v, vy: Math.sin(a) * v }
    })
    const dur = big ? 2.8 : 1.6
    this.play(c, dur, e => {
      const k = e / dur
      pillar.width = (big ? 80 : 34) * Math.min(1, e / 0.12) * (1 - k * 0.75)
      pillar.alpha = Math.min(1, e / 0.08) * (1 - k) ** 1.6
      halo.alpha = Math.min(1, e / 0.1) * Math.max(0, 1 - e / (dur * 0.6))
      ring.width = 24 + e * (big ? 460 : 240)
      ring.height = ring.width * 0.3
      ring.alpha = Math.max(0, 1 - e / (big ? 1.3 : 0.9))
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
    this.stormK += ((st.n ? 1 : 0) - this.stormK) * Math.min(1, dt * 2.2)
    const k = this.stormK, m = this.mood, sm = MOOD.storm
    this.world.tint = this.land.tint = lerpC(m.tint, sm.tint, k)
    this.stormSky.alpha = k
    this.sun.alpha = m.sun * (1 - k)
    this.moon.alpha = m.moon * (1 - k)
    this.stars.alpha = m.stars * (1 - k)
    this.stormFx.visible = k > 0.01
    this.stormFx.alpha = k
    this.rain.forEach((r, i) => {
      r.visible = k > 0.01
      r.alpha = k * (i ? 0.35 : 0.6)
      r.tilePosition.x -= dt * (i ? 50 : 110)
      r.tilePosition.y += dt * (i ? 240 : 420)
    })
    if (st.n) while (st.struck < st.n && this.rt - st.at >= 0.7 + st.struck * 1.2) this.strike(++st.struck === st.n)
    st.flare *= Math.exp(-dt * 4)
    // đèn theo giờ, chập chờn nhẹ
    this.lightsLevel += (m.lights + (sm.lights - m.lights) * k - this.lightsLevel) * Math.min(1, dt * 2)
    let i = 0
    for (const s of this.slots.values()) for (const l of s.lights) l.alpha = this.lightsLevel * (0.75 + 0.2 * Math.sin(t * 3 + i++))
    for (const l of this.lamps) l.alpha = this.lightsLevel * (0.7 + 0.25 * Math.sin(t * 4.3 + l.x))
    // hiệu ứng thoáng qua, loé sáng, rung
    this.plays = this.plays.filter(p => {
      const e = this.rt - p.t0
      if (e >= p.dur) return void p.c.destroy({ children: true }), false
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

