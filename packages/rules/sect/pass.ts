// Tu Tiên Lệnh (Lucerne Scroll của RoK — thẻ mùa): điểm lệnh từ rương Nhật Khóa và nhiệm vụ tuần (passXp), mỗi cấp một quà nhánh
// thường, Kim Lệnh (Hương Hỏa từ PASS_VIP) thêm một quà mỗi cấp. Nhận một quà (lv, gold) hay mọi quà đang chờ (không lv).
import { no, ok, type Actions } from '../core/action.ts'
import { grant } from '../core/battle.ts'
import { passLevel } from '../core/fest.ts'
import { int } from '../core/parse.ts'
import { vipLevel } from '../core/stats.ts'
import type { State } from '../core/types.ts'
import { PASS_FREE, PASS_GOLD, PASS_HALL, PASS_LEVELS, PASS_VIP } from '../data.ts'

export type PassAction = { type: 'pass'; lv?: number; gold?: boolean }

export const passGold = (s: State) => vipLevel(s) >= PASS_VIP
// Quà đang chờ nhận: [cấp, nhánh Kim Lệnh?]
export function passReady(s: State): [number, boolean][] {
  if (s.levels.chuDien < PASS_HALL) return []
  const out: [number, boolean][] = []
  for (let lv = 1; lv <= passLevel(s); lv++) {
    if (!s.pass?.got.includes(lv)) out.push([lv, false])
    if (passGold(s) && !s.pass?.gold.includes(lv)) out.push([lv, true])
  }
  return out
}

export const passActions: Actions<PassAction> = {
  pass: {
    pick: a =>
      a.lv === undefined || int(1, PASS_LEVELS)(a.lv)
        ? { type: 'pass', ...(a.lv !== undefined && { lv: a.lv as number }), ...(a.gold === true && { gold: true }) }
        : null,
    run: (s, a) => {
      if (s.levels.chuDien < PASS_HALL || (a.gold && !passGold(s))) return no('locked')
      if (a.lv !== undefined && (a.gold ? s.pass?.gold : s.pass?.got)?.includes(a.lv)) return no('claimed')
      const want = passReady(s).filter(([lv, g]) => a.lv === undefined || (lv === a.lv && g === !!a.gold))
      if (!want.length) return no('not_done')
      const st = want.reduce((x, [lv, g]) => grant(x, (g ? PASS_GOLD : PASS_FREE)[lv - 1]), s)
      const p = s.pass!
      const lvs = (g: boolean) => want.filter(x => x[1] === g).map(x => x[0])
      return ok({ ...st, pass: { ...p, got: [...p.got, ...lvs(false)], gold: [...p.gold, ...lvs(true)] } })
    },
  },
}
