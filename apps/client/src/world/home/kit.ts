// Phần dùng chung của cảnh núi: sprite cộng sáng, kiểu slot / hiệu ứng, đặt hình vẽ tay, dải sương.
import { Container, Sprite, TilingSprite, type Texture } from 'pixi.js'
import { PIGMENT as C, mistTex } from '@rok/art'
import { hex, sprite, texOf, type Hue, type Painted } from '../stage'
import type { Home } from '../home'

export const soft = (tex: Texture, color: string, size: number, alpha = 1) => {
  const s = new Sprite(tex)
  s.anchor.set(0.5)
  s.width = s.height = size
  s.tint = hex(color)
  s.alpha = alpha
  s.blendMode = 'add'
  return s
}

export const FIRE: Hue = [C.cinnabar, '#f08a4a', C.gamboge]
export const GOLD: Hue = [C.goldD, C.gold, C.goldL]

export type Anim = (t: number, dt: number) => void

// Hiệu ứng thoáng qua (pháo hoa, sét…): tự huỷ sau dur giây
export type Play = { t0: number; dur: number; c: Container; step: (e: number) => void }

export type Slot = {
  root: Container
  body?: Sprite
  key: string
  fx: Container // hiệu ứng động của công trình
  glow: Container // đèn, linh khí của công trình (lớp cộng sáng)
  anims: Anim[]
  lights: Sprite[]
  top: number
}

// Một hình vẽ tay đặt lên lớp núi
export function put(h: Home, p: Painted, x = 0, y = 0) {
  return h.land.addChild(sprite(p, x, y))
}

// Dải sương ghép liền trôi ngang
export function mist(h: Home, y: number, tall: number, speed: number, alpha: number, w = 2600) {
  const m = new TilingSprite({
    texture: texOf(`mist:${Math.round(y) % 3}`, () => mistTex(512, 96, 1 + (Math.round(y) % 3))),
    width: w,
    height: tall * 1.6,
  })
  m.position.set(-(w - 400) / 2, y - tall * 0.8)
  m.tileScale.set(1.1, (tall * 1.6) / 96)
  m.alpha = alpha
  h.land.addChild(m)
  h.anims.push((_, dt) => (m.tilePosition.x += speed * dt))
}
