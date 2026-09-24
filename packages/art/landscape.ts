// Phong cảnh thanh lục sơn thủy: mỏm núi, đỉnh xa, tùng, mây tường vân, sương, thác.
// Mỗi hàm trả về Asset (khung DU + hàm vẽ) để bake() thành texture. Neo (0,0) ghi ở từng hàm.
import { blot, grain, lerp, stroke, vgrad, wash, type Asset, type G, type Pt } from './brush'
import { rng } from './noise'
import { PIGMENT as C } from './palette'

// Xoá dần phần dưới (từ y0 tới y1) để hình tan vào sương
export function dissolve(g: G, x0: number, x1: number, y0: number, y1: number) {
  g.save()
  g.globalCompositeOperation = 'destination-out'
  const gr = g.createLinearGradient(0, y0, 0, y1)
  gr.addColorStop(0, 'rgba(0,0,0,0)')
  gr.addColorStop(1, 'rgba(0,0,0,1)')
  g.fillStyle = gr
  g.fillRect(x0, y0, x1 - x0, y1 - y0 + 2)
  g.restore()
}

// Chùm chấm rêu (苔点) quanh một điểm
export function moss(g: G, x: number, y: number, n: number, r: number, seed: number, color: string = C.ink) {
  const rn = rng(seed)
  for (let i = 0; i < n; i++) blot(g, x + (rn() - 0.5) * r * 6, y + (rn() - 0.5) * r * 2.2, r * (0.55 + rn() * 0.6), color, 0.8, seed * 7 + i, 0.7, rn() * 3)
}

// Nhúm cỏ: vài nét nhọn chụm gốc
export function tuft(g: G, x: number, y: number, s: number, seed: number) {
  const rn = rng(seed)
  for (let i = 0; i < 4; i++) {
    const a = -Math.PI / 2 + (i - 1.5) * 0.35 + (rn() - 0.5) * 0.2
    const l = s * (0.7 + rn() * 0.6)
    stroke(g, [[x, y], [x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.55], [x + Math.cos(a) * l, y + Math.sin(a) * l]], { w: s * 0.18, color: C.ink, press: 'nail', alpha: 0.8, seed: seed + i })
  }
}

// ---------- Đỉnh núi có mặt bằng (nơi dựng công trình) ----------
// Neo: giữa mép trước mặt bằng; công trình đứng ở y ≈ 0. Mỗi tầng là một đỉnh núi nhô lên khỏi biển mây:
// mặt bằng trên đỉnh, sườn loe xuống, gân núi toả từ mép, chân tan vào sương ở khoảng `h`.
export function ledge(w: number, h: number, seed = 1): Asset {
  const d = Math.min(13, w * 0.065)
  const spread = w * 0.32
  return {
    x: -w / 2 - spread - 10, y: -d - 8, w: w + spread * 2 + 20, h: h + d + 14,
    draw(g) {
      const rn = rng(seed)
      const j = (k: number) => (rn() - 0.5) * k
      const lipY = (x: number) => 1.5 + 3 * (1 - Math.min(1, (x / (w / 2)) ** 2))
      const sl = spread * (0.7 + rn() * 0.5), sr = spread * (0.7 + rn() * 0.5)
      // Sườn trái/phải: có vai núi (một chỗ phồng) cho dáng tự nhiên
      const left: Pt[] = [[-w / 2, lipY(-w / 2)], [-w / 2 - sl * 0.18 + j(3), h * 0.16], [-w / 2 - sl * 0.32, h * 0.32 + j(5)], [-w / 2 - sl * 0.62 + j(6), h * 0.62], [-w / 2 - sl, h]]
      const right: Pt[] = [[w / 2, lipY(w / 2)], [w / 2 + sr * 0.2 + j(3), h * 0.18], [w / 2 + sr * 0.38, h * 0.36 + j(5)], [w / 2 + sr * 0.66 + j(6), h * 0.66], [w / 2 + sr, h]]
      const lipPts: Pt[] = Array.from({ length: 7 }, (_, k) => {
        const x = lerp(-w / 2, w / 2, k / 6)
        return [x, lipY(x) + (k && k < 6 ? j(1.5) : 0)]
      })
      const back: Pt[] = [[-w / 2 + 6, -d * 0.3], [-w * 0.26, -d + j(2)], [w * 0.06, -d * 1.08 + j(2)], [w * 0.3, -d * 0.86 + j(2)], [w / 2 - 5, -d * 0.28]]
      const body: Pt[] = [...left, [0, h * 1.05], ...right.slice().reverse(), ...lipPts.slice().reverse().slice(1, -1)]

      // Gân núi: từ mép môi toả xuống, loe theo sườn
      const ridges = Math.max(2, Math.round(w / 55))
      const rid: Pt[][] = []
      for (let k = 0; k < ridges; k++) {
        const t = (k + 0.5 + j(0.5)) / ridges
        const x0 = lerp(-w / 2, w / 2, t)
        const x1 = lerp(-w / 2 - sl, w / 2 + sr, t) + j(10)
        rid.push([[x0, lipY(x0)], [lerp(x0, x1, 0.12) + j(4), h * 0.16], [lerp(x0, x1, 0.3) + j(5), h * 0.34], [lerp(x0, x1, 0.62) + j(6), h * 0.64], [x1, h * 0.98]])
      }
      const sides = [left, ...rid, right]

      // 1. son nền cả khối, nhạt ở trên
      wash(g, body, { fill: g2 => vgrad(g2, 0, h, [[0, C.ochreL], [0.55, C.ochre], [1, C.ochre]]), alpha: 0.6, jitter: 2.5, layers: 3, seed })
      // 2. từng mặt núi giữa hai gân: lam khoáng, mặt trái của gân tối (chàm), mặt phải sáng (lục)
      for (let k = 0; k < sides.length - 1; k++) {
        const a = sides[k], b = sides[k + 1]
        const face: Pt[] = [...a, ...b.slice().reverse()]
        wash(g, face, {
          fill: g2 => vgrad(g2, 0, h * 0.85, [[0, C.azurite], [0.5, C.azuriteL], [1, 'rgba(120,166,194,0)']]),
          alpha: 0.55 + rn() * 0.3, jitter: 2.2, edge: 2, layers: 3, seed: seed + 10 + k,
        })
        // dải tối sát gân trái (khuất sáng)
        const shade: Pt[] = a.map(([x, y], i) => [lerp(x, b[i][0], 0.3), y] as Pt)
        wash(g, [...a, ...shade.slice().reverse()], { fill: g2 => vgrad(g2, 0, h * 0.7, [[0, C.indigo], [1, 'rgba(52,70,94,0)']]), alpha: 0.4, jitter: 1.5, layers: 2, seed: seed + 30 + k })
        // lục khoáng trên đầu mặt núi (nơi đón nắng)
        const cap: Pt[] = [a[0], b[0], [lerp(b[0][0], b[1][0], 0.55), lerp(b[0][1], b[1][1], 0.55)], [lerp(a[0][0], a[1][0], 0.45), lerp(a[0][1], a[1][1], 0.45)]]
        wash(g, cap, { fill: C.malachite, alpha: 0.6, jitter: 1.5, layers: 2, seed: seed + 50 + k })
      }
      // 3. 披麻皴: nét dài mảnh, lượn theo sườn
      for (let k = 0; k < sides.length - 1; k++) {
        const a = sides[k], b = sides[k + 1]
        const lines = 1 + Math.floor(rn() * 2)
        for (let i = 0; i < lines; i++) {
          const t = (i + 0.6) / (lines + 0.4)
          const stop = 0.3 + rn() * 0.25
          const pts: Pt[] = [0, 0.3, 0.62, 1].map(v => {
            const u = v * stop
            const ia = Math.min(a.length - 1, u * (a.length - 1))
            const i0 = Math.floor(ia), f = ia - i0
            const pa = a[i0], pa1 = a[Math.min(a.length - 1, i0 + 1)], pb = b[i0], pb1 = b[Math.min(b.length - 1, i0 + 1)]
            const x = lerp(lerp(pa[0], pa1[0], f), lerp(pb[0], pb1[0], f), t)
            const y = lerp(lerp(pa[1], pa1[1], f), lerp(pb[1], pb1[1], f), t)
            return [x + j(2.5), y + 4] as Pt
          })
          stroke(g, pts, { w: 0.9, color: C.ink, press: 'nail', alpha: 0.3 + rn() * 0.15, dry: 0.45, seed: seed + 100 + k * 9 + i })
        }
      }
      // 4. gân núi và sườn: nét mực có lực, nhấc bút giữa chừng
      rid.forEach((r, k) => {
        stroke(g, r.slice(0, 3), { w: 1.8, color: C.ink, press: 'nail', dry: 0.4, ink: 0.4, alpha: 0.8, seed: seed + 60 + k })
      })
      stroke(g, left.slice(0, 4), { w: 2.4, color: C.ink, press: 'nail', dry: 0.3, ink: 0.3, seed: seed + 3 })
      stroke(g, right.slice(0, 4), { w: 2.2, color: C.ink, press: 'nail', dry: 0.3, ink: 0.3, seed: seed + 4 })
      // 5. mặt bằng: lục khoáng; môi là một nét mực
      wash(g, [...back, ...lipPts.slice().reverse()], { fill: g2 => vgrad(g2, -d, 4, [[0, C.malachiteL], [1, C.malachite]]), alpha: 0.92, jitter: 1.2, edge: 1.3, seed: seed + 1 })
      stroke(g, lipPts.slice(0, 4), { w: 1.9, color: C.ink, press: 'nail', alpha: 0.88, seed: seed + 5 })
      stroke(g, lipPts.slice(3), { w: 1.7, color: C.ink, press: 'taper', alpha: 0.82, seed: seed + 6 })
      stroke(g, back, { w: 1, color: C.ink2, press: 'taper', alpha: 0.4, seed: seed + 7 })
      // 6. chấm rêu dọc môi và đầu gân, cỏ lác đác trên mặt bằng
      for (let i = 0; i < ridges + 4; i++) moss(g, lerp(-w * 0.48, w * 0.48, (i + rn() * 0.7) / (ridges + 4)), lipY(0) + j(2), 3, 1.1, seed + 200 + i)
      rid.forEach((r, k) => moss(g, r[1][0], r[1][1] - 4, 3, 1, seed + 300 + k))
      for (let i = 0; i < ridges + 2; i++) tuft(g, lerp(-w * 0.46, w * 0.46, rn()), -d * 0.25 + j(5), 3, seed + 400 + i)
      grain(g, 0.55)
      dissolve(g, -w, w, h * 0.45, h + 8)
    },
  }
}

// ---------- Đỉnh núi nhọn (núi sau Chủ điện, vách thác) ----------
// Neo: giữa chân (chân tan vào sương). sx: đỉnh lệch khỏi tâm (−0.5..0.5 bề ngang).
export function peak(w: number, h: number, seed = 1, sx = 0): Asset {
  return {
    x: -w / 2 - 8, y: -h - 8, w: w + 16, h: h + 12,
    draw(g) {
      const rn = rng(seed)
      const j = (k: number) => (rn() - 0.5) * k
      const top: Pt = [sx * w, -h]
      // sườn lõm: dốc gắt gần đỉnh, thoải dần xuống chân
      const left: Pt[] = [top, [top[0] - w * 0.08 + j(4), -h * 0.78], [top[0] - w * 0.2 + j(6), -h * 0.52], [-w * 0.36 + j(6), -h * 0.24], [-w / 2, 0]]
      const right: Pt[] = [top, [top[0] + w * 0.07 + j(4), -h * 0.8], [top[0] + w * 0.22 + j(6), -h * 0.5], [w * 0.38 + j(6), -h * 0.22], [w / 2, 0]]
      const ridges = Math.max(2, Math.round(w / 70))
      const rid: Pt[][] = []
      for (let k = 0; k < ridges; k++) {
        const t = (k + 0.5) / ridges
        const x1 = lerp(-w * 0.4, w * 0.4, t) + j(w * 0.08)
        rid.push([[lerp(top[0], x1, 0.12), -h * 0.9], [lerp(top[0], x1, 0.25) + j(4), -h * 0.74], [lerp(top[0], x1, 0.5) + j(6), -h * 0.48], [lerp(top[0], x1, 0.8) + j(6), -h * 0.2], [x1, 0]])
      }
      const sides = [left, ...rid, right]
      wash(g, [...left, ...right.slice().reverse()], { fill: g2 => vgrad(g2, -h, 0, [[0, C.ochreL], [0.6, C.ochre], [1, C.ochre]]), alpha: 0.55, jitter: 3, layers: 3, seed })
      for (let k = 0; k < sides.length - 1; k++) {
        const a = sides[k], b = sides[k + 1]
        wash(g, [...a, ...b.slice().reverse()], {
          fill: g2 => vgrad(g2, -h, -h * 0.1, [[0, C.azurite], [0.5, C.azuriteL], [1, 'rgba(120,166,194,0)']]),
          alpha: 0.6 + rn() * 0.3, jitter: 2.5, edge: 2, layers: 3, seed: seed + 10 + k,
        })
        const shade = a.map(([x, y], i) => [lerp(x, b[i][0], 0.3), y] as Pt)
        wash(g, [...a, ...shade.slice().reverse()], { fill: g2 => vgrad(g2, -h, 0, [[0, C.indigo], [0.8, 'rgba(52,70,94,0)']]), alpha: 0.4, jitter: 1.5, layers: 2, seed: seed + 30 + k })
        wash(g, [a[0], a[1], [lerp(a[1][0], b[1][0], 0.5), a[1][1] + 4], b[1]], { fill: C.malachite, alpha: 0.65, jitter: 1.5, layers: 2, seed: seed + 50 + k })
        // 披麻皴
        for (let i = 0; i < 3; i++) {
          const t = (i + 0.7) / 3.6
          const pts = [1, 2, 3].map(q => [lerp(a[q][0], b[q][0], t) + j(3), lerp(a[q][1], b[q][1], t)] as Pt)
          stroke(g, pts, { w: 0.9, color: C.ink, press: 'nail', alpha: 0.35 + rn() * 0.2, dry: 0.35, seed: seed + 100 + k * 5 + i })
        }
      }
      rid.forEach((r, k) => stroke(g, r.slice(0, 3), { w: 1.6, color: C.ink, press: 'nail', dry: 0.4, ink: 0.35, alpha: 0.8, seed: seed + 60 + k }))
      stroke(g, left.slice(0, 4), { w: 2.2, color: C.ink, press: 'nail', dry: 0.3, ink: 0.3, seed: seed + 3 })
      stroke(g, right.slice(0, 4), { w: 2, color: C.ink, press: 'nail', dry: 0.3, ink: 0.3, seed: seed + 4 })
      rid.forEach((r, k) => moss(g, r[1][0], r[1][1], 3, 1.1, seed + 300 + k))
      moss(g, top[0], top[1] + 3, 4, 1.2, seed + 310)
      grain(g, 0.5)
      dissolve(g, -w, w, -h * 0.4, 4)
    },
  }
}

// Khối đá tiền cảnh: mực đậm, ít màu (gần mắt thì tối) — neo ở chân
export function rock(w: number, h: number, seed = 1): Asset {
  return {
    x: -w / 2 - 6, y: -h - 6, w: w + 12, h: h + 10,
    draw(g) {
      const rn = rng(seed)
      const j = (k: number) => (rn() - 0.5) * k
      const pts: Pt[] = [[-w / 2, 2], [-w * 0.44 + j(4), -h * 0.5], [-w * 0.26 + j(4), -h * 0.9], [j(6), -h], [w * 0.28 + j(4), -h * 0.82], [w * 0.46 + j(4), -h * 0.4], [w / 2, 2]]
      wash(g, pts, { fill: g2 => vgrad(g2, -h, 2, [[0, C.indigo], [1, C.ink]]), alpha: 0.92, jitter: 2, layers: 3, edge: 2, seed })
      wash(g, [pts[2], pts[3], pts[4], [w * 0.1, -h * 0.55], [-w * 0.15, -h * 0.6]], { fill: C.malachiteD, alpha: 0.5, jitter: 1.5, layers: 2, seed: seed + 1 })
      stroke(g, pts.slice(0, 4), { w: 2.6, color: C.ink, press: 'nail', dry: 0.3, seed: seed + 2 })
      stroke(g, pts.slice(3), { w: 2.2, color: C.ink, press: 'nail', dry: 0.35, seed: seed + 3 })
      for (let i = 0; i < 6; i++) moss(g, lerp(-w * 0.3, w * 0.3, rn()), -h * (0.6 + rn() * 0.35), 3, 1.4, seed + 10 + i)
      grain(g, 0.4)
    },
  }
}

// ---------- Bản đồ vùng: tranh thủy mặc trên giấy ----------
// peaks: [x, y chân, rộng, cao]; pines: [x, y]; river: các điểm dòng sông. Toạ độ DU của bản đồ (w × h).
export function mapTerrain(w: number, h: number, peaks: number[][], pines: number[][], river: Pt[]): Asset {
  return {
    x: 0, y: 0, w, h,
    draw(g) {
      // sông: dải lam nhạt loang, hai bờ nét mực mảnh đứt quãng
      stroke(g, river, { w: 26, color: C.azuriteL, press: 'even', alpha: 0.35, rough: 0.5, wobble: 3, seed: 5 })
      stroke(g, river, { w: 14, color: C.azuriteL, press: 'even', alpha: 0.3, rough: 0.4, seed: 6 })
      const bank = (dx: number, seed: number) => {
        for (let i = 0; i < river.length - 1; i += 2) {
          const seg = river.slice(i, i + 3).map(([x, y]) => [x + dx, y] as Pt)
          if (seg.length > 1) stroke(g, seg, { w: 1, color: C.ink2, press: 'taper', alpha: 0.45, dry: 0.4, seed: seed + i })
        }
      }
      bank(-13, 10)
      bank(13, 40)
      // núi mực nhạt: xa (trên) nhạt hơn gần (dưới)
      const sorted = peaks.slice().sort((a, b) => a[1] - b[1])
      sorted.forEach(([x, y, pw, ph], i) => {
        const far = 1 - y / h
        const rn = rng(100 + i)
        const top: Pt = [x + (rn() - 0.5) * pw * 0.2, y - ph]
        const pts: Pt[] = [[x - pw / 2, y], [x - pw * 0.28, y - ph * 0.45], [top[0] - pw * 0.08, y - ph * 0.85], top, [top[0] + pw * 0.1, y - ph * 0.8], [x + pw * 0.3, y - ph * 0.4], [x + pw / 2, y]]
        const tone = mixInk(far)
        wash(g, pts, { fill: g2 => vgrad(g2, y - ph, y, [[0, tone], [1, 'rgba(90,110,112,0)']]), alpha: 0.75 - far * 0.25, jitter: 2, layers: 3, edge: 1.5, seed: 200 + i })
        wash(g, [top, pts[4], [x + pw * 0.05, y - ph * 0.35], pts[2]], { fill: C.malachite, alpha: 0.2 * (1 - far), jitter: 1.5, layers: 2, seed: 300 + i })
        stroke(g, pts.slice(1, 4), { w: 1.4, color: C.ink, press: 'nail', alpha: 0.55 - far * 0.25, dry: 0.4, seed: 400 + i })
        stroke(g, pts.slice(3, 6), { w: 1.2, color: C.ink, press: 'nail', alpha: 0.45 - far * 0.2, dry: 0.5, seed: 500 + i })
        stroke(g, [top, [top[0] - 4, y - ph * 0.6], [top[0] - 10, y - ph * 0.3]], { w: 0.9, color: C.ink, press: 'nail', alpha: 0.3, dry: 0.5, seed: 600 + i })
        moss(g, top[0], top[1] + 4, 3, 0.9, 700 + i)
      })
      pines.forEach(([x, y], i) => {
        g.save()
        g.translate(x, y)
        g.globalAlpha = 0.8
        pine(0.42, 800 + i).draw(g)
        g.restore()
      })
      grain(g, 0.3)
    },
  }
}
const mixInk = (far: number) => (far > 0.6 ? '#8fa3a6' : far > 0.3 ? '#6f8a8e' : '#4f6b70')

// Gradient dọc tiện dùng: các điểm dừng (0..1) giữa y0, y1

// ---------- Tùng ----------
// Neo: gốc cây. Thân vặn bằng nét khô, tán là các "đĩa kim" dẹt xếp tầng (lối vẽ tùng hình bánh xe).
export function pine(s = 1, seed = 1): Asset {
  return {
    x: -34 * s, y: -58 * s, w: 68 * s, h: 62 * s,
    draw(g) {
      const rn = rng(seed)
      const j = (k: number) => (rn() - 0.5) * k * s
      const lean = (rn() - 0.5) * 14 * s
      const top: Pt = [lean + j(2), -44 * s]
      const trunk: Pt[] = [[0, 2 * s], [j(5), -12 * s], [lean * 0.35 + j(5), -26 * s], top]
      // đĩa kim: x, y, bán kính ngang
      const pads: [number, number, number][] = [
        [top[0] + j(2), top[1] - 3 * s, 12 * s],
        [lean * 0.5 - 13 * s + j(3), -34 * s, 10 * s],
        [lean * 0.45 + 14 * s + j(3), -30 * s, 11 * s],
        [lean * 0.2 - 15 * s + j(3), -20 * s, 8 * s],
        [lean * 0.2 + 12 * s + j(3), -16 * s, 7 * s],
      ].slice(0, 4 + Math.floor(rn() * 2)) as [number, number, number][]
      // mảng mực nhạt phía sau cho có chiều sâu
      // cành vươn từ thân tới đĩa
      pads.slice(1).forEach(([x, y], i) => {
        const from = trunk[1 + ((i + 1) % 2)]
        stroke(g, [[from[0], y + 7 * s], [(x + from[0]) / 2, y + 3 * s + j(3)], [x, y + 1.5 * s]], { w: 2.2 * s, color: C.ink, press: 'nail', dry: 0.35, seed: seed + i })
      })
      // thân: hai lớp — son nhạt làm thịt, mực khô làm vỏ; vảy tùng là nét cong ngắn
      stroke(g, trunk, { w: 6 * s, color: C.ochre, press: 'rise', alpha: 0.45, seed: seed + 11 })
      stroke(g, trunk.map(([x, y]) => [x - 1.8 * s, y] as Pt), { w: 2.6 * s, color: C.ink, press: 'rise', dry: 0.4, seed: seed + 10 })
      stroke(g, trunk.map(([x, y]) => [x + 2 * s, y] as Pt), { w: 1.4 * s, color: C.ink, press: 'rise', dry: 0.55, alpha: 0.75, seed: seed + 12 })
      for (let i = 0; i < 6; i++) {
        const t = 0.1 + i * 0.14, x = lerp(trunk[0][0], top[0], t) + j(1.5), y = lerp(trunk[0][1], top[1], t)
        stroke(g, [[x - 1.5 * s, y + 0.6 * s], [x, y - 0.6 * s], [x + 1.5 * s, y + 0.6 * s]], { w: 0.8 * s, color: C.ink, press: 'taper', alpha: 0.65, seed: seed + 20 + i })
      }
      // đĩa kim: lục khoáng pha mực, trên là nan kim toả ra
      pads.forEach(([x, y, r], i) => {
        const cy = y + r * 0.3
        // màu lục quệt lỏng, không thành hình elip
        wash(g, [[x - r, cy - r * 0.05], [x - r * 0.6, cy - r * 0.42], [x, cy - r * 0.55], [x + r * 0.7, cy - r * 0.4], [x + r * 1.05, cy], [x, cy + r * 0.08]], { fill: C.malachite, alpha: 0.42, jitter: 1.8 * s, layers: 3, seed: seed + 30 + i })
        // nửa bánh xe kim tùng: hai lớp nan, lớp sau nhạt và lệch
        for (const [ox, oy, a0, al] of [[r * 0.15, -r * 0.08, 0.5, 0], [0, 0, 0.82, 1]] as const) {
          const spokes = 12 + Math.floor(rn() * 5)
          for (let k = 0; k < spokes; k++) {
            const a = Math.PI * (1.02 + (k / (spokes - 1)) * 0.96) + (rn() - 0.5) * 0.07
            const l = r * (0.85 + rn() * 0.3)
            const bx = x + ox, by = cy + oy
            const ex = bx + Math.cos(a) * l, ey = by + Math.sin(a) * l * 0.55
            stroke(g, [[bx + Math.cos(a) * r * 0.1, by + Math.sin(a) * r * 0.06], [(bx + ex) / 2, (by + ey) / 2], [ex, ey]], { w: 0.65 * s, color: al ? C.ink : C.ink2, press: 'nail', alpha: a0, seed: seed + 50 + i * 40 + k + al * 20 })
          }
        }
      })
      grain(g, 0.45)
    },
  }
}


// ---------- Mây tường vân ----------
// Neo: giữa đáy mây. Mỗi "đầu mây" là một vòng tròn có xoáy ốc nối liền viền. dark: kiếp vân.
export function cloud(w = 90, seed = 1, dark = false): Asset {
  const rn0 = rng(seed)
  const n = 3 + Math.floor(rn0() * 2)
  const heads: [number, number, number][] = [] // x, y tâm, r
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const r = w * (0.12 + rn0() * 0.07) * (1 + Math.sin(t * Math.PI) * 0.55)
    heads.push([lerp(-w * 0.4, w * 0.4, t) + (rn0() - 0.5) * w * 0.05, -r * 0.95, r])
  }
  const top = Math.max(...heads.map(([, y, r]) => -y + r))
  return {
    x: -w / 2 - 8, y: -top - 6, w: w + 16, h: top + 12,
    draw(g) {
      const ink = dark ? C.goldL : C.ink2
      const body = dark ? C.lacquer : C.silk
      // khối mây = hợp các đầu mây + đế dẹt
      const outline: Pt[] = []
      for (let x = -w / 2; x <= w / 2 + 0.1; x += 1.5) {
        let y = -1.5 * (1 - (x / (w / 2)) ** 2)
        for (const [hx, hy, r] of heads) if (Math.abs(x - hx) < r) y = Math.min(y, hy - Math.sqrt(r * r - (x - hx) ** 2))
        outline.push([x, y])
      }
      const base: Pt[] = [[w / 2, 0], [w * 0.15, 2.4], [-w * 0.2, 2], [-w / 2, 0]]
      wash(g, [...outline, ...base], { fill: body, alpha: dark ? 0.95 : 1, jitter: 0.6, layers: 2, seed })
      // bóng nhẹ dồn về đáy mây
      wash(g, [...outline, ...base], { fill: g2 => vgrad(g2, -top, 2, [[0, 'rgba(120,166,194,0)'], [0.55, 'rgba(120,166,194,0)'], [1, dark ? C.indigo : C.azuriteL]]), alpha: dark ? 0.7 : 0.35, jitter: 0.6, layers: 1, seed: seed + 2 })
      stroke(g, outline.filter((_, i) => i % 3 === 0), { w: 1.3, color: ink, press: 'even', alpha: 0.85, seed: seed + 5 })
      stroke(g, base, { w: 1, color: ink, press: 'taper', alpha: 0.55, seed: seed + 7 })
      // xoáy: bắt đầu từ viền dưới-trong của đầu mây, cuộn vào tâm
      heads.forEach(([hx, hy, r], i) => {
        const dir = hx < 0 ? 1 : -1
        stroke(g, spiral(hx, hy + r * 0.1, r * 0.72, 1.15, dir), { w: 1.15, color: ink, press: 'rise', alpha: 0.8, seed: seed + 10 + i })
      })
      if (!dark) grain(g, 0.3)
    },
  }
}

// Xoắn ốc từ ngoài vào trong
export function spiral(x: number, y: number, r: number, turns: number, dir: number): Pt[] {
  const pts: Pt[] = []
  const k = Math.ceil(turns * 14)
  for (let i = 0; i <= k; i++) {
    const t = i / k
    const a = Math.PI * 0.9 + dir * t * turns * Math.PI * 2
    const rr = r * (1 - t * 0.78)
    pts.push([x + Math.cos(a) * rr * dir, y + Math.sin(a) * rr * 0.8])
  }
  return pts
}

