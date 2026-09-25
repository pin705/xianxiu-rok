// Trận PvE: mục tiêu, đội địch, đội mình, thương binh, phần thưởng, chiến báo; lôi kiếp; tỉ lệ thắng ước lượng.
import { fight, type Side } from '../combat.ts'
import { bump, eventMul } from './calendar.ts'
import {
  HIGH_FIRST,
  bonus,
  capOf,
  cutOf,
  deputyOf,
  elderLevel,
  expAt,
  hospital,
  lead,
  marchSlots,
  passive,
  unitOf,
  isMarching,
  daoUnit,
} from './stats.ts'
import { type Army, type Err, type Gain, type March, type Report, type Snap, type State, type Target } from './types.ts'
import { addBag, addItems, bag, compact, count, grow, mark, minus, nextSeed, noGain } from './util.ts'
import {
  BEAST_COOLDOWN,
  BEAST_EXP,
  BEAST_LOOT,
  BEAST_STR,
  BEASTS,
  BEATS,
  DEPUTY_SKILL,
  DO_KIEP,
  ELDER_DUP_EXP,
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
export function place(t: Target) {
  if (t.kind === 'beast') return BEASTS[t.i]
  if (t.kind === 'sect') return SECTS[t.i]
  if (t.kind === 'tower') return TOWER
  if (t.kind === 'pvp' || t.kind === 'spot') return PVP_GATE
  return REALMS[t.i]
}
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

// elder null: đội không người dẫn (giữ nhà khi không ai trấn thủ) — chỉ có bonus của tông môn.
// deputy: phó trưởng lão — tâm pháp đã mở cộng vào đội, công pháp nổ sau chủ tướng với DEPUTY_SKILL sức
export function sideOf(s: State, elder: ElderId | null, army: Army, deputy?: ElderId): Side {
  const m = elder ? 1 + ELDER_STEP * (elderLevel(s.elders[elder]) - 1) : 1
  const b = (k: Bonus) => (elder ? lead(s, elder, k) : bonus(s, k)) + (deputy ? passive(s, deputy, k) : 0)
  const sk = elder ? ELDERS[elder].skill : undefined,
    power = elder ? b('skill') : 0
  const ds = elder && deputy ? ELDERS[deputy].skill : undefined
  const uni = daoUnit(s)
  return {
    el: elder ? ELDERS[elder].el : undefined,
    skill: sk && power ? { ...sk, v: sk.v * (1 + power) } : sk,
    ...(ds && { skill2: { ...ds, v: ds.v * DEPUTY_SKILL * (1 + power) } }),
    ...(s.dao && { dao: s.dao.id }), // chiến báo vẽ đệ tử đặc trưng
    troops: UNITS.filter(u => (army[u] ?? 0) > 0).map(u => {
      const { type, tier } = unitOf(u)
      const base = UNIT_BASE[type],
        k = TIER[tier].stat
      const d = uni?.type === type ? uni : undefined // đệ tử đặc trưng: chỉ số gốc cao hơn (× 1 thì giữ nguyên từng số)
      return {
        type,
        tier,
        n: army[u]!,
        atk: base.atk * k * m * (1 + b('atk') + b(`atk.${type}`)) * (1 + (d?.atk ?? 0)),
        def: base.def * k * (1 + b('def')) * (1 + (d?.def ?? 0)),
        hp: base.hp * k * m * (1 + b('hp') + b(`hp.${type}`)) * (1 + (d?.hp ?? 0)),
      }
    }),
  }
}

export function armyError(s: State, elder: ElderId, army: Army): Err | null {
  if (!(elder in ELDERS) || s.elders[elder] === undefined) return 'locked'
  if (isMarching(s, elder)) return 'busy'
  for (const u of Object.keys(army)) if (!UNITS.includes(u as UnitId)) return 'bad'
  for (const u of UNITS) {
    const n = army[u] ?? 0
    if (!Number.isInteger(n) || n < 0) return 'bad'
    if (n > s.troops[u]) return 'not_enough'
  }
  return count(army) ? null : 'empty'
}

// Đội đang đi (trên bản đồ giới): chủ tướng, phó đi cùng, quân mang theo; ảnh chụp đội đó trong chiến báo
export const marchSide = (s: State, m: March) => sideOf(s, m.elder, compact(m.army), m.deputy)
export const marchSnap = (s: State, side: Side, m: March) =>
  snap(side, m.elder, elderLevel(s.elders[m.elder]), m.deputy)

export const snap = (side: Side, elder?: ElderId, level = 1, deputy?: ElderId): Snap => ({
  elder,
  ...(deputy && { deputy }),
  level,
  ...(side.dao && { dao: side.dao }),
  troops: side.troops.map(t => ({ type: t.type, tier: t.tier, n: t.n })),
})

// Thương binh về Đan phòng; hết chỗ thì phần dư tử trận. Nhận bậc cao trước.
export function admit(s: State, hurt: Army): { state: State; dead: Army } {
  let room = Math.max(0, hospital(s) - count(s.wounded))
  const wounded = { ...s.wounded }
  const dead: Army = {}
  for (const u of HIGH_FIRST) {
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

export const addGain = (s: State, elder: ElderId, g: Gain): State => giveExp(grant(s, g), elder, g.exp)

// Quà từ ngoài (thư, mốc sự kiện): tài nguyên, đan, trưởng lão — không có kinh nghiệm.
// Trưởng lão đã có thì đổi thành kinh nghiệm cho chính người đó (như tượng tướng trùng của RoK): quà không bao giờ mất.
export function grant(s: State, r: Reward): State {
  const extra = (r.hallRes ?? 0) * s.levels.chuDien
  const res = extra
    ? addBag(
        s.res,
        bag(x => (r.res?.[x] ?? 0) + extra),
      )
    : addBag(s.res, r.res ?? {})
  const st: State = { ...s, res, items: addItems(s.items, r.items ?? {}) }
  if (!r.elder) return st
  return st.elders[r.elder] === undefined
    ? { ...st, elders: { ...st.elders, [r.elder]: 0 } }
    : giveExp(st, r.elder, ELDER_DUP_EXP)
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
  stats: {
    ...s.stats,
    won: s.stats.won + (r.win ? 1 : 0),
    lost: s.stats.lost + (r.win ? 0 : 1),
    hunted: (s.stats.hunted ?? 0) + (r.win && r.kind === 'beast' ? 1 : 0),
  },
})

// Đánh một mục tiêu trên bản đồ. Cập nhật tiến độ bản đồ + chiến báo; phần thưởng trả về để người gọi trao
// (hành quân: lúc về tới tông môn; bí cảnh: ngay).
export function battle(s: State, t: Target, elder: ElderId, army: Army, seed: number, at: number, deputy?: ElderId) {
  const ids = UNITS.filter(u => (army[u] ?? 0) > 0)
  const me = sideOf(s, elder, army, deputy)
  const foe = enemyOf(s, t)
  const f = fight(me, foe, seed)
  const left = f.rounds.at(-1)?.n[0] ?? ids.map(u => army[u]!)
  const back = Object.fromEntries(ids.map((u, k) => [u, left[k]])) as Army
  const hurt = Object.fromEntries(ids.map((u, k) => [u, army[u]! - left[k]])) as Army
  const loot = (1 + lead(s, elder, 'loot')) * eventMul(at)
  const expMul = (1 + lead(s, elder, 'exp')) * (f.win ? 1 : LOSS_EXP) * eventMul(at)
  let st = s
  let g = noGain()
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
        sects: mark(st.sects, t.i),
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
    kind: t.kind as Report['kind'], // trận PvE: không bao giờ là trận kỳ (world/flags.ts)
    i: t.i,
    f: floor,
    win: f.win,
    hurt,
    dead: {},
    gain: g,
    fights: [
      { a: snap(me, elder, elderLevel(s.elders[elder]), deputy), b: snap(foe, undefined, foeLevel), rounds: f.rounds },
    ],
  })
  return { state: st, back, hurt, gain: g, report: st.nextId - 1 }
}

// Đan độ kiếp được dùng khi bật "dùng đan": viên mạnh nhất đang có
export function tribPill(s: State, want: boolean): 'phaCanh' | 'doKiep' | null {
  if (!want) return null
  if (s.items.phaCanh) return 'phaCanh'
  return s.items.doKiep ? 'doKiep' : null
}

// Ba đợt lôi kiếp nối nhau; đệ tử còn đứng được đi tiếp sang đợt sau. mul: hộ pháp / phá kiếp (kiếp vân công khai)
export function tribulation(
  s: State,
  elder: ElderId,
  army: Army,
  p: PillId | null,
  seed: number,
  mul = 1,
  deputy?: ElderId,
) {
  const tr = TRIBS[s.trib]
  const weaken =
    (1 - Math.min(MAX_CUT, lead(s, elder, 'trib'))) * (p === 'phaCanh' ? 1 - PHA_CANH : p ? 1 - DO_KIEP : 1) * mul
  const lv = elderLevel(s.elders[elder])
  let me = sideOf(s, elder, army, deputy)
  let win = true
  const fights: Report['fights'] = []
  for (const w of tr.waves) {
    const wave = mob(w.str, tr.tier, [[w.type, 1]], 1, undefined, weaken)
    const foe = w.el ? { ...wave, el: w.el } : wave
    const f = fight(me, foe, seed)
    seed = nextSeed(seed)
    fights.push({ a: snap(me, elder, lv, deputy), b: snap(foe), rounds: f.rounds })
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
export function chance(win: (seed: number) => boolean) {
  let won = 0
  for (let k = 1; k <= 9; k++) if (win(Math.imul(k, 0x9e3779b1) >>> 0)) won++
  return won / 9
}
// Tính đủ hệ khắc, công pháp trưởng lão, lôi kiếp — lực chiến thô thì không (đội bị khắc hệ hiện "áp đảo" mà thua 1/4).
export function winChance(s: State, elder: ElderId, army: Army, t: Target | 'trib', pill = false) {
  if (!count(army) || s.elders[elder] === undefined) return 0
  if (t === 'trib' && !TRIBS[s.trib]) return 0
  const d = deputyOf(s, elder)
  return chance(seed =>
    t === 'trib'
      ? tribulation(s, elder, army, tribPill(s, pill), seed, 1, d).win
      : fight(sideOf(s, elder, army, d), enemyOf(s, t), seed).win,
  )
}

// Đội xuất quân được: trưởng lão rảnh, đủ quân, còn lượt xuất quân
export const marchError = (s: State, elder: ElderId, army: Army) =>
  armyError(s, elder, army) ?? (s.marches.length >= marchSlots(s) ? 'slots' : null)
// Đội ra bản đồ giới: như trên, thêm trận dung của trưởng lão dẫn đội
export const fieldError = (s: State, elder: ElderId, army: Army) =>
  marchError(s, elder, army) ?? (count(army) > capOf(s, elder) ? 'cap' : null)
// Cắt đội vừa trận dung: giữ bậc cao trước (bot, nút "Tất cả" trên màn chọn đội)
export function capArmy(s: State, elder: ElderId, army: Army): Army {
  let room = capOf(s, elder)
  const out: Army = {}
  for (const u of HIGH_FIRST) {
    const n = Math.min(army[u] ?? 0, room)
    if (n > 0) out[u] = n
    room -= n
  }
  return out
}
// Đội rời nhà: trừ quân ở nhà, thêm hành quân (phó trưởng lão đã ghép, đang rảnh thì đi cùng)
export function launch(s: State, army: Army, m: March): State {
  const deputy = deputyOf(s, m.elder)
  return {
    ...s,
    troops: minus(s.troops, army),
    marches: [...s.marches, deputy ? { ...m, deputy } : m],
    nextId: s.nextId + 1,
  }
}
