import test from 'node:test'
import assert from 'node:assert/strict'
import { HONOR_RUIN, RUIN_EVERY, RUIN_OPEN, SEASON_RUIN, expAt, newGame, type State } from './index.ts'
import { advanceAll, atlas, freshWorld, ruinWindow, sideKey, worldAct, type Players, type World } from './world.ts'

const T0 = Date.UTC(2026, 8, 23, 3)
const HOUR = 3_600_000

test('Cổ Di Tích: mở 1 giờ mỗi 39 giờ; chỉ chiếm lúc mở; đóng cửa thì phe giữ chốt điểm mùa + Công Huân theo phút, quân về', () => {
  const a = atlas(7)
  const map = { atlas: a, phase: 2 }
  const p = a.points.find(x => x.kind === 'ruin')!
  // lịch: cửa sổ kế tiếp dài đúng RUIN_OPEN, lần sau cách RUIN_EVERY
  const w0 = ruinWindow(a, p, T0)
  const open = w0.open ? w0 : ruinWindow(a, p, w0.start)
  assert.equal(open.end - open.start, RUIN_OPEN)
  assert.equal(ruinWindow(a, p, open.end).start - open.start, RUIN_EVERY)
  assert.equal(
    ruinWindow(
      a,
      a.points.find(x => x.kind === 'vein')!,
      T0,
    ).open,
    true,
    'điểm khác luôn mở',
  )

  const s0 = newGame(open.start - HOUR, 'Giữ')
  const me: State = {
    ...s0,
    seat: { x: p.x + 2, y: p.y },
    troops: { ...s0.troops, kiem3: 500 },
    elders: { thanhPhong: expAt(20) },
  }
  const ps: Players = new Map([[1, me]])
  let w: World = freshWorld()
  const go = (t: number) =>
    worldAct(ps, 1, { type: 'go', i: p.i, task: 'take', elder: 'thanhPhong', army: { kiem3: 500 } }, t, 1, map, w)
  const shut = go(open.start - 60_000)
  assert.deepEqual(shut, { ok: false, error: 'locked' }, 'chưa mở cửa')
  const r = go(open.start + 60_000)
  assert.ok(r.ok)
  for (const [k, v] of r.changed) ps.set(k, v)
  const m = ps.get(1)!.marches[0]
  assert.ok(m.arriveAt < open.end, 'tới kịp lúc còn mở')
  const a1 = advanceAll(ps, w, m.arriveAt, map)
  for (const [k, v] of a1.changed) ps.set(k, v)
  w = a1.world
  assert.equal(w.spots[p.i].own, sideKey(w, 1), 'chiếm được')
  assert.ok(ps.get(1)!.marches[0].stay, 'đóng quân')

  // đóng cửa: chốt, Công Huân theo phút đã giữ, quân về, điểm trống
  const a2 = advanceAll(ps, w, open.end + 5_000, map)
  for (const [k, v] of a2.changed) ps.set(k, v)
  w = a2.world
  const held = open.end - m.arriveAt
  assert.equal(w.spots[p.i].own, undefined, 'điểm trống chờ lần sau')
  assert.ok(Math.abs((w.pts[sideKey(w, 1)] ?? 0) - (held / HOUR) * SEASON_RUIN) < 1e-6, 'điểm mùa theo giờ giữ')
  assert.equal(ps.get(1)!.honor, Math.floor((held / 60_000) * HONOR_RUIN), 'Công Huân theo phút')
  const back = ps.get(1)!.marches[0]
  assert.ok(!back.stay && back.returnAt > open.end, 'quân đang về')
})
