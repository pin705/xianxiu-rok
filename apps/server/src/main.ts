// Server game. Dev: npm run db && npm run server. Cấu hình: src/config.ts (biến môi trường, kiểm bằng Zod).
import { buildServer } from './app.ts'
import { loadConfig } from './config.ts'

const config = loadConfig()
const { app } = await buildServer(config)
await app.listen({ port: config.PORT, host: config.HOST })

let closing = false
async function shutdown(signal: string) {
  if (closing) return
  closing = true
  app.log.info({ signal }, 'shutting down')
  const hard = setTimeout(() => process.exit(1), 25_000) // Docker gửi SIGKILL sau 30 giây
  try {
    await app.close()
  } finally {
    clearTimeout(hard)
    process.exit(0)
  }
}
process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('uncaughtException', err => {
  app.log.fatal({ err }, 'uncaught exception')
  void shutdown('uncaughtException')
})
