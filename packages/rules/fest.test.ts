import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DAY,
  ELDER_DUP_EXP,
  bonus,
  vipLevel,
  FESTS,
  addItems,
  advance,
  apply,
  festError,
  festOpen,
  festPoints,
  festProgress,
  festReady,
  festTokens,
  festBought,
  metric,
  migrate,
  newGame,
  type State,
} from './index.ts'

const MON = Date.UTC(2026, 0, 5, 3) // thứ Hai 10h giờ VN
const run = (s: State, a: object, t = s.time) => {
  const r = apply(s, a as never, t)
  if (!r.ok) throw new Error(r.error)
  return r.state
}

test('Thất Nhật Lễ: mỗi ngày đăng nhập mở thêm một quà, nhận đúng một lần, hết 14 ngày thì đóng', () => {
  let s = newGame(MON)
  assert.equal(festOpen(s, 'thatNhat', MON), true)
  assert.equal(festError(s, 'thatNhat', 1), 'not_done')
  s = run(s, { type: 'fest', id: 'thatNhat', i: 0 })
  assert.equal(s.res.linhThach, 1000 + 2000)
  assert.equal(s.items.thoiQuang15, 2)
  assert.equal(festError(s, 'thatNhat', 0), 'claimed')
  // bỏ hai ngày (server vẫn đưa state tới — không tính), hôm sau vào lại: chỉ tính ngày có vào game
  s = advance(s, MON + 3 * DAY)
  assert.equal(s.fest.thatNhat!.days, 1)
  s = run(s, { type: 'login' })
  s = run(s, { type: 'login' }) // vào lại trong ngày: không tính thêm
  assert.equal(s.fest.thatNhat!.days, 2)
  s = run(s, { type: 'fest', id: 'thatNhat', i: 1 })
  assert.equal(festError(s, 'thatNhat', 2), 'not_done')
  s = advance(s, MON + 14 * DAY)
  assert.equal(festOpen(s, 'thatNhat', s.time), false)
  assert.equal(festError(s, 'thatNhat', 2), 'locked')
})

test('Tân Thủ Chi Lộ: mục tiêu tính từ lúc lập tông môn; xong mục tiêu thì nhận được', () => {
  let s = newGame(MON)
  assert.equal(festError(s, 'tanThu', 0), 'not_done') // Chủ điện tầng 2
  s = run(s, { type: 'upgrade', building: 'chuDien' })
  s = advance(s, MON + 10 * 60_000)
  assert.equal(s.levels.chuDien, 2)
  assert.equal(festProgress(s, 'tanThu', 'hall'), 1) // tăng thêm 1 tầng, đích so tuyệt đối (tầng 2)
  s = run(s, { type: 'fest', id: 'tanThu', i: 0 })
  assert.equal(s.items.loBan15, 2)
  assert.ok(festReady(s, s.time) >= 1) // quà ngày đăng nhập đầu vẫn chờ
})

test('Tông Môn Tranh Bá: mỗi ngày một việc ra điểm, điểm dồn qua các giai đoạn, sang tuần thì làm lại', () => {
  const base = newGame(MON - 7 * DAY)
  let s: State = advance({ ...base, levels: { ...base.levels, chuDien: 6 } }, MON) // đủ tầng mở (5)
  assert.equal(festOpen(s, 'tranhBa', MON), true)
  assert.equal(festPoints(s, 'tranhBa'), 0)
  // hôm 1 (xây): nâng một công trình = 60 điểm
  s = run(
    { ...s, res: { linhThach: 1e6, linhThao: 1e6, linhKhoang: 1e6 } },
    { type: 'upgrade', building: 'tuLinhTran' },
  )
  s = advance(s, s.time + 60_000)
  assert.equal(festPoints(s, 'tranhBa'), 60)
  // hôm 2 (nghiên cứu): xây thêm không ra điểm, nhưng điểm hôm 1 vẫn giữ
  s = advance(s, MON + DAY)
  s = run(s, { type: 'upgrade', building: 'linhDien' })
  s = advance(s, s.time + 60_000)
  assert.equal(s.fest.tranhBa!.stage, 1)
  assert.equal(festPoints(s, 'tranhBa'), 60)
  // Chủ nhật: đóng; thứ Hai tuần sau: lượt mới, điểm về 0
  s = advance(s, MON + 6 * DAY)
  assert.equal(festOpen(s, 'tranhBa', s.time), false)
  s = advance(s, MON + 7 * DAY)
  assert.equal(festOpen(s, 'tranhBa', s.time), true)
  assert.equal(festPoints(s, 'tranhBa'), 0)
})

test('sự kiện: chưa đủ tầng thì khoá; phù tăng tốc được tính vào chỉ số speed', () => {
  let s = newGame(MON)
  assert.equal(festError(s, 'tranhBa', 0), 'locked')
  s = run({ ...s, items: addItems(s.items, { thoiQuang5: 3 }) }, { type: 'upgrade', building: 'chuDien' })
  s = run(s, { type: 'use', item: 'thoiQuang5', n: 1, job: 'build' })
  assert.equal(metric(s, 'speed'), 5)
})

test('save cũ (chưa có trung tâm sự kiện): nâng bản thì có sự kiện tân thủ từ hôm đó', () => {
  const { fest: _, born: __, ...old } = newGame(MON)
  const s = migrate(JSON.parse(JSON.stringify(old)))!
  assert.ok(s)
  assert.deepEqual(s.fest, {})
  assert.equal(festOpen(advance(s, MON + 1000), 'thatNhat', MON + 1000), true)
})

test('mọi sự kiện có quà cho mỗi mốc và khung giờ hợp lệ', () => {
  for (const [id, d] of Object.entries(FESTS)) {
    if (d.kind === 'points') {
      assert.equal(d.goals.length, d.rewards.length, id)
      assert.ok(
        d.goals.every((g, i) => i === 0 || g > d.goals[i - 1]),
        `${id}: mốc tăng dần`,
      )
      assert.ok(d.stages.length > 0, id)
    }
    if (d.kind === 'tasks') assert.ok(d.tasks.length > 0, id)
    if (d.kind === 'login') assert.ok(d.rewards.length > 0, id)
    if (d.window.kind === 'week')
      assert.ok(
        d.window.days.every(x => x >= 0 && x <= 6),
        id,
      )
  }
})

test('sự kiện tân thủ tính theo giờ từ lúc lập tông môn (lập lúc 23h vẫn đủ 24 giờ ngày đầu)', () => {
  const late = MON + 13 * 3_600_000 // 23h giờ VN
  const s = newGame(late)
  const t = late + 20 * 3_600_000
  assert.equal(festOpen(advance(s, t), 'tanThu', t), true)
  assert.equal(advance(s, t).fest.tanThu!.stage, 0) // vẫn là ngày đầu
  assert.equal(festOpen(advance(s, late + 7 * DAY + 1), 'tanThu', late + 7 * DAY + 1), false)
})

test('Tông Lệnh Bảo Khố: làm việc ra lệnh bài, đổi quà (trừ lệnh bài), mỗi món tối đa max lần, một chấm đỏ', () => {
  let s = newGame(MON)
  const d = FESTS.tongLenh
  assert.ok(d.kind === 'shop')
  assert.equal(festTokens(s, 'tongLenh'), 0)
  assert.equal(festError(s, 'tongLenh', 0), 'not_done')
  // nghiên cứu, xây: mỗi tầng ra lệnh bài theo stages
  s = { ...s, tech: { tuLinh: 5 }, levels: { ...s.levels, tuLinhTran: 3 } }
  const earned = 5 * d.stages[0].tech! + 3 * d.stages[0].build!
  assert.equal(festTokens(s, 'tongLenh'), earned)
  assert.equal(festReady(s, s.time) >= 1, true)
  const ng = d.shop.findIndex(x => x.reward.items?.nganDuyen) // Ngân thiếp: 10 lệnh bài, tối đa 3
  s = run(s, { type: 'fest', id: 'tongLenh', i: ng })
  assert.equal(s.items.nganDuyen, 1)
  assert.equal(festTokens(s, 'tongLenh'), earned - d.shop[ng].price)
  s = run(run(s, { type: 'fest', id: 'tongLenh', i: ng }), { type: 'fest', id: 'tongLenh', i: ng })
  assert.equal(festBought(s, 'tongLenh', ng), 3)
  assert.equal(festError(s, 'tongLenh', ng), 'claimed', 'hết hạn mức')
  assert.equal(festError(s, 'tongLenh', 0), 'not_done', 'không đủ lệnh bài')
})

test('quà trưởng lão đã có thì đổi thành kinh nghiệm, không mất', () => {
  let s = newGame(MON)
  s = { ...s, elders: { ...s.elders, nhuYen: 0 }, fest: { ...s.fest, thatNhat: { ...s.fest.thatNhat!, days: 7 } } }
  for (let i = 0; i < 7; i++) s = run(s, { type: 'fest', id: 'thatNhat', i })
  assert.equal(s.elders.nhuYen, ELDER_DUP_EXP)
})

test('Hương Hỏa: chuỗi ngày vào game 40 → 200 điểm, lỡ một ngày về đầu; lên cấp có tăng ích, rương mỗi ngày, xong miễn phí', () => {
  let s = newGame(MON)
  assert.deepEqual([s.vip.pts, s.vip.streak], [40, 1])
  for (let d = 1; d < 9; d++) s = run(advance(s, MON + d * DAY), { type: 'login' })
  assert.equal(s.vip.streak, 9)
  assert.equal(s.vip.pts, 40 + 60 + 80 + 100 + 120 + 150 + 200 + 200 + 200)
  assert.equal(vipLevel(s), 2) // 1150 điểm ≥ 600
  assert.ok(bonus(s, 'prod') > 0)
  s = run(advance(s, MON + 11 * DAY), { type: 'login' }) // bỏ 2 ngày
  assert.equal(s.vip.streak, 1)
  s = run(s, { type: 'vipChest' })
  assert.deepEqual(apply(s, { type: 'vipChest' }, s.time), { ok: false, error: 'claimed' })
  // xong miễn phí: cấp 2 = 1 phút; việc còn nhiều hơn thì chưa, còn 1 phút thì xong ngay
  const rich = { linhThach: 1e6, linhThao: 1e6, linhKhoang: 1e6 }
  s = run({ ...s, res: rich, levels: { ...s.levels, chuDien: 6 } }, { type: 'upgrade', building: 'chuDien' })
  assert.deepEqual(apply(s, { type: 'finish', job: 'build' }, s.time), { ok: false, error: 'not_done' })
  const near = s.queue[0].finishAt - 60_000
  s = run(advance(s, near), { type: 'finish', job: 'build' })
  assert.equal(s.queue.length, 0)
})
