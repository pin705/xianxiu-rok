import test from 'node:test'
import assert from 'node:assert/strict'
import { festAllyBoard, festBoard, festPrize, freshWorld, type Players, type World } from './world.ts'
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
  festStagePts,
  festProgress,
  festReady,
  festTokens,
  festBought,
  metric,
  migrate,
  newGame,
  VIP_SHOP,
  vipGot,
  wheelElder,
  wheelFree,
  weekOf,
  weekStart,
  festEnded,
  festKey,
  festWindow,
  festDrop,
  festStar,
  grant,
  TRAIN_PTS,
  festReady as ready,
  pushReport,
  noGain,
  FEST_PRIZES,
  expAt,
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
  // Khai Sơn Thất Nhật: nhánh ngày 2 chưa mở dù đã đạt (tổng cấp trưởng lão); sang ngày 2 thì nhận được
  const d = FESTS.tanThu as Extract<(typeof FESTS)['tanThu'], { kind: 'tasks' }>
  const k = d.tasks.findIndex(t => t.day === 1 && t.m === 'elder')
  const strong = { ...s, elders: { thanhPhong: expAt(40) } }
  assert.equal(festError(strong, 'tanThu', k), 'not_done', 'nhánh ngày 2 chưa mở')
  const day2 = advance(strong, MON + DAY + 1000)
  assert.equal(festError(day2, 'tanThu', k), null)
  // rương cuối theo số việc đã nhận: chưa đủ thì chưa mở, đủ thì nhận được
  const chest = d.tasks.length
  assert.equal(festError(day2, 'tanThu', chest), 'not_done')
  const many = { ...day2, fest: { ...day2.fest, tanThu: { ...day2.fest.tanThu!, got: [0, 1, 2, 3, 4, 5, 6, 7] } } }
  assert.equal(festError(many, 'tanThu', chest), null)
  assert.equal(festError(many, 'tanThu', chest + 1), 'not_done')
})

test('Tông Môn Tranh Bá: mỗi ngày một việc ra điểm, điểm dồn qua các giai đoạn, sang tuần thì làm lại', () => {
  const base = newGame(MON - 7 * DAY)
  const rich = { linhThach: 1e7, linhThao: 1e7, linhKhoang: 1e7 }
  let s: State = advance({ ...base, levels: { ...base.levels, chuDien: 6, dienVoTruong: 6 }, res: rich }, MON) // đủ tầng mở (5)
  assert.equal(festOpen(s, 'tranhBa', MON), true)
  assert.equal(festPoints(s, 'tranhBa'), 0)
  // ải 1 (luyện binh): điểm theo bậc — 10 đệ tử bậc 2 = 10 × TRAIN_PTS[1]; nâng 10 bậc 1 lên bậc 2 chỉ tính phần chênh
  s = run(s, { type: 'train', unit: 'kiem2', n: 10 })
  s = advance(s, s.train!.finishAt + 1)
  assert.equal(festPoints(s, 'tranhBa'), 10 * TRAIN_PTS[1])
  s = run({ ...s, troops: { ...s.troops, kiem1: 10 } }, { type: 'promote', unit: 'kiem1', n: 10 })
  s = advance(s, s.train!.finishAt + 1)
  assert.equal(festPoints(s, 'tranhBa'), 10 * TRAIN_PTS[1] + 10 * (TRAIN_PTS[1] - TRAIN_PTS[0]))
  const day1 = festPoints(s, 'tranhBa')
  // ải 2 (trảm yêu): tuyển thêm không ra điểm, nhưng điểm ải 1 vẫn giữ
  s = advance(s, MON + DAY)
  s = run(s, { type: 'train', unit: 'kiem2', n: 10 })
  s = advance(s, s.train!.finishAt + 1)
  assert.equal(s.fest.tranhBa!.stage, 1)
  assert.equal(festPoints(s, 'tranhBa'), day1)
  // trưởng lão của đợt: mỗi người 4 lượt liền rồi đổi
  const wk = s.fest.tranhBa!.key
  assert.ok(festStar('tranhBa', wk))
  assert.equal(festStar('tranhBa', 4 * Math.floor(wk / 4)), festStar('tranhBa', 4 * Math.floor(wk / 4) + 3))
  assert.notEqual(festStar('tranhBa', 4 * Math.floor(wk / 4)), festStar('tranhBa', 4 * Math.floor(wk / 4) + 4))
  assert.equal(festStar('tramYeu', wk), undefined)
  // quà hạng có tín vật (thư): nhận là cộng vào tín vật của người đó
  const star = festStar('tranhBa', wk)!
  assert.equal(grant(s, { tokens: { [star]: 30 } }).tokens[star], (s.tokens[star] ?? 0) + 30)
  // bảng ải: ải 1 ghi lại điểm riêng khi sang ải 2; ải 2 tính sống
  assert.equal(festStagePts(s, 'tranhBa', 0), day1)
  assert.equal(festStagePts(s, 'tranhBa', 1), 0)
  const hunt = (st: State, n: number) => ({ ...st, stats: { ...st.stats, huntLv: (st.stats.huntLv ?? 0) + n } })
  s = hunt(s, 5)
  assert.equal(festStagePts(s, 'tranhBa', 1), 5 * 20)
  // Chủ nhật: đóng — điểm khoá lại (việc làm trước lúc trao quà đầu tuần sau không tính); thứ Hai tuần sau: lượt mới, điểm về 0
  s = advance(s, MON + 6 * DAY)
  assert.equal(festOpen(s, 'tranhBa', s.time), false)
  const final = festPoints(s, 'tranhBa')
  assert.equal(final, day1 + 5 * 20)
  assert.deepEqual(s.fest.tranhBa!.sp, [day1, 5 * 20], 'ải bỏ qua khi vắng mặt: không ghi')
  assert.equal(festPoints(hunt(s, 50), 'tranhBa'), final)
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
  assert.equal(festOpen(advance(s, late + 7 * DAY + 1), 'tanThu', late + 7 * DAY + 1), true, 'Khai Sơn: 8 ngày')
  assert.equal(festOpen(advance(s, late + 8 * DAY + 1), 'tanThu', late + 8 * DAY + 1), false)
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

test('Tông Môn Tranh Bá có xếp hạng: bảng lượt lễ theo điểm (chỉ người trong lượt đó, có điểm), quà hạng 1 · 2–3 · 4–10', () => {
  const t = MON + 3 * 3_600_000
  const mk = (hunted: number, key = weekOf(t)) => {
    const s = advance(newGame(MON), t) // chưa làm gì trong lượt: điểm chỉ là bank đặt tay
    const f = s.fest.tranhBa!
    return { ...s, fest: { ...s.fest, tranhBa: { ...f, key, bank: hunted } } }
  }
  const ps = new Map([
    [1, mk(100)],
    [2, mk(300)],
    [3, mk(0)],
    [4, mk(500, weekOf(t) - 1)],
  ])
  assert.deepEqual(
    festBoard(ps, 'tranhBa', weekOf(t)).map(([pid]) => pid),
    [2, 1],
    'lượt này, có điểm, cao trước',
  )
  assert.deepEqual(
    festBoard(ps, 'tranhBa', weekOf(t), new Set([2])).map(([pid]) => pid),
    [1],
    'bỏ tông môn NPC',
  )
  assert.deepEqual([festPrize(0), festPrize(2), festPrize(9)], [FEST_PRIZES[0], FEST_PRIZES[1], FEST_PRIZES[2]])
  // bảng ải: chỉ điểm của ải đó
  const staged = new Map([
    [1, { ...mk(0), stats: { ...mk(0).stats, trainPts: (mk(0).stats.trainPts ?? 0) + 40 } }],
    [2, mk(300)],
  ])
  assert.deepEqual(festBoard(staged, 'tranhBa', weekOf(t), new Set(), 0), [[1, 40]])
})

test('Thiên Cơ Luân: mỗi ngày một lượt miễn phí, lượt thêm tốn lệnh kiếm từ việc trong lễ, ô trúng theo mầm server (client chờ), lượt thứ 30 chắc trúng ô lớn', () => {
  const d = FESTS.thienCo
  assert.equal(d.kind, 'wheel')
  if (d.kind !== 'wheel') return
  let t = MON
  const base = { ...newGame(MON), levels: { ...newGame(MON).levels, chuDien: 7 } }
  while (!festOpen(advance(base, t), 'thienCo', t)) t += DAY
  let s: State = { ...advance(base, t), seed: 777 }
  const elder = wheelElder(s, 'thienCo')!
  assert.ok(d.elders.includes(elder), 'trưởng lão chủ lễ')
  assert.equal(festTokens(s, 'thienCo'), 0)
  assert.deepEqual(apply({ ...s, seed: 0 }, { type: 'spin', id: 'thienCo', n: 1 }, t), {
    ok: true,
    state: { ...s, seed: 0 },
  })
  s = run(s, { type: 'spin', id: 'thienCo', n: 1 })
  assert.equal(s.fest.thienCo!.got.length, 1, 'lượt miễn phí')
  assert.equal(festTokens(s, 'thienCo'), 0, 'miễn phí không tốn lệnh')
  assert.deepEqual(apply(s, { type: 'spin', id: 'thienCo', n: 1 }, t), { ok: false, error: 'not_enough' })
  // săn 5 yêu thú = 10 lệnh = một lượt
  s = { ...s, stats: { ...s.stats, hunted: (s.stats.hunted ?? 0) + 5 } }
  assert.equal(festTokens(s, 'thienCo'), d.cost)
  s = run(s, { type: 'spin', id: 'thienCo', n: 1 })
  assert.equal(festTokens(s, 'thienCo'), 0)
  // nhiều lệnh: quay tới lượt thứ 30 — chắc trúng ô đầu; tín vật cộng đúng các ô tín vật đã trúng
  s = { ...s, stats: { ...s.stats, hunted: (s.stats.hunted ?? 0) + 500 } }
  s = run(run(s, { type: 'spin', id: 'thienCo', n: 10 }), { type: 'spin', id: 'thienCo', n: 10 })
  while (s.fest.thienCo!.got.length < 29) s = run(s, { type: 'spin', id: 'thienCo', n: 1 })
  s = run(s, { type: 'spin', id: 'thienCo', n: 1 })
  const got = s.fest.thienCo!.got
  assert.equal(got[29], 0, 'lượt 30: ô lớn nhất')
  const tokens = got.reduce((n, i) => n + (d.slots[i].token ?? 0), 0)
  assert.equal(s.tokens[elder] ?? 0, tokens)
  // hôm sau lại có lượt miễn phí
  const next = advance(s, t + DAY)
  assert.equal(wheelFree(next, 'thienCo', t + DAY), true)
  assert.equal(wheelFree(s, 'thienCo', t), false)
})

test('Hương Hỏa Các: món mở theo cấp, mỗi tuần mua có hạn (thứ Hai làm mới), giá nhân tầng Chủ điện', () => {
  const rich = { linhThach: 1e6, linhThao: 1e6, linhKhoang: 1e6 }
  let s: State = { ...newGame(MON), res: rich, levels: { ...newGame(MON).levels, chuDien: 5 } }
  assert.equal(apply(s, { type: 'vipBuy', item: 'nope' } as never, s.time).ok, false, 'món lạ')
  assert.deepEqual(apply(s, { type: 'vipBuy', item: 'thoiQuang15' }, s.time), { ok: false, error: 'locked' }, 'cấp 0')
  s = { ...s, vip: { ...s.vip, pts: 200 } } // cấp 1
  const x = VIP_SHOP.find(y => y.item === 'thoiQuang15')!
  for (let k = 0; k < x.week; k++) s = run(s, { type: 'vipBuy', item: 'thoiQuang15' })
  assert.equal(s.items.thoiQuang15, x.n * x.week)
  assert.equal(s.res[x.res], 1e6 - x.price * 5 * x.week)
  assert.deepEqual(apply(s, { type: 'vipBuy', item: 'thoiQuang15' }, s.time), { ok: false, error: 'claimed' })
  assert.deepEqual(apply(s, { type: 'vipBuy', item: 'loBan60' }, s.time), { ok: false, error: 'locked' }, 'món cấp 2')
  const sun = MON + 6 * DAY
  assert.deepEqual(apply(advance(s, sun), { type: 'vipBuy', item: 'thoiQuang15' }, sun), {
    ok: false,
    error: 'claimed',
  })
  s = run(advance(s, MON + 7 * DAY), { type: 'vipBuy', item: 'thoiQuang15' })
  assert.equal(vipGot(s, s.time).thoiQuang15, 1, 'thứ Hai tuần sau: làm mới')
  const poor = { ...s, res: { ...s.res, linhKhoang: 0 } }
  assert.deepEqual(apply(poor, { type: 'vipBuy', item: 'hanhLuc50' }, s.time), { ok: false, error: 'not_enough' })
  assert.deepEqual(migrate(JSON.parse(JSON.stringify(s)))?.vip.shop, s.vip.shop, 'lưu / nạp lại được')
})

test('lễ theo lịch (Trung Thu): mở 5 ngày quanh rằm mỗi năm, mỗi năm một lần mở mới; làm việc ra Nguyệt Bính', () => {
  const at = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d, 5) // 12h trưa giờ VN
  const s = { ...newGame(at(2026, 9, 1)), levels: { ...newGame(at(2026, 9, 1)).levels, chuDien: 5 } }
  assert.equal(festOpen(advance(s, at(2026, 9, 22)), 'trungThu', at(2026, 9, 22)), false, 'trước lễ')
  assert.equal(festOpen(advance(s, at(2026, 9, 25)), 'trungThu', at(2026, 9, 25)), true, 'đúng rằm tháng Tám 2026')
  assert.equal(festOpen(advance(s, at(2026, 9, 28)), 'trungThu', at(2026, 9, 28)), false, 'hết lễ')
  assert.equal(festOpen(advance(s, at(2027, 9, 15)), 'trungThu', at(2027, 9, 15)), true, 'năm sau theo lịch âm')
  // thắng trận ra Nguyệt Bính (điểm của khung)
  let x = advance(s, at(2026, 9, 24))
  x = { ...x, stats: { ...x.stats, won: x.stats.won + 5 } }
  assert.equal(
    festTokens(advance(x, at(2026, 9, 24) + 1000), 'trungThu'),
    5 * (FESTS.trungThu.kind === 'shop' ? (FESTS.trungThu.stages[0].win ?? 0) : 0),
  )
})

test('Tân Xuân Khai Sơn (lì xì 7 ngày từ mùng Một) và Đông Chí Tuyết Dạ (21–25/12) mở đúng ngày theo lịch', () => {
  const at = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d, 5)
  const s0 = newGame(at(2026, 12, 1))
  const s = { ...s0, levels: { ...s0.levels, chuDien: 5 } }
  const open = (id: 'tanXuan' | 'dongChi', t: number) => festOpen(advance(s, t), id, t)
  assert.deepEqual(
    [open('dongChi', at(2026, 12, 20)), open('dongChi', at(2026, 12, 23)), open('dongChi', at(2026, 12, 26))],
    [false, true, false],
  )
  assert.deepEqual(
    [
      open('tanXuan', at(2027, 2, 5)),
      open('tanXuan', at(2027, 2, 6)),
      open('tanXuan', at(2027, 2, 12)),
      open('tanXuan', at(2027, 2, 13)),
    ],
    [false, true, true, false],
  )
  // mùng Một vào núi: mở bao lì xì đầu
  const t = at(2027, 2, 6)
  const x = run(run(advance(s, t), { type: 'login' }, t), { type: 'fest', id: 'tanXuan', i: 0 }, t)
  assert.equal(x.items.nganDuyen ?? 0, (s.items.nganDuyen ?? 0) + 1)
})

test('Ô Thước Kiều (Thất Tịch) và Trung Nguyên Quỷ Tiết (rằm tháng Bảy) mở đúng ngày', () => {
  const at = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d, 5)
  const s0 = newGame(at(2027, 7, 1))
  const s = { ...s0, levels: { ...s0.levels, chuDien: 5 } }
  const open = (id: 'thatTich' | 'quyTiet', t: number) => festOpen(advance(s, t), id, t)
  assert.deepEqual(
    [open('thatTich', at(2027, 8, 4)), open('thatTich', at(2027, 8, 8)), open('thatTich', at(2027, 8, 12))],
    [false, true, false],
  )
  assert.deepEqual(
    [open('quyTiet', at(2027, 8, 13)), open('quyTiet', at(2027, 8, 16)), open('quyTiet', at(2027, 8, 19))],
    [false, true, false],
  )
})

test('Trảm Yêu Lệnh (Clarion Call): điểm theo cấp yêu thú, mã lượt theo lịch 14 ngày, mỗi lượt trao quà đúng một lần, bảng tiên minh', () => {
  // yêu thú sơn môn cấp 5 (chỉ số 4): +5 cấp vào huntLv; thua không tính
  const s0 = newGame(MON)
  const beast = (i: number, win: boolean) => ({
    at: MON,
    kind: 'beast' as const,
    i,
    win,
    fights: [],
    hurt: {},
    dead: {},
    gain: noGain(),
  })
  const s1 = pushReport(pushReport(s0, beast(4, true)), beast(9, false))
  assert.deepEqual([metric(s1, 'huntLv'), metric(s1, 'hunt')], [5, 1])
  // tìm một ngày Trảm Yêu Lệnh mở: mã lượt, lúc đóng; lượt kết thúc đúng trong một tuần (trao quà khi lật tuần)
  let t = MON
  while (!festWindow({}, FESTS.tramYeu, t)) t += DAY
  const w = festWindow({}, FESTS.tramYeu, t)!
  assert.equal(festKey('tramYeu', t), w.key)
  assert.equal(festKey('tramYeu', w.endAt + DAY), -1, 'hết lễ: đóng')
  const wk = weekOf(w.endAt - 1)
  assert.deepEqual(festEnded('tramYeu', weekStart(wk), weekStart(wk + 1)), [w.key])
  assert.deepEqual(festEnded('tramYeu', weekStart(wk + 1), weekStart(wk + 2)), [], 'tuần sau không trao lại')
  assert.deepEqual(festEnded('tranhBa', weekStart(wk), weekStart(wk + 1)), [wk], 'Tranh Bá: lượt theo tuần')
  // bảng tiên minh: tổng điểm người trong minh, cao trước; người không minh không vào bảng minh
  const pts = (pid: number, n: number): [number, State] => {
    const s = advance({ ...newGame(t), levels: { ...newGame(t).levels, chuDien: 6 } }, t)
    const f = s.fest.tramYeu!
    return [pid, { ...s, fest: { ...s.fest, tramYeu: { ...f, bank: n } } }]
  }
  const ps: Players = new Map([pts(1, 300), pts(2, 200), pts(3, 450), pts(4, 900)])
  const ally = (id: number, tag: string, members: Record<number, 0 | 2>) => ({
    id,
    name: tag,
    tag,
    members,
    notice: '',
    at: t,
    helps: [],
  })
  const world: World = { ...freshWorld(), allies: { 1: ally(1, 'VK', { 1: 2, 2: 0 }), 2: ally(2, 'HS', { 3: 2 }) } }
  assert.deepEqual(
    festBoard(ps, 'tramYeu', w.key).map(([p]) => p),
    [4, 3, 1, 2],
  )
  assert.deepEqual(festAllyBoard(ps, world, 'tramYeu', w.key), [
    [1, 500],
    [2, 450],
  ])
})

test('Tích Cốc Phòng Cơ (Strategic Reserve): săn yêu / khai mỏ có xác suất rơi Linh Nang qua thư, mỗi nang +1 điểm; mầm 0 không đoán', () => {
  let t = MON
  while (!festWindow({}, FESTS.tichCoc, t)) t += DAY
  const base = newGame(t - 7 * DAY)
  const s = advance({ ...base, levels: { ...base.levels, chuDien: 6 } }, t)
  assert.ok(festOpen(s, 'tichCoc', t))
  assert.equal(festDrop(s, 'hunt', 0, t), s, 'client (mầm 0): chờ server')
  // 400 lượt săn với mầm khác nhau: tỉ lệ rơi quanh 30 %; mỗi lần rơi +1 điểm và một thư có quà
  let n = 0
  for (let seed = 1; seed <= 400; seed++) {
    const x = festDrop(s, 'hunt', seed * 7919, t)
    if (x === s) continue
    n++
    assert.equal(festPoints(x, 'tichCoc'), 1)
    assert.deepEqual(x.mail.at(-1)?.a, ['tichCoc', 1])
    assert.ok(x.mail.at(-1)?.gift)
  }
  assert.ok(n > 80 && n < 160, `rơi ${n}/400`)
  // khai mỏ: 50 %; lễ đóng thì không rơi
  let g = 0
  for (let seed = 1; seed <= 400; seed++) if (festDrop(s, 'gather', seed * 104_729, t) !== s) g++
  assert.ok(g > 150 && g < 250, `khai mỏ rơi ${g}/400`)
  const shut = advance(s, t + 8 * DAY)
  assert.equal(festOpen(shut, 'tichCoc', shut.time), false)
  assert.equal(festDrop(shut, 'hunt', 12345, shut.time), shut)
  // đủ 3 nang: mốc đầu nhận được (chấm đỏ)
  const three = { ...s, fest: { ...s.fest, tichCoc: { ...s.fest.tichCoc!, bank: 3 } } }
  assert.ok(ready(three, t) >= 1)
})

test('Khánh Điển Khai Tông: 14 ngày đầu mùa giới (theo seasonAt), mọi người — mỗi ngày vào game mở thêm một phần lễ; ngoài giới thì không có', () => {
  const base = newGame(MON - 30 * DAY)
  const solo = advance(base, MON)
  assert.equal(festOpen(solo, 'khaiDien', MON), false, 'chưa vào giới (không có seasonAt)')
  let s: State = advance({ ...base, seasonAt: MON - 2 * DAY }, MON)
  assert.equal(festOpen(s, 'khaiDien', MON), true)
  s = run(s, { type: 'login' })
  assert.equal(festError(s, 'khaiDien', 0), null)
  assert.equal(festError(s, 'khaiDien', 1), 'not_done')
  s = run(advance(s, MON + DAY), { type: 'login' })
  assert.equal(festError(s, 'khaiDien', 1), null)
  const late = advance(s, MON - 2 * DAY + 14 * DAY + 1)
  assert.equal(festOpen(late, 'khaiDien', late.time), false, 'hết 14 ngày đầu mùa')
  // mùa mới: lượt mới
  const next = advance({ ...late, seasonAt: late.time }, late.time + 1000)
  assert.equal(festOpen(next, 'khaiDien', next.time), true)
  assert.equal(next.fest.khaiDien!.days, 0)
})

test('Giới Chủ Tranh Phong: 7 ngày đầu mùa, điểm = thế lực tăng thêm, có bảng xếp hạng theo mã lượt của mùa; trao quà khi lượt kết thúc', () => {
  const seasonAt = MON - DAY
  const base = newGame(MON - 30 * DAY)
  let s: State = advance({ ...base, seasonAt, levels: { ...base.levels, chuDien: 5 } }, MON)
  assert.equal(festOpen(s, 'gioiChu', MON), true)
  assert.equal(festPoints(s, 'gioiChu'), 0)
  s = { ...s, levels: { ...s.levels, chuDien: 8 } } // thế lực tăng
  assert.ok(festPoints(s, 'gioiChu') > 0)
  const key = festKey('gioiChu', MON, seasonAt)
  assert.equal(key, s.fest.gioiChu!.key)
  assert.equal(festKey('gioiChu', MON), -1, 'không biết lúc mở mùa: không có lượt')
  // lượt kết thúc sau 7 ngày: lật tuần trao quà đúng lượt đó
  const end = seasonAt + 7 * DAY
  assert.deepEqual(festEnded('gioiChu', end - DAY, end, seasonAt), [key])
  assert.deepEqual(festEnded('gioiChu', end, end + 7 * DAY, seasonAt), [])
  assert.deepEqual(
    festBoard(new Map([[1, s]]), 'gioiChu', key).map(([p]) => p),
    [1],
  )
})
