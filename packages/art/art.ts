// Tranh vẽ tay thay cho hình vẽ bằng code. Manifest ánh xạ key nướng ('icon:tuKhi', 'bld:chuDien:3:0', 'skin:btn', …)
// → file ảnh: có tranh thì dùng tranh, chưa có thì vẽ bằng code như cũ — thay dần từng món, không phải sửa màn nào.
// Tranh phải vẽ khít hộp của asset cùng key (tỉ lệ w:h, gốc neo) — danh sách key + cỡ: xem artKeys().

export type ArtEntry = {
  src: string // URL ảnh (tương đối với trang)
  slice?: readonly [number, number, number, number] // skin 9 mảnh: trên, phải, dưới, trái (px ảnh)
  width?: readonly [number, number, number, number] // bề dày viền hiển thị (px CSS); mặc định slice / 2 (ảnh 2x)
  outset?: number // phần tràn ra ngoài hộp (px CSS)
  repeat?: 'stretch' | 'round'
  fill?: boolean // lòng skin có vẽ (mặc định có)
  tex?: boolean // texture cảnh (Pixi): bộ nạp giải mã sẵn trước khi vào game; còn lại (icon, chân dung, da) trình duyệt tự tải khi cần
  img?: HTMLImageElement // ảnh đã giải mã sẵn (bộ nạp của client) — texture Pixi cần ảnh có ngay, không chờ
}
export type ArtManifest = Record<string, ArtEntry>

let art: ArtManifest = {}
export const setArt = (m: ArtManifest) => void (art = m)
export const artOf = (key: string): ArtEntry | undefined => art[key]

// Bản dev: ghi lại mọi key được nướng cùng cỡ yêu cầu — danh sách asset cần vẽ cho hoạ sĩ (docs/ART_SPEC.md)
type Seen = { kind: 'dom' | 'tex' | 'skin'; w: number; h: number; px: number; slice?: readonly number[] }
const seen = new Map<string, Seen>()
export function noteArt(key: string, s: Seen) {
  const old = seen.get(key)
  if (!old || s.px > old.px) seen.set(key, s)
}
export const artKeys = () => Object.fromEntries(seen)

// ?art=0: tắt tranh (chụp so trước/sau) và mở kho hình vẽ bằng code cho tools/art/export.ts đọc qua globalThis.__art
// (texture cảnh, canvas da giao diện, key đã nướng) — nguồn để vẽ đè giữ nguyên hình. Chỉ giữ tham chiếu, không tốn gì thêm.
export const artOff = () => typeof location !== 'undefined' && new URLSearchParams(location.search).get('art') === '0'
export const dump: { painted?: unknown; skins: Record<string, unknown>; keys: typeof artKeys } = { skins: {}, keys: artKeys }
if (artOff()) Object.assign(globalThis, { __art: dump })
