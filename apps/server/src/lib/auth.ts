// Phiên: token ngẫu nhiên 32 byte ở client; DB chỉ giữ sha256 (lộ DB không lộ phiên).
import { createHash, randomBytes, randomInt, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'
import type { CookieSerializeOptions } from '@fastify/cookie'
import { hasBad } from './filter.ts'

export const COOKIE = 'rok'
export const newToken = () => randomBytes(32).toString('base64url')
export const hashToken = (token: string) => createHash('sha256').update(token).digest()
export const cookieOptions = (secure: boolean): CookieSerializeOptions => ({
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
  secure,
  maxAge: 180 * 86400,
})

// Lấy token phiên từ header Cookie (bắt tay Socket.IO cùng origin mang theo cookie HttpOnly)
export function tokenFromCookie(header: string | undefined) {
  for (const part of (header ?? '').split(';')) {
    const [k, v] = part.trim().split('=')
    if (k === COOKIE && v) return decodeURIComponent(v)
  }
  return undefined
}

// Tên tông môn: 2–20 ký tự chữ/số/dấu cách (mọi hệ chữ), chuẩn hoá khoảng trắng, không từ tục. key chặn trùng không phân biệt hoa thường.
export function cleanName(raw: string) {
  const name = raw.normalize('NFC').trim().replace(/\s+/g, ' ')
  const n = [...name].length
  if (n < 2 || n > 20 || !/^[\p{L}\p{M}\p{N} ]+$/u.test(name) || hasBad(name)) return null
  return { name, key: name.toLocaleLowerCase('vi') }
}

// Mật khẩu: scrypt (N = 2^15, 32 MB mỗi lần băm) của node:crypto, lưu `scrypt$muối$khoá`. Email lạ vẫn băm một lần với
// chuỗi giả để thời gian trả lời không lộ email nào đã có tài khoản.
const OPT: ScryptOptions = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }
const derive = (pass: string, salt: Buffer) =>
  new Promise<Buffer>((ok, no) => scrypt(pass.normalize('NFC'), salt, 32, OPT, (e, k) => (e ? no(e) : ok(k))))
export async function hashPass(pass: string) {
  const salt = randomBytes(16)
  return `scrypt$${salt.toString('base64url')}$${(await derive(pass, salt)).toString('base64url')}`
}
const DUMMY = `scrypt$${'A'.repeat(22)}$${'A'.repeat(43)}`
export async function checkPass(pass: string, stored: string | null) {
  const [tag, salt, key] = (stored ?? DUMMY).split('$')
  const got = await derive(pass, Buffer.from(salt, 'base64url'))
  const want = Buffer.from(key ?? '', 'base64url')
  return !!stored && tag === 'scrypt' && want.length === got.length && timingSafeEqual(got, want)
}
export const cleanEmail = (raw: string) => raw.normalize('NFC').trim().toLowerCase()

// Mã chuyển máy: 8 ký tự dễ đọc (không 0/O/1/I/L), dùng một lần trong CODE_TTL. 31^8 ≈ 8,5·10¹¹ tổ hợp, cộng giới hạn tần suất
// → đoán mò không được. DB chỉ giữ sha256 như token phiên.
const CODE_ABC = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
export const CODE_TTL = 15 * 60_000
export const newCode = () => Array.from({ length: 8 }, () => CODE_ABC[randomInt(CODE_ABC.length)]).join('')
export const cleanCode = (raw: string) => raw.toUpperCase().replace(/[^0-9A-Z]/g, '')
