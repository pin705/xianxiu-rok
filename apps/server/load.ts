// Load test: N client socket.io thật (chia cho nhiều process), mỗi client là một bot chơi bằng chính bộ luật (@rok/rules):
// tạo khách → bắt tay → cứ 5–20 giây một thao tác hợp lệ (nhận thưởng, xây, tuyển, nghiên cứu…) → đo thời gian ack.
//   npm run load -- --url http://127.0.0.1:8787 --clients 2000 --procs 4 --ramp 60 --duration 300
// Server cần LIMITS=off (giới hạn tạo khách theo IP chặn load test). In p50/p95/p99 mỗi 5 giây; lỗi > 0,1 % hoặc p99 quá ngưỡng thì exit 1.
import { fork } from 'node:child_process'
import { parseArgs } from 'node:util'
import { io, type Socket } from 'socket.io-client'
import { IDS, TECH_IDS, UNITS, apply, type Action, type State } from '@rok/rules'
import type { Ack, ClientToServer, Push, ServerToClient, Welcome } from '@rok/protocol'
import { protocolHash } from '@rok/protocol/hash'

const { values: o } = parseArgs({
  options: {
    url: { type: 'string', default: 'http://127.0.0.1:8787' },
    clients: { type: 'string', default: '200' },
    procs: { type: 'string', default: '2' },
    ramp: { type: 'string', default: '20' }, // giây để nối đủ số client
    duration: { type: 'string', default: '60' }, // giây giữ tải sau khi nối đủ
    think: { type: 'string', default: '5-20' }, // giây nghỉ giữa hai thao tác của một bot
    p99: { type: 'string', default: '100' }, // ms, ngưỡng đạt
    child: { type: 'boolean', default: false },
  },
})
const N = Number(o.clients),
  P = Math.max(1, Number(o.procs)),
  RAMP = Number(o.ramp) * 1000,
  DURATION = Number(o.duration) * 1000
const [T1, T2] = o.think!.split('-').map(x => Number(x) * 1000)
type Stat = { rtt: number[]; acks: number; nacks: number; errors: number; connected: number; failed: number }

if (!o.child) {
  // ---------- Điều phối: chia client cho các process con, gom số đo ----------
  const totals: Stat = { rtt: [], acks: 0, nacks: 0, errors: 0, connected: 0, failed: 0 }
  const live = new Map<number, number>()
  const t0 = Date.now()
  const kids = Array.from({ length: P }, (_, i) => {
    const n = Math.floor(N / P) + (i < N % P ? 1 : 0)
    const k = fork(import.meta.filename, [...process.argv.slice(2), '--child', '--clients', String(n)], {
      stdio: 'inherit',
    })
    k.on('message', (m: Stat & { i?: number }) => {
      totals.rtt.push(...m.rtt)
      totals.acks += m.acks
      totals.nacks += m.nacks
      totals.errors += m.errors
      totals.failed += m.failed
      live.set(i, m.connected)
    })
    return k
  })
  const pct = (a: number[], p: number) => (a.length ? a[Math.min(a.length - 1, Math.floor((a.length * p) / 100))] : 0)
  let window: number[] = []
  const report = setInterval(() => {
    const w = totals.rtt.splice(0)
    window = w.sort((a, b) => a - b)
    const conn = [...live.values()].reduce((a, b) => a + b, 0)
    console.log(
      `t=${Math.round((Date.now() - t0) / 1000)}s kết nối ${conn}/${N} · ack ${(w.length / 5).toFixed(0)}/s · p50 ${pct(window, 50)} p95 ${pct(window, 95)} p99 ${pct(window, 99)} ms · lỗi ${totals.errors} · từ chối ${totals.nacks} · nối hỏng ${totals.failed}`,
    )
    all.push(...w)
  }, 5000)
  const all: number[] = []
  await new Promise(r => setTimeout(r, RAMP + DURATION + 2000))
  clearInterval(report)
  for (const k of kids) k.kill()
  all.sort((a, b) => a - b)
  const sent = totals.acks + totals.errors
  const errRate = sent ? totals.errors / sent : 1
  const p99 = pct(all, 99)
  console.log(
    `\nKẾT QUẢ: ${all.length} thao tác · p50 ${pct(all, 50)} ms · p95 ${pct(all, 95)} ms · p99 ${p99} ms · lỗi ${(errRate * 100).toFixed(2)} % · nối hỏng ${totals.failed}`,
  )
  if (p99 > Number(o.p99) || errRate > 0.001 || totals.failed > N * 0.001) {
    console.error(`KHÔNG ĐẠT (ngưỡng p99 ${o.p99} ms, lỗi 0,1 %)`)
    process.exit(1)
  }
  process.exit(0)
}

// ---------- Process con: các bot ----------
const protocol = protocolHash()
const stat: Stat = { rtt: [], acks: 0, nacks: 0, errors: 0, connected: 0, failed: 0 }
setInterval(() => {
  process.send!({ ...stat })
  stat.rtt = []
  stat.acks = stat.nacks = stat.errors = stat.failed = 0
}, 1000)

// Chọn một thao tác hợp lệ theo luật (thử trên bản sao cục bộ trước khi gửi)
function choose(s: State, now: number): Action | null {
  const ok = (a: Action) => apply(s, a, now).ok
  const tries: Action[] = [
    { type: 'claim' },
    ...IDS.map(building => ({ type: 'upgrade', building }) as Action).sort(() => Math.random() - 0.5),
    ...UNITS.map(unit => ({ type: 'train', unit, n: 20 }) as Action),
    ...TECH_IDS.map(tech => ({ type: 'study', tech }) as Action),
    { type: 'heal' },
    { type: 'seen' },
  ]
  return tries.find(ok) ?? null
}

async function bot(i: number) {
  const r = await fetch(`${o.url}/api/guest`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-rok': '1' },
    body: JSON.stringify({ name: `Bot ${process.pid.toString(36)} ${i.toString(36)}`, lang: 'vi' }),
  }).catch(() => null)
  if (!r?.ok) return void stat.failed++
  const { token, path } = (await r.json()) as { token: string; path: string }
  const s: Socket<ServerToClient, ClientToServer> = io(o.url, {
    path,
    auth: { token, protocol, build: 'load', lang: 'vi' },
    transports: ['websocket'],
  })
  let state: State | null = null
  let offset = 0
  s.on('welcome', (w: Welcome) => {
    state = { ...w.state, reports: [] }
    offset = w.now - Date.now()
    stat.connected++
  })
  s.on('s', (m: Push) => state && (state = { ...state, ...m.p }))
  s.on('disconnect', () => (stat.connected = Math.max(0, stat.connected - 1)))
  s.on('connect_error', () => stat.failed++)
  const loop = async () => {
    if (state && s.connected) {
      const a = choose(state, Date.now() + offset)
      if (a) {
        const t = performance.now()
        try {
          const ack = (await s.timeout(10_000).emitWithAck('act', a)) as Ack
          stat.rtt.push(Math.round(performance.now() - t))
          stat.acks++
          if (ack.ok && ack.p) state = { ...state!, ...ack.p }
          else if (!ack.ok) stat.nacks++
        } catch {
          stat.errors++
        }
      }
    }
    setTimeout(loop, T1 + Math.random() * (T2 - T1))
  }
  setTimeout(loop, Math.random() * T2)
}

for (let i = 0; i < N; i++) {
  setTimeout(() => void bot(i).catch(() => stat.failed++), (RAMP * i) / N)
}
