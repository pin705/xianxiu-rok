// Đo mở game lần đầu (Chrome mới, không cache): request, dung lượng, mốc thời gian, tổng thời gian luồng chính bị chặn (long task).
//   node tools/perf/load.mts <url> [cpu-throttle=1]
import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const [url, thr = '1'] = process.argv.slice(2)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const port = 9300 + Math.floor(Math.random() * 500)
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), 'perf-'))}`,
    '--no-first-run',
    '--window-size=1440,900',
    'about:blank',
  ],
  { stdio: 'ignore' },
)
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
let tabs: any[] = []
for (let i = 0; i < 50 && !tabs.length; i++) {
  await sleep(200)
  tabs = await fetch(`http://127.0.0.1:${port}/json/list`).then(
    r => r.json(),
    () => [],
  )
}
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl)
await new Promise(r => ws.addEventListener('open', r))
let id = 0
const pending = new Map<number, (v: any) => void>()
const events: any[] = []
ws.addEventListener('message', e => {
  const m = JSON.parse(String(e.data))
  if (m.id) pending.get(m.id)?.(m.result)
  else events.push(m)
})
const send = (method: string, params: any = {}) =>
  new Promise<any>(ok => {
    const i = ++id
    pending.set(i, ok)
    ws.send(JSON.stringify({ id: i, method, params }))
  })
await send('Network.enable')
await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setCPUThrottlingRate', { rate: Number(thr) })
// NET=mbps: giả lập mạng thật (localhost tải tức thì, không thấy gói tranh nặng)
if (process.env.NET)
  await send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 40,
    downloadThroughput: (Number(process.env.NET) * 1e6) / 8,
    uploadThroughput: 5e6 / 8,
  })
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `window.__lt=[];new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lt.push([Math.round(e.startTime),Math.round(e.duration)])}).observe({type:'longtask',buffered:true})`,
})
const t0 = Date.now()
await send('Page.navigate', { url })
const ev = async (expr: string) =>
  (await send('Runtime.evaluate', { expression: expr, returnByValue: true }))?.result?.value
let ready = 0
for (let i = 0; i < 600; i++) {
  await sleep(100)
  if (await ev(`!!document.querySelector('button') && /Chạm để bắt đầu|Tap to begin/.test(document.body.innerText)`)) {
    ready = Date.now() - t0
    break
  }
}
await sleep(1500)
const reqs = events.filter(e => e.method === 'Network.loadingFinished')
const bytes = reqs.reduce((n, e) => n + (e.params.encodedDataLength ?? 0), 0)
const lt = (await ev('window.__lt')) ?? []
const nav = await ev(`JSON.stringify(performance.getEntriesByType('navigation')[0]?.toJSON?.() ?? {})`)
const n = JSON.parse(nav || '{}')
const byType: Record<string, [number, number]> = {}
const typeOf = new Map(
  events
    .filter(e => e.method === 'Network.responseReceived')
    .map(e => [e.params.requestId, [e.params.type, e.params.response.url]]),
)
const big: [number, string][] = []
for (const e of reqs) {
  const [t, u] = typeOf.get(e.params.requestId) ?? ['?', '']
  byType[t] ??= [0, 0]
  byType[t][0]++
  byType[t][1] += e.params.encodedDataLength
  big.push([e.params.encodedDataLength, u])
}
big.sort((a, b) => b[0] - a[0])
console.log(
  JSON.stringify(
    {
      url,
      cpu: thr,
      readyMs: ready,
      dcl: Math.round(n.domContentLoadedEventEnd ?? 0),
      load: Math.round(n.loadEventEnd ?? 0),
      requests: reqs.length,
      MB: +(bytes / 1e6).toFixed(2),
      byType: Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, `${v[0]} · ${(v[1] / 1e6).toFixed(2)}MB`])),
      top: big
        .slice(0, 8)
        .map(([sz, u]) => `${(sz / 1e6).toFixed(2)}MB ${u.replace(/^https?:\/\/[^/]+/, '').slice(0, 90)}`),
      text: await ev('document.body.innerText.slice(0,200)'),
      longTasks: lt.length,
      longTaskMs: lt.reduce((s: number, x: number[]) => s + x[1], 0),
      worst: lt.sort((a: number[], b: number[]) => b[1] - a[1]).slice(0, 5),
    },
    null,
    1,
  ),
)
ws.close()
chrome.kill()
