// Lớp mạng: nơi DUY NHẤT client nói chuyện với server (chỉ App.svelte import; không có tác dụng phụ lúc import → test SSR an toàn).
// Server là trọng tài. Client giữ `confirmed` (state server đã xác nhận ở version v) và đoán trước các thao tác tất định:
//   hiển thị = gập các thao tác đang chờ lên confirmed, rồi advance tới giờ server hiện tại.
// Mầm trận luôn là 0 ở client (rules: mầm 0 = ẩn) nên advance ở đây không bao giờ tự bịa kết quả trận — server đẩy xuống.
import { io, type Socket } from 'socket.io-client'
import { advance, apply, type Action, type Report, type State } from '@rok/rules'
import type { WorldAction } from '@rok/rules/world'
import type {
  Ack,
  Answer,
  Channel,
  ChatMsg,
  ClientToServer,
  MapSnap,
  Push,
  Query,
  QueryOf,
  Refuse,
  SayErr,
  ServerToClient,
  Welcome,
} from '@rok/protocol'
import { fold, offsetOf, withReports, type Pending } from './sync'

export type Ranks = {
  rows: { pid: number; name: string; v: number; hall: number; rank: number }[]
  me: { rank: number; v: number } | null
}
export type Status =
  'boot' | 'nosect' | 'connecting' | 'online' | 'reconnecting' | 'offline' | 'update' | 'lost' | 'banned' | 'deleted'
export type Why = 'first' | 'tick' | 'mine' | 'push' | 'resync'
// ---------- Kết nối ----------

const SERVER = (import.meta.env.VITE_SERVER_URL as string | undefined) ?? '' // rỗng: cùng origin (dev proxy, Caddy)
const CROSS = !!SERVER && SERVER !== globalThis.location?.origin // khác origin (itch.io): không có cookie, giữ token
const AUTH = 'rok.auth'

export type Handlers = {
  state(prev: State | null, next: State, why: Why): void
  status(s: Status): void
  error(code: string): void
  welcome(w: Welcome): void
  reports(fresh: Report[]): void
}

export function createNet(h: Handlers, lang: string) {
  let socket: Socket<ServerToClient, ClientToServer> | null = null
  let path = '/socket.io'
  let status: Status = 'boot'
  let confirmed: State | null = null
  let v = 0
  let pending: Pending[] = []
  let folded: State | null = null
  let display: State | null = null
  let reports: Report[] = []
  let offset = 0
  let samples: { rtt: number; off: number }[] = []
  let offlineTimer: ReturnType<typeof setTimeout> | undefined
  let pingTimer: ReturnType<typeof setInterval> | undefined
  const mapWatch = new Set<(m: MapSnap) => void>() // đang mở bản đồ giới
  const chatWatch = new Set<(ch: Channel, ms: ChatMsg[]) => void>()
  const allyWatch = new Set<() => void>()
  const listen = <T>(set: Set<T>, f: T) => (set.add(f), () => void set.delete(f))

  const now = () => Date.now() + offset
  const set = (s: Status) => {
    if (s === status) return
    status = s
    h.status(s)
  }
  const token = () => (CROSS ? (read(AUTH) ?? undefined) : undefined)

  // Tính lại hiển thị: gập (khi confirmed/pending đổi) rồi advance tới giờ hiện tại
  function show(why: Why, refold = true) {
    if (!confirmed) return
    if (refold || !folded) folded = fold(confirmed, pending)
    const prev = display
    const t = now()
    const next = withReports(advance(folded, Math.max(folded.time, t)), reports)
    if (why === 'tick' && prev && next.time === prev.time) return
    display = next
    h.state(prev, next, why)
  }
  const merge = (rep?: Report[]) => {
    if (!rep?.length) return
    const byId = new Map(reports.map(r => [r.id, r]))
    for (const r of rep) byId.set(r.id, r)
    reports = [...byId.values()].sort((a, b) => a.id - b.id).slice(-50)
    h.reports(rep)
  }

  async function api<T>(
    route: string,
    body?: object,
  ): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
    try {
      const t = token()
      const r = await fetch(`${SERVER}/api${route}`, {
        method: body ? 'POST' : 'GET',
        credentials: CROSS ? 'omit' : 'include',
        headers: { 'content-type': 'application/json', 'x-rok': '1', ...(t && { authorization: `Bearer ${t}` }) },
        body: body && JSON.stringify(body),
      })
      const data = await r.json().catch(() => ({}))
      return r.ok
        ? { ok: true, data: data as T }
        : { ok: false, status: r.status, error: (data as { error?: string }).error ?? 'server' }
    } catch {
      return { ok: false, status: 0, error: 'offline' }
    }
  }

  function connect() {
    socket?.removeAllListeners()
    socket?.disconnect()
    set(display ? 'reconnecting' : 'connecting')
    const s: Socket<ServerToClient, ClientToServer> = io(SERVER || undefined, {
      path,
      auth: cb => cb({ token: token(), protocol: __PROTOCOL__, build: __BUILD__, lang }),
      withCredentials: !CROSS,
      transports: ['websocket', 'polling'],
      reconnectionDelay: 500,
      reconnectionDelayMax: 15_000,
      randomizationFactor: 0.5,
    })
    socket = s
    s.on('welcome', w => {
      clearTimeout(offlineTimer)
      samples = []
      offset = w.now - Date.now()
      confirmed = withReports(w.state, [])
      v = w.v
      pending = []
      const first = !display
      set('online')
      h.welcome(w)
      show(first ? 'first' : 'resync')
      ping()
      clearInterval(pingTimer)
      pingTimer = setInterval(ping, 25_000)
      void ask({ k: 'reports' }).then(list => list && merge(list))
      if (mapWatch.size) void askMap() // nối lại: theo dõi lại bản đồ
    })
    s.on('w', m => mapWatch.forEach(f => f(m)))
    s.on('chat', m => chatWatch.forEach(f => f(m.ch, m.ms)))
    s.on('ally', () => allyWatch.forEach(f => f()))
    s.on('s', (m: Push) => {
      if (!confirmed) return
      if (m.v !== v + 1) return resync()
      confirmed = { ...confirmed, ...m.p }
      v = m.v
      merge(m.rep)
      show('push')
    })
    s.on('clock', ({ now: t }) => {
      samples = []
      offset = t - Date.now()
      show('tick')
    })
    s.on('status', ({ ro }) => ro && h.error('unavailable'))
    s.on('bye', ({ reason }) => {
      if (reason === 'banned' || reason === 'deleted') set(reason)
    })
    s.on('connect_error', e => {
      const d = (e as Error & { data?: Refuse }).data
      if (!d) return offline()
      if (d.reason === 'protocol') return update()
      if (d.reason === 'moved' && d.path) {
        path = d.path // giới đang ở node khác: nối thẳng tới đó
        return connect()
      }
      if (d.reason === 'auth') return set('lost')
      if (d.reason === 'banned' || d.reason === 'deleted') return set(d.reason)
      offline()
    })
    s.on('disconnect', reason => {
      clearInterval(pingTimer)
      drop()
      if (status === 'banned' || status === 'deleted') return
      set('reconnecting')
      // server chủ động ngắt (deploy, giới chuyển node): socket.io không tự nối lại — nối lại sau một nhịp ngẫu nhiên
      if (reason === 'io server disconnect') setTimeout(() => s.connect(), 300 + Math.random() * 1200)
      offline()
    })
  }

  // Quá 15 giây chưa nối lại được: báo mất mạng (vẫn tự thử tiếp)
  function offline() {
    if (status === 'online' || offlineTimer) return
    offlineTimer = setTimeout(() => {
      offlineTimer = undefined
      if (status !== 'online') set('offline')
    }, 15_000)
  }

  // Luật trên server đã đổi: tải bản mới một lần; vẫn lệch (server chưa lên bản mới) thì chờ và thử lại
  function update() {
    const key = 'rok.reload'
    if (read(key) !== __PROTOCOL__) {
      write(key, __PROTOCOL__)
      return location.reload()
    }
    set('update')
    setTimeout(() => socket?.connect(), 30_000)
  }

  // Mất kết nối: không gửi lại (tránh áp hai lần) — welcome lần sau cho biết sự thật
  function drop() {
    const lost = pending.filter(p => p.predicted).length
    for (const p of pending) p.done?.({ ok: false, err: 'unavailable' })
    pending = []
    if (lost) h.error('unsaved')
    if (confirmed) show('resync')
  }

  // Lệch version (hiếm): nối lại để nhận state đầy đủ
  function resync() {
    socket?.disconnect()
    socket?.connect()
  }

  function ping() {
    const t0 = Date.now()
    socket?.timeout(10_000).emit('time', (err, t) => {
      if (err) return
      const t1 = Date.now()
      samples = [...samples.slice(-4), { rtt: t1 - t0, off: t + (t1 - t0) / 2 - t1 }]
      offset = offsetOf(samples)
    })
  }

  function send(a: Action | WorldAction, predicted: boolean): Promise<Ack> {
    return new Promise(done => {
      const p: Pending = { a, at: now(), predicted, done }
      pending.push(p)
      socket!.timeout(20_000).emit('act', a, (err, r) => {
        if (!pending.includes(p)) return // đã bỏ khi mất kết nối
        pending = pending.filter(x => x !== p)
        if (err) {
          done({ ok: false, err: 'unavailable' })
          return resync()
        }
        if (r.ok && r.v !== undefined) {
          if (r.v !== v + 1) {
            done(r)
            return resync()
          }
          confirmed = { ...confirmed!, ...r.p }
          v = r.v
        }
        if (r.ok) merge(r.rep)
        else if (predicted) h.error(r.err)
        show('mine')
        done(r)
      })
      if (predicted) show('mine')
    })
  }

  function forget<T extends { ok: boolean }>(r: T) {
    if (!r.ok) return r
    try {
      localStorage.removeItem(AUTH)
    } catch {}
    socket?.removeAllListeners()
    socket?.disconnect()
    socket = null
    return r
  }

  // Bật thông báo đẩy (gọi từ thao tác của người chơi — trình duyệt chỉ hỏi quyền lúc đó): đăng ký với dịch vụ push của trình
  // duyệt bằng khoá VAPID của server, rồi gửi đăng ký cho server. Chưa có service worker (bản dev) thì không hỗ trợ.
  async function enablePush(key: string): Promise<'on' | 'denied' | 'unsupported' | 'error'> {
    const reg =
      'PushManager' in globalThis && 'Notification' in globalThis
        ? await navigator.serviceWorker?.getRegistration()
        : undefined
    if (!reg) return 'unsupported'
    if ((await Notification.requestPermission()) !== 'granted') return 'denied'
    try {
      const key8 = Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key8 }))
      const j = sub.toJSON()
      return (await api('/push/sub', { endpoint: j.endpoint, keys: j.keys })).ok ? 'on' : 'error'
    } catch {
      return 'error'
    }
  }

  // Truy vấn: trả lời đúng kiểu theo khoá (Answer[k]); mất kết nối / quá 10 giây / server không trả lời được → null
  const ask = <K extends Query['k']>(q: QueryOf<K>) =>
    new Promise<Answer[K] | null>(ok =>
      socket?.connected
        ? socket.timeout(10_000).emit('get', q, (err, d) => ok(err ? null : (d as Answer[K] | null)))
        : ok(null),
    )
  const askMap = () => ask({ k: 'map' }).then(m => m && mapWatch.forEach(f => f(m)))

  return {
    now,
    get status() {
      return status
    },
    // Khởi động: có phiên (cookie hoặc token) thì nối; chưa có tông môn thì chờ màn đặt tên
    async start() {
      const me = await api<{ pid: number | null; path: string }>('/me')
      if (!me.ok) return set(me.status === 403 ? 'banned' : 'offline')
      if (!me.data.pid) return set('nosect')
      path = me.data.path
      connect()
    },
    // Lập tông môn (tài khoản khách + tông môn + phiên), rồi nối
    async found(name: string): Promise<string | null> {
      const r = await api<{ token: string; path: string }>('/guest', { name, lang })
      if (!r.ok) return r.error
      if (CROSS) write(AUTH, r.data.token)
      path = r.data.path
      connect()
      return null
    },
    // Vào tông môn đã có từ máy khác: email + mật khẩu, hoặc mã chuyển máy (dùng một lần), rồi nối như người cũ
    async login(how: { email: string; pass: string } | { code: string }): Promise<string | null> {
      const r = await api<{ token: string; path: string }>('code' in how ? '/login/code' : '/login', how)
      if (!r.ok) return r.error
      if (CROSS) write(AUTH, r.data.token)
      path = r.data.path
      connect()
      return null
    },
    // Tài khoản: gắn email, đổi mật khẩu, mã chuyển máy, đăng xuất (mọi nơi), xoá. Đăng xuất / xoá xong: quên phiên, ngắt nối
    // (App tải lại trang về màn mở đầu)
    account: {
      info: () => api<{ email: string | null; push: string | null }>('/account'),
      link: (email: string, pass: string) => api<{ ok: boolean }>('/account/link', { email, pass }),
      password: (old: string, pass: string) => api<{ ok: boolean }>('/account/password', { old, pass }),
      code: () => api<{ code: string; until: number }>('/account/code', {}),
      logout: (all: boolean) => api<{ ok: boolean }>(all ? '/account/logout-all' : '/logout', {}).then(forget),
      remove: (pass?: string) => api<{ ok: boolean }>('/account/delete', { pass }).then(forget),
      push: (key: string) => enablePush(key),
    },
    tick() {
      show('tick', false)
    },
    // Thao tác tất định: đoán trước ngay (trả state mới đồng bộ như bản offline), server xác nhận sau
    act(a: Action): State | null {
      if (status !== 'online' || !display) {
        h.error('offline')
        return null
      }
      const r = apply(display, a, now())
      if (!r.ok) {
        h.error(r.error)
        return null
      }
      void send(a, true)
      return display
    },
    // Thao tác có trận (bí cảnh, tháp, độ kiếp) hoặc không đảo lại được (luân hồi): chờ server
    async send(a: Action | WorldAction): Promise<Ack> {
      if (status !== 'online') {
        h.error('offline')
        return { ok: false, err: 'unavailable' }
      }
      const r = await send(a, false)
      if (!r.ok) h.error(r.err)
      return r
    },
    ask,
    // Bản đồ giới: ảnh chụp ngay, rồi mỗi lần đổi (server đẩy `w`); hỏi lại mỗi 50 giây để gia hạn theo dõi. Trả hàm huỷ.
    watchMap(on: (m: MapSnap) => void) {
      mapWatch.add(on)
      void askMap()
      const renew = setInterval(askMap, 50_000)
      return () => {
        clearInterval(renew)
        mapWatch.delete(on)
      }
    },
    // Chat: gửi (server lọc chữ, giới hạn tần suất), báo cáo; nghe tin mới / tiên minh đổi. listen trả hàm huỷ.
    say: (ch: Channel, text: string) =>
      new Promise<{ ok: true } | { ok: false; err: SayErr }>(ok =>
        socket?.connected
          ? socket
              .timeout(10_000)
              .emit('say', { ch, text }, (err, r) => ok(err ? { ok: false, err: 'unavailable' } : r))
          : ok({ ok: false, err: 'unavailable' }),
      ),
    report: (id: number) =>
      new Promise<boolean>(ok =>
        socket?.connected ? socket.timeout(10_000).emit('report', { id }, (err, r) => ok(!err && r)) : ok(false),
      ),
    onChat: (f: (ch: Channel, ms: ChatMsg[]) => void) => listen(chatWatch, f),
    onAlly: (f: () => void) => listen(allyWatch, f),
    // Bảng xếp hạng của giới mình (HTTP, server cache 30 giây)
    ranks: (board: string) => api<Ranks>(`/ranks/${board}`),
    // Công cụ dev (server bật ALLOW_WARP): tua giờ giới, đặt state
    dev: (route: 'warp' | 'state', body: object) => api(`/dev/${route}`, body),
    retry() {
      if (socket) socket.connect()
      else void this.start()
    },
    close() {
      clearInterval(pingTimer)
      clearTimeout(offlineTimer)
      socket?.removeAllListeners()
      socket?.disconnect()
      socket = null
    },
  }
}
export type Net = ReturnType<typeof createNet>

function read(k: string) {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
function write(k: string, v: string) {
  try {
    localStorage.setItem(k, v)
  } catch {}
}
