// Man Hoang Cổ Tộc (Ceroli Crisis của RoK, giản lược): phó bản tổ đội của tiên minh. Mở phòng / vào phòng là thao tác giới; đủ người
// hay hết giờ chờ thì server giải (partyStep, gọi mỗi nhịp): cả đội đánh PARTY_WAVES đợt hung thú mạnh dần, quà qua thư.
import { fight, might, type Side } from '../combat.ts'
import { no } from '../core/action.ts'
import { mob } from '../core/battle.ts'
import { dayOf } from '../core/calendar.ts'
import { int, oneOf } from '../core/parse.ts'
import type { State } from '../core/types.ts'
import {
  MAIN_SHARE,
  PARTY_GROW,
  PARTY_HALL,
  PARTY_MAX,
  PARTY_MIGHT,
  PARTY_ROLES,
  PARTY_WAIT,
  PARTY_WAVES,
  TYPES,
  partyGift,
  type PartyRole,
} from '../data.ts'
import { arenaSide, lineupOf } from '../sect/arena.ts'
import { mail } from '../sect/inbox.ts'
import { allyOf, type Alliance, type PartyRoom, type Players, type World, type WorldActions } from './base.ts'
import { combine } from './fight.ts'

const ROLES = Object.keys(PARTY_ROLES) as PartyRole[]
const played = (s: State) => s.partyDay === dayOf(s.time)
const put = (w: World, al: Alliance, party: PartyRoom | undefined): World => {
  const { party: _old, ...rest } = al
  return { ...w, allies: { ...w.allies, [al.id]: party ? { ...rest, party } : rest } }
}

export type PartyAction = { type: 'partyOpen'; lv: number; role: PartyRole } | { type: 'partyJoin'; role: PartyRole }
export const partyActions: WorldActions<PartyAction> = {
  partyOpen: {
    pick: a =>
      int(1, PARTY_MIGHT.length)(a.lv) && oneOf(ROLES)(a.role)
        ? { type: 'partyOpen', lv: a.lv as number, role: a.role as PartyRole }
        : null,
    run: ({ w, pid, s }, a) => {
      const al = allyOf(w, pid)
      if (!al || s.levels.chuDien < PARTY_HALL) return no('locked')
      if (al.party) return no('busy') // minh đang có phòng chờ: vào phòng đó
      if (played(s)) return no('claimed')
      const party: PartyRoom = { by: pid, lv: a.lv, at: s.time + PARTY_WAIT, members: [{ pid, role: a.role }] }
      return { ok: true, world: put(w, al, party), changed: new Map([[pid, { ...s, partyDay: dayOf(s.time) }]]) }
    },
  },
  partyJoin: {
    pick: a => (oneOf(ROLES)(a.role) ? { type: 'partyJoin', role: a.role as PartyRole } : null),
    run: ({ w, pid, s }, a) => {
      const al = allyOf(w, pid)
      const p = al?.party
      if (!al || !p || p.at <= s.time || s.levels.chuDien < PARTY_HALL) return no('gone')
      if (p.members.length >= PARTY_MAX || p.members.some(m => m.pid === pid)) return no('full')
      if (played(s)) return no('claimed')
      const party = { ...p, members: [...p.members, { pid, role: a.role }] }
      return { ok: true, world: put(w, al, party), changed: new Map([[pid, { ...s, partyDay: dayOf(s.time) }]]) }
    },
  },
}

// Một lượt phó bản: cả đội gộp làm một bên (vai cộng tăng ích), đánh từng đợt; thắng thì đi tiếp với quân còn lại (Trị Liệu hồi
// một phần quân ngã), thua thì dừng. Trả về số đợt qua.
export function partyRun(ps: Players, p: PartyRoom, seed: number): number {
  const teams = p.members.flatMap(m => {
    const s = ps.get(m.pid)
    const team = s && lineupOf(s)[0]
    return s && team ? [arenaSide(s, team)] : []
  })
  if (!teams.length) return 0
  const count = (r: PartyRole) => Math.min(2, p.members.filter(m => m.role === r).length)
  const tank = p.members.some(m => m.role === 'hoPhap')
  const atk = 1 + PARTY_ROLES.chuCong.atk * count('chuCong')
  const heal = PARTY_ROLES.triLieu.heal * count('triLieu')
  const base = combine(teams).side
  let side: Side = {
    ...base,
    troops: base.troops.map(t => ({
      ...t,
      atk: t.atk * atk,
      def: t.def * (tank ? 1 + PARTY_ROLES.hoPhap.def : 1),
      hp: t.hp * (tank ? 1 + PARTY_ROLES.hoPhap.hp : 1),
    })),
  }
  const full = side.troops.map(t => t.n)
  for (let k = 0; k < PARTY_WAVES; k++) {
    const type = TYPES[(p.lv + k) % TYPES.length]
    const parts = TYPES.map(
      x => [x, x === type ? MAIN_SHARE : (1 - MAIN_SHARE) / 2] as [(typeof TYPES)[number], number],
    )
    const unit = might(mob(1000, 3, parts))
    const target = PARTY_MIGHT[p.lv - 1] * PARTY_GROW ** k
    const foe = mob(unit ? (1000 * target) / unit : 0, 3, parts, 1 + k * 2)
    const f = fight(side, foe, (seed + k * 7919) >>> 0)
    if (!f.win) return k
    const left = f.rounds.at(-1)?.n[0] ?? side.troops.map(t => t.n)
    side = {
      ...side,
      troops: side.troops.map((t, g) => ({
        ...t,
        n: Math.min(full[g], left[g] + Math.floor((full[g] - left[g]) * heal)),
      })),
    }
  }
  return PARTY_WAVES
}

// Mỗi nhịp: phòng đủ người hay hết giờ chờ thì giải — thư quà cho từng người trong đội, bỏ phòng
export function partyStep(ps: Players, w: World, now: number, seed: number): { changed: Players; world: World } {
  const changed: Players = new Map()
  let out = w
  for (const al of Object.values(w.allies)) {
    const p = al.party
    if (!p || (p.at > now && p.members.length < PARTY_MAX)) continue
    const waves = partyRun(ps, p, (seed + al.id * 104_729) >>> 0)
    const gift = partyGift(p.lv, waves)
    for (const m of p.members) {
      const s = changed.get(m.pid) ?? ps.get(m.pid)
      if (s) changed.set(m.pid, mail(s, { at: now, k: 'party', a: [p.lv, waves, p.members.length], gift }))
    }
    out = put(out, out.allies[al.id] ?? al, undefined)
  }
  return { changed, world: out }
}
