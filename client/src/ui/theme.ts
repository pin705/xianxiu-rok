// Khởi động giao diện: bơm màu khoáng và chất liệu vẽ tay (từ @rok/art) thành biến CSS, chờ font.
// Gọi một lần trước khi mount App — không có nhấp nháy font, không có khung trống.
import { PIGMENT, brushBar, goldFrame, inkFrame, lacquerTex, paper, sealMask } from '@rok/art'

const kebab = (k: string) => k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)
const url = (cv: HTMLCanvasElement | OffscreenCanvas) => `url(${(cv as HTMLCanvasElement).toDataURL()})`

export async function applyTheme() {
  const root = document.documentElement.style
  for (const [k, v] of Object.entries(PIGMENT)) root.setProperty(`--${kebab(k)}`, v)
  root.setProperty('--paper-tex', url(paper(256)))
  root.setProperty('--lacquer-tex', url(lacquerTex(192)))
  root.setProperty('--frame-ink', url(inkFrame(120)))
  root.setProperty('--frame-gold', url(goldFrame(96)))
  root.setProperty('--seal-mask', url(sealMask(96)))
  root.setProperty('--stroke-ink', url(brushBar(320, 28)))
  root.setProperty('--stroke-gold', url(brushBar(320, 28, PIGMENT.gold, 13)))
  // Font: chờ tối đa 2.5 giây rồi vẫn vào game (mạng chậm)
  await Promise.race([
    Promise.all(['700 16px Alegreya', '500 16px Alegreya', 'italic 500 16px Alegreya', '16px Seal'].map(f => document.fonts.load(f, 'Sơn Hà 山'))),
    new Promise(r => setTimeout(r, 2500)),
  ])
}
