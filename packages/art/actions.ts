// Icon thao tác vẽ bằng bút lông (thay cho nét vector): khung 24 × 24 DU, góc trên trái (0, 0).
// Đơn sắc (MONO): vẽ màu trắng làm mặt nạ — giao diện tô bằng currentColor nên theo màu chữ của chỗ đặt.
// Nhiều màu (COLOR): cuộn sách, lò đan, cờ, bầu thuốc, sét, sao, khiên hộ thân — vẽ đủ màu như icon vật phẩm.
import { blot, erase, grain, stroke, wash, type Asset, type G, type Press, type Pt, vgrad } from './brush'
import { ring } from './chrome'
import { PIGMENT as C, mix, WHITE } from './palette'

export const MONO = [
  'hammer', 'lock', 'check', 'cross', 'close', 'power', 'sound', 'mute', 'music', 'clock', 'arrow', 'back', 'plus', 'minus',
  'gear', 'people', 'swords', 'skull', 'download', 'upload', 'globe', 'mail', 'rank',
] as const
export const COLOR = ['scroll', 'cauldron', 'flag', 'heal', 'bolt', 'star', 'shield'] as const
export type Mono = (typeof MONO)[number]
export type Colored = (typeof COLOR)[number]
export const isColored = (n: string): n is Colored => (COLOR as readonly string[]).includes(n)

// nét bút trắng của icon thao tác (tô màu sau): press trước, màu sau — khác ln của emblems
const pen = (g: G, pts: readonly Pt[], w: number, press: Press = 'taper', color = WHITE, alpha = 1, seed = 1) =>
  stroke(g, pts, { w, color, press, alpha, rough: 0.3, seed })
const fill = (g: G, pts: readonly Pt[], color = WHITE, seed = 1, sharp = false) => wash(g, pts, { fill: color, alpha: 1, layers: 2, jitter: 0.2, sharp, seed })
const inkLine = (g: G, pts: readonly Pt[], w = 1.1, seed = 1) => stroke(g, [...pts, pts[0], pts[1]], { w, color: C.ink, press: 'even', alpha: 0.9, rough: 0.35, seed })

const MONO_DRAW: Record<Mono, (g: G) => void> = {
  hammer: g => {
    pen(g, [[12.6, 10.2], [8, 14.8], [3.4, 19.6]], 3.2, 'rise', WHITE, 1, 3)
    fill(g, [[13.6, 2.8], [21.2, 10.4], [18, 13.6], [10.4, 6]], WHITE, 4, true)
  },
  lock: g => {
    pen(g, [[7.8, 11], [7.6, 7.2], [12, 3.6], [16.4, 7.2], [16.2, 11]], 2.4, 'even', WHITE, 1, 5)
    fill(g, [[5, 10.4], [19, 10.4], [19.2, 21], [4.8, 21]], WHITE, 6, true)
    erase(g, () => {
      blot(g, 12, 14.6, 1.6, '#000', 1, 7, 1)
      pen(g, [[12, 15], [12, 18.2]], 1.3, 'even', '#000', 1, 8)
    })
  },
  check: g => pen(g, [[4.2, 12.2], [9.6, 17.8], [20, 6]], 3.4, t => (t < 0.3 ? 0.7 + t : 1 - (t - 0.3) * 0.9), WHITE, 1, 9),
  cross: g => {
    pen(g, [[5.6, 5.6], [18.4, 18.4]], 3.4, 'nail', WHITE, 1, 10)
    pen(g, [[18.4, 5.6], [5.6, 18.4]], 3.4, 'nail', WHITE, 1, 11)
  },
  close: g => {
    pen(g, [[6, 6], [18, 18]], 2.8, 'nail', WHITE, 1, 12)
    pen(g, [[18, 6], [6, 18]], 2.8, 'nail', WHITE, 1, 13)
  },
  power: g => {
    pen(g, [[5.4, 18.6], [12, 12], [19.6, 4.4]], 2.8, t => 1 - t * 0.55, WHITE, 1, 14)
    pen(g, [[5.4, 13.6], [10.4, 18.6]], 2.4, 'even', WHITE, 1, 15)
    blot(g, 3.8, 20.2, 1.8, WHITE, 1, 16, 1)
  },
  sound: g => {
    fill(g, [[3.6, 9], [7.8, 9], [12.6, 4.8], [12.6, 19.2], [7.8, 15], [3.6, 15]], WHITE, 17, true)
    pen(g, [[15.4, 8.4], [17.2, 12], [15.4, 15.6]], 1.9, 'swell', WHITE, 1, 18)
    pen(g, [[18, 5.6], [21, 12], [18, 18.4]], 1.9, 'swell', WHITE, 1, 19)
  },
  mute: g => {
    fill(g, [[3.6, 9], [7.8, 9], [12.6, 4.8], [12.6, 19.2], [7.8, 15], [3.6, 15]], WHITE, 17, true)
    pen(g, [[15.6, 9.2], [20.6, 14.8]], 2, 'nail', WHITE, 1, 20)
    pen(g, [[20.6, 9.2], [15.6, 14.8]], 2, 'nail', WHITE, 1, 21)
  },
  music: g => {
    pen(g, [[9, 17.6], [9, 5.4]], 1.9, 'even', WHITE, 1, 22)
    pen(g, [[19, 15.2], [19, 3]], 1.9, 'even', WHITE, 1, 23)
    pen(g, [[9, 5.4], [14, 4], [19, 3]], 2.8, 'even', WHITE, 1, 24)
    blot(g, 6.6, 17.8, 3, WHITE, 1, 25, 0.8, -0.35)
    blot(g, 16.6, 15.4, 3, WHITE, 1, 26, 0.8, -0.35)
  },
  clock: g => {
    ring(g, 12, 12, 8.4, 2.3, WHITE, 27, 1, 0.04)
    pen(g, [[12, 6.8], [12, 12.2], [15.6, 14.4]], 2, 'even', WHITE, 1, 28)
  },
  arrow: g => {
    pen(g, [[4, 12.2], [11, 11.8], [18.6, 12]], 2.6, 'nail', WHITE, 1, 29)
    pen(g, [[13.2, 6.6], [19, 12], [13.2, 17.4]], 2.6, 'even', WHITE, 1, 30)
  },
  back: g => {
    pen(g, [[20, 12.2], [13, 11.8], [5.4, 12]], 2.6, 'nail', WHITE, 1, 31)
    pen(g, [[10.8, 6.6], [5, 12], [10.8, 17.4]], 2.6, 'even', WHITE, 1, 32)
  },
  plus: g => {
    pen(g, [[12, 4.6], [12, 19.4]], 3, 'nail', WHITE, 1, 33)
    pen(g, [[4.6, 12], [19.4, 12]], 3, 'nail', WHITE, 1, 34)
  },
  minus: g => pen(g, [[4.6, 12], [19.4, 12]], 3, 'nail', WHITE, 1, 35),
  gear: g => {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      pen(g, [[12 + Math.cos(a) * 6.5, 12 + Math.sin(a) * 6.5], [12 + Math.cos(a) * 10.4, 12 + Math.sin(a) * 10.4]], 3.4, 'even', WHITE, 1, 36 + i)
    }
    blot(g, 12, 12, 7.6, WHITE, 1, 44, 1)
    erase(g, () => blot(g, 12, 12, 3.2, '#000', 1, 45, 1))
  },
  people: g => {
    blot(g, 8.4, 7.6, 3.4, WHITE, 1, 46, 1)
    fill(g, [[2.4, 20.6], [3.4, 15.4], [8.4, 12.8], [13.6, 15.4], [14.6, 20.6]], WHITE, 47)
    blot(g, 16.2, 6.8, 2.8, WHITE, 0.75, 48, 1)
    fill(g, [[14.2, 12.4], [16.2, 11.8], [20.6, 14.2], [21.6, 19], [15.8, 19]], 'rgba(255,255,255,0.75)', 49)
  },
  swords: g => {
    pen(g, [[4, 4], [10, 10], [15.4, 15.4]], 2.3, t => 1 - t * 0.4, WHITE, 1, 50)
    pen(g, [[20, 4], [14, 10], [8.6, 15.4]], 2.3, t => 1 - t * 0.4, WHITE, 1, 51)
    pen(g, [[13.2, 17.8], [17.8, 13.2]], 2.2, 'even', WHITE, 1, 52)
    pen(g, [[10.8, 17.8], [6.2, 13.2]], 2.2, 'even', WHITE, 1, 53)
    pen(g, [[16.4, 16.4], [20, 20]], 2.4, 'even', WHITE, 1, 54)
    pen(g, [[7.6, 16.4], [4, 20]], 2.4, 'even', WHITE, 1, 55)
  },
  skull: g => {
    fill(g, [[12, 3], [17.4, 4.6], [19.6, 10.2], [17.2, 15.4], [16.4, 19], [7.6, 19], [6.8, 15.4], [4.4, 10.2], [6.6, 4.6]], WHITE, 56)
    erase(g, () => {
      blot(g, 9, 11, 2.1, '#000', 1, 57, 0.9)
      blot(g, 15, 11, 2.1, '#000', 1, 58, 0.9)
      for (const x of [10, 12, 14]) pen(g, [[x, 16.6], [x, 19.4]], 0.9, 'even', '#000', 1, 59 + x)
    })
    for (const x of [10, 14]) pen(g, [[x, 19], [x, 21]], 1.6, 'even', WHITE, 1, 62 + x)
  },
  download: g => {
    pen(g, [[4, 15.6], [4, 20], [12, 20.2], [20, 20], [20, 15.6]], 2.1, 'even', WHITE, 1, 64)
    pen(g, [[12, 3], [12, 13.6]], 2.3, 'nail', WHITE, 1, 65)
    pen(g, [[7.6, 9.6], [12, 14], [16.4, 9.6]], 2.2, 'even', WHITE, 1, 66)
  },
  upload: g => {
    pen(g, [[4, 15.6], [4, 20], [12, 20.2], [20, 20], [20, 15.6]], 2.1, 'even', WHITE, 1, 67)
    pen(g, [[12, 14], [12, 3.4]], 2.3, 'nail', WHITE, 1, 68)
    pen(g, [[7.6, 7.6], [12, 3.2], [16.4, 7.6]], 2.2, 'even', WHITE, 1, 69)
  },
  globe: g => {
    ring(g, 12, 12, 8.6, 2, WHITE, 70, 1, 0.02)
    pen(g, [[12, 3.6], [8.2, 8], [8, 12], [8.2, 16], [12, 20.4]], 1.5, 'even', WHITE, 1, 71)
    pen(g, [[12, 3.6], [15.8, 8], [16, 12], [15.8, 16], [12, 20.4]], 1.5, 'even', WHITE, 1, 72)
    pen(g, [[3.8, 12], [12, 11.6], [20.2, 12]], 1.5, 'even', WHITE, 1, 73)
    pen(g, [[5.4, 7.6], [12, 7.2], [18.6, 7.6]], 1.1, 'even', WHITE, 0.8, 74)
    pen(g, [[5.4, 16.4], [12, 16.8], [18.6, 16.4]], 1.1, 'even', WHITE, 0.8, 75)
  },
  // phong thư: thân thư, nắp gấp chéo xuống giữa
  mail: g => {
    pen(g, [[3.4, 6.4], [20.6, 6.2], [20.4, 18], [3.6, 18.2], [3.4, 6.4]], 2, 'even', WHITE, 1, 76)
    pen(g, [[3.8, 6.8], [12, 13.2], [20.2, 6.6]], 1.8, 'even', WHITE, 1, 77)
  },
  // bảng xếp hạng: ba bậc bục, bậc giữa cao nhất
  rank: g => {
    fill(g, [[9, 7], [15, 7], [15, 20], [9, 20]], WHITE, 78, true)
    fill(g, [[3, 12], [8.4, 12], [8.4, 20], [3, 20]], WHITE, 79, true)
    fill(g, [[15.6, 14.6], [21, 14.6], [21, 20], [15.6, 20]], WHITE, 80, true)
  },
}

const COLOR_DRAW: Record<Colored, (g: G) => void> = {
  scroll: g => {
    const sheet: Pt[] = [[6, 5], [18, 5], [18.2, 19], [5.8, 19]]
    wash(g, sheet, { fill: mix(C.paper, C.ochreL, 0.25), alpha: 1, layers: 2, jitter: 0.25, edge: 0.8, sharp: true, seed: 80 })
    for (const [y, w] of [[9, 6], [12, 6], [15, 4]] as const) pen(g, [[9, y], [9 + w, y + 0.2]], 1, 'taper', C.ink2, 0.9, 81 + y)
    inkLine(g, sheet, 0.9, 84)
    for (const y of [4.4, 19.6]) {
      pen(g, [[4, y], [12, y - 0.2], [20, y]], 3.6, 'even', C.ink, 0.95, 85 + y)
      pen(g, [[4.4, y], [12, y - 0.2], [19.6, y]], 2.4, 'even', mix(C.ochre, C.ink, 0.35), 1, 86 + y)
      blot(g, 3.6, y, 1.3, C.gold, 1, 87 + y, 1)
      blot(g, 20.4, y, 1.3, C.gold, 1, 88 + y, 1)
    }
  },
  cauldron: g => {
    for (const [a, b] of [[[6.6, 19.6], [5.4, 22.6]], [[17.4, 19.6], [18.6, 22.6]], [[12, 20.4], [12, 22.6]]] as const) pen(g, [a, b], 1.7, 'even', mix(C.ochre, C.ink, 0.5), 1, 90 + a[0])
    const pot: Pt[] = [[3.6, 10], [20.4, 10], [19.6, 15.6], [16, 19.8], [12, 20.6], [8, 19.8], [4.4, 15.6]]
    wash(g, pot, { fill: mix(C.ochre, C.gold, 0.35), alpha: 1, layers: 2, jitter: 0.3, edge: 1, seed: 93 })
    pen(g, [[6, 12.6], [9, 15.6]], 1.2, 'taper', WHITE, 0.4, 94)
    inkLine(g, pot, 1, 95)
    pen(g, [[2.4, 9.6], [12, 9.2], [21.6, 9.6]], 2.8, 'even', mix(C.ochre, C.ink, 0.5), 1, 96)
    pen(g, [[7, 8.4], [7, 5.8]], 1.6, 'even', mix(C.ochre, C.ink, 0.5), 1, 97)
    pen(g, [[17, 8.4], [17, 5.8]], 1.6, 'even', mix(C.ochre, C.ink, 0.5), 1, 98)
    pen(g, [[9.4, 5], [10.2, 3.4], [9.2, 2.2], [10.2, 0.8]], 1.2, 'taper', C.spirit, 0.9, 99)
    pen(g, [[13.8, 5.2], [14.6, 3.6], [13.6, 2.4], [14.6, 1]], 1.2, 'taper', C.spirit, 0.9, 100)
  },
  flag: g => {
    pen(g, [[5, 22], [5.2, 12], [5, 2.4]], 2, 'even', C.ink2, 1, 101)
    const cloth: Pt[] = [[6, 3.4], [19.4, 3.8], [16.2, 8.2], [19.4, 12.6], [6, 12.8]]
    wash(g, cloth, { fill: C.cinnabar, alpha: 1, layers: 2, jitter: 0.3, edge: 1, seed: 102 })
    pen(g, [[7.4, 5.4], [14, 5.6]], 1, 'taper', WHITE, 0.35, 103)
    inkLine(g, cloth, 0.9, 104)
    blot(g, 5, 2, 1.3, C.gold, 1, 105, 1)
  },
  heal: g => {
    // bầu thuốc: hai bầu chồng, dây buộc son, lá xanh
    const top: Pt[] = Array.from({ length: 16 }, (_, i) => [12 + Math.cos((i / 16) * Math.PI * 2) * 4.2, 8.4 + Math.sin((i / 16) * Math.PI * 2) * 4] as Pt)
    const bot: Pt[] = Array.from({ length: 20 }, (_, i) => [12 + Math.cos((i / 20) * Math.PI * 2) * 7, 16 + Math.sin((i / 20) * Math.PI * 2) * 6.2] as Pt)
    for (const p of [bot, top]) {
      wash(g, p, { fill: mix(C.gamboge, C.ochre, 0.3), alpha: 1, layers: 2, jitter: 0.25, edge: 1, seed: 106 + p.length })
      inkLine(g, p, 1, 107 + p.length)
    }
    pen(g, [[8.4, 11.6], [12, 12.6], [15.6, 11.6]], 1.8, 'even', C.cinnabar, 1, 110)
    pen(g, [[12, 12.6], [10.6, 15.6]], 1.2, 'taper', C.cinnabar, 1, 111)
    pen(g, [[12, 4.6], [12, 2.4]], 1.8, 'even', mix(C.ochre, C.ink, 0.5), 1, 112)
    wash(g, [[12.4, 3.2], [16.8, 1.4], [15.8, 4.4]], { fill: C.malachite, alpha: 1, layers: 1, jitter: 0.1, seed: 113 })
    pen(g, [[8.6, 14.6], [9.4, 18.4]], 1.3, 'taper', WHITE, 0.45, 114)
  },
  bolt: g => {
    const b: Pt[] = [[13.8, 1.8], [4.8, 13.4], [11, 13.4], [9.6, 22.2], [19.2, 10.2], [12.9, 10.2]]
    wash(g, b, { fill: C.goldL, alpha: 1, layers: 2, jitter: 0.2, edge: 1, sharp: true, seed: 115 })
    pen(g, [[12.4, 4.6], [7.6, 11.6]], 1.1, 'taper', WHITE, 0.6, 116)
    inkLine(g, b, 1, 117)
  },
  star: g => {
    const s: Pt[] = Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? 4.4 : 10
      return [12 + Math.cos(a) * r, 12.6 + Math.sin(a) * r] as Pt
    })
    wash(g, s, { fill: C.goldL, alpha: 1, layers: 2, jitter: 0.25, edge: 1, sharp: true, seed: 118 })
    pen(g, [[10.6, 7.4], [9.6, 11.4]], 1.1, 'taper', WHITE, 0.6, 119)
    inkLine(g, s, 1, 120)
  },
  shield: g => {
    // khiên hộ thân (bảo hộ PvP): mặt lam viền vàng, ba ngọn núi vàng giữa khiên (hộ sơn), quầng linh khí bao ngoài
    const sh: Pt[] = [[4.4, 4.6], [8, 3.4], [12, 2.6], [16, 3.4], [19.6, 4.6], [19.8, 9], [19, 13.4], [16.6, 17.4], [12, 21.4], [7.4, 17.4], [5, 13.4], [4.2, 9]]
    pen(g, [...sh, sh[0], sh[1]].map(([x, y]) => [12 + (x - 12) * 1.12, 11.8 + (y - 11.8) * 1.1] as Pt), 1.4, 'even', C.spirit, 0.55, 121)
    wash(g, sh, { fill: g2 => vgrad(g2, 3, 21, [[0, C.azuriteL], [1, C.azuriteD]]), alpha: 1, layers: 2, jitter: 0.2, edge: 1, seed: 122 })
    pen(g, [...sh, sh[0], sh[1]], 1.8, 'even', C.gold, 1, 123)
    pen(g, [[12, 3.4], [12, 20.4]], 0.7, 'even', mix(C.azuriteD, C.ink, 0.3), 0.6, 124)
    pen(g, [[7.2, 6], [6.8, 11], [8.4, 15]], 1.1, 'taper', WHITE, 0.5, 125)
    pen(g, [[7.4, 14.6], [9.4, 11.2], [10.8, 12.8], [12, 8.4], [13.2, 12.8], [14.6, 11.2], [16.6, 14.6]], 1.4, 'even', C.goldL, 1, 126)
    pen(g, [[8.6, 16.4], [12, 16], [15.4, 16.4]], 0.9, 'taper', C.goldL, 0.9, 127)
    inkLine(g, sh, 1, 128)
  },
}

// Mặt nạ icon đơn sắc (trắng trên nền trong)
export const monoIcon = (name: Mono): Asset => ({ x: 0, y: 0, w: 24, h: 24, draw: g => MONO_DRAW[name](g) })
// Icon nhiều màu
export const colorIcon = (name: Colored): Asset => ({ x: 0, y: 0, w: 24, h: 24, draw: g => (COLOR_DRAW[name](g), grain(g, 0.2)) })
