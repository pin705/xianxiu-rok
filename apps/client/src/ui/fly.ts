// Phần thưởng bay: icon vẽ tay bay theo đường cong từ nút nhận vào ô tài nguyên trên HUD (đan dược vào tab Bảo khố),
// ô đích nảy lên khi nhận. Đích đánh dấu bằng data-res="<tài nguyên>" / data-tab="baoKho".
import { isItem, itemIcon, paintedUrl } from '@rok/art'

type Bag = Partial<Record<string, number>>

// into: lớp chứa (mặc định: hộp thoại đang mở trên cùng, để icon không bị che)
export function fly(from: Element | null | undefined, bag: Bag, into?: Element) {
  if (!from || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const a = from.getBoundingClientRect()
  const layer = into ?? [...document.querySelectorAll('dialog[open]')].at(-1) ?? document.body
  let wave = 0
  for (const [name, n] of Object.entries(bag)) {
    if (!n || !isItem(name)) continue
    const target = document.querySelector(name.startsWith('linh') ? `[data-res="${name}"]` : '[data-tab="baoKho"]')
    if (!target) continue
    const b = target.getBoundingClientRect()
    const count = Math.min(6, 2 + Math.floor(Math.log10(n + 1)))
    const src = paintedUrl(`icon:${name}`, () => itemIcon(name), 26)
    for (let i = 0; i < count; i++) {
      const r = () => Math.random() - 0.5
      const x0 = a.left + a.width / 2 - 13 + r() * 36,
        y0 = a.top + a.height / 2 - 13 + r() * 14
      const x1 = b.left + Math.min(b.width / 2, 22) - 13,
        y1 = b.top + b.height / 2 - 13
      const mx = (x0 + x1) / 2 + r() * 90,
        my = Math.min(y0, y1) - 50 - Math.random() * 50
      const img = document.createElement('img')
      img.src = src
      img.alt = ''
      Object.assign(img.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        width: '26px',
        height: '26px',
        zIndex: '99',
        pointerEvents: 'none',
      })
      layer.append(img)
      img
        .animate(
          [
            { transform: `translate(${x0}px, ${y0}px) scale(0.4)`, opacity: 0 },
            { transform: `translate(${x0 + r() * 50}px, ${y0 - 24}px) scale(1.15)`, opacity: 1, offset: 0.2 },
            { transform: `translate(${mx}px, ${my}px) scale(1)`, offset: 0.58 },
            { transform: `translate(${x1}px, ${y1}px) scale(0.75)`, opacity: 0.95 },
          ],
          { duration: 820 + i * 50, delay: wave * 90 + i * 55, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'both' },
        )
        .finished.then(() => {
          img.remove()
          target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.16)' }, { transform: 'scale(1)' }], {
            duration: 240,
            easing: 'ease-out',
          })
        })
    }
    wave++
  }
}
