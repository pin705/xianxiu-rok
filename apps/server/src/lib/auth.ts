// Phiên: token ngẫu nhiên 32 byte ở client; DB chỉ giữ sha256 (lộ DB không lộ phiên).
import { createHash, randomBytes } from 'node:crypto'
import type { CookieSerializeOptions } from '@fastify/cookie'

export const COOKIE = 'rok'
export const newToken = () => randomBytes(32).toString('base64url')
export const hashToken = (token: string) => createHash('sha256').update(token).digest()
export const cookieOptions = (secure: boolean): CookieSerializeOptions => ({ path: '/', httpOnly: true, sameSite: 'lax', secure, maxAge: 180 * 86400 })

// Lấy token phiên từ header Cookie (bắt tay Socket.IO cùng origin mang theo cookie HttpOnly)
export function tokenFromCookie(header: string | undefined) {
  for (const part of (header ?? '').split(';')) {
    const [k, v] = part.trim().split('=')
    if (k === COOKIE && v) return decodeURIComponent(v)
  }
  return undefined
}

// Tên tông môn: 2–20 ký tự chữ/số/dấu cách (mọi hệ chữ), chuẩn hoá khoảng trắng. key chặn trùng không phân biệt hoa thường.
export function cleanName(raw: string) {
  const name = raw.normalize('NFC').trim().replace(/\s+/g, ' ')
  const n = [...name].length
  if (n < 2 || n > 20 || !/^[\p{L}\p{M}\p{N} ]+$/u.test(name)) return null
  return { name, key: name.toLocaleLowerCase('vi') }
}
