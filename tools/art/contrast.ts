// Soi chữ khó đọc trên màn đang mở: lấy mọi đoạn chữ đang hiện (vị trí, màu, cỡ), chụp màn, đo nền thật dưới chữ, tính tỉ lệ
// tương phản WCAG. Chữ trên da vẽ tay (border-image) không đọc được màu nền từ CSS — phải đo trên ảnh.
//   node tools/art/contrast.ts --player <tên> [nhãn]   (người chơi của apps/client/play.ts)   · --port 9222 cho Chrome bất kỳ
// Kết quả: danh sách chỗ dưới ngưỡng (4,5 chữ thường, 3 chữ to/đậm) + ảnh đánh dấu ở tools/art/.work/contrast/<nhãn>.png
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const HERE = import.meta.dirname
const arg = (k: string) => process.argv[process.argv.indexOf(k) + 1]
const player = process.argv.includes('--player') ? arg('--player') : undefined
const label =
  process.argv
    .slice(2)
    .filter(a => !a.startsWith('--') && a !== player && a !== arg('--port'))
    .pop() ?? 'screen'
const port = player
  ? JSON.parse(readFileSync(join(process.env.PLAY_DIR ?? join(tmpdir(), 'rok-play'), `player.${player}.json`), 'utf8'))
      .debug
  : Number(arg('--port') ?? 9222)
const tabs: { type: string; webSocketDebuggerUrl: string }[] = await (
  await fetch(`http://127.0.0.1:${port}/json/list`)
).json()
const ws = new WebSocket(tabs.find(t => t.type === 'page')!.webSocketDebuggerUrl)
await new Promise(r => ws.addEventListener('open', r))
let id = 0
const send = (method: string, params: object = {}) =>
  new Promise<any>(ok => {
    const i = ++id
    ws.addEventListener('message', function on(e) {
      const m = JSON.parse(String(e.data))
      if (m.id !== i) return
      ws.removeEventListener('message', on)
      ok(m.result)
    })
    ws.send(JSON.stringify({ id: i, method, params }))
  })

// đoạn chữ: phần tử có nút chữ trực tiếp, đang hiện, không bị che (điểm giữa trúng chính nó hoặc con nó)
const { result } = await send('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const out = []
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const seen = new Set()
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const el = n.parentElement
      if (!el || seen.has(el) || !n.textContent.trim()) continue
      seen.add(el)
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || +cs.opacity === 0) continue
      const range = document.createRange(); range.selectNodeContents(n)
      const r = range.getBoundingClientRect()
      if (r.width < 4 || r.height < 6 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      if (!hit || !(el === hit || el.contains(hit) || hit.contains(el))) continue
      out.push({ text: n.textContent.trim().slice(0, 40), x: r.left, y: r.top, w: r.width, h: r.height,
        color: cs.color, size: parseFloat(cs.fontSize), weight: +cs.fontWeight || 400, shadow: cs.textShadow !== 'none' })
    }
    return { items: out, dpr: devicePixelRatio }
  })()`,
})
const shot = await send('Page.captureScreenshot', { format: 'png' })
ws.close()
const dir = join(HERE, '.work', 'contrast')
mkdirSync(dir, { recursive: true })
writeFileSync(join(dir, `${label}.json`), JSON.stringify(result.value))
writeFileSync(join(dir, `${label}-raw.png`), Buffer.from(shot.data, 'base64'))
execFileSync(join(HERE, '.venv/bin/python'), [join(HERE, 'contrast.py'), join(dir, label)], { stdio: 'inherit' })
