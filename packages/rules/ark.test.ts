import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ARK_CHARGE,
  ARK_ROUND,
  ARK_SC,
  ARK_ROUNDS,
  ARK_TAKE,
  HONOR_CUP,
  LEAGUE_LOSE,
  LEAGUE_WIN,
  coins,
  expAt,
  newGame,
  type State,
} from './index.ts'
import {
  arkAt,
  arkOf,
  arkRound,
  arkRow,
  arkStep,
  atlas,
  betOpen,
  betSettle,
  endSeason,
  freshWorld,
  leagueBoard,
  worldAct,
  type ArkFight,
  type Players,
  type World,
} from './world.ts'

const T0 = Date.UTC(2026, 8, 21, 3) // thứ Hai
function sect(name: string, strong: boolean): State {
  const s = newGame(T0, name)
  const levels = Object.fromEntries(Object.keys(s.levels).map(k => [k, 10])) as State['levels']
  return { ...s, levels, elders: { thanhPhong: expAt(strong ? 30 : 2) } }
}
const ally = (id: number, tag: string, members: Record<number, 0 | 2>) => ({
  id,
  name: tag,
  tag,
  members,
  notice: '',
  at: T0,
  helps: [],
})

test('Tranh Đoạt Linh Châu: ghi danh, 20h Chủ nhật dựng trận, mỗi hiệp đi / đánh / chiếm, hết hiệp cuối có quà và điểm minh chiến', () => {
  // minh 1 (người 1–3, mạnh) và minh 2 (người 4–6, yếu)
  const ps: Players = new Map([1, 2, 3, 4, 5, 6].map(p => [p, sect(`T${p}`, p <= 3)]))
  let w: World = {
    ...freshWorld(),
    allies: { 1: ally(1, 'VK', { 1: 2, 2: 0, 3: 0 }), 2: ally(2, 'HS', { 4: 2, 5: 0, 6: 0 }) },
  }
  const act = (pid: number, raw: object, at = T0) => {
    const r = worldAct(ps, pid, raw as never, at, 1, undefined, w)
    if (!r.ok) return r.error
    w = r.world
    return null
  }
  assert.equal(act(2, { type: 'arkSign' }), 'locked', 'chỉ trưởng lão / minh chủ')
  assert.equal(act(1, { type: 'arkSign' }), null)
  assert.equal(act(1, { type: 'arkSign' }), 'claimed')
  assert.equal(act(4, { type: 'arkSign' }), null)
  assert.ok(arkRow(w, 1).signed)
  const start = arkAt(Math.floor((T0 + 7 * 3_600_000) / (7 * 86_400_000)) + 0)
  assert.equal(new Date(start + 7 * 3_600_000).getUTCDay(), 0, 'Chủ nhật giờ VN')
  assert.equal(new Date(start + 7 * 3_600_000).getUTCHours(), 20, '20h giờ VN')
  // chưa tới giờ: không gì
  assert.equal(arkStep(ps, w, start - 1000, 7).world, w)
  // tới giờ: dựng trận, mọi đội ở Linh Đài, lệnh mặc định Trung Điện
  let r = arkStep(ps, w, start + 1000, 7)
  w = r.world
  const f0 = arkOf(w).live[0]
  assert.deepEqual([f0.a, f0.b, f0.round, f0.units.length], [1, 2, 0, 6])
  assert.ok(f0.units.every(u => u.at === (u.side ? 10 : 0) && u.to === 5))
  assert.deepEqual(f0.own, [0, null, null, null, null, null, null, null, null, null, 1])
  assert.deepEqual(arkRow(w, 2).live?.b, 2)
  // chiến pháp (thử trên bản sao — không đổi diễn biến trận bên dưới): minh chủ dùng, mỗi trận mỗi cái một lần, hiệu lực hiệp kế
  const sk = worldAct(ps, 1, { type: 'arkSkill', k: 'coVu' } as never, start + 2000, 1, undefined, w)
  assert.ok(sk.ok)
  const fs = arkOf(sk.world).live[0]
  assert.deepEqual([fs.used?.[0], fs.buffs], [['coVu'], [{ side: 0, k: 'coVu', r: 1 }]])
  const again = worldAct(ps, 1, { type: 'arkSkill', k: 'coVu' } as never, start + 2000, 1, undefined, sk.world)
  assert.deepEqual(again, { ok: false, error: 'claimed' })
  assert.deepEqual(worldAct(ps, 2, { type: 'arkSkill', k: 'kienThu' } as never, start + 2000, 1, undefined, w), {
    ok: false,
    error: 'locked',
  })
  // lệnh: đội mình tới Tiểu Trận Nam; không vào Linh Đài bên kia; cả minh chỉ trưởng lão / minh chủ
  assert.equal(act(5, { type: 'arkOrder', to: 6 }, start + 2000), null)
  assert.equal(act(5, { type: 'arkOrder', to: 0 }, start + 2000), 'bad')
  assert.equal(act(5, { type: 'arkOrder', to: 4, all: true }, start + 2000), 'locked')
  assert.equal(act(5, { type: 'arkOrder', to: 11 }, start + 2000), 'bad', 'ngoài chiến trường')
  assert.equal(arkOf(w).live[0].units.find(u => u.pid === 5)!.to, 6)
  // người của minh 1 rời đi lập minh khác (thành minh chủ) — không được ra lệnh cho cả minh 1
  const spy = { ...w, allies: { ...w.allies, 1: ally(1, 'VK', { 1: 2, 3: 0 }), 3: ally(3, 'GI', { 2: 2 }) } }
  assert.deepEqual(worldAct(ps, 2, { type: 'arkOrder', to: 0, all: true } as never, start + 2000, 1, undefined, spy), {
    ok: false,
    error: 'locked',
  })
  // hiệp 1: mỗi bên đi một ô về Trung Điện — qua Linh Tháp bên mình, chiếm ra điểm; đội đi riêng qua Tụ Linh Nhãn Đông Nam
  r = arkStep(ps, w, start + ARK_ROUND + 1000, 7)
  w = r.world
  const f1 = arkOf(w).live[0]
  assert.equal(f1.round, 1)
  assert.ok(f1.units.filter(u => u.side === 0).every(u => u.at === 2))
  assert.ok(f1.units.filter(u => u.side === 1 && u.pid !== 5).every(u => u.at === 8))
  assert.equal(f1.units.find(u => u.pid === 5)!.at, 9)
  assert.deepEqual([f1.own[2], f1.own[8], f1.own[9]], [0, 1, 1])
  assert.ok(f1.pts[0] >= ARK_TAKE[2], 'chiếm lần đầu ra điểm')
  // hiệp 2: hai bên gặp nhau ở Trung Điện — bên mạnh thắng, bên thua về Linh Đài nghỉ; đội đi riêng tới Tiểu Trận Nam
  r = arkStep(ps, w, start + 2 * ARK_ROUND + 1000, 7)
  w = r.world
  const f2 = arkOf(w).live[0]
  assert.ok(
    f2.log.some(([rd, k, sd, node]) => rd === 2 && k === 'win' && sd === 0 && node === 5),
    JSON.stringify(f2.log),
  )
  assert.equal(f2.own[5], 0, 'bên thắng chiếm Trung Điện')
  assert.ok(
    f2.units.filter(u => u.side === 1 && u.pid !== 5).every(u => u.at === 10 && u.rest === 3),
    'thua: nghỉ hiệp 3',
  )
  assert.equal(f2.units.find(u => u.pid === 5)!.at, 6, 'đội đi riêng tới Tiểu Trận Nam')
  assert.equal(f2.own[6], 1)
  // server tắt qua thứ Hai: lần gọi sau (tuần mới) kết thúc trận cũ trước, quà vẫn tới
  const late = arkStep(ps, w, start + 8 * 86_400_000, 7)
  assert.equal(arkOf(late.world).live.length, 0)
  assert.equal(late.changed.get(1)!.mail.at(-1)!.k, 'ark')
  // hết mọi hiệp: kết quả, thư, điểm minh chiến
  r = arkStep(ps, w, start + ARK_ROUNDS * ARK_ROUND + 1000, 7)
  w = r.world
  const ark = arkOf(w)
  assert.deepEqual([ark.live.length, ark.signed.length, ark.last.length], [0, 0, 1])
  assert.ok(ark.last[0].wa > ark.last[0].wb, 'minh mạnh thắng')
  assert.ok((w.war?.pts[1] ?? 0) > (w.war?.pts[2] ?? 0))
  for (const p of [1, 2, 3, 4, 5, 6]) assert.equal(r.changed.get(p)!.mail.at(-1)!.k, 'ark')
  assert.equal(r.changed.get(1)!.mail.at(-1)!.a![0], 1)
  assert.equal(r.changed.get(4)!.mail.at(-1)!.a![0], 0)
  // công huân cá nhân: thư ghi điểm của mình và hạng trong minh; ai cũng có điểm (chiếm / giữ / đánh)
  const ma = r.changed.get(1)!.mail.at(-1)!.a as number[]
  assert.ok(ma[4] > 0 && ma[5] >= 1, JSON.stringify(ma))
  assert.ok(arkOf(r.world).last.length === 1)
  assert.equal(arkStep(ps, w, start + ARK_ROUNDS * ARK_ROUND + 60_000, 7).world, w, 'tuần này xong rồi')
  // Cửu Thiên Luận Đạo Hội: thắng 3 điểm, thua 1; hết mùa minh top giải có quà
  assert.deepEqual(
    leagueBoard(w).map(x => [x.id, x.w, x.l, x.pts]),
    [
      [1, 1, 0, LEAGUE_WIN],
      [2, 0, 1, LEAGUE_LOSE],
    ],
  )
  const end = endSeason(ps, w, { atlas: atlas(7), phase: 3 }, start + 86_400_000, 1, new Set())
  assert.deepEqual(end.changed.get(1)!.mail.find(m => m.k === 'league')?.a, [1])
  assert.deepEqual(end.changed.get(4)!.mail.find(m => m.k === 'league')?.a, [2])
})

test('Linh Châu: người mang đi về Tiểu Trận mình giữ chưa nạp, nạp được điểm (lần sau ×1,5), Châu về Trung Điện sau một hiệp', () => {
  const ps: Players = new Map([
    [1, sect('Mang', true)],
    [2, sect('Kia', false)],
  ])
  const f: ArkFight = {
    a: 1,
    b: 2,
    an: 'A',
    bn: 'B',
    round: 3,
    units: [
      { pid: 1, side: 0, at: 5, to: 5, n: [] },
      { pid: 2, side: 1, at: 10, to: 10, n: [] },
    ],
    own: [0, null, null, null, 0, 0, 1, null, null, null, 1],
    pts: [0, 0],
    taken: [[4, 5], [6]],
    charged: [[], []],
    orb: { at: 5, by: 1, n: 0 },
    log: [],
  }
  const f4 = arkRound(ps, f, 3)
  assert.equal(f4.units[0].at, 4, 'mang Châu tới Tiểu Trận Bắc (mình giữ, chưa nạp)')
  assert.equal(f4.pts[0], ARK_CHARGE + 20 + 40, 'nạp + giữ Bắc + giữ Trung Điện')
  assert.deepEqual(f4.charged[0], [4])
  assert.deepEqual(f4.orb, { at: 4, n: 1, back: 4 })
  const f5 = arkRound(ps, f4, 3)
  assert.equal(f5.orb?.at, 5, 'Châu về Trung Điện')
  assert.equal(f5.orb?.by, 1, 'đội theo lệnh đứng quay về Trung Điện thì nhặt lại Châu')
  const f6 = arkRound(ps, f5, 3)
  assert.equal(f6.units[0].at, 5, 'Tiểu Trận mình giữ đều đã nạp: người mang đứng yên')
  assert.equal(f6.charged[0].length, 1)
})

test('Tụ Linh Nhãn phe mình giữ nối thẳng với nhau; mỗi Linh Tháp phe mình giữ thêm công ở mọi trận', () => {
  const ps: Players = new Map([
    [1, sect('Nhãn', true)],
    [2, sect('Kia', true)],
  ])
  const none = [0, null, null, null, null, null, null, null, null, null, 1] as ArkFight['own']
  const f = (own: ArkFight['own'], units: ArkFight['units']): ArkFight => ({
    a: 1,
    b: 2,
    an: 'A',
    bn: 'B',
    round: 0,
    units,
    own,
    pts: [0, 0],
    taken: [[], []],
    charged: [[], []],
    orb: null,
    log: [],
  })
  const walker = [{ pid: 1, side: 0 as const, at: 1, to: 3, n: [] }]
  const linked = none.map((x, i) => (i === 1 || i === 3 ? 0 : x))
  assert.equal(arkRound(ps, f(linked, walker), 3).units[0].at, 3, 'giữ cả hai nhãn: một hiệp tới nơi')
  assert.notEqual(arkRound(ps, f(none, walker), 3).units[0].at, 3, 'không giữ: đi vòng hai hiệp')
  // hai đội ngang sức đánh ở Tiểu Trận Bắc: bên A giữ hai Linh Tháp thì luôn còn nhiều quân hơn (hạt 1: đổi cả bên thắng)
  const duel = [
    { pid: 1, side: 0 as const, at: 4, to: 4, n: [] },
    { pid: 2, side: 1 as const, at: 4, to: 4, n: [] },
  ]
  const left = (x: ArkFight) => {
    const u = x.units.find(v => v.pid === 1)!
    return u.at === 0 ? 0 : u.n.reduce((a, b) => a + b, 0)
  }
  const shrines = none.map((x, i) => (i === 2 || i === 8 ? 0 : x))
  for (const seed of [1, 2, 3, 4, 5])
    assert.ok(left(arkRound(ps, f(shrines, duel), seed)) > left(arkRound(ps, f(none, duel), seed)), `hạt ${seed}`)
  assert.equal(arkRound(ps, f(none, duel), 1).log[0][2], 1)
  assert.equal(arkRound(ps, f(shrines, duel), 1).log[0][2], 0)
})

test('Cửu Thiên playoff: trận áp chót của mùa là bán kết 4 minh đầu bảng giải, trận cuối là chung kết + tranh hạng ba; quà mùa theo playoff', () => {
  // minh 1–6, mỗi minh 3 người; minh 4 không ai đủ tầng ra trận (xử thua); minh 3 yếu
  const ps: Players = new Map()
  const allies: World['allies'] = {}
  for (let id = 1; id <= 6; id++) {
    const members: Record<number, 0 | 2> = {}
    for (let k = 0; k < 3; k++) {
      const pid = id * 10 + k
      const s = sect(`M${pid}`, id !== 3)
      ps.set(pid, id === 4 ? { ...s, levels: { ...s.levels, chuDien: 1 } } : s)
      members[pid] = k ? 0 : 2
    }
    allies[id] = ally(id, `T${id}`, members)
  }
  const wk = Math.floor((T0 + 7 * 3_600_000) / (7 * 86_400_000))
  const end = arkAt(wk + 1) + ARK_ROUNDS * ARK_ROUND + 60_000 // mùa hết ngay sau trận tuần sau: tuần này bán kết
  let w: World = {
    ...freshWorld(),
    allies,
    ark: {
      on: -1,
      done: -1,
      signed: [1, 5, 6], // minh 1 vào playoff: không ghép trận thường
      live: [],
      last: [],
      league: { 1: [3, 0, 9], 2: [2, 1, 7], 3: [1, 2, 5], 4: [1, 2, 4], 5: [0, 3, 3], 6: [0, 3, 3] },
    },
  }
  let r = arkStep(ps, w, arkAt(wk) + 1000, 7, end)
  w = r.world
  let ark = arkOf(w)
  assert.deepEqual(ark.cup, { seeds: [1, 2, 3, 4], win: [1], lose: [4] }, 'minh 4 không ra được trận: minh 1 đi tiếp')
  assert.deepEqual(
    ark.live.map(f => [f.a, f.b, f.cup]),
    [
      [2, 3, 'semi'],
      [5, 6, undefined],
    ],
  )
  r = arkStep(ps, w, arkAt(wk) + ARK_ROUNDS * ARK_ROUND + 1000, 7, end)
  w = r.world
  ark = arkOf(w)
  assert.deepEqual(ark.cup, { seeds: [1, 2, 3, 4], win: [1, 2], lose: [4, 3] })
  assert.deepEqual(
    [ark.league?.[2], ark.league?.[3]],
    [
      [2, 1, 7],
      [1, 2, 5],
    ],
    'trận playoff không cộng điểm giải',
  )
  assert.equal(r.changed.get(20)!.mail.at(-1)!.k, 'ark', 'người đánh playoff vẫn có thư, quà trận')
  // tuần cuối: chung kết 1–2; tranh hạng ba 4–3 (minh 4 xử thua)
  r = arkStep(ps, w, arkAt(wk + 1) + 1000, 7, end)
  w = r.world
  ark = arkOf(w)
  assert.deepEqual(
    ark.live.map(f => [f.a, f.b, f.cup]),
    [[1, 2, 'final']],
  )
  assert.deepEqual(ark.cup?.third, [3, 4])
  assert.equal(arkRow(w, 3).cup?.tags[3], 'T3')
  r = arkStep(ps, w, arkAt(wk + 1) + ARK_ROUNDS * ARK_ROUND + 1000, 7, end)
  w = r.world
  const fin = arkOf(w).cup!.final!
  assert.deepEqual([...fin].sort(), [1, 2])
  // hết mùa: quà giải theo playoff — quán quân, á quân, hạng ba
  const out = endSeason(ps, w, { atlas: atlas(7), phase: 3 }, end, 1, new Set())
  const rank = (pid: number) => out.changed.get(pid)!.mail.find(m => m.k === 'league')?.a
  assert.deepEqual([rank(fin[0] * 10), rank(fin[1] * 10), rank(30), rank(40)], [[1], [2], [3], undefined])
  assert.deepEqual(
    [out.changed.get(fin[0] * 10)!.honors, out.changed.get(fin[1] * 10)!.honors],
    [[1 * 8 + HONOR_CUP], undefined],
    'danh hiệu Quán quân Cửu Thiên cho người trong minh vô địch',
  )
})

test('Luận Kiếm Đặt Cược: hạt giống chốt khi hết trận tuần trước bán kết; cược một bên mỗi trận; trúng nhận × hệ số, trượt hoàn sau chung kết', () => {
  // minh 1–4 vào playoff (minh 4 không ai đủ tầng: xử thua, minh 3 yếu); 100 cược, 101 không có tệ
  const ps: Players = new Map()
  const allies: World['allies'] = {}
  for (let id = 1; id <= 4; id++) {
    const members: Record<number, 0 | 2> = {}
    for (let k = 0; k < 3; k++) {
      const pid = id * 10 + k
      const s = sect(`M${pid}`, id !== 3)
      ps.set(pid, id === 4 ? { ...s, levels: { ...s.levels, chuDien: 1 } } : s)
      members[pid] = k ? 0 : 2
    }
    allies[id] = ally(id, `T${id}`, members)
  }
  ps.set(100, { ...sect('Khách', true), honorAll: 4000 }) // 200 tệ
  ps.set(101, sect('Nghèo', true))
  const wk = Math.floor((T0 + 7 * 3_600_000) / (7 * 86_400_000)) + 1
  const end = arkAt(wk + 1) + ARK_ROUNDS * ARK_ROUND + 60_000 // tuần wk bán kết, wk + 1 chung kết
  let w: World = {
    ...freshWorld(),
    allies,
    ark: {
      on: -1,
      done: -1,
      signed: [],
      live: [],
      last: [],
      league: { 1: [3, 0, 9], 2: [2, 1, 7], 3: [1, 2, 5], 4: [1, 2, 4] },
    },
  }
  const step = (at: number) => {
    const r = arkStep(ps, w, at, 7, end)
    const b = betSettle(new Map([...ps, ...r.changed]), r.world, at)
    for (const [k, v] of [...r.changed, ...b.changed]) ps.set(k, v)
    w = b.world
  }
  const bet = (pid: number, on: number, n: number, at: number) => {
    const r = worldAct(ps, pid, { type: 'leagueBet', on, n }, at, 1, undefined, w)
    if (!r.ok) return r.error
    for (const [k, v] of r.changed) ps.set(k, v)
    w = r.world
    return null
  }
  assert.deepEqual(betOpen(w), [], 'chưa chốt hạt giống: chưa cược')
  const t1 = arkAt(wk - 1) + ARK_ROUNDS * ARK_ROUND + 1000
  step(t1)
  assert.deepEqual(
    arkOf(w).cup,
    { seeds: [1, 2, 3, 4], win: [], lose: [] },
    'hết trận tuần trước bán kết: chốt hạt giống',
  )
  assert.deepEqual(betOpen(w), [
    ['semi', 1, 4],
    ['semi', 2, 3],
  ])
  assert.equal(bet(100, 1, 30, t1), null)
  assert.equal(bet(100, 4, 10, t1), 'taken', 'mỗi trận một bên')
  assert.equal(bet(100, 1, 30, t1), 'limit', 'tối đa BET_MAX một trận')
  assert.equal(bet(100, 3, 20, t1), null)
  assert.equal(bet(100, 5, 10, t1), 'gone', 'minh ngoài playoff')
  assert.equal(bet(101, 2, 10, t1), 'not_enough')
  assert.equal(coins(ps.get(100)!), 150)
  // bán kết: minh 4 xử thua ngay — cược minh 1 trúng ×2; trận 2–3 đang đánh thì đóng cược
  step(arkAt(wk) + 1000)
  assert.equal(coins(ps.get(100)!), 210)
  assert.deepEqual(ps.get(100)!.mail.at(-1)!.a, [1, 'T1', 'semi', 60])
  assert.equal(bet(100, 2, 10, arkAt(wk) + 2000), 'gone', 'playoff đang đánh')
  // bán kết xong: minh 3 thua — cược trượt chờ hoàn; mở cược chung kết + tranh hạng ba
  const t2 = arkAt(wk) + ARK_ROUNDS * ARK_ROUND + 1000
  step(t2)
  assert.deepEqual(w.bets, [{ pid: 100, k: 'semi', on: 3, n: 20, lost: true }])
  assert.deepEqual(betOpen(w), [
    ['final', 1, 2],
    ['third', 4, 3],
  ])
  assert.equal(bet(100, 2, 50, t2), null)
  step(arkAt(wk + 1) + 1000)
  step(arkAt(wk + 1) + ARK_ROUNDS * ARK_ROUND + 1000)
  const won = arkOf(w).cup!.final![0] === 2
  assert.deepEqual(w.bets, [], 'playoff xong: trả hết')
  assert.equal(
    coins(ps.get(100)!),
    160 + (won ? 75 : 50) + 20,
    'chung kết trúng ×1,5 hay hoàn; cược bán kết trượt được hoàn',
  )
})

test('Luận Kiếm Đặt Cược: hết mùa còn cược treo thì hoàn tệ', () => {
  const ps: Players = new Map([[100, { ...sect('Khách', true), honorAll: 4000 }]])
  const w: World = { ...freshWorld(), bets: [{ pid: 100, k: 'final', on: 1, n: 40 }] }
  ps.set(100, { ...ps.get(100)!, coinSpent: 40 })
  const out = endSeason(ps, w, { atlas: atlas(7), phase: 3 }, T0, 1, new Set())
  assert.equal(coins(out.changed.get(100)!), 200)
  assert.equal(out.world.bets, undefined)
})

test('Linh Châu: công huân cá nhân (chiếm, giữ, đánh, nạp Châu); Hồi Tháp — giữ cả hai Linh Tháp thì đội thua khỏi nghỉ; chiến pháp hiệp kế', () => {
  const ps: Players = new Map([
    [1, sect('Nhãn', true)],
    [2, sect('Kia', true)],
  ])
  const base = (own: ArkFight['own'], units: ArkFight['units'], extra: Partial<ArkFight> = {}): ArkFight => ({
    a: 1,
    b: 2,
    an: 'A',
    bn: 'B',
    round: 0,
    units,
    own,
    pts: [0, 0],
    taken: [[], []],
    charged: [[], []],
    orb: null,
    log: [],
    ...extra,
  })
  const none = [0, null, null, null, null, null, null, null, null, null, 1] as ArkFight['own']
  // chiếm ô lần đầu + giữ trong hiệp: công huân
  const walker = [{ pid: 1, side: 0 as const, at: 0, to: 2, n: [] }]
  const f1 = arkRound(ps, base(none, walker), 3)
  assert.equal(f1.units[0].sc, ARK_SC.take + ARK_SC.hold)
  // đánh ở Tiểu Trận Bắc: bên thua về Linh Đài; bên B giữ cả hai Linh Tháp thì khỏi nghỉ
  const duel = [
    { pid: 1, side: 0 as const, at: 4, to: 4, n: [] },
    { pid: 2, side: 1 as const, at: 4, to: 4, n: [] },
  ]
  const fought = arkRound(ps, base(none, duel), 1)
  const lost = fought.units.find(u => u.at === 0 || u.at === 10)!
  assert.equal(lost.rest, 2, 'thường: nghỉ hết hiệp sau')
  assert.ok(
    fought.units.every(u => (u.sc ?? 0) >= ARK_SC.fight),
    'đánh là có công huân',
  )
  // bên A yếu (trưởng lão cấp thấp) giữ cả hai Linh Tháp: thua vẫn về Linh Đài nhưng hiệp sau ra trận ngay
  const weak: Players = new Map([
    [1, sect('Yếu', false)],
    [2, sect('Mạnh', true)],
  ])
  const bothA = none.map((x, i) => (i === 2 || i === 8 ? 0 : x))
  const lifeRun = arkRound(weak, base(bothA, duel), 1)
  const loserA = lifeRun.units.find(u => u.pid === 1)!
  assert.equal(loserA.at, 0, 'bên yếu thua')
  assert.equal(loserA.rest, 1, 'Hồi Tháp: hiệp sau ra trận ngay')
  // chiến pháp Cổ Vũ của bên A ở hiệp 1: bên A còn nhiều quân hơn
  const left = (x: ArkFight) => {
    const u = x.units.find(v => v.pid === 1)!
    return u.at === 0 ? 0 : u.n.reduce((a, b) => a + b, 0)
  }
  const cheered = base(none, duel, { buffs: [{ side: 0, k: 'coVu', r: 1 }] })
  for (const seed of [2, 3, 4])
    assert.ok(left(arkRound(ps, cheered, seed)) >= left(arkRound(ps, base(none, duel), seed)))
  // Thần Tốc: đi hai ô một hiệp
  const fast = arkRound(
    ps,
    base(none, [{ pid: 1, side: 0 as const, at: 0, to: 5, n: [] }], { buffs: [{ side: 0, k: 'thanToc', r: 1 }] }),
    3,
  )
  assert.equal(fast.units[0].at, 5)
})
