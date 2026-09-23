# Kế hoạch: Game tu tiên kiểu SLG — làm một mình, web + PC + mobile

> Tên game: chưa đặt. Tài liệu sống — sửa khi quyết định thay đổi. Game flow và UI/UX: [UX.md](UX.md).
>
> Lệnh: `npm run dev` (chạy game) · `npm test` · `npm run check` (kiểm tra kiểu) · `npm run sim` (bot chơi 30 ngày, in nhịp) · `npm run build`
>
> **Trạng thái (23/09/2026): P1 đã đủ tính năng** — xem mục 5 › P1 và mục 13. Việc còn lại để qua cổng P1 là phát hành demo và đo người thật.

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
| Chủ điện (cấp = cảnh giới chưởng môn) | Tòa thị chính | ✅ Luyện Khí → Kim Đan (tầng 1–15); số đội xuất quân 1/2/3 theo cảnh giới | Nguyên Anh, Hóa Thần (tới tầng 25) |
| Công trình | Thành phố | ✅ 8 (xem dưới) | Hộ sơn đại trận, Luyện khí phòng (P2) |
| Tài nguyên | Lương, gỗ, đá, vàng | ✅ Linh thạch, Linh thảo, Linh khoáng | Tiên ngọc — premium (P4) |
| Đệ tử | Lính | ✅ 3 hệ × 3 bậc (Ngoại môn / Nội môn ở Diễn võ trường 5 / Chân truyền ở 10) | Bậc 4–5 |
| Trưởng lão | Tướng | ✅ 6 người, 1 công pháp chủ động + 2 bị động (mở ở cấp 5, 12), cấp 1–30 | Thêm người, cây thiên phú, ngũ hành |
| Tàng Kinh Các | Học viện | ✅ 20 công pháp, 5 hàng mở theo tầng 1/3/6/9/12 | Mở rộng theo mùa |
| Đan phòng | Bệnh viện | ✅ Chữa thương (chỗ nằm có hạn, dư thì tử trận) + 3 đan: Tụ Khí (tăng tốc), Bồi Nguyên (kinh nghiệm), Độ Kiếp | Luyện đan theo công thức |
| Bản đồ | Bản đồ vương quốc | ✅ Vùng PvE riêng: 15 yêu thú (hạ cấp n mới mở n+1, hang hồi sau 45 phút), 5 tông môn NPC, 3 bí cảnh × 5 tầng | P3: giới chung |
| Độ kiếp | — | ✅ 3 đợt lôi kiếp (mỗi đợt một hệ), đệ tử sống sót đi tiếp; thành công lên tầng ngay, thất bại chờ 10 phút | P3: kiếp vân công khai trên bản đồ |
| PvP | Đánh thành | — | P2: bất đồng bộ; P3: trên bản đồ |
| Tiên minh | Liên minh | — (tab khóa "sắp có") | P3 |
| Mùa, luân hồi | KvK | ✅ Luân hồi tự nguyện ở tầng 15: giữ trưởng lão, công pháp, đan; kiếp sau khởi đầu với công trình tầng 3 rồi tầng 5 ("căn cơ"), mỗi lần +20% sản lượng, −10% thời gian xây | P3: gắn với mùa |
| Chat | Chat | — | P3 |
| Nhiệm vụ ngày | Nhiệm vụ hằng ngày | ✅ 4 việc (xây 2 lần, tuyển 50, thắng 3 trận, luyện 1 mẻ đan) + rương; làm mới 0h giờ VN; mở ở tầng 3 | Nhiệm vụ tuần, sự kiện |
| Âm thanh | — | ✅ Hiệu ứng + nhạc nền cổ phong sinh bằng WebAudio (đàn tranh, sáo trúc, trầm nền), bật/tắt riêng | Nhạc theo cảnh (bản đồ, trận) |

5 cảnh giới × 5 tầng = 25 cấp, như 25 cấp Tòa thị chính của RoK. Qua mỗi cảnh giới mới (tầng 5→6, 10→11, 15→16) phải độ kiếp.

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
| Server (từ P2) | Node.js + PostgreSQL, 1 process, 1 VPS | Game theo timer gần như không tốn CPU |
| Web + PC + mobile | PWA từ P1; Capacitor (iOS/Android) và Electron + steamworks.js (Steam) ở P4 | 1 bản build; PWA đã chạy trên trình duyệt PC và điện thoại |

Tiền lệ: Melvor Idle (web, Steam, mobile), Antimatter Dimensions (web, Steam) — đều là game công nghệ web.

**Nếu muốn dùng Godot:** được, nhưng bản web nặng hơn, UI nhiều màn hình tốn công hơn, và server (Node/Go) không dùng chung được GDScript → luật game phải viết 2 lần. Chỉ đáng nếu combat nhiều hiệu ứng là trọng tâm.

### Cấu trúc repo (npm workspaces, không cần Nx/Turbo)

```
rok/
  rules/     luật game thuần — không I/O, không Date
             index.ts (state, advance, apply) · combat.ts (trận tất định) · data.ts (số liệu) · simulate.ts (bot chỉnh nhịp)
  art/       bút lông sinh hình vẽ tay (canvas → texture): núi, công trình, mây, bản đồ, chất liệu giao diện; icon/chân dung SVG
  client/    Vite + Svelte: UI, save trên máy, PWA
  server/    analytics.ts: máy nhận analytics + retention (P1); server game từ P2
  mobile/    từ P4 (Capacitor)
  desktop/   từ P4 (Electron + Steam)
```

### Ba kỹ thuật cốt lõi

**1. Luật game là hàm thuần**

```ts
advance(state, now): State                  // cộng tài nguyên, hoàn tất mọi việc hẹn giờ đã tới hạn, theo đúng thứ tự thời gian
apply(state, action, now): Result           // mọi thao tác: xây, tuyển, chữa, nghiên cứu, luyện đan, xuất quân, độ kiếp…
fight(attacker, defender, seed): { win, rounds }   // rules/combat.ts — số còn lại mỗi lượt, đủ để client phát lại
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

- Từ P2: client chỉ gửi ý định; server kiểm tra, dùng giờ server, có rate limit.
- Save offline của P1 **không** chuyển sang bản online (không kiểm được hack) — báo trước cho người test.
- Safari có thể xóa dữ liệu của web ít mở → P1 có nút xuất/nhập save.
- Backup Postgres hằng ngày ra nơi khác, và thử khôi phục ít nhất 1 lần.

### Đơn giản hóa có chủ đích

| Đang làm | Giới hạn | Nâng cấp khi |
|---|---|---|
| 1 process, xử lý tuần tự mỗi giới | ~vài nghìn người/giới | Tách process theo giới |
| Không chặn giữa đường | Mất một chiêu chiến thuật của RoK | Người chơi đòi → tính giao điểm hai đường thẳng |
| Polling ở P2 | Trễ vài giây | Có chat (P3) → WebSocket |
| State người chơi trong 1 JSONB | Khó query chéo | Bảng xếp hạng cần → tách cột |
| Analytics bằng bảng SQL | Không có dashboard | Cần funnel phức tạp → dịch vụ ngoài |
| Phát lại trận bằng HTML | Chưa có hiệu ứng chiêu thức trên WebGL | Cần combat nhiều hiệu ứng → dựng cảnh trận trong `client/src/world/` |
| Trận đánh gộp theo nhóm (không có đội hình, vị trí) | Ít chiều sâu chiến thuật hơn RoK | Người chơi đòi → thêm hàng trước/sau |
| Một hàng đợi cho mỗi việc (xây, tuyển, chữa, nghiên cứu, luyện đan) | Không xếp lịch trước được | Bán "thêm 1 hàng đợi" (P4) |

### Đa nền tảng

- Giao diện **dọc trước** cho điện thoại (SLG mới như Whiteout Survival, Last War đều dọc); trên PC: khung dọc + panel bên.
- Hỗ trợ cả chạm (kéo, pinch) lẫn chuột (kéo, cuộn).
- Chữ hiển thị nằm trong object `L` (`client/src/lib.ts`) ngay từ đầu; khi dịch thì thêm `en` cùng kiểu. Bảng thuật ngữ: Luyện Khí = Qi Refining, Trúc Cơ = Foundation Establishment, Kim Đan = Golden Core, Nguyên Anh = Nascent Soul.

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

Công cụ: `rules/simulate.ts` — bot chơi `rules` 30 ngày ảo, in ra lúc đạt từng cảnh giới → chỉnh nhịp bằng số liệu, không bằng cảm giác.

Nhịp hiện tại. Bot giỏi (`npm run sim`) được xem trước kết quả trận; người chơi thường (`npm run sim -- 45 3 --casual`) mỗi phiên chỉ làm 1 lượt và chỉ đánh khi giao diện báo ≥ 80% thắng:

| | Bot giỏi, 4 phiên/ngày | Bot giỏi, 2 phiên/ngày | Người chơi thường, 3 phiên/ngày |
|---|---|---|---|
| Độ kiếp → Trúc Cơ | ngày 3 | ngày 5 | ngày 7 |
| Độ kiếp → Kim Đan | ngày 6 | ngày 10 | ngày 12 |
| Chủ điện tầng 15 | ngày 11 | ngày 19 | ngày 19, không thua trận nào |

(đã tính nhiệm vụ ngày; bot dồn Chủ điện nhưng giữ 3 công trình tài nguyên ≥ tầng 2 như chuỗi nhiệm vụ dạy)

**Luân hồi** (`npm run sim -- 60 4 --rebirth` và `npm run sim -- 90 3 --casual --rebirth`, tính từ đầu kiếp tới lúc luân hồi, gồm cả dọn hết bản đồ):

| | Kiếp 1 | Kiếp 2 | Kiếp 3 trở đi |
|---|---|---|---|
| Bot giỏi, 4 phiên/ngày | 12,8 ngày | 9 ngày | ~5,5 ngày |
| Người chơi thường, 3 phiên/ngày | 23,3 ngày | 15,2 ngày | ~8,5 ngày |

Bài học rút ra: nhịp bị giới hạn bởi *số lần phải xây* (một tạp dịch, vài phiên/ngày) chứ không bởi thời gian mỗi lần xây — công trình 2 giờ hay 1 giờ 12 phút đều nằm chờ tới phiên sau. Thưởng luân hồi chỉ bớt thời gian xây (kể cả −40%) làm kiếp sau nhanh hơn chưa tới 15%; "căn cơ" (bỏ qua các lần xây đầu) mới tạo khác biệt. Cùng lý do, món "thêm 1 hàng đợi xây" dự kiến bán ở P4 sẽ rất mạnh (Chủ điện 15: bot từ ngày 11 xuống ngày 9, người chơi thường từ ngày 19 xuống ngày 14) — cần trần cẩn thận.

**Cổng P1** (tham khảo): ≥ 300 người thử; D1 ≥ 30%, D7 ≥ 10%; người đã luân hồi vẫn chơi tiếp. Không đạt → sửa lõi, chưa làm online.

### P2 — Online (1.5–2 tháng)

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

- 3 tài nguyên + 1 premium; mọi con số nằm trong `rules/data.ts`, chỉnh bằng `simulate.ts`.
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
3. ✅ Khởi tạo repo: npm workspaces với `rules/` + `client/`.
4. ✅ `rules/`: `State`, `advance()`, action xây + nâng cấp, kèm test (`rules/rules.test.ts`).
5. ✅ Màn hình tông môn theo UX.md: tài nguyên, tạp dịch + gợi ý, 8 công trình, đếm ngược, save trên máy, màn Xuất quan.

## 13. Phát hành demo (P1)

**Build:** `npm run build` → thư mục tĩnh `client/dist/` (đường dẫn tương đối, chạy được ở gốc domain lẫn thư mục con).

- **Cloudflare Pages:** build command `npm run build`, output `client/dist`.
- **itch.io:** nén `client/dist/` thành zip, chọn "This file will be played in the browser", khung 480 × 860, bật "Mobile friendly".
- **PWA:** có manifest + icon ấn 宗 + service worker (`client/public/sw.js`): mở lần đầu xong là chơi offline được, cài lên màn hình chính được. Mỗi bản build có tên cache riêng (`rok-<mã build>`). Sau khi deploy, người chơi chạy bản mới ngay (trang HTML lấy mạng trước); service worker mới kích hoạt ở lần mở kế tiếp và xoá cache bản cũ.
- **Analytics:** build với `VITE_ANALYTICS_URL=https://<máy chủ>/e` thì client gửi beacon JSON `{id, name, props, v, t}` (id ngẫu nhiên của máy, không có dữ liệu cá nhân) cho các sự kiện `open`, `found`, `hall`, `trib`, `rebirth`. Không đặt biến thì không gửi gì.
  Máy nhận: `STATS_TOKEN=<bí mật> npm run analytics` (`server/analytics.ts`, Node 24 thuần + SQLite có sẵn, mầm của server P2) — chạy trên VPS sau Caddy/nginx (đặt `TRUST_PROXY=1`), kiểm dữ liệu đầu vào, giới hạn 120 sự kiện/phút mỗi IP. Xem số ở `/stats?token=<bí mật>`: D1/D7 theo cohort ngày cài (chỉ tính ngày đã trọn), phân bố cảnh giới cao nhất, tỉ lệ độ kiếp thành công, số lần luân hồi.
- **Font:** giấy phép OFL nằm cạnh font trong `client/public/fonts/`.

**Kiểm thử trước khi phát hành:** `npm test` (luật, server analytics, và `client/render.test.ts`: vẽ mọi màn hình × 6 trạng thái game × 2 ngôn ngữ bằng SSR của Svelte qua Vite — bắt lỗi vỡ lúc vẽ và chữ hỏng `NaN`/`undefined` mà không cần trình duyệt), `npm run check` (kiểu), `npm run sim` (nhịp — báo lỗi nếu bot không tới tầng 15 trong 30 ngày), rồi chơi thử bản build (`npm run build && npm run preview -w client`). CI (`.github/workflows/ci.yml`) chạy đủ 4 bước này ở mỗi lần push/PR. Bản dev có công cụ tua giờ trong console: `rok.warp(60)` (tua 60 phút), `rok.get()` / `rok.set(state)`.

**Việc còn lại để qua cổng P1:** thử trên điện thoại thật (Android tầm trung, iPhone Safari), thuê VPS chạy máy nhận analytics, đăng itch.io + nhóm Facebook/Discord, gom ≥ 300 người thử, đọc D1/D7 ở `/stats`.
6. Spike PixiJS 100×100 ô trên điện thoại thật.
