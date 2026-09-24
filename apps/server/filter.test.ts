import test from 'node:test'
import assert from 'node:assert/strict'
import { hasBad, mask } from './src/lib/filter.ts'

test('lọc chat: chặn đúng từ tục (kể cả teencode, hoa thường), không chặn chữ thường giống mặt chữ khi bỏ dấu', () => {
  for (const bad of ['đm mày', 'ĐỊT', 'con đĩ kia', 'vcl thật', 'Fuck you', 'nói lồn gì']) assert.ok(hasBad(bad), bad)
  for (const ok of [
    'các đạo hữu',
    'lớn mạnh',
    'cách này',
    'đi đâu',
    'dịch chuyển',
    'đêm nay',
    'vì sao',
    'Địa Tạng',
    'dmx',
    'shitake?',
  ])
    assert.ok(!hasBad(ok), ok)
  assert.equal(mask('đm  các   bạn'), '** các bạn')
})
