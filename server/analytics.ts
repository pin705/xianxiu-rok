// Nhận analytics ẩn danh từ client (client/src/lib.ts → track → sendBeacon) và tính retention cho cổng P1 (D1/D7).
// Mầm của server P2: Node thuần, SQLite có sẵn trong Node 24, không thêm thư viện.
//
//   STATS_TOKEN=bí-mật node server/analytics.ts        → nghe cổng 8787, ghi analytics.db
//   client: VITE_ANALYTICS_URL=https://<máy chủ>/e npm run build
//   xem số: https://<máy chủ>/stats?token=bí-mật
//
// Biến môi trường: PORT (8787) · DB (analytics.db) · STATS_TOKEN (bắt buộc để xem /stats) · ORIGIN (CORS, mặc định *)
// · TZ_HOURS (7 — ngày tính theo giờ VN) · TRUST_PROXY=1 khi đứng sau Caddy/nginx (lấy IP từ X-Forwarded-For).
import { timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import { DatabaseSync } from 'node:sqlite'

const NAMES = new Set(['open', 'found', 'hall', 'trib', 'rebirth'])
const DAY = 86_400_000
const TZ = Number(process.env.TZ_HOURS ?? 7) * 3_600_000
const dayOf = (ts: number) => Math.floor((ts + TZ) / DAY)

export type Event = { id: string; name: string; props: string; v: string }

export function openDb(file = ':memory:') {
  const db = new DatabaseSync(file)
  db.exec(`CREATE TABLE IF NOT EXISTS events (ts INTEGER NOT NULL, day INTEGER NOT NULL, id TEXT NOT NULL, name TEXT NOT NULL, props TEXT NOT NULL, v TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS events_id_day ON events(id, day);`)
  return db
}

// Biên tin cậy: ai cũng gửi được, nên chỉ nhận đúng khuôn client gửi, và nhỏ.
export function parse(body: string): Event | null {
  if (body.length > 2048) return null
  try {
    const e = JSON.parse(body)
    if (typeof e?.id !== 'string' || !/^[\w-]{8,64}$/.test(e.id) || !NAMES.has(e.name)) return null
    const props = e.props && typeof e.props === 'object' && !Array.isArray(e.props) ? JSON.stringify(e.props) : '{}'
    if (props.length > 512) return null
    return { id: e.id, name: e.name, props, v: String(e.v ?? '').slice(0, 16) }
  } catch {
    return null
  }
}

// Giờ của máy chủ, không tin giờ client gửi lên
export const record = (db: DatabaseSync, e: Event, ts: number) =>
  db.prepare('INSERT INTO events VALUES (?, ?, ?, ?, ?, ?)').run(ts, dayOf(ts), e.id, e.name, e.props, e.v)

type Cohort = { day: number; players: number; d1: number; d7: number }
export function stats(db: DatabaseSync, now: number) {
  const today = dayOf(now)
  // Cohort = ngày một máy gửi sự kiện đầu tiên. Dk = tỉ lệ máy của cohort còn mở game đúng ngày thứ k.
  const cohorts = db
    .prepare(
      `WITH first AS (SELECT id, MIN(day) AS d0 FROM events GROUP BY id)
       SELECT f.d0 AS day, COUNT(DISTINCT f.id) AS players,
         COUNT(DISTINCT CASE WHEN e.day = f.d0 + 1 THEN e.id END) AS d1,
         COUNT(DISTINCT CASE WHEN e.day = f.d0 + 7 THEN e.id END) AS d7
       FROM first f JOIN events e ON e.id = f.id GROUP BY f.d0 ORDER BY f.d0`,
    )
    .all() as Cohort[]
  // Chỉ tính cohort đã qua trọn ngày thứ k, không thì số bị kéo thấp
  const rate = (k: 1 | 7) => {
    const done = cohorts.filter(c => c.day + k < today)
    const n = done.reduce((s, c) => s + c.players, 0)
    return n ? Math.round((1000 * done.reduce((s, c) => s + c[`d${k}`], 0)) / n) / 1000 : null
  }
  const halls = db
    .prepare(
      `SELECT hall, COUNT(*) AS players FROM
         (SELECT id, MAX(CAST(json_extract(props, '$.n') AS INTEGER)) AS hall FROM events WHERE name = 'hall' GROUP BY id)
       GROUP BY hall ORDER BY hall`,
    )
    .all() as { hall: number; players: number }[]
  const trib = db.prepare(`SELECT COUNT(*) AS tries, COALESCE(SUM(json_extract(props, '$.win')), 0) AS wins FROM events WHERE name = 'trib'`).get()
  const iso = (d: number) => new Date(d * DAY).toISOString().slice(0, 10)
  return {
    players: cohorts.reduce((s, c) => s + c.players, 0),
    d1: rate(1),
    d7: rate(7),
    cohorts: cohorts.map(c => ({ ...c, day: iso(c.day) })),
    halls: Object.fromEntries(halls.map(h => [h.hall, h.players])),
    trib,
    rebirths: (db.prepare(`SELECT COUNT(*) AS n FROM events WHERE name = 'rebirth'`).get() as { n: number }).n,
  }
}

if (import.meta.main) {
  const db = openDb(process.env.DB ?? 'analytics.db')
  const token = Buffer.from(process.env.STATS_TOKEN ?? '')
  const cors = { 'Access-Control-Allow-Origin': process.env.ORIGIN ?? '*' }
  // ponytail: giới hạn tần suất trong bộ nhớ, 1 process; nhiều process thì chuyển sang Redis hoặc bảng SQL
  const hits = new Map<string, { n: number; t: number }>()
  setInterval(() => hits.forEach((h, ip) => Date.now() - h.t > 60_000 && hits.delete(ip)), 600_000).unref()

  createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (req.method === 'POST' && url.pathname === '/e') {
      const ip = (process.env.TRUST_PROXY ? String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() : '') || req.socket.remoteAddress || ''
      const h = hits.get(ip)
      if (!h || Date.now() - h.t > 60_000) hits.set(ip, { n: 1, t: Date.now() })
      else if (++h.n > 120) return void res.writeHead(429, cors).end()
      let body = ''
      req.setEncoding('utf8')
      req.on('data', chunk => {
        body += chunk
        if (body.length > 4096) req.destroy()
      })
      req.on('end', () => {
        const e = parse(body)
        if (e) record(db, e, Date.now())
        res.writeHead(e ? 204 : 400, cors).end()
      })
      return
    }
    if (req.method === 'GET' && url.pathname === '/stats') {
      const given = Buffer.from(url.searchParams.get('token') ?? '')
      if (!token.length || given.length !== token.length || !timingSafeEqual(given, token)) return void res.writeHead(401).end()
      return void res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify(stats(db, Date.now()), null, 2))
    }
    res.writeHead(404, cors).end()
  }).listen(Number(process.env.PORT ?? 8787), () => console.log(`analytics: cổng ${process.env.PORT ?? 8787}`))
}
