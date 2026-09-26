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
// Tốc hành quân và sức mang theo hệ (bộ / kỵ / cung của RoK) — chỉ trên bản đồ Giới: kiếm tu nhanh, thể tu chậm mà mang nhiều,
// pháp tu mang ít; đội đi theo tốc hệ chậm nhất có trong đội
export const UNIT_SPEED: Record<UnitType, number> = { kiem: 1.15, phap: 1, the: 0.85 }
export const UNIT_CARRY: Record<UnitType, number> = { kiem: 1, phap: 0.8, the: 1.25 }
export type UnitId = `${UnitType}${Tier}`
export const UNITS = TYPES.flatMap(t => TIERS.map(n => `${t}${n}` as UnitId))

export const BATCH_BASE = 20 // số đệ tử mỗi lượt tuyển: BATCH_BASE + BATCH_STEP × tầng Diễn võ trường
export const BATCH_STEP = 20
export const HOSPITAL_BASE = 80 // chỗ nằm thương binh: HOSPITAL_BASE + HOSPITAL_STEP × tầng Đan phòng
export const HOSPITAL_STEP = 120
export const HEAL_COST = 0.4 // chữa 1 thương binh tốn 40% chi phí tuyển
// Anh Linh Điện (Hall of Heroes của RoK): đệ tử tử trận vì Đan phòng đầy được giữ hồn FALLEN_KEEP (tử trận thêm thì tính lại từ lúc
// đó); trong hạn hồi sinh được ngay, tốn REVIVE_COST chi phí tuyển (đắt hơn chữa thương, rẻ hơn tuyển mới), về thẳng hàng ngũ
export const FALLEN_KEEP = 72 * 3_600_000
export const REVIVE_COST = 0.6
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
// Đạo thống (Civilization của RoK): mỗi tông môn theo một đạo thống; chọn lúc lập tông môn (save cũ chưa có thì chọn miễn phí
// từ Chủ điện tầng DAO_HALL), đổi lại được sau DAO_COOL.
// Chiến lược mùa (Seasonal Strategies của RoK — King of the Nile): mỗi mùa chọn một, miễn phí, luân hồi thì chọn lại
export const STRAT_HALL = 5
export const STRATS = {
  dieuThu: { heal: 0.15 }, // Diệu Thủ: chữa thương rẻ và nhanh hơn 15 %
  toanThan: { hospital: 0.25 }, // Toàn Thân Nhi Thoái: Đan phòng chứa thêm 25 % — bớt tử trận
  tichCoc: { storage: 0.2 }, // Tích Cốc: sức chứa kho +20 % — phần được bảo hộ cũng lớn theo
} satisfies Record<string, Partial<Record<Bonus, number>>>
export type StratId = keyof typeof STRATS
export const STRAT_IDS = Object.keys(STRATS) as StratId[]
export const DAO_HALL = 2
export const DAO_COOL = 7 * 24 * 3_600_000
// Chín đạo thống như các nền văn minh của RoK: chọn ngay lúc lập tông môn, mỗi đạo ba tiềm năng (một chiến, một phát triển,
// một sở trường riêng). Thứ tự = thứ tự trên màn chọn.
export const DAOS = {
  kiemTong: { 'atk.kiem': 0.05, march: 0.05, cap: 0.05 },
  phapTong: { 'atk.phap': 0.05, skill: 0.05, exp: 0.1 },
  theTong: { 'hp.the': 0.05, heal: 0.1, hospital: 0.1 },
  danTong: { brew: 0.1, prod: 0.03, 'prod.linhThao': 0.05 },
  tranTong: { def: 0.05, build: 0.03, storage: 0.1 },
  khiTong: { forge: 0.15, 'prod.linhKhoang': 0.05, atk: 0.02 },
  phuTong: { trib: 0.1, skill: 0.03, def: 0.02 },
  thuTong: { train: 0.05, hp: 0.03, march: 0.03 },
  maTong: { loot: 0.1, atk: 0.03, train: 0.03 },
} as const satisfies Record<string, Partial<Record<Bonus, number>>>
export type DaoId = keyof typeof DAOS
export const DAO_IDS = Object.keys(DAOS) as DaoId[]
// Đệ tử đặc trưng (đơn vị riêng của mỗi nền văn minh RoK): mỗi đạo thống thay một hệ đệ tử bằng bản của mình ở mọi bậc —
// tên, dáng riêng; chỉ số gốc nhân thêm atk/def/hp, speed nhân tốc hành quân của hệ đó trên bản đồ giới. Luận Kiếm Đài không tính.
export type DaoUnit = { type: UnitType; atk?: number; def?: number; hp?: number; speed?: number }
export const DAO_UNITS: Record<DaoId, DaoUnit> = {
  kiemTong: { type: 'kiem', speed: 0.08, atk: 0.03 }, // Ngự Kiếm Sĩ
  phapTong: { type: 'phap', atk: 0.06, hp: 0.02 }, // Viêm Linh Pháp Sư
  theTong: { type: 'the', hp: 0.06, def: 0.04 }, // Kim Cương La Hán
  danTong: { type: 'phap', hp: 0.08 }, // Dược Linh Sư
  tranTong: { type: 'the', def: 0.1 }, // Trấn Sơn Vệ
  khiTong: { type: 'kiem', def: 0.08, atk: 0.02 }, // Thần Binh Vệ
  phuTong: { type: 'phap', def: 0.06, hp: 0.03 }, // Phù Chú Sư
  thuTong: { type: 'the', speed: 0.12, atk: 0.03 }, // Kỳ Lân Kỵ
  maTong: { type: 'kiem', atk: 0.06, hp: 0.03 }, // Huyết Sát Vệ
}
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
  | 'cap' // trận dung (sức chứa đệ tử mỗi đội)
  | 'gather' // tốc khai mỏ trên bản đồ giới
  | 'study' // bớt thời gian lĩnh ngộ công pháp (Tàng Kinh Các — như tốc nghiên cứu của Học viện RoK)

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
      { at: 20, key: 'gather', v: 0.2 }, // khai mỏ nhanh (tướng khai mỏ của RoK)
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
      { at: 20, key: 'gather', v: 0.3 }, // khai mỏ nhanh (tướng khai mỏ của RoK)
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
// Phẩm trưởng lão (độ hiếm 4 bậc màu của RoK — chỉ để hiện, theo độ khó thu nhận): 2 Tinh (lam) · 3 Huyền (tím) · 4 Tiên (vàng)
export const RARITY: Record<ElderId, 1 | 2 | 3 | 4> = {
  thanhPhong: 2,
  thachKien: 2,
  nhuYen: 2,
  loiChan: 3,
  vanHac: 3,
  hanBang: 3,
  macSau: 3,
  toMiNuong: 3,
  bachVoNhai: 4,
  hoacThienCuong: 4,
  huyenMinh: 4,
  diepCoThanh: 4,
}
export const FIRST_ELDER: ElderId = 'thanhPhong'
// Khung chân dung (Avatar Frames của RoK): mở theo thành tích (sect/elders.ts frameOpen), chọn ở hồ sơ của mình
export const FRAMES = ['basic', 'vip', 'ascend', 'crown', 'arena', 'rebirth'] as const
export type FrameId = (typeof FRAMES)[number]
export const FRAME_VIP = 6 // Hương Hỏa tối thiểu
export const FRAME_DUELS = 50 // trận Luận Kiếm Đài thắng tối thiểu

// Thiên phú — Linh căn ba mạch (Talent Trees của RoK): 3 cây Công mạch / Thủ mạch / Đạo mạch, mỗi cây 3 tầng × 2 nút (mỗi nút tối
// đa max điểm) + nút cuối 1 điểm; nút tầng k mở khi đã cộng TALENT_TIER[k] điểm trong cây đó. Điểm: cấp trưởng lão − 1, thêm
// TALENT_STAR mỗi sao trên 1 — không đủ lấp cả ba cây, phải chọn. Chỉ đội người đó dẫn dùng. Tẩy Tủy Đan trả lại hết điểm.
// key 'atk.own' / 'hp.own': theo hệ của chính trưởng lão. Nút i = cây × TALENT_TREE_SIZE + vị trí.
export type TalentNode = { key: Bonus | 'atk.own' | 'hp.own'; v: number; max: number; tier: number }
export const TALENT_TIER = [0, 5, 10, 16]
// Liệt truyện trưởng lão: chương k mở khi trưởng lão tới cấp ELDER_STORY_LV[k] (càng tu luyện cùng nhau càng hiểu chuyện xưa)
export const ELDER_STORY_LV = [10, 20, 30]
export const TALENT_STAR = 2
// Lưu bộ thiên phú (talent pages của RoK): mỗi trưởng lão chừng ấy bộ, đổi bộ miễn phí khi không xuất quân
export const TALENT_PAGES = 3
export const TALENT_TREES: TalentNode[][] = [
  [
    { key: 'atk', v: 0.008, max: 3, tier: 0 }, // Công mạch: công
    { key: 'atk.own', v: 0.01, max: 3, tier: 0 }, // công đệ tử hệ mình
    { key: 'loot', v: 0.03, max: 3, tier: 1 }, // chiến lợi phẩm
    { key: 'cap', v: 0.015, max: 3, tier: 1 }, // trận dung
    { key: 'atk', v: 0.01, max: 3, tier: 2 },
    { key: 'atk.own', v: 0.012, max: 3, tier: 2 },
    { key: 'atk', v: 0.04, max: 1, tier: 3 }, // Phá Trận
  ],
  [
    { key: 'def', v: 0.008, max: 3, tier: 0 }, // Thủ mạch: thủ
    { key: 'hp', v: 0.01, max: 3, tier: 0 }, // sinh lực
    { key: 'hp.own', v: 0.01, max: 3, tier: 1 }, // sinh lực đệ tử hệ mình
    { key: 'def', v: 0.008, max: 3, tier: 1 },
    { key: 'def', v: 0.01, max: 3, tier: 2 },
    { key: 'hp', v: 0.012, max: 3, tier: 2 },
    { key: 'def', v: 0.04, max: 1, tier: 3 }, // Bất Động Như Sơn
  ],
  [
    { key: 'skill', v: 0.02, max: 3, tier: 0 }, // Đạo mạch: sức công pháp
    { key: 'exp', v: 0.03, max: 3, tier: 0 }, // kinh nghiệm
    { key: 'skill', v: 0.02, max: 3, tier: 1 },
    { key: 'gather', v: 0.03, max: 3, tier: 1 }, // khai mỏ
    { key: 'skill', v: 0.03, max: 3, tier: 2 },
    { key: 'trib', v: 0.02, max: 3, tier: 2 }, // độ kiếp
    { key: 'skill', v: 0.1, max: 1, tier: 3 }, // Thiên Nhân Hợp Nhất
  ],
]
export const TALENT_TREE_SIZE = TALENT_TREES[0].length
export const TALENT_NODES = TALENT_TREES.flat()

// ---------- Tàng Kinh Các ----------

export const TECH_ROWS = [1, 3, 6, 9, 12, 16, 21, 25] // tầng Tàng Kinh Các mở từng hàng (hàng cuối: quân sự cuối game)
// Tàng Kinh Các mỗi tầng bớt STUDY_CUT thời gian lĩnh ngộ công pháp (tầng 25: −25 %, như Học viện RoK cấp 25)
export const STUDY_CUT = 0.01
export const TECH_COST_GROWTH = 1.7
export const TECH_TIME_GROWTH = 1.8
export type TechDef = { row: number; max: number; key: Bonus; v: number; cost: Bag; time: number }
const R0 = b(100, 150, 150),
  R1 = b(400, 500, 400),
  R2 = b(1200, 1500, 1200),
  R3 = b(3000, 3500, 3000),
  R4 = b(7000, 8000, 7000)
const R5 = b(15000, 17000, 15000),
  R6 = b(32000, 36000, 32000),
  R7 = b(60000, 68000, 60000)
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
  // hàng cuối (như cây Quân sự của Học viện RoK): trận dung, khai mỏ, sức công pháp, sinh lực
  thongSoai: { row: 7, max: 5, key: 'cap', v: 0.03, cost: R7, time: 21600 },
  tamLong: { row: 7, max: 5, key: 'gather', v: 0.06, cost: R7, time: 21600 },
  vanPhap: { row: 7, max: 5, key: 'skill', v: 0.04, cost: R7, time: 21600 },
  batDiet: { row: 7, max: 5, key: 'hp', v: 0.04, cost: R7, time: 21600 },
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

// Pháp bảo tất định: không rơi đồ, không nguyên liệu, không may rủi — chỉ tài nguyên và thời gian. Mỗi trưởng lão đeo GEAR_SLOTS ô
// (binh khí, hộ thân, linh bảo — mỗi ô một món), bonus chỉ cho đội người đó dẫn. 9 món chia ba bộ theo hệ, mỗi bộ đủ ba ô; đeo 2 / 3
// món cùng bộ có thêm thưởng bộ (GEAR_SETS). Cấp tối đa theo tầng Luyện Khí Phòng: ⌈tầng / 2⌉, trần GEAR_MAX.
export const GEAR_MAX = 10
export const GEAR_SLOTS = 3
export const GEAR_COST_GROWTH = 1.45
export const GEAR_TIME_GROWTH = 1.3
export type GearDef = { key: Bonus; v: number; cost: Bag; time: number; slot: number; set: UnitType } // v: bonus mỗi cấp
const G0 = b(2000, 1500, 3000),
  G1 = b(1500, 3000, 2000),
  G2 = b(3000, 2000, 1500)
const gear = {
  thanhSuong: { key: 'atk.kiem', v: 0.03, cost: G0, time: 1800, slot: 0, set: 'kiem' }, // kiếm
  xichViem: { key: 'atk.phap', v: 0.03, cost: G2, time: 1800, slot: 0, set: 'phap' }, // quạt
  kimCang: { key: 'hp.the', v: 0.035, cost: G1, time: 1800, slot: 1, set: 'the' }, // vòng tay
  huyenVu: { key: 'def', v: 0.03, cost: G1, time: 2400, slot: 1, set: 'kiem' }, // giáp mai rùa
  hoTam: { key: 'hp', v: 0.02, cost: G1, time: 2400, slot: 1, set: 'phap' }, // kính hộ tâm
  thienLoi: { key: 'atk', v: 0.02, cost: G0, time: 2400, slot: 0, set: 'the' }, // chuỳ
  tuBao: { key: 'loot', v: 0.05, cost: G2, time: 1800, slot: 2, set: 'the' }, // bồn tụ bảo
  ngocGian: { key: 'exp', v: 0.05, cost: G2, time: 1800, slot: 2, set: 'kiem' }, // ngọc giản
  tiLoi: { key: 'trib', v: 0.03, cost: G0, time: 2400, slot: 2, set: 'phap' }, // châu tị lôi
} satisfies Record<string, GearDef>
export type GearId = keyof typeof gear
export const GEAR: Record<GearId, GearDef> = gear
// Thưởng bộ (theo hệ): đeo 2 món cùng bộ được two, đủ 3 món được thêm three
export type GearBonus = { key: Bonus; v: number }
export const GEAR_SETS: Record<UnitType, { two: GearBonus; three: GearBonus }> = {
  kiem: { two: { key: 'atk.kiem', v: 0.03 }, three: { key: 'skill', v: 0.1 } },
  phap: { two: { key: 'atk.phap', v: 0.03 }, three: { key: 'skill', v: 0.1 } },
  the: { two: { key: 'atk.the', v: 0.03 }, three: { key: 'skill', v: 0.1 } },
}

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
  | { use: 'pick'; n: number } // Tuỳ Tâm Nang: mở ra chọn một loại tài nguyên (linh thạch / thảo / khoáng), mỗi nang n
  | { use: 'buff'; key: Bonus; v: number; hours: number }
  | { use: 'shield'; hours: number }
  | { use: 'exp'; n: number }
  | { use: 'key' } // thiếp Chiêu Hiền Đài: mở ở Chiêu Hiền Đài, không dùng thẳng từ túi
  | { use: 'builder'; hours: number } // thuê tạp dịch thứ hai (xây song song hai công trình)
  | { use: 'vip'; n: number } // Hương Hỏa Lệnh: cộng điểm Hương Hỏa (VIP)
  | { use: 'ap'; n: number } // Hành Lực Đan: cộng hành lực (được vượt AP_MAX)
  | { use: 'map'; n: number } // Sơn Hà Đồ: tan n ô mê vụ gần tông môn nhất
  | { use: 'ticket' } // Luận Kiếm Lệnh: dùng ở Luận Kiếm Đài (+1 lượt hôm nay), không dùng thẳng từ túi
  | { use: 'douse' } // Tức Hỏa Phù: dập linh hỏa đang thiêu núi (trận lực thôi tụt)
  | { use: 'move'; pick: boolean } // Di Sơn Phù (ngẫu nhiên) / Càn Khôn Phù (chọn chỗ): dời núi ở bản đồ giới, không dùng thẳng từ túi
  | { use: 'rename' } // Cải Danh Lệnh: đổi tên tông môn (Cài đặt → Tài khoản; server chặn tên trùng)
  | { use: 'veil'; hours: number } // Ẩn Tung Phù: tông môn bị do thám thì linh điểu không dò được gì (Anti-Scouting của RoK)
  | { use: 'mirage'; hours: number } // Huyễn Ảnh Phù: do thám thấy nghi binh — quân, lực chiến ×MIRAGE_SHOW, của cướp được ×MIRAGE_LOOT
  | { use: 'frag' } // Tàng Bảo Đồ tàn phiến: không dùng thẳng — gom DIG_FRAGS mảnh ghép bản đồ ở bản đồ giới
  | { use: 'swap' } // Truyền Công Phù: không dùng thẳng — trả phí Truyền công ở bảng trưởng lão (trong Truyền Công Đại Hội)
  | { use: 'packet' } // Hồng Bao: không dùng thẳng — gửi ở kênh chat Giới / Tiên minh (world/packet.ts)
  | { use: 'reset' } // Hoàn Nguyên Phù: không dùng thẳng — đặt lại công pháp đã ngộ của một trưởng lão (trang trưởng lão)
  | { use: 'token'; rarity: 2 | 3 | 4 } // Vạn Năng Tín Vật: không dùng thẳng — đổi thành tín vật của trưởng lão cùng phẩm đã thu nhận (trang trưởng lão)
export const SPEED_MIN = [5, 15, 60, 180, 480, 1440] as const // mệnh giá phù tăng tốc (phút)
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
const choice = <P extends string>(prefix: P) =>
  Object.fromEntries(PACK_N.map(n => [`${prefix}${n / 1000}k`, { use: 'pick', n }])) as Record<
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
  ...choice('tuyTam'), // Tuỳ Tâm Nang — mở ra chọn loại tài nguyên (Resource Choice Chest)
  tuLinh8: { use: 'buff', key: 'prod', v: 0.5, hours: 8 }, // Tụ Linh Phù: sản lượng +50 %
  tuLinh24: { use: 'buff', key: 'prod', v: 0.5, hours: 24 },
  khaiLinh8: { use: 'buff', key: 'gather', v: 0.5, hours: 8 }, // Khai Linh Phù: khai mỏ nhanh +50 % (Enhanced Gathering)
  khaiLinh24: { use: 'buff', key: 'gather', v: 0.5, hours: 24 },
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
  huongHoa50: { use: 'vip', n: 50 }, // Hương Hỏa Lệnh: điểm Hương Hỏa
  huongHoa200: { use: 'vip', n: 200 },
  hanhLuc50: { use: 'ap', n: 50 }, // Hành Lực Đan: hồi hành lực (săn yêu thú giới)
  luanKiem: { use: 'ticket' }, // Luận Kiếm Lệnh: thêm một lượt Luận Kiếm Đài
  khuechTran8: { use: 'buff', key: 'cap', v: 0.1, hours: 8 }, // Khuếch Trận Kỳ: trận dung +10 %
  sonHa12: { use: 'map', n: 12 }, // Sơn Hà Đồ: tan 12 ô mê vụ gần nhất
  tucHoa: { use: 'douse' }, // Tức Hỏa Phù: dập linh hỏa thiêu núi
  diSon: { use: 'move', pick: false }, // Di Sơn Phù: dời tông môn tới chỗ trống ngẫu nhiên vùng ngoài (Random Teleport)
  canKhon: { use: 'move', pick: true }, // Càn Khôn Phù: dời tới ô chọn ở vùng đã mở (Advanced Teleport)
  caiDanh: { use: 'rename' }, // Cải Danh Lệnh: đổi tên tông môn (Rename của RoK)
  anTung8: { use: 'veil', hours: 8 }, // Ẩn Tung Phù: do thám không thấy gì (dùng thêm thì kéo dài)
  anTung24: { use: 'veil', hours: 24 },
  huyenAnh8: { use: 'mirage', hours: 8 }, // Huyễn Ảnh Phù: báo cáo do thám giả (dùng thêm thì kéo dài)
  baoDo: { use: 'frag' }, // Tàng Bảo Đồ tàn phiến
  truyenCong: { use: 'swap' }, // Truyền Công Phù
  hongBao: { use: 'packet' }, // Hồng Bao (lì xì)
  hoanNguyen: { use: 'reset' }, // Hoàn Nguyên Phù (Skill Reset của RoK): trả đủ tín vật đã ngộ
  vanNang2: { use: 'token', rarity: 2 }, // Vạn Năng Tín Vật (tượng vạn năng của RoK): Tinh / Huyền / Tiên phẩm
  vanNang3: { use: 'token', rarity: 3 },
  vanNang4: { use: 'token', rarity: 4 },
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
  'tuyTam',
  'kinhThu',
  'nganDuyen',
  'kimDuyen',
  'tapDich',
  'huongHoa',
  'hanhLuc',
  'luanKiem',
  'khuechTran',
  'sonHa',
  'tucHoa',
  'khaiLinh',
  'diSon',
  'canKhon',
  'caiDanh',
  'anTung',
  'huyenAnh',
  'baoDo',
  'truyenCong',
  'hongBao',
  'vanNang',
  'hoanNguyen',
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
  tokens?: Partial<Record<ElderId, number>> // tín vật trưởng lão (quà hạng Tông Môn Tranh Bá)
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
// Chính Tà Phân Tranh (Light and Darkness của RoK): mọi phe trong giới chia hai phái — Chính phái (0) · Tà phái (1); điểm mùa cộng theo
// phái, hết mùa người phái nhiều điểm hơn nhận CAMP_WIN qua thư
export const CAMP_WIN: Reward = { items: { thoiQuang480: 1, kimDuyen: 1, huongHoa200: 1 } }
// Chặng thi đua (các chặng của Light and Darkness): mùa chia chặng CAMP_STAGE_DAYS ngày, mỗi chặng một việc (CAMP_STAGES xoay vòng);
// phần tăng của mỗi người trong chặng cộng cho phái mình. Hết chặng phái nhiều hơn thắng: người phái thắng có góp nhận
// CAMP_STAGE_GIFT qua thư, phái được CAMP_STAGE_PTS điểm mùa (cộng vào điểm phái khi tính phái thắng mùa)
export const CAMP_STAGE_DAYS = 3
export const CAMP_STAGES: Metric[] = ['gather', 'speed', 'hunt', 'train', 'kp']
export const CAMP_STAGE_PTS = 200
export const CAMP_STAGE_GIFT: Reward = { items: { thoiQuang60: 2, kinhThu2k: 1 } }
// Khai Giới Trảm Tà (Eve of the Crusade của RoK): pha Khai giới (pha 0, cổng còn đóng) hạ yêu thú giới rơi tàn quyển (eveFrags
// theo cấp); đủ EVE_CHEST_N đổi một rương tiếp tế. Mỗi tàn quyển cộng một điểm giới vận cho tiên minh; cổng mở (hết pha 0) thì
// EVE_TOP minh đầu được sản lượng +EVE_BUFF trong EVE_BUFF_TIME, mỗi người trong minh một thư báo hạng
export const EVE_CHEST_N = 7
// Thiên Thời (Tides of War của RoK): mùa băm thành nhịp THOI_DAYS ngày theo vòng ngũ hành tương sinh; mỗi thời một tăng ích chung cho
// cả giới (fx) và ba chỉ lệnh, mỗi tông môn chọn một cho riêng mình tới hết thời (picks)
export const THOI_DAYS = 4
export const THOI: { el: Element; fx: Partial<Record<Bonus, number>>; picks: Partial<Record<Bonus, number>>[] }[] = [
  { el: 'kim', fx: { 'atk.kiem': 0.15 }, picks: [{ atk: 0.05 }, { loot: 0.15 }, { march: 0.1 }] },
  { el: 'thuy', fx: { prod: 0.1 }, picks: [{ prod: 0.05 }, { storage: 0.15 }, { build: 0.05 }] },
  { el: 'moc', fx: { heal: 0.2 }, picks: [{ hp: 0.05 }, { hospital: 0.15 }, { train: 0.05 }] },
  { el: 'hoa', fx: { 'atk.phap': 0.15 }, picks: [{ atk: 0.05 }, { skill: 0.1 }, { exp: 0.1 }] },
  { el: 'tho', fx: { 'hp.the': 0.15 }, picks: [{ def: 0.05 }, { hp: 0.05 }, { brew: 0.1 }] },
]
// Thời thứ n của mùa (từ 0) vào ngày day, và lúc hết (ngày)
// Minh lệnh (Alliance Directives của RoK): mỗi thời Thiên Thời đường chủ / minh chủ ban một lệnh cho cả minh tới hết thời — Tổng
// Động Viên, Kiên Thủ, Khai Hoang, Tích Trữ, Cấp Hành, Cứu Thương
export const ALLY_ORDERS: { key: Bonus; v: number }[] = [
  { key: 'atk', v: 0.03 },
  { key: 'def', v: 0.03 },
  { key: 'gather', v: 0.1 },
  { key: 'prod', v: 0.05 },
  { key: 'march', v: 0.05 },
  { key: 'heal', v: 0.1 },
]
export const thoiAt = (day: number) => {
  const n = Math.floor(day / THOI_DAYS)
  return { n, ...THOI[n % THOI.length], end: (n + 1) * THOI_DAYS }
}
export const EVE_CHEST: Reward = { items: { thoiQuang60: 1, luyenBinh60: 1, thachNang5k: 1, kinhThu500: 1 } }
export const EVE_TOP = 3
export const EVE_BUFF = 0.1
export const EVE_BUFF_TIME = 24 * 3_600_000
export const eveFrags = (lv: number) => 1 + Math.floor((lv - 1) / 5)
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
// Trấn Tháp Các (Expedition Store của RoK): Tháp Lệnh — TOWER_COIN mỗi tầng tháp đã qua (kỷ lục, giữ qua luân hồi) và TOWER_CHEST_COIN
// × phần rương mỗi lần mở Tĩnh tọa ngộ đạo; đổi vật phẩm, mỗi món có hạn mỗi tuần. star: tín vật trưởng lão của tuần (TOWER_STARS xoay)
export const TOWER_COIN = 10
export const TOWER_CHEST_COIN = 5
export const TOWER_STARS: ElderId[] = ['macSau', 'diepCoThanh', 'bachVoNhai', 'hanBang', 'hoacThienCuong']
export const TOWER_SHOP: { r?: Reward; star?: number; price: number; week: number }[] = [
  { r: { items: { kinhThu2k: 1 } }, price: 40, week: 7 },
  { r: { items: { thoiQuang60: 1 } }, price: 60, week: 5 },
  { r: { items: { nganDuyen: 1 } }, price: 80, week: 3 },
  { star: 2, price: 150, week: 5 },
  { r: { items: { hoThe: 1, kimCuong: 1 } }, price: 160, week: 2 },
  { r: { items: { kimDuyen: 1 } }, price: 300, week: 1 },
  { r: { items: { vanNang2: 5 } }, price: 120, week: 2 },
]
// Thí Luyện Yêu Hoàng (Karuak Ceremony của RoK): trong lễ yeuHoang chọn độ khó (TRIAL_DIFF: Dễ → Địa ngục, chọn rồi không đổi
// trong lượt), TRIAL_GATES cửa đánh lần lượt bằng quân thật (thương binh về Đan phòng), mỗi trận tốn TRIAL_AP hành lực; sức cửa g =
// TOWER_STR × TRIAL_DIFF[d] × TRIAL_GROW^g, cửa thứ 10, 20… là yêu tướng tinh anh (×TRIAL_ELITE). Thắng: trưởng lão được kinh nghiệm,
// qua cửa, được 1 + d điểm Thí Luyện (chỉ số `trial`); mốc quà của lễ theo điểm trong lượt — khó hơn thì ít trận hơn cho cùng mốc
export const TRIAL_DIFF = [1, 2, 4, 8, 16]
export const TRIAL_GATES = 50
export const TRIAL_GROW = 1.06
export const TRIAL_ELITE = 1.5
export const TRIAL_AP = 10
export const TRIAL_EXP = 400
// Dạ Hành Đạo Tặc (Thief in the Night): mỗi ngày THIEF_TRIES lượt đội ảo, đạo tặc mạnh gấp THIEF_K đội đầy trận dung của người dẫn
export const THIEF_TRIES = 2
export const THIEF_K = 2.5
// Trảm Yêu Tốc Chiến (Race Against Time): mỗi ngày RACE_RUNS lượt đua RACE_MS; hạ yêu thú giới trong giờ ra điểm bằng cấp con đó,
// con từ cấp RACE_LV cộng thêm RACE_PLUS (tối đa tới RACE_MAX); không bắt đầu được trong RACE_LATE cuối lễ
// Hoàng Kim Mê Cảnh (Golden Kingdom): mê cung MAZE_FLOORS tầng, mỗi tầng MAZE_W × MAZE_W ô phủ sương; mở ô kề ô đã mở. Mỗi ngày một
// lượt với tối đa MAZE_TEAMS đội ảo (quân chụp lúc vào, không mất quân thật, không hồi giữa đường trừ suối linh). Ô: yêu binh
// (đánh), bảo rương, thần đàn (chọn một trong ba phúc), suối linh (hồi MAZE_SPRING phần đã mất), bẫy (mất MAZE_TRAP quân hiện có);
// mỗi tầng có một thủ lĩnh — hạ được thì xuống tầng sau. Địch mạnh theo lực chiến lúc vào của đội đánh × (hệ số tầng)
export const MAZE_FLOORS = 10
export const MAZE_W = 4
export const MAZE_TEAMS = 3
export const MAZE_KINDS = ['foe', 'gift', 'shrine', 'spring', 'trap', 'boss', 'start'] as const
export const MAZE_ODDS = [44, 20, 12, 14, 10] // trọng số ô thường (theo MAZE_KINDS, trừ thủ lĩnh / khởi điểm)
export const MAZE_FOE = [0.2, 0.05] // yêu binh: lực chiến lúc vào × (a + b × tầng)
export const MAZE_BOSS = [0.4, 0.08]
export const MAZE_SPRING = 0.4
export const MAZE_TRAP = 0.08
export const MAZE_BLESS: Record<string, { atk?: number; def?: number; hp?: number; mend?: number }> = {
  cong: { atk: 0.12 }, // Phá Quân: công
  thu: { def: 0.15 }, // Kim Cương: thủ
  sinh: { hp: 0.12 }, // Trường Sinh: máu
  hoi: { mend: 0.1 }, // Hồi Xuân: thắng trận hồi 10 % phần đã mất
  kiem: { atk: 0.06, def: 0.06 }, // Kiếm Tâm
  linh: { hp: 0.06, mend: 0.05 }, // Linh Tuyền
}
export const MAZE_GIFTS: Reward[] = [
  { items: { thoiQuang15: 2 } },
  { items: { thoiQuang60: 1 } },
  { items: { thachNang5k: 1 } },
  { items: { kinhThu500: 2 } },
  { items: { nganDuyen: 1 } },
]
export const RACE_RUNS = 3
export const RACE_MS = 10 * 60_000
export const RACE_MAX = 14 * 60_000
export const RACE_LV = 5
export const RACE_PLUS = 60_000
export const RACE_LATE = 30 * 60_000
// Phù văn (Runes của RoK): mỗi RUNE_CYCLE (theo giờ thế giới) quanh mỗi linh mạch / trận nhãn / Thiên Môn sinh một phù văn ở ô trống
// cách tối đa RUNE_R ô — vị trí, loại (RUNE_KINDS), phẩm (RUNE_TIERS: Bạch / Lục / Lam / Tử / Cam, vòng trong phẩm cao hơn) theo mầm bản
// đồ + chu kỳ. Xuất quân tới nhặt: tăng ích RUNE_HOURS giờ, mỗi lúc chỉ một phù văn (nhặt cái mới thay cái cũ); ai tới trước được.
export const RUNE_CYCLE = 12 * 3_600_000
// Thương Đội Gặp Nạn (Silk Road Speculators của RoK): trong kỳ lễ thuongDoi, mỗi GOODS_CYCLE (3 giờ — đủ để đi tới) quanh mỗi thôn trang có 1/GOODS_ODDS rơi một
// kiện hàng ở ô trống cách tối đa GOODS_R ô (tất định theo mầm bản đồ); ai xuất quân tới trước nhặt được — quà theo phẩm GOODS_GIFTS
export const GOODS_CYCLE = 3 * 3_600_000
export const GOODS_R = 2
export const GOODS_ODDS = 3
export const GOODS_GIFTS: Reward[] = [
  { items: { thachNang5k: 1, thaoNang5k: 1 } },
  { items: { thachNang20k: 1, thoiQuang60: 1 } },
  { items: { tuyTam20k: 1, thoiQuang180: 1, nganDuyen: 1 } },
]
export const RUNE_R = 2
export const RUNE_HOURS = 1
export const RUNE_KINDS: Bonus[] = ['atk', 'def', 'hp', 'gather', 'march', 'train']
export const RUNE_TIERS = [0.03, 0.07, 0.1, 0.15, 0.2]
// Tàng Bảo Đồ (Treasure Hunt của RoK): DIG_FRAGS tàn phiến ghép một bản đồ → một điểm đào ở ô trống trong DIG_R ô quanh tông môn (mầm
// server; ai cũng thấy trên bản đồ giới nhưng chỉ chủ bản đồ đào được), giữ tối đa DIG_MAX điểm; xuất quân tới đào → quà (DIG_LOOT theo
// trọng số, mầm của đội) qua thư, đội về ngay
export const DIG_FRAGS = 7
export const DIG_MAX = 3
export const DIG_R = 6
export const DIG_LOOT: { w: number; r: Reward }[] = [
  { w: 30, r: { items: { thoiQuang60: 2, thachNang5k: 1 } } },
  { w: 25, r: { items: { kinhThu2k: 2, thaoNang5k: 1 } } },
  { w: 20, r: { items: { thoiQuang180: 1, khoangNang5k: 1 } } },
  { w: 12, r: { items: { nganDuyen: 2 } } },
  { w: 8, r: { items: { thoiQuang480: 1, kinhThu8k: 1 } } },
  { w: 5, r: { items: { kimDuyen: 1, huongHoa200: 1 } } },
]
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
// Kho bảo hộ (Storehouse của RoK — theo tầng): PROTECT + PROTECT_STEP × tầng Tàng Bảo Các phần sức chứa kho; cướp RAID_SHARE phần vượt, mỗi đệ tử còn đứng mang về tối đa CARRY × sức bậc. Thủ thua được khiên SHIELD_TIME;
// đi đánh người khác thì mất khiên. Người mới có khiên NEWBIE_SHIELD. Bị đánh thì được báo thù trong REVENGE_TIME.
// Chữa thương đắt (40 % chi phí tuyển) nên đánh người đang giữ nhà là lỗ — PvP là cướp người vắng, đúng ý đồ.
// Thương nhẹ (slightly wounded của RoK): đội xuất quân về núi thì LIGHT phần thương binh tự lành, về đội luôn; còn lại vào Đan phòng
export const LIGHT = 0.3
export const PVP_HALL = 6
export const PVP_FLOOR = 0.5
export const PROTECT = 0.35
export const PROTECT_STEP = 0.01
export const RAID_SHARE = 0.3
export const CARRY = 40
export const SHIELD_TIME = 8 * 3_600_000
export const NEWBIE_SHIELD = 72 * 3_600_000
export const REVENGE_TIME = 24 * 3_600_000
export const FRENZY_TIME = 30 * 60_000 // cơn sát khí: vừa xuất quân cướp thì chừng ấy chưa dùng được Hộ Sơn Phù (War Frenzy)
// Do thám (Scout của RoK): thả một linh điểu tới tông môn khác (hai bên từ tầng PVP_HALL, không cùng phe / minh ước) — tốn SPY_COST ×
// tầng Chủ điện bên kia linh thạch, linh điểu bay đi về (CRANE_TIME mỗi ô sương mỗi chiều). Báo cáo qua thư ngay: tài nguyên ước
// cướp được, quân giữ nhà, viện binh, trấn thủ, trận lực, khiên. Bên kia nhận thư "bị do thám" (và Web Push)
export const SPY_COST = 200
// Huyễn Ảnh Phù: tông môn đang dùng thì báo cáo do thám ghi quân giữ nhà, lực chiến ×MIRAGE_SHOW, của cướp được ×MIRAGE_LOOT (nghi binh)
export const MIRAGE_SHOW = 2
export const MIRAGE_LOOT = 0.3
// Trận lực Hộ Sơn Đại Trận + linh hỏa thiêu sơn (độ bền tường, thành cháy, bị buộc dời thành của RoK): trận lực tối đa WALL_HP ×
// (1 + tầng Hộ Sơn Đại Trận). Thủ thua: mất WALL_HIT phần trận lực tối đa, núi bốc linh hỏa FIRE_TIME (thua tiếp thì cháy lại từ
// đầu); đang cháy mất FIRE_DRAIN phần mỗi phút, hết cháy thì tự hồi WALL_REGEN phần mỗi giờ. Tu bổ trận cơ: miễn phí mỗi
// MEND_COOL, hồi MEND_HP phần; Tức Hỏa Phù dập lửa ngay. Trận lực về 0 lúc đang cháy: sơn môn thất thủ — tông môn bị đánh bật
// sang chỗ trống ngẫu nhiên ở vùng ngoài (như lúc lập), lửa tắt, trận lực còn WALL_FALL phần.
export const WALL_HP = 500
export const WALL_HIT = 0.15
export const FIRE_TIME = 30 * 60_000
export const FIRE_DRAIN = 0.01
export const WALL_REGEN = 0.03
export const MEND_COOL = 30 * 60_000
export const MEND_HP = 0.1
export const WALL_FALL = 0.5
// Cướp khoáng (Attacked while gathering của RoK): đánh đội đang khai mỏ của tông môn khác — cùng điều kiện như cướp tông môn
// (tầng, chênh lực chiến, đồng minh / minh ước) nhưng khiên không che đội ngoài bản đồ; khai trong lãnh thổ minh mình thì an toàn.
// Thắng: lấy ROB_SHARE phần đội kia đã khai (không quá sức mang), đội kia về với phần còn lại, phần chưa khai trả về mỏ.
export const ROB_SHARE = 0.5
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
// Tranh Đoạt Linh Châu (Ark of Osiris giản lược — doc 6 mục 3.2 bước 2): 20h Chủ nhật giờ VN (ARK_DAY: 0 = thứ Hai), các tiên minh đã
// ghi danh ghép cặp theo điểm minh chiến; mỗi chiến binh một đội (đội đầu đội hình Luận Kiếm Đài, đệ tử ảo — không mất gì). Chiến
// trường 11 ô (ARK_ADJ). ARK_ROUNDS hiệp, mỗi hiệp
// ARK_ROUND: đội đi một ô về ô muốn tới, ô có hai bên thì đánh (bên giữ ô +ARK_HOLD_DEF thủ), bên thua về Linh Đài nghỉ một hiệp.
// Chiếm lần đầu / giữ mỗi hiệp ra điểm; hết hiệp ARK_ORB_AT Linh Châu hiện ở Trung Điện — mang về Tiểu Trận mình giữ (chưa nạp lần nào)
// thì nạp: +ARK_CHARGE (lần sau ×1,5), Châu về Trung Điện sau một hiệp. Hết hiệp cuối: minh nhiều điểm thắng.
export const ARK_DAY = 6
export const ARK_HOUR = 20
export const ARK_ROUND = 10 * 60_000
export const ARK_ROUNDS = 8 // chiến trường 11 ô: thêm hai hiệp cho đường dài hơn
export const ARK_ORB_AT = 2
export const ARK_MIN = 3
export const ARK_MAX = 15
export const ARK_HOLD_DEF = 0.1
// Chiến trường 11 ô (như bản đồ Ark of Osiris), minh A bên trái, minh B bên phải, đối xứng qua tâm (ô x ↔ ô 10 − x):
// 0 Linh Đài A · 1 Tụ Linh Nhãn Tây Bắc · 2 Linh Tháp Tây · 3 Tụ Linh Nhãn Tây Nam · 4 Tiểu Trận Bắc · 5 Trung Điện · 6 Tiểu Trận Nam ·
// 7 Tụ Linh Nhãn Đông Bắc · 8 Linh Tháp Đông · 9 Tụ Linh Nhãn Đông Nam · 10 Linh Đài B
export const ARK_ADJ = [
  [1, 2, 3],
  [0, 2, 4],
  [0, 1, 3, 5],
  [0, 2, 6],
  [1, 5, 7],
  [2, 4, 6, 8],
  [3, 5, 9],
  [4, 8, 10],
  [5, 7, 9, 10],
  [6, 8, 10],
  [7, 8, 9],
]
export const ARK_HOME = [0, 10] as const // Linh Đài của minh A / B
export const ARK_CENTER = 5 // Trung Điện: Linh Châu hiện ở đây
export const ARK_OUTPOSTS = [4, 6] // Tiểu Trận: nạp Linh Châu
export const ARK_OBELISKS = [1, 3, 7, 9] // Tụ Linh Nhãn: đội phe giữ đi thẳng giữa các Tụ Linh Nhãn phe mình trong một hiệp
export const ARK_SHRINES = [2, 8] // Linh Tháp: phe giữ mỗi tháp +ARK_SHRINE công ở mọi trận
export const ARK_SHRINE = 0.1
export const ARK_TAKE = [0, 60, 80, 60, 100, 200, 100, 60, 80, 60, 0]
export const ARK_HOLD = [0, 10, 15, 10, 20, 40, 20, 10, 15, 10, 0]
export const ARK_CHARGE = 400
export const ARK_WIN: Reward = { items: { thoiQuang180: 1, kimDuyen: 1, kinhThu2k: 2 } }
export const ARK_LOSE: Reward = { items: { thoiQuang60: 2, nganDuyen: 1 } }
// Cửu Thiên Luận Đạo Hội (Osiris League giản lược): cả mùa mỗi trận Linh Châu cộng điểm giải (thắng LEAGUE_WIN, thua LEAGUE_LOSE);
// hết mùa LEAGUE_PRIZES.length minh đầu — mọi người trong minh nhận quà theo hạng
export const LEAGUE_WIN = 3
// Vòng playoff (như Osiris League): trận Linh Châu áp chót của mùa là bán kết của LEAGUE_PLAYOFF minh đầu bảng giải (1–4, 2–3, không
// cần ghi danh); trận cuối mùa là chung kết (hai minh thắng) và tranh hạng ba (hai minh thua). Hết mùa quà giải theo hạng playoff.
export const LEAGUE_PLAYOFF = 4
export const LEAGUE_LOSE = 1
export const LEAGUE_PRIZES: Reward[] = [
  { items: { kimDuyen: 3, thoiQuang480: 2, huongHoa200: 1 } },
  { items: { kimDuyen: 2, thoiQuang480: 1 } },
  { items: { kimDuyen: 1, thoiQuang180: 2 } },
]
// Luận Kiếm Đặt Cược (League Bets của RoK): trước mỗi vòng playoff ai trong giới cũng cược Phi Thăng Tệ vào một bên mỗi trận, tối đa
// BET_MAX tệ một trận; đoán đúng nhận lại tệ × BET_ODDS của vòng (vòng sau hệ số thấp hơn), đoán sai được hoàn sau chung kết
export const BET_MAX = 50
export const BET_ODDS = { semi: 2, final: 1.5, third: 1.5 }
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
// Hồng Bao (Lucky Red Packet của RoK, không tiền thật): gửi ở kênh Giới / Tiên minh, PACKET_SHARES người đầu mở được, mỗi người một phần
// ngẫu nhiên của PACKET_TOTAL linh thạch (hệ thống trả — người gửi chỉ tốn Hồng Bao); quá PACKET_TTL thì phần còn lại tan
export const PACKET_SHARES = 5
export const PACKET_TOTAL = 20_000
export const PACKET_TTL = 24 * 3_600_000
// Kỳ tranh chấp linh mạch (Holy Sites của RoK): phe đang đóng quân giữ liên tục VEIN_HOLD thì thành phe kiểm soát (nhận tăng ích
// linh mạch). Linh mạch đã có phe kiểm soát chỉ tranh được trong kỳ — mở VEIN_OPEN mỗi VEIN_EVERY, lệch giờ riêng từng điểm; ngoài kỳ
// là bảo hộ, chỉ phe kiểm soát (và phe đang đóng quân) ra vào. Giữ đủ trong kỳ thì kiểm soát tới khi phe khác giữ đủ ở kỳ sau
export const VEIN_EVERY = 3 * 86_400_000
export const VEIN_OPEN = 12 * 3_600_000
export const VEIN_HOLD = 4 * 3_600_000
export const SEASON_RUIN = 120
export const SEASON_ALTAR = 180
export const HONOR_RUIN = 2
export const HONOR_ALTAR = 4
// Phi Thăng Tệ (Conquest Coins của RoK): mỗi COIN_PER Công Huân kiếm được (cả đời, không mất khi hết mùa) thành một đồng — tiêu ở
// Thiên Môn Thương Điếm, chưa tiêu thì mang sang mùa sau
export const COIN_PER = 20
// Thiên Mệnh Chọn Luật (thay ghép cặp / bỏ phiếu KvK của RoK): VOTE_DAYS ngày cuối mùa người trong giới chọn một luật cho mùa sau; hết mùa
// luật nhiều phiếu nhất (bằng phiếu: luật đứng trước) thành luật mùa mới — tăng ích cả giới suốt mùa. Phong Đăng · Sát Phạt · Hưng Thịnh
export const VOTE_DAYS = 3
export const RULES: Partial<Record<Bonus, number>>[] = [
  { prod: 0.1, gather: 0.1 },
  { atk: 0.05, loot: 0.1 },
  { build: 0.1, train: 0.1 },
  { atk: 0.05, march: 0.1 },
]
// Bát Phương Hỗn Chiến (Strife of the Eight của RoK): luật mùa thứ tư — ngoài tăng ích, Minh Ước mất hiệu lực cả mùa (không bất xâm
// phạm, không chung kết trận, không lập minh ước mới): minh nào cũng chỉ còn chính mình
export const RULE_FFA = 3
// Lưu Danh Sử Sách (Hall of Fame của RoK): VOTE_DAYS ngày cuối mùa (cùng khung Thiên Mệnh Chọn Luật) cả giới bình chọn anh kiệt mùa ở
// từng hạng mục — HERO_PICKS người dẫn đầu chỉ số mùa của hạng mục đó (chốt lúc mở bình chọn): chiến công, Công Huân, yêu thú hạ được,
// tài nguyên khai mỏ. Hết mùa người nhiều phiếu nhất mỗi hạng mục được ghi vào Phong Thần Bảng và nhận HERO_GIFT
export const HERO_KINDS = ['kp', 'honor', 'hunted', 'gathered'] as const
export const HERO_PICKS = 5
export const HERO_GIFT: Reward = { items: { kimDuyen: 2, thoiQuang480: 1 } }
// Danh hiệu mùa (State.honors, mã = mùa × 8 + loại): 0–3 anh kiệt từng hạng mục HERO_KINDS, HONOR_CUP quán quân Cửu Thiên,
// HONOR_SILVER / HONOR_BRONZE hạng 2 / 3 Công Huân cả giới (hạng 1 là crowns)
export const HONOR_CUP = 4
export const HONOR_SILVER = 5
export const HONOR_BRONZE = 6
export const honorOf = (code: number) => ({ season: Math.floor(code / 8), k: code % 8 })
// Giới Báo (Kingdom Newspaper của RoK): 0h mỗi ngày ra một số báo — người dẫn đầu hôm trước ở từng mục (PAPER_KINDS: khai mỏ, săn yêu,
// chiến công, cướp thắng) và tổng cả giới; giữ PAPER_KEEP số, bấm thích từng bài; đọc số hôm nay nhận PAPER_GIFT (mỗi ngày một lần)
export const PAPER_KINDS = ['gathered', 'hunted', 'kp', 'raided'] as const
export const PAPER_KEEP = 7
export const PAPER_GIFT: Reward = { items: { thoiQuang15: 1, kinhThu500: 1 } }
// Anh Linh Điện (Museum của Season of Conquest): trong mùa giới, từ Chủ điện RELIC_HALL, cung phụng di vật cho tối đa RELIC_MAX trưởng lão
// bằng Phi Thăng Tệ — mỗi bậc (1–3, giá RELIC_COST) thêm RELIC_BONUS cho đội người đó dẫn; hết mùa (luân hồi) di vật tan, tệ không hoàn
export const RELIC_HALL = 16
export const RELIC_MAX = 3
export const RELIC_COST = [30, 60, 120]
export const RELIC_BONUS: Partial<Record<Bonus, number>> = { atk: 0.05, def: 0.03, hp: 0.05 }
export const COIN_SHOP: { reward: Reward; price: number }[] = [
  { reward: { items: { kimDuyen: 1 } }, price: 60 },
  { reward: { items: { hoSon24: 1 } }, price: 35 },
  { reward: { items: { tuLinh24: 1 } }, price: 40 },
  { reward: { items: { thoiQuang480: 1 } }, price: 30 },
  { reward: { items: { kinhThu8k: 1 } }, price: 25 },
  { reward: { items: { daiTuKhi: 1 } }, price: 20 },
  { reward: { items: { huongHoa200: 1 } }, price: 25 },
  { reward: { items: { khuechTran8: 2 } }, price: 20 },
  { reward: { items: { chienY: 1, kimCuong: 1, hoThe: 1 } }, price: 30 },
  { reward: { items: { tucHoa: 2 } }, price: 15 },
  { reward: { items: { khaiLinh24: 1 } }, price: 30 },
  { reward: { items: { diSon: 1 } }, price: 15 },
  { reward: { items: { canKhon: 1 } }, price: 45 },
  { reward: { items: { tapDich48: 1 } }, price: 50 },
  { reward: { items: { caiDanh: 1 } }, price: 20 },
  { reward: { items: { tuyTam100k: 1 } }, price: 20 },
]
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
  { item: 'huongHoa50', n: 1, res: 'linhThao', price: 1000, w: 4 },
  { item: 'hanhLuc50', n: 1, res: 'linhKhoang', price: 600, w: 6 },
  { item: 'khuechTran8', n: 1, res: 'linhThach', price: 900, w: 3 },
  { item: 'sonHa12', n: 1, res: 'linhThao', price: 700, w: 4 },
  { item: 'anTung8', n: 1, res: 'linhKhoang', price: 800, w: 3 },
  { item: 'huyenAnh8', n: 1, res: 'linhKhoang', price: 900, w: 2 },
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
  | 'repair'
  | 'heaven'
// Tu Bổ Thiên Môn: góp REPAIR_HONOR tài nguyên thì được 1 Công Huân (chỉ lúc chương đang mở)
export const REPAIR_HONOR = 1000
// Công đầu Biên Niên: chương có chỉ số riêng từng người (khai mê vụ, chiến công, góp tu bổ) — xong chương thì BOOK_TOP người góp nhiều
// nhất nhận thêm quà theo hạng (1 · 2–3 · 4–10)
export const BOOK_TOP = 10
export const BOOK_TOP_PRIZES: Reward[] = [
  { items: { kimDuyen: 1, thoiQuang480: 1 } },
  { items: { nganDuyen: 2, thoiQuang180: 1 } },
  { items: { nganDuyen: 1, thoiQuang60: 1 } },
]
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
  { m: 'repair', n: 10_000_000, day: 40, reward: { items: { thoiQuang480: 1, tuLinh24: 1 } } }, // Tu Bổ Thiên Môn (Past Glory): cả giới góp tài nguyên
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
// Phóng Trục (Banish của vua RoK): Giới Chủ đẩy một tông môn (không cùng minh, không bế quan, mọi đội ở nhà) ra chỗ trống ngẫu nhiên
// ở vùng ngoài; BANISH_COOL mới phóng trục tiếp
export const BANISH_COOL = 24 * 3_600_000
// Chiếu Giới Chủ (Kingdom Announcement của RoK): Giới Chủ ban chiếu cho cả giới (tối đa DECREE_MAX chữ, qua bộ lọc chữ của server),
// hiện ở thẻ mùa trên bản đồ giới DECREE_TTL; ban lại phải chờ DECREE_COOL
export const DECREE_MAX = 160
export const DECREE_COOL = 3_600_000
export const DECREE_TTL = 3 * 86_400_000
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
// Luận Kiếm Đài · Thượng Tầng (Lost Canyon của RoK): tông môn từ Chủ điện ARENA_UPPER đấu ở tầng trên — đệ tử ảo bậc ARENA_UPPER_TIER,
// ghép đối thủ, bảng tuần và quà hạng tuần riêng với tầng dưới
export const ARENA_UPPER = 16
export const ARENA_UPPER_TIER: Tier = 5
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
  { item: 'tuyTam20k', n: 1, price: 150, week: 3 },
]
export const ARENA_TOP = 10 // thư quà hạng tuần: hạng 1 · 2–3 · 4–10
// Luận Kiếm Đại Hội (Sunset Canyon Tournament của RoK): từ ngày TOURNEY_DAY của mùa giới (tuần cuối), TOURNEY_N người điểm Luận Kiếm Đài
// cao nhất vào nhánh loại trực tiếp bằng đội hình thủ, mỗi ngày một vòng; quà theo chỗ đứng — Kiếm Khôi · á quân · bán kết · tứ kết
export const TOURNEY_DAY = 42
export const TOURNEY_N = 16
export const TOURNEY_PRIZES: Reward[] = [
  { items: { kimDuyen: 5, thoiQuang1440: 1, huongHoa200: 2 } },
  { items: { kimDuyen: 3, thoiQuang480: 2, huongHoa200: 1 } },
  { items: { kimDuyen: 2, thoiQuang480: 1 } },
  { items: { kimDuyen: 1, thoiQuang180: 1 } },
]
export const ARENA_PRIZES: Reward[] = [
  { items: { kimDuyen: 2, thoiQuang180: 1, kinhThu8k: 1 } },
  { items: { kimDuyen: 1, thoiQuang60: 2, kinhThu2k: 2 } },
  { items: { nganDuyen: 2, thoiQuang60: 1 } },
]
export const PVP_GATE = { x: 200, y: -60 } // tới P3 (bản đồ giới): đội đi cướp rời vùng qua mép trên bản đồ
export const GUARD_STEP = 0.04 // Hộ Sơn Đại Trận: thủ và máu bên thủ mỗi tầng
// Thiên Nhãn (Tháp canh của RoK, gộp vào Hộ Sơn Đại Trận): từ tầng EYE[0] thẻ báo đội đang kéo tới lộ trưởng lão dẫn, EYE[1] lộ quân
// số, EYE[2] lộ hệ chính. Trận lực còn thì kiếm trận chém trước trận WALL_VOLLEY mỗi tầng phần mỗi nhóm quân đánh tới (tính như thương
// vong của trận)
export const EYE = [3, 7, 12]
export const WALL_VOLLEY = 0.002
// Tỉ lệ thắng ước lượng coi là chắc thắng: giao diện báo "áp đảo"; bot và NPC chỉ đánh từ mức này
export const SURE_WIN = 0.8
export const CHAT_HALL = 3 // kênh giới mở từ tầng Chủ điện này
// Luận Đạo Bảng (threads của RoK): giữ BOARD_TOPICS chủ đề sôi nổi nhất, mỗi chủ đề BOARD_REPLIES lời cuối; tiêu đề / lời tối đa
// BOARD_TITLE / BOARD_TEXT chữ; mỗi người BOARD_COOL mới mở chủ đề tiếp, BOARD_REPLY_COOL giữa hai lời trả lời
export const BOARD_TOPICS = 30
export const BOARD_REPLIES = 40
export const BOARD_TITLE = 40
export const BOARD_TEXT = 200
export const BOARD_COOL = 30 * 60_000
export const BOARD_REPLY_COOL = 20_000

// Phân đà NPC: tà phái giữ vùng ngoài (server điều khiển, rules/bot.ts), NPC_PER mỗi vùng, chơi một lượt mỗi NPC_EVERY
// như người chơi thường. Lúc lập: Chủ điện NPC_HALL, trưởng lão cấp NPC_ELDER, NPC_TROOPS đệ tử bậc 2 mỗi hệ, NPC_RES mỗi loại.
export const NPC_PER = 2
export const NPC_EVERY = 4 * 3_600_000
export const NPC_HALL = 7
export const NPC_ELDER = 10
export const NPC_TROOPS = 120
export const NPC_RES = 20_000

// ---------- Tiên minh ----------

// Lập từ tầng ALLY_HALL (cùng lúc mở thẻ Tiên minh — giới mới chưa có minh nào thì người đầu tiên lập được ngay, như RoK lập lúc nào
// cũng được), tốn ALLY_COST mỗi loại (vừa kho đầu game). Tối đa ALLY_MAX người, 3 chức vị (thành viên · trưởng lão · minh chủ).
// Giúp đỡ: mỗi việc nhờ được giúp tối đa ALLY_HELPS lần, mỗi lần bớt max(HELP_MIN, HELP_SHARE × thời gian việc).
export const ALLY_HALL = 4
export const ALLY_COST = 5_000
// Minh chủ đổi tên / hiệu tiên minh (như RoK): tốn ALLY_RENAME Minh khố, cách nhau ít nhất ALLY_RENAME_COOL
// Minh trận thần thông (Alliance Skills của RoK): trưởng lão / minh chủ bật bằng Minh khố — cả minh được tăng ích trong hours giờ; hết hiệu
// lực thêm ALLY_SKILL_COOL mới bật lại được
export const ALLY_SKILLS = {
  tuLinh: { key: 'gather', v: 0.25, cost: 3000, hours: 8 }, // Đại Tụ Linh: khai mỏ nhanh
  loBan: { key: 'build', v: 0.1, cost: 3000, hours: 8 }, // Lỗ Ban Trận: xây nhanh
  luyenBinh: { key: 'train', v: 0.15, cost: 3000, hours: 8 }, // Luyện Binh Trận: tuyển nhanh
  thanHanh: { key: 'march', v: 0.1, cost: 3000, hours: 8 }, // Thần Hành Trận: hành quân nhanh
  kiemTran: { key: 'atk', v: 0.05, cost: 5000, hours: 2 }, // Kiếm Trận Sát Phạt: công
  hoSon: { key: 'def', v: 0.05, cost: 5000, hours: 2 }, // Hộ Sơn Kim Trận: thủ
} satisfies Record<string, { key: Bonus; v: number; cost: number; hours: number }>
export type AllySkillId = keyof typeof ALLY_SKILLS
export const ALLY_SKILL_IDS = Object.keys(ALLY_SKILLS) as AllySkillId[]
export const ALLY_SKILL_COOL = 24 * 3_600_000
export const ALLY_RENAME = 500
export const ALLY_RENAME_COOL = 7 * 86_400_000
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
export const ALLY_BADGE = [15, 8] // cờ minh (flag của RoK): số linh thú, số màu để chọn (client vẽ huy hiệu theo chỉ số)
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
  { items: { hanhLuc50: 1 } },
]
// Vấn Đạo Đài (Peerless Scholar của RoK): mỗi ngày QUIZ_DAY câu hỏi rút từ bộ câu (chữ ở i18n `quiz.q`, đáp án đúng ở đây theo
// thứ tự câu), trả lời lần lượt; xong thì quà theo số câu đúng (QUIZ_GIFTS[số đúng])
export const QUIZ_HALL = 3
export const QUIZ_DAY = 5
// Luận Đạo Vấn Đáp (Alliance Quiz): đếm ngược AQUIZ_WAIT, AQUIZ_N câu mỗi câu AQUIZ_Q; mốc tổng câu đúng cả minh AQUIZ_TIERS → quà
export const AQUIZ_WAIT = 60_000
export const AQUIZ_N = 10
export const AQUIZ_Q = 15_000
export const AQUIZ_TIERS = [10, 30, 60]
export const AQUIZ_PRIZES: Reward[] = [
  { items: { thoiQuang60: 2, kinhThu500: 2 } },
  { items: { thoiQuang180: 1, kinhThu2k: 1 } },
  { items: { thoiQuang480: 1, nganDuyen: 2 } },
]
export const QUIZ_KEY = [0, 2, 1, 3, 0, 1, 2, 0, 3, 1, 2, 0, 1, 3, 2, 1, 2, 0, 3, 1, 3, 0, 2, 1, 3, 0, 2]
export const QUIZ_GIFTS: Reward[] = [
  { items: { kinhThu500: 1 } },
  { items: { thoiQuang15: 1 } },
  { items: { thoiQuang15: 1, kinhThu500: 1 } },
  { items: { thoiQuang60: 1, kinhThu500: 1 } },
  { items: { thoiQuang60: 1, kinhThu2k: 1 } },
  { items: { thoiQuang60: 1, kinhThu2k: 1, nganDuyen: 1 } },
]
// Tông vụ (Side Quests của RoK): 4 dòng song song — công trình tài nguyên, công pháp, thắng trận, tuyển đệ tử — mỗi dòng hiện
// một việc (công thức ở sect/side.ts), nhận xong thì hiện việc kế; quà là phù tăng tốc / kinh thư vào túi, bậc theo việc thứ mấy
export const SIDE_LINES = ['linhMach', 'truyenCong', 'hangYeu', 'luyenBinh'] as const
export type SideLine = (typeof SIDE_LINES)[number]
export const SIDE_GIFTS: Record<SideLine, Reward[]> = {
  linhMach: [
    { items: { loBan15: 1 } },
    { items: { loBan60: 1 } },
    { items: { loBan180: 1 } },
    { items: { loBan480: 1 } },
    { items: { loBan480: 2 } },
  ],
  truyenCong: [
    { items: { ngoDao15: 1 } },
    { items: { ngoDao60: 1 } },
    { items: { ngoDao180: 1 } },
    { items: { ngoDao480: 1 } },
    { items: { ngoDao480: 2 } },
  ],
  hangYeu: [
    { items: { kinhThu500: 1 } },
    { items: { kinhThu2k: 1 } },
    { items: { kinhThu2k: 2 } },
    { items: { kinhThu8k: 1 } },
    { items: { kinhThu8k: 2 } },
  ],
  luyenBinh: [
    { items: { luyenBinh15: 1 } },
    { items: { luyenBinh60: 1 } },
    { items: { luyenBinh180: 1 } },
    { items: { luyenBinh480: 1 } },
    { items: { luyenBinh480: 2 } },
  ],
}
// Quà gắn email (tài khoản không mất khi đổi máy): một lần, server gửi qua thư ngay khi gắn
export const LINK_GIFT: Reward = { items: { kimDuyen: 1, thoiQuang60: 2, hoSon8: 1, caiDanh: 1 } }
// Bế Quan Lệnh (Vacation Permit của RoK): bế quan SECLUDE_DAYS ngày — không ai cướp được, nhưng chỉ làm được SECLUDE_OK; xuất quan
// xong SECLUDE_COOL mới bế quan lại
export const SECLUDE_DAYS = [3, 7, 14]
export const SECLUDE_COOL = 3 * 86_400_000
export const SECLUDE_OK: readonly string[] = ['unseclude', 'login', 'seen', 'mail']
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
// Linh mạch cho cả tiên minh (hoặc người giữ một mình) tăng ích +VEIN_BUFF theo cấp; hai điểm cùng loại tăng ích không cộng dồn
// (lấy mức cao nhất — như thánh địa của RoK).
export const GARRISON_MAX = 6
export const VEIN_BUFF = [0.03, 0.05, 0.08] // theo cấp điểm 1..3 (vòng ngoài, giữa, tâm)
// Thần miếu tứ tượng (Shrine của RoK): mỗi vùng giữa một linh mạch là miếu, tăng ích kép — Huyền Vũ (thủ + sinh lực), Chu Tước
// (khai mỏ + trận dung), Thanh Long (chữa thương + chỗ nằm), Bạch Hổ (công + tuyển)
export const SHRINES: { key: Bonus; v: number }[][] = [
  [
    { key: 'def', v: 0.03 },
    { key: 'hp', v: 0.03 },
  ],
  [
    { key: 'gather', v: 0.05 },
    { key: 'cap', v: 0.05 },
  ],
  [
    { key: 'heal', v: 0.2 },
    { key: 'hospital', v: 0.2 },
  ],
  [
    { key: 'atk', v: 0.03 },
    { key: 'train', v: 0.1 },
  ],
]
// Chiếm lần đầu trong mùa (first-capture của Lost Kingdom): linh mạch / trận nhãn / Thiên Môn lần đầu có tiên minh giữ thì mọi người
// trong minh nhận quà qua thư (mỗi điểm một lần mỗi mùa), theo cấp điểm 1..3
// Hộ trận linh thú (holy-site guardians của RoK): linh mạch / trận nhãn / Thiên Môn chưa ai thuần phục có đội linh thú giữ —
// đánh bại (một đội hay kết trận) mới chiếm được lần đầu trong mùa; bại thì linh thú không hồi (tới mùa sau). [sức, bậc] theo cấp
export const GUARDIANS: Partial<Record<'vein' | 'gate' | 'heaven', [str: number, tier: 1 | 2 | 3 | 4 | 5][]>> = {
  vein: [
    [600, 2],
    [3000, 3],
    [10_000, 4],
  ],
  gate: [
    [1200, 2],
    [5000, 3],
    [14_000, 4],
  ],
  heaven: [
    [40_000, 5],
    [40_000, 5],
    [40_000, 5],
  ],
}
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
// Man Hoang Cổ Tộc (Ceroli Crisis của RoK, giản lược): phó bản tổ đội của tiên minh — một người mở phòng (chọn độ khó 1–5 và
// vai), người trong minh vào trong PARTY_WAIT (tối đa PARTY_MAX, mỗi người mỗi ngày một lần). Đủ người hay hết giờ chờ thì cả đội
// (đội đầu đội hình Luận Kiếm Đài của từng người, đệ tử ảo — không mất quân) đánh PARTY_WAVES đợt hung thú mạnh dần, quân không
// hồi (trừ vai Trị Liệu). Vai: Hộ Pháp (cả đội thủ, máu), Chủ Công (công, tối đa hai người tính), Trị Liệu (hồi một phần quân ngã
// sau mỗi đợt, tối đa hai người tính). Quà theo độ khó và số đợt qua, cho mọi người trong đội qua thư.
// Minh sự lịch (Alliance Schedule / RSVP của RoK): trưởng lão / minh chủ hẹn giờ việc chung (trước tối đa PLAN_AHEAD), tối đa
// PLAN_MAX việc sắp tới, lời nhắn ≤ PLAN_TEXT chữ; người trong minh bấm Tham gia, PLAN_WARN trước giờ server nhắc người đã tham gia
export const PLAN_MAX = 5
export const PLAN_AHEAD = 7 * 86_400_000
export const PLAN_TEXT = 60
export const PLAN_WARN = 10 * 60_000
export const PARTY_HALL = 8
export const PARTY_MAX = 4
export const PARTY_WAIT = 10 * 60_000
export const PARTY_WAVES = 5
export const PARTY_MIGHT = [2500, 5000, 9000, 14000, 20000] // lực chiến đợt đầu mỗi độ khó
export const PARTY_GROW = 1.25
export const PARTY_ROLES = { hoPhap: { def: 0.15, hp: 0.1 }, chuCong: { atk: 0.12 }, triLieu: { heal: 0.2 } } as const
export type PartyRole = keyof typeof PARTY_ROLES
export function partyGift(lv: number, waves: number): Reward {
  if (!waves) return { items: { kinhThu500: 1 } } // có đi là có chút quà
  const speed = (['thoiQuang15', 'thoiQuang60', 'thoiQuang60', 'thoiQuang180', 'thoiQuang180'] as const)[lv - 1]
  const book = (['kinhThu500', 'kinhThu2k', 'kinhThu2k', 'kinhThu8k', 'kinhThu8k'] as const)[lv - 1]
  const items: Partial<Record<ItemId, number>> = { [speed]: waves, ...(waves >= 3 && { [book]: 1 }) }
  if (waves >= PARTY_WAVES) items[lv >= 4 ? 'kimDuyen' : 'nganDuyen'] = 1
  return { items }
}
// Linh Thương Hộ Tống (Silk Road Speculators của RoK, giản lược): trưởng lão / minh chủ tốn CONVOY_COST Minh khố cho đoàn buôn độ khó
// lv khởi hành (qua độ khó trước mới mở độ khó sau — theo điểm cao nhất của minh); trong CONVOY_WAIT người trong minh ghi danh hộ tống
// (đội đầu Luận Kiếm Đài, không mất quân; tối đa CONVOY_MAX người, mỗi người mỗi ngày một chuyến); hết giờ server giải: cả đoàn gộp một
// bên đánh CONVOY_WAVES đợt tà tu (lực chiến CONVOY_MIGHT[lv] × CONVOY_GROW^đợt), quân không hồi; thua một đợt thì giặc còn sống cướp tới
// CONVOY_HIT % hàng. Điểm chuyến = độ khó × 100 + % hàng còn (minh giữ điểm cao nhất); người hộ tống nhận quà theo độ khó và % hàng
export const CONVOY_HALL = 8
export const CONVOY_COST = [500, 800, 1200, 1800, 2500, 3200, 4000, 5000]
export const CONVOY_WAIT = 20 * 60_000
export const CONVOY_MAX = 15
export const CONVOY_WAVES = 3
export const CONVOY_MIGHT = [4000, 9000, 18000, 36000, 70000, 130000, 240000, 420000] // lực chiến đợt đầu mỗi độ khó (cả đoàn)
export const CONVOY_GROW = 1.25
export const CONVOY_HIT = 50
export function convoyGift(lv: number, hp: number): Reward {
  if (hp <= 0) return { items: { kinhThu500: 1 } } // có đi là có chút quà
  const speed =
    (['thoiQuang15', 'thoiQuang60', 'thoiQuang60', 'thoiQuang180', 'thoiQuang180'] as const)[lv - 1] ?? 'thoiQuang480'
  const items: Partial<Record<ItemId, number>> = { [speed]: hp >= 100 ? 3 : hp >= 50 ? 2 : 1 }
  if (hp >= 100) items[lv >= 4 ? 'kimDuyen' : 'nganDuyen'] = lv >= 7 ? 2 : 1
  return { items }
}
// Yêu Vương Tuần Sơn (Lohar's Trial của RoK): yêu thú giới cấp LOHAR_WILD+ rơi yêu cốt (cấp 11+ rơi 2); đủ LOHAR_BONES thì triệu
// hồi một yêu vương đang sống thành bản Tuần Sơn — máu ×LOHAR_HP, tồn tại LOHAR_TIME. Hạ được: ngoài quà thường còn LOHAR_GIFT chia
// theo sát thương (ai góp từ 5 % được ít nhất một món), người triệu hồi thêm LOHAR_SUMMONER. Hết giờ chưa hạ: trở lại yêu vương thường.
// Tụ Bảo Minh Đỉnh (rương liên minh ngày lễ của RoK): mỗi tuần người trong minh góp tài nguyên vào đỉnh hương (POT_RATE tài nguyên
// = 1 điểm); đỉnh đầy mỗi POT_FULL điểm — ai đã góp từ POT_MIN điểm tuần này mở được một rương cho mỗi lần đầy, tối đa POT_MAX
export const POT_RATE = 1000
export const POT_FULL = 600
export const POT_MIN = 30
export const POT_MAX = 10
export const POT_CHEST: Reward = { items: { thoiQuang60: 1, nganDuyen: 1, thachNang5k: 1 } }
export const LOHAR_WILD = 6
export const LOHAR_BONES = 10
export const LOHAR_HP = 2
export const LOHAR_TIME = 2 * 3_600_000
export const LOHAR_GIFT: Reward = { items: { kimDuyen: 2, thoiQuang480: 2 } }
export const LOHAR_SUMMONER: Reward = { items: { kimDuyen: 1 } }
export const boneOf = (lv: number) => (lv >= 11 ? 2 : lv >= LOHAR_WILD ? 1 : 0)
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
// Thôn Trang Gặp Nạn (Strange Incidents của RoK): trong kỳ lễ thonTrang, mỗi giờ chừng 1/NAN_ODDS thôn trang bị tà tu đốt (ai
// cũng thấy như nhau). Ghé thôn đang cháy trong vùng đã khai nhận một việc cứu nạn (theo thôn và giờ), làm xong trong NAN_TIME
// thì báo công: NAN_GIFT + một lượt cứu nạn (chỉ số `rescue`, ra Hộ Thôn Lệnh). Mỗi lúc một việc, mỗi ngày tối đa NAN_DAY việc.
export const NAN_ODDS = 3
export const NAN_TIME = 2 * 3_600_000
export const NAN_DAY = 15
export const NAN_TASKS: { m: Metric; n: number }[] = [
  { m: 'train', n: 60 },
  { m: 'hunt', n: 2 },
  { m: 'gather', n: 15_000 },
  { m: 'heal', n: 30 },
  { m: 'brew', n: 2 },
  { m: 'speed', n: 60 },
  { m: 'win', n: 3 },
  { m: 'ally', n: 3 },
]
export const NAN_GIFT: Reward = { items: { hanhLuc50: 1 } }
// Dời núi tân thủ (Beginner's Teleport): trước Chủ điện tầng NEWBIE_MOVE_HALL, lần dời đầu tiên được tới mọi ô trống vùng ngoài
export const NEWBIE_MOVE_HALL = 8
// Trận kỳ (Alliance Flag của RoK): trưởng lão / minh chủ cắm trong lãnh thổ minh mình, tốn FLAG_COST Minh khố; dựng xong sau
// FLAG_BUILD thì nới lãnh thổ bán kính FLAG_R. Mỗi minh tối đa FLAG_BASE + 1 mỗi FLAG_PER người (trần FLAG_MAX); cách điểm,
// tông môn, trận kỳ khác từ FLAG_GAP ô.
export const FLAG_R = 4
// Tổng đà (Alliance Center / Fortress của RoK): trưởng lão / minh chủ dựng trong lãnh thổ minh mình khi minh có ≥ FORT_MIN người,
// tốn FORT_COST Minh khố, dựng xong sau FORT_BUILD; mỗi minh một Tổng đà (không tính vào số trận kỳ). Xong thì nới lãnh thổ bán
// kính FORT_R, độ bền FORT_HP (bị phá, được giữ như trận kỳ), người trong minh có FORT_BUFFS (nguồn "fort").
export const FORT_MIN = 5
export const FORT_COST = 3000
export const FORT_BUILD = 6 * 3_600_000
export const FORT_R = 7
export const FORT_HP = 150_000
export const FORT_BUFFS: { key: Bonus; v: number }[] = [
  { key: 'def', v: 0.03 },
  { key: 'hp', v: 0.03 },
  { key: 'march', v: 0.05 },
]
// Phân đà (Alliance Fortress thứ hai trở đi của RoK): minh đông người dựng thêm — mỗi FORT_PER người thêm một (trần FORT_MAX,
// tính cả Tổng đà), cái thứ n tốn FORT_COST × n Minh khố; nới lãnh thổ như Tổng đà, tăng ích không cộng dồn.
export const FORT_PER = 10
export const FORT_MAX = 3
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
// Minh khoáng (Alliance Resource Center của RoK): trưởng lão / minh chủ dựng ở ô trống trong lãnh thổ minh mình (như trận kỳ,
// không nới lãnh thổ), mỗi minh một cái, chọn loại tài nguyên; tốn ALLY_MINE_COST Minh khố, dựng ALLY_MINE_BUILD. Xong thì kho
// ALLY_MINE_STOCK, người trong minh khai ALLY_MINE_RATE mỗi giờ mỗi đội (hơn mỏ thường), không ai cướp được; cạn hay quá
// ALLY_MINE_LIFE sau khi dựng xong thì tự tháo.
export const ALLY_MINE_COST = 2000
export const ALLY_MINE_BUILD = 2 * 3_600_000
export const ALLY_MINE_STOCK = 3_000_000
export const ALLY_MINE_RATE = 30_000
export const ALLY_MINE_LIFE = 3 * 86_400_000
// Góp quân xây: đội đóng ở trận kỳ / Tổng đà đang dựng làm dựng nhanh hơn — mỗi BUILD_PER đệ tử thêm một lần tốc, trần
// ×BUILD_MAX; đội gọi về thì chậm lại. Dựng xong thì đội ở lại giữ.
export const BUILD_PER = 1000
export const BUILD_MAX = 4
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
// Lễ có xếp hạng (Tông Môn Tranh Bá — Mightiest Governor, Trảm Yêu Lệnh — Clarion Call): hết lượt lễ, top FEST_TOP điểm lễ của giới
// nhận thư quà theo hạng (1 · 2–3 · 4–10)
export const FEST_RANKED = [
  'tranhBa',
  'tramYeu',
  'tichCoc',
  'gioiChu',
  'daTac',
  'tocChien',
  'thuLuc',
  'luyenBinhPhu',
  'apTieu',
] as const
// Trưởng lão của đợt (MGE: mỗi tướng thưởng 4 lượt liền rồi đổi): top FEST_STAR_TOKENS.length của lượt lễ nhận tín vật người đó theo hạng
export const FEST_STAR: Partial<Record<FestId, ElderId[]>> = {
  tranhBa: ['hanBang', 'bachVoNhai', 'macSau', 'hoacThienCuong', 'diepCoThanh'],
}
export const FEST_STAR_TOKENS = [30, 20, 20, 10, 10, 10, 10, 10, 10, 10]
// Điểm tuyển mỗi đệ tử theo bậc 1…5 (MGE: 5 / 10 / 20 / 40 / 100, chia 5)
export const TRAIN_PTS = [1, 2, 4, 8, 20]
// Bảng tiên minh (Clarion Call): tổng điểm lễ người trong minh; hết lượt, mọi người có điểm trong FEST_ALLY_PRIZES.length minh đầu nhận
// quà theo hạng minh
export const FEST_ALLY = ['tramYeu'] as const
export const FEST_ALLY_PRIZES: Reward[] = [
  { items: { kinhThu8k: 1, chienY: 1, kimCuong: 1 } },
  { items: { kinhThu2k: 2, chienY: 1 } },
  { items: { kinhThu2k: 1, kimCuong: 1 } },
]
export const FEST_TOP = 10
export const FEST_PRIZES: Reward[] = [
  { items: { kimDuyen: 2, thoiQuang480: 2, hoSon24: 1 } },
  { items: { kimDuyen: 1, thoiQuang480: 1, thoiQuang180: 2 } },
  { items: { nganDuyen: 2, thoiQuang180: 1, thoiQuang60: 2 } },
]
// Xếp hạng từng ải (Stage Rankings của MGE): lễ FEST_STAGED — hết mỗi ải (qua 0h), top FEST_TOP điểm của riêng ải đó nhận quà ải qua
// thư theo hạng (1 · 2–3 · 4–10); quà cả lượt vẫn theo FEST_PRIZES
export const FEST_STAGED = ['tranhBa'] as const
export const FEST_STAGE_PRIZES: Reward[] = [
  { items: { nganDuyen: 1, thoiQuang180: 1, thoiQuang60: 1 } },
  { items: { thoiQuang60: 2, thoiQuang15: 2 } },
  { items: { thoiQuang60: 1, thoiQuang15: 1 } },
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
  power: { m: 'power', tiers: [5000, 20000, 50000, 120000, 250000] }, // mốc thế lực dài hạn
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
// Ngộ công pháp (Skill Upgrade của RoK): tín vật của trưởng lão, lần ngộ thứ k tốn SKILL_COST[k] (chuỗi tượng tướng huyền thoại, 16 lần cho
// người 3 tâm pháp); mầm server chọn ngẫu nhiên một môn đã mở (công pháp luôn mở, tâm pháp mở theo cấp) chưa tới tầng SKILL_MAX lên một tầng. Công pháp mỗi tầng trên 1: sức công pháp +SKILL_LV_POWER;
// tâm pháp: hiệu lực ×(1 + PASSIVE_LV × (tầng − 1)). Mọi môn đều tầng cuối: Bản Mệnh Thần Thông (EXPERTISE, đội người đó dẫn).
export const SKILL_MAX = 5
export const SKILL_COST = [10, 10, 15, 15, 30, 30, 40, 40, 45, 45, 50, 50, 75, 75, 80, 80]
// Truyền công (Commander Swap của RoK): trong lễ Truyền Công Đại Hội đổi tầng công pháp đã ngộ giữa hai trưởng lão cùng phẩm, cùng số
// tâm pháp — tốn TRUYEN_MIN Truyền Công Phù, cộng TRUYEN_PER mỗi tầng chênh lệch giữa hai người
export const TRUYEN_MIN = 2
export const TRUYEN_PER = 4
export const SKILL_LV_POWER = 0.08
export const PASSIVE_LV = 0.25
export const EXPERTISE: Partial<Record<Bonus, number>> = { atk: 0.05, def: 0.05, hp: 0.05, skill: 0.1 }
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

// ---------- Tu Tiên Lệnh (Lucerne Scroll — thẻ mùa, doc 6 F1) ----------

// Cả mùa giới: mỗi rương Nhật Khóa +PASS_CHEST điểm lệnh, mỗi việc nhiệm vụ tuần +PASS_WEEK; mỗi PASS_STEP điểm lên một cấp (tối đa
// PASS_LEVELS), mỗi cấp một quà nhánh thường. Kim Lệnh (Hương Hỏa từ PASS_VIP — không bán) thêm một quà mỗi cấp, nhận bù cả những cấp
// đã qua. Hết mùa (luân hồi / phi thăng) lệnh làm lại từ đầu, quà chưa nhận mất.
export const PASS_HALL = 3
export const PASS_STEP = 100
export const PASS_LEVELS = 50
export const PASS_CHEST = 20
export const PASS_WEEK = 30
export const PASS_VIP = 5
// quà cấp lv (1…PASS_LEVELS): mỗi 10 cấp rương lớn, mỗi 5 cấp rương vừa, còn lại xoay vòng; tài nguyên là nang (xoay ba loại)
const NANG = ['thachNang5k', 'thaoNang5k', 'khoangNang5k'] as const
const NANG_BIG = ['thachNang20k', 'thaoNang20k', 'khoangNang20k'] as const
export const PASS_FREE: Reward[] = Array.from({ length: PASS_LEVELS }, (_, i) => {
  const lv = i + 1
  if (lv % 10 === 0) return { items: { kimDuyen: 1, thoiQuang180: 1, [NANG_BIG[(lv / 10) % 3]]: 1 } }
  if (lv % 5 === 0) return { items: { nganDuyen: 1, kinhThu2k: 1 } }
  const small: Reward[] = [
    { items: { thoiQuang15: 2 } },
    { items: { [NANG[lv % 3]]: 1 } },
    { items: { kinhThu500: 2 } },
    { items: { luyenBinh60: 1 } },
  ]
  return small[lv % 4]
})
export const PASS_GOLD: Reward[] = Array.from({ length: PASS_LEVELS }, (_, i) => {
  const lv = i + 1
  if (lv === PASS_LEVELS) return { items: { kimDuyen: 3, huongHoa200: 1 } }
  if (lv % 10 === 0) return { items: { kimDuyen: 1, tuLinh24: 1 } }
  if (lv % 5 === 0) return { items: { thoiQuang60: 2, chienY: 1 } }
  const small: Reward[] = [
    { items: { loBan60: 1 } },
    { items: { thoiQuang15: 3 } },
    { items: { kinhThu2k: 1 } },
    { items: { [NANG[(lv + 1) % 3]]: 2 } },
  ]
  return small[lv % 4]
})

// Quà mừng Chủ điện lên tầng (City Hall rewards của RoK): mỗi tầng một phần qua thư; tầng đột phá cảnh giới (sau độ kiếp, TRIBS) thêm lễ
// đột phá (Kim Duyên, Thời Quang 8 giờ)
export const hallGift = (lv: number): Reward => {
  const big = TRIBS.some(t => t.hall + 1 === lv)
  const nang = lv >= 15 ? 'thachNang20k' : 'thachNang5k'
  return {
    items: {
      thoiQuang60: 1 + Math.floor(lv / 5),
      [nang]: 1,
      ...(lv >= 8 && { kinhThu2k: 1 }),
      ...(big && { kimDuyen: 1, thoiQuang480: 1 }),
    },
  }
}
// Hồi Quy Lễ (quà người chơi cũ quay lại): vắng từ RETURN_AWAY trở lên, lần vào game đầu tiên nhận thư quà (theo tầng Chủ điện)
export const RETURN_AWAY = 7 * 24 * 3_600_000
export const RETURN_GIFT: Reward = { hallRes: 300, items: { thoiQuang180: 2, kinhThu2k: 2, nganDuyen: 1, hoSon24: 1 } }
// Cố Nhân Tương Phùng (mời người cũ quay lại — doc 7 D9): đạo hữu vắng từ RECALL_DAYS ngày thì "Gọi về" được (thư tới họ); họ quay
// lại trong RECALL_TTL thì người quay lại nhận RECALL_GIFT, mỗi người đã gọi nhận RECALL_THANKS (tối đa RECALL_MAX lần mỗi mùa)
export const RECALL_DAYS = 7
export const RECALL_TTL = 14 * 86_400_000
export const RECALL_MAX = 3
export const RECALL_GIFT: Reward = { items: { kimDuyen: 1, thoiQuang480: 1, tuLinh24: 1 } }
export const RECALL_THANKS: Reward = { items: { kimDuyen: 1, thoiQuang180: 2 } }

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
// Việc đang chờ còn dưới chừng ấy phút thì xong ngay miễn phí (như "free speedup" của RoK: ai cũng có, Hương Hỏa nới thêm). Nhỏ
// vì nhịp bị giới hạn bởi số lần xây mỗi phiên (PLAN mục 5): miễn phí 30 phút như RoK làm bot giỏi tới Chủ điện 25 sớm hơn 4 ngày
export const VIP_FREE = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 8]
// Người mới (Chủ điện dưới NEWBIE_FREE_HALL) ai cũng có NEWBIE_FREE phút miễn phí — như RoK dạy nút "Miễn phí" từ đầu game.
// Cho mọi người 1 phút thì nhịp nhanh lên ~2 ngày (sim), nên chỉ tới lúc hết giai đoạn tân thủ
export const NEWBIE_FREE = 1
export const NEWBIE_FREE_HALL = 4
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

// Lễ vật tấn cấp (Special Privilege Chest của RoK): mỗi cấp Hương Hỏa một lễ vật mua đúng một lần, giá = price × tầng Chủ điện linh
// thạch (không tiền thật), quà đáng hơn giá nhiều; chỉ số theo cấp (0 bỏ trống)
export const VIP_GIFTS: { price: number; reward: Reward }[] = [
  { price: 0, reward: {} },
  { price: 300, reward: { items: { thoiQuang60: 2, tuyTam5k: 2 } } },
  { price: 500, reward: { items: { nganDuyen: 2, thoiQuang60: 2 } } },
  { price: 800, reward: { items: { tapDich48: 1, loBan180: 1 } } },
  { price: 1200, reward: { items: { thoiQuang180: 2, tuyTam20k: 2 } } },
  { price: 1600, reward: { items: { kimDuyen: 1, hoSon24: 1 } } },
  { price: 2000, reward: { items: { thoiQuang480: 1, kinhThu8k: 2 } } },
  { price: 2500, reward: { items: { kimDuyen: 2, tuyTam20k: 3 } } },
  { price: 3000, reward: { items: { thoiQuang480: 2, luyenBinh480: 1 } } },
  { price: 3600, reward: { items: { kimDuyen: 3, huongHoa200: 1 } } },
  { price: 4200, reward: { items: { thoiQuang1440: 1, tuyTam100k: 1 } } },
  { price: 5000, reward: { items: { kimDuyen: 4, thoiQuang480: 2 } } },
  { price: 6000, reward: { items: { kimDuyen: 5, thoiQuang1440: 2 } } },
]
// Hương Hỏa Các (VIP Store của RoK, mua bằng tài nguyên — không bán tiền thật): món mở từ cấp Hương Hỏa `lv`, mỗi tuần mua tối
// đa `week` lần (thứ Hai làm mới như RoK), giá = price × tầng Chủ điện bằng một loại tài nguyên — rẻ hơn Thương nhân vân du,
// vài món chỉ bán ở đây (Tạp Dịch Lệnh, Di Sơn / Càn Khôn Phù, Kim Duyên Phù)
export const VIP_SHOP: { item: BagId; n: number; res: Res; price: number; lv: number; week: number }[] = [
  { item: 'thoiQuang15', n: 2, res: 'linhThach', price: 250, lv: 1, week: 10 },
  { item: 'hanhLuc50', n: 1, res: 'linhKhoang', price: 400, lv: 1, week: 10 },
  { item: 'loBan60', n: 1, res: 'linhThao', price: 450, lv: 2, week: 5 },
  { item: 'luyenBinh60', n: 1, res: 'linhThach', price: 400, lv: 3, week: 5 },
  { item: 'tuLinh8', n: 1, res: 'linhThao', price: 500, lv: 3, week: 3 },
  { item: 'kinhThu2k', n: 1, res: 'linhKhoang', price: 350, lv: 4, week: 5 },
  { item: 'anTung8', n: 1, res: 'linhKhoang', price: 600, lv: 4, week: 2 },
  { item: 'thoiQuang60', n: 1, res: 'linhKhoang', price: 550, lv: 5, week: 5 },
  { item: 'hoSon8', n: 1, res: 'linhThach', price: 1000, lv: 5, week: 2 },
  { item: 'nganDuyen', n: 1, res: 'linhThach', price: 700, lv: 6, week: 3 },
  { item: 'diSon', n: 1, res: 'linhThao', price: 1500, lv: 6, week: 2 },
  { item: 'tapDich48', n: 1, res: 'linhKhoang', price: 3000, lv: 7, week: 2 },
  { item: 'hoSon24', n: 1, res: 'linhThach', price: 2500, lv: 8, week: 1 },
  { item: 'thoiQuang180', n: 1, res: 'linhKhoang', price: 1500, lv: 9, week: 3 },
  { item: 'canKhon', n: 1, res: 'linhThao', price: 4000, lv: 10, week: 1 },
  { item: 'kimDuyen', n: 1, res: 'linhThach', price: 5000, lv: 11, week: 1 },
  { item: 'tuLinh24', n: 1, res: 'linhThao', price: 1500, lv: 12, week: 2 },
  { item: 'huyenAnh8', n: 1, res: 'linhKhoang', price: 700, lv: 5, week: 2 },
  { item: 'vanNang3', n: 1, res: 'linhThach', price: 2500, lv: 7, week: 3 },
  { item: 'vanNang4', n: 1, res: 'linhThach', price: 6000, lv: 10, week: 2 },
  { item: 'hoanNguyen', n: 1, res: 'linhThach', price: 3000, lv: 8, week: 1 },
]

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
  'trainPts', // điểm tuyển theo bậc (TRAIN_PTS; nâng bậc: phần chênh — Tông Môn Tranh Bá như MGE)
  'heal', // thương binh chữa xong
  'brew', // đan luyện xong
  'win', // trận thắng
  'hunt', // yêu thú hạ được
  'huntLv', // tổng cấp yêu thú hạ được (sơn môn lẫn bản đồ giới — Trảm Yêu Lệnh chấm theo cấp)
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
  'chain', // yêu thú giới hạ bằng săn liên hoàn (không về núi giữa các trận)
  'rescue', // việc cứu nạn Thôn Trang Gặp Nạn đã báo công
  'runes', // phù văn đã nhặt
  'guards', // trận thắng hộ trận linh thú
  'trial', // điểm Thí Luyện Yêu Hoàng
  'kiem2', // đệ tử Kiếm tu bậc 2 trở lên tuyển / nâng bậc xong
  'phap2', // … Pháp tu
  'the2', // … Thể tu
  'train2', // đệ tử bậc 2 trở lên tuyển / nâng bậc xong (cả ba hệ)
  'drain', // mỏ trên bản đồ giới khai cạn
  'forts', // lần góp sức hạ yêu vương giới
  'speedTrain', // phút tăng tốc dùng cho việc tuyển đệ tử
  'goods', // kiện hàng Thương Đội Gặp Nạn đã nhặt
  'bought', // lần mua ở Thương nhân vân du
] as const
export type Metric = (typeof METRICS)[number]
// Khung giờ: newbie — ngày thứ from..to (0 = ngày lập tông môn) · week — các thứ trong tuần giờ VN (0 = thứ Hai … 6 = Chủ nhật)
// · cycle — mỗi `every` ngày mở `len` ngày (lệch `offset` ngày)
export type FestWindow =
  | { kind: 'newbie'; from: number; to: number }
  | { kind: 'week'; days: number[] }
  | { kind: 'cycle'; every: number; len: number; offset: number }
  | { kind: 'dates'; from: number[]; len: number } // lễ theo lịch: mở len ngày từ mỗi ngày trong from (ngày giờ VN, xem vnDay)
  | { kind: 'season'; from: number; to: number } // ngày thứ from..to của mùa giới (từ lúc mở mùa, seasonAt — người trong giới)
// login — mỗi ngày đăng nhập mở thêm một quà · tasks — mỗi việc một quà · points — làm việc ra điểm, đủ mốc nhận quà;
// stages: điểm mỗi việc theo từng ngày của khung (như Mightiest Governor: hôm xây, hôm nghiên cứu, hôm tuyển…), một phần tử = cả khung
// activity — mỗi việc xong cộng pts điểm hoạt lực, đủ mốc mở rương (như Daily Objectives của RoK)
// shop — làm việc ra lệnh bài (như points), đổi lấy quà trong kho, mỗi món tối đa max lần (như Hero Returns của RoK)
// wheel — làm việc ra lệnh (như shop), quay vòng quà (Wheel of Fortune của RoK): mỗi ngày một lượt miễn phí, lượt thêm tốn lệnh
// panel: 'daily' — hiện ở bảng Nhiệm vụ ngày thay vì trung tâm sự kiện
// Ngày giờ VN của ngày dương y-m-d (số ngày kể từ 1/1/1970, như dayOf) — cho lễ theo lịch âm đổi ngày mỗi năm
export const vnDay = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d) / 86_400_000
// Lễ rơi đồ (Strategic Reserve): việc nền có xác suất rơi Linh Nang qua thư — săn yêu thú thắng (sơn môn, bản đồ giới), đội khai mỏ về
export type DropSrc = 'hunt' | 'gather'
// reborn: chỉ người đã luân hồi (lễ đầu mùa cho người cũ — người mới đã có lễ tân thủ cùng khuôn)
export type FestDef = { window: FestWindow; hall?: number; panel?: 'daily'; reborn?: boolean } & (
  | { kind: 'login'; rewards: Reward[] }
  // tasks — abs: so chỉ số tuyệt đối (đạt tầng n…); day: việc mở từ giai đoạn (ngày) này; chests: rương theo số việc đã nhận quà
  | {
      kind: 'tasks'
      abs?: boolean
      daily?: boolean // tiến độ làm mới mỗi ngày (việc theo nhánh ngày); không thì tính từ lúc mở lượt
      tasks: { m: Metric; n: number; reward: Reward; day?: number }[]
      chests?: { need: number; reward: Reward }[]
    }
  | { kind: 'points'; stages: Partial<Record<Metric, number>>[]; goals: number[]; rewards: Reward[] }
  | { kind: 'activity'; tasks: { m: Metric; n: number; pts: number }[]; goals: number[]; rewards: Reward[] }
  | { kind: 'shop'; stages: Partial<Record<Metric, number>>[]; shop: { reward: Reward; price: number; max: number }[] }
  | { kind: 'drop'; chance: Partial<Record<DropSrc, number>>; gift: Reward; goals: number[]; rewards: Reward[] } // lễ rơi đồ
  | {
      kind: 'wheel'
      stages: Partial<Record<Metric, number>>[]
      cost: number // lệnh mỗi lượt quay thêm
      pity: number // lượt thứ pity, 2·pity… chắc trúng ô đầu (tín vật nhiều nhất)
      elders: ElderId[] // trưởng lão chủ lễ, đổi mỗi lượt lễ
      slots: { w: number; r?: Reward; token?: number }[] // token: số tín vật của trưởng lão chủ lễ
    }
  | {
      kind: 'dice' // bàn cờ xúc xắc (Garden of Infinity): đổ đi quanh bàn, ô dừng ra quà, qua Khởi điểm thêm quà vòng
      stages: Partial<Record<Metric, number>>[]
      cost: number // lệnh mỗi lượt đổ thêm (mỗi ngày một lượt miễn phí)
      board: Reward[] // các ô quanh bàn; ô 0 là Khởi điểm
      lap: Reward
      goals: number[] // rương mốc theo tổng số lượt đã đổ
      rewards: Reward[]
    }
  | {
      kind: 'egg' // đập trứng (Holy Knight's Treasure): chọn trước món chủ lực (tỉ lệ ch mỗi quả), còn lại rút theo trọng số pool
      stages: Partial<Record<Metric, number>>[]
      cost: number // lệnh mỗi quả đập thêm (mỗi ngày một quả miễn phí)
      picks: Reward[]
      ch: number
      pool: { w: number; r: Reward }[]
      goals: number[] // rương mốc theo tổng số trứng đã đập trong lượt
      rewards: Reward[]
    }
  | {
      kind: 'wish' // cầu duyên cạn dần (Esmeralda's Prayer): bảng quà có hạn, rút tới đâu hết tới đó; rút đủ quà đặc biệt (big) thì
      // nhận nốt phần còn lại, bảng làm lại vòng mới
      stages: Partial<Record<Metric, number>>[]
      cost: number // lệnh mỗi lượt cầu thêm (mỗi ngày một lượt miễn phí)
      pool: { w: number; r: Reward; big?: boolean }[]
    }
  | {
      kind: 'cards' // lật bài tìm đôi (Card King): 12 lá úp 6 đôi, lật liền hai lá giống thì nhận quà đôi đó; lật hết thì quà ván
      stages: Partial<Record<Metric, number>>[]
      cost: number // lệnh mỗi lá lật thêm (mỗi ván free lá đầu miễn phí)
      free: number
      games: number // số ván mỗi lượt lễ
      pairs: Reward[] // quà 6 đôi (đôi đầu quý nhất)
      done: Reward // lật hết một ván
    }
  // Dạ Hành Đạo Tặc (sect/thief.ts): rương ngày theo phần nghìn sát thương cao nhất hôm nay
  | { kind: 'thief'; goals: number[]; rewards: Reward[] }
  // Trảm Yêu Tốc Chiến (core/fest.ts raceHit): mốc theo kỷ lục một lượt đua
  | { kind: 'race'; goals: number[]; rewards: Reward[] }
  // Hoàng Kim Mê Cảnh (sect/maze.ts): mốc theo số tầng đã qua (kỷ lục)
  | { kind: 'maze'; goals: number[]; rewards: Reward[] }
  // đổi phù (War and Peace): phù họ from sang họ to cùng mệnh giá (SPEED_MIN), mỗi mệnh giá tối đa max lá mỗi lượt
  | { kind: 'swap'; from: 'loBan'; to: 'luyenBinh'; max: number }
  | {
      kind: 'omen' // xin xăm (Esmeralda's House của RoK): mỗi lượt rút một quẻ theo trọng số — Thượng Thượng / Thượng / Trung / Hạ, quà
      // theo quẻ; rương mốc theo tổng số lượt đã xin
      stages: Partial<Record<Metric, number>>[]
      cost: number // lệnh mỗi lượt xin thêm (mỗi ngày một lượt miễn phí)
      tiers: { w: number; r: Reward }[]
      goals: number[]
      rewards: Reward[]
    }
  | {
      kind: 'offer' // nộp lên cấp (khuôn lễ hội của RoK): lệnh bài lễ từ việc trong lễ nộp vào, mỗi lệnh một kinh nghiệm × hệ số chí
      // mạng (mầm server, theo trọng số crit); kinh nghiệm đủ goals[k] là lên cấp k + 1, mỗi cấp một quà
      stages: Partial<Record<Metric, number>>[]
      crit: { w: number; x: number }[]
      goals: number[]
      rewards: Reward[]
    }
  | {
      kind: 'escort' // Áp Tiêu Hộ Hàng (Protect the Supplies): chọn độ khó 1…lv sao (mở dần), tốn `cost` hành lực; đội ảo (không mất quân
      // thật) hộ tống qua các đợt phục kích `waves` (sức = hệ số × lực chiến đội đầy của trưởng lão dẫn × (1 + step × (sao − 1))), thua
      // một đợt thì xe hàng mất tới `hit` % theo phần giặc còn sống; còn hàng là tới làng. Điểm lượt = sao × 100 + % hàng còn, giữ lượt
      // tốt nhất; mốc theo điểm, bảng xếp hạng
      lv: number
      cost: number
      waves: number[]
      step: number
      hit: number
      goals: number[]
      rewards: Reward[]
    }
  | {
      kind: 'stall' // Cát Tường Hạ Giá (Lucky Stall): chọn việc (STALL_JOBS: xây / lĩnh ngộ / tuyển), ước một mức giảm chi phí theo
      // trọng số (mầm server); lần ước đầu miễn phí, ước lại tốn `cost` Cát Tường Tệ (việc trong lễ); cả lễ bớt tối đa `cap` mỗi loại
      stages: Partial<Record<Metric, number>>[]
      cost: number
      tiers: { cut: number; w: number }[]
      cap: number
    }
  | {
      kind: 'dig' // khảo cổ theo tầng (Hunt for History): mỗi tầng chọn giải tối thượng, đào từng ô, trúng giải thì sang tầng sau
      stages: Partial<Record<Metric, number>>[]
      cost: number // lệnh mỗi nhát đào thêm (mỗi ngày một nhát miễn phí)
      cells: number // số ô mỗi tầng
      picks: Reward[] // giải tối thượng chọn được ở tầng thường
      grand: Reward[] // tầng 5, 10…: lựa chọn tốt hơn
      pool: { w: number; r: Reward }[] // quà các ô không có giải
      goals: number[] // rương mốc theo số tầng đã qua
      rewards: Reward[]
    }
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
      { m: 'duel', n: 1, pts: 10 }, // Complete Plan của RoK: đánh Sunset Canyon, mua ở Courier Station
      { m: 'bought', n: 1, pts: 10 },
    ],
    goals: [20, 40, 60, 80, 100],
    rewards: [
      { hallRes: 80, items: { thoiQuang5: 1 } },
      { hallRes: 100, items: { tuKhi: 1 } },
      { hallRes: 120, items: { boiNguyen: 1, nganDuyen: 1, luanKiem: 1 } },
      { hallRes: 150, items: { thoiQuang15: 1 } },
      { hallRes: 200, items: { thoiQuang60: 1, kimDuyen: 1, luanKiem: 1 } },
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
  // Khai Sơn Thất Nhật (Create Your Own History): 8 ngày đầu của tông môn, mỗi ngày mở một nhánh (Nhập Sơn → Chiêu Hiền → Tụ Linh →
  // Khai Mạch → Bế Quan), việc nào xong nhận quà việc đó; rương cuối theo số việc đã nhận — bỏ một ngày là tiếc
  tanThu: {
    window: { kind: 'newbie', from: 0, to: 7 },
    kind: 'tasks',
    abs: true,
    tasks: [
      { m: 'hall', n: 2, day: 0, reward: { items: { loBan15: 2 } } },
      { m: 'hall', n: 4, day: 0, reward: { res: b(3000, 3000, 3000) } },
      { m: 'build', n: 15, day: 0, reward: { items: { thoiQuang15: 2 } } },
      { m: 'build', n: 30, day: 0, reward: { items: { loBan60: 1 } } },
      { m: 'win', n: 3, day: 0, reward: { items: { kinhThu500: 2 } } },
      { m: 'win', n: 10, day: 0, reward: { items: { thoiQuang60: 1 } } },
      { m: 'elder', n: 15, day: 1, reward: { items: { kinhThu500: 3 } } },
      { m: 'elder', n: 30, day: 1, reward: { items: { kinhThu2k: 1 } } },
      { m: 'draw', n: 3, day: 1, reward: { items: { nganDuyen: 1 } } },
      { m: 'draw', n: 8, day: 1, reward: { items: { kimDuyen: 1 } } },
      { m: 'hall', n: 6, day: 1, reward: { items: { loBan60: 2, thoiQuang60: 1 } } },
      { m: 'ally', n: 5, day: 1, reward: { items: { thoiQuang15: 3 } } },
      { m: 'tech', n: 3, day: 2, reward: { items: { ngoDao60: 2 } } },
      { m: 'tech', n: 8, day: 2, reward: { items: { ngoDao180: 1 } } },
      { m: 'hunt', n: 5, day: 2, reward: { items: { kinhThu2k: 1 } } },
      { m: 'hunt', n: 15, day: 2, reward: { items: { kinhThu2k: 1, chienY: 1 } } },
      { m: 'train', n: 300, day: 2, reward: { items: { luyenBinh60: 1 } } },
      { m: 'train', n: 1000, day: 2, reward: { items: { luyenBinh180: 1 } } },
      { m: 'hall', n: 8, day: 3, reward: { res: b(15000, 15000, 15000), items: { tuLinh24: 1 } } },
      { m: 'gather', n: 20000, day: 3, reward: { items: { khaiLinh8: 1 } } },
      { m: 'forge', n: 2, day: 3, reward: { items: { thoiQuang60: 1 } } },
      { m: 'forge', n: 6, day: 3, reward: { items: { thoiQuang180: 1 } } },
      { m: 'elder', n: 60, day: 3, reward: { items: { kinhThu2k: 2 } } },
      { m: 'sites', n: 3, day: 3, reward: { items: { sonHa12: 1 } } },
      { m: 'speed', n: 120, day: 4, reward: { items: { thoiQuang60: 2 } } },
      { m: 'speed', n: 600, day: 4, reward: { items: { thoiQuang180: 1 } } },
      { m: 'realm', n: 3, day: 4, reward: { items: { kinhThu2k: 1 } } },
      { m: 'realm', n: 8, day: 4, reward: { items: { kinhThu8k: 1 } } },
      { m: 'power', n: 20000, day: 4, reward: { items: { thoiQuang480: 1, hoSon24: 1 } } },
      { m: 'power', n: 50000, day: 4, reward: { items: { thoiQuang480: 1, kimDuyen: 1 } } },
    ],
    chests: [
      { need: 8, reward: { items: { thoiQuang60: 2, nganDuyen: 1 } } },
      { need: 16, reward: { items: { thoiQuang180: 1, kinhThu2k: 2 } } },
      { need: 24, reward: { items: { thoiQuang480: 1, kimDuyen: 1 } } },
      { need: 30, reward: { items: { kimDuyen: 2, tuLinh24: 1, huongHoa200: 1 } } },
    ],
  },
  // Tân Giới Thất Nhật (Create Your Own History gắn ngày mở vương quốc — mỗi mùa một giới mới): 8 ngày đầu mỗi mùa giới, cho người
  // đã luân hồi (xây lại từ căn cơ); như Khai Sơn Thất Nhật nhưng tính phần làm thêm từ lúc mở lễ — mỗi ngày mở một nhánh (Nhập Giới →
  // Kết Minh → Tụ Linh → Khai Mạch → Tranh Phong), rương cuối theo số việc đã nhận
  tanGioi: {
    window: { kind: 'season', from: 0, to: 7 },
    reborn: true,
    kind: 'tasks',
    tasks: [
      { m: 'hall', n: 2, day: 0, reward: { items: { loBan60: 1 } } },
      { m: 'hall', n: 4, day: 0, reward: { res: b(20000, 20000, 20000) } },
      { m: 'build', n: 25, day: 0, reward: { items: { thoiQuang60: 1 } } },
      { m: 'explore', n: 40, day: 0, reward: { items: { sonHa12: 1 } } },
      { m: 'sites', n: 3, day: 0, reward: { items: { kinhThu2k: 1 } } },
      { m: 'win', n: 10, day: 0, reward: { items: { thoiQuang60: 1 } } },
      { m: 'ally', n: 10, day: 1, reward: { items: { thoiQuang60: 1 } } },
      { m: 'ally', n: 40, day: 1, reward: { items: { thoiQuang180: 1 } } },
      { m: 'draw', n: 5, day: 1, reward: { items: { nganDuyen: 1 } } },
      { m: 'draw', n: 15, day: 1, reward: { items: { kimDuyen: 1 } } },
      { m: 'hall', n: 6, day: 1, reward: { items: { loBan60: 2, thoiQuang60: 1 } } },
      { m: 'hunt', n: 10, day: 1, reward: { items: { kinhThu2k: 1 } } },
      { m: 'tech', n: 5, day: 2, reward: { items: { ngoDao60: 2 } } },
      { m: 'tech', n: 12, day: 2, reward: { items: { ngoDao180: 1 } } },
      { m: 'train', n: 2000, day: 2, reward: { items: { luyenBinh60: 1 } } },
      { m: 'train', n: 6000, day: 2, reward: { items: { luyenBinh180: 1 } } },
      { m: 'brew', n: 5, day: 2, reward: { items: { thoiQuang60: 1 } } },
      { m: 'hunt', n: 25, day: 2, reward: { items: { kinhThu2k: 1, chienY: 1 } } },
      { m: 'gather', n: 60000, day: 3, reward: { items: { khaiLinh8: 1 } } },
      { m: 'gather', n: 250000, day: 3, reward: { items: { khaiLinh24: 1 } } },
      { m: 'hall', n: 9, day: 3, reward: { res: b(60000, 60000, 60000), items: { tuLinh24: 1 } } },
      { m: 'forge', n: 3, day: 3, reward: { items: { thoiQuang180: 1 } } },
      { m: 'chain', n: 5, day: 3, reward: { items: { kinhThu2k: 2 } } },
      { m: 'rescue', n: 2, day: 3, reward: { items: { chienY: 1, kinhThu2k: 1 } } },
      { m: 'speed', n: 300, day: 4, reward: { items: { thoiQuang180: 1 } } },
      { m: 'speed', n: 1500, day: 4, reward: { items: { thoiQuang480: 1 } } },
      { m: 'realm', n: 3, day: 4, reward: { items: { kinhThu8k: 1 } } },
      { m: 'power', n: 20000, day: 4, reward: { items: { thoiQuang480: 1, hoSon24: 1 } } },
      { m: 'power', n: 60000, day: 4, reward: { items: { thoiQuang480: 1, kimDuyen: 1 } } },
      { m: 'win', n: 60, day: 4, reward: { items: { kinhThu8k: 1 } } },
    ],
    chests: [
      { need: 8, reward: { items: { thoiQuang180: 2, nganDuyen: 1 } } },
      { need: 16, reward: { items: { thoiQuang480: 1, kinhThu8k: 1 } } },
      { need: 24, reward: { items: { kimDuyen: 1, thoiQuang480: 1, tuLinh24: 1 } } },
      { need: 30, reward: { items: { kimDuyen: 2, hoSon24: 1, huongHoa200: 1 } } },
    ],
  },
  // Tông Lệnh Bảo Khố (Hero Returns): 8 ngày đầu — xây, tuyển, săn yêu, nghiên cứu ra Tông Môn Lệnh; đổi quà, mỗi món có hạn
  tongLenh: {
    window: { kind: 'newbie', from: 0, to: 7 },
    kind: 'shop',
    stages: [{ build: 5, train: 0.1, hunt: 3, tech: 8, win: 2 }],
    shop: [
      { reward: { items: { kimDuyen: 2 } }, price: 80, max: 1 },
      { reward: { items: { vanNang4: 5 } }, price: 60, max: 1 },
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
    // Tông Môn Tranh Bá (Mightiest Governor): 6 ải như RoK, mỗi ải một ngày; trưởng lão của đợt (FEST_STAR) — top 10 nhận tín vật
    window: { kind: 'week', days: [0, 1, 2, 3, 4, 5] },
    hall: 5,
    kind: 'points',
    stages: [
      { trainPts: 1, speed: 1 }, // ải 1 luyện binh: điểm theo bậc đệ tử (nâng bậc: phần chênh), phút tăng tốc
      { huntLv: 20, realm: 60 }, // ải 2 trảm yêu: theo cấp yêu thú, tầng bí cảnh
      { gather: 0.01, build: 40 }, // ải 3 khai mỏ: mỗi 100 tài nguyên mang về 1 điểm; tầng công trình
      { power: 1 }, // ải 4 thế lực: mỗi điểm thế lực tăng thêm
      { kp: 0.5, raid: 200 }, // ải 5 tranh đoạt (diệt địch): chiến công, lần cướp thắng
      { trainPts: 0.8, huntLv: 16, gather: 0.008, build: 32, tech: 100, kp: 0.4, speed: 0.8 }, // ải 6 nước rút: mọi việc ×0,8
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
    // Trảm Yêu Lệnh (Clarion Call): thứ Năm – thứ Sáu tuần B — mỗi yêu thú hạ được (sơn môn lẫn bản đồ giới) điểm theo cấp, qua bí
    // cảnh; có bảng xếp hạng cá nhân (FEST_RANKED) và tiên minh (FEST_ALLY)
    window: { kind: 'cycle', every: 14, len: 2, offset: 14 },
    hall: 3,
    kind: 'points',
    stages: [{ huntLv: 10, realm: 30 }],
    goals: [300, 1000, 2500, 5000],
    rewards: [
      { items: { kinhThu500: 2, dieuThu15: 2 } },
      { items: { kinhThu2k: 1, kimCuong: 1 } },
      { items: { kinhThu8k: 1, kimDuyen: 1 } },
      { items: { kinhThu8k: 1, chienY: 1, thoiQuang180: 1 } },
    ],
  },
  tichCoc: {
    // Tích Cốc Phòng Cơ (Strategic Reserve): 4 ngày tuần A (thứ Năm → Chủ nhật) — săn yêu thú thắng, đội khai mỏ về có thể nhặt Linh
    // Nang (tới qua thư, mở ra phù); mỗi nang +1 điểm, bảng xếp hạng theo số nang (FEST_RANKED)
    window: { kind: 'cycle', every: 14, len: 4, offset: 7 },
    hall: 3,
    kind: 'drop',
    chance: { hunt: 0.3, gather: 0.5 },
    gift: { items: { thoiQuang15: 1, thachNang1k: 1 } },
    goals: [3, 8, 15, 25],
    rewards: [
      { items: { thoiQuang60: 1, kinhThu500: 2 } },
      { items: { thoiQuang60: 2, khaiLinh8: 1 } },
      { items: { thoiQuang180: 1, kinhThu2k: 1 } },
      { items: { thoiQuang480: 1, nganDuyen: 1 } },
    ],
  },
  gioiChu: {
    // Giới Chủ Tranh Phong (Who Will Reign Supreme): 7 ngày đầu mỗi mùa giới — đua thế lực tăng thêm, mốc quà; bảng xếp hạng (FEST_RANKED)
    window: { kind: 'season', from: 0, to: 6 },
    kind: 'points',
    stages: [{ power: 1 }],
    goals: [5000, 12000, 25000, 50000, 100000, 200000],
    rewards: [
      { items: { thoiQuang60: 2, thachNang5k: 1 } },
      { items: { thoiQuang60: 3, kinhThu2k: 1 } },
      { items: { thoiQuang180: 1, nganDuyen: 1 } },
      { items: { thoiQuang180: 2, kinhThu8k: 1 } },
      { items: { thoiQuang480: 1, kimDuyen: 1 } },
      { items: { thoiQuang480: 2, kimDuyen: 1, hoSon24: 1 } },
    ],
  },
  yeuHoang: {
    // Thí Luyện Yêu Hoàng (Karuak Ceremony): 4 ngày — chọn độ khó, 50 cửa đánh bằng quân thật; quà theo điểm Thí Luyện (sect/trial.ts)
    window: { kind: 'cycle', every: 14, len: 4, offset: 3 },
    hall: 8,
    kind: 'tasks',
    tasks: [
      { m: 'trial', n: 5, reward: { items: { kinhThu2k: 1, thoiQuang60: 1 } } },
      { m: 'trial', n: 10, reward: { items: { kinhThu2k: 2, dieuThu60: 1 } } },
      { m: 'trial', n: 20, reward: { items: { kinhThu8k: 1, thoiQuang180: 1 } } },
      { m: 'trial', n: 30, reward: { items: { nganDuyen: 2, chienY: 1 } } },
      { m: 'trial', n: 40, reward: { items: { kinhThu8k: 2, thoiQuang480: 1 } } },
      { m: 'trial', n: 50, reward: { items: { kimDuyen: 2, hoThe: 1 } } },
    ],
  },
  linhDia: {
    // Linh Địa Chinh Phạt (Holy Conqueror): 4 ngày — đánh bại hộ trận linh thú giữ linh mạch / trận nhãn, nhặt phù văn quanh linh địa
    window: { kind: 'cycle', every: 14, len: 4, offset: 10 },
    hall: 8,
    kind: 'tasks',
    tasks: [
      { m: 'guards', n: 1, reward: { items: { kinhThu2k: 1, thoiQuang60: 1 } } },
      { m: 'guards', n: 3, reward: { items: { kinhThu2k: 2, chienY: 1 } } },
      { m: 'guards', n: 5, reward: { items: { kinhThu8k: 1, thoiQuang180: 1 } } },
      { m: 'runes', n: 2, reward: { items: { thoiQuang60: 2 } } },
      { m: 'runes', n: 5, reward: { items: { nganDuyen: 1, kimCuong: 1 } } },
      { m: 'runes', n: 10, reward: { items: { kimDuyen: 1 } } },
    ],
  },
  khaiDien: {
    // Khánh Điển Khai Tông (Sign-In Spoils): 14 ngày đầu mỗi mùa giới, mọi người trong giới — mỗi ngày vào game mở thêm một phần lễ
    window: { kind: 'season', from: 0, to: 13 },
    kind: 'login',
    rewards: [
      { items: { thoiQuang60: 2, thachNang5k: 1 } },
      { items: { kinhThu2k: 2, thaoNang5k: 1 } },
      { items: { nganDuyen: 2, khoangNang5k: 1 } },
      { items: { thoiQuang180: 1, tuLinh8: 1 } },
      { items: { kinhThu8k: 1, chienY: 1 } },
      { items: { thoiQuang480: 1, hoSon8: 1 } },
      { items: { kimDuyen: 2, huongHoa200: 1 } },
    ],
  },
  hoaKien: {
    // Hoá Kiến Vi Binh (War and Peace): tuần thứ tư mỗi mùa giới (lúc giao tranh), Chủ điện tầng 25 — xây xong hết thì Lỗ Ban Phù
    // thừa: đổi sang Luyện Binh Phù cùng mệnh giá, mỗi mệnh giá tối đa 200 lá mỗi mùa
    window: { kind: 'season', from: 21, to: 27 },
    hall: 25,
    kind: 'swap',
    from: 'loBan',
    to: 'luyenBinh',
    max: 200,
  },
  boQue: {
    // Bói Quẻ Thiên Cơ (Esmeralda's House): 3 ngày mỗi 21 ngày — việc trong lễ cho Linh Xăm, lắc ống xăm rút quẻ Thượng Thượng (5 %) /
    // Thượng (20 %) / Trung (45 %) / Hạ (30 %), quẻ nào cũng đáng hơn giá; rương mốc 10 / 20 / 40 / 70 quẻ
    window: { kind: 'cycle', every: 21, len: 3, offset: 5 },
    hall: 6,
    kind: 'omen',
    stages: [{ hunt: 2, win: 2, build: 5, train: 0.02, gather: 0.0005 }],
    cost: 10,
    tiers: [
      { w: 5, r: { items: { kimDuyen: 1, thoiQuang180: 1 } } },
      { w: 20, r: { items: { thoiQuang60: 2, tuyTam5k: 1 } } },
      { w: 45, r: { items: { thoiQuang15: 2, kinhThu500: 2 } } },
      { w: 30, r: { items: { thoiQuang5: 3, thachNang1k: 2 } } },
    ],
    goals: [10, 20, 40, 70],
    rewards: [
      { items: { nganDuyen: 1, thoiQuang60: 2 } },
      { items: { kinhThu8k: 1, tuyTam20k: 1 } },
      { items: { kimDuyen: 1, thoiQuang180: 2 } },
      { items: { kimDuyen: 2, thoiQuang480: 1 } },
    ],
  },
  catTuong: {
    // Cát Tường Hạ Giá (Lucky Stall của RoK): 5 ngày mỗi 28 ngày — chọn xây / lĩnh ngộ / tuyển, ước mức giảm chi phí −20 % … −60 %;
    // Cát Tường Tệ từ săn yêu thú, hạ yêu vương, dùng tăng tốc; mỗi loại tài nguyên cả lễ bớt tối đa 300.000
    window: { kind: 'cycle', every: 28, len: 5, offset: 9 },
    hall: 6,
    kind: 'stall',
    stages: [{ hunt: 1, forts: 3, speed: 0.02 }],
    cost: 10,
    tiers: [
      { cut: 0.2, w: 10 },
      { cut: 0.3, w: 25 },
      { cut: 0.4, w: 30 },
      { cut: 0.5, w: 23 },
      { cut: 0.6, w: 12 },
    ],
    cap: 300_000,
  },
  vanDang: {
    // Vạn Đăng Hội (khuôn lễ hội "nộp lên cấp 25" của RoK): 5 ngày mỗi 28 ngày — việc trong lễ cho Hoa Đăng, nộp vào hội đèn lên cấp
    // (chí mạng ×2 / ×5), 25 cấp mỗi cấp một quà, cấp 5, 10… quà lớn
    window: { kind: 'cycle', every: 28, len: 5, offset: 23 },
    hall: 6,
    kind: 'offer',
    stages: [{ hunt: 1, win: 1, build: 3, train: 0.01, gather: 0.0003, speed: 0.05 }],
    crit: [
      { w: 80, x: 1 },
      { w: 15, x: 2 },
      { w: 5, x: 5 },
    ],
    goals: Array.from({ length: 25 }, (_, k) => Math.round(8 * (k + 1) + 1.28 * (k + 1) ** 2)),
    rewards: Array.from({ length: 25 }, (_, k): Reward => {
      const lv = k + 1
      if (lv % 5 === 0)
        return { items: { kimDuyen: lv / 5, thoiQuang180: lv / 5, tuyTam20k: 1, ...(lv % 10 === 0 && { hongBao: 2 }) } }
      return {
        items: {
          ...(lv % 2 ? { thoiQuang60: 1 + Math.floor(lv / 6) } : { tuyTam5k: 1 + Math.floor(lv / 8) }),
          ...(lv > 10 && { kinhThu2k: 1 }),
        },
      }
    }),
  },
  truyenCong: {
    // Truyền Công Đại Hội (Commander Swap): 3 ngày mỗi 28 ngày, Chủ điện ≥ 10 — việc trong lễ cho Truyền Công Phù; trong lễ, bảng
    // trưởng lão có Truyền công (sect/tavern.ts truyen)
    window: { kind: 'cycle', every: 28, len: 3, offset: 17 },
    hall: 10,
    kind: 'tasks',
    tasks: [
      { m: 'elder', n: 5, reward: { items: { truyenCong: 5 } } },
      { m: 'draw', n: 3, reward: { items: { truyenCong: 5 } } },
      { m: 'hunt', n: 10, reward: { items: { truyenCong: 5 } } },
      { m: 'win', n: 10, reward: { items: { truyenCong: 5 } } },
      { m: 'speed', n: 300, reward: { items: { truyenCong: 10 } } },
      { m: 'train', n: 1000, reward: { items: { truyenCong: 10 } } },
    ],
  },
  tamBao: {
    // Tầm Bảo Kỳ Ngộ (Treasure Hunt): 5 ngày — săn yêu thú thắng, đội khai mỏ về có thể nhặt Tàng Bảo Đồ tàn phiến (qua thư); đủ 7 mảnh
    // ghép bản đồ ở bản đồ giới, xuất quân tới điểm đào nhận quà. Mỗi mảnh +1 điểm, 4 mốc
    window: { kind: 'cycle', every: 14, len: 5, offset: 2 },
    hall: 6,
    kind: 'drop',
    chance: { hunt: 0.35, gather: 0.5 },
    gift: { items: { baoDo: 1 } },
    goals: [4, 10, 18, 28],
    rewards: [
      { items: { baoDo: 2, thoiQuang60: 1 } },
      { items: { baoDo: 3, kinhThu2k: 1 } },
      { items: { baoDo: 4, thoiQuang180: 1 } },
      { items: { baoDo: 7, nganDuyen: 1 } },
    ],
  },
  lienTram: {
    // Liên Trảm Bất Hồi (Cornucopia / Ghost Parade): thứ Bảy – Chủ nhật tuần B — thắng trận liên tiếp; mỗi yêu thú giới hạ bằng
    // săn liên hoàn (đội săn đang về đi thẳng tới con khác, không về núi) điểm cao nhất
    window: { kind: 'cycle', every: 14, len: 2, offset: 16 },
    hall: 3,
    kind: 'points',
    stages: [{ win: 10, raid: 25, tower: 10, chain: 30 }],
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
  // Trung Thu Vọng Nguyệt (khuôn lễ hội — Tết Trung Thu, rằm tháng Tám âm lịch): 5 ngày quanh rằm; làm việc ra Nguyệt Bính, đổi quà
  // trong kho lễ. Mốc rằm từng năm ghi tay (lịch âm): 25/9/2026, 15/9/2027, 3/10/2028
  trungThu: {
    window: { kind: 'dates', from: [vnDay(2026, 9, 23), vnDay(2027, 9, 13), vnDay(2028, 10, 1)], len: 5 },
    hall: 3,
    kind: 'shop',
    stages: [{ win: 3, hunt: 4, chain: 6, gather: 0.001, heal: 0.05, ally: 2 }],
    shop: [
      { reward: { items: { kimDuyen: 1 } }, price: 120, max: 1 },
      { reward: { items: { tuLinh24: 1 } }, price: 60, max: 2 },
      { reward: { items: { thoiQuang180: 1 } }, price: 40, max: 3 },
      { reward: { items: { kinhThu2k: 1 } }, price: 25, max: 5 },
      { reward: { items: { nganDuyen: 1 } }, price: 20, max: 5 },
      { reward: { items: { thachNang5k: 1 } }, price: 10, max: 5 },
    ],
  },
  // Tân Xuân Khai Sơn (Tết Nguyên Đán): 7 ngày từ mùng Một — mỗi ngày vào núi mở một bao lì xì, bao sau dày hơn bao trước.
  // Mùng Một từng năm ghi tay (lịch âm): 6/2/2027, 26/1/2028, 13/2/2029
  tanXuan: {
    window: { kind: 'dates', from: [vnDay(2027, 2, 6), vnDay(2028, 1, 26), vnDay(2029, 2, 13)], len: 7 },
    kind: 'login',
    rewards: [
      { items: { thoiQuang60: 1, nganDuyen: 1 } },
      { items: { thoiQuang60: 2, thachNang5k: 1 } },
      { items: { kinhThu2k: 1, nganDuyen: 1 } },
      { items: { thoiQuang180: 1, tuLinh8: 1 } },
      { items: { kinhThu2k: 2, nganDuyen: 2 } },
      { items: { thoiQuang180: 2, tuLinh24: 1 } },
      { items: { thoiQuang480: 1, kimDuyen: 1, kinhThu8k: 1 } },
    ],
  },
  // Đông Chí Tuyết Dạ: 21–25/12 hằng năm (tiết Đông Chí) — thắng trận, săn yêu, chữa thương, giúp đồng minh ra điểm, đủ mốc mở rương
  dongChi: {
    window: { kind: 'dates', from: [vnDay(2026, 12, 21), vnDay(2027, 12, 21), vnDay(2028, 12, 21)], len: 5 },
    hall: 3,
    kind: 'points',
    stages: [{ win: 5, hunt: 6, chain: 8, heal: 0.1, ally: 3 }],
    goals: [60, 200, 450],
    rewards: [
      { items: { thoiQuang60: 2, kinhThu500: 2 } },
      { items: { thoiQuang180: 1, nganDuyen: 2 } },
      { items: { thoiQuang480: 1, kimDuyen: 1 } },
    ],
  },
  // Nguyên Tiêu Hoa Đăng (New Year Fireworks — rằm tháng Giêng): 3 ngày thả hoa đăng — thắng trận, giúp đồng minh, mở thiếp ra điểm.
  // Rằm tháng Giêng từng năm (lịch âm): 20/2/2027, 9/2/2028
  nguyenTieu: {
    window: { kind: 'dates', from: [vnDay(2027, 2, 20), vnDay(2028, 2, 9)], len: 3 },
    hall: 3,
    kind: 'points',
    stages: [{ win: 5, ally: 4, draw: 10, hunt: 4 }],
    goals: [50, 150, 350],
    rewards: [
      { items: { thoiQuang60: 2, nganDuyen: 1 } },
      { items: { thoiQuang180: 1, kinhThu2k: 1 } },
      { items: { thoiQuang480: 1, kimDuyen: 1 } },
    ],
  },
  // Xuân Hồi Vạn Vật (Spring's Return): 5 ngày quanh xuân phân — xây, nghiên cứu, tuyển, khai mỏ ra điểm
  xuanHoi: {
    window: { kind: 'dates', from: [vnDay(2027, 3, 20), vnDay(2028, 3, 20)], len: 5 },
    hall: 3,
    kind: 'points',
    stages: [{ build: 10, tech: 10, train: 0.05, gather: 0.001 }],
    goals: [80, 250, 550],
    rewards: [
      { items: { loBan60: 2, thachNang5k: 1 } },
      { items: { loBan180: 1, kinhThu2k: 1 } },
      { items: { thoiQuang480: 1, kimDuyen: 1 } },
    ],
  },
  // Tàng Bảo Các Triển Lãm (Grand Museum Day, 18/5): 3 ngày — khai mê vụ, ghé thôn trang / động phủ, mở thiếp, luyện pháp bảo ra Cổ
  // Vật, đổi quà
  trienLam: {
    window: { kind: 'dates', from: [vnDay(2027, 5, 18), vnDay(2028, 5, 18)], len: 3 },
    hall: 3,
    kind: 'shop',
    stages: [{ explore: 1, sites: 6, draw: 4, forge: 6 }],
    shop: [
      { reward: { items: { kimDuyen: 1 } }, price: 120, max: 1 },
      { reward: { items: { kinhThu8k: 1 } }, price: 60, max: 2 },
      { reward: { items: { thoiQuang180: 1 } }, price: 40, max: 3 },
      { reward: { items: { nganDuyen: 1 } }, price: 20, max: 5 },
      { reward: { items: { khoangNang5k: 1 } }, price: 10, max: 5 },
    ],
  },
  // Đoan Ngọ Tống Tử (Dragon Boat — mùng 5 tháng 5 âm): 5 ngày gói bánh tro — thắng trận, săn yêu, khai mỏ, giúp đồng minh ra điểm.
  // Mùng 5 tháng 5 từng năm (lịch âm): 9/6/2027, 28/5/2028
  doanNgo: {
    window: { kind: 'dates', from: [vnDay(2027, 6, 9), vnDay(2028, 5, 28)], len: 5 },
    hall: 3,
    kind: 'points',
    stages: [{ win: 4, hunt: 5, gather: 0.001, ally: 3 }],
    goals: [60, 200, 450],
    rewards: [
      { items: { thoiQuang60: 2, thaoNang5k: 1 } },
      { items: { thoiQuang180: 1, nganDuyen: 2 } },
      { items: { thoiQuang480: 1, kimDuyen: 1 } },
    ],
  },
  // Hạ Chí Thịnh Hội (Summer Festival, quanh hạ chí): 7 ngày — săn liên hoàn, khai mỏ, tuyển, thắng trận ra Hạ Hoa, đổi quà
  haChi: {
    window: { kind: 'dates', from: [vnDay(2027, 6, 21), vnDay(2028, 6, 21)], len: 7 },
    hall: 3,
    kind: 'shop',
    stages: [{ chain: 6, gather: 0.001, train: 0.03, win: 3 }],
    shop: [
      { reward: { items: { kimDuyen: 1 } }, price: 120, max: 1 },
      { reward: { items: { tuLinh24: 1 } }, price: 60, max: 2 },
      { reward: { items: { thoiQuang180: 1 } }, price: 40, max: 3 },
      { reward: { items: { luyenBinh60: 2 } }, price: 25, max: 5 },
      { reward: { items: { thachNang5k: 1 } }, price: 10, max: 5 },
    ],
  },
  // Bách Vị Tiên Yến (Thanksgiving — thứ Năm tuần thứ tư tháng 11): 5 ngày — săn yêu, săn liên hoàn, khai mỏ, chữa thương ra điểm
  baVi: {
    window: { kind: 'dates', from: [vnDay(2026, 11, 26), vnDay(2027, 11, 25), vnDay(2028, 11, 23)], len: 5 },
    hall: 3,
    kind: 'points',
    stages: [{ hunt: 5, chain: 8, gather: 0.001, heal: 0.1 }],
    goals: [60, 200, 450],
    rewards: [
      { items: { thoiQuang60: 2, khoangNang5k: 1 } },
      { items: { thoiQuang180: 1, kinhThu2k: 1 } },
      { items: { thoiQuang480: 1, kimDuyen: 1 } },
    ],
  },
  // Ô Thước Kiều (Thất Tịch, 7/7 âm lịch): 7 ngày — giúp đồng minh, cung phụng, thắng trận, săn liên hoàn ra Hỷ Thước, đổi quà.
  // Mùng 7 tháng Bảy từng năm (lịch âm): 19/8/2026 (đã qua), 8/8/2027, 26/8/2028
  thatTich: {
    window: { kind: 'dates', from: [vnDay(2027, 8, 5), vnDay(2028, 8, 23)], len: 7 },
    hall: 3,
    kind: 'shop',
    stages: [{ ally: 4, win: 2, chain: 5, duel: 3 }],
    shop: [
      { reward: { items: { kimDuyen: 1 } }, price: 100, max: 1 },
      { reward: { items: { thanHanh: 1 } }, price: 30, max: 3 },
      { reward: { items: { thoiQuang180: 1 } }, price: 40, max: 3 },
      { reward: { items: { nganDuyen: 1 } }, price: 20, max: 5 },
      { reward: { items: { kinhThu2k: 1 } }, price: 25, max: 4 },
    ],
  },
  // Trung Nguyên Quỷ Tiết (rằm tháng Bảy — Vu Lan, tương ứng Halloween): 5 ngày — hạ yêu thú, yêu vương, thắng trận ra điểm, 3 rương
  // mốc. Rằm tháng Bảy từng năm: 16/8/2027, 3/9/2028
  quyTiet: {
    window: { kind: 'dates', from: [vnDay(2027, 8, 14), vnDay(2028, 9, 1)], len: 5 },
    hall: 3,
    kind: 'points',
    stages: [{ hunt: 6, chain: 8, win: 4, kp: 0.002 }],
    goals: [60, 200, 450],
    rewards: [
      { items: { hoSon8: 1, kinhThu500: 2 } },
      { items: { thoiQuang180: 1, nganDuyen: 2 } },
      { items: { thoiQuang480: 1, kimDuyen: 1 } },
    ],
  },
  // Thôn Trang Gặp Nạn (Strange Incidents của RoK): thôn trang bị tà tu đốt hiện trên bản đồ giới (NAN_*), cứu nạn ra Hộ Thôn
  // Lệnh. Thứ Ba → thứ Năm, hai tuần một lần
  thonTrang: {
    window: { kind: 'cycle', every: 14, len: 3, offset: 5 },
    hall: 6,
    kind: 'shop',
    stages: [{ rescue: 10 }],
    shop: [
      { reward: { items: { kimDuyen: 1 } }, price: 100, max: 1 },
      { reward: { items: { hoSon8: 1 } }, price: 30, max: 2 },
      { reward: { items: { sonHa12: 1 } }, price: 20, max: 2 },
      { reward: { items: { tucHoa: 1 } }, price: 15, max: 2 },
      { reward: { items: { khuechTran8: 1 } }, price: 20, max: 2 },
      { reward: { items: { hanhLuc50: 1 } }, price: 10, max: 10 },
      { reward: { items: { thoiQuang60: 1 } }, price: 5, max: 10 },
      { reward: { items: { khaiLinh8: 1 } }, price: 15, max: 3 },
    ],
  },
  // Vây Công Yêu Vương (Ceroli Assault của RoK, giản lược): 3 ngày mỗi 21 ngày — mỗi lần góp sức hạ yêu vương giới (kết trận cùng minh)
  // được 10 Bảo Hạp Phiếu, đổi bảo hạp quý ở cửa hàng lễ
  vayCong: {
    window: { kind: 'cycle', every: 21, len: 3, offset: 12 },
    hall: 10,
    kind: 'shop',
    stages: [{ forts: 10 }],
    shop: [
      { reward: { items: { vanNang4: 3 } }, price: 60, max: 1 },
      { reward: { items: { kimDuyen: 1 } }, price: 50, max: 2 },
      { reward: { items: { thoiQuang480: 1 } }, price: 30, max: 2 },
      { reward: { items: { kinhThu8k: 1 } }, price: 20, max: 3 },
      { reward: { items: { hoSon24: 1 } }, price: 25, max: 1 },
      { reward: { items: { thoiQuang60: 1 } }, price: 5, max: 10 },
    ],
  },
  // Thiên Cơ Luân (Wheel of Fortune của RoK, không bán): 3 ngày, hai tuần một lần — quay vòng 12 ô theo trọng số (mầm của
  // server). Ô tín vật là của trưởng lão chủ lễ (một trong bốn Tiên phẩm, đổi mỗi lượt lễ). Mỗi ngày một lượt miễn phí; lượt thêm
  // Thế Lực Bạo Tăng (Game of Power / Overwhelming Strength): 2 ngày mỗi 14 ngày — thế lực tăng thêm bằng mọi cách (xây, nghiên cứu,
  // tuyển, trưởng lão…), mốc quà và bảng xếp hạng
  thuLuc: {
    window: { kind: 'cycle', every: 14, len: 2, offset: 6 },
    hall: 5,
    kind: 'points',
    stages: [{ power: 1 }],
    goals: [2000, 10000, 30000, 80000],
    rewards: [
      { items: { loBan60: 1, thachNang5k: 1 } },
      { items: { loBan180: 1, kinhThu2k: 1 } },
      { items: { thoiQuang480: 1, nganDuyen: 2 } },
      { items: { thoiQuang480: 2, kimDuyen: 1 } },
    ],
  },
  // Áp Tiêu Hộ Hàng (Protect the Supplies): 3 ngày mỗi 14 ngày — mỗi lượt tốn 10 hành lực (như một lần săn yêu), chọn 1–5 sao (mở
  // dần), đội ảo hộ tống xe hàng qua ba đợt phục kích; mốc theo lượt tốt nhất (sao × 100 + % hàng còn), bảng xếp hạng
  apTieu: {
    window: { kind: 'cycle', every: 14, len: 3, offset: 8 },
    hall: 8,
    kind: 'escort',
    lv: 5,
    cost: 10,
    waves: [0.3, 0.45, 0.65],
    step: 0.35,
    hit: 50,
    goals: [100, 200, 300, 400, 500],
    rewards: [
      { items: { thoiQuang60: 2, thachNang5k: 1 } },
      { items: { thoiQuang180: 1, kinhThu2k: 1 } },
      { items: { thoiQuang180: 2, nganDuyen: 1 } },
      { items: { thoiQuang480: 1, kinhThu8k: 1 } },
      { items: { kimDuyen: 1, thoiQuang480: 1, hoSon24: 1 } },
    ],
  },
  // Thương Đội Gặp Nạn (Silk Road Speculators): 3 ngày mỗi 14 ngày — hàng của thương đội phàm nhân rơi quanh thôn trang trên bản đồ
  // giới mỗi giờ, xuất quân tới nhặt (ai tới trước được); mốc theo số kiện đã nhặt
  thuongDoi: {
    window: { kind: 'cycle', every: 14, len: 3, offset: 5 },
    hall: 6,
    kind: 'points',
    stages: [{ goods: 1 }],
    goals: [3, 8, 15, 25],
    rewards: [
      { items: { thoiQuang60: 2, thachNang5k: 1 } },
      { items: { thoiQuang180: 1, khaiLinh8: 1 } },
      { items: { thoiQuang480: 1, nganDuyen: 2 } },
      { items: { kimDuyen: 1, thoiQuang480: 1, tuyTam20k: 1 } },
    ],
  },
  // Luyện Binh Phù Hội (Training Day của RoK): 4 ngày mỗi 14 ngày — phút tăng tốc (Luyện Binh Phù, Thời Quang Phù, đan) dùng cho
  // việc tuyển đệ tử ra điểm; 4 mốc, bảng xếp hạng (FEST_RANKED)
  luyenBinhPhu: {
    window: { kind: 'cycle', every: 14, len: 4, offset: 1 },
    hall: 6,
    kind: 'points',
    stages: [{ speedTrain: 1 }],
    goals: [100, 700, 2000, 5400],
    rewards: [
      { items: { luyenBinh60: 1, thachNang5k: 1 } },
      { items: { luyenBinh180: 1, kinhThu2k: 1 } },
      { items: { luyenBinh480: 1, nganDuyen: 2 } },
      { items: { luyenBinh480: 2, kimDuyen: 1, thoiQuang180: 1 } },
    ],
  },
  // Chinh Chiến Bất Hưu (War Forever): 3 ngày mỗi 14 ngày, làm mới mỗi ngày — hạ yêu thú (sơn môn, bản đồ giới) nhiều mốc
  chinhChien: {
    window: { kind: 'cycle', every: 14, len: 3, offset: 2 },
    hall: 4,
    kind: 'tasks',
    daily: true,
    tasks: [0, 1, 2].flatMap(day => [
      { m: 'hunt' as const, n: 5, day, reward: { items: { thoiQuang15: 2, kinhThu500: 1 } } },
      { m: 'hunt' as const, n: 10, day, reward: { items: { thoiQuang60: 1, thachNang5k: 1 } } },
      { m: 'hunt' as const, n: 15, day, reward: { items: { thoiQuang60: 2, kinhThu2k: 1 } } },
      { m: 'hunt' as const, n: 25, day, reward: { items: { thoiQuang180: 1, nganDuyen: 1 } } },
    ]),
  },
  // Khai Lò Luyện Khí (Artisan's Forge): 2 ngày mỗi 14 ngày, làm mới mỗi ngày — luyện pháp bảo, tuyển đệ tử, săn yêu, khai mỏ
  khaiLo: {
    window: { kind: 'cycle', every: 14, len: 2, offset: 10 },
    hall: 6,
    kind: 'tasks',
    daily: true,
    tasks: [0, 1].flatMap(day => [
      { m: 'forge' as const, n: 1, day, reward: { items: { kinhThu2k: 1 } } },
      { m: 'forge' as const, n: 3, day, reward: { items: { thoiQuang180: 1, nganDuyen: 1 } } },
      { m: 'train' as const, n: 500, day, reward: { items: { luyenBinh60: 2 } } },
      { m: 'hunt' as const, n: 15, day, reward: { items: { thoiQuang60: 2 } } },
      { m: 'gather' as const, n: 50000, day, reward: { items: { thoiQuang480: 1, kimDuyen: 1 } } },
    ]),
  },
  // Tam Hệ Luyện Binh (Warpath / Victorious Heart): 4 ngày mỗi 14 ngày, làm mới mỗi ngày — tuyển (hay nâng bậc) đệ tử bậc 2 trở lên
  // từng hệ và tổng cả ba hệ
  tamHe: {
    window: { kind: 'cycle', every: 14, len: 4, offset: 12 },
    hall: 6,
    kind: 'tasks',
    daily: true,
    tasks: [0, 1, 2, 3].flatMap(day => [
      { m: 'kiem2' as const, n: 1000, day, reward: { res: { linhThach: 30000, linhThao: 30000 } } },
      { m: 'phap2' as const, n: 1000, day, reward: { res: { linhThao: 30000, linhKhoang: 30000 } } },
      { m: 'the2' as const, n: 1000, day, reward: { res: { linhThach: 30000, linhKhoang: 30000 } } },
      { m: 'train2' as const, n: 5000, day, reward: { items: { kinhThu2k: 2, luyenBinh180: 1 } } },
    ]),
  },
  // Nguyện Thụ Cầu Duyên (Esmeralda's Prayer): 4 ngày mỗi 21 ngày — cây nguyện 12 quà (8 thường, 4 đặc biệt), mỗi lượt cầu rút một quà
  // còn trên cây (theo trọng số, quà đặc biệt hiếm); rút đủ 4 quà đặc biệt thì nhận nốt quà còn lại và cây nở lại; mỗi ngày một lượt
  // miễn phí, Nguyện Tiền kiếm từ việc trong lễ (quà rút theo mầm server)
  nguyenThu: {
    window: { kind: 'cycle', every: 21, len: 4, offset: 11 },
    hall: 6,
    kind: 'wish',
    stages: [{ hunt: 2, win: 2, build: 5, tech: 5, draw: 5 }],
    cost: 10,
    pool: [
      { w: 3, big: true, r: { items: { kimDuyen: 2 } } },
      { w: 3, big: true, r: { items: { thoiQuang1440: 1 } } },
      { w: 3, big: true, r: { items: { kinhThu8k: 2 } } },
      { w: 3, big: true, r: { items: { hoSon24: 1, kimCuong: 1 } } },
      { w: 12, r: { items: { thoiQuang60: 2 } } },
      { w: 12, r: { items: { thoiQuang180: 1 } } },
      { w: 12, r: { items: { thachNang5k: 2 } } },
      { w: 12, r: { items: { thaoNang5k: 2 } } },
      { w: 12, r: { items: { khoangNang5k: 2 } } },
      { w: 10, r: { items: { kinhThu2k: 1 } } },
      { w: 10, r: { items: { loBan60: 2 } } },
      { w: 10, r: { items: { nganDuyen: 1 } } },
    ],
  },
  // Phiên Bài Kỳ Ngộ (Card King): 3 ngày mỗi 21 ngày — 12 lá úp (6 đôi), mỗi ván 2 lá đầu lật miễn phí, lá sau tốn Kỳ Ngộ Lệnh; lật
  // liền hai lá giống thì nhận quà đôi đó, lật hết 6 đôi thì thêm quà ván; tối đa 10 ván mỗi lượt lễ (lá lật ra rút theo mầm server)
  phienBai: {
    window: { kind: 'cycle', every: 21, len: 3, offset: 15 },
    hall: 6,
    kind: 'cards',
    stages: [{ hunt: 2, win: 2, build: 5, train: 0.02, draw: 5 }],
    cost: 10,
    free: 2,
    games: 10,
    pairs: [
      { items: { kimDuyen: 1 } },
      { items: { thoiQuang180: 1 } },
      { items: { kinhThu2k: 1 } },
      { items: { nganDuyen: 1 } },
      { items: { thoiQuang60: 1 } },
      { items: { thachNang5k: 1 } },
    ],
    done: { items: { thoiQuang480: 1 } },
  },
  // Hoàng Kim Mê Cảnh (Golden Kingdom): 5 ngày mỗi 28 ngày — mỗi ngày một lượt đi mê cung 10 tầng bằng tối đa 3 đội ảo; mốc quà theo
  // kỷ lục số tầng qua được
  meCanh: {
    window: { kind: 'cycle', every: 28, len: 5, offset: 20 },
    hall: 10,
    kind: 'maze',
    goals: [2, 4, 7, 10],
    rewards: [
      { items: { thoiQuang180: 2, kinhThu2k: 2 } },
      { items: { thoiQuang480: 1, nganDuyen: 3 } },
      { items: { thoiQuang480: 2, kimDuyen: 1 } },
      { items: { thoiQuang1440: 1, kimDuyen: 2 } },
    ],
  },
  // Trảm Yêu Tốc Chiến (Race Against Time): 3 ngày mỗi 21 ngày — mỗi ngày 3 lượt đua 10 phút, xuất quân săn yêu thú giới liên tiếp;
  // điểm = tổng cấp yêu thú hạ trong giờ, con cấp cao cộng giờ; mốc quà và bảng xếp hạng theo kỷ lục một lượt
  tocChien: {
    window: { kind: 'cycle', every: 21, len: 3, offset: 4 },
    hall: 8,
    kind: 'race',
    goals: [20, 50, 90, 140],
    rewards: [
      { items: { thoiQuang60: 2, kinhThu500: 2 } },
      { items: { thoiQuang180: 1, dieuThu60: 1 } },
      { items: { thoiQuang480: 1, nganDuyen: 2 } },
      { items: { thoiQuang480: 2, kimDuyen: 1 } },
    ],
  },
  // Dạ Hành Đạo Tặc (Thief in the Night): 3 ngày mỗi 21 ngày — mỗi ngày 2 lượt đánh đạo tặc bằng đội ảo; sát thương cao nhất hôm nay mở
  // rương ngày (làm mới mỗi ngày), kỷ lục cả lượt lên bảng xếp hạng
  daTac: {
    window: { kind: 'cycle', every: 21, len: 3, offset: 18 },
    hall: 7,
    kind: 'thief',
    goals: [100, 250, 450, 700],
    rewards: [
      { items: { thoiQuang60: 1, thachNang5k: 1 } },
      { items: { thoiQuang180: 1, kinhThu2k: 1 } },
      { items: { thoiQuang480: 1, nganDuyen: 1 } },
      { items: { thoiQuang480: 1, kimDuyen: 1 } },
    ],
  },
  // Truyền Đạo Tứ Phương (Spreading Civilization): 2 ngày mỗi 14 ngày, làm mới mỗi ngày — tuyển (hay nâng bậc) đệ tử bậc 2 trở lên,
  // góp sức hạ yêu vương giới
  truyenDao: {
    window: { kind: 'cycle', every: 14, len: 2, offset: 8 },
    hall: 7,
    kind: 'tasks',
    daily: true,
    tasks: [0, 1].flatMap(day => [
      { m: 'train2' as const, n: 1000, day, reward: { items: { thoiQuang60: 1, kinhThu500: 2 } } },
      { m: 'train2' as const, n: 2500, day, reward: { items: { luyenBinh60: 2, kinhThu2k: 1 } } },
      { m: 'train2' as const, n: 5000, day, reward: { items: { luyenBinh180: 1, nganDuyen: 1 } } },
      { m: 'forts' as const, n: 1, day, reward: { items: { thoiQuang180: 1 } } },
      { m: 'forts' as const, n: 3, day, reward: { items: { thoiQuang480: 1, kimDuyen: 1 } } },
    ]),
  },
  // Tàng Bảo Mãn Thương (Fill the Storehouse): 2 ngày mỗi 14 ngày, làm mới mỗi ngày — khai cạn mỏ trên bản đồ giới, tổng tài nguyên
  // khai mỏ mang về
  manThuong: {
    window: { kind: 'cycle', every: 14, len: 2, offset: 1 },
    hall: 5,
    kind: 'tasks',
    daily: true,
    tasks: [0, 1].flatMap(day => [
      { m: 'drain' as const, n: 1, day, reward: { items: { thoiQuang60: 1 } } },
      { m: 'drain' as const, n: 2, day, reward: { items: { khaiLinh8: 1 } } },
      { m: 'drain' as const, n: 4, day, reward: { items: { thoiQuang180: 1, nganDuyen: 1 } } },
      { m: 'gather' as const, n: 30000, day, reward: { items: { thachNang5k: 1, thaoNang5k: 1 } } },
      { m: 'gather' as const, n: 80000, day, reward: { items: { khoangNang5k: 2, kinhThu2k: 1 } } },
      { m: 'gather' as const, n: 150000, day, reward: { items: { thoiQuang480: 1, kimDuyen: 1 } } },
    ]),
  },
  // Khảo Cổ Động Phủ (Hunt for History): 3 ngày mỗi 14 ngày — mỗi tầng động phủ 16 ô, chọn trước giải tối thượng (đổi được tới lúc tìm
  // ra; tầng 5, 10… lựa chọn tốt hơn), cuốc từng ô nhận quà, đào trúng giải thì xuống tầng sau; rương mốc theo số tầng đã qua; mỗi
  // ngày một nhát miễn phí, nhát thêm tốn Linh Cuốc kiếm từ khai mỏ, săn yêu, săn liên hoàn (ô trúng giải theo mầm server)
  khaoCo: {
    window: { kind: 'cycle', every: 14, len: 3, offset: 4 },
    hall: 6,
    kind: 'dig',
    stages: [{ gather: 0.001, hunt: 2, chain: 2, win: 1 }],
    cost: 10,
    cells: 16,
    picks: [{ items: { thoiQuang480: 1 } }, { items: { kinhThu8k: 1 } }, { items: { nganDuyen: 3 } }],
    grand: [{ items: { kimDuyen: 3 } }, { items: { thoiQuang1440: 1 } }, { items: { hoSon24: 1, kimCuong: 1 } }],
    pool: [
      { w: 20, r: { items: { thoiQuang15: 2 } } },
      { w: 14, r: { items: { thoiQuang60: 1 } } },
      { w: 14, r: { items: { thachNang5k: 1 } } },
      { w: 14, r: { items: { thaoNang5k: 1 } } },
      { w: 14, r: { items: { khoangNang5k: 1 } } },
      { w: 10, r: { items: { kinhThu500: 2 } } },
      { w: 8, r: { items: { loBan60: 1 } } },
      { w: 6, r: { items: { nganDuyen: 1 } } },
    ],
    goals: [1, 3, 5, 10],
    rewards: [
      { items: { thoiQuang60: 2, kinhThu2k: 1 } },
      { items: { thoiQuang180: 2, nganDuyen: 2 } },
      { items: { thoiQuang480: 1, kimDuyen: 1 } },
      { items: { thoiQuang480: 2, kimDuyen: 2 } },
    ],
  },
  // Linh Noãn Kỳ Bảo (Holy Knight's Treasure): 3 ngày mỗi 14 ngày — chọn trước một món chủ lực (7,5 % mỗi quả), đập linh noãn nhận
  // quà (phần lớn tăng tốc), rương mốc theo tổng số quả đã đập; mỗi ngày một quả miễn phí, quả thêm tốn Linh Chuỳ kiếm từ việc trong lễ
  linhNoan: {
    window: { kind: 'cycle', every: 14, len: 3, offset: 7 },
    hall: 6,
    kind: 'egg',
    stages: [{ hunt: 2, win: 2, speed: 0.05, tech: 5, heal: 0.05 }],
    cost: 10,
    picks: [
      { items: { kimDuyen: 2 } },
      { items: { thoiQuang1440: 1 } },
      { items: { kinhThu8k: 2 } },
      { items: { hoSon24: 1 } },
    ],
    ch: 0.075,
    pool: [
      { w: 20, r: { items: { thoiQuang15: 3 } } },
      { w: 16, r: { items: { thoiQuang60: 1 } } },
      { w: 8, r: { items: { thoiQuang180: 1 } } },
      { w: 14, r: { items: { loBan60: 1 } } },
      { w: 14, r: { items: { luyenBinh60: 1 } } },
      { w: 12, r: { items: { thachNang5k: 1, thaoNang5k: 1 } } },
      { w: 10, r: { items: { kinhThu2k: 1 } } },
      { w: 6, r: { items: { nganDuyen: 1 } } },
    ],
    goals: [5, 15, 30, 60],
    rewards: [
      { items: { thoiQuang60: 2, kinhThu2k: 1 } },
      { items: { thoiQuang180: 2, nganDuyen: 2 } },
      { items: { thoiQuang480: 1, kimDuyen: 1 } },
      { items: { thoiQuang480: 2, kimDuyen: 2 } },
    ],
  },
  // Vạn Hoa Viên (Garden of Infinity): 3 ngày mỗi 14 ngày — đổ xúc xắc đi quanh bàn 20 ô, dừng ô nào nhận quà ô đó, qua Khởi điểm
  // thêm quà vòng, rương mốc theo tổng số lượt đổ; mỗi ngày một lượt miễn phí, lượt thêm tốn Ngân Xúc Xắc kiếm từ việc trong lễ (mặt
  // xúc xắc theo mầm server)
  vanHoa: {
    window: { kind: 'cycle', every: 14, len: 3, offset: 0 },
    hall: 6,
    kind: 'dice',
    stages: [{ hunt: 2, win: 2, build: 5, train: 0.02, gather: 0.0005 }],
    cost: 10,
    board: [
      { items: { kimDuyen: 1 } },
      { items: { thoiQuang15: 2 } },
      { items: { thachNang5k: 1 } },
      { items: { kinhThu500: 2 } },
      { items: { thaoNang5k: 1 } },
      { items: { nganDuyen: 1 } },
      { items: { thoiQuang60: 1 } },
      { items: { khoangNang5k: 1 } },
      { items: { luyenBinh60: 1 } },
      { items: { kinhThu2k: 1 } },
      { items: { thoiQuang180: 1 } },
      { items: { thachNang5k: 2 } },
      { items: { loBan60: 1 } },
      { items: { thoiQuang15: 3 } },
      { items: { nganDuyen: 2 } },
      { items: { thaoNang5k: 2 } },
      { items: { dieuThu60: 1 } },
      { items: { khoangNang5k: 2 } },
      { items: { thoiQuang60: 2 } },
      { items: { chienY: 1 } },
    ],
    lap: { items: { nganDuyen: 2, thoiQuang180: 1 } },
    goals: [5, 15, 30, 50],
    rewards: [
      { items: { thoiQuang60: 2, kinhThu2k: 1 } },
      { items: { thoiQuang180: 2, nganDuyen: 2 } },
      { items: { thoiQuang480: 1, kimDuyen: 1 } },
      { items: { thoiQuang480: 2, kimDuyen: 2 } },
    ],
  },
  // tốn Thiên Cơ Lệnh kiếm từ săn yêu, thắng trận, tăng tốc, khai mỏ, mở thiếp; cứ 30 lượt thì lượt đó chắc trúng ô lớn nhất.
  thienCo: {
    window: { kind: 'cycle', every: 14, len: 3, offset: 10 },
    hall: 7,
    kind: 'wheel',
    stages: [{ hunt: 2, win: 2, speed: 0.05, gather: 0.0005, draw: 5 }],
    cost: 10,
    pity: 30,
    elders: ['bachVoNhai', 'hoacThienCuong', 'huyenMinh', 'diepCoThanh'],
    slots: [
      { w: 3, token: 5 },
      { w: 8, token: 2 },
      { w: 14, token: 1 },
      { w: 12, r: { items: { thoiQuang60: 2 } } },
      { w: 5, r: { items: { thoiQuang180: 1 } } },
      { w: 12, r: { items: { thachNang5k: 1, thaoNang5k: 1, khoangNang5k: 1 } } },
      { w: 2, r: { items: { kimDuyen: 1 } } },
      { w: 8, r: { items: { nganDuyen: 2 } } },
      { w: 10, r: { items: { hanhLuc50: 1 } } },
      { w: 9, r: { items: { kinhThu2k: 2 } } },
      { w: 9, r: { items: { tuLinh8: 1 } } },
      { w: 8, r: { items: { khuechTran8: 1 } } },
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
// Việc Cát Tường Hạ Giá giảm được (chỉ số trong fest.sp[0]): 0 xây / nâng công trình · 1 lĩnh ngộ công pháp · 2 tuyển đệ tử
export const STALL_JOBS = ['build', 'tech', 'train'] as const
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
// Chương nhiệm vụ (Chapter Quests của RoK, theo cảnh giới): nhiệm vụ đầu mỗi chương — tên chương ở i18n quest.chapters (cùng thứ tự)
export const QUEST_CHAPTERS = [0, 11, 27, 39, 47, 61]
export const questChapter = (i: number) => QUEST_CHAPTERS.filter(x => x <= i).length - 1
