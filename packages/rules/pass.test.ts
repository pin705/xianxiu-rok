import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PASS_CHEST,
  PASS_FREE,
  PASS_GOLD,
  PASS_LEVELS,
  PASS_STEP,
  PASS_VIP,
  VIP_LEVELS,
  advance,
  apply,
  metric,
  migrate,
  newGame,
  passLevel,
  passReady,
  passXp,
  seasonEnd,
  type State,
} from './index.ts'

const T0 = Date.UTC(2026, 0, 5, 3) // thứ Hai
const run = (s: State, a: object) => {
  const r = apply(s, a as never, s.time)
  if (!r.ok) throw new Error(r.error)
  return r.state
}
const err = (s: State, a: object) => {
  const r = apply(s, a as never, s.time)
  return r.ok ? null : r.error
}
const hall3 = (): State => {
  const s = advance(newGame(T0), T0 + 1000)
  return { ...s, levels: { ...s.levels, chuDien: 3 } }
}

test('Tu Tiên Lệnh: rương Nhật Khóa cộng điểm lệnh, mỗi cấp một quà, Kim Lệnh từ Hương Hỏa PASS_VIP nhận bù, hết mùa làm lại', () => {
  // rương Nhật Khóa đầu (20 hoạt lực: xây 2 lần) → +PASS_CHEST điểm lệnh
  let s = hall3()
  const f = s.fest.nhatKhoa!
  s = { ...s, fest: { ...s.fest, nhatKhoa: { ...f, base: { ...f.base, build: metric(s, 'build') - 2 } } } }
  s = run(s, { type: 'fest', id: 'nhatKhoa', i: 0 })
  assert.equal(s.pass?.xp, PASS_CHEST)
  assert.equal(passLevel(s), 0)
  assert.equal(err(s, { type: 'pass', lv: 1 }), 'not_done')
  // lên cấp 2: nhận quà cấp 1, cấp 3 chưa tới, cấp 1 hai lần không được, Kim Lệnh chưa mở
  s = passXp(s, 2 * PASS_STEP)
  assert.equal(passLevel(s), 2)
  const gain = (a: State, b: State, r: (typeof PASS_FREE)[number]) =>
    Object.entries(r.items ?? {}).every(([k, n]) => (b.items[k as never] ?? 0) === (a.items[k as never] ?? 0) + n)
  const before = s
  s = run(s, { type: 'pass', lv: 1 })
  assert.deepEqual(s.pass?.got, [1])
  assert.ok(gain(before, s, PASS_FREE[0]), 'quà cấp 1 vào túi')
  assert.equal(err(s, { type: 'pass', lv: 1 }), 'claimed')
  assert.equal(err(s, { type: 'pass', lv: 3 }), 'not_done')
  assert.equal(err(s, { type: 'pass', lv: 1, gold: true }), 'locked')
  assert.equal(err(s, { type: 'pass', lv: PASS_LEVELS + 1 }), 'bad')
  assert.deepEqual(passReady(s), [[2, false]])
  // Hương Hỏa đủ: nhận tất cả — quà thường cấp 2 và Kim Lệnh cấp 1, 2 (bù)
  s = { ...s, vip: { ...s.vip!, pts: VIP_LEVELS[PASS_VIP] } }
  assert.deepEqual(passReady(s), [
    [1, true],
    [2, false],
    [2, true],
  ])
  const prev = s
  s = run(s, { type: 'pass' })
  assert.deepEqual(
    [s.pass?.got, s.pass?.gold],
    [
      [1, 2],
      [1, 2],
    ],
  )
  assert.ok(gain(prev, s, PASS_GOLD[0]), 'quà Kim Lệnh cấp 1 vào túi')
  assert.equal(err(s, { type: 'pass' }), 'not_done')
  // cấp tối đa PASS_LEVELS; lưu / nạp giữ lệnh; hết mùa làm lại
  assert.equal(passLevel(passXp(s, 999 * PASS_STEP)), PASS_LEVELS)
  assert.deepEqual(migrate(JSON.parse(JSON.stringify(s)))?.pass, s.pass)
  assert.equal(migrate({ ...JSON.parse(JSON.stringify(s)), pass: { xp: 'x', got: [], gold: [] } }), null)
  assert.equal(seasonEnd(s, s.time + 1000, 1).pass, undefined)
})
