import {
  ADV,
  BEATS,
  DEF_K,
  DISADV,
  EL_ADV,
  EL_DISADV,
  MAX_ROUNDS,
  OVERCOMES,
  RAGE_HURT,
  RAGE_MAX,
  RAGE_TURN,
  type DaoId,
  type Element,
  type Skill,
  type Tier,
  type UnitType,
} from './data.ts'

// Trận tự động theo lượt, tất định theo seed: cùng đầu vào + seed → cùng kết quả trên mọi máy.
// Hai bên ra đòn cùng lúc mỗi lượt (không ai được lợi vì đánh trước). Sát thương chia cho các nhóm địch
// theo tổng máu của nhóm, nhân hệ khắc, trừ phần thủ chặn được.

export type Troop = { type: UnitType; tier: Tier; n: number; atk: number; def: number; hp: number }
// el: ngũ hành của người dẫn / của địch · skill2: công pháp của phó trưởng lão (nổ cùng lượt, ngay sau chủ tướng)
// dao: đạo thống của tông môn người chơi (chỉ để vẽ đệ tử đặc trưng — chỉ số đã tính sẵn trong troops)
export type Side = { troops: Troop[]; skill?: Skill; skill2?: Skill; el?: Element; dao?: DaoId }
// n: số còn lại của từng nhóm sau lượt · cast: bên nào thi triển công pháp lượt này · rage: chân nguyên hai bên sau lượt
// (chiến báo cũ chưa có)
export type Round = {
  n: [number[], number[]]
  cast: [boolean, boolean]
  rage?: [number, number]
  src?: [[number, number], [number, number]] // sát thương mỗi bên gây ra lượt này theo nguồn: [đòn thường, công pháp] (chiến báo cũ chưa có)
  heal?: [number, number] // đệ tử mỗi bên hồi lại nhờ công pháp lượt này
}
export type Fight = { win: boolean; rounds: Round[] }

// mulberry32: chỉ dùng phép số nguyên 32-bit nên mọi engine ra cùng dãy
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const advantage = (att: UnitType, def: UnitType) => (BEATS[att] === def ? ADV : BEATS[def] === att ? DISADV : 1)
// Ngũ hành: một bên không có hành (mọi nội dung P1) thì 1 — nhân 1 giữ nguyên từng bit, trận cũ ra đúng kết quả cũ
export function elAdv(att?: Element, def?: Element) {
  if (!att || !def) return 1
  if (OVERCOMES[att] === def) return EL_ADV
  return OVERCOMES[def] === att ? EL_DISADV : 1
}

const skills = (s: Side) => (s.skill2 ? [s.skill!, s.skill2] : [s.skill!])

export function fight(a: Side, b: Side, seed: number): Fight {
  const rand = rng(seed)
  const sides = [a, b]
  const n = sides.map(s => s.troops.map(t => t.n))
  const hurt = sides.map(s => s.troops.map(() => 0)) // sát thương lẻ chưa đủ hạ một đệ tử
  const weak = [
    { v: 0, left: 0 },
    { v: 0, left: 0 },
  ]
  const el = [elAdv(a.el, b.el), elAdv(b.el, a.el)]
  const alive = (i: number) => n[i].some(x => x > 0)
  const rage = [0, 0]
  const pool = sides.map((s, i) => s.troops.reduce((sum, t, k) => sum + n[i][k] * t.hp, 0)) // máu lúc vào trận
  const rounds: Round[] = []

  for (let r = 1; r <= MAX_ROUNDS && alive(0) && alive(1); r++) {
    const cast: [boolean, boolean] = [false, false]
    const guard = [1, 1]
    const src: [[number, number], [number, number]] = [
      [0, 0],
      [0, 0],
    ]
    const healed: [number, number] = [0, 0]
    for (const i of [0, 1]) {
      if (!sides[i].skill) continue
      rage[i] += RAGE_TURN
      if (rage[i] < RAGE_MAX) continue
      rage[i] -= RAGE_MAX
      cast[i] = true
      for (const sk of skills(sides[i])) {
        if (sk.kind === 'shield') guard[i] *= 1 - sk.v
        // hai độc vụ cùng lượt: chồng nhân (1 − v1)(1 − v2); một thì giữ đúng v
        if (sk.kind === 'weaken')
          weak[1 - i] = { v: weak[1 - i].left === 2 ? 1 - (1 - weak[1 - i].v) * (1 - sk.v) : sk.v, left: 2 }
        if (sk.kind === 'heal')
          sides[i].troops.forEach((t, k) => {
            const back = Math.floor((t.n - n[i][k]) * sk.v)
            n[i][k] += back
            healed[i] += back
          })
      }
    }
    const atkMul = weak.map(w => (w.left-- > 0 ? 1 - w.v : 1))

    const dmg = sides.map(s => s.troops.map(() => 0))
    for (const i of [0, 1]) {
      const j = 1 - i
      const foe = sides[j].troops
      const bulk = foe.reduce((sum, t, k) => sum + n[j][k] * t.hp, 0)
      if (!bulk) continue
      const hit = (power: number, type: UnitType | undefined, from: 0 | 1) =>
        foe.forEach((t, k) => {
          if (!n[j][k]) return
          const adv = type ? advantage(type, t.type) : 1
          const d = ((power * n[j][k] * t.hp) / bulk) * adv * (DEF_K / (DEF_K + t.def)) * guard[j] * el[i]
          dmg[j][k] += d
          src[i][from] += d
        })
      sides[i].troops.forEach((t, k) => n[i][k] && hit(n[i][k] * t.atk * atkMul[i] * (0.9 + 0.2 * rand()), t.type, 0))
      for (const sk of cast[i] ? skills(sides[i]) : [])
        if (sk.kind === 'burst') {
          const base = sides[i].troops.reduce(
            (sum, t, k) => sum + (!sk.type || t.type === sk.type ? n[i][k] * t.atk : 0),
            0,
          )
          hit(base * sk.v * atkMul[i], sk.type, 1)
        }
    }

    for (const i of [0, 1]) {
      let lost = 0
      sides[i].troops.forEach((t, k) => {
        hurt[i][k] += dmg[i][k]
        const kills = Math.min(n[i][k], Math.floor(hurt[i][k] / t.hp))
        n[i][k] -= kills
        hurt[i][k] = n[i][k] ? hurt[i][k] - kills * t.hp : 0
        lost += kills * t.hp
      })
      if (sides[i].skill && pool[i]) rage[i] += (RAGE_HURT * lost) / pool[i]
    }
    rounds.push({
      n: [[...n[0]], [...n[1]]],
      cast,
      rage: [Math.floor(rage[0]), Math.floor(rage[1])],
      src: [
        [Math.round(src[0][0]), Math.round(src[0][1])],
        [Math.round(src[1][0]), Math.round(src[1][1])],
      ],
      ...(healed[0] + healed[1] > 0 && { heal: healed }),
    })
  }
  return { win: alive(0) && !alive(1), rounds }
}

// Sức mạnh ước lượng để so hai bên trên giao diện (không dùng để phân thắng bại)
export const might = (s: Side) =>
  Math.round(s.troops.reduce((sum, t) => sum + t.n * Math.sqrt(t.atk * t.hp) * (1 + t.def / DEF_K), 0) / 20)
