// Cổng thời gian thực (Socket.IO): bắt tay → phiên → giới ở node nào → giao sự kiện cho world actor.
// Socket.IO lo nhịp tim, nối lại, ack; nội dung thao tác do rules kiểm (parseAction trong apply).
import type { Server as HttpServer } from 'node:http'
import type { FastifyBaseLogger } from 'fastify'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { Server } from 'socket.io'
import { z } from 'zod'
import type { Action } from '@rok/rules'
import { GOODS, type Good } from '@rok/rules/world'
import type { Channel, ClientToServer, Query as Q, Refuse, ServerToClient } from '@rok/protocol'
import type { Database } from '../db/index.ts'
import { findSession } from '../db/accounts.ts'
import type { Host } from '../game/host.ts'
import { World, type Sock, type SocketData } from '../game/world.ts'
import { hashToken, tokenFromCookie } from '../lib/auth.ts'
import { refused, socketsOpen } from '../lib/metrics.ts'

const Handshake = z.object({
  token: z.string().max(128).optional(),
  protocol: z.string().max(64),
  build: z.string().max(64),
  lang: z.string().max(16),
})
// Khuôn Zod khớp kiểu của @rok/protocol (satisfies): giao kèo đổi mà quên sửa ở đây là lỗi biên dịch
const Chan = z.union([
  z.enum(['world', 'ally']),
  z.templateLiteral(['p', z.number().int().positive()]),
]) satisfies z.ZodType<Channel>
const Query = z.discriminatedUnion('k', [
  z.object({ k: z.literal('reports'), before: z.number().int().nonnegative().optional() }),
  z.object({ k: z.literal('rivals'), pid: z.number().int().positive().optional() }),
  z.object({ k: z.literal('map') }),
  z.object({ k: z.literal('allies') }),
  z.object({ k: z.literal('ally') }),
  z.object({ k: z.literal('chat'), ch: Chan }),
  z.object({ k: z.literal('season') }),
  z.object({ k: z.literal('market'), good: z.enum(GOODS as [Good, ...Good[]]).optional() }),
  z.object({ k: z.literal('profile'), pid: z.number().int().positive() }),
  z.object({ k: z.literal('dms') }),
  z.object({ k: z.literal('arena') }),
]) satisfies z.ZodType<Q>
const Say = z.object({ ch: Chan, text: z.string().max(400) }) // độ dài thật (200 ký tự) world.say kiểm sau khi chuẩn hoá
const Report = z.object({ id: z.number().int().positive() })
const ActionShape = z.object({ type: z.string().max(32) }).loose() // khung; từng trường do rules.parseAction kiểm

export type RealtimeOptions = {
  db: Database
  host: Host
  path: string
  origins: string[]
  protocol: string
  limits: boolean
  log: FastifyBaseLogger
}

export function attachRealtime(http: HttpServer, o: RealtimeOptions) {
  const io = new Server<ClientToServer, ServerToClient, Record<string, never>, SocketData>(http, {
    path: o.path,
    serveClient: false,
    transports: ['websocket', 'polling'], // polling: mạng chặn WebSocket (proxy công ty) vẫn chơi được
    maxHttpBufferSize: 4096, // thao tác lớn nhất (xuất quân đủ loại đệ tử) chưa tới 1 KB
    pingInterval: 25_000,
    pingTimeout: 20_000,
    perMessageDeflate: { threshold: 4096 }, // chỉ nén gói lớn (welcome, snapshot bản đồ)
    cors: o.origins.length ? { origin: o.origins, credentials: true } : undefined,
    // Trang của người khác không được mở socket bằng cookie của người chơi: chỉ cùng origin hoặc origin trong danh sách
    allowRequest: (req, cb) => {
      const origin = req.headers.origin
      cb(null, !origin || o.origins.includes(origin) || sameHost(origin, req.headers.host))
    },
  })

  io.use(handshake(o))
  // 40 khung, nạp 10/giây mỗi kết nối; bị chặn liên tục là đang spam → cắt
  const limiter = new RateLimiterMemory({ points: 40, duration: 4 })
  io.on('connection', socket => serve(socket, o, limiter))
  return io
}

// Bắt tay: đúng mã giao thức, phiên còn hiệu lực, giới đang ở node này (không thì chỉ đường sang node giữ giới)
function handshake(o: RealtimeOptions) {
  return async (socket: Sock, next: (err?: Error) => void) => {
    const refuse = (reason: Refuse['reason'], path?: string) => {
      refused.inc({ reason })
      next(Object.assign(new Error(reason), { data: { reason, path } satisfies Refuse }))
    }
    try {
      const h = Handshake.safeParse(socket.handshake.auth)
      if (!h.success) return refuse('auth')
      if (h.data.protocol !== o.protocol) return refuse('protocol') // luật đổi: client phải tải bản mới
      const token = h.data.token ?? tokenFromCookie(socket.handshake.headers.cookie)
      const s = token ? await findSession(o.db, hashToken(token)) : null
      if (!s || s.deleted) return refuse(s?.deleted ? 'deleted' : 'auth')
      if (s.banned) return refuse('banned')
      if (!s.pid || !s.world) return refuse('auth')
      const w = await o.host.ensure(s.world)
      if (!(w instanceof World)) return refuse(w.owner ? 'moved' : 'unavailable', w.owner ?? undefined)
      if (w.quarantined(s.pid)) return refuse('unavailable')
      socket.data = { pid: s.pid, world: s.world }
      next()
    } catch (err) {
      o.log.error({ err }, 'handshake failed')
      refuse('unavailable')
    }
  }
}

// Một kết nối: giới hạn tần suất, kiểm khuôn gói tin, giao cho world actor đang giữ giới
function serve(socket: Sock, o: RealtimeOptions, limiter: RateLimiterMemory) {
  socketsOpen.inc()
  const world = () => o.host.worlds.get(socket.data.world)
  let strikes = 0
  const allowed = async () => {
    if (!o.limits) return true
    try {
      await limiter.consume(socket.id)
      strikes = 0
      return true
    } catch {
      if (++strikes > 100) {
        socket.emit('bye', { reason: 'rate' })
        socket.disconnect(true)
      }
      return false
    }
  }
  void world()?.attach(socket)

  socket.on('act', async (a, ack) => {
    if (typeof ack !== 'function') return
    if (!(await allowed())) return ack({ ok: false, err: 'rate' })
    if (!ActionShape.safeParse(a).success) return ack({ ok: false, err: 'bad' })
    const w = world()
    if (!w) return ack({ ok: false, err: 'moving' })
    w.intent(socket, a as Action, ack)
  })
  socket.on('get', async (q, ack) => {
    if (typeof ack !== 'function') return
    if (!(await allowed())) return ack(null)
    const parsed = Query.safeParse(q)
    if (!parsed.success) return ack(null)
    await world()
      ?.query(socket, parsed.data, ack)
      .catch(err => {
        o.log.warn({ err }, 'query failed')
        ack(null)
      })
  })
  socket.on('say', async (m, ack) => {
    if (typeof ack !== 'function') return
    if (!(await allowed())) return ack({ ok: false, err: 'rate' })
    const p = Say.safeParse(m)
    if (!p.success) return ack({ ok: false, err: 'bad' })
    const w = world()
    if (!w) return ack({ ok: false, err: 'unavailable' })
    w.say(socket, p.data, ack)
  })
  socket.on('report', async (m, ack) => {
    if (typeof ack !== 'function') return
    const p = Report.safeParse(m)
    if (!(await allowed()) || !p.success) return ack(false)
    const done = await world()
      ?.report(socket, p.data.id)
      .catch(err => {
        o.log.warn({ err }, 'chat report failed')
        return false
      })
    ack(done ?? false)
  })
  socket.on('sync', async ack => {
    if (typeof ack === 'function' && (await allowed())) world()?.sync(socket, ack)
  })
  socket.on('time', ack => {
    if (typeof ack === 'function') ack(world()?.now() ?? Date.now())
  })
  socket.on('disconnect', () => {
    socketsOpen.dec()
    world()?.detach(socket)
  })
}

const sameHost = (origin: string, host: string | undefined) => {
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}
