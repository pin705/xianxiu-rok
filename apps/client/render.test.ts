// Render mọi màn hình ở nhiều trạng thái game, không cần trình duyệt: Vite biên dịch component cho SSR, svelte/server
// vẽ ra HTML. $effect/onMount không chạy, nhưng mọi phần vẽ theo state thì có — bắt lỗi vỡ lúc vẽ (vd. key trùng,
// đọc thuộc tính của undefined) và chữ hỏng lọt ra màn hình (NaN, undefined, [object Object]) trước khi tới người chơi.
import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
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
  type Target,
} from '@rok/rules'

const root = fileURLToPath(new URL('.', import.meta.url))
let vite: ViteDevServer
const C: Record<string, any> = {}
let L: any
let render: (c: any, o: { props: Record<string, unknown> }) => { body: string } // lấy qua Vite: cùng bản runtime với component

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
const levels = (s: State, lv: number, hall = lv) =>
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
    levels: levels(fresh, 6, 7),
    res: rich,
    troops: { ...fresh.troops, kiem1: 400, phap2: 120, the2: 80, the3: 10 },
    wounded: { ...fresh.wounded, kiem1: 25 },
    elders: { thanhPhong: expAt(9), thachKien: expAt(4), nhuYen: 0 },
    items: { tuKhi: 3, boiNguyen: 2, doKiep: 1 },
    beast: 6,
    sects: [true, false, false, false, false],
    realms: [5, 1, 0],
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
  levels: levels(fresh, 5),
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
const trib10: State = { ...mid, levels: levels(mid, 10), trib: 1, marches: [] }
const late: State = {
  ...mid,
  levels: levels(mid, 15),
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
const STATES: [string, State][] = [
  ['người mới', fresh],
  ['giữa game', mid],
  ['chờ độ kiếp 5', trib5],
  ['sau độ kiếp', afterTrib],
  ['chờ độ kiếp 10', trib10],
  ['tầng 15', late],
]

// Trợ năng: nút/ô nhập phải có tên cho trình đọc màn hình (chữ bên trong hoặc aria-label) — nút chỉ có icon hay quên
function unnamed(html: string) {
  const out: string[] = []
  for (const m of html.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/g)) {
    const text = m[2].replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '').trim()
    if (!text && !/aria-label="[^"]+"/.test(m[1])) out.push(m[0].slice(0, 140))
  }
  for (const m of html.matchAll(/<(input|textarea)([^>]*)>/g))
    if (!/aria-label="[^"]+"|placeholder="[^"]+"|type="(checkbox|file)"/.test(m[2])) out.push(m[0].slice(0, 140))
  return out
}

function paint(name: string, props: Record<string, unknown>, label: string) {
  let body = ''
  assert.doesNotThrow(() => (body = render(C[name], { props }).body), `${name} vỡ khi vẽ (${label})`)
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
    for (const f of L.naming.first) for (const l of L.naming.last) assert.ok(`${f} ${l}`.length <= 20, `tên gợi ý quá dài (tối đa 20): ${f} ${l}`)
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
        for (const view of [null, 'upgrade', 'train', 'alchemy', 'library'])
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
      render(C.Panel, {
        props: {
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
        },
      }).body
    assert.ok(panel(trib5, 'chuDien').includes(L.trib.title), 'Chủ điện tầng 5 phải hiện độ kiếp')
    assert.ok(panel(late, 'chuDien').includes(L.rebirth.title), 'Chủ điện tầng 15 phải hiện luân hồi')
    assert.ok(panel(late, 'chuDien').includes(L.rebirth.gain(late.rebirths + 1)), 'luân hồi phải nói rõ thưởng kiếp sau (căn cơ)')
    const poor: State = { ...trib10, res: { linhThach: 500, linhThao: 500, linhKhoang: 500 }, levels: { ...trib10.levels, tangBaoCac: 2 } }
    assert.ok(panel(poor, 'chuDien').includes(L.b.tangBaoCac.name), 'chi phí vượt sức chứa: phải chỉ đường tới Tàng Bảo Các')
    assert.ok(!panel(trib10, 'chuDien').includes(L.panel.store('', 0).slice(0, 12)), 'đủ tiền thì không nhắc kho')
    assert.ok(panel(mid, 'dienVoTruong').includes(L.train.pick), 'Diễn võ trường mở sẵn thẻ tuyển')
    assert.ok(panel(mid, 'dienVoTruong', 'upgrade').includes(L.panel.upgrade))
  }
})

test('bản đồ, mục tiêu, chiến báo, phát lại, kết quả', async () => {
  for (const lang of LANGS) {
    await load(lang)
    for (const [label, s] of STATES) {
      const now = s.time + 5000
      paint('MapView', { game: s, now, onpick: noop, onreports: noop }, label)
      paint('Reports', { game: s, open: true, onclose: noop, onopen: noop }, label)
      const targets: Target[] = [
        ...BEASTS.map((_, i) => ({ kind: 'beast', i }) as Target),
        ...SECTS.map((_, i) => ({ kind: 'sect', i }) as Target),
        ...REALMS.map((_, i) => ({ kind: 'realm', i }) as Target),
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
    assert.ok(mid.reports.length >= 2 && afterTrib.reports.at(-1)!.fights.length === 3, 'dữ liệu thử phải có đủ loại chiến báo')
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
    paint(
      'Result',
      {
        outcome: { kind: 'rebirth', n: 3 },
        game: late,
        onclose: noop,
        onreplay: noop,
      },
      'luân hồi',
    )
  }
})

test('môn hạ, bảo khố, nhiệm vụ ngày, cài đặt', async () => {
  for (const lang of LANGS) {
    await load(lang)
    for (const [label, s] of STATES) {
      const now = s.time + 5000
      paint('Disciples', { game: s, now, act, onfocus: noop }, label)
      paint('Vault', { game: s, now, act, onfocus: noop }, label)
      paint('Daily', { game: s, now, open: true, onclose: noop, act }, label)
      const settings = paint(
        'Settings',
        {
          game: s,
          open: true,
          muted: false,
          onclose: noop,
          onmute: noop,
          onload: noop,
          toast: noop,
        },
        label,
      )
      assert.ok(
        L.guide.items.every(([q]: [string]) => settings.includes(q)),
        'Cài đặt phải có đủ mục Cẩm nang',
      )
    }
  }
})
