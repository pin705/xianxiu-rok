// Giới Chủ và sắc phong (King / Kingdom Titles của RoK): ai làm chủ giới, phong / tước tước cho người trong giới. Tăng ích
// của tước tới người giữ qua worldBuffs (titleBuffs ở base.ts).
import { spawn } from '../atlas.ts'
import { rng } from '../combat.ts'
import { no } from '../core/action.ts'
import { resettle } from '../core/fog.ts'
import { isId, oneOf } from '../core/parse.ts'
import { advance } from '../core/time.ts'
import {
  BANISH_COOL,
  BLESSINGS,
  BLESS_TIME,
  GIFT_WEEK,
  THIEN_AN,
  TITLE_COOL,
  TITLE_IDS,
  TITLE_TIME,
  type BlessKey,
  type TitleId,
} from '../data.ts'
import { dayOf, weekOf } from '../core/calendar.ts'
import { mail } from '../sect/inbox.ts'
import { allyOf, type MapCtx, type Players, type World, type WorldActions } from './base.ts'
import { seasonBoard, spotOf } from './points.ts'

// Tiên minh làm chủ giới: minh giữ Thiên Môn; chưa minh nào giữ thì minh đứng đầu điểm mùa. Chỉ tiên minh (người đi một
// mình, phân đà NPC không làm chủ giới — như vua của RoK là minh chủ). null: chưa minh nào có điểm
export function lordSide(w: World, ps: Players, map: MapCtx, now: number): number | null {
  const heaven = map.atlas.points.find(p => p.kind === 'heaven')
  const own = heaven && spotOf(w, map, heaven.i, now).own
  if (own !== undefined && own > 0) return own
  return seasonBoard(w, ps, map, now).find(r => r.side > 0)?.side ?? null
}
// Giới Chủ: minh chủ của minh đó
export function lordOf(w: World, ps: Players, map: MapCtx, now: number): number | null {
  const side = lordSide(w, ps, map, now)
  if (side === null) return null
  const head = Object.entries(w.allies[side]?.members ?? {}).find(([, r]) => r === 2)
  return head ? Number(head[0]) : null
}
// Tước người pid đang giữ (còn hạn)
export const titleOf = (w: World, pid: number, now: number): TitleId | null =>
  TITLE_IDS.find(id => w.titles?.[id]?.pid === pid && w.titles[id]!.until > now) ?? null

export type LordAction =
  | { type: 'crown'; title: TitleId; pid: number }
  | { type: 'uncrown'; title: TitleId }
  | { type: 'bless'; key: BlessKey } // ban phúc cả giới, mỗi ngày một lần
  | { type: 'boon'; pid: number } // ban Thiên Ân lễ cho một người
  | { type: 'banish'; pid: number } // Phóng Trục: đẩy tông môn người đó ra vùng ngoài
// Thiên Ân lễ còn ban được trong tuần của lúc t
export const boonLeft = (w: World, t: number) => (w.boon?.week === weekOf(t) ? w.boon.left : GIFT_WEEK)
const isTitle = oneOf(TITLE_IDS)
const BLESS_KEYS = Object.keys(BLESSINGS) as BlessKey[]

export const lordActions: WorldActions<LordAction> = {
  // Sắc phong: mỗi người một tước (tước cũ của người đó bỏ), phong lại một tước phải chờ TITLE_COOL; người nhận có thư
  crown: {
    pick: a => (isTitle(a.title) && isId(a.pid) ? { type: 'crown', title: a.title, pid: a.pid } : null),
    run: ({ ps, w, pid, s, map, now }, a) => {
      if (!map || lordOf(w, ps, map, now) !== pid) return no('locked')
      const to = ps.get(a.pid)
      if (!to) return no('gone')
      if ((w.titles?.[a.title]?.at ?? -Infinity) + TITLE_COOL > now) return no('cooldown')
      const titles = Object.fromEntries(Object.entries(w.titles ?? {}).filter(([, t]) => t.pid !== a.pid))
      titles[a.title] = { pid: a.pid, at: now, until: now + TITLE_TIME }
      const got = mail(a.pid === pid ? s : advance(to, now), { at: now, k: 'titled', a: [a.title, s.name] })
      return { ok: true, world: { ...w, titles }, changed: new Map([[a.pid, got]]) }
    },
  },
  uncrown: {
    pick: a => (isTitle(a.title) ? { type: 'uncrown', title: a.title } : null),
    run: ({ ps, w, pid, map, now }, a) => {
      if (!map || lordOf(w, ps, map, now) !== pid) return no('locked')
      if (!w.titles?.[a.title]) return no('gone')
      const { [a.title]: _, ...titles } = w.titles
      return { ok: true, world: { ...w, titles }, changed: new Map() }
    },
  },
  bless: {
    pick: a => (oneOf(BLESS_KEYS)(a.key) ? { type: 'bless', key: a.key } : null),
    run: ({ ps, w, pid, map, now }, a) => {
      if (!map || lordOf(w, ps, map, now) !== pid) return no('locked')
      if (w.bless?.day === dayOf(now)) return no('cooldown')
      return {
        ok: true,
        world: { ...w, bless: { key: a.key, until: now + BLESS_TIME, day: dayOf(now) } },
        changed: new Map(),
      }
    },
  },
  boon: {
    pick: a => (isId(a.pid) ? { type: 'boon', pid: a.pid } : null),
    run: ({ ps, w, pid, s, map, now }, a) => {
      if (!map || lordOf(w, ps, map, now) !== pid) return no('locked')
      const to = ps.get(a.pid)
      if (!to) return no('gone')
      const left = boonLeft(w, now)
      if (left < 1) return no('limit')
      const got = mail(a.pid === pid ? s : advance(to, now), { at: now, k: 'boon', a: [s.name], gift: THIEN_AN })
      return {
        ok: true,
        world: { ...w, boon: { week: weekOf(now), left: left - 1 } },
        changed: new Map([[a.pid, got]]),
      }
    },
  },
  // Phóng Trục: tông môn không cùng minh Giới Chủ, không đang bế quan, mọi đội ở nhà → chỗ trống ngẫu nhiên ở vùng ngoài (như lúc lập
  // tông môn); người bị phóng trục có thư. Đội địch đang kéo tới chỗ cũ thì tới nơi quay về (advance.ts)
  banish: {
    pick: a => (isId(a.pid) ? { type: 'banish', pid: a.pid } : null),
    run: ({ ps, w, pid, s, map, now, seed }, a) => {
      if (!map || lordOf(w, ps, map, now) !== pid) return no('locked')
      const to = ps.get(a.pid)
      if (!to?.seat || a.pid === pid) return no('gone')
      if (allyOf(w, a.pid) && allyOf(w, a.pid) === allyOf(w, pid)) return no('friend')
      if ((w.banishAt ?? -Infinity) + BANISH_COOL > now) return no('cooldown')
      const t = advance(to, now)
      if (t.seclude && t.seclude.until > now) return no('secluded')
      if (t.marches.length) return no('busy')
      const taken = [...ps].flatMap(([id, o]) => (id !== a.pid && o.seat ? [o.seat] : []))
      const at = spawn(map.atlas, taken, rng(seed || 1))
      if (!at) return no('taken')
      const moved = mail(resettle(t, at), { at: now, k: 'banish', a: [s.name, at.x, at.y] })
      return { ok: true, world: { ...w, banishAt: now }, changed: new Map([[a.pid, moved]]) }
    },
  },
}
