// Kiểu dữ liệu của một tông môn (State là save) và của chiến báo, hành quân. Chỉ kiểu, không luật.
import { type Round } from '../combat.ts'
import {
  type Bag,
  type Bonus,
  type BuildingId,
  type DailyId,
  type DrillMod,
  type StratId,
  type FormId,
  type HermitId,
  type ElderId,
  type GearId,
  type ItemId,
  type PillId,
  type Res,
  type Reward,
  type TechId,
  type Tier,
  type UnitId,
  type UnitType,
  type WeeklyId,
  type FestId,
  type FrameId,
  type Metric,
  type AchId,
  type DaoId,
} from '../data.ts'
import type { MailArgs } from './mailargs.ts'
export type { MailArgs }

export type Troops = Record<UnitId, number>
export type Army = Partial<Troops>
export type Items = Partial<Record<ItemId, number>>
export type Job = { building: BuildingId; level: number; startAt: number; finishAt: number }
export type TrainJob = { unit: UnitId; n: number; startAt: number; finishAt: number; up?: true } // up: nâng bậc
export type HealJob = { troops: Army; startAt: number; finishAt: number }
export type StudyJob = { tech: TechId; level: number; startAt: number; finishAt: number }
export type BrewJob = { pill: PillId; n: number; startAt: number; finishAt: number }
export type ForgeJob = { gear: GearId; level: number; startAt: number; finishAt: number }
export type Gear = { lv: number; on?: ElderId; aw?: number } // on: trưởng lão đang đeo · aw: tầng khai linh (Iconic)
export type Talent = number[] // điểm đã cộng mỗi nút thiên phú (talentNode)
// until: lúc hết (due() gỡ đúng giờ, nên sản lượng trước/sau tính đúng); 0 = giữ tới khi server gỡ. src: nguồn, mỗi nguồn một buff
export type Buff = { key: Bonus; v: number; until: number; src: string }
// pvp: i = mã người chơi bị cướp · spot: i = chỉ số điểm trên bản đồ giới (atlas.points) · trib: kiếp vân, i = lần độ kiếp
// flag: trận kỳ của minh khác (i: mã trận kỳ) — đội tới phá
export type Target = {
  kind: 'beast' | 'sect' | 'realm' | 'tower' | 'pvp' | 'spot' | 'trib' | 'flag' | 'camp'
  i: number
} // camp: trại ở ô i (y·MAP_W + x)
export type Gain = { res: Partial<Bag>; items: Items; elder?: ElderId; exp: number }
export type March = {
  id: number
  elder: ElderId
  deputy?: ElderId // phó trưởng lão đi cùng (ghép lúc xuất quân nếu đang rảnh)
  army: Army
  target: Target
  seed: number
  startAt: number
  arriveAt: number
  returnAt: number // 0: chưa hẹn (đi cướp: server giải trận lúc tới nơi rồi mới biết giờ về)
  foe?: string // đi cướp: tên tông môn bên kia (để hiện)
  path?: { x: number; y: number }[] // đi trên bản đồ giới: các điểm dừng (đi, …cổng, tới) — theo ô
  task?: 'take' | 'gather' | 'hit' | 'hunt' | 'aid' | 'rob' // điểm trên bản đồ giới: chiếm (đóng quân) · khai mỏ · đánh yêu vương · săn yêu thú · cướp khoáng; aid: viện binh nhà đồng minh
  prey?: { pid: number; id: number } // cướp khoáng: đội khai mỏ bị nhắm
  dig?: true // đi đào kho báu ở ô target.i (Tàng Bảo Đồ)
  rune?: { i: number; cyc: number; k: number; t: number } // đi nhặt phù văn thứ i của chu kỳ cyc (loại k, phẩm t)
  goods?: { i: number; cyc: number; t: number } // đi nhặt kiện hàng rơi thứ i của chu kỳ cyc (phẩm t) — Thương Đội Gặp Nạn
  rally?: number // thuộc kết trận này (mọi đội cùng tới lúc hẹn, đánh như một bên)
  pup?: number // Cơ Quan Khôi Lỗi: khôi lỗi phá trận mang theo (dùng hết trong trận)
  form?: FormId // trận pháp lúc xuất quân
  spot?: string // loại điểm (để hiện tên): vein, mine, boss, gate, heaven
  stay?: boolean // đang đóng quân ở điểm (chỉ về khi bị đánh bật hoặc gọi về)
  mine?: { end: number; amount: number; res: Res } // đang khai mỏ tới end, mang về amount
  back?: Army // sau trận: đệ tử còn đứng được, thương binh và chiến lợi phẩm mang về
  hurt?: Army
  gain?: Gain
  report?: number
  pill?: PillId // kiếp vân: đan độ kiếp đã dùng lúc tụ
  foil?: number // kiếp vân: số lần bị cướp trúng trong lúc tụ (phá kiếp)
  chain?: boolean // săn liên hoàn: đi thẳng từ giữa đường về tới yêu thú khác (hạ xong thì về núi theo đường mới)
}
export type Snap = {
  elder?: ElderId
  deputy?: ElderId
  level: number
  dao?: DaoId // đạo thống (vẽ đệ tử đặc trưng; chiến báo cũ chưa có)
  troops: { type: UnitType; tier: Tier; n: number }[]
}
// Luận Võ Liên Hoàn (DRILL_* ở data.ts): ngày của phiên, đội ảo còn lại, sức giáo đầu trận đầu, số trận thắng, công pháp đã
// chọn cho giáo đầu, ba lựa chọn đang chờ (sau mỗi DRILL_EVERY thắng), thua chưa, số mốc quà đã nhận
export type Drill = {
  day: number
  elder: ElderId
  army: Army
  base: number
  wins: number
  mods: DrillMod[]
  offer?: DrillMod[]
  over?: boolean
  got: number
}
export type Report = {
  id: number
  at: number
  kind:
    | 'beast'
    | 'sect'
    | 'realm'
    | 'tower'
    | 'trib'
    | 'pvp'
    | 'spot'
    | 'arena'
    | 'legion'
    | 'drill'
    | 'camp'
    | 'trial'
    | 'thief'
    | 'escort'
    | 'maze' // escort: Áp Tiêu Hộ Hàng (i: số sao) · maze: Hoàng Kim Mê Cảnh (i: tầng × 100 + ô) · thief: Dạ Hành Đạo Tặc (i: phần nghìn sát thương) · legion: đợt i Ma triều · drill: trận i Luận Võ · camp: trận ở trại ô i · trial: cửa i Thí Luyện
  i: number
  spot?: string // loại điểm bản đồ giới
  f?: number // bí cảnh: tầng
  foe?: string // PvP: tên tông môn bên kia
  def?: boolean // PvP: mình là bên thủ
  lost?: Partial<Bag> // PvP bên thủ: tài nguyên bị cướp
  win: boolean
  fights: { a: Snap; b: Snap; rounds: Round[] }[]
  hurt: Army // thương vong
  dead: Army // phần Đan phòng không còn chỗ nằm
  light?: Army // thương nhẹ tự lành khi đội về núi (không vào Đan phòng)
  wall?: number // PvP: đệ tử bên đánh bị kiếm trận Hộ Sơn chém trước trận
  gain: Gain
}
// Việc cứu nạn đang làm: ở thôn i, tăng chỉ số m thêm n (từ mức from lúc nhận) trước lúc until
export type NanQuest = { i: number; m: Metric; n: number; from: number; until: number }
// Bộ đếm tích luỹ (sự kiện đo tiến độ bằng hiệu hai lần đọc). Trường có dấu ? thêm sau: save cũ thiếu thì là 0.
export type Stats = {
  trained: number
  healed: number
  brewed: number
  won: number
  lost: number
  hunted?: number // yêu thú hạ được
  runes?: number // phù văn đã nhặt
  guards?: number // trận thắng hộ trận linh thú
  trial?: number // điểm Thí Luyện Yêu Hoàng: mỗi cửa qua được 1 + bậc độ khó
  trainPts?: number // điểm tuyển theo bậc (TRAIN_PTS)
  huntLv?: number // tổng cấp yêu thú hạ được
  chained?: number // yêu thú giới hạ bằng săn liên hoàn
  rescued?: number // việc cứu nạn Thôn Trang Gặp Nạn đã báo công
  sped?: number // phút tăng tốc đã dùng
  spedTrain?: number // … trong đó dùng cho việc tuyển đệ tử (Luyện Binh Phù Hội)
  goods?: number // kiện hàng Thương Đội Gặp Nạn đã nhặt
  bought?: number // lần mua ở Thương nhân vân du
  raided?: number // lần cướp thắng
  gathered?: number // tài nguyên khai mỏ mang về
  drawn?: number // lần mở thiếp Chiêu Hiền Đài
  allied?: number // lượt cung phụng Đại Trận + lượt giúp đỡ đồng minh
  duels?: number // trận Luận Kiếm Đài đã đánh (bên đánh)
  duelWins?: number
  kp?: number // chiến công (Kill Points của RoK): thế lực đệ tử địch hạ được trong trận giữa các tông môn
  t2kiem?: number // đệ tử bậc 2 trở lên tuyển / nâng bậc xong, theo hệ (Tam Hệ Luyện Binh)
  t2phap?: number
  t2the?: number
  drained?: number // mỏ trên bản đồ giới khai cạn
  forts?: number // lần góp sức hạ yêu vương giới (Truyền Đạo Tứ Phương)
}
// Một sự kiện của trung tâm sự kiện: lượt đang mở (key), giai đoạn, chỉ số lúc bắt đầu giai đoạn, điểm đã dồn từ giai đoạn
// trước, quà đã nhận, số ngày đăng nhập trong lượt (và ngày đếm gần nhất)
export type Fest = {
  key: number
  stage: number
  base: Partial<Record<Metric, number>>
  bank: number
  got: number[]
  days: number
  last: number
  sp?: number[] // lễ FEST_STAGED: điểm từng ải đã xong (bảng xếp hạng ải)
  shut?: boolean // lượt đã đóng: điểm khoá lại, việc làm sau giờ đóng không vào bảng
}
// Hương Hỏa: tổng điểm, chuỗi ngày vào game liên tiếp, ngày vào gần nhất, ngày đã mở rương (dayOf; -1 = chưa)
export type Vip = {
  pts: number
  streak: number
  day: number
  chest: number
  shop?: { week: number; got: Partial<Record<string, number>> } // Hương Hỏa Các: số lần đã mua từng món trong tuần `week`
  gifts?: number[] // Lễ vật tấn cấp đã mua (theo cấp Hương Hỏa)
}
// Chiêu Hiền Đài: lúc lượt miễn phí kế tiếp của mỗi loại thiếp, số lần mở thiếp vàng từ lần bảo hiểm trước,
// và phần quà lần mở gần nhất (server điền — client hiện sau khi nhận patch)
export type Tavern = {
  silver: number
  gold: number
  pity: number
  last: { at: number; got: Reward; tokens: Partial<Record<ElderId, number>> } | null
}
export type Daily = { day: number; n: Record<DailyId, number>; got: boolean[]; bonus: boolean }
export type Weekly = { week: number; n: Record<WeeklyId, number>; got: boolean[]; bonus: boolean }
export type Ev = { week: number; pts: number; got: boolean[] } // sự kiện tuần: điểm, mốc đã nhận
export type Foe = { pid: number; name: string; at: number } // ai đã đánh mình (báo thù)
// Trận khí (Armament của RoK): mã, trận, ô (0 trận kỳ · 1 trận đồ · 2 trận bàn · 3 pháp chung), phẩm (0–3), các dòng trận văn (INS)
export type Arm = { id: number; f: FormId; slot: number; q: number; ins: number[] }
// Cống hiến trong tiên minh: điểm cống hiến đang có (mua ở Cống Hiến Các, giữ cả khi đổi minh), lúc lượt cung phụng hồi đầy,
// ngày (dayOf) và số cống hiến đã nhận từ giúp đỡ trong ngày đó
export type Contrib = { credit: number; full: number; day: number; helped: number }
// Minh vụ đường của mình: tuần, việc đang nhận (chỉ số lúc nhận, hạn chót), ngày (dayOf) và số lượt đã nhận trong ngày đó,
// các mốc quà đã nhận tuần này
// Luận Kiếm Đài: đội hình thủ (theo thứ tự ra trận), điểm, tuần / ngày của điểm và lượt, lượt còn, ngày đã mở rương, nhật ký
export type ArenaTeam = { elder: ElderId; type: UnitType }
export type ArenaLog = { at: number; pid: number; foe: string; win: boolean; delta: number; def: boolean } // def: mình thủ
export type Arena = {
  lineup: ArenaTeam[]
  pts: number
  week: number
  day: number
  left: number
  chest: number
  log: ArenaLog[]
  ky?: number // Kiếm Ý: tiền của Luận Kiếm Thương Điếm
  revenge?: number // ngày (dayOf) đã phục thù
  buys?: { week: number; n: number[] } // đã mua mỗi món của Thương Điếm trong tuần
}
export type MobTask = { m: Metric; n: number; pts: number; base: number; until: number }
export type Mob = { week: number; task: MobTask | null; day: number; took: number; got: number[] }
// Mê vụ: hàng rows[cy] bit cx = ô sương đã khai; fly: linh điểu đang bay — các ô sương tan lúc at, điểu về lúc back
export type Fog = { rows: number[]; fly: { cells: number[]; at: number; back: number }[] }
// Đội đang kéo tới: mã hành quân và người chơi bên kia (để gỡ đúng lúc trận giải), tên tông môn, lúc tới nơi
// spot: tới cướp đội khai ở điểm này · elder / n / main: Thiên Nhãn lộ theo tầng Hộ Sơn Đại Trận (trưởng lão dẫn, quân số, hệ chính)
export type Incoming = {
  id: number
  pid: number
  foe: string
  at: number
  spot?: number
  elder?: ElderId
  n?: number
  main?: UnitType
}
// Thư: chữ dựng ở client theo khoá k và tham số a (@rok/i18n mailText), quà nhận đúng một lần.
// Thêm loại thư: thêm khoá vào MailArgs — i18n báo thiếu chữ ở mọi ngôn ngữ.
export type MailKind = keyof MailArgs
// Thư mới (chưa có id): a bắt buộc, đúng kiểu theo khoá
export type NewMail = { [K in MailKind]: { at: number; k: K; a: MailArgs[K]; gift?: Reward } }[MailKind]
// Thư đã lưu: save cũ có thể thiếu a; server mới hơn client có thể gửi khoá client chưa biết
export type Mail = { id: number; at: number; k: string; a?: (string | number)[]; gift?: Reward; got?: boolean }

// Hoàng Kim Mê Cảnh: ngày của lượt, tầng đang đi (từ 0), ô của tầng (−1 sương; kind; kind + 8 đã xong), các đội ảo (quân lúc vào /
// còn lại, lực chiến lúc vào), phúc đã chọn và phúc đang mời chọn, lượt đã hết (mọi đội ngã)
export type Maze = {
  day: number
  floor: number
  tiles: number[]
  teams: { elder: ElderId; full: Army; army: Army; base: number }[]
  bless: string[]
  offer?: string[]
  over?: boolean
}
export type State = {
  v: 4 // phiên bản save
  name: string // tên tông môn
  quest: number // chỉ số nhiệm vụ hiện tại trong QUESTS
  time: number // tài nguyên đã tính tới mốc này
  res: Bag
  carry: Bag // phần lẻ chưa đủ 1 đơn vị (đơn vị × ms), để kết quả không phụ thuộc số lần gọi advance
  yard?: Bag // sản lượng nằm ở công trình chờ chạm thu (đơn vị × ms như carry — yardOf ra số đơn vị)
  levels: Record<BuildingId, number>
  queue: Job[]
  troops: Troops // đệ tử đang ở tông môn
  wounded: Troops // thương binh nằm ở Đan phòng (kể cả đang được chữa)
  train: TrainJob | null
  train2?: TrainJob | null // hàng tuyển thứ hai (Diễn võ trường tầng TRAIN2_LV — như nhiều nhà lính tuyển song song của RoK)
  heal: HealJob | null
  study: StudyJob | null
  brew: BrewJob | null
  forge: ForgeJob | null // Luyện Khí Phòng: một món mỗi lúc
  tech: Partial<Record<TechId, number>>
  items: Items
  elders: Partial<Record<ElderId, number>> // trưởng lão đã thu nhận → kinh nghiệm
  talents: Partial<Record<ElderId, Talent>> // điểm thiên phú đã cộng (của bộ đang dùng)
  convoyDay?: number // ngày (giờ VN) đã hộ tống Linh Thương — mỗi ngày một chuyến
  assaultDay?: number // ngày (giờ VN) đã vào trận Vây Công Yêu Vương — mỗi ngày một lượt (thua thì được trả)
  divine?: { elder: ElderId; season: number } // Thần Binh: trưởng lão cầm, mùa (seasonAt lúc gắn)
  aux?: Partial<Record<ElderId, ElderId[]>> // Mượn Pháp: trưởng lão dẫn đội → người cho mượn tâm pháp
  royale?: { day: number; n: number; pts: number } // Cổ Khư Loạn Chiến: ngày (giờ VN), lượt đã vào hôm đó, điểm cộng dồn
  daibi?: { day: number; n: number; win: number } // Tiên Môn Đại Bỉ: ngày (giờ VN), lượt đã vào hôm đó, số trận thắng
  silver?: { day: number; n: number; win: number } // Tán Tu Tranh Châu: ngày (giờ VN), lượt đã vào hôm đó, số trận thắng
  vanchu?: { day: number; n: number; win: number } // Vân Chu Hội Chiến: ngày (giờ VN), lượt đã vào hôm đó, số trận thắng
  ballad?: number // Tứ Nhân Thám Bí: tuần đã nhận quà
  mystic?: { day: number; n: number; win: number } // Huyễn Vực Bí Cảnh: ngày (giờ VN), lượt hôm đó, số lần phá đảo
  // Viễn Chinh: sao từng màn (bit: thắng · còn quân · không đội ngã), huân chương đã kiếm / đã tiêu, ngày mở rương, tuần và số đã đổi mỗi món
  vc?: { stars: number[]; medals: number; spent: number; chest: number; week?: number; n?: number[] }
  tpage?: Partial<Record<ElderId, { at: number; pages: Talent[] }>> // lưu bộ thiên phú: bộ đang dùng + các bộ đã lưu
  gear: Partial<Record<GearId, Gear>>
  buffs: Buff[]
  marches: March[]
  reports: Report[]
  seen: number // id chiến báo mới nhất đã đọc
  beast: number // cấp yêu thú cao nhất đã hạ
  cool: Record<string, number> // mục tiêu đã hạ → lúc có lại
  sects: boolean[] // đã hạ lần đầu
  realms: number[] // số tầng bí cảnh đã qua
  tower: number // số tầng Thông Thiên Tháp đã qua (kỷ lục, giữ qua luân hồi)
  trib: number // số lần độ kiếp đã vượt
  tribCool: number
  rebirths: number
  seed: number // mầm ngẫu nhiên cho trận kế tiếp
  nextId: number
  stats: Stats
  daily: Daily // nhiệm vụ ngày: tiến độ hôm nay, việc đã nhận thưởng
  weekly: Weekly // nhiệm vụ tuần: tiến độ tuần này (làm mới 0h thứ Hai)
  ev: Ev // sự kiện tuần
  shield: number // khiên PvP tới lúc này
  guard: ElderId | null // trưởng lão giữ nhà (phải đang ở tông môn mới tính)
  face?: ElderId // chân dung (Change Avatar của RoK): trưởng lão đã thu nhận; không có — chân dung chưởng môn
  veil?: number // Ẩn Tung Phù: tới lúc này linh điểu do thám không dò được gì
  frame?: FrameId // khung chân dung đã chọn (không có: khung thường)
  digs?: { x: number; y: number }[] // Tàng Bảo Đồ: điểm đào đang có (ô trên bản đồ giới)
  seasonAt?: number // lúc mở mùa của giới mình (server gán khi vào giới) — lễ theo ngày mùa
  trial?: { key: number; d: number; gate: number } // Thí Luyện Yêu Hoàng: lượt lễ, độ khó đã chọn, cửa đang đánh
  pass?: { xp: number; got: number[]; gold: number[] } // Tu Tiên Lệnh của mùa: điểm lệnh, cấp đã nhận quà thường / Kim Lệnh
  tshop?: { earn: number; spent: number; week: number; n: number[] } // Trấn Tháp Các: Tháp Lệnh từ rương ngày, đã tiêu, đã mua tuần này
  pvp: { pts: number; win: number; loss: number }
  foes: Foe[]
  mail: Mail[]
  seat: { x: number; y: number } | null // chỗ trên bản đồ giới (server xếp lúc vào giới lần đầu)
  blocks: number[] // người chơi đã chặn (ẩn chat của họ)
  friends?: number[] // đạo hữu đã kết giao
  side?: number[] // Tông vụ: số việc đã nhận của từng dòng (SIDE_LINES)
  frag?: number // Khai Giới Trảm Tà: tàn quyển đang có (đủ EVE_CHEST_N đổi rương)
  thoi?: { n: number; pick: number } // Thiên Thời: chỉ lệnh đã chọn cho thời thứ n của mùa
  bones?: number // Yêu Vương Tuần Sơn: yêu cốt đang có (đủ LOHAR_BONES triệu hồi)
  yb?: { kp: number; hunted: number; raided: number; gathered: number } // bộ đếm lúc đầu mùa (Tổng kết mùa tính phần tăng)
  partyDay?: number // Man Hoang Cổ Tộc: ngày (dayOf) đã vào tổ đội — mỗi ngày một lần
  fallen?: { army: Army; until: number } // Anh Linh Điện: đệ tử tử trận (Đan phòng đầy) còn hồi sinh được tới until
  wall?: { hp: number; at: number; fire: number; mend?: number } // trận lực lúc at, linh hỏa cháy tới fire, lần tu bổ trận cơ gần nhất
  nan?: { day: number; n: number; q?: NanQuest } // Thôn Trang Gặp Nạn: số việc đã nhận hôm nay (day), việc đang làm
  potOpened?: { week: number; n: number } // Tụ Bảo Minh Đỉnh: rương đã mở tuần này (mọi minh cộng lại — chống nhảy minh)
  mirage?: number // Huyễn Ảnh Phù: tới lúc này do thám thấy nghi binh
  crowns?: number[] // danh hiệu mùa: các mùa đứng đầu Công Huân cả giới (giữ qua luân hồi)
  honors?: number[] // danh hiệu mùa khác: mùa × 8 + loại (0–3 anh kiệt Lưu Danh Sử Sách, 4 quán quân Cửu Thiên) — honorOf
  honorAll?: number // Công Huân kiếm được cả đời (không về 0 khi hết mùa) — ra Phi Thăng Tệ
  coinSpent?: number // Phi Thăng Tệ đã tiêu ở Thiên Môn Thương Điếm
  seclude?: { until: number; shield: number } // Bế Quan Lệnh: bế quan tới until (shield: khiên trước khi bế quan, xuất quan thì trả)
  secludeAt?: number // xuất quan rồi: tới lúc này mới bế quan lại
  prime?: ElderId[] // Chân Thân: trưởng lão đã chuyển thế (bản mệnh pháp bảo)
  auto?: { heal?: boolean } // Tự vận hành: tự chữa thương binh vừa về khi Đan phòng rảnh và đủ tài nguyên
  quiz?: { day: number; n: number; right: number; last?: boolean } // Vấn Đạo Đài hôm nay: đã trả lời n câu, đúng right, câu vừa rồi đúng không
  ascended: number[] // các mùa đã phi thăng (danh hiệu)
  fest: Partial<Record<FestId, Fest>> // trung tâm sự kiện
  vip: Vip // Hương Hỏa
  tavern: Tavern // Chiêu Hiền Đài
  tokens: Partial<Record<ElderId, number>> // tín vật (hồn ấn) từng trưởng lão
  stars: Partial<Record<ElderId, number>> // sao trưởng lão (không có = 1 sao)
  skl?: Partial<Record<ElderId, number[]>> // tầng [công pháp, tâm pháp 1, 2…] đã ngộ (không có = tầng 1)
  relics?: Partial<Record<ElderId, number>> // Anh Linh Điện: bậc di vật của trưởng lão trong mùa này
  ach: Partial<Record<AchId, number>> // thành tựu: số bậc đã nhận quà
  incoming?: Incoming[] // đội đang kéo tới cướp mình (như Tháp canh của RoK) — server ghi lúc bên kia xuất quân
  contrib?: Contrib // cống hiến tiên minh (chưa từng góp / giúp: chưa có)
  mob?: Mob // Minh vụ đường (chưa từng nhận việc: chưa có)
  arena?: Arena // Luận Kiếm Đài (chưa từng vào: chưa có)
  merchant?: { slot: number; bought: number[] } // Thương nhân vân du: lượt hàng đã mua món nào
  pins?: { x: number; y: number; text: string }[] // chỗ đã ghi nhớ trên bản đồ giới (Bookmarks của RoK)
  presets?: ({ elder: ElderId; army: Army } | null)[] // trận đồ đã lưu (3 ô)
  pairs?: Partial<Record<ElderId, ElderId>> // phó trưởng lão ghép với từng chủ tướng
  ap?: { n: number; at: number } // hành lực: còn n lúc at (hồi dần tới AP_MAX)
  frenzy?: number // cơn sát khí: vừa đi cướp, tới lúc này chưa dùng được Hộ Sơn Phù (như War Frenzy)
  moved?: number // lần dời tông môn gần nhất (vào lãnh thổ tiên minh)
  builder2?: number // tạp dịch thứ hai thuê tới lúc này (Tạp Dịch Lệnh)
  joined?: number // lần đầu vào một tiên minh (đã nhận lễ nhập minh)
  dao?: { id: DaoId; at: number } // đạo thống đang theo, chọn lúc at
  towerDay?: number // ngày (dayOf) đã nhận rương Tĩnh tọa ngộ đạo
  honor?: number // Công Huân trong mùa (hết mùa về 0)
  honorGot?: number // số mốc Chinh Chiến Công Tích đã nhận trong mùa
  drill?: Drill // Luận Võ Liên Hoàn hôm nay
  maze?: Maze // Hoàng Kim Mê Cảnh hôm nay (sect/maze.ts)
  strat?: StratId // chiến lược mùa này (luân hồi: chọn lại)
  folio?: { p: (number | null)[]; at: number[] } // Binh Thư Phong Vân: trang cài ở từng ô (null: trống), lúc đổi từng ô
  puppet?: number // Cơ Quan Khôi Lỗi: khôi lỗi phá trận đang ở nhà
  elite?: Partial<Record<UnitType, number>> // Tinh Binh Luận Kiếm: cấp tinh binh bậc 5 từng hệ
  form?: FormId // trận pháp đang bày (mọi đội xuất quân mang theo, thủ nhà theo)
  arms?: Arm[] // trận khí trong túi (cả món đang đeo)
  armOn?: Partial<Record<FormId, (number | null)[]>> // mã trận khí đeo ở 4 ô của từng trận
  armCoin?: number // Hiền Sĩ Lệnh (Vân Du Đường)
  vandu?: { day: number; n: number } // vân du: ngày (giờ VN), số lần hôm đó
  formStars?: number[] // Trận Đồ Diễn Luyện: mục tiêu đã đạt từng màn (bit: thắng · còn quân · đúng trận)
  ctech?: number[] // Linh Tinh Trận Pháp: tầng từng trận (CTECH) trong mùa
  ctechSpent?: number // linh tinh đã tiêu trong mùa
  ctechGot?: number // linh tinh thêm ngoài Công Huân (Thí Luyện Yêu Hoàng trong mùa)
  // Ẩn Sĩ Động Phủ: ngày (giờ VN) và số lần nộp việc hôm đó, hảo cảm từng ẩn sĩ, việc đang nhận (mã việc, mốc chỉ số lúc nhận)
  hermit?: {
    day: number
    n: number
    fav: Partial<Record<HermitId, number>>
    jobs: Partial<Record<HermitId, { t: number; base: number }>>
  }
  guestAt?: number // Vân Du Khách kế tiếp ghé núi lúc này (chưa có: born + GUEST_EVERY)
  guests?: number // số lần đã nhận quà khách (xoay vòng GUEST_GIFTS)
  fog?: Fog // mê vụ đã khai (chưa có: chỉ quanh tông môn)
  visited?: number[] // thôn trang / động phủ đã ghé (chỉ số trong sitesOf)
  born?: number // lúc lập tông môn (ms) — sự kiện tân thủ tính theo giờ từ đây (lập lúc 23h vẫn đủ 24 giờ ngày đầu)
}

export type JobKind = 'build' | 'train' | 'train2' | 'heal' | 'study' | 'brew' | 'forge'
// Lỗi thao tác. cap: vượt trận dung của trưởng lão dẫn đội · claimed: phần thưởng đã nhận rồi · frenzy: vừa đi cướp, chưa bật khiên
// được (cơn sát khí) · secluded: đang bế quan, xuất quan mới làm được · blocked: cửa ải phe khác đang giữ chặn đường
type ErrJob = 'max_level' | 'need_main_hall' | 'busy' | 'queue_full' | 'not_enough' | 'not_done' | 'locked' | 'cooldown'
type ErrUse = 'empty' | 'no_item' | 'slots' | 'trib' | 'bad' | 'shield' | 'weak' | 'gone' | 'far' | 'cap' | 'friend'
export type Err = ErrJob | ErrUse | 'taken' | 'full' | 'limit' | 'claimed' | 'frenzy' | 'secluded' | 'blocked'
export type Result = { ok: true; state: State } | { ok: false; error: Err }
