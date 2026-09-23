import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  base: './', // chạy được cả ở gốc domain lẫn thư mục con (itch.io)
  plugins: [svelte()],
  define: { __VERSION__: JSON.stringify(pkg.version) },
})
