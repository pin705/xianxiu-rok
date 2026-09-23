// Chơi thật trên bản build: Chrome headless (qua CDP, không cần thư viện) bấm như người chơi.
// Chạy: npm run build && npm run e2e   (Chrome ở chỗ khác thì đặt CHROME=/đường/dẫn)
// Kiểm: lập tông môn → 14 nhiệm vụ đầu chỉ bằng click (xây, tuyển, săn, luyện đan, bí cảnh), 2 tab không đè save nhau,
// console không có lỗi. Đồng hồ trang được tua (Date.now) để khỏi chờ thật.
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
if (!existsSync(CHROME)) {
  console.log(`bỏ qua e2e: không thấy Chrome ở ${CHROME} (đặt CHROME=...)`)
  process.exit(0)
}
const URL = 'http://localhost:4178/'
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const profile = mkdtempSync(join(tmpdir(), 'rok-e2e-'))
const server = spawn('npx', ['vite', 'preview', '--port', '4178', '--strictPort'], { cwd: import.meta.dirname, stdio: 'ignore' })
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9334', `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' })
const errors: string[] = []

async function tab() {
  let t: any
  for (let i = 0; i < 50 && !t; i++) {
    try {
      t = await (await fetch('http://127.0.0.1:9334/json/new?about:blank', { method: 'PUT' })).json()
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
  return { js }
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
  await sleep(1500)
  for (const sel of ['button.cover', '.skip button', 'form button[type=submit]']) {
    await a.js(`document.querySelector('${sel}').click()`)
    await sleep(500)
  }
  await sleep(2500)
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

  assert.deepEqual(errors, [], 'console có lỗi')
  console.log('✓ console sạch')
} finally {
  chrome.kill()
  server.kill()
  await sleep(300)
  rmSync(profile, { recursive: true, force: true })
}
