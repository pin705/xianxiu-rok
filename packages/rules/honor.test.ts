import test from 'node:test'
import assert from 'node:assert/strict'
import { COIN_PER, COIN_SHOP, HONOR_KP, HONOR_TIERS, apply, coins, newGame, type State } from './index.ts'
import { addHonor, addKp, atlas, campOf, campPts, endSeason, freshWorld, type Players } from './world.ts'

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
