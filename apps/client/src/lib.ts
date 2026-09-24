import { BEAST_EMBLEMS, ELEMENT_EMBLEMS, REALM_EMBLEMS, SECT_EMBLEMS, UNIT_EMBLEMS, type Emblem, type Look, type TabIcon } from '@rok/art'
import type { ElderId, Element, Report, UnitType } from '@rok/rules'
import { FALLBACK, LOCALES, loadText, pick, type Locale, type Text } from '@rok/i18n'

// Lưu trên máy (trình duyệt chặn storage thì vẫn chơi được, chỉ không lưu)
const read = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null // trình duyệt chặn storage: vẫn chơi được, chỉ không lưu
  }
}
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v)
  } catch {}
}

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

// Hình chạm trên huy hiệu vẽ tay (@rok/art): hệ đệ tử, ngũ hành, từng yêu thú / tông môn / bí cảnh theo thứ tự trong luật.
// Ngũ hành tô đĩa bằng tông cùng tên hành: <Medal emblem={EMBLEM.element[el]} tone={el} />
export const EMBLEM = {
  unit: UNIT_EMBLEMS satisfies Record<UnitType, Emblem>,
  element: ELEMENT_EMBLEMS satisfies Record<Element, Emblem>,
  beast: BEAST_EMBLEMS,
  sect: SECT_EMBLEMS,
  realm: REALM_EMBLEMS,
  tower: ['tower'] as const, // một tháp (i = 0) — mảng để tra theo report.kind[i] như các loại khác
}

export const LOOK: Record<ElderId, Look> = {
  thanhPhong: { robe: '#3f6f8a', trim: '#c9a14a', hair: '#e8e6e0', style: 'bun', beard: 'long', bg: '#8fb3bd', mark: '#5fb7c9' },
  thachKien: { robe: '#7a5234', trim: '#2b2b2b', hair: '#2b2622', style: 'bald', beard: 'short', bg: '#b89a78' },
  nhuYen: { robe: '#b8412c', trim: '#f1d98f', hair: '#1a1616', style: 'long', female: true, bg: '#e0a58f', mark: '#c23b22' },
  loiChan: { robe: '#4b3f86', trim: '#f5d34f', hair: '#16181f', style: 'tied', bg: '#9d95c8' },
  vanHac: { robe: '#e9ece6', trim: '#c23b22', hair: '#f4f4f0', style: 'bald', beard: 'long', bg: '#a9c6b4' },
  hanBang: { robe: '#8fc3dc', trim: '#e9f6fb', hair: '#dfe9ef', style: 'crown', female: true, bg: '#bcd9e6', mark: '#5aa5d0' },
  // Từ tầng 15: kim · thổ · hoả · thuỷ · mộc · thuỷ
  bachVoNhai: { robe: '#eef0ee', trim: '#8f9aa6', hair: '#dde2e8', style: 'long', brow: 'fierce', sword: '#b8382a', bg: '#aab5c0' },
  macSau: { robe: '#8a6d45', trim: '#d9c49a', hair: '#5b5048', style: 'long', beard: 'short', brow: 'sad', hat: '#c9a86a', bg: '#c4ad86' },
  hoacThienCuong: { robe: '#8e2a1c', trim: '#f0a24a', hair: '#3a120c', style: 'wild', beard: 'short', brow: 'fierce', bg: '#e8a06e', mark: '#f0a24a' },
  toMiNuong: { robe: '#2f7f8f', trim: '#f2b8c6', hair: '#1c1a26', style: 'bun', female: true, flower: '#f29ab4', bg: '#a3d6d6', mark: '#e0506a' },
  diepCoThanh: { robe: '#3e7a4f', trim: '#1f3a2a', hair: '#15140f', style: 'tied', band: '#8cc09d', sword: '#c9a14a', bg: '#a2c7a0' },
  huyenMinh: { robe: '#1d2a44', trim: '#6fb3c9', hair: '#ecedf2', style: 'crown', beard: 'long', brow: 'long', bg: '#56708c', mark: '#7fd6dc' },
}

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
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60)
  const ss = String(t % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

// n tên khác nhau (danh sách gợi ý dùng tên làm key, trùng là vỡ)
export function suggestNames(n: number) {
  const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)]
  const names = new Set<string>()
  while (names.size < n) names.add(`${pick(L.naming.first)} ${pick(L.naming.last)}`)
  return [...names]
}

export const reportName = (r: Report) => (r.kind === 'trib' ? L.trib.title : r.kind === 'pvp' ? (r.foe ?? L.pvp.kind) : L.target({ kind: r.kind, i: r.i }))

// Tab đã từng mở (để đánh dấu "!" trên tab vừa mở khóa mà người chơi chưa ghé)
export const visitedTabs = (): string[] => (read('rok.tabs') ?? 'tongMon').split(',')
export const visitTab = (id: string) => write('rok.tabs', [...new Set([...visitedTabs(), id])].join(','))

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
export function setMuted(m: boolean) {
  muted = m
  write('rok.mute', m ? '1' : '0')
}

export type Sfx = 'tap' | 'build' | 'done' | 'reward' | 'march' | 'hit' | 'win' | 'lose' | 'thunder' | 'err' | 'stamp' | 'whoosh'
export function sfx(kind: Sfx) {
  const buzz = (p: number | number[]) => navigator.userActivation?.hasBeenActive && navigator.vibrate?.(p)
  if (kind === 'done' || kind === 'reward' || kind === 'win') buzz(18)
  if (kind === 'thunder') buzz([40, 30, 80])
  if (kind === 'stamp') buzz(24)
  if (muted) return
  try {
    const ac = audio()
    const t = ac.currentTime + 0.01
    const note = (f: number, at: number, dur: number, type: OscillatorType, vol: number) => {
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
    // Tiếng ồn trắng qua bộ lọc: sấm, tiếng va chạm. to: lọc quét tới tần số này (tiếng gió vút)
    const noise = (at: number, dur: number, freq: number, vol: number, to?: number) => {
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
    if (kind === 'tap') note(980, t, 0.05, 'triangle', 0.04)
    if (kind === 'err') note(220, t, 0.12, 'square', 0.03)
    if (kind === 'build') {
      note(392, t, 0.09, 'triangle', 0.08) // gõ mõ: hai tiếng trầm
      note(523, t + 0.1, 0.09, 'triangle', 0.08)
    }
    if (kind === 'done') [587, 1620, 3170].forEach((f, i) => note(f, t, 1.6 / (i + 1), 'sine', 0.1 / (i + 1))) // chuông: bồi âm lệch
    if (kind === 'reward') [523, 659, 784, 1047].forEach((f, i) => note(f, t + i * 0.08, 0.4, 'triangle', 0.05))
    if (kind === 'march') [196, 196, 262].forEach((f, i) => note(f, t + i * 0.16, 0.14, 'triangle', 0.09)) // trống trận
    if (kind === 'hit') noise(t, 0.12, 1800, 0.12)
    if (kind === 'win') [392, 523, 659, 784, 1047].forEach((f, i) => note(f, t + i * 0.1, 0.6, 'triangle', 0.06))
    if (kind === 'lose') [392, 330, 262].forEach((f, i) => note(f, t + i * 0.22, 0.5, 'sine', 0.07))
    if (kind === 'thunder') noise(t, 1.4, 420, 0.5)
    if (kind === 'stamp') {
      noise(t, 0.16, 380, 0.5) // ấn gỗ dập xuống giấy: tiếng thịch trầm
      note(92, t, 0.14, 'sine', 0.22)
    }
    if (kind === 'whoosh') noise(t, 0.38, 500, 0.35, 3200)
  } catch {}
}
