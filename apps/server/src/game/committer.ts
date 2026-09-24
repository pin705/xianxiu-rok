// Ghi gộp (write-behind) của một giới: state đổi → dirty → commit gộp sau commitMs trong một transaction có fencing.
// Mọi thứ phản ánh state chưa ghi (ack, patch cho tab khác, welcome…) nằm trong outbox, chỉ gửi sau khi commit chứa nó
// xong: đã ack là đã ghi. Ghi lỗi: giữ lại hết, thử lại (lùi dần tới 5 giây) với state MỚI NHẤT của người chơi.
import * as store from '../db/store.ts'
import { commitErrors, commitSeconds } from '../lib/metrics.ts'

export type Pending = {
  reports: store.Batch['reports']
  events: store.Batch['events']
  inboxDone: number[]
  chat: store.ChatRow[]
  gone: number[]
}
const empty = (): Pending => ({ reports: [], events: [], inboxDone: [], chat: [], gone: [] })

export type Hooks = {
  commitMs: number
  lost(): boolean
  // Phần còn lại của lô ghi: người chơi trong ids (seen: kèm lát lúc rời game), phần chung / cột mùa nếu cờ bật
  batch(ids: number[], seen: Set<number>, world: boolean, season: boolean): Omit<store.Batch, keyof Pending>
  write(b: store.Batch): Promise<void>
  written(): void // ghi xong: lease vừa được gia hạn
  fenced(): void // node khác đã nhận giới
  warn(err: unknown, msg: string): void
}

export class Committer {
  readonly dirty = new Set<number>() // người chơi có state chưa ghi
  readonly seenDirty = new Set<number>() // … có lát "lúc rời game" chưa ghi
  worldDirty = false // phần chung của giới
  seasonDirty = false // hết mùa: seed, số mùa, lúc mở — cột của worlds
  pending: Pending = empty()
  inflight: Pending | null = null // lô đang ghi (truy vấn chiến báo đọc cả phần này)
  outbox: (() => void)[] = []
  committing = false
  private timer: NodeJS.Timeout | null = null
  private retries = 0

  private readonly h: Hooks
  constructor(h: Hooks) {
    this.h = h
  }

  // Còn gì chưa ghi / chưa gửi (đóng giới: chờ hết mới nhả lease)
  get busy() {
    return this.committing || this.dirty.size > 0 || this.outbox.length > 0 || this.pending.events.length > 0
  }

  // durable: phản ánh state chưa ghi → chờ commit. Cái khác (lỗi, truy vấn) đi ngay — trừ khi còn gói trước đang chờ (giữ thứ tự).
  deliver(send: () => void, durable = false) {
    if (this.outbox.length || (durable && (this.dirty.size || this.committing))) {
      this.outbox.push(send)
      this.schedule()
    } else send()
  }

  schedule(delay = this.h.commitMs) {
    if (this.timer || this.committing || this.h.lost()) return
    this.timer = setTimeout(() => {
      this.timer = null
      void this.flush()
    }, delay)
  }

  // renew: ghi dù không có gì đổi (heartbeat gia hạn lease)
  async flush(renew = false) {
    if (this.committing || this.h.lost()) return
    const p = this.pending
    if (
      !renew &&
      !this.dirty.size &&
      !this.outbox.length &&
      !p.events.length &&
      !p.inboxDone.length &&
      !p.chat.length &&
      !p.gone.length &&
      !this.worldDirty
    )
      return
    this.stop()
    const ids = [...this.dirty]
    const seenIds = new Set(this.seenDirty)
    const rest = this.h.batch(ids, seenIds, this.worldDirty, this.seasonDirty)
    this.dirty.clear()
    this.seenDirty.clear()
    this.pending = empty()
    const outbox = this.outbox
    this.outbox = []
    this.seasonDirty = false
    this.worldDirty = false
    this.committing = true
    this.inflight = p
    const stop = commitSeconds.startTimer()
    try {
      await this.h.write({ ...rest, ...p })
      stop()
      this.retries = 0
      this.h.written()
      for (const send of outbox) send()
    } catch (e) {
      if (e instanceof store.Fenced) return this.h.fenced()
      commitErrors.inc()
      this.h.warn(e, 'commit failed, retrying')
      for (const id of ids) this.dirty.add(id) // lần sau ghi state MỚI NHẤT của họ
      if (rest.state) this.worldDirty = true
      if (rest.season) this.seasonDirty = true
      for (const id of seenIds) this.seenDirty.add(id)
      this.pending = {
        reports: [...p.reports, ...this.pending.reports],
        events: [...p.events, ...this.pending.events],
        inboxDone: [...p.inboxDone, ...this.pending.inboxDone],
        chat: [...p.chat, ...this.pending.chat],
        gone: [...p.gone, ...this.pending.gone],
      }
      this.outbox = [...outbox, ...this.outbox]
      this.retries++
    } finally {
      this.committing = false
      this.inflight = null
    }
    if (this.h.lost()) return
    if (this.retries) this.schedule(Math.min(5000, 100 * 2 ** this.retries))
    else if (this.dirty.size) this.schedule()
    else if (this.outbox.length) {
      // xếp hàng trong lúc commit mà không kèm thay đổi mới: phần chúng phản ánh đã ghi xong
      const o = this.outbox
      this.outbox = []
      for (const send of o) send()
    }
  }

  stop() {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }
}
