// Dựng server: Fastify (HTTP API) + Socket.IO (thời gian thực) + world actor + PostgreSQL (Drizzle).
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import underPressure from '@fastify/under-pressure'
import Fastify from 'fastify'
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod'
import { protocolHash } from '@rok/protocol/hash'
import type { Config } from './config.ts'
import { createDb, migrate } from './db/index.ts'
import { prune } from './db/store.ts'
import { Host } from './game/host.ts'
import { adminRoutes } from './http/admin.ts'
import { accountRoutes } from './http/account.ts'
import { authRoutes } from './http/auth.ts'
import { makePusher, type Pusher } from './lib/push.ts'
import { devRoutes } from './http/dev.ts'
import { gameRoutes } from './http/game.ts'
import { healthRoutes } from './http/health.ts'
import { attachRealtime } from './realtime/gateway.ts'

// push: thay bộ gửi Web Push (test ghi lại thông báo thay vì gửi ra mạng)
export async function buildServer(c: Config, hooks: { push?: Pusher } = {}) {
  const dev = c.NODE_ENV === 'development'
  const app = Fastify({
    logger: {
      level: c.LOG_LEVEL,
      redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
      ...(dev && process.stdout.isTTY && { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } } }),
    },
    trustProxy: c.TRUST_PROXY,
    bodyLimit: 16_384,
    requestTimeout: 15_000,
  }).withTypeProvider<ZodTypeProvider>()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(cookie)
  await app.register(cors, { origin: c.ORIGINS.length ? c.ORIGINS : false, credentials: true })
  if (c.LIMITS) await app.register(rateLimit, { max: 60, timeWindow: '1 minute' }) // LIMITS=off (load test): không giới hạn gì
  await app.register(underPressure, { maxEventLoopDelay: 1_000, retryAfter: 10 }) // event loop nghẽn: trả 503 thay vì chết dần
  if (dev) {
    await app.register(swagger, { openapi: { info: { title: 'Sơn Hà Tiên Tông API', version: '1' } }, transform: jsonSchemaTransform })
    await app.register(swaggerUi, { routePrefix: '/docs' })
  }

  const d = createDb(c.DATABASE_URL)
  await migrate(d)
  const protocol = protocolHash()
  const push = hooks.push ?? makePusher(d.db, { pub: c.VAPID_PUBLIC_KEY, priv: c.VAPID_PRIVATE_KEY, subject: c.VAPID_SUBJECT }, app.log)
  const host = new Host({ db: d.db, node: c.NODE_PATH, commitMs: c.COMMIT_MS, sync: c.SYNC_COMMIT, warpAllowed: c.ALLOW_WARP, market: c.MARKET, log: app.log, push })

  await app.register(healthRoutes, { host })
  await app.register(
    async api => {
      // Chống CSRF: mọi POST phải mang header riêng — form hay ảnh từ trang khác không đặt được, fetch khác origin bị preflight
      api.addHook('onRequest', async (req, reply) => {
        if (req.method === 'POST' && req.headers['x-rok'] !== '1') return reply.code(403).send({ error: 'csrf' })
      })
      await api.register(authRoutes, { db: d.db, worldCap: c.WORLD_CAP, secure: c.NODE_ENV === 'production', path: c.NODE_PATH, pickWorld: c.ALLOW_WARP })
      await api.register(accountRoutes, { db: d.db, secure: c.NODE_ENV === 'production', path: c.NODE_PATH, limits: c.LIMITS, pushKey: push ? c.VAPID_PUBLIC_KEY! : null, localPush: c.NODE_ENV !== 'production' })
      await api.register(gameRoutes, { db: d.db })
      if (c.ALLOW_WARP) await api.register(devRoutes, { prefix: '/dev', db: d.db, host })
      if (c.ADMIN_TOKEN) await api.register(adminRoutes, { prefix: '/admin', db: d.db, token: c.ADMIN_TOKEN })
    },
    { prefix: '/api' },
  )

  const io = attachRealtime(app.server, { db: d.db, host, path: c.NODE_PATH, origins: c.ORIGINS, protocol, limits: c.LIMITS, log: app.log })
  host.start({ rebalance: c.REBALANCE })
  const nightly = setInterval(() => void prune(d.db).catch(err => app.log.warn({ err }, 'prune failed')), 24 * 3_600_000)
  nightly.unref()

  // Tắt / deploy: xả giới trước (commit lần cuối, nhả lease, báo client) khi socket còn mở, rồi mới đóng DB
  app.addHook('preClose', async () => {
    clearInterval(nightly)
    await host.drain()
    io.local.disconnectSockets(true)
  })
  app.addHook('onClose', async () => {
    await d.client.end({ timeout: 5 })
  })
  return { app, io, host, db: d, protocol }
}
