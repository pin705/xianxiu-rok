// Sân chơi thử cho agent đóng vai người chơi: mỗi giới một server game + database tạm, mỗi người chơi một Chrome headless
// giữ nguyên phiên (daemon CDP), điều khiển bằng lệnh CLI — chụp màn hình, đọc màn hình, chạm, gõ, tua giờ.
//   node apps/client/play.ts up tanthu cuthu@1440x900:en  một giới, hai người chơi (mặc định điện thoại 390×844, tiếng Việt)
//   node apps/client/play.ts tanthu look                chữ trên màn + danh sách thứ chạm được (đánh số)
//   node apps/client/play.ts tanthu tap 3 | tap "Nâng cấp" | tapxy 200 400 | fill "Thanh Vân" | type … | key Enter
//   node apps/client/play.ts tanthu shot [nhãn]         ảnh PNG (mở bằng công cụ đọc ảnh)
//   node apps/client/play.ts tanthu scroll 0 400 | wait 1500 | warp 60 | state | patch '{"res":{...}}' | errors | logs | js "…"
//   node apps/client/play.ts ps | down                  xem / dọn hết (server, Chrome, database tạm; giữ ảnh chụp)
// Chơi trên bản chụp của commit (PLAY_REF, mặc định HEAD) trong thư mục tạm, build riêng: code đang sửa dở trong repo
// (phiên khác đang làm) không làm sập server chơi thử, và không đụng apps/client/dist của e2e.
import { spawn, execFileSync, execSync } from 'node:child_process'
import { existsSync, mkdirSync, openSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, type AddressInfo } from 'node:net'
import { createServer as http } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import postgres from 'postgres'

const DIR = process.env.PLAY_DIR ?? join(tmpdir(), 'rok-play')
const SRC = join(DIR, 'src')
const CLIENT = join(SRC, 'apps/client')
if (existsSync(join(import.meta.dirname, '../../.env'))) process.loadEnvFile(join(import.meta.dirname, '../../.env'))
const ADMIN = process.env.DATABASE_URL ?? 'postgres://rok:rok@127.0.0.1:5439/rok'
const CHROME =
  process.env.CHROME ??
  ['/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => existsSync(p))
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const freePort = () =>
  new Promise<number>(ok => {
    const s = createServer().listen(0, () => {
      const { port } = s.address() as AddressInfo
      s.close(() => ok(port))
    })
  })
const ok = (url: string) =>
  fetch(url).then(
    r => r.ok,
    () => false,
  )
type Player = {
  name: string
  world: string
  web: number
  game: number
  debug: number
  ctl: number
  w: number
  h: number
}
type World = { name: string; db: string; web: number; game: number; pids: number[] }
const file = (kind: string, name: string) => join(DIR, `${kind}.${name}.json`)
const load = <T>(kind: string, name: string): T => JSON.parse(readFileSync(file(kind, name), 'utf8'))
const list = (kind: string) =>
  existsSync(DIR)
    ? readdirSync(DIR)
        .filter(f => f.startsWith(`${kind}.`))
        .map(f => f.slice(kind.length + 1, -5))
    : []
// chạy nền, sống tiếp sau khi lệnh CLI thoát; ghi log vào DIR
const daemon = (cmd: string, args: string[], log: string, env = {}, cwd = import.meta.dirname) => {
  const out = openSync(join(DIR, `${log}.log`), 'a')
  const p = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, detached: true, stdio: ['ignore', out, out] })
  p.unref()
  return p.pid!
}

async function up(names: string[]) {
  if (!CHROME) throw new Error('không thấy Chrome (đặt CHROME=...)')
  mkdirSync(join(DIR, 'shots'), { recursive: true })
  const dist = join(DIR, 'dist')
  if (!existsSync(dist)) {
    const ref = process.env.PLAY_REF ?? 'HEAD'
    console.log(`chụp ${ref} + build bản chơi thử…`)
    const root = join(import.meta.dirname, '../..')
    mkdirSync(SRC, { recursive: true })
    // PLAY_REF=worktree: chơi đúng code đang sửa (chưa commit) thay vì một commit
    if (ref === 'worktree')
      execSync(`rsync -a --exclude node_modules --exclude .git --exclude dist --exclude .claude ./ "${SRC}/"`, {
        cwd: root,
      })
    else execSync(`git archive ${ref} | tar -x -C "${SRC}"`, { cwd: root })
    // node_modules chép kiểu clone (APFS: tức thì); link @rok/* là tương đối nên trỏ vào packages của bản chụp
    execFileSync('cp', [process.platform === 'darwin' ? '-Rc' : '-a', join(root, 'node_modules'), SRC])
    execFileSync('npx', ['vite', 'build', '--outDir', dist, '--emptyOutDir', '--logLevel', 'error'], {
      cwd: CLIENT,
      stdio: 'inherit',
    })
  }
  const world = names[0].split(/[@:]/)[0]
  const db = `rok_play_${world.toLowerCase().replace(/\W/g, '')}_${Date.now().toString(36)}`
  const [web, game] = [await freePort(), await freePort()]
  const admin = postgres(ADMIN, { max: 1, connect_timeout: 3, onnotice: () => {} })
  await admin.unsafe(`create database "${db}"`)
  await admin.end()
  const env = {
    PORT: String(game),
    HOST: '127.0.0.1',
    DATABASE_URL: Object.assign(new URL(ADMIN), { pathname: `/${db}` }).toString(),
    ALLOW_WARP: '1',
    LIMITS: 'off',
    LOG_LEVEL: 'warn',
    COMMIT_MS: '10',
  }
  const pids = [daemon(process.execPath, [join(SRC, 'apps/server/src/main.ts')], `server.${world}`, env, SRC)]
  for (let i = 0; i < 150 && !(await ok(`http://127.0.0.1:${game}/readyz`)); i++) await sleep(100)
  pids.push(
    daemon(
      'npx',
      ['vite', 'preview', '--port', String(web), '--strictPort', '--outDir', dist],
      `web.${world}`,
      { ROK_SERVER: `http://127.0.0.1:${game}` },
      CLIENT,
    ),
  )
  writeFileSync(file('world', world), JSON.stringify({ name: world, db, web, game, pids } satisfies World))
  for (let i = 0; i < 150 && !(await ok(`http://127.0.0.1:${web}/`)); i++) await sleep(100)
  for (const spec of names) {
    const [who, lang = 'vi'] = spec.split(':')
    const [name, size = '390x844'] = who.split('@')
    const [w, h] = size.split('x').map(Number)
    const [debug, ctl] = [await freePort(), await freePort()]
    const p: Player = { name, world, web, game, debug, ctl, w, h }
    writeFileSync(file('player', name), JSON.stringify(p))
    pids.push(
      daemon(
        CHROME,
        [
          '--headless=new',
          `--remote-debugging-port=${debug}`,
          `--user-data-dir=${join(DIR, `chrome.${name}`)}`,
          '--no-first-run',
          `--lang=${lang}`,
          `--accept-lang=${lang}`,
          'about:blank',
        ],
        `chrome.${name}`,
      ),
      daemon(process.execPath, [import.meta.filename, 'serve', name], `ctl.${name}`),
    )
    writeFileSync(file('world', world), JSON.stringify({ name: world, db, web, game, pids } satisfies World))
    for (let i = 0; i < 300 && !(await ok(`http://127.0.0.1:${ctl}/ready`)); i++) await sleep(100)
    if (!(await ok(`http://127.0.0.1:${ctl}/ready`)))
      throw new Error(`${name} không lên: ${readFileSync(join(DIR, `ctl.${name}.log`), 'utf8').slice(0, 800)}`)
    console.log(`${name}: sẵn sàng (${w}×${h}, ${lang}) · giới ${world} · game :${game} · web :${web}`)
  }
}

async function down() {
  for (const name of list('world')) {
    const w = load<World>('world', name)
    for (const pid of w.pids) {
      try {
        process.kill(-pid) // cả nhóm tiến trình (Chrome, vite có tiến trình con)
      } catch {}
    }
    await sleep(500)
    const admin = postgres(ADMIN, { max: 1, connect_timeout: 3, onnotice: () => {} })
    await admin.unsafe(`drop database if exists "${w.db}" with (force)`).catch(e => console.log(`${w.db}: ${e}`))
    await admin.end()
  }
  // giữ ảnh chụp để còn xem lại sau buổi chơi thử
  for (const f of existsSync(DIR) ? readdirSync(DIR) : [])
    if (f !== 'shots') rmSync(join(DIR, f), { recursive: true, force: true })
  console.log(`đã dọn (ảnh chụp còn ở ${join(DIR, 'shots')})`)
}

// ——— daemon: giữ một phiên CDP cho một người chơi (giữ khung điện thoại, gom lỗi console), nhận lệnh qua HTTP ———

async function cdp(debug: number) {
  let target: { webSocketDebuggerUrl: string } | undefined
  for (let i = 0; i < 100 && !target; i++) {
    const all = await fetch(`http://127.0.0.1:${debug}/json/list`).then(
      r => r.json() as Promise<{ type: string; webSocketDebuggerUrl: string }[]>,
      () => [],
    )
    target = all.find(t => t.type === 'page')
    if (!target) await sleep(100)
  }
  const ws = new WebSocket(target!.webSocketDebuggerUrl)
  await new Promise(r => ws.addEventListener('open', r))
  let id = 0
  const wait = new Map<number, (v: any) => void>()
  const events: ((m: any) => void)[] = []
  ws.addEventListener('message', e => {
    const m = JSON.parse(String(e.data))
    if (m.id) wait.get(m.id)?.(m)
    else events.forEach(f => f(m))
  })
  const send = (method: string, params = {}) =>
    new Promise<any>((done, fail) => {
      const i = ++id
      wait.set(i, m => (m.error ? fail(new Error(`${method}: ${m.error.message}`)) : done(m.result)))
      ws.send(JSON.stringify({ id: i, method, params }))
      setTimeout(() => fail(new Error(`CDP không trả lời: ${method}`)), 20000)
    })
  return { send, on: (f: (m: any) => void) => events.push(f) }
}

// Chạy trong trang: chữ đang thấy + mọi thứ chạm được còn trên màn (đánh số, lưu vào window.__play để `tap <số>`)
const LOOK = `(() => {
  const seen = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e)
    return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && +s.opacity > 0.05 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth }
  const q = 'button, a[href], input, select, textarea, summary, [role=button], [role=tab], [role=slider], [tabindex]:not([tabindex="-1"]), [aria-label]:not(svg):not(img)'
  const dlg = [...document.querySelectorAll('dialog[open]')].pop()
  const els = [...document.querySelectorAll(q)].filter(seen).filter((e, _, a) => !a.some(p => p !== e && p.contains(e) && p.matches('button, a[href], [role=button]')))
    .filter(e => !dlg || dlg.contains(e) || !e.closest('[inert]') && document.elementFromPoint(...(r => [r.left + r.width / 2, r.top + r.height / 2])(e.getBoundingClientRect()))?.closest('dialog') !== dlg)
  window.__play = els
  const text = (dlg ?? document.body).innerText.replace(/\\n{3,}/g, '\\n\\n').slice(0, 2500)
  const rows = els.map((e, i) => { const r = e.getBoundingClientRect(), x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2)
    const top = document.elementFromPoint(x, y), hit = !!top && (e === top || e.contains(top) || top.contains(e))
    const label = (e.getAttribute('aria-label') || e.innerText || e.value || e.placeholder || e.title || '').trim().replace(/\\s+/g, ' ').slice(0, 70)
    return i + '. ' + e.tagName.toLowerCase() + (e.type && e.tagName === 'INPUT' ? '[' + e.type + ']' : '') + ' "' + label + '" @' + x + ',' + y + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)
      + (e.disabled || e.getAttribute('aria-disabled') === 'true' ? ' [tắt]' : '') + (hit ? '' : ' [bị che]') + (r.width < 32 || r.height < 32 ? ' [nhỏ]' : '') })
  return (dlg ? '【hộp thoại】 ' : '') + text + '\\n\\n— chạm được —\\n' + rows.join('\\n')
})()`
const FIND = (t: string) => `(() => {
  const t = ${JSON.stringify(t)}.toLowerCase(), els = window.__play ?? []
  const label = e => (e.getAttribute('aria-label') || e.innerText || e.value || '').trim().toLowerCase()
  const e = els.find(e => e.isConnected && label(e) === t) ?? els.find(e => e.isConnected && label(e).includes(t))
  return e ? els.indexOf(e) : -1
})()`
const SPOT = (i: number) => `(() => { const e = (window.__play ?? [])[${i}]; if (!e?.isConnected) return null
  const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()`
const NOW = `(() => { const d = [...document.querySelectorAll('dialog[open]')].pop()
  const toast = [...document.querySelectorAll('.toast, [role=status], [role=alert]')].map(e => e.innerText.trim()).filter(Boolean).join(' | ')
  return 'hộp thoại: ' + (d ? (d.querySelector('h1,h2,h3')?.innerText ?? d.innerText.slice(0, 60)).trim() : '—') + (toast ? ' · thông báo: ' + toast : '') })()`
const dev = (path: string, body?: unknown) =>
  `fetch('/api/dev/${path}', ${body === undefined ? '{}' : `{ method: 'POST', headers: { 'content-type': 'application/json', 'x-rok': '1' }, body: JSON.stringify(${JSON.stringify(body)}) }`}).then(r => r.json())`

// mở trang game trong khung của người chơi, gom lỗi console
async function open(p: Player) {
  const { send, on } = await cdp(p.debug)
  const errors: string[] = []
  on(m => {
    if (m.method === 'Runtime.exceptionThrown')
      errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text)
    if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type))
      errors.push(`${m.params.type}: ${m.params.args.map((a: any) => a.value ?? a.description).join(' ')}`)
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error')
      errors.push(`${m.params.entry.text} ${m.params.entry.url ?? ''}`)
  })
  for (const m of ['Runtime.enable', 'Page.enable', 'Log.enable']) await send(m)
  const mobile = p.w < 768
  const screen = { width: p.w, height: p.h, deviceScaleFactor: 1, mobile }
  await send('Emulation.setDeviceMetricsOverride', screen)
  if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  await send('Page.navigate', { url: `http://localhost:${p.web}/` })
  await sleep(1500)
  const js = async (expression: string) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
    return r.result.value
  }
  return { send, js, errors }
}

async function serve(name: string) {
  const p = load<Player>('player', name)
  const { send, js, errors } = await open(p)
  const mouse = async (x: number, y: number) => {
    for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased'])
      await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 })
  }
  let shots = 0
  const after = async (what: string) => {
    await sleep(700)
    return `${what} → ${await js(NOW)}`
  }
  const cmds: Record<string, (a: string[]) => Promise<unknown>> = {
    look: () => js(LOOK),
    shot: async ([label = '']) => {
      const { data } = await send('Page.captureScreenshot', { format: 'png' })
      const out = join(DIR, 'shots', `${name}-${String(++shots).padStart(3, '0')}${label ? `-${label}` : ''}.png`)
      writeFileSync(out, Buffer.from(data, 'base64'))
      return out
    },
    tap: async ([which]) => {
      const byIndex = /^\d+$/.test(which) // số: theo lần look trước; chữ: tìm trên màn hiện tại
      let i = byIndex ? Number(which) : -1
      if (byIndex && !(await js('!!window.__play'))) await js(LOOK)
      for (let t = 0; !byIndex && i < 0 && t < 8; t++) {
        if (t) await sleep(400) // màn còn đang chuyển
        await js(LOOK)
        i = await js(FIND(which))
      }
      const at = i < 0 ? null : await js(SPOT(i))
      if (!at) return `không thấy "${which}" (chạy look lại)`
      await mouse(at.x, at.y)
      return after(`chạm #${i} @${Math.round(at.x)},${Math.round(at.y)}`)
    },
    tapxy: async ([x, y]) => {
      await mouse(+x, +y)
      return after(`chạm @${x},${y}`)
    },
    type: async ([text]) => {
      await send('Input.insertText', { text })
      return `gõ "${text}"`
    },
    fill: async ([text]) => {
      await js('document.activeElement?.select?.()') // như người chơi chọn hết rồi gõ đè
      await send('Input.insertText', { text })
      return `điền "${text}"`
    },
    key: async ([key]) => {
      for (const type of ['keyDown', 'keyUp'])
        await send('Input.dispatchKeyEvent', { type, key, code: key, windowsVirtualKeyCode: key === 'Enter' ? 13 : 0 })
      return after(`phím ${key}`)
    },
    scroll: async ([dx, dy, x = String(p.w / 2), y = String(p.h / 2)]) => {
      await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: +x, y: +y, deltaX: +dx, deltaY: +dy })
      return after(`cuộn ${dx},${dy}`)
    },
    wait: async ([ms = '1000']) => {
      await sleep(+ms)
      return js(NOW)
    },
    warp: async ([min]) => {
      await js(dev('warp', { min: +min }))
      return after(`tua ${min} phút`)
    },
    state: () => js(dev('state')),
    patch: async ([json]) => {
      const { state } = await js(dev('state'))
      const d = JSON.parse(json)
      for (const k of Object.keys(d))
        state[k] = d[k] && typeof d[k] === 'object' && !Array.isArray(d[k]) ? { ...state[k], ...d[k] } : d[k]
      return js(dev('state', { state }))
    },
    errors: async () => errors.splice(0).join('\n') || '(không có lỗi)',
    logs: async () =>
      readFileSync(join(DIR, `server.${p.world}.log`), 'utf8')
        .split('\n')
        .slice(-60)
        .join('\n') || '(log trống)',
    js: ([expr]) => js(expr),
    reload: async () => {
      await send('Page.reload')
      await sleep(2500)
      return 'tải lại'
    },
  }
  http(async (req, res) => {
    if (req.url === '/ready') return res.end('ok')
    let body = ''
    for await (const c of req) body += c
    const [cmd, ...args] = JSON.parse(body || '[]') as string[]
    try {
      const out = cmds[cmd] ? await cmds[cmd](args) : `lệnh không có: ${cmd} (có: ${Object.keys(cmds).join(', ')})`
      res.end(typeof out === 'string' ? out : JSON.stringify(out))
    } catch (e) {
      res.statusCode = 500
      res.end(String(e))
    }
  }).listen(p.ctl, '127.0.0.1')
}

const [cmd, ...rest] = process.argv.slice(2)
if (cmd === 'up') await up(rest)
else if (cmd === 'down') await down()
else if (cmd === 'serve') await serve(rest[0])
else if (cmd === 'ps')
  console.log(
    list('player')
      .map(n => JSON.stringify(load<Player>('player', n)))
      .join('\n') || '(chưa có ai)',
  )
else if (cmd && existsSync(file('player', cmd))) {
  const p = load<Player>('player', cmd)
  const r = await fetch(`http://127.0.0.1:${p.ctl}/`, { method: 'POST', body: JSON.stringify(rest) })
  console.log(await r.text())
  if (!r.ok) process.exitCode = 1
} else console.log(readFileSync(import.meta.filename, 'utf8').split('\nimport')[0])
