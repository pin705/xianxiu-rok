// Tự vận hành (G8): tự chữa thương binh vừa về; rương Nhật Khóa đủ điểm chưa mở tự gửi thư khi qua ngày
import test from 'node:test'
import assert from 'node:assert/strict'
import { DAY, FESTS, admit, advance, apply, festPoints, newGame, type State } from './index.ts'

const T0 = Date.UTC(2026, 8, 27, 3)
function sect(): State {
  const s = newGame(T0, 'Tự')
  const levels = Object.fromEntries(Object.keys(s.levels).map(k => [k, 10])) as State['levels']
  return { ...s, levels, res: { linhThach: 1e6, linhThao: 1e6, linhKhoang: 1e6 } }
}

test('tự chữa: bật công tắc thì thương binh vào Đan phòng tự vào đợt chữa (Đan phòng rảnh, đủ tài nguyên); tắt thì chờ như thường', () => {
  const s0 = sect()
  const off = admit(s0, { kiem1: 50 }).state
  assert.equal(off.heal, null, 'mặc định tắt')
  const on = apply(s0, { type: 'autoHeal', on: true }, T0)
  assert.ok(on.ok && on.state.auto?.heal)
  const s1 = admit(on.state, { kiem1: 50 }).state
  assert.equal(s1.heal?.troops.kiem1, 50, 'tự vào đợt chữa')
  assert.ok(s1.res.linhThao < s0.res.linhThao, 'trả phí chữa')
  // thương binh về trong lúc đang chữa: đợt sau tự vào khi đợt này xong
  const s2 = admit(s1, { phap1: 20 }).state
  assert.equal(s2.heal?.troops.phap1 ?? 0, 0, 'đang chữa đợt cũ')
  const done = advance(s2, s1.heal!.finishAt + 1)
  assert.equal(done.heal?.troops.phap1, 20, 'đợt kế')
  // không đủ tài nguyên: không tự chữa
  const poor = admit({ ...on.state, res: { linhThach: 0, linhThao: 0, linhKhoang: 0 } }, { kiem1: 50 }).state
  assert.equal(poor.heal, null)
})

test('Nhật Khóa: qua ngày còn rương đủ điểm chưa mở thì quà gộp gửi vào thư', () => {
  const s0 = advance(sect(), T0 + 1000)
  assert.ok(s0.fest.nhatKhoa, 'Nhật Khóa mở hôm nay')
  const s1 = { ...s0, stats: { ...s0.stats, trained: s0.stats.trained + 50, hunted: (s0.stats.hunted ?? 0) + 3 } }
  assert.ok(festPoints(s1, 'nhatKhoa') >= 20)
  const next = advance(s1, T0 + DAY)
  const m = next.mail.find(x => x.k === 'dailyLeft')
  assert.ok(m, 'có thư quà hôm trước')
  const d = FESTS.nhatKhoa as { goals: number[] }
  assert.deepEqual(m!.a, [d.goals.filter(g => festPoints(s1, 'nhatKhoa') >= g).length], 'mỗi rương đủ điểm một phần')
  assert.ok(m!.gift && ((m!.gift.hallRes ?? 0) > 0 || Object.keys(m!.gift.items ?? {}).length > 0))
  // đã mở rương rồi thì không gửi lại
  const opened = { ...s1, fest: { ...s1.fest, nhatKhoa: { ...s1.fest.nhatKhoa!, got: [0, 1, 2, 3, 4] } } }
  assert.equal(
    advance(opened, T0 + DAY).mail.find(x => x.k === 'dailyLeft'),
    undefined,
  )
})
