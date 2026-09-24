// Tông môn NPC (không tài khoản): phân đà tạo một lần lúc nhận giới; mỗi NPC_EVERY chơi một lượt như người thường (bot),
// giữ linh mạch trong vùng, chỉ phản kích kẻ đã đánh mình. Luật chơi của NPC ở @rok/rules/bot.
import { NPC_PER, advance, type State } from '@rok/rules'
import { atlas, regionOf, spawn, type WorldAction } from '@rok/rules/world'
import { npcHold, npcRevenge, npcState, turn } from '@rok/rules/bot'
import { loadText } from '@rok/i18n'
import * as store from '../db/store.ts'
import type { World } from './world.ts'

const vi = await loadText('vi') // tên phân đà NPC (tên tông môn là dữ liệu của giới, mọi người thấy cùng một tên)

// Lần đầu nhận giới: 2 phân đà NPC mỗi vùng ngoài, thế lực = vùng % 5 (tên 5 tông môn đối địch của P1). Tạo đúng một lần:
// trùng tên (đã tạo ở lần nhận trước mà chưa kịp ghi cờ) thì DB bỏ qua.
export async function ensureNpcs(w: World) {
  if (w.npcsMade) return
  const a = atlas(w.seed),
    now = w.now()
  const taken = [...w.ps.values()].flatMap(x => (x.seat ? [x.seat] : []))
  const count = new Map<number, number>()
  const rows: { name: string; nameKey: string; state: State }[] = []
  for (const r of a.regions.filter(r => r.ring === 0))
    for (let k = 0; k < NPC_PER; k++) {
      const f = r.i % 5
      const n = (count.get(f) ?? 0) + 1
      count.set(f, n)
      const seat = spawn(a, taken, Math.random)
      if (!seat || regionOf(a, seat) === undefined) continue
      taken.push(seat)
      const name = `${vi.sects[f].name} · ${vi.npc.branch(n)}`
      rows.push({ name, nameKey: name.normalize('NFC').toLowerCase(), state: npcState(now, name, seat) })
    }
  const made = await store.createNpcs(w.env.db, w.id, rows)
  for (const r of made) w.adopt(r)
  w.npcsMade = true
  w.persist.worldDirty = true
  w.maps.changed()
  w.persist.schedule()
}

// NPC một lượt: giữ linh mạch trong vùng, chơi như người thường (bot), phản kích kẻ vừa cướp mình nếu chắc thắng
export function npcTurn(w: World, now: number) {
  for (const pid of w.npc) {
    const slot = w.slots.get(pid)
    if (!slot) continue
    try {
      const hold = npcHold(w.ps.get(pid)!, atlas(w.seed), w.shared)
      if (hold) npcAct(w, pid, hold, now)
      w.commit(slot, turn(advance(w.ps.get(pid)!, now), { casual: true }))
      const revenge = npcRevenge(w.ps.get(pid)!, w.ps, now)
      if (revenge) npcAct(w, pid, revenge, now)
    } catch (err) {
      w.env.log.error({ err, world: w.id, pid }, 'npc turn failed')
    }
  }
  w.armRaid()
}

function npcAct(w: World, pid: number, a: WorldAction, now: number) {
  const r = w.play(pid, a, now)
  if (!r.ok) return
  if (r.world !== w.shared) w.share(r.world)
  w.commitAll(r.changed)
}
