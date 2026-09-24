# Kế hoạch: Game tu tiên kiểu SLG — làm một mình, web + PC + mobile

> Tên game: chưa đặt. Tài liệu sống — sửa khi quyết định thay đổi. Game flow và UI/UX: [UX.md](UX.md).
>
> Lệnh: `npm run dev` (chạy game) · `npm test` · `npm run check` (kiểm tra kiểu) · `npm run sim` (bot chơi 30 ngày, in nhịp) · `npm run build`
>
> **Trạng thái (24/09/2026): game đã chạy online** — server trọng tài production (mục 4 › Kiến trúc online), client chỉ còn chế độ online, tiến độ lưu trên PostgreSQL. P2 xong phần mã; P3 đã có giới chung (bản đồ 150×150, tông môn NPC, linh mạch/mỏ/yêu vương/cổng, kết trận, viện binh, tiên minh, chat) — còn độ kiếp công khai, mùa, chợ (mục 5 › P3). P1 offline đã đủ tính năng (mục 13).

## 0. Giả định (sửa nếu sai)

- Làm một mình. Thời gian ước lượng cho **full-time, đã quen TypeScript**. Part-time nhân ×2–2.5; lần đầu làm game nhân thêm ×1.5.
- Một codebase chạy cả **web, PC, mobile**.
- Thị trường đầu: người chơi VN + tiếng Anh (web, Steam).
- Không có tiền mua user → tăng trưởng nhờ cộng đồng.

## 1. Tầm nhìn

**Bạn là chưởng môn một tông môn vô danh.** Thu nhận đệ tử, tu luyện, luyện đan, tranh linh mạch với các tông môn khác trong một giới, rồi dẫn tông môn phi thăng khi mùa giải khép lại.

Ba trụ cột — mọi tính năng phải phục vụ ít nhất một:

1. **Truyền thừa của riêng mình** — trưởng lão, chân truyền có tên, linh căn, công pháp; bạn nuôi họ lớn chứ không chỉ quay gacha.
2. **Chờ đợi có nghĩa** — timer là bế quan; offline vẫn tiến; mỗi phiên 5–10 phút là đủ.
3. **Tranh đoạt có luật** — xung đột xoay quanh linh mạch và độ kiếp; phối hợp (kết trận) thắng được số đông và tiền.

### Không làm (tới khi có lý do rất rõ)

- Hành quân realtime có chặn giữa đường; pathfinding theo ô.
- Trận đánh kéo dài nhiều phút trên bản đồ như RoK → trận tự động, giải quyết ngay khi quân tới.
- 3D, hoạt ảnh nhân vật phức tạp.
- Liên server (KvK), chuyển server.
- Gacha lớn, bán sức mạnh PvP trực tiếp.
- Tự viết engine, microservices, Kubernetes.
- Lên app store trước khi bản web được kiểm chứng.

## 2. Vòng lặp chơi

| Nhịp | Người chơi làm gì |
|---|---|
| Phiên (5–10 phút) | Thu tài nguyên → xếp hàng xây/nâng → phân đệ tử tu luyện → đánh yêu thú, bí cảnh → (P3) gửi đội chiếm linh mạch → thoát, timer chạy tiếp |
| Ngày | Đột phá tầng, nhiệm vụ ngày, (P2) đánh tông môn khác, (P3) giúp đồng minh, kết trận |
| Mùa (6–8 tuần, từ P3) | Giới mới mở → tranh linh mạch → tiên minh tranh trận nhãn → xếp hạng → **phi thăng** (top) / **luân hồi** (còn lại) |
| Qua mùa | Giữ: trưởng lão, công pháp đã ngộ, cosmetic, điểm luân hồi. Reset: công trình, tài nguyên, đệ tử |

Trước P3 tiến trình liên tục, luân hồi là tự nguyện.

**Vì sao reset theo mùa** (giống 三国志战略版 / 率土之滨, không giống RoK): ít người vẫn đông bản đồ, không có server chết, người mới không bị bỏ xa, và nội dung chính là bản đồ nên ít phải sản xuất content. Rủi ro "người chơi ghét reset" được thử sớm ở cuối P1 bằng luân hồi tự nguyện. Nếu thất bại: giữ tông môn, chỉ reset bản đồ giới.

## 3. Hệ thống và phạm vi

| Hệ thống | Tương đương RoK | P1 (offline) | Sau đó |
|---|---|---|---|
| Chủ điện (cấp = cảnh giới chưởng môn) | Tòa thị chính | ✅ Luyện Khí → Kim Đan (tầng 1–15); số đội xuất quân 1/2/3 theo cảnh giới | ✅ Nguyên Anh, Hóa Thần (tầng 16–25), tới 5 đội xuất quân. Từ tầng 16 tăng trưởng thoải (chi phí ×1,22, thời gian ×1,05 mỗi tầng; số tầng 1–15 giữ nguyên), sản lượng mỗi tầng ×1,5 |
| Công trình | Thành phố | ✅ 8 (xem dưới) | ✅ Luyện Khí Phòng (tầng 8: 9 pháp bảo tất định, cấp tối đa ⌈tầng/2⌉ ≤ 10) · Hộ sơn đại trận (P2) |
| Tài nguyên | Lương, gỗ, đá, vàng | ✅ Linh thạch, Linh thảo, Linh khoáng | Tiên ngọc — premium (P4) |
| Đệ tử | Lính | ✅ 3 hệ × 3 bậc (Ngoại môn / Nội môn ở Diễn võ trường 5 / Chân truyền ở 10) | ✅ Bậc 4 Hạch tâm (Diễn võ trường 16), bậc 5 Thánh tử (21) |
| Trưởng lão | Tướng | ✅ 6 người, 1 công pháp chủ động + 2 bị động (mở ở cấp 5, 12), cấp 1–30 | ✅ 12 người (thêm từ bí cảnh 4–5, tháp tầng 30/45, sự kiện tuần, yêu vương giữa giới), cấp tới 40, ngũ hành, thiên phú 3 nhánh (mỗi 5 cấp một điểm), mỗi người đeo một pháp bảo |
| Tàng Kinh Các | Học viện | ✅ 20 công pháp, 5 hàng mở theo tầng 1/3/6/9/12 | ✅ 28 công pháp, thêm hàng ở tầng 16, 21 · mở rộng theo mùa |
| Đan phòng | Bệnh viện | ✅ Chữa thương (chỗ nằm có hạn, dư thì tử trận) + 3 đan: Tụ Khí (tăng tốc), Bồi Nguyên (kinh nghiệm), Độ Kiếp | ✅ Đan theo công thức: Hồi Xuân (chữa ngay), Ngưng Thần (công +10 % 2 giờ), Đại Tụ Khí (từ 6 Tụ Khí, −2 giờ), Phá Cảnh (từ 2 Độ Kiếp, lôi kiếp −45 %), Tẩy Tủy (cộng lại thiên phú) |
| Bản đồ | Bản đồ vương quốc | ✅ Vùng PvE riêng: 15 yêu thú (hạ cấp n mới mở n+1, hang hồi sau 45 phút), 5 tông môn NPC, 3 bí cảnh × 5 tầng | ✅ Bí cảnh 4–5 (Lôi Trì tầng 16, Hỗn Độn tầng 21; địch có ngũ hành) · ✅ P3: giới chung 150×150 (25 vùng, 40 cổng mở theo pha mùa, ~250 điểm: linh mạch, mỏ, yêu vương, Thiên Môn), nút gạt Giới \| Vùng |
| Sự kiện cuối tuần | Sự kiện | ✅ Thứ Bảy, Chủ nhật (giờ VN): chiến lợi phẩm đánh lại và kinh nghiệm ×1,5; thưởng lần đầu giữ nguyên. Dải thông báo trong bảng nhiệm vụ, bảng mục tiêu hiện số đã nhân | Sự kiện theo mùa, có chủ đề (P3) |
| Thương hội | Chợ đổi tài nguyên | ✅ Ở Tàng Bảo Các: đổi tài nguyên dư lấy loại thiếu, nhận về 60% (+1% mỗi tầng Tàng Bảo Các, tối đa 75%) — cứu kho lệch, vẫn đắt hơn xây công trình tài nguyên | Chợ giữa người chơi (P3) |
| Thư, xếp hạng, sự kiện tuần | — | — | ✅ Thư có quà (nhận đúng một lần; admin gửi qua inbox), xếp hạng giới (lực chiến, cảnh giới, tháp, tranh đoạt, sự kiện tuần), sự kiện tuần 6 chủ đề xoay vòng, 5 mốc quà (mốc 5: trưởng lão Tô Mị Nương), top 10 giới nhận thư |
| Thông Thiên Tháp | — | ✅ Tháp thử thách không giới hạn tầng, mở ở tầng 10, đánh ngay như bí cảnh; mỗi tầng địch mạnh hơn 10% và đổi hệ chính; thưởng lần đầu mỗi tầng (tầng 5: Tụ Khí, tầng 10: Độ Kiếp + Bồi Nguyên); kỷ lục giữ qua luân hồi. Sim: bot giỏi tầng 39 sau 30 ngày, người chơi thường tầng 38 sau 45 ngày | Bảng xếp hạng tháp (P2) |
| Độ kiếp | — | ✅ 3 đợt lôi kiếp (mỗi đợt một hệ), đệ tử sống sót đi tiếp; thành công lên tầng ngay, thất bại chờ 10 phút | ✅ Kiếp tầng 15, 20 (mỗi đợt thêm một hành) · P3: kiếp vân công khai trên bản đồ |
| PvP | Đánh thành | — | ✅ P2: cướp bất đồng bộ trong giới (từ tầng 6; kho bảo hộ 30 %, cướp 30 % phần vượt theo sức mang; khiên 8 giờ khi thủ thua, đi cướp thì mất khiên, tân thủ 72 giờ; báo thù 24 giờ; điểm kiểu Elo; Hộ Sơn Đại Trận + trưởng lão trấn thủ) · P3: trên bản đồ |
| Tiên minh | Liên minh | — (tab khóa "sắp có") | ✅ P3: lập (tầng 10, 20k mỗi loại), vào, rời, 3 chức vị, bố cáo, giúp tăng tốc (10 lần/việc), kết trận (8 đội, chờ 5/10/30 phút), viện binh đồn trú nhà đồng minh, linh mạch buff sản lượng cả minh (trần 30 %) |
| Mùa, luân hồi | KvK | ✅ Luân hồi tự nguyện ở tầng 15: giữ trưởng lão, công pháp, đan; kiếp sau khởi đầu với công trình tầng 3 rồi tầng 5 ("căn cơ"), mỗi lần +20% sản lượng, −10% thời gian xây | P3: gắn với mùa |
| Chat | Chat | — | ✅ P3: kênh giới (tầng ≥ 3) + kênh minh, lọc từ trên chữ có dấu, burst 3 rồi 1 tin/3 giây, báo cáo (lưu bằng chứng), chặn, admin mute qua inbox |
| Nhiệm vụ ngày, tuần | Nhiệm vụ hằng ngày | ✅ Ngày: 4 việc (xây 2 lần, tuyển 50, thắng 3 trận, luyện 1 mẻ đan) + rương, làm mới 0h giờ VN. Tuần: 5 việc (xây 12, tuyển 400, thắng 15, luyện 5 mẻ, mở rương ngày 5 hôm) + rương có Độ Kiếp Đan, làm mới 0h thứ Hai. Mở ở tầng 3 | Sự kiện |
| Âm thanh | — | ✅ Hiệu ứng + nhạc nền cổ phong sinh bằng WebAudio (đàn tranh, sáo trúc, trầm nền), bật/tắt riêng | ✅ Nhạc theo cảnh: bản đồ nhiều sáo trúc, xem trận / độ kiếp có trống trận |

5 cảnh giới × 5 tầng = 25 cấp, như 25 cấp Tòa thị chính của RoK. Qua mỗi cảnh giới mới (tầng 5→6, 10→11, 15→16, 20→21) phải độ kiếp. Luân hồi mở từ tầng 15 (kiếp đầu); tầng 16–25 là đường tiếp cho người không luân hồi và là thang tầng của mùa giải.

**Ngũ hành:** Kim khắc Mộc, Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim. Mỗi trưởng lão có một hành; địch có hành chỉ từ tầng 15 (lôi kiếp 15/20, bí cảnh 4–5). Người dẫn khắc hành địch: sát thương ×1,1, bị khắc ×0,92. Địch không hành thì hệ số là 1 — mọi trận P1 ra đúng kết quả cũ.

**8 công trình P1:** Chủ điện, Tụ Linh Trận (linh thạch), Linh điền (linh thảo), Khoáng mạch (linh khoáng), Tàng Bảo Các (sức chứa — kéo người chơi quay lại), Diễn võ trường (đệ tử; 1 nhà cho cả 3 hệ), Tàng Kinh Các, Đan phòng.

**Combat:** tự động theo lượt (tối đa ~10 lượt), tất định theo seed → server tính, client phát lại đúng trận đó.

- Một đội = 1 trưởng lão (P3 thêm phó) + đệ tử.
- Hệ khắc: **Kiếm tu > Pháp tu > Thể tu > Kiếm tu** (kiếm nhanh đuổi kịp pháp tu, pháp thuật xuyên thể phách, thân thể chịu được kiếm).
- Lore cho quân số: đệ tử là **trận cơ** — càng đông trận càng mạnh; trưởng lão là **trận nhãn** — cảnh giới của họ nhân sức mạnh cả trận.
- Một phần thương vong thành thương binh, về Đan phòng chữa.

## 4. Kỹ thuật

### Stack

| Phần | Chọn | Lý do |
|---|---|---|
| Ngôn ngữ | TypeScript mọi nơi | Luật game viết 1 lần, chạy cả client lẫn server |
| UI | Svelte 5 + Vite (lý do ở UX.md mục 1) | SLG phần lớn là màn hình UI; HTML/CSS làm UI responsive tốt nhất |
| Cảnh núi, bản đồ, hiệu ứng | PixiJS (WebGL) + hình vẽ tay sinh bằng mã (`@rok/art`) | Texture nướng một lần, chuyển động trên GPU: mượt trên điện thoại, dùng tiếp cho bản đồ chung P3 |
| Server | Node 24 + **Fastify** (API) + **Socket.IO** (thời gian thực) + **PostgreSQL** (Drizzle ORM), Zod, Pino, prom-client | Thư viện chuẩn, có sẵn nhịp tim/nối lại/ack/giới hạn tần suất; game theo timer nên 10k CCU chỉ tốn ~0,5 lõi |
| Web + PC + mobile | PWA từ P1; Capacitor (iOS/Android) và Electron + steamworks.js (Steam) ở P4 | 1 bản build; PWA đã chạy trên trình duyệt PC và điện thoại |

Tiền lệ: Melvor Idle (web, Steam, mobile), Antimatter Dimensions (web, Steam) — đều là game công nghệ web.

**Nếu muốn dùng Godot:** được, nhưng bản web nặng hơn, UI nhiều màn hình tốn công hơn, và server (Node/Go) không dùng chung được GDScript → luật game phải viết 2 lần. Chỉ đáng nếu combat nhiều hiệu ứng là trọng tâm.

### Cấu trúc repo (npm workspaces, không cần Nx/Turbo)

```
rok/
  apps/client/      @rok/client   Vite + Svelte 5 + PixiJS: UI, cảnh WebGL, save trên máy, PWA
  apps/server/      @rok/server   analytics (P1); server game từ P2
  packages/rules/   @rok/rules    luật game thuần — không I/O, không Date, không phụ thuộc gì
                                  index.ts (state, advance, apply) · combat.ts (trận tất định) · data.ts (số liệu) · simulate.ts (bot chỉnh nhịp)
  packages/art/     @rok/art      bút lông sinh hình vẽ tay (canvas → texture), icon, chân dung
  packages/i18n/    @rok/i18n     chữ mọi ngôn ngữ, chọn ngôn ngữ, tải theo nhu cầu
  (P2) packages/protocol · (P4) apps/mobile (Capacitor), apps/desktop (Electron + Steam)
```
Chiều phụ thuộc do `architecture.test.ts` khoá: apps dùng packages, không bao giờ ngược lại; `rules` không phụ thuộc gì.

### Ba kỹ thuật cốt lõi

**1. Luật game là hàm thuần**

```ts
advance(state, now): State                  // cộng tài nguyên, hoàn tất mọi việc hẹn giờ đã tới hạn, theo đúng thứ tự thời gian
apply(state, action, now): Result           // mọi thao tác: xây, tuyển, chữa, nghiên cứu, luyện đan, xuất quân, độ kiếp…
fight(attacker, defender, seed): { win, rounds }   // packages/rules/combat.ts — số còn lại mỗi lượt, đủ để client phát lại
```

P1: client chạy `rules`, lưu trên máy. P2: server chạy **chính** `rules` đó làm trọng tài, client chạy song song để phản hồi tức thì → không phải viết lại. Tài nguyên dùng số nguyên, thời gian là số ms.

**2. Thời gian lười — không có vòng lặp tick**

Tài nguyên = đã có + tốc độ × thời gian trôi (chặn bởi sức chứa). Timer lưu `finishAt`. Mỗi lần đọc state thì gọi `advance(state, now)`. Được miễn phí: tiến trình offline, và server rảnh khi không ai chơi.

**3. Bản đồ chung kiểu Travian/OGame (P3)**

- Hành quân = bản ghi `{from, to, departAt, arriveAt, army}`. Client tự vẽ vị trí nội suy; server giải quyết khi tới giờ.
- Trong một vùng thì đi thẳng; giữa các vùng phải qua cổng **trận nhãn** → đường đi là đồ thị vài chục vùng, không pathfinding theo ô. Đây cũng là lý do lore vì sao tu sĩ biết bay vẫn bị chặn: kết giới.
- Kết trận (rally) = các đội tới cùng mục tiêu cùng lúc thì gộp lại.
- Mỗi giới xử lý tuần tự trong 1 hàng đợi. Trước khi xử lý thao tác của người chơi, xử lý hết sự kiện đã tới hạn theo thứ tự `dueAt` → không race condition, không sai thứ tự thời gian.

### Dữ liệu (Postgres)

- `accounts` — token khách (lưu hash); liên kết Google/Apple ở P4.
- `players` — `state jsonb` chứa cả tông môn, `version` để khóa lạc quan.
- `tiles`, `events`, `alliances` — từ P3.
- `analytics(ts, player_id, name, props)` — tự đo retention bằng SQL.

### An toàn

- Client chỉ gửi ý định; server kiểm tra (`parseAction` + Zod ở biên), dùng giờ server, giới hạn tần suất (HTTP theo IP, sự kiện socket theo kết nối).
- Save offline của P1 **không** chuyển sang bản online (không kiểm được hack) — client dọn save cũ và báo một lần.
- Phiên: token ngẫu nhiên, DB chỉ giữ sha256; cùng origin dùng cookie HttpOnly + header chống CSRF. Safari có thể xoá storage của web ít mở → nhắc liên kết email, mã chuyển máy (M9).
- Backup Postgres hằng ngày ra nơi khác, và thử khôi phục ít nhất 1 lần.

### Đơn giản hóa có chủ đích

| Đang làm | Giới hạn | Nâng cấp khi |
|---|---|---|
| 1 process, xử lý tuần tự mỗi giới | ~vài nghìn người/giới | Tách process theo giới |
| Không chặn giữa đường | Mất một chiêu chiến thuật của RoK | Người chơi đòi → tính giao điểm hai đường thẳng |
| Nhận cả giới khi mở bản đồ (chưa chia theo ô) | ~1k người/giới | Chia theo ô |
| State người chơi trong 1 JSONB | Khó query chéo | Bảng xếp hạng cần → tách cột |
| Analytics bằng bảng SQL | Không có dashboard | Cần funnel phức tạp → dịch vụ ngoài |
| Phát lại trận bằng HTML | Chưa có hiệu ứng chiêu thức trên WebGL | Cần combat nhiều hiệu ứng → dựng cảnh trận trong `apps/client/src/world/` |
| Trận đánh gộp theo nhóm (không có đội hình, vị trí) | Ít chiều sâu chiến thuật hơn RoK | Người chơi đòi → thêm hàng trước/sau |
| Một hàng đợi cho mỗi việc (xây, tuyển, chữa, nghiên cứu, luyện đan) | Không xếp lịch trước được | Bán "thêm 1 hàng đợi" (P4) |

### Kiến trúc online (đã chạy)

- **Mỗi giới là một actor đơn luồng** (`apps/server/src/game/world.ts`): mọi người chơi của giới nằm trong RAM, mọi thao tác và sự kiện tới hạn xử lý tuần tự — không khoá, không race; PvP, giúp đỡ, chợ đều nguyên tử.
- **Node giống hệt nhau, chia giới bằng lease + epoch** (`worlds.owner/lease_until/epoch`): node chết thì lease hết, node khác nhận giới; mọi lần ghi đều kiểm epoch nên không bao giờ có hai node cùng ghi một giới. API trả về đường Socket.IO của node đang giữ giới (`/n1/socket.io`…), Caddy trỏ thẳng.
- **RAM là chuẩn, commit gộp, ack sau khi ghi**: state đổi → commit gộp mỗi `COMMIT_MS` (30 ms) trong một transaction có fencing; ack/patch chỉ rời server sau khi commit xong → **đã ack là đã ghi**. Client đoán trước thao tác tất định nên không thấy độ trễ.
- **Gửi patch, không gửi cả state**: khoá tầng trên có tham chiếu đổi (~500 B/thao tác); chiến báo đi luồng riêng (không nằm trong state gửi đi, cũng không nằm trong RAM server).
- **Mầm trận không bao giờ rời server**: server bơm mầm ngẫu nhiên mới trước mọi thao tác; client luôn thấy seed = 0 (rules: mầm 0 = ẩn → không tự giải trận), kết quả trận do server đẩy xuống đúng lúc.
- **`apply()` tự kiểm dữ liệu vào** (`parseAction`): chặn cả 8 lỗ cày thưởng / làm sập đã tìm thấy khi soát luật.
- **Đo được** (máy dev, một node, `npm run load`): 2000 kết nối, ~500 thao tác/giây, ack p50 29 ms · p95 44 ms · p99 52 ms (mỗi ack đã commit vào Postgres), 0 lỗi; 1000 kết nối: p99 51 ms. Trên 2000 thì máy dev hết RAM trước server (swap đầy, OOM killer), nên bài 10k CCU nhiều node chạy trên máy phát tải riêng (mốc M10 trong kế hoạch online).

### Đa nền tảng

- Giao diện **dọc trước** cho điện thoại (SLG mới như Whiteout Survival, Last War đều dọc); trên PC: khung dọc + panel bên.
- Hỗ trợ cả chạm (kéo, pinch) lẫn chuột (kéo, cuộn).
- Chữ hiển thị nằm trong package `@rok/i18n` (`packages/i18n/locales/*.ts`, cùng khuôn `Text`), component đọc qua object `L`; thêm ngôn ngữ xem [README](../README.md) mục Đa ngôn ngữ. Bảng thuật ngữ: Luyện Khí = Qi Refining, Trúc Cơ = Foundation Establishment, Kim Đan = Golden Core, Nguyên Anh = Nascent Soul.

## 5. Lộ trình

| Phase | Thời gian (full-time) | Ra được gì |
|---|---|---|
| P0 Giấy & spike | 2–3 tuần | GDD 1 trang, sheet số liệu, bản đồ PixiJS chạy mượt trên điện thoại thật |
| P1 Lõi offline | ~3 tháng | Web demo, ~2 tuần nội dung |
| P2 Online | 1.5–2 tháng | Game hoàn chỉnh: idle tu tiên + PvP bất đồng bộ |
| P3 Giới | 3–5 tháng | Bản đồ chung, tiên minh, mùa giải — phần "RoK" |
| P4 Ra mắt | 2–3 tháng | iOS, Android, Steam, thanh toán |
| P5 Vận hành | liên tục | Mỗi mùa một thay đổi lớn |

Tổng ~10–14 tháng full-time. **Phase nào cũng kết thúc bằng một bản chơi được** — dừng ở P2 vẫn có game bán được. Cần tiền sớm: làm P4 ngay sau P2 (Steam Early Access), P3 thành bản cập nhật lớn.

### P0 — Giấy & spike (2–3 tuần)

- GDD 1 trang: trụ cột, vòng lặp, danh sách Không làm.
- Sheet số liệu 15 tầng đầu. Mục tiêu: chơi 4 phiên/ngày thì tới tầng 15 (Kim Đan viên mãn) sau ~14 ngày.
- Mô phỏng combat trên sheet: hệ khắc có tạo khác biệt thật không.
- Spike: bản đồ PixiJS 100×100 ô, kéo/zoom trên Android tầm trung và iPhone Safari.

### P1 — Lõi offline trên web (~3 tháng)

| Mốc | Nội dung | Thời gian | Trạng thái |
|---|---|---|---|
| 1.1 | Tông môn: xây/nâng, tài nguyên, hàng đợi, tiến trình offline, save trên máy + xuất/nhập. UI xấu cũng được | 2–3 tuần | ✅ |
| 1.2 | Đệ tử, trưởng lão, combat + màn phát lại, bản đồ PvE: yêu thú, tông môn NPC | 3–4 tuần | ✅ |
| 1.3 | Cảnh giới + độ kiếp, Tàng Kinh Các, Đan phòng, bí cảnh, nhiệm vụ chính tuyến (làm tutorial luôn) | 3 tuần | ✅ 45 nhiệm vụ dẫn qua mọi hệ thống |
| 1.4 | Art pass, âm thanh, luân hồi, endpoint analytics ẩn danh (mầm của server P2), phát hành demo | 2–3 tuần | ✅ trừ: đưa lên itch.io/domain |

Công cụ: `packages/rules/simulate.ts` (`npm run sim`) — bot chơi `rules` 30 ngày ảo, in ra lúc đạt từng cảnh giới → chỉnh nhịp bằng số liệu, không bằng cảm giác.

Nhịp hiện tại. Bot giỏi (`npm run sim`) được xem trước kết quả trận; người chơi thường (`npm run sim -- 45 3 --casual`) mỗi phiên chỉ làm 1 lượt và chỉ đánh khi giao diện báo ≥ 80% thắng:

| | Bot giỏi, 4 phiên/ngày | Bot giỏi, 2 phiên/ngày | Người chơi thường, 3 phiên/ngày |
|---|---|---|---|
| Độ kiếp → Trúc Cơ | ngày 3 | ngày 5 | ngày 7 |
| Độ kiếp → Kim Đan | ngày 6 | ngày 10 | ngày 10 |
| Chủ điện tầng 15 | ngày 11 | ngày 18 | ngày 17,5, không thua trận nào |

(đã tính nhiệm vụ ngày và tuần; bot dồn Chủ điện nhưng giữ 3 công trình tài nguyên ≥ tầng 2 như chuỗi nhiệm vụ dạy)

Tầng 16–25, không luân hồi (`npm run sim -- 60 4 --goal 25`, CI chặn nếu không tới 25; `npm run sim -- 49 3 --casual --goal 21`): bot giỏi độ kiếp 15 → 16 ở ngày 14,5, 20 → 21 ở ngày 24, tầng 25 ở ngày 34,5; người chơi thường tầng 16 ở ngày 27, tầng 21 ở ngày 38,5, tầng 25 ở ngày 48 — trong một mùa 49 ngày.

**Luân hồi** (`npm run sim -- 60 4 --rebirth` và `npm run sim -- 90 3 --casual --rebirth`, tính từ đầu kiếp tới lúc luân hồi, gồm cả dọn hết bản đồ):

| | Kiếp 1 | Kiếp 2 | Kiếp 3 trở đi |
|---|---|---|---|
| Bot giỏi, 4 phiên/ngày | 12,8 ngày | 9 ngày | ~5,5 ngày |
| Người chơi thường, 3 phiên/ngày | 23,3 ngày | 15,2 ngày | ~8,5 ngày |

Bài học rút ra: nhịp bị giới hạn bởi *số lần phải xây* (một tạp dịch, vài phiên/ngày) chứ không bởi thời gian mỗi lần xây — công trình 2 giờ hay 1 giờ 12 phút đều nằm chờ tới phiên sau. Thưởng luân hồi chỉ bớt thời gian xây (kể cả −40%) làm kiếp sau nhanh hơn chưa tới 15%; "căn cơ" (bỏ qua các lần xây đầu) mới tạo khác biệt. Cùng lý do, món "thêm 1 hàng đợi xây" dự kiến bán ở P4 sẽ rất mạnh (Chủ điện 15: bot từ ngày 11 xuống ngày 9, người chơi thường từ ngày 19 xuống ngày 14) — cần trần cẩn thận.

**Cổng P1** (tham khảo): ≥ 300 người thử; D1 ≥ 30%, D7 ≥ 10%; người đã luân hồi vẫn chơi tiếp. Không đạt → sửa lõi, chưa làm online.

### P2 — Online (1.5–2 tháng) — ✅ xong phần mã

Đã chạy: server trọng tài (mục 4 › Kiến trúc online), PvP bất đồng bộ trong giới, Hộ Sơn Đại Trận, Luyện Khí Phòng, thư, xếp hạng, sự kiện tuần, `/api/admin/stats` (D1/D7 theo ngày vào đầu tiên, phân bố cảnh giới, tỉ lệ độ kiếp). Cân bằng PvP đo bằng `npm run sim -- 30 4 --pvp 20` (20 bot chung giới, nửa giỏi nửa thường; CI chặn): trung vị tầng 19 sau 30 ngày, đồ bị cướp 20,7 % sản lượng (trần 25 %), người không đi cướp bị cướp nhiều nhất 2 lần/ngày (trần 3). Việc còn lại để qua cổng là việc ngoài mã: người chơi thật.


- Server Node + Postgres, tài khoản khách, `rules` chạy trên server, cloud save.
- PvP bất đồng bộ: ghép đối thủ cùng tầm lực chiến → xuất quân (có timer) → đánh vào phòng thủ hiện tại của họ (Hộ sơn đại trận + đệ tử thủ) → cướp một phần tài nguyên ngoài phần kho bảo hộ. Có khiên bảo hộ sau khi bị đánh, có báo thù.
- Bảng xếp hạng, thư hệ thống, sự kiện tuần đơn giản, Luyện khí phòng (pháp bảo).
- **Cổng:** vài trăm người chơi thật, server ổn, không có exploit lớn.

### P3 — Giới (3–5 tháng)

- Mỗi giới ~150×150 ô cho 100–300 người; tông môn NPC từ P1 lấp chỗ trống; giới mới mở khi giới cũ đầy.
- Hành quân, chiếm linh mạch (tu luyện nhanh hơn cho người trong vùng), tài nguyên trên bản đồ.
- Tiên minh: giúp nhau tăng tốc, lãnh thổ từ linh mạch, kết trận đánh yêu vương và cứ điểm.
- Kết giới + trận nhãn chia vùng (thay cho đèo của RoK).
- Độ kiếp công khai: kiếp vân hiện trên bản đồ, đồng minh đến hộ pháp, địch đến phá. Thất bại chỉ bị chậm lại, không mất trắng.
- Chat thế giới + tiên minh (WebSocket), có lọc từ, báo cáo, chặn người chơi (store bắt buộc khi có chat).
- Mùa 6–8 tuần, phi thăng / luân hồi. Khi mở P3: mọi người chơi P2 luân hồi vào mùa 1 kèm quà bù.
- **Cổng:** chạy trọn 1 mùa với ≥ 100 người hoạt động mỗi giới.

Đã chạy (phần mã): bản đồ giới sinh từ seed (vùng lồi Voronoi, 3 vòng, đường đi Dijkstra qua cổng đang mở), 32 phân đà NPC tự chơi (giữ mạch vùng mình, chỉ phản kích), hành quân thời gian thực tới điểm (chiếm / khai mỏ / đánh yêu vương theo pool + slice / đồn trú, gọi về), kết trận, viện binh, linh triều (8 giờ một lần, 2 giờ, +15 % sản lượng), thời tiết, ngày đêm, biên niên giới. Client: cảnh WebGL chung với núi, địa hình nướng trong worker (3 mức chi tiết, LRU), ghim tên, kéo quán tính, chụm, con lăn, phím. Còn lại: độ kiếp công khai, mùa 49 ngày + phi thăng, chợ.

### P4 — Ra mắt đa nền tảng (2–3 tháng)

- Capacitor (iOS/Android), Electron + Steam.
- Liên kết tài khoản Google/Apple/email; xóa tài khoản ngay trong app (Apple bắt buộc); chính sách quyền riêng tư; phân loại độ tuổi.
- Thanh toán: web (Xsolla cho quốc tế, VNPay/MoMo cho VN), Google Play Billing, Apple IAP, Steam. Mỗi nơi một cổng; server xác minh biên lai; chung 1 bảng `purchases`.
- Push notification: xây xong, bị tấn công, kiếp vân.
- Soft launch 1 store / 1 thị trường → chỉnh → mở rộng.

### P5 — Vận hành

- Mỗi mùa một thay đổi lớn (luật giới, yêu thú, cảnh giới mới); sự kiện tuần dùng lại template.
- Xem analytics sau mỗi mùa, cắt thứ không ai dùng.

## 6. Art & âm thanh (một người)

- Phong cách **thủy mặc tối giản**: nền giấy, nét mực, điểm màu. Rẻ, hợp chủ đề, khác biệt, dễ đồng bộ.
- Nhân vật là chân dung tĩnh; combat là biểu tượng đội hình + số sát thương + vài hiệu ứng hạt (kiếm quang, lôi kiếp).
- Asset pack (itch.io…), nhạc cổ phong royalty-free (cổ cầm, sáo trúc). Dùng AI art thì phải khai báo trên Steam.

## 7. Kinh tế & kiếm tiền

- 3 tài nguyên + 1 premium; mọi con số nằm trong `packages/rules/data.ts`, chỉnh bằng `simulate.ts`.
- Kiếm tiền từ P4, không phá fantasy "phế vật nghịch thiên":
  - Tu Tiên Lệnh (season pass) — khớp với mùa giải.
  - Cosmetic: skin tông môn, pháp tướng, hiệu ứng phi thăng.
  - Tiện lợi có trần: thêm 1 hàng đợi, tăng tốc giới hạn mỗi ngày.
  - Mobile: quảng cáo có thưởng, người chơi tự chọn xem.
- Mùa đầu không bán đệ tử hay sức mạnh PvP.
- Không có chợ đổi vật phẩm ra tiền thật (luật VN cấm — xem mục 9).

## 8. Phát hành & cộng đồng

- Devlog từ tuần 1: TikTok/YouTube Shorts, nhóm Facebook truyện tu tiên; Discord cho người test.
- Demo web: itch.io + domain riêng; đăng r/incremental_games, r/progressionfantasy, r/WebGames.
- Mở trang Steam "Coming soon" càng sớm càng tốt để gom wishlist; đưa demo vào Steam Next Fest trước khi ra mắt.

## 9. Pháp lý & chính sách store

- **VN:** game G1 (nhiều người tương tác qua server) phát hành cho người chơi VN cần **doanh nghiệp** có Giấy phép G1 + Quyết định phát hành từ Bộ VHTTDL (Nghị định 147/2024/NĐ-CP, hiệu lực 25/12/2024). Vật phẩm ảo không được quy đổi ra tiền hay hiện vật ngoài game. → Hỏi luật sư trước khi phát hành chính thức hoặc thu tiền ở VN; hoặc hợp tác với nhà phát hành đã có giấy phép.
- **Apple/Google:** vật phẩm số trong app phải qua IAP; có chính sách quyền riêng tư; xóa tài khoản trong app; chat phải có lọc, báo cáo, chặn.
- **Steam:** mua bán trong game qua Steam; khai báo nội dung AI.
- Thu thập dữ liệu tối thiểu: ID, email nếu người chơi liên kết.

## 10. Chi phí năm đầu (ước lượng)

| Khoản | Chi phí |
|---|---|
| Domain | ~15 USD/năm |
| VPS (từ P2) + backup | ~10–25 USD/tháng |
| Host client tĩnh | 0 (Cloudflare Pages) |
| Apple Developer | 99 USD/năm |
| Google Play | 25 USD, một lần |
| Steam Direct | 100 USD/game |
| Asset, nhạc | 0–300 USD |
| **Tổng** | **~300–800 USD** — chưa tính máy Mac (để build iOS), lập công ty, giấy phép |

## 11. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Phình scope, bỏ dở | Phase nào cũng ra bản chơi được; danh sách Không làm; cổng quyết định |
| Giới vắng người | Giới nhỏ, tông môn NPC lấp chỗ, mùa ngắn |
| Hack | Server làm trọng tài từ P2; client chỉ gửi ý định |
| Mất dữ liệu | Backup hằng ngày + thử khôi phục |
| Art nghẽn | Thủy mặc tối giản, chân dung tĩnh, asset pack |
| Người chơi ghét reset | Thử luân hồi ở P1; dự phòng: chỉ reset bản đồ |
| Kiệt sức | Mốc 2–3 tuần, devlog công khai, cắt tính năng thay vì dời lịch |
| Tencent 《遮天世界》 | Không đấu cùng sân: web/PC nhẹ, mùa ngắn, không P2W, thị trường VN/EN |
| Pháp lý VN | Hỏi luật sư trước khi thu tiền ở VN |

## 12. Hai tuần đầu

1. Viết GDD 1 trang.
2. Sheet số liệu 15 tầng đầu.
3. ✅ Khởi tạo repo: npm workspaces (nay là `apps/*` + `packages/*`, xem README).
4. ✅ `@rok/rules`: `State`, `advance()`, action xây + nâng cấp, kèm test (`packages/rules/rules.test.ts`).
5. ✅ Màn hình tông môn theo UX.md: tài nguyên, tạp dịch + gợi ý, 8 công trình, đếm ngược, save trên máy, màn Xuất quan.

## 13. Phát hành demo (P1)

**Build:** `npm run build` → thư mục tĩnh `apps/client/dist/` (đường dẫn tương đối, chạy được ở gốc domain lẫn thư mục con).

- **Cloudflare Pages:** build command `npm run build`, output `apps/client/dist`.
- **itch.io:** `npm run package` → `release.zip` (build + nén `apps/client/dist/`), chọn "This file will be played in the browser", khung 480 × 860, bật "Mobile friendly".
- **PWA:** có manifest + icon huy hiệu vẽ tay + service worker (`apps/client/public/sw.js`): mở lần đầu xong là chơi offline được, cài lên màn hình chính được. Mỗi bản build có tên cache riêng (`rok-<mã build>`). Sau khi deploy, người chơi chạy bản mới ngay (trang HTML lấy mạng trước); service worker mới kích hoạt ở lần mở kế tiếp và xoá cache bản cũ.
- **Server:** `apps/server/deploy/` — Docker Compose (Postgres 17 + 2 node game + Caddy HTTPS tự động), `.env.example` (DOMAIN, DB_PASSWORD, ORIGINS). Client tĩnh do Caddy phục vụ cùng origin với API/Socket.IO. Bản itch.io (khác origin): build với `VITE_SERVER_URL=https://<máy chủ>` và thêm origin itch.io vào `ORIGINS`.
- **Analytics:** server tự ghi sự kiện (bảng `events`: login, hall, trib, rebirth — theo ngày giờ VN), không cần client gửi gì. Số D1/D7, phân bố cảnh giới, tỉ lệ độ kiếp: `/admin/stats` (M5).
- **Font:** giấy phép OFL nằm cạnh font trong `apps/client/public/fonts/`.

**Kiểm thử trước khi phát hành:**
- `npm test`: luật (có các lỗ khai thác đã vá, fuzz), gói tin (patch khứ hồi trên lịch sử thật, không lộ mầm), i18n, ranh giới package, **server với Postgres thật** (database tạm mỗi lần: bắt tay, ack đã ghi DB, hai tab, trận PvE đẩy đúng giờ, khởi động lại giữ tiến độ, chuyển hướng node, bị rào khi mất quyền giữ giới, giới hạn tần suất) và vẽ mọi màn hình (SSR).
- `npm run check` (kiểu), `npm run sim` (nhịp).
- `npm run build && npm run e2e`: Chrome headless chơi thật với server + Postgres: lập tông môn, 14 nhiệm vụ bằng click (tua giờ giới qua API dev), tải lại vẫn còn tiến độ, hai tab đồng bộ, ngăn kéo desktop, **server bị kill -9 rồi lên lại: tự nối, không mất thao tác đã ack**, mất mạng hẳn vẫn mở được và báo rõ, console sạch.
- `npm run load`: bot socket.io thật (xem Kiến trúc online › Đo được).
- CI (`.github/workflows/ci.yml`) chạy tất cả, có service Postgres. Bản dev: `rok.warp(60)` (tua giới 60 phút, cần server `ALLOW_WARP=1`), `rok.get()` / `rok.set(state)`.

### Đánh giá sẵn sàng phát hành demo P1 (24/09/2026)

> Bảng này đánh giá **bản offline P1** trước khi chuyển sang online; các dòng save trên máy / chơi offline / máy nhận analytics không còn áp dụng (xem Kiến trúc online ở mục 4).

**Kết luận: đủ điều kiện phát hành bản demo cho người thử** (không phải bản thương mại). Phần mã không còn việc chặn; phần còn lại là việc ngoài mã (bảng dưới).

| Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|
| Vòng chơi trọn vẹn | ✅ | Lập tông môn → 46 nhiệm vụ → 2 lần độ kiếp → Chủ điện 15 → luân hồi. Bot bấm UI đi được tới nhiệm vụ 42 (tầng 11); luân hồi kiểm riêng qua UI |
| Nhịp (bot giỏi / người chơi thường) | ✅ | Tầng 10: ngày 5 / ngày 9 · tầng 15: ngày 11 / ngày 17,5 (đã tính nhiệm vụ tuần) · kiếp 2 ngắn hơn: 12,8 → 9 → 5,6 ngày |
| Không kẹt cứng | ✅ | Linh khí tự nhiên (BASE_RATE); chi phí vượt kho thì chỉ đường tới Tàng Bảo Các; thế yếu thì có nút tuyển; bảng tuyển chọn hệ đỡ cạn một loại tài nguyên |
| Save an toàn | ✅ | Kiểm khuôn khi nhập, cất bản hỏng, xuất/nhập file, 2 tab không đè nhau, màn lỗi có nút xuất save |
| Offline / PWA | ✅ | Tắt máy chủ vẫn chơi và đổi ngôn ngữ được (e2e); cache bỏ qua `Vary` của host |
| Màn hình | ✅ | Điện thoại (360–480px), máy tính bảng (cột 620px), desktop (cột trái, ngăn kéo phải, phím 1–5, chú thích khi rê chuột) |
| Ngôn ngữ | ✅ | Tiếng Việt, English; thêm ngôn ngữ = 1 file + 1 dòng (README) |
| Tự động kiểm | ✅ | CI mỗi lần push: test (luật, i18n, ranh giới package, vẽ mọi màn hình), kiểu, sim, build, e2e trên Chrome |
| Thử trên máy thật | ⬜ | Android tầm trung (Chrome), iPhone (Safari, cài PWA), iPad — chưa làm, giả lập không thay được |
| Máy nhận analytics | ⬜ | Mã + cấu hình triển khai xong (`apps/server/deploy/`); cần thuê VPS, trỏ tên miền, build với `VITE_ANALYTICS_URL` |
| Đăng tải + cộng đồng | ⬜ | `npm run package` → tải `release.zip` lên itch.io; nhóm Facebook/Discord |
| Cổng P1 | ⬜ | ≥ 300 người thử, D1 ≥ 30 %, D7 ≥ 10 %, đọc ở `/stats` |

**Rủi ro đã biết (không chặn demo):** chưa có âm thanh/rung được kiểm trên iOS thật; người chơi chỉ bấm theo nhiệm vụ mà không nâng công pháp, công trình tài nguyên sẽ chậm dần ở tầng 11+ (sim có chiến thuật vẫn tới tầng 15 ngày 17,5) — theo dõi bằng phân bố cảnh giới ở `/stats`.

**Ưu tiên sau khi có số liệu người thật:** (1) chỗ người chơi bỏ cuộc nhiều nhất theo phân bố cảnh giới; (2) tỉ lệ độ kiếp thành công lần đầu; (3) có ai luân hồi và chơi tiếp không — đúng câu hỏi của cổng P1.
6. Spike PixiJS 100×100 ô trên điện thoại thật.
