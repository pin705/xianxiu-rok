// Test tích hợp: server thật (Fastify + Socket.IO) + Postgres thật (npm run db). Mỗi lần chạy một database tạm, xoá khi xong.
// Không có Postgres: bỏ qua — trừ khi CI=1 (CI phải chạy đủ).
import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import postgres from 'postgres'
import { io, type Socket } from 'socket.io-client'
import { DAY, DAY_OFFSET, VEIN_HOLD, dayOf, expAt, type Action, type State } from '@rok/rules'
import { atlas, regionOf } from '@rok/rules/world'
import type { Ack, Answer, ClientToServer, Push, Query, QueryOf, Refuse, ServerToClient, Welcome } from '@rok/protocol'
import { buildServer } from './src/app.ts'
import { loadConfig } from './src/config.ts'
import { prune } from './src/db/store.ts'

const PG_ADMIN = process.env.DATABASE_URL ?? 'postgres://rok:rok@127.0.0.1:5439/rok'
const NAME = `rok_t_${randomBytes(4).toString('hex')}`
const URL = Object.assign(new globalThis.URL(PG_ADMIN), { pathname: `/${NAME}` }).toString()
let up = true
try {
  const admin = postgres(PG_ADMIN, { max: 1, connect_timeout: 3, onnotice: () => {} })
  await admin.unsafe(`create database "${NAME}"`)
  await admin.end()
} catch {
  up = false
}
if (!up && process.env.CI) throw new Error(`CI cần Postgres ở ${PG_ADMIN}`)
const skip = !up && 'không có Postgres (npm run db)'

type Node = Awaited<ReturnType<typeof buildServer>> & { port: number; path: string }
const nodes: Node[] = []
// name: đường node — mỗi test một tên (hai node trùng tên sẽ giành lease của nhau); chỉ test khởi động lại dùng lại tên
async function boot(
  name: string,
  env: Record<string, string> = {},
  hooks: Parameters<typeof buildServer>[1] = {},
): Promise<Node> {
  const path = `/${name}/socket.io`
  const s = await buildServer(
    loadConfig({
      NODE_ENV: 'test',
      DATABASE_URL: URL,
      NODE_PATH: path,
      ALLOW_WARP: '1',
      COMMIT_MS: '5',
      LOG_LEVEL: process.env.TEST_LOG ?? 'silent',
      REBALANCE: 'off',
      LIMITS: 'off',
      ...env,
    }),
    hooks,
  )
  await s.app.listen({ port: 0, host: '127.0.0.1' })
  const n = { ...s, port: (s.app.server.address() as { port: number }).port, path }
  nodes.push(n)
  return n
}
let a: Node
before(async () => {
  if (!skip) a = await boot('a')
})
after(async () => {
  for (const n of nodes) await n.app.close().catch(() => {})
  if (skip) return
  const admin = postgres(PG_ADMIN, { max: 1, onnotice: () => {} })
  await admin.unsafe(`drop database if exists "${NAME}" with (force)`)
  await admin.end()
})

const api = (n: Node, path: string, body?: object, token?: string) =>
  fetch(`http://127.0.0.1:${n.port}/api${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', 'x-rok': '1', ...(token && { authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  })
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
// Chờ tới khi f() đúng (tối đa ms); trả kết quả lần thử cuối
async function until(f: () => boolean | Promise<boolean>, ms = 5000, every = 50) {
  for (const t0 = Date.now(); Date.now() - t0 < ms; await sleep(every)) if (await f()) return true
  return f()
}
// Công cụ dev (ALLOW_WARP): state của chính người chơi và giờ của giới
const getState = async (n: Node, token: string) =>
  (await (await api(n, '/dev/state', undefined, token)).json()) as { now: number; state: State }
// Mọi công trình ở tầng lv
const allLevels = (levels: State['levels'], lv: number) =>
  Object.fromEntries(Object.keys(levels).map(k => [k, lv])) as State['levels']
// Giới riêng cho test cần cô lập (mỗi giới do đúng một node giữ)
// Trưởng lão cấp 40: trận dung (MARCH_CAP) đủ cho các đội lớn trong test
const VETERAN = expAt(40)
const newWorld = async (n: Node) =>
  (await n.db.client`insert into worlds (seed) values (7) returning id`)[0].id as number
// Ô kề cùng vùng với p trên giới thử (seed 7): đi cướp thẳng, không qua cổng (cổng chưa mở thì "far")
const beside = (p: { x: number; y: number }) => {
  const map = atlas(7)
  return [
    { x: p.x + 1, y: p.y },
    { x: p.x - 1, y: p.y },
    { x: p.x, y: p.y + 1 },
    { x: p.x, y: p.y - 1 },
  ].find(q => regionOf(map, q) === regionOf(map, p))!
}
async function guest(n: Node, name = `Tông ${randomBytes(3).toString('hex')}`, world?: number) {
  const r = await api(n, '/guest', { name, lang: 'vi', world })
  return { status: r.status, ...((await r.json()) as object) } as {
    status: number
    token: string
    pid: number
    world: number
    error?: string
  }
}
const row = async (n: Node, pid: number) =>
  (await n.db.client`select state, hall, power from players where id = ${pid}`)[0]

// Client thử (socket.io-client thật): gom mọi sự kiện server đẩy xuống
function client(n: Node, token: string, protocol = n.protocol) {
  const s: Socket<ServerToClient, ClientToServer> = io(`http://127.0.0.1:${n.port}`, {
    path: n.path,
    auth: { token, protocol, build: 'test', lang: 'vi' },
    transports: ['websocket'],
    reconnection: false,
    forceNew: true,
  })
  const pushes: Push[] = []
  const frames: string[] = []
  s.on('s', p => pushes.push(p))
  s.onAny((_, ...args) => frames.push(JSON.stringify(args)))
  const welcome = new Promise<Welcome>((ok, no) => {
    s.once('welcome', ok)
    s.once('connect_error', e => no(Object.assign(new Error(e.message), { data: (e as { data?: Refuse }).data })))
  })
  const act = async (action: Action | Record<string, unknown>) => {
    const r = await s.timeout(5000).emitWithAck('act', action as Action)
    frames.push(JSON.stringify(r))
    return r as Ack
  }
  // 10 giây: cả bộ test chạy song song (rules, client, server) thì actor giải trận chậm hơn lúc chạy riêng
  const push = async (pred: (p: Push) => boolean = () => true, ms = 10_000) => {
    for (const t0 = Date.now(); Date.now() - t0 < ms; await sleep(20)) {
      const i = pushes.findIndex(pred)
      if (i >= 0) return pushes.splice(i, 1)[0]
    }
    throw new Error('hết giờ chờ patch')
  }
  // truy vấn đúng kiểu trả lời (Answer[k] của @rok/protocol)
  const ask = async <K extends Query['k']>(q: QueryOf<K>) => (await s.timeout(5000).emitWithAck('get', q)) as Answer[K]
  return { s, welcome, act, ask, push, pushes, frames, close: () => s.close() }
}

test('migration chạy lại trên schema đã có: không làm gì, không lỗi', { skip }, async () => {
  const { migrate } = await import('./src/db/index.ts')
  await migrate(a.db)
})

test('khách → bắt tay → thao tác → ack đã ghi DB; payload bẩn bị từ chối; không lộ mầm', { skip }, async () => {
  const g = await guest(a)
  assert.equal(g.status, 200)
  const c = client(a, g.token)
  const w = await c.welcome
  assert.equal(w.state.seed, 0)
  assert.equal(w.me.pid, g.pid)
  const ack = await c.act({ type: 'upgrade', building: 'tuLinhTran' })
  assert.ok(ack.ok && ack.v === w.v + 1)
  assert.deepEqual(ack.ok && ack.p?.queue?.map(j => j.building), ['tuLinhTran'])
  // ack chỉ gửi sau commit: DB đã có
  const r = await row(a, g.pid)
  assert.equal(r.state.queue[0].building, 'tuLinhTran')
  assert.ok(r.state.seed > 0, 'server giữ mầm thật')
  assert.deepEqual(await c.act({ type: 'daily', i: '0' }), { ok: false, err: 'bad' })
  assert.deepEqual(await c.act({ type: 'feed', elder: 'constructor', n: 1 }), { ok: false, err: 'bad' })
  assert.deepEqual(await c.act({ type: 'realm', i: 0, elder: 'thanhPhong', army: { kiem1: 1 } }), {
    ok: false,
    err: 'locked',
  })
  for (const f of c.frames) assert.ok(!/"seed":[1-9]/.test(f), `lộ mầm: ${f.slice(0, 120)}`)
  c.close()
})

test('tên trùng trong cùng giới, tên bẩn, thiếu header chống CSRF đều bị từ chối', { skip }, async () => {
  assert.equal((await guest(a, 'Trùng Tên Tông')).status, 200)
  assert.equal((await guest(a, 'trùng   tên tông')).status, 409)
  assert.equal((await guest(a, 'x')).status, 400)
  assert.equal((await guest(a, '<script>')).status, 400)
  // đạo thống chọn trên màn lập tông môn: lưu vào state; mã lạ bị từ chối
  const d = await api(a, '/guest', { name: `Tông ${randomBytes(3).toString('hex')}`, lang: 'vi', dao: 'maTong' })
  const dp = ((await d.json()) as { pid: number }).pid
  assert.equal(((await row(a, dp)).state as State).dao?.id, 'maTong')
  assert.equal((await api(a, '/guest', { name: 'Đạo Lạ Tông', lang: 'vi', dao: 'xx' })).status, 400)
  assert.equal((await guest(a, 'Tông Đéo Gì')).status, 400, 'tên có từ tục')
  const r = await fetch(`http://127.0.0.1:${a.port}/api/guest`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"name":"Không Header"}',
  })
  assert.equal(r.status, 403)
  assert.deepEqual(await (await api(a, '/me')).json(), { account: null, pid: null, world: null, path: a.path })
})

test('phiên còn dùng thì dọn đêm không xoá (seen_at dời lên); phiên bỏ quá 180 ngày thì xoá', { skip }, async () => {
  const used = await guest(a),
    left = await guest(a)
  await a.db
    .client`update sessions set seen_at = now() - interval '200 days' where account_id in (select account_id from players where id in (${used.pid}, ${left.pid}))`
  assert.equal(((await (await api(a, '/me', undefined, used.token)).json()) as { pid: number }).pid, used.pid)
  await prune(a.db.db)
  assert.equal(((await (await api(a, '/me', undefined, used.token)).json()) as { pid: number | null }).pid, used.pid)
  assert.equal(((await (await api(a, '/me', undefined, left.token)).json()) as { pid: number | null }).pid, null)
})

test(
  'khách chỉ tự chọn giới được khi bật công cụ dev (ALLOW_WARP): production luôn xếp theo chỗ trống',
  { skip },
  async () => {
    const n = await boot('pick', { ALLOW_WARP: '0' })
    const w = await newWorld(n)
    const g = await guest(n, undefined, w)
    assert.equal(g.status, 200)
    assert.notEqual(g.world, w)
  },
)

test(
  'hai tab: tab gửi nhận ack, tab kia nhận patch cùng version; sai mã giao thức bị mời tải bản mới',
  { skip },
  async () => {
    const g = await guest(a)
    const x = client(a, g.token),
      y = client(a, g.token)
    await x.welcome
    await y.welcome
    const ack = await x.act({ type: 'upgrade', building: 'linhDien' })
    assert.ok(ack.ok)
    const p = await y.push(q => q.v === ack.v) // patch khác của cả giới (buff linh triều…) có thể tới trước
    assert.equal(p.v, ack.ok && ack.v)
    assert.deepEqual(p.p, ack.ok && ack.p)
    // (patch lúc tab y nối vào — đưa state tới giờ hiện tại — thì tab x được nhận; bản sao của ack thì không)
    assert.ok(!x.pushes.some(q => ack.ok && q.v === ack.v), 'tab gửi không nhận trùng patch')
    const z = client(a, g.token, 'ban-cu')
    await assert.rejects(z.welcome, (e: { data?: Refuse }) => e.data?.reason === 'protocol')
    x.close()
    y.close()
    z.close()
  },
)

test(
  'trận PvE tới nơi: server đẩy chiến báo đúng lúc (client không biết mầm nên không tự giải)',
  { skip },
  async () => {
    const g = await guest(a)
    const c = client(a, g.token)
    const w = await c.welcome
    const st = {
      ...(await row(a, g.pid)).state,
      levels: { ...w.state.levels, chuDien: 3 },
      troops: { ...w.state.troops, kiem1: 200 },
    }
    assert.equal((await api(a, '/dev/state', { state: st }, g.token)).status, 200)
    await c.push()
    const ack = await c.act({
      type: 'march',
      target: { kind: 'beast', i: 0 },
      elder: 'thanhPhong',
      army: { kiem1: 100 },
    })
    assert.ok(ack.ok)
    assert.equal(ack.ok && ack.p?.marches?.[0].seed, 0, 'mầm của đội không lộ')
    await api(a, '/dev/warp', { min: 10 }, g.token)
    const p = await c.push(m => !!m.rep?.length)
    assert.equal(p.rep![0].kind, 'beast')
    assert.ok(p.rep![0].win)
    const list = await c.ask({ k: 'reports' })
    assert.equal(list.length, 1)
    c.close()
  },
)

test('Hồi Quy Lễ: vắng từ 7 ngày, lần vào lại có thư quà chào mừng; vắng ngắn thì không', { skip }, async () => {
  const g = await guest(a)
  const c1 = client(a, g.token)
  await c1.welcome
  c1.close()
  await sleep(300) // server lưu lát "lúc rời game"
  await api(a, '/dev/warp', { min: 8 * 24 * 60 }, g.token)
  const c2 = client(a, g.token)
  const w2 = await c2.welcome
  const back = w2.state.mail.filter(m => m.k === 'back')
  assert.equal(back.length, 1, 'có thư Hồi Quy Lễ')
  assert.ok(back[0].gift?.items?.thoiQuang180)
  c2.close()
  await sleep(300)
  const c3 = client(a, g.token)
  const w3 = await c3.welcome
  assert.equal(w3.state.mail.filter(m => m.k === 'back').length, 1, 'vắng ngắn: không thêm')
  c3.close()
})

test(
  'Tông Môn Tranh Bá: qua 0h, top điểm riêng của ải hôm trước nhận quà ải qua thư (mỗi ải một lần); bảng có thêm bảng ải',
  { skip },
  async () => {
    const g = await guest(a, undefined, await newWorld(a))
    const c = client(a, g.token)
    await c.welcome
    // tua tới 10h thứ Hai kế tiếp (giờ VN): ải 1 — luyện binh
    const { now } = await getState(a, g.token)
    const day = dayOf(now)
    const mon = (day + ((7 - ((day - 4) % 7)) % 7 || 7)) * DAY - DAY_OFFSET + 10 * 3_600_000
    await api(a, '/dev/warp', { min: Math.ceil((mon - now) / 60_000) }, g.token)
    assert.ok((await c.act({ type: 'login' })).ok) // state tới thứ Hai: mở lượt Tranh Bá mới
    const { state } = await getState(a, g.token)
    const st = { ...state, stats: { ...state.stats, trainPts: (state.stats.trainPts ?? 0) + 40 } }
    assert.equal((await api(a, '/dev/state', { state: st }, g.token)).status, 200)
    const live = await c.ask({ k: 'fest', id: 'tranhBa' })
    assert.deepEqual([live.stage?.k, live.stage?.me], [0, { rank: 1, pts: 40 }])
    await api(a, '/dev/warp', { min: 24 * 60 }, g.token)
    const stage = (await getState(a, g.token)).state.mail.filter(m => m.k === 'festStage')
    assert.deepEqual(
      stage.map(m => m.a),
      [[1, 'tranhBa', 1]],
      'hạng 1 ải 1, đúng một thư',
    )
    assert.ok(stage[0].gift?.items)
    const next = await c.ask({ k: 'fest', id: 'tranhBa' })
    assert.deepEqual(
      [next.stage?.k, next.stage?.me, next.me?.pts],
      [1, null, 40],
      'ải 2 chưa có điểm; bảng cả lượt giữ điểm',
    )
    await api(a, '/dev/warp', { min: 1 }, g.token)
    assert.equal((await getState(a, g.token)).state.mail.filter(m => m.k === 'festStage').length, 1, 'không trao lại')
    c.close()
  },
)

test('node khởi động lại (cùng đường node): nhận lại giới ngay, thao tác đã ack vẫn còn', { skip }, async () => {
  const b = await boot('b')
  const g = await guest(b, undefined, await newWorld(b))
  const c = client(b, g.token)
  await c.welcome
  assert.ok((await c.act({ type: 'upgrade', building: 'khoangMach' })).ok)
  // mô phỏng sập: không commit thêm, không nhả lease — process mới cùng đường node nhận lại giới
  for (const w of b.host.worlds.values()) {
    w.lost = true
    w.stop()
  }
  b.host.worlds.clear()
  c.close()
  const b2 = await boot('b')
  const c2 = client(b2, g.token)
  const w = await c2.welcome
  assert.deepEqual(
    w.state.queue.map(j => j.building),
    ['khoangMach'],
  )
  c2.close()
})

test('giới đang ở node khác: bắt tay bị chuyển hướng tới đúng node', { skip }, async () => {
  const g = await guest(a) // giới 1 do node a giữ
  await client(a, g.token).welcome
  const other = await boot('d')
  const c = client(other, g.token)
  await assert.rejects(c.welcome, (e: { data?: Refuse }) => e.data?.reason === 'moved' && e.data.path === a.path)
  c.close()
})

test('bị rào: node khác đã nhận giới (epoch tăng) thì node cũ không ghi được và đẩy client đi', { skip }, async () => {
  const g = await guest(a, undefined, await newWorld(a))
  const c = client(a, g.token)
  await c.welcome
  const bye = new Promise(ok => c.s.once('bye', ok))
  await a.db.client`update worlds set epoch = epoch + 1 where id = ${g.world}`
  c.act({ type: 'upgrade', building: 'linhDien' }).catch(() => {})
  assert.deepEqual(await bye, { reason: 'moved' })
  assert.equal((await row(a, g.pid)).state.queue.length, 0, 'không ghi được sau khi mất quyền')
})

test('giới hạn tần suất: spam thao tác bị từ chối "rate"', { skip }, async () => {
  const n = await boot('c', { LIMITS: 'on' })
  const g = await guest(n, undefined, await newWorld(n))
  const c = client(n, g.token)
  await c.welcome
  const results = await Promise.all(Array.from({ length: 60 }, () => c.act({ type: 'seen' })))
  assert.ok(results.some(r => !r.ok && r.err === 'rate'))
  c.close()
})

test('nạp giới: state bản cũ được nâng qua migrate(), state hỏng chỉ cách ly đúng người đó', { skip }, async () => {
  const w = await newWorld(a)
  const old = await guest(a, undefined, w)
  const broken = await guest(a, undefined, w)
  // sửa thẳng DB trước khi giới được nạp: một save bản 3 (trước tầng 16–25), một save rác
  const s = (await row(a, old.pid)).state
  for (const k of ['forge', 'gear', 'talents', 'buffs']) delete s[k]
  for (const u of ['kiem4', 'kiem5', 'phap4', 'phap5', 'the4', 'the5']) {
    delete s.troops[u]
    delete s.wounded[u]
  }
  delete s.levels.luyenKhiPhong
  await a.db
    .client`update players set state = ${JSON.stringify({ ...s, v: 3, realms: [0, 0, 0] })}::jsonb where id = ${old.pid}`
  await a.db.client`update players set state = ${JSON.stringify({ v: 99 })}::jsonb where id = ${broken.pid}`
  const c = client(a, old.token)
  const welcome = await c.welcome
  assert.equal(welcome.state.v, 4)
  assert.equal(welcome.state.troops.the5, 0)
  assert.deepEqual(welcome.state.realms, [0, 0, 0, 0, 0])
  assert.ok((await c.act({ type: 'upgrade', building: 'tuLinhTran' })).ok, 'người chơi bản cũ chơi tiếp được')
  assert.equal((await row(a, old.pid)).state.v, 4, 'ghi lại bằng khuôn mới')
  const b = client(a, broken.token)
  await assert.rejects(b.welcome, (e: { data?: Refuse }) => e.data?.reason === 'unavailable')
  c.close()
  b.close()
})

test(
  'cướp giữa hai người chơi: server giải trận lúc tới nơi, cả hai nhận chiến báo; đối thủ, xếp hạng, thư admin nhận quà một lần',
  { skip },
  async () => {
    const ADMIN = 'k'.repeat(32)
    const n = await boot('m', { ADMIN_TOKEN: ADMIN })
    const w = await newWorld(n)
    const A = await guest(n, undefined, w),
      B = await guest(n, undefined, w)
    const ca = client(n, A.token),
      cb = client(n, B.token)
    await Promise.all([ca.welcome, cb.welcome])
    // dựng hai tông môn tầng 10, hết khiên tân thủ (công cụ dev)
    // giới vừa mở (pha Khai giới: cổng chưa mở) → đặt hai tông môn cùng vùng, sát nhau
    const setup = async (token: string, troops: object, seat?: { x: number; y: number }) => {
      const { state } = await getState(n, token)
      const levels = allLevels(state.levels, 10)
      const res = { linhThach: 2e5, linhThao: 2e5, linhKhoang: 2e5 }
      assert.equal(
        (
          await api(
            n,
            '/dev/state',
            {
              state: {
                ...state,
                levels,
                res,
                shield: 0,
                troops: { ...state.troops, ...troops },
                elders: { ...state.elders, thanhPhong: VETERAN }, // trận dung đủ mang cả đội
                ...(seat && { seat }),
              },
            },
            token,
          )
        ).status,
        200,
      )
      return state.seat as { x: number; y: number }
    }
    const seatA = await setup(A.token, { kiem3: 1100 })
    assert.ok(seatA, 'vào giới là có chỗ trên bản đồ')
    await setup(B.token, { the1: 200 }, beside(seatA))
    const rivals = await ca.ask({ k: 'rivals' })
    assert.ok(
      rivals.some(r => r.pid === B.pid && r.scout.side.troops.length),
      'đối thủ có dò thám',
    )
    const ack = await ca.act({ type: 'raid', pid: B.pid, elder: 'thanhPhong', army: { kiem3: 1100 } })
    assert.ok(ack.ok && ack.p?.marches, JSON.stringify(ack))
    const m = ack.p!.marches!.at(-1)!
    assert.equal(m.returnAt, 0)
    assert.equal(m.path?.length, 2, 'cùng vùng: đi thẳng')
    const fest = await ca.ask({ k: 'fest', id: 'tranhBa' })
    assert.ok(fest && Array.isArray(fest.top) && !fest.allies, 'bảng Tông Môn Tranh Bá trả lời được')
    const clarion = await ca.ask({ k: 'fest', id: 'tramYeu' })
    assert.ok(Array.isArray(clarion.allies), 'Trảm Yêu Lệnh có thêm bảng tiên minh')
    const reign = await ca.ask({ k: 'fest', id: 'gioiChu' })
    assert.ok(Array.isArray(reign.top) && !reign.allies, 'Giới Chủ Tranh Phong: bảng theo lượt của mùa')
    const map = await ca.ask({ k: 'map' })
    assert.ok(
      map.seats.some(x => x.pid === B.pid) && map.seats.filter(x => x.npc).length === 32,
      'bản đồ có mọi tông môn, kể cả 32 phân đà NPC',
    )
    assert.ok(
      map.marches.some(x => x.pid === A.pid),
      'bản đồ có đội đi cướp',
    )
    assert.equal(m.seed, 0, 'mầm trận cướp không rời server')
    const warn = await cb.push(p => !!p.p.incoming?.length)
    assert.equal(warn.p.incoming![0].pid, A.pid, 'tháp canh: bên bị cướp thấy đội đang kéo tới')
    assert.deepEqual(await ca.act({ type: 'raid', pid: B.pid, elder: 'thanhPhong', army: { kiem3: 1 } }), {
      ok: false,
      err: 'busy',
    })
    // tua tới lúc tới nơi: server tự giải trận (không ai phải thao tác)
    const { now } = await getState(n, A.token)
    await api(n, '/dev/warp', { min: Math.ceil((m.arriveAt - now) / 60_000) + 1 }, A.token)
    const pb = await cb.push(p => !!p.rep?.some(r => r.kind === 'pvp'))
    assert.equal(pb.rep![0].def, true)
    assert.equal(pb.rep![0].i, A.pid)
    const pa = await ca.push(p => !!p.rep?.some(r => r.kind === 'pvp'))
    assert.ok(pa.p.marches![0].returnAt > m.arriveAt)
    const rows = await n.db
      .client`select player_id, (body->>'def')::boolean as def from reports where kind = 'pvp' and player_id in (${A.pid}, ${B.pid})`
    assert.equal(rows.length, 2, 'cả hai chiến báo đã ghi')
    // chia sẻ chiến báo vào chat: ai nghe được tin (của chính người đánh, mang "#r<id>") thì xem được trận
    const rid = pa.rep!.find(r => r.kind === 'pvp')!.id
    const said = await ca.s.timeout(5000).emitWithAck('say', { ch: 'world', text: `Cướp thắng #r${rid}` })
    assert.ok(said.ok, JSON.stringify(said))
    assert.equal((await cb.ask({ k: 'shared', pid: A.pid, id: rid }))?.id, rid)
    assert.equal(await cb.ask({ k: 'shared', pid: A.pid, id: rid + 1 }), null, 'chưa chia sẻ thì không xem được')
    // xếp hạng tranh đoạt (cột chép từ state lúc commit)
    const rk = (await (await api(n, '/ranks/pvp', undefined, A.token)).json()) as {
      rows: { pid: number }[]
      me: { rank: number }
    }
    assert.ok(rk.rows.some(r => r.pid === A.pid) && rk.me.rank >= 1)
    const npcs = new Set(map.seats.filter(x => x.npc).map(x => x.pid))
    assert.ok(npcs.size && !rk.rows.some(r => npcs.has(r.pid)), 'tông môn NPC không lên bảng xếp hạng')
    assert.equal((await api(n, '/ranks/nope', undefined, A.token)).status, 400)
    // admin: số liệu có token mới xem được; thư có quà tới người chơi qua inbox, nhận đúng một lần
    const admin = (path: string, body?: object) =>
      fetch(`http://127.0.0.1:${n.port}/api/admin${path}`, {
        method: body ? 'POST' : 'GET',
        headers: { 'content-type': 'application/json', 'x-rok': '1', 'x-admin-token': ADMIN },
        body: body && JSON.stringify(body),
      })
    assert.equal((await api(n, '/admin/stats')).status, 401)
    assert.ok(Array.isArray(((await (await admin('/stats')).json()) as { cohorts: unknown[] }).cohorts))
    assert.equal(
      (
        await admin('/mail', {
          world: w,
          pid: B.pid,
          title: 'Chào',
          body: 'Quà',
          gift: { res: { linhThach: 777 }, items: { vang: 1 } },
        })
      ).status,
      400,
      'quà lạ bị chặn',
    )
    assert.equal(
      (await admin('/mail', { world: w, pid: B.pid, title: 'Chào', body: 'Quà', gift: { res: { linhThach: 777 } } }))
        .status,
      200,
    )
    const pm = await cb.push(p => !!p.p.mail?.length, 8000)
    const mail = pm.p.mail!.at(-1)!
    assert.deepEqual(mail.a, ['Chào', 'Quà'])
    const had = (await row(n, B.pid)).state.res.linhThach
    assert.ok((await cb.act({ type: 'mail', id: mail.id })).ok)
    assert.ok((await row(n, B.pid)).state.res.linhThach >= had + 777)
    assert.equal((await cb.act({ type: 'mail', id: mail.id })).ok, false, 'nhận lần hai bị từ chối')
    ca.close()
    cb.close()
  },
)

test(
  'tiên minh + chat: lập minh, người khác vào, nhờ giúp, kênh giới và kênh minh, lọc từ, giới hạn tần suất, tin lặp, cấm chat',
  { skip },
  async () => {
    const ADMIN = 'q'.repeat(32)
    const n = await boot('ally', { ADMIN_TOKEN: ADMIN })
    const w = await newWorld(n)
    const A = await guest(n, undefined, w),
      B = await guest(n, undefined, w)
    const ca = client(n, A.token),
      cb = client(n, B.token)
    await Promise.all([ca.welcome, cb.welcome])
    const { state } = await getState(n, A.token)
    await api(
      n,
      '/dev/state',
      {
        state: {
          ...state,
          levels: { ...state.levels, chuDien: 10 },
          res: { linhThach: 5e4, linhThao: 5e4, linhKhoang: 5e4 },
        },
      },
      A.token,
    )
    const allyEvents: number[] = []
    cb.s.on('ally', () => allyEvents.push(Date.now()))
    assert.deepEqual(
      await ca.act({ type: 'allyFound', name: 'Minh Vcl', tag: 'TVM' }),
      { ok: false, err: 'rude' },
      'tên minh có từ tục',
    )
    assert.ok((await ca.act({ type: 'allyFound', name: 'Thanh Vân Minh', tag: 'TVM' })).ok)
    assert.deepEqual(
      await ca.act({ type: 'allyNotice', text: 'đm cả minh' }),
      { ok: false, err: 'rude' },
      'bố cáo có từ tục',
    )
    const list = await cb.ask({ k: 'allies' })
    assert.equal(list[0].name, 'Thanh Vân Minh')
    assert.ok((await cb.act({ type: 'allyJoin', id: list[0].id })).ok)
    const info = await ca.ask({ k: 'ally' })
    assert.ok(info, 'đã vào minh')
    assert.deepEqual(
      info.people.map(p => [p.pid, p.role]).sort(),
      [
        [A.pid, 2],
        [B.pid, -2],
      ].sort(),
    )
    const rows = await n.db.client`select state->'world'->'allies' as a from worlds where id = ${w}`
    assert.ok(Object.keys(rows[0].a).length === 1, 'tiên minh đã ghi vào DB')
    // chat: kênh minh tới đúng người trong minh; lọc từ; tần suất; lặp lại; cấm chat
    const heard: { ch: string; text: string }[] = []
    cb.s.on('chat', m => heard.push(...m.ms.map(x => ({ ch: m.ch, text: x.text }))))
    const say = (c: typeof ca, ch: 'world' | 'ally' | 'camp', text: string) =>
      c.s.timeout(5000).emitWithAck('say', { ch, text }) as Promise<{ ok: boolean; err?: string }>
    assert.ok((await say(ca, 'ally', 'Họp lúc 8h, đm đến đúng giờ')).ok)
    assert.deepEqual(await say(ca, 'ally', 'Họp lúc 8h, đm đến đúng giờ'), { ok: false, err: 'dup' })
    await until(() => heard.length > 0, 1500)
    assert.equal(heard[0]?.text, 'Họp lúc 8h, ** đến đúng giờ')
    assert.equal(heard[0]?.ch, 'ally')
    assert.ok((await say(ca, 'world', 'một')).ok && (await say(ca, 'world', 'hai')).ok)
    assert.deepEqual(await say(ca, 'world', 'ba'), { ok: false, err: 'rate' }, '3 tin liền rồi phải chờ')
    const hist = await cb.ask({ k: 'chat', ch: 'ally' })
    assert.equal(hist.length, 1)
    assert.equal(await cb.s.timeout(5000).emitWithAck('report', { id: hist[0].id }), true)
    // truyền âm: chỉ hai người nghe, bên nhận thấy kênh 'p<người gửi>', có lịch sử và danh sách truyền âm; hồ sơ người khác
    await sleep(3100) // A vừa hết lượt nhắn
    const dm = (c: typeof ca, to: number, text: string) =>
      c.s.timeout(5000).emitWithAck('say', { ch: `p${to}`, text }) as Promise<{ ok: boolean; err?: string }>
    assert.ok((await dm(ca, B.pid, 'Chào đạo hữu')).ok)
    await until(() => heard.some(h => h.ch === `p${A.pid}`), 1500)
    assert.equal(heard.find(h => h.ch === `p${A.pid}`)?.text, 'Chào đạo hữu')
    assert.equal((await cb.ask({ k: 'chat', ch: `p${A.pid}` })).length, 1)
    assert.deepEqual(
      (await cb.ask({ k: 'dms' })).map(d => [d.pid, d.last.text]),
      [[A.pid, 'Chào đạo hữu']],
    )
    assert.deepEqual(await dm(cb, A.pid, 'chào'), { ok: false, err: 'locked' }, 'dưới tầng 3 chưa truyền âm được')
    assert.deepEqual(await dm(ca, A.pid, 'tự nhắn'), { ok: false, err: 'locked' })
    // nhóm chat tự tạo: A lập nhóm, thêm B; tin ở kênh g<id> tới B, người ngoài nhóm không vào được
    assert.ok((await ca.act({ type: 'groupNew', name: 'Họp đêm' })).ok)
    const [grp] = await ca.ask({ k: 'groups' })
    assert.ok((await ca.act({ type: 'groupAdd', id: grp.id, pid: B.pid })).ok)
    assert.deepEqual(
      (await cb.ask({ k: 'groups' })).map(x => [x.name, x.members.length]),
      [['Họp đêm', 2]],
    )
    await sleep(3100) // A vừa hết lượt nhắn
    assert.ok((await say(ca, `g${grp.id}` as 'world', 'Tối nay 8h')).ok)
    await until(() => heard.some(h => h.ch === `g${grp.id}`), 1500)
    assert.equal(heard.find(h => h.ch === `g${grp.id}`)?.text, 'Tối nay 8h')
    assert.equal((await cb.ask({ k: 'chat', ch: `g${grp.id}` })).length, 1)
    // thu hồi: chỉ người gửi (trong 2 phút); người nghe nhận lại tin cùng mã với chữ rỗng, lịch sử và DB cũng vậy
    const [gm] = await cb.ask({ k: 'chat', ch: `g${grp.id}` })
    assert.equal(await cb.s.timeout(5000).emitWithAck('unsay', { id: gm.id }), false, 'không thu hồi tin người khác')
    const heardN = heard.length
    assert.equal(await ca.s.timeout(5000).emitWithAck('unsay', { id: gm.id }), true)
    await until(() => heard.length > heardN, 1500)
    assert.deepEqual(heard.at(-1), { ch: `g${grp.id}`, text: '' })
    assert.equal((await cb.ask({ k: 'chat', ch: `g${grp.id}` }))[0].text, '')
    assert.equal(await ca.s.timeout(5000).emitWithAck('unsay', { id: gm.id }), false, 'đã thu hồi rồi')
    // kênh phái: cùng minh là cùng phái — tin ở kênh 'camp' tới người cùng phái, có lịch sử
    await sleep(3100)
    assert.ok((await say(ca, 'camp', 'Cả phái tập hợp ở Thiên Môn')).ok)
    await until(() => heard.some(h => h.ch === 'camp'), 1500)
    assert.equal(heard.find(h => h.ch === 'camp')?.text, 'Cả phái tập hợp ở Thiên Môn')
    assert.equal((await ca.ask({ k: 'chat', ch: 'camp' })).at(-1)?.text, 'Cả phái tập hợp ở Thiên Môn')
    const prof = await cb.ask({ k: 'profile', pid: A.pid })
    assert.deepEqual([prof?.name, prof?.hall, prof?.ally?.tag, prof?.online], [state.name, 10, 'TVM', true])
    assert.ok(prof?.supply && prof.supply.get > 0, 'cùng minh: hồ sơ có Vận Linh Trận')
    const gift = { linhThach: 100, linhThao: 0, linhKhoang: 0 }
    assert.deepEqual(
      await cb.act({ type: 'supply', to: A.pid, res: gift }),
      { ok: false, err: 'locked' },
      'dưới tầng 10',
    )
    assert.ok((await ca.act({ type: 'supply', to: B.pid, res: gift })).ok, 'Vận Linh Trận qua server')
    const mute = await fetch(`http://127.0.0.1:${n.port}/api/admin/mute`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-rok': '1', 'x-admin-token': ADMIN },
      body: JSON.stringify({ world: w, pid: B.pid, minutes: 60 }),
    })
    assert.equal(mute.status, 200)
    let t = 0
    const muted = await until(async () => (await say(cb, 'ally', `thử ${t++}`)).err === 'muted', 8000, 200)
    assert.ok(muted, 'cấm chat có hiệu lực qua inbox')
    const stored = await n.db.client`select count(*)::int as n from chat where world_id = ${w}`
    assert.ok(stored[0].n >= 3, 'tin chat đã ghi DB')
    const gone = await n.db.client`select text from chat where world_id = ${w} and id = ${gm.id}`
    assert.equal(gone[0]?.text, '', 'tin thu hồi ghi lại chữ rỗng')
    assert.ok(allyEvents.length > 0, 'người trong minh được báo khi minh đổi')
    ca.close()
    cb.close()
  },
)

test(
  'bản đồ giới: đi chiếm linh mạch trong vùng mình, đóng quân, được buff, ảnh chụp ghi người giữ, gọi về',
  { skip },
  async () => {
    const n = await boot('p')
    const w = await newWorld(n)
    const A = await guest(n, undefined, w)
    const c = client(n, A.token)
    const welcome = await c.welcome
    const geo = atlas(welcome.world.map)
    const { state } = await getState(n, A.token)
    assert.equal(state.seasonAt, welcome.world.opened, 'vào giới: gán lúc mở mùa (lễ theo ngày mùa)')
    // linh mạch trống trong vùng của mình (NPC cùng vùng có thể đã giữ một mạch — chọn mạch chưa ai giữ)
    const map0 = await c.ask({ k: 'map' })
    const vein = geo.points.find(
      p => p.kind === 'vein' && p.region === regionOf(geo, state.seat!) && !map0.spots.some(s => s.i === p.i && s.own),
    )
    assert.ok(vein, 'vùng nào cũng có linh mạch')
    // phân đà NPC cùng vùng cũng đi giữ mạch trống (có khi tới trước): mang đủ quân để thắng chắc đội đóng của chúng
    await api(
      n,
      '/dev/state',
      { state: { ...state, troops: { ...state.troops, kiem2: 3000 }, elders: { thanhPhong: VETERAN } } },
      A.token,
    )
    const ack = await c.act({ type: 'go', i: vein!.i, task: 'take', elder: 'thanhPhong', army: { kiem2: 3000 } })
    assert.ok(ack.ok, JSON.stringify(ack))
    const m = ack.p!.marches!.at(-1)!
    const now0 = welcome.now
    await api(n, '/dev/warp', { min: Math.ceil((m.arriveAt - now0) / 60_000) + 1 }, A.token)
    const held = await c.push(p => !!p.p.marches?.some(x => x.id === m.id && x.stay))
    assert.ok(held)
    // kỳ tranh chấp: giữ liên tục VEIN_HOLD mới thành phe kiểm soát, có tăng ích
    await api(n, '/dev/warp', { min: VEIN_HOLD / 60_000 + 1 }, A.token)
    const buffed = await c.push(p => !!p.p.buffs?.some(b => b.src === 'vein'), 8000)
    assert.ok(buffed, 'giữ đủ 4 giờ: phe kiểm soát được tăng ích')
    const map = await c.ask({ k: 'map' })
    assert.equal(map.spots.find(s => s.i === vein!.i)?.n, 1)
    assert.ok((await c.act({ type: 'recall', id: m.id })).ok)
    const map2 = await c.ask({ k: 'map' })
    assert.equal(map2.spots.find(s => s.i === vein!.i)?.own, undefined, 'gọi về hết quân: điểm trống')
    c.close()
  },
)

test(
  'độ kiếp công khai: có chỗ trên bản đồ thì kiếp vân tụ (cả giới thấy), server giải lúc giáng và đẩy chiến báo',
  { skip },
  async () => {
    const { TRIB_CLOUD } = await import('@rok/rules')
    const n = await boot('k')
    const w = await newWorld(n)
    const A = await guest(n, undefined, w)
    const c = client(n, A.token)
    const welcome = await c.welcome
    const { state } = await getState(n, A.token)
    assert.ok(state.seat, 'vào giới là có chỗ trên bản đồ')
    const levels = allLevels(state.levels, 5)
    await api(
      n,
      '/dev/state',
      {
        state: {
          ...state,
          levels,
          troops: { ...state.troops, kiem1: 300 },
          res: { linhThach: 5e4, linhThao: 5e4, linhKhoang: 5e4 },
        },
      },
      A.token,
    )
    await c.push()
    const ack = await c.act({ type: 'trib', elder: 'thanhPhong', army: { kiem1: 300 }, pill: false })
    assert.ok(ack.ok, JSON.stringify(ack))
    assert.equal(ack.ok && ack.rep, undefined, 'chưa giải ngay: kiếp vân đang tụ')
    const cloud = ack.p!.marches!.at(-1)!
    assert.equal(cloud.target.kind, 'trib')
    const map = await c.ask({ k: 'map' })
    assert.equal(map.seats.find(s => s.pid === A.pid)?.cloud, cloud.arriveAt)
    await api(n, '/dev/warp', { min: Math.ceil((cloud.arriveAt - welcome.now) / 60_000) + 1 }, A.token)
    const p = await c.push(x => !!x.rep?.some(r => r.kind === 'trib'), 8000)
    assert.equal(p.p.marches?.length, 0, 'kiếp giáng xong: đội về nhà')
    assert.equal(TRIB_CLOUD[0], cloud.arriveAt - cloud.startAt)
    c.close()
  },
)

test(
  'hết mùa: tới ngày 49 mọi người luân hồi, bản đồ mới, xếp chỗ lại, thư kết quả; client được mời nối lại; bảng điểm mùa',
  { skip },
  async () => {
    const { SEASON_DAYS } = await import('@rok/rules/world')
    const n = await boot('season')
    const w = await newWorld(n)
    const A = await guest(n, undefined, w)
    const c = client(n, A.token)
    const w1 = await c.welcome
    assert.equal(w1.world.season, 1)
    const board = await c.ask({ k: 'season' })
    const { camps, camp, stage, vote, bet, heroes, ...rest } = board as {
      camps: [number, number]
      camp: 0 | 1
      stage: { n: number; m: string; score: [number, number]; mine: number }
      vote: { open: boolean; tally: number[] }
      bet: { open: unknown[]; mine: unknown[] }
      heroes: { open: boolean; picks: unknown[]; mine: number[] }
    }
    assert.deepEqual(rest, { rows: [], me: null, fame: [] })
    assert.deepEqual(bet, { open: [], mine: [] }, 'Luận Kiếm Đặt Cược: đầu mùa chưa có playoff')
    assert.deepEqual(heroes, { open: false, picks: [], mine: [0, 0, 0, 0] }, 'Lưu Danh Sử Sách: đầu mùa chưa bình chọn')
    assert.deepEqual(await c.ask({ k: 'paper' }), { issues: [], gift: false }, 'Giới Báo: số đầu ra lúc 0h')
    assert.deepEqual(
      vote,
      { open: false, tally: [0, 0, 0] },
      'Thiên Mệnh Chọn Luật: đầu mùa chưa bỏ phiếu, chưa có luật',
    )
    assert.deepEqual([camps, [0, 1].includes(camp)], [[0, 0], true], 'Chính Tà: điểm hai phái, phái của mình')
    assert.deepEqual(
      [stage.n, stage.m, stage.score, stage.mine],
      [0, 'gather', [0, 0], 0],
      'chặng thi đua đầu mùa: khai mỏ',
    )
    const bye = new Promise<string>(ok => c.s.once('bye', m => ok(m.reason)))
    await api(n, '/dev/warp', { min: SEASON_DAYS * 24 * 60 + 5 }, A.token)
    assert.equal(await bye, 'season')
    c.close()
    const c2 = client(n, A.token)
    const w2 = await c2.welcome
    assert.equal(w2.world.season, 2)
    assert.notEqual(w2.world.map, w1.world.map, 'bản đồ mới')
    assert.equal(w2.state.rebirths, 1)
    assert.ok(w2.state.seat, 'có chỗ trên bản đồ mùa mới')
    assert.deepEqual(
      w2.state.mail.slice(-2).map((m: { k: string }) => m.k),
      ['season', 'yearbook'],
    )
    const [saved] = await n.db.client`select season, seed, state from worlds where id = ${w}`
    assert.equal(saved.season, 2)
    assert.equal(saved.seed, w2.world.map)
    assert.equal(saved.state.fame[0].season, 1)
    c2.close()
  },
)

test(
  'chợ: treo bán, người khác thấy và mua, người bán nhận thư tiền; tắt chợ (MARKET=off) thì từ chối',
  { skip },
  async () => {
    const n = await boot('mk')
    const w = await newWorld(n)
    const [A, B] = [await guest(n, undefined, w), await guest(n, undefined, w)]
    const [ca, cb] = [client(n, A.token), client(n, B.token)]
    const wa = await ca.welcome
    await cb.welcome
    assert.equal(wa.world.market, true)
    for (const [g, extra] of [
      [A, { items: { doKiep: 2 } }],
      [B, {}],
    ] as const) {
      const { state } = await getState(n, g.token)
      await api(
        n,
        '/dev/state',
        {
          state: {
            ...state,
            levels: allLevels(state.levels, 10),
            res: { linhThach: 5e4, linhThao: 5e4, linhKhoang: 5e4 },
            ...extra,
          },
        },
        g.token,
      )
    }
    const sell = await ca.act({ type: 'sell', good: 'doKiep', n: 1, price: 6000 })
    assert.ok(sell.ok, JSON.stringify(sell))
    const m = await cb.ask({ k: 'market', good: 'doKiep' })
    assert.ok(m, 'chợ đang bật')
    assert.equal(m.orders.length, 1)
    const buy = await cb.act({ type: 'buy', id: m.orders[0].id })
    assert.ok(buy.ok && buy.p?.items?.doKiep === 1, JSON.stringify(buy))
    const paid = await ca.push(p => !!p.p.mail?.some(x => x.k === 'sold'))
    assert.equal(paid.p.mail!.at(-1)!.gift?.res?.linhThach, 5400)
    ca.close()
    cb.close()

    const off = await boot('mo', { MARKET: 'off' })
    const C = await guest(off, undefined, await newWorld(off))
    const cc = client(off, C.token)
    assert.equal((await cc.welcome).world.market, false)
    const no = await cc.act({ type: 'sell', good: 'linhThao', n: 100, price: 100 })
    assert.equal(!no.ok && no.err, 'locked')
    assert.equal(await cc.s.timeout(5000).emitWithAck('get', { k: 'market' }), null)
    cc.close()
  },
)

test(
  'tài khoản: gắn email, đăng nhập, đổi mật khẩu đá phiên khác, mã chuyển máy một lần, đăng xuất mọi nơi, xoá tài khoản',
  { skip },
  async () => {
    const n = await boot('acc')
    const w = await newWorld(n)
    const A = await guest(n, undefined, w)
    const json = async (r: Response): Promise<Record<string, any>> => ({
      status: r.status,
      ...((await r.json()) as object),
    })
    const email = `a${randomBytes(3).toString('hex')}@Example.com`
    assert.equal(
      (await json(await api(n, '/account/link', { email, pass: 'short' }, A.token))).status,
      400,
      'mật khẩu quá ngắn',
    )
    assert.equal((await json(await api(n, '/account/link', { email, pass: 'mat-khau-1' }, A.token))).ok, true)
    const inbox = await n.db.client`select body from inbox where world_id = ${w} and kind = 'mail'`
    assert.ok(
      inbox.some(
        r =>
          (r.body as { pid?: number; mail?: { k: string } }).pid === A.pid &&
          (r.body as { mail?: { k: string } }).mail?.k === 'linked',
      ),
      'gắn email lần đầu: thư quà vào hộp lệnh của giới',
    )
    assert.equal(
      (await json(await api(n, '/account/link', { email: 'x@y.zz', pass: 'mat-khau-1' }, A.token))).error,
      'linked',
    )
    const B = await guest(n, undefined, w)
    assert.equal(
      (await json(await api(n, '/account/link', { email: email.toUpperCase(), pass: 'mat-khau-2' }, B.token))).error,
      'email_taken',
      'email không phân biệt hoa thường',
    )
    assert.equal((await json(await api(n, '/account', undefined, A.token))).email, email.toLowerCase())
    // đăng nhập bằng email (chuẩn hoá hoa thường, khoảng trắng); sai mật khẩu thì 401 như email lạ
    assert.equal((await json(await api(n, '/login', { email: 'nobody@example.com', pass: 'mat-khau-1' }))).status, 401)
    assert.equal((await json(await api(n, '/login', { email, pass: 'sai-mat-khau' }))).status, 401)
    const L1 = await json(await api(n, '/login', { email: ` ${email.toUpperCase()} `, pass: 'mat-khau-1' }))
    assert.equal(L1.pid, A.pid, 'đăng nhập vào đúng tông môn')
    // đổi mật khẩu từ phiên đầu: phiên L1 mất hiệu lực, phiên đổi vẫn còn
    assert.equal(
      (await json(await api(n, '/account/password', { old: 'sai', pass: 'mat-khau-3' }, A.token))).status,
      401,
    )
    assert.equal(
      (await json(await api(n, '/account/password', { old: 'mat-khau-1', pass: 'mat-khau-3' }, A.token))).ok,
      true,
    )
    assert.equal((await api(n, '/account', undefined, L1.token)).status, 401, 'phiên khác bị đăng xuất')
    assert.equal((await api(n, '/account', undefined, A.token)).status, 200)
    // mã chuyển máy: dùng một lần
    const code = await json(await api(n, '/account/code', {}, A.token))
    assert.match(code.code, /^[2-9A-HJKMNP-Z]{8}$/)
    const C1 = await json(await api(n, '/login/code', { code: code.code.toLowerCase().replace(/(.{4})/, '$1-') }))
    assert.equal(C1.pid, A.pid)
    assert.equal((await api(n, '/login/code', { code: code.code })).status, 401, 'mã đã dùng')
    // đăng xuất mọi nơi
    assert.ok((await json(await api(n, '/account/logout-all', {}, C1.token))).ok)
    for (const t of [A.token, C1.token]) assert.equal((await api(n, '/account', undefined, t)).status, 401)

    // xoá tài khoản: B lập minh, A vào minh; B xoá → A thành minh chủ, dòng tài khoản B biến mất, đăng nhập lại không được
    const A2 = await json(await api(n, '/login', { email, pass: 'mat-khau-3' }))
    const ca = client(n, A2.token),
      cb = client(n, B.token)
    await Promise.all([ca.welcome, cb.welcome])
    const st = await getState(n, B.token)
    await api(
      n,
      '/dev/state',
      {
        state: {
          ...st.state,
          levels: allLevels(st.state.levels, 10),
          res: { linhThach: 1e5, linhThao: 1e5, linhKhoang: 1e5 },
        },
      },
      B.token,
    )
    assert.ok((await cb.act({ type: 'allyFound', name: 'Xoá Thử', tag: 'XT' })).ok)
    const ally = await ca.ask({ k: 'allies' })
    assert.ok((await ca.act({ type: 'allyJoin', id: ally[0].id })).ok)
    const bye = new Promise<string>(ok => cb.s.once('bye', m => ok(m.reason)))
    assert.equal((await json(await api(n, '/account/delete', {}, B.token))).ok, true)
    assert.equal((await api(n, '/account', undefined, B.token)).status, 401, 'phiên bị bỏ ngay')
    assert.equal(await bye, 'deleted')
    const gone = await until(async () => !(await n.db.client`select 1 from players where id = ${B.pid}`).length)
    assert.ok(gone, 'tông môn bị xoá khỏi DB')
    const mine = await ca.ask({ k: 'ally' })
    assert.deepEqual(mine?.members, { [A.pid]: 2 }, 'người còn lại thành minh chủ')
    ca.close()
    cb.close()
  },
)

test(
  'Web Push: offline thì nhắc khi việc dài xong và báo khi bị cướp (chữ theo ngôn ngữ tài khoản); chỉ nhận dịch vụ push thật',
  { skip },
  async () => {
    const en = await (await import('@rok/i18n')).loadText('en')
    const got: { pid: number; title: string; body: string; tag: string }[] = []
    const n = await boot(
      'push',
      { VAPID_PUBLIC_KEY: 'B'.repeat(87), VAPID_PRIVATE_KEY: 'k'.repeat(43) },
      { push: (pid, note) => got.push({ pid, ...note(en) }) },
    )
    const w = await newWorld(n)
    const V = await guest(n, undefined, w)
    const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'BPk', auth: 'x' } }
    assert.equal(
      (await api(n, '/push/sub', { ...sub, endpoint: 'https://evil.example.com/x' }, V.token)).status,
      400,
      'endpoint lạ: lỗ SSRF',
    )
    assert.equal(
      (await api(n, '/push/sub', { ...sub, endpoint: 'http://fcm.googleapis.com/x' }, V.token)).status,
      400,
      'phải https',
    )
    assert.equal((await api(n, '/push/sub', sub, V.token)).status, 200)
    assert.equal(
      ((await (await api(n, '/account', undefined, V.token)).json()) as { push: string }).push,
      'B'.repeat(87),
      'client lấy khoá công khai VAPID',
    )
    // chọn loại thông báo: tắt "raid" rồi bật lại; loại lạ thì từ chối
    assert.equal((await api(n, '/push/off', { off: ['raid', 'raid'] }, V.token)).status, 200)
    assert.deepEqual(((await (await api(n, '/account', undefined, V.token)).json()) as { off: string[] }).off, ['raid'])
    assert.equal((await api(n, '/push/off', { off: ['spam'] }, V.token)).status, 400)
    assert.equal((await api(n, '/push/off', { off: [] }, V.token)).status, 200)

    // V giao việc xây 30 phút rồi rời game → tới giờ xong thì được nhắc; đang chơi thì không
    const cv = client(n, V.token)
    await cv.welcome
    const st = (await getState(n, V.token)).state
    const strong = {
      ...st,
      levels: allLevels(st.levels, 10),
      shield: 0,
      troops: { ...st.troops, the1: 200 },
      elders: { ...st.elders, thanhPhong: VETERAN },
      res: { linhThach: 2e5, linhThao: 2e5, linhKhoang: 2e5 },
    }
    await api(
      n,
      '/dev/state',
      {
        state: {
          ...strong,
          queue: [{ building: 'linhDien', level: 11, startAt: st.time, finishAt: st.time + 30 * 60_000 }],
        },
      },
      V.token,
    )
    await cv.push()
    cv.close()
    await sleep(200)
    await api(n, '/dev/warp', { min: 31 }, V.token)
    assert.ok(await until(() => got.length >= 1, 10_000), 'không nhắc khi việc xong') // chạy song song cả bộ test: chậm hơn
    assert.deepEqual(got[0], { pid: V.pid, title: en.push.title, body: en.push.done.build, tag: 'done' })

    // người khác cướp V lúc V offline → báo ngay khi trận giải
    const T = await guest(n, undefined, w)
    const ct = client(n, T.token)
    await ct.welcome
    const ts = (await getState(n, T.token)).state
    const vs = (await getState(n, V.token)).state
    await api(
      n,
      '/dev/state',
      {
        state: {
          ...strong,
          time: ts.time,
          name: ts.name,
          seat: beside(vs.seat!),
          troops: { ...ts.troops, kiem3: 1100 },
          queue: [],
        },
      },
      T.token,
    )
    await ct.push()
    const raid = await ct.act({ type: 'raid', pid: V.pid, elder: 'thanhPhong', army: { kiem3: 1100 } })
    assert.ok(raid.ok, JSON.stringify(raid))
    await api(n, '/dev/warp', { min: 15 }, T.token)
    assert.ok(await until(() => got.some(g => g.tag === 'raid'), 10_000), 'bị cướp lúc offline mà không được báo')
    assert.equal(got.find(g => g.tag === 'raid')!.pid, V.pid)
    assert.ok(!got.some(g => g.pid === T.pid), 'người đang chơi không nhận push')
    ct.close()
  },
)

test(
  'mất Postgres: ngắn thì ack chờ ghi xong mới tới, không mất gì; quá 12 giây thì giới chỉ đọc, có DB lại thì chạy tiếp',
  { skip },
  async () => {
    const { createServer, connect } = await import('node:net')
    // proxy TCP giữa node và Postgres: `cut` cắt mọi kết nối đang có và từ chối kết nối mới (như DB sập / mất mạng)
    const target = new globalThis.URL(URL)
    const open = new Set<import('node:net').Socket>()
    let cut = false
    const proxy = createServer(c => {
      if (cut) return void c.destroy()
      const s = connect(Number(target.port), target.hostname)
      const end = () => {
        c.destroy()
        s.destroy()
        open.delete(c)
        open.delete(s)
      }
      for (const x of [c, s]) {
        open.add(x)
        x.on('error', end).on('close', end)
      }
      c.pipe(s).pipe(c)
    }).listen(0, '127.0.0.1')
    await new Promise(r => proxy.once('listening', r))
    const down = () => {
      cut = true
      for (const x of open) x.destroy()
    }
    const via = Object.assign(new globalThis.URL(URL), {
      port: String((proxy.address() as { port: number }).port),
    }).toString()
    const n = await boot('pg', { DATABASE_URL: via })
    const w = await newWorld(n)
    const g = await guest(n, undefined, w)
    const c = client(n, g.token)
    await c.welcome
    const status: boolean[] = []
    c.s.on('status', m => status.push(m.ro))

    // mất DB 2 giây: thao tác vẫn nhận, nhưng ack chỉ tới sau khi đã ghi được (đã ack là bền)
    down()
    const t0 = Date.now()
    setTimeout(() => (cut = false), 2000)
    const ack = await c.act({ type: 'upgrade', building: 'linhDien' })
    assert.ok(ack.ok, JSON.stringify(ack))
    assert.ok(Date.now() - t0 >= 1800, `ack tới trước khi DB có lại (${Date.now() - t0} ms)`)
    assert.equal((await row(n, g.pid)).state.queue.length, 1, 'thao tác đã ack nằm trong DB')

    // mất DB lâu (> 12 giây không gia hạn được lease): giới tự chuyển chỉ đọc, từ chối thao tác; có DB lại thì chạy tiếp
    down()
    for (const t = Date.now(); Date.now() - t < 20_000 && !status.includes(true);) await sleep(200)
    assert.ok(status.includes(true), 'mất DB lâu mà giới không chuyển chỉ đọc')
    const refused = await c.act({ type: 'upgrade', building: 'khoangMach' })
    assert.deepEqual(refused, { ok: false, err: 'unavailable' })
    cut = false
    for (const t = Date.now(); Date.now() - t < 15_000 && status.at(-1) !== false;) await sleep(200)
    assert.equal(status.at(-1), false, 'có DB lại mà giới không hết chỉ đọc')
    assert.ok((await c.act({ type: 'upgrade', building: 'khoangMach' })).ok)
    c.close()
    proxy.close()
  },
)

test(
  'đổi tên tông môn: cần Cải Danh Lệnh, tên như lúc lập, không trùng trong giới; chủ giới áp tên mới và trừ lệnh',
  { skip },
  async () => {
    const n = await boot('ren')
    const w = await newWorld(n)
    const A = await guest(n, undefined, w)
    await guest(n, 'Tông Trùng Tên', w)
    const ca = client(n, A.token)
    await ca.welcome
    const rename = async (name: string) => {
      const r = await api(n, '/account/rename', { name }, A.token)
      return { status: r.status, ...((await r.json()) as { ok?: boolean; error?: string }) }
    }
    assert.equal((await rename('Tân Danh Môn')).error, 'no_item')
    const st = await getState(n, A.token)
    await api(n, '/dev/state', { state: { ...st.state, items: { ...st.state.items, caiDanh: 1 } } }, A.token)
    const saved = await until(
      async () =>
        ((await n.db.client`select state from players where id = ${A.pid}`)[0].state as State).items.caiDanh === 1,
    )
    assert.ok(saved, 'lệnh đã ghi DB')
    assert.equal((await rename('!!')).error, 'name')
    assert.equal((await rename('tông trùng tên')).error, 'name_taken', 'không phân biệt hoa thường')
    assert.equal((await rename('  Tân   Danh Môn ')).ok, true)
    const done = await until(async () => (await getState(n, A.token)).state.name === 'Tân Danh Môn', 10_000)
    assert.ok(done, 'chủ giới áp tên mới qua hộp lệnh')
    assert.equal((await getState(n, A.token)).state.items.caiDanh ?? 0, 0, 'trừ một lệnh')
    ca.close()
  },
)

test(
  'mã quà tặng: admin tạo mã, người chơi đổi một lần mỗi tài khoản, hết lượt / hết hạn / sai mã bị từ chối, quà về thư',
  { skip },
  async () => {
    const ADMIN = 'g'.repeat(32)
    const n = await boot('gift', { ADMIN_TOKEN: ADMIN })
    const w = await newWorld(n)
    const A = await guest(n, undefined, w),
      B = await guest(n, undefined, w)
    const ca = client(n, A.token)
    await ca.welcome
    const admin = (body: object) =>
      fetch(`http://127.0.0.1:${n.port}/api/admin/codes`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-rok': '1', 'x-admin-token': ADMIN },
        body: JSON.stringify(body),
      })
    const redeem = async (token: string, code: string) => {
      const r = await api(n, '/account/redeem', { code }, token)
      return { status: r.status, ...((await r.json()) as { ok?: boolean; error?: string }) }
    }
    assert.equal((await admin({ code: 'khai-son-2026', gift: { items: { kimDuyen: 2 } }, max: 1 })).status, 200)
    assert.equal((await admin({ code: 'KHAISON2026', gift: { items: {} } })).status, 409, 'trùng mã (sau chuẩn hoá)')
    assert.equal((await redeem(A.token, 'khong co')).error, 'code')
    assert.equal((await redeem(A.token, ' khai son 2026 ')).ok, true, 'không phân biệt hoa thường, khoảng trắng')
    assert.equal((await redeem(A.token, 'KHAISON2026')).error, 'used', 'mỗi tài khoản một lần')
    assert.equal((await redeem(B.token, 'KHAISON2026')).error, 'gone', 'hết lượt (max 1)')
    const got = await until(async () => (await getState(n, A.token)).state.mail.some(m => m.k === 'code' && !!m.gift))
    assert.ok(got, 'quà về thư qua hộp lệnh')
    ca.close()
  },
)
