// Phiên của một request HTTP: token (header Authorization khác origin, cookie HttpOnly cùng origin), hook bắt phiên,
// khuôn lỗi chung của API.
import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import type { Database } from '../db/index.ts'
import * as accounts from '../db/accounts.ts'
import * as store from '../db/store.ts'
import { COOKIE, hashToken } from '../lib/auth.ts'

export const ErrorReply = z.object({ error: z.string() })

export type Authed = accounts.Session & { token: string }
declare module 'fastify' {
  interface FastifyRequest {
    session: Authed // chỉ có ở route dùng preHandler authed()
  }
}

export const tokenOf = (req: FastifyRequest) => {
  const h = req.headers.authorization
  return h?.startsWith('Bearer ') ? h.slice(7) : req.cookies[COOKIE]
}

// Phiên hiện tại; null: chưa có phiên hoặc phiên không còn
export async function sessionOf(db: Database, req: FastifyRequest): Promise<Authed | null> {
  const token = tokenOf(req)
  const s = token ? await accounts.findSession(db, hashToken(token)) : null
  return s && token ? { ...s, token } : null
}

// preHandler: phiên hợp lệ thì gắn req.session, không thì trả 401 / 403 và route không chạy
export const authed = (db: Database) => async (req: FastifyRequest, reply: FastifyReply) => {
  const s = await sessionOf(db, req)
  if (!s || s.deleted) return reply.code(401).send({ error: 'auth' })
  if (s.banned) return reply.code(403).send({ error: 'banned' })
  req.session = s
}

export const clearSession = (reply: FastifyReply) => reply.clearCookie(COOKIE, { path: '/' })

// Đường Socket.IO của node đang giữ giới; chưa ai giữ thì node này (sẽ nhận giới lúc bắt tay)
export const socketPath = async (db: Database, world: number | null, here: string) =>
  (world && (await store.worldPath(db, world))) || here
