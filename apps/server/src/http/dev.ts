// Công cụ dev/e2e — chỉ đăng ký khi ALLOW_WARP (config cấm ở production): tua giờ giới, đọc/đặt state của chính mình.
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { migrate } from '@rok/rules'
import type { Database } from '../db/index.ts'
import * as store from '../db/store.ts'
import type { Host } from '../game/host.ts'
import { ErrorReply, requireSession } from './auth.ts'

export const devRoutes: FastifyPluginAsyncZod<{ db: Database; host: Host }> = async (app, { db, host }) => {
  const worldOf = async (world: number | null) => {
    if (!world) return null
    const w = await host.ensure(world)
    return 'id' in w ? w : null
  }

  app.post(
    '/warp',
    { schema: { body: z.object({ min: z.number().min(0).max(60 * 24 * 60) }), response: { 200: z.object({ now: z.number() }), 401: ErrorReply, 403: ErrorReply, 409: ErrorReply } } },
    async (req, reply) => {
      const s = await requireSession(db, req, reply)
      if (!s) return reply
      const w = await worldOf(s.world)
      if (!w) return reply.code(409).send({ error: 'moved' })
      await store.addWarp(db, w.id, req.body.min * 60_000)
      w.setWarp(req.body.min * 60_000)
      return { now: w.now() }
    },
  )

  app.get('/state', async (req, reply) => {
    const s = await requireSession(db, req, reply)
    if (!s) return reply
    const w = await worldOf(s.world)
    if (!w || !s.pid) return reply.code(409).send({ error: 'moved' })
    return { now: w.now(), state: w.state(s.pid) }
  })

  app.post('/state', { schema: { body: z.object({ state: z.unknown() }) } }, async (req, reply) => {
    const s = await requireSession(db, req, reply)
    if (!s) return reply
    const w = await worldOf(s.world)
    const state = migrate(req.body.state)
    if (!w || !s.pid) return reply.code(409).send({ error: 'moved' })
    if (!state) return reply.code(400).send({ error: 'state' })
    return reply.code(w.setState(s.pid, state) ? 200 : 404).send({ ok: true })
  })
}
