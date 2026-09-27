import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ARK_ROUNDS,
  MYSTIC_DAILY,
  MYSTIC_WAIT,
  VANCHU_DAILY,
  VANCHU_SUPPLY,
  VANCHU_WAIT,
  SILVER_DAILY,
  SILVER_WAIT,
  DAIBI_WAIT,
  ROYALE_DAILY,
  ROYALE_PTS,
  ROYALE_WAIT,
  ASSAULT_FORTS,
  ASSAULT_WAIT,
  CONVOY_COST,
  CONVOY_WAIT,
  PARTY_WAIT,
  PARTY_WAVES,
  advance,
  dayOf,
  expAt,
  festOpen,
  newGame,
  type PartyRole,
  type State,
} from './index.ts'
import {
  mysticRun,
  mysticStep,
  vanchuResult,
  vanchuRun,
  vanchuStep,
  silverRun,
  silverStep,
  daibiRun,
  daibiStep,
  royaleRun,
  royaleStep,
  royaleUsed,
  assaultStep,
  assaultTop,
  convoyStep,
  convoyTop,
  freshWorld,
  partyRun,
  partyStep,
  worldAct,
  type Players,
  type World,
} from './world.ts'

const T0 = Date.UTC(2026, 8, 21, 3)
const DAY = 86_400_000
function sect(name: string, hall = 10, exp = 30): State {
  const s = newGame(T0, name)
  const levels = Object.fromEntries(Object.keys(s.levels).map(k => [k, hall])) as State['levels']
  return { ...s, levels, elders: { thanhPhong: expAt(exp) } }
}
const room = (lv: number, roles: PartyRole[]) => ({
  by: 1,
  lv,
  at: T0,
  members: roles.map((role, i) => ({ pid: i + 1, role })),
})

test('Man Hoang Cổ Tộc: mở phòng, vào phòng, đủ người hay hết giờ thì giải — thư quà cả đội, mỗi người mỗi ngày một lần', () => {
  const ps: Players = new Map([1, 2, 3, 4, 5].map(p => [p, sect(`T${p}`)]))
  ps.set(6, sect('Non', 5))
  ps.set(7, sect('Ngoai'))
  const members = { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } as const
  let w: World = {
    ...freshWorld(),
    allies: { 1: { id: 1, name: 'VK', tag: 'VK', members, notice: '', at: T0, helps: [] } },
  }
  const act = (pid: number, raw: object, at = T0) => {
    const r = worldAct(ps, pid, raw as never, at, 1, undefined, w)
    if (!r.ok) return r.error
    w = r.world
    for (const [p, s] of r.changed) ps.set(p, s)
    return null
  }
  const open = (lv = 1, role: PartyRole = 'hoPhap') => ({ type: 'partyOpen', lv, role })
  const join = (role: PartyRole = 'chuCong') => ({ type: 'partyJoin', role })
  assert.equal(act(7, open()), 'locked', 'chưa vào minh')
  assert.equal(act(6, open()), 'locked', 'Chủ Điện chưa đủ')
  assert.equal(act(1, open(9)), 'bad')
  assert.equal(act(1, join()), 'gone', 'chưa có phòng')
  assert.equal(act(1, open()), null)
  assert.equal(w.allies[1].party?.at, T0 + PARTY_WAIT)
  assert.equal(act(2, open(2)), 'busy', 'minh đang có phòng chờ')
  assert.equal(act(1, join()), 'full', 'đã trong phòng')
  assert.equal(act(2, join()), null)
  assert.equal(partyStep(ps, w, T0 + 1000, 1).world, w, 'chưa đủ người, chưa hết giờ')
  assert.equal(act(3, join('triLieu')), null)
  assert.equal(act(4, join()), null)
  assert.equal(act(5, join()), 'full')
  // đủ người: giải ngay, ai trong đội cũng có thư [độ khó, số đợt, số người]
  const r = partyStep(ps, w, T0 + 2000, 1)
  assert.equal(r.world.allies[1].party, undefined)
  for (const p of [1, 2, 3, 4]) assert.deepEqual(r.changed.get(p)!.mail.at(-1)!.a, [1, PARTY_WAVES, 4])
  assert.equal(r.changed.has(5), false)
  w = r.world
  for (const [p, s] of r.changed) ps.set(p, s)
  assert.equal(act(1, open()), 'claimed', 'mỗi ngày một lần')
  assert.equal(act(5, open(3)), null)
  assert.equal(act(2, join()), 'claimed')
  assert.equal(act(3, join(), T0 + PARTY_WAIT + 1), 'gone', 'hết giờ chờ')
  // hết giờ chờ: thiếu người vẫn giải
  const late = partyStep(ps, w, T0 + PARTY_WAIT + 1, 1)
  assert.deepEqual(late.changed.get(5)!.mail.at(-1)!.a?.[2], 1)
  w = late.world
  assert.equal(act(1, open(), T0 + DAY), null, 'qua ngày mở lại được')
})

test('Man Hoang Cổ Tộc: đội mạnh qua nhiều đợt hơn, ải cao khó hơn, không ai thì không qua đợt nào', () => {
  const four: PartyRole[] = ['hoPhap', 'chuCong', 'chuCong', 'triLieu']
  const team = (exp: number): Players => new Map([1, 2, 3, 4].map(p => [p, sect(`P${p}`, 10, exp)]))
  const strong = partyRun(team(30), room(1, four), 7)
  assert.equal(strong, PARTY_WAVES)
  assert.ok(partyRun(team(5), room(1, four), 7) < strong)
  assert.ok(partyRun(team(30), room(5, four), 7) < strong)
  assert.equal(partyRun(new Map(), room(1, four), 7), 0)
})

test('Linh Thương Hộ Tống: trưởng lão tốn Minh khố khởi hành, người trong minh ghi danh hộ tống; tới giờ server giải — thư quà theo % hàng, minh giữ điểm cao nhất mở độ khó', () => {
  const ps: Players = new Map([1, 2, 3, 4].map(p => [p, sect(`T${p}`)]))
  ps.set(5, sect('Ngoai'))
  let w: World = {
    ...freshWorld(),
    allies: {
      1: {
        id: 1,
        name: 'VK',
        tag: 'VK',
        members: { 1: 2, 2: 0, 3: 0, 4: 0 },
        notice: '',
        at: T0,
        helps: [],
        fund: 900,
      },
    },
  }
  const act = (pid: number, raw: object, at = T0) => {
    const r = worldAct(ps, pid, raw as never, at, 1, undefined, w)
    if (!r.ok) return r.error
    w = r.world
    for (const [p, s] of r.changed) ps.set(p, s)
    return null
  }
  const go = (lv = 1) => ({ type: 'convoyGo', lv })
  assert.equal(act(2, go()), 'locked', 'chỉ trưởng lão / minh chủ')
  assert.equal(act(1, go(2)), 'locked', 'độ khó 2 chưa mở')
  assert.equal(act(3, { type: 'convoyGuard' }), 'gone', 'chưa có đoàn')
  assert.equal(act(1, go()), null)
  assert.equal(w.allies[1].fund, 900 - CONVOY_COST[0])
  assert.deepEqual(w.allies[1].convoy, { by: 1, lv: 1, at: T0 + CONVOY_WAIT, guards: [1] })
  assert.equal(act(1, go()), 'busy')
  assert.equal(act(2, { type: 'convoyGuard' }), null)
  assert.equal(act(2, { type: 'convoyGuard' }), 'full', 'đã ghi danh')
  assert.equal(act(5, { type: 'convoyGuard' }), 'gone', 'không cùng minh')
  assert.equal(convoyStep(ps, w, T0 + 1000, 1).world, w, 'chưa tới giờ khởi hành')
  const r = convoyStep(ps, w, T0 + CONVOY_WAIT, 1)
  const [lv, hp, n] = r.changed.get(1)!.mail.at(-1)!.a as number[]
  assert.deepEqual([lv, n], [1, 2])
  assert.deepEqual(r.changed.get(2)!.mail.at(-1)!.a, [1, hp, 2])
  assert.equal(r.changed.has(3), false, 'không hộ tống thì không có quà')
  assert.equal(r.world.allies[1].convoy, undefined)
  assert.equal(r.world.allies[1].convoyBest, hp > 0 ? 100 + hp : 0)
  assert.equal(convoyTop(r.world.allies[1]), hp > 0 ? 2 : 1, 'qua độ khó 1 thì mở độ khó 2')
  w = r.world
  for (const [p, s] of r.changed) ps.set(p, s)
  assert.equal(act(1, go()), 'claimed', 'mỗi ngày một chuyến')
  assert.equal(act(1, go(), T0 + DAY), 'not_enough', 'hết Minh khố')
})

test('Vây Công Yêu Vương 12 người: trong kỳ lễ mở / vào phòng, đủ người hay hết giờ thì giải — thắng: góp sức (Bảo Hạp Phiếu) + quà, mở độ khó kế; thua: trả lượt', () => {
  let t = T0
  while (!festOpen(advance(sect('X'), t), 'vayCong', t)) t += DAY
  const ps: Players = new Map([1, 2, 3, 4, 5, 6].map(p => [p, advance(sect(`T${p}`), t)]))
  let w: World = {
    ...freshWorld(),
    allies: {
      1: { id: 1, name: 'VK', tag: 'VK', members: { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0 }, notice: '', at: T0, helps: [] },
    },
  }
  const act = (pid: number, raw: object, at = t) => {
    const r = worldAct(ps, pid, raw as never, at, 1, undefined, w)
    if (!r.ok) return r.error
    w = r.world
    for (const [p, s] of r.changed) ps.set(p, s)
    return null
  }
  assert.equal(act(6, { type: 'assaultOpen', lv: 1 }), 'locked', 'chưa vào minh')
  assert.equal(act(1, { type: 'assaultOpen', lv: 2 }), 'locked', 'độ khó 2 chưa mở')
  assert.equal(act(1, { type: 'assaultOpen', lv: 1 }), null)
  assert.equal(act(2, { type: 'assaultOpen', lv: 1 }), 'busy')
  for (const p of [2, 3, 4]) assert.equal(act(p, { type: 'assaultJoin' }), null)
  assert.equal(act(4, { type: 'assaultJoin' }), 'full', 'đã trong phòng')
  assert.equal(assaultStep(ps, w, t + 1000, 1).world, w, 'chưa đủ người, chưa hết giờ')
  const before = ps.get(1)!.stats.forts ?? 0
  const r = assaultStep(ps, w, t + ASSAULT_WAIT, 1)
  const [lv, win, n] = r.changed.get(1)!.mail.at(-1)!.a as number[]
  assert.deepEqual([lv, n], [1, 4])
  assert.equal(r.world.allies[1].assault, undefined)
  if (win) {
    assert.equal(r.changed.get(1)!.stats.forts, before + ASSAULT_FORTS[0], 'thắng: góp sức hạ yêu vương')
    assert.equal(assaultTop(r.world.allies[1]), 2, 'mở độ khó 2')
  } else assert.equal(r.changed.get(1)!.assaultDay, undefined, 'thua: trả lượt')
  assert.equal(r.changed.has(5), false)
})

test('Cổ Khư Loạn Chiến: đủ 8 người thì giải ngay (thua 2 lần bị loại, hạng theo thứ tự bị loại), chờ lâu thì bù NPC; mỗi ngày 3 lượt', () => {
  const ps: Players = new Map(Array.from({ length: 10 }, (_, k) => [k + 1, sect(`T${k + 1}`)]))
  let w: World = freshWorld()
  const act = (pid: number, raw: object, at = T0) => {
    const r = worldAct(ps, pid, raw as never, at, 1, undefined, w)
    if (!r.ok) return r.error
    w = r.world
    for (const [p, s] of r.changed) ps.set(p, s)
    return null
  }
  const places = royaleRun(ps, [1, 2, 3, 4, 5, 6, 7, 8], 7)
  assert.deepEqual(
    [...places].sort((a, b) => a - b),
    [1, 2, 3, 4, 5, 6, 7, 8],
    'mỗi người một hạng',
  )
  assert.deepEqual(royaleRun(ps, [1, 2, 3, 4, 5, 6, 7, 8], 7), places, 'tất định theo mầm')
  for (let p = 1; p <= 7; p++) assert.equal(act(p, { type: 'royaleJoin' }), null)
  assert.equal(act(1, { type: 'royaleJoin' }), 'claimed', 'đã trong hàng')
  assert.equal(royaleStep(ps, w, T0 + 1000, 1, []).world, w, 'chưa đủ người, chưa chờ lâu')
  assert.equal(act(8, { type: 'royaleJoin' }), null)
  const r = royaleStep(ps, w, T0 + 2000, 1, [])
  const got = [1, 2, 3, 4, 5, 6, 7, 8].map(p => r.changed.get(p)!.mail.at(-1)!.a as number[])
  assert.deepEqual(
    got.map(a => a[0]).sort((a, b) => a - b),
    [1, 2, 3, 4, 5, 6, 7, 8],
  )
  assert.equal(r.changed.get(places.length ? got.findIndex(a => a[0] === 1) + 1 : 1)!.royale!.pts, ROYALE_PTS[0])
  assert.equal(r.world.royale, undefined, 'hết hàng')
  w = r.world
  for (const [p, s] of r.changed) ps.set(p, s)
  // chờ quá lâu: bù NPC cho đủ trận
  assert.equal(act(9, { type: 'royaleJoin' }, T0 + 3000), null)
  const f = royaleStep(ps, w, T0 + 3000 + ROYALE_WAIT, 2, [1, 2, 3])
  assert.deepEqual((f.changed.get(9)!.mail.at(-1)!.a as number[])[1], 4, 'một người thật + 3 NPC')
  assert.equal(f.changed.has(1), false, 'NPC không nhận thư')
  // mỗi ngày 3 lượt (rời hàng trả lượt)
  ps.set(10, { ...ps.get(10)!, royale: { day: dayOf(T0), n: ROYALE_DAILY, pts: 0 } })
  assert.equal(act(10, { type: 'royaleJoin' }), 'limit', 'hết lượt hôm nay')
  assert.equal(royaleUsed(ps.get(10)!, T0), ROYALE_DAILY)
})

test('Tiên Môn Đại Bỉ: 10 người (hay chờ lâu thì bù NPC) chia hai đội cân theo điểm đài, giải 3 hiệp trên 5 cờ — thư điểm hai đội và số cờ mình góp giữ', () => {
  const ps: Players = new Map(Array.from({ length: 12 }, (_, k) => [k + 1, sect(`T${k + 1}`, 12)]))
  let w: World = freshWorld()
  const act = (pid: number, raw: object, at = T0) => {
    const r = worldAct(ps, pid, raw as never, at, 1, undefined, w)
    if (!r.ok) return r.error
    w = r.world
    for (const [p, s] of r.changed) ps.set(p, s)
    return null
  }
  const { pts } = daibiRun(
    ps,
    [
      [1, 2, 3, 4, 5].map(p => [p, 'mid'] as [number, 'mid']),
      [6, 7, 8, 9, 10].map(p => [p, 'even'] as [number, 'even']),
    ],
    3,
  )
  assert.ok(pts[0] + pts[1] > 0, 'có cờ được giữ')
  assert.equal(act(1, { type: 'daibiJoin', tactic: 'bay' }), 'bad')
  const tactics = ['even', 'left', 'mid', 'right', 'home'] as const
  for (let p = 1; p <= 10; p++) assert.equal(act(p, { type: 'daibiJoin', tactic: tactics[p % 5] }), null)
  assert.equal(act(1, { type: 'daibiJoin', tactic: 'even' }), 'claimed')
  const r = daibiStep(ps, w, T0 + 1000, 5, [])
  const mails = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => r.changed.get(p)!.mail.at(-1)!.a as number[])
  assert.ok(
    mails.every(([a, b]) => a + b === mails[0][0] + mails[0][1]),
    'cùng một trận',
  )
  assert.equal(r.world.daibi, undefined)
  w = r.world
  for (const [p, s] of r.changed) ps.set(p, s)
  assert.equal(act(11, { type: 'daibiJoin', tactic: 'home' }, T0 + 2000), null)
  const f = daibiStep(ps, w, T0 + 2000 + DAIBI_WAIT, 6, [1, 2, 3])
  assert.ok(f.changed.has(11), 'chờ lâu: bù NPC cho đủ trận')
  assert.equal(f.changed.has(1), false, 'NPC không nhận thư')
})

test('Tán Tu Tranh Châu: 16 tán tu (hay chờ lâu thì bù NPC) chia hai đội Thanh – Xích, giải trọn trận Linh Châu — thư điểm hai đội, trận giữ cho khán giả', () => {
  const ps: Players = new Map(Array.from({ length: 18 }, (_, k) => [k + 1, sect(`T${k + 1}`)]))
  let w: World = freshWorld()
  const act = (pid: number, raw: object, at = T0) => {
    const r = worldAct(ps, pid, raw as never, at, 1, undefined, w)
    if (!r.ok) return r.error
    w = r.world
    for (const [p, s] of r.changed) ps.set(p, s)
    return null
  }
  const teams: [number, 'center' | 'obelisk'][][] = [
    [1, 2, 3, 4, 5, 6, 7, 8].map(p => [p, 'center']),
    [9, 10, 11, 12, 13, 14, 15, 16].map(p => [p, 'obelisk']),
  ]
  const f0 = silverRun(ps, teams, 3)
  assert.equal(f0.round, ARK_ROUNDS, 'đánh trọn các hiệp')
  assert.ok(f0.pts[0] + f0.pts[1] > 0, 'có ô được chiếm')
  assert.ok(
    f0.units.filter(u => u.side === 1).every(u => u.to === 9 || u.to === 7),
    'bên Xích nhìn lật: Tụ Linh Nhãn phía mình',
  )
  assert.deepEqual(silverRun(ps, teams, 3), f0, 'tất định theo mầm')
  assert.equal(act(1, { type: 'silverJoin', tactic: 'bay' }), 'bad')
  const tactics = ['center', 'obelisk', 'shrine', 'outpost'] as const
  for (let p = 1; p <= 16; p++) assert.equal(act(p, { type: 'silverJoin', tactic: tactics[p % 4] }), null)
  assert.equal(act(1, { type: 'silverJoin', tactic: 'center' }), 'claimed')
  const r = silverStep(ps, w, T0 + 1000, 5, [])
  const mails = Array.from({ length: 16 }, (_, k) => r.changed.get(k + 1)!.mail.at(-1)!.a as number[])
  assert.ok(
    mails.every(([a, b]) => a + b === mails[0][0] + mails[0][1]),
    'cùng một trận',
  )
  assert.equal(r.world.silver, undefined, 'hết hàng')
  assert.equal(r.world.silverLast?.round, ARK_ROUNDS, 'trận giữ cho khán giả')
  w = r.world
  for (const [p, s] of r.changed) ps.set(p, s)
  // rời hàng trả lượt
  assert.equal(act(17, { type: 'silverJoin', tactic: 'shrine' }), null)
  assert.equal(act(17, { type: 'silverLeave' }), null)
  assert.equal(ps.get(17)!.silver!.n, 0)
  assert.equal(w.silver, undefined)
  // chờ quá lâu: bù NPC cho đủ trận
  assert.equal(act(17, { type: 'silverJoin', tactic: 'shrine' }, T0 + 2000), null)
  const f = silverStep(ps, w, T0 + 2000 + SILVER_WAIT, 6, [1, 2, 3])
  assert.ok(f.changed.has(17), 'chờ lâu: bù NPC cho đủ trận')
  assert.equal(f.changed.has(1), false, 'NPC không nhận thư')
  // mỗi ngày SILVER_DAILY lượt
  ps.set(18, { ...ps.get(18)!, silver: { day: dayOf(T0), n: SILVER_DAILY, win: 0 } })
  assert.equal(act(18, { type: 'silverJoin', tactic: 'center' }), 'limit')
})

test('Vân Chu Hội Chiến: mọi buff tắt, thuyền khắc nhau như hệ đệ tử; thuyền công phá Vận Lương Chu, chìm trước thì thua — 10 người (hay bù NPC)', () => {
  type Ship = 'xung' | 'giap' | 'lau'
  const team = (base: number, ...xs: [Ship, 'atk' | 'def'][]) =>
    xs.map(([ship, stance], k) => [base + k, ship, stance] as [number, Ship, 'atk' | 'def'])
  // thủ bằng thuyền khắc thuyền công thì giữ được; thủ bằng thuyền bị khắc thì thuyền lương chìm
  const held = vanchuRun([team(1, ['xung', 'def'], ['xung', 'def']), team(10, ['lau', 'atk'], ['lau', 'atk'])], 1)
  assert.equal(held.hp[0], VANCHU_SUPPLY, 'Xung Vân Chu (Kiếm) chặn được Lâu Thuyền (Pháp)')
  const lost = vanchuRun([team(1, ['giap', 'def'], ['giap', 'def']), team(10, ['lau', 'atk'], ['lau', 'atk'])], 1)
  assert.ok(lost.hp[0] < VANCHU_SUPPLY, 'Huyền Giáp Chu (Thể) bị Lâu Thuyền (Pháp) khắc')
  assert.ok((lost.sunk.get(10) ?? 0) > 0, 'ghi công đánh chìm')
  // không ai thủ: thuyền lương chìm, trận dừng sớm
  const raid = vanchuRun([team(1, ['xung', 'atk']), team(10, ['xung', 'atk'], ['xung', 'atk'])], 1)
  assert.equal(raid.hp[0], 0)
  assert.ok(raid.hp[1] > 0 && raid.rounds < 6)
  // hai thuyền lương cùng chìm (hiệp 3: 4 thuyền công phá 48 / hiệp, 3 thuyền phá 36 / hiệp): bên phá mạnh hơn thắng
  const both = vanchuRun(
    [
      team(1, ['xung', 'atk'], ['xung', 'atk'], ['xung', 'atk'], ['xung', 'atk']),
      team(10, ['xung', 'atk'], ['xung', 'atk'], ['xung', 'atk']),
    ],
    1,
  )
  assert.deepEqual(both.hp, [0, 0])
  assert.equal(vanchuResult(both, 0), 1)
  assert.equal(vanchuResult(both, 1), -1)
  // hàng chờ: đủ 10 người thì giải, thư cho người thật; chờ lâu thì bù NPC
  const ps: Players = new Map(Array.from({ length: 12 }, (_, k) => [k + 1, sect(`T${k + 1}`, 12)]))
  let w: World = freshWorld()
  const act = (pid: number, raw: object, at = T0) => {
    const r = worldAct(ps, pid, raw as never, at, 1, undefined, w)
    if (!r.ok) return r.error
    w = r.world
    for (const [p, s] of r.changed) ps.set(p, s)
    return null
  }
  assert.equal(act(1, { type: 'vanchuJoin', ship: 'bè', stance: 'atk' }), 'bad')
  const ships = ['xung', 'giap', 'lau'] as const
  for (let p = 1; p <= 10; p++)
    assert.equal(act(p, { type: 'vanchuJoin', ship: ships[p % 3], stance: p % 3 ? 'atk' : 'def' }), null)
  assert.equal(act(1, { type: 'vanchuJoin', ship: 'xung', stance: 'atk' }), 'claimed')
  const r = vanchuStep(ps, w, T0 + 1000, 5, [])
  const mails = Array.from({ length: 10 }, (_, k) => r.changed.get(k + 1)!.mail.at(-1)!.a as number[])
  assert.ok(
    mails.every(([a, b]) => a + b === mails[0][0] + mails[0][1]),
    'cùng một trận',
  )
  assert.equal(r.world.vanchu, undefined)
  w = r.world
  for (const [p, s] of r.changed) ps.set(p, s)
  assert.equal(act(11, { type: 'vanchuJoin', ship: 'lau', stance: 'atk' }, T0 + 2000), null)
  const f = vanchuStep(ps, w, T0 + 2000 + VANCHU_WAIT, 6, [1, 2, 3])
  assert.ok(f.changed.has(11), 'chờ lâu: bù NPC')
  assert.equal(f.changed.has(1), false, 'NPC không nhận thư')
  ps.set(12, { ...ps.get(12)!, vanchu: { day: dayOf(T0), n: VANCHU_DAILY, win: 0 } })
  assert.equal(act(12, { type: 'vanchuJoin', ship: 'xung', stance: 'atk' }), 'limit')
})

test('Huyễn Vực Bí Cảnh: hàng chờ lẻ mỗi độ khó, đủ 4 người (hay bù NPC) thì ghép đội đánh ba thủ lĩnh; thư số màn / lượt / hạng; bảng tuần phá đảo nhanh nhất', () => {
  const ps: Players = new Map(Array.from({ length: 8 }, (_, k) => [k + 1, sect(`T${k + 1}`, 12)]))
  let w: World = freshWorld()
  const act = (pid: number, raw: object, at = T0) => {
    const r = worldAct(ps, pid, raw as never, at, 1, undefined, w)
    if (!r.ok) return r.error
    w = r.world
    for (const [p, s] of r.changed) ps.set(p, s)
    return null
  }
  const team: [number, 'hoPhap' | 'chuCong' | 'triLieu'][] = [
    [1, 'hoPhap'],
    [2, 'chuCong'],
    [3, 'chuCong'],
    [4, 'triLieu'],
  ]
  const run = mysticRun(ps, team, 'normal', 5)
  assert.ok(run.stages >= 1 && run.rounds > 0, JSON.stringify(run))
  assert.deepEqual(mysticRun(ps, team, 'normal', 5), run, 'tất định theo mầm')
  assert.ok(mysticRun(ps, team, 'legend', 5).stages <= run.stages, 'Truyền Thuyết khó hơn')
  assert.equal(act(1, { type: 'mysticJoin', mode: 'hell', role: 'hoPhap' }), 'bad')
  for (const [p, role] of team) assert.equal(act(p, { type: 'mysticJoin', mode: 'normal', role }), null)
  assert.equal(act(1, { type: 'mysticJoin', mode: 'legend', role: 'hoPhap' }), 'claimed', 'một hàng mỗi lúc')
  const r = mysticStep(ps, w, T0 + 1000, 5, [])
  const m = r.changed.get(1)!.mail.at(-1)!
  assert.equal(m.k, 'mystic')
  const [mode, stages, rounds, rank] = m.a as number[]
  assert.deepEqual([mode, stages, rounds], [0, run.stages, run.rounds])
  assert.equal(rank, stages === 3 ? 1 : 0)
  assert.equal(r.world.mystic?.normal, undefined, 'hết hàng')
  if (stages === 3) assert.equal(r.world.mysticBoard?.normal[0].rounds, rounds)
  w = r.world
  for (const [p, s] of r.changed) ps.set(p, s)
  // rời hàng trả lượt; chờ lâu thì bù NPC
  assert.equal(act(5, { type: 'mysticJoin', mode: 'legend', role: 'chuCong' }), null)
  assert.equal(act(5, { type: 'mysticLeave' }), null)
  assert.equal(ps.get(5)!.mystic!.n, 0)
  assert.equal(act(5, { type: 'mysticJoin', mode: 'legend', role: 'chuCong' }, T0 + 2000), null)
  const f = mysticStep(ps, w, T0 + 2000 + MYSTIC_WAIT, 6, [6, 7, 8])
  assert.ok(f.changed.has(5))
  assert.equal(f.changed.has(6), false, 'NPC không nhận thư')
  ps.set(8, { ...ps.get(8)!, mystic: { day: dayOf(T0), n: MYSTIC_DAILY, win: 0 } })
  assert.equal(act(8, { type: 'mysticJoin', mode: 'normal', role: 'triLieu' }), 'limit')
})
