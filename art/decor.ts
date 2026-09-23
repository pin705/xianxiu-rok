// Chi tiết cảnh tông môn: bậc đá leo núi, mai nở, đèn đá, bụi trúc. Mỗi hàm trả về Asset để bake().
import { blot, grain, spline, stroke, wash, type Asset, type G, type Pt } from './brush'
import { dissolve, moss, tuft } from './landscape'
import { rng } from './noise'
import { PIGMENT as C, mix } from './palette'

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const BLOSSOM = '#eaa2b3'
const BLOSSOM_L = '#f7d4dc'

// ---------- Bậc đá leo sườn núi ----------
// path: các điểm từ chân (dưới) lên đỉnh (trên), toạ độ DU tuyệt đối trong cảnh. Neo (0,0) của asset = gốc toạ độ cảnh,
// nên đặt sprite ở (0,0). Bậc hẹp dần và dày dần về phía trên (xa hơn), chân tan vào sương.
export function stairway(path: Pt[], width = 14, seed = 1): Asset {
  const xs = path.map(p => p[0]), ys = path.map(p => p[1])
  const x0 = Math.min(...xs) - width - 6, x1 = Math.max(...xs) + width + 6
  const y0 = Math.min(...ys) - 8, y1 = Math.max(...ys) + 6
  return {
    x: x0, y: y0, w: x1 - x0, h: y1 - y0,
    draw(g) {
      const r = rng(seed)
      const c = spline(path, 1)
      // độ dài tích luỹ để đặt bậc đều theo quãng đường
      const s = [0]
      for (let i = 1; i < c.length; i++) s.push(s[i - 1] + Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]))
      const len = s[s.length - 1]
      const at = (d: number) => {
        let i = s.findIndex(v => v >= d)
        if (i <= 0) i = 1
        const k = (d - s[i - 1]) / Math.max(1e-6, s[i] - s[i - 1])
        const p: Pt = [lerp(c[i - 1][0], c[i][0], k), lerp(c[i - 1][1], c[i][1], k)]
        const tx = c[i][0] - c[i - 1][0], ty = c[i][1] - c[i - 1][1], tl = Math.hypot(tx, ty) || 1
        return { p, n: [-ty / tl, tx / tl] as Pt, t: d / len }
      }
      const half = (t: number) => (width / 2) * lerp(1, 0.72, t) // hẹp dần lên trên
      const left: Pt[] = [], right: Pt[] = []
      for (let d = 0; d <= len; d += 2) {
        const { p, n, t } = at(d)
        const h = half(t)
        left.push([p[0] + n[0] * h, p[1] + n[1] * h])
        right.push([p[0] - n[0] * h, p[1] - n[1] * h])
      }
      // lòng bậc: đá sáng, bóng xẫm ở hai mép
      wash(g, [...left, ...right.slice().reverse()], { fill: mix(C.paper2, C.ink3, 0.18), alpha: 0.95, jitter: 0.4, layers: 2, seed })
      // từng bậc: gờ sáng + mặt đứng tối, dày dần lên trên
      let d = 1
      while (d < len - 1) {
        const { p, n, t } = at(d)
        const h = half(t) * 0.96
        const a: Pt = [p[0] + n[0] * h, p[1] + n[1] * h], b: Pt = [p[0] - n[0] * h, p[1] - n[1] * h]
        const rise = lerp(1.6, 1.1, t)
        wash(g, [a, b, [b[0], b[1] + rise], [a[0], a[1] + rise]], { fill: C.ink2, alpha: 0.28, jitter: 0.15, layers: 1, sharp: true, seed: seed + Math.round(d * 7) })
        stroke(g, [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + (r() - 0.5) * 0.4], b], { w: 0.55, color: C.ink, press: 'even', alpha: 0.55, rough: 0.3 })
        d += lerp(4.2, 2.6, t)
      }
      // lan can đá hai bên, trụ nhỏ cách quãng
      stroke(g, left, { w: 1, color: C.ink, press: 'taper', alpha: 0.75, dry: 0.3, seed: seed + 3 })
      stroke(g, right, { w: 1, color: C.ink, press: 'taper', alpha: 0.75, dry: 0.3, seed: seed + 4 })
      for (let i = 4; i < left.length - 2; i += 7)
        for (const side of [left, right]) {
          const [x, y] = side[i]
          stroke(g, [[x, y + 1.2], [x, y - 2.4]], { w: 1.1, color: C.ink2, press: 'even', alpha: 0.8 })
          blot(g, x, y - 2.8, 0.8, mix(C.paper2, C.ink3, 0.3), 1, seed + i)
        }
      // rêu, cỏ ở mép bậc
      for (let i = 0; i < 6; i++) {
        const { p, n, t } = at(len * (0.1 + r() * 0.8))
        const side = r() < 0.5 ? 1 : -1
        moss(g, p[0] + n[0] * half(t) * side * 1.15, p[1] + n[1] * half(t) * side, 2, 0.8, seed + 20 + i)
      }
      grain(g, 0.35)
      dissolve(g, x0, x1, y1 - (y1 - y0) * 0.28, y1 + 4)
    },
  }
}

// ---------- Mai nở (梅) ----------
// Neo: gốc cây. Thân khô xoắn bằng nét mực đứt, cành gãy góc, hoa hồng/trắng chấm thành chùm.
export function blossom(s = 1, seed = 1): Asset {
  return {
    x: -30 * s, y: -46 * s, w: 60 * s, h: 50 * s,
    draw(g) {
      const r = rng(seed)
      const j = (k: number) => (r() - 0.5) * k * s
      const trunk: Pt[] = [[0, 2 * s], [j(4) - 2 * s, -10 * s], [4 * s + j(3), -20 * s], [j(4), -30 * s]]
      const tips: Pt[] = []
      const branch = (from: Pt, dir: number, len: number, depth: number) => {
        const pts: Pt[] = [from]
        let [x, y] = from
        let a = dir
        for (let i = 0; i < 3; i++) {
          a += (r() - 0.5) * 0.9
          x += Math.cos(a) * len / 3
          y += Math.sin(a) * len / 3
          pts.push([x, y])
        }
        stroke(g, pts, { w: (2.2 - depth * 0.7) * s, color: C.ink, press: 'nail', dry: 0.45, alpha: 0.95, seed: seed + depth * 17 + Math.round(len) })
        tips.push(pts[3], pts[2])
        if (depth < 2) for (let k = 0; k < 2; k++) branch(pts[1 + k], a + (k ? 0.7 : -0.8), len * 0.6, depth + 1)
      }
      // thân: hai nét khô chồng — một đậm một nhạt, có mắt gỗ
      stroke(g, trunk, { w: 5 * s, color: C.ink2, press: 'rise', dry: 0.5, alpha: 0.9, seed: seed + 1 })
      stroke(g, trunk.map(([x, y]) => [x + 1.4 * s, y] as Pt), { w: 2 * s, color: C.ink, press: 'rise', dry: 0.6, alpha: 0.9, seed: seed + 2 })
      blot(g, trunk[1][0], trunk[1][1], 1.3 * s, C.ink, 0.8, seed + 3)
      branch(trunk[3], -Math.PI / 2 - 0.5, 20 * s, 0)
      branch(trunk[2], -0.3, 18 * s, 1)
      branch(trunk[2], Math.PI + 0.4, 16 * s, 1)
      // hoa: chùm ở đầu cành và dọc cành
      for (const [x, y] of tips)
        for (let k = 0; k < 3; k++) {
          const hx = x + j(6), hy = y + j(5)
          blot(g, hx, hy, (1.6 + r() * 1.1) * s, r() < 0.7 ? BLOSSOM : BLOSSOM_L, 0.95, seed + Math.round(hx * 13 + hy), 0.9)
          blot(g, hx, hy, 0.45 * s, C.cinnabar, 0.9, seed + Math.round(hx * 7), 1)
        }
      // vài nụ lẻ
      for (let k = 0; k < 8; k++) {
        const [x, y] = tips[Math.floor(r() * tips.length)]
        blot(g, x + j(10), y + j(8), 0.7 * s, C.cinnabarL, 0.9, seed + 100 + k, 1)
      }
      grain(g, 0.3)
    },
  }
}

// ---------- Đèn đá (石灯) ----------
// Neo: chân đèn. Ban đêm cảnh gắn thêm quầng sáng ở ô lửa (toạ độ trả về trong meta).
export function stoneLantern(s = 1): Asset<[number, number]> {
  return {
    x: -8 * s, y: -26 * s, w: 16 * s, h: 28 * s,
    draw(g) {
      const st = mix(C.paper2, C.ink3, 0.35), dark = mix(st, C.ink, 0.35)
      const box = (x: number, y: number, w: number, h: number, fill: string) => {
        wash(g, [[x - w / 2, y], [x + w / 2, y], [x + w / 2, y - h], [x - w / 2, y - h]], { fill, alpha: 1, jitter: 0.12, layers: 1, sharp: true, seed: Math.round(y * 10) })
        stroke(g, [[x - w / 2, y], [x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2, y]], { w: 0.6 * s, color: C.ink, press: 'even', alpha: 0.8 })
      }
      box(0, 0, 9 * s, 2.4 * s, st)
      box(0, -2.4 * s, 3.4 * s, 9 * s, st)
      box(0, -11.4 * s, 7 * s, 2 * s, st)
      box(0, -13.4 * s, 6 * s, 5.4 * s, dark)
      wash(g, [[-1.6 * s, -14.4 * s], [1.6 * s, -14.4 * s], [1.6 * s, -17.8 * s], [-1.6 * s, -17.8 * s]], { fill: '#f6d38a', alpha: 1, jitter: 0.05, layers: 1, sharp: true, seed: 5 })
      // mũ đèn: mái cong nhỏ + nụ đỉnh
      const cap: Pt[] = [[-7 * s, -18.4 * s], [7 * s, -18.4 * s], [3 * s, -21.4 * s], [-3 * s, -21.4 * s]]
      wash(g, cap, { fill: dark, alpha: 1, jitter: 0.1, layers: 1, seed: 6 })
      stroke(g, [[-7.6 * s, -17.6 * s], [-5 * s, -18.8 * s], [0, -21.6 * s], [5 * s, -18.8 * s], [7.6 * s, -17.6 * s]], { w: 0.9 * s, color: C.ink, press: 'even', alpha: 0.9 })
      blot(g, 0, -23 * s, 1.3 * s, dark, 1, 7, 1)
      moss(g, -3 * s, -1 * s, 2, 0.6 * s, 8)
      grain(g, 0.3)
      return [0, -16 * s]
    },
  }
}

// ---------- Bụi trúc ----------
export function bamboo(s = 1, seed = 1): Asset {
  return {
    x: -18 * s, y: -52 * s, w: 36 * s, h: 54 * s,
    draw(g) {
      const r = rng(seed)
      const stems = 4 + Math.floor(r() * 2)
      for (let i = 0; i < stems; i++) {
        const x = (i - stems / 2) * 4.2 * s + (r() - 0.5) * 2 * s
        const top = -(34 + r() * 16) * s
        const lean = (r() - 0.5) * 6 * s
        const tone = i % 2 ? C.malachiteD : mix(C.malachiteD, C.ink, 0.35)
        // thân chia đốt: mỗi đốt một nét, hở ở mắt đốt
        const joints = 5
        for (let k = 0; k < joints; k++) {
          const t0 = k / joints, t1 = (k + 0.92) / joints
          const p0: Pt = [x + lean * t0, lerp(1, top, t0)], p1: Pt = [x + lean * t1, lerp(1, top, t1)]
          stroke(g, [p0, p1], { w: 1.8 * s, color: tone, press: 'even', alpha: 0.95, rough: 0.2 })
          stroke(g, [[p1[0] - 1.2 * s, p1[1] + 0.4], [p1[0] + 1.2 * s, p1[1] + 0.4]], { w: 0.6 * s, color: C.ink, press: 'taper', alpha: 0.8 })
        }
        // lá trúc: nét đầu đinh đuôi chuột, mọc thành cụm chữ "个"
        for (let k = 0; k < 3; k++) {
          const t = 0.55 + k * 0.15, px = x + lean * t, py = lerp(1, top, t)
          for (let q = 0; q < 3; q++) {
            const a = -Math.PI / 2 + (q - 1) * 0.9 + (r() - 0.5) * 0.4 + (i % 2 ? 0.8 : -0.8)
            const l = (6 + r() * 4) * s
            stroke(g, [[px, py], [px + Math.cos(a) * l * 0.5, py + Math.sin(a) * l * 0.5 + 1], [px + Math.cos(a) * l, py + Math.sin(a) * l + 2]], {
              w: 1.8 * s, color: q ? C.ink : mix(C.malachiteD, C.ink, 0.5), press: 'nail', alpha: 0.85, seed: seed + i * 31 + k * 7 + q,
            })
          }
        }
      }
      tuft(g, 0, 1, 4 * s, seed + 9)
      grain(g, 0.3)
    },
  }
}
