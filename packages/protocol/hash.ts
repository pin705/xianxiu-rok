// Mã giao thức = hash mã nguồn luật + gói tin (chỉ chạy ở Node: server lúc khởi động, vite.config lúc build).
// Client đoán trước bằng đúng bộ luật của server: đổi một dòng luật là client cũ phải tải lại, dự đoán không lệch âm thầm.
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const SKIP = /\.test\.ts$|(^|\/)(simulate|simpvp|bot|hash)\.ts$|(^|\/)node_modules\// // công cụ chạy riêng, client không dùng
export function protocolHash(root = join(import.meta.dirname, '..')) {
  const h = createHash('sha256')
  for (const dir of ['rules', 'protocol'])
    for (const f of readdirSync(join(root, dir), { recursive: true, encoding: 'utf8' })
      .filter(f => f.endsWith('.ts') && !SKIP.test(f))
      .sort())
      h.update(`${dir}/${f}\n`).update(readFileSync(join(root, dir, f)))
  return h.digest('hex').slice(0, 12)
}
