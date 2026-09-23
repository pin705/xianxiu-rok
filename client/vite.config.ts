import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  base: './', // chạy được cả ở gốc domain lẫn thư mục con (itch.io)
  plugins: [svelte()],
  server: { port: Number(process.env.PORT) || 5173 },
  // __BUILD__: mã riêng mỗi lần build — service worker đặt tên cache theo nó, bản mới dọn cache cũ
  define: { __VERSION__: JSON.stringify(pkg.version), __BUILD__: JSON.stringify(Date.now().toString(36)) },
})
