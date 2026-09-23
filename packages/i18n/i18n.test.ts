import test from 'node:test'
import assert from 'node:assert/strict'
import { FALLBACK, LOCALE_IDS, LOCALES, loadText, pick } from './index.ts'

test('chọn ngôn ngữ: đã chọn > trình duyệt (khớp mã chính) > tiếng Anh', () => {
  assert.equal(pick('en', ['vi-VN']), 'en')
  assert.equal(pick(null, ['vi-VN', 'en']), 'vi')
  assert.equal(pick(null, ['fr-FR', 'en-GB']), 'en')
  assert.equal(pick('xx', ['de']), FALLBACK)
  assert.equal(pick('constructor', []), FALLBACK, 'khoá của Object không phải ngôn ngữ')
})

// Mọi ngôn ngữ cùng khuôn với bản gốc: cùng khoá, cùng loại, mảng cùng độ dài, không chuỗi rỗng.
// TypeScript đã bắt thiếu khoá; test này bắt thêm thứ kiểu không thấy (chuỗi rỗng, mảng hụt, dịch nhầm hàm thành chuỗi).
function same(a: unknown, b: unknown, path: string): string[] {
  if (typeof a !== typeof b) return [`${path}: ${typeof a} ≠ ${typeof b}`]
  if (typeof b === 'string') return b.trim() || !(a as string).trim() ? [] : [`${path}: bản gốc có chữ mà bản này rỗng`]
  if (typeof b === 'function') return (a as Function).length === b.length ? [] : [`${path}: số tham số khác`]
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return [`${path}: mảng dài ${a.length} ≠ ${(b as unknown[]).length}`]
    return a.flatMap((x, i) => same(x, b[i], `${path}[${i}]`))
  }
  if (a && typeof a === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b as object)])
    return [...keys].flatMap(k => same((a as any)[k], (b as any)[k], `${path}.${k}`))
  }
  return []
}

test('mọi ngôn ngữ đủ khuôn bản gốc tiếng Việt', async () => {
  const base = await loadText('vi')
  for (const id of LOCALE_IDS) {
    assert.deepEqual(same(base, await loadText(id), id), [], `${id} lệch khuôn`)
    assert.ok(LOCALES[id].name.trim(), `${id} thiếu tên hiển thị`)
  }
})
