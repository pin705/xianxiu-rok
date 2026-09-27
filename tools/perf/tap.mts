// Độ trễ thao tác: bấm một nút (theo tên), đo tới khung hình đầu tiên sau khi bảng/hộp thoại mở, và long task trong lúc đó.
//   PLAY_DIR=… node tools/perf/tap.mts <người chơi> "<tên nút regex>" [cpu=1]
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
const [who, name, thr = '1'] = process.argv.slice(2)
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
const r = await send('Runtime.evaluate', {
  awaitPromise: true,
  returnByValue: true,
  expression: `new Promise(ok=>{
  document.querySelectorAll('dialog[open]').forEach(d=>d.close())
  const b=[...document.querySelectorAll('button')].find(b=>new RegExp(${JSON.stringify(name)}).test(b.getAttribute('aria-label')||b.textContent||''))
  if(!b) return ok('không thấy nút')
  const lt=[];const po=new PerformanceObserver(l=>{for(const e of l.getEntries())lt.push(Math.round(e.duration))});po.observe({type:'longtask'})
  const t0=performance.now();b.click()
  requestAnimationFrame(()=>requestAnimationFrame(()=>{const t=performance.now()-t0;setTimeout(()=>{po.disconnect();ok({ms:Math.round(t),longtasks:lt,dialog:document.querySelector('dialog[open]')?.getAttribute('aria-label')})},300)}))
})`,
})
console.log(`cpu ${thr} · ${name}: ${JSON.stringify(r.result.value)}`)
await send('Emulation.setCPUThrottlingRate', { rate: 1 })
ws.close()
