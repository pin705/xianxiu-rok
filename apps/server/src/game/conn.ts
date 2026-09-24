// Kết nối của người chơi vào actor: nhận tab mới (đưa state tới giờ, xếp chỗ, welcome), tab rời đi (lưu lát "lúc rời game",
// hẹn nhắc), đá tab, gửi lại ảnh chụp khi client lệch version.
import { advance, dayOf, type State } from '@rok/rules'
import { view, type Bye, type Snap } from '@rok/protocol'
import * as store from '../db/store.ts'
import { nextRemind } from './notify.ts'
import type { Slot, Sock, World } from './world.ts'

const MAX_TABS = 5

export async function attach(w: World, sock: Sock) {
  const pid = sock.data.pid
  if (!w.slots.has(pid)) {
    const row = await store.findPlayer(w.env.db, pid) // người vừa lập tông môn (API có thể ở node khác)
    if (!row || row.worldId !== w.id) return void sock.disconnect(true)
    if (!w.slots.has(pid) && !w.quarantined(pid)) w.adopt(row)
    if (!w.slots.has(pid)) return void sock.disconnect(true)
  }
  if (w.closing || w.lost || !sock.connected) return void sock.disconnect(true)
  const slot = w.slots.get(pid)!
  if (slot.conns.size >= MAX_TABS) drop(w, slot.conns.values().next().value!, 'replaced')
  // đưa state tới giờ hiện tại trước khi nhận kết nối mới: patch của bước này chỉ tới các tab cũ, tab mới nhận welcome
  const now = w.now()
  w.tick(now)
  w.commit(slot, advance(w.ps.get(pid)!, now))
  w.seat(slot, now)
  slot.conns.add(sock)
  slot.away++
  const today = dayOf(now)
  if (slot.day !== today) {
    slot.day = today
    w.event(pid, 'login', now, { hall: w.ps.get(pid)!.levels.chuDien })
  }
  const seen = slot.seen && now - slot.seen.time >= 60_000 ? slot.seen : undefined
  const state = view(w.ps.get(pid)!)
  const v = slot.v
  const at = w.ps.get(pid)!.seat
  w.persist.deliver(
    () =>
      sock.emit('welcome', {
        now,
        v,
        state,
        me: { pid, name: slot.name, world: w.id, x: at?.x ?? null, y: at?.y ?? null },
        world: w.info,
        seen,
        ro: w.readOnly,
        warp: w.env.warpAllowed,
      }),
    true,
  )
  w.wake(slot)
}

export function detach(w: World, sock: Sock) {
  const slot = w.slots.get(sock.data.pid)
  w.maps.forget(sock)
  if (!slot || !slot.conns.delete(sock) || slot.conns.size) return
  w.tick(w.now()) // sự kiện giới (cướp, lật tuần) trước khi đưa state người này lên
  slot.gen++ // không còn ai xem: bỏ hẹn đẩy kết quả trận
  w.commit(slot, advance(w.ps.get(slot.id)!, w.now()))
  const s = w.ps.get(slot.id)!
  slot.seen = { time: s.time, res: s.res, levels: s.levels, tech: s.tech, stats: s.stats }
  w.persist.seenDirty.add(slot.id)
  w.persist.dirty.add(slot.id)
  remind(w, slot, s)
  w.persist.schedule()
}

// Rời game khi còn việc dài: hẹn nhắc qua Web Push lúc việc xong sớm nhất (game/notify.ts)
function remind(w: World, slot: Slot, s: State) {
  if (!w.env.push || w.npc.has(slot.id)) return
  const next = nextRemind(s, w.now())
  if (next) w.alarm.add({ at: next.at, pid: slot.id, gen: slot.gen, remind: { k: next.k, away: slot.away } })
}

export function drop(w: World, sock: Sock, reason: Bye) {
  sock.emit('bye', { reason })
  detach(w, sock)
  sock.disconnect(true)
}

export function sync(w: World, sock: Sock, ack: (s: Snap) => void) {
  const slot = w.slots.get(sock.data.pid)
  if (!slot) return
  const snap = { v: slot.v, state: view(w.ps.get(slot.id)!) }
  w.persist.deliver(() => ack(snap), true)
}
