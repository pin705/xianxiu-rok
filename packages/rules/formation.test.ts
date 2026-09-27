import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ARM_MELT,
  ARM_SHOP,
  ARM_SLOTS,
  DRILLF,
  DRILLF_COIN,
  AP_MAX,
  FORMS,
  VANDU_AP,
  VANDU_DAILY,
  apOf,
  apply,
  drillRun,
  expAt,
  formBonus,
  marchSide,
  migrate,
  newGame,
  sideOf,
  type Arm,
  type March,
  type State,
} from './index.ts'

const T0 = Date.UTC(2026, 8, 26, 3)
function sect(hall: number, extra: Partial<State> = {}): State {
  const s = newGame(T0, 'Trận')
  const levels = Object.fromEntries(Object.keys(s.levels).map(k => [k, hall])) as State['levels']
  return { ...s, levels, seed: 12345, elders: { thanhPhong: expAt(20) }, ...extra }
}
const run = (s: State, a: object) => apply(s, a as never, s.time)
const okState = (s: State, a: object) => {
  const r = run(s, a)
  if (!r.ok) throw new Error(`${JSON.stringify(a)}: ${r.error}`)
  return r.state
}

test('Trận Pháp: bày trận theo tầng Chủ điện; đội xuất quân mang trận đang bày, tăng ích gốc của trận vào đội; thủ nhà cũng theo trận', () => {
  assert.deepEqual(run(sect(9), { type: 'form', id: 'phongThi' }), { ok: false, error: 'locked' })
  assert.deepEqual(
    run(sect(12), { type: 'form', id: 'tamTai' }),
    { ok: false, error: 'locked' },
    'Tam Tài mở ở tầng 22',
  )
  const s = okState(sect(12), { type: 'form', id: 'phongThi' })
  assert.equal(s.form, 'phongThi')
  const atk = (x: State, form?: 'phongThi') => sideOf(x, 'thanhPhong', { kiem1: 100 }, undefined, form).troops[0]
  const base = atk(s),
    wedge = atk(s, 'phongThi')
  const k = FORMS.phongThi.bonus
  assert.ok(wedge.atk > base.atk && wedge.def < base.def, 'Phong Thỉ: công mạnh, thủ hở')
  assert.equal(formBonus(s, 'phongThi', 'atk'), k.atk)
  // đội mang trận lúc đi (m.form), không theo trận đổi sau
  const m = { elder: 'thanhPhong', army: { kiem1: 100 }, form: 'phongThi' } as unknown as March
  assert.equal(marchSide(s, m).troops[0].atk, wedge.atk)
  assert.equal(marchSide(s, { ...m, form: undefined }).troops[0].atk, base.atk)
  // sau luân hồi Chủ điện thấp hơn tầng mở: trận không tính
  assert.equal(formBonus({ ...s, levels: { ...s.levels, chuDien: 3 } }, 'phongThi', 'atk'), 0)
  // gỡ trận
  assert.equal(okState(s, { type: 'form', id: null }).form, undefined)
})

test('Vân Du Đường: vân du tốn hành lực (tối đa 20 lần / ngày) ra trận khí hay Hiền Sĩ Lệnh; đeo trận khí vào ô của trận nó thuộc; luyện hoá, đổi rương', () => {
  const s0 = sect(22)
  assert.deepEqual(run(sect(9), { type: 'vandu', n: 1 }), { ok: false, error: 'locked' })
  assert.deepEqual(run(s0, { type: 'vandu', n: 11 }), { ok: false, error: 'not_enough' }, 'hành lực 100 chỉ đủ 10 lần')
  const s1 = okState(s0, { type: 'vandu', n: 10 })
  assert.equal(apOf(s1, s1.time), AP_MAX - 10 * VANDU_AP)
  assert.equal(s1.vandu?.n, 10)
  const arms = s1.arms ?? []
  assert.ok(arms.length > 0 && arms.length < 10, 'có trận khí, có lệnh')
  assert.ok((s1.armCoin ?? 0) >= 5 * (10 - arms.length))
  for (const a of arms) assert.equal(a.ins.length, a.q + 1, 'số dòng trận văn = phẩm + 1')
  assert.deepEqual(run({ ...s1, ap: { n: 500, at: s1.time } }, { type: 'vandu', n: VANDU_DAILY }), {
    ok: false,
    error: 'limit',
  })
  // đeo: vào đúng ô của trận nó thuộc, tăng ích chỉ khi bày đúng trận
  const arm: Arm = { id: 900, f: 'phuongVien', slot: 1, q: 3, ins: [1, 5, 8] }
  const s2 = okState({ ...s1, arms: [...arms, arm] }, { type: 'armEquip', id: 900 })
  assert.equal(s2.armOn?.phuongVien?.[1], 900)
  const def = formBonus(s2, 'phuongVien', 'def')
  assert.ok(Math.abs(def - (FORMS.phuongVien.bonus.def! + ARM_SLOTS[1].v[3] + 0.005 + 0.01 + 0.02)) < 1e-9)
  assert.equal(formBonus(s2, 'phongThi', 'def'), FORMS.phongThi.bonus.def, 'trận khác không tính')
  // luyện hoá: đang đeo thì phải gỡ trước
  assert.deepEqual(run(s2, { type: 'armMelt', ids: [900] }), { ok: false, error: 'busy' })
  const s3 = okState(okState(s2, { type: 'armOff', f: 'phuongVien', slot: 1 }), { type: 'armMelt', ids: [900] })
  assert.equal(s3.armCoin, (s2.armCoin ?? 0) + ARM_MELT[3])
  assert.equal(armCount(s3), arms.length)
  // đổi rương địa phẩm: chắc chắn phẩm 3, 4 dòng trận văn
  const rich = { ...s3, armCoin: ARM_SHOP[1].price }
  const s4 = okState(rich, { type: 'armBuy', k: 1 })
  const got = s4.arms!.at(-1)!
  assert.equal(got.q, 3)
  assert.equal(got.ins.length, 4)
  assert.equal(s4.armCoin, 0)
  // save giữ được; trận khí hỏng bị loại
  assert.ok(migrate(JSON.parse(JSON.stringify(s4))))
  assert.equal(migrate(JSON.parse(JSON.stringify({ ...s4, arms: [{ ...got, slot: 7 }] }))), null)
})
const armCount = (s: State) => s.arms?.length ?? 0

test('Trận Đồ Diễn Luyện: 6 màn sa bàn bằng đội mượn; trận đề bài đạt đủ ba mục tiêu, không bày trận thì thiếu; mục tiêu mới ra Hiền Sĩ Lệnh', () => {
  DRILLF.forEach((d, k) => {
    assert.equal(drillRun(k, d.form).bits, 7, `màn ${k + 1}: ${d.form} đạt cả ba`)
    assert.ok(drillRun(k, null).bits < 3, `màn ${k + 1}: không bày trận thì thua hay còn ít quân`)
  })
  const s0 = sect(12)
  const s1 = okState(s0, { type: 'formDrill', k: 0, form: 'phongThi' })
  assert.deepEqual(s1.formStars?.[0], 7)
  assert.equal(s1.armCoin, 3 * DRILLF_COIN)
  assert.deepEqual(
    run(s1, { type: 'formDrill', k: 0, form: 'phongThi' }),
    { ok: false, error: 'claimed' },
    'đã đủ mục tiêu',
  )
  assert.deepEqual(run(sect(9), { type: 'formDrill', k: 0, form: null }), { ok: false, error: 'locked' })
})
