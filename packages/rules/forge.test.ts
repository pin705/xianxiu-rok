import test from 'node:test'
import assert from 'node:assert/strict'
import {
  AWAKEN_COST,
  AWAKEN_STEP,
  AWAKEN_V,
  ELDERS,
  GEAR,
  PRIME_SKILL,
  PRIME_TOKENS,
  SKILL_MAX,
  apply,
  expAt,
  lead,
  migrate,
  newGame,
  skillOf,
  type State,
} from './index.ts'

const T0 = Date.UTC(2026, 8, 27, 3)
const run = (s: State, a: object) => apply(s, a as never, s.time)

test('Khai Linh (Iconic I–V): cấp pháp bảo đủ 2 × tầng kế thì khai được, tốn Khí Linh Tinh; mỗi tầng +10 % tăng ích, tầng V mở hiệu ứng ô; tháo / đeo giữ tầng', () => {
  const g = 'thanhSuong' as const // binh khí bộ Kiếm
  const s0: State = {
    ...newGame(T0, 'Khí'),
    elders: { thanhPhong: expAt(10) },
    gear: { [g]: { lv: 1, on: 'thanhPhong' } },
    items: { khiTinh: 50 },
  }
  assert.deepEqual(run(s0, { type: 'awaken', gear: g }), { ok: false, error: 'locked' }, 'cấp 1 < 2')
  let s: State = { ...s0, gear: { [g]: { lv: 10, on: 'thanhPhong' } } }
  const key = GEAR[g].key
  const base = lead(s, 'thanhPhong', key)
  for (let k = 0; k < 5; k++) {
    const r = run(s, { type: 'awaken', gear: g })
    assert.ok(r.ok, `tầng ${k + 1}`)
    s = r.state
  }
  assert.equal(s.gear[g]?.aw, 5)
  assert.equal(s.items.khiTinh, 50 - AWAKEN_COST.reduce((a, b) => a + b, 0))
  assert.deepEqual(run(s, { type: 'awaken', gear: g }), { ok: false, error: 'max_level' })
  const gain = lead(s, 'thanhPhong', key) - base
  assert.ok(Math.abs(gain - GEAR[g].v * 10 * AWAKEN_STEP * 5) < 1e-9, 'mỗi tầng +10 % tăng ích pháp bảo')
  const v = AWAKEN_V[GEAR[g].slot]
  assert.ok(lead(s, 'thanhPhong', v.key) - lead(s0, 'thanhPhong', v.key) >= v.v - 1e-9, 'tầng V: hiệu ứng ô')
  // tháo ra rồi đeo lại: giữ tầng khai linh
  const off = run(s, { type: 'equip', gear: g, elder: null })
  assert.ok(off.ok && off.state.gear[g]?.aw === 5 && off.state.gear[g]?.on === undefined)
  const back = run(off.state, { type: 'equip', gear: g, elder: 'thanhPhong' })
  assert.ok(back.ok && back.state.gear[g]?.aw === 5)
  assert.deepEqual(run({ ...s0, gear: { [g]: { lv: 2 } }, items: {} }, { type: 'awaken', gear: g }), {
    ok: false,
    error: 'no_item',
  })
  assert.ok(migrate(JSON.parse(JSON.stringify(s))))
})

test('Chân Thân (Prime): trưởng lão Bản Mệnh Thần Thông, 6 sao, cấp 30 chuyển thế bằng 100 tín vật — sức công pháp +15 %, công pháp áp mọi hệ', () => {
  const e = 'thanhPhong' as const
  const skl = [SKILL_MAX, ...ELDERS[e].passives.map(() => SKILL_MAX)]
  const s0: State = {
    ...newGame(T0, 'Chân'),
    elders: { [e]: expAt(30) },
    stars: { [e]: 6 },
    skl: { [e]: skl },
    tokens: { [e]: PRIME_TOKENS },
  }
  assert.deepEqual(
    run({ ...s0, skl: {} }, { type: 'prime', elder: e }),
    { ok: false, error: 'locked' },
    'chưa Bản Mệnh',
  )
  assert.deepEqual(run({ ...s0, tokens: { [e]: 5 } }, { type: 'prime', elder: e }), { ok: false, error: 'not_enough' })
  const r = run(s0, { type: 'prime', elder: e })
  assert.ok(r.ok)
  const s = r.state
  assert.deepEqual(s.prime, [e])
  assert.equal(s.tokens[e], 0)
  assert.ok(Math.abs(lead(s, e, 'skill') - lead(s0, e, 'skill') - PRIME_SKILL) < 1e-9)
  assert.equal(skillOf(s, e).type, undefined, 'bản mệnh pháp bảo: công pháp áp mọi hệ')
  assert.deepEqual(run(s, { type: 'prime', elder: e }), { ok: false, error: 'claimed' })
  assert.ok(migrate(JSON.parse(JSON.stringify(s))))
})
