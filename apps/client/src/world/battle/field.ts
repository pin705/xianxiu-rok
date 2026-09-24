// Sân trận theo cảnh (rừng, lửa, băng, lôi kiếp, đồng, tông môn, tháp) và đội hình hai bên.
import { Container, Sprite, Text, TilingSprite } from 'pixi.js'
import { PIGMENT as C, battlefield, beast, cloud, mistTex, soldier, type Theme, type Troop } from '@rok/art'
import type { Report } from '@rok/rules'
import { hex, painted, sprite, texOf, fxTex } from '../stage'
import type { Battle } from '../battle'
import { ease, type Kind, type Squad } from './kit'

export const THEME: Record<Report['kind'], Theme> = {
  beast: 'wild',
  sect: 'sect',
  realm: 'forest',
  tower: 'tower',
  trib: 'storm',
  pvp: 'sect',
  spot: 'wild',
}
export const REALM: Theme[] = ['forest', 'fire', 'ice', 'storm', 'storm'] // Lôi Trì, Hỗn Độn: trời tối như lôi kiếp
export const REALM_TINT = [C.malachite, C.cinnabarL, C.azuriteL]

export function paint(b: Battle) {
  const { w, h } = b
  const pap = new TilingSprite({ texture: fxTex.paper(), width: w + 400, height: h + 400 })
  pap.position.set(-200, -200)
  pap.tileScale.set(0.5)
  const bg = painted(
    `field:${b.theme}:${Math.round(w)}x${Math.round(h)}`,
    () => battlefield(w, h, b.theme),
    Math.min(2, window.devicePixelRatio || 1),
  )
  const s = new Sprite(bg.tex)
  s.scale.set(1 / bg.scale)
  b.field.addChild(pap, s)
  if (b.theme === 'storm') b.field.tint = 0x77709a // trời kiếp: tối cả sân
  // sương giữa hai trận tuyến
  const mist = new TilingSprite({ texture: texOf('mist:1', () => mistTex(512, 96, 2)), width: w + 200, height: 90 })
  mist.position.set(-100, h * 0.52)
  mist.alpha = b.theme === 'storm' ? 0.35 : 0.55
  b.field.addChild(mist)
  b.tick_.push(dt => (mist.tilePosition.x += dt * 8))
  // hạt theo cảnh: lá rơi, tàn lửa, tuyết, mưa
  const sparkT = fxTex.spark()
  const color = {
    forest: C.malachiteL,
    fire: '#ffb35c',
    ice: '#ffffff',
    storm: '#b9a8ff',
    wild: C.goldL,
    sect: C.goldL,
    tower: C.goldL,
  }[b.theme]
  for (let i = 0; i < 26; i++) {
    const p = new Sprite(sparkT)
    p.anchor.set(0.5)
    p.tint = hex(color)
    p.blendMode = b.theme === 'ice' || b.theme === 'forest' ? 'normal' : 'add'
    p.width = p.height = 3 + (i % 3) * 2
    const x0 = ((i * 97) % 100) / 100,
      spd = 0.04 + (i % 5) * 0.012,
      off = i * 0.37
    const up = b.theme === 'fire' || b.theme === 'wild' || b.theme === 'sect' || b.theme === 'tower'
    b.field.addChild(p)
    b.tick_.push(() => {
      const k = (b.t * spd + off) % 1
      p.position.set(x0 * w + Math.sin(b.t + i) * 12, up ? h * (1 - k) : h * k)
      p.alpha = Math.sin(k * Math.PI) * 0.8
    })
  }
}

// Dựng một đội: hình theo loại (người, yêu thú, mây sét), số quân, nhô lên từ mặt đất
export function squad(b: Battle, side: number, type: Troop, n0: number, x: number, y: number, tier = 1): Squad {
  const kind: Kind = side ? b.enemy : 'man'
  const max = kind === 'man' ? 9 : kind === 'beast' ? 3 : 4
  const per = Math.max(1, Math.ceil(n0 / max))
  const count = Math.min(max, Math.ceil(n0 / per))
  const c = new Container()
  c.position.set(x, y)
  c.zIndex = y
  const figs: Container[] = []
  const cols = kind === 'man' ? 3 : 2
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols),
      col = i % cols
    const spread = kind === 'beast' ? 40 : kind === 'spirit' ? 34 : 23
    const fx = (col - (Math.min(cols, count - row * cols) - 1) / 2) * spread + (row % 2) * 8
    const fy = -row * (kind === 'beast' ? 14 : 12)
    let s: Container
    if (kind === 'spirit') {
      // đợt lôi kiếp: đám mây đen, lõi sét tím chớp nháy
      s = new Container()
      const cl = painted(`thunder:${i % 3}`, () => cloud(46, 61 + (i % 3), true))
      const core = new Sprite(fxTex.glow())
      core.anchor.set(0.5)
      core.width = core.height = 34
      core.tint = 0xb9a4ff
      core.blendMode = 'add'
      core.y = -12
      s.addChild(core, sprite(cl))
      b.tick_.push(() => (core.alpha = 0.55 + 0.45 * Math.abs(Math.sin(b.t * 5 + i))))
    } else {
      // bậc 1–3 chung một dáng đệ tử
      const p =
        kind === 'man'
          ? painted(`sold:${type}:${side}:${Math.max(3, tier)}`, () => soldier(type, side === 1, tier))
          : painted(`beast:${type}:${b.tint}`, () => beast(type, b.tint))
      s = sprite(p)
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
    style: {
      fontFamily: 'Alegreya',
      fontWeight: '800',
      fontSize: 15,
      fill: hex(side ? C.cinnabar : C.ink),
      stroke: { color: hex(C.paper), width: 4 },
    },
  })
  label.anchor.set(0.5, 0)
  label.position.set(0, 10)
  c.addChild(label)
  b.units.addChild(c)
  // xuất hiện: nhô lên từ mặt đất
  figs.forEach((s, i) => {
    const y0 = s.y
    s.alpha = 0
    b.add(
      0.35,
      k => {
        s.alpha = k
        s.y = y0 + (1 - ease(k)) * 10
      },
      undefined,
      i * 0.04,
    )
  })
  return { c, figs, type, n0, n: n0, per, label, x, y }
}
