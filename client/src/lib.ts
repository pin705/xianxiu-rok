import { DEFAULT_NAME, type BuildingId, type Quest, type Res, type State } from '@rok/rules'

// Chữ hiển thị. Thêm tiếng Anh: tạo `en: typeof vi` rồi chọn theo ngôn ngữ.
const vi = {
  game: 'Sơn Hà Tiên Tông',
  gameHan: '山河仙宗',
  tagline: 'Dựng tông môn · Tranh linh mạch · Phi thăng',
  tapToStart: 'Chạm để bắt đầu',
  intro: [
    'Linh khí khô kiệt. Vạn tông lụi tàn.',
    'Trên ngọn núi phủ sương này, chỉ còn một chủ điện đổ nát — và bạn.',
    'Truyền thừa đã trao. Hãy dựng lại tông môn.',
  ],
  skip: 'Bỏ qua',
  naming: {
    title: 'Đặt tên tông môn',
    hint: 'Tên sẽ khắc lên ấn tông môn và hiện với mọi đạo hữu.',
    reroll: 'Gợi ý khác',
    found: 'Lập tông môn',
    tooShort: 'Tên cần từ 2 đến 16 ký tự',
    first: ['Thanh Vân', 'Huyền Thiên', 'Lạc Hà', 'Tử Vi', 'Vô Cực', 'Thái Sơ', 'Linh Lung', 'Bích Lạc', 'Hàn Sơn', 'Vân Mộng', 'Lăng Tiêu', 'Thiên Kiếm'],
    last: ['Tông', 'Môn', 'Phái', 'Cung'],
  },

  realm: (level: number) => `${['Luyện Khí', 'Trúc Cơ', 'Kim Đan'][Math.ceil(level / 5) - 1]} · tầng ${level}`,
  level: (n: number) => `Tầng ${n}`,
  power: 'Thế lực',
  full: 'Đầy',
  sound: { on: 'Tắt âm thanh', off: 'Bật âm thanh' },
  res: { linhThach: 'Linh thạch', linhThao: 'Linh thảo', linhKhoang: 'Linh khoáng' } satisfies Record<Res, string>,
  b: {
    chuDien: { name: 'Chủ điện', lore: 'Nơi chưởng môn tọa thiền. Tầng Chủ điện là cảnh giới của bạn — không công trình nào được cao hơn.' },
    tuLinhTran: { name: 'Tụ Linh Trận', lore: 'Trận pháp gom linh khí trời đất, ngưng thành linh thạch.' },
    linhDien: { name: 'Linh điền', lore: 'Ruộng linh dược tưới bằng nước suối trên núi.' },
    khoangMach: { name: 'Khoáng mạch', lore: 'Mạch khoáng nằm sâu trong vách đá, đào ra linh khoáng.' },
    tangBaoCac: { name: 'Tàng Bảo Các', lore: 'Kho báu của tông môn. Tầng càng cao, chứa được càng nhiều.' },
    dienVoTruong: { name: 'Diễn võ trường', lore: 'Nơi đệ tử luyện kiếm mỗi sớm mai.' },
    tangKinhCac: { name: 'Tàng Kinh Các', lore: 'Lưu giữ công pháp của các đời chưởng môn.' },
    danPhong: { name: 'Đan phòng', lore: 'Lò đan chưa từng tắt lửa.' },
  } satisfies Record<BuildingId, { name: string; lore: string }>,
  soon: { dienVoTruong: 'Tuyển đệ tử', tangKinhCac: 'Nghiên cứu công pháp', danPhong: 'Luyện đan, chữa thương' } as Partial<Record<BuildingId, string>>,
  soonTag: 'sắp có',

  quest: {
    title: 'Nhiệm vụ',
    text: (q: Quest) => `${q.level === 1 ? 'Xây' : 'Nâng'} ${vi.b[q.building].name}${q.level === 1 ? '' : ` lên tầng ${q.level}`}`,
    reward: 'Thưởng',
    claim: 'Nhận thưởng',
    allDone: 'Đã xong chuỗi nhiệm vụ. Độ kiếp sắp mở.',
  },
  builder: { idle: 'Rảnh', label: 'Tạp dịch' },

  panel: {
    output: 'Sản lượng',
    perHour: '/giờ',
    capacity: 'Sức chứa mỗi loại',
    requires: 'Yêu cầu',
    hall: (n: number) => `Chủ điện tầng ${n}`,
    goTo: 'Đi tới',
    cost: 'Chi phí',
    have: (n: string) => `có ${n}`,
    build: 'Xây dựng',
    notBuilt: 'Chưa xây',
    upgrade: 'Nâng cấp',
    upgrading: (n: number) => (n === 1 ? 'Đang xây' : `Đang nâng lên tầng ${n}`),
    busy: 'Tạp dịch đang bận việc khác',
    maxed: 'Đã đạt tầng tối đa',
    locked: (n: number) => `Mở khi Chủ điện đạt tầng ${n}`,
    close: 'Đóng',
  },

  tabs: { tongMon: 'Tông môn', monHa: 'Môn hạ', banDo: 'Bản đồ', tienMinh: 'Tiên minh', baoKho: 'Bảo khố' },

  away: {
    title: 'Xuất quan',
    for: (d: string) => `Bạn đã rời tông môn ${d}.`,
    got: 'Thu được',
    done: 'Hoàn thành',
    full: 'Kho đã đầy — nâng Tàng Bảo Các để chứa thêm.',
    enter: 'Vào tông môn',
  },
  ago(ms: number) {
    const m = Math.floor(ms / 60_000), h = Math.floor(m / 60), d = Math.floor(h / 24)
    const pair = (a: number, ua: string, b: number, ub: string) => (b ? `${a} ${ua} ${b} ${ub}` : `${a} ${ua}`)
    return d ? pair(d, 'ngày', h % 24, 'giờ') : h ? pair(h, 'giờ', m % 60, 'phút') : `${m} phút`
  },
}
export const L = vi

// Chữ Hán trên biển hiệu, ấn và tab. Thêm chữ mới thì chạy `npm run fonts -w client` để tải lại font.
export const SEAL: Record<BuildingId, string> = {
  chuDien: '殿', tuLinhTran: '阵', linhDien: '田', khoangMach: '矿',
  tangBaoCac: '库', dienVoTruong: '武', tangKinhCac: '经', danPhong: '丹',
}

export const TABS = [
  { id: 'tongMon', glyph: '宗', unlock: 1 },
  { id: 'monHa', glyph: '徒', unlock: 2 },
  { id: 'banDo', glyph: '图', unlock: 3 },
  { id: 'tienMinh', glyph: '盟', unlock: 6 },
  { id: 'baoKho', glyph: '宝', unlock: 3 },
] as const

const compact = new Intl.NumberFormat('vi', { notation: 'compact', maximumFractionDigits: 1 })
export const num = (n: number) => (n < 10_000 ? n.toLocaleString('vi') : compact.format(n))

export function clock(ms: number) {
  const t = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60)
  const ss = String(t % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

export function suggestName() {
  const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)]
  return `${pick(vi.naming.first)} ${pick(vi.naming.last)}`
}

// Lưu trên máy. Không có save → trả null để chạy màn mở đầu.
const KEY = 'rok.save'
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

export function load(now: number): State | null {
  const raw = read(KEY)
  if (!raw) return null
  try {
    const s = JSON.parse(raw)
    if (s?.v === 1) return { ...s, v: 2, name: DEFAULT_NAME, quest: 0 }
    if (s?.v === 2) return s as State
  } catch {
    // save hỏng: cất bản sao bên dưới rồi chơi mới, không ghi đè mất
  }
  write(`${KEY}.hong.${now}`, raw)
  return null
}

export const save = (s: State) => write(KEY, JSON.stringify(s))

// Âm thanh tổng hợp bằng WebAudio — không cần file. Chỉ phát sau lần chạm đầu tiên (luật trình duyệt).
let ctx: AudioContext | undefined
let muted = read('rok.mute') === '1'
export const isMuted = () => muted
export function setMuted(m: boolean) {
  muted = m
  write('rok.mute', m ? '1' : '0')
}

export function sfx(kind: 'tap' | 'build' | 'done' | 'reward') {
  if (kind === 'done' || kind === 'reward') navigator.vibrate?.(18)
  if (muted) return
  try {
    ctx ??= new AudioContext()
    const ac = ctx
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
    if (kind === 'tap') note(980, t, 0.05, 'triangle', 0.04)
    if (kind === 'build') {
      note(392, t, 0.09, 'triangle', 0.08) // gõ mõ: hai tiếng trầm
      note(523, t + 0.1, 0.09, 'triangle', 0.08)
    }
    if (kind === 'done') [587, 1620, 3170].forEach((f, i) => note(f, t, 1.6 / (i + 1), 'sine', 0.1 / (i + 1))) // chuông: bồi âm lệch
    if (kind === 'reward') [523, 659, 784, 1047].forEach((f, i) => note(f, t + i * 0.08, 0.4, 'triangle', 0.05))
  } catch {}
}
