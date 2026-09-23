// Ranh giới monorepo: mỗi package chỉ được import những package @rok/* ghi dưới đây, không import tương đối ra ngoài thư mục mình.
// apps/* dùng packages/*, không bao giờ ngược lại. rules là lõi thuần: không phụ thuộc gì — server P2 chạy lại đúng luật này.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const ALLOWED: Record<string, string[]> = {
  'packages/rules': [],
  'packages/art': [],
  'packages/i18n': ['rules'],
  'apps/client': ['rules', 'art', 'i18n'],
  'apps/server': ['rules'],
}
const root = import.meta.dirname

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
      for (const [, spec] of readFileSync(join(root, dir, f), 'utf8').matchAll(/(?:from|import)\s*\(?\s*'([^']+)'/g)) {
        const pkg = spec.match(/^@rok\/([\w-]+)/)?.[1]
        if (pkg && !allowed.includes(pkg)) bad.push(`${dir}/${f}: không được import @rok/${pkg}`)
        if (spec.startsWith('.') && relative(join(root, dir), resolve(dirname(join(root, dir, f)), spec)).startsWith('..'))
          bad.push(`${dir}/${f}: import '${spec}' ra ngoài package — dùng @rok/*`)
      }
    }
  }
  assert.deepEqual(bad, [])
})
