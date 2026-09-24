// Kiểu dữ liệu của một tông môn (State là save) và của chiến báo, hành quân. Chỉ kiểu, không luật.
import { type Round } from '../combat.ts'
import {
  type Bag,
  type Bonus,
  type BuildingId,
  type DailyId,
  type ElderId,
  type GearId,
  type PillId,
  type Res,
  type Reward,
  type TechId,
  type Tier,
  type UnitId,
  type UnitType,
  type WeeklyId,
  type EventId,
} from '../data.ts'

export type Troops = Record<UnitId, number>
export type Army = Partial<Troops>
export type Items = Partial<Record<PillId, number>>
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
export type Target = { kind: 'beast' | 'sect' | 'realm' | 'tower' | 'pvp' | 'spot' | 'trib'; i: number }
export type Gain = { res: Partial<Bag>; items: Items; elder?: ElderId; exp: number }
export type March = {
  id: number
  elder: ElderId
  army: Army
  target: Target
  seed: number
  startAt: number
  arriveAt: number
  returnAt: number // 0: chưa hẹn (đi cướp: server giải trận lúc tới nơi rồi mới biết giờ về)
  foe?: string // đi cướp: tên tông môn bên kia (để hiện)
  path?: { x: number; y: number }[] // đi trên bản đồ giới: các điểm dừng (đi, …cổng, tới) — theo ô
  task?: 'take' | 'gather' | 'hit' | 'aid' // điểm trên bản đồ giới: chiếm (đóng quân) · khai mỏ · đánh yêu vương; aid: viện binh nhà đồng minh
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
export type Snap = { elder?: ElderId; level: number; troops: { type: UnitType; tier: Tier; n: number }[] }
export type Report = {
  id: number
  at: number
  kind: 'beast' | 'sect' | 'realm' | 'tower' | 'trib' | 'pvp' | 'spot'
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
export type Stats = { trained: number; healed: number; brewed: number; won: number; lost: number }
export type Daily = { day: number; n: Record<DailyId, number>; got: boolean[]; bonus: boolean }
export type Weekly = { week: number; n: Record<WeeklyId, number>; got: boolean[]; bonus: boolean }
export type Ev = { week: number; pts: number; got: boolean[] } // sự kiện tuần: điểm, mốc đã nhận
export type Foe = { pid: number; name: string; at: number } // ai đã đánh mình (báo thù)
// Thư: chữ dựng ở client theo khoá k và tham số a (@rok/i18n mailText), quà nhận đúng một lần.
// Thêm loại thư: thêm khoá vào MailArgs — i18n báo thiếu chữ ở mọi ngôn ngữ.
export type MailArgs = {
  eventTop: [rank: number, theme: EventId]
  admin: [title: string, body: string]
  gift: []
  comp: []
  boss: [lv: number, rank: number, pct: number]
  season: [season: number, rank: number, up: 0 | 1]
  sold: [good: string, n: number, net: number]
  unsold: [good: string, n: number]
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
  | 'friend'
  | 'taken'
  | 'full'
  | 'limit'
  | 'claimed' // phần thưởng đã nhận rồi
export type Result = { ok: true; state: State } | { ok: false; error: Err }
