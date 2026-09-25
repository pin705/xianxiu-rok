import test from 'node:test'
import assert from 'node:assert/strict'
import {
  FIRE_TIME,
  MEND_COOL,
  WALL_FALL,
  apply,
  burning,
  newGame,
  wallFallAt,
  wallHit,
  wallHp,
  wallMax,
  type State,
} from './index.ts'
import { atlas, regionOf, wallStep, type Players } from './world.ts'

const T0 = Date.UTC(2026, 8, 21, 3)
const MIN = 60_000
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-6, `${a} ≠ ${b}`)

test('Linh hỏa thiêu sơn: thủ thua mất trận lực và núi cháy, cháy thì tụt, tắt thì hồi; tu bổ, Tức Hỏa Phù', () => {
  const s0: State = { ...newGame(T0, 'Thủ'), items: { tucHoa: 1 } }
  const max = wallMax(s0)
  assert.equal(wallHp(s0, T0), max, 'chưa bị đánh: đầy')
  const s = wallHit(s0, T0)
  assert.ok(burning(s, T0 + 1) && !burning(s, T0 + FIRE_TIME))
  close(wallHp(s, T0), 0.85 * max)
  close(wallHp(s, T0 + 10 * MIN), 0.75 * max)
  close(wallHp(s, T0 + FIRE_TIME), 0.55 * max)
  close(wallHp(s, T0 + FIRE_TIME + 3_600_000), 0.58 * max)
  assert.equal(wallFallAt(s, T0 + FIRE_TIME), null, 'chưa về 0')
  // tu bổ trận cơ: +10 %, mỗi 30 phút một lần
  const mended = apply(s, { type: 'mend' }, T0 + 10 * MIN)
  assert.ok(mended.ok)
  close(wallHp(mended.state, T0 + 10 * MIN), 0.85 * max)
  assert.deepEqual(apply(mended.state, { type: 'mend' }, T0 + 20 * MIN), { ok: false, error: 'cooldown' })
  assert.ok(apply(mended.state, { type: 'mend' }, T0 + 10 * MIN + MEND_COOL).ok)
  assert.deepEqual(apply(s0, { type: 'mend' }, T0), { ok: false, error: 'max_level' }, 'đầy thì thôi')
  // Tức Hỏa Phù: dập lửa ngay, trận lực thôi tụt rồi hồi; hết cháy thì không dùng được
  const doused = apply(s, { type: 'use', item: 'tucHoa', n: 1 }, T0 + 10 * MIN)
  assert.ok(doused.ok)
  assert.ok(!burning(doused.state, T0 + 10 * MIN))
  close(wallHp(doused.state, T0 + 20 * MIN), (0.75 + 0.03 / 6) * max)
  assert.deepEqual(apply({ ...s0, items: { tucHoa: 1 } }, { type: 'use', item: 'tucHoa', n: 1 }, T0), {
    ok: false,
    error: 'empty',
  })
})

test('Sơn môn thất thủ: trận lực về 0 lúc cháy thì bị đánh bật sang chỗ trống vùng ngoài, lửa tắt, còn nửa trận lực, có thư', () => {
  const a = atlas(7)
  const base: State = { ...newGame(T0, 'Thủ'), seat: { x: 20, y: 20 } }
  const weak: State = { ...base, wall: { hp: 0.1 * wallMax(base), at: T0, fire: 0 } }
  const hit = wallHit(weak, T0) // 10 % − 15 %: về 0 ngay
  assert.equal(wallFallAt(hit, T0), T0)
  const slow = wallHit({ ...base, wall: { hp: 0.3 * wallMax(base), at: T0, fire: 0 } }, T0) // 15 % còn lại cháy hết sau 15 phút
  assert.equal(wallFallAt(slow, T0 + 10 * MIN), null)
  assert.equal(wallFallAt(slow, T0 + 20 * MIN), T0 + 15 * MIN)
  const ps: Players = new Map([
    [1, hit],
    [2, { ...hit, name: 'NPC' }],
    [3, { ...base, name: 'Yên' }],
  ])
  const r = wallStep(ps, a, T0 + 1000, 7, new Set([2]))
  assert.deepEqual([...r.keys()], [1], 'tông môn NPC không bị đánh bật')
  const s = r.get(1)!
  assert.notDeepEqual(s.seat, hit.seat)
  assert.equal(a.regions[regionOf(a, s.seat!)].ring, 0, 'chỗ mới ở vùng ngoài')
  assert.equal(s.mail.at(-1)!.k, 'wallFall')
  assert.deepEqual(s.mail.at(-1)!.a, [s.seat!.x, s.seat!.y])
  assert.ok(!burning(s, T0 + 2000))
  close(wallHp(s, T0 + 1000), WALL_FALL * wallMax(s))
  assert.equal(wallStep(new Map([[1, s]]), a, T0 + 2000, 7).size, 0, 'đã dời: thôi')
})
