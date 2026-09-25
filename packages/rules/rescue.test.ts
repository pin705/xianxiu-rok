import test from 'node:test'
import assert from 'node:assert/strict'
import { FESTS, NAN_DAY, NAN_TIME, apply, dayOf, festTokens, festWindow, newGame, type State } from './index.ts'
import { atlas, fires, freshWorld, nanTask, sitesOf, worldAct, type Players } from './world.ts'

const HOUR = 3_600_000
const STAT = {
  train: 'trained',
  hunt: 'hunted',
  gather: 'gathered',
  heal: 'healed',
  brew: 'brewed',
  speed: 'sped',
  win: 'won',
  ally: 'allied',
} as const

test('Thôn Trang Gặp Nạn: thôn cháy theo giờ trong kỳ lễ, nhận việc ở thôn đang cháy, xong trong hạn thì báo công ra Hộ Thôn Lệnh', () => {
  const a = atlas(7)
  const map = { atlas: a, phase: 1 }
  let t = Date.UTC(2026, 8, 21, 3)
  const base = newGame(t, 'Cuu')
  while (!festWindow(base, FESTS.thonTrang, t)) t += 86_400_000
  while (!fires(a, t).length) t += HOUR
  const i = fires(a, t)[0]
  const other = sitesOf(a).find(st => st.kind === 'village' && !fires(a, t).includes(st.i))!
  const st = sitesOf(a)[i]
  const levels = Object.fromEntries(Object.keys(base.levels).map(k => [k, 10])) as State['levels']
  const ps: Players = new Map([[1, { ...base, levels, seat: { x: st.x, y: st.y } }]])
  const act = (raw: object, at = t) => {
    const r = worldAct(ps, 1, raw as never, at, 1, map, freshWorld())
    if (!r.ok) return r.error
    ps.set(1, r.changed.get(1)!)
    return null
  }
  // ngoài kỳ lễ không cháy; thôn không cháy / trong mê vụ không nhận được
  assert.equal(act({ type: 'rescue', i }, t - 7 * 86_400_000), 'locked')
  assert.equal(act({ type: 'rescue', i: other.i }), 'gone')
  assert.equal(act({ type: 'rescue', i }), null)
  const q = ps.get(1)!.nan!.q!
  assert.deepEqual([q.i, q.m, q.n, q.until], [i, nanTask(a, i, t).m, nanTask(a, i, t).n, t + NAN_TIME])
  assert.equal(act({ type: 'rescue', i }), 'busy', 'mỗi lúc một việc')
  assert.deepEqual(apply(ps.get(1)!, { type: 'rescueDone' }, t + 1000), { ok: false, error: 'not_done' })
  // làm xong việc: báo công — quà, Hộ Thôn Lệnh, bỏ việc
  const s = ps.get(1)!
  const k = STAT[q.m as keyof typeof STAT]
  const worked = { ...s, stats: { ...s.stats, [k]: (s.stats[k] ?? 0) + q.n } }
  const r = apply(worked, { type: 'rescueDone' }, t + 1000)
  assert.ok(r.ok)
  assert.equal(r.state.nan?.q, undefined)
  assert.equal(r.state.stats.rescued, 1)
  assert.equal(r.state.items.hanhLuc50, (s.items.hanhLuc50 ?? 0) + 1)
  assert.equal(festTokens(r.state, 'thonTrang'), 10)
  // quá hạn: không báo công được, nhận việc mới được
  assert.deepEqual(apply(worked, { type: 'rescueDone' }, t + NAN_TIME + 1), { ok: false, error: 'gone' })
  // mỗi ngày tối đa NAN_DAY việc
  ps.set(1, { ...s, nan: { day: dayOf(t), n: NAN_DAY } })
  assert.equal(act({ type: 'rescue', i }), 'limit')
})
