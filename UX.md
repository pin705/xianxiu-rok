# Game flow & UI/UX

> Đi kèm [PLAN.md](PLAN.md). Chạy thử: `npm run dev` → http://localhost:5173

## 1. Hướng đi

**Màn chính là một thế giới, không phải một danh sách.** Người chơi *thấy* tông môn của mình: một ngọn núi thanh lục sơn thủy, công trình dựng trên từng tầng núi, sương trôi giữa các tầng, thác nước, hạc bay ngang trời, linh khí bay lên. Mọi việc diễn ra ngay trong thế giới đó (xây, chờ, xong). Cách này giống thành phố của RoK.

**Công nghệ**

- **Svelte 5 + SVG vẽ tay** cho cảnh núi và công trình (`art/` = package `@rok/art`). Không cần file ảnh: hình sinh theo tham số, màu đọc từ CSS var nên đổi ngày/đêm chỉ cần đổi biến.
- **HTML/CSS cho HUD và bảng**: chữ tiếng Việt có dấu, co giãn, trình đọc màn hình đều tốt hơn canvas.
- **PixiJS chỉ dùng cho bản đồ thế giới và phát lại trận đánh** (mốc 1.2), nơi có hàng trăm vật thể chuyển động.
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

Núi (cuộn dọc nếu màn hình thấp)
├─ chạm công trình → Bảng công trình (trượt từ dưới lên)
HUD
├─ Trên: chân dung chưởng môn · tên · cảnh giới · Thế lực · âm thanh · 3 tài nguyên · Nhiệm vụ
├─ Góc phải dưới: Tạp dịch (vòng tiến độ + đồng hồ; rảnh thì nhấp nháy)
└─ Thanh dưới 5 tab: 宗 Tông môn · 徒 Môn hạ (tầng 2) · 图 Bản đồ (tầng 3) · 盟 Tiên minh (tầng 6) · 宝 Bảo khố (tầng 3)
```

## 4. Mở khóa theo tầng Chủ điện

| Tầng | Mở ra |
|---|---|
| 1 | Tụ Linh Trận, Linh điền, Khoáng mạch |
| 2 | Tàng Bảo Các, Diễn võ trường, tab Môn hạ |
| 3 | Bản đồ, Bảo khố |
| 4 | Tàng Kinh Các, Đan phòng |
| 5 → 6 | Độ kiếp lần đầu → **Trúc Cơ** |
| 6+ | (P3) Tiên minh |
| 10 → 11 | Độ kiếp → **Kim Đan** |

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

### 5.5 Sau này

- **Bản đồ + xuất quân** (mốc 1.2): chạm yêu thú → chọn đội → quân đi → trận tự động → phát lại → chiến báo.
- **Độ kiếp** (mốc 1.3): trời tối trên núi, kiếp vân tụ trên Chủ điện, 3 đợt lôi kiếp → màn đột phá "TRÚC CƠ".
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

`tap` tiếng gõ khẽ · `build` hai tiếng mõ · `done` chuông (bồi âm lệch) · `reward` chuỗi ngũ cung. Có nút tắt/bật trên HUD, nhớ lựa chọn trên máy.

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

1. Cài đặt: xuất/nhập save (Safari có thể xóa dữ liệu web ít mở).
2. Tab Môn hạ + tuyển đệ tử tại Diễn võ trường.
3. Độ kiếp ở tầng 5 (kiếp vân trên Chủ điện).
4. PWA: manifest + icon ấn 宗.
