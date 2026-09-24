// Giới sống nhờ lease trong DB: gia hạn định kỳ, bị rào khi node khác nhận giới, đóng khi deploy.
// Mỗi commit mang epoch + node của lease (store.flushWorld rào bằng chúng); lô ghi dựng ở đây.
import { power } from '@rok/rules'
import type { Bye } from '@rok/protocol'
import * as store from '../db/store.ts'
import { fenced } from '../lib/metrics.ts'
import { pollInbox } from './inbox.ts'
import type { World } from './world.ts'

// Gia hạn lease định kỳ (không có thay đổi vẫn phải báo "còn sống"). Quá LEASE.readOnly không gia hạn được: tự rào, chỉ đọc.
export function heartbeat(w: World) {
  if (w.lost) return
  const idle = performance.now() - w.renewedAt
  if (idle > store.LEASE.readOnly && !w.readOnly) {
    w.readOnly = true
    w.env.log.warn({ world: w.id }, 'world read-only: lease not renewed')
    w.broadcast('status', { ro: true })
  }
  if (idle > store.LEASE.renew) void w.persist.flush(true)
  void pollInbox(w) // kèm lật tuần sự kiện đúng giờ dù không ai đang chơi (pollInbox gọi tick)
}

// Node khác đã nhận giới (epoch đổi): dừng hẳn, không ghi gì nữa, đẩy mọi người sang node mới
export function fence(w: World) {
  w.lost = true
  fenced.inc()
  w.env.log.warn({ world: w.id }, 'world fenced: another node owns it now')
  kickAll(w, 'moved')
  w.stop()
}

// Deploy / tắt node: commit lần cuối, nhả lease, báo client nối lại (tới node khác nhận giới)
export async function close(w: World) {
  w.closing = true
  for (let i = 0; i < 100 && !w.lost && w.persist.busy; i++) {
    if (w.persist.committing) await new Promise(r => setTimeout(r, 20))
    else await w.persist.flush(true)
  }
  kickAll(w, 'restart')
  w.stop()
  if (!w.lost) await store.releaseWorld(w.env.db, w.id, w.env.node, w.epoch).catch(() => {})
}

function kickAll(w: World, reason: Bye) {
  for (const s of w.slots.values())
    for (const c of s.conns) {
      c.emit('bye', { reason })
      c.disconnect(true)
    }
}

// Lô ghi của một commit (Committer gọi): người chơi đã đổi (bỏ người vừa xoá tài khoản), phần chung / cột mùa nếu đổi
export function batch(w: World, ids: number[], seen: Set<number>, world: boolean, season: boolean) {
  const players = ids
    .filter(id => w.ps.has(id))
    .map(id => {
      const s = w.ps.get(id)!
      const slot = w.slots.get(id)!
      return {
        id,
        state: s,
        name: slot.name,
        power: Math.round(power(s)),
        hall: s.levels.chuDien,
        tower: s.tower,
        rebirths: s.rebirths,
        pvp: s.pvp.pts,
        weekNo: s.ev.week,
        weekPts: s.ev.pts,
        ...(seen.has(id) && slot.seen ? { seen: slot.seen } : {}),
      }
    })
  return {
    world: w.id,
    epoch: w.epoch,
    node: w.env.node,
    online: w.online,
    sync: w.env.sync,
    players,
    state: world ? { week: w.week, npcs: w.npcsMade, chron: w.chron, world: w.shared, fame: w.fame } : undefined,
    season: season ? { seed: w.seed, season: w.info.season, opensAt: new Date(w.opened) } : undefined,
  }
}
