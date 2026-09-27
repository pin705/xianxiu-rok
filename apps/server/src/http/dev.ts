// Công cụ dev/e2e — chỉ đăng ký khi ALLOW_WARP (config cấm ở production): tua giờ giới, đọc/đặt state của chính mình.
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { RULES, migrate } from '@rok/rules'
import { allyOf, put } from '@rok/rules/world'
import type { Database } from '../db/index.ts'
import * as store from '../db/store.ts'
import type { Host } from '../game/host.ts'
import { ErrorReply, authed } from './session.ts'

export const devRoutes: FastifyPluginAsyncZod<{ db: Database; host: Host }> = async (app, { db, host }) => {
  const auth = authed(db)
  const worldOf = async (world: number | null) => {
    if (!world) return null
    const w = await host.ensure(world)
    return 'id' in w ? w : null
  }

  app.post(
    '/warp',
    {
      preHandler: auth,
      schema: {
        body: z.object({
          min: z
            .number()
            .min(0)
            .max(60 * 24 * 60),
        }),
        response: { 200: z.object({ now: z.number() }), 401: ErrorReply, 403: ErrorReply, 409: ErrorReply },
      },
    },
    async (req, reply) => {
      const s = req.session
      const w = await worldOf(s.world)
      if (!w) return reply.code(409).send({ error: 'moved' })
      await store.addWarp(db, w.id, req.body.min * 60_000)
      w.setWarp(req.body.min * 60_000)
      return { now: w.now() }
    },
  )

  app.get('/state', { preHandler: auth }, async (req, reply) => {
    const s = req.session
    const w = await worldOf(s.world)
    if (!w || !s.pid) return reply.code(409).send({ error: 'moved' })
    return { now: w.now(), state: w.state(s.pid) }
  })

  app.post('/state', { preHandler: auth, schema: { body: z.object({ state: z.unknown() }) } }, async (req, reply) => {
    const s = req.session
    const w = await worldOf(s.world)
    const state = migrate(req.body.state)
    if (!w || !s.pid) return reply.code(409).send({ error: 'moved' })
    if (!state) return reply.code(400).send({ error: 'state' })
    return w.setState(s.pid, state) ? { ok: true } : reply.code(404).send({ error: 'gone' })
  })

  // Luật mùa của giới (thử các luật Thiên Mệnh Chọn Luật mà không phải chờ hết mùa); k = -1: bỏ luật
  app.post(
    '/rule',
    {
      preHandler: auth,
      schema: {
        body: z.object({
          k: z
            .number()
            .int()
            .min(-1)
            .max(RULES.length - 1),
        }),
      },
    },
    async (req, reply) => {
      const w = await worldOf(req.session.world)
      if (!w) return reply.code(409).send({ error: 'moved' })
      const { rule: _, ...rest } = w.shared
      w.share(req.body.k < 0 ? rest : { ...w.shared, rule: req.body.k })
      return { ok: true }
    },
  )

  // Minh khố của tiên minh mình (thử Cống Hiến Các, trận kỳ mà không phải cung phụng hàng trăm lượt)
  app.post(
    '/fund',
    { preHandler: auth, schema: { body: z.object({ n: z.number().int().min(0) }) } },
    async (req, reply) => {
      const s = req.session
      const w = await worldOf(s.world)
      const al = w && s.pid ? allyOf(w.shared, s.pid) : undefined
      if (!w || !al) return reply.code(409).send({ error: 'no ally' })
      w.share(put(w.shared, { ...al, fund: req.body.n }))
      return { ok: true }
    },
  )
}
