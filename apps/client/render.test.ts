// Render mọi màn hình ở nhiều trạng thái game, không cần trình duyệt: Vite biên dịch component cho SSR, svelte/server
// vẽ ra HTML. $effect/onMount không chạy, nhưng mọi phần vẽ theo state thì có — bắt lỗi vỡ lúc vẽ (vd. key trùng,
// đọc thuộc tính của undefined) và chữ hỏng lọt ra màn hình (NaN, undefined, [object Object]) trước khi tới người chơi.
import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer, type ViteDevServer } from 'vite'
import {
  BEASTS,
  IDS,
  REALMS,
  SECTS,
  SUPPLY_HALL,
  QUIZ_KEY,
  PVP_HALL,
  BOOK,
  DAO_IDS,
  NAN_DAY,
  advance,
  dayOf,
  apply,
  expAt,
  marchTime,
  newGame,
  type Action,
  type BuildingId,
  type Report,
  type State,
  mail,
  type Target,
  rng,
} from '@rok/rules'
import type { Text } from '@rok/i18n'
import { advanceWorld, atlas, freshWorld, mapOf, spawn, worldAct, type Chron } from '@rok/rules/world'

const root = fileURLToPath(new URL('.', import.meta.url))
let vite: ViteDevServer
const C: Record<string, any> = {}
let L: Text // bộ chữ của ngôn ngữ đang vẽ (lấy qua Vite như component)
let render: (c: any, o: { props: Record<string, unknown>; context?: Map<string, unknown> }) => { body: string } // lấy qua Vite: cùng bản runtime với component

// Ngôn ngữ chọn lúc nạp lib.ts theo navigator.language: nạp lại toàn bộ component cho từng ngôn ngữ
async function load(lang: 'vi' | 'en') {
  Object.defineProperty(globalThis, 'navigator', {
    value: { language: lang },
    configurable: true,
  })
  vite.moduleGraph.invalidateAll()
  for (const name of [
    'world/Home',
    'Hud',
    'Panel',
    'world/MapView',
    'Target',
    'Disciples',
    'Vault',
    'Reports',
    'Replay',
    'Result',
    'Settings',
    'Daily',
    'Title',
    'DaoChoose',
    'Rivals',
    'Ranks',
    'Alliance',
    'AllyTech',
    'AllyShop',
    'Profile',
    'AllyMob',
    'Arena',
    'Market',
    'Supply',
    'Honor',
    'Drill',
    'Quiz',
    'Unlocks',
    'GiftStrip',
    'PowerSheet',
    'Help',
    'ArkCard',
    'Rescue',
    'Advisor',
    'Chat',
    'world/WorldView',
    'world/Holdings',
    'world/MapTab',
    'TileSheet',
    'Events',
    'Pass',
    'VipSheet',
    'ResSheet',
    'Buffs',
    'SpeedUp',
    'Items',
    'Tavern',
  ])
    C[name.replace('world/', '')] = (await vite.ssrLoadModule(`/src/${name}.svelte`)).default
  L = (await vite.ssrLoadModule('/src/lib.ts')).L
  render = (await vite.ssrLoadModule('svelte/server')).render // nạp lại cùng lượt: runtime phải trùng bản với component
  assert.equal((await vite.ssrLoadModule('/src/lib.ts')).LANG, lang)
}
before(async () => {
  Object.assign(globalThis, { innerWidth: 390, innerHeight: 844, devicePixelRatio: 2 }) // component đọc khổ màn lúc vẽ: giả điện thoại
  vite = await createServer({
    root,
    configFile: `${root}vite.config.ts`,
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false },
  })
})
after(() => vite?.close())
const LANGS = ['vi', 'en'] as const

const T0 = Date.UTC(2026, 8, 23, 3) // 10h sáng giờ VN
const noop = () => {}
const act = () => null
function run(s: State, a: Action) {
  const r = apply(s, a, s.time)
  if (!r.ok) throw new Error(`${a.type}: ${r.error}`)
  return r.state
}
const levels = (lv: number, hall = lv) =>
  ({
    ...Object.fromEntries(IDS.map(id => [id, lv])),
    chuDien: hall,
  }) as State['levels']
const rich = { linhThach: 5e5, linhThao: 5e5, linhKhoang: 5e5 }

// Người mới vừa lập tông môn
const fresh = newGame(T0, 'Lạc Hà Tông')

// Giữa game: đủ mọi thứ đang chạy — hành quân (một đội đã đánh xong đang về), chiến báo, việc xây/tuyển/chữa/nghiên cứu/luyện
function midGame(): State {
  let s: State = {
    ...fresh,
    levels: levels(6, 7),
    res: rich,
    troops: { ...fresh.troops, kiem1: 400, phap2: 120, the2: 80, the3: 10 },
    wounded: { ...fresh.wounded, kiem1: 25 },
    elders: { thanhPhong: expAt(9), thachKien: expAt(4), nhuYen: 0 },
    items: { tuKhi: 3, boiNguyen: 2, doKiep: 1 },
    beast: 6,
    sects: [true, false, false, false, false],
    realms: [5, 1, 0, 0, 0],
    trib: 1,
    tech: { tuLinh: 3, phapTam: 1, kiemTam: 5 },
  }
  const first: Target = { kind: 'beast', i: 5 }
  s = run(s, {
    type: 'march',
    target: first,
    elder: 'thachKien',
    army: { kiem1: 200, the2: 40 },
  })
  s = advance(s, s.time + marchTime(s, first) + 1000) // tới nơi, có chiến báo, đang trên đường về
  s = run(s, {
    type: 'march',
    target: { kind: 'sect', i: 1 },
    elder: 'thanhPhong',
    army: { phap2: 60 },
  })
  s = run(s, { type: 'realm', i: 1, elder: 'nhuYen', army: { kiem1: 100 } })
  s = run(s, { type: 'heal' })
  s = run(s, { type: 'train', unit: 'phap2', n: 50 })
  s = run(s, { type: 'study', tech: 'loBan' })
  s = run(s, { type: 'brew', pill: 'boiNguyen', n: 1 })
  return run(s, { type: 'upgrade', building: 'khoangMach' })
}
const mid = midGame()

// Chờ độ kiếp (tầng 5, 10), vừa độ kiếp xong (có chiến báo 3 đợt), và tầng 15 (luân hồi)
const trib5: State = {
  ...fresh,
  levels: levels(5),
  res: rich,
  troops: { ...fresh.troops, kiem1: 300, phap1: 300, the1: 300 },
  items: { doKiep: 1 },
}
const afterTrib = run(trib5, {
  type: 'trib',
  elder: 'thanhPhong',
  army: { kiem1: 300, phap1: 300, the1: 300 },
  pill: true,
})
const failTrib = run(
  { ...trib5, troops: { ...trib5.troops, kiem1: 3 } },
  { type: 'trib', elder: 'thanhPhong', army: { kiem1: 3 }, pill: false },
)
const trib10: State = { ...mid, levels: levels(10), trib: 1, marches: [] }
// có chỗ trên bản đồ giới: kiếp vân đang tụ (server giải lúc giáng), đã bị phá kiếp một lần
const clouded = run(
  { ...trib10, seat: { x: 10, y: 10 }, res: rich, troops: { ...trib10.troops, kiem2: 200 } },
  { type: 'trib', elder: 'thanhPhong', army: { kiem2: 200 }, pill: false },
)
const cloud: State = { ...clouded, marches: clouded.marches.map(m => ({ ...m, foil: 1 })) }
const late: State = {
  ...mid,
  dao: { id: 'maTong', at: 0 }, // đạo thống: đệ tử đặc trưng (Diễn võ trường, Môn hạ), trấn phái chi bảo
  levels: levels(15),
  trib: 2,
  marches: [],
  beast: 15,
  sects: SECTS.map(() => true),
  realms: REALMS.map(() => 5),
  rebirths: 2,
  elders: {
    thanhPhong: expAt(30),
    thachKien: expAt(20),
    nhuYen: expAt(15),
    loiChan: expAt(10),
    vanHac: expAt(5),
    hanBang: 0,
  },
}
// Tầng 16–25: bậc 4–5, pháp bảo (một món đang đeo, một món đang luyện), thiên phú, đan mới, buff Ngưng Thần
const high: State = {
  ...late,
  levels: levels(20),
  trib: 3,
  realms: [5, 5, 5, 2, 0],
  tower: 31,
  troops: { ...late.troops, kiem4: 600, phap4: 400, the3: 300 },
  wounded: { ...late.wounded, the4: 40 },
  elders: { ...late.elders, thanhPhong: expAt(38), bachVoNhai: expAt(6), macSau: 0 },
  talents: { thanhPhong: [5, 2, 0] },
  gear: { thienLoi: { lv: 6, on: 'thanhPhong' }, hoTam: { lv: 4 } },
  items: { tuKhi: 7, daiTuKhi: 1, hoiXuan: 2, ngungThan: 1, phaCanh: 1, taiTuy: 1, doKiep: 2 },
}
const high20 = run(run(high, { type: 'focus' }), { type: 'forge', gear: 'hoTam' })
const top: State = { ...high, levels: levels(25), trib: 4, realms: REALMS.map(() => 5), tower: 50 }
// Tranh đoạt: tông môn A cướp B — A đang mang chiến lợi phẩm về, B vừa bị cướp (khiên, kẻ thù, chiến báo thủ), có thư, điểm sự kiện
function raided(): [State, State] {
  const a0: State = { ...late, shield: 0, marches: [], troops: { ...late.troops, kiem3: 1500 } }
  const b0: State = {
    ...late,
    name: 'Huyết Kiếm Tông',
    shield: 0,
    marches: [],
    troops: { ...late.troops, the1: 100 },
    guard: 'thachKien',
  }
  const ps = new Map([
    [1, a0],
    [2, b0],
  ])
  const r = worldAct(ps, 1, { type: 'raid', pid: 2, elder: 'thanhPhong', army: { kiem3: 1500 } }, late.time, 99)
  if (!r.ok) throw new Error(r.error)
  for (const [id, x] of r.changed) ps.set(id, x)
  const onWay = ps.get(1)!
  const at = onWay.marches[0].arriveAt
  for (const [id, x] of advanceWorld(ps, at)) ps.set(id, x)
  const gift = { res: { linhThach: 5000 }, items: { daiTuKhi: 1 } }
  const b = mail(
    { ...ps.get(2)!, ev: { ...late.ev, pts: 320, got: [true, false, false, false, false] } },
    { at, k: 'eventTop', a: [2, 'raid'], gift },
  )
  // thư từ server mới hơn: khoá client chưa biết vẫn phải hiện được
  b.mail.push({ id: b.nextId++, at, k: 'khoáLạ', a: [1] })
  return [ps.get(1)!, b]
}
const [raider, victim] = raided()
const STATES: [string, State][] = [
  ['người mới', fresh],
  ['giữa game', mid],
  ['chờ độ kiếp 5', trib5],
  ['sau độ kiếp', afterTrib],
  ['chờ độ kiếp 10', trib10],
  ['kiếp vân đang tụ', cloud],
  ['tầng 15', late],
  ['chờ độ kiếp 20', high20],
  ['tầng 25', top],
  ['vừa đi cướp', raider],
  ['vừa bị cướp', victim],
]

// Trợ năng: nút/ô nhập phải có tên cho trình đọc màn hình (chữ bên trong hoặc aria-label) — nút chỉ có icon hay quên
function unnamed(html: string) {
  const out: string[] = []
  for (const m of html.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/g)) {
    const text = m[2]
      .replace(/<svg[\s\S]*?<\/svg>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, '')
      .trim()
    if (!text && !/aria-label="[^"]+"/.test(m[1])) out.push(m[0].slice(0, 140))
  }
  for (const m of html.matchAll(/<(input|textarea)([^>]*)>/g))
    if (!/aria-label="[^"]+"|placeholder="[^"]+"|type="(checkbox|file)"/.test(m[2])) out.push(m[0].slice(0, 140))
  return out
}

// Vẽ một màn: game / now / act / busy đi qua context (src/game.ts) như trong App, phần còn lại là props
function draw(name: string, props: Record<string, unknown>) {
  const { game, now = T0, busy = false } = props
  return render(C[name], { props, context: new Map([['rok.game', { game, now, act: props.act ?? act, busy }]]) }).body
}

// RENDER_DUMP=<thư mục>: ghi HTML mọi lần vẽ ra file — so trước / sau khi sửa giao diện (diff -r)
const DUMP = process.env.RENDER_DUMP
if (DUMP) mkdirSync(DUMP, { recursive: true })
let dumped = 0
function paint(name: string, props: Record<string, unknown>, label: string) {
  let body = ''
  assert.doesNotThrow(() => (body = draw(name, props)), `${name} vỡ khi vẽ (${label})`)
  if (DUMP) writeFileSync(join(DUMP, `${String(++dumped).padStart(4, '0')}-${name}.html`), `<!-- ${label} -->\n${body}`)
  assert.ok(body.length > 20, `${name} trống (${label})`)
  const bad = body.match(/NaN|undefined|\[object Object\]/)
  assert.equal(
    bad,
    null,
    `${name} lọt "${bad?.[0]}" ra màn hình (${label}): …${body.slice(Math.max(0, (bad?.index ?? 0) - 80), (bad?.index ?? 0) + 40)}…`,
  )
  assert.deepEqual(unnamed(body), [], `${name} có nút/ô nhập không tên (${label})`)
  // Button mặc định type="button": form thiếu nút submit thì bấm không gửi (chỉ Enter mới gửi)
  for (const f of body.match(/<form[\s\S]*?<\/form>/g) ?? [])
    assert.ok(f.includes('type="submit"'), `${name} có form không nút gửi (${label})`)
  return body
}

test('màn tiêu đề, núi và HUD ở mọi trạng thái', async () => {
  for (const lang of LANGS) {
    await load(lang)
    paint('Title', { mode: 'first', onstart: noop, ondone: noop }, 'lần đầu')
    paint('Title', { mode: 'splash', onstart: noop, ondone: noop }, 'quay lại')
    const pick = paint('DaoChoose', { onpick: noop }, 'chọn đạo thống')
    for (const id of DAO_IDS) assert.ok(pick.includes(L.dao.names[id].name), `dải chọn thiếu ${id}`)
    paint('DaoChoose', { onpick: noop, value: 'maTong', current: 'maTong', compact: true }, 'cải tu')
    for (const f of L.naming.first)
      for (const l of L.naming.last) assert.ok(`${f} ${l}`.length <= 20, `tên gợi ý quá dài (tối đa 20): ${f} ${l}`)
    for (const [label, s] of STATES) {
      const now = s.time + 5000
      paint('Home', { game: s, now, still: false, onselect: noop }, label)
      paint('Home', { game: s, now, still: true }, `${label}, làm nền`)
      paint('Home', { game: s, now, storm: true }, `${label}, đang độ kiếp`)
      for (const tab of ['tongMon', 'monHa', 'banDo', 'baoKho'])
        paint(
          'Hud',
          {
            game: s,
            now,
            tab,
            gain: null,
            onclaim: noop,
            onquest: noop,
            onbuilder: noop,
            ontab: noop,
            onsettings: noop,
            ondaily: noop,
          },
          `${lang}, ${label}, tab ${tab}`,
        )
    }
  }
})

test('bảng công trình: mọi công trình × mọi thẻ × mọi trạng thái', async () => {
  for (const lang of LANGS) {
    await load(lang)
    for (const [label, s] of STATES)
      for (const id of IDS)
        for (const view of [null, 'upgrade', 'train', 'alchemy', 'library', 'trade', 'forge', 'guard'])
          paint(
            'Panel',
            {
              game: s,
              now: s.time + 5000,
              id,
              view,
              act,
              onupgrade: noop,
              onclose: noop,
              onselect: noop,
              ontrib: noop,
              onrebirth: noop,
            },
            `${label}, ${id}, ${view}`,
          )
    // Đúng nội dung ở những chỗ quan trọng
    const panel = (s: State, id: BuildingId, view: string | null = null) =>
      draw('Panel', {
        game: s,
        now: s.time,
        id,
        view,
        act,
        onupgrade: noop,
        onclose: noop,
        onselect: noop,
        ontrib: noop,
        onrebirth: noop,
      })
    assert.ok(panel(trib5, 'chuDien').includes(L.trib.title), 'Chủ điện tầng 5 phải hiện độ kiếp')
    assert.ok(panel(late, 'chuDien').includes(L.rebirth.title), 'Chủ điện tầng 15 phải hiện luân hồi')
    assert.ok(
      panel({ ...late, seat: { x: 3, y: 3 } }, 'chuDien').includes(L.rebirth.season),
      'trong giới: luân hồi khi hết mùa, không có nút',
    )
    const gathering = panel(cloud, 'chuDien')
    assert.ok(
      gathering.includes(L.trib.gathering('').slice(0, 14)) && gathering.includes(L.trib.foiled(1)),
      'kiếp vân đang tụ: đếm ngược, số lần bị phá kiếp',
    )
    assert.ok(!gathering.includes(L.trib.need), 'đã trả chi phí lúc tụ: không hỏi tài nguyên nữa')
    assert.ok(panel(mid, 'tangBaoCac').includes(L.trade.tab), 'Tàng Bảo Các có thẻ Thương hội')
    assert.ok(
      panel(late, 'chuDien').includes(L.rebirth.gain(late.rebirths + 1)),
      'luân hồi phải nói rõ thưởng kiếp sau (căn cơ)',
    )
    const poor: State = {
      ...trib10,
      res: { linhThach: 500, linhThao: 500, linhKhoang: 500 },
      levels: { ...trib10.levels, tangBaoCac: 2 },
    }
    assert.ok(
      panel(poor, 'chuDien').includes(L.b.tangBaoCac.name),
      'chi phí vượt sức chứa: phải chỉ đường tới Tàng Bảo Các',
    )
    assert.ok(!panel(trib10, 'chuDien').includes(L.panel.store('', 0).slice(0, 12)), 'đủ tiền thì không nhắc kho')
    assert.ok(panel(mid, 'dienVoTruong').includes(L.train.pick), 'Diễn võ trường mở sẵn thẻ tuyển')
    assert.ok(panel(mid, 'dienVoTruong', 'upgrade').includes(L.panel.upgrade))
    // Tầng 16–25: độ kiếp tầng 20 kèm luân hồi, Phá Cảnh Đan thay Độ Kiếp Đan, Luyện Khí Phòng có thẻ luyện khí
    const hall20 = panel(high20, 'chuDien')
    assert.ok(
      hall20.includes(L.trib.title) && hall20.includes(L.rebirth.title),
      'Chủ điện tầng 20: độ kiếp và luân hồi',
    )
    assert.ok(hall20.includes(L.pills.phaCanh.name), 'có Phá Cảnh Đan thì dùng nó cho độ kiếp')
    assert.ok(
      panel(top, 'chuDien').includes(L.panel.maxed) && panel(top, 'chuDien').includes(L.rebirth.title),
      'tầng 25: tối đa, vẫn luân hồi được',
    )
    assert.ok(
      panel(high20, 'luyenKhiPhong').includes(L.forge.doing(L.gear.hoTam, 5)),
      'đang luyện hiện ở Luyện Khí Phòng',
    )
  }
})

test('bản đồ, mục tiêu, chiến báo, phát lại, kết quả', async () => {
  for (const lang of LANGS) {
    await load(lang)
    for (const [label, s] of STATES) {
      const now = s.time + 5000
      paint('MapView', { game: s, now, onpick: noop, onreports: noop }, label)
      paint('Reports', { game: s, open: true, onclose: noop, onopen: noop }, label)
      paint(
        'Rivals',
        { game: s, now, open: true, load: async () => [], onclose: noop, onraid: noop, onrecruit: noop },
        label,
      )
      const targets: Target[] = [
        ...BEASTS.map((_, i) => ({ kind: 'beast', i }) as Target),
        ...SECTS.map((_, i) => ({ kind: 'sect', i }) as Target),
        ...REALMS.map((_, i) => ({ kind: 'realm', i }) as Target),
        { kind: 'tower', i: 0 },
      ]
      for (const target of targets)
        paint(
          'Target',
          {
            game: s,
            now,
            target,
            onclose: noop,
            onmarch: noop,
            onrecruit: noop,
          },
          `${label}, ${target.kind} ${target.i}`,
        )
      const { verdictOf } = await vite.ssrLoadModule('/src/verdict.ts')
      for (const report of s.reports as Report[]) {
        paint('Replay', { report, onclose: noop, onfocus: noop }, `${label}, chiến báo ${report.kind} ${report.i}`)
        // đánh giá một câu: mọi trận trừ độ kiếp, chữ không hỏng; thua vì bị khắc thì gợi ý đúng hệ khắc lại
        const v = verdictOf(report)
        assert.equal(!!v, report.kind !== 'trib', `đánh giá ${report.kind}`)
        if (v) assert.ok(!/undefined|NaN|\[object/.test(v.text), v.text)
      }
      const side = (type: string) => ({ level: 1, troops: [{ type, tier: 1, n: 100 }] })
      const lost = { kind: 'beast', win: false, fights: [{ a: side('kiem'), b: side('the'), rounds: [] }] }
      assert.equal(verdictOf(lost).counter, 'phap', 'Kiếm tu thua Thể tu → tuyển Pháp tu')
      // "Dùng vừa đủ": mệnh giá lớn trước, phần lẻ dùng cái nhỏ nhất còn lại; hết đồ thì còn lại bao lâu
      const { speedPlan } = await vite.ssrLoadModule('/src/bag.ts')
      const plan = (left: number) =>
        speedPlan(
          [
            { id: 'h', ms: 60, have: 2 },
            { id: 'q', ms: 15, have: 5 },
          ],
          left,
        )
      const ids = (p: { use: [{ id: string }, number][] }) => p.use.map(([x, n]) => `${x.id}${n}`).join(' ')
      assert.deepEqual([ids(plan(70)), plan(70).rest], ['h1 q1', 0])
      assert.deepEqual([ids(plan(200)), plan(200).rest], ['h2 q5', 5])
      assert.deepEqual([ids(plan(0)), plan(0).rest], ['', 0])
    }
    assert.ok(
      mid.reports.length >= 2 && afterTrib.reports.at(-1)!.fights.length === 3,
      'dữ liệu thử phải có đủ loại chiến báo',
    )
    // Tranh đoạt: chiến báo hai phía, nút báo thù cho bên bị cướp, thư có quà và thư khoá lạ vẫn có chữ
    assert.equal(victim.reports.at(-1)!.def, true)
    assert.ok(victim.shield > victim.time && victim.foes.length === 1)
    const rep = victim.reports.at(-1)!
    assert.ok(
      paint('Reports', { game: victim, open: true, onclose: noop, onopen: noop }, 'hộp thư').includes(L.mail.claim),
    )
    paint('Ranks', { open: true, me: 1, load: async () => null, onclose: noop }, 'xếp hạng')
    assert.ok(
      paint(
        'Hud',
        {
          game: victim,
          now: victim.time,
          tab: 'banDo',
          gain: null,
          onclaim: noop,
          onquest: noop,
          onbuilder: noop,
          ontab: noop,
          onsettings: noop,
          ondaily: noop,
        },
        'khiên',
      ).includes(L.rank.open),
    )
    // cướp khoáng: đội khai của mình bị nhắm — cảnh báo hiện cả khi đang có khiên, kèm nút gọi đội về
    const gather = {
      target: { kind: 'spot' as const, i: 3 },
      task: 'gather' as const,
      seed: 1,
      startAt: victim.time - 9e4,
    }
    const digging: State = {
      ...victim,
      marches: [
        {
          ...gather,
          id: 77,
          elder: 'thanhPhong',
          army: { kiem1: 10 },
          arriveAt: victim.time - 1000,
          returnAt: victim.time + 3_600_000,
          mine: { end: victim.time + 1_800_000, amount: 500, res: 'linhThach' },
        },
      ],
      incoming: [{ id: 9, pid: 2, foe: 'Hắc Sơn', at: victim.time + 60_000, spot: 3 }],
    }
    const alarm = paint(
      'Hud',
      { game: digging, now: victim.time, tab: 'banDo', gain: null, onclaim: noop, onquest: noop, onbuilder: noop },
      'bị cướp khoáng',
    )
    assert.ok(alarm.includes(L.pvp.robIncoming('Hắc Sơn')) && alarm.includes(L.world.recall), 'cảnh báo + gọi về')
    // Linh hỏa thiêu sơn: cảnh báo ở HUD (dập lửa bằng Tức Hỏa Phù), thẻ trận lực ở Hộ Sơn Đại Trận
    const burnt: State = {
      ...victim,
      items: { ...victim.items, tucHoa: 1 },
      wall: { hp: 300, at: victim.time, fire: victim.time + 600_000 },
    }
    const hud = { now: victim.time, tab: 'tongMon', gain: null, onclaim: noop, onquest: noop, onbuilder: noop }
    assert.ok(paint('Hud', { ...hud, game: burnt }, 'núi đang cháy').includes(L.wall.douse(1)), 'cảnh báo linh hỏa')
    const guard = paint(
      'Panel',
      { game: burnt, now: victim.time, id: 'hoSonDaiTran', view: 'guard', act, onupgrade: noop, onclose: noop },
      'trận lực lúc núi cháy',
    )
    assert.ok(guard.includes(L.wall.title) && guard.includes(L.wall.burningHint), 'thẻ trận lực')
    // Anh Linh Điện: đệ tử tử trận còn giữ hồn — mục hồi sinh ở Đan phòng
    const souls: State = { ...victim, fallen: { army: { kiem1: 40 }, until: victim.time + 3_600_000 } }
    const heroes = paint(
      'Panel',
      { game: souls, now: victim.time, id: 'danPhong', view: 'alchemy', act, onupgrade: noop, onclose: noop },
      'Anh Linh Điện',
    )
    assert.ok(heroes.includes(L.alchemy.heroes) && heroes.includes(L.alchemy.revive('40')), 'hồi sinh ở Đan phòng')
    const quiet = paint(
      'Hud',
      {
        game: { ...digging, seclude: { until: victim.time + 86_400_000, shield: 0 } },
        now: victim.time,
        tab: 'tongMon',
        gain: null,
        onclaim: noop,
        onquest: noop,
        onbuilder: noop,
      },
      'đang bế quan',
    )
    assert.ok(quiet.includes(L.seclude.off), 'bế quan: nút xuất quan ở HUD')
    paint('Replay', { report: rep, onclose: noop, onrevenge: noop, now: rep.at + 1000 }, 'bị cướp')
    // Thông Thiên Tháp: đánh một tầng ở cuối game → chiến báo loại tháp phát lại được, bản đồ có nút tháp
    const climbed = run(
      { ...late, troops: { ...late.troops, kiem1: 3000, phap2: 3000, the3: 3000 } },
      { type: 'tower', elder: 'thanhPhong', army: { kiem1: 3000, phap2: 3000, the3: 3000 } },
    )
    assert.equal(climbed.reports.at(-1)!.kind, 'tower')
    paint('Replay', { report: climbed.reports.at(-1), onclose: noop }, 'chiến báo tháp')
    assert.ok(
      paint('MapView', { game: climbed, now: climbed.time, onpick: noop, onreports: noop }, 'bản đồ có tháp').includes(
        L.tower.name,
      ),
    )
    assert.ok(
      paint(
        'Target',
        {
          game: climbed,
          now: climbed.time,
          target: { kind: 'tower', i: 0 },
          onclose: noop,
          onmarch: noop,
          onrecruit: noop,
        },
        'tháp tầng 2',
      ).includes(L.tower.floor(climbed.tower + 1)),
    )
    paint(
      'Result',
      {
        outcome: { kind: 'trib', report: afterTrib.reports.at(-1) },
        game: afterTrib,
        onclose: noop,
        onreplay: noop,
      },
      'đột phá',
    )
    paint(
      'Result',
      {
        outcome: { kind: 'trib', report: failTrib.reports.at(-1) },
        game: failTrib,
        onclose: noop,
        onreplay: noop,
      },
      'độ kiếp thất bại',
    )
    const reborn = draw('Result', { outcome: { kind: 'rebirth', n: 3 }, game: late, onclose: noop, onreplay: noop })
    paint('Result', { outcome: { kind: 'rebirth', n: 3 }, game: late, onclose: noop, onreplay: noop }, 'luân hồi')
    assert.equal(reborn.split(L.rebirth.done(3)).length - 1, 1, 'màn luân hồi: tên kiếp chỉ hiện một lần')
    assert.ok(reborn.includes(L.rebirth.perks(3)), 'màn luân hồi: nói rõ thưởng kiếp này')
  }
})

test('môn hạ, bảo khố, nhiệm vụ ngày, cài đặt', async () => {
  for (const lang of LANGS) {
    await load(lang)
    for (const [label, s] of STATES) {
      const now = s.time + 5000
      paint('Disciples', { game: s, now, act, onfocus: noop }, label)
      paint('Vault', { game: s, now, act, onfocus: noop }, label)
      const daily = paint('Daily', { game: s, now, open: true, onclose: noop, act }, label)
      assert.ok(daily.includes(L.weekly.title) && daily.includes(L.weekly.bonus), `nhiệm vụ tuần phải hiện (${label})`)
      assert.ok(daily.includes(L.side.title) && daily.includes(L.side.lines.truyenCong), `Tông vụ (${label})`)
      const sat = Date.UTC(2026, 8, 26, 3) // thứ Bảy 10h giờ VN
      assert.equal(
        paint('Daily', { game: s, now: sat, open: true, onclose: noop, act }, `${label}, cuối tuần`).includes(
          L.weekend.title,
        ),
        true,
      )
      assert.equal(daily.includes(L.weekend.title), false, 'ngày thường không có sự kiện')
      const settings = paint(
        'Settings',
        {
          game: s,
          open: true,
          muted: false,
          onclose: noop,
          onmute: noop,
          toast: noop,
        },
        label,
      )
      assert.ok(settings.includes(L.settings.calm) && settings.includes(L.seclude.title), 'giảm chuyển động, bế quan')
      assert.ok(
        L.guide.items.every(([q]) => settings.includes(q)),
        'Cài đặt phải có đủ mục Cẩm nang',
      )
      // bản online: mục tài khoản (SSR chưa có thông tin tài khoản — chỉ cần vẽ không lỗi, vẫn có tiêu đề mục)
      const ok = async () => ({ ok: true as const, data: { ok: true } })
      const account = {
        info: ok,
        link: ok,
        password: ok,
        code: ok,
        logout: ok,
        remove: ok,
        push: async () => 'on' as const,
      }
      assert.ok(
        paint(
          'Settings',
          { game: s, now: s.time, open: true, muted: false, onclose: noop, onmute: noop, account, onout: noop },
          `${label}, online`,
        ).includes(L.settings.account),
      )
    }
  }
})

test('sự kiện, túi đồ, tăng tốc, Hương Hỏa, bảng tài nguyên, Chiêu Hiền Đài', async () => {
  for (const lang of LANGS) {
    await load(lang)
    for (const [label, s] of STATES) {
      const now = s.time + 5000
      // túi có đủ mọi loại vật phẩm để mọi ô, mọi tab đều được vẽ
      const full: State = {
        ...s,
        items: {
          ...s.items,
          thoiQuang60: 3,
          loBan15: 2,
          thachNang5k: 1,
          tuLinh8: 1,
          hoSon24: 1,
          kinhThu2k: 2,
          kimDuyen: 4,
        },
        tokens: { hanBang: 12, thanhPhong: 3 },
      }
      const events = paint('Events', { game: full, now, open: true, onclose: noop }, label)
      assert.ok(events.includes(L.fest.calendar), `trung tâm sự kiện phải có lịch 7 ngày (${label})`)
      paint('VipSheet', { game: full, now, open: true, onclose: noop }, label)
      // Tu Tiên Lệnh: cấp 3, đã nhận quà thường cấp 1, Kim Lệnh đã mở (Hương Hỏa đủ) — còn quà chờ nhận
      const scroll = {
        ...full,
        levels: { ...full.levels, chuDien: Math.max(3, full.levels.chuDien) },
        pass: { xp: 340, got: [1], gold: [] },
        vip: { ...full.vip!, pts: 99_999 },
      }
      const pass = paint('Pass', { game: scroll, now, s: scroll }, label)
      assert.ok(pass.includes(L.pass.level(3, 50)) && pass.includes(L.pass.goldOn), `Tu Tiên Lệnh (${label})`)
      assert.ok(pass.includes(L.mail.claimAll(5)), `nhận tất cả: thường 2–3, Kim Lệnh 1–3 (${label})`)
      // Thôn Trang Gặp Nạn: việc cứu nạn đang làm (xong, chờ báo công) ở trung tâm sự kiện
      const quest = { i: 3, m: 'train' as const, n: 60, from: full.stats.trained - 60, until: now + 3_600_000 }
      const rescue = paint('Rescue', { game: { ...full, nan: { day: dayOf(now), n: 1, q: quest } }, now }, label)
      assert.ok(rescue.includes(L.nan.done) && rescue.includes(L.nan.today(1, NAN_DAY)), `việc cứu nạn (${label})`)
      paint('ResSheet', { game: full, now, res: 'linhThach', onclose: noop, onfocus: noop }, label)
      const buffed: State = {
        ...full,
        shield: now + 5 * 3_600_000,
        buffs: [
          { key: 'prod', v: 0.5, until: now + 7 * 3_600_000, src: 'phu.prod' },
          { key: 'atk', v: 0.1, until: now + 40 * 60_000, src: 'ngungThan' },
          { key: 'prod', v: 0.1, until: 0, src: 'vein' },
          { key: 'build', v: 0.05, until: now + 3_600_000, src: 'bless' },
        ],
      }
      const strip = paint('Buffs', { game: buffed, now }, label)
      assert.ok(strip.includes(L.buffs.open(5)) && strip.includes('+3'), `dải tăng ích: 2 chip + "+3" (${label})`)
      paint('Items', { game: full, now }, label)
      paint('Tavern', { game: full, now }, label)
      if (full.queue[0]) paint('SpeedUp', { game: full, now, kind: 'build', open: true, onclose: noop }, label)
    }
  }
})

test('tiên minh, chat', async () => {
  const people = [
    { pid: 1, name: 'Lạc Hà Tông', role: 2 as const, hall: 12, power: 9000, online: true, seen: dayOf(late.time) },
    {
      pid: 2,
      name: 'Huyết Kiếm Tông',
      role: 0 as const,
      hall: 10,
      power: 7000,
      online: false,
      seen: dayOf(late.time) - 8,
    },
  ]
  const info = {
    id: 1,
    name: 'Thanh Vân Minh',
    tag: 'TVM',
    members: { 1: 2, 2: 0 } as Record<number, 0 | 1 | 2>,
    notice: 'Họp lúc 8h',
    at: late.time,
    helps: [{ pid: 2, job: 'build' as const, startAt: 0, ms: 60_000, by: [] }],
    people,
    rallies: [
      { id: 1, ally: 1, by: 1, i: 3, task: 'hit' as const, at: late.time + 600_000 },
      { id: 2, ally: 1, by: 2, i: 7, task: 'raid' as const, at: late.time + 900_000, foe: 'Hắc Sơn Tông' },
    ],
    tech: { tuLinh: 1300, loBan: 10_000, dongTam: 50 },
    star: 'tuLinh' as const,
    fund: 820,
    stock: { thoiQuang60: 3, kinhThu2k: 0 },
    gift: 700,
    marks: [{ x: 40, y: 52, text: 'Tập trung', by: 1, at: late.time }],
    mob: { week: 0, pts: 700, next: 9, board: [8, 1, 2, 3, 4, 5, 6, 7], by: { 1: 40 } },
    war: { signed: true, pts: 1016, last: [{ a: 1, b: 2, an: 'TVM', bn: 'TK', wa: 3, wb: 2 }] },
    tribe: { week: 0, pts: 0, rank: 0 },
    applicants: [{ pid: 9, name: 'Tân Tông', hall: 7, power: 900 }],
    closed: true,
  }
  const api = {
    ask: async () => [],
    say: async () => ({ ok: true as const }),
    report: async () => true,
    onChat: () => () => {},
  }
  for (const lang of LANGS) {
    await load(lang)
    for (const [label, s] of STATES) {
      paint(
        'Alliance',
        {
          game: s,
          me: 1,
          ally: null,
          rows: [
            {
              id: 1,
              name: 'Thanh Vân Minh',
              tag: 'TVM',
              n: 2,
              max: 32,
              power: 16000,
              closed: true,
              asked: false,
              invited: true,
            },
          ],
          send: async () => ({ ok: true }),
        },
        `${label}, chưa vào minh`,
      )
      const mine = { game: s, me: 1, ally: info, rows: null, send: async () => ({ ok: true }), onraid: noop }
      const inside = paint('Alliance', mine, `${label}, trong minh`)
      assert.ok(inside.includes(L.pot.title), 'Tụ Bảo Minh Đỉnh ở tab nhà')
      // Tranh Đoạt Linh Châu: trước trận (ghi danh) và đang trận (sơ đồ, điểm, lệnh, nhật ký)
      const go = async () => true
      const signUp = paint(
        'ArkCard',
        {
          row: {
            signed: false,
            live: null,
            last: [],
            league: [{ id: 1, tag: 'VK', w: 2, l: 1, pts: 7 }],
            cup: {
              seeds: [1, 2, 3, 4],
              win: [1, 2],
              lose: [4, 3],
              final: [1, 2],
              third: [3, 4],
              tags: { 1: 'VK', 2: 'HS', 3: 'GI', 4: 'TL' },
            },
          },
          me: 1,
          aid: 1,
          officer: true,
          go,
        },
        `${label}, Linh Châu`,
      )
      assert.ok(signUp.includes(L.ark.sign) && signUp.includes(L.ark.leagueRow(2, 1, 7)), 'nút ghi danh, bảng giải')
      assert.ok(signUp.includes(L.ark.cup.third) && signUp.includes(L.ark.cup.champ('VK')), 'nhánh playoff, quán quân')
      const live = {
        a: 1,
        b: 2,
        an: 'VK',
        bn: 'HS',
        round: 3,
        units: [
          { pid: 1, side: 0 as const, at: 5, to: 5, n: [] },
          { pid: 7, side: 1 as const, at: 10, to: 5, n: [], rest: 4 },
        ],
        own: [0, 0, 0, 0, 0, 0, 1, null, 1, null, 1] as (0 | 1 | null)[],
        pts: [320, 140] as [number, number],
        taken: [
          [1, 2, 3, 4, 5],
          [6, 8],
        ] as [number[], number[]],
        charged: [[], []] as [number[], number[]],
        orb: { at: 5, by: 1, n: 0 },
        cup: 'final' as const,
        log: [
          [2, 'orb', 0, 5],
          [3, 'take', 0, 5, 200],
        ] as never,
      }
      const during = paint(
        'ArkCard',
        { row: { signed: true, live, last: [], league: [] }, me: 1, aid: 1, officer: true, go },
        `${label}, Linh Châu đang trận`,
      )
      assert.ok(
        during.includes('[VK] 320') && during.includes(L.ark.carrying) && during.includes(L.ark.log.orb()),
        'đang trận',
      )
      assert.equal(during.match(/class="ring/g)?.length, 2, 'hai Tụ Linh Nhãn phe mình giữ: vòng nối')
      assert.ok(during.includes(L.ark.cup.final), 'trận chung kết có nhãn')
      assert.ok(inside.includes(L.ally.helpAll(1)), 'có người nhờ giúp thì nút giúp tất cả đếm đúng')
      const war = paint('Alliance', { ...mine, start: 'war' }, `${label}, trong minh · chiến sự`)
      assert.ok(war.includes(L.world.siege('Hắc Sơn Tông')), 'kết trận công sơn ghi tên tông môn bị đánh')
      assert.ok(war.includes(L.party.title), 'Man Hoang Cổ Tộc ở tab chiến sự')
      // Minh sự lịch: việc đã hẹn (mình đang tham gia), ô hẹn việc mới cho trưởng lão
      const plans = [{ id: 1, by: 1, at: s.time + 3_600_000, text: 'Kết trận yêu vương', go: [1] }]
      const planned = paint('Alliance', { ...mine, ally: { ...info, plans }, start: 'war' }, `${label}, minh sự lịch`)
      assert.ok(planned.includes('Kết trận yêu vương') && planned.includes(L.plan.leave), 'lịch minh + nút rút')
      const crew = paint('Alliance', { ...mine, start: 'people' }, `${label}, trong minh · thành viên`)
      if (s.time >= late.time)
        assert.ok(crew.includes(L.ally.idle(dayOf(s.time) - dayOf(late.time) + 8)), 'thành viên vắng lâu: ghi số ngày')
      for (const officer of [false, true]) {
        const who = officer ? 'trưởng lão' : 'thành viên'
        const sheet = { game: s, ally: info, officer, open: true, onclose: noop, send: async () => ({ ok: true }) }
        const tech = paint('AllyTech', sheet, `${label}, Hộ Minh Đại Trận (${who})`)
        assert.ok(
          tech.includes(L.guild.names.quangNap) && tech.includes(L.guild.maxed),
          'đủ trận, trận đầy ghi viên mãn',
        )
        const shop = paint('AllyShop', sheet, `${label}, Cống Hiến Các (${who})`)
        paint('AllyMob', { ...sheet, me: 1 }, `${label}, Minh vụ đường (${who})`)
        assert.equal(shop.includes(L.guild.restock), officer, 'chỉ trưởng lão / minh chủ thấy nút nhập hàng')
      }
      paint('Chat', { game: s, me: 1, ally: true, api, act, toast: noop, inline: true }, `${label}, chat trong trang`)
      const { social } = await vite.ssrLoadModule('/src/social.svelte.ts')
      social.profile = 2
      paint('Profile', { game: s, api, me: 1 }, `${label}, hồ sơ đang tải`)
      social.profile = null
      paint(
        'Advisor',
        { game: s, ontab: noop, onfests: noop, ondaily: noop, onfocus: noop },
        `${label}, trưởng lão dẫn đường`,
      )
      social.arena = true
      paint(
        'Arena',
        { game: s, api, me: 1, send: async () => ({ ok: true }), onreplay: noop },
        `${label}, Luận Kiếm Đài`,
      )
      social.arena = false
      social.market = true
      paint('Market', { game: s, api, send: async () => ({ ok: true }) }, `${label}, Phường thị`)
      social.market = false
      social.honor = true
      const hon = paint(
        'Honor',
        { game: { ...s, honor: 420, honorGot: 1, honorAll: 5000 }, api },
        `${label}, Công Huân`,
      )
      assert.ok(hon.includes(L.honor.shop) && hon.includes(L.honor.coins('250')), 'Thiên Môn Thương Điếm, Phi Thăng Tệ')
      assert.ok(hon.includes(L.honor.mine('420')) && hon.includes(L.honor.claim), 'điểm của mình + mốc nhận được')
      social.honor = false
      social.drill = true
      paint('Drill', { game: s, onfight: async () => null, onreplay: noop }, `${label}, Luận Võ chưa vào phiên`)
      if (s.levels.chuDien >= 6) {
        const drill = {
          day: dayOf(s.time),
          elder: 'thanhPhong' as const,
          army: { kiem3: 300 },
          base: 5000,
          wins: 3,
          mods: ['giap' as const],
          offer: ['cuong' as const, 'the' as const, 'khac' as const],
          got: 1,
        }
        const dr = paint(
          'Drill',
          { game: { ...s, drill }, onfight: async () => null, onreplay: noop },
          `${label}, Luận Võ chọn công pháp`,
        )
        assert.ok(
          dr.includes(L.drill.wins(3)) && dr.includes(L.drill.mods.khac[0]),
          'đang phiên: số thắng + 3 lựa chọn',
        )
      }
      social.drill = false
      social.quiz = true
      const quiz = paint('Quiz', { game: s }, `${label}, Vấn Đạo Đài`)
      if (s.levels.chuDien >= 3) assert.ok(quiz.includes(L.quiz.step(1, 5)), 'câu đầu hôm nay')
      assert.equal(L.quiz.q.length, QUIZ_KEY.length, 'mỗi đáp án một câu hỏi')
      for (const e of Object.keys(L.elders))
        assert.equal(L.story.text[e as keyof typeof L.story.text]?.length, 3, `liệt truyện ${e}`)
      social.quiz = false
      // màn Mở khoá: Chủ điện lên tầng mở tab + bản đồ + chat (tầng 3), Tranh đoạt (tầng 6) — mỗi mục một huy hiệu
      for (const hall of [3, 6]) {
        social.unlock = hall
        const un = paint('Unlocks', { onfocus: noop, ontab: noop }, `${label}, mở khoá tầng ${hall}`)
        assert.ok(un.includes(L.unlock.title(hall)) && un.includes(L.unlock.go), 'huy hiệu bấm là tới')
      }
      social.unlock = 0
      social.gift = { thoiQuang60: 2, kinhThu500: 1 }
      assert.ok(paint('GiftStrip', {}, `${label}, Tạ lễ`).includes(L.gift.title), 'dải vật phẩm vừa nhận')
      social.gift = null
      // nút "?" theo ngữ cảnh: đúng mục Cẩm nang (chỉ số dùng ở Army 1, Disciples 2/3, Panel 4, Daily 9, Rivals 10)
      for (const k of [1, 2, 3, 4, 9, 10])
        assert.ok(paint('Help', { k }, `${label}, ?`).includes(L.guide.items[k][0]), `mục Cẩm nang ${k}`)
      const pw = paint(
        'PowerSheet',
        { open: true, game: s, onclose: noop, onfocus: noop, ontab: noop },
        `${label}, bảng Thế lực`,
      )
      assert.ok(pw.includes(L.powerSheet.parts.troops) && pw.includes(L.powerSheet.go), 'thế lực theo nguồn')
      const sup = paint(
        'Supply',
        {
          game: s,
          to: 2,
          name: 'Thanh Vân',
          room: { tax: 0.25, send: 5e4, get: 2e4 },
          send: async () => ({ ok: true }),
          onsent: noop,
        },
        `${label}, Vận Linh Trận`,
      )
      assert.ok(sup.includes(L.supply.tax('25%')), 'hao tổn hiện trên đầu mục')
      assert.equal(
        sup.includes(L.supply.locked(SUPPLY_HALL)),
        s.levels.chuDien < SUPPLY_HALL,
        'dưới tầng mở: chỉ báo tầng',
      )
      paint('Chat', { game: s, me: 1, api: null, act, toast: noop }, `${label}, dải chat`)
    }
  }
})

test('bản đồ giới: cảnh, ghim, dải trên, bảng chạm cho mọi loại', async () => {
  const DAY = 86_400_000
  const info = { id: 1, name: 'Giới 1', season: 1, map: 7, opened: late.time - 6 * DAY } // ngày 7: pha Tranh mạch
  const a = atlas(7)
  const taken: { x: number; y: number }[] = []
  const rand = rng(3)
  const ps = new Map(
    STATES.map(([, st], i) => {
      const seat = spawn(a, taken, rand)!
      taken.push(seat)
      return [i + 1, { ...st, seat }] as [number, State]
    }),
  )
  const vein = a.points.find(p => p.kind === 'vein')!
  const mine = a.points.find(p => p.kind === 'mine')!
  const boss = a.points.find(p => p.kind === 'boss')!
  const w = {
    ...freshWorld(),
    spots: { [vein.i]: { own: -1, since: late.time }, [mine.i]: { left: 500 }, [boss.i]: { hp: 30_000 } },
  }
  const snap = mapOf(
    ps,
    late.time,
    new Set([2]),
    [
      { at: late.time, k: 'found', a: ['Lạc Hà Tông'] },
      { at: late.time, k: 'khoáLạ', a: [] } as unknown as Chron, // server mới hơn client: khoá lạ vẫn hiện được
    ],
    w,
  )
  const game = ps.get(1)!
  const now = late.time
  const picks = [
    { kind: 'seat', pid: 2 },
    { kind: 'seat', pid: 1 },
    { kind: 'point', i: vein.i },
    { kind: 'point', i: mine.i },
    { kind: 'point', i: boss.i },
    { kind: 'point', i: a.points.find(p => p.kind === 'gate')!.i },
    { kind: 'point', i: a.points.find(p => p.kind === 'heaven')!.i },
    { kind: 'point', i: a.points.find(p => p.kind === 'ruin')!.i }, // Cổ Di Tích (mở / đóng theo giờ)
    { kind: 'point', i: a.points.find(p => p.kind === 'altar')!.i },
    { kind: 'tile', x: 3, y: 4 },
    { kind: 'site', i: 0 }, // thôn trang / động phủ
    { kind: 'tile', x: 140, y: 140 }, // mê vụ chưa tan (xa tông môn)
  ]
  for (const lang of LANGS) {
    await load(lang)
    const world = paint('WorldView', { game, now, info, me: 1, snap, allies: [3], onpick: noop }, 'bản đồ giới')
    assert.ok(world.includes(L.world.minimap), 'có bản đồ nhỏ')
    // Sơn Hà Xã Tắc Đồ: linh mạch người 1 đang giữ đứng trong danh sách, có nút bay tới
    const holdings = paint(
      'Holdings',
      { game, now, open: true, atlas: a, snap, side: -1, phase: 1, onclose: noop, onfly: noop },
      'Sơn Hà Xã Tắc Đồ',
    )
    assert.ok(holdings.includes(`(${vein.x},${vein.y})`) && holdings.includes(L.world.flyTo), 'danh sách linh địa')
    // Tu Bổ Thiên Môn: chương đang mở → nút góp tài nguyên trên thẻ mùa
    const mend = { ...snap, book: { ch: BOOK.findIndex(g => g.m === 'repair'), done: [], value: 0 } }
    // thẻ mùa mặc định thu gọn trên điện thoại: giả như người chơi đã mở rộng (nhớ theo máy)
    const store = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: () => '0', setItem: () => {} },
      configurable: true,
    })
    const mending = paint(
      'WorldView',
      { game, now, info, me: 1, snap: mend, allies: [3], onpick: noop, send: async () => ({ ok: true }) },
      'Tu Bổ Thiên Môn',
    )
    if (store) Object.defineProperty(globalThis, 'localStorage', store)
    else delete (globalThis as { localStorage?: unknown }).localStorage
    assert.ok(mending.includes(L.book.gave), 'góp tài nguyên được Công Huân')
    paint(
      'WorldView',
      { game: { ...game, seat: null }, now, info, me: 1, snap: null, onpick: noop },
      'chưa có ảnh chụp, chưa có chỗ',
    )
    paint(
      'MapTab',
      {
        game,
        now,
        info,
        me: 1,
        watch: () => () => {},
        onpick: noop,
        onreports: noop,
        onrivals: noop,
        onraid: noop,
        send: async () => ({ ok: true }),
      },
      'tab bản đồ',
    )
    for (const pick of picks)
      paint(
        'TileSheet',
        { game, now, info, atlas: a, me: 1, snap, pick, onclose: noop, onraid: noop, send: async () => ({ ok: true }) },
        `chạm ${pick.kind} ${JSON.stringify(pick)}`,
      )
    // Tổng đà của minh khác đang dựng ở ô (3, 4): tên, giờ xong, độ bền theo FORT_HP
    const forted = {
      ...snap,
      allies: [{ id: 3, tag: 'VK' }],
      flags: [{ id: 5, aid: 3, x: 3, y: 4, done: now + 3_600_000, fort: true }],
    }
    const fortSheet = paint(
      'TileSheet',
      {
        game,
        now,
        info,
        atlas: a,
        me: 1,
        snap: forted,
        pick: { kind: 'tile', x: 3, y: 4 },
        onclose: noop,
        onraid: noop,
        send: async () => ({ ok: true }),
      },
      'Tổng đà',
    )
    assert.ok(fortSheet.includes(L.world.terr.fort('VK')), 'bảng chạm Tổng đà')
    // phù dời núi: Di Sơn Phù ở bảng chạm tông môn mình, Càn Khôn Phù ở ô trống vùng đã mở
    const porter = { ...game, items: { ...game.items, diSon: 1, canKhon: 2 } }
    const porterSheet = (pick: object) =>
      paint(
        'TileSheet',
        {
          game: porter,
          now,
          info,
          atlas: a,
          me: 1,
          snap,
          pick,
          onclose: noop,
          onraid: noop,
          send: async () => ({ ok: true }),
        },
        `phù dời núi ${JSON.stringify(pick)}`,
      )
    assert.ok(porterSheet({ kind: 'seat', pid: 1 }).includes(L.world.terr.diSon(1)), 'Di Sơn Phù trên tông môn mình')
    const home = porter.seat!
    assert.ok(
      porterSheet({ kind: 'tile', x: home.x + 3, y: home.y + 3 }).includes(L.world.terr.canKhon(2)),
      'Càn Khôn Phù ở ô trống',
    )
    // cướp khoáng: đội tông môn khác đang khai ở mỏ → danh sách + nút cướp; chạm đội đó → thấy đang khai
    const dig = {
      pid: 2,
      id: 5,
      startAt: now - 60_000,
      arriveAt: now - 1000,
      returnAt: now + 3_600_000,
      path: [{ x: mine.x - 3, y: mine.y }, mine],
      spot: 'mine',
      dig: now + 1_800_000,
      might: 1234,
    }
    const digSnap = { ...snap, marches: [...snap.marches, dig] }
    const sheetAt = (pick: object) =>
      paint(
        'TileSheet',
        {
          game,
          now,
          info,
          atlas: a,
          me: 1,
          snap: digSnap,
          pick,
          onclose: noop,
          onraid: noop,
          send: async () => ({ ok: true }),
        },
        `cướp khoáng: chạm ${JSON.stringify(pick)}`,
      )
    assert.equal(sheetAt({ kind: 'point', i: mine.i }).includes(L.world.diggers), game.levels.chuDien >= PVP_HALL)
    assert.ok(
      sheetAt({ kind: 'march', pid: 2, id: 5 }).includes(L.world.digging('|').split('|')[0]),
      'đội đang khai, không phải đang về',
    )
    // trong minh, là minh chủ: chia sẻ toạ độ vào chat và đặt / gỡ dấu cho cả minh
    const ally = {
      id: 1,
      name: 'Thanh Vân Minh',
      tag: 'TVM',
      notice: '',
      at: now,
      helps: [],
      people: [],
      rallies: [],
      members: { 1: 2 } as Record<number, 0 | 1 | 2>,
      marks: [{ x: 3, y: 4, text: 'Tập trung', by: 1, at: now }],
    }
    const sheet = paint(
      'TileSheet',
      {
        game,
        now,
        info,
        atlas: a,
        me: 1,
        snap,
        ally,
        onclose: noop,
        onraid: noop,
        pick: { kind: 'tile', x: 3, y: 4 },
        send: async () => ({ ok: true }),
        say: async () => ({ ok: true }),
      },
      'minh chủ chạm ô có dấu',
    )
    assert.ok(sheet.includes(L.world.shareAlly) && sheet.includes(L.world.unmark), 'chia sẻ + gỡ dấu')
    // lãnh thổ: trận kỳ minh khác (đang bị đánh dở) → nút phá; ô trong lãnh thổ minh mình → cắm cờ / dời tông môn
    const flagged = {
      ...snap,
      allies: [
        { id: 1, tag: 'TVM' },
        { id: 2, tag: 'HMT' },
      ],
      flags: [{ id: 9, aid: 2, x: 20, y: 20, done: now - 1, hp: 12_000, hit: now - 60_000 }],
    }
    const enemy = paint(
      'TileSheet',
      {
        game,
        now,
        info,
        atlas: a,
        me: 1,
        snap: flagged,
        ally,
        onclose: noop,
        onraid: noop,
        pick: { kind: 'tile', x: 20, y: 20 },
        send: async () => ({ ok: true }),
      },
      'trận kỳ minh khác',
    )
    assert.ok(enemy.includes(L.world.terr.flag('HMT')) && enemy.includes(L.world.terr.hp(40)), 'cờ địch: hiệu + độ bền')
    const own = paint(
      'TileSheet',
      {
        game,
        now,
        info,
        atlas: a,
        me: 1,
        snap: {
          ...flagged,
          flags: [{ id: 8, aid: 1, x: 22, y: 22, done: now - 1, guard: [2, 5400] as [number, number] }],
        },
        ally,
        onclose: noop,
        onraid: noop,
        pick: { kind: 'tile', x: 22, y: 22 },
        send: async () => ({ ok: true }),
      },
      'trận kỳ minh mình có quân giữ',
    )
    assert.ok(
      own.includes(L.world.terr.guards(2, (5400).toLocaleString(lang))) && own.includes(L.world.terr.guard),
      'cờ minh mình: quân giữ + nút đóng quân',
    )
    paint(
      'WorldView',
      { game, now, info, me: 1, snap, allies: [3], marks: ally.marks, goto: { x: 3, y: 4 }, onpick: noop },
      'bản đồ giới có dấu của minh, vừa nhảy tới ô',
    )
  }
})

test('tranh vẽ tay trong manifest thay hình vẽ bằng code, gỡ ra thì về như cũ', async () => {
  await load('vi')
  const { setArt } = await vite.ssrLoadModule('@rok/art')
  const [, s] = STATES[0]
  const props = {
    game: s,
    now: s.time,
    tab: 'tongMon',
    gain: null,
    onclaim: noop,
    onquest: noop,
    onbuilder: noop,
    ontab: noop,
    onsettings: noop,
    ondaily: noop,
  }
  setArt({ 'face:master': { src: '/art/face-master.webp' } })
  try {
    assert.ok(
      paint('Hud', props, 'có tranh chân dung').includes('/art/face-master.webp'),
      'chân dung chưởng môn lấy từ manifest',
    )
  } finally {
    setArt({})
  }
  assert.ok(!paint('Hud', props, 'không tranh').includes('/art/face-master.webp'))
})
