// npm start — chạy cả game để chơi thử trên máy: database (docker), server game (tự khởi động lại khi sửa code), client (Vite).
// Mở http://localhost:5173 (client chuyển /api, /socket.io sang server ở cổng 8787). Ctrl+C tắt cả hai; database vẫn chạy nền
// (tắt: docker compose -f apps/server/deploy/compose.dev.yml down).
import { spawn, execFileSync, type ChildProcess } from 'node:child_process'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const color = { db: 36, server: 33, client: 35 } as const

function log(name: keyof typeof color, text: string) {
  for (const line of text.split('\n'))
    if (line.trim()) process.stdout.write(`\x1b[${color[name]}m[${name}]\x1b[0m ${line}\n`)
}

log('db', 'bật Postgres (docker compose, cổng 5439)…')
try {
  execFileSync('docker', ['compose', '-f', 'apps/server/deploy/compose.dev.yml', 'up', '-d', '--wait'], {
    cwd: root,
    stdio: 'pipe',
  })
  log('db', 'sẵn sàng')
} catch (e) {
  log('db', `không bật được database — Docker đã chạy chưa?\n${(e as { stderr?: Buffer }).stderr?.toString() ?? e}`)
  process.exit(1)
}

const kids: ChildProcess[] = []
function run(name: 'server' | 'client', args: string[]) {
  const p = spawn('npm', ['run', ...args], { cwd: root, env: { ...process.env, FORCE_COLOR: '1' } })
  p.stdout.on('data', d => log(name, String(d)))
  p.stderr.on('data', d => log(name, String(d)))
  p.on('exit', code => {
    log(name, `dừng (mã ${code})`)
    stop(code ?? 0)
  })
  kids.push(p)
}
let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  for (const p of kids) if (p.exitCode === null) p.kill('SIGTERM')
  setTimeout(() => process.exit(code), 500)
}
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())

run('server', ['dev', '-w', '@rok/server'])
run('client', ['dev', '-w', '@rok/client'])
log('client', 'mở http://localhost:5173')
