// Xuất hình vẽ bằng code từ một trang game đang mở với ?art=0 (globalThis.__art — packages/art/art.ts) qua Chrome DevTools:
// texture cảnh → .work/proc/<key>.png + meta.json, da giao diện → .work/skins/<tên>.png + meta.json, key đã nướng → gộp vào keys.json.
// Đó là nguồn để vẽ đè giữ nguyên hình (bậc đá, da 9 mảnh…) và là hộp/điểm neo khi ghép tranh.
//   node tools/art/export.ts --player <tên>   người chơi của apps/client/play.ts (đọc cổng debug từ trạng thái của play.ts)
//   node tools/art/export.ts --port 9222      Chrome bất kỳ đang mở remote debugging
// Trang phải mở với ?art=0 (không thì cache chứa tranh chứ không phải bản vẽ code) và đã đi qua cảnh cần xuất
// (texture chỉ được nướng khi cảnh đó hiện lên: núi, bản đồ, trận…). Chạy nhiều lần, mỗi cảnh một lần — kết quả được gộp.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const HERE = import.meta.dirname
const arg = (k: string) => process.argv[process.argv.indexOf(k) + 1]
const player = process.argv.includes('--player') ? arg('--player') : undefined
const port = player
  ? JSON.parse(readFileSync(join(process.env.PLAY_DIR ?? join(tmpdir(), 'rok-play'), `player.${player}.json`), 'utf8')).debug
  : Number(arg('--port') ?? 9222)

// CDP tối giản: tab trang đầu tiên, Runtime.evaluate có chờ promise
const tabs: { type: string; url: string; webSocketDebuggerUrl: string }[] = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
const tab = tabs.find(t => t.type === 'page' && /[?&]art=0/.test(t.url)) ?? tabs.find(t => t.type === 'page')
if (!tab) throw new Error(`không có trang nào ở cổng ${port}`)
if (!/[?&]art=0/.test(tab.url)) console.warn(`⚠ trang ${tab.url} không mở với ?art=0 — thêm ?art=0 vào địa chỉ rồi chạy lại`)
const ws = new WebSocket(tab.webSocketDebuggerUrl)
await new Promise(r => ws.addEventListener('open', r))
let id = 0
const js = (expression: string) =>
  new Promise<any>((ok, no) => {
    const i = ++id
    ws.addEventListener('message', function on(e) {
      const m = JSON.parse(String(e.data))
      if (m.id !== i) return
      ws.removeEventListener('message', on)
      if (m.error || m.result.exceptionDetails) no(new Error(JSON.stringify(m.error ?? m.result.exceptionDetails).slice(0, 400)))
      else ok(m.result.result.value)
    })
    ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } }))
  })

// canvas → data URL (OffscreenCanvas thì qua blob)
const PNG = `async cv => cv.convertToBlob
  ? await new Promise(r => cv.convertToBlob().then(b => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b) }))
  : cv.toDataURL('image/png')`
const got = await js(`(async () => {
  const art = globalThis.__art
  if (!art) return null
  const png = ${PNG}
  const painted = [], skins = []
  for (const [k, p] of art.painted ?? new Map()) {
    const cv = p.tex?.source?.resource
    if (cv?.getContext || cv?.convertToBlob) painted.push({ key: k.replace(/@[^@]*$/, ''), scale: p.scale, anchor: p.anchor, w: cv.width / p.scale, h: cv.height / p.scale, png: await png(cv) })
  }
  for (const [name, s] of Object.entries(art.skins)) {
    const { cv, ...m } = s
    skins.push({ name, ...m, pw: cv.width, ph: cv.height, png: await png(cv) })
  }
  return { painted, skins, keys: art.keys() }
})()`)
ws.close()
if (!got) throw new Error('trang không có globalThis.__art — mở game với ?art=0')

const file = (key: string) => key.replace(/:/g, '-').replace(/#/g, '')
const merge = (path: string, add: Record<string, unknown>) => {
  const old = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {}
  writeFileSync(path, JSON.stringify({ ...old, ...add }, null, 1))
}
for (const [dir, list, name] of [
  ['proc', got.painted, 'key'],
  ['skins', got.skins, 'name'],
] as const) {
  mkdirSync(join(HERE, '.work', dir), { recursive: true })
  const meta: Record<string, unknown> = {}
  for (const { png, ...m } of list) {
    const k = m[name]
    writeFileSync(join(HERE, '.work', dir, `${file(k)}.png`), Buffer.from(png.split(',')[1], 'base64'))
    meta[k] = m
  }
  merge(join(HERE, '.work', dir, 'meta.json'), meta)
}
// keys.json: danh sách asset (spec.ts, cỡ ảnh HTML) — giữ cỡ lớn nhất từng thấy
const kf = join(HERE, 'keys.json')
const keys = JSON.parse(readFileSync(kf, 'utf8'))
let fresh = 0
for (const [k, v] of Object.entries<any>(got.keys)) {
  if (!keys[k]) fresh++
  keys[k] = { ...keys[k], ...v, px: Math.max(v.px, keys[k]?.px ?? 0), screens: keys[k]?.screens ?? [] }
}
writeFileSync(kf, JSON.stringify(keys, null, 2) + '\n')
console.log(`${got.painted.length} texture, ${got.skins.length} da, ${Object.keys(got.keys).length} key (${fresh} mới) → tools/art/.work, keys.json`)
