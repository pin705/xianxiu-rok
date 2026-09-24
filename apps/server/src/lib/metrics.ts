// Prometheus (prom-client): số đo mặc định của process (CPU, RAM, GC, event loop lag) + số đo của game. Xem ở /metrics.
import client from 'prom-client'

export const registry = new client.Registry()
client.collectDefaultMetrics({ register: registry, prefix: 'rok_' })

const registers = [registry]
export const intents = new client.Counter({
  name: 'rok_intents_total',
  help: 'Thao tác đã xử lý, theo kết quả',
  labelNames: ['result'],
  registers,
})
export const commitSeconds = new client.Histogram({
  name: 'rok_commit_seconds',
  help: 'Thời gian một commit gộp của giới',
  buckets: [0.002, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers,
})
export const commitErrors = new client.Counter({
  name: 'rok_commit_errors_total',
  help: 'Commit lỗi (sẽ thử lại)',
  registers,
})
export const fenced = new client.Counter({
  name: 'rok_worlds_fenced_total',
  help: 'Giới bị rào: node khác đã nhận',
  registers,
})
export const socketsOpen = new client.Gauge({
  name: 'rok_socket_connections',
  help: 'Kết nối Socket.IO đang mở',
  registers,
})
export const refused = new client.Counter({
  name: 'rok_socket_refused_total',
  help: 'Bắt tay bị từ chối, theo lý do',
  labelNames: ['reason'],
  registers,
})
// Gauge đọc lúc Prometheus hỏi, cộng qua các Host trong process (test chạy nhiều node trong một process)
export const hosts = new Set<{ worldCount(): number; online(): number }>()
new client.Gauge({
  name: 'rok_worlds',
  help: 'Số giới node này đang giữ',
  registers,
  collect() {
    this.set([...hosts].reduce((n, h) => n + h.worldCount(), 0))
  },
})
new client.Gauge({
  name: 'rok_players_online',
  help: 'Người chơi đang kết nối',
  registers,
  collect() {
    this.set([...hosts].reduce((n, h) => n + h.online(), 0))
  },
})
