import test from 'node:test'
import assert from 'node:assert/strict'
import { FALLEN_KEEP, admit, apply, count, fallenOf, hospital, newGame, reviveCost, type State } from './index.ts'

const T0 = Date.UTC(2026, 8, 21, 3)

test('Anh Linh Điện: tử trận vì Đan phòng đầy thì giữ hồn 3 ngày (cộng dồn, tính lại hạn), hồi sinh ngay tốn tài nguyên', () => {
  const s0: State = { ...newGame(T0, 'Hồn'), res: { linhThach: 1e6, linhThao: 1e6, linhKhoang: 1e6 } }
  const beds = hospital(s0)
  const a = admit(s0, { kiem1: beds + 30 })
  assert.deepEqual(a.dead, { kiem1: 30 })
  assert.deepEqual(a.state.fallen, { army: { kiem1: 30 }, until: T0 + FALLEN_KEEP })
  // thêm lần nữa trong hạn: cộng dồn, hạn tính lại từ lúc đó
  const later = { ...a.state, time: T0 + 3_600_000 }
  const b = admit(later, { phap1: 5 })
  assert.deepEqual(b.state.fallen, { army: { kiem1: 30, phap1: 5 }, until: T0 + 3_600_000 + FALLEN_KEEP })
  assert.equal(admit(s0, { kiem1: 1 }).state.fallen, undefined, 'còn chỗ: không ai tử trận')
  // hồi sinh: tốn REVIVE_COST chi phí tuyển, về thẳng hàng ngũ
  const s = b.state
  const r = apply(s, { type: 'revive' }, s.time)
  assert.ok(r.ok)
  assert.equal(r.state.troops.kiem1, s.troops.kiem1 + 30)
  assert.equal(r.state.troops.phap1, s.troops.phap1 + 5)
  assert.equal(r.state.fallen, undefined)
  assert.equal(r.state.res.linhThach, s.res.linhThach - reviveCost({ kiem1: 30, phap1: 5 }).linhThach)
  // hết hạn: hồn tan, không hồi sinh được
  assert.equal(count(fallenOf(s, s.time + FALLEN_KEEP + 1)), 0)
  assert.deepEqual(apply(s, { type: 'revive' }, s.time + FALLEN_KEEP + 1), { ok: false, error: 'empty' })
  assert.deepEqual(apply({ ...s, res: { linhThach: 0, linhThao: 0, linhKhoang: 0 } }, { type: 'revive' }, s.time), {
    ok: false,
    error: 'not_enough',
  })
})
