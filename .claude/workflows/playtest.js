export const meta = {
  name: 'playtest',
  description:
    'Người chơi ảo (6 persona) chơi thật bản HEAD qua Chrome headless, soi lỗi/UX/content, tổng hợp báo cáo ưu tiên',
  whenToUse: 'Đánh giá game như người chơi thật: lỗi, UI/UX, thông tin hiển thị, nhịp, content, có đáng chơi không',
  phases: [
    { title: 'Dựng sân', detail: 'play.ts up: bản chụp HEAD, server + DB tạm + Chrome cho từng người chơi' },
    { title: 'Chơi', detail: '6 persona chơi song song, mỗi người một giới riêng' },
    { title: 'Tổng hợp', detail: 'gộp trùng, kiểm chứng trong code, xếp ưu tiên, viết báo cáo' },
  ],
}

const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '')
const OUT = (args && args.out) || 'docs/PLAYTEST.md'

const PERSONAS = [
  {
    key: 'tanthu',
    up: 'tanthu@360x640',
    who: `Tên người chơi: tanthu (điện thoại Android nhỏ 360×640, tiếng Việt).
Bạn là Minh, 22 tuổi, sinh viên, chơi game mobile giải trí (Liên Quân, game idle), CHƯA từng chơi game chiến thuật SLG. Thích truyện tu tiên nhưng không rành thể loại game này. Kiên nhẫn thấp: 30 giây không hiểu phải làm gì là muốn bỏ.
Trọng tâm: trải nghiệm lần đầu (FTUE) và 2 ngày đầu.
- Tiêu đề → lời dẫn → đặt tên → vào núi: có cuốn hút? có hiểu mình là ai, mục tiêu là gì?
- Hướng dẫn/nhiệm vụ: lúc nào cũng biết "làm gì tiếp" không? Mũi tên, thẻ nhiệm vụ, nút Tạp dịch có rõ? Trên màn 360px: chữ dễ đọc, nút đủ to, có gì bị che/cắt/tràn?
- Khái niệm (Linh thạch, Linh thảo, Linh khoáng, Thế lực, Tạp dịch, trưởng lão, đệ tử…) được giải thích hay bị ném vào mặt?
- Phần thưởng có "đã"? Nhịp chờ xây có làm nản?
Kế hoạch: phiên 1 chơi liên tục ~50 thao tác (mỗi lần tua không quá 15 phút, như người đang cầm máy chờ); warp 120 (đi học về) → phiên 2; warp 480 (qua đêm) → phiên 3; warp 240 → phiên 4. KHÔNG dùng patch. Làm cả những gì tân thủ hay làm: bấm lung tung, mở tab bị khoá, đóng hộp thoại giữa chừng, mở Cài đặt, bấm vào tài nguyên/chân dung xem có gì.`,
  },
  {
    key: 'caothu',
    up: 'caothu',
    who: `Tên người chơi: caothu (390×844, tiếng Việt).
Bạn là Tuấn, 30 tuổi, chơi Rise of Kingdoms 3 năm, từng top server Tam Quốc Chí Chiến Lược; tối ưu mọi thứ, đọc số liệu, tính tài nguyên/giờ, săn lỗi cân bằng và khai thác (exploit).
Trọng tâm: kinh tế, nhịp tiến độ, chiều sâu hệ thống, cân bằng, độ bền.
- Tính thử: sản lượng/giờ, sức chứa, chi phí vs thời gian; nút thắt thật là gì (tài nguyên, tạp dịch, thời gian)? Có quyết định chiến lược thú vị hay chỉ bấm theo nhiệm vụ?
- Số liệu có đủ minh bạch để tối ưu (thời gian xây, sản lượng, lực chiến, tỉ lệ thắng)? Chỗ nào số trên UI lệch số thật (so với state)?
- Thử khai thác/độ bền: bấm liên tục thật nhanh (tap cùng nút 3–4 lần liền), reload giữa chừng, tiêu sạch tài nguyên, kho đầy, xây khi thiếu, nhận thưởng hai lần, tua qua mốc 0h (giờ VN) reset nhiệm vụ ngày.
- Hệ thống nào hời hợt/thừa? Thiếu gì so với SLG chuẩn (hàng đợi xây thứ 2, tăng tốc, nghiên cứu, liên minh giúp, sự kiện…)?
Kế hoạch: chơi tối ưu suốt ~7 ngày game: mỗi ngày 3–4 phiên (warp theo việc dài nhất đang chạy, tối đa 8h), luôn giữ tạp dịch bận. Ghi mốc ngày nào lên Chủ điện 5, 10… Sau đó (ghi rõ trong nhật ký) được patch để nhảy tới Chủ điện ~14 với tài nguyên dư, rồi chơi tới tầng 15 và Luân hồi để đánh giá cuối game và vòng lặp chơi lại.`,
  },
  {
    key: 'dohuu',
    up: 'dohuu@1440x900',
    who: `Tên người chơi: dohuu (máy tính 1440×900, tiếng Việt).
Bạn là Lan, 27 tuổi, đọc truyện tu tiên hơn 10 năm (Phàm Nhân Tu Tiên, Tiên Nghịch, Đấu Phá Thương Khung), chơi game trên PC, rất để ý không khí, câu chữ Hán Việt, mỹ thuật và cảm giác nhập vai.
Trọng tâm: thế giới, câu chuyện, mỹ thuật, câu chữ, cảm giác game (juice), bố cục desktop.
- Lời dẫn, tên gọi, cảnh giới (Luyện Khí → Trúc Cơ → Kim Đan…), công pháp, đan dược, bí cảnh, độ kiếp: đúng chất tu tiên, nhất quán, có "hồn"? Có cốt truyện/nhân vật để gắn bó hay chỉ là bảng số?
- Chính tả, dấu, câu cụt, dịch vụng, từ lặp, chữ bị cắt/tràn, thuật ngữ không nhất quán giữa các màn.
- Tranh thuỷ mặc, hiệu ứng xây xong, trận đánh, độ kiếp, ngày/đêm: có "wow"? Chỗ nào xấu, rời rạc, lệch phong cách, trống trải?
- Desktop: bố cục có tận dụng màn rộng, ngăn kéo/bảng bên, phím tắt 1–5, hover, con trỏ, cỡ chữ?
Kế hoạch: chơi thong thả, đọc mọi chữ, mở mọi bảng, chụp nhiều ảnh; ~3–4 ngày game với warp 2–8h. Khi đã chơi tự nhiên ≥ 1 ngày game, được patch tài nguyên (ghi nhật ký) để kịp xem Độ kiếp (Chủ điện 5), Tàng Kinh Các, luyện đan, bí cảnh. Cuối buổi đổi sang English trong Cài đặt, soi bản dịch vài màn, rồi đổi lại.`,
  },
  {
    key: 'chienbinh',
    up: 'chienbinh',
    who: `Tên người chơi: chienbinh (390×844, tiếng Việt).
Bạn là Hùng, 25 tuổi, mê game chiến thuật có chiều sâu chiến đấu (Tam Quốc Chí, Fire Emblem, Epic Seven): thích đội hình, khắc chế, kỹ năng tướng, xem lại trận.
Trọng tâm: chiến đấu và PvE.
- Bản đồ vùng/giới: chọn mục tiêu, thông tin địch, "nên dùng hệ nào", chiến lợi phẩm; chọn trưởng lão + số đệ tử; tỉ lệ thắng có đáng tin (so với kết quả thật qua nhiều trận)?
- Phát lại trận: đọc hiểu được chuyện gì xảy ra, vì sao thắng/thua? công pháp có cảm giác mạnh? tốc độ, bỏ qua, màn kết quả.
- Hệ khắc chế, 6 trưởng lão, công pháp, thương binh/Đan phòng, tử trận, bí cảnh, yêu thú, độ kiếp: có lựa chọn chiến thuật thật hay chỉ "quân đông là thắng"? Đường cong độ khó hợp lý? Có bức tường làm kẹt?
- Quân đi trên bản đồ, nhiều đội, về thành, thông báo, chiến báo.
Kế hoạch: chơi tự nhiên tới khi mở Bản đồ (Chủ điện 3), ghi lại mất bao lâu; đánh mọi thứ có thể, cố tình đánh cả trận "Yếu thế" để xem hậu quả. Sau ~2 ngày game được patch tài nguyên + quân (ghi nhật ký) để thử trưởng lão/công pháp/bí cảnh/độ kiếp tầm giữa game (Chủ điện 8–11).`,
  },
  {
    key: 'quaylai',
    up: 'quaylai:en',
    who: `Tên người chơi: quaylai (390×844, TIẾNG ANH — trình duyệt tiếng Anh, kiểm luôn bản dịch).
Bạn là Alex, 34 tuổi, nhân viên văn phòng ở nước ngoài, chỉ đọc tiếng Anh, chơi kiểu "check-in" 3–5 phút mỗi lần, 4–5 lần/ngày. Từng chơi Clash of Clans, AFK Arena.
Trọng tâm: vòng lặp quay lại, giữ chân người chơi, và bản tiếng Anh.
- Mỗi lần quay lại: màn tổng kết lúc vắng có rõ, có quà? Biết ngay nên làm gì trong 3 phút? Đủ việc để làm hay vào rồi thoát ngay? Quà đăng nhập/nhiệm vụ ngày/tuần, rương, chuỗi ngày? Reset 0h giờ Việt Nam có hợp với người nước ngoài?
- Phiên ngắn có thoả mãn? Có gì "kéo" muốn quay lại (việc dài đang chạy, sự kiện, mục tiêu gần)?
- Bản tiếng Anh: câu chữ tự nhiên chưa, còn sót tiếng Việt, chữ tràn/cắt vì tiếng Anh dài hơn, thuật ngữ (Spirit Stone…) có dễ hiểu với người không biết tu tiên?
- Lời mời cài app/PWA/thông báo đẩy (nếu có), gắn email để không mất tiến độ.
Kế hoạch: mô phỏng 7 ngày: mỗi ngày 4–5 phiên ngắn (≤ 12 thao tác mỗi phiên), warp giữa các phiên 2–5h và 8–10h qua đêm; có một lần bỏ game 3 ngày (warp 4320) rồi quay lại. KHÔNG patch. Ghi số thao tác có ý nghĩa mỗi phiên và cảm giác.`,
  },
  {
    key: 'pvp',
    up: 'pvp1 pvp2',
    who: `Tên người chơi: pvp1 và pvp2 (cùng MỘT giới, đều 390×844, tiếng Việt). Bạn điều khiển cả hai như hai người bạn chơi cùng server.
Bạn là một nhóm bạn thích cạnh tranh và chơi bang hội trong game SLG.
Trọng tâm: xã hội và cạnh tranh.
- Tiên minh: lập, mời/xin vào, chat minh, quyền, lợi ích thật khi ở chung minh?
- Chat giới, thư, xếp hạng, xem thông tin người khác, bản đồ giới (vị trí, khoảng cách, di chuyển).
- Tấn công/cướp người chơi khác: điều kiện, khiên bảo hộ, thông báo bị đánh, chiến báo, báo thù, công bằng không; người mới có bị bắt nạt? mất bao nhiêu? có đáng đánh không?
- Chợ/trao đổi giữa người chơi (nếu có): có dễ bị lạm dụng (bơm tài nguyên cho acc chính)?
- Mùa giải/sự kiện/điểm, đối thủ (Rivals) nếu có.
Kế hoạch: chơi tự nhiên cả hai acc xen kẽ tới khi mở các tính năng xã hội (warp là chung cả giới — mỗi lần tua tác động cả hai acc). Sau ~1 ngày game được patch (ghi nhật ký) để đủ Chủ điện mở Tiên minh/PvP, và đặt hai tông môn gần nhau nếu cần. Thử mọi tương tác giữa hai acc, cả tiêu cực: chửi tục trong chat/tên minh, spam chat, đánh liên tục acc yếu.`,
  },
]

const common =
  src => `Bạn là một NGƯỜI CHƠI THẬT đang thử game "Sơn Hà Tiên Tông" — game chiến thuật tu tiên (SLG) trên trình duyệt, kiểu Rise of Kingdoms nhưng dựng tông môn tu tiên. Việc của bạn: chơi thật và chỉn chu theo persona bên dưới, ghi nhận trải nghiệm và mọi vấn đề (lỗi, UI/UX, tương tác, thông tin hiển thị có đủ không, có đủ xịn không, đủ content không, có đáng đầu tư thời gian không), rồi báo cáo.

## Công cụ chơi
Game đã chạy sẵn cho bạn. Điều khiển bằng Bash, chạy trong ${ROOT}:
  node apps/client/play.ts <tên> look          chữ trên màn + danh sách thứ chạm được, đánh số (kèm [tắt], [bị che], [nhỏ] = cạnh < 32px)
  node apps/client/play.ts <tên> tap 5          chạm phần tử số 5 của lần look gần nhất; hoặc tap "Nâng cấp" theo chữ
  node apps/client/play.ts <tên> tapxy 200 400  chạm theo toạ độ (cảnh núi/bản đồ vẽ bằng WebGL)
  … fill "chữ" (chọn hết ô đang focus rồi gõ đè) | type "chữ" | key Enter|Escape|Tab|1..5 | scroll 0 400 [x y] | wait 1500 | reload
  … shot [nhãn]   lưu PNG và in đường dẫn — mở bằng Read để NHÌN màn hình như người chơi
  … warp 60       tua thời gian của giới 60 phút (mô phỏng rời game rồi quay lại)
  … errors        lỗi/cảnh báo console JS từ lần gọi trước · logs → 60 dòng log server cuối
  … state         state thật trên server (JSON) — CHỈ để xác minh nghi ngờ; người chơi thật không thấy
  … patch '{"res":{"linhThach":99999}}'   sửa state (chỉ khi persona cho phép; phải ghi vào nhật ký)
  … js "biểu thức" chạy JS trong trang (chỉ để điều tra lỗi, không dùng để chơi)
Mẹo: mở đầu mỗi lệnh Bash bằng \`cd ${ROOT}; p() { node apps/client/play.ts <tên> "$@"; }\` rồi nối nhiều bước: \`p tap 3; p look\`. Mỗi lệnh chạm đã chờ ~0.7s và in hộp thoại/thông báo hiện ra; hiệu ứng chuyển cảnh dài hơn thì \`wait\`. Số thứ tự của look đổi sau mỗi thay đổi màn — look lại trước khi tap theo số.

## Chơi như người thật
- Nhìn màn hình bằng shot + Read thường xuyên: mỗi màn mới và mỗi khoảnh khắc quan trọng (xây xong, lên tầng, mở khoá, đánh trận, độ kiếp…). look để đọc chữ và tìm nút; shot để thấy đúng thứ người chơi thấy (bố cục, chữ bị cắt, chồng lấn, hình vẽ, hiệu ứng, trống trải).
- Quyết định chỉ dựa trên màn hình, như người chơi. KHÔNG đọc code/data để biết cách chơi trong lúc chơi. Bối rối không biết làm gì cũng là một phát hiện: ghi lại bối rối bao lâu, đã thử gì.
- Chơi theo phiên: một phiên vài phút tới ~30 phút thao tác, rồi warp mô phỏng thời gian vắng, rồi quay lại. Ghi cảm xúc thật: hứng thú, chán, bực, tò mò, "wow".
- Sau vài thao tác chạy errors; lỗi console/server là bug.
- Tách lỗi game khỏi trục trặc công cụ (vd chạm lúc màn đang chuyển): thử lại cách khác trước khi kết luận. Chạm trúng mà không có phản hồi rõ (không hiệu ứng, không đổi gì) là vấn đề UX.
- Môi trường này không có âm thanh: không đánh giá nhạc/tiếng.
- Không sửa code, không commit, không đụng người chơi khác (trừ khi persona cho phép).
- Quy mô: khoảng 150–250 lệnh công cụ. Chơi đủ sâu để kết luận, đừng dừng sớm ở phút đầu.

## Sau khi chơi
- Mỗi lỗi critical/major: tìm nguyên nhân trong mã nguồn của ĐÚNG bản đang chơi ở ${src} (bản chụp commit HEAD — KHÔNG đọc thư mục repo vì có code phiên khác đang sửa dở). Ghi file:line tính từ gốc repo (vd apps/client/src/Hud.svelte:42) vào code, confidence=confirmed; không tìm được thì observed; chỉ đoán thì suspected.
- Mỗi phát hiện phải cụ thể: màn nào, bước tái hiện, mong đợi vs thực tế, người chơi cảm thấy gì, đề xuất sửa, ảnh chụp làm bằng chứng (đường dẫn).
- Ghi cả điểm làm tốt (để khi sửa không phá mất) và những gì còn thiếu so với game cùng thể loại (RoK, Tam Quốc Chí Chiến Lược, Clash of Clans, game tu tiên như Nhất Niệm Tiêu Dao, Tu Tiên Giả Lập…).
- Chấm điểm 1–10 như người chơi khó tính, kèm lý do. Viết tiếng Việt.

## Persona của bạn
`

const FINDING = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    category: {
      type: 'string',
      enum: [
        'bug',
        'ux',
        'ui',
        'onboarding',
        'content',
        'balance',
        'text',
        'art',
        'feel',
        'performance',
        'social',
        'i18n',
      ],
    },
    severity: { type: 'string', enum: ['critical', 'major', 'minor', 'polish'] },
    screen: { type: 'string' },
    steps: { type: 'string' },
    expected: { type: 'string' },
    actual: { type: 'string' },
    playerFeel: { type: 'string' },
    suggestion: { type: 'string' },
    evidence: { type: 'string' },
    code: { type: 'string' },
    confidence: { type: 'string', enum: ['confirmed', 'observed', 'suspected'] },
  },
  required: ['title', 'category', 'severity', 'screen', 'actual', 'suggestion', 'confidence'],
}
const SCORE = {
  type: 'object',
  properties: { score: { type: 'integer', minimum: 1, maximum: 10 }, why: { type: 'string' } },
  required: ['score', 'why'],
}
const CRITERIA = [
  'fun',
  'clarity',
  'uiLook',
  'feel',
  'information',
  'contentDepth',
  'pacing',
  'retention',
  'worthInvesting',
]
const REPORT = {
  type: 'object',
  properties: {
    persona: { type: 'string' },
    gameDays: { type: 'number' },
    actions: { type: 'integer' },
    progress: { type: 'string' },
    journal: {
      type: 'array',
      items: {
        type: 'object',
        properties: { when: { type: 'string' }, did: { type: 'string' }, felt: { type: 'string' } },
        required: ['when', 'did', 'felt'],
      },
    },
    findings: { type: 'array', items: FINDING },
    highlights: { type: 'array', items: { type: 'string' } },
    missing: { type: 'array', items: { type: 'string' } },
    scores: {
      type: 'object',
      properties: Object.fromEntries(CRITERIA.map(c => [c, SCORE])),
      required: CRITERIA,
    },
    verdict: { type: 'string' },
    patched: { type: 'string' },
  },
  required: ['persona', 'progress', 'journal', 'findings', 'highlights', 'missing', 'scores', 'verdict'],
}

phase('Dựng sân')
const setup = await agent(
  `Dựng môi trường chơi thử cho game ở ${ROOT}. Chạy tuần tự trong ${ROOT}:
  node apps/client/play.ts down
${PERSONAS.map(p => `  node apps/client/play.ts up ${p.up}`).join('\n')}
  node -p "require('os').tmpdir() + '/rok-play'"
Mỗi lệnh up in "<tên>: sẵn sàng …". Nếu lỗi kết nối Postgres (cổng 5439): chạy \`npm run db\` (cần Docker Desktop đang chạy) rồi thử lại. Lỗi khác: đọc log trong thư mục rok-play (server.*.log, ctl.*.log) để chẩn đoán, sửa môi trường (không sửa code game) và thử lại. Cuối cùng chạy \`node apps/client/play.ts ps\` để kiểm tra.`,
  {
    label: 'play.ts up',
    phase: 'Dựng sân',
    effort: 'low',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean' },
        dir: { type: 'string', description: 'thư mục rok-play (dòng node -p in ra)' },
        players: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string' },
      },
      required: ['ok', 'dir', 'players', 'notes'],
    },
  },
)
if (!setup || !setup.ok) return { error: 'dựng sân thất bại', setup }
const SRC = `${setup.dir}/src`
log(`sân sẵn sàng: ${setup.players.join(', ')} · ảnh chụp ở ${setup.dir}/shots`)

phase('Chơi')
const reports = await parallel(
  PERSONAS.map(p => () => agent(common(SRC) + p.who, { label: `chơi: ${p.key}`, phase: 'Chơi', schema: REPORT })),
)
const done = reports.filter(Boolean)
const lost = PERSONAS.filter((_, i) => !reports[i]).map(p => p.key)
if (lost.length) log(`không có báo cáo từ: ${lost.join(', ')}`)
log(`${done.length} báo cáo · ${done.reduce((n, r) => n + r.findings.length, 0)} phát hiện`)

phase('Tổng hợp')
const avg = Object.fromEntries(
  CRITERIA.map(c => [c, +(done.reduce((s, r) => s + r.scores[c].score, 0) / (done.length || 1)).toFixed(1)]),
)
const summary = await agent(
  `Bạn là game director kiêm lead QA, tổng hợp buổi playtest game "Sơn Hà Tiên Tông" (repo ${ROOT}; luật game và kế hoạch ở docs/PLAN.md, UX ở docs/UX.md). ${done.length} người chơi ảo (persona) đã chơi thật bản build commit HEAD qua Chrome headless và gửi báo cáo JSON bên dưới.${lost.length ? ` Thiếu báo cáo của: ${lost.join(', ')} — nêu rõ trong báo cáo là phần đó chưa được thử.` : ''}

Việc cần làm:
1. Gộp trùng phát hiện giữa các persona (cùng nguyên nhân = một mục, ghi persona nào gặp — nhiều persona gặp thì tác động lớn hơn). Mục có vẻ do công cụ chơi thử (apps/client/play.ts) chứ không phải lỗi game thì chuyển xuống phụ lục.
2. Kiểm chứng: mỗi mục critical/major, mở mã nguồn ở ${SRC} (bản chụp đúng phiên bản đã chơi; KHÔNG dùng thư mục repo vì có code đang sửa dở) để xác nhận nguyên nhân và chỗ sửa (file:line tính từ gốc repo). Cần tái hiện thì người chơi vẫn đang chạy: \`node apps/client/play.ts <tên> look|shot|tap|…\` (tên: ${setup.players.join(', ')}; cách dùng ở đầu file apps/client/play.ts). Không xác nhận được thì ghi "chưa xác nhận".
3. Xếp ưu tiên: P0 chặn chơi / mất tiến độ / crash · P1 làm người chơi bỏ game (FTUE, rối, thiếu phản hồi, nhịp, thiếu thông tin) · P2 khó chịu · P3 đánh bóng. Trong mỗi mức, việc nhanh (< 1 giờ) lên trước.
4. Trả lời thẳng, có dẫn chứng, 5 câu hỏi của chủ game: (a) tính năng đủ chưa? (b) UI/UX, tương tác, thông tin nhìn thấy đủ rõ chưa? (c) đủ "xịn" chưa (mỹ thuật, cảm giác, độ bóng bẩy) so với game cùng loại? (d) đủ content để chơi bao lâu trước khi hết việc/chán (ước tính giờ/ngày)? (e) có đáng để người chơi đầu tư thời gian (và tiền) chưa?
5. Lộ trình: 10 việc nên làm trước (tác động / công sức) và 3–5 "cược lớn" về content/tính năng.

Viết báo cáo markdown tiếng Việt vào ${ROOT}/${OUT} (ghi đè), theo thứ tự: tóm tắt một đoạn → bảng điểm (trung bình: ${JSON.stringify(avg)}; kèm điểm từng persona) → trả lời 5 câu → vấn đề theo P0…P3 (mỗi mục: tiêu đề, persona gặp, màn hình, cách tái hiện, đề xuất sửa, file:line, ảnh chụp) → điểm làm tốt cần giữ → thiếu gì so với thể loại → lộ trình → phụ lục (nhật ký rút gọn mỗi persona, những gì đã patch, trục trặc công cụ). Ảnh chụp nằm ở ${setup.dir}/shots.
Xong thì chạy \`node apps/client/play.ts down\` trong ${ROOT} để dọn môi trường (ảnh chụp được giữ lại).

Báo cáo của các persona:
${JSON.stringify(done)}`,
  {
    label: 'tổng hợp + kiểm chứng',
    phase: 'Tổng hợp',
    schema: {
      type: 'object',
      properties: {
        reportPath: { type: 'string' },
        tldr: { type: 'string' },
        answers: {
          type: 'object',
          properties: {
            features: { type: 'string' },
            uiux: { type: 'string' },
            polish: { type: 'string' },
            content: { type: 'string' },
            worth: { type: 'string' },
          },
          required: ['features', 'uiux', 'polish', 'content', 'worth'],
        },
        top: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string' },
              title: { type: 'string' },
              where: { type: 'string' },
              fix: { type: 'string' },
              personas: { type: 'array', items: { type: 'string' } },
            },
            required: ['priority', 'title', 'fix'],
          },
        },
        counts: {
          type: 'object',
          properties: {
            p0: { type: 'integer' },
            p1: { type: 'integer' },
            p2: { type: 'integer' },
            p3: { type: 'integer' },
          },
        },
      },
      required: ['reportPath', 'tldr', 'answers', 'top'],
    },
  },
)
return { avg, lost, summary, shots: `${setup.dir}/shots` }
