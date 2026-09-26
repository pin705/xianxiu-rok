import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DAY,
  TOWER_CHEST_COIN,
  TOWER_COIN,
  TOWER_SHOP,
  apply,
  migrate,
  newGame,
  towerBought,
  towerCoins,
  towerStar,
  type State,
} from './index.ts'

const MON = Date.UTC(2026, 0, 5, 3) // thứ Hai 10h giờ VN
const run = (s: State, a: object) => {
  const r = apply(s, a as never, s.time)
  if (!r.ok) throw new Error(r.error)
  return r.state
}
const err = (s: State, a: object) => {
  const r = apply(s, a as never, s.time)
  return r.ok ? null : r.error
}

test('Trấn Tháp Các: Tháp Lệnh theo tầng tháp và rương ngày, đổi vật phẩm có hạn mỗi tuần, tín vật trưởng lão của tuần', () => {
  let s: State = { ...newGame(MON), tower: 12 }
  assert.equal(err({ ...s, tower: 0 }, { type: 'towerBuy', i: 0 }), 'locked')
  assert.equal(towerCoins(s), 12 * TOWER_COIN)
  s = run(s, { type: 'towerChest' }) // 12 tầng: 3 phần rương
  assert.equal(towerCoins(s), 12 * TOWER_COIN + 3 * TOWER_CHEST_COIN)
  const coins = towerCoins(s)
  s = run(s, { type: 'towerBuy', i: 0 })
  assert.equal(s.items.kinhThu2k, 1)
  assert.equal(towerCoins(s), coins - TOWER_SHOP[0].price)
  assert.equal(towerBought(s, s.time)[0], 1)
  // món tín vật: trưởng lão của tuần; hết Tháp Lệnh thì không đổi được
  const star = TOWER_SHOP.findIndex(x => x.star)
  assert.equal(err(s, { type: 'towerBuy', i: star }), 'not_enough')
  const rich = { ...s, tower: 100 }
  const who = towerStar(rich.time)
  const got = run(rich, { type: 'towerBuy', i: star })
  assert.equal(got.tokens[who], (rich.tokens[who] ?? 0) + TOWER_SHOP[star].star!)
  // hạn tuần: đủ lượt thì thôi; sang tuần mới làm lại, trưởng lão của tuần đổi
  let x = { ...rich, tower: 1000 }
  for (let k = 0; k < TOWER_SHOP[0].week - 1; k++) x = run(x, { type: 'towerBuy', i: 0 })
  assert.equal(err(x, { type: 'towerBuy', i: 0 }), 'limit')
  const next = { ...x, time: x.time + 7 * DAY }
  assert.equal(towerBought(next, next.time)[0], 0)
  assert.equal(err(next, { type: 'towerBuy', i: 0 }), null)
  assert.notEqual(towerStar(next.time), towerStar(x.time))
  // lưu / nạp giữ sổ Tháp Lệnh
  assert.deepEqual(migrate(JSON.parse(JSON.stringify(x)))?.tshop, x.tshop)
})
