// Tham số từng loại thư hệ thống (khoá → bộ tham số); chữ ở @rok/i18n (MailTexts). Chỉ kiểu, không luật — tách khỏi types.ts cho gọn.
import type { EventId, FestId } from '../data.ts'

export type MailArgs = {
  eventTop: [rank: number, theme: EventId]
  festTop: [rank: number, fest: FestId] // bảng xếp hạng lễ (Tông Môn Tranh Bá): hạng khi hết lễ
  festStage: [rank: number, fest: FestId, stage: number] // bảng từng ải (Tông Môn Tranh Bá): hạng khi hết ải stage (từ 1)
  festAlly: [rank: number, fest: FestId, tag: string] // bảng tiên minh của lễ (Trảm Yêu Lệnh): hạng minh khi hết lễ
  drop: [fest: FestId, n: number] // lễ rơi đồ: nhặt được Linh Nang thứ n của lượt này
  admin: [title: string, body: string]
  gift: []
  comp: []
  boss: [lv: number, rank: number, pct: number]
  allyGift: [lv: number, gift: number] // Minh lễ: người trong minh hạ yêu vương cấp lv, quà cấp gift
  arenaTop: [rank: number] // hạng tuần Luận Kiếm Đài
  titled: [title: string, lord: string] // được Giới Chủ sắc phong
  boon: [lord: string] // Giới Chủ ban Thiên Ân lễ
  banish: [lord: string, x: number, y: number] // Giới Chủ phóng trục tông môn mình ra vùng ngoài, tới (x, y)
  goods: [x: number, y: number, tier: number] // Thương Đội Gặp Nạn: nhặt được kiện hàng phẩm tier ở (x, y)
  mobTop: [rank: number] // hạng Minh vụ của minh mình khi hết tuần
  book: [ch: number] // chương Thiên Đạo Biên Niên cả giới vừa hoàn thành
  bookTop: [ch: number, rank: number] // công đầu chương đó: hạng đóng góp
  aquiz: [mine: number, total: number, tier: number] // Luận Đạo Vấn Đáp: câu đúng của mình, tổng cả minh, mốc đạt được
  war: [win: 0 | 1, foe: string] // Luận Kiếm Minh Chiến: minh mình thắng / thua minh foe (hiệu)
  season: [season: number, rank: number, up: 0 | 1]
  sold: [good: string, n: number, net: number]
  unsold: [good: string, n: number]
  razed: [tag: string, left: number, x: number, y: number] // đội mình đánh trận kỳ minh tag: còn left % (0: đổ)
  flagHit: [who: string, left: number, x: number, y: number] // trận kỳ minh mình bị who đánh: còn left %
  legion: [pts: number, waves: number] // Ma Triều Công Sơn xong: điểm của mình, số đợt giữ được
  legionTop: [rank: number] // minh mình đứng hạng rank Ma Triều Công Sơn
  allyWelcome: [name: string] // lễ nhập minh lần đầu
  allyGone: [name: string] // minh chủ giải tán tiên minh name
  tourney: [place: number] // Luận Kiếm Đại Hội: chỗ đứng (1, 2, 3 = bán kết, 5 = tứ kết)
  supply: [who: string] // đồng minh who gửi tài nguyên qua Vận Linh Trận (ở phần quà)
  allyMail: [who: string, tag: string, text: string] // thư minh: R4 / minh chủ who của minh tag gửi cả minh
  honorTop: [rank: number, n: number] // hết mùa: hạng Công Huân cá nhân, điểm
  linked: [] // quà gắn email (một lần)
  tribeTop: [rank: number, pts: number] // Phá Yêu Trại: minh mình hạng rank, điểm minh
  firstTake: [kind: string, lv: number] // tiên minh chiếm lần đầu một điểm (loại, cấp) trong mùa
  eveTop: [rank: number, pts: number] // Khai Giới Trảm Tà: cổng mở, minh mình hạng rank giới vận, điểm
  lohar: [pct: number, summoner: 0 | 1] // hạ Yêu Vương Tuần Sơn: phần sát thương (%), mình là người triệu hồi
  party: [lv: number, waves: number, n: number] // Man Hoang Cổ Tộc: độ khó, số đợt qua, số người trong đội
  convoy: [lv: number, hp: number, n: number] // Linh Thương Hộ Tống: độ khó, % hàng còn, số người hộ tống
  assault: [lv: number, win: number, n: number] // Vây Công Yêu Vương: độ khó, thắng (1) / thua (0), số người vào trận
  royale: [place: number, n: number, pts: number] // Cổ Khư Loạn Chiến: hạng, số tông môn, điểm được
  daibi: [mine: number, theirs: number, flags: number] // Tiên Môn Đại Bỉ: điểm đội mình, điểm đội kia, số cờ mình góp giữ
  mystic: [mode: number, stages: number, rounds: number, rank: number] // Huyễn Vực Bí Cảnh: độ khó (0 thường · 1 truyền thuyết), số màn qua, tổng lượt đánh, hạng tuần (0: không vào bảng)
  dailyLeft: [n: number] // Nhật Khóa hôm trước: số rương đủ điểm chưa mở (quà gộp trong thư)
  silver: [mine: number, theirs: number, sc: number] // Tán Tu Tranh Châu: điểm đội mình, điểm đội kia, công huân cá nhân
  vanchu: [mine: number, theirs: number, sunk: number, rounds: number, res: number] // Vân Chu Hội Chiến: máu Vận Lương Chu mình / địch còn, số thuyền địch mình góp đánh chìm, số hiệp, kết quả (1 thắng · 0 hoà · −1 thua)
  wallFall: [x: number, y: number] // sơn môn thất thủ: trận lực về 0, tông môn bị đánh bật tới (x, y)
  // do thám linh địa: loại điểm, toạ độ, phe giữ, số đội đóng, tổng đệ tử, lực chiến
  spySpot: [kind: string, x: number, y: number, owner: string, n: number, troops: number, might: number]
  dig: [x: number, y: number] // Tàng Bảo Đồ: đào xong điểm (x, y), quà đính kèm
  back: [days: number] // Hồi Quy Lễ: vắng bấy nhiêu ngày rồi quay lại
  recall: [name: string, k: 0 | 1 | 2] // Cố Nhân Tương Phùng: 0 name gọi mình về · 1 mình về nhờ name gọi · 2 name về nhờ mình gọi
  hallUp: [lv: number] // Chủ điện vừa lên tầng lv: quà mừng (tầng đột phá có lễ đột phá)
  // do thám: tên, toạ độ, tài nguyên ước cướp được (thạch, thảo, khoáng), đệ tử giữ nhà, lực chiến giữ nhà, số đội viện binh,
  // trận lực (%), khiên (1/0), trưởng lão trấn thủ ('' nếu không) và cấp
  spy: [
    foe: string,
    x: number,
    y: number,
    thach: number,
    thao: number,
    khoang: number,
    troops: number,
    might: number,
    aid: number,
    wall: number,
    shield: number,
    guard: string,
    level: number,
  ]
  spied: [foe: string] // bị do thám
  spyVeil: [foe: string, x: number, y: number] // do thám tông môn đang dùng Ẩn Tung Phù: không dò được gì
  code: [code: string] // quà mã quà tặng
  league: [rank: number] // Cửu Thiên Luận Đạo Hội: minh mình hạng rank cả mùa
  bet: [win: 0 | 1, tag: string, stage: 'semi' | 'final' | 'third', n: number] // Luận Kiếm Đặt Cược: trúng nhận n tệ / trượt hoàn n tệ
  hero: [kind: number, votes: number] // Lưu Danh Sử Sách: được bình chọn anh kiệt mùa ở hạng mục kind (HERO_KINDS)
  camp: [camp: 0 | 1, pts: number, other: number] // Chính Tà Phân Tranh: phái mình thắng mùa, điểm hai phái
  treaty: [tag: string] // Hiệp Ước Thiên Môn: minh phi thăng đã ký hiệp ước với minh mình
  four: [four: number, pts: number] // Tứ Tượng Tranh Hùng: phe mình thắng mùa (0–3), điểm mùa của phe
  campStage: [n: number, m: string, won: 0 | 1, a: number, b: number] // chặng thi đua n (việc m): phái mình thắng, điểm hai phái
  ark: [win: 0 | 1, foe: string, mine: number, theirs: number, sc: number, rank: number] // Tranh Đoạt Linh Châu: thắng / thua minh foe, điểm hai bên, công huân cá nhân và hạng trong minh (thư cũ chưa có)
  // Tổng kết mùa (Yearbook): mùa, tầng Chủ điện, Công Huân (hạng, 0: ngoài bảng), chiến công, yêu thú hạ, cướp thắng, khai mỏ
  yearbook: [
    season: number,
    hall: number,
    honor: number,
    rank: number,
    kp: number,
    hunted: number,
    raided: number,
    gathered: number,
  ]
}
