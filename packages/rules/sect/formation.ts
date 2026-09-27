// Trận Pháp + Vân Du Đường (Formations · Armaments · State Forum của RoK): bày trận (s.form), vân du tốn hành lực ra trận khí / Hiền Sĩ
// Lệnh (mầm của server: client mầm 0 chỉ đoán, kết quả tới cùng patch), đeo / gỡ trận khí vào ô của trận nó thuộc, luyện hoá trận khí
// thừa ra lệnh, đổi rương trận khí phẩm chắc chắn. Tăng ích tính ở core/form.ts (sideOf)
import { fight, type Side } from '../combat.ts'
import { no, ok, type Actions } from '../core/action.ts'
import { mob } from '../core/battle.ts'
import { dayOf } from '../core/calendar.ts'
import { formOpen } from '../core/form.ts'
import { int, oneOf } from '../core/parse.ts'
import { apOf, spendAp } from '../core/stats.ts'
import type { Arm, State } from '../core/types.ts'
import { nextSeed } from '../core/util.ts'
import {
  ARM_BAG,
  ARM_MELT,
  ARM_ODDS,
  ARM_SHOP,
  ARM_SLOTS,
  DRILLF,
  DRILLF_COIN,
  DRILLF_K,
  DRILLF_KEEP,
  DRILLF_STR,
  FORMS,
  FORM_IDS,
  INS_ODDS,
  INS_SPECIAL,
  VANDU_AP,
  VANDU_ARM,
  VANDU_COIN,
  VANDU_DAILY,
  VANDU_HALL,
  type FormId,
} from '../data.ts'

export const vanduUsed = (s: State, t: number) => (s.vandu?.day === dayOf(t) ? s.vandu.n : 0)
export const armOf = (s: State, id: number) => s.arms?.find(a => a.id === id)
export const armWorn = (s: State, id: number) => Object.values(s.armOn ?? {}).some(on => on?.includes(id))

// Rút từ mầm: số thực [0, 1) và mầm kế
const roll = (seed: number): [number, number] => [(seed >>> 0) / 2 ** 32, nextSeed(seed)]
// Một trận khí phẩm q (trận ngẫu nhiên trong các trận đã mở, ô ngẫu nhiên, q + 1 dòng trận văn — tối đa một dòng đặc biệt)
function rollArm(s: State, id: number, q: number, seed0: number): [Arm, number] {
  const open = FORM_IDS.filter(f => formOpen(s, f))
  let [x, seed] = roll(seed0)
  const f = open[Math.floor(x * open.length)] ?? FORM_IDS[0]
  ;[x, seed] = roll(seed)
  const slot = Math.floor(x * ARM_SLOTS.length)
  const ins: number[] = []
  for (let k = 0; k <= q; k++) {
    let y: number
    ;[x, seed] = roll(seed)
    ;[y, seed] = roll(seed)
    const [rare, special] = INS_ODDS[q]
    const kind = Math.floor(y * 4)
    if (x < special && !ins.includes(INS_SPECIAL)) ins.push(INS_SPECIAL)
    else ins.push(x < special + rare ? 4 + kind : kind)
  }
  return [{ id, f, slot, q, ins }, seed]
}
const pickQ = (x: number) => {
  let acc = 0
  const q = ARM_ODDS.findIndex(w => (acc += w) > x)
  return q < 0 ? ARM_ODDS.length - 1 : q
}

// Trận Đồ Diễn Luyện: đội mượn của màn k bày trận form (trên sa bàn trận phát huy DRILLF_K lần) và quân địch
export function drillSides(k: number, form: FormId | null): { mine: Side; foe: Side } {
  const d = DRILLF[k]
  const me = mob(DRILLF_STR, 3, d.me, 5, d.skill)
  const b = (key: string) => (form ? ((FORMS[form].bonus as Record<string, number>)[key] ?? 0) * DRILLF_K : 0)
  const mine: Side = {
    ...me,
    skill: me.skill && { ...me.skill, v: me.skill.v * (1 + b('skill')) },
    troops: me.troops.map(t => ({
      ...t,
      atk: t.atk * (1 + b('atk') + b(`atk.${t.type}`)),
      def: t.def * (1 + b('def')),
      hp: t.hp * (1 + b('hp') + b(`hp.${t.type}`)),
    })),
  }
  return { mine, foe: mob(d.str, 3, d.foe, 5) }
}
// Một lượt diễn luyện (tất định — mầm cố định từng màn): thắng không, phần quân còn, mục tiêu đạt (bit 1 thắng · 2 còn quân · 4 đúng trận)
export function drillRun(k: number, form: FormId | null) {
  const d = DRILLF[k]
  const { mine, foe } = drillSides(k, form)
  const f = d.def ? fight(foe, mine, 1000 + k) : fight(mine, foe, 1000 + k)
  const side = d.def ? 1 : 0
  const last = f.rounds.at(-1)?.n[side] ?? mine.troops.map(t => t.n)
  const left = last.reduce((a, x) => a + x, 0) / mine.troops.reduce((a, t) => a + t.n, 0)
  const win = d.def ? !f.win : f.win
  const bits = win ? 1 | (left >= DRILLF_KEEP ? 2 : 0) | (form === d.form ? 4 : 0) : 0
  return { win, left, bits, rounds: f.rounds.length }
}
const popcount = (x: number) => (x & 1) + ((x >> 1) & 1) + ((x >> 2) & 1)

export type FormAction =
  | { type: 'form'; id: FormId | null }
  | { type: 'vandu'; n: number }
  | { type: 'armEquip'; id: number }
  | { type: 'armOff'; f: FormId; slot: number }
  | { type: 'armMelt'; ids: number[] }
  | { type: 'armBuy'; k: number }
  | { type: 'formDrill'; k: number; form: FormId | null }
export const formActions: Actions<FormAction> = {
  form: {
    pick: a => (a.id === null || oneOf(FORM_IDS)(a.id) ? { type: 'form', id: a.id as FormId | null } : null),
    run: (s, a) => {
      if (a.id === null) {
        const { form: _, ...rest } = s
        return ok(rest as State)
      }
      if (!formOpen(s, a.id)) return no('locked')
      return s.form === a.id ? no('claimed') : ok({ ...s, form: a.id })
    },
  },
  vandu: {
    pick: a => (int(1, VANDU_DAILY)(a.n) ? { type: 'vandu', n: a.n as number } : null),
    run: (s, a) => {
      if (s.levels.chuDien < VANDU_HALL) return no('locked')
      const used = vanduUsed(s, s.time)
      if (used + a.n > VANDU_DAILY) return no('limit')
      if (apOf(s, s.time) < a.n * VANDU_AP) return no('not_enough')
      if ((s.arms?.length ?? 0) + a.n > ARM_BAG) return no('full')
      const arms = [...(s.arms ?? [])]
      let seed = s.seed,
        coin = s.armCoin ?? 0,
        id = s.nextId,
        x: number
      for (let k = 0; k < a.n; k++) {
        ;[x, seed] = roll(seed)
        if (x < VANDU_ARM) {
          ;[x, seed] = roll(seed)
          const [arm, next] = rollArm(s, id++, pickQ(x), seed)
          arms.push(arm)
          seed = next
        } else
          coin += VANDU_COIN[0] + Math.floor(((x - VANDU_ARM) / (1 - VANDU_ARM)) * (VANDU_COIN[1] - VANDU_COIN[0] + 1))
      }
      const paid = spendAp(s, s.time, a.n * VANDU_AP)
      return ok({ ...paid, seed, arms, armCoin: coin, nextId: id, vandu: { day: dayOf(s.time), n: used + a.n } })
    },
  },
  armEquip: {
    pick: a => (int(0, 2 ** 31)(a.id) ? { type: 'armEquip', id: a.id as number } : null),
    run: (s, a) => {
      const arm = armOf(s, a.id)
      if (!arm) return no('gone')
      const on = [...(s.armOn?.[arm.f] ?? ARM_SLOTS.map(() => null))]
      if (on[arm.slot] === arm.id) return no('claimed')
      on[arm.slot] = arm.id
      return ok({ ...s, armOn: { ...s.armOn, [arm.f]: on } })
    },
  },
  armOff: {
    pick: a =>
      oneOf(FORM_IDS)(a.f) && int(0, ARM_SLOTS.length - 1)(a.slot)
        ? { type: 'armOff', f: a.f as FormId, slot: a.slot as number }
        : null,
    run: (s, a) => {
      const on = s.armOn?.[a.f]
      if (!on || on[a.slot] === null || on[a.slot] === undefined) return no('empty')
      return ok({ ...s, armOn: { ...s.armOn, [a.f]: on.map((x, k) => (k === a.slot ? null : x)) } })
    },
  },
  armMelt: {
    pick: a =>
      Array.isArray(a.ids) && a.ids.length > 0 && a.ids.length <= ARM_BAG && a.ids.every(int(0, 2 ** 31))
        ? { type: 'armMelt', ids: [...new Set(a.ids as number[])] }
        : null,
    run: (s, a) => {
      const arms = a.ids.map(id => armOf(s, id))
      if (arms.some(x => !x)) return no('gone')
      if (a.ids.some(id => armWorn(s, id))) return no('busy') // đang đeo: gỡ trước
      const gain = arms.reduce((n, x) => n + ARM_MELT[x!.q], 0)
      return ok({ ...s, arms: s.arms!.filter(x => !a.ids.includes(x.id)), armCoin: (s.armCoin ?? 0) + gain })
    },
  },
  formDrill: {
    pick: a =>
      int(0, DRILLF.length - 1)(a.k) && (a.form === null || oneOf(FORM_IDS)(a.form))
        ? { type: 'formDrill', k: a.k as number, form: a.form as FormId | null }
        : null,
    run: (s, a) => {
      if (s.levels.chuDien < VANDU_HALL) return no('locked')
      const { bits } = drillRun(a.k, a.form)
      const old = s.formStars?.[a.k] ?? 0
      const fresh = bits & ~old
      if (!fresh) return no('claimed') // không có mục tiêu mới (vẫn xem được kết quả ở client)
      const formStars = DRILLF.map((_, k) => (s.formStars?.[k] ?? 0) | (k === a.k ? bits : 0))
      return ok({ ...s, formStars, armCoin: (s.armCoin ?? 0) + popcount(fresh) * DRILLF_COIN })
    },
  },
  armBuy: {
    pick: a => (int(0, ARM_SHOP.length - 1)(a.k) ? { type: 'armBuy', k: a.k as number } : null),
    run: (s, a) => {
      if (s.levels.chuDien < VANDU_HALL) return no('locked')
      const { q, price } = ARM_SHOP[a.k]
      if ((s.armCoin ?? 0) < price) return no('not_enough')
      if ((s.arms?.length ?? 0) >= ARM_BAG) return no('full')
      const [arm, seed] = rollArm(s, s.nextId, q, s.seed)
      return ok({
        ...s,
        seed,
        arms: [...(s.arms ?? []), arm],
        armCoin: (s.armCoin ?? 0) - price,
        nextId: s.nextId + 1,
      })
    },
  },
}
