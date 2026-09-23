import { newGame, type BuildingId, type Res, type State } from '@rok/rules'

// Chữ hiển thị. Thêm tiếng Anh: tạo `en: typeof vi` rồi chọn theo ngôn ngữ.
const vi = {
  sect: 'Thanh Vân Tông',
  realm: (level: number) => `${['Luyện Khí', 'Trúc Cơ', 'Kim Đan'][Math.ceil(level / 5) - 1]} · tầng ${level}`,
  level: (n: number) => `tầng ${n}`,
  res: { linhThach: 'linh thạch', linhThao: 'linh thảo', linhKhoang: 'linh khoáng' } satisfies Record<Res, string>,
  b: {
    chuDien: { name: 'Chủ điện', does: 'Giới hạn tầng của mọi công trình khác' },
    tuLinhTran: { name: 'Tụ Linh Trận', does: '' },
    linhDien: { name: 'Linh điền', does: '' },
    khoangMach: { name: 'Khoáng mạch', does: '' },
    tangBaoCac: { name: 'Tàng Bảo Các', does: '' },
    dienVoTruong: { name: 'Diễn võ trường', does: 'Huấn luyện đệ tử — sắp có' },
    tangKinhCac: { name: 'Tàng Kinh Các', does: 'Nghiên cứu công pháp — sắp có' },
    danPhong: { name: 'Đan phòng', does: 'Luyện đan, chữa thương — sắp có' },
  } satisfies Record<BuildingId, { name: string; does: string }>,
  makes: (amount: string, r: Res) => `${amount} ${vi.res[r]}/giờ`,
  holds: (amount: string) => `Sức chứa ${amount} mỗi loại`,
  build: 'Xây',
  upgradeTo: (n: number) => `Nâng tầng ${n}`,
  upgradeFull: (name: string, n: number) => (n === 1 ? `Xây ${name}` : `Nâng ${name} lên tầng ${n}`),
  duration: 'thời gian xây',
  upgrading: (n: number) => (n === 1 ? 'Đang xây' : `Đang nâng lên tầng ${n}`),
  maxed: 'Tầng tối đa',
  needHall: (n: number) => `Cần Chủ điện tầng ${n}`,
  opensAt: (n: number) => `Mở khi Chủ điện đạt tầng ${n}`,
  working: (name: string, n: number) => `Tạp dịch đang ${n === 1 ? 'xây' : 'nâng'} ${name}`,
  idle: 'Tạp dịch đang rảnh',
  suggest: (name: string, isNew: boolean) => `Gợi ý: ${isNew ? 'xây' : 'nâng'} ${name}`,
  full: 'đầy',
  tabs: { tongMon: 'Tông môn', monHa: 'Môn hạ', banDo: 'Bản đồ', tienMinh: 'Tiên minh', baoKho: 'Bảo khố' },
  soon: 'sắp có',
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

// Ấn triện: vuông cho công trình, tròn cho tài nguyên (xem UX.md mục 7).
// Thêm chữ Hán mới thì chạy `npm run fonts -w client` để tải lại font ấn.
export const SEAL: Record<BuildingId | Res | 'time', string> = {
  chuDien: '殿', tuLinhTran: '阵', linhDien: '田', khoangMach: '矿',
  tangBaoCac: '库', dienVoTruong: '武', tangKinhCac: '经', danPhong: '丹',
  linhThach: '石', linhThao: '草', linhKhoang: '矿', time: '时',
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

const KEY = 'rok.save'

export function load(now: number): State {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    // trình duyệt chặn storage: vẫn chơi được, chỉ không lưu
  }
  if (!raw) return newGame(now)
  try {
    const s = JSON.parse(raw)
    if (s?.v === 1) return s as State
  } catch {
    // save hỏng: cất bản sao bên dưới rồi chơi mới, không ghi đè mất
  }
  try {
    localStorage.setItem(`${KEY}.hong.${now}`, raw)
  } catch {}
  return newGame(now)
}

export function save(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {}
}
