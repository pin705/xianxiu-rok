import test from 'node:test'
import assert from 'node:assert/strict'
import { CAMP_STAGE_PTS, newGame, type State } from './index.ts'
import { atlas, campStep, campTotal, freshWorld, stageGain, stageScore, type Players, type World } from './world.ts'

const T0 = Date.UTC(2026, 8, 21, 3)
const gathered = (s: State, n: number): State => ({
  ...s,
  stats: { ...s.stats, gathered: (s.stats.gathered ?? 0) + n },
})

test('chặng thi đua Chính Tà: mốc lúc mở chặng, phần tăng cộng cho phái, hết chặng phái thắng có quà và điểm mùa', () => {
  const a = atlas(7)
  // người 1 (một mình: phe −1) thuộc Tà phái, người 2 (phe −2) thuộc Chính phái
  let ps: Players = new Map([1, 2].map(p => [p, newGame(T0, `T${p}`)]))
  let w: World = freshWorld()
  const step = (day: number | undefined) => {
    const r = campStep(ps, w, { atlas: a, phase: 1, ...(day !== undefined && { day }) }, T0)
    w = r.world
    for (const [k, v] of r.changed) ps.set(k, v)
    return r
  }
  assert.equal(step(undefined).world, w, 'sim (không có ngày của mùa): không chạy')
  step(0)
  assert.deepEqual([w.stage?.n, Object.keys(w.stage!.base).length], [0, 2], 'chặng 0 (khai mỏ): mốc của mọi người')
  ps = new Map([
    [1, gathered(ps.get(1)!, 5000)],
    [2, gathered(ps.get(2)!, 1000)],
    [3, gathered(newGame(T0, 'Mới'), 9000)],
  ])
  const same = w
  assert.notEqual(step(1).world, same, 'người mới giữa chặng: thêm mốc')
  assert.equal(w.stage!.base[3], 9000, 'mốc từ lúc thấy lần đầu: phần trước đó không tính')
  assert.equal(step(2).world, w, 'không có gì mới: giữ nguyên')
  assert.deepEqual(stageScore(ps, w), [1000, 5000])
  assert.equal(stageGain(ps, w, 1), 5000)
  // sang chặng 1: Tà phái thắng chặng 0 — người 1 (có góp) nhận thư quà, phái được điểm mùa
  const r = step(3)
  assert.equal(r.changed.get(1)?.mail.at(-1)?.k, 'campStage')
  assert.deepEqual(r.changed.get(1)?.mail.at(-1)?.a, [1, 'gather', 1, 1000, 5000])
  assert.equal(r.changed.has(2), false, 'phái thua: không quà')
  assert.deepEqual(w.stageWins, [0, 1])
  assert.deepEqual(w.stageLast, { n: 0, score: [1000, 5000], won: 1 })
  assert.equal(w.stage!.n, 1)
  assert.deepEqual(stageScore(ps, w), [0, 0], 'chặng mới: mốc mới')
  assert.deepEqual(campTotal([], w), [0, CAMP_STAGE_PTS])
})
