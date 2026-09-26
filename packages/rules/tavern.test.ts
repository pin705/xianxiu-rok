import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EXPERTISE,
  GOLD_PITY,
  PASSIVE_LV,
  SKILL_COST,
  SKILL_LV_POWER,
  SKILL_MAX,
  STAR_BONUS,
  ELDERS,
  expAt,
  expertOf,
  migrate,
  ngoCost,
  ngoError,
  ngoOpen,
  passive,
  sideOf,
  skillLv,
  TAVERN,
  TOKEN_SUMMON,
  addItems,
  apply,
  drawError,
  lead,
  newGame,
  tavernFree,
  truyenCost,
  truyenError,
  advance,
  festOpen,
  festWindow,
  RARITY,
  FESTS,
  DAY,
  type State,
} from './index.ts'

const T0 = Date.UTC(2026, 0, 5, 3)
const run = (s: State, a: object, t = s.time) => {
  const r = apply(s, a as never, t)
  if (!r.ok) throw new Error(r.error)
  return r.state
}
const hall2 = (): State => {
  const s = newGame(T0)
  return { ...s, levels: { ...s.levels, chuDien: 2 }, seed: 12345 }
}

test('Chiêu Hiền Đài: lượt miễn phí mở ngay, sau đó chờ đủ giờ; thiếp trong túi mở thêm; mầm ẩn chỉ trừ thiếp', () => {
  let s = hall2()
  assert.equal(tavernFree(s, 'silver'), true)
  s = run(s, { type: 'draw', kind: 'silver', n: 1 })
  assert.equal(tavernFree(s, 'silver'), false)
  assert.equal(s.tavern.silver, T0 + TAVERN.silver.free)
  assert.ok(s.tavern.last, 'server (mầm thật) ghi lại quà')
  assert.equal(drawError(s, 'silver', 1), 'no_item')
  s = run({ ...s, items: addItems(s.items, { nganDuyen: 3 }) }, { type: 'draw', kind: 'silver', n: 3 })
  assert.equal(s.items.nganDuyen, 0)
  // client: mầm 0 — trừ thiếp, không tự bịa quà
  const c = run(
    { ...s, seed: 0, items: addItems(s.items, { nganDuyen: 1 }), tavern: { ...s.tavern, last: null } },
    {
      type: 'draw',
      kind: 'silver',
      n: 1,
    },
  )
  assert.equal(c.items.nganDuyen, 0)
  assert.equal(c.tavern.last, null)
  // chưa đủ tầng thì khoá
  assert.equal(drawError(newGame(T0), 'silver', 1), 'locked')
})

test('Chiêu Hiền Đài: thiếp vàng có bảo hiểm — mở đủ 10 lần chắc chắn có 10 tín vật một trưởng lão', () => {
  let s = { ...hall2(), items: addItems(hall2().items, { kimDuyen: GOLD_PITY }) }
  const before = Object.values(s.tokens).reduce((a, b) => a + (b ?? 0), 0)
  s = run(s, { type: 'draw', kind: 'gold', n: GOLD_PITY })
  const after = Object.values(s.tokens).reduce((a, b) => a + (b ?? 0), 0)
  assert.ok(after - before >= TOKEN_SUMMON)
  assert.equal(s.tavern.pity, 0) // lần 10 (lượt miễn phí + 9 thiếp) là lần bảo hiểm, đếm lại từ 0
  assert.equal(s.items.kimDuyen, 1)
})

test('tín vật: đủ 10 thu nhận trưởng lão chưa có; dư thì nâng sao, sao cộng công và sinh lực cho đội người đó dẫn', () => {
  let s: State = { ...hall2(), tokens: { hanBang: 25, thanhPhong: 15 } }
  s = run(s, { type: 'recruit', elder: 'hanBang' })
  assert.equal(s.elders.hanBang, 0)
  assert.equal(s.tokens.hanBang, 15)
  assert.deepEqual(apply(s, { type: 'recruit', elder: 'hanBang' }, s.time), { ok: false, error: 'claimed' })
  const atk = lead(s, 'thanhPhong', 'atk')
  s = run(s, { type: 'star', elder: 'thanhPhong' })
  assert.equal(s.stars.thanhPhong, 2)
  assert.equal(s.tokens.thanhPhong, 5)
  assert.equal(lead(s, 'thanhPhong', 'atk'), atk + STAR_BONUS.atk!)
  assert.deepEqual(apply(s, { type: 'star', elder: 'thanhPhong' }, s.time), { ok: false, error: 'not_enough' })
  assert.deepEqual(apply(s, { type: 'star', elder: 'macSau' }, s.time), { ok: false, error: 'locked' })
})

test('Hoàn Nguyên Phù: mọi môn về tầng 1, trả đủ tín vật đã ngộ; chưa ngộ, không có phù thì không', () => {
  const n = 1 + ELDERS.thanhPhong.passives.length
  const skl = [3, 2, ...Array(n - 2).fill(1)]
  let s: State = { ...hall2(), tokens: { thanhPhong: 3 }, items: { hoanNguyen: 1 }, skl: { thanhPhong: skl } }
  s = run(s, { type: 'unngo', elder: 'thanhPhong' })
  assert.equal(s.tokens.thanhPhong, 3 + SKILL_COST[0] + SKILL_COST[1] + SKILL_COST[2], 'ba lần ngộ được trả')
  assert.deepEqual(skillLv(s, 'thanhPhong'), Array(n).fill(1))
  assert.equal(s.items.hoanNguyen, 0)
  assert.deepEqual(apply(s, { type: 'unngo', elder: 'thanhPhong' }, s.time), { ok: false, error: 'empty' })
  const again = { ...s, skl: { thanhPhong: skl } }
  assert.deepEqual(apply(again, { type: 'unngo', elder: 'thanhPhong' }, s.time), { ok: false, error: 'no_item' })
})

test('Vạn Năng Tín Vật: đổi 1 : 1 thành tín vật của trưởng lão cùng phẩm đã thu nhận; khác phẩm, chưa thu nhận, thiếu thì không', () => {
  let s: State = { ...hall2(), items: { vanNang2: 12, vanNang3: 1 } }
  const uni = (st: State, item: string, elder: string, n: number) =>
    apply(st, { type: 'uni', item, elder, n } as never, st.time)
  assert.equal(RARITY.thanhPhong, 2)
  s = run(s, { type: 'uni', item: 'vanNang2', elder: 'thanhPhong', n: 10 })
  assert.deepEqual([s.tokens.thanhPhong, s.items.vanNang2], [10, 2])
  assert.deepEqual(uni(s, 'vanNang3', 'thanhPhong', 1), { ok: false, error: 'bad' }, 'khác phẩm')
  assert.deepEqual(
    uni(s, 'vanNang3', 'hanBang', 1),
    { ok: false, error: 'locked' },
    'chưa thu nhận: không dùng để thu nhận',
  )
  assert.deepEqual(uni(s, 'vanNang2', 'thanhPhong', 3), { ok: false, error: 'not_enough' })
  assert.deepEqual(uni(s, 'hongBao', 'thanhPhong', 1), { ok: false, error: 'bad' }, 'không phải tín vật')
  assert.equal(apply(s, { type: 'use', item: 'vanNang2', n: 1 } as never, s.time).ok, false, 'không dùng thẳng từ túi')
})

test('thành tựu: đạt bậc thì nhận quà bậc đó, lần lượt từng bậc, hết bậc thì thôi', async () => {
  const { ACHS, ACH_REWARDS, achReady } = await import('./index.ts')
  let s: State = { ...hall2(), levels: { ...hall2().levels, chuDien: 11 } }
  assert.equal(achReady(s, 'hall'), true) // tầng 11 ≥ 5 và ≥ 10
  s = run(s, { type: 'ach', id: 'hall' })
  assert.equal(s.ach.hall, 1)
  assert.equal(s.items.nganDuyen, ACH_REWARDS[0].items!.nganDuyen)
  s = run(s, { type: 'ach', id: 'hall' })
  assert.equal(s.ach.hall, 2)
  assert.deepEqual(apply(s, { type: 'ach', id: 'hall' }, s.time), { ok: false, error: 'not_done' }) // bậc 3 cần tầng 15
  const done: State = { ...s, ach: { ...s.ach, hall: ACHS.hall.tiers.length } }
  assert.deepEqual(apply(done, { type: 'ach', id: 'hall' }, s.time), { ok: false, error: 'max_level' })
})

test('Ngộ công pháp: tín vật riêng, giá theo số lần đã ngộ, mầm server chọn một môn đã mở lên tầng; ba môn tầng cuối có Bản Mệnh Thần Thông', () => {
  // Thanh Phong cấp 1: chỉ công pháp mở (tâm pháp mở ở cấp 5, 12)
  let s: State = { ...hall2(), elders: { thanhPhong: 0 }, tokens: { thanhPhong: 500 } }
  assert.deepEqual(ngoOpen(s, 'thanhPhong'), [0])
  assert.equal(ngoError(s, 'thachKien'), 'locked', 'chưa thu nhận')
  assert.equal(ngoCost(s, 'thanhPhong'), SKILL_COST[0])
  const skill0 = lead(s, 'thanhPhong', 'skill')
  // client (mầm 0): không đoán, không trừ tín vật — chờ server
  assert.equal(run({ ...s, seed: 0 }, { type: 'ngo', elder: 'thanhPhong' }).tokens.thanhPhong, 500)
  s = run(s, { type: 'ngo', elder: 'thanhPhong' })
  assert.deepEqual(skillLv(s, 'thanhPhong'), [2, 1, 1])
  assert.equal(s.tokens.thanhPhong, 500 - SKILL_COST[0])
  assert.equal(ngoCost(s, 'thanhPhong'), SKILL_COST[1])
  assert.ok(Math.abs(lead(s, 'thanhPhong', 'skill') - skill0 - SKILL_LV_POWER) < 1e-9, 'công pháp tầng 2: sức +8%')
  // lên tầng cuối: hết môn ngộ được (tâm pháp còn khoá)
  for (let k = 0; k < SKILL_MAX - 2; k++) s = run(s, { type: 'ngo', elder: 'thanhPhong' })
  assert.deepEqual(skillLv(s, 'thanhPhong'), [5, 1, 1])
  assert.equal(ngoError(s, 'thanhPhong'), 'max_level')
  // cấp 12: hai tâm pháp mở — mầm khác nhau chọn môn khác nhau, tâm pháp mạnh theo tầng
  s = { ...s, elders: { thanhPhong: expAt(12) } }
  assert.deepEqual(ngoOpen(s, 'thanhPhong'), [1, 2])
  const picks = new Set(
    [1, 2, 3, 4, 5, 6].map(k =>
      skillLv(run({ ...s, seed: k * 0x2fffffff }, { type: 'ngo', elder: 'thanhPhong' }), 'thanhPhong').join(),
    ),
  )
  assert.deepEqual([...picks].sort(), ['5,1,2', '5,2,1'])
  const p0 = passive(s, 'thanhPhong', ELDERS.thanhPhong.passives[0].key)
  const x = { ...s, skl: { thanhPhong: [5, 3, 1] } }
  assert.ok(Math.abs(passive(x, 'thanhPhong', ELDERS.thanhPhong.passives[0].key) - p0 * (1 + 2 * PASSIVE_LV)) < 1e-9)
  // ba môn tầng cuối: Bản Mệnh Thần Thông cộng vào đội người đó dẫn; hết đường ngộ
  const max = { ...s, skl: { thanhPhong: [5, 5, 5] } }
  assert.ok(expertOf(max, 'thanhPhong') && !expertOf(x, 'thanhPhong'))
  assert.equal(ngoError(max, 'thanhPhong'), 'max_level')
  assert.ok(Math.abs(lead(max, 'thanhPhong', 'def') - lead(x, 'thanhPhong', 'def') - (EXPERTISE.def ?? 0)) < 1e-9)
  assert.ok(
    (sideOf(max, 'thanhPhong', { kiem1: 100 }).skill?.v ?? 0) > (sideOf(x, 'thanhPhong', { kiem1: 100 }).skill?.v ?? 0),
  )
  // người có ba tâm pháp (Vân Hạc): bốn môn như RoK, 16 lần ngộ (giá cuối SKILL_COST[15]); thần thông cần đủ bốn môn
  const van: State = { ...s, elders: { vanHac: expAt(40) }, skl: { vanHac: [5, 5, 5, 4] } }
  assert.equal(skillLv({ ...s, elders: { vanHac: 0 } }, 'vanHac').length, 4)
  assert.equal(ngoCost(van, 'vanHac'), SKILL_COST[15])
  assert.ok(!expertOf(van, 'vanHac') && expertOf({ ...van, skl: { vanHac: [5, 5, 5, 5] } }, 'vanHac'))
  assert.ok(Number.isFinite(lead({ ...van, elders: { vanHac: expAt(40) } }, 'vanHac', 'gather')))
  // lưu / nạp giữ tầng; save hỏng bị từ chối
  assert.deepEqual(migrate(JSON.parse(JSON.stringify(max)))?.skl, { thanhPhong: [5, 5, 5] })
  assert.equal(migrate({ ...JSON.parse(JSON.stringify(max)), skl: { thanhPhong: [5, 5] } }), null)
})

test('Truyền công (Commander Swap): trong Truyền Công Đại Hội đổi tầng công pháp giữa hai trưởng lão cùng phẩm, giá theo chênh lệch tầng', () => {
  let t = T0
  while (festWindow({}, FESTS.truyenCong, t)) t += DAY
  while (!festWindow({}, FESTS.truyenCong, t)) t += DAY // ngày đầu lượt lễ kế tiếp
  const base = newGame(T0)
  const at = (time: number, n: number): State =>
    advance(
      {
        ...base,
        levels: { ...base.levels, chuDien: 10 },
        elders: { thanhPhong: 0, thachKien: 0, loiChan: 0 },
        skl: { thanhPhong: [5, 3, 1] },
        items: addItems(base.items, { truyenCong: n }),
      },
      time,
    )
  assert.equal(truyenError(at(t - DAY, 99), 'thanhPhong', 'thachKien'), 'locked', 'ngoài lễ')
  let s = at(t, 20)
  assert.ok(festOpen(s, 'truyenCong', t))
  assert.equal(truyenCost(s, 'thanhPhong', 'thachKien'), 2 + 4 * 6, 'chênh sáu tầng')
  assert.equal(truyenError(s, 'thanhPhong', 'loiChan'), 'bad', 'khác phẩm')
  assert.equal(truyenError(s, 'thanhPhong', 'thachKien'), 'not_enough')
  s = run(at(t, 30), { type: 'truyen', a: 'thanhPhong', b: 'thachKien' })
  assert.deepEqual(
    [skillLv(s, 'thanhPhong'), skillLv(s, 'thachKien')],
    [
      [1, 1, 1],
      [5, 3, 1],
    ],
  )
  assert.equal(s.items.truyenCong, 4)
  assert.equal(truyenError(s, 'thachKien', 'nhuYen'), 'locked', 'chưa thu nhận')
})
