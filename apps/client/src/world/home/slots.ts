// Công trình trên núi: chỗ của từng công trình, hình theo tầng (mây che khi chưa mở, nền khi chưa xây, giàn giáo khi
// đang xây), đồ trang trí, và hiệu ứng động của từng loại điểm trên hình (đèn, lửa lò, linh châu, cột sáng…).
import { Container, Sprite, type Texture } from 'pixi.js'
import {
  PIGMENT as C,
  bamboo,
  blossom,
  building,
  cloud,
  disciple,
  flag,
  mix,
  orbTex,
  pearl,
  plot,
  scaffold,
  stoneLantern,
  tierOf,
  type Fx,
  type Kind,
} from '@rok/art'
import { BUILDINGS, IDS, type BuildingId, type State } from '@rok/rules'
import { DECOR, SLOT } from '../layout'
import { hex, ink, painted, sprite, fxTex } from '../stage'
import type { Home } from '../home'
import { FIRE, soft, type Slot } from './kit'

// Chỗ của từng công trình (xếp theo chiều sâu), đồ trang trí, đèn đá
export function buildSlots(h: Home, glowT: Texture) {
  h.ring.anchor.set(0.5)
  h.ring.tint = hex(C.goldL)
  h.ring.visible = false
  h.land.addChild(h.ring, h.aura, h.bLayer, h.dust)
  h.bLayer.sortableChildren = true
  for (const id of IDS) {
    const [x, y] = SLOT[id]
    const root = new Container()
    root.position.set(x, y)
    root.zIndex = y
    const fx = new Container()
    root.addChild(fx)
    h.bLayer.addChild(root)
    const glow = new Container()
    glow.position.set(x, y)
    h.glow.addChild(glow)
    h.slots.set(id, { root, key: '', fx, glow, anims: [], lights: [], top: 0 })
  }
  for (const [kind, x, y, s, seed] of DECOR) {
    const p =
      kind === 'lantern'
        ? painted(`lantern:${s}`, () => stoneLantern(s))
        : painted(`${kind}:${s}:${seed}`, () => (kind === 'blossom' ? blossom : bamboo)(s, seed))
    const d = sprite(p, x, y)
    d.zIndex = y - 0.5
    h.bLayer.addChild(d)
    if (kind === 'lantern') {
      const [lx, ly] = p.meta as [number, number]
      const l = soft(glowT, '#ffc86b', 26 * s, 0)
      l.position.set(x + lx, y + ly)
      h.glow.addChild(l)
      h.lamps.push(l)
    }
  }
}

export function place(h: Home, id: BuildingId, g: State) {
  const slot = h.slots.get(id)!
  const lv = g.levels[id]
  const locked = lv === 0 && g.levels.chuDien < BUILDINGS[id].unlock
  const job = g.queue.find(j => j.building === id)
  const shown = Math.max(1, lv)
  const key = `${locked ? 'lock' : lv ? 'b' : 'ghost'}:${tierOf(shown)}:${lv ? Math.min(6, 1 + Math.floor(lv / 2)) : 0}:${job ? 1 : 0}`
  if (key === slot.key) return
  slot.key = key
  const keep = slot.fx
  slot.root.removeChildren()
  keep.removeChildren().forEach(c => c.destroy())
  slot.glow.removeChildren().forEach(c => c.destroy())
  slot.root.addChild(keep)
  slot.anims = []
  slot.lights = []
  const b = building(id as Kind, shown)
  slot.top = b.top
  const p = painted(
    `bld:${id}:${tierOf(shown)}:${id === 'dienVoTruong' ? Math.min(6, 1 + Math.floor(shown / 2)) : 0}`,
    () => b.art,
  )
  const [, , w] = SLOT[id]
  if (locked) {
    // mây che: ba đám mây chồng nhau, nhấp nhô
    for (const [dx, dy, cw, seed] of [
      [-w * 0.2, -b.top * 0.15, w * 0.8, 51],
      [w * 0.22, -b.top * 0.35, w * 0.7, 53],
      [0, -b.top * 0.05, w * 1.05, 57],
    ] as const) {
      const c = sprite(
        painted(`fog:${Math.round(cw)}:${seed}`, () => cloud(cw, seed)),
        dx,
        dy,
      )
      slot.root.addChild(c)
      slot.anims.push(t => (c.y = dy + Math.sin(t * 1.2 + seed) * 2))
    }
    return
  }
  if (!lv) {
    slot.root.addChildAt(sprite(painted(`plot:${w}`, () => plot(w))), 0)
    const ghost = sprite(p)
    ghost.alpha = 0.28
    slot.root.addChildAt(ghost, 1)
    return
  }
  slot.body = sprite(p)
  slot.root.addChildAt(slot.body, 0)
  effects(h, slot, p.meta as Fx[])
  if (id === 'tuLinhTran') qi(slot, w)
  if (job) {
    slot.root.addChild(sprite(painted(`scaffold:${w}:${b.top}`, () => scaffold(w * 0.9, b.top * 0.95))))
    const worker = sprite(
      painted('worker', () => disciple(false)),
      w * 0.36,
      -1,
    )
    worker.tint = hex(C.ochreL)
    slot.root.addChild(worker)
    slot.anims.push(t => (worker.rotation = Math.sin(t * 12) * 0.12))
    // tia lửa mỗi nhát búa (chu kỳ theo nhịp tay thợ) + bụi đá bốc lên ở chân giàn
    const sparkT = fxTex.spark()
    const hand = [w * 0.36 - 5, -9]
    for (let i = 0; i < 4; i++) {
      const sp = soft(sparkT, i % 2 ? '#ffd27a' : '#fff4d6', 4, 0)
      const vx = (i - 1.5) * 9,
        vy = -16 - (i % 2) * 8
      slot.glow.addChild(sp)
      slot.anims.push(t => {
        const k = ((t * 12) / (Math.PI * 2) + 0.25) % 1 // 0 lúc búa chạm
        sp.position.set(hand[0] + vx * k, hand[1] + vy * k + 60 * k * k)
        sp.alpha = k < 0.45 ? 1 - k / 0.45 : 0
      })
    }
    const puffT = fxTex.puff()
    for (let i = 0; i < 3; i++) {
      const d = new Sprite(puffT)
      d.anchor.set(0.5)
      d.tint = hex(mix(C.paper2, C.ochre, 0.35))
      slot.fx.addChild(d)
      const x0 = (i - 1) * w * 0.28
      slot.anims.push(t => {
        const k = ((t + i * 0.9) % 2.7) / 2.7
        d.position.set(x0 + k * 6, -2 - k * 14)
        d.width = d.height = 8 + k * 14
        d.alpha = Math.sin(k * Math.PI) * 0.45
      })
    }
  }
}

// Tụ Linh Trận hút linh khí: hạt sáng xoáy dần vào tâm trận rồi bốc lên theo cột sáng
function qi(slot: Slot, w: number) {
  const sparkT = fxTex.spark()
  for (let i = 0; i < 14; i++) {
    const m = soft(sparkT, C.spirit, 6, 0)
    slot.glow.addChild(m)
    const a0 = (i / 14) * Math.PI * 2,
      dur = 2.4 + (i % 4) * 0.5,
      off = i * 0.37
    slot.anims.push(t => {
      const k = ((t + off) % dur) / dur
      const r = w * 0.75 * (1 - k),
        a = a0 + k * 4
      m.position.set(Math.cos(a) * r, -6 + Math.sin(a) * r * 0.32 - k ** 3 * 26)
      m.alpha = Math.sin(k * Math.PI) * 0.9
    })
  }
}

// Hiệu ứng động của công trình (toạ độ DU từ chân)
// Hiệu ứng của từng loại điểm trên hình công trình (Fx của @rok/art): đèn, lửa lò, linh châu, cột sáng…
// Thêm loại mới ở @rok/art thì thêm một dòng ở đây — thiếu là lỗi biên dịch
const FX: { [K in Fx['k']]: (slot: Slot, f: Fx & { k: K }, h: Home) => void } = {
  light: (slot, f) => {
    const l = soft(fxTex.glow(), '#ffc86b', f.r * 2.4, 0)
    l.position.set(f.x, f.y)
    slot.lights.push(l)
    slot.glow.addChild(l)
  },
  fire: (slot, f) => {
    // lửa lò: ba khung lưỡi lửa vẽ tay thay nhau (như hoạt hoạ vẽ tay), phụt lên từ miệng đỉnh; quầng ấm hắt qua bụng đỉnh
    const l = soft(fxTex.glow(), '#ff9a3c', 34 * f.s, 0.5)
    l.position.set(f.x, f.y)
    const size = 17 * f.s
    const fl = ink('flame', (i, k) => orbTex(96, 64, 7 + i * 6, 0.2, k), FIRE, size, 3)
    fl.c.rotation = Math.PI / 2 // đầu hoả cầu xuống dưới: lưỡi lửa bốc lên
    fl.c.position.set(f.x, f.y - 9 * f.s - size * 0.2)
    const s0 = fl.c.scale.x
    slot.glow.addChild(l, fl.c)
    slot.anims.push(t => {
      fl.frame(Math.floor(t * 9) % 3)
      fl.c.scale.x = s0 * (1 + 0.1 * Math.sin(t * 13) * Math.sin(t * 5.3))
      l.alpha = 0.4 + 0.2 * Math.sin(t * 7) * Math.sin(t * 3.1)
    })
  },
  orb: (slot, f, h) => {
    // linh châu vẽ tay lơ lửng; quầng linh khí mờ ban ngày, sáng dần khi tối
    const p = sprite(
      painted(`pearl:${f.s}`, () => pearl(2.6 * f.s)),
      f.x,
      f.y,
    )
    slot.fx.addChild(p)
    const l = soft(fxTex.glow(), C.spirit, 16 * f.s, 0)
    slot.glow.addChild(l)
    slot.anims.push(t => {
      const y = f.y + Math.sin(t * 2 + f.x) * 0.8
      p.y = y
      l.position.set(f.x, y)
      l.alpha = (0.2 + 0.8 * h.lightsLevel) * (0.7 + 0.3 * Math.sin(t * 2 + f.x))
    })
  },
  beam: (slot, f) => {
    const l = new Sprite(fxTex.beam())
    l.anchor.set(0.5, 1)
    l.width = 14
    l.height = f.h
    l.tint = hex(C.spirit)
    l.blendMode = 'add'
    l.position.set(f.x, f.y)
    slot.glow.addChild(l)
    slot.anims.push(t => (l.alpha = 0.45 + 0.35 * Math.sin(t * 1.8)))
  },
  rune: (slot, f) => {
    const r = new Sprite(fxTex.ring())
    r.anchor.set(0.5)
    r.width = f.rx * 2.1
    r.height = f.ry * 2.4
    r.tint = hex(C.spirit)
    r.blendMode = 'add'
    r.position.set(f.x, f.y)
    slot.glow.addChild(r)
    slot.anims.push(t => (r.alpha = 0.35 + 0.35 * Math.sin(t * 1.6 + f.rx)))
  },
  herb: (slot, f) => twinkle(slot, f),
  spark: (slot, f) => twinkle(slot, f),
  smoke: (slot, f) => {
    const puffT = fxTex.puff()
    for (let i = 0; i < 3; i++) {
      const p = new Sprite(puffT)
      p.anchor.set(0.5)
      slot.fx.addChild(p)
      slot.anims.push(t => {
        const k = ((t + i * 1.2) % 3.6) / 3.6
        p.position.set(f.x + k * 5, f.y - k * 28)
        p.width = p.height = 8 + k * 16
        p.alpha = Math.sin(k * Math.PI) * 0.85
      })
    }
  },
  flag: (slot, f) => {
    const s = sprite(painted('flag', flag), f.x, f.y)
    s.scale.set(f.s / painted('flag', flag).scale)
    slot.fx.addChild(s)
    slot.anims.push(t => (s.skew.y = Math.sin(t * 2.6 + f.x) * 0.12))
  },
  disciple: (slot, f) => {
    const s = sprite(
      painted('disciple', () => disciple(true)),
      f.x,
      f.y,
    )
    slot.fx.addChild(s)
    slot.anims.push(t => (s.y = f.y - Math.max(0, Math.sin(t * 3.5 + f.x)) * 1.2))
  },
}
// Thảo dược (vàng) / linh khí (xanh) lấp lánh
function twinkle(slot: Slot, f: Fx & { k: 'herb' | 'spark' }) {
  const l = soft(fxTex.spark(), f.k === 'herb' ? C.goldL : C.spirit, 7 * f.s, 0)
  l.position.set(f.x, f.y)
  slot.glow.addChild(l)
  slot.anims.push(t => (l.alpha = Math.max(0, Math.sin(t * 1.4 + f.x))))
}
export function effects(h: Home, slot: Slot, fx: Fx[]) {
  for (const f of fx) (FX[f.k] as (slot: Slot, f: Fx, h: Home) => void)(slot, f, h)
}
