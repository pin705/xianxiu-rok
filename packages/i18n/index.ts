// Đa ngôn ngữ. Mỗi ngôn ngữ một file trong locales/, cùng khuôn Text lấy từ bản gốc tiếng Việt — TypeScript báo thiếu khoá.
// Thêm ngôn ngữ mới:
//   1. locales/xx.ts: `export const xx: Text = { ... }` (chép en.ts rồi dịch; hàm như gain(n) dịch cả cách ghép câu)
//   2. thêm một dòng vào LOCALES bên dưới
//   3. hệ chữ Alegreya chưa có (Hán, Thái, Ả Rập…): thêm họ font trong apps/client/fonts.mjs rồi chạy `npm run fonts`
// Mỗi ngôn ngữ tải riêng khi cần (dynamic import): thêm ngôn ngữ không làm nặng bản tải của người chơi khác.
import type { Text } from './locales/vi.ts'

export type { Text }

export const LOCALES = {
  vi: { name: 'Tiếng Việt', dir: 'ltr', load: () => import('./locales/vi.ts').then(m => m.vi) },
  en: { name: 'English', dir: 'ltr', load: () => import('./locales/en.ts').then(m => m.en) },
} satisfies Record<string, { name: string; dir: 'ltr' | 'rtl'; load: () => Promise<Text> }>

export type Locale = keyof typeof LOCALES
export const LOCALE_IDS = Object.keys(LOCALES) as Locale[]
// Người chơi mà game chưa có tiếng của họ: tiếng Anh
export const FALLBACK: Locale = 'en'

const known = (x: string | null | undefined): x is Locale => !!x && Object.hasOwn(LOCALES, x)

// Chọn ngôn ngữ: người chơi đã chọn > thứ tự ưu tiên của trình duyệt (khớp mã chính: 'vi-VN' → 'vi') > FALLBACK
export function pick(saved: string | null, prefs: readonly string[]): Locale {
  if (known(saved)) return saved
  for (const p of prefs) {
    const base = p.toLowerCase().split('-')[0]
    if (known(base)) return base
  }
  return FALLBACK
}

export const loadText = (l: Locale): Promise<Text> => LOCALES[l].load()

// Chữ của thư hệ thống / một dòng biên niên theo khoá. Khoá lạ (server mới hơn client) vẫn hiện được chữ chung.
type Say<R> = Record<string, ((...a: (string | number)[]) => R) | undefined>
export function mailText(t: Text, m: { k: string; a?: readonly (string | number)[] }): [string, string] {
  const f = (t.mail.msg as unknown as Say<[string, string]>)[m.k]
  return f ? f(...(m.a ?? [])) : t.mail.msg.unknown()
}
export function chronText(t: Text, c: { k: string; a: readonly (string | number)[] }): string {
  const f = (t.world.msg as unknown as Say<string>)[c.k]
  return f ? f(...c.a) : t.world.msg.unknown()
}
