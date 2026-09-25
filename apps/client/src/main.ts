import { mount } from 'svelte'
import App from './App.svelte'
import { setArt, type ArtManifest } from '@rok/art'
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

// Tranh vẽ tay thay hình vẽ bằng code: public/art/manifest.json (key → ảnh, xem @rok/art art.ts); thiếu file thì vẽ code như cũ.
// ?art=0 tắt để chụp so sánh trước/sau. Chỉ giải mã sẵn texture cảnh (tex) — Pixi cần ảnh có ngay; ảnh HTML/CSS trình duyệt tự tải.
// ponytail: mọi texture nạp một lượt lúc mở game — nhiều cảnh nặng thì chuyển sang nạp theo cảnh.
async function loadArt() {
  if (new URLSearchParams(location.search).get('art') === '0') return
  const base = new URL('./art/', location.href)
  const m: ArtManifest = await fetch(new URL('manifest.json', base))
    .then(r => (r.ok ? r.json() : {}))
    .catch(() => ({}))
  await Promise.all(
    Object.entries(m).map(([k, e]) => {
      e.src = new URL(e.src, base).href
      if (!e.tex) return
      // chờ load chứ không chờ decode(): trang đang ở tab nền thì Chrome hoãn decode — game không bao giờ mount (trang trắng)
      const img = new Image()
      const ready = new Promise<void>(ok => {
        img.onload = () => ok(void (e.img = img))
        img.onerror = () => {
          console.warn('art: không mở được', e.src)
          delete m[k]
          ok()
        }
      })
      img.src = e.src
      return ready
    }),
  )
  setArt(m)
}

await loadArt()
await applyTheme()
mount(App, { target: document.getElementById('app')! })

// PWA: mở nhanh từ bộ nhớ sau lần tải đầu (chơi thì cần mạng: server là trọng tài). Bản dev không đăng ký để khỏi dính cache cũ.
// Mỗi bản build một tên cache (sw.js đọc từ ?v=), bản mới kích hoạt thì xoá cache của bản cũ.
// File tải trước khi service worker kịp chạy thì trang tự cất vào cache.
if (import.meta.env.PROD && 'serviceWorker' in navigator)
  navigator.serviceWorker
    .register(`./sw.js?v=${__BUILD__}`)
    .then(() => caches.open(`rok-${__BUILD__}`))
    .then(c => {
      // chỉ file tĩnh: các lần gọi API (fetch cũng nằm trong danh sách này) mà lọt vào thì addAll hỏng cả lô
      const mine = performance
        .getEntriesByType('resource')
        .map(e => e.name)
        .filter(u => u.startsWith(location.origin) && /\/(assets|fonts|icons|art)\/|manifest|favicon/.test(u))
      return c.addAll([location.href.split('#')[0], ...mine])
    })
    // tải sẵn bộ chữ các ngôn ngữ khác (vài KB mỗi bộ) để service worker cất: offline vẫn đổi được ngôn ngữ
    .then(() => Promise.all(LOCALE_IDS.map(loadText)))
    .catch(() => {})
