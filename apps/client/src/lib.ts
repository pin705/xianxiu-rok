import {
  BEAST_EMBLEMS,
  ELEMENT_EMBLEMS,
  REALM_EMBLEMS,
  SECT_EMBLEMS,
  UNIT_EMBLEMS,
  type Emblem,
  type Look,
  type TabIcon,
} from '@rok/art'
import {
  DAO_UNITS,
  type DaoId,
  type ElderId,
  type Element,
  type March,
  type Report,
  type State,
  type UnitType,
} from '@rok/rules'
import { MAP_W, shrineOf, type Point } from '@rok/rules/world'
import type { Net } from './net'
import { FALLBACK, LOCALES, loadText, pick, type Locale, type Text } from '@rok/i18n'

import { read, write } from './storage'
export { read, write }

// Ngôn ngữ: chọn một lần lúc nạp trang (đổi thì tải lại), chỉ tải bộ chữ của ngôn ngữ đó
const nav = globalThis.navigator
export const LANG: Locale = pick(read('rok.lang'), nav?.languages?.length ? nav.languages : [nav?.language ?? ''])
// không tải được (offline mà bộ chữ chưa từng được cất): dùng bộ mặc định thay vì trắng màn hình
export const L: Text = await loadText(LANG).catch(() => loadText(FALLBACK))
export const DIR = LOCALES[LANG].dir

// Bố cục desktop (cột trái, ngăn kéo phải) — cùng điều kiện với khối @media cuối ui/theme.css
export const DESK = globalThis.matchMedia?.('(min-width: 1024px) and (min-height: 600px)')
export function setLang(l: Locale) {
  write('rok.lang', l)
  location.reload()
}

// Đệ tử đặc trưng của đạo thống (DAO_UNITS): tên hệ theo tông môn s, và các chỉ số nhân thêm dạng chữ
export const unitName = (t: UnitType, s?: Pick<State, 'dao'>) =>
  s?.dao && DAO_UNITS[s.dao.id].type === t ? L.dao.names[s.dao.id].unit : L.units[t]
export const uniFx = (id: DaoId) =>
  (['atk', 'def', 'hp', 'speed'] as const).flatMap(k => {
    const v = DAO_UNITS[id][k]
    return v ? [`${k === 'speed' ? L.dao.speed : L.stat[k]} +${Math.round(v * 100)}%`] : []
  })

// Hình chạm trên huy hiệu vẽ tay (@rok/art): hệ đệ tử, ngũ hành, từng yêu thú / tông môn / bí cảnh theo thứ tự trong luật.
// Ngũ hành tô đĩa bằng tông cùng tên hành: <Medal emblem={EMBLEM.element[el]} tone={el} />
export const EMBLEM = {
  unit: UNIT_EMBLEMS satisfies Record<UnitType, Emblem>,
  element: ELEMENT_EMBLEMS satisfies Record<Element, Emblem>,
  beast: BEAST_EMBLEMS,
  sect: SECT_EMBLEMS,
  realm: REALM_EMBLEMS,
  tower: ['tower'] as const, // một tháp (i = 0) — mảng để tra theo report.kind[i] như các loại khác
  // điểm trên bản đồ giới theo loại
  spot: {
    vein: 'lotus',
    mine: 'earth',
    boss: 'dragon',
    gate: 'tower',
    heaven: 'rebirth',
    wild: 'wolf',
    ruin: 'ghost',
    altar: 'blood',
  } as Record<string, Emblem>,
}

// Chân dung chưởng môn (mặc định; đổi được sang trưởng lão đã thu nhận — Profile)
export const MASTER: Look = {
  id: 'master',
  robe: '#1b4566',
  trim: '#c9a14a',
  hair: '#211c17',
  style: 'bun',
  bg: '#78a6c2',
  mark: '#b8382a',
}
export const LOOK: Record<ElderId, Look> = {
  thanhPhong: {
    robe: '#3f6f8a',
    trim: '#c9a14a',
    hair: '#e8e6e0',
    style: 'bun',
    beard: 'long',
    bg: '#8fb3bd',
    mark: '#5fb7c9',
  },
  thachKien: { robe: '#7a5234', trim: '#2b2b2b', hair: '#2b2622', style: 'bald', beard: 'short', bg: '#b89a78' },
  nhuYen: {
    robe: '#b8412c',
    trim: '#f1d98f',
    hair: '#1a1616',
    style: 'long',
    female: true,
    bg: '#e0a58f',
    mark: '#c23b22',
  },
  loiChan: { robe: '#4b3f86', trim: '#f5d34f', hair: '#16181f', style: 'tied', bg: '#9d95c8' },
  vanHac: { robe: '#e9ece6', trim: '#c23b22', hair: '#f4f4f0', style: 'bald', beard: 'long', bg: '#a9c6b4' },
  hanBang: {
    robe: '#8fc3dc',
    trim: '#e9f6fb',
    hair: '#dfe9ef',
    style: 'crown',
    female: true,
    bg: '#bcd9e6',
    mark: '#5aa5d0',
  },
  // Từ tầng 15: kim · thổ · hoả · thuỷ · mộc · thuỷ
  bachVoNhai: {
    robe: '#eef0ee',
    trim: '#8f9aa6',
    hair: '#dde2e8',
    style: 'long',
    brow: 'fierce',
    sword: '#b8382a',
    bg: '#aab5c0',
  },
  macSau: {
    robe: '#8a6d45',
    trim: '#d9c49a',
    hair: '#5b5048',
    style: 'long',
    beard: 'short',
    brow: 'sad',
    hat: '#c9a86a',
    bg: '#c4ad86',
  },
  hoacThienCuong: {
    robe: '#8e2a1c',
    trim: '#f0a24a',
    hair: '#3a120c',
    style: 'wild',
    beard: 'short',
    brow: 'fierce',
    bg: '#e8a06e',
    mark: '#f0a24a',
  },
  toMiNuong: {
    robe: '#2f7f8f',
    trim: '#f2b8c6',
    hair: '#1c1a26',
    style: 'bun',
    female: true,
    flower: '#f29ab4',
    bg: '#a3d6d6',
    mark: '#e0506a',
  },
  diepCoThanh: {
    robe: '#3e7a4f',
    trim: '#1f3a2a',
    hair: '#15140f',
    style: 'tied',
    band: '#8cc09d',
    sword: '#c9a14a',
    bg: '#a2c7a0',
  },
  huyenMinh: {
    robe: '#1d2a44',
    trim: '#6fb3c9',
    hair: '#ecedf2',
    style: 'crown',
    beard: 'long',
    brow: 'long',
    bg: '#56708c',
    mark: '#7fd6dc',
  },
}
// mã trưởng lão làm tên tranh chân dung vẽ tay (key 'face:<mã>')
for (const [id, l] of Object.entries(LOOK)) l.id = id

// Thẻ trong bảng công trình (mở sẵn từ HUD, nhiệm vụ, trang khác)
export type PanelTab = 'upgrade' | 'train' | 'alchemy' | 'library' | 'trade' | 'forge' | 'guard'
export const TABS: readonly { id: TabIcon; unlock: number }[] = [
  { id: 'tongMon', unlock: 1 },
  { id: 'monHa', unlock: 2 },
  { id: 'banDo', unlock: 3 },
  { id: 'tienMinh', unlock: 4 },
  { id: 'baoKho', unlock: 3 },
]
export type Tab = TabIcon

const compact = new Intl.NumberFormat(LANG, { notation: 'compact', maximumFractionDigits: 1 })
export const num = (n: number) => (Math.abs(n) < 10_000 ? Math.round(n).toLocaleString(LANG) : compact.format(n))

// Tiến độ 0..1 của một việc hẹn giờ (đồng hồ máy lùi thì không âm)
export const progress = (j: { startAt: number; finishAt: number }, now: number) =>
  Math.max(0, Math.min(1, (now - j.startAt) / Math.max(1, j.finishAt - j.startAt)))

export function clock(ms: number) {
  const t = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(t / 3600),
    m = Math.floor((t % 3600) / 60)
  const ss = String(t % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

// n tên khác nhau (danh sách gợi ý dùng tên làm key, trùng là vỡ)
export function suggestNames(n: number) {
  const anyOf = <T>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)]
  const names = new Set<string>()
  while (names.size < n) names.add(`${anyOf(L.naming.first)} ${anyOf(L.naming.last)}`)
  return [...names]
}

export const spotName = (kind?: string) =>
  L.world.point[(kind ?? 'vein') as keyof typeof L.world.point] ?? L.world.point.vein
// Tên một điểm trên bản đồ giới: thần miếu có tên riêng (Huyền Vũ Miếu…), điểm khác theo loại
export const pointName = (p: Point) => (shrineOf(p) >= 0 ? L.world.shrines[shrineOf(p)] : spotName(p.kind))
export function reportName(r: Report) {
  if (r.kind === 'trib') return L.trib.title
  if (r.kind === 'pvp' || r.kind === 'arena') return r.foe ?? L.pvp.kind
  if (r.kind === 'spot') return spotName(r.spot)
  if (r.kind === 'camp') return L.world.camp.name
  if (r.kind === 'legion') return L.legion.wave(r.i + 1)
  if (r.kind === 'drill') return L.drill.fightN(r.i + 1)
  if (r.kind === 'trial') return L.trial.name(r.i + 1)
  if (r.kind === 'thief') return L.thief.name
  if (r.kind === 'escort') return L.escort.name(r.i)
  if (r.kind === 'maze') return L.maze.name(Math.floor(r.i / 100) + 1)
  return L.target({ kind: r.kind, i: r.i })
}
// Tên đích của một đội: tông môn bị cướp, điểm trên bản đồ giới, hay mục tiêu PvE
// Trận PvP nhìn từ bên thủ: đẩy lui được, hay bị cướp
export const defended = (r: Report) => (r.win ? L.pvp.repelled(r.foe ?? '') : L.pvp.raided(r.foe ?? ''))
// Đội đang làm gì: tụ kiếp vân, đóng quân, khai mỏ, đang đi tới, đang về
export function marchDoing(
  m: Pick<March, 'target' | 'stay' | 'mine' | 'arriveAt' | 'task' | 'dig' | 'rune'>,
  now: number,
) {
  if (m.target.kind === 'trib') return L.trib.gather
  if (m.dig && now < m.arriveAt) return L.world.dig.going
  if (m.rune && now < m.arriveAt) return L.world.rune.going
  if (m.stay) return L.world.stay
  if (m.mine && m.mine.end > now) return L.world.gathering
  if (m.task === 'rob' && now < m.arriveAt) return L.world.robbing
  return now < m.arriveAt ? L.map.out : L.map.back
}
export const marchName = (m: { target: { kind: string; i: number }; foe?: string; spot?: string }) =>
  m.foe ?? (m.target.kind === 'spot' ? spotName(m.spot) : L.target(m.target as Parameters<typeof L.target>[0]))

// Tab đã từng mở (để đánh dấu "!" trên tab vừa mở khóa mà người chơi chưa ghé)
// Phím tắt của game không chạy khi đang gõ chữ, đang có hộp thoại modal che, hay có phím bổ trợ (phím tắt của trình duyệt)
export const keyBlocked = (e: KeyboardEvent) =>
  e.metaKey ||
  e.ctrlKey ||
  e.altKey ||
  !!(e.target as HTMLElement).closest?.('input, textarea, select') ||
  !!document.querySelector('dialog:modal')

export const visitedTabs = (): string[] => (read('rok.tabs') ?? 'tongMon').split(',')
export const visitTab = (id: string) => write('rok.tabs', [...new Set([...visitedTabs(), id])].join(','))
// Sự kiện đã xem ở trung tâm sự kiện, mỗi lễ một mục "id:lượt" — lượt mới mở chưa xem thì thẻ có dấu "!" vàng (New của RoK)
export const seenFests = (): string[] => (read('rok.fests') ?? '').split(',')
export const seeFest = (id: string, key: number) =>
  write('rok.fests', [...seenFests().filter(k => k && !k.startsWith(`${id}:`)), `${id}:${key}`].join(','))

// Bản online: tiến độ nằm trên server. Save offline của P1 không chuyển sang được (không kiểm được gian lận — PLAN §An toàn):
// dọn một lần, báo cho người chơi biết. true: vừa dọn một save cũ.
export function forgetP1() {
  let had = false
  try {
    for (const k of Object.keys(localStorage))
      if (k === 'rok.save' || k.startsWith('rok.save.') || k === 'rok.anon') {
        had ||= k === 'rok.save'
        localStorage.removeItem(k)
      }
  } catch {}
  return had
}

// Âm thanh tổng hợp bằng WebAudio — không cần file. Chỉ phát sau lần chạm đầu tiên (luật trình duyệt).
let ctx: AudioContext | undefined
// Một AudioContext cho cả hiệu ứng lẫn nhạc nền (music.ts). Tạo lúc cần — chỉ chạy được sau lần chạm đầu tiên.
export const audio = () => (ctx ??= new AudioContext())
let muted = read('rok.mute') === '1'
let musicOn = read('rok.music') !== '0' // nhạc nền bật sẵn, nhỏ
export const isMusicOn = () => musicOn
export function setMusicOn(on: boolean) {
  musicOn = on
  write('rok.music', on ? '1' : '0')
}
export const isMuted = () => muted
// Giảm chuyển động / tiết kiệm pin: theo cài đặt hệ điều hành, hoặc công tắc trong game (lưu theo máy). data-calm trên <html>
// để CSS tắt hiệu ứng (Settings.svelte), cảnh núi thôi mây bay / rung (home.ts), phần thưởng thôi bay (fly.ts)
let calmOn = read('rok.calm') === '1'
const calmMq = typeof matchMedia === 'undefined' ? null : matchMedia('(prefers-reduced-motion: reduce)')
export const calm = () => calmOn || !!calmMq?.matches
export function setCalm(on: boolean) {
  calmOn = on
  write('rok.calm', on ? '1' : '0')
  if (typeof document !== 'undefined') document.documentElement.toggleAttribute('data-calm', on)
}
if (calmOn && typeof document !== 'undefined') document.documentElement.toggleAttribute('data-calm', true)
export function setMuted(m: boolean) {
  muted = m
  write('rok.mute', m ? '1' : '0')
}

// Tiếng hiệu ứng (tổng hợp bằng Web Audio, không file âm thanh). Thêm tiếng: thêm một dòng vào SOUNDS.
type Voice = {
  t: number // lúc bắt đầu (giây, đồng hồ AudioContext)
  note: (f: number, at: number, dur: number, type: OscillatorType, vol: number) => void
  // tiếng ồn trắng qua bộ lọc: sấm, va chạm; to: lọc quét tới tần số này (tiếng gió vút)
  noise: (at: number, dur: number, freq: number, vol: number, to?: number) => void
}
const SOUNDS = {
  tap: ({ note, t }: Voice) => note(980, t, 0.05, 'triangle', 0.04),
  err: ({ note, t }: Voice) => note(220, t, 0.12, 'square', 0.03),
  // gõ mõ: hai tiếng trầm
  build: ({ note, t }: Voice) => {
    note(392, t, 0.09, 'triangle', 0.08)
    note(523, t + 0.1, 0.09, 'triangle', 0.08)
  },
  // chuông: bồi âm lệch
  done: ({ note, t }: Voice) => [587, 1620, 3170].forEach((f, i) => note(f, t, 1.6 / (i + 1), 'sine', 0.1 / (i + 1))),
  reward: ({ note, t }: Voice) => [523, 659, 784, 1047].forEach((f, i) => note(f, t + i * 0.08, 0.4, 'triangle', 0.05)),
  // trống trận
  march: ({ note, t }: Voice) => [196, 196, 262].forEach((f, i) => note(f, t + i * 0.16, 0.14, 'triangle', 0.09)),
  hit: ({ noise, t }: Voice) => noise(t, 0.12, 1800, 0.12),
  win: ({ note, t }: Voice) =>
    [392, 523, 659, 784, 1047].forEach((f, i) => note(f, t + i * 0.1, 0.6, 'triangle', 0.06)),
  lose: ({ note, t }: Voice) => [392, 330, 262].forEach((f, i) => note(f, t + i * 0.22, 0.5, 'sine', 0.07)),
  thunder: ({ noise, t }: Voice) => noise(t, 1.4, 420, 0.5),
  // ấn gỗ dập xuống giấy: tiếng thịch trầm
  stamp: ({ note, noise, t }: Voice) => {
    noise(t, 0.16, 380, 0.5)
    note(92, t, 0.14, 'sine', 0.22)
  },
  whoosh: ({ noise, t }: Voice) => noise(t, 0.38, 500, 0.35, 3200),
}
export type Sfx = keyof typeof SOUNDS
// rung (điện thoại) kèm vài tiếng
const BUZZ: Partial<Record<Sfx, number | number[]>> = {
  done: 18,
  reward: 18,
  win: 18,
  thunder: [40, 30, 80],
  stamp: 24,
}

export function sfx(kind: Sfx) {
  const buzz = BUZZ[kind]
  if (buzz !== undefined && navigator.userActivation?.hasBeenActive) navigator.vibrate?.(buzz)
  if (muted) return
  try {
    const ac = audio()
    const note: Voice['note'] = (f, at, dur, type, vol) => {
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.type = type
      o.frequency.value = f
      g.gain.setValueAtTime(vol, at)
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
      o.connect(g).connect(ac.destination)
      o.start(at)
      o.stop(at + dur)
    }
    const noise: Voice['noise'] = (at, dur, freq, vol, to) => {
      const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2
      const src = ac.createBufferSource()
      const f = ac.createBiquadFilter()
      const g = ac.createGain()
      src.buffer = buf
      f.type = to ? 'bandpass' : 'lowpass'
      f.frequency.setValueAtTime(freq, at)
      if (to) f.frequency.exponentialRampToValueAtTime(to, at + dur)
      g.gain.value = vol
      src.connect(f).connect(g).connect(ac.destination)
      src.start(at)
    }
    SOUNDS[kind]({ t: ac.currentTime + 0.01, note, noise })
  } catch {}
}

// Bản dev (server bật ALLOW_WARP): rok.warp(60) tua giới 60 phút, rok.get() / rok.set(state) trong console
export function devTools(n: Pick<Net, 'dev'>, get: () => State | null) {
  Object.assign(globalThis, {
    rok: { get, warp: (min: number) => n.dev('warp', { min }), set: (s: State) => n.dev('state', { state: s }) },
  })
}
// Toạ độ trong chữ người chơi gõ (tin chat, lịch minh): "(x,y)" nằm trong bản đồ giới
export const coords = (t: string) =>
  [...t.matchAll(/\((\d{1,3}), ?(\d{1,3})\)/g)]
    .map(m => ({ x: Number(m[1]), y: Number(m[2]) }))
    .filter(c => c.x < MAP_W && c.y < MAP_W)
