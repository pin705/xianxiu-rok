import test from 'node:test'
import assert from 'node:assert/strict'
import { EVE_BUFF, EVE_CHEST_N, EVE_TOP, apply, eveFrags, expAt, newGame, type State } from './index.ts'
import { advanceAll, atlas, eveBuffs, eveStep, freshWorld, worldAct, type Players, type World } from './world.ts'

const T0 = Date.UTC(2026, 8, 25, 3)
function sect(name: string, seat: { x: number; y: number }): State {
  const s = newGame(T0, name)
  const levels = Object.fromEntries(Object.keys(s.levels).map(k => [k, 10])) as State['levels']
  return { ...s, levels, shield: 0, seat, troops: { ...s.troops, kiem3: 3000 }, elders: { thanhPhong: expAt(20) } }
}
const ally = (id: number, members: Record<number, 0 | 2>) => ({
  id,
  name: `M${id}`,
  tag: `T${id}`,
  members,
  notice: '',
  at: T0,
  helps: [],
})

test('Khai Giới Trảm Tà: pha Khai giới hạ yêu thú giới rơi tàn quyển + giới vận cho minh; cổng mở thì minh đầu được tăng ích; đổi rương', () => {
  const a = atlas(777)
  const r0 = a.regions.find(r => r.ring === 0)!
  const wild = a.points.find(p => p.kind === 'wild' && p.region === r0.i && p.lv >= 6)!
  const hunt = (phase: number) => {
    const ps: Players = new Map([[1, sect('Trảm Tà', { x: r0.cx, y: r0.cy })]])
    let w: World = { ...freshWorld(), allies: { 1: ally(1, { 1: 2 }) } }
    const map = { atlas: a, phase }
    const r = worldAct(
      ps,
      1,
      { type: 'go', i: wild.i, task: 'hunt', elder: 'thanhPhong', army: { kiem3: 1000 } },
      T0,
      1,
      map,
      w,
    )
    assert.ok(r.ok, r.ok ? '' : r.error)
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
    const done = advanceAll(ps, w, ps.get(1)!.marches[0].arriveAt, map)
    for (const [k, v] of done.changed) ps.set(k, v)
    return { s: ps.get(1)!, w: done.world, ps }
  }
  const eve = hunt(0)
  assert.equal(eve.s.reports.at(-1)!.win, true)
  assert.equal(eve.s.frag, eveFrags(wild.lv), 'cấp cao rơi nhiều tàn quyển hơn')
  assert.deepEqual(eve.w.eve, { 1: eveFrags(wild.lv) }, 'giới vận của minh')
  const late = hunt(1)
  assert.equal(late.s.frag ?? 0, 0, 'cổng mở rồi thì không rơi')
  assert.equal(late.w.eve, undefined)

  // cổng mở: chốt giới vận — minh đầu được tăng ích, thư báo hạng; bảng giới vận xoá
  const w0: World = { ...eve.w, allies: { ...eve.w.allies, 2: ally(2, {}) }, eve: { 1: 9, 2: 3 } }
  assert.equal(eveStep(eve.ps, w0, { atlas: a, phase: 0 }, T0).world, w0, 'còn pha Khai giới: chưa chốt')
  const st = eveStep(eve.ps, w0, { atlas: a, phase: 1 }, T0)
  assert.equal(st.world.eve, undefined)
  assert.deepEqual(st.world.eveWin?.ids, [1, 2].slice(0, EVE_TOP))
  const m = st.changed.get(1)!.mail.at(-1)!
  assert.deepEqual([m.k, m.a], ['eveTop', [1, 9]])
  assert.deepEqual(
    eveBuffs(st.world, 1, T0 + 1000).map(b => [b.key, b.v]),
    [['prod', EVE_BUFF]],
  )
  assert.deepEqual(eveBuffs(st.world, 1, st.world.eveWin!.until), [], 'hết hạn')

  // đổi rương: đủ EVE_CHEST_N tàn quyển
  const poor = apply({ ...eve.s, frag: EVE_CHEST_N - 1 }, { type: 'eveChest' }, eve.s.time)
  assert.deepEqual(poor, { ok: false, error: 'not_enough' })
  const rich = apply({ ...eve.s, frag: EVE_CHEST_N + 2 }, { type: 'eveChest' }, eve.s.time)
  assert.ok(rich.ok && rich.state.frag === 2 && (rich.state.items.thoiQuang60 ?? 0) > (eve.s.items.thoiQuang60 ?? 0))
})
