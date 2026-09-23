import test from 'node:test'
import assert from 'node:assert/strict'
import { advance, apply, buildTime, cost, newGame, storage, type BuildingId, type State } from './index.ts'

const T0 = 1_000_000
const HOUR = 3_600_000

function up(s: State, b: BuildingId) {
  const r = apply(s, { type: 'upgrade', building: b }, s.time)
  if (!r.ok) throw new Error(r.error)
  return r.state
}

function err(s: State, b: BuildingId) {
  const r = apply(s, { type: 'upgrade', building: b }, s.time)
  return r.ok ? null : r.error
}

test('nâng cấp: trừ tài nguyên, xong đúng giờ', () => {
  const s = up(newGame(T0), 'tuLinhTran')
  assert.equal(s.res.linhThao, 1000 - cost('tuLinhTran', 1).linhThao)
  const done = T0 + buildTime('tuLinhTran', 1)
  assert.equal(advance(s, done - 1).levels.tuLinhTran, 0)
  assert.equal(advance(s, done).levels.tuLinhTran, 1)
})

test('sản lượng tính từ lúc xây xong và không phụ thuộc số lần gọi advance', () => {
  const s = up(newGame(T0), 'tuLinhTran')
  const end = T0 + HOUR
  let stepped = s
  for (let t = T0; t <= end; t += 250) stepped = advance(stepped, t)
  const once = advance(s, end)
  assert.deepEqual(stepped, once)
  assert.equal(once.res.linhThach, 1000 + Math.floor((600 * (HOUR - buildTime('tuLinhTran', 1))) / HOUR))
})

test('đầy kho thì ngừng sản xuất', () => {
  const s = advance(up(newGame(T0), 'tuLinhTran'), T0 + 100 * HOUR)
  assert.equal(s.res.linhThach, storage(s))
})

test('đồng hồ lùi không đổi gì', () => {
  const s = advance(up(newGame(T0), 'tuLinhTran'), T0 + HOUR)
  assert.deepEqual(advance(s, T0), s)
})

test('chặn đúng lý do', () => {
  const s = newGame(T0)
  assert.equal(err(s, 'tangBaoCac'), 'need_main_hall')
  const busy = up(s, 'tuLinhTran')
  assert.equal(err(busy, 'tuLinhTran'), 'busy')
  assert.equal(err(busy, 'linhDien'), 'queue_full')
  assert.equal(err({ ...s, res: { linhThach: 0, linhThao: 0, linhKhoang: 0 } }, 'linhDien'), 'not_enough')
})
