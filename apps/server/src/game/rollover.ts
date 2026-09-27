// Lật mùa và lật tuần của cả giới. Chạy trong actor như mọi việc khác (worldStep gọi trước mọi thao tác), ghi trong một commit.
import { randomInt } from 'node:crypto'
import {
  BOOK,
  BOOK_TOP_PRIZES,
  FEST_ALLY,
  FEST_ALLY_PRIZES,
  FEST_RANKED,
  FEST_STAGED,
  FEST_STAGE_PRIZES,
  FEST_STAR_TOKENS,
  FEST_TOP,
  MOB_MIN,
  MOB_PRIZES,
  DAY,
  DAY_OFFSET,
  dayOf,
  eventOf,
  festAt,
  festEnded,
  festStar,
  mail,
  weekOf,
  weekStart,
  type FestId,
} from '@rok/rules'
import {
  arenaPrize,
  arenaTop,
  atlas,
  bookStep,
  dayIn,
  endSeason,
  eventPrize,
  eventTop,
  festAllyBoard,
  festBoard,
  festPrize,
  allyOf,
  legionStep,
  mobTop,
  spawn,
  warAt,
  warOf,
  warResolve,
  arkAt,
  arkOf,
  arkStep,
  betSettle,
  heroStep,
  heroWinners,
  paperStep,
  SEASON_DAYS,
  partyStep,
  convoyStep,
  assaultStep,
  royaleStep,
  daibiStep,
  silverStep,
  vanchuStep,
  mysticStep,
  aquizStep,
  wallStep,
  planStep,
  tourneyStep,
} from '@rok/rules/world'
import { npcState } from '@rok/rules/bot'
import type { World } from './world.ts'

// Hết mùa: phi thăng / luân hồi cho mọi người (rules endSeason), bản đồ mới (seed mới), xếp chỗ lại, phân đà NPC làm lại,
// giữ tiên minh. Client được mời nối lại để nhận bản đồ mới.
export function seasonEnd(w: World, now: number) {
  const season = w.info.season
  const r = endSeason(w.ps, w.shared, w.map(now), now, season, w.npc)
  const top = r.top.slice(0, 3).map(x => ({ name: x.name, pts: x.pts }))
  // Lưu Danh Sử Sách: anh kiệt được bình chọn mỗi hạng mục lên Phong Thần Bảng cùng top mùa
  const heroes = heroWinners(w.shared).flatMap((h, k) => (h ? [{ k, name: w.ps.get(h.pid)?.name ?? '?' }] : []))
  w.fame = [{ season, at: now, top, ...(heroes.length && { heroes }) }, ...w.fame].slice(0, 10)
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

// Quà bảng xếp hạng một lượt lễ: top FEST_TOP người; lễ có bảng tiên minh (FEST_ALLY) — người có điểm trong các minh đầu thêm quà
// hạng minh
function festPay(w: World, now: number, id: FestId, key: number) {
  const give = (pid: number, m: Parameters<typeof mail>[1]) => {
    const slot = w.slots.get(pid)
    if (slot) w.commit(slot, mail(w.ps.get(pid)!, m))
  }
  const board = festBoard(w.ps, id, key, w.npc)
  const star = festStar(id, key) // trưởng lão của đợt: top hạng thêm tín vật người đó
  board.slice(0, FEST_TOP).forEach(([pid], i) => {
    const n = star ? (FEST_STAR_TOKENS[i] ?? 0) : 0
    const gift = n ? { ...festPrize(i), tokens: { [star!]: n } } : festPrize(i)
    give(pid, { at: now, k: 'festTop', a: [i + 1, id], gift })
  })
  if (!(FEST_ALLY as readonly FestId[]).includes(id)) return
  festAllyBoard(w.ps, w.shared, id, key, w.npc)
    .slice(0, FEST_ALLY_PRIZES.length)
    .forEach(([aid], i) => {
      const tag = w.shared.allies[aid]?.tag ?? '?'
      for (const [pid] of board)
        if (allyOf(w.shared, pid)?.id === aid)
          give(pid, { at: now, k: 'festAlly', a: [i + 1, id, tag], gift: FEST_ALLY_PRIZES[i] })
    })
}
// Tông Môn Tranh Bá (Stage Rankings của MGE): qua 0h thì ải hôm trước xong — top FEST_TOP điểm riêng của ải đó nhận quà ải qua thư.
// Ngày đã trao ghi ở phần chung (stageDay): mỗi ải đúng một lần, server tắt vài ngày thì trao bù (tối đa 7 ngày)
function stageCheck(w: World, now: number) {
  const day = dayOf(now),
    last = w.shared.stageDay
  if (last === day) return
  for (let d = Math.max((last ?? day) + 1, day - 6); d <= day; d++) {
    const t = d * DAY - DAY_OFFSET - 1 // phút chót của hôm trước
    for (const id of FEST_STAGED) {
      const at = festAt(id, t, w.opened)
      if (!at) continue
      festBoard(w.ps, id, at.key, w.npc, at.stage)
        .slice(0, FEST_TOP)
        .forEach(([pid], i) => {
          const slot = w.slots.get(pid)
          const gift = FEST_STAGE_PRIZES[i === 0 ? 0 : i < 3 ? 1 : 2]
          if (slot)
            w.commit(slot, mail(w.ps.get(pid)!, { at: now, k: 'festStage', a: [i + 1, id, at.stage + 1], gift }))
        })
    }
  }
  w.share({ ...w.shared, stageDay: day })
}
// Hết tuần: top sự kiện của tuần cũ nhận quà qua thư (điểm vẫn còn trong state vì worldStep chạy trước mọi advance của tuần mới)
export function rollWeek(w: World, now: number) {
  const week = w.week
  eventTop(w.ps, week, w.npc).forEach((pid, i) => {
    const gift = eventPrize(i)
    w.commit(w.slots.get(pid)!, mail(w.ps.get(pid)!, { at: now, k: 'eventTop', a: [i + 1, eventOf(week)], gift }))
  })
  // Lễ có xếp hạng: mỗi lượt kết thúc từ đầu tuần cũ tới giờ — top FEST_TOP điểm nhận quà hạng
  for (const id of FEST_RANKED)
    for (const key of festEnded(id, weekStart(week), now, w.opened)) festPay(w, now, id, key)
  // Minh vụ: 3 minh điểm cao nhất tuần cũ, người đã góp đủ nhận quà hạng
  mobTop(w.shared, week).forEach((al, i) => {
    for (const [pid, n] of Object.entries(al.mob!.by)) {
      const slot = w.slots.get(Number(pid))
      if (slot && n >= MOB_MIN)
        w.commit(slot, mail(w.ps.get(slot.id)!, { at: now, k: 'mobTop', a: [i + 1], gift: MOB_PRIZES[i] }))
    }
  })
  // Luận Kiếm Đài: top tuần cũ nhận quà (điểm đài của tuần cũ còn nguyên — mỗi người tự nén lúc sang tuần)
  for (const top of arenaTop(w.ps, week))
    top.forEach((pid, i) => {
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
  const ch = r.done ?? r.missed
  if (ch === undefined) return // chỉ ghi chỉ số bắt đầu cho người mới
  w.record({ at: now, k: 'book', a: [ch, r.done === undefined ? 0 : 1] })
  if (r.done === undefined) return
  for (const [pid, slot] of w.slots)
    if (!w.npc.has(pid)) w.commit(slot, mail(w.ps.get(pid)!, { at: now, k: 'book', a: [ch], gift: BOOK[ch].reward }))
  // công đầu: người góp nhiều nhất chương này thêm quà theo hạng
  r.top?.forEach(([pid], i) => {
    const slot = w.slots.get(pid)
    const gift = BOOK_TOP_PRIZES[i === 0 ? 0 : i < 3 ? 1 : 2]
    if (slot) w.commit(slot, mail(w.ps.get(pid)!, { at: now, k: 'bookTop', a: [ch, i + 1], gift }))
  })
}

// Luận Kiếm Minh Chiến: tới 20h thứ Bảy mà tuần này chưa giải thì giải (một lần mỗi tuần), ghi biên niên từng cặp
// Sự kiện có giờ: quà ải Tranh Bá (0h), Luận Kiếm Minh Chiến (tối thứ Bảy), Ma Triều Công Sơn (tối thứ Tư)… — mỗi nhịp xem tới giờ chưa
export function allyEvents(w: World, now: number) {
  stageCheck(w, now)
  aquizCheck(w, now)
  legionCheck(w, now)
  warCheck(w, now)
  arkCheck(w, now)
  partyCheck(w, now)
  convoyCheck(w, now)
  assaultCheck(w, now)
  royaleCheck(w, now)
  daibiCheck(w, now)
  silverCheck(w, now)
  vanchuCheck(w, now)
  mysticCheck(w, now)
  wallCheck(w, now)
  planCheck(w, now)
  tourneyCheck(w, now)
  heroCheck(w, now)
  paperCheck(w, now)
}
// Giới Báo: qua 0h thì ra số báo hôm trước (kỷ lục từng mục) và lấy mốc chỉ số mới
function paperCheck(w: World, now: number) {
  const next = paperStep(w.ps, w.shared, now, w.npc)
  if (next !== w.shared) w.share(next)
}
// Lưu Danh Sử Sách: mở bình chọn (ba ngày cuối mùa) thì chốt ứng viên, một lần mỗi mùa
function heroCheck(w: World, now: number) {
  const next = heroStep(w.ps, w.shared, w.map(now).day, w.npc)
  if (next !== w.shared) w.share(next)
}
// Luận Kiếm Đại Hội: tuần cuối mùa, mỗi ngày một vòng loại trực tiếp; có Kiếm Khôi thì ghi biên niên
function tourneyCheck(w: World, now: number) {
  const r = tourneyStep(w.ps, w.shared, dayIn(w.opened, now), now, randomInt(1, 2 ** 31), w.npc)
  if (r.world === w.shared) return
  const champ = r.world.tourney?.champ
  if (champ !== undefined && w.shared.tourney?.champ === undefined)
    w.record({ at: now, k: 'duel', a: [w.ps.get(champ)?.name ?? '?'] })
  w.share(r.world)
  for (const [pid, s] of r.changed) {
    const slot = w.slots.get(pid)
    if (slot) w.commit(slot, s)
  }
}
// Minh sự lịch: PLAN_WARN trước giờ nhắc người đã bấm tham gia (Web Push)
function planCheck(w: World, now: number) {
  const r = planStep(w.shared, now)
  if (r.world === w.shared) return
  w.share(r.world)
  for (const [pid, text] of r.remind)
    if (!w.npc.has(pid)) w.env.push?.(pid, L => ({ title: L.push.title, body: L.push.plan(text), tag: 'plan' }))
}
// Sơn môn thất thủ: trận lực về 0 lúc núi cháy thì tông môn bị đánh bật sang chỗ trống ngẫu nhiên (tông môn NPC thì không)
function wallCheck(w: World, now: number) {
  for (const [pid, s] of wallStep(w.ps, atlas(w.seed), now, randomInt(1, 2 ** 31), w.npc)) {
    const slot = w.slots.get(pid)
    if (slot) w.commit(slot, s)
    w.env.push?.(pid, L => ({ title: L.push.title, body: L.push.wallFall, tag: 'raid' }))
  }
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
// Luận Đạo Vấn Đáp: phiên hết giờ thì chấm, người có trả lời nhận thư (quà theo mốc điểm minh)
function aquizCheck(w: World, now: number) {
  const r = aquizStep(w.ps, w.shared, now)
  if (r.world === w.shared) return
  w.share(r.world)
  for (const [pid, s] of r.changed) {
    const slot = w.slots.get(pid)
    if (slot) w.commit(slot, s)
  }
}
// Man Hoang Cổ Tộc: phòng tổ đội đủ người hay hết giờ chờ thì giải (mầm bí mật của server), quà qua thư
function partyCheck(w: World, now: number) {
  const r = partyStep(w.ps, w.shared, now, randomInt(1, 2 ** 31))
  if (r.world === w.shared) return
  w.share(r.world)
  for (const [pid, s] of r.changed) {
    const slot = w.slots.get(pid)
    if (slot) w.commit(slot, s)
  }
}
// Linh Thương Hộ Tống: đoàn buôn tới giờ khởi hành hay đủ người thì giải (mầm bí mật của server), quà qua thư
function convoyCheck(w: World, now: number) {
  const r = convoyStep(w.ps, w.shared, now, randomInt(1, 2 ** 31))
  if (r.world === w.shared) return
  w.share(r.world)
  for (const [pid, s] of r.changed) {
    const slot = w.slots.get(pid)
    if (slot) w.commit(slot, s)
  }
}
// Vây Công Yêu Vương: phòng 12 người đủ người hay hết giờ chờ thì giải (mầm bí mật của server), thư cho người trong phòng
function assaultCheck(w: World, now: number) {
  const r = assaultStep(w.ps, w.shared, now, randomInt(1, 2 ** 31))
  if (r.world === w.shared) return
  w.share(r.world)
  for (const [pid, s] of r.changed) {
    const slot = w.slots.get(pid)
    if (slot) w.commit(slot, s)
  }
}
// Cổ Khư Loạn Chiến: hàng chờ đủ người (hay chờ lâu thì bù tông môn NPC) thì giải ngay (mầm bí mật của server), thư hạng
function royaleCheck(w: World, now: number) {
  const r = royaleStep(w.ps, w.shared, now, randomInt(1, 2 ** 31), [...w.npc])
  if (r.world === w.shared) return
  w.share(r.world)
  for (const [pid, s] of r.changed) {
    const slot = w.slots.get(pid)
    if (slot) w.commit(slot, s)
  }
}
// Tiên Môn Đại Bỉ: hàng chờ đủ 10 người (hay chờ lâu thì bù tông môn NPC) thì chia đội, giải 3 hiệp (mầm bí mật của server)
function daibiCheck(w: World, now: number) {
  const r = daibiStep(w.ps, w.shared, now, randomInt(1, 2 ** 31), [...w.npc])
  if (r.world === w.shared) return
  w.share(r.world)
  for (const [pid, s] of r.changed) {
    const slot = w.slots.get(pid)
    if (slot) w.commit(slot, s)
  }
}
// Tán Tu Tranh Châu: hàng chờ đủ 16 tán tu (hay chờ lâu thì bù tông môn NPC) thì chia hai đội, giải trọn trận Linh Châu
function silverCheck(w: World, now: number) {
  const r = silverStep(w.ps, w.shared, now, randomInt(1, 2 ** 31), [...w.npc])
  if (r.world === w.shared) return
  w.share(r.world)
  for (const [pid, s] of r.changed) {
    const slot = w.slots.get(pid)
    if (slot) w.commit(slot, s)
  }
}
// Vân Chu Hội Chiến: hàng chờ đủ 10 người (hay chờ lâu thì bù tông môn NPC) thì chia hai đội, giải ngay (mầm bí mật của server)
function vanchuCheck(w: World, now: number) {
  const r = vanchuStep(w.ps, w.shared, now, randomInt(1, 2 ** 31), [...w.npc])
  if (r.world === w.shared) return
  w.share(r.world)
  for (const [pid, s] of r.changed) {
    const slot = w.slots.get(pid)
    if (slot) w.commit(slot, s)
  }
}
// Huyễn Vực Bí Cảnh: mỗi độ khó, hàng chờ đủ 4 người (hay chờ lâu thì bù tông môn NPC) thì ghép đội, giải ba màn
function mysticCheck(w: World, now: number) {
  const r = mysticStep(w.ps, w.shared, now, randomInt(1, 2 ** 31), [...w.npc])
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
  const r = arkStep(w.ps, w.shared, now, randomInt(1, 2 ** 31), w.opened + SEASON_DAYS * 86_400_000)
  if (r.world === w.shared) return
  const champ = r.world.ark?.cup?.final?.[0]
  if (champ !== undefined && !ark.cup?.final) w.record({ at: now, k: 'cup', a: [r.world.allies[champ]?.tag ?? '?'] })
  const bet = betSettle(new Map([...w.ps, ...r.changed]), r.world, now) // Luận Kiếm Đặt Cược: trận playoff vừa xong thì trả cược
  w.share(bet.world)
  for (const [pid, s] of [...r.changed, ...bet.changed]) {
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
