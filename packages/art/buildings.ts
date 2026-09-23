// Công trình vẽ theo lối 界画: nét mực mảnh, đều tay; tô màu khoáng; mái cong đầu đao vểnh.
// Tầng 1–5 mái ngói xám, 6–10 lưu ly xanh hai lớp, 11–15 lưu ly vàng.
// Phần động (khói, lửa, cờ, cột linh khí, đệ tử, đèn đêm) không vẽ vào texture mà trả về danh sách `fx`
// để cảnh WebGL diễn trên GPU.
import { blot, grain, stroke, wash, type Asset, type G, type Pt } from './brush'
import { ellipse, moss, tuft, vgrad } from './landscape'
import { rng } from './noise'
import { PIGMENT as C, mix, rgba } from './palette'

export type Kind = 'chuDien' | 'tuLinhTran' | 'linhDien' | 'khoangMach' | 'tangBaoCac' | 'dienVoTruong' | 'tangKinhCac' | 'danPhong'

// Hiệu ứng động gắn vào công trình, toạ độ DU tính từ chân công trình
export type Fx =
  | { k: 'light'; x: number; y: number; r: number } // đèn/cửa sổ sáng ban đêm
  | { k: 'smoke' | 'fire' | 'orb' | 'herb' | 'flag' | 'disciple' | 'spark'; x: number; y: number; s: number }
  | { k: 'beam'; x: number; y: number; h: number }
  | { k: 'rune'; x: number; y: number; rx: number; ry: number }

export type Building = { art: Asset<Fx[]>; top: number; w: number }

export const tierOf = (level: number) => (level <= 5 ? 1 : level <= 10 ? 2 : 3)

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
// điểm trên đường bậc hai
const quad = (a: Pt, c: Pt, b: Pt, n: number): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, u = 1 - t
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]
  })
const rect = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]

const STONE = mix(C.paper2, C.ink3, 0.28)
const STONE_L = mix(C.paper, C.paper2, 0.5)
const INKLINE = { color: C.ink, press: 'even' as const, alpha: 0.82, rough: 0.2 }

function kit(g: G, tier: number, seed: number, fx: Fx[]) {
  const rn = rng(seed)
  const roofColor = [mix(C.indigo, C.ink3, 0.35), C.malachite, C.gamboge][tier - 1]
  const roofDark = [C.indigo, C.malachiteD, C.goldD][tier - 1]
  const line = (pts: Pt[], w = 0.7, a = 0.82) => stroke(g, pts, { ...INKLINE, w, alpha: a, seed: Math.floor(rn() * 9999) })

  return {
    rn,
    line,
    // 台基: nền đá, có bậc
    base(cx: number, y: number, w: number, h: number, stairs: boolean) {
      const p: Pt[] = [[cx - w / 2, y], [cx + w / 2, y], [cx + w / 2 - 3, y - h], [cx - w / 2 + 3, y - h]]
      wash(g, p, { fill: STONE, alpha: 0.95, jitter: 0.5, layers: 2, edge: 1, sharp: true, seed: seed + 1 })
      wash(g, rect(cx - w / 2 + 3, y - h, w - 6, h * 0.3), { sharp: true, fill: STONE_L, alpha: 0.6, jitter: 0.3, layers: 1, seed: seed + 2 })
      line([[cx - w / 2 + 3, y - h], [cx + w / 2 - 3, y - h]], 0.9)
      line([[cx - w / 2, y], [cx + w / 2, y]], 1.1)
      line([[cx - w / 2, y], [cx - w / 2 + 3, y - h]], 0.7)
      line([[cx + w / 2, y], [cx + w / 2 - 3, y - h]], 0.7)
      if (h > 5) line([[cx - w / 2 + 1.5, y - h / 2], [cx + w / 2 - 1.5, y - h / 2]], 0.4, 0.4)
      if (stairs) {
        wash(g, [[cx - 10, y], [cx + 10, y], [cx + 8, y - h], [cx - 8, y - h]], { sharp: true, fill: STONE_L, alpha: 0.95, jitter: 0.3, layers: 1, seed: seed + 3 })
        for (const k of [0.33, 0.66]) line([[cx - 10 + k * 2, y - h * k], [cx + 10 - k * 2, y - h * k]], 0.45, 0.6)
        line([[cx - 10, y], [cx - 8, y - h]], 0.55, 0.7)
        line([[cx + 10, y], [cx + 8, y - h]], 0.55, 0.7)
      }
    },
    // Thân nhà: vách trắng, cột son, cửa bức bàn, dầm trên có màu
    hall(cx: number, y: number, w: number, h: number, door: boolean) {
      const x0 = cx - w / 2
      wash(g, rect(x0, y - h, w, h), { sharp: true, fill: C.silk, alpha: 0.97, jitter: 0.35, layers: 2, seed: seed + 4 })
      const cols = w < 40 ? [x0 + 2, x0 + w - 2] : [x0 + 2, cx - w / 6, cx + w / 6, x0 + w - 2]
      // ô cửa lưới giữa các cột
      for (let i = 0; i < cols.length - 1; i++) {
        const a = cols[i] + 2, b = cols[i + 1] - 2
        if (b - a < 4 || (door && Math.abs((a + b) / 2 - cx) < 6)) continue
        const top = y - h * 0.82, bot = y - h * 0.3
        wash(g, rect(a, bot, b - a, h * 0.3 - 1), { sharp: true, fill: C.ochreL, alpha: 0.5, jitter: 0.3, layers: 1, seed: seed + 5 + i })
        const n = Math.max(2, Math.round((b - a) / 3))
        for (let k = 1; k < n; k++) line([[lerp(a, b, k / n), top], [lerp(a, b, k / n), bot]], 0.3, 0.55)
        for (let k = 1; k < 4; k++) line([[a, lerp(top, bot, k / 4)], [b, lerp(top, bot, k / 4)]], 0.3, 0.5)
        line([[a, top], [b, top], [b, bot], [a, bot], [a, top]], 0.4, 0.6)
        fx.push({ k: 'light', x: (a + b) / 2, y: (top + bot) / 2, r: (b - a) * 0.7 })
      }
      if (door) {
        const dh = Math.min(h * 0.78, 13)
        wash(g, rect(cx - 5.5, y - dh, 11, dh), { sharp: true, fill: C.lacquer2, alpha: 0.95, jitter: 0.25, layers: 1, seed: seed + 9 })
        line([[cx, y - dh], [cx, y]], 0.4, 0.6)
        for (const dx of [-2, 2]) blot(g, cx + dx, y - dh / 2, 0.55, C.gold, 1, seed + dx)
        fx.push({ k: 'light', x: cx, y: y - dh / 2, r: 9 })
      }
      for (const x of cols) {
        wash(g, rect(x - 1.3, y - h, 2.6, h), { sharp: true, fill: C.cinnabar, alpha: 0.95, jitter: 0.2, layers: 1, seed: seed + Math.round(x) })
        line([[x - 1.3, y - h], [x - 1.3, y]], 0.35, 0.7)
      }
      // dầm (额枋): lam/lục theo bậc, bậc cao có điểm vàng
      const band = rect(x0 - 1, y - h, w + 2, 2.6)
      wash(g, band, { fill: tier === 1 ? C.azuriteD : tier === 2 ? C.malachiteD : C.azurite, alpha: 0.95, jitter: 0.2, layers: 1, seed: seed + 11 })
      if (tier > 1) for (let x = x0 + 3; x < x0 + w - 2; x += 5) blot(g, x, y - h + 1.3, 0.5, C.goldL, 0.95, Math.round(x))
      line([[x0, y - h], [x0, y]], 0.6)
      line([[x0 + w, y - h], [x0 + w, y]], 0.6)
      line([[x0 - 1, y - h + 2.6], [x0 + w + 1, y - h + 2.6]], 0.4, 0.6)
      // bóng mái hắt xuống vách
      wash(g, rect(x0, y - h + 2.6, w, 3), { sharp: true, fill: C.ink, alpha: 0.16, jitter: 0.4, layers: 1, seed: seed + 12 })
    },
    // Mái cong: mép dưới võng, hai đầu đao vểnh; ngói là các nét toả từ nóc xuống
    roof(cx: number, y: number, w: number, h: number, color: string = roofColor, dark: string = roofDark) {
      const a = w / 2, e = h * 0.38
      const eave = [
        ...quad([cx - a, y - e], [cx - a * 0.78, y - h * 0.02], [cx - a * 0.58, y], 6),
        ...quad([cx - a * 0.58, y], [cx, y + 1.2], [cx + a * 0.58, y], 6).slice(1),
        ...quad([cx + a * 0.58, y], [cx + a * 0.78, y - h * 0.02], [cx + a, y - e], 6).slice(1),
      ]
      const rightHip = quad([cx + a, y - e], [cx + a * 0.58, y - h * 0.46], [cx + a * 0.3, y - h], 6)
      const leftHip = quad([cx - a * 0.3, y - h], [cx - a * 0.58, y - h * 0.46], [cx - a, y - e], 6)
      const shape = [...eave, ...rightHip.slice(1), ...leftHip.slice(1, -1)]
      wash(g, shape, { fill: g2 => vgrad(g2, y - h, y, [[0, mix(color, '#ffffff', 0.15)], [1, color]]), alpha: 0.97, jitter: 0.35, layers: 2, seed: seed + 20 })
      // dải tối sát mép hiên
      wash(g, [...eave, ...eave.slice().reverse().map(([x, yy]) => [x, yy - h * 0.2] as Pt)], { fill: dark, alpha: 0.5, jitter: 0.3, layers: 1, seed: seed + 21 })
      // hàng ngói
      const n = Math.max(4, Math.round(w / 5))
      for (let k = 1; k < n; k++) {
        const t = k / n
        const top: Pt = [lerp(cx - a * 0.3, cx + a * 0.3, t), y - h + 1]
        const bx = lerp(cx - a * 0.66, cx + a * 0.66, t)
        const by = y + 0.6 - Math.abs(t - 0.5) * 1.2 - (Math.abs(t - 0.5) > 0.4 ? (Math.abs(t - 0.5) - 0.4) * h * 1.5 : 0)
        stroke(g, [top, [lerp(top[0], bx, 0.55), lerp(top[1], by, 0.55)], [bx, by]], { w: 0.45, color: C.ink, press: 'even', alpha: 0.38, rough: 0.15, seed: seed + 30 + k })
      }
      if (tier === 3) for (let k = 0; k < 4; k++) stroke(g, [[cx - a * 0.25 + k * a * 0.16, y - h * 0.85], [cx - a * 0.3 + k * a * 0.2, y - h * 0.25]], { w: 0.9, color: C.goldL, press: 'taper', alpha: 0.7, seed: seed + 40 + k })
      // viền: mép hiên đậm, gờ mái mảnh
      stroke(g, eave, { w: 1.5, color: C.ink, press: 'even', alpha: 0.9, rough: 0.2, seed: seed + 22 })
      line(rightHip, 0.8)
      line(leftHip, 0.8)
      // nóc + 鸱吻 hai đầu
      const rh = 2.4
      wash(g, rect(cx - a * 0.32, y - h - rh + 0.6, a * 0.64, rh), { sharp: true, fill: dark, alpha: 0.95, jitter: 0.2, layers: 1, seed: seed + 23 })
      line([[cx - a * 0.32, y - h - rh + 0.6], [cx + a * 0.32, y - h - rh + 0.6]], 0.8, 0.9)
      for (const s of [-1, 1]) {
        const x = cx + s * a * 0.32
        stroke(g, [[x, y - h + 0.2], [x + s * 1.6, y - h - 2.6], [x + s * 0.6, y - h - 4.6], [x - s * 0.8, y - h - 3.6]], { w: 1.3, color: C.ink, press: 'nail', alpha: 0.9, seed: seed + 24 + s })
        // đầu đao vểnh
        stroke(g, [[cx + s * a * 0.93, y - e * 0.9], [cx + s * (a + 1.5), y - e - 1.6], [cx + s * (a + 2.2), y - e - 3.4]], { w: 1.1, color: C.ink, press: 'nail', alpha: 0.9, seed: seed + 26 + s })
      }
    },
    // Biển hiệu: gỗ lam, viền vàng, giữa là hoa văn vàng vẽ tay theo loại công trình
    plaque(cx: number, y: number, s: number, kind: Kind) {
      const w = 14 * s, h = 10 * s
      wash(g, rect(cx - w / 2, y - h / 2, w, h), { sharp: true, fill: C.azuriteD, alpha: 1, jitter: 0.2, layers: 1, seed: seed + 50 })
      line([[cx - w / 2, y - h / 2], [cx + w / 2, y - h / 2], [cx + w / 2, y + h / 2], [cx - w / 2, y + h / 2], [cx - w / 2, y - h / 2]], 0.5, 0.9)
      g.save()
      g.strokeStyle = rgba(C.gold, 0.95)
      g.lineWidth = 0.7 * s
      g.strokeRect(cx - w / 2 + 1 * s, y - h / 2 + 1 * s, w - 2 * s, h - 2 * s)
      g.restore()
      motif(g, kind, cx, y, s, seed + 51)
    },
    lantern(x: number, y: number) {
      line([[x, y - 1.5], [x, y + 0.5]], 0.4)
      wash(g, ellipse(x, y + 3.2, 2.3, 2.9, 10), { fill: C.cinnabar, alpha: 1, jitter: 0.15, layers: 1, seed: seed + Math.round(x) })
      blot(g, x - 0.6, y + 2.4, 0.7, C.cinnabarL, 0.9, Math.round(x))
      line([[x - 2.1, y + 3.2], [x + 2.1, y + 3.2]], 0.35, 0.7)
      stroke(g, ellipse(x, y + 3.2, 2.3, 2.9, 10).concat([[x + 2.3, y + 3.2]]), { w: 0.4, color: C.ink, press: 'even', alpha: 0.6 })
      fx.push({ k: 'light', x, y: y + 3, r: 8 })
    },
    // Cột đá có quả cầu linh khí (Tụ Linh Trận)
    orbPillar(x: number, y: number) {
      wash(g, rect(x - 2.6, y - 13, 5.2, 13), { sharp: true, fill: STONE, alpha: 1, jitter: 0.2, layers: 1, seed: seed + Math.round(x) })
      wash(g, rect(x - 3.4, y - 14.6, 6.8, 2.2), { sharp: true, fill: STONE_L, alpha: 1, jitter: 0.2, layers: 1, seed: seed + Math.round(x) + 1 })
      line([[x - 2.6, y - 13], [x - 2.6, y]], 0.5)
      line([[x + 2.6, y - 13], [x + 2.6, y]], 0.4, 0.5)
      line([[x - 3.4, y - 14.6], [x + 3.4, y - 14.6]], 0.5)
      fx.push({ k: 'orb', x, y: y - 18.5, s: 1 })
    },
  }
}

// Hoa văn vàng trên biển hiệu (thay chữ): mây cuộn, vòng trận, bông lúa, tinh thể, đồng tiền, kiếm chéo, sách, bầu đan
function motif(g: G, kind: Kind, cx: number, cy: number, s: number, seed: number) {
  const P = (x: number, y: number): Pt => [cx + x * s, cy + y * s]
  const gold = { w: 0.75 * s, color: C.goldL, alpha: 0.95, rough: 0.2, seed }
  const st = (pts: Pt[], press: 'taper' | 'even' | 'nail' = 'taper', w = 1) => stroke(g, pts, { ...gold, w: gold.w * w, press })
  if (kind === 'chuDien') {
    for (const d of [-1, 1]) {
      const pts: Pt[] = []
      for (let i = 0; i <= 12; i++) {
        const t = i / 12, a = t * Math.PI * 2 * 1.2, r = 1.8 * (1 - t * 0.7)
        pts.push(P(d * 1.8 + Math.cos(a) * r * d, Math.sin(a) * r))
      }
      st(pts, 'taper')
    }
    st([P(-3.6, 1.6), P(0, 2.4), P(3.6, 1.6)], 'taper')
  } else if (kind === 'tuLinhTran') {
    st(Array.from({ length: 14 }, (_, i) => P(Math.cos((i / 13) * Math.PI * 2) * 2.6, Math.sin((i / 13) * Math.PI * 2) * 2.6)), 'even')
    blot(g, cx, cy, 0.8 * s, C.goldL, 1, seed + 1, 1)
    for (let i = 0; i < 4; i++) blot(g, cx + Math.cos(i * Math.PI / 2) * 3.8 * s, cy + Math.sin(i * Math.PI / 2) * 3.8 * s, 0.35 * s, C.goldL, 1, seed + 2 + i, 1)
  } else if (kind === 'linhDien') {
    st([P(0, 3.4), P(0.2, 0), P(0, -3.4)], 'even')
    for (const y of [-2, -0.4, 1.2]) for (const d of [-1, 1]) st([P(0, y + 0.6), P(d * 1.8, y - 0.6)], 'taper', 0.8)
  } else if (kind === 'khoangMach') {
    st([P(0, -3.4), P(2.4, -0.8), P(0, 3.4), P(-2.4, -0.8), P(0, -3.4)], 'even')
    st([P(-2.4, -0.8), P(2.4, -0.8)], 'even', 0.7)
    st([P(0, -3.4), P(0, 3.4)], 'even', 0.6)
  } else if (kind === 'tangBaoCac') {
    st(Array.from({ length: 14 }, (_, i) => P(Math.cos((i / 13) * Math.PI * 2) * 3, Math.sin((i / 13) * Math.PI * 2) * 3)), 'even')
    st([P(-1, -1), P(1, -1), P(1, 1), P(-1, 1), P(-1, -1)], 'even', 0.8)
  } else if (kind === 'dienVoTruong') {
    st([P(-3, -3), P(3, 3)], 'nail', 1.1)
    st([P(3, -3), P(-3, 3)], 'nail', 1.1)
    st([P(1.4, 3.2), P(3.2, 1.4)], 'even', 0.8)
    st([P(-1.4, 3.2), P(-3.2, 1.4)], 'even', 0.8)
  } else if (kind === 'tangKinhCac') {
    st([P(-3, -2.4), P(3, -2.4), P(3, 2.6), P(-3, 2.6), P(-3, -2.4)], 'even')
    st([P(0, -2.4), P(0, 2.6)], 'even', 0.7)
    for (const y of [-1, 0.4, 1.6]) st([P(-2.2, y), P(-0.8, y)], 'even', 0.5)
  } else {
    // bầu đan: hai bầu chồng
    st(Array.from({ length: 12 }, (_, i) => P(Math.cos((i / 11) * Math.PI * 2) * 1.3, -1.8 + Math.sin((i / 11) * Math.PI * 2) * 1.3)), 'even')
    st(Array.from({ length: 14 }, (_, i) => P(Math.cos((i / 13) * Math.PI * 2) * 2.3, 1.4 + Math.sin((i / 13) * Math.PI * 2) * 2)), 'even')
    st([P(0, -3.2), P(0, -4)], 'even', 0.8)
  }
}

export function building(id: Kind, level: number): Building {
  const tier = tierOf(Math.max(1, level))
  const seed = id.length * 97 + tier * 13
  // Khung vẽ và đỉnh (để đặt đồng hồ/biển tên) theo từng loại
  const dims: Record<Kind, [number, number]> = {
    chuDien: [tier === 3 ? 180 : 116, tier === 1 ? 66 : 86],
    tangKinhCac: [70, 50 + tier * 20],
    danPhong: [110, 52],
    tangBaoCac: [80, 70],
    dienVoTruong: [124, 66],
    tuLinhTran: [104, 30],
    khoangMach: [120, 72],
    linhDien: [128, 46],
  }
  const [w, top] = dims[id]
  const art: Asset<Fx[]> = {
    x: -w / 2 - 8, y: -top - 16, w: w + 16, h: top + 26,
    draw(g) {
      const fx: Fx[] = []
      const k = kit(g, tier, seed, fx)
      const { line, rn } = k
      // bóng đổ mềm dưới chân
      wash(g, ellipse(0, 1.5, w * 0.5, 4.5, 14), { fill: C.ink, alpha: 0.12, jitter: 1, layers: 2, seed })
      if (id === 'chuDien') {
        if (tier === 3)
          for (const x of [-62, 62]) {
            k.base(x, 0, 40, 6, false)
            k.hall(x, -6, 30, 16, false)
            k.roof(x, -22, 42, 13)
          }
        k.base(0, 0, 112, 8, true)
        k.hall(0, -8, 78, 26, true)
        k.plaque(0, -29, 1, id)
        if (tier >= 2) {
          k.roof(0, -34, 106, 24)
          k.hall(0, -52, 52, 11, false)
          k.roof(0, -63, 78, 19)
        } else k.roof(0, -34, 106, 26)
        k.lantern(-42, -31)
        k.lantern(42, -31)
      } else if (id === 'tangKinhCac') {
        const floors = tier + 2
        k.base(0, 0, 62, 6, true)
        let y = -6
        for (let i = 0; i < floors; i++) {
          const fw = 40 - i * 6
          k.hall(0, y, fw, 13, i === 0)
          if (i === 1) k.plaque(0, y - 6.5, 0.7, id)
          k.roof(0, y - 13, fw + 18, 11)
          y -= 20
        }
        const t = y + 20 - 24
        line([[0, t + 2], [0, t - 9]], 1.2)
        for (const [dy, r] of [[-2, 2.3], [-5.8, 1.7], [-9, 1.1]] as const) blot(g, 0, t + dy, r, C.gold, 1, Math.round(dy * 10))
      } else if (id === 'danPhong') {
        k.base(-10, 0, 76, 6, true)
        k.hall(-10, -6, 52, 20, true)
        k.plaque(-10, -23.2, 0.7, id)
        k.roof(-10, -26, 70, 18)
        // đỉnh đồng (丹鼎): miệng rộng, bụng phình, ba chân, hai quai
        const x = 38
        const bronze = mix(C.ochre, C.goldD, 0.45), bronzeD = mix(C.ochre, C.ink, 0.5)
        for (const dx of [-8, 8, 0]) stroke(g, [[x + dx * 0.9, -5], [x + dx * 1.15, 0.5]], { w: 2.2, color: bronzeD, press: 'nail', alpha: 1 })
        const pot: Pt[] = [[x - 12, -17], [x + 12, -17], [x + 12.5, -11], ...quad([x + 11, -7], [x, -1], [x - 11, -7], 8), [x - 12.5, -11]]
        wash(g, pot, { fill: g2 => vgrad(g2, -17, -3, [[0, mix(bronze, C.goldL, 0.3)], [1, bronzeD]]), alpha: 1, jitter: 0.3, layers: 2, seed: seed + 60 })
        stroke(g, [...pot, pot[0]], { w: 0.8, color: C.ink, press: 'even', alpha: 0.85 })
        wash(g, rect(x - 13.5, -19.4, 27, 3), { sharp: true, fill: bronzeD, alpha: 1, jitter: 0.2, layers: 1, seed: seed + 61 })
        line([[x - 13.5, -19.4], [x + 13.5, -19.4]], 0.6)
        for (const dx of [-9, 9]) stroke(g, [[x + dx, -19], [x + dx * 1.05, -23.5], [x + dx * 0.8, -23.5]], { w: 1.6, color: bronzeD, press: 'even' })
        // hoa văn 饕餮 cách điệu: vài nét vàng
        stroke(g, [[x - 6, -12], [x - 2, -13.5], [x, -11.5], [x + 2, -13.5], [x + 6, -12]], { w: 0.7, color: C.goldL, press: 'even', alpha: 0.8 })
        for (const dx of [-4, 4]) blot(g, x + dx, -9.5, 0.9, C.goldL, 0.8, dx + 50)
        fx.push({ k: 'fire', x, y: -10, s: 1.1 }, { k: 'smoke', x, y: -21, s: 1 })
      } else if (id === 'dienVoTruong') {
        // sân đá bầu dục
        wash(g, ellipse(0, -5, 58, 12.5, 18), { fill: STONE, alpha: 1, jitter: 0.6, layers: 2, edge: 1, seed: seed + 70 })
        wash(g, ellipse(0, -6.2, 55, 10.5, 18), { fill: STONE_L, alpha: 0.95, jitter: 0.5, layers: 2, seed: seed + 71 })
        stroke(g, ellipse(0, -5, 58, 12.5, 18).concat([[58, -5]]), { w: 0.9, color: C.ink, press: 'even', alpha: 0.7 })
        stroke(g, ellipse(0, -6, 40, 7.5, 16).concat([[40, -6]]), { w: 0.5, color: C.ink2, press: 'even', alpha: 0.35, dry: 0.4 })
        // cổng 牌坊
        const gy = -14
        for (const x of [-24, 20]) {
          wash(g, rect(x, gy - 34, 4, 34), { sharp: true, fill: C.cinnabar, alpha: 1, jitter: 0.2, layers: 1, seed: seed + x })
          line([[x, gy - 34], [x, gy]], 0.5)
          line([[x + 4, gy - 34], [x + 4, gy]], 0.4, 0.5)
          wash(g, rect(x - 1.5, gy - 2, 7, 3), { sharp: true, fill: STONE, alpha: 1, jitter: 0.2, layers: 1, seed: seed + x + 1 })
        }
        wash(g, rect(-30, gy - 35, 60, 5.5), { sharp: true, fill: C.azuriteD, alpha: 1, jitter: 0.2, layers: 1, seed: seed + 72 })
        line([[-30, gy - 35], [30, gy - 35], [30, gy - 29.5], [-30, gy - 29.5], [-30, gy - 35]], 0.5)
        k.plaque(0, gy - 23.5, 0.8, id)
        k.roof(0, gy - 35, 70, 12)
        // giá binh khí
        const rx = -48, ry = -8
        for (const yy of [-15, -5]) wash(g, rect(rx - 7, ry + yy, 14, 1.8), { sharp: true, fill: C.lacquer2, alpha: 1, jitter: 0.1, layers: 1, seed: seed + yy })
        for (const x of [-4.5, -1.5, 1.5, 4.5]) {
          stroke(g, [[rx + x, ry + 1], [rx + x, ry - 22]], { w: 0.9, color: C.ochre, press: 'even', alpha: 1 })
          stroke(g, [[rx + x - 1.2, ry - 19], [rx + x, ry - 23.5], [rx + x + 1.2, ry - 19]], { w: 0.9, color: mix(C.silk, C.ink3, 0.4), press: 'even', alpha: 1 })
        }
        fx.push({ k: 'flag', x: 40, y: -49, s: 1 }, { k: 'flag', x: 52, y: -47, s: 0.9 })
        for (const x of [40, 52]) stroke(g, [[x, -7], [x, -49]], { w: 1.1, color: C.lacquer2, press: 'even', alpha: 1 })
        const spots: Pt[] = [[-22, -3], [-8, -1], [7, -4], [21, -2], [-14, 3], [13, 3]]
        spots.slice(0, Math.min(6, 1 + Math.floor(level / 2))).forEach(([x, y]) => fx.push({ k: 'disciple', x, y: y - 3, s: 1 }))
      } else if (id === 'tangBaoCac') {
        k.base(0, 0, 72, 9, false)
        wash(g, rect(-31, -13, 62, 4), { sharp: true, fill: STONE, alpha: 1, jitter: 0.2, layers: 1, seed: seed + 80 })
        line([[-31, -13], [31, -13]], 0.6)
        k.hall(0, -9, 58, 20, true)
        k.plaque(0, -25.8, 0.7, id)
        k.roof(0, -29, 74, 16)
        k.hall(0, -42, 40, 11, false)
        k.roof(0, -53, 56, 14)
        if (tier > 1) {
          k.lantern(-27, -28)
          k.lantern(27, -28)
        }
      } else if (id === 'tuLinhTran') {
        wash(g, ellipse(0, -3, 48, 13.5, 20), { fill: STONE, alpha: 1, jitter: 0.5, layers: 2, edge: 1, seed: seed + 90 })
        wash(g, ellipse(0, -4.6, 46, 11.8, 20), { fill: STONE_L, alpha: 1, jitter: 0.4, layers: 2, seed: seed + 91 })
        stroke(g, ellipse(0, -3, 48, 13.5, 20).concat([[48, -3]]), { w: 0.9, color: C.ink, press: 'even', alpha: 0.75 })
        // khắc phù văn
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4
          const x = 28 * Math.cos(a), y = -4.6 + 6.9 * Math.sin(a)
          stroke(g, [[x - 2.6, y], [x, y - 0.8], [x + 2.6, y]], { w: 0.8, color: C.azuriteD, press: 'taper', alpha: 0.7 })
        }
        stroke(g, ellipse(0, -4.6, 35, 8.6, 20).concat([[35, -4.6]]), { w: 0.5, color: C.azuriteD, press: 'even', alpha: 0.5, dry: 0.3 })
        fx.push({ k: 'rune', x: 0, y: -4.6, rx: 35, ry: 8.6 }, { k: 'rune', x: 0, y: -4.6, rx: 21, ry: 5.2 })
        k.orbPillar(-22, -13)
        k.orbPillar(22, -13)
        fx.push({ k: 'beam', x: 0, y: -5, h: tier >= 2 ? 86 : 76 }, { k: 'orb', x: 0, y: -6, s: 1.5 })
        if (tier >= 2) fx.push({ k: 'rune', x: 0, y: -58, rx: 16, ry: 4 })
        k.orbPillar(-40, -3.5)
        k.orbPillar(40, -3.5)
      } else if (id === 'khoangMach') {
        // vách đá có hang
        const crag: Pt[] = [[-58, 2], [-57, -16], [-51, -28], [-47, -44], [-36, -52], [-28, -64], [-14, -62], [-3, -70], [9, -66], [20, -58], [31, -61], [43, -50], [51, -36], [56, -21], [58, 2]]
        wash(g, crag, { fill: g2 => vgrad(g2, -68, 2, [[0, C.malachite], [0.35, C.azurite], [0.8, C.ochre], [1, C.ochre]]), alpha: 0.95, jitter: 1.5, layers: 3, edge: 1.6, seed: seed + 100 })
        wash(g, [[-51, -28], [-47, -44], [-36, -52], [-28, -64], [-24, -44], [-32, -24], [-44, -8]], { fill: C.indigo, alpha: 0.35, jitter: 1.2, layers: 2, seed: seed + 101 })
        stroke(g, crag.slice(0, 8), { w: 1.8, color: C.ink, press: 'nail', dry: 0.3, seed: seed + 102 })
        stroke(g, crag.slice(7), { w: 1.5, color: C.ink, press: 'nail', dry: 0.35, seed: seed + 103 })
        // gân đá chia khối
        stroke(g, [[-28, -63], [-26, -46], [-34, -30], [-42, -12]], { w: 1.2, color: C.ink, press: 'nail', dry: 0.45, alpha: 0.75, seed: seed + 104 })
        stroke(g, [[20, -57], [24, -44], [34, -30], [40, -10]], { w: 1.1, color: C.ink, press: 'nail', dry: 0.5, alpha: 0.65, seed: seed + 105 })
        for (let i = 0; i < 14; i++) {
          const x = -46 + rn() * 90, y = -58 + rn() * 44
          stroke(g, [[x, y], [x + 1, y + 4], [x + 2.5, y + 8]], { w: 0.8, color: C.ink, press: 'taper', alpha: 0.4, seed: seed + 110 + i })
        }
        moss(g, -20, -60, 4, 1.2, seed + 120)
        moss(g, 28, -60, 3, 1.1, seed + 121)
        tuft(g, -40, -48, 3.5, seed + 122)
        wash(g, [[-17, 0], [-17, -19], ...quadPts(-17, -19, 17, -19, 8).map(([x, y]) => [x, y - 0] as Pt), [17, -19], [17, 0]], { fill: C.ink, alpha: 0.92, jitter: 0.4, layers: 2, seed: seed + 130 })
        // khung gỗ cửa hầm
        for (const x of [-21, 16.6]) {
          wash(g, rect(x, -29, 4.4, 29), { sharp: true, fill: C.ochre, alpha: 1, jitter: 0.2, layers: 1, seed: seed + x })
          line([[x, -29], [x, 0]], 0.5)
        }
        wash(g, rect(-24, -33.5, 48, 5.5), { sharp: true, fill: mix(C.ochre, C.ink, 0.35), alpha: 1, jitter: 0.2, layers: 1, seed: seed + 131 })
        line([[-24, -33.5], [24, -33.5], [24, -28], [-24, -28], [-24, -33.5]], 0.5)
        k.plaque(0, -38.5, 0.8, id)
        // xe quặng
        stroke(g, [[-4, 0], [24, 3]], { w: 0.7, color: C.ink3, press: 'even' })
        stroke(g, [[4, -1], [34, 1]], { w: 0.7, color: C.ink3, press: 'even' })
        wash(g, [[18, -9], [36, -9], [34, -1], [20, -1]], { fill: mix(C.ochre, C.ink, 0.3), alpha: 1, jitter: 0.2, layers: 1, seed: seed + 132 })
        line([[18, -9], [36, -9], [34, -1], [20, -1], [18, -9]], 0.5)
        for (const [x, y, r, c] of [[22.5, -9.5, 2.8, C.azuriteL], [28, -10.6, 3.2, C.spirit], [32.5, -9.4, 2.3, C.azuriteL]] as const) blot(g, x, y, r, c, 1, Math.round(x), 0.9)
        for (const x of [22.5, 31.5]) blot(g, x, 0, 1.7, C.ink, 1, Math.round(x))
        // tinh thể
        for (const [x, y, s] of [[-38, 0, 1], [-30, -2, 0.7], [42, -14, 0.8]] as const) {
          const pts: Pt[][] = [[[x - 4 * s, y], [x - 2.6 * s, y - 10 * s], [x - 1 * s, y]], [[x - 1.2 * s, y], [x + 1.2 * s, y - 14 * s], [x + 3.2 * s, y]], [[x + 2 * s, y], [x + 4 * s, y - 8 * s], [x + 5.4 * s, y]]]
          for (const p of pts) {
            wash(g, p, { fill: C.spirit, alpha: 0.85, jitter: 0.15, layers: 1, seed: seed + Math.round(p[0][0] * 10) })
            stroke(g, [...p, p[0]], { w: 0.45, color: C.azuriteD, press: 'even', alpha: 0.8 })
          }
          fx.push({ k: 'spark', x: x + 1, y: y - 7 * s, s })
        }
        if (tier >= 2) {
          k.lantern(-19, -33)
          k.lantern(19, -33)
        }
      } else if (id === 'linhDien') {
        // ruộng bậc thang
        const bands = [116, 104, 92, 80].slice(0, tier + 2).map((bw, i) => ({ bw, y: -6 - i * 10 }))
        bands.forEach(({ bw, y }, i) => {
          const p: Pt[] = [...quadPts(-bw / 2, y, bw / 2, y, 7, -7), [bw / 2 - 3, y + 6], ...quadPts(bw / 2 - 3, y + 6, -bw / 2 + 3, y + 6, 7, -7).slice(1)]
          wash(g, p, { fill: i % 2 ? C.malachiteL : mix(C.malachiteL, C.gamboge, 0.25), alpha: 1, jitter: 0.5, layers: 2, edge: 0.8, seed: seed + 140 + i })
          stroke(g, quadPts(-bw / 2, y, bw / 2, y, 7, -7), { w: 0.8, color: C.malachiteD, press: 'even', alpha: 0.9 })
          for (let x = -bw / 2 + 6; x < bw / 2 - 4; x += 7) {
            const yy = y + 3 - 3.5 * (1 - ((2 * x) / bw) ** 2)
            stroke(g, [[x, yy], [x - 0.6, yy - 3.4]], { w: 0.9, color: C.malachiteD, press: 'nail', alpha: 0.85 })
            stroke(g, [[x, yy], [x + 1.4, yy - 2.6]], { w: 0.7, color: C.malachiteD, press: 'nail', alpha: 0.7 })
          }
        })
        for (const [x, y] of [[-30, -14], [-8, -22], [18, -12], [2, -30]] as const) fx.push({ k: 'herb', x, y, s: 1 })
        // lều tranh
        k.hall(46, -24, 22, 11, true)
        k.roof(46, -35, 32, 11, C.ochreL, C.ochre)
        for (let i = 0; i < 12; i++) stroke(g, [[34 + i * 2.1, -44 + Math.abs(i - 5.5) * 0.6], [33.5 + i * 2.2, -37]], { w: 0.6, color: C.ochre, press: 'fade', dry: 0.4, alpha: 0.8 })
        // biển cắm
        stroke(g, [[-52, -8], [-52, -20]], { w: 1.1, color: C.lacquer2, press: 'even' })
        k.plaque(-52, -24.5, 0.8, id)
      }
      grain(g, 0.4)
      return fx
    },
  }
  return { art, top, w }
}

// Đường cong bậc hai từ (x0,y0) tới (x1,y1), võng/phồng `sag` ở giữa
function quadPts(x0: number, y0: number, x1: number, y1: number, n: number, sag = 11): Pt[] {
  return quad([x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + sag], [x1, y1], n)
}

// Giàn tre khi đang xây — neo ở chân công trình, phủ khung w × h
export const scaffold = (w: number, h: number): Asset => ({
  x: -w / 2 - 4, y: -h - 4, w: w + 8, h: h + 8,
  draw(g) {
    const pole = { color: C.ochre, press: 'even' as const, alpha: 0.95, rough: 0.3 }
    for (const k of [-0.45, -0.15, 0.15, 0.45]) stroke(g, [[k * w * 0.95, 1], [k * w * 0.95 + 0.6, -h * 0.95]], { ...pole, w: 1.3 })
    for (const k of [0.3, 0.62, 0.92]) stroke(g, [[-w * 0.47, -h * k], [w * 0.47, -h * k + 0.8]], { ...pole, w: 1.1 })
    stroke(g, [[-w * 0.43, -h * 0.3], [-w * 0.14, -h * 0.62]], { ...pole, w: 0.9 })
    stroke(g, [[w * 0.14, -h * 0.3], [w * 0.43, -h * 0.62]], { ...pole, w: 0.9 })
    // dây buộc
    for (const k of [-0.45, -0.15, 0.15, 0.45]) for (const q of [0.3, 0.62]) blot(g, k * w * 0.95, -h * q, 0.8, C.ink2, 0.8, Math.round(k * 100 + q * 10))
  },
})

// Nền đất chưa xây: vòng nét đứt mảnh — neo ở chân
export const plot = (w: number): Asset => ({
  x: -w / 2 - 4, y: -10, w: w + 8, h: 18,
  draw(g) {
    const n = Math.round(w / 5)
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = a0 + (Math.PI * 2) / n * 0.55
      const p = (a: number): Pt => [Math.cos(a) * (w / 2 - 4), -1 + Math.sin(a) * 6.5]
      stroke(g, [p(a0), p((a0 + a1) / 2), p(a1)], { w: 1, color: C.silk, press: 'taper', alpha: 0.95 })
    }
    wash(g, ellipse(0, -1, w / 2 - 5, 5.5, 16), { fill: C.silk, alpha: 0.18, jitter: 0.8, layers: 2, seed: 4 })
  },
})
