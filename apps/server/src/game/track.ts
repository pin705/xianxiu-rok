// Analytics phía server (client không phải gửi gì) và những chuyện cả giới biết (biên niên), suy ra từ một lần state đổi.
import { realmOf, type Report, type State } from '@rok/rules'
import type { Chron } from '@rok/rules/world'

export type Event = { name: string; at: number; props: object }
const NEWS_REALM = 3 // đột phá từ Kim Đan trở lên là chuyện cả giới biết

// rep: chiến báo mới của lần đổi này; npc: phân đà NPC (không ghi biên niên cho NPC)
export function milestones(prev: State, next: State, rep: Report[], npc: boolean): { events: Event[]; chron: Chron[] } {
  const at = next.time
  const events: Event[] = []
  const chron: Chron[] = []
  const hall = next.levels.chuDien
  if (hall > prev.levels.chuDien) events.push({ name: 'hall', at, props: { n: hall, rebirths: next.rebirths } })
  if (next.rebirths > prev.rebirths) events.push({ name: 'rebirth', at, props: { n: next.rebirths } })
  const fresh = rep.filter(r => r.id >= prev.nextId)
  for (const r of fresh) if (r.kind === 'trib') events.push({ name: 'trib', at, props: { win: r.win, hall } })
  for (const r of fresh)
    if (r.kind === 'pvp' && !r.def) {
      events.push({ name: 'raid', at, props: { win: r.win, foe: r.i, hall } })
      chron.push({ at: r.at, k: 'raid', a: [next.name, r.foe ?? '', r.win ? 1 : 0] })
    }
  if (hall > prev.levels.chuDien && realmOf(hall) >= NEWS_REALM && next.trib > prev.trib && !npc)
    chron.push({ at, k: 'trib', a: [next.name, hall] })
  return { events, chron }
}
