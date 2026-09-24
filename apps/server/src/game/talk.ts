// Chat trong giới: kênh giới (từ Chủ điện CHAT_HALL) và kênh tiên minh — ai được nói, ai nghe, báo cáo tin.
// Luật của tin (tần suất, lặp, lọc từ, cấm chat) ở chat.ts; tin ghi DB cùng commit như mọi thay đổi khác.
import { CHAT_HALL } from '@rok/rules'
import { allyOf } from '@rok/rules/world'
import type { Channel, SayErr } from '@rok/protocol'
import * as store from '../db/store.ts'
import type { Sock, World } from './world.ts'

// Nạp tin gần đây + danh sách cấm chat lúc nhận giới
export async function loadChat(w: World) {
  const [rows, m] = await Promise.all([store.recentChat(w.env.db, w.id), store.mutes(w.env.db, w.id)])
  w.chat.load(rows, m)
}

// Khoá phòng của kênh với người này ('w' cả giới, 'a<id>' tiên minh); null: chưa được vào
export function channel(w: World, pid: number, ch: Channel) {
  const s = w.ps.get(pid)
  if (!s) return null
  if (ch === 'world') return s.levels.chuDien >= CHAT_HALL ? 'w' : null
  const al = allyOf(w.shared, pid)
  return al ? `a${al.id}` : null
}
// người nhận của một phòng: cả giới, hoặc người trong minh
function listeners(w: World, room: string) {
  if (room === 'w') return [...w.slots.values()]
  const al = w.shared.allies[Number(room.slice(1))]
  return al ? Object.keys(al.members).flatMap(p => w.slots.get(Number(p)) ?? []) : []
}

export function say(
  w: World,
  sock: Sock,
  m: { ch: Channel; text: string },
  ack: (r: { ok: true } | { ok: false; err: SayErr }) => void,
) {
  const pid = sock.data.pid
  const no = (err: SayErr) => w.persist.deliver(() => ack({ ok: false, err }))
  if (w.closing || w.lost || w.readOnly) return no('unavailable')
  const now = w.now()
  if (w.chat.isMuted(pid, now)) return no('muted')
  const room = channel(w, pid, m.ch)
  if (!room) return no('locked')
  const msg = w.chat.post(pid, w.ps.get(pid)!.name, room, m.text, now)
  if (typeof msg === 'string') return no(msg)
  w.persist.pending.chat.push({ ...msg, ch: room })
  const to = listeners(w, room)
  w.persist.deliver(() => {
    for (const slot of to) for (const c of slot.conns) if (c.connected) c.emit('chat', { ch: m.ch, ms: [msg] })
    ack({ ok: true })
  }, true)
  w.persist.schedule()
}

// Báo cáo một tin: chỉ người nghe được tin đó mới báo được
export async function report(w: World, sock: Sock, id: number) {
  const hit = w.chat.find(id)
  if (!hit || !listeners(w, hit.room).some(s => s.id === sock.data.pid)) return false
  await store.reportChat(w.env.db, {
    world: w.id,
    msgId: id,
    reporter: sock.data.pid,
    author: hit.msg.pid,
    text: hit.msg.text,
  })
  return true
}
