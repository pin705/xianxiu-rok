// Lật mùa và lật tuần của cả giới. Chạy trong actor như mọi việc khác (worldStep gọi trước mọi thao tác), ghi trong một commit.
import { randomInt } from 'node:crypto'
import { BOOK, MOB_MIN, MOB_PRIZES, eventOf, mail, weekOf } from '@rok/rules'
import {
  arenaPrize,
  arenaTop,
  atlas,
  bookStep,
  dayIn,
  endSeason,
  eventPrize,
  eventTop,
  legionStep,
  mobTop,
  spawn,
  warAt,
  warOf,
  warResolve,
  arkAt,
  arkOf,
  arkStep,
} from '@rok/rules/world'
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
  // Minh vụ: 3 minh điểm cao nhất tuần cũ, người đã góp đủ nhận quà hạng
  mobTop(w.shared, week).forEach((al, i) => {
    for (const [pid, n] of Object.entries(al.mob!.by)) {
      const slot = w.slots.get(Number(pid))
      if (slot && n >= MOB_MIN)
        w.commit(slot, mail(w.ps.get(slot.id)!, { at: now, k: 'mobTop', a: [i + 1], gift: MOB_PRIZES[i] }))
    }
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

// Thiên Đạo Biên Niên: mỗi phút xem chương đang mở — xong thì mọi tông môn (người thật) nhận quà qua thư, hụt thì ghi biên niên
const bookAt = new WeakMap<World, number>()
export function bookCheck(w: World, now: number) {
  if ((bookAt.get(w) ?? 0) > now) return
  bookAt.set(w, now + 60_000)
  const r = bookStep(w.shared, w.ps, w.map(now), now, dayIn(w.opened, now), w.npc)
  if (r.world === w.shared) return
  w.share(r.world)
  const ch = r.done ?? r.missed!
  w.record({ at: now, k: 'book', a: [ch, r.done === undefined ? 0 : 1] })
  if (r.done === undefined) return
  for (const [pid, slot] of w.slots)
    if (!w.npc.has(pid)) w.commit(slot, mail(w.ps.get(pid)!, { at: now, k: 'book', a: [ch], gift: BOOK[ch].reward }))
}

// Luận Kiếm Minh Chiến: tới 20h thứ Bảy mà tuần này chưa giải thì giải (một lần mỗi tuần), ghi biên niên từng cặp
// Sự kiện tiên minh có giờ: Luận Kiếm Minh Chiến (tối thứ Bảy), Ma Triều Công Sơn (tối thứ Tư) — mỗi nhịp xem tới giờ chưa
export function allyEvents(w: World, now: number) {
  legionCheck(w, now)
  warCheck(w, now)
  arkCheck(w, now)
}
// Ma Triều Công Sơn: tới giờ thì giải các đợt (mỗi đợt một lần), đợt cuối xong thì quà qua thư
function legionCheck(w: World, now: number) {
  const r = legionStep(w.ps, w.shared, now, randomInt(1, 2 ** 31))
  if (r.world === w.shared) return
  w.share(r.world)
  for (const [pid, s] of r.changed) {
    const slot = w.slots.get(pid)
    if (slot) w.commit(slot, s)
  }
}
// Tranh Đoạt Linh Châu: tối Chủ nhật dựng trận, giải từng hiệp tới hạn, hết trận thì quà — mỗi nhịp xem có gì tới hạn
function arkCheck(w: World, now: number) {
  // 10 phút trước giờ: nhắc (Web Push) người của các minh đã ghi danh — một lần mỗi tuần
  const ark = arkOf(w.shared),
    wk = weekOf(now)
  if (now >= arkAt(wk) - 10 * 60_000 && now < arkAt(wk) && (ark.warned ?? -1) < wk && ark.signed.length) {
    w.share({ ...w.shared, ark: { ...ark, warned: wk } })
    for (const id of ark.signed)
      for (const pid of Object.keys(w.shared.allies[id]?.members ?? {}).map(Number))
        if (!w.npc.has(pid)) w.env.push?.(pid, L => ({ title: L.push.title, body: L.push.arkSoon, tag: 'ark' }))
  }
  const r = arkStep(w.ps, w.shared, now, randomInt(1, 2 ** 31))
  if (r.world === w.shared) return
  w.share(r.world)
  for (const [pid, s] of r.changed) {
    const slot = w.slots.get(pid)
    if (slot) w.commit(slot, s)
  }
}
function warCheck(w: World, now: number) {
  const wk = weekOf(now)
  if (now < warAt(wk) || warOf(w.shared).done >= wk) return
  const r = warResolve(w.ps, w.shared, now, randomInt(1, 2 ** 31))
  w.share(r.world)
  for (const [pid, s] of r.changed) {
    const slot = w.slots.get(pid)
    if (slot) w.commit(slot, s)
  }
  for (const x of r.results) w.record({ at: now, k: 'war', a: [x.an, x.bn, x.wa, x.wb] })
}
