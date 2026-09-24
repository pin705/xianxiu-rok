// API đọc của game (ngoài Socket.IO): bảng xếp hạng của giới mình.
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { weekOf } from '@rok/rules'
import type { Database } from '../db/index.ts'
import * as store from '../db/store.ts'
import { requireSession } from './auth.ts'

// ponytail: cache top trong RAM mỗi node (30 giây, theo giới + bảng) — N node thì N lần truy vấn; bảng tính sẵn khi giới lớn
const TTL = 30_000
type Top = Awaited<ReturnType<typeof store.topOf>>

export const gameRoutes: FastifyPluginAsyncZod<{ db: Database }> = async (app, o) => {
  const cache = new Map<string, { at: number; rows: Top }>()
  app.get('/ranks/:board', { schema: { params: z.object({ board: z.enum(store.BOARDS) }) } }, async (req, reply) => {
    const s = await requireSession(o.db, req, reply)
    if (!s) return
    if (!s.pid || !s.world) return reply.code(404).send({ error: 'nosect' })
    const { board } = req.params
    const week = weekOf(Date.now())
    const key = `${s.world}:${board}:${week}`
    let hit = cache.get(key)
    if (!hit || Date.now() - hit.at > TTL)
      cache.set(key, (hit = { at: Date.now(), rows: await store.topOf(o.db, s.world, board, week) }))
    return { rows: hit.rows, me: await store.rankOf(o.db, s.world, board, s.pid, week) }
  })
}
