# 7. Tiến trình, nhiệm vụ, tân thủ, giữ chân & kiếm tiền — Rise of Kingdoms → Sơn Hà Tiên Tông

> Nghiên cứu ngày 24/09/2026. Phạm vi: hướng dẫn tân thủ, chọn nền văn minh, nhiệm vụ (chính, phụ, hằng ngày, thành tựu), móc giữ chân, nhịp tiến trình thực tế và kiếm tiền của RoK bản global hiện hành (nguồn 2025–2026; bài cũ hơn có ghi năm). Đối chiếu với `docs/PLAN.md` (mục 1, 2, 3, 5, 7), `docs/UX.md` (5.1, 5.2) và `packages/rules/data.ts` (`QUESTS` 71 nhiệm vụ, `DAILY` 4 việc, `WEEKLY` 5 việc, `EVENTS`, `WEEKEND`).
>
> **Ký hiệu độ tin cậy của số liệu RoK:** **[2 nguồn]** = ít nhất 2 nguồn khớp · **[1 nguồn]** · **[mâu thuẫn]** = nguồn lệch nhau, ghi cả hai · **[chưa xác minh]** = không đọc được nguồn để kiểm · **[trích tìm kiếm]** = chỉ thấy qua đoạn trích của máy tìm kiếm (trang gốc bị chặn). Số trong ngoặc vuông `[15]` trỏ tới danh sách nguồn ở mục 5. Số "tự tính" là mình suy ra từ quy tắc của nguồn, không phải số của nguồn.
>
> **Game mình:** ✅ có tương đương · 🟡 có một phần · ❌ chưa có · ⛔ nằm trong "Không làm" (PLAN mục 1) hoặc trái mục 7 (không P2W) — vẫn ghi cho đủ danh mục. **Ưu tiên:** P0 cốt lõi · P1 quan trọng · P2 thêm hương vị. **Công sức** (một người, đã quen codebase): S ≤ 2–3 ngày · M ~1–2 tuần · L > 2 tuần.
>
> **Đang làm ở phiên khác (working tree 24/09, chưa commit):** `BAG` (túi đồ: phù tăng tốc 5 phút–24 giờ, nang tài nguyên, phù buff, Hộ Sơn Phù khiên 8/24/72 giờ, Tâm Đắc Kinh Thư) và `FESTS` + `packages/rules/core/fest.ts` (trung tâm sự kiện: `thatNhat` 7 quà đăng nhập, `tanThu` 11 mục tiêu 7 ngày đầu, `tranhBa` kiểu Mightiest Governor thứ Hai→thứ Bảy, `sanYeu` Chủ nhật). Cột "Game mình" dưới đây tính cả phần này, ghi rõ "đang làm".
>
> **Giới hạn nguồn:** wiki Fandom (HTTP 402), rok.guide (503), allclash/appgamer/techgamesnews (403) và Reddit (bị chặn) không đọc trực tiếp được. Hạn mức tìm kiếm của phiên hết giữa chừng, phần sau đọc qua sitemap/URL đã biết. Vì vậy **cảm nhận người chơi lấy từ App Store, bài review và bài tổng hợp phàn nàn cộng đồng, không đọc thẳng Reddit**; kịch bản chi tiết từng bước của phần hướng dẫn RoK và danh sách loại thông báo đẩy **chưa xác minh**. Các file anh em: [4-lien-minh-xa-hoi.md](4-lien-minh-xa-hoi.md) (liên minh), [8-ui-ux.md](8-ui-ux.md) (thông báo, hướng dẫn tân thủ về mặt giao diện); file 1 (VIP, cửa hàng), 3 (Monument, khám phá), 5 (lịch sự kiện), 6 (KvK, Ark, Sunset Canyon) đi sâu cơ chế — file này nhìn chúng từ góc giữ chân và kiếm tiền.

---

## 1. Tóm tắt — RoK giữ chân người chơi thế nào

### 1.1 Các vòng lặp chồng lên nhau

| Nhịp | Cái kéo người chơi quay lại | Số liệu chính |
|---|---|---|
| **Vài giờ** | Hàng xây / nghiên cứu / luyện quân / chữa thương; nhà tài nguyên đầy; thanh điểm hành động (AP) đầy; lượt rương bạc miễn phí ở Tavern; Thương nhân bí ẩn có thể ghé thêm sau khi xây, luyện quân, đánh man di | Nhà tài nguyên trữ ~10 giờ sản lượng **[2 nguồn]** [82][83]; AP trần 1.000, ~1 AP/45 giây ≈ 12,5 giờ đầy **[1 nguồn]** [24] |
| **Ngày** (reset 00:00 UTC = 7:00 giờ VN) | Daily Objectives đủ 100 điểm → rương cuối 100 gem + chìa vàng; điểm VIP đăng nhập tăng dần, đứt chuỗi là về đầu; rương VIP hằng ngày; Thương nhân bí ẩn 00:00 UTC; rương ngày của Expedition theo số sao; báo vương quốc | 100 gem/ngày ≈ 3.000 gem/tháng (tự tính) [9][41]; VIP 40 → +20/ngày → trần 200 **[trích tìm kiếm]** [37][34] |
| **Tuần – 2 tuần** | Cửa hàng VIP reset tuần; Super Value Bundle reset Chủ nhật; Ark of Osiris ~2 tuần; Wheel of Fortune ~3 tuần; MGE, Lohar, Golden Kingdom, Ceroli… xoay vòng | [41][66][63][56][62] |
| **Tháng – mùa** | KvK ~3 tháng (cần TTC 17); More Than Gems 2 ngày, cách nhau vài tuần tới vài tháng; nội dung gắn tuổi vương quốc; **Monument** 21 chặng mục tiêu chung của cả vương quốc | [64][58][59][56][54][53] |
| **Năm** | Kỷ niệm: 7 ngày điểm danh (Sign-In Spoils), mời người cũ quay lại (Grand Reunion), bản tổng kết cá nhân (RoK Yearbook) | [51][52] |
| **Dài hạn** | Tòa thị chính (TTC): tổng **257 ngày** nếu không tăng tốc, riêng TTC 25 là 126 ngày; T5 cần Castle 25 (20.095 Books of Covenant) + Học viện 25 + nghiên cứu 65–100 ngày; thang VIP tới 19/SVIP; con số Power; sưu tập tướng | [15][71][72][33] |

### 1.2 Vì sao hiệu quả

1. **Nhiều đồng hồ độc lập, lệch pha nhau** (xây, nghiên cứu, luyện, chữa, AP, kho, rương miễn phí, thương nhân, sự kiện). Lúc nào cũng có "một thứ vừa xong", nên luôn có lý do mở game và luôn có cớ gửi thông báo.
2. **Thưởng ngày quy ra tiền premium đếm được.** Bỏ một ngày là mất 100 gem, mất vài trăm điểm VIP và mất cả chuỗi đăng nhập. Chi phí bỏ lỡ tăng dần theo độ dài chuỗi.
3. **Mở khoá dồn dập lúc đầu, giãn ra sau.** TTC 2 → 5 chỉ mất 2 giây, 5 phút, 20 phút, 1 giờ (tích luỹ 1 giờ 25 phút) [15]. Phiên đầu lên cấp liên tục, mỗi cấp mở 1–2 thứ mới nên không ngợp. Từ TTC 6 đồng hồ nhảy sang giờ rồi ngày, tạo lý do quay lại.
4. **Lịch sự kiện chồng lớp, gắn tuổi vương quốc.** Luôn có một sự kiện đang chạy và một sự kiện sắp tới để "tích" tăng tốc, AP, gem (MGE, More Than Gems, KvK cần chuẩn bị cả tháng).
5. **Liên minh là mỏ neo.** Giúp tăng tốc, quà khi người khác nạp, cửa hàng bằng điểm cống hiến, lãnh thổ, KvK/Ark. Bỏ game là bỏ đồng đội (chi tiết: [4-lien-minh-xa-hoi.md](4-lien-minh-xa-hoi.md)).
6. **Mọi hoạt động đều có "một lối ra gem".** Đánh man di, thi đố, đấu trường, Ark, KvK đều có thể ra gem. Còn gem đổ vào VIP (tăng vĩnh viễn) và sự kiện tiêu gem (tướng huyền thoại). Vòng này vừa giữ chân vừa là phễu tiền.

**Mặt trái:** thang VIP, sự kiện tiêu gem và gói tăng tốc tạo khoảng cách rất lớn giữa người nạp và người không nạp. Đây là lời chê nhiều nhất (mục 2G). KvK đòi nhiều thời gian nên người chơi hay kiệt sức và nghỉ một thời gian sau mỗi mùa.

### 1.3 Game mình đang ở đâu

- **Đã có, tương đương hoặc tốt hơn RoK:** 71 nhiệm vụ chính tuyến tính theo trạng thái (xong trước vẫn được tính); mở khoá theo tầng Chủ điện với nhịp đầu giống RoK; khiên tân thủ 72 giờ; nhiệm vụ ngày (4 việc + rương, mở ở tầng 3) và **nhiệm vụ tuần** (5 việc + rương có Độ Kiếp Đan — RoK không có dạng này, RoK dùng sự kiện để giữ nhịp tuần); cuối tuần ×1,5; sự kiện tuần 6 chủ đề + 5 mốc + top 10; màn **Xuất quan** tổng kết lúc vắng (không thấy tương đương trong các nguồn RoK); Web Push hỏi đúng lúc; mùa 49 ngày thay KvK; xếp hạng; thư có quà.
- **Đang làm (phiên khác):** 7 ngày đăng nhập (`thatNhat`), chuỗi mục tiêu tân thủ 7 ngày (`tanThu`), sự kiện kiểu MGE (`tranhBa`), Săn Yêu Chủ nhật (`sanYeu`), túi đồ tăng tốc/khiên/buff (`BAG`).
- **Thiếu:** chuỗi đăng nhập *dài hạn* (sau 7 ngày không còn gì); nhiệm vụ ngày dạng điểm hoạt động có nhiều nấc và thưởng hiếm; vòng "rương miễn phí/thu nhận" lặp lại; thu nhập ngày theo tiến độ PvE (kiểu Expedition); thành tựu có thưởng; nhiệm vụ phụ; thương nhân xoay vòng; mục tiêu chung của giới (Monument); chọn xuất thân (nền văn minh); nhân vật dẫn đường + trận mở màn; mã quà; và toàn bộ phễu kiếm tiền (dự kiến P4).

### 1.4 Năm khoảng cách lớn nhất (chi tiết ở mục 4)

1. **Chuỗi đăng nhập dài hạn + nhật khóa kiểu điểm hoạt động** (C3, B3). RoK dùng VIP 40→200 cộng Daily Objectives 100 điểm. Mình mới có 4 việc cố định và 7 quà đăng nhập tân thủ. **P0/P1 · S.**
2. **Vòng "rương miễn phí / thu nhận" lặp lại + thu nhập ngày theo tiến độ PvE** (C1, C7), bản không gacha. Trưởng lão hiện chỉ đến từ lần đầu hạ cửa ải. **P1 · M/S.**
3. **Thành tựu có thưởng + nhiệm vụ phụ** (B4, B2). Đây là lớp sưu tập dài hạn, và nhắm đúng rủi ro PLAN mục 13: người chơi không nâng công pháp và công trình tài nguyên. **P1 · M.**
4. **Mục tiêu chung của giới + lịch sự kiện theo ngày của mùa** (B6, B7, D10). Pha mùa hiện mở theo giờ, chưa theo công sức chung. **P1 · M.**
5. **Phễu kiếm tiền không P2W** (F3, F4, F5, F12) và **đường miễn phí tới tạp dịch thứ hai** (A9). Món "thêm 1 hàng đợi" mà PLAN định bán là mạnh nhất (sim: Chủ điện 15 từ ngày 19 xuống 14 với người chơi thường). **P1 (khi tới P4) · M.**

---

## 2. Danh mục đầy đủ

### A. Hướng dẫn tân thủ & mở khoá dần

#### A1 · Civilizations — chọn nền văn minh lúc vào game

- **RoK:**
  - *Mở khoá, nhịp:* chọn ngay ở màn đầu, trước phần hướng dẫn. Hiện có **15 nền văn minh** **[2 nguồn]** [1][3] (bài 02/2025 liệt kê 14 [2], bài cũ 11 [4]). Mỗi nền có 3 buff nhỏ, 1 tướng khởi đầu hạng Sử thi, 1 binh chủng đặc biệt và kiến trúc thành riêng.

    | Nền văn minh | Tướng khởi đầu | Binh chủng đặc biệt | Buff |
    |---|---|---|---|
    | Trung Hoa | Sun Tzu | Chu-Ko-Nu (cung) | +5% tốc độ xây · +5% hồi AP · +3% thủ toàn quân |
    | Đức | Hermann | Teutonic Knight (kỵ) | +5% công kỵ · +5% tốc độ luyện quân · +10% hồi AP |
    | Anh | Boudica | Longbowman (cung) | +5% công cung · +5% tốc độ luyện quân · +20% sức chứa đồn trú đồng minh |
    | Pháp | Joan of Arc | Throwing Axeman (bộ) | +3% máu toàn quân · +20% tốc độ chữa · +10% thu gỗ |
    | La Mã | Scipio Africanus | Legionary (bộ) | +5% thủ bộ · +5% tốc độ hành quân · +10% thu lương |
    | Tây Ban Nha | Pelagius | Conquistador (kỵ) | +5% thủ kỵ · +10% EXP từ man di · +20% sản lượng trong thành |
    | Nhật | Kusunoki Masashige | Samurai (bộ) | +3% công toàn quân · +30% tốc độ trinh sát · +5% tốc độ thu thập |
    | Triều Tiên | Eulji Mundeok | Hwarang (cung) | +5% thủ cung · +15% sức chứa bệnh viện · +3% tốc độ nghiên cứu |
    | Ả Rập | Baibars | Mamluk (kỵ) | +5% công kỵ · +5% sát thương tập kết · +10% sát thương lên man di |
    | Ottoman | Osman I | Janissary (cung) | +5% máu cung · +5% tốc độ hành quân · +5% sát thương kỹ năng chủ động |
    | Byzantium | Belisarius | Cataphract (kỵ) | +5% máu kỵ · +10% thu đá · +15% sức chứa bệnh viện |
    | Viking | Björn Ironside | Berserker (bộ) | +5% công bộ · +3% sát thương phản kích · +10% sức mang |
    | Ai Cập | Imhotep | Maryannu | +5% công cung · +5% sát thương tập kết · +1,5% tốc độ xây/nghiên cứu |
    | Hy Lạp | Pericles | Argyraspide (bộ) | +5% máu bộ · +5% sát thương tập kết · +10% thu đá |
    | Maya | Wak Chanil Ajaw | Spear-Thrower | +5% thủ cung · +3% sát thương đòn thường · +10% thu vàng |

    Buff khớp giữa [1][2][3]; tướng khởi đầu khớp giữa [1][3][4].
  - *Người chơi thấy/bấm:* màn chọn cho xem kiến trúc, binh chủng, tướng và buff, rồi xác nhận. Sau đó game mới vào phần hướng dẫn [7].
  - *Vì sao hiệu quả:* quyết định đầu tiên tạo cảm giác "tông môn của tôi". Buff nhỏ nên chọn sai không bị phạt nặng. Cộng đồng biến việc chọn thành chủ đề bàn luận: đầu game chọn Trung Hoa vì +5% tốc độ xây, về sau đổi sang Đức hoặc Pháp [1]; có bài khuyên Anh hoặc Ai Cập cho người mới [5].
- **Tu tiên hoá:** **"Đạo thống"** (xuất thân tông môn), 4–5 lựa chọn. Ví dụ Kiếm Tông (kiếm tu), Đan Đỉnh Phái (đan dược, chữa thương), Thể Tu Môn (thể tu), Trận Pháp Các (xây dựng, sức chứa), Linh Thực Viên (sản lượng). Mỗi đạo thống có 3 buff 3–5% (một kinh tế, một quân sự, một tiện ích), một trưởng lão khởi đầu riêng (thay cho Thanh Phong cố định) và màu mái/huy hiệu riêng. Buff chia đều theo hệ khắc, không có đạo thống "đúng".
- **Game mình:** ✅ Đạo thống (`DAOS` ở `data.ts`, `DaoChoose.svelte` trong `Title.svelte`): chọn một trong 9 đạo ngay lúc lập tông môn, mỗi đạo 3 tiềm năng, đệ tử đặc trưng (`DAO_UNITS`), tượng đài và huy hiệu riêng. Trưởng lão khởi đầu vẫn chung (`FIRST_ELDER = 'thanhPhong'`).
- **Ưu tiên:** P1 · **Công sức:** M (luật: bonus + trưởng lão khởi đầu + chạy sim; màn chọn; art huy hiệu/mái).

#### A2 · Civilization Change — đổi nền văn minh

- **RoK:**
  - Lên TTC 10 được thưởng một vật phẩm đổi nền văn minh miễn phí **[2 nguồn]** [1][16].
  - Đổi các lần sau tốn 10.000 gem, hoặc 2.000.000 điểm cá nhân (Individual Credits) ở cửa hàng liên minh **[2 nguồn]** [1][5].
  - Hồi 10 ngày giữa hai lần đổi **[trích tìm kiếm, 1 nguồn]** [6].
  - Tướng và tiến độ giữ nguyên; binh chủng đặc biệt tự đổi; kiến trúc đổi theo [1][4].
  - *Người chơi bấm:* avatar → biểu tượng đổi cạnh tên nền văn minh → chọn → xác nhận [4].
- **Vì sao hiệu quả:** cho phép tối ưu theo từng giai đoạn, nên có lý do nghiên cứu và bàn luận. Đồng thời là một phễu gem nhẹ.
- **Tu tiên hoá:** "Cải tu đạo thống". Miễn phí một lần khi độ kiếp Kim Đan (tầng 10 → 11) và mỗi lần luân hồi. Về sau đổi bằng điểm cống hiến tiên minh, không bán bằng tiền.
- **Game mình:** ✅ Cải tu ở bảng Chủ điện (`DaoPick.svelte`, cùng màn chọn lúc lập tông môn): miễn phí, đổi lại sau 7 ngày (`DAO_COOL`); tượng đài đạo thống đổi theo.
- **Ưu tiên:** P2 · **Công sức:** S.

#### A3 · Counselor & hướng dẫn có dàn dựng

- **RoK:**
  - Sau màn chọn nền văn minh, nhân vật **Counselor** (cố vấn) dẫn qua phần hướng dẫn cơ bản **[1 nguồn]** [7]. Hướng dẫn này bị chê là chỉ dạy phần nền, chưa cho thấy hết độ sâu [7].
  - Nhiệm vụ chính bắt đầu ngay trong phần hướng dẫn **[trích tìm kiếm]** [10].
  - Kịch bản trận mở màn, thứ tự dạy từng hệ thống và giao diện ngón tay chỉ: **[chưa xác minh]** (file 8, mục F1–F2 cũng ghi chưa xác minh).
- **Vì sao hiệu quả:** một giọng nói có nhân cách thay cho bảng chữ; mỗi lúc chỉ một việc.
- **Tu tiên hoá:** **Thanh Phong làm "trưởng lão dẫn đường"**. Lore sẵn có: người duy nhất ở lại khi tông môn sụp đổ. Ông nói 1–2 câu trên bong bóng giấy ở 5–6 mốc (lập tông, trận đầu, thương binh đầu, mở bản đồ, độ kiếp đầu, mở tiên minh), không chặn thao tác, có nút "Bỏ qua". Thêm một **trận mở màn giữ núi** theo kịch bản không thể thua (xem mục 3.1).
- **Game mình:** 🟡. Có trưởng lão dẫn đường (`Advisor.svelte`: Mộc Thanh Phong giới thiệu tính năng vừa mở, nút "Đi tới"), màn Mở khoá (`Unlocks.svelte`), mũi tên vàng chỉ nút chính lần đầu mở bảng (`ui/FirstTap.svelte`), nút "?" mở Cẩm nang (`Help.svelte`), cùng chuỗi nhiệm vụ sẵn có. Chưa có trận mở màn; lời dẫn chưa gắn các mốc trận đầu, thương binh đầu, độ kiếp đầu.
- **Ưu tiên:** P1 · **Công sức:** S (thoại) / M (trận mở màn).

#### A4 · City Hall gating — mở khoá dần theo Tòa thị chính

- **RoK:** thời gian nâng cấp gốc (chưa tính tăng tốc, buff) **[2 nguồn cho các mốc chính]** [15][17][16]. Mỗi cấp còn phải nâng Tường và một công trình khác lên cùng mức.

  | TTC | Thời gian nâng (tích luỹ) | Mở ra |
  |---|---|---|
  | 2 | 2 giây | Xưởng gỗ, Trường bắn, Trại trinh sát |
  | 3 | 5 phút | Nông trại, Trung tâm liên minh |
  | 4 | 20 phút (25 phút) | Mỏ đá, Học viện, Chuồng ngựa, Bệnh viện |
  | 5 | 1 giờ (1 giờ 25 phút) | Cửa hàng, Xưởng công thành, **đạo quân thứ 2** |
  | 6 | 2 giờ | Courier Station (Thương nhân bí ẩn) |
  | 7 | 5 giờ (8 giờ 25 phút) | Castle |
  | 8 | 10 giờ | Monument, **lính T2** |
  | 10 | 1 ngày (2 ngày 9 giờ) | Mỏ vàng, Trạm giao thương; quà đổi nền văn minh |
  | 11 | 1 ngày 6 giờ | **đạo quân thứ 3** |
  | 16 | 4 ngày (16 ngày 19 giờ) | **lính T3** |
  | 17 | 4 ngày 20 giờ (21,6 ngày) | **đạo quân thứ 4**; đủ điều kiện phần lớn KvK |
  | 21 | 11 ngày (53,7 ngày) | **lính T4** (còn cần Học viện 21 và nghiên cứu [73]) |
  | 22 | 17 ngày 3 giờ (70,9 ngày) | **đạo quân thứ 5** |
  | 24 | 36 ngày (130,9 ngày) | — |
  | 25 | 126 ngày 8 giờ (**257 ngày**) | **T5** (cần thêm Master's Blueprint: 2.000 gem [17] hay 2.500 gem [16] — **[mâu thuẫn]**) |

  - Mốc T2/T3/T4/T5 ở TTC 8/16/21/25 **[2 nguồn]** [15][16]. Một bài ghi T4 ở TTC 22 [80], lệch với hai nguồn còn lại. Các đạo quân mở ở TTC 5/11/17/22 **[2 nguồn]** [15][19].
  - Chạm TTC mốc không tự có lính tier mới; vẫn phải đủ cấp Học viện và nghiên cứu quân sự [18].
- **Vì sao hiệu quả:** 4 cấp đầu gói trong ~25 phút, nên phiên đầu lên cấp liên tục. Từ TTC 6 đồng hồ nhảy sang giờ rồi ngày, tạo lý do quay lại. Mỗi cấp mở ít thứ nên không ngợp. Các mốc lớn (tier lính, số đạo quân) là mục tiêu dài hạn.
- **Tu tiên hoá:** đã có: Chủ điện = cảnh giới, độ kiếp ở tầng 5/10/15/20.
- **Game mình:** ✅ (bảng mở khoá UX mục 4).
  - Thời gian Chủ điện theo công thức `60 s × 1,7^(n−1)` (từ tầng 16 thì ×1,05 mỗi tầng), cộng dồn từ tầng 1 (tự tính): tầng 5 ≈ 18 phút · tầng 7 ≈ 56 phút · tầng 10 ≈ 4,8 giờ · tầng 15 ≈ 2,8 ngày · tầng 16 ≈ 4,1 ngày · tầng 25 ≈ 18,3 ngày. Chưa tính tài nguyên, công trình yêu cầu, tăng tốc.
  - Nhịp đầu tương đương RoK. Nhịp cuối nén khoảng 14 lần để vừa mùa 49 ngày, đúng chủ ý.
- **Ưu tiên:** P0 (đã có) · **Công sức:** —.

#### A5 · City Hall upgrade rewards — quà mỗi lần lên cấp TTC

- **RoK:** mỗi cấp TTC tặng một gói nhỏ **[1 nguồn]** [16]:
  - TTC 2–4: 10–30 nghìn lương/gỗ + 1–3 tăng tốc 5 phút.
  - TTC 5–8: tài nguyên + tăng tốc 30 phút / 2 giờ.
  - TTC 9: 1 tăng tốc 24 giờ.
  - TTC 10: vật phẩm đổi nền văn minh.
  - TTC 11–24: 11–24 tăng tốc 10 phút.
  - Mốc lớn: TTC 16 (tăng tốc 7 ngày + 100 gem), TTC 21 (tăng tốc 7 ngày + 200 gem), TTC 25 (500 gem).
- **Vì sao hiệu quả:** mốc nào cũng có "hộp quà" thấy được. Tăng tốc lớn ở mốc lớn giúp vượt qua đồng hồ dài phía sau.
- **Tu tiên hoá:** "Đột phá chi lễ": quà theo tầng Chủ điện, bay ra lúc cột sáng đột phá.
- **Game mình:** ✅. `QUESTS` có mốc Chủ điện 2, 3, 4, 5, 6, 8, 10, 11, 15–25, thưởng tài nguyên kèm đan (Tụ Khí, Độ Kiếp, Đại Tụ Khí, Phá Cảnh, Ngưng Thần). `tanThu` (đang làm) thêm quà ở tầng 2/4/6/8.
- **Ưu tiên:** P2 · **Công sức:** S (nếu muốn tách thành quà "đột phá" riêng có hiệu ứng).

#### A6 · Ages — thời đại & diện mạo thành

- **RoK:** thành đổi diện mạo theo "thời đại". Monument dùng các mốc Bronze, Iron, Dark, Feudal Age làm mục tiêu chung [53]; TTC 25 là đỉnh của Feudal Age [17]. Cấp TTC chính xác của từng thời đại: **[chưa xác minh]**.
- **Vì sao hiệu quả:** tiến bộ nhìn thấy được, không chỉ là con số. Người khác nhìn thành cũng biết bạn ở đâu.
- **Tu tiên hoá:** đã có: cảnh giới Luyện Khí / Trúc Cơ / Kim Đan / Nguyên Anh / Hóa Thần, mái công trình đổi theo tầng.
- **Game mình:** ✅ mỗi công trình đủ 5 bậc hình theo tầng 1–5, 6–10, 11–15, 16–20, 21–25 (`tierOf` ở `packages/art/buildings.ts`, tranh vẽ `bld-<công trình>-1…5`).
- **Ưu tiên:** P2 · **Công sức:** M (art).

#### A7 · Beginner Teleport & nhập cư tân thủ

- **RoK:**
  - Tài khoản mới có một lần dịch chuyển tân thủ, dùng được khi TTC dưới 8 **[2 nguồn]** [20][21]. Hết hạn sau 10 ngày **[2 nguồn]** [21][7].
  - Điều kiện dùng: không trong trận, chưa vào liên minh, quân đã về hết [20].
  - Sau khi vào liên minh, dùng Territorial Teleport để về lãnh thổ minh [20].
  - Beginner's Immigration (người mới chuyển sang vương quốc cũ) bị tạm dừng từ 26/03/2025 **[1 nguồn]** [14]. Người mới vì thế vào vương quốc mới.
  - Di cư về sau cần TTC ≥ 16 và giới hạn chênh lệch tuổi nhân vật (khoảng 80 ngày với mùa 2, 120 ngày với mùa 3) [22].
- **Vì sao hiệu quả:** người mới chọn được chỗ gần bạn bè hoặc liên minh, nên gắn kết xã hội từ sớm.
- **Tu tiên hoá:** "Phi độ tân thủ": lần đầu vào giới được chọn vùng theo mã mời của đạo hữu hoặc tiên minh.
- **Game mình:** 🟡. Server tự xếp chỗ, người mới vào mùa tới ngày 21 (`JOIN_DAYS`); dời núi tân thủ (`newbieMove` ở `world/territory.ts`): trước Chủ điện tầng 8, lần dời đầu tới được mọi ô trống vùng ngoài, sau đó dời được vào lãnh thổ minh. Chưa có chọn chỗ theo bạn bè / mã mời.
- **Ưu tiên:** P2 · **Công sức:** S–M.

#### A8 · Beginner protection — khiên tân thủ

- **RoK:**
  - Có khiên ban đầu, nhưng hết khá nhanh [81]. Khiên thay thế là vật phẩm 8 giờ / 24 giờ [84].
  - Thời lượng chính xác và điều kiện mất khiên tân thủ: **[chưa xác minh]**. File 8 (F4) ghi thêm "sương mù bảo vệ người mới".
- **Game mình:** ✅.
  - `NEWBIE_SHIELD` 72 giờ; đi cướp thì mất khiên; thủ thua được khiên 8 giờ.
  - PvP chỉ từ tầng 6, không đánh được người dưới 50% lực chiến của mình.
  - `BAG` (đang làm) có Hộ Sơn Phù 8/24/72 giờ.
  - Lưu ý: nếu sau này bán khiên thì đó là lợi thế PvP mua được, trái PLAN mục 7.
- **Ưu tiên:** P0 (đã có) · **Công sức:** —.

#### A9 · Builder queue — hàng xây thứ hai

- **RoK:**
  - Mặc định 1 thợ. Vật phẩm Builder Recruitment thuê thợ thứ hai trong 2 ngày **[trích tìm kiếm]** [38][13].
  - **VIP 6 mở thợ thứ hai vĩnh viễn** **[≥ 4 nguồn]** [13][14][32][36]. Từ đó vật phẩm thuê thợ tự đổi thành tăng tốc xây 60 phút [38].
  - VIP 6 cần 11.500 điểm VIP [33][34]. Người không nạp (tự tính):
    - chỉ bằng điểm đăng nhập 40 → 200/ngày: ≈ 62 ngày;
    - cộng 100 gem/ngày của Daily Objectives đổi 1:1 ra điểm VIP: ≈ 41 ngày (chưa tính gem sự kiện).
  - Mọi hướng dẫn tiêu gem đều xếp VIP 6 lên đầu [57][69].
- **Vì sao hiệu quả:** hai việc song song là tiện lợi cảm nhận được ngay. Đây là mục tiêu tiêu gem đầu tiên của gần như mọi người, nên kéo người chơi vào thang VIP.
- **Tu tiên hoá:** "Tạp dịch thứ hai".
  - Thuê 2 ngày bằng "Thiếp thuê tạp dịch" (thưởng nhiệm vụ, sự kiện tuần).
  - Mở vĩnh viễn bằng **Công đức** (điểm danh tích luỹ, xem C3) ở mức khoảng 30–40 ngày điểm danh, không bán thẳng.
  - Nếu vẫn muốn bán (PLAN mục 7 "tiện lợi có trần"), cho phép mua *sớm hơn* thứ vẫn kiếm được bằng chơi.
- **Game mình:** ✅ Tạp Dịch Lệnh (`tapDich48`, `queueSize` ở `sect/buildings.ts`): thuê tạp dịch thứ hai 48 giờ, dùng thêm thì kéo dài; chỉ kiếm bằng chơi (Tông Lệnh Bảo Khố, Hương Hỏa Các cấp 7, Thiên Môn Thương Điếm, kho lễ Côn Lôn, mốc Công Huân 6.000). Chưa có bản vĩnh viễn (`QUEUE_SIZE = 1`).
- **Ưu tiên:** P1 · **Công sức:** S (vật phẩm thuê 2 ngày) / M (Công đức).

#### A10 · Vào liên minh sớm

- **RoK:**
  - Mọi hướng dẫn đặt "vào liên minh ngay" lên hàng đầu [13][14]. Trung tâm liên minh mở ở TTC 3 [7][15].
  - Lợi ích:
    - giúp giảm thời gian, mỗi lượt ~1%, số lượt theo cấp Trung tâm liên minh [41][47];
    - công nghệ liên minh, lãnh thổ;
    - quà khi thành viên mua gói hoặc diệt pháo đài man di [47];
    - cửa hàng bằng Individual Credits kiếm từ giúp đỡ và đóng góp [47].
  - Lập liên minh tốn 500 gem **[1 nguồn]** [47]. Thưởng lần đầu vào liên minh: **[chưa xác minh]**.
- **Tu tiên hoá:** nhiệm vụ chính tuyến "Bái nhập tiên minh" có quà; gợi ý 3 tiên minh đang hoạt động gần mình (chi tiết: file 4).
- **Game mình:** ✅ Lễ nhập minh (`welcome` ở `world/base.ts`): lần đầu lập / vào một tiên minh nhận thư quà `ALLY_WELCOME`; trưởng lão dẫn đường giới thiệu Tiên minh khi tab mở. Chưa có nhiệm vụ chính tuyến về tiên minh, danh sách minh xếp theo lực chiến (chưa gợi ý minh gần mình).
- **Ưu tiên:** P1 · **Công sức:** S.

#### A11 · Exploration — trinh sát sương mù, làng bộ lạc, hang bí ẩn

- **RoK:**
  - Bản đồ phủ sương. Gửi tới 3 trinh sát đi mở sương; trinh sát không bị tấn công [23].
  - Tribal Village: mỗi làng thưởng một lần (tài nguyên, tăng tốc, lính T1, công nghệ kinh tế cấp thấp). Mysterious Cave: 3 độ khó, ra gem và tăng tốc [23].
  - Vật phẩm Kingdom Map mở một vùng 10×10 ô [23].
  - Monument có chặng "cả vương quốc mở 30 triệu ô sương" [53]. Nhánh thành tựu Adventurer theo dõi việc thám hiểm [11].
- **Vì sao hiệu quả:** việc không tốn gì, hợp với phiên đầu và lúc ngồi chờ. Tò mò kèm thưởng ngẫu nhiên.
- **Tu tiên hoá:** "Thần thức dò xét": thả linh điểu mở mây trên bản đồ giới, gặp các điểm thưởng một lần:
  - "Động phủ cổ": đan, tàn quyển;
  - "Tán tu ẩn cư": tặng một lời chỉ điểm hoặc vật phẩm;
  - "Linh tuyền": tài nguyên.
- **Game mình:** ✅ Khám phá mê vụ (`core/fog.ts`, `world/explore.ts`): mỗi tông môn một bản đồ sương riêng trên bản đồ giới, thả linh điểu (1–3 con theo tầng Chủ điện) tan sương; thôn trang / động phủ cổ tu (`sitesOf` ở `atlas.ts`) lộ ra thì ghé một lần nhận quà; Sơn Hà Đồ tan ngay 12 ô. Bản đồ vùng PvE vẫn hiện sẵn.
- **Ưu tiên:** P2 · **Công sức:** M (chi tiết: file 3).

#### A12 · Barbarians + Action Points — PvE lặp lại & năng lượng

- **RoK:**
  - Đánh man di tốn AP: 50 AP một lần; đánh liên tiếp thì giảm 2 AP mỗi lần, tối đa −10; tướng nhánh peacekeeping giảm thêm [24][60].
  - AP trần 1.000, hồi ~1 AP/45 giây **[1 nguồn]** [24].
  - Nguồn AP: vật phẩm 50/100/500/1.000; cửa hàng VIP tối đa 30 × 100 AP/tuần; rương pháo đài; Shrine of Radiance +20% hồi AP; rune +15% [24][25].
  - Man di cho tài nguyên, EXP tướng, và gem ở cấp cao. Đánh man di cũng là một việc trong Daily Objectives [8].
- **Vì sao hiệu quả:** AP đầy sau nửa ngày, nên người chơi tự vào 2 lần/ngày. AP dư đổ vào sự kiện (Lohar, MGE).
- **Tu tiên hoá:** không cần AP ("năng lượng" dễ gây ức chế). Giới hạn hiện có là thương binh + thời gian hồi của hang.
- **Game mình:** ✅. 15 cấp yêu thú (hạ cấp n mở cấp n+1, hang hồi sau 45 phút), 5 tông môn NPC (hồi 8 giờ), bí cảnh, tháp; riêng yêu thú giới trên bản đồ giới thì mỗi lần săn tốn 10 hành lực (tối đa 100, hồi 1 mỗi 3 phút — `AP_HUNT`).
- **Ưu tiên:** P2 (giữ nguyên) · **Công sức:** —.

### B. Nhiệm vụ

#### B1 · Main Quests — nhiệm vụ chính

- **RoK:**
  - Bắt đầu ngay trong phần hướng dẫn. Mỗi lúc chỉ hiện một nhiệm vụ, nhưng các nhiệm vụ sau vẫn được đếm ngầm và xong trước khi hiện cũng tính. Thưởng lớn dần **[trích tìm kiếm]** [10].
  - Mở từ biểu tượng cuộn giấy [7].
- **Vì sao hiệu quả:** luôn có "việc tiếp theo". Đếm ngầm nên người chơi đi trước không bị phạt.
- **Game mình:** ✅.
  - 71 nhiệm vụ: 46 tới tầng 15, sau đó 25 nhiệm vụ Nguyên Anh / Hóa Thần. Tính theo trạng thái, thưởng được vượt sức chứa.
  - Có dấu tích son, thưởng bay vào ô, và chạy lại sau luân hồi.
  - Khác RoK: chưa có nhiệm vụ xã hội (tiên minh, chat), PvP, chợ.
- **Ưu tiên:** P0 (đã có) · **Công sức:** S (thêm 3–5 nhiệm vụ xã hội: vào tiên minh, giúp đỡ, hộ pháp độ kiếp, treo 1 lệnh chợ).

#### B2 · Side Quests — nhiệm vụ phụ

- **RoK:** nhiều dòng song song: nâng công trình, nghiên cứu, đánh man di, luyện quân. Mỗi dòng hiện một nhiệm vụ; nhận thưởng từng cái, không có nút "nhận tất" **[trích tìm kiếm]** [10].
- **Vì sao hiệu quả:** người chơi làm lệch khỏi chính tuyến vẫn luôn có thưởng, nên các công trình phụ được nuôi đều.
- **Tu tiên hoá:** "Tông vụ", 4 dòng:
  - Linh mạch: nâng công trình tài nguyên;
  - Truyền công: công pháp ở Tàng Kinh Các;
  - Hàng yêu: yêu thú, bí cảnh;
  - Luyện binh: tuyển, chữa đệ tử.
- **Game mình:** ✅ Tông vụ (`sect/side.ts`, trong bảng Nhiệm vụ ngày dưới Nhật Khóa): 4 dòng song song — Linh mạch (ba công trình tài nguyên lần lượt lên tầng), Truyền công (tổng tầng công pháp), Hàng yêu (thắng trận), Luyện binh (tuyển đệ tử); mỗi dòng hiện một việc, nhận từng việc, quà là phù tăng tốc và kinh thư — nhắm đúng rủi ro PLAN mục 13.
- **Ưu tiên:** P1 · **Công sức:** S–M.

#### B3 · Daily Objectives — mục tiêu hằng ngày (điểm hoạt động)

- **RoK:**
  - *Cơ chế:*
    - Mỗi ngày bốc ngẫu nhiên một danh sách việc; mỗi việc cho tài nguyên + điểm hoạt động.
    - **5 rương ở 20 / 40 / 60 / 80 / 100 điểm.** Không cần làm hết, chỉ cần đủ 100 điểm.
    - Rương 1, 2, 4: tài nguyên + tăng tốc. Rương 3: chìa bạc, AP, 20 sách EXP cấp 1. **Rương 5: 100 gem + 1 chìa vàng + Magic Box + 2 vật phẩm tướng Sử thi** **[trích tìm kiếm; 100 gem khớp 3 nguồn]** [9][41][81].
    - Reset 00:00 UTC [9].
  - *Ví dụ việc và điểm* (bản TTC 8; TTC cao có thể thêm việc) [8]:
    - giúp đồng minh: 5; trao đổi tài nguyên (Friendly Commerce): 10;
    - đánh 1 man di: 2, đánh 3 man di: 8; chữa thương: 2;
    - thu thập lương/gỗ/đá: 5 mỗi loại; tăng sản lượng lương/gỗ/đá: 5 mỗi loại;
    - xây/nâng: 10; nghiên cứu: 10;
    - luyện bộ/cung/kỵ/công thành: 5 mỗi loại; dùng tăng thu thập: 5; …
  - *Người chơi thấy/bấm:* tab Daily Objectives trong màn nhiệm vụ: thanh điểm với 5 rương, danh sách việc [7][8]. Nút "Đi tới" từng việc: **[chưa xác minh]**.
- **Vì sao hiệu quả:**
  - 100 gem/ngày là thứ đếm được (~3.000 gem/tháng, tự tính).
  - Thừa điểm nên người chơi chọn được việc hợp kiểu chơi của mình.
  - Chìa vàng trong rương cuối nối sang vòng Tavern (C1).
- **Tu tiên hoá:** **"Nhật khóa tu hành"**:
  - Mỗi ngày bốc 8 việc từ một kho 12–15 việc mở theo tầng. Có việc xã hội (giúp tiên minh, hộ pháp), PvP, chợ, mỏ.
  - Mỗi việc 10–20 "tu vi điểm". 5 hộp ở 20/40/60/80/100.
  - Hộp 100: một lượng Tiên ngọc nhỏ (khi có tiền tệ này) + "Tiên duyên phù" (C1) + đan.
  - Cho đổi 1 việc mỗi ngày.
- **Game mình:** ✅ Nhật Khóa (fest kiểu `activity` `nhatKhoa` ở `data.ts`, đầu bảng Nhiệm vụ ngày): 12 việc (có giúp đồng minh, cướp, khai mỏ, mở thiếp), mỗi việc 10–20 điểm hoạt lực, tổng dư quá 100 nên được chọn việc; 5 rương ở 20/40/60/80/100 (rương cuối có Kim Duyên Phù + Luận Kiếm Lệnh), mở ở tầng 3, làm mới 0h giờ VN. Danh sách việc cố định, chưa bốc ngẫu nhiên / đổi việc.
- **Ưu tiên:** P1 · **Công sức:** S (khung đếm có sẵn trong `dailyDone`/`dailyReward`; `fest.ts` đang làm có sẵn `METRIC`).

#### B4 · Achievements — thành tựu

- **RoK:**
  - 4 nhánh **[trích tìm kiếm]** [11]:
    - **Engineer:** phát triển thành và liên minh (dùng tăng tốc, thu thập, kiếm điểm cá nhân, nâng nhà);
    - **Overlord:** tướng, quân, diệt man di / pháo đài / guardian;
    - **Vanquisher:** chiến đấu, **[chưa xác minh]** chi tiết;
    - **Adventurer:** thám hiểm, **[chưa xác minh]** chi tiết.
  - Mỗi thành tựu cho thưởng + huy hiệu + điểm thành tựu. Tích điểm mở rương có chìa, tượng, đồ đặc biệt [11].
  - *Người chơi bấm:* avatar → Achievements [11].
- **Vì sao hiệu quả:** lớp sưu tập dài hạn; ghi nhận nhiều kiểu chơi (xây, đánh, khám phá); khoe được trên hồ sơ.
- **Tu tiên hoá:** **"Công tích bảng"**, 4 nhánh:
  - Kiến tông: xây, sản xuất;
  - Chinh phạt: thắng trận, hạ yêu vương, cướp;
  - Truyền thừa: trưởng lão, công pháp, đan, pháp bảo;
  - Du lịch: bí cảnh, tháp, bản đồ giới.
  - Mỗi mốc một **ấn vẽ tay** (đã có hệ `Medal`) + điểm; điểm mở rương. Ấn hiện trên hồ sơ tông môn.
- **Game mình:** ✅ Thành tựu (`ACHS` ở `data.ts`, `sect/ach.ts`, Bảo khố › Thành tựu): 15 thành tựu × 5 bậc (Chủ điện, xây, công pháp, pháp bảo, trưởng lão, tuyển, chữa, luyện đan, thắng trận, săn yêu, bí cảnh, tháp, tăng tốc, cướp, khai mỏ), bậc nào cũng có quà, có "Nhận tất cả"; hồ sơ hiện tổng bậc đã nhận. Chưa có ấn vẽ tay, chưa có điểm thành tựu mở rương.
- **Ưu tiên:** P1 · **Công sức:** M (định nghĩa + giao diện + art ấn).

#### B5 · Crusader Achievements — thành tựu mùa KvK

- **RoK:** bộ thành tựu riêng khi ở Lost Kingdom (KvK), thưởng lớn: gói 500/1.000/2.000 gem, chìa vàng, chìa pha lê, tăng tốc 3 giờ, AP 1.000. Ví dụ: chiếm di tích 400 phút được 1 chìa vàng + 1 chìa pha lê **[trích tìm kiếm]** [12].
- **Tu tiên hoá:** "Chiến tích mùa": thành tựu gắn mùa 49 ngày (giữ linh mạch N giờ, hộ pháp độ kiếp cho đồng minh M lần, góp sức hạ yêu vương…). Thưởng cosmetic + tài nguyên, reset mỗi mùa.
- **Game mình:** ✅ Chinh Chiến Công Tích (`HONOR_TIERS` ở `data.ts`, `sect/honor.ts`): 6 mốc Công Huân trong mùa (50 → 6.000) nhận lần lượt; Công Huân kiếm từ chiến công, săn yêu thú giới, đánh yêu vương, khai mỏ, phá trận kỳ, giữ núi ma triều; hết mùa top 10 nhận quà thư rồi về 0.
- **Ưu tiên:** P2 · **Công sức:** S (làm sau B4).

#### B6 · Monument — mục tiêu chung của cả vương quốc

- **RoK:**
  - Công trình Monument mở ở TTC 8 [15].
  - 21 chặng nối tiếp, mỗi chặng một mục tiêu chung có đồng hồ 2–9 ngày **[1 nguồn]** [53]. Ví dụ theo thứ tự:
    - 20.000 người vào Bronze Age (3 ngày);
    - mở 30 triệu ô sương (3 ngày);
    - diệt 200.000 man di (2 ngày; mở pháo đài man di cấp 1);
    - 4.000 người vào Iron Age (4 ngày; mở Sanctum);
    - 30 liên minh đủ 65 người;
    - liên minh giữ Altar tới hết giờ (mở đèo cấp 1);
    - …
    - chặng cuối: giữ Lost Temple (9 ngày).
  - Thưởng cho mọi người: 200–2.000 gem, chìa vàng, tượng, tăng tốc.
- **Vì sao hiệu quả:** nội dung bản đồ mở theo tiến độ chung, nên cả server thấy mình "cùng lớn" và thúc nhau. Người chỉ cần có mặt cũng được gem.
- **Tu tiên hoá:** **"Thiên Đạo Bia" của giới**. Mỗi pha mùa mở khi giới đạt điều kiện chung (N tông môn độ kiếp Trúc Cơ, hạ M yêu vương, K tiên minh đủ 10 người…), *hoặc* khi hết thời gian tối đa, để giới vắng không bị kẹt. Thưởng chung gửi qua thư.
- **Game mình:** 🟡 Thiên Đạo Biên Niên (`BOOK` ở `data.ts`, `world/book.ts`): 13 chương mục tiêu chung của cả giới (số tông môn đạt tầng, minh đủ người, mê vụ, cổng, linh mạch, trận kỳ, yêu vương, chiến công, Tu Bổ Thiên Môn, Thiên Môn), mỗi chương có hạn theo ngày mùa, xong thì mọi tông môn nhận quà thư. Chương chưa mở nội dung: pha mùa vẫn mở cổng **theo thời gian** (`PHASES`), chưa theo tiến độ chung.
- **Ưu tiên:** P1 · **Công sức:** M (chi tiết: file 3).

#### B7 · Chuỗi sự kiện theo tuổi vương quốc (The Pioneer…)

- **RoK:**
  - Nội dung gắn tuổi vương quốc.
  - **The Pioneer / Road to Revival** dành cho vương quốc 20–23 ngày tuổi **[1 nguồn]** [54]:
    - kéo dài 4 ngày, cộng 5 ngày đổi quà;
    - việc ngày: mua 10/20 món ở Courier Station, thu 1,5 triệu lương / 1,5 triệu gỗ / 1 triệu đá / 4 triệu tổng, tiêu 500/1.500 AP;
    - ưu tiên đổi 4 chìa vàng;
    - sau đó còn nhiều sự kiện cùng khuôn theo chủ đề nền văn minh (Đức, Anh, Viking…).
  - Wheel of Fortune cũng xoay tướng theo lịch tuổi vương quốc, chu kỳ 56 ngày: Richard ở ngày 38, Yi Seong-gye ngày 94, Thành Cát Tư Hãn ngày 150 **[1 nguồn]** [56].
- **Vì sao hiệu quả:** người mới luôn vào vương quốc mới (A7), nên ai cũng đi qua cùng một lộ trình được tuyển chọn. Dễ cân bằng, dễ viết hướng dẫn cộng đồng.
- **Tu tiên hoá:** **"Lịch giới"**: sự kiện gắn ngày của mùa. Ví dụ: ngày 1–7 tân thủ; ngày 8–10 yêu triều; ngày 14 luận kiếm; ngày 21 đóng cửa nhận người mới kèm quà "khai sơn nguyên lão" cho người vào sớm; ngày 42–49 nước rút phi thăng.
- **Game mình:** 🟡.
  - Có: trung tâm sự kiện + lịch 7 ngày tới (`festCalendar`); nội dung theo ngày mùa nằm ngoài trung tâm sự kiện: Khai Giới Trảm Tà (pha Khai giới, `world/eve.ts`), Thiên Thời nhịp 4 ngày (`world/thoi.ts`), chặng Chính Tà 3 ngày (`world/camp.ts`), hạn các chương Thiên Đạo Biên Niên.
  - Thiếu: `FestWindow` mới có `newbie`, `week`, `cycle`, `dates` — chưa có kiểu "ngày thứ N của mùa", nên chưa có "Lịch giới" (quà vào sớm ngày 21, nước rút phi thăng…).
- **Ưu tiên:** P1 · **Công sức:** M.

### C. Móc giữ chân hằng ngày / hằng giờ

#### C1 · Tavern — rương bạc/vàng miễn phí, chìa khoá

- **RoK:**
  - Tavern gồm rương Bạc và rương Vàng; mở bằng chìa hoặc lượt miễn phí. Tavern không có trong bảng mở khoá TTC [15], nên suy ra là có từ đầu.
  - Rương bạc miễn phí mỗi ngày tăng theo cấp Tavern **[2 nguồn]** [26][28]:

    | Cấp Tavern | Rương bạc miễn phí/ngày |
    |---|---|
    | 1–4 | 3 |
    | 5–7 | 4 |
    | 8–10 | 5 |
    | 11–13 | 6 |
    | 14–16 | 7 |
    | 17–19 | 8 |
    | 21+ | 9–10 (gamesguideinfo ghi trần +10) |

  - Rương vàng miễn phí mỗi 2 ngày **[trích tìm kiếm]** [29]; thời gian chờ và giá giảm khi nâng Tavern [27].
  - Nội dung:
    - rương bạc: tướng Tinh anh / Cao cấp, tượng tướng, tượng Starlight, tài nguyên, tăng tốc, sách EXP;
    - rương vàng: thêm tướng Sử thi / Huyền thoại [27].
  - Mỗi rương vàng ra 4 món. Tỉ lệ hiển thị trong game, ví dụ tượng huyền thoại 3,023%. Mở lẻ hay mở 10 cho kết quả thống kê như nhau (thử 201 + 201 chìa) [31].
  - Có nút mở tất khi có từ 10 chìa [26].
- **Người chơi thấy/bấm:** chạm Tavern → hai rương, đồng hồ lượt miễn phí, nút mở 1 / mở 10 (bố cục cụ thể **[chưa xác minh]**).
- **Vì sao hiệu quả:** đồng hồ miễn phí tạo lý do ghé nhiều lần/ngày. Khả năng ra huyền thoại giữ hi vọng. Chìa vàng là "đồng tiền thưởng" chung của Daily Objectives, sự kiện, thành tựu, Monument.
- **Tu tiên hoá (không gacha):** **"Chiêu Hiền Đài"**.
  - Mỗi ngày 3–6 "thiếp mời" miễn phí, tăng theo tầng Chủ điện. Mở ra kinh nghiệm trưởng lão (Kinh Thư — đã có trong `BAG`), tàn quyển công pháp, đan nhỏ, phù tăng tốc.
  - "Tiên duyên phù" (thưởng hiếm từ Nhật khóa, thành tựu, sự kiện): tích đủ 10 phù thì **chắc chắn** được một tín vật trưởng lão. Tất định, có thanh tiến độ, không bán thiếp bằng tiền.
- **Game mình:** ✅ Chiêu Hiền Đài (`sect/tavern.ts`, trong Môn hạ, từ tầng 2): thiếp bạc miễn phí mỗi 6 giờ, thiếp vàng mỗi 48 giờ, thêm thiếp từ Nhật Khóa, thành tựu, sự kiện; tín vật thu nhận / nâng sao trưởng lão, cứ 10 lần mở thiếp vàng chắc đủ tín vật một trưởng lão (`GOLD_PITY`); không bán.
- **Ưu tiên:** P1 · **Công sức:** M.

#### C2 · Legendary Tavern — sự kiện quay có bảo hiểm

- **RoK:** sự kiện Tavern riêng. Cứ 10 lần mở chắc chắn ra 1 tướng huyền thoại hoặc tượng; cứ 200 lần mở được tự chọn thưởng 1 lần **[trích tìm kiếm]** [30]. Đốt chìa vàng tích luỹ.
- **Tu tiên hoá:** không làm riêng. Pity tất định đã nằm trong C1.
- **Game mình:** ⛔ (gacha).
- **Ưu tiên:** — · **Công sức:** —.

#### C3 · VIP daily login — chuỗi đăng nhập & rương VIP hằng ngày

- **RoK:**
  - Mỗi ngày bấm nhận rương điểm VIP: 40 điểm, mỗi ngày liên tiếp +20, trần 200/ngày. Bỏ một ngày là về lại 40 **[trích tìm kiếm + 1 nguồn]** [37][34].
  - Kèm rương VIP hằng ngày, nội dung theo cấp VIP. VIP 10 / 12 / 14 được 1 / 2 / 3 tượng huyền thoại vạn năng mỗi ngày **[2 nguồn]** [33][14]. Các nguồn **[mâu thuẫn]** về cách nhận: rương miễn phí hằng ngày [35][36] hay mua trong cửa hàng VIP [70].
- **Người chơi thấy/bấm:** biểu tượng VIP cạnh chân dung, có chấm đỏ khi chưa nhận (vị trí **[chưa xác minh]**).
- **Vì sao hiệu quả:** cái giá của bỏ lỡ tăng dần (mất cả chuỗi). Cấp VIP không bao giờ mất, nên mỗi ngày đăng nhập là một khoản "đầu tư" dài hạn.
- **Tu tiên hoá:** **"Công đức"**.
  - Điểm danh mỗi ngày, điểm tăng dần (ví dụ 10 → 50). Đứt chuỗi thì **lùi một bậc** thay vì về đầu, để không trừng phạt người bận.
  - Cấp Công đức vĩnh viễn, chỉ mở **tiện ích / cosmetic**, không mở sức mạnh:
    - tạp dịch thứ hai vĩnh viễn (A9);
    - thêm 1 lần đổi việc Nhật khóa;
    - khung chân dung, dấu chat;
    - thêm 1 lượt Chiêu Hiền Đài.
  - Không bán Công đức bằng tiền.
- **Game mình:** ✅ Hương Hỏa (`core/vip.ts`, `sect/vip.ts`): điểm theo chuỗi ngày vào game 40 → 200/ngày (đứt chuỗi thì về 40 như RoK), 12 cấp tăng ích nhỏ, lễ vật mỗi ngày, xong miễn phí việc còn 1–8 phút; không bán. Người mới thêm Thất Nhật Lễ 7 quà đăng nhập — quà ngày 7 là Như Yên (cũng là thưởng Thanh Mộc Bí Cảnh), ai đã có thì đổi thành 5.000 kinh nghiệm cho nàng (`ELDER_DUP_EXP` trong `grant()`).
- **Ưu tiên:** P0 · **Công sức:** S.

#### C4 · VIP Shop — cửa hàng VIP reset hằng tuần

- **RoK:**
  - Mở ở VIP 5 [36]; có bài ghi TTC 5 [35] — **[mâu thuẫn]**.
  - Giá giảm theo cấp VIP; reset hằng tuần [41][42].
  - Bán tăng tốc 8 giờ / 24 giờ, AP (tối đa 30 × 100 AP/tuần), tượng tướng, Books of Covenant (đắt) [24][41][71].
- **Tu tiên hoá:** gộp vào cửa hàng Công đức / cống hiến tiên minh.
- **Game mình:** ✅ Hương Hỏa Các trong bảng Hương Hỏa (`VIP_SHOP`, `vipBuy`): 16 món mở dần từ cấp 1 → 12, mua bằng tài nguyên × tầng Chủ điện (Hương Hỏa không bán tiền thật), hạn mức mỗi tuần, thứ Hai làm mới.
- **Ưu tiên:** P2 · **Công sức:** S.

#### C5 · Mysterious Merchant — Thương nhân bí ẩn (Courier Station)

- **RoK:**
  - Courier Station mở ở TTC 6 **[2 nguồn]** [40][15].
  - Thương nhân bí ẩn ghé lúc 00:00 UTC mỗi ngày. Ngoài ra có thể ghé thêm (không chắc) sau khi luyện quân, nâng nhà, đánh man di [39][40].
  - Mỗi lần bày 16 món, chia 4 nhóm: tài nguyên, tăng tốc, buff, vật phẩm tiến trình [40].
  - Giá: món trả bằng lương/gỗ giảm 10–40%; món trả bằng gem giảm 30–90% [40].
  - Làm mới: lần đầu miễn phí, sau đó 100 / 200 / 300 / 400 gem **[2 nguồn]** [39][40].
  - Lời khuyên F2P: chỉ mua tăng tốc bằng lương/gỗ [40].
- **Vì sao hiệu quả:** cảm giác "biết đâu hôm nay có món ngon". Tiêu được tài nguyên dư, bớt cảm giác kho lệch. Lần ghé thêm ngẫu nhiên thưởng người đang chơi tích cực.
- **Tu tiên hoá:** **"Vân Du Tán Tu"** bày sạp dưới chân núi.
  - 8–12 món mỗi 0h giờ VN; ghé thêm sau khi luyện đan hoặc độ kiếp.
  - Giá bằng tài nguyên: đổi loại đang dư lấy phù tăng tốc, đan, Kinh Thư.
  - 1 lần làm mới miễn phí; không bán bằng Tiên ngọc.
  - Hợp với vấn đề "kho hay lệch" mà `TRADE_KEEP` đang giải.
- **Game mình:** ✅ Thương nhân vân du (`sect/merchant.ts`, `Merchant.svelte`): ở Thương hội từ Tàng Bảo Các tầng 4, mỗi 8 giờ 6 món mới (tất định theo tông môn + lượt), giá bằng một loại tài nguyên × tầng Chủ điện, mỗi món mua một lần — chỗ tiêu tài nguyên dư.
- **Ưu tiên:** P2 · **Công sức:** S.

#### C6 · Resource cap — nhà tài nguyên đầy sau ~10 giờ

- **RoK:** nông trại, xưởng gỗ, mỏ trữ tối đa ~10 giờ sản lượng gốc. Khuyên thu ít nhất 2 lần/ngày **[2 nguồn]** [82][83].
- **Game mình:** ✅. Sức chứa Tàng Bảo Các "kéo người chơi quay lại" (PLAN mục 3); nhãn "Đầy"; màn Xuất quan báo đầy kho.
- **Ưu tiên:** P0 (đã có) · **Công sức:** —.

#### C7 · Expedition — chiến dịch PvE + rương ngày

- **RoK:**
  - Chuỗi màn PvE, mỗi màn 3 sao theo điều kiện [43][44].
  - Tiến độ reset 00:00 UTC; đánh lại màn đã qua để nhận **rương ngày theo số sao cao nhất** [44].
  - Kiếm Medals of the Conqueror, đổi ở cửa hàng có giới hạn mua mỗi ngày.
  - **Aethelflaed**, một tướng huyền thoại miễn phí, lấy chủ yếu qua cửa hàng này [43][44].
  - Mở ở cấp mấy: **[chưa xác minh]**.
- **Vì sao hiệu quả:** một "việc 2 phút" mỗi ngày cho thu nhập đều. Là con đường F2P chắc chắn tới một huyền thoại.
- **Tu tiên hoá:** **"Tĩnh tọa ngộ đạo"**.
  - Mỗi ngày nhận thưởng theo tầng Thông Thiên Tháp cao nhất và số bí cảnh đã qua. Không cần đánh lại (đánh tức thì là thói quen sẵn có).
  - "Tháp lệnh" tích dần để đổi thêm kinh nghiệm cho Mạc Sầu / Diệp Cô Thành.
- **Game mình:** ✅ Tĩnh tọa ngộ đạo (`towerChest` ở `data.ts`, `sect/expedition.ts`, trong bảng Thông Thiên Tháp): mỗi ngày một rương theo số tầng tháp đã qua (nang, kinh thư, phù tăng tốc; mỗi 5 tầng thêm một phần), không cần đánh lại. Chưa tính bí cảnh, chưa có "tháp lệnh" đổi quà.
- **Ưu tiên:** P1 · **Công sức:** S.

#### C8 · Sunset Canyon — đấu trường

- **RoK:** đấu trường xếp đội hình, có lượt đánh mỗi ngày; VIP 4–7 thêm lượt [32]; thưởng mùa có tăng tốc [41]. Số lượt/ngày và luật chi tiết: **[chưa xác minh]** (xem file 6).
- **Tu tiên hoá:** "Luận Kiếm Đài": xếp đội thủ bằng trưởng lão + đệ tử ảo (không mất quân), 5 lượt/ngày, xếp hạng tuần.
- **Game mình:** ✅ Luận Kiếm Đài (`sect/arena.ts`, `world/arena.ts`, `Arena.svelte`): đội thủ trưởng lão + đệ tử ảo (không mất quân), 5 lượt/ngày, Elo, rương ngày theo bậc Đồng/Bạc/Vàng/Ngọc, bảng tuần + thư quà top 10, phục thù, Kiếm Ý đổi ở Luận Kiếm Thương Điếm; Luận Kiếm Lệnh từ Nhật Khóa thêm lượt.
- **Ưu tiên:** P2 · **Công sức:** M.

#### C9 · Peerless Scholar — thi đố

- **RoK:**
  - Đố vui 3 vòng: Sơ khảo → Giữa kỳ → Chung khảo. Cần ít nhất 6 câu đúng ở Sơ khảo để đi tiếp **[1 nguồn]** [45].
  - Qua Chung khảo được nhiều gem; rương mốc 1.000 điểm có tượng Sử thi [45].
  - Câu hỏi về lịch sử, địa lý, khoa học, thể thao, luật game. Lịch diễn ra: **[chưa xác minh]**.
- **Tu tiên hoá:** "Vấn Đạo Đài": câu hỏi về truyện tu tiên, điển tích, và luật game (hệ khắc, ngũ hành). Vừa vui vừa dạy cơ chế.
- **Game mình:** ✅ Vấn Đạo Đài (`sect/quiz.ts`, `Quiz.svelte`, thẻ đầu Tàng Kinh Các từ tầng 3): mỗi ngày 5 câu rút từ 15 câu về luật chơi (đáp án khớp hằng số trong `data.ts`), sai thì hiện đáp án đúng, xong nhận quà theo số câu đúng.
- **Ưu tiên:** P2 · **Công sức:** S.

#### C10 · Kingdom Newspaper — báo vương quốc

- **RoK:**
  - Thêm từ bản 1.0.35. Mỗi ngày một số báo kể chuyện đáng chú ý trong vương quốc: thành tích của thống đốc, kỷ lục thu thập, man di, hồi ký trinh sát **[1 nguồn]** [46].
  - Có lịch xem số cũ, có nút thích.
  - Mua 10 gem/ngày ở Lyceum of Wisdom, kèm một buff ngẫu nhiên [46].
- **Tu tiên hoá:** "Giới báo" / biên niên giới. Thêm tin về người chơi cụ thể và nút "đồng đạo tán thưởng".
- **Game mình:** 🟡. Biên niên giới trên thẻ bản đồ Giới (`ChronArgs` ở `world/map.ts`), miễn phí: có tin gắn tên người chơi (lập tông môn, cướp, độ kiếp từ Kim Đan) cùng yêu vương, chương Thiên Đạo Biên Niên, Minh Chiến; hết mùa mỗi người có thư tổng kết riêng. Chưa có số báo theo ngày, chưa có nút tán thưởng.
- **Ưu tiên:** P2 · **Công sức:** S.

#### C11 · Alliance gifts, credits & shop — quà liên minh, điểm cống hiến

- **RoK:**
  - Quà liên minh xuất hiện khi thành viên mua gói, diệt pháo đài man di, hoặc xong sự kiện đặc biệt [47].
  - Quà có thể chứa: điểm VIP (10 / 50 / 100 / 200 / 1.000) [32]; gem (rương đồng có thể ra 100, rương bạc tới 200) [69]; khoảng 10 Books of Covenant [71].
  - Individual Credits kiếm từ giúp đỡ và góp công nghệ [47], dùng ở cửa hàng liên minh:
    - tăng tốc tới 3 giờ, chìa, gói tài nguyên [41];
    - vật phẩm đổi nền văn minh: 2 triệu credits [1];
    - 50.000 credits = 100 điểm VIP [32].
- **Vì sao hiệu quả:** một người nạp thì cả minh có quà, tạo áp lực xã hội (cả tốt lẫn xấu). Giúp đỡ được trả điểm, nên hợp tác được thưởng.
- **Tu tiên hoá:**
  - **"Cống hiến"**: kiếm từ giúp tăng tốc, hộ pháp, viện binh; đổi ở "Tàng Kinh Các của minh" lấy đan và thiếp thuê tạp dịch.
  - **"Minh lễ"**: quà khi đồng minh độ kiếp thành công hoặc cả minh hạ yêu vương. Không gắn với việc nạp tiền.
- **Game mình:** ✅ Cống hiến (từ cung phụng Hộ Minh Đại Trận và giúp đỡ, trần 250/ngày từ giúp) đổi ở Cống Hiến Các (`AllyShop.svelte`); Minh lễ (`allyGifts` ở `world/base.ts`): người trong minh hạ yêu vương thì cả minh nhận quà thư, điểm quà nâng quà 1–5 (chi tiết: file 4).
- **Ưu tiên:** P1 · **Công sức:** M.

#### C12 · Redeem codes, account binding, Lilith Pass

- **RoK:**
  - Mã quà phát định kỳ qua mạng xã hội [41][69].
  - Liên kết Facebook được 200 gem một lần **[1 nguồn]** [48].
  - **Lilith Pass**: hội viên chung các game Lilith, nằm ngoài game **[1 nguồn]** [49]:
    - 6 hạng từ Đồng tới Kim cương, cần 0–800.000 EXP tích từ nạp tiền;
    - điểm đổi gói trong game, hết hạn sau 13 tháng;
    - hướng dẫn nói nhận được tới khoảng 20.000 gem.
- **Tu tiên hoá:**
  - **"Mật lệnh"**: mã quà cho cộng đồng và devlog (PLAN mục 8: tăng trưởng nhờ cộng đồng).
  - Quà khi **liên kết email**: giảm mất tài khoản vì Safari xoá storage (PLAN mục 4 › An toàn).
- **Game mình:** ✅ Mã quà tặng (`db/codes.ts`, `/account/redeem`; admin tạo ở `/admin/codes`): nhập ở Cài đặt › Tài khoản, mỗi tài khoản một lần, quà về thư; quà gắn email lần đầu (`LINK_GIFT`, `/account/link`): Kim Duyên Phù, 2 Thời Quang Phù 1 giờ, Hộ Sơn Phù 8 giờ, Cải Danh Lệnh.
- **Ưu tiên:** P1 · **Công sức:** S.

#### C13 · Power & rankings — con số sức mạnh và mốc thưởng

- **RoK:**
  - Power cộng từ nhà, nghiên cứu, quân, tướng; hiện khắp nơi (hồ sơ, bảng xếp hạng). Mục tiêu F2P hay được nhắc là 40 triệu power **[1 nguồn]** [50].
  - Sự kiện **Zenith of Power** (kỷ niệm 2025): mỗi 5 triệu power tăng thêm được một huy hiệu, tối đa 20 **[1 nguồn]** [51]. Thưởng tượng huyền thoại và giao diện thành "Sands of Eternity" — **skin có chỉ số +16% công quân**.
- **Tu tiên hoá:** đã có "Thế lực". Thêm mốc thế lực có quà (cosmetic và tài nguyên, không chỉ số).
- **Game mình:** 🟡. Thế lực trên HUD ("+N" bay lên khi tăng), "thế lực tăng thêm" trong bảng công trình, bảng Thế lực chia 5 nguồn có nút "Tăng" (`PowerSheet.svelte`, `powerParts`), xếp hạng lực chiến / cảnh giới / chiến công / tranh đoạt / tháp / sự kiện tuần / mùa. Mốc thế lực có quà mới có một mốc 20.000 ở Tân Thủ Chi Lộ; chưa có mốc thế lực dài hạn.
- **Ưu tiên:** P2 · **Công sức:** S.

#### C14 · Push notifications — thông báo đẩy

- **RoK:** cho bật/tắt thông báo theo loại (tin riêng, liên minh, chiến đấu…) **[trích tìm kiếm]** (file 8, mục E4). Danh sách đầy đủ các loại: **[chưa xác minh]**. Game có rất nhiều đồng hồ, mỗi đồng hồ là một cơ hội nhắc.
- **Tu tiên hoá:** chữ theo giọng tu tiên. Chỉ nhắc cái người chơi *được lợi* khi mở game, không nhắc để quảng cáo.
- **Game mình:** ✅.
  - Có (Web Push, `makePusher` ở `lib/push.ts`), 7 loại tắt được từng loại (`/push/off`, Cài đặt › Tài khoản): việc dài xong (xây, tuyển, lĩnh ngộ, luyện khí, đội về; xong sau ít nhất 20 phút kể từ lúc rời), nhắc chăm núi (`careReminds`: Hộ Sơn Phù còn 30 phút, kho sắp đầy theo sản lượng, 20h hôm sau nếu chưa về núi giữ chuỗi Hương Hỏa, rương Nhật Khóa đủ mốc chưa nhận — 2 giờ trước 0h, sự kiện đang tích điểm sắp đóng — 2 giờ trước), địch kéo tới / bị cướp / bị do thám / sơn môn thất thủ, truyền âm, kiếp vân, Tranh Đoạt Linh Châu sắp bắt đầu, minh sự lịch. Chỉ mời bật sau khi giao một việc từ 30 phút.
  - Không làm: đẩy mỗi lần đồng minh nhờ giúp (dễ thành spam; trang Tiên minh có nút giúp tất cả).
- **Ưu tiên:** P1 · **Công sức:** S.

#### C15 · Long timers & "luôn có việc"

- **RoK:**
  - Đồng hồ nâng TTC gốc: TTC 16 mất 4 ngày, TTC 22 mất 17 ngày, TTC 24 mất 36 ngày, TTC 25 mất 126 ngày [15].
  - Nghiên cứu Combat Tactics cấp 9 mất ~65 ngày, cấp 10 mất ~100 ngày với người chơi trung bình [72].
  - Người chơi vì thế tích tăng tốc cho sự kiện, và "đặt việc dài rồi đi". Nhiều đồng hồ chạy song song (C1, C3, C5, C6, C7, A12) nên phiên nào mở ra cũng có ít nhất 3–4 thứ để nhận.
- **Game mình:** ✅ theo trụ cột "chờ đợi có nghĩa". Đồng hồ dài nhất ~1,9 ngày (Chủ điện 25); có màn Xuất quan; hướng dẫn "đặt việc dài nhất rồi thoát" (UX 5.2). Không nên kéo dài như RoK vì mùa chỉ 49 ngày.
  - Chỗ yếu: khi đã nhận hết đồ trong Xuất quan, **số "thứ để nhận" mỗi phiên còn ít** (nhiệm vụ ngày, nhiệm vụ tuần, việc xong). C1, C3, C5, C7 chính là để lấp chỗ này.
- **Ưu tiên:** P0 (đã có) · **Công sức:** —.

### D. Sự kiện chồng lấp

#### D1 · Mightiest Governor (MGE)

- **RoK:**
  - 6 chặng: 5 chặng × 24 giờ (luyện quân, man di, thu thập, tăng power, tiêu diệt địch) và chặng cuối 48 giờ [55].
  - Thưởng xếp hạng là tượng huyền thoại của 1 trong 3 tướng được đưa ra [55]. Top 50 được 200 gem; top 100 được 40 gem + tượng [69].
  - Người nạp nhiều mua điểm dễ dàng ở chặng cuối. F2P được khuyên chuẩn bị ít nhất 3 tháng [55].
- **Tu tiên hoá:** "Tông Môn Tranh Bá", đúng tên phiên khác đang dùng.
- **Game mình:** 🟡 Tông Môn Tranh Bá (`FESTS.tranhBa`, trung tâm sự kiện): thứ Hai → thứ Bảy, 6 ải như RoK (luyện binh theo bậc / trảm yêu theo cấp / khai mỏ / thế lực / tranh đoạt — diệt địch / nước rút), 5 mốc điểm, mở ở tầng 5, không mua điểm; bảng xếp hạng lượt lễ + thư quà top 10, trưởng lão của đợt (top 10 nhận tín vật, mỗi người 4 lượt). Sự kiện tuần cũ (`EVENTS`, 6 chủ đề + top 10) vẫn chạy song song — chưa gộp; chưa có hạng từng ải.
- **Ưu tiên:** P1 · **Công sức:** S (gộp lại).

#### D2 · Wheel of Fortune

- **RoK:**
  - Khoảng 3 tuần một lần (có khi trễ tới 6 tuần), kéo dài 3 ngày [56].
  - Lượt đầu miễn phí, thêm 1 lượt giảm giá mỗi ngày. Lượt trả gem bắt đầu từ 400 (đã giảm 50%) rồi tăng dần.
  - Chi phí: 10 lượt đầu ~5.600 gem [57]; 100 lượt ~70.400 gem [56].
  - Mốc theo số lượt quay cho tượng; tướng theo lịch tuổi vương quốc (B7).
- **Game mình:** ✅ Thiên Cơ Luân (fest `thienCo` kiểu `wheel`, `spin` ở `sect/fest.ts`, `Wheel.svelte`): 3 ngày, hai tuần một lần, từ Chủ điện 7; mỗi ngày một lượt miễn phí, lượt thêm tốn Thiên Cơ Lệnh kiếm bằng chơi (không bán lượt), ô lớn là tín vật trưởng lão Tiên phẩm chủ lễ, lượt thứ 30, 60… chắc trúng ô lớn.
- **Ưu tiên:** — · **Công sức:** —.

#### D3 · More Than Gems & Recharge Event

- **RoK:**
  - **More Than Gems** kéo dài 2 ngày, mỗi ngày có các mốc tiêu gem 300 / 1.000 / 3.000 / 7.000 / 25.000. Mốc 7.000 được 5 tượng huyền thoại, mốc 25.000 được 13; tối đa 26 tượng trong 2 ngày **[2 nguồn]** [58][59].
  - Tần suất **[mâu thuẫn]**: "2–3 tháng một lần" [59], "khoảng 2 tuần" [69], "thất thường" [58].
  - Hướng dẫn cộng đồng dặn dành gem cho sự kiện này (trừ khi chưa tới VIP 6) [59].
  - **Recharge Event**: trong 7 ngày, nạp đủ mốc gem thì nhận tướng huyền thoại [66].
- **Game mình:** ⛔ (bán sức mạnh).
- **Ưu tiên:** — · **Công sức:** —.

#### D4 · Lohar's Trial & Arms Training

- **RoK:**
  - **Lohar's Trial**: đánh man di rơi Bone Necklace, mở ra gem, tăng tốc, Arrows of Resistance (nâng Watchtower) và di vật của Lohar [60]. Được khuyên cho người mới và F2P [62].
  - **Arms Training**: một đạo quân đánh boss Lohar khó dần; không phải sự kiện luyện quân [62].
- **Tu tiên hoá:**
  - "Yêu triều": trong 3 ngày yêu thú rơi yêu đan để đổi quà.
  - "Thí luyện Thanh Phong": boss khó dần, mỗi mốc có quà.
- **Game mình:** ✅ Yêu Vương Tuần Sơn (`world/lohar.ts`): yêu thú giới cấp 6+ rơi yêu cốt, đủ 10 thì triệu hồi một yêu vương thành bản Tuần Sơn (máu ×2, 2 giờ), hạ được thì thêm quà chia theo sát thương; Luận Võ Liên Hoàn (`sect/drill.ts`): đội ảo đấu liên tiếp giáo đầu mạnh dần, mốc 3/6/9/12/15 trận thắng có quà. Thêm Săn Yêu Lệnh Chủ nhật, cuối tuần ×1,5.
- **Ưu tiên:** P2 · **Công sức:** S.

#### D5 · Golden Kingdom

- **RoK:** cần TTC 17 [61]. Hầm ngục 20 tầng, mỗi 4 tầng có trạm lưu kèm rương vàng. Chọn di vật và phúc lành kiểu roguelite; độ khó co giãn theo power [61][62].
- **Tu tiên hoá:** "Hư Vô Bí Cảnh": leo 20 tầng, mỗi 4 tầng chọn 1 trong 3 "cơ duyên" (buff tạm thời trong sự kiện).
- **Game mình:** 🟡. Thông Thiên Tháp đổi hệ mỗi tầng; Luận Võ Liên Hoàn (`sect/drill.ts`) có bước chọn 1 trong 3 mỗi 3 trận thắng, nhưng là chọn công pháp cho giáo đầu (roguelite ngược). Chưa có hầm ngục chọn cơ duyên buff cho đội mình.
- **Ưu tiên:** P2 · **Công sức:** M.

#### D6 · Ceroli Crisis

- **RoK:** đội 4 người đánh boss PvE; tiền sự kiện đổi được tăng tốc [62][41]. (Ceroli Assault là bản 12 người.)
- **Tu tiên hoá:** "Trấn yêu tổ đội": 4 tông môn cùng đánh một yêu vương thu nhỏ.
- **Game mình:** ✅ Man Hoang Cổ Tộc (`world/party.ts`, `AllyParty.svelte`, tab Chiến của tiên minh): từ Chủ điện 8, một người mở phòng (5 độ khó), tối đa 4 người trong minh vào, chọn vai Hộ Pháp / Chủ Công / Trị Liệu; server giải 5 đợt hung thú mạnh dần, quà theo độ khó × số đợt qua thư. Yêu vương giữa giới vẫn đánh bằng kết trận (tối đa 8 đội).
- **Ưu tiên:** P2 · **Công sức:** M.

#### D7 · Ark of Osiris

- **RoK:**
  - Khoảng 2 tuần một lần; 30 đấu 30 giữa hai liên minh; giữ công trình để lấy điểm [63].
  - Thắng (đạt 10 nghìn điểm) được tới 2.500 gem; thua nhưng đạt điểm được tới 1.200 gem **[1 nguồn]** [69].
- **Tu tiên hoá:** "Tiên Minh Luận Chiến" dạng bất đồng bộ: đặt trận trước, giải quyết tức thì. Hợp với "Không làm" thời gian thực.
- **Game mình:** ✅ Luận Kiếm Minh Chiến (`world/war.ts`, 20h thứ Bảy, minh ghép cặp theo điểm minh chiến) và Tranh Đoạt Linh Châu (`world/ark.ts`, `ArkCard.svelte`, 20h Chủ nhật: chiến trường 5 ô, 6 hiệp × 10 phút giải tất định theo lệnh đứng, đệ tử ảo không mất quân); Cửu Thiên Luận Đạo Hội cộng điểm cả mùa. Bản giản lược 5 ô, chưa đủ 11 ô (xem file 6).
- **Ưu tiên:** P2 · **Công sức:** L.

#### D8 · KvK / Lost Kingdom

- **RoK:**
  - Khoảng 3 tháng một mùa [64][74]. Cần TTC 17 [64][15] (bài 2024 ghi 16 [65] — **[mâu thuẫn]**).
  - Trước KvK có Eve of the Crusade / Marauders để farm tăng tốc [41][65].
  - Thưởng: Crusader Achievements (B5), Twilight, Past Glory, tướng riêng [64][65].
  - Sau KvK người chơi hay nghỉ một thời gian để hồi sức [64][75].
- **Game mình:** ✅ (theo cách riêng). Mùa giới 49 ngày, cuối mùa phi thăng hoặc luân hồi. Liên server là ⛔.
- **Ưu tiên:** P0 (đã có) · **Công sức:** —.

#### D9 · Kỷ niệm & lễ hội: Sign-In Spoils, Grand Reunion, Yearbook

- **RoK:**
  - Kỷ niệm 7 năm (09/2025) **[1 nguồn]** [51]:
    - **Sign-In Spoils**: đăng nhập 7 ngày liên tiếp, nhận tượng huyền thoại, gem, tăng tốc;
    - **Grand Reunion**: tạo mã mời người chơi cũ quay lại, kiếm điểm khi họ chơi tích cực;
    - **RoK Yearbook**: bản tổng kết cá nhân, không cần làm gì;
    - nhiều mini-game: câu cá, chợ dưa, xiếc, hộ tống đoàn buôn, đố vui liên minh, đua săn man di, Zenith of Power.
  - Bản 1.1.11 (27/08/2026) tiếp tục Yearbook, Melon Market, Arms Training, hộ tống, lì xì, đố vui [52].
- **Tu tiên hoá:** **"Khánh điển khai tông"** mỗi đầu mùa:
  - 7 ngày điểm danh cho *mọi người* (không chỉ người mới);
  - **"Cố nhân tương phùng"**: mã mời người cũ quay lại, quà cho cả hai;
  - **"Tông môn chí"**: tổng kết mùa để chia sẻ (cảnh giới cao nhất, trận lớn nhất, trưởng lão thân nhất), hợp với PLAN mục 8.
- **Game mình:** 🟡. Tổng kết mùa đã có: hết mùa ai cũng nhận thư tổng kết riêng (`yearbook`, `endSeason` ở `world/season.ts`); lễ theo lịch có Tân Xuân Khai Sơn (7 bao lì xì đăng nhập cho mọi người), Trung Thu, Thất Tịch, Quỷ Tiết, Đông Chí. **Khánh Điển Khai Tông** (`khaiDien`, khung lễ mới `season` theo `seasonAt` — server gán lúc mở mùa khi vào giới): 14 ngày đầu mỗi mùa, mọi người trong giới, 7 phần quà điểm danh (phần 7 có 2 Kim Duyên). **Hồi Quy Lễ**: vắng từ 7 ngày, lần vào lại có thư quà chào mừng (theo tầng Chủ điện). Chưa có mã mời người cũ (quà cho người mời).
- **Ưu tiên:** P1 · **Công sức:** S (điểm danh mùa, tổng kết) / M (mời người cũ).

#### D10 · Nhịp và lịch sự kiện (tổng)

- **RoK:** không có một lịch chung cho mọi vương quốc; người chơi xem lịch trong game [62]. Thực tế luôn có 2–4 sự kiện chạy cùng lúc: một sự kiện "tích điểm" (MGE, Lohar), một sự kiện "tiêu gem" (Wheel, MTG), một sự kiện liên minh (Ark, Ceroli), và nền là KvK hoặc chuẩn bị KvK (tổng hợp từ [55]–[64]).
- **Tu tiên hoá:** "Lịch giới" 49 ngày (B7) + trung tâm sự kiện. Mỗi ngày có ít nhất một sự kiện đang chạy và một sự kiện "sắp mở" để người chơi tích trước.
- **Game mình:** ✅. Trung tâm sự kiện (`Events.svelte`, `FESTS`) có lịch 7 ngày tới (`festCalendar`) và **Lịch giới** (`SeasonCal.svelte`): 49 ngày của mùa chia tuần — pha bản đồ mở (sớm hơn nếu xong chương), hạn 13 chương Thiên Đạo Biên Niên, Tranh Đoạt Linh Châu mỗi Chủ nhật (hai trận cuối là bán kết / chung kết Cửu Thiên), hết mùa; hôm nay tô vàng. Từ tầng 5 ngày nào cũng có sự kiện, chồng với sự kiện chu kỳ 14/21 ngày, lễ theo lịch và việc tiên minh theo tuần.
- **Ưu tiên:** P1 · **Công sức:** M (chi tiết lịch: file 5).

### E. Nhịp tiến trình thực tế

#### E1 · Bảng mốc: RoK so với game mình

| Mốc | RoK | Game mình (PLAN mục 5, sim) |
|---|---|---|
| Phiên đầu | TTC 2→4 trong ~25 phút, TTC 5 mất thêm 1 giờ [15] | Nhiệm vụ 1–15 dẫn 30 phút đầu (UX 5.1); Chủ điện 2→5 tốn ~18 phút xây |
| Cảnh giới / TTC 10 | 2 ngày 9 giờ (gốc) [15] | Tầng 10: ngày 5 (bot giỏi) / ngày 9 (người chơi thường) |
| TTC 16 (T3) | 16 ngày 19 giờ gốc [15] | Tầng 16: ngày 14,5 / ngày 27 |
| TTC 17 (KvK) | 21,6 ngày gốc [15] | — (mùa 49 ngày, vào tới ngày 21) |
| TTC 22 (đạo quân thứ 5) | 70,9 ngày gốc [15] | Tầng 21: ngày 24 / ngày 38,5 |
| TTC 25 | **257 ngày gốc** [15] | Tầng 25: ngày 34,5 / ngày 48 |
| T4 | TTC 21 + Học viện 21 + nghiên cứu [15][73] | Bậc 4 Hạch tâm: Diễn võ trường 16 |
| T5 | TTC 25 + Castle 25 (20.095 Books; không nạp thì phá ~4.017 pháo đài man di, hoặc mua 10 gem/sách) [71] + Học viện 25 (25 ngày 9 giờ nghiên cứu gốc) [73] + Combat Tactics 9/10 (~65/~100 ngày) + ~1.000 tăng tốc sau khi xong nghiên cứu [72] | Bậc 5 Thánh tử: Diễn võ trường 21 |
| Thợ thứ hai | VIP 6: ≈ 41–62 ngày nếu không nạp (tự tính, A9) | Không có (P4 định bán) |
| Tướng huyền thoại đầu tiên | Đường chắc: Aethelflaed qua Expedition [43]; VIP 10 cho 1 tượng/ngày [33]; lượt quay miễn phí ở Wheel [56]; chìa vàng; Legendary Tavern bảo hiểm 10 lượt [30]. Số ngày: **[chưa xác minh]** | Trưởng lão thứ 2–3 trong ngày 3–7 (sim: Thạch Kiên, Như Yên); đủ 6 trưởng lão P1 khi dọn xong tông môn NPC / bí cảnh |
| Mùa PvP lớn đầu tiên | KvK, cần TTC 17, chu kỳ ~3 tháng [64] | Mùa giới 49 ngày |

- **Thời gian thật ngắn hơn thời gian gốc** nhờ buff tốc độ xây (Trung Hoa +5% [1], VIP tới +20% [33], nghiên cứu, giúp đỡ liên minh) và tăng tốc từ sự kiện. **Không đọc được nguồn đáng tin nêu "F2P mất X ngày tới TTC 22/25"** vì Reddit bị chặn → **[chưa xác minh]**. Hướng dẫn MGE coi T5 là điều kiện để cạnh tranh và khuyên F2P chuẩn bị ít nhất 3 tháng [55].
- **Tuần đầu của game mình theo sim** (chạy `node packages/rules/simulate.ts` ngày 24/09, chỉ đọc). Lần chạy này dùng working tree, đã gồm quà `FESTS`/`BAG` đang làm, nên nhanh hơn số PLAN ở bảng trên (PLAN ghi Kim Đan của người chơi thường ở ngày 10):
  - *Bot giỏi, 4 phiên/ngày:* tầng 3 ở ngày 1; tầng 5 ngày 2; độ kiếp Trúc Cơ ngày 3; Kim Đan ngày 4,5; tầng 13 ngày 6,75.
  - *Người chơi thường, 3 phiên/ngày, mỗi phiên 1 lượt:* tầng 3 ở ngày 2,75; tầng 5 ngày 4,5; yêu thú đầu tiên ngày 6; Trúc Cơ ngày 6,75; Kim Đan ngày 8,5.
  - Mô hình "1 lượt mỗi phiên" chắc thận trọng hơn người thật, vì phiên đầu của người thật làm được 15 nhiệm vụ. Dù vậy nó cho thấy **ngày 2–6 của người chơi thường thiếu cột mốc**: ít lên tầng, chưa đánh trận. RoK lấp khoảng này bằng TTC 6–10 (mỗi cấp mở một thứ) cùng hàng loạt móc ngày. Mình cần sự kiện tân thủ 7 ngày (đang làm) cộng với C3 và C7.

#### E2 · Phiên chơi & một ngày điển hình

- **RoK:**
  - Nhịp tự nhiên: nhà tài nguyên đầy sau ~10 giờ [82], AP đầy sau ~12,5 giờ [24], Thương nhân và Daily Objectives reset lúc 00:00 UTC. Kết quả là **2 phiên chính (sáng/tối) + vài lần ghé ngắn**. Độ dài phiên cụ thể: **[chưa xác minh]**.
  - *Sáng* (sau 7:00 giờ VN = reset): nhận điểm VIP và rương VIP; mở rương bạc miễn phí; xem Thương nhân; thu tài nguyên; đặt việc xây / nghiên cứu / luyện dài; gửi đạo quân đi thu thập; tiêu AP vào man di; làm Daily Objectives; nhận rương ngày Expedition [80][24][39][44].
  - *Trong ngày:* bấm giúp đỡ liên minh, gọi đạo quân thu thập về rồi gửi đi lại, làm việc của sự kiện đang chạy.
  - *Tối:* thu tài nguyên lần 2, đặt việc dài qua đêm, tiêu AP, tham gia hoạt động liên minh theo giờ (Ark, pháo đài, tập kết), bật khiên nếu cần [80][84].
- **Game mình:** phiên 5–10 phút, 3–4 phiên/ngày (PLAN mục 1–2). Luồng: Tiêu đề → Xuất quan → nhận thưởng → Tạp dịch → nâng → đặt việc dài nhất → thoát (UX 5.2). Ngắn hơn RoK là đúng trụ cột 2. Các "điểm nhận" buổi sáng (C3, C1, C5, C7) nay đã có: lễ vật Hương Hỏa, thiếp miễn phí Chiêu Hiền Đài, Thương nhân vân du, rương Tĩnh tọa ngộ đạo — thêm Nhật Khóa, Vân Du Khách, Vấn Đạo Đài.

### F. Kiếm tiền

**Quy mô:**
- Doanh thu trọn đời trên 2 tỉ USD, trên 40 triệu USD/tháng, trên 100 triệu lượt tải (dẫn số AppMagic); có người chơi chi trên 1 triệu USD [76].
- Wikipedia ghi trên 3,5 tỉ USD và 100 triệu người chơi (12/2023) [77].
- Wikipedia tiếng Trung ghi trên 140 triệu người dùng (09/2023); sau 7 năm doanh thu tháng vẫn trên 100 triệu (NDT) [78].

**Ký hiệu P2W:** 🔴 mua thẳng sức mạnh hoặc tốc độ PvP · 🟡 mua thời gian / tiện lợi, gián tiếp thành sức mạnh · 🟢 không ảnh hưởng sức mạnh.

#### F1 · Gems — tiền tệ premium

- **RoK:**
  - *Tiêu vào:*
    - VIP: 1 gem = 1 điểm [32];
    - Books of Covenant: 10 gem/cuốn [57];
    - Wheel of Fortune (D2); làm mới Thương nhân (C5);
    - đổi nền văn minh: 10.000 [1]; dịch chuyển nâng cao: 1.500 [7]; Master's Blueprint: 2.000/2.500 [16][17];
    - báo vương quốc: 10/ngày [46]; lập liên minh: 500 [47].
  - *Kiếm miễn phí:*
    - Daily Objectives: 100/ngày;
    - sự kiện: Ark tới 2.500; Strategic Reserve hạng 1 được 1.500; Canyon Clash 600–1.000; KvK Chronicles 500+ mỗi chương; MGE top 50 được 200 [69];
    - mỏ gem trên bản đồ; man di cấp cao; mã quà; rương liên minh [48][69];
    - skin trùng đổi ra gem: skin 3 ngày ~50, 7 ngày ~100, skin vĩnh viễn trùng 2.000 [69].
  - Ước tính người chơi tích cực kiếm 3.000–8.000 gem/tuần **[1 nguồn, có thể lạc quan]** [69].
- **P2W:** 🟡 (bản thân gem trung tính; P2W nằm ở chỗ gem mua được gì).
- **Tu tiên hoá:** **Tiên ngọc**, chỉ mua cosmetic, Tu Tiên Lệnh và tiện lợi có trần (PLAN mục 7).
- **Game mình:** ❌ cố ý — game không bán gì nên không có tiền premium (README: gói nạp, Growth Fund, gem ❌ cố ý); món RoK bán bằng gem thì kiếm bằng chơi, có trần.
- **Ưu tiên:** P1 (khi tới P4) · **Công sức:** M.

#### F2 · VIP mua được

- **RoK:** điểm VIP cộng dồn từ đăng nhập, gem (1:1), gói, cửa hàng liên minh [32].

  | VIP | Điểm cộng dồn | Mốc |
  |---|---|---|
  | 1 / 2 | 200 / 400 | tăng sản lượng 3–7% |
  | 3–5 | 1.200–6.000 | mở cửa hàng VIP (VIP 5) |
  | **6** | **11.500** | **thợ thứ hai vĩnh viễn**, +10% xây, +10% thu thập |
  | **10** | **150.000** | 1 tượng huyền thoại vạn năng/ngày |
  | 12 | 350.000 | 2 tượng/ngày, thêm công/thủ quân |
  | **14** | **750.000** | 3 tượng/ngày, +5% công/thủ/máu/sức chứa quân |
  | 15 | 1.000.000 | không thêm tượng; tăng thu thập, chữa thương (tới 50%), hành quân |
  | 16–18 | 1,5–4 triệu | |
  | 19 / SVIP | 6 triệu / 9 triệu | |

  - Nguồn: [33][34]. Trần VIP tăng dần theo thời gian: bài cũ ghi 15 [81], rồi 16 [32], 18 [34], giờ là 19 và SVIP [33] — **[mâu thuẫn theo thời điểm]**.
  - Hướng dẫn thừa nhận không nạp thì rất khó vượt VIP 12 [32].
- **P2W:** 🔴 mạnh: chỉ số chiến đấu vĩnh viễn + tượng huyền thoại mỗi ngày.
- **Tu tiên hoá:** không làm. Thay bằng **Công đức** (C3), kiếm bằng đăng nhập, chỉ cho tiện ích và cosmetic.
- **Game mình:** ⛔.
- **Ưu tiên:** — · **Công sức:** —.

#### F3 · Growth Fund — quỹ trưởng thành

- **RoK:**
  - Giá 15 USD (14,99 [68]), mua một lần, **tổng 81.000 gem nhận dần theo cấp TTC**. Phải tới TTC 24–25 mới nhận hết [66].
  - Được gọi là "gói đáng mua nhất" [66]; tính ra ~5.400 gem mỗi USD (tự tính).
  - Vì sao hiệu quả: mồi cho lần nạp lớn đầu tiên, và *gắn người mua với tiến trình* (bỏ game là bỏ phần gem chưa nhận).
- **P2W:** 🟡.
- **Tu tiên hoá:** **"Quỹ Tiên Lộ"**: mua một lần, nhận Tiên ngọc ở tầng 6 / 11 / 16 / 21 / 25. Vì Tiên ngọc không mua được sức mạnh nên thực chất là 🟢. Nên giữ qua luân hồi (nhận lại theo tầng mỗi kiếp) để khỏi phạt người chơi luân hồi.
- **Game mình:** ❌ cố ý — không bán (README: Growth Fund ❌ cố ý).
- **Ưu tiên:** P1 (P4) · **Công sức:** S.

#### F4 · Supply Depot — thẻ tháng

- **RoK:**
  - 10 USD/tháng: **650 gem mỗi ngày × 30 ngày = 19.500 gem** **[2 nguồn]** [66][48]; ~1.950 gem mỗi USD (tự tính).
  - Một bài cũ khuyên "gói gem 50 ngày" [41], có thể là bản trước của sản phẩm này — **[chưa xác minh]**.
  - Vì sao hiệu quả: người mua *phải vào game mỗi ngày* để nhận (cách nhận chính xác **[chưa xác minh]**). Vừa ra tiền vừa giữ chân.
- **P2W:** 🟡.
- **Tu tiên hoá:** **"Nguyệt Lệnh"**: Tiên ngọc mỗi ngày + tiện ích nhỏ không cộng dồn thành sức mạnh (tự thu tài nguyên trong Xuất quan, thêm 1 lần đổi việc Nhật khóa, khung chân dung). Phải đăng nhập để nhận.
- **Game mình:** ❌ cố ý — không bán; phần "vào mỗi ngày nhận quà" đã có miễn phí qua lễ vật Hương Hỏa mỗi ngày (`VIP_CHEST`, `sect/vip.ts`).
- **Ưu tiên:** P1 (P4) · **Công sức:** S.

#### F5 · Lucerne Scroll — sự kiện dạng "cuộn" có bậc miễn phí

- **RoK:**
  - Có bậc F2P, trong đó có tăng tốc [41] → ngầm hiểu có bậc trả phí. Thưởng có gem [70].
  - Giá, thời lượng, số cấp: **[chưa xác minh]**.
  - **Chưa thấy nguồn nào mô tả một battle pass thường trực** kiểu "season pass" trong RoK. Các gói mang tính "pass" gần nhất là Supply Depot và Growth Fund.
- **P2W:** 🟡 **[chưa xác minh]**.
- **Tu tiên hoá:** **Tu Tiên Lệnh** (season pass 49 ngày, đã có trong PLAN mục 7):
  - hai dòng: miễn phí / có Lệnh;
  - điểm lấy từ Nhật khóa và sự kiện;
  - thưởng: cosmetic + tiện ích có trần + tài nguyên và phù;
  - mùa 1 không có trưởng lão độc quyền.
- **Game mình:** ✅ Tu Tiên Lệnh (`sect/pass.ts`, `Pass.svelte`): điểm từ Nhật Khóa và nhiệm vụ tuần, 50 cấp, dòng thường + dòng Kim Lệnh (mở bằng Hương Hỏa 5 thay vì bán), quà phù / nang / kinh thư / duyên phù, hết mùa làm lại.
- **Ưu tiên:** P1 (P4) · **Công sức:** M.

#### F6 · Super Value Bundles / Daily Special / Monthly Special Offer / gói sự kiện

- **RoK:**
  - **Super Value Bundle** reset hằng tuần vào Chủ nhật [66]:
    - Call of the Ancients: cả chuỗi ~385 USD; tăng tốc luyện quân / vạn năng / chữa thương, 63,35 triệu lương và gỗ, 47,5 triệu đá, 94.850 gem;
    - King's Coronation: ~385 USD; 183 triệu lương và gỗ, 134,8 triệu đá.
  - Gói 5 USD: Vanquisher (trang bị), 7-Day Material Supply (1.000 gem + mảnh trang bị huyền thoại) [66].
  - Gói khác: New World (hộ chiếu di cư, 25 cái ~385 USD); Living Legends (385 USD, chìa vàng) [66].
  - Daily Special Offer, Monthly Special Offer, Special Resource Bundle, Training Booster [67]. Các mức giá: 0,99 / 2,99 / 4,99 / 9,99 / 14,99 / 19,99 / 29,99 / 49,99 / 74,99 / 99,99 USD [67][68].
  - Điều kiện gói bật ra (theo mốc, theo sự kiện): **[chưa xác minh]**.
- **P2W:** 🔴 (tăng tốc + tài nguyên + gem = mua thời gian và sức mạnh).
- **Tu tiên hoá:** mùa 1 không bán. Nếu bán thì chỉ "Bảo hạp" cosmetic.
- **Game mình:** ⛔ mùa 1. `BAG` (đang làm) đã có sẵn các món RoK hay bán (phù tăng tốc, nang tài nguyên, khiên). Nên ghi rõ trong PLAN rằng các món này **chỉ rơi từ chơi**.
- **Ưu tiên:** — · **Công sức:** —.

#### F7 · Gacha — Wheel of Fortune, chìa Tavern, Legendary Tavern

- **RoK:** D2, C1, C2. Thêm Recharge Event có tướng huyền thoại theo mốc nạp [66].
- **P2W:** 🔴.
- **Game mình:** ⛔.
- **Ưu tiên:** — · **Công sức:** —.

#### F8 · Sự kiện theo mốc tiêu tiền — MTG, Recharge, mua điểm MGE

- **RoK:** D3, D1. Cả phễu khuyên người chơi "để dành gem" cho những ngày này [59].
- **P2W:** 🔴.
- **Game mình:** ⛔.
- **Ưu tiên:** — · **Công sức:** —.

#### F9 · Nút thắt tiến trình bán bằng gem — Books of Covenant, Master's Blueprint

- **RoK:**
  - Chỉ Castle cần Books of Covenant, tổng 20.095 cuốn; mỗi cấp từ 15 đến 25 cần 300–5.000 cuốn [71].
  - Castle 25 là điều kiện của Học viện 25, và Học viện 25 là điều kiện của T5 [71][18].
  - Không nạp thì phá ~4.017 pháo đài man di; hoặc mua 10 gem/cuốn, tốt nhất vào dịp MTG [71].
- **P2W:** 🔴 (chặn T5 cho tới khi đủ sách).
- **Game mình:** ⛔. Tiến trình của mình chỉ khoá bằng thời gian, tài nguyên và độ kiếp.
- **Ưu tiên:** — · **Công sức:** —.

#### F10 · Tiện ích mua được — đổi nền văn minh, dịch chuyển, khiên, hộ chiếu

- **RoK:** đổi nền văn minh 10.000 gem; dịch chuyển nâng cao 1.500 gem; khiên 8/24 giờ; Courier Station bán khiên 24 giờ giảm 80–90% bằng gem [57]; hộ chiếu di cư qua gói New World [66].
- **P2W:** 🟡 (đổi nền văn minh) · 🔴 (khiên, di cư: lợi thế PvP).
- **Game mình:** ⛔ bán khiên. Đổi đạo thống chỉ bằng chơi (A2).
- **Ưu tiên:** — · **Công sức:** —.

#### F11 · Quà liên minh từ việc nạp tiền

- **RoK:** C11. Người không nạp cũng được quà, nhưng liên minh sinh áp lực "cần cá voi".
- **P2W:** 🟡.
- **Tu tiên hoá:** mua cosmetic thì cả minh nhận "Minh lễ" nhỏ (biểu cảm chat, ít tài nguyên có trần mỗi ngày).
- **Game mình:** ❌ cố ý — không có nạp tiền; quà chung của minh đến từ chơi: Minh lễ khi hạ yêu vương (`allyGifts` ở `world/base.ts`), Tụ Bảo Minh Đỉnh (`world/pot.ts`).
- **Ưu tiên:** P2 · **Công sức:** S.

#### F12 · Cosmetic — skin thành, giao diện thành, trang phục tướng

- **RoK:**
  - Có skin thành **có chỉ số**, ví dụ "Sands of Eternity" +16% công quân [51].
  - Trang phục tướng **chỉ ngoại hình**, ví dụ trang phục Yi Seong-gye "Fountain of Dreams" (08/2026) [52].
  - Skin trùng đổi ra gem [69].
- **P2W:** 🟢 khi chỉ là ngoại hình · 🔴 khi có chỉ số.
- **Tu tiên hoá:** "Sơn môn cảnh sắc" (bộ mái, sương, màu núi), "Pháp tướng" chưởng môn, hiệu ứng phi thăng, khung chân dung. Không chỉ số (PLAN mục 7). Hợp với hệ art vẽ tay `@rok/art`: một bộ màu `PIGMENT` mới là một skin.
- **Game mình:** 🟡 Khung chân dung mở theo thành tích (`FRAMES`, `frameOpen` ở `sect/elders.ts`: Hương Hỏa 6, phi thăng, đệ nhất Công Huân, 50 trận thắng Luận Kiếm, luân hồi) và đổi chân dung (`face`: chưởng môn hoặc trưởng lão đã thu nhận) — kiếm bằng chơi, không chỉ số. Chưa có sơn môn cảnh sắc (skin núi), pháp tướng, hiệu ứng phi thăng; không bán (cố ý).
- **Ưu tiên:** P1 (P4) · **Công sức:** M (art).

#### F13 · Phễu chi tiêu tổng & đề xuất cho mình

| Bậc phễu RoK | Sản phẩm RoK | P2W | Làm gì ở game mình |
|---|---|---|---|
| Mồi lần nạp đầu | Super Value Bundle 0,99 / 4,99 USD, Daily Special ~2,99 [67][69] | 🔴 | Gói khởi đầu **cosmetic** ("Sơn môn sơ khai") + chút Tiên ngọc |
| Lần nạp "đáng tiền" | Growth Fund 15 USD → 81.000 gem [66] | 🟡 | **Quỹ Tiên Lộ** (F3) |
| Nạp định kỳ | Supply Depot 10 USD/tháng [66] | 🟡 | **Nguyệt Lệnh** (F4) |
| Theo mùa | Lucerne Scroll **[chưa xác minh]**; gói KvK | 🟡/🔴 | **Tu Tiên Lệnh** 49 ngày (F5) |
| Hằng tuần | Super Value Bundles tới ~385 USD/tuần [66] | 🔴 | ⛔ |
| Sự kiện tiêu gem | Wheel, MTG, Recharge, Legendary Tavern [56][58][66][30] | 🔴 | ⛔ (tối đa một vòng quay cosmetic) |
| Thang vĩnh viễn | VIP 1→19 / SVIP [33] | 🔴 | ⛔ → Công đức kiếm bằng chơi (C3) |
| Tiện lợi | Thợ thứ hai (VIP 6), thương nhân, dịch chuyển | 🟡 | Tạp dịch thứ hai: kiếm được bằng Công đức, mua được *sớm hơn* (A9); tăng tốc có trần/ngày (PLAN mục 7) |
| Ngoài game | Lilith Pass [49] | 🟢 | Chưa cần |
| Quảng cáo | không thấy trong nguồn | — | Quảng cáo có thưởng, tự chọn xem (PLAN mục 7, bản mobile) |

### G. Người chơi khen / chê về tiến trình và giữ chân

#### G1 · Khen

- **Chiều sâu chiến lược, đồ hoạ, bản đồ liền mạch zoom vô hạn, quân đi tự do** [79][74]. App Store 4,5★ từ hơn 187 nghìn đánh giá [79].
- **Liên minh và tình đồng đội**; cộng đồng thân thiện trên Discord, Reddit, Facebook [79][74].
- **Sự kiện đều đặn**: KvK và Ark of Osiris được khen nhiều. Cập nhật thường xuyên, nhà phát triển có lắng nghe [74].
- **Tướng là nhân vật lịch sử có thật** [74].
- **F2P vẫn nhận nhiều** nhờ rương liên minh, sự kiện, 100 gem/ngày [74][41].

#### G2 · Chê

- **Pay-to-win**, lời chê nhiều nhất [79][75][77]:
  - VIP rối rắm; muốn là người mạnh nhất phải có thẻ tín dụng hạn mức cao (tổng hợp review) [77];
  - tướng mới mạnh ra quá nhanh; hệ thống đội hình / armaments tạo chênh lệch [75].
- **Người mới bị người chơi 5 năm đè**, nên nản [79].
- **Tốn thời gian, KvK kiệt sức**: tác giả một trang hướng dẫn tự nghỉ 3 tháng [75]; sau KvK có "giai đoạn nghỉ" [64].
- **Chữa T5 quá đắt** với F2P; **Books of Covenant** làm người mới chậm lại [75][71].
- **Vương quốc cũ chết** vì người chơi di cư sang vương quốc KvK 2–3; một phần người chơi chuyển sang Call of Dragons [75].
- **Lo ngại T6** sẽ "giết game" nếu ra trong tình trạng hiện tại [75].
- **Quảng cáo kỳ quặc** (dựng cảnh đời thường, sức mạnh trong game quyết định địa vị) bị chế giễu [77].

#### G3 · Bài học cho mình

- **Mùa 49 ngày + luân hồi** giải đúng lời chê "người mới bị đè" và "vương quốc cũ chết". Cần nói rõ điều này khi quảng bá.
- **Giữ "không P2W" làm điểm bán hàng.** Chỉ copy phần *giữ chân* của RoK (móc ngày, chuỗi, lịch sự kiện, liên minh), không copy phần *thang tiền* (VIP, tiêu gem, bán tăng tốc).
- **Phiên 5–10 phút** tránh được lời chê "tốn thời gian". Không đưa AP, không đưa sự kiện đòi thức canh theo giờ.
- **Đồ PvP mua được** (khiên, tăng tốc không trần) là thứ phá fantasy "phế vật nghịch thiên" nhanh nhất: kẻ yếu thắng nhờ ngộ tính và phối hợp, không nhờ ví tiền.

---

## 3. Kịch bản đề xuất theo kiểu RoK

### 3.1 60 phút đầu (phiên 1)

Mục tiêu:
- Tới tầng 4 trong ~30 phút và bắt đầu nâng tầng 5 trước phút 60, giống TTC 4 → 5 của RoK.
- Trong phiên đầu đã có trận đầu, trưởng lão thứ hai, hộp nhật khóa đầu và một lời hẹn cho ngày mai.

Nguyên tắc:
- Mỗi lúc một việc.
- Mỗi 5 phút mở không quá một hệ thống mới.
- Mọi phần thưởng bay vào ô.
- **Không bán hàng trong phiên đầu.**

| Phút | Người chơi làm | Dạy hệ thống | Thưởng / mở khoá | Đã có / cần thêm |
|---|---|---|---|---|
| 0–2 | Tiêu đề → lời dẫn 3 dòng → **chọn Đạo thống** (4–5 thẻ, ghi "được đổi miễn phí khi lên Kim Đan") → đặt tên → ấn son đập xuống | Bản sắc | Trưởng lão khởi đầu theo đạo thống | Có tiêu đề, lời dẫn, tên, ấn · **cần A1** |
| 2–5 | **Trận mở màn "Giữ núi"**: yêu thú tràn lên chủ điện đổ nát; trưởng lão + 20 đệ tử đánh tự động, lượt 3 xuất chiêu; kịch bản không thể thua. Thanh Phong: "Tông môn còn một người, vẫn là tông môn." | Phát lại trận, công pháp trưởng lão | 30 đệ tử, 2 Tụ Khí Đan | Có cảnh trận (`battle.ts`) · **cần kịch bản + A3** |
| 5–12 | Nhiệm vụ 1–6: 3 công trình tài nguyên → Chủ điện 2 → Tàng Bảo Các → Diễn võ trường. Mỗi việc ≤ 2 phút | Xây, Tạp dịch, sức chứa | Tài nguyên mỗi nhiệm vụ; `tanThu`: hoàn thành mục tiêu "Chủ điện 2" | ✅ (`QUESTS` 1–6; `tanThu` đang làm) |
| 12–20 | Tuyển 20 → nâng Chủ điện 3 (mở Bản đồ, Đan phòng, Bảo khố, nhật khóa) → xuất quân đánh yêu thú cấp 1 → **dùng ngay Tụ Khí Đan** vào việc đang chờ | Hành quân, chiến báo, tăng tốc | Tụ Khí Đan (nhiệm vụ 12) | ✅ phần lớn · thêm gợi ý "dùng phù/đan để tăng tốc" (`BAG` đang làm) |
| 20–30 | Đan phòng → luyện 1 mẻ → **bí cảnh tầng 1** (đánh ngay). **Nhật khóa**: 3/8 việc xong, **hộp 20 và 40 mở ngay trong phiên đầu** | Đan, bí cảnh, nhật khóa | Hộp nhật khóa; thưởng lần đầu bí cảnh | ✅ đan, bí cảnh · **cần B3** (nhật khóa dạng điểm) |
| 30–40 | Chủ điện 4 → Tàng Kinh Các → ngộ công pháp đầu. **Chiêu Hiền Đài**: mở 3 thiếp miễn phí (Kinh Thư → trưởng lão lên cấp) | Công pháp, nuôi trưởng lão | Trưởng lão lên cấp tại chỗ (thấy số tăng) | ✅ công pháp · **cần C1** |
| 40–50 | Nhiệm vụ "Bái nhập tiên minh" (gợi ý 3 minh; hoặc "chào kênh giới" nếu chưa muốn vào) → **điểm danh ngày 1** (Công đức) | Xã hội | Quà nhỏ; `thatNhat` ngày 1 | `thatNhat` đang làm · **cần A10, C3** |
| 50–60 | Bắt đầu nâng Chủ điện 5 (~8 phút) → **xem trước độ kiếp Trúc Cơ** (3 đợt lôi kiếp, "mục tiêu ngày mai") → đặt một việc từ 30 phút → **mời bật thông báo** → thẻ "Khi quay lại": quà điểm danh ngày 2, việc sẽ xong, hộp nhật khóa còn lại | Hẹn quay lại | — | ✅ mời bật push · **cần thẻ hẹn** (S) |

### 3.2 7 ngày đầu

Khung:
- `thatNhat`: 7 quà đăng nhập, đang làm.
- `tanThu`: 11 mục tiêu tuyệt đối trong ngày 0–6, đang làm.
- Đề xuất thêm một lớp **điểm "Thất Nhật Trúc Cơ"** kiểu RoK: làm việc ra điểm, không cần xong hết; mốc cuối trao cho người đạt đủ điểm dù chưa làm hết việc.
- **Đích của tuần đầu cho người chơi thường = độ kiếp Trúc Cơ** (sim: ngày 6,75). Người chơi giỏi có mục tiêu phụ Kim Đan.

| Ngày | Đích chính (người chơi thường, 3 phiên/ngày) | Việc tân thủ trong ngày (điểm) | Điểm danh (`thatNhat`) | Móc / mở khoá |
|---|---|---|---|---|
| 1 | Tầng 4–5; nhiệm vụ 1–20 | Thắng 3 trận, luyện 2 đan, tuyển 100 | Phù xây + phù vạn năng | Nhật khóa, Chiêu Hiền Đài, vào tiên minh |
| 2 | Tầng 5; bí cảnh 1 tầng 1–3 | Qua 3 tầng bí cảnh, dùng 60 phút tăng tốc, 2 lần giúp tiên minh | Phù tuyển + Kinh Thư | **Độ kiếp preview**: Thanh Phong chỉ hệ nên tuyển để khắc lôi kiếp đợt 1 |
| 3 | Chuẩn bị độ kiếp: đủ đệ tử, Độ Kiếp Đan | Hạ yêu thú cấp 3, luyện 1 Độ Kiếp Đan, ngộ 3 tầng công pháp | Tài nguyên + phù sản lượng 8 giờ | Nhắc: khiên tân thủ 72 giờ **hết cuối ngày 3** → dạy Hộ Sơn Đại Trận |
| 4 | Thu nhận Thạch Kiên (Hắc Phong Trại) | Hạ tông môn NPC đầu tiên, chữa 50 thương binh | Kinh Thư + phù công pháp | Sự kiện tuần / `tranhBa` bắt đầu được tính |
| 5 | Tầng 5 đầy đủ, đội thứ 2 sẵn sàng | Qua bí cảnh 1 tầng 5, tuyển 300 | Hộ Sơn Phù 24 giờ + phù xây 3 giờ | Nhiệm vụ tuần: đủ 5 ngày mở rương ngày |
| 6 | **Độ kiếp Trúc Cơ** (sớm nhất) | Độ kiếp (thành hay bại đều có điểm), hộ pháp đồng minh 1 lần | Phù vạn năng 3 giờ + phù sản lượng 24 giờ | Trúc Cơ: 2 đội xuất quân, mở PvP (tầng 6) |
| 7 | Trúc Cơ; tầng 7–8 | Mốc cuối điểm: **tín vật trưởng lão chưa có** (không phải Như Yên — xem C3) + danh hiệu cosmetic "Tân tú" | Quà lớn nhất: phù 8 giờ + Kinh Thư 8k | Mở "Lịch giới": báo trước sự kiện ngày 8–10 |

Ghi chú:
- Số ngày theo sim người chơi thường (E1); người thật có thể nhanh hơn. Mốc điểm nên chỉnh bằng `npm run sim` sao cho người chơi thường đạt ~80% điểm và vẫn nhận quà cuối.
- Các ngày trong `tanThu` hiện tính theo **ngày lịch từ lúc lập tông môn** (`born`). Người lập lúc 23h mất gần trọn "ngày 0". Nên tính theo 24 giờ kể từ lúc lập, hoặc cho khung dài hơn 7 ngày như `thatNhat` (14 ngày).

---

## 4. Bảng tổng kết khoảng cách

Xếp theo ưu tiên, rồi theo công sức. "Đang làm" = có trong working tree 24/09 của phiên khác, chưa commit.

| Tính năng (RoK → tu tiên) | Game mình | Ưu tiên | Công sức |
|---|---|---|---|
| C3 Chuỗi đăng nhập VIP → **Công đức** (điểm danh tăng dần, mở tiện ích) | ✅ Hương Hỏa (chuỗi 40→200 điểm/ngày, 12 cấp) | P0 | S |
| A4 Mở khoá theo TTC → Chủ điện / cảnh giới | ✅ | P0 | — |
| A8 Khiên tân thủ | ✅ 72 giờ | P0 | — |
| B1 Nhiệm vụ chính | ✅ 71 nhiệm vụ | P0 | — |
| C6 Kho đầy kéo quay lại | ✅ | P0 | — |
| C15 Đồng hồ dài, "đặt việc rồi đi" | ✅ + Xuất quan | P0 | — |
| D8 KvK → mùa giới 49 ngày | ✅ (cách riêng) | P0 | — |
| B3 Daily Objectives → **Nhật khóa** 100 điểm, 5 hộp | ✅ Nhật Khóa (100 điểm hoạt lực, 5 rương mốc) | P1 | S |
| C7 Rương ngày Expedition → **Tĩnh tọa ngộ đạo** theo tầng tháp / bí cảnh | ✅ Tĩnh tọa ngộ đạo (rương ngày theo tầng tháp) | P1 | S |
| A10 Vào liên minh sớm → nhiệm vụ "Bái nhập tiên minh" | ✅ lễ nhập minh (quà lần đầu) | P1 | S |
| A3 Counselor → Thanh Phong dẫn đường (+ trận mở màn: M) | 🟡 trưởng lão dẫn đường (Mộc Thanh Phong); chưa có trận mở màn | P1 | S / M |
| A9 Thợ thứ hai → tạp dịch thứ hai (thuê 2 ngày; vĩnh viễn bằng Công đức) | ✅ Tạp Dịch Lệnh (thuê 48 giờ, không vĩnh viễn) | P1 | S / M |
| C12 Mã quà + quà liên kết email | ✅ mã quà tặng + quà gắn email | P1 | S |
| C14 Thông báo đẩy thêm loại + chọn loại | 🟡 7 loại, tắt được từng loại, có nhắc khiên / kho / chuỗi Hương Hỏa; chưa nhắc Nhật Khóa, sự kiện | P1 | S |
| D1 MGE → Tông Môn Tranh Bá (gộp với sự kiện tuần) | ✅/🟡 Tông Môn Tranh Bá (6 ải, bảng từng ải + cả lượt, trưởng lão của đợt); sự kiện tuần cũ chưa gộp | P1 | S |
| D9 Kỷ niệm → Khánh điển đầu mùa (điểm danh mọi người, tổng kết mùa, mời người cũ) | 🟡 tổng kết mùa + lễ theo lịch; chưa có điểm danh đầu mùa, mời người cũ | P1 | S / M |
| F3 Growth Fund → **Quỹ Tiên Lộ** | ❌ (P4) | P1 | S |
| F4 Supply Depot → **Nguyệt Lệnh** | ❌ (P4) | P1 | S |
| B2 Side Quests → **Tông vụ** 4 dòng | ✅ Tông vụ 4 dòng (trong bảng Nhiệm vụ ngày) | P1 | S–M |
| A1 Civilizations → **Đạo thống** | ✅ | P1 | M |
| B4 Achievements → **Công tích bảng** + ấn vẽ tay | ✅ Thành tựu 15 chuỗi × 5 bậc có thưởng; chưa có ấn vẽ tay | P1 | M |
| B6 Monument → **Thiên Đạo Bia** (mục tiêu chung của giới) | 🟡 Thiên Đạo Biên Niên (13 chương, quà cả giới); pha mùa vẫn theo ngày | P1 | M |
| B7 / D10 Lịch theo tuổi vương quốc → **Lịch giới** + trung tâm sự kiện | 🟡 trung tâm sự kiện + lịch 7 ngày tới; nội dung theo ngày mùa (Khai Giới, Thiên Thời, chặng Chính Tà) chưa vào lịch sự kiện | P1 | M |
| C1 Tavern → **Chiêu Hiền Đài** (thiếp miễn phí, pity tất định, không bán) | ✅ Chiêu Hiền Đài | P1 | M |
| C11 Quà / điểm / cửa hàng liên minh → **Cống hiến**, **Minh lễ** | ✅ cống hiến + Cống Hiến Các + Minh lễ | P1 | M |
| F1 Gems → Tiên ngọc (chỉ cosmetic / pass / tiện lợi có trần) | ❌ (P4) | P1 | M |
| F5 Lucerne Scroll / pass → **Tu Tiên Lệnh** | ✅ Tu Tiên Lệnh (bản thường + Kim Lệnh theo Hương Hỏa) | P1 | M |
| F12 Cosmetic → Sơn môn cảnh sắc, pháp tướng | ❌ (kế hoạch) | P1 | M |
| A2 Đổi nền văn minh → Cải tu đạo thống | ✅ (7 ngày một lần) | P2 | S |
| A5 Quà lên cấp TTC → Đột phá chi lễ | ✅ qua nhiệm vụ | P2 | S |
| A7 Dịch chuyển tân thủ → vào giới theo mã mời | 🟡 server tự xếp + dời núi tân thủ (trước tầng 8); chưa có mã mời | P2 | S–M |
| B5 Crusader Achievements → Chiến tích mùa | ✅ Chinh Chiến Công Tích (6 mốc Công Huân) | P2 | S |
| C4 Cửa hàng VIP → cửa hàng Công đức / cống hiến | ✅ Hương Hỏa Các | P2 | S |
| C5 Mysterious Merchant → **Vân Du Tán Tu** | ✅ Thương nhân vân du | P2 | S |
| C9 Peerless Scholar → Vấn Đạo Đài | ✅ | P2 | S |
| C10 Kingdom Newspaper → Giới báo | 🟡 biên niên giới (có tin theo tên người chơi); chưa có tán thưởng | P2 | S |
| C13 Power + mốc → mốc thế lực có quà | 🟡 thế lực, bảng Thế lực, xếp hạng; chưa có mốc thế lực dài hạn | P2 | S |
| D4 Lohar's Trial → Yêu triều | ✅ Yêu Vương Tuần Sơn (yêu cốt) + Luận Võ Liên Hoàn | P2 | S |
| F11 Quà minh từ nạp → Minh lễ từ cosmetic | ❌ | P2 | S |
| A6 Thời đại → hình công trình tầng 16–25 | ✅ đủ 5 bậc hình (tới tầng 25) | P2 | M |
| A11 Khám phá sương mù → Thần thức dò xét | ✅ mê vụ + linh điểu + thôn trang / động phủ | P2 | M |
| C8 Sunset Canyon → Luận Kiếm Đài | ✅ Luận Kiếm Đài | P2 | M |
| D5 Golden Kingdom → Hư Vô Bí Cảnh | 🟡 tháp + Luận Võ Liên Hoàn (chọn công pháp cho giáo đầu); chưa có buff tự chọn | P2 | M |
| D6 Ceroli Crisis → trấn yêu tổ đội | ✅ Man Hoang Cổ Tộc (tổ đội 4 người) | P2 | M |
| D7 Ark of Osiris → Tiên Minh Luận Chiến (bất đồng bộ) | ✅ Luận Kiếm Minh Chiến + Tranh Đoạt Linh Châu (chiến trường 5 ô) | P2 | L |
| A12 Man di + AP | ✅ yêu thú + hồi hang; yêu thú giới tốn hành lực | P2 | — |
| C2 Legendary Tavern | ⛔ gacha | — | — |
| D2 Wheel of Fortune | ✅ Thiên Cơ Luân (lượt miễn phí + lệnh kiếm bằng chơi) | — | — |
| D3 / F8 More Than Gems, Recharge, mua điểm MGE | ⛔ bán sức mạnh | — | — |
| F2 VIP mua được | ⛔ → Công đức | — | — |
| F6 Super Value Bundles, gói tăng tốc / tài nguyên | ⛔ mùa 1 | — | — |
| F7 Gacha tướng | ⛔ | — | — |
| F9 Books of Covenant, Master's Blueprint bán bằng gem | ⛔ | — | — |
| F10 Bán khiên, di cư | ⛔ | — | — |

---

## 5. Nguồn

Truy cập 24/09/2026. "(trích tìm kiếm)" = trang gốc bị chặn, chỉ đọc được đoạn trích trong kết quả tìm kiếm.

**Nền văn minh**
1. Heaven Guardian — Best Civilization Tier List (09/2026): https://heaven-guardian.com/rise-of-kingdoms-best-civilization-tier-list-guide/
2. ROK Central — Best Civilization (02/2025): https://rokcentral.com/articles/best-civilization/
3. LDPlayer — Best civilization: https://www.ldplayer.net/blog/what-is-the-best-civilization-in-rise-of-kingdoms.html
4. Gamer Empire — Civilization Guide: https://gamerempire.net/rise-of-kingdoms-civilization-guide/
5. Pocket Gamer — Best civilizations (09/2026): https://www.pocketgamer.com/rise-of-kingdoms/best-civilizations/
6. mobi.gg — Change civilization (trích tìm kiếm): https://mobi.gg/en/tips/change-civilization-rise-of-kingdoms/

**Tân thủ, nhiệm vụ**
7. Games Guide Info — Beginners Guide: https://www.gamesguideinfo.com/rise-of-kingdoms/guide/beginners
8. Games Guide Info — Daily Objectives: https://www.gamesguideinfo.com/rise-of-kingdoms/guide/daily-objectives
9. Fandom — Daily Objectives (trích tìm kiếm): https://riseofkingdoms.fandom.com/wiki/Quests/Daily_Objectives
10. Fandom — Quests / Main Quest Line / Side Quests (trích tìm kiếm): https://riseofkingdoms.fandom.com/wiki/Quests
11. AppGamer — Achievements (trích tìm kiếm): https://www.appgamer.com/rise-of-kingdoms/strategy-guide/achievements
12. Fandom — Crusader Achievements (trích tìm kiếm): https://riseofkingdoms.fandom.com/wiki/Crusader_Achievements
13. Rise of Kingdoms Guides — Beginner Guide (01/2026): https://riseofkingdomsguides.com/rise-of-kingdoms-beginners-guide/
14. Heaven Guardian — Beginner's Guide (09/2026): https://heaven-guardian.com/rise-of-kingdoms-beginners-guide/

**Tòa thị chính, tiến trình**
15. Rise of Kingdoms Guides — City Hall Requirements and Cost (01/2026): https://riseofkingdomsguides.com/rise-of-kingdoms-city-hall-requirements-and-cost/
16. Pocket Gamer — City Hall (02/2022): https://www.pocketgamer.com/rise-of-kingdoms/city-hall/
17. Theria Games — City Hall Guide (02/2025): https://theriagames.com/guide/rise-of-kingdoms-city-hall-guide/
18. Heaven Guardian — Buildings Guide (09/2026): https://heaven-guardian.com/rise-of-kingdoms-buildings-guide-city-development/
19. Rise of Kingdoms Guides — Troop Capacity & March Queue: https://riseofkingdomsguides.com/rise-of-kingdoms-troop-capacity-and-march-queue-guide/
20. Rise of Kingdoms Guides — How to Teleport: https://riseofkingdomsguides.com/how-to-teleport-in-rise-of-kingdoms/
21. Rise of Kingdoms Guides — Jumper Guide: https://riseofkingdomsguides.com/rise-of-kingdoms-jumper-guide/
22. Heaven Guardian — Migration Guide 2026: https://heaven-guardian.com/rok-migration-guide-2026/
23. Rise of Kingdoms Guides — Tribal Village & Mysterious Cave: https://riseofkingdomsguides.com/scouting-tribal-village-and-mysterious-cave-guide/
24. Heaven Guardian — Action Points (08/2026): https://heaven-guardian.com/rise-of-kingdoms-maximize-action-points-dominate/
25. Rise of Kingdoms Guides — Action Points: https://riseofkingdomsguides.com/rise-of-kingdoms-action-points/

**Tavern, VIP, móc hằng ngày**
26. Rise of Kingdoms Guides — Tavern: https://riseofkingdomsguides.com/tavern/
27. Theria Games — Tavern Guide (02/2025): https://theriagames.com/guide/rise-of-kingdoms-tavern-guide/
28. Games Guide Info — Daily Free Silver Chests: https://www.gamesguideinfo.com/rise-of-kingdoms/boost-type/160001713-Daily-Free-Silver-Chests
29. Fandom — Tavern (trích tìm kiếm): https://riseofkingdoms.fandom.com/wiki/Buildings/Tavern
30. Rise of Kingdoms Guides — Legendary Tavern (trích tìm kiếm): https://riseofkingdomsguides.com/legendary-tavern-event-guide-rok/
31. Simon Ho — Saving Gold Keys: https://www.simonho.ca/posts/rok-saving-gold-keys
32. Rise of Kingdoms Guides — VIP Points and Levels (01/2026): https://riseofkingdomsguides.com/how-do-you-get-vip-points-in-rise-of-kingdoms/
33. Heaven Guardian — VIP Guide (09/2026): https://heaven-guardian.com/rise-of-kingdoms-vip-guide-level-up-fast-get-rewards/
34. TopUpLive — VIP Guide (08/2026): https://www.topuplive.com/news/rise-of-kingdoms-vip-guide.html
35. Gamer Empire — VIP points: https://gamerempire.net/rise-of-kingdoms-how-to-get-vip-points/
36. Pillar of Gaming — VIP points (02/2025): https://pillarofgaming.com/vip-points-in-rise-of-kingdoms/
37. Fandom — VIP (trích tìm kiếm): https://riseofkingdoms.fandom.com/wiki/VIP
38. Fandom — Builder Recruitment (trích tìm kiếm): https://riseofkingdoms.fandom.com/wiki/Items/Builder_Recruitment
39. Rise of Kingdoms Guides — Courier Station: https://riseofkingdomsguides.com/courier-station/
40. Heaven Guardian — Courier Station (08/2026): https://heaven-guardian.com/rise-of-kingdoms-courier-station-guide/
41. Rise of Kingdoms Guides — Speedups: https://riseofkingdomsguides.com/how-to-get-speedups-in-rise-of-kingdoms/
42. Heaven Guardian — Speedups (08/2026): https://heaven-guardian.com/rise-of-kingdoms-speedups-the-ultimate-guide-to-domination/
43. Heaven Guardian — Expedition (08/2026): https://heaven-guardian.com/rise-of-kingdoms-expedition-guide-tips-rewards/
44. BlueStacks — Expedition (12/2024): https://www.bluestacks.com/blog/game-guides/rise-of-kingdoms/guide-expeditions-en.html
45. Rise of Kingdoms Guides — Peerless Scholar (09/2026): https://riseofkingdomsguides.com/lyceum-of-wisdom-rok-answers/
46. Rise of Kingdoms Guides — Kingdom Newspaper: https://riseofkingdomsguides.com/get-kingdom-newspaper/
47. BlueStacks — Alliance Guide (12/2024): https://www.bluestacks.com/blog/game-guides/rise-of-kingdoms/rok-ultimate-alliance-guide-en.html
48. Rise of Kingdoms Guides — Gems: https://riseofkingdomsguides.com/rise-of-kingdoms-gems/
49. Rise of Kingdoms Guides — Lilith Pass: https://riseofkingdomsguides.com/how-to-redeem-lilith-pass-rewards-free-gems/
50. Rise of Kingdoms Guides — Increase Power: https://riseofkingdomsguides.com/how-to-increase-power-in-rise-of-kingdoms/

**Sự kiện**
51. LDPlayer — 7th Anniversary Event (09/2025): https://www.ldplayer.net/blog/rise-of-kingdoms-7th-anniversary-event.html
52. LDShop — Update 1.1.11 Anniversary Special (08/2026): https://www.ldshop.gg/blog/rise-of-kingdoms/anniversary-special.html
53. A Jack Of — Monument Quest and Rewards: https://www.ajackof.com/games/rise-of-kingdoms-lost-crusade/rok-monument-quest-and-rewards-in-rise-of-kingdoms/
54. Rise of Kingdoms Guides — The Pioneer / Road to Revival: https://riseofkingdomsguides.com/the-pioneer-road-to-revival-event-guide/
55. Rise of Kingdoms Guides — Mightiest Governor: https://riseofkingdomsguides.com/the-mightiest-governor-event/
56. Rise of Kingdoms Guides — Wheel of Fortune: https://riseofkingdomsguides.com/wheel-of-fortune-guide-in-rise-of-kingdoms/
57. Rise of Kingdoms Guides — Where to spend gems (01/2026): https://riseofkingdomsguides.com/where-to-spend-gems-in-rise-of-kingdoms/
58. Heaven Guardian — More Than Gems (08/2026): https://heaven-guardian.com/rise-of-kingdoms-dominate-more-than-gems-event/
59. Rise of Kingdoms Guides — More Than Gems: https://riseofkingdomsguides.com/more-than-gems-event-guide/
60. Rise of Kingdoms Guides — Lohar's Trial: https://riseofkingdomsguides.com/lohars-trial-event/
61. Rise of Kingdoms Guides — Golden Kingdom: https://riseofkingdomsguides.com/golden-kingdom-event-guide-rok/
62. Heaven Guardian — Events guide (08/2026): https://heaven-guardian.com/rise-of-kingdoms-events-dominate-with-this-guide/
63. Rise of Kingdoms Guides — Ark of Osiris: https://riseofkingdomsguides.com/ark-of-osiris-guide-and-strategy/
64. Rise of Kingdoms Guides — Lost Kingdom KvK: https://riseofkingdomsguides.com/the-lost-kingdom-kvk-guide/
65. Pocket Gamer — KvK guide (03/2024): https://www.pocketgamer.com/rise-of-kingdoms/kvk-guide/

**Kiếm tiền**
66. Rise of Kingdoms Guides — Bundles (01/2026): https://riseofkingdomsguides.com/rise-of-kingdoms-bundles/
67. Heaven Guardian — Top-up: https://heaven-guardian.com/rise-of-kingdoms-top-up/
68. TopUpLive — Top-up guide (08/2026): https://www.topuplive.com/news/rise-of-kingdoms-top-up-guide.html
69. LDShop — Gems guide (06/2026): https://www.ldshop.gg/blog/rise-of-kingdoms/rise-of-kingdoms-gems-guide.html
70. LootBar — Gems guide (06/2026): https://www.lootbar.com/blog/en/rise-of-kingdoms-gems-guide.html
71. Rise of Kingdoms Guides — Book of Covenant: https://riseofkingdomsguides.com/rise-of-kingdoms-castle-upgrade-requirements-cost-book-of-covenant/
72. Rise of Kingdoms Guides — Tier 5: https://riseofkingdomsguides.com/how-to-unlock-tier-5-units-fast/
73. Heaven Guardian — Academy (08/2026): https://heaven-guardian.com/rise-of-kingdoms-academy-guide/

**Đánh giá, cảm nhận, số liệu doanh thu**
74. Rise of Kingdoms Guides — Review 2026: https://riseofkingdomsguides.com/rise-of-kingdoms-review/
75. Rise of Kingdoms Guides — Is RoK dying: https://riseofkingdomsguides.com/is-rise-of-kingdoms-a-dead-game-is-it-dying/
76. Rise of Kingdoms Guides — $2B lifetime revenue: https://riseofkingdomsguides.com/rise-of-kingdoms-crosses-2-billion-in-lifetime-revenue/
77. Wikipedia (EN) — Rise of Kingdoms: https://en.wikipedia.org/wiki/Rise_of_Kingdoms
78. Wikipedia (ZH) — 萬國覺醒: https://zh.wikipedia.org/wiki/萬國覺醒
79. App Store — Rise of Kingdoms: https://apps.apple.com/us/app/rise-of-kingdoms/id1354260888

**Khác**
80. Touchscreen Gaming — Beginner guide (07/2025): https://touchscreengaming.com/rise-of-kingdoms-beginner-guide/
81. BlueStacks — FAQ: https://www.bluestacks.com/blog/game-guides/rise-of-kingdoms/rok-faqs-en.html
82. BlueStacks — City building guide (07/2022): https://www.bluestacks.com/blog/game-guides/rise-of-kingdoms/rok-city-building-guide-en.html
83. Empire Build Academy — Construction: https://www.empirebuildacademy.com/construction/rise-of-kingdoms
84. Rise of Kingdoms Guides — FAQ: https://riseofkingdomsguides.com/faq/

**Nội bộ:** `docs/PLAN.md`, `docs/UX.md`, `packages/rules/data.ts` (`QUESTS`, `DAILY`, `WEEKLY`, `EVENTS`, `BAG`, `FESTS`), `packages/rules/core/fest.ts`, `packages/rules/core/battle.ts` (`grant`), `apps/server/src/game/notify.ts`, `node packages/rules/simulate.ts 14 3 --casual` và `7 4` (chạy 24/09/2026, chỉ đọc), [4-lien-minh-xa-hoi.md](4-lien-minh-xa-hoi.md), [8-ui-ux.md](8-ui-ux.md).
