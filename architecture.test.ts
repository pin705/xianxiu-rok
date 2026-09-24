// Ranh giới monorepo: mỗi package chỉ được import những package @rok/* ghi dưới đây, không import tương đối ra ngoài thư mục mình.
// apps/* dùng packages/*, không bao giờ ngược lại. rules là lõi thuần: không phụ thuộc gì — server chạy lại đúng luật này.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const ALLOWED: Record<string, string[]> = {
  'packages/rules': [],
  'packages/art': [],
  'packages/i18n': ['rules'],
  'packages/protocol': ['rules'],
  'apps/client': ['rules', 'art', 'i18n', 'protocol'],
  'apps/server': ['rules', 'protocol', 'i18n'], // i18n: chữ của Web Push (app đang đóng, client không dựng được)
}
const root = import.meta.dirname
const importsOf = (file: string) =>
  [...readFileSync(file, 'utf8').matchAll(/(?:from|import)\s*\(?\s*'([^']+)'/g)].map(m => m[1])

test('mỗi package chỉ import đúng các package được phép, không với ra ngoài thư mục mình', () => {
  const bad: string[] = []
  const dirs = ['packages', 'apps'].flatMap(g => readdirSync(join(root, g)).map(d => `${g}/${d}`))
  for (const dir of dirs) {
    const allowed = ALLOWED[dir]
    if (!allowed) {
      bad.push(`${dir}: package mới — thêm vào ALLOWED trong architecture.test.ts`)
      continue
    }
    const files = readdirSync(join(root, dir), { recursive: true, encoding: 'utf8' }).filter(
      f => /\.(ts|svelte|mjs)$/.test(f) && !/(^|\/)(node_modules|dist)\//.test(f),
    )
    for (const f of files) {
      for (const spec of importsOf(join(root, dir, f))) {
        const pkg = spec.match(/^@rok\/([\w-]+)/)?.[1]
        if (pkg && !allowed.includes(pkg)) bad.push(`${dir}/${f}: không được import @rok/${pkg}`)
        if (
          spec.startsWith('.') &&
          relative(join(root, dir), resolve(dirname(join(root, dir, f)), spec)).startsWith('..')
        )
          bad.push(`${dir}/${f}: import '${spec}' ra ngoài package — dùng @rok/*`)
      }
    }
  }
  assert.deepEqual(bad, [])
})

// Bên trong rules chỉ import xuống: core ← sect ← world. Mỗi file sect/ là một tính năng độc lập (chỉ dùng core/, data, combat);
// chỉ sect/apply.ts gộp chúng — thêm tính năng không phải sửa tính năng khác.
test('rules: core không import sect/world, tính năng trong sect/ không import lẫn nhau hay world', () => {
  const rules = join(root, 'packages/rules')
  const bad: string[] = []
  for (const layer of ['core', 'sect'])
    for (const f of readdirSync(join(rules, layer)).filter(f => f.endsWith('.ts'))) {
      for (const spec of importsOf(join(rules, layer, f)).filter(s => s.startsWith('.'))) {
        const to = relative(rules, resolve(rules, layer, spec))
        const ok =
          to.startsWith('core/') ||
          to === 'data.ts' ||
          to === 'combat.ts' ||
          (layer === 'sect' && f === 'apply.ts' && to.startsWith('sect/'))
        if (!ok) bad.push(`rules/${layer}/${f}: không được import ${to}`)
      }
    }
  assert.deepEqual(bad, [])
})
