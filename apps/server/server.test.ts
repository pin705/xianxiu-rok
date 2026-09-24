// Test tích hợp: server thật (Fastify + Socket.IO) + Postgres thật (npm run db). Mỗi lần chạy một database tạm, xoá khi xong.
// Không có Postgres: bỏ qua — trừ khi CI=1 (CI phải chạy đủ).
import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import postgres from 'postgres'
import { io, type Socket } from 'socket.io-client'
import type { Action } from '@rok/rules'
import type { Ack, ClientToServer, Push, Refuse, ServerToClient, Welcome } from '@rok/protocol'
import { buildServer } from './src/app.ts'
import { loadConfig } from './src/config.ts'

const ADMIN = process.env.DATABASE_URL ?? 'postgres://rok:rok@127.0.0.1:5439/rok'
const NAME = `rok_t_${randomBytes(4).toString('hex')}`
const URL = Object.assign(new globalThis.URL(ADMIN), { pathname: `/${NAME}` }).toString()
let up = true
try {
  const admin = postgres(ADMIN, { max: 1, connect_timeout: 3, onnotice: () => {} })
  await admin.unsafe(`create database "${NAME}"`)
  await admin.end()
} catch {
  up = false
}
if (!up && process.env.CI) throw new Error(`CI cần Postgres ở ${ADMIN}`)
const skip = !up && 'không có Postgres (npm run db)'

type Node = Awaited<ReturnType<typeof buildServer>> & { port: number; path: string }
const nodes: Node[] = []
async function boot(name: string, env: Record<string, string> = {}): Promise<Node> {
  const path = `/${name}/socket.io`
  const s = await buildServer(loadConfig({ NODE_ENV: 'test', DATABASE_URL: URL, NODE_PATH: path, ALLOW_WARP: '1', COMMIT_MS: '5', LOG_LEVEL: process.env.TEST_LOG ?? 'silent', REBALANCE: 'off', LIMITS: 'off', ...env }))
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
  const admin = postgres(ADMIN, { max: 1, onnotice: () => {} })
  await admin.unsafe(`drop database if exists "${NAME}" with (force)`)
  await admin.end()
})

const api = (n: Node, path: string, body?: object, token?: string) =>
  fetch(`http://127.0.0.1:${n.port}/api${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', 'x-rok': '1', ...(token && { authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  })
// Giới riêng cho test cần cô lập (mỗi giới do đúng một node giữ)
const newWorld = async (n: Node) => (await n.db.client`insert into worlds (seed) values (7) returning id`)[0].id as number
async function guest(n: Node, name = `Tông ${randomBytes(3).toString('hex')}`, world?: number) {
  const r = await api(n, '/guest', { name, lang: 'vi', world })
  return { status: r.status, ...((await r.json()) as object) } as { status: number; token: string; pid: number; world: number; error?: string }
}
const row = async (n: Node, pid: number) => (await n.db.client`select state, hall, power from players where id = ${pid}`)[0]

// Client thử (socket.io-client thật): gom mọi sự kiện server đẩy xuống
function client(n: Node, token: string, protocol = n.protocol) {
  const s: Socket<ServerToClient, ClientToServer> = io(`http://127.0.0.1:${n.port}`, {
    path: n.path, auth: { token, protocol, build: 'test', lang: 'vi' }, transports: ['websocket'], reconnection: false, forceNew: true,
  })
  const pushes: Push[] = []
  const frames: string[] = []
  s.on('s', p => pushes.push(p))
  s.onAny((_, ...args) => frames.push(JSON.stringify(args)))
  const welcome = new Promise<Welcome>((ok, no) => {
    s.once('welcome', ok)
    s.once('connect_error', e => no(Object.assign(new Error(e.message), { data: (e as { data?: Refuse }).data })))
  })
  const act = async (a: Action | Record<string, unknown>) => {
    const r = await s.timeout(5000).emitWithAck('act', a as Action)
    frames.push(JSON.stringify(r))
    return r as Ack
  }
  const push = async (pred: (p: Push) => boolean = () => true, ms = 5000) => {
    for (const t0 = Date.now(); Date.now() - t0 < ms; await new Promise(r => setTimeout(r, 20))) {
      const i = pushes.findIndex(pred)
      if (i >= 0) return pushes.splice(i, 1)[0]
    }
    throw new Error('hết giờ chờ patch')
  }
  return { s, welcome, act, push, pushes, frames, close: () => s.close() }
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
  assert.deepEqual(await c.act({ type: 'realm', i: 0, elder: 'thanhPhong', army: { kiem1: 1 } }), { ok: false, err: 'locked' })
  for (const f of c.frames) assert.ok(!/"seed":[1-9]/.test(f), `lộ mầm: ${f.slice(0, 120)}`)
  c.close()
})

test('tên trùng trong cùng giới, tên bẩn, thiếu header chống CSRF đều bị từ chối', { skip }, async () => {
  assert.equal((await guest(a, 'Trùng Tên Tông')).status, 200)
  assert.equal((await guest(a, 'trùng   tên tông')).status, 409)
  assert.equal((await guest(a, 'x')).status, 400)
  assert.equal((await guest(a, '<script>')).status, 400)
  const r = await fetch(`http://127.0.0.1:${a.port}/api/guest`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"name":"Không Header"}' })
  assert.equal(r.status, 403)
  assert.deepEqual(await (await api(a, '/me')).json(), { account: null, pid: null, world: null, path: a.path })
})

test('hai tab: tab gửi nhận ack, tab kia nhận patch cùng version; sai mã giao thức bị mời tải bản mới', { skip }, async () => {
  const g = await guest(a)
  const x = client(a, g.token), y = client(a, g.token)
  await x.welcome
  await y.welcome
  const ack = await x.act({ type: 'upgrade', building: 'linhDien' })
  const p = await y.push()
  assert.ok(ack.ok)
  assert.equal(p.v, ack.ok && ack.v)
  assert.deepEqual(p.p, ack.ok && ack.p)
  // (patch lúc tab y nối vào — đưa state tới giờ hiện tại — thì tab x được nhận; bản sao của ack thì không)
  assert.ok(!x.pushes.some(q => ack.ok && q.v === ack.v), 'tab gửi không nhận trùng patch')
  const z = client(a, g.token, 'ban-cu')
  await assert.rejects(z.welcome, (e: { data?: Refuse }) => e.data?.reason === 'protocol')
  x.close()
  y.close()
  z.close()
})

test('trận PvE tới nơi: server đẩy chiến báo đúng lúc (client không biết mầm nên không tự giải)', { skip }, async () => {
  const g = await guest(a)
  const c = client(a, g.token)
  const w = await c.welcome
  const st = { ...(await row(a, g.pid)).state, levels: { ...w.state.levels, chuDien: 3 }, troops: { ...w.state.troops, kiem1: 200 } }
  assert.equal((await api(a, '/dev/state', { state: st }, g.token)).status, 200)
  await c.push()
  const ack = await c.act({ type: 'march', target: { kind: 'beast', i: 0 }, elder: 'thanhPhong', army: { kiem1: 100 } })
  assert.ok(ack.ok)
  assert.equal(ack.ok && ack.p?.marches?.[0].seed, 0, 'mầm của đội không lộ')
  await api(a, '/dev/warp', { min: 10 }, g.token)
  const p = await c.push(m => !!m.rep?.length)
  assert.equal(p.rep![0].kind, 'beast')
  assert.ok(p.rep![0].win)
  const list = (await c.s.timeout(5000).emitWithAck('get', { k: 'reports' })) as { id: number }[]
  assert.equal(list.length, 1)
  c.close()
})

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
  assert.deepEqual(w.state.queue.map(j => j.building), ['khoangMach'])
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
  for (const u of ['kiem4', 'kiem5', 'phap4', 'phap5', 'the4', 'the5']) delete s.troops[u], delete s.wounded[u]
  delete s.levels.luyenKhiPhong
  await a.db.client`update players set state = ${JSON.stringify({ ...s, v: 3, realms: [0, 0, 0] })}::jsonb where id = ${old.pid}`
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

test('cướp giữa hai người chơi: server giải trận lúc tới nơi, cả hai nhận chiến báo; đối thủ, xếp hạng, thư admin nhận quà một lần', { skip }, async () => {
  const ADMIN = 'k'.repeat(32)
  const n = await boot('m', { ADMIN_TOKEN: ADMIN })
  const w = await newWorld(n)
  const A = await guest(n, undefined, w), B = await guest(n, undefined, w)
  const ca = client(n, A.token), cb = client(n, B.token)
  await Promise.all([ca.welcome, cb.welcome])
  // dựng hai tông môn tầng 10, hết khiên tân thủ (công cụ dev)
  // giới vừa mở (pha Khai giới: cổng chưa mở) → đặt hai tông môn cùng vùng, sát nhau
  const setup = async (token: string, troops: object, seat?: { x: number; y: number }) => {
    const { state } = (await (await api(n, '/dev/state', undefined, token)).json()) as { state: any }
    const levels = Object.fromEntries(Object.keys(state.levels).map(k => [k, 10]))
    const res = { linhThach: 2e5, linhThao: 2e5, linhKhoang: 2e5 }
    assert.equal((await api(n, '/dev/state', { state: { ...state, levels, res, shield: 0, troops: { ...state.troops, ...troops }, ...(seat && { seat }) } }, token)).status, 200)
    return state.seat as { x: number; y: number }
  }
  const seatA = await setup(A.token, { kiem3: 1100 })
  assert.ok(seatA, 'vào giới là có chỗ trên bản đồ')
  await setup(B.token, { the1: 200 }, { x: seatA.x + 1, y: seatA.y })
  const rivals = (await ca.s.timeout(5000).emitWithAck('get', { k: 'rivals' })) as { pid: number; scout: { side: { troops: unknown[] } } }[]
  assert.ok(rivals.some(r => r.pid === B.pid && r.scout.side.troops.length), 'đối thủ có dò thám')
  const ack = await ca.act({ type: 'raid', pid: B.pid, elder: 'thanhPhong', army: { kiem3: 1100 } })
  assert.ok(ack.ok && ack.p?.marches, JSON.stringify(ack))
  const m = ack.p!.marches!.at(-1)!
  assert.equal(m.returnAt, 0)
  assert.equal(m.path?.length, 2, 'cùng vùng: đi thẳng')
  const map = (await ca.s.timeout(5000).emitWithAck('get', { k: 'map' })) as { seats: { pid: number; npc: boolean }[]; marches: { pid: number }[] }
  assert.ok(map.seats.some(x => x.pid === B.pid) && map.seats.filter(x => x.npc).length === 32, 'bản đồ có mọi tông môn, kể cả 32 phân đà NPC')
  assert.ok(map.marches.some(x => x.pid === A.pid), 'bản đồ có đội đi cướp')
  assert.equal(m.seed, 0, 'mầm trận cướp không rời server')
  assert.deepEqual(await ca.act({ type: 'raid', pid: B.pid, elder: 'thanhPhong', army: { kiem3: 1 } }), { ok: false, err: 'busy' })
  // tua tới lúc tới nơi: server tự giải trận (không ai phải thao tác)
  const { now } = (await (await api(n, '/dev/state', undefined, A.token)).json()) as { now: number }
  await api(n, '/dev/warp', { min: Math.ceil((m.arriveAt - now) / 60_000) + 1 }, A.token)
  const pb = await cb.push(p => !!p.rep?.some(r => r.kind === 'pvp'))
  assert.equal(pb.rep![0].def, true)
  assert.equal(pb.rep![0].i, A.pid)
  const pa = await ca.push(p => !!p.rep?.some(r => r.kind === 'pvp'))
  assert.ok(pa.p.marches![0].returnAt > m.arriveAt)
  const rows = await n.db.client`select player_id, (body->>'def')::boolean as def from reports where kind = 'pvp' and player_id in (${A.pid}, ${B.pid})`
  assert.equal(rows.length, 2, 'cả hai chiến báo đã ghi')
  // xếp hạng tranh đoạt (cột chép từ state lúc commit)
  const rk = (await (await api(n, '/ranks/pvp', undefined, A.token)).json()) as { rows: { pid: number }[]; me: { rank: number } }
  assert.ok(rk.rows.some(r => r.pid === A.pid) && rk.me.rank >= 1)
  assert.equal((await api(n, '/ranks/nope', undefined, A.token)).status, 400)
  // admin: số liệu có token mới xem được; thư có quà tới người chơi qua inbox, nhận đúng một lần
  const admin = (path: string, body?: object) =>
    fetch(`http://127.0.0.1:${n.port}/api/admin${path}`, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json', 'x-rok': '1', 'x-admin-token': ADMIN }, body: body && JSON.stringify(body) })
  assert.equal((await api(n, '/admin/stats')).status, 401)
  assert.ok(Array.isArray(((await (await admin('/stats')).json()) as { cohorts: unknown[] }).cohorts))
  assert.equal((await admin('/mail', { world: w, pid: B.pid, title: 'Chào', body: 'Quà', gift: { res: { linhThach: 777 }, items: { vang: 1 } } })).status, 400, 'quà lạ bị chặn')
  assert.equal((await admin('/mail', { world: w, pid: B.pid, title: 'Chào', body: 'Quà', gift: { res: { linhThach: 777 } } })).status, 200)
  const pm = await cb.push(p => !!p.p.mail?.length, 8000)
  const mail = pm.p.mail!.at(-1)!
  assert.deepEqual(mail.a, ['Chào', 'Quà'])
  const before = (await row(n, B.pid)).state.res.linhThach
  assert.ok((await cb.act({ type: 'mail', id: mail.id })).ok)
  assert.ok((await row(n, B.pid)).state.res.linhThach >= before + 777)
  assert.equal((await cb.act({ type: 'mail', id: mail.id })).ok, false, 'nhận lần hai bị từ chối')
  ca.close()
  cb.close()
})

test('tiên minh + chat: lập minh, người khác vào, nhờ giúp, kênh giới và kênh minh, lọc từ, giới hạn tần suất, tin lặp, cấm chat', { skip }, async () => {
  const ADMIN = 'q'.repeat(32)
  const n = await boot('c', { ADMIN_TOKEN: ADMIN })
  const w = await newWorld(n)
  const A = await guest(n, undefined, w), B = await guest(n, undefined, w)
  const ca = client(n, A.token), cb = client(n, B.token)
  await Promise.all([ca.welcome, cb.welcome])
  const { state } = (await (await api(n, '/dev/state', undefined, A.token)).json()) as { state: any }
  await api(n, '/dev/state', { state: { ...state, levels: { ...state.levels, chuDien: 10 }, res: { linhThach: 5e4, linhThao: 5e4, linhKhoang: 5e4 } } }, A.token)
  const allyEvents: number[] = []
  cb.s.on('ally', () => allyEvents.push(Date.now()))
  assert.ok((await ca.act({ type: 'allyFound', name: 'Thanh Vân Minh', tag: 'TVM' })).ok)
  const list = (await cb.s.timeout(5000).emitWithAck('get', { k: 'allies' })) as { id: number; name: string }[]
  assert.equal(list[0].name, 'Thanh Vân Minh')
  assert.ok((await cb.act({ type: 'allyJoin', id: list[0].id })).ok)
  const info = (await ca.s.timeout(5000).emitWithAck('get', { k: 'ally' })) as { people: { pid: number; role: number }[] }
  assert.deepEqual(info.people.map(p => [p.pid, p.role]).sort(), [[A.pid, 2], [B.pid, 0]].sort())
  const row = await n.db.client`select state->'world'->'allies' as a from worlds where id = ${w}`
  assert.ok(Object.keys(row[0].a).length === 1, 'tiên minh đã ghi vào DB')
  // chat: kênh minh tới đúng người trong minh; lọc từ; tần suất; lặp lại; cấm chat
  const heard: { ch: string; text: string }[] = []
  cb.s.on('chat', m => heard.push(...m.ms.map(x => ({ ch: m.ch, text: x.text }))))
  const say = (c: typeof ca, ch: 'world' | 'ally', text: string) => c.s.timeout(5000).emitWithAck('say', { ch, text }) as Promise<{ ok: boolean; err?: string }>
  assert.ok((await say(ca, 'ally', 'Họp lúc 8h, đm đến đúng giờ')).ok)
  assert.deepEqual(await say(ca, 'ally', 'Họp lúc 8h, đm đến đúng giờ'), { ok: false, err: 'dup' })
  for (let t = 0; t < 30 && !heard.length; t++) await new Promise(r => setTimeout(r, 50))
  assert.equal(heard[0]?.text, 'Họp lúc 8h, ** đến đúng giờ')
  assert.equal(heard[0]?.ch, 'ally')
  assert.ok((await say(ca, 'world', 'một')).ok && (await say(ca, 'world', 'hai')).ok)
  assert.deepEqual(await say(ca, 'world', 'ba'), { ok: false, err: 'rate' }, '3 tin liền rồi phải chờ')
  const hist = (await cb.s.timeout(5000).emitWithAck('get', { k: 'chat', ch: 'ally' })) as { id: number; text: string }[]
  assert.equal(hist.length, 1)
  assert.equal(await cb.s.timeout(5000).emitWithAck('report', { id: hist[0].id }), true)
  const mute = await fetch(`http://127.0.0.1:${n.port}/api/admin/mute`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-rok': '1', 'x-admin-token': ADMIN }, body: JSON.stringify({ world: w, pid: B.pid, minutes: 60 }) })
  assert.equal(mute.status, 200)
  let muted = false
  for (let t = 0; t < 40 && !muted; t++) {
    await new Promise(r => setTimeout(r, 200))
    muted = (await say(cb, 'ally', `thử ${t}`)).err === 'muted'
  }
  assert.ok(muted, 'cấm chat có hiệu lực qua inbox')
  const stored = await n.db.client`select count(*)::int as n from chat where world_id = ${w}`
  assert.ok(stored[0].n >= 3, 'tin chat đã ghi DB')
  assert.ok(allyEvents.length > 0, 'người trong minh được báo khi minh đổi')
  ca.close()
  cb.close()
})

test('bản đồ giới: đi chiếm linh mạch trong vùng mình, đóng quân, được buff, ảnh chụp ghi người giữ, gọi về', { skip }, async () => {
  const { atlas, regionOf } = await import('@rok/rules/world')
  const n = await boot('p')
  const w = await newWorld(n)
  const A = await guest(n, undefined, w)
  const c = client(n, A.token)
  const welcome = await c.welcome
  const a = atlas(welcome.world.map)
  const { state } = (await (await api(n, '/dev/state', undefined, A.token)).json()) as { state: any }
  // linh mạch trống trong vùng của mình (NPC cùng vùng có thể đã giữ một mạch — chọn mạch chưa ai giữ)
  const map0 = (await c.s.timeout(5000).emitWithAck('get', { k: 'map' })) as { spots: { i: number; own?: string }[] }
  const vein = a.points.find(p => p.kind === 'vein' && p.region === regionOf(a, state.seat) && !map0.spots.some(s => s.i === p.i && s.own))
  assert.ok(vein, 'vùng nào cũng có linh mạch')
  await api(n, '/dev/state', { state: { ...state, troops: { ...state.troops, kiem2: 300 } } }, A.token)
  const ack = await c.act({ type: 'go', i: vein!.i, task: 'take', elder: 'thanhPhong', army: { kiem2: 300 } })
  assert.ok(ack.ok, JSON.stringify(ack))
  const m = ack.p!.marches!.at(-1)!
  const now0 = welcome.now
  await api(n, '/dev/warp', { min: Math.ceil((m.arriveAt - now0) / 60_000) + 1 }, A.token)
  const held = await c.push(p => !!p.p.marches?.some(x => x.id === m.id && x.stay))
  assert.ok(held)
  const buffed = await c.push(p => !!p.p.buffs?.some(b => b.src === 'vein'), 8000)
  assert.ok(buffed, 'giữ linh mạch: sản lượng tăng')
  const map = (await c.s.timeout(5000).emitWithAck('get', { k: 'map' })) as { spots: { i: number; own?: string; n?: number }[] }
  assert.equal(map.spots.find(s => s.i === vein!.i)?.n, 1)
  assert.ok((await c.act({ type: 'recall', id: m.id })).ok)
  const map2 = (await c.s.timeout(5000).emitWithAck('get', { k: 'map' })) as { spots: { i: number; own?: string }[] }
  assert.equal(map2.spots.find(s => s.i === vein!.i)?.own, undefined, 'gọi về hết quân: điểm trống')
  c.close()
})

test('độ kiếp công khai: có chỗ trên bản đồ thì kiếp vân tụ (cả giới thấy), server giải lúc giáng và đẩy chiến báo', { skip }, async () => {
  const { TRIB_CLOUD } = await import('@rok/rules')
  const n = await boot('k')
  const w = await newWorld(n)
  const A = await guest(n, undefined, w)
  const c = client(n, A.token)
  const welcome = await c.welcome
  const { state } = (await (await api(n, '/dev/state', undefined, A.token)).json()) as { state: any }
  assert.ok(state.seat, 'vào giới là có chỗ trên bản đồ')
  const levels = Object.fromEntries(Object.keys(state.levels).map(k => [k, 5]))
  await api(n, '/dev/state', { state: { ...state, levels, troops: { ...state.troops, kiem1: 300 }, res: { linhThach: 5e4, linhThao: 5e4, linhKhoang: 5e4 } } }, A.token)
  await c.push()
  const ack = await c.act({ type: 'trib', elder: 'thanhPhong', army: { kiem1: 300 }, pill: false })
  assert.ok(ack.ok, JSON.stringify(ack))
  assert.equal(ack.ok && ack.rep, undefined, 'chưa giải ngay: kiếp vân đang tụ')
  const cloud = ack.p!.marches!.at(-1)!
  assert.equal(cloud.target.kind, 'trib')
  const map = (await c.s.timeout(5000).emitWithAck('get', { k: 'map' })) as { seats: { pid: number; cloud?: number }[] }
  assert.equal(map.seats.find(s => s.pid === A.pid)?.cloud, cloud.arriveAt)
  await api(n, '/dev/warp', { min: Math.ceil((cloud.arriveAt - welcome.now) / 60_000) + 1 }, A.token)
  const p = await c.push(x => !!x.rep?.some(r => r.kind === 'trib'), 8000)
  assert.equal(p.p.marches?.length, 0, 'kiếp giáng xong: đội về nhà')
  assert.equal(TRIB_CLOUD[0], cloud.arriveAt - cloud.startAt)
  c.close()
})
