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
  tex?: boolean // texture (Pixi hoặc vẽ lên canvas): phải có ảnh trong tay trước khi dùng (img)
  pack?: string // gói theo cảnh (tools/art pipeline.PACKS) — nạp cùng nhau qua artPack; không có: trình duyệt tự tải khi cần
  page?: string // trang atlas chứa ảnh này; frame = [x, y, rộng, cao] trên trang (px ảnh)
  frame?: readonly [number, number, number, number]
  // bản HD (màn to độ nét cao, xem main.ts): trang atlas HD + khung, hoặc file lẻ khi quá khổ
  hd?: { page?: string; frame?: readonly [number, number, number, number]; src?: string }
  img?: HTMLImageElement // ảnh đã tải (trang atlas nếu có)
}
export type ArtManifest = Record<string, ArtEntry>

let art: ArtManifest = {}
export const setArt = (m: ArtManifest) => void (art = m)
export const artOf = (key: string): ArtEntry | undefined => art[key]

// Nạp theo gói như bundle của Godot/LayaAir: game chỉ đợi gói 'boot' (da, hình chạm huy hiệu) rồi hiện; cảnh nào đợi gói
// của cảnh đó (mountScene), gói còn lại tải nền. Texture một gói nằm chung vài trang atlas → ít lượt tải, Pixi gộp lượt vẽ.
// Chờ onload chứ không chờ decode(): tab nền thì Chrome hoãn decode — game không bao giờ mount (trang trắng).
const images = new Map<string, Promise<HTMLImageElement | undefined>>()
const packs = new Map<string, Promise<void>>()
const tally = { done: 0, total: 0 }
const counted = new Set<string>() // ảnh đã tính vào tổng (artAll tính trước cả những gói chưa tới lượt: vạch không báo xong giữa hai gói)
const listeners = new Set<(done: number, total: number) => void>()
const count = (src: string) => void (!counted.has(src) && counted.add(src) && tally.total++)
function image(src: string) {
  let p = images.get(src)
  if (!p) {
    count(src)
    p = new Promise(ok => {
      const img = new Image()
      const end = (v?: HTMLImageElement) => {
        tally.done++
        for (const f of listeners) f(tally.done, tally.total)
        ok(v)
      }
      img.onload = () => end(img)
      img.onerror = () => {
        console.warn('art: không mở được', src)
        end()
      }
      img.src = src
    })
    images.set(src, p)
  }
  return p
}
export function artPack(name: string): Promise<void> {
  let p = packs.get(name)
  if (!p) {
    const list = Object.entries(art).filter(([, e]) => e.pack === name)
    p = Promise.all(
      list.map(async ([k, e]) => {
        const img = await image(e.page ?? e.src)
        if (img) e.img = img
        else delete art[k] // không mở được: vẽ bằng code
      }),
    ).then(() => {})
    packs.set(name, p)
  }
  return p
}
export const artPacks = () => [...new Set(Object.values(art).flatMap(e => (e.pack ? [e.pack] : [])))]
// Tải hết mọi gói (như gói .pck của Godot bản web): màn tiêu đề đợi cái này rồi mới vào game, sau đó không cảnh nào phải đợi.
// Lần lượt theo thứ tự `first` (cảnh vào đầu tiên trước); gọi nhiều lần vẫn một lượt tải. Service worker giữ tranh qua các bản
// build (tên có mã nội dung ?v=) nên lần mở sau gần như không tải gì.
let all: Promise<void> | undefined
export function artAll(first: readonly string[] = []) {
  if (!all) {
    for (const e of Object.values(art)) if (e.pack) count(e.page ?? e.src)
    for (const f of listeners) f(tally.done, tally.total)
    all = (async () => {
      for (const p of new Set([...first, ...artPacks()])) await artPack(p)
    })()
  }
  return all
}
// tiến độ tải tranh (màn tiêu đề): ảnh đã về / tổng số ảnh đã xếp hàng
export function onArtProgress(f: (done: number, total: number) => void) {
  listeners.add(f)
  f(tally.done, tally.total)
  return () => void listeners.delete(f)
}

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
