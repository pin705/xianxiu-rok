// Chat trong giới: kênh giới (từ Chủ điện CHAT_HALL), kênh tiên minh, truyền âm 1-1 — ai được nói, ai nghe, báo cáo tin.
// Luật của tin (tần suất, lặp, lọc từ, cấm chat) ở chat.ts; tin ghi DB cùng commit như mọi thay đổi khác.
import { CHAT_HALL } from '@rok/rules'
import { allyOf } from '@rok/rules/world'
import type { Channel, Dm, SayErr } from '@rok/protocol'
import * as store from '../db/store.ts'
import { dmNote } from './notify.ts'
import type { Sock, World } from './world.ts'

// Nạp tin gần đây + danh sách cấm chat lúc nhận giới
export async function loadChat(w: World) {
  const [rows, m] = await Promise.all([store.recentChat(w.env.db, w.id), store.mutes(w.env.db, w.id)])
  w.chat.load(rows, m)
}

// Khoá phòng của kênh với người này ('w' cả giới, 'a<id>' tiên minh, 'd<a>-<b>' truyền âm, a < b); null: chưa được vào.
// Truyền âm với người chơi thật trong giới; gửi (send) thì phải từ tầng CHAT_HALL và người kia chưa chặn mình.
export function channel(w: World, pid: number, ch: Channel, send = false) {
  const s = w.ps.get(pid)
  if (!s) return null
  if (ch === 'world') return s.levels.chuDien >= CHAT_HALL ? 'w' : null
  if (ch !== 'ally') {
    const to = Number(ch.slice(1))
    const them = w.ps.get(to)
    if (!them || to === pid || w.npc.has(to)) return null
    if (send && (s.levels.chuDien < CHAT_HALL || them.blocks.includes(pid))) return null
    return `d${Math.min(pid, to)}-${Math.max(pid, to)}`
  }
  const al = allyOf(w.shared, pid)
  return al ? `a${al.id}` : null
}
// người nhận của một phòng: cả giới, người trong minh, hay hai người truyền âm
function listeners(w: World, room: string) {
  if (room === 'w') return [...w.slots.values()]
  if (room[0] === 'd')
    return room
      .slice(1)
      .split('-')
      .flatMap(p => w.slots.get(Number(p)) ?? [])
  const al = w.shared.allies[Number(room.slice(1))]
  return al ? Object.keys(al.members).flatMap(p => w.slots.get(Number(p)) ?? []) : []
}
// Kênh của phòng nhìn từ người nghe pid: truyền âm là 'p<người bên kia>'
const chOf = (room: string, ch: Channel, pid: number): Channel => {
  if (room[0] !== 'd') return ch
  const [a, b] = room.slice(1).split('-').map(Number)
  return `p${a === pid ? b : a}`
}
// Các cuộc truyền âm gần đây của pid (tên theo state hiện tại)
export const dmsOf = (w: World, pid: number): Dm[] =>
  w.chat.dms(pid).map(d => ({ pid: d.other, name: w.ps.get(d.other)?.name ?? d.last.name, last: d.last }))

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
  const room = channel(w, pid, m.ch, true)
  if (!room) return no('locked')
  const msg = w.chat.post(pid, w.ps.get(pid)!.name, room, m.text, now)
  if (typeof msg === 'string') return no(msg)
  w.persist.pending.chat.push({ ...msg, ch: room })
  const to = listeners(w, room)
  // truyền âm tới người đang offline: báo qua Web Push
  const them = room[0] === 'd' ? Number(m.ch.slice(1)) : 0
  if (them && !w.slots.get(them)?.conns.size) w.env.push?.(them, dmNote(msg.name, msg.text))
  w.persist.deliver(() => {
    for (const slot of to)
      for (const c of slot.conns) if (c.connected) c.emit('chat', { ch: chOf(room, m.ch, slot.id), ms: [msg] })
    ack({ ok: true })
  }, true)
  w.persist.schedule()
}

// pid nghe được tin của author có mã chiến báo "#r<id>" (chia sẻ chiến báo vào chat)
export const sharedIn = (w: World, pid: number, author: number, id: number) =>
  w.chat.shares(author, `#r${id}`).some(room => listeners(w, room).some(s => s.id === pid))

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
