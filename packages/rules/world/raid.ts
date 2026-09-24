// Cướp giữa các tông môn: điều kiện, xuất quân, giải trận (server), điểm Elo, ghép đối thủ.
import { fight } from '../combat.ts'
import { no } from '../core/action.ts'
import { admit, pushReport, sideOf, snap, marchError, launch } from '../core/battle.ts'
import { bump, evBump } from '../core/calendar.ts'
import { isId, isElder, pickArmy } from '../core/parse.ts'
import { elderLevel, lead, power, storage } from '../core/stats.ts'
import { advance } from '../core/time.ts'
import { type Army, type Err, type March, type Report, type State } from '../core/types.ts'
import { minus, compact, noGain } from '../core/util.ts'
import {
  ELO_K,
  FOES_MAX,
  MATCH_PICK,
  MATCH_POOL,
  PROTECT,
  PVP_FLOOR,
  PVP_HALL,
  RAID_SHARE,
  RESOURCES,
  REVENGE_TIME,
  SHIELD_TIME,
  UNITS,
  type Bag,
  type ElderId,
} from '../data.ts'
import {
  allyOf,
  raidPath,
  travel,
  withMarch,
  type MapCtx,
  type Party,
  type Players,
  type World,
  type WorldActions,
} from './base.ts'
import { addArmy, combine, defense, guardOf, scout, split, type Scout, carryOf, flipRounds } from './fight.ts'

const revenge = (att: State, pid: number, now: number) => att.foes.some(f => f.pid === pid && f.at + REVENGE_TIME > now)

export function raidError(
  att: State,
  def: State | undefined,
  attPid: number,
  defPid: number,
  now: number,
  map?: MapCtx,
  w?: World,
): Err | null {
  if (!def || attPid === defPid) return 'gone'
  if (w && allyOf(w, attPid)?.members[defPid] !== undefined) return 'friend' // không cướp đồng minh
  if (!raidPath(att, def, map)) return 'far'
  if (att.levels.chuDien < PVP_HALL || def.levels.chuDien < PVP_HALL) return 'locked'
  if (def.shield > now) return 'shield'
  if (!revenge(att, defPid, now) && power(def) < PVP_FLOOR * power(att)) return 'weak' // báo thù thì bỏ giới hạn
  if (att.marches.some(m => m.target.kind === 'pvp' && m.target.i === defPid)) return 'busy'
  return null
}

export type RaidAction = { type: 'raid'; pid: number; elder: ElderId; army: Army }

export const raidActions: WorldActions<RaidAction> = {
  raid: {
    pick: a => {
      const army = pickArmy(a.army)
      return isId(a.pid) && army && isElder(a.elder) ? { type: 'raid', pid: a.pid, elder: a.elder, army } : null
    },
    run: ({ ps, w, pid, s: att, now, seed, map }, a) => {
      const t = att.time
      const other = ps.get(a.pid)
      const e = raidError(att, other && advance(other, now), pid, a.pid, t, map, w) ?? marchError(att, a.elder, a.army)
      if (e) return no(e)
      const army = compact(a.army)
      const go = raidPath(att, other!, map)!
      const m: March = {
        id: att.nextId,
        elder: a.elder,
        army,
        target: { kind: 'pvp', i: a.pid },
        seed,
        startAt: t,
        arriveAt: t + go.ms,
        returnAt: 0,
        foe: other!.name,
        ...(go.path && { path: go.path }),
      }
      // đi đánh người khác thì mất khiên
      return { ok: true, world: w, changed: new Map([[pid, { ...launch(att, army, m), shield: 0 }]]) }
    },
  },
}

// Điểm kiểu Elo cho bên đánh (bên thủ mất/được đúng bấy nhiêu). Chỉ server tính nên không cần tất định giữa các engine.
const elo = (a: number, d: number, win: boolean) =>
  Math.round(ELO_K * ((win ? 1 : 0) - 1 / (1 + 10 ** ((d - a) / 400))))

// Phần cướp được: RAID_SHARE phần vượt kho bảo hộ (bonus chiến lợi phẩm của người dẫn), không quá sức mang của đội còn đứng
function plunder(att: State, def: State, elder: ElderId, back: Army): Partial<Bag> {
  const room = carryOf(back)
  const keep = PROTECT * storage(def)
  const want = RESOURCES.map(r => {
    const over = Math.max(0, def.res[r] - keep)
    return Math.floor(Math.min(over, over * RAID_SHARE * (1 + lead(att, elder, 'loot'))))
  })
  const total = want.reduce((a, b) => a + b, 0)
  const k = total > room ? room / total : 1
  return Object.fromEntries(RESOURCES.map((r, i) => [r, Math.floor(want[i] * k)]))
}

// Một trận cướp đã giải: số liệu mà bên đánh, bên thủ và viện binh cùng dùng
type Bout = {
  at: number
  att: State
  attPid: number
  def: State
  defPid: number
  m: March
  win: boolean
  loot: Partial<Bag>
  delta: number // điểm Elo bên đánh được (bên thủ mất đúng bấy nhiêu)
  n1: number[] // quân bên thủ (nhà + viện binh) còn đứng sau trận
  fights: Report['fights'] // nhìn từ bên đánh
  flip: Report['fights'] // nhìn từ bên thủ
}

// Một trận cướp lúc at: cả hai state đã đưa tới at. Bên thủ là mọi đệ tử đang ở nhà.
// Viện binh (helpers) đứng cùng quân nhà: thua thì bị đánh bật về, thắng thì ở lại với phần còn lại.
export function raid(
  att: State,
  attPid: number,
  def: State,
  defPid: number,
  m: March,
  at: number,
  helpers: Party = [],
): { att: State; def: State; helpers: Players } {
  const me = sideOf(att, m.elder, m.army)
  const { side: foe, at: hOffs } = combine([
    defense(def),
    ...helpers.map(([, hs, hm]) => sideOf(hs, hm.elder, compact(hm.army))),
  ])
  const f = fight(me, foe, m.seed)
  const last = f.rounds.at(-1)
  const ids = UNITS.filter(u => (m.army[u] ?? 0) > 0)
  const left = last?.n[0] ?? ids.map(u => m.army[u]!)
  const back = Object.fromEntries(ids.map((u, k) => [u, left[k]])) as Army
  const hurt = Object.fromEntries(ids.map((u, k) => [u, m.army[u]! - left[k]])) as Army
  const g = guardOf(def)
  const aSnap = snap(me, m.elder, elderLevel(att.elders[m.elder]))
  const dSnap = snap(foe, g ?? undefined, g ? elderLevel(def.elders[g]) : 1)
  const b: Bout = {
    at,
    att,
    attPid,
    def,
    defPid,
    m,
    win: f.win,
    loot: f.win ? plunder(att, def, m.elder, back) : {},
    delta: elo(att.pvp.pts, def.pvp.pts, f.win),
    n1: last?.n[1] ?? foe.troops.map(t => t.n),
    fights: [{ a: aSnap, b: dSnap, rounds: f.rounds }],
    flip: [{ a: dSnap, b: aSnap, rounds: flipRounds(f.rounds) }],
  }
  return { att: attacker(b, back, hurt), def: defender(b), helpers: helping(b, helpers, hOffs) }
}

// Bên đánh: chiến báo, đội quay về mang chiến lợi phẩm (nhận lúc về tới nhà như PvE)
function attacker({ at, att, def, defPid, m, win, loot, delta, fights }: Bout, back: Army, hurt: Army): State {
  const exp = win ? Math.round(40 * def.levels.chuDien * (1 + lead(att, m.elder, 'exp'))) : 0
  let a: State = pushReport(att, {
    at,
    kind: 'pvp',
    i: defPid,
    foe: def.name,
    win,
    hurt,
    dead: {},
    gain: { res: loot, items: {}, exp },
    fights,
  })
  a = {
    ...a,
    marches: a.marches.map(x =>
      x.id === m.id
        ? {
            ...x,
            back,
            hurt,
            gain: { res: loot, items: {}, exp },
            report: a.nextId - 1,
            returnAt: at + (at - m.startAt),
          }
        : x,
    ),
    pvp: {
      pts: Math.max(0, att.pvp.pts + delta),
      win: att.pvp.win + (win ? 1 : 0),
      loss: att.pvp.loss + (win ? 0 : 1),
    },
    foes: win ? att.foes.filter(x => x.pid !== defPid) : att.foes, // báo thù xong
  }
  return win ? evBump(bump(a, 'win'), 'raid') : a
}

// Bên thủ: mất tài nguyên, thương binh về Đan phòng, chiến báo nhìn từ phía mình, thua thì được khiên
function defender({ at, att, attPid, def, win, loot, delta, n1, flip }: Bout): State {
  const dIds = UNITS.filter(u => def.troops[u] > 0)
  const dLeft = n1.slice(0, dIds.length)
  const dHurt = Object.fromEntries(dIds.map((u, k) => [u, def.troops[u] - dLeft[k]])) as Army
  const lost = Object.fromEntries(RESOURCES.map(r => [r, loot[r] ?? 0])) as Bag
  const adm = admit(
    {
      ...def,
      troops: minus(def.troops, dHurt),
      res: Object.fromEntries(RESOURCES.map(r => [r, def.res[r] - lost[r]])) as Bag,
    },
    dHurt,
  )
  const dd: State = pushReport(adm.state, {
    at,
    kind: 'pvp',
    i: attPid,
    foe: att.name,
    def: true,
    win: !win,
    hurt: dHurt,
    dead: adm.dead,
    lost: loot,
    gain: noGain(),
    fights: flip,
  })
  return {
    ...dd,
    pvp: {
      pts: Math.max(0, def.pvp.pts - delta),
      win: def.pvp.win + (win ? 0 : 1),
      loss: def.pvp.loss + (win ? 1 : 0),
    },
    foes: [...def.foes.filter(x => x.pid !== attPid), { pid: attPid, name: att.name, at }].slice(-FOES_MAX),
    shield: win ? Math.max(def.shield, at + SHIELD_TIME) : def.shield,
    marches: win ? dd.marches.map(x => (x.target.kind === 'trib' ? { ...x, foil: (x.foil ?? 0) + 1 } : x)) : dd.marches, // phá kiếp
  }
}

// Viện binh: chiến báo như bên thủ; thua thì bị đánh bật về nhà, thắng thì ở lại với phần còn lại
function helping({ at, att, attPid, win, n1, flip }: Bout, helpers: Party, offs: number[]): Players {
  const hs: Players = new Map()
  helpers.forEach(([hp, st, hm], j) => {
    const d = split(hm, n1, offs[j + 1])
    const x = pushReport(st, {
      at,
      kind: 'pvp',
      i: attPid,
      foe: att.name,
      def: true,
      win: !win,
      hurt: d.hurt,
      dead: {},
      gain: noGain(),
      fights: flip,
    })
    const march = win
      ? { ...hm, stay: false, back: d.left, hurt: addArmy(hm.hurt, d.hurt), gain: noGain(), returnAt: at + travel(hm) }
      : { ...hm, army: d.left, hurt: addArmy(hm.hurt, d.hurt) }
    hs.set(hp, withMarch(x, march))
  })
  return hs
}

export type Rival = {
  pid: number
  name: string
  hall: number
  power: number
  pts: number
  revenge: boolean
  scout: Scout
  ms: number
}

// Kẻ đã đánh mình (báo thù, 24 giờ) + MATCH_PICK người ngẫu nhiên trong MATCH_POOL người gần lực chiến nhất, đánh được lúc này
// only: chỉ hỏi một tông môn (chạm trên bản đồ) — trả [] nếu lúc này không đánh được
export function rivals(
  ps: Players,
  pid: number,
  now: number,
  rand: () => number,
  map?: MapCtx,
  only?: number,
  w?: World,
): Rival[] {
  const me = ps.get(pid)
  if (!me || me.levels.chuDien < PVP_HALL) return []
  const mine = power(me)
  const row = (id: number, s: State, rev: boolean): Rival => ({
    pid: id,
    name: s.name,
    hall: s.levels.chuDien,
    power: Math.round(power(s)),
    pts: s.pvp.pts,
    revenge: rev,
    scout: scout(s),
    ms: raidPath(me, s, map)!.ms,
  })
  const open = [...ps].filter(
    ([id, s]) => (only === undefined || id === only) && !raidError(me, s, pid, id, now, map, w),
  )
  const foes = open.filter(([id]) => revenge(me, id, now))
  const pool = open
    .filter(([id]) => !revenge(me, id, now))
    .sort((a, b) => Math.abs(power(a[1]) - mine) - Math.abs(power(b[1]) - mine) || a[0] - b[0])
    .slice(0, MATCH_POOL)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return [...foes.map(([id, s]) => row(id, s, true)), ...pool.slice(0, MATCH_PICK).map(([id, s]) => row(id, s, false))]
}
