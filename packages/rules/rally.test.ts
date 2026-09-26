import test from 'node:test'
import assert from 'node:assert/strict'
import { RALLY_WAIT, expAt, newGame, type State } from './index.ts'
import {
  advanceAll,
  aidAt,
  allyInfo,
  allyTouched,
  freshWorld,
  nextRaid,
  worldAct,
  type Players,
  type World,
} from './world.ts'

const T0 = Date.UTC(2026, 8, 23, 3)
function sect(name: string, hall: number, troops: Partial<State['troops']> = {}): State {
  const s = newGame(T0, name)
  const levels = Object.fromEntries(Object.keys(s.levels).map(k => [k, hall])) as State['levels']
  return {
    ...s,
    levels,
    shield: 0,
    res: { linhThach: 2e5, linhThao: 2e5, linhKhoang: 2e5 },
    troops: { ...s.troops, ...troops },
    elders: { thanhPhong: expAt(20) },
  }
}

test('kết trận công sơn: mở nhắm một tông môn, đồng minh góp đội, tới cùng lúc đánh như một bên; chia chiến lợi phẩm', () => {
  // 1 mở, 2 góp (cùng minh), 3 bị đánh, 4 ngoài minh
  const ps: Players = new Map([
    [1, sect('Mở', 10, { kiem3: 1500 })],
    [2, sect('Góp', 10, { kiem3: 1500 })],
    [3, sect('Núi', 12, { the1: 3000 })],
    [4, sect('Ngoài', 10, { kiem3: 500 })],
  ])
  let w: World = {
    ...freshWorld(),
    allies: { 1: { id: 1, name: 'Vạn Kiếm', tag: 'VK', members: { 1: 2, 2: 0 }, notice: '', at: T0, helps: [] } },
  }
  const act = (pid: number, a: object, at = T0) => {
    const r = worldAct(ps, pid, a as never, at, 777, undefined, w)
    if (!r.ok) return r.error
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
    return null
  }
  const army = { kiem3: 1500 }
  assert.equal(act(4, { type: 'raidRally', pid: 3, wait: 0, elder: 'thanhPhong', army }), 'locked', 'phải có minh')
  assert.equal(act(1, { type: 'raidRally', pid: 2, wait: 0, elder: 'thanhPhong', army }), 'friend')
  const quiet = w
  assert.equal(act(1, { type: 'raidRally', pid: 3, wait: 1, elder: 'thanhPhong', army }), null)
  assert.deepEqual(allyTouched(quiet, w), [1, 2], 'mở kết trận: báo cả minh (server đẩy "ally")')
  assert.deepEqual(allyTouched(w, w), [])
  const rl = Object.values(w.rallies)[0]
  assert.deepEqual([rl.task, rl.i, rl.foe, rl.at], ['raid', 3, 'Núi', T0 + RALLY_WAIT[1]])
  assert.equal(act(1, { type: 'raidJoin', id: rl.id, elder: 'thanhPhong', army }), 'full', 'người mở không góp lần nữa')
  assert.equal(act(4, { type: 'raidJoin', id: rl.id, elder: 'thanhPhong', army }), 'gone', 'khác minh')
  assert.notEqual(
    act(2, { type: 'rallyJoin', id: rl.id, elder: 'thanhPhong', army }),
    null,
    'rallyJoin chỉ cho kết trận điểm',
  )
  assert.equal(act(2, { type: 'raidJoin', id: rl.id, elder: 'thanhPhong', army }, T0 + 60_000), null)
  assert.equal(ps.get(2)!.marches[0].arriveAt, rl.at, 'đội góp tới đúng giờ hẹn')
  assert.equal(ps.get(2)!.shield, 0, 'góp kết trận cũng là đi đánh: mất khiên')
  assert.equal(ps.get(3)!.incoming?.length, 2, 'bên bị đánh thấy cả hai đội')
  assert.equal(nextRaid(ps), rl.at)
  assert.equal(act(2, { type: 'raidJoin', id: rl.id, elder: 'thanhPhong', army }, rl.at), 'gone', 'hết giờ góp')

  // tới nơi: một trận, quân hai đội gộp; thắng thì mỗi người mang phần theo sức mang, bên thủ mất cả phần bị cướp
  const before = ps.get(3)!.res.linhThach
  const r = advanceAll(ps, w, rl.at)
  for (const [k, v] of r.changed) ps.set(k, v)
  w = r.world
  assert.deepEqual(w.rallies, {}, 'kết trận đã giải')
  const [a, b, d] = [1, 2, 3].map(p => ps.get(p)!)
  const ra = a.reports.at(-1)!,
    rb = b.reports.at(-1)!,
    rd = d.reports.at(-1)!
  assert.equal(
    ra.fights[0].a.troops.reduce((n, t) => n + t.n, 0),
    3000,
    'bên đánh là hai đội gộp',
  )
  assert.ok(ra.win && rb.win && !rd.win)
  const got = (x: typeof ra) => x.gain.res.linhThach ?? 0
  assert.ok(got(ra) > 0 && Math.abs(got(ra) - got(rb)) <= 1, 'hai đội ngang sức mang: chia đôi')
  assert.ok(before - d.res.linhThach >= got(ra) + got(rb), 'bên thủ mất ít nhất bằng tổng hai phần')
  assert.deepEqual(
    d.foes.map(f => f.pid),
    [1, 2],
    'báo thù được cả hai',
  )
  assert.equal(d.incoming?.length ?? 0, 0, 'hết cảnh báo')
  assert.ok(a.marches[0].returnAt > rl.at && b.marches[0].returnAt > rl.at, 'hai đội đang về')
  assert.ok((a.stats.kp ?? 0) > 0 && (b.stats.kp ?? 0) > 0, 'chiến công chia cho cả hai')
  assert.equal(a.honor, Math.floor((a.stats.kp ?? 0) / 100), 'chiến công cộng Công Huân')
  assert.ok((d.honor ?? 0) > 0, 'bên thủ hạ được địch cũng có Công Huân')
})

test('Minh Ước chung kết trận: minh ước góp đội vào kết trận của nhau, viện binh cho nhau; minh ngoài thì không', () => {
  // 1 mở (VK), 2 minh ước (TK), 3 bị đánh, 4 minh khác (ND)
  const ps: Players = new Map([
    [1, sect('Mở', 10, { kiem3: 1500 })],
    [2, sect('Bạn', 10, { kiem3: 1600 })],
    [3, sect('Núi', 12, { the1: 3000 })],
    [4, sect('Ngoài', 10, { kiem3: 500 })],
  ])
  const al = (id: number, tag: string, pid: number, naps: number[] = []) => ({
    id,
    name: tag,
    tag,
    members: { [pid]: 2 as const },
    notice: '',
    at: T0,
    helps: [],
    naps,
  })
  let w: World = { ...freshWorld(), allies: { 1: al(1, 'VK', 1, [2]), 2: al(2, 'TK', 2, [1]), 3: al(3, 'ND', 4) } }
  const act = (pid: number, a: object, at = T0) => {
    const r = worldAct(ps, pid, a as never, at, 777, undefined, w)
    if (!r.ok) return r.error
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
    return null
  }
  // viện binh: minh ước được, minh khác không
  assert.equal(act(4, { type: 'aid', pid: 1, elder: 'thanhPhong', army: { kiem3: 100 } }), 'locked')
  assert.equal(act(2, { type: 'aid', pid: 1, elder: 'thanhPhong', army: { kiem3: 100 } }), null)
  const t1 = ps.get(2)!.marches[0].arriveAt
  const r = advanceAll(ps, w, t1)
  for (const [k, v] of r.changed) ps.set(k, v)
  w = r.world
  assert.deepEqual(
    aidAt(ps, 1).map(([p]) => p),
    [2],
    'viện binh minh ước đóng ở nhà người mở',
  )
  // kết trận: minh ước thấy và góp được, minh khác không
  const army = { kiem3: 1500 }
  const quiet = w
  assert.equal(act(1, { type: 'raidRally', pid: 3, wait: 1, elder: 'thanhPhong', army }, t1), null)
  assert.deepEqual(allyTouched(quiet, w), [1, 2], 'mở kết trận: báo cả minh ước')
  const rl = Object.values(w.rallies)[0]
  const seen = allyInfo(w, ps, 2, () => false)!.rallies
  assert.deepEqual(
    seen.map(x => [x.id, x.tag, x.name]),
    [[rl.id, 'VK', 'Mở']],
    'minh ước thấy kết trận kèm hiệu minh, tên người mở',
  )
  assert.deepEqual(allyInfo(w, ps, 4, () => false)!.rallies, [], 'minh khác không thấy')
  assert.equal(act(4, { type: 'raidJoin', id: rl.id, elder: 'thanhPhong', army: { kiem3: 500 } }, t1), 'gone')
  ps.set(2, { ...ps.get(2)!, elders: { ...ps.get(2)!.elders, thachKien: expAt(20) } }) // thanhPhong đang dẫn viện binh
  assert.equal(act(2, { type: 'raidJoin', id: rl.id, elder: 'thachKien', army }, t1 + 60_000), null)
  assert.equal(ps.get(2)!.marches.at(-1)!.arriveAt, rl.at, 'đội minh ước tới đúng giờ hẹn')
})
