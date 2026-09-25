// Độ kiếp: ba đợt lôi kiếp để lên tầng Chủ điện kế; trong giới thì kiếp vân tụ công khai, server giải lúc giáng.
import { no, ok, use, type Actions, pay } from '../core/action.ts'
import { admit, armyError, giveExp, pushReport, tribPill, tribulation } from '../core/battle.ts'
import { bump } from '../core/calendar.ts'
import { isElder, pickArmy } from '../core/parse.ts'
import { cost, deputyOf, lead, marchSlots } from '../core/stats.ts'
import { advance } from '../core/time.ts'
import { type Army, type Err, type March, type State } from '../core/types.ts'
import { addBag, afford, minus, nextSeed, plus, compact } from '../core/util.ts'
import { LOSS_EXP, TRIB_CLOUD, TRIB_COOLDOWN, TRIB_EXP, TRIBS, UNITS, type ElderId, type PillId } from '../data.ts'

// Chi phí độ kiếp: bằng chi phí lên tầng Chủ điện kế
export const tribPrice = (s: State) => cost('chuDien', TRIBS[s.trib].hall + 1)

export function tribError(s: State): Err | null {
  const tr = TRIBS[s.trib]
  if (!tr || s.levels.chuDien !== tr.hall) return 'locked'
  if (s.marches.some(m => m.target.kind === 'trib')) return 'busy'
  if (s.tribCool > s.time) return 'cooldown'
  return afford(s.res, tribPrice(s)) ? null : 'not_enough'
}

// Kiếp giáng lúc at: đội độ kiếp (đã rời khỏi s.troops) đánh ba đợt, người còn đứng về nhà, thương binh vào Đan phòng.
// paid: chi phí đã trả lúc kiếp vân tụ (công khai) — thành công không trừ nữa, thất bại hoàn lại.
function settle(
  s: State,
  elder: ElderId,
  army: Army,
  p: PillId | null,
  seed: number,
  at: number,
  mul: number,
  paid: boolean,
  deputy?: ElderId,
) {
  const k = s.trib
  const tr = TRIBS[k]
  const r = tribulation(s, elder, army, p, seed, mul, deputy)
  const ids = UNITS.filter(u => (army[u] ?? 0) > 0)
  const hurt = Object.fromEntries(ids.map((u, i) => [u, army[u]! - r.left[i]])) as Army
  const adm = admit({ ...s, troops: plus(s.troops, Object.fromEntries(ids.map((u, i) => [u, r.left[i]]))) }, hurt)
  const exp = Math.round(TRIB_EXP[k] * (1 + lead(s, elder, 'exp')) * (r.win ? 1 : LOSS_EXP))
  const st = giveExp(adm.state, elder, exp)
  const price = tribPrice(s)
  const next = r.win
    ? bump(
        {
          ...st,
          trib: k + 1,
          res: paid ? st.res : pay(st, price),
          levels: { ...st.levels, chuDien: tr.hall + 1 },
        },
        'win',
      )
    : { ...st, tribCool: at + TRIB_COOLDOWN, res: paid ? addBag(st.res, price) : st.res }
  return {
    state: pushReport(next, {
      at,
      kind: 'trib',
      i: k,
      win: r.win,
      fights: r.fights,
      hurt,
      dead: adm.dead,
      gain: { res: {}, items: {}, exp },
    }),
    seed: r.seed,
  }
}

// Kiếp vân giáng (server gọi lúc m.arriveAt; world.ts tính mul từ hộ pháp và phá kiếp)
export function tribEnd(s: State, id: number, at: number, mul: number): State {
  const st = advance(s, at)
  const m = st.marches.find(x => x.id === id)
  if (!m || m.target.kind !== 'trib') return st
  return settle(
    { ...st, marches: st.marches.filter(x => x !== m) },
    m.elder,
    m.army,
    m.pill ?? null,
    m.seed,
    at,
    mul,
    true,
    m.deputy,
  ).state
}

export type TribAction = { type: 'trib'; elder: ElderId; army: Army; pill: boolean }

export const tribActions: Actions<TribAction> = {
  trib: {
    pick: a => {
      const army = pickArmy(a.army)
      return army && isElder(a.elder) && typeof a.pill === 'boolean'
        ? { type: 'trib', elder: a.elder, army, pill: a.pill }
        : null
    },
    run: (s, a) => {
      const e = tribError(s) ?? armyError(s, a.elder, a.army)
      if (e) return no(e)
      const p = tribPill(s, a.pill)
      if (a.pill && !p) return no('no_item')
      const t = s.time
      const army = compact(a.army)
      const sent: State = { ...s, troops: minus(s.troops, army), items: p ? use(s, p) : s.items }
      if (!s.seat) {
        const r = settle(sent, a.elder, army, p, s.seed, t, 1, false, deputyOf(s, a.elder))
        return ok({ ...r.state, seed: r.seed })
      }
      // có chỗ trên bản đồ giới: kiếp vân tụ trên núi cho cả giới thấy, trả chi phí ngay, server giải lúc giáng (tribEnd).
      // Đội độ kiếp là một đội xuất quân (chiếm một lượt)
      if (s.marches.length >= marchSlots(s)) return no('slots')
      const k = s.trib
      const deputy = deputyOf(s, a.elder)
      const m: March = {
        id: s.nextId,
        elder: a.elder,
        ...(deputy && { deputy }),
        army,
        target: { kind: 'trib', i: k },
        seed: s.seed,
        startAt: t,
        arriveAt: t + TRIB_CLOUD[k],
        returnAt: 0,
        ...(p && { pill: p }),
      }
      return ok({
        ...sent,
        res: pay(s, tribPrice(s)),
        marches: [...sent.marches, m],
        nextId: s.nextId + 1,
        seed: nextSeed(s.seed),
      })
    },
  },
}
