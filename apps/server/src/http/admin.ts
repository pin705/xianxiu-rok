// Admin (chỉ khi đặt ADMIN_TOKEN; Caddy còn giới hạn /api/admin theo IP): số liệu D1/D7 và gửi thư có quà.
// Gửi thư đi qua inbox: chủ giới áp vào state bằng rules mail() đúng một lần, cùng commit với việc đánh dấu xong.
import { timingSafeEqual } from 'node:crypto'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ELDER_IDS, PILL_IDS, RESOURCES, type ElderId, type PillId, type Res } from '@rok/rules'
import type { Database } from '../db/index.ts'
import * as store from '../db/store.ts'

const Gift = z.object({
  res: z.partialRecord(z.enum(RESOURCES as unknown as [Res, ...Res[]]), z.number().int().min(0).max(1e7)).optional(),
  items: z.partialRecord(z.enum(PILL_IDS as [PillId, ...PillId[]]), z.number().int().min(0).max(100)).optional(),
  elder: z.enum(ELDER_IDS as [ElderId, ...ElderId[]]).optional(),
})
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
  app.post('/mail', { schema: { body: Mail } }, async req => {
    const { world, pid, title, body, gift } = req.body
    const [row] = await store.addInbox(o.db, world, 'mail', { pid, mail: { k: 'admin', a: [title, body], ...(gift && { gift }) } })
    return { id: row.id }
  })
}
