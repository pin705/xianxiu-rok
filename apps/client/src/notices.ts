// Việc vừa xong giữa hai state (xong theo giờ, nhờ Tụ Khí Đan, hay server đẩy xuống): App mừng và báo từng việc.
import { mailText } from '@rok/i18n'
import {
  ALLY_HALL,
  BUILDINGS,
  CHAT_HALL,
  IDS,
  MAP_HALL,
  PVP_HALL,
  REALMS,
  SECTS,
  TAVERN_HALL,
  TECH_IDS,
  TOWER,
  jobOf,
  type Report,
  type State,
} from '@rok/rules'
import { L, TABS, defended, read, reportName, write } from './lib'

export type Note = { text: string; report?: Report; bad?: boolean }

// Chủ điện lên tầng n: những gì vừa mở (UX.md mục 4 — mở dần theo tầng)
export function unlocked(n: number): Note[] {
  const opened = [
    ...IDS.filter(id => id !== 'chuDien' && BUILDINGS[id].unlock === n).map(id => L.b[id].name),
    ...TABS.filter(t => t.unlock === n).map(t => L.tabs[t.id]),
    ...(n === MAP_HALL ? [L.map.title] : []),
    ...SECTS.flatMap((d, i) => (d.hall === n ? [L.sects[i].name] : [])),
    ...REALMS.flatMap((d, i) => (d.hall === n ? [L.realms[i].name] : [])),
    ...(n === TOWER.hall ? [L.tower.name] : []),
    ...(n === TAVERN_HALL ? [L.tavern.title] : []),
    ...(n === CHAT_HALL ? [`${L.chat.world} (chat)`] : []),
    ...(n === PVP_HALL ? [L.pvp.title, L.arena.title] : []),
    ...(n === ALLY_HALL ? [L.ally.found] : []),
  ]
  return opened.length ? [{ text: L.unlocked([...new Set(opened)].join(', ')) }] : []
}

// Công trình vừa lên tầng (up), và các dòng báo theo thứ tự: mở khoá, chiến báo mới (khi reports; trừ skip — trận
// người chơi đang xem tận mắt), thư mới, việc xong
export function changes(prev: State, next: State, reports: boolean, skip?: Report) {
  const up = IDS.filter(id => next.levels[id] > prev.levels[id])
  const notes: Note[] = up.includes('chuDien') ? unlocked(next.levels.chuDien) : []
  if (reports)
    for (const r of next.reports.filter(r => r.id >= prev.nextId && r !== skip))
      notes.push({ text: r.def ? defended(r) : L.report.fresh(reportName(r), r.win), report: r, bad: !r.win })
  const newest = next.mail.at(-1)
  if (newest && newest.id >= prev.nextId) notes.push({ text: `${L.mail.title}: ${mailText(L, newest)[0]}` })
  const more = (k: 'trained' | 'healed' | 'brewed') => next.stats[k] - prev.stats[k]
  if (more('trained') > 0) notes.push({ text: L.away.trained(more('trained')) })
  if (more('healed') > 0) notes.push({ text: L.away.healed(more('healed')) })
  if (more('brewed') > 0) notes.push({ text: L.away.brewed(more('brewed')) })
  for (const t of TECH_IDS)
    if ((next.tech[t] ?? 0) > (prev.tech[t] ?? 0)) notes.push({ text: L.away.tech(L.techs[t], next.tech[t]!) })
  return { up, notes }
}

// Vừa giao một việc dài (≥ 30 phút): lúc hợp để hỏi bật thông báo đẩy
export const longJob = (prev: State, next: State) =>
  (['build', 'train', 'study', 'forge'] as const).some(k => {
    const j = jobOf(next, k)
    return !!j && j !== jobOf(prev, k) && j.finishAt - next.time >= 30 * 60_000
  })
// Hỏi bật thông báo đúng lúc: vừa giao việc dài mà trình duyệt chưa được hỏi — mỗi máy một lần (true: hỏi ngay, đã ghi nhớ).
// Quyền chỉ xin được khi người chơi bấm, nên App hỏi bằng toast có nút "Bật" chứ không bật hộp thoại của trình duyệt ngay.
export function pushTime(prev: State, next: State) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'default' || read('rok.push')) return false
  if (!longJob(prev, next)) return false
  write('rok.push', '1')
  return true
}
// Việc vừa giao mà đồng minh giúp rút ngắn được (mọi việc hẹn giờ trừ luyện đan): tự nhờ giúp như bấm bàn tay của RoK
export const newHelps = (prev: State, next: State) =>
  (['build', 'train', 'heal', 'study', 'forge'] as const).filter(k => {
    const j = jobOf(next, k)
    return !!j && j.startAt !== jobOf(prev, k)?.startAt
  })
