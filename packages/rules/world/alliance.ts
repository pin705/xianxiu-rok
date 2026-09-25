// Tiên minh: lập, vào, chức vị, bố cáo, nhờ giúp / giúp việc, viện binh (đóng quân ở nhà đồng minh).
import { no } from '../core/action.ts'
import { fieldError, launch } from '../core/battle.ts'
import { cleanText, isId, int, isElder, JOB_KINDS, oneOf, pickArmy } from '../core/parse.ts'
import { power } from '../core/stats.ts'
import { advance, hasten, jobOf } from '../core/time.ts'
import { type Army, type JobKind, type March, type State } from '../core/types.ts'
import { compact } from '../core/util.ts'
import {
  ALLY_COST,
  ALLY_ELDERS,
  ALLY_HALL,
  HELP_MIN,
  HELP_SHARE,
  PVP_START,
  REINFORCE_MAX,
  RESOURCES,
  TITLE_IDS,
  type DaoId,
  type ElderId,
  type TitleId,
} from '../data.ts'
import {
  aidAt,
  allyOf,
  welcome,
  helpCredit,
  helpsOf,
  put,
  raidPath,
  seatsOf,
  type Alliance,
  type Ctx,
  type Help,
  type Players,
  type Rally,
  type Role,
  type WarResult,
  type World,
  type WorldActions,
  type WorldResult,
} from './base.ts'

const drop = (w: World, aid: number): World => {
  const { [aid]: _, ...allies } = w.allies
  return { ...w, allies }
}
// Rời minh: bỏ luôn các việc đang nhờ; minh chủ đi thì người chức cao nhất (vào sớm nhất) lên thay; còn mỗi mình thì giải tán
function leave(w: World, al: Alliance, pid: number): World {
  const { [pid]: role, ...members } = al.members
  const rest = Object.keys(members).map(Number)
  if (!rest.length) return drop(w, al.id)
  if (role === 2) {
    const heir = rest.sort((x, y) => members[y] - members[x] || x - y)[0]
    members[heir] = 2
  }
  return put(w, { ...al, members, helps: al.helps.filter(h => h.pid !== pid) })
}
// Vào minh: thêm làm thành viên, bỏ khỏi đơn / lời mời của mọi minh
function join(w: World, al: Alliance, pid: number): World {
  let next = put(w, { ...al, members: { ...al.members, [pid]: -2 } })
  for (const x of Object.values(next.allies))
    if (x.apps?.includes(pid) || x.invites?.includes(pid))
      next = put(next, { ...x, apps: x.apps?.filter(p => p !== pid), invites: x.invites?.filter(p => p !== pid) })
  return next
}
// Cho client: danh sách minh (tìm để vào), minh của mình với người trong đó
// closed: phải xin vào · asked: mình đã gửi đơn · invited: minh đã mời mình
export type AllyRow = {
  id: number
  name: string
  tag: string
  n: number
  max: number
  power: number
  closed: boolean
  asked: boolean
  invited: boolean
}
export type Member = { pid: number; name: string; role: Role; hall: number; power: number; online: boolean }
// war: Luận Kiếm Minh Chiến — đã ghi danh tuần này chưa, điểm minh chiến, kết quả lần giải gần nhất của cả giới
export type AllyInfo = Alliance & {
  people: Member[]
  applicants: { pid: number; name: string; hall: number; power: number }[] // đơn xin vào đang chờ
  rallies: Rally[]
  war: { signed: boolean; pts: number; last: WarResult[] }
  // Ma Triều Công Sơn của tuần `week` (client so với tuần hiện tại): minh đã ghi danh chưa, số đợt đã đánh, điểm minh, điểm mình
  legion: { week: number; signed: boolean; done: number; pts: number; mine: number }
}
export const allyRows = (w: World, ps: Players, me = 0): AllyRow[] =>
  Object.values(w.allies)
    .map(al => ({
      id: al.id,
      name: al.name,
      tag: al.tag,
      n: Object.keys(al.members).length,
      max: seatsOf(al),
      closed: !!al.closed,
      asked: !!al.apps?.includes(me),
      invited: !!al.invites?.includes(me),
      power: Object.keys(al.members).reduce((sum, p) => {
        const s = ps.get(Number(p))
        return sum + (s ? Math.round(power(s)) : 0)
      }, 0),
    }))
    .sort((a, b) => b.power - a.power || a.id - b.id)
export function allyInfo(w: World, ps: Players, pid: number, online: (pid: number) => boolean): AllyInfo | null {
  const al = allyOf(w, pid)
  if (!al) return null
  const people = Object.entries(al.members).map(([p, role]) => {
    const s = ps.get(Number(p))
    return {
      pid: Number(p),
      name: s?.name ?? '?',
      role,
      hall: s?.levels.chuDien ?? 0,
      power: s ? Math.round(power(s)) : 0,
      online: online(Number(p)),
    }
  })
  return {
    ...al,
    people: people.sort((a, b) => b.role - a.role || b.power - a.power),
    applicants: (al.apps ?? []).flatMap(p => {
      const s = ps.get(p)
      return s ? [{ pid: p, name: s.name, hall: s.levels.chuDien, power: Math.round(power(s)) }] : []
    }),
    rallies: Object.values(w.rallies).filter(r => r.ally === al.id),
    war: {
      signed: !!w.war?.signed.includes(al.id),
      pts: w.war?.pts[al.id] ?? PVP_START,
      last: w.war?.last ?? [],
    },
    legion: {
      week: w.legion?.week ?? -1,
      signed: !!w.legion?.signed.includes(al.id),
      done: w.legion?.done ?? 0,
      pts: w.legion?.pts[al.id] ?? 0,
      mine: w.legion?.by[pid] ?? 0,
    },
  }
}

// Hồ sơ chưởng môn mà người khác xem được (như Governor Profile của RoK): không lộ kho, quân, mầm
export type Profile = {
  pid: number
  name: string
  hall: number
  power: number
  ally: { tag: string; name: string; role: Role } | null
  seat: { x: number; y: number } | null
  pvp: { win: number; loss: number; pts: number }
  rebirths: number
  ascended: number // số mùa đã phi thăng
  tower: number
  elders: number
  ach: number // tổng bậc thành tựu đã nhận
  kp: number // chiến công
  online: boolean
  title: TitleId | null // tước Giới Chủ phong (còn hạn)
  lord: boolean // chính là Giới Chủ
  crown?: boolean // người xem là Giới Chủ: sắc phong được cho người này
  boon?: number // người xem là Giới Chủ: Thiên Ân lễ còn ban được tuần này
  invite?: boolean // người xem là trưởng lão / minh chủ, người này chưa vào minh nào: mời được
  dao?: DaoId // đạo thống đang theo
}
export function profileOf(
  w: World,
  ps: Players,
  pid: number,
  online: boolean,
  now = 0,
  lord: number | null = null,
): Profile | null {
  const s = ps.get(pid)
  if (!s) return null
  const al = allyOf(w, pid)
  return {
    pid,
    name: s.name,
    hall: s.levels.chuDien,
    power: Math.round(power(s)),
    ally: al ? { tag: al.tag, name: al.name, role: al.members[pid] } : null,
    seat: s.seat,
    pvp: s.pvp,
    rebirths: s.rebirths,
    ...(s.dao && { dao: s.dao.id }),
    ascended: s.ascended.length,
    tower: s.tower,
    elders: Object.keys(s.elders).length,
    ach: Object.values(s.ach ?? {}).reduce((a, b) => a + (b ?? 0), 0),
    kp: s.stats.kp ?? 0,
    online,
    title: TITLE_IDS.find(id => w.titles?.[id]?.pid === pid && w.titles[id]!.until > now) ?? null,
    lord: lord === pid,
  }
}

export const helpMs = (job: { startAt: number; finishAt: number }) =>
  Math.max(HELP_MIN, Math.round((job.finishAt - job.startAt) * HELP_SHARE))

// việc nhờ đồng minh giúp: mọi việc hẹn giờ trừ luyện đan (đan không rút ngắn được)
const HELP_JOBS = JOB_KINDS.filter(k => k !== 'brew')
export const rank = (al: Alliance, pid: number) => al.members[pid] ?? -9

export type AllianceAction =
  | { type: 'allyFound'; name: string; tag: string }
  | { type: 'allyJoin'; id: number }
  | { type: 'allyLeave' }
  | { type: 'allyKick'; pid: number }
  | { type: 'allyRole'; pid: number; role: Role }
  | { type: 'allyNotice'; text: string }
  | { type: 'allyOpen'; open: boolean } // mở / đóng (phải duyệt đơn)
  | { type: 'allyAccept'; pid: number; ok: boolean } // duyệt đơn: nhận / từ chối
  | { type: 'allyInvite'; pid: number }
  | { type: 'helpAsk'; job: JobKind }
  | { type: 'helpAll' }
  | { type: 'aid'; pid: number; elder: ElderId; army: Army } // viện binh: đóng quân ở nhà đồng minh

export const allianceActions: WorldActions<AllianceAction> = {
  allyFound: {
    pick: a => {
      const name = cleanText(a.name),
        tag = cleanText(a.tag).toUpperCase()
      return /^[\p{L}\p{N} ]{2,20}$/u.test(name) && /^[\p{Lu}\p{N}]{2,4}$/u.test(tag)
        ? { type: 'allyFound', name, tag }
        : null
    },
    run: ({ w, pid, s, now }, a) => {
      if (allyOf(w, pid)) return no('busy')
      if (s.levels.chuDien < ALLY_HALL) return no('locked')
      if (Object.values(w.allies).some(x => x.name.toLowerCase() === a.name.toLowerCase() || x.tag === a.tag))
        return no('taken')
      if (RESOURCES.some(r => s.res[r] < ALLY_COST)) return no('not_enough')
      const al: Alliance = {
        id: w.nextAlly,
        name: a.name,
        tag: a.tag,
        members: { [pid]: 2 },
        notice: '',
        at: now,
        helps: [],
      }
      const paid = { ...s, res: Object.fromEntries(RESOURCES.map(r => [r, s.res[r] - ALLY_COST])) as State['res'] }
      return {
        ok: true,
        world: { ...put(w, al), nextAlly: w.nextAlly + 1 },
        changed: new Map([[pid, welcome(paid, al.name, now)]]),
      }
    },
  },
  allyJoin: {
    pick: a => (isId(a.id) ? { type: 'allyJoin', id: a.id } : null),
    // minh mở hoặc được mời: vào thẳng; minh đóng: gửi đơn chờ trưởng lão / minh chủ duyệt
    run: ({ w, pid, s }, a) => {
      const al = w.allies[a.id]
      if (allyOf(w, pid)) return no('busy')
      if (!al) return no('gone')
      if (Object.keys(al.members).length >= seatsOf(al)) return no('full')
      if (al.closed && !al.invites?.includes(pid)) {
        if (al.apps?.includes(pid)) return no('claimed')
        return { ok: true, changed: new Map(), world: put(w, { ...al, apps: [...(al.apps ?? []), pid] }) }
      }
      return { ok: true, changed: new Map([[pid, welcome(s, al.name, s.time)]]), world: join(w, al, pid) }
    },
  },
  allyLeave: {
    pick: () => ({ type: 'allyLeave' }),
    run: ({ w, pid }) => {
      const mine = allyOf(w, pid)
      return mine ? { ok: true, changed: new Map(), world: leave(w, mine, pid) } : no('locked')
    },
  },
  allyKick: {
    pick: a => (isId(a.pid) ? { type: 'allyKick', pid: a.pid } : null),
    run: ({ w, pid }, a) => {
      const mine = allyOf(w, pid)
      const their = mine?.members[a.pid]
      if (!mine || their === undefined || a.pid === pid) return no('bad')
      if (rank(mine, pid) < 1 || their >= rank(mine, pid)) return no('locked')
      return { ok: true, changed: new Map(), world: leave(w, mine, a.pid) }
    },
  },
  allyRole: {
    pick: a => (isId(a.pid) && int(-2, 2)(a.role) ? { type: 'allyRole', pid: a.pid, role: a.role as Role } : null),
    // minh chủ xếp mọi bậc (R5: nhường minh chủ); đường chủ (R4) chỉ xếp R1–R3 cho người dưới mình
    run: ({ w, pid }, a) => {
      const mine = allyOf(w, pid)
      const their = mine?.members[a.pid]
      if (!mine || their === undefined || a.pid === pid) return no('bad')
      const me = rank(mine, pid)
      if (me < 1 || (me === 1 && Math.max(their, a.role) >= 1)) return no('locked')
      if (a.role === 1 && Object.values(mine.members).filter(r => r === 1).length >= ALLY_ELDERS && their !== 1)
        return no('full')
      // nhường minh chủ: mình xuống đường chủ
      const members = { ...mine.members, [a.pid]: a.role, ...(a.role === 2 && { [pid]: 1 as Role }) }
      return { ok: true, changed: new Map(), world: put(w, { ...mine, members }) }
    },
  },
  allyNotice: {
    pick: a => {
      const text = cleanText(a.text)
      return text.length <= 200 ? { type: 'allyNotice', text } : null
    },
    run: ({ w, pid }, a) => {
      const mine = allyOf(w, pid)
      if (!mine || rank(mine, pid) < 1) return no('locked')
      return { ok: true, changed: new Map(), world: put(w, { ...mine, notice: a.text }) }
    },
  },
  allyOpen: {
    pick: a => (typeof a.open === 'boolean' ? { type: 'allyOpen', open: a.open } : null),
    run: ({ w, pid }, a) => {
      const mine = allyOf(w, pid)
      if (!mine || rank(mine, pid) < 1) return no('locked')
      return { ok: true, changed: new Map(), world: put(w, { ...mine, closed: !a.open }) }
    },
  },
  allyAccept: {
    pick: a => (isId(a.pid) && typeof a.ok === 'boolean' ? { type: 'allyAccept', pid: a.pid, ok: a.ok } : null),
    run: ({ ps, w, pid, now }, a) => {
      const mine = allyOf(w, pid)
      if (!mine || rank(mine, pid) < 1 || !mine.apps?.includes(a.pid)) return no('locked')
      const rest = { ...mine, apps: mine.apps.filter(p => p !== a.pid) }
      if (!a.ok || allyOf(w, a.pid)) return { ok: true, changed: new Map(), world: put(w, rest) } // đã vào minh khác: bỏ đơn
      if (Object.keys(mine.members).length >= seatsOf(mine)) return no('full')
      const them = ps.get(a.pid)
      const changed: Players = new Map(them ? [[a.pid, welcome(them, rest.name, now)]] : [])
      return { ok: true, changed, world: join(put(w, rest), rest, a.pid) }
    },
  },
  allyInvite: {
    pick: a => (isId(a.pid) ? { type: 'allyInvite', pid: a.pid } : null),
    run: ({ ps, w, pid }, a) => {
      const mine = allyOf(w, pid)
      if (!mine || rank(mine, pid) < 1) return no('locked')
      if (!ps.has(a.pid) || allyOf(w, a.pid)) return no('busy')
      if (mine.invites?.includes(a.pid)) return no('claimed')
      return { ok: true, changed: new Map(), world: put(w, { ...mine, invites: [...(mine.invites ?? []), a.pid] }) }
    },
  },
  helpAsk: {
    pick: a => (oneOf(HELP_JOBS)(a.job) ? { type: 'helpAsk', job: a.job } : null),
    run: ({ w, pid, s }, a) => {
      const mine = allyOf(w, pid)
      if (!mine) return no('locked')
      const j = jobOf(s, a.job)
      if (!j) return no('empty')
      if (mine.helps.some(h => h.pid === pid && h.job === a.job && h.startAt === j.startAt)) return no('max_level')
      const helps = [
        ...mine.helps.filter(h => !(h.pid === pid && h.job === a.job)),
        { pid, job: a.job, startAt: j.startAt, ms: helpMs(j), by: [] },
      ]
      return { ok: true, changed: new Map(), world: put(w, { ...mine, helps }) }
    },
  },
  helpAll: {
    pick: () => ({ type: 'helpAll' }),
    run: ({ ps, w, pid, s: me, now }) => {
      const mine = allyOf(w, pid)
      if (!mine) return no('locked')
      const max = helpsOf(mine)
      const changed: Players = new Map()
      const helps: Help[] = []
      let n = 0
      for (const h of mine.helps) {
        const s = changed.get(h.pid) ?? ps.get(h.pid)
        const j = s && jobOf(advance(s, now), h.job)
        if (!s || !j || j.startAt !== h.startAt || mine.members[h.pid] === undefined) continue // việc đã xong/đổi: bỏ lời nhờ
        if (h.pid === pid || h.by.includes(pid) || h.by.length >= max) {
          helps.push(h)
          continue
        }
        changed.set(h.pid, hasten(s, h.job, h.startAt, h.ms, now))
        n++
        const next = { ...h, by: [...h.by, pid] }
        if (next.by.length < max) helps.push(next)
      }
      if (!n) return no('empty')
      changed.set(pid, helpCredit(me, n, now)) // người giúp được cống hiến
      return { ok: true, changed, world: put(w, { ...mine, helps }) }
    },
  },
  aid: {
    pick: a => {
      const army = pickArmy(a.army)
      return army && isElder(a.elder) && isId(a.pid) ? { type: 'aid', pid: a.pid, elder: a.elder, army } : null
    },
    run: aidAct,
  },
}

// Viện binh: đóng quân ở nhà người cùng minh, tối đa REINFORCE_MAX đội; nhà đó bị cướp thì cùng thủ
function aidAct({ ps, w, pid, s, seed, map }: Ctx, a: { pid: number; elder: ElderId; army: Army }): WorldResult {
  const t = s.time
  const to = ps.get(a.pid)
  if (!to || a.pid === pid) return no('gone')
  if (allyOf(w, pid)?.members[a.pid] === undefined) return no('locked')
  if (aidAt(ps, a.pid).length >= REINFORCE_MAX) return no('full')
  if (s.marches.some(m => m.task === 'aid' && m.target.i === a.pid)) return no('busy')
  const go = raidPath(s, to, map)
  if (!go) return no('far')
  const e = fieldError(s, a.elder, a.army)
  if (e) return no(e)
  const army = compact(a.army)
  const m: March = {
    id: s.nextId,
    elder: a.elder,
    army,
    target: { kind: 'pvp', i: a.pid },
    task: 'aid',
    foe: to.name,
    seed,
    startAt: t,
    arriveAt: t + go.ms,
    returnAt: 0,
    ...(go.path && { path: go.path }),
  }
  return { ok: true, world: w, changed: new Map([[pid, launch(s, army, m)]]) }
}
