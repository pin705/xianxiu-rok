// Tài khoản & phiên: khách (tạo tông môn luôn), xem phiên, đăng xuất. Liên kết email ở M9.
import { randomInt } from 'node:crypto'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { newGame, type State } from '@rok/rules'
import type { Database } from '../db/index.ts'
import * as accounts from '../db/accounts.ts'
import { COOKIE, cleanName, cookieOptions, hashToken, newToken } from '../lib/auth.ts'
import { ErrorReply, authed, clearSession, sessionOf, socketPath } from './session.ts'

// path: đường Socket.IO của node này — trả cho client khi giới chưa ai giữ (node này sẽ nhận giới lúc bắt tay)
// pickWorld: cho khách tự chọn giới (chỉ test/dev: bỏ qua giới hạn người mỗi giới và hạn vào giới)
export type AuthOptions = { db: Database; worldCap: number; secure: boolean; path: string; pickWorld: boolean }

export const authRoutes: FastifyPluginAsyncZod<AuthOptions> = async (app, o) => {
  const auth = authed(o.db)
  app.post(
    '/guest',
    {
      config: { rateLimit: { max: 20, timeWindow: '1 hour' } },
      schema: {
        body: z.object({
          name: z.string().max(64),
          lang: z
            .string()
            .regex(/^[a-z]{2}(-[A-Za-z]{2})?$/)
            .catch('en'),
          world: z.number().int().positive().optional(),
        }),
        response: {
          200: z.object({ token: z.string(), pid: z.number(), world: z.number(), path: z.string() }),
          400: ErrorReply,
          409: ErrorReply,
        },
      },
    },
    async (req, reply) => {
      const n = cleanName(req.body.name)
      if (!n) return reply.code(400).send({ error: 'name' })
      const token = newToken()
      const state: State = { ...newGame(Date.now(), n.name), seed: randomInt(1, 2 ** 32 - 1) }
      try {
        const g = await accounts.createGuest(o.db, {
          hash: hashToken(token),
          locale: req.body.lang,
          name: n.name,
          nameKey: n.key,
          crest: randomInt(0, 2 ** 31 - 1),
          state,
          cap: o.worldCap,
          world: o.pickWorld ? req.body.world : undefined,
          ip: req.ip,
          ua: req.headers['user-agent'],
          seed: randomInt(1, 2 ** 31 - 1),
        })
        req.log.info({ pid: g.pid, world: g.world }, 'guest created')
        reply.setCookie(COOKIE, token, cookieOptions(o.secure))
        return { token, pid: g.pid, world: g.world, path: await socketPath(o.db, g.world, o.path) }
      } catch (e) {
        if (e instanceof accounts.NameTaken) return reply.code(409).send({ error: 'name_taken' })
        throw e
      }
    },
  )

  app.get(
    '/me',
    {
      schema: {
        response: {
          200: z.object({
            account: z.number().nullable(),
            pid: z.number().nullable(),
            world: z.number().nullable(),
            path: z.string(),
          }),
          403: ErrorReply,
        },
      },
    },
    // Chưa có phiên là chuyện bình thường (lần đầu mở game): trả 200 với account null thay vì 401 (trình duyệt coi 401 là lỗi đỏ)
    async (req, reply) => {
      const s = await sessionOf(o.db, req)
      if (s?.banned) return reply.code(403).send({ error: 'banned' })
      if (!s || s.deleted) return { account: null, pid: null, world: null, path: o.path }
      return { account: s.account, pid: s.pid, world: s.world, path: await socketPath(o.db, s.world, o.path) }
    },
  )

  app.post(
    '/logout',
    {
      preHandler: auth,
      schema: { response: { 200: z.object({ ok: z.boolean() }), 401: ErrorReply, 403: ErrorReply } },
    },
    async (req, reply) => {
      const s = req.session
      await accounts.deleteSession(o.db, hashToken(s.token))
      clearSession(reply)
      return { ok: true }
    },
  )
}
