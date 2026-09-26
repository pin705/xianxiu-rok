// Cướp khoáng (Attacked while gathering của RoK): đánh đội đang khai mỏ của tông môn khác. Đội đi thẳng tới mỏ; tới nơi mà đội
// kia còn khai thì giao chiến (advance.ts gọi robArrive), không thì quay về tay không — không chặn đội giữa đường.
import { route } from '../atlas.ts'
import { fight } from '../combat.ts'
import { no } from '../core/action.ts'
import { fieldError, launch, marchSide, marchSnap, pushReport } from '../core/battle.ts'
import { isElder, isId, pickArmy } from '../core/parse.ts'
import { lead, power, unitOf } from '../core/stats.ts'
import { advance } from '../core/time.ts'
import { eyeOf } from '../core/wall.ts'
import type { Army, Err, March, State } from '../core/types.ts'
import { compact, noGain } from '../core/util.ts'
import { FOES_MAX, FRENZY_TIME, PVP_FLOOR, PVP_HALL, ROB_SHARE, TIER, UNITS, type ElderId } from '../data.ts'
import {
  addKp,
  allyOf,
  dropIncoming,
  farErr,
  napBetween,
  routeMs,
  setSpot,
  sideKey,
  travel,
  turnBack,
  withMarch,
  type Ctx,
  type MapCtx,
  type Party,
  type Players,
  type World,
  type WorldActions,
  type WorldResult,
} from './base.ts'
import { addArmy, carryOf, flipRounds, revenge, split } from './fight.ts'
import { claimsOf, ownerAt, spotOf } from './points.ts'

export type RobAction = { type: 'rob'; pid: number; id: number; elder: ElderId; army: Army } // đội khai mỏ id của pid

export const robActions: WorldActions<RobAction> = {
  rob: {
    pick: a => {
      const army = pickArmy(a.army)
      return isId(a.pid) && isId(a.id) && army && isElder(a.elder)
        ? { type: 'rob', pid: a.pid, id: a.id, elder: a.elder, army }
        : null
    },
    run: robAct,
  },
}

// Đội khai mỏ đó lúc at còn cướp được không (lúc xuất quân và lúc tới nơi): còn đang khai, không cùng phe / minh ước,
// không khai trong lãnh thổ minh mình
function preyError(ps: Players, w: World, map: MapCtx, pid: number, prey: { pid: number; id: number }, at: number) {
  const vm = ps.get(prey.pid)?.marches.find(x => x.id === prey.id)
  if (prey.pid === pid || !vm?.mine || vm.mine.end <= at || vm.target.kind !== 'spot') return 'gone'
  if (sideKey(w, pid) === sideKey(w, prey.pid) || napBetween(w, pid, prey.pid)) return 'friend'
  const p = map.atlas.points[vm.target.i]
  const al = allyOf(w, prey.pid)
  if (al && ownerAt(claimsOf(ps, w, map.atlas, at), p.x, p.y) === al.id) return 'shield'
  return null
}

function robAct({ ps, w, pid, s, now, seed, map }: Ctx, a: RobAction): WorldResult {
  const t = s.time
  if (!map || !s.seat) return no('far')
  const e0: Err | null = preyError(ps, w, map, pid, a, t)
  if (e0) return no(e0)
  const def = advance(ps.get(a.pid)!, now)
  const i = def.marches.find(x => x.id === a.id)!.target.i
  const p = map.atlas.points[i]
  if (s.levels.chuDien < PVP_HALL || def.levels.chuDien < PVP_HALL) return no('locked')
  if (!revenge(s, a.pid, t) && power(def) < PVP_FLOOR * power(s)) return no('weak') // báo thù thì bỏ giới hạn
  if (s.marches.some(m => m.target.kind === 'spot' && m.target.i === i)) return no('busy')
  const r = route(map.atlas, s.seat, p, map.phase, map.shut)
  if (!r) return no(farErr(map, s.seat, p))
  const e = fieldError(s, a.elder, a.army)
  if (e) return no(e)
  const army = compact(a.army)
  const at = t + routeMs(s, r.len, army)
  const m: March = {
    id: s.nextId,
    elder: a.elder,
    army,
    target: { kind: 'spot', i },
    task: 'rob',
    spot: p.kind,
    foe: def.name,
    prey: { pid: a.pid, id: a.id },
    seed,
    startAt: t,
    arriveAt: at,
    returnAt: 0,
    path: r.path,
  }
  // như đi cướp tông môn: mất khiên, nổi sát khí; bên kia thấy đội kéo tới (Tháp canh) để kịp gọi đội khai về
  const me: State = { ...launch(s, army, m), shield: 0, frenzy: t + FRENZY_TIME }
  const warn = { id: m.id, pid, foe: s.name, at, spot: i, ...eyeOf(def, a.elder, army) }
  const them: State = { ...def, incoming: [...(def.incoming ?? []).filter(x => x.at > t), warn] }
  return {
    ok: true,
    world: w,
    changed: new Map([
      [pid, me],
      [a.pid, them],
    ]),
  }
}

const pow = (a: Army) => UNITS.reduce((n, u) => n + (a[u] ?? 0) * TIER[unitOf(u).tier].power, 0)

// Tới mỏ: đội kia còn khai thì giao chiến (bên kia hết cảnh báo). Thắng: lấy ROB_SHARE phần đã khai (bonus chiến lợi phẩm của
// người dẫn, không quá sức mang), đội kia về với phần còn lại, phần chưa khai trả về mỏ. Thua: về tay không, đội kia khai tiếp.
export function robArrive(ps: Players, w: World, [pid, att, m]: Party[number], at: number, map?: MapCtx) {
  const prey = m.prey!
  const v = ps.get(prey.pid)
  if (!map || !v || preyError(ps, w, map, pid, prey, at)) {
    const changed: Players = new Map([[pid, turnBack(att, m, at)]])
    if (v) changed.set(prey.pid, dropIncoming(v, pid, m.id))
    return { changed, world: w }
  }
  const def = dropIncoming(v, pid, m.id)
  const vm = def.marches.find(x => x.id === prey.id)!
  const mine = vm.mine!
  const i = m.target.i
  const me = marchSide(att, m),
    foe = marchSide(def, vm)
  const f = fight(me, foe, m.seed)
  const last = f.rounds.at(-1)
  const a = split(m, last?.n[0] ?? me.troops.map(t => t.n), 0)
  const d = split(vm, last?.n[1] ?? foe.troops.map(t => t.n), 0)
  const got = Math.floor((mine.amount * (at - vm.arriveAt)) / Math.max(1, mine.end - vm.arriveAt))
  const loot = f.win ? Math.min(carryOf(a.left), Math.floor(got * ROB_SHARE * (1 + lead(att, m.elder, 'loot')))) : 0
  const aSnap = marchSnap(att, me, m),
    dSnap = marchSnap(def, foe, vm)
  const base = { at, kind: 'spot' as const, i, spot: map.atlas.points[i].kind, dead: {} }
  const gain = { res: { [mine.res]: loot }, items: {}, exp: 0 }
  const x = pushReport(att, {
    ...base,
    foe: def.name,
    win: f.win,
    hurt: a.hurt,
    gain,
    fights: [{ a: aSnap, b: dSnap, rounds: f.rounds }],
  })
  const y = pushReport(def, {
    ...base,
    foe: att.name,
    def: true,
    win: !f.win,
    hurt: d.hurt,
    ...(loot > 0 && { lost: { [mine.res]: loot } }),
    gain: noGain(),
    fights: [{ a: dSnap, b: aSnap, rounds: flipRounds(f.rounds) }],
  })
  const hurt = addArmy(vm.hurt, d.hurt)
  const keep = { res: { [mine.res]: got - loot }, items: {}, exp: 0 }
  const beaten: March = f.win
    ? {
        ...vm,
        mine: { ...mine, end: at, amount: got - loot },
        back: d.left,
        hurt,
        gain: keep,
        report: y.nextId - 1,
        returnAt: at + travel(vm),
      }
    : { ...vm, army: d.left, back: d.left, hurt }
  const foes = [...y.foes.filter(z => z.pid !== pid), { pid, name: att.name, at }].slice(-FOES_MAX) // báo thù được
  const changed: Players = new Map([
    [
      pid,
      addKp(
        withMarch(x, { ...m, back: a.left, hurt: a.hurt, gain, report: x.nextId - 1, returnAt: at + travel(m) }),
        pow(d.hurt),
      ),
    ],
    [prey.pid, addKp({ ...withMarch(y, beaten), foes }, pow(a.hurt))],
  ])
  const sp = spotOf(w, map, i, at)
  return { changed, world: f.win ? setSpot(w, i, { ...sp, left: (sp.left ?? 0) + (mine.amount - got) }) : w } // giữ đồng hồ hồi mỏ
}
