// Cảnh trận trên WebGL, diễn lại một chiến báo đã tính sẵn (luật tất định): mỗi lượt hai bên xông lên,
// kiếm khí / hoả cầu / sóng chấn / vuốt bay tới, trúng đòn thì mực văng, tia lửa, bật lùi, rung màn;
// quân ngã theo số thương vong và tan thành mực.
// Công pháp có hiệu ứng riêng: mưa kiếm (burst), khiên vàng (shield), hồi sinh (heal), độc vụ (weaken). Độ kiếp: sét.
import { Container, Sprite, Text, TilingSprite, type Texture } from 'pixi.js'
import {
  PIGMENT as C, battlefield, beast, boltTex, clawTex, cloud, crackTex, flyingSword, glowTex, mistTex, paper, puffTex, ringTex, slashTex, soldier,
  sparkTex, splashTex, type Theme, type Troop,
} from '@rok/art'
import type { Report, Skill } from '@rok/rules'
import { painted, texOf, type Painted } from './stage'

type Kind = 'man' | 'beast' | 'spirit'
type Squad = { c: Container; figs: Container[]; type: Troop; n0: number; n: number; per: number; label: Text; x: number; y: number }
type Tween = { t0: number; dur: number; fn: (k: number) => void; end?: () => void }

const hex = (c: string) => parseInt(c.slice(1), 16)
const ease = (k: number) => 1 - (1 - k) ** 3
const THEME: Record<Report['kind'], Theme> = { beast: 'wild', sect: 'sect', realm: 'forest', trib: 'storm' }
const REALM: Theme[] = ['forest', 'fire', 'ice']
const REALM_TINT = [C.malachite, C.cinnabarL, C.azuriteL]

export class Battle {
  readonly root = new Container()
  private cam = new Container() // camera: rung, giật zoom khi đòn nặng
  private field = new Container()
  private decal = new Container() // vết nứt trên mặt đất (dưới chân quân)
  private units = new Container({ sortableChildren: true })
  private fx = new Container()
  private zoom = 0
  private squads: Squad[][] = [[], []]
  private tweens: Tween[] = []
  private t = 0
  private shake = 0
  private theme: Theme
  private enemy: Kind
  private tint: string
  private down = new Set<Container>() // hình đã ngã

  constructor(
    private report: Report,
    private skills: [Skill | undefined, Skill | undefined],
    private w: number,
    private h: number,
  ) {
    this.theme = report.kind === 'realm' ? REALM[report.i] ?? 'forest' : THEME[report.kind]
    this.enemy = report.kind === 'trib' ? 'spirit' : report.kind === 'sect' ? 'man' : 'beast'
    this.tint = report.kind === 'realm' ? REALM_TINT[report.i] ?? C.ochre : C.ochre
    this.cam.pivot.set(w / 2, h / 2)
    this.cam.position.set(w / 2, h / 2)
    this.cam.addChild(this.field, this.decal, this.units, this.fx)
    this.root.addChild(this.cam)
    this.paint()
    this.wave(0)
  }

  // ---------- Dựng cảnh ----------

  private paint() {
    const { w, h } = this
    const pap = new TilingSprite({ texture: texOf('paper', () => paper(256)), width: w + 400, height: h + 400 })
    pap.position.set(-200, -200)
    pap.tileScale.set(0.5)
    const bg = painted(`field:${this.theme}:${Math.round(w)}x${Math.round(h)}`, () => battlefield(w, h, this.theme), Math.min(2, window.devicePixelRatio || 1))
    const s = new Sprite(bg.tex)
    s.scale.set(1 / bg.scale)
    this.field.addChild(pap, s)
    if (this.theme === 'storm') this.field.tint = 0x77709a // trời kiếp: tối cả sân
    // sương giữa hai trận tuyến
    const mist = new TilingSprite({ texture: texOf('mist:1', () => mistTex(512, 96, 2)), width: w + 200, height: 90 })
    mist.position.set(-100, h * 0.52)
    mist.alpha = this.theme === 'storm' ? 0.35 : 0.55
    this.field.addChild(mist)
    this.tick_.push(dt => (mist.tilePosition.x += dt * 8))
    // hạt theo cảnh: lá rơi, tàn lửa, tuyết, mưa
    const sparkT = texOf('spark', () => sparkTex(24))
    const color = { forest: C.malachiteL, fire: '#ffb35c', ice: '#ffffff', storm: '#b9a8ff', wild: C.goldL, sect: C.goldL }[this.theme]
    for (let i = 0; i < 26; i++) {
      const p = new Sprite(sparkT)
      p.anchor.set(0.5)
      p.tint = hex(color)
      p.blendMode = this.theme === 'ice' || this.theme === 'forest' ? 'normal' : 'add'
      p.width = p.height = 3 + (i % 3) * 2
      const x0 = ((i * 97) % 100) / 100, spd = 0.04 + (i % 5) * 0.012, off = i * 0.37
      const up = this.theme === 'fire' || this.theme === 'wild' || this.theme === 'sect'
      this.field.addChild(p)
      this.tick_.push(() => {
        const k = (this.t * spd + off) % 1
        p.position.set(x0 * w + Math.sin(this.t + i) * 12, up ? h * (1 - k) : h * k)
        p.alpha = Math.sin(k * Math.PI) * 0.8
      })
    }
  }
  private tick_: ((dt: number) => void)[] = []

  private sprite(p: Painted, x = 0, y = 0) {
    const s = new Sprite(p.tex)
    s.anchor.set(p.anchor[0], p.anchor[1])
    s.scale.set(1 / p.scale)
    s.position.set(x, y)
    return s
  }

  // Dựng hai đội cho đợt `fi` (độ kiếp có 3 đợt; đệ tử sống sót đi tiếp)
  wave(fi: number) {
    const f = this.report.fights[fi]
    if (!f) return
    // hiệu ứng đang chờ của đợt cũ còn trỏ vào hình sắp huỷ (ghi .y vào hình đã huỷ là văng lỗi): bỏ hết cùng lúc
    this.tweens = []
    this.fx.removeChildren().forEach(c => c.destroy({ children: true }))
    this.decal.removeChildren().forEach(c => c.destroy({ children: true }))
    this.units.removeChildren().forEach(c => c.destroy({ children: true }))
    this.down.clear()
    this.squads = [f.a.troops, f.b.troops].map((troops, side) => {
      const y = side ? this.h * 0.43 : this.h * 0.8
      const n = troops.length
      const x0 = (this.w - 400) / 2 // đội hình nằm trong cột 400 DU ở giữa
      return troops.map((t, k) => this.squad(side, t.type, t.n, x0 + (400 / (n + 1)) * (k + 1), y))
    })
    if (fi > 0) this.strikeAll()
  }

  private squad(side: number, type: Troop, n0: number, x: number, y: number): Squad {
    const kind: Kind = side ? this.enemy : 'man'
    const max = kind === 'man' ? 9 : kind === 'beast' ? 3 : 4
    const per = Math.max(1, Math.ceil(n0 / max))
    const count = Math.min(max, Math.ceil(n0 / per))
    const c = new Container()
    c.position.set(x, y)
    c.zIndex = y
    const figs: Container[] = []
    const cols = kind === 'man' ? 3 : 2
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols), col = i % cols
      const spread = kind === 'beast' ? 40 : kind === 'spirit' ? 34 : 23
      const fx = (col - (Math.min(cols, count - row * cols) - 1) / 2) * spread + (row % 2) * 8
      const fy = -row * (kind === 'beast' ? 14 : 12)
      let s: Container
      if (kind === 'spirit') {
        // đợt lôi kiếp: đám mây đen, lõi sét tím chớp nháy
        s = new Container()
        const cl = painted(`thunder:${i % 3}`, () => cloud(46, 61 + (i % 3), true))
        const core = new Sprite(texOf('glow', () => glowTex(64)))
        core.anchor.set(0.5)
        core.width = core.height = 34
        core.tint = 0xb9a4ff
        core.blendMode = 'add'
        core.y = -12
        s.addChild(core, this.sprite(cl))
        this.tick_.push(() => (core.alpha = 0.55 + 0.45 * Math.abs(Math.sin(this.t * 5 + i))))
      } else {
        const p = kind === 'man' ? painted(`sold:${type}:${side}`, () => soldier(type, side === 1)) : painted(`beast:${type}:${this.tint}`, () => beast(type, this.tint))
        s = this.sprite(p)
        const scale = (kind === 'beast' ? 1.7 : 1.75) * (1 - row * 0.06)
        s.scale.set(scale / p.scale)
        if (side === 1 && kind === 'beast') s.scale.x *= -1 // yêu thú nhìn xuống phía quân ta
      }
      s.position.set(fx, fy)
      s.zIndex = -row
      figs.push(s)
    }
    c.sortableChildren = true
    c.addChild(...figs)
    // bóng mực dưới đội hình + số quân
    const label = new Text({
      text: String(n0),
      style: { fontFamily: 'Alegreya', fontWeight: '800', fontSize: 15, fill: hex(side ? C.cinnabar : C.ink), stroke: { color: hex(C.paper), width: 4 } },
    })
    label.anchor.set(0.5, 0)
    label.position.set(0, 10)
    c.addChild(label)
    this.units.addChild(c)
    // xuất hiện: nhô lên từ mặt đất
    figs.forEach((s, i) => {
      const y0 = s.y
      s.alpha = 0
      this.add(0.35, k => ((s.alpha = k), (s.y = y0 + (1 - ease(k)) * 10)), undefined, i * 0.04)
    })
    return { c, figs, type, n0, n: n0, per, label, x, y }
  }

  // ---------- Diễn ----------

  private add(dur: number, fn: (k: number) => void, end?: () => void, delay = 0) {
    this.tweens.push({ t0: this.t + delay, dur, fn, end })
  }

  // Lượt r (1..) của đợt fi: số quân sau lượt nằm trong report
  round(fi: number, r: number, dur: number) {
    const f = this.report.fights[fi]
    const rd = f?.rounds[r - 1]
    if (!rd) return
    for (const side of [0, 1]) if (rd.cast[side]) this.cast(side, dur)
    const lunge = dur * 0.22
    for (const side of [0, 1]) {
      const foes = this.squads[1 - side].filter(q => q.n > 0)
      for (const q of this.squads[side]) {
        if (!q.n || !foes.length) continue
        const dir = side ? 1 : -1
        const y0 = q.y
        this.add(lunge * 2, k => (q.c.y = y0 + Math.sin(k * Math.PI) * 10 * dir))
        const target = foes[Math.floor(Math.random() * foes.length)]
        this.attack(side, q, target, dur)
      }
    }
    // thương vong hiện ra khi đòn tới
    this.add(0.01, () => {}, () => this.apply(rd.n, dur), dur * 0.5)
  }

  private attack(side: number, from: Squad, to: Squad, dur: number) {
    const kind: Kind = side ? this.enemy : 'man'
    const sx = from.c.x, sy = from.c.y - 14, tx = to.c.x, ty = to.c.y - 12
    const travel = dur * 0.3
    const start = dur * 0.12 + Math.random() * dur * 0.08
    if (kind === 'spirit') return this.bolt(tx, ty, start + travel)
    if (kind === 'beast') {
      const claw = new Sprite(texOf('claw', () => clawTex(64)))
      claw.anchor.set(0.5)
      claw.width = claw.height = 34
      claw.tint = hex(side ? '#ffd0c0' : C.silk)
      claw.blendMode = 'add'
      claw.position.set(tx, ty)
      claw.alpha = 0
      this.fx.addChild(claw)
      this.add(dur * 0.25, k => ((claw.alpha = Math.sin(k * Math.PI)), (claw.scale.set((34 / 64) * (0.8 + k * 0.4)))), () => claw.destroy(), start + travel)
      this.impact(tx, ty, start + travel, side, to)
      return
    }
    if (from.type === 'the') {
      // thể tu: dậm đất, sóng chấn nổ ở chỗ địch
      const ring = new Sprite(texOf('ring', () => ringTex(160, 48, 2.5)))
      ring.anchor.set(0.5)
      ring.tint = hex(side ? C.cinnabarL : C.goldL)
      ring.blendMode = 'add'
      ring.position.set(tx, to.c.y + 2)
      ring.alpha = 0
      this.fx.addChild(ring)
      this.add(dur * 0.35, k => ((ring.alpha = 1 - k), (ring.width = 20 + k * 70), (ring.height = ring.width * 0.32)), () => ring.destroy(), start + travel * 0.7)
      // đất nứt toả tia dưới chân địch, mờ dần
      const crack = new Sprite(texOf(`crack:${side}`, () => crackTex(128, 4 + side)))
      crack.anchor.set(0.5)
      crack.tint = hex(C.ink)
      crack.width = 64
      crack.height = 22
      crack.position.set(tx, to.c.y + 2)
      crack.alpha = 0
      this.decal.addChild(crack)
      this.add(1.4, k => (crack.alpha = k < 0.08 ? (k / 0.08) * 0.7 : 0.7 * (1 - (k - 0.08) / 0.92)), () => crack.destroy(), start + travel * 0.7)
      this.impact(tx, ty, start + travel * 0.7, side, to)
      this.punch(0.02, start + travel * 0.7)
      return
    }
    // kiếm khí (kiếm tu) hoặc hoả cầu (pháp tu) bay tới
    const tex: Texture = from.type === 'kiem' ? texOf('slash', () => slashTex()) : texOf('glow', () => glowTex(64))
    const p = new Sprite(tex)
    p.anchor.set(0.5)
    if (from.type === 'kiem') {
      p.width = 34
      p.height = 17
      p.rotation = Math.atan2(ty - sy, tx - sx)
      p.tint = hex(side ? C.cinnabarL : '#dff4ff')
    } else {
      p.width = p.height = 22
      p.tint = hex(side ? '#ff7a3c' : C.spirit)
    }
    p.blendMode = 'add'
    p.alpha = 0
    // bóng mờ bám theo (kiếm khí) / lõi trắng rực (hoả cầu)
    const ghosts =
      from.type === 'kiem'
        ? [0.07, 0.14, 0.21].map((lag, i) => {
            const g = new Sprite(tex)
            g.anchor.set(0.5)
            g.width = p.width
            g.height = p.height
            g.rotation = p.rotation
            g.tint = p.tint
            g.blendMode = 'add'
            g.visible = false
            this.fx.addChild(g)
            return { g, lag, a: 0.5 - i * 0.14 }
          })
        : []
    const core = new Sprite(texOf('glow', () => glowTex(64)))
    core.anchor.set(0.5)
    core.width = core.height = 9
    core.blendMode = 'add'
    core.alpha = 0
    core.visible = from.type === 'phap'
    this.fx.addChild(p, core)
    const sparkT = texOf('spark', () => sparkTex(24))
    const arc = from.type === 'phap' ? 28 : 8
    const at = (k: number) => {
      const e = ease(k)
      return [sx + (tx - sx) * e, sy + (ty - sy) * e - Math.sin(k * Math.PI) * arc] as const
    }
    this.add(travel, k => {
      p.alpha = 1
      p.position.set(...at(k))
      core.position.copyFrom(p.position)
      core.alpha = 0.9
      for (const { g, lag, a } of ghosts) {
        const kk = k - lag / Math.max(0.1, travel)
        g.visible = kk > 0
        if (kk > 0) (g.alpha = a), g.position.set(...at(kk))
      }
      if (from.type === 'phap' && Math.random() < 0.5) {
        const s = new Sprite(sparkT)
        s.anchor.set(0.5)
        s.width = s.height = 6
        s.tint = p.tint
        s.blendMode = 'add'
        s.position.copyFrom(p.position)
        this.fx.addChild(s)
        this.add(0.3, q => (s.alpha = 1 - q), () => s.destroy())
      }
    }, () => (p.destroy(), core.destroy(), ghosts.forEach(({ g }) => g.destroy())), start)
    this.impact(tx, ty, start + travel, side, to)
  }

  // Trúng đòn: loé sáng, mực văng (son nếu quân ta trúng), tia lửa toé, đội bị đánh bật lùi, rung màn
  private impact(x: number, y: number, at: number, side: number, to?: Squad) {
    const g = new Sprite(texOf('glow', () => glowTex(64)))
    g.anchor.set(0.5)
    g.tint = hex(side ? '#ffb4a4' : '#fff2c8')
    g.blendMode = 'add'
    g.position.set(x, y)
    g.alpha = 0
    const n = Math.floor(Math.random() * 3)
    const sp = new Sprite(texOf(`splash:${n}`, () => splashTex(128, 3 + n * 5)))
    sp.anchor.set(0.5)
    sp.tint = hex(side ? C.cinnabar : C.ink)
    sp.rotation = Math.random() * Math.PI * 2
    sp.position.set(x + (Math.random() - 0.5) * 10, y + 4)
    sp.alpha = 0
    this.fx.addChild(sp, g)
    this.add(0.28, k => ((g.alpha = (1 - k) * 0.9), (g.width = g.height = 18 + k * 40)), () => g.destroy(), at)
    this.add(0.6, k => ((sp.alpha = k < 0.15 ? 0.85 : 0.85 * (1 - (k - 0.15) / 0.85)), sp.scale.set((46 / 128) * (0.5 + ease(Math.min(1, k * 4)) * 0.6))), () => sp.destroy(), at)
    const sparkT = texOf('spark', () => sparkTex(24))
    for (let i = 0; i < 6; i++) {
      const s = new Sprite(sparkT)
      s.anchor.set(0.5)
      s.width = s.height = 5
      s.tint = g.tint
      s.blendMode = 'add'
      s.alpha = 0
      const a = Math.random() * Math.PI * 2, v = 30 + Math.random() * 40
      this.fx.addChild(s)
      this.add(0.35, k => (s.position.set(x + Math.cos(a) * v * k, y + Math.sin(a) * v * k + 30 * k * k), (s.alpha = 1 - k)), () => s.destroy(), at)
    }
    if (to) {
      const dir = to.y < this.h * 0.6 ? -1 : 1 // địch ở trên bị đẩy lên, quân ta bị đẩy xuống
      this.add(0.3, k => (to.c.pivot.y = -Math.sin(k * Math.PI) * (1 - k * 0.5) * 5 * dir), () => (to.c.pivot.y = 0), at)
    }
    this.add(0.01, () => {}, () => (this.shake = Math.min(6, this.shake + 2.2)), at)
  }
  private punch(a: number, at = 0) {
    this.add(0.01, () => {}, () => (this.zoom = Math.max(this.zoom, a)), at)
  }

  // Sét đánh xuống (lôi kiếp): chớp trắng toàn màn
  private bolt(x: number, y: number, at: number) {
    const b = new Sprite(texOf(`bolt:${1 + Math.floor(Math.random() * 3)}`, () => boltTex(64, 256, 1 + Math.floor(Math.random() * 3))))
    b.anchor.set(0.5, 1)
    b.width = 40
    b.height = y + 20
    b.position.set(x, y)
    b.blendMode = 'add'
    b.alpha = 0
    this.fx.addChild(b)
    this.add(0.3, k => (b.alpha = k < 0.15 || (k > 0.3 && k < 0.45) ? 1 : 0.25 * (1 - k)), () => b.destroy(), at)
    this.flash(at, 0.35)
    this.impact(x, y, at, 1)
    this.punch(0.03, at)
  }
  private strikeAll() {
    for (const q of this.squads[0]) this.bolt(q.c.x, q.c.y - 10, 0.1 + Math.random() * 0.2)
  }
  private flash(at: number, a: number) {
    const f = new Sprite(texOf('glow', () => glowTex(64)))
    f.anchor.set(0.5)
    f.position.set(this.w / 2, this.h / 2)
    f.width = this.w * 3
    f.height = this.h * 3
    f.tint = 0xf3edff
    f.blendMode = 'add'
    f.alpha = 0
    this.fx.addChild(f)
    this.add(0.4, k => (f.alpha = a * (1 - k)), () => f.destroy(), at)
  }

  // Công pháp của trưởng lão bên `side`
  private cast(side: number, dur: number) {
    const sk = this.skills[side]
    const own = this.squads[side], foe = this.squads[1 - side]
    if (!sk) return
    if (sk.kind === 'burst') {
      const swordP = painted('flysword', flyingSword)
      for (const q of foe) {
        if (!q.n) continue
        for (let i = 0; i < 6; i++) {
          const s = this.sprite(swordP, q.c.x + (Math.random() - 0.5) * 40, -20)
          s.scale.set(1.4 / swordP.scale, (side ? -1.4 : 1.4) / swordP.scale)
          if (side === 0) s.rotation = Math.PI
          this.fx.addChild(s)
          const ty = q.c.y - 6
          this.add(dur * 0.3, k => ((s.y = -20 + (ty + 20) * ease(k)), (s.alpha = 1)), () => s.destroy(), i * 0.04)
        }
        this.impact(q.c.x, q.c.y - 10, dur * 0.3, side, q)
      }
      this.punch(0.04, dur * 0.3)
      this.flash(dur * 0.3, 0.25)
    } else if (sk.kind === 'shield') {
      for (const q of own) {
        if (!q.n) continue
        const d = new Sprite(texOf('ring', () => ringTex(160, 48, 2.5)))
        d.anchor.set(0.5)
        d.tint = hex(C.goldL)
        d.blendMode = 'add'
        d.position.set(q.c.x, q.c.y - 10)
        d.width = 90
        d.height = 60
        this.fx.addChild(d)
        this.add(dur, k => (d.alpha = Math.sin(k * Math.PI) * 0.9), () => d.destroy())
      }
    } else if (sk.kind === 'heal') {
      for (const q of own) for (let i = 0; i < 8; i++) {
        const m = new Sprite(texOf('spark', () => sparkTex(24)))
        m.anchor.set(0.5)
        m.tint = hex(C.malachiteL)
        m.blendMode = 'add'
        m.width = m.height = 7
        const x0 = q.c.x + (Math.random() - 0.5) * 50
        this.fx.addChild(m)
        this.add(dur, k => ((m.position.set(x0, q.c.y - k * 50)), (m.alpha = Math.sin(k * Math.PI))), () => m.destroy(), i * 0.05)
      }
    } else if (sk.kind === 'weaken') {
      for (const q of foe) {
        if (!q.n) continue
        const m = new Sprite(texOf('puff', () => puffTex()))
        m.anchor.set(0.5)
        m.tint = 0x6a4a9a
        m.position.set(q.c.x, q.c.y - 10)
        this.fx.addChild(m)
        this.add(dur * 1.6, k => ((m.alpha = Math.sin(k * Math.PI) * 0.8), (m.width = m.height = 50 + k * 30)), () => m.destroy())
      }
    }
  }

  // Cập nhật số quân: hình ngã xuống (hoặc hồi sinh), số nổi lên
  private apply(n: [number[], number[]], dur: number) {
    n.forEach((ns, side) =>
      ns.forEach((v, k) => {
        const q = this.squads[side][k]
        if (!q) return
        const d = q.n - v
        q.n = v
        q.label.text = String(v)
        const alive = v > 0 ? Math.min(q.figs.length, Math.ceil(v / q.per)) : 0
        q.figs.forEach((s, i) => {
          if (i >= alive && !this.down.has(s)) {
            this.down.add(s)
            const r0 = s.rotation, y0 = s.y
            this.add(0.45, e => ((s.rotation = r0 + e * (i % 2 ? 1.3 : -1.3)), (s.alpha = 1 - e), (s.y = y0 + e * 4)), () => (s.visible = false))
            if (dur) this.dissolve(q.c.x + s.x, q.c.y + s.y - 10)
          } else if (i < alive && this.down.has(s)) {
            this.down.delete(s)
            s.visible = true
            s.rotation = 0
            this.add(0.4, e => (s.alpha = e))
          }
        })
        if (d !== 0) this.number(q, d, dur)
      }),
    )
  }

  // Hình ngã tan thành mực: vài vệt mực bốc lên rồi loãng dần
  private dissolve(x: number, y: number) {
    const puffT = texOf('puff', () => puffTex())
    for (let i = 0; i < 4; i++) {
      const m = new Sprite(puffT)
      m.anchor.set(0.5)
      m.tint = hex(C.ink)
      m.alpha = 0
      const dx = (Math.random() - 0.5) * 16, rise = 14 + Math.random() * 16
      this.fx.addChild(m)
      this.add(0.9, k => (m.position.set(x + dx * (0.4 + k), y - rise * ease(k)), (m.width = m.height = 8 + k * 14), (m.alpha = Math.sin(k * Math.PI) * 0.45)), () => m.destroy(), 0.12 + i * 0.05)
    }
  }

  private number(q: Squad, d: number, dur: number) {
    const t = new Text({
      text: d > 0 ? `−${d}` : `+${-d}`,
      style: { fontFamily: 'Alegreya', fontWeight: '900', fontSize: 17, fill: hex(d > 0 ? C.cinnabar : C.malachite), stroke: { color: hex(C.paper), width: 4 } },
    })
    t.anchor.set(0.5)
    t.position.set(q.c.x + 26, q.c.y - 34)
    this.fx.addChild(t)
    this.add(Math.max(0.6, dur), k => ((t.y = q.c.y - 34 - ease(k) * 18), (t.alpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3), t.scale.set(k < 0.15 ? 1.4 - k * 2.6 : 1)), () => t.destroy())
  }

  // Dấu ấn thắng/bại đóng xuống: giật zoom, rung màn
  slam() {
    this.zoom = 0.05
    this.shake = 9
  }

  // Nhảy tới cuối (bỏ qua): số quân cuối của đợt cuối
  jump() {
    const fi = this.report.fights.length - 1
    this.wave(fi)
    const last = this.report.fights[fi].rounds.at(-1)
    if (last) this.apply(last.n, 0)
  }

  tick(dt: number) {
    this.t += dt
    for (const f of this.tick_) f(dt)
    this.tweens = this.tweens.filter(tw => {
      if (this.t < tw.t0) return true
      const k = Math.min(1, (this.t - tw.t0) / tw.dur)
      tw.fn(k)
      if (k >= 1) {
        tw.end?.()
        return false
      }
      return true
    })
    // rung màn giảm dần
    this.shake *= Math.exp(-dt * 9)
    this.zoom *= Math.exp(-dt * 7)
    this.cam.scale.set(1 + this.zoom)
    this.cam.position.set(this.w / 2 + (Math.random() - 0.5) * this.shake, this.h / 2 + (Math.random() - 0.5) * this.shake)
  }

  destroy() {
    this.root.destroy({ children: true })
  }
}
