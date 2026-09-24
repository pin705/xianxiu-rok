// Luật lint cho phần markup của .svelte: oxlint chỉ đọc <script>, nên handler và biểu thức trong template soát ở đây —
// cùng hai luật với .oxlintrc.json: không chuỗi dấu phẩy (a(), b()), ternary lồng tối đa 2 tầng.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'svelte/compiler'

const root = join(import.meta.dirname, '../..')
const DIRS = ['apps/client/src', 'packages/art']
type Node = { type?: string; start?: number; consequent?: Node; alternate?: Node; [k: string]: unknown }
const depth = (n?: Node): number =>
  n?.type === 'ConditionalExpression' ? 1 + Math.max(depth(n.consequent), depth(n.alternate)) : 0

test('template .svelte: không chuỗi dấu phẩy, ternary lồng tối đa 2 tầng', () => {
  const bad: string[] = []
  const files = DIRS.flatMap(d =>
    readdirSync(join(root, d), { recursive: true, encoding: 'utf8' })
      .filter(f => f.endsWith('.svelte'))
      .map(f => join(d, f)),
  )
  for (const f of files) {
    const src = readFileSync(join(root, f), 'utf8')
    const at = (n: Node) => `${f}:${src.slice(0, n.start).split('\n').length}`
    const walk = (n: unknown, parent?: Node) => {
      if (!n || typeof n !== 'object') return
      if (Array.isArray(n)) return n.forEach(x => walk(x, parent))
      const node = n as Node
      if (node.type === 'Script') return // phần script: oxlint
      if (node.type === 'SequenceExpression') bad.push(`${at(node)}: chuỗi dấu phẩy — viết thành khối lệnh`)
      if (node.type === 'ConditionalExpression' && parent?.type !== 'ConditionalExpression' && depth(node) > 2)
        bad.push(`${at(node)}: ternary lồng ${depth(node)} tầng — dùng bảng tra hoặc $derived.by với if`)
      for (const [k, v] of Object.entries(node)) if (k !== 'parent' && k !== 'metadata') walk(v, node)
    }
    walk(parse(src, { modern: true }).fragment)
  }
  assert.deepEqual(bad, [])
})

// CSS không có custom media: bố cục desktop viết lại cùng một truy vấn ở từng component — phải khớp DESK (lib.ts, phía JS)
test('@media desktop ở mọi component khớp đúng DESK trong lib.ts', () => {
  const desk = readFileSync(join(root, 'apps/client/src/lib.ts'), 'utf8').match(/DESK = [^(]*\('([^']+)'\)/)?.[1]
  assert.ok(desk, 'không tìm thấy DESK trong lib.ts')
  const files = readdirSync(join(root, 'apps/client/src'), { recursive: true, encoding: 'utf8' }).filter(f =>
    /\.(svelte|css)$/.test(f),
  )
  const bad = files.flatMap(f =>
    [...readFileSync(join(root, 'apps/client/src', f), 'utf8').matchAll(/@media ([^{]*min-width: 1024px[^{]*)\{/g)]
      .map(m => m[1].trim())
      .filter(q => q !== desk)
      .map(q => `${f}: ${q}`),
  )
  assert.deepEqual(bad, [])
})
