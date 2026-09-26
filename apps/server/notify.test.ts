import test from 'node:test'
import assert from 'node:assert/strict'
import { advance, festEnds, metric, nextDay, newGame, rate, storage } from '@rok/rules'
import { careReminds, remindNote } from './src/game/notify.ts'
import { loadText } from '@rok/i18n'

const T0 = Date.UTC(2026, 8, 21, 3)
const MIN = 60_000

test('nhắc lúc rời game: khiên sắp hết (30 phút trước), kho đầy sớm nhất, giữ chuỗi Hương Hỏa lúc 20h hôm sau', async () => {
  const base = newGame(T0, 'Nhắc')
  const s = { ...base, shield: T0 + 5 * 60 * MIN, vip: { ...base.vip, streak: 3 } }
  const got = Object.fromEntries(careReminds(s, T0).map(r => [r.k, r.at]))
  assert.equal(got.shield, s.shield - 30 * MIN)
  assert.equal(got.streak, nextDay(T0) + 20 * 60 * MIN)
  const cap = storage(s)
  const first = Math.min(
    ...(['linhThach', 'linhThao', 'linhKhoang'] as const)
      .filter(r => rate(s, r) > 0 && s.res[r] < cap)
      .map(r => T0 + ((cap - s.res[r]) / rate(s, r)) * 60 * MIN),
  )
  assert.equal(got.store, Math.round(first))
  // khiên sắp hết quá sớm (dưới REMIND_MIN) và chưa có chuỗi thì không nhắc
  const none = careReminds({ ...base, shield: T0 + 40 * MIN, vip: { ...base.vip, streak: 1 } }, T0).map(r => r.k)
  assert.ok(!none.includes('shield') && !none.includes('streak'))
  const L = await loadText('vi')
  assert.equal(remindNote('shield')(L).tag, 'remind')
  assert.equal(remindNote('build')(L).tag, 'done')
})

test('nhắc lúc rời game: rương Nhật Khóa đủ mốc chưa nhận (2 giờ trước 0h), lễ đang tích điểm sắp đóng (2 giờ trước)', async () => {
  const base = advance(newGame(T0, 'Nhắc'), T0)
  let s = { ...base, levels: { ...base.levels, chuDien: 6 } }
  s = advance(s, T0 + 1000)
  const nk = s.fest.nhatKhoa!
  const tb = s.fest.tranhBa!
  s = {
    ...s,
    fest: {
      ...s.fest,
      nhatKhoa: { ...nk, base: { ...nk.base, build: metric(s, 'build') - 2 } }, // xây 2 lần: đủ mốc rương đầu
      tranhBa: { ...tb, bank: 120 },
    },
  }
  const got = Object.fromEntries(careReminds(s, s.time).map(r => [r.k, r.at]))
  assert.equal(got.chest, nextDay(s.time) - 120 * MIN)
  assert.equal(got.fest, festEnds(s, 'tranhBa', s.time) - 120 * MIN)
  const L = await loadText('vi')
  assert.equal(remindNote('chest')(L).tag, 'remind')
  assert.ok(remindNote('fest')(L).body.length > 10)
  // không có gì chờ: không nhắc
  const quiet = careReminds(advance(newGame(T0, 'Yên'), T0), T0).map(r => r.k)
  assert.ok(!quiet.includes('chest') && !quiet.includes('fest'))
})
