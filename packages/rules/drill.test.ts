import test from 'node:test'
import assert from 'node:assert/strict'
import { DAY, DRILL_EVERY, DRILL_GIFTS, apply, drillFoe, expAt, newGame, type State } from './index.ts'
import { might } from './combat.ts'

const T0 = Date.UTC(2026, 8, 23, 3)
function sect(): State {
  const s = newGame(T0, 'Luận Võ')
  const levels = Object.fromEntries(Object.keys(s.levels).map(k => [k, 10])) as State['levels']
  return { ...s, levels, seed: 12345, troops: { ...s.troops, kiem3: 1000 }, elders: { thanhPhong: expAt(20) } }
}
const run = (s: State, a: object) => apply(s, a as never, s.time)

test('Luận Võ Liên Hoàn: đội ảo đấu liên tiếp giáo đầu mạnh dần, quân không hồi; cứ 3 thắng chọn công pháp cho giáo đầu; mốc quà; thua hết phiên', () => {
  let s = sect()
  assert.deepEqual(
    run(
      { ...s, levels: { ...s.levels, chuDien: 5 } },
      { type: 'drillStart', elder: 'thanhPhong', army: { kiem3: 1000 } },
    ),
    {
      ok: false,
      error: 'locked',
    },
  )
  const r0 = run(s, { type: 'drillStart', elder: 'thanhPhong', army: { kiem3: 1000 } })
  assert.ok(r0.ok)
  s = r0.state
  assert.deepEqual(
    run(s, { type: 'drillStart', elder: 'thanhPhong', army: { kiem3: 1 } }),
    { ok: false, error: 'claimed' },
    'mỗi ngày một phiên',
  )
  const f0 = might(drillFoe(s, s.drill!))
  let fights = 0
  while (!s.drill!.over && fights < 60) {
    if (s.drill!.offer) {
      assert.equal(new Set(s.drill!.offer).size, 3, 'ba lựa chọn khác nhau')
      assert.deepEqual(run(s, { type: 'drillFight' }), { ok: false, error: 'busy' }, 'chọn công pháp trước')
      const picked = run(s, { type: 'drillPick', i: 0 })
      assert.ok(picked.ok)
      s = picked.state
      continue
    }
    const before = s.drill!.army.kiem3 ?? 0
    const r = run(s, { type: 'drillFight' })
    assert.ok(r.ok)
    s = r.state
    fights++
    assert.ok((s.drill!.army.kiem3 ?? 0) <= before, 'quân không hồi giữa các trận')
    assert.equal(s.reports.at(-1)!.kind, 'drill')
  }
  const d = s.drill!
  assert.ok(d.over, 'cuối cùng cũng thua')
  assert.ok(d.wins >= DRILL_EVERY, `trận đầu dễ: thắng ${d.wins}`)
  assert.equal(d.mods.length, Math.floor(d.wins / DRILL_EVERY) - (d.offer ? 1 : 0), 'mỗi 3 thắng một công pháp')
  assert.ok(might(drillFoe(s, d)) > f0, 'giáo đầu mạnh dần')
  assert.equal(d.got, DRILL_GIFTS.filter(g => d.wins >= g.n).length, 'mốc quà đã nhận')
  assert.equal(s.troops.kiem3, 1000, 'đội ảo: quân thật không mất')
  assert.deepEqual(run(s, { type: 'drillFight' }), { ok: false, error: 'locked' }, 'thua là hết phiên hôm nay')
  assert.ok(
    run({ ...s, time: s.time + DAY }, { type: 'drillStart', elder: 'thanhPhong', army: { kiem3: 1000 } }).ok,
    'ngày mới: phiên mới',
  )
})
