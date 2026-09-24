// Núi: núi xa (thị sai), mây tường vân, hạc, núi chính, các tầng núi xen sương, bậc đá, thác nước, tiền cảnh.
import { Container, TilingSprite, type Texture } from 'pixi.js'
import { PIGMENT as C, cloud, crane, fallTex, farRange, ledge, mix, peak, pine, rock, stairway } from '@rok/art'
import { LEDGES, MISTS, PINES, STAIRS } from '../layout'
import { painted, sprite, texOf } from '../stage'
import type { Home } from '../home'
import { mist, put, soft } from './kit'
import { walker } from './life'

// Núi xa (thị sai), mây, hạc, núi chính, các tầng núi xen sương, thác nước
export function buildMountains(h: Home, glowT: Texture) {
  // Núi xa: hai lớp mực nhạt, trôi chậm hơn khi cuộn (thị sai)
  // rộng -1100…1500 DU: desktop (cảnh phóng 1,5×, dịch trái khi ngăn kéo mở) trên màn 2560 px vẫn không lộ mép cắt
  const ranges = [
    painted('far1', () => farRange(2600, 150, 21, C.azuriteL, 0.55), 1),
    painted('far2', () => farRange(2600, 120, 22, mix(C.azurite, C.indigo, 0.5), 0.5), 1),
  ]
  ranges.forEach((p, k) => {
    const c = new Container()
    c.addChild(sprite(p, -1100, k ? 410 : 330))
    h.far.push(c)
    h.land.addChild(c)
  })
  // Mây tường vân trên trời
  for (const [x, y, w, seed, sp] of [
    [70, 230, 96, 1, 6],
    [330, 280, 76, 4, -5],
    [210, 170, 60, 9, 4],
  ] as const) {
    const c = put(
      h,
      painted(`cloud:${w}:${seed}`, () => cloud(w, seed)),
      x,
      y,
    )
    h.fair.push(c)
    h.anims.push(t => (c.x = x + Math.sin(t / 18 + seed) * 16 + sp * Math.sin(t / 40)))
  }
  cranes(h)

  // Núi chính sau Chủ điện + sương lưng chừng
  put(
    h,
    painted('peak:l', () => peak(220, 130, 33, -0.1)),
    96,
    400,
  )
  put(
    h,
    painted('peak:r', () => peak(230, 150, 35, 0.12)),
    318,
    404,
  )
  put(
    h,
    painted('peak:main', () => peak(300, 190, 31, 0.03)),
    205,
    396,
  )
  mist(h, 262, 70, 3, 0.85)

  // Các tầng núi, xen sương; vách thác ở phải
  const byLedge = (i: number) => {
    const [x, y, w, tall, seed] = LEDGES[i]
    put(
      h,
      painted(`ledge:${i}`, () => ledge(w, tall, seed)),
      x,
      y,
    )
    for (const [px, py, sc, ps] of PINES)
      if (Math.abs(py - y) < 8)
        put(
          h,
          painted(`pine:${ps}`, () => pine(sc, ps)),
          px,
          py,
        )
    for (const [path, sw, after] of STAIRS)
      if (after === i) {
        put(
          h,
          painted(`stair:${path[0]}`, () => stairway(path, sw, i + 1)),
        )
        if (i !== 2) walker(h, path, i)
      }
  }
  byLedge(0)
  mist(h, ...MISTS[0])
  byLedge(1)
  byLedge(2)
  put(
    h,
    painted('peak:cliff', () => peak(250, 250, 37, 0.3)),
    372,
    730,
  )
  waterfall(h, glowT)
  mist(h, ...MISTS[1])
  byLedge(3)
  mist(h, ...MISTS[2])
  byLedge(4)
  byLedge(6)
  mist(h, ...MISTS[3])
  byLedge(5)
  byLedge(7)
  byLedge(8)
  mist(h, ...MISTS[4])
  mist(h, ...MISTS[5])
}

// Hạc bay ngang trời
function cranes(h: Home) {
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
  h.land.addChild(flock)
  h.fair.push(flock)
  h.anims.push(t => {
    const k = (t % 34) / 34
    flock.position.set(470 - k * 560, 170 - k * 50 + Math.sin(t * 0.8) * 4)
    for (const { b, i } of birds) b.texture = wings[Math.floor(t * 2.2 + i * 0.5) % 2].tex
  })
}

// Thác nước đổ từ dưới Đan phòng, bụi nước ở chân thác
function waterfall(h: Home, glowT: Texture) {
  const fall = new TilingSprite({ texture: texOf('fall', () => fallTex()), width: 16, height: 150 })
  fall.position.set(368, 448)
  fall.alpha = 0.9
  h.land.addChild(fall)
  h.anims.push((_, dt) => (fall.tilePosition.y += dt * 70))
  const spray = soft(glowT, '#ffffff', 50, 0.5)
  spray.blendMode = 'normal'
  spray.position.set(376, 598)
  spray.scale.y *= 0.4
  h.land.addChild(spray)
  h.anims.push(t => (spray.alpha = 0.45 + 0.2 * Math.sin(t * 2.6)))
}

// Tiền cảnh: đá mực và tùng lớn sát mép dưới
export function buildForeground(h: Home) {
  put(
    h,
    painted('rock:l', () => rock(110, 70, 41)),
    36,
    880,
  )
  put(
    h,
    painted('rock:r', () => rock(90, 56, 43)),
    372,
    886,
  )
  put(
    h,
    painted('pine:fg1', () => pine(1.9, 45)),
    40,
    850,
  )
  put(
    h,
    painted('pine:fg2', () => pine(1.5, 47)),
    368,
    872,
  )
}
