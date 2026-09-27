import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CTECH,
  CTECH_NEED,
  CTECH_PER,
  HERMITS,
  HERMIT_DAILY,
  HERMIT_FAVOR,
  HERMIT_TASKS,
  apply,
  bonus,
  crystals,
  ctechCost,
  hermitLv,
  hermitTask,
  migrate,
  newGame,
  type State,
} from './index.ts'

const T0 = Date.UTC(2026, 8, 27, 3)
function sect(extra: Partial<State> = {}): State {
  const s = newGame(T0, 'Mùa')
  const levels = Object.fromEntries(Object.keys(s.levels).map(k => [k, 15])) as State['levels']
  return { ...s, levels, seasonAt: T0 - 86_400_000, ...extra }
}
const run = (s: State, a: object) => apply(s, a as never, s.time)
const okState = (s: State, a: object) => {
  const r = run(s, a)
  if (!r.ok) throw new Error(`${JSON.stringify(a)}: ${r.error}`)
  return r.state
}

test('Linh Tinh Trận Pháp: Công Huân mùa ra linh tinh (không trừ Công Huân); nâng trận theo nhánh, trận sau cần trận trước đủ tầng; chỉ trong mùa', () => {
  assert.deepEqual(run(sect({ seasonAt: undefined, honor: 1000 }), { type: 'ctech', i: 0 }), {
    ok: false,
    error: 'locked',
  })
  const s0 = sect({ honor: 100 })
  assert.equal(crystals(s0), 100 * CTECH_PER)
  assert.deepEqual(run(s0, { type: 'ctech', i: 1 }), { ok: false, error: 'locked' }, 'Dẫn Linh cần Tụ Linh đủ tầng')
  let s = s0
  for (let k = 0; k < CTECH_NEED; k++) s = okState(s, { type: 'ctech', i: 0 })
  assert.equal(crystals(s), 100 * CTECH_PER - ctechCost(0, 0) - ctechCost(0, 1))
  assert.equal(s.honor, 100, 'Công Huân giữ nguyên')
  assert.ok(Math.abs(bonus(s, 'gather') - bonus(s0, 'gather') - CTECH[0].v * CTECH_NEED) < 1e-9)
  assert.ok(run(s, { type: 'ctech', i: 1 }).ok, 'đủ tầng: mở trận kế')
  assert.ok(run(s0, { type: 'ctech', i: 5 }).ok, 'trận đầu nhánh Chiến Pháp không cần gì')
  assert.deepEqual(run(sect({ honor: 1 }), { type: 'ctech', i: 0 }), { ok: false, error: 'not_enough' })
  assert.ok(migrate(JSON.parse(JSON.stringify(s))))
})

test('Ẩn Sĩ Động Phủ: nhận việc vặt (tính phần tăng từ lúc nhận), xong thì nộp — hảo cảm lên cấp; tột cấp ẩn sĩ truyền tâm pháp; ngày tối đa 15 lần nộp', () => {
  const s0 = sect()
  assert.deepEqual(run({ ...s0, seasonAt: undefined }, { type: 'hermitTake', h: 'thanhHu' }), {
    ok: false,
    error: 'locked',
  })
  const t = hermitTask(s0, 'thanhHu')
  const task = HERMIT_TASKS[t]
  const s1 = okState(s0, { type: 'hermitTake', h: 'thanhHu' })
  assert.deepEqual(run(s1, { type: 'hermitTake', h: 'thanhHu' }), { ok: false, error: 'claimed' })
  assert.deepEqual(run(s1, { type: 'hermitHand', h: 'thanhHu' }), { ok: false, error: 'not_done' })
  // làm việc: chỉ số tăng đủ mục tiêu
  const key = { hunt: 'hunted', gather: 'gathered', train: 'trained', heal: 'healed', brew: 'brewed', speed: 'sped' }[
    task.m as string
  ] as keyof State['stats']
  const worked = { ...s1, stats: { ...s1.stats, [key]: ((s1.stats[key] as number) ?? 0) + task.n } }
  const s2 = okState(worked, { type: 'hermitHand', h: 'thanhHu' })
  assert.equal(s2.hermit?.fav.thanhHu, 1)
  assert.equal(s2.hermit?.jobs.thanhHu, undefined)
  // tột cấp: tâm pháp cho cả tông môn
  const top = { ...s2, hermit: { ...s2.hermit!, fav: { thanhHu: HERMIT_FAVOR.at(-1)! } } }
  assert.equal(hermitLv(top, 'thanhHu'), HERMIT_FAVOR.length + 1)
  assert.ok(Math.abs(bonus(top, 'atk.kiem') - bonus(s0, 'atk.kiem') - HERMITS.thanhHu['atk.kiem']) < 1e-9)
  assert.equal(hermitLv(s2, 'thanhHu'), 1)
  // trần ngày
  const tired = { ...worked, hermit: { ...s1.hermit!, n: HERMIT_DAILY } }
  assert.deepEqual(run(tired, { type: 'hermitHand', h: 'thanhHu' }), { ok: false, error: 'limit' })
  assert.ok(migrate(JSON.parse(JSON.stringify(s2))))
})
