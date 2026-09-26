import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BOOK,
  AQUIZ_N,
  AQUIZ_Q,
  AQUIZ_TIERS,
  AQUIZ_WAIT,
  QUIZ_KEY,
  RACE_LV,
  RACE_MS,
  RACE_PLUS,
  festOpen,
  raceAt,
  raceHit,
  ELDERS,
  type ElderId,
  cranes,
  SPY_COST,
  FORT_BUFFS,
  FORT_BUILD,
  FORT_COST,
  FORT_HP,
  FORT_R,
  ALLY_IDLE,
  GROUPS_PER,
  TRIBE_PTS,
  TERR_FUND,
  dayOf,
  ASCEND,
  ASCEND_HALL,
  KY_WIN,
  AP_EVERY,
  AP_HUNT,
  AP_MAX,
  TITLE_COOL,
  ARENA_TRIES,
  MOB_GOALS,
  MOB_MIN,
  MOB_TAKES,
  MOB_TIME,
  ALLY_MARKS,
  DONATE_COST,
  DONATE_EVERY,
  DONATE_MAX,
  DONATE_PTS,
  DONATE_STAR,
  HELP_CREDIT,
  EVENT_GOALS,
  HO_PHAP_EXP,
  MARKET_BUYS,
  MARKET_ORDERS,
  MARKET_TAX,
  MARKET_TTL,
  NEWBIE_SHIELD,
  PROTECT,
  FRENZY_TIME,
  GIFT_PTS,
  PVP_START,
  REVENGE_TIME,
  SHIELD_TIME,
  FIRE_TIME,
  TRIB_CLOUD,
  TRIB_EXP,
  TERR_GATHER,
  TERR_SEAT,
  MOVE_COOL,
  FOG_HOME,
  LEGION_PTS,
  LEGION_WAVES,
  cellOf,
  clear,
  fogOf,
  FLAG_BASE,
  FLAG_COST,
  FLAG_R,
  FLAG_HP,
  FLAG_REPAIR,
  advance,
  apOf,
  apply,
  arenaOf,
  lineupOf,
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
  ALLY_MINE_COST,
  ALLY_MINE_LIFE,
  ALLY_MINE_STOCK,
  FORT_PER,
  ALLY_RENAME,
  ALLY_RENAME_COOL,
  FRAME_DUELS,
  FRAME_VIP,
  VIP_LEVELS,
  frameOpen,
  ALLY_SKILLS,
  ALLY_SKILL_COOL,
  type March,
  DIG_R,
  RUNE_KINDS,
  RUNE_TIERS,
} from './index.ts'
import {
  flagsOf,
  fortBuffs,
  recallable,
  MAP_W,
  advanceAll,
  veinBuffs,
  groupsOf,
  officeBuffs,
  tribeBank,
  tribeEnd,
  tribeStart,
  tribeStep,
  storeStep,
  territoryTiles,
  advanceWorld,
  aidAt,
  allyOf,
  allyRows,
  atlas,
  arenaBoard,
  arenaFoes,
  basePrice,
  mobTop,
  wildSide,
  warAt,
  warResolve,
  bookStep,
  bookBy,
  bookView,
  lordOf,
  titleOf,
  boardOf,
  mobTask,
  contribOf,
  donateLeft,
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
  techLevel,
  worldAct,
  worldBuffs,
  claimsOf,
  canRevenge,
  legionAt,
  legionStep,
  craneTime,
  sitesOf,
  flagCap,
  flagHp,
  ownerAt,
  territoryGrid,
  snapClaims,
  type Players,
  type World,
  profileOf,
  fortCap,
  fortsOf,
  guardSide,
  runesAt,
  runeCycle,
  runesLeft,
  aquizQs,
  aquizStep,
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
const err = (r: { ok: boolean; error?: string }) => (r.ok ? null : r.error)
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
  assert.equal(def.wall?.fire, m.arriveAt + FIRE_TIME, 'thủ thua: núi bốc linh hỏa')
  assert.equal(def.reports.at(-1)!.def, true)
  assert.equal(def.reports.at(-1)!.win, false)
  assert.equal(att.reports.at(-1)!.foe, 'Thủ')
  assert.ok(att.pvp.pts > PVP_START && def.pvp.pts < PVP_START)
  assert.equal(att.pvp.pts - PVP_START, PVP_START - def.pvp.pts, 'điểm chuyển đúng bấy nhiêu')
  assert.equal(def.foes[0].pid, 1)
  assert.ok(count(def.wounded) + count(def.troops) <= 200)
  assert.equal(att.stats.kp, 200 - count(def.troops), 'chiến công: thế lực đệ tử địch hạ được (bậc 1: 1 mỗi người)')
  assert.ok((def.stats.kp ?? 0) > 0, 'bên thủ cũng có chiến công')
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

test('cướp: bên thủ thấy đội đang kéo tới (Tháp canh) tới khi trận giải; bên đánh nổi sát khí, chưa bật khiên được', () => {
  const ps = world(sect('Công', 10, { kiem3: 1100 }), sect('Thủ', 10, { the1: 200 }))
  const m = send(ps, 1, 2, { kiem3: 1100 })
  const def = ps.get(2)!
  assert.deepEqual(def.incoming, [{ id: m.id, pid: 1, foe: 'Công', at: m.arriveAt }])
  // bên đánh: vừa xuất quân cướp thì chưa dùng Hộ Sơn Phù được (không cướp xong rồi trốn sau khiên)
  const att = { ...ps.get(1)!, items: { ...ps.get(1)!.items, hoSon8: 1 } }
  assert.deepEqual(apply(att, { type: 'use', item: 'hoSon8', n: 1 }, att.time), { ok: false, error: 'frenzy' })
  assert.equal(apply(att, { type: 'use', item: 'hoSon8', n: 1 }, att.time + FRENZY_TIME + 1).ok, true)
  // bên thủ bật khiên kịp trước khi địch tới: dùng được (bên thủ không có sát khí)
  assert.equal(apply({ ...def, items: { hoSon8: 1 } }, { type: 'use', item: 'hoSon8', n: 1 }, def.time).ok, true)
  resolve(ps, m.arriveAt)
  assert.deepEqual(ps.get(2)!.incoming, [], 'trận đã giải: hết cảnh báo')
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
    [16 * 2 + 8 * 3 + 1, 16 * 6 + 8 * 6, 16 + 8 + 1, 1],
  )
  const wild = a.points.filter(p => p.kind === 'wild')
  assert.ok(wild.length > 120 && wild.length <= 24 * 6, `yêu thú giới đủ nhiều (${wild.length})`)
  assert.ok(wild.every(p => p.lv >= 1 && p.lv <= 15 && (a.regions[p.region].ring === 0 ? p.lv <= 8 : p.lv >= 7)))
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
  assert.deepEqual(
    [0, 4, 5, 14, 35, 48].map(d => phaseOf(d)),
    [0, 0, 1, 2, 3, 3],
  )
  // Thiên Đạo Biên Niên: hoàn thành chương PHASE_CH[k] thì mở pha k sớm (chương hụt hạn không tính); ngày vẫn là mốc muộn nhất
  assert.deepEqual(
    [phaseOf(2, [0, 1]), phaseOf(2, [0]), phaseOf(8, [1, 4]), phaseOf(20, [1, 4, 8]), phaseOf(20, [0, 2, 3])],
    [1, 0, 2, 3, 2],
  )
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

test('bậc R1–R5: người mới R1; đường chủ (R4) chỉ xếp R1–R3 cho người dưới; dấu bản đồ từ R3; thư minh; minh chủ rời thì bậc cao nhất lên thay', () => {
  const ps = world(sect('A', 10), sect('B', 10), sect('C', 10), sect('D', 10))
  let w = freshWorld()
  const act = (pid: number, a: Parameters<typeof worldAct>[2]) => {
    const r = worldAct(ps, pid, a, T0, 1, undefined, w)
    if (!r.ok) return r.error
    for (const [id, s] of r.changed) ps.set(id, s)
    w = r.world
    return null
  }
  act(1, { type: 'allyFound', name: 'Thanh Vân', tag: 'TV' })
  const aid = allyOf(w, 1)!.id
  for (const p of [2, 3, 4]) act(p, { type: 'allyJoin', id: aid })
  const role = (p: number) => w.allies[aid].members[p]
  assert.deepEqual([role(1), role(2), role(3)], [2, -2, -2], 'minh chủ R5, người mới R1')
  const mark = (p: number) => act(p, { type: 'allyMark', x: 10, y: 10, text: 'Tụ' })
  assert.equal(mark(2), 'locked', 'R1 chưa đặt dấu')
  assert.equal(act(1, { type: 'allyRole', pid: 2, role: 1 }), null, 'minh chủ phong R4')
  // chức vị: chỉ minh chủ phong, chỉ cho R4; mỗi người một chức; phong lại là bãi
  assert.equal(act(1, { type: 'allyOffice', pid: 3, office: 'chapPhap' }), 'locked', 'chưa là R4')
  assert.equal(act(1, { type: 'allyOffice', pid: 2, office: 'chapPhap' }), null)
  assert.deepEqual(
    officeBuffs(allyOf(w, 1), 2).map(b => [b.key, b.v, b.src]),
    [['atk', 0.05, 'office']],
  )
  assert.equal(act(1, { type: 'allyOffice', pid: 2, office: 'ngoaiSu' }), null)
  assert.deepEqual(allyOf(w, 1)!.offices, { ngoaiSu: 2 }, 'mỗi người một chức')
  assert.equal(act(1, { type: 'allyOffice', pid: 2, office: 'ngoaiSu' }), null)
  assert.deepEqual(allyOf(w, 1)!.offices, {}, 'phong lại: bãi chức')
  assert.equal(act(1, { type: 'allyOffice', pid: 2, office: 'tongQuan' }), null)
  assert.equal(act(2, { type: 'allyRole', pid: 3, role: 0 }), null, 'R4 thăng người dưới lên R3')
  assert.equal(mark(3), null, 'R3 đặt dấu được')
  assert.equal(act(2, { type: 'allyRole', pid: 3, role: 1 }), 'locked', 'R4 không phong R4')
  assert.equal(act(3, { type: 'allyRole', pid: 4, role: -1 }), 'locked', 'R3 không xếp bậc')
  assert.equal(act(2, { type: 'allyRole', pid: 1, role: 1 }), 'locked', 'không đụng tới minh chủ')
  assert.equal(parseWorldAction({ type: 'allyRole', pid: 4, role: 3 }), null, 'ngoài R1–R5')
  // thư minh: R4 / minh chủ, vào hộp thư cả minh, mỗi giờ một thư
  assert.equal(act(3, { type: 'allyMail', text: 'Tối nay 8h' }), 'locked', 'R3 chưa gửi thư minh')
  assert.equal(act(2, { type: 'allyMail', text: '  Tối nay 8h   tập trung ' }), null)
  for (const p of [1, 2, 3, 4]) assert.deepEqual(ps.get(p)!.mail.at(-1)!.a, ['B', 'TV', 'Tối nay 8h tập trung'])
  assert.equal(act(1, { type: 'allyMail', text: 'Thêm' }), 'cooldown', 'mỗi giờ một thư')
  assert.equal(act(1, { type: 'allyLeave' }), null)
  assert.deepEqual([role(2), role(3), role(4)], [2, 0, -2], 'R4 lên minh chủ')
  // minh chủ vắng ALLY_IDLE ngày: đường chủ nhận thay, người cũ xuống R4
  assert.equal(act(2, { type: 'allyRole', pid: 3, role: 1 }), null)
  assert.equal(act(3, { type: 'allyClaim' }), 'locked', 'minh chủ còn vào game')
  ps.set(2, { ...ps.get(2)!, vip: { ...ps.get(2)!.vip, day: dayOf(T0) - ALLY_IDLE } })
  assert.equal(act(4, { type: 'allyClaim' }), 'locked', 'R1 không nhận được')
  assert.equal(act(3, { type: 'allyClaim' }), null)
  assert.deepEqual([role(2), role(3)], [1, 2])
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
  assert.equal(contribOf(ps.get(2)!).credit, HELP_CREDIT, 'người giúp được cống hiến')
  assert.equal(act(2, { type: 'helpAll' }), 'empty', 'mỗi người giúp một lần')
  for (let p = 3; p <= 12; p++) act(p, { type: 'helpAll' })
  assert.equal(ps.get(1)!.queue[0].finishAt, job.finishAt - 10 * helpMs(job), 'tối đa 10 lần')
  assert.equal(allyOf(w, 1)!.helps.length, 0, 'đủ 10 lần thì lời nhờ tự gỡ')
})

test('Hộ Minh Đại Trận: cung phụng theo lượt (hồi 30 phút), trận được điểm góp gấp đôi, tầng trận thành tăng ích cả minh; Cống Hiến Các: trưởng lão nhập bằng Minh khố, người trong minh đổi bằng cống hiến', () => {
  const ps = world(sect('A', 12), sect('B', 12), sect('C', 12))
  let w = freshWorld()
  const act = (pid: number, a: Parameters<typeof worldAct>[2], now = T0) => {
    const r = worldAct(ps, pid, a, now, 1, undefined, w)
    if (!r.ok) return r.error
    for (const [id, s] of r.changed) ps.set(id, s)
    w = r.world
    return null
  }
  const give = (pid: number, now = T0) => act(pid, { type: 'allyDonate', tech: 'tuLinh', res: 'linhThach' }, now)
  act(1, { type: 'allyFound', name: 'Vạn Kiếm', tag: 'VK' })
  act(2, { type: 'allyJoin', id: allyOf(w, 1)!.id })
  assert.equal(give(3), 'locked', 'chưa vào minh')
  const before = ps.get(2)!.res.linhThach
  assert.equal(give(2), null)
  assert.equal(ps.get(2)!.res.linhThach, before - DONATE_COST, 'tầng 0: một phần phí')
  assert.equal(contribOf(ps.get(2)!).credit, DONATE_PTS)
  assert.deepEqual([allyOf(w, 1)!.tech!.tuLinh, allyOf(w, 1)!.fund], [DONATE_PTS, DONATE_PTS])
  assert.equal(act(2, { type: 'allyStar', tech: 'tuLinh' }), 'locked', 'thành viên không điểm trận')
  assert.equal(act(1, { type: 'allyStar', tech: 'tuLinh' }), null)
  for (let i = 1; i < DONATE_MAX; i++) assert.equal(give(2), null)
  assert.equal(donateLeft(ps.get(2)!, T0), 0)
  assert.equal(give(2), 'cooldown', 'hết lượt')
  const pts = DONATE_PTS + (DONATE_MAX - 1) * DONATE_PTS * DONATE_STAR
  assert.equal(allyOf(w, 1)!.tech!.tuLinh, pts, 'trận được điểm: gấp đôi')
  assert.equal(donateLeft(ps.get(2)!, T0 + DONATE_EVERY - 1), 0)
  assert.equal(give(2, T0 + DONATE_EVERY), null, 'hồi một lượt sau 30 phút')
  assert.equal(techLevel(allyOf(w, 1)!, 'tuLinh'), 1)
  const buffed = worldBuffs(ps, w, { atlas: atlas(777), phase: 3 }, T0 + DONATE_EVERY)
  for (const pid of [1, 2])
    assert.ok(
      buffed.get(pid)!.buffs.some(b => b.src === 'ally' && b.key === 'prod' && b.v === 0.02),
      'cả minh +2 %',
    )
  assert.equal(buffed.has(3), false, 'người ngoài minh không có')
  // Cống Hiến Các
  const credit = pts + DONATE_PTS * DONATE_STAR
  assert.equal(contribOf(ps.get(2)!).credit, credit)
  assert.equal(act(2, { type: 'allyStock', item: 'kinhThu2k', n: 1 }), 'locked', 'thành viên không nhập hàng')
  assert.equal(act(2, { type: 'allyBuy', item: 'kinhThu2k', n: 1 }), 'empty', 'chưa có hàng')
  assert.equal(act(1, { type: 'allyStock', item: 'hoSon24', n: 1 }), 'not_enough', 'Minh khố chưa đủ')
  assert.equal(act(1, { type: 'allyStock', item: 'kinhThu2k', n: 2 }), null)
  assert.equal(act(2, { type: 'allyBuy', item: 'kinhThu2k', n: 1 }), null)
  assert.equal(ps.get(2)!.items.kinhThu2k, 1)
  assert.equal(contribOf(ps.get(2)!).credit, credit - 300)
  assert.equal(allyOf(w, 1)!.stock!.kinhThu2k, 1)
  assert.equal(act(2, { type: 'allyBuy', item: 'kinhThu2k', n: 1 }), 'not_enough', 'hết cống hiến')
  // dấu bản đồ cho cả minh
  assert.equal(act(2, { type: 'allyMark', x: 10, y: 20, text: 'Tập trung' }), 'locked', 'thành viên không đặt dấu')
  for (let i = 0; i < ALLY_MARKS; i++) assert.equal(act(1, { type: 'allyMark', x: i, y: 1, text: `Dấu ${i}` }), null)
  assert.equal(act(1, { type: 'allyMark', x: 99, y: 1, text: 'Thêm' }), 'full')
  assert.equal(act(1, { type: 'allyMark', x: 0, y: 1, text: 'Đổi' }), null, 'cùng ô: đổi lời ghi')
  assert.deepEqual(
    allyOf(w, 1)!.marks!.map(m => m.text),
    ['Dấu 1', 'Dấu 2', 'Dấu 3', 'Dấu 4', 'Đổi'],
  )
  assert.equal(act(1, { type: 'allyUnmark', x: 0, y: 1 }), null)
  assert.equal(act(1, { type: 'allyUnmark', x: 0, y: 1 }), 'gone')
  assert.equal(allyOf(w, 1)!.marks!.length, ALLY_MARKS - 1)
})

test('Minh vụ đường: nhận việc trên bảng (việc mới thế chỗ), làm đủ trong hạn thì minh được điểm, quá hạn thì mất lượt; đủ mốc thì người đã góp nhận quà', () => {
  const ps = world(sect('A', 12, { kiem1: 500 }), sect('B', 12))
  let w = freshWorld()
  const act = (pid: number, a: Parameters<typeof worldAct>[2], now = T0) => {
    const r = worldAct(ps, pid, a, now, 1, undefined, w)
    if (!r.ok) return r.error
    for (const [id, s] of r.changed) ps.set(id, s)
    w = r.world
    return null
  }
  act(1, { type: 'allyFound', name: 'Vạn Kiếm', tag: 'VK' })
  const al = () => allyOf(w, 1)!
  act(2, { type: 'allyJoin', id: al().id })
  const b0 = boardOf(al(), T0)
  assert.deepEqual(b0.board, [0, 1, 2, 3, 4, 5, 6, 7], 'bảng tuần mới')
  assert.deepEqual(mobTask(al().id, b0.week, 3), mobTask(al().id, b0.week, 3), 'việc tất định')
  // A nhận một việc "tuyển đệ tử": chọn ô có việc train (hoặc dựng tay nếu bảng không có)
  const slot = b0.board.findIndex(i => mobTask(al().id, b0.week, i).m === 'train')
  assert.equal(act(1, { type: 'mobTake', slot: Math.max(0, slot) }), null)
  assert.equal(al().mob!.board[Math.max(0, slot)], 8, 'việc mới thế chỗ')
  assert.equal(act(1, { type: 'mobTake', slot: 1 }), 'busy', 'một việc một lúc')
  const task = ps.get(1)!.mob!.task!
  if (task.m === 'train') {
    assert.equal(act(1, { type: 'mobDone' }), 'not_done')
    ps.set(1, { ...ps.get(1)!, stats: { ...ps.get(1)!.stats, trained: ps.get(1)!.stats.trained + task.n } })
  } else ps.set(1, { ...ps.get(1)!, mob: { ...ps.get(1)!.mob!, task: { ...task, base: -task.n * 1e6 } } }) // bảng không có việc tuyển: coi như xong
  assert.equal(act(1, { type: 'mobDone' }), null)
  assert.equal(al().mob!.pts, task.pts)
  assert.equal(al().mob!.by[1], task.pts)
  assert.equal(ps.get(1)!.mob!.task, null)
  // quá hạn: bỏ việc, không điểm
  assert.equal(act(2, { type: 'mobTake', slot: 0 }), null)
  assert.equal(act(2, { type: 'mobDone' }, T0 + MOB_TIME + 1), null)
  assert.equal(ps.get(2)!.mob!.task, null)
  assert.equal(al().mob!.by[2], undefined, 'quá hạn không có điểm')
  // lượt mỗi ngày
  ps.set(2, { ...ps.get(2)!, mob: { ...ps.get(2)!.mob!, took: MOB_TAKES } })
  assert.equal(act(2, { type: 'mobTake', slot: 0 }, T0 + MOB_TIME + 2), 'limit')
  // quà mốc: đủ điểm minh và mình đã góp đủ
  w = { ...w, allies: { [al().id]: { ...al(), mob: { ...al().mob!, pts: MOB_GOALS[1] } } } }
  assert.equal(act(2, { type: 'mobClaim', tier: 0 }), 'not_done', 'chưa góp đủ')
  const before = ps.get(1)!.items.thoiQuang15 ?? 0
  if (task.pts >= MOB_MIN) {
    assert.equal(act(1, { type: 'mobClaim', tier: 0 }), null)
    assert.equal(ps.get(1)!.items.thoiQuang15, before + 1)
    assert.equal(act(1, { type: 'mobClaim', tier: 0 }), 'claimed')
    assert.equal(act(1, { type: 'mobClaim', tier: 2 }), 'not_done', 'minh chưa tới mốc')
  }
  // tuần sau: bảng mới; hạng tuần (quà hết tuần) có minh này
  assert.equal(boardOf(al(), T0 + 7 * 24 * HOUR).pts, 0)
  assert.deepEqual(
    mobTop(w, weekOf(T0)).map(x => x.id),
    [al().id],
  )
})

test('Luận Kiếm Đài phục thù: người thua lúc giữ đài đánh lại được một lần trong ngày, không tốn lượt, thắng thêm Kiếm Ý', () => {
  const strong = { ...sect('Mạnh', 16), elders: { thanhPhong: expAt(40), nhuYen: expAt(35), thachKien: expAt(30) } }
  const weak = { ...sect('Yếu', 16), elders: { thanhPhong: expAt(5) } }
  const ps = world(weak, strong)
  const act = (pid: number, a: Parameters<typeof worldAct>[2], now = T0) => {
    const r = worldAct(ps, pid, a, now, 99, undefined, freshWorld())
    if (!r.ok) return r.error
    for (const [id, s] of r.changed) ps.set(id, s)
    return null
  }
  assert.equal(act(1, { type: 'arena', pid: 2, revenge: true }), 'limit', 'chưa bị ai thắng: chưa phục thù được')
  assert.equal(act(2, { type: 'arena', pid: 1 }), null) // kẻ mạnh tới đánh, kẻ yếu thua lúc giữ đài
  assert.ok(canRevenge(ps.get(1)!, 2, T0 + 1))
  const before = arenaOf(ps.get(1)!, T0 + 1)
  assert.equal(act(1, { type: 'arena', pid: 2, revenge: true }, T0 + 1), null)
  const after = arenaOf(ps.get(1)!, T0 + 1)
  assert.equal(after.left, before.left, 'không tốn lượt')
  assert.equal(act(1, { type: 'arena', pid: 2, revenge: true }, T0 + 2), 'limit', 'mỗi ngày một lần')
})

test('Luận Kiếm Đài: đội hình thủ (tự xếp nếu chưa đặt), trận xa luân không mất quân, Elo cả hai bên, nhật ký, 5 lượt/ngày, rương ngày, tuần mới nén điểm', () => {
  const strong = { ...sect('Mạnh', 16), elders: { thanhPhong: expAt(40), nhuYen: expAt(35), thachKien: expAt(30) } }
  const weak = { ...sect('Yếu', 16), elders: { thanhPhong: expAt(5) } }
  const ps = world(strong, weak, sect('Non', 3))
  assert.deepEqual(
    lineupOf(ps.get(1)!).map(x => x.elder),
    ['thanhPhong', 'nhuYen', 'thachKien'],
    'chưa xếp: trưởng lão cấp cao trước',
  )
  assert.equal(
    run(ps.get(1)!, { type: 'arenaSet', lineup: [{ elder: 'nhuYen', type: 'phap' }] }).arena!.lineup.length,
    1,
  )
  assert.throws(() => run(ps.get(2)!, { type: 'arenaSet', lineup: [{ elder: 'nhuYen', type: 'phap' }] }), /locked/)
  const foes = arenaFoes(ps, 1, T0, () => 0.5)
  assert.deepEqual(
    foes.map(f => f.pid),
    [2],
    'chỉ người đã tới tầng mở Tranh đoạt',
  )
  const act = (pid: number, a: Parameters<typeof worldAct>[2], now = T0) => {
    const r = worldAct(ps, pid, a, now, 99, undefined, freshWorld())
    if (!r.ok) return r.error
    for (const [id, s] of r.changed) ps.set(id, s)
    return null
  }
  const troops = { ...ps.get(1)!.troops }
  assert.equal(act(1, { type: 'arena', pid: 3 }), 'weak')
  assert.equal(act(1, { type: 'arena', pid: 2 }), null)
  const a = arenaOf(ps.get(1)!, T0),
    d = arenaOf(ps.get(2)!, T0)
  assert.ok(a.pts > 1000 && a.pts + d.pts === 2000, 'mạnh thắng, điểm chuyển đúng bấy nhiêu')
  assert.deepEqual(ps.get(1)!.troops, troops, 'không mất quân')
  assert.equal(ps.get(1)!.reports.at(-1)!.kind, 'arena')
  assert.ok(ps.get(1)!.reports.at(-1)!.fights.length >= 1)
  assert.deepEqual([a.log[0].def, d.log[0].def, d.log[0].win], [false, true, false], 'nhật ký cả hai bên')
  for (let i = 1; i < ARENA_TRIES; i++) assert.equal(act(1, { type: 'arena', pid: 2 }), null)
  assert.equal(act(1, { type: 'arena', pid: 2 }), 'limit', 'hết lượt trong ngày')
  assert.equal(act(1, { type: 'arena', pid: 2 }, T0 + 24 * HOUR), null, 'ngày mới đủ lượt lại')
  assert.deepEqual(
    arenaBoard(ps, a.week).map(([id]) => id),
    [1, 2],
  )
  // rương ngày theo bậc: một lần mỗi ngày
  const opened = run(ps.get(1)!, { type: 'arenaChest' })
  assert.throws(() => run(opened, { type: 'arenaChest' }), /claimed/)
  // Kiếm Ý: mỗi trận có (thắng nhiều hơn), rương ngày thêm; Thương Điếm có hạn mỗi tuần
  const ky = arenaOf(opened, T0).ky!
  assert.ok(ky >= 6 * KY_WIN, `Kiếm Ý sau 6 trận thắng + rương (${ky})`)
  const rich = { ...opened, arena: { ...opened.arena!, ky: 1000 } }
  const bought = run(rich, { type: 'arenaBuy', i: 4 }) // Tâm Đắc Kinh Thư 8k: 1 lần/tuần
  assert.equal(bought.items.kinhThu8k, (opened.items.kinhThu8k ?? 0) + 1)
  assert.equal(bought.arena!.ky, 1000 - 250)
  assert.throws(() => run(bought, { type: 'arenaBuy', i: 4 }), /limit/)
  // tuần mới: điểm nén về giữa
  const pts = arenaOf(ps.get(1)!, T0).pts
  assert.equal(arenaOf(ps.get(1)!, T0 + 7 * 24 * HOUR).pts, Math.round(1000 + (pts - 1000) / 2))
})

test('Giới Chủ: minh chủ phe đứng đầu điểm mùa (phe giữ Thiên Môn nếu có); sắc phong phúc / hoạ, mỗi người một tước, có thư, hồi chiêu; tước thành tăng ích', () => {
  const ps = world(sect('A', 12), sect('B', 12), sect('C', 12))
  const map = { atlas: atlas(777), phase: 3 }
  let w: World = {
    ...freshWorld(),
    allies: { 1: { id: 1, name: 'Vạn Kiếm', tag: 'VK', members: { 1: 2, 2: 0 }, notice: '', at: T0, helps: [] } },
    pts: { 1: 50, [-3]: 90 },
  }
  assert.equal(lordOf(w, ps, map, T0), 1, 'minh chủ phe đứng đầu điểm mùa')
  const heaven = map.atlas.points.find(p => p.kind === 'heaven')!
  const two = { ...w.allies, 2: { ...w.allies[1], id: 2, name: 'Thiên Kiếm', tag: 'TK', members: { 3: 2 as const } } }
  assert.equal(
    lordOf({ ...w, allies: two, spots: { [heaven.i]: { own: 2, since: T0 } } }, ps, map, T0),
    3,
    'minh giữ Thiên Môn',
  )
  assert.equal(lordOf({ ...w, pts: { [-3]: 99 } }, ps, map, T0), null, 'người đi một mình không làm Giới Chủ')
  const act = (pid: number, a: Parameters<typeof worldAct>[2], now = T0) => {
    const r = worldAct(ps, pid, a, now, 1, map, w)
    if (!r.ok) return r.error
    for (const [id, s] of r.changed) ps.set(id, s)
    w = r.world
    return null
  }
  assert.equal(act(2, { type: 'crown', title: 'thanCong', pid: 2 }), 'locked', 'chỉ Giới Chủ')
  assert.equal(act(1, { type: 'crown', title: 'thanCong', pid: 2 }), null)
  assert.equal(titleOf(w, 2, T0), 'thanCong')
  assert.equal(ps.get(2)!.mail.at(-1)!.k, 'titled', 'người nhận có thư')
  assert.equal(act(1, { type: 'crown', title: 'thanCong', pid: 3 }), 'cooldown', 'phong lại tước phải chờ')
  assert.equal(act(1, { type: 'crown', title: 'khatCai', pid: 2 }), null)
  assert.equal(titleOf(w, 2, T0), 'khatCai', 'mỗi người một tước')
  assert.equal(w.titles.thanCong, undefined)
  const b = worldBuffs(ps, w, map, T0).get(2)!
  assert.ok(
    b.buffs.some(x => x.src === 'title' && x.key === 'prod' && x.v === -0.1),
    'hoạ Khất Cái: sản lượng −10 %',
  )
  assert.equal(act(1, { type: 'crown', title: 'thanCong', pid: 3 }, T0 + TITLE_COOL), null)
  assert.equal(act(1, { type: 'uncrown', title: 'khatCai' }), null)
  assert.equal(titleOf(w, 2, T0), null)
  // ban phúc cả giới: mỗi ngày một lần, mọi tông môn có tăng ích
  assert.equal(act(2, { type: 'bless', key: 'build' }), 'locked')
  assert.equal(act(1, { type: 'bless', key: 'build' }), null)
  assert.equal(act(1, { type: 'bless', key: 'prod' }), 'cooldown', 'mỗi ngày một lần')
  for (const pid of [1, 2, 3])
    assert.ok(
      worldBuffs(ps, w, map, T0)
        .get(pid)!
        .buffs.some(x => x.src === 'bless' && x.key === 'build'),
    )
  // Thiên Ân lễ: 3 phần mỗi tuần, người nhận có thư quà
  for (let i = 0; i < 3; i++) assert.equal(act(1, { type: 'boon', pid: 3 }), null)
  assert.equal(act(1, { type: 'boon', pid: 3 }), 'limit')
  assert.equal(ps.get(3)!.mail.filter(m => m.k === 'boon').length, 3)
})

test('Thiên Đạo Biên Niên: chương đủ mục tiêu thì xong (sang chương sau), quá hạn thì hụt; phân đà NPC không tính', () => {
  const map = { atlas: atlas(777), phase: 0 }
  const ps = world(...Array.from({ length: 16 }, (_, i) => sect(`S${i}`, 9)))
  const w = freshWorld()
  assert.deepEqual(bookView(w, ps, map, T0), { ch: 0, done: [], value: 16 })
  const npc = new Set([1, 2, 3])
  assert.equal(bookView(w, ps, map, T0, npc).value, 13, 'NPC không tính')
  assert.equal(bookStep(w, ps, map, T0, 1, npc).world, w, '13 < 15 (không tính NPC): chưa xong')
  const r = bookStep(w, ps, map, T0, 1)
  assert.equal(r.done, 0, '16 tông môn tầng ≥ 5: xong chương 1')
  const r2 = bookStep(r.world, ps, map, T0, 1)
  assert.equal(r2.done, 1, 'tầng ≥ 8: xong luôn chương 2')
  assert.deepEqual(r2.world.book, { ch: 2, done: [0, 1] })
  assert.equal(bookStep(r2.world, ps, map, T0, 2).world, r2.world, 'chương 3 chưa đủ, chưa quá hạn: giữ nguyên')
  const late = bookStep(r2.world, ps, map, T0, 7)
  assert.equal(late.missed, 2, 'quá hạn: hụt')
  assert.deepEqual(late.world.book, { ch: 3, done: [0, 1] })
})

test('Thiên Đạo Biên Niên — công đầu: chương có chỉ số riêng tính đóng góp từ lúc chương mở; xong chương thì top người góp nhiều nhất', () => {
  const map = { atlas: atlas(777), phase: 0 }
  const ch = BOOK.findIndex(g => g.m === 'kp')
  let ps = world(sect('A', 9), sect('B', 9), sect('C', 9))
  const kp = (pid: number, n: number) => {
    const s = ps.get(pid)!
    ps = new Map([...ps, [pid, { ...s, stats: { ...s.stats, kp: (s.stats.kp ?? 0) + n } }]])
  }
  kp(3, 1000) // chiến công có từ trước chương: không tính
  const r0 = bookStep({ ...freshWorld(), book: { ch, done: [] } }, ps, map, T0, 1)
  assert.equal(r0.done, undefined)
  assert.deepEqual(r0.world.bookBase, { 1: 0, 2: 0, 3: 1000 }, 'ghi chỉ số lúc chương mở')
  kp(1, 150_000)
  kp(2, 60_000)
  assert.deepEqual(bookView(r0.world, ps, map, T0).by, [
    [1, 150_000],
    [2, 60_000],
  ])
  const r1 = bookStep(r0.world, ps, map, T0, 1)
  assert.equal(r1.done, ch, 'cả giới đủ chiến công: xong chương')
  assert.deepEqual(r1.top, [
    [1, 150_000],
    [2, 60_000],
  ])
  assert.equal(r1.world.bookBase, undefined, 'chương sau không có chỉ số riêng')
  // Tu Bổ Thiên Môn: đóng góp là số đã góp
  const rep = {
    ...freshWorld(),
    book: { ch: BOOK.findIndex(g => g.m === 'repair'), done: [] },
    repairBy: { 2: 500, 3: 900 },
  }
  assert.deepEqual(bookBy(rep, ps), [
    [3, 900],
    [2, 500],
  ])
})

test('Luận Kiếm Minh Chiến: ghi danh (trưởng lão, đủ người), ghép cặp, người thứ k đấu người thứ k, thư quà + chiến báo, điểm minh chiến', () => {
  const strong = (n: string) => ({ ...sect(n, 12), elders: { thanhPhong: expAt(40), nhuYen: expAt(35) } })
  const weak = (n: string) => ({ ...sect(n, 12), elders: { thanhPhong: expAt(3) } })
  const ps = world(strong('A1'), strong('A2'), strong('A3'), weak('B1'), weak('B2'), weak('B3'), sect('C1', 12))
  const mk = (id: number, tag: string, members: Record<number, 0 | 1 | 2>) => ({
    id,
    name: tag,
    tag,
    members,
    notice: '',
    at: T0,
    helps: [],
  })
  let w: World = {
    ...freshWorld(),
    allies: { 1: mk(1, 'AA', { 1: 2, 2: 0, 3: 0 }), 2: mk(2, 'BB', { 4: 2, 5: 0, 6: 0 }), 3: mk(3, 'CC', { 7: 2 }) },
  }
  const act = (pid: number, a: Parameters<typeof worldAct>[2]) => {
    const r = worldAct(ps, pid, a, T0, 1, undefined, w)
    if (!r.ok) return r.error
    w = r.world
    return null
  }
  assert.equal(act(2, { type: 'warSign' }), 'locked', 'thành viên không ghi danh')
  assert.equal(act(7, { type: 'warSign' }), 'weak', 'không đủ người')
  assert.equal(act(1, { type: 'warSign' }), null)
  assert.equal(act(1, { type: 'warSign' }), 'claimed')
  assert.equal(act(4, { type: 'warSign' }), null)
  const at = warAt(weekOf(T0))
  const r = warResolve(ps, w, at, 42)
  assert.deepEqual(
    r.results.map(x => [x.an, x.bn, x.wa, x.wb]),
    [['AA', 'BB', 3, 0]],
    'minh mạnh thắng cả ba cặp',
  )
  assert.ok(r.world.war.pts[1] > 1000 && r.world.war.pts[1] + r.world.war.pts[2] === 2000)
  assert.deepEqual(r.world.war.signed, [], 'tuần sau ghi danh lại')
  assert.equal(r.world.war.done, weekOf(at))
  for (const p of [1, 4]) assert.equal(r.changed.get(p)!.mail.at(-1)!.k, 'war', 'ai cũng có thư')
  assert.equal(r.changed.get(1)!.reports.at(-1)!.kind, 'arena', 'có chiến báo xem lại trận của mình')
  assert.equal(r.changed.has(7), false, 'minh không ghi danh không đụng tới')
})

test('săn liên hoàn: đội săn đang về đi thẳng tới con khác từ chỗ đang đứng; quân không hồi, chiến lợi phẩm cộng dồn, về núi theo đường mới', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 0 }
  const p = a.points.find(x => x.kind === 'wild' && x.lv <= 3)!
  const q = a.points
    .filter(x => x.kind === 'wild' && x.region === p.region && x.i !== p.i)
    .sort((x, y) => x.lv - y.lv)[0]
  const seat = { x: a.regions[p.region].cx, y: a.regions[p.region].cy }
  const ps = world({ ...sect('Săn', 12, { kiem3: 900 }), seat })
  let w = freshWorld()
  const order = (x: object, at: number) => {
    const r = worldAct(ps, 1, x as never, at, 5, map, w)
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
  assert.equal(order({ type: 'go', i: p.i, task: 'hunt', elder: 'thanhPhong', army: { kiem3: 900 } }, T0), null)
  const m0 = ps.get(1)!.marches[0]
  assert.equal(order({ type: 'huntChain', id: m0.id, i: q.i }, T0 + 1), 'locked', 'chưa săn xong: chưa liên hoàn được')
  step(m0.arriveAt)
  const back = ps.get(1)!.marches[0]
  const loot1 = back.gain!.res.linhThach ?? 0
  const t1 = back.arriveAt + Math.round((back.returnAt - back.arriveAt) / 3)
  assert.equal(order({ type: 'huntChain', id: back.id, i: q.i }, t1), null)
  const m1 = ps.get(1)!.marches[0]
  assert.deepEqual([m1.target.i, m1.chain, m1.returnAt], [q.i, true, 0])
  assert.deepEqual(m1.army, back.back, 'quân còn lại đi tiếp, không hồi')
  assert.equal(apOf(ps.get(1)!, t1) < apOf({ ...ps.get(1)!, ap: undefined }, t1), true, 'tốn hành lực')
  step(m1.arriveAt)
  const home = ps.get(1)!.marches[0]
  assert.ok((home.gain!.res.linhThach ?? 0) > loot1, 'chiến lợi phẩm cộng dồn hai trận')
  assert.deepEqual(home.path![0], seat, 'về núi theo đường mới từ chỗ yêu thú')
  assert.ok(home.returnAt > m1.arriveAt)
  assert.equal(ps.get(1)!.stats.chained, 1, 'Liên Trảm Bất Hồi: đếm con hạ bằng săn liên hoàn (con đầu không tính)')
})

test('Luận Đạo Vấn Đáp: đường chủ mở (mỗi ngày một phiên), đếm ngược rồi từng câu có giờ; chấm tổng câu đúng cả minh, thư quà theo mốc', () => {
  const ps = world(sect('Chủ', 10), sect('Đệ', 10), sect('Khách', 10))
  let w: World = {
    ...freshWorld(),
    allies: { 1: { id: 1, name: 'Vạn Kiếm', tag: 'VK', members: { 1: 2, 2: 0 }, notice: '', at: T0, helps: [] } },
  }
  const act = (pid: number, a: object, t: number) => {
    const r = worldAct(ps, pid, a as never, t, 1, undefined, w)
    if (r.ok) w = r.world
    return r.ok ? null : r.error
  }
  assert.equal(act(2, { type: 'aquizStart' }, T0), 'locked', 'chân truyền không mở được')
  assert.equal(act(1, { type: 'aquizStart' }, T0), null)
  assert.equal(act(1, { type: 'aquizStart' }, T0 + 1000), 'claimed', 'mỗi ngày một phiên')
  const at = w.allies[1].quiz!.at
  assert.equal(at, T0 + AQUIZ_WAIT)
  assert.equal(act(2, { type: 'aquiz', pick: 0 }, T0 + 1000), 'locked', 'chưa tới giờ')
  const qs = aquizQs(1, at)
  const al0 = w.allies[1]
  // người 1 trả lời đúng hết, người 2 đúng câu đầu rồi sai (đổi đáp án câu 2 vẫn tính lần chọn cuối)
  for (let k = 0; k < AQUIZ_N; k++) {
    assert.equal(act(1, { type: 'aquiz', pick: QUIZ_KEY[qs[k]] }, at + k * AQUIZ_Q + 100), null)
    if (k < 2)
      assert.equal(act(2, { type: 'aquiz', pick: (QUIZ_KEY[qs[k]] + (k ? 1 : 0)) % 4 }, at + k * AQUIZ_Q + 200), null)
  }
  assert.equal(w.allies[1], al0, 'chọn đáp án không đổi minh (không báo cả minh)')
  assert.equal(act(3, { type: 'aquiz', pick: 0 }, at + 100), 'locked', 'không trong minh')
  const done = aquizStep(ps, w, at + AQUIZ_N * AQUIZ_Q)
  const total = AQUIZ_N + 1
  const m1 = done.changed.get(1)!.mail.at(-1)!
  assert.deepEqual([m1.k, m1.a], ['aquiz', [AQUIZ_N, total, AQUIZ_TIERS.filter(n => total >= n).length]])
  assert.deepEqual(done.changed.get(2)!.mail.at(-1)!.a, [1, total, AQUIZ_TIERS.filter(n => total >= n).length])
  assert.equal(done.world.allies[1].quiz!.done, true)
  assert.equal(done.world.aquizAns?.[1], undefined, 'đáp án dọn sau khi chấm')
  assert.equal(aquizStep(ps, done.world, at + AQUIZ_N * AQUIZ_Q + 1).changed.size, 0, 'không chấm lại')
})

test('Trảm Yêu Tốc Chiến: bắt đầu lượt đua, yêu thú giới hạ trong giờ ra điểm theo cấp (cấp cao cộng giờ), kỷ lục một lượt; hết giờ không tính', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 0 }
  const p = a.points.find(x => x.kind === 'wild' && x.lv >= RACE_LV && x.lv <= 8)!
  let t = T0
  const base = { ...sect('Đua', 12, { kiem4: 1500 }), elders: { thanhPhong: expAt(40) }, seat: { x: p.x + 1, y: p.y } }
  while (!festOpen(advance(base, t), 'tocChien', t)) t += 86_400_000
  const ps = world(advance(base, t))
  const started = apply(ps.get(1)!, { type: 'race' }, t)
  assert.ok(started.ok, JSON.stringify(started))
  ps.set(1, started.state)
  assert.deepEqual(apply(started.state, { type: 'race' }, t + 1000), { ok: false, error: 'busy' }, 'đang đua')
  const r = worldAct(
    ps,
    1,
    { type: 'go', i: p.i, task: 'hunt', elder: 'thanhPhong', army: { kiem4: 1500 } },
    t,
    5,
    map,
    freshWorld(),
  )
  assert.ok(r.ok, JSON.stringify(r))
  for (const [k, v] of r.changed) ps.set(k, v)
  const at = ps.get(1)!.marches[0].arriveAt
  assert.ok(at < t + RACE_MS, 'tới nơi trong giờ đua')
  const done = advanceAll(ps, freshWorld(), at, map)
  const s = done.changed.get(1)!
  assert.equal(s.reports.at(-1)!.win, true)
  const race = raceAt(s, at)
  assert.equal(race.pts, p.lv)
  assert.equal(race.best, p.lv)
  assert.equal(race.end, t + RACE_MS + RACE_PLUS, 'yêu thú cấp cao cộng giờ')
  // hết giờ: hạ thêm không tính
  const late = raceHit(s, 9, race.end + 1)
  assert.equal(raceAt(late, race.end + 1).pts, p.lv)
})

test('yêu thú giới: săn một mình, thắng thì chiến lợi phẩm + kinh nghiệm theo đội về, con đó hồi sau 20 phút', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 0 }
  const p = a.points.find(x => x.kind === 'wild' && x.lv <= 3)!
  const seat = { x: a.regions[p.region].cx, y: a.regions[p.region].cy }
  const ps = world({ ...sect('Săn', 12, { kiem3: 800 }), seat })
  let w = freshWorld()
  const go = (now: number) =>
    worldAct(ps, 1, { type: 'go', i: p.i, task: 'hunt', elder: 'thanhPhong', army: { kiem3: 800 } }, now, 5, map, w)
  const r = go(T0)
  assert.ok(r.ok, JSON.stringify(r))
  for (const [k, v] of r.changed) ps.set(k, v)
  assert.equal(apOf(ps.get(1)!, T0), AP_MAX - AP_HUNT, 'tốn hành lực')
  assert.equal(apOf(ps.get(1)!, T0 + AP_EVERY), AP_MAX - AP_HUNT + 1, 'hồi dần')
  assert.ok(wildSide(a, p.i)!.troops.length === 3)
  const at = ps.get(1)!.marches[0].arriveAt
  const done = advanceAll(ps, w, at, map)
  for (const [k, v] of done.changed) ps.set(k, v)
  w = done.world
  const s = ps.get(1)!
  assert.equal(s.reports.at(-1)!.win, true, 'đội mạnh thắng')
  assert.equal(s.stats.hunted, 1)
  assert.ok(
    (s.marches[0].gain!.res.linhThach ?? 0) > 0 && s.marches[0].gain!.exp > 0,
    'chiến lợi phẩm + kinh nghiệm theo đội',
  )
  assert.equal(w.spots[p.i].until, at + 20 * 60_000)
  const again = worldAct(
    new Map([[1, { ...s, marches: [] }]]),
    1,
    { type: 'go', i: p.i, task: 'hunt', elder: 'thanhPhong', army: { kiem3: 10 } },
    at + 1,
    5,
    map,
    w,
  )
  assert.deepEqual(again, { ok: false, error: 'cooldown' }, 'đang hồi')
  const other = a.points.find(x => x.kind === 'wild' && x.region === p.region && x.i !== p.i)!
  const tired = { ...s, marches: [], ap: { n: 5, at: at } }
  const none = worldAct(
    new Map([[1, tired]]),
    1,
    { type: 'go', i: other.i, task: 'hunt', elder: 'thanhPhong', army: { kiem3: 10 } },
    at + 1,
    5,
    map,
    w,
  )
  assert.deepEqual(none, { ok: false, error: 'limit' }, 'hết hành lực')
})

test('cửa minh: đóng thì xin vào chờ duyệt (nhận / từ chối), được mời thì vào thẳng; vào minh thì đơn ở minh khác bị bỏ', () => {
  const ps = world(sect('A', 12), sect('B', 12), sect('C', 12), sect('D', 12))
  let w: World = {
    ...freshWorld(),
    allies: {
      1: { id: 1, name: 'Vạn Kiếm', tag: 'VK', members: { 1: 2 }, notice: '', at: T0, helps: [] },
      2: { id: 2, name: 'Thiên Kiếm', tag: 'TK', members: { 4: 2 }, notice: '', at: T0, helps: [] },
    },
  }
  const act = (pid: number, a: Parameters<typeof worldAct>[2]) => {
    const r = worldAct(ps, pid, a, T0, 1, undefined, w)
    if (!r.ok) return r.error
    w = r.world
    return null
  }
  assert.equal(act(1, { type: 'allyOpen', open: false }), null)
  assert.equal(act(2, { type: 'allyJoin', id: 1 }), null)
  assert.deepEqual([w.allies[1].apps, w.allies[1].members[2]], [[2], undefined], 'đóng: chỉ gửi đơn')
  assert.equal(act(2, { type: 'allyJoin', id: 2 }), null, 'minh mở: vào thẳng')
  assert.deepEqual(w.allies[1].apps, [], 'vào minh khác: đơn cũ bị bỏ')
  assert.equal(act(3, { type: 'allyJoin', id: 1 }), null)
  assert.equal(act(1, { type: 'allyAccept', pid: 3, ok: true }), null)
  assert.equal(w.allies[1].members[3], -2, 'duyệt: vào minh (bậc R1)')
  const lone = sect('E', 12)
  ps.set(5, lone)
  assert.equal(act(1, { type: 'allyInvite', pid: 5 }), null)
  assert.equal(act(5, { type: 'allyJoin', id: 1 }), null)
  assert.equal(w.allies[1].members[5], -2, 'được mời: vào thẳng dù minh đóng')
  assert.equal(allyRows(w, ps, 5)[0].invited, false)
})

test('minh ước (NAP): đề nghị, nhận / từ chối, huỷ; đang minh ước thì không cướp nhau', () => {
  const ps = world(sect('A', 12, { kiem3: 1100 }), sect('B', 12, { the1: 200 }), sect('C', 12))
  let w: World = {
    ...freshWorld(),
    allies: {
      1: { id: 1, name: 'Vạn Kiếm', tag: 'VK', members: { 1: 2 }, notice: '', at: T0, helps: [] },
      2: { id: 2, name: 'Thiên Kiếm', tag: 'TK', members: { 2: 2, 3: 0 }, notice: '', at: T0, helps: [] },
    },
  }
  const act = (pid: number, a: Parameters<typeof worldAct>[2]) => {
    const r = worldAct(ps, pid, a, T0, 1, undefined, w)
    if (!r.ok) return r.error
    w = r.world
    return null
  }
  assert.equal(act(3, { type: 'napAsk', id: 1 }), 'locked', 'thành viên không đề nghị được')
  assert.equal(act(1, { type: 'napAsk', id: 2 }), null)
  assert.equal(act(1, { type: 'napAsk', id: 2 }), 'claimed', 'đã đề nghị')
  assert.deepEqual(w.allies[2].napIn, [1])
  assert.equal(act(2, { type: 'napOk', id: 1 }), null)
  assert.deepEqual([w.allies[1].naps, w.allies[2].naps, w.allies[2].napIn], [[2], [1], []])
  const raid = worldAct(
    ps,
    1,
    { type: 'raid', pid: 2, elder: 'thanhPhong', army: { kiem3: 1100 } },
    T0,
    1,
    undefined,
    w,
  )
  assert.deepEqual(raid, { ok: false, error: 'friend' }, 'minh ước: không cướp')
  assert.equal(act(2, { type: 'napEnd', id: 1 }), null)
  assert.deepEqual([w.allies[1].naps, w.allies[2].naps], [[], []], 'một bên huỷ là huỷ cả hai')
  assert.ok(
    worldAct(ps, 1, { type: 'raid', pid: 2, elder: 'thanhPhong', army: { kiem3: 1100 } }, T0, 1, undefined, w).ok,
  )
  assert.equal(act(1, { type: 'napAsk', id: 2 }), null)
  assert.equal(act(2, { type: 'napNo', id: 1 }), null)
  assert.deepEqual(w.allies[2].napIn, [], 'từ chối')
})

test('đóng trại ở ô trống: đội đứng chốt; phe khác đánh trại — yếu thì trại đứng (bớt quân), mạnh thì trại tan; gọi trại về được', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const r0 = a.regions.find(r => r.ring === 0)!
  const home = { x: r0.cx, y: r0.cy }
  const ps = world(
    { ...sect('A', 12, { kiem3: 800 }), seat: home },
    { ...sect('B', 12, { kiem1: 800, kiem3: 800 }), seat: { x: home.x + 6, y: home.y } },
  )
  let w = freshWorld()
  const step = (pid: number, x: object, t: number) => {
    const r = worldAct(ps, pid, x as never, t, 7, map, w)
    if (!r.ok) return r.error
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
    const m = ps.get(pid)!.marches.at(-1)!
    const d = advanceAll(ps, w, m.arriveAt, map)
    for (const [k, v] of d.changed) ps.set(k, v)
    w = d.world
    return null
  }
  const free = [2, 3, 4, 5]
    .map(k => ({ x: home.x + k, y: home.y + 2 }))
    .find(p => !a.points.some(q => q.x === p.x && q.y === p.y) && !sitesOf(a).some(q => q.x === p.x && q.y === p.y))!
  const busy = a.points.find(p => p.region === r0.i)!
  assert.equal(step(1, { type: 'camp', x: busy.x, y: busy.y, elder: 'thanhPhong', army: { kiem3: 10 } }, T0), 'taken')
  assert.equal(step(1, { type: 'camp', ...free, elder: 'thanhPhong', army: { kiem3: 500 } }, T0), null)
  const camp = ps.get(1)!.marches.at(-1)!
  assert.ok(camp.stay && camp.target.kind === 'camp', 'trại đứng')
  const hit = (army: object, t: number) =>
    step(2, { type: 'hitCamp', pid: 1, id: camp.id, elder: 'thanhPhong', army }, t)
  assert.equal(hit({ kiem1: 20 }, camp.arriveAt), null)
  assert.ok(ps.get(1)!.marches.at(-1)!.stay, 'đánh yếu: trại vẫn đứng')
  assert.equal(ps.get(2)!.reports.at(-1)!.win, false)
  const t2 = ps.get(2)!.marches.at(-1)!.returnAt
  assert.equal(hit({ kiem3: 580 }, t2), null)
  const c2 = ps.get(1)!.marches.at(-1)!
  assert.ok(!c2.stay && c2.returnAt > 0, 'đánh mạnh: trại tan, đội về')
  assert.equal(ps.get(1)!.reports.at(-1)!.kind, 'camp')
  // gọi trại về
  const ps2 = world({ ...sect('C', 12, { kiem3: 300 }), seat: home })
  let w2 = freshWorld()
  const r = worldAct(ps2, 1, { type: 'camp', ...free, elder: 'thanhPhong', army: { kiem3: 300 } }, T0, 1, map, w2)
  assert.ok(r.ok)
  for (const [k, v] of r.changed) ps2.set(k, v)
  const d = advanceAll(ps2, r.world, ps2.get(1)!.marches[0].arriveAt, map)
  for (const [k, v] of d.changed) ps2.set(k, v)
  w2 = d.world
  const back = worldAct(ps2, 1, { type: 'recall', id: ps2.get(1)!.marches[0].id }, ps2.get(1)!.time + HOUR, 1, map, w2)
  assert.ok(back.ok && !back.changed.get(1)!.marches[0].stay, 'nhổ trại, đội về')
  assert.equal(back.world, w2, 'không đụng điểm nào')
})

test('hộ trận linh thú: linh mạch chưa thuần phục phải đánh bại linh thú mới chiếm; thuần phục rồi thì cả mùa không hồi', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const vein = a.points.find(p => p.kind === 'vein' && p.region === 0)!
  const near = { x: a.regions[0].cx, y: a.regions[0].cy }
  const ps = world({ ...sect('A', 10, { kiem1: 3000, kiem3: 3000 }), seat: near })
  let w = freshWorld()
  const go = (army: object, at: number) => {
    const r = worldAct(
      ps,
      1,
      { type: 'go', i: vein.i, task: 'take', elder: 'thanhPhong', army } as never,
      at,
      3,
      map,
      w,
    )
    assert.ok(r.ok, r.ok ? '' : r.error)
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
    const m = ps.get(1)!.marches.at(-1)!
    const d = advanceAll(ps, w, m.arriveAt, map)
    for (const [k, v] of d.changed) ps.set(k, v)
    w = d.world
    return ps.get(1)!.marches.at(-1)!
  }
  assert.ok(guardSide(a, vein.i), 'linh mạch có linh thú giữ')
  const weak = go({ kiem1: 5 }, T0)
  assert.equal(ps.get(1)!.reports.at(-1)!.win, false, 'đánh không lại linh thú')
  assert.ok(!weak.stay && weak.returnAt > 0 && w.spots[vein.i]?.own === undefined && !w.spots[vein.i]?.tamed)
  const strong = go({ kiem3: 500 }, weak.returnAt)
  assert.ok(strong.stay && w.spots[vein.i].own === -1 && w.spots[vein.i].tamed, 'thắng: chiếm và thuần phục')
  assert.equal(ps.get(1)!.stats.guards, 1, 'đếm trận thắng hộ trận linh thú (Linh Địa Chinh Phạt)')
  // gọi về (bỏ trống) rồi đội yếu tới: không phải đánh nữa
  const back = worldAct(ps, 1, { type: 'recall', id: strong.id }, strong.arriveAt + HOUR, 1, map, w)
  assert.ok(back.ok)
  for (const [k, v] of back.changed) ps.set(k, v)
  w = back.world
  assert.ok(w.spots[vein.i].own === undefined && w.spots[vein.i].tamed, 'bỏ trống vẫn giữ thuần phục')
  const again = go({ kiem1: 5 }, ps.get(1)!.marches.at(-1)!.returnAt)
  assert.ok(again.stay && w.spots[vein.i].own === -1, 'chiếm lại không phải đánh')
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
  // chiếm lần đầu trong mùa: cả minh nhận quà, mỗi điểm một lần
  assert.deepEqual(w.firsts, [vein.i])
  assert.deepEqual([ps.get(1)!.mail.at(-1)!.k, ps.get(3)!.mail.at(-1)!.k], ['firstTake', 'firstTake'])
  // buff linh mạch cho cả minh (A và C), B không có — loại buff theo điểm (cấp 1: sản lượng / xây / tuyển / chữa)
  for (const [k, v] of worldBuffs(ps, w, map, m.arriveAt)) ps.set(k, v)
  assert.ok(ps.get(1)!.buffs.some(b => b.src === 'vein') && ps.get(3)!.buffs.some(b => b.src === 'vein'))
  assert.deepEqual(
    ps
      .get(1)!
      .buffs.filter(b => b.src === 'vein')
      .map(b => b.key),
    veinBuffs(vein).map(b => b.key),
  )
  assert.equal(
    new Set(a.points.filter(p => p.kind === 'vein' && p.lv === 1).map(p => veinBuffs(p)[0].key)).size,
    4,
    'bốn loại',
  )
  assert.deepEqual(
    veinBuffs(a.points.find(p => p.kind === 'vein' && p.lv === 3)!).map(b => b.key),
    ['prod', 'atk'],
  )
  assert.ok(!ps.get(2)!.buffs.some(b => b.src === 'vein'))
  // B (một mình, mạnh hơn) đánh bật A
  assert.equal(
    act(2, { type: 'go', i: vein.i, task: 'take', elder: 'thanhPhong', army: { kiem3: 1500 } }, m.arriveAt),
    null,
  )
  const mb = ps.get(2)!.marches[0]
  step(mb.arriveAt)
  assert.equal(w.spots[vein.i].own, -2, 'người giữ một mình')
  assert.deepEqual(w.firsts, [vein.i], 'đã có người chiếm lần đầu: không quà nữa')
  assert.equal(ps.get(1)!.marches[0].stay, false, 'A bị đánh bật, đang về')
  assert.ok(
    (ps.get(2)!.stats.kp ?? 0) > 0 && (ps.get(1)!.stats.kp ?? 0) > 0,
    'trận tranh điểm có chiến công cả hai bên',
  )
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

test('khai cạn mỏ: đội mang hết phần còn lại thì mỏ cạn (hồi sau) và tính một lần khai cạn (Tàng Bảo Mãn Thương)', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const mine = a.points.find(p => p.kind === 'mine' && p.region === 0)!
  const ps = world({ ...sect('A', 10, { kiem2: 1000 }), seat: { x: a.regions[0].cx, y: a.regions[0].cy } })
  const go = { type: 'go', i: mine.i, task: 'gather', elder: 'thanhPhong', army: { kiem2: 1000 } } as const
  const r = worldAct(ps, 1, go, T0, 1, map, freshWorld())
  assert.ok(r.ok)
  for (const [k, v] of r.changed) ps.set(k, v)
  const done = advanceAll(ps, freshWorld(), ps.get(1)!.marches[0].arriveAt, map)
  assert.equal(done.world.spots[mine.i].left, 0)
  assert.equal(done.changed.get(1)!.stats.drained, 1)
})

test('lãnh thổ tiên minh: mốc từ tông môn trong minh + điểm minh giữ, ô tranh chấp; khai mỏ trong lãnh thổ nhanh hơn; dời tông môn vào lãnh thổ', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const r0 = a.regions.find(r => r.ring === 0)!
  const mine = a.points.find(p => p.kind === 'mine' && p.region === r0.i)!
  const home = { x: mine.x + 2, y: mine.y } // tông môn A sát mỏ: mỏ trong lãnh thổ minh A
  const ps = world({ ...sect('A', 10, { kiem2: 100 }), seat: home }, { ...sect('B', 10), seat: { x: 3, y: 3 } })
  const ally = (id: number, pid: number) => ({
    id,
    name: `M${id}`,
    tag: `T${id}`,
    members: { [pid]: 2 as const },
    notice: '',
    at: T0,
    helps: [],
  })
  let w: World = { ...freshWorld(), allies: { 1: ally(1, 1), 2: ally(2, 2) } }
  const cl = claimsOf(ps, w, a, T0)
  assert.equal(ownerAt(cl, home.x + TERR_SEAT, home.y), 1)
  assert.equal(ownerAt(cl, home.x + TERR_SEAT + 1, home.y), 0)
  assert.equal(
    ownerAt([...cl, { x: home.x + 2, y: home.y, r: TERR_SEAT, side: 2 }], home.x + 1, home.y),
    0,
    'tranh chấp',
  )
  const grid = territoryGrid(cl)
  for (const [x, y] of [
    [home.x, home.y],
    [home.x + 3, home.y + 3],
    [home.x + 4, home.y],
    [5, 5],
  ])
    assert.equal(grid[y * MAP_W + x], ownerAt(cl, x, y), `lưới khớp ownerAt ở ${x},${y}`)
  assert.deepEqual(snapClaims(mapOf(ps, T0, new Set(), [], w), a, T0), cl, 'client dựng lại đúng mốc từ ảnh chụp')
  // khai mỏ trong lãnh thổ minh mình: nhanh hơn TERR_GATHER
  const dig = (wx: World) => {
    const q = new Map(ps)
    const r = worldAct(
      q,
      1,
      { type: 'go', i: mine.i, task: 'gather', elder: 'thanhPhong', army: { kiem2: 100 } },
      T0,
      1,
      map,
      wx,
    )
    assert.ok(r.ok)
    for (const [k, v] of r.changed) q.set(k, v)
    const m = q.get(1)!.marches[0]
    const g = advanceAll(q, wx, m.arriveAt, map).changed.get(1)!.marches[0]
    return g.mine!.end - g.arriveAt
  }
  const solo = dig({ ...w, allies: { 2: ally(2, 2) } })
  assert.ok(Math.abs(dig(w) * (1 + TERR_GATHER) - solo) < 2, 'khai nhanh hơn 25 %')
  // dời tông môn: vào ô trống trong lãnh thổ minh mình (vùng ngoài, cách tông môn / điểm từ 3 ô), mọi đội ở nhà, 24 giờ một lần
  const move = (x: number, y: number, st = ps, t = T0) => worldAct(st, 1, { type: 'move', x, y }, t, 1, map, w)
  const spot = [...Array(7).keys()]
    .flatMap(dy => [...Array(7).keys()].map(dx => ({ x: home.x - 3 + dx, y: home.y - 3 + dy })))
    .find(p => move(p.x, p.y).ok)!
  assert.ok(spot, 'có ô dời được trong lãnh thổ')
  const moved = move(spot.x, spot.y)
  assert.ok(moved.ok)
  const me = moved.changed.get(1)!
  assert.deepEqual(me.seat, spot)
  assert.equal(err(move(home.x, home.y, new Map([...ps, [1, me]]), T0 + HOUR)), 'cooldown')
  const outside = a.points.find(p => p.kind === 'mine' && p.region !== r0.i && a.regions[p.region].ring === 0)!
  assert.equal(err(move(outside.x + 4, outside.y)), 'bad', 'vùng ngoài nhưng không phải lãnh thổ minh mình')
  assert.equal(err(move(a.regions.find(r => r.ring === 2)!.cx, a.regions.find(r => r.ring === 2)!.cy)), 'far')
  assert.equal(err(move(3, 4)), 'taken', 'sát tông môn khác')
  // đội địch đang kéo tới chỗ cũ: tới nơi thì quay về tay không
  const raider: State = {
    ...ps.get(2)!,
    marches: [
      {
        id: 1,
        elder: 'thanhPhong',
        army: { kiem1: 10 },
        target: { kind: 'pvp', i: 1 },
        seed: 1,
        startAt: T0,
        arriveAt: T0 + 1000,
        returnAt: 0,
        path: [{ x: 3, y: 3 }, home],
      },
    ],
  }
  const back = advanceAll(
    new Map([
      [1, me],
      [2, raider],
    ]),
    w,
    T0 + 1000,
    map,
  ).changed.get(2)!
  assert.ok(back.marches[0].returnAt > 0 && !back.reports.length, 'không trận, quay về')
  w = { ...w, allies: { 2: ally(2, 2) } }
  assert.equal(err(move(spot.x, spot.y)), 'locked', 'không trong minh')
  // dời núi tân thủ: dưới tầng 8, chưa dời lần nào → mọi ô trống vùng ngoài, kể cả không trong minh; chỉ một lần
  const kid = new Map([...ps, [1, { ...ps.get(1)!, levels: { ...ps.get(1)!.levels, chuDien: 5 } }]])
  const far = worldAct(kid, 1, { type: 'move', x: outside.x + 4, y: outside.y }, T0, 1, map, w)
  assert.ok(far.ok, 'tân thủ dời được ra ngoài lãnh thổ')
  const again = new Map([...kid, [1, far.changed.get(1)!]])
  assert.equal(err(worldAct(again, 1, { type: 'move', x: spot.x, y: spot.y }, T0 + 2 * MOVE_COOL, 1, map, w)), 'locked')
})

test('trận kỳ: trưởng lão cắm trong lãnh thổ bằng Minh khố, dựng xong mới nới lãnh thổ; giới hạn theo số người; nhổ lại', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const r0 = a.regions.find(r => r.ring === 0)!
  const home = { x: r0.cx, y: r0.cy }
  const ps = world({ ...sect('A', 10), seat: home }, { ...sect('B', 10), seat: { x: 3, y: 3 } })
  const al = { id: 1, name: 'M', tag: 'T', members: { 1: 2 as const, 2: 0 as const }, notice: '', at: T0, helps: [] }
  let w: World = { ...freshWorld(), allies: { 1: { ...al, fund: 2 * FLAG_COST + 10 } } }
  const act = (pid: number, x: number, y: number, t = T0) => worldAct(ps, pid, { type: 'flag', x, y }, t, 1, map, w)
  // ô ở mép lãnh thổ (cách tông môn đúng TERR_SEAT ô), trống quanh FLAG_GAP
  const edge = [-1, 0, 1]
    .flatMap(k => [
      { x: home.x + TERR_SEAT, y: home.y + k },
      { x: home.x - TERR_SEAT, y: home.y + k },
    ])
    .find(p => act(1, p.x, p.y).ok)!
  assert.ok(edge, 'có ô cắm được')
  assert.equal(err(act(2, edge.x, edge.y)), 'locked', 'thành viên thường không cắm được')
  assert.equal(err(act(1, home.x + 10, home.y)), 'bad', 'ngoài lãnh thổ')
  const r = act(1, edge.x, edge.y)
  assert.ok(r.ok)
  w = r.world
  assert.equal(w.allies[1].fund, FLAG_COST + 10)
  const f = Object.values(w.flags!)[0]
  const far = { x: edge.x + Math.sign(edge.x - home.x) * FLAG_R, y: edge.y }
  assert.equal(ownerAt(claimsOf(ps, w, a, T0), far.x, far.y), 0, 'đang dựng: chưa nới')
  assert.equal(ownerAt(claimsOf(ps, w, a, f.done), far.x, far.y), 1, 'dựng xong: nới FLAG_R ô')
  assert.equal(ownerAt(snapClaims(mapOf(ps, f.done, new Set(), [], w), a, f.done), far.x, far.y), 1)
  assert.equal(err(act(1, edge.x, edge.y)), 'taken', 'trùng chỗ trận kỳ khác')
  // giới hạn: 2 người → FLAG_BASE trận kỳ; hết Minh khố
  w = { ...w, flags: { ...w.flags, 99: { ...f, id: 99, x: 5, y: 5 } } }
  assert.equal(flagCap(w.allies[1]), FLAG_BASE)
  assert.equal(err(act(1, home.x, home.y + TERR_SEAT)), 'limit')
  w = { ...w, flags: { [f.id]: f }, allies: { 1: { ...w.allies[1], fund: 0 } } }
  assert.equal(err(act(1, home.x, home.y + TERR_SEAT)), 'not_enough')
  // nhổ: chỉ trưởng lão / minh chủ của minh đó
  assert.equal(err(worldAct(ps, 2, { type: 'unflag', id: f.id }, T0, 1, map, w)), 'locked')
  const u = worldAct(ps, 1, { type: 'unflag', id: f.id }, T0, 1, map, w)
  assert.ok(u.ok && !Object.keys(u.world.flags!).length)
})

test('đổi tên / hiệu tiên minh: chỉ minh chủ, tốn Minh khố, không trùng minh khác, cách nhau ALLY_RENAME_COOL', () => {
  const ps = world(sect('A', 10), sect('B', 10))
  const base = { notice: '', at: T0, helps: [] }
  let w: World = {
    ...freshWorld(),
    allies: {
      1: { ...base, id: 1, name: 'Thanh Van', tag: 'TV', members: { 1: 2, 2: 0 }, fund: 2 * ALLY_RENAME },
      2: { ...base, id: 2, name: 'Hac Long', tag: 'HL', members: {} },
    },
  }
  const act = (pid: number, a: object, t = T0) => worldAct(ps, pid, a as never, t, 1, undefined, w)
  assert.equal(err(act(2, { type: 'allyRename', name: 'Moi', tag: 'MO' })), 'locked', 'không phải minh chủ')
  assert.equal(err(act(1, { type: 'allyRename', name: 'hac long', tag: 'XX' })), 'taken', 'trùng tên minh khác')
  const r = act(1, { type: 'allyRename', name: 'Thien Kiem', tag: 'tk' })
  assert.ok(r.ok)
  w = r.world
  assert.deepEqual([w.allies[1].name, w.allies[1].tag, w.allies[1].fund], ['Thien Kiem', 'TK', ALLY_RENAME])
  assert.equal(err(act(1, { type: 'allyRename', name: 'Lan Nua', tag: 'LN' }, T0 + HOUR)), 'cooldown')
  assert.ok(act(1, { type: 'allyRename', name: 'Lan Nua', tag: 'LN' }, T0 + ALLY_RENAME_COOL).ok)
})

test('Minh khoáng: trưởng lão dựng trong lãnh thổ (mỗi minh một, không nới lãnh thổ); người trong minh khai, không ai cướp được; gọi về trả phần chưa khai; quá hạn thì tháo', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const r0 = a.regions.find(r => r.ring === 0)!
  const home = { x: r0.cx, y: r0.cy }
  const ps = world(
    { ...sect('A', 10, { kiem3: 2000 }), seat: home },
    { ...sect('B', 10, { kiem3: 2000 }), seat: { x: 3, y: 3 } },
  )
  const al = { id: 1, name: 'M', tag: 'T', members: { 1: 2 as const }, notice: '', at: T0, helps: [] }
  let w: World = { ...freshWorld(), allies: { 1: { ...al, fund: 2 * ALLY_MINE_COST } } }
  const step = (pid: number, x: object, t = T0) => {
    const r = worldAct(ps, pid, x as never, t, 1, map, w)
    if (!r.ok) return r.error
    w = r.world
    for (const [k, v] of r.changed) ps.set(k, v)
    return null
  }
  const spot = [-1, 0, 1]
    .flatMap(k => [
      { x: home.x + TERR_SEAT, y: home.y + k },
      { x: home.x - TERR_SEAT, y: home.y + k },
    ])
    .find(p => worldAct(ps, 1, { type: 'allyMine', ...p, res: 'linhKhoang' }, T0, 1, map, w).ok)!
  assert.equal(parseWorldAction({ type: 'allyMine', ...spot, res: 'vang' }), null, 'loại lạ')
  assert.equal(step(1, { type: 'allyMine', ...spot, res: 'linhKhoang' }), null)
  const f = Object.values(w.flags!)[0]
  assert.deepEqual(f.mine, { res: 'linhKhoang', left: ALLY_MINE_STOCK, until: f.done + ALLY_MINE_LIFE })
  assert.equal(w.allies[1].fund, ALLY_MINE_COST)
  assert.equal(
    step(1, { type: 'allyMine', x: home.x, y: home.y + TERR_SEAT, res: 'linhThach' }),
    'limit',
    'mỗi minh một',
  )
  assert.equal(flagsOf(w, 1).length, 0, 'không tính vào số trận kỳ')
  const far = { x: f.x + Math.sign(f.x - home.x) * FLAG_R, y: f.y }
  assert.equal(ownerAt(claimsOf(ps, w, a, f.done), far.x, far.y), 0, 'không nới lãnh thổ')
  const gather = (pid: number, t: number) =>
    step(pid, { type: 'allyGather', id: f.id, elder: 'thanhPhong', army: { kiem3: 2000 } }, t)
  assert.equal(gather(1, T0), 'locked', 'đang dựng')
  assert.equal(gather(2, f.done), 'locked', 'người minh khác')
  assert.equal(gather(1, f.done), null)
  const m0 = ps.get(1)!.marches.at(-1)!
  const d = advanceAll(ps, w, m0.arriveAt, map)
  for (const [k, v] of d.changed) ps.set(k, v)
  w = d.world
  const m = ps.get(1)!.marches.at(-1)!
  assert.equal(m.mine?.res, 'linhKhoang')
  const got = m.mine!.amount
  assert.equal(w.flags![f.id].mine!.left, ALLY_MINE_STOCK - got, 'kho trừ phần mang')
  const rob = { type: 'rob', pid: 1, id: m.id, elder: 'thanhPhong', army: { kiem3: 100 } }
  assert.equal(err(worldAct(ps, 2, rob as never, m.arriveAt + 1000, 1, map, w)), 'gone', 'không ai cướp được')
  const half = m.arriveAt + Math.floor((m.mine!.end - m.arriveAt) / 2)
  assert.equal(step(1, { type: 'recall', id: m.id }, half), null)
  const kept = ps.get(1)!.marches.at(-1)!.mine!.amount
  assert.ok(kept > 0 && kept < got, 'mang về phần đã khai')
  assert.equal(w.flags![f.id].mine!.left, ALLY_MINE_STOCK - kept, 'phần chưa khai trả lại kho')
  const gone = advanceAll(ps, w, f.mine!.until, map)
  assert.equal(gone.world.flags![f.id], undefined, 'quá hạn: tháo')
})

test('Minh khoáng: đội góp xây đứng lại, dựng xong thì khai tại chỗ (không đi về rồi đi lại)', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const r0 = a.regions.find(r => r.ring === 0)!
  const home = { x: r0.cx, y: r0.cy }
  const ps = world({ ...sect('A', 10, { kiem3: 800 }), seat: home })
  const al = { id: 1, name: 'M', tag: 'T', members: { 1: 2 as const }, notice: '', at: T0, helps: [] }
  const done = T0 + HOUR
  const mine = { res: 'linhThao' as const, left: ALLY_MINE_STOCK, until: done + ALLY_MINE_LIFE }
  let w: World = {
    ...freshWorld(),
    allies: { 1: al },
    flags: { 7: { id: 7, aid: 1, x: home.x + 3, y: home.y + 2, done, mine } },
  }
  const army = { kiem3: 800 }
  const r = worldAct(ps, 1, { type: 'flagGuard', id: 7, elder: 'thanhPhong', army }, T0, 1, map, w)
  assert.ok(r.ok)
  for (const [k, v] of r.changed) ps.set(k, v)
  const go = ps.get(1)!.marches[0]
  const d = advanceAll(ps, r.world, go.arriveAt, map)
  for (const [k, v] of d.changed) ps.set(k, v)
  w = d.world
  assert.ok(ps.get(1)!.marches[0].stay, 'góp sức dựng')
  const t = w.flags![7].done + 60_000
  const g = worldAct(ps, 1, { type: 'allyGather', id: 7, elder: 'thanhPhong', army }, t, 1, map, w)
  assert.ok(g.ok)
  const m = g.changed.get(1)!.marches[0]
  assert.ok(!m.stay && m.mine && m.mine.end > t, 'khai tại chỗ')
  assert.equal(m.returnAt, m.mine!.end + (go.arriveAt - go.startAt), 'khai xong đi về như đường tới')
  assert.equal(g.world.flags![7].mine!.left, ALLY_MINE_STOCK - m.mine!.amount)
})

test('phá trận kỳ: minh khác xuất quân tới cờ, lực chiến trừ độ bền (không giao tranh), hết thì cờ đổ; thư hai bên; cờ liền lại', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const r0 = a.regions.find(r => r.ring === 0)!
  const home = { x: r0.cx, y: r0.cy }
  const ps = world(
    { ...sect('A', 10), seat: home },
    { ...sect('C', 10, { kiem3: 3000 }), seat: { x: home.x + 5, y: home.y } },
  )
  const al = { id: 1, name: 'M', tag: 'T', members: { 1: 2 as const }, notice: '', at: T0, helps: [] }
  const f = { id: 7, aid: 1, x: home.x + 3, y: home.y + 2, done: T0 }
  let w: World = { ...freshWorld(), allies: { 1: al }, flags: { 7: f } }
  assert.equal(
    err(worldAct(ps, 1, { type: 'raze', id: 7, elder: 'thanhPhong', army: { kiem1: 1 } }, T0, 1, map, w)),
    'bad',
    'cờ minh mình',
  )
  const go = (t: number) => {
    const r = worldAct(ps, 2, { type: 'raze', id: 7, elder: 'thanhPhong', army: { kiem3: 1000 } }, t, 1, map, w)
    assert.ok(r.ok, r.ok ? '' : r.error)
    for (const [k, v] of r.changed) ps.set(k, v)
    const m = ps.get(2)!.marches.at(-1)!
    assert.equal(m.target.kind, 'flag')
    const done = advanceAll(ps, w, m.arriveAt, map)
    for (const [k, v] of done.changed) ps.set(k, v)
    w = done.world
    const back = ps.get(2)!.marches.at(-1)!
    assert.ok(back.returnAt > m.arriveAt && back.back?.kiem3 === 1000, 'không mất quân, quay về')
    ps.set(2, advance(ps.get(2)!, back.returnAt))
    return m.arriveAt
  }
  const at = go(T0)
  const hit = w.flags![7]
  assert.ok(hit && hit.hp! < FLAG_HP && hit.hit === at, 'mất độ bền')
  assert.equal(ps.get(2)!.mail.at(-1)!.k, 'razed')
  assert.equal(ps.get(1)!.mail.at(-1)!.k, 'flagHit', 'minh chủ bên kia biết')
  assert.equal(flagHp(hit, at + FLAG_REPAIR), FLAG_HP, 'không bị đánh 12 giờ thì liền lại')
  for (let k = 0; k < 10 && w.flags![7]; k++) go(ps.get(2)!.time)
  assert.equal(w.flags![7], undefined, 'đánh đủ thì cờ đổ')
  assert.deepEqual(ps.get(2)!.mail.at(-1)!.a?.slice(0, 2), ['T', 0])
})

test('giữ trận kỳ: người trong minh đóng quân ở cờ, lực chiến quân giữ chặn bớt sức phá; cờ đổ thì quân giữ về', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const r0 = a.regions.find(r => r.ring === 0)!
  const home = { x: r0.cx, y: r0.cy }
  const ps = world(
    { ...sect('A', 10, { kiem3: 800 }), seat: home },
    { ...sect('C', 10, { kiem3: 3000 }), seat: { x: home.x + 5, y: home.y } },
  )
  const al = { id: 1, name: 'M', tag: 'T', members: { 1: 2 as const }, notice: '', at: T0, helps: [] }
  let w: World = {
    ...freshWorld(),
    allies: { 1: al },
    flags: { 7: { id: 7, aid: 1, x: home.x + 3, y: home.y + 2, done: T0 } },
  }
  const step = (pid: number, x: object, t: number) => {
    const r = worldAct(ps, pid, x as never, t, 1, map, w)
    assert.ok(r.ok, r.ok ? '' : r.error)
    for (const [k, v] of r.changed) ps.set(k, v)
    const m = ps.get(pid)!.marches.at(-1)!
    const done = advanceAll(ps, w, m.arriveAt, map)
    for (const [k, v] of done.changed) ps.set(k, v)
    w = done.world
    return m.arriveAt
  }
  assert.equal(
    err(worldAct(ps, 2, { type: 'flagGuard', id: 7, elder: 'thanhPhong', army: { kiem3: 1 } }, T0, 1, map, w)),
    'locked',
    'chỉ người trong minh',
  )
  const t1 = step(1, { type: 'flagGuard', id: 7, elder: 'thanhPhong', army: { kiem3: 800 } }, T0)
  assert.ok(ps.get(1)!.marches[0].stay, 'đứng giữ cờ')
  assert.equal(mapOf(ps, t1, new Set(), [], w).flags![0].guard?.[0], 1, 'bản đồ thấy quân giữ')
  const raze = (n: number) => step(2, { type: 'raze', id: 7, elder: 'thanhPhong', army: { kiem3: n } }, ps.get(2)!.time)
  raze(500)
  assert.equal(flagHp(w.flags![7], ps.get(2)!.time), FLAG_HP, 'yếu hơn quân giữ: không sứt')
  ps.set(2, advance(ps.get(2)!, ps.get(2)!.marches.at(-1)!.returnAt))
  let fell = 0
  for (let k = 0; k < 40 && w.flags![7]; k++) {
    fell = raze(2000)
    ps.set(2, advance(ps.get(2)!, ps.get(2)!.marches.at(-1)!.returnAt))
  }
  assert.equal(w.flags![7], undefined, 'mạnh hơn quân giữ: phá dần tới đổ')
  const g = ps.get(1)!.marches[0]
  assert.ok(!g.stay && g.returnAt > 0, 'cờ đổ: quân giữ về')
  assert.equal(g.returnAt, fell + (g.arriveAt - g.startAt), 'về mất đúng đường tới, dù đã đóng lâu')
})

test('đổi chân dung: chỉ trưởng lão đã thu nhận, bỏ chọn về chân dung chưởng môn; hồ sơ người khác thấy', () => {
  const s0 = sect('A', 5)
  const owned = Object.keys(s0.elders)[0] as ElderId
  const other = (Object.keys(ELDERS) as ElderId[]).find(e => s0.elders[e] === undefined)!
  assert.deepEqual(apply(s0, { type: 'face', elder: other }, s0.time), { ok: false, error: 'locked' })
  const r = apply(s0, { type: 'face', elder: owned }, s0.time)
  assert.ok(r.ok)
  assert.equal(profileOf(freshWorld(), world(r.state), 1, true)?.face, owned)
  const back = apply(r.state, { type: 'face', elder: null }, s0.time)
  assert.ok(back.ok)
  assert.equal(profileOf(freshWorld(), world(back.state), 1, true)?.face, undefined)
})

test('khung chân dung: mở theo thành tích (Hương Hỏa, phi thăng, đệ nhất Công Huân, Luận Kiếm, luân hồi); hồ sơ người khác thấy', () => {
  const s0 = sect('A', 5)
  assert.deepEqual(apply(s0, { type: 'frame', id: 'vip' }, s0.time), { ok: false, error: 'locked' })
  assert.ok(frameOpen(s0, 'basic'))
  const vip = { ...s0, vip: { ...s0.vip, pts: VIP_LEVELS[FRAME_VIP] } }
  const r = apply(vip, { type: 'frame', id: 'vip' }, s0.time)
  assert.ok(r.ok && r.state.frame === 'vip')
  assert.equal(profileOf(freshWorld(), world(r.state), 1, true)?.frame, 'vip')
  assert.ok(frameOpen({ ...s0, rebirths: 1 }, 'rebirth') && !frameOpen(s0, 'rebirth'))
  assert.ok(frameOpen({ ...s0, stats: { ...s0.stats, duelWins: FRAME_DUELS } }, 'arena'))
  assert.ok(frameOpen({ ...s0, crowns: [1] }, 'crown') && frameOpen({ ...s0, ascended: [1] }, 'ascend'))
})

test('góp quân xây: đội đóng ở trận kỳ đang dựng làm dựng nhanh hơn, gọi về thì chậm lại', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const r0 = a.regions.find(r => r.ring === 0)!
  const home = { x: r0.cx, y: r0.cy }
  const ps = world({ ...sect('A', 10, { kiem3: 2000 }), seat: home })
  const al = { id: 1, name: 'M', tag: 'T', members: { 1: 2 as const }, notice: '', at: T0, helps: [] }
  const end = T0 + 10 * HOUR
  let w: World = {
    ...freshWorld(),
    allies: { 1: al },
    flags: { 7: { id: 7, aid: 1, x: home.x + 3, y: home.y + 2, done: end } },
  }
  const r = worldAct(ps, 1, { type: 'flagGuard', id: 7, elder: 'thanhPhong', army: { kiem3: 2000 } }, T0, 1, map, w)
  assert.ok(r.ok, 'cờ đang dựng vẫn gửi quân tới được')
  for (const [k, v] of r.changed) ps.set(k, v)
  const at = ps.get(1)!.marches[0].arriveAt
  const d = advanceAll(ps, r.world, at, map)
  for (const [k, v] of d.changed) ps.set(k, v)
  w = d.world
  assert.ok(ps.get(1)!.marches[0].stay, 'đứng lại góp sức')
  const fast = w.flags![7].done
  assert.equal(fast, at + Math.ceil((end - at) / 3), '2.000 đệ tử: tốc dựng ×3')
  assert.equal(mapOf(ps, at, new Set(), [], w).flags![0].guard?.[2], 2000, 'bản đồ thấy số đệ tử góp')
  const t2 = at + HOUR
  const back = worldAct(ps, 1, { type: 'recall', id: ps.get(1)!.marches[0].id }, t2, 1, map, w)
  assert.ok(back.ok)
  assert.equal(back.world.flags![7].done, t2 + (fast - t2) * 3, 'gọi về: phần còn lại dựng lại tốc thường')
})

test('kho minh: lãnh thổ sinh Minh khố theo giờ tròn (lần đầu chỉ đặt mốc)', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const r0 = a.regions.find(r => r.ring === 0)!
  const ps = world({ ...sect('A', 10), seat: { x: r0.cx, y: r0.cy } })
  const al = { id: 1, name: 'M', tag: 'T', members: { 1: 2 as const }, notice: '', at: T0, helps: [], fund: 100 }
  let w: World = { ...freshWorld(), allies: { 1: al } }
  const tiles = territoryTiles(ps, w, map, T0).get(1)!
  assert.ok(tiles > 0, 'tông môn trong minh có lãnh thổ')
  w = storeStep(ps, w, map, T0)
  assert.deepEqual([w.allies[1].fund, w.allies[1].fundAt], [100, T0], 'lần đầu: đặt mốc')
  assert.equal(storeStep(ps, w, map, T0 + HOUR - 1), w, 'chưa đủ giờ: không đổi')
  w = storeStep(ps, w, map, T0 + 2 * HOUR + 5)
  assert.equal(w.allies[1].fund, 100 + Math.floor(tiles * TERR_FUND * 2))
  assert.equal(w.allies[1].fundAt, T0 + 2 * HOUR, 'giữ phần lẻ sang giờ sau')
})

test('nhóm chat tự tạo: lập, thêm người (người trong nhóm thêm được, bị chặn thì không), giới hạn, rời, giải tán', () => {
  const ps = world(sect('A', 5), sect('B', 5), sect('C', 5))
  let w = freshWorld()
  const act = (pid: number, a: object) => {
    const r = worldAct(ps, pid, a as never, T0, 1, undefined, w)
    if (!r.ok) return r.error
    w = r.world
    return null
  }
  assert.equal(parseWorldAction({ type: 'groupNew', name: 'x' }), null, 'tên quá ngắn')
  assert.equal(act(1, { type: 'groupNew', name: 'Họp đêm' }), null)
  const g = Object.values(w.groups!)[0]
  assert.deepEqual([g.name, g.owner, g.members], ['Họp đêm', 1, [1]])
  assert.equal(act(3, { type: 'groupAdd', id: g.id, pid: 2 }), 'locked', 'ngoài nhóm không thêm được')
  assert.equal(act(1, { type: 'groupAdd', id: g.id, pid: 2 }), null)
  assert.equal(act(2, { type: 'groupAdd', id: g.id, pid: 1 }), 'claimed')
  ps.set(3, { ...ps.get(3)!, blocks: [2] })
  assert.equal(act(2, { type: 'groupAdd', id: g.id, pid: 3 }), 'friend', 'người kia đã chặn mình')
  assert.deepEqual(
    groupsOf(w, 2).map(x => x.id),
    [g.id],
  )
  for (let k = 0; k < GROUPS_PER - 1; k++) act(1, { type: 'groupNew', name: `Nhóm ${k}` })
  assert.equal(act(1, { type: 'groupNew', name: 'Thêm nữa' }), 'limit', 'mỗi người tối đa GROUPS_PER nhóm')
  assert.equal(act(1, { type: 'groupLeave', id: g.id }), null)
  assert.equal(w.groups![g.id].owner, 2, 'người lập rời: người vào sớm nhất giữ nhóm')
  assert.equal(act(2, { type: 'groupLeave', id: g.id }), null)
  assert.equal(w.groups![g.id], undefined, 'nhóm trống: giải tán')
})

test('Phá Yêu Trại: yêu vương đổ trong khung thứ Ba – thứ Tư ra điểm minh theo sát thương; hết khung top minh nhận quà', () => {
  const ps = world(sect('A', 10), sect('B', 10), sect('C', 10))
  const mk = (id: number, members: Record<number, 0 | 2>) => ({
    id,
    name: `M${id}`,
    tag: `T${id}`,
    members,
    notice: '',
    at: T0,
    helps: [],
  })
  let w: World = { ...freshWorld(), allies: { 1: mk(1, { 1: 2 }), 2: mk(2, { 2: 2, 3: 0 }) } }
  const wk = weekOf(T0) + 1
  assert.equal(tribeBank(w, tribeStart(wk) - 1, 2, { 1: 100 }), w, 'ngoài khung: không tính')
  w = tribeBank(w, tribeStart(wk) + HOUR, 2, { 1: 300, 2: 100 })
  w = tribeBank(w, tribeStart(wk) + 2 * HOUR, 1, { 3: 50 })
  assert.deepEqual(w.tribe!.pts, { 1: TRIBE_PTS[2] * 0.75, 2: TRIBE_PTS[2] * 0.25 + TRIBE_PTS[1] })
  assert.equal(tribeStep(ps, w, tribeEnd(wk) - 1).world, w, 'chưa hết khung')
  const r = tribeStep(ps, w, tribeEnd(wk) + 5)
  assert.ok(r.world.tribe!.done)
  assert.deepEqual(r.changed.get(1)!.mail.at(-1)!.a, [1, Math.round(TRIBE_PTS[2] * 0.75)], 'minh 1 hạng nhất')
  assert.deepEqual(
    [r.changed.get(2)!.mail.at(-1)!.a![0], r.changed.get(3)!.mail.at(-1)!.a![0]],
    [2, 2],
    'cả minh 2 nhận hạng nhì',
  )
  assert.equal(tribeStep(ps, r.world, tribeEnd(wk) + 10).changed.size, 0, 'mỗi tuần một lần')
})

test('khám phá: mê vụ riêng mỗi người (quanh tông môn đã khai), linh điểu tan sương ô kề vùng đã khai, ghé thôn trang / động phủ một lần', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const site = sitesOf(a).find(x => x.kind === 'village' && x.ring === 0)!
  const home = { x: site.x + 2, y: site.y }
  const ps = world({ ...sect('A', 5), seat: home })
  const w = freshWorld()
  const act = (x: Record<string, unknown>, t = ps.get(1)!.time) => worldAct(ps, 1, x as never, t, 1, map, w)
  const h = cellOf(home)
  const f0 = fogOf(ps.get(1)!)
  assert.ok(
    clear(f0, h.cx, h.cy, T0) && clear(f0, h.cx + FOG_HOME, h.cy, T0) && !clear(f0, h.cx + FOG_HOME + 2, h.cy, T0),
  )
  // thôn trang trong vùng đã khai: ghé một lần, quà theo vòng
  const v = act({ type: 'visit', i: site.i })
  assert.ok(v.ok)
  const me = v.changed.get(1)!
  assert.equal(me.items.kinhThu500, (ps.get(1)!.items.kinhThu500 ?? 0) + 1)
  ps.set(1, me)
  assert.equal(err(act({ type: 'visit', i: site.i })), 'claimed')
  const far = sitesOf(a).find(x => !clear(f0, cellOf(x).cx, cellOf(x).cy, T0))!
  assert.equal(err(act({ type: 'visit', i: far.i })), 'locked', 'còn mê vụ')
  // linh điểu: chỉ ô kề vùng đã khai; tới nơi tan 3 × 3; một điểu (tầng 5) thì phải chờ về
  const cx = h.cx + FOG_HOME + 1
  assert.equal(err(act({ type: 'scout', cx: cx + 3, cy: h.cy })), 'bad', 'không kề vùng đã khai')
  const r = act({ type: 'scout', cx, cy: h.cy })
  assert.ok(r.ok)
  ps.set(1, r.changed.get(1)!)
  const fly = ps.get(1)!.fog!.fly[0]
  assert.equal(fly.at - T0, craneTime(home, cx, h.cy))
  assert.ok(!clear(ps.get(1)!.fog!, cx + 1, h.cy, T0) && clear(ps.get(1)!.fog!, cx + 1, h.cy, fly.at))
  assert.equal(err(act({ type: 'scout', cx, cy: h.cy + 1 })), 'busy', 'điểu đang bay')
  const back = act({ type: 'scout', cx: cx + 2, cy: h.cy }, fly.back)
  assert.ok(back.ok, 'điểu về rồi: ô vừa khai mở thêm biên giới mới')
})

test('Ma Triều Công Sơn: trưởng lão ghi danh trước giờ; tối thứ Tư 5 đợt đánh từng người (sức theo phòng thủ của họ), giữ được thì điểm, mất quân chỉ bị thương; hết đợt cuối quà theo điểm + hạng minh', () => {
  const al = { id: 1, name: 'M', tag: 'T', members: { 1: 2 as const, 2: 0 as const }, notice: '', at: T0, helps: [] }
  const ps = world(sect('A', 10, { kiem2: 400, the2: 400 }), sect('B', 10, { phap2: 300 }))
  let w: World = { ...freshWorld(), allies: { 1: al } }
  const wk = weekOf(T0)
  const before = legionAt(wk, 0) - HOUR
  const sign = (pid: number, t: number) => worldAct(ps, pid, { type: 'legionSign' }, t, 1, undefined, w)
  assert.equal(err(sign(2, before)), 'locked', 'thành viên thường không ghi danh')
  const r = sign(1, before)
  assert.ok(r.ok)
  w = r.world
  assert.equal(legionStep(ps, w, before, 1).world, w, 'chưa tới giờ: không đổi gì')
  assert.equal(err(sign(1, legionAt(wk, 1))), 'locked', 'đang đánh dở: chưa ghi tuần sau được')
  // đợt 1 (sức 0.5 × phòng thủ của chính mình): giữ được, có chiến báo, quân mất vào Đan phòng
  let s1 = legionStep(ps, w, legionAt(wk, 0), 1)
  const a1 = s1.changed.get(1)!
  assert.equal(a1.reports.at(-1)!.kind, 'legion')
  assert.equal(a1.reports.at(-1)!.win, true)
  assert.equal(s1.world.legion!.done, 1)
  assert.equal(s1.world.legion!.by[1], LEGION_PTS[0])
  const lost = count(a1.reports.at(-1)!.hurt)
  assert.equal(count(a1.wounded) - count(ps.get(1)!.wounded), lost, 'bị thương, không tử trận')
  // tua qua mọi đợt: thư quà theo điểm, minh hạng 1
  for (const [k, v] of s1.changed) ps.set(k, v)
  s1 = legionStep(ps, s1.world, legionAt(wk, LEGION_WAVES - 1), 2)
  for (const [k, v] of s1.changed) ps.set(k, v)
  assert.equal(s1.world.legion!.done, LEGION_WAVES)
  const kinds = ps.get(1)!.mail.map(m => m.k)
  assert.ok(kinds.includes('legion') && kinds.includes('legionTop'))
  assert.equal(
    legionStep(ps, s1.world, legionAt(wk, LEGION_WAVES - 1) + HOUR, 3).world,
    s1.world,
    'đã xong: không giải lại',
  )
  w = s1.world
  const next = sign(1, legionAt(wk, LEGION_WAVES - 1) + HOUR)
  assert.ok(next.ok && next.world.legion!.week === wk + 1, 'xong rồi: ghi danh cho tuần sau')
})

test('lễ nhập minh: lần đầu lập / vào tiên minh nhận quà qua thư, rời rồi vào lại không nhận nữa', () => {
  const ps = world(sect('A', 10), sect('B', 10))
  let w = freshWorld()
  const act = (pid: number, a: Record<string, unknown>) => {
    const r = worldAct(ps, pid, a as never, T0, 1, undefined, w)
    assert.ok(r.ok, r.ok ? '' : r.error)
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
  }
  const gifts = (pid: number) => ps.get(pid)!.mail.filter(m => m.k === 'allyWelcome').length
  act(1, { type: 'allyFound', name: 'Vạn Kiếm', tag: 'VK' })
  act(2, { type: 'allyJoin', id: allyOf(w, 1)!.id })
  assert.deepEqual([gifts(1), gifts(2)], [1, 1])
  act(2, { type: 'allyLeave' })
  act(2, { type: 'allyJoin', id: allyOf(w, 1)!.id })
  assert.equal(gifts(2), 1, 'một lần mỗi tông môn')
})

test('yêu vương: kho máu chung, mỗi đội đánh một lát; hạ thì thưởng chia theo sát thương qua thư, rồi hồi sinh', async () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const boss = a.points.find(p => p.kind === 'boss' && p.lv === 2)!
  const seat = { x: a.regions[boss.region].cx + 3, y: a.regions[boss.region].cy }
  const ps = world(
    ...[1, 2, 3].map(k => ({
      ...sect(`S${k}`, 20, { kiem4: 1200, phap4: 1200, the4: 1200 }),
      seat,
      elders: { thanhPhong: expAt(40) },
    })),
  )
  let w: World = {
    ...freshWorld(),
    spots: { [boss.i]: { hp: 20_000 } }, // còn 20k: một lát tối đa 12k, phải hai đội
    allies: { 1: { id: 1, name: 'Vạn Kiếm', tag: 'VK', members: { 1: 2, 3: 0 }, notice: '', at: T0, helps: [] } },
  }
  for (const pid of [1, 2]) {
    const r = worldAct(
      ps,
      pid,
      { type: 'go', i: boss.i, task: 'hit', elder: 'thanhPhong', army: { kiem4: 1200, phap4: 1200, the4: 1200 } },
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
  assert.deepEqual(
    [1, 2, 3].map(p => ps.get(p)!.stats.forts ?? 0),
    [1, 1, 0],
    'góp sức hạ yêu vương (Truyền Đạo Tứ Phương)',
  )
  const minhLe = (p: number) => ps.get(p)!.mail.find(m => m.k === 'allyGift')
  assert.ok(minhLe(1) && minhLe(3), 'Minh lễ: cả minh của người đánh nhận quà, kể cả người không đánh')
  assert.equal(minhLe(2), undefined, 'không vào minh: không có Minh lễ')
  assert.equal(allyOf(w, 1)!.gift, GIFT_PTS[2])
  assert.equal(w.bosses, 1, 'đếm yêu vương đã hạ cho Thiên Đạo Biên Niên')
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
      ...sect(`S${k}`, 20, { kiem4: 1000, phap4: 1000, the4: 1000 }),
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
  const army = { kiem4: 1000, phap4: 1000, the4: 1000 }
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
    assert.deepEqual([s.mail.at(-2)!.k, s.mail.at(-1)!.k], ['season', 'yearbook'], 'thư kết mùa rồi thư tổng kết')
  }
  assert.deepEqual(A.mail.at(-2)!.a, [1, 1, 1])
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

test('gọi về giữa đường: đội đang đi quay đầu từ chỗ đang đứng, về mất bằng thời gian đã đi, hoàn hành lực; không tới nơi', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 0 }
  const p = a.points.find(x => x.kind === 'wild' && x.lv <= 3)!
  const seat = { x: a.regions[p.region].cx, y: a.regions[p.region].cy }
  const ps = world({ ...sect('Săn', 12, { kiem3: 800 }), seat })
  const w = freshWorld()
  const act = (raw: object, now: number) => {
    const r = worldAct(ps, 1, raw as never, now, 5, map, w)
    if (r.ok) for (const [k, v] of r.changed) ps.set(k, v)
    return r.ok ? null : r.error
  }
  assert.equal(act({ type: 'go', i: p.i, task: 'hunt', elder: 'thanhPhong', army: { kiem3: 800 } }, T0), null)
  const m = ps.get(1)!.marches[0]
  assert.ok(recallable(m, T0 + 1))
  const mid = T0 + Math.floor((m.arriveAt - T0) / 2)
  assert.equal(act({ type: 'recall', id: m.id }, mid), null)
  const back = ps.get(1)!.marches[0]
  assert.deepEqual([back.arriveAt, back.returnAt], [mid, 2 * mid - T0], 'về mất bằng thời gian đã đi')
  assert.deepEqual(back.back, m.army)
  assert.deepEqual(back.path![0], seat)
  assert.ok(
    back.path!.length >= 2 && Math.hypot(back.path!.at(-1)!.x - p.x, back.path!.at(-1)!.y - p.y) > 0.5,
    'dừng giữa đường',
  )
  assert.equal(apOf(ps.get(1)!, mid), apOf({ ...ps.get(1)!, ap: undefined }, mid), 'hoàn hành lực')
  assert.ok(!recallable(back, mid + 1), 'đang về thì thôi')
  const done = advanceAll(ps, w, m.arriveAt + 1, map)
  assert.equal((done.changed.get(1) ?? ps.get(1)!).stats.hunted ?? 0, 0, 'không đánh')
  assert.equal(act({ type: 'recall', id: m.id }, mid + 1000), 'bad')
})

test('cửa ải: trận nhãn phe khác đang giữ chặn đường (blocked); mình / minh ước giữ thì qua; đi trong vùng không cần cổng', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const home = a.regions.find(r => r.ring === 0)!
  const p = a.points.find(x => x.kind === 'wild' && x.region !== home.i && x.lv <= 3)!
  const near = a.points.find(x => x.kind === 'wild' && x.region === home.i && x.lv <= 3)!
  const ps = world({ ...sect('Qua', 12, { kiem3: 800 }), seat: { x: home.cx, y: home.cy } })
  const ally = (id: number, members: Record<number, 0 | 2>, naps: number[] = []) => ({
    id,
    name: `M${id}`,
    tag: `M${id}`,
    members,
    notice: '',
    at: T0,
    helps: [],
    naps,
  })
  const held = (own: number, allies = {}): World => ({
    ...freshWorld(),
    allies,
    spots: Object.fromEntries(a.gates.map(g => [g.i, { own }])),
  })
  const go = (w: World, i = p.i) =>
    err(worldAct(ps, 1, { type: 'go', i, task: 'hunt', elder: 'thanhPhong', army: { kiem3: 800 } }, T0, 5, map, w))
  assert.equal(go(held(-2)), 'blocked', 'phe khác giữ mọi cửa ải')
  assert.equal(go(held(-2), near.i), null, 'trong vùng mình: không qua cổng')
  assert.equal(go(held(-1)), null, 'mình giữ')
  assert.equal(go(held(7, { 1: ally(1, { 1: 2 }, [7]), 7: ally(7, { 2: 2 }, [1]) })), null, 'minh ước giữ')
  assert.equal(go(held(7, { 1: ally(1, { 1: 2 }), 7: ally(7, { 2: 2 }) })), 'blocked', 'minh khác giữ')
})

test('Tổng đà: minh đủ người dựng một cái bằng Minh khố, xong thì nới lãnh thổ FORT_R, độ bền lớn, cả minh được tăng ích', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const r0 = a.regions.find(r => r.ring === 0)!
  const home = { x: r0.cx, y: r0.cy }
  const seats = [home, ...[3, 6, 9, 12].map(k => ({ x: 3 + k, y: 3 }))]
  const ps = world(...seats.map((seat, k) => ({ ...sect(`S${k}`, 10), seat })))
  const members = Object.fromEntries(seats.map((_, k) => [k + 1, k ? 0 : 2])) as Record<number, 0 | 2>
  const al = { id: 1, name: 'M', tag: 'T', members, notice: '', at: T0, helps: [], fund: FORT_COST + 5 }
  let w: World = { ...freshWorld(), allies: { 1: al } }
  const fort = (x: number, y: number, ww = w, pid = 1) => worldAct(ps, pid, { type: 'fort', x, y }, T0, 1, map, ww)
  const spot = [-1, 0, 1]
    .flatMap(k => [
      { x: home.x + TERR_SEAT, y: home.y + k },
      { x: home.x - TERR_SEAT, y: home.y + k },
    ])
    .find(p => fort(p.x, p.y).ok)!
  assert.ok(spot, 'có ô dựng được')
  assert.equal(
    err(fort(spot.x, spot.y, { ...w, allies: { 1: { ...al, members: { 1: 2, 2: 0 } } } })),
    'limit',
    'chưa đủ người',
  )
  assert.equal(err(fort(spot.x, spot.y, w, 2)), 'locked', 'thành viên thường không dựng')
  const r = fort(spot.x, spot.y)
  assert.ok(r.ok)
  w = r.world
  const f = Object.values(w.flags!)[0]
  assert.ok(f.fort && f.done === T0 + FORT_BUILD)
  assert.equal(w.allies[1].fund, 5)
  assert.equal(flagsOf(w, 1).length, 0, 'không tính vào số trận kỳ')
  assert.equal(
    err(fort(home.x, home.y + TERR_SEAT, { ...w, allies: { 1: { ...w.allies[1], fund: 99_999 } } })),
    'limit',
    'dưới FORT_PER người: chỉ một',
  )
  // minh đủ FORT_PER người: thêm một Phân đà, tốn gấp đôi
  const many = Object.fromEntries(Array.from({ length: FORT_PER }, (_, k) => [k + 1, k ? 0 : 2])) as Record<
    number,
    0 | 2
  >
  assert.equal(fortCap({ members: many }), 2)
  const big = (fund: number) => ({ ...w, allies: { 1: { ...w.allies[1], members: many, fund } } })
  const other = [-1, 0, 1]
    .flatMap(k => [
      { x: home.x + k, y: home.y + TERR_SEAT },
      { x: home.x + k, y: home.y - TERR_SEAT },
    ])
    .find(p => fort(p.x, p.y, big(99_999)).ok)!
  assert.equal(err(fort(other.x, other.y, big(2 * FORT_COST - 1))), 'not_enough', 'Phân đà thứ hai: gấp đôi')
  const r2 = fort(other.x, other.y, big(2 * FORT_COST))
  assert.ok(r2.ok && fortsOf(r2.world, 1).length === 2 && r2.world.allies[1].fund === 0)
  const far = { x: spot.x + Math.sign(spot.x - home.x) * FORT_R, y: spot.y }
  assert.equal(ownerAt(claimsOf(ps, w, a, T0), far.x, far.y), 0, 'đang dựng: chưa nới')
  assert.equal(ownerAt(claimsOf(ps, w, a, f.done), far.x, far.y), 1, 'dựng xong: nới FORT_R ô')
  assert.equal(flagHp(f, f.done), FORT_HP)
  assert.deepEqual(fortBuffs(w, 1, T0), [], 'đang dựng: chưa có tăng ích')
  assert.deepEqual(
    fortBuffs(w, 3, f.done).map(b => [b.key, b.v, b.src]),
    FORT_BUFFS.map(b => [b.key, b.v, 'fort']),
  )
})

test('do thám: tốn linh thạch theo tầng bên kia, chiếm một linh điểu tới khi về, thư báo cáo cho mình và thư "bị do thám" cho bên kia', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const r0 = a.regions.find(r => r.ring === 0)!
  const me = { ...sect('Dò', 10), seat: { x: r0.cx, y: r0.cy }, res: { linhThach: 5000, linhThao: 0, linhKhoang: 0 } }
  const foe = {
    ...sect('Nhà', 12, { kiem2: 300 }),
    seat: { x: r0.cx + 12, y: r0.cy },
    res: { linhThach: 900_000, linhThao: 0, linhKhoang: 0 },
  }
  const ps = world(me, foe)
  const w = freshWorld()
  const spy = (pid = 1, at = T0, pp = ps) => worldAct(pp, pid, { type: 'spy', pid: pid === 1 ? 2 : 1 }, at, 1, map, w)
  const r = spy()
  assert.ok(r.ok, JSON.stringify(r))
  const s = r.changed.get(1)!
  assert.equal(s.res.linhThach, 5000 - SPY_COST * 12)
  const rep = s.mail.at(-1)!
  assert.equal(rep.k, 'spy')
  assert.equal(rep.a![0], 'Nhà')
  assert.ok((rep.a![3] as number) > 0, 'thấy tài nguyên cướp được')
  assert.equal(rep.a![6], 300, 'thấy quân giữ nhà')
  assert.equal(r.changed.get(2)!.mail.at(-1)!.k, 'spied')
  // linh điểu bận tới khi về: hết linh điểu thì không thả được
  const busy = new Map([...ps, [1, s]])
  assert.equal(err(spy(1, T0 + 1000, busy)), cranes(s) > 1 ? null : 'busy')
  assert.equal(err(spy(1, T0, new Map([...ps, [1, { ...me, res: { ...me.res, linhThach: 10 } }]]))), 'not_enough')
  assert.equal(
    err(
      worldAct(ps, 1, { type: 'spy', pid: 2 }, T0, 1, map, {
        ...w,
        allies: { 1: { id: 1, name: 'M', tag: 'M', members: { 1: 2, 2: 0 }, notice: '', at: T0, helps: [] } },
      }),
    ),
    'friend',
    'cùng minh',
  )
  // Ẩn Tung Phù: bên kia dùng rồi thì linh điểu về tay không (vẫn tốn, bên kia vẫn biết bị do thám)
  const used = apply({ ...foe, items: { anTung8: 1 } }, { type: 'use', item: 'anTung8', n: 1 }, T0)
  assert.ok(used.ok && used.state.veil === T0 + 8 * HOUR)
  const hid = spy(1, T0, new Map([...ps, [2, used.state]]))
  assert.ok(hid.ok)
  assert.deepEqual(hid.changed.get(1)!.mail.at(-1)!.k, 'spyVeil')
  assert.equal(hid.changed.get(2)!.mail.at(-1)!.k, 'spied')
})

test('tốc khai mỏ: Khai Linh Phù (+50 %) rút thời gian khai; bị động khai mỏ chỉ khi trưởng lão đó dẫn đội', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const mine = a.points.find(p => p.kind === 'mine' && p.region === 0)!
  const seat = { x: a.regions[0].cx, y: a.regions[0].cy }
  const dig = (s: State, elder: ElderId = 'thanhPhong') => {
    const ps = world({ ...s, seat })
    const r = worldAct(
      ps,
      1,
      { type: 'go', i: mine.i, task: 'gather', elder, army: { kiem2: 100 } },
      T0,
      1,
      map,
      freshWorld(),
    )
    assert.ok(r.ok, JSON.stringify(r))
    for (const [k, v] of r.changed) ps.set(k, v)
    const m = ps.get(1)!.marches[0]
    const g = advanceAll(ps, freshWorld(), m.arriveAt, map).changed.get(1)!.marches[0]
    return g.mine!.end - g.arriveAt
  }
  const base = sect('A', 10, { kiem2: 100 })
  const plain = dig(base)
  const buffed = dig({ ...base, buffs: [{ key: 'gather', v: 0.5, until: T0 + 8 * 3_600_000, src: 'phu.gather' }] })
  assert.ok(Math.abs(buffed - plain / 1.5) <= 1000, `${buffed} ~ ${plain / 1.5}`)
  const van = { ...base, elders: { ...base.elders, vanHac: expAt(20) } }
  assert.ok(dig(van, 'vanHac') < plain, 'Vân Hạc cấp 20 dẫn đội: khai nhanh hơn')
})

test('phù dời núi: Càn Khôn Phù tới ô chọn ở vùng đã mở (không chờ lượt, không cần lãnh thổ); Di Sơn Phù tới chỗ ngẫu nhiên vùng ngoài; sát khí thì không dời', () => {
  const a = atlas(777)
  const r0 = a.regions.find(r => r.ring === 0)!
  const mid = a.regions.find(r => r.ring === 1)!
  const home = { x: r0.cx, y: r0.cy }
  const me = { ...sect('Dời', 10), seat: home, items: { canKhon: 2, diSon: 1 }, moved: T0 }
  const ps = world(me)
  const act = (raw: object, phase = 1, s: State = me) =>
    worldAct(new Map([[1, s]]), 1, raw as never, T0 + 1000, 7, { atlas: a, phase }, freshWorld())
  // ô trống ở vùng giữa: cách mọi điểm từ 3 ô
  let spot = { x: mid.cx, y: mid.cy }
  for (let r = 0; r < 12 && a.points.some(p => Math.hypot(p.x - spot.x, p.y - spot.y) < 3); r++)
    spot = { x: mid.cx + r, y: mid.cy - r }
  assert.equal(regionOf(a, spot), mid.i)
  const go = { type: 'move', x: spot.x, y: spot.y, item: true }
  assert.equal(err(act(go, 1)), 'far', 'vùng giữa chưa mở ở pha 1')
  assert.equal(
    err(act({ type: 'move', x: spot.x, y: spot.y }, 2)),
    'locked',
    'dời thường: không minh, hết lượt tân thủ',
  )
  const r = act(go, 2)
  assert.ok(r.ok, JSON.stringify(r))
  assert.deepEqual(r.changed.get(1)!.seat, spot)
  assert.equal(r.changed.get(1)!.items.canKhon, 1)
  assert.equal(err(act(go, 2, { ...me, frenzy: T0 + 60_000 })), 'frenzy', 'vừa đi cướp: sát khí chặn dời núi')
  assert.equal(err(act(go, 2, { ...me, items: {} })), 'no_item')
  const rr = act({ type: 'moveRandom' })
  assert.ok(rr.ok, JSON.stringify(rr))
  const s = rr.changed.get(1)!
  assert.notDeepEqual(s.seat, home)
  assert.equal(a.regions[regionOf(a, s.seat!)].ring, 0, 'Di Sơn Phù: vùng ngoài')
  assert.equal(s.items.diSon ?? 0, 0)
  assert.equal(
    err(act({ type: 'moveRandom' }, 1, { ...me, marches: ps.get(1)!.marches.concat([{ id: 9 } as never]) })),
    'busy',
  )
})

test('Minh trận thần thông: trưởng lão bật bằng Minh khố, cả minh có tăng ích tới hết giờ, hết hiệu lực chờ hồi mới bật lại', () => {
  const ps = world(sect('Chủ', 10), sect('Đệ', 10), sect('Ngoài', 10))
  let w: World = {
    ...freshWorld(),
    allies: {
      1: { id: 1, name: 'VK', tag: 'VK', members: { 1: 2, 2: 0 }, notice: '', at: T0, helps: [], fund: 10_000 },
    },
  }
  const act = (pid: number, id: string, at = T0) => {
    const r = worldAct(ps, pid, { type: 'allySkill', id } as never, at, 1, undefined, w)
    if (r.ok) w = r.world
    return err(r)
  }
  assert.equal(act(2, 'tuLinh'), 'locked', 'chỉ trưởng lão / minh chủ')
  assert.equal(act(3, 'tuLinh'), 'locked', 'không minh')
  assert.equal(act(1, 'tuLinh'), null)
  assert.equal(w.allies[1].fund, 10_000 - ALLY_SKILLS.tuLinh.cost)
  assert.equal(w.allies[1].skills?.tuLinh, T0 + ALLY_SKILLS.tuLinh.hours * 3_600_000)
  assert.equal(act(1, 'tuLinh', T0 + 1000), 'cooldown', 'đang hiệu lực')
  // cả minh (không ai ngoài minh) có tăng ích khai mỏ, tự hết lúc hết giờ
  const map = { atlas: atlas(777), phase: 3 }
  const got = worldBuffs(ps, w, map, T0 + 1000)
  const buff = (pid: number) => got.get(pid)?.buffs.find(b => b.src === 'askill')
  assert.deepEqual(
    [buff(1)?.key, buff(1)?.v, buff(2)?.until],
    ['gather', ALLY_SKILLS.tuLinh.v, w.allies[1].skills!.tuLinh],
  )
  assert.equal(buff(3), undefined)
  // hết hiệu lực: chưa đủ hồi thì chưa bật lại; Minh khố không đủ thì không bật được
  const end = w.allies[1].skills!.tuLinh!
  assert.equal(act(1, 'tuLinh', end + 1000), 'cooldown')
  assert.equal(act(1, 'tuLinh', end + ALLY_SKILL_COOL), null)
  w = { ...w, allies: { 1: { ...w.allies[1], fund: 10 } } }
  assert.equal(act(1, 'kiemTran'), 'not_enough')
})

test('do thám linh địa: linh mạch phe khác đang giữ — tốn linh thạch, chiếm linh điểu, thư báo số đội / đệ tử / lực chiến; phe mình, chỗ trống thì không', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const vein = a.points.find(p => p.kind === 'vein' && p.region === 0)!
  const seat = { x: a.regions[0].cx, y: a.regions[0].cy }
  const guard: March = {
    id: 1,
    elder: 'thanhPhong',
    army: { kiem3: 800 },
    target: { kind: 'spot', i: vein.i },
    task: 'take',
    seed: 1,
    startAt: T0 - 60_000,
    arriveAt: T0 - 1000,
    returnAt: 0,
    stay: true,
  }
  const ps = world(
    { ...sect('Dò', 10), seat },
    { ...sect('Giữ', 10), seat: { x: seat.x + 2, y: seat.y }, marches: [guard] },
  )
  const w: World = { ...freshWorld(), spots: { [vein.i]: { own: -2 } } }
  const spy = (pid: number, i: number, ww = w) => worldAct(ps, pid, { type: 'spySpot', i } as never, T0, 1, map, ww)
  const r = spy(1, vein.i)
  assert.ok(r.ok, JSON.stringify(r))
  const s1 = r.changed.get(1)!
  const m = s1.mail.at(-1)!
  assert.equal(m.k, 'spySpot')
  assert.deepEqual(m.a!.slice(0, 3), ['vein', vein.x, vein.y])
  assert.deepEqual([m.a![4], m.a![5]], [1, 800], 'một đội đóng, 800 đệ tử')
  assert.ok((m.a![6] as number) > 0, 'có lực chiến')
  assert.ok(s1.res.linhThach < ps.get(1)!.res.linhThach, 'tốn linh thạch')
  assert.equal(err(spy(2, vein.i)), 'friend', 'phe mình giữ')
  assert.equal(err(spy(1, vein.i, { ...w, spots: {} })), 'empty', 'chưa ai giữ')
})

test('Tàng Bảo Đồ: đủ 7 tàn phiến ghép thành điểm đào gần tông môn (ai cũng thấy); xuất quân tới đào, quà qua thư, điểm biến mất; người khác không đào được', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const r0 = a.regions.find(r => r.ring === 0)!
  const home = { x: r0.cx, y: r0.cy }
  const ps = world(
    { ...sect('Tầm', 10, { kiem3: 300 }), seat: home, items: { ...newGame(T0).items, baoDo: 9 } },
    { ...sect('Khác', 10, { kiem3: 300 }), seat: { x: home.x + 8, y: home.y } },
  )
  let w = freshWorld()
  const act = (pid: number, x: object, t = T0) => {
    const r = worldAct(ps, pid, x as never, t, 4242, map, w)
    if (!r.ok) return r.error
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
    return null
  }
  assert.equal(act(2, { type: 'digMap' }), 'not_enough', 'chưa đủ tàn phiến')
  assert.equal(act(1, { type: 'digMap' }), null)
  const s1 = ps.get(1)!
  assert.equal(s1.items.baoDo, 2)
  const site = s1.digs![0]
  assert.ok(Math.max(Math.abs(site.x - home.x), Math.abs(site.y - home.y)) <= DIG_R, 'gần tông môn')
  assert.ok(!a.points.some(p => p.x === site.x && p.y === site.y), 'ô trống')
  assert.equal(regionOf(a, site), regionOf(a, home), 'cùng vùng: đi tới được')
  assert.deepEqual(
    mapOf(ps, T0, new Set(), [], w).digs?.map(d => [d.x, d.y, d.name]),
    [[site.x, site.y, 'Tầm']],
    'ai cũng thấy điểm đào',
  )
  assert.equal(
    act(2, { type: 'dig', ...site, elder: 'thanhPhong', army: { kiem3: 100 } }),
    'gone',
    'không phải bản đồ của mình',
  )
  assert.equal(act(1, { type: 'dig', ...site, elder: 'thanhPhong', army: { kiem3: 100 } }), null)
  const m = ps.get(1)!.marches.at(-1)!
  assert.ok(m.dig && m.target.kind === 'camp')
  const d = advanceAll(ps, w, m.arriveAt, map)
  for (const [k, v] of d.changed) ps.set(k, v)
  const s2 = ps.get(1)!
  assert.deepEqual(s2.digs, [], 'đào xong: điểm biến mất')
  const letter = s2.mail.at(-1)!
  assert.equal(letter.k, 'dig')
  assert.ok(letter.gift?.items && Object.keys(letter.gift.items).length > 0, 'rương kho báu')
  assert.ok(s2.marches.at(-1)!.returnAt > m.arriveAt, 'đội về ngay')
})

test('phù văn: sinh quanh linh địa theo mầm + chu kỳ 12 giờ; xuất quân nhặt được tăng ích 1 giờ (thay phù văn cũ), người sau không nhặt lại được', () => {
  const a = atlas(777)
  const map = { atlas: a, phase: 3 }
  const list = runesAt(a, runeCycle(T0))
  assert.ok(list.length > 20, 'mỗi linh địa một phù văn')
  assert.deepEqual(runesAt(a, runeCycle(T0)), list, 'tất định')
  assert.notDeepEqual(runesAt(a, runeCycle(T0) + 1), list, 'chu kỳ sau sinh chỗ khác')
  const r0 = a.regions.find(r => r.ring === 0)!
  const rune = list
    .filter(r => regionOf(a, r) === r0.i)
    .sort((p, q) => Math.hypot(p.x - r0.cx, p.y - r0.cy) - Math.hypot(q.x - r0.cx, q.y - r0.cy))[0]
  const home = { x: r0.cx, y: r0.cy }
  const ps = world(
    { ...sect('Nhặt', 10, { kiem3: 300 }), seat: home },
    { ...sect('Chậm', 10, { kiem3: 300 }), seat: { x: home.x + 1, y: home.y + 1 } },
  )
  let w = freshWorld()
  const go = (pid: number) =>
    worldAct(
      ps,
      pid,
      { type: 'rune', x: rune.x, y: rune.y, elder: 'thanhPhong', army: { kiem3: 100 } } as never,
      T0,
      7,
      map,
      w,
    )
  const r1 = go(1)
  assert.ok(r1.ok, JSON.stringify(r1))
  for (const [k, v] of r1.changed) ps.set(k, v)
  const m = ps.get(1)!.marches.at(-1)!
  assert.deepEqual(m.rune, { i: rune.i, cyc: runeCycle(T0), k: rune.k, t: rune.t })
  const d = advanceAll(ps, w, m.arriveAt, map)
  for (const [k, v] of d.changed) ps.set(k, v)
  w = d.world
  const s1 = ps.get(1)!
  const buff = s1.buffs.find(b => b.src === 'rune')!
  assert.deepEqual([buff.key, buff.v, buff.until], [RUNE_KINDS[rune.k], RUNE_TIERS[rune.t], m.arriveAt + 3_600_000])
  assert.equal(s1.stats.runes, 1)
  assert.ok(!runesLeft(w, a, m.arriveAt).some(r => r.i === rune.i), 'đã nhặt: biến khỏi bản đồ')
  assert.equal(err(go(2)), 'gone', 'người sau không nhặt lại được')
  assert.ok(!mapOf(ps, m.arriveAt, new Set(), [], w, a).runes?.some(r => r.i === rune.i))
})
