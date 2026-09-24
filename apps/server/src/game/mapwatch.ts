// Người đang mở bản đồ giới: bản đồ đổi (chỗ ngồi, hành quân trên bản đồ, biên niên) thì đẩy ảnh chụp mới, gộp 1 giây.
// Ai không hỏi lại bản đồ trong MAP_WATCH thì thôi gửi.
// ponytail: gửi cả ảnh chụp (~20 KB cho 300 tông môn); chia theo ô khi giới vượt ~1k người.
import type { ServerToClient } from '@rok/protocol'
import type { Sock } from './world.ts'

const MAP_WATCH = 60_000
type MapSnap = Parameters<ServerToClient['w']>[0]

export class MapWatch {
  private readonly watchers = new Map<Sock, number>() // → hết hạn
  private timer: NodeJS.Timeout | null = null
  private readonly clock: () => number
  private readonly snapshot: (now: number) => MapSnap
  private readonly deliver: (send: () => void) => void

  // deliver: gửi qua outbox của actor (sau commit đang chờ)
  constructor(clock: () => number, snapshot: (now: number) => MapSnap, deliver: (send: () => void) => void) {
    this.clock = clock
    this.snapshot = snapshot
    this.deliver = deliver
  }

  watch(sock: Sock, now: number) {
    this.watchers.set(sock, now + MAP_WATCH)
  }
  forget(sock: Sock) {
    this.watchers.delete(sock)
  }

  changed() {
    if (this.timer || !this.watchers.size) return
    this.timer = setTimeout(() => {
      this.timer = null
      const now = this.clock()
      for (const [sock, until] of this.watchers) if (until < now || !sock.connected) this.watchers.delete(sock)
      if (!this.watchers.size) return
      const snap = this.snapshot(now)
      const to = [...this.watchers.keys()]
      this.deliver(() => {
        for (const sock of to) if (sock.connected) sock.emit('w', snap)
      })
    }, 1_000)
  }

  stop() {
    if (this.timer) clearTimeout(this.timer)
  }
}
