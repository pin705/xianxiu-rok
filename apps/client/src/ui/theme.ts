// Khởi động giao diện: bơm màu khoáng và da giao diện vẽ tay (từ @rok/art) thành biến CSS, chờ font.
// Gọi một lần trước khi mount App — không có nhấp nháy font, không có khung trống.
// Da 9 mảnh (--sk-*) là giá trị border-image đủ bộ: component chỉ cần `border: 0 solid; border-image: var(--sk-…)`.
import {
  PIGMENT, badgeSkin, brushBar, buttonSkin, cardSkin, discSkin, dotsSkin, fieldSkin, fillSkin, grooveSkin, inkBlot, knobSkin, lacquerSkin,
  lacquerTex, paper, plankSkin, rodSkin, scrollSkin, switchSkin, tagSkin, toastSkin, trackSkin, type Skin,
} from '@rok/art'

type Canvas = HTMLCanvasElement | OffscreenCanvas
const kebab = (k: string) => k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)
// Độ nét khi vẽ da: theo màn hình (tối thiểu 2 để màn thường vẫn sắc, tối đa 3)
const S = Math.min(3, Math.max(2, Math.ceil(globalThis.devicePixelRatio || 1)))

// Ảnh → blob URL (chuỗi ngắn, mã hoá PNG không chặn luồng chính như toDataURL)
const url = async (cv: Canvas) => {
  const blob = 'convertToBlob' in cv ? await cv.convertToBlob() : await new Promise<Blob>(r => cv.toBlob(b => r(b!)))
  return `url(${URL.createObjectURL(blob)})`
}
// 9 mảnh: ảnh, slice (px thật), bề dày (px CSS), phần tràn, giãn. fill = false: chỉ khung, lòng để nền (giấy ghép) lộ ra
const nine = async (k: Skin, fill = true, src?: Promise<string>) => {
  const [t, r, b, l] = k.slice
  return `${await (src ?? url(k.cv))} ${t * S} ${r * S} ${b * S} ${l * S}${fill ? ' fill' : ''} / ${t}px ${r}px ${b}px ${l}px / ${k.outset ?? 0}px stretch`
}

export async function applyTheme() {
  const root = document.documentElement.style
  for (const [k, v] of Object.entries(PIGMENT)) root.setProperty(`--${kebab(k)}`, v)
  const P = PIGMENT
  const scroll = scrollSkin(S)
  const scrollUrl = url(scroll.cv)
  const vars: Record<string, Promise<string>> = {
    '--paper-tex': url(paper(256)),
    '--lacquer-tex': url(lacquerTex(192)),
    '--stroke-ink': url(brushBar(320, 28)),
    '--stroke-gold': url(brushBar(320, 28, P.gold, 13)),
    '--blot-mask': url(inkBlot(256)),
    // bảng lớn, thẻ, ván
    '--sk-scroll': nine(scroll, true, scrollUrl),
    '--sk-scroll-frame': nine(scroll, false, scrollUrl), // bảng cao: khung lụa + giấy ghép (không giãn hạt giấy)
    '--sk-rod': nine(rodSkin(S)),
    '--sk-card': nine(cardSkin(S, 'paper')),
    '--sk-card-plain': nine(cardSkin(S, 'plain', 5)),
    '--sk-card-glow': nine(cardSkin(S, 'glow', 7)),
    '--sk-card-sel': nine(cardSkin(S, 'selected', 9)),
    '--sk-card-lacquer': nine(cardSkin(S, 'lacquer', 11)),
    '--sk-plank': nine(plankSkin(S)),
    // nút, nhãn, huy hiệu số
    '--sk-btn': nine(buttonSkin(S, 'primary')),
    '--sk-btn-gold': nine(buttonSkin(S, 'gold', 9)),
    '--sk-btn-danger': nine(buttonSkin(S, 'danger', 11)),
    '--sk-btn-ghost': nine(buttonSkin(S, 'ghost', 13)),
    '--sk-btn-off': nine(buttonSkin(S, 'off', 15)),
    '--sk-tag': nine(tagSkin(S, 'plain')),
    '--sk-tag-good': nine(tagSkin(S, 'good', 12)),
    '--sk-tag-bad': nine(tagSkin(S, 'bad', 13)),
    '--sk-tag-gold': nine(tagSkin(S, 'gold', 14)),
    '--sk-tag-dark': nine(tagSkin(S, 'dark', 15)),
    '--sk-tag-red': nine(tagSkin(S, 'red', 16)),
    '--sk-badge': nine(badgeSkin(S)),
    '--sk-badge-fresh': nine(badgeSkin(S, true, 14)),
    // thanh tiến độ, ô nhập, rãnh thẻ, bảng tối nhỏ, thông báo
    '--sk-track': nine(trackSkin(S)),
    '--sk-track-dark': nine(trackSkin(S, true, 16)),
    '--sk-fill': nine(fillSkin(S, P.spirit)),
    '--sk-fill-gold': nine(fillSkin(S, P.gold, 18)),
    '--sk-fill-good': nine(fillSkin(S, P.malachite, 19)),
    '--sk-fill-bad': nine(fillSkin(S, P.cinnabar, 20)),
    '--sk-fill-azure': nine(fillSkin(S, P.azuriteL, 21)),
    '--sk-field': nine(fieldSkin(S)),
    '--sk-groove': nine(grooveSkin(S)),
    '--sk-bubble': nine(lacquerSkin(S)),
    '--sk-sign': nine(lacquerSkin(S, 31, 'notch')),
    '--sk-toast': nine(toastSkin(S)),
    '--sk-toast-bad': nine(toastSkin(S, true, 27)),
    // ảnh nguyên tấm (nền, không giãn 9 mảnh)
    '--img-disc': url(discSkin(S, 'lacquer').cv),
    '--img-disc-paper': url(discSkin(S, 'paper', 35).cv),
    '--img-disc-azure': url(discSkin(S, 'azure', 37).cv),
    '--img-disc-gold': url(discSkin(S, 'gold', 39).cv),
    '--img-switch': url(switchSkin(S, false).cv),
    '--img-switch-on': url(switchSkin(S, true, 28).cv),
    '--img-knob': url(knobSkin(S).cv),
    '--img-dots': url(dotsSkin(S).cv),
  }
  // Font: chờ tối đa 2.5 giây rồi vẫn vào game (mạng chậm)
  const fonts = Promise.race([
    Promise.all(['700 16px Alegreya', '500 16px Alegreya', 'italic 500 16px Alegreya'].map(f => document.fonts.load(f, 'Sơn Hà'))),
    new Promise(r => setTimeout(r, 2500)),
  ])
  await Promise.all([fonts, ...Object.entries(vars).map(async ([k, v]) => root.setProperty(k, await v))])
}
