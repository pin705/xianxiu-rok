import test from 'node:test'
import assert from 'node:assert/strict'
import { PLAN_MAX, PLAN_WARN, newGame } from './index.ts'
import { freshWorld, planStep, worldAct, type Players, type World } from './world.ts'

const T0 = Date.UTC(2026, 8, 21, 3)
const HOUR = 3_600_000

test('Minh sự lịch: trưởng lão hẹn giờ, người trong minh tham gia / rút, 10 phút trước giờ nhắc người tham gia một lần', () => {
  const ps: Players = new Map([1, 2, 3].map(p => [p, newGame(T0, `T${p}`)]))
  let w: World = {
    ...freshWorld(),
    allies: { 1: { id: 1, name: 'VK', tag: 'VK', members: { 1: 2, 2: 1, 3: 0 }, notice: '', at: T0, helps: [] } },
  }
  const act = (pid: number, raw: object, at = T0) => {
    const r = worldAct(ps, pid, raw as never, at, 1, undefined, w)
    if (!r.ok) return r.error
    w = r.world
    return null
  }
  const plans = () => w.allies[1].plans ?? []
  assert.equal(act(3, { type: 'planAdd', at: T0 + HOUR, text: 'Kết trận' }), 'locked', 'thành viên thường không hẹn')
  assert.equal(act(2, { type: 'planAdd', at: T0 + 60_000, text: 'Kết trận' }), 'bad', 'phải sau hơn 10 phút')
  assert.equal(act(2, { type: 'planAdd', at: T0 + HOUR, text: '   ' }), 'bad', 'lời nhắn rỗng')
  assert.equal(act(2, { type: 'planAdd', at: T0 + 2 * HOUR, text: '  Giữ   linh mạch ' }), null)
  assert.equal(act(1, { type: 'planAdd', at: T0 + HOUR, text: 'Kết trận yêu vương' }), null)
  assert.deepEqual(
    plans().map(p => [p.id, p.text, p.go]),
    [
      [2, 'Kết trận yêu vương', [1]],
      [1, 'Giữ linh mạch', [2]],
    ],
    'xếp theo giờ, người hẹn tự tham gia, lời nhắn gọn khoảng trắng',
  )
  assert.equal(act(3, { type: 'planGo', id: 2 }), null)
  assert.deepEqual(plans()[0].go, [1, 3])
  assert.equal(act(3, { type: 'planGo', id: 2 }), null)
  assert.deepEqual(plans()[0].go, [1], 'bấm lại là rút')
  assert.equal(act(3, { type: 'planGo', id: 2 }), null)
  for (let k = 0; k < PLAN_MAX - 2; k++)
    assert.equal(act(1, { type: 'planAdd', at: T0 + (3 + k) * HOUR, text: `Việc ${k}` }), null)
  assert.equal(act(1, { type: 'planAdd', at: T0 + 9 * HOUR, text: 'Thêm' }), 'limit')
  assert.equal(act(3, { type: 'planDel', id: 1 }), 'locked')
  assert.equal(act(2, { type: 'planDel', id: 1 }), null)
  // nhắc: chưa tới 10 phút trước giờ thì chưa; tới thì nhắc người tham gia, lần sau không nhắc lại
  assert.equal(planStep(w, T0 + HOUR - PLAN_WARN - 1000).remind.length, 0)
  const r = planStep(w, T0 + HOUR - PLAN_WARN + 1000)
  assert.deepEqual(r.remind, [
    [1, 'Kết trận yêu vương'],
    [3, 'Kết trận yêu vương'],
  ])
  assert.equal(planStep(r.world, T0 + HOUR - 1000).remind.length, 0)
  w = r.world
  // qua giờ: không tham gia được nữa; qua một giờ thì tự rời lịch
  assert.equal(act(3, { type: 'planGo', id: 2 }, T0 + HOUR + 1), 'gone')
  assert.equal(act(1, { type: 'planAdd', at: T0 + 12 * HOUR, text: 'Sau' }, T0 + 2 * HOUR + 1), null)
  assert.ok(!plans().some(p => p.id === 2), 'việc cũ đã rời lịch')
})
