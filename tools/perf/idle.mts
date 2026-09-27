// Đứng yên N giây: đếm tính lại style / layout / vẽ lại (paint) mỗi giây và thời gian của chúng — trang tĩnh mà các số này
// cao là có thứ đang chạy ngầm mỗi khung hình (hoạt ảnh CSS có filter, cập nhật DOM theo tick…).
//   PLAY_DIR=… node tools/perf/idle.mts <người chơi> [giây=5]
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
const [who, secs = '5'] = process.argv.slice(2)
const pl = JSON.parse(readFileSync(`${process.env.PLAY_DIR ?? `${tmpdir()}/rok-play`}/player.${who}.json`, 'utf8'))
const tabs = await (await fetch(`http://127.0.0.1:${pl.debug}/json/list`)).json()
const ws = new WebSocket(tabs.find((t: any) => t.type === 'page').webSocketDebuggerUrl)
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
await send('Performance.enable')
const get = async () =>
  Object.fromEntries(((await send('Performance.getMetrics')).metrics as any[]).map(m => [m.name, m.value]))
const a = await get()
// đếm paint bằng Tracing sự kiện Paint trong N giây
await send('Tracing.start', { categories: 'devtools.timeline', transferMode: 'ReturnAsStream' })
await new Promise(r => setTimeout(r, Number(secs) * 1000))
const b = await get()
const done = new Promise<any>(r =>
  ws.addEventListener('message', e => {
    const m = JSON.parse(String(e.data))
    if (m.method === 'Tracing.tracingComplete') r(m.params)
  }),
)
await send('Tracing.end')
const { stream } = await done
let data = ''
for (;;) {
  const c = await send('IO.read', { handle: stream })
  data += c.data
  if (c.eof) break
}
const tr = JSON.parse(data)
const evs: any[] = tr.traceEvents ?? tr
const count = (n: string) => evs.filter(e => e.name === n && (e.ph === 'X' || e.ph === 'B')).length
const dur = (n: string) => evs.filter(e => e.name === n && e.ph === 'X').reduce((s, e) => s + (e.dur ?? 0), 0) / 1000
const s = Number(secs)
const d = (k: string) => b[k] - a[k]
console.log(
  JSON.stringify({
    'tính style/giây': +(d('RecalcStyleCount') / s).toFixed(1),
    'ms style/giây': +((d('RecalcStyleDuration') * 1000) / s).toFixed(1),
    'layout/giây': +(d('LayoutCount') / s).toFixed(1),
    'ms layout/giây': +((d('LayoutDuration') * 1000) / s).toFixed(1),
    'ms script/giây': +((d('ScriptDuration') * 1000) / s).toFixed(1),
    'ms task/giây': +((d('TaskDuration') * 1000) / s).toFixed(1),
    'paint/giây': +(count('Paint') / s).toFixed(1),
    'ms paint/giây': +(dur('Paint') / s).toFixed(1),
    'raster ms/giây': +(dur('RasterTask') / s).toFixed(1),
    'composite/giây': +(count('CompositeLayers') / s).toFixed(1),
  }),
)
ws.close()
