import test from 'node:test'
import assert from 'node:assert/strict'
import { openDb, parse, record, stats } from './analytics.ts'

const DAY = 86_400_000
const T0 = Date.UTC(2026, 8, 1, 3) // 10h sáng giờ VN

test('chỉ nhận đúng khuôn client gửi', () => {
  const ok = parse(JSON.stringify({ id: 'b3f1c2d4-aaaa-bbbb-cccc-1234567890ab', name: 'hall', props: { n: 5 }, v: '0.2.0', t: 1 }))
  assert.deepEqual(ok, { id: 'b3f1c2d4-aaaa-bbbb-cccc-1234567890ab', name: 'hall', props: '{"n":5}', v: '0.2.0' })
  assert.equal(parse('không phải json'), null)
  assert.equal(parse(JSON.stringify({ id: 'x', name: 'open' })), null, 'id quá ngắn')
  assert.equal(parse(JSON.stringify({ id: 'abcdefgh', name: 'drop table' })), null, 'sự kiện lạ')
  assert.equal(parse(JSON.stringify({ id: 'abcdefgh', name: 'open', props: { s: 'x'.repeat(600) } })), null, 'props quá to')
  assert.equal(parse('x'.repeat(3000)), null)
})

test('retention theo cohort: chỉ tính ngày đã trọn, đúng D1/D7', () => {
  const db = openDb()
  const at = (id: string, day: number, name = 'open', props = {}) =>
    record(db, { id: `player-${id}`, name, props: JSON.stringify(props), v: '0.2.0' }, T0 + day * DAY)
  // Cohort ngày 0: A quay lại ngày 1 và 7, B quay lại ngày 1, C bỏ luôn. Cohort ngày 1: D bỏ luôn.
  at('A', 0, 'found'), at('A', 1), at('A', 7), at('B', 0, 'found'), at('B', 1), at('C', 0, 'found'), at('D', 1, 'found')
  at('A', 7, 'hall', { n: 6 }), at('A', 7, 'hall', { n: 5 }), at('B', 1, 'hall', { n: 3 })
  at('A', 7, 'trib', { win: true, hall: 6 }), at('B', 1, 'trib', { win: false, hall: 5 })
  const s = stats(db, T0 + 10 * DAY)
  assert.equal(s.players, 4)
  assert.deepEqual(s.cohorts.map(c => [c.players, c.d1, c.d7]), [[3, 2, 1], [1, 0, 0]])
  assert.equal(s.d1, 0.5) // (2 + 0) / (3 + 1)
  assert.equal(s.d7, 0.25) // (1 + 0) / (3 + 1)
  assert.deepEqual(s.halls, { 3: 1, 6: 1 })
  assert.deepEqual({ ...s.trib }, { tries: 2, wins: 1 })
  // Ngày thứ 7 của cohort chưa trọn thì chưa tính D7
  assert.equal(stats(db, T0 + 7 * DAY).d7, null)
})
