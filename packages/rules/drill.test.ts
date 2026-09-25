import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DAY,
  DRILL_EVERY,
  DRILL_GIFTS,
  FRIENDS_MAX,
  GUEST_EVERY,
  GUEST_GIFTS,
  QUIZ_DAY,
  QUIZ_GIFTS,
  QUIZ_KEY,
  STRATS,
  STRAT_HALL,
  apply,
  drillFoe,
  expAt,
  guestAt,
  guestGift,
  newGame,
  quizOf,
  seasonEnd,
  storage,
  type State,
} from './index.ts'
import { might } from './combat.ts'

const T0 = Date.UTC(2026, 8, 23, 3)
function sect(): State {
  const s = newGame(T0, 'Luận Võ')
  const levels = Object.fromEntries(Object.keys(s.levels).map(k => [k, 10])) as State['levels']
  return { ...s, levels, seed: 12345, troops: { ...s.troops, kiem3: 1000 }, elders: { thanhPhong: expAt(20) } }
}
const run = (s: State, a: object) => apply(s, a as never, s.time)

test('Luận Võ Liên Hoàn: đội ảo đấu liên tiếp giáo đầu mạnh dần, quân không hồi; cứ 3 thắng chọn công pháp cho giáo đầu; mốc quà; thua hết phiên', () => {
  let s = sect()
  assert.deepEqual(
    run(
      { ...s, levels: { ...s.levels, chuDien: 5 } },
      { type: 'drillStart', elder: 'thanhPhong', army: { kiem3: 1000 } },
    ),
    {
      ok: false,
      error: 'locked',
    },
  )
  const r0 = run(s, { type: 'drillStart', elder: 'thanhPhong', army: { kiem3: 1000 } })
  assert.ok(r0.ok)
  s = r0.state
  assert.deepEqual(
    run(s, { type: 'drillStart', elder: 'thanhPhong', army: { kiem3: 1 } }),
    { ok: false, error: 'claimed' },
    'mỗi ngày một phiên',
  )
  const f0 = might(drillFoe(s, s.drill!))
  let fights = 0
  while (!s.drill!.over && fights < 60) {
    if (s.drill!.offer) {
      assert.equal(new Set(s.drill!.offer).size, 3, 'ba lựa chọn khác nhau')
      assert.deepEqual(run(s, { type: 'drillFight' }), { ok: false, error: 'busy' }, 'chọn công pháp trước')
      const picked = run(s, { type: 'drillPick', i: 0 })
      assert.ok(picked.ok)
      s = picked.state
      continue
    }
    const before = s.drill!.army.kiem3 ?? 0
    const r = run(s, { type: 'drillFight' })
    assert.ok(r.ok)
    s = r.state
    fights++
    assert.ok((s.drill!.army.kiem3 ?? 0) <= before, 'quân không hồi giữa các trận')
    assert.equal(s.reports.at(-1)!.kind, 'drill')
  }
  const d = s.drill!
  assert.ok(d.over, 'cuối cùng cũng thua')
  assert.ok(d.wins >= DRILL_EVERY, `trận đầu dễ: thắng ${d.wins}`)
  assert.equal(d.mods.length, Math.floor(d.wins / DRILL_EVERY) - (d.offer ? 1 : 0), 'mỗi 3 thắng một công pháp')
  assert.ok(might(drillFoe(s, d)) > f0, 'giáo đầu mạnh dần')
  assert.equal(d.got, DRILL_GIFTS.filter(g => d.wins >= g.n).length, 'mốc quà đã nhận')
  assert.equal(s.troops.kiem3, 1000, 'đội ảo: quân thật không mất')
  assert.deepEqual(run(s, { type: 'drillFight' }), { ok: false, error: 'locked' }, 'thua là hết phiên hôm nay')
  assert.ok(
    run({ ...s, time: s.time + DAY }, { type: 'drillStart', elder: 'thanhPhong', army: { kiem3: 1000 } }).ok,
    'ngày mới: phiên mới',
  )
})

test('Vân Du Khách: tới giờ thì ghé, chạm nhận quà xoay vòng; không dồn; hẹn lần sau', () => {
  const s0 = sect()
  const at = guestAt(s0)
  assert.equal(at, (s0.born ?? 0) + GUEST_EVERY, 'lần đầu: một chu kỳ sau khi lập tông môn')
  assert.deepEqual(apply(s0, { type: 'guest' }, at - 1), { ok: false, error: 'cooldown' })
  const r = apply(s0, { type: 'guest' }, at + 10 * GUEST_EVERY)
  assert.ok(r.ok)
  assert.equal(r.state.items.thoiQuang15, (s0.items.thoiQuang15 ?? 0) + 1, 'quà đầu trong vòng')
  assert.equal(guestAt(r.state), at + 10 * GUEST_EVERY + GUEST_EVERY, 'không dồn: hẹn một chu kỳ sau lúc nhận')
  assert.deepEqual(guestGift(r.state), GUEST_GIFTS[1], 'quà kế tiếp xoay vòng')
})

test('Chiến lược mùa: chọn một lần mỗi mùa, cộng tăng ích; luân hồi (hết mùa) thì chọn lại', () => {
  const s0 = sect()
  const low = { ...s0, levels: { ...s0.levels, chuDien: STRAT_HALL - 1 } }
  assert.deepEqual(apply(low, { type: 'strat', id: 'tichCoc' }, s0.time), { ok: false, error: 'locked' })
  const r = apply(s0, { type: 'strat', id: 'tichCoc' }, s0.time)
  assert.ok(r.ok)
  assert.equal(storage(r.state), Math.round((storage(s0) * (1 + STRATS.tichCoc.storage)) / (1 + 0)), 'kho +20 %')
  assert.deepEqual(
    apply(r.state, { type: 'strat', id: 'dieuThu' }, s0.time),
    { ok: false, error: 'claimed' },
    'mỗi mùa một lần',
  )
  const next = seasonEnd(r.state, s0.time + DAY, 1)
  assert.equal(next.strat, undefined, 'mùa mới: chọn lại')
})

test('kết giao đạo hữu: thêm / bỏ, không trùng, tối đa FRIENDS_MAX', () => {
  let s = sect()
  s = (apply(s, { type: 'friend', pid: 7, on: true }, s.time) as { state: State }).state
  s = (apply(s, { type: 'friend', pid: 7, on: true }, s.time) as { state: State }).state
  assert.deepEqual(s.friends, [7], 'không trùng')
  s = (apply(s, { type: 'friend', pid: 7, on: false }, s.time) as { state: State }).state
  assert.deepEqual(s.friends, [])
  const full = { ...s, friends: Array.from({ length: FRIENDS_MAX }, (_, i) => i + 100) }
  assert.deepEqual(apply(full, { type: 'friend', pid: 9, on: true }, s.time), { ok: false, error: 'full' })
})

test('Vấn Đạo Đài: năm câu khác nhau mỗi ngày, trả lời lần lượt, xong nhận quà theo số câu đúng; ngày mới làm lại', () => {
  let s = sect()
  const day = Math.floor((s.time + 7 * 3_600_000) / DAY)
  const list = quizOf(day)
  assert.equal(new Set(list).size, QUIZ_DAY, 'năm câu khác nhau')
  assert.notDeepEqual(quizOf(day + 1), list, 'ngày khác bộ câu khác')
  const before = s.items.nganDuyen ?? 0
  for (let k = 0; k < QUIZ_DAY; k++) {
    const pick = k === 0 ? (QUIZ_KEY[list[k]] + 1) % 4 : QUIZ_KEY[list[k]] // câu đầu sai, còn lại đúng
    const r = apply(s, { type: 'quiz', pick }, s.time)
    assert.ok(r.ok)
    s = r.state
    assert.equal(s.quiz!.last, k !== 0)
  }
  assert.deepEqual([s.quiz!.n, s.quiz!.right], [QUIZ_DAY, QUIZ_DAY - 1])
  assert.equal(
    (s.items.nganDuyen ?? 0) - before,
    QUIZ_GIFTS[QUIZ_DAY - 1].items?.nganDuyen ?? 0,
    'quà theo số câu đúng',
  )
  assert.deepEqual(apply(s, { type: 'quiz', pick: 0 }, s.time), { ok: false, error: 'claimed' }, 'hôm nay xong rồi')
  assert.ok(apply(s, { type: 'quiz', pick: 0 }, s.time + DAY).ok, 'ngày mới làm lại')
})
