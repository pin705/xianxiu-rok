# Game flow & UI/UX

> Đi kèm [PLAN.md](PLAN.md). Chạy thử: `npm run dev` → http://localhost:5173

## 1. Hướng đi

**Màn chính là một thế giới, không phải một danh sách.** Người chơi *thấy* tông môn của mình: một ngọn núi thanh lục sơn thủy, công trình dựng trên từng tầng núi, sương trôi giữa các tầng, thác nước, hạc bay ngang trời, linh khí bay lên. Mọi việc diễn ra ngay trong thế giới đó (xây, chờ, xong). Cách này giống thành phố của RoK.

**Công nghệ**

- **Hình vẽ tay sinh bằng mã** (`packages/art` = `@rok/art`, không phụ thuộc game): một "bút lông" (`brush.ts`: nét có lực đầu đinh đuôi chuột, mép sần, cuối nét khô tách sợi 飞白, mảng màu loang nhiều lớp, mép sắc tố đậm, hạt giấy) vẽ mọi thứ — núi (`landscape.ts`), công trình lối 界画 (`buildings.ts`), mây, tùng, hạc, bản đồ, icon vật phẩm (`icons.ts`), icon thao tác nét bút (`actions.ts`), chân dung trưởng lão, quân lính và yêu thú (`figures.ts`), huy hiệu và icon tab (`emblems.ts`), sân trận, và cả **da giao diện** (`chrome.ts`: khung cuộn tranh bồi lụa, thẻ giấy mép xơ, nút sơn loang, ván sơn mài viền vàng, nhãn, thanh tiến độ, công tắc, đĩa tròn; `ui.ts`: sơn mài, nét gạch chân, vết mực chuyển cảnh). Nướng một lần ra texture ở đúng độ nét màn hình (~30 ms cho cả bộ công trình); icon/chân dung trong HTML qua `paintedUrl` (`img.ts`).
- **Cảnh núi, bản đồ và trận đánh chạy WebGL** (PixiJS, `apps/client/src/world/`): texture tĩnh + chuyển động trên GPU (sương trôi, thác, hạc, khói lò, lửa, cột linh khí, đèn đêm, sét độ kiếp). Cuộn bằng lớp cuộn gốc của trình duyệt (quán tính như app thật); biển tên/đồng hồ là HTML dịch cùng camera trong cùng khung hình (`View.svelte`). Phát lại trận (`battle.ts`) mượn chung canvas: hai đội vẽ tay xông lên mỗi lượt, kiếm khí / hoả cầu / sóng chấn / vuốt / sét, chớp sáng, rung màn, quân ngã theo thương vong; công pháp có hiệu ứng riêng (mưa kiếm, khiên vàng, hồi sinh, độc vụ); sân theo cảnh (hoang dã, rừng, hoả sơn, băng nguyên, kiếp vân). Phòng thử art: `/lab.html?view=buildings|icons|faces|troops|decor|chrome|medals|fx|battle` (bản dev; `battle&kind=sect|beast|trib&t=0.4&skill=…` đứng hình trận thật ở giây t).
- **VFX cũng là nét bút, không phải quầng gradient** (`fx.ts`: kiếm khí, hoả cầu, vuốt, vòng 圆相, tia trúng đòn, sét, vệt mưa kiếm, khói mực; `stage.ts` → `ink()`): mỗi hiệu ứng là một hình trắng vẽ ba bề ngang, ghép ba lớp — **bóng mực** (thường) → **sắc khoáng** (thường) → **lõi sáng** (cộng). Trên giấy sáng mà chỉ cộng sáng thì hình bị loá mất; lớp mực giữ dáng, chỉ lõi mới phát sáng. Hiệu ứng tan bằng **khung khô dần** (`DRY`: vẽ lại với độ khô tăng, đuôi nét tước sợi rồi hết, đầu nét vẫn đậm) thay cho mờ dần đều; lửa lò là ba khung lưỡi lửa thay nhau. Mặt trời son, trăng, linh châu, cờ quân trên bản đồ, nét đứt đường đi đều vẽ tay; chỉ ánh sáng thật (đèn, cột linh khí, tia nắng, sương) còn dùng quầng mềm.
- **HTML cho HUD và bảng**, dựng từ design system `apps/client/src/ui/` (mục 6): chữ tiếng Việt, co giãn, trình đọc màn hình tốt hơn canvas.
- Không dùng UI kit bên ngoài: game cần bản sắc riêng.

**Hình ảnh**

- *Thanh lục sơn thủy* (青绿山水, như bức "Thiên Lý Giang Sơn Đồ"): núi lam khoáng chuyển lục, sương trắng ngăn các lớp xa gần.
- **HUD sơn mài viền vàng, bảng giấy khung mực**: tách rõ "thế giới" (tranh) và "giao diện" (đồ vật trong tông môn), không kính mờ bo tròn kiểu web.
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
├─ Lần đầu:  Tiêu đề (huy hiệu núi – mặt trời son) → Lời dẫn 3 dòng → Đặt tên tông môn → huy hiệu đập xuống → Núi
└─ Quay lại: Tiêu đề (tự qua sau 1.6 giây) → Xuất quan (nếu vắng > 1 phút) → Núi

Tông môn — Núi (cuộn dọc nếu màn hình thấp)
├─ chạm công trình → Bảng công trình: thẻ Nâng cấp + thẻ chức năng
│    Diễn võ trường: Tuyển đệ tử · Đan phòng: Chữa thương, Luyện đan · Tàng Kinh Các: Công pháp
│    Chủ điện tầng 5, 10: Độ kiếp (thay nâng cấp) · tầng 15: Luân hồi
Môn hạ (tầng 2) — trưởng lão (chạm → chi tiết, dùng Bồi Nguyên Đan) · bảng đệ tử 3 hệ × 3 bậc · thương binh
Bản đồ (tầng 3) — chạm yêu thú / tông môn / bí cảnh → Bảng mục tiêu: địch, hệ nên dùng, thưởng, chọn đội → Xuất quân
│    Chiến báo → Phát lại trận
Bảo khố (tầng 3) — đan dược (dùng ngay), sản lượng, thành tích
Tiên minh — khóa "sắp có" (P3)
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

Diễn võ trường tầng 5 mở đệ tử Nội môn, tầng 10 mở Chân truyền. Bảng tuyển mặc định chọn hệ tuyển được nhiều nhất với tài nguyên đang có: mỗi hệ ăn chủ yếu một loại (Kiếm tu → Linh khoáng), người mới cứ bấm hệ mặc định từng cạn khoáng còn hai loại kia đầy kho. Mỗi lần Chủ điện lên tầng, thông báo "Mở khóa: …" liệt kê những gì vừa mở.

## 5. Luồng chính

### 5.1 Lần đầu chơi (đã làm tới bước nhiệm vụ)

| Bước | Người chơi thấy | Mục đích |
|---|---|---|
| Tiêu đề | Tranh núi buổi sớm, huy hiệu tông môn vẽ tay đập xuống, tên game viết nghiêng gạch nét vàng, "Chạm để bắt đầu" trên dải mực | Ấn tượng đầu, chất thơ |
| Lời dẫn | 3 dòng hiện dần: linh khí khô kiệt… chỉ còn chủ điện đổ nát và bạn | Bối cảnh |
| Đặt tên | Ô tên + 3 gợi ý + "Gợi ý khác" → **Lập tông môn** → huy hiệu son lớn đập xuống giữa màn hình | Cảm giác sở hữu |
| Vào núi | Mây che các tầng chưa mở; mũi tên vàng trên Tụ Linh Trận | Biết ngay phải làm gì |
| Nhiệm vụ 1–15 | Xây/nâng theo chuỗi, mỗi lần xong có thưởng (`packages/rules/data.ts` → `QUESTS`) | Dẫn 30 phút đầu, nhịp thưởng đều |

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

Chạm yêu thú → Bảng mục tiêu (quân địch theo hệ, "Nên dùng Thể tu (khắc Kiếm tu)", chiến lợi phẩm) → chọn trưởng lão + kéo số đệ tử, xem lực chiến Ta/Địch và **tỉ lệ thắng ước lượng** (Áp đảo ≥ 80% / Ngang ngửa / Yếu thế < 35%: đánh thử 9 lần với mầm khác mầm thật, tính đủ hệ khắc và công pháp — lực chiến thô từng hiện "áp đảo" cho đội bị khắc hệ mà thua 1/4 số trận); Yếu thế mà vẫn còn quân thì có nút **Tuyển đệ tử** ngay dưới → **Xuất quân** → lá cờ chạy trên đường nét đứt, danh sách đội ở dưới → tới nơi thì có thông báo "Thắng · Hắc Lang [Xem lại]" → đội về mang chiến lợi phẩm, thương binh vào Đan phòng.

- Yêu thú cấp tiếp theo có vòng sáng nhấp nháy; hạ rồi thì hang hiện đồng hồ "có lại sau".
- Bí cảnh đánh ngay tại chỗ (không hành quân), mở màn Phát lại luôn.
- **Phát lại trận:** địch trên, ta dưới; mỗi lượt số đệ tử giảm, "−12" bay lên; lượt 3, 6, 9 hiện tên công pháp trưởng lão. Có Tốc độ ×2 và Xem kết quả. Kết quả: thương binh, tử trận (Đan phòng hết chỗ), thu được, kinh nghiệm, trưởng lão mới.

### 5.6 Độ kiếp (đã làm)

Chủ điện tầng 5 (và 10) hiện bong bóng sét. Bảng Chủ điện thay nút nâng cấp bằng: lời dẫn, 3 đợt lôi kiếp (hệ + lực chiến), chi phí, tùy chọn Độ Kiếp Đan, chọn đội → **Độ kiếp** → về núi, trời tím sẫm, kiếp vân tụ trên Chủ điện, 3 tia sét (mỗi đợt một tia, có tiếng sấm, rung) → màn **ĐỘT PHÁ** với huy hiệu hoa sen vẽ tay và hào quang; hoặc **Độ kiếp thất bại** kèm lối đi (chữa thương, tuyển thêm, luyện đan) và thử lại sau 10 phút. Chủ điện chỉ đổi hình sau khi sét đánh xong.

### 5.7 Luân hồi (đã làm)

Chủ điện tầng 15: bảng liệt kê Giữ lại / Làm lại và thưởng của kiếp sau (khởi đầu với công trình tầng mấy, sản lượng, tốc độ xây) → xác nhận 2 bước → huy hiệu luân hồi (xoáy vàng) xoay vào, "KIẾP THỨ 2" → về tầng 1, chuỗi nhiệm vụ chạy lại (nhận thưởng lần nữa).

### 5.8 Sau này

- **P3**: kiếp vân của người khác hiện trên bản đồ chung.

## 6. Hệ thiết kế

Nguồn màu duy nhất là `PIGMENT` trong `packages/art/palette.ts` (màu khoáng: mực, giấy, 石青, 石绿, 赭石, 朱砂, vàng lá, sơn mài). `apps/client/src/ui/theme.ts` bơm chúng thành biến CSS (`--ink`, `--azurite-d`…) rồi **vẽ toàn bộ da giao diện bằng bút lông** (`packages/art/chrome.ts`) một lần lúc khởi động (~60 ms, song song với chờ font) và bơm thành biến: `--sk-*` là giá trị `border-image` 9 mảnh đủ bộ, `--img-*` là ảnh nguyên tấm (đĩa, công tắc, chấm dẫn). Da vẽ ở độ nét màn hình (2–3×), thành blob URL (không chặn luồng chính). `ui/theme.css` giữ token (chữ, khoảng cách, bóng, chuyển động, lớp), vài tiện ích bố cục (`.stack`, `.row`, `.grid`, `.t-*`) và ba lớp chất liệu `.scroll-skin` `.card-skin` `.plank`.

**Quy tắc:** màn hình chỉ ghép component trong `ui/` + tiện ích bố cục; không tự đặt màu, bo góc, bóng, viền CSS. Mặt nào cần "khung" thì dùng da vẽ tay (`border: 0 solid; border-image: var(--sk-…)` — bề dày 0 nên da vẽ đè lên vùng đệm, bố cục do padding quyết định). Cần kiểu mới thì vẽ thêm da trong `chrome.ts` rồi đưa vào `theme.ts`, không vẽ bằng CSS.

**Không dùng chữ Hán** trong giao diện: mọi dấu, huy hiệu, biển hiệu là hình vẽ tay (xem dưới).

### Chất liệu (vẽ bằng bút lông)

- **Cuộn tranh bồi lụa** (bảng dưới, hộp giữa, trang): viền lụa lam xám dệt sợi, chỉ vàng 隔水, giấy ố vàng dọc mép, khung mực đôi kẻ tay (nét dưới/phải đậm hơn theo hướng sáng), mây cuộn son ở góc; bảng dưới có trục gỗ sơn mài hai đầu bịt đồng chạm hoa.
- **Thẻ giấy mép xơ** (mục danh sách, ô thông tin, nhiệm vụ): mép giấy xé, bóng nhấc khỏi mặt bảng, viền mực kẻ tay vượt góc; biến thể vàng (có mây cuộn góc), son (đang chọn), sơn mài.
- **Ván sơn mài viền vàng** (HUD trên, thanh tab): vân gỗ ngang, vệt bóng sơn, chỉ vàng đôi kẻ tay, ke góc đồng có đinh tán.
- **Nút sơn loang**: mảng màu khoáng loang nhiều lớp, mép sắc tố dồn đậm, thớ bút khô, vảy vàng lá (nút vàng), viền mực dày mỏng; nhấn thì lún, luôn phát tiếng gõ; nút vàng có vệt sáng lướt.
- **Nhãn, huy hiệu số, thanh tiến độ, ô nhập, công tắc, đĩa tròn, thông báo**: mẩu giấy viền mực; giọt son viền vàng; rãnh mực + nét bút màu đầu khô tước sợi; gạch chân mực; núm đĩa giấy vòng mực một nét (圆相); đĩa sơn mài/giấy/lam/vàng; dải mực quét ngang tước sợi.

### Hình vẽ tay thay cho chữ

- **Huy hiệu** (`Medal`, `emblems.ts`): đĩa màu khoáng loang, vòng vàng một nét, hình chạm giữa đĩa — 15 yêu thú (sói, rắn, gấu, hồ ly, đại bàng, vượn, lang vương, báo lửa, tê giáp, cửu vĩ hồ, ưng sấm, rùa, bạch hổ, phượng băng, giao long), 5 tông môn (gió xoáy, giọt máu trên kiếm, bọ cạp độc, mặt quỷ, lửa u linh), 3 bí cảnh (cây, lửa, băng), lôi kiếp, 3 hệ đệ tử (kiếm, hoả cầu, nắm đấm), và khoảnh khắc: thắng (kiếm chéo toả tia), bại (kiếm gãy), luân hồi (xoáy vàng), đột phá (hoa sen), tông môn (núi – mặt trời son), xong nhiệm vụ (dấu tích son).
- **Icon tab** (điện các hai tầng mái, đệ tử áo lam, bản đồ trải, cờ minh ước bắt chéo, rương báu) và **icon thao tác** nét bút (`actions.ts`): đơn sắc là mặt nạ tô bằng màu chữ; cuộn sách, lò đan, cờ, bầu thuốc, sét, sao là ảnh nhiều màu.
- **Biển hiệu công trình** (gỗ lam viền vàng): hoa văn vàng theo loại — mây cuộn, vòng trận, bông lúa, tinh thể, đồng tiền, kiếm chéo, sách, bầu đan.

### Component (`apps/client/src/ui/`)

Button · IconButton · Sheet (cuộn tranh: bảng dưới / hộp giữa, vuốt để đóng) · Page · Card · Section (tiêu đề gạch chân nét bút) · Tabs · Stat (dòng sổ sách có chấm mực dẫn) · Bag (chi phí/phần thưởng, thiếu tô đỏ) · Tag · Meter · Badge · Medal (huy hiệu vẽ tay) · Slider · Stepper · Toggle · Toasts · Plate/Bubble/Hint/Pointer (ghim trên cảnh) · Painting (hình vẽ tay trong HTML).

### Cảm giác chạm

- Bảng dưới vuốt trục/đầu bảng xuống để đóng; đóng bằng × / chạm nền / Esc thì cuộn giấy trượt xuống rồi mới tắt.
- Chuyển tab: vết mực loang ra từ chỗ chạm (View Transitions; trình duyệt chưa hỗ trợ thì chuyển ngay).
- Nhận thưởng (nhiệm vụ, nhiệm vụ ngày, Xuất quan): icon bay theo đường cong vào đúng ô tài nguyên / tab Bảo khố, ô đích nảy lên (`ui/fly.ts`). Nhiệm vụ vừa xong được giữ lại một nhịp để dấu tích son vẽ tay đóng lên, rồi nhiệm vụ mới trượt vào.
- Chạm công trình: nén xuống rồi bật lên (chân đứng yên), bụi toả hai bên.
- Nút vàng thỉnh thoảng có vệt sáng lướt qua mặt kim; thông báo hiện ra như một nét bút quét từ trái sang.

### Chữ

- **Alegreya** (serif có nét bút, variable 400–900, có tiếng Việt) cho toàn bộ chữ; số dùng `tabular-nums lining-nums`.
- Font OFL, tự host trong `apps/client/public/fonts/` kèm file giấy phép; `npm run fonts` sinh lại bộ font theo hệ chữ.

### Chuyển động

- **Nền (luôn chạy, chậm)**: sương trôi, mây, hạc bay, đàn chim nhỏ, thác chảy, linh khí bay lên, khói lò đan, cờ bay, đệ tử luyện kiếm; đệ tử lên xuống bậc đá nối các tầng; cánh mai rơi; bướm và tia nắng xiên ban ngày; đèn đá, cửa sổ lên đèn và đom đóm ban đêm; Tụ Linh Trận hút linh khí xoáy vào tâm trận; công trình sản xuất nhả vật phẩm vẽ tay bay lên (kho đầy thì thôi); đang xây có tia lửa búa và bụi đá. Mép cảnh tối dần như khung tranh. Bản đồ: ánh nước trôi xuôi dòng sông, bóng mây lướt chậm, hạc bay ngang; quân hành quân nhún bước, tung bụi.
- **Phản hồi (nhanh, gọn)**: nhấn nút lún xuống, bảng trượt lên, số chạy (Tween), "+N" bay lên.
- **Khoảnh khắc lớn**: lên tầng (cột sáng vàng, sóng vòng, tia vàng rơi theo trọng lực, loé sáng); lập tông môn (huy hiệu son đập xuống); **độ kiếp**: trời chuyển dần sang kiếp vân — xoáy mây tím hai lớp quay hút vào mắt bão, chớp trong mây, mưa xiên, mỗi đợt sét phân nhánh đánh xuống mái Chủ điện (loé trắng, rung cảnh, đợt cuối lớn nhất); đột phá thành công thì cột sáng vàng cao tận trời kèm hào quang toả tia.
- **Trận đánh**: mỗi đòn theo nhịp *bung (vượt cỡ rồi thu) → bay → trúng → khô tan*; kiếm khí để lại vệt nét khô phía sau, hoả cầu uốn đuôi lửa theo quỹ đạo và rơi tàn lửa, thể tu dậm nứt đất (vòng 圆相 lan ra); đòn nặng khựng khung ~70 ms (hit-stop) trong khi màn vẫn rung; trúng đòn thì mực văng (son khi quân ta trúng), tia lửa toé, đội bị bật lùi, rung màn; đòn nặng giật zoom camera; quân ngã tan thành mực. Công pháp xuất chiêu: một nét mực lớn quét ngang màn (hai đầu bút khô tước sợi) với chân dung trưởng lão trong khung vàng và tên chiêu viết lớn (địch: nét mực son). Độ kiếp sang đợt mới: huy hiệu lôi kiếp loang ra. Hết trận: huy hiệu thắng / bại đập xuống kèm vệt mực, rồi bảng kết quả trồi lên.
- Bật giảm chuyển động (`prefers-reduced-motion`) thì tắt hết hiệu ứng nền, rung và giảm loé sáng.

### Âm thanh (WebAudio, không cần file)

`tap` tiếng gõ khẽ · `build` hai tiếng mõ · `done` chuông (bồi âm lệch) · `reward` chuỗi ngũ cung · `march` trống trận · `hit` tiếng va chạm (nhiễu lọc) · `win` / `lose` · `thunder` sấm (nhiễu trầm + rung) · `err` tiếng trầm ngắn · `stamp` ấn gỗ dập xuống giấy · `whoosh` gió vút khi xuất chiêu (nhiễu lọc quét). Bật/tắt trong Cài đặt (nút ⚙ trên HUD), nhớ lựa chọn trên máy. Rung chỉ sau lần chạm đầu tiên.

**Nhạc nền** (`apps/client/src/music.ts`, bật/tắt riêng): cổ phong sinh bằng máy — đàn tranh gảy giai điệu đi ngẫu nhiên trên ngũ cung Rê, đầu đoạn vuốt dây; sáo trúc thổi nốt dài có rung và tiếng hơi; trầm nền Rê–La; vang dựng từ nhiễu. 66 nhịp/phút, không đoạn nào lặp y hệt. Bắt đầu ở lần chạm đầu tiên, tắt tiếng khi ẩn tab. Mức đo bằng OfflineAudioContext: đỉnh ~0,13, RMS ~0,02 — dưới chuông "xong" để hiệu ứng vẫn nổi.

### Giọng văn

- Hán Việt cho thế giới (Xuất quan, Tạp dịch, Thế lực); tiếng Việt thường cho thao tác (Xây dựng, Nâng cấp, Nhận thưởng).
- Báo lỗi kèm lối đi: "Chủ điện tầng 4 ✗ [Đi tới]".
- Chữ nằm trong `packages/i18n/locales/*.ts` (object `L` qua `apps/client/src/lib.ts`); thêm ngôn ngữ xem [README](../README.md) mục Đa ngôn ngữ.

## 7. Đa nền tảng

- Điện thoại dọc là chuẩn (đã thử 390×844). Núi cuộn dọc khi màn hình thấp hơn tỉ lệ 400:860.
- **Desktop** (màn ≥ 1024 × 600 — cùng một điều kiện ở CSS `@media (min-width: 1024px) and (min-height: 600px)` và `DESK` trong `lib.ts`):
  - Thanh trên trải hết bề ngang: hồ sơ tông môn | 3 tài nguyên + sức chứa | thế lực | nhiệm vụ ngày | chiến báo | cài đặt.
  - Cột trái ~300px (`--rail`): điều hướng dọc 5 tab (phím tắt 1–5), thẻ nhiệm vụ, mục **Đang diễn ra** liệt kê mọi việc đang chạy (xây, tuyển, chữa, nghiên cứu, luyện, hành quân) kèm đồng hồ.
  - Giữa: cảnh núi / bản đồ co theo bề ngang vùng giữa (tối đa 600px mỗi 400 DU — `cssPerDU()`, `sceneX()` trong `world/stage.ts`; `View.svelte` đặt lề trái bằng JS, không căn giữa bằng CSS).
  - Bảng công trình, mục tiêu, cài đặt… là **ngăn kéo ghim bên phải** (~440px, `--dock`): mở không chặn (núi vẫn thấy và bấm được, chọn công trình khác thì ngăn kéo đổi nội dung), trượt từ phải, Esc để đóng; hộp giữa (`center`) vẫn chặn như trên điện thoại. Khi có ngăn kéo, `--dockw` ghi lên `<html>` để cảnh nhường chỗ.
  - Trang Môn hạ / Bảo khố rộng tối đa ~1000px, lưới 3 cột.
  - Mọi mặt vẫn là da vẽ tay như trên điện thoại (ván sơn mài cho thanh trên và cột trái, cuộn tranh cho ngăn kéo); token bố cục trong `theme.css`: `--rail` (0 / 300px), `--top` (0 / 84px), `--dock` (440px).
- Vùng an toàn qua `env(safe-area-inset-*)`.

## 8. Trợ năng

- Công trình là nút thật (`role="button"`, Tab/Enter/Space), có nhãn "Tụ Linh Trận, Tầng 3".
- Chữ Hán trang trí gắn `aria-hidden`; tài nguyên có tên ẩn cho trình đọc màn hình.
- Không đọc liên tục đồng hồ đếm ngược (không dùng `aria-live`).

## 9. Việc UI tiếp theo

Đã xong: Cài đặt (xuất/nhập save, chơi lại, Cẩm nang 8 mục gập mở — số liệu lấy thẳng từ `rules` nên đổi cân bằng là chữ tự đúng), Môn hạ, Diễn võ trường, Đan phòng, Tàng Kinh Các, Bản đồ + Phát lại, Độ kiếp, Luân hồi, Bảo khố, PWA (manifest, icon, chơi offline), màn lỗi có nút xuất save.

1. Bản tiếng Anh (`en` cùng kiểu `vi` trong `lib.ts`) + chọn theo ngôn ngữ máy.
2. Thử trên điện thoại thật: cỡ chữ nhỏ nhất, vùng chạm của nút trên bản đồ, hiệu năng cảnh núi khi nhiều hoạt ảnh.
3. Nhiệm vụ ngày (P1 → P2) khi có dữ liệu retention.
