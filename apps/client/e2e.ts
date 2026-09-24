// Chơi thật trên bản build: Chrome headless (qua CDP, không cần thư viện) bấm như người chơi.
// Chạy: npm run build && npm run e2e   (Chrome ở chỗ khác thì đặt CHROME=/đường/dẫn)
// Kiểm: lập tông môn → 14 nhiệm vụ đầu chỉ bằng click (xây, tuyển, săn, luyện đan, bí cảnh), 2 tab không đè save nhau,
// mất mạng vẫn chơi và đổi ngôn ngữ được (service worker), console không có lỗi. Đồng hồ trang được tua (Date.now) để khỏi chờ thật.
import { spawn } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
if (!existsSync(CHROME)) {
  console.log(`bỏ qua e2e: không thấy Chrome ở ${CHROME} (đặt CHROME=...)`)
  process.exit(0)
}
// Bộ nén CSS có lúc biến giá trị hợp lệ thành khai báo rỗng (`border-image: none` → `border-image:;`), chỉ lộ ở bản build
for (const f of readdirSync(join(import.meta.dirname, 'dist/assets')).filter(f => f.endsWith('.css'))) {
  const empty = readFileSync(join(import.meta.dirname, 'dist/assets', f), 'utf8').match(/[\w-]+:;/g)
  assert.equal(empty, null, `${f}: khai báo CSS rỗng sau khi nén: ${empty}`)
}

// Mỗi lần chạy: cổng trống riêng và bản sao dist riêng — nhiều phiên chạy song song hay ai build lại giữa chừng cũng không giẫm nhau
const freePort = () =>
  new Promise<number>(ok => {
    const s = createServer().listen(0, () => {
      const { port } = s.address() as { port: number }
      s.close(() => ok(port))
    })
  })
const [WEB, DEBUG] = [await freePort(), await freePort()]
const URL = `http://localhost:${WEB}/`
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const profile = mkdtempSync(join(tmpdir(), 'rok-e2e-'))
cpSync(join(import.meta.dirname, 'dist'), join(profile, 'dist'), { recursive: true })
const server = spawn('npx', ['vite', 'preview', '--port', String(WEB), '--strictPort', '--outDir', join(profile, 'dist')], { cwd: import.meta.dirname, stdio: 'ignore' })
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DEBUG}`, `--user-data-dir=${profile}/chrome`, '--no-first-run', ...(process.env.CI ? ['--no-sandbox'] : []), 'about:blank'], { stdio: 'ignore' })
const errors: string[] = []

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
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text)
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a: any) => a.value ?? a.description).join(' '))
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
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => { const real = Date.now.bind(Date), k = 'e2e.off'
      Date.now = () => real() + Number(sessionStorage.getItem(k) ?? 0)
      window.warp = m => sessionStorage.setItem(k, String(Number(sessionStorage.getItem(k) ?? 0) + m * 60000)) })()`,
  })
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
const save = `JSON.parse(localStorage.getItem('rok.save'))`

try {
  while (!(await fetch(URL).then(r => r.ok, () => false))) await sleep(200)
  const a = await tab()
  await a.js(`localStorage.setItem('rok.lang', 'vi'); location.reload()`)
  for (const sel of ['button.cover', '.skip button', 'form button[type=submit]']) {
    assert.ok(await a.until(`!!document.querySelector('${sel}')`), `màn mở đầu thiếu ${sel}`)
    await a.js(`document.querySelector('${sel}').click()`)
  }
  assert.ok(await a.until(`!!document.querySelector('button.quest')`), 'lập tông môn xong không vào game')
  for (let i = 0; i < 80 && (await a.js(save)).quest < 14; i++) {
    await a.js(closeAll)
    await a.js(`document.querySelector('button.quest') || [...document.querySelectorAll('button')].find(b => b.innerText.includes('Tông môn'))?.click()`)
    await sleep(400)
    await a.js(`document.querySelector('button.quest')?.click()`)
    await sleep(700)
    await a.js(act)
    await sleep(300)
    await a.js(`${closeAll}; warp(15)`)
    await sleep(700)
  }
  const s = await a.js(save)
  assert.ok(s.quest >= 14, `chỉ bấm được tới nhiệm vụ ${s.quest}/14`)
  console.log(`✓ 14 nhiệm vụ đầu bằng click (Chủ điện tầng ${s.levels.chuDien}, ${s.stats.brewed + (s.brew?.n ?? 0)} mẻ đan, yêu thú ${s.beast})`)

  // Tab thứ hai lưu tiến độ mới → tab đầu rời trang không được lưu đè
  const b = await tab()
  await b.js(`localStorage.setItem('rok.save', JSON.stringify({ ...${save}, name: 'Tab hai' }))`)
  await sleep(300)
  await a.js(`dispatchEvent(new Event('pagehide'))`)
  assert.equal((await a.js(save)).name, 'Tab hai', 'tab cũ lưu đè save của tab mới')
  console.log('✓ hai tab không đè save nhau')

  // Desktop: bảng công trình là ngăn kéo không modal — cảnh vẫn bấm được, chọn công trình khác thì ngăn kéo đổi theo
  await a.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false })
  await a.js(`location.reload()`)
  assert.ok(await a.until(`!!document.querySelector('button.quest')`), 'desktop: game không lên')
  const pick = (name: string) => `[...document.querySelectorAll('[aria-label]')].find(e => e.getAttribute('aria-label').startsWith('${name}'))?.click()`
  await a.js(pick('Chủ điện'))
  assert.ok(await a.until(`[...document.querySelectorAll('dialog[open]')].some(d => !d.matches(':modal') && d.innerText.includes('Chủ điện'))`), 'desktop: bảng không mở thành ngăn kéo')
  await a.js(pick('Tụ Linh Trận'))
  assert.ok(await a.until(`[...document.querySelectorAll('dialog[open]')].some(d => d.querySelector('h2')?.innerText === 'Tụ Linh Trận')`), 'desktop: ngăn kéo mở mà không chọn được công trình khác')
  console.log('✓ desktop: ngăn kéo bên phải, vẫn chọn được công trình trên núi')

  // Mất mạng: tắt máy chủ, tải lại — game phải lên từ cache của service worker, cả khi đổi sang ngôn ngữ chưa từng mở
  server.kill()
  await sleep(500)
  for (const lang of ['vi', 'en']) {
    await a.js(`localStorage.setItem('rok.lang', '${lang}'); location.reload()`)
    await sleep(500)
    assert.ok(await a.until(`!!document.querySelector('button.quest, p.quest')`), `offline (${lang}): game không lên`)
  }
  console.log('✓ chơi offline, đổi ngôn ngữ offline')

  assert.deepEqual(errors, [], 'console có lỗi')
  console.log('✓ console sạch')
} finally {
  chrome.kill()
  server.kill()
  await sleep(300)
  rmSync(profile, { recursive: true, force: true })
}
