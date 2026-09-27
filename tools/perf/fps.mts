// Đo độ mượt: khung hình/giây, khung chậm (>20ms, >50ms), và hàm tốn CPU nhất trong N giây ở màn hiện tại.
//   PLAY_DIR=… node tools/perf/fps.mts <người chơi> [giây=5] [cpu-throttle=1]
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
const [who, secs = '5', thr = '1'] = process.argv.slice(2)
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
await send('Emulation.setCPUThrottlingRate', { rate: Number(thr) })
const dpr = Number(process.env.DPR ?? 1)
if (dpr !== 1) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: pl.w,
    height: pl.h,
    deviceScaleFactor: dpr,
    mobile: pl.w < 800,
  })
  await new Promise(r => setTimeout(r, 1500))
}
await send('Profiler.enable')
await send('Profiler.setSamplingInterval', { interval: 500 })
await send('Profiler.start')
const ms = Number(secs) * 1000
const r = await send('Runtime.evaluate', {
  awaitPromise: true,
  returnByValue: true,
  expression: `new Promise(ok=>{const f=[];let last=performance.now();const t0=last;function step(t){f.push(t-last);last=t;if(t-t0<${ms})requestAnimationFrame(step);else ok({n:f.length,fps:+(f.length/((t-t0)/1000)).toFixed(1),slow20:f.filter(x=>x>20).length,slow50:f.filter(x=>x>50).length,max:Math.round(Math.max(...f))})}requestAnimationFrame(step)})`,
})
const prof = (await send('Profiler.stop')).profile
const dt = prof.timeDeltas as number[]
const self = new Map<number, number>()
prof.samples.forEach((s: number, i: number) => self.set(s, (self.get(s) ?? 0) + (dt[i] ?? 0)))
const byFn = new Map<string, number>()
let busy = 0
for (const n of prof.nodes) {
  const t = self.get(n.id) ?? 0
  if (!t) continue
  const f = n.callFrame
  if (f.functionName !== '(idle)') busy += t
  const k = `${f.functionName || '(anon)'} ${f.url.split('/').pop()?.split('?')[0]}:${f.lineNumber}`
  byFn.set(k, (byFn.get(k) ?? 0) + t)
}
console.log(
  `cpu ${thr} · ${JSON.stringify(r.result.value)} · luồng chính bận ${(busy / 1000 / Number(secs) / 10).toFixed(0)}%`,
)
console.log(
  [...byFn]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([k, t]) => `${(t / 1000).toFixed(0).padStart(5)}ms ${k}`)
    .join('\n'),
)
await send('Emulation.setCPUThrottlingRate', { rate: 1 })
if (dpr !== 1)
  await send('Emulation.setDeviceMetricsOverride', {
    width: pl.w,
    height: pl.h,
    deviceScaleFactor: 1,
    mobile: pl.w < 800,
  })
ws.close()
