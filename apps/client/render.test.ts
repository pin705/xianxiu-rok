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
  advance,
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
    'Rivals',
    'Ranks',
    'Alliance',
    'Chat',
    'world/WorldView',
    'world/MapTab',
    'TileSheet',
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
  return body
}

test('màn tiêu đề, núi và HUD ở mọi trạng thái', async () => {
  for (const lang of LANGS) {
    await load(lang)
    paint('Title', { mode: 'first', onstart: noop, ondone: noop }, 'lần đầu')
    paint('Title', { mode: 'splash', onstart: noop, ondone: noop }, 'quay lại')
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
      for (const report of s.reports as Report[])
        paint('Replay', { report, onclose: noop }, `${label}, chiến báo ${report.kind} ${report.i}`)
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

test('tiên minh, chat', async () => {
  const people = [
    { pid: 1, name: 'Lạc Hà Tông', role: 2 as const, hall: 12, power: 9000, online: true },
    { pid: 2, name: 'Huyết Kiếm Tông', role: 0 as const, hall: 10, power: 7000, online: false },
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
    rallies: [{ id: 1, ally: 1, by: 1, i: 3, task: 'hit' as const, at: late.time + 600_000 }],
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
          rows: [{ id: 1, name: 'Thanh Vân Minh', tag: 'TVM', n: 2, power: 16000 }],
          send: async () => ({ ok: true }),
        },
        `${label}, chưa vào minh`,
      )
      const inside = paint(
        'Alliance',
        { game: s, me: 1, ally: info, rows: null, send: async () => ({ ok: true }) },
        `${label}, trong minh`,
      )
      assert.ok(inside.includes(L.ally.helpAll(1)), 'có người nhờ giúp thì nút giúp tất cả đếm đúng')
      paint('Chat', { game: s, me: 1, ally: true, api, act, toast: noop, inline: true }, `${label}, chat trong trang`)
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
    { kind: 'tile', x: 3, y: 4 },
  ]
  for (const lang of LANGS) {
    await load(lang)
    paint('WorldView', { game, now, info, me: 1, snap, allies: [3], onpick: noop }, 'bản đồ giới')
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
  }
})
