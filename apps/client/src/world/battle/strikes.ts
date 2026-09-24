// Đòn đánh: hồn (sét), thú (vuốt), thể tu (dậm đất), kiếm tu / pháp tu (kiếm khí / hoả cầu bay tới); trúng đòn thì
// mực văng, tia lửa, bật lùi, rung màn.
import { Sprite } from 'pixi.js'
import { PIGMENT as C, crackTex, splashTex } from '@rok/art'
import { THUNDER, back, hex, ink, LAST_DRY, texOf, fxTex } from '../stage'
import type { Battle } from '../battle'
import {
  CLAW,
  HIT,
  ORB,
  QUAKE,
  SWORD,
  boltT,
  burstT,
  clawT,
  ease,
  orbT,
  ringT,
  slashT,
  type Kind,
  type Squad,
} from './kit'

// Một đòn đánh: hồn (sét), thú (vuốt), thể tu (dậm đất), kiếm tu / pháp tu (kiếm khí / hoả cầu bay tới)
export function attack(b: Battle, side: number, from: Squad, to: Squad, dur: number) {
  const kind: Kind = side ? b.enemy : 'man'
  const sx = from.c.x,
    sy = from.c.y - 14,
    tx = to.c.x,
    ty = to.c.y - 12
  const travel = dur * 0.3
  const start = dur * 0.12 + Math.random() * dur * 0.08
  if (kind === 'spirit') return bolt(b, tx, ty, start + travel)
  if (kind === 'beast') {
    claw(b, tx, ty, start + travel)
    impact(b, tx, ty, start + travel, side, to)
    return
  }
  if (from.type === 'the') {
    quake(b, side, to, tx, dur, start + travel * 0.7)
    impact(b, tx, ty, start + travel * 0.7, side, to)
    punch(b, 0.02, start + travel * 0.7)
    return
  }
  missile(b, side, from, [sx, sy], [tx, ty], start, travel)
  impact(b, tx, ty, start + travel, side, to)
}

// Vuốt: ba vết cào xuống thật nhanh rồi khô tan
function claw(b: Battle, tx: number, ty: number, at: number) {
  const marks = ink('claw', clawT, CLAW, 40)
  marks.c.position.set(tx, ty)
  marks.c.rotation = (Math.random() - 0.5) * 0.5
  marks.c.visible = false
  b.fx.addChild(marks.c)
  const s0 = marks.c.scale.x
  b.add(
    0.34,
    k => {
      marks.c.visible = true
      marks.c.scale.set(s0 * (k < 0.15 ? 0.75 + back(k / 0.15) * 0.3 : 1.05))
      marks.frame(k < 0.3 ? 0 : ((k - 0.3) / 0.7) * (LAST_DRY + 0.99))
      marks.c.alpha = k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25
    },
    () => marks.c.destroy({ children: true }),
    at,
  )
}

// Thể tu dậm đất: sóng chấn nổ ở chỗ địch, đất nứt toả tia dưới chân rồi mờ dần
function quake(b: Battle, side: number, to: Squad, tx: number, dur: number, at: number) {
  const ring = ink('ring', ringT, QUAKE[side], 20)
  ring.c.position.set(tx, to.c.y + 2)
  ring.c.visible = false
  b.fx.addChild(ring.c)
  const r0 = ring.c.scale.x
  b.add(
    dur * 0.45,
    k => {
      ring.c.visible = true
      ring.c.scale.set(r0 * (1 + ease(k) * 3.6))
      ring.frame(k * (LAST_DRY + 0.99))
      ring.c.alpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4
    },
    () => ring.c.destroy({ children: true }),
    at,
  )
  // đất nứt toả tia dưới chân địch, mờ dần
  const crack = new Sprite(texOf(`crack:${side}`, () => crackTex(128, 4 + side)))
  crack.anchor.set(0.5)
  crack.tint = hex(C.ink)
  crack.width = 64
  crack.height = 22
  crack.position.set(tx, to.c.y + 2)
  crack.alpha = 0
  b.decal.addChild(crack)
  b.add(
    1.4,
    k => (crack.alpha = k < 0.08 ? (k / 0.08) * 0.7 : 0.7 * (1 - (k - 0.08) / 0.92)),
    () => crack.destroy(),
    at,
  )
}

function missile(
  b: Battle,
  side: number,
  from: Squad,
  [sx, sy]: readonly [number, number],
  [tx, ty]: readonly [number, number],
  start: number,
  travel: number,
) {
  // kiếm khí (kiếm tu) hoặc hoả cầu (pháp tu) bay tới: bung ra khỏi tay (vượt cỡ rồi thu), bay, trúng thì
  // lướt thêm một đoạn và khô tan. Kiếm khí để lại vệt nét khô phía sau.
  const sword = from.type === 'kiem'
  const p = sword ? ink('slash', slashT, SWORD[side], 36) : ink('orb', orbT, ORB[side], 30)
  const ghosts = sword
    ? [0.06, 0.12, 0.18].map((lag, i) => ({
        g: ink('slash', slashT, SWORD[side], 36),
        lag,
        a: 0.55 - i * 0.15,
        f: 2 + i,
      }))
    : []
  for (const o of [p, ...ghosts.map(g => g.g)]) {
    o.c.visible = false
    b.fx.addChild(o.c)
  }
  ghosts.forEach(o => o.g.frame(o.f))
  const sparkT = fxTex.spark()
  const arc = sword ? 8 : 28
  const at = (k: number) => {
    const e = ease(k)
    return [sx + (tx - sx) * e, sy + (ty - sy) * e - Math.sin(k * Math.PI) * arc] as const
  }
  // hướng bay theo tiếp tuyến quỹ đạo (hoả cầu đi vòng cung thì đuôi lửa cũng cong theo)
  const dirAt = (k: number) => {
    const [x0, y0] = at(Math.max(0, k - 0.02)),
      [x1, y1] = at(Math.min(1, k + 0.02))
    return Math.atan2(y1 - y0, x1 - x0)
  }
  const s0 = p.c.scale.x
  b.add(
    travel,
    k => {
      p.c.visible = true
      p.c.position.set(...at(k))
      p.c.rotation = dirAt(k)
      p.c.scale.set(s0 * (k < 0.25 ? 0.55 + back(k / 0.25) * 0.45 : 1))
      for (const { g, lag, a } of ghosts) {
        const kk = k - lag / Math.max(0.1, travel)
        g.c.visible = kk > 0
        if (kk > 0) {
          g.c.alpha = a
          g.c.position.set(...at(kk))
          g.c.rotation = dirAt(kk)
          g.c.scale.set(s0 * (kk < 0.25 ? 0.55 + back(kk / 0.25) * 0.45 : 1))
        }
      }
      // tàn lửa rơi lại sau: lệch khỏi đường bay, to nhỏ khác nhau, trôi rồi tắt
      if (!sword && Math.random() < 0.35) {
        const s = new Sprite(sparkT)
        s.anchor.set(0.5)
        s.width = s.height = 3 + Math.random() * 4
        s.tint = hex(ORB[side][Math.random() < 0.5 ? 1 : 2])
        s.blendMode = 'add'
        const x = p.c.x + (Math.random() - 0.5) * 8,
          y = p.c.y + (Math.random() - 0.5) * 8,
          vx = (Math.random() - 0.5) * 14,
          vy = -4 - Math.random() * 8
        b.fx.addChild(s)
        b.add(
          0.25 + Math.random() * 0.2,
          q => {
            s.position.set(x + vx * q, y + vy * q)
            s.alpha = 1 - q
          },
          () => s.destroy(),
        )
      }
    },
    () => ghosts.forEach(({ g }) => g.c.destroy({ children: true })),
    start,
  )
  // trúng: lướt thêm theo hướng bay, khô tan
  const rot = Math.atan2(ty - sy, tx - sx)
  b.add(
    0.26,
    k => {
      p.c.position.set(tx + Math.cos(rot) * 10 * ease(k), ty + Math.sin(rot) * 10 * ease(k))
      p.c.scale.set(s0 * (1 + k * 0.12))
      p.frame(1 + k * LAST_DRY)
      p.c.alpha = k < 0.5 ? 1 : 1 - (k - 0.5) / 0.5
    },
    () => p.c.destroy({ children: true }),
    start + travel,
  )
}

// Trúng đòn: loé sáng, mực văng (son nếu quân ta trúng), tia lửa toé, đội bị đánh bật lùi, rung màn
export function impact(b: Battle, x: number, y: number, at: number, side: number, to?: Squad) {
  // tia bút toả: khung đầu to nhất (chớp), giữ một nhịp rồi khô tan
  const v = Math.floor(Math.random() * 3)
  const hit = ink(`hit:${v}`, burstT(v), HIT[side], 44)
  hit.c.position.set(x, y)
  hit.c.rotation = Math.random() * Math.PI * 2
  hit.c.visible = false
  const h0 = hit.c.scale.x
  const n = Math.floor(Math.random() * 3)
  const sp = new Sprite(texOf(`splash:${n}`, () => splashTex(128, 3 + n * 5)))
  sp.anchor.set(0.5)
  sp.tint = hex(side ? C.cinnabar : C.ink)
  sp.rotation = Math.random() * Math.PI * 2
  sp.position.set(x + (Math.random() - 0.5) * 10, y + 4)
  sp.alpha = 0
  b.fx.addChild(sp, hit.c)
  b.add(
    0.34,
    k => {
      hit.c.visible = true
      hit.c.scale.set(h0 * (k < 0.12 ? 0.5 + back(k / 0.12) * 0.6 : 1.1 + k * 0.15))
      hit.frame(k < 0.25 ? 0 : ((k - 0.25) / 0.75) * (LAST_DRY + 0.99))
      hit.c.alpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3
    },
    () => hit.c.destroy({ children: true }),
    at,
  )
  b.add(
    0.6,
    k => {
      sp.alpha = k < 0.15 ? 0.85 : 0.85 * (1 - (k - 0.15) / 0.85)
      sp.scale.set((46 / 128) * (0.5 + ease(Math.min(1, k * 4)) * 0.6))
    },
    () => sp.destroy(),
    at,
  )
  const sparkT = fxTex.spark()
  for (let i = 0; i < 6; i++) {
    const s = new Sprite(sparkT)
    s.anchor.set(0.5)
    s.width = s.height = 5
    s.tint = hex(HIT[side][2])
    s.blendMode = 'add'
    s.alpha = 0
    const a = Math.random() * Math.PI * 2,
      speed = 30 + Math.random() * 40
    b.fx.addChild(s)
    b.add(
      0.35,
      k => {
        s.position.set(x + Math.cos(a) * speed * k, y + Math.sin(a) * speed * k + 30 * k * k)
        s.alpha = 1 - k
      },
      () => s.destroy(),
      at,
    )
  }
  if (to) {
    const dir = to.y < b.h * 0.6 ? -1 : 1 // địch ở trên bị đẩy lên, quân ta bị đẩy xuống
    b.add(
      0.3,
      k => (to.c.pivot.y = -Math.sin(k * Math.PI) * (1 - k * 0.5) * 5 * dir),
      () => (to.c.pivot.y = 0),
      at,
    )
  }
  b.add(
    0.01,
    () => {},
    () => (b.shake = Math.min(6, b.shake + 2.2)),
    at,
  )
}
// Đòn nặng: giật zoom + khựng khung một nhịp ngắn
export function punch(b: Battle, a: number, at = 0) {
  b.add(
    0.01,
    () => {},
    () => {
      b.zoom = Math.max(b.zoom, a)
      b.hold = Math.max(b.hold, 0.07)
    },
    at,
  )
}

// Sét đánh xuống (lôi kiếp): chớp trắng toàn màn
function bolt(b: Battle, x: number, y: number, at: number) {
  const n = 1 + Math.floor(Math.random() * 3)
  const zap = ink(`bolt:${n}`, boltT(n), THUNDER, 100)
  zap.c.pivot.set(0, 320) // neo ở chân tia (đáy texture 640 px)
  zap.c.scale.y = (y + 20) / 640
  zap.c.position.set(x, y)
  zap.c.alpha = 0
  b.fx.addChild(zap.c)
  // chớp — tắt — chớp lại, rồi tàn
  b.add(
    0.3,
    k => (zap.c.alpha = k < 0.15 || (k > 0.3 && k < 0.45) ? 1 : 0.25 * (1 - k)),
    () => zap.c.destroy({ children: true }),
    at,
  )
  flash(b, at, 0.35)
  impact(b, x, y, at, 1)
  punch(b, 0.03, at)
}
export function strikeAll(b: Battle) {
  for (const q of b.squads[0]) bolt(b, q.c.x, q.c.y - 10, 0.1 + Math.random() * 0.2)
}
export function flash(b: Battle, at: number, a: number) {
  const f = new Sprite(fxTex.glow())
  f.anchor.set(0.5)
  f.position.set(b.w / 2, b.h / 2)
  f.width = b.w * 3
  f.height = b.h * 3
  f.tint = 0xf3edff
  f.blendMode = 'add'
  f.alpha = 0
  b.fx.addChild(f)
  b.add(
    0.4,
    k => (f.alpha = a * (1 - k)),
    () => f.destroy(),
    at,
  )
}
