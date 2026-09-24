// Phần thuần của lớp mạng (không I/O, có unit test ở apps/client/net.test.ts)
import { apply, type Action, type Report, type State } from '@rok/rules'
import type { Ack, View } from '@rok/protocol'

export type Pending = { a: Action; at: number; predicted: boolean; done?: (r: Ack) => void }

// State cho giao diện: state đã xác nhận + kho chiến báo riêng (chiến báo không đi trong patch)
export const withReports = (v: View, reports: Report[]): State => ({ ...v, reports })

// Gập các thao tác đang chờ lên state đã xác nhận: mỗi thao tác áp tại lúc người chơi bấm (server áp muộn hơn một nhịp
// mạng — chênh vài tài nguyên thì bản của server thắng khi ack về). Thao tác nay không còn hợp lệ thì bỏ qua (server sẽ từ chối).
export function fold(confirmed: State, pending: readonly Pending[]) {
  let s = confirmed
  for (const p of pending) {
    if (!p.predicted) continue
    const r = apply(s, p.a, p.at)
    if (r.ok) s = r.state
  }
  return s
}

// Mẫu ping có vòng đi-về ngắn nhất là mẫu đáng tin nhất cho độ lệch đồng hồ
export const offsetOf = (samples: readonly { rtt: number; off: number }[]) => samples.reduce((a, b) => (b.rtt < a.rtt ? b : a)).off
