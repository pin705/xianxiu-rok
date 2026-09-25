import test from 'node:test'
import assert from 'node:assert/strict'
import { DAY, SUPPLY_GET, SUPPLY_HALL, SUPPLY_SEND, apply, newGame, storage, supplyTax, type State } from './index.ts'
import { freshWorld, supplyRoom, worldAct, type Players, type World } from './world.ts'

const T0 = Date.UTC(2026, 8, 23, 3)
function sect(name: string, hall: number): State {
  const s = newGame(T0, name)
  const levels = Object.fromEntries(Object.keys(s.levels).map(k => [k, hall])) as State['levels']
  return { ...s, levels, res: { linhThach: 2e6, linhThao: 2e6, linhKhoang: 2e6 } }
}

test('Vận Linh Trận: gửi cho người cùng minh, hao tổn theo Tàng Bảo Các, người nhận nhận qua thư; trần ngày hai bên', () => {
  // 1, 2, 4, 5 cùng minh (4 dưới tầng mở, 5 kho rất lớn); 3 ở ngoài
  const ps: Players = new Map([
    [1, sect('Gửi', 12)],
    [2, sect('Nhận', 6)],
    [3, sect('Ngoài', 12)],
    [4, sect('Nhỏ', SUPPLY_HALL - 1)],
    [5, sect('Lớn', 25)],
  ])
  let w: World = {
    ...freshWorld(),
    allies: {
      1: { id: 1, name: 'Vạn Kiếm', tag: 'VK', members: { 1: 2, 2: 0, 4: 0, 5: 0 }, notice: '', at: T0, helps: [] },
    },
  }
  const act = (pid: number, to: number, res: object, at = T0) => {
    const r = worldAct(ps, pid, { type: 'supply', to, res } as never, at, 1, undefined, w)
    if (!r.ok) return r.error
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
    return null
  }
  assert.ok(Math.abs(supplyTax(1) - 0.3488) < 1e-9 && Math.abs(supplyTax(25) - 0.08) < 1e-9, '35 % → 8 %')
  assert.equal(act(1, 3, { linhThach: 100 }), 'locked', 'khác minh')
  assert.equal(act(1, 1, { linhThach: 100 }), 'locked', 'tự gửi cho mình')
  assert.equal(act(4, 1, { linhThach: 100 }), 'locked', 'dưới tầng mở')
  assert.equal(act(1, 2, { linhThach: 0 }), 'bad', 'không gửi gì')
  assert.equal(act(1, 2, { linhThach: -5 }), 'bad')
  assert.equal(act(1, 2, { linhThach: 1.5 }), 'bad')
  assert.equal(act(1, 2, { linhThach: 3e6 }), 'not_enough')

  // gửi: trừ đủ bên gửi, bên nhận có thư quà = phần sau hao tổn; nhận thư thì vào kho
  const tax = supplyTax(12)
  assert.equal(act(1, 2, { linhThach: 1000, linhKhoang: 500 }), null)
  assert.equal(ps.get(1)!.res.linhThach, 2e6 - 1000)
  assert.equal(ps.get(1)!.res.linhKhoang, 2e6 - 500)
  const m = ps.get(2)!.mail.at(-1)!
  assert.deepEqual([m.k, m.a], ['supply', ['Gửi']])
  assert.deepEqual(m.gift?.res, {
    linhThach: Math.floor(1000 * (1 - tax)),
    linhThao: 0,
    linhKhoang: Math.floor(500 * (1 - tax)),
  })
  const got = apply(ps.get(2)!, { type: 'mail', id: m.id }, T0)
  assert.ok(got.ok && got.state.res.linhThach === 2e6 + Math.floor(1000 * (1 - tax)))

  // trần: người nhận (kho nhỏ) chạm trước; người gửi hết phần của ngày; sang ngày mới thì có lại
  const room = supplyRoom(w, ps, 1, 2, T0)!
  assert.equal(room.send, SUPPLY_SEND * storage(ps.get(1)!) - 1500)
  assert.equal(room.get, SUPPLY_GET * storage(ps.get(2)!) - Math.floor(1000 * (1 - tax)) - Math.floor(500 * (1 - tax)))
  assert.equal(act(1, 2, { linhThao: Math.ceil(room.get / (1 - tax)) + 2 }), 'limit', 'người nhận hết phần hôm nay')
  assert.equal(act(1, 2, { linhThao: Math.floor(room.get / (1 - tax)) }), null, 'vừa đủ phần người nhận')
  assert.equal(supplyRoom(w, ps, 1, 2, T0)!.get <= 1, true)
  const left = supplyRoom(w, ps, 1, 5, T0)!.send
  assert.equal(act(1, 5, { linhThao: left + 1 }), 'limit', 'người gửi cũng có trần')
  assert.equal(act(1, 5, { linhThao: left }), null)
  assert.equal(supplyRoom(w, ps, 1, 5, T0)!.send, 0)
  assert.equal(supplyRoom(w, ps, 1, 2, T0 + DAY)!.get, SUPPLY_GET * storage(ps.get(2)!), 'ngày mới')
  assert.equal(act(1, 2, { linhThao: 1000 }, T0 + DAY), null)
  assert.equal(supplyRoom(w, ps, 1, 3, T0), null, 'khác minh: hồ sơ không hiện Vận Linh Trận')
})
