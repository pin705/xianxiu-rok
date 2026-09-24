// Tiên minh: lập, vào, chức vị, bố cáo, nhờ giúp / giúp việc, viện binh (đóng quân ở nhà đồng minh).
import { no } from '../core/action.ts'
import { armyError } from '../core/battle.ts'
import { cleanText, id, int, isElder, JOB_KINDS, oneOf, pickArmy } from '../core/parse.ts'
import { marchSlots, power } from '../core/stats.ts'
import { advance, hasten, jobOf } from '../core/time.ts'
import { type Army, type JobKind, type March, type State } from '../core/types.ts'
import { minus } from '../core/util.ts'
import {
  ALLY_COST,
  ALLY_ELDERS,
  ALLY_HALL,
  ALLY_HELPS,
  ALLY_MAX,
  HELP_MIN,
  HELP_SHARE,
  REINFORCE_MAX,
  RESOURCES,
  UNITS,
  type ElderId,
} from '../data.ts'
import {
  aidAt,
  allyOf,
  raidPath,
  type Alliance,
  type Ctx,
  type Help,
  type Players,
  type Rally,
  type Role,
  type World,
  type WorldActions,
  type WorldResult,
} from './base.ts'

const put = (w: World, al: Alliance): World => ({ ...w, allies: { ...w.allies, [al.id]: al } })
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
// Cho client: danh sách minh (tìm để vào), minh của mình với người trong đó
export type AllyRow = { id: number; name: string; tag: string; n: number; power: number }
export type Member = { pid: number; name: string; role: Role; hall: number; power: number; online: boolean }
export type AllyInfo = Alliance & { people: Member[]; rallies: Rally[] }
export const allyRows = (w: World, ps: Players): AllyRow[] =>
  Object.values(w.allies)
    .map(al => ({
      id: al.id,
      name: al.name,
      tag: al.tag,
      n: Object.keys(al.members).length,
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
    rallies: Object.values(w.rallies).filter(r => r.ally === al.id),
  }
}

export const helpMs = (job: { startAt: number; finishAt: number }) =>
  Math.max(HELP_MIN, Math.round((job.finishAt - job.startAt) * HELP_SHARE))

// việc nhờ đồng minh giúp: mọi việc hẹn giờ trừ luyện đan (đan không rút ngắn được)
const HELP_JOBS = JOB_KINDS.filter(k => k !== 'brew')
export const rank = (al: Alliance, pid: number) => al.members[pid] ?? -1

export type AllianceAction =
  | { type: 'allyFound'; name: string; tag: string }
  | { type: 'allyJoin'; id: number }
  | { type: 'allyLeave' }
  | { type: 'allyKick'; pid: number }
  | { type: 'allyRole'; pid: number; role: Role }
  | { type: 'allyNotice'; text: string }
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
      return { ok: true, world: { ...put(w, al), nextAlly: w.nextAlly + 1 }, changed: new Map([[pid, paid]]) }
    },
  },
  allyJoin: {
    pick: a => (id(a.id) ? { type: 'allyJoin', id: a.id } : null),
    run: ({ w, pid }, a) => {
      const al = w.allies[a.id]
      if (allyOf(w, pid)) return no('busy')
      if (!al) return no('gone')
      if (Object.keys(al.members).length >= ALLY_MAX) return no('full')
      // ponytail: vào tự do (không duyệt đơn) — thêm duyệt nếu bị phá
      return { ok: true, changed: new Map(), world: put(w, { ...al, members: { ...al.members, [pid]: 0 } }) }
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
    pick: a => (id(a.pid) ? { type: 'allyKick', pid: a.pid } : null),
    run: ({ w, pid }, a) => {
      const mine = allyOf(w, pid)
      const their = mine?.members[a.pid]
      if (!mine || their === undefined || a.pid === pid) return no('bad')
      if (rank(mine, pid) < 1 || their >= rank(mine, pid)) return no('locked')
      return { ok: true, changed: new Map(), world: leave(w, mine, a.pid) }
    },
  },
  allyRole: {
    pick: a => (id(a.pid) && int(0, 2)(a.role) ? { type: 'allyRole', pid: a.pid, role: a.role as Role } : null),
    run: ({ w, pid }, a) => {
      const mine = allyOf(w, pid)
      const their = mine?.members[a.pid]
      if (!mine || their === undefined || a.pid === pid) return no('bad')
      if (rank(mine, pid) !== 2) return no('locked')
      if (a.role === 1 && Object.values(mine.members).filter(r => r === 1).length >= ALLY_ELDERS && their !== 1)
        return no('full')
      // nhường minh chủ: mình xuống trưởng lão
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
    run: ({ ps, w, pid, now }) => {
      const mine = allyOf(w, pid)
      if (!mine) return no('locked')
      const changed: Players = new Map()
      const helps: Help[] = []
      let n = 0
      for (const h of mine.helps) {
        const s = changed.get(h.pid) ?? ps.get(h.pid)
        const j = s && jobOf(advance(s, now), h.job)
        if (!s || !j || j.startAt !== h.startAt || mine.members[h.pid] === undefined) continue // việc đã xong/đổi: bỏ lời nhờ
        if (h.pid === pid || h.by.includes(pid) || h.by.length >= ALLY_HELPS) {
          helps.push(h)
          continue
        }
        changed.set(h.pid, hasten(s, h.job, h.startAt, h.ms, now))
        n++
        const next = { ...h, by: [...h.by, pid] }
        if (next.by.length < ALLY_HELPS) helps.push(next)
      }
      if (!n) return no('empty')
      return { ok: true, changed, world: put(w, { ...mine, helps }) }
    },
  },
  aid: {
    pick: a => {
      const army = pickArmy(a.army)
      return army && isElder(a.elder) && id(a.pid) ? { type: 'aid', pid: a.pid, elder: a.elder, army } : null
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
  const e = armyError(s, a.elder, a.army) ?? (s.marches.length >= marchSlots(s) ? 'slots' : null)
  if (e) return no(e)
  const army = Object.fromEntries(UNITS.filter(u => a.army[u]).map(u => [u, a.army[u]])) as Army
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
  return {
    ok: true,
    world: w,
    changed: new Map([
      [pid, { ...s, troops: minus(s.troops, army), marches: [...s.marches, m], nextId: s.nextId + 1 }],
    ]),
  }
}
