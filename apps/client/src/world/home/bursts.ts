// Hiệu ứng thoáng qua trên công trình: mừng lên tầng, chạm công trình, vật phẩm bay lên từ công trình sản xuất.
import { Container, Sprite } from 'pixi.js'
import { PIGMENT as C, burstTex, mix, itemIcon, ringTex, rng } from '@rok/art'
import { BUILDINGS, type BuildingId } from '@rok/rules'
import { SLOT } from '../layout'
import { DRY, back, hex, ink, LAST_DRY, painted, sprite, fxTex } from '../stage'
import type { Home } from '../home'
import { GOLD, soft } from './kit'

// Lên tầng: cột sáng vàng, sóng vòng, tia vàng rơi theo trọng lực, loé sáng.
// Chủ điện (đột phá cảnh giới sau độ kiếp) thì lớn gấp bội, thêm hào quang toả tia.
export function burst(h: Home, id: BuildingId) {
  const slot = h.slots.get(id)
  if (!slot) return
  const big = id === 'chuDien'
  const [x, y, w] = SLOT[id]
  const mid = -slot.top * 0.5
  const glowT = fxTex.glow()
  const sparkT = fxTex.spark()
  const add = (s: Sprite, ax = 0.5, ay = 0.5) => {
    s.anchor.set(ax, ay)
    s.tint = hex(C.goldL)
    s.blendMode = 'add'
    return s
  }
  const c = new Container()
  c.position.set(x, y)
  const rays = big ? Array.from({ length: 12 }, () => add(new Sprite(fxTex.ray()), 0.5, 1)) : []
  rays.forEach(r => r.position.set(0, mid))
  const pillar = add(new Sprite(fxTex.beam()), 0.5, 1)
  pillar.height = big ? 760 : 260
  pillar.tint = hex(C.gold)
  const halo = soft(glowT, C.gold, w * (big ? 2 : 1.3), 0)
  halo.position.set(0, mid)
  // tia bút vàng mảnh toả sau lưng công trình (背光) + vòng mực vàng lan trên đất: bung vượt cỡ rồi thu, khô tan dần
  const star = ink('lvstar', (f, k) => burstTex(128, 17, DRY[f], k * 0.5), GOLD, w * (big ? 1.7 : 1.15))
  star.c.position.set(x, y + mid)
  h.aura.addChild(star.c)
  const s0 = star.c.scale.x
  const ring = ink('lvring', (f, k) => ringTex(256, 80, 7, 5, DRY[f], k), GOLD, 24)
  const r0 = ring.c.scale.x
  c.addChild(...rays, pillar, halo, ring.c)
  const r = rng(Math.floor(h.rt * 1000) + 1)
  const parts = Array.from({ length: big ? 60 : 24 }, () => {
    const s = soft(sparkT, r() < 0.3 ? '#ffffff' : C.goldL, 5 + r() * 6, 0)
    const a = -Math.PI / 2 + (r() - 0.5) * 2.4,
      v = (big ? 130 : 80) * (0.45 + r())
    c.addChild(s)
    return { s, x: (r() - 0.5) * w * 0.5, y: mid * (0.4 + r()), vx: Math.cos(a) * v, vy: Math.sin(a) * v }
  })
  const dur = big ? 2.8 : 1.6
  h.play(c, dur, e => {
    const k = e / dur
    pillar.width = (big ? 80 : 34) * Math.min(1, e / 0.12) * (1 - k * 0.75)
    pillar.alpha = Math.min(1, e / 0.08) * (1 - k) ** 1.6
    halo.alpha = 0.5 * Math.min(1, e / 0.1) * Math.max(0, 1 - e / (dur * 0.6))
    const sk = Math.min(1, e / 0.18)
    star.c.scale.set(s0 * (sk < 1 ? 0.3 + back(sk) * 0.7 : 1 + (e - 0.18) * 0.1))
    star.c.rotation = e * 0.25
    star.frame(Math.max(0, (k - 0.15) / 0.6) * (LAST_DRY + 0.99))
    star.c.alpha = k < 0.55 ? 1 : Math.max(0, 1 - (k - 0.55) / 0.35)
    if (e >= dur) star.c.destroy({ children: true })
    const rk = e / (big ? 1.3 : 0.9)
    ring.c.scale.set(r0 * (1 + e * (big ? 19 : 10)))
    ring.frame(rk * (LAST_DRY + 0.99))
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
  h.flashAt(big ? 0.65 : 0.22, 0xfff0c4)
  if (big) h.shakeA = 6
}

// Chạm công trình: nén xuống rồi bật lên (chân đứng yên), bụi toả hai bên
export function poke(h: Home, id: BuildingId) {
  const slot = h.slots.get(id)
  if (!slot) return
  const [x, y, w] = SLOT[id]
  const c = new Container()
  c.position.set(x, y)
  const puffT = fxTex.puff()
  const puffs = Array.from({ length: 6 }, (_, i) => {
    const d = new Sprite(puffT)
    d.anchor.set(0.5)
    d.tint = hex(mix(C.paper2, C.ochre, 0.3))
    c.addChild(d)
    return { d, dir: i % 2 ? 1 : -1, sp: 0.6 + (i >> 1) * 0.25 }
  })
  const dur = 0.7
  h.play(
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
    h.dust,
  )
}

// Công trình sản xuất nhả vật phẩm vẽ tay bay lên (kho đầy thì thôi)
export function make(h: Home, id: BuildingId) {
  const slot = h.slots.get(id)
  const r = BUILDINGS[id].makes
  if (!slot || !r) return
  const [x, y] = SLOT[id]
  const p = painted(`item:${r}`, () => itemIcon(r))
  const c = new Container()
  c.position.set(x + (Math.random() - 0.5) * 30, y - slot.top - 2)
  const halo = soft(fxTex.glow(), C.goldL, 30, 0)
  const icon = sprite(p)
  c.addChild(halo, icon)
  const base = 0.72 / p.scale
  h.play(
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
    h.over,
  )
}
