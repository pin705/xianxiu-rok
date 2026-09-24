// Chơi thật bản online: Chrome headless (CDP thô, không thư viện) bấm như người chơi, với server game + Postgres thật.
// Chạy: npm run db && npm run build && npm run e2e   (Chrome ở chỗ khác: CHROME=…; Postgres khác: E2E_DATABASE_URL=…)
// Mỗi lần chạy: database tạm riêng, cổng trống riêng, bản sao dist riêng — chạy song song hay build lại giữa chừng không giẫm nhau.
// Kiểm: lập tông môn → 14 nhiệm vụ đầu chỉ bằng click (tua giờ giới qua API dev) → tải lại vẫn còn tiến độ (từ server) →
// hai tab đồng bộ → ngăn kéo desktop → server sập rồi lên lại: tự nối lại, thao tác đã ack còn nguyên → mất mạng hẳn: hiện
// màn "không có mạng", đổi ngôn ngữ vẫn được (service worker) → console sạch.
import { spawn, type ChildProcess } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import postgres from 'postgres'

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

  // Server sập giữa chừng (SIGKILL, không kịp xả): client báo đang nối lại, server lên thì tự nối, thao tác đã ack còn nguyên
  const before = await a.js(truth)
  expectDrops = true
  game!.kill('SIGKILL')
  assert.ok(await a.until(`!!document.querySelector('.strip')`, 8000), 'mất server mà không báo đang nối lại')
  await startGame()
  assert.ok(await a.until(`!document.querySelector('.strip, [role=alertdialog]')`, 25000), `server lên lại mà client không tự nối — ${await seen()}`)
  const after = await a.js(truth)
  assert.deepEqual(after.queue, before.queue, 'thao tác đã ack mất sau khi server sập')
  assert.equal(after.quest, before.quest)
  console.log('✓ server sập rồi lên lại: tự nối lại, không mất thao tác đã ghi')

  // Mất mạng hẳn: trang vẫn mở từ service worker, báo "không có mạng" (không phải trang lỗi của trình duyệt), đổi ngôn ngữ được
  game!.kill('SIGKILL')
  web.kill()
  await sleep(500)
  for (const [lang, text] of [['vi', 'Không có mạng'], ['en', 'No connection']]) {
    await a.js(`localStorage.setItem('rok.lang', '${lang}'); location.reload()`)
    await sleep(500)
    assert.ok(await a.until(`document.querySelector('[role=alertdialog]')?.innerText.includes('${text}')`, 20000), `offline (${lang}): không hiện màn mất mạng`)
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
