import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ARENA_TRIES,
  DAY,
  DRILL_EVERY,
  DRILL_GIFTS,
  FRIENDS_MAX,
  GUEST_EVERY,
  GUEST_GIFTS,
  QUIZ_DAY,
  QUIZ_GIFTS,
  QUIZ_KEY,
  MAX_LEVEL,
  SIDE_GIFTS,
  SECLUDE_COOL,
  STRATS,
  STRAT_HALL,
  TRIAL_AP,
  TRIAL_GATES,
  advance,
  apOf,
  apply,
  drillFoe,
  expAt,
  festOpen,
  guestAt,
  guestGift,
  newGame,
  quizOf,
  secluded,
  sideAt,
  sideGoal,
  sideReady,
  seasonEnd,
  storage,
  trialElite,
  trialFoe,
  thiefNow,
  THIEF_TRIES,
  type State,
} from './index.ts'
import { might } from './combat.ts'
import { worldAct } from './world.ts'

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

test('Tông vụ: 4 dòng, mỗi dòng một việc; nhận từng việc thì hiện việc kế, quà vào túi; dòng linh mạch hết ở tầng tối đa', () => {
  let s = sect() // mọi công trình tầng 10
  assert.deepEqual(sideGoal('linhMach', 0), {
    line: 'linhMach',
    n: 2,
    id: 'tuLinhTran',
    reward: SIDE_GIFTS.linhMach[0],
  })
  assert.equal(sideGoal('linhMach', 3)?.n, 3, 'ba công trình rồi lên tầng')
  assert.equal(sideGoal('linhMach', 3 * (MAX_LEVEL - 1)), null, 'hết ở tầng 25')
  assert.deepEqual(
    [0, 1, 2, 3].map(k => sideGoal('luyenBinh', k)?.n),
    [100, 300, 600, 1000],
  )
  assert.equal(sideReady(s), 1, 'chỉ linh mạch xong sẵn (tầng 10 ≥ 2)')
  assert.deepEqual(run(s, { type: 'side', line: 1 }), { ok: false, error: 'not_done' })
  // nhận hết việc linh mạch tới tầng 10: 27 việc (tầng 2…10 × 3 công trình), rồi dừng ở tầng 11
  const before = s.items.loBan60 ?? 0
  for (let k = 0; k < 27; k++) {
    const r = run(s, { type: 'side', line: 0 })
    assert.ok(r.ok, `việc ${k}`)
    s = r.state
  }
  assert.deepEqual(s.side, [27, 0, 0, 0])
  assert.equal(sideAt(s, 0)?.n, 11)
  assert.deepEqual(run(s, { type: 'side', line: 0 }), { ok: false, error: 'not_done' })
  assert.equal((s.items.loBan60 ?? 0) - before, 12, 'bậc hai (tầng 7…11): đã nhận tầng 7…10 × 3 công trình')
  assert.equal(sideReady(s), 0)
  // thắng trận / tuyển đệ tử: đọc bộ đếm tích luỹ
  s = { ...s, stats: { ...s.stats, won: 5, trained: 100 } }
  assert.equal(sideReady(s), 2)
})

test('Bế Quan Lệnh: không ai cướp được, tông môn chỉ nhận thư / xuất quan; phải gọi đội về; xuất quan trả khiên cũ, hồi 3 ngày', () => {
  const s0 = { ...sect(), shield: 0 }
  const t = s0.time
  assert.deepEqual(run({ ...s0, frenzy: t + 60_000 }, { type: 'seclude', days: 3 }), { ok: false, error: 'frenzy' })
  assert.deepEqual(run(s0, { type: 'seclude', days: 5 }), { ok: false, error: 'bad' }, 'chỉ 3 / 7 / 14 ngày')
  const r = run(s0, { type: 'seclude', days: 3 })
  assert.ok(r.ok)
  const s = r.state
  assert.ok(s.shield >= t + 3 * DAY && secluded(s), 'khiên tới hết hạn bế quan')
  assert.deepEqual(
    run(s, { type: 'upgrade', building: 'linhDien' }),
    { ok: false, error: 'secluded' },
    'không làm gì được',
  )
  assert.equal(run(s, { type: 'login' }).ok, true, 'điểm danh vẫn được')
  const w = worldAct(new Map([[1, s]]), 1, { type: 'helpAll' }, t, 1)
  assert.deepEqual(w, { ok: false, error: 'secluded' }, 'không làm gì với giới')
  const out = run(s, { type: 'unseclude' })
  assert.ok(out.ok && out.state.shield === 0 && !secluded(out.state), 'xuất quan: trả khiên cũ')
  assert.deepEqual(run(out.state, { type: 'seclude', days: 3 }), { ok: false, error: 'cooldown' })
  assert.ok(apply(out.state, { type: 'seclude', days: 7 }, t + SECLUDE_COOL + 1).ok, 'hết hồi thì bế quan lại được')
  assert.ok(!secluded({ ...s, time: t + 3 * DAY + 1 }), 'hết hạn thì tự xuất quan')
})

test('Luận Kiếm Lệnh: hết lượt Luận Kiếm Đài thì dùng lệnh thêm một lượt; không dùng thẳng từ túi', () => {
  const s0 = { ...sect(), items: { ...sect().items, luanKiem: 2 } }
  assert.deepEqual(run(s0, { type: 'use', item: 'luanKiem', n: 1 }), { ok: false, error: 'bad' }, 'không dùng từ túi')
  const r = run(s0, { type: 'arenaTicket' })
  assert.ok(r.ok)
  assert.equal(r.state.arena!.left, ARENA_TRIES + 1)
  assert.equal(r.state.items.luanKiem, 1)
  const none = run({ ...s0, items: {} }, { type: 'arenaTicket' })
  assert.deepEqual(none, { ok: false, error: 'no_item' })
})

test('Thí Luyện Yêu Hoàng: chọn độ khó một lần mỗi lượt; đánh từng cửa bằng quân thật, tốn hành lực; thắng qua cửa, điểm theo độ khó', () => {
  const at = (t: number) => ({ ...advance(sect(), t), seed: 777 })
  let t = T0
  while (!festOpen(at(t), 'yeuHoang', t)) t += DAY
  let s = at(t)
  const go = { type: 'trialFight', elder: 'thanhPhong', army: { kiem3: 1000 } }
  assert.deepEqual(run(s, go), { ok: false, error: 'locked' }, 'chưa chọn độ khó')
  assert.deepEqual(run(s, { type: 'trialStart', d: 5 }), { ok: false, error: 'bad' })
  const r0 = run(s, { type: 'trialStart', d: 1 })
  assert.ok(r0.ok)
  s = r0.state
  assert.deepEqual(run(s, { type: 'trialStart', d: 4 }), { ok: false, error: 'claimed' }, 'chọn rồi không đổi')
  // client (mầm 0): chưa đổi gì, chờ server
  const c = run({ ...s, seed: 0 }, go)
  assert.ok(c.ok)
  assert.equal(c.state.reports.length, s.reports.length)
  const ap = apOf(s, s.time)
  const r1 = run(s, go)
  assert.ok(r1.ok)
  const s1 = r1.state
  const rep = s1.reports.at(-1)!
  assert.equal(rep.kind, 'trial')
  assert.equal(apOf(s1, s1.time), ap - TRIAL_AP)
  assert.ok(rep.win, 'cửa đầu độ khó Thường: đội 1000 đệ tử bậc 3 thắng')
  assert.equal(s1.trial!.gate, 1)
  assert.equal(s1.stats.trial, 2, 'độ khó Thường: 2 điểm mỗi cửa')
  assert.ok((s1.troops.kiem3 ?? 0) < 1000 || s1.reports.at(-1)!.dead, 'quân thật: có thương vong')
  assert.deepEqual(run({ ...s1, ap: { n: 0, at: s1.time } }, go), { ok: false, error: 'not_enough' })
  assert.deepEqual(run({ ...s1, trial: { ...s1.trial!, gate: TRIAL_GATES } }, go), { ok: false, error: 'max_level' })
  // cửa thứ 10 là yêu tướng tinh anh; độ khó cao mạnh gấp bội
  assert.ok(trialElite(9) && !trialElite(8))
  assert.ok(might(trialFoe(s, 0, 9)) > might(trialFoe(s, 0, 8)) * 1.4)
  assert.ok(might(trialFoe(s, 4, 0)) > might(trialFoe(s, 0, 0)) * 10)
  // lượt lễ sau: chọn lại độ khó
  let u = t + 5 * DAY
  while (!festOpen(advance(s1, u), 'yeuHoang', u)) u += DAY
  assert.ok(run(advance(s1, u), { type: 'trialStart', d: 4 }).ok)
})

test('Dạ Hành Đạo Tặc: mỗi ngày 2 lượt đội ảo (không mất quân), sát thương phần nghìn; hôm nay cao nhất mở rương ngày (nhận lại ngày sau), kỷ lục giữ cả lượt', () => {
  const at = (t: number) => ({ ...advance(sect(), t), seed: 4321 })
  let t = T0
  while (!festOpen(at(t), 'daTac', t) || at(t).fest.daTac!.stage !== 0) t += DAY
  let s = at(t)
  const go = { type: 'thief', elder: 'thanhPhong', army: { kiem3: 1000 } }
  const c = run({ ...s, seed: 0 }, go)
  assert.ok(c.ok)
  assert.equal(c.state.reports.length, s.reports.length, 'client chờ server')
  const r1 = run(s, go)
  assert.ok(r1.ok)
  s = r1.state
  const rep = s.reports.at(-1)!
  assert.equal(rep.kind, 'thief')
  assert.ok(rep.i > 0 && rep.i < 1000, `sát thương ${rep.i}‰`)
  assert.equal(s.troops.kiem3, 1000, 'đội ảo: không mất quân')
  assert.deepEqual(thiefNow(s), { left: THIEF_TRIES - 1, best: rep.i, record: rep.i })
  const r2 = run(s, go)
  assert.ok(r2.ok)
  s = r2.state
  assert.deepEqual(run(s, go), { ok: false, error: 'limit' }, 'hết lượt hôm nay')
  // rương ngày: nhận theo sát thương hôm nay, ngày sau nhận lại được
  const best = thiefNow(s).best
  const tier = [100, 250, 450, 700].filter(g => best >= g).length
  if (tier) {
    const got = run(s, { type: 'fest', id: 'daTac', i: 0 })
    assert.ok(got.ok)
    s = got.state
    assert.deepEqual(run(s, { type: 'fest', id: 'daTac', i: 0 }), { ok: false, error: 'claimed' })
  }
  const next = advance(s, t + DAY)
  assert.deepEqual(
    thiefNow(next),
    { left: THIEF_TRIES, best: 0, record: thiefNow(s).record },
    'ngày mới: lượt mới, kỷ lục giữ',
  )
  assert.deepEqual(run(next, { type: 'fest', id: 'daTac', i: 0 }), { ok: false, error: 'not_done' })
})
