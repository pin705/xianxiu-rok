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
