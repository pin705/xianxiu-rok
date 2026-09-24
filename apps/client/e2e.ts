// Chơi thật bản online: Chrome headless (CDP thô, không thư viện) bấm như người chơi, với server game + Postgres thật.
// Chạy: npm run db && npm run build && npm run e2e   (Chrome ở chỗ khác: CHROME=…; Postgres khác: E2E_DATABASE_URL=…)
// Mỗi lần chạy: database tạm riêng, cổng trống riêng, bản sao dist riêng — chạy song song hay build lại giữa chừng không giẫm nhau.
// Kiểm: lập tông môn → 14 nhiệm vụ đầu chỉ bằng click (tua giờ giới qua API dev) → tải lại vẫn còn tiến độ (từ server) →
// hai tab đồng bộ → ngăn kéo desktop → bị người chơi khác cướp: thông báo, xem lại trận, báo thù → bản đồ giới: chạm tông môn mở bảng thông tin → tài khoản: gắn email, đăng xuất, đăng nhập lại → server sập rồi lên lại: tự nối lại, thao tác đã ack còn nguyên → mất mạng hẳn: hiện
// màn "không có mạng", đổi ngôn ngữ vẫn được (service worker) → console sạch.
import { spawn, type ChildProcess } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import postgres from 'postgres'
import { io } from 'socket.io-client'
import { protocolHash } from '@rok/protocol/hash'

const CHROME = process.env.CHROME ?? ['/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => existsSync(p))
if (!CHROME || !existsSync(CHROME)) {
  console.log(`bỏ qua e2e: không thấy Chrome (đặt CHROME=...)`)
  process.exit(0)
}
const ADMIN = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? 'postgres://rok:rok@127.0.0.1:5439/rok'
const DBNAME = `rok_e2e_${Date.now().toString(36)}`
try {
  const admin = postgres(ADMIN, { max: 1, connect_timeout: 3, onnotice: () => {} })
  await admin.unsafe(`create database "${DBNAME}"`)
  await admin.end()
} catch (e) {
  if (process.env.CI) throw new Error(`e2e cần Postgres ở ${ADMIN}: ${e}`)
  console.log(`bỏ qua e2e: không có Postgres ở ${ADMIN} (npm run db)`)
  process.exit(0)
}
const DB = Object.assign(new globalThis.URL(ADMIN), { pathname: `/${DBNAME}` }).toString()

// Bộ nén CSS có lúc biến giá trị hợp lệ thành khai báo rỗng (`border-image: none` → `border-image:;`), chỉ lộ ở bản build
for (const f of readdirSync(join(import.meta.dirname, 'dist/assets')).filter(f => f.endsWith('.css'))) {
  const empty = readFileSync(join(import.meta.dirname, 'dist/assets', f), 'utf8').match(/[\w-]+:;/g)
  assert.equal(empty, null, `${f}: khai báo CSS rỗng sau khi nén: ${empty}`)
}

const freePort = () =>
  new Promise<number>(ok => {
    const s = createServer().listen(0, () => {
      const { port } = s.address() as { port: number }
      s.close(() => ok(port))
    })
  })
const [WEB, DEBUG, GAME] = [await freePort(), await freePort(), await freePort()]
const URL = `http://localhost:${WEB}/`
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const profile = mkdtempSync(join(tmpdir(), 'rok-e2e-'))
cpSync(join(import.meta.dirname, 'dist'), join(profile, 'dist'), { recursive: true })

let game: ChildProcess | undefined
async function startGame() {
  game = spawn(process.execPath, [join(import.meta.dirname, '../server/src/main.ts')], {
    env: { ...process.env, PORT: String(GAME), HOST: '127.0.0.1', DATABASE_URL: DB, ALLOW_WARP: '1', NODE_ENV: 'test', LOG_LEVEL: 'warn', LIMITS: 'off', COMMIT_MS: '10' },
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  for (let i = 0; i < 100; i++) {
    if (await fetch(`http://127.0.0.1:${GAME}/readyz`).then(r => r.ok, () => false)) return
    await sleep(100)
  }
  throw new Error('server game không lên')
}
await startGame()
const web = spawn('npx', ['vite', 'preview', '--port', String(WEB), '--strictPort', '--outDir', join(profile, 'dist')], {
  cwd: import.meta.dirname,
  env: { ...process.env, ROK_SERVER: `http://127.0.0.1:${GAME}` },
  stdio: 'ignore',
})
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DEBUG}`, `--user-data-dir=${profile}/chrome`, '--no-first-run', ...(process.env.CI ? ['--no-sandbox'] : []), 'about:blank'], { stdio: 'ignore' })
const errors: string[] = []
let expectDrops = false // đang cố ý tắt server: lỗi kết nối là đúng

async function tab() {
  let t: any
  for (let i = 0; i < 50 && !t; i++) {
    try {
      t = await (await fetch(`http://127.0.0.1:${DEBUG}/json/new?about:blank`, { method: 'PUT' })).json()
    } catch {
      await sleep(200)
    }
  }
  const ws = new WebSocket(t.webSocketDebuggerUrl)
  await new Promise(r => ws.addEventListener('open', r))
  let id = 0
  const wait = new Map<number, (v: any) => void>()
  ws.addEventListener('message', e => {
    const m = JSON.parse(String(e.data))
    if (m.id) wait.get(m.id)?.(m)
    const note = (text: string) => !(expectDrops && /socket|ERR_CONNECTION|Failed to fetch|net::|WebSocket|503|502|504/i.test(text)) && errors.push(text)
    if (m.method === 'Runtime.exceptionThrown') note(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text)
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') note(m.params.args.map((a: any) => a.value ?? a.description).join(' '))
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') note(`${m.params.entry.text} ${m.params.entry.url ?? ''}`)
  })
  const send = (method: string, params = {}) =>
    new Promise<any>((ok, no) => {
      const i = ++id
      wait.set(i, ok)
      ws.send(JSON.stringify({ id: i, method, params }))
      setTimeout(() => no(new Error(`CDP không trả lời: ${method}`)), 15000)
    })
  await send('Runtime.enable')
  await send('Page.enable')
  await send('Log.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await send('Page.navigate', { url: URL })
  await sleep(1500)
  const js = async (expression: string) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? expression)
    return r.result.result.value
  }
  // chờ tới khi biểu thức đúng (khởi động có vẽ da giao diện + chờ font, nhanh chậm tuỳ máy)
  const until = async (expression: string, ms = 15000) => {
    for (const t0 = Date.now(); Date.now() - t0 < ms; await sleep(200)) if (await js(expression).catch(() => false)) return true
    return false
  }
  return { js, until, send }
}

const closeAll = `document.querySelectorAll('dialog[open]').forEach(d => [...d.querySelectorAll('button')].find(b => b.matches('.x') || b.innerText.trim() === 'Đóng')?.click())`
// Trong hộp thoại trên cùng: bấm nút hành động chính (không phải nút phụ, không phải chữa thương)
const act = `(() => {
  const d = [...document.querySelectorAll('dialog[open]')].pop(); if (!d) return ''
  const b = [...d.querySelectorAll('button.btn:not([disabled]):not(.ghost):not(.quiet)')].find(b => !/Đóng|Chữa|Xem/.test(b.innerText))
  b?.click(); return b?.innerText.trim() ?? ''
})()`
// Công cụ dev của server (ALLOW_WARP), gọi từ trong trang để cookie phiên đi kèm
const warp = (min: number) =>
  `fetch('/api/dev/warp', { method: 'POST', headers: { 'content-type': 'application/json', 'x-rok': '1' }, body: JSON.stringify({ min: ${min} }) }).then(r => r.ok)`
const truth = `fetch('/api/dev/state').then(r => r.json()).then(d => d.state)`
const inGame = `!!document.querySelector('button.quest, p.quest')`

try {
  while (!(await fetch(URL).then(r => r.ok, () => false))) await sleep(200)
  const a = await tab()
  await a.js(`localStorage.setItem('rok.lang', 'vi'); localStorage.setItem('rok.save', '{}'); location.reload()`) // save P1 cũ: phải được dọn
  for (const sel of ['button.cover', '.skip button', 'form button[type=submit]']) {
    assert.ok(await a.until(`!!document.querySelector('${sel}')`), `màn mở đầu thiếu ${sel}`)
    await a.js(`document.querySelector('${sel}').click()`)
  }
  const seen = async () => `màn hình: ${JSON.stringify(await a.js(`document.body.innerText.slice(0, 300)`))} · lỗi: ${JSON.stringify(errors)}`
  assert.ok(await a.until(`!!document.querySelector('button.quest')`), `lập tông môn xong không vào game — ${await seen()}`)
  assert.equal(await a.js(`localStorage.getItem('rok.save')`), null, 'save offline cũ không được dọn')
  for (let i = 0; i < 80 && (await a.js(truth)).quest < 14; i++) {
    await a.js(closeAll)
    await a.js(`document.querySelector('button.quest') || [...document.querySelectorAll('button')].find(b => b.innerText.includes('Tông môn'))?.click()`)
    await sleep(400)
    await a.js(`document.querySelector('button.quest')?.click()`)
    await sleep(700)
    await a.js(act)
    await sleep(400)
    await a.js(closeAll)
    await a.js(warp(15))
    await sleep(700)
  }
  const s = await a.js(truth)
  assert.ok(s.quest >= 14, `chỉ bấm được tới nhiệm vụ ${s.quest}/14`)
  assert.equal(s.seed > 0, true, 'server giữ mầm thật')
  console.log(`✓ 14 nhiệm vụ đầu bằng click, tiến độ nằm trên server (Chủ điện tầng ${s.levels.chuDien}, yêu thú ${s.beast})`)

  // Tải lại: tiến độ đến từ server (trên máy không còn save nào)
  await a.js(`location.reload()`)
  assert.ok(await a.until(inGame), 'tải lại: game không lên')
  assert.equal((await a.js(truth)).quest, s.quest, 'tải lại mất tiến độ')
  assert.equal(await a.js(`Object.keys(localStorage).filter(k => k.startsWith('rok.save')).length`), 0)
  console.log('✓ tải lại: tiến độ đến từ server')

  // Hai tab cùng người chơi: tab A nâng công trình → tab B thấy tạp dịch đang làm
  await a.js(warp(24 * 60)) // xong mọi việc, đầy kho
  const b = await tab()
  assert.ok(await b.until(inGame), 'tab thứ hai không vào được game')
  const idle = `document.querySelector('button.builder')?.getAttribute('aria-label') ?? ''`
  const pick = (name: string) => `[...document.querySelectorAll('[aria-label]')].find(e => e.getAttribute('aria-label').startsWith('${name}'))?.click()`
  let started = false
  for (const name of ['Tụ Linh Trận', 'Linh điền', 'Khoáng mạch', 'Tàng Bảo Các', 'Diễn võ trường', 'Đan phòng']) {
    await a.js(closeAll)
    await a.js(pick(name))
    await sleep(500)
    await a.js(act)
    await sleep(300)
    if ((await a.js(truth)).queue.length) {
      started = true
      break
    }
  }
  assert.ok(started, 'tab A không nâng được công trình nào')
  assert.ok(await b.until(`!/Rảnh|rảnh/.test(${idle})`, 5000), `tab B không thấy việc tab A vừa giao: ${await b.js(idle)}`)
  await b.js(closeAll)
  console.log('✓ hai tab cùng người chơi đồng bộ qua server')

  // Desktop: bảng công trình là ngăn kéo không modal — cảnh vẫn bấm được, chọn công trình khác thì ngăn kéo đổi theo
  await a.js(closeAll)
  await a.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false })
  await a.js(`location.reload()`)
  assert.ok(await a.until(inGame), 'desktop: game không lên')
  await sleep(500)
  await a.js(closeAll) // vừa tua 24 giờ: màn Xuất quan hiện ra (đúng thiết kế) — đóng trước
  await sleep(300)
  await a.js(pick('Chủ điện'))
  assert.ok(await a.until(`[...document.querySelectorAll('dialog[open]')].some(d => !d.matches(':modal') && d.innerText.includes('Chủ điện'))`), 'desktop: bảng không mở thành ngăn kéo')
  await a.js(pick('Tụ Linh Trận'))
  assert.ok(await a.until(`[...document.querySelectorAll('dialog[open]')].some(d => d.querySelector('h2')?.innerText === 'Tụ Linh Trận')`), 'desktop: ngăn kéo mở mà không chọn được công trình khác')
  await a.js(closeAll)
  console.log('✓ desktop: ngăn kéo bên phải, vẫn chọn được công trình trên núi')
  assert.deepEqual(errors, [], 'console có lỗi')

  // Tranh đoạt: người chơi thứ hai (bot socket.io) cướp tông môn trong trình duyệt → bên thủ thấy thông báo, xem lại trận, báo thù
  // (tab A lên trước: Chrome dừng hoạt ảnh ở tab nền — bảng trượt đóng không xong)
  await a.send('Page.bringToFront')
  await a.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  const tenTo = (st: any, troops: object) => ({ ...st, queue: [], levels: Object.fromEntries(Object.keys(st.levels).map(k => [k, 10])), shield: 0, troops: { ...st.troops, ...troops }, res: { linhThach: 2e5, linhThao: 2e5, linhKhoang: 2e5 } })
  await a.js(`${truth}.then(st => fetch('/api/dev/state', { method: 'POST', headers: { 'content-type': 'application/json', 'x-rok': '1' }, body: JSON.stringify({ state: (${tenTo.toString()})(st, { the1: 200 }) }) })).then(r => r.ok)`)
  const api = (path: string, token: string, body?: object) =>
    fetch(`http://127.0.0.1:${GAME}/api${path}`, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json', 'x-rok': '1', authorization: `Bearer ${token}` }, body: body && JSON.stringify(body) }).then(r => r.json())
  const thief = (await (await fetch(`http://127.0.0.1:${GAME}/api/guest`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-rok': '1' }, body: JSON.stringify({ name: 'Hắc Sát Tông', lang: 'vi' }) })).json()) as { token: string; path: string }
  const other = io(`http://127.0.0.1:${GAME}`, { path: thief.path, auth: { token: thief.token, protocol: protocolHash(), build: 'e2e', lang: 'vi' }, transports: ['websocket'], reconnection: false })
  await new Promise(ok => other.once('welcome', ok))
  const t2 = (await api('/dev/state', thief.token)) as { state: any }
  const home = (await a.js(truth)).seat // giới vừa mở: cổng chưa mở, kẻ cướp phải cùng vùng
  await api('/dev/state', thief.token, { state: { ...tenTo(t2.state, { kiem3: 1100 }), seat: { x: home.x + 1, y: home.y } } })
  const victimPid = (await a.js(`fetch('/api/me').then(r => r.json()).then(d => d.pid)`)) as number
  const raid = await other.timeout(10_000).emitWithAck('act', { type: 'raid', pid: victimPid, elder: 'thanhPhong', army: { kiem3: 1100 } })
  assert.ok(raid.ok, `người chơi thứ hai không xuất quân được: ${JSON.stringify(raid)}`)
  await api('/dev/warp', thief.token, { min: 12 })
  assert.ok(await a.until(`document.body.innerText.includes('Hắc Sát Tông vừa cướp tông môn')`, 10000), `bên thủ không được báo bị cướp — ${await seen()}`)
  await a.js(`[...document.querySelectorAll('button.toast')].find(b => b.innerText.includes('Hắc Sát Tông'))?.click()`)
  assert.ok(await a.until(`[...document.querySelectorAll('dialog[open] button')].some(b => b.innerText.includes('Xem kết quả'))`), 'không mở được trận vừa bị cướp')
  await a.js(`[...document.querySelectorAll('dialog[open] button')].find(b => b.innerText.includes('Xem kết quả'))?.click()`)
  assert.ok(await a.until(`[...document.querySelectorAll('dialog[open] button')].some(b => b.innerText.includes('Báo thù'))`), 'thua trận thủ mà không có nút Báo thù')
  await a.js(`[...document.querySelectorAll('dialog[open] button')].find(b => b.innerText.includes('Báo thù'))?.click()`)
  assert.ok(await a.until(`[...document.querySelectorAll('dialog[open]')].some(d => d.innerText.includes('Hắc Sát Tông') && d.innerText.includes('Kẻ thù'))`, 10000), `báo thù: không thấy kẻ thù trong danh sách — ${await seen()}`)
  await a.js(closeAll)
  other.close()
  console.log('✓ bị người chơi khác cướp: thông báo, xem lại trận, báo thù')
  assert.deepEqual(errors, [], 'console có lỗi')

  // Bản đồ giới: tab Bản đồ → gạt sang "Giới" → cảnh WebGL + ghim tên tông môn mình → chạm vào tông môn mình → bảng thông tin
  for (let i = 0; i < 10 && (await a.js(`document.querySelectorAll('dialog[open]').length`)); i++) (await a.js(closeAll), await sleep(300))
  await a.js(`document.querySelector('[data-tab=banDo]')?.click()`)
  assert.ok(await a.until(`[...document.querySelectorAll('button')].some(b => b.innerText.trim() === 'Giới')`), 'tab Bản đồ không có nút gạt Giới')
  await a.js(`[...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Giới').click()`)
  assert.ok(await a.until(`!!document.querySelector('.pins .pin.mine')`, 15000), `bản đồ giới không hiện tông môn của mình — ${await seen()}`)
  // chạm tông môn đầu tiên không bị HUD che (tông môn mình có thể sát mép giới). Chuyển tab chạy View Transition: trong lúc
  // hiệu ứng trình duyệt chỉ hit-test vào <html> — nên đợi tới khi điểm chạm trúng lớp cử chỉ
  const spot = `[...document.querySelectorAll('.pins .pin')].map(p => { const r = p.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top - 18, name: p.innerText } }).find(p => document.elementFromPoint(p.x, p.y)?.classList.contains('touch'))`
  assert.ok(await a.until(`!!${spot}`), 'không ghim tông môn nào chạm được')
  const pin = (await a.js(spot)) as { x: number; y: number; name: string }
  for (const type of ['mousePressed', 'mouseReleased']) await a.send('Input.dispatchMouseEvent', { type, x: pin.x, y: pin.y, button: 'left', clickCount: 1 })
  assert.ok(await a.until(`[...document.querySelectorAll('dialog[open]')].some(d => d.innerText.includes(${JSON.stringify(pin.name)}))`, 5000), `chạm tông môn ${pin.name} mà không mở bảng thông tin`)
  await a.js(closeAll)
  await a.js(`[...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Vùng')?.click()`) // trả lại bản đồ vùng cho các bước sau
  console.log('✓ bản đồ giới: cảnh WebGL, ghim tông môn, chạm mở bảng thông tin')
  assert.deepEqual(errors, [], 'console có lỗi')

  // Tài khoản: Cài đặt → gắn email + mật khẩu → đăng xuất → màn mở đầu → "Đã có tài khoản? Đăng nhập" → vào đúng tông môn cũ
  const sect = (await a.js(truth)).name as string
  const type = (sel: string, v: string) => `(() => { const e = document.querySelector(${JSON.stringify(sel)}); e.value = ${JSON.stringify(v)}; e.dispatchEvent(new Event('input', { bubbles: true })); return true })()`
  const tap = (text: string, scope = 'dialog[open]') => `[...document.querySelectorAll('${scope} button')].find(b => b.innerText.trim().startsWith(${JSON.stringify(text)}) && !b.disabled)?.click() ?? false`
  const mail = `e2e${Date.now().toString(36)}@example.com`
  await a.js(`document.querySelector('button[aria-label="Cài đặt"]').click()`)
  assert.ok(await a.until(`!!document.querySelector('dialog[open] input[type=email]')`), `Cài đặt không có ô gắn email — ${await seen()}`)
  await a.js(type('dialog[open] input[type=email]', mail))
  await a.js(type('dialog[open] input[autocomplete=new-password]', 'mat-khau-e2e'))
  await a.js(tap('Gắn email'))
  assert.ok(await a.until(`document.querySelector('dialog[open]')?.innerText.includes(${JSON.stringify(`Đã gắn với ${mail}`)})`), `gắn email không xong — ${await seen()}`)
  await a.js(tap('Đăng xuất'))
  await sleep(300)
  await a.js(`document.querySelector('dialog[open] button.btn.danger')?.click()`) // xác nhận
  assert.ok(await a.until(`!!document.querySelector('button.cover')`, 15000), `đăng xuất không về màn mở đầu — ${await seen()}`)
  await a.js(`document.querySelector('button.cover').click()`)
  assert.ok(await a.until(`!!document.querySelector('.skip button')`))
  await a.js(`document.querySelector('.skip button').click()`)
  assert.ok(await a.until(`[...document.querySelectorAll('button')].some(b => b.innerText.includes('Đăng nhập'))`), 'màn đặt tên không có lối đăng nhập')
  await a.js(`[...document.querySelectorAll('button')].find(b => b.innerText.includes('Đăng nhập')).click()`)
  assert.ok(await a.until(`!!document.querySelector('form input[type=email]')`))
  await a.js(type('form input[type=email]', mail))
  await a.js(type('form input[type=password]', 'mat-khau-e2e'))
  await a.js(tap('Vào game', 'form'))
  assert.ok(await a.until(inGame, 20000), `đăng nhập lại không vào game — ${await seen()}`)
  assert.equal((await a.js(truth)).name, sect, 'đăng nhập vào đúng tông môn cũ')
  await a.js(closeAll)
  console.log('✓ tài khoản: gắn email, đăng xuất, đăng nhập lại đúng tông môn')
  assert.deepEqual(errors, [], 'console có lỗi')

  // Server sập giữa chừng (SIGKILL, không kịp xả): client báo đang nối lại, server lên thì tự nối, thao tác đã ack còn nguyên
  await a.js(`document.querySelector('[data-tab=tongMon]')?.click()`)
  await sleep(800)
  await a.js(pick('Diễn võ trường'))
  await sleep(500)
  await a.js(act)
  assert.ok(await a.until(`${truth}.then(s => !!s.train)`), `trước khi sập: không chiêu mộ được — ${await seen()}`)
  await a.js(closeAll)
  const before = await a.js(truth)
  expectDrops = true
  game!.kill('SIGKILL')
  assert.ok(await a.until(`!!document.querySelector('[data-conn]')`, 8000), 'mất server mà không báo đang nối lại')
  await startGame()
  assert.ok(await a.until(`!document.querySelector('[data-conn]')`, 25000), `server lên lại mà client không tự nối — ${await seen()}`)
  const after = await a.js(truth)
  assert.deepEqual(after.train, before.train, 'thao tác đã ack mất sau khi server sập')
  assert.equal(after.quest, before.quest)
  console.log('✓ server sập rồi lên lại: tự nối lại, không mất thao tác đã ghi')

  // Mất mạng hẳn: trang vẫn mở từ service worker, báo "không có mạng" (không phải trang lỗi của trình duyệt), đổi ngôn ngữ được
  game!.kill('SIGKILL')
  web.kill()
  await sleep(500)
  for (const [lang, text] of [['vi', 'Không có mạng'], ['en', 'No connection']]) {
    await a.js(`localStorage.setItem('rok.lang', '${lang}'); location.reload()`)
    await sleep(500)
    assert.ok(await a.until(`document.querySelector('[data-conn=offline]')?.innerText.includes('${text}')`, 20000), `offline (${lang}): không hiện màn mất mạng — ${await seen()}`)
  }
  console.log('✓ mất mạng: mở được từ bộ nhớ, báo rõ, đổi ngôn ngữ được')
  console.log('✓ console sạch')
} finally {
  chrome.kill()
  web.kill()
  game?.kill('SIGKILL')
  await sleep(300)
  rmSync(profile, { recursive: true, force: true })
  const admin = postgres(ADMIN, { max: 1, onnotice: () => {} })
  await admin.unsafe(`drop database if exists "${DBNAME}" with (force)`).catch(() => {})
  await admin.end()
}
