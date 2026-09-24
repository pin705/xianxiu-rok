// Trận PvE: mục tiêu, đội địch, đội mình, thương binh, phần thưởng, chiến báo; lôi kiếp; tỉ lệ thắng ước lượng.
import { fight, type Side } from '../combat.ts'
import { bump, eventMul } from './calendar.ts'
import { bonus, cutOf, elderLevel, expAt, hospital, lead, unitOf } from './stats.ts'
import { type Army, type Err, type Gain, type Report, type Snap, type State, type Target } from './types.ts'
import { addBag, addItems, bag, count, grow, nextSeed } from './util.ts'
import {
  BEAST_COOLDOWN,
  BEAST_EXP,
  BEAST_LOOT,
  BEAST_STR,
  BEASTS,
  BEATS,
  DO_KIEP,
  ELDER_MAX,
  ELDER_STEP,
  ELDERS,
  HOME,
  LOSS_EXP,
  MAIN_SHARE,
  MAP_HALL,
  MARCH_MIN,
  MARCH_SPEED,
  MAX_CUT,
  PHA_CANH,
  PVP_GATE,
  REALMS,
  RESOURCES,
  SECT_COOLDOWN,
  SECT_SHARE,
  SECTS,
  TIER,
  TOWER,
  TOWER_ELDERS,
  TOWER_GROW,
  TOWER_RES,
  TOWER_RES_GROW,
  TOWER_STR,
  TRIBS,
  TYPES,
  UNIT_BASE,
  UNITS,
  type Bonus,
  type ElderId,
  type PillId,
  type Reward,
  type Skill,
  type Tier,
  type UnitId,
  type UnitType,
} from '../data.ts'

export const tierFor = (level: number): Tier => (level <= 5 ? 1 : level <= 10 ? 2 : 3)
export const beastStr = (level: number) => grow(BEAST_STR[0], BEAST_STR[1], level - 1)
export const beastLoot = (level: number) => grow(BEAST_LOOT[0], BEAST_LOOT[1], level - 1)
export const beastExp = (level: number) => grow(BEAST_EXP[0], BEAST_EXP[1], level - 1)
export const place = (t: Target) =>
  t.kind === 'beast'
    ? BEASTS[t.i]
    : t.kind === 'sect'
      ? SECTS[t.i]
      : t.kind === 'tower'
        ? TOWER
        : t.kind === 'pvp' || t.kind === 'spot'
          ? PVP_GATE
          : REALMS[t.i]
export const marchTime = (s: State, t: Target) => {
  const p = place(t)
  return (
    Math.round(Math.max(MARCH_MIN, Math.hypot(p.x - HOME.x, p.y - HOME.y) * MARCH_SPEED) * cutOf(s, 'march')) * 1000
  )
}
export const coolKey = (t: Target) => `${t.kind}${t.i}`
const sameTarget = (a: Target, b: Target) => a.kind === b.kind && a.i === b.i

export function targetError(s: State, t: Target, at = s.time): Err | null {
  const hall = s.levels.chuDien
  if (hall < MAP_HALL) return 'locked'
  if (t.kind === 'beast' && (t.i < 0 || t.i >= BEASTS.length || t.i > s.beast)) return 'locked'
  if (t.kind === 'sect' && (!SECTS[t.i] || hall < SECTS[t.i].hall)) return 'locked'
  if (t.kind === 'tower' && hall < TOWER.hall) return 'locked'
  if (t.kind === 'realm') {
    if (!REALMS[t.i] || hall < REALMS[t.i].hall) return 'locked'
    if (s.realms[t.i] >= REALMS[t.i].floors.length) return 'max_level'
  }
  if ((s.cool[coolKey(t)] ?? 0) > at) return 'cooldown'
  if (s.marches.some(m => !m.back && sameTarget(m.target, t))) return 'busy'
  return null
}

// Đội địch: str tính bằng số đệ tử bậc 1, chia theo tỉ lệ các hệ
export function mob(str: number, tier: Tier, parts: [UnitType, number][], level = 1, skill?: Skill, weaken = 1): Side {
  const k = TIER[tier].stat
  const m = k * (1 + ELDER_STEP * (level - 1))
  return {
    skill,
    troops: parts.map(([type, share]) => ({
      type,
      tier,
      n: Math.max(1, Math.round((str * share) / k)),
      atk: UNIT_BASE[type].atk * m * weaken,
      def: UNIT_BASE[type].def * k,
      hp: UNIT_BASE[type].hp * m,
    })),
  }
}
const pair = (type: UnitType, share: number): [UnitType, number][] => [
  [type, share],
  [BEATS[type], 1 - share],
]

// Thông Thiên Tháp, tầng f (0 = tầng 1): sức địch, hệ chính (đổi theo vòng), thưởng lần đầu
export const towerStr = (f: number) => grow(TOWER_STR, TOWER_GROW, f)
export const towerType = (f: number): UnitType => TYPES[f % TYPES.length]
export function towerReward(f: number): Reward {
  const n = f + 1
  return {
    res: bag(() => grow(TOWER_RES, TOWER_RES_GROW, f)),
    items: n % 10 === 0 ? { doKiep: 1, boiNguyen: 1 } : n % 5 === 0 ? { tuKhi: 3 } : undefined,
    elder: TOWER_ELDERS[n],
    exp: 300 + 40 * f,
  }
}

export function enemyOf(s: State, t: Target): Side {
  if (t.kind === 'tower') return mob(towerStr(s.tower), 3, pair(towerType(s.tower), MAIN_SHARE), 1 + s.tower)
  if (t.kind === 'beast') {
    const level = t.i + 1
    return mob(beastStr(level), tierFor(level), pair(BEASTS[t.i].type, MAIN_SHARE))
  }
  if (t.kind === 'sect') {
    const d = SECTS[t.i]
    const rest = TYPES.filter(x => x !== d.type).map(x => [x, (1 - SECT_SHARE) / 2] as [UnitType, number])
    return mob(d.str, tierFor(d.hall), [[d.type, SECT_SHARE], ...rest], d.elder.level, d.elder.skill)
  }
  const d = REALMS[t.i]
  const f = Math.min(s.realms[t.i], d.floors.length - 1)
  const side = mob(d.floors[f].str, d.tier, pair(d.type, MAIN_SHARE))
  return d.el ? { ...side, el: d.el } : side
}

// elder null: đội không người dẫn (giữ nhà khi không ai trấn thủ) — chỉ có bonus của tông môn
export function sideOf(s: State, elder: ElderId | null, army: Army): Side {
  const m = elder ? 1 + ELDER_STEP * (elderLevel(s.elders[elder]) - 1) : 1
  const b = (k: Bonus) => (elder ? lead(s, elder, k) : bonus(s, k))
  const sk = elder ? ELDERS[elder].skill : undefined,
    power = elder ? b('skill') : 0
  return {
    el: elder ? ELDERS[elder].el : undefined,
    skill: sk && power ? { ...sk, v: sk.v * (1 + power) } : sk,
    troops: UNITS.filter(u => (army[u] ?? 0) > 0).map(u => {
      const { type, tier } = unitOf(u)
      const base = UNIT_BASE[type],
        k = TIER[tier].stat
      return {
        type,
        tier,
        n: army[u]!,
        atk: base.atk * k * m * (1 + b('atk') + b(`atk.${type}`)),
        def: base.def * k * (1 + b('def')),
        hp: base.hp * k * m * (1 + b('hp') + b(`hp.${type}`)),
      }
    }),
  }
}

export function armyError(s: State, elder: ElderId, army: Army): Err | null {
  if (!(elder in ELDERS) || s.elders[elder] === undefined) return 'locked'
  if (s.marches.some(m => m.elder === elder)) return 'busy'
  for (const u of Object.keys(army)) if (!UNITS.includes(u as UnitId)) return 'bad'
  for (const u of UNITS) {
    const n = army[u] ?? 0
    if (!Number.isInteger(n) || n < 0) return 'bad'
    if (n > s.troops[u]) return 'not_enough'
  }
  return count(army) ? null : 'empty'
}

export const snap = (side: Side, elder?: ElderId, level = 1): Snap => ({
  elder,
  level,
  troops: side.troops.map(t => ({ type: t.type, tier: t.tier, n: t.n })),
})

// Thương binh về Đan phòng; hết chỗ thì phần dư tử trận. Nhận bậc cao trước.
export function admit(s: State, hurt: Army): { state: State; dead: Army } {
  let room = Math.max(0, hospital(s) - count(s.wounded))
  const wounded = { ...s.wounded }
  const dead: Army = {}
  for (const u of [...UNITS].sort((a, b) => unitOf(b).tier - unitOf(a).tier)) {
    const n = hurt[u] ?? 0
    const inn = Math.min(n, room)
    room -= inn
    wounded[u] += inn
    if (n > inn) dead[u] = n - inn
  }
  return { state: { ...s, wounded }, dead }
}

export function giveExp(s: State, elder: ElderId, exp: number): State {
  const cur = s.elders[elder]
  if (cur === undefined) return s
  return { ...s, elders: { ...s.elders, [elder]: Math.min(expAt(ELDER_MAX), cur + exp) } }
}

export function addGain(s: State, elder: ElderId, g: Gain): State {
  let st: State = { ...s, res: addBag(s.res, g.res), items: addItems(s.items, g.items) }
  if (g.elder && st.elders[g.elder] === undefined) st = { ...st, elders: { ...st.elders, [g.elder]: 0 } }
  return giveExp(st, elder, g.exp)
}

// Quà từ ngoài (thư, mốc sự kiện): tài nguyên, đan, trưởng lão — không có kinh nghiệm
export function grant(s: State, r: Reward): State {
  const st: State = { ...s, res: addBag(s.res, r.res ?? {}), items: addItems(s.items, r.items ?? {}) }
  return r.elder && st.elders[r.elder] === undefined ? { ...st, elders: { ...st.elders, [r.elder]: 0 } } : st
}

const fromReward = (r: Reward, lootMul: number, exp: number): Gain => ({
  res: Object.fromEntries(RESOURCES.map(x => [x, Math.round((r.res?.[x] ?? 0) * lootMul)])),
  items: { ...r.items },
  elder: r.elder,
  exp: Math.round(exp),
})

export const pushReport = (s: State, r: Omit<Report, 'id'>): State => ({
  ...s,
  nextId: s.nextId + 1,
  reports: [...s.reports, { ...r, id: s.nextId }].slice(-30),
  stats: { ...s.stats, won: s.stats.won + (r.win ? 1 : 0), lost: s.stats.lost + (r.win ? 0 : 1) },
})

// Đánh một mục tiêu trên bản đồ. Cập nhật tiến độ bản đồ + chiến báo; phần thưởng trả về để người gọi trao
// (hành quân: lúc về tới tông môn; bí cảnh: ngay).
export function battle(s: State, t: Target, elder: ElderId, army: Army, seed: number, at: number) {
  const ids = UNITS.filter(u => (army[u] ?? 0) > 0)
  const me = sideOf(s, elder, army)
  const foe = enemyOf(s, t)
  const f = fight(me, foe, seed)
  const left = f.rounds.at(-1)?.n[0] ?? ids.map(u => army[u]!)
  const back = Object.fromEntries(ids.map((u, k) => [u, left[k]])) as Army
  const hurt = Object.fromEntries(ids.map((u, k) => [u, army[u]! - left[k]])) as Army
  const loot = (1 + lead(s, elder, 'loot')) * eventMul(at)
  const expMul = (1 + lead(s, elder, 'exp')) * (f.win ? 1 : LOSS_EXP) * eventMul(at)
  let st = s
  let g: Gain = { res: {}, items: {}, exp: 0 }
  let floor: number | undefined
  let foeLevel = 1

  if (t.kind === 'beast') {
    const level = t.i + 1
    g.exp = Math.round(beastExp(level) * expMul)
    if (f.win) {
      g = fromReward({ res: bag(() => beastLoot(level)) }, loot, g.exp)
      st = { ...st, beast: Math.max(st.beast, level), cool: { ...st.cool, [coolKey(t)]: at + BEAST_COOLDOWN } }
    }
  } else if (t.kind === 'sect') {
    const d = SECTS[t.i]
    foeLevel = d.elder.level
    g.exp = Math.round(d.exp * expMul)
    if (f.win) {
      g = st.sects[t.i] ? fromReward({ res: bag(() => d.loot) }, loot, g.exp) : fromReward(d.first, 1, g.exp)
      st = {
        ...st,
        sects: st.sects.map((x, k) => x || k === t.i),
        cool: { ...st.cool, [coolKey(t)]: at + SECT_COOLDOWN },
      }
    }
  } else if (t.kind === 'tower') {
    floor = st.tower
    foeLevel = 1 + floor
    const r = towerReward(floor)
    g.exp = Math.round((r.exp ?? 0) * expMul)
    if (f.win) {
      g = fromReward(r, 1, g.exp)
      st = { ...st, tower: floor + 1 }
    }
  } else {
    floor = st.realms[t.i]
    const r = REALMS[t.i].floors[floor].reward
    g.exp = Math.round((r.exp ?? 0) * expMul)
    if (f.win) {
      g = fromReward(r, 1, g.exp)
      st = { ...st, realms: st.realms.map((x, k) => (k === t.i ? x + 1 : x)) }
    }
  }
  if (f.win) st = bump(st, 'win')
  st = pushReport(st, {
    at,
    kind: t.kind,
    i: t.i,
    f: floor,
    win: f.win,
    hurt,
    dead: {},
    gain: g,
    fights: [{ a: snap(me, elder, elderLevel(s.elders[elder])), b: snap(foe, undefined, foeLevel), rounds: f.rounds }],
  })
  return { state: st, back, hurt, gain: g, report: st.nextId - 1 }
}

// Đan độ kiếp được dùng khi bật "dùng đan": viên mạnh nhất đang có
export const tribPill = (s: State, want: boolean): 'phaCanh' | 'doKiep' | null =>
  !want ? null : s.items.phaCanh ? 'phaCanh' : s.items.doKiep ? 'doKiep' : null

// Ba đợt lôi kiếp nối nhau; đệ tử còn đứng được đi tiếp sang đợt sau. mul: hộ pháp / phá kiếp (kiếp vân công khai)
export function tribulation(s: State, elder: ElderId, army: Army, p: PillId | null, seed: number, mul = 1) {
  const tr = TRIBS[s.trib]
  const weaken =
    (1 - Math.min(MAX_CUT, lead(s, elder, 'trib'))) * (p === 'phaCanh' ? 1 - PHA_CANH : p ? 1 - DO_KIEP : 1) * mul
  const lv = elderLevel(s.elders[elder])
  let me = sideOf(s, elder, army)
  let win = true
  const fights: Report['fights'] = []
  for (const w of tr.waves) {
    const wave = mob(w.str, tr.tier, [[w.type, 1]], 1, undefined, weaken)
    const foe = w.el ? { ...wave, el: w.el } : wave
    const f = fight(me, foe, seed)
    seed = nextSeed(seed)
    fights.push({ a: snap(me, elder, lv), b: snap(foe), rounds: f.rounds })
    const left = f.rounds.at(-1)?.n[0]
    if (left) me = { ...me, troops: me.troops.map((x, i) => ({ ...x, n: left[i] })) }
    if (!f.win) {
      win = false
      break
    }
  }
  return { win, fights, left: me.troops.map(x => x.n), seed }
}

// Tỉ lệ thắng ước lượng để hiện cho người chơi: đánh thử với 9 mầm cố định, khác mầm thật (không lộ đúng kết quả).
// Tính đủ hệ khắc, công pháp trưởng lão, lôi kiếp — lực chiến thô thì không (đội bị khắc hệ hiện "áp đảo" mà thua 1/4).
export function winChance(s: State, elder: ElderId, army: Army, t: Target | 'trib', pill = false) {
  if (!count(army) || s.elders[elder] === undefined) return 0
  if (t === 'trib' && !TRIBS[s.trib]) return 0
  let won = 0
  for (let k = 1; k <= 9; k++) {
    const seed = Math.imul(k, 0x9e3779b1) >>> 0
    if (
      t === 'trib'
        ? tribulation(s, elder, army, tribPill(s, pill), seed).win
        : fight(sideOf(s, elder, army), enemyOf(s, t), seed).win
    )
      won++
  }
  return won / 9
}
