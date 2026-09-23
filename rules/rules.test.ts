import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BASE_RATE, BEASTS, DAILY_RES, HOSPITAL_BASE, PILLS, QUESTS, SPEEDUP, TRIBS, advance, apply, beastStr, brewTime, buildTime, cost, count,
  elderLevel, expAt, fight, healCost, hospital, marchTime, migrate, newGame, nextDay, power, questDone, sideOf, storage,
  techTime, trainCost, trainTime, upgradeError, winChance,
  type Action, type BuildingId, type Side, type State,
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
  assert.equal(err({ ...s, res: { linhThach: 0, linhThao: 0, linhKhoang: 0 } }, { type: 'upgrade', building: 'linhDien' }), 'not_enough')
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
  assert.equal(err(s, { type: 'march', target: { kind: 'beast', i: 0 }, elder: 'thanhPhong', army: { the1: 1 } }), 'busy')
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
  assert.equal(err({ ...home, troops: { ...home.troops, the1: 10 } }, { type: 'march', target, elder: 'thanhPhong', army: { the1: 10 } }), 'cooldown')
})

test('yêu thú cấp sau chỉ mở khi đã hạ cấp trước', () => {
  const s = { ...rich(5), troops: { ...rich(5).troops, kiem1: 10 } }
  assert.equal(err(s, { type: 'march', target: { kind: 'beast', i: 1 }, elder: 'thanhPhong', army: { kiem1: 10 } }), 'locked')
  assert.equal(err({ ...s, beast: 1 }, { type: 'march', target: { kind: 'beast', i: 1 }, elder: 'thanhPhong', army: { kiem1: 10 } }), null)
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
  assert.equal(err({ ...s, brew: { pill: 'tuKhi', n: 1, startAt: s.time, finishAt: s.time + 1e6 } }, { type: 'speed', job: 'brew', n: 1 }), 'bad')
  assert.equal(err(s, { type: 'brew', pill: 'doKiep', n: 1 }), null)
  assert.equal(err({ ...s, levels: { ...s.levels, danPhong: PILLS.doKiep.unlock - 1 } }, { type: 'brew', pill: 'doKiep', n: 1 }), 'locked')
})

test('độ kiếp: Chủ điện tầng 5 không nâng được mà phải vượt lôi kiếp', () => {
  let s = rich(5)
  assert.equal(upgradeError(s, 'chuDien'), 'trib')
  // Quân yếu: thất bại, phải chờ
  const weak = run({ ...s, troops: { ...s.troops, kiem1: 5 } }, { type: 'trib', elder: 'thanhPhong', army: { kiem1: 5 }, pill: false })
  assert.equal(weak.levels.chuDien, 5)
  assert.equal(weak.reports.at(-1)!.win, false)
  assert.equal(err({ ...weak, troops: { ...weak.troops, kiem1: 5 } }, { type: 'trib', elder: 'thanhPhong', army: { kiem1: 5 }, pill: false }), 'cooldown')
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
  const t = run({ ...rich(5), troops: { ...rich(5).troops, kiem1: 1 } }, { type: 'trib', elder: 'thanhPhong', army: { kiem1: 1 }, pill: false })
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
  assert.equal(r.levels.chuDien, 1)
  assert.equal(r.rebirths, 1)
  assert.deepEqual(r.tech, s.tech)
  assert.deepEqual(r.elders, s.elders)
  assert.ok(buildTime(r, 'chuDien', 2) < buildTime(newGame(T0), 'chuDien', 2))
  assert.equal(err(rich(14), { type: 'rebirth' }), 'locked')
})

test('nhiệm vụ ngày: đếm tiến độ, nhận thưởng từng việc, rương khi đủ 4, sang ngày mới thì làm lại', () => {
  let s = { ...rich(6, 5), troops: { ...rich(6, 5).troops, kiem1: 2000 } }
  assert.equal(err(s, { type: 'daily', i: 0 }), 'not_done')
  s = up(s, 'tuLinhTran')
  s = advance(s, s.time + buildTime(s, 'tuLinhTran', 6))
  s = up(s, 'linhDien')
  s = run(s, { type: 'train', unit: 'kiem1', n: 60 })
  s = run(s, { type: 'brew', pill: 'tuKhi', n: 1 })
  for (let k = 0; k < 3; k++) s = run({ ...s, realms: [0, 0, 0] }, { type: 'realm', i: 0, elder: 'thanhPhong', army: { kiem1: s.troops.kiem1 } })
  assert.deepEqual(s.daily.n, { build: 2, train: 60, win: 3, brew: 1 })
  assert.equal(err(s, { type: 'dailyBonus' }), 'not_done')
  const before = s.res.linhThach
  for (let i = 0; i < 4; i++) s = run(s, { type: 'daily', i })
  assert.equal(s.res.linhThach, before + 4 * DAILY_RES * 6)
  assert.equal(err(s, { type: 'daily', i: 0 }), 'max_level')
  s = run(s, { type: 'dailyBonus' })
  assert.equal(s.items.boiNguyen, 1)
  assert.equal(err(s, { type: 'dailyBonus' }), 'max_level')
  // 0h giờ VN hôm sau: làm lại từ đầu
  const fresh = advance(s, nextDay(s.time))
  assert.deepEqual(fresh.daily.n, { build: 0, train: 0, win: 0, brew: 0 })
  assert.equal(fresh.daily.bonus, false)
  assert.equal(advance(s, nextDay(s.time) - 1).daily.bonus, true)
  // Chưa tới tầng 3 thì khoá
  assert.equal(err(rich(2), { type: 'daily', i: 0 }), 'locked')
})

test('save bản 2 đọc được, giữ tiến độ và đúng nhiệm vụ', () => {
  const v2 = {
    v: 2, name: 'Lạc Hà Tông', quest: 4, time: T0, res: { linhThach: 5, linhThao: 6, linhKhoang: 7 },
    carry: { linhThach: 0, linhThao: 0, linhKhoang: 0 },
    levels: { chuDien: 2, tuLinhTran: 1, linhDien: 1, khoangMach: 1, tangBaoCac: 0, dienVoTruong: 0, tangKinhCac: 0, danPhong: 0 },
    queue: [{ building: 'tangBaoCac', level: 1, finishAt: T0 + 5000 }],
  }
  const s = migrate(v2)!
  assert.equal(s.v, 3)
  assert.equal(s.name, 'Lạc Hà Tông')
  assert.equal(s.levels.chuDien, 2)
  assert.deepEqual(QUESTS[s.quest], QUESTS.find(q => q.k === 'build' && q.id === 'tangBaoCac' && q.n === 1))
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

test('mọi nhiệm vụ đều làm được: đích đến có thật trong dữ liệu', () => {
  for (const q of QUESTS) {
    if (q.k === 'hunt') assert.ok(q.n <= BEASTS.length)
    if (q.k === 'build') assert.ok(q.id && q.n <= 15)
  }
  assert.equal(questDone(newGame(T0)), false)
  assert.ok(power(rich(5)) > power(newGame(T0)))
  assert.ok(hospital(rich(5)) > HOSPITAL_BASE)
})
