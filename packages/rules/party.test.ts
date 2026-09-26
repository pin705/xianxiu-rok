import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CONVOY_COST,
  CONVOY_WAIT,
  PARTY_WAIT,
  PARTY_WAVES,
  expAt,
  newGame,
  type PartyRole,
  type State,
} from './index.ts'
import { convoyStep, convoyTop, freshWorld, partyRun, partyStep, worldAct, type Players, type World } from './world.ts'

const T0 = Date.UTC(2026, 8, 21, 3)
const DAY = 86_400_000
function sect(name: string, hall = 10, exp = 30): State {
  const s = newGame(T0, name)
  const levels = Object.fromEntries(Object.keys(s.levels).map(k => [k, hall])) as State['levels']
  return { ...s, levels, elders: { thanhPhong: expAt(exp) } }
}
const room = (lv: number, roles: PartyRole[]) => ({
  by: 1,
  lv,
  at: T0,
  members: roles.map((role, i) => ({ pid: i + 1, role })),
})

test('Man Hoang Cổ Tộc: mở phòng, vào phòng, đủ người hay hết giờ thì giải — thư quà cả đội, mỗi người mỗi ngày một lần', () => {
  const ps: Players = new Map([1, 2, 3, 4, 5].map(p => [p, sect(`T${p}`)]))
  ps.set(6, sect('Non', 5))
  ps.set(7, sect('Ngoai'))
  const members = { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } as const
  let w: World = {
    ...freshWorld(),
    allies: { 1: { id: 1, name: 'VK', tag: 'VK', members, notice: '', at: T0, helps: [] } },
  }
  const act = (pid: number, raw: object, at = T0) => {
    const r = worldAct(ps, pid, raw as never, at, 1, undefined, w)
    if (!r.ok) return r.error
    w = r.world
    for (const [p, s] of r.changed) ps.set(p, s)
    return null
  }
  const open = (lv = 1, role: PartyRole = 'hoPhap') => ({ type: 'partyOpen', lv, role })
  const join = (role: PartyRole = 'chuCong') => ({ type: 'partyJoin', role })
  assert.equal(act(7, open()), 'locked', 'chưa vào minh')
  assert.equal(act(6, open()), 'locked', 'Chủ Điện chưa đủ')
  assert.equal(act(1, open(9)), 'bad')
  assert.equal(act(1, join()), 'gone', 'chưa có phòng')
  assert.equal(act(1, open()), null)
  assert.equal(w.allies[1].party?.at, T0 + PARTY_WAIT)
  assert.equal(act(2, open(2)), 'busy', 'minh đang có phòng chờ')
  assert.equal(act(1, join()), 'full', 'đã trong phòng')
  assert.equal(act(2, join()), null)
  assert.equal(partyStep(ps, w, T0 + 1000, 1).world, w, 'chưa đủ người, chưa hết giờ')
  assert.equal(act(3, join('triLieu')), null)
  assert.equal(act(4, join()), null)
  assert.equal(act(5, join()), 'full')
  // đủ người: giải ngay, ai trong đội cũng có thư [độ khó, số đợt, số người]
  const r = partyStep(ps, w, T0 + 2000, 1)
  assert.equal(r.world.allies[1].party, undefined)
  for (const p of [1, 2, 3, 4]) assert.deepEqual(r.changed.get(p)!.mail.at(-1)!.a, [1, PARTY_WAVES, 4])
  assert.equal(r.changed.has(5), false)
  w = r.world
  for (const [p, s] of r.changed) ps.set(p, s)
  assert.equal(act(1, open()), 'claimed', 'mỗi ngày một lần')
  assert.equal(act(5, open(3)), null)
  assert.equal(act(2, join()), 'claimed')
  assert.equal(act(3, join(), T0 + PARTY_WAIT + 1), 'gone', 'hết giờ chờ')
  // hết giờ chờ: thiếu người vẫn giải
  const late = partyStep(ps, w, T0 + PARTY_WAIT + 1, 1)
  assert.deepEqual(late.changed.get(5)!.mail.at(-1)!.a?.[2], 1)
  w = late.world
  assert.equal(act(1, open(), T0 + DAY), null, 'qua ngày mở lại được')
})

test('Man Hoang Cổ Tộc: đội mạnh qua nhiều đợt hơn, ải cao khó hơn, không ai thì không qua đợt nào', () => {
  const four: PartyRole[] = ['hoPhap', 'chuCong', 'chuCong', 'triLieu']
  const team = (exp: number): Players => new Map([1, 2, 3, 4].map(p => [p, sect(`P${p}`, 10, exp)]))
  const strong = partyRun(team(30), room(1, four), 7)
  assert.equal(strong, PARTY_WAVES)
  assert.ok(partyRun(team(5), room(1, four), 7) < strong)
  assert.ok(partyRun(team(30), room(5, four), 7) < strong)
  assert.equal(partyRun(new Map(), room(1, four), 7), 0)
})

test('Linh Thương Hộ Tống: trưởng lão tốn Minh khố khởi hành, người trong minh ghi danh hộ tống; tới giờ server giải — thư quà theo % hàng, minh giữ điểm cao nhất mở độ khó', () => {
  const ps: Players = new Map([1, 2, 3, 4].map(p => [p, sect(`T${p}`)]))
  ps.set(5, sect('Ngoai'))
  let w: World = {
    ...freshWorld(),
    allies: {
      1: {
        id: 1,
        name: 'VK',
        tag: 'VK',
        members: { 1: 2, 2: 0, 3: 0, 4: 0 },
        notice: '',
        at: T0,
        helps: [],
        fund: 900,
      },
    },
  }
  const act = (pid: number, raw: object, at = T0) => {
    const r = worldAct(ps, pid, raw as never, at, 1, undefined, w)
    if (!r.ok) return r.error
    w = r.world
    for (const [p, s] of r.changed) ps.set(p, s)
    return null
  }
  const go = (lv = 1) => ({ type: 'convoyGo', lv })
  assert.equal(act(2, go()), 'locked', 'chỉ trưởng lão / minh chủ')
  assert.equal(act(1, go(2)), 'locked', 'độ khó 2 chưa mở')
  assert.equal(act(3, { type: 'convoyGuard' }), 'gone', 'chưa có đoàn')
  assert.equal(act(1, go()), null)
  assert.equal(w.allies[1].fund, 900 - CONVOY_COST[0])
  assert.deepEqual(w.allies[1].convoy, { by: 1, lv: 1, at: T0 + CONVOY_WAIT, guards: [1] })
  assert.equal(act(1, go()), 'busy')
  assert.equal(act(2, { type: 'convoyGuard' }), null)
  assert.equal(act(2, { type: 'convoyGuard' }), 'full', 'đã ghi danh')
  assert.equal(act(5, { type: 'convoyGuard' }), 'gone', 'không cùng minh')
  assert.equal(convoyStep(ps, w, T0 + 1000, 1).world, w, 'chưa tới giờ khởi hành')
  const r = convoyStep(ps, w, T0 + CONVOY_WAIT, 1)
  const [lv, hp, n] = r.changed.get(1)!.mail.at(-1)!.a as number[]
  assert.deepEqual([lv, n], [1, 2])
  assert.deepEqual(r.changed.get(2)!.mail.at(-1)!.a, [1, hp, 2])
  assert.equal(r.changed.has(3), false, 'không hộ tống thì không có quà')
  assert.equal(r.world.allies[1].convoy, undefined)
  assert.equal(r.world.allies[1].convoyBest, hp > 0 ? 100 + hp : 0)
  assert.equal(convoyTop(r.world.allies[1]), hp > 0 ? 2 : 1, 'qua độ khó 1 thì mở độ khó 2')
  w = r.world
  for (const [p, s] of r.changed) ps.set(p, s)
  assert.equal(act(1, go()), 'claimed', 'mỗi ngày một chuyến')
  assert.equal(act(1, go(), T0 + DAY), 'not_enough', 'hết Minh khố')
})
