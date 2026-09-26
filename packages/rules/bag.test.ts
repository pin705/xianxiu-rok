import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BAG_IDS,
  BAG,
  HOUR,
  addItems,
  advance,
  apOf,
  apply,
  capOf,
  metric,
  newGame,
  rate,
  useError,
  vipLevel,
  type State,
} from './index.ts'

const T0 = Date.UTC(2026, 0, 5, 3) // thứ Hai
const run = (s: State, a: object, t = s.time) => {
  const r = apply(s, a as never, t)
  if (!r.ok) throw new Error(r.error)
  return r.state
}
const withItems = (items: State['items']) => ({ ...newGame(T0), items: addItems(newGame(T0).items, items) })

test('túi đồ: phù tăng tốc rút ngắn đúng việc, phù riêng không dùng sai việc, luyện đan không rút ngắn được', () => {
  let s = run(withItems({ loBan60: 2, luyenBinh60: 1, thoiQuang5: 3 }), { type: 'upgrade', building: 'tuLinhTran' })
  s = run(s, { type: 'upgrade', building: 'chuDien' }, T0 + 20_000) // tụ linh xong (10 giây) rồi mới nâng chủ điện
  const end = s.queue[0].finishAt
  assert.equal(useError(s, { type: 'use', item: 'luyenBinh60', n: 1, job: 'build' }), 'bad')
  assert.equal(useError(s, { type: 'use', item: 'thoiQuang5', n: 1, job: 'brew' }), 'bad')
  assert.equal(useError(s, { type: 'use', item: 'thoiQuang5', n: 1, job: 'train' }), 'empty')
  assert.equal(useError(s, { type: 'use', item: 'thoiQuang5', n: 4, job: 'build' }), 'no_item')
  const t = s.time
  const r = apply(s, { type: 'use', item: 'thoiQuang5', n: 1, job: 'build' }, t)
  assert.ok(r.ok)
  if (r.ok) {
    assert.equal(r.state.queue[0]?.finishAt ?? t, Math.max(t, end - 5 * 60_000))
    assert.equal(r.state.items.thoiQuang5, 2)
  }
})

test('túi đồ: nang cộng tài nguyên (vượt kho được), phù tăng ích kéo dài chứ không cộng dồn, khiên cộng thời gian', () => {
  let s = withItems({ thachNang100k: 1, tuLinh8: 1, tuLinh24: 1, hoSon8: 2 })
  const base = rate(s, 'linhThach')
  s = run(s, { type: 'use', item: 'thachNang100k', n: 1 })
  assert.equal(s.res.linhThach, 1000 + 100_000)
  s = run(s, { type: 'use', item: 'tuLinh8', n: 1 })
  s = run(s, { type: 'use', item: 'tuLinh24', n: 1 })
  assert.equal(s.buffs.filter(b => b.key === 'prod').length, 1)
  assert.equal(s.buffs.find(b => b.key === 'prod')!.until, T0 + 32 * HOUR)
  assert.ok(rate(s, 'linhThach') > base)
  const before = s.shield // tân thủ đã có khiên: phù cộng thêm từ lúc khiên cũ hết
  s = run(s, { type: 'use', item: 'hoSon8', n: 2 })
  assert.equal(s.shield, Math.max(before, T0) + 16 * HOUR)
  // hết hạn thì buff tự gỡ đúng giờ
  assert.equal(
    advance(s, T0 + 33 * HOUR).buffs.some(b => b.key === 'prod'),
    false,
  )
})

test('túi đồ: kinh thư cho trưởng lão đã thu nhận; dữ liệu vào bẩn bị từ chối', () => {
  const s = withItems({ kinhThu2k: 1 })
  assert.equal(useError(s, { type: 'use', item: 'kinhThu2k', n: 1 }), 'locked')
  const fed = run(s, { type: 'use', item: 'kinhThu2k', n: 1, elder: 'thanhPhong' })
  assert.equal(fed.elders.thanhPhong, (s.elders.thanhPhong ?? 0) + 2000)
  for (const bad of [
    { type: 'use', item: 'constructor', n: 1 },
    { type: 'use', item: 'tuKhi', n: 1 }, // đan không dùng qua túi đồ
    { type: 'use', item: 'kinhThu2k', n: 0, elder: 'thanhPhong' },
    { type: 'use', item: 'kinhThu2k', n: 1.5, elder: 'thanhPhong' },
    { type: 'use', item: 'thoiQuang5', n: 1, job: 'nope' },
  ])
    assert.deepEqual(apply(s, bad as never, T0), { ok: false, error: 'bad' })
})

test('túi đồ: mọi vật phẩm có định nghĩa hợp lệ; cộng vào túi không làm mất đan', () => {
  for (const id of BAG_IDS) {
    const d = BAG[id]
    if (d.use === 'speed') assert.ok(d.min > 0)
    if (d.use === 'res' || d.use === 'exp' || d.use === 'pick') assert.ok(d.n > 0)
    if (d.use === 'buff' || d.use === 'shield') assert.ok(d.hours > 0)
  }
  const items = addItems({ tuKhi: 1 }, { thoiQuang5: 2 })
  assert.equal(items.tuKhi, 1)
  assert.equal(items.thoiQuang5, 2)
  assert.equal('loBan5' in items, false) // vật phẩm chưa từng có thì không chiếm chỗ trong save
})

test('túi đồ: mỗi vật phẩm thuộc đúng một họ đã khai báo', async () => {
  const { BAG_FAMILIES, bagFamily } = await import('./index.ts')
  for (const id of BAG_IDS) assert.ok(BAG_FAMILIES.includes(bagFamily(id)), id)
})

test('Hương Hỏa Lệnh: dùng thì cộng điểm Hương Hỏa ngay (có thể lên cấp)', () => {
  const s0 = newGame(Date.UTC(2026, 8, 25, 3))
  const s = { ...s0, items: { ...s0.items, huongHoa200: 2 } }
  const r = apply(s, { type: 'use', item: 'huongHoa200', n: 2 }, s.time)
  assert.ok(r.ok)
  assert.equal(r.state.vip.pts, s.vip.pts + 400)
  assert.ok(vipLevel(r.state) >= vipLevel(s))
  assert.equal(r.state.items.huongHoa200 ?? 0, 0)
})

test('Hành Lực Đan: cộng hành lực, được vượt tối đa (khi đó không tự hồi thêm tới khi tiêu xuống)', () => {
  const t = Date.UTC(2026, 8, 25, 3)
  const s0 = newGame(t)
  const s = { ...s0, items: { ...s0.items, hanhLuc50: 2 }, ap: { n: 30, at: t } }
  const r = apply(s, { type: 'use', item: 'hanhLuc50', n: 1 }, t)
  assert.ok(r.ok)
  assert.equal(apOf(r.state, t), 80)
  const over = apply(r.state, { type: 'use', item: 'hanhLuc50', n: 1 }, t)
  assert.ok(over.ok)
  assert.equal(apOf(over.state, t), 130, 'vượt AP_MAX')
  assert.equal(apOf(over.state, t + 3_600_000), 130, 'quá tối đa: không hồi thêm')
})

test('Khuếch Trận Kỳ: trận dung +10 % trong 8 giờ', () => {
  const t = Date.UTC(2026, 8, 25, 3)
  const s0 = newGame(t)
  const s = { ...s0, items: { ...s0.items, khuechTran8: 1 } }
  const before = capOf(s, 'thanhPhong')
  const r = apply(s, { type: 'use', item: 'khuechTran8', n: 1 }, t)
  assert.ok(r.ok)
  assert.equal(capOf(r.state, 'thanhPhong'), Math.floor(before * 1.1))
})

test('Sơn Hà Đồ: tan 12 ô mê vụ chưa khai gần tông môn nhất; chưa có chỗ trên bản đồ giới thì không dùng được', () => {
  const t = Date.UTC(2026, 8, 25, 3)
  const s0 = newGame(t)
  const noSeat = { ...s0, items: { ...s0.items, sonHa12: 1 } }
  assert.deepEqual(apply(noSeat, { type: 'use', item: 'sonHa12', n: 1 }, t), { ok: false, error: 'locked' })
  const s = { ...noSeat, seat: { x: 75, y: 75 } }
  const before = metric(s, 'explore')
  const r = apply(s, { type: 'use', item: 'sonHa12', n: 1 }, t)
  assert.ok(r.ok)
  assert.equal(metric(r.state, 'explore'), before + 12, 'đúng 12 ô mới')
})

test('Tuỳ Tâm Nang (Resource Choice Chest): mở ra tự chọn loại tài nguyên, vượt sức chứa kho được; chưa chọn thì không mở', () => {
  const s = withItems({ tuyTam5k: 3 })
  assert.equal(useError(s, { type: 'use', item: 'tuyTam5k', n: 1 }), 'bad', 'phải chọn loại')
  assert.equal(
    apply(s, { type: 'use', item: 'tuyTam5k', n: 1, res: 'vang' } as never, T0).ok,
    false,
    'loại lạ bị từ chối',
  )
  const t = run(s, { type: 'use', item: 'tuyTam5k', n: 2, res: 'linhThao' })
  assert.equal(t.res.linhThao, s.res.linhThao + 10_000)
  assert.deepEqual([t.res.linhThach, t.res.linhKhoang], [s.res.linhThach, s.res.linhKhoang])
  assert.equal(t.items.tuyTam5k, 1)
})
