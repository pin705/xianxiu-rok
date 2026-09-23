// Nhân vật vẽ tay: chân dung trưởng lão (bán thân, mắt khép như đang tĩnh toạ — lối 工笔 thu nhỏ).
// Khung 48 × 48 DU, cắt tròn. Nét mực đứt quãng như bút thật, mảng màu loang, hạt giấy.
import { blot, grain, stroke, wash, type Asset, type G, type Pt } from './brush'
import { PIGMENT as C, mix } from './palette'

export type Look = {
  robe: string
  trim: string
  hair: string
  style: 'bun' | 'long' | 'bald' | 'crown' | 'tied'
  beard?: 'long' | 'short'
  female?: boolean
  bg?: string
  mark?: string // ấn giữa trán
}

const SKIN = '#f1d9bf'
const ring = (cx: number, cy: number, rx: number, ry: number, k = 16, a0 = 0, a1 = Math.PI * 2): Pt[] =>
  Array.from({ length: k + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / k
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]
  })
const line = (g: G, pts: Pt[], w: number, color: string = C.ink, a = 0.9, press: 'taper' | 'nail' | 'even' | 'fade' = 'taper') =>
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
      wash(g, ring(24, 40, 26, 8, 14), { fill: C.silk, alpha: 0.25, jitter: 2, layers: 2, seed: 3 })

      const hair = look.hair
      const long = look.style === 'long' || (look.female && look.style === 'crown')
      if (long) wash(g, [[14.4, 17], [13, 30], [12.6, 40], [10.5, 49], [37.5, 49], [35.4, 40], [35, 30], [33.6, 17]], { fill: hair, alpha: 0.95, jitter: 0.5, layers: 2, seed: 5 })

      // áo: vai, cổ giao lĩnh, viền
      const robe: Pt[] = [[3, 49], [5.2, 41], [11, 36.4], [18, 34.2], [24, 34], [30, 34.2], [37, 36.4], [42.8, 41], [45, 49]]
      wash(g, robe, { fill: g2 => { const r = g2.createLinearGradient(0, 34, 0, 48); r.addColorStop(0, mix(look.robe, '#ffffff', 0.12)); r.addColorStop(1, mix(look.robe, C.ink, 0.25)); return r }, alpha: 1, jitter: 0.4, layers: 2, seed: 7 })
      wash(g, [[18, 34.4], [24, 45.5], [30, 34.4], [27.4, 34], [24, 40], [20.6, 34]], { fill: C.silk, alpha: 1, jitter: 0.2, layers: 1, seed: 8 })
      line(g, [[17.6, 34.4], [21, 40], [24, 45.6]], 1.6, look.trim, 1, 'even')
      line(g, [[30.4, 34.4], [27, 40], [24, 45.6]], 1.6, look.trim, 1, 'even')
      line(g, [[4.6, 45], [7, 39.6], [12, 36.2], [18, 34.3]], 1.2, C.ink, 0.85, 'nail')
      line(g, [[43.4, 45], [41, 39.6], [36, 36.2], [30, 34.3]], 1.1, C.ink, 0.8, 'nail')
      line(g, [[12.5, 41], [14, 46]], 0.7, C.ink, 0.45)
      line(g, [[35.5, 41], [34, 46]], 0.7, C.ink, 0.45)

      // cổ, mặt
      wash(g, [[21.2, 28], [26.8, 28], [27.2, 35], [20.8, 35]], { fill: mix(SKIN, C.ochre, 0.15), alpha: 1, jitter: 0.2, layers: 1, sharp: true, seed: 9 })
      const face = ring(24, 22, 8, 9.6, 18)
      wash(g, face, { fill: SKIN, alpha: 1, jitter: 0.25, layers: 2, seed: 10 })
      wash(g, ring(24, 25, 6.5, 5, 12), { fill: C.cinnabarL, alpha: look.female ? 0.12 : 0.05, jitter: 0.6, layers: 2, seed: 11 })
      // viền má, cằm: nét đứt, không khép kín
      line(g, ring(24, 22, 8, 9.6, 8, Math.PI * 0.1, Math.PI * 0.46), 0.8, C.ink, 0.7)
      line(g, ring(24, 22, 8, 9.6, 8, Math.PI * 0.55, Math.PI * 0.92), 0.8, C.ink, 0.7)

      // tóc
      const cap: Pt[] = [[15.4, 22.5], [15, 16], [17.5, 11.5], [24, 9.6], [30.5, 11.5], [33, 16], [32.6, 22.5], [30.6, 17.4], [27, 15.2], [24, 15], [21, 15.2], [17.4, 17.4]]
      if (look.style === 'bald') {
        wash(g, [[15.6, 21.8], [15.6, 17.4], [17, 16.4], [17.3, 20]], { fill: hair, alpha: 0.9, jitter: 0.2, layers: 1, seed: 12 })
        wash(g, [[32.4, 21.8], [32.4, 17.4], [31, 16.4], [30.7, 20]], { fill: hair, alpha: 0.9, jitter: 0.2, layers: 1, seed: 13 })
        wash(g, ring(24, 16.5, 7.4, 5.5, 12, Math.PI, Math.PI * 2), { fill: SKIN, alpha: 1, jitter: 0.2, layers: 1, seed: 14 })
        line(g, ring(24, 17, 7.8, 6.4, 10, Math.PI * 1.05, Math.PI * 1.95), 0.8, C.ink, 0.7)
        line(g, [[19, 14.4], [24, 13], [29, 14.4]], 0.6, C.ink, 0.2)
      } else {
        wash(g, cap, { fill: hair, alpha: 1, jitter: 0.3, layers: 2, seed: 15 })
        for (let i = 0; i < 5; i++) line(g, [[20 + i * 2, 10.4], [18.4 + i * 2.2, 13.4], [16.8 + i * 2.6, 17 + (i % 2)]], 0.45, mix(hair, '#ffffff', 0.25), 0.6)
        line(g, cap.slice(0, 7), 0.8, C.ink, 0.75, 'nail')
        if (look.style === 'bun' || look.style === 'tied') {
          // búi tóc ngồi hẳn trên đỉnh đầu, trâm cài xuyên ngang búi
          wash(g, ring(24, 9.6, 5, 4, 12), { fill: hair, alpha: 1, jitter: 0.2, layers: 2, seed: 16 })
          line(g, ring(24, 9.6, 5, 4, 12, Math.PI * 0.95, Math.PI * 2.05), 0.75, C.ink, 0.75)
          line(g, [[18.6, 10.4], [29.4, 8.8]], 1.3, look.style === 'tied' ? look.trim : C.gold, 1, 'even')
          if (look.style === 'tied') line(g, [[28.6, 10], [32.6, 12.4], [33.6, 16]], 1, look.trim, 0.9, 'fade')
        } else if (look.style === 'crown') {
          const cr: Pt[] = [[18, 11.8], [19.6, 6.4], [22, 9.4], [24, 5], [26, 9.4], [28.4, 6.4], [30, 11.8]]
          wash(g, cr, { fill: g2 => { const r = g2.createLinearGradient(0, 5, 0, 12); r.addColorStop(0, C.goldL); r.addColorStop(1, C.gold); return r }, alpha: 1, jitter: 0.1, layers: 1, sharp: true, seed: 17 })
          line(g, [...cr, cr[0]], 0.6, C.goldD, 1, 'even')
          blot(g, 24, 9.4, 1.1, look.trim, 1, 18, 1)
        } else if (look.style === 'long') {
          line(g, [[24, 10.4], [19, 11.4], [16.4, 17.6]], 1.1, mix(hair, '#ffffff', 0.2), 0.5)
          if (look.female) {
            line(g, [[29, 11.6], [34, 9]], 1.3, C.gold, 1, 'even')
            blot(g, 34.2, 8.8, 1.3, look.trim, 1, 19, 1)
          }
        }
      }
      // mày, mắt khép, mũi, miệng
      if (look.style === 'bald' && look.beard === 'long') {
        line(g, [[18.2, 19.6], [20.4, 17.9], [22.8, 19]], 1.3, hair, 1, 'nail')
        line(g, [[29.8, 19.6], [27.6, 17.9], [25.2, 19]], 1.3, hair, 1, 'nail')
      } else {
        line(g, [[19, 19.4], [20.8, 18.6], [22.7, 18.8]], 0.95, C.ink, 0.95, 'nail')
        line(g, [[29, 19.4], [27.2, 18.6], [25.3, 18.8]], 0.95, C.ink, 0.95, 'nail')
      }
      line(g, [[19.4, 22.2], [21.1, 23], [22.8, 22.2]], 0.7, C.ink, 0.9)
      line(g, [[25.2, 22.2], [26.9, 23], [28.6, 22.2]], 0.7, C.ink, 0.9)
      line(g, [[24.4, 23.2], [24.8, 25.2], [23.9, 25.6]], 0.5, C.ink, 0.5)
      if (look.female) wash(g, ring(24, 27.8, 1.5, 0.75, 10), { fill: C.cinnabar, alpha: 0.9, jitter: 0.1, layers: 1, seed: 20 })
      else line(g, [[22.8, 27.8], [24, 28.2], [25.2, 27.8]], 0.6, C.ink, 0.6)
      if (look.beard === 'long') {
        const b: Pt[] = [[17.8, 25], [18.8, 30], [21, 33.8], [24, 40.5], [27, 33.8], [29.2, 30], [30.2, 25], [27.6, 28.6], [24, 28.8], [20.4, 28.6]]
        wash(g, b, { fill: hair, alpha: 0.95, jitter: 0.3, layers: 2, seed: 21 })
        for (let i = 0; i < 5; i++) line(g, [[20 + i * 2, 29], [20.6 + i * 1.7, 33], [22 + i * 1, 37]], 0.4, mix(hair, C.ink, 0.35), 0.5)
        line(g, [[21.4, 27], [24, 26], [26.6, 27]], 0.8, mix(hair, C.ink, 0.4), 0.8)
      } else if (look.beard === 'short') {
        wash(g, [[17.4, 24.4], [19, 30.4], [24, 31], [29, 30.4], [30.6, 24.4], [28.6, 27.8], [24, 28.2], [19.4, 27.8]], { fill: hair, alpha: 0.75, jitter: 0.3, layers: 2, seed: 22 })
      }
      if (look.mark) blot(g, 24, 17.4, 0.9, look.mark, 1, 23, 1.4)
      grain(g, 0.3)
      g.restore()
      // viền mực mảnh quanh khung tròn
      line(g, ring(24, 24, 23.4, 23.4, 24, -Math.PI * 0.2, Math.PI * 1.5), 0.9, C.ink, 0.35, 'even')
    },
  }
}

// ---------- Quân trên sân trận (neo ở chân, cao ~20 DU) ----------
export type Troop = 'kiem' | 'phap' | 'the'

// Đệ tử ra trận. foe: áo tối, đai son (quân địch)
export function soldier(type: Troop, foe = false): Asset {
  return {
    x: -12, y: -24, w: 24, h: 26,
    draw(g) {
      const robe = foe ? mix(C.lacquer2, C.ink2, 0.3) : type === 'phap' ? mix(C.azurite, C.silk, 0.15) : C.silk
      const sash = foe ? C.cinnabar : type === 'kiem' ? C.azurite : type === 'phap' ? C.gold : C.ochre
      const ol = { color: C.ink, press: 'taper' as const, alpha: 0.9, rough: 0.3 }
      blot(g, 0, 0.6, 6.5, C.ink, 0.18, 2, 0.3)
      if (type === 'the') {
        // thể tu: chân tấn, quần son, mình trần, nắm đấm
        wash(g, [[-5, 0], [-3.4, -8], [3.4, -8], [5, 0], [1.6, 0], [0, -4], [-1.6, 0]], { fill: foe ? C.ink2 : C.ochre, alpha: 1, jitter: 0.2, layers: 1, sharp: true, seed: 3 })
        wash(g, [[-3.6, -8], [-3.2, -14.6], [3.2, -14.6], [3.6, -8]], { fill: SKIN, alpha: 1, jitter: 0.2, layers: 1, sharp: true, seed: 4 })
        wash(g, [[-3.8, -8.8], [3.8, -8.8], [3.8, -7.4], [-3.8, -7.4]], { fill: sash, alpha: 1, jitter: 0.1, layers: 1, sharp: true, seed: 5 })
        stroke(g, [[-3.2, -13.6], [-6.2, -11], [-6.8, -8]], { ...ol, w: 1.6, color: SKIN, alpha: 1 })
        stroke(g, [[3.2, -13.6], [6.4, -14.6], [8, -17]], { ...ol, w: 1.6, color: SKIN, alpha: 1 })
        blot(g, -6.8, -7.6, 1.4, SKIN, 1, 6, 1)
        blot(g, 8.2, -17.4, 1.4, SKIN, 1, 7, 1)
        stroke(g, [[-5, 0], [-3.4, -8], [-3.2, -14.6]], { ...ol, w: 0.8 })
        stroke(g, [[5, 0], [3.4, -8], [3.2, -14.6]], { ...ol, w: 0.8 })
      } else {
        // kiếm tu / pháp tu: áo dài
        const hem = type === 'phap' ? 6 : 4.4
        const body: Pt[] = [[-hem, 0], [-3.4, -9], [-3, -14.8], [3, -14.8], [3.4, -9], [hem, 0]]
        wash(g, body, { fill: robe, alpha: 1, jitter: 0.2, layers: 2, seed: 8 })
        wash(g, [[-3.3, -10], [3.3, -10], [3.3, -8.8], [-3.3, -8.8]], { fill: sash, alpha: 1, jitter: 0.1, layers: 1, sharp: true, seed: 9 })
        stroke(g, [[-hem, 0], [-3.4, -9], [-3, -14.8]], { ...ol, w: 0.8 })
        stroke(g, [[hem, 0], [3.4, -9], [3, -14.8]], { ...ol, w: 0.8 })
        stroke(g, [[-hem + 0.6, 0.2], [hem - 0.6, 0.2]], { ...ol, w: 0.7, press: 'even' })
        if (type === 'kiem') {
          // tay cầm kiếm giơ chéo
          stroke(g, [[2.6, -13.4], [5.2, -12.4], [6.6, -14.4]], { ...ol, w: 1.3, color: robe, alpha: 1 })
          stroke(g, [[6.2, -13.8], [11.4, -22.4]], { w: 1, color: mix(C.silk, C.ink3, 0.25), press: 'even', alpha: 1 })
          stroke(g, [[6.2, -13.8], [11.4, -22.4]], { w: 0.35, color: C.ink, press: 'even', alpha: 0.6 })
          stroke(g, [[5, -14.9], [7.6, -12.9]], { w: 0.9, color: C.gold, press: 'even', alpha: 1 })
        } else {
          // tay áo rộng, quả cầu pháp lực
          wash(g, [[2.6, -13.6], [7.2, -11.8], [6.4, -9.2], [2.8, -10.6]], { fill: robe, alpha: 1, jitter: 0.1, layers: 1, seed: 10 })
          stroke(g, [[2.6, -13.6], [7.2, -11.8], [6.4, -9.2]], { ...ol, w: 0.7 })
          blot(g, 8.4, -12.8, 3.2, foe ? C.cinnabarL : C.spirit, 0.35, 11, 1)
          blot(g, 8.4, -12.8, 1.6, foe ? C.cinnabarL : C.spirit, 1, 12, 1)
        }
      }
      // đầu, tóc búi
      blot(g, 0, -17.2, 2.6, SKIN, 1, 13, 1.05)
      stroke(g, [[-2.5, -16.6], [-2, -15], [0, -14.6], [2, -15], [2.5, -16.6]], { ...ol, w: 0.5, alpha: 0.7 })
      wash(g, [[-2.7, -17.4], [-2.2, -19.4], [0, -20.1], [2.2, -19.4], [2.7, -17.4], [1.2, -18.4], [-1.2, -18.4]], { fill: C.ink, alpha: 1, jitter: 0.1, layers: 1, seed: 14 })
      blot(g, 0, -20.6, 1.3, C.ink, 1, 15, 1)
      if (foe) stroke(g, [[-2.6, -18.9], [0, -19.5], [2.6, -18.9], [4.2, -17.4]], { w: 0.8, color: C.cinnabar, press: 'even', alpha: 1 })
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
      const oval = (x: number, y: number, rx: number, ry: number, k = 14): Pt[] => Array.from({ length: k }, (_, i) => [x + Math.cos((i / k) * Math.PI * 2) * rx, y + Math.sin((i / k) * Math.PI * 2) * ry])
      const legs = (xs: number[], near: boolean) =>
        xs.forEach(x => {
          stroke(g, [[x, by + bh * 0.2], [x + 0.4, (by + bh * 0.2) / 2], [x + 1, -0.3]], { ...ink, w: type === 'the' ? 4.8 : 2.8, color: near ? dark : mix(dark, C.ink, 0.4), press: type === 'the' ? 'even' : 'nail' })
          if (type === 'the') blot(g, x + 1.8, -0.6, 2.2, near ? dark : mix(dark, C.ink, 0.4), 1, 30 + x, 0.55) // bàn chân gấu
        })
      // chân phía xa (tối hơn), đuôi
      legs([bx - bw * 0.55, bx + bw * 0.6], false)
      if (P.tail === 'brush') wash(g, [[bx - bw * 0.9, by - 1], [bx - bw - 7, by + 2], [bx - bw - 10, by + 7], [bx - bw - 4, by + 4], [bx - bw * 0.8, by + 2]], { fill: fur, alpha: 1, jitter: 0.4, layers: 2, seed: 3 })
      if (P.tail === 'fan') for (const [dx, dy, sd] of [[-15, -10, 5], [-18, -4, 6], [-13, -16, 7]] as const)
        wash(g, [[bx - bw * 0.7, by - 1], [bx + dx + 3, by + dy + 4], [bx + dx, by + dy], [bx + dx - 4, by + dy + 3], [bx - bw * 0.8, by + 2]], { fill: g2 => { const r = g2.createLinearGradient(bx, by, bx + dx, by + dy); r.addColorStop(0, fur); r.addColorStop(1, light); return r }, alpha: 1, jitter: 0.3, layers: 2, seed: sd })
      // thân
      wash(g, oval(bx, by, bw, bh), { fill: g2 => { const r = g2.createLinearGradient(0, by - bh, 0, by + bh); r.addColorStop(0, fur); r.addColorStop(1, dark); return r }, alpha: 1, jitter: 0.4, layers: 3, seed: 8 })
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
