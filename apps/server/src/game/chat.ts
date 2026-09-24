// Chat của một giới: tin gần đây theo phòng ('w' kênh giới, 'a<mã minh>' kênh tiên minh, 'd<a>-<b>' truyền âm giữa hai
// người chơi a < b), lọc từ tục, giới hạn tần suất
// (CHAT_BURST tin liền rồi một tin mỗi CHAT_EVERY), chặn lặp lại tin vừa gửi trong CHAT_DUP, cấm chat. Gửi đi do World lo.
import type { ChatMsg, SayErr } from '@rok/protocol'
import type { ChatRow } from '../db/store.ts'
import { mask, clean } from '../lib/filter.ts'

const CHAT_BURST = 3
const CHAT_EVERY = 3_000
const CHAT_DUP = 30_000
const CHAT_KEEP = 50 // tin mỗi phòng giữ trong RAM (lịch sử khi mở kênh)
const CHAT_LEN = 200 // ký tự, sau khi chuẩn hoá

export class Chat {
  private readonly rooms = new Map<string, ChatMsg[]>()
  private id = 0
  private readonly buckets = new Map<number, { tokens: number; at: number; last: string; lastAt: number }>()
  private readonly muted = new Map<number, number>() // pid → cấm tới lúc này

  load(rows: ChatRow[], mutes: { pid: number; until: Date | null }[]) {
    for (const r of rows) this.keep(r.ch, { id: r.id, pid: r.pid, name: r.name, text: r.text, at: r.at })
    this.id = Math.max(this.id, ...rows.map(r => r.id))
    for (const x of mutes) if (x.until) this.muted.set(x.pid, x.until.getTime())
  }
  history = (room: string) => this.rooms.get(room) ?? []
  isMuted = (pid: number, now: number) => (this.muted.get(pid) ?? 0) > now
  mute(pid: number, until: number, now: number) {
    if (until > now) this.muted.set(pid, until)
    else this.muted.delete(pid)
  }
  // Các phòng truyền âm ('d<pid nhỏ>-<pid lớn>') có người này: người bên kia, tin cuối — mới nhất trước
  dms(pid: number) {
    const out: { other: number; last: ChatMsg }[] = []
    for (const [room, list] of this.rooms) {
      if (room[0] !== 'd' || !list.length) continue
      const [a, b] = room.slice(1).split('-').map(Number)
      if (a === pid || b === pid) out.push({ other: a === pid ? b : a, last: list.at(-1)! })
    }
    return out.sort((x, y) => y.last.at - x.last.at)
  }
  // Tin id đang giữ và phòng của nó (báo cáo tin xấu)
  find(id: number) {
    for (const [room, list] of this.rooms) {
      const msg = list.find(x => x.id === id)
      if (msg) return { room, msg }
    }
    return null
  }

  // Nhận một tin vào phòng: tin đã lọc (đã giữ, người gọi gửi đi và ghi DB), hoặc lý do từ chối
  post(pid: number, name: string, room: string, raw: string, now: number): ChatMsg | SayErr {
    const text = clean(raw)
    if (!text || [...text].length > CHAT_LEN) return 'bad'
    const b = this.buckets.get(pid) ?? { tokens: CHAT_BURST, at: now, last: '', lastAt: 0 }
    b.tokens = Math.min(CHAT_BURST, b.tokens + (now - b.at) / CHAT_EVERY)
    b.at = now
    if (b.tokens < 1) return 'rate'
    if (b.last === text && now - b.lastAt < CHAT_DUP) return 'dup'
    b.tokens -= 1
    b.last = text
    b.lastAt = now
    this.buckets.set(pid, b)
    const msg: ChatMsg = { id: ++this.id, pid, name, text: mask(text), at: now }
    this.keep(room, msg)
    return msg
  }

  private keep(room: string, m: ChatMsg) {
    this.rooms.set(room, [...(this.rooms.get(room) ?? []), m].slice(-CHAT_KEEP))
  }
}
