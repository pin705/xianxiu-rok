// Web Push cho người đang offline: nhắc lúc việc dài xong, báo lúc bị cướp / kiếp vân vừa giáng. Chữ theo ngôn ngữ tài khoản.
import {
  FESTS,
  FEST_IDS,
  RESOURCES,
  festEnds,
  festOpen,
  festPoints,
  festReady,
  jobOf,
  nextDay,
  rate,
  storage,
  yardOf,
  type JobKind,
  type Report,
  type State,
} from '@rok/rules'
import type { Text } from '@rok/i18n'
import type { Note } from '../lib/push.ts'

export const REMIND_MIN = 20 * 60_000 // việc xong sau ít nhất chừng này kể từ lúc rời game mới nhắc
export type Care = 'shield' | 'store' | 'streak' | 'chest' | 'fest' // nhắc chăm núi (loại thông báo 'remind')
export type Remind = { k: JobKind | 'march' | Care; at: number }
const SHIELD_WARN = 30 * 60_000 // nhắc trước khi Hộ Sơn Phù hết
const STREAK_HOUR = 20 // giờ VN hôm sau nhắc về núi giữ chuỗi Hương Hỏa
const LAST_CALL = 2 * 3_600_000 // rương Nhật Khóa chưa nhận / lễ sắp đóng: nhắc trước chừng này

// Việc dài xong sớm nhất lúc rời game (tạp dịch rảnh, đệ tử tuyển xong, đội về…); null: không việc nào đủ dài để nhắc
export function nextRemind(s: State, now: number): Remind | null {
  const jobs: Remind[] = [
    ...(['build', 'train', 'study', 'forge'] as const).flatMap(k => {
      const j = jobOf(s, k)
      return j ? [{ k, at: j.finishAt }] : []
    }),
    ...s.marches.filter(m => m.returnAt).map(m => ({ k: 'march' as const, at: m.returnAt })),
  ]
  return jobs.filter(j => j.at - now >= REMIND_MIN).sort((a, b) => a.at - b.at)[0] ?? null
}

// Nhắc chăm núi lúc rời game, mỗi loại một lần: khiên sắp hết, kho đầy sớm nhất (theo sản lượng), giữ chuỗi Hương Hỏa
// (20h hôm sau, khi đã có chuỗi từ 2 ngày), rương Nhật Khóa đủ mốc chưa nhận (trước 0h), lễ đang tích điểm sắp đóng
export function careReminds(s: State, now: number): Remind[] {
  const out: Remind[] = []
  if (s.shield - SHIELD_WARN - now >= REMIND_MIN) out.push({ k: 'shield', at: s.shield - SHIELD_WARN })
  const cap = storage(s)
  const held = (r: (typeof RESOURCES)[number]) => s.res[r] + yardOf(s, r) // kho + sản lượng chờ thu trên công trình
  const full = Math.min(
    ...RESOURCES.filter(r => rate(s, r) > 0 && held(r) < cap).map(
      r => now + ((cap - held(r)) / rate(s, r)) * 3_600_000,
    ),
  )
  if (Number.isFinite(full) && full - now >= REMIND_MIN) out.push({ k: 'store', at: Math.round(full) })
  if (s.vip.streak >= 2) out.push({ k: 'streak', at: nextDay(now) + STREAK_HOUR * 3_600_000 })
  const late = (at: number) => at - now >= REMIND_MIN
  if (festReady(s, now, 'daily') > 0 && late(nextDay(now) - LAST_CALL))
    out.push({ k: 'chest', at: nextDay(now) - LAST_CALL })
  const ends = FEST_IDS.filter(id => FESTS[id].kind === 'points' && festOpen(s, id, now) && festPoints(s, id) > 0)
    .map(id => festEnds(s, id, now) - LAST_CALL)
    .filter(late)
  if (ends.length) out.push({ k: 'fest', at: Math.min(...ends) })
  return out
}

const CARE: readonly string[] = ['shield', 'store', 'streak', 'chest', 'fest'] satisfies Care[]
export const remindNote =
  (k: Remind['k']) =>
  (L: Text): Note =>
    CARE.includes(k)
      ? { title: L.push.title, body: L.push.care[k as Care], tag: 'remind' }
      : { title: L.push.title, body: L.push.done[k as JobKind | 'march'], tag: 'done' }

// Tháp canh: có đội vừa xuất quân cướp mình (hay cướp đội khai mỏ) — báo sớm để kịp vào bật khiên / gọi đội về
export const incomingNote =
  ({ foe, spot }: { foe: string; spot?: number }) =>
  (L: Text): Note => ({
    title: L.push.title,
    body: spot === undefined ? L.pvp.incoming(foe) : L.pvp.robIncoming(foe),
    tag: 'raid',
  })

// Truyền âm tới lúc offline: ai nhắn, nhắn gì
export const dmNote =
  (name: string, text: string) =>
  (L: Text): Note => ({ title: L.push.dm(name), body: text, tag: 'dm' })

// Chiến báo mới lúc offline đáng báo: bị cướp (thủ được hay không), kiếp vân giáng
export function reportNote(r: Report): ((L: Text) => Note) | null {
  if (r.kind === 'pvp' && r.def)
    return L => ({
      title: L.push.title,
      body: r.win ? L.pvp.repelled(r.foe ?? '') : L.pvp.raided(r.foe ?? ''),
      tag: 'raid',
    })
  if (r.kind === 'trib') return L => ({ title: L.trib.title, body: r.win ? L.trib.success : L.trib.fail, tag: 'trib' })
  return null
}
