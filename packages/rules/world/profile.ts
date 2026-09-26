// Hồ sơ chưởng môn (Governor Profile của RoK): phần người khác xem được — dựng từ state + phần chung của giới.
import { power } from '../core/stats.ts'
import { TITLE_IDS, type DaoId, type ElderId, type FrameId, type TitleId } from '../data.ts'
import { allyOf, type Players, type Role, type World } from './base.ts'

// Hồ sơ chưởng môn mà người khác xem được (như Governor Profile của RoK): không lộ kho, quân, mầm
export type Profile = {
  pid: number
  name: string
  hall: number
  power: number
  ally: { tag: string; name: string; role: Role } | null
  seat: { x: number; y: number } | null
  pvp: { win: number; loss: number; pts: number }
  rebirths: number
  ascended: number // số mùa đã phi thăng
  tower: number
  elders: number
  ach: number // tổng bậc thành tựu đã nhận
  kp: number // chiến công
  online: boolean
  title: TitleId | null // tước Giới Chủ phong (còn hạn)
  lord: boolean // chính là Giới Chủ
  crown?: boolean // người xem là Giới Chủ: sắc phong được cho người này
  boon?: number // người xem là Giới Chủ: Thiên Ân lễ còn ban được tuần này
  invite?: boolean // người xem là trưởng lão / minh chủ, người này chưa vào minh nào: mời được
  dao?: DaoId // đạo thống đang theo
  face?: ElderId // chân dung đã chọn (trưởng lão đã thu nhận; không có: chân dung chưởng môn)
  frame?: FrameId // khung chân dung (không có: khung thường)
}
export function profileOf(
  w: World,
  ps: Players,
  pid: number,
  online: boolean,
  now = 0,
  lord: number | null = null,
): Profile | null {
  const s = ps.get(pid)
  if (!s) return null
  const al = allyOf(w, pid)
  return {
    pid,
    name: s.name,
    hall: s.levels.chuDien,
    power: Math.round(power(s)),
    ally: al ? { tag: al.tag, name: al.name, role: al.members[pid] } : null,
    seat: s.seat,
    pvp: s.pvp,
    rebirths: s.rebirths,
    ...(s.dao && { dao: s.dao.id }),
    ...(s.face && { face: s.face }),
    ...(s.frame && s.frame !== 'basic' && { frame: s.frame }),
    ascended: s.ascended.length,
    tower: s.tower,
    elders: Object.keys(s.elders).length,
    ach: Object.values(s.ach ?? {}).reduce((a, b) => a + (b ?? 0), 0),
    kp: s.stats.kp ?? 0,
    online,
    title: TITLE_IDS.find(id => w.titles?.[id]?.pid === pid && w.titles[id]!.until > now) ?? null,
    lord: lord === pid,
  }
}
