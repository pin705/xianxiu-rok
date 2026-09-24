import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EVENT_GOALS, NEWBIE_SHIELD, PROTECT, PVP_START, REVENGE_TIME, SHIELD_TIME, advance, apply, count, eventOf, expAt, newGame, storage, weekOf,
  type Action, type State,
} from './index.ts'
import { advanceWorld, defense, eventTop, mail, nextRaid, parseWorldAction, raidError, rivals, scout, worldAct, type Players } from './world.ts'

const T0 = Date.UTC(2026, 8, 23, 3)
const HOUR = 3_600_000
const run = (s: State, a: Action) => {
  const r = apply(s, a, s.time)
  if (!r.ok) throw new Error(`${a.type}: ${r.error}`)
  return r.state
}
// Tông môn tầng hall, hết khiên tân thủ, đầy kho
function sect(name: string, hall: number, troops: Partial<State['troops']> = {}): State {
  const s = newGame(T0, name)
  const levels = Object.fromEntries(Object.keys(s.levels).map(k => [k, hall])) as State['levels']
  return { ...s, levels, shield: 0, res: { linhThach: 2e5, linhThao: 2e5, linhKhoang: 2e5 }, troops: { ...s.troops, ...troops }, elders: { thanhPhong: expAt(20) } }
}
const world = (...ss: State[]): Players => new Map(ss.map((s, i) => [i + 1, s]))
function send(ps: Players, pid: number, target: number, army: Partial<State['troops']>, now = T0) {
  const r = worldAct(ps, pid, { type: 'raid', pid: target, elder: 'thanhPhong', army }, now, 12345)
  if (!r.ok) throw new Error(r.error)
  for (const [id, s] of r.changed) ps.set(id, s)
  return ps.get(pid)!.marches.at(-1)!
}
function resolve(ps: Players, at: number) {
  for (const [id, s] of advanceWorld(ps, at)) ps.set(id, s)
}

test('cướp: đội mạnh thắng, lấy 30 % phần vượt kho bảo hộ, mang về lúc về nhà; bên thủ mất đúng bấy nhiêu, có khiên, có chiến báo', () => {
  const ps = world(sect('Công', 10, { kiem3: 1100 }), sect('Thủ', 10, { the1: 200 }))
  const m = send(ps, 1, 2, { kiem3: 1100 })
  assert.equal(m.returnAt, 0, 'chưa biết giờ về: server giải trận lúc tới nơi')
  assert.equal(ps.get(1)!.troops.kiem3, 0)
  // client (mầm ẩn) không tự giải trận cướp
  assert.equal(advance(ps.get(1)!, m.arriveAt + HOUR).marches.length, 1)
  assert.equal(nextRaid(ps), m.arriveAt)
  const before = advance(ps.get(2)!, m.arriveAt).res.linhThach
  resolve(ps, m.arriveAt)
  const att = ps.get(1)!, def = ps.get(2)!
  const back = att.marches[0]
  assert.ok(back.returnAt > m.arriveAt && back.back)
  const got = back.gain!.res.linhThach!
  const keep = PROTECT * storage(def)
  assert.equal(got, Math.floor((before - keep) * 0.3 * (1 + 0))) // thanhPhong không có bonus chiến lợi phẩm
  assert.equal(def.res.linhThach, before - got)
  assert.equal(def.shield, m.arriveAt + SHIELD_TIME)
  assert.equal(def.reports.at(-1)!.def, true)
  assert.equal(def.reports.at(-1)!.win, false)
  assert.equal(att.reports.at(-1)!.foe, 'Thủ')
  assert.ok(att.pvp.pts > PVP_START && def.pvp.pts < PVP_START)
  assert.equal(att.pvp.pts - PVP_START, PVP_START - def.pvp.pts, 'điểm chuyển đúng bấy nhiêu')
  assert.equal(def.foes[0].pid, 1)
  assert.ok(count(def.wounded) + count(def.troops) <= 200)
  // về nhà: chiến lợi phẩm vào kho bên đánh
  const home = advance(att, back.returnAt)
  assert.equal(home.marches.length, 0)
  assert.ok(home.res.linhThach >= att.res.linhThach + got)
  // giải lại không làm gì (đã giải)
  assert.equal(advanceWorld(ps, m.arriveAt + 1).size, 0)
  // đội nhỏ: chỉ mang về được theo sức mang (40 × sức bậc mỗi đệ tử còn đứng)
  const small = world(sect('Công', 10, { kiem2: 800 }), sect('Thủ', 10, { the1: 20 }))
  const m2 = send(small, 1, 2, { kiem2: 800 })
  resolve(small, m2.arriveAt)
  const b2 = small.get(1)!.marches[0]
  const loot = Object.values(b2.gain!.res).reduce((a, b) => a + (b ?? 0), 0)
  assert.ok(loot <= b2.back!.kiem2! * 40 * 2.2 && loot > 0.95 * b2.back!.kiem2! * 40 * 2.2)
})

test('cướp: khiên, chênh lực chiến, chưa tới tầng, không tự đánh mình; báo thù bỏ giới hạn lực chiến trong 24 giờ', () => {
  const strong = sect('Mạnh', 12, { kiem3: 2000 }), weak = sect('Yếu', 6, { kiem1: 10 })
  assert.equal(raidError(strong, weak, 1, 2, T0), 'weak')
  assert.equal(raidError(weak, strong, 2, 1, T0), null, 'đánh người mạnh hơn thì được')
  assert.equal(raidError(strong, { ...weak, shield: T0 + 1 }, 1, 2, T0), 'shield')
  assert.equal(raidError(strong, sect('Nhỏ', 5), 1, 2, T0), 'locked')
  assert.equal(raidError(strong, strong, 1, 1, T0), 'gone')
  assert.equal(raidError(strong, undefined, 1, 9, T0), 'gone')
  assert.equal(newGame(T0).shield, T0 + NEWBIE_SHIELD, 'người mới có khiên')
  const angry = { ...strong, foes: [{ pid: 2, name: 'Yếu', at: T0 }] }
  assert.equal(raidError(angry, weak, 1, 2, T0 + REVENGE_TIME - 1), null, 'báo thù')
  assert.equal(raidError(angry, weak, 1, 2, T0 + REVENGE_TIME), 'weak', 'quá 24 giờ')
  // đi cướp thì mất khiên của mình
  const ps = world({ ...sect('A', 8, { kiem2: 100 }), shield: T0 + HOUR }, sect('B', 8, { the1: 5 }))
  send(ps, 1, 2, { kiem2: 100 })
  assert.equal(ps.get(1)!.shield, 0)
  assert.equal(worldAct(ps, 1, { type: 'raid', pid: 2, elder: 'thanhPhong', army: {} }, T0, 1).ok, false)
})

test('giữ nhà: trưởng lão trấn thủ + Hộ Sơn Đại Trận làm bên thủ mạnh hơn; trưởng lão đi vắng thì không tính', () => {
  const base = sect('Thủ', 10, { the2: 300 })
  const bare = defense({ ...base, levels: { ...base.levels, hoSonDaiTran: 0 } })
  const walled = defense(base)
  assert.ok(walled.troops[0].hp > bare.troops[0].hp && walled.troops[0].def > bare.troops[0].def)
  const guarded = run(base, { type: 'guard', elder: 'thanhPhong' })
  assert.ok(defense(guarded).troops[0].atk > walled.troops[0].atk)
  assert.equal(scout(guarded).guard, 'thanhPhong')
  const away = run({ ...guarded, troops: { ...guarded.troops, kiem1: 10 } }, { type: 'march', target: { kind: 'beast', i: 0 }, elder: 'thanhPhong', army: { kiem1: 10 } })
  assert.equal(scout(away).guard, null)
  assert.equal(scout({ ...base, troops: { ...base.troops, the2: 347 } }).side.troops[0].n, 350, 'dò thám chỉ biết đại khái')
  assert.equal(apply(base, { type: 'guard', elder: 'hanBang' }, T0).ok, false, 'chưa thu nhận')
})

test('ghép đối thủ: kẻ thù trước, rồi vài người gần lực chiến nhất đánh được', () => {
  const me = { ...sect('Ta', 10, { kiem2: 500 }), foes: [{ pid: 5, name: 'Thù', at: T0 }] }
  const ps = world(me, sect('Ngang', 10, { kiem2: 480 }), sect('Hơi yếu', 10, { kiem2: 300 }), { ...sect('Khiên', 10), shield: T0 + HOUR }, sect('Thù', 6, { kiem1: 5 }), sect('Mạnh', 14, { kiem3: 900 }))
  const list = rivals(ps, 1, T0, () => 0.5)
  assert.equal(list[0].pid, 5)
  assert.equal(list[0].revenge, true)
  assert.ok(!list.some(r => r.pid === 4 || r.pid === 1), 'không có người đang khiên, không có mình')
  assert.ok(list.length <= 4)
  assert.ok(list.every(r => r.scout.side.troops.every(t => t.n > 0)))
})

test('thư: quà nhận đúng một lần; hộp thư đầy thì bỏ thư cũ đã nhận trước', () => {
  let s = mail(sect('A', 5), { at: T0, k: 'gift', gift: { res: { linhThach: 500 }, items: { tuKhi: 2 }, elder: 'nhuYen' } })
  const id = s.mail[0].id
  const got = run(s, { type: 'mail', id })
  assert.equal(got.res.linhThach, s.res.linhThach + 500)
  assert.equal(got.items.tuKhi, 2)
  assert.equal(got.elders.nhuYen, 0)
  assert.equal(apply(got, { type: 'mail', id }, T0).ok, false)
  assert.equal(apply(got, { type: 'mail', id: 999 }, T0).ok, false)
  for (let i = 0; i < 40; i++) s = mail(s, { at: T0, k: 'gift', ...(i === 0 && { gift: { res: { linhThao: 1 } } }) })
  assert.equal(s.mail.length, 30)
  assert.ok(s.mail.some(m => m.id === id), 'thư còn quà chưa nhận được giữ lại')
})

test('sự kiện tuần: chủ đề theo tuần, cộng điểm đúng việc, nhận quà mốc một lần, sang tuần thì làm lại, top của giới', () => {
  // tuần có chủ đề "xây dựng"
  let t = T0
  while (eventOf(weekOf(t)) !== 'build') t += 7 * 24 * HOUR
  let s: State = { ...sect('A', 8), time: t, ev: { week: weekOf(t), pts: 0, got: EVENT_GOALS.map(() => false) } }
  s = run({ ...s, levels: { ...s.levels, tuLinhTran: 7 } }, { type: 'upgrade', building: 'tuLinhTran' })
  assert.equal(s.ev.pts, 30)
  assert.equal(run({ ...s, queue: [] }, { type: 'train', unit: 'kiem1', n: 20 }).ev.pts, 30, 'việc khác chủ đề không có điểm')
  s = { ...s, ev: { ...s.ev, pts: 120 } }
  const c = run(s, { type: 'event', i: 0 })
  assert.equal(c.ev.got[0], true)
  assert.equal(apply(c, { type: 'event', i: 0 }, c.time).ok, false)
  assert.equal(apply(c, { type: 'event', i: 1 }, c.time).ok, false, 'chưa đủ mốc')
  const next = advance(c, (Math.floor((c.time - T0) / (7 * 24 * HOUR)) + 2) * 7 * 24 * HOUR + T0)
  assert.ok(next.ev.week > c.ev.week && next.ev.pts === 0)
  const ps = world({ ...c, ev: { ...c.ev, pts: 50 } }, { ...c, ev: { ...c.ev, pts: 90 } }, { ...c, ev: { ...c.ev, week: c.ev.week - 1, pts: 999 } })
  assert.deepEqual(eventTop(ps, c.ev.week), [2, 1])
})

test('gói tin cướp bẩn bị từ chối', () => {
  for (const bad of [null, {}, { type: 'raid' }, { type: 'raid', pid: '2', elder: 'thanhPhong', army: {} }, { type: 'raid', pid: 2, elder: 'constructor', army: {} }, { type: 'raid', pid: 2, elder: 'thanhPhong', army: { kiem1: -1 } }])
    assert.equal(parseWorldAction(bad), null, JSON.stringify(bad))
  assert.deepEqual(parseWorldAction({ type: 'raid', pid: 2, elder: 'thanhPhong', army: { kiem1: 3 }, x: 1 }), { type: 'raid', pid: 2, elder: 'thanhPhong', army: { kiem1: 3 } })
})

test('hai đội cùng nhắm một người: trận đầu cho bên thủ khiên, đội sau tới nơi thì quay về tay không', () => {
  const ps = world(sect('A', 10, { kiem3: 1100 }), sect('B', 10, { kiem3: 1100 }), sect('Thủ', 10, { the1: 200 }))
  const m1 = send(ps, 1, 3, { kiem3: 1100 })
  const m2 = send(ps, 2, 3, { kiem3: 1100 }, T0 + 1000)
  resolve(ps, m2.arriveAt)
  assert.equal(ps.get(3)!.reports.filter(r => r.kind === 'pvp').length, 1, 'chỉ một trận')
  const back = ps.get(2)!.marches[0]
  assert.ok(back.returnAt > 0 && back.back?.kiem3 === 1100 && !Object.keys(back.gain!.res).length)
  assert.ok(m1.arriveAt < m2.arriveAt)
})
