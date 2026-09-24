// Đọc thao tác từ JSON không tin được: id phải là khoá thật của bảng (không nhận khoá thừa kế như 'constructor'),
// số phải là số nguyên an toàn trong khoảng. Dùng cho cả thao tác tông môn (sect/) lẫn thao tác giới (world/).
import { type Army, type JobKind, type Target } from './types.ts'
import { ELDER_IDS } from './util.ts'
import { BEASTS, SECTS, UNITS } from '../data.ts'

export const oneOf =
  <T extends string>(ids: readonly T[]) =>
  (x: unknown): x is T =>
    typeof x === 'string' && (ids as readonly string[]).includes(x)
export const int =
  (lo: number, hi: number) =>
  (x: unknown): x is number =>
    Number.isSafeInteger(x) && (x as number) >= lo && (x as number) <= hi
export const isElder = oneOf(ELDER_IDS)
export const JOB_KINDS: readonly JobKind[] = ['build', 'train', 'heal', 'study', 'brew', 'forge']
export function pickArmy(x: unknown): Army | null {
  if (!obj(x)) return null
  const out: Army = {}
  for (const [k, n] of Object.entries(x)) {
    if (!oneOf(UNITS)(k) || !int(0, 1e9)(n)) return null
    if (n) out[k] = n
  }
  return out
}
export function pickTarget(x: unknown): Target | null {
  if (!obj(x)) return null
  if (x.kind === 'beast' && int(0, BEASTS.length - 1)(x.i)) return { kind: 'beast', i: x.i }
  if (x.kind === 'sect' && int(0, SECTS.length - 1)(x.i)) return { kind: 'sect', i: x.i }
  return null
}
export const obj = (x: unknown): x is Record<string, any> => !!x && typeof x === 'object' && !Array.isArray(x)
export const id = int(1, Number.MAX_SAFE_INTEGER) // mã (người chơi, minh, lệnh…): số nguyên ≥ 1
// Chữ người chơi gõ: chuẩn hoá Unicode, gộp khoảng trắng
export const cleanText = (x: unknown) => (typeof x === 'string' ? x.normalize('NFC').trim().replace(/\s+/g, ' ') : '')
