// Đội tới một điểm trên bản đồ giới (một đội hoặc cả nhóm kết trận): khai mỏ, đánh yêu vương, chiếm điểm.
// advance.ts gọi lúc hành quân tới nơi.
import { route, tide } from '../atlas.ts'
import { fight, might } from '../combat.ts'
import { beastExp, beastLoot, marchSide, marchSnap, pushReport, snap } from '../core/battle.ts'
import { festDrop } from '../core/fest.ts'
import { lead, unitOf } from '../core/stats.ts'
import { HOUR, addItems, noGain } from '../core/util.ts'
import type { Army, Gain, March, Report } from '../core/types.ts'
import {
  BOSSES,
  FIRST_TAKE,
  GARRISON_MAX,
  HONOR_BOSS,
  HONOR_GATHER,
  HONOR_WILD,
  MINE_RATE,
  MINE_RESPAWN,
  RESOURCES,
  SEASON_BOSS,
  TIDE_MINE,
  TERR_GATHER,
  TIER,
  UNITS,
  WILD_LOOT,
  WILD_RESPAWN,
  LOHAR_GIFT,
  LOHAR_SUMMONER,
  boneOf,
  eveFrags,
  type Reward,
} from '../data.ts'
import { mail } from '../sect/inbox.ts'
import {
  addHonor,
  addKp,
  allyGifts,
  routeMs,
  tribeBank,
  allyOf,
  garrison,
  setSpot,
  sideKey,
  travel,
  turnBack,
  withMarch,
  type MapCtx,
  type Party,
  type Players,
  type Spot,
  type World,
} from './base.ts'
import { addArmy, carryOf, combine, split, flipRounds } from './fight.ts'
import { bank, claimsOf, eveAdd, guardSide, hold, ownerAt, ruinWindow, spotOf, bossSlice, wildSide } from './points.ts'

type Arrived = { changed: Players; world: World }

// Các đội tới điểm cùng lúc (một đội, hoặc cả nhóm kết trận): khai mỏ, đánh yêu vương, hay chiếm điểm
export function spotArrive(ps: Players, w: World, map: MapCtx, group: Party, at: number): Arrived {
  const m = group[0][2]
  const sp = spotOf(w, map, m.target.i, at)
  const back = (): Arrived => ({
    changed: new Map(group.map(([p2, s2, m2]) => [p2, turnBack(s2, m2, at)])),
    world: w,
  })
  if (m.task === 'gather') return !sp.left || (sp.until ?? 0) > at ? back() : gather(ps, w, map, group[0], sp, at)
  if (m.task === 'hit')
    return !BOSSES[map.atlas.points[m.target.i].lv] || (sp.until ?? 0) > at
      ? back()
      : hitBoss(ps, w, map, group, sp, at)
  if (m.task === 'hunt') return (sp.until ?? 0) > at ? back() : hunt(w, map, group[0], at) // người khác vừa hạ: về
  if (!ruinWindow(map.atlas, map.atlas.points[m.target.i], at).open) return back() // di tích đã đóng cửa: về
  const r = take(ps, w, map, group, sp, at)
  return r ? firstTake(ps, r, map, m.target.i, at) : back()
}

// Chiếm lần đầu trong mùa: điểm (linh mạch / trận nhãn / Thiên Môn) lần đầu có tiên minh giữ thì cả minh nhận quà qua thư
function firstTake(ps: Players, r: Arrived, map: MapCtx, i: number, at: number): Arrived {
  const own = r.world.spots[i]?.own
  const p = map.atlas.points[i]
  const gift = FIRST_TAKE[p.kind as keyof typeof FIRST_TAKE]?.[p.lv - 1]
  const al = own && own > 0 ? r.world.allies[own] : undefined
  if (!al || !gift?.items || r.world.firsts?.includes(i)) return r
  const changed = new Map(r.changed)
  for (const pid of Object.keys(al.members).map(Number)) {
    const s = changed.get(pid) ?? ps.get(pid)
    if (s) changed.set(pid, mail(s, { at, k: 'firstTake', a: [p.kind, p.lv], gift }))
  }
  return { changed, world: { ...r.world, firsts: [...(r.world.firsts ?? []), i] } }
}

// Bên đánh: một đội, hoặc cả nhóm kết trận gộp làm một (công pháp của đội mở trận)
function attackers(group: Party) {
  const [, att, m] = group[0]
  const parts = group.map(([, s2, m2]) => marchSide(s2, m2))
  const { side, at: offs } = combine(parts)
  return { parts, side, offs, leadSnap: marchSnap(att, side, m) }
}

// Khai mỏ: mang về theo sức mang (linh triều ở vùng này, lãnh thổ minh mình: khai nhanh hơn); mỏ cạn thì hồi đầy sau MINE_RESPAWN
function gather(ps: Players, w: World, map: MapCtx, [pid, att, m]: Party[number], sp: Spot, at: number): Arrived {
  const i = m.target.i,
    p = map.atlas.points[i]
  const amount = Math.min(carryOf(m.army), sp.left!)
  const t = tide(map.atlas, at)
  const mine = allyOf(w, pid)?.id
  const terr = mine !== undefined && ownerAt(claimsOf(ps, w, map.atlas, at), p.x, p.y) === mine ? 1 + TERR_GATHER : 1
  // tốc khai: linh triều, lãnh thổ minh, và khoá 'gather' (Khai Linh Phù, bị động trưởng lão dẫn đội)
  const rate =
    MINE_RATE[p.lv - 1] *
    (t.active && t.region === p.region ? 1 + TIDE_MINE : 1) *
    terr *
    (1 + lead(att, m.elder, 'gather'))
  const end = at + Math.round((amount / rate) * HOUR)
  const res = RESOURCES[i % RESOURCES.length]
  const changed: Players = new Map()
  changed.set(
    pid,
    withMarch(addHonor(att, amount / HONOR_GATHER), {
      ...m,
      mine: { end, amount, res },
      back: m.army,
      hurt: {},
      gain: { res: { [res]: amount }, items: {}, exp: 0 },
      returnAt: end + travel(m),
    }),
  )
  const left = sp.left! - amount
  return { changed, world: setSpot(w, i, left > 0 ? { left } : { left: 0, until: at + MINE_RESPAWN }) }
}

// Yêu vương: kho máu chung, mỗi đội đánh một lát; sát thương chia theo lực chiến góp vào. Hạ thì thưởng qua thư, rồi hồi sinh
function hitBoss(ps: Players, w: World, map: MapCtx, group: Party, sp: Spot, at: number): Arrived {
  const m = group[0][2]
  const i = m.target.i,
    p = map.atlas.points[i]
  const { parts, side: mine, offs: aOffs, leadSnap: lead0 } = attackers(group)
  const changed: Players = new Map()
  const boss = BOSSES[p.lv]!
  const slice = bossSlice(map.atlas, i)!
  const f = fight(mine, slice, m.seed)
  const last = f.rounds.at(-1)
  const k = TIER[boss.tier].stat
  const dmg = Math.round(slice.troops.reduce((sum, t, g) => sum + (t.n - (last?.n[1][g] ?? t.n)) * k, 0))
  // sát thương của từng đội theo phần lực chiến góp vào
  const mights = parts.map(x => might(x)),
    total = mights.reduce((a, b) => a + b, 0) || 1
  const dmgs = { ...sp.dmg }
  group.forEach(([p2, s2, m2], j) => {
    const mine2 = Math.round((dmg * mights[j]) / total)
    dmgs[p2] = (dmgs[p2] ?? 0) + mine2
    const { left, hurt } = split(m2, last?.n[0] ?? mine.troops.map(t => t.n), aOffs[j])
    const exp = Math.round((mine2 / 20) * (1 + lead(s2, m2.elder, 'exp')))
    let x = pushReport(s2, {
      at,
      kind: 'spot',
      i,
      spot: p.kind,
      win: f.win,
      hurt,
      dead: {},
      gain: { ...noGain(), exp },
      fights: [{ a: lead0, b: snap(slice, undefined, 1 + p.lv * 10), rounds: f.rounds }],
    })
    x = withMarch(x, {
      ...m2,
      back: left,
      hurt,
      gain: { ...noGain(), exp },
      report: x.nextId - 1,
      returnAt: at + travel(m2),
    })
    changed.set(p2, addHonor(x, mine2 / HONOR_BOSS))
  })
  const hp = (sp.hp ?? boss.str) - dmg
  if (hp > 0) return { changed, world: setSpot(w, i, { ...sp, hp, dmg: dmgs }) } // giữ dấu Tuần Sơn (lohar)
  // hạ yêu vương: thưởng chia theo sát thương (qua thư); người đánh nhiều nhất nhận trưởng lão (nếu có)
  const sum = Object.values(dmgs).reduce((a, b) => a + b, 0) || 1
  Object.entries(dmgs)
    .sort((a, b) => b[1] - a[1])
    .forEach(([id2, d], n) => {
      const who = Number(id2),
        st = changed.get(who) ?? ps.get(who)
      if (!st) return
      const share = d / sum
      const gift: Reward = {
        res: Object.fromEntries(RESOURCES.map(r => [r, Math.floor((boss.reward.res?.[r] ?? 0) * share)])),
        items: Object.fromEntries(
          Object.entries(boss.reward.items ?? {}).map(([pk, v]) => [
            pk,
            Math.max(n === 0 ? 1 : 0, Math.floor(v! * share)),
          ]),
        ),
        ...(n === 0 && boss.reward.elder && st.elders[boss.reward.elder] === undefined && { elder: boss.reward.elder }),
      }
      changed.set(who, mail(st, { at, k: 'boss', a: [p.lv, n + 1, Math.round(share * 100)], gift }))
      // Yêu Vương Tuần Sơn: quà thêm theo sát thương (từ 5 % có ít nhất một món), người triệu hồi thêm một phần
      if (!sp.lohar || sp.lohar.until <= at) return
      const extra = Object.entries(LOHAR_GIFT.items ?? {}).map(([k2, v]) => [
        k2,
        Math.floor(v! * share) || +(share >= 0.05),
      ])
      const lohar =
        who === sp.lohar.by
          ? addItems(Object.fromEntries(extra), LOHAR_SUMMONER.items ?? {})
          : Object.fromEntries(extra)
      const s3 = changed.get(who)!
      changed.set(
        who,
        mail(s3, { at, k: 'lohar', a: [Math.round(share * 100), who === sp.lohar.by ? 1 : 0], gift: { items: lohar } }),
      )
    })
  let dead = tribeBank({ ...setSpot(w, i, { until: at + boss.respawn }), bosses: (w.bosses ?? 0) + 1 }, at, p.lv, dmgs)
  for (const [id2, d] of Object.entries(dmgs))
    dead = bank(dead, sideKey(w, Number(id2)), ((SEASON_BOSS[p.lv] ?? 0) * d) / sum)
  return { changed, world: allyGifts(ps, changed, dead, Object.keys(dmgs).map(Number), p.lv, at) }
}

// Gộp chiến lợi phẩm hai trận (săn liên hoàn)
const mergeGain = (a: Gain, b: Gain): Gain => ({
  res: Object.fromEntries(RESOURCES.map(r => [r, (a.res[r] ?? 0) + (b.res[r] ?? 0)])),
  items: Object.fromEntries(
    [...new Set([...Object.keys(a.items), ...Object.keys(b.items)])].map(k => [
      k,
      ((a.items as Record<string, number>)[k] ?? 0) + ((b.items as Record<string, number>)[k] ?? 0),
    ]),
  ),
  exp: a.exp + b.exp,
})
// Săn yêu thú giới: một đội đánh cả con; thắng thì chiến lợi phẩm (gấp WILD_LOOT yêu thú vùng) + kinh nghiệm theo đội về nhà,
// con đó hồi sau WILD_RESPAWN; thua thì đội mang quân còn lại về
function hunt(w: World, map: MapCtx, [pid, s, m]: Party[number], at: number): Arrived {
  const i = m.target.i,
    p = map.atlas.points[i]
  const foe = wildSide(map.atlas, i)!
  const me = marchSide(s, m)
  const f = fight(me, foe, m.seed)
  const { left, hurt } = split(m, f.rounds.at(-1)?.n[0] ?? me.troops.map(t => t.n), 0)
  const exp = Math.round(beastExp(p.lv) * (1 + lead(s, m.elder, 'exp')) * (f.win ? 1 : 0))
  const res = f.win
    ? Object.fromEntries(
        RESOURCES.map(r => [r, Math.round(beastLoot(p.lv) * WILD_LOOT * (1 + lead(s, m.elder, 'loot')))]),
      )
    : {}
  const gain = { ...noGain(), res, exp }
  let x = pushReport(s, {
    at,
    kind: 'spot',
    i,
    spot: p.kind,
    win: f.win,
    hurt,
    dead: {},
    gain,
    fights: [{ a: marchSnap(s, me, m), b: snap(foe, undefined, p.lv), rounds: f.rounds }],
  })
  // săn liên hoàn: cộng dồn chiến lợi phẩm, thương vong của các trận trước; về núi theo đường mới từ chỗ yêu thú
  const home = m.chain && s.seat ? route(map.atlas, s.seat, p, map.phase) : null
  const startAt = home ? at - routeMs(s, home.len, left) : m.startAt
  x = withMarch(x, {
    ...m,
    ...(home && { path: home.path, startAt }),
    back: left,
    hurt: addArmy(m.hurt, hurt),
    gain: m.chain && m.gain ? mergeGain(m.gain, gain) : gain,
    report: x.nextId - 1,
    returnAt: at + (at - startAt),
  })
  const chained = (x.stats.chained ?? 0) + (m.chain ? 1 : 0) // Liên Trảm Bất Hồi: con hạ bằng săn liên hoàn
  if (f.win)
    x = addHonor(
      { ...x, stats: { ...x.stats, hunted: (x.stats.hunted ?? 0) + 1, huntLv: (x.stats.huntLv ?? 0) + p.lv, chained } },
      HONOR_WILD * p.lv,
    )
  if (!f.win) return { changed: new Map([[pid, x]]), world: w }
  x = festDrop(x, 'hunt', m.seed, at) // Tích Cốc Phòng Cơ: có thể nhặt Linh Nang
  // Khai Giới Trảm Tà: pha Khai giới rơi tàn quyển, cộng giới vận cho minh · Yêu Vương Tuần Sơn: cấp cao rơi yêu cốt
  const n = map.phase === 0 ? eveFrags(p.lv) : 0
  if (n) x = { ...x, frag: (x.frag ?? 0) + n }
  if (boneOf(p.lv)) x = { ...x, bones: (x.bones ?? 0) + boneOf(p.lv) }
  return { changed: new Map([[pid, x]]), world: eveAdd(setSpot(w, i, { until: at + WILD_RESPAWN }), pid, n) }
}

// Thế lực của một đội (đệ tử × thế lực mỗi bậc) và cộng chiến công
const pow = (a: Army) => UNITS.reduce((n, u) => n + (a[u] ?? 0) * TIER[unitOf(u).tier].power, 0)

// Chiến công trận tranh điểm: mỗi bên được thế lực đệ tử bên kia hạ, chia theo thế lực đội mình mang tới
function takeKp(
  changed: Players,
  group: Party,
  foes: [number, March][],
  n0: number[],
  n1: number[],
  aOffs: number[],
  offs: number[],
) {
  const killedDef = foes.reduce((n, [, x], j) => n + pow(split(x, n1, offs[j]).hurt), 0)
  const killedAtt = group.reduce((n, [, , m2], j) => n + pow(split(m2, n0, aOffs[j]).hurt), 0)
  const aPow = group.reduce((n, [, , m2]) => n + pow(m2.army), 0) || 1,
    dPow = foes.reduce((n, [, x]) => n + pow(x.army), 0) || 1
  for (const [p2, , m2] of group) changed.set(p2, addKp(changed.get(p2)!, (killedDef * pow(m2.army)) / aPow))
  for (const [id2, x] of foes) changed.set(id2, addKp(changed.get(id2)!, (killedAtt * pow(x.army)) / dPow))
}

// Quân đang đóng ở điểm sau trận tranh điểm: chiến báo bên thủ; bị đánh bật (rep.win false) thì về nhà với phần còn lại,
// giữ được thì ở lại, bớt quân
function evict(
  changed: Players,
  ps: Players,
  foes: [number, March][],
  n1: number[],
  offs: number[],
  rep: Omit<Report, 'id' | 'hurt'>,
) {
  foes.forEach(([id2, x], j) => {
    const d = split(x, n1, offs[j])
    const hurt = addArmy(x.hurt, d.hurt)
    const ds = pushReport(changed.get(id2) ?? ps.get(id2)!, { ...rep, hurt: d.hurt })
    const out = {
      ...x,
      stay: false,
      back: d.left,
      hurt,
      gain: noGain(),
      report: ds.nextId - 1,
      returnAt: rep.at + travel(x),
    }
    changed.set(id2, withMarch(ds, rep.win ? { ...x, army: d.left, hurt } : out))
  })
}

// Chiếm điểm: trống hoặc của phe mình → đóng quân (tới khi đầy; đầy rồi thì null: quay về); của phe khác → đánh cả quân đang đóng
function take(ps: Players, w: World, map: MapCtx, group: Party, sp: Spot, at: number): Arrived | null {
  const [pid, att, m] = group[0]
  const i = m.target.i,
    p = map.atlas.points[i]
  const me = sideKey(w, pid)
  if (sp.own && sp.own > 0 && sp.own !== me && allyOf(w, pid)?.naps?.includes(sp.own)) return null // minh ước: về
  const { side: mine, offs: aOffs, leadSnap: lead0 } = attackers(group)
  const changed: Players = new Map()
  const gar = garrison(ps, i)
  const foes = gar.filter(([id2]) => sideKey(w, id2) !== me)
  const station = (list: Party, n0?: number[]) => {
    let room = GARRISON_MAX - gar.filter(([id2]) => sideKey(w, id2) === me).length
    list.forEach(([p2, s2, m2], j) => {
      const d = n0 ? split(m2, n0, aOffs[j]) : { left: m2.army, hurt: {} }
      const cur2 = changed.get(p2) ?? s2
      changed.set(
        p2,
        room-- > 0
          ? withMarch(cur2, { ...m2, army: d.left, hurt: addArmy(m2.hurt, d.hurt), stay: true })
          : turnBack(
              withMarch(cur2, { ...m2, army: d.left, hurt: addArmy(m2.hurt, d.hurt) }),
              { ...m2, army: d.left },
              at,
            ),
      )
    })
  }
  // chưa ai thuần phục: hộ trận linh thú giữ điểm, phải đánh bại trước (bại thì cả mùa không hồi)
  const guard = !foes.length && sp.own === undefined && !sp.tamed ? guardSide(map.atlas, i) : null
  if (!foes.length && !guard) {
    if (gar.length >= GARRISON_MAX) return null
    station(group)
    return { changed, world: sp.own === me ? w : hold(w, map, i, { own: me, since: at }, at) }
  }
  const { side: def, at: offs } = guard
    ? { side: guard, at: [0] }
    : combine(foes.map(([id2, x]) => marchSide(ps.get(id2)!, x)))
  const f = fight(mine, def, m.seed)
  const last = f.rounds.at(-1)
  const n0 = last?.n[0] ?? mine.troops.map(t => t.n),
    n1 = last?.n[1] ?? def.troops.map(t => t.n)
  const dSnap = guard ? snap(guard) : marchSnap(ps.get(foes[0][0])!, def, foes[0][1])
  group.forEach(([p2, s2, m2], j) => {
    const a = split(m2, n0, aOffs[j])
    changed.set(
      p2,
      pushReport(s2, {
        at,
        kind: 'spot',
        i,
        spot: p.kind,
        foe: guard ? '' : ps.get(foes[0][0])!.name, // '' : hộ trận linh thú (client ghi tên)
        win: f.win,
        hurt: a.hurt,
        dead: {},
        gain: noGain(),
        fights: [{ a: lead0, b: dSnap, rounds: f.rounds }],
      }),
    )
  })
  if (f.win) station(group, n0)
  else
    group.forEach(([p2, , m2], j) => {
      const a = split(m2, n0, aOffs[j])
      changed.set(
        p2,
        withMarch(changed.get(p2)!, {
          ...m2,
          back: a.left,
          hurt: addArmy(m2.hurt, a.hurt),
          gain: noGain(),
          returnAt: at + travel(m2),
        }),
      )
    })
  const rep = {
    at,
    kind: 'spot' as const,
    i,
    spot: p.kind,
    foe: att.name,
    def: true,
    win: !f.win,
    dead: {},
    gain: noGain(),
  }
  evict(changed, ps, foes, n1, offs, { ...rep, fights: [{ a: dSnap, b: lead0, rounds: flipRounds(f.rounds) }] })
  takeKp(changed, group, foes, n0, n1, aOffs, offs)
  return { changed, world: f.win ? hold(w, map, i, { own: me, since: at, ...(guard && { tamed: 1 }) }, at) : w }
}
