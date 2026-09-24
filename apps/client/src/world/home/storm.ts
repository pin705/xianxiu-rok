// Thời tiết và kiếp vân: mưa, linh khí bay lên, chớp; xoáy mây kiếp vân và những đợt sét đánh xuống Chủ điện.
import { Container, Sprite, TilingSprite, type Texture } from 'pixi.js'
import { PIGMENT as C, boltTex, rainTex, rng, vortexTex, type Pt } from '@rok/art'
import { HOME, SLOT } from '../layout'
import { THUNDER, ink, texOf, fxTex } from '../stage'
import type { Home } from '../home'
import { soft } from './kit'

// Kiếp vân, mưa (không nhuộm theo giờ), lớp cộng sáng + linh khí bay lên, chớp sét
export function buildWeather(h: Home, sparkT: Texture) {
  const rainT = texOf('rain', () => rainTex(128))
  h.rain = [0.9, 0.55].map(sc => {
    const r = new TilingSprite({ texture: rainT, width: 2600, height: HOME.h + 800 })
    r.position.set(-1100, -400)
    r.tileScale.set(sc)
    r.visible = false
    return r
  })
  h.scene.addChild(h.stormFx, ...h.rain)
  h.stormFx.visible = false
  h.scene.addChild(h.glow, h.over)
  for (let i = 0; i < 18; i++) {
    const m = soft(sparkT, C.spirit, 5, 0)
    const x0 = 40 + ((i * 71) % 320),
      y0 = 480 + ((i * 37) % 320),
      dur = 7 + (i % 5),
      off = (i * 1.7) % dur
    h.glow.addChild(m)
    h.anims.push(t => {
      const k = ((t + off) % dur) / dur
      m.position.set(x0 + Math.sin(t + i) * 6, y0 - k * 170)
      m.alpha = Math.sin(k * Math.PI) * 0.9
    })
  }
  h.flash.rect(-1300, -400, 3000, 2000).fill({ color: 0xffffff })
  h.flash.alpha = 0
  h.root.addChild(h.flash)
}

// Kiếp vân: xoáy mây hai lớp ép dẹt (nhìn từ dưới lên), lớp trong quay nhanh hơn nên mây như bị hút vào mắt bão;
// chớp loé trong mây; sét đánh theo lịch trong tick()
export function buildStorm(h: Home) {
  const [x, y] = SLOT.chuDien
  // mắt bão lệch sang khoảng trời trống bên phải (chỗ mặt trời/trăng, đã tắt khi trời kiếp): trên điện thoại
  // thẻ nhiệm vụ che ngay phía trên Chủ điện; sét quật chéo xuống mái cũng dữ hơn đánh thẳng
  const eye: Pt = [x + 100, y - 165]
  h.storm.eye = eye
  const glowT = fxTex.glow()
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
  h.vortex.addChild(disk, halo, core, flick)
  const r = rng(77)
  let next = 0,
    fl = 0
  h.anims.push((t, dt) => {
    if (!h.vortex.visible) return
    layers[0].rotation += dt * 0.32
    layers[1].rotation += dt * 0.75
    const f = h.storm.flare
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
export function strike(h: Home, big: boolean) {
  const [x, y] = SLOT.chuDien
  const hit: Pt = [x + (Math.random() - 0.5) * 30, y - h.topOf('chuDien') * 0.8]
  const glowT = fxTex.glow()
  const sparkT = fxTex.spark()
  const c = new Container()
  // tia sét nét bút từ mắt bão xuống mái: hai dáng khác nhau thay phiên (chớp — tắt — chớp lại)
  const eye = h.storm.eye,
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
  h.play(
    c,
    0.9,
    e => {
      if (!re && e > 0.12) {
        re = true
        g.visible = false
        g2.visible = true
      }
      g.alpha = g2.alpha = e < 0.07 ? 1 : e < 0.12 ? 0.12 : e < 0.26 ? 0.95 : Math.max(0, 1 - (e - 0.26) / 0.25)
      bloom.alpha = Math.max(0, 1 - e / 0.5)
      bloom.scale.set(((big ? 150 : 100) / 64) * (0.6 + e))
      for (const p of parts) {
        p.s.position.set(hit[0] + p.vx * e, hit[1] + p.vy * e + 160 * e * e)
        p.s.alpha = Math.max(0, 1 - e / 0.8)
      }
    },
    h.stormFx,
  )
  h.flashAt(big ? 0.6 : 0.38, 0xf3edff)
  h.shakeA = big ? 9 : 5
  h.storm.flare = 1
}
