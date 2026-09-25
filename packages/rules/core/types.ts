// Kiểu dữ liệu của một tông môn (State là save) và của chiến báo, hành quân. Chỉ kiểu, không luật.
import { type Round } from '../combat.ts'
import {
  type Bag,
  type Bonus,
  type BuildingId,
  type DailyId,
  type DrillMod,
  type StratId,
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
  type EventId,
  type FestId,
  type Metric,
  type AchId,
  type DaoId,
} from '../data.ts'

export type Troops = Record<UnitId, number>
export type Army = Partial<Troops>
export type Items = Partial<Record<ItemId, number>>
export type Job = { building: BuildingId; level: number; startAt: number; finishAt: number }
export type TrainJob = { unit: UnitId; n: number; startAt: number; finishAt: number }
export type HealJob = { troops: Army; startAt: number; finishAt: number }
export type StudyJob = { tech: TechId; level: number; startAt: number; finishAt: number }
export type BrewJob = { pill: PillId; n: number; startAt: number; finishAt: number }
export type ForgeJob = { gear: GearId; level: number; startAt: number; finishAt: number }
export type Gear = { lv: number; on?: ElderId } // on: trưởng lão đang đeo
export type Talent = [atk: number, hp: number, skill: number]
// until: lúc hết (due() gỡ đúng giờ, nên sản lượng trước/sau tính đúng); 0 = giữ tới khi server gỡ. src: nguồn, mỗi nguồn một buff
export type Buff = { key: Bonus; v: number; until: number; src: string }
// pvp: i = mã người chơi bị cướp · spot: i = chỉ số điểm trên bản đồ giới (atlas.points) · trib: kiếp vân, i = lần độ kiếp
// flag: trận kỳ của minh khác (i: mã trận kỳ) — đội tới phá
export type Target = { kind: 'beast' | 'sect' | 'realm' | 'tower' | 'pvp' | 'spot' | 'trib' | 'flag'; i: number }
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
  task?: 'take' | 'gather' | 'hit' | 'hunt' | 'aid' // điểm trên bản đồ giới: chiếm (đóng quân) · khai mỏ · đánh yêu vương · săn yêu thú; aid: viện binh nhà đồng minh
  rally?: number // thuộc kết trận này (mọi đội cùng tới lúc hẹn, đánh như một bên)
  spot?: string // loại điểm (để hiện tên): vein, mine, boss, gate, heaven
  stay?: boolean // đang đóng quân ở điểm (chỉ về khi bị đánh bật hoặc gọi về)
  mine?: { end: number; amount: number; res: Res } // đang khai mỏ tới end, mang về amount
  back?: Army // sau trận: đệ tử còn đứng được, thương binh và chiến lợi phẩm mang về
  hurt?: Army
  gain?: Gain
  report?: number
  pill?: PillId // kiếp vân: đan độ kiếp đã dùng lúc tụ
  foil?: number // kiếp vân: số lần bị cướp trúng trong lúc tụ (phá kiếp)
}
export type Snap = {
  elder?: ElderId
  deputy?: ElderId
  level: number
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
  kind: 'beast' | 'sect' | 'realm' | 'tower' | 'trib' | 'pvp' | 'spot' | 'arena' | 'legion' | 'drill' // legion: đợt i Ma triều · drill: trận i Luận Võ
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
  gain: Gain
}
// Bộ đếm tích luỹ (sự kiện đo tiến độ bằng hiệu hai lần đọc). Trường có dấu ? thêm sau: save cũ thiếu thì là 0.
export type Stats = {
  trained: number
  healed: number
  brewed: number
  won: number
  lost: number
  hunted?: number // yêu thú hạ được
  sped?: number // phút tăng tốc đã dùng
  raided?: number // lần cướp thắng
  gathered?: number // tài nguyên khai mỏ mang về
  drawn?: number // lần mở thiếp Chiêu Hiền Đài
  allied?: number // lượt cung phụng Đại Trận + lượt giúp đỡ đồng minh
  duels?: number // trận Luận Kiếm Đài đã đánh (bên đánh)
  duelWins?: number
  kp?: number // chiến công (Kill Points của RoK): thế lực đệ tử địch hạ được trong trận giữa các tông môn
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
}
// Hương Hỏa: tổng điểm, chuỗi ngày vào game liên tiếp, ngày vào gần nhất, ngày đã mở rương (dayOf; -1 = chưa)
export type Vip = { pts: number; streak: number; day: number; chest: number }
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
export type Incoming = { id: number; pid: number; foe: string; at: number }
// Thư: chữ dựng ở client theo khoá k và tham số a (@rok/i18n mailText), quà nhận đúng một lần.
// Thêm loại thư: thêm khoá vào MailArgs — i18n báo thiếu chữ ở mọi ngôn ngữ.
export type MailArgs = {
  eventTop: [rank: number, theme: EventId]
  admin: [title: string, body: string]
  gift: []
  comp: []
  boss: [lv: number, rank: number, pct: number]
  allyGift: [lv: number, gift: number] // Minh lễ: người trong minh hạ yêu vương cấp lv, quà cấp gift
  arenaTop: [rank: number] // hạng tuần Luận Kiếm Đài
  titled: [title: string, lord: string] // được Giới Chủ sắc phong
  boon: [lord: string] // Giới Chủ ban Thiên Ân lễ
  mobTop: [rank: number] // hạng Minh vụ của minh mình khi hết tuần
  book: [ch: number] // chương Thiên Đạo Biên Niên cả giới vừa hoàn thành
  war: [win: 0 | 1, foe: string] // Luận Kiếm Minh Chiến: minh mình thắng / thua minh foe (hiệu)
  season: [season: number, rank: number, up: 0 | 1]
  sold: [good: string, n: number, net: number]
  unsold: [good: string, n: number]
  razed: [tag: string, left: number, x: number, y: number] // đội mình đánh trận kỳ minh tag: còn left % (0: đổ)
  flagHit: [who: string, left: number, x: number, y: number] // trận kỳ minh mình bị who đánh: còn left %
  legion: [pts: number, waves: number] // Ma Triều Công Sơn xong: điểm của mình, số đợt giữ được
  legionTop: [rank: number] // minh mình đứng hạng rank Ma Triều Công Sơn
  allyWelcome: [name: string] // lễ nhập minh lần đầu
  supply: [who: string] // đồng minh who gửi tài nguyên qua Vận Linh Trận (ở phần quà)
  allyMail: [who: string, tag: string, text: string] // thư minh: R4 / minh chủ who của minh tag gửi cả minh
  honorTop: [rank: number, n: number] // hết mùa: hạng Công Huân cá nhân, điểm
  linked: [] // quà gắn email (một lần)
  tribeTop: [rank: number, pts: number] // Phá Yêu Trại: minh mình hạng rank, điểm minh
  firstTake: [kind: string, lv: number] // tiên minh chiếm lần đầu một điểm (loại, cấp) trong mùa
}
export type MailKind = keyof MailArgs
// Thư mới (chưa có id): a bắt buộc, đúng kiểu theo khoá
export type NewMail = { [K in MailKind]: { at: number; k: K; a: MailArgs[K]; gift?: Reward } }[MailKind]
// Thư đã lưu: save cũ có thể thiếu a; server mới hơn client có thể gửi khoá client chưa biết
export type Mail = { id: number; at: number; k: string; a?: (string | number)[]; gift?: Reward; got?: boolean }

export type State = {
  v: 4 // phiên bản save
  name: string // tên tông môn
  quest: number // chỉ số nhiệm vụ hiện tại trong QUESTS
  time: number // tài nguyên đã tính tới mốc này
  res: Bag
  carry: Bag // phần lẻ chưa đủ 1 đơn vị (đơn vị × ms), để kết quả không phụ thuộc số lần gọi advance
  levels: Record<BuildingId, number>
  queue: Job[]
  troops: Troops // đệ tử đang ở tông môn
  wounded: Troops // thương binh nằm ở Đan phòng (kể cả đang được chữa)
  train: TrainJob | null
  heal: HealJob | null
  study: StudyJob | null
  brew: BrewJob | null
  forge: ForgeJob | null // Luyện Khí Phòng: một món mỗi lúc
  tech: Partial<Record<TechId, number>>
  items: Items
  elders: Partial<Record<ElderId, number>> // trưởng lão đã thu nhận → kinh nghiệm
  talents: Partial<Record<ElderId, Talent>> // điểm thiên phú đã cộng
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
  pvp: { pts: number; win: number; loss: number }
  foes: Foe[]
  mail: Mail[]
  seat: { x: number; y: number } | null // chỗ trên bản đồ giới (server xếp lúc vào giới lần đầu)
  blocks: number[] // người chơi đã chặn (ẩn chat của họ)
  ascended: number[] // các mùa đã phi thăng (danh hiệu)
  fest: Partial<Record<FestId, Fest>> // trung tâm sự kiện
  vip: Vip // Hương Hỏa
  tavern: Tavern // Chiêu Hiền Đài
  tokens: Partial<Record<ElderId, number>> // tín vật (hồn ấn) từng trưởng lão
  stars: Partial<Record<ElderId, number>> // sao trưởng lão (không có = 1 sao)
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
  strat?: StratId // chiến lược mùa này (luân hồi: chọn lại)
  guestAt?: number // Vân Du Khách kế tiếp ghé núi lúc này (chưa có: born + GUEST_EVERY)
  guests?: number // số lần đã nhận quà khách (xoay vòng GUEST_GIFTS)
  fog?: Fog // mê vụ đã khai (chưa có: chỉ quanh tông môn)
  visited?: number[] // thôn trang / động phủ đã ghé (chỉ số trong sitesOf)
  born?: number // lúc lập tông môn (ms) — sự kiện tân thủ tính theo giờ từ đây (lập lúc 23h vẫn đủ 24 giờ ngày đầu)
}

export type JobKind = 'build' | 'train' | 'heal' | 'study' | 'brew' | 'forge'
export type Err =
  | 'max_level'
  | 'need_main_hall'
  | 'busy'
  | 'queue_full'
  | 'not_enough'
  | 'not_done'
  | 'locked'
  | 'cooldown'
  | 'empty'
  | 'no_item'
  | 'slots'
  | 'trib'
  | 'bad'
  | 'shield'
  | 'weak'
  | 'gone'
  | 'far'
  | 'cap' // vượt trận dung của trưởng lão dẫn đội
  | 'friend'
  | 'taken'
  | 'full'
  | 'limit'
  | 'claimed' // phần thưởng đã nhận rồi
  | 'frenzy' // vừa đi cướp: chưa bật khiên được (cơn sát khí)
export type Result = { ok: true; state: State } | { ok: false; error: Err }
