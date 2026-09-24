// Thao tác của người chơi: luật tông môn (apply, chỉ đổi state người đó) hoặc luật giới (worldAct, có thể đổi state nhiều
// người và phần chung). Mầm trận do server bơm mới trước mỗi thao tác. Kết quả đi qua commit: ack sau khi ghi.
import { randomInt } from 'node:crypto'
import { apply, type Action } from '@rok/rules'
import { MARKET_ACTIONS, WORLD_ACTIONS, parseWorldAction, type WorldAction, type WorldResult } from '@rok/rules/world'
import type { Ack } from '@rok/protocol'
import { hasBad } from '../lib/filter.ts'
import { intents } from '../lib/metrics.ts'
import type { Slot, Sock, World } from './world.ts'

export const newSeed = () => randomInt(1, 2 ** 32 - 1) // mầm mới trước mọi thao tác: client không đoán trước được trận
// Chữ người chơi tự đặt mà cả giới thấy: lọc từ tục trước khi vào luật (chat lọc riêng bằng mask)
const publicText = (a: WorldAction) =>
  a.type === 'allyFound' ? [a.name, a.tag] : a.type === 'allyNotice' || a.type === 'allyMark' ? [a.text] : []

export function intent(w: World, sock: Sock, a: Action | WorldAction, ack: (r: Ack) => void) {
  const slot = w.slots.get(sock.data.pid)
  if (!slot) return ack({ ok: false, err: 'moving' })
  if (w.closing || w.lost) return w.persist.deliver(() => ack({ ok: false, err: 'moving' }))
  if (w.readOnly) return w.persist.deliver(() => ack({ ok: false, err: 'unavailable' }))
  if (slot.broken) return w.persist.deliver(() => ack({ ok: false, err: 'maintenance' }))
  const now = w.now()
  w.tick(now)
  if ((WORLD_ACTIONS as readonly string[]).includes(a.type)) return social(w, slot, sock, a, now, ack)
  let r: ReturnType<typeof apply>
  try {
    r = apply({ ...w.ps.get(slot.id)!, seed: newSeed() }, a as Action, now) // khác luật giới: apply tự kiểm (parseAction)
    slot.errors = 0
  } catch (e) {
    // state bất biến: lỗi giữa chừng không làm hỏng gì, chỉ từ chối thao tác này
    r = { ok: false, error: 'bad' }
    w.env.log.error({ err: e, world: w.id, pid: slot.id, action: JSON.stringify(a).slice(0, 300) }, 'apply threw')
    if (++slot.errors >= 5) slot.broken = true
  }
  intents.inc({ result: r.ok ? 'ok' : r.error })
  if (!r.ok) {
    const err = r.error
    return w.persist.deliver(() => ack({ ok: false, err }))
  }
  w.commit(slot, r.state, { sock, ack })
  if (a.type === 'trib') w.armRaid() // có chỗ trên bản đồ: kiếp vân tụ, giải lúc giáng như trận giới
}

// Thao tác chạm tới tông môn khác (đi cướp): luật giới, có thể đổi state của nhiều người trong một bước
function social(w: World, slot: Slot, sock: Sock, raw: unknown, now: number, ack: (r: Ack) => void) {
  const a = parseWorldAction(raw)
  if (a && publicText(a).some(hasBad)) {
    intents.inc({ result: 'rude' })
    return w.persist.deliver(() => ack({ ok: false, err: 'rude' }))
  }
  let r: WorldResult
  try {
    if (!a) r = { ok: false, error: 'bad' }
    else if (!w.info.market && MARKET_ACTIONS.includes(a.type)) r = { ok: false, error: 'locked' }
    else r = w.play(slot.id, a, now)
  } catch (e) {
    r = { ok: false, error: 'bad' }
    w.env.log.error({ err: e, world: w.id, pid: slot.id }, 'worldAct threw')
  }
  intents.inc({ result: r.ok ? 'ok' : r.error })
  if (!r.ok) {
    const err = r.error
    return w.persist.deliver(() => ack({ ok: false, err }))
  }
  if (r.world !== w.shared) w.share(r.world)
  const mine = r.changed.has(slot.id)
  for (const [pid, s] of r.changed) {
    const other = w.slots.get(pid)
    if (other) w.commit(other, s, pid === slot.id ? { sock, ack } : undefined)
  }
  if (!mine) w.persist.deliver(() => ack({ ok: true }), true) // chỉ đổi phần chung (tiên minh): ack sau khi ghi
  w.armRaid()
}
