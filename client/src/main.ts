import { mount } from 'svelte'
import App from './App.svelte'
import { L, LANG } from './lib'
import './app.css'

document.documentElement.lang = LANG
document.title = L.game

mount(App, { target: document.getElementById('app')! })

// PWA: chơi offline sau lần tải đầu. Bản dev không đăng ký để khỏi dính cache cũ.
// Mỗi bản build một tên cache (sw.js đọc từ ?v=), bản mới kích hoạt thì xoá cache của bản cũ.
// File tải trước khi service worker kịp chạy thì trang tự cất vào cache.
if (import.meta.env.PROD && 'serviceWorker' in navigator)
  navigator.serviceWorker
    .register(`./sw.js?v=${__BUILD__}`)
    .then(() => caches.open(`rok-${__BUILD__}`))
    .then(c => {
      const mine = performance.getEntriesByType('resource').map(e => e.name).filter(u => u.startsWith(location.origin))
      return c.addAll([location.href.split('#')[0], ...mine])
    })
    .catch(() => {})
