// Túi đồ: dùng vật phẩm (phù tăng tốc, nang tài nguyên, phù tăng ích, khiên hộ sơn, kinh thư) — như túi đồ của RoK.
import { no, ok, use, type Actions } from '../core/action.ts'
import { giveExp } from '../core/battle.ts'
import { int, isElder, JOB_KINDS, oneOf } from '../core/parse.ts'
import { advance, jobOf, shorten } from '../core/time.ts'
import { revealNear } from '../core/fog.ts'
import { type Buff, type Err, type JobKind, type State } from '../core/types.ts'
import { BAG_IDS, HOUR } from '../core/util.ts'
import { ELDER_MAX, BAG_USE_MAX, BAG, type ElderId, type BagId } from '../data.ts'
import { elderLevel, spendAp } from '../core/stats.ts'
import { burning, wallAt } from '../core/wall.ts'

export type BagAction = { type: 'use'; item: BagId; n: number; job?: JobKind; elder?: ElderId }

// Vì sao không dùng được (null: dùng được). Client dùng để tắt nút và nói lý do.
export function useError(s: State, a: BagAction): Err | null {
  const d = BAG[a.item]
  if (
    d.use === 'key' ||
    d.use === 'ticket' ||
    d.use === 'move' ||
    d.use === 'rename' ||
    d.use === 'frag' ||
    d.use === 'swap'
  )
    return 'bad' // thiếp: Chiêu Hiền Đài · Luận Kiếm Lệnh: Luận Kiếm Đài · phù dời núi: bản đồ giới
  if (a.n > (s.items[a.item] ?? 0)) return 'no_item'
  if (d.use === 'speed') {
    // luyện đan không rút ngắn được (có giảm thời gian là thành vòng lặp đẻ đan); phù riêng chỉ cho đúng việc
    if (!a.job || a.job === 'brew' || (d.job && d.job !== a.job)) return 'bad'
    return jobOf(s, a.job) ? null : 'empty'
  }
  if (d.use === 'shield' && (s.frenzy ?? 0) > s.time) return 'frenzy' // vừa đi cướp: chưa bật khiên được
  if (d.use === 'map' && !s.seat) return 'locked' // Sơn Hà Đồ: cần chỗ trên bản đồ giới
  if (d.use === 'douse' && (a.n !== 1 || !burning(s, s.time))) return 'empty' // Tức Hỏa Phù: chỉ khi núi đang cháy
  if (d.use === 'exp') {
    if (!a.elder || s.elders[a.elder] === undefined) return 'locked'
    return elderLevel(s.elders[a.elder]!) >= ELDER_MAX ? 'max_level' : null
  }
  return null
}

// Tăng ích cùng chỉ số từ phù thì kéo dài, không cộng dồn sức (Tụ Linh Phù 8 giờ và 24 giờ là một buff)
function extend(s: State, key: Buff['key'], v: number, ms: number): Buff[] {
  const src = `phu.${key}`
  const cur = s.buffs.find(x => x.src === src)
  const buff: Buff = { key, v, until: Math.max(cur?.until ?? 0, s.time) + ms, src }
  return [...s.buffs.filter(x => x !== cur), buff]
}

export const bagActions: Actions<BagAction> = {
  use: {
    pick: a =>
      oneOf(BAG_IDS)(a.item) &&
      int(1, BAG_USE_MAX)(a.n) &&
      (a.job === undefined || oneOf(JOB_KINDS)(a.job)) &&
      (a.elder === undefined || isElder(a.elder))
        ? { type: 'use', item: a.item, n: a.n, ...(a.job && { job: a.job }), ...(a.elder && { elder: a.elder }) }
        : null,
    run: (s, a) => {
      const e = useError(s, a)
      if (e) return no(e)
      const d = BAG[a.item]
      const st: State = { ...s, items: use(s, a.item, a.n) }
      if (d.use === 'speed') {
        const sped = { ...st, stats: { ...st.stats, sped: (st.stats.sped ?? 0) + d.min * a.n } }
        return ok(advance(shorten(sped, a.job!, d.min * 60_000 * a.n), s.time))
      }
      if (d.use === 'res') return ok({ ...st, res: { ...st.res, [d.res]: st.res[d.res] + d.n * a.n } })
      if (d.use === 'buff') return ok({ ...st, buffs: extend(st, d.key, d.v, d.hours * HOUR * a.n) })
      if (d.use === 'shield') return ok({ ...st, shield: Math.max(st.shield, s.time) + d.hours * HOUR * a.n })
      if (d.use === 'builder') return ok({ ...st, builder2: Math.max(st.builder2 ?? 0, s.time) + d.hours * HOUR * a.n })
      if (d.use === 'vip') return ok({ ...st, vip: { ...st.vip, pts: st.vip.pts + d.n * a.n } })
      if (d.use === 'ap') return ok(spendAp(st, s.time, -d.n * a.n)) // tiêu âm = cộng (giữ mốc hồi)
      if (d.use === 'map') return ok({ ...st, fog: revealNear(st, d.n * a.n, s.time) })
      if (d.use === 'douse') return ok({ ...st, wall: { ...wallAt(st, s.time), fire: 0 } })
      if (d.use === 'veil') return ok({ ...st, veil: Math.max(st.veil ?? 0, s.time) + d.hours * HOUR * a.n })
      return d.use === 'exp' ? ok(giveExp(st, a.elder!, d.n * a.n)) : no('bad')
    },
  },
}
