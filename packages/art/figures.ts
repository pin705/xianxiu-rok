// Nhân vật vẽ tay: chân dung trưởng lão (bán thân, mắt khép như đang tĩnh toạ — lối 工笔 thu nhỏ).
// Khung 48 × 48 DU, cắt tròn. Nét mực đứt quãng như bút thật, mảng màu loang, hạt giấy.
import { blot, ellipse, grain, lerp, stroke, wash, type Asset, type G, type Pt, vgrad, linear } from './brush'
import { PIGMENT as C, mix, rgba, WHITE } from './palette'

export type Look = {
  id?: string // tên tranh vẽ tay thay thế (key 'face:<id>'), thường là mã trưởng lão
  robe: string
  trim: string
  hair: string
  style: 'bun' | 'long' | 'bald' | 'crown' | 'tied' | 'wild' // wild: tóc dựng như lửa
  beard?: 'long' | 'short'
  female?: boolean
  bg?: string
  mark?: string // ấn giữa trán
  brow?: 'sad' | 'fierce' | 'long' // mày chau buồn · mày xếch · mày dài bạc rủ (mặc định: mày thanh)
  hat?: string // nón lá (màu tre)
  band?: string // dải buộc trán
  sword?: string // chuôi kiếm nhô sau vai (màu tua)
  flower?: string // hoa cài tóc
}

const SKIN = '#f1d9bf'
// cung elip từ góc a0 tới a1 (k + 1 điểm, gồm cả hai đầu)
const arc = (cx: number, cy: number, rx: number, ry: number, k = 16, a0 = 0, a1 = Math.PI * 2): Pt[] =>
  Array.from({ length: k + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / k
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]
  })
// nét mực của hình người / thú (khác brush.line: nhận cả dãy điểm)
const inked = (g: G, pts: Pt[], w: number, color: string = C.ink, a = 0.9, press: 'taper' | 'nail' | 'even' | 'fade' = 'taper') =>
  stroke(g, pts, { w, color, press, alpha: a, rough: 0.25 })

export function portrait(look: Look): Asset {
  return {
    x: 0, y: 0, w: 48, h: 48,
    draw(g) {
      g.save()
      g.beginPath()
      g.arc(24, 24, 24, 0, Math.PI * 2)
      g.clip()
      // nền: lụa màu, sáng ở giữa
      const bg = look.bg ?? C.azuriteL
      const gr = g.createRadialGradient(24, 18, 2, 24, 24, 30)
      gr.addColorStop(0, mix(bg, C.silk, 0.75))
      gr.addColorStop(1, bg)
      g.fillStyle = gr
      g.fillRect(0, 0, 48, 48)
      // vầng mây mờ sau lưng
      wash(g, arc(24, 40, 26, 8, 14), { fill: C.silk, alpha: 0.25, jitter: 2, layers: 2, seed: 3 })

      const hair = look.hair
      const long = look.style === 'long' || (look.female && (look.style === 'crown' || look.style === 'bun'))
      if (long) wash(g, [[14.4, 17], [13, 30], [12.6, 40], [10.5, 49], [37.5, 49], [35.4, 40], [35, 30], [33.6, 17]], { fill: hair, alpha: 0.95, jitter: 0.5, layers: 2, seed: 5 })
      if (look.sword) {
        // chuôi kiếm đeo sau lưng nhô qua vai phải: cán quấn, đốc tròn, tua bay
        inked(g, [[34.4, 38], [39.6, 24.4]], 2.4, C.ink, 0.9, 'even')
        inked(g, [[34.4, 38], [39.6, 24.4]], 1.5, mix(C.lacquer2, C.ink3, 0.3), 1, 'even')
        for (let i = 0; i < 4; i++) inked(g, [[37.2 - i * 0.7, 29.4 + i * 1.9], [38.8 - i * 0.7, 30 + i * 1.9]], 0.4, C.ink3, 0.8, 'even')
        inked(g, [[34.4, 35.4], [39.2, 37.4]], 1.6, C.gold, 1, 'even') // chắn tay
        blot(g, 39.8, 23.8, 1.3, C.gold, 1, 24, 1)
        inked(g, [[40.2, 23.4], [43.4, 25.4], [44.6, 29.4]], 1, look.sword, 0.95, 'fade')
      }

      // áo: vai, cổ giao lĩnh, viền
      const robe: Pt[] = [[3, 49], [5.2, 41], [11, 36.4], [18, 34.2], [24, 34], [30, 34.2], [37, 36.4], [42.8, 41], [45, 49]]
      wash(g, robe, { fill: g2 => vgrad(g2, 34, 48, [[0, mix(look.robe, WHITE, 0.12)], [1, mix(look.robe, C.ink, 0.25)]]), alpha: 1, jitter: 0.4, layers: 2, seed: 7 })
      wash(g, [[18, 34.4], [24, 45.5], [30, 34.4], [27.4, 34], [24, 40], [20.6, 34]], { fill: C.silk, alpha: 1, jitter: 0.2, layers: 1, seed: 8 })
      inked(g, [[17.6, 34.4], [21, 40], [24, 45.6]], 1.6, look.trim, 1, 'even')
      inked(g, [[30.4, 34.4], [27, 40], [24, 45.6]], 1.6, look.trim, 1, 'even')
      inked(g, [[4.6, 45], [7, 39.6], [12, 36.2], [18, 34.3]], 1.2, C.ink, 0.85, 'nail')
      inked(g, [[43.4, 45], [41, 39.6], [36, 36.2], [30, 34.3]], 1.1, C.ink, 0.8, 'nail')
      inked(g, [[12.5, 41], [14, 46]], 0.7, C.ink, 0.45)
      inked(g, [[35.5, 41], [34, 46]], 0.7, C.ink, 0.45)

      // cổ, mặt
      wash(g, [[21.2, 28], [26.8, 28], [27.2, 35], [20.8, 35]], { fill: mix(SKIN, C.ochre, 0.15), alpha: 1, jitter: 0.2, layers: 1, sharp: true, seed: 9 })
      const face = arc(24, 22, 8, 9.6, 18)
      wash(g, face, { fill: SKIN, alpha: 1, jitter: 0.25, layers: 2, seed: 10 })
      wash(g, arc(24, 25, 6.5, 5, 12), { fill: C.cinnabarL, alpha: look.female ? 0.12 : 0.05, jitter: 0.6, layers: 2, seed: 11 })
      // viền má, cằm: nét đứt, không khép kín
      inked(g, arc(24, 22, 8, 9.6, 8, Math.PI * 0.1, Math.PI * 0.46), 0.8, C.ink, 0.7)
      inked(g, arc(24, 22, 8, 9.6, 8, Math.PI * 0.55, Math.PI * 0.92), 0.8, C.ink, 0.7)

      // tóc
      const cap: Pt[] = [[15.4, 22.5], [15, 16], [17.5, 11.5], [24, 9.6], [30.5, 11.5], [33, 16], [32.6, 22.5], [30.6, 17.4], [27, 15.2], [24, 15], [21, 15.2], [17.4, 17.4]]
      if (look.style === 'bald') {
        wash(g, [[15.6, 21.8], [15.6, 17.4], [17, 16.4], [17.3, 20]], { fill: hair, alpha: 0.9, jitter: 0.2, layers: 1, seed: 12 })
        wash(g, [[32.4, 21.8], [32.4, 17.4], [31, 16.4], [30.7, 20]], { fill: hair, alpha: 0.9, jitter: 0.2, layers: 1, seed: 13 })
        wash(g, arc(24, 16.5, 7.4, 5.5, 12, Math.PI, Math.PI * 2), { fill: SKIN, alpha: 1, jitter: 0.2, layers: 1, seed: 14 })
        inked(g, arc(24, 17, 7.8, 6.4, 10, Math.PI * 1.05, Math.PI * 1.95), 0.8, C.ink, 0.7)
        inked(g, [[19, 14.4], [24, 13], [29, 14.4]], 0.6, C.ink, 0.2)
      } else {
        wash(g, cap, { fill: hair, alpha: 1, jitter: 0.3, layers: 2, seed: 15 })
        for (let i = 0; i < 5; i++) inked(g, [[20 + i * 2, 10.4], [18.4 + i * 2.2, 13.4], [16.8 + i * 2.6, 17 + (i % 2)]], 0.45, mix(hair, WHITE, 0.25), 0.6)
        inked(g, cap.slice(0, 7), 0.8, C.ink, 0.75, 'nail')
        if (look.style === 'bun' || look.style === 'tied') {
          // búi tóc ngồi hẳn trên đỉnh đầu, trâm cài xuyên ngang búi
          wash(g, arc(24, 9.6, 5, 4, 12), { fill: hair, alpha: 1, jitter: 0.2, layers: 2, seed: 16 })
          inked(g, arc(24, 9.6, 5, 4, 12, Math.PI * 0.95, Math.PI * 2.05), 0.75, C.ink, 0.75)
          inked(g, [[18.6, 10.4], [29.4, 8.8]], 1.3, look.style === 'tied' ? look.trim : C.gold, 1, 'even')
          if (look.style === 'tied') inked(g, [[28.6, 10], [32.6, 12.4], [33.6, 16]], 1, look.trim, 0.9, 'fade')
        } else if (look.style === 'crown') {
          const cr: Pt[] = [[18, 11.8], [19.6, 6.4], [22, 9.4], [24, 5], [26, 9.4], [28.4, 6.4], [30, 11.8]]
          wash(g, cr, { fill: g2 => vgrad(g2, 5, 12, [[0, C.goldL], [1, C.gold]]), alpha: 1, jitter: 0.1, layers: 1, sharp: true, seed: 17 })
          inked(g, [...cr, cr[0]], 0.6, C.goldD, 1, 'even')
          blot(g, 24, 9.4, 1.1, look.trim, 1, 18, 1)
        } else if (look.style === 'long') {
          inked(g, [[24, 10.4], [19, 11.4], [16.4, 17.6]], 1.1, mix(hair, WHITE, 0.2), 0.5)
          if (look.female) {
            inked(g, [[29, 11.6], [34, 9]], 1.3, C.gold, 1, 'even')
            blot(g, 34.2, 8.8, 1.3, look.trim, 1, 19, 1)
          }
        } else if (look.style === 'wild') {
          // tóc dựng ngược như ngọn lửa hất về sau, ngọn ánh màu viền
          const top: Pt[] = [[15.2, 19.4], [13.4, 12], [17.4, 11.4], [16.6, 5], [20.8, 8.8], [21.8, 2], [24.6, 8], [27, 1.4], [28, 8.4], [31.8, 3.8], [31.4, 10.2], [36, 9.4], [32.8, 14.6], [33, 19.4]]
          const edge: Pt[] = [[30.6, 17.4], [27, 15.2], [24, 15], [21, 15.2], [17.4, 17.4]]
          wash(g, [...top, ...edge], { fill: g2 => vgrad(g2, 2, 14, [[0, mix(hair, look.trim, 0.55)], [1, hair]]), alpha: 1, jitter: 0.2, layers: 2, seed: 30 })
          inked(g, top, 0.8, C.ink, 0.8, 'nail')
          for (let i = 1; i < top.length - 2; i += 2) inked(g, [[lerp(top[i][0], top[i + 1][0], 0.5), top[i + 1][1] + 2.4], top[i]], 0.8, look.trim, 0.85, 'taper')
        }
      }
      if (look.band) {
        // dải buộc trán, hai đuôi bay sau gáy
        inked(g, [[15.6, 15.4], [20, 13.6], [24, 13.2], [28, 13.6], [32.4, 15.4]], 1.7, look.band, 1, 'even')
        inked(g, [[32.4, 15.2], [36, 15.6], [39.4, 19.6]], 1.2, look.band, 0.95, 'fade')
        inked(g, [[32.2, 16], [35, 18.6], [36.6, 23]], 0.9, look.band, 0.85, 'fade')
      }
      if (look.hat) {
        // nón lá: chóp thấp, vành rộng che trán, nan tre toả từ chóp, quai mảnh
        const hat: Pt[] = [[4.6, 16.4], [14, 11.6], [24, 3.8], [34, 11.6], [43.4, 16.4], [34, 16.8], [24, 16.2], [14, 16.8]]
        wash(g, hat, { fill: g2 => vgrad(g2, 4, 17, [[0, mix(look.hat!, WHITE, 0.25)], [1, mix(look.hat!, C.ink, 0.25)]]), alpha: 1, jitter: 0.25, layers: 2, seed: 34 })
        for (let i = 1; i < 8; i++) inked(g, [[24, 4.4], [lerp(6.4, 41.6, i / 8), 16.2]], 0.35, mix(look.hat, C.ink, 0.5), 0.55, 'taper')
        inked(g, [[4.6, 16.4], [14, 16.8], [24, 16.3], [34, 16.8], [43.4, 16.4]], 0.9, C.ink, 0.85, 'even')
        inked(g, [[4.6, 16.4], [14, 11.6], [24, 3.8], [34, 11.6], [43.4, 16.4]], 0.8, C.ink, 0.8, 'nail')
        inked(g, [[16.6, 17], [18.2, 26], [21, 30.6]], 0.4, C.ink2, 0.55, 'even')
        inked(g, [[31.4, 17], [29.8, 26], [27, 30.6]], 0.4, C.ink2, 0.55, 'even')
      }
      if (look.flower) {
        // đoá hoa cài bên tóc: năm cánh, nhuỵ vàng
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2
          blot(g, 16.4 + Math.cos(a) * 1.6, 12.4 + Math.sin(a) * 1.6, 1.3, look.flower, 1, 40 + i, 0.8, a)
        }
        blot(g, 16.4, 12.4, 0.8, C.goldL, 1, 45, 1)
        inked(g, [[18.2, 13.6], [20.8, 16.2]], 0.8, C.gold, 1, 'even') // chuỗi ngọc rủ
        blot(g, 21, 16.6, 0.6, look.trim, 1, 46, 1)
      }
      // mày, mắt khép, mũi, miệng
      if (look.style === 'bald' && look.beard === 'long') {
        inked(g, [[18.2, 19.6], [20.4, 17.9], [22.8, 19]], 1.3, hair, 1, 'nail')
        inked(g, [[29.8, 19.6], [27.6, 17.9], [25.2, 19]], 1.3, hair, 1, 'nail')
      } else if (look.brow === 'long') {
        // mày bạc dài rủ quá đuôi mắt
        inked(g, [[22.8, 18.8], [20.6, 18], [18.4, 18.8], [16.8, 21.8]], 1.35, hair, 1, 'nail')
        inked(g, [[25.2, 18.8], [27.4, 18], [29.6, 18.8], [31.2, 21.8]], 1.35, hair, 1, 'nail')
      } else if (look.brow === 'sad') {
        inked(g, [[22.6, 17.9], [20.8, 18.6], [18.9, 19.9]], 0.95, C.ink, 0.95, 'nail')
        inked(g, [[25.4, 17.9], [27.2, 18.6], [29.1, 19.9]], 0.95, C.ink, 0.95, 'nail')
        inked(g, [[22.4, 16.4], [24, 16.9], [25.6, 16.4]], 0.4, C.ink, 0.35) // nếp chau giữa mày
      } else if (look.brow === 'fierce') {
        inked(g, [[18.6, 17.7], [20.8, 18.3], [22.9, 19.2]], 1.2, C.ink, 1, 'nail')
        inked(g, [[29.4, 17.7], [27.2, 18.3], [25.1, 19.2]], 1.2, C.ink, 1, 'nail')
      } else {
        inked(g, [[19, 19.4], [20.8, 18.6], [22.7, 18.8]], 0.95, C.ink, 0.95, 'nail')
        inked(g, [[29, 19.4], [27.2, 18.6], [25.3, 18.8]], 0.95, C.ink, 0.95, 'nail')
      }
      inked(g, [[19.4, 22.2], [21.1, 23], [22.8, 22.2]], 0.7, C.ink, 0.9)
      inked(g, [[25.2, 22.2], [26.9, 23], [28.6, 22.2]], 0.7, C.ink, 0.9)
      inked(g, [[24.4, 23.2], [24.8, 25.2], [23.9, 25.6]], 0.5, C.ink, 0.5)
      if (look.female) wash(g, arc(24, 27.8, 1.5, 0.75, 10), { fill: C.cinnabar, alpha: 0.9, jitter: 0.1, layers: 1, seed: 20 })
      else inked(g, [[22.8, 27.8], [24, 28.2], [25.2, 27.8]], 0.6, C.ink, 0.6)
      if (look.beard === 'long') {
        const b: Pt[] = [[17.8, 25], [18.8, 30], [21, 33.8], [24, 40.5], [27, 33.8], [29.2, 30], [30.2, 25], [27.6, 28.6], [24, 28.8], [20.4, 28.6]]
        wash(g, b, { fill: hair, alpha: 0.95, jitter: 0.3, layers: 2, seed: 21 })
        for (let i = 0; i < 5; i++) inked(g, [[20 + i * 2, 29], [20.6 + i * 1.7, 33], [22 + i * 1, 37]], 0.4, mix(hair, C.ink, 0.35), 0.5)
        inked(g, [[21.4, 27], [24, 26], [26.6, 27]], 0.8, mix(hair, C.ink, 0.4), 0.8)
      } else if (look.beard === 'short') {
        wash(g, [[17.4, 24.4], [19, 30.4], [24, 31], [29, 30.4], [30.6, 24.4], [28.6, 27.8], [24, 28.2], [19.4, 27.8]], { fill: hair, alpha: 0.75, jitter: 0.3, layers: 2, seed: 22 })
      }
      if (look.mark) blot(g, 24, 17.4, 0.9, look.mark, 1, 23, 1.4)
      grain(g, 0.3)
      g.restore()
      // viền mực mảnh quanh khung tròn
      inked(g, arc(24, 24, 23.4, 23.4, 24, -Math.PI * 0.2, Math.PI * 1.5), 0.9, C.ink, 0.35, 'even')
    },
  }
}

// ---------- Quân trên sân trận (neo ở chân, cao ~20 DU) ----------
export type Troop = 'kiem' | 'phap' | 'the'
// màu theo hệ của quân ta ở bậc thường: áo, đai, cổ áo
const ROBE: Record<Troop, string> = { kiem: C.silk, phap: mix(C.azurite, C.silk, 0.15), the: C.silk }
const SASH: Record<Troop, string> = { kiem: C.azurite, phap: C.gold, the: C.ochre }
const COLLAR: Record<Troop, string> = { kiem: C.azuriteD, phap: C.silk, the: C.azuriteD }

// Đệ tử ra trận. foe: áo tối, đai son (quân địch). tier 1–3 cùng một dáng; 4 (Hạch tâm): giáp viền vàng, linh khí mờ
// quanh người; 5 (Thánh tử): áo trắng viền vàng, hào quang sau đầu
export function soldier(type: Troop, foe = false, tier = 1): Asset {
  const hi = tier >= 4
  return {
    x: -12, y: hi ? -30 : -24, w: 24, h: hi ? 32 : 26,
    draw(g) {
      const saint = tier >= 5 && !foe
      const robe = saint ? mix(C.silk, C.goldL, 0.22) : foe ? mix(C.lacquer2, C.ink2, 0.3) : ROBE[type]
      const sash = tier >= 5 || (hi && !foe) ? C.gold : foe ? C.cinnabar : SASH[type]
      const shade = saint ? mix(robe, C.goldD, 0.3) : mix(robe, C.ink, foe ? 0.3 : 0.2)
      const glow = foe ? C.cinnabarL : tier >= 5 ? C.goldL : C.spirit
      const ol = { color: C.ink, press: 'taper' as const, alpha: 0.9, rough: 0.3 }
      // nếp áo, đường cơ: nét mảnh đầu đinh, khô ở cuối
      const fold = (pts: Pt[], seed: number, a = 0.45) => stroke(g, pts, { ...ol, w: 0.42, press: 'nail', alpha: a, dry: 0.4, seed })
      if (hi) {
        // linh khí toả quanh người (bậc 5 sáng hơn), vài làn khí bốc lên
        const r = g.createRadialGradient(0, -11, 1, 0, -11, tier >= 5 ? 13 : 11)
        r.addColorStop(0, rgba(glow, tier >= 5 ? 0.55 : 0.32))
        r.addColorStop(1, rgba(glow, 0))
        g.fillStyle = r
        g.fillRect(-12, -26, 24, 28)
        for (const [x, sd] of [[-6.4, 50], [6.8, 51], [-3, 52]] as const)
          stroke(g, [[x, -2], [x + 0.8, -8], [x - 0.6, -13], [x + 0.4, -18]], { w: 0.9, color: glow, press: 'fade', alpha: 0.55, rough: 0.3, seed: sd })
      }
      blot(g, 0, 0.6, 6.5, C.ink, 0.18, 2, 0.3)
      if (type === 'the') {
        // thể tu: chân tấn, quần son, mình trần, nắm đấm; tay có viền mực (vẽ viền trước, da đè lên)
        const pants: Pt[] = [[-5, 0], [-3.4, -8], [3.4, -8], [5, 0], [1.6, 0], [0, -4], [-1.6, 0]]
        const cloth = saint ? robe : foe ? C.ink2 : C.ochre
        wash(g, pants, { fill: cloth, alpha: 1, jitter: 0.2, layers: 1, sharp: true, seed: 3 })
        wash(g, [[0.4, -8], [3.4, -8], [5, 0], [1.6, 0]], { fill: mix(cloth, C.ink, 0.3), alpha: 0.5, jitter: 0.1, layers: 1, sharp: true, seed: 20 })
        wash(g, [[-3.6, -8], [-3.2, -14.6], [3.2, -14.6], [3.6, -8]], { fill: SKIN, alpha: 1, jitter: 0.2, layers: 1, sharp: true, seed: 4 })
        wash(g, [[1.2, -14.6], [3.2, -14.6], [3.6, -8], [1.6, -8]], { fill: mix(SKIN, C.ochre, 0.35), alpha: 0.55, jitter: 0.1, layers: 1, sharp: true, seed: 21 })
        wash(g, [[-3.8, -8.8], [3.8, -8.8], [3.8, -7.4], [-3.8, -7.4]], { fill: sash, alpha: 1, jitter: 0.1, layers: 1, sharp: true, seed: 5 })
        for (const [arm, fist] of [[[[-3.2, -13.6], [-6.2, -11], [-6.8, -8]], [-6.8, -7.6]], [[[3.2, -13.6], [6.4, -14.6], [8, -17]], [8.2, -17.4]]] as [Pt[], Pt][]) {
          stroke(g, arm, { ...ol, w: 2.3, alpha: 0.85 })
          stroke(g, arm, { ...ol, w: 1.5, color: SKIN, alpha: 1 })
          blot(g, fist[0], fist[1], 1.75, C.ink, 0.85, 6 + fist[0], 1)
          blot(g, fist[0], fist[1], 1.35, SKIN, 1, 7 + fist[0], 1)
        }
        fold([[-2.3, -13.1], [-1.2, -12.3], [-0.3, -12.5]], 22, 0.5)
        fold([[2.3, -13.1], [1.2, -12.3], [0.3, -12.5]], 23, 0.5)
        fold([[0, -11.8], [0.1, -10.4], [0, -9.3]], 24, 0.35)
        fold([[-2.4, -6.6], [-2.9, -3.6], [-3.6, -0.8]], 25)
        fold([[2.4, -6.6], [3, -3.2], [3.8, -0.8]], 26)
        stroke(g, [[-3.2, -14.6], [-3.4, -8], [-5, 0]], { ...ol, w: 0.6, press: 'nail', dry: 0.25 })
        stroke(g, [[3.2, -14.6], [3.4, -8], [5, 0]], { ...ol, w: 1, press: 'nail', dry: 0.25 })
        stroke(g, [[-1.6, 0], [0, -4], [1.6, 0]], { ...ol, w: 0.5, press: 'even', alpha: 0.7 })
        if (hi) {
          // hộ uyển vàng ở cổ tay, giáp vai trái viền vàng
          for (const [x, y] of [[-6.6, -9.2], [7.4, -15.8]] as const) blot(g, x, y, 1.15, C.gold, 1, 53 + x, 0.7, 0.9)
          const pad: Pt[] = [[-4.6, -13.2], [-4.2, -15.6], [-1.6, -15.4], [-1.2, -13.8]]
          wash(g, pad, { fill: tier >= 5 ? C.silk : mix(C.ink2, C.indigo, 0.4), alpha: 1, jitter: 0.1, layers: 1, seed: 54 })
          stroke(g, [...pad, pad[0]], { w: 0.5, color: C.gold, press: 'even', alpha: 1 })
        }
      } else {
        // kiếm tu / pháp tu: áo dài giao lĩnh, vạt áo bị gió thổi lệch sang trái, dải đai bay (飘带)
        const hem = type === 'phap' ? 6 : 4.4, sway = 0.9
        const L: Pt = [-hem - sway, 0.2], R: Pt = [hem - sway * 0.4, -0.2]
        wash(g, [L, [-3.4, -9], [-3, -14.8], [3, -14.8], [3.4, -9], R], { fill: robe, alpha: 1, jitter: 0.2, layers: 2, seed: 8 })
        wash(g, [[0.8, -14.8], [3, -14.8], [3.4, -9], R, [1.4, 0.1]], { fill: shade, alpha: 0.55, jitter: 0.15, layers: 1, seed: 16 }) // bóng khối: sáng từ trái
        wash(g, [[-3.3, -10], [3.3, -10], [3.3, -8.8], [-3.3, -8.8]], { fill: sash, alpha: 1, jitter: 0.1, layers: 1, sharp: true, seed: 9 })
        stroke(g, [[-1.8, -9.4], [-4.4, -8.4], [-6.8, -9.2], [-8.8, -8]], { w: 0.95, color: sash, press: 'fade', alpha: 0.95, rough: 0.3, seed: 18 })
        stroke(g, [[-1.4, -9], [-3.6, -6.8], [-6, -6.6], [-7.2, -5.4]], { w: 0.7, color: sash, press: 'fade', alpha: 0.85, rough: 0.3, seed: 19 })
        // cổ áo: vạt trái đè vạt phải
        const collar = tier >= 5 ? C.gold : foe ? C.ink : COLLAR[type]
        stroke(g, [[-2.3, -14.8], [0.3, -12.3], [1.5, -10]], { w: 0.75, color: collar, press: 'taper', alpha: 0.9, seed: 17 })
        stroke(g, [[2.3, -14.8], [0.9, -13.1]], { w: 0.5, color: collar, press: 'taper', alpha: 0.8, seed: 27 })
        fold([[-1.2, -8.6], [-1.9, -4.4], [-3, -0.6]], 28)
        fold([[1.4, -8.6], [1.8, -4.2], [2.1, -0.4]], 29)
        if (type === 'phap') fold([[-3, -6.8], [-4.2, -3], [-5.4, -0.2]], 30, 0.35)
        stroke(g, [[-3, -14.8], [-3.4, -9], L], { ...ol, w: 0.6, press: 'nail', dry: 0.3, seed: 31 })
        stroke(g, [[3, -14.8], [3.4, -9], R], { ...ol, w: 1, press: 'nail', dry: 0.3, seed: 32 })
        stroke(g, [[L[0] + 0.6, 0.2], [0, 0.5], [R[0] - 0.6, 0]], { ...ol, w: 0.6, press: 'even', seed: 33 })
        if (hi) {
          // vạt áo viền vàng; bậc 4: giáp ngực lá vảy + giáp vai, viền vàng
          stroke(g, [[L[0] + 0.8, -0.3], [0, 0], [R[0] - 0.8, -0.4]], { w: 0.55, color: C.gold, press: 'even', alpha: 1, seed: 55 })
          if (tier === 4) {
            const plate: Pt[] = [[-3.1, -14.2], [3.1, -14.2], [3.3, -10.1], [-3.3, -10.1]]
            wash(g, plate, { fill: foe ? C.ink2 : mix(C.ink2, C.indigo, 0.45), alpha: 1, jitter: 0.1, layers: 1, sharp: true, seed: 56 })
            for (const y of [-12.8, -11.4]) stroke(g, [[-3, y], [3, y]], { w: 0.3, color: C.ink, press: 'even', alpha: 0.7 })
            stroke(g, [[-3.1, -14.2], [0, -12.9], [3.1, -14.2]], { w: 0.55, color: C.gold, press: 'even', alpha: 1, seed: 57 })
            for (const s of [-1, 1]) {
              const pad: Pt[] = [[s * 1.8, -15.4], [s * 4.4, -15], [s * 4.8, -12.6], [s * 2.8, -13.2]]
              wash(g, pad, { fill: foe ? C.ink2 : mix(C.ink2, C.indigo, 0.45), alpha: 1, jitter: 0.1, layers: 1, seed: 58 + s })
              stroke(g, pad.slice(1), { w: 0.5, color: C.gold, press: 'even', alpha: 1, seed: 59 + s })
            }
          }
        }
        if (type === 'kiem') {
          // tay áo chéo lên cầm kiếm
          const sleeve: Pt[] = [[2.4, -14.2], [5.6, -14], [7, -12.6], [3.2, -11.6]]
          wash(g, sleeve, { fill: robe, alpha: 1, jitter: 0.1, layers: 1, seed: 34 })
          wash(g, sleeve.slice(1).concat([[4.4, -12.2]]), { fill: shade, alpha: 0.45, jitter: 0.1, layers: 1, seed: 35 })
          stroke(g, [[2.4, -14.2], [5.6, -14], [7, -12.6], [3.2, -11.6]], { ...ol, w: 0.55, press: 'nail', seed: 36 })
          blot(g, 6.6, -13.6, 0.9, SKIN, 1, 37, 1)
          stroke(g, [[6.2, -13.8], [11.4, -22.4]], { w: 1, color: mix(C.silk, C.ink3, 0.25), press: 'even', alpha: 1 })
          stroke(g, [[6.2, -13.8], [11.4, -22.4]], { w: 0.35, color: C.ink, press: 'even', alpha: 0.6 })
          stroke(g, [[5, -14.9], [7.6, -12.9]], { w: 0.9, color: C.gold, press: 'even', alpha: 1 })
        } else {
          // tay áo rộng, quả cầu pháp lực
          wash(g, [[2.6, -13.6], [7.2, -11.8], [6.4, -9.2], [2.8, -10.6]], { fill: robe, alpha: 1, jitter: 0.1, layers: 1, seed: 10 })
          wash(g, [[4.6, -12.6], [7.2, -11.8], [6.4, -9.2], [4.2, -10]], { fill: shade, alpha: 0.45, jitter: 0.1, layers: 1, seed: 38 })
          stroke(g, [[2.6, -13.6], [7.2, -11.8], [6.4, -9.2]], { ...ol, w: 0.7, press: 'nail', seed: 39 })
          blot(g, 8.4, -12.8, 3.2, foe ? C.cinnabarL : C.spirit, 0.35, 11, 1)
          blot(g, 8.4, -12.8, 1.6, foe ? C.cinnabarL : C.spirit, 1, 12, 1)
        }
      }
      // đầu: mặt, mắt (hai nét mực nhỏ), tóc búi
      blot(g, 0, -17.2, 2.6, SKIN, 1, 13, 1.05)
      stroke(g, [[-2.5, -16.6], [-2, -15], [0, -14.6], [2, -15], [2.5, -16.6]], { ...ol, w: 0.5, alpha: 0.7 })
      stroke(g, [[-1.75, -17], [-1.1, -16.55], [-0.45, -16.6]], { w: 0.55, color: C.ink, press: 'taper', alpha: 1, rough: 0.2, seed: 40 })
      stroke(g, [[0.45, -16.6], [1.1, -16.55], [1.75, -17]], { w: 0.55, color: C.ink, press: 'taper', alpha: 1, rough: 0.2, seed: 41 })
      wash(g, [[-2.7, -17.4], [-2.2, -19.4], [0, -20.1], [2.2, -19.4], [2.7, -17.4], [1.2, -18.4], [-1.2, -18.4]], { fill: C.ink, alpha: 1, jitter: 0.1, layers: 1, seed: 14 })
      blot(g, 0, -20.6, 1.3, C.ink, 1, 15, 1)
      if (foe) stroke(g, [[-2.6, -18.9], [0, -19.5], [2.6, -18.9], [4.2, -17.4]], { w: 0.8, color: C.cinnabar, press: 'even', alpha: 1 })
      if (hi) stroke(g, [[-1.4, -21.1], [1.6, -20.3]], { w: 0.7, color: C.gold, press: 'even', alpha: 1 }) // trâm vàng
      if (tier >= 5) {
        // hào quang: vòng vàng sau đầu, tia ngắn toả ra
        const halo = foe ? C.cinnabar : C.gold
        stroke(g, arc(0, -18.4, 5, 5, 20, -Math.PI * 1.05, Math.PI * 0.05), { w: 0.9, color: halo, press: 'taper', alpha: 0.95, rough: 0.2, seed: 60 })
        for (let i = 0; i < 9; i++) {
          const a = -Math.PI * (0.08 + (i / 8) * 0.84)
          stroke(g, [[Math.cos(a) * 6.2, -18.4 + Math.sin(a) * 6.2], [Math.cos(a) * (i % 2 ? 7.6 : 8.8), -18.4 + Math.sin(a) * (i % 2 ? 7.6 : 8.8)]], { w: 0.6, color: i % 2 ? glow : halo, press: 'taper', alpha: 0.85, seed: 61 + i })
        }
      }
      grain(g, 0.25)
    },
  }
}

// Yêu thú (neo ở chân, nhìn sang phải): sói — kiếm, hồ ly — pháp, gấu — thể. Vẽ từng phần: thân, đầu, tai, bốn chân, đuôi.
export function beast(type: Troop, tint: string = C.ochre): Asset {
  const P = {
    kiem: { body: [-4, -11, 12, 5.5], head: [11, -16, 4.6, 3.8], snout: 6, ear: 3.4, leg: 9, tail: 'brush' },
    phap: { body: [-2, -10, 10, 4.5], head: [10.5, -14.5, 4, 3.4], snout: 6, ear: 4, leg: 7.5, tail: 'fan' },
    the: { body: [-5, -12, 14, 8.5], head: [11.5, -13.5, 5.8, 5.2], snout: 2.6, ear: 2.4, leg: 6.5, tail: 'stub' },
  }[type]
  return {
    x: -32, y: -30, w: 60, h: 32,
    draw(g) {
      const fur = mix(tint, C.ink, 0.3), dark = mix(tint, C.ink, 0.65), light = mix(tint, C.silk, 0.45)
      const ink = { color: C.ink, alpha: 0.95, rough: 0.45 }
      const [bx, by, bw, bh] = P.body
      const [hx, hy, hw, hh] = P.head
      blot(g, 1, 0.6, bw * 1.3, C.ink, 0.18, 4, 0.22)
      const oval = (x: number, y: number, rx: number, ry: number, k = 14) => ellipse(x, y, rx, ry, k)
      const legs = (xs: number[], near: boolean) =>
        xs.forEach(x => {
          stroke(g, [[x, by + bh * 0.2], [x + 0.4, (by + bh * 0.2) / 2], [x + 1, -0.3]], { ...ink, w: type === 'the' ? 4.8 : 2.8, color: near ? dark : mix(dark, C.ink, 0.4), press: type === 'the' ? 'even' : 'nail' })
          if (type === 'the') blot(g, x + 1.8, -0.6, 2.2, near ? dark : mix(dark, C.ink, 0.4), 1, 30 + x, 0.55) // bàn chân gấu
        })
      // chân phía xa (tối hơn), đuôi
      legs([bx - bw * 0.55, bx + bw * 0.6], false)
      if (P.tail === 'brush') wash(g, [[bx - bw * 0.9, by - 1], [bx - bw - 7, by + 2], [bx - bw - 10, by + 7], [bx - bw - 4, by + 4], [bx - bw * 0.8, by + 2]], { fill: fur, alpha: 1, jitter: 0.4, layers: 2, seed: 3 })
      if (P.tail === 'fan') for (const [dx, dy, sd] of [[-15, -10, 5], [-18, -4, 6], [-13, -16, 7]] as const)
        wash(g, [[bx - bw * 0.7, by - 1], [bx + dx + 3, by + dy + 4], [bx + dx, by + dy], [bx + dx - 4, by + dy + 3], [bx - bw * 0.8, by + 2]], { fill: g2 => linear(g2, bx, by, bx + dx, by + dy, [[0, fur], [1, light]]), alpha: 1, jitter: 0.3, layers: 2, seed: sd })
      // thân
      wash(g, oval(bx, by, bw, bh), { fill: g2 => vgrad(g2, by - bh, by + bh, [[0, fur], [1, dark]]), alpha: 1, jitter: 0.4, layers: 3, seed: 8 })
      if (type === 'the') wash(g, oval(bx + bw * 0.3, by - bh * 0.55, bw * 0.55, bh * 0.5), { fill: fur, alpha: 1, jitter: 0.3, layers: 2, seed: 9 }) // u vai gấu
      // cổ nối thân với đầu, rồi đầu, mõm, tai
      wash(g, [[bx + bw * 0.55, by - bh * 0.85], [hx - hw * 0.5, hy - hh * 0.7], [hx - hw * 0.2, hy + hh * 0.9], [bx + bw * 0.9, by + bh * 0.2]], { fill: fur, alpha: 1, jitter: 0.3, layers: 2, seed: 16 })
      if (type === 'the')
        for (const dx of [-hw * 0.55, hw * 0.25]) {
          blot(g, hx + dx, hy - hh * 0.95, 2.4, dark, 1, 12 + dx, 1)
          blot(g, hx + dx + 0.2, hy - hh * 1.0, 1, light, 0.7, 13 + dx, 1)
          stroke(g, oval(hx + dx, hy - hh * 0.95, 2.4, 2.4, 12).slice(5, 12), { ...ink, w: 0.8, press: 'even', alpha: 0.8 })
        }
      wash(g, oval(hx, hy, hw, hh), { fill: fur, alpha: 1, jitter: 0.3, layers: 2, seed: 10 })
      if (type === 'the') {
        // gấu: mõm tròn ngắn sáng màu, mũi đen
        wash(g, oval(hx + hw * 0.85, hy + hh * 0.3, 3.4, 2.6), { fill: light, alpha: 1, jitter: 0.2, layers: 2, seed: 11 })
        blot(g, hx + hw * 0.85 + 3, hy + hh * 0.05, 1.3, C.ink, 1, 14, 0.8)
      } else {
        wash(g, [[hx + hw * 0.4, hy - hh * 0.5], [hx + hw + P.snout, hy + hh * 0.2], [hx + hw + P.snout - 1, hy + hh * 0.6], [hx + hw * 0.3, hy + hh * 0.8]], { fill: light, alpha: 1, jitter: 0.2, layers: 2, seed: 11 })
        for (const dx of [-hw * 0.35, hw * 0.25]) wash(g, [[hx + dx - 1.6, hy - hh * 0.7], [hx + dx + 0.6, hy - hh - P.ear], [hx + dx + 2, hy - hh * 0.6]], { fill: dark, alpha: 1, jitter: 0.1, layers: 1, sharp: true, seed: 12 + dx })
        blot(g, hx + hw + P.snout - 0.6, hy + hh * 0.3, 1, C.ink, 1, 14, 1)
      }
      // viền mực: lưng, bụng, đầu
      stroke(g, oval(bx, by, bw, bh, 20).slice(10, 21), { ...ink, w: 1.3, press: 'nail', dry: 0.3 })
      stroke(g, oval(bx, by, bw, bh, 20).slice(1, 9), { ...ink, w: 0.9, press: 'taper', alpha: 0.7 })
      if (type !== 'the') stroke(g, [[hx - hw * 0.8, hy - hh * 0.2], [hx - hw * 0.3, hy - hh], [hx + hw * 0.5, hy - hh * 0.8], [hx + hw + P.snout, hy + hh * 0.2]], { ...ink, w: 1.1, press: 'taper' })
      else stroke(g, oval(hx, hy, hw, hh, 16).slice(9, 16), { ...ink, w: 1.1, press: 'taper' })
      // lông: nét khô ngắn dọc lưng (gấu: bờm xù ở bụng)
      for (let i = 0; i < 7; i++) {
        const x = bx - bw * 0.7 + (i / 6) * bw * 1.4
        if (type === 'the') stroke(g, [[x, by + bh * 0.8], [x - 0.8, by + bh * 1.15]], { w: 1, color: dark, press: 'taper', alpha: 0.8 })
        else stroke(g, [[x, by - bh * 0.95], [x + 1.6, by - bh * 0.55]], { w: 0.8, color: C.ink, press: 'taper', alpha: 0.45 })
      }
      // chân phía gần, mắt sáng
      legs([bx - bw * 0.3, bx + bw * 0.8], true)
      blot(g, hx + hw * 0.35, hy - hh * 0.15, 2, '#ffe07a', 0.4, 23, 1)
      blot(g, hx + hw * 0.35, hy - hh * 0.15, 0.8, '#fff6c8', 1, 24, 1)
      grain(g, 0.3)
    },
  }
}
