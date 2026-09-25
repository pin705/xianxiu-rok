// Mở nhanh (và hiện được màn mất mạng khi offline): lưu mọi file tĩnh đã tải về. Trang HTML lấy mạng trước (để nhận bản mới), mất mạng thì dùng bản đã lưu.
// File trong assets/ có hash trong tên nên lấy từ bộ nhớ trước là an toàn.
// Tên cache theo mã build (main.ts đăng ký sw.js?v=<mã>). Bản mới kích hoạt (chậm nhất ở lần mở kế tiếp) thì xoá cache
// bản cũ → bộ nhớ chỉ giữ tối đa 2 bản.
const CACHE = `rok-${new URL(location.href).searchParams.get('v') ?? '0'}`
// Tranh vẽ tay (art/…?v=<mã nội dung>, xem tools/art): kho riêng giữ qua mọi bản build — tải một lần, bản cập nhật chỉ tải
// lại tranh thật sự đổi (mã khác = URL khác). ponytail: không dọn bản tranh cũ; kho phình quá thì xoá mục không còn trong manifest.
const ART = 'rok-art'

self.addEventListener('install', e => e.waitUntil(self.skipWaiting())) // bản mới thay bản cũ ngay, không đợi đóng hết tab
self.addEventListener('activate', e =>
  e.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== ART).map(k => caches.delete(k))))
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

// ignoreVary: nhiều host gửi `Vary: Origin`; script module và font gửi kèm Origin còn bản đã cất thì không → khớp trượt, offline trắng màn
const hit = req => caches.match(req, { ignoreVary: true })

// Chỉ cất file tĩnh của game. API và Socket.IO (dữ liệu sống của server) luôn đi thẳng ra mạng, không bao giờ lấy bản cũ.
const STATIC = new Set(['script', 'style', 'font', 'image', 'manifest'])
self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  if (req.mode !== 'navigate' && !STATIC.has(req.destination)) return
  const url = new URL(req.url)
  if (url.pathname.includes('/art/') && url.searchParams.has('v'))
    return e.respondWith(
      caches.open(ART).then(c =>
        c.match(req).then(
          r =>
            r ||
            fetch(req).then(res => {
              if (res.ok) c.put(req, res.clone())
              return res
            }),
        ),
      ),
    )
  e.respondWith(
    req.mode === 'navigate'
      ? fetchAndKeep(req).catch(() => hit(req).then(r => r || hit('./')))
      : hit(req).then(r => r || fetchAndKeep(req)),
  )
})

// Thông báo đẩy (Web Push, server gửi khi người chơi không mở game): hiện thông báo; cùng tag thì thay cái cũ, không chồng
self.addEventListener('push', e => {
  let n = {}
  try {
    n = e.data?.json() ?? {}
  } catch {}
  e.waitUntil(
    self.registration.showNotification(n.title || 'Sơn Hà Tiên Tông', {
      body: n.body,
      tag: n.tag,
      icon: 'icons/icon-192.png',
      badge: 'favicon.png',
    }),
  )
})
// Chạm thông báo: đưa tab game đang mở lên trước, không có thì mở game
self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const tab = list.find(c => new URL(c.url).origin === location.origin)
      return tab ? tab.focus() : self.clients.openWindow('./')
    }),
  )
})
