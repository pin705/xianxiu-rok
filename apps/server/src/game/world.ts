// World actor: một giới = một actor đơn luồng. Mọi người chơi của giới nằm trong RAM; mọi thao tác và sự kiện tới hạn chạy
// tuần tự trên event loop (không await giữa đọc và ghi state) → không khoá, không race.
// Bền: state đổi → dirty → commit gộp (COMMIT_MS) trong một transaction có fencing. Mọi thứ phản ánh state chưa ghi (ack,
// patch cho tab khác, welcome…) nằm trong outbox, chỉ gửi sau khi commit chứa nó xong: đã ack là đã ghi.
import { randomInt } from 'node:crypto'
import type { FastifyBaseLogger } from 'fastify'
import type { Socket } from 'socket.io'
import {
  CHAT_HALL,
  NPC_EVERY,
  NPC_PER,
  advance,
  apply,
  dayOf,
  eventOf,
  mail,
  migrate,
  power,
  weekOf,
  type Action,
  type JobKind,
  type NewMail,
  type Report,
  type State,
} from '@rok/rules'
import {
  MARKET_ACTIONS,
  SEASON_DAYS,
  WORLD_ACTIONS,
  advanceAll,
  allyInfo,
  allyOf,
  allyRows,
  endSeason,
  worldBuffs,
  atlas,
  dayIn,
  eventPrize,
  eventTop,
  freshWorld,
  mapOf,
  nextRaid,
  parseWorldAction,
  phaseOf,
  regionOf,
  rivals,
  marketOf,
  seasonBoard,
  sideKey,
  spawn,
  worldAct,
  type Chron,
  type MapCtx,
  type World as Shared,
  type WorldAction,
  type WorldResult,
} from '@rok/rules/world'
import { npcHold, npcRevenge, npcState, turn } from '@rok/rules/bot'
import { loadText } from '@rok/i18n'

const vi = await loadText('vi') // tên phân đà NPC (tên tông môn là dữ liệu của giới, mọi người thấy cùng một tên)
import {
  diff,
  view,
  type Ack,
  type Bye,
  type Channel,
  type ClientToServer,
  type Fame,
  type Push,
  type Answer,
  type Query,
  type QueryOf,
  type SayErr,
  type Seen,
  type ServerToClient,
  type Snap,
  type WorldInfo,
} from '@rok/protocol'
import { hasBad } from '../lib/filter.ts'
import type { Database } from '../db/index.ts'
import * as store from '../db/store.ts'
import { fenced, intents } from '../lib/metrics.ts'
import { Chat } from './chat.ts'
import { Committer } from './committer.ts'
import { Heap } from './heap.ts'
import { nextRemind, remindNote, reportNote } from './notify.ts'
import { milestones } from './track.ts'
import type { Pusher } from '../lib/push.ts'

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
  away: number // +1 mỗi lần vào game: nhắc (push) hẹn lúc rời đi chỉ gửi nếu chưa quay lại
}
// remind: nhắc qua Web Push lúc việc dài xong (người chơi đang offline); không có thì là vé đẩy kết quả trận
type Wake = { at: number; n: number; pid: number; gen: number; remind?: { k: JobKind | 'march'; away: number } }
const MAX_TABS = 5
const CHRON_MAX = 50
const MAP_WATCH = 60_000 // theo dõi bản đồ: hết hạn nếu không hỏi lại
const SEASON_ROWS = 20 // bảng điểm mùa gửi client: top này
const seed = () => randomInt(1, 2 ** 32 - 1) // mầm mới trước mọi thao tác: client không đoán trước được trận
// Chữ người chơi tự đặt mà cả giới thấy: lọc từ tục trước khi vào luật (chat lọc riêng bằng mask)
const publicText = (a: WorldAction) =>
  a.type === 'allyFound' ? [a.name, a.tag] : a.type === 'allyNotice' ? [a.text] : []

export class World {
  readonly id: number
  info: WorldInfo
  epoch: number
  warp: number
  readOnly = false
  closing = false
  lost = false // bị rào (node khác đã nhận giới): không bao giờ ghi nữa
  renewedAt = performance.now()

  private readonly env: Env
  private readonly persist: Committer
  private readonly ps = new Map<number, State>()
  private readonly slots = new Map<number, Slot>()
  private readonly wakes = new Heap<Wake>()
  private n = 0
  private timer: NodeJS.Timeout | null = null
  private timerAt = Infinity
  private bad = new Set<number>() // người chơi bị cách ly (state hỏng)
  private week: number // tuần sự kiện đang chạy (lật tuần: trao quà top rồi sang tuần mới) — lưu ở worlds.state
  private polling = false
  // lệnh inbox đã áp vào RAM (chờ commit đánh dấu xong): không áp lại dù lần đọc sau còn thấy.
  // ponytail: giữ mãi (lệnh admin hiếm); dọn theo tuổi nếu dùng inbox cho việc thường xuyên.
  private readonly applied = new Set<number>()
  private seed: number
  private opened: number
  private fame: Fame[] // bảng phong thần: top các mùa trước
  private readonly npc = new Set<number>() // tông môn NPC (không tài khoản): tự chơi, chỉ phản kích kẻ đã đánh mình
  private npcAt = 0
  private npcsMade: boolean
  private chron: Chron[]
  private shared: Shared // tiên minh… (luật giới, rules/world.ts)
  private readonly watchers = new Map<Sock, number>() // đang mở bản đồ giới → hết hạn
  private mapTimer: NodeJS.Timeout | null = null
  private readonly chat = new Chat()
  private buffAt = 0 // buff bản đồ (linh mạch, linh triều) tính lại lúc này, hoặc ngay khi phần chung đổi

  constructor(c: store.Claimed, rows: store.PlayerRow[], env: Env) {
    this.env = env
    this.persist = new Committer({
      commitMs: env.commitMs,
      lost: () => this.lost,
      batch: (ids, seen, world, season) => this.batch(ids, seen, world, season),
      write: b => store.flushWorld(env.db, b),
      written: () => {
        this.renewedAt = performance.now()
        if (this.readOnly) {
          this.readOnly = false
          this.broadcast('status', { ro: false })
        }
      },
      fenced: () => this.fence(),
      warn: (err, msg) => env.log.warn({ err, world: this.id }, msg),
    })
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

  // State trong DB đi qua migrate() (nâng bản cũ, kiểm khuôn). Không qua được thì cách ly người đó: không nạp, không ghi,
  // không nhận kết nối — cả giới vẫn chạy, chờ người sửa tay.
  private adopt(r: store.PlayerRow) {
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
  quarantined(pid: number) {
    return this.bad.has(pid)
  }

  // Bản đồ giới lúc now: seed của giới + pha mùa (cổng nào đã mở)
  private map(now: number): MapCtx {
    return { atlas: atlas(this.seed), phase: phaseOf(dayIn(this.opened, now)) }
  }

  // Tông môn chưa có chỗ trên bản đồ giới: xếp vào vùng ngoài ít người nhất
  private seat(slot: Slot, now: number) {
    const s = this.ps.get(slot.id)!
    if (s.seat) return
    const taken = [...this.ps.values()].flatMap(x => (x.seat ? [x.seat] : []))
    const at = spawn(atlas(this.seed), taken, Math.random)
    if (!at) return this.env.log.warn({ world: this.id }, 'world map full: no seat')
    this.commit(slot, { ...s, seat: at })
    if (!this.npc.has(slot.id)) this.record({ at: now, k: 'found', a: [s.name] })
  }

  private record(c: Chron) {
    this.chron = [...this.chron, c].slice(-CHRON_MAX)
    this.persist.worldDirty = true
    this.mapChanged()
    this.persist.schedule()
  }

  // Lần đầu nhận giới: 2 phân đà NPC mỗi vùng ngoài, thế lực = vùng % 5 (tên 5 tông môn đối địch của P1). Tạo đúng một lần:
  // trùng tên (đã tạo ở lần nhận trước mà chưa kịp ghi cờ) thì DB bỏ qua.
  async ensureNpcs() {
    if (this.npcsMade) return
    const a = atlas(this.seed),
      now = this.now()
    const taken = [...this.ps.values()].flatMap(x => (x.seat ? [x.seat] : []))
    const count = new Map<number, number>()
    const rows: { name: string; nameKey: string; state: State }[] = []
    for (const r of a.regions.filter(r => r.ring === 0))
      for (let k = 0; k < NPC_PER; k++) {
        const f = r.i % 5
        const n = (count.get(f) ?? 0) + 1
        count.set(f, n)
        const seat = spawn(a, taken, Math.random)
        if (!seat || regionOf(a, seat) === undefined) continue
        taken.push(seat)
        const name = `${vi.sects[f].name} · ${vi.npc.branch(n)}`
        rows.push({ name, nameKey: name.normalize('NFC').toLowerCase(), state: npcState(now, name, seat) })
      }
    const made = await store.createNpcs(this.env.db, this.id, rows)
    for (const r of made) this.adopt(r)
    this.npcsMade = true
    this.persist.worldDirty = true
    this.mapChanged()
    this.persist.schedule()
  }

  // NPC một lượt: giữ linh mạch trong vùng, chơi như người thường (bot), phản kích kẻ vừa cướp mình nếu chắc thắng
  private npcTurn(now: number) {
    for (const pid of this.npc) {
      const slot = this.slots.get(pid)
      if (!slot) continue
      try {
        const hold = npcHold(this.ps.get(pid)!, atlas(this.seed), this.shared)
        if (hold) this.npcAct(pid, hold, now)
        this.commit(slot, turn(advance(this.ps.get(pid)!, now), { casual: true }))
        const revenge = npcRevenge(this.ps.get(pid)!, this.ps, now)
        if (revenge) this.npcAct(pid, revenge, now)
      } catch (err) {
        this.env.log.error({ err, world: this.id, pid }, 'npc turn failed')
      }
    }
    this.armRaid()
  }
  private npcAct(pid: number, a: WorldAction, now: number) {
    const r = worldAct(this.ps, pid, a, now, seed(), this.map(now), this.shared)
    if (!r.ok) return
    if (r.world !== this.shared) this.share(r.world)
    this.commitAll(r.changed)
  }

  // Bản đồ đổi (chỗ ngồi, hành quân trên bản đồ, biên niên): đẩy ảnh chụp cho người đang xem, gộp 1 giây.
  // ponytail: gửi cả ảnh chụp (~20 KB cho 300 tông môn); chia theo ô khi giới vượt ~1k người.
  private mapChanged() {
    if (this.mapTimer || !this.watchers.size) return
    this.mapTimer = setTimeout(() => {
      this.mapTimer = null
      const now = this.now()
      for (const [sock, until] of this.watchers) if (until < now || !sock.connected) this.watchers.delete(sock)
      if (!this.watchers.size) return
      const snap = mapOf(this.ps, now, this.npc, this.chron, this.shared)
      const to = [...this.watchers.keys()]
      this.persist.deliver(() => {
        for (const sock of to) if (sock.connected) sock.emit('w', snap)
      }, true)
    }, 1_000)
  }

  // ---------- Kết nối ----------

  async attach(sock: Sock) {
    const pid = sock.data.pid
    if (!this.slots.has(pid)) {
      const row = await store.findPlayer(this.env.db, pid) // người vừa lập tông môn (API có thể ở node khác)
      if (!row || row.worldId !== this.id) return void sock.disconnect(true)
      if (!this.slots.has(pid) && !this.bad.has(pid)) this.adopt(row)
      if (!this.slots.has(pid)) return void sock.disconnect(true)
    }
    if (this.closing || this.lost || !sock.connected) return void sock.disconnect(true)
    const slot = this.slots.get(pid)!
    if (slot.conns.size >= MAX_TABS) this.drop(slot.conns.values().next().value!, 'replaced')
    // đưa state tới giờ hiện tại trước khi nhận kết nối mới: patch của bước này chỉ tới các tab cũ, tab mới nhận welcome
    const now = this.now()
    this.tick(now)
    this.commit(slot, advance(this.ps.get(pid)!, now))
    this.seat(slot, now)
    slot.conns.add(sock)
    slot.away++
    const today = dayOf(now)
    if (slot.day !== today) {
      slot.day = today
      this.event(pid, 'login', now, { hall: this.ps.get(pid)!.levels.chuDien })
    }
    const seen = slot.seen && now - slot.seen.time >= 60_000 ? slot.seen : undefined
    const state = view(this.ps.get(pid)!)
    const v = slot.v
    const at = this.ps.get(pid)!.seat
    this.persist.deliver(
      () =>
        sock.emit('welcome', {
          now,
          v,
          state,
          me: { pid, name: slot.name, world: this.id, x: at?.x ?? null, y: at?.y ?? null },
          world: this.info,
          seen,
          ro: this.readOnly,
          warp: this.env.warpAllowed,
        }),
      true,
    )
    this.wake(slot)
  }

  detach(sock: Sock) {
    const slot = this.slots.get(sock.data.pid)
    this.watchers.delete(sock)
    if (!slot || !slot.conns.delete(sock) || slot.conns.size) return
    this.tick(this.now()) // sự kiện giới (cướp, lật tuần) trước khi đưa state người này lên
    slot.gen++ // không còn ai xem: bỏ hẹn đẩy kết quả trận
    this.commit(slot, advance(this.ps.get(slot.id)!, this.now()))
    const s = this.ps.get(slot.id)!
    slot.seen = { time: s.time, res: s.res, levels: s.levels, tech: s.tech, stats: s.stats }
    this.persist.seenDirty.add(slot.id)
    this.persist.dirty.add(slot.id)
    this.remind(slot, s)
    this.persist.schedule()
  }

  // Rời game khi còn việc dài: hẹn nhắc qua Web Push lúc việc xong sớm nhất (game/notify.ts)
  private remind(slot: Slot, s: State) {
    if (!this.env.push || this.npc.has(slot.id)) return
    const next = nextRemind(s, this.now())
    if (!next) return
    this.wakes.push({ at: next.at, n: this.n++, pid: slot.id, gen: slot.gen, remind: { k: next.k, away: slot.away } })
    this.arm()
  }

  drop(sock: Sock, reason: Bye) {
    sock.emit('bye', { reason })
    this.detach(sock)
    sock.disconnect(true)
  }

  // ---------- Thao tác ----------

  intent(sock: Sock, a: Action | WorldAction, ack: (r: Ack) => void) {
    const slot = this.slots.get(sock.data.pid)
    if (!slot) return ack({ ok: false, err: 'moving' })
    if (this.closing || this.lost) return this.persist.deliver(() => ack({ ok: false, err: 'moving' }))
    if (this.readOnly) return this.persist.deliver(() => ack({ ok: false, err: 'unavailable' }))
    if (slot.broken) return this.persist.deliver(() => ack({ ok: false, err: 'maintenance' }))
    const now = this.now()
    this.tick(now)
    if ((WORLD_ACTIONS as readonly string[]).includes(a.type)) return this.social(slot, sock, a, now, ack)
    let r: ReturnType<typeof apply>
    try {
      r = apply({ ...this.ps.get(slot.id)!, seed: seed() }, a as Action, now) // khác luật giới: apply tự kiểm (parseAction)
      slot.errors = 0
    } catch (e) {
      // state bất biến: lỗi giữa chừng không làm hỏng gì, chỉ từ chối thao tác này
      r = { ok: false, error: 'bad' }
      this.env.log.error(
        { err: e, world: this.id, pid: slot.id, action: JSON.stringify(a).slice(0, 300) },
        'apply threw',
      )
      if (++slot.errors >= 5) slot.broken = true
    }
    intents.inc({ result: r.ok ? 'ok' : r.error })
    if (!r.ok) {
      const err = r.error
      return this.persist.deliver(() => ack({ ok: false, err }))
    }
    this.commit(slot, r.state, { sock, ack })
    if (a.type === 'trib') this.armRaid() // có chỗ trên bản đồ: kiếp vân tụ, giải lúc giáng như trận giới
  }

  // Thao tác chạm tới tông môn khác (đi cướp): luật giới, có thể đổi state của nhiều người trong một bước
  private social(slot: Slot, sock: Sock, raw: unknown, now: number, ack: (r: Ack) => void) {
    const a = parseWorldAction(raw)
    if (a && publicText(a).some(hasBad)) {
      intents.inc({ result: 'rude' })
      return this.persist.deliver(() => ack({ ok: false, err: 'rude' }))
    }
    let r: WorldResult
    try {
      if (!a) r = { ok: false, error: 'bad' }
      else if (!this.info.market && MARKET_ACTIONS.includes(a.type)) r = { ok: false, error: 'locked' }
      else r = worldAct(this.ps, slot.id, a, now, seed(), this.map(now), this.shared)
    } catch (e) {
      r = { ok: false, error: 'bad' }
      this.env.log.error({ err: e, world: this.id, pid: slot.id }, 'worldAct threw')
    }
    intents.inc({ result: r.ok ? 'ok' : r.error })
    if (!r.ok) {
      const err = r.error
      return this.persist.deliver(() => ack({ ok: false, err }))
    }
    if (r.world !== this.shared) this.share(r.world)
    const mine = r.changed.has(slot.id)
    for (const [pid, s] of r.changed) {
      const other = this.slots.get(pid)
      if (other) this.commit(other, s, pid === slot.id ? { sock, ack } : undefined)
    }
    if (!mine) this.persist.deliver(() => ack({ ok: true }), true) // chỉ đổi phần chung (tiên minh): ack sau khi ghi
    this.armRaid()
  }

  // Phần chung đổi: ghi cùng commit, báo người trong các minh bị ảnh hưởng (họ hỏi lại chi tiết)
  private share(next: Shared) {
    const prev = this.shared
    this.shared = next
    this.persist.worldDirty = true
    this.buffAt = 0 // linh mạch / người trong minh có thể đã đổi
    if (prev.spots !== next.spots) {
      this.mapChanged()
      const a = atlas(this.seed)
      for (const [k, sp] of Object.entries(next.spots)) {
        const p = a.points[Number(k)]
        if (p?.kind === 'boss' && sp.until && sp.until !== prev.spots[Number(k)]?.until)
          this.record({ at: this.now(), k: 'boss', a: [p.lv] })
      }
    }
    const touched = new Set<number>()
    for (const al of [...Object.values(prev.allies), ...Object.values(next.allies)])
      if (prev.allies[al.id] !== next.allies[al.id]) for (const pid of Object.keys(al.members)) touched.add(Number(pid))
    for (const pid of touched)
      for (const c of this.slots.get(pid)?.conns ?? []) this.persist.deliver(() => c.emit('ally'), true)
    this.persist.schedule()
  }

  // Truy vấn chỉ đọc: mỗi khoá một hàm, trả đúng kiểu Answer[k] (@rok/protocol)
  private readonly answers: { [K in Query['k']]: (sock: Sock, q: QueryOf<K>) => Answer[K] | Promise<Answer[K]> } = {
    rivals: (sock, q) => {
      const now = this.now()
      this.tick(now)
      return rivals(this.ps, sock.data.pid, now, Math.random, this.map(now), q.pid, this.shared)
    },
    chat: (sock, q) => {
      const key = this.channel(sock.data.pid, q.ch)
      return key ? this.chat.history(key) : []
    },
    allies: () => allyRows(this.shared, this.ps),
    ally: sock => allyInfo(this.shared, this.ps, sock.data.pid, p => !!this.slots.get(p)?.conns.size),
    market: (sock, q) => (this.info.market ? marketOf(this.ps, this.shared, sock.data.pid, this.now(), q.good) : null),
    season: sock => {
      const rows = seasonBoard(this.shared, this.ps, this.map(this.now()), this.now())
      const side = sideKey(this.shared, sock.data.pid),
        k = rows.findIndex(r => r.side === side)
      return {
        rows: rows.slice(0, SEASON_ROWS).map(({ name, pts }) => ({ name, pts })),
        me: k < 0 ? null : { rank: k + 1, pts: rows[k].pts },
        fame: this.fame,
      }
    },
    map: sock => {
      const now = this.now()
      this.watchers.set(sock, now + MAP_WATCH)
      return mapOf(this.ps, now, this.npc, this.chron, this.shared)
    },
    // chiến báo chưa kịp ghi DB (đang chờ / đang commit) cộng chiến báo đã ghi
    reports: async (sock, q) => {
      const pid = sock.data.pid
      const mem = [...(this.persist.inflight?.reports ?? []), ...this.persist.pending.reports]
        .filter(r => r.pid === pid && (q.before === undefined || r.id < q.before))
        .map(r => r.body as Report)
      const rows = (await store.playerReports(this.env.db, pid, q.before)) as Report[]
      const byId = new Map<number, Report>()
      for (const r of [...rows, ...mem]) byId.set(r.id, r)
      return [...byId.values()].sort((x, y) => y.id - x.id).slice(0, store.REPORTS_PAGE)
    },
  }
  async query<K extends Query['k']>(sock: Sock, q: QueryOf<K>, ack: (d: Answer[K]) => void) {
    const d = await this.answers[q.k](sock, q)
    this.persist.deliver(() => ack(d))
  }

  sync(sock: Sock, ack: (s: Snap) => void) {
    const slot = this.slots.get(sock.data.pid)
    if (!slot) return
    const snap = { v: slot.v, state: view(this.ps.get(slot.id)!) }
    this.persist.deliver(() => ack(snap), true)
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
    if (rep.length && !slot.conns.size) this.notify(slot, rep)
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
      this.mapChanged()
    this.persist.schedule()
  }

  // Offline mà bị cướp / kiếp vân vừa giáng: báo qua Web Push
  private notify(slot: Slot, rep: Report[]) {
    if (!this.env.push || this.npc.has(slot.id)) return
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

  // Hẹn giờ trận cướp kế tiếp (vé pid 0: tick giải mọi trận tới hạn bằng advanceWorld, vé cũ tự vô hại)
  private armRaid() {
    const at = nextRaid(this.ps)
    if (at === Infinity) return
    this.wakes.push({ at, n: this.n++, pid: 0, gen: 0 })
    this.arm()
  }

  // Hết mùa: phi thăng / luân hồi cho mọi người (rules/world.ts endSeason), bản đồ mới (seed mới), xếp chỗ lại, phân đà NPC làm lại,
  // giữ tiên minh. Làm trong actor như mọi việc khác và ghi trong một commit; client được mời nối lại để nhận bản đồ mới.
  private seasonEnd(now: number) {
    const season = this.info.season
    const r = endSeason(this.ps, this.shared, this.map(now), now, season, this.npc)
    this.fame = [
      { season, at: now, top: r.top.slice(0, 3).map(x => ({ name: x.name, pts: x.pts })) },
      ...this.fame,
    ].slice(0, 10)
    this.seed = randomInt(1, 2 ** 31)
    this.opened = now
    this.info = { ...this.info, season: season + 1, map: this.seed, opened: now }
    this.persist.seasonDirty = true
    this.share(r.world)
    this.chron = []
    const a = atlas(this.seed),
      taken: { x: number; y: number }[] = []
    for (const [pid, slot] of this.slots) {
      const s = r.changed.get(pid) ?? this.ps.get(pid)
      const seat = s && spawn(a, taken, Math.random)
      if (!s || !seat) continue
      taken.push(seat)
      this.commit(slot, this.npc.has(pid) ? npcState(now, slot.name, seat) : { ...s, seat })
    }
    this.record({ at: now, k: 'season', a: [season + 1] })
    this.env.log.info({ world: this.id, season: season + 1, top: this.fame[0].top }, 'season ended')
    this.persist.deliver(() => {
      for (const slot of this.slots.values())
        for (const c of slot.conns) {
          c.emit('bye', { reason: 'season' })
          c.disconnect(true)
        }
    }, true)
  }

  // Sự kiện của cả giới: lật tuần sự kiện, rồi mọi trận cướp đã tới nơi (một trận đổi state của cả hai bên)
  private worldStep(now: number) {
    if (dayIn(this.opened, now) >= SEASON_DAYS) this.seasonEnd(now)
    if (weekOf(now) > this.week) this.rollWeek(now)
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
  private commitAll(changed: Map<number, State>) {
    for (const [pid, s] of changed) {
      const slot = this.slots.get(pid)
      if (slot) this.commit(slot, s)
    }
  }

  // Hết tuần: top sự kiện của tuần cũ nhận quà qua thư (điểm vẫn còn trong state vì worldStep chạy trước mọi advance của tuần mới)
  private rollWeek(now: number) {
    const week = this.week
    eventTop(this.ps, week).forEach((pid, i) => {
      const gift = eventPrize(i)
      this.commit(
        this.slots.get(pid)!,
        mail(this.ps.get(pid)!, { at: now, k: 'eventTop', a: [i + 1, eventOf(week)], gift }),
      )
    })
    this.week = weekOf(now)
    this.persist.worldDirty = true
    this.persist.schedule()
  }

  // ---------- Chat ----------

  // Nạp tin gần đây + danh sách cấm chat lúc nhận giới
  async loadChat() {
    const [rows, m] = await Promise.all([store.recentChat(this.env.db, this.id), store.mutes(this.env.db, this.id)])
    this.chat.load(rows, m)
  }
  private channel(pid: number, ch: Channel) {
    const s = this.ps.get(pid)
    if (!s) return null
    if (ch === 'world') return s.levels.chuDien >= CHAT_HALL ? 'w' : null
    const al = allyOf(this.shared, pid)
    return al ? `a${al.id}` : null
  }
  // người nhận của một kênh: cả giới, hoặc người trong minh
  private listeners(key: string) {
    if (key === 'w') return [...this.slots.values()]
    const al = this.shared.allies[Number(key.slice(1))]
    return al ? Object.keys(al.members).flatMap(p => this.slots.get(Number(p)) ?? []) : []
  }

  say(sock: Sock, m: { ch: Channel; text: string }, ack: (r: { ok: true } | { ok: false; err: SayErr }) => void) {
    const pid = sock.data.pid
    const no = (err: SayErr) => this.persist.deliver(() => ack({ ok: false, err }))
    if (this.closing || this.lost || this.readOnly) return no('unavailable')
    const now = this.now()
    if (this.chat.isMuted(pid, now)) return no('muted')
    const room = this.channel(pid, m.ch)
    if (!room) return no('locked')
    const msg = this.chat.post(pid, this.ps.get(pid)!.name, room, m.text, now)
    if (typeof msg === 'string') return no(msg)
    this.persist.pending.chat.push({ ...msg, ch: room })
    const to = this.listeners(room)
    this.persist.deliver(() => {
      for (const slot of to) for (const c of slot.conns) if (c.connected) c.emit('chat', { ch: m.ch, ms: [msg] })
      ack({ ok: true })
    }, true)
    this.persist.schedule()
  }

  async report(sock: Sock, id: number) {
    const hit = this.chat.find(id)
    if (!hit || !this.listeners(hit.room).some(s => s.id === sock.data.pid)) return false
    await store.reportChat(this.env.db, {
      world: this.id,
      msgId: id,
      reporter: sock.data.pid,
      author: hit.msg.pid,
      text: hit.msg.text,
    })
    return true
  }

  // ---------- Hộp lệnh giữa các node (thư admin, bồi thường…): chủ giới đọc định kỳ, áp đúng một lần ----------

  async pollInbox() {
    if (this.polling || this.lost || this.readOnly || this.closing) return
    this.polling = true
    try {
      const rows = await store.openInbox(this.env.db, this.id)
      const now = this.now()
      this.tick(now)
      for (const r of rows) if (!this.applied.has(r.id)) this.command(r, now)
    } catch (e) {
      this.env.log.warn({ err: e, world: this.id }, 'inbox poll failed')
    } finally {
      this.polling = false
    }
  }

  private command(r: store.InboxRow, now: number) {
    this.applied.add(r.id)
    this.persist.pending.inboxDone.push(r.id) // cùng commit với thay đổi state: sập giữa chừng thì cả hai cùng chưa có, lần sau áp lại
    const b = r.body as { pid?: number; mail?: Omit<Extract<NewMail, { k: 'admin' }>, 'at'>; until?: number }
    if (r.kind === 'mute' && b.pid) {
      this.chat.mute(b.pid, b.until ?? 0, now)
    } else if (r.kind === 'mail' && b.mail) {
      for (const pid of b.pid ? [b.pid] : [...this.slots.keys()]) {
        const slot = this.slots.get(pid),
          s = this.ps.get(pid)
        if (slot && s) this.commit(slot, mail(s, { ...b.mail, at: now }))
      }
    } else if (r.kind === 'delete' && b.pid) this.remove(b.pid, now)
    else this.env.log.warn({ id: r.id, kind: r.kind }, 'unknown inbox command, skipped')
    this.persist.schedule()
  }

  // Xoá tài khoản (API đã chặn đăng nhập): rời tiên minh như tự rời (truyền minh chủ / giải tán), đá mọi kết nối, bỏ khỏi RAM.
  // Commit kèm theo xoá dòng tài khoản — dây chuyền: tông môn, chiến báo, mã chuyển máy, đăng ký push.
  private remove(pid: number, now: number) {
    const slot = this.slots.get(pid)
    if (!slot || this.npc.has(pid)) return
    if (allyOf(this.shared, pid)) {
      const r = worldAct(this.ps, pid, { type: 'allyLeave' }, now, 0, this.map(now), this.shared)
      if (r.ok) this.share(r.world)
    }
    for (const c of slot.conns) {
      c.emit('bye', { reason: 'deleted' })
      c.disconnect(true)
    }
    this.slots.delete(pid)
    this.ps.delete(pid)
    this.persist.dirty.delete(pid)
    this.persist.seenDirty.delete(pid)
    this.persist.pending.gone.push(pid)
    this.mapChanged()
  }

  // Xử lý mọi sự kiện đã tới hạn, theo thứ tự thời gian. Gọi trước mỗi thao tác: không ai thao tác trên state cũ hơn sự kiện.
  tick(now: number) {
    if (this.lost || this.readOnly) return
    this.worldStep(now)
    if (this.npc.size && now >= this.npcAt) {
      this.npcAt = now + NPC_EVERY
      this.npcTurn(now)
    }
    for (let ev = this.wakes.peek(); ev && ev.at <= now; ev = this.wakes.peek()) {
      this.wakes.pop()
      const slot = this.slots.get(ev.pid)
      if (slot && ev.remind) {
        const k = ev.remind.k
        if (slot.away === ev.remind.away && !slot.conns.size) this.env.push?.(slot.id, remindNote(k))
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
    this.arm()
  }

  // ---------- Gửi ----------

  broadcast<E extends 'status' | 'clock'>(event: E, payload: Parameters<ServerToClient[E]>[0]) {
    for (const s of this.slots.values())
      for (const c of s.conns) this.persist.deliver(() => (c.emit as (e: E, p: typeof payload) => void)(event, payload))
  }

  // Lô ghi của một commit (Committer gọi): người chơi đã đổi (bỏ người vừa xoá tài khoản), phần chung / cột mùa nếu đổi
  private batch(ids: number[], seen: Set<number>, world: boolean, season: boolean) {
    const players = ids
      .filter(id => this.ps.has(id))
      .map(id => {
        const s = this.ps.get(id)!
        const slot = this.slots.get(id)!
        return {
          id,
          state: s,
          name: slot.name,
          power: Math.round(power(s)),
          hall: s.levels.chuDien,
          tower: s.tower,
          rebirths: s.rebirths,
          pvp: s.pvp.pts,
          weekNo: s.ev.week,
          weekPts: s.ev.pts,
          ...(seen.has(id) && slot.seen ? { seen: slot.seen } : {}),
        }
      })
    return {
      world: this.id,
      epoch: this.epoch,
      node: this.env.node,
      online: this.online,
      sync: this.env.sync,
      players,
      state: world
        ? { week: this.week, npcs: this.npcsMade, chron: this.chron, world: this.shared, fame: this.fame }
        : undefined,
      season: season ? { seed: this.seed, season: this.info.season, opensAt: new Date(this.opened) } : undefined,
    }
  }

  // Gia hạn lease định kỳ (không có thay đổi vẫn phải báo "còn sống"). Quá LEASE.readOnly không gia hạn được: tự rào, chỉ đọc.
  heartbeat() {
    if (this.lost) return
    const idle = performance.now() - this.renewedAt
    if (idle > store.LEASE.readOnly && !this.readOnly) {
      this.readOnly = true
      this.env.log.warn({ world: this.id }, 'world read-only: lease not renewed')
      this.broadcast('status', { ro: true })
    }
    if (idle > store.LEASE.renew) void this.persist.flush(true)
    void this.pollInbox() // kèm lật tuần sự kiện đúng giờ dù không ai đang chơi (pollInbox gọi tick)
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
    if (this.mapTimer) clearTimeout(this.mapTimer)
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    this.persist.stop()
  }

  // Deploy / tắt node: commit lần cuối, nhả lease, báo client nối lại (tới node khác nhận giới)
  async close() {
    this.closing = true
    for (let i = 0; i < 100 && !this.lost && this.persist.busy; i++) {
      if (this.persist.committing) await new Promise(r => setTimeout(r, 20))
      else await this.persist.flush(true)
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
