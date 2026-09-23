import type { Look } from '@rok/art'
import { DEFAULT_NAME, migrate, type BuildingId, type ElderId, type Report, type State, type UnitType } from '@rok/rules'
import { en } from './en'
import { vi, type Text } from './vi'

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

export const LANG: 'vi' | 'en' = pickLang()
export const L: Text = LANG === 'en' ? en : vi
function pickLang() {
  const saved = read('rok.lang')
  if (saved === 'vi' || saved === 'en') return saved
  return (globalThis.navigator?.language ?? 'vi').toLowerCase().startsWith('vi') ? 'vi' : 'en'
}
export function setLang(l: 'vi' | 'en') {
  write('rok.lang', l)
  location.reload()
}

// Chữ Hán trên biển hiệu, ấn, tab, huy hiệu. Thêm chữ mới thì chạy `npm run fonts -w client` để tải lại font.
export const SEAL: Record<BuildingId, string> = {
  chuDien: '殿', tuLinhTran: '阵', linhDien: '田', khoangMach: '矿',
  tangBaoCac: '库', dienVoTruong: '武', tangKinhCac: '经', danPhong: '丹',
}
export const GLYPH = {
  unit: { kiem: '剑', phap: '法', the: '体' } satisfies Record<UnitType, string>,
  beast: [...'狼蛇熊狐雕猿狼豹犀狐鹰龟虎凤蛟'],
  sect: [...'风血毒魔冥'],
  realm: [...'木炎冰'],
  thunder: '雷',
  rebirth: '轮回',
}

export const LOOK: Record<ElderId, Look> = {
  thanhPhong: { robe: '#3f6f8a', trim: '#c9a14a', hair: '#e8e6e0', style: 'bun', beard: 'long', bg: '#8fb3bd', mark: '#5fb7c9' },
  thachKien: { robe: '#7a5234', trim: '#2b2b2b', hair: '#2b2622', style: 'bald', beard: 'short', bg: '#b89a78' },
  nhuYen: { robe: '#b8412c', trim: '#f1d98f', hair: '#1a1616', style: 'long', female: true, bg: '#e0a58f', mark: '#c23b22' },
  loiChan: { robe: '#4b3f86', trim: '#f5d34f', hair: '#16181f', style: 'tied', bg: '#9d95c8' },
  vanHac: { robe: '#e9ece6', trim: '#c23b22', hair: '#f4f4f0', style: 'bald', beard: 'long', bg: '#a9c6b4' },
  hanBang: { robe: '#8fc3dc', trim: '#e9f6fb', hair: '#dfe9ef', style: 'crown', female: true, bg: '#bcd9e6', mark: '#5aa5d0' },
}

export const TABS = [
  { id: 'tongMon', glyph: '宗', unlock: 1 },
  { id: 'monHa', glyph: '徒', unlock: 2 },
  { id: 'banDo', glyph: '图', unlock: 3 },
  { id: 'tienMinh', glyph: '盟', unlock: 99 }, // P3
  { id: 'baoKho', glyph: '宝', unlock: 3 },
] as const
export type Tab = (typeof TABS)[number]['id']

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

export const reportName = (r: Report) => (r.kind === 'trib' ? L.trib.title : L.target({ kind: r.kind, i: r.i }))

// Đồng hồ game. Bản dev có thể tua: rok.warp(60) → nhanh 60 phút (nhớ qua lần tải lại trong phiên).
let warp = import.meta.env.DEV ? Number(globalThis.sessionStorage?.getItem('rok.warp') ?? 0) : 0 // ngoài trình duyệt (test render) không có sessionStorage
export const nowMs = () => Date.now() + warp
if (import.meta.env.DEV)
  Object.assign(globalThis, {
    rok: { warp: (min: number) => sessionStorage.setItem('rok.warp', String((warp += min * 60_000))) },
  })

// Lưu trên máy. Không có save → trả null để chạy màn mở đầu.
const KEY = 'rok.save'

export function load(now: number): State | null {
  const raw = read(KEY)
  if (!raw) return null
  const s = parse(raw)
  if (s) return s
  write(`${KEY}.hong.${now}`, raw) // save hỏng: cất bản sao rồi chơi mới, không ghi đè mất
  return null
}
export function parse(raw: string): State | null {
  try {
    return migrate(JSON.parse(raw))
  } catch {
    return null
  }
}
// Sau khi xoá thì khoá ghi: trang sắp tải lại, sự kiện rời trang không được lưu đè save cũ.
let frozen = false
export const save = (s: State) => frozen || write(KEY, JSON.stringify(s))
// Tab đã từng mở (để đánh dấu "!" trên tab vừa mở khóa mà người chơi chưa ghé)
export const visitedTabs = (): string[] => (read('rok.tabs') ?? 'tongMon').split(',')
export const visitTab = (id: string) => write('rok.tabs', [...new Set([...visitedTabs(), id])].join(','))
export const rawSave = () => read(KEY)
// Tab khác vừa lưu (s) hoặc xoá save (null). Không nhận thì lần lưu sau của tab này đè mất tiến độ bên kia.
export function watchSave(fn: (s: State | null) => void) {
  const on = (e: StorageEvent) => {
    if (e.key !== KEY) return
    const s = e.newValue ? parse(e.newValue) : null
    if (!s) frozen = true // save bị xoá hoặc của bản game mới hơn: khoá ghi để người gọi tải lại mà không đè
    fn(s)
  }
  addEventListener('storage', on)
  return () => removeEventListener('storage', on)
}
export const wipe = () => {
  frozen = true
  try {
    localStorage.removeItem(KEY)
  } catch {}
}
export { DEFAULT_NAME }

// Đo retention ẩn danh (cổng P1: D1/D7). Chỉ gửi khi build có VITE_ANALYTICS_URL; không có thì không làm gì.
// Gửi: mã ngẫu nhiên của máy, tên sự kiện, vài con số. Không có tên tông môn hay dữ liệu cá nhân.
const BEACON = import.meta.env.VITE_ANALYTICS_URL as string | undefined
export function track(name: string, props: Record<string, number | string | boolean> = {}) {
  if (!BEACON) return
  try {
    let id = read('rok.anon')
    if (!id) write('rok.anon', (id = crypto.randomUUID()))
    navigator.sendBeacon(BEACON, JSON.stringify({ id, name, props, v: __VERSION__, t: Date.now() }))
  } catch {}
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

export type Sfx = 'tap' | 'build' | 'done' | 'reward' | 'march' | 'hit' | 'win' | 'lose' | 'thunder' | 'err'
export function sfx(kind: Sfx) {
  const buzz = (p: number | number[]) => navigator.userActivation?.hasBeenActive && navigator.vibrate?.(p)
  if (kind === 'done' || kind === 'reward' || kind === 'win') buzz(18)
  if (kind === 'thunder') buzz([40, 30, 80])
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
    // Tiếng ồn trắng qua bộ lọc: sấm, tiếng va chạm
    const noise = (at: number, dur: number, freq: number, vol: number) => {
      const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2
      const src = ac.createBufferSource()
      const f = ac.createBiquadFilter()
      const g = ac.createGain()
      src.buffer = buf
      f.type = 'lowpass'
      f.frequency.value = freq
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
  } catch {}
}
