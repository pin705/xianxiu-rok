import test from 'node:test'
import assert from 'node:assert/strict'
import { ROB_SHARE, expAt, newGame, type State } from './index.ts'
import { advanceAll, atlas, freshWorld, mapOf, worldAct, type Players, type World } from './world.ts'

const T0 = Date.UTC(2026, 8, 25, 3)
function sect(name: string, troops: Partial<State['troops']>, seat: { x: number; y: number }): State {
  const s = newGame(T0, name)
  const levels = Object.fromEntries(Object.keys(s.levels).map(k => [k, 10])) as State['levels']
  return { ...s, levels, shield: 0, seat, troops: { ...s.troops, ...troops }, elders: { thanhPhong: expAt(20) } }
}

test('cướp khoáng: đánh đội đang khai mỏ — thắng lấy nửa phần đã khai, đội kia về; thua thì đội kia khai tiếp; đồng minh / lãnh thổ an toàn', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const r0 = a.regions.find(r => r.ring === 0)!
  const mine = a.points.find(p => p.kind === 'mine' && p.region === r0.i)!
  // A khai mỏ (nhà còn nhiều quân: lực chiến đủ để B đánh được); B mạnh; C yếu
  const setup = () =>
    new Map([
      [1, sect('Khai', { kiem2: 100, the2: 3000 }, { x: r0.cx, y: r0.cy })],
      [2, sect('Cướp', { kiem3: 400 }, { x: 3, y: 3 })],
      [3, sect('Yếu', { kiem1: 5, the2: 3000 }, { x: 5, y: 3 })],
    ]) as Players
  let ps = setup()
  let w: World = freshWorld()
  const act = (pid: number, raw: object, at: number) => {
    const r = worldAct(ps, pid, raw as never, at, 7, map, w)
    if (!r.ok) return r.error
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
    return null
  }
  const step = (at: number) => {
    const r = advanceAll(ps, w, at, map)
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
  }
  const dig = () => {
    assert.equal(act(1, { type: 'go', i: mine.i, task: 'gather', elder: 'thanhPhong', army: { kiem2: 100 } }, T0), null)
    step(ps.get(1)!.marches[0].arriveAt)
    return ps.get(1)!.marches[0]
  }
  const g = dig()
  const rob = (pid: number, army: object, at: number, id = g.id) =>
    act(pid, { type: 'rob', pid: 1, id, elder: 'thanhPhong', army }, at)
  const t1 = g.arriveAt + 1000
  assert.equal(rob(2, { kiem3: 400 }, t1, g.id + 99), 'gone', 'không có đội đó')
  assert.equal(
    act(1, { type: 'rob', pid: 1, id: g.id, elder: 'thanhPhong', army: { the2: 10 } }, t1),
    'gone',
    'tự cướp',
  )
  const snap = mapOf(ps, t1, new Set(), [], w).marches.find(m => m.pid === 1)!
  assert.ok(snap.dig === g.mine!.end && snap.might! > 0, 'bản đồ cho biết đội đang khai và lực chiến')

  // B cướp: mất khiên, A thấy cảnh báo ở điểm mỏ
  assert.equal(rob(2, { kiem3: 400 }, t1), null)
  const m = ps.get(2)!.marches[0]
  assert.equal(m.task, 'rob')
  assert.deepEqual(
    ps.get(1)!.incoming?.map(x => x.spot),
    [mine.i],
  )
  assert.equal(rob(2, { kiem3: 1 }, t1), 'busy', 'một đội mỗi điểm')
  step(m.arriveAt)
  const b = ps.get(2)!
  const x = ps.get(1)!.marches[0]
  const got = Math.floor((g.mine!.amount * (m.arriveAt - g.arriveAt)) / (g.mine!.end - g.arriveAt))
  const loot = b.marches[0].gain!.res[g.mine!.res]!
  assert.ok(
    b.reports.at(-1)!.win && loot > 0 && loot >= Math.floor(got * ROB_SHARE),
    'thắng: lấy ít nhất nửa phần đã khai',
  )
  assert.equal(x.gain!.res[g.mine!.res], got - loot, 'A về với phần còn lại')
  assert.ok(x.mine!.end === m.arriveAt && x.returnAt > m.arriveAt && x.back, 'A bị đánh bật về')
  assert.equal(w.spots[mine.i].left, 20_000 - got, 'phần chưa khai trả về mỏ')
  const rep = ps.get(1)!.reports.at(-1)!
  assert.ok(rep.def && !rep.win && rep.lost?.[g.mine!.res] === loot, 'A có chiến báo, thấy phần bị cướp')
  assert.ok(
    ps.get(1)!.foes.some(f => f.pid === 2),
    'A báo thù được',
  )
  assert.deepEqual(ps.get(1)!.incoming, [], 'hết cảnh báo')

  // C yếu cướp: thua, về tay không; A khai tiếp với quân còn lại
  ps = setup()
  w = freshWorld()
  const g2 = dig()
  assert.equal(rob(3, { kiem1: 5 }, g2.arriveAt + 1000, g2.id), null)
  const mc = ps.get(3)!.marches[0]
  step(mc.arriveAt)
  const y = ps.get(1)!.marches[0]
  assert.ok(!ps.get(3)!.reports.at(-1)!.win && !Object.values(ps.get(3)!.marches[0].gain!.res).some(Boolean))
  assert.ok(y.mine!.end === g2.mine!.end && (y.army.kiem2 ?? 0) <= 100, 'A khai tiếp')

  // cùng minh: không cướp; A khai trong lãnh thổ minh mình: an toàn
  const ally = (id: number, members: Record<number, 0 | 2>) => ({
    id,
    name: `M${id}`,
    tag: `T${id}`,
    members,
    notice: '',
    at: T0,
    helps: [],
  })
  ps = setup()
  w = freshWorld()
  const g3 = dig()
  w = { ...w, allies: { 1: ally(1, { 1: 2, 2: 0 }) } }
  assert.equal(rob(2, { kiem3: 400 }, g3.arriveAt + 1000, g3.id), 'friend')
  ps.set(1, { ...ps.get(1)!, seat: { x: mine.x + 2, y: mine.y } }) // tông môn sát mỏ: mỏ trong lãnh thổ minh A
  w = { ...w, allies: { 1: ally(1, { 1: 2 }) } }
  assert.equal(rob(2, { kiem3: 400 }, g3.arriveAt + 1000, g3.id), 'shield')
})
