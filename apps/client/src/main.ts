import { mount } from 'svelte'
import App from './App.svelte'
import { LOCALE_IDS, loadText } from '@rok/i18n'
import { DIR, L, LANG, isMusicOn } from './lib'
import { startMusic } from './music'
import './fonts.css'
import './ui/theme.css'
import { applyTheme } from './ui/theme'

document.documentElement.lang = LANG
document.documentElement.dir = DIR
document.title = L.game
// Trình duyệt chỉ cho phát tiếng sau lần chạm đầu tiên
addEventListener('pointerdown', () => isMusicOn() && startMusic(), { once: true })

await applyTheme()
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
    // tải sẵn bộ chữ các ngôn ngữ khác (vài KB mỗi bộ) để service worker cất: offline vẫn đổi được ngôn ngữ
    .then(() => Promise.all(LOCALE_IDS.map(loadText)))
    .catch(() => {})
