// Khởi động giao diện: bơm màu khoáng và da giao diện vẽ tay (từ @rok/art) thành biến CSS, chờ font.
// Gọi một lần trước khi mount App — không có nhấp nháy font, không có khung trống.
// Da 9 mảnh (--sk-*) là giá trị border-image đủ bộ: component chỉ cần `border: 0 solid; border-image: var(--sk-…)`.
// Vẽ da tốn công (bút lông trên canvas + mã hoá PNG) nên bản chạy thật cất ảnh vào cache của bản build
// (cùng cache với service worker: bản mới thì vẽ lại, bản cũ tự dọn) — lần mở sau chỉ đọc lại.
import {
  PIGMENT,
  artOf,
  noteArt,
  type ArtEntry,
  badgeSkin,
  brushBar,
  buttonSkin,
  capsuleSkin,
  cardSkin,
  discSkin,
  dotsSkin,
  fieldSkin,
  fillSkin,
  grooveSkin,
  inkBlot,
  knobSkin,
  paper,
  plateSkin,
  rodSkin,
  scrollSkin,
  slipSkin,
  stripSkin,
  switchSkin,
  tagSkin,
  toastSkin,
  trackSkin,
  type Skin,
} from '@rok/art'

type Canvas = HTMLCanvasElement | OffscreenCanvas
const kebab = (k: string) => k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)
// Độ nét khi vẽ da: theo màn hình (tối thiểu 2 để màn thường vẫn sắc, tối đa 3)
const S = Math.min(3, Math.max(2, Math.ceil(globalThis.devicePixelRatio || 1)))

const encode = (cv: Canvas): Promise<Blob> =>
  'convertToBlob' in cv ? cv.convertToBlob() : new Promise(r => cv.toBlob(b => r(b!)))
const store =
  import.meta.env.PROD && 'caches' in globalThis
    ? caches.open(`rok-${__BUILD__}`).catch(() => null)
    : Promise.resolve(null)

// Một ảnh: đọc từ cache nếu đã vẽ ở bản build này, không thì vẽ + mã hoá (PNG, ngoài luồng chính) rồi cất.
// nine: kèm thông số 9 mảnh (cất trong header để lần sau khỏi vẽ lại chỉ để biết slice).
async function image(
  name: string,
  draw: () => Skin | Canvas,
): Promise<{ url: string; skin?: Omit<Skin, 'cv'>; art?: ArtEntry }> {
  // tranh vẽ tay (art.ts) thay cho da vẽ bằng code
  const art = artOf(`skin:${name}`)
  if (art) return { url: `url(${art.src})`, art }
  const c = await store
  const req = `./__skin/${name}@${S}.png`
  const hit = await c?.match(req).catch(() => undefined)
  if (hit) {
    const meta = hit.headers.get('x-skin')
    return { url: `url(${URL.createObjectURL(await hit.blob())})`, skin: meta ? JSON.parse(meta) : undefined }
  }
  const drawn = draw()
  const skin = 'cv' in drawn ? drawn : undefined
  const cv = skin ? skin.cv : (drawn as Canvas)
  noteArt(`skin:${name}`, {
    kind: 'skin',
    w: skin?.w ?? cv.width / S,
    h: skin?.h ?? cv.height / S,
    px: S,
    slice: skin?.slice,
  })
  const blob = await encode(cv)
  const meta = skin && { w: skin.w, h: skin.h, slice: skin.slice, outset: skin.outset, repeat: skin.repeat }
  c?.put(
    req,
    new Response(blob, { headers: { 'content-type': 'image/png', ...(meta && { 'x-skin': JSON.stringify(meta) }) } }),
  ).catch(() => {})
  return { url: `url(${URL.createObjectURL(blob)})`, skin: meta }
}
const img = async (name: string, draw: () => Skin | Canvas) => (await image(name, draw)).url
// 9 mảnh: ảnh, slice (px thật), bề dày (px CSS), phần tràn, giãn/lặp. Lòng được lấp (fill) trừ khi fill = false.
const nine = async (name: string, draw: () => Skin, fill = true) => {
  const { url, skin, art } = await image(name, draw)
  if (art?.slice) {
    const [t, r, b, l] = art.slice
    const [wt, wr, wb, wl] = art.width ?? art.slice.map(v => v / 2)
    return `${url} ${t} ${r} ${b} ${l}${(art.fill ?? fill) ? ' fill' : ''} / ${wt}px ${wr}px ${wb}px ${wl}px / ${art.outset ?? 0}px ${art.repeat ?? 'stretch'}`
  }
  const [t, r, b, l] = skin!.slice
  return `${url} ${t * S} ${r * S} ${b * S} ${l * S}${fill ? ' fill' : ''} / ${t}px ${r}px ${b}px ${l}px / ${skin!.outset ?? 0}px ${skin!.repeat ?? 'stretch'}`
}

export async function applyTheme() {
  const root = document.documentElement.style
  for (const [k, v] of Object.entries(PIGMENT)) root.setProperty(`--${kebab(k)}`, v)
  const P = PIGMENT
  const vars: Record<string, Promise<string>> = {
    '--paper-tex': img('paper', () => paper(256)),
    '--stroke-ink': img('stroke', () => brushBar(320, 28)),
    '--stroke-gold': img('stroke-gold', () => brushBar(320, 28, P.gold, 13)),
    '--stroke-red': img('stroke-red', () => brushBar(320, 28, P.cinnabar, 15)),
    '--blot-mask': img('blot', () => inkBlot(256)),
    // khung cuộn tranh (chỉ khung, lòng là nền giấy ghép), thẻ, ván
    '--sk-scroll': nine('scroll', () => scrollSkin(S), false),
    '--sk-rod': nine('rod', () => rodSkin(S)),
    '--sk-card': nine('card', () => cardSkin(S, 'paper')),
    '--sk-card-plain': nine('card-plain', () => cardSkin(S, 'plain', 5)),
    '--sk-card-glow': nine('card-glow', () => cardSkin(S, 'glow', 7)),
    '--sk-card-sel': nine('card-sel', () => cardSkin(S, 'selected', 9)),
    // khung sáng của hub: dải giấy bồi lụa (thanh trên, tab, cột trái), thẻ lụa, nhãn lụa, viên giấy, thẻ tên, thông báo
    '--sk-strip': nine('strip', () => stripSkin(S), false),
    '--sk-card-silk': nine('card-silk', () => cardSkin(S, 'silk', 13)),
    '--sk-tag-silk': nine('tag-silk', () => tagSkin(S, 'silk', 17)),
    '--sk-capsule': nine('capsule', () => capsuleSkin(S)),
    '--sk-plate': nine('plate', () => plateSkin(S)),
    '--sk-slip': nine('slip', () => slipSkin(S)),
    '--sk-slip-bad': nine('slip-bad', () => slipSkin(S, true, 49)),
    // nút, nhãn, huy hiệu số
    '--sk-btn': nine('btn', () => buttonSkin(S, 'primary')),
    '--sk-btn-gold': nine('btn-gold', () => buttonSkin(S, 'gold', 9)),
    '--sk-btn-danger': nine('btn-danger', () => buttonSkin(S, 'danger', 11)),
    '--sk-btn-ghost': nine('btn-ghost', () => buttonSkin(S, 'ghost', 13)),
    '--sk-btn-off': nine('btn-off', () => buttonSkin(S, 'off', 15)),
    '--sk-tag': nine('tag', () => tagSkin(S, 'plain')),
    '--sk-tag-good': nine('tag-good', () => tagSkin(S, 'good', 12)),
    '--sk-tag-bad': nine('tag-bad', () => tagSkin(S, 'bad', 13)),
    '--sk-tag-gold': nine('tag-gold', () => tagSkin(S, 'gold', 14)),
    '--sk-tag-dark': nine('tag-dark', () => tagSkin(S, 'dark', 15)),
    '--sk-tag-red': nine('tag-red', () => tagSkin(S, 'red', 16)),
    '--sk-badge': nine('badge', () => badgeSkin(S)),
    '--sk-badge-fresh': nine('badge-fresh', () => badgeSkin(S, true, 14)),
    // thanh tiến độ, ô nhập, rãnh thẻ, bảng tối nhỏ, thông báo
    '--sk-track': nine('track', () => trackSkin(S)),
    '--sk-fill': nine('fill', () => fillSkin(S, P.spirit)),
    '--sk-fill-gold': nine('fill-gold', () => fillSkin(S, P.gold, 18)),
    '--sk-fill-good': nine('fill-good', () => fillSkin(S, P.malachite, 19)),
    '--sk-fill-bad': nine('fill-bad', () => fillSkin(S, P.cinnabar, 20)),
    '--sk-fill-azure': nine('fill-azure', () => fillSkin(S, P.azuriteL, 21)),
    '--sk-field': nine('field', () => fieldSkin(S)),
    '--sk-groove': nine('groove', () => grooveSkin(S)),
    '--sk-toast': nine('toast', () => toastSkin(S)),
    '--sk-toast-bad': nine('toast-bad', () => toastSkin(S, true, 27)),
    // ảnh nguyên tấm (nền, không giãn 9 mảnh)
    '--img-disc-paper': img('disc-paper', () => discSkin(S, 'paper', 35)),
    '--img-disc-azure': img('disc-azure', () => discSkin(S, 'azure', 37)),
    '--img-disc-gold': img('disc-gold', () => discSkin(S, 'gold', 39)),
    '--img-disc-silk': img('disc-silk', () => discSkin(S, 'silk', 51)),
    '--img-switch': img('switch', () => switchSkin(S, false)),
    '--img-switch-on': img('switch-on', () => switchSkin(S, true, 28)),
    '--img-knob': img('knob', () => knobSkin(S)),
    '--img-dots': img('dots', () => dotsSkin(S)),
  }
  // Font: chờ tối đa 2.5 giây rồi vẫn vào game (mạng chậm)
  const fonts = Promise.race([
    Promise.all(
      ['700 16px Alegreya', '500 16px Alegreya', 'italic 500 16px Alegreya'].map(f => document.fonts.load(f, 'Sơn Hà')),
    ),
    new Promise(r => setTimeout(r, 2500)),
  ])
  await Promise.all([fonts, ...Object.entries(vars).map(async ([k, v]) => root.setProperty(k, await v))])
}
