# Game flow & UI/UX

> Đi kèm [PLAN.md](PLAN.md). Chạy thử: `npm run dev` → http://localhost:5173

## 1. Hướng đi

**Màn chính là một thế giới, không phải một danh sách.** Người chơi *thấy* tông môn của mình: một ngọn núi thanh lục sơn thủy, công trình dựng trên từng tầng núi, sương trôi giữa các tầng, thác nước, hạc bay ngang trời, linh khí bay lên. Mọi việc diễn ra ngay trong thế giới đó (xây, chờ, xong). Cách này giống thành phố của RoK.

**Công nghệ**

- **Svelte 5 + SVG vẽ tay** cho cảnh núi và công trình (`art/` = package `@rok/art`). Không cần file ảnh: hình sinh theo tham số, màu đọc từ CSS var nên đổi ngày/đêm chỉ cần đổi biến.
- **HTML/CSS cho HUD và bảng**: chữ tiếng Việt có dấu, co giãn, trình đọc màn hình đều tốt hơn canvas.
- **Bản đồ vùng và phát lại trận cũng là SVG** (mốc 1.2): P1 chỉ có ~25 điểm trên bản đồ và ≤ 6 nhóm mỗi trận. PixiJS để dành cho bản đồ chung P3, nơi có hàng trăm đội chuyển động.
- Không dùng UI kit: game cần bản sắc riêng.

**Hình ảnh**

- *Thanh lục sơn thủy* (青绿山水, như bức "Thiên Lý Giang Sơn Đồ"): núi lam khoáng chuyển lục, sương trắng ngăn các lớp xa gần.
- **HUD mực trong suốt viền vàng** nổi trên tranh sáng: tách rõ "thế giới" và "giao diện", đúng ngôn ngữ game mobile.
- **Thời gian thật**: trời đổi theo giờ máy người chơi. Bình minh 5–7h, ngày 7–17h, hoàng hôn 17–19h; ban đêm có trăng sao, cửa sổ và đèn lồng sáng.

## 2. Nguyên tắc UX

1. **Màn nào cũng trả lời "làm gì tiếp?"**: có bảng nhiệm vụ trên cùng, mũi tên vàng nhảy trên công trình cần làm, và nút Tạp dịch nhấp nháy khi rảnh.
2. **Mọi thứ diễn ra trong thế giới**:
   - chưa mở thì mây che, kèm khóa "Tầng N";
   - chưa xây thì hiện bóng mờ + nút búa;
   - đang xây thì có giàn tre, thợ gõ búa, đồng hồ trên đầu;
   - xong thì nổ tia vàng kèm chữ "Tầng N" và tiếng chuông.
3. **Có thưởng thì phải thấy thưởng**: nút "Nhận thưởng" phát sáng, số tài nguyên chạy lên, "+150" bay ra từ ô tài nguyên.
4. **Không làm được thì nói vì sao, kèm lối đi**: yêu cầu thiếu tô đỏ, có nút "Đi tới" dẫn thẳng tới Chủ điện.
5. **Quay lại là có quà**: màn Xuất quan tổng kết thời gian vắng, tài nguyên thu được, công trình đã xong.
6. **Mở dần theo tầng Chủ điện** (mục 4): tránh "quá nhiều hệ thống ngay từ đầu".
7. **Màu không phải tín hiệu duy nhất**: kho đầy có chữ "Đầy", khóa có biểu tượng và tầng cần đạt.

## 3. Bản đồ màn hình

```
Khởi động
├─ Lần đầu:  Tiêu đề (thư pháp 山河仙宗) → Lời dẫn 3 dòng → Đặt tên tông môn → đóng ấn → Núi
└─ Quay lại: Tiêu đề (tự qua sau 1.6 giây) → Xuất quan (nếu vắng > 1 phút) → Núi

宗 Tông môn — Núi (cuộn dọc nếu màn hình thấp)
├─ chạm công trình → Bảng công trình: thẻ Nâng cấp + thẻ chức năng
│    Diễn võ trường: Tuyển đệ tử · Đan phòng: Chữa thương, Luyện đan · Tàng Kinh Các: Công pháp
│    Chủ điện tầng 5, 10: Độ kiếp (thay nâng cấp) · tầng 15: Luân hồi
徒 Môn hạ (tầng 2) — trưởng lão (chạm → chi tiết, dùng Bồi Nguyên Đan) · bảng đệ tử 3 hệ × 3 bậc · thương binh
图 Bản đồ (tầng 3) — chạm yêu thú / tông môn / bí cảnh → Bảng mục tiêu: địch, hệ nên dùng, thưởng, chọn đội → Xuất quân
│    Chiến báo → Phát lại trận
宝 Bảo khố (tầng 3) — đan dược (dùng ngay), sản lượng, thành tích
盟 Tiên minh — khóa "sắp có" (P3)
HUD
├─ Trên: chân dung chưởng môn · tên · cảnh giới · Thế lực · ⚙ Cài đặt · 3 tài nguyên · Nhiệm vụ (chỉ ở tab Tông môn)
├─ Góc phải dưới: Tạp dịch (vòng tiến độ + đồng hồ; rảnh thì nhấp nháy)
├─ Góc trái dưới (tầng 3+): Nhiệm vụ ngày — 4 việc + rương, chấm đỏ đếm việc chờ nhận thưởng, làm mới 0h giờ VN
├─ Thông báo ngắn: công trình xong, đệ tử nhập môn, chiến báo mới (chạm để xem lại), mở khóa
└─ Thanh dưới 5 tab, có chấm đỏ: Môn hạ (thương binh chưa chữa), Bản đồ (chiến báo chưa đọc); tab vừa mở khóa mà chưa ghé có "!" vàng nhấp nháy
```

## 4. Mở khóa theo tầng Chủ điện

| Tầng | Mở ra |
|---|---|
| 1 | Tụ Linh Trận, Linh điền, Khoáng mạch |
| 2 | Tàng Bảo Các, Diễn võ trường, tab Môn hạ |
| 3 | Bản đồ, Bảo khố, Đan phòng (đánh nhau là có thương binh), Hắc Phong Trại, Thanh Mộc Bí Cảnh |
| 4 | Tàng Kinh Các |
| 5 → 6 | Độ kiếp lần đầu → **Trúc Cơ**, 2 đội xuất quân, Huyết Sát Môn |
| 7, 8 | Xích Viêm Bí Cảnh, Vạn Độc Cốc |
| 10 → 11 | Độ kiếp → **Kim Đan**, 3 đội xuất quân, Thiên Ma Giáo, Huyền Băng Bí Cảnh |
| 13 | Cửu U Điện |
| 15 | Luân hồi |
| (P3) | Tiên minh |

Diễn võ trường tầng 5 mở đệ tử Nội môn, tầng 10 mở Chân truyền. Mỗi lần Chủ điện lên tầng, thông báo "Mở khóa: …" liệt kê những gì vừa mở.

## 5. Luồng chính

### 5.1 Lần đầu chơi (đã làm tới bước nhiệm vụ)

| Bước | Người chơi thấy | Mục đích |
|---|---|---|
| Tiêu đề | Tranh núi buổi sớm, đề từ dọc 山河仙宗 + ấn đỏ đóng xuống, "Chạm để bắt đầu" | Ấn tượng đầu, chất thơ |
| Lời dẫn | 3 dòng hiện dần: linh khí khô kiệt… chỉ còn chủ điện đổ nát và bạn | Bối cảnh |
| Đặt tên | Ô tên + 3 gợi ý + "Gợi ý khác" → **Lập tông môn** → ấn lớn đóng giữa màn hình | Cảm giác sở hữu |
| Vào núi | Mây che các tầng chưa mở; mũi tên vàng trên Tụ Linh Trận | Biết ngay phải làm gì |
| Nhiệm vụ 1–15 | Xây/nâng theo chuỗi, mỗi lần xong có thưởng (`rules/data.ts` → `QUESTS`) | Dẫn 30 phút đầu, nhịp thưởng đều |

### 5.2 Phiên quay lại

Tiêu đề → Xuất quan → nhận thưởng nhiệm vụ → chạm Tạp dịch (tự cuộn tới việc nên làm) → nâng → đặt việc dài nhất → thoát.

### 5.3 Trạng thái công trình trên núi (đã làm)

| Trạng thái | Hiển thị |
|---|---|
| Chưa mở | Cụm mây tường vân + khóa "Tầng N"; mở khóa thì mây tan |
| Chưa xây | Bóng mờ công trình, nền nét đứt, nút búa nhún |
| Đang xây | Giàn tre, thợ gõ búa, bong bóng đồng hồ + thanh tiến độ |
| Vừa xong | Vòng sóng vàng, 12 tia sáng, chữ "Tầng N" bay lên, tiếng chuông, rung nhẹ (Android) |
| Đang sản xuất | Icon tài nguyên nổi lên định kỳ |
| Kho đầy | Nhãn đỏ "Đầy" trên công trình và ô tài nguyên |
| Đang chọn | Vòng vàng dưới chân |
| Hình theo tầng | Tầng 1–5 mái ngói; 6–10 mái lưu ly hai tầng; 11–15 mái vàng (Chủ điện có thêm hai điện phụ) |

### 5.4 Bảng công trình (đã làm)

Hình công trình trên nền trời · tên · tầng · lời dẫn → sản lượng/sức chứa hiện tại **→** tầng sau · thế lực tăng thêm → yêu cầu (✓/✗, nút "Đi tới") và chi phí (thiếu thì đỏ, ghi "có X") → nút **Nâng cấp** kèm thời gian. Đang xây thì hiện thanh tiến độ.

### 5.5 Bản đồ và xuất quân (đã làm)

Chạm yêu thú → Bảng mục tiêu (quân địch theo hệ, "Nên dùng Thể tu (khắc Kiếm tu)", chiến lợi phẩm) → chọn trưởng lão + kéo số đệ tử, xem lực chiến Ta/Địch và **tỉ lệ thắng ước lượng** (Áp đảo ≥ 80% / Ngang ngửa / Yếu thế < 35%: đánh thử 9 lần với mầm khác mầm thật, tính đủ hệ khắc và công pháp — lực chiến thô từng hiện "áp đảo" cho đội bị khắc hệ mà thua 1/4 số trận) → **Xuất quân** → lá cờ chạy trên đường nét đứt, danh sách đội ở dưới → tới nơi thì có thông báo "Thắng · Hắc Lang [Xem lại]" → đội về mang chiến lợi phẩm, thương binh vào Đan phòng.

- Yêu thú cấp tiếp theo có vòng sáng nhấp nháy; hạ rồi thì hang hiện đồng hồ "có lại sau".
- Bí cảnh đánh ngay tại chỗ (không hành quân), mở màn Phát lại luôn.
- **Phát lại trận:** địch trên, ta dưới; mỗi lượt số đệ tử giảm, "−12" bay lên; lượt 3, 6, 9 hiện tên công pháp trưởng lão. Có Tốc độ ×2 và Xem kết quả. Kết quả: thương binh, tử trận (Đan phòng hết chỗ), thu được, kinh nghiệm, trưởng lão mới.

### 5.6 Độ kiếp (đã làm)

Chủ điện tầng 5 (và 10) hiện bong bóng sét. Bảng Chủ điện thay nút nâng cấp bằng: lời dẫn, 3 đợt lôi kiếp (hệ + lực chiến), chi phí, tùy chọn Độ Kiếp Đan, chọn đội → **Độ kiếp** → về núi, trời tím sẫm, kiếp vân tụ trên Chủ điện, 3 tia sét (mỗi đợt một tia, có tiếng sấm, rung) → màn **ĐỘT PHÁ** với chữ Hán lớn 筑基 / 金丹 và hào quang; hoặc **Độ kiếp thất bại** kèm lối đi (chữa thương, tuyển thêm, luyện đan) và thử lại sau 10 phút. Chủ điện chỉ đổi hình sau khi sét đánh xong.

### 5.7 Luân hồi (đã làm)

Chủ điện tầng 15: bảng liệt kê Giữ lại / Làm lại và thưởng của kiếp sau → xác nhận 2 bước → chữ 轮回 xoay vào, "KIẾP THỨ 2" → về tầng 1, chuỗi nhiệm vụ chạy lại (nhận thưởng lần nữa).

### 5.8 Sau này

- **P3**: kiếp vân của người khác hiện trên bản đồ chung.

## 6. Hệ thiết kế

### Màu

- Cảnh núi: `--sky1/--sky2`, `--rock-top` (石绿) → `--rock` → `--rock-d` (石青), sương `--mist-c`. Mỗi thời điểm trong ngày (`.dawn`, `.dusk`, `.night` trong `Scene.svelte`) ghi đè các biến này.
- Vật liệu công trình: `--wall`, `--tile`, `--glaze`, `--stone*`, `--wood*`, `--spirit`… ở `client/src/app.css`; `art/` có bảng mặc định với độ ưu tiên thấp nhất.
- HUD: nền mực `rgb(13 24 31 / .75)`, viền vàng `--gold` `#C9A14A`, chữ vàng nhạt `--gold-l` `#F1D98F`, linh khí `--spirit-ui` `#6FD3DC`, cảnh báo `--cinnabar` `#C23B22`.
- Nút: chính lam `#2F6F9A → #1D4E73` viền vàng; thưởng/xác nhận vàng `#F8E3A0 → #C9A14A`; cả hai có "đế" 4px, nhấn thì lún xuống.

### Chữ

- **Be Vietnam Pro** 400/600 cho mọi chữ tiếng Việt.
- **Ma Shan Zheng** (bút lông) cho chữ Hán: đề từ màn tiêu đề, biển hiệu công trình, huy hiệu tab. Chỉ tải bộ con đúng các chữ có trong code. Thêm chữ thì chạy `npm run fonts -w client`.
- Cả hai font theo giấy phép OFL, tự host trong `client/public/fonts/`. Khi phát hành nhớ kèm `OFL.txt`.

### Ấn triện và biển hiệu

- Mỗi công trình treo **biển hiệu** (匾额) khắc chữ Hán vàng: 殿 阵 田 矿 库 武 经 丹.
- **Ấn đỏ** là khoảnh khắc nghi lễ: đóng xuống khi lập tông môn; là nhãn tầng trên bảng tên; là huy hiệu tab đang mở.

### Chuyển động

- **Nền (luôn chạy, chậm)**: sương trôi, mây, hạc bay, thác chảy, linh khí bay lên, khói lò đan, cờ bay, đệ tử luyện kiếm.
- **Phản hồi (nhanh, gọn)**: nhấn nút lún xuống, bảng trượt lên, số chạy (Tween), "+N" bay lên.
- **Khoảnh khắc lớn**: xây xong (tia vàng + chuông), lập tông môn (ấn đóng), sau này là đột phá cảnh giới.
- Bật giảm chuyển động (`prefers-reduced-motion`) thì tắt hết hiệu ứng nền và hiệu ứng lớn.

### Âm thanh (WebAudio, không cần file)

`tap` tiếng gõ khẽ · `build` hai tiếng mõ · `done` chuông (bồi âm lệch) · `reward` chuỗi ngũ cung · `march` trống trận · `hit` tiếng va chạm (nhiễu lọc) · `win` / `lose` · `thunder` sấm (nhiễu trầm + rung) · `err` tiếng trầm ngắn. Bật/tắt trong Cài đặt (nút ⚙ trên HUD), nhớ lựa chọn trên máy. Rung chỉ sau lần chạm đầu tiên.

**Nhạc nền** (`client/src/music.ts`, bật/tắt riêng): cổ phong sinh bằng máy — đàn tranh gảy giai điệu đi ngẫu nhiên trên ngũ cung Rê, đầu đoạn vuốt dây; sáo trúc thổi nốt dài có rung và tiếng hơi; trầm nền Rê–La; vang dựng từ nhiễu. 66 nhịp/phút, không đoạn nào lặp y hệt. Bắt đầu ở lần chạm đầu tiên, tắt tiếng khi ẩn tab. Mức đo bằng OfflineAudioContext: đỉnh ~0,13, RMS ~0,02 — dưới chuông "xong" để hiệu ứng vẫn nổi.

### Giọng văn

- Hán Việt cho thế giới (Xuất quan, Tạp dịch, Thế lực); tiếng Việt thường cho thao tác (Xây dựng, Nâng cấp, Nhận thưởng).
- Báo lỗi kèm lối đi: "Chủ điện tầng 4 ✗ [Đi tới]".
- Chữ nằm trong object `L` (`client/src/lib.ts`); khi dịch thì thêm `en` cùng kiểu.

## 7. Đa nền tảng

- Điện thoại dọc là chuẩn (đã thử 390×844). Núi cuộn dọc khi màn hình thấp hơn tỉ lệ 400:860.
- PC: cột 480px ở giữa, hai bên là trời nối tiếp. Sau này: bản đồ chiếm phần còn lại.
- Vùng an toàn qua `env(safe-area-inset-*)`.

## 8. Trợ năng

- Công trình là nút thật (`role="button"`, Tab/Enter/Space), có nhãn "Tụ Linh Trận, Tầng 3".
- Chữ Hán trang trí gắn `aria-hidden`; tài nguyên có tên ẩn cho trình đọc màn hình.
- Không đọc liên tục đồng hồ đếm ngược (không dùng `aria-live`).

## 9. Việc UI tiếp theo

Đã xong: Cài đặt (xuất/nhập save, chơi lại), Môn hạ, Diễn võ trường, Đan phòng, Tàng Kinh Các, Bản đồ + Phát lại, Độ kiếp, Luân hồi, Bảo khố, PWA (manifest, icon ấn 宗, chơi offline), màn lỗi có nút xuất save.

1. Bản tiếng Anh (`en` cùng kiểu `vi` trong `lib.ts`) + chọn theo ngôn ngữ máy.
2. Thử trên điện thoại thật: cỡ chữ nhỏ nhất, vùng chạm của nút trên bản đồ, hiệu năng cảnh núi khi nhiều hoạt ảnh.
3. Nhiệm vụ ngày (P1 → P2) khi có dữ liệu retention.
