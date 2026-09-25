// Hộp lệnh giữa các node (thư admin, bồi thường, cấm chat, xoá tài khoản): chủ giới đọc định kỳ, áp đúng một lần.
// Lệnh đã áp đánh dấu xong cùng commit với thay đổi state: sập giữa chừng thì cả hai cùng chưa có, lần sau áp lại.
import { mail, type NewMail } from '@rok/rules'
import { allyOf } from '@rok/rules/world'
import * as store from '../db/store.ts'
import type { World } from './world.ts'

export async function pollInbox(w: World) {
  if (w.polling || w.lost || w.readOnly || w.closing) return
  w.polling = true
  try {
    const rows = await store.openInbox(w.env.db, w.id)
    const now = w.now()
    w.tick(now)
    for (const r of rows) if (!w.applied.has(r.id)) command(w, r, now)
  } catch (e) {
    w.env.log.warn({ err: e, world: w.id }, 'inbox poll failed')
  } finally {
    w.polling = false
  }
}

function command(w: World, r: store.InboxRow, now: number) {
  w.applied.add(r.id)
  w.persist.pending.inboxDone.push(r.id)
  const b = r.body as {
    pid?: number
    mail?: Omit<Extract<NewMail, { k: 'admin' }>, 'at'>
    until?: number
    name?: string
  }
  if (r.kind === 'mute' && b.pid) {
    w.chat.mute(b.pid, b.until ?? 0, now)
  } else if (r.kind === 'mail' && b.mail) {
    for (const pid of b.pid ? [b.pid] : [...w.slots.keys()]) {
      const slot = w.slots.get(pid),
        s = w.ps.get(pid)
      if (slot && s) w.commit(slot, mail(s, { ...b.mail, at: now }))
    }
  } else if (r.kind === 'delete' && b.pid) remove(w, b.pid, now)
  else if (r.kind === 'rename' && b.pid && b.name) {
    // Cải Danh Lệnh: API đã giữ khoá tên mới trong DB; ở đây đổi tên trong state và trừ một lệnh
    const slot = w.slots.get(b.pid),
      s = w.ps.get(b.pid)
    if (slot && s)
      w.commit(slot, { ...s, name: b.name, items: { ...s.items, caiDanh: Math.max(0, (s.items.caiDanh ?? 0) - 1) } })
    w.maps.changed()
  } else w.env.log.warn({ id: r.id, kind: r.kind }, 'unknown inbox command, skipped')
  w.persist.schedule()
}

// Xoá tài khoản (API đã chặn đăng nhập): rời tiên minh như tự rời (truyền minh chủ / giải tán), đá mọi kết nối, bỏ khỏi RAM.
// Commit kèm theo xoá dòng tài khoản — dây chuyền: tông môn, chiến báo, mã chuyển máy, đăng ký push.
function remove(w: World, pid: number, now: number) {
  const slot = w.slots.get(pid)
  if (!slot || w.npc.has(pid)) return
  if (allyOf(w.shared, pid)) {
    const r = w.play(pid, { type: 'allyLeave' }, now, 0)
    if (r.ok) w.share(r.world)
  }
  for (const c of slot.conns) {
    c.emit('bye', { reason: 'deleted' })
    c.disconnect(true)
  }
  w.slots.delete(pid)
  w.ps.delete(pid)
  w.persist.dirty.delete(pid)
  w.persist.seenDirty.delete(pid)
  w.persist.pending.gone.push(pid)
  w.maps.changed()
}
