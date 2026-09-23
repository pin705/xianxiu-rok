// Chơi offline: lưu mọi file tĩnh đã tải về. Trang HTML lấy mạng trước (để nhận bản mới), mất mạng thì dùng bản đã lưu.
// File trong assets/ có hash trong tên nên lấy từ bộ nhớ trước là an toàn.
// Tên cache theo mã build (main.ts đăng ký sw.js?v=<mã>). Bản mới kích hoạt (chậm nhất ở lần mở kế tiếp) thì xoá cache
// bản cũ → bộ nhớ chỉ giữ tối đa 2 bản.
const CACHE = `rok-${new URL(location.href).searchParams.get('v') ?? '0'}`

self.addEventListener('install', e => e.waitUntil(self.skipWaiting())) // bản mới thay bản cũ ngay, không đợi đóng hết tab
self.addEventListener('activate', e =>
  e.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  ),
)

const fetchAndKeep = req =>
  fetch(req).then(res => {
    if (res.ok) {
      const copy = res.clone()
      caches.open(CACHE).then(c => c.put(req, copy))
    }
    return res
  })

self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  e.respondWith(
    req.mode === 'navigate'
      ? fetchAndKeep(req).catch(() => caches.match(req).then(hit => hit || caches.match('./')))
      : caches.match(req).then(hit => hit || fetchAndKeep(req)),
  )
})
