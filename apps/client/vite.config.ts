import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { protocolHash } from '@rok/protocol/hash'
import pkg from './package.json' with { type: 'json' }

// Dev và e2e: API + Socket.IO đi qua proxy tới server game (cùng origin như production sau Caddy)
const server = process.env.ROK_SERVER ?? 'http://127.0.0.1:8787'
const proxy = { '/api': server, '/socket.io': { target: server, ws: true } }

export default defineConfig({
  base: './', // chạy được cả ở gốc domain lẫn thư mục con (itch.io)
  plugins: [svelte()],
  server: { port: Number(process.env.PORT) || 5173, proxy },
  preview: { proxy },
  // Ngân sách gói chính: ~510 kB (gzip ~170 kB) lúc có đủ tầng 1–25 + PvP; vượt 600 kB thì tách màn ít dùng ra import động
  build: { chunkSizeWarningLimit: 600 },
  // __BUILD__: mã riêng mỗi lần build — service worker đặt tên cache theo nó, bản mới dọn cache cũ
  // __PROTOCOL__: hash luật + gói tin — server so lúc bắt tay, lệch là client phải tải bản mới
  define: { __VERSION__: JSON.stringify(pkg.version), __BUILD__: JSON.stringify(Date.now().toString(36)), __PROTOCOL__: JSON.stringify(protocolHash()) },
})
