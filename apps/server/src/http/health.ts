// Sức khoẻ cho Caddy / orchestrator + số đo cho Prometheus
import type { FastifyPluginAsync } from 'fastify'
import type { Host } from '../game/host.ts'
import { registry } from '../lib/metrics.ts'

export const healthRoutes: FastifyPluginAsync<{ host: Host }> = async (app, { host }) => {
  app.get('/healthz', { logLevel: 'silent', config: { rateLimit: false } }, async () => ({ ok: true }))
  // đang xả (deploy): 503 để Caddy ngừng gửi kết nối mới tới node này
  app.get('/readyz', { logLevel: 'silent', config: { rateLimit: false } }, async (_, reply) => reply.code(host.draining ? 503 : 200).send({ ok: !host.draining }))
  // không mở ra ngoài: Caddy chặn /metrics
  app.get('/metrics', { logLevel: 'silent', config: { rateLimit: false } }, async (_, reply) => reply.type(registry.contentType).send(await registry.metrics()))
}
