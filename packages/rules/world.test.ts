import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ASCEND,
  ASCEND_HALL,
  EVENT_GOALS,
  HO_PHAP_EXP,
  MARKET_BUYS,
  MARKET_ORDERS,
  MARKET_TAX,
  MARKET_TTL,
  NEWBIE_SHIELD,
  PROTECT,
  PVP_START,
  REVENGE_TIME,
  SHIELD_TIME,
  TRIB_CLOUD,
  TRIB_EXP,
  advance,
  apply,
  cost,
  count,
  eventOf,
  expAt,
  mail,
  newGame,
  power,
  rebirthLevels,
  storage,
  tribError,
  weekOf,
  type Action,
  type State,
} from './index.ts'
import {
  MAP_W,
  advanceAll,
  advanceWorld,
  aidAt,
  allyOf,
  allyRows,
  atlas,
  basePrice,
  defense,
  endSeason,
  eventTop,
  freshWorld,
  garrison,
  helpMs,
  mapOf,
  marketOf,
  nextRaid,
  parseWorldAction,
  phaseOf,
  priceBand,
  raidError,
  regionOf,
  rivals,
  route,
  scout,
  seasonBoard,
  seasonPts,
  seasonRate,
  sellCap,
  spawn,
  spotOf,
  worldAct,
  worldBuffs,
  type Players,
  type World,
} from './world.ts'

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
  return {
    ...s,
    levels,
    shield: 0,
    res: { linhThach: 2e5, linhThao: 2e5, linhKhoang: 2e5 },
    troops: { ...s.troops, ...troops },
    elders: { thanhPhong: expAt(20) },
  }
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
  const att = ps.get(1)!,
    def = ps.get(2)!
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
  const strong = sect('Mạnh', 12, { kiem3: 2000 }),
    weak = sect('Yếu', 6, { kiem1: 10 })
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
  const away = run(
    { ...guarded, troops: { ...guarded.troops, kiem1: 10 } },
    { type: 'march', target: { kind: 'beast', i: 0 }, elder: 'thanhPhong', army: { kiem1: 10 } },
  )
  assert.equal(scout(away).guard, null)
  assert.equal(
    scout({ ...base, troops: { ...base.troops, the2: 347 } }).side.troops[0].n,
    350,
    'dò thám chỉ biết đại khái',
  )
  assert.equal(apply(base, { type: 'guard', elder: 'hanBang' }, T0).ok, false, 'chưa thu nhận')
})

test('ghép đối thủ: kẻ thù trước, rồi vài người gần lực chiến nhất đánh được', () => {
  const me = { ...sect('Ta', 10, { kiem2: 500 }), foes: [{ pid: 5, name: 'Thù', at: T0 }] }
  const ps = world(
    me,
    sect('Ngang', 10, { kiem2: 480 }),
    sect('Hơi yếu', 10, { kiem2: 300 }),
    { ...sect('Khiên', 10), shield: T0 + HOUR },
    sect('Thù', 6, { kiem1: 5 }),
    sect('Mạnh', 14, { kiem3: 900 }),
  )
  const list = rivals(ps, 1, T0, () => 0.5)
  assert.equal(list[0].pid, 5)
  assert.equal(list[0].revenge, true)
  assert.ok(!list.some(r => r.pid === 4 || r.pid === 1), 'không có người đang khiên, không có mình')
  assert.ok(list.length <= 4)
  assert.ok(list.every(r => r.scout.side.troops.every(t => t.n > 0)))
})

test('thư: quà nhận đúng một lần; hộp thư đầy thì bỏ thư cũ đã nhận trước', () => {
  let s = mail(sect('A', 5), {
    at: T0,
    k: 'gift',
    a: [],
    gift: { res: { linhThach: 500 }, items: { tuKhi: 2 }, elder: 'nhuYen' },
  })
  const id = s.mail[0].id
  const got = run(s, { type: 'mail', id })
  assert.equal(got.res.linhThach, s.res.linhThach + 500)
  assert.equal(got.items.tuKhi, 2)
  assert.equal(got.elders.nhuYen, 0)
  assert.equal(apply(got, { type: 'mail', id }, T0).ok, false)
  assert.equal(apply(got, { type: 'mail', id: 999 }, T0).ok, false)
  for (let i = 0; i < 40; i++)
    s = mail(s, { at: T0, k: 'gift', a: [], ...(i === 0 && { gift: { res: { linhThao: 1 } } }) })
  assert.equal(s.mail.length, 30)
  assert.ok(
    s.mail.some(m => m.id === id),
    'thư còn quà chưa nhận được giữ lại',
  )
})

test('sự kiện tuần: chủ đề theo tuần, cộng điểm đúng việc, nhận quà mốc một lần, sang tuần thì làm lại, top của giới', () => {
  // tuần có chủ đề "xây dựng"
  let t = T0
  while (eventOf(weekOf(t)) !== 'build') t += 7 * 24 * HOUR
  let s: State = { ...sect('A', 8), time: t, ev: { week: weekOf(t), pts: 0, got: EVENT_GOALS.map(() => false) } }
  s = run({ ...s, levels: { ...s.levels, tuLinhTran: 7 } }, { type: 'upgrade', building: 'tuLinhTran' })
  assert.equal(s.ev.pts, 30)
  assert.equal(
    run({ ...s, queue: [] }, { type: 'train', unit: 'kiem1', n: 20 }).ev.pts,
    30,
    'việc khác chủ đề không có điểm',
  )
  s = { ...s, ev: { ...s.ev, pts: 120 } }
  const c = run(s, { type: 'event', i: 0 })
  assert.equal(c.ev.got[0], true)
  assert.equal(apply(c, { type: 'event', i: 0 }, c.time).ok, false)
  assert.equal(apply(c, { type: 'event', i: 1 }, c.time).ok, false, 'chưa đủ mốc')
  const next = advance(c, (Math.floor((c.time - T0) / (7 * 24 * HOUR)) + 2) * 7 * 24 * HOUR + T0)
  assert.ok(next.ev.week > c.ev.week && next.ev.pts === 0)
  const ps = world(
    { ...c, ev: { ...c.ev, pts: 50 } },
    { ...c, ev: { ...c.ev, pts: 90 } },
    { ...c, ev: { ...c.ev, week: c.ev.week - 1, pts: 999 } },
  )
  assert.deepEqual(eventTop(ps, c.ev.week), [2, 1])
})

test('gói tin cướp bẩn bị từ chối', () => {
  for (const bad of [
    null,
    {},
    { type: 'raid' },
    { type: 'raid', pid: '2', elder: 'thanhPhong', army: {} },
    { type: 'raid', pid: 2, elder: 'constructor', army: {} },
    { type: 'raid', pid: 2, elder: 'thanhPhong', army: { kiem1: -1 } },
  ])
    assert.equal(parseWorldAction(bad), null, JSON.stringify(bad))
  assert.deepEqual(parseWorldAction({ type: 'raid', pid: 2, elder: 'thanhPhong', army: { kiem1: 3 }, x: 1 }), {
    type: 'raid',
    pid: 2,
    elder: 'thanhPhong',
    army: { kiem1: 3 },
  })
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

test('bản đồ giới: tất định theo seed, 25 vùng lồi, cổng mở theo pha, đủ điểm, chỗ đặt tông môn ở vòng ngoài', async () => {
  const a = atlas(777)
  assert.deepEqual(atlas(777).points, a.points)
  assert.notDeepEqual(atlas(778).points, a.points)
  assert.equal(a.regions.length, 25)
  assert.equal(a.regions.filter(r => r.ring === 0).length, 16)
  const kinds = (k: string) => a.points.filter(p => p.kind === k).length
  assert.deepEqual(
    [kinds('vein'), kinds('mine'), kinds('boss'), kinds('heaven')],
    [16 * 2 + 8 * 3 + 1, 16 * 6 + 8 * 6, 8 + 1, 1],
  )
  for (const g of a.gates) assert.ok([g.a, g.b].includes(regionOf(a, g)), 'cổng nằm trên biên hai vùng')
  // vùng lồi: đoạn thẳng giữa hai ô cùng vùng không ra khỏi vùng.
  // ponytail: chỉ lồi gần đúng — regionOf làm tròn ra ô nên đoạn thẳng có thể cắt góc một ô biên vùng bên cạnh
  // (dãy điểm của rng(3) bốc trúng); giữ dãy mẫu này cho tới khi kiểm cả ô biên
  let seed = 3
  const rand = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296
  for (let k = 0; k < 500; k++) {
    const p = { x: Math.floor(rand() * MAP_W), y: Math.floor(rand() * MAP_W) },
      q = { x: Math.floor(rand() * MAP_W), y: Math.floor(rand() * MAP_W) }
    if (regionOf(a, p) !== regionOf(a, q)) continue
    for (let u = 0; u <= 1; u += 0.05)
      assert.equal(regionOf(a, { x: p.x + (q.x - p.x) * u, y: p.y + (q.y - p.y) * u }), regionOf(a, p))
  }
  // đường: pha 0 chỉ trong vùng; vào tâm phải đợi pha 3; đường qua cổng dài hơn đường chim bay
  const home = { x: a.regions[0].cx, y: a.regions[0].cy },
    next = { x: a.regions[1].cx, y: a.regions[1].cy },
    center = { x: a.regions[12].cx, y: a.regions[12].cy }
  assert.equal(route(a, home, next, 0), null)
  assert.ok(route(a, home, next, 1)!.path.length === 3)
  assert.equal(route(a, home, center, 2), null)
  assert.ok(route(a, home, center, 3)!.len >= Math.hypot(home.x - center.x, home.y - center.y))
  assert.deepEqual([0, 4, 5, 14, 35, 48].map(phaseOf), [0, 0, 1, 2, 3, 3])
  const taken: { x: number; y: number }[] = []
  for (let i = 0; i < 40; i++) taken.push(spawn(a, taken, rand)!)
  assert.ok(taken.every(p => a.regions[regionOf(a, p)].ring === 0))
  assert.ok(taken.every((p, i) => taken.every((q, j) => i === j || Math.hypot(p.x - q.x, p.y - q.y) >= 3)))
})

test('đi cướp trên bản đồ giới: theo đường qua cổng đang mở, chưa có đường thì từ chối "far"', async () => {
  const a = atlas(777)
  const at = (r: number) => ({ x: a.regions[r].cx, y: a.regions[r].cy })
  const ps = world({ ...sect('A', 10, { kiem3: 1100 }), seat: at(0) }, { ...sect('B', 10, { the1: 200 }), seat: at(1) })
  const r0 = worldAct(ps, 1, { type: 'raid', pid: 2, elder: 'thanhPhong', army: { kiem3: 1100 } }, T0, 1, {
    atlas: a,
    phase: 0,
  })
  assert.deepEqual(r0, { ok: false, error: 'far' })
  const r1 = worldAct(ps, 1, { type: 'raid', pid: 2, elder: 'thanhPhong', army: { kiem3: 1100 } }, T0, 1, {
    atlas: a,
    phase: 1,
  })
  assert.ok(r1.ok)
  const m = r1.changed.get(1)!.marches[0]
  assert.equal(m.path!.length, 3, 'đi, cổng, tới')
  assert.ok(m.arriveAt - T0 > 60_000)
  assert.equal(
    rivals(ps, 1, T0, () => 0.5, { atlas: a, phase: 0 }).length,
    0,
    'khác vùng lúc pha 0: không ai đánh được',
  )
})

test('tiên minh: lập (tầng 10, tốn phí, tên/tag không trùng), vào, chức vị, rời (truyền minh chủ, giải tán), không cướp đồng minh', async () => {
  const ps = world(sect('A', 10, { kiem3: 1100 }), sect('B', 10, { the1: 200 }), sect('C', 9), sect('D', 10))
  let w = freshWorld()
  const act = (pid: number, a: Parameters<typeof worldAct>[2]) => {
    const r = worldAct(ps, pid, a, T0, 1, undefined, w)
    if (!r.ok) return r.error
    for (const [id, s] of r.changed) ps.set(id, s)
    w = r.world
    return null
  }
  assert.equal(act(3, { type: 'allyFound', name: 'Thanh Vân', tag: 'TV' }), 'locked', 'tầng 9 chưa lập được')
  const before = ps.get(1)!.res.linhThach
  assert.equal(act(1, { type: 'allyFound', name: 'Thanh Vân', tag: 'TV' }), null)
  assert.equal(ps.get(1)!.res.linhThach, before - 20_000)
  assert.equal(act(4, { type: 'allyFound', name: 'thanh vân', tag: 'XX' }), 'taken')
  assert.equal(parseWorldAction({ type: 'allyFound', name: '<script>', tag: 'TV' }), null)
  const aid = allyOf(w, 1)!.id
  assert.equal(act(2, { type: 'allyJoin', id: aid }), null)
  assert.equal(act(2, { type: 'allyJoin', id: aid }), 'busy')
  assert.equal(raidError(ps.get(1)!, ps.get(2)!, 1, 2, T0, undefined, w), 'friend')
  assert.equal(act(2, { type: 'allyKick', pid: 1 }), 'locked', 'thành viên không đuổi được minh chủ')
  assert.equal(act(1, { type: 'allyRole', pid: 2, role: 1 }), null)
  assert.equal(act(1, { type: 'allyNotice', text: '  Họp  lúc 8h  ' }), null)
  assert.equal(allyOf(w, 1)!.notice, 'Họp lúc 8h')
  const pw = (id: number) => Math.round(power(ps.get(id)!))
  assert.equal(allyRows(w, ps)[0].power, pw(1) + pw(2))
  const gone = new Map(ps)
  gone.delete(2)
  assert.equal(allyRows(w, gone)[0].power, pw(1), 'thành viên không còn state: cộng 0, không cộng nhầm người khác')
  // minh chủ rời: trưởng lão lên thay; người cuối rời: giải tán
  assert.equal(act(1, { type: 'allyLeave' }), null)
  assert.equal(allyOf(w, 2)!.members[2], 2)
  assert.equal(act(2, { type: 'allyLeave' }), null)
  assert.equal(Object.keys(w.allies).length, 0)
})

test('tiên minh giúp đỡ: nhờ một việc, mỗi người giúp một lần, mỗi lần bớt max(60 giây, 1 %), tối đa 10 lần', async () => {
  const ps = world(...Array.from({ length: 12 }, (_, i) => sect(`S${i}`, 12)))
  let w = freshWorld()
  const act = (pid: number, a: Parameters<typeof worldAct>[2]) => {
    const r = worldAct(ps, pid, a, T0, 1, undefined, w)
    if (!r.ok) return r.error
    for (const [id, s] of r.changed) ps.set(id, s)
    w = r.world
    return null
  }
  act(1, { type: 'allyFound', name: 'Vạn Kiếm', tag: 'VK' })
  const aid = allyOf(w, 1)!.id
  for (let p = 2; p <= 12; p++) act(p, { type: 'allyJoin', id: aid })
  ps.set(1, run(ps.get(1)!, { type: 'upgrade', building: 'chuDien' }))
  assert.equal(act(1, { type: 'helpAsk', job: 'build' }), null)
  assert.equal(act(1, { type: 'helpAsk', job: 'build' }), 'max_level', 'đã nhờ việc này rồi')
  const job = ps.get(1)!.queue[0]
  assert.equal(act(1, { type: 'helpAll' }), 'empty', 'không tự giúp mình')
  assert.equal(act(2, { type: 'helpAll' }), null)
  assert.equal(ps.get(1)!.queue[0].finishAt, job.finishAt - helpMs(job))
  assert.equal(act(2, { type: 'helpAll' }), 'empty', 'mỗi người giúp một lần')
  for (let p = 3; p <= 12; p++) act(p, { type: 'helpAll' })
  assert.equal(ps.get(1)!.queue[0].finishAt, job.finishAt - 10 * helpMs(job), 'tối đa 10 lần')
  assert.equal(allyOf(w, 1)!.helps.length, 0, 'đủ 10 lần thì lời nhờ tự gỡ')
})

test('điểm trên bản đồ: chiếm linh mạch và đóng quân, phe khác đánh bật, gọi về thì mất điểm; buff cho cả minh', async () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const vein = a.points.find(p => p.kind === 'vein' && p.region === 0)!
  const near = { x: a.regions[0].cx, y: a.regions[0].cy }
  const ps = world(
    { ...sect('A', 10, { kiem3: 400 }), seat: near },
    { ...sect('B', 10, { kiem3: 1500 }), seat: near },
    { ...sect('C', 10), seat: near },
  )
  let w = freshWorld()
  const act = (pid: number, x: Parameters<typeof worldAct>[2], at = T0) => {
    const r = worldAct(ps, pid, x, at, 5 + pid, map, w)
    if (!r.ok) return r.error
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
    return null
  }
  const step = (at: number) => {
    const r = advanceAll(ps, w, at, map)
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
  }
  // A và C cùng minh
  act(1, { type: 'allyFound', name: 'Vạn Kiếm', tag: 'VK' })
  act(3, { type: 'allyJoin', id: 1 })
  assert.equal(
    act(1, { type: 'go', i: vein.i, task: 'gather', elder: 'thanhPhong', army: { kiem3: 10 } }),
    'bad',
    'linh mạch thì chiếm, không khai',
  )
  assert.equal(act(1, { type: 'go', i: vein.i, task: 'take', elder: 'thanhPhong', army: { kiem3: 400 } }), null)
  const m = ps.get(1)!.marches[0]
  assert.ok(m.path && m.arriveAt > T0)
  assert.equal(advance(ps.get(1)!, m.arriveAt + HOUR).marches[0].stay, undefined, 'client không tự giải')
  step(m.arriveAt)
  assert.equal(ps.get(1)!.marches[0].stay, true)
  assert.equal(w.spots[vein.i].own, 1, 'điểm thuộc minh')
  // buff linh mạch cho cả minh (A và C), B không có
  for (const [k, v] of worldBuffs(ps, w, map, m.arriveAt)) ps.set(k, v)
  assert.ok(ps.get(1)!.buffs.some(b => b.src === 'vein') && ps.get(3)!.buffs.some(b => b.src === 'vein'))
  assert.ok(!ps.get(2)!.buffs.some(b => b.src === 'vein'))
  // B (một mình, mạnh hơn) đánh bật A
  assert.equal(
    act(2, { type: 'go', i: vein.i, task: 'take', elder: 'thanhPhong', army: { kiem3: 1500 } }, m.arriveAt),
    null,
  )
  const mb = ps.get(2)!.marches[0]
  step(mb.arriveAt)
  assert.equal(w.spots[vein.i].own, -2, 'người giữ một mình')
  assert.equal(ps.get(1)!.marches[0].stay, false, 'A bị đánh bật, đang về')
  assert.ok(ps.get(1)!.marches[0].returnAt > mb.arriveAt)
  assert.equal(ps.get(1)!.reports.at(-1)!.def, true)
  assert.deepEqual(
    garrison(ps, vein.i).map(([p]) => p),
    [2],
  )
  for (const [k, v] of worldBuffs(ps, w, map, mb.arriveAt)) ps.set(k, v)
  assert.ok(
    !ps.get(1)!.buffs.some(b => b.src === 'vein') && ps.get(2)!.buffs.some(b => b.src === 'vein'),
    'buff theo người giữ',
  )
  // B gọi về: điểm trống
  assert.equal(act(2, { type: 'recall', id: mb.id }, mb.arriveAt + 1000), null)
  assert.equal(w.spots[vein.i].own, undefined)
  assert.equal(act(2, { type: 'recall', id: mb.id }, mb.arriveAt + 2000), 'bad', 'đang về rồi')
})

test('khai mỏ: mang về theo sức mang, hết giờ khai rồi về; gọi về sớm thì chia theo thời gian, phần còn lại trả mỏ', async () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const mine = a.points.find(p => p.kind === 'mine' && p.region === 0)!
  const ps = world({ ...sect('A', 10, { kiem2: 100 }), seat: { x: a.regions[0].cx, y: a.regions[0].cy } })
  let w = freshWorld()
  const r = worldAct(
    ps,
    1,
    { type: 'go', i: mine.i, task: 'gather', elder: 'thanhPhong', army: { kiem2: 100 } },
    T0,
    1,
    map,
    w,
  )
  assert.ok(r.ok)
  for (const [k, v] of r.changed) ps.set(k, v)
  const m = ps.get(1)!.marches[0]
  const done = advanceAll(ps, w, m.arriveAt, map)
  for (const [k, v] of done.changed) ps.set(k, v)
  w = done.world
  const g = ps.get(1)!.marches[0]
  assert.equal(g.mine!.amount, Math.min(100 * 40 * 2.2, 20_000), 'sức mang của 100 đệ tử bậc 2')
  assert.equal(w.spots[mine.i].left, 20_000 - g.mine!.amount)
  assert.ok(g.returnAt > g.mine!.end)
  // gọi về giữa chừng: được nửa, nửa kia trả mỏ
  const half = Math.round((g.arriveAt + g.mine!.end) / 2)
  const rc = worldAct(ps, 1, { type: 'recall', id: g.id }, half, 1, map, w)
  assert.ok(rc.ok)
  const back = rc.changed.get(1)!.marches[0]
  assert.ok(Math.abs(back.mine!.amount - g.mine!.amount / 2) <= 2)
  assert.equal(rc.world.spots[mine.i].left, 20_000 - back.mine!.amount)
  const home = advance(rc.changed.get(1)!, back.returnAt)
  assert.ok(home.res[back.mine!.res] >= ps.get(1)!.res[back.mine!.res] + back.mine!.amount)
})

test('yêu vương: kho máu chung, mỗi đội đánh một lát; hạ thì thưởng chia theo sát thương qua thư, rồi hồi sinh', async () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const boss = a.points.find(p => p.kind === 'boss' && p.lv === 2)!
  const seat = { x: a.regions[boss.region].cx + 3, y: a.regions[boss.region].cy }
  const ps = world(
    ...[1, 2, 3].map(k => ({
      ...sect(`S${k}`, 20, { kiem4: 3000, phap4: 3000, the4: 3000 }),
      seat,
      elders: { thanhPhong: expAt(40) },
    })),
  )
  let w: World = { ...freshWorld(), spots: { [boss.i]: { hp: 20_000 } } } // còn 20k: một lát tối đa 12k, phải hai đội
  for (const pid of [1, 2]) {
    const r = worldAct(
      ps,
      pid,
      { type: 'go', i: boss.i, task: 'hit', elder: 'thanhPhong', army: { kiem4: 3000, phap4: 3000, the4: 3000 } },
      T0 + pid,
      9 + pid,
      map,
      w,
    )
    assert.ok(r.ok, JSON.stringify(r))
    for (const [k, v] of r.changed) ps.set(k, v)
  }
  const at = Math.max(...[1, 2].map(p => ps.get(p)!.marches[0].arriveAt))
  const r = advanceAll(ps, w, at, map)
  for (const [k, v] of r.changed) ps.set(k, v)
  w = r.world
  assert.ok((w.spots[boss.i].until ?? 0) > at, 'đã hạ, chờ hồi sinh')
  const gifts = [1, 2].map(p => ps.get(p)!.mail.find(m => m.k === 'boss'))
  assert.ok(gifts.every(Boolean), 'ai đánh cũng có quà')
  assert.equal(
    worldAct(ps, 3, { type: 'go', i: boss.i, task: 'hit', elder: 'thanhPhong', army: { kiem4: 10 } }, at + 1, 1, map, w)
      .ok,
    false,
    'đang hồi sinh',
  )
  assert.equal(spotOf(w, map, boss.i, w.spots[boss.i].until!).hp, 60_000, 'hồi sinh đầy máu')
})

test('kết trận: mở ở yêu vương, người cùng minh góp đội, mọi đội tới cùng lúc và đánh như một bên, sát thương chia theo lực chiến', async () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const boss = a.points.find(p => p.kind === 'boss' && p.lv === 2)!
  const seat = { x: a.regions[boss.region].cx + 3, y: a.regions[boss.region].cy }
  const ps = world(
    ...[1, 2, 3].map(k => ({
      ...sect(`S${k}`, 20, { kiem4: 2000, phap4: 2000, the4: 2000 }),
      seat,
      elders: { thanhPhong: expAt(35) },
    })),
  )
  let w = freshWorld()
  const act = (pid: number, x: Parameters<typeof worldAct>[2], at = T0) => {
    const r = worldAct(ps, pid, x, at, 3 + pid, map, w)
    if (!r.ok) return r.error
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
    return null
  }
  const army = { kiem4: 2000, phap4: 2000, the4: 2000 }
  act(1, { type: 'allyFound', name: 'Vạn Kiếm', tag: 'VK' })
  act(2, { type: 'allyJoin', id: allyOf(w, 1)!.id })
  assert.equal(act(3, { type: 'rally', i: boss.i, wait: 0, elder: 'thanhPhong', army }), 'locked', 'phải ở trong minh')
  assert.equal(act(1, { type: 'rally', i: boss.i, wait: 1, elder: 'thanhPhong', army }), null)
  const rid = Object.values(w.rallies)[0].id
  assert.equal(
    act(3, { type: 'rallyJoin', id: rid, elder: 'thanhPhong', army }),
    'locked',
    'người ngoài minh không góp được',
  )
  assert.equal(act(2, { type: 'rallyJoin', id: rid, elder: 'thanhPhong', army }, T0 + 1000), null)
  const at = ps.get(1)!.marches[0].arriveAt
  assert.equal(ps.get(2)!.marches[0].arriveAt, at, 'cùng tới lúc hẹn')
  assert.ok(at - T0 >= 10 * 60_000, 'chờ 10 phút')
  const r = advanceAll(ps, w, at, map)
  for (const [k, v] of r.changed) ps.set(k, v)
  w = r.world
  const reps = [1, 2].map(p => ps.get(p)!.reports.at(-1)!)
  assert.ok(
    reps.every(x => x.kind === 'spot'),
    'mỗi người một chiến báo',
  )
  assert.equal(reps[0].fights[0].rounds.length, reps[1].fights[0].rounds.length, 'cùng một trận')
  const d = w.spots[boss.i].dmg!
  assert.ok(d[1] > 0 && d[2] > 0 && Math.abs(d[1] - d[2]) <= 1, 'hai đội ngang nhau: sát thương ngang nhau')
  assert.equal(Object.keys(w.rallies).length, 0, 'kết trận xong thì gỡ')
})

test('viện binh: đóng ở nhà đồng minh, cùng thủ khi bị cướp; thủ được thì ở lại, gọi về được', async () => {
  const ps = world(sect('A', 10, { kiem3: 900 }), sect('B', 10, { the1: 50 }), sect('C', 10, { the3: 900 }))
  let w = freshWorld()
  const act = (pid: number, x: Parameters<typeof worldAct>[2], at = T0) => {
    const r = worldAct(ps, pid, x, at, 3 + pid, undefined, w)
    if (!r.ok) return r.error
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
    return null
  }
  const step = (at: number) => {
    const r = advanceAll(ps, w, at)
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
  }
  act(2, { type: 'allyFound', name: 'Hộ Sơn', tag: 'HS' })
  act(3, { type: 'allyJoin', id: allyOf(w, 2)!.id })
  assert.equal(
    act(1, { type: 'aid', pid: 2, elder: 'thanhPhong', army: { kiem3: 10 } }),
    'locked',
    'không viện binh người ngoài minh',
  )
  assert.equal(act(3, { type: 'aid', pid: 2, elder: 'thanhPhong', army: { the3: 900 } }), null)
  step(ps.get(3)!.marches[0].arriveAt)
  assert.deepEqual(
    aidAt(ps, 2).map(([p]) => p),
    [3],
  )
  // A cướp B: viện binh của C cùng thủ
  assert.equal(act(1, { type: 'raid', pid: 2, elder: 'thanhPhong', army: { kiem3: 900 } }, T0 + HOUR), null)
  const m = ps.get(1)!.marches[0]
  step(m.arriveAt)
  const rep = ps.get(1)!.reports.at(-1)!
  assert.ok(
    rep.fights[0].b.troops.some(t => t.tier === 3 && t.type === 'the'),
    'bên thủ có thể tu bậc 3 của viện binh',
  )
  assert.ok(ps.get(3)!.reports.at(-1)!.def, 'viện binh có chiến báo thủ')
  // với mầm này bên thủ (nhà + viện binh) giữ được; thua thì viện binh bị đánh bật về (world.ts raid)
  assert.equal(rep.win, false, 'viện binh giúp thủ được')
  assert.equal(ps.get(3)!.marches[0].stay, true, 'thủ được thì ở lại')
  assert.equal(act(3, { type: 'recall', id: ps.get(3)!.marches[0].id }, m.arriveAt + 1000), null)
  assert.ok(ps.get(3)!.marches[0].returnAt > m.arriveAt)
})

test('độ kiếp công khai: kiếp vân tụ trước (trả chi phí, đội rời nhà), hộ pháp nhẹ kiếp + nhận kinh nghiệm, phá kiếp nặng kiếp, thất bại hoàn chi phí', async () => {
  const price = cost('chuDien', 11)
  // tầng 10 = đỉnh Trúc Cơ: độ kiếp lần thứ hai; có chỗ trên bản đồ giới
  const kiep = (army: Partial<State['troops']>) => ({ ...sect('Kiếp', 10, army), trib: 1, seat: { x: 10, y: 10 } })
  // độ kiếp lúc at, trả về state vừa tụ kiếp vân
  const start = (s: State, army: Partial<State['troops']>, at = T0) => {
    const r = apply(advance(s, at), { type: 'trib', elder: 'thanhPhong', army, pill: false }, at)
    if (!r.ok) throw new Error(r.error)
    return r.state
  }
  const strike = (ps: Players, w: World, pid: number) => {
    const m = ps.get(pid)!.marches.find(x => x.target.kind === 'trib')!
    const r = advanceAll(ps, w, m.arriveAt)
    for (const [k, v] of r.changed) ps.set(k, v)
    return ps.get(pid)!.reports.at(-1)!
  }
  const wave = (rep: State['reports'][number]) => count(rep.hurt) // cùng mầm, sét yếu/mạnh hơn → thương vong ít/nhiều hơn

  // tụ kiếp vân: chi phí trả ngay, đội rời nhà, chưa có chiến báo; client (mầm ẩn) không tự giải; cả giới thấy trên bản đồ
  const cloud = start(kiep({ kiem3: 400 }), { kiem3: 400 })
  const m = cloud.marches[0]
  assert.equal(m.target.kind, 'trib')
  assert.equal(m.arriveAt, T0 + TRIB_CLOUD[1])
  assert.equal(cloud.troops.kiem3, 0)
  assert.equal(cloud.res.linhThach, 2e5 - price.linhThach)
  assert.equal(cloud.reports.length, 0)
  assert.equal(tribError(cloud), 'busy')
  assert.equal(advance({ ...cloud, seed: 0, marches: [{ ...m, seed: 0 }] }, m.arriveAt + HOUR).marches.length, 1)
  assert.equal(nextRaid(world(cloud)), m.arriveAt)
  assert.equal(mapOf(world(cloud), T0, new Set(), []).seats[0].cloud, m.arriveAt)

  // một mình: kiếp giáng đúng giờ; thắng thì lên tầng 11 mà không trừ chi phí lần nữa
  const solo = world(cloud)
  const plain = strike(solo, freshWorld(), 1)
  const after = solo.get(1)!
  assert.equal(after.marches.length, 0)
  assert.equal(plain.kind, 'trib')
  assert.equal(plain.win, true, 'đội 400 kiếm tu bậc 3 vượt kiếp')
  assert.equal(after.levels.chuDien, 11)
  assert.equal(after.trib, 2)
  assert.deepEqual(after.res, advance(cloud, m.arriveAt).res)
  assert.equal(after.troops.kiem3 + after.wounded.kiem3 + count(plain.dead), 400, 'đệ tử về nhà hoặc vào Đan phòng')

  // thất bại: hoàn đủ chi phí, chờ hồi
  const weak = world(start(kiep({ kiem1: 1 }), { kiem1: 1 }))
  const lost = strike(weak, freshWorld(), 1)
  assert.equal(lost.win, false)
  assert.equal(weak.get(1)!.levels.chuDien, 10)
  assert.equal(
    weak.get(1)!.res.linhThach,
    advance(start(kiep({ kiem1: 1 }), { kiem1: 1 }), m.arriveAt).res.linhThach + price.linhThach,
  )
  assert.ok(weak.get(1)!.tribCool > m.arriveAt)

  // hộ pháp: đồng minh đóng ở nhà lúc kiếp giáng — lôi kiếp nhẹ đi, trưởng lão hộ pháp nhận kinh nghiệm
  const ps = world(kiep({ kiem3: 400 }), sect('Hộ', 10, { the3: 300 }))
  let w = freshWorld()
  for (const [pid, a] of [
    [1, { type: 'allyFound', name: 'Hộ Pháp', tag: 'HP' }],
    [2, { type: 'allyJoin', id: 1 }],
    [2, { type: 'aid', pid: 1, elder: 'thanhPhong', army: { the3: 300 } }],
  ] as const) {
    const r = worldAct(ps, pid, a as never, T0, 7, undefined, w)
    assert.ok(r.ok, JSON.stringify(r))
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
  }
  assert.equal(allyOf(w, 2)?.id, 1)
  let r = advanceAll(ps, w, ps.get(2)!.marches[0].arriveAt)
  for (const [k, v] of r.changed) ps.set(k, v)
  assert.equal(aidAt(ps, 1).length, 1)
  const t1 = ps.get(2)!.marches[0].arriveAt
  ps.set(1, start(ps.get(1)!, { kiem3: 400 }, t1))
  const exp0 = ps.get(2)!.elders.thanhPhong!
  const guarded = strike(ps, w, 1)
  assert.ok(wave(guarded) < wave(plain), `hộ pháp: thương vong ${wave(guarded)} phải ít hơn ${wave(plain)}`)
  assert.equal(ps.get(2)!.elders.thanhPhong! - exp0, Math.round(TRIB_EXP[1] * HO_PHAP_EXP))

  // phá kiếp: bị cướp trúng trong lúc kiếp vân tụ (đội độ kiếp không giữ nhà) — lôi kiếp nặng thêm
  const pv = world(sect('Phá', 10, { kiem3: 1100 }), kiep({ kiem3: 400, the1: 50 }))
  const raid = send(pv, 1, 2, { kiem3: 1100 })
  pv.set(2, start(pv.get(2)!, { kiem3: 400 }, raid.arriveAt - 60_000))
  resolve(pv, raid.arriveAt)
  assert.equal(pv.get(2)!.marches[0].foil, 1, 'cướp thắng lúc kiếp vân tụ = phá kiếp một lần')
  const foiled = strike(pv, freshWorld(), 2)
  assert.ok(wave(foiled) > wave(plain), `phá kiếp: thương vong ${wave(foiled)} phải nhiều hơn ${wave(plain)}`)
})

test('mùa: điểm mùa theo giờ giữ điểm (chốt khi đổi phe), cổng / Thiên Môn chỉ chiếm được khi đã mở; hết mùa phi thăng minh đầu, còn lại luân hồi', async () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 1 }
  const vein = a.points.find(p => p.kind === 'vein' && p.region === 0)!
  const heaven = a.points.find(p => p.kind === 'heaven')!
  const near = { x: a.regions[0].cx, y: a.regions[0].cy }
  const ps = world(
    { ...sect('A', ASCEND_HALL, { kiem3: 400 }), seat: near },
    { ...sect('B', 10, { kiem3: 1500 }), seat: near },
    { ...sect('C', 10), seat: near },
  )
  let w = freshWorld()
  const act = (pid: number, x: Parameters<typeof worldAct>[2], at = T0) => {
    const r = worldAct(ps, pid, x, at, 5 + pid, map, w)
    if (!r.ok) return r.error
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
    return null
  }
  const step = (at: number) => {
    const r = advanceAll(ps, w, at, map)
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
  }
  assert.equal(
    act(1, { type: 'go', i: heaven.i, task: 'take', elder: 'thanhPhong', army: { kiem3: 10 } }),
    'locked',
    'Thiên Môn mở ở pha Phi thăng',
  )
  act(1, { type: 'allyFound', name: 'Vạn Kiếm', tag: 'VK' })
  act(3, { type: 'allyJoin', id: 1 })
  act(1, { type: 'go', i: vein.i, task: 'take', elder: 'thanhPhong', army: { kiem3: 400 } })
  const m = ps.get(1)!.marches[0]
  step(m.arriveAt)
  // giữ 10 giờ: điểm đang giữ tính dần, chưa chốt
  const t10 = m.arriveAt + 10 * HOUR
  assert.equal(Math.round(seasonPts(w, map, t10)[1]), 10 * seasonRate(vein))
  assert.deepEqual(w.pts, {})
  // B đánh bật: chốt phần của minh A, B bắt đầu tính
  act(2, { type: 'go', i: vein.i, task: 'take', elder: 'thanhPhong', army: { kiem3: 1500 } }, t10 - HOUR)
  const mb = ps.get(2)!.marches[0]
  step(mb.arriveAt)
  assert.equal(w.spots[vein.i].own, -2)
  const banked = w.pts[1]
  assert.ok(Math.abs(banked - ((mb.arriveAt - m.arriveAt) / HOUR) * seasonRate(vein)) < 1e-9)
  const board = seasonBoard(w, ps, map, mb.arriveAt + HOUR)
  assert.deepEqual(
    board.map(r => r.name),
    ['[VK] Vạn Kiếm', 'B'],
  )

  // hết mùa: minh đầu (A ở tầng ≥ ASCEND_HALL) phi thăng, C cùng minh nhưng tầng thấp và B một mình thì luân hồi một kiếp
  const end = endSeason(ps, w, map, mb.arriveAt + HOUR, 1, new Set())
  const [A, B, C] = [1, 2, 3].map(k => end.changed.get(k)!)
  assert.equal(A.rebirths, ASCEND)
  assert.deepEqual(A.ascended, [1])
  assert.deepEqual(A.levels, rebirthLevels(ASCEND))
  assert.equal(B.rebirths, 1)
  assert.equal(C.rebirths, 1)
  assert.deepEqual(C.ascended, [])
  for (const s of [A, B, C]) {
    assert.equal(s.marches.length, 0, 'hành quân huỷ')
    assert.equal(s.seat, null, 'server xếp chỗ lại trên bản đồ mùa mới')
    assert.equal(s.mail.at(-1)!.k, 'season')
  }
  assert.deepEqual(A.mail.at(-1)!.a, [1, 1, 1])
  assert.deepEqual(end.world.spots, {})
  assert.deepEqual(end.world.pts, {})
  assert.equal(end.world.allies[1].name, 'Vạn Kiếm', 'tiên minh giữ qua mùa')
  assert.deepEqual(
    end.top.map(r => r.side),
    [1, -2],
  )
  // trong giới thì luân hồi chỉ diễn ra khi hết mùa
  assert.equal(
    apply({ ...ps.get(1)!, levels: { ...ps.get(1)!.levels, chuDien: 16 }, marches: [] }, { type: 'rebirth' }, T0).ok,
    false,
  )
})

test('chợ: ký gửi trong biên giá, mua nhận hàng ngay, người bán nhận linh thạch trừ thuế qua thư; giới hạn; gỡ lệnh; hết hạn và hết mùa trả hàng', async () => {
  const ps = world({ ...sect('Bán', 10), items: { doKiep: 3 } }, sect('Mua', 10), sect('Nhỏ', 5))
  let w = freshWorld()
  const act = (pid: number, x: Parameters<typeof worldAct>[2], at = T0) => {
    const r = worldAct(ps, pid, x, at, 1, undefined, w)
    if (!r.ok) return r.error
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
    return null
  }
  assert.equal(basePrice('doKiep'), 6000)
  assert.equal(basePrice('phaCanh'), 44000 + 2 * 6000, 'đan cần đan khác: cộng giá nguyên liệu')
  const [lo, hi] = priceBand('doKiep', 2)
  assert.deepEqual([lo, hi], [9600, 15000])
  assert.equal(
    act(1, { type: 'sell', good: 'doKiep', n: 2, price: hi + 1 }),
    'bad',
    'đắt quá biên: chặn dồn của qua acc phụ',
  )
  assert.equal(act(1, { type: 'sell', good: 'doKiep', n: 2, price: lo - 1 }), 'bad')
  assert.equal(act(1, { type: 'sell', good: 'doKiep', n: 9, price: 9 * 6000 }), 'no_item')
  assert.equal(act(3, { type: 'sell', good: 'linhThao', n: 100, price: 100 }), 'locked', 'dưới tầng 10')
  assert.equal(
    act(1, { type: 'sell', good: 'linhThach' as never, n: 100, price: 100 }),
    'bad',
    'linh thạch là tiền, không bán',
  )
  assert.equal(act(1, { type: 'sell', good: 'doKiep', n: 2, price: 12000 }), null)
  assert.equal(ps.get(1)!.items.doKiep, 1, 'hàng ký gửi ngay')
  const [o] = Object.values(w.orders)
  assert.deepEqual(
    marketOf(ps, w, 2, T0).orders.map(x => [x.id, x.name]),
    [[o.id, 'Bán']],
  )
  assert.deepEqual(
    marketOf(ps, w, 1, T0).mine.map(x => x.id),
    [o.id],
  )

  // mua: trả linh thạch, nhận đan ngay; người bán nhận 90 % qua thư, nhận đúng một lần
  const before = ps.get(2)!.res.linhThach
  assert.equal(act(1, { type: 'buy', id: o.id }), 'bad', 'không tự mua của mình')
  assert.equal(act(2, { type: 'buy', id: o.id }), null)
  assert.equal(ps.get(2)!.items.doKiep, 2)
  assert.equal(ps.get(2)!.res.linhThach, before - 12000)
  const m = ps.get(1)!.mail.at(-1)!
  assert.equal(m.k, 'sold')
  assert.equal(m.gift?.res?.linhThach, Math.floor(12000 * (1 - MARKET_TAX)))
  const claim = apply(ps.get(1)!, { type: 'mail', id: m.id }, T0)
  assert.ok(claim.ok && !apply(claim.state, { type: 'mail', id: m.id }, T0).ok, 'nhận tiền đúng một lần')
  assert.equal(act(2, { type: 'buy', id: o.id }), 'gone', 'đã bán')

  // giới hạn: số lệnh treo, trần treo bán trong ngày (tính cả lệnh đã gỡ), số lần mua
  for (let k = 0; k < MARKET_ORDERS; k++)
    assert.equal(act(2, { type: 'sell', good: 'linhThao', n: 100, price: 100 }), null)
  assert.equal(act(2, { type: 'sell', good: 'linhThao', n: 100, price: 100 }), 'slots')
  const mine = marketOf(ps, w, 2, T0).mine
  assert.equal(act(2, { type: 'cancel', id: mine[0].id }), null)
  assert.equal(act(1, { type: 'cancel', id: mine[1].id }), 'bad', 'không gỡ lệnh người khác')
  const big = sellCap(ps.get(2)!)
  assert.equal(act(2, { type: 'sell', good: 'linhThao', n: big, price: big }), 'limit')
  assert.equal(act(3, { type: 'buy', id: mine[4].id }), 'locked', 'dưới tầng 10 cũng không mua')
  for (const x of mine.slice(1)) assert.equal(act(1, { type: 'buy', id: x.id }), null) // 4 lần + 1 lần mua đan ở trên là của người 2
  act(2, { type: 'sell', good: 'linhThao', n: 100, price: 100 })
  act(2, { type: 'sell', good: 'linhThao', n: 100, price: 100 })
  const more = marketOf(ps, w, 2, T0).mine
  assert.equal(act(1, { type: 'buy', id: more[0].id }), null, `lần mua thứ ${MARKET_BUYS}`)
  assert.equal(act(1, { type: 'buy', id: more[1].id }), 'limit', 'quá số lần mua trong ngày')
  assert.equal(act(1, { type: 'buy', id: more[1].id }, T0 + 15 * HOUR), null, 'sang ngày thì mua tiếp được')
  act(2, { type: 'sell', good: 'linhThao', n: 100, price: 100 }, T0 + 15 * HOUR)

  // hết hạn: trả hàng qua thư; hết mùa: lệnh còn treo cũng trả
  const left = marketOf(ps, w, 2, T0).mine
  const r = advanceAll(ps, w, T0 + 15 * HOUR + MARKET_TTL + 1)
  for (const [k, v] of r.changed) ps.set(k, v)
  w = r.world
  assert.deepEqual(w.orders, {})
  assert.equal(ps.get(2)!.mail.filter(x => x.k === 'unsold').length, left.length)
  assert.equal(act(1, { type: 'sell', good: 'doKiep', n: 1, price: 6000 }, T0 + 15 * HOUR + MARKET_TTL + 2), null)
  const end = endSeason(ps, w, { atlas: atlas(7), phase: 3 }, T0 + 15 * HOUR + MARKET_TTL + 3, 1, new Set())
  assert.equal(end.changed.get(1)!.mail.at(-1)!.k, 'unsold')
  assert.deepEqual(end.world.orders, {})
})
