import { mount } from 'svelte'
import App from './App.svelte'
import { artPack, artPacks, setArt, type ArtManifest } from '@rok/art'
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

// Tranh vẽ tay (public/art/manifest.json, xem @rok/art art.ts), nạp theo gói như bundle của engine: chỉ đợi gói 'boot'
// (da giao diện, hình chạm huy hiệu) rồi hiện game; cảnh nào đợi gói của cảnh đó (mountScene), gói còn lại tải nền sau.
// ?art=0 tắt tranh để chụp so sánh trước/sau.
async function loadArt() {
  if (new URLSearchParams(location.search).get('art') === '0') return
  const base = new URL('./art/', location.href)
  const m: ArtManifest = await fetch(new URL('manifest.json', base))
    .then(r => (r.ok ? r.json() : {}))
    .catch(() => ({}))
  for (const e of Object.values(m)) {
    e.src = new URL(e.src, base).href
    if (e.page) e.page = new URL(e.page, base).href
  }
  setArt(m)
  await artPack('boot')
}
// thứ tự tải nền: cảnh núi (vào game là thấy) trước, trận sau cùng
const FIRST = ['home', 'bld1', 'bld2', 'bld3', 'map', 'bld4', 'bld5', 'world', 'battle']

await loadArt()
await applyTheme()
mount(App, { target: document.getElementById('app')! })
void (async () => {
  for (const p of new Set([...FIRST, ...artPacks()])) await artPack(p) // lần lượt: không tranh băng thông với gói cảnh đang đợi
})()

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
