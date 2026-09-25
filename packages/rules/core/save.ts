// Tông môn mới và save cũ: newGame, nâng bản, kiểm khuôn.
import { freshDaily, freshEv, freshWeekly } from './calendar.ts'
import { festLogin, rollFest } from './fest.ts'
import { freshVip, vipLogin } from './vip.ts'
import { type Tavern } from './types.ts'
// lượt miễn phí đầu tiên mở ngay (thiếp bạc, thiếp vàng) — người mới vào là có quà
const freshTavern = (now: number): Tavern => ({ silver: now, gold: now, pity: 0, last: null })
import { obj } from './parse.ts'
import { buildTime } from './stats.ts'
import { type Job, type State } from './types.ts'
import { bag, IDS, troops } from './util.ts'
import {
  ACHS,
  DAILY,
  DAOS,
  DRILL_MODS,
  ELDERS,
  EVENT_GOALS,
  FESTS,
  FIRST_ELDER,
  GEAR,
  MAX_LEVEL,
  METRICS,
  NEWBIE_SHIELD,
  PVP_START,
  QUESTS,
  REALMS,
  RESOURCES,
  SECTS,
  START,
  TRIBS,
  UNITS,
  WEEKLY,
  type BuildingId,
} from '../data.ts'

export const DEFAULT_NAME = 'Thanh Vân Tông'
export const SAVE_VERSION = 4 // đổi khuôn State: tăng số này, thêm một bước nâng bản trong upgradeSave

export function newGame(now: number, name = DEFAULT_NAME): State {
  const levels = Object.fromEntries(IDS.map(id => [id, 0])) as Record<BuildingId, number>
  levels.chuDien = 1
  const clean = name.trim().replace(/\s+/g, ' ').slice(0, 20) || DEFAULT_NAME
  // mở sẵn các sự kiện đang chạy (tân thủ…) và tính luôn ngày vào game đầu tiên
  return festLogin(vipLogin(rollFest(blank(now, clean, levels), now), now), now)
}
function blank(now: number, clean: string, levels: Record<BuildingId, number>): State {
  return {
    v: SAVE_VERSION,
    name: clean,
    quest: 0,
    time: now,
    res: { ...START },
    carry: bag(() => 0),
    levels,
    queue: [],
    troops: troops(() => 0),
    wounded: troops(() => 0),
    train: null,
    heal: null,
    study: null,
    brew: null,
    forge: null,
    tech: {},
    items: {},
    elders: { [FIRST_ELDER]: 0 },
    talents: {},
    gear: {},
    buffs: [],
    marches: [],
    reports: [],
    seen: 0,
    beast: 0,
    cool: {},
    sects: SECTS.map(() => false),
    realms: REALMS.map(() => 0),
    tower: 0,
    trib: 0,
    tribCool: 0,
    rebirths: 0,
    seed: now >>> 0 || 1,
    nextId: 1,
    stats: { trained: 0, healed: 0, brewed: 0, won: 0, lost: 0 },
    daily: freshDaily(now),
    weekly: freshWeekly(now),
    ev: freshEv(now),
    shield: now + NEWBIE_SHIELD,
    guard: null,
    pvp: { pts: PVP_START, win: 0, loss: 0 },
    foes: [],
    mail: [],
    seat: null,
    blocks: [],
    ascended: [],
    fest: {},
    born: now,
    vip: freshVip(),
    tavern: freshTavern(now),
    tokens: {},
    stars: {},
    ach: {},
  }
}

// Đọc save từ mọi phiên bản trước. Không nhận ra → null (người gọi cất bản sao rồi cho chơi mới).
const V2_QUESTS: [BuildingId, number][] = [
  ['tuLinhTran', 1],
  ['linhDien', 1],
  ['khoangMach', 1],
  ['chuDien', 2],
  ['tangBaoCac', 1],
  ['dienVoTruong', 1],
  ['tuLinhTran', 2],
  ['linhDien', 2],
  ['khoangMach', 2],
  ['chuDien', 3],
  ['tangBaoCac', 2],
  ['chuDien', 4],
  ['tangKinhCac', 1],
  ['danPhong', 1],
  ['chuDien', 5],
]
export function migrate(raw: unknown): State | null {
  try {
    const s = upgradeSave(raw)
    return s && valid(s) ? s : null
  } catch {
    return null // khuôn lạ tới mức nâng bản cũng vỡ
  }
}

// Save từ ngoài vào (nhập tay, file, bản sửa tay) có thể thiếu hay sai trường. Kiểm đủ khuôn trước khi chơi:
// thiếu là từ chối (người chơi được báo "save không hợp lệ"), không để game vỡ lúc vẽ rồi kẹt vòng lặp lỗi.
const num = (x: unknown) => typeof x === 'number' && Number.isFinite(x)
const isBag = (x: unknown) => obj(x) && RESOURCES.every(r => num(x[r]))
const isTroops = (x: unknown) => obj(x) && UNITS.every(u => num(x[u]) && x[u] >= 0)
const isTimed = (j: unknown) => j === null || (obj(j) && num(j.startAt) && num(j.finishAt))
const validMarch = (m: any) =>
  obj(m) &&
  Object.hasOwn(ELDERS, m.elder) &&
  (m.deputy === undefined || Object.hasOwn(ELDERS, m.deputy)) &&
  obj(m.army) &&
  obj(m.target) &&
  ['beast', 'sect', 'pvp', 'spot', 'trib', 'flag'].includes(m.target.kind) &&
  num(m.target.i) &&
  num(m.seed) &&
  num(m.startAt) &&
  num(m.arriveAt) &&
  num(m.returnAt)
function valid(s: any): s is State {
  return (
    s.v === SAVE_VERSION &&
    typeof s.name === 'string' &&
    num(s.quest) &&
    num(s.time) &&
    isBag(s.res) &&
    isBag(s.carry) &&
    obj(s.levels) &&
    IDS.every(id => num(s.levels[id]) && s.levels[id] >= 0 && s.levels[id] <= MAX_LEVEL) &&
    Array.isArray(s.queue) &&
    s.queue.every((j: any) => isTimed(j) && j && IDS.includes(j.building) && num(j.level)) &&
    isTroops(s.troops) &&
    isTroops(s.wounded) &&
    [s.train, s.heal, s.study, s.brew, s.forge].every(isTimed) &&
    (!s.forge || (Object.hasOwn(GEAR, s.forge.gear) && num(s.forge.level))) &&
    obj(s.tech) &&
    obj(s.items) &&
    obj(s.elders) &&
    Object.keys(s.elders).every(e => Object.hasOwn(ELDERS, e) && num(s.elders[e])) &&
    obj(s.talents) &&
    Object.entries(s.talents).every(
      ([e, t]) => Object.hasOwn(ELDERS, e) && Array.isArray(t) && t.length === 3 && t.every(num),
    ) &&
    obj(s.gear) &&
    Object.entries(s.gear).every(
      ([g, x]: [string, any]) =>
        Object.hasOwn(GEAR, g) && obj(x) && num(x.lv) && (x.on === undefined || Object.hasOwn(ELDERS, x.on)),
    ) &&
    Array.isArray(s.buffs) &&
    s.buffs.every(
      (b: any) => obj(b) && typeof b.key === 'string' && num(b.v) && num(b.until) && typeof b.src === 'string',
    ) &&
    Array.isArray(s.marches) &&
    s.marches.every(validMarch) &&
    Array.isArray(s.reports) &&
    s.reports.every(
      (r: any) => obj(r) && num(r.id) && Array.isArray(r.fights) && obj(r.gain) && obj(r.hurt) && obj(r.dead),
    ) &&
    num(s.seen) &&
    num(s.beast) &&
    obj(s.cool) &&
    num(s.tower) &&
    Array.isArray(s.sects) &&
    s.sects.length === SECTS.length &&
    Array.isArray(s.realms) &&
    s.realms.length === REALMS.length &&
    num(s.trib) &&
    num(s.tribCool) &&
    num(s.rebirths) &&
    num(s.seed) &&
    num(s.nextId) &&
    obj(s.stats) &&
    ['trained', 'healed', 'brewed', 'won', 'lost'].every(k => num(s.stats[k])) &&
    obj(s.daily) &&
    num(s.daily.day) &&
    obj(s.daily.n) &&
    Array.isArray(s.daily.got) &&
    s.daily.got.length === DAILY.length &&
    obj(s.weekly) &&
    num(s.weekly.week) &&
    obj(s.weekly.n) &&
    WEEKLY.every(w => num(s.weekly.n[w.id])) &&
    Array.isArray(s.weekly.got) &&
    s.weekly.got.length === WEEKLY.length &&
    obj(s.ev) &&
    num(s.ev.week) &&
    num(s.ev.pts) &&
    Array.isArray(s.ev.got) &&
    s.ev.got.length === EVENT_GOALS.length &&
    num(s.shield) &&
    (s.guard === null || Object.hasOwn(ELDERS, s.guard)) &&
    obj(s.pvp) &&
    num(s.pvp.pts) &&
    num(s.pvp.win) &&
    num(s.pvp.loss) &&
    Array.isArray(s.foes) &&
    s.foes.every((f: any) => obj(f) && num(f.pid) && typeof f.name === 'string' && num(f.at)) &&
    Array.isArray(s.mail) &&
    s.mail.every((m: any) => obj(m) && num(m.id) && num(m.at) && typeof m.k === 'string') &&
    (s.seat === null || (obj(s.seat) && num(s.seat.x) && num(s.seat.y))) &&
    Array.isArray(s.blocks) &&
    s.blocks.every(num) &&
    Array.isArray(s.ascended) &&
    s.ascended.every(num) &&
    validFest(s)
  )
}
const validFest = (s: any) =>
  obj(s.fest) &&
  Object.entries(s.fest).every(
    ([id, f]: [string, any]) =>
      Object.hasOwn(FESTS, id) &&
      obj(f) &&
      num(f.key) &&
      num(f.stage) &&
      obj(f.base) &&
      num(f.bank) &&
      Array.isArray(f.got),
  ) &&
  (s.born === undefined || num(s.born)) &&
  obj(s.vip) &&
  num(s.vip.pts) &&
  num(s.vip.streak) &&
  num(s.vip.day) &&
  num(s.vip.chest) &&
  obj(s.tavern) &&
  num(s.tavern.silver) &&
  num(s.tavern.gold) &&
  num(s.tavern.pity) &&
  obj(s.tokens) &&
  Object.entries(s.tokens).every(([e, n]) => Object.hasOwn(ELDERS, e) && num(n)) &&
  obj(s.stars) &&
  Object.entries(s.stars).every(([e, n]) => Object.hasOwn(ELDERS, e) && num(n)) &&
  obj(s.ach) &&
  Object.entries(s.ach).every(([k, n]) => Object.hasOwn(ACHS, k) && num(n)) &&
  (s.incoming === undefined ||
    (Array.isArray(s.incoming) &&
      s.incoming.every((x: any) => obj(x) && num(x.id) && num(x.pid) && typeof x.foe === 'string' && num(x.at)))) &&
  (s.frenzy === undefined || num(s.frenzy)) &&
  (s.moved === undefined || num(s.moved)) &&
  (s.builder2 === undefined || num(s.builder2)) &&
  (s.joined === undefined || num(s.joined)) &&
  (s.towerDay === undefined || num(s.towerDay)) &&
  (s.honor === undefined || num(s.honor)) &&
  (s.honorGot === undefined || num(s.honorGot)) &&
  (s.guestAt === undefined || num(s.guestAt)) &&
  (s.guests === undefined || num(s.guests)) &&
  (s.drill === undefined ||
    (obj(s.drill) &&
      num(s.drill.day) &&
      Object.hasOwn(ELDERS, s.drill.elder) &&
      obj(s.drill.army) &&
      num(s.drill.base) &&
      num(s.drill.wins) &&
      num(s.drill.got) &&
      [s.drill.mods, s.drill.offer ?? []].every(
        (l: unknown) => Array.isArray(l) && l.every(m => Object.hasOwn(DRILL_MODS, m)),
      ))) &&
  (s.dao === undefined || (obj(s.dao) && Object.hasOwn(DAOS, s.dao.id) && num(s.dao.at))) &&
  (s.fog === undefined ||
    (obj(s.fog) && Array.isArray(s.fog.rows) && s.fog.rows.every(num) && Array.isArray(s.fog.fly))) &&
  (s.visited === undefined || (Array.isArray(s.visited) && s.visited.every(num))) &&
  (s.contrib === undefined ||
    (obj(s.contrib) && num(s.contrib.credit) && num(s.contrib.full) && num(s.contrib.day) && num(s.contrib.helped))) &&
  (s.ap === undefined || (obj(s.ap) && num(s.ap.n) && num(s.ap.at))) &&
  (s.presets === undefined ||
    (Array.isArray(s.presets) &&
      s.presets.every((p: any) => p === null || (obj(p) && Object.hasOwn(ELDERS, p.elder) && obj(p.army))))) &&
  (s.pairs === undefined ||
    (obj(s.pairs) &&
      Object.entries(s.pairs).every(([e, d]) => Object.hasOwn(ELDERS, e) && Object.hasOwn(ELDERS, String(d))))) &&
  (s.pins === undefined ||
    (Array.isArray(s.pins) &&
      s.pins.every((p: any) => obj(p) && num(p.x) && num(p.y) && typeof p.text === 'string'))) &&
  (s.merchant === undefined || (obj(s.merchant) && num(s.merchant.slot) && Array.isArray(s.merchant.bought))) &&
  (s.mob === undefined ||
    (obj(s.mob) &&
      num(s.mob.week) &&
      num(s.mob.day) &&
      num(s.mob.took) &&
      Array.isArray(s.mob.got) &&
      (s.mob.task === null || (obj(s.mob.task) && METRICS.includes(s.mob.task.m) && num(s.mob.task.base)))))

function upgradeSave(raw: unknown) {
  let s = raw as any
  if (!s || typeof s !== 'object') return null
  if (s.v === 1) s = { ...s, v: 2, name: DEFAULT_NAME, quest: 0 }
  if (s.v === 2) {
    const fresh = newGame(s.time, s.name)
    const at = (i: number) =>
      QUESTS.findIndex(q => q.k === 'build' && q.id === V2_QUESTS[i][0] && q.n === V2_QUESTS[i][1])
    const quest = s.quest < V2_QUESTS.length ? at(s.quest) : at(V2_QUESTS.length - 1) + 1
    const levels = { ...fresh.levels, ...s.levels }
    s = {
      ...fresh,
      quest,
      time: s.time,
      res: s.res,
      carry: s.carry,
      levels,
      queue: s.queue.map((j: Job) => ({ ...j, startAt: j.finishAt - buildTime(fresh, j.building, j.level) })),
      trib: TRIBS.filter(t => t.hall < levels.chuDien).length, // bản cũ chưa có độ kiếp: coi như đã vượt
    }
  }
  if (s.v === 3 && typeof s.time === 'number') {
    // Bản 4: tầng 16–25 (công trình mới, đệ tử bậc 4–5, bí cảnh mới), pháp bảo, thiên phú, buff
    const zero = troops(() => 0)
    s = {
      ...s,
      v: 4,
      levels: { ...Object.fromEntries(IDS.map(id => [id, 0])), ...s.levels },
      troops: { ...zero, ...s.troops },
      wounded: { ...zero, ...s.wounded },
      realms: REALMS.map((_, i) => s.realms?.[i] ?? 0),
      forge: null,
      talents: {},
      gear: {},
      buffs: [],
    }
  }
  if (s.v !== SAVE_VERSION || typeof s.time !== 'number') return null
  // Trường thêm sau (trong cùng bản): thiếu thì lấy mặc định
  if (!s.daily) s = { ...s, daily: freshDaily(s.time) } // save làm trước khi có nhiệm vụ ngày
  if (!s.weekly) s = { ...s, weekly: freshWeekly(s.time) } // … nhiệm vụ tuần
  if (s.tower === undefined) s = { ...s, tower: 0 } // … Thông Thiên Tháp
  if (!s.fest) s = { ...s, fest: {}, born: s.time } // … trung tâm sự kiện (người cũ: sự kiện tân thủ tính từ lúc nâng bản)
  if (!s.vip) s = { ...s, vip: freshVip() } // … Hương Hỏa
  if (!s.tavern) s = { ...s, tavern: freshTavern(s.time), tokens: {}, stars: {} } // … Chiêu Hiền Đài
  if (!s.ach) s = { ...s, ach: {} } // … thành tựu
  if (!s.ev) s = { ...s, ev: freshEv(s.time) } // … PvP, thư, sự kiện tuần (người cũ không được khiên tân thủ)
  if (s.shield === undefined)
    s = { ...s, shield: 0, guard: null, pvp: { pts: PVP_START, win: 0, loss: 0 }, foes: [], mail: [] }
  if (s.seat === undefined) s = { ...s, seat: null } // … bản đồ giới
  if (!s.blocks) s = { ...s, blocks: [] } // … chat
  if (!s.ascended) s = { ...s, ascended: [] } // … mùa giải
  return s
}
