// Việc vừa xong giữa hai state (xong theo giờ, nhờ Tụ Khí Đan, hay server đẩy xuống): App mừng và báo từng việc.
import { mailText } from '@rok/i18n'
import {
  ALLY_HALL,
  BUILDINGS,
  CHAT_HALL,
  ELDER_IDS,
  IDS,
  MAP_HALL,
  PVP_HALL,
  REALMS,
  SECTS,
  TAVERN_HALL,
  TECH_IDS,
  TOWER,
  jobOf,
  type BuildingId,
  type ElderId,
  type ItemId,
  type Items,
  type Report,
  type State,
} from '@rok/rules'
import type { Emblem, IconName, MedalTone } from '@rok/art'
import { EMBLEM, L, TABS, defended, read, reportName, write, type Tab } from './lib'
import { social } from './social.svelte'

export type Note = { text: string; report?: Report; bad?: boolean }

// Chủ điện lên tầng n: những gì vừa mở (UX.md mục 4 — mở dần theo tầng) — màn Mở khoá vẽ từng cái (tranh công trình, huy
// hiệu điểm đánh, hay icon) và bấm là tới: công trình mở bảng công trình, còn lại chuyển tab
// b: công trình (tranh) · tab: chỉ tab thì vẽ icon tab · emblem: huy hiệu điểm đánh · icon: icon thao tác
export type Unlock = { name: string; b?: BuildingId; tab?: Tab; emblem?: [Emblem, MedalTone]; icon?: IconName }
export function unlockList(n: number): Unlock[] {
  const map = (name: string, x: Pick<Unlock, 'emblem' | 'icon'>): Unlock => ({ name, tab: 'banDo', ...x })
  const list: Unlock[] = [
    ...IDS.filter(id => id !== 'chuDien' && BUILDINGS[id].unlock === n).map(id => ({ name: L.b[id].name, b: id })),
    ...TABS.filter(t => t.unlock === n).map(t => ({ name: L.tabs[t.id], tab: t.id })),
    ...(n === MAP_HALL ? [map(L.map.title, { icon: 'globe' })] : []),
    ...SECTS.flatMap((d, i) => (d.hall === n ? [map(L.sects[i].name, { emblem: [EMBLEM.sect[i], 'sect'] })] : [])),
    ...REALMS.flatMap((d, i) => (d.hall === n ? [map(L.realms[i].name, { emblem: [EMBLEM.realm[i], 'realm'] })] : [])),
    ...(n === TOWER.hall ? [map(L.tower.name, { emblem: ['tower', 'tower'] })] : []),
    ...(n === TAVERN_HALL ? [{ name: L.tavern.title, tab: 'monHa' as const, icon: 'star' as const }] : []),
    ...(n === CHAT_HALL ? [map(`${L.chat.world} (chat)`, { icon: 'mail' })] : []),
    ...(n === PVP_HALL ? [map(L.pvp.title, { icon: 'swords' }), map(L.arena.title, { icon: 'rank' })] : []),
    ...(n === ALLY_HALL ? [{ name: L.ally.found, tab: 'tienMinh' as const, icon: 'people' as const }] : []),
  ]
  return list.filter((u, k) => list.findIndex(x => x.name === u.name) === k)
}
export function unlocked(n: number): Note[] {
  const names = unlockList(n).map(u => u.name)
  return names.length ? [{ text: L.unlocked(names.join(', ')) }] : []
}

// Công trình vừa lên tầng (up), và các dòng báo theo thứ tự: mở khoá, chiến báo mới (khi reports; trừ skip — trận
// người chơi đang xem tận mắt), thư mới, việc xong
export function changes(prev: State, next: State, reports: boolean, skip?: Report) {
  const up = IDS.filter(id => next.levels[id] > prev.levels[id])
  const notes: Note[] = []
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
  // Chủ điện vừa lên tầng có gì mở: App mở màn Mở khoá thay vì một dòng báo
  const hall = up.includes('chuDien') && unlockList(next.levels.chuDien).length ? next.levels.chuDien : 0
  const items = Object.fromEntries(
    Object.entries(next.items).filter(([id, n]) => (n ?? 0) > (prev.items[id as ItemId] ?? 0)),
  ) as Items
  for (const id of Object.keys(items) as ItemId[]) items[id] = next.items[id]! - (prev.items[id] ?? 0)
  // trưởng lão vừa thu nhận (tín vật đủ, quà lần đầu phá bí cảnh, lễ…): màn Thu nhận
  const elders = ELDER_IDS.filter(e => next.elders[e] !== undefined && prev.elders[e] === undefined)
  return { up, notes, hall, items, elders }
}
// Màn mừng sau khi đổi state: Mở khoá (Chủ điện lên tầng có tính năng mới), Thu nhận (trưởng lão mới), dải Tạ lễ (vật
// phẩm vừa nhận — dồn nếu đang hiện)
export function reveal(c: { hall: number; items: Items; elders?: ElderId[] }) {
  if (c.hall) social.unlock = c.hall
  if (c.elders?.length) social.elders = [...social.elders, ...c.elders.filter(e => !social.elders.includes(e))]
  const ids = Object.keys(c.items) as ItemId[]
  if (ids.length)
    social.gift = {
      ...social.gift,
      ...Object.fromEntries(ids.map(id => [id, (social.gift?.[id] ?? 0) + c.items[id]!])),
    }
}

// Vừa giao một việc dài (≥ 30 phút): lúc hợp để hỏi bật thông báo đẩy
export const longJob = (prev: State, next: State) =>
  (['build', 'train', 'train2', 'study', 'forge'] as const).some(k => {
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
  (['build', 'train', 'train2', 'heal', 'study', 'forge'] as const).filter(k => {
    const j = jobOf(next, k)
    return !!j && j.startAt !== jobOf(prev, k)?.startAt
  })
