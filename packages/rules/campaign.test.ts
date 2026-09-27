import test from 'node:test'
import assert from 'node:assert/strict'
import { VC_CHEST, VC_FIRST, VC_MEDAL, VC_SHOP, expAt, newGame, type State } from './index.ts'
import { freshWorld, vcMedals, vcOpen, vcRun, vcStars, worldAct, type Players, type World } from './world.ts'

const T0 = Date.UTC(2026, 8, 27, 3)
function sect(hall: number, lv: number): State {
  const s = newGame(T0, 'Viễn')
  const levels = Object.fromEntries(Object.keys(s.levels).map(k => [k, hall])) as State['levels']
  return { ...s, levels, elders: { thanhPhong: expAt(lv), nhuYen: expAt(lv), thachKien: expAt(lv) } }
}

test('Viễn Chinh: đánh lần lượt từng màn bằng đội hình Luận Kiếm Đài; ba sao ra huân chương, qua màn lần đầu thêm; rương ngày theo tổng sao; đổi quà', () => {
  const ps: Players = new Map([[1, sect(16, 25)]])
  let w: World = freshWorld()
  const act = (raw: object, at = T0) => {
    const r = worldAct(ps, 1, raw as never, at, 1, undefined, w)
    if (!r.ok) return r.error
    w = r.world
    for (const [p, s] of r.changed) ps.set(p, s)
    return null
  }
  assert.equal(act({ type: 'vcFight', k: 1 }), 'locked', 'phải qua màn trước')
  assert.deepEqual(vcRun(ps.get(1)!, 0), vcRun(ps.get(1)!, 0), 'tất định')
  const r0 = vcRun(ps.get(1)!, 0)
  assert.equal(r0.star, 7, 'màn đầu: đủ ba sao')
  assert.equal(act({ type: 'vcFight', k: 0 }), null)
  assert.equal(vcMedals(ps.get(1)!), 3 * VC_MEDAL + VC_FIRST)
  assert.equal(act({ type: 'vcFight', k: 0 }), 'claimed', 'không còn sao mới')
  assert.ok(vcOpen(ps.get(1)!, 1))
  // leo tiếp tới khi thua
  let k = 1
  while (k < 30 && vcRun(ps.get(1)!, k).win) assert.equal(act({ type: 'vcFight', k: k++ }), null)
  assert.ok(k > 5, `qua được ${k} màn`)
  assert.equal(act({ type: 'vcFight', k }), vcRun(ps.get(1)!, k).star ? null : 'claimed')
  // rương ngày theo tổng sao, mỗi ngày một lần
  assert.ok(vcStars(ps.get(1)!) >= VC_CHEST[0])
  assert.equal(act({ type: 'vcChest' }), null)
  assert.equal(act({ type: 'vcChest' }), 'claimed')
  assert.equal(act({ type: 'vcChest' }, T0 + 86_400_000), null, 'ngày sau mở lại')
  // đổi quà bằng huân chương, giới hạn tuần
  const before = vcMedals(ps.get(1)!),
    had = ps.get(1)!.items[VC_SHOP[0].item] ?? 0
  assert.equal(act({ type: 'vcBuy', i: 0 }), null)
  assert.equal(vcMedals(ps.get(1)!), before - VC_SHOP[0].price)
  assert.equal(ps.get(1)!.items[VC_SHOP[0].item], had + VC_SHOP[0].n)
})
