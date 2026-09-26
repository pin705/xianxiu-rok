# 1. Thành phố & kinh tế — Rise of Kingdoms → Sơn Hà Tiên Tông

> Nghiên cứu ngày 24/09/2026. Phạm vi: mọi công trình trong thành, Tòa thị chính 1–25 và thời đại, tài nguyên, hàng đợi và tăng tốc, VIP, túi đồ (mọi loại vật phẩm), cửa hàng, buff thành, thành bị đánh, trang trí/skin/danh hiệu, gems của RoK bản global hiện hành. Đối chiếu với mã hiện tại (tới commit `3c0f878`; túi đồ và Trung tâm sự kiện có từ `776ddfa`): `packages/rules/data.ts` (`BUILDINGS`, `BAG`, `FESTS`, `PROTECT`, `ALLY_HELPS`, `TRADE_KEEP`…), `packages/rules/sect/{buildings,bag}.ts`, `packages/rules/world/{alliance,raid,market}.ts`, `docs/PLAN.md` mục 3, `docs/UX.md`.
>
> **Độ tin cậy số liệu RoK:** **[2 nguồn]** = ít nhất 2 nguồn khớp · **[1 nguồn]** · **[mâu thuẫn]** = nguồn lệch nhau, ghi cả hai · **[suy ra]** = tự tính/suy từ số của nguồn · **[chưa xác minh]** = theo hiểu biết chung về RoK, chưa đọc được nguồn để kiểm. Phải kiểm lại trong game trước khi dựa vào.
>
> **Game mình:** ✅ có tương đương · 🟡 có một phần · ❌ chưa có · ⛔ thuộc danh sách "Không làm" (PLAN mục 1) hoặc trái nguyên tắc "không P2W" (vẫn ghi cho đủ danh mục).
> **Ưu tiên:** P0 cốt lõi (thiếu là không ra chất RoK) · P1 quan trọng · P2 thêm hương vị. **Công sức** (một người, đã quen codebase): S ≤ 2–3 ngày · M ~1–2 tuần · L > 2 tuần.
>
> **Giới hạn nguồn:** wiki fandom trả HTTP 402, rok.guide trả 503 suốt phiên, nên không đọc trực tiếp được; số của fandom chỉ có qua đoạn trích kết quả tìm kiếm. Hạn mức tìm kiếm web của phiên hết giữa chừng, phần sau đọc thẳng các trang đã biết (riseofkingdomsguides, rokstats, gamesguideinfo, heaven-guardian, riseofkingdomshandbook…). Patch note đọc được tới 1.0.91 (02/2025); thay đổi 2025–2026 chỉ thấy qua các hướng dẫn ghi năm 2026. Bảng của gamesguideinfo có chỗ lệch cột, chỉ dùng khi kiểm chéo được. Một số trang 2026 (heaven-guardian, handbook) viết chung chung, chỉ dùng làm nguồn phụ. Mô tả UI của RoK là mô tả chức năng; vị trí nút cụ thể có thể khác.

---

## 1. Tóm tắt mảng

### 1.1 Vai trò trong vòng lặp chơi của RoK

Thành phố là "động cơ" của cả tài khoản. Mọi đạo quân, mọi cấp nghiên cứu, mọi lần hồi máu đều đi ra từ thành. Tòa thị chính (City Hall, CH) là trần cấp của mọi thứ. Bản đồ là nơi kiếm phần lớn tài nguyên, còn thành là nơi tiêu chúng.

| Nhịp | Người chơi làm gì với thành & kinh tế |
|---|---|
| Mỗi phiên (vài phút) | Chạm bong bóng thu tài nguyên → giao việc cho 2 thợ xây, 1 hàng nghiên cứu, 4 trại lính, bệnh viện → bấm "nhờ giúp" rồi "giúp tất cả" → mở rương bạc miễn phí ở Tửu quán → xem Thương nhân bí ẩn → gửi quân đi thu thập |
| Mỗi ngày | Điểm danh VIP (tới 200 điểm/ngày), mở rương VIP (từ VIP 10 có tượng huyền thoại), làm nhiệm vụ hằng ngày (100 điểm hoạt động = 100 gem), tiêu điểm cá nhân ở cửa hàng liên minh |
| Mỗi tuần | Cửa hàng VIP làm mới, cửa hàng viễn chinh xoay mặt hàng, câu đố Lyceum (thứ Bảy), gom tăng tốc để dành cho sự kiện tính điểm |
| Nhiều tháng | Đua CH 16 (T3) → 17 (đủ điều kiện KvK) → 21 (T4) → 25 (T5). Riêng Tòa thị chính 2 → 25 cần ~246M lương, ~246M gỗ, ~107M đá và ~257 ngày xây gốc [suy ra từ bảng rokstats]. CH 17–25 chiếm ~240 ngày trong đó |

Thời gian xây dài khủng khiếp nên thứ quyết định tốc độ không phải tài nguyên mà là **tăng tốc**: vật phẩm tăng tốc, lượt giúp của liên minh, buff VIP, danh hiệu của vua. Mọi hệ thống kinh tế khác đều quy về việc tạo và tiêu những thứ đó. Thành cũng là **mục tiêu**: phần tài nguyên vượt mức bảo hộ của Nhà kho bị cướp được, tường mất độ bền, thành cháy, về 0 thì bị ném sang chỗ khác.

### 1.2 Vì sao người chơi thích

- **Thấy mình lớn lên.** Thành đổi diện mạo qua 5 thời đại (Đồ Đá → Phong Kiến), công trình mọc thêm (4 nông trại, 4 bệnh viện…), số lực chiến nhảy sau mỗi lần nâng.
- **Lúc nào cũng có việc.** 2 thợ + nghiên cứu + 4 trại lính + bệnh viện + lò rèn chạy song song. Mở game là có thứ để nhận, để giao.
- **Cảm giác chạm.** Bong bóng tài nguyên, rương, "+N" bay ra, âm thanh thu hoạch. Thói quen nhỏ lặp mỗi phiên.
- **Mưa phần thưởng có lịch.** Thưởng mỗi cấp CH, rương VIP hằng ngày, thương nhân lúc 0h UTC, rương bạc miễn phí, cửa hàng làm mới hằng tuần. Luôn có lý do quay lại.
- **Mục tiêu dài.** CH 25 và T5 là "đỉnh núi" nhiều tháng. VIP 6/10/14 là các mốc ai cũng biết.
- **Chơi cùng nhau.** Giúp đỡ liên minh bớt thời gian cho nhau, và được trả điểm cá nhân để mua đồ.
- **An toàn có điều kiện.** Khiên, Nhà kho, túi đồ (tài nguyên trong túi không bị cướp) cho người chơi quyền tự bảo vệ, nên mất mát là do mình chủ quan.

### 1.3 Khác biệt lớn nhất với game mình (tóm tắt)

- Mình có **1 thợ xây** (Tạp dịch). RoK có 2: thợ thứ 2 thuê theo 2 ngày hoặc vĩnh viễn từ VIP 6.
- Mình **không có tiền premium, VIP, cửa hàng**. Túi đồ và nguồn rơi đồ đầu tiên (Trung tâm sự kiện, 4 lễ hội) cùng mới có từ commit `776ddfa`.
- Mình có **kho có trần** (Tàng Bảo Các) và bảo hộ PvP là **30 % cố định**. RoK không giới hạn kho; Nhà kho chỉ quyết định **lượng tuyệt đối được bảo hộ**.
- Mỗi công trình tài nguyên mình chỉ có **1 cái**, tài nguyên tự chảy vào kho. RoK có tới **4 cái mỗi loại**, sản lượng đọng trong từng nhà và phải **chạm để thu**.
- Thành bị đánh ở mình chỉ mất tài nguyên và được khiên 8 giờ. Không có **độ bền tường, cháy thành, dời thành, tháp canh**.

---

## 2. Danh mục đầy đủ

### 2.A Tòa thị chính, thời đại, văn minh

#### A1. City Hall — Tòa thị chính
- **Mở khoá / nhịp:** có từ đầu, luôn có. Cấp 1–25.
- **Cơ chế:**
  - Không công trình nào được cao hơn CH [2 nguồn]. Mỗi cấp CH cần **Tường cấp (N−1)** cộng thêm **một công trình khác** theo vòng (Bệnh viện, Trại trinh sát, Nhà kho, Doanh trại, TT liên minh, Học viện, Trạm giao thương…). Người chơi buộc phải nâng đều, không dồn được một nhà [2 nguồn: rokstats, riseofkingdomsguides].
  - CH quyết định số **đội hành quân**: 1 lúc đầu, thêm 1 ở CH 5, 11, 17, 22 [2 nguồn: riseofkingdomsguides, handbook; gamesguideinfo ghi CH 12 thay cho 22 — lệch cột]. CH cũng quyết định **sức chứa quân** mỗi đội (2 000 → 150 000) [2 nguồn].
  - CH mở **bậc quân**: T2 ở 8, T3 ở 16, T4 ở 21, T5 ở 25, kèm nghiên cứu Học viện [2 nguồn].
  - CH 25 cần thêm 1 **Master's Blueprint** (~2 000 gem hoặc từ thưởng) [2 nguồn: ajackof, heaven-guardian].
- **Bảng cấp** (lương = gỗ; thời gian gốc chưa buff; nguồn rokstats + riseofkingdomsguides + gamesguideinfo):

| CH | Yêu cầu | Lương/Gỗ | Đá | Thời gian | Mở khoá | Đội | Sức chứa quân |
|---|---|---|---|---|---|---|---|
| 2 | — | 3,5K | — | 2 giây | Xưởng gỗ #1, Trường bắn cung, Trại trinh sát | 1 | 3 000 |
| 3 | Tường 2 [mâu thuẫn: rokstats ghi không cần] | 6,5K | — | 5 phút | Nông trại #2, TT liên minh | 1 | 4 000 |
| 4 | Tường 3 | 11,8K | — | 20 phút | Mỏ đá #1, Học viện, Chuồng ngựa, Bệnh viện #2 · **Thời Đồ Đồng** | 1 | 5 000 |
| 5 | Tường 4, Bệnh viện 4 | 21,3K | — | 1 giờ | Xưởng gỗ #2, Cửa hàng (VIP), Xưởng công thành | **2** | 7 000 |
| 6 | Tường 5, Trại trinh sát 5 | 36,3K | 12K | 2 giờ | Nông trại #3, Trạm chuyển phát | 2 | 9 000 |
| 7 | Tường 6, Nhà kho 6 | 54,4K | 19,2K | 5 giờ | Mỏ đá #2, Lâu đài | 2 | 12 000 |
| 8 | Tường 7, Doanh trại 7 | 81,8K | 30,8K | 10 giờ | Xưởng gỗ #3, Đài kỷ niệm · **T2** | 2 | 15 000 |
| 9 | Tường 8, TT liên minh 8 | 122,8K | 49,2K | 15 giờ | Bệnh viện #3, Nông trại #4 | 2 | 19 000 |
| 10 | Tường 9, Học viện 9 | 184,3K | 78,7K | 1 ngày | Mỏ đá #3, Mỏ vàng #1, Trạm giao thương, Lyceum · **Thời Đồ Sắt** | 2 | 23 000 |
| 11 | Tường 10, Bệnh viện 10 | 277,5K | 120K | 1 ngày 6 giờ | Xưởng gỗ #4 | **3** | 28 000 |
| 12 | Tường 11, Nhà kho 11 | 417,5K | 180K | 1 ngày 16 giờ | Mỏ vàng #2 | 3 | 33 000 |
| 13 | Tường 12, Trường bắn 12 | 627,5K | 270K | 2 ngày 2 giờ | Mỏ đá #4 | 3 | 38 000 |
| 14 | Tường 13, TT liên minh 13, Trạm giao thương 13 | 942,5K | 405K | 2 ngày 12 giờ | Mỏ vàng #3 | 3 | 44 000 |
| 15 | Tường 14, Trại trinh sát 14 | 1,415M | 607,5K | 2 ngày 22 giờ | Bệnh viện #4 | 3 | 50 000 |
| 16 | Tường 15, Học viện 15 | 2,12M | 912,5K | 4 ngày | Mỏ vàng #4, Mỏ Heliamber · **T3 · Thời Hắc Ám** | 3 | 57 000 |
| 17 | Tường 16, Bệnh viện 16 | 3,185M | 1,37M | 4 ngày 20 giờ | mốc được dự KvK | **4** | 64 000 |
| 18 | Tường 17, Nhà kho 17 | 4,8M | 2,075M | 5 ngày 20 giờ | — | 4 | 72 000 |
| 19 | Tường 18, Chuồng ngựa 18 | 7,2M | 3,125M | 7 ngày | — | 4 | 80 000 |
| 20 | Tường 19, TT liên minh 19 | 10,8M | 4,7M | 8 ngày 6 giờ | — | 4 | 90 000 |
| 21 | Tường 20, Học viện 20 | 16,2M | 7,05M | 11 ngày | State Forum · **T4 · Thời Phong Kiến** | 4 | 100 000 |
| 22 | Tường 21, Bệnh viện 21 | 24,3M | 10,575M | 17 ngày 3 giờ | — | **5** | 110 000 |
| 23 | Tường 22, Nhà kho 22 | 36,45M | 15,875M | 23 ngày 23 giờ | — | 5 | 120 000 |
| 24 | Tường 23, Xưởng công thành 23 | 54,75M | 24M | ~36 ngày | — | 5 | 130 000 |
| 25 | Tường 24, Trạm giao thương 24, **1 Master's Blueprint** | 82,25M | 36M | 126 ngày 3 giờ [mâu thuẫn: 126 ngày 8 giờ] | **T5** (cần Học viện 25 + nghiên cứu), Mỏ pha lê, TT nghiên cứu pha lê | 5 | 150 000 |

  (Sức chứa quân CH 16: riseofkingdomsguides ghi 64 000, trùng CH 17; cộng dồn từ gamesguideinfo ra 57 000 [suy ra].)
- **Thưởng khi lên cấp** [1 nguồn: gamerempire]:
  - CH 2–4: 10K/20K/30K lương + gỗ, kèm 1/2/3 tăng tốc chung 5 phút.
  - CH 5–7: 40K–50K lương/gỗ/đá, kèm tăng tốc 30 phút (1, 2, 5 cái).
  - CH 8: 2 tăng tốc 8 giờ. CH 9: 1 tăng tốc 24 giờ. CH 10: +10K vàng và 1 vật phẩm **Đổi văn minh**.
  - Về sau tài nguyên lớn dần, có gem: 100 (CH 16), 200 (CH 21), 500 (CH 25).
  - Có "Era Breakthrough": thưởng riêng ở các mốc lớn [1 nguồn: heaven-guardian].
- **Lực chiến:** mỗi cấp cộng lực chiến, riêng CH 25 +2 195 485 [2 nguồn].
- **UI/UX:** chạm CH → vòng nút quanh nhà (Nâng cấp, Chi tiết). Bảng nâng cấp liệt kê yêu cầu có ✓/✗; thiếu thì nút "Đi tới" nhảy tới công trình đó. Chi phí thiếu có nút dùng vật phẩm tài nguyên (từ 1.0.87 có "Quick Replenish", bù một chạm). Cuối bảng là "Nâng cấp" (tốn thợ) và "Nâng cấp ngay" (tốn gem) [chưa xác minh vị trí].
- **Vì sao hấp dẫn:** mọi mốc lớn (đội thứ n, bậc quân, thời đại) gắn vào một con số ai cũng hiểu. Yêu cầu xoay vòng buộc cả thành lớn đều. Mỗi cấp có thưởng.
- **Tu tiên hoá:** **Chủ điện**, cấp = tầng cảnh giới của chưởng môn (đã làm). Điều kiện phụ mỗi tầng: "Hộ Sơn Đại Trận tầng N−1 + một điện khác xoay vòng" (Đan phòng, Tàng Kinh Các, Tàng Bảo Các…). Thưởng lên tầng là "lễ đột phá": tài nguyên + phù + tiên ngọc ở tầng 16/21/25. Món đặc biệt cho tầng 25: "Tổ Sư Đồ Phổ".
- **Game mình:** 🟡
  - Có: **Chủ điện** tầng 1–25; công trình khác ≤ tầng Chủ điện (`upgradeError`); mở khoá theo tầng (UX.md mục 4); đội xuất quân 1→5 ở tầng 1/6/11/16/21 (`MARCH_SLOTS`); tầng 5/10/15/20 phải độ kiếp.
  - Có: **quà mừng Chủ điện lên tầng** qua thư mỗi tầng (`hallGift`: Thời Quang Phù, nang, kinh thư), tầng đột phá cảnh giới (sau độ kiếp) thêm **lễ đột phá** (Kim Duyên, Thời Quang 8 giờ).
  - Thiếu: **Chủ điện không cần công trình nào khác** (RoK buộc Tường + một nhà xoay vòng) — cố ý chưa làm vì đụng nhịp xây của sim.
- **Ưu tiên:** P1 (chuỗi điều kiện phụ, thưởng lên tầng) · **Công sức:** S (thêm dữ liệu yêu cầu; nút "Đi tới" đã có; chạy lại `npm run sim`).

#### A2. Ages — Thời đại & diện mạo thành
- **Mở khoá / nhịp:** tự động theo CH.
- **Cơ chế:** Đồ Đá (CH 1–3) → Đồ Đồng (4) → Đồ Sắt (10) → Hắc Ám (16) → Phong Kiến (21) [2 nguồn: riseofkingdomsguides, gamesguideinfo; handbook ghi CH 10/16/21]. Thời đại chỉ là **nhãn cho tiến độ CH**, không phải hệ riêng. Bậc quân do CH + Học viện quyết định [2 nguồn]. Nghiên cứu Học viện chia theo thời đại. Công trình và thành **đổi kiểu kiến trúc** theo thời đại và theo văn minh [chưa xác minh chi tiết hình ảnh; không nguồn nào mô tả cụ thể]. Mốc chuyển thời đại có màn "Era Breakthrough" kèm quà [1 nguồn].
- **UI/UX:** lên cấp chuyển thời đại có màn chúc mừng riêng. Toàn thành đổi hình một lần [chưa xác minh].
- **Vì sao hấp dẫn:** sau vài chục giờ chơi, người chơi được "thấy" rõ mình đã đi xa. Đây là phần thưởng thị giác rẻ mà mạnh.
- **Tu tiên hoá:** 5 **cảnh giới** Luyện Khí → Trúc Cơ → Kim Đan → Nguyên Anh → Hóa Thần ứng với 5 thời đại. Mốc chuyển là **độ kiếp** (mạnh hơn RoK vì có thử thách và cảnh sét). Mỗi cảnh giới một bộ mái/sơn môn: ngói → lưu ly → vàng → ngọc → mây.
- **Game mình:** ✅/🟡
  - Có: cảnh giới và độ kiếp (màn đột phá riêng, `Result.svelte`); công trình đổi hình theo 5 bậc tầng (`tierOf` ở `packages/art/buildings.ts`): 1–5 mái ngói, 6–10 lưu ly xanh, 11–15 lưu ly vàng, 16–20 lưu ly chàm viền bạc, 21–25 bạch ngọc dát vàng trên vầng mây.
  - Thiếu: quà riêng khi chuyển cảnh giới (ngoài thưởng nhiệm vụ, xem A1c).
- **Ưu tiên:** P2 · **Công sức:** S–M (vẽ thêm 2 bộ mái trong `@rok/art`).

#### A3. Civilization — Văn minh (phần liên quan tới thành)
- **Cơ chế:** chọn văn minh lúc tạo thành (Rome, Đức, Anh, Pháp, Tây Ban Nha, Trung Hoa, Nhật, Hàn, Ả Rập, Ottoman, Byzantine, Viking, Ai Cập, Hy Lạp…). Văn minh cho: kiểu kiến trúc thành, buff kinh tế/quân sự, lính đặc biệt, tướng khởi đầu [2 nguồn về việc tồn tại; danh sách đủ chưa xác minh]. Đổi bằng vật phẩm **Đổi văn minh**: thưởng CH 10, hoặc mua ~2 000 000 điểm cá nhân ở cửa hàng liên minh [1 nguồn].
- **Vì sao hấp dẫn:** bản sắc ngay từ phút đầu ("thành Nhật của tôi"), và có lựa chọn tối ưu để bàn tán.
- **Tu tiên hoá:** "Đạo thống" của tông môn (Kiếm tông / Đan đỉnh / Thể tu môn / Trận pháp gia): một buff nhỏ, một màu sơn môn, một biểu tượng. Cho đổi bằng "Chuyển Tông Lệnh".
- **Game mình:** ✅ Chín **đạo thống** (`DAOS`, `dao` ở `sect/elders.ts`): chọn lúc lập tông môn, mỗi đạo 3 tiềm năng, đệ tử đặc trưng (`DAO_UNITS`), trấn phái chi bảo trên núi, tổ sư + huy hiệu riêng; cải tu sau 7 ngày (chi tiết buff/lính ở file 2).
- **Ưu tiên:** P2 · **Công sức:** M.

---

### 2.B Công trình tài nguyên & kho

#### B0. Thu hoạch trong thành — bong bóng chạm để thu
- **Mở khoá / nhịp:** từ đầu, liên tục.
- **Cơ chế:** mỗi công trình tài nguyên tự sinh và **giữ sản lượng trong chính nó** tới một sức chứa riêng. Đầy thì ngừng sinh [2 nguồn: theriagames, bluestacks ~10 giờ sản lượng]. Người chơi chạm để đổ vào kho thành. Phần chưa thu **không bị cướp** [1 nguồn: bluestacks]. Sản lượng trong thành chỉ là "nhỏ giọt" so với thu thập trên bản đồ [2 nguồn: handbook, bluestacks].
- **UI/UX:** icon lương/gỗ/đá/vàng nổi trên mái nhà khi có hàng. Chạm là tài nguyên bay về thanh trên, số chạy, có tiếng. Chạm một nhà thì thu mọi nhà cùng loại [chưa xác minh].
- **Vì sao hấp dẫn:** thói quen chạm có thưởng ngay. Tạo nhịp "vào thu một vòng" mỗi phiên.
- **Tu tiên hoá:** "Linh khí kết tinh": trên Tụ Linh Trận/Linh điền/Khoáng mạch nổi viên linh châu, chạm là châu bay về ô tài nguyên. Có thể giữ cơ chế tự chảy vào kho (hợp "thời gian lười") và chỉ thêm **phần thưởng chạm**: mỗi 4–8 giờ kết một viên "linh châu thượng phẩm" = 30 phút sản lượng, không chạm thì không tích thêm.
- **Game mình:** ✅ Sản lượng công trình nằm ở công trình (`yard`, `accrue` ở `core/time.ts`) — bong bóng giấy trên Tụ Linh Trận / Linh điền / Khoáng mạch khi đủ 5 phút sản lượng, chạm là thu (`collect` ở `sect/buildings.ts`), tài nguyên bay lên HUD (`Home.svelte`); phần chờ thu cướp không lấy được; kho + phần chờ thu chạm sức chứa thì ngừng sản xuất và công trình hiện "Đầy"; linh khí tự nhiên (60/giờ) vẫn vào thẳng kho; màn Xuất quan báo phần chờ thu. Bot / phân đà vào núi là thu hết.
- **Ưu tiên:** P1 · **Công sức:** M (cần kho riêng từng nhà hoặc phần thưởng chạm; ảnh hưởng PvP và sim).

#### B1. Farm — Nông trại (lương)
- **Mở khoá:** có từ đầu. Tối đa **4 cái**: #1 lúc đầu, #2 CH 3, #3 CH 6, #4 CH 9 [2 nguồn: gamerempire, bảng CH].
- **Cơ chế:** sinh lương/giờ, kho riêng. Cấp 1: 800/giờ, chứa 8 000; cấp 25: 21 600/giờ, chứa 920 000 [1 nguồn: theriagames; mâu thuẫn: gamesguideinfo ghi cấp 1 = 400/giờ, chứa 4 000]. Nâng cấp 25 tốn 5,25M gỗ + 3,75M đá, 5 ngày 5 giờ; công trình cộng lực chiến 143 196 [1 nguồn: rokstats]. Lương dùng cho huấn luyện, chữa, xây.
- **UI/UX:** như B0. Bảng chi tiết hiện sản lượng/giờ và sức chứa, so với cấp sau.
- **Tu tiên hoá:** **Linh điền** (linh thảo). Linh điền thứ 2–4 mở ở tầng 3/6/9, mỗi mảnh là một ô ruộng bậc thang trên núi.
- **Game mình:** ✅ Linh điền (600/giờ mỗi tầng, ×1,5 trên tầng 15). 🟡 chỉ **1 mảnh**, không có bản thứ 2–4.
- **Ưu tiên:** P2 · **Công sức:** M (thêm nhiều bản sao của một công trình ảnh hưởng hàng đợi, bố cục núi, sim).

#### B2. Lumber Mill — Xưởng gỗ (gỗ)
- **Mở khoá:** tối đa **4 cái**: CH 2, 5, 8, 11 [2 nguồn: bảng CH riseofkingdomsguides + gamesguideinfo].
- **Cơ chế:** như Farm, sản lượng coi như ngang Farm [suy ra: rokstats ghi lực chiến cấp 25 là 143 196, bằng Farm]. Gỗ là tài nguyên xây chính đầu–giữa game [1 nguồn].
- **Tu tiên hoá:** gộp vào **Tụ Linh Trận** (linh thạch) — game mình dùng 3 tài nguyên cho 4 loại của RoK.
- **Game mình:** 🟡 Tụ Linh Trận đóng vai tài nguyên xây chung. Không có "gỗ".
- **Ưu tiên:** P2 · **Công sức:** — (chỉ cần nếu làm nhiều bản sao, xem B1).

#### B3. Quarry — Mỏ đá (đá)
- **Mở khoá:** CH 4 (thời Đồ Đồng). Tối đa **4 cái**: CH 4, 7, 10, 13 [2 nguồn].
- **Cơ chế:** sinh đá. Đá xuất hiện từ chi phí CH 6 trở đi và thành **nút thắt ở CH 17–25** [1 nguồn: handbook]. Mở tài nguyên theo thời đại tạo "chỗ tiêu mới" giữa game.
- **Tu tiên hoá:** **Khoáng mạch** (linh khoáng).
- **Game mình:** ✅ Khoáng mạch (có từ tầng 1, không mở dần). 🟡 không có tài nguyên "mở muộn".
- **Ưu tiên:** P2 · **Công sức:** —.

#### B4. Goldmine — Mỏ vàng (vàng)
- **Mở khoá:** CH 10 (Đồ Sắt). Tối đa **4 cái**: CH 10, 12, 14, 16 [2 nguồn]. Trạm giao thương cần Mỏ vàng 1 [2 nguồn].
- **Cơ chế:** sinh vàng, sản lượng thấp hơn hẳn lương/gỗ (cấp 1: 200/giờ, chứa 2 000) [1 nguồn: gamesguideinfo]. Vàng dùng cho nghiên cứu, huấn luyện/chữa T4–T5, rèn trang bị [2 nguồn]. Ví dụ 2 000 lính bộ T5 tốn 1,6M lương + 1,6M gỗ + 800K vàng [1 nguồn]. Đến T5 thì vàng "tan chảy" [1 nguồn].
- **Tu tiên hoá:** tài nguyên thứ 4 mở ở tầng 10: **Huyền Tinh** (tinh thạch cao cấp, đào ở "Huyền Tinh Động"), dùng cho đệ tử bậc 4–5, công pháp hàng cao, pháp bảo.
- **Game mình:** ❌ Không có tài nguyên mở muộn. Đệ tử bậc cao chỉ đắt hơn cùng 3 loại.
- **Ưu tiên:** P2 · **Công sức:** L (tài nguyên mới động tới mọi bảng chi phí, chợ, cướp, sim).

#### B5. Storehouse — Nhà kho (bảo hộ tài nguyên)
- **Mở khoá:** từ đầu. Là yêu cầu của CH 7, 12, 18, 23; cấp 25 cần CH 25 + Bệnh viện 25 [1 nguồn: rokstats].
- **Cơ chế:** **không phải kho chứa** (RoK không giới hạn tài nguyên mở). Nhà kho quyết định **lượng tuyệt đối không bị cướp** cho mỗi loại, tỉ lệ lương : gỗ : đá : vàng = 1 : 1 : 0,75 : 0,5 [2 nguồn: gamesguideinfo; đoạn trích tìm kiếm cho cấp 14].

| Cấp | Lương = Gỗ | Đá | Vàng |
|---|---|---|---|
| 1 | 300K | 225K | 150K |
| 8 | 550K | 412,5K | 275K |
| 14 | 850K | 637,5K | 425K |
| 25 | 2,5M [2 nguồn] | ~1,875M [suy ra] | ~1,25M [suy ra] |

  Phần vượt mức bị cướp được, giới hạn bởi sức mang của quân địch [3 nguồn]. **Tài nguyên dạng vật phẩm trong túi không bị cướp** [2 nguồn: handbook, riseofkingdomsguides]. Khi di cư, tài nguyên mở không được vượt mức bảo hộ [1 nguồn]. Cấp 25 tốn 16,25M lương/gỗ + 12M đá, 23 ngày 15 giờ [1 nguồn].
- **Tương tác:** là cơ sở của văn hoá "tiêu hết trước khi off" và của cướp nhà người vắng.
- **UI/UX:** bảng Nhà kho hiện 4 dòng "được bảo hộ", thanh so với số đang có [chưa xác minh].
- **Tu tiên hoá:** "**Mật khố**" trong Tàng Bảo Các: tầng càng cao giấu được càng nhiều. Lore: kết giới ẩn kho, kẻ cướp không phá được.
- **Game mình:** 🟡
  - Có: **Tàng Bảo Các** là kho **có trần** (2 000 khi chưa có, ×1,3 mỗi tầng); đổi tài nguyên (Thương hội). PvP bảo hộ **45 % sức chứa kho** (`PROTECT`), cướp 30 % phần vượt theo sức mang (`RAID_SHARE`, `CARRY`). Vật phẩm trong túi (nang tài nguyên) không bị cướp (cướp chỉ lấy `res`).
  - Thiếu: bảo hộ theo **tầng công trình** (lượng tuyệt đối).
- **Ưu tiên:** P1 · **Công sức:** S (đổi `PROTECT` thành hàm theo tầng Tàng Bảo Các; chạy lại `npm run sim -- 30 4 --pvp 20`).

#### B6. Trading Post — Trạm giao thương (gửi tài nguyên cho đồng minh)
- **Mở khoá:** CH 10 + Mỏ vàng 1 [3 nguồn: riseofkingdomsguides, gamerempire, handbook farm; mâu thuẫn: handbook buildings ghi CH 12].
- **Cơ chế:** gửi tài nguyên cho **thành viên cùng liên minh**. Người gửi chịu **thuế** giảm theo cấp: 35 % (cấp 1) → 26 % (10) → 21 % (15) → 19 % (17) → 14 % (22) → 10 % (24) → 8 % (25) [3 nguồn]. Nhận về = gửi × (1 − thuế).
  - Sức chuyển mỗi chuyến: 5 000 (cấp 1; gamesguideinfo ghi 10 000) → 80K (5) → 300K (10) → 800K (15) → 1,3M (20) → 2M (24) → 2,5M (25) [2 nguồn].
  - Cấp 25 thêm +100 % tốc độ đoàn vận chuyển [1 nguồn].
  - Đoàn buôn **chiếm một đội hành quân**; đường càng xa đi càng lâu [1 nguồn].
  - Gửi được vàng hay không [mâu thuẫn]: heaven-guardian ghi 4 loại, riseofkingdomsguides ghi không gửi vàng.
  - Có tin đồn "giới hạn 10M/ngày" nhưng không có nguồn [1 nguồn nói đừng tin].
- **Tương tác:** nền của **tài khoản farm** (acc phụ đi thu rồi gửi về acc chính) và của việc góp tài nguyên chữa quân trong KvK.
- **UI/UX:** chạm thành đồng minh trên bản đồ hoặc từ danh sách thành viên → "Hỗ trợ tài nguyên" → kéo thanh từng loại, thấy thuế và số nhận về → đoàn buôn chạy trên bản đồ [chưa xác minh].
- **Tu tiên hoá:** "**Truyền Tống Trận**" (hoặc "Vận Linh Trận"): gửi linh thạch/thảo/khoáng cho đồng minh trong tiên minh, "hao tổn linh lực" 35 % → 8 % theo tầng, mỗi chuyến chiếm 1 đội.
- **Game mình:** ✅ **Vận Linh Trận** (25/09, `world/supply.ts`): Chủ điện 10, gửi cho người cùng minh từ hồ sơ, hao tổn 35 % → 8 % theo Tàng Bảo Các (đốt đi), nhận qua thư; trần ngày: gửi 2× sức chứa kho mình, nhận 1× sức chứa kho người nhận. Không chiếm đội hành quân, không có đoàn buôn trên bản đồ (tới ngay). Bên cạnh vẫn có **Chợ** và **Thương hội**.
- **Ưu tiên:** P1 (RoK dựa nhiều vào tương trợ) · **Công sức:** M. Cần trần chống dồn của: chỉ gửi cho người cùng minh ≥ 3 ngày, trần mỗi ngày theo sức chứa kho người nhận, thuế đốt đi.

---

### 2.C Công trình quân sự & phòng thủ trong thành

#### C1. Wall — Tường thành
- **Mở khoá:** từ đầu. Là yêu cầu của **mọi** cấp CH.
- **Cơ chế:**
  - **Độ bền**: 15 000 (cấp 1) → 15 500 (2) → 16 000 (3) → 17 000 (5) → 20 500 (10) → 24 250 (15) → 29 000 (20) → 40 000 (25) [1 nguồn: riseofkingdomsguides].
  - Chạm tường để đặt **tướng thủ thành** [1 nguồn].
  - Bị đánh thắng thì độ bền giảm và **thành cháy**, phải chủ động sửa hoặc dập bằng gem [2 nguồn: riseofkingdomsguides, bluestacks]. Độ bền về 0 thì **thành bị dịch chuyển ngẫu nhiên** [3 nguồn]. Xem J4–J5.
  - Cấp 25 cần Master's Blueprint + 40,5M lương, 47,1M gỗ, 75M đá, 41–46 ngày [mâu thuẫn về thời gian] [2 nguồn]. Tường 25 cần Tửu quán 25 [1 nguồn].
- **UI/UX:** bảng Tường có thanh độ bền, nút Sửa, nút Dập lửa (gem), ô chọn tướng thủ [chưa xác minh vị trí].
- **Vì sao hấp dẫn:** thua có hậu quả thấy được (lửa, khói), và có việc để làm ngay (sửa, dập) thay vì chỉ đọc báo cáo.
- **Tu tiên hoá:** **Hộ Sơn Đại Trận**: "trận lực" = độ bền. Bị phá trận thì "linh hỏa thiêu sơn", trận lực tụt dần, bấm "Tu bổ trận cơ" để dừng. Trận lực về 0 thì sơn môn bị đánh bật, phải **dời núi**.
- **Game mình:** ✅ **Hộ Sơn Đại Trận** (tầng 6): bên thủ +4 % thủ và máu mỗi tầng (`GUARD_STEP`), **trưởng lão trấn thủ**, trận lực 500 × (1 + tầng) với linh hỏa, tu bổ trận cơ, sơn môn thất thủ (`core/wall.ts`, xem J4–J5). Khác RoK: không phải điều kiện của Chủ điện (A1b).
- **Ưu tiên:** P1 · **Công sức:** M (độ bền + cháy theo thời gian lười: `burnUntil`, `durability` trong state; dời thành thuộc P3, xem J5).

#### C2. Watchtower — Tháp canh
- **Mở khoá:** từ đầu. Cấp 2 cần Tường 2; cấp 25 cần Tường 25, Tửu quán 25, Nhà kho 25 [2 nguồn].
- **Cơ chế:** tháp **bắn kẻ tấn công** và có máu riêng.

| Cấp | Công | Máu | Mũi tên kháng cự (Arrow of Resistance) |
|---|---|---|---|
| 1 | 1 000 | 1 000 | — |
| 5 | 4 000 | 4 000 | 15 |
| 10 | 24 000 | 12 000 | 60 |
| 15 | 66 000 | 22 000 | 300 |
| 20 | 96 000 | 32 000 | 1 500 |
| 25 | 500 000 | 50 000 | 5 000 |

  [Công/máu cấp 25: 2 nguồn; các cấp khác: 1 nguồn riseofkingdomsguides.] Nâng từ cấp 2 cần vật phẩm **Arrow of Resistance** [2 nguồn], lấy từ man tộc, sự kiện Lohar's Trial, gem [1 nguồn]. Độ bền tháp cũng tụt khi thành cháy [1 nguồn]. Tháp 25 là điều kiện của Học viện 25, tức của T5 [2 nguồn].
- **UI/UX:** khi có đội địch nhắm vào thành, HUD có cảnh báo đỏ và đồng hồ đếm tới lúc tới [chưa xác minh chi tiết theo cấp tháp].
- **Vì sao hấp dẫn:** biết trước để kịp khiên, kịp gọi viện. Ngồi nhà vẫn "đánh trả" được.
- **Tu tiên hoá:** "**Thiên Nhãn Lâu**" (vọng lâu): tầng càng cao càng báo sớm, lộ càng nhiều (số đội → trưởng lão → quân số). Có "kiếm trận" chém đội đến cướp một lượt trước khi giao chiến.
- **Game mình:** 🟡 **Tháp canh** báo trước (`world/raid.ts`, `Hud.svelte`): đội địch vừa xuất quân (cướp tông môn, kết trận, cướp khoáng) là bên bị nhắm thấy thẻ son ở mọi tab (tên, giờ tới, nút Bật khiên), offline thì Web Push. Chưa có công trình riêng, không bắn đội tới, không lộ thêm theo tầng.
- **Ưu tiên:** P1 · **Công sức:** S (báo trước) + S (lượt bắn trong `fight`).

#### C3. Barracks — Doanh trại (bộ binh)
- **Mở khoá:** từ đầu.
- **Cơ chế:** huấn luyện bộ binh. **Số lính mỗi lượt**: 20 (cấp 1) → 200 (5) → 450 (10) → 800 (15) → 1 300 (20) → 2 000 (25) [2 nguồn]. Công bộ binh +0,5 % (cấp 10) → +1 % (16) → +1,5 % (21) → +2 % (25) [1 nguồn]. Mỗi trại một hàng đợi.
- **UI/UX:** chạm → "Huấn luyện" → chọn bậc, kéo số lượng, thấy chi phí/thời gian; có nút "Nâng bậc" để đổi lính bậc thấp lên cao [chưa xác minh].
- **Tu tiên hoá:** "Kiếm Các" (kiếm tu).
- **Game mình:** ✅ **Diễn võ trường**: 1 nhà cho cả 3 hệ, mỗi lượt 20 + 20 × tầng, bậc 2/3/4/5 ở tầng 5/10/16/21. Khác biệt: RoK có 4 trại = 4 hàng tuyển song song.
- **Ưu tiên:** P2 (tách nhà) · **Công sức:** M.

#### C4. Archery Range — Trường bắn cung · C5. Stable — Chuồng ngựa · C6. Siege Workshop — Xưởng công thành
- **Mở khoá:** Trường bắn CH 2, Chuồng ngựa CH 4, Xưởng công thành CH 5 [2 nguồn].
- **Cơ chế:** như Doanh trại cho cung/kỵ/công thành. Trường bắn 12 là điều kiện CH 13, Chuồng ngựa 18 của CH 19, Xưởng công thành 23 của CH 24 [2 nguồn]. Lính công thành T1 mang được nhiều tài nguyên nên hay dùng để thu thập [1 nguồn].
- **Tu tiên hoá:** "Pháp Đường" (pháp tu), "Luyện Thể Trường" (thể tu), "Khôi Lỗi Phường" (con rối công thành, nếu có hệ thứ 4).
- **Game mình:** ✅ gộp trong Diễn võ trường. Không có hệ công thành (chủ đích: 3 hệ khắc nhau).
- **Ưu tiên:** P2 · **Công sức:** M.

#### C7. Hospital — Bệnh viện
- **Mở khoá:** **4 bệnh viện**: 1 lúc đầu, thêm ở CH 4, 9, 15 [2 nguồn: bảng CH, gamerempire "bệnh viện thứ 3 ở CH 9"].
- **Cơ chế:**
  - Sức chứa mỗi bệnh viện: 3 000 (cấp 1) → 7 000 (5) → 14 000 (10) → 24 000 (15) → 44 000 (20) → 75 000 (25) [2 nguồn]. Cấp 25 +1 % máu quân [1 nguồn].
  - Quân **bị thương nhẹ** tự hồi trong đội. Quân **trọng thương** vào viện. **Viện đầy thì số dư chết** [2 nguồn]. Một số chế độ có luật chết thẳng [1 nguồn].
  - Chữa tốn tài nguyên và thời gian; giúp đỡ liên minh và tăng tốc chữa rút ngắn được [2 nguồn].
  - Đang bị kết trận đánh thì không chữa được tới khi xong trận [1 nguồn].
- **UI/UX:** chạm → "Chữa" → chọn loại/số, thấy chi phí/thời gian → "Chữa" hoặc "Chữa ngay". Có chấm đỏ khi có thương binh [chưa xác minh].
- **Tu tiên hoá:** **Đan phòng** + các "Tĩnh thất" (giường dưỡng thương).
- **Game mình:** ✅ **Đan phòng**: 80 + 120 × tầng chỗ nằm, dư thì tử trận, chữa tốn 40 % chi phí tuyển. Khác: 1 nhà (RoK 4); giúp đỡ tiên minh rút ngắn được chữa thương (như RoK).
- **Ưu tiên:** — (đủ) · **Công sức:** —.

#### C8. Castle — Lâu đài (sức chứa kết trận)
- **Mở khoá:** CH 7 (+ TT liên minh 8 cho cấp cao) [2 nguồn].
- **Cơ chế:** tăng **sức chứa kết trận** (rally): cấp 1 +25 000 … cấp 25 +400 000, tổng ~2 000 000 [1 nguồn: gamesguideinfo, chưa kiểm]. Từ cấp 2 cần **Book of Covenant**: 2 (cấp 2), 15 (5), 70 (10), 300 (15), 1 500 (20), 5 000 (25), tổng 20 095 [1–2 nguồn]. Sách lấy từ pháo đài man tộc, rương VIP shop, rương liên minh (~10 cuốn/rương), gem (10 gem/cuốn) [1 nguồn]. Lâu đài 25 cần mọi nhà 25, là điều kiện Học viện 25 và T5 [1 nguồn].
- **Tương tác:** kết trận đánh pháo đài man tộc (đội hình liên minh), cũng là nguồn sách.
- **Tu tiên hoá:** "**Tụ Nghĩa Đường**": tầng càng cao kết trận càng đông. Vật phẩm "Minh Ước Thư" rơi từ yêu vương.
- **Game mình:** 🟡 Có **kết trận** (tối đa 8 đội, chờ 5/10/30 phút) và **viện binh** (3 đội). Không có công trình nâng sức chứa.
- **Ưu tiên:** P2 · **Công sức:** S.

#### C9. Scout Camp — Trại trinh sát
- **Mở khoá:** CH 2 [2 nguồn]. Là yêu cầu CH 6, 15.
- **Cơ chế:** số trinh sát (tới 3), tốc độ, tầm khám phá tăng theo cấp [1–2 nguồn]. Trinh sát xoá sương mù, tìm **làng bộ lạc** (~1 500/vương quốc: tài nguyên, tăng tốc, lính T1, công nghệ kinh tế cấp thấp) và **hang bí ẩn** (~400/vương quốc, 3 độ khó: gem, tăng tốc) [1 nguồn: riseofkingdomsguides]. Trinh sát thành địch trước khi đánh.
- **Tu tiên hoá:** "Linh Điểu Các" (thả hạc giấy/linh điểu).
- **Game mình:** ✅ **Mê vụ** riêng mỗi tông môn trên bản đồ giới (`core/fog.ts`), **linh điểu** (1 + 1 mỗi 8 tầng Chủ điện, tối đa 3) khai sương, thôn trang / động phủ cổ tu ghé một lần nhận quà (`world/explore.ts`); linh điểu cũng dùng để do thám tông môn (`world/spy.ts`). Không có công trình riêng. Chi tiết ở file 3.
- **Ưu tiên:** P2 (file 3) · **Công sức:** M.

---

### 2.D Công trình phát triển, xã hội, tiện ích

#### D1. Academy — Học viện (nghiên cứu)
- **Mở khoá:** CH 4 [2 nguồn]. Là yêu cầu CH 10, 16, 21.
- **Cơ chế:**
  - Tốc độ nghiên cứu: 0,5 % (cấp 1) → 5 % (10) → 10 % (20) → **25 % (25)** [2 nguồn]. Cấp 25 cần Tháp canh 25, CH 25, Trạm giao thương 25 + Master's Blueprint [1 nguồn].
  - Hai cây: **Kinh tế** và **Quân sự**. Một hàng nghiên cứu.
  - Cây kinh tế gồm [1 nguồn: riseofkingdomsguides]: Quarrying, Irrigation, Handsaw, Sickle, Masonry, Handaxe, Metallurgy, Chisel, Writing, Metalworking (tới cấp 5); Plow, Sawmill, Scythe, Whipsaw, Placer Mining, Shaft Mining, Stone Saw, Open-pit Quarry, Coinage (tới cấp 10); Machinery, Carriage, Engineering, Mathematics, Cutting & Polishing (tới cấp 10).
  - Các nhánh tăng: sản lượng từng loại, tốc độ thu thập, tốc độ xây, tốc độ nghiên cứu, sức mang [chưa xác minh từng công nghệ]. **Jewelry** mở khai thác mỏ gem; **Cutting & Polishing** +1 % → +35 % tốc độ thu gem [1 nguồn].
  - T5 cần xong **toàn bộ cây kinh tế** và nhiều nhánh quân sự [1 nguồn]. Nghiên cứu lớn như Combat Tactics 10 ~100 ngày với người chơi trung bình [1 nguồn].
- **UI/UX:** cây nút nối nhau, nút khoá hiện điều kiện. Chạm nút → bảng chi phí/thời gian/hiệu quả cấp sau → "Nghiên cứu" / "Nghiên cứu ngay" (gem). Danh hiệu "Nhà khoa học" của vua cộng thêm tốc độ [2 nguồn].
- **Vì sao hấp dẫn:** "sức mạnh vĩnh viễn tốt nhất trong game" [1 nguồn], cây dài để theo đuổi.
- **Tu tiên hoá:** **Tàng Kinh Các** (công pháp), đã làm.
- **Game mình:** ✅ Tàng Kinh Các: 28 công pháp, 7 hàng mở ở tầng 1/3/6/9/12/16/21, có sản lượng từng loại, sức chứa, tốc xây, tuyển, chữa, luyện đan, hành quân… 🟡 không có khoá "tốc độ nghiên cứu" (`Bonus` không có `study`), và Tàng Kinh Các không tự cộng tốc nghiên cứu theo tầng như Academy.
- **Ưu tiên:** P2 · **Công sức:** S.

#### D2. Alliance Center — Trung tâm liên minh
- **Mở khoá:** CH 3 [2 nguồn]. Là yêu cầu CH 9, 14, 20.
- **Cơ chế:**

| Cấp | Số lần được giúp mỗi việc | Sức chứa viện binh |
|---|---|---|
| 1 | 5 | 15 000 |
| 5 | 9 | 75 000 |
| 10 | 14 | 200 000 |
| 15 | 19 | 387 500 |
| 20 | 24 | 575 000 |
| 25 | 30 | 1 000 000 |

  [2 nguồn: riseofkingdomsguides, gamesguideinfo.] Giúp đỡ rút ngắn **xây, nghiên cứu, chữa**, **không** rút ngắn huấn luyện [1 nguồn: heaven-guardian]. Mỗi lượt giúp bớt bao nhiêu: [chưa xác minh] (hiểu biết chung: ~1 % thời gian, tối thiểu vài chục giây–1 phút).
- **Tương tác:** giúp người khác được **điểm cá nhân** (tối đa 10 000/ngày) để mua ở cửa hàng liên minh [2 nguồn].
- **UI/UX:** trên nhà đang xây/nghiên cứu nổi icon bàn tay "Nhờ giúp". Thanh bên có nút "Giúp tất cả" kèm số việc chờ giúp. Mỗi lượt được giúp có thông báo nhỏ "X đã giúp bạn" [chưa xác minh].
- **Tu tiên hoá:** "**Tiên Minh Điện**" (hoặc "Minh Ước Đài") trong tông môn: tầng càng cao càng được giúp nhiều lần, chứa được nhiều viện binh của đồng minh.
- **Game mình:** 🟡 Giúp đỡ tiên minh: 10 lượt/việc (`ALLY_HELPS`), +1 mỗi tầng Đồng Tâm Trận của Hộ Minh Đại Trận (tối đa 15, `helpsOf`), mỗi lần bớt max(1 phút, 1 %); giúp cả việc tuyển (RoK không); người giúp nhận cống hiến (5/lượt, trần 250/ngày). Viện binh tối đa 3 đội (`REINFORCE_MAX`). Chưa có công trình nâng số lượt / sức chứa viện binh.
- **Ưu tiên:** P1 · **Công sức:** S (công trình + bảng số) + S (điểm cống hiến, xem I3).

#### D3. Tavern — Tửu quán (rương bạc/vàng)
- **Mở khoá:** từ đầu. Tửu quán 25 là yêu cầu của Tường 25 và Tháp canh 25 [2 nguồn].
- **Cơ chế:**
  - **Rương bạc** mở bằng chìa bạc, có lượt **miễn phí mỗi ngày** tăng theo cấp: 3 (cấp 1) → 4 (5) → 5 (8–10) → 7 (15) → 8 (20) → 10 (25) [2 nguồn: gamesguideinfo, riseofkingdomsguides; handbook ghi "5/ngày" — mâu thuẫn]. Rơi tướng thường/ưu tú, tượng, tượng Starlight, tài nguyên, tăng tốc, sách kinh nghiệm [1 nguồn].
  - **Rương vàng** mở bằng chìa vàng. Miễn phí khoảng **2 ngày một lần**, mỗi cấp Tửu quán rút ngắn thêm (bảng gamesguideinfo tăng 1 đơn vị mỗi cấp tới 24 ở cấp 25, có thể là giảm 1 giờ/cấp → ~24 giờ ở cấp 25) [2 nguồn về "2 ngày"; phần giảm theo cấp là suy ra]. Rơi tướng huyền thoại và tượng của họ [1 nguồn].
  - Chìa vàng ~600 gem ở VIP shop [1 nguồn]. Mở 10 cùng lúc khi có ≥ 10 chìa [1 nguồn]. Tỉ lệ ra huyền thoại bị cộng đồng chê [2 nguồn].
  - Nên để dành chìa vàng cho sự kiện tính điểm mở rương [1 nguồn]. Có sự kiện "Legendary Tavern" [1 nguồn].
- **UI/UX:** cảnh quầy rượu, hai rương, đồng hồ "miễn phí sau…", nút Mở ×1 / ×10, màn lật thẻ có hiệu ứng theo độ hiếm [chưa xác minh chi tiết].
- **Vì sao hấp dẫn:** quà miễn phí có hẹn giờ (lý do quay lại) và cảm giác may rủi.
- **Tu tiên hoá:** "**Tụ Duyên Các**" (hoặc "Chiêu Hiền Đường"): "Duyên bạc" miễn phí 3→10 lượt/ngày theo tầng, "Duyên vàng" 48→24 giờ một lượt. Rơi phù, đan, kinh thư, "hồn ấn" trưởng lão. **Bảo hiểm tất định**: duyên vàng thứ 10 chắc chắn ra hồn ấn. Không bán chìa lấy tiền (PLAN: không gacha lớn).
- **Game mình:** ✅ **Chiêu Hiền Đài** (`sect/tavern.ts`, từ Chủ điện tầng 2): thiếp bạc miễn phí mỗi 6 giờ, thiếp vàng mỗi 48 giờ, mở thêm bằng Ngân / Kim Duyên Phù trong túi (×1 / ×10); bảo hiểm 10 lần thiếp vàng chắc đủ tín vật thu nhận một trưởng lão (`GOLD_PITY`). Không bán thiếp.
- **Ưu tiên:** P1 (bản miễn phí) · **Công sức:** M (bảng rơi tất định theo seed + UI mở rương).

#### D4. Builder's Hut — Nhà thợ xây
- **Mở khoá:** từ đầu, không nâng cấp.
- **Cơ chế:** nơi ở của thợ và là chỗ quản lý hàng đợi xây. **1 thợ** vĩnh viễn. **Thợ thứ 2** thuê tạm bằng vật phẩm **Builder Recruitment** (mỗi lần 2 ngày) hoặc gem, và **vĩnh viễn từ VIP 6** [2 nguồn: allclash (qua đoạn trích tìm kiếm), heaven-guardian; giá gem chưa xác minh].
- **UI/UX:** ở mép trái HUD có biểu tượng búa kèm đồng hồ của từng thợ. Thợ rảnh thì nhấp nháy, chạm vào gợi ý việc nên làm [chưa xác minh].
- **Tu tiên hoá:** **Tạp dịch viện**. Tạp dịch thứ 2 thuê bằng "**Thuê Dịch Lệnh**" (48 giờ, rơi từ sự kiện/tụ duyên), hoặc vĩnh viễn khi đạt mốc "Hương Hỏa" (xem G1).
- **Game mình:** ✅ **Tạp dịch** 1 hàng gốc (`QUEUE_SIZE = 1`) + tạp dịch thứ hai khi dùng **Tạp Dịch Lệnh** 48 giờ (`queueSize` ở `sect/buildings.ts`, dùng thêm thì kéo dài, việc dở vẫn xong khi hết hạn); ô tạp dịch thứ hai trên HUD. Không có bản vĩnh viễn.
- **Ưu tiên:** P1 · **Công sức:** M (luật đơn giản; phần khó là cân nhịp mùa 49 ngày bằng `npm run sim`).

#### D5. Blacksmith — Lò rèn (trang bị tướng)
- **Mở khoá:** CH 16 [1 nguồn: handbook], không nâng cấp.
- **Cơ chế:** **sản xuất nguyên liệu** theo hàng đợi (4 loại: da, quặng sắt, gỗ mun, xương thú; 5 phẩm) [2 nguồn]. **4 nguyên liệu cùng loại gộp thành 1 phẩm cao hơn** [1 nguồn]. Rèn trang bị = bản vẽ + nguyên liệu + vàng; tháo trang bị lấy lại một phần [2 nguồn về việc có tháo]. Là **chỗ tiêu vàng** lớn [2 nguồn]. Thời gian mỗi nguyên liệu [chưa xác minh].
- **Tu tiên hoá:** **Luyện Khí Phòng**, đã làm.
- **Game mình:** ✅ **Luyện Khí Phòng** (tầng 8): 9 pháp bảo tất định, cấp tối đa ⌈tầng/2⌉ ≤ 10, chỉ tốn tài nguyên và thời gian (chủ đích: không rơi đồ, không may rủi). Chi tiết nguyên liệu/bản vẽ ở file 2.
- **Ưu tiên:** — · **Công sức:** —.

#### D6. Shop — Cửa hàng (tức cửa hàng VIP)
- **Mở khoá:** CH 5 [2 nguồn]. Là toà nhà của **VIP Shop** (chi tiết I1).
- **Tu tiên hoá:** "**Vạn Bảo Lâu**".
- **Game mình:** ✅ **Hương Hỏa Các** (`VIP_SHOP`, `vipBuy` ở `sect/vip.ts`), mở từ bảng Hương Hỏa, không phải toà nhà riêng — xem I1 · **Ưu tiên:** P1 · **Công sức:** M (xem I1).

#### D7. Courier Station — Trạm chuyển phát (Thương nhân bí ẩn)
- **Mở khoá:** CH 6 [2 nguồn: heaven-guardian, handbook].
- **Cơ chế:** nơi **Thương nhân bí ẩn** (Mysterious Merchant) ghé (chi tiết I4). Bán hàng bằng tài nguyên hoặc gem [2 nguồn].
- **Tu tiên hoá:** "**Dịch trạm**" dưới chân núi, nơi "**Vân Du Thương Nhân**" ghé.
- **Game mình:** ✅ **Thương nhân vân du** (`sect/merchant.ts`) ghé Thương hội ở Tàng Bảo Các (từ tầng 4), không có công trình riêng — xem I4 · **Ưu tiên:** P1 · **Công sức:** S–M.

#### D8. Monument — Đài kỷ niệm
- **Mở khoá:** CH 8 [2 nguồn: gamesguideinfo, bảng CH].
- **Cơ chế:** đọc "lịch sử vương quốc" [1 nguồn]. Chứa chuỗi **sự kiện Monument** của cả vương quốc, có thưởng (một nguồn tăng tốc) [1 nguồn: riseofkingdomsguides]. Theo hiểu biết chung, các mốc chung của cả server mở dần giai đoạn (đèo, thánh địa, KvK) [chưa xác minh]. Chi tiết ở file 3.
- **Tu tiên hoá:** "**Thiên Bi**" của giới: bia khắc các mốc cả giới cùng đạt (vd "50 tông môn tới Trúc Cơ", "yêu vương đầu tiên bị hạ"), mỗi mốc phát quà cho mọi người và mở pha mới.
- **Game mình:** 🟡 **Thiên Đạo Biên Niên** (`world/book.ts`, `BOOK`): 13 chương mục tiêu chung của cả giới (có Tu Bổ Thiên Môn góp tài nguyên), hạn theo ngày mùa; xong thì mọi tông môn nhận quà thư + biên niên, hụt thì sang chương sau. Chưa mở pha theo chương: 4 pha mở cổng vẫn theo lịch (`PHASES`).
- **Ưu tiên:** P1 (file 3 quyết) · **Công sức:** M.

#### D9. Lyceum of Wisdom — Học đường trí tuệ (câu đố)
- **Mở khoá:** CH 10 [2 nguồn: gamerempire, handbook].
- **Cơ chế:** sự kiện **Peerless Scholar**: vòng sơ khảo các ngày trong tuần (10 câu, không giới hạn giờ), giữa kỳ thứ Bảy (2 ca ~02:30 và 12:30 UTC), chung kết 20 câu có giờ [1 nguồn]. Cần ~6 câu đúng để qua sơ khảo [1 nguồn]. Thưởng gem, tăng tốc, rương [2 nguồn]. Có mốc 1 000 điểm cho tượng sử thi [1 nguồn].
- **Tu tiên hoá:** "**Luận Đạo Đài**": vấn đáp điển tích tu tiên, thơ, ngũ hành.
- **Game mình:** ✅ **Vấn Đạo Đài** (`sect/quiz.ts`, `Quiz.svelte`, từ Chủ điện tầng 3): mỗi ngày 5 câu rút tất định từ 15 câu về luật chơi, quà theo số câu đúng; không có vòng thi giữa kỳ / chung kết có giờ · **Ưu tiên:** P2 · **Công sức:** M (ngân hàng câu hỏi hai thứ tiếng).

#### D10. Bulletin Board — Bảng tin
- **Mở khoá:** từ đầu, không nâng cấp.
- **Cơ chế:** tin cập nhật, sự kiện, tối ưu game [1 nguồn].
- **Tu tiên hoá:** "Cáo thị đình" ở cổng sơn môn.
- **Game mình:** 🟡 Có **thư admin** (inbox) và thông báo cập nhật. Chưa có bảng tin trong cảnh.
- **Ưu tiên:** P2 · **Công sức:** S.

#### D11. State Forum — (Armaments)
- **Mở khoá:** CH 21 [1 nguồn: rokstats]. 25 cấp; cấp 25 tốn 15,1M lương, 18,5M gỗ, 7M đá, 34 ngày 20 giờ; +524 281 lực chiến [1 nguồn].
- **Cơ chế:** nơi nhận **armaments** (trang bị đội hình). Bản 1.0.87 thêm tự tái chế armament theo điều kiện [1 nguồn]. Chi tiết ở file 2.
- **Tu tiên hoá:** "Trận Đồ Các" (trận đồ gắn cho đội).
- **Game mình:** ❌ · **Ưu tiên:** P2 (file 2) · **Công sức:** L.

#### D12. Museum — Bảo tàng
- **Mở khoá:** khi vương quốc vào **Season of Conquest** [1 nguồn].
- **Cơ chế:** 14+ **phòng trưng bày** ứng với tướng huyền thoại. Dùng **Exhibit Coins** mở phòng (giá tăng dần), **Relic Coins** mua cổ vật cho buff chiến đấu (vd công +25–30 %). Buff chỉ có tác dụng trong SoC. Phòng Aethelflaed miễn phí; tháo lại được 70 Exhibit Coins. Coin lấy từ chuỗi nhiệm vụ "Civilization Explorer" (có bản trả phí $10) và gói nạp [1 nguồn].
- **Tu tiên hoá:** "Truyền Thừa Điện": di vật của tổ sư, chỉ hiển linh trong mùa tranh giới.
- **Game mình:** ❌ · **Ưu tiên:** P2 · **Công sức:** M.

#### D13. Crystal Mine & Crystal Research Center — Mỏ pha lê, Trung tâm nghiên cứu pha lê
- **Mở khoá:** CH 25, 25 cấp mỗi nhà. Cấp 1 tốn 1 000 mỗi loại; cấp 25 xây 27 ngày 20 giờ [1 nguồn: rokstats].
- **Cơ chế:** "đào để lấy pha lê" và "mở công nghệ độc nhất" [1 nguồn]. Pha lê dùng cho **công nghệ pha lê** của mùa KvK/SoC, cũng rơi từ man tộc và boss Kahar trong Lost Kingdom [1 nguồn].
- **Tu tiên hoá:** "Giới Tinh Mạch" + "Tinh Nghiên Viện": công nghệ chỉ sống trong một mùa.
- **Game mình:** ❌ · **Ưu tiên:** P2 (file 6) · **Công sức:** M.

#### D14. Heliamber Mine I/II/III (+ bản thêm) — Mỏ Heliamber
- **Mở khoá:** CH 16, 25 cấp; cấp 1 tốn 1 000 lương + 1 000 gỗ, cấp 25 xây 5 giờ 7 phút [1 nguồn: rokstats].
- **Cơ chế:** mô tả của rokstats chỉ ghi "dùng mỏ Heliamber để tăng **Valor**". Không tìm được nguồn giải thích Valor [chưa xác minh — có thể là hệ mới 2025–2026, cần kiểm trong game].
- **Game mình:** ❌ · **Ưu tiên:** P2 (chờ xác minh) · **Công sức:** —.

---

### 2.E Tài nguyên

#### E1. Food — Lương thực · E2. Wood — Gỗ · E3. Stone — Đá · E4. Gold — Vàng
- **Cơ chế chung:**
  - 4 loại, mở dần: lương/gỗ từ đầu, đá từ CH 4, vàng từ CH 10.
  - Nguồn: công trình trong thành (nhỏ giọt), **thu thập trên bản đồ** (nguồn lớn nhất, nhất là mỏ trong lãnh thổ liên minh +25 % tốc độ), vật phẩm tài nguyên, thưởng, cướp thành "chết" [2 nguồn].
  - Chỗ tiêu: xây (lương/gỗ/đá), huấn luyện và chữa (lương/gỗ/đá tuỳ loại lính, vàng cho T4–T5), nghiên cứu (vàng), rèn (vàng) [2 nguồn].
- **Tu tiên hoá:** Linh thảo ~ lương, Linh thạch ~ gỗ + tiền chung, Linh khoáng ~ đá. Vàng ~ tài nguyên cao cấp mở muộn (xem B4).
- **Game mình:** ✅ 3 tài nguyên, có linh khí tự nhiên 60/giờ để không kẹt (`BASE_RATE`). 🟡 không mở dần theo cảnh giới.
- **Ưu tiên:** P2 · **Công sức:** L (nếu thêm loại thứ 4).

#### E5. Gems — Đá quý (tiền premium)
Xem 2.L.

#### E6. Không có lương duy trì quân
- **Cơ chế:** không nguồn nào (riseofkingdomsguides, handbook, heaven-guardian) nhắc tới việc quân ăn lương theo giờ. Theo hiểu biết chung, RoK **không có upkeep**: quân chỉ tốn khi tuyển và chữa [chưa xác minh trực tiếp].
- **Game mình:** ✅ cũng không có upkeep. Giữ nguyên: upkeep làm người chơi offline mất quân, trái trụ cột "chờ đợi có nghĩa".
- **Ưu tiên:** — · **Công sức:** —.

#### E7. Kho, bảo hộ và cướp
- **Cơ chế:** RoK **không giới hạn** tài nguyên mở (các nguồn chỉ nói tới mức bảo hộ, không nói trần chứa) [suy ra]. Tài nguyên an toàn gồm: phần dưới mức Nhà kho [3 nguồn], **vật phẩm trong túi** [2 nguồn], phần đang đọng trong công trình chưa thu [1 nguồn], phần đã trả vào việc đang chạy [1 nguồn]. Phần còn lại mất theo sức mang của đội cướp. Văn hoá "tiêu/nhét vào việc dài trước khi off" [2 nguồn].
- **Game mình:** 🟡 Kho có trần (Tàng Bảo Các), bảo hộ 45 % sức chứa (`PROTECT`), cướp 30 % phần vượt theo sức mang. Vật phẩm an toàn (✅). Khác biệt có chủ đích: trần kho tạo lý do quay lại (UX), nhưng làm "để dành cho sự kiện" khó hơn RoK. Nang tài nguyên trong túi (không tính trần; lễ vật Hương Hỏa cũng trả bằng nang) là van xả.
- **Ưu tiên:** P1 (xem B5) · **Công sức:** S.

#### E8. Thu thập trên bản đồ (tóm tắt, chi tiết file 3)
- **Cơ chế:** mỏ lương/gỗ/đá/vàng nhiều cấp (L1–L7 theo nguồn heaven-guardian), mỏ gem. Sức mang theo loại lính (công thành mang nhiều). Buff +50 % tốc thu 8 giờ/24 giờ bằng vật phẩm; lãnh thổ liên minh +25 %; danh hiệu Queen +15 %, Saint +10 % [2 nguồn]. Tài khoản farm đi thu rồi gửi về qua Trạm giao thương [2 nguồn].
- **Game mình:** ✅ P3 có **mỏ trên bản đồ giới** (trữ 20K–40K, khai 3K–5K/giờ, hồi sau 2 giờ), **linh mạch** buff sản lượng cả minh (trần 30 %), **linh triều** +15 % sản lượng / +50 % khai mỏ.
- **Ưu tiên:** — (file 3) · **Công sức:** —.

---

### 2.F Hàng đợi, giúp đỡ, tăng tốc

#### F1. Hàng đợi xây — thợ thứ 2
- **Cơ chế:** 1 thợ vĩnh viễn + thợ 2 thuê theo lượt **2 ngày** (Builder Recruitment/gem) hoặc vĩnh viễn từ **VIP 6** [2 nguồn]. Đây là lý do số một để người F2P cày lên VIP 6 [2 nguồn].
- **Vì sao hấp dẫn:** hai việc song song làm tiến độ nhanh thấy rõ; hết hạn thuê là "đau", tạo mục tiêu VIP.
- **Tu tiên hoá:** Tạp dịch thứ 2 ("Thuê Dịch Lệnh" 48 giờ; vĩnh viễn ở mốc Hương Hỏa).
- **Game mình:** ✅ Tạp Dịch Lệnh thuê tạp dịch thứ hai 48 giờ; không có bản vĩnh viễn (xem D4).
- **Ưu tiên:** P1 · **Công sức:** M.

#### F2. Các hàng đợi khác
- **Cơ chế:** 1 hàng nghiên cứu, mỗi trại lính 1 hàng (4 hàng tuyển), bệnh viện 1 hàng chữa, lò rèn 1 hàng sản xuất nguyên liệu [chưa xác minh số hàng lò rèn].
- **Game mình:** ✅ mỗi việc một hàng: xây, tuyển, chữa, nghiên cứu, luyện đan, luyện khí (PLAN mục 4 "Đơn giản hoá có chủ đích").
- **Ưu tiên:** — · **Công sức:** —.

#### F3. Giúp đỡ liên minh (Alliance Help)
- **Cơ chế:** số lần theo Trung tâm liên minh (5 → 30). Áp cho xây, nghiên cứu, chữa, không cho huấn luyện. Người giúp được điểm cá nhân (≤ 10 000/ngày) [2 nguồn].
- **UI/UX:** icon bàn tay trên nhà → nhờ giúp. Nút "Giúp tất cả" ở thanh bên có số đếm [chưa xác minh vị trí].
- **Tu tiên hoá:** "Đồng môn tương trợ".
- **Game mình:** ✅ 10 → 15 lượt/việc theo Hộ Minh Đại Trận (`helpsOf`), mỗi lần bớt max(1 phút, 1 %), cả việc tuyển; việc vừa giao tự nhờ giúp, nút giúp tất cả nổi ở mọi tab; người giúp nhận cống hiến (5/lượt, trần 250/ngày) tiêu ở Cống Hiến Các. Số lượt tăng theo trận của minh, không theo công trình (D2).
- **Ưu tiên:** P1 · **Công sức:** S.

#### F4. Dùng tăng tốc
- **Cơ chế:** tăng tốc chung dùng cho mọi hàng; tăng tốc riêng chỉ cho đúng loại việc [2 nguồn]. Dùng từ bảng "Tăng tốc" của việc đang chạy: chọn mệnh giá, dùng nhiều cái một lúc, xem thời gian còn lại [chưa xác minh chi tiết UI]. Tăng tốc không hết hạn, không bị cướp [1 nguồn]. Nên để dành cho **sự kiện tính điểm** (MGE, More Than Gems…) để ăn thưởng hai lần [2 nguồn].
- **Game mình:** ✅ Túi đồ: nút Tăng tốc ở mọi việc đang chờ, phù riêng chỉ cho đúng việc, không rút ngắn luyện đan (`useError`). Tông Môn Tranh Bá tính điểm cho phút tăng tốc đã dùng (`speed` metric).
- **Ưu tiên:** — · **Công sức:** —.

#### F5. Hoàn thành ngay bằng gem
- **Cơ chế:** mọi việc có nút "làm ngay" tốn gem theo thời gian còn lại [chưa xác minh bảng giá]. Các hướng dẫn F2P đều khuyên **không** tiêu gem vào đây [2 nguồn].
- **Game mình:** ❌ — trái "không P2W" nếu không có trần. PLAN chỉ cho "tăng tốc giới hạn mỗi ngày".
- **Ưu tiên:** ⛔/P2 (chỉ bản có trần/ngày) · **Công sức:** S.

#### F6. "Miễn phí khi còn < N phút"
- **Cơ chế:** nhiều SLG (Lords Mobile, Whiteout Survival) có nút xong miễn phí khi còn dưới vài phút, VIP kéo dài ngưỡng. **Không thấy trong các hướng dẫn RoK đã đọc** (tăng tốc, VIP, công trình đều không nhắc; bảng buff VIP 0–15 của gamesguideinfo không có dòng này). Riêng một trang lẻ của gamesguideinfo (mã trang VIP 16) lại hiện dòng "Instant Construction Time Extension 1 phút" gắn nhãn VIP 1 — có thể lẫn dữ liệu game khác [chưa xác minh — cần kiểm trong game]. Ở RoK, việc ngắn được giúp đỡ liên minh xoá.
- **Tu tiên hoá:** "Thuận thủ": việc còn < 3 phút thì Tạp dịch làm nốt ngay. Mốc Hương Hỏa kéo lên 5–10 phút.
- **Game mình:** ✅ Nút Miễn phí (`finish` ở `sect/vip.ts`, `vipFree`): việc còn ≤ 1–8 phút theo cấp Hương Hỏa (`VIP_FREE`) thì xong ngay, người mới dưới Chủ điện tầng 4 có 1 phút; không áp cho luyện đan · **Ưu tiên:** P2 (tiện, rẻ, hợp phiên 5–10 phút) · **Công sức:** S (thêm action `finishFree` khi `finishAt − now ≤ N`).

#### F7. Quick Replenish — Bù tài nguyên một chạm
- **Cơ chế:** bản 1.0.87 (10/2024) thêm nút bù tài nguyên còn thiếu khi xây/nghiên cứu/huấn luyện bằng vật phẩm tài nguyên trong túi [2 nguồn: riseofkingdomsguides, empirebuildacademy].
- **Tu tiên hoá:** nút "Mở nang bù đủ" ngay trên dòng chi phí đỏ.
- **Game mình:** ✅ Bù tài nguyên thiếu một chạm trong bảng công trình (`Refill.svelte`): mỗi loại thiếu một dòng — mở nang vừa đủ (nhỏ trước), đổi phần dư ở Thương hội, hoặc "đợi ~T".
- **Ưu tiên:** P1 · **Công sức:** S.

---

### 2.G VIP

#### G1. Cấp VIP và điểm VIP
- **Mở khoá / nhịp:** từ đầu, tích luỹ vĩnh viễn (không reset, không hết hạn).
- **Mốc điểm tích luỹ:**

| VIP | Điểm | VIP | Điểm | VIP | Điểm |
|---|---|---|---|---|---|
| 1 | 200 | 8 | 35 000 | 15 | 1 000 000 |
| 2 | 400 | 9 | 75 000 | 16 | 1 500 000 [1 nguồn] |
| 3 | 1 200 | 10 | 150 000 | 17 | 2 500 000 [1 nguồn] |
| 4 | 3 500 | 11 | 250 000 | 18 | 4 000 000 [1 nguồn] |
| 5 | 6 000 | 12 | 350 000 | 19 | 6 000 000 [1 nguồn] |
| 6 | 11 500 | 13 | 500 000 | **SVIP** | 9 000 000 [1 nguồn] |
| 7 | 17 500 | 14 | 750 000 | | |

  [VIP 1–15: 2 nguồn (riseofkingdomsguides, topuplive); 16–18: topuplive; 19 và SVIP: heaven-guardian.] VIP 18 ra ở 1.0.48 (07/2021) [1 nguồn]. **VIP 19 và SVIP** ra ở 1.0.87 (10/2024) [2 nguồn].
- **Cách kiếm điểm:**
  - Điểm danh hằng ngày (G2).
  - Mua bằng gem khoảng 1 gem = 1 điểm [2 nguồn; một nguồn ghi 10 gem = 1 điểm — mâu thuẫn].
  - Cửa hàng liên minh: 100 điểm = 50 000 điểm cá nhân [2 nguồn].
  - Quà liên minh (10–1 000 điểm) [1 nguồn]; gói nạp; code quà.
  - Nhảy nhiều cấp một lúc thì quà các cấp bị nhảy gửi qua thư [1 nguồn].
- **Mốc ai cũng nhắm:** VIP 6 (thợ 2 vĩnh viễn), VIP 10 (1 tượng huyền thoại/ngày), VIP 12 (2 tượng + buff chiến đấu), VIP 14 (3 tượng) [2+ nguồn].
- **Tu tiên hoá:** "**Hương Hỏa**" (hương khói tín đồ dâng tông môn) hoặc "Đạo Hạnh": điểm tích mỗi ngày đăng nhập, làm nhiệm vụ ngày, giúp đồng môn, và từ Tu Tiên Lệnh. **Không bán điểm lấy tiền trực tiếp** (PLAN mục 7). Buff có trần thấp hơn RoK (sản lượng tối đa +20–25 %, không buff chiến đấu PvP).
- **Game mình:** ✅ **Hương Hỏa** (`core/vip.ts`, `VIP_LEVELS`, bảng `VipSheet.svelte`): 12 cấp (tới 70.000 điểm), điểm từ chuỗi ngày vào game và Hương Hỏa Lệnh; không bán điểm · **Ưu tiên:** P1 · **Công sức:** M (bảng số + màn Hương Hỏa + nguồn điểm; phải qua sim vì buff sản lượng/tốc xây dồn lên nhịp mùa).

#### G2. Điểm danh VIP (chuỗi đăng nhập)
- **Cơ chế:** mỗi ngày nhận điểm VIP miễn phí: **40 ngày đầu chuỗi, +20 mỗi ngày liên tiếp, tối đa 200/ngày**. Đứt chuỗi thì về lại [2 nguồn: đoạn trích fandom, gamerempire/topuplive "tối đa 200, liên tiếp được nhiều hơn"].
- **UI/UX:** nút VIP trên HUD có chấm đỏ khi chưa nhận. Bảng VIP có thanh điểm tới cấp sau [chưa xác minh].
- **Vì sao hấp dẫn:** mất chuỗi là mất 200 điểm/ngày — lực kéo đăng nhập mạnh nhất, không tốn gì.
- **Tu tiên hoá:** "Dâng hương mỗi sáng" ở Chủ điện: chuỗi ngày càng dài hương càng nhiều.
- **Game mình:** ✅ Điểm danh Hương Hỏa (`vipLogin`, `VIP_DAILY`): 40 → 200 điểm/ngày theo chuỗi ngày liên tiếp (đủ 200 từ ngày 7), lỡ một ngày là về đầu chuỗi; bên cạnh vẫn có Thất Nhật Lễ cho tân thủ.
- **Ưu tiên:** P1 · **Công sức:** S.

#### G3. Rương VIP hằng ngày
- **Cơ chế:** mỗi ngày một rương miễn phí theo cấp VIP. Từ VIP 10: 1 **tượng tướng huyền thoại vạn năng**/ngày, VIP 12: 2, VIP 14 trở lên: 3, kèm sách kinh nghiệm và tài nguyên [2+ nguồn]. Cấp thấp hơn có tượng ưu tú (VIP 4–6) và sử thi (VIP 7–9) [1 nguồn].
- **Tu tiên hoá:** "Hương hoả hoàn lễ": mỗi ngày một túi quà theo mốc Hương Hỏa (phù, nang, kinh thư, hồn ấn).
- **Game mình:** ✅ Lễ vật Hương Hỏa mỗi ngày theo cấp (`VIP_CHEST`, `vipChest`): nang tài nguyên (nằm trong túi, không bị cướp), Thời Quang Phù, từ cấp 6 thêm kinh thư. Không có tín vật trưởng lão như tượng của RoK.
- **Ưu tiên:** P1 · **Công sức:** S.

#### G4. Rương đặc quyền (Special Privilege Chest)
- **Cơ chế:** mỗi cấp VIP có **một** rương mua được **một lần** bằng gem, giá giảm sâu [1 nguồn: gamerempire; giá/nội dung chưa xác minh]. Có thêm "VIP Special Bundles" trả tiền thật từ VIP 18 [1 nguồn].
- **Tu tiên hoá:** "Lễ vật tấn cấp": lên mốc Hương Hỏa thì mở một lễ vật đổi bằng linh thạch (không tiền thật).
- **Game mình:** ❌ · **Ưu tiên:** P2 · **Công sức:** S.

#### G5. Buff theo cấp VIP (vĩnh viễn trong lúc giữ cấp)
Bảng VIP 0–15 lấy từ gamesguideinfo, đã kiểm từng trang VIP 1/6/10/13/15 [1 nguồn, khớp một phần với riseofkingdomsguides]. Ô "—" = không có.

| VIP | SX lương/gỗ | SX đá/vàng | Thu thập | Xây | Nghiên cứu | Huấn luyện | Hồi AP | Sức chứa viện | Khác |
|---|---|---|---|---|---|---|---|---|---|
| 0 | 3 % | — | — | — | — | — | — | — | — |
| 1 | 3 % | 3 % | 5 % | — | — | — | — | — | — |
| 2 | 5 % | 5 % | 5 % | — | — | — | 5 % | — | — |
| 3 | 7 % | 7 % | 5 % | 5 % | — | — | 5 % | — | — |
| 4 | 9 % | 9 % | 5 % | 5 % | 5 % | 5 % | 5 % | — | — |
| 5 | 12 % | 12 % | 5 % | 5 % | 5 % | 5 % | 10 % | 5 % | — |
| 6 | 15 % | 15 % | 10 % | 10 % | 5 % | 5 % | 10 % | 5 % | **thợ thứ 2 vĩnh viễn** |
| 7 | 18 % | 18 % | 10 % | 10 % | 5 % | 10 % | 10 % | 10 % | — |
| 8 | 21 % | 21 % | 10 % | 10 % | 10 % | 10 % | 15 % | 10 % | — |
| 9 | 25 % | 25 % | 10 % | 10 % | 10 % | 10 % | 15 % | 15 % | — |
| 10 | 29 % | 29 % | 10 % | 15 % | 10 % | 15 % | 15 % | 15 % | 1 tượng HT/ngày |
| 11 | 33 % | 33 % | 20 % | 15 % | 10 % | 15 % | 15 % | 20 % | công +5 % |
| 12 | 38 % | 38 % | 20 % | 15 % | 15 % | 15 % | 20 % | 20 % | + thủ +5 %, 2 tượng |
| 13 | 42 % | 42 % | 20 % | 15 % | 15 % | 15 % | 20 % | 25 % | + máu +5 % |
| 14 | 46 % | 46 % | 25 % | 15 % | 15 % | 15 % | 20 % | 25 % | + sức chứa quân +5 %, 3 tượng |
| 15 | 50 % | 50 % | 30 % | 20 % | 20 % | 20 % | 30 % | 30 % | + hành quân +5 %, chữa +50 % |

  VIP 16: sản lượng 55 % [1 nguồn: riseofkingdomsguides]. VIP 17–19, SVIP: buff "đã cập nhật" ở 1.0.87 nhưng không có số [chưa xác minh].
- **Vì sao hấp dẫn:** buff vĩnh viễn thấy ngay trên mọi đồng hồ; mốc có tên (VIP 6, 10, 14) để khoe và để nhắm.
- **Tu tiên hoá:** bảng Hương Hỏa 0–10 với trần: sản lượng ≤ +25 %, xây/công pháp ≤ +15 %, sức chứa Đan phòng ≤ +20 %, **không** buff công/thủ/máu (tránh bán sức mạnh PvP).
- **Game mình:** ✅ Tăng ích Hương Hỏa theo cấp (`VIP_PERKS`, mỗi cấp một bộ, không cộng dồn): cấp 12 sản lượng +7 %, chữa +20 %, tuyển +7 %, sức chứa +18 %, hành quân +10 %, xây +5 %, công +3 %, sinh lực +3 % · **Ưu tiên:** P1 · **Công sức:** M.

#### G6. VIP 19 và SVIP
- **Cơ chế:** 1.0.87 thêm VIP 19, **SVIP** (~9M điểm) và **SVIP Shop** đổi đồ trang trí: hiệu ứng thành, hiệu ứng dịch chuyển, hiệu ứng hành quân, chủ đề hồ sơ (theo chủ đề tinh tú, chiến tranh). Buff, rương riêng và gói đặc biệt các cấp cũng được cập nhật [2 nguồn].
- **Tu tiên hoá:** "Tiên Duyên" — mốc cuối chỉ cho **đồ ngắm** (pháp tướng tông môn, vệt kiếm quang khi hành quân, mây ngũ sắc khi độ kiếp).
- **Game mình:** ❌ (cosmetic dự kiến P4) · **Ưu tiên:** P2 · **Công sức:** M.

---

### 2.H Túi đồ (Items)

#### H0. Túi đồ nói chung
- **Cơ chế:** mọi vật phẩm nằm trong túi, chia tab (tăng tốc / tài nguyên / tăng ích / khác…). Không hết hạn, không bị cướp. Dùng từng cái, dùng nhiều, hoặc dùng thẳng từ nơi cần: bảng tăng tốc của việc đang chạy, dòng tài nguyên thiếu, nút khiên [2 nguồn về an toàn; UI chưa xác minh].
- **Tu tiên hoá:** "Càn Khôn Đại" (túi càn khôn).
- **Game mình:** ✅ **Túi đồ** trong Bảo khố, 4 tab (Tăng tốc, Tài nguyên, Tăng ích, Khác), dùng ×1/×n (≤ 999 một lần), chọn việc/trưởng lão khi dùng (`sect/bag.ts`, README "Đã làm").
- **Ưu tiên:** — · **Công sức:** —.

#### H1. Universal Speedup — Tăng tốc chung
- **Mệnh giá:** 1 phút, 5 phút, 10 phút, 15 phút, 30 phút, 60 phút, 3 giờ, 8 giờ, 15 giờ, 24 giờ, 3 ngày, 7 ngày, 30 ngày [1 nguồn: cấu trúc bảng tính riseofkingdomsguides].
- **Nguồn:** nhiệm vụ ngày, sự kiện và cửa hàng sự kiện (nguồn lớn nhất), cửa hàng liên minh ("3 giờ là món hời nhất"), VIP shop (5 phút = 6 gem, 60 phút = 50 gem, 8 giờ = 240 gem, 24 giờ = 600 gem), Thương nhân bí ẩn (giảm 60–70 %), viễn chinh, rương Tửu quán, man tộc, code quà, Monument, Peerless Scholar… [2 nguồn].
- **Tu tiên hoá:** **Thời Quang Phù** (đã có).
- **Game mình:** ✅ Thời Quang Phù 5 phút/15 phút/60 phút/3 giờ/8 giờ/24 giờ; Tụ Khí Đan (15 phút), Đại Tụ Khí Đan (2 giờ) luyện được. Thiếu mệnh giá 1 phút và ≥ 3 ngày (không cần với mùa 49 ngày).
- **Ưu tiên:** — · **Công sức:** —.

#### H2. Building / Research / Training / Healing Speedup — Tăng tốc riêng
- **Mệnh giá:** xây/nghiên cứu/huấn luyện có 1 phút → 8 giờ (1, 5, 10, 15, 30, 60 phút, 3 giờ, 8 giờ) [1 nguồn: bảng tính]. Huấn luyện có thêm 24 giờ (VIP shop cấp 18) [1 nguồn]. Tăng tốc chữa có nhưng mệnh giá [chưa xác minh].
- **Quy tắc:** chỉ dùng cho đúng việc. Nên dùng riêng trước, để dành chung [2 nguồn].
- **Tu tiên hoá:** Lỗ Ban Phù (xây), Ngộ Đạo Phù (công pháp), Luyện Binh Phù (tuyển), Diệu Thủ Phù (chữa) — đã có.
- **Game mình:** ✅ đủ 4 loại, cùng dãy mệnh giá 5 phút → 24 giờ.
- **Ưu tiên:** — · **Công sức:** —.

#### H3. Resource packs — Gói tài nguyên
- **Mệnh giá** [1 nguồn: cấu trúc bảng tính riseofkingdomsguides]:
  - Lương, Gỗ: 1 000 · 10 000 · 50 000 · 150 000 · 500 000 · 1 500 000 · 5 000 000
  - Đá: 750 · 7 500 · 37 500 · 112 500 · 375 000 · 1 125 000 · 3 750 000
  - Vàng: 500 · 3 000 · 15 000 · 50 000 · 200 000 · 600 000 · 2 000 000
  - (Đá = 75 %, vàng = 40–50 % mệnh giá lương — cùng tỉ lệ giá trị với bảo hộ Nhà kho.)
- **Cơ chế:** không bị cướp khi còn trong túi; mở lúc cần; "Quick Replenish" mở tự động [2 nguồn].
- **Nguồn:** thưởng CH, nhiệm vụ, sự kiện, Thương nhân (trả bằng tài nguyên loại khác, rẻ 10–40 %), VIP shop (không nên mua), làng bộ lạc [2 nguồn].
- **Tu tiên hoá:** Linh Thạch/Thảo/Khoáng Nang (đã có).
- **Game mình:** ✅ nang 1K/5K/20K/100K mỗi loại, mở ra vượt trần kho được.
- **Ưu tiên:** — · **Công sức:** —.

#### H4. Resource choice chests, Reserves — Rương chọn tài nguyên, rương dự trữ
- **Cơ chế:** rương cho **chọn** loại tài nguyên khi mở [chưa xác minh tên/mệnh giá]. "Level 6 Reserves" 5 000 gem ở VIP 17 [1 nguồn]. Cùng họ có "Level 5 Material Choice Chest" (nguyên liệu) [1 nguồn].
- **Tu tiên hoá:** "Tuỳ Tâm Nang" (mở ra chọn linh thạch/thảo/khoáng).
- **Game mình:** ❌ — hợp với vấn đề "kho lệch" mà Thương hội đang giải.
- **Ưu tiên:** P2 · **Công sức:** S (thêm `use: 'pick'` vào `BagDef`).

#### H5. Enhanced Gathering — Tăng tốc thu thập
- **Cơ chế:** +50 % tốc độ thu thập, **8 giờ** hoặc **24 giờ** [2 nguồn: riseofkingdomsguides, heaven-guardian]. Bán ở Thương nhân [1 nguồn].
- **Tu tiên hoá:** "**Khai Mạch Phù**": khai mỏ trên bản đồ giới +50 %.
- **Game mình:** ✅ **Khai Linh Phù** 8 / 24 giờ, khai mỏ +50 % (`BAG.khaiLinh8/24`, khoá `gather`): ở Thiên Môn Thương Điếm, kho lễ Thôn Trang; cộng với tâm pháp khai mỏ của trưởng lão, linh triều, lãnh thổ minh.
- **Ưu tiên:** P2 · **Công sức:** S (thêm khoá bonus `gather` + một dòng `BAG`).

#### H6. Production boost — Tăng sản lượng thành
- **Cơ chế:** tăng sản lượng công trình tài nguyên có thời hạn, bán ở shop và sự kiện [1 nguồn: theriagames; tên/giá trị chưa xác minh]. Vì sản lượng trong thành nhỏ nên ít người quan tâm.
- **Tu tiên hoá:** Tụ Linh Phù (đã có).
- **Game mình:** ✅ **Tụ Linh Phù** +50 % sản lượng 8/24 giờ (dùng thêm thì kéo dài, không cộng dồn). Ở game mình món này **quan trọng hơn RoK** vì sản lượng thành là nguồn chính trước P3.
- **Ưu tiên:** — · **Công sức:** —.

#### H7. Enhanced Attack / Defense — Tăng công / thủ
- **Cơ chế:** 24 giờ, bản "Advanced": thủ 750 gem, công 2 000 gem (VIP 12) ở VIP shop [1 nguồn]. Dùng trước trận lớn, KvK.
- **Tu tiên hoá:** Chiến Ý Phù (công), Kim Cương Phù (thủ), Hộ Thể Phù (sinh lực) — đã có.
- **Game mình:** ✅ +10 % trong 8 giờ mỗi loại.
- **Ưu tiên:** — · **Công sức:** —.

#### H8. Army Expansion — Mở rộng quân
- **Cơ chế:** tăng sức chứa quân mỗi đội có thời hạn; "Advanced Army Expansion" 2 500 gem ở VIP 14 [1 nguồn]. Là một nguồn sức chứa quân cùng CH, cấp tướng, sự kiện [2 nguồn].
- **Tu tiên hoá:** "Quảng Trận Phù" (trận cơ mở rộng: mỗi đội mang thêm đệ tử).
- **Game mình:** ✅ **Trận dung** (`capOf`): mỗi đội ra bản đồ giới mang tối đa 500 + 80 mỗi cấp chủ tướng trên 1 (+10 % mỗi sao); **Khuếch Trận Kỳ** +10 % trong 8 giờ (`BAG.khuechTran8`) ở Thương nhân vân du, Thiên Môn Thương Điếm.
- **Ưu tiên:** P2 · **Công sức:** S nếu có trần quân số.

#### H9. Peace Shield — Khiên hoà bình
- **Cơ chế:** thành không bị đánh/trinh sát trong thời hạn. Tấn công người khác thì mất khiên [chưa xác minh chi tiết].
  - Thời hạn thường gặp: **8 giờ, 24 giờ, 3 ngày** [chưa xác minh; khiên 24 giờ có thật: Thương nhân bán giảm 80–90 % — 1 nguồn].
  - Bán ở cửa hàng liên minh bằng điểm cá nhân [1 nguồn], Thương nhân, shop.
  - Dân farm và người sắp offline trong KvK đều mua trữ [1 nguồn].
  - Không dùng được khi đang **War Frenzy** [chưa xác minh; War Frenzy chặn dịch chuyển thì có 1 nguồn].
- **UI/UX:** biểu tượng khiên quanh thành trên bản đồ, đồng hồ trong bảng buff thành [chưa xác minh].
- **Tu tiên hoá:** **Hộ Sơn Phù** (đã có).
- **Game mình:** ✅ Hộ Sơn Phù 8/24/72 giờ, cộng dồn thời gian, **tự tan khi đi cướp**. Ngoài ra có khiên tự động 8 giờ khi thủ thua, tân thủ 72 giờ.
- **Ưu tiên:** — · **Công sức:** —.

#### H10. Anti-scouting — Chống do thám
- **Cơ chế:** có vật phẩm làm báo cáo trinh sát của địch **sai lệch** (hiện gấp đôi quân) [1 nguồn]. Tên chính xác, thời hạn [chưa xác minh].
- **Tu tiên hoá:** "**Mê Tung Phù**": trinh sát của đối thủ thấy quân số gấp đôi, trưởng lão ẩn.
- **Game mình:** 🟡 Ẩn Tung Phù 8/24 giờ (`veil`: `sect/bag.ts`, `world/spy.ts`): linh điểu do thám của người khác về tay không (vẫn tốn, bên kia vẫn nhận thư bị do thám); bán ở Thương nhân vân du và Hương Hỏa Các. Màn chọn đối thủ PvP vẫn lộ quân giữ nhà (làm tròn), trưởng lão trấn thủ, tầng Hộ Sơn Đại Trận (`scout()` trong `world/fight.ts`); chưa có báo cáo giả.
- **Ưu tiên:** P2 · **Công sức:** S.

#### H11. Teleports — Dịch chuyển
- **Các loại** [2 nguồn: riseofkingdomsguides, heaven-guardian]:
  - **Beginner Teleport:** cho tài khoản CH < 8, trong 10 ngày đầu; acc mới có 2 cái; dùng để chọn vương quốc [1 nguồn].
  - **Random Teleport:** tới chỗ ngẫu nhiên trong vùng hiện tại.
  - **Territorial Teleport:** vào lãnh thổ liên minh, vượt được vùng chưa mở đèo.
  - **Targeted Teleport:** chọn điểm trong vùng; 750 gem ở VIP shop (VIP 6) [2 nguồn].
- **Điều kiện chung:** không đang giao chiến, mọi đội đã về, không đang bị kết trận [2 nguồn]; không War Frenzy, không có viện binh trong thành [1 nguồn].
- **Nguồn:** cửa hàng liên minh (rẻ nhất tính theo điểm), VIP shop, Thương nhân, Ark of Osiris [2 nguồn].
- **Tu tiên hoá:** "**Na Di Phù**" (dời núi trong vùng), "**Hồi Minh Phù**" (về lãnh thổ tiên minh), "Tân Thủ Na Di" (chọn giới lúc mới vào).
- **Game mình:** ✅ Đủ 4 kiểu dời núi (`world/territory.ts`): dời núi tân thủ (`newbieMove`, lần đầu, trước Chủ điện tầng 8), dời vào lãnh thổ minh (`move`, 24 giờ một lần), Di Sơn Phù (ngẫu nhiên vùng ngoài), Càn Khôn Phù (tự chọn ô ở vùng đã mở); mọi đội phải ở nhà, sát khí chặn dời.
- **Ưu tiên:** P2 (P3 cần nếu có dời thành) · **Công sức:** M (chọn ô trống, kiểm cổng/vùng, đưa đội về).

#### H12. Tavern Keys — Chìa bạc, chìa vàng
- **Cơ chế:** mở rương Tửu quán. Chìa vàng ~600 gem [1 nguồn]. Có từ sự kiện, gói "Living Legends"… [1 nguồn].
- **Tu tiên hoá:** "Duyên Lệnh" bạc/vàng.
- **Game mình:** ✅ Ngân Duyên Phù / Kim Duyên Phù (`BAG.nganDuyen/kimDuyen`): mở thêm lượt ở Chiêu Hiền Đài; từ Nhật Khóa, sự kiện, thành tựu, các cửa hàng — không bán.
- **Ưu tiên:** P1 cùng D3 · **Công sức:** S.

#### H13. Tome of Knowledge — Sách kinh nghiệm tướng
- **Cơ chế:** cộng kinh nghiệm cho một tướng; nhiều mệnh giá [chưa xác minh con số]. Có trong rương VIP, rương bạc, sự kiện [2 nguồn].
- **Tu tiên hoá:** Tâm Đắc Kinh Thư (đã có).
- **Game mình:** ✅ kinh thư 500 / 2 000 / 8 000 kinh nghiệm + Bồi Nguyên Đan (400).
- **Ưu tiên:** — · **Công sức:** —.

#### H14. Sculptures — Tượng tướng (và Starlight)
- **Cơ chế:** 4 độ hiếm (huyền thoại, sử thi, ưu tú, cao cấp), mỗi độ hiếm có loại **riêng từng tướng** và **vạn năng** [1 nguồn].
  - 10 tượng để chiêu mộ một tướng [1 nguồn].
  - Nâng kỹ năng tới tối đa tốn 690 (huyền thoại), 440 (sử thi), 340 (ưu tú), 240 (cao cấp) [1 nguồn].
  - **Starlight Sculpture** (Brand-new / Dazzling…) là tượng hướng về tướng mình chọn [2 nguồn].
  - Nguồn: rương VIP (từ VIP 10), Ark of Osiris (3–5), Wheel of Fortune, MGE, Karuak, cửa hàng viễn chinh (tượng riêng 2 500 huân chương), VIP shop (sử thi 200 gem, huyền thoại 2 000 gem), More Than Gems [2 nguồn]. Chi tiết ở file 2.
- **Tu tiên hoá:** "**Hồn Ấn**" của trưởng lão (riêng / vạn năng).
- **Game mình:** 🟡 Tín vật riêng từng trưởng lão (Chiêu Hiền Đài, Thiên Cơ Luân): đủ 10 thu nhận, dư thì nâng sao 1–6 (`STAR_COST`; mỗi sao tăng công / sinh lực / công pháp khi dẫn đội) hoặc ngộ công pháp (`ngo`, `SKILL_COST`: một môn ngẫu nhiên lên một tầng, tối đa 5) — `sect/tavern.ts`. Chưa có tín vật vạn năng / Starlight; tâm pháp vẫn mở theo cấp trưởng lão.
- **Ưu tiên:** P2 (file 2) · **Công sức:** L.

#### H15. Equipment materials & blueprints — Nguyên liệu, bản vẽ trang bị
- **Cơ chế:** 4 nguyên liệu × 5 phẩm, gộp 4→1. Bản vẽ theo món (cần đủ số lượng) [1–2 nguồn]. Nguồn: lò rèn tự sản xuất, nhiệm vụ ngày (mốc 40/80 điểm có rương nguyên liệu), Sunset Canyon, Ceroli Crisis, Shadow Legion, man tộc, VIP shop, gói 7/30 ngày [1 nguồn]. Chi tiết ở file 2.
- **Tu tiên hoá:** "Linh tài" (kim/mộc/thú cốt/huyền thiết) + "Luyện khí đồ phổ".
- **Game mình:** ❌ có chủ đích (Luyện Khí Phòng tất định, không rơi đồ).
- **Ưu tiên:** P2 (file 2) · **Công sức:** L.

#### H16. Book of Covenant · Arrow of Resistance · Master's Blueprint — Vật phẩm nâng công trình đặc biệt
- **Cơ chế:**
  - **Book of Covenant:** nâng Lâu đài từ cấp 2, tổng ~20 095. Mua 10 gem/cuốn, tái chế được ở Alliance Reclaim [1–2 nguồn].
  - **Arrow of Resistance:** nâng Tháp canh từ cấp 2 [2 nguồn].
  - **Master's Blueprint:** cần cho **cấp 25** của CH, Tường, Học viện và nhiều nhà khác (~16 món). Mỗi cái ~2 000 gem, CH 25 thưởng 1 cái [2 nguồn: riseofkingdomsguides T5, ajackof, heaven-guardian].
  - Ý đồ: gắn tiến độ công trình với hoạt động (man tộc, pháo đài, sự kiện) thay vì chỉ tài nguyên.
- **Tu tiên hoá:** "Minh Ước Thư" (Tụ Nghĩa Đường), "Phá Ma Tiễn" (Thiên Nhãn Lâu), "**Tổ Sư Đồ Phổ**" (tầng 25), rơi từ yêu vương, bí cảnh, tháp.
- **Game mình:** ❌ Mọi công trình chỉ tốn tài nguyên và thời gian.
- **Ưu tiên:** P2 · **Công sức:** S mỗi món (thêm `need` vào `BuildingDef` như `PillDef.need`).

#### H17. VIP Points — Vật phẩm điểm VIP
- **Cơ chế:** nhiều mệnh giá, từ quà liên minh, cửa hàng liên minh (100 điểm/50 000 điểm cá nhân), sự kiện; dư điểm khi đổi hệ VIP được trả lại dạng vật phẩm qua thư (1.0.87) [2 nguồn].
- **Tu tiên hoá:** "Hương Hỏa Nén".
- **Game mình:** ✅ Hương Hỏa Lệnh 50 / 200 điểm (`BAG.huongHoa*`): ở Thương nhân vân du, Thiên Môn Thương Điếm, quà phái thắng Chính Tà · **Ưu tiên:** P1 cùng G1 · **Công sức:** S.

#### H18. Action Point Recovery — Hồi điểm hành động
- **Cơ chế:** AP dùng đánh man tộc/pháo đài. Vật phẩm hồi AP nhiều cỡ [1 nguồn: VIP shop "Basic 100 AP" 12 000 lương, 30/tuần; rương pháo đài 50 AP]. VIP cộng tốc hồi AP (xem G5). Chi tiết ở file 3.
- **Game mình:** ✅ **Hành lực** (`AP_MAX` 100, hồi 1 mỗi 3 phút, mỗi lần săn yêu thú giới tốn 10) + **Hành Lực Đan** +50 (`BAG.hanhLuc50`, được vượt mức tối đa) ở Thương nhân vân du, Hương Hỏa Các, quà Vân Du Khách — không bán.
- **Ưu tiên:** — · **Công sức:** —.

#### H19. Builder Recruitment — Thuê thợ
- **Cơ chế:** mở thợ thứ 2 trong 2 ngày [1 nguồn]. Hết giá trị khi đạt VIP 6.
- **Tu tiên hoá:** "Thuê Dịch Lệnh" 48 giờ.
- **Game mình:** ✅ Tạp Dịch Lệnh 48 giờ (`BAG.tapDich48`, dùng thêm thì kéo dài): ở Hương Hỏa Các, Thiên Môn Thương Điếm, kho lễ Tông Lệnh Bảo Khố / Côn Lôn, mốc Công Huân 6.000 · **Ưu tiên:** P1 cùng F1 · **Công sức:** S.

#### H20. Kingdom Map — Bản đồ vương quốc
- **Cơ chế:** xoá sương mù 10 × 10 ô quanh điểm chọn [1 nguồn].
- **Game mình:** ✅ **Sơn Hà Đồ** (`BAG.sonHa12`, `revealNear` ở `core/fog.ts`): tan ngay 12 ô mê vụ chưa khai gần tông môn nhất (không chọn điểm như RoK); ở Thương nhân vân du, kho lễ Thôn Trang · **Ưu tiên:** P2 (file 3).

#### H21. Passport Page — Trang hộ chiếu (di cư)
- **Cơ chế:** di cư sang vương quốc khác, số trang theo lực chiến: 1 (< 10M) … 6 (25–30M) … 25 (50–55M) … 75 (> 100M). 600 000 điểm cá nhân/trang ở cửa hàng liên minh (lãnh đạo nhập hàng 100 000 điểm liên minh). Hồi 30 ngày giữa hai lần di cư. Tài nguyên mở phải dưới mức bảo hộ [1–2 nguồn]. "Beginner's Immigration" bị ngừng cho acc mới từ 26/03/2025 [1 nguồn].
- **Game mình:** ⛔ PLAN "Không làm: liên server, chuyển server". Mùa 49 ngày tự làm việc này.

#### H22. Civilization Change — Đổi văn minh
- **Cơ chế:** thưởng CH 10; ~2M điểm cá nhân ở cửa hàng liên minh [1 nguồn].
- **Game mình:** ✅ Cải tu đạo thống ở Chủ điện (cùng màn chọn), miễn phí, 7 ngày một lần (`DAO_COOL`) · **Ưu tiên:** P2.

#### H23. Đổi tên, khung ảnh, đồ hồ sơ
- **Cơ chế:** vật phẩm đổi tên thống đốc, khung ảnh đại diện, chủ đề hồ sơ (SVIP shop) [SVIP: 2 nguồn; đổi tên chưa xác minh].
- **Tu tiên hoá:** "Cải Danh Lệnh", khung ấn triện.
- **Game mình:** 🟡 Cải Danh Lệnh đổi tên tông môn (`BAG.caiDanh`, `/account/rename`, server chặn tên trùng / từ tục) đổi chân dung (`face`: chưởng môn hoặc trưởng lão đã thu nhận) và khung chân dung mở theo thành tích (`frame`: Hương Hỏa, phi thăng, đệ nhất Công Huân, Luận Kiếm, luân hồi); chưa có chủ đề hồ sơ · **Ưu tiên:** P2 · **Công sức:** S (cần lọc tên như chat).

#### H24. Tiền tệ sự kiện, coin đặc thù
- **Cơ chế:** Lucky Coin (Lucky Stall: giảm chi phí xây/nghiên cứu/huấn luyện, trần 50M lương, 50M gỗ, 37,5M đá, 20M vàng; hết sự kiện thì xoá coin), Exhibit/Relic Coin (Bảo tàng), huân chương viễn chinh, coin Sunset Canyon, điểm cá nhân/liên minh, Soluna Coin (KvK Light & Darkness, góp công nghệ vương quốc) [1 nguồn mỗi món]. Chi tiết ở file 5–6.
- **Game mình:** ✅ Lệnh bài riêng của từng sự kiện (`festTokens` ở `core/fest.ts`): Tông Môn Lệnh, Côn Lôn / Thục Sơn / Nga Mi Lệnh, Nguyệt Bính, Hỷ Thước, Hộ Thôn Lệnh đổi ở kho lễ, Thiên Cơ Lệnh quay Thiên Cơ Luân — hết sự kiện là hết; ngoài ra Kiếm Ý, Phi Thăng Tệ, cống hiến.
- **Ưu tiên:** P2 · **Công sức:** S.

---

### 2.I Cửa hàng

#### I1. VIP Shop — Cửa hàng VIP (toà Shop)
- **Mở khoá / nhịp:** CH 5. **Làm mới hằng tuần** (thứ Hai 00:00 UTC) [2 nguồn "hằng tuần"; giờ: 1 nguồn]. Mặt hàng mở theo cấp VIP, mỗi món có **giới hạn/tuần**.
- **Mặt hàng tiêu biểu** [heaven-guardian; giá có ký hiệu * khớp riseofkingdomsguides]:

| VIP | Món | Giá | Giới hạn/tuần |
|---|---|---|---|
| 2 | Hồi AP cơ bản | 12 000 lương | 30 |
| 3 | Tăng tốc chung 5 phút | 7 000 lương (hoặc 6 gem*) | 50 |
| 4 | Brand-new Starlight Sculpture | 60 000 lương | 20 |
| 5 | Dazzling Starlight Sculpture | 400 000 gỗ | 5 |
| 6 | Targeted Teleport | 750 gem* | 10 |
| 9 | Tượng sử thi | 200 gem* | 50 |
| 12 | Enhanced Attack (Advanced) 24 giờ | 2 000 gem* | ? |
| 13 | Tượng huyền thoại | 2 000 gem* | 20 |
| 14 | Advanced Army Expansion | 2 500 gem | 10 |
| 15 | Tăng tốc chung 24 giờ | 600 gem* | 20 |
| 17 | Level 6 Reserves | 5 000 gem | 10 |
| 18 | Tăng tốc huấn luyện 24 giờ; Rương chọn nguyên liệu cấp 5 | 600 gem; 2 400 gem | 20; 5 |

  Có thêm: 60 phút = 50 gem, 8 giờ = 240 gem, chìa vàng 600 gem, Enhanced Defense (Advanced) 24 giờ 750 gem [1 nguồn]. "VIP 14 mới mua được tượng huyền thoại hằng ngày" [handbook/packsify — mâu thuẫn với VIP 13]. Tiêu gem ở đây được tính cho More Than Gems [2 nguồn].
- **UI/UX:** lưới ô hàng, mỗi ô ghi giá, số còn lại tuần này; ô khoá ghi "VIP N"; đồng hồ tới lần làm mới [chưa xác minh].
- **Vì sao hấp dẫn:** mỗi tuần có đồ "giá hời" giới hạn → lý do ghé; ô khoá VIP là lời mời lên cấp.
- **Tu tiên hoá:** "**Vạn Bảo Lâu**": trả bằng linh thạch (món thường) và **tiên ngọc kiếm được** (món quý), làm mới thứ Hai, mặt hàng mở theo Hương Hỏa.
- **Game mình:** ✅ **Hương Hỏa Các** (`VIP_SHOP`, `vipBuy`): 16 món mở theo cấp Hương Hỏa (có Tạp Dịch Lệnh, Di Sơn / Càn Khôn Phù, Kim Duyên Phù), mua bằng tài nguyên × tầng Chủ điện, hạn mức mỗi tuần, thứ Hai làm mới; không có tiền premium · **Ưu tiên:** P1 · **Công sức:** M (bảng hàng tất định theo tuần + giới hạn mua + UI).

#### I2. SVIP Shop
- **Cơ chế:** chỉ cho SVIP; đổi hiệu ứng thành, hiệu ứng dịch chuyển, hiệu ứng hành quân, chủ đề hồ sơ [2 nguồn]. Tiền tệ [chưa xác minh].
- **Game mình:** ❌ · **Ưu tiên:** P2 (gắn với cosmetic P4) · **Công sức:** M.

#### I3. Alliance Shop — Cửa hàng liên minh (+ Alliance Reclaim)
- **Mở khoá / nhịp:** khi vào liên minh; hàng xoay vòng.
- **Cơ chế:**
  - **Hai loại điểm** [2 nguồn: riseofkingdomsguides, heaven-guardian]:
    - **Điểm cá nhân** (của người chơi): giúp đỡ (≤ 10 000/ngày), góp công nghệ liên minh (100/lượt, có lúc ×2–×3), xây công trình liên minh (≤ 20 000/ngày), rương liên minh, Ark of Osiris, tái chế đồ thừa.
    - **Điểm liên minh** (quỹ chung): sinh ra từ cùng các hoạt động đó.
  - **R4/R5 dùng điểm liên minh nhập hàng**, thành viên mua bằng điểm cá nhân [2 nguồn]. Điểm liên minh còn dùng xây pháo đài (900K, 4,5M, 9M), cờ, sửa công trình [1 nguồn].
  - Mặt hàng: tăng tốc 3 giờ, dịch chuyển, khiên, điểm VIP (100 điểm = 50 000), trang hộ chiếu (600 000), Đổi văn minh (~2 000 000), tài nguyên, buff, tượng [1–2 nguồn]. Giá giảm theo công nghệ liên minh [1 nguồn].
  - **Alliance Reclaim:** đổi đồ thừa (tượng, Starlight, sách Covenant, mũi tên) lấy điểm cá nhân [1 nguồn].
- **Vì sao hấp dẫn:** biến việc giúp người khác (vốn vô hình) thành tiền của mình. Lãnh đạo có quyền "nuôi" minh.
- **Tu tiên hoá:** "**Tiên Minh Bảo Khố**". Điểm cá nhân = "**cống hiến**", điểm chung = "**minh khố**". Trưởng lão minh nhập hàng.
- **Game mình:** ✅ **Cống Hiến Các** (`AllyShop.svelte`, `ALLY_SHOP`): cống hiến cá nhân từ cung phụng Hộ Minh Đại Trận và giúp đỡ (trần 250/ngày từ giúp), đường chủ / minh chủ nhập hàng bằng Minh khố, người trong minh đổi bằng cống hiến. Chưa có Alliance Reclaim; kết trận, viện binh không sinh cống hiến.
- **Ưu tiên:** P1 · **Công sức:** M.

#### I4. Mysterious Merchant — Thương nhân bí ẩn
- **Mở khoá / nhịp:** CH 6 (Trạm chuyển phát). Ghé **0:00 UTC** mỗi ngày, và **có thể xuất hiện thêm** sau khi huấn luyện, xây xong, đánh man tộc (không chắc lần nào cũng có) [2 nguồn].
- **Cơ chế:**
  - **16 món** mỗi lượt: 4 tài nguyên, 4 tăng tốc, 4 buff, 4 món phát triển khác [1 nguồn].
  - Trả bằng **tài nguyên** (giảm ~10–40 %) hoặc **gem** (giảm ~30–90 %) [1 nguồn]. Tăng tốc giảm 60–70 %, khiên 24 giờ giảm 80–90 % [1 nguồn].
  - **Làm mới:** lần đầu miễn phí, sau đó 100 / 200 / 300 / 400 gem [2 nguồn].
  - Có dịch chuyển, kinh nghiệm, đồ sao [1 nguồn].
  - F2P nên chỉ mua món trả bằng tài nguyên [2 nguồn] — tức là **đổi tài nguyên thừa lấy tăng tốc**.
- **UI/UX:** xe hàng/thương nhân xuất hiện trong thành kèm chấm đỏ; bảng 4 hàng × 4 ô, tag % giảm giá, nút làm mới kèm giá [chưa xác minh].
- **Vì sao hấp dẫn:** bất ngờ nhỏ, "món hời hôm nay", biến tài nguyên thừa thành tăng tốc.
- **Tu tiên hoá:** "**Vân Du Thương Nhân**" ghé Dịch trạm lúc 0h giờ VN và thỉnh thoảng sau khi xong việc. Bán phù/nang/buff lấy **linh thạch hoặc linh thảo/khoáng thừa**, làm mới 1 lần miễn phí mỗi ngày (thêm lần thì tốn linh thạch tăng dần). Hàng chọn bằng seed theo ngày để server và client cùng tính.
- **Game mình:** ✅ **Thương nhân vân du** (`sect/merchant.ts`, `Merchant.svelte`) ở Thương hội (Tàng Bảo Các tầng 4): 6 món mỗi 8 giờ, tất định theo tông môn + lượt, giá bằng một loại tài nguyên × tầng Chủ điện, mỗi món mua một lần — **van xả kho lệch** bên cạnh Thương hội. Không có nút làm mới.
- **Ưu tiên:** P1 · **Công sức:** S–M.

#### I5. Expedition Shop — Cửa hàng viễn chinh (Medal Store)
- **Cơ chế:** chế độ Expedition (chiến dịch một người, 1–3 sao mỗi màn, số đội tăng ở màn 6/16/26/41) cho **Medals of the Conqueror** và rương hằng ngày theo sao [1–2 nguồn]. Cửa hàng bán tượng Aethelflaed (có trần/ngày), Constance (rẻ), một tượng sử thi xoay vòng hằng tuần, tượng riêng ~2 500 huân chương [2 nguồn]. Lần đầu qua các màn còn cho một đống gem và tăng tốc [2 nguồn].
- **Tu tiên hoá:** "**Công Huân Các**" đổi "huân chương" từ Thông Thiên Tháp/bí cảnh.
- **Game mình:** ✅ **Thông Thiên Tháp** và **bí cảnh** (thưởng lần đầu, thu nhận trưởng lão ở tháp tầng 30 / 45), rương ngày **Tĩnh tọa ngộ đạo** (`towerChest`) và **Trấn Tháp Các** (`towerBuy`, `TOWER_SHOP`): Tháp Lệnh 10 mỗi tầng tháp (kỷ lục, giữ qua luân hồi) + 5 × phần rương mỗi lần mở Tĩnh tọa; đổi kinh thư, phù, duyên phù, phù tăng ích, tín vật trưởng lão của tuần (xoay 5 người), mỗi món có hạn tuần. Chưa có: huân chương theo sao màn bí cảnh.
- **Ưu tiên:** P1 · **Công sức:** S–M (tháp cho "tháp lệnh" mỗi tầng + cửa hàng nhỏ).

#### I6. Sunset Canyon Shop — Cửa hàng Hẻm Hoàng Hôn
- **Cơ chế:** Sunset Canyon (PvP phòng thủ bất đồng bộ, 5 lượt miễn phí/ngày, mùa 7 ngày) thưởng coin theo hạng để đổi tượng/đồ [1 nguồn; mặt hàng/giá chưa xác minh]. Chi tiết ở file 6.
- **Tu tiên hoá:** "Luận Kiếm Đài thương điếm".
- **Game mình:** ✅ **Luận Kiếm Thương Điếm** ở Luận Kiếm Đài (`arenaBuy`, `KY_SHOP`): Kiếm Ý từ mỗi trận (thắng 20, thua 8), rương ngày theo bậc, phục thù; đổi kinh thư, phù, thiếp, Chiến Ý Phù, mỗi món có hạn mỗi tuần. · **Ưu tiên:** P2 (file 6).

#### I7. KvK / Lost Kingdom — cửa hàng và tiền tệ mùa
- **Cơ chế:** KvK có tiền tệ và điểm riêng theo mùa: Honor Points (xếp hạng cá nhân/minh/vương quốc), Soluna Coins (góp công nghệ cả vương quốc) [1 nguồn]. Có cửa hàng cố định đổi Honor hay không [chưa xác minh]. Chi tiết ở file 6.
- **Game mình:** ✅ **Công Huân** (điểm cá nhân trong mùa, `sect/honor.ts`) → **Phi Thăng Tệ** (mỗi 20 Công Huân một đồng, giữ qua mùa) tiêu ở **Thiên Môn Thương Điếm** (`coinBuy`, `COIN_SHOP`); bên cạnh là điểm mùa theo phe, Chính Tà. · **Ưu tiên:** P2 (file 6).

#### I8. Event shops — Cửa hàng sự kiện
- **Cơ chế:** nhiều sự kiện có cửa hàng đổi điểm/coin: Ceroli Crisis shop, Lucky Stall, Wheel of Fortune (mốc 10/25/45/70/100 lượt quay) [1–2 nguồn]. "Cửa hàng sự kiện là nguồn tăng tốc lớn nhất" [1 nguồn]. Chi tiết ở file 5.
- **Tu tiên hoá:** "Hội chợ tiên phường" mở theo lễ hội.
- **Game mình:** ✅ Kiểu sự kiện `shop` (`festTokens` / `festBought` ở `core/fest.ts`): Tông Lệnh Bảo Khố, Danh Môn Tuần Lễ (Côn Lôn / Thục Sơn / Nga Mi), Trung Thu, Thất Tịch, Thôn Trang Gặp Nạn — việc ra lệnh bài, đổi món tuỳ chọn có hạn mức (không đủ đổi hết). Thiên Cơ Luân có mốc chắc trúng ô lớn mỗi 30 lượt.
- **Ưu tiên:** P2 · **Công sức:** S.

#### I9. Cash shop — Gói nạp
- **Cơ chế** [2 nguồn: heaven-guardian, handbook]:
  - **Growth Fund:** mua một lần (~$15), trả dần gem theo mốc CH, tổng ~81 000 gem.
  - **Gói gem 30 ngày:** ~19 500 gem cho ~$10, ~650 gem/ngày.
  - Gói hằng ngày/tuần/tháng, gói tướng, gói trang bị ("7-Day Material Supply" ~$5 = 1 000 gem + 2 nguyên liệu huyền thoại), gói tài nguyên, gói tăng tốc, gói "Super Value" $0,99/$4,99, gói di cư "New World".
  - Kênh ngoài app: web store PlutoMall [1 nguồn: rok.lilith.com].
- **Tu tiên hoá:** "Tu Tiên Lệnh" (season pass) + skin (PLAN mục 7).
- **Game mình:** ❌ cố ý — game không bán gì (README: gói nạp, Growth Fund, gem ❌ cố ý); Tu Tiên Lệnh có nhánh Kim Lệnh nhưng mở bằng Hương Hỏa 5, không bán (`sect/pass.ts`).
- **Ưu tiên:** P1 (khi tới P4) · **Công sức:** L (4 cổng thanh toán + pháp lý VN).

#### I10. Mua vật phẩm trực tiếp bằng gem
- **Cơ chế:** nhiều món mua thẳng bằng gem trong Shop khi thiếu, vd Master's Blueprint ~2 000 gem [2 nguồn]. Bảng giá gốc đầy đủ [chưa xác minh].
- **Game mình:** ❌ — ⛔ nếu bán sức mạnh; chỉ tiện lợi có trần.

---

### 2.J Buff thành & khi thành bị đánh

#### J1. Bảng buff thành
- **Cơ chế:** mọi buff đang chạy (khiên, thu thập, công/thủ, mở rộng quân, danh hiệu, buff vương quốc, buff đất liên minh…) hiện một chỗ, kèm đồng hồ, có nút dùng thêm vật phẩm để kéo dài [chưa xác minh vị trí UI]. Danh hiệu phải nhận **trước** khi bắt đầu việc mới có tác dụng [2 nguồn].
- **Tu tiên hoá:** "Trận pháp gia trì" (danh sách phù đang cháy trên bàn thờ Chủ điện).
- **Game mình:** ✅ Dải tăng ích trên HUD (`Buffs.svelte`): khiên, phù, đan, linh mạch, trận tiên minh, sắc phong / phúc Giới Chủ, tạp dịch thứ hai — icon + giờ còn lại; chạm mở bảng từng nguồn, hiệu quả, hạn, dùng ngay phù tăng ích / hộ sơn trong túi.
- **Ưu tiên:** P2 · **Công sức:** S.

#### J2. Bảo hộ tân thủ
- **Cơ chế:** acc mới có bảo hộ và dịch chuyển tân thủ trong 10 ngày đầu hoặc tới CH 8 [1 nguồn: riseofkingdomsguides jumper]. Thời hạn khiên tân thủ chính xác [chưa xác minh].
- **Game mình:** ✅ khiên tân thủ 72 giờ (`NEWBIE_SHIELD`), PvP mở ở tầng 6.
- **Ưu tiên:** — · **Công sức:** —.

#### J3. Bị cướp
- **Cơ chế:** quân thủ (tướng ở Tường + quân trong thành + viện binh đồng minh + Tháp canh) đánh với đội tới. Thua thì mất tài nguyên vượt mức Nhà kho theo sức mang [3 nguồn]. Báo cáo trận cho cả hai bên [chưa xác minh chi tiết].
- **Game mình:** ✅ cướp bất đồng bộ (tầng 6+, chỉ đánh người ≥ 50 % lực chiến mình, bảo hộ 45 % sức chứa, cướp 30 % phần vượt theo sức mang, báo thù 24 giờ, điểm kiểu Elo, trưởng lão trấn thủ, viện binh đồng minh ở P3).
- **Ưu tiên:** — · **Công sức:** —.

#### J4. Độ bền tường & thành cháy
- **Cơ chế:** bị đánh thắng thì thành **cháy**, độ bền Tường (và Tháp) tụt mạnh. Ngừng bị đánh thì một lúc sau lửa tự tắt; muốn dừng ngay thì chủ động sửa / dập lửa bằng gem [2–3 nguồn: riseofkingdomsguides wall + attack, bluestacks]. Tốc độ tụt, giá dập, hồi độ bền [chưa xác minh]. Một nguồn nói kẻ tấn công "có nhiều thời gian cướp trước khi độ bền về 0" [1 nguồn].
- **UI/UX:** thành bốc khói lửa trên bản đồ và trong cảnh thành; thanh độ bền; nút Dập lửa [chưa xác minh].
- **Tu tiên hoá:** "Trận lực" Hộ Sơn Đại Trận; bị phá thì "linh hỏa thiêu sơn": núi bốc khói mực, trận lực tụt theo thời gian, nút "Tu bổ trận cơ" (miễn phí mỗi 30 phút) hoặc dùng "Tức Hỏa Phù".
- **Game mình:** ✅ Linh hỏa thiêu sơn — trận lực lười theo thời gian (`core/wall.ts`), Tu bổ trận cơ (`mend`), Tức Hỏa Phù (`use` douse), cảnh báo HUD, lửa trên bản đồ giới.
- **Ưu tiên:** P1 (cho P3 có "thành" trên bản đồ) · **Công sức:** M.

#### J5. Bị buộc dịch chuyển
- **Cơ chế:** độ bền Tường về 0 thì thành bị ném sang một chỗ ngẫu nhiên [3 nguồn: riseofkingdomsguides wall + attack, heaven-guardian].
- **Tu tiên hoá:** "Sơn môn thất thủ": tông môn bị đánh bật khỏi linh địa, phải "di sơn" sang vùng hoang ngẫu nhiên trong giới.
- **Game mình:** ✅ sơn môn thất thủ (`world/wall.ts`, server `wallCheck`): trận lực về 0 lúc cháy thì bị đánh bật sang chỗ trống vùng ngoài.
- **Ưu tiên:** P2 · **Công sức:** M (cùng H11).

#### J6. War Frenzy — Cuồng chiến
- **Cơ chế:** đánh người chơi khác thì thành vào trạng thái War Frenzy một thời gian; trong lúc đó **không dịch chuyển được** [1 nguồn: riseofkingdomsguides teleport]. Không bật khiên được [chưa xác minh]. Thời hạn [chưa xác minh].
- **Tu tiên hoá:** "Sát khí chưa tan".
- **Game mình:** ✅ **Sát khí** (`FRENZY_TIME`): vừa xuất quân cướp tông môn / cướp khoáng thì mất khiên và 30 phút không bật được Hộ Sơn Phù, không dời núi, không bế quan.
- **Ưu tiên:** P1 (vá lỗ "cướp xong khiên luôn") · **Công sức:** S.

#### J7. Cảnh báo bị tấn công
- **Cơ chế:** có đội địch hướng về thành thì HUD báo đỏ, biết thời gian tới [chưa xác minh chi tiết; xem C2].
- **Game mình:** ✅ **Tháp canh** (`world/raid.ts`, `Hud.svelte`): đội địch đang kéo tới (cướp tông môn, kết trận, cướp khoáng) thì thẻ son ở mọi tab — tên, giờ tới, nút Bật khiên / Gọi về; offline thì Web Push.
- **Ưu tiên:** P1 · **Công sức:** S.

---

### 2.K Trang trí, bố cục, danh tính

#### K1. City edit mode — Sửa bố cục thành
- **Cơ chế:** kéo thả công trình tự do, **miễn phí**; có nhiều ô lưu bố cục; bố cục **không ảnh hưởng chỉ số**, chỉ tiện thao tác [2 nguồn: heaven-guardian, handbook].
- **Vì sao hấp dẫn:** cảm giác "thành của tôi", chia sẻ ảnh bố cục đẹp.
- **Tu tiên hoá:** "Bố trí sơn môn" trên các tầng núi.
- **Game mình:** ❌ — cảnh núi dựng theo tầng cố định (UX.md mục 1), làm tự do sẽ phá bố cục.
- **Ưu tiên:** P2 · **Công sức:** L.

#### K2. Decorations — Đồ trang trí
- **Cơ chế:** cây, tượng, đèn, vườn, đồ giới hạn. Có từ tiến độ CH, sự kiện, cửa hàng đặc biệt, gem. **Chủ yếu để ngắm, không buff** [2 nguồn]. Handbook nhắc đồ trang trí là thứ làm thành rối nhất.
- **Tu tiên hoá:** "Cảnh quan": tùng cổ, đá Thái Hồ, đèn đá, tượng tổ sư, hồ sen — đặt vào ô trống định sẵn trên núi.
- **Game mình:** ❌ (cosmetic dự kiến P4) · **Ưu tiên:** P2 · **Công sức:** M (vẽ bằng `@rok/art` + ô đặt cố định).

#### K3. City skins / themes — Skin thành
- **Cơ chế:** đổi diện mạo thành trên **bản đồ**. Một số skin **có buff** (công/thủ/thu thập/huấn luyện…). Vd skin thưởng Zenith of Power +20 % công bộ binh, vĩnh viễn cho top 20, 15–30 ngày cho top 100 [1 nguồn]; "thiết kế Tòa thị chính" cho buff như thủ quân/công kỵ [1 nguồn]. Có skin vĩnh viễn và có hạn. Nguồn: sự kiện (nơi có skin buff), shop/gói (skin ngắm), lễ hội, code quà [2 nguồn].
- **Tu tiên hoá:** "**Sơn môn cảnh sắc**" / "Pháp tướng tông môn": núi tuyết, rừng phong đỏ, tiên đảo mây.
- **Game mình:** ❌ — PLAN mục 7 dự kiến bán "skin tông môn" (P4). Nên **không kèm buff** (không P2W), trừ skin thưởng xếp hạng mùa (buff nhỏ, có hạn).
- **Ưu tiên:** P2 · **Công sức:** M.

#### K4. Hiệu ứng thành, dịch chuyển, hành quân; khung hồ sơ
- **Cơ chế:** đồ ngắm của SVIP shop/sự kiện: hiệu ứng quanh thành, hiệu ứng lúc dịch chuyển, vệt khi hành quân, chủ đề hồ sơ [2 nguồn].
- **Tu tiên hoá:** hào quang sơn môn, vệt kiếm quang của đội, mây ngũ sắc khi độ kiếp công khai.
- **Game mình:** ❌ · **Ưu tiên:** P2 · **Công sức:** S–M mỗi loại (VFX nét bút sẵn có).

#### K5. Kingdom titles — Danh hiệu vương quốc
- **Cơ chế:** vua (và người được uỷ quyền) phong danh hiệu có buff/debuff [1 nguồn heaven-guardian, riêng Duke ~10 % huấn luyện: 2 nguồn].
  - Dương: Duke (thủ +5 %, huấn luyện +10 %), Architect (xây +10 %), Scientist (nghiên cứu +5 %, thu vàng +10 %), Justice (công +5 %, hành quân +10 %). Chức lớn: Queen (thu thập +15 %), General (công/thủ +5 %), Prime Minister (sản lượng +15 %, xây +10 %).
  - Âm: Traitor (công/thủ −3 %), Beggar (sản lượng −10 %), Exile (thủ −5 %), Slave (máu −5 %), Sluggard (hành quân/huấn luyện −5 %), Fool (xây/nghiên cứu −5 %).
  - Tính ở **lúc bắt đầu việc**; không giới hạn số lần xin [1 nguồn]. Chi tiết ở file 4.
- **Tu tiên hoá:** "Phong hào" của Giới chủ: "Thiên Công" (xây), "Văn Khúc" (công pháp), "Luyện Binh Sứ"…
- **Game mình:** ✅ Sắc phong Giới Chủ (`TITLES`, `world/lord.ts`): Giới Chủ phong 4 phúc / 4 hoạ có tăng / giảm ích, mỗi tước giữ 24 giờ, phong lại chờ 10 phút; thêm danh hiệu phi thăng (`ascended`) và danh hiệu mùa (`crowns`).
- **Ưu tiên:** P2 (file 4) · **Công sức:** S.

---

### 2.L Gems — tiền premium

#### L1. Nguồn miễn phí
- **Nhiệm vụ hằng ngày:** mốc 100 điểm hoạt động = **100 gem/ngày** (~3 000/tháng) [2 nguồn].
- **Mỏ gem trên bản đồ:** cần công nghệ Jewelry; Cutting & Polishing +35 % tốc thu gem [1 nguồn]. Trữ lượng mỗi mỏ [mâu thuẫn/chưa xác minh — heaven-guardian ghi 10/20 gem, không đáng tin].
- **Man tộc, pháo đài** (theo cấp), **hang bí ẩn**, **viễn chinh** (một đống lần đầu), **Peerless Scholar**, **Ark of Osiris**, **sự kiện** (hầu hết sự kiện có gem) [2 nguồn].
- **KvK:** chiếm công trình lần đầu, nhiệm vụ mùa [2 nguồn].
- **Tiến độ:** thưởng CH 16/21/25 (100/200/500) [1 nguồn], nhiệm vụ phụ nâng CH [1 nguồn].
- **Khác:** rương liên minh (có khi ra gem), code quà (dịp kỷ niệm hào phóng nhất), liên kết Facebook 200 gem [1 nguồn], rương VIP.
- Tổng: "không nguồn nào hấp dẫn riêng lẻ, nhưng gom 6 tháng là một khoản lớn" [1 nguồn].

#### L2. Nguồn trả tiền
- Growth Fund ~81 000 gem, gói 30 ngày ~19 500 gem, các gói khác (I9) [2 nguồn].

#### L3. Chỗ tiêu (theo thứ tự hướng dẫn F2P khuyên)
1. **Điểm VIP** tới VIP 6 → 10 → 12/14 [2 nguồn].
2. **Book of Covenant** (Lâu đài) [2 nguồn].
3. Sự kiện tướng có mục tiêu. Wheel of Fortune: 10 lượt đầu ~4 400 gem [heaven-guardian] hay ~5 600 gem [riseofkingdomsguides] [mâu thuẫn]; 100 lượt ~70 000 gem [1 nguồn].
4. VIP shop, Thương nhân (món giảm sâu), chìa vàng, dịch chuyển, khiên [2 nguồn].
5. **Không nên:** hoàn thành ngay, mua tài nguyên, mua dịch chuyển đã có ở cửa hàng liên minh [2 nguồn].
- **More Than Gems:** sự kiện 2 ngày, không lịch cố định. Mốc tiêu gem **mỗi ngày** 300 / 1 000 / 3 000 / 7 000 / 25 000. 7 000 → 5 tượng huyền thoại vạn năng, 25 000 → 13; tối đa 26 tượng/2 ngày. Tiêu vào điểm VIP, sách, quay thưởng, VIP shop, Thương nhân đều được tính [2 nguồn]. Đây là lý do "để dành gem" (chi tiết ở file 5).

- **Tu tiên hoá:** "**Tiên ngọc**" (PLAN mục 3: premium P4). Nguồn miễn phí: nhiệm vụ ngày (mốc cuối), tháp (mỗi 5 tầng lần đầu), bí cảnh lần đầu, sự kiện tuần, "Luận Đạo Đài", mỏ "Ngọc tủy" hiếm trên bản đồ giới. Chỗ tiêu: Vạn Bảo Lâu, làm mới Vân Du Thương Nhân, Duyên vàng (không bán lấy tiền), skin.
- **Game mình:** ❌ cố ý — không có tiền premium (Tiên ngọc) vì game không bán gì; các chỗ RoK tiêu gem đều kiếm bằng chơi: Hương Hỏa (chuỗi ngày, Hương Hỏa Lệnh), thiếp Chiêu Hiền miễn phí, Hương Hỏa Các / Thương nhân vân du (trả tài nguyên), Thiên Môn Thương Điếm (Phi Thăng Tệ).
- **Ưu tiên:** P1 · **Công sức:** L (tiền tệ mới + nguồn + chỗ tiêu + cân nhịp + chặn cày acc phụ).

---

## 3. Bảng tổng kết khoảng cách

| # | Tính năng RoK | Game mình | Ưu tiên | Công sức |
|---|---|---|---|---|
| A1 | Tòa thị chính 1–25, trần cấp, mở khoá | ✅ Chủ điện 1–25 (+độ kiếp) | — | — |
| A1b | Điều kiện phụ mỗi cấp CH (Tường N−1 + 1 nhà xoay vòng) | ❌ đã thử 25/09 rồi bỏ: nhịp hiện tại cân theo lối dồn Chủ điện — lệch 1: tầng 25 không tới trong 60 ngày (22); lệch 3: vẫn 24/25, sim tranh đoạt trung vị tầng 15, người chơi thường MH15 ngày 26. Muốn có thì phải chỉnh lại chi phí / thời gian xây cả chuỗi | P1 | S (+ chỉnh nhịp L) |
| A1c | Thưởng mỗi cấp CH, "Era Breakthrough" | 🟡 qua nhiệm vụ chính tuyến | P1 | S |
| A2 | 5 thời đại, thành đổi diện mạo | ✅ 5 cảnh giới, 5 bộ mái (cả tầng 16–25); quà mừng mỗi tầng Chủ điện + lễ đột phá cảnh giới (`hallGift`) | P2 | S–M |
| A3 | Văn minh (kiến trúc + buff) | ✅ Chín đạo thống: 3 tiềm năng, đệ tử đặc trưng, trấn phái chi bảo trên núi, tổ sư + huy hiệu riêng, chọn lúc lập tông môn | P2 | M |
| B0 | Bong bóng chạm thu tài nguyên | ✅ bong bóng trên công trình, chạm thu, phần chờ thu an toàn | P1 | M |
| B1–B4 | 4 bản mỗi công trình tài nguyên | 🟡 1 bản mỗi loại | P2 | M |
| B4 | Tài nguyên mở muộn (đá CH 4, vàng CH 10) | ❌ 3 loại có từ đầu | P2 | L |
| B5 | Nhà kho: bảo hộ lượng tuyệt đối theo cấp | 🟡 bảo hộ 45 % sức chứa, phẳng | P1 | S |
| B6 | Trạm giao thương (gửi đồng minh, thuế 35→8 %) | ✅ Vận Linh Trận | P1 | M |
| C1 | Tường: độ bền, tướng thủ | ✅ Hộ Sơn Đại Trận: trận lực, linh hỏa, trấn thủ (`core/wall.ts`) | P1 | M |
| C2 | Tháp canh: bắn địch, báo trước | 🟡 Tháp canh báo trước (thẻ son + Web Push); chưa bắn địch | P1 | S |
| C3–C6 | 4 trại lính riêng, hàng song song | ✅ gộp 1 Diễn võ trường | P2 | M |
| C7 | 4 bệnh viện, viện đầy thì chết | ✅ Đan phòng (1 nhà) | — | — |
| C8 | Lâu đài: sức chứa kết trận | 🟡 kết trận 8 đội cố định | P2 | S |
| C9 | Trại trinh sát, làng/hang | ✅ linh điểu + thôn trang / động phủ (mê vụ) | P2 | M |
| D1 | Học viện: tốc nghiên cứu, cây kinh tế | ✅ Tàng Kinh Các; 🟡 thiếu tốc nghiên cứu | P2 | S |
| D2 | Trung tâm liên minh: 5→30 lượt giúp, viện binh | 🟡 10 → 15 lượt theo Hộ Minh Đại Trận, không công trình | P1 | S |
| D3 | Tửu quán: rương miễn phí theo giờ | ✅ Chiêu Hiền Đài (thiếp bạc 6 giờ, vàng 48 giờ; không bán) | P1 | M |
| D4/F1 | Thợ xây thứ 2 (thuê 2 ngày / VIP 6) | ✅ Tạp Dịch Lệnh (thuê 48 giờ, không vĩnh viễn) | P1 | M |
| D5 | Lò rèn, nguyên liệu | ✅ Luyện Khí Phòng tất định (chủ đích) | — | — |
| D6/I1 | Cửa hàng VIP (làm mới tuần) | ✅ Hương Hỏa Các (`VIP_SHOP`) | P1 | M |
| D7/I4 | Thương nhân bí ẩn | ✅ Thương nhân vân du | P1 | S–M |
| D8 | Đài kỷ niệm: mốc chung cả vương quốc | ✅ Thiên Đạo Biên Niên (13 chương, quà cả giới, chương xong sớm mở pha sớm, công đầu từng chương) | P1 | M |
| D9 | Lyceum (câu đố) | ✅ Vấn Đạo Đài | P2 | M |
| D10 | Bảng tin | 🟡 thư admin | P2 | S |
| D11 | State Forum (armaments) | ❌ (file 2) | P2 | L |
| D12 | Bảo tàng (buff mùa) | ❌ | P2 | M |
| D13 | Mỏ/TT nghiên cứu pha lê (công nghệ mùa) | ❌ (file 6) | P2 | M |
| D14 | Mỏ Heliamber ("Valor") | ❌ chưa xác minh | P2 | — |
| E6 | Không upkeep quân | ✅ | — | — |
| E7 | Kho không trần, túi đồ an toàn | 🟡 kho có trần (chủ đích); ✅ túi an toàn | P1 | S |
| E8 | Thu thập trên bản đồ | ✅ mỏ, linh mạch, linh triều (P3) | — | — |
| F3 | Giúp đỡ trả điểm cho người giúp | ✅ cống hiến (trần 250/ngày từ giúp) | P1 | S |
| F4 | Tăng tốc chung/riêng, dùng từ việc đang chạy | ✅ | — | — |
| F5 | Hoàn thành ngay bằng gem | ❌ ⛔ (chỉ bản có trần) | P2 | S |
| F6 | Miễn phí khi còn < N phút | ✅ Hương Hỏa: xong miễn phí việc còn ≤ 1–8 phút | P2 | S |
| F7 | Quick Replenish (bù bằng nang) | ✅ bù tài nguyên thiếu một chạm | P1 | S |
| G1 | Cấp VIP 0–19 + SVIP | ✅ Hương Hỏa 12 cấp (không bán) | P1 | M |
| G2 | Điểm danh chuỗi 40→200/ngày | ✅ Hương Hỏa 40→200 điểm/ngày theo chuỗi | P1 | S |
| G3 | Rương VIP hằng ngày (tượng từ VIP 10) | ✅ lễ vật Hương Hỏa mỗi ngày (theo cấp) | P1 | S |
| G4 | Rương đặc quyền mỗi cấp | ❌ | P2 | S |
| G5 | Buff VIP vĩnh viễn | ✅ tăng ích Hương Hỏa theo cấp (có trần) | P1 | M |
| G6 | VIP 19, SVIP, SVIP shop | ❌ | P2 | M |
| H0 | Túi đồ, tab, dùng nhiều | ✅ | — | — |
| H1–H2 | Tăng tốc chung + 4 loại riêng | ✅ (5 phút → 24 giờ) | — | — |
| H3 | Gói tài nguyên | ✅ nang 1K–100K | — | — |
| H4 | Rương chọn tài nguyên | ❌ | P2 | S |
| H5 | Tăng thu thập 50 % | ✅ Khai Linh Phù 8/24 giờ (`gather`) | P2 | S |
| H6–H7 | Tăng sản lượng, tăng công/thủ | ✅ Tụ Linh, Chiến Ý, Kim Cương, Hộ Thể Phù | — | — |
| H8 | Mở rộng quân | ✅ trận dung (`capOf`) + Khuếch Trận Kỳ +10 % | P2 | S |
| H9 | Khiên 8 giờ/24 giờ/3 ngày | ✅ Hộ Sơn Phù 8/24/72 giờ | — | — |
| H10 | Chống do thám | ❌ | P2 | S |
| H11 | 4 loại dịch chuyển | ✅ dời núi tân thủ, dời vào lãnh thổ, Di Sơn Phù, Càn Khôn Phù | P2 | M |
| H12 | Chìa Tửu quán | ✅ Ngân / Kim Duyên Phù | P1 | S |
| H13 | Sách kinh nghiệm | ✅ Tâm Đắc Kinh Thư | — | — |
| H14 | Tượng tướng, Starlight | 🟡 tín vật trưởng lão (thu nhận, nâng sao); chưa có vạn năng | P2 | L |
| H15 | Nguyên liệu, bản vẽ | ❌ chủ đích (file 2) | P2 | L |
| H16 | Vật phẩm nâng nhà đặc biệt (sách, tên, Blueprint) | ❌ | P2 | S |
| H17 | Vật phẩm điểm VIP | ✅ Hương Hỏa Lệnh | P1 | S |
| H18 | Hồi AP | ✅ Hành Lực Đan (hành lực săn yêu thú giới) | — | — |
| H19 | Thuê thợ 2 ngày | ✅ Tạp Dịch Lệnh 48 giờ | P1 | S |
| H20 | Bản đồ xoá sương | ✅ Sơn Hà Đồ (`BAG.sonHa12`) | P2 | — |
| H21 | Hộ chiếu di cư | ⛔ | — | — |
| H22 | Đổi văn minh | ✅ cải tu đạo thống (7 ngày một lần) | P2 | — |
| H23 | Đổi tên, khung hồ sơ | ✅ Cải Danh Lệnh, đổi chân dung, khung chân dung theo thành tích (`FRAMES`) | P2 | S |
| H24 | Coin sự kiện | ✅ Tông Môn Lệnh, lệnh bài Danh Môn Tuần Lễ | P2 | S |
| I2 | SVIP shop (đồ ngắm) | ❌ | P2 | M |
| I3 | Cửa hàng liên minh + điểm cá nhân + Reclaim | ✅ Cống Hiến Các (cống hiến + Minh khố); chưa có Reclaim | P1 | M |
| I5 | Cửa hàng viễn chinh | ✅ Trấn Tháp Các: Tháp Lệnh từ tầng tháp + rương ngày, hàng giới hạn tuần | P1 | S–M |
| I6 | Cửa hàng Sunset Canyon | ✅ Luận Kiếm Thương Điếm (Kiếm Ý) | P2 | — |
| I7 | Cửa hàng/tiền tệ KvK | ✅ Công Huân → Phi Thăng Tệ, Thiên Môn Thương Điếm (`coinBuy`) | P2 | — |
| I8 | Cửa hàng sự kiện | ✅ Tông Lệnh Bảo Khố, Danh Môn Tuần Lễ (đổi lệnh bài) | P2 | S |
| I9 | Gói nạp (Growth Fund, gem 30 ngày…) | ❌ (P4) | P1 | L |
| I10 | Mua vật phẩm bằng gem | ❌ ⛔ nếu bán sức mạnh | — | — |
| J1 | Bảng buff thành | ✅ dải tăng ích (bảng từng nguồn, hạn) | P2 | S |
| J2 | Bảo hộ tân thủ | ✅ 72 giờ | — | — |
| J3 | Bị cướp theo sức mang | ✅ | — | — |
| J4 | Thành cháy, độ bền tụt | ✅ Linh hỏa thiêu sơn (`core/wall.ts`) | P1 | M |
| J5 | Bị buộc dịch chuyển | ✅ sơn môn thất thủ (`world/wall.ts`) | P2 | M |
| J6 | War Frenzy (khoá khiên/dịch chuyển sau khi đánh) | ✅ sát khí (cướp xong 30 phút không bật Hộ Sơn Phù) | P1 | S |
| J7 | Cảnh báo đội địch đang tới | ✅ Tháp canh (thẻ son mọi tab + Web Push) | P1 | S |
| K1 | Sửa bố cục thành | ❌ | P2 | L |
| K2 | Đồ trang trí | ❌ | P2 | M |
| K3 | Skin thành (có loại có buff) | ❌ (P4, không buff) | P2 | M |
| K4 | Hiệu ứng thành/dịch chuyển/hành quân | ❌ | P2 | S–M |
| K5 | Danh hiệu vương quốc có buff | ✅ sắc phong Giới Chủ (4 phúc / 4 hoạ) | P2 | S |
| L | Gems: nguồn miễn phí, chỗ tiêu, More Than Gems | ❌ (Tiên ngọc P4) | P1 | L |

### 3.1 Năm khoảng cách lớn nhất (đề xuất thứ tự làm)

1. **Tiền tệ tích luỹ + cửa hàng** (Tiên ngọc kiếm được, "cống hiến" từ giúp đỡ, huân chương tháp; Vạn Bảo Lâu, Tiên Minh Bảo Khố, Vân Du Thương Nhân). Túi đồ đã có mà nguồn và "đích mua sắm" còn mỏng. RoK giữ chân mỗi ngày bằng chính vòng *kiếm điểm → mua đồ giới hạn → dùng trong sự kiện*.
2. **Hàng đợi xây thứ 2** ("Thuê Dịch Lệnh" 48 giờ + vĩnh viễn ở mốc Hương Hỏa). PLAN đã đo đây là đòn bẩy nhịp mạnh nhất → phải có trần và qua sim.
3. **"Hương Hỏa" thay VIP** (không bán điểm): chuỗi đăng nhập 40→200, rương ngày theo mốc, buff vĩnh viễn có trần. Đây là lực kéo đăng nhập số một của RoK.
4. **Phòng thủ thành kiểu RoK**: bảo hộ kho theo tầng Tàng Bảo Các, Thiên Nhãn Lâu báo trước, trận lực + linh hỏa (cháy), khoá "cướp xong bật khiên", về sau là dời núi.
5. **Tụ Duyên Các (rương miễn phí theo giờ, bảo hiểm tất định) + Tiên Minh Điện (lượt giúp theo tầng) + Truyền Tống Trận (gửi tài nguyên có thuế, có trần)**: ba công trình xã hội–kinh tế RoK có mà mình chưa có.

---

## 4. Nguồn

**Tòa thị chính, thời đại, công trình**
- https://app.rokstats.online/buildings (danh sách 26 công trình nâng cấp được)
- https://app.rokstats.online/buildings/city-hall
- https://app.rokstats.online/buildings/wall
- https://app.rokstats.online/buildings/watchtower
- https://app.rokstats.online/buildings/storehouse
- https://app.rokstats.online/buildings/farm
- https://app.rokstats.online/buildings/state-forum
- https://app.rokstats.online/buildings/heliamber-mine-i
- https://app.rokstats.online/buildings/heliamber-mine-extra
- https://app.rokstats.online/buildings/crystal-mine
- https://app.rokstats.online/buildings/crystal-research-center
- https://riseofkingdomsguides.com/rise-of-kingdoms-city-hall-requirements-and-cost/
- https://riseofkingdomsguides.com/rise-of-kingdoms-ages/
- https://riseofkingdomsguides.com/buildings/
- https://riseofkingdomsguides.com/wall/
- https://riseofkingdomsguides.com/watchtower/
- https://riseofkingdomsguides.com/hospital/
- https://riseofkingdomsguides.com/storehouse/
- https://riseofkingdomsguides.com/alliance-center/
- https://riseofkingdomsguides.com/trading-post/
- https://riseofkingdomsguides.com/tavern/
- https://riseofkingdomsguides.com/academy/
- https://riseofkingdomsguides.com/barracks/
- https://riseofkingdomsguides.com/shop/
- https://riseofkingdomsguides.com/courier-station/
- https://riseofkingdomsguides.com/rise-of-kingdoms-castle-upgrade-requirements-cost-book-of-covenant/
- https://riseofkingdomsguides.com/the-museum-building-guide-rok/
- https://riseofkingdomsguides.com/season-of-conquest-crystal-tech-changes-in-rise-of-kingdoms/
- https://riseofkingdomsguides.com/how-to-unlock-tier-5-units-fast/
- https://www.gamesguideinfo.com/rise-of-kingdoms/overview/buildings (và các trang công trình 120000287–120000310: City Hall, Farm, Gold Mine, Quarry, Storehouse, Castle, Watchtower, Trading Post, Tavern, Alliance Center, Hospital, Barracks, Scout Camp, Monument, Builder's Hut, Notice Board)
- https://gamerempire.net/rise-of-kingdoms-city-hall-guide-upgrade-requirements-rewards/
- https://www.pocketgamer.com/rise-of-kingdoms/city-hall/
- https://www.ajackof.com/games/rise-of-kingdoms-lost-crusade/rok-city-hall-building-requirements-in-rise-of-kingdoms/
- https://heaven-guardian.com/rise-of-kingdoms-city-hall-upgrade-guide-level-up-fast/
- https://heaven-guardian.com/rise-of-kingdoms-buildings-guide-city-development/
- https://heaven-guardian.com/rise-of-kingdoms-trading-post-guide-level-up-dominate/
- https://heaven-guardian.com/rise-of-kingdoms-academy-guide/
- https://heaven-guardian.com/rise-of-kingdoms-ultimate-city-design-guide/
- https://theriagames.com/guide/rise-of-kingdoms-farm-guide/
- https://www.bluestacks.com/blog/game-guides/rise-of-kingdoms/rok-city-building-guide-en.html
- https://www.mumuplayer.com/blog/rise-of-kingdoms-building-guide.html
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-buildings-guide-hub
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-ages-guide
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-city-layout-guide
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-troop-capacity-march-queues-guide
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-healing-hospital-guide
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-farm-account-guide
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-lyceum-of-wisdom-guide
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-equipment-guide

**Tài nguyên, vật phẩm, tăng tốc**
- https://riseofkingdomsguides.com/rise-of-kingdoms-resources-calculator/ (mệnh giá gói tài nguyên, đọc từ cấu trúc bảng tính)
- https://riseofkingdomsguides.com/rise-of-kingdoms-speedup-calculator/ (mệnh giá tăng tốc)
- https://riseofkingdomsguides.com/how-to-get-speedups-in-rise-of-kingdoms/
- https://riseofkingdomsguides.com/farming-gathering-guide/
- https://riseofkingdomsguides.com/is-gold-important-in-rise-of-kingdoms/
- https://riseofkingdomsguides.com/how-to-teleport-in-rise-of-kingdoms/
- https://riseofkingdomsguides.com/rise-of-kingdoms-equipment-guide/
- https://riseofkingdomsguides.com/rise-of-kingdoms-sculptures-guide/
- https://riseofkingdomsguides.com/rise-of-kingdoms-action-points/
- https://riseofkingdomsguides.com/rise-of-kingdoms-jumper-guide/
- https://riseofkingdomsguides.com/scouting-tribal-village-and-mysterious-cave-guide/
- https://riseofkingdomsguides.com/rise-of-kingdoms-attacking-cities-and-flags-guide/
- https://riseofkingdomsguides.com/lyceum-of-wisdom-rok-answers/
- https://riseofkingdomsguides.com/lucky-stall-and-lucky-spin-guide/
- https://heaven-guardian.com/rise-of-kingdoms-speedups-the-ultimate-guide-to-domination/
- https://heaven-guardian.com/rise-of-kingdoms-teleport-guide/
- https://heaven-guardian.com/rise-of-kingdoms-gathering-guide-dominate-resources/
- https://heaven-guardian.com/rise-of-kingdoms-farm-account-guide-for-max-resources/
- https://heaven-guardian.com/rok-migration-guide-2026/
- https://heaven-guardian.com/rise-of-kingdoms-beginners-guide/
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-resources-guide-hub
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-speedups-guide
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-tavern-keys-guide
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-game-mechanics-hub

**VIP, cửa hàng, gems, sự kiện tiêu gem**
- https://riseofkingdomsguides.com/how-do-you-get-vip-points-in-rise-of-kingdoms/
- https://www.topuplive.com/news/rise-of-kingdoms-vip-guide.html
- https://heaven-guardian.com/rise-of-kingdoms-vip-guide-level-up-fast-get-rewards/
- https://heaven-guardian.com/rise-of-kingdoms-vip-shop-guide-dominate-maximize-benefits/
- https://www.gamesguideinfo.com/rise-of-kingdoms/overview/vip-levels (và trang VIP 1, 6, 10, 13, 15)
- https://gamerempire.net/rise-of-kingdoms-how-to-get-vip-points/
- https://www.packsify.com/blogs/rise-of-kingdoms-vip-guide
- https://www.ldshop.gg/blog/rise-of-kingdoms/vip-progression-guide.html
- https://www.ldshop.gg/blog/rise-of-kingdoms/svip-shop-guide.html
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-vip-levels-guide
- https://riseofkingdoms.fandom.com/wiki/VIP (chỉ qua đoạn trích tìm kiếm: chuỗi đăng nhập 40 +20 → 200)
- https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-87-rex-totius-britanniae-update/ (VIP 19, SVIP, Quick Replenish)
- https://www.empirebuildacademy.com/post/catch-all-the-latest-from-rise-of-kingdoms
- https://heaven-guardian.com/rise-of-kingdoms-march-of-the-ages-update/ (VIP 18, 1.0.48)
- https://riseofkingdomsguides.com/updates/
- https://riseofkingdomsguides.com/how-to-get-alliance-and-individual-credits-in-rise-of-kingdoms/
- https://heaven-guardian.com/rise-of-kingdoms-earn-spend-alliance-individual-credits/
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-alliance-shop-guide
- https://heaven-guardian.com/rise-of-kingdoms-courier-station-guide/
- https://heaven-guardian.com/rise-of-kingdoms-expedition-guide-tips-rewards/
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-expedition-guide
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-sunset-canyon-guide
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-kvk-guide-hub
- https://heaven-guardian.com/rise-of-kingdoms-light-darkness-kvk-domination-guide/
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-shop-and-bundles-guide
- https://heaven-guardian.com/rise-of-kingdoms-best-bundles-spending-guide-2026/
- https://riseofkingdomsguides.com/rise-of-kingdoms-gems/
- https://riseofkingdomsguides.com/where-to-spend-gems-in-rise-of-kingdoms/
- https://heaven-guardian.com/rise-of-kingdoms-gems-guide/
- https://heaven-guardian.com/rise-of-kingdoms-gem-farming-guide-best-commanders-tips/
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-how-to-get-gems
- https://heaven-guardian.com/rise-of-kingdoms-dominate-more-than-gems-event/
- https://heaven-guardian.com/rise-of-kingdoms-wheel-of-fortune-guide/
- https://rok.lilith.com/ (liên kết PlutoMall)

**Trang trí, skin, danh hiệu**
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-city-skins-themes-guide
- https://heaven-guardian.com/rise-of-kingdoms-titles-guide-to-maximize-your-buffs/
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-kingdom-titles-guide
