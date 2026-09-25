import test from 'node:test'
import assert from 'node:assert/strict'
import {
  GOLD_PITY,
  STAR_BONUS,
  TAVERN,
  TOKEN_SUMMON,
  addItems,
  apply,
  drawError,
  lead,
  newGame,
  tavernFree,
  type State,
} from './index.ts'

const T0 = Date.UTC(2026, 0, 5, 3)
const run = (s: State, a: object, t = s.time) => {
  const r = apply(s, a as never, t)
  if (!r.ok) throw new Error(r.error)
  return r.state
}
const hall2 = (): State => {
  const s = newGame(T0)
  return { ...s, levels: { ...s.levels, chuDien: 2 }, seed: 12345 }
}

test('Chiêu Hiền Đài: lượt miễn phí mở ngay, sau đó chờ đủ giờ; thiếp trong túi mở thêm; mầm ẩn chỉ trừ thiếp', () => {
  let s = hall2()
  assert.equal(tavernFree(s, 'silver'), true)
  s = run(s, { type: 'draw', kind: 'silver', n: 1 })
  assert.equal(tavernFree(s, 'silver'), false)
  assert.equal(s.tavern.silver, T0 + TAVERN.silver.free)
  assert.ok(s.tavern.last, 'server (mầm thật) ghi lại quà')
  assert.equal(drawError(s, 'silver', 1), 'no_item')
  s = run({ ...s, items: addItems(s.items, { nganDuyen: 3 }) }, { type: 'draw', kind: 'silver', n: 3 })
  assert.equal(s.items.nganDuyen, 0)
  // client: mầm 0 — trừ thiếp, không tự bịa quà
  const c = run(
    { ...s, seed: 0, items: addItems(s.items, { nganDuyen: 1 }), tavern: { ...s.tavern, last: null } },
    {
      type: 'draw',
      kind: 'silver',
      n: 1,
    },
  )
  assert.equal(c.items.nganDuyen, 0)
  assert.equal(c.tavern.last, null)
  // chưa đủ tầng thì khoá
  assert.equal(drawError(newGame(T0), 'silver', 1), 'locked')
})

test('Chiêu Hiền Đài: thiếp vàng có bảo hiểm — mở đủ 10 lần chắc chắn có 10 tín vật một trưởng lão', () => {
  let s = { ...hall2(), items: addItems(hall2().items, { kimDuyen: GOLD_PITY }) }
  const before = Object.values(s.tokens).reduce((a, b) => a + (b ?? 0), 0)
  s = run(s, { type: 'draw', kind: 'gold', n: GOLD_PITY })
  const after = Object.values(s.tokens).reduce((a, b) => a + (b ?? 0), 0)
  assert.ok(after - before >= TOKEN_SUMMON)
  assert.equal(s.tavern.pity, 0) // lần 10 (lượt miễn phí + 9 thiếp) là lần bảo hiểm, đếm lại từ 0
  assert.equal(s.items.kimDuyen, 1)
})

test('tín vật: đủ 10 thu nhận trưởng lão chưa có; dư thì nâng sao, sao cộng công và sinh lực cho đội người đó dẫn', () => {
  let s: State = { ...hall2(), tokens: { hanBang: 25, thanhPhong: 15 } }
  s = run(s, { type: 'recruit', elder: 'hanBang' })
  assert.equal(s.elders.hanBang, 0)
  assert.equal(s.tokens.hanBang, 15)
  assert.deepEqual(apply(s, { type: 'recruit', elder: 'hanBang' }, s.time), { ok: false, error: 'claimed' })
  const atk = lead(s, 'thanhPhong', 'atk')
  s = run(s, { type: 'star', elder: 'thanhPhong' })
  assert.equal(s.stars.thanhPhong, 2)
  assert.equal(s.tokens.thanhPhong, 5)
  assert.equal(lead(s, 'thanhPhong', 'atk'), atk + STAR_BONUS.atk!)
  assert.deepEqual(apply(s, { type: 'star', elder: 'thanhPhong' }, s.time), { ok: false, error: 'not_enough' })
  assert.deepEqual(apply(s, { type: 'star', elder: 'macSau' }, s.time), { ok: false, error: 'locked' })
})

test('thành tựu: đạt bậc thì nhận quà bậc đó, lần lượt từng bậc, hết bậc thì thôi', async () => {
  const { ACHS, ACH_REWARDS, achReady } = await import('./index.ts')
  let s: State = { ...hall2(), levels: { ...hall2().levels, chuDien: 11 } }
  assert.equal(achReady(s, 'hall'), true) // tầng 11 ≥ 5 và ≥ 10
  s = run(s, { type: 'ach', id: 'hall' })
  assert.equal(s.ach.hall, 1)
  assert.equal(s.items.nganDuyen, ACH_REWARDS[0].items!.nganDuyen)
  s = run(s, { type: 'ach', id: 'hall' })
  assert.equal(s.ach.hall, 2)
  assert.deepEqual(apply(s, { type: 'ach', id: 'hall' }, s.time), { ok: false, error: 'not_done' }) // bậc 3 cần tầng 15
  const done: State = { ...s, ach: { ...s.ach, hall: ACHS.hall.tiers.length } }
  assert.deepEqual(apply(done, { type: 'ach', id: 'hall' }, s.time), { ok: false, error: 'max_level' })
})
