// Đo từ lúc tải lại tới lúc vào hẳn cảnh tông môn (người chơi play.ts có sẵn tông môn): mốc thời gian, long task,
// và hồ sơ CPU (hàm tốn nhiều thời gian nhất, tính theo self time) trong lúc vào game.
//   PLAY_DIR=… node tools/perf/enter.mts <người chơi> [cpu-throttle=1]
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
const [who, thr = '1'] = process.argv.slice(2)
const pl = JSON.parse(readFileSync(`${process.env.PLAY_DIR ?? `${tmpdir()}/rok-play`}/player.${who}.json`, 'utf8'))
const tabs = await (await fetch(`http://127.0.0.1:${pl.debug}/json/list`)).json()
const ws = new WebSocket(tabs.find((t: any) => t.type === 'page').webSocketDebuggerUrl)
await new Promise(r => ws.addEventListener('open', r))
let id = 0
const pending = new Map<number, (v: any) => void>()
ws.addEventListener('message', e => {
  const m = JSON.parse(String(e.data))
  if (m.id) pending.get(m.id)?.(m.result)
})
const send = (method: string, params: any = {}) =>
  new Promise<any>(ok => {
    const i = ++id
    pending.set(i, ok)
    ws.send(JSON.stringify({ id: i, method, params }))
  })
const ev = async (expr: string) =>
  (await send('Runtime.evaluate', { expression: expr, returnByValue: true }))?.result?.value
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
await send('Emulation.setCPUThrottlingRate', { rate: Number(thr) })
await send('Network.enable')
if (process.env.NET)
  await send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 40,
    downloadThroughput: (Number(process.env.NET) * 1e6) / 8,
    uploadThroughput: 5e6 / 8,
  })
// NOCACHE=1: như lần mở đầu (xoá cache trình duyệt + service worker)
if (process.env.NOCACHE) {
  await send('Network.clearBrowserCache')
  await send('Storage.clearDataForOrigin', {
    origin: new URL(
      (await (await fetch(`http://127.0.0.1:${pl.debug}/json/list`)).json()).find((t: any) => t.type === 'page').url,
    ).origin,
    storageTypes: 'service_workers,cache_storage',
  })
}
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `window.__lt=[];new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lt.push([Math.round(e.startTime),Math.round(e.duration)])}).observe({type:'longtask',buffered:true})`,
})
await send('Profiler.enable')
await send('Profiler.setSamplingInterval', { interval: 500 })
const t0 = Date.now()
await send('Page.reload', { ignoreCache: false })
await send('Profiler.start')
let title = 0,
  hud = 0
for (let i = 0; i < 600; i++) {
  await sleep(50)
  const st = await ev(
    `(()=>{const b=[...document.querySelectorAll('button')].find(b=>/Chạm để bắt đầu|Tap to begin/.test(b.textContent));if(b&&!b.disabled){b.click();return 'title'}return document.querySelector('.hud')&&document.querySelector('canvas')?'hud':''})()`,
  )
  if (st === 'title' && !title) title = Date.now() - t0
  if (st === 'hud') {
    hud = Date.now() - t0
    break
  }
}
await sleep(3000)
const prof = (await send('Profiler.stop')).profile
const lt = (await ev('window.__lt')) ?? []
// self time theo hàm
const dt = prof.timeDeltas as number[]
const self = new Map<number, number>()
prof.samples.forEach((s: number, i: number) => self.set(s, (self.get(s) ?? 0) + (dt[i] ?? 0)))
const byFn = new Map<string, number>()
for (const n of prof.nodes) {
  const t = self.get(n.id) ?? 0
  if (!t) continue
  const f = n.callFrame
  const k = `${f.functionName || '(anon)'} ${f.url.split('/').pop()?.split('?')[0]}:${f.lineNumber}`
  byFn.set(k, (byFn.get(k) ?? 0) + t)
}
const top = [...byFn]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 25)
  .map(([k, t]) => `${(t / 1000).toFixed(0).padStart(5)}ms ${k}`)
console.log(
  `cpu ${thr} · màn tiêu đề ${title}ms · vào cảnh ${hud}ms · long task ${lt.length} cái, ${lt.reduce((s: number, x: number[]) => s + x[1], 0)}ms · nặng nhất ${JSON.stringify(lt.sort((a: number[], b: number[]) => b[1] - a[1]).slice(0, 6))}`,
)
console.log(top.join('\n'))
await send('Emulation.setCPUThrottlingRate', { rate: 1 })
await send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 0,
  downloadThroughput: -1,
  uploadThroughput: -1,
})
ws.close()
