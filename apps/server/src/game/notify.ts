// Web Push cho người đang offline: nhắc lúc việc dài xong, báo lúc bị cướp / kiếp vân vừa giáng. Chữ theo ngôn ngữ tài khoản.
import { jobOf, type JobKind, type Report, type State } from '@rok/rules'
import type { Text } from '@rok/i18n'
import type { Note } from '../lib/push.ts'

export const REMIND_MIN = 20 * 60_000 // việc xong sau ít nhất chừng này kể từ lúc rời game mới nhắc
export type Remind = { k: JobKind | 'march'; at: number }

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

export const remindNote =
  (k: Remind['k']) =>
  (L: Text): Note => ({ title: L.push.title, body: L.push.done[k], tag: 'done' })

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
