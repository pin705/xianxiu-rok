// Hẹn giờ của actor: vé xếp theo giờ trong heap, một setTimeout cho vé sớm nhất (tối đa 1 giờ, dậy rồi hẹn tiếp).
import type { JobKind } from '@rok/rules'
import { Heap } from './heap.ts'

// pid 0: vé giải trận giới (advanceWorld). remind: nhắc qua Web Push lúc việc dài xong (người chơi đang offline);
// không có remind thì là vé đẩy kết quả trận cho người đang xem. Vé có gen cũ hơn slot thì bỏ.
export type Wake = { at: number; n: number; pid: number; gen: number; remind?: { k: JobKind | 'march'; away: number } }

export class Alarm {
  private readonly wakes = new Heap<Wake>()
  private n = 0
  private timer: NodeJS.Timeout | null = null
  private timerAt = Infinity
  private readonly clock: () => number
  private readonly ring: () => void

  // ring: gọi khi vé sớm nhất tới hạn (actor xử lý mọi vé đã tới hạn bằng due)
  constructor(clock: () => number, ring: () => void) {
    this.clock = clock
    this.ring = ring
  }

  add(w: Omit<Wake, 'n'>) {
    this.wakes.push({ ...w, n: this.n++ })
    this.arm()
  }

  // Lấy lần lượt các vé đã tới hạn lúc now, sớm nhất trước (vé thêm vào giữa chừng cũng được lấy nếu đã tới hạn)
  *due(now: number) {
    for (let ev = this.wakes.peek(); ev && ev.at <= now; ev = this.wakes.peek()) {
      this.wakes.pop()
      yield ev
    }
  }

  arm() {
    const top = this.wakes.peek()
    if (!top || top.at >= this.timerAt) return
    if (this.timer) clearTimeout(this.timer)
    this.timerAt = top.at
    this.timer = setTimeout(
      () => {
        this.timer = null
        this.timerAt = Infinity
        this.ring()
      },
      Math.min(3_600_000, Math.max(0, top.at - this.clock())),
    )
  }

  stop() {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }
}
