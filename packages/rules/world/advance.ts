// Giải mọi đội đã tới nơi theo thứ tự thời gian (server hẹn giờ theo nextRaid).
import { giveExp } from '../core/battle.ts'
import { advance } from '../core/time.ts'
import { type March, type State } from '../core/types.ts'
import { HO_PHAP, HO_PHAP_EXP, MARKET_TTL, PHA_KIEP, REINFORCE_MAX, TRIB_AID, TRIB_EXP } from '../data.ts'
import { tribEnd } from '../sect/trib.ts'
import {
  aidAt,
  allyOf,
  freshWorld,
  turnBack,
  withMarch,
  type MapCtx,
  type Party,
  type Players,
  type World,
} from './base.ts'
import { unsold } from './market.ts'
import { dropIncoming, raid } from './raid.ts'
import { spotArrive } from './arrive.ts'

// Lúc đội kế tiếp tới nơi cần server giải (cướp, điểm trên bản đồ) — để server hẹn giờ.
// ponytail: quét mọi hành quân của giới (~1k), đổi sang heap nếu giới to lên nhiều.
const waiting = (m: March) =>
  (m.target.kind === 'pvp' || m.target.kind === 'spot' || m.target.kind === 'trib') && !m.returnAt && !m.stay && !m.back
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
    if (m.target.kind === 'spot') {
      // kết trận: mọi đội cùng mã, cùng lúc tới, giải một lần như một bên
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
      const r = map
        ? spotArrive(view(), w, map, group, at)
        : { changed: new Map(group.map(([p2, s2, m2]) => [p2, turnBack(s2, m2, at)])), world: w }
      for (const [k, v] of r.changed) changed.set(k, v)
      w = r.world
      if (m.rally !== undefined)
        w = { ...w, rallies: Object.fromEntries(Object.entries(w.rallies).filter(([k]) => Number(k) !== m.rally)) }
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
    // tông môn kia không còn (xoá tài khoản), hoặc vừa có khiên (người khác cướp trước): quay về tay không
    if (!d || d.shield > at) {
      changed.set(pid, turnBack(att, m, at))
      if (d && dropIncoming(d, pid, m.id) !== d) changed.set(m.target.i, dropIncoming(d, pid, m.id))
      continue
    }
    const helpers = aidAt(view(), m.target.i).map(
      ([hp, hm]) => [hp, advance(cur(hp)!, at), hm] as [number, State, March],
    )
    const r = raid(att, pid, advance(d, at), m.target.i, m, at, helpers)
    changed.set(pid, r.att)
    changed.set(m.target.i, dropIncoming(r.def, pid, m.id)) // trận đã giải: hết cảnh báo đội này
    for (const [k, v] of r.helpers) changed.set(k, v)
  }
  return { changed, world: w }
}
// Chỉ trận cướp, không bản đồ (sim, test P2)
export const advanceWorld = (ps: Players, now: number): Players => advanceAll(ps, freshWorld(), now).changed
