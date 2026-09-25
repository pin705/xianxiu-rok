import test from 'node:test'
import assert from 'node:assert/strict'
import { ARK_CHARGE, ARK_ROUND, ARK_ROUNDS, ARK_TAKE, expAt, newGame, type State } from './index.ts'
import {
  arkAt,
  arkOf,
  arkRound,
  arkRow,
  arkStep,
  freshWorld,
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
  assert.ok(f0.units.every(u => u.at === (u.side ? 4 : 0) && u.to === 2))
  assert.deepEqual(arkRow(w, 2).live?.b, 2)
  // lệnh: đội mình tới Tiểu Trận Nam; không vào Linh Đài bên kia; cả minh chỉ trưởng lão / minh chủ
  assert.equal(act(5, { type: 'arkOrder', to: 3 }, start + 2000), null)
  assert.equal(act(5, { type: 'arkOrder', to: 0 }, start + 2000), 'bad')
  assert.equal(act(5, { type: 'arkOrder', to: 1, all: true }, start + 2000), 'locked')
  assert.equal(arkOf(w).live[0].units.find(u => u.pid === 5)!.to, 3)
  // người của minh 1 rời đi lập minh khác (thành minh chủ) — không được ra lệnh cho cả minh 1
  const spy = { ...w, allies: { ...w.allies, 1: ally(1, 'VK', { 1: 2, 3: 0 }), 3: ally(3, 'GI', { 2: 2 }) } }
  assert.deepEqual(worldAct(ps, 2, { type: 'arkOrder', to: 0, all: true } as never, start + 2000, 1, undefined, spy), {
    ok: false,
    error: 'locked',
  })
  // hiệp 1: hai bên gặp nhau ở Tiểu Trận Bắc (đường ngắn nhất tới Trung Điện) — bên mạnh thắng, bên thua về Linh Đài nghỉ
  r = arkStep(ps, w, start + ARK_ROUND + 1000, 7)
  w = r.world
  const f1 = arkOf(w).live[0]
  assert.equal(f1.round, 1)
  assert.ok(
    f1.log.some(([rd, k, sd, node]) => rd === 1 && k === 'win' && sd === 0 && node === 1),
    JSON.stringify(f1.log),
  )
  assert.equal(f1.own[1], 0, 'bên thắng chiếm Tiểu Trận Bắc')
  assert.ok(f1.pts[0] >= ARK_TAKE[1], 'chiếm lần đầu ra điểm')
  assert.ok(
    f1.units.filter(u => u.side === 1 && u.pid !== 5).every(u => u.at === 4 && u.rest === 2),
    'thua: nghỉ hiệp 2',
  )
  assert.equal(f1.units.find(u => u.pid === 5)!.at, 3, 'đội đi riêng tới Tiểu Trận Nam')
  assert.equal(f1.own[3], 1)
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
  assert.equal(arkStep(ps, w, start + ARK_ROUNDS * ARK_ROUND + 60_000, 7).world, w, 'tuần này xong rồi')
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
      { pid: 1, side: 0, at: 2, to: 2, n: [] },
      { pid: 2, side: 1, at: 4, to: 4, n: [] },
    ],
    own: [0, 0, 0, 1, 1],
    pts: [0, 0],
    taken: [[1, 2], [3]],
    charged: [[], []],
    orb: { at: 2, by: 1, n: 0 },
    log: [],
  }
  const f4 = arkRound(ps, f, 3)
  assert.equal(f4.units[0].at, 1, 'mang Châu tới Tiểu Trận Bắc (mình giữ, chưa nạp)')
  assert.equal(f4.pts[0], ARK_CHARGE + 20 + 40, 'nạp + giữ Bắc + giữ Trung Điện')
  assert.deepEqual(f4.charged[0], [1])
  assert.deepEqual(f4.orb, { at: 1, n: 1, back: 4 })
  const f5 = arkRound(ps, f4, 3)
  assert.equal(f5.orb?.at, 2, 'Châu về Trung Điện')
  assert.equal(f5.orb?.by, 1, 'đội theo lệnh đứng quay về Trung Điện thì nhặt lại Châu')
  const f6 = arkRound(ps, f5, 3)
  assert.equal(f6.units[0].at, 2, 'Tiểu Trận mình giữ đều đã nạp: người mang đứng yên')
  assert.equal(f6.charged[0].length, 1)
})
