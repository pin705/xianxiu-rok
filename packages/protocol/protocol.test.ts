import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BEASTS,
  ELDER_IDS,
  IDS,
  TECH_IDS,
  UNITS,
  advance,
  apply,
  count,
  newGame,
  type Action,
  type State,
} from '@rok/rules'
import { diff, merge, view } from './index.ts'

// Lịch sử state thật: bot chơi 12 ngày (xây, tuyển, nghiên cứu, hành quân, bí cảnh) — như server sẽ thấy
function history() {
  let s = newGame(0, 'Thử Tông')
  const out: State[] = [s]
  const push = (next: State) => next !== s && out.push((s = next))
  const tryDo = (a: Action) => {
    const r = apply({ ...s, seed: (s.seed * 7 + 13) >>> 0 || 1 }, a, s.time) // server bơm mầm mới trước mỗi thao tác
    if (r.ok) push(r.state)
    return r.ok
  }
  for (let d = 0; d < 12; d++)
    for (const h of [8, 12, 18, 22]) {
      push(advance(s, d * 86_400_000 + h * 3_600_000))
      for (let g = 0; g < 30; g++) {
        let acted = tryDo({ type: 'claim' })
        for (const id of IDS)
          if (tryDo({ type: 'upgrade', building: id })) {
            acted = true
            break
          }
        if (!s.train && s.levels.dienVoTruong)
          for (const u of ['kiem2', 'phap2', 'the2', 'kiem1', 'phap1', 'the1'] as const)
            if (tryDo({ type: 'train', unit: u, n: 40 })) {
              acted = true
              break
            }
        if (count(s.wounded) && tryDo({ type: 'heal' })) acted = true
        for (const t of TECH_IDS)
          if (tryDo({ type: 'study', tech: t })) {
            acted = true
            break
          }
        const army = Object.fromEntries(UNITS.filter(u => s.troops[u] > 0).map(u => [u, s.troops[u]]))
        for (const e of ELDER_IDS)
          for (let i = BEASTS.length - 1; i >= 0; i--)
            if (tryDo({ type: 'march', target: { kind: 'beast', i }, elder: e, army })) {
              acted = true
              break
            }
        for (let i = 0; i < 3; i++) if (tryDo({ type: 'realm', i, elder: 'thanhPhong', army })) acted = true
        if (!acted) break
      }
    }
  return out
}

test('patch: gộp vào view cũ ra đúng view mới qua cả lịch sử; không bao giờ lộ mầm hay chiến báo', () => {
  const h = history()
  assert.ok(h.length > 100 && h.at(-1)!.reports.length > 0, 'lịch sử đủ dài, có trận')
  let client = view(h[0])
  let bytes = 0
  for (let i = 1; i < h.length; i++) {
    const p = diff(h[i - 1], h[i])
    bytes += JSON.stringify(p).length
    client = merge(client, p)
    assert.deepEqual(client, view(h[i]), `bước ${i}`)
    const wire = JSON.stringify(client)
    assert.ok(!/"seed":[1-9]/.test(wire), `bước ${i}: lộ mầm`)
    assert.ok(!('reports' in client), 'chiến báo không nằm trong state gửi đi')
  }
  assert.ok(bytes / (h.length - 1) < 1500, `patch trung bình ${Math.round(bytes / (h.length - 1))} B`)
})

test('patch: phần không đổi không gửi, phần đổi giữ nguyên tham chiếu phía server', () => {
  const s = newGame(0)
  const r = apply(s, { type: 'upgrade', building: 'tuLinhTran' }, 1000)
  assert.ok(r.ok)
  const p = diff(s, r.state)
  assert.deepEqual(Object.keys(p).sort(), ['carry', 'daily', 'queue', 'res', 'time', 'weekly'])
  assert.deepEqual(diff(s, s), {})
})
