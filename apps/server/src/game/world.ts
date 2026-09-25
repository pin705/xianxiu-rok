// World actor: một giới = một actor đơn luồng. Mọi người chơi của giới nằm trong RAM; mọi thao tác và sự kiện tới hạn chạy
// tuần tự trên event loop (không await giữa đọc và ghi state) → không khoá, không race.
// Bền: state đổi → dirty → commit gộp (COMMIT_MS) trong một transaction có fencing. Mọi thứ phản ánh state chưa ghi (ack,
// patch cho tab khác, welcome…) nằm trong outbox, chỉ gửi sau khi commit chứa nó xong: đã ack là đã ghi.
// File này là lõi: state, commit, phần chung, sự kiện tới hạn. Từng việc khác một file trong game/:
//   act.ts thao tác · conn.ts kết nối · queries.ts truy vấn · talk.ts chat · npc.ts NPC · rollover.ts lật mùa / tuần
//   inbox.ts lệnh admin · lease.ts gia hạn, rào, đóng, lô ghi · committer.ts ghi DB · alarm.ts hẹn giờ · mapwatch.ts bản đồ
import type { FastifyBaseLogger } from 'fastify'
import type { Socket } from 'socket.io'
import { NPC_EVERY, advance, dayOf, migrate, weekOf, type Action, type Report, type State } from '@rok/rules'
import {
  bookView,
  lordOf,
  SEASON_DAYS,
  advanceAll,
  allyTouched,
  worldBuffs,
  atlas,
  dayIn,
  freshWorld,
  mapOf,
  memberKey,
  nextRaid,
  phaseOf,
  spawn,
  worldAct,
  type Chron,
  type MapCtx,
  type World as Shared,
  type WorldAction,
  type WorldResult,
} from '@rok/rules/world'
import {
  diff,
  type Ack,
  type Answer,
  type Channel,
  type ClientToServer,
  type Fame,
  type Push,
  type Query,
  type QueryOf,
  type SayErr,
  type Seen,
  type ServerToClient,
  type Snap,
  type WorldInfo,
} from '@rok/protocol'
import type { Database } from '../db/index.ts'
import * as store from '../db/store.ts'
import type { Pusher } from '../lib/push.ts'
import { intent, newSeed } from './act.ts'
import { Alarm } from './alarm.ts'
import { Chat } from './chat.ts'
import { Committer } from './committer.ts'
import { attach, detach, sync } from './conn.ts'
import { batch, fence } from './lease.ts'
import { MapWatch } from './mapwatch.ts'
import { incomingNote, remindNote, reportNote } from './notify.ts'
import { npcTurn } from './npc.ts'
import { answersOf } from './queries.ts'
import { allyEvents, bookCheck, rollWeek, seasonEnd } from './rollover.ts'
import { report, say } from './talk.ts'
import { milestones } from './track.ts'

export type SocketData = { pid: number; world: number }
export type Sock = Socket<ClientToServer, ServerToClient, Record<string, never>, SocketData>
export type Env = {
  db: Database
  node: string
  commitMs: number
  sync: boolean
  warpAllowed: boolean
  market?: boolean
  log: FastifyBaseLogger
  push?: Pusher | null
}

export type Slot = {
  id: number
  name: string
  v: number // version state của người chơi: +1 mỗi thay đổi đã ghi (client phát hiện lệch)
  conns: Set<Sock>
  seen: Seen | null
  gen: number // vé hẹn giờ cũ bỏ theo gen
  errors: number
  broken: boolean
  day: number // ngày cuối đã ghi sự kiện 'login' (D1/D7)
  away: number // +1 mỗi lần vào game: nhắc (push) hẹn lúc rời đi chỉ gửi nếu chưa quay lại
}
const CHRON_MAX = 50

export class World {
  // Trạng thái của actor: công khai cho các module trong game/ (actor chia theo việc, xem đầu file).
  // Ngoài game/ chỉ gọi các method ở mục API.
  readonly id: number
  info: WorldInfo
  epoch: number
  warp: number
  readOnly = false
  closing = false
  lost = false // bị rào (node khác đã nhận giới): không bao giờ ghi nữa
  renewedAt = performance.now()
  readonly env: Env
  readonly persist: Committer
  readonly ps = new Map<number, State>()
  readonly slots = new Map<number, Slot>()
  readonly alarm: Alarm
  readonly maps: MapWatch
  readonly chat = new Chat()
  readonly npc = new Set<number>() // tông môn NPC (không tài khoản): tự chơi, chỉ phản kích kẻ đã đánh mình
  // lệnh inbox đã áp vào RAM (chờ commit đánh dấu xong): không áp lại dù lần đọc sau còn thấy.
  // ponytail: giữ mãi (lệnh admin hiếm); dọn theo tuổi nếu dùng inbox cho việc thường xuyên.
  readonly applied = new Set<number>()
  polling = false // đang đọc hộp lệnh (không đọc chồng)
  week: number // tuần sự kiện đang chạy (lật tuần: trao quà top rồi sang tuần mới) — lưu ở worlds.state
  seed: number
  opened: number
  fame: Fame[] // bảng phong thần: top các mùa trước
  npcsMade: boolean
  chron: Chron[]
  shared: Shared // tiên minh… (luật giới, @rok/rules/world)
  private readonly bad = new Set<number>() // người chơi bị cách ly (state hỏng)
  private npcAt = 0
  private buffAt = 0 // buff bản đồ (linh mạch, linh triều) tính lại lúc này, hoặc ngay khi phần chung đổi
  private readonly answers = answersOf(this)

  constructor(c: store.Claimed, rows: store.PlayerRow[], env: Env) {
    this.env = env
    this.persist = new Committer({
      commitMs: env.commitMs,
      lost: () => this.lost,
      batch: (ids, seen, world, season) => batch(this, ids, seen, world, season),
      write: b => store.flushWorld(env.db, b),
      written: () => {
        this.renewedAt = performance.now()
        if (this.readOnly) {
          this.readOnly = false
          this.broadcast('status', { ro: false })
        }
      },
      fenced: () => fence(this),
      warn: (err, msg) => env.log.warn({ err, world: this.id }, msg),
    })
    this.alarm = new Alarm(
      () => this.now(),
      () => this.tick(this.now()),
    )
    this.maps = new MapWatch(
      () => this.now(),
      now => this.snapshot(now),
      send => this.persist.deliver(send, true),
    )
    this.id = c.id
    this.epoch = c.epoch
    this.warp = env.warpAllowed ? c.warp : 0
    this.seed = c.seed
    this.opened = c.opensAt.getTime()
    this.info = {
      id: c.id,
      name: c.name,
      season: c.season,
      map: c.seed,
      opened: this.opened,
      market: env.market !== false,
    }
    for (const r of rows) this.adopt(r)
    const st = (c.state ?? {}) as { week?: number; npcs?: boolean; chron?: Chron[]; world?: Shared; fame?: Fame[] }
    this.shared = { ...freshWorld(), ...st.world } // blob cũ thiếu trường mới: lấy mặc định
    this.week = st.week ?? weekOf(this.now())
    this.npcsMade = !!st.npcs
    this.chron = st.chron ?? []
    this.fame = st.fame ?? []
    this.armRaid()
  }

  // ---------- API (gateway, host, http/dev) ----------

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
  quarantined(pid: number) {
    return this.bad.has(pid)
  }
  intent(sock: Sock, a: Action | WorldAction, ack: (r: Ack) => void) {
    intent(this, sock, a, ack)
  }
  attach(sock: Sock) {
    return attach(this, sock)
  }
  detach(sock: Sock) {
    detach(this, sock)
  }
  sync(sock: Sock, ack: (s: Snap) => void) {
    sync(this, sock, ack)
  }
  say(sock: Sock, m: { ch: Channel; text: string }, ack: (r: { ok: true } | { ok: false; err: SayErr }) => void) {
    say(this, sock, m, ack)
  }
  report(sock: Sock, id: number) {
    return report(this, sock, id)
  }
  async query<K extends Query['k']>(sock: Sock, q: QueryOf<K>, ack: (d: Answer[K]) => void) {
    const d = await this.answers[q.k](sock, q)
    this.persist.deliver(() => ack(d))
  }

  // ---------- Lõi ----------

  // State trong DB đi qua migrate() (nâng bản cũ, kiểm khuôn). Không qua được thì cách ly người đó: không nạp, không ghi,
  // không nhận kết nối — cả giới vẫn chạy, chờ người sửa tay.
  adopt(r: store.PlayerRow) {
    const s = migrate(r.state)
    if (!s) {
      this.bad.add(r.id)
      return this.env.log.error({ pid: r.id, world: this.id }, 'state không qua migrate: cách ly người chơi')
    }
    this.ps.set(r.id, s)
    if (r.accountId === null) this.npc.add(r.id)
    this.slots.set(r.id, {
      id: r.id,
      name: r.name,
      v: 1,
      conns: new Set(),
      seen: r.seen,
      gen: 0,
      errors: 0,
      broken: false,
      day: -1,
      away: 0,
    })
  }

  // Bản đồ giới lúc now: seed của giới + pha mùa (cổng nào đã mở)
  map(now: number): MapCtx {
    return { atlas: atlas(this.seed), phase: phaseOf(dayIn(this.opened, now)) }
  }
  // Ảnh chụp bản đồ giới cho client (chỗ ngồi, hành quân trên bản đồ, biên niên, điểm)
  snapshot(now: number) {
    const [w, map] = [this.shared, this.map(now)]
    const lord = lordOf(w, this.ps, map, now)
    const book = bookView(w, this.ps, map, now, this.npc)
    return { ...mapOf(this.ps, now, this.npc, this.chron, w), lord, book, bless: w.bless }
  }
  // Luật giới cho một người (mầm mới mỗi lần, trừ khi truyền seed)
  play(pid: number, a: WorldAction, now: number, seed = newSeed()): WorldResult {
    return worldAct(this.ps, pid, a, now, seed, this.map(now), this.shared)
  }

  // Tông môn chưa có chỗ trên bản đồ giới: xếp vào vùng ngoài ít người nhất
  seat(slot: Slot, now: number) {
    const s = this.ps.get(slot.id)!
    if (s.seat) return
    const taken = [...this.ps.values()].flatMap(x => (x.seat ? [x.seat] : []))
    const at = spawn(atlas(this.seed), taken, Math.random)
    if (!at) return this.env.log.warn({ world: this.id }, 'world map full: no seat')
    this.commit(slot, { ...s, seat: at })
    if (!this.npc.has(slot.id)) this.record({ at: now, k: 'found', a: [s.name] })
  }

  record(c: Chron) {
    this.chron = [...this.chron, c].slice(-CHRON_MAX)
    this.persist.worldDirty = true
    this.maps.changed()
    this.persist.schedule()
  }

  // Phần chung đổi: ghi cùng commit, báo người trong các minh bị ảnh hưởng (họ hỏi lại chi tiết)
  share(next: Shared) {
    const prev = this.shared
    this.shared = next
    this.persist.worldDirty = true
    this.buffAt = 0 // linh mạch / người trong minh có thể đã đổi
    // điểm đổi phe / ai vào, rời minh: bản đồ (cả lãnh thổ) đổi
    if (prev.spots !== next.spots || memberKey(prev) !== memberKey(next)) this.maps.changed()
    if (prev.spots !== next.spots) {
      const a = atlas(this.seed)
      for (const [k, sp] of Object.entries(next.spots)) {
        const p = a.points[Number(k)]
        if (p?.kind === 'boss' && sp.until && sp.until !== prev.spots[Number(k)]?.until)
          this.record({ at: this.now(), k: 'boss', a: [p.lv] })
      }
    }
    for (const pid of allyTouched(prev, next))
      for (const c of this.slots.get(pid)?.conns ?? []) this.persist.deliver(() => c.emit('ally'), true)
    this.persist.schedule()
  }

  // Đường duy nhất làm đổi state của người chơi
  commit(slot: Slot, next: State, origin?: { sock: Sock; ack: (r: Ack) => void }) {
    const prev = this.ps.get(slot.id)!
    const ack = origin?.ack
    if (next === prev) return ack && this.persist.deliver(() => ack({ ok: true }))
    // Chiến báo mới (hoặc vừa sửa: home() ghi số tử trận) → bảng reports. State chỉ giữ chiến báo mà hành quân đang đi còn tham chiếu.
    const rep = next.reports.filter(r => !prev.reports.includes(r))
    const keep = next.reports.filter(r => next.marches.some(m => m.report === r.id))
    const stored = keep.length === next.reports.length ? next : { ...next, reports: keep }
    this.ps.set(slot.id, stored)
    const p = diff(prev, stored)
    if (!rep.length && !Object.keys(p).length) return ack && this.persist.deliver(() => ack({ ok: true })) // chỉ mầm đổi
    const v = ++slot.v
    this.persist.dirty.add(slot.id)
    for (const r of rep)
      this.persist.pending.reports.push({ pid: slot.id, id: r.id, at: r.at, kind: r.kind, win: r.win, body: r })
    this.track(slot.id, prev, stored, rep)
    if (!slot.conns.size)
      this.notify(
        slot,
        rep,
        (stored.incoming ?? []).filter(x => !prev.incoming?.includes(x)),
      )
    const push: Push = rep.length ? { v, p, rep } : { v, p }
    const others = [...slot.conns].filter(c => c !== origin?.sock)
    this.persist.deliver(() => {
      for (const s of others) if (s.connected) s.emit('s', push)
    }, true)
    if (ack) this.persist.deliver(() => ack({ ok: true, ...push }), true)
    if (prev.marches !== stored.marches) this.wake(slot)
    if (
      prev.seat !== stored.seat ||
      prev.name !== stored.name ||
      prev.levels.chuDien !== stored.levels.chuDien ||
      (prev.marches !== stored.marches &&
        [...prev.marches, ...stored.marches].some(m => m.path || m.target.kind === 'trib'))
    )
      this.maps.changed()
    this.persist.schedule()
  }

  // Offline mà có đội kéo tới / bị cướp / kiếp vân vừa giáng: báo qua Web Push
  private notify(slot: Slot, rep: Report[], warn: NonNullable<State['incoming']>) {
    if (!this.env.push || this.npc.has(slot.id)) return
    for (const x of warn) this.env.push(slot.id, incomingNote(x))
    for (const r of rep) {
      const note = reportNote(r)
      if (note) this.env.push(slot.id, note)
    }
  }

  // Analytics + biên niên từ một lần state đổi (game/track.ts)
  private track(pid: number, prev: State, next: State, rep: Report[]) {
    const m = milestones(prev, next, rep, this.npc.has(pid))
    for (const e of m.events) this.event(pid, e.name, e.at, e.props)
    for (const c of m.chron) this.record(c)
  }
  event(pid: number, name: string, at: number, props: object = {}) {
    this.persist.pending.events.push({ pid, name, day: dayOf(at), at, props })
    this.persist.schedule()
  }

  // ---------- Hẹn giờ ----------

  // Trận PvE giải trong advance() bằng mầm của server; client không biết mầm nên chờ server đẩy kết quả đúng lúc tới nơi.
  // Lúc đội về nhà thì client tự tính được (đã có kết quả trong state), không cần đẩy.
  wake(slot: Slot) {
    slot.gen++
    if (!slot.conns.size) return
    let at = Infinity
    for (const m of this.ps.get(slot.id)!.marches) if (!m.back && m.seed && m.arriveAt < at) at = m.arriveAt
    if (at !== Infinity) this.alarm.add({ at, pid: slot.id, gen: slot.gen })
  }

  // Hẹn giờ trận cướp kế tiếp (vé pid 0: tick giải mọi trận tới hạn bằng advanceWorld, vé cũ tự vô hại)
  armRaid() {
    const at = nextRaid(this.ps)
    if (at !== Infinity) this.alarm.add({ at, pid: 0, gen: 0 })
  }

  // ---------- Sự kiện của cả giới ----------

  // Sự kiện của cả giới: lật tuần sự kiện, rồi mọi trận cướp đã tới nơi (một trận đổi state của cả hai bên)
  private worldStep(now: number) {
    if (dayIn(this.opened, now) >= SEASON_DAYS) seasonEnd(this, now)
    if (weekOf(now) > this.week) rollWeek(this, now)
    bookCheck(this, now)
    allyEvents(this, now)
    try {
      const map = this.map(now)
      const r = advanceAll(this.ps, this.shared, now, map)
      if (r.world !== this.shared) this.share(r.world)
      this.commitAll(r.changed)
      if (r.changed.size) this.armRaid()
      // buff bản đồ: khi phần chung đổi (share đặt buffAt = 0), và mỗi 30 giây (linh triều bắt đầu/đổi vùng)
      if (now >= this.buffAt) {
        this.buffAt = now + 30_000
        this.commitAll(worldBuffs(this.ps, this.shared, map, now))
      }
    } catch (e) {
      this.env.log.error({ err: e, world: this.id }, 'world step threw')
    }
  }
  commitAll(changed: Map<number, State>) {
    for (const [pid, s] of changed) {
      const slot = this.slots.get(pid)
      if (slot) this.commit(slot, s)
    }
  }
  // Xử lý mọi sự kiện đã tới hạn, theo thứ tự thời gian. Gọi trước mỗi thao tác: không ai thao tác trên state cũ hơn sự kiện.
  tick(now: number) {
    if (this.lost || this.readOnly) return
    this.worldStep(now)
    if (this.npc.size && now >= this.npcAt) {
      this.npcAt = now + NPC_EVERY
      npcTurn(this, now)
    }
    for (const ev of this.alarm.due(now)) {
      const slot = this.slots.get(ev.pid)
      if (slot && ev.remind) {
        if (slot.away === ev.remind.away && !slot.conns.size) this.env.push?.(slot.id, remindNote(ev.remind.k))
        continue
      }
      if (!slot || slot.gen !== ev.gen) continue // vé cũ
      try {
        const s = this.ps.get(ev.pid)!
        this.commit(slot, advance(s, Math.max(ev.at, s.time)))
      } catch (e) {
        this.env.log.error({ err: e, world: this.id, pid: ev.pid }, 'wake failed')
      }
    }
    this.alarm.arm()
  }

  broadcast<E extends 'status' | 'clock'>(event: E, payload: Parameters<ServerToClient[E]>[0]) {
    for (const s of this.slots.values())
      for (const c of s.conns) this.persist.deliver(() => (c.emit as (e: E, p: typeof payload) => void)(event, payload))
  }

  stop() {
    this.maps.stop()
    this.alarm.stop()
    this.persist.stop()
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
