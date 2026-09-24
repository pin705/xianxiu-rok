import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ACTION_TYPES,
  BASE_RATE,
  BEASTS,
  BUILDINGS,
  MAX_LEVEL,
  REALMS,
  FESTS,
  festPoints,
  HOSPITAL_BASE,
  PILLS,
  QUESTS,
  SPEEDUP,
  TRIBS,
  advance,
  apply,
  beastStr,
  brewTime,
  buildTime,
  cost,
  count,
  elderLevel,
  expAt,
  fight,
  healCost,
  hospital,
  marchTime,
  migrate,
  newGame,
  nextDay,
  power,
  questDone,
  sideOf,
  storage,
  storeNeed,
  WEEKLY,
  WEEKLY_BONUS,
  WEEKLY_RES,
  nextWeek,
  weekOf,
  tradeKeep,
  isWeekend,
  eventMul,
  towerReward,
  towerStr,
  towerType,
  enemyOf,
  targetError,
  techTime,
  trainCost,
  trainTime,
  upgradeError,
  winChance,
  parseAction,
  rate,
  gearTime,
  talentPoints,
  ELDER_IDS,
  GEAR_IDS,
  UNITS,
  IDS,
  TECH_IDS,
  PILL_IDS,
  type Action,
  type BuildingId,
  type Side,
  type State,
  rng,
} from './index.ts'

const T0 = 1_000_000
const HOUR = 3_600_000

function run(s: State, a: Action, at = s.time) {
  const r = apply(s, a, at)
  if (!r.ok) throw new Error(`${a.type}: ${r.error}`)
  return r.state
}
const up = (s: State, b: BuildingId) => run(s, { type: 'upgrade', building: b })
function err(s: State, a: Action) {
  const r = apply(s, a, s.time)
  return r.ok ? null : r.error
}
// Tông môn giàu có ở tầng hall, mọi công trình tầng lv (để thử các hệ thống sau)
function rich(hall = 5, lv = hall): State {
  const s = newGame(T0)
  const levels = Object.fromEntries(Object.keys(s.levels).map(k => [k, lv])) as State['levels']
  return { ...s, levels: { ...levels, chuDien: hall }, res: { linhThach: 1e7, linhThao: 1e7, linhKhoang: 1e7 } }
}

test('nâng cấp: trừ tài nguyên, xong đúng giờ', () => {
  const s = up(newGame(T0), 'tuLinhTran')
  assert.equal(s.res.linhThao, 1000 - cost('tuLinhTran', 1).linhThao)
  const done = T0 + buildTime(s, 'tuLinhTran', 1)
  assert.equal(advance(s, done - 1).levels.tuLinhTran, 0)
  assert.equal(advance(s, done).levels.tuLinhTran, 1)
})

test('sản lượng tính từ lúc xây xong và không phụ thuộc số lần gọi advance', () => {
  const s = up(newGame(T0), 'tuLinhTran')
  const end = T0 + HOUR
  let stepped = s
  for (let t = T0; t <= end; t += 250) stepped = advance(stepped, t)
  const once = advance(s, end)
  assert.deepEqual(stepped, once)
  // trước khi xây xong chỉ có linh khí tự nhiên, sau đó cộng thêm sản lượng của trận
  const bt = buildTime(s, 'tuLinhTran', 1)
  assert.equal(once.res.linhThach, 1000 + Math.floor((BASE_RATE * bt + (BASE_RATE + 600) * (HOUR - bt)) / HOUR))
})

test('không bao giờ kẹt vì tiêu sạch: linh khí tự nhiên đủ xây lại công trình tài nguyên', () => {
  const broke = { ...newGame(T0), res: { linhThach: 0, linhThao: 0, linhKhoang: 0 } }
  assert.equal(err(broke, { type: 'upgrade', building: 'linhDien' }), 'not_enough')
  const later = advance(broke, T0 + 2 * HOUR)
  assert.equal(err(later, { type: 'upgrade', building: 'linhDien' }), null)
})

test('đầy kho thì ngừng sản xuất', () => {
  const s = advance(up(newGame(T0), 'tuLinhTran'), T0 + 100 * HOUR)
  assert.equal(s.res.linhThach, storage(s))
})

test('đồng hồ lùi không đổi gì', () => {
  const s = advance(up(newGame(T0), 'tuLinhTran'), T0 + HOUR)
  assert.deepEqual(advance(s, T0), s)
})

test('nhiệm vụ: chưa xong thì không nhận được; xong thì nhận thưởng và sang nhiệm vụ sau', () => {
  const s = newGame(T0)
  assert.deepEqual(apply(s, { type: 'claim' }, T0), { ok: false, error: 'not_done' })
  const built = advance(up(s, 'tuLinhTran'), T0 + buildTime(s, 'tuLinhTran', 1))
  const r = run(built, { type: 'claim' })
  assert.equal(r.quest, 1)
  assert.equal(r.res.linhThao, built.res.linhThao + (QUESTS[0].reward.linhThao ?? 0))
})

test('chặn đúng lý do', () => {
  const s = newGame(T0)
  assert.equal(err(s, { type: 'upgrade', building: 'tangBaoCac' }), 'need_main_hall')
  const busy = up(s, 'tuLinhTran')
  assert.equal(err(busy, { type: 'upgrade', building: 'tuLinhTran' }), 'busy')
  assert.equal(err(busy, { type: 'upgrade', building: 'linhDien' }), 'queue_full')
  assert.equal(
    err({ ...s, res: { linhThach: 0, linhThao: 0, linhKhoang: 0 } }, { type: 'upgrade', building: 'linhDien' }),
    'not_enough',
  )
})

test('tuyển đệ tử: trừ tài nguyên, xong thì vào môn hạ; bậc 2 cần Diễn võ trường tầng 5', () => {
  const s = rich(5, 4)
  const t = run(s, { type: 'train', unit: 'kiem1', n: 50 })
  assert.equal(t.res.linhKhoang, s.res.linhKhoang - trainCost('kiem1', 50).linhKhoang)
  assert.equal(err(t, { type: 'train', unit: 'phap1', n: 1 }), 'busy')
  const done = advance(t, T0 + trainTime(t, 'kiem1', 50))
  assert.equal(done.troops.kiem1, 50)
  assert.equal(done.train, null)
  assert.equal(err(s, { type: 'train', unit: 'kiem2', n: 1 }), 'locked')
  assert.equal(err(s, { type: 'train', unit: 'kiem1', n: 10_000 }), 'bad')
})

test('trận đánh tất định theo seed và hệ khắc có tác dụng', () => {
  const army = (type: 'kiem' | 'phap' | 'the', n: number): Side => ({
    troops: [{ type, tier: 1, n, atk: 12, def: 5, hp: 30 }],
  })
  assert.deepEqual(fight(army('kiem', 50), army('phap', 50), 7), fight(army('kiem', 50), army('phap', 50), 7))
  // Kiếm khắc Pháp: cùng quân số thì kiếm thắng, ngược lại thì thua
  assert.equal(fight(army('kiem', 50), army('phap', 50), 1).win, true)
  assert.equal(fight(army('phap', 50), army('kiem', 50), 1).win, false)
  // Hết 10 lượt không phân thắng bại: bên tấn công thua
  const wall: Side = { troops: [{ type: 'the', tier: 1, n: 5, atk: 0, def: 1e6, hp: 1e6 }] }
  assert.equal(fight(army('kiem', 5), wall, 3).win, false)
})

test('xuất quân: đi, đánh, về; thương binh vào Đan phòng, chiến lợi phẩm vào kho', () => {
  let s = rich(5)
  s = { ...s, troops: { ...s.troops, the1: 200 } }
  const target = { kind: 'beast', i: 0 } as const
  s = run(s, { type: 'march', target, elder: 'thanhPhong', army: { the1: 200 } })
  assert.equal(s.troops.the1, 0)
  assert.equal(
    err(s, { type: 'march', target: { kind: 'beast', i: 0 }, elder: 'thanhPhong', army: { the1: 1 } }),
    'busy',
  )
  const dt = marchTime(s, target)
  const arrived = advance(s, T0 + dt)
  const rep = arrived.reports.at(-1)!
  assert.equal(rep.win, true)
  assert.equal(arrived.beast, 1)
  assert.equal(arrived.marches.length, 1, 'đang trên đường về')
  const home = advance(s, T0 + 2 * dt)
  assert.equal(home.marches.length, 0)
  assert.equal(home.troops.the1 + home.wounded.the1, 200)
  assert.ok(home.res.linhThach > s.res.linhThach)
  assert.ok(home.elders.thanhPhong! > 0, 'trưởng lão có kinh nghiệm')
  // Hạ xong thì hang trống: đánh lại phải chờ
  assert.equal(
    err(
      { ...home, troops: { ...home.troops, the1: 10 } },
      { type: 'march', target, elder: 'thanhPhong', army: { the1: 10 } },
    ),
    'cooldown',
  )
})

test('yêu thú cấp sau chỉ mở khi đã hạ cấp trước', () => {
  const s = { ...rich(5), troops: { ...rich(5).troops, kiem1: 10 } }
  assert.equal(
    err(s, { type: 'march', target: { kind: 'beast', i: 1 }, elder: 'thanhPhong', army: { kiem1: 10 } }),
    'locked',
  )
  assert.equal(
    err(
      { ...s, beast: 1 },
      { type: 'march', target: { kind: 'beast', i: 1 }, elder: 'thanhPhong', army: { kiem1: 10 } },
    ),
    null,
  )
  assert.ok(beastStr(BEASTS.length) > beastStr(1) * 50)
})

test('Đan phòng hết chỗ thì thương binh dư tử trận', () => {
  let s = rich(5, 0)
  s = { ...s, troops: { ...s.troops, kiem1: 400 }, levels: { ...s.levels, chuDien: 5 } }
  // Đánh bí cảnh 0 tầng 1 với quân rất yếu để chắc chắn thua và có nhiều thương vong
  const weak: State = { ...s, realms: [4, 0, 0] }
  const r = run(weak, { type: 'realm', i: 0, elder: 'thanhPhong', army: { kiem1: 400 } })
  const rep = r.reports.at(-1)!
  assert.equal(count(r.wounded), Math.min(count(rep.hurt), HOSPITAL_BASE))
  assert.equal(count(rep.dead), count(rep.hurt) - count(r.wounded))
  assert.equal(r.troops.kiem1, 400 - count(rep.hurt))
})

test('chữa thương: tốn tài nguyên, xong thì về môn hạ', () => {
  let s = rich(5)
  s = { ...s, wounded: { ...s.wounded, kiem1: 30 } }
  const c = healCost(s, s.wounded)
  const h = run(s, { type: 'heal' })
  assert.equal(h.res.linhKhoang, s.res.linhKhoang - c.linhKhoang)
  const done = advance(h, h.heal!.finishAt)
  assert.equal(done.troops.kiem1, 30)
  assert.equal(done.wounded.kiem1, 0)
  assert.equal(err({ ...s, wounded: newGame(T0).wounded }, { type: 'heal' }), 'empty')
})

test('công pháp tăng sản lượng; luyện đan và dùng Tụ Khí Đan rút ngắn thời gian', () => {
  let s = rich(6, 5)
  s = run(s, { type: 'study', tech: 'tuLinh' })
  s = advance(s, T0 + techTime('tuLinh', 1))
  assert.equal(s.tech.tuLinh, 1)
  const empty = { ...s, res: { linhThach: 0, linhThao: 0, linhKhoang: 0 } } // kho đầy thì không sản xuất
  assert.ok(advance(empty, s.time + HOUR).res.linhThach > advance({ ...empty, tech: {} }, s.time + HOUR).res.linhThach)

  s = run(s, { type: 'brew', pill: 'tuKhi', n: 2 })
  s = advance(s, s.time + brewTime(s, 'tuKhi', 2))
  assert.equal(s.items.tuKhi, 2)
  // Việc ngắn hơn 15 phút: xong ngay
  s = run(up(s, 'tuLinhTran'), { type: 'speed', job: 'build', n: 1 })
  assert.equal(s.items.tuKhi, 1)
  assert.equal(s.levels.tuLinhTran, 6)
  assert.equal(s.queue.length, 0)
  // Việc dài: bớt đúng 15 phút
  const long = up({ ...rich(11, 10), items: { tuKhi: 1 } }, 'chuDien')
  assert.equal(run(long, { type: 'speed', job: 'build', n: 1 }).queue[0].finishAt, long.queue[0].finishAt - SPEEDUP)
  assert.equal(err(s, { type: 'speed', job: 'train', n: 1 }), 'empty')
  assert.equal(
    err(
      { ...s, brew: { pill: 'tuKhi', n: 1, startAt: s.time, finishAt: s.time + 1e6 } },
      { type: 'speed', job: 'brew', n: 1 },
    ),
    'bad',
  )
  assert.equal(err(s, { type: 'brew', pill: 'doKiep', n: 1 }), null)
  assert.equal(
    err({ ...s, levels: { ...s.levels, danPhong: PILLS.doKiep.unlock - 1 } }, { type: 'brew', pill: 'doKiep', n: 1 }),
    'locked',
  )
})

test('độ kiếp: Chủ điện tầng 5 không nâng được mà phải vượt lôi kiếp', () => {
  let s = rich(5)
  assert.equal(upgradeError(s, 'chuDien'), 'trib')
  // Quân yếu: thất bại, phải chờ
  const weak = run(
    { ...s, troops: { ...s.troops, kiem1: 5 } },
    { type: 'trib', elder: 'thanhPhong', army: { kiem1: 5 }, pill: false },
  )
  assert.equal(weak.levels.chuDien, 5)
  assert.equal(weak.reports.at(-1)!.win, false)
  assert.equal(
    err(
      { ...weak, troops: { ...weak.troops, kiem1: 5 } },
      { type: 'trib', elder: 'thanhPhong', army: { kiem1: 5 }, pill: false },
    ),
    'cooldown',
  )
  // Quân mạnh: lên Trúc Cơ ngay
  s = { ...s, troops: { ...s.troops, kiem1: 300, phap1: 300, the1: 300 } }
  const won = run(s, { type: 'trib', elder: 'thanhPhong', army: { kiem1: 300, phap1: 300, the1: 300 }, pill: false })
  assert.equal(won.levels.chuDien, 6)
  assert.equal(won.trib, 1)
  assert.equal(won.reports.at(-1)!.fights.length, TRIBS[0].waves.length)
  assert.equal(won.res.linhThach, s.res.linhThach - cost('chuDien', 6).linhThach)
})

test('trưởng lão: kinh nghiệm → cấp, cấp càng cao đội càng mạnh; Bồi Nguyên Đan', () => {
  assert.equal(elderLevel(0), 1)
  assert.equal(elderLevel(expAt(10)), 10)
  assert.equal(elderLevel(expAt(10) - 1), 9)
  const s = rich(5)
  const lo = sideOf(s, 'thanhPhong', { kiem1: 10 }).troops[0].atk
  const hi = sideOf({ ...s, elders: { thanhPhong: expAt(20) } }, 'thanhPhong', { kiem1: 10 }).troops[0].atk
  assert.ok(hi > lo * 1.7)
  const fed = run({ ...s, items: { boiNguyen: 2 } }, { type: 'feed', elder: 'thanhPhong', n: 2 })
  assert.equal(fed.items.boiNguyen, 0)
  assert.ok(fed.elders.thanhPhong! > 0)
  assert.equal(err(s, { type: 'feed', elder: 'nhuYen', n: 1 }), 'locked')
})

test('tỉ lệ thắng ước lượng: tính hệ khắc, đông áp đảo thì chắc thắng, ít thì chắc thua', () => {
  const s = rich(5)
  const t = { kind: 'beast', i: 4 } as const // Kim Nhãn Điêu: hệ Kiếm
  assert.equal(winChance(s, 'thanhPhong', { the1: 400 }, t), 1)
  assert.equal(winChance(s, 'thanhPhong', { kiem1: 3 }, t), 0)
  // Cùng lực chiến thô, đội khắc hệ (Thể khắc Kiếm) có cửa hơn đội bị khắc (Pháp bị Kiếm khắc)
  assert.equal(winChance(s, 'thanhPhong', { the1: 60 }, t), 1)
  assert.equal(winChance(s, 'thanhPhong', { phap1: 60 }, t), 0)
  assert.equal(winChance(s, 'thanhPhong', { kiem1: 900, phap1: 900, the1: 900 }, 'trib'), 1)
  assert.equal(winChance(s, 'thanhPhong', {}, t), 0)
})

test('thua không có kinh nghiệm (không cày cấp được bằng cách gửi 1 đệ tử)', () => {
  const s = { ...rich(15), troops: { ...rich(15).troops, kiem1: 1 }, realms: [0, 0, 4] }
  const r = run(s, { type: 'realm', i: 2, elder: 'thanhPhong', army: { kiem1: 1 } })
  assert.equal(r.reports.at(-1)!.win, false)
  assert.equal(r.elders.thanhPhong, s.elders.thanhPhong)
  const t = run(
    { ...rich(5), troops: { ...rich(5).troops, kiem1: 1 } },
    { type: 'trib', elder: 'thanhPhong', army: { kiem1: 1 }, pill: false },
  )
  assert.equal(t.elders.thanhPhong, 0)
})

test('bí cảnh: qua tầng lấy thưởng, tầng cuối thu nhận trưởng lão', () => {
  let s = rich(5)
  s = { ...s, troops: { ...s.troops, kiem1: 2000 }, realms: [4, 0, 0] }
  s = run(s, { type: 'realm', i: 0, elder: 'thanhPhong', army: { kiem1: 2000 } })
  assert.equal(s.realms[0], 5)
  assert.equal(s.elders.nhuYen, 0)
  assert.equal(err(s, { type: 'realm', i: 0, elder: 'thanhPhong', army: { kiem1: 10 } }), 'max_level')
})

test('luân hồi: giữ trưởng lão + công pháp, làm lại tông môn, mạnh hơn', () => {
  const s = { ...rich(15), tech: { tuLinh: 3 }, elders: { thanhPhong: 5000, nhuYen: 100 } }
  const r = run(s, { type: 'rebirth' })
  assert.equal(r.rebirths, 1)
  assert.deepEqual(r.tech, s.tech)
  assert.deepEqual(r.elders, s.elders)
  assert.ok(buildTime(r, 'chuDien', 3) < buildTime(newGame(T0), 'chuDien', 3))
  assert.equal(err(rich(14), { type: 'rebirth' }), 'locked')
  // Căn cơ: kiếp 2 khởi đầu ở tầng 3 (công trình chưa mở ở tầng 3 vẫn là 0), kiếp 3 trở đi ở tầng 5 — vẫn phải độ kiếp
  assert.equal(r.levels.chuDien, 3)
  assert.equal(r.levels.tuLinhTran, 3)
  assert.equal(r.levels.tangKinhCac, 0)
  const r3 = run({ ...r, levels: rich(15).levels, res: rich(15).res }, { type: 'rebirth' })
  assert.deepEqual(new Set(IDS.filter(id => BUILDINGS[id].unlock <= 5).map(id => r3.levels[id])), new Set([5]))
  assert.equal(r3.levels.luyenKhiPhong, 0, 'công trình mở sau tầng 5 chưa có')
  assert.equal(upgradeError(r3, 'chuDien'), 'trib')
})

test('Nhật Khóa (nhiệm vụ ngày kiểu RoK): việc xong cộng điểm hoạt lực, đủ mốc mở rương, 0h hôm sau làm lại', () => {
  // rich() sửa thẳng số tầng: mở lại lượt sự kiện từ trạng thái này để mốc chụp đúng
  let s = advance({ ...rich(6, 5), troops: { ...rich(6, 5).troops, kiem1: 2000 }, fest: {} }, rich(6, 5).time)
  assert.equal(err(s, { type: 'fest', id: 'nhatKhoa', i: 0 }), 'not_done')
  s = up(s, 'tuLinhTran')
  s = advance(s, s.time + buildTime(s, 'tuLinhTran', 6))
  s = up(s, 'linhDien')
  s = run(s, { type: 'train', unit: 'kiem1', n: 60 })
  s = run(s, { type: 'brew', pill: 'tuKhi', n: 1 })
  for (let k = 0; k < 3; k++)
    s = run({ ...s, realms: [0, 0, 0] }, { type: 'realm', i: 0, elder: 'thanhPhong', army: { kiem1: s.troops.kiem1 } })
  s = advance(s, s.time + 3_600_000) // hoạt lực tính lúc việc xong: tuyển xong, luyện xong, xây xong
  // xây 2 (20) + tuyển 50 (15) + thắng 3 (20) + luyện đan (10) = 65 điểm: mở được 3 rương đầu
  assert.equal(festPoints(s, 'nhatKhoa'), 65)
  const before = s.res.linhThach
  for (let i = 0; i < 3; i++) s = run(s, { type: 'fest', id: 'nhatKhoa', i })
  const nk = FESTS.nhatKhoa.kind === 'activity' ? FESTS.nhatKhoa.rewards : []
  const perHall = nk.slice(0, 3).reduce((a, r) => a + (r.hallRes ?? 0), 0)
  assert.equal(s.res.linhThach, before + perHall * 6) // hallRes × tầng Chủ điện
  assert.equal(s.weekly.n.days, 1, 'rương mốc 60 tính một hôm mở rương ngày cho nhiệm vụ tuần')
  assert.equal(err(s, { type: 'fest', id: 'nhatKhoa', i: 3 }), 'not_done')
  assert.equal(err(s, { type: 'fest', id: 'nhatKhoa', i: 0 }), 'claimed')
  // 0h giờ VN hôm sau: làm lại từ đầu
  const fresh = advance(s, nextDay(s.time))
  assert.equal(festPoints(fresh, 'nhatKhoa'), 0)
  assert.deepEqual(fresh.fest.nhatKhoa!.got, [])
  // nhiệm vụ ngày kiểu cũ không nhận được nữa (không nhận thưởng hai lần); chưa tới tầng 3 thì khoá
  assert.equal(err(s, { type: 'daily', i: 0 }), 'locked')
  assert.equal(err(s, { type: 'dailyBonus' }), 'locked')
  assert.equal(err(rich(2), { type: 'fest', id: 'nhatKhoa', i: 0 }), 'locked')
})

test('nhiệm vụ tuần: đếm cùng nhiệm vụ ngày và số hôm mở rương ngày, làm mới 0h thứ Hai giờ VN', () => {
  let s = { ...rich(6, 5), troops: { ...rich(6, 5).troops, kiem1: 2000 } }
  s = up(s, 'tuLinhTran')
  s = run(s, { type: 'train', unit: 'kiem1', n: 60 })
  assert.equal(s.weekly.n.build, 1)
  assert.equal(s.weekly.n.train, 60)
  assert.equal(err(s, { type: 'weekly', i: 1 }), 'not_done')
  // Tuần: xong mọi việc (giả tiến độ) → nhận từng việc, rồi rương
  s = { ...s, weekly: { ...s.weekly, n: Object.fromEntries(WEEKLY.map(w => [w.id, w.n])) as typeof s.weekly.n } }
  const before = s.res.linhKhoang
  assert.equal(err(s, { type: 'weeklyBonus' }), 'not_done')
  for (let i = 0; i < WEEKLY.length; i++) s = run(s, { type: 'weekly', i })
  assert.equal(s.res.linhKhoang, before + WEEKLY.length * WEEKLY_RES * 6)
  assert.equal(err(s, { type: 'weekly', i: 0 }), 'claimed')
  const pills = s.items.doKiep ?? 0
  s = run(s, { type: 'weeklyBonus' })
  assert.equal(s.items.doKiep, pills + (WEEKLY_BONUS.doKiep ?? 0))
  assert.equal(err(s, { type: 'weeklyBonus' }), 'claimed')
  // (mở rương ngày = rương mốc 60 của Nhật Khóa cộng một hôm — xem test Nhật Khóa)
  // Mốc làm mới đúng 0h thứ Hai giờ VN (17h Chủ nhật UTC)
  const mon = nextWeek(s.time)
  assert.equal(new Date(mon + 7 * 3_600_000).getUTCDay(), 1)
  assert.equal(new Date(mon + 7 * 3_600_000).getUTCHours(), 0)
  assert.equal(weekOf(mon) - weekOf(mon - 1), 1)
  assert.equal(advance(s, mon - 1).weekly.bonus, true)
  const fresh = advance(s, mon)
  assert.equal(fresh.weekly.bonus, false)
  assert.equal(fresh.weekly.n.build, 0)
  // Save cũ chưa có nhiệm vụ tuần: nạp được, có tuần mới
  const { weekly: _, ...old } = s
  assert.equal(migrate(JSON.parse(JSON.stringify(old)))?.weekly.bonus, false)
  assert.equal(
    migrate(JSON.parse(JSON.stringify({ ...s, weekly: { ...s.weekly, got: [true] } }))),
    null,
    'khuôn tuần sai thì từ chối',
  )
  assert.equal(err(rich(2), { type: 'weekly', i: 0 }), 'locked')
})

test('save bản 2 đọc được, giữ tiến độ và đúng nhiệm vụ', () => {
  const v2 = {
    v: 2,
    name: 'Lạc Hà Tông',
    quest: 4,
    time: T0,
    res: { linhThach: 5, linhThao: 6, linhKhoang: 7 },
    carry: { linhThach: 0, linhThao: 0, linhKhoang: 0 },
    levels: {
      chuDien: 2,
      tuLinhTran: 1,
      linhDien: 1,
      khoangMach: 1,
      tangBaoCac: 0,
      dienVoTruong: 0,
      tangKinhCac: 0,
      danPhong: 0,
    },
    queue: [{ building: 'tangBaoCac', level: 1, finishAt: T0 + 5000 }],
  }
  const s = migrate(v2)!
  assert.equal(s.v, 4)
  assert.equal(s.name, 'Lạc Hà Tông')
  assert.equal(s.levels.chuDien, 2)
  assert.deepEqual(
    QUESTS[s.quest],
    QUESTS.find(q => q.k === 'build' && q.id === 'tangBaoCac' && q.n === 1),
  )
  assert.equal(advance(s, T0 + 5000).levels.tangBaoCac, 1)
  assert.equal(migrate({ v: 9 }), null)
  assert.equal(migrate('rác'), null)
  // Bản cũ đã lên quá tầng độ kiếp thì coi như đã vượt
  assert.equal(migrate({ ...v2, levels: { ...v2.levels, chuDien: 12 } })!.trib, 2)
})

test('nhiệm vụ luyện đan xong ngay khi bắt đầu luyện (không chặn hướng dẫn 20 phút)', () => {
  const i = QUESTS.findIndex(q => q.k === 'brew')
  const s = run({ ...rich(5), quest: i }, { type: 'brew', pill: 'tuKhi', n: 1 })
  assert.equal(questDone(s), true)
})

test('save nhập vào: đủ khuôn thì nhận nguyên vẹn, thiếu hay sai trường thì từ chối (không để game vỡ lúc vẽ)', () => {
  // state đã chơi qua nhiều hệ thống, qua JSON như khi lưu/nhập
  let s: State = {
    ...rich(6, 5),
    troops: { ...rich(6, 5).troops, kiem1: 500 },
    elders: { thanhPhong: 0, thachKien: 0 },
  }
  s = run(s, { type: 'march', target: { kind: 'beast', i: 0 }, elder: 'thanhPhong', army: { kiem1: 100 } })
  s = run(s, { type: 'realm', i: 0, elder: 'thachKien', army: { kiem1: 50 } })
  s = run(s, { type: 'train', unit: 'the1', n: 20 })
  const round = JSON.parse(JSON.stringify(s))
  assert.deepEqual(migrate(round), round)
  const broken = (f: (x: any) => void) => {
    const x = JSON.parse(JSON.stringify(s))
    f(x)
    return migrate(x)
  }
  assert.equal(
    broken(x => delete x.troops),
    null,
  )
  assert.equal(
    broken(x => (x.troops.kiem1 = -5)),
    null,
  )
  assert.equal(
    broken(x => (x.res.linhThach = 'nhiều')),
    null,
  )
  assert.equal(
    broken(x => (x.levels.chuDien = 99)),
    null,
  )
  assert.equal(
    broken(x => (x.marches[0].elder = 'kẻ lạ')),
    null,
  )
  assert.equal(
    broken(x => (x.reports = {})),
    null,
  )
  assert.equal(
    broken(x => (x.elders = { hacker: 1 })),
    null,
  )
  assert.equal(
    broken(x => (x.sects = [])),
    null,
  )
  assert.equal(
    broken(x => (x.queue = [{ building: 'x' }])),
    null,
  )
  assert.equal(migrate({ v: 2 }), null, 'bản 2 thiếu trường cũng không làm vỡ')
})

test('mọi nhiệm vụ đều làm được: đích đến có thật trong dữ liệu', () => {
  for (const q of QUESTS) {
    if (q.k === 'hunt') assert.ok(q.n <= BEASTS.length)
    if (q.k === 'build') assert.ok(q.id && Object.hasOwn(BUILDINGS, q.id) && q.n <= MAX_LEVEL)
    if (q.k === 'realm') assert.ok(REALMS[Number(q.id)] && q.n <= REALMS[Number(q.id)].floors.length)
  }
  assert.equal(questDone(newGame(T0)), false)
  assert.ok(power(rich(5)) > power(newGame(T0)))
  assert.ok(hospital(rich(5)) > HOSPITAL_BASE)
})

test('kho không đủ chỗ cho chi phí: chỉ ra tầng Tàng Bảo Các cần nâng (sản lượng dừng khi đầy, chờ mãi không đủ)', () => {
  const s = newGame(0, 'x')
  const c = cost('chuDien', 11)
  const need = storeNeed(s, c)
  assert.ok(need > s.levels.tangBaoCac)
  assert.ok(storage({ ...s, levels: { ...s.levels, tangBaoCac: need } }) >= c.linhThach)
  assert.ok(storage({ ...s, levels: { ...s.levels, tangBaoCac: need - 1 } }) < c.linhThach)
  assert.equal(storeNeed(s, cost('chuDien', 3)), 0, 'kho đủ chỗ')
  assert.equal(
    storeNeed({ ...s, res: { linhThach: 2e4, linhThao: 2e4, linhKhoang: 2e4 } }, c),
    0,
    'đã có đủ (thưởng vượt kho)',
  )
})

test('Thông Thiên Tháp: mở ở tầng 10, qua tầng thì lên kỷ lục và nhận thưởng lần đầu, địch mạnh dần và đổi hệ', () => {
  assert.equal(err(rich(9), { type: 'tower', elder: 'thanhPhong', army: { kiem3: 10 } }), 'locked')
  let s: State = {
    ...rich(10, 10),
    troops: { ...rich(10, 10).troops, kiem3: 3000, phap3: 3000, the3: 3000 },
    elders: { thanhPhong: expAt(30) },
  }
  assert.equal(targetError(s, { kind: 'tower', i: 0 }), null)
  // mỗi tầng một hệ khác, sức tăng đều
  assert.notEqual(towerType(0), towerType(1))
  assert.ok(towerStr(1) > towerStr(0))
  assert.equal(enemyOf(s, { kind: 'tower', i: 0 }).troops[0].type, towerType(0))
  const before = s.res.linhThach
  s = run(s, { type: 'tower', elder: 'thanhPhong', army: { kiem3: 3000, phap3: 3000, the3: 3000 } })
  assert.equal(s.tower, 1, 'thắng thì lên tầng 2')
  assert.equal(s.res.linhThach, before + towerReward(0).res!.linhThach!)
  assert.equal(s.reports.at(-1)!.kind, 'tower')
  assert.equal(enemyOf(s, { kind: 'tower', i: 0 }).troops[0].type, towerType(1), 'tầng mới, địch đổi hệ')
  assert.deepEqual(towerReward(4).items, { tuKhi: 3 })
  assert.equal(towerReward(9).items?.doKiep, 1)
  // thua: không lên tầng, không nhận thưởng
  const weak = run(
    { ...s, troops: { ...s.troops, kiem1: 1 } },
    { type: 'tower', elder: 'thanhPhong', army: { kiem1: 1 } },
  )
  assert.equal(weak.tower, 1)
  // kỷ lục giữ qua luân hồi; save cũ chưa có tháp thì bắt đầu từ 0
  const reborn = run({ ...s, levels: { ...s.levels, chuDien: 15 }, marches: [] }, { type: 'rebirth' })
  assert.equal(reborn.tower, 1)
  const { tower: _, ...old } = s
  assert.equal(migrate(JSON.parse(JSON.stringify(old)))?.tower, 0)
})

test('Thương hội: đổi tài nguyên dư lấy tài nguyên thiếu, mất phí, tầng Tàng Bảo Các càng cao phí càng thấp', () => {
  const s = { ...rich(6, 1), res: { linhThach: 10000, linhThao: 10000, linhKhoang: 50 } }
  const r = run(s, { type: 'trade', from: 'linhThach', to: 'linhKhoang', n: 1000 })
  assert.equal(r.res.linhThach, 9000)
  assert.equal(r.res.linhKhoang, 50 + Math.floor(1000 * tradeKeep(s)))
  assert.ok(tradeKeep(s) < 1, 'luôn mất phí')
  assert.ok(tradeKeep({ ...s, levels: { ...s.levels, tangBaoCac: 10 } }) > tradeKeep(s))
  assert.ok(tradeKeep({ ...s, levels: { ...s.levels, tangBaoCac: 99 } }) <= 0.75)
  assert.equal(err(s, { type: 'trade', from: 'linhKhoang', to: 'linhThach', n: 51 }), 'not_enough')
  assert.equal(err(s, { type: 'trade', from: 'linhThach', to: 'linhThach', n: 10 }), 'locked')
  assert.equal(err(s, { type: 'trade', from: 'linhThach', to: 'linhThao', n: 1.5 }), 'bad')
  assert.equal(
    err({ ...s, levels: { ...s.levels, tangBaoCac: 0 } }, { type: 'trade', from: 'linhThach', to: 'linhThao', n: 10 }),
    'locked',
  )
})

test('sự kiện cuối tuần: thứ Bảy, Chủ nhật giờ VN, chiến lợi phẩm đánh lại ×1.5, thưởng lần đầu giữ nguyên', () => {
  const at = (iso: string) => Date.parse(iso) // giờ UTC; VN = UTC+7
  assert.equal(isWeekend(at('2026-09-25T16:59:00Z')), false, 'thứ Sáu 23:59 VN')
  assert.equal(isWeekend(at('2026-09-25T17:00:00Z')), true, 'thứ Bảy 0:00 VN')
  assert.equal(isWeekend(at('2026-09-27T16:59:00Z')), true, 'Chủ nhật 23:59 VN')
  assert.equal(isWeekend(at('2026-09-27T17:00:00Z')), false, 'thứ Hai 0:00 VN')
  // cùng một trận yêu thú: cuối tuần được nhiều chiến lợi phẩm hơn
  const base = { ...rich(6, 5), troops: { ...rich(6, 5).troops, kiem1: 2000 } }
  const hunt = (t: number) => {
    const s = { ...base, time: t }
    const r = run(s, { type: 'march', target: { kind: 'beast', i: 0 }, elder: 'thanhPhong', army: { kiem1: 2000 } })
    const done = advance(r, r.marches[0].returnAt + 1)
    return done.reports.at(-1)!.gain.res.linhThach ?? 0
  }
  const week = hunt(at('2026-09-23T03:00:00Z')),
    weekend = hunt(at('2026-09-26T03:00:00Z'))
  assert.ok(week > 0)
  assert.equal(weekend, Math.round(week * eventMul(at('2026-09-26T03:00:00Z'))))
})

// Thao tác đến từ client là JSON bất kỳ. Mỗi dòng dưới đây từng lách được luật (cày thưởng, số NaN vĩnh viễn, làm sập apply)
test('dữ liệu vào bẩn: mọi payload lạ bị từ chối "bad", state không đổi, không bao giờ throw', () => {
  const s: State = {
    ...rich(6, 5),
    troops: { ...rich(6, 5).troops, kiem1: 500 },
    items: { tuKhi: 3, boiNguyen: 3 },
    daily: { ...rich(6, 5).daily, n: { build: 9, train: 99, win: 9, brew: 9 } },
  }
  const army = { kiem1: 10 }
  const bad: unknown[] = [
    { type: 'daily', i: '0' },
    { type: 'weekly', i: '0' }, // chuỗi thay số: thưởng nhận mãi không đánh dấu
    { type: 'realm', i: '0', elder: 'thanhPhong', army }, // bí cảnh cày mãi tầng 1
    { type: 'march', target: { kind: 'beast', i: '2' }, elder: 'thanhPhong', army }, // '2' + 1 = '21'
    { type: 'march', target: { kind: 'beast', i: 1.5 }, elder: 'thanhPhong', army },
    { type: 'feed', elder: 'constructor', n: 1 },
    { type: 'feed', elder: '__proto__', n: 1 }, // khoá thừa kế: NaN
    { type: 'speed', job: 'time', n: 1 }, // mọi tài nguyên thành NaN
    { type: 'march', target: { kind: 'beast', i: 0 }, elder: 'thanhPhong', army: null },
    { type: 'upgrade', building: 'constructor' },
    { type: 'brew', pill: 'constructor', n: 1 },
    { type: 'study', tech: 'toString' },
    { type: 'train', unit: 'kiem1', n: 1.5 },
    { type: 'train', unit: 'kiem9', n: 1 },
    { type: 'trade', from: 'vang', to: 'linhThao', n: 1 },
    { type: 'march', target: { kind: 'tower', i: 0 }, elder: 'thanhPhong', army }, // tháp không đi hành quân
    { type: 'march', target: { kind: 'beast', i: 0 }, elder: 'thanhPhong', army: { kiem1: -5 } },
    { type: 'march', target: { kind: 'beast', i: 0 }, elder: 'thanhPhong', army: { vang: 5 } },
    { type: 'trib', elder: 'thanhPhong', army, pill: 'có' },
    { type: 'toString' },
    { type: '__proto__' },
    null,
    [],
    'upgrade',
    42,
    {},
  ]
  for (const a of bad) {
    let r: ReturnType<typeof apply> | undefined
    assert.doesNotThrow(() => (r = apply(s, a as Action, s.time)), JSON.stringify(a))
    assert.deepEqual(r, { ok: false, error: 'bad' }, JSON.stringify(a))
  }
  // trường thừa bị bỏ: không lọt vào state đã lưu
  const r = apply(
    s,
    {
      type: 'march',
      target: { kind: 'beast', i: 0, junk: 'x'.repeat(1000) },
      elder: 'thanhPhong',
      army,
      extra: 1,
    } as unknown as Action,
    s.time,
  )
  assert.ok(r.ok && !('junk' in r.state.marches[0].target))
  assert.deepEqual(parseAction({ type: 'upgrade', building: 'chuDien', x: 1 }), {
    type: 'upgrade',
    building: 'chuDien',
  })
})

test('thao tác JSON ngẫu nhiên: không bao giờ throw, state sau đó luôn hợp lệ', () => {
  const rnd = rng(7)
  const pick = <T>(a: readonly T[]) => a[Math.floor(rnd() * a.length)]
  const types = [...ACTION_TYPES, 'x'] // mọi thao tác trong registry + một loại lạ
  const junk = () =>
    pick<unknown>([
      0,
      1,
      2,
      -1,
      1.5,
      1e9,
      NaN,
      '0',
      '',
      'constructor',
      null,
      true,
      {},
      [],
      { kiem1: 5 },
      { kind: 'beast', i: 0 },
      { kind: 'sect', i: '1' },
    ])
  const val = () =>
    pick<unknown>([
      ...IDS,
      ...TECH_IDS,
      ...PILL_IDS,
      ...ELDER_IDS,
      ...UNITS,
      ...GEAR_IDS,
      'build',
      'train',
      'forge',
      'linhThach',
      'linhThao',
      'daiTuKhi',
      junk(),
    ])
  let s: State = {
    ...rich(10, 8),
    troops: { ...rich(10, 8).troops, kiem1: 300, phap2: 100 },
    items: { tuKhi: 5, boiNguyen: 5, doKiep: 1, hoiXuan: 2, ngungThan: 2, taiTuy: 1 },
    elders: { thanhPhong: expAt(15), thachKien: 0 },
  }
  for (let k = 0; k < 3000; k++) {
    const a: Record<string, unknown> = { type: pick(types) }
    for (const f of [
      'building',
      'unit',
      'n',
      'tech',
      'pill',
      'elder',
      'from',
      'to',
      'job',
      'i',
      'target',
      'army',
      'gear',
      'branch',
    ])
      if (rnd() < 0.5) a[f] = rnd() < 0.5 ? val() : junk()
    if (rnd() < 0.3) a.army = { [pick(UNITS)]: Math.floor(rnd() * 50) }
    if (rnd() < 0.3) a.target = { kind: pick(['beast', 'sect']), i: Math.floor(rnd() * 5) }
    let r: ReturnType<typeof apply> | undefined
    assert.doesNotThrow(() => (r = apply(s, a as Action, s.time + 1000)), JSON.stringify(a))
    if (r!.ok) s = r!.state
  }
  assert.ok(migrate(JSON.parse(JSON.stringify(s))), 'state sau 3000 thao tác ngẫu nhiên vẫn qua được kiểm khuôn')
})

test('mầm ẩn (seed 0, như state client nhận từ server): không tự giải trận, cũng không cho đội về tay không', () => {
  let s: State = { ...rich(6, 5), troops: { ...rich(6, 5).troops, kiem1: 500 }, seed: 0 }
  s = run(s, { type: 'march', target: { kind: 'beast', i: 0 }, elder: 'thanhPhong', army: { kiem1: 100 } })
  assert.equal(s.marches[0].seed, 0)
  assert.equal(s.seed, 0, 'mầm 0 sinh ra 0')
  s = { ...s, res: { linhThach: 100, linhThao: 100, linhKhoang: 100 } }
  const later = advance(s, s.marches[0].returnAt + HOUR)
  assert.equal(later.reports.length, 0, 'không bịa ra trận khi không biết mầm')
  assert.equal(later.marches.length, 1, 'đội vẫn ngoài đường, chờ server báo kết quả')
  assert.equal(later.troops.kiem1, 400)
  assert.ok(later.res.linhThach > s.res.linhThach, 'tài nguyên vẫn chạy')
  // cùng state nhưng biết mầm thật (server): trận được giải, đội về nhà
  const real = advance({ ...s, marches: s.marches.map(m => ({ ...m, seed: 12345 })) }, s.marches[0].returnAt + HOUR)
  assert.equal(real.reports.length, 1)
  assert.equal(real.marches.length, 0)
})

test('tầng 16–25: số tầng ≤ 15 giữ nguyên từng đơn vị, trên đó thoải hơn; sản lượng tầng cao gấp rưỡi', () => {
  assert.equal(cost('chuDien', 15).linhThach, 72058)
  assert.equal(buildTime(newGame(T0), 'chuDien', 15), Math.round(60 * 1.7 ** 14) * 1000)
  assert.equal(cost('chuDien', 16).linhThach, 87910)
  assert.ok(cost('chuDien', 25).linhThach < 600_000 && buildTime(newGame(T0), 'chuDien', 25) < 50 * HOUR)
  assert.ok(
    storage({ ...newGame(T0), levels: { ...newGame(T0).levels, tangBaoCac: 25 } }) > cost('chuDien', 25).linhThach,
    'kho tầng 25 chứa nổi Chủ điện 25',
  )
  const at = (l: number) => rate({ ...newGame(T0), levels: { ...newGame(T0).levels, tuLinhTran: l } }, 'linhThach')
  assert.equal(at(16) - at(15), 1.5 * (at(15) - at(14)))
  // độ kiếp tầng 15 và 20; luân hồi từ 15 (kể cả khi đã lên cao hơn)
  assert.equal(upgradeError(rich(15), 'chuDien'), 'trib')
  assert.equal(upgradeError(rich(20), 'chuDien'), 'trib')
  assert.equal(err(rich(22), { type: 'rebirth' }), null)
  assert.equal(err(rich(16, 16), { type: 'train', unit: 'kiem4', n: 1 }), null)
  assert.equal(err(rich(16, 15), { type: 'train', unit: 'kiem4', n: 1 }), 'locked')
})

test('ngũ hành: không có hành thì trận y như cũ; hành khắc thì mạnh hơn, bị khắc thì yếu hơn', () => {
  const side = (el?: Side['el']): Side => ({ el, troops: [{ type: 'kiem', tier: 1, n: 60, atk: 12, def: 5, hp: 30 }] })
  const foe = (el?: Side['el']): Side => ({ el, troops: [{ type: 'kiem', tier: 1, n: 60, atk: 12, def: 5, hp: 30 }] })
  assert.deepEqual(fight(side('kim'), foe(), 5), fight(side(), foe(), 5), 'địch không hành: hệ số 1')
  // hai đội ngang nhau: không hành thì hoà dần (bên đánh rút), khắc thì thắng, bị khắc thì địch còn đông hơn
  assert.equal(fight(side('kim'), foe('moc'), 5).win, true, 'Kim khắc Mộc')
  const foeLeft = (f: ReturnType<typeof fight>) => f.rounds.at(-1)!.n[1][0]
  assert.ok(foeLeft(fight(side('moc'), foe('kim'), 5)) > foeLeft(fight(side(), foe(), 5)), 'Mộc bị Kim khắc')
  assert.equal(sideOf(rich(5), 'thanhPhong', { kiem1: 1 }).el, 'moc')
})

test('Luyện Khí Phòng: luyện pháp bảo theo tầng, đeo cho một trưởng lão, bonus chỉ cho đội người đó', () => {
  let s: State = { ...rich(8, 3), elders: { thanhPhong: 0, thachKien: 0 } }
  assert.equal(
    err({ ...s, levels: { ...s.levels, luyenKhiPhong: 0 } }, { type: 'forge', gear: 'thanhSuong' }),
    'locked',
  )
  s = run(s, { type: 'forge', gear: 'thanhSuong' })
  assert.equal(err(s, { type: 'forge', gear: 'hoTam' }), 'busy')
  s = advance(s, s.forge!.finishAt)
  assert.deepEqual(s.gear.thanhSuong, { lv: 1 })
  s = advance(run(s, { type: 'forge', gear: 'thanhSuong' }), s.time + gearTime(s, 'thanhSuong', 2))
  assert.equal(err(s, { type: 'forge', gear: 'thanhSuong' }), 'locked', 'tầng 3 luyện tối đa cấp 2')
  const atk = (st: State, e: 'thanhPhong' | 'thachKien') => sideOf(st, e, { kiem1: 1 }).troops[0].atk
  const bare = atk(s, 'thanhPhong')
  s = run(s, { type: 'equip', gear: 'thanhSuong', elder: 'thanhPhong' })
  assert.ok(atk(s, 'thanhPhong') > bare)
  assert.equal(atk(s, 'thachKien'), atk({ ...s, gear: {} }, 'thachKien'), 'người khác không được gì')
  // chuyển sang người khác; tháo ra
  s = run(s, { type: 'equip', gear: 'thanhSuong', elder: 'thachKien' })
  assert.equal(s.gear.thanhSuong!.on, 'thachKien')
  assert.equal(run(s, { type: 'equip', gear: 'thanhSuong', elder: null }).gear.thanhSuong!.on, undefined)
  assert.equal(err(s, { type: 'equip', gear: 'hoTam', elder: 'thanhPhong' }), 'locked', 'chưa luyện')
  // đang xuất chinh: không đổi
  const out = run(
    { ...s, troops: { ...s.troops, kiem1: 50 } },
    { type: 'march', target: { kind: 'beast', i: 0 }, elder: 'thachKien', army: { kiem1: 50 } },
  )
  assert.equal(err(out, { type: 'equip', gear: 'thanhSuong', elder: 'thanhPhong' }), 'busy')
  assert.equal(migrate(JSON.parse(JSON.stringify(s)))!.gear.thanhSuong!.on, 'thachKien')
})

test('thiên phú: mỗi 5 cấp một điểm, mỗi nhánh tối đa 5, Tẩy Tủy Đan trả lại; nhánh đạo mạnh công pháp', () => {
  let s: State = { ...rich(16), elders: { thanhPhong: expAt(12) }, items: { taiTuy: 1 } }
  assert.equal(talentPoints(s, 'thanhPhong'), 2)
  s = run(s, { type: 'talent', elder: 'thanhPhong', branch: 2 })
  s = run(s, { type: 'talent', elder: 'thanhPhong', branch: 0 })
  assert.equal(err(s, { type: 'talent', elder: 'thanhPhong', branch: 1 }), 'not_enough')
  assert.deepEqual(s.talents.thanhPhong, [1, 0, 1])
  const sk = sideOf(s, 'thanhPhong', { kiem1: 1 }).skill!
  assert.ok(sk.v > sideOf(rich(16), 'thanhPhong', { kiem1: 1 }).skill!.v)
  assert.equal(
    err(
      { ...s, elders: { thanhPhong: expAt(40) }, talents: { thanhPhong: [5, 0, 0] } },
      { type: 'talent', elder: 'thanhPhong', branch: 0 },
    ),
    'max_level',
  )
  s = run(s, { type: 'wash', elder: 'thanhPhong' })
  assert.equal(s.talents.thanhPhong, undefined)
  assert.equal(s.items.taiTuy, 0)
  assert.equal(err(s, { type: 'wash', elder: 'thanhPhong' }), 'no_item')
})

test('đan mới: công thức cần đan khác, Hồi Xuân chữa ngay, Ngưng Thần tăng công có hạn, Đại Tụ Khí bớt 2 giờ, Phá Cảnh cho độ kiếp', () => {
  let s: State = { ...rich(16), items: { tuKhi: 5 } }
  assert.equal(err(s, { type: 'brew', pill: 'daiTuKhi', n: 1 }), 'no_item')
  s = run({ ...s, items: { tuKhi: 7 } }, { type: 'brew', pill: 'daiTuKhi', n: 1 })
  assert.equal(s.items.tuKhi, 1, 'trừ 6 viên nguyên liệu lúc bắt đầu')
  s = advance(s, s.brew!.finishAt)
  s = up(s, 'chuDien')
  const before = s.queue[0].finishAt
  assert.equal(
    run(s, { type: 'speed', job: 'build', n: 1, pill: 'daiTuKhi' }).queue[0]?.finishAt ?? s.time,
    Math.max(s.time, before - 2 * HOUR),
  )
  // Hồi Xuân: thương binh không nằm trong đợt đang chữa, bậc cao trước
  const hurt: State = { ...rich(16), wounded: { ...rich(16).wounded, kiem1: 400, kiem3: 50 }, items: { hoiXuan: 1 } }
  const c = run(hurt, { type: 'cure' })
  assert.equal(c.troops.kiem3, 50)
  assert.equal(c.troops.kiem1, 250)
  assert.equal(count(c.wounded), 150)
  assert.equal(err({ ...hurt, wounded: rich(16).wounded }, { type: 'cure' }), 'empty')
  // Ngưng Thần: công +10 % tới lúc hết, uống thêm thì kéo dài
  const f = run({ ...rich(16), items: { ngungThan: 2 } }, { type: 'focus' })
  const atk = (st: State) => sideOf(st, 'thanhPhong', { kiem1: 1 }).troops[0].atk
  assert.ok(atk(f) > atk(rich(16)))
  assert.equal(run(f, { type: 'focus' }).buffs[0].until, f.time + 4 * HOUR)
  assert.equal(atk(advance(f, f.time + 2 * HOUR)), atk(rich(16)), 'hết giờ thì gỡ')
  // Phá Cảnh: tự dùng khi bật đan độ kiếp, mạnh hơn Độ Kiếp Đan
  const t: State = {
    ...rich(15),
    troops: { ...rich(15).troops, kiem3: 1, phap3: 1, the3: 1 },
    items: { doKiep: 1, phaCanh: 1 },
    trib: 2,
  }
  const tried = run(t, { type: 'trib', elder: 'thanhPhong', army: { kiem3: 1 }, pill: true })
  assert.deepEqual([tried.items.phaCanh, tried.items.doKiep], [0, 1])
})

test('bí cảnh mới và tháp thu nhận trưởng lão mới; save bản 3 nâng lên bản 4', () => {
  assert.equal(err(rich(15), { type: 'realm', i: 3, elder: 'thanhPhong', army: { kiem1: 1 } }), 'locked')
  assert.equal(enemyOf(rich(16), { kind: 'realm', i: 3 }).el, 'moc')
  assert.equal(towerReward(29).elder, 'macSau')
  assert.equal(towerReward(44).elder, 'diepCoThanh')
  // bản 3: không có công trình, bậc, bí cảnh mới
  const v4 = { ...rich(12), troops: { ...rich(12).troops, kiem3: 7 } }
  const v3: any = JSON.parse(JSON.stringify({ ...v4, v: 3, realms: [5, 2, 0] }))
  for (const k of ['forge', 'gear', 'talents', 'buffs']) delete v3[k]
  for (const u of ['kiem4', 'kiem5', 'phap4', 'phap5', 'the4', 'the5']) {
    delete v3.troops[u]
    delete v3.wounded[u]
  }
  delete v3.levels.luyenKhiPhong
  const m = migrate(v3)!
  assert.equal(m.v, 4)
  assert.equal(m.troops.kiem3, 7)
  assert.equal(m.troops.the5, 0)
  assert.deepEqual(m.realms, [5, 2, 0, 0, 0])
  assert.equal(m.levels.luyenKhiPhong, 0)
  assert.equal(m.forge, null)
})
