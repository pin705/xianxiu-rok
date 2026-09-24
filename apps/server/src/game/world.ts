// World actor: một giới = một actor đơn luồng. Mọi người chơi của giới nằm trong RAM; mọi thao tác và sự kiện tới hạn chạy
// tuần tự trên event loop (không await giữa đọc và ghi state) → không khoá, không race.
// Bền: state đổi → dirty → commit gộp (COMMIT_MS) trong một transaction có fencing. Mọi thứ phản ánh state chưa ghi (ack,
// patch cho tab khác, welcome…) nằm trong outbox, chỉ gửi sau khi commit chứa nó xong: đã ack là đã ghi.
import { randomInt } from 'node:crypto'
import type { FastifyBaseLogger } from 'fastify'
import type { Socket } from 'socket.io'
import { advance, apply, dayOf, power, type Action, type Report, type State } from '@rok/rules'
import { diff, view, type Ack, type Bye, type ClientToServer, type Push, type Query, type Seen, type ServerToClient, type Snap, type WorldInfo } from '@rok/protocol'
import type { Database } from '../db/index.ts'
import * as store from '../db/store.ts'
import { commitErrors, commitSeconds, fenced, intents } from '../lib/metrics.ts'
import { Heap } from './heap.ts'

export type SocketData = { pid: number; world: number; lang: string }
export type Sock = Socket<ClientToServer, ServerToClient, Record<string, never>, SocketData>
export type Env = { db: Database; node: string; commitMs: number; sync: boolean; warpAllowed: boolean; log: FastifyBaseLogger }

type Slot = {
  id: number
  name: string
  v: number // version state của người chơi: +1 mỗi thay đổi đã ghi (client phát hiện lệch)
  conns: Set<Sock>
  seen: Seen | null
  gen: number // vé hẹn giờ cũ bỏ theo gen
  errors: number
  broken: boolean
  day: number // ngày cuối đã ghi sự kiện 'login' (D1/D7)
}
type Wake = { at: number; n: number; pid: number; gen: number }
type Pending = { reports: store.Batch['reports']; events: store.Batch['events']; inboxDone: number[] }
const empty = (): Pending => ({ reports: [], events: [], inboxDone: [] })
const MAX_TABS = 5
const seed = () => randomInt(1, 2 ** 32 - 1) // mầm mới trước mọi thao tác: client không đoán trước được trận

export class World {
  readonly id: number
  readonly info: WorldInfo
  epoch: number
  warp: number
  readOnly = false
  closing = false
  lost = false // bị rào (node khác đã nhận giới): không bao giờ ghi nữa
  renewedAt = performance.now()

  private readonly env: Env
  private readonly ps = new Map<number, State>()
  private readonly slots = new Map<number, Slot>()
  private readonly dirty = new Set<number>()
  private readonly seenDirty = new Set<number>()
  private pending: Pending = empty()
  private inflight: Pending | null = null
  private outbox: (() => void)[] = []
  private committing = false
  private commitTimer: NodeJS.Timeout | null = null
  private retries = 0
  private readonly wakes = new Heap<Wake>()
  private n = 0
  private timer: NodeJS.Timeout | null = null
  private timerAt = Infinity

  constructor(c: store.Claimed, rows: store.PlayerRow[], env: Env) {
    this.env = env
    this.id = c.id
    this.epoch = c.epoch
    this.warp = env.warpAllowed ? c.warp : 0
    this.info = { id: c.id, name: c.name, season: c.season }
    for (const r of rows) this.adopt(r)
  }

  now() {
    return Date.now() + this.warp
  }
  state(pid: number) {
    return this.ps.get(pid)
  }
  get online() {
    let n = 0
    for (const s of this.slots.values()) if (s.conns.size) n++
    return n
  }

  private adopt(r: store.PlayerRow) {
    this.ps.set(r.id, r.state)
    this.slots.set(r.id, { id: r.id, name: r.name, v: 1, conns: new Set(), seen: r.seen, gen: 0, errors: 0, broken: false, day: -1 })
  }

  // ---------- Kết nối ----------

  async attach(sock: Sock) {
    const pid = sock.data.pid
    if (!this.slots.has(pid)) {
      const row = await store.findPlayer(this.env.db, pid) // người vừa lập tông môn (API có thể ở node khác)
      if (!row || row.worldId !== this.id) return void sock.disconnect(true)
      if (!this.slots.has(pid)) this.adopt(row)
    }
    if (this.closing || this.lost || !sock.connected) return void sock.disconnect(true)
    const slot = this.slots.get(pid)!
    if (slot.conns.size >= MAX_TABS) this.drop(slot.conns.values().next().value!, 'replaced')
    // đưa state tới giờ hiện tại trước khi nhận kết nối mới: patch của bước này chỉ tới các tab cũ, tab mới nhận welcome
    const now = this.now()
    this.tick(now)
    this.commit(slot, advance(this.ps.get(pid)!, now))
    slot.conns.add(sock)
    const today = dayOf(now)
    if (slot.day !== today) {
      slot.day = today
      this.event(pid, 'login', now, { hall: this.ps.get(pid)!.levels.chuDien })
    }
    const seen = slot.seen && now - slot.seen.time >= 60_000 ? slot.seen : undefined
    const state = view(this.ps.get(pid)!)
    const v = slot.v
    this.deliver(() => sock.emit('welcome', { now, v, state, me: { pid, name: slot.name, world: this.id, x: null, y: null }, world: this.info, seen, ro: this.readOnly, warp: this.env.warpAllowed }), true)
    this.wake(slot)
  }

  detach(sock: Sock) {
    const slot = this.slots.get(sock.data.pid)
    if (!slot || !slot.conns.delete(sock) || slot.conns.size) return
    slot.gen++ // không còn ai xem: bỏ hẹn đẩy kết quả trận
    this.commit(slot, advance(this.ps.get(slot.id)!, this.now()))
    const s = this.ps.get(slot.id)!
    slot.seen = { time: s.time, res: s.res, levels: s.levels, tech: s.tech, stats: s.stats }
    this.seenDirty.add(slot.id)
    this.dirty.add(slot.id)
    this.schedule()
  }

  drop(sock: Sock, reason: Bye) {
    sock.emit('bye', { reason })
    this.detach(sock)
    sock.disconnect(true)
  }

  // ---------- Thao tác ----------

  intent(sock: Sock, a: Action, ack: (r: Ack) => void) {
    const slot = this.slots.get(sock.data.pid)
    if (!slot) return ack({ ok: false, err: 'moving' })
    if (this.closing || this.lost) return this.deliver(() => ack({ ok: false, err: 'moving' }))
    if (this.readOnly) return this.deliver(() => ack({ ok: false, err: 'unavailable' }))
    if (slot.broken) return this.deliver(() => ack({ ok: false, err: 'maintenance' }))
    const now = this.now()
    this.tick(now)
    let r: ReturnType<typeof apply>
    try {
      r = apply({ ...this.ps.get(slot.id)!, seed: seed() }, a, now)
      slot.errors = 0
    } catch (e) {
      // state bất biến: lỗi giữa chừng không làm hỏng gì, chỉ từ chối thao tác này
      r = { ok: false, error: 'bad' }
      this.env.log.error({ err: e, world: this.id, pid: slot.id, action: JSON.stringify(a).slice(0, 300) }, 'apply threw')
      if (++slot.errors >= 5) slot.broken = true
    }
    intents.inc({ result: r.ok ? 'ok' : r.error })
    if (!r.ok) {
      const err = r.error
      return this.deliver(() => ack({ ok: false, err }))
    }
    this.commit(slot, r.state, { sock, ack })
  }

  async query(sock: Sock, q: Query, ack: (d: unknown) => void) {
    const pid = sock.data.pid
    // chiến báo chưa kịp ghi DB (đang chờ / đang commit) cộng chiến báo đã ghi
    const mem = [...(this.inflight?.reports ?? []), ...this.pending.reports]
      .filter(r => r.pid === pid && (q.before === undefined || r.id < q.before))
      .map(r => r.body as Report)
    const rows = (await store.playerReports(this.env.db, pid, q.before)) as Report[]
    const byId = new Map<number, Report>()
    for (const r of [...rows, ...mem]) byId.set(r.id, r)
    const list = [...byId.values()].sort((x, y) => y.id - x.id).slice(0, 30)
    this.deliver(() => ack(list))
  }

  sync(sock: Sock, ack: (s: Snap) => void) {
    const slot = this.slots.get(sock.data.pid)
    if (!slot) return
    const snap = { v: slot.v, state: view(this.ps.get(slot.id)!) }
    this.deliver(() => ack(snap), true)
  }

  // Đường duy nhất làm đổi state của người chơi
  commit(slot: Slot, next: State, origin?: { sock: Sock; ack: (r: Ack) => void }) {
    const prev = this.ps.get(slot.id)!
    const ack = origin?.ack
    if (next === prev) return ack && this.deliver(() => ack({ ok: true }))
    // Chiến báo mới (hoặc vừa sửa: home() ghi số tử trận) → bảng reports. State chỉ giữ chiến báo mà hành quân đang đi còn tham chiếu.
    const rep = next.reports.filter(r => !prev.reports.includes(r))
    const keep = next.reports.filter(r => next.marches.some(m => m.report === r.id))
    const stored = keep.length === next.reports.length ? next : { ...next, reports: keep }
    this.ps.set(slot.id, stored)
    const p = diff(prev, stored)
    if (!rep.length && !Object.keys(p).length) return ack && this.deliver(() => ack({ ok: true })) // chỉ mầm đổi
    const v = ++slot.v
    this.dirty.add(slot.id)
    for (const r of rep) this.pending.reports.push({ pid: slot.id, id: r.id, at: r.at, kind: r.kind, win: r.win, body: r })
    this.track(slot.id, prev, stored, rep)
    const push: Push = rep.length ? { v, p, rep } : { v, p }
    const others = [...slot.conns].filter(c => c !== origin?.sock)
    this.deliver(() => {
      for (const s of others) if (s.connected) s.emit('s', push)
    }, true)
    if (ack) this.deliver(() => ack({ ok: true, ...push }), true)
    if (prev.marches !== stored.marches) this.wake(slot)
    this.schedule()
  }

  // Analytics phía server: client không phải gửi gì
  private track(pid: number, prev: State, next: State, rep: Report[]) {
    const at = next.time
    if (next.levels.chuDien > prev.levels.chuDien) this.event(pid, 'hall', at, { n: next.levels.chuDien, rebirths: next.rebirths })
    if (next.rebirths > prev.rebirths) this.event(pid, 'rebirth', at, { n: next.rebirths })
    for (const r of rep) if (r.kind === 'trib' && r.id >= prev.nextId) this.event(pid, 'trib', at, { win: r.win, hall: next.levels.chuDien })
  }
  event(pid: number, name: string, at: number, props: object = {}) {
    this.pending.events.push({ pid, name, day: dayOf(at), at, props })
    this.schedule()
  }

  // ---------- Hẹn giờ: đẩy kết quả trận PvE cho người đang xem ----------

  // Trận PvE giải trong advance() bằng mầm của server; client không biết mầm nên chờ server đẩy kết quả đúng lúc tới nơi.
  // Lúc đội về nhà thì client tự tính được (đã có kết quả trong state), không cần đẩy.
  private wake(slot: Slot) {
    slot.gen++
    if (!slot.conns.size) return
    let at = Infinity
    for (const m of this.ps.get(slot.id)!.marches) if (!m.back && m.seed && m.arriveAt < at) at = m.arriveAt
    if (at === Infinity) return
    this.wakes.push({ at, n: this.n++, pid: slot.id, gen: slot.gen })
    this.arm()
  }

  private arm() {
    const top = this.wakes.peek()
    if (!top || top.at >= this.timerAt) return
    if (this.timer) clearTimeout(this.timer)
    this.timerAt = top.at
    this.timer = setTimeout(
      () => {
        this.timer = null
        this.timerAt = Infinity
        this.tick(this.now())
      },
      Math.min(3_600_000, Math.max(0, top.at - this.now())),
    )
  }

  // Xử lý mọi sự kiện đã tới hạn, theo thứ tự thời gian. Gọi trước mỗi thao tác: không ai thao tác trên state cũ hơn sự kiện.
  tick(now: number) {
    if (this.lost || this.readOnly) return
    for (let ev = this.wakes.peek(); ev && ev.at <= now; ev = this.wakes.peek()) {
      this.wakes.pop()
      const slot = this.slots.get(ev.pid)
      if (!slot || slot.gen !== ev.gen) continue // vé cũ
      try {
        const s = this.ps.get(ev.pid)!
        this.commit(slot, advance(s, Math.max(ev.at, s.time)))
      } catch (e) {
        this.env.log.error({ err: e, world: this.id, pid: ev.pid }, 'wake failed')
      }
    }
    this.arm()
  }

  // ---------- Gửi ----------

  // durable: phản ánh state chưa ghi → chờ commit. Cái khác (lỗi, truy vấn) đi ngay — trừ khi còn gói trước đang chờ (giữ thứ tự).
  private deliver(send: () => void, durable = false) {
    if (this.outbox.length || (durable && (this.dirty.size || this.committing))) {
      this.outbox.push(send)
      this.schedule()
    } else send()
  }

  broadcast<E extends 'status' | 'clock'>(event: E, payload: Parameters<ServerToClient[E]>[0]) {
    for (const s of this.slots.values())
      for (const c of s.conns) this.deliver(() => (c.emit as (e: E, p: typeof payload) => void)(event, payload))
  }

  // ---------- Commit gộp ----------

  private schedule(delay = this.env.commitMs) {
    if (this.commitTimer || this.committing || this.lost) return
    this.commitTimer = setTimeout(() => {
      this.commitTimer = null
      void this.flush()
    }, delay)
  }

  async flush(renew = false) {
    if (this.committing || this.lost) return
    const p = this.pending
    if (!renew && !this.dirty.size && !this.outbox.length && !p.events.length && !p.inboxDone.length) return
    if (this.commitTimer) clearTimeout(this.commitTimer)
    this.commitTimer = null
    const ids = [...this.dirty]
    const seenIds = new Set(this.seenDirty)
    this.dirty.clear()
    this.seenDirty.clear()
    this.pending = empty()
    const outbox = this.outbox
    this.outbox = []
    const players = ids.map(id => {
      const s = this.ps.get(id)!
      const slot = this.slots.get(id)!
      return {
        id, state: s, name: slot.name, power: Math.round(power(s)), hall: s.levels.chuDien, tower: s.tower, rebirths: s.rebirths,
        ...(seenIds.has(id) && slot.seen ? { seen: slot.seen } : {}),
      }
    })
    this.committing = true
    this.inflight = p
    const stop = commitSeconds.startTimer()
    try {
      await store.flushWorld(this.env.db, {
        world: this.id, epoch: this.epoch, node: this.env.node, online: this.online, sync: this.env.sync,
        players, reports: p.reports, events: p.events, inboxDone: p.inboxDone,
      })
      stop()
      this.renewedAt = performance.now()
      this.retries = 0
      if (this.readOnly) {
        this.readOnly = false
        this.broadcast('status', { ro: false })
      }
      for (const send of outbox) send()
    } catch (e) {
      if (e instanceof store.Fenced) return this.fence()
      commitErrors.inc()
      this.env.log.warn({ err: e, world: this.id }, 'commit failed, retrying')
      for (const id of ids) this.dirty.add(id) // lần sau ghi state MỚI NHẤT của họ
      for (const id of seenIds) this.seenDirty.add(id)
      this.pending = { reports: [...p.reports, ...this.pending.reports], events: [...p.events, ...this.pending.events], inboxDone: [...p.inboxDone, ...this.pending.inboxDone] }
      this.outbox = [...outbox, ...this.outbox]
      this.retries++
    } finally {
      this.committing = false
      this.inflight = null
    }
    if (this.lost) return
    if (this.retries) this.schedule(Math.min(5000, 100 * 2 ** this.retries))
    else if (this.dirty.size) this.schedule()
    else if (this.outbox.length) {
      // xếp hàng trong lúc commit mà không kèm thay đổi mới: phần chúng phản ánh đã ghi xong
      const o = this.outbox
      this.outbox = []
      for (const send of o) send()
    }
  }

  // Gia hạn lease định kỳ (không có thay đổi vẫn phải báo "còn sống"). Quá 12 giây không gia hạn được: tự rào, chỉ đọc.
  heartbeat() {
    if (this.lost) return
    const idle = performance.now() - this.renewedAt
    if (idle > 12_000 && !this.readOnly) {
      this.readOnly = true
      this.env.log.warn({ world: this.id }, 'world read-only: lease not renewed')
      this.broadcast('status', { ro: true })
    }
    if (idle > 5_000) void this.flush(true)
  }

  // Node khác đã nhận giới (epoch đổi): dừng hẳn, không ghi gì nữa, đẩy mọi người sang node mới
  private fence() {
    this.lost = true
    fenced.inc()
    this.env.log.warn({ world: this.id }, 'world fenced: another node owns it now')
    for (const s of this.slots.values())
      for (const c of s.conns) {
        c.emit('bye', { reason: 'moved' })
        c.disconnect(true)
      }
    this.stop()
  }

  stop() {
    if (this.timer) clearTimeout(this.timer)
    if (this.commitTimer) clearTimeout(this.commitTimer)
    this.timer = this.commitTimer = null
  }

  // Deploy / tắt node: commit lần cuối, nhả lease, báo client nối lại (tới node khác nhận giới)
  async close() {
    this.closing = true
    for (let i = 0; i < 100 && !this.lost && (this.committing || this.dirty.size || this.outbox.length || this.pending.events.length); i++) {
      if (this.committing) await new Promise(r => setTimeout(r, 20))
      else await this.flush(true)
    }
    for (const s of this.slots.values())
      for (const c of s.conns) {
        c.emit('bye', { reason: 'restart' })
        c.disconnect(true)
      }
    this.stop()
    if (!this.lost) await store.releaseWorld(this.env.db, this.id, this.env.node, this.epoch).catch(() => {})
  }

  // ---------- Công cụ dev/e2e (chỉ khi ALLOW_WARP) ----------

  setWarp(ms: number) {
    this.warp += ms
    const now = this.now()
    this.tick(now)
    this.broadcast('clock', { now })
  }

  setState(pid: number, s: State) {
    const slot = this.slots.get(pid)
    if (!slot) return false
    this.commit(slot, s)
    return true
  }
}
