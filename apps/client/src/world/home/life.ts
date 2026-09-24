// Sinh khí của núi: đệ tử lên xuống bậc đá, tia nắng, chim, bướm, cánh mai rơi, đom đóm.
import { Container, Sprite, type Texture } from 'pixi.js'
import { lerp, PIGMENT as C, bird, butterfly, disciple, mix, petalTex, type Pt } from '@rok/art'
import { DECOR } from '../layout'
import { hex, painted, sprite, texOf, fxTex } from '../stage'
import type { Home } from '../home'
import { soft } from './kit'

// Đệ tử lên xuống bậc đá: nhún theo bước, nhỏ dần khi lên cao, hiện ra từ sương ở chân bậc
export function walker(h: Home, path: readonly (readonly [number, number])[], seed: number) {
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
  h.land.addChild(s)
  const trip = len / 5,
    rest = 3,
    cycle = 2 * (trip + rest),
    off = seed * 7.3
  h.anims.push(t => {
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
export function life(h: Home, sparkT: Texture) {
  // tia nắng xiên từ phía mặt trời
  const rayT = fxTex.ray()
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
    h.anims.push(t => (r.alpha = 0.1 + 0.06 * Math.sin(t * 0.35 + ph)))
  }
  h.land.addChild(rays)
  h.day.push(rays)
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
  h.land.addChild(flock)
  h.fair.push(flock)
  h.anims.push(t => {
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
      h.land.addChild(pt)
      const dur = 5 + i * 1.3,
        off = n * 2.1 + i * 1.9,
        x0 = bx + (i - 1) * 9 * bs,
        y0 = by - 30 * bs
      h.anims.push(t => {
        const k = ((t + off) % dur) / dur
        pt.position.set(x0 + Math.sin(t * 1.7 + i) * 6 + k * 14, y0 + k * 44)
        pt.rotation = t * 2 + i
        pt.alpha = Math.sin(k * Math.PI)
      })
    }
    if (n % 2) return
    const b = sprite(fly[0])
    b.scale.set(0.7 / fly[0].scale)
    h.land.addChild(b)
    h.day.push(b)
    h.anims.push(t => {
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
    h.glow.addChild(f)
    h.night.push(f)
    h.anims.push(t => f.position.set(x0 + Math.sin(t * 0.5 + i) * 14, y0 + Math.sin(t * 0.7 + i * 2) * 8))
  }
}
