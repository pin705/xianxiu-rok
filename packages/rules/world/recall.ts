// Cố Nhân Tương Phùng (mời người cũ quay lại — doc 7 D9): đạo hữu (trong danh sách kết giao) vắng từ RECALL_DAYS ngày (tính theo ngày
// vào game cuối — vip.day) thì "Gọi về" được: thư tới người đó. Người ấy quay lại (server gọi recallBack khi vắng từ RETURN_AWAY) trong
// RECALL_TTL thì nhận RECALL_GIFT một lần, mỗi người đã gọi nhận RECALL_THANKS — tối đa RECALL_MAX lần mỗi mùa. Hết mùa làm lại.
import { no } from '../core/action.ts'
import { dayOf } from '../core/calendar.ts'
import { isId } from '../core/parse.ts'
import { RECALL_DAYS, RECALL_GIFT, RECALL_MAX, RECALL_THANKS, RECALL_TTL } from '../data.ts'
import { mail } from '../sect/inbox.ts'
import type { Players, World, WorldActions } from './base.ts'

// Lời gọi còn hạn cho người pid
export const recallsOf = (w: World, pid: number, now: number) =>
  (w.recalls?.[pid] ?? []).filter(x => now - x.at < RECALL_TTL)
// Số ngày người này chưa vào game
export const awayDays = (s: { vip: { day: number } }, now: number) => Math.max(0, dayOf(now) - s.vip.day)

export type RecallAction = { type: 'friendRecall'; pid: number }
export const recallActions: WorldActions<RecallAction> = {
  friendRecall: {
    pick: a => (isId(a.pid) ? { type: 'friendRecall', pid: a.pid as number } : null),
    run: ({ w, ps, pid, s, now }, a) => {
      const t = ps.get(a.pid)
      if (!t || a.pid === pid || !s.friends?.includes(a.pid)) return no('gone')
      if (awayDays(t, now) < RECALL_DAYS) return no('locked')
      const list = recallsOf(w, a.pid, now)
      if (list.some(x => x.by === pid)) return no('claimed')
      return {
        ok: true,
        changed: new Map([[a.pid, mail(t, { at: now, k: 'recall', a: [s.name, 0] })]]),
        world: { ...w, recalls: { ...w.recalls, [a.pid]: [...list, { by: pid, at: now }] } },
      }
    },
  },
}

// Người pid vừa quay lại: có lời gọi còn hạn thì người quay lại nhận quà, mỗi người gọi nhận quà cảm tạ (chưa quá RECALL_MAX lần
// mùa này); lời gọi của người này xoá đi
export function recallBack(ps: Players, w: World, pid: number, now: number) {
  const changed: Players = new Map()
  if (!w.recalls?.[pid]) return { changed, world: w }
  const list = recallsOf(w, pid, now)
  const { [pid]: _gone, ...recalls } = w.recalls
  const me = ps.get(pid)
  if (!list.length || !me) return { changed, world: { ...w, recalls } }
  changed.set(pid, mail(me, { at: now, k: 'recall', a: [ps.get(list[0].by)?.name ?? '?', 1], gift: RECALL_GIFT }))
  const got = { ...w.recallGot }
  for (const { by } of list) {
    const s = changed.get(by) ?? ps.get(by)
    if (!s || (got[by] ?? 0) >= RECALL_MAX) continue
    got[by] = (got[by] ?? 0) + 1
    changed.set(by, mail(s, { at: now, k: 'recall', a: [me.name, 2], gift: RECALL_THANKS }))
  }
  return { changed, world: { ...w, recalls, recallGot: got } }
}
