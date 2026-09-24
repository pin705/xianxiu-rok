// Giao kèo client ↔ server (Socket.IO). Chỉ có kiểu + hai hàm thuần view/diff — không phụ thuộc thư viện nào,
// client chỉ import type (bundle không phình). Server kiểm dữ liệu vào bằng Zod (apps/server/src/realtime/schemas.ts).
// Hai bất biến:
//   1. mầm ngẫu nhiên (seed) không bao giờ rời server — mọi seed gửi đi đều là 0 (rules: mầm 0 = ẩn, không tự giải trận)
//   2. chiến báo (reports) không nằm trong state gửi đi — đi riêng qua `rep` và truy vấn `reports` (state nhỏ, patch nhỏ)
import type { Action, Err, March, Report, State } from '@rok/rules'
import type { Rival, WorldAction } from '@rok/rules/world'

export type View = Omit<State, 'reports'>
export type Patch = Partial<View>

const hide = (m: March): March => (m.seed ? { ...m, seed: 0 } : m)

// State như client được thấy: bỏ chiến báo, xoá mọi mầm
export function view(s: State): View {
  const { reports: _, ...rest } = s
  return { ...rest, seed: 0, marches: s.marches.map(hide) }
}

// Khoá tầng trên có tham chiếu đổi (state bất biến: phần không đổi giữ nguyên tham chiếu). Client gộp { ...view, ...patch }.
// `seed` bỏ hẳn (bên client luôn là 0), `reports` đi luồng riêng.
export function diff(prev: State, next: State): Patch {
  const p: Record<string, unknown> = {}
  for (const k in next) {
    if (k === 'reports' || k === 'seed') continue
    const b = next[k as keyof State]
    if (prev[k as keyof State] !== b) p[k] = k === 'marches' ? (b as March[]).map(hide) : b
  }
  return p as Patch
}
export const merge = (v: View, p: Patch): View => ({ ...v, ...p })

// ---------- Sự kiện ----------

// Bắt tay (socket.io `auth`): token phiên (khác origin; cùng origin thì cookie HttpOnly), mã giao thức, bản build, ngôn ngữ
export type Handshake = { token?: string; protocol: string; build: string; lang: string }
// Từ chối bắt tay: connect_error với data này. moved: giới đang ở node khác → nối tới `path`
export type Refuse = { reason: 'protocol' | 'auth' | 'banned' | 'deleted' | 'moved' | 'unavailable'; path?: string }

export type Me = { pid: number; name: string; world: number; x: number | null; y: number | null }
export type WorldInfo = { id: number; name: string; season: number }
// Lát state lúc rời game (server lưu khi kết nối cuối đóng): màn Xuất quan so với state lúc quay lại
export type Seen = Pick<State, 'time' | 'res' | 'levels' | 'tech' | 'stats'>
export type Welcome = { now: number; v: number; state: View; me: Me; world: WorldInfo; seen?: Seen; ro: boolean; warp: boolean }

export type ServerErr = 'rate' | 'unavailable' | 'moving' | 'maintenance'
// Trả lời một thao tác (ack của socket.io, gửi SAU khi đã ghi DB): có v/p nếu state đổi; rep = chiến báo mới
export type Ack = { ok: true; v?: number; p?: Patch; rep?: Report[] } | { ok: false; err: Err | ServerErr }
export type Push = { v: number; p: Patch; rep?: Report[] } // state đổi do server (trận tới nơi…) hoặc do tab khác của cùng người
export type Snap = { v: number; state: View }
// reports: chiến báo cũ hơn `before` · rivals: đối thủ để cướp (kẻ thù trước) → Rival[]
export type Query = { k: 'reports'; before?: number } | { k: 'rivals' }
export type { Rival }
export type Bye = 'moved' | 'restart' | 'replaced' | 'rate' | 'banned' | 'deleted'

export interface ServerToClient {
  welcome(w: Welcome): void
  s(m: Push): void
  status(m: { ro: boolean }): void
  clock(m: { now: number }): void
  bye(m: { reason: Bye; path?: string }): void
}
export interface ClientToServer {
  act(a: Action | WorldAction, ack: (r: Ack) => void): void
  get(q: Query, ack: (r: unknown) => void): void
  sync(ack: (s: Snap) => void): void
  time(ack: (now: number) => void): void
}
