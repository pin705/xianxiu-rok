// Giải mọi đội đã tới nơi theo thứ tự thời gian (server hẹn giờ theo nextRaid).
import { giveExp } from '../core/battle.ts'
import { advance } from '../core/time.ts'
import { type March, type State } from '../core/types.ts'
import { HO_PHAP, HO_PHAP_EXP, MARKET_TTL, PHA_KIEP, REINFORCE_MAX, TRIB_AID, TRIB_EXP } from '../data.ts'
import { tribEnd } from '../sect/trib.ts'
import {
  aidAt,
  allyOf,
  dropIncoming,
  freshWorld,
  turnBack,
  withMarch,
  type MapCtx,
  type Party,
  type Players,
  type World,
} from './base.ts'
import { unsold } from './market.ts'
import { raid } from './raid.ts'
import { spotArrive } from './arrive.ts'
import { robArrive } from './rob.ts'
import { mineExpire, razeArrive } from './flags.ts'
import { campArrive } from './encamp.ts'
import { ruinClose } from './ruins.ts'
import { storeStep } from './storehouse.ts'
import { tribeStep } from './tribe.ts'
import { eveStep } from './eve.ts'
import { loharStep } from './lohar.ts'
import { campStep } from './camp.ts'

// Lúc đội kế tiếp tới nơi cần server giải (cướp, điểm trên bản đồ) — để server hẹn giờ.
// ponytail: quét mọi hành quân của giới (~1k), đổi sang heap nếu giới to lên nhiều.
const WAIT = ['pvp', 'spot', 'trib', 'flag', 'camp']
const waiting = (m: March) => WAIT.includes(m.target.kind) && !m.returnAt && !m.stay && !m.back
export function nextRaid(ps: Players) {
  let at = Infinity
  for (const s of ps.values()) for (const m of s.marches) if (waiting(m) && m.arriveAt < at) at = m.arriveAt
  return at
}

// Giải mọi đội đã tới nơi (≤ now) theo thứ tự thời gian: trận cướp (đổi state cả hai bên), điểm trên bản đồ (đổi phần chung)
export function advanceAll(ps: Players, w: World, now: number, map?: MapCtx): { changed: Players; world: World } {
  const due: [at: number, pid: number, id: number][] = []
  for (const [pid, s] of ps)
    for (const m of s.marches) if (waiting(m) && m.arriveAt <= now) due.push([m.arriveAt, pid, m.id])
  const changed: Players = new Map()
  // lệnh chợ hết hạn: trả hàng qua thư
  const old = Object.values(w.orders).filter(o => o.at + MARKET_TTL <= now)
  if (old.length) {
    const r = unsold(ps, w, old)
    w = r.world
    for (const [k, v] of r.changed) changed.set(k, v)
  }
  due.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])
  const cur = (id: number) => changed.get(id) ?? ps.get(id)
  const view = (): Players => new Map([...ps.keys()].map(id => [id, cur(id)!])) // cả giới như lúc này (quân đóng ở điểm)
  const done = new Set<string>() // đội đã giải cùng nhóm kết trận
  // nhóm kết trận: mọi đội cùng mã, cùng lúc tới, giải một lần như một bên (không kết trận: một mình đội này)
  const party = (at: number, pid: number, att: State, m: March): Party => {
    const group: Party =
      m.rally === undefined
        ? [[pid, att, m]]
        : due.flatMap(([a2, p2, id2]) => {
            if (a2 !== at) return []
            const s2 = p2 === pid ? att : advance(cur(p2)!, at)
            const m2 = s2.marches.find(x => x.id === id2)!
            return m2.rally === m.rally ? [[p2, s2, m2] as [number, State, March]] : []
          })
    for (const [p2, , m2] of group) done.add(`${p2}:${m2.id}`)
    if (m.rally !== undefined)
      w = { ...w, rallies: Object.fromEntries(Object.entries(w.rallies).filter(([k]) => Number(k) !== m.rally)) }
    return group
  }
  for (const [at, pid, id] of due) {
    if (done.has(`${pid}:${id}`)) continue
    const att = advance(cur(pid)!, at)
    const m = att.marches.find(x => x.id === id)!
    if (m.target.kind === 'trib') {
      // kiếp vân giáng: đồng minh đóng ở nhà là hộ pháp (nhẹ kiếp, nhận kinh nghiệm), mỗi lần bị cướp trúng lúc tụ làm nặng kiếp
      const guards = aidAt(view(), pid).slice(0, TRIB_AID)
      changed.set(
        pid,
        tribEnd(att, id, at, (1 - HO_PHAP * guards.length) * (1 + PHA_KIEP * Math.min(TRIB_AID, m.foil ?? 0))),
      )
      const exp = Math.round(TRIB_EXP[m.target.i] * HO_PHAP_EXP)
      for (const [hp, hm] of guards) changed.set(hp, giveExp(advance(cur(hp)!, at), hm.elder, exp))
      continue
    }
    // trận kỳ (giữ / phá / khai Minh khoáng) · trại ở ô trống (dựng / đánh): mỗi đội giải riêng
    const one = m.target.kind === 'flag' ? razeArrive : m.target.kind === 'camp' ? campArrive : null
    if (one) {
      const r = one(view(), w, [pid, att, m], at)
      for (const [k, v] of r.changed) changed.set(k, v)
      w = r.world
      continue
    }
    if (m.task === 'rob') {
      const r = robArrive(view(), w, [pid, att, m], at, map) // cướp khoáng
      for (const [k, v] of r.changed) changed.set(k, v)
      w = r.world
      continue
    }
    if (m.target.kind === 'spot') {
      const group = party(at, pid, att, m)
      const r = map
        ? spotArrive(view(), w, map, group, at)
        : { changed: new Map(group.map(([p2, s2, m2]) => [p2, turnBack(s2, m2, at)])), world: w }
      for (const [k, v] of r.changed) changed.set(k, v)
      w = r.world
      continue
    }
    const d = cur(m.target.i)
    if (m.task === 'aid') {
      // viện binh tới nơi: còn cùng minh và nhà đó chưa đủ viện binh thì đóng lại, không thì về
      const ok =
        d && allyOf(w, pid)?.members[m.target.i] !== undefined && aidAt(view(), m.target.i).length < REINFORCE_MAX
      changed.set(pid, ok ? withMarch(att, { ...m, stay: true }) : turnBack(att, m, at))
      continue
    }
    // tông môn kia không còn (xoá tài khoản), vừa có khiên (người khác cướp trước), hay đã dời đi nơi khác: quay về tay không
    const group = party(at, pid, att, m)
    const calm = (x: State) => group.reduce((y, [p2, , m2]) => dropIncoming(y, p2, m2.id), x) // hết cảnh báo các đội này
    const end = m.path?.at(-1)
    if (!d || d.shield > at || (end && d.seat && (end.x !== d.seat.x || end.y !== d.seat.y))) {
      for (const [p2, s2, m2] of group) changed.set(p2, turnBack(s2, m2, at))
      if (d && calm(d) !== d) changed.set(m.target.i, calm(d))
      continue
    }
    const helpers = aidAt(view(), m.target.i).map(
      ([hp, hm]) => [hp, advance(cur(hp)!, at), hm] as [number, State, March],
    )
    const r = raid(group, advance(d, at), m.target.i, at, helpers)
    for (const [k, v] of r.atts) changed.set(k, v)
    changed.set(m.target.i, calm(r.def))
    for (const [k, v] of r.helpers) changed.set(k, v)
  }
  for (const step of hourly(view, now, map)) {
    const r = step(w)
    for (const [k, v] of r.changed) changed.set(k, v)
    w = r.world
  }
  return { changed, world: w }
}
// Việc theo giờ của giới, lần lượt (mỗi bước đọc cả giới như lúc đó): Cổ Di Tích / Huyết Tế Đàn hết giờ mở (chốt, trả quân) ·
// kho minh (lãnh thổ sinh Minh khố) · Khai Giới Trảm Tà (cổng mở: chốt giới vận) · Phá Yêu Trại hết khung (quà top minh) ·
// Minh khoáng quá hạn
type Step = (x: World) => { changed: Players; world: World }
const hourly = (view: () => Players, now: number, map?: MapCtx): Step[] => [
  ...(map
    ? [
        (x: World) => ruinClose(view(), x, map, now),
        (x: World) => ({ changed: new Map(), world: storeStep(view(), x, map, now) }),
        (x: World) => eveStep(view(), x, map, now),
        (x: World) => ({ changed: new Map(), world: loharStep(x, map, now) }),
        (x: World) => campStep(view(), x, map, now),
      ]
    : []),
  x => mineExpire(view(), x, now),
  x => tribeStep(view(), x, now),
]
// Chỉ trận cướp, không bản đồ (sim, test P2)
export const advanceWorld = (ps: Players, now: number): Players => advanceAll(ps, freshWorld(), now).changed
