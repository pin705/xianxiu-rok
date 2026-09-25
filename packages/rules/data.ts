// Số liệu game. Chỉnh nhịp bằng `npm run sim` (simulate.ts), không bằng cảm giác.
// Chữ hiển thị (tên, lời dẫn) nằm ở @rok/i18n (packages/i18n/locales) — ở đây chỉ có số.

export const RESOURCES = ['linhThach', 'linhThao', 'linhKhoang'] as const
export type Res = (typeof RESOURCES)[number]
export type Bag = Record<Res, number>
const b = (linhThach: number, linhThao: number, linhKhoang: number): Bag => ({ linhThach, linhThao, linhKhoang })

// ---------- Tông môn ----------

export const MAX_LEVEL = 25
// Kiếp đầu: 15 tầng (Luyện Khí → Kim Đan), từ đây luân hồi được. Tầng 16–25 (Nguyên Anh, Hóa Thần) là đường tiếp
// cho người không luân hồi — và thang tầng cho mùa giải.
export const REBIRTH_HALL = 15
export const QUEUE_SIZE = 1
export const START: Bag = b(1000, 1000, 1000)
export const BASE_CAP = 2000 // sức chứa mỗi loại khi chưa có Tàng Bảo Các
// Linh khí tự nhiên của núi: mỗi loại 60/giờ dù chưa có công trình nào. Không có nó, người dồn hết tài nguyên nâng
// Chủ điện trước khi xây Linh điền/Khoáng mạch sẽ kẹt vĩnh viễn (xây hai nhà đó cần chính thảo/khoáng đã cạn).
export const BASE_RATE = 60
export const CAP_GROWTH = 1.3 // mỗi tầng Tàng Bảo Các
export const COST_GROWTH = 1.6 // mỗi tầng công trình
export const TIME_GROWTH = 1.7
// Trên tầng KNEE đường tăng trưởng thoải hẳn: nhân tiếp 1,6 thì Chủ điện 25 tốn 7,9M mỗi loại và 5 657 giờ xây.
// Sản lượng mỗi tầng trên KNEE gấp RATE_HIGH tầng thấp (chi phí vẫn tăng 22 %/tầng nên kho vẫn là nút thắt).
export const KNEE = 15
export const COST_GROWTH2 = 1.22
export const TIME_GROWTH2 = 1.05
export const RATE_HIGH = 1.5

export type BuildingDef = {
  unlock: number // tầng Chủ điện cần để xây
  cost: Bag // chi phí lên tầng 1, tầng sau nhân COST_GROWTH
  time: number // giây lên tầng 1, tầng sau nhân TIME_GROWTH
  power: number // thế lực mỗi tầng, cộng dồn: tầng n góp power × (1 + 2 + … + n)
  makes?: Res // tài nguyên sản xuất
  rate?: number // sản lượng mỗi giờ, cho mỗi tầng
}

// Chủ điện bắt đầu ở tầng 1, nên lần nâng đầu là lên tầng 2.
const defs = {
  chuDien: { unlock: 1, time: 60, power: 40, cost: b(100, 100, 100) },
  tuLinhTran: { unlock: 1, time: 10, power: 8, cost: b(0, 80, 80), makes: 'linhThach', rate: 600 },
  linhDien: { unlock: 1, time: 10, power: 8, cost: b(80, 0, 80), makes: 'linhThao', rate: 600 },
  khoangMach: { unlock: 1, time: 10, power: 8, cost: b(80, 80, 0), makes: 'linhKhoang', rate: 600 },
  tangBaoCac: { unlock: 2, time: 20, power: 10, cost: b(100, 60, 100) },
  dienVoTruong: { unlock: 2, time: 30, power: 14, cost: b(120, 120, 60) },
  danPhong: { unlock: 3, time: 45, power: 16, cost: b(100, 150, 100) },
  tangKinhCac: { unlock: 4, time: 45, power: 16, cost: b(150, 80, 150) },
  luyenKhiPhong: { unlock: 8, time: 45, power: 16, cost: b(110, 70, 140) },
  hoSonDaiTran: { unlock: 6, time: 40, power: 18, cost: b(120, 90, 130) }, // Hộ Sơn Đại Trận: bên thủ mạnh hơn GUARD_STEP mỗi tầng
} satisfies Record<string, BuildingDef>

export type BuildingId = keyof typeof defs
export const BUILDINGS: Record<BuildingId, BuildingDef> = defs

export const MAP_HALL = 3 // Chủ điện tầng 3 mở bản đồ

// ---------- Đệ tử ----------

export const TYPES = ['kiem', 'phap', 'the'] as const
export type UnitType = (typeof TYPES)[number]
// Kiếm tu > Pháp tu > Thể tu > Kiếm tu: kiếm nhanh đuổi kịp pháp tu, pháp thuật xuyên thể phách, thân thể chịu được kiếm.
export const BEATS: Record<UnitType, UnitType> = { kiem: 'phap', phap: 'the', the: 'kiem' }
export const ADV = 1.3
export const DISADV = 0.8

export type Tier = 1 | 2 | 3 | 4 | 5
export const TIERS: Tier[] = [1, 2, 3, 4, 5]
// stat: nhân công/thủ/máu · cost, time: nhân chi phí và thời gian tuyển · unlock: tầng Diễn võ trường · power: thế lực mỗi đệ tử
export const TIER: Record<Tier, { stat: number; cost: number; time: number; unlock: number; power: number }> = {
  1: { stat: 1, cost: 1, time: 1, unlock: 1, power: 1 },
  2: { stat: 2.2, cost: 2.6, time: 2, unlock: 5, power: 3 },
  3: { stat: 4.4, cost: 5.8, time: 4.5, unlock: 10, power: 8 },
  4: { stat: 8, cost: 11, time: 8, unlock: 16, power: 18 },
  5: { stat: 14, cost: 20, time: 14, unlock: 21, power: 36 },
}
export const UNIT_BASE: Record<UnitType, { atk: number; def: number; hp: number; cost: Bag; time: number }> = {
  kiem: { atk: 12, def: 5, hp: 30, cost: b(12, 12, 36), time: 4 },
  phap: { atk: 14, def: 3, hp: 26, cost: b(36, 12, 12), time: 4 },
  the: { atk: 8, def: 9, hp: 42, cost: b(12, 36, 12), time: 4 },
}
export type UnitId = `${UnitType}${Tier}`
export const UNITS = TYPES.flatMap(t => TIERS.map(n => `${t}${n}` as UnitId))

export const BATCH_BASE = 20 // số đệ tử mỗi lượt tuyển: BATCH_BASE + BATCH_STEP × tầng Diễn võ trường
export const BATCH_STEP = 20
export const HOSPITAL_BASE = 80 // chỗ nằm thương binh: HOSPITAL_BASE + HOSPITAL_STEP × tầng Đan phòng
export const HOSPITAL_STEP = 120
export const HEAL_COST = 0.4 // chữa 1 thương binh tốn 40% chi phí tuyển
export const HEAL_TIME = 0.3

// ---------- Trận đánh ----------

export const DEF_K = 60 // giảm sát thương = thủ / (DEF_K + thủ)
export const MAX_ROUNDS = 10 // hết 10 lượt chưa phân thắng bại: bên tấn công rút lui
// Chân nguyên (Rage của RoK): bên có công pháp mỗi lượt tụ RAGE_TURN, mất máu tụ thêm RAGE_HURT × phần máu mất trong lượt
// (so với lúc vào trận); đầy RAGE_MAX thì thi triển ngay lượt đó (phần dư giữ lại). Không mất máu: đúng lượt 3, 6, 9;
// bị đánh đau thì ra chiêu sớm hơn.
export const RAGE_MAX = 1000
export const RAGE_TURN = 350
export const RAGE_HURT = 600
// Phó trưởng lão (Secondary Commander của RoK): từ Chủ điện tầng DEPUTY_HALL, mỗi trưởng lão ghép một phó; phó đi cùng đội,
// tâm pháp (bị động đã mở) của phó cộng vào đội, công pháp của phó nổ ngay sau chủ tướng với DEPUTY_SKILL sức.
// Thiên phú, pháp bảo, sao, ngũ hành chỉ của chủ tướng.
// Đạo thống (Civilization của RoK): mỗi tông môn theo một đạo thống, hai tăng ích nhỏ; chọn lần đầu miễn phí từ Chủ điện
// tầng DAO_HALL, đổi lại được sau DAO_COOL.
export const DAO_HALL = 2
export const DAO_COOL = 7 * 24 * 3_600_000
export const DAOS = {
  kiemTong: { 'atk.kiem': 0.05, march: 0.05 },
  phapTong: { 'atk.phap': 0.05, skill: 0.05 },
  theTong: { 'hp.the': 0.05, heal: 0.1 },
  danTong: { brew: 0.1, prod: 0.03 },
  tranTong: { def: 0.05, build: 0.03 },
} as const satisfies Record<string, Partial<Record<Bonus, number>>>
export type DaoId = keyof typeof DAOS
export const DAO_IDS = Object.keys(DAOS) as DaoId[]
export const DEPUTY_HALL = 8
export const DEPUTY_SKILL = 0.5
// Trận dung (March Capacity của RoK): mỗi đội ra bản đồ giới (cướp, điểm giới, kết trận, viện binh, phá cờ) mang tối đa
// MARCH_CAP + MARCH_CAP_STEP mỗi cấp chủ tướng trên 1, thêm MARCH_CAP_STAR mỗi sao trên 1. Xuất chinh ở núi và độ kiếp không giới hạn.
export const MARCH_CAP = 500
export const MARCH_CAP_STEP = 80
export const MARCH_CAP_STAR = 0.1

// Trưởng lão là trận nhãn: mỗi cấp +4% công và máu cả đội
export const ELDER_STEP = 0.04
export const ELDER_MAX = 40
export const ELDER_DUP_EXP = 5000 // quà trưởng lão đã có: đổi thành chừng ấy kinh nghiệm cho người đó
export const EXP_BASE = 50 // tổng kinh nghiệm để đạt cấp n: EXP_BASE × n × (n − 1)
export const LOSS_EXP = 0 // thua không có kinh nghiệm: bí cảnh đánh tức thì, cho kinh nghiệm khi thua là cày cấp bằng cách gửi 1 đệ tử

// skill: sức công pháp chủ động của trưởng lão · forge: thời gian luyện pháp bảo
export type Bonus =
  | 'prod'
  | 'prod.linhThach'
  | 'prod.linhThao'
  | 'prod.linhKhoang'
  | 'storage'
  | 'build'
  | 'train'
  | 'march'
  | 'heal'
  | 'brew'
  | 'hospital'
  | 'loot'
  | 'exp'
  | 'trib'
  | 'atk'
  | 'def'
  | 'hp'
  | `atk.${UnitType}`
  | `hp.${UnitType}`
  | 'skill'
  | 'forge'

// ---------- Ngũ hành ----------

// Kim khắc Mộc, Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim. Chỉ trưởng lão và nội dung từ tầng 15 có hành:
// địch không hành (mọi trận P1) thì hệ số là 1, kết quả trận cũ giữ nguyên từng số.
export const ELEMENTS = ['kim', 'moc', 'thuy', 'hoa', 'tho'] as const
export type Element = (typeof ELEMENTS)[number]
export const OVERCOMES: Record<Element, Element> = { kim: 'moc', moc: 'tho', tho: 'thuy', thuy: 'hoa', hoa: 'kim' }
export const EL_ADV = 1.1
export const EL_DISADV = 0.92

// burst: đánh thêm v × tổng công (của hệ type nếu có) · shield: lượt đó bớt v sát thương nhận
// heal: hồi sinh v phần đệ tử đã ngã · weaken: địch bớt v công trong 2 lượt
export type Skill = { kind: 'burst' | 'shield' | 'heal' | 'weaken'; v: number; type?: UnitType }
export type ElderDef = { type: UnitType; el: Element; skill: Skill; passives: { at: number; key: Bonus; v: number }[] }

// Bị động chỉ có tác dụng với đội do chính trưởng lão đó dẫn. Không trưởng lão, pháp bảo, thiên phú nào dùng khoá
// 'march' (hành quân là của cả tông môn, người dẫn đổi giữa đường không được).
const elders = {
  thanhPhong: {
    type: 'kiem',
    el: 'moc',
    skill: { kind: 'burst', v: 1.2, type: 'kiem' },
    passives: [
      { at: 5, key: 'atk.kiem', v: 0.1 },
      { at: 12, key: 'atk', v: 0.06 },
    ],
  },
  thachKien: {
    type: 'the',
    el: 'tho',
    skill: { kind: 'shield', v: 0.5 },
    passives: [
      { at: 5, key: 'hp.the', v: 0.12 },
      { at: 12, key: 'def', v: 0.1 },
    ],
  },
  nhuYen: {
    type: 'phap',
    el: 'hoa',
    skill: { kind: 'burst', v: 1.4, type: 'phap' },
    passives: [
      { at: 5, key: 'atk.phap', v: 0.1 },
      { at: 12, key: 'exp', v: 0.2 },
    ],
  },
  loiChan: {
    type: 'kiem',
    el: 'kim',
    skill: { kind: 'burst', v: 0.9 },
    passives: [
      { at: 5, key: 'atk.kiem', v: 0.12 },
      { at: 12, key: 'trib', v: 0.12 },
    ],
  },
  vanHac: {
    type: 'phap',
    el: 'moc',
    skill: { kind: 'heal', v: 0.25 },
    passives: [
      { at: 5, key: 'hp', v: 0.06 },
      { at: 12, key: 'loot', v: 0.2 },
    ],
  },
  hanBang: {
    type: 'the',
    el: 'thuy',
    skill: { kind: 'weaken', v: 0.35 },
    passives: [
      { at: 5, key: 'def', v: 0.1 },
      { at: 12, key: 'atk', v: 0.08 },
    ],
  },
  // Từ tầng 15: bí cảnh 4–5, Thông Thiên Tháp tầng 30 và 45, sự kiện tuần (mốc 5), yêu vương trung tâm giới
  bachVoNhai: {
    type: 'kiem',
    el: 'kim',
    skill: { kind: 'burst', v: 1.7, type: 'kiem' },
    passives: [
      { at: 5, key: 'atk.kiem', v: 0.12 },
      { at: 12, key: 'atk', v: 0.08 },
    ],
  },
  macSau: {
    type: 'phap',
    el: 'tho',
    skill: { kind: 'weaken', v: 0.4 },
    passives: [
      { at: 5, key: 'atk.phap', v: 0.12 },
      { at: 12, key: 'hp', v: 0.06 },
    ],
  },
  hoacThienCuong: {
    type: 'the',
    el: 'hoa',
    skill: { kind: 'shield', v: 0.55 },
    passives: [
      { at: 5, key: 'hp.the', v: 0.14 },
      { at: 12, key: 'atk', v: 0.06 },
    ],
  },
  toMiNuong: {
    type: 'phap',
    el: 'thuy',
    skill: { kind: 'heal', v: 0.3 },
    passives: [
      { at: 5, key: 'hp', v: 0.06 },
      { at: 12, key: 'loot', v: 0.25 },
    ],
  },
  diepCoThanh: {
    type: 'kiem',
    el: 'moc',
    skill: { kind: 'burst', v: 1.1 },
    passives: [
      { at: 5, key: 'atk.kiem', v: 0.15 },
      { at: 12, key: 'exp', v: 0.2 },
    ],
  },
  huyenMinh: {
    type: 'the',
    el: 'thuy',
    skill: { kind: 'weaken', v: 0.45 },
    passives: [
      { at: 5, key: 'def', v: 0.12 },
      { at: 12, key: 'trib', v: 0.15 },
    ],
  },
} satisfies Record<string, ElderDef>
export type ElderId = keyof typeof elders
export const ELDERS: Record<ElderId, ElderDef> = elders
export const FIRST_ELDER: ElderId = 'thanhPhong'

// Thiên phú: mỗi 5 cấp trưởng lão một điểm, chia vào 3 nhánh (công · thể · đạo), mỗi nhánh tối đa TALENT_MAX.
// Tẩy Tủy Đan trả lại hết điểm. Nhánh đạo tăng sức công pháp chủ động.
export const TALENT_EVERY = 5
export const TALENT_MAX = 5
export const TALENTS: { key: Bonus; v: number }[] = [
  { key: 'atk', v: 0.03 },
  { key: 'hp', v: 0.04 },
  { key: 'skill', v: 0.06 },
]

// ---------- Tàng Kinh Các ----------

export const TECH_ROWS = [1, 3, 6, 9, 12, 16, 21] // tầng Tàng Kinh Các mở từng hàng
export const TECH_COST_GROWTH = 1.7
export const TECH_TIME_GROWTH = 1.8
export type TechDef = { row: number; max: number; key: Bonus; v: number; cost: Bag; time: number }
const R0 = b(100, 150, 150),
  R1 = b(400, 500, 400),
  R2 = b(1200, 1500, 1200),
  R3 = b(3000, 3500, 3000),
  R4 = b(7000, 8000, 7000)
const R5 = b(15000, 17000, 15000),
  R6 = b(32000, 36000, 32000)
const techs = {
  tuLinh: { row: 0, max: 5, key: 'prod.linhThach', v: 0.06, cost: R0, time: 90 },
  duongThao: { row: 0, max: 5, key: 'prod.linhThao', v: 0.06, cost: R0, time: 90 },
  khaiSon: { row: 0, max: 5, key: 'prod.linhKhoang', v: 0.06, cost: R0, time: 90 },
  kiemTam: { row: 0, max: 5, key: 'atk.kiem', v: 0.05, cost: R0, time: 90 },
  phapTam: { row: 1, max: 5, key: 'atk.phap', v: 0.05, cost: R1, time: 300 },
  kimCuong: { row: 1, max: 5, key: 'hp.the', v: 0.06, cost: R1, time: 300 },
  loBan: { row: 1, max: 5, key: 'build', v: 0.04, cost: R1, time: 300 },
  thanHanh: { row: 1, max: 5, key: 'march', v: 0.08, cost: R1, time: 300 },
  canKhon: { row: 2, max: 5, key: 'storage', v: 0.1, cost: R2, time: 900 },
  luyenBinh: { row: 2, max: 5, key: 'train', v: 0.06, cost: R2, time: 900 },
  hoiXuan: { row: 2, max: 5, key: 'heal', v: 0.08, cost: R2, time: 900 },
  tranCo: { row: 2, max: 5, key: 'def', v: 0.05, cost: R2, time: 900 },
  danDao: { row: 3, max: 3, key: 'brew', v: 0.1, cost: R3, time: 2400 },
  tuBao: { row: 3, max: 5, key: 'loot', v: 0.08, cost: R3, time: 2400 },
  linhMach: { row: 3, max: 5, key: 'prod', v: 0.04, cost: R3, time: 2400 },
  truongSinh: { row: 3, max: 5, key: 'hp', v: 0.04, cost: R3, time: 2400 },
  vanKiem: { row: 4, max: 5, key: 'atk', v: 0.04, cost: R4, time: 5400 },
  hoMach: { row: 4, max: 3, key: 'hospital', v: 0.15, cost: R4, time: 5400 },
  thienDien: { row: 4, max: 5, key: 'exp', v: 0.1, cost: R4, time: 5400 },
  doKiepTam: { row: 4, max: 5, key: 'trib', v: 0.06, cost: R4, time: 5400 },
  thietQuyen: { row: 5, max: 5, key: 'atk.the', v: 0.05, cost: R5, time: 9000 },
  kiemThe: { row: 5, max: 5, key: 'hp.kiem', v: 0.06, cost: R5, time: 9000 },
  phapThan: { row: 5, max: 5, key: 'hp.phap', v: 0.06, cost: R5, time: 9000 },
  luyenKhi: { row: 5, max: 5, key: 'forge', v: 0.08, cost: R5, time: 9000 },
  thaiAt: { row: 6, max: 5, key: 'prod', v: 0.05, cost: R6, time: 14400 },
  thienMa: { row: 6, max: 5, key: 'atk', v: 0.04, cost: R6, time: 14400 },
  hoSon: { row: 6, max: 5, key: 'def', v: 0.05, cost: R6, time: 14400 },
  bachChien: { row: 6, max: 5, key: 'exp', v: 0.1, cost: R6, time: 14400 },
} satisfies Record<string, TechDef>
export type TechId = keyof typeof techs
export const TECHS: Record<TechId, TechDef> = techs
// Bonus giảm thời gian/chi phí thì trừ đi, nhưng không bao giờ quá mức này
export const MAX_CUT = 0.6

// ---------- Đan phòng ----------

// Luyện lâu hơn thời gian đan tiết kiệm được: đan là tiện lợi, không phải cỗ máy tăng tốc (luyện liên tục 2 phút/viên
// từng biến hàng đợi xây nhanh gấp 8). Đan chủ yếu đến từ nhiệm vụ, bí cảnh, tông môn.
// need: đan khác làm nguyên liệu (mỗi viên), trừ lúc bắt đầu luyện
export type PillDef = { unlock: number; cost: Bag; time: number; need?: Partial<Record<string, number>> }
const pills = {
  tuKhi: { unlock: 1, cost: b(300, 600, 150), time: 1200 }, // bớt 15 phút một việc đang chờ
  boiNguyen: { unlock: 3, cost: b(600, 1500, 600), time: 1800 }, // +kinh nghiệm cho trưởng lão
  doKiep: { unlock: 5, cost: b(1500, 3000, 1500), time: 900 }, // lôi kiếp yếu đi khi độ kiếp
  hoiXuan: { unlock: 8, cost: b(2000, 5000, 2000), time: 1800 }, // chữa ngay CURE thương binh
  ngungThan: { unlock: 12, cost: b(6000, 8000, 4000), time: 3600 }, // công cả tông môn +FOCUS trong FOCUS_TIME
  daiTuKhi: { unlock: 14, cost: b(4000, 6000, 3000), time: 3600, need: { tuKhi: 6 } }, // bớt 2 giờ một việc
  phaCanh: { unlock: 15, cost: b(12000, 20000, 12000), time: 3600, need: { doKiep: 2 } }, // lôi kiếp yếu hơn Độ Kiếp Đan
  taiTuy: { unlock: 16, cost: b(20000, 20000, 20000), time: 7200 }, // trả lại mọi điểm thiên phú của một trưởng lão
} satisfies Record<string, PillDef>
export type PillId = keyof typeof pills
export const PILLS: Record<PillId, PillDef> = pills
export const BREW_MAX = 5
export const SPEEDUP = 15 * 60_000
export const SPEEDUP_BIG = 2 * 3_600_000
export const BOI_NGUYEN_EXP = 400
export const DO_KIEP = 0.3
export const PHA_CANH = 0.45
export const CURE = 300
export const FOCUS = 0.1
export const FOCUS_TIME = 2 * 3_600_000

// ---------- Luyện Khí Phòng ----------

// Pháp bảo tất định: không rơi đồ, không nguyên liệu, không may rủi — chỉ tài nguyên và thời gian. Mỗi trưởng lão đeo một món,
// bonus chỉ cho đội người đó dẫn. Cấp tối đa theo tầng Luyện Khí Phòng: ⌈tầng / 2⌉, trần GEAR_MAX.
export const GEAR_MAX = 10
export const GEAR_COST_GROWTH = 1.45
export const GEAR_TIME_GROWTH = 1.3
export type GearDef = { key: Bonus; v: number; cost: Bag; time: number } // v: bonus mỗi cấp
const G0 = b(2000, 1500, 3000),
  G1 = b(1500, 3000, 2000),
  G2 = b(3000, 2000, 1500)
const gear = {
  thanhSuong: { key: 'atk.kiem', v: 0.03, cost: G0, time: 1800 }, // kiếm
  xichViem: { key: 'atk.phap', v: 0.03, cost: G2, time: 1800 }, // quạt
  kimCang: { key: 'hp.the', v: 0.035, cost: G1, time: 1800 }, // vòng tay
  huyenVu: { key: 'def', v: 0.03, cost: G1, time: 2400 }, // giáp mai rùa
  hoTam: { key: 'hp', v: 0.02, cost: G1, time: 2400 }, // kính hộ tâm
  thienLoi: { key: 'atk', v: 0.02, cost: G0, time: 2400 }, // chuỳ
  tuBao: { key: 'loot', v: 0.05, cost: G2, time: 1800 }, // bồn tụ bảo
  ngocGian: { key: 'exp', v: 0.05, cost: G2, time: 1800 }, // ngọc giản
  tiLoi: { key: 'trib', v: 0.03, cost: G0, time: 2400 }, // châu tị lôi
} satisfies Record<string, GearDef>
export type GearId = keyof typeof gear
export const GEAR: Record<GearId, GearDef> = gear

// ---------- Bản đồ ----------

// Toạ độ trên bản đồ vùng 400 × 1000; tông môn ở dưới cùng. Khoảng cách → thời gian hành quân.
export const HOME = { x: 200, y: 930 }
export const MARCH_SPEED = 0.5 // giây mỗi đơn vị bản đồ
export const MARCH_MIN = 20 // giây
export const MARCH_SLOTS = [1, 2, 3, 4, 5] // số đội xuất quân cùng lúc ở Luyện Khí / Trúc Cơ / Kim Đan / Nguyên Anh / Hóa Thần

// ---------- Vật phẩm (túi đồ) ----------

// Phù, nang, ngọc giản: không luyện được, chỉ đến từ nhiệm vụ, sự kiện, rương, thương nhân (như túi đồ của RoK).
// Mỗi loại một cách dùng: speed — bớt thời gian một việc đang chờ (job trống = việc nào cũng được) · res — gói tài nguyên ·
// buff — tăng ích có hạn (dùng thêm thì kéo dài, không cộng dồn sức) · shield — khiên hộ sơn · exp — kinh nghiệm trưởng lão
export type SpeedJob = 'build' | 'train' | 'study' | 'heal'
export type BagDef =
  | { use: 'speed'; job?: SpeedJob; min: number }
  | { use: 'res'; res: Res; n: number }
  | { use: 'buff'; key: Bonus; v: number; hours: number }
  | { use: 'shield'; hours: number }
  | { use: 'exp'; n: number }
  | { use: 'key' } // thiếp Chiêu Hiền Đài: mở ở Chiêu Hiền Đài, không dùng thẳng từ túi
  | { use: 'builder'; hours: number } // thuê tạp dịch thứ hai (xây song song hai công trình)
const SPEED_MIN = [5, 15, 60, 180, 480, 1440] as const // mệnh giá phù tăng tốc (phút)
const PACK_N = [1000, 5000, 20_000, 100_000] as const // mệnh giá nang tài nguyên
const speeds = <P extends string>(prefix: P, job?: SpeedJob) =>
  Object.fromEntries(SPEED_MIN.map(min => [`${prefix}${min}`, { use: 'speed', min, ...(job && { job }) }])) as Record<
    `${P}${(typeof SPEED_MIN)[number]}`,
    BagDef
  >
const packs = <P extends string>(prefix: P, res: Res) =>
  Object.fromEntries(PACK_N.map(n => [`${prefix}${n / 1000}k`, { use: 'res', res, n }])) as Record<
    `${P}${1 | 5 | 20 | 100}k`,
    BagDef
  >
const bag = {
  ...speeds('thoiQuang'), // Thời Quang Phù — việc nào cũng được
  ...speeds('loBan', 'build'), // Lỗ Ban Phù — xây
  ...speeds('luyenBinh', 'train'), // Luyện Binh Phù — tuyển đệ tử
  ...speeds('ngoDao', 'study'), // Ngộ Đạo Phù — nghiên cứu công pháp
  ...speeds('dieuThu', 'heal'), // Diệu Thủ Phù — chữa thương
  ...packs('thachNang', 'linhThach'),
  ...packs('thaoNang', 'linhThao'),
  ...packs('khoangNang', 'linhKhoang'),
  tuLinh8: { use: 'buff', key: 'prod', v: 0.5, hours: 8 }, // Tụ Linh Phù: sản lượng +50 %
  tuLinh24: { use: 'buff', key: 'prod', v: 0.5, hours: 24 },
  thanHanh: { use: 'buff', key: 'march', v: 0.25, hours: 8 }, // Thần Hành Phù: hành quân nhanh 25 %
  chienY: { use: 'buff', key: 'atk', v: 0.1, hours: 8 }, // Chiến Ý Phù: công +10 %
  kimCuong: { use: 'buff', key: 'def', v: 0.1, hours: 8 }, // Kim Cương Phù: thủ +10 %
  hoThe: { use: 'buff', key: 'hp', v: 0.1, hours: 8 }, // Hộ Thể Phù: sinh lực +10 %
  hoSon8: { use: 'shield', hours: 8 }, // Hộ Sơn Phù: khiên không bị cướp
  hoSon24: { use: 'shield', hours: 24 },
  hoSon72: { use: 'shield', hours: 72 },
  kinhThu500: { use: 'exp', n: 500 }, // Tâm Đắc Kinh Thư: kinh nghiệm trưởng lão
  kinhThu2k: { use: 'exp', n: 2000 },
  kinhThu8k: { use: 'exp', n: 8000 },
  nganDuyen: { use: 'key' }, // Ngân Duyên Phù: một lần mở thiếp bạc ở Chiêu Hiền Đài
  kimDuyen: { use: 'key' }, // Kim Duyên Phù: một lần mở thiếp vàng
  tapDich48: { use: 'builder', hours: 48 }, // Tạp Dịch Lệnh: thuê tạp dịch thứ hai 48 giờ (dùng thêm thì kéo dài)
} satisfies Record<string, BagDef>
export type BagId = keyof typeof bag
export const BAG: Record<BagId, BagDef> = bag
// Họ vật phẩm = id bỏ mệnh giá cuối (thoiQuang60 → thoiQuang): một tên, một hình cho mọi mệnh giá
export const BAG_FAMILIES = [
  'thoiQuang',
  'loBan',
  'luyenBinh',
  'ngoDao',
  'dieuThu',
  'tuLinh',
  'thanHanh',
  'chienY',
  'kimCuong',
  'hoThe',
  'hoSon',
  'thachNang',
  'thaoNang',
  'khoangNang',
  'kinhThu',
  'nganDuyen',
  'kimDuyen',
  'tapDich',
] as const
export type BagFamily = (typeof BAG_FAMILIES)[number]
export type ItemId = PillId | BagId
export const BAG_USE_MAX = 999 // một lần dùng tối đa bấy nhiêu cái

// hallRes: thêm chừng ấy × tầng Chủ điện mỗi loại tài nguyên (quà hằng ngày không mất giá khi tông môn lớn lên)
export type Reward = {
  res?: Partial<Bag>
  items?: Partial<Record<ItemId, number>>
  elder?: ElderId
  exp?: number
  hallRes?: number
}

// Yêu thú cấp 1–15 (chỉ số = cấp − 1). Hạ cấp n mới đánh được cấp n + 1. Hạ xong thì hang trống một lúc rồi có con mới.
export const BEASTS: { type: UnitType; x: number; y: number }[] = [
  { type: 'kiem', x: 118, y: 846 },
  { type: 'phap', x: 292, y: 818 },
  { type: 'the', x: 74, y: 748 },
  { type: 'phap', x: 330, y: 716 },
  { type: 'kiem', x: 196, y: 676 },
  { type: 'the', x: 56, y: 604 },
  { type: 'kiem', x: 300, y: 590 },
  { type: 'phap', x: 164, y: 524 },
  { type: 'the', x: 338, y: 462 },
  { type: 'phap', x: 66, y: 424 },
  { type: 'kiem', x: 236, y: 392 },
  { type: 'the', x: 118, y: 302 },
  { type: 'kiem', x: 316, y: 272 },
  { type: 'phap', x: 198, y: 196 },
  { type: 'the', x: 84, y: 118 },
]
export const BEAST_STR = [15, 1.4] // sức mạnh cấp n = 15 × 1.4^(n−1), tính bằng số đệ tử bậc 1
export const BEAST_LOOT = [80, 1.42] // mỗi loại tài nguyên
export const WILD_RESPAWN = 20 * 60_000 // yêu thú giới hạ xong thì con mới xuất hiện sau chừng này
// Hành lực (Action Points của RoK): mỗi lần xuất quân săn yêu thú giới tốn AP_HUNT, hồi 1 mỗi AP_EVERY, tích tối đa AP_MAX
export const AP_MAX = 100
export const AP_EVERY = 3 * 60_000
export const AP_HUNT = 10
export const WILD_LOOT = 2 // yêu thú giới: chiến lợi phẩm gấp mấy yêu thú cùng cấp ở bản đồ vùng (phải đi xa, tranh với người khác)
export const BEAST_EXP = [15, 1.3]
export const BEAST_COOLDOWN = 45 * 60_000
export const MAIN_SHARE = 0.7 // hệ chính chiếm 70%, còn lại là hệ bọc hậu (hệ mà hệ chính khắc)

export type SectDef = {
  hall: number
  x: number
  y: number
  type: UnitType
  str: number
  elder: { skill: Skill; level: number }
  first: Reward // lần đầu hạ
  loot: number // mỗi lần sau: mỗi loại tài nguyên
  exp: number
}
export const SECTS: SectDef[] = [
  {
    hall: 3,
    x: 330,
    y: 890,
    type: 'the',
    str: 45,
    elder: { skill: { kind: 'shield', v: 0.3 }, level: 2 },
    first: { res: b(600, 600, 600), items: { tuKhi: 2 }, elder: 'thachKien' },
    loot: 250,
    exp: 60,
  },
  {
    hall: 6,
    x: 40,
    y: 520,
    type: 'kiem',
    str: 180,
    elder: { skill: { kind: 'burst', v: 1.2 }, level: 8 },
    first: { res: b(2500, 2500, 2500), items: { boiNguyen: 2 } },
    loot: 900,
    exp: 200,
  },
  {
    hall: 8,
    x: 360,
    y: 370,
    type: 'phap',
    str: 380,
    elder: { skill: { kind: 'weaken', v: 0.3 }, level: 12 },
    first: { res: b(4000, 4000, 4000), items: { doKiep: 1 }, elder: 'loiChan' },
    loot: 1800,
    exp: 400,
  },
  {
    hall: 11,
    x: 40,
    y: 220,
    type: 'kiem',
    str: 800,
    elder: { skill: { kind: 'burst', v: 1.6 }, level: 16 },
    first: { res: b(8000, 8000, 8000), items: { boiNguyen: 3 } },
    loot: 4000,
    exp: 800,
  },
  {
    hall: 13,
    x: 300,
    y: 110,
    type: 'the',
    str: 1500,
    elder: { skill: { kind: 'heal', v: 0.3 }, level: 20 },
    first: { res: b(15000, 15000, 15000), items: { tuKhi: 10 } },
    loot: 7000,
    exp: 1400,
  },
]
export const SECT_COOLDOWN = 8 * 3_600_000
export const SECT_SHARE = 0.5 // hệ chính 50%, hai hệ còn lại mỗi hệ 25%

// Bí cảnh: đánh ngay không cần hành quân, mỗi tầng một lần.
export type RealmDef = {
  hall: number
  x: number
  y: number
  type: UnitType
  tier: Tier
  el?: Element
  floors: { str: number; reward: Reward }[]
}
export const REALMS: RealmDef[] = [
  {
    hall: 3,
    x: 250,
    y: 752,
    type: 'phap',
    tier: 1,
    floors: [
      { str: 25, reward: { res: b(300, 300, 300), items: { tuKhi: 1 }, exp: 40 } },
      { str: 40, reward: { res: b(500, 500, 500), exp: 60 } },
      { str: 60, reward: { items: { tuKhi: 2 }, exp: 80 } },
      { str: 85, reward: { res: b(800, 800, 800), exp: 100 } },
      { str: 120, reward: { items: { boiNguyen: 1 }, elder: 'nhuYen', exp: 150 } },
    ],
  },
  {
    hall: 7,
    x: 104,
    y: 470,
    type: 'kiem',
    tier: 2,
    floors: [
      { str: 200, reward: { res: b(2000, 2000, 2000), exp: 200 } },
      { str: 260, reward: { items: { tuKhi: 3 }, exp: 240 } },
      { str: 330, reward: { res: b(3000, 3000, 3000), exp: 280 } },
      { str: 420, reward: { items: { boiNguyen: 2 }, exp: 320 } },
      { str: 520, reward: { items: { doKiep: 1 }, elder: 'vanHac', exp: 400 } },
    ],
  },
  {
    hall: 11,
    x: 280,
    y: 180,
    type: 'the',
    tier: 3,
    floors: [
      { str: 700, reward: { res: b(6000, 6000, 6000), exp: 500 } },
      { str: 900, reward: { items: { tuKhi: 5 }, exp: 600 } },
      { str: 1150, reward: { res: b(9000, 9000, 9000), exp: 700 } },
      { str: 1450, reward: { items: { boiNguyen: 3 }, exp: 800 } },
      { str: 1800, reward: { res: b(15000, 15000, 15000), elder: 'hanBang', exp: 1000 } },
    ],
  },
  {
    hall: 16,
    x: 196,
    y: 298,
    type: 'kiem',
    tier: 4,
    el: 'moc',
    floors: [
      { str: 6000, reward: { res: b(40000, 40000, 40000), exp: 1500 } },
      { str: 7500, reward: { items: { daiTuKhi: 1, hoiXuan: 2 }, exp: 1800 } },
      { str: 9500, reward: { res: b(60000, 60000, 60000), exp: 2100 } },
      { str: 12000, reward: { items: { taiTuy: 1, phaCanh: 1 }, exp: 2400 } },
      { str: 15000, reward: { res: b(90000, 90000, 90000), elder: 'bachVoNhai', exp: 3000 } },
    ],
  },
  {
    hall: 21,
    x: 300,
    y: 30,
    type: 'phap',
    tier: 5,
    el: 'thuy',
    floors: [
      { str: 20000, reward: { res: b(150000, 150000, 150000), exp: 4000 } },
      { str: 25000, reward: { items: { daiTuKhi: 2, ngungThan: 2 }, exp: 4600 } },
      { str: 31000, reward: { res: b(220000, 220000, 220000), exp: 5200 } },
      { str: 38000, reward: { items: { taiTuy: 1, phaCanh: 2 }, exp: 5800 } },
      { str: 46000, reward: { res: b(320000, 320000, 320000), elder: 'hoacThienCuong', exp: 7000 } },
    ],
  },
]

// ---------- Độ kiếp ----------

// Chủ điện tầng 5 → 6 (Trúc Cơ), 10 → 11 (Kim Đan), 15 → 16 (Nguyên Anh), 20 → 21 (Hóa Thần) không xây được mà phải
// vượt 3 đợt lôi kiếp. Đệ tử sống sót đi tiếp sang đợt sau. Thành công thì lên tầng ngay; thất bại chỉ phải chờ rồi thử lại.
// Từ Nguyên Anh lôi kiếp có ngũ hành: trưởng lão hành khắc đợt nào thì đợt đó nhẹ đi.
export const TRIBS: { hall: number; tier: Tier; waves: { type: UnitType; str: number; el?: Element }[] }[] = [
  {
    hall: 5,
    tier: 1,
    waves: [
      { type: 'kiem', str: 80 },
      { type: 'phap', str: 100 },
      { type: 'the', str: 120 },
    ],
  },
  {
    hall: 10,
    tier: 2,
    waves: [
      { type: 'kiem', str: 250 },
      { type: 'phap', str: 320 },
      { type: 'the', str: 400 },
    ],
  },
  {
    hall: 15,
    tier: 3,
    waves: [
      { type: 'kiem', str: 3000, el: 'hoa' },
      { type: 'phap', str: 3600, el: 'thuy' },
      { type: 'the', str: 4200, el: 'kim' },
    ],
  },
  {
    hall: 20,
    tier: 4,
    waves: [
      { type: 'kiem', str: 9000, el: 'moc' },
      { type: 'phap', str: 10500, el: 'hoa' },
      { type: 'the', str: 12000, el: 'tho' },
    ],
  },
]
export const TRIB_COOLDOWN = 10 * 60_000
export const TRIB_EXP = [300, 1500, 4000, 9000]
// Độ kiếp công khai (tông môn đã có chỗ trên bản đồ giới): kiếp vân tụ trên núi TRIB_CLOUD rồi mới giáng — đội độ kiếp đứng dưới
// kiếp vân (không giữ nhà). Lúc giáng: mỗi đội đồng minh đóng ở nhà (hộ pháp) làm lôi kiếp nhẹ HO_PHAP, mỗi lần bị cướp trúng trong
// lúc tụ (phá kiếp) làm nặng PHA_KIEP; mỗi loại tính tối đa TRIB_AID lần. Thất bại hoàn chi phí. Hộ pháp nhận HO_PHAP_EXP kinh nghiệm.
export const TRIB_CLOUD = [5, 8, 10, 12].map(m => m * 60_000)
export const HO_PHAP = 0.06
export const PHA_KIEP = 0.08
export const TRIB_AID = 3
export const HO_PHAP_EXP = 0.25

// ---------- Mùa giải (SEASON_DAYS, PHASES ở atlas.ts) ----------
// Điểm mùa theo phe (tiên minh; người đi một mình là một phe): mỗi giờ giữ linh mạch cấp 1/2/3, trận nhãn, Thiên Môn;
// hạ yêu vương cấp 2/3 thì chia theo sát thương. Người mới vào giới tới ngày JOIN_DAYS.
// Hết mùa: minh đứng đầu (người từ tầng ASCEND_HALL) và ai tới tầng cao nhất được phi thăng (+ASCEND luân hồi, danh hiệu); còn lại +1
export const SEASON_VEIN = [1, 2, 4]
export const SEASON_GATE = 3
export const SEASON_HEAVEN = 12
export const SEASON_BOSS = [0, 0, 60, 200]
export const JOIN_DAYS = 21
export const ASCEND_HALL = 16
export const ASCEND = 2

// ---------- Chợ (giữa người chơi trong một giới; server có cờ bật/tắt) ----------
// Chỉ lệnh bán, trả bằng linh thạch; hàng (linh thảo, linh khoáng, đan) ký gửi ngay. Giá cả lô trong MARKET_BAND × giá gốc
// (tài nguyên 1; đan = tài nguyên để luyện, cộng cả đan làm nguyên liệu) nên không dồn được của qua acc phụ; thuế MARKET_TAX đốt đi.
// Mỗi người: MARKET_ORDERS lệnh treo, MARKET_BUYS lần mua / ngày, treo bán tối đa MARKET_CAP × sức chứa kho (theo giá) / ngày;
// lệnh sống MARKET_TTL rồi trả hàng qua thư. Không có hàng premium để bán (PLAN §9).
export const MARKET_HALL = 10
export const MARKET_TAX = 0.1
export const MARKET_BAND = [0.8, 1.25] as const
export const MARKET_ORDERS = 5
export const MARKET_BUYS = 5
export const MARKET_CAP = 0.5
export const MARKET_TTL = 24 * 3_600_000

// Vận Linh Trận (Resource Assistance ở Trading Post của RoK): từ Chủ điện SUPPLY_HALL gửi linh thạch / thảo / khoáng cho người
// cùng tiên minh, người nhận nhận qua thư. Hao tổn supplyTax (35 % ở Tàng Bảo Các tầng 1 → 8 % ở tầng 25) đốt đi; mỗi ngày gửi
// tối đa SUPPLY_SEND × sức chứa kho mình (trước hao tổn), mỗi người nhận tối đa SUPPLY_GET × sức chứa kho họ (sau hao tổn) —
// dồn của qua acc phụ không đáng (MARKET=off tắt cả chợ lẫn Vận Linh Trận).
export const SUPPLY_HALL = 10
export const SUPPLY_SEND = 2
export const SUPPLY_GET = 1
export const supplyTax = (vault: number) => Math.max(0.08, 0.36 - 0.0112 * vault)

// ---------- Nhiệm vụ ngày ----------

// Làm mới lúc 0h giờ Việt Nam (UTC+7), cố định như giờ máy chủ — không theo múi giờ máy người chơi (chỉnh giờ máy
// không làm mới được). Mở khi Chủ điện tầng 3 (lúc đã có Đan phòng và bản đồ để làm đủ 4 việc).
export const DAY_OFFSET = 7 * 3_600_000
export const DAILY_HALL = 3
export type DailyId = 'build' | 'train' | 'win' | 'brew'
export const DAILY: { id: DailyId; n: number }[] = [
  { id: 'build', n: 2 }, // bắt đầu 2 lần xây/nâng
  { id: 'train', n: 50 }, // tuyển 50 đệ tử
  { id: 'win', n: 3 }, // thắng 3 trận
  { id: 'brew', n: 1 }, // luyện 1 mẻ đan
]
export const DAILY_RES = 150 // mỗi việc: DAILY_RES × tầng Chủ điện, mỗi loại tài nguyên
export const DAILY_BONUS: Partial<Record<PillId, number>> = { tuKhi: 1, boiNguyen: 1 } // rương khi xong cả 4

// ---------- Sự kiện cuối tuần ----------

// Thứ Bảy, Chủ nhật (giờ VN): chiến lợi phẩm đánh lại (yêu thú, tông môn đã hạ) và kinh nghiệm trưởng lão ×WEEKEND.
// Thưởng lần đầu (bí cảnh, tháp, tông môn lần đầu) giữ nguyên — sự kiện không làm rẻ nội dung một lần.
export const WEEKEND = 1.5

// ---------- Thương hội (Tàng Bảo Các) ----------

// Đổi tài nguyên dư lấy tài nguyên thiếu: mỗi hệ đệ tử ăn chủ yếu một loại, nên kho hay lệch — một loại cạn, hai loại đầy.
// Giữ lại TRADE_KEEP (tăng TRADE_STEP mỗi tầng Tàng Bảo Các, tối đa TRADE_KEEP_MAX): đủ cứu kho lệch, đắt hơn xây công trình tài nguyên.
export const TRADE_KEEP = 0.6
export const TRADE_STEP = 0.01
export const TRADE_KEEP_MAX = 0.75

// ---------- Thông Thiên Tháp ----------

// Tháp thử thách không giới hạn tầng, mở ở Chủ điện tầng 10: việc để làm sau khi dọn bản đồ, ngoài luân hồi.
// Đánh ngay (không hành quân), thua mất quân như bí cảnh. Mỗi tầng địch mạnh hơn TOWER_GROW và đổi hệ chính theo vòng
// (một đội hình không ăn hết — phải đổi hệ khắc). Thưởng chỉ lần đầu qua mỗi tầng; kỷ lục giữ qua luân hồi.
export const TOWER = { hall: 10, x: 192, y: 104 }
export const TOWER_STR = 800 // tầng 1, tính bằng số đệ tử bậc 1
export const TOWER_GROW = 1.1
export const TOWER_RES = 1500 // thưởng tầng 1, mỗi loại tài nguyên
export const TOWER_RES_GROW = 1.06
export const TOWER_ELDERS: Partial<Record<number, ElderId>> = { 30: 'macSau', 45: 'diepCoThanh' } // qua tầng n lần đầu: thu nhận
// Tĩnh tọa ngộ đạo (rương ngày Expedition của RoK): mỗi ngày một rương theo tầng tháp đã qua — mỗi TOWER_CHEST_STEP tầng thêm
// một phần (nang, kinh thư, phù tăng tốc); chưa qua tầng nào thì chưa có
export const TOWER_CHEST_STEP = 5
export const towerChest = (floors: number): Reward => {
  const k = Math.floor(floors / TOWER_CHEST_STEP) + 1
  return {
    items: {
      thachNang1k: k,
      thaoNang1k: k,
      khoangNang1k: k,
      kinhThu500: Math.ceil(k / 2),
      thoiQuang15: Math.min(4, Math.ceil(k / 3)),
    },
  }
}

// Nhiệm vụ tuần: đếm cùng lúc với nhiệm vụ ngày, cộng số hôm đã mở rương ngày. Làm mới 0h thứ Hai giờ VN.
// Lý do có: nhiệm vụ ngày kéo người chơi vào mỗi hôm, nhiệm vụ tuần cho lý do giữ nhịp cả tuần (đúng chỉ số D7 của cổng P1).
export type WeeklyId = DailyId | 'days'
export const WEEKLY: { id: WeeklyId; n: number }[] = [
  { id: 'build', n: 12 },
  { id: 'train', n: 400 },
  { id: 'win', n: 15 },
  { id: 'brew', n: 5 },
  { id: 'days', n: 5 }, // mở rương ngày 5 hôm trong tuần
]
export const WEEKLY_RES = 500 // mỗi việc: WEEKLY_RES × tầng Chủ điện, mỗi loại tài nguyên
export const WEEKLY_BONUS: Partial<Record<PillId, number>> = { tuKhi: 3, boiNguyen: 2, doKiep: 1 } // rương khi xong cả 5

// ---------- Luân hồi ----------

// Chủ điện tầng REBIRTH_HALL trở lên: luân hồi tự nguyện. Giữ trưởng lão, công pháp, đan dược; mất công trình, tài nguyên, đệ tử, bản đồ.
// Mỗi lần luân hồi: sản lượng +20%, xây nhanh hơn 10%, và "căn cơ": kiếp sau khởi đầu với mọi công trình cao hơn 2 tầng
// (tối đa tầng 5 — vẫn phải tự độ kiếp Trúc Cơ). Căn cơ mới là thưởng chính: nhịp game bị giới hạn bởi số lần phải xây
// (một tạp dịch, vài phiên mỗi ngày) chứ không bởi thời gian mỗi lần xây — bot đo: chỉ bớt thời gian xây thì kiếp sau
// nhanh hơn chưa tới 15%.
export const REBIRTH_PROD = 0.2
export const REBIRTH_BUILD = 0.1
export const REBIRTH_HEAD = 2
export const REBIRTH_HEAD_MAX = 5
export const REBIRTH_MAX = 5 // sản lượng/tốc độ xây từ luân hồi chỉ tính tới lần thứ 5

// ---------- PvP (cướp tông môn khác trong giới) ----------

// Mở ở tầng PVP_HALL. Chỉ đánh được người có lực chiến ≥ PVP_FLOOR × mình (báo thù thì bỏ giới hạn) — không bắt nạt người yếu.
// Kho bảo hộ PROTECT; cướp RAID_SHARE phần vượt, mỗi đệ tử còn đứng mang về tối đa CARRY × sức bậc. Thủ thua được khiên SHIELD_TIME;
// đi đánh người khác thì mất khiên. Người mới có khiên NEWBIE_SHIELD. Bị đánh thì được báo thù trong REVENGE_TIME.
// Chữa thương đắt (40 % chi phí tuyển) nên đánh người đang giữ nhà là lỗ — PvP là cướp người vắng, đúng ý đồ.
export const PVP_HALL = 6
export const PVP_FLOOR = 0.5
export const PROTECT = 0.45
export const RAID_SHARE = 0.3
export const CARRY = 40
export const SHIELD_TIME = 8 * 3_600_000
export const NEWBIE_SHIELD = 72 * 3_600_000
export const REVENGE_TIME = 24 * 3_600_000
export const FRENZY_TIME = 30 * 60_000 // cơn sát khí: vừa xuất quân cướp thì chừng ấy chưa dùng được Hộ Sơn Phù (War Frenzy)
export const FOES_MAX = 5
export const PVP_START = 1000 // điểm kiểu Elo
export const ELO_K = 32
export const MATCH_POOL = 10 // ghép cặp: MATCH_PICK người ngẫu nhiên trong MATCH_POOL người gần lực chiến nhất
export const MATCH_PICK = 3

// ---------- Luận Kiếm Minh Chiến (bước đầu của Ark of Osiris: minh đấu minh bất đồng bộ) ----------
// Mỗi tuần, 20h thứ Bảy giờ VN (WAR_DAY: 0 = thứ Hai), các tiên minh đã ghi danh ghép cặp theo điểm minh chiến (Elo, khởi đầu
// PVP_START); hai minh xếp người theo lực chiến, người thứ k đấu người thứ k bằng đội hình Luận Kiếm Đài (không mất gì). Thắng
// nhiều cặp hơn thì thắng (hoà: minh ít điểm minh chiến hơn thắng). Cần ≥ WAR_MIN người tầng ≥ PVP_HALL; mỗi minh tối đa WAR_MAX
// cặp. Quà qua thư cho người trong hai minh.
export const WAR_DAY = 5
export const WAR_HOUR = 20
export const WAR_MIN = 3
export const WAR_MAX = 20
export const WAR_WIN: Reward = { items: { thoiQuang60: 2, kimDuyen: 1, kinhThu2k: 1 } }
export const WAR_LOSE: Reward = { items: { thoiQuang60: 1, nganDuyen: 1 } }
// Ma Triều Công Sơn (Shadow Legion của RoK): tiên minh ghi danh cả tuần; thứ Tư (LEGION_DAY) từ LEGION_HOUR giờ VN,
// LEGION_WAVES đợt cách nhau LEGION_GAP đánh vào tông môn từng người trong minh. Sức mỗi đợt = LEGION_POW[k] × lực phòng thủ
// của chính người đó (viện binh đồng minh không làm địch mạnh thêm — kéo viện binh về giữ nhà là cách qua đợt khó). Giữ được
// đợt k: LEGION_PTS[k] điểm cho mình và cho minh; quân mất chỉ bị thương (vào Đan phòng, không tử trận). Hết đợt cuối: quà theo
// điểm mỗi người (LEGION_GIFTS, mốc cao nhất đạt được), ba minh điểm cao nhất thêm LEGION_TOP.
export const LEGION_DAY = 2
export const LEGION_HOUR = 20
export const LEGION_GAP = 5 * 60_000
export const LEGION_POW = [0.5, 0.7, 0.9, 1.1, 1.35]
export const LEGION_WAVES = LEGION_POW.length
export const LEGION_PTS = [1, 2, 3, 4, 5]
export const LEGION_GIFTS: { pts: number; reward: Reward }[] = [
  { pts: 3, reward: { items: { thoiQuang60: 1, dieuThu60: 1 } } },
  { pts: 6, reward: { items: { thoiQuang180: 1, dieuThu60: 2, hoiXuan: 1 } } },
  { pts: 10, reward: { items: { thoiQuang180: 2, hoiXuan: 2, kimDuyen: 1 } } },
  { pts: 15, reward: { items: { thoiQuang480: 1, hoiXuan: 3, kimDuyen: 1, kinhThu8k: 1 } } },
]
export const LEGION_TOP: Reward[] = [
  { items: { kimDuyen: 2, daiTuKhi: 2 } },
  { items: { kimDuyen: 1, daiTuKhi: 1 } },
  { items: { nganDuyen: 2, tuKhi: 3 } },
]
// Phá Yêu Trại (King of the Tribes của RoK): thứ Ba – thứ Tư (TRIBE_DAY, TRIBE_LEN ngày) hạ yêu vương / yêu trại được điểm cho
// tiên minh — TRIBE_PTS theo cấp, chia theo sát thương từng người góp. Hết khung: top TRIBE_TOP.length minh, mọi người trong
// minh nhận thư quà theo hạng
export const TRIBE_DAY = 1
export const TRIBE_LEN = 2
export const TRIBE_PTS = [0, 20, 60, 150]
export const TRIBE_TOP: Reward[] = [
  { items: { kimDuyen: 1, thoiQuang180: 2, kinhThu8k: 1 } },
  { items: { nganDuyen: 2, thoiQuang180: 1, kinhThu2k: 2 } },
  { items: { nganDuyen: 1, thoiQuang60: 2, kinhThu2k: 1 } },
]

// ---------- Công Huân (Honor của KvK) ----------
// Điểm cá nhân trong mùa: hạ đệ tử địch (chiến công / HONOR_KP, cả khi thủ), săn yêu thú giới (HONOR_WILD × cấp), đánh yêu
// vương (sát thương / HONOR_BOSS), khai mỏ (tài nguyên / HONOR_GATHER), đánh trận kỳ (độ bền phá / HONOR_RAZE), giữ núi một đợt
// ma triều (HONOR_LEGION). Mốc HONOR_TIERS nhận quà ngay trong mùa (Chinh Chiến Công Tích); hết mùa top HONOR_RANKS nhận thư
// quà theo hạng (1 · 2–3 · 4–10), rồi mọi người về 0.
export const HONOR_KP = 100
export const HONOR_WILD = 2
export const HONOR_BOSS = 200
export const HONOR_GATHER = 1000
export const HONOR_RAZE = 1000
export const HONOR_LEGION = 10
// Cổ Di Tích mở RUIN_OPEN mỗi RUIN_EVERY, Huyết Tế Đàn ALTAR_OPEN mỗi ALTAR_EVERY (chu kỳ lẻ giờ: giờ mở trôi dần, múi giờ nào
// cũng tới lượt). Chỉ chiếm được lúc mở; phe giữ lúc đóng cửa: điểm mùa theo giờ đã giữ + mỗi người đang đóng quân HONOR_RUIN /
// HONOR_ALTAR Công Huân mỗi phút đã giữ; rồi quân về, điểm trống.
export const RUIN_EVERY = 39 * 3_600_000
export const RUIN_OPEN = 3_600_000
export const ALTAR_EVERY = 84 * 3_600_000
export const ALTAR_OPEN = 2 * 3_600_000
export const SEASON_RUIN = 120
export const SEASON_ALTAR = 180
export const HONOR_RUIN = 2
export const HONOR_ALTAR = 4
export const HONOR_TIERS: { n: number; reward: Reward }[] = [
  { n: 50, reward: { items: { thoiQuang60: 2, thachNang5k: 1 } } },
  { n: 150, reward: { items: { thoiQuang180: 1, hoiXuan: 1 } } },
  { n: 400, reward: { items: { thoiQuang180: 2, nganDuyen: 1 } } },
  { n: 1000, reward: { items: { thoiQuang480: 1, kimDuyen: 1 } } },
  { n: 2500, reward: { items: { thoiQuang480: 2, kimDuyen: 1, kinhThu8k: 1 } } },
  { n: 6000, reward: { items: { kimDuyen: 2, daiTuKhi: 2, tapDich48: 1 } } },
]
export const HONOR_RANKS = 10
const HONOR_TOP: Reward[] = [
  { items: { kimDuyen: 3, daiTuKhi: 3 } },
  { items: { kimDuyen: 2, daiTuKhi: 2 } },
  { items: { kimDuyen: 1, daiTuKhi: 1 } },
]
export const honorPrize = (rank: number) => HONOR_TOP[rank === 0 ? 0 : rank < 3 ? 1 : 2] // rank tính từ 0

// ---------- Luận Võ Liên Hoàn (Arms Training của RoK) ----------
// Mỗi ngày một phiên từ Chủ điện DRILL_HALL: một đội (trưởng lão + đệ tử đang ở nhà — đội ảo, không mất quân thật) đấu liên tiếp
// giáo đầu Diễn võ trường. Trận đầu giáo đầu bằng DRILL_BASE lực chiến đội lúc vào phiên, mỗi trận thắng mạnh thêm DRILL_GROW;
// quân không hồi giữa các trận. Cứ DRILL_EVERY trận thắng tự chọn 1 trong 3 công pháp cho giáo đầu (DRILL_MODS, cộng dồn) —
// chọn cái ít hại đội mình nhất. Mốc thắng DRILL_GIFTS nhận quà ngay; thua là hết phiên hôm nay.
export const DRILL_HALL = 6
export const DRILL_BASE = 0.12
export const DRILL_GROW = 1.06
export const DRILL_EVERY = 3
export const DRILL_MODS = {
  cuong: { atk: 0.15 }, // Cuồng Chiến: công +15 %
  giap: { def: 0.15 }, // Kim Giáp: thủ +15 %
  the: { hp: 0.2 }, // Long Thể: sinh lực +20 %
  dong: { n: 0.15 }, // Đông Đảo: quân số +15 %
  khac: {}, // Khắc Chế: hệ chính của giáo đầu thành hệ khắc hệ chính đội mình
} satisfies Record<string, Partial<Record<'atk' | 'def' | 'hp' | 'n', number>>>
export type DrillMod = keyof typeof DRILL_MODS
export const DRILL_GIFTS: { n: number; reward: Reward }[] = [
  { n: 3, reward: { items: { thoiQuang15: 2, kinhThu500: 1 } } },
  { n: 6, reward: { items: { thoiQuang60: 1, kinhThu2k: 1 } } },
  { n: 9, reward: { items: { thoiQuang60: 2, nganDuyen: 1 } } },
  { n: 12, reward: { items: { thoiQuang180: 1, kinhThu8k: 1 } } },
  { n: 15, reward: { items: { thoiQuang480: 1, kimDuyen: 1 } } },
]

// ---------- Thương nhân vân du (Mysterious Merchant của RoK) ----------
// Mỗi MERCHANT_EVERY một lượt hàng mới: MERCHANT_SLOTS món rút từ MERCHANT_POOL (tất định theo tông môn và lượt), giá bằng
// một loại tài nguyên = price × tầng Chủ điện, mỗi món mua một lần. Ở Tàng Bảo Các (Thương hội) từ tầng MERCHANT_HALL.
export const PINS_MAX = 20 // chỗ ghi nhớ trên bản đồ giới
export const MERCHANT_EVERY = 8 * 3_600_000
export const MERCHANT_SLOTS = 6
export const MERCHANT_HALL = 4
export const MERCHANT_POOL: { item: BagId; n: number; res: Res; price: number; w: number }[] = [
  { item: 'thoiQuang15', n: 2, res: 'linhThach', price: 400, w: 10 },
  { item: 'thoiQuang60', n: 1, res: 'linhKhoang', price: 800, w: 8 },
  { item: 'loBan60', n: 1, res: 'linhThao', price: 700, w: 8 },
  { item: 'luyenBinh60', n: 1, res: 'linhThach', price: 600, w: 6 },
  { item: 'ngoDao60', n: 1, res: 'linhThao', price: 700, w: 6 },
  { item: 'dieuThu60', n: 1, res: 'linhKhoang', price: 500, w: 5 },
  { item: 'kinhThu2k', n: 1, res: 'linhKhoang', price: 500, w: 8 },
  { item: 'nganDuyen', n: 1, res: 'linhThach', price: 900, w: 5 },
  { item: 'tuLinh8', n: 1, res: 'linhThao', price: 800, w: 5 },
  { item: 'thanHanh', n: 1, res: 'linhKhoang', price: 600, w: 4 },
  { item: 'chienY', n: 1, res: 'linhThach', price: 700, w: 3 },
  { item: 'hoSon8', n: 1, res: 'linhThach', price: 1500, w: 3 },
]

// ---------- Thiên Đạo Biên Niên (Monument của RoK) ----------
// Mục tiêu chung của cả giới theo chương, hạn chót là ngày thứ `day` của mùa (khớp lịch mở cổng). Chương xong trước hạn: mọi
// tông môn nhận quà qua thư, biên niên ghi lại; quá hạn thì chương hụt, sang chương sau. Chỉ tính tông môn người chơi thật.
export type BookGoal =
  | 'hall5'
  | 'hall8'
  | 'allies5'
  | 'explore'
  | 'gates'
  | 'veins'
  | 'flags'
  | 'hall15'
  | 'bosses'
  | 'kp'
  | 'hall20'
  | 'heaven'
export const BOOK: { m: BookGoal; n: number; day: number; reward: Reward }[] = [
  { m: 'hall5', n: 15, day: 1, reward: { items: { thoiQuang15: 2, thachNang1k: 2 } } },
  { m: 'hall8', n: 10, day: 3, reward: { items: { thoiQuang60: 1, thachNang5k: 1 } } },
  { m: 'allies5', n: 3, day: 6, reward: { items: { thoiQuang60: 1, nganDuyen: 1 } } },
  { m: 'explore', n: 1500, day: 8, reward: { items: { thanHanh: 1, kinhThu500: 2 } } }, // ô mê vụ đã khai (cộng cả giới)
  { m: 'gates', n: 6, day: 11, reward: { items: { thoiQuang60: 2, dieuThu60: 1 } } },
  { m: 'veins', n: 20, day: 14, reward: { items: { thoiQuang180: 1, kinhThu2k: 1 } } },
  { m: 'flags', n: 10, day: 17, reward: { items: { thoiQuang180: 1, tuLinh24: 1 } } },
  { m: 'hall15', n: 10, day: 21, reward: { items: { thoiQuang180: 1, kimDuyen: 1 } } },
  { m: 'bosses', n: 15, day: 30, reward: { items: { thoiQuang480: 1, kinhThu8k: 1 } } },
  { m: 'kp', n: 200_000, day: 34, reward: { items: { chienY: 1, kimCuong: 1, hoThe: 1 } } }, // chiến công cả giới
  { m: 'hall20', n: 5, day: 38, reward: { items: { thoiQuang480: 1, daiTuKhi: 2 } } },
  { m: 'heaven', n: 1, day: 42, reward: { items: { thoiQuang480: 1, kimDuyen: 2 } } },
]

// ---------- Giới Chủ và sắc phong (King / Kingdom Titles của RoK) ----------
// Giới Chủ: minh chủ tiên minh giữ Thiên Môn; chưa minh nào giữ thì minh chủ tiên minh đứng đầu điểm mùa. Giới Chủ sắc phong
// tước cho người trong giới: 4 phúc, 4 hoạ; mỗi tước một người, mỗi người một tước, giữ TITLE_TIME; phong lại một tước phải
// chờ TITLE_COOL kể từ lần phong trước.
export const TITLES = {
  chienThan: { good: true, fx: { atk: 0.05, march: 0.1 } }, // Chiến Thần
  hoQuoc: { good: true, fx: { def: 0.05, train: 0.1 } }, // Hộ Quốc Công
  thanCong: { good: true, fx: { build: 0.1 } }, // Thần Công
  bachThao: { good: true, fx: { prod: 0.1 } }, // Bách Thảo Tiên
  phanDo: { good: false, fx: { atk: -0.03, def: -0.03 } }, // Phản Đồ
  khatCai: { good: false, fx: { prod: -0.1 } }, // Khất Cái
  giaiDai: { good: false, fx: { march: -0.05, train: -0.05 } }, // Giải Đãi
  siNhan: { good: false, fx: { build: -0.05 } }, // Si Nhân
} as const satisfies Record<string, { good: boolean; fx: Partial<Record<Bonus, number>> }>
export type TitleId = keyof typeof TITLES
export const TITLE_IDS = Object.keys(TITLES) as TitleId[]
export const TITLE_TIME = 24 * 3_600_000
export const TITLE_COOL = 10 * 60_000
// Giới Chủ ban phúc (King's Buff): mỗi ngày một lần, một tăng ích cho mọi tông môn trong giới trong BLESS_TIME.
// Thiên Ân lễ (King's Gifts): mỗi tuần GIFT_WEEK phần quà Giới Chủ tự tay ban cho người chơi (thư).
export const BLESSINGS = { build: 0.05, train: 0.05, prod: 0.05, march: 0.08 } as const satisfies Partial<
  Record<Bonus, number>
>
export type BlessKey = keyof typeof BLESSINGS
export const BLESS_TIME = 8 * 3_600_000
export const GIFT_WEEK = 3
export const THIEN_AN: Reward = { items: { thoiQuang180: 1, kimDuyen: 1, kinhThu8k: 1 } }

// ---------- Luận Kiếm Đài (Sunset Canyon của RoK, bất đồng bộ) ----------
// Đội hình thủ: tối đa bằng số đội xuất quân, mỗi đội một trưởng lão + một hệ đệ tử ảo bậc ARENA_TIER, số lượng ARENA_BASE +
// ARENA_STEP × cấp trưởng lão. Chỉ tính sức của trưởng lão (cấp, bị động, pháp bảo, thiên phú, sao) — không tính công pháp tông
// môn, phù, Hương Hỏa, luân hồi. Trận xa luân: đội thắng đi tiếp với quân còn lại. Không mất quân, không mất tài nguyên.
// ARENA_TRIES lượt mỗi ngày; điểm Elo (PVP_START, ELO_K), sang tuần nén về giữa; thư quà hạng tuần; rương ngày theo bậc điểm.
export const ARENA_TIER: Tier = 3
export const ARENA_BASE = 150
export const ARENA_STEP = 15
export const ARENA_TRIES = 5
export const ARENA_LOG = 10 // nhật ký đài giữ chừng này dòng
export const ARENA_BANDS = [0, 1050, 1200, 1400] // điểm tối thiểu của bậc Đồng · Bạc · Vàng · Ngọc
export const ARENA_CHEST: Reward[] = [
  { items: { thoiQuang5: 2, kinhThu500: 1 } },
  { items: { thoiQuang15: 1, kinhThu500: 2 } },
  { items: { thoiQuang15: 2, kinhThu2k: 1 } },
  { items: { thoiQuang60: 1, kinhThu2k: 1, nganDuyen: 1 } },
]
// Kiếm Ý: mỗi trận luận kiếm (thắng / thua), rương ngày theo bậc; tiêu ở Luận Kiếm Thương Điếm (mỗi món có hạn mỗi tuần)
export const KY_WIN = 20
export const KY_LOSE = 8
// Phục thù Luận Kiếm: mỗi ngày một lần đánh lại người vừa thắng mình lúc mình giữ đài (trong ngày), không tốn lượt; thắng thêm
// KY_REVENGE Kiếm Ý
export const KY_REVENGE = 15
export const KY_CHEST = [10, 20, 30, 40]
export const KY_SHOP: { item: ItemId; n: number; price: number; week: number }[] = [
  { item: 'kinhThu2k', n: 1, price: 60, week: 5 },
  { item: 'thoiQuang60', n: 1, price: 80, week: 5 },
  { item: 'nganDuyen', n: 1, price: 100, week: 3 },
  { item: 'chienY', n: 1, price: 120, week: 2 },
  { item: 'kinhThu8k', n: 1, price: 250, week: 1 },
  { item: 'kimDuyen', n: 1, price: 400, week: 1 },
]
export const ARENA_TOP = 10 // thư quà hạng tuần: hạng 1 · 2–3 · 4–10
export const ARENA_PRIZES: Reward[] = [
  { items: { kimDuyen: 2, thoiQuang180: 1, kinhThu8k: 1 } },
  { items: { kimDuyen: 1, thoiQuang60: 2, kinhThu2k: 2 } },
  { items: { nganDuyen: 2, thoiQuang60: 1 } },
]
export const PVP_GATE = { x: 200, y: -60 } // tới P3 (bản đồ giới): đội đi cướp rời vùng qua mép trên bản đồ
export const GUARD_STEP = 0.04 // Hộ Sơn Đại Trận: thủ và máu bên thủ mỗi tầng
// Tỉ lệ thắng ước lượng coi là chắc thắng: giao diện báo "áp đảo"; bot và NPC chỉ đánh từ mức này
export const SURE_WIN = 0.8
export const CHAT_HALL = 3 // kênh giới mở từ tầng Chủ điện này

// Phân đà NPC: tà phái giữ vùng ngoài (server điều khiển, rules/bot.ts), NPC_PER mỗi vùng, chơi một lượt mỗi NPC_EVERY
// như người chơi thường. Lúc lập: Chủ điện NPC_HALL, trưởng lão cấp NPC_ELDER, NPC_TROOPS đệ tử bậc 2 mỗi hệ, NPC_RES mỗi loại.
export const NPC_PER = 2
export const NPC_EVERY = 4 * 3_600_000
export const NPC_HALL = 7
export const NPC_ELDER = 10
export const NPC_TROOPS = 120
export const NPC_RES = 20_000

// ---------- Tiên minh ----------

// Lập từ tầng ALLY_HALL, tốn ALLY_COST mỗi loại. Tối đa ALLY_MAX người, 3 chức vị (thành viên · trưởng lão · minh chủ).
// Giúp đỡ: mỗi việc nhờ được giúp tối đa ALLY_HELPS lần, mỗi lần bớt max(HELP_MIN, HELP_SHARE × thời gian việc).
export const ALLY_HALL = 10
export const ALLY_COST = 20_000
export const ALLY_MAX = 30
export const ALLY_ELDERS = 4 // số trưởng lão tối đa
export const ALLY_HELPS = 10
// Lần đầu vào (hay lập) một tiên minh: lễ nhập minh qua thư (như 200 gem lần đầu vào liên minh của RoK)
export const ALLY_WELCOME: Reward = { items: { thoiQuang60: 2, kimDuyen: 1, thachNang5k: 1 } }
export const HELP_MIN = 60_000
export const HELP_SHARE = 0.01

// Hộ Minh Đại Trận (Alliance Technology của RoK): mỗi trận một tăng ích cho mọi người trong minh, 5 tầng; tầng n cần
// ALLY_TECH_PTS[n − 1] điểm trận (cộng dồn). helps: thêm lượt giúp mỗi việc · seats: thêm chỗ trong minh.
export const ALLY_TECHS = {
  tuLinh: { key: 'prod', v: 0.02 },
  loBan: { key: 'build', v: 0.02 },
  luyenBinh: { key: 'train', v: 0.03 },
  hoiXuan: { key: 'heal', v: 0.04 },
  thanHanh: { key: 'march', v: 0.03 },
  satPhat: { key: 'atk', v: 0.01 },
  kimCuong: { key: 'def', v: 0.01 },
  dongTam: { key: 'helps', v: 1 },
  quangNap: { key: 'seats', v: 2 },
} as const satisfies Record<string, { key: Bonus | 'helps' | 'seats'; v: number }>
export type AllyTechId = keyof typeof ALLY_TECHS
export const ALLY_TECH_IDS = Object.keys(ALLY_TECHS) as AllyTechId[]
export const ALLY_TECH_PTS = [400, 1200, 2800, 5600, 10_000]
// Cung phụng (Donation): mỗi lượt tốn DONATE_COST × (tầng trận + 1) một loại tài nguyên, được DONATE_PTS điểm trận, chừng ấy
// cống hiến cho người góp và vào Minh khố (trận minh chủ điểm: ×DONATE_STAR). Lượt tích tới DONATE_MAX, hồi 1 mỗi DONATE_EVERY.
export const DONATE_COST = 600
export const DONATE_PTS = 10
export const DONATE_STAR = 2
export const DONATE_MAX = 20
export const DONATE_EVERY = 30 * 60_000
// Cống hiến từ giúp đỡ: HELP_CREDIT mỗi lượt giúp, tối đa HELP_CREDIT_DAY mỗi ngày (như individual credits của RoK)
export const HELP_CREDIT = 5
export const HELP_CREDIT_DAY = 250
// Cống Hiến Các (Alliance Shop): trưởng lão / minh chủ nhập hàng bằng Minh khố (stock mỗi món), người trong minh mua bằng
// cống hiến (price mỗi món). Không bán gì liên quan tiền thật.
export const ALLY_SHOP: Partial<Record<ItemId, { price: number; stock: number }>> = {
  thoiQuang60: { price: 500, stock: 250 },
  loBan60: { price: 400, stock: 200 },
  ngoDao60: { price: 400, stock: 200 },
  luyenBinh60: { price: 350, stock: 175 },
  hoSon8: { price: 800, stock: 400 },
  hoSon24: { price: 2000, stock: 1000 },
  tuLinh8: { price: 400, stock: 200 },
  nganDuyen: { price: 600, stock: 300 },
  kinhThu2k: { price: 300, stock: 150 },
  thachNang5k: { price: 150, stock: 75 },
  thaoNang5k: { price: 150, stock: 75 },
  khoangNang5k: { price: 150, stock: 75 },
}
export const ALLY_SHOP_MAX = 99 // tồn tối đa mỗi món
export const ALLY_MARKS = 5 // dấu trên bản đồ giới đặt cho cả minh (Alliance Markers), từ R3
export const ALLY_MAIL_COOL = 3_600_000 // thư minh (R4 / minh chủ gửi tới hộp thư cả minh): mỗi minh một thư mỗi giờ
export const ALLY_MAIL_LEN = 300
export const ALLY_IDLE = 7 // minh chủ không vào game chừng này ngày: đường chủ (R4) nhận minh chủ được
// Chức vị đường chủ (officer titles của RoK): minh chủ phong cho người R4, mỗi chức một người, mỗi người một chức; tăng ích cho
// chính người giữ (hết R4 thì mất hiệu lực)
export const OFFICES = {
  chapPhap: { key: 'atk', v: 0.05 }, // Chấp Pháp (Warlord): công +5 %
  ngoaiSu: { key: 'march', v: 0.1 }, // Ngoại Sự (Diplomat): hành quân +10 %
  tongQuan: { key: 'prod', v: 0.05 }, // Tổng Quản (Steward): sản lượng +5 %
  congTuong: { key: 'build', v: 0.05 }, // Công Tượng (Butler): xây nhanh 5 %
} satisfies Record<string, { key: Bonus; v: number }>
export type OfficeId = keyof typeof OFFICES
export const OFFICE_IDS = Object.keys(OFFICES) as OfficeId[]
export const GROUP_MAX = 20 // nhóm chat tự tạo: tối đa người mỗi nhóm
export const GROUPS_PER = 5 // mỗi người ở tối đa chừng này nhóm
// Vân Du Khách (Visitors của RoK): mỗi GUEST_EVERY một tán tu ghé núi mang quà nhỏ (xoay vòng GUEST_GIFTS), chạm để nhận;
// không dồn — tới giờ thì khách đứng chờ tới khi nhận
export const GUEST_HALL = 2
export const GUEST_EVERY = 3 * 3_600_000
export const GUEST_GIFTS: Reward[] = [
  { items: { thoiQuang15: 1 } },
  { items: { thachNang1k: 2 } },
  { items: { kinhThu500: 1 } },
  { items: { thaoNang1k: 2 } },
  { items: { loBan15: 1, luyenBinh15: 1 } },
  { items: { khoangNang1k: 2 } },
  { items: { thoiQuang60: 1 } },
  { items: { nganDuyen: 1 } },
]
// Quà gắn email (tài khoản không mất khi đổi máy): một lần, server gửi qua thư ngay khi gắn
export const LINK_GIFT: Reward = { items: { kimDuyen: 1, thoiQuang60: 2, hoSon8: 1 } }
// Minh lễ (Alliance Gifts): người trong minh hạ yêu vương → cả minh nhận quà qua thư, minh được GIFT_PTS điểm quà theo cấp
// yêu vương; điểm quà nâng cấp quà (ALLY_GIFT_LV: điểm để lên cấp 1..5), cấp càng cao quà càng hậu.
export const GIFT_PTS: Partial<Record<number, number>> = { 1: 50, 2: 150, 3: 400 }
export const ALLY_GIFT_LV = [0, 400, 1200, 3000, 6000]
export const ALLY_GIFTS: Reward[] = [
  { items: { thoiQuang5: 2, thachNang1k: 1 } },
  { items: { thoiQuang15: 1, thachNang1k: 1, thaoNang1k: 1 } },
  { items: { thoiQuang15: 2, kinhThu500: 1, khoangNang5k: 1 } },
  { items: { thoiQuang60: 1, kinhThu2k: 1, thachNang5k: 1 } },
  { items: { thoiQuang60: 1, nganDuyen: 1, kinhThu2k: 1 } },
]
// Minh vụ đường (Alliance Mobilization): bảng việc chung của tiên minh, làm mới mỗi tuần. MOB_SLOTS việc trên bảng, mỗi người
// nhận một việc một lúc (tối đa MOB_TAKES lượt mỗi ngày), làm xong trong MOB_TIME thì minh được điểm việc đó (việc mới thế
// chỗ). Đủ mốc MOB_GOALS thì ai đã góp ≥ MOB_MIN điểm nhận quà mốc. Việc đo bằng chỉ số tăng thêm từ lúc nhận (như Nhật Khóa).
export const MOB_POOL: { m: Metric; n: number; pts: number }[] = [
  { m: 'build', n: 2, pts: 30 },
  { m: 'train', n: 100, pts: 20 },
  { m: 'heal', n: 50, pts: 15 },
  { m: 'brew', n: 2, pts: 15 },
  { m: 'tech', n: 1, pts: 30 },
  { m: 'win', n: 5, pts: 20 },
  { m: 'hunt', n: 3, pts: 25 },
  { m: 'speed', n: 120, pts: 25 },
  { m: 'gather', n: 20_000, pts: 30 },
  { m: 'draw', n: 1, pts: 10 },
  { m: 'raid', n: 1, pts: 35 },
  { m: 'realm', n: 1, pts: 25 },
  { m: 'ally', n: 5, pts: 15 },
]
export const MOB_SLOTS = 8
export const MOB_TAKES = 10
export const MOB_TIME = 4 * 3_600_000
export const MOB_MIN = 20
export const MOB_GOALS = [200, 600, 1200, 2000, 3200]
// Hạng Minh vụ cả giới khi hết tuần (như giải đấu của Mobilization): 3 minh điểm cao nhất, người đã góp ≥ MOB_MIN nhận thư
export const MOB_PRIZES: Reward[] = [
  { items: { thoiQuang480: 1, kimDuyen: 2 } },
  { items: { thoiQuang180: 1, kimDuyen: 1 } },
  { items: { thoiQuang180: 1, nganDuyen: 2 } },
]
export const MOB_REWARDS: Reward[] = [
  { items: { thoiQuang15: 1, thachNang5k: 1 } },
  { items: { thoiQuang60: 1, thaoNang5k: 1, khoangNang5k: 1 } },
  { items: { thoiQuang60: 1, nganDuyen: 1, kinhThu2k: 1 } },
  { items: { thoiQuang180: 1, kimDuyen: 1 } },
  { items: { thoiQuang180: 1, kimDuyen: 1, hoSon24: 1 } },
]

// ---------- Điểm trên bản đồ giới ----------

// Chiếm (linh mạch, trận nhãn, Thiên Môn): đội tới nơi thì đóng quân; điểm thuộc phe có quân đóng. Tối đa GARRISON_MAX đội mỗi điểm.
// Linh mạch cho cả tiên minh (hoặc người giữ một mình) sản lượng +VEIN_BUFF theo cấp, cộng dồn tới VEIN_CAP.
export const GARRISON_MAX = 6
export const VEIN_BUFF = [0.03, 0.05, 0.08] // theo cấp điểm 1..3 (vòng ngoài, giữa, tâm)
export const VEIN_CAP = 0.3
// Chiếm lần đầu trong mùa (first-capture của Lost Kingdom): linh mạch / trận nhãn / Thiên Môn lần đầu có tiên minh giữ thì mọi người
// trong minh nhận quà qua thư (mỗi điểm một lần mỗi mùa), theo cấp điểm 1..3
export const FIRST_TAKE: Partial<Record<'vein' | 'gate' | 'heaven', Reward[]>> = {
  vein: [
    { items: { thoiQuang15: 2, thachNang5k: 1 } },
    { items: { thoiQuang60: 1, kinhThu2k: 1 } },
    { items: { thoiQuang180: 1, kinhThu8k: 1 } },
  ],
  gate: [
    { items: { thoiQuang60: 1, nganDuyen: 1 } },
    { items: { thoiQuang60: 2, kinhThu2k: 1 } },
    { items: { thoiQuang180: 1, kimDuyen: 1 } },
  ],
  heaven: [{}, {}, { items: { kimDuyen: 2, thoiQuang480: 1 } }],
}
// Mỏ: trữ MINE_STOCK, khai MINE_RATE mỗi giờ (một loại tài nguyên theo mỏ), cạn thì hồi đầy sau MINE_RESPAWN
export const MINE_STOCK = [20_000, 40_000, 40_000]
export const MINE_RATE = [3_000, 5_000, 5_000]
export const MINE_RESPAWN = 2 * 3_600_000
// Yêu vương: kho máu chung (tính bằng số đệ tử bậc 1), mỗi đội đánh một "lát" SLICE = str / slices — đội nhỏ đánh một mình thì thua,
// cả minh kết trận thì hạ được (Lanchester). Chết thì thưởng chia theo sát thương, hồi sau respawn.
export const BOSSES: Partial<
  Record<number, { str: number; tier: Tier; slices: number; respawn: number; reward: Reward }>
> = {
  // yêu trại vòng ngoài: nhỏ, hồi nhanh — việc kết trận hằng ngày của minh mới (ba bốn người là hạ được)
  1: {
    str: 12_000,
    tier: 3,
    slices: 3,
    respawn: 8 * 3_600_000,
    reward: { res: b(60_000, 60_000, 60_000), items: { tuKhi: 3, thoiQuang15: 1 } },
  },
  2: {
    str: 60_000,
    tier: 4,
    slices: 5,
    respawn: 24 * 3_600_000,
    reward: { res: b(300_000, 300_000, 300_000), items: { daiTuKhi: 6, phaCanh: 3 } },
  },
  3: {
    str: 150_000,
    tier: 5,
    slices: 8,
    respawn: 72 * 3_600_000,
    reward: { res: b(800_000, 800_000, 800_000), items: { daiTuKhi: 15, taiTuy: 5 }, elder: 'huyenMinh' },
  },
}
// Lãnh thổ tiên minh (Alliance Territory của RoK): ô thuộc minh có mốc gần nhất trong bán kính — tông môn người trong minh
// (TERR_SEAT ô) và linh mạch / cổng / Thiên Môn minh đang giữ (TERR_POINT ô). Khai mỏ trong lãnh thổ minh mình +TERR_GATHER;
// dời tông môn vào lãnh thổ minh (vùng ngoài), mọi đội ở nhà, MOVE_COOL một lần.
export const TERR_SEAT = 3
export const TERR_POINT = 5
export const TERR_GATHER = 0.25
export const TERR_FUND = 0.1 // kho minh: mỗi ô lãnh thổ sinh chừng này Minh khố mỗi giờ (chốt mỗi giờ)
export const MOVE_COOL = 24 * 3_600_000
// Mê vụ (Fog of War của RoK): mỗi tông môn một bản đồ sương riêng, ô sương FOG_CELL × FOG_CELL ô bản đồ; lúc đầu đã khai
// FOG_HOME ô sương quanh tông môn. Linh điểu (Scout): 1 + 1 mỗi CRANE_PER tầng Chủ điện (tối đa CRANE_MAX), thả vào ô sương
// kề vùng đã khai, bay CRANE_TIME mỗi ô sương, tới nơi tan mê vụ 3 × 3 ô sương quanh đó rồi bay về.
export const FOG_CELL = 5
export const FOG_HOME = 2
export const CRANE_PER = 8
export const CRANE_MAX = 3
export const CRANE_TIME = 60_000
// Thôn trang (Tribal Village) / động phủ cổ tu (Mysterious Cave): lộ ra khi tan mê vụ, mỗi nơi mỗi người ghé một lần.
// Quà theo vòng của vùng (ngoài, giữa, tâm)
// (tài nguyên là nang: nằm trong túi, không bị cướp — như mọi quà mới, xem sim tranh đoạt)
export const VILLAGE_GIFTS: Reward[] = [
  { items: { thachNang1k: 3, thaoNang1k: 3, khoangNang1k: 3, kinhThu500: 1 } },
  { items: { thachNang5k: 2, thaoNang5k: 2, khoangNang5k: 2, kinhThu2k: 1 } },
  { items: { thachNang20k: 1, thaoNang20k: 1, khoangNang20k: 1, kinhThu8k: 1 } },
]
export const CAVE_GIFTS: Reward[] = [
  { items: { thoiQuang60: 1, tuKhi: 2 } },
  { items: { thoiQuang180: 1, daiTuKhi: 1, nganDuyen: 1 } },
  { items: { thoiQuang480: 1, daiTuKhi: 2, kimDuyen: 1 } },
]
// Dời núi tân thủ (Beginner's Teleport): trước Chủ điện tầng NEWBIE_MOVE_HALL, lần dời đầu tiên được tới mọi ô trống vùng ngoài
export const NEWBIE_MOVE_HALL = 8
// Trận kỳ (Alliance Flag của RoK): trưởng lão / minh chủ cắm trong lãnh thổ minh mình, tốn FLAG_COST Minh khố; dựng xong sau
// FLAG_BUILD thì nới lãnh thổ bán kính FLAG_R. Mỗi minh tối đa FLAG_BASE + 1 mỗi FLAG_PER người (trần FLAG_MAX); cách điểm,
// tông môn, trận kỳ khác từ FLAG_GAP ô.
export const FLAG_R = 4
export const FLAG_COST = 1000
export const FLAG_BUILD = 3_600_000
export const FLAG_BASE = 2
export const FLAG_PER = 5
export const FLAG_MAX = 10
export const FLAG_GAP = 2
// Phá trận kỳ: đội minh khác tới cờ, trừ độ bền bằng lực chiến đội đánh (đầy: FLAG_HP); không bị đánh FLAG_REPAIR thì liền lại
export const FLAG_HP = 30_000
export const FLAG_REPAIR = 12 * 3_600_000
export const FLAG_GUARD_MAX = 3 // đội đóng quân giữ mỗi trận kỳ: lực chiến của họ chặn bớt sức phá
// Linh triều: mỗi TIDE_EVERY một vùng có triều trong TIDE_LEN: sản lượng +TIDE_PROD cho tông môn trong vùng, khai mỏ +TIDE_MINE
export const TIDE_EVERY = 8 * 3_600_000
export const TIDE_LEN = 2 * 3_600_000
export const TIDE_PROD = 0.15
export const TIDE_MINE = 0.5
// Kết trận: tối đa RALLY_MAX đội, chờ RALLY_WAIT rồi cùng tới đích. Viện binh: tối đa REINFORCE_MAX đội đóng ở nhà đồng minh.
export const RALLY_MAX = 8
export const RALLY_WAIT = [5 * 60_000, 10 * 60_000, 30 * 60_000]
export const REINFORCE_MAX = 3

// ---------- Thư ----------

export const MAIL_MAX = 30

// ---------- Sự kiện tuần ----------

// Mỗi tuần một chủ đề (theo số tuần), cộng điểm khi làm việc đó; đủ mốc thì nhận quà, top EVENT_TOP của giới nhận thư lúc hết tuần.
export const EVENTS = ['win', 'train', 'brew', 'build', 'raid', 'forge'] as const
export type EventId = (typeof EVENTS)[number]
// điểm mỗi lần (tuyển: mỗi 5 đệ tử)
export const EVENT_PTS: Record<EventId, number> = { win: 10, train: 1, brew: 25, build: 30, raid: 60, forge: 40 }
// Chủ đề cần tính năng mở ở tầng này (dưới tầng đó: thắng trận tính điểm thay) — cướp: PVP_HALL, luyện khí: Luyện Khí Phòng
export const EVENT_HALL: Partial<Record<EventId, number>> = { raid: 6, forge: 8 }
export const EVENT_GOALS = [100, 300, 600, 1000, 1500]
export const EVENT_REWARDS: Reward[] = [
  { res: b(3000, 3000, 3000), items: { tuKhi: 3 } },
  { res: b(8000, 8000, 8000), items: { boiNguyen: 2 } },
  { res: b(15000, 15000, 15000), items: { doKiep: 1, hoiXuan: 1 } },
  { res: b(30000, 30000, 30000), items: { daiTuKhi: 1, ngungThan: 1 } },
  { res: b(50000, 50000, 50000), items: { taiTuy: 1 }, elder: 'toMiNuong' },
]
export const EVENT_TOP = 10
// quà thư cho hạng 1, 2–3, 4–10 khi hết tuần
export const EVENT_PRIZES: Reward[] = [
  { res: b(60000, 60000, 60000), items: { daiTuKhi: 2, phaCanh: 1 } },
  { res: b(40000, 40000, 40000), items: { daiTuKhi: 1 } },
  { res: b(20000, 20000, 20000), items: { tuKhi: 5 } },
]

// ---------- Thành tựu (như Achievements của RoK) ----------

// Mỗi thành tựu đo một chỉ số tích luỹ (tuyệt đối, như Metric của trung tâm sự kiện), 5 bậc — đạt bậc nào nhận quà bậc đó.
export type AchDef = { m: Metric; tiers: number[] }
const achs = {
  hall: { m: 'hall', tiers: [5, 10, 15, 20, 25] },
  build: { m: 'build', tiers: [20, 50, 90, 140, 200] },
  tech: { m: 'tech', tiers: [5, 20, 45, 80, 120] },
  forge: { m: 'forge', tiers: [3, 10, 25, 45, 70] },
  elder: { m: 'elder', tiers: [20, 60, 120, 200, 300] },
  train: { m: 'train', tiers: [500, 3000, 12000, 40000, 100000] },
  heal: { m: 'heal', tiers: [200, 1500, 6000, 20000, 60000] },
  brew: { m: 'brew', tiers: [5, 25, 80, 200, 400] },
  win: { m: 'win', tiers: [10, 50, 150, 400, 1000] },
  hunt: { m: 'hunt', tiers: [10, 40, 120, 300, 700] },
  realm: { m: 'realm', tiers: [3, 8, 15, 20, 25] },
  tower: { m: 'tower', tiers: [5, 15, 30, 45, 60] },
  speed: { m: 'speed', tiers: [120, 1200, 6000, 20000, 60000] },
  raid: { m: 'raid', tiers: [1, 10, 40, 100, 250] },
  gather: { m: 'gather', tiers: [10000, 100000, 500000, 2000000, 6000000] },
} satisfies Record<string, AchDef>
export type AchId = keyof typeof achs
export const ACHS: Record<AchId, AchDef> = achs
// Quà theo bậc (chung mọi thành tựu): bậc càng cao càng lớn
export const ACH_REWARDS: Reward[] = [
  { items: { thoiQuang15: 1, nganDuyen: 1 } },
  { items: { thoiQuang60: 1, kinhThu2k: 1 } },
  { items: { thoiQuang60: 1, kimDuyen: 1, thachNang5k: 1 } },
  { items: { thoiQuang180: 1, kimDuyen: 2, kinhThu8k: 1 } },
  { items: { thoiQuang180: 1, kimDuyen: 3, kinhThu8k: 2 } },
]

// ---------- Chiêu Hiền Đài (như Tavern của RoK — thiếp miễn phí theo giờ, thiếp từ sự kiện; không bán) ----------

// Ngân Duyên Phù mở miễn phí mỗi 6 giờ, Kim Duyên Phù mỗi 48 giờ (để dành tối đa một lượt mỗi loại); thiếp trong túi đồ
// mở thêm. Mỗi lần mở rút `slots` phần quà theo trọng số w (mầm của server: client không đoán trước được).
// Tín vật (hồn ấn) trưởng lão: đủ TOKEN_SUMMON thì thu nhận người chưa có; dư thì nâng sao (STAR_COST).
export const TAVERN_HALL = 2
export const TAVERN = {
  silver: { free: 6 * 3_600_000, slots: 2, key: 'nganDuyen' },
  gold: { free: 48 * 3_600_000, slots: 4, key: 'kimDuyen' },
} as const
export type TavernKind = keyof typeof TAVERN
export const GOLD_PITY = 10 // cứ 10 lần mở Kim Duyên chắc chắn có 10 tín vật một trưởng lão (đủ thu nhận)
export const TOKEN_SUMMON = 10
export const STAR_MAX = 6
export const STAR_COST = [10, 20, 30, 40, 50] // tín vật lên sao 2, 3, 4, 5, 6 (thu nhận là 1 sao)
export const STAR_BONUS: Partial<Record<Bonus, number>> = { atk: 0.03, hp: 0.03, skill: 0.05 } // mỗi sao trên 1, đội người đó dẫn
// Trưởng lão có tín vật trong Chiêu Hiền Đài (người của sự kiện / mùa giải thì không)
export const TAVERN_ELDERS: Record<TavernKind, ElderId[]> = {
  silver: ['thanhPhong', 'thachKien', 'nhuYen', 'loiChan', 'vanHac'],
  gold: [
    'thachKien',
    'nhuYen',
    'loiChan',
    'vanHac',
    'hanBang',
    'bachVoNhai',
    'macSau',
    'hoacThienCuong',
    'diepCoThanh',
  ],
}
// Một phần quà: vật phẩm / tài nguyên, hoặc n tín vật của một trưởng lão ngẫu nhiên trong danh sách của loại thiếp
export type Prize = { w: number; r?: Reward; token?: number }
export const TAVERN_POOL: Record<TavernKind, Prize[]> = {
  silver: [
    { w: 18, r: { res: b(1000, 1000, 1000) } },
    { w: 14, r: { items: { thoiQuang5: 2 } } },
    { w: 11, r: { items: { loBan15: 1 } } },
    { w: 9, r: { items: { luyenBinh15: 1 } } },
    { w: 7, r: { items: { ngoDao15: 1 } } },
    { w: 10, r: { items: { kinhThu500: 1 } } },
    { w: 5, r: { items: { thachNang1k: 2 } } },
    { w: 5, r: { items: { thaoNang1k: 2 } } },
    { w: 5, r: { items: { khoangNang1k: 2 } } },
    { w: 12, token: 1 },
    { w: 3, token: 3 },
    { w: 1, r: { items: { hoSon8: 1 } } },
  ],
  gold: [
    { w: 14, r: { res: b(5000, 5000, 5000) } },
    { w: 12, r: { items: { thoiQuang60: 1 } } },
    { w: 10, r: { items: { loBan60: 1 } } },
    { w: 8, r: { items: { luyenBinh60: 1 } } },
    { w: 6, r: { items: { ngoDao60: 1 } } },
    { w: 10, r: { items: { kinhThu2k: 1 } } },
    { w: 3, r: { items: { kinhThu8k: 1 } } },
    { w: 13, token: 2 },
    { w: 5, token: 5 },
    { w: 4, r: { items: { thoiQuang180: 1 } } },
    { w: 3, r: { items: { tuLinh8: 1 } } },
    { w: 2, r: { items: { chienY: 1 } } },
  ],
}

// ---------- Hương Hỏa (như VIP của RoK — không bán, chỉ đến từ việc chơi) ----------

// Mỗi ngày vào game được điểm theo chuỗi ngày liên tiếp (lỡ một ngày là về đầu chuỗi); vật phẩm Hương Hỏa Lệnh cộng thêm.
export const VIP_DAILY = [40, 60, 80, 100, 120, 150, 200]
// Tổng điểm để đạt cấp i (cấp 0 … 12)
export const VIP_LEVELS = [0, 200, 600, 1500, 3000, 5000, 8000, 12000, 18000, 26000, 36000, 50000, 70000]
// Tăng ích của từng cấp (đủ cả bộ, không cộng dồn với cấp dưới) — nhỏ và có trần để không phá nhịp mùa (npm run sim)
export const VIP_PERKS: Partial<Record<Bonus, number>>[] = [
  {},
  { prod: 0.01 },
  { prod: 0.02, heal: 0.03 },
  { prod: 0.02, heal: 0.05, train: 0.02 },
  { prod: 0.03, heal: 0.06, train: 0.03, storage: 0.03 },
  { prod: 0.03, heal: 0.08, train: 0.03, storage: 0.05, march: 0.03 },
  { prod: 0.04, heal: 0.1, train: 0.04, storage: 0.06, march: 0.04, build: 0.01 },
  { prod: 0.04, heal: 0.11, train: 0.04, storage: 0.08, march: 0.05, build: 0.02 },
  { prod: 0.05, heal: 0.12, train: 0.05, storage: 0.1, march: 0.06, build: 0.02, atk: 0.01 },
  { prod: 0.05, heal: 0.14, train: 0.05, storage: 0.12, march: 0.07, build: 0.03, atk: 0.02 },
  { prod: 0.06, heal: 0.16, train: 0.06, storage: 0.14, march: 0.08, build: 0.03, atk: 0.02, hp: 0.02 },
  { prod: 0.06, heal: 0.18, train: 0.06, storage: 0.16, march: 0.09, build: 0.04, atk: 0.03, hp: 0.02 },
  { prod: 0.07, heal: 0.2, train: 0.07, storage: 0.18, march: 0.1, build: 0.05, atk: 0.03, hp: 0.03 },
]
// Việc đang chờ còn dưới chừng ấy phút thì xong ngay miễn phí (như "free speedup" của RoK). Nhỏ vì nhịp bị giới hạn bởi
// số lần xây mỗi phiên (PLAN mục 5): miễn phí 30 phút như RoK làm bot giỏi tới Chủ điện 25 sớm hơn 4 ngày
export const VIP_FREE = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 8]
// Rương Hương Hỏa mỗi ngày (theo cấp)
// Tài nguyên trong lễ vật là nang (nằm trong túi, không bị cướp — như rương VIP của RoK), mở khi cần
const packsOf = (n: number): Partial<Record<ItemId, number>> =>
  n >= 10_000
    ? { thachNang5k: Math.round(n / 5000), thaoNang5k: Math.round(n / 5000), khoangNang5k: Math.round(n / 5000) }
    : {
        thachNang1k: Math.round(n / 1000) || 1,
        thaoNang1k: Math.round(n / 1000) || 1,
        khoangNang1k: Math.round(n / 1000) || 1,
      }
export const VIP_CHEST: Reward[] = VIP_LEVELS.map((_, i) => ({
  items: {
    ...packsOf(500 + 400 * i * i),
    thoiQuang5: 1 + Math.floor(i / 2),
    ...(i >= 2 && { thoiQuang15: Math.ceil(i / 3) }),
    ...(i >= 4 && { thoiQuang60: Math.floor(i / 4) }),
    ...(i >= 6 && { kinhThu2k: 1 }),
    ...(i >= 9 && { thoiQuang180: 1 }),
  },
}))

// ---------- Trung tâm sự kiện (như Events của RoK) ----------

// Chỉ số đo tiến độ: tổng tích luỹ suy từ state (thế lực, tổng tầng công trình…) hoặc bộ đếm trong stats. Tiến độ của một
// sự kiện = chỉ số bây giờ − chỉ số lúc sự kiện (hay giai đoạn) bắt đầu — nên mọi việc tự được tính, không phải gọi từng nơi.
export const METRICS = [
  'power', // thế lực
  'build', // tổng tầng công trình
  'hall', // tầng Chủ điện
  'tech', // tổng tầng công pháp
  'forge', // tổng cấp pháp bảo
  'elder', // tổng cấp trưởng lão
  'train', // đệ tử tuyển xong
  'heal', // thương binh chữa xong
  'brew', // đan luyện xong
  'win', // trận thắng
  'hunt', // yêu thú hạ được
  'realm', // tầng bí cảnh đã qua
  'tower', // tầng Thông Thiên Tháp
  'speed', // phút tăng tốc đã dùng (phù, đan)
  'raid', // lần cướp thắng
  'gather', // tài nguyên khai mỏ mang về
  'draw', // lần mở thiếp Chiêu Hiền Đài
  'ally', // lượt cung phụng Đại Trận + lượt giúp đỡ đồng minh
  'duel', // trận Luận Kiếm Đài đã đánh
  'duelWin', // trận Luận Kiếm Đài thắng
  'kp', // chiến công (thế lực đệ tử địch hạ được trong trận giữa các tông môn)
  'explore', // ô mê vụ đã khai
  'sites', // thôn trang / động phủ đã ghé
] as const
export type Metric = (typeof METRICS)[number]
// Khung giờ: newbie — ngày thứ from..to (0 = ngày lập tông môn) · week — các thứ trong tuần giờ VN (0 = thứ Hai … 6 = Chủ nhật)
// · cycle — mỗi `every` ngày mở `len` ngày (lệch `offset` ngày)
export type FestWindow =
  | { kind: 'newbie'; from: number; to: number }
  | { kind: 'week'; days: number[] }
  | { kind: 'cycle'; every: number; len: number; offset: number }
// login — mỗi ngày đăng nhập mở thêm một quà · tasks — mỗi việc một quà · points — làm việc ra điểm, đủ mốc nhận quà;
// stages: điểm mỗi việc theo từng ngày của khung (như Mightiest Governor: hôm xây, hôm nghiên cứu, hôm tuyển…), một phần tử = cả khung
// activity — mỗi việc xong cộng pts điểm hoạt lực, đủ mốc mở rương (như Daily Objectives của RoK)
// shop — làm việc ra lệnh bài (như points), đổi lấy quà trong kho, mỗi món tối đa max lần (như Hero Returns của RoK)
// panel: 'daily' — hiện ở bảng Nhiệm vụ ngày thay vì trung tâm sự kiện
export type FestDef = { window: FestWindow; hall?: number; panel?: 'daily' } & (
  | { kind: 'login'; rewards: Reward[] }
  | { kind: 'tasks'; abs?: boolean; tasks: { m: Metric; n: number; reward: Reward }[] } // abs: so chỉ số tuyệt đối (đạt tầng n…)
  | { kind: 'points'; stages: Partial<Record<Metric, number>>[]; goals: number[]; rewards: Reward[] }
  | { kind: 'activity'; tasks: { m: Metric; n: number; pts: number }[]; goals: number[]; rewards: Reward[] }
  | { kind: 'shop'; stages: Partial<Record<Metric, number>>[]; shop: { reward: Reward; price: number; max: number }[] }
)
const fests = {
  // Nhật Khóa (Daily Objectives của RoK): làm mới 0h giờ VN mỗi ngày; mỗi việc xong cộng điểm hoạt lực, 5 rương theo mốc.
  // Rương mốc NHAT_KHOA_DAY tính là "một hôm mở rương ngày" cho nhiệm vụ tuần.
  nhatKhoa: {
    window: { kind: 'cycle', every: 1, len: 1, offset: 0 },
    hall: 3,
    panel: 'daily',
    kind: 'activity',
    tasks: [
      { m: 'build', n: 2, pts: 20 },
      { m: 'train', n: 50, pts: 15 },
      { m: 'win', n: 3, pts: 20 },
      { m: 'brew', n: 1, pts: 10 },
      { m: 'speed', n: 60, pts: 15 },
      { m: 'hunt', n: 3, pts: 15 },
      { m: 'tech', n: 1, pts: 10 },
      { m: 'heal', n: 20, pts: 10 },
      { m: 'draw', n: 1, pts: 10 },
      { m: 'gather', n: 5000, pts: 15 },
      { m: 'raid', n: 1, pts: 10 },
      { m: 'ally', n: 5, pts: 15 },
    ],
    goals: [20, 40, 60, 80, 100],
    rewards: [
      { hallRes: 80, items: { thoiQuang5: 1 } },
      { hallRes: 100, items: { tuKhi: 1 } },
      { hallRes: 120, items: { boiNguyen: 1, nganDuyen: 1 } },
      { hallRes: 150, items: { thoiQuang15: 1 } },
      { hallRes: 200, items: { thoiQuang60: 1, kimDuyen: 1 } },
    ],
  },
  // Thất Nhật Lễ: 7 phần quà cho 7 ngày đăng nhập đầu (trong 14 ngày đầu), quà sau lớn hơn quà trước
  thatNhat: {
    window: { kind: 'newbie', from: 0, to: 13 },
    kind: 'login',
    rewards: [
      { res: b(2000, 2000, 2000), items: { thoiQuang15: 2, loBan15: 2 } },
      { items: { thoiQuang60: 1, luyenBinh60: 2, kinhThu500: 2 } },
      { res: b(5000, 5000, 5000), items: { tuLinh8: 1, loBan60: 2 } },
      { items: { thoiQuang60: 2, ngoDao60: 2, kinhThu2k: 1 } },
      { res: b(10000, 10000, 10000), items: { hoSon24: 1, loBan180: 1 } },
      { items: { thoiQuang180: 2, luyenBinh180: 1, tuLinh24: 1 } },
      { res: b(20000, 20000, 20000), items: { thoiQuang480: 1, kinhThu8k: 1 }, elder: 'nhuYen' },
    ],
  },
  // Tân Thủ Chi Lộ: chuỗi mục tiêu 7 ngày đầu — mỗi mục tiêu một phần quà
  tanThu: {
    window: { kind: 'newbie', from: 0, to: 6 },
    kind: 'tasks',
    abs: true,
    tasks: [
      { m: 'hall', n: 2, reward: { items: { loBan15: 2 } } },
      { m: 'build', n: 10, reward: { items: { thoiQuang15: 2 } } },
      { m: 'hall', n: 4, reward: { res: b(3000, 3000, 3000) } },
      { m: 'train', n: 100, reward: { items: { luyenBinh60: 1 } } },
      { m: 'win', n: 3, reward: { items: { kinhThu500: 2 } } },
      { m: 'hall', n: 6, reward: { items: { loBan60: 2, thoiQuang60: 1 } } },
      { m: 'tech', n: 3, reward: { items: { ngoDao60: 2 } } },
      { m: 'train', n: 600, reward: { items: { luyenBinh180: 1 } } },
      { m: 'hunt', n: 8, reward: { items: { kinhThu2k: 1, chienY: 1 } } },
      { m: 'hall', n: 8, reward: { res: b(15000, 15000, 15000), items: { tuLinh24: 1 } } },
      { m: 'power', n: 20000, reward: { items: { thoiQuang480: 1, hoSon24: 1 } } },
    ],
  },
  // Tông Lệnh Bảo Khố (Hero Returns): 8 ngày đầu — xây, tuyển, săn yêu, nghiên cứu ra Tông Môn Lệnh; đổi quà, mỗi món có hạn
  tongLenh: {
    window: { kind: 'newbie', from: 0, to: 7 },
    kind: 'shop',
    stages: [{ build: 5, train: 0.1, hunt: 3, tech: 8, win: 2 }],
    shop: [
      { reward: { items: { kimDuyen: 2 } }, price: 80, max: 1 },
      { reward: { items: { tapDich48: 1 } }, price: 40, max: 1 },
      { reward: { items: { tuLinh24: 1 } }, price: 30, max: 1 },
      { reward: { items: { hoSon24: 1 } }, price: 30, max: 1 },
      { reward: { items: { kinhThu2k: 1 } }, price: 20, max: 5 },
      { reward: { items: { loBan60: 1 } }, price: 15, max: 5 },
      { reward: { items: { luyenBinh60: 1 } }, price: 15, max: 5 },
      { reward: { items: { thachNang20k: 1 } }, price: 12, max: 3 },
      { reward: { items: { nganDuyen: 1 } }, price: 10, max: 3 },
    ],
  },
  // Khai Vụ Tứ Phương (như mốc "Uncovering Clouds" của RoK): 7 ngày đầu, thả linh điểu tan mê vụ, ghé thôn trang / động phủ
  khaiVu: {
    window: { kind: 'newbie', from: 0, to: 6 },
    hall: 3,
    kind: 'tasks',
    abs: true,
    tasks: [
      { m: 'explore', n: 40, reward: { items: { thoiQuang15: 2 } } },
      { m: 'sites', n: 3, reward: { items: { kinhThu500: 2 } } },
      { m: 'explore', n: 80, reward: { items: { thanHanh: 1, thachNang5k: 1 } } },
      { m: 'sites', n: 8, reward: { items: { kinhThu2k: 1, nganDuyen: 1 } } },
      { m: 'explore', n: 150, reward: { items: { thoiQuang60: 2, kimDuyen: 1 } } },
    ],
  },
  // Tông Môn Tranh Bá (như Mightiest Governor): thứ Hai → thứ Bảy, mỗi ngày một việc được điểm cao
  tranhBa: {
    window: { kind: 'week', days: [0, 1, 2, 3, 4, 5] },
    hall: 5,
    kind: 'points',
    stages: [
      { build: 60, speed: 1 }, // hôm 1: xây
      { tech: 120, speed: 1 }, // hôm 2: nghiên cứu công pháp
      { train: 1, speed: 1 }, // hôm 3: tuyển đệ tử
      { hunt: 60, win: 20, realm: 60 }, // hôm 4: săn yêu, bí cảnh
      { power: 1 }, // hôm 5: tăng thế lực
      { build: 60, tech: 120, train: 1, hunt: 60, forge: 80, speed: 1 }, // hôm 6: tổng lực
    ],
    goals: [500, 1500, 3500, 7000, 12000],
    rewards: [
      { items: { thoiQuang15: 3, thachNang5k: 1 } },
      { items: { thoiQuang60: 2, thaoNang5k: 1, khoangNang5k: 1 } },
      { items: { loBan60: 1, luyenBinh60: 1, kinhThu2k: 1 } },
      { items: { thoiQuang180: 1, tuLinh24: 1 } },
      { items: { thoiQuang480: 1, kinhThu8k: 1, hoSon24: 1 } },
    ],
  },
  // Săn Yêu Lệnh: Chủ nhật — săn yêu thú, qua bí cảnh
  sanYeu: {
    window: { kind: 'week', days: [6] },
    hall: 3,
    kind: 'points',
    stages: [{ hunt: 10, realm: 12, tower: 15, win: 2 }],
    goals: [20, 60, 120],
    rewards: [
      { items: { kinhThu500: 2, dieuThu60: 1 } },
      { items: { kinhThu2k: 1, chienY: 1 } },
      { items: { kinhThu8k: 1, thoiQuang180: 1 } },
    ],
  },
  // Sự kiện ngắn 2–3 ngày, chu kỳ 14 ngày (tuần A / tuần B), đặt trùng ngày ải Tranh Bá cùng hành động — một việc ăn nhiều
  // bộ đếm như RoK. Ngày 4 kể từ 1/1/1970 là thứ Hai tuần A; thứ Hai tuần B là ngày 11.
  thoMoc: {
    // Thổ Mộc Hưng Công (Tiles & Bricks): thứ Hai – thứ Ba tuần A, xây
    window: { kind: 'cycle', every: 14, len: 2, offset: 4 },
    hall: 3,
    kind: 'points',
    stages: [{ build: 100, speed: 1 }],
    goals: [200, 600, 1200],
    rewards: [
      { items: { loBan15: 2 } },
      { items: { loBan60: 1, nganDuyen: 1 } },
      { items: { loBan180: 1, thachNang5k: 1 } },
    ],
  },
  luyenBinh: {
    // Luyện Binh Trảm Yêu (Mighty Army): thứ Tư – thứ Năm tuần A, tuyển đệ tử và săn yêu
    window: { kind: 'cycle', every: 14, len: 2, offset: 6 },
    hall: 3,
    kind: 'points',
    stages: [{ train: 1, hunt: 20 }],
    goals: [200, 800, 2000],
    rewards: [
      { items: { luyenBinh15: 2 } },
      { items: { luyenBinh60: 1, nganDuyen: 1 } },
      { items: { luyenBinh180: 1, kinhThu2k: 1 } },
    ],
  },
  tuKhiTranh: {
    // Tụ Khí Tranh Thời (Now or Never): thứ Sáu – thứ Bảy tuần A, dùng tăng tốc
    window: { kind: 'cycle', every: 14, len: 2, offset: 8 },
    hall: 4,
    kind: 'points',
    stages: [{ speed: 2 }],
    goals: [120, 480, 1200],
    rewards: [
      { items: { thoiQuang15: 3 } },
      { items: { thoiQuang60: 2, kimDuyen: 1 } },
      { items: { thoiQuang180: 2 } },
    ],
  },
  thuLinh: {
    // Thu Linh Nhật Khóa (Daily Gathering): thứ Hai – thứ Tư tuần B, khai mỏ trên bản đồ giới
    window: { kind: 'cycle', every: 14, len: 3, offset: 11 },
    hall: 6,
    kind: 'points',
    stages: [{ gather: 0.02 }],
    goals: [100, 400, 1000],
    rewards: [
      { items: { thachNang5k: 1, thaoNang5k: 1 } },
      { items: { khoangNang20k: 1, thanHanh: 1 } },
      { items: { thachNang20k: 1, thaoNang20k: 1, kimDuyen: 1 } },
    ],
  },
  tangKinh: {
    // Tàng Kinh Ngộ Đạo (Boundless Wisdom): thứ Ba – thứ Tư tuần B, nghiên cứu công pháp
    window: { kind: 'cycle', every: 14, len: 2, offset: 12 },
    hall: 4,
    kind: 'points',
    stages: [{ tech: 200, speed: 1 }],
    goals: [200, 600, 1000],
    rewards: [
      { items: { ngoDao15: 2 } },
      { items: { ngoDao60: 1, nganDuyen: 1 } },
      { items: { ngoDao180: 1, kinhThu2k: 1 } },
    ],
  },
  tramYeu: {
    // Trảm Yêu Lệnh (Clarion Call): thứ Năm – thứ Sáu tuần B, săn yêu thú, qua bí cảnh
    window: { kind: 'cycle', every: 14, len: 2, offset: 14 },
    hall: 3,
    kind: 'points',
    stages: [{ hunt: 15, realm: 15, win: 3 }],
    goals: [45, 150, 300],
    rewards: [
      { items: { kinhThu500: 2, dieuThu15: 2 } },
      { items: { kinhThu2k: 1, kimCuong: 1 } },
      { items: { kinhThu8k: 1, kimDuyen: 1 } },
    ],
  },
  lienTram: {
    // Liên Trảm Bất Hồi (Cornucopia): thứ Bảy – Chủ nhật tuần B, thắng trận liên tiếp
    window: { kind: 'cycle', every: 14, len: 2, offset: 16 },
    hall: 3,
    kind: 'points',
    stages: [{ win: 10, raid: 25, tower: 10 }],
    goals: [50, 150, 300],
    rewards: [
      { items: { chienY: 1, thoiQuang15: 2 } },
      { items: { hoThe: 1, nganDuyen: 2 } },
      { items: { chienY: 1, kimCuong: 1, hoThe: 1, kimDuyen: 1 } },
    ],
  },
  dongTam: {
    // Đồng Tâm Hiệp Lực: thứ Sáu – thứ Bảy tuần B, cung phụng Đại Trận và giúp đồng minh
    window: { kind: 'cycle', every: 14, len: 2, offset: 10 },
    hall: 10,
    kind: 'points',
    stages: [{ ally: 10 }],
    goals: [100, 300, 700],
    rewards: [
      { items: { thoiQuang15: 2, thachNang5k: 1 } },
      { items: { thoiQuang60: 1, nganDuyen: 1 } },
      { items: { thoiQuang60: 2, kimDuyen: 1 } },
    ],
  },
  binhThe: {
    // Binh Thế Tranh Hùng (Lord of War): thứ Bảy – Chủ nhật tuần A, chiến công (đệ tử địch hạ được khi cướp, giữ nhà, tranh điểm)
    window: { kind: 'cycle', every: 14, len: 2, offset: 9 },
    hall: 6,
    kind: 'points',
    stages: [{ kp: 0.1 }],
    goals: [100, 400, 1200],
    rewards: [
      { items: { chienY: 1, dieuThu15: 2 } },
      { items: { kimCuong: 1, hoThe: 1, nganDuyen: 1 } },
      { items: { chienY: 1, kimCuong: 1, hoThe: 1, kimDuyen: 1 } },
    ],
  },
  tranhPhong: {
    // Luận Kiếm Tranh Phong: thứ Hai – thứ Ba tuần A, mỗi trận Luận Kiếm Đài có điểm, thắng thêm điểm
    window: { kind: 'cycle', every: 14, len: 2, offset: 5 },
    hall: 6,
    kind: 'points',
    stages: [{ duel: 15, duelWin: 10 }],
    goals: [60, 150, 250],
    rewards: [
      { items: { kinhThu2k: 1, thoiQuang15: 1 } },
      { items: { kinhThu2k: 2, nganDuyen: 1 } },
      { items: { kinhThu8k: 1, kimDuyen: 1 } },
    ],
  },
  // Danh Môn Tuần Lễ (các sự kiện quốc gia Rome / Germany… của RoK): ba đại phái thay nhau mỗi tuần (thứ Sáu → thứ Hai), mỗi
  // phái một loại lệnh bài kiếm từ việc riêng và một kho đổi riêng. Côn Lôn: xây, lĩnh ngộ, tăng tốc
  conLon: {
    window: { kind: 'cycle', every: 21, len: 4, offset: 1 },
    hall: 5,
    kind: 'shop',
    stages: [{ build: 6, tech: 8, speed: 0.05 }],
    shop: [
      { reward: { items: { kimDuyen: 1 } }, price: 80, max: 1 },
      { reward: { items: { tapDich48: 1 } }, price: 60, max: 1 },
      { reward: { items: { kinhThu8k: 1 } }, price: 40, max: 2 },
      { reward: { items: { loBan480: 1 } }, price: 30, max: 3 },
      { reward: { items: { ngoDao480: 1 } }, price: 30, max: 3 },
      { reward: { items: { tuLinh24: 1 } }, price: 25, max: 2 },
      { reward: { items: { thoiQuang60: 1 } }, price: 8, max: 10 },
    ],
  },
  // Thục Sơn: tuyển đệ tử, thắng trận, săn yêu, chiến công
  thucSon: {
    window: { kind: 'cycle', every: 21, len: 4, offset: 8 },
    hall: 5,
    kind: 'shop',
    stages: [{ train: 0.02, win: 2, hunt: 1, kp: 0.001 }],
    shop: [
      { reward: { items: { kimDuyen: 1 } }, price: 80, max: 1 },
      { reward: { items: { luyenBinh480: 1 } }, price: 30, max: 3 },
      { reward: { items: { chienY: 1 } }, price: 20, max: 3 },
      { reward: { items: { kimCuong: 1 } }, price: 20, max: 3 },
      { reward: { items: { hoThe: 1 } }, price: 20, max: 3 },
      { reward: { items: { thanHanh: 1 } }, price: 15, max: 3 },
      { reward: { items: { kinhThu2k: 1 } }, price: 12, max: 5 },
    ],
  },
  // Nga Mi: luyện đan, chữa thương, khai mỏ, giúp đồng minh
  ngaMi: {
    window: { kind: 'cycle', every: 21, len: 4, offset: 15 },
    hall: 5,
    kind: 'shop',
    stages: [{ brew: 4, heal: 0.02, gather: 0.0005, ally: 1 }],
    shop: [
      { reward: { items: { kimDuyen: 1 } }, price: 80, max: 1 },
      { reward: { items: { hoSon24: 1 } }, price: 35, max: 2 },
      { reward: { items: { dieuThu480: 1 } }, price: 25, max: 3 },
      { reward: { items: { thachNang20k: 1 } }, price: 15, max: 3 },
      { reward: { items: { thaoNang20k: 1 } }, price: 15, max: 3 },
      { reward: { items: { khoangNang20k: 1 } }, price: 15, max: 3 },
      { reward: { items: { nganDuyen: 1 } }, price: 12, max: 3 },
    ],
  },
} satisfies Record<string, FestDef>
export type FestId = keyof typeof fests
export const FESTS: Record<FestId, FestDef> = fests
export const NHAT_KHOA_DAY = 2 // rương mốc thứ 3 (60 điểm) của Nhật Khóa = một hôm mở rương ngày (nhiệm vụ tuần)

// ---------- Nhiệm vụ chính tuyến ----------

// Dẫn người chơi qua từng hệ thống theo đúng thứ tự mở khoá (UX.md mục 5.1). Thưởng được vượt sức chứa.
// build: công trình id đạt tầng n · train: có n đệ tử · hunt: hạ yêu thú cấp n · sect: hạ tông môn số n (từ 1)
// realm: bí cảnh id qua tầng n · tech: tổng n tầng công pháp · brew: luyện n viên đan
// tower: qua n tầng Thông Thiên Tháp · forge: tổng n cấp pháp bảo
export type Quest = {
  k: 'build' | 'train' | 'hunt' | 'sect' | 'realm' | 'tech' | 'brew' | 'tower' | 'forge'
  id?: string
  n: number
  reward: Partial<Bag>
  items?: Partial<Record<PillId, number>>
}
const each = (n: number): Partial<Bag> => b(n, n, n)
export const QUESTS: Quest[] = [
  { k: 'build', id: 'tuLinhTran', n: 1, reward: { linhThao: 150, linhKhoang: 150 } },
  { k: 'build', id: 'linhDien', n: 1, reward: { linhThach: 150, linhKhoang: 150 } },
  { k: 'build', id: 'khoangMach', n: 1, reward: { linhThach: 150, linhThao: 150 } },
  { k: 'build', id: 'chuDien', n: 2, reward: each(300) },
  { k: 'build', id: 'tangBaoCac', n: 1, reward: each(200) },
  { k: 'build', id: 'dienVoTruong', n: 1, reward: each(250) },
  { k: 'train', n: 20, reward: each(300) },
  { k: 'build', id: 'tuLinhTran', n: 2, reward: { linhThao: 250, linhKhoang: 250 } },
  { k: 'build', id: 'linhDien', n: 2, reward: { linhThach: 250, linhKhoang: 250 } },
  { k: 'build', id: 'khoangMach', n: 2, reward: { linhThach: 250, linhThao: 250 } },
  { k: 'build', id: 'chuDien', n: 3, reward: each(500) },
  { k: 'hunt', n: 1, reward: each(400), items: { tuKhi: 1 } },
  { k: 'build', id: 'danPhong', n: 1, reward: each(400) },
  { k: 'brew', n: 1, reward: each(300) },
  { k: 'realm', id: '0', n: 1, reward: each(400) },
  { k: 'build', id: 'tangBaoCac', n: 2, reward: each(400) },
  { k: 'hunt', n: 2, reward: each(500) },
  { k: 'build', id: 'chuDien', n: 4, reward: each(800) },
  { k: 'build', id: 'tangKinhCac', n: 1, reward: each(500) },
  { k: 'tech', n: 1, reward: each(500) },
  { k: 'train', n: 100, reward: each(600) },
  { k: 'hunt', n: 3, reward: each(600), items: { tuKhi: 1 } },
  { k: 'sect', id: '0', n: 1, reward: each(800) },
  { k: 'build', id: 'dienVoTruong', n: 3, reward: each(800) },
  { k: 'build', id: 'chuDien', n: 5, reward: each(1500) },
  { k: 'realm', id: '0', n: 3, reward: each(1000) },
  { k: 'hunt', n: 5, reward: each(1200) },
  { k: 'build', id: 'chuDien', n: 6, reward: each(2500), items: { tuKhi: 2 } },
  { k: 'realm', id: '0', n: 5, reward: each(2000) },
  { k: 'build', id: 'dienVoTruong', n: 5, reward: each(2500) },
  { k: 'tech', n: 8, reward: each(2500) },
  { k: 'sect', id: '1', n: 1, reward: each(3000) },
  { k: 'build', id: 'chuDien', n: 8, reward: each(4000) },
  { k: 'build', id: 'luyenKhiPhong', n: 1, reward: each(3000) },
  { k: 'realm', id: '1', n: 1, reward: each(4000) },
  { k: 'forge', n: 1, reward: each(3000) },
  { k: 'hunt', n: 9, reward: each(5000) },
  { k: 'sect', id: '2', n: 1, reward: each(6000) },
  { k: 'build', id: 'chuDien', n: 10, reward: each(8000), items: { doKiep: 1 } },
  { k: 'build', id: 'chuDien', n: 11, reward: each(10000), items: { tuKhi: 3 } },
  { k: 'realm', id: '1', n: 5, reward: each(10000) },
  { k: 'build', id: 'dienVoTruong', n: 10, reward: each(12000) },
  { k: 'hunt', n: 12, reward: each(14000) },
  { k: 'sect', id: '3', n: 1, reward: each(16000) },
  { k: 'realm', id: '2', n: 5, reward: each(20000) },
  { k: 'sect', id: '4', n: 1, reward: each(24000) },
  { k: 'build', id: 'chuDien', n: 15, reward: each(30000) },
  // Sau kiếp đầu: Nguyên Anh, Hóa Thần (chỉ PvE)
  { k: 'build', id: 'chuDien', n: 16, reward: each(40000), items: { daiTuKhi: 1 } },
  { k: 'build', id: 'dienVoTruong', n: 16, reward: each(40000) },
  { k: 'realm', id: '3', n: 1, reward: each(45000) },
  { k: 'build', id: 'tangKinhCac', n: 16, reward: each(45000) },
  { k: 'tower', n: 20, reward: each(45000), items: { hoiXuan: 2 } },
  { k: 'forge', n: 12, reward: each(50000) },
  { k: 'build', id: 'chuDien', n: 17, reward: each(50000) },
  { k: 'realm', id: '3', n: 3, reward: each(55000) },
  { k: 'build', id: 'chuDien', n: 18, reward: each(60000), items: { ngungThan: 1 } },
  { k: 'tower', n: 30, reward: each(65000) },
  { k: 'realm', id: '3', n: 5, reward: each(70000) },
  { k: 'build', id: 'chuDien', n: 19, reward: each(75000) },
  { k: 'tech', n: 110, reward: each(80000) },
  { k: 'build', id: 'chuDien', n: 20, reward: each(90000), items: { phaCanh: 1 } },
  { k: 'build', id: 'chuDien', n: 21, reward: each(110000), items: { daiTuKhi: 2 } },
  { k: 'build', id: 'dienVoTruong', n: 21, reward: each(110000) },
  { k: 'realm', id: '4', n: 1, reward: each(120000) },
  { k: 'forge', n: 36, reward: each(130000) },
  { k: 'build', id: 'chuDien', n: 22, reward: each(140000) },
  { k: 'realm', id: '4', n: 3, reward: each(160000) },
  { k: 'tower', n: 45, reward: each(180000), items: { taiTuy: 1 } },
  { k: 'build', id: 'chuDien', n: 23, reward: each(200000) },
  { k: 'realm', id: '4', n: 5, reward: each(230000) },
  { k: 'build', id: 'chuDien', n: 25, reward: each(300000) },
]
