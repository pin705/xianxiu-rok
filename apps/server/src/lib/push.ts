// Web Push: thư viện web-push lo VAPID (ES256) và mã hoá nội dung (RFC 8291). Gửi tới mọi trình duyệt người chơi đã bật;
// đăng ký đã hết hạn (dịch vụ push trả 404/410) thì xoá. Chữ dựng theo ngôn ngữ của tài khoản, cùng bộ chữ với client.
import type { FastifyBaseLogger } from 'fastify'
import webpush from 'web-push'
import { loadText, pick, type Text } from '@rok/i18n'
import type { Database } from '../db/index.ts'
import * as accounts from '../db/accounts.ts'

export type Note = { title: string; body: string; tag: string } // tag: thông báo cùng loại thay nhau, không chồng
export type Pusher = (pid: number, note: (L: Text) => Note) => void

export function makePusher(
  db: Database,
  keys: { pub?: string; priv?: string; subject: string },
  log: FastifyBaseLogger,
): Pusher | null {
  if (!keys.pub || !keys.priv) return null
  webpush.setVapidDetails(keys.subject, keys.pub, keys.priv)
  // bắn rồi quên: actor không chờ mạng ngoài; lỗi chỉ ghi log
  return (pid, note) =>
    void (async () => {
      for (const s of await accounts.pushSubsOf(db, pid)) {
        const body = JSON.stringify(note(await loadText(pick(s.locale, []))))
        await webpush
          .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, {
            TTL: 6 * 3600,
            urgency: 'normal',
          })
          .catch(e => {
            const code = (e as { statusCode?: number }).statusCode
            if (code === 404 || code === 410) return accounts.dropPushSub(db, s.endpoint)
            log.warn({ err: e, pid, code }, 'push send failed')
          })
      }
    })().catch(e => log.warn({ err: e, pid }, 'push failed'))
}
