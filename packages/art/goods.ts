// Icon vật phẩm túi đồ vẽ tay: lá phù (tăng tốc, tăng ích, hộ sơn), nang tài nguyên, kinh thư. Khung 24 × 24 DU, neo ở tâm.
// Một họ một hình — mệnh giá (5 phút, 1 giờ, 5K…) do giao diện ghi đè lên góc, như túi đồ của RoK.
import { blot, ellipse, grain, stroke, vgrad, wash, type Asset, type G, type Pt } from './brush'
import { PIGMENT as C, mix, WHITE } from './palette'

export const GOOD_ICONS = [
  'thoiQuang', 'loBan', 'luyenBinh', 'ngoDao', 'dieuThu', // phù tăng tốc: mọi việc / xây / tuyển / nghiên cứu / chữa
  'tuLinh', 'thanHanh', 'chienY', 'kimCuong', 'hoThe', // phù tăng ích: sản lượng / hành quân / công / thủ / sinh lực
  'hoSon', // phù hộ sơn: khiên
  'thachNang', 'thaoNang', 'khoangNang', // nang tài nguyên
  'kinhThu', // kinh thư: kinh nghiệm trưởng lão
  'tapDich', // Tạp Dịch Lệnh: thuê tạp dịch thứ hai
  'huongHoa', // Hương Hỏa Lệnh: điểm Hương Hỏa
  'hanhLuc', // Hành Lực Đan: hồi hành lực
  'luanKiem', // Luận Kiếm Lệnh: thêm lượt Luận Kiếm Đài
  'khuechTran', // Khuếch Trận Kỳ: trận dung
  'nganDuyen', 'kimDuyen', // thiếp Chiêu Hiền Đài: bạc, vàng
] as const
export type GoodIcon = (typeof GOOD_ICONS)[number]
export const isGoodIcon = (n: string): n is GoodIcon => (GOOD_ICONS as readonly string[]).includes(n)

const grad = (g: G, y0: number, y1: number, a: string, b: string) => vgrad(g, y0, y1, [[0, a], [1, b]])
// Viền mực kín, chèn điểm để cạnh thẳng không bị uốn tròn
const ink = (g: G, pts: Pt[], w = 1.25, a = 0.9, close = true) => {
  const path = close ? [...pts, pts[0]] : pts
  const dense: Pt[] = []
  path.forEach((p, i) => {
    const q = path[i + 1]
    if (!q) return dense.push(p)
    const k = Math.max(1, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / 0.8))
    for (let j = 0; j < k; j++) dense.push([p[0] + ((q[0] - p[0]) * j) / k, p[1] + ((q[1] - p[1]) * j) / k])
  })
  stroke(g, dense, { w, color: C.ink, press: 'even', alpha: a, rough: 0.3 })
}
const line = (g: G, pts: Pt[], color: string, w = 1.1, alpha = 1) => stroke(g, pts, { w, color, press: 'even', alpha, rough: 0.2 })
const ring = (x: number, y: number, r: number, n = 18) => ellipse(x, y, r, r, n)

// Lá phù: giấy dọc hơi loe, viền son đôi, ấn tròn trên đầu, tua dưới chân; glyph vẽ ở giữa (tâm 0, 1)
function talisman(g: G, paper: string, border: string, glyph: (g: G) => void, seed: number) {
  const p: Pt[] = [[-6, -10.4], [6, -10.4], [6.8, 8.6], [-6.8, 8.6]]
  blot(g, 0, -0.5, 11, paper, 0.2, seed, 1)
  wash(g, p, { fill: g2 => grad(g2, -10, 9, mix(paper, WHITE, 0.35), mix(paper, C.ochre, 0.25)), alpha: 1, jitter: 0.2, layers: 2, sharp: true, seed })
  const inner: Pt[] = [[-4.6, -9], [4.6, -9], [5.3, 7.2], [-5.3, 7.2]]
  stroke(g, [...inner, inner[0]], { w: 0.6, color: border, press: 'even', alpha: 0.85, rough: 0.2 })
  wash(g, ring(0, -6.8, 1.5, 12), { fill: border, alpha: 1, jitter: 0.1, layers: 1, seed: seed + 1 })
  glyph(g)
  for (const x of [-2.2, 0, 2.2]) stroke(g, [[x, 8.8], [x * 1.2, 11.4]], { w: 0.8, color: C.cinnabar, press: 'fade', alpha: 0.95 })
  ink(g, p, 1.2)
}
const SPEED_PAPER = C.gamboge
const BUFF_PAPER = mix(C.silk, C.goldL, 0.35)

// Đồng hồ cát son: phù thời quang (việc nào cũng được) — thêm vòng xoáy vàng
const hourglass = (color: string, swirl?: string) => (g: G) => {
  const top: Pt[] = [[-3, -4.4], [3, -4.4], [0.4, 0.8], [-0.4, 0.8]]
  const bot: Pt[] = [[-0.4, 0.8], [0.4, 0.8], [3, 6], [-3, 6]]
  wash(g, bot, { fill: mix(color, WHITE, 0.25), alpha: 0.9, jitter: 0.1, layers: 1, sharp: true, seed: 3 })
  line(g, [[-3.4, -4.6], [3.4, -4.6]], color, 1.2)
  line(g, [[-3.4, 6.2], [3.4, 6.2]], color, 1.2)
  stroke(g, [...top, top[0]], { w: 0.9, color, press: 'even', alpha: 1 })
  stroke(g, [...bot, bot[0]], { w: 0.9, color, press: 'even', alpha: 1 })
  if (swirl) stroke(g, [[-4.4, 3], [-4.8, -1], [-2.6, -3.6]], { w: 0.8, color: swirl, press: 'taper', alpha: 1 })
}
// Búa và thước thợ: phù Lỗ Ban (xây)
const hammer = (g: G) => {
  line(g, [[-3.4, 5.6], [2.4, -1.6]], C.ochre, 1.4)
  const head: Pt[] = [[0.2, -4.6], [4.4, -1.2], [3, 0.6], [-1.2, -2.8]]
  wash(g, head, { fill: C.ink2, alpha: 1, jitter: 0.1, layers: 1, sharp: true, seed: 4 })
  ink(g, head, 0.7)
  line(g, [[-4, -3.8], [-4, 2.6], [0.6, 2.6]], C.cinnabar, 0.9)
}
// Kiếm dựng: phù luyện binh (tuyển đệ tử)
const sword = (g: G) => {
  const blade: Pt[] = [[0, -5.4], [1, -4], [0.8, 3], [-0.8, 3], [-1, -4]]
  wash(g, blade, { fill: g2 => grad(g2, -5, 3, C.azuriteL, C.azurite), alpha: 1, jitter: 0.05, layers: 1, sharp: true, seed: 5 })
  ink(g, blade, 0.6)
  line(g, [[-2.8, 3.2], [2.8, 3.2]], C.gold, 1.3)
  line(g, [[0, 3.4], [0, 6.2]], C.cinnabar, 1.1)
}
// Quyển kinh mở, hai trang có dòng chữ: phù ngộ đạo (nghiên cứu)
const openBook = (g: G) => {
  for (const s of [-1, 1]) {
    const page: Pt[] = [[0, -2.8], [s * 4.6, -4], [s * 4.8, 4], [0, 5]]
    wash(g, page, { fill: WHITE, alpha: 0.95, jitter: 0.1, layers: 1, sharp: true, seed: 6 + s })
    ink(g, page, 0.6, 0.85)
    for (let k = 0; k < 3; k++) line(g, [[s * 1.2, -1.2 + k * 1.9], [s * 3.6, -1.8 + k * 1.9]], C.indigo, 0.5, 0.8)
  }
  wash(g, ring(0, -5.6, 1, 10), { fill: C.gold, alpha: 1, jitter: 0.05, layers: 1, seed: 8 })
}
// Hồ lô thuốc buộc dây son: phù diệu thủ (chữa thương)
const gourd = (g: G) => {
  const body: Pt[] = [...ring(0, 2.6, 3.4, 16).slice(4, 16), ...ring(0, 2.6, 3.4, 16).slice(0, 4)]
  wash(g, ring(0, 2.6, 3.4, 16), { fill: g2 => grad(g2, -1, 6, C.malachiteL, C.malachite), alpha: 1, jitter: 0.1, layers: 2, seed: 9 })
  wash(g, ring(0, -2.4, 2.1, 14), { fill: g2 => grad(g2, -4.5, 0, C.malachiteL, C.malachite), alpha: 1, jitter: 0.1, layers: 2, seed: 10 })
  stroke(g, [...body, body[0]], { w: 0.7, color: C.ink, press: 'even', alpha: 0.85 })
  stroke(g, [...ring(0, -2.4, 2.1, 14), ring(0, -2.4, 2.1, 14)[0]], { w: 0.7, color: C.ink, press: 'even', alpha: 0.85 })
  line(g, [[-1.8, -0.4], [1.8, -0.4]], C.cinnabar, 0.9)
  line(g, [[0, -4.5], [0, -5.8]], C.ochre, 1)
}
// Linh khí xoáy lên với ba hạt tài nguyên: phù tụ linh (sản lượng)
const spiritRise = (g: G) => {
  stroke(g, [[-2.6, 6], [-3.4, 2], [-1, -1], [-2.2, -4.8]], { w: 1, color: C.spirit, press: 'rise', alpha: 1 })
  stroke(g, [[1.4, 6], [2.8, 2.4], [0.8, -0.6], [2.4, -4.2]], { w: 1, color: C.azurite, press: 'rise', alpha: 1 })
  blot(g, -2.4, -5.4, 1, C.spirit, 1, 11, 1)
  blot(g, 2.6, -4.8, 1, C.malachite, 1, 12, 1)
  blot(g, 0.2, 1.8, 1, C.gamboge, 1, 13, 1)
}
// Mây bay và vệt gió: phù thần hành (hành quân)
const cloudRun = (g: G) => {
  wash(g, [...ring(-1.2, 1, 2.4, 12), ...ring(1.8, 0.4, 2.8, 12)], { fill: C.azuriteL, alpha: 0.9, jitter: 0.2, layers: 2, seed: 14 })
  stroke(g, [[-4.4, 1.6], [-2.6, -1.2], [0.4, -1.6], [2.4, -2.8], [4.4, -0.4]], { w: 0.8, color: C.azurite, press: 'taper', alpha: 1 })
  for (const y of [3.6, 5.2]) line(g, [[-4.6, y], [1.4 - (y - 3.6) * 1.5, y]], C.ink2, 0.6, 0.8)
}
// Lưỡi kiếm lửa: phù chiến ý (công)
const flameBlade = (g: G) => {
  stroke(g, [[-1.6, 6], [-3.2, 1.6], [-0.6, -1.6], [-1.4, -5.2], [1.6, -2.2], [2.6, 1.4], [1, 6]], { w: 1.1, color: C.cinnabarL, press: 'swell', alpha: 1 })
  wash(g, [[-1, 5.4], [-2, 1.8], [0, -0.6], [1.6, 2], [0.6, 5.4]], { fill: C.gamboge, alpha: 1, jitter: 0.15, layers: 1, seed: 15 })
  line(g, [[0, -3.6], [0, 5.6]], C.ink, 0.6, 0.7)
}
// Khiên kim cương hình thoi: phù kim cương (thủ)
const diamondShield = (g: G) => {
  const sh: Pt[] = [[0, -5], [4, -3], [3.2, 2.6], [0, 5.8], [-3.2, 2.6], [-4, -3]]
  wash(g, sh, { fill: g2 => grad(g2, -5, 6, C.goldL, C.goldD), alpha: 1, jitter: 0.1, layers: 2, sharp: true, seed: 16 })
  ink(g, sh, 0.8)
  const gem: Pt[] = [[0, -2.4], [1.8, 0], [0, 2.8], [-1.8, 0]]
  wash(g, gem, { fill: WHITE, alpha: 0.9, jitter: 0.05, layers: 1, sharp: true, seed: 17 })
  ink(g, gem, 0.5, 0.8)
}
// Mai rùa xanh: phù hộ thể (sinh lực)
const shell = (g: G) => {
  wash(g, ellipse(0, 1, 4.4, 4, 18), { fill: g2 => grad(g2, -3, 5, C.malachiteL, C.malachiteD), alpha: 1, jitter: 0.1, layers: 2, seed: 18 })
  stroke(g, [...ellipse(0, 1, 4.4, 4, 18), ellipse(0, 1, 4.4, 4, 18)[0]], { w: 0.7, color: C.ink, press: 'even', alpha: 0.85 })
  const hex: Pt[] = [[0, -1.2], [1.6, -0.2], [1.6, 1.8], [0, 2.8], [-1.6, 1.8], [-1.6, -0.2]]
  stroke(g, [...hex, hex[0]], { w: 0.55, color: C.ink, press: 'even', alpha: 0.75 })
  blot(g, 0, -4.2, 1.1, C.malachite, 1, 19, 1)
}
// Núi trong vòng kết giới vàng: phù hộ sơn (khiên)
const mountainWard = (g: G) => {
  stroke(g, [...ring(0, 0.6, 4.8, 22), ring(0, 0.6, 4.8, 22)[0]], { w: 0.9, color: C.gold, press: 'even', alpha: 1 })
  const hill: Pt[] = [[-3.6, 3.6], [-1.2, -2.4], [0.6, 0.2], [1.8, -1.2], [3.8, 3.6]]
  wash(g, hill, { fill: g2 => grad(g2, -2.4, 3.6, C.malachite, C.azuriteD), alpha: 1, jitter: 0.1, layers: 2, seed: 20 })
  ink(g, hill, 0.6, 0.85)
}

// Nang vải thắt dây: màu tài nguyên, hạt tài nguyên nhô ở miệng
function pouch(g: G, cloth: string, deep: string, gem: (g: G) => void, seed: number) {
  const bag: Pt[] = [[-3.4, -4.4], [3.4, -4.4], [6.4, 1.2], [7.4, 6.6], [4.6, 9.8], [-4.6, 9.8], [-7.4, 6.6], [-6.4, 1.2]]
  blot(g, 0, 3, 10.5, cloth, 0.18, seed, 1)
  gem(g)
  wash(g, bag, { fill: g2 => grad(g2, -4, 10, mix(cloth, WHITE, 0.3), deep), alpha: 1, jitter: 0.25, layers: 2, seed })
  wash(g, [[-6.4, 1.2], [-3.4, -1], [-1.6, 9.6], [-4.6, 9.8], [-7.4, 6.6]], { fill: deep, alpha: 0.35, jitter: 0.2, layers: 1, seed: seed + 1 })
  line(g, [[-4.6, -3], [-1.4, -2.2], [2, -2.6], [4.6, -3.2]], C.cinnabar, 1.3)
  stroke(g, [[3.8, -3], [6.4, -5.2], [7.6, -3.6]], { w: 0.9, color: C.cinnabar, press: 'fade', alpha: 1 })
  ink(g, bag, 1.25)
  blot(g, -3, 3.6, 1.3, WHITE, 0.55, seed + 2, 0.6, -0.6)
}
const crystal = (color: string, deep: string) => (g: G) => {
  const p: Pt[] = [[0, -10.4], [2.6, -6.4], [1.6, -3.2], [-1.6, -3.2], [-2.6, -6.4]]
  wash(g, p, { fill: g2 => grad(g2, -10, -3, mix(color, WHITE, 0.4), deep), alpha: 1, jitter: 0.05, layers: 1, sharp: true, seed: 30 })
  ink(g, p, 0.7)
}
const sprout = (g: G) => {
  stroke(g, [[0, -3], [0.4, -6.4], [-0.2, -9]], { w: 1, color: C.malachiteD, press: 'rise', alpha: 1 })
  wash(g, [[0.2, -6.6], [-3.6, -8.6], [-4.4, -10.8], [-1, -9.6]], { fill: C.malachite, alpha: 1, jitter: 0.1, layers: 1, seed: 31 })
  wash(g, [[0.2, -7.4], [3.4, -9.6], [4.6, -11.2], [1.2, -10.6]], { fill: C.malachiteL, alpha: 1, jitter: 0.1, layers: 1, seed: 32 })
}

// Sách chỉ khâu bìa chàm, nhãn giấy dán dọc, ánh ngọc
function book(g: G) {
  const cover: Pt[] = [[-7, -9.4], [6.4, -9.4], [6.4, 9.6], [-7, 9.6]]
  blot(g, 0, 0, 11, C.spirit, 0.18, 40, 1)
  wash(g, [[-6.2, -8.6], [7.2, -8.6], [7.2, 10.2], [-6.2, 10.2]], { fill: C.paper2, alpha: 1, jitter: 0.1, layers: 1, sharp: true, seed: 41 })
  wash(g, cover, { fill: g2 => grad(g2, -9, 10, mix(C.indigo, C.azurite, 0.4), C.indigo), alpha: 1, jitter: 0.15, layers: 2, sharp: true, seed: 42 })
  const label: Pt[] = [[-0.6, -7.6], [3.8, -7.6], [3.8, 3.4], [-0.6, 3.4]]
  wash(g, label, { fill: C.silk, alpha: 1, jitter: 0.05, layers: 1, sharp: true, seed: 43 })
  ink(g, label, 0.6, 0.8)
  for (let k = 0; k < 4; k++) line(g, [[0.6, -6 + k * 2.4], [2.6, -5.8 + k * 2.4]], C.ink, 0.7, 0.85)
  for (const y of [-6.8, -2.2, 2.4, 7]) {
    line(g, [[-7, y], [-4.6, y]], C.silk, 0.6, 0.9)
    blot(g, -5.6, y, 0.45, C.silk, 1, 44, 1)
  }
  ink(g, cover, 1.25)
  blot(g, 4.6, 7, 1.6, C.cinnabar, 1, 45, 1)
}

// Thiếp mời gấp đôi (bạc / vàng): nền kim loại, dải son buộc chéo, nút đồng tâm kết duyên ở giữa
function invite(g: G, light: string, deep: string, seed: number) {
  const card: Pt[] = [[-8.4, -7.4], [8.4, -7.4], [8.4, 7.8], [-8.4, 7.8]]
  blot(g, 0, 0, 11, light, 0.22, seed, 1)
  wash(g, card, { fill: g2 => grad(g2, -7, 8, mix(light, WHITE, 0.45), deep), alpha: 1, jitter: 0.15, layers: 2, sharp: true, seed })
  stroke(g, [[0, -7.4], [0, 7.8]], { w: 0.6, color: deep, press: 'even', alpha: 0.6 })
  line(g, [[-8.4, -3], [8.4, 3.6]], C.cinnabar, 1.4)
  line(g, [[-8.4, 3.6], [8.4, -3]], C.cinnabar, 1.4)
  wash(g, ring(0, 0.3, 3, 16), { fill: C.cinnabarL, alpha: 1, jitter: 0.1, layers: 2, seed: seed + 1 })
  stroke(g, [...ring(0, 0.3, 3, 16), ring(0, 0.3, 3, 16)[0]], { w: 0.7, color: C.ink, press: 'even', alpha: 0.85 })
  stroke(g, [...ring(0, 0.3, 1.4, 12), ring(0, 0.3, 1.4, 12)[0]], { w: 0.6, color: C.goldL, press: 'even', alpha: 1 })
  ink(g, card, 1.2)
  blot(g, -5.6, -4.8, 1.2, WHITE, 0.7, seed + 2, 0.6, -0.5)
}

const DRAW: Record<GoodIcon, (g: G) => void> = {
  thoiQuang: g => talisman(g, SPEED_PAPER, C.cinnabar, hourglass(C.cinnabar, C.gold), 100),
  loBan: g => talisman(g, SPEED_PAPER, C.cinnabar, hammer, 110),
  luyenBinh: g => talisman(g, SPEED_PAPER, C.cinnabar, sword, 120),
  ngoDao: g => talisman(g, SPEED_PAPER, C.cinnabar, openBook, 130),
  dieuThu: g => talisman(g, SPEED_PAPER, C.cinnabar, gourd, 140),
  tuLinh: g => talisman(g, BUFF_PAPER, C.azurite, spiritRise, 150),
  thanHanh: g => talisman(g, BUFF_PAPER, C.azurite, cloudRun, 160),
  chienY: g => talisman(g, BUFF_PAPER, C.cinnabar, flameBlade, 170),
  kimCuong: g => talisman(g, BUFF_PAPER, C.goldD, diamondShield, 180),
  hoThe: g => talisman(g, BUFF_PAPER, C.malachiteD, shell, 190),
  hoSon: g => talisman(g, mix(C.azuriteL, C.silk, 0.45), C.azuriteD, mountainWard, 200),
  thachNang: g => pouch(g, C.azuriteL, C.azuriteD, crystal(C.spirit, C.azuriteD), 210),
  thaoNang: g => pouch(g, C.malachiteL, C.malachiteD, sprout, 220),
  khoangNang: g => pouch(g, '#a597d8', '#4e3f93', crystal('#c9bbf6', '#6a58b8'), 230),
  kinhThu: book,
  nganDuyen: g => invite(g, '#dfe6ec', '#7d8a96', 240),
  kimDuyen: g => invite(g, C.goldL, C.goldD, 250),
  tapDich: g => talisman(g, mix(C.goldL, C.silk, 0.5), C.goldD, hammer, 260),
  huongHoa: g => talisman(g, mix(C.goldL, C.silk, 0.35), C.cinnabar, spiritRise, 270),
  hanhLuc: g => talisman(g, mix(C.malachiteL, C.silk, 0.4), C.malachiteD, gourd, 280),
  luanKiem: g => talisman(g, mix(C.azuriteL, C.silk, 0.5), C.azuriteD, sword, 290),
  khuechTran: g => talisman(g, BUFF_PAPER, C.cinnabar, mountainWard, 300),
}

export function goodIcon(name: GoodIcon): Asset {
  return {
    x: -12, y: -12, w: 24, h: 24,
    draw(g) {
      DRAW[name](g)
      grain(g, 0.25)
    },
  }
}
