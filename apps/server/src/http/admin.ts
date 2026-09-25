// Admin (chỉ khi đặt ADMIN_TOKEN; Caddy còn giới hạn /api/admin theo IP): số liệu D1/D7 và gửi thư có quà.
// Gửi thư đi qua inbox: chủ giới áp vào state bằng rules mail() đúng một lần, cùng commit với việc đánh dấu xong.
import { timingSafeEqual } from 'node:crypto'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ELDER_IDS, ITEM_IDS, RESOURCES, type ElderId, type ItemId, type Res } from '@rok/rules'
import type { Database } from '../db/index.ts'
import * as store from '../db/store.ts'
import { addGiftCode, cleanGiftCode } from '../db/codes.ts'
import { ErrorReply } from './session.ts'

const Gift = z.object({
  res: z.partialRecord(z.enum(RESOURCES as unknown as [Res, ...Res[]]), z.number().int().min(0).max(1e7)).optional(),
  items: z.partialRecord(z.enum(ITEM_IDS as [ItemId, ...ItemId[]]), z.number().int().min(0).max(100)).optional(),
  elder: z.enum(ELDER_IDS as [ElderId, ...ElderId[]]).optional(),
})
const Ok = z.object({ ok: z.boolean() })
const Mail = z.object({
  world: z.number().int().positive(),
  pid: z.number().int().positive().optional(), // không có: cả giới
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(1000),
  gift: Gift.optional(),
})

export const adminRoutes: FastifyPluginAsyncZod<{ db: Database; token: string }> = async (app, o) => {
  const want = Buffer.from(o.token)
  app.addHook('onRequest', async (req, reply) => {
    const got = Buffer.from(String(req.headers['x-admin-token'] ?? ''))
    if (got.length !== want.length || !timingSafeEqual(got, want)) return reply.code(401).send({ error: 'auth' })
  })
  app.get('/stats', async () => store.stats(o.db))
  // cấm chat: ghi DB (nguồn thật) + báo chủ giới qua inbox để có hiệu lực ngay
  app.post(
    '/mute',
    {
      schema: {
        body: z.object({
          world: z.number().int().positive(),
          pid: z.number().int().positive(),
          minutes: z.number().int().min(0).max(525_600),
        }),
        response: { 200: Ok, 401: ErrorReply, 404: ErrorReply },
      },
    },
    async (req, reply) => {
      if ((await store.findPlayer(o.db, req.body.pid))?.worldId !== req.body.world)
        return reply.code(404).send({ error: 'player' })
      const until = req.body.minutes ? Date.now() + req.body.minutes * 60_000 : 0
      await store.setMute(o.db, req.body.pid, until ? new Date(until) : null)
      await store.addInbox(o.db, req.body.world, 'mute', { pid: req.body.pid, until })
      return { ok: true }
    },
  )
  // mã quà tặng: người chơi nhập ở Cài đặt → Tài khoản, quà về qua thư (mỗi tài khoản một lần)
  app.post(
    '/codes',
    {
      schema: {
        body: z.object({
          code: z.string().min(4).max(32),
          gift: Gift,
          max: z.number().int().positive().optional(), // tổng lượt đổi (không có: không giới hạn)
          days: z.number().positive().max(3650).optional(), // hạn dùng (không có: không hết hạn)
        }),
        response: { 200: Ok, 401: ErrorReply, 409: ErrorReply },
      },
    },
    async (req, reply) => {
      const { code, gift, max, days } = req.body
      const until = days ? new Date(Date.now() + days * 86_400_000) : undefined
      if (!(await addGiftCode(o.db, { code: cleanGiftCode(code), gift, max, until })))
        return reply.code(409).send({ error: 'code' })
      return { ok: true }
    },
  )
  app.post(
    '/mail',
    { schema: { body: Mail, response: { 200: z.object({ id: z.number() }), 401: ErrorReply, 404: ErrorReply } } },
    async (req, reply) => {
      const { world, pid, title, body, gift } = req.body
      if (!(await store.worldExists(o.db, world))) return reply.code(404).send({ error: 'world' })
      if (pid && (await store.findPlayer(o.db, pid))?.worldId !== world)
        return reply.code(404).send({ error: 'player' })
      const [row] = await store.addInbox(o.db, world, 'mail', {
        pid,
        mail: { k: 'admin', a: [title, body], ...(gift && { gift }) },
      })
      return { id: row.id }
    },
  )
}
