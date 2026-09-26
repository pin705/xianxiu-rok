// Hồng Bao (Lucky Red Packet của RoK, không tiền thật): người có Hồng Bao gửi ở kênh Giới hay Tiên minh; PACKET_SHARES người đầu mở
// được (không phải người gửi; bao gửi kênh minh thì chỉ người trong minh), mỗi người một phần ngẫu nhiên của PACKET_TOTAL linh thạch —
// hệ thống trả, người gửi chỉ tốn Hồng Bao. Tin "#hb" trong chat trỏ tới bao của người gửi tin: mở bao cũ nhất mình chưa mở.
import { rng } from '../combat.ts'
import { no, use } from '../core/action.ts'
import { isId } from '../core/parse.ts'
import { PACKET_SHARES, PACKET_TOTAL, PACKET_TTL } from '../data.ts'
import { allyOf, type Packet, type World, type WorldActions } from './base.ts'

export type PacketAction = { type: 'packetSend'; ally: boolean } | { type: 'packetOpen'; by: number }
// Bao còn mở được lúc now (chưa quá hạn, còn phần)
const live = (w: World, now: number) => (w.packets ?? []).filter(p => p.at + PACKET_TTL > now && p.left.length)
// Chia tổng thành n phần ngẫu nhiên theo mầm (phần nhỏ nhất cỡ một phần tư phần lớn nhất), cộng đúng bằng tổng
export function packetSplit(total: number, n: number, seed: number) {
  const r = rng(seed)
  const w = Array.from({ length: n }, () => 1 + r() * 3)
  const sum = w.reduce((a, b) => a + b, 0)
  const parts = w.map(x => Math.floor((total * x) / sum))
  parts[0] += total - parts.reduce((a, b) => a + b, 0)
  return parts
}

export const packetActions: WorldActions<PacketAction> = {
  packetSend: {
    pick: a => (typeof a.ally === 'boolean' ? { type: 'packetSend', ally: a.ally } : null),
    run: ({ w, pid, s, now, seed }, a) => {
      if ((s.items.hongBao ?? 0) < 1) return no('no_item')
      const al = allyOf(w, pid)
      if (a.ally && !al) return no('locked')
      const p: Packet = {
        by: pid,
        ...(a.ally && al && { ally: al.id }),
        at: now,
        left: packetSplit(PACKET_TOTAL, PACKET_SHARES, seed),
        got: [],
      }
      const next = { ...s, items: use(s, 'hongBao', 1) }
      return { ok: true, world: { ...w, packets: [...live(w, now), p] }, changed: new Map([[pid, next]]) }
    },
  },
  packetOpen: {
    pick: a => (isId(a.by) ? { type: 'packetOpen', by: a.by } : null),
    run: ({ w, pid, s, now }, a) => {
      if (a.by === pid) return no('bad') // bao của mình: để người khác mở
      const mine = allyOf(w, pid)?.id
      const p = live(w, now).find(
        x => x.by === a.by && !x.got.some(([id]) => id === pid) && (x.ally === undefined || x.ally === mine),
      )
      if (!p) return no('empty')
      const [n, ...left] = p.left
      const opened: Packet = { ...p, left, got: [...p.got, [pid, n]] }
      return {
        ok: true,
        world: { ...w, packets: (w.packets ?? []).map(x => (x === p ? opened : x)) },
        changed: new Map([[pid, { ...s, res: { ...s.res, linhThach: s.res.linhThach + n } }]]),
      }
    },
  },
}
