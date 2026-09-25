// Đội hành quân trên bản đồ giới: vị trí lúc now theo đường đi (ô), đi rồi về theo đường ngược
import type { MapMarch, Pos } from '@rok/rules/world'

// Điểm trên đường theo quãng k (0..1), chia theo độ dài
function along(path: Pos[], k: number): Pos {
  const seg = path.slice(1).map((p, i) => Math.hypot(p.x - path[i].x, p.y - path[i].y))
  let left = Math.max(0, Math.min(1, k)) * seg.reduce((a, b) => a + b, 0)
  for (let i = 0; i < seg.length; i++) {
    if (left <= seg[i] || i === seg.length - 1) {
      const u = seg[i] ? Math.min(1, left / seg[i]) : 0
      return { x: path[i].x + (path[i + 1].x - path[i].x) * u, y: path[i].y + (path[i + 1].y - path[i].y) * u }
    }
    left -= seg[i]
  }
  return path[0]
}
// Vị trí đội lúc now: đi (startAt → arriveAt), về theo đường ngược (arriveAt → returnAt); chưa hẹn giờ về thì ở đích
export function marchAt(m: MapMarch, now: number): Pos {
  if (now < m.arriveAt) return along(m.path, (now - m.startAt) / Math.max(1, m.arriveAt - m.startAt))
  if (!m.returnAt) return m.path[m.path.length - 1]
  return along(m.path, 1 - (now - m.arriveAt) / Math.max(1, m.returnAt - m.arriveAt))
}
