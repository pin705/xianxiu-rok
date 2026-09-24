// Thương vong: hình ngã xuống (hoặc hồi sinh) theo số quân của lượt, tan thành mực, số nổi lên.
import { Sprite, Text } from 'pixi.js'
import { PIGMENT as C } from '@rok/art'
import { hex, fxTex } from '../stage'
import type { Battle } from '../battle'
import { ease, type Squad } from './kit'

// Cập nhật số quân: hình ngã xuống (hoặc hồi sinh), số nổi lên
export function tally(b: Battle, n: [number[], number[]], dur: number) {
  n.forEach((ns, side) =>
    ns.forEach((v, k) => {
      const q = b.squads[side][k]
      if (!q) return
      const d = q.n - v
      q.n = v
      q.label.text = String(v)
      const alive = v > 0 ? Math.min(q.figs.length, Math.ceil(v / q.per)) : 0
      q.figs.forEach((s, i) => {
        if (i >= alive && !b.down.has(s)) {
          b.down.add(s)
          const r0 = s.rotation,
            y0 = s.y
          b.add(
            0.45,
            e => {
              s.rotation = r0 + e * (i % 2 ? 1.3 : -1.3)
              s.alpha = 1 - e
              s.y = y0 + e * 4
            },
            () => (s.visible = false),
          )
          if (dur) dissolve(b, q.c.x + s.x, q.c.y + s.y - 10)
        } else if (i < alive && b.down.has(s)) {
          b.down.delete(s)
          s.visible = true
          s.rotation = 0
          b.add(0.4, e => (s.alpha = e))
        }
      })
      if (d !== 0) popNumber(b, q, d, dur)
    }),
  )
}

// Hình ngã tan thành mực: vài vệt mực bốc lên rồi loãng dần
function dissolve(b: Battle, x: number, y: number) {
  const puffT = fxTex.puff()
  for (let i = 0; i < 4; i++) {
    const m = new Sprite(puffT)
    m.anchor.set(0.5)
    m.tint = hex(C.ink)
    m.alpha = 0
    const dx = (Math.random() - 0.5) * 16,
      rise = 14 + Math.random() * 16
    b.fx.addChild(m)
    b.add(
      0.9,
      k => {
        m.position.set(x + dx * (0.4 + k), y - rise * ease(k))
        m.width = m.height = 8 + k * 14
        m.alpha = Math.sin(k * Math.PI) * 0.45
      },
      () => m.destroy(),
      0.12 + i * 0.05,
    )
  }
}

function popNumber(b: Battle, q: Squad, d: number, dur: number) {
  const t = new Text({
    text: d > 0 ? `−${d}` : `+${-d}`,
    style: {
      fontFamily: 'Alegreya',
      fontWeight: '900',
      fontSize: 17,
      fill: hex(d > 0 ? C.cinnabar : C.malachite),
      stroke: { color: hex(C.paper), width: 4 },
    },
  })
  t.anchor.set(0.5)
  t.position.set(q.c.x + 26, q.c.y - 34)
  b.fx.addChild(t)
  b.add(
    Math.max(0.6, dur),
    k => {
      t.y = q.c.y - 34 - ease(k) * 18
      t.alpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3
      t.scale.set(k < 0.15 ? 1.4 - k * 2.6 : 1)
    },
    () => t.destroy(),
  )
}
