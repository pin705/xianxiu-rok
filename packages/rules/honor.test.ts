import test from 'node:test'
import assert from 'node:assert/strict'
import {
  COIN_PER,
  COIN_SHOP,
  HERO_GIFT,
  HONOR_KP,
  HONOR_TIERS,
  RELIC_BONUS,
  RELIC_COST,
  apply,
  coins,
  expAt,
  lead,
  newGame,
  relicError,
  seasonEnd,
  type State,
} from './index.ts'
import {
  addHonor,
  addKp,
  atlas,
  campOf,
  campPts,
  endSeason,
  freshWorld,
  heroStep,
  heroView,
  heroWinners,
  worldAct,
  type Players,
  type World,
} from './world.ts'

const T0 = Date.UTC(2026, 8, 23, 3)
const sect = (name: string, honor = 0): State => ({ ...newGame(T0, name), honor })

test('Công Huân: chiến công cộng Công Huân; mốc nhận lần lượt; hết mùa top nhận quà theo hạng rồi về 0', () => {
  // chiến công → Công Huân (cả phần lẻ dưới HONOR_KP thì chưa tính)
  const k = addKp(sect('A'), 3 * HONOR_KP + 40)
  assert.deepEqual([k.stats.kp, k.honor], [3 * HONOR_KP + 40, 3])

  // mốc: đủ điểm thì nhận lần lượt, chưa đủ thì khoá, hết mốc thì thôi
  let s = sect('B', HONOR_TIERS[1].n)
  const claim = () => apply(s, { type: 'honorClaim' }, T0)
  for (const want of [0, 1]) {
    const r = claim()
    assert.ok(r.ok, `mốc ${want}`)
    s = r.state
    for (const [id, n] of Object.entries(HONOR_TIERS[want].reward.items ?? {}))
      assert.ok((s.items[id as keyof State['items']] ?? 0) >= (n ?? 0))
  }
  assert.equal(s.honorGot, 2)
  assert.deepEqual(claim(), { ok: false, error: 'locked' }, 'mốc 3 chưa đủ điểm')
  assert.deepEqual(apply({ ...s, honor: 1e9, honorGot: HONOR_TIERS.length }, { type: 'honorClaim' }, T0), {
    ok: false,
    error: 'claimed',
  })

  // hết mùa: hạng theo điểm (NPC không xếp), thư quà trước thư kết mùa, mọi người về 0
  const ps: Players = new Map([
    [1, sect('Nhất', 900)],
    [2, sect('Nhì', 500)],
    [3, sect('Không', 0)],
    [4, sect('NPC', 5000)],
  ])
  const end = endSeason(ps, freshWorld(), { atlas: atlas(7), phase: 3 }, T0 + 3_600_000, 1, new Set([4]))
  const [a, b, c] = [1, 2, 3].map(p => end.changed.get(p)!)
  assert.deepEqual([a.crowns, b.crowns], [[1], undefined], 'danh hiệu mùa: đệ nhất Công Huân')
  // thứ tự thư: hạng Công Huân (nếu có) → kết mùa → tổng kết mùa
  assert.deepEqual(a.mail.at(-3)!.a, [1, 900])
  assert.equal(a.mail.at(-3)!.k, 'honorTop')
  assert.deepEqual(b.mail.at(-3)!.a, [2, 500])
  assert.notEqual(c.mail.at(-3)?.k, 'honorTop', 'không điểm: không xếp hạng')
  for (const x of [a, b, c]) {
    assert.deepEqual([x.mail.at(-2)!.k, x.mail.at(-1)!.k], ['season', 'yearbook'])
    assert.deepEqual([x.honor, x.honorGot], [0, 0], 'mùa mới về 0')
  }
})

test('Phi Thăng Tệ: mỗi COIN_PER Công Huân kiếm được thành một đồng, đổi ở Thiên Môn Thương Điếm; hết mùa Công Huân về 0 mà tiền còn', () => {
  let s = addHonor(sect('Phi Thăng'), COIN_PER * 5 + 7)
  assert.equal(coins(s), 5, 'phần lẻ chưa thành đồng')
  const cheap = COIN_SHOP.findIndex(x => x.price <= 5)
  assert.deepEqual(apply(s, { type: 'coinBuy', i: COIN_SHOP.length }, T0), { ok: false, error: 'bad' })
  const dear = COIN_SHOP.findIndex(x => x.price > 5)
  assert.deepEqual(apply(s, { type: 'coinBuy', i: dear }, T0), { ok: false, error: 'not_enough' })
  s = addHonor(s, COIN_PER * 100)
  const r = apply(s, { type: 'coinBuy', i: 0 }, T0)
  assert.ok(r.ok && coins(r.state) === coins(s) - COIN_SHOP[0].price, 'trừ đúng giá')
  assert.ok((r.state.items.kimDuyen ?? 0) > (s.items.kimDuyen ?? 0))
  // hết mùa: Công Huân về 0, Công Huân cả đời (và Phi Thăng Tệ) còn nguyên
  const ps: Players = new Map([[1, r.state]])
  const end = endSeason(ps, freshWorld(), { atlas: atlas(7), phase: 3 }, T0, 1, new Set())
  const after = end.changed.get(1) ?? r.state
  assert.equal(after.honor ?? 0, 0)
  assert.equal(coins(after), coins(r.state), 'tiền mang sang mùa sau')
  assert.ok(cheap === -1 || cheap >= 0)
})

test('Tổng kết mùa: hết mùa ai cũng nhận thư tổng kết phần tăng trong mùa (so với mốc đầu mùa), rồi ghi mốc mới', () => {
  const s0 = {
    ...sect('Tổng Kết', 900),
    stats: { ...newGame(T0).stats, kp: 5000, hunted: 40, raided: 3, gathered: 70_000 },
  }
  const s = { ...s0, yb: { kp: 1000, hunted: 10, raided: 1, gathered: 20_000 } }
  const ps: Players = new Map([[1, s]])
  const end = endSeason(ps, freshWorld(), { atlas: atlas(7), phase: 3 }, T0, 2, new Set())
  const x = end.changed.get(1)!
  const yb = x.mail.find(m => m.k === 'yearbook')!
  assert.deepEqual(yb.a, [2, s.levels.chuDien, 900, 1, 4000, 30, 2, 50_000])
  assert.deepEqual(x.yb, { kp: 5000, hunted: 40, raided: 3, gathered: 70_000 }, 'mốc cho mùa sau')
})

test('Chính Tà Phân Tranh: phái theo chẵn lẻ mã phe, điểm mùa cộng theo phái, hết mùa người phái thắng có quà', () => {
  assert.deepEqual([campOf(2), campOf(3), campOf(-4), campOf(-5)], [0, 1, 0, 1])
  assert.deepEqual(
    campPts([
      { side: 2, name: 'A', pts: 100 },
      { side: 3, name: 'B', pts: 40 },
      { side: -5, name: 'C', pts: 30 },
    ]),
    [100, 70],
  )
  // người 2 (phái Chính, mã chẵn) giữ linh mạch có điểm mùa; người 3 (phái Tà) không
  const ps: Players = new Map([
    [2, sect('Chính')],
    [3, sect('Tà')],
  ])
  const w = { ...freshWorld(), pts: { [-2]: 500 } }
  const end = endSeason(ps, w, { atlas: atlas(7), phase: 3 }, T0, 1, new Set())
  const kinds = (p: number) => end.changed.get(p)!.mail.map(m => m.k)
  assert.ok(kinds(2).includes('camp'), 'phái thắng có thư quà')
  assert.ok(!kinds(3).includes('camp'))
})

test('hết mùa (luân hồi): giữ thành tựu đã nhận, sự kiện, Hương Hỏa, sao / tín vật, bạn bè — không nhận lại quà, không mất thứ đã bỏ công', () => {
  const s0 = sect('Giữ')
  const s: State = {
    ...s0,
    ach: { build: 3 } as State['ach'],
    vip: { ...s0.vip, pts: 5000 },
    stars: { thanhPhong: 3 },
    tokens: { thanhPhong: 7 },
    friends: [9],
    builder2: T0 + 86_400_000,
    joined: T0 - 1000,
  }
  const x = seasonEnd(s, T0, 1)
  assert.deepEqual(x.ach, s.ach)
  assert.equal(x.vip.pts, 5000)
  assert.deepEqual([x.stars, x.tokens, x.friends], [s.stars, s.tokens, s.friends])
  assert.deepEqual([x.builder2, x.joined, x.born], [s.builder2, s.joined, s.born])
  assert.deepEqual(x.fest, s.fest, 'sự kiện tân thủ không mở lại')
  assert.equal(x.rebirths, s.rebirths + 1)
})

test('Anh Linh Điện (Museum): trong mùa giới, từ tầng 16, Phi Thăng Tệ cung phụng di vật trưởng lão (3 bậc, tối đa 3 người), hết mùa di vật tan', () => {
  const base = newGame(T0, 'Anh Linh')
  const s0: State = {
    ...base,
    levels: { ...base.levels, chuDien: 16 },
    seat: { x: 10, y: 10 },
    honorAll: COIN_PER * 300,
    elders: { thanhPhong: expAt(20), thachKien: expAt(20), nhuYen: expAt(20), loiChan: expAt(20) },
  }
  assert.equal(relicError({ ...s0, seat: null }, 'thanhPhong'), 'locked', 'ngoài giới')
  assert.equal(relicError({ ...s0, levels: { ...s0.levels, chuDien: 15 } }, 'thanhPhong'), 'locked', 'chưa tới tầng 16')
  assert.equal(relicError(s0, 'vanHac'), 'locked', 'chưa thu nhận')
  const atk0 = lead(s0, 'thanhPhong', 'atk')
  let s = s0
  for (let k = 0; k < RELIC_COST.length; k++) {
    const r = apply(s, { type: 'relic', elder: 'thanhPhong' }, T0)
    assert.ok(r.ok)
    s = r.state
  }
  assert.equal(coins(s), 300 - RELIC_COST.reduce((a, b) => a + b, 0))
  assert.equal(s.relics?.thanhPhong, 3)
  assert.ok(Math.abs(lead(s, 'thanhPhong', 'atk') - atk0 - 3 * (RELIC_BONUS.atk ?? 0)) < 1e-9, 'công +5 % mỗi bậc')
  assert.equal(relicError(s, 'thanhPhong'), 'max_level')
  s = { ...s, honorAll: COIN_PER * 1000 }
  for (const e of ['thachKien', 'nhuYen'] as const)
    s = (apply(s, { type: 'relic', elder: e }, T0) as { state: State }).state
  assert.equal(relicError(s, 'loiChan'), 'limit', 'mỗi mùa tối đa 3 trưởng lão')
  assert.equal(seasonEnd(s, T0 + 1000, 1).relics, undefined, 'hết mùa di vật tan')
})

test('Lưu Danh Sử Sách: ba ngày cuối mùa chốt ứng viên theo chỉ số mùa, cả giới bình chọn (đổi phiếu được, không tự bầu); hết mùa anh kiệt có thư + quà', () => {
  // 1–3 có Công Huân mùa này; 4 là NPC (bỏ); 5 chưa làm gì. Chiến công tính phần tăng từ đầu mùa (yb)
  const ps: Players = new Map([
    [
      1,
      { ...sect('A', 300), stats: { ...sect('A').stats, kp: 900 }, yb: { kp: 100, hunted: 0, raided: 0, gathered: 0 } },
    ],
    [2, { ...sect('B', 500), stats: { ...sect('B').stats, kp: 500 } }],
    [3, sect('C', 100)],
    [4, sect('NPC', 900)],
    [5, sect('E')],
  ])
  let w: World = freshWorld()
  assert.equal(heroStep(ps, w, 40, new Set([4])), w, 'chưa tới ba ngày cuối mùa')
  w = heroStep(ps, w, 46, new Set([4]))
  assert.deepEqual(w.heroes?.picks.slice(0, 2), [
    [1, 2],
    [2, 1, 3],
  ])
  assert.equal(heroStep(ps, w, 47, new Set([4])), w, 'chốt một lần mỗi mùa')
  const vote = (pid: number, k: number, who: number, day = 46) => {
    const r = worldAct(ps, pid, { type: 'heroVote', k, pid: who }, T0, 1, { atlas: atlas(7), phase: 3, day }, w)
    if (!r.ok) return r.error
    w = r.world
    return null
  }
  assert.equal(vote(3, 1, 3), 'bad', 'không phải ứng viên hạng mục này')
  assert.equal(vote(2, 1, 2), 'bad', 'không tự bầu')
  assert.equal(vote(3, 1, 1, 40), 'locked', 'chưa mở bình chọn')
  assert.equal(vote(3, 1, 1), null)
  assert.equal(vote(3, 1, 2), null, 'đổi phiếu')
  assert.equal(vote(5, 1, 3), null)
  assert.equal(vote(1, 1, 3), null)
  assert.equal(vote(5, 0, 1), null)
  assert.deepEqual(
    heroWinners(w).map(h => h && [h.pid, h.votes]),
    [[1, 1], [3, 2], undefined, undefined],
    'Công Thần: người 3 hai phiếu; hạng mục chưa ai bầu thì bỏ trống',
  )
  const v = heroView(w, ps, 5, 46)
  assert.deepEqual(
    [v.open, v.mine, v.picks[1].map(c => [c.pid, c.n])],
    [
      true,
      [1, 3, 0, 0],
      [
        [2, 1],
        [1, 0],
        [3, 2],
      ],
    ],
  )
  // hết mùa: anh kiệt nhận thư hero + quà
  const out = endSeason(ps, w, { atlas: atlas(7), phase: 3 }, T0, 1, new Set([4]))
  const got = (pid: number) => out.changed.get(pid)!.mail.filter(m => m.k === 'hero')
  assert.deepEqual(
    got(3).map(m => [m.a, m.gift]),
    [[[1, 2], HERO_GIFT]],
  )
  assert.deepEqual(
    got(1).map(m => m.a),
    [[0, 1]],
  )
  assert.deepEqual(got(2), [])
  assert.deepEqual(
    [out.changed.get(3)!.honors, out.changed.get(1)!.honors, out.changed.get(2)!.honors],
    [[1 * 8 + 1], [1 * 8 + 0], undefined],
    'danh hiệu mùa: Công Thần mùa 1 cho người 3, Chiến Thần mùa 1 cho người 1',
  )
  assert.equal(out.world.heroes, undefined, 'mùa mới bình chọn lại')
})
