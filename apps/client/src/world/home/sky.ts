// Giấy nền và bầu trời theo giờ (bình minh, ngày, hoàng hôn, đêm, kiếp vân), mặt trời, trăng, sao.
import { Container, TilingSprite, type Texture } from 'pixi.js'
import { PIGMENT as C, moon, sun } from '@rok/art'
import { HOME } from '../layout'
import { hex, painted, sprite, texOf, type Painted, fxTex } from '../stage'
import type { Home, Phase } from '../home'
import { soft } from './kit'

// Bầu trời là giấy; trên đó quệt một lớp màu theo giờ
const SKY: Record<Phase | 'storm', [string, number, string, number]> = {
  day: [C.azuriteL, 0.55, C.paper, 0],
  dawn: ['#e3a98a', 0.6, '#f2dcc8', 0.2],
  dusk: ['#c9765a', 0.7, '#ecc9a8', 0.35],
  night: ['#0e1a2c', 0.97, '#26344e', 0.92],
  storm: ['#150f26', 0.98, '#342c4a', 0.95],
}
// Nhuộm cả cảnh (nhân màu) và độ sáng đèn theo giờ
export const MOOD: Record<Phase | 'storm', { tint: number; lights: number; stars: number; sun: number; moon: number }> =
  {
    day: { tint: 0xffffff, lights: 0, stars: 0, sun: 1, moon: 0 },
    dawn: { tint: 0xf8e6da, lights: 0.15, stars: 0, sun: 0.9, moon: 0 },
    dusk: { tint: 0xf0cfb8, lights: 0.55, stars: 0.1, sun: 0.8, moon: 0 },
    night: { tint: 0x7482a3, lights: 1, stars: 1, sun: 0, moon: 1 },
    storm: { tint: 0x5f5878, lights: 0.8, stars: 0, sun: 0, moon: 0 },
  }

export function skyTex(p: Phase | 'storm') {
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

// Giấy + trời (rộng ra hai bên cho màn hình ngang), mặt trời / trăng, sao
export function buildSky(h: Home, glowT: Texture, sparkT: Texture) {
  const pap = new TilingSprite({ texture: fxTex.paper(), width: 3000, height: HOME.h + 800 })
  pap.position.set(-1300, -400)
  pap.tileScale.set(0.5)
  h.world.addChild(pap)
  for (const sky of [h.sky, h.stormSky]) {
    sky.position.set(-1300, -400)
    sky.width = 3000
    sky.height = HOME.h + 800
  }
  h.stormSky.texture = skyTex('storm')
  h.stormSky.alpha = 0
  h.root.addChild(h.world, h.sky, h.stormSky)
  // mặt trời son, trăng trắng chì: đĩa vẽ tay, quầng sáng mờ phía sau.
  // Cùng một khoảng trời trống giữa thẻ nhiệm vụ và nút cuộn sổ (mặt trời và trăng không hiện cùng lúc)
  const disc = (c: Container, p: Painted, halo: string, hs: number, x: number, y: number) => {
    c.addChild(soft(glowT, halo, hs, 0.4), sprite(p))
    c.position.set(x, y)
  }
  disc(
    h.sun,
    painted('sun', () => sun(21)),
    '#f7cf9a',
    120,
    296,
    152,
  )
  disc(
    h.moon,
    painted('moon', () => moon(19)),
    '#f2efe2',
    110,
    298,
    150,
  )
  h.root.addChild(h.sun, h.moon, h.stars)
  h.scene.addChild(h.land)
  h.vortex.visible = false
  h.root.addChild(h.vortex, h.scene)
  for (let i = 0; i < 36; i++) {
    const s = soft(sparkT, '#ffffff', 3 + (i % 3) * 2, 0.8)
    s.position.set(((i * 97) % 440) - 20, 20 + ((i * 53) % 300))
    h.stars.addChild(s)
    h.anims.push(t => (s.alpha = 0.5 + 0.5 * Math.sin(t * 1.3 + i)))
  }
}
