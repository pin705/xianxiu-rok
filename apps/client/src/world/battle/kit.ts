// Phần dùng chung của cảnh trận: kiểu đội hình / tween, màu theo bên, hàm vẽ texture mực cho từng loại hiệu ứng.
import { Container, Text } from 'pixi.js'
import { PIGMENT as C, boltTex, burstTex, clawTex, orbTex, ringTex, slashTex, streakTex, type Troop } from '@rok/art'
import { DRY, type Hue } from '../stage'

export type Kind = 'man' | 'beast' | 'spirit'
export type Squad = {
  c: Container
  figs: Container[]
  type: Troop
  n0: number
  n: number
  per: number
  label: Text
  x: number
  y: number
}
export type Tween = { t0: number; dur: number; fn: (k: number) => void; end?: () => void }

export const ease = (k: number) => 1 - (1 - k) ** 3

// Màu theo bên: quân ta lam/vàng, địch son
export const SWORD: Hue[] = [
  [C.indigo, C.azurite, C.spirit],
  [C.lacquer, C.cinnabar, '#ffc8a8'],
]
export const ORB: Hue[] = [
  [C.azuriteD, C.spirit, '#effcff'],
  [C.cinnabar, '#f08a4a', C.gamboge],
] // lửa: viền son, không viền đen
export const QUAKE: Hue[] = [
  [C.goldD, C.gold, C.goldL],
  [C.lacquer, C.cinnabar, C.cinnabarL],
]
export const HIT: Hue[] = [
  [C.ink, C.ochre, '#fff2c8'],
  [C.ink, C.cinnabar, '#ffb4a4'],
] // theo bên ra đòn
export const CLAW: Hue = [C.lacquer, C.cinnabar, '#ffd0c0']
export const slashT = (f: number, k: number) => slashTex(128, 64, 1, DRY[f], k)
export const orbT = (f: number, k: number) => orbTex(96, 64, 7, DRY[f], k)
export const clawT = (f: number, k: number) => clawTex(96, 2, DRY[f], k)
export const ringT = (f: number, k: number) => ringTex(256, 80, 7, 3, DRY[f], k)
export const burstT = (n: number) => (f: number, k: number) => burstTex(128, 5 + n * 7, DRY[f], k)
export const streakT = (f: number, k: number) => streakTex(24, 128, 11, DRY[f], k)
export const boltT = (n: number) => (_: number, k: number) => boltTex(160, 640, n, k)
