// Phần thuần của lớp mạng client: gập thao tác đoán trước, chọn mẫu đồng hồ
import test from 'node:test'
import assert from 'node:assert/strict'
import { ELDER_IDS, expAt, newGame, type State } from '@rok/rules'
import { view } from '@rok/protocol'
import { fold, offsetOf, withReports, type Pending } from './src/sync.ts'
import { openingReport, skillDemo } from './src/opening.ts'

const base = (): State => withReports(view({ ...newGame(0, 'Thử'), seed: 12345 }), [])

test('gập: thao tác đoán trước áp tại lúc bấm, theo thứ tự; thao tác chờ server (trận) không đoán', () => {
  const s = base()
  const pending: Pending[] = [
    { a: { type: 'upgrade', building: 'tuLinhTran' }, at: 1000, predicted: true },
    { a: { type: 'realm', i: 0, elder: 'thanhPhong', army: { kiem1: 1 } }, at: 1500, predicted: false },
    { a: { type: 'upgrade', building: 'linhDien' }, at: 2000, predicted: true }, // tạp dịch đang bận: bỏ qua
  ]
  const f = fold(s, pending)
  assert.deepEqual(
    f.queue.map(j => j.building),
    ['tuLinhTran'],
  )
  assert.equal(f.queue[0].startAt, 1000, 'áp tại lúc người chơi bấm')
  assert.equal(f.reports.length, 0, 'không bịa trận')
  assert.equal(fold(s, []), s, 'không có gì chờ: giữ nguyên tham chiếu')
})

test('state gửi xuống không có mầm: client không bao giờ tự giải trận (mầm 0 = ẩn)', () => {
  assert.equal(base().seed, 0)
})

test('đồng hồ: lấy độ lệch của mẫu ping có vòng đi-về ngắn nhất', () => {
  assert.equal(
    offsetOf([
      { rtt: 80, off: 40 },
      { rtt: 12, off: 5 },
      { rtt: 30, off: 9 },
    ]),
    5,
  )
})

test('Diễn thử công pháp: trận ảo đủ dài để mọi trưởng lão tung công pháp, không đổi state', () => {
  const s0 = newGame(Date.UTC(2026, 8, 21))
  const s: State = { ...s0, elders: Object.fromEntries(ELDER_IDS.map(e => [e, expAt(20)])) }
  for (const e of ELDER_IDS)
    assert.ok(
      skillDemo(s, e).fights[0].rounds.some(r => r.cast[0]),
      e,
    )
  assert.equal(openingReport(s0).win, true)
})
