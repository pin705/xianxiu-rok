// Cướp giữa các tông môn: xuất quân (một đội, hay kết trận công sơn của tiên minh), giải trận (server), điểm Elo.
import { fight, might, type Side } from '../combat.ts'
import { no } from '../core/action.ts'
import { admit, marchSide, marchSnap, pushReport, snap, fieldError, launch } from '../core/battle.ts'
import { bump, evBump } from '../core/calendar.ts'
import { int, isId, isElder, pickArmy } from '../core/parse.ts'
import { deputyOf, elderLevel, lead, storage } from '../core/stats.ts'
import { advance } from '../core/time.ts'
import { type Army, type March, type Report, type State } from '../core/types.ts'
import { bag, minus, compact, noGain } from '../core/util.ts'
import {
  FOES_MAX,
  FRENZY_TIME,
  PROTECT,
  RAID_SHARE,
  RALLY_MAX,
  RALLY_WAIT,
  RESOURCES,
  SHIELD_TIME,
  TIER,
  UNITS,
  type Bag,
  type ElderId,
} from '../data.ts'
import {
  addKp,
  allyOf,
  elo,
  raidPath,
  travel,
  withMarch,
  type Ctx,
  type Party,
  type Players,
  type World,
  type WorldActions,
} from './base.ts'
import { addArmy, combine, defense, guardOf, raidError, split, carryOf, flipRounds } from './fight.ts'

// Gỡ cảnh báo của một đội (trận đã giải / đội quay về)
export const dropIncoming = (s: State, pid: number, id: number): State =>
  s.incoming?.some(x => x.pid === pid && x.id === id)
    ? { ...s, incoming: s.incoming.filter(x => !(x.pid === pid && x.id === id)) }
    : s

export type RaidAction =
  | { type: 'raid'; pid: number; elder: ElderId; army: Army }
  | { type: 'raidRally'; pid: number; wait: 0 | 1 | 2; elder: ElderId; army: Army } // mở kết trận công sơn
  | { type: 'raidJoin'; id: number; elder: ElderId; army: Army } // góp đội vào kết trận công sơn
const pickWait = int(0, RALLY_WAIT.length - 1)

export const raidActions: WorldActions<RaidAction> = {
  raid: {
    pick: a => {
      const army = pickArmy(a.army)
      return isId(a.pid) && army && isElder(a.elder) ? { type: 'raid', pid: a.pid, elder: a.elder, army } : null
    },
    run: (ctx, a) => sortie(ctx, a.pid, a.elder, a.army),
  },
  raidRally: {
    pick: a => {
      const army = pickArmy(a.army)
      return isId(a.pid) && pickWait(a.wait) && army && isElder(a.elder)
        ? { type: 'raidRally', pid: a.pid, wait: a.wait as 0 | 1 | 2, elder: a.elder, army }
        : null
    },
    run: (ctx, a) => {
      const al = allyOf(ctx.w, ctx.pid)
      return al ? sortie(ctx, a.pid, a.elder, a.army, { wait: RALLY_WAIT[a.wait], ally: al.id }) : no('locked')
    },
  },
  raidJoin: {
    pick: a => {
      const army = pickArmy(a.army)
      return isId(a.id) && army && isElder(a.elder) ? { type: 'raidJoin', id: a.id, elder: a.elder, army } : null
    },
    run: (ctx, a) => {
      const rl = ctx.w.rallies[a.id]
      if (!rl || rl.task !== 'raid' || rl.ally !== allyOf(ctx.w, ctx.pid)?.id || rl.at <= ctx.s.time) return no('gone')
      const n = [...ctx.ps.values()].reduce((k, x) => k + x.marches.filter(m => m.rally === rl.id).length, 0)
      if (n >= RALLY_MAX || ctx.s.marches.some(m => m.rally === rl.id)) return no('full')
      return sortie(ctx, rl.i, a.elder, a.army, { rally: rl.id, at: rl.at })
    },
  },
}

// Xuất một đội đi cướp `to`: một mình (tới ngay khi tới nơi), mở kết trận (hẹn giờ sau `wait`, cả minh góp đội) hay góp vào
// kết trận đang mở (tới đúng giờ hẹn — không kịp thì thôi). Đội ở gần đi chậm lại cho khớp giờ.
type Muster = { wait: number; ally: number } | { rally: number; at: number }
function sortie({ ps, w, pid, s: att, now, seed, map }: Ctx, to: number, elder: ElderId, raw: Army, muster?: Muster) {
  const t = att.time
  const other = ps.get(to)
  const e = raidError(att, other && advance(other, now), pid, to, t, map, w) ?? fieldError(att, elder, raw)
  if (e) return no(e)
  const army = compact(raw)
  const go = raidPath(att, other!, map)!
  const at = !muster ? t + go.ms : 'wait' in muster ? t + Math.max(muster.wait, go.ms) : muster.at
  if (at < t + go.ms) return no('far') // không kịp tới lúc hẹn
  const rally = muster && ('rally' in muster ? muster.rally : w.nextRally)
  const m: March = {
    id: att.nextId,
    elder,
    army,
    target: { kind: 'pvp', i: to },
    seed,
    startAt: t,
    arriveAt: at,
    returnAt: 0,
    foe: other!.name,
    ...(go.path && { path: go.path }),
    ...(rally !== undefined && { rally }),
  }
  // đi đánh người khác thì mất khiên, và nổi cơn sát khí (chưa bật lại khiên ngay được)
  const me: State = { ...launch(att, army, m), shield: 0, frenzy: t + FRENZY_TIME }
  // bên kia thấy đội đang kéo tới (như Tháp canh của RoK) — gỡ khi trận giải hoặc đội quay về
  const def = advance(other!, now)
  const warn = { id: m.id, pid, foe: att.name, at }
  const them: State = { ...def, incoming: [...(def.incoming ?? []).filter(x => x.at > t), warn] }
  const open =
    muster && 'wait' in muster ? { id: rally!, ally: muster.ally, by: pid, i: to, at, foe: other!.name } : null
  const world: World = open
    ? { ...w, rallies: { ...w.rallies, [open.id]: { ...open, task: 'raid' } }, nextRally: open.id + 1 }
    : w
  return {
    ok: true as const,
    world,
    changed: new Map([
      [pid, me],
      [to, them],
    ]),
  }
}

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
  kp: [att: number, def: number] // chiến công mỗi bên (thế lực đệ tử bên kia hạ được)
  fights: Report['fights'] // nhìn từ bên đánh
  flip: Report['fights'] // nhìn từ bên thủ
}

// Chiến công: thế lực đệ tử của một bên bị hạ (left: số còn đứng của từng nhóm sau trận)
const killed = (side: Side, left?: number[]) =>
  Math.round(side.troops.reduce((sum, t, g) => sum + (t.n - (left?.[g] ?? t.n)) * TIER[t.tier].power, 0))

// Một trận cướp lúc at: mọi state đã đưa tới at. party: một đội, hay cả nhóm kết trận (đội mở trận đứng đầu, công pháp của
// đội đó) gộp làm một bên — chiến lợi phẩm chia theo sức mang còn lại, chiến công theo lực chiến góp vào. Bên thủ là mọi đệ
// tử đang ở nhà; viện binh (helpers) đứng cùng quân nhà: thua thì bị đánh bật về, thắng thì ở lại với phần còn lại.
export function raid(
  party: Party,
  def: State,
  defPid: number,
  at: number,
  helpers: Party = [],
): { atts: Players; def: State; helpers: Players } {
  const [attPid, att, m] = party[0]
  const parts = party.map(([, s2, m2]) => marchSide(s2, m2))
  const { side: me, at: aOffs } = party.length > 1 ? combine(parts) : { side: parts[0], at: [0] }
  const { side: foe, at: hOffs } = combine([defense(def), ...helpers.map(([, hs, hm]) => marchSide(hs, hm))])
  const f = fight(me, foe, m.seed)
  const last = f.rounds.at(-1)
  const outs = party.map(([, , m2], j) => split(m2, last?.n[0] ?? me.troops.map(t => t.n), aOffs[j]))
  const back = outs.reduce((sum, o) => addArmy(sum, o.left), {} as Army)
  const g = guardOf(def)
  const aSnap = marchSnap(att, me, m)
  const dSnap = snap(foe, g ?? undefined, g ? elderLevel(def.elders[g]) : 1, deputyOf(def, g))
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
    kp: [killed(foe, last?.n[1]), killed(me, last?.n[0])],
    fights: [{ a: aSnap, b: dSnap, rounds: f.rounds }],
    flip: [{ a: dSnap, b: aSnap, rounds: flipRounds(f.rounds) }],
  }
  const carry = outs.map(o => carryOf(o.left)),
    load = carry.reduce((x, y) => x + y, 0) || 1
  const mights = parts.map(x => might(x)),
    total = mights.reduce((x, y) => x + y, 0) || 1
  const one = party.length === 1
  const atts: Players = new Map(
    party.map(([p2, s2, m2], j) => {
      const loot = one ? b.loot : bag(r => Math.floor(((b.loot[r] ?? 0) * carry[j]) / load))
      const mine = { ...b, att: s2, attPid: p2, m: m2, loot, delta: Math.round(b.delta / party.length) }
      const kp = one ? b.kp[0] : Math.round((b.kp[0] * mights[j]) / total)
      return [p2, addKp(attacker(mine, outs[j].left, outs[j].hurt), kp)]
    }),
  )
  return { atts, def: addKp(defender(b, party), b.kp[1]), helpers: helping(b, helpers, hOffs) }
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
  return win ? evBump(bump({ ...a, stats: { ...a.stats, raided: (a.stats.raided ?? 0) + 1 } }, 'win'), 'raid') : a
}

// Bên thủ: mất tài nguyên, thương binh về Đan phòng, chiến báo nhìn từ phía mình, thua thì được khiên
function defender({ at, att, attPid, def, win, loot, delta, n1, flip }: Bout, party: Party): State {
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
    // mọi người trong trận (cả nhóm kết trận) vào danh sách báo thù
    foes: [
      ...def.foes.filter(x => !party.some(([p]) => p === x.pid)),
      ...party.map(([p, s2]) => ({ pid: p, name: s2.name, at })),
    ].slice(-FOES_MAX),
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
