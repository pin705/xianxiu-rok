// Lật mùa và lật tuần của cả giới. Chạy trong actor như mọi việc khác (worldStep gọi trước mọi thao tác), ghi trong một commit.
import { randomInt } from 'node:crypto'
import { eventOf, mail, weekOf } from '@rok/rules'
import { arenaPrize, arenaTop, atlas, endSeason, eventPrize, eventTop, spawn } from '@rok/rules/world'
import { npcState } from '@rok/rules/bot'
import type { World } from './world.ts'

// Hết mùa: phi thăng / luân hồi cho mọi người (rules endSeason), bản đồ mới (seed mới), xếp chỗ lại, phân đà NPC làm lại,
// giữ tiên minh. Client được mời nối lại để nhận bản đồ mới.
export function seasonEnd(w: World, now: number) {
  const season = w.info.season
  const r = endSeason(w.ps, w.shared, w.map(now), now, season, w.npc)
  const top = r.top.slice(0, 3).map(x => ({ name: x.name, pts: x.pts }))
  w.fame = [{ season, at: now, top }, ...w.fame].slice(0, 10)
  w.seed = randomInt(1, 2 ** 31)
  w.opened = now
  w.info = { ...w.info, season: season + 1, map: w.seed, opened: now }
  w.persist.seasonDirty = true
  w.share(r.world)
  w.chron = []
  const a = atlas(w.seed),
    taken: { x: number; y: number }[] = []
  for (const [pid, slot] of w.slots) {
    const s = r.changed.get(pid) ?? w.ps.get(pid)
    const seat = s && spawn(a, taken, Math.random)
    if (!s || !seat) continue
    taken.push(seat)
    w.commit(slot, w.npc.has(pid) ? npcState(now, slot.name, seat) : { ...s, seat })
  }
  w.record({ at: now, k: 'season', a: [season + 1] })
  w.env.log.info({ world: w.id, season: season + 1, top: w.fame[0].top }, 'season ended')
  w.persist.deliver(() => {
    for (const slot of w.slots.values())
      for (const c of slot.conns) {
        c.emit('bye', { reason: 'season' })
        c.disconnect(true)
      }
  }, true)
}

// Hết tuần: top sự kiện của tuần cũ nhận quà qua thư (điểm vẫn còn trong state vì worldStep chạy trước mọi advance của tuần mới)
export function rollWeek(w: World, now: number) {
  const week = w.week
  eventTop(w.ps, week).forEach((pid, i) => {
    const gift = eventPrize(i)
    w.commit(w.slots.get(pid)!, mail(w.ps.get(pid)!, { at: now, k: 'eventTop', a: [i + 1, eventOf(week)], gift }))
  })
  // Luận Kiếm Đài: top tuần cũ nhận quà (điểm đài của tuần cũ còn nguyên — mỗi người tự nén lúc sang tuần)
  arenaTop(w.ps, week).forEach((pid, i) => {
    const s = w.ps.get(pid)!
    w.commit(w.slots.get(pid)!, mail(s, { at: now, k: 'arenaTop', a: [i + 1], gift: arenaPrize(i) }))
  })
  w.week = weekOf(now)
  w.persist.worldDirty = true
  w.persist.schedule()
}
