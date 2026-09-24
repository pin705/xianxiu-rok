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
export const BASE_CAP = 2000   // sức chứa mỗi loại khi chưa có Tàng Bảo Các
// Linh khí tự nhiên của núi: mỗi loại 60/giờ dù chưa có công trình nào. Không có nó, người dồn hết tài nguyên nâng
// Chủ điện trước khi xây Linh điền/Khoáng mạch sẽ kẹt vĩnh viễn (xây hai nhà đó cần chính thảo/khoáng đã cạn).
export const BASE_RATE = 60
export const CAP_GROWTH = 1.3  // mỗi tầng Tàng Bảo Các
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
  cost: Bag      // chi phí lên tầng 1, tầng sau nhân COST_GROWTH
  time: number   // giây lên tầng 1, tầng sau nhân TIME_GROWTH
  power: number  // thế lực mỗi tầng, cộng dồn: tầng n góp power × (1 + 2 + … + n)
  makes?: Res    // tài nguyên sản xuất
  rate?: number  // sản lượng mỗi giờ, cho mỗi tầng
}

// Chủ điện bắt đầu ở tầng 1, nên lần nâng đầu là lên tầng 2.
const defs = {
  chuDien:      { unlock: 1, time: 60, power: 40, cost: b(100, 100, 100) },
  tuLinhTran:   { unlock: 1, time: 10, power: 8, cost: b(0, 80, 80), makes: 'linhThach', rate: 600 },
  linhDien:     { unlock: 1, time: 10, power: 8, cost: b(80, 0, 80), makes: 'linhThao', rate: 600 },
  khoangMach:   { unlock: 1, time: 10, power: 8, cost: b(80, 80, 0), makes: 'linhKhoang', rate: 600 },
  tangBaoCac:   { unlock: 2, time: 20, power: 10, cost: b(100, 60, 100) },
  dienVoTruong: { unlock: 2, time: 30, power: 14, cost: b(120, 120, 60) },
  danPhong:     { unlock: 3, time: 45, power: 16, cost: b(100, 150, 100) },
  tangKinhCac:  { unlock: 4, time: 45, power: 16, cost: b(150, 80, 150) },
  luyenKhiPhong: { unlock: 8, time: 45, power: 16, cost: b(110, 70, 140) },
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

export const BATCH_BASE = 20     // số đệ tử mỗi lượt tuyển: BATCH_BASE + BATCH_STEP × tầng Diễn võ trường
export const BATCH_STEP = 20
export const HOSPITAL_BASE = 80  // chỗ nằm thương binh: HOSPITAL_BASE + HOSPITAL_STEP × tầng Đan phòng
export const HOSPITAL_STEP = 120
export const HEAL_COST = 0.4     // chữa 1 thương binh tốn 40% chi phí tuyển
export const HEAL_TIME = 0.3

// ---------- Trận đánh ----------

export const DEF_K = 60        // giảm sát thương = thủ / (DEF_K + thủ)
export const MAX_ROUNDS = 10   // hết 10 lượt chưa phân thắng bại: bên tấn công rút lui
export const SKILL_EVERY = 3   // trưởng lão thi triển công pháp ở lượt 3, 6, 9

// Trưởng lão là trận nhãn: mỗi cấp +4% công và máu cả đội
export const ELDER_STEP = 0.04
export const ELDER_MAX = 40
export const EXP_BASE = 50     // tổng kinh nghiệm để đạt cấp n: EXP_BASE × n × (n − 1)
export const LOSS_EXP = 0      // thua không có kinh nghiệm: bí cảnh đánh tức thì, cho kinh nghiệm khi thua là cày cấp bằng cách gửi 1 đệ tử

// skill: sức công pháp chủ động của trưởng lão · forge: thời gian luyện pháp bảo
export type Bonus =
  | 'prod' | 'prod.linhThach' | 'prod.linhThao' | 'prod.linhKhoang' | 'storage' | 'build' | 'train' | 'march'
  | 'heal' | 'brew' | 'hospital' | 'loot' | 'exp' | 'trib' | 'atk' | 'def' | 'hp' | `atk.${UnitType}` | `hp.${UnitType}`
  | 'skill' | 'forge'

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
  thanhPhong: { type: 'kiem', el: 'moc', skill: { kind: 'burst', v: 1.2, type: 'kiem' }, passives: [{ at: 5, key: 'atk.kiem', v: 0.1 }, { at: 12, key: 'atk', v: 0.06 }] },
  thachKien: { type: 'the', el: 'tho', skill: { kind: 'shield', v: 0.5 }, passives: [{ at: 5, key: 'hp.the', v: 0.12 }, { at: 12, key: 'def', v: 0.1 }] },
  nhuYen: { type: 'phap', el: 'hoa', skill: { kind: 'burst', v: 1.4, type: 'phap' }, passives: [{ at: 5, key: 'atk.phap', v: 0.1 }, { at: 12, key: 'exp', v: 0.2 }] },
  loiChan: { type: 'kiem', el: 'kim', skill: { kind: 'burst', v: 0.9 }, passives: [{ at: 5, key: 'atk.kiem', v: 0.12 }, { at: 12, key: 'trib', v: 0.12 }] },
  vanHac: { type: 'phap', el: 'moc', skill: { kind: 'heal', v: 0.25 }, passives: [{ at: 5, key: 'hp', v: 0.06 }, { at: 12, key: 'loot', v: 0.2 }] },
  hanBang: { type: 'the', el: 'thuy', skill: { kind: 'weaken', v: 0.35 }, passives: [{ at: 5, key: 'def', v: 0.1 }, { at: 12, key: 'atk', v: 0.08 }] },
  // Từ tầng 15: bí cảnh 4–5, Thông Thiên Tháp tầng 30 và 45, sự kiện tuần (mốc 5), yêu vương trung tâm giới
  bachVoNhai: { type: 'kiem', el: 'kim', skill: { kind: 'burst', v: 1.7, type: 'kiem' }, passives: [{ at: 5, key: 'atk.kiem', v: 0.12 }, { at: 12, key: 'atk', v: 0.08 }] },
  macSau: { type: 'phap', el: 'tho', skill: { kind: 'weaken', v: 0.4 }, passives: [{ at: 5, key: 'atk.phap', v: 0.12 }, { at: 12, key: 'hp', v: 0.06 }] },
  hoacThienCuong: { type: 'the', el: 'hoa', skill: { kind: 'shield', v: 0.55 }, passives: [{ at: 5, key: 'hp.the', v: 0.14 }, { at: 12, key: 'atk', v: 0.06 }] },
  toMiNuong: { type: 'phap', el: 'thuy', skill: { kind: 'heal', v: 0.3 }, passives: [{ at: 5, key: 'hp', v: 0.06 }, { at: 12, key: 'loot', v: 0.25 }] },
  diepCoThanh: { type: 'kiem', el: 'moc', skill: { kind: 'burst', v: 1.1 }, passives: [{ at: 5, key: 'atk.kiem', v: 0.15 }, { at: 12, key: 'exp', v: 0.2 }] },
  huyenMinh: { type: 'the', el: 'thuy', skill: { kind: 'weaken', v: 0.45 }, passives: [{ at: 5, key: 'def', v: 0.12 }, { at: 12, key: 'trib', v: 0.15 }] },
} satisfies Record<string, ElderDef>
export type ElderId = keyof typeof elders
export const ELDERS: Record<ElderId, ElderDef> = elders
export const FIRST_ELDER: ElderId = 'thanhPhong'

// Thiên phú: mỗi 5 cấp trưởng lão một điểm, chia vào 3 nhánh (công · thể · đạo), mỗi nhánh tối đa TALENT_MAX.
// Tẩy Tủy Đan trả lại hết điểm. Nhánh đạo tăng sức công pháp chủ động.
export const TALENT_EVERY = 5
export const TALENT_MAX = 5
export const TALENTS: { key: Bonus; v: number }[] = [{ key: 'atk', v: 0.03 }, { key: 'hp', v: 0.04 }, { key: 'skill', v: 0.06 }]

// ---------- Tàng Kinh Các ----------

export const TECH_ROWS = [1, 3, 6, 9, 12, 16, 21] // tầng Tàng Kinh Các mở từng hàng
export const TECH_COST_GROWTH = 1.7
export const TECH_TIME_GROWTH = 1.8
export type TechDef = { row: number; max: number; key: Bonus; v: number; cost: Bag; time: number }
const R0 = b(100, 150, 150), R1 = b(400, 500, 400), R2 = b(1200, 1500, 1200), R3 = b(3000, 3500, 3000), R4 = b(7000, 8000, 7000)
const R5 = b(15000, 17000, 15000), R6 = b(32000, 36000, 32000)
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
  tuKhi: { unlock: 1, cost: b(300, 600, 150), time: 1200 },      // bớt 15 phút một việc đang chờ
  boiNguyen: { unlock: 3, cost: b(600, 1500, 600), time: 1800 }, // +kinh nghiệm cho trưởng lão
  doKiep: { unlock: 5, cost: b(1500, 3000, 1500), time: 900 },   // lôi kiếp yếu đi khi độ kiếp
  hoiXuan: { unlock: 8, cost: b(2000, 5000, 2000), time: 1800 },  // chữa ngay CURE thương binh
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
const G0 = b(2000, 1500, 3000), G1 = b(1500, 3000, 2000), G2 = b(3000, 2000, 1500)
const gear = {
  thanhSuong: { key: 'atk.kiem', v: 0.03, cost: G0, time: 1800 }, // kiếm
  xichViem: { key: 'atk.phap', v: 0.03, cost: G2, time: 1800 },   // quạt
  kimCang: { key: 'hp.the', v: 0.035, cost: G1, time: 1800 },     // vòng tay
  huyenVu: { key: 'def', v: 0.03, cost: G1, time: 2400 },         // giáp mai rùa
  hoTam: { key: 'hp', v: 0.02, cost: G1, time: 2400 },            // kính hộ tâm
  thienLoi: { key: 'atk', v: 0.02, cost: G0, time: 2400 },        // chuỳ
  tuBao: { key: 'loot', v: 0.05, cost: G2, time: 1800 },          // bồn tụ bảo
  ngocGian: { key: 'exp', v: 0.05, cost: G2, time: 1800 },        // ngọc giản
  tiLoi: { key: 'trib', v: 0.03, cost: G0, time: 2400 },          // châu tị lôi
} satisfies Record<string, GearDef>
export type GearId = keyof typeof gear
export const GEAR: Record<GearId, GearDef> = gear

// ---------- Bản đồ ----------

// Toạ độ trên bản đồ vùng 400 × 1000; tông môn ở dưới cùng. Khoảng cách → thời gian hành quân.
export const HOME = { x: 200, y: 930 }
export const MARCH_SPEED = 0.5 // giây mỗi đơn vị bản đồ
export const MARCH_MIN = 20    // giây
export const MARCH_SLOTS = [1, 2, 3, 4, 5] // số đội xuất quân cùng lúc ở Luyện Khí / Trúc Cơ / Kim Đan / Nguyên Anh / Hóa Thần

export type Reward = { res?: Partial<Bag>; items?: Partial<Record<PillId, number>>; elder?: ElderId; exp?: number }

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
export const BEAST_STR = [15, 1.4]  // sức mạnh cấp n = 15 × 1.4^(n−1), tính bằng số đệ tử bậc 1
export const BEAST_LOOT = [80, 1.42] // mỗi loại tài nguyên
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
  loot: number  // mỗi lần sau: mỗi loại tài nguyên
  exp: number
}
export const SECTS: SectDef[] = [
  { hall: 3, x: 330, y: 890, type: 'the', str: 45, elder: { skill: { kind: 'shield', v: 0.3 }, level: 2 }, first: { res: b(600, 600, 600), items: { tuKhi: 2 }, elder: 'thachKien' }, loot: 250, exp: 60 },
  { hall: 6, x: 40, y: 520, type: 'kiem', str: 180, elder: { skill: { kind: 'burst', v: 1.2 }, level: 8 }, first: { res: b(2500, 2500, 2500), items: { boiNguyen: 2 } }, loot: 900, exp: 200 },
  { hall: 8, x: 360, y: 370, type: 'phap', str: 380, elder: { skill: { kind: 'weaken', v: 0.3 }, level: 12 }, first: { res: b(4000, 4000, 4000), items: { doKiep: 1 }, elder: 'loiChan' }, loot: 1800, exp: 400 },
  { hall: 11, x: 40, y: 220, type: 'kiem', str: 800, elder: { skill: { kind: 'burst', v: 1.6 }, level: 16 }, first: { res: b(8000, 8000, 8000), items: { boiNguyen: 3 } }, loot: 4000, exp: 800 },
  { hall: 13, x: 300, y: 110, type: 'the', str: 1500, elder: { skill: { kind: 'heal', v: 0.3 }, level: 20 }, first: { res: b(15000, 15000, 15000), items: { tuKhi: 10 } }, loot: 7000, exp: 1400 },
]
export const SECT_COOLDOWN = 8 * 3_600_000
export const SECT_SHARE = 0.5 // hệ chính 50%, hai hệ còn lại mỗi hệ 25%

// Bí cảnh: đánh ngay không cần hành quân, mỗi tầng một lần.
export type RealmDef = { hall: number; x: number; y: number; type: UnitType; tier: Tier; el?: Element; floors: { str: number; reward: Reward }[] }
export const REALMS: RealmDef[] = [
  {
    hall: 3, x: 250, y: 752, type: 'phap', tier: 1,
    floors: [
      { str: 25, reward: { res: b(300, 300, 300), items: { tuKhi: 1 }, exp: 40 } },
      { str: 40, reward: { res: b(500, 500, 500), exp: 60 } },
      { str: 60, reward: { items: { tuKhi: 2 }, exp: 80 } },
      { str: 85, reward: { res: b(800, 800, 800), exp: 100 } },
      { str: 120, reward: { items: { boiNguyen: 1 }, elder: 'nhuYen', exp: 150 } },
    ],
  },
  {
    hall: 7, x: 104, y: 470, type: 'kiem', tier: 2,
    floors: [
      { str: 200, reward: { res: b(2000, 2000, 2000), exp: 200 } },
      { str: 260, reward: { items: { tuKhi: 3 }, exp: 240 } },
      { str: 330, reward: { res: b(3000, 3000, 3000), exp: 280 } },
      { str: 420, reward: { items: { boiNguyen: 2 }, exp: 320 } },
      { str: 520, reward: { items: { doKiep: 1 }, elder: 'vanHac', exp: 400 } },
    ],
  },
  {
    hall: 11, x: 280, y: 180, type: 'the', tier: 3,
    floors: [
      { str: 700, reward: { res: b(6000, 6000, 6000), exp: 500 } },
      { str: 900, reward: { items: { tuKhi: 5 }, exp: 600 } },
      { str: 1150, reward: { res: b(9000, 9000, 9000), exp: 700 } },
      { str: 1450, reward: { items: { boiNguyen: 3 }, exp: 800 } },
      { str: 1800, reward: { res: b(15000, 15000, 15000), elder: 'hanBang', exp: 1000 } },
    ],
  },
  {
    hall: 16, x: 196, y: 298, type: 'kiem', tier: 4, el: 'moc',
    floors: [
      { str: 6000, reward: { res: b(40000, 40000, 40000), exp: 1500 } },
      { str: 7500, reward: { items: { daiTuKhi: 1, hoiXuan: 2 }, exp: 1800 } },
      { str: 9500, reward: { res: b(60000, 60000, 60000), exp: 2100 } },
      { str: 12000, reward: { items: { taiTuy: 1, phaCanh: 1 }, exp: 2400 } },
      { str: 15000, reward: { res: b(90000, 90000, 90000), elder: 'bachVoNhai', exp: 3000 } },
    ],
  },
  {
    hall: 21, x: 300, y: 30, type: 'phap', tier: 5, el: 'thuy',
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
  { hall: 5, tier: 1, waves: [{ type: 'kiem', str: 80 }, { type: 'phap', str: 100 }, { type: 'the', str: 120 }] },
  { hall: 10, tier: 2, waves: [{ type: 'kiem', str: 250 }, { type: 'phap', str: 320 }, { type: 'the', str: 400 }] },
  { hall: 15, tier: 3, waves: [{ type: 'kiem', str: 3000, el: 'hoa' }, { type: 'phap', str: 3600, el: 'thuy' }, { type: 'the', str: 4200, el: 'kim' }] },
  { hall: 20, tier: 4, waves: [{ type: 'kiem', str: 9000, el: 'moc' }, { type: 'phap', str: 10500, el: 'hoa' }, { type: 'the', str: 12000, el: 'tho' }] },
]
export const TRIB_COOLDOWN = 10 * 60_000
export const TRIB_EXP = [300, 1500, 4000, 9000]

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
export const PROTECT = 0.3
export const RAID_SHARE = 0.3
export const CARRY = 40
export const SHIELD_TIME = 8 * 3_600_000
export const NEWBIE_SHIELD = 72 * 3_600_000
export const REVENGE_TIME = 24 * 3_600_000
export const FOES_MAX = 5
export const PVP_START = 1000 // điểm kiểu Elo
export const ELO_K = 32
export const MATCH_POOL = 10 // ghép cặp: MATCH_PICK người ngẫu nhiên trong MATCH_POOL người gần lực chiến nhất
export const MATCH_PICK = 3
export const PVP_GATE = { x: 200, y: -60 } // tới P3 (bản đồ giới): đội đi cướp rời vùng qua mép trên bản đồ
export const GUARD_STEP = 0.04 // Hộ Sơn Đại Trận: thủ và máu bên thủ mỗi tầng

// ---------- Thư ----------

export const MAIL_MAX = 30

// ---------- Sự kiện tuần ----------

// Mỗi tuần một chủ đề (theo số tuần), cộng điểm khi làm việc đó; đủ mốc thì nhận quà, top EVENT_TOP của giới nhận thư lúc hết tuần.
export const EVENTS = ['win', 'train', 'brew', 'build', 'raid', 'forge'] as const
export type EventId = (typeof EVENTS)[number]
// điểm mỗi lần (tuyển: mỗi 5 đệ tử)
export const EVENT_PTS: Record<EventId, number> = { win: 10, train: 1, brew: 25, build: 30, raid: 60, forge: 40 }
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
