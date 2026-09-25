import { mount } from 'svelte'
import App from './App.svelte'
import { artAll, artPack, setArt, type ArtManifest } from '@rok/art'
import { LOCALE_IDS, loadText } from '@rok/i18n'
import { DIR, L, LANG, isMusicOn } from './lib'
import { startMusic } from './music'
import './fonts.css'
import './ui/theme.css'
import { applyTheme } from './ui/theme'
import { DPR, cssPerDU } from './world/stage'

document.documentElement.lang = LANG
document.documentElement.dir = DIR
document.title = L.game
// Trình duyệt chỉ cho phát tiếng sau lần chạm đầu tiên
addEventListener('pointerdown', () => isMusicOn() && startMusic(), { once: true })

// Tranh vẽ tay (public/art/manifest.json, xem @rok/art art.ts), nạp theo gói như engine: đợi gói 'boot' (da giao diện, hình
// chạm huy hiệu) là hiện màn tiêu đề; màn tiêu đề là màn tải — tải hết các gói rồi mới vào game, vào rồi không phải đợi nữa.
// ?art=0 tắt tranh để chụp so sánh trước/sau.
async function loadArt() {
  if (new URLSearchParams(location.search).get('art') === '0') return
  const base = new URL('./art/', location.href)
  const m: ArtManifest = await fetch(new URL('manifest.json', base))
    .then(r => (r.ok ? r.json() : {}))
    .catch(() => ({}))
  // bản HD khi màn cần hơn 3,4 px ảnh mỗi DU (desktop Retina: cảnh ~2,85 px CSS/DU × 2) — điện thoại vẫn tải bản thường
  const hd = cssPerDU() * DPR > 3.4
  for (const e of Object.values(m)) {
    if (hd && e.hd) Object.assign(e, e.hd.src ? { src: e.hd.src, page: undefined, frame: undefined } : e.hd)
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
void artAll(FIRST) // tải hết các gói còn lại, lần lượt — màn tiêu đề đợi xong mới vào game (Title.svelte)

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
        .filter(u => u.startsWith(location.origin))
      // tranh (có ?v=) vào kho riêng giữ qua các bản build — cùng kho service worker dùng (sw.js ART)
      const art = mine.filter(u => /\/art\/.+[?&]v=/.test(u))
      void caches
        .open('rok-art')
        .then(a => a.addAll([...new Set(art)])) // một ảnh tải hai lần (gói cảnh + skin): trùng thì addAll hỏng cả lô
        .catch(() => {})
      return c.addAll([
        location.href.split('#')[0],
        ...mine.filter(u => /\/(assets|fonts|icons)\/|manifest|favicon/.test(u)),
      ])
    })
    // tải sẵn bộ chữ các ngôn ngữ khác (vài KB mỗi bộ) để service worker cất: offline vẫn đổi được ngôn ngữ
    .then(() => Promise.all(LOCALE_IDS.map(loadText)))
    .catch(() => {})
