// Huy hiệu tròn vẽ tay (thay cho chữ Hán): đĩa màu khoáng loang, vòng vàng một nét, viền mực, hình chạm giữa đĩa.
// Hình chạm: 15 yêu thú, 5 tông môn đối địch, 5 bí cảnh, ngũ hành, lôi kiếp, 3 hệ đệ tử và vài biểu tượng khoảnh khắc lớn.
// Hộp 48 × 48 DU, tâm (0, 0); hình chạm nằm trong bán kính ~16.
import { blot, ellipse, grain, stroke, wash, type Asset, type G, type Press, type Pt } from './brush'
import { outline, ring } from './chrome'
import { PIGMENT as C, mix, rgba, WHITE } from './palette'

// Tông đĩa theo ngũ hành đặt đúng tên hành (kim, moc, thuy, hoa, tho): medal(ELEMENT_EMBLEMS[el], el)
export type MedalTone = 'kiem' | 'phap' | 'the' | 'beast' | 'sect' | 'realm' | 'thunder' | 'trib' | 'ink' | 'jade' | 'gold' | 'red' | 'tower' | 'pvp' | 'spot' | keyof typeof ELEMENT_EMBLEMS
export const BEAST_EMBLEMS = ['wolf', 'snake', 'bear', 'fox', 'eagle', 'ape', 'windWolf', 'leopard', 'rhino', 'nineFox', 'hawk', 'turtle', 'tiger', 'phoenix', 'dragon'] as const
export const SECT_EMBLEMS = ['wind', 'blood', 'poison', 'demon', 'ghost'] as const
// 3 bí cảnh đầu (rừng, hoả, băng), Lôi Trì, Hỗn Độn
export const REALM_EMBLEMS = ['wood', 'fire', 'ice', 'thunderPool', 'chaos'] as const
export const UNIT_EMBLEMS = { kiem: 'sword', phap: 'orb', the: 'fist' } as const
// Ngũ hành: Mộc, Hoả dùng chung hình với bí cảnh
export const ELEMENT_EMBLEMS = { kim: 'metal', moc: 'wood', thuy: 'water', hoa: 'fire', tho: 'earth' } as const
export type Emblem =
  | (typeof BEAST_EMBLEMS)[number] | (typeof SECT_EMBLEMS)[number] | (typeof REALM_EMBLEMS)[number]
  | (typeof UNIT_EMBLEMS)[keyof typeof UNIT_EMBLEMS] | (typeof ELEMENT_EMBLEMS)[keyof typeof ELEMENT_EMBLEMS]
  | 'thunder' | 'win' | 'lose' | 'rebirth' | 'lotus' | 'crest' | 'tick' | 'tower' | 'anvil'

const DISC: Record<MedalTone, [string, string]> = {
  kiem: [C.azuriteL, C.azuriteD],
  phap: [C.cinnabarL, '#5e1f24'],
  the: [C.ochreL, '#5c3b17'],
  beast: [mix(C.ochre, C.ochreL, 0.4), '#3b2a14'],
  sect: [C.cinnabar, '#4a150b'],
  realm: [C.malachiteL, C.malachiteD],
  jade: [C.malachiteL, C.malachiteD],
  thunder: ['#8a73cf', '#2a1d55'],
  trib: ['#8a73cf', '#2a1d55'], // kiếp vân (hành quân độ kiếp): như sét
  ink: [C.ink3, C.ink],
  gold: [C.goldL, C.goldD],
  red: [C.cinnabarL, mix(C.cinnabar, C.ink, 0.3)],
  tower: [C.azuriteL, mix(C.indigo, C.ink, 0.3)],
  pvp: [mix(C.cinnabarL, '#8a73cf', 0.35), '#3a1030'], // tông môn người chơi khác: son pha tím
  spot: [mix(C.malachiteL, C.goldL, 0.4), mix(C.malachiteD, C.ink, 0.35)], // điểm trên bản đồ giới
  kim: [mix(C.silk, C.ink3, 0.18), mix(C.ink3, C.ink, 0.5)],
  moc: [C.malachiteL, C.malachiteD],
  thuy: [mix(C.azuriteL, C.indigo, 0.25), mix(C.indigo, C.ink, 0.5)],
  hoa: [C.cinnabarL, mix(C.cinnabar, C.ink, 0.3)],
  tho: [mix(C.ochreL, C.gamboge, 0.25), '#5c3b17'],
}

const oval = (cx: number, cy: number, rx: number, ry: number, n = 28, rot = 0) => ellipse(cx, cy, rx, ry, n, rot)
const flipX = (pts: readonly Pt[]): Pt[] => pts.map(([x, y]) => [-x, y] as Pt).reverse()

// Mảng màu có viền mực (hình khép, đi theo chiều kim đồng hồ)
function part(g: G, pts: readonly Pt[], fill: string, seed: number, lw = 1.1, line: string = C.ink) {
  wash(g, pts, { fill, alpha: 1, layers: 2, jitter: 0.22, edge: 0.9, seed })
  outline(g, pts, lw, line, seed + 1, 0.9, 0.1, 0.5)
}
const ln = (g: G, pts: readonly Pt[], w: number, color: string = C.ink, press: Press = 'taper', alpha = 0.9, seed = 1) =>
  stroke(g, pts, { w, color, press, alpha, rough: 0.35, seed })
// Mắt thú: tròng màu, con ngươi mực, chấm sáng
function eye(g: G, x: number, y: number, r: number, iris: string = C.goldL, slit = false, seed = 3) {
  blot(g, x, y, r, iris, 1, seed, 0.8)
  if (slit) ln(g, [[x, y - r * 0.7], [x, y + r * 0.7]], r * 0.55, C.ink, 'swell', 1, seed + 1)
  else blot(g, x + r * 0.12, y + r * 0.05, r * 0.5, C.ink, 1, seed + 1, 1)
  blot(g, x - r * 0.3, y - r * 0.3, r * 0.22, WHITE, 0.9, seed + 2, 1)
}

// ---------- 15 yêu thú ----------

const WOLF: Pt[] = [[-3, -16], [1, -8], [6, -6], [11, -3], [15.5, -1.2], [16.6, 1.2], [14, 3.2], [9, 4], [12, 6.2], [6, 8.3], [1, 9], [-4, 13], [-12, 14], [-13, 5], [-11, -2], [-7, -8.5]]
function wolfHead(g: G, fill: string, eyeC: string, seed: number) {
  part(g, WOLF, fill, seed, 1.2)
  ln(g, [[-2.5, -13], [-3.5, -8.5]], 1.3, mix(fill, C.silk, 0.45), 'taper', 0.8, seed + 2) // lòng tai
  ln(g, [[1, -7.4], [7, -5.2], [13, -2.3]], 1, C.silk, 'taper', 0.45, seed + 3) // ánh sáng sống mũi
  blot(g, 15.6, 0.4, 1.3, C.ink, 1, seed + 4, 0.8)
  ln(g, [[16, 2.2], [12.5, 3.4], [9, 4.1]], 0.8, C.ink, 'nail', 0.9, seed + 5)
  wash(g, [[10, 4.2], [11.2, 6.3], [12.2, 4.3]], { fill: WHITE, alpha: 1, layers: 1, jitter: 0.05, sharp: true, seed: seed + 6 }) // nanh
  eye(g, 5.2, -2.6, 1.6, eyeC, false, seed + 7)
  ln(g, [[3.4, -4.6], [7.4, -4.2]], 0.9, C.ink, 'nail', 0.9, seed + 8) // mày dữ
  for (let i = 0; i < 4; i++) ln(g, [[-11 + i * 2.2, 13.6], [-12 + i * 2.2, 16]], 0.9, mix(fill, C.silk, 0.5), 'taper', 0.7, seed + 9 + i) // lông bờm cổ
}

function wolf(g: G) {
  wolfHead(g, mix(C.ink2, C.ink, 0.25), C.goldL, 11)
}
function windWolf(g: G) {
  // bờm gió + hai vòng gió cuộn sau gáy
  for (let i = 0; i < 5; i++) {
    const a = -2.2 + i * 0.42
    ln(g, [[-9, -2 + i * 3], [-9 + Math.cos(a) * 9, -2 + i * 3 + Math.sin(a) * 6]], 2.2, C.silk, 'nail', 0.85, 20 + i)
  }
  wolfHead(g, mix(C.azuriteL, C.ink3, 0.45), C.spirit, 21)
  ln(g, [[-16, -8], [-12, -12], [-7, -13], [-6, -10], [-9, -9]], 1.1, C.silk, 'taper', 0.9, 31)
  ln(g, [[-16, 16], [-17, 10], [-14, 7], [-12, 9]], 1, C.silk, 'taper', 0.8, 32)
}

function snake(g: G) {
  const path: Pt[] = [[-15, 12.5], [-8, 14.2], [2, 13.2], [9.5, 9], [10.2, 3], [4, 0], [-4.5, 1], [-9.5, -3.5], [-8, -9.5], [-2, -12.2], [4.5, -11.2]]
  const taper = (t: number) => Math.min(1, 0.25 + t * 1.8)
  stroke(g, path, { w: 7.6, color: C.ink, press: taper, alpha: 0.95, rough: 0.3, seed: 41 })
  stroke(g, path, { w: 5.6, color: C.malachite, press: taper, alpha: 1, rough: 0.25, seed: 42 })
  stroke(g, path.map(([x, y]) => [x + 0.4, y + 1] as Pt), { w: 1.8, color: C.malachiteL, press: taper, alpha: 0.7, seed: 43 })
  // vảy: cung nhỏ sẫm dọc thân
  for (let i = 2; i < path.length - 1; i++) {
    const [x, y] = path[i]
    ln(g, [[x - 1.2, y - 0.8], [x, y - 1.6], [x + 1.2, y - 0.8]], 0.6, C.malachiteD, 'even', 0.7, 44 + i)
  }
  const head = oval(8, -11.2, 4.8, 3.3, 20, -0.15)
  part(g, head, C.malachite, 51, 1.1)
  eye(g, 9.4, -12.4, 1.1, C.goldL, true, 52)
  ln(g, [[12.6, -10.2], [15.6, -9.6]], 0.7, C.cinnabar, 'even', 1, 53)
  ln(g, [[15.4, -9.7], [17, -10.8]], 0.5, C.cinnabar, 'taper', 1, 54)
  ln(g, [[15.4, -9.6], [17, -8.6]], 0.5, C.cinnabar, 'taper', 1, 55)
}

function bear(g: G) {
  const fur = mix(C.ink3, C.ochre, 0.3), dark = mix(fur, C.ink, 0.45)
  for (const x of [-9, 9]) {
    blot(g, x, -9, 4.4, dark, 1, 61 + x, 0.95)
    blot(g, x, -8.6, 2.2, mix(fur, C.silk, 0.3), 1, 62 + x, 1)
  }
  const head = oval(0, 1, 12.5, 11.2, 30)
  part(g, head, fur, 63, 1.3)
  ln(g, [[-7, -7.5], [0, -9.6], [7, -7.5]], 1.4, C.silk, 'swell', 0.4, 64) // ánh thép trên trán
  part(g, oval(0, 5.2, 6.4, 4.6, 22), mix(C.ochreL, C.silk, 0.45), 65, 0.9)
  blot(g, 0, 2.9, 2.4, C.ink, 1, 66, 0.72)
  ln(g, [[0, 4.4], [0, 6.6]], 0.8, C.ink, 'even', 0.9, 67)
  ln(g, [[-2.8, 7.6], [0, 6.6], [2.8, 7.6]], 0.8, C.ink, 'even', 0.9, 68)
  for (const x of [-4.6, 4.6]) {
    blot(g, x, -2.2, 1.4, C.ink, 1, 69 + x, 0.9)
    blot(g, x - 0.4, -2.6, 0.35, WHITE, 0.9, 70 + x, 1)
    ln(g, [[x + 2.4 * Math.sign(x), -5.6], [x - 2 * Math.sign(x), -3.9]], 1, C.ink, 'nail', 0.9, 71 + x) // mày dữ
  }
}

const FOX: Pt[] = [[-12, -14.5], [-6, -6.5], [6, -6.5], [12, -14.5], [12.3, -3], [14.5, 3], [7, 7.5], [0, 13], [-7, 7.5], [-14.5, 3], [-12.3, -3]]
function foxHead(g: G, fill: string, cheek: string, eyeC: string, seed: number, k = 1, dy = 0) {
  const T = (p: readonly Pt[]) => p.map(([x, y]) => [x * k, y * k + dy] as Pt)
  part(g, T(FOX), fill, seed, 1.2)
  for (const s of [1, -1]) {
    const inner: Pt[] = [[-11 * s, -12.4], [-7 * s, -6.8], [-10.3 * s, -5]]
    wash(g, T(inner), { fill: C.ink2, alpha: 0.85, layers: 1, jitter: 0.1, seed: seed + 2 + s })
    const ch: Pt[] = s > 0 ? [[-14.5, 3], [-9, 2], [-3, 6], [0, 13], [-7, 7.5]] : flipX([[-14.5, 3], [-9, 2], [-3, 6], [0, 13], [-7, 7.5]])
    wash(g, T(ch), { fill: cheek, alpha: 1, layers: 2, jitter: 0.2, seed: seed + 4 + s })
  }
  outline(g, T(FOX), 1.2, C.ink, seed + 6, 0.85, 0.1, 0.4)
  for (const s of [-1, 1]) {
    const e = oval(5 * s * k, -0.8 * k + dy, 2.3 * k, 1.1 * k, 14, s * 0.35)
    wash(g, e, { fill: eyeC, alpha: 1, layers: 1, jitter: 0.05, seed: seed + 7 + s })
    ln(g, [[5 * s * k, -1.8 * k + dy], [5 * s * k, 0.2 * k + dy]], 0.6 * k, C.ink, 'swell', 1, seed + 8 + s)
    ln(g, [...e, e[0]], 0.6 * k, C.ink, 'even', 0.9, seed + 9 + s)
  }
  blot(g, 0, 11.4 * k + dy, 1.6 * k, C.ink, 1, seed + 11, 0.75)
}
function fox(g: G) {
  foxHead(g, mix(C.cinnabarL, C.ochre, 0.45), C.silk, C.goldL, 81)
}
function nineFox(g: G) {
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + 0.25 + i * ((Math.PI - 0.5) / 6)
    const x1 = Math.cos(a) * 16.5, y1 = Math.sin(a) * 15 + 4
    const mid: Pt = [Math.cos(a) * 8.5 + Math.cos(a + 1.57) * 2.6, Math.sin(a) * 8 + 4 + Math.sin(a + 1.57) * 2.6]
    stroke(g, [[0, 6], mid, [x1, y1]], { w: 7.4, color: C.ink, press: 'swell', alpha: 0.9, rough: 0.3, seed: 90 + i })
    stroke(g, [[0, 6], mid, [x1, y1]], { w: 5.8, color: mix(C.silk, C.goldL, 0.15), press: 'swell', alpha: 1, rough: 0.3, seed: 91 + i })
    stroke(g, [mid, [x1, y1]], { w: 3.2, color: C.goldL, press: 'rise', alpha: 0.9, rough: 0.3, seed: 92 + i })
  }
  foxHead(g, mix(C.silk, C.goldL, 0.25), WHITE, C.cinnabarL, 101, 0.72, 3)
  blot(g, 0, -4.2, 0.9, C.cinnabar, 1, 102, 1.4) // ấn đỏ giữa trán
}

function eagle(g: G) {
  const fill = mix(C.ochre, C.ink, 0.38)
  const head: Pt[] = [[-10, -12], [-2, -14.5], [6, -11.5], [10, -7.5], [8.5, -1.5], [3, 3], [-2, 9], [-6, 14.5], [-14.5, 14.5], [-13, 2], [-12, -6]]
  part(g, head, fill, 111, 1.2)
  for (let i = 0; i < 5; i++) ln(g, [[-9 + i * 2.4, -9 + i], [-7 + i * 2.4, -4 + i * 1.5]], 0.9, mix(fill, C.silk, 0.5), 'taper', 0.6, 112 + i) // lông vằn
  for (let i = 0; i < 4; i++) ln(g, [[-13 + i * 2.4, 12], [-14 + i * 2.4, 16]], 1, C.ink, 'taper', 0.7, 117 + i)
  const beak: Pt[] = [[8.6, -8.4], [13.5, -7.6], [17, -4.4], [16.4, 1.2], [14.8, -1.6], [12, -2.4], [8.3, -2.2]]
  part(g, beak, C.goldL, 121, 1)
  ln(g, [[9.4, -5.2], [13, -4.8]], 0.6, C.goldD, 'taper', 0.9, 122)
  eye(g, 3.8, -7.2, 2.3, C.gamboge, false, 123)
  ln(g, [[0.4, -10.4], [4, -9.8], [7.6, -8.2]], 1.3, C.ink, 'nail', 0.95, 124) // gờ mày
}

function ape(g: G) {
  const mane: Pt[] = Array.from({ length: 26 }, (_, i) => {
    const a = (i / 26) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 13.4 : 15.6
    return [Math.cos(a) * r, Math.sin(a) * r + 0.5] as Pt
  })
  part(g, mane, C.silk, 131, 1.1)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    ln(g, [[Math.cos(a) * 10.5, Math.sin(a) * 10.5], [Math.cos(a) * 13.5, Math.sin(a) * 13.5]], 0.7, C.ink3, 'taper', 0.6, 132 + i)
  }
  const face: Pt[] = [[0, -9.5], [6, -8.6], [8.4, -3], [7.4, 4], [3, 9.2], [0, 10.2], [-3, 9.2], [-7.4, 4], [-8.4, -3], [-6, -8.6]]
  part(g, face, mix(C.ochreL, C.cinnabarL, 0.3), 141, 1)
  ln(g, [[-6.4, -3.4], [0, -5.2], [6.4, -3.4]], 1.8, mix(C.ochre, C.ink, 0.5), 'swell', 0.9, 142)
  for (const x of [-3.2, 3.2]) {
    blot(g, x, -1, 1.4, C.ink, 1, 143 + x, 0.9)
    blot(g, x - 0.4, -1.4, 0.35, WHITE, 0.9, 144 + x, 1)
  }
  blot(g, -1, 3.8, 0.45, C.ink, 1, 145, 1)
  blot(g, 1, 3.8, 0.45, C.ink, 1, 146, 1)
  ln(g, [[-3.2, 6.8], [0, 7.8], [3.2, 6.8]], 0.8, C.ink, 'even', 0.9, 147)
}

function leopard(g: G) {
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 6
    ln(g, [[x, -8], [x + (i - 1) * 1.5 + 1, -13], [x + (i - 1) * 2 - 0.5, -17]], 3.2 - Math.abs(i - 1) * 0.8, i === 1 ? C.gamboge : C.cinnabarL, 'rise', 0.95, 150 + i)
  }
  const head: Pt[] = [[-11, -12], [-6, -8.2], [6, -8.2], [11, -12], [12.4, -4], [13.4, 3], [8, 9.5], [0, 12.4], [-8, 9.5], [-13.4, 3], [-12.4, -4]]
  part(g, head, mix(C.gamboge, C.cinnabarL, 0.35), 155, 1.2)
  for (const [x, y, r] of [[-7, -4, 1.2], [7, -4, 1.2], [-3, -6.5, 0.9], [3, -6.5, 0.9], [-10.5, 1.5, 1.1], [10.5, 1.5, 1.1], [-9, 5.5, 0.9], [9, 5.5, 0.9], [0, -5, 0.8]] as const) {
    ln(g, Array.from({ length: 8 }, (_, i) => [x + Math.cos((i / 7) * 5.4) * r, y + Math.sin((i / 7) * 5.4) * r] as Pt), 0.7, C.ink, 'even', 0.85, 156 + x + y)
  }
  part(g, oval(0, 6.2, 5.2, 3.6, 20), C.silk, 157, 0.8)
  wash(g, [[-1.8, 3], [1.8, 3], [0, 5.2]], { fill: C.cinnabarL, alpha: 1, layers: 1, jitter: 0.05, sharp: true, seed: 158 })
  for (const s of [-1, 1]) {
    const e = oval(4.8 * s, -1.2, 2.2, 1.2, 14, s * 0.3)
    wash(g, e, { fill: C.goldL, alpha: 1, layers: 1, jitter: 0.05, seed: 159 + s })
    ln(g, [[4.8 * s, -2.3], [4.8 * s, -0.1]], 0.7, C.ink, 'swell', 1, 160 + s)
  }
}

function rhino(g: G) {
  const stone = mix(C.ink3, C.paper2, 0.25)
  const ear: Pt[] = [[-9.5, -7], [-11.5, -13.5], [-6, -8.4]]
  part(g, ear, stone, 171, 1)
  const head: Pt[] = [[-12, -6], [-4, -9], [4, -8], [9, -5], [14, -2], [16.5, 3], [13, 7.4], [6, 9], [-2, 11], [-12, 12.4], [-14.5, 3]]
  part(g, head, stone, 172, 1.3)
  // phiến đá giáp
  ln(g, [[-10, -4], [-6, -1], [-8, 4], [-4, 8]], 1, C.ink, 'even', 0.7, 173)
  ln(g, [[-3, -7.5], [0, -3], [-1, 3]], 0.9, C.ink, 'even', 0.6, 174)
  ln(g, [[-9, -6], [-3, -8.2], [3, -7.4]], 1.1, C.silk, 'taper', 0.45, 175)
  part(g, [[9.6, -4], [12.4, -16], [15.8, -3.2]], mix(C.paper, C.ochre, 0.3), 176, 1)
  part(g, [[4, -7.6], [5.6, -12.4], [7.4, -7]], mix(C.paper, C.ochre, 0.3), 177, 0.9)
  eye(g, 2.4, -2.2, 1.1, C.gamboge, false, 178)
  ln(g, [[15.6, 3], [13.4, 5]], 0.8, C.ink, 'nail', 0.8, 179)
}

function hawk(g: G) {
  const wing: Pt[] = [[-2, -2], [-8.5, -9.5], [-16.5, -8.5], [-14, -5.6], [-16.5, -2.4], [-12.4, -0.6], [-14.4, 2.8], [-9, 3], [-4, 4.4]]
  const wc = mix(C.indigo, C.azuriteL, 0.35)
  part(g, wing, wc, 181, 1.1)
  part(g, flipX(wing), wc, 182, 1.1)
  for (const s of [-1, 1])
    for (let i = 0; i < 3; i++) ln(g, [[-4 * s, 0 + i], [-11 * s, -5 + i * 3]], 0.8, C.silk, 'taper', 0.6, 183 + i + s)
  part(g, [[-2.8, 8.5], [2.8, 8.5], [4, 14.5], [0, 13], [-4, 14.5]], wc, 186, 1)
  part(g, oval(0, 2, 3.6, 7, 18), mix(wc, C.ink, 0.3), 187, 1)
  part(g, oval(0, -6, 3, 3, 14), mix(wc, C.ink, 0.2), 188, 1)
  wash(g, [[-1, -4.6], [1, -4.6], [0, -2.4]], { fill: C.goldL, alpha: 1, layers: 1, jitter: 0.05, sharp: true, seed: 189 })
  blot(g, -1.2, -6.6, 0.6, C.goldL, 1, 190, 1)
  blot(g, 1.2, -6.6, 0.6, C.goldL, 1, 191, 1)
  // sét trong móng
  ln(g, [[-2.5, 9], [0.5, 11.2], [-1.5, 12.6], [2.5, 16]], 1.3, C.goldL, 'nail', 1, 192)
}

function turtle(g: G) {
  const skin = mix(C.malachiteD, C.ink3, 0.4)
  for (const [x, y] of [[-9, -7], [9, -7], [-9, 7], [9, 7]] as const) part(g, oval(x, y, 3, 2.4, 12, Math.atan2(y, x)), skin, 201 + x + y, 0.9)
  part(g, oval(0, -13.2, 2.8, 3.4, 14), skin, 206, 0.9)
  blot(g, -1.1, -14, 0.5, C.goldL, 1, 207, 1)
  blot(g, 1.1, -14, 0.5, C.goldL, 1, 208, 1)
  part(g, [[-1, 11], [1, 11], [0, 14.6]], skin, 209, 0.8)
  const shell = mix(C.indigo, C.malachiteD, 0.5)
  part(g, oval(0, 0, 10.4, 12.2, 30), shell, 210, 1.4)
  const hex = Array.from({ length: 6 }, (_, i) => [Math.cos((i / 6) * Math.PI * 2 + Math.PI / 6) * 4.2, Math.sin((i / 6) * Math.PI * 2 + Math.PI / 6) * 4.6] as Pt)
  ln(g, [...hex, hex[0]], 0.9, C.goldL, 'even', 0.75, 211)
  hex.forEach(([x, y], i) => ln(g, [[x, y], [x * 2.25, y * 2.3]], 0.8, C.goldL, 'even', 0.6, 212 + i))
  ln(g, [[-6, -7], [0, -9.5], [6, -7]], 1.2, C.silk, 'taper', 0.35, 219)
}

function tiger(g: G) {
  const head: Pt[] = [[-12, -11.5], [-8, -9], [8, -9], [12, -11.5], [14.2, -3], [14.2, 4], [9, 10], [0, 13.2], [-9, 10], [-14.2, 4], [-14.2, -3]]
  part(g, head, C.silk, 221, 1.3)
  for (const s of [-1, 1]) {
    blot(g, 10.6 * s, -9, 1.6, C.ink, 0.9, 222 + s, 0.8)
    for (const [y0, y1] of [[-0.5, 0.5], [3.5, 4.2], [7, 7]] as const) ln(g, [[14 * s, y0], [9.5 * s, y1 + 0.4], [8.2 * s, y1 - 0.4]], 1.4, C.ink, 'nail', 0.9, 223 + y0 + s)
    ln(g, [[5.6 * s, -8.2], [2.6 * s, -5.2]], 1.3, C.ink, 'nail', 0.9, 227 + s)
    ln(g, [[9 * s, -7], [6.6 * s, -4.8]], 1, C.ink, 'nail', 0.85, 228 + s)
    const e = oval(4.8 * s, -1.6, 2.2, 1.2, 14, s * 0.3)
    wash(g, e, { fill: C.azuriteL, alpha: 1, layers: 1, jitter: 0.05, seed: 229 + s })
    blot(g, 4.9 * s, -1.6, 0.7, C.ink, 1, 230 + s, 1)
    ln(g, [...e, e[0]], 0.6, C.ink, 'even', 0.9, 231 + s)
  }
  part(g, oval(-2.6, 6.8, 3.2, 2.6, 16), WHITE, 232, 0.7)
  part(g, oval(2.6, 6.8, 3.2, 2.6, 16), WHITE, 233, 0.7)
  wash(g, [[-2, 3.4], [2, 3.4], [0, 5.6]], { fill: C.cinnabarL, alpha: 1, layers: 1, jitter: 0.05, sharp: true, seed: 234 })
  for (const [x, y] of [[-3.6, 6.6], [-2, 7.8], [2, 7.8], [3.6, 6.6]] as const) blot(g, x, y, 0.3, C.ink, 1, 235 + x, 1)
}

function phoenix(g: G) {
  const ice = mix(C.azuriteL, C.silk, 0.5)
  // đuôi lông dài uốn xuống
  for (let i = 0; i < 4; i++) {
    const end: Pt = [-15.5 + i * 3.2, 11 + i * 1.6]
    const plume: Pt[] = [[-4, 2], [-8 - i * 0.4, 3.5 + i], [-9.5 + i * 0.8, 8 + i * 0.8], end]
    stroke(g, plume, { w: 3.8, color: C.ink, press: 'swell', alpha: 0.85, rough: 0.3, seed: 240 + i })
    stroke(g, plume, { w: 2.8, color: i % 2 ? C.silk : C.azuriteL, press: 'swell', alpha: 1, rough: 0.3, seed: 244 + i })
    blot(g, end[0], end[1], 1.7, C.azurite, 1, 248 + i, 0.8)
    blot(g, end[0], end[1], 0.8, C.goldL, 1, 252 + i, 1)
  }
  part(g, [[0, -4.5], [-4.5, -14.5], [2.4, -10.4], [6.4, -5]], mix(ice, C.azurite, 0.3), 248, 1)
  ln(g, [[0.5, -5.5], [-2.6, -11.5]], 0.7, C.silk, 'taper', 0.7, 249)
  part(g, [[2, -6], [8, -5], [10.4, 0], [6, 4.4], [-2, 4.4], [-6.4, 1]], ice, 250, 1.1)
  part(g, oval(9, -9, 3.1, 3, 14), ice, 251, 1)
  wash(g, [[11.6, -9.8], [15, -8.6], [11.6, -7.8]], { fill: C.goldL, alpha: 1, layers: 1, jitter: 0.05, sharp: true, seed: 252 })
  blot(g, 9.8, -9.6, 0.65, C.ink, 1, 253, 1)
  for (let i = 0; i < 3; i++) {
    const tip: Pt = [4.5 - i * 1.8, -15.5 - i * 1.1]
    ln(g, [[8.4 - i * 0.6, -11.8], [6.4 - i, -14], tip], 0.9, C.azurite, 'taper', 0.95, 254 + i)
    blot(g, tip[0], tip[1], 0.9, C.azuriteL, 1, 257 + i, 1)
  }
}

function dragon(g: G) {
  const jade = C.malachite
  for (let i = 0; i < 3; i++) ln(g, [[-8, -4 + i * 5.5], [-14.5, -2 + i * 6], [-13, 1 + i * 6]], 2, C.goldL, 'nail', 0.9, 260 + i) // bờm
  ln(g, [[-2, -8], [-7, -12.5], [-11, -15.5]], 2.2, mix(C.paper, C.ochre, 0.3), 'nail', 1, 263) // sừng
  ln(g, [[-5, -7], [-9.5, -9.6], [-13.5, -11]], 1.8, mix(C.paper, C.ochre, 0.3), 'nail', 1, 264)
  const head: Pt[] = [[-10, -6], [-3, -9], [5, -7.4], [10, -6], [16, -4], [17.2, -1], [14, 1], [8.4, 2], [13, 5], [6, 8], [-2, 9.2], [-10, 12.4], [-14.4, 4]]
  part(g, head, jade, 265, 1.3)
  wash(g, [[8.4, 2], [14, 1], [13, 5]], { fill: mix(C.cinnabar, C.ink, 0.3), alpha: 1, layers: 1, jitter: 0.05, sharp: true, seed: 266 })
  ln(g, [[9.6, 2.1], [10.2, 3.2]], 0.6, WHITE, 'taper', 1, 267)
  ln(g, [[12, 1.4], [12.4, 2.6]], 0.6, WHITE, 'taper', 1, 268)
  for (let i = 0; i < 4; i++) ln(g, [[-8 + i * 3, 3 + (i % 2)], [-6.8 + i * 3, 4.2 + (i % 2)], [-5.6 + i * 3, 3 + (i % 2)]], 0.6, C.malachiteD, 'even', 0.8, 269 + i) // vảy
  ln(g, [[-2, -7.6], [5, -6.2], [12, -4.2]], 1, C.malachiteL, 'taper', 0.6, 273)
  eye(g, 5.2, -4, 1.5, C.goldL, true, 274)
  ln(g, [[2.6, -6.6], [7.6, -6.2]], 1.2, C.ink, 'nail', 0.95, 275)
  ln(g, [[15, -0.6], [10, 7], [3, 13.6]], 0.6, C.goldL, 'taper', 0.9, 276) // râu
  ln(g, [[15.6, -3.6], [11, -11], [4, -14.6]], 0.6, C.goldL, 'taper', 0.9, 277)
}

// ---------- Tông môn đối địch ----------

function wind(g: G) {
  for (let k = 0; k < 3; k++) {
    const pts: Pt[] = []
    for (let i = 0; i <= 22; i++) {
      const t = i / 22, a = k * 2.1 + t * Math.PI * 2.1, r = 14.5 * (1 - t * 0.78)
      pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.9])
    }
    stroke(g, pts, { w: 3.6, color: C.ink, press: 'nail', alpha: 0.9, rough: 0.35, seed: 300 + k })
    stroke(g, pts, { w: 2.6, color: C.silk, press: 'nail', alpha: 1, rough: 0.35, seed: 303 + k })
  }
  for (const [x, y, a] of [[10, -10, 0.6], [-12, 6, 2.4], [5, 12, -0.8]] as const) {
    const leaf = oval(x, y, 2.6, 1.2, 12, a)
    part(g, leaf, C.malachiteL, 306 + x, 0.7)
  }
}
function blood(g: G) {
  // lưỡi kiếm dựng + giọt máu
  part(g, [[-1.4, -15], [1.4, -15], [1.8, 8], [0, 11], [-1.8, 8]], mix(C.silk, C.ink3, 0.25), 310, 1)
  ln(g, [[0, -14], [0, 8]], 0.5, C.ink3, 'even', 0.7, 311)
  part(g, [[-6, 8.6], [6, 8.6], [6, 10.6], [-6, 10.6]], C.gold, 312, 0.9)
  const drop: Pt[] = [[0, -6], [3.6, 0], [5.4, 4.4], [4.4, 8.4], [0, 10.4], [-4.4, 8.4], [-5.4, 4.4], [-3.6, 0]].map(([x, y]) => [x + 6.5, y - 2] as Pt)
  part(g, drop, C.cinnabar, 313, 1.1)
  blot(g, 4.8, 3.4, 1, WHITE, 0.6, 314, 1.4)
  blot(g, -6, 12, 1.3, C.cinnabar, 1, 315, 0.8)
  blot(g, -3.6, 14.6, 0.8, C.cinnabar, 1, 316, 0.9)
}
function poison(g: G) {
  const v = mix(C.indigo, '#6a4a9a', 0.6)
  // bọ cạp nhìn từ trên
  const tail: Pt[] = [[0, 6], [0.5, 10.5], [3.5, 14], [8, 13.4], [9.6, 9.4], [7.6, 6.4]]
  stroke(g, tail, { w: 4.4, color: C.ink, press: t => 1 - t * 0.45, alpha: 0.95, rough: 0.3, seed: 320 })
  stroke(g, tail, { w: 3.2, color: v, press: t => 1 - t * 0.45, alpha: 1, rough: 0.3, seed: 321 })
  part(g, [[7.6, 6.4], [9.8, 4.2], [8.6, 7.4]], C.malachiteL, 322, 0.7) // ngòi độc
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) ln(g, [[2.5 * s, -2 + i * 2.6], [7 * s, -3.5 + i * 3.4], [9 * s, -1 + i * 3.6]], 1, C.ink, 'taper', 0.9, 323 + i + s)
    ln(g, [[2.2 * s, -6], [7.5 * s, -10.5], [9 * s, -14]], 1.5, C.ink, 'nail', 0.95, 327 + s)
    part(g, s > 0 ? [[7, -14], [11.5, -16], [11, -12.5], [9, -11.5]] : flipX([[7, -14], [11.5, -16], [11, -12.5], [9, -11.5]]), v, 329 + s, 0.9)
  }
  part(g, oval(0, 0, 3.8, 7.4, 18), v, 331, 1.1)
  part(g, oval(0, -7.8, 2.8, 2.2, 14), v, 332, 1)
  for (let i = 0; i < 3; i++) ln(g, [[-3, -3 + i * 3], [3, -3 + i * 3]], 0.6, C.ink, 'even', 0.7, 333 + i)
  blot(g, -2, 12, 2.4, C.malachiteL, 0.35, 336, 0.8)
  blot(g, 12, 2, 1.8, C.malachiteL, 0.35, 337, 0.8)
}
function demon(g: G) {
  const skin = mix(C.cinnabar, C.ink, 0.35)
  for (const s of [-1, 1]) ln(g, [[6.5 * s, -8], [11 * s, -12], [12.5 * s, -17]], 3.2, mix(C.paper, C.ochre, 0.35), 'nail', 1, 340 + s) // sừng
  const face: Pt[] = [[-8, -10], [0, -12], [8, -10], [12, -3], [11, 5], [6, 12], [0, 14], [-6, 12], [-11, 5], [-12, -3]]
  part(g, face, skin, 343, 1.3)
  for (const s of [-1, 1]) {
    const e: Pt[] = s > 0 ? [[1.6, -2.4], [8, -4.8], [6.4, -0.6]] : flipX([[1.6, -2.4], [8, -4.8], [6.4, -0.6]])
    part(g, e, C.goldL, 344 + s, 0.8)
    ln(g, [[2 * s, -4.6], [9 * s, -7.4]], 1.4, C.ink, 'nail', 0.95, 346 + s)
    wash(g, s > 0 ? [[3, 7], [4.4, 7], [3.8, 10]] : [[-4.4, 7], [-3, 7], [-3.8, 10]], { fill: WHITE, alpha: 1, layers: 1, jitter: 0.05, sharp: true, seed: 348 + s })
  }
  ln(g, [[-5, 7], [0, 5.6], [5, 7]], 1.1, C.ink, 'even', 0.9, 350)
  blot(g, 0, -7.6, 1.2, C.goldL, 1, 351, 1.2) // ấn giữa trán
}
function ghost(g: G) {
  const flame: Pt[] = [[0, -16], [3, -9], [7.5, -8.5], [6.5, -3], [10, 2], [8, 9], [2, 13], [-4, 12.4], [-9, 8], [-9.5, 1], [-6, -4], [-4, -10], [-1.5, -6.5]]
  part(g, flame, mix(C.malachiteL, C.spirit, 0.5), 360, 1.1)
  wash(g, flame.map(([x, y]) => [x * 0.55, y * 0.55 + 3.5] as Pt), { fill: '#e8fff6', alpha: 0.8, layers: 2, jitter: 0.3, seed: 361 })
  blot(g, -2.6, 2.6, 1.6, C.ink, 0.95, 362, 1.3)
  blot(g, 2.6, 2.6, 1.6, C.ink, 0.95, 363, 1.3)
  ln(g, [[-1.8, 7.2], [0, 6.4], [1.8, 7.2]], 1, C.ink, 'even', 0.85, 364)
}

// ---------- Bí cảnh, lôi kiếp ----------

function wood(g: G) {
  ln(g, [[0, 15], [-0.6, 6], [0.4, 0]], 3.4, mix(C.ochre, C.ink, 0.45), 'rise', 1, 370)
  ln(g, [[0, 5], [-5, 1]], 1.4, mix(C.ochre, C.ink, 0.45), 'taper', 1, 371)
  ln(g, [[0.2, 3], [5, -1]], 1.4, mix(C.ochre, C.ink, 0.45), 'taper', 1, 372)
  for (const [x, y, r, c] of [[-6, -4, 6, C.malachiteD], [6, -4, 6, C.malachiteD], [0, -9, 7, C.malachite], [-3, -2, 5, C.malachite], [4, -1, 5, C.malachiteL]] as const) {
    const pts = oval(x, y, r, r * 0.82, 18)
    part(g, pts, c, 373 + x + y, 0.9)
  }
  blot(g, -3, -10, 1.2, C.goldL, 0.9, 380, 1)
  blot(g, 5, -6, 1, C.goldL, 0.9, 381, 1)
}
function fire(g: G) {
  const outer: Pt[] = [[0, -16], [3.5, -8], [8, -10], [9.5, -2], [11, 4], [8.5, 10.5], [2, 13.6], [-5, 12.6], [-10, 7.4], [-10.5, 0], [-7.5, -5], [-5, -3], [-3, -10]]
  part(g, outer, C.cinnabar, 390, 1.2)
  wash(g, outer.map(([x, y]) => [x * 0.66, y * 0.62 + 4] as Pt), { fill: C.gamboge, alpha: 1, layers: 2, jitter: 0.3, seed: 391 })
  wash(g, outer.map(([x, y]) => [x * 0.34, y * 0.34 + 7.6] as Pt), { fill: '#fff4c8', alpha: 1, layers: 2, jitter: 0.3, seed: 392 })
}
function ice(g: G) {
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2, c = Math.cos(a), s = Math.sin(a)
    ln(g, [[0, 0], [c * 15, s * 15]], 3.4, C.ink, 'even', 0.85, 400 + i)
    ln(g, [[0, 0], [c * 15, s * 15]], 2.2, WHITE, 'even', 1, 406 + i)
    for (const k of [0.45, 0.72]) {
      const bx = c * 15 * k, by = s * 15 * k
      for (const d of [-0.9, 0.9]) {
        const e: Pt = [bx + Math.cos(a + d) * 4.4 * (1.1 - k), by + Math.sin(a + d) * 4.4 * (1.1 - k)]
        ln(g, [[bx, by], e], 1.4, C.azuriteL, 'taper', 1, 412 + i + k * 10 + d)
      }
    }
  }
  part(g, Array.from({ length: 6 }, (_, i) => [Math.cos((i / 6) * Math.PI * 2) * 3.4, Math.sin((i / 6) * Math.PI * 2) * 3.4] as Pt), C.azuriteL, 430, 0.9)
}
function thunder(g: G) {
  for (const [x, y, r] of [[-7, -7, 6.5], [1, -10, 7.5], [8, -6.5, 6], [0, -4, 7]] as const) blot(g, x, y, r, mix(C.indigo, C.ink, 0.35), 1, 440 + x, 0.75)
  for (const [x, y, r] of [[-7, -8.5, 3], [1, -11.5, 3.6], [8, -8, 2.6]] as const) blot(g, x, y, r, mix(C.indigo, C.silk, 0.3), 0.6, 445 + x, 0.7)
  const bolt: Pt[] = [[1.5, -3], [-3.5, 4.5], [0.6, 4.8], [-2.6, 15], [6.6, 1.8], [2.4, 1.6], [5.6, -3]]
  part(g, bolt, C.goldL, 450, 1)
}

// Lôi Trì: mây đen, sét đánh xuống hồ nước, sóng vòng toé bọt
function thunderPool(g: G) {
  part(g, oval(0, 9.5, 14.5, 5.4, 30), mix(C.azurite, C.indigo, 0.3), 700, 1.1)
  for (const [rx, ry, a] of [[10, 3.2, 0.8], [6, 1.9, 0.9]] as const) ln(g, oval(0, 9.2, rx, ry, 24).concat([[rx, 9.2]]), 0.8, C.azuriteL, 'even', a, 701 + rx)
  for (const [x, y, r] of [[-8, -11, 6], [0, -13, 7], [8, -10.5, 6], [-2, -8.5, 6]] as const) blot(g, x, y, r, mix(C.indigo, C.ink, 0.4), 1, 703 + x, 0.7)
  for (const [x, y, r] of [[-7, -12.5, 2.6], [1, -14.5, 3.2]] as const) blot(g, x, y, r, mix(C.indigo, C.silk, 0.35), 0.6, 707 + x, 0.7)
  part(g, [[1.4, -8], [-3.6, 0], [0, 0.2], [-2, 8.6], [5.6, -1.6], [1.8, -1.8], [4.4, -8]], C.goldL, 709, 0.9)
  for (const [x, a] of [[-3.6, -2.2], [0.6, -1.6], [4.6, -0.9]] as const) ln(g, [[x - 2, 8], [x - 2 + Math.cos(a) * 3.4, 8 + Math.sin(a) * 3.4]], 1, WHITE, 'taper', 0.95, 710 + x)
  blot(g, -2, 8.6, 2, WHITE, 0.7, 713, 0.5)
}
// Hỗn Độn: xoáy mực nguyên sơ, các dải sắc cuộn vào lõi sáng, sao lấm tấm
function chaos(g: G) {
  const arm = (k: number, r0: number, turns: number): Pt[] =>
    Array.from({ length: 30 }, (_, i) => {
      const t = i / 29, a = k + t * Math.PI * 2 * turns, r = r0 * (1 - t * 0.9)
      return [Math.cos(a) * r, Math.sin(a) * r * 0.92] as Pt
    })
  const hues = ['#8a73cf', C.cinnabarL, C.azuriteL, C.malachiteL]
  hues.forEach((c, i) => {
    const pts = arm((i / 4) * Math.PI * 2, 16, 0.95)
    stroke(g, pts, { w: 5.2, color: C.ink, press: 'nail', alpha: 0.92, rough: 0.35, seed: 720 + i })
    stroke(g, pts, { w: 2.4, color: c, press: 'nail', alpha: 1, rough: 0.35, seed: 724 + i })
  })
  blot(g, 0, 0, 4.2, C.silk, 0.5, 728, 1)
  blot(g, 0, 0, 2.2, '#fff6d8', 1, 729, 1)
  for (const [x, y, r] of [[-11, -9, 0.7], [12, -6, 0.6], [-6, 12, 0.6], [9, 10, 0.8], [2, -14, 0.5]] as const) blot(g, x, y, r, WHITE, 0.95, 730 + x, 1)
}

// ---------- Ngũ hành ----------

// Kim: nén vàng 元宝 — hai đầu cong vút, bụng tròn nhô, ánh kim toả
function metal(g: G) {
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * (0.1 + (i / 8) * 0.8)
    ln(g, [[Math.cos(a) * 9, -1 + Math.sin(a) * 9], [Math.cos(a) * 15, -1 + Math.sin(a) * 15]], i % 2 ? 0.9 : 1.4, C.goldL, 'taper', 0.75, 740 + i)
  }
  part(g, oval(0, -1.6, 7, 7.2, 22), C.goldL, 750, 1.1)
  ln(g, [[-4, -4.6], [-1.4, -7.2]], 1.3, WHITE, 'taper', 0.75, 751)
  part(g, [[-15, -5], [-11, -1.4], [-6, 0.2], [6, 0.2], [11, -1.4], [15, -5], [13.4, 1.6], [9, 7.6], [0, 10.2], [-9, 7.6], [-13.4, 1.6]], C.gold, 752, 1.2)
  ln(g, [[-12.4, -2.6], [-7, 1.6], [0, 2.2], [7, 1.6], [12.4, -2.6]], 0.8, C.goldD, 'taper', 0.8, 753)
  ln(g, [[-10.6, 4], [-5, 7.6]], 1.1, WHITE, 'taper', 0.55, 754)
}
// Thuỷ: giọt nước, sóng cuộn trắng bên trong
function water(g: G) {
  const drop: Pt[] = [[0, -15.6], [4.2, -8], [8.4, -1.4], [9.6, 4], [7.8, 9.6], [3.8, 12.8], [0, 13.4], [-3.8, 12.8], [-7.8, 9.6], [-9.6, 4], [-8.4, -1.4], [-4.2, -8]]
  part(g, drop, mix(C.azuriteL, C.spirit, 0.3), 760, 1.2)
  wash(g, drop.map(([x, y]) => [x * 0.82 + 0.8, y * 0.82 + 2.2] as Pt), { fill: C.azurite, alpha: 0.55, layers: 2, jitter: 0.3, seed: 761 })
  ln(g, [[-7, 7], [-4, 4.2], [0, 4.4], [2.6, 6.6], [1.6, 9], [-0.8, 8.4], [-0.4, 6.8]], 1.3, WHITE, 'taper', 0.95, 762)
  ln(g, [[1.6, 9], [4.4, 9.4], [6.8, 7.4]], 1, WHITE, 'taper', 0.85, 763)
  ln(g, [[-4.6, -5.6], [-6.4, -0.4], [-6.2, 3.4]], 1.3, WHITE, 'taper', 0.6, 764)
}
// Thổ: gò đất vàng, vỉa đất sẫm xếp tầng, cỏ non trên đỉnh
function earth(g: G) {
  const hill: Pt[] = [[-15.4, 11.6], [-13.4, 3], [-8.6, -4.4], [-2.6, -9], [4, -9.6], [9.4, -5], [13.6, 2.4], [15.4, 11.6]]
  part(g, hill, mix(C.gamboge, C.ochreL, 0.45), 770, 1.3)
  wash(g, [[-15, 11.4], [-14, 5.6], [-6, 3.6], [2, 5.4], [9, 3.2], [14.4, 5.8], [15, 11.4]], { fill: C.ochre, alpha: 0.9, layers: 2, jitter: 0.3, seed: 771 })
  wash(g, [[-15, 11.4], [-14.6, 9.2], [-5, 8.2], [4, 9.6], [14.8, 8.4], [15, 11.4]], { fill: mix(C.ochre, C.ink, 0.35), alpha: 0.95, layers: 2, jitter: 0.3, seed: 772 })
  ln(g, [[-13.6, 5.2], [-6, 3.2], [2, 5], [9, 2.8], [14, 5.4]], 0.8, C.ink, 'taper', 0.6, 773)
  ln(g, [[-14.4, 9], [-5, 7.8], [4, 9.2], [14.6, 8]], 0.7, C.ink, 'taper', 0.55, 774)
  for (const [x, y] of [[-6, 0.6], [5, -2.4], [-1, 6.4]] as const) blot(g, x, y, 0.8, mix(C.ochre, C.ink, 0.4), 0.9, 775 + x, 0.8)
  ln(g, [[-7, -6.4], [-3, -4.6], [2, -6.8]], 1.1, WHITE, 'taper', 0.4, 778)
  for (const [x, d] of [[0.6, -1], [2, 1], [1.2, 0.2]] as const) ln(g, [[x, -9.2], [x + d * 1.6, -13]], 1, C.malachite, 'nail', 1, 779 + d)
}

// Luyện Khí Phòng: đe sắt, búa, tia lửa
function anvil(g: G) {
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.15 + (i / 6) * 0.7)
    ln(g, [[2 + Math.cos(a) * 4, -4 + Math.sin(a) * 4], [2 + Math.cos(a) * (8 + (i % 2) * 3), -4 + Math.sin(a) * (8 + (i % 2) * 3)]], 1.1, i % 2 ? C.gamboge : C.goldL, 'taper', 0.95, 790 + i)
  }
  const iron = mix(C.ink2, C.indigo, 0.35)
  part(g, [[-15.4, -3], [-7, -2.4], [10, -3.4], [10, 1.2], [5, 2.2], [3.6, 6], [7.4, 9], [7.4, 12], [-7.4, 12], [-7.4, 9], [-3.6, 6], [-5, 2.2], [-9, 1.4]], iron, 800, 1.3)
  ln(g, [[-13, -2.6], [9.2, -3.2]], 1.2, mix(C.silk, C.ink3, 0.2), 'taper', 0.8, 801)
  ln(g, [[-4, 4], [-3, 10.4]], 0.9, WHITE, 'taper', 0.3, 802)
  ln(g, [[-4.6, -4.4], [6.8, -4.6]], 2, C.cinnabarL, 'taper', 1, 803) // phôi nung đỏ
  ln(g, [[-3.6, -4.5], [5.8, -4.7]], 0.8, '#fff0b0', 'taper', 1, 804)
  ln(g, [[13.6, 4.6], [5.6, -12.4]], 2, mix(C.ochre, C.ink, 0.25), 'even', 1, 805)
  part(g, [[1.4, -12.6], [9.4, -16.4], [11, -12.6], [3.2, -8.8]], iron, 806, 1.1)
}

// ---------- Hệ đệ tử ----------

function sword(g: G) {
  part(g, [[-1.8, -15], [1.8, -15], [2.2, 6], [0, 8], [-2.2, 6]], mix(C.silk, C.azuriteL, 0.3), 460, 1)
  ln(g, [[0, -14.5], [0, 5.5]], 0.6, C.azurite, 'even', 0.8, 461)
  part(g, [[-7, 7], [7, 7], [6, 9.4], [-6, 9.4]], C.gold, 462, 1)
  part(g, [[-1.6, 9.4], [1.6, 9.4], [1.6, 14.4], [-1.6, 14.4]], mix(C.lacquer, C.ink, 0.2), 463, 0.9)
  for (let i = 0; i < 3; i++) ln(g, [[-1.6, 10.4 + i * 1.5], [1.6, 11.2 + i * 1.5]], 0.5, C.goldD, 'even', 0.9, 464 + i)
  blot(g, 0, 15.6, 1.6, C.gold, 1, 467, 1)
  ln(g, [[0, 16.5], [-2.4, 19.5], [-1.2, 21.5]], 1.2, C.cinnabar, 'taper', 1, 468) // tua kiếm
  ln(g, [[-0.8, -13], [-0.6, 2]], 0.8, WHITE, 'taper', 0.6, 469)
}
function orb(g: G) {
  // hoả cầu kéo đuôi xoáy
  ln(g, [[-14, 12], [-9, 7], [-5, 4]], 4.4, C.cinnabarL, 'rise', 0.75, 470)
  ln(g, [[-12, 5], [-8, 3], [-5, 2]], 2.4, C.gamboge, 'rise', 0.7, 471)
  part(g, oval(2, -2, 9.6, 9.6, 26), C.cinnabar, 472, 1.2)
  wash(g, oval(3, -3, 6.2, 6.2, 20), { fill: C.gamboge, alpha: 1, layers: 2, jitter: 0.4, seed: 473 })
  wash(g, oval(4, -4.2, 3, 3, 14), { fill: '#fff6d0', alpha: 1, layers: 2, jitter: 0.2, seed: 474 })
  const sw: Pt[] = Array.from({ length: 16 }, (_, i) => {
    const t = i / 15, a = t * Math.PI * 1.7 + 2, r = 8.4 * (1 - t * 0.55)
    return [2 + Math.cos(a) * r, -2 + Math.sin(a) * r] as Pt
  })
  ln(g, sw, 1, '#fff6d0', 'taper', 0.8, 475)
}
function fist(g: G) {
  const skin = mix(C.ochreL, C.cinnabarL, 0.25)
  part(g, [[-9.5, -6], [-5, -11], [9, -10], [11.5, -4], [10.4, 4], [6, 8], [-6, 8], [-10.5, 3]], skin, 480, 1.3)
  for (let i = 0; i < 3; i++) ln(g, [[-5.5 + i * 4.8, -10.4], [-5 + i * 4.8, -3.5]], 0.9, C.ink, 'taper', 0.85, 481 + i)
  ln(g, [[-9.6, -2.6], [-2, -1.2], [2, -3.4]], 1.2, C.ink, 'nail', 0.9, 484) // ngón cái
  part(g, [[-6.4, 8], [6.4, 8], [6.8, 15.5], [-6.8, 15.5]], C.silk, 485, 1.1) // băng quấn cổ tay
  for (let i = 0; i < 3; i++) ln(g, [[-6.6, 9.6 + i * 2.2], [6.6, 10.4 + i * 2.2]], 0.6, C.ink3, 'even', 0.8, 486 + i)
  ln(g, [[-8, -7], [0, -10], [8, -8.6]], 1.1, WHITE, 'taper', 0.4, 489)
}

// ---------- Khoảnh khắc ----------

function win(g: G) {
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    ln(g, [[Math.cos(a) * 8, Math.sin(a) * 8], [Math.cos(a) * 16, Math.sin(a) * 16]], i % 2 ? 1.2 : 2, C.goldL, 'taper', 0.85, 500 + i)
  }
  for (const s of [-1, 1]) {
    const a = 0.7 * s, ca = Math.cos(a), sa = Math.sin(a)
    const b = (pts: Pt[]) => pts.map(([x, y]) => [x * ca - y * sa, x * sa + y * ca] as Pt)
    part(g, b([[-1.3, -14], [1.3, -14], [1.6, 5], [0, 7], [-1.6, 5]]), mix(C.silk, C.azuriteL, 0.25), 520 + s, 1)
    part(g, b([[-5, 6.4], [5, 6.4], [4.4, 8.2], [-4.4, 8.2]]), C.gold, 522 + s, 0.9)
    part(g, b([[-1.3, 8.2], [1.3, 8.2], [1.3, 12.5], [-1.3, 12.5]]), C.lacquer, 524 + s, 0.8)
  }
}
function lose(g: G) {
  const steel = mix(C.silk, C.ink3, 0.45)
  part(g, [[-1.6, -1], [1.8, -2.4], [2.4, 9], [0, 11], [-2.2, 9]], steel, 530, 1)
  part(g, [[-6, 10.4], [6, 10.4], [5.4, 12.4], [-5.4, 12.4]], mix(C.gold, C.ink3, 0.5), 531, 0.9)
  part(g, [[-1.4, 12.4], [1.4, 12.4], [1.4, 16], [-1.4, 16]], C.ink2, 532, 0.8)
  part(g, [[1, -15.5], [4.2, -15], [4.6, -5.6], [1.6, -4.4]].map(([x, y]) => [x + 2, y + 1] as Pt), steel, 533, 1) // mảnh gãy văng
  for (const [x, y, r] of [[-3, -6, 0.9], [-5.4, -8.4, 0.6], [4.2, -2, 0.7]] as const) blot(g, x, y, r, steel, 1, 534 + x, 1.3)
  ln(g, [[-2, -1.6], [0, -3.6], [1.2, -1.8], [2.6, -3]], 0.8, C.ink, 'even', 0.8, 537)
}
function rebirth(g: G) {
  const pts: Pt[] = Array.from({ length: 40 }, (_, i) => {
    const t = i / 39, a = t * Math.PI * 4.2 - Math.PI / 2, r = 2 + t * 12.5
    return [Math.cos(a) * r, Math.sin(a) * r] as Pt
  })
  stroke(g, pts, { w: 2.6, color: C.goldL, press: 'rise', alpha: 1, rough: 0.35, dry: 0.3, seed: 540 })
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    blot(g, Math.cos(a) * 15.5, Math.sin(a) * 15.5, 1.1, C.goldL, 0.95, 541 + i, 1)
  }
}
function lotus(g: G) {
  const petal = (a: number, len: number, wid: number, fill: string, seed: number) => {
    const c = Math.cos(a), s = Math.sin(a)
    const pts: Pt[] = [[0, 0], [c * len * 0.5 - s * wid, s * len * 0.5 + c * wid], [c * len, s * len], [c * len * 0.5 + s * wid, s * len * 0.5 - c * wid]]
    part(g, pts.map(([x, y]) => [x, y + 6] as Pt), fill, seed, 0.9)
  }
  for (const [a, l, w] of [[-2.6, 14, 4.4], [-0.54, 14, 4.4], [-2.1, 16, 5], [-1.04, 16, 5]] as const) petal(a, l, w, mix(C.cinnabarL, C.silk, 0.45), 550 + a * 10)
  petal(-Math.PI / 2, 18, 5.4, mix(C.cinnabarL, C.silk, 0.3), 556)
  for (let i = 0; i < 5; i++) ln(g, [[-10 + i * 5, 8], [-9 + i * 5, 12]], 0.7, C.malachiteD, 'taper', 0.8, 557 + i)
  part(g, oval(0, 9.5, 11, 3, 20), C.malachite, 562, 1)
  blot(g, 0, -4, 3.2, C.goldL, 0.95, 563, 1)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    ln(g, [[Math.cos(a) * 4.5, -4 + Math.sin(a) * 4.5], [Math.cos(a) * 7.5, -4 + Math.sin(a) * 7.5]], 0.8, C.goldL, 'taper', 0.8, 564 + i)
  }
}
function crest(g: G) {
  blot(g, 5, -8, 4.4, C.cinnabar, 1, 570, 1) // mặt trời son
  ln(g, [[-15, 8], [-8, -4], [-3, 3]], 2.6, C.ink, 'nail', 0.95, 571)
  ln(g, [[-6, 8], [2, -9], [9, 4], [15, 8]], 3, C.ink, 'nail', 0.95, 572)
  ln(g, [[-2, -1], [2, -9]], 1.2, C.silk, 'taper', 0.5, 573)
  ln(g, [[-14, 11.5], [0, 10.2], [14, 11.6]], 1.4, C.azurite, 'taper', 0.85, 574)
  ln(g, [[-10, 14.4], [2, 13.4], [11, 14.2]], 1, C.azurite, 'taper', 0.7, 575)
}
// Thông Thiên Tháp: tháp bảy tầng mái vút khỏi biển mây, đỉnh toả ánh vàng
function tower(g: G) {
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (i - 3.5) * 0.28
    ln(g, [[Math.cos(a) * 3, -13 + Math.sin(a) * 3], [Math.cos(a) * 8, -13 + Math.sin(a) * 8]], 0.9, C.goldL, 'taper', 0.85, 590 + i)
  }
  blot(g, 0, -13.2, 2.4, C.goldL, 0.95, 598, 1)
  ln(g, [[0, -10.6], [0, -16.8]], 0.9, C.goldD, 'even', 1, 599)
  for (let t = 0; t < 7; t++) {
    const y = 11 - t * 3.3, w = 7.2 - t * 0.78
    part(g, [[-w * 0.62, y], [w * 0.62, y], [w * 0.62, y - 2], [-w * 0.62, y - 2]], C.silk, 600 + t, 0.6)
    ln(g, [[-w * 0.3, y - 0.3], [-w * 0.3, y - 1.8]], 0.5, C.cinnabar, 'even', 0.9, 610 + t)
    ln(g, [[w * 0.3, y - 0.3], [w * 0.3, y - 1.8]], 0.5, C.cinnabar, 'even', 0.9, 620 + t)
    part(g, [[-w - 1.2, y - 1.6], [-w * 0.7, y - 3.2], [w * 0.7, y - 3.2], [w + 1.2, y - 1.6], [w * 0.7, y - 2.2], [-w * 0.7, y - 2.2]], C.malachite, 630 + t, 0.7)
  }
  for (const [x, y, r] of [[-9, 12.4, 4.2], [-2, 13.4, 4.8], [6, 12.6, 4.4], [12, 13.8, 3.2], [-13, 14.2, 3]] as const) blot(g, x, y, r, WHITE, 0.95, 640 + x, 0.6)
  ln(g, [[-14, 14.8], [0, 15.6], [14, 14.6]], 0.8, C.azurite, 'taper', 0.7, 650)
}

function tick(g: G) {
  ln(g, [[-9, 0], [-3.6, 7.4], [11, -10.4]], 3.4, C.cinnabar, t => (t < 0.35 ? 0.55 + t : 1.1 - (t - 0.35) * 1.3), 1, 580)
}

const DRAW: Record<Emblem, (g: G) => void> = {
  wolf, snake, bear, fox, eagle, ape, windWolf, leopard, rhino, nineFox, hawk, turtle, tiger, phoenix, dragon,
  wind, blood, poison, demon, ghost, wood, fire, ice, thunderPool, chaos, thunder, sword, orb, fist, win, lose, rebirth, lotus, crest, tick, tower,
  metal, water, earth, anvil,
}

// Huy hiệu: đĩa màu khoáng loang sáng trên tối dưới, vòng vàng một nét, viền mực, hình chạm ở giữa, ánh men
export function medal(emblem: Emblem, tone: MedalTone): Asset {
  return {
    x: -24, y: -24, w: 48, h: 48,
    draw(g) {
      const [light, dark] = DISC[tone]
      const disc = oval(0, 0, 22, 22, 44)
      wash(g, disc, {
        fill: g2 => {
          const gr = g2.createRadialGradient(-6, -8, 2, 0, 0, 24)
          gr.addColorStop(0, light)
          gr.addColorStop(1, dark)
          return gr
        },
        alpha: 1, layers: 2, jitter: 0.25, edge: 1.2, seed: 7,
      })
      // lòng đĩa trũng: mép tối dần
      const vg = g.createRadialGradient(0, 0, 12, 0, 0, 22)
      vg.addColorStop(0, rgba('#000000', 0))
      vg.addColorStop(1, rgba('#000000', 0.28))
      g.fillStyle = vg
      g.beginPath()
      g.arc(0, 0, 21.5, 0, Math.PI * 2)
      g.fill()
      ring(g, 0, 0, 19.6, 1.5, C.goldL, 9, 0.9, 0.03)
      ring(g, 0, 0, 21.2, 0.6, C.goldD, 10, 0.8, 0.05)
      DRAW[emblem](g)
      stroke(g, [[-15, -8], [-11, -13.5], [-5, -16.5]], { w: 1.6, color: WHITE, alpha: 0.32, press: 'swell', dry: 0.4, seed: 11 })
      stroke(g, [...disc, disc[0], disc[1]], { w: 1.1, color: C.ink, alpha: 0.9, press: 'even', rough: 0.3, seed: 12 })
      grain(g, 0.2)
    },
  }
}

// Hình chạm không đĩa (dùng làm ấn lớn, biểu tượng khoảnh khắc trên nền giấy)
export function emblemArt(emblem: Emblem): Asset {
  return { x: -20, y: -20, w: 40, h: 40, draw: g => (DRAW[emblem](g), grain(g, 0.2)) }
}

// ---------- Icon thanh tab (không đĩa, nhiều màu, đọc được trên ván sơn mài tối) ----------

export type TabIcon = 'tongMon' | 'monHa' | 'banDo' | 'tienMinh' | 'baoKho'
const TAB_DRAW: Record<TabIcon, (g: G) => void> = {
  // điện các hai tầng mái cong
  tongMon(g) {
    part(g, [[-15, 12], [15, 12], [15.6, 15.4], [-15.6, 15.4]], mix(C.paper2, C.ink3, 0.35), 600, 1)
    part(g, [[-11, 3], [11, 3], [11, 12], [-11, 12]], C.silk, 601, 1)
    for (const x of [-8.5, -3, 3, 8.5]) ln(g, [[x, 3.5], [x, 11.8]], 1.6, C.cinnabar, 'even', 1, 602 + x)
    part(g, [[-2, 6], [2, 6], [2, 12], [-2, 12]], mix(C.lacquer, C.ink, 0.2), 606, 0.8)
    part(g, [[-18, 4], [-13, -0.5], [13, -0.5], [18, 4], [13, 2.6], [-13, 2.6]], C.malachite, 607, 1.1)
    part(g, [[-7, -6], [7, -6], [7, -0.5], [-7, -0.5]], C.silk, 608, 0.9)
    for (const x of [-4.5, 4.5]) ln(g, [[x, -5.6], [x, -0.8]], 1.3, C.cinnabar, 'even', 1, 609 + x)
    part(g, [[-12.5, -5.5], [-7.5, -11], [7.5, -11], [12.5, -5.5], [7.5, -7], [-7.5, -7]], C.malachite, 611, 1.1)
    ln(g, [[-7, -10.4], [0, -10.8], [7, -10.4]], 0.9, C.malachiteL, 'taper', 0.8, 612)
    ln(g, [[-13, 0.2], [0, -0.2], [13, 0.2]], 0.9, C.malachiteL, 'taper', 0.8, 613)
    ln(g, [[0, -11], [0, -14.4]], 1.2, C.goldD, 'even', 1, 614)
    blot(g, 0, -15.2, 1.6, C.goldL, 1, 615, 1)
  },
  // đệ tử áo lam búi tóc, chuôi kiếm sau vai
  monHa(g) {
    ln(g, [[4.5, -3], [8, -8.5], [11, -13]], 1.8, C.ink2, 'even', 1, 620)
    ln(g, [[5.8, -7.6], [9.4, -5.4]], 1.6, C.gold, 'even', 1, 621)
    blot(g, 11.4, -13.6, 1.3, C.cinnabar, 1, 622, 1)
    part(g, [[-6, -2], [6, -2], [9.4, 15.4], [-9.4, 15.4]], C.azurite, 623, 1.2)
    part(g, [[-2.4, -2], [2.4, -2], [1.2, 15.4], [-1.2, 15.4]], mix(C.silk, C.azuriteL, 0.4), 624, 0.8)
    ln(g, [[-7, 5.2], [0, 5.8], [7, 5.2]], 2, C.gold, 'even', 1, 625)
    part(g, [[-6, -1.6], [-10.4, 6], [-8, 7.4], [-5, 2]], C.azurite, 626, 1)
    part(g, [[6, -1.6], [10.4, 6], [8, 7.4], [5, 2]], C.azurite, 627, 1)
    part(g, oval(0, -7, 4.4, 4.6, 18), mix(C.ochreL, C.silk, 0.55), 628, 1)
    wash(g, [[-4.4, -8], [-3.4, -11.2], [0, -12], [3.4, -11.2], [4.4, -8], [0, -9.6]], { fill: C.ink, alpha: 1, layers: 2, jitter: 0.2, seed: 629 })
    blot(g, 0, -13.2, 2.4, C.ink, 1, 630, 0.9)
    ln(g, [[-1.8, -13.6], [1.8, -13.4]], 0.8, C.gold, 'even', 1, 631)
    blot(g, -1.6, -6.4, 0.5, C.ink, 1, 632, 1)
    blot(g, 1.6, -6.4, 0.5, C.ink, 1, 633, 1)
  },
  // bản đồ trải: giấy, hai trục cuộn, núi, sông, đường son tới dấu X
  banDo(g) {
    part(g, [[-12, -10.5], [12, -11], [12.4, 10.6], [-12.2, 11]], mix(C.paper, C.ochreL, 0.3), 640, 1)
    ln(g, [[-9, 1], [-5.6, -5], [-2.6, 0]], 1.3, C.ink2, 'nail', 0.95, 641)
    ln(g, [[-4.6, 1], [0, -7], [4, 0.6]], 1.5, C.ink2, 'nail', 0.95, 642)
    ln(g, [[5, -9], [3, -3], [7, 3], [4, 9.5]], 1.6, C.azuriteL, 'taper', 1, 643)
    for (let i = 0; i < 5; i++) blot(g, -9 + i * 2.6, 6.4 - i * 0.9, 0.55, C.cinnabar, 1, 644 + i, 1)
    ln(g, [[6.4, 4.4], [9.4, 7.4]], 1.3, C.cinnabar, 'nail', 1, 650)
    ln(g, [[9.4, 4.4], [6.4, 7.4]], 1.3, C.cinnabar, 'nail', 1, 651)
    for (const x of [-13.4, 13.4]) {
      ln(g, [[x, -12.6], [x, 12.6]], 4.2, C.ink, 'even', 1, 652 + x)
      ln(g, [[x, -12.2], [x, 12.2]], 2.8, mix(C.ochre, C.ink, 0.35), 'even', 1, 653 + x)
      blot(g, x, -13.4, 1.5, C.gold, 1, 654 + x, 1)
      blot(g, x, 13.4, 1.5, C.gold, 1, 655 + x, 1)
    }
  },
  // hai lá cờ minh ước bắt chéo
  tienMinh(g) {
    ln(g, [[-12, 15.4], [0, 0], [11, -14.6]], 1.8, C.ink2, 'even', 1, 660)
    ln(g, [[12, 15.4], [0, 0], [-11, -14.6]], 1.8, C.ink2, 'even', 1, 661)
    part(g, [[-10.4, -13.6], [-0.4, -11.4], [-3.6, -8], [0.2, -4.6], [-9.2, -6.4]], C.cinnabar, 662, 1)
    part(g, [[10.4, -13.6], [9.2, -6.4], [-0.2, -4.6], [3.6, -8], [0.4, -11.4]], C.azurite, 663, 1)
    blot(g, -11.2, -15, 1.4, C.goldL, 1, 664, 1)
    blot(g, 11.2, -15, 1.4, C.goldL, 1, 665, 1)
    blot(g, 0, 0.4, 2, C.gold, 1, 666, 1)
    ln(g, [[0, 2], [-2, 6.6]], 1, C.cinnabar, 'taper', 1, 667)
    ln(g, [[0, 2], [2, 6.6]], 1, C.cinnabar, 'taper', 1, 668)
  },
  // rương báu sơn son, đai vàng, ánh báu
  baoKho(g) {
    for (const [x, y, r] of [[-7, -12, 1.4], [6, -14, 1.8], [11, -9, 1.1]] as const) {
      ln(g, [[x - r * 1.8, y], [x + r * 1.8, y]], 0.7, C.goldL, 'taper', 1, 670 + x)
      ln(g, [[x, y - r * 1.8], [x, y + r * 1.8]], 0.7, C.goldL, 'taper', 1, 671 + x)
    }
    part(g, [[-13, -1.6], [13, -1.6], [13, 13], [-13, 13]], mix(C.cinnabar, C.lacquer, 0.35), 673, 1.2)
    part(g, [[-13, -1.6], [-11.4, -8.4], [11.4, -8.4], [13, -1.6]], mix(C.cinnabar, C.lacquer, 0.2), 674, 1.2)
    for (const x of [-8, 8]) part(g, [[x - 1.4, -8.4], [x + 1.4, -8.4], [x + 1.4, 13], [x - 1.4, 13]], C.gold, 675 + x, 0.8)
    part(g, [[-13, -2.6], [13, -2.6], [13, -0.6], [-13, -0.6]], C.gold, 677, 0.8)
    part(g, [[-2.6, -1], [2.6, -1], [2.2, 4.4], [-2.2, 4.4]], C.goldL, 678, 0.9)
    blot(g, 0, 1.6, 0.8, C.ink, 1, 679, 1)
    ln(g, [[-10.6, -6.6], [-4, -7.4]], 1, WHITE, 'taper', 0.35, 680)
  },
}
export const tabIcon = (id: TabIcon): Asset => ({ x: -20, y: -20, w: 40, h: 40, draw: g => (TAB_DRAW[id](g), grain(g, 0.18)) })
