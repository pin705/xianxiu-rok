import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ELDER_SPECS,
  FALLEN_KEEP,
  SPECS,
  TALENT_TREE_SIZE,
  TRAIN2_LV,
  admit,
  advance,
  apply,
  count,
  expAt,
  fallenOf,
  hospital,
  lead,
  newGame,
  pveSide,
  reviveCost,
  sideOf,
  type State,
} from './index.ts'
import { defense } from './world.ts'

const T0 = Date.UTC(2026, 8, 21, 3)

test('Anh Linh Điện: tử trận vì Đan phòng đầy thì giữ hồn 3 ngày (cộng dồn, tính lại hạn), hồi sinh ngay tốn tài nguyên', () => {
  const s0: State = { ...newGame(T0, 'Hồn'), res: { linhThach: 1e6, linhThao: 1e6, linhKhoang: 1e6 } }
  const beds = hospital(s0)
  const a = admit(s0, { kiem1: beds + 30 })
  assert.deepEqual(a.dead, { kiem1: 30 })
  assert.deepEqual(a.state.fallen, { army: { kiem1: 30 }, until: T0 + FALLEN_KEEP })
  // thêm lần nữa trong hạn: cộng dồn, hạn tính lại từ lúc đó
  const later = { ...a.state, time: T0 + 3_600_000 }
  const b = admit(later, { phap1: 5 })
  assert.deepEqual(b.state.fallen, { army: { kiem1: 30, phap1: 5 }, until: T0 + 3_600_000 + FALLEN_KEEP })
  assert.equal(admit(s0, { kiem1: 1 }).state.fallen, undefined, 'còn chỗ: không ai tử trận')
  // hồi sinh: tốn REVIVE_COST chi phí tuyển, về thẳng hàng ngũ
  const s = b.state
  const r = apply(s, { type: 'revive' }, s.time)
  assert.ok(r.ok)
  assert.equal(r.state.troops.kiem1, s.troops.kiem1 + 30)
  assert.equal(r.state.troops.phap1, s.troops.phap1 + 5)
  assert.equal(r.state.fallen, undefined)
  assert.equal(r.state.res.linhThach, s.res.linhThach - reviveCost({ kiem1: 30, phap1: 5 }).linhThach)
  // hết hạn: hồn tan, không hồi sinh được
  assert.equal(count(fallenOf(s, s.time + FALLEN_KEEP + 1)), 0)
  assert.deepEqual(apply(s, { type: 'revive' }, s.time + FALLEN_KEEP + 1), { ok: false, error: 'empty' })
  assert.deepEqual(apply({ ...s, res: { linhThach: 0, linhThao: 0, linhKhoang: 0 } }, { type: 'revive' }, s.time), {
    ok: false,
    error: 'not_enough',
  })
})

test('Chuyên môn: mỗi trưởng lão ba cây riêng — cùng nút 0 nhưng Thanh Phong cộng công (Sát Phạt), Vân Hạc cộng khai mỏ (Khai Mạch)', () => {
  const s0: State = { ...newGame(T0, 'Chuyên'), elders: { thanhPhong: expAt(10), vanHac: expAt(10) } }
  assert.deepEqual(ELDER_SPECS.vanHac, ['khaiMach', 'hoThe', 'chinhPhat'])
  let s = s0
  for (const elder of ['thanhPhong', 'vanHac'] as const) {
    const r = apply(s, { type: 'talent', elder, node: 0 }, T0)
    assert.ok(r.ok)
    s = r.state
  }
  assert.equal(lead(s, 'thanhPhong', 'atk') - lead(s0, 'thanhPhong', 'atk'), SPECS.satPhat[0].v)
  assert.equal(lead(s, 'vanHac', 'gather') - lead(s0, 'vanHac', 'gather'), SPECS.khaiMach[0].v)
  assert.equal(lead(s, 'vanHac', 'atk'), lead(s0, 'vanHac', 'atk'), 'Vân Hạc không có Sát Phạt ở cây đầu')
  // talentAuto dồn đúng cây chuyên môn của người đó
  const auto = apply(s0, { type: 'talentAuto', elder: 'vanHac', tree: 2 }, T0)
  assert.ok(auto.ok)
  assert.ok(lead(auto.state, 'vanHac', 'loot') > lead(s0, 'vanHac', 'loot'), 'cây thứ ba của Vân Hạc là Chinh Phạt')
  // Trấn Thủ (cây 2 của Thạch Kiên): thủ nhà mạnh hơn khi người đó giữ nhà; Trảm Yêu (cây 1 của Diệp Cô Thành): công khi đánh PvE
  const g0: State = {
    ...s0,
    elders: { thachKien: expAt(10), diepCoThanh: expAt(10) },
    guard: 'thachKien',
    troops: { ...s0.troops, the1: 100 },
  }
  const g1 = apply(g0, { type: 'talent', elder: 'thachKien', node: TALENT_TREE_SIZE }, T0)
  assert.ok(g1.ok)
  assert.ok(defense(g1.state).troops[0].def > defense(g0).troops[0].def)
  const p1 = apply(g0, { type: 'talent', elder: 'diepCoThanh', node: 0 }, T0)
  assert.ok(p1.ok)
  const army = { kiem1: 10 }
  assert.equal(
    pveSide(p1.state, 'diepCoThanh', army).troops[0].atk,
    sideOf(p1.state, 'diepCoThanh', army).troops[0].atk * (1 + SPECS.tramYeu[0].v),
  )
})

test('Hàng tuyển thứ hai: Diễn võ trường tầng TRAIN2_LV mở hàng 2 — tuyển song song, xong thì cả hai về hàng ngũ; phù tuyển dùng cho cả hàng 2', () => {
  const base = newGame(T0, 'Song')
  const s0: State = {
    ...base,
    levels: { ...base.levels, dienVoTruong: TRAIN2_LV - 1 },
    res: { linhThach: 1e7, linhThao: 1e7, linhKhoang: 1e7 },
    items: { ...base.items, luyenBinh60: 1 },
  }
  const a = apply(s0, { type: 'train', unit: 'kiem1', n: 10 }, T0)
  assert.ok(a.ok)
  assert.deepEqual(apply(a.state, { type: 'train', unit: 'phap1', n: 10, q: 2 }, T0), { ok: false, error: 'locked' })
  const up = { ...a.state, levels: { ...a.state.levels, dienVoTruong: TRAIN2_LV } }
  assert.deepEqual(apply(up, { type: 'train', unit: 'phap1', n: 10 }, T0), { ok: false, error: 'busy' }, 'hàng 1 bận')
  const b = apply(up, { type: 'train', unit: 'phap1', n: 10, q: 2 }, T0)
  assert.ok(b.ok)
  assert.equal(b.state.train2?.unit, 'phap1')
  assert.ok(
    apply(b.state, { type: 'use', item: 'luyenBinh60', n: 1, job: 'train2' }, T0).ok,
    'phù Luyện Binh cho hàng 2',
  )
  const done = advance(b.state, T0 + 86_400_000)
  assert.equal(done.train, null)
  assert.equal(done.train2, null)
  assert.equal(done.troops.kiem1 - s0.troops.kiem1, 10)
  assert.equal(done.troops.phap1 - s0.troops.phap1, 10)
})
