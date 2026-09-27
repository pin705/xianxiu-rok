// Các luật mùa (Thiên Mệnh Chọn Luật) có cơ chế riêng ngoài tăng ích
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ELITE,
  ELITE_COST,
  ELITE_MAX,
  FOLIO_COOL,
  FOLIO_HONOR,
  PUPPET_COST,
  PUPPET_MAX,
  RULE_FOUR,
  TREATY_GIFT,
  apply,
  bonus,
  expAt,
  newGame,
  sideOf,
  wallHit,
  wallHp,
  type State,
} from './index.ts'
import { atlas } from './atlas.ts'
import { counterSides, defense, endSeason, fourOf, freshWorld, rallyCap, worldAct, type Players } from './world.ts'

const T0 = Date.UTC(2026, 8, 26, 3)
const rule = (key: string) => ({ key, v: 1, until: 0, src: 'rule' }) as State['buffs'][number]
function sect(honor = 0, rules: string[] = ['folio']): State {
  const s = newGame(T0, 'Binh')
  return { ...s, honor, buffs: rules.map(rule) }
}
const run = (s: State, a: object, at = s.time) => apply(s, a as never, at)

test('Binh Thư Phong Vân: ba ô Công / Thủ / Mưu, trang mở theo Công Huân mùa; ô trống cài ngay, thay trang chờ 4 giờ; chỉ mùa có luật', () => {
  assert.deepEqual(
    run(sect(0, []), { type: 'folio', slot: 0, page: 0 }),
    { ok: false, error: 'locked' },
    'mùa không có luật',
  )
  assert.deepEqual(
    run(sect(), { type: 'folio', slot: 0, page: 1 }),
    { ok: false, error: 'locked' },
    'chưa đủ Công Huân',
  )
  assert.deepEqual(run(sect(), { type: 'folio', slot: 3, page: 0 }), { ok: false, error: 'bad' })
  const s0 = sect(FOLIO_HONOR[1])
  const a = run(s0, { type: 'folio', slot: 0, page: 0 })
  assert.ok(a.ok)
  const s1 = a.state
  assert.equal(bonus(s1, 'atk') - bonus(s0, 'atk'), 0.04, 'Phá Phủ Trầm Chu: công +4 %')
  // ô trống khác cài ngay; thay trang ô vừa đổi phải chờ
  const b = run(s1, { type: 'folio', slot: 2, page: 1 })
  assert.ok(b.ok && bonus(b.state, 'loot') - bonus(s1, 'loot') === 0.15)
  assert.deepEqual(run(b.state, { type: 'folio', slot: 0, page: 1 }), { ok: false, error: 'cooldown' })
  const c = run(b.state, { type: 'folio', slot: 0, page: 1 }, T0 + FOLIO_COOL)
  assert.ok(
    c.ok && bonus(c.state, 'atk.kiem') - bonus(s0, 'atk.kiem') === 0.08 && bonus(c.state, 'atk') === bonus(s0, 'atk'),
  )
  // hết luật (mùa sau luật khác): trang còn đó nhưng không tính
  assert.equal(bonus({ ...c.state, buffs: [] }, 'atk.kiem'), bonus({ ...s0, buffs: [] }, 'atk.kiem'))
})

test('Binh Thư — Vây Ngụy Cứu Triệu (phản kết trận): đoàn đánh kẻ vừa đánh một người trong đoàn thì đội cài trang thêm công', () => {
  const side = { troops: [{ type: 'kiem' as const, tier: 1 as const, n: 100, atk: 10, def: 5, hp: 30 }] }
  const s = { ...sect(FOLIO_HONOR[2]), folio: { p: [null, null, 2], at: [0, 0, T0] } }
  const hit = { ...sect(), foes: [{ pid: 9, name: 'Ma', at: T0 - 1000 }] }
  const march = {} as never
  const [mine, mate] = counterSides(
    [
      [1, s, march],
      [2, hit, march],
    ],
    [side, side],
    9,
    T0,
  )
  assert.ok(Math.abs(mine.troops[0].atk - 11) < 1e-9, 'đội cài trang: công +10 %')
  assert.equal(mate.troops[0].atk, 10, 'đội không cài trang giữ nguyên')
  assert.equal(counterSides([[1, s, march]], [side], 9, T0)[0], side, 'không ai trong đoàn bị kẻ đó đánh')
})

test('Cơ Quan Khôi Lỗi: Luyện Khí Phòng chế khôi lỗi (giá, kho theo tầng); đội đi cướp tự mang theo, bớt sức Hộ Sơn Đại Trận, phá trận mạnh hơn', () => {
  const levels = (n: number) =>
    Object.fromEntries(Object.keys(newGame(T0, 'x').levels).map(k => [k, n])) as State['levels']
  const rich = { linhThach: 1e6, linhThao: 1e6, linhKhoang: 1e6 }
  const s0: State = { ...sect(0, ['puppet']), levels: levels(10), res: rich }
  assert.deepEqual(
    run({ ...s0, buffs: [] }, { type: 'puppet', n: 1 }),
    { ok: false, error: 'locked' },
    'mùa không có luật',
  )
  assert.deepEqual(run(s0, { type: 'puppet', n: 51 }), { ok: false, error: 'full' }, 'kho 5 × tầng Luyện Khí Phòng')
  const made = run(s0, { type: 'puppet', n: 25 })
  assert.ok(made.ok)
  assert.equal(made.state.puppet, 25)
  assert.equal(made.state.res.linhKhoang, rich.linhKhoang - 25 * PUPPET_COST.linhKhoang)
  // khôi lỗi bớt sức Hộ Sơn Đại Trận (thủ, máu) và phá trận lực mạnh hơn
  const d: State = { ...sect(0, []), levels: levels(10), troops: { ...s0.troops, the1: 100 }, shield: 0 }
  const whole = defense(d).troops[0],
    cracked = defense(d, 0.5).troops[0]
  assert.ok(cracked.def < whole.def && cracked.hp < whole.hp)
  const hit = (k: number) => wallHp(d, T0) - wallHp(wallHit(d, T0, k), T0)
  assert.ok(hit(2) > hit(1) * 1.9)
  // đội đi cướp tự mang theo tối đa PUPPET_MAX con
  const att: State = {
    ...made.state,
    shield: 0,
    troops: { ...made.state.troops, kiem3: 500 },
    elders: { thanhPhong: expAt(20) },
  }
  const ps: Players = new Map([
    [1, att],
    [2, d],
  ])
  const r = worldAct(ps, 1, { type: 'raid', pid: 2, elder: 'thanhPhong', army: { kiem3: 500 } }, T0, 7)
  assert.ok(r.ok)
  const me = r.changed.get(1)!
  assert.equal(me.marches.at(-1)!.pup, PUPPET_MAX)
  assert.equal(me.puppet, 25 - PUPPET_MAX)
})

test('Tinh Binh Luận Kiếm: Diễn Võ Trường mở bậc 5 thì mỗi hệ luyện tinh binh 5 cấp; chỉ đệ tử bậc 5 của hệ đó mạnh thêm, chỉ mùa có luật', () => {
  const levels = (n: number) =>
    Object.fromEntries(Object.keys(newGame(T0, 'x').levels).map(k => [k, n])) as State['levels']
  const rich = { linhThach: 5e6, linhThao: 5e6, linhKhoang: 5e6 }
  const low: State = { ...sect(0, ['elite']), levels: levels(20), res: rich }
  assert.deepEqual(run(low, { type: 'elite', unit: 'kiem' }), { ok: false, error: 'locked' }, 'chưa mở bậc 5')
  const s0: State = { ...low, levels: levels(25) }
  assert.deepEqual(
    run({ ...s0, buffs: [] }, { type: 'elite', unit: 'kiem' }),
    { ok: false, error: 'locked' },
    'mùa không có luật',
  )
  let s = s0
  for (let k = 0; k < ELITE_MAX; k++) {
    const r = run(s, { type: 'elite', unit: 'kiem' })
    assert.ok(r.ok)
    s = r.state
  }
  assert.equal(s.elite?.kiem, ELITE_MAX)
  assert.equal(s.res.linhThach, rich.linhThach - ELITE_COST * 15, 'giá 1 + 2 + … + 5 lần')
  assert.deepEqual(run(s, { type: 'elite', unit: 'kiem' }), { ok: false, error: 'max_level' })
  const atk = (x: State, unit: 'kiem5' | 'kiem4') => sideOf(x, null, { [unit]: 100 }).troops[0].atk
  assert.ok(Math.abs(atk(s, 'kiem5') / atk(s0, 'kiem5') - (1 + ELITE.kiem.atk * ELITE_MAX)) < 1e-9, 'bậc 5 mạnh thêm')
  assert.equal(atk(s, 'kiem4'), atk(s0, 'kiem4'), 'bậc 4 giữ nguyên')
  assert.equal(atk({ ...s, buffs: [] }, 'kiem5'), atk({ ...s0, buffs: [] }, 'kiem5'), 'hết luật: như thường')
})

test('Tứ Tượng Tranh Hùng: bốn phe theo mã bên (cùng chẵn lẻ với Chính / Tà), điểm mùa cộng theo phe; hết mùa phe đầu — cả người 0 điểm — nhận quà', () => {
  assert.deepEqual([1, 2, 3, 4, -1, -2, -6].map(fourOf), [1, 2, 3, 0, 3, 2, 2])
  const ps: Players = new Map([1, 2, 3, 6].map(p => [p, { ...newGame(T0, `T${p}`) }]))
  const w = { ...freshWorld(), rule: RULE_FOUR, pts: { [-1]: 100, [-2]: 300, [-3]: 50 } }
  const out = endSeason(ps, w, { atlas: atlas(7), phase: 3 }, T0, 1, new Set())
  const got = (p: number) => out.changed.get(p)!.mail.find(m => m.k === 'four')?.a
  assert.deepEqual(got(2), [2, 300], 'Chu Tước thắng')
  assert.deepEqual(got(6), [2, 300], 'cùng phe, chưa có điểm vẫn nhận')
  assert.equal(got(1), undefined)
  // mùa không có luật: không ai nhận
  const plain = endSeason(ps, { ...w, rule: undefined }, { atlas: atlas(7), phase: 3 }, T0, 1, new Set())
  assert.equal(
    plain.changed.get(2)!.mail.find(m => m.k === 'four'),
    undefined,
  )
})

test('Hiệp Ước Thiên Môn: Giới Chủ ký với tối đa 2 minh đang có minh ước; hết mùa minh ký vẫn phi thăng thì người trong minh hiệp ước được chia phần', () => {
  const ps: Players = new Map([1, 2, 3, 4].map(p => [p, { ...newGame(T0, `T${p}`) }]))
  const ally = (id: number, members: Record<number, number>, naps: number[]) => ({
    id,
    name: `M${id}`,
    tag: `M${id}`,
    members,
    notice: '',
    at: T0,
    helps: [],
    naps,
  })
  let w = {
    ...freshWorld(),
    allies: { 1: ally(1, { 1: 2 }, [2]), 2: ally(2, { 2: 2, 3: 0 }, [1]), 3: ally(3, { 4: 2 }, []) },
    pts: { 1: 500, 2: 100, 3: 50 },
  } as never as ReturnType<typeof freshWorld>
  const map = { atlas: atlas(7), phase: 3 as const }
  const act = (pid: number, raw: object) => {
    const r = worldAct(ps, pid, raw as never, T0, 1, map, w)
    if (!r.ok) return r.error
    w = r.world
    return null
  }
  assert.equal(act(2, { type: 'treaty', with: [1] }), 'locked', 'không phải Giới Chủ')
  assert.equal(act(1, { type: 'treaty', with: [3] }), 'bad', 'chỉ minh đang có minh ước')
  assert.equal(act(1, { type: 'treaty', with: [2, 3, 4] }), 'bad', 'tối đa 2')
  assert.equal(act(1, { type: 'treaty', with: [2] }), null)
  assert.deepEqual(w.treaty?.with, [2])
  const out = endSeason(ps, w, map, T0, 1, new Set())
  const got = (p: number) => out.changed.get(p)!.mail.find(m => m.k === 'treaty')
  assert.ok(got(2) && got(3), 'cả minh hiệp ước được chia phần')
  assert.deepEqual(got(3)!.gift, TREATY_GIFT)
  assert.equal(got(4), undefined, 'minh ngoài hiệp ước')
  assert.equal(got(1), undefined, 'minh ký tự phi thăng, không nhận phần chia')
})

test('sức chứa kết trận theo tầng Chủ điện người mở (như Castle của RoK): 8 đội, từ tầng 20 mỗi 5 tầng thêm một', () => {
  const at = (hall: number) => {
    const s = newGame(T0, 'K')
    return { ...s, levels: { ...s.levels, chuDien: hall } }
  }
  const ps: Players = new Map([
    [1, at(10)],
    [2, at(20)],
    [3, at(25)],
  ])
  assert.deepEqual(
    [1, 2, 3, 9].map(p => rallyCap(ps, p)),
    [8, 9, 10, 8],
  )
})
