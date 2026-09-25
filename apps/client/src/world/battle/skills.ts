// Công pháp của trưởng lão: mưa kiếm (burst), khiên vàng (shield), hồi sinh (heal), độc vụ (weaken).
// Thêm loại công pháp ở rules thì thêm một dòng vào CASTS — thiếu là lỗi biên dịch.
import { Sprite } from 'pixi.js'
import { PIGMENT as C, flyingSword } from '@rok/art'
import type { Skill } from '@rok/rules'
import { hex, ink, LAST_DRY, painted, sprite, fxTex } from '../stage'
import type { Battle } from '../battle'
import { QUAKE, SWORD, ease, ringT, streakT } from './kit'
import { flash, impact, punch } from './strikes'

// Công pháp của trưởng lão bên side: mỗi loại một hiệu ứng (thêm loại công pháp ở rules thì thêm một dòng — thiếu là lỗi biên dịch).
// Có phó trưởng lão thì công pháp của phó nổ ngay sau
export function cast(b: Battle, side: number, dur: number) {
  const sk = b.skills[side],
    dep = b.deputies[side]
  if (sk) CASTS[sk.kind](b, side, dur)
  if (dep)
    b.add(
      dur * 0.3,
      () => {},
      () => CASTS[dep.kind](b, side, dur * 0.7),
    )
}
const CASTS: Record<Skill['kind'], (b: Battle, side: number, dur: number) => void> = {
  // Mưa kiếm: phi kiếm cắm xuống từng đội địch, vệt nét khô kéo sau chuôi
  burst: (b, side, dur) => {
    const foe = b.squads[1 - side]
    const swordP = painted('flysword', flyingSword)
    for (const q of foe) {
      if (!q.n) continue
      for (let i = 0; i < 6; i++) {
        const s = sprite(swordP, q.c.x + (Math.random() - 0.5) * 40, -20)
        s.scale.set(1.4 / swordP.scale, (side ? -1.4 : 1.4) / swordP.scale)
        if (side === 0) s.rotation = Math.PI
        // vệt nét khô kéo sau chuôi kiếm (37 DU, đầu vệt ở đáy texture)
        const tr = ink('streak', streakT, SWORD[side], 7)
        tr.frame(1)
        tr.c.visible = false
        b.fx.addChild(tr.c, s)
        const ty = q.c.y - 6
        b.add(
          dur * 0.3,
          k => {
            s.y = -20 + (ty + 20) * ease(k)
            s.alpha = 1
            tr.c.visible = true
            tr.c.position.set(s.x, s.y - 19)
            tr.c.scale.y = tr.c.scale.x * (0.6 + (1 - k) * 0.6) // chậm dần khi cắm xuống: vệt ngắn lại
          },
          () => {
            s.destroy()
            tr.c.destroy({ children: true })
          },
          i * 0.04,
        )
      }
      impact(b, q.c.x, q.c.y - 10, dur * 0.3, side, q)
    }
    punch(b, 0.04, dur * 0.3)
    flash(b, dur * 0.3, 0.25)
  },
  // Khiên vàng: vòng mực vàng dựng quanh từng đội mình, khô tan ở cuối
  shield: (b, side, dur) => {
    const own = b.squads[side]
    for (const q of own) {
      if (!q.n) continue
      // khiên vàng: vòng mực vàng dựng quanh đội, khô tan ở cuối
      const d = ink('ring', ringT, QUAKE[0], 90) // cùng texture với sóng chấn, khác cỡ
      d.c.position.set(q.c.x, q.c.y - 10)
      d.c.scale.y = 60 / 80 // dựng cao hơn vòng sóng chấn: bao quanh cả đội
      b.fx.addChild(d.c)
      b.add(
        dur,
        k => {
          d.c.alpha = Math.min(1, k * 5)
          d.frame(k < 0.6 ? 0 : ((k - 0.6) / 0.4) * (LAST_DRY + 0.99))
        },
        () => d.c.destroy({ children: true }),
      )
    }
  },
  // Hồi sinh: linh khí xanh bốc lên từ đội mình
  heal: (b, side, dur) => {
    const own = b.squads[side]
    for (const q of own)
      for (let i = 0; i < 8; i++) {
        const m = new Sprite(fxTex.spark())
        m.anchor.set(0.5)
        m.tint = hex(C.malachiteL)
        m.blendMode = 'add'
        m.width = m.height = 7
        const x0 = q.c.x + (Math.random() - 0.5) * 50
        b.fx.addChild(m)
        b.add(
          dur,
          k => {
            m.position.set(x0, q.c.y - k * 50)
            m.alpha = Math.sin(k * Math.PI)
          },
          () => m.destroy(),
          i * 0.05,
        )
      }
  },
  // Độc vụ: khói tím phủ đội địch
  weaken: (b, side, dur) => {
    const foe = b.squads[1 - side]
    for (const q of foe) {
      if (!q.n) continue
      const m = new Sprite(fxTex.puff())
      m.anchor.set(0.5)
      m.tint = 0x6a4a9a
      m.position.set(q.c.x, q.c.y - 10)
      b.fx.addChild(m)
      b.add(
        dur * 1.6,
        k => {
          m.alpha = Math.sin(k * Math.PI) * 0.8
          m.width = m.height = 50 + k * 30
        },
        () => m.destroy(),
      )
    }
  },
}
