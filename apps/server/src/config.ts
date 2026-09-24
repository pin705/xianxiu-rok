// Cấu hình từ biến môi trường, kiểm bằng Zod: sai hay thiếu là dừng ngay lúc khởi động, không chạy nửa vời.
import { z } from 'zod'

const bool = (def: boolean) =>
  z
    .enum(['1', '0', 'true', 'false', 'on', 'off'])
    .optional()
    .transform(v => (v === undefined ? def : v === '1' || v === 'true' || v === 'on'))
const list = z
  .string()
  .optional()
  .transform(v => (v ?? '').split(',').map(s => s.trim()).filter(Boolean))

const Env = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().min(0).max(65535).default(8787),
    HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z.string().default('postgres://rok:rok@127.0.0.1:5439/rok'), // npm run db
    // Định danh công khai của node: đường Socket.IO mà Caddy trỏ thẳng về node này (/n1/socket.io). Hai node không được trùng.
    NODE_PATH: z.string().regex(/^\/[\w/-]*socket\.io$/).default('/socket.io'),
    ORIGINS: list, // origin khác được gọi API/socket (itch.io…)
    TRUST_PROXY: bool(false),
    ALLOW_WARP: bool(false), // công cụ dev/e2e: tua giờ, đặt state
    LIMITS: bool(true), // tắt giới hạn tần suất khi load test
    COMMIT_MS: z.coerce.number().int().min(0).max(1000).default(30), // cửa sổ commit gộp
    SYNC_COMMIT: bool(true), // off: bớt fsync, đổi lấy rủi ro mất ~200 ms thao tác nếu Postgres sập
    WORLD_CAP: z.coerce.number().int().min(1).default(300),
    REBALANCE: bool(true),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  })
  .refine(e => !(e.NODE_ENV === 'production' && e.ALLOW_WARP), 'ALLOW_WARP bị cấm ở production')

export type Config = z.infer<typeof Env>
export const loadConfig = (env: Record<string, string | undefined> = process.env): Config => Env.parse(env)
