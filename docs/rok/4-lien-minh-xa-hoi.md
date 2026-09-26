# 4. Liên minh, xã hội & tương tác người chơi — Rise of Kingdoms → Sơn Hà Tiên Tông

> Nghiên cứu ngày 24/09/2026. Phạm vi: mọi hệ thống liên minh, giao tiếp, trao đổi, chính trị vương quốc và PvP của RoK bản global hiện hành, đối chiếu với mã hiện tại: `packages/rules/world/{alliance,raid,spots,points,market,season,map}.ts`, `packages/rules/data.ts`, `packages/rules/sect/inbox.ts`, `apps/server/src/game/{chat,talk,inbox,notify}.ts`, `apps/client/src/{Alliance,Chat,Ranks,Rivals}.svelte`.
>
> **Ký hiệu độ tin cậy của số liệu RoK:** **[2 nguồn]** = ít nhất 2 nguồn khớp · **[1 nguồn]** · **[mâu thuẫn]** = nguồn lệch nhau, ghi cả hai · **[chưa xác minh]** = theo hiểu biết chung về RoK, chưa có nguồn đọc được để kiểm. Phải kiểm lại trong game trước khi dựa vào. Mốc "1.0.xx" là số bản cập nhật RoK (patch note), ghi kèm tháng nếu biết.
>
> **Game mình:** ✅ có tương đương · 🟡 có một phần · ❌ chưa có · ⛔ nằm trong danh sách "Không làm" của PLAN mục 1 (vẫn ghi cho đủ danh mục).
> **Ưu tiên:** P0 cốt lõi · P1 quan trọng · P2 thêm hương vị. **Công sức** (một người, đã quen codebase): S ≤ 2–3 ngày · M ~1–2 tuần · L > 2 tuần.
>
> **Giới hạn nguồn:** wiki fandom (HTTP 402), rok.guide (503) và reddit (bị chặn) không đọc trực tiếp được; số liệu của fandom chỉ có qua tóm tắt kết quả tìm kiếm. Patch note đọc được tới 1.0.89 (12/2024). Thay đổi 2025–2026 chỉ thấy qua vài hướng dẫn ghi năm 2026 (heaven-guardian), nên những gì "mới nhất" có thể còn thiếu. Mô tả UI của RoK là mô tả chức năng; vị trí nút cụ thể có thể khác.

---

## 1. Tóm tắt mảng

### 1.1 Vai trò trong vòng lặp chơi của RoK

RoK dựng hầu hết đòn bẩy tiến độ sao cho phải đi qua liên minh. Chơi một mình vẫn được, nhưng chậm và nguy hiểm hơn hẳn:

| Nhịp | Người chơi làm gì với người khác |
|---|---|
| Mỗi phiên (vài phút) | Chạm "Giúp tất cả" (Help), nhờ giúp cho việc vừa đặt, mở quà liên minh, góp công nghệ (20 lượt tích, hồi 1 lượt/30 phút), chat minh |
| Mỗi ngày | Kết trận (rally) đánh pháo đài man tộc để lấy sách nâng Castle và quà cho cả minh, xây/góp quân cho cờ, thu tài nguyên trong lãnh thổ (+25%), xin title của vua trước khi đặt việc dài |
| Mỗi tuần / 2 tuần | Ark of Osiris (~30 đấu 30, đăng ký trước), Alliance Mobilization (bảng nhiệm vụ chung), tranh thánh địa/đèo, MGE (có luật cộng đồng) |
| Mỗi mùa (~3 tháng) | KvK: cả vương quốc, liên quân các minh đánh vương quốc khác; sau đó là di cư, đổi vua, chia lại quyền lực |

Có ba tầng xã hội chồng lên nhau:

1. **Liên minh.** Là "gia đình" hằng ngày: giúp đỡ, quà, công nghệ, cửa hàng, lãnh thổ, kết trận, chat minh.
2. **Vương quốc.** Là "chính trường": vua (minh giữ Lost Temple) phong title buff/debuff, bật buff toàn vương quốc, duyệt nhập cư. Các minh ký NAP, đặt luật MGE, và "zero" kẻ phá luật.
3. **Liên vương quốc.** KvK, giải Osiris League (có khán giả và đặt cược), Champions of Olympia, kênh chat theo ngôn ngữ.

PvP trong vương quốc chủ yếu là **PvP có quản lý**. Khiên, luật cộng đồng, title trừng phạt và zeroing cùng tạo trật tự. Cảm giác "có luật chơi của người chơi" là một phần sức hút.

### 1.2 Vì sao người chơi thích

- **Góp nhỏ, thấy thành quả chung lớn.** Một chạm giúp đỡ bớt vài phút cho người khác. Một lượt góp tài nguyên đẩy thanh công nghệ của cả minh. Mọi người đều nhìn thấy mình góp.
- **Của trời cho.** Có người nạp tiền hay hạ pháo đài là mọi thành viên nhận quà, và thấy tên người tạo ra quà. Người không nạp được "nuôi", người nạp được biết ơn.
- **Địa vị và danh tính.** Tag, cờ, cấp R, chức vị có buff, title của vua, kill points trên hồ sơ, bảng xếp hạng.
- **Lịch hẹn chung.** Ark mỗi 2 tuần, Mobilization, MGE, KvK mỗi ~3 tháng. Có đăng ký trước, có giờ tập trung, nên có lý do mở game đúng giờ cùng bạn bè.
- **Phối hợp và kịch tính.** Kết trận đông người, đánh dấu bản đồ, chiến báo chia sẻ vào chat, Discord ngoài game, chính trị giữa các minh.
- **Được che chở.** Minh viện binh, phản công hộ. Người nạp nhiều đứng mũi chịu sào cho người chơi miễn phí.

### 1.3 Game mình đang ở đâu

**Đã có (P3, xong phần mã):**
- tiên minh cơ bản: lập, vào, rời, đá, 3 chức vị, bố cáo;
- giúp tăng tốc 10 lần/việc;
- kết trận 8 đội để chiếm điểm hoặc đánh yêu vương;
- viện binh đóng ở nhà đồng minh (3 đội);
- linh mạch buff sản lượng cả minh (trần 30%);
- điểm mùa theo phe, minh đầu phi thăng;
- chat kênh giới và kênh minh (lọc từ, báo cáo, chặn, cấm chat);
- thư hệ thống có quà;
- 5 bảng xếp hạng, điểm mùa, bảng phong thần;
- PvP cướp bất đồng bộ có khiên, báo thù, Elo, luật chống bắt nạt;
- chợ giữa người chơi;
- biên niên giới.

**Điểm game mình đã khác hoặc hơn RoK, nên giữ:**
- **Độ kiếp công khai.** Đồng minh đến hộ pháp, địch đến phá kiếp (`TRIB_AID`). Đây là một vòng "cứu bạn/phá thù" mà RoK không có.
- **Yêu vương dùng chung.** Máu chung, mỗi đội đánh một lát; thưởng chia theo sát thương qua thư (`boss`).
- **Luật chống bắt nạt cứng.** Không đánh được người có lực chiến dưới 50% mình (`PVP_FLOOR`), trừ khi báo thù. Có khiên 8 giờ sau khi thua; sim đo người không đi cướp bị cướp tối đa 2 lần/ngày. RoK để việc này cho luật cộng đồng.
- **Chợ có biên giá và thuế đốt.** Chặn "acc phụ nuôi acc chính". RoK không có chợ; Trading Post của RoK lại chính là kênh nuôi farm.
- **Mùa 49 ngày trong một giới.** Thay KvK và di cư (⛔ trong PLAN).

### 1.4 Năm khoảng cách lớn nhất (chi tiết ở mục 3)

1. **Vòng đóng góp hằng ngày của minh.** Chưa có công nghệ minh + quyên góp tích lượt + điểm cống hiến + cửa hàng minh (B3, B4). ❌ · P0 · L.
2. **Minh lễ (quà liên minh).** Quà cho cả minh khi hạ yêu vương/yêu trại hoặc (từ P4) khi có người nạp; cấp quà và rương chung; mục tiêu kết trận nhỏ hằng ngày (B2, J9). ❌ · P0 · M.
3. **Công cụ phối hợp.** Thiếu đánh dấu bản đồ cho minh, chia sẻ toạ độ/chiến báo vào chat, chat riêng/nhóm, thư minh, cảnh báo khi có đội nhắm vào mình (D3, E3, E5, E6, I6). ❌/🟡 · P0 · M.
4. **Sự kiện minh có lịch.** Thiếu bảng nhiệm vụ chung kiểu Mobilization, "ma triều công sơn" kiểu Shadow Legion, và về sau trận minh đấu minh kiểu Ark (J1, J5, J2). ❌ · P0–P1 · M–L.
5. **Chính trị giới và danh tính.** Thiếu Giới Chủ (từ Thiên Môn) với sắc phong buff/debuff, hồ sơ chưởng môn của người khác, ngoại giao minh ước/NAP (H1, H2, G1, H5). ❌ · P1 · M.

Ngay sau năm khoảng cách trên: quản trị minh (duyệt đơn, 5 bậc, chức vị), lãnh thổ bằng trận kỳ, và kết trận đánh tông môn người chơi.

---

## 2. Danh mục đầy đủ

### A. Liên minh — vòng đời và quản trị

#### A1. Lập liên minh — **Create Alliance**
- **Mở / nhịp:** lúc nào cũng lập được; một lần.
- **Cơ chế:** phí 500 gem [2 nguồn: BlueStacks, riseofkingdomsguides FAQ, medievalfun]. Người lập đặt tên, tag (chữ viết tắt ngắn), cờ/biểu tượng (màu, hoa văn), mô tả/thông báo, ngôn ngữ và chế độ gia nhập [2 nguồn]. Người lập là R5. Các hướng dẫn khuyên không lập minh mới ở server cũ, vì minh cũ đã đi trước quá xa [1 nguồn].
- **Tương tác:** kéo bạn bè vào; tag hiện cạnh tên trên bản đồ và trong chat.
- **UI/UX:** khi chưa có minh, nút Liên minh mở hai tab là Tham gia (danh sách) và Tạo. Tab Tạo gồm ô tên, tag, chọn cờ, mô tả, chế độ, rồi xác nhận trả gem [chưa xác minh bố cục].
- **Giữ chân:** cảm giác sở hữu. Cờ và tag là "áo đấu" của nhóm.
- **Tu tiên hoá:** "Khai lập tiên minh". Minh kỳ ghép từ hoa văn vẽ tay (`emblems.ts`); tag 2–4 chữ.
- **Game mình:** ✅ `allyFound`. Cần Chủ điện tầng 10 (`ALLY_HALL`), tốn 20.000 mỗi loại tài nguyên (`ALLY_COST`), tên 2–20 ký tự, tag 2–4 chữ hoa hoặc số, không trùng; chế độ gia nhập (tự do / duyệt đơn) đặt sau khi lập (`allyOpen`). Còn thiếu: cờ/huy hiệu riêng (client dùng chung huy hiệu `crest`), mô tả, ngôn ngữ.
- **Ưu tiên:** P2 · **Công sức:** S–M.

#### A2. Hồ sơ minh, đổi tên/tag/cờ, giải tán — **Alliance Profile / Rename / Disband**
- **Mở / nhịp:** hiếm dùng.
- **Cơ chế:** chỉ R5 sửa hồ sơ, bổ nhiệm officer, dỡ công trình minh và giải tán [2 nguồn: medievalfun, ldshop]. Đổi tên/tag/cờ tốn gem [chưa xác minh mức giá].
- **Tương tác:** đổi tên hay "rebrand" khi hai minh sáp nhập là chuyện thường ngày trong chính trị vương quốc.
- **UI/UX:** trong Cài đặt minh có các ô sửa, kèm giá gem.
- **Giữ chân:** thấp, nhưng thiếu nó thì minh sáp nhập phải giải tán rồi lập lại.
- **Tu tiên hoá:** "Cải danh minh hiệu".
- **Game mình:** 🟡 có bố cáo (`allyNotice` ≤ 200 ký tự, từ R4), thư minh (`allyMail`), minh chủ đổi tên / hiệu (`allyRename`: 500 Minh khố, 7 ngày một lần, không trùng minh khác). Chưa có huy hiệu minh riêng, chưa có nút giải tán: minh chỉ giải tán khi người cuối cùng rời.
- **Ưu tiên:** P2 · **Công sức:** S.

#### A3. Tìm và gia nhập (tự do / xét duyệt, lời mời, danh sách ưu tiên/chặn) — **Join settings, Invitations, Passlist/Blocklist**
- **Mở / nhịp:** mỗi khi có người mới hoặc minh tuyển người.
- **Cơ chế:**
  - Hai chế độ: vào ngay, hoặc nộp đơn chờ R4/R5 duyệt [2 nguồn]. R4 gửi lời mời, duyệt hoặc từ chối đơn [2 nguồn].
  - 1.0.74 (09/2023) thêm **blocklist** (người bị chặn không nộp đơn được) và **passlist** (tự động được duyệt) [1 nguồn].
  - 1.0.75: passlist tăng từ 30 lên 60 người. 1.0.79: minh đầy thì người trong passlist vào hàng chờ, có chỗ là tự vào; thêm tìm theo tên/ID để đưa vào blocklist. 1.0.77: gửi thư khi thêm/bớt passlist; blocklist tự gỡ sau 180 ngày.
  - Đơn xin vào thường ghi lực chiến, giờ online, múi giờ, có chịu dự sự kiện không [1 nguồn: ldshop].
- **Tương tác:** tuyển mộ trong kênh vương quốc; người xin vào "trình hồ sơ".
- **UI/UX:** danh sách minh có cờ, tên, tag, lực chiến, số người, ngôn ngữ và nút "Vào ngay" hoặc "Xin vào"; có ô tìm kiếm; lời mời đến qua thư [chưa xác minh chi tiết].
- **Giữ chân:** cảm giác "được chọn"; minh lớn giữ được chất lượng; officer có việc để làm.
- **Tu tiên hoá:** "Bái sơn nhập minh". Đơn bái kiến; "Ưu đãi danh sách" (passlist); "Hắc danh" (blocklist).
- **Game mình:** ✅ Cửa minh (`allyOpen` / `allyAccept` / `allyInvite` ở `world/alliance.ts`): vào tự do hoặc duyệt đơn (R4 / minh chủ nhận, từ chối), mời người chưa có minh từ hồ sơ (được mời thì vào thẳng), vào minh thì đơn ở minh khác bị bỏ; danh sách minh sắp theo lực chiến (`allyRows`). Còn thiếu: yêu cầu tối thiểu (tầng/lực chiến), passlist/blocklist, ô tìm kiếm.
- **Ưu tiên:** P1 · **Công sức:** S–M.

#### A4. Sĩ số tối đa — **Member Capacity**
- **Mở / nhịp:** tăng dần theo sự phát triển của minh.
- **Cơ chế:** sĩ số tăng nhờ công nghệ Great Alliance I/II, nhờ pháo đài (Center/Alliance Fortress), và cứ 10 cờ thêm 1 chỗ [≥ 3 nguồn]. Alliance Mobilization nhận 30–150 người tham gia mỗi minh [1 nguồn], nên minh lớn thường khoảng 150 người [chưa xác minh sĩ số gốc và trần tuyệt đối].
- **Tương tác:** minh phải lớn mạnh (cắm cờ, nghiên cứu) mới nhận thêm người. Đó là mục tiêu tập thể.
- **UI/UX:** trang minh hiện "x/y thành viên".
- **Giữ chân:** việc mở rộng gắn với việc làm chung.
- **Tu tiên hoá:** "Minh trận khuếch trương". Sĩ số tăng theo tầng Minh trận và số trận kỳ.
- **Game mình:** ✅ 30 người (`ALLY_MAX`), Quảng Nạp Trận của Hộ Minh Đại Trận thêm 2 chỗ mỗi tầng, tối đa 40 (`seatsOf`); trang minh hiện "x/y". Chưa tăng theo số trận kỳ.
- **Ưu tiên:** P2 · **Công sức:** S (nối vào công nghệ minh khi có B3).

#### A5. Cấp bậc R1–R5 và quyền — **Alliance Ranks**
- **Mở / nhịp:** thường trực.
- **Cơ chế:**
  - R5 là minh chủ, chỉ một người. R4 giữ quyền quản lý chính. R1–R3 thường dùng để tách người thử việc, thành viên thường và nòng cốt [2 nguồn].
  - Quyền từng bậc [2 nguồn: medievalfun, ldshop]:
    - **R1:** giúp đỡ, rời minh, chat minh.
    - **R2–R3:** như R1, thêm gửi tin cho thành viên khác.
    - **R4:** đá người, thăng/giáng bậc, duyệt/từ chối đơn, đặt/huỷ lịch sự kiện minh, mời người, xây công trình và cờ, xem toạ độ thành viên.
    - **R5:** tất cả quyền của R4, thêm sửa hồ sơ minh, bổ nhiệm officer, dỡ công trình, giải tán.
  - Patch 1.0.82–1.0.83 (giữa 2024): officer đổi được đội trưởng đồn trú, rút quân khỏi kết trận/đồn trú, xem ai đang online, xem vị trí mọi thành viên. Chỉ officer có chức vị và R5 mới nhập hàng cho cửa hàng [1 nguồn].
- **Tương tác:** thăng bậc là phần thưởng xã hội.
- **UI/UX:** danh sách thành viên nhóm theo R5→R1. Chạm vào một người để Thăng / Giáng / Đá / Nhắn / Xem hồ sơ [chưa xác minh].
- **Giữ chân:** có thang thăng tiến xã hội, có trách nhiệm đi kèm.
- **Tu tiên hoá:** R5 Minh chủ · R4 Đường chủ · R3 Chấp sự · R2 Minh chúng · R1 Khách khanh (thử việc). **Lưu ý:** tránh dùng chữ "Trưởng lão" cho chức trong minh, vì game đã dùng "trưởng lão" cho tướng; "Hộ pháp" cũng đã dùng cho người hộ độ kiếp.
- **Game mình:** ✅ 5 bậc (`Role` −2…2 ở `world/base.ts`, `allyRole`): R1 Ngoại môn · R2 Nội môn · R3 Chân truyền (đặt dấu bản đồ) · R4 Đường chủ (đá người, duyệt đơn, mời, cắm cờ, ghi danh, nhập hàng, minh ước; tối đa 4, `ALLY_ELDERS`) · R5 Minh chủ. Minh chủ xếp mọi bậc và nhường ngôi; R4 chỉ xếp R1–R3 cho người dưới mình.
- **Ưu tiên:** P1 · **Công sức:** S.

#### A6. Chức vị officer có buff — **Alliance Officer Titles**
- **Mở / nhịp:** R5 hoặc Counselor bổ nhiệm; thường luân phiên.
- **Cơ chế:** có bốn chức gắn cho R4: **Warlord** (tăng công/thủ), **Counselor** (tăng tốc xây/nghiên cứu), **Envoy** (tăng máu quân), **Saint** (tăng tốc thu thập) [2 nguồn cho tên]. Mức buff: Warlord ~+1% công và thủ, Counselor ~+1% tốc xây và nghiên cứu, Envoy ~+1% máu [1 nguồn]; Saint +10% tốc thu thập [2 nguồn]. Từ 1.0.77, Counselor bổ nhiệm/gỡ/đổi chức officer khác và quản lý passlist/blocklist [1 nguồn]. Nhiều minh xoay vòng chức để chia buff [1 nguồn: ldshop].
- **Tương tác:** officer có vai rõ ràng; ldshop gợi ý phân công officer chiến sự, lãnh thổ, công nghệ, tuyển mộ, sự kiện, ngoại giao.
- **UI/UX:** trong trang thành viên, chạm R4 rồi chọn "Bổ nhiệm chức" [chưa xác minh].
- **Giữ chân:** có danh phận, có buff nhỏ cá nhân.
- **Tu tiên hoá:** "Tứ Đường chủ": Chiến Đường (công/thủ), Truyền Công Đường (tốc xây/tu luyện, kiêm quản lý nhân sự), Ngoại Sự Đường (máu/ngoại giao), Bách Thảo Đường (khai mỏ).
- **Game mình:** ✅ chức vị đường chủ (`OFFICES`, `allyOffice`, `officeBuffs`): minh chủ phong cho người R4 — Chấp Pháp (công +5 %), Ngoại Sự (hành quân +10 %), Tổng Quản (sản lượng +5 %), Công Tượng (xây nhanh 5 %); mỗi chức một người, mỗi người một chức, hết R4 thì mất hiệu lực.
- **Ưu tiên:** P2 · **Công sức:** S.

#### A7. Rời minh, đá người, chuyển giao tự động, giải tán — **Leave / Kick / Auto-transfer**
- **Mở / nhịp:** khi cần.
- **Cơ chế:** R4/R5 đá thành viên [2 nguồn]. Minh chủ vắng từ 7 ngày trở lên thì quyền tự chuyển cho một R4 [1 nguồn]. 1.0.83 thêm luật tự giải tán minh chết và tự chuyển giao minh chủ [1 nguồn]. Thời gian chờ và phần quyền lợi mất khi rời minh (lãnh thổ, cửa hàng, sự kiện đã đăng ký) [chưa xác minh chi tiết].
- **Tương tác:** chống việc "minh chủ bỏ game làm minh chết".
- **UI/UX:** nút Rời minh (có xác nhận); nút Đá trong thẻ thành viên.
- **Giữ chân:** minh không chết theo một người.
- **Tu tiên hoá:** "Thoát minh", "Trục xuất", "Minh chủ bế quan quá lâu thì truyền ngôi".
- **Game mình:** ✅ `allyLeave`/`allyKick` (R4 trở lên đá người bậc thấp hơn); minh chủ rời thì bậc cao nhất lên thay, người cuối rời thì giải tán, xoá tài khoản cũng truyền ngôi (server `inbox.ts`). Minh chủ vắng 7 ngày (`ALLY_IDLE`) thì R4 bấm "Nhận minh chủ" (`allyClaim` ở `world/guild.ts`), thẻ thành viên ghi số ngày vắng; chưa tự chuyển / tự giải tán minh chết như RoK.
- **Ưu tiên:** P1 · **Công sức:** S.

---

### B. Liên minh — "keo dính" hằng ngày

#### B1. Giúp đỡ — **Alliance Help**
- **Mở / nhịp:** có minh và có Alliance Center (xây từ Tòa thị chính 3 [1 nguồn]). Dùng mọi phiên.
- **Cơ chế:**
  - Áp dụng cho xây, nghiên cứu, chữa thương; **không** áp cho huấn luyện và thu thập [1 nguồn: theriagames].
  - Mỗi lần giúp bớt 1% **thời gian còn lại**, tối thiểu 1 phút. Công nghệ Together We Rise nâng mức tối thiểu lên 3 phút [2 nguồn]. (topuplive ghi Together We Rise tăng *số lần* giúp — [mâu thuẫn].)
  - Số lần được giúp mỗi việc: Alliance Center cấp 1 là 5 lần, mỗi cấp +1, cấp 25 là 30 lần [≥ 3 nguồn].
  - Người đi giúp nhận điểm cá nhân (individual credits), tối đa 10.000 điểm/ngày [2 nguồn].
- **Tương tác:** hàng chục người giúp nhau mỗi ngày; có người còn chia việc chữa thương thành từng lô 1.000 quân để tận dụng giúp đỡ [1 nguồn].
- **UI/UX:** đặt việc xong thì trên công trình có nút nhờ giúp (bắt tay). Người khác thấy biểu tượng bắt tay nổi trên màn hình, chạm "Giúp tất cả" một lần; bảng liệt kê yêu cầu kèm "x/30" [chưa xác minh hình dạng nút].
- **Giữ chân:** một chạm là lợi cả đôi bên; thấy minh "đang sống"; có lý do mở game ngắn.
- **Tu tiên hoá:** "Đồng môn trợ lực" (đã dùng chữ "giúp đỡ").
- **Game mình:** ✅ có `helpAsk`/`helpAll`: việc vừa giao tự nhờ giúp khi đang trong minh, đĩa "giúp đỡ" nổi ở mọi tab (`Hud.svelte`); mỗi việc được giúp 10 lần (`ALLY_HELPS`, Đồng Tâm Trận của Hộ Minh Đại Trận nâng tới 15), mỗi lần bớt max(1 phút, 1% *tổng* thời gian việc) chốt lúc nhờ, áp cho xây, tuyển, chữa, nghiên cứu, luyện khí (không áp cho luyện đan); người giúp được 5 cống hiến mỗi lượt (trần 250/ngày, `HELP_CREDIT`). Khác RoK: tính trên tổng thời gian chứ không phải thời gian còn lại; áp cả cho tuyển.
- **Gợi ý:** thưởng điểm cống hiến cho người giúp (có trần mỗi ngày); số lần giúp tăng theo một công trình minh hoặc công nghệ minh.
- **Ưu tiên:** P1 · **Công sức:** S.

#### B2. Quà liên minh, rương pha lê, quà khi thành viên mua gói — **Alliance Gifts / Crystal Treasure**
- **Mở / nhịp:** liên tục, mỗi khi có sự kiện tạo quà.
- **Cơ chế:**
  - Nguồn quà: thành viên mua gói nạp, hạ pháo đài man tộc, hạ Lohar, một số sự kiện [≥ 3 nguồn].
  - Mỗi lần như vậy, **mọi thành viên** nhận một hộp quà gồm vật phẩm, gift points và key points [1 nguồn fandom qua tìm kiếm + ldshop]. Gift points nâng **cấp quà minh**, cấp càng cao thì quà càng tốt. Key points lấp **Crystal Treasure** theo ba bậc Trắng → Lục → Lam; chất lượng rương Trắng tăng mỗi 10 cấp quà [1 nguồn]. Ví dụ: ở quà cấp 12 cần 2,5 triệu key point để mở rương [1 nguồn].
  - Hạn nhận quà [chưa xác minh].
- **Tương tác:** người nạp "nuôi" cả minh (bài review coi đây là điểm cộng cho người chơi miễn phí) [1 nguồn]. Rally pháo đài vừa được sách cho mình vừa được quà cho cả minh. Mặt trái: số quà tăng đột biến có thể là dấu hiệu nạp gian lận, nhưng chỉ là dấu hiệu [1 nguồn: heaven-guardian].
- **UI/UX:** nút Quà có chấm đỏ đếm số hộp. Danh sách hộp ghi nguồn ("Hạ pháo đài cấp X", "[Tên] mua gói") với nút Mở / Mở tất cả; kèm thanh cấp quà và thanh key cho rương [chưa xác minh chi tiết].
- **Giữ chân:** quà từ trên trời; thấy tên người đóng góp nên biết ơn; cảm giác thịnh vượng chung.
- **Tu tiên hoá:** "Minh lễ". Khi có người hạ yêu vương/yêu trại, hoặc (P4) mở "Tiên Ngọc lễ bao", cả minh nhận linh bao. "Linh Tinh Bảo Khố" có ba bậc.
- **Game mình:** ✅ Minh lễ (`allyGifts` ở `world/base.ts`): người trong minh góp sức hạ yêu vương / yêu trại thì cả minh nhận quà qua thư theo cấp quà 1–5 (`ALLY_GIFT_LV`, điểm quà tăng theo cấp yêu vương); rương chung là Tụ Bảo Minh Đỉnh (`world/pot.ts`). Không có quà từ gói nạp (không bán gói).
- **Ưu tiên:** P0 · **Công sức:** M.

#### B3. Công nghệ liên minh và quyên góp — **Alliance Technology / Donation**
- **Mở / nhịp:** mỗi phiên, vì lượt góp hồi theo thời gian.
- **Cơ chế:**
  - **Các nhánh:** Development (9 tầng), Territory (7 tầng), War (9 tầng) [1 nguồn: fandom qua tìm kiếm], và Alliance Skill [2 nguồn]. Buff của Development và War có hiệu lực mọi nơi; buff Territory gắn với lãnh thổ (Territory Guardian tăng công khi đánh trong lãnh thổ) [1 nguồn].
  - **Công nghệ tiêu biểu** [2 nguồn: topuplive, heaven-guardian]: Great Alliance I/II (sĩ số), Together We Rise (giúp đỡ), City Construction và Technology Research (tốc xây, tốc nghiên cứu), tốc thu thập theo loại tài nguyên, Architecture (giảm chi phí công trình minh), Flag Quantity (số cờ), Storehouse Expansion (kho minh), Skillful Craftsman (tốc xây cờ), Assembly Charge (sức chứa kết trận), công/thủ theo binh chủng. Minh mới thường ưu tiên sĩ số, tốc xây/nghiên cứu, số cờ, giảm chi phí công trình [1 nguồn].
  - **Quyên góp:** tích tối đa 20 lượt, hồi 1 lượt mỗi 30 phút [≥ 3 nguồn]. Góp bằng tài nguyên (rẻ) hoặc gem (giá gấp đôi sau mỗi lần góp liên tiếp) [1 nguồn]. Mỗi lần góp vàng được khoảng 100 điểm cá nhân, có lúc nhân ×2–×3 [1 nguồn]. Mỗi lần góp tạo điểm công nghệ và alliance credits [2 nguồn].
  - **Đề xuất:** R4/R5 gắn sao cho một công nghệ; góp vào công nghệ có sao được nhiều điểm và credits hơn [2 nguồn].
- **Tương tác:** R4 "cầm lái" hướng phát triển; cả minh dồn góp vào một chỗ.
- **UI/UX:** cây công nghệ, mỗi công nghệ một nút. Chạm vào thì thấy thanh tiến độ, các nút góp theo loại tài nguyên và nút góp gem; công nghệ đề xuất có sao sáng. Có bảng xếp hạng người góp [chưa xác minh].
- **Giữ chân:** 20 lượt tích bằng 10 giờ nên có lý do quay lại 2–3 lần/ngày; góp nhỏ, buff chung lớn.
- **Tu tiên hoá:** "Hộ Minh Đại Trận". Góp gọi là "cung phụng linh thạch"; mỗi tầng trận mở buff chung (tốc tu luyện, tốc xây, sức chứa kết trận, sĩ số, số trận kỳ). Đề xuất gọi là "Minh chủ điểm trận".
- **Game mình:** ✅ Hộ Minh Đại Trận (`world/guild.ts`, `AllyTech.svelte`): 9 trận × 5 tầng (sản lượng, xây, tuyển, chữa, hành quân, công, thủ, +lượt giúp, +chỗ trong minh); cung phụng (`allyDonate`) tích 20 lượt, hồi 1 lượt/30 phút, giá theo tầng; R4 / minh chủ điểm trận (`allyStar`) → góp được gấp đôi.
- **Ưu tiên:** P0 · **Công sức:** L.

#### B4. Điểm cá nhân / quỹ minh và cửa hàng liên minh — **Individual & Alliance Credits / Alliance Shop / Reclaim**
- **Mở / nhịp:** tích điểm hằng ngày, mua sắm lúc cần.
- **Cơ chế:**
  - **Individual credits** (của từng người) đến từ: giúp đỡ (tối đa 10.000/ngày), góp công nghệ, góp quân xây công trình minh (tối đa 20.000/ngày), rương và sự kiện (Ark), Alliance Reclaim (đổi vật phẩm thừa lấy điểm) [2 nguồn].
  - **Alliance credits** là quỹ chung, sinh ra từ chính các hoạt động trên. R4/R5 dùng quỹ này để xây pháo đài, cờ, trung tâm tài nguyên, dựng lại lãnh thổ và nhập hàng [2 nguồn].
  - **Cửa hàng:** officer nhập hàng bằng alliance credits, thành viên mua bằng individual credits [≥ 2 nguồn]. Hàng gồm khiên, dịch chuyển (lãnh thổ/chọn điểm), tăng tốc, điểm VIP, điểm hành động, chìa khoá, **passport page** (600.000 điểm cá nhân mỗi trang; nhập hàng ~100.000 alliance credits) [1 nguồn], thẻ đổi nền văn minh (2.000.000 điểm cá nhân) [1 nguồn].
  - 1.0.89 (12/2024) thêm hạn mức mua theo tuần cho passport. 1.0.82: chỉ officer có chức vị và R5 được nhập hàng.
- **Tương tác:** hợp tác sinh ra tiền tệ. Officer quyết định nhập gì, tức là có quyền lực.
- **UI/UX:** tab Cửa hàng gồm "Mua" (hiện số tồn) và "Nhập hàng" (chỉ officer thấy).
- **Giữ chân:** đổi hành vi hợp tác lấy đồ quý (dịch chuyển, passport).
- **Tu tiên hoá:** "Cống hiến" (điểm cá nhân), "Minh khố" (quỹ chung), "Cống Hiến Các" (cửa hàng). Không bán thứ gì liên quan tới tiền thật.
- **Game mình:** ✅ cống hiến (điểm cá nhân: từ cung phụng và giúp đỡ, trần 250/ngày từ giúp) + Minh khố (quỹ chung: từ cung phụng và lãnh thổ) + Cống Hiến Các (`allyStock` / `allyBuy`, `AllyShop.svelte`): R4 / minh chủ nhập hàng bằng Minh khố, người trong minh đổi bằng cống hiến (phù tăng tốc, Hộ Sơn Phù, Tụ Linh Phù, Ngân Duyên, kinh thư, nang). Chưa có Reclaim.
- **Ưu tiên:** P0 (làm cùng B3) · **Công sức:** M.

#### B5. Kỹ năng liên minh — **Alliance Skills**
- **Mở / nhịp:** officer kích hoạt theo nhu cầu (buff có thời hạn).
- **Cơ chế:** có 6 kỹ năng tạm thời cho cả minh, ví dụ tốc xây, tốc nghiên cứu, kinh nghiệm khi đánh, tốc thu thập một loại tài nguyên trong 8 giờ. Mỗi lần kích hoạt, thành viên phải góp đầy một lượng tài nguyên [1 nguồn]. Thường xếp sau các công nghệ chính [1 nguồn].
- **Tương tác:** góp chung cho một đợt buff chung.
- **UI/UX:** thẻ kỹ năng có thanh góp và nút Kích hoạt [chưa xác minh].
- **Giữ chân:** tạo "khoảnh khắc" cho cả minh, ví dụ bật buff trước sự kiện.
- **Tu tiên hoá:** "Minh trận thần thông", ví dụ "Đại Tụ Linh 8 giờ" hay "Kiếm Trận Sát Phạt 2 giờ".
- **Game mình:** ✅ **Minh trận thần thông** (`allySkill` ở `world/guild.ts`, `skillBuffs`, `AllySkills.svelte`): 6 thần thông (khai mỏ, xây, tuyển, hành quân 8 giờ; công, thủ 2 giờ), trưởng lão / minh chủ bật bằng Minh khố (Minh khố do cả minh góp qua cung phụng, lãnh thổ), cả minh nhận tăng ích có hạn, hồi 24 giờ sau khi hết. Khác RoK: trả bằng quỹ chung thay vì mỗi người góp riêng cho từng đợt.
- **Ưu tiên:** P2 · **Công sức:** M.

---

### C. Lãnh thổ

#### C1. Pháo đài trung tâm / pháo đài phụ — **Center Fortress / Alliance Fortress**
- **Mở / nhịp:** mốc lớn đầu tiên của một minh; về sau có thêm pháo đài phụ.
- **Cơ chế:**
  - **Center Fortress** cần ít nhất 20 thành viên, tổng lực chiến 500.000 và 1.000.000 alliance credits [2 nguồn]. Đây là điểm neo đầu tiên của lãnh thổ, nhưng không phải vùng an toàn [1 nguồn].
  - **Pháo đài phụ:** AF1 cần 4,5M credits, 1,8M lương, 1,8M gỗ, 1,4M đá, 900k vàng. AF2 cần 8,9M credits, 4,5M lương, 4,5M gỗ, 2,7M đá, 1,8M vàng [2 nguồn]. Một nguồn khác ghi 900k / 4,5M / 9M credits [mâu thuẫn].
  - 1.0.78: không được xây pháo đài trong lãnh thổ của một pháo đài khác (áp cho Lost Kingdom từ 17/01/2024).
  - Thành viên góp quân để xây và nhận điểm cá nhân [2 nguồn]. Công trình bị kết trận đánh thì cháy; sau đó được sửa hoặc bị phá [1 nguồn]. Quân thủ công trình minh bị thương nặng thì 50% chết, 50% về viện [1 nguồn].
- **Tương tác:** cả minh cùng xây, cùng giữ.
- **UI/UX:** chạm ô trống → "Xây pháo đài" → hiện yêu cầu, chi phí và vùng sẽ chiếm → thành viên "Góp quân xây".
- **Giữ chân:** có "nhà chung" trên bản đồ.
- **Tu tiên hoá:** "Tổng đà" và "Phân đà" của tiên minh, là trận pháp dựng trên bản đồ giới.
- **Game mình:** ✅ Tổng đà + Phân đà (`fort`, `fortCap` ở `world/flags.ts`): Tổng đà cần ≥ 5 người, 3.000 Minh khố, dựng 6 giờ; mỗi 10 người thêm một Phân đà (tối đa 3 tính cả Tổng đà, cái thứ n tốn 3.000 × n Minh khố); người trong minh góp quân xây (mỗi 1.000 đệ tử đóng thêm 100 % tốc, tối đa ×4); xong thì nới lãnh thổ 7 ô, độ bền 150.000, cả minh có tăng ích (không cộng dồn). Chưa bị kết trận / cháy như RoK: minh khác chỉ trừ độ bền bằng lực chiến từng đội.
- **Ưu tiên:** P1 · **Công sức:** L.

#### C2. Cờ liên minh (và tiền đồn, khiên cờ, tháp tên) — **Alliance Flags / Outpost / Flag Shield / Arrow Tower**
- **Mở / nhịp:** mở rộng dần; xây và sửa hằng ngày.
- **Cơ chế:**
  - Cờ phải nối vào biên lãnh thổ đang có, không nhảy cóc [2 nguồn]. Trần 500 cờ [2 nguồn]; heaven-guardian ghi trần tuỳ công nghệ Flag Quantity [mâu thuẫn nhẹ].
  - Giá tăng sau mỗi 10 cờ. Cờ đầu khoảng 50k credits [1 nguồn]; khi đã quá 400 cờ, mỗi cờ khoảng 375k credits + 1,5M lương + 1,5M gỗ + 1,1M đá + 750k vàng [2 nguồn].
  - Cứ 10 cờ thêm 1 chỗ thành viên [≥ 3 nguồn]. Mất cờ nối thì phần lãnh thổ phía sau mất hiệu lực [1 nguồn].
  - 1.0.80: cờ nâng được thành **Outpost** (cho mượn quân); có **khiên riêng cho từng cờ**. 1.0.71/1.0.83: ở Season of Conquest, cờ biến được thành **tháp tên** tự bắn thành địch gần đó. 1.0.81: cờ đang xây hiện nét đứt xem trước vùng. 1.0.77: officer đặt trần quân mỗi người khi viện binh vào công trình.
- **Tương tác:** việc chung dễ góp (góp quân xây); tranh biên giới với minh bên cạnh.
- **UI/UX:** chạm ô cạnh biên → "Xây cờ" → hiện chi phí và vùng → mọi người góp quân.
- **Giữ chân:** bản đồ tô màu minh cho thấy minh đang lớn lên.
- **Tu tiên hoá:** "Trận kỳ" cắm nối nhau thành "Linh vực"; Outpost là "Trận đài"; tháp tên là "Tiễn lâu" hoặc "Kiếm lâu".
- **Game mình:** ✅ Trận kỳ (`world/flags.ts`): cắm ở ô trống trong lãnh thổ minh (không cần nối biên), 2 + 1 mỗi 5 người (tối đa 10), 1.000 Minh khố, dựng 1 giờ (góp quân xây như Tổng đà), nới lãnh thổ 4 ô; minh khác phá bằng lực chiến (độ bền 30.000, 12 giờ không bị đánh thì liền lại), người trong minh đóng quân giữ (`flagGuard`, tối đa 3 đội). Chưa có Outpost, khiên cờ, tháp tên.
- **Ưu tiên:** P1 · **Công sức:** L (cần thêm lớp ô lãnh thổ trên `atlas`, hiện chỉ có điểm).

#### C3. Trung tâm tài nguyên liên minh — **Alliance Resource Center**
- **Mở / nhịp:** dựng khi cần một loại tài nguyên; tồn tại vài ngày.
- **Cơ chế:** mỗi minh chỉ có một trung tâm hoạt động một lúc, chọn một trong bốn loại Granary / Wood Lot / Stone Pit / Mother Lode [2 nguồn]. Quân đang thu ở đây **không bị tấn công** [2 nguồn]. Cần Tòa thị chính 8 trở lên để thu; trung tâm tồn tại 3 ngày rồi tự tháo [1 nguồn].
- **Tương tác:** chỗ thu an toàn cho mọi thành viên, nên minh bàn nhau chọn loại đang thiếu.
- **UI/UX:** biểu tượng lớn trên bản đồ; chạm vào để gửi quân thu.
- **Giữ chân:** người yếu vẫn thu được mà không bị cướp.
- **Tu tiên hoá:** "Minh khoáng" hoặc "Linh điền chung".
- **Game mình:** ✅ Minh khoáng (`allyMine` / `allyGather` ở `world/flags.ts`): trưởng lão dựng trong lãnh thổ, chọn loại, 2.000 Minh khố, dựng 2 giờ (góp quân xây), kho 3 triệu, khai 30.000/giờ mỗi đội, không bị cướp (cướp khoáng chỉ nhắm mỏ trên bản đồ), cạn hay sau 3 ngày thì tháo; mỗi minh một.
- **Ưu tiên:** P2 · **Công sức:** M.

#### C4. Điểm tài nguyên minh và kho minh — **Alliance Resource Points / Alliance Storehouse**
- **Mở / nhịp:** thu thụ động theo giờ.
- **Cơ chế:**
  - Các điểm tài nguyên minh (Cropland, Logging Camp, Stone Deposit, Gold Deposit; ở Lost Kingdom có thêm Crystal Field) nằm trong lãnh thổ thì mỗi giờ sinh tài nguyên vào kho minh [2 nguồn]. Kho giữ trong 24 giờ [1 nguồn]. Thành viên thu mỏ trong lãnh thổ thì hệ thống cộng thêm một phần vào kho minh [1 nguồn].
  - Storehouse Expansion tăng sức chứa kho [2 nguồn]. Tài nguyên minh dùng xây lãnh thổ và công nghệ [1 nguồn].
  - 1.0.80 (Tides of War): minh nhận 20% tài nguyên thu được ở Lost Kingdom làm "alliance supplies"; thành viên đổi bằng Merit, hạn mức 40 triệu mỗi Tide.
- **Tương tác:** tài sản chung; minh chủ tiêu hộ cả minh.
- **UI/UX:** trang Kho minh hiện sản lượng mỗi giờ theo loại [1 nguồn].
- **Giữ chân:** thấy "của chung" lớn dần.
- **Tu tiên hoá:** "Minh khố" nhận linh khí từ linh mạch trong linh vực.
- **Game mình:** 🟡 Minh khố (`world/storehouse.ts`): mỗi ô lãnh thổ sinh 0,1 Minh khố mỗi giờ (chốt giờ tròn), cộng với phần từ cung phụng, dùng cắm trận kỳ, dựng Tổng đà / Phân đà / Minh khoáng, nhập hàng Cống Hiến Các. Chưa có điểm tài nguyên từng loại sinh tài nguyên vào kho minh (Minh khố là một quỹ chung, không có trần nên cũng không có nâng kho).
- **Ưu tiên:** P1 · **Công sức:** M.

#### C5. Buff trong lãnh thổ và dịch chuyển lãnh thổ — **Territory Buffs / Territorial Teleport**
- **Mở / nhịp:** thường trực khi đã có lãnh thổ.
- **Cơ chế:**
  - Tốc thu thập +25% trong lãnh thổ [≥ 3 nguồn].
  - **Territorial Teleport** chỉ dùng cho thành viên, chỉ đến được lãnh thổ minh, nhưng vượt được khu/đèo mà không cần mở đèo [2 nguồn].
  - Territory Guardian tăng công khi đánh trong lãnh thổ [1 nguồn]. Lãnh thổ là nơi thành viên ở; kẻ xâm nhập sẽ bị cả minh phản công [1 nguồn].
  - Các lúc **không** dịch chuyển được: đang giao chiến, có quân ở ngoài, đang có War Frenzy, đang nhận viện binh, đang trong kết trận, điểm đến có công trình hoặc sương mù [1 nguồn].
- **Tương tác:** cả minh sống sát nhau, dễ viện binh cho nhau.
- **UI/UX:** dùng vật phẩm dịch chuyển → chọn ô trong vùng màu minh.
- **Giữ chân:** "khu phố" của minh.
- **Tu tiên hoá:** "Linh vực gia trì"; "Truyền tống phù linh vực".
- **Game mình:** ✅ lãnh thổ tiên minh (`claimsOf` / `ownerAt` ở `world/points.ts`): khai mỏ trong lãnh thổ minh mình +25 % (`TERR_GATHER`) và không bị cướp khoáng; dời tông môn vào ô trống trong lãnh thổ (`move` ở `world/territory.ts`: chỉ vùng ngoài, mọi đội ở nhà, 24 giờ một lần); dời núi tân thủ (`newbieMove`). Chưa có tăng công khi đánh trong lãnh thổ.
- **Ưu tiên:** P1 · **Công sức:** M.

#### C6. Thánh địa, đèo và thưởng chiếm lần đầu — **Holy Sites / Passes / First Occupation**
- **Mở / nhịp:** mở theo lịch của vương quốc; tranh chấp liên tục.
- **Cơ chế:**
  - Mỗi vương quốc có 6 khu vòng ngoài (Zone 1), 3 khu giữa (Zone 2) và 1 khu trung tâm (Zone 3, chứa Lost Temple) [1 nguồn]. Muốn sang khu 2, minh phải giữ đèo cấp 2 hoặc đã có lãnh thổ bên kia [1 nguồn].
  - Có 70 Sanctum, 37 Altar, 9 Shrine và 1 Lost Temple [1 nguồn].
  - Ví dụ buff [1 nguồn: ldshop]:
    - **Sanctum:** +5% thu thập, +5% hành quân, +10% EXP tướng, +2% máu.
    - **Altar:** +5% tốc huấn luyện/nghiên cứu/xây, +5% sản lượng, +3% thủ/công.
    - **Shrine:** +5% thu thập, +3% thủ/máu, +10% huấn luyện, +20% chữa.

    Mỗi địa điểm chỉ cho một trong các buff kể trên [chưa xác minh cách liệt kê]. Buff cùng loại không cộng dồn [1 nguồn].
  - Phải nối lãnh thổ tới rồi hạ quân canh trong giờ tranh chấp [1 nguồn]. Lần chiếm đầu có thưởng cho minh [1 nguồn].
  - 1.0.89: minh chủ chuyển được quyền giữ đèo/thánh địa cho minh khác trong liên quân.
- **Tương tác:** mục tiêu chung, kết trận lớn, ngoại giao "ai giữ gì".
- **UI/UX:** biểu tượng thánh địa có đồng hồ tranh chấp; chạm vào để kết trận hoặc đồn trú.
- **Giữ chân:** buff to cho cả minh; có "chiến lợi phẩm" để khoe.
- **Tu tiên hoá:** "Linh địa" (game đã có linh mạch, trận nhãn, Thiên Môn); "Khai quan" nghĩa là mở cổng.
- **Game mình:** ✅ có linh mạch 3 cấp, mỗi điểm một loại tăng ích (`veinBuffs`), trận nhãn (cổng giữa các vùng, mở theo pha mùa; phe giữ chặn đường — cửa ải), Thiên Môn (12 điểm mùa/giờ), Cổ Di Tích / Huyết Tế Đàn mở theo giờ, đóng quân giữ điểm (tối đa `GARRISON_MAX` 6 đội), điểm mùa theo phe, quà chiếm lần đầu trong mùa (`firstTake`). Còn thiếu: chuyển quyền giữ điểm giữa các minh.
- **Ưu tiên:** P1 · **Công sức:** S (thưởng lần đầu) đến M (buff đa dạng).

---

### D. Chiến tranh liên minh

#### D1. Kết trận và tab Chiến tranh — **Rally / War Tab**
- **Mở / nhịp:** kết trận cần Castle (xây từ Tòa thị chính 7) [2 nguồn]; dùng hằng ngày.
- **Cơ chế:**
  - Sức chứa kết trận cộng dồn theo cấp Castle, từ +25k ở cấp 1 tới +400k ở cấp 25 [1 nguồn]. Tối đa khoảng 2,5 triệu quân ở Castle 25, đã tính buff [1 nguồn]. Mọi quân trong kết trận hưởng công nghệ của đội trưởng [1 nguồn].
  - Mục tiêu: pháo đài man tộc, thành người chơi, cờ, pháo đài, thánh địa [2 nguồn].
  - Các mức thời gian chờ tập hợp [chưa xác minh; thường thấy 5 / 10 / 30 / 60 phút].
  - Tab War liệt kê các kết trận đang mở để tham gia. 1.0.85: khi quân mình bị đánh, tab War hiện đội trưởng kết trận/đồn trú bên địch và binh chủng nên dùng. 1.0.82: officer đổi đội trưởng đồn trú, rút quân. 1.0.88: báo cáo kết trận/đồn trú có "đánh giá trận". 1.0.71: Season of Conquest có **phản kết trận** (counter rally).
- **Tương tác:** hẹn giờ cùng đánh; đội trưởng "cầm cờ"; thắng nhờ đông người.
- **UI/UX:** chạm mục tiêu → "Kết trận" → chọn thời gian chờ, tướng và quân → cả minh thấy chấm đỏ ở tab War → "Tham gia" và chọn đội → đồng hồ đếm ngược → nhận báo cáo gộp.
- **Giữ chân:** lý do lên đúng giờ; cảm giác đồng đội.
- **Tu tiên hoá:** "Kết trận" (đã dùng); tab "Chiến sự đường".
- **Game mình:** ✅ kết trận điểm / yêu vương (`rally`/`rallyJoin` ở `world/spots.ts`) và kết trận công sơn đánh tông môn (`raidRally`/`raidJoin` ở `world/raid.ts`): tối đa 8 đội (`RALLY_MAX`), chờ 5/10/30 phút (`RALLY_WAIT`), tới cùng lúc đánh như một bên, chiến lợi phẩm chia theo sức mang, chiến công theo lực chiến góp; bên thủ thấy thẻ cảnh báo; tab Chiến sự của trang Tiên minh liệt kê kết trận đang mở + nút "Góp đội". Còn thiếu: sức chứa kết trận theo công trình, kết trận đánh trận kỳ / Tổng đà.
- **Ưu tiên:** P1 · **Công sức:** M.

#### D2. Viện binh và đồn trú — **Reinforcement / Garrison**
- **Mở / nhịp:** khi đồng minh bị đe doạ; đồn trú công trình minh thường trực.
- **Cơ chế:** sức chứa viện binh vào thành đồng minh theo Alliance Center, từ 15.000 quân (cấp 1) tới 1.000.000 quân (cấp 25) [1 nguồn: gamesguideinfo]. Thành viên góp quân đồn trú cờ, pháo đài, thánh địa. 1.0.77: officer đặt trần quân mỗi người khi viện binh vào công trình minh. 1.0.80: Outpost cho mượn quân. Người đang nhận viện binh thì không dịch chuyển được [1 nguồn].
- **Tương tác:** bảo vệ lẫn nhau; người nạp nhiều làm "khiên" cho người chơi miễn phí.
- **UI/UX:** chạm thành đồng minh → "Viện binh" → chọn tướng và quân; thành mình hiện danh sách quân viện đang đóng [chưa xác minh].
- **Giữ chân:** cảm giác được bảo vệ.
- **Tu tiên hoá:** "Hộ sơn viện binh".
- **Game mình:** ✅ có `aid`: tối đa 3 đội (`REINFORCE_MAX`) đóng ở nhà đồng minh và cùng thủ khi bị cướp; thua thì bị đánh bật về, thắng thì ở lại với số quân còn lại. Hộ pháp độ kiếp (`TRIB_AID` 3) là một kiểu viện binh riêng của game. Khác RoK: trần tính theo số đội, không theo quân số.
- **Ưu tiên:** P2 · **Công sức:** S.

#### D3. Đánh dấu bản đồ — **Alliance Markers / Bookmarks**
- **Mở / nhịp:** dùng liên tục khi phối hợp.
- **Cơ chế:** officer đặt dấu trên bản đồ, cả minh cùng thấy. 1.0.84: chạm vào thẻ dấu được chia sẻ trong chat thì bay thẳng tới vị trí đó [1 nguồn]. Mỗi người có đánh dấu riêng [chưa xác minh số lượng].
- **Tương tác:** chỉ mục tiêu, điểm tập kết, vùng cấm.
- **UI/UX:** nhấn giữ ô → "Đánh dấu minh" → chọn biểu tượng và ghi chú.
- **Giữ chân:** phối hợp nhanh, bớt cãi nhau trong chat.
- **Tu tiên hoá:** "Minh ấn" (dấu son trên bản đồ); "Ký hiệu" cá nhân.
- **Game mình:** ✅ dấu của minh (`allyMark`/`allyUnmark` ở `world/guild.ts`): 5 dấu trên bản đồ giới (`ALLY_MARKS`), từ R3 đặt, lời ghi ≤ 20 chữ, cả minh thấy, bấm là bay tới; ghi nhớ riêng ★ tối đa 20 chỗ (`sect/pins.ts`).
- **Ưu tiên:** P0 · **Công sức:** S. Rất rẻ mà có ích ngay cho kết trận và giữ điểm.

#### D4. Mệnh lệnh liên minh và cửa hàng chiến công (Season of Conquest) — **Alliance Directives / Merit Shop**
- **Mở / nhịp:** theo từng "Tide" 4 ngày trong chế độ mùa.
- **Cơ chế:** 1.0.76 (Tides of War): minh chủ/officer ban 2–3 Directive mỗi Tide. 1.0.80: phần lớn Directive có hiệu lực với mọi thành viên, kể cả người đã rời minh; có thời gian hồi để một người không nhận cùng hiệu ứng từ minh khác. Merit kiếm được bằng cách hạ quân của người chơi khác, dùng để đổi đồ ở Merit Shop.
- **Tương tác:** lãnh đạo ra lệnh cho cả minh; ai đánh nhiều thì được đổi nhiều.
- **UI/UX:** bảng Directive có nút Ban lệnh (officer); thành viên thấy buff đang chạy.
- **Giữ chân:** lãnh đạo có công cụ; chiến đấu có phần thưởng riêng.
- **Tu tiên hoá:** "Minh lệnh", ví dụ "Tổng động viên: +x% công khi đánh trận nhãn trong 2 giờ".
- **Game mình:** 🟡 có chỉ lệnh nhưng mỗi tông môn tự chọn: Thiên Thời (`world/thoi.ts`) mỗi 4 ngày cho chọn 1 trong 3 tăng ích tới hết thời; Công Huân (có phần từ chiến công) ra Phi Thăng Tệ đổi ở Thiên Môn Thương Điếm. Chưa có minh lệnh do minh chủ / R4 ban cho cả minh.
- **Ưu tiên:** P2 · **Công sức:** M.

---

### E. Giao tiếp

#### E1. Chat vương quốc — **Kingdom Chat**
- **Mở / nhịp:** thường trực [chưa xác minh điều kiện mở].
- **Cơ chế:** kênh chung của cả vương quốc; nơi xin title, rao tuyển người, cãi nhau, thương lượng. Có dịch tự động [chưa xác minh]. 1.0.88: tooltip giải nghĩa thuật ngữ (MGE, "gold heads") khi chạm vào.
- **Tương tác:** là "quảng trường" của vương quốc.
- **UI/UX:** dải chat ở cạnh màn hình, chạm để mở kênh.
- **Giữ chân:** có "người sống" quanh mình; drama.
- **Tu tiên hoá:** "Kênh giới" (đã dùng).
- **Game mình:** ✅ kênh giới mở từ tầng 3 (`CHAT_HALL`). Có lọc từ trên chữ có dấu, cho 3 tin liền rồi 1 tin mỗi 3 giây, chặn lặp tin trong 30 giây, 200 ký tự, giữ 50 tin lịch sử; báo cáo tin xấu có lưu bằng chứng; admin cấm chat qua hộp lệnh. Dải chat ở màn núi và tab Bản đồ, kênh chat nằm trong trang Tiên minh. Còn thiếu: dịch, tooltip thuật ngữ.
- **Ưu tiên:** P1 (dịch, nếu người Việt và người nói tiếng Anh chung giới) · **Công sức:** M.

#### E2. Chat liên minh và thông báo — **Alliance Chat / Announcement**
- **Mở / nhịp:** thường trực.
- **Cơ chế:** kênh riêng của minh, mọi bậc R đều dùng; có thông báo minh. 1.0.84: ghim tin lên đầu kênh. Tin hệ thống tự động (kết trận mở, thành viên mới) [chưa xác minh danh mục].
- **Tương tác:** trung tâm phối hợp hằng ngày.
- **UI/UX:** tab Minh trong khung chat; thông báo ở trang minh.
- **Giữ chân:** chỗ "tụ tập" của nhóm.
- **Tu tiên hoá:** "Kênh minh"; "Bố cáo".
- **Game mình:** ✅ có kênh minh và bố cáo. Còn thiếu: ghim tin; tin hệ thống tự động (mở kết trận, có người nhờ giúp, thành viên bị cướp, kiếp vân của đồng minh); @nhắc tên.
- **Ưu tiên:** P1 · **Công sức:** S.

#### E3. Chat riêng và nhóm chat tự tạo — **Private Chat / Custom Group Chats**
- **Mở / nhịp:** thường trực.
- **Cơ chế:** chat riêng 1-1 [chưa xác minh chi tiết]. Nhóm chat tự tạo có quản trị viên và ghim tin (1.0.84); cũng có nhóm liên quân (coalition) và nhóm di cư theo đội [1 nguồn].
- **Tương tác:** ngoại giao kín, nhóm officer, nhóm bạn bè giữa nhiều minh.
- **UI/UX:** từ hồ sơ người chơi bấm "Nhắn"; trong khung chat có "Tạo nhóm" để chọn người.
- **Giữ chân:** quan hệ cá nhân giữ người ở lại lâu hơn quan hệ với game.
- **Tu tiên hoá:** "Truyền âm" (1-1); "Đàm đạo đường" (nhóm).
- **Game mình:** ✅ truyền âm 1-1 (kênh `p<pid>`, `talk.ts`): từ tầng 3, người đã chặn mình thì không nhắn được, offline thì Web Push; nhóm chat tự tạo (`world/groups.ts`, kênh `g<id>`): ai cũng lập, tối đa 20 người mỗi nhóm, mỗi người 5 nhóm, thêm người từ hồ sơ, rời nhóm. Chưa có quyền quản trị nhóm (đá người, ghim tin).
- **Ưu tiên:** P0 · **Công sức:** M.

#### E4. Kênh liên server và kênh đặc biệt — **Language Channels / Lost Kingdom Threads / Camp Chat**
- **Mở / nhịp:** theo mùa và sự kiện.
- **Cơ chế:** 1.0.85: kênh theo ngôn ngữ nối các vương quốc lân cận (đang thử). Ở Lost Kingdom, chat được thay bằng "threads": mỗi tin là một chủ đề để người khác trả lời, xoá khi hết mùa (1.0.82, 1.0.88); 1.0.89 giới hạn theo cấp Tòa thị chính. Có kênh phe (camp) và biểu tượng phe cạnh tên (1.0.84, 1.0.87). Có chat trong sự kiện Golden Kingdom (1.0.71).
- **Tương tác:** cộng đồng lớn hơn một vương quốc.
- **UI/UX:** thêm tab trong khung chat; bảng threads có danh sách chủ đề.
- **Giữ chân:** thảo luận có cấu trúc, ít trôi tin.
- **Tu tiên hoá:** "Luận đạo bảng" (threads trong một giới).
- **Game mình:** ⛔ liên server. ❌ chưa có bảng threads hay kênh phái (Chính / Tà) trong giới; phần này làm được.
- **Ưu tiên:** P2 · **Công sức:** M.

#### E5. Công cụ trong chat: chia sẻ, sửa tin — **Share Coordinates / Reports / Commanders; Recall / Edit / Quote**
- **Mở / nhịp:** thường trực.
- **Cơ chế:** chia sẻ vào chat được toạ độ, chiến báo (kể cả báo cáo gộp, 1.0.82), tướng/trang bị (1.0.84), thẻ đánh dấu (1.0.84), kết quả rương (1.0.87). Thu hồi, sửa, trích dẫn tin (1.0.71). Nhắc đúng từ khoá cốt truyện trong chat thì được thưởng ngày (1.0.87). Biểu tượng cảm xúc/sticker [chưa xác minh].
- **Tương tác:** "nhìn trận này đi", "tập trung ở đây", khoe tướng.
- **UI/UX:** nút Chia sẻ trên chiến báo, tướng và ô bản đồ; tin trong chat thành thẻ bấm được (bay tới, mở báo cáo).
- **Giữ chân:** chat thành công cụ chơi chứ không chỉ để nói.
- **Tu tiên hoá:** "Ngọc giản truyền tin": thẻ chiến báo, thẻ trưởng lão, thẻ toạ độ.
- **Game mình:** ✅ chia sẻ toạ độ (chạm ô bất kỳ → "Gửi kênh minh / giới"; "(x,y)" trong tin thành nút "Tới") và chiến báo (nút ở mỗi chiến báo; "#r<id>" thành nút "Xem trận" mở màn Phát lại) và thẻ trưởng lão ("Chia sẻ vào chat" ở Môn hạ; "#tl:…" thành thẻ chân dung + cấp + sao) — `TileSheet`, `Reports`, `Disciples`, `Chat.svelte`. Chạm một tin → Trả lời (tin mới mang "#q<mã>", vẽ thành dòng trích dẫn tin gốc); tin của mình thu hồi được trong 2 phút (server `unsay` ghi lại chữ rỗng, mọi người nghe thấy "Tin đã được thu hồi"); hàng biểu cảm 12 emoji cạnh ô gõ. Không làm sửa tin (RoK cũng không).
- **Ưu tiên:** P0 (toạ độ + chiến báo) · **Công sức:** M.

#### E6. Thư — **Mail (System / Player / Alliance / Reports)**
- **Mở / nhịp:** thường trực.
- **Cơ chế:** RoK có thư hệ thống, thư người chơi, thư minh, chiến báo, báo cáo do thám, báo cáo thu thập [chưa xác minh cách chia tab]. R2–R3 gửi tin cho thành viên; R4 gửi lời mời [2 nguồn]. 1.0.85: báo cáo gộp đánh dấu yêu thích được. 1.0.81: có thư báo khi được phong hoặc bị tước title.
- **Tương tác:** thư minh cho lệnh dài; thư riêng cho ngoại giao.
- **UI/UX:** hộp thư chia tab, có nút Nhận/Xoá/Yêu thích.
- **Giữ chân:** lưu dấu lịch sử (chiến báo đáng nhớ).
- **Tu tiên hoá:** "Phi kiếm truyền thư"; thư cả minh là "Minh lệnh thư".
- **Game mình:** ✅ thư hệ thống kèm quà (nhận đúng một lần, "Nhận tất cả"), gần 40 loại (sự kiện, bồi thường, Minh lễ, mùa, chợ, Vận Linh Trận, sắc phong…), tối đa 30 thư (`MAIL_MAX`); thư minh (`allyMail`: R4 / minh chủ gửi hộp thư cả minh, ≤ 300 chữ, mỗi giờ một thư); báo cáo do thám và thư "bị do thám" (`world/spy.ts`); chiến báo để riêng (`Reports`); thư 1-1 thay bằng truyền âm. Còn thiếu: xoá / đánh dấu yêu thích thư.
- **Ưu tiên:** P1 · **Công sức:** M.

---

### F. Trao đổi trực tiếp

#### F1. Gửi tài nguyên qua Trading Post — **Trading Post**
- **Mở / nhịp:** mở ở Tòa thị chính 10 [2 nguồn]; dùng khi cần nuôi ai đó.
- **Cơ chế:**
  - Gửi lương, gỗ, đá cho thành viên cùng minh; **không gửi được vàng** [2 nguồn]. heaven-guardian ghi chỗ này không rõ ràng.
  - Thuế giảm theo cấp: cấp 1 khoảng 35%, cấp 16 là 20%, cấp 21 là 15%, cấp 24 là 10%, cấp 25 là 8% [3 nguồn khớp ở mốc cấp 24 và 25]. riseofkingdomsguides nói thuế giảm 1% mỗi cấp; cách tính đó không khớp mốc cấp 24 [mâu thuẫn].
  - Sức chở mỗi chuyến: cấp 1 khoảng 5.000 hoặc 15.000 [mâu thuẫn]; cấp 16 là 900k; cấp 21 là 1,4M; cấp 24 là 2M; cấp 25 là 2,5M [2 nguồn].
  - Thương nhân chiếm một hàng xuất quân, đi và về theo khoảng cách [2 nguồn]. Không nguồn nào nhắc hạn mức ngày.
- **Tương tác:** nuôi người thiếu; acc phụ nuôi acc chính (nhất là trước MGE và KvK).
- **UI/UX:** chạm thành đồng minh → "Giao thương" → chọn số từng loại → thấy thuế và thời gian → gửi.
- **Giữ chân:** tình nghĩa, nhưng cũng mở cửa cho acc phụ.
- **Tu tiên hoá:** "Truyền tống trận vận linh"; thuế gọi là "hao tổn khi truyền tống".
- **Game mình:** ✅ Vận Linh Trận (`world/supply.ts`, `Supply.svelte`): từ Chủ điện tầng 10, trong hồ sơ người cùng minh gửi linh thạch / thảo / khoáng, người nhận nhận qua thư; hao tổn 35 % (Tàng Bảo Các tầng 1) → 8 % (tầng 25) đốt đi; mỗi ngày gửi tối đa 2× sức chứa kho mình, mỗi người nhận tối đa 1× sức chứa kho họ, nên dồn của qua acc phụ không đáng (`MARKET=off` tắt cùng chợ).
- **Khuyến nghị:** nếu làm thì thêm điều kiện ở cùng minh từ N ngày, thuế cao, trần mỗi ngày theo kho, không gửi linh thạch.
- **Ưu tiên:** P2 · **Công sức:** S–M.

> Ghi chú: RoK không cho tặng vật phẩm thẳng giữa người chơi [chưa xác minh]. Các kênh "tặng" là quà minh (B2) và Trading Post (F1).

---

### G. Danh tính và so sánh

#### G1. Hồ sơ người chơi — **Governor Profile**
- **Mở / nhịp:** mở bất cứ lúc nào bằng cách chạm tên hoặc thành.
- **Cơ chế:**
  - **Đã kiểm qua patch note:** 1.0.74 bản PC hiện thứ hạng Champions of Olympia, Ark, Lost Kingdom trong hồ sơ. 1.0.79 có "Governor Profile → Ark of Osiris → Individual Stats". 1.0.71 chạm tên minh trên hồ sơ để nhảy tới trang thành viên. 1.0.79 dùng kill points trong trang duyệt di cư đặc biệt.
  - **Chưa xác minh bố cục:** ảnh đại diện và khung, tên, minh, lực chiến, kill points, thống kê (lực chiến cao nhất, thắng/thua, quân tử trận, số lần do thám, tài nguyên đã thu, tài nguyên đã hỗ trợ, số lần giúp), số quân hạ theo tier, thành tích, tướng, nút Nhắn/Thư/Kết bạn/Chặn.
- **Tương tác:** khoe; officer đánh giá người xin vào; kẻ thù "đọc" nhau trước khi đánh.
- **UI/UX:** bảng hồ sơ có các tab (Thông tin, Thành tích, Tướng, Thống kê sự kiện).
- **Giữ chân:** mọi nỗ lực đều hiện ra cho người khác thấy.
- **Tu tiên hoá:** "Danh thiếp chưởng môn": cảnh giới, thế lực, chiến công, số lần độ kiếp, kỷ lục Thông Thiên Tháp, các mùa đã phi thăng, trưởng lão tiêu biểu, tiên minh.
- **Game mình:** ✅ hồ sơ chưởng môn (`profileOf` ở `world/profile.ts`, `Profile.svelte`): mở từ tên ở chat, người trong minh, tông môn trên bản đồ, bảng xếp hạng hay chân dung mình; hiện chân dung, cảnh giới, lực chiến, minh + bậc, chiến công, tranh đoạt, tháp, thành tựu, tước Giới Chủ, danh hiệu mùa; nút truyền âm, kết giao, chặn, thêm vào nhóm, mời vào minh, Vận Linh Trận.
- **Ưu tiên:** P1 · **Công sức:** M.

#### G2. Bảng xếp hạng — **Rankings**
- **Mở / nhịp:** thường trực.
- **Cơ chế:** xếp hạng cá nhân (lực chiến, kill points…), liên minh (lực chiến, kill…) và vương quốc [chưa xác minh đủ danh mục]. Mỗi sự kiện có bảng riêng. Honor của KvK xếp hạng theo cá nhân, minh và vương quốc [1 nguồn].
- **Tương tác:** so kè giữa người và giữa minh.
- **UI/UX:** từ hồ sơ hoặc menu mở "Xếp hạng", chọn từng tab.
- **Giữ chân:** mục tiêu dài hạn; khoe.
- **Tu tiên hoá:** "Phong Vân Bảng" (cá nhân), "Tiên Minh Bảng"; "Bảng phong thần" (đã có cho mùa).
- **Game mình:** ✅ có 6 bảng (lực chiến, cảnh giới, chiến công, tranh đoạt/Elo, tháp, sự kiện tuần), điểm mùa theo phe (minh hoặc người đi lẻ) kèm điểm hai phái Chính / Tà, bảng phong thần các mùa trước, bảng Công Huân; danh sách minh sắp theo lực chiến. Còn thiếu: bảng xếp hạng riêng cho minh (lực chiến / chiến công).
- **Ưu tiên:** P2 · **Công sức:** S.

#### G3. Bạn bè và chặn — **Friends / Block List**
- **Mở / nhịp:** thường trực.
- **Cơ chế:** RoK có danh sách bạn bè; 1.0.85 thêm từ chối lời mời, ghi chú và chia nhóm bạn [1 nguồn]. Mời bạn vào đội Champions of Olympia và Ceroli Crisis [2 nguồn]. Chặn người trong chat [chưa xác minh chi tiết].
- **Tương tác:** giữ quan hệ qua nhiều minh và nhiều mùa.
- **UI/UX:** tab Bạn bè; nút Kết bạn trên hồ sơ.
- **Giữ chân:** quan hệ cá nhân.
- **Tu tiên hoá:** "Đạo hữu" (kết giao); "Tuyệt giao" (chặn).
- **Game mình:** ✅ có chặn (tối đa 100 người, ẩn chat phía client, người bị chặn không truyền âm / thêm mình vào nhóm được; action `block`) và đạo hữu (`friend` ở `sect/inbox.ts`): nút "Kết giao" trong hồ sơ (một chiều, tối đa 50), thẻ Truyền âm có dải đạo hữu (chấm lục: đang chơi). Chưa có lời mời kết bạn, ghi chú, chia nhóm bạn.
- **Ưu tiên:** P2 · **Công sức:** S–M.

#### G4. Báo vương quốc — **Kingdom Newspaper**
- **Mở / nhịp:** mỗi ngày một số.
- **Cơ chế:** có từ 1.0.35, mua ở Lyceum of Wisdom, 10 gem/số. Đưa tin kỷ lục thu thập, hạ man tộc, thủ thành, chuyện của các minh; có lịch để xem số cũ; bấm thích bài được; mua báo còn nhận một buff nhỏ ngẫu nhiên [1 nguồn].
- **Tương tác:** được "lên báo"; biết chuyện vương quốc khi vắng mặt.
- **UI/UX:** trang báo có các bài và nút thích.
- **Giữ chân:** tò mò, danh tiếng.
- **Tu tiên hoá:** "Tiên giới tân văn" hay "Giới báo".
- **Game mình:** 🟡 có biên niên giới (lập tông môn, cướp thắng/thua, độ kiếp, mùa, yêu vương, chương Thiên Đạo Biên Niên, Luận Kiếm Minh Chiến) hiện trên bản đồ (`ChronArgs`), và thư Tổng kết mùa riêng từng người. Chưa có "báo" tổng hợp mỗi ngày (kỷ lục, chuyện các minh).
- **Ưu tiên:** P2 · **Công sức:** S.

---

### H. Chính trị vương quốc

#### H1. Vua và Lost Temple — **King / Lost Temple**
- **Mở / nhịp:** tranh theo chu kỳ.
- **Cơ chế:**
  - Minh giữ Lost Temple (ở Zone 3) thì minh chủ thành **vua** [≥ 2 nguồn].
  - Đền mở tranh mỗi 7 ngày; phải giữ 8 giờ mới chiếm được [1 nguồn: fandom qua tìm kiếm]. Trong trận ở Lost Temple, quân thương nặng chết hết, trừ lần chiếm đầu (đánh quân canh) [1 nguồn].
  - Title của vua cho +5% công, thủ, máu [2 nguồn].
  - Lost Temple mở vào ngày thứ mấy của vương quốc [chưa xác minh]. 1.0.81: trang quản lý Lost Temple có thông tin di cư.
- **Tương tác:** đỉnh chính trị; liên quân tranh ngôi.
- **UI/UX:** biểu tượng đền lớn ở giữa bản đồ; trang "Vương quốc" có quản lý title, buff, nhập cư.
- **Giữ chân:** mục tiêu tối thượng; quyền lực thật.
- **Tu tiên hoá:** **"Giới Chủ"**. Minh giữ Thiên Môn (game đã có) khi hết pha hoặc hết tuần thì minh chủ là Giới Chủ.
- **Game mình:** ✅ Giới Chủ (`lordOf` ở `world/lord.ts`): minh chủ tiên minh giữ Thiên Môn (chưa ai giữ: minh đứng đầu điểm mùa), hiện trên bản đồ giới; Thiên Môn mở ở pha cuối, 12 điểm mùa/giờ.
- **Ưu tiên:** P1 · **Công sức:** M.

#### H2. Title vương quốc (buff/debuff) — **Kingdom Titles**
- **Mở / nhịp:** vua (và người được uỷ quyền) phong cho bất kỳ ai, bất cứ lúc nào [2 nguồn].
- **Cơ chế:**
  - **Buff:**
    - Justice: +5% công, +10% hành quân.
    - Duke: +5% thủ, +10% huấn luyện.
    - Architect: +10% xây.
    - Scientist: +5% nghiên cứu, +10% thu vàng.

    Bốn title trên [3 nguồn]. Ngoài ra Queen +15% thu thập; General +5% công, +5% thủ; Prime Minister +15% sản lượng, +10% xây [2 nguồn]. Nhóm ba title sau có thể là vai trò mới hơn.
  - **Debuff:** Traitor −3% công/thủ; Beggar −10% sản lượng; Exile −5% thủ; Slave −5% máu; Sluggard −5% hành quân/huấn luyện; Fool −5% xây/nghiên cứu [3 nguồn].
  - Chỉ cần có title **lúc bắt đầu** việc (xây, nghiên cứu), nên người chơi xin title, đặt việc rồi trả lại [2 nguồn]. Cộng đồng dùng bot, kênh chat, Discord hay "người phát title" để xếp hàng [2 nguồn]. Thời hạn giữ và thời gian hồi [chưa xác minh]. 1.0.81: có thư báo khi được phong hoặc bị tước.
- **Tương tác:** xã giao với "triều đình"; thưởng đồng minh, phạt kẻ thù.
- **UI/UX:** chạm thành người chơi → (vua) "Phong title" → chọn title.
- **Giữ chân:** quyền lực mềm; lý do chào hỏi vua và minh vua.
- **Tu tiên hoá:** **"Sắc phong"**.
  - Buff: Thần Công (xây), Truyền Đạo Tôn Giả (tu luyện/nghiên cứu), Chiến Thần (công + hành quân), Hộ Quốc Công (thủ + tuyển), Bách Thảo Tiên (khai mỏ).
  - Debuff: Phản Đồ, Khất Cái, Lưu Đày, Nô Bộc, Giải Đãi, Si Nhân.
- **Game mình:** ✅ sắc phong (`crown`/`uncrown` ở `world/lord.ts`, `titleBuffs`): Giới Chủ phong từ hồ sơ người chơi 4 phúc (Chiến Thần, Hộ Quốc Công, Thần Công, Bách Thảo Tiên) và 4 hoạ (Phản Đồ, Khất Cái, Giải Đãi, Si Nhân); mỗi tước một người, mỗi người một tước, giữ 24 giờ, phong lại chờ 10 phút, người nhận có thư.
- **Ưu tiên:** P1 · **Công sức:** M.

#### H3. Buff vương quốc và quà của vua — **Kingdom Buffs / King's Gifts**
- **Mở / nhịp:** buff mỗi ngày; quà mỗi tuần.
- **Cơ chế:** vua bật buff cho cả vương quốc (tốc xây, nghiên cứu, huấn luyện, sản lượng), tốn 2.500 gem [2 nguồn], mỗi ngày một lần [1 nguồn]. Quà của vua mỗi tuần: 1 Legendary, 2 Epic, 5 Elite, 10 Advanced trophy để chia [1 nguồn].
- **Tương tác:** vua "ban ơn", chia quà cho người có công.
- **UI/UX:** trang Vương quốc có nút Bật buff và Phát quà (chọn người nhận).
- **Giữ chân:** ai cũng hưởng lợi từ việc có vua; chia quà sinh chính trị.
- **Tu tiên hoá:** "Giới Chủ ban phúc"; "Thiên ân".
- **Game mình:** ✅ Giới Chủ ban phúc cả giới mỗi ngày một lần (`bless`: xây / tuyển / sản lượng +5 % hoặc hành quân +8 % trong 8 giờ, hiện trên thẻ bản đồ giới) và ban Thiên Ân lễ (`boon`: 3 phần mỗi tuần, từ hồ sơ người nhận).
- **Ưu tiên:** P2 · **Công sức:** S.

#### H4. Kỹ năng vua, giấy nghỉ phép, quản lý nhập cư — **King Skills / Vacation Permit / Immigration Control**
- **Mở / nhịp:** từ Season 2 trở đi.
- **Cơ chế:** vua có kỹ năng **Banish**, đẩy thành người khác ra tỉnh ngoài (1.0.74; thời gian hồi giảm từ 72 xuống 24 giờ ở 1.0.88) và **Inspire** (1.0.88). **Vacation Permit** (1.0.87): vua cho một người "nghỉ phép" cả mùa, không tính vào ghép trận và bị hạn chế di chuyển; người đang nghỉ phép cần ít passport hơn khi di cư đi (1.0.89); vua thu hồi được. Vua đặt trần lực chiến cho người nhập cư và duyệt đơn đặc biệt [1 nguồn]. 1.0.77: có nhật ký nhập cư. 1.0.84: công cụ để người chơi đăng ký chọn chỗ ("domain").
- **Tương tác:** trừng phạt, che chở, tuyển người.
- **UI/UX:** trang Vương quốc có mục Kỹ năng vua và Nhập cư.
- **Giữ chân:** quyền lực có công cụ thật; người bận vẫn "giữ chỗ".
- **Tu tiên hoá:** "Phóng Trục" (Banish); **"Bế Quan Lệnh"** (Vacation Permit). Chưởng môn bế quan thì không bị đánh và không tính vào ghép; rất hợp với tu tiên.
- **Game mình:** 🟡 có Bế Quan Lệnh (`sect/seclude.ts`): Cài đặt › Bế quan 3 / 7 / 14 ngày, phải gọi hết đội về và không đang sát khí → khiên tới hết hạn, chỉ nhận thư / điểm danh; xuất quan lúc nào cũng được, 3 ngày sau mới bế quan lại. Chưa có kỹ năng Giới Chủ (Phóng Trục…), quản lý nhập cư.
- **Ưu tiên:** P2 (riêng Bế Quan Lệnh có thể lên P1 vì hợp trụ cột "chờ đợi có nghĩa") · **Công sức:** M.

#### H5. Luật vương quốc, NAP, luật MGE (do cộng đồng đặt) — **Kingdom Rules / NAP**
- **Mở / nhịp:** thường trực; đây là thoả thuận giữa người chơi, không phải cơ chế game.
- **Cơ chế:** các minh ký hiệp ước không xâm phạm (NAP), đặt vùng cấm đánh, luật MGE (ai được lên top) và luật không đánh acc phụ; vi phạm thì bị zero hoặc bị title debuff. Nguồn: heaven-guardian (trước khi đánh phải xác nhận mục tiêu "được phép"), hướng dẫn farm account (dùng acc phụ zero người khác). Phần còn lại theo hiểu biết chung [chưa xác minh chi tiết].
- **Tương tác:** ngoại giao, phản bội, drama.
- **UI/UX:** không có UI riêng; chạy qua chat, thư, Discord.
- **Giữ chân:** đây chính là "câu chuyện" của mỗi vương quốc.
- **Tu tiên hoá:** "Minh ước" / "Bất xâm phạm ước"; có thể thành cơ chế: hai minh ký minh ước thì không cướp nhau và hiện cùng màu trên bản đồ.
- **Game mình:** ✅ minh ước (`napAsk`/`napOk`/`napNo`/`napEnd` ở `world/guild.ts`, `napBetween`): R4 / minh chủ đề nghị, minh kia nhận / từ chối, một bên huỷ là huỷ cả hai; đang minh ước thì không cướp tông môn, cướp khoáng, do thám, phá cờ của nhau, không đánh điểm bên kia giữ, qua được cửa ải bên kia giữ. Luật PvP cứng (`PVP_FLOOR`, khiên) đã thay một phần cho "luật cộng đồng".
- **Ưu tiên:** P1 · **Công sức:** S–M.

#### H6. Di cư và tuyển mộ cấp vương quốc — **Migration / Recruitment Plaza**
- **Mở / nhịp:** theo cửa sổ di cư.
- **Cơ chế:**
  - Cần Tòa thị chính 16, rời minh, mọi quân về thành, tài nguyên để ngoài không vượt mức kho bảo hộ; giữa hai lần di cư cách 30 ngày [1 nguồn 2026].
  - Passport theo lực chiến: 0–10M cần 1 trang; 10–15M 2 trang; 25–30M 6; 35–40M 12; 45–50M 20; 75–80M 50; 95–100M 70; trên 100M 75 trang (mỗi trang 600k điểm cá nhân) [1 nguồn].
  - Có giới hạn tuổi nhân vật theo mùa (khoảng 80 / 120 / 150 ngày), trần lực chiến và số chỗ trống; vua duyệt được một phần [1 nguồn].
  - 1.0.83: di cư sang mùa khác phải đặt cọc 20.000 gem (hoàn lại khi xong), qua mật khẩu cấp 2, lực chiến từ 10M tới 85M; ra mắt **Recruitment Plaza** để vương quốc đăng tin tuyển. 1.0.81: bộ lọc tìm vương quốc. 1.0.79: xem được thời gian chờ di cư.
- **Tương tác:** vương quốc "săn" người; cả nhóm di cư cùng nhau.
- **UI/UX:** trang Tổng quan vương quốc có bộ lọc, nút Di cư, yêu cầu và passport cần có.
- **Giữ chân:** đổi môi trường mà không phải bỏ tài khoản.
- **Tu tiên hoá:** "Phi độ giới"; "Chiêu Hiền Bảng" (tin tuyển).
- **Game mình:** ⛔ PLAN ghi không chuyển server. Người mới vào giới được tới ngày 21; giới mới mở khi giới cũ đầy. Có thể làm **Chiêu Hiền Bảng cho tiên minh trong giới** (tin tuyển có yêu cầu).
- **Ưu tiên:** P2 · **Công sức:** S (bảng tuyển trong giới).

#### H7. Bảo vệ tân thủ và dịch chuyển tân thủ — **Beginner's Protection / Beginner Teleport**
- **Mở / nhịp:** những ngày đầu.
- **Cơ chế:** RoK có khiên tân thủ [chưa xác minh thời hạn và điều kiện mất]. Beginner Teleport dành cho tài khoản mới có Tòa thị chính dưới 8, cho sang vương quốc khác [2 nguồn]; nguồn ghi 1 lượt, nguồn khác ghi 2 lượt [mâu thuẫn]; không vào được vương quốc đã có hơn 2 nhân vật của mình [1 nguồn]. Hiện tượng "jumper": chơi vài ngày ở vương quốc cũ rồi nhảy sang vương quốc mới [1 nguồn].
- **Tương tác:** người mới chọn nơi có bạn hoặc minh mời.
- **UI/UX:** vật phẩm dịch chuyển trong túi; danh sách vương quốc.
- **Giữ chân:** không bị "làm thịt" ngay ngày đầu.
- **Tu tiên hoá:** "Hộ sơn tân thủ" (đã dùng).
- **Game mình:** ✅ khiên tân thủ 72 giờ (`NEWBIE_SHIELD`); PvP mở ở tầng 6 (`PVP_HALL`); không ai đánh được người có lực chiến dưới 50% mình (`PVP_FLOOR`), nên người mới yếu được che thêm.
- **Ưu tiên:** đã có · **Công sức:** —.

---

### I. PvP

#### I1. Điều kiện tấn công thành — **Attacking Cities**
- **Mở / nhịp:** thường trực.
- **Cơ chế:** RoK cho đánh thành của bất kỳ ai khác minh trong vương quốc, miễn có đường (khu và đèo đã mở) và mục tiêu không có khiên [2 nguồn, gián tiếp]. Không thấy luật giới hạn chênh lực chiến [chưa xác minh]. 1.0.76: có hộp xác nhận khi đánh hoặc do thám người cùng phe ở Season of Conquest.
- **Tương tác:** cướp, trả thù, chiến tranh giữa các minh.
- **UI/UX:** chạm thành → Tấn công / Do thám / Kết trận.
- **Giữ chân:** rủi ro thật tạo căng thẳng; kéo người chơi vào minh để được che.
- **Tu tiên hoá:** "Công sơn", "Cướp".
- **Game mình:** ✅ `raidError`: không cướp người cùng minh; cần đường qua cổng đang mở; cả hai bên từ tầng 6; mục tiêu không có khiên; lực chiến địch ≥ 50% mình (báo thù thì bỏ qua); mỗi mục tiêu chỉ một đội. Ghép đối thủ: kẻ phải báo thù + 3 người ngẫu nhiên trong 10 người gần lực chiến nhất (`MATCH_POOL`, `MATCH_PICK`), hoặc chạm vào tông môn trên bản đồ.
- **Ưu tiên:** đã có · **Công sức:** —.

#### I2. Khiên hoà bình và War Frenzy — **Peace Shield / War Frenzy**
- **Mở / nhịp:** dùng khi offline hoặc khi thấy bị đe doạ.
- **Cơ chế:** khiên là vật phẩm [chưa xác minh bộ thời hạn; thường thấy 8 giờ / 24 giờ / 3 ngày], mua ở VIP shop, cửa hàng minh, Courier Station [2 nguồn]. Đi đánh người khác làm mất khiên [chưa xác minh]. **War Frenzy** là trạng thái sau khi giao chiến; lúc đó không dịch chuyển được [1 nguồn]; có chặn bật khiên hay không [chưa xác minh].
- **Tương tác:** "đoán giờ" đối thủ offline; canh lúc khiên hết.
- **UI/UX:** bong bóng khiên quanh thành; biểu tượng trạng thái có đồng hồ.
- **Giữ chân:** yên tâm khi đi ngủ; cũng là một nguồn bán hàng.
- **Tu tiên hoá:** "Hộ Sơn Kết Giới Phù"; "Sát khí" (War Frenzy).
- **Game mình:** ✅ khiên tự bật 8 giờ khi thủ thua (`SHIELD_TIME`); khiên chủ động Hộ Sơn Phù 8 / 24 / 72 giờ (vật phẩm kiếm bằng chơi, không bán bằng tiền thật); đi cướp thì mất khiên và nổi sát khí 30 phút (`FRENZY_TIME`): chưa bật được khiên, chưa dời núi được; bản đồ hiện khiên (`Seat.shield`).
- **Ưu tiên:** P1 · **Công sức:** S.

#### I3. Đốt thành và dời thành — **City Burning / Wall Durability / Relocation**
- **Mở / nhịp:** khi thua trận ở nhà.
- **Cơ chế:** thành thua thì cháy, độ bền tường giảm dần [≥ 2 nguồn]. Độ bền tường 15.000 ở cấp 1, 40.000 ở cấp 25 [1 nguồn]. Ngừng đánh thì lửa tự tắt sau một lúc [1 nguồn]. Độ bền về 0 thì thành bị **dời tới chỗ ngẫu nhiên** [3 nguồn]. Chủ thành sửa tường hoặc dập lửa [2 nguồn] (giá gem [chưa xác minh]). Tháp canh bắn kẻ tấn công, máu từ 1.000 tới 50.000 [1 nguồn].
- **Tương tác:** đuổi kẻ thù khỏi vùng; ép di dời.
- **UI/UX:** thành bốc lửa trên bản đồ; nút Dập lửa/Sửa tường.
- **Giữ chân:** thua có hậu quả thấy được, thắng có "chiến tích" thấy được.
- **Tu tiên hoá:** "Hộ Sơn Trận vỡ"; sơn môn bị đánh bật đi (đổi chỗ ngồi).
- **Game mình:** ✅ Linh hỏa thiêu sơn (`core/wall.ts`, `sect/wall.ts`, `world/wall.ts`): trận lực Hộ Sơn Đại Trận 500 × (1 + tầng); thủ thua mất 15 % và núi bốc linh hỏa 30 phút (tụt 1 %/phút), hết cháy tự hồi 3 %/giờ; tu bổ miễn phí mỗi 30 phút (+10 %), Tức Hỏa Phù dập lửa; trận lực về 0 lúc đang cháy thì tông môn bị đánh bật sang chỗ trống ngẫu nhiên vùng ngoài.
- **Ưu tiên:** P2 · **Công sức:** M.

#### I4. Cướp tài nguyên và kho bảo hộ — **Plunder / Storehouse Protection**
- **Mở / nhịp:** mỗi trận thắng vào thành địch.
- **Cơ chế:** chỉ tài nguyên để ngoài trong thành mới bị cướp; tài nguyên dạng vật phẩm trong túi thì không [1 nguồn]. Kho bảo hộ: cấp 1 giữ 300k lương, 300k gỗ, 225k đá, 150k vàng; cấp 20 giữ 1,4M lương/gỗ, 1,05M đá, 700k vàng; cấp 25 giữ 2,5M mỗi loại [2 nguồn]. Sức mang theo loại quân [chưa xác minh chỉ số].
- **Tương tác:** cướp người để kho đầy; người chơi học cách "cất" tài nguyên thành vật phẩm.
- **UI/UX:** chiến báo liệt kê số cướp được.
- **Giữ chân:** thưởng cho người chủ động; phạt người để kho tràn.
- **Tu tiên hoá:** "Kho bảo hộ" của Tàng Bảo Các.
- **Game mình:** ✅ bảo hộ 45% sức chứa (`PROTECT`); cướp 30% phần vượt (`RAID_SHARE`); mỗi đệ tử còn đứng mang tối đa 40 × sức bậc (`CARRY`, thể tu ×1,25, pháp tu ×0,8); trưởng lão có thiên phú tăng chiến lợi phẩm; nang tài nguyên trong túi không bị cướp. Khác RoK: bảo hộ theo % kho thay vì số tuyệt đối. Sim (25/09): bị cướp 19,2% sản lượng (trần 25%).
- **Ưu tiên:** đã có · **Công sức:** —.

#### I5. Do thám — **Scouting / Scout Camp**
- **Mở / nhịp:** trước mỗi lần đánh.
- **Cơ chế:** Scout Camp nâng số trinh sát từ 1 lên 3 (cấp 25), tốc trinh sát từ +5% lên +125%, tầm khám phá từ 5×5 lên 15×15 ô sương [2 nguồn]. Báo cáo do thám cho biết tướng thủ, số quân và tier, tường và tháp, tài nguyên, viện binh [2 nguồn]. Có vật phẩm chống do thám làm báo cáo hiện số quân giả [1 nguồn]. Báo cáo chỉ đúng ở thời điểm do thám [1 nguồn]. Người bị do thám có được báo không [chưa xác minh].
- **Tương tác:** trò chơi thông tin, giăng bẫy bằng số quân giả.
- **UI/UX:** chạm thành → Do thám (tốn tài nguyên hoặc thời gian) → nhận thư báo cáo.
- **Giữ chân:** chuẩn bị trước khi đánh; đấu trí.
- **Tu tiên hoá:** "Thần thức thám sơn" / "Khuy Thiên Kính"; chống do thám là "Ẩn Nặc Trận".
- **Game mình:** ✅ do thám (`world/spy.ts`): ở bảng Tranh đoạt thả linh điểu tới tông môn khác phe (hai bên từ tầng 6), tốn 200 × tầng Chủ điện bên kia linh thạch, linh điểu bận tới khi bay về; báo cáo qua thư: tài nguyên ước cướp được, quân giữ nhà + lực chiến, số đội viện binh, trưởng lão trấn thủ, trận lực, khiên; bên kia nhận thư "bị do thám" + Web Push. Còn thiếu: chống do thám.
- **Ưu tiên:** P1 · **Công sức:** S–M.

#### I6. Cảnh báo bị tấn công — **Incoming Attack Warning / Watchtower**
- **Mở / nhịp:** mỗi khi có đội nhắm vào mình.
- **Cơ chế:** tab War của minh hiện thành viên đang bị đánh, kèm đội trưởng địch và binh chủng nên dùng (1.0.85) [1 nguồn]. Có cảnh báo cá nhân khi quân địch đang tới [chưa xác minh mức chi tiết]. Watchtower là công trình phòng thủ (bắn kẻ tấn công); không nguồn nào nói nó cho thông tin cảnh báo [2 nguồn].
- **Tương tác:** gọi viện binh, bật khiên, rút quân; minh dồn tới cứu.
- **UI/UX:** viền màn hình đỏ hoặc biểu tượng cảnh báo; trong tab War [chưa xác minh hình thức].
- **Giữ chân:** căng thẳng thật, nhu cầu "có đồng đội".
- **Tu tiên hoá:** "Cảnh chung" (chuông cảnh báo); "Vọng lâu".
- **Game mình:** ✅ Tháp canh: đội địch vừa xuất quân (cướp, kết trận công sơn, cướp khoáng) là bên bị nhắm thấy thẻ son ở mọi tab (tên, giờ tới) + nút "Bật khiên" / "Gọi về" (`Hud.svelte`); offline thì Web Push (`notify.ts`); hành quân vẫn hiện trên bản đồ giới (`MapMarch.foe`). Chưa báo cho cả minh khi một thành viên bị nhắm.
- **Ưu tiên:** P0 · **Công sức:** S. Cần: cảnh báo khi có đội nhắm vào mình, push, và cho cả minh thấy.

#### I7. Phản công, báo thù, phản kết trận — **Counterattack / Counter Rally**
- **Mở / nhịp:** sau khi bị đánh.
- **Cơ chế:** RoK phản công tự do, không có luật báo thù riêng [chưa xác minh]. Season of Conquest có phản kết trận và tuỳ chọn "giữ vị trí sau khi đánh" (1.0.71).
- **Tương tác:** vòng trả đũa giữa các minh.
- **UI/UX:** từ chiến báo bấm "Tấn công lại" [chưa xác minh].
- **Giữ chân:** cảm giác công bằng khi bị đánh.
- **Tu tiên hoá:** "Báo thù" (đã dùng); "Phản Kết Trận".
- **Game mình:** ✅ báo thù trong 24 giờ (`REVENGE_TIME`), bỏ giới hạn lực chiến, nhớ 5 kẻ thù (`FOES_MAX`). ❌ chưa có phản kết trận.
- **Ưu tiên:** P2 · **Công sức:** M.

#### I8. Thương nặng và tử trận, bệnh viện — **Severely Wounded vs Dead / Hospital**
- **Mở / nhịp:** mỗi trận.
- **Cơ chế:** quân thương nặng về bệnh viện; viện đầy thì chết [2 nguồn]. Tối đa 4 bệnh viện, mỗi viện 3.000 tới 75.000 chỗ [1 nguồn]. Đang bị kết trận thì không chữa được cho tới khi trận xong [1 nguồn]. Quân thủ công trình minh: 50% thương nặng chết [1 nguồn]. Ở Lost Temple, thương nặng chết hết [1 nguồn]. Ark không làm mất quân thật [1 nguồn, cần kiểm].
- **Tương tác:** chữa thương là một lý do dùng giúp đỡ của minh.
- **UI/UX:** bệnh viện có chỉ số chỗ; cảnh báo khi viện gần đầy.
- **Giữ chân:** thua không mất trắng; nhưng đánh liều thì mất thật.
- **Tu tiên hoá:** "Đan phòng" (đã dùng).
- **Game mình:** ✅ thương binh về Đan phòng, chỗ nằm có hạn, dư thì tử trận; chữa tốn 40% chi phí tuyển nên đánh người đang giữ nhà là lỗ.
- **Ưu tiên:** đã có · **Công sức:** —.

#### I9. Zeroing — **Zeroing**
- **Mở / nhịp:** khi có xung đột lớn hoặc cần trừng phạt.
- **Cơ chế:** đánh liên tục một thành (thường bằng kết trận lớn) cho tới khi viện đầy, quân chết và thành cháy, làm người đó mất phần lớn lực chiến. Dùng để phạt kẻ vi phạm luật hoặc trong KvK; acc phụ cũng dùng để zero người khác [1 nguồn]. Hoàn toàn do luật cộng đồng quyết định.
- **Tương tác:** đe doạ tập thể; hình phạt chính trị.
- **UI/UX:** không có UI riêng.
- **Giữ chân:** tạo drama; nhưng người bị zero thường bỏ game.
- **Tu tiên hoá:** "Diệt môn".
- **Game mình:** ⛔ theo lựa chọn thiết kế, game chủ động chặn: khiên 8 giờ sau khi thua, thương binh chữa ở Đan phòng, sim đo ≤ 2 lần bị cướp/ngày.
- **Ưu tiên:** không làm · **Công sức:** —.

#### I10. Acc phụ nuôi acc chính — **Farm Accounts**
- **Mở / nhịp:** thường trực.
- **Cơ chế:** tạo acc phụ trong cùng vương quốc để nuôi acc chính: gửi tài nguyên qua Trading Post, làm bao cát lấy điểm MGE, giữ quân viện binh cho cờ trong KvK, rally pháo đài lấy sách, chuyển điểm honor [1 nguồn].
- **Tương tác:** "một người nhiều acc" làm lệch cán cân.
- **UI/UX:** chuyển tài khoản trong cài đặt.
- **Giữ chân:** người chơi nặng đô có thêm việc để làm; người chơi thường thấy bất công.
- **Tu tiên hoá:** "Tiểu hào".
- **Game mình:** chủ ý chặn: Vận Linh Trận chỉ gửi cho người cùng minh, hao tổn 35 → 8 % đốt đi, trần gửi / nhận mỗi ngày theo sức chứa kho hai bên; chợ có biên giá, thuế 10% đốt đi.
- **Ưu tiên:** không làm · **Công sức:** —.

#### I11. Kill points, honor, lực chiến — **Kill Points / Honor / Power**
- **Mở / nhịp:** thường trực.
- **Cơ chế:** kill points tính theo tier quân hạ được: T1 0,2 · T2 2 · T3 4 · T4 10 · T5 20 mỗi quân [chưa xác minh trong phiên này]. Kill points hiện trên hồ sơ, dùng để xét tuyển vào minh và duyệt di cư (1.0.79). Honor points trong KvK đến từ hạ man tộc, đánh dark ruins, phá pháo đài, chiếm công trình theo giờ; xếp hạng theo cá nhân, minh và vương quốc [1 nguồn]. 1.0.87 thêm thưởng honor riêng cho R4/R5.
- **Tương tác:** chỉ số "độ máu chiến" để khoe và để minh chọn người.
- **UI/UX:** hồ sơ; các bảng xếp hạng.
- **Giữ chân:** tiến độ lâu dài ngoài lực chiến.
- **Tu tiên hoá:** "Chiến công" hay "Công huân". Nên tránh chữ "sát nghiệp" vì trong tu tiên đó là điều kiêng.
- **Game mình:** ✅ chiến công (`addKp`, cột `players.kills`): thế lực đệ tử bên kia hạ được (tính theo bậc) trong trận cướp, kết trận, tranh điểm, cả bên thủ; có bảng xếp hạng "Chiến công" và hiện trên hồ sơ. Thêm Công Huân mùa (chiến công / 100, săn yêu, yêu vương, khai mỏ…) có bảng và quà top 10; lực chiến; điểm tranh đoạt kiểu Elo (`PVP_START` 1000, `ELO_K` 32) và số thắng/thua.
- **Ưu tiên:** P1 · **Công sức:** S.

#### I12. KvK và xếp hạng vương quốc — **Kingdom vs Kingdom (Lost Kingdom)**
- **Mở / nhịp:** khoảng 3 tháng một lần [2 nguồn].
- **Cơ chế:** một nhóm vương quốc (nguồn ghi 8) đánh nhau trên bản đồ Lost Kingdom; cần Tòa thị chính 17. Honor chia 3 cấp: cá nhân, minh, vương quốc. Cuối KvK, các vương quốc khác được vào vùng xuất phát của nhau [1 nguồn]. Có Chronicle (mục tiêu theo chương), threads thay chat, kênh phe.
- **Tương tác:** cả vương quốc thành một đội; liên quân các minh.
- **UI/UX:** bản đồ riêng, lịch Chronicle, bảng honor.
- **Giữ chân:** mùa lớn; bài review gọi đây là sự kiện được yêu thích nhất [1 nguồn].
- **Tu tiên hoá:** "Giới chiến".
- **Game mình:** ⛔ PLAN không làm liên server; thay bằng mùa 49 ngày trong giới và bảng phong thần.
- **Ưu tiên:** không làm · **Công sức:** —.

---

### J. Sự kiện liên minh và cộng đồng

#### J1. Động viên liên minh — **Alliance Mobilization**
- **Mở / nhịp:** định kỳ; minh đăng ký trước.
- **Cơ chế:**
  - Mỗi minh 30–150 người tham gia; cá nhân phải có Tòa thị chính 16 trước khi minh đăng ký; mỗi người được chọn một lần mỗi đợt [1 nguồn].
  - Minh giữ tối đa 40 nhiệm vụ cùng lúc; mỗi người nhận 1 nhiệm vụ một lúc; mỗi ngày 10 lượt miễn phí và 1 lượt mua bằng gem; giữa hai nhiệm vụ phải chờ 15 phút. 1.0.85 giảm thời gian chờ nhiệm vụ mới xuất hiện xuống 5 phút. Nhiệm vụ thất bại không hoàn lượt; 1.0.71 lại ghi có hoàn cho nhiệm vụ chưa xong [mâu thuẫn].
  - Chỉ leader/officer có tham gia mới làm mới được nhiệm vụ chưa ai nhận.
  - Mỗi mốc điểm được chọn 1 trong 3 phần thưởng. Có 5 hạng giải (Fearless Bronze → Dazzling Silver → Brave Gold → Immortal Diamond → Supreme Suzerain); top 5 mỗi hạng có thưởng thêm.
  - 1.0.71: sửa danh sách người tham gia bất cứ lúc nào trong thời gian đăng ký.
- **Tương tác:** "bảng việc chung". Ai cũng góp phần; officer điều phối; các minh thi với nhau theo giải.
- **UI/UX:** bảng nhiệm vụ có loại, điểm, thời hạn và nút Nhận; thanh điểm minh có các mốc.
- **Giữ chân:** việc nhỏ, rõ ràng, có nhịp chờ nên phải quay lại.
- **Tu tiên hoá:** "Minh vụ đường" / "Tiên minh động viên", ví dụ minh vụ "hạ 10 yêu thú", "luyện 3 mẻ đan", "khai 20k linh khoáng".
- **Game mình:** ✅ Minh vụ đường (`world/mob.ts`, `AllyMob.svelte`): bảng 8 việc chung mỗi tuần (tất định theo mã minh + tuần), nhận 1 việc/lúc, 10 lượt/ngày, hạn 4 giờ, việc mới thế chỗ; 5 mốc quà cho ai góp ≥ 20 điểm; hết tuần 3 minh điểm cao nhất giới nhận thêm quà hạng (`mobTop`).
- **Ưu tiên:** P0 · **Công sức:** M. Tái dùng được bộ đếm của `EVENTS` và nhiệm vụ ngày.

#### J2. Ark of Osiris và Osiris League — **Ark of Osiris / Osiris League**
- **Mở / nhịp:** khoảng 2 tuần một lần [1 nguồn].
- **Cơ chế:**
  - Hai minh đấu nhau, mỗi bên khoảng 30 người [1 nguồn].
  - Đăng ký bắt đầu thứ Tư, kéo dài 3 ngày; tối thiểu 15 người; mỗi minh tối đa 3 đội; có vai "team coordinator" (1.0.80). Officer chọn khung giờ, thành viên đăng ký trước [1 nguồn].
  - Mục tiêu: Ark ở giữa (hộ tống về công trình không thuộc địch); obelisk (minh chiếm đầu tiên được 8 lượt dịch chuyển cho minh); công trình phụ và phía sau; điểm tiếp tế. Thắng theo tổng điểm [2 nguồn]. Không mất quân thật [1 nguồn].
  - 1.0.82: Silver Battlefield ghép liên vương quốc, 30 người mỗi đội, 4 coordinator, thưởng theo điểm cá nhân. 1.0.88: Silver còn 15 người mỗi đội, trận 30 phút; coordinator Golden 5 mỗi đội, Silver 3 mỗi đội.
  - **Osiris League** là giải liên server. Người xem đặt cược bằng xu (thua được hoàn 50%), xem trễ 5 phút, tua được [1 nguồn + patch notes].
- **Tương tác:** hẹn giờ; phân vai (người mang Ark, người giữ obelisk…); khán giả.
- **UI/UX:** bảng đăng ký có khung giờ và danh sách; bản đồ trận riêng; màn xem trực tiếp có cược.
- **Giữ chân:** lịch cố định; không mất quân nên ai cũng dám đánh; xem và cược tạo cộng đồng khán giả.
- **Tu tiên hoá:** "Thần Chu tranh đoạt" (hộ tống linh chu); "Cửu Thiên Luận Đạo Hội" (giải có khán giả, cược bằng "linh tệ" không quy ra tiền, PLAN mục 9).
- **Game mình:** ✅ Luận Kiếm Minh Chiến (`world/war.ts`: minh ghi danh, 20h thứ Bảy ghép cặp theo điểm minh chiến, người thứ k đấu người thứ k bằng đội hình Luận Kiếm Đài) + Tranh Đoạt Linh Châu (`world/ark.ts`, `ArkCard.svelte`: 20h Chủ nhật, chiến trường 11 ô như bản đồ Ark — Tụ Linh Nhãn nối nhau, Linh Tháp +10 % công, Linh Châu nạp ở Tiểu Trận — 8 hiệp × 10 phút giải tất định, không mất quân) + Cửu Thiên Luận Đạo Hội (bảng giải cả mùa, playoff bán kết / chung kết / tranh hạng ba cho 4 minh đầu — `leagueBoard` / `cupSetup` / `leagueRank`, quà theo hạng). Còn thiếu: khán giả xem trực tiếp, cược (League Bets).
- **Ưu tiên:** P1 · **Công sức:** L.

#### J3. Karuak Ceremony / Trial of Kau Karuak — **Karuak Ceremony**
- **Mở / nhịp:** theo lịch sự kiện.
- **Cơ chế:** Karuak Ceremony là PvE tiến dần, đánh các thách đấu khó dần, được nhờ trợ giúp [1 nguồn]. Trial of Kau Karuak là sự kiện đơn: 5 độ khó × 30 cấp, thưởng crystal dùng cho KvK [1 nguồn].
- **Tương tác:** nhờ minh giúp (ở bản Ceremony).
- **UI/UX:** bảng cấp độ có boss hẹn giờ.
- **Giữ chân:** thử thách tăng dần.
- **Tu tiên hoá:** "Thí luyện yêu hoàng".
- **Game mình:** ✅ Thí Luyện Yêu Hoàng (`sect/trial.ts`): lễ 4 ngày, 5 độ khó × 50 cửa đánh bằng quân thật, tinh anh mỗi 10 cửa, điểm theo độ khó; cùng Thông Thiên Tháp, Luận Võ Liên Hoàn và yêu vương (đánh chung). Còn thiếu: nhờ đồng minh giúp một cửa.
- **Ưu tiên:** P2 · **Công sức:** S.

#### J4. Ceroli Crisis / Ceroli Assault — **Team PvE**
- **Mở / nhịp:** theo lịch sự kiện.
- **Cơ chế:** Crisis cho đội 4 người (ghép ngẫu nhiên hoặc tự lập), chia vai 1 tank, 2 DPS, 1 support; có 6 boss và 5 độ khó (Easy → Hell). Assault cho đội lớn 12 người [1 nguồn: heaven-guardian].
- **Tương tác:** tổ đội nhỏ, phối hợp vai.
- **UI/UX:** phòng chờ tổ đội; chọn độ khó.
- **Giữ chân:** chơi cùng bạn; vai trò rõ.
- **Tu tiên hoá:** "Tổ đội bí cảnh".
- **Game mình:** ✅ Man Hoang Cổ Tộc (`world/party.ts`, `AllyParty.svelte`): từ Chủ Điện tầng 8, một người mở phòng (5 độ khó) và chọn vai Hộ Pháp / Chủ Công / Trị Liệu, người trong minh vào trong 10 phút (tối đa 4, mỗi người mỗi ngày một lần); server giải 5 đợt hung thú mạnh dần bằng đội đầu Luận Kiếm Đài của cả đội, quà theo độ khó × số đợt. Chưa có bản đội lớn 12 người (Assault), chưa ghép người ngoài minh.
- **Ưu tiên:** P2 · **Công sức:** L.

#### J5. Shadow Legion — **Shadow Legion**
- **Mở / nhịp:** theo lịch sự kiện.
- **Cơ chế:** sự kiện của minh: các đợt quân địch lần lượt tấn công thành của thành viên tham gia [1 nguồn]; cả minh viện binh cho nhau.
- **Tương tác:** phòng thủ tập thể, giúp nhau thật.
- **UI/UX:** lịch các đợt; bản đồ hiện thành nào sắp bị đánh.
- **Giữ chân:** cảm giác "cùng giữ nhà" mà không có PvP thật.
- **Tu tiên hoá:** "Ma triều công sơn": ma tu đánh từng ngọn núi, đồng minh đến viện binh.
- **Game mình:** ✅ Ma Triều Công Sơn (`world/legion.ts`): R4 / minh chủ ghi danh cả tuần; 20h thứ Tư, 5 đợt cách 5 phút đánh vào núi từng người trong minh (sức theo lực phòng thủ của chính người đó, 0,5× → 1,35×), viện binh đồng minh cùng thủ; giữ được đợt k thì k điểm, quân ngã chỉ bị thương; quà theo điểm (mốc 3/6/10/15), ba minh đầu thêm quà; băng nhắc trên HUD 15 phút trước.
- **Ưu tiên:** P1 · **Công sức:** M.

#### J6. Canyon Clash / Sunset Canyon (và giải đấu) — **Arena with Defensive Lineups**
- **Mở / nhịp:** theo lịch.
- **Cơ chế:** Canyon Clash do minh đăng ký; đội hình thủ được tự đặt cho thành viên nào chưa đặt (1.0.85). 1.0.87 đổi luật: không thưởng xu khi tấn công hay khi thắng, phần thưởng cuối trận như nhau cho cả hai bên; chia sẻ được rương thắng vào chat minh. Sunset Canyon Tournament (1.0.87) chia vương quốc thành nhóm 4 theo mùa, qua 3 giai đoạn (sơ tuyển, vòng chính, trình diễn) [1 nguồn]. Sunset Canyon là đấu trường bất đồng bộ bằng đội hình thủ [chưa xác minh chi tiết].
- **Tương tác:** minh đấu minh bằng đội hình.
- **UI/UX:** đặt đội hình thủ; danh sách đối thủ; bảng xếp hạng.
- **Giữ chân:** PvP không mất quân, chơi nhanh.
- **Tu tiên hoá:** "Luận Kiếm Đài".
- **Game mình:** ✅ Luận Kiếm Đài (`sect/arena.ts`, `world/arena.ts`): đội hình thủ, trận xa luân, 5 lượt/ngày, Elo, rương ngày theo bậc, bảng tuần + thư quà top 10, phục thù, Kiếm Ý + Thương Điếm; minh đấu minh bằng đội hình Luận Kiếm Đài ở Luận Kiếm Minh Chiến (`world/war.ts`). Chưa có giải đấu chia nhóm (Sunset Canyon Tournament).
- **Ưu tiên:** P2 · **Công sức:** M.

#### J7. Champions of Olympia — **5v5 Arena**
- **Mở / nhịp:** theo lịch.
- **Cơ chế:** đấu 5 người với 5 người (từ 1.0.84 có thêm 1, 2, 3 người và Balanced Mode); mời bạn bè/minh hoặc ghép ngẫu nhiên. Trận 10 phút; mỗi người 3 đạo quân; bản đồ có 5 cờ, vây 5 giây để chiếm, giữ cờ để ra điểm; hồi quân khoảng 20 giây nếu đứng gần cờ đang giữ [1 nguồn + patch].
- **Tương tác:** đội bạn bè.
- **UI/UX:** phòng chờ đội; trận thời gian thực.
- **Giữ chân:** chơi nhanh cùng bạn.
- **Tu tiên hoá:** "Luận Võ Ngũ Nhân".
- **Game mình:** ⛔ (thời gian thực, liên server).
- **Ưu tiên:** không làm · **Công sức:** —.

#### J8. Đố vui liên minh, sự kiện minh mới mở, tiệc lễ — **Alliance Quiz / Alliance Ascension / Festival Alliance Events**
- **Mở / nhịp:** theo lịch; đố vui do officer mở.
- **Cơ chế:** **Alliance Quiz**: officer mở ngay (sau 1 phút đếm ngược) hoặc đặt giờ trong ngày; không giới hạn số người, số lượt, thời gian; mọi người trả lời cùng lúc và thấy câu trả lời của nhau; "Flash of Insight" loại bớt đáp án sai (tối đa 2 mỗi câu, dùng chung cả minh); có câu chat mẫu để bàn; điểm cộng dồn cả minh, trả lời đúng sớm được thêm điểm, đủ ngưỡng thì cả minh nhận thưởng [1 nguồn]. **Alliance Ascension** (1.0.85): dành cho vương quốc mới mở, làm nhiệm vụ cùng nhau. **A Cordial Invitation** (1.0.88): tiệc minh dịp lễ. **Peerless Scholar** (1.0.79): thi kiến thức nhiều vòng.
- **Tương tác:** vui, nhẹ, ai cũng tham gia được.
- **UI/UX:** màn câu hỏi chung; thanh điểm minh.
- **Giữ chân:** gắn kết, không cần lực chiến.
- **Tu tiên hoá:** "Luận Đạo Vấn Đáp" (lấy câu hỏi từ Cẩm nang có sẵn); "Tông môn khai yến".
- **Game mình:** 🟡 Vấn Đạo Đài (`sect/quiz.ts`): mỗi ngày 5 câu về luật chơi, quà theo số câu đúng — đố vui cá nhân; sự kiện lễ (Trung Thu, Tân Xuân…) cũng là việc cá nhân. Chưa có đố vui chung cả minh, tiệc minh dịp lễ.
- **Ưu tiên:** P2 · **Công sức:** S–M.

#### J9. Kết trận pháo đài man tộc hằng ngày — **Barbarian Fort Rallies**
- **Mở / nhịp:** hằng ngày.
- **Cơ chế:** pháo đài cấp 1–3 dễ, cấp 4–6 khó [1 nguồn]. Thưởng sách Covenant để nâng Castle (khoảng 5 cuốn mỗi lần rally [1 nguồn]) và EXP tướng; **mỗi pháo đài bị hạ tạo quà minh cho mọi thành viên** [≥ 3 nguồn].
- **Tương tác:** việc co-op nhỏ và đều; người mới nhờ người cũ mở rally [1 nguồn].
- **UI/UX:** chạm pháo đài → Kết trận → tab War.
- **Giữ chân:** thói quen hằng ngày cùng nhau.
- **Tu tiên hoá:** "Yêu trại". Kết trận hạ yêu trại thì cả minh nhận minh lễ.
- **Game mình:** ✅ yêu trại (`BOSSES[1]`, `atlas.ts`): yêu vương cấp 1 ở mỗi vùng ngoài (12.000 máu, 3 lát, hồi 8 giờ), minh mới kết trận được ngay từ pha đầu; hạ là cả minh nhận Minh lễ (`allyGifts`); yêu vương cấp 2–3 hồi sau 24 / 72 giờ; thứ Ba – thứ Tư có Phá Yêu Trại (`world/tribe.ts`) tính điểm minh, top 3 nhận quà.
- **Ưu tiên:** P0 (làm cùng B2) · **Công sức:** S–M.

#### J10. Mightiest Governor — **MGE**
- **Mở / nhịp:** theo vòng xoay sự kiện.
- **Cơ chế:** 6 chặng: huấn luyện, hạ man tộc, thu thập, tăng lực chiến, hạ địch, và chặng cuối. Mỗi chặng 24 giờ, chặng cuối 48 giờ [1 nguồn]. Thưởng tượng tướng huyền thoại, chọn 1 trong 3 tướng [1 nguồn]. Ở nhiều vương quốc, hội đồng quyết trước ai được top ("MGE cố định") và zero kẻ phá luật [chưa xác minh; đây là thực tiễn cộng đồng].
- **Tương tác:** chính trị: ai được "đến lượt".
- **UI/UX:** trang sự kiện có các chặng và bảng xếp hạng.
- **Giữ chân:** mục tiêu nạp tiền; drama.
- **Tu tiên hoá:** "Thiên Kiêu Tranh Bá".
- **Game mình:** ✅ Tông Môn Tranh Bá (`FESTS.tranhBa`): thứ Hai → thứ Bảy, 6 ải như RoK, 5 mốc quà; bảng từng ải (quà ải qua thư lúc 0h) và bảng cả lượt (thư quà top 10 hết tuần — `festBoard`, `FEST_PRIZES`, `FEST_STAGE_PRIZES`), trưởng lão của đợt (xem file 5 B1).
- **Ưu tiên:** P2 · **Công sức:** S.

---

### K. Cộng đồng và giữ chân (lớp meta)

#### K1. Lịch hoạt động chung và cam kết — **Alliance Schedule / RSVP / Officer Roles**
- **Mở / nhịp:** tuần và mùa.
- **Cơ chế:** R4 đặt hoặc huỷ lịch sự kiện của minh [2 nguồn]. Đăng ký trước (Ark, Mobilization) tạo cam kết. Officer chia vai chiến sự, lãnh thổ, công nghệ, tuyển mộ, sự kiện, ngoại giao [1 nguồn: ldshop]. Nhiều thứ phối hợp ngoài game (Discord, bot title) [2 nguồn].
- **Tương tác:** hẹn giờ; "vắng là thấy".
- **UI/UX:** lịch sự kiện của minh; nút Đăng ký.
- **Giữ chân:** áp lực xã hội tích cực; thói quen theo lịch.
- **Tu tiên hoá:** "Minh sự lịch", "Điểm danh".
- **Game mình:** ✅ Minh sự lịch (`world/plans.ts`, `AllyPlans.svelte`): R4 / minh chủ hẹn giờ việc chung (tối đa 5 việc sắp tới, trước tối đa 7 ngày, lời nhắn ≤ 60 chữ), người trong minh bấm Tham gia / Rút, 10 phút trước giờ Web Push nhắc; ghi danh minh chiến / Linh Châu / ma triều; chức vị đường chủ chia vai.
- **Ưu tiên:** P1 · **Công sức:** S. Lịch minh đơn giản: officer đặt giờ kết trận hoặc sự kiện, thành viên bấm "Tham gia", Web Push nhắc trước.

#### K2. Địa vị và cảm giác thuộc về — **Identity / Status**
- **Mở / nhịp:** thường trực.
- **Cơ chế:** tag cạnh tên, cờ minh trên bản đồ, bậc R và chức vị, title của vua, kill points, xếp hạng; minh chủ và officer là "người có quyền".
- **Tương tác:** mọi hệ thống bên trên đều trả về một chỉ dấu danh tính.
- **UI/UX:** tag trong chat, trên thành, trên bảng xếp hạng.
- **Giữ chân:** rời minh là mất "họ".
- **Tu tiên hoá:** "Danh hiệu" hiện cạnh tên (ví dụ "[TAG] Chiến Đường chủ • Thần Công").
- **Game mình:** 🟡 tag hiện ở bảng mùa, điểm đang giữ và giữa lãnh thổ khi thu nhỏ bản đồ (`terrTags`); thẻ thành viên có bậc R1–R5 và chức vị; hồ sơ có minh + bậc, tước Giới Chủ, danh hiệu mùa (`State.crowns`), chiến công; có bảng phong thần. Tin chat và ghim tên tông môn trên bản đồ Giới ghi "[hiệu] tên" (`talk.ts`, `WorldView.svelte`). Chưa hiện danh hiệu cạnh tên, chưa có cờ minh riêng.
- **Ưu tiên:** P2 · **Công sức:** S.

---

## 3. Bảng tổng kết khoảng cách

| # | Tính năng (tên gốc) | Game mình | Ưu tiên | Công sức |
|---|---|---|---|---|
| A1 | Lập liên minh (Create Alliance) | ✅ lập tầng 10, 20k mỗi loại; thiếu cờ/huy hiệu riêng | P2 | S–M |
| A2 | Hồ sơ minh, đổi tên/tag/cờ | 🟡 có bố cáo; không đổi tên/tag | P2 | S |
| A3 | Gia nhập tự do/duyệt, mời, passlist/blocklist | ✅ cửa minh vào tự do / duyệt đơn, mời từ hồ sơ; thiếu passlist/blocklist | P1 | S–M |
| A4 | Sĩ số tối đa tăng dần | ✅ 30 → 40 theo Hộ Minh Đại Trận | P2 | S |
| A5 | Cấp bậc R1–R5 và quyền | ✅ R1 Ngoại môn … R4 Đường chủ, R5 Minh chủ (25/09); dấu bản đồ từ R3 | P1 | S |
| A6 | Chức vị officer có buff | ✅ 4 chức cho R4 (25/09) | P2 | S |
| A7 | Rời/đá/tự chuyển giao/giải tán | ✅ minh chủ vắng 7 ngày: đường chủ nhận thay (25/09); thẻ thành viên ghi số ngày vắng | P1 | S |
| B1 | Giúp đỡ (Alliance Help) | ✅ 10 lần/việc, người giúp được cống hiến, đĩa giúp nổi ở mọi tab | P1 | S |
| B2 | Quà liên minh, rương chung, quà từ gói nạp | ✅ Minh lễ (hạ yêu vương / yêu trại → cả minh nhận quà, cấp quà 1–5) + Tụ Bảo Minh Đỉnh (rương chung); không có gói nạp | **P0** | M |
| B3 | Công nghệ liên minh và quyên góp | ✅ Hộ Minh Đại Trận 9 trận × 5 tầng, cung phụng, trận minh chủ điểm | **P0** | L |
| B4 | Điểm cá nhân/quỹ minh và cửa hàng minh | ✅ cống hiến + Minh khố + Cống Hiến Các | **P0** | M |
| B5 | Kỹ năng liên minh (buff có thời hạn) | ✅ Minh trận thần thông (6 thần thông) | P2 | M |
| C1 | Pháo đài trung tâm/phụ | ✅ Tổng đà + Phân đà (1 + 1 mỗi 10 người, tối đa 3, `world/flags.ts`), góp quân xây, độ bền; chưa bị kết trận / cháy | P1 | L |
| C2 | Cờ, tiền đồn, khiên cờ, tháp tên | ✅ trận kỳ (cắm, nới lãnh thổ, bị phá, tự hồi) + đóng quân giữ cờ (25/09); chưa có Outpost, khiên cờ, tháp tên | P1 | L |
| C3 | Trung tâm tài nguyên minh (thu an toàn) | ✅ Minh khoáng (dựng trong lãnh thổ, kho 3 triệu, 30.000/giờ mỗi đội, không bị cướp) | P2 | M |
| C4 | Điểm tài nguyên minh và kho minh | 🟡 kho minh: lãnh thổ sinh Minh khố theo giờ (25/09); chưa có điểm tài nguyên từng loại sinh vào kho | P1 | M |
| C5 | Buff lãnh thổ và dịch chuyển vào lãnh thổ | ✅ lãnh thổ tiên minh (khai mỏ +25 %), dời tông môn vào lãnh thổ, dời núi tân thủ | P1 | M |
| C6 | Thánh địa, đèo, thưởng chiếm lần đầu | ✅ linh mạch (tăng ích theo điểm)/trận nhãn/Thiên Môn/di tích, quà chiếm lần đầu; thiếu chuyển quyền giữ điểm | P1 | S–M |
| D1 | Kết trận và tab Chiến tranh | ✅ điểm, yêu vương và tông môn (kết trận công sơn, 25/09); danh sách kết trận + nút góp đội ở trang Tiên minh | P1 | M |
| D2 | Viện binh và đồn trú | ✅ 3 đội nhà đồng minh, hộ pháp độ kiếp | P2 | S |
| D3 | Đánh dấu bản đồ cho minh | ✅ 5 dấu của minh + ghi nhớ cá nhân | **P0** | S |
| D4 | Mệnh lệnh minh, cửa hàng chiến công | 🟡 chỉ lệnh Thiên Thời (mỗi tông môn tự chọn), Thiên Môn Thương Điếm (Phi Thăng Tệ từ Công Huân); chưa có minh lệnh | P2 | M |
| E1 | Chat vương quốc | ✅ kênh giới, lọc từ, báo cáo; thiếu dịch | P1 | M |
| E2 | Chat minh và thông báo | ✅ thiếu ghim, tin hệ thống, @nhắc | P1 | S |
| E3 | Chat riêng và nhóm tự tạo | ✅ truyền âm 1-1 (Web Push khi offline) + nhóm chat tự tạo tới 20 người (25/09) | **P0** | M |
| E4 | Kênh liên server, threads, kênh phe | ⛔ liên server; ❌ threads / kênh phái trong giới (làm được) | P2 | M |
| E5 | Chia sẻ toạ độ/chiến báo/tướng; sửa, thu hồi tin | ✅ chia sẻ toạ độ, chiến báo (nút tới / xem trận), thẻ trưởng lão (`#tl:`), trả lời, thu hồi tin trong hạn; chưa sửa tin | **P0** | M |
| E6 | Thư người chơi/thư minh/báo cáo do thám | ✅ thư minh (R4/R5 → hộp thư cả minh, 25/09); truyền âm thay thư 1-1; báo cáo do thám qua thư; chưa xoá / yêu thích thư | P1 | M |
| F1 | Gửi tài nguyên (Trading Post) | ✅ Vận Linh Trận (25/09): hao tổn 35 → 8 %, trần ngày theo sức chứa kho hai bên | P2 | S–M |
| G1 | Hồ sơ người chơi | ✅ hồ sơ chưởng môn (từ chat, minh, bản đồ, chân dung): truyền âm, chặn, mời, tiếp tế | P1 | M |
| G2 | Bảng xếp hạng | ✅ 6 bảng (có chiến công) + mùa + Công Huân + phong thần; thiếu bảng riêng cho minh | P2 | S |
| G3 | Bạn bè và chặn | ✅ chặn + kết giao đạo hữu (25/09) | P2 | S–M |
| G4 | Báo vương quốc | 🟡 có biên niên giới | P2 | S |
| H1 | Vua và Lost Temple | ✅ Giới Chủ (minh chủ giữ Thiên Môn) | P1 | M |
| H2 | Title vương quốc buff/debuff | ✅ sắc phong 4 phúc / 4 hoạ, giữ 24 giờ | P1 | M |
| H3 | Buff vương quốc, quà của vua | ✅ ban phúc cả giới mỗi ngày + Thiên Ân lễ | P2 | S |
| H4 | Kỹ năng vua, Vacation Permit, quản lý nhập cư | 🟡 Bế Quan Lệnh (`sect/seclude.ts`); chưa có kỹ năng vua / nhập cư | P2 (P1 cho Bế Quan) | M |
| H5 | NAP, luật cộng đồng → minh ước | ✅ minh ước bất xâm phạm (đề nghị / nhận / huỷ) | P1 | S–M |
| H6 | Di cư, bảng tuyển mộ | ⛔ di cư; bảng tuyển trong giới làm được | P2 | S |
| H7 | Bảo vệ và dịch chuyển tân thủ | ✅ khiên 72 giờ, PvP từ tầng 6, sàn lực chiến 50% | — | — |
| I1 | Điều kiện tấn công thành | ✅ | — | — |
| I2 | Khiên chủ động, War Frenzy | ✅ Hộ Sơn Phù 8–72 giờ + sát khí 30 phút | P1 | S |
| I3 | Đốt thành, độ bền tường, dời thành | ✅ Linh hỏa thiêu sơn: trận lực Hộ Sơn Đại Trận, thua thì núi cháy, về 0 thì bị đánh bật đi | P2 | M |
| I4 | Cướp tài nguyên và kho bảo hộ | ✅ | — | — |
| I5 | Do thám, chống do thám | ✅ Do thám bằng linh điểu (`world/spy.ts`): báo cáo tài nguyên / viện binh / trận lực, bên kia được báo; chưa có chống do thám | P1 | S–M |
| I6 | Cảnh báo bị tấn công | ✅ Tháp canh: thẻ son mọi tab + Web Push khi địch xuất quân | **P0** | S |
| I7 | Phản công, phản kết trận | ✅ báo thù 24 giờ; thiếu phản kết trận | P2 | M |
| I8 | Thương nặng/tử trận, bệnh viện | ✅ Đan phòng | — | — |
| I9 | Zeroing | ⛔ chủ ý chặn | — | — |
| I10 | Acc phụ nuôi acc chính | ⛔ chủ ý chặn | — | — |
| I11 | Kill points, honor, lực chiến | ✅ chiến công (bảng xếp hạng), Công Huân, lực chiến, Elo | P1 | S |
| I12 | KvK, xếp hạng vương quốc | ⛔ thay bằng mùa 49 ngày | — | — |
| J1 | Động viên liên minh (Mobilization) | ✅ Minh vụ đường | **P0** | M |
| J2 | Ark of Osiris, Osiris League (khán giả, cược) | 🟡 Luận Kiếm Minh Chiến + Tranh Đoạt Linh Châu giản lược + bảng giải mùa; chưa có khán giả / cược | P1 | L |
| J3 | Karuak Ceremony / Trial | ✅ Thí Luyện Yêu Hoàng; thiếu nhờ minh giúp | P2 | S |
| J4 | Ceroli Crisis/Assault (tổ đội PvE) | ✅ Man Hoang Cổ Tộc (tổ 4 người trong minh, 3 vai, 5 độ khó); chưa có bản 12 người | P2 | L |
| J5 | Shadow Legion (ma triều công sơn) | ✅ Ma Triều Công Sơn (5 đợt tối thứ Tư) | P1 | M |
| J6 | Canyon Clash / Sunset Canyon | ✅ Luận Kiếm Minh Chiến + Luận Kiếm Đài | P2 | M |
| J7 | Champions of Olympia 5v5 | ⛔ thời gian thực | — | — |
| J8 | Đố vui minh, Ascension, tiệc lễ | ✅ Luận Đạo Vấn Đáp (đố cả minh cùng lúc, mốc điểm minh) + Vấn Đạo Đài (đố một mình); chưa có tiệc lễ | P2 | S–M |
| J9 | Kết trận pháo đài hằng ngày (tạo quà minh) | ✅ yêu trại cấp 1 (hồi 8 giờ) → Minh lễ cả minh | **P0** | S–M |
| J10 | MGE | ✅ Tông Môn Tranh Bá (6 ải, bảng từng ải + cả lượt) | P2 | S |
| K1 | Lịch minh, đăng ký, phân vai officer | ✅ Minh sự lịch (`world/plans.ts`) + ghi danh minh chiến / ma triều, chức vị đường chủ | P1 | S |
| K2 | Địa vị, danh hiệu, tag | ✅ tag ở bảng mùa / lãnh thổ và trước tên trong chat ("[TAG] Tên"), bậc R, chức vị, tước và danh hiệu mùa trên hồ sơ | P2 | S |

**Gợi ý thứ tự làm (P0, rẻ trước):**
1. D3 đánh dấu bản đồ + I6 cảnh báo khi có đội nhắm vào mình (S).
2. E5 chia sẻ toạ độ và chiến báo vào chat, E3 truyền âm 1-1 (M).
3. B2 minh lễ + J9 yêu trại hằng ngày (M).
4. J1 minh vụ đường (M).
5. B3 và B4 hộ minh đại trận + cống hiến + Cống Hiến Các (L).

Tiếp theo là nhóm P1 rẻ: A3, A5, A7, B1 (thưởng người giúp), I2, I11, K1, H5.

---

## 4. Nguồn

**Liên minh: tổng quan, cấp bậc, chức vị, công nghệ, quà**
- https://medievalfun.com/rise-of-kingdoms-alliance-guide/
- https://www.ldshop.gg/blog/rise-of-kingdoms/alliance-giude.html
- https://www.bluestacks.com/blog/game-guides/rise-of-kingdoms/rok-ultimate-alliance-guide-en.html
- https://riseofkingdomsguides.com/rise-of-kingdoms-alliance-faq
- https://theriagames.com/guide/rise-of-kingdoms-alliance-center-guide/
- https://www.gamesguideinfo.com/rise-of-kingdoms/building/120000300-Alliance-Center
- https://www.topuplive.com/news/rise-of-kingdoms-alliance-technology-guide.html
- https://heaven-guardian.com/rise-of-kingdoms-earn-spend-alliance-individual-credits/
- https://riseofkingdomsguides.com/how-to-get-alliance-and-individual-credits-in-rise-of-kingdoms/
- https://heaven-guardian.com/rise-of-kingdoms-avoid-scams-boost-your-alliance-safely/
- Fandom (chỉ qua tóm tắt tìm kiếm, không đọc trực tiếp được): https://riseofkingdoms.fandom.com/wiki/Alliance_Gift · https://riseofkingdoms.fandom.com/wiki/Alliance_Technology · https://riseofkingdoms.fandom.com/wiki/Alliance_Technology/Great_Alliance_II · https://riseofkingdoms.fandom.com/wiki/Territory · https://riseofkingdoms.fandom.com/wiki/Holy_Sites

**Lãnh thổ**
- https://heaven-guardian.com/rise-of-kingdoms-alliance-guide-territory-flags-forts/
- https://riseofkingdomsguides.com/rise-of-kingdoms-alliance-territory-guide/
- https://riseofkingdomshandbook.com/guides/riseofkingdoms-alliance-territory-flags
- https://riseofkingdomsguides.com/rise-of-kingdoms-zones-guide/
- https://riseofkingdomsguides.com/farming-gathering-guide/
- https://riseofkingdomsguides.com/how-to-teleport-in-rise-of-kingdoms/

**Trao đổi, công trình, PvP**
- https://riseofkingdomsguides.com/trading-post/
- https://heaven-guardian.com/rise-of-kingdoms-trading-post-guide-level-up-dominate/
- https://www.gamesguideinfo.com/rise-of-kingdoms/building/120000309-Trading-Post
- https://www.gamesguideinfo.com/rise-of-kingdoms/building/120000298-Storehouse
- https://www.gamesguideinfo.com/rise-of-kingdoms/building/120000304-Castle
- https://www.gamesguideinfo.com/rise-of-kingdoms/building/120000305-Scout-Camp
- https://riseofkingdomsguides.com/storehouse/
- https://riseofkingdomsguides.com/wall/
- https://riseofkingdomsguides.com/watchtower/
- https://riseofkingdomsguides.com/hospital/
- https://riseofkingdomsguides.com/rise-of-kingdoms-attacking-cities-and-flags-guide/
- https://heaven-guardian.com/rok-conquer-cities-flags-attack-guide-tips/
- https://heaven-guardian.com/rise-of-kingdoms-troop-capacity-march-queue-guide/
- https://riseofkingdomsguides.com/rise-of-kingdoms-farm-account/
- https://riseofkingdomsguides.com/courier-station/

**Chính trị vương quốc, di cư**
- https://heaven-guardian.com/rise-of-kingdoms-titles-guide-to-maximize-your-buffs/
- https://riseofkingdomsguides.com/how-to-use-title-buffs-guide/
- https://www.allclash.com/titles-in-rise-of-kingdoms-how-to-handle-use-them/
- https://www.catatandroid.com/2020/10/cara-request-title-buff-duke-scientist-architect.html
- https://heaven-guardian.com/rok-migration-guide-2026/
- https://riseofkingdomsguides.com/rise-of-kingdoms-jumper-guide/
- https://riseofkingdomsguides.com/get-kingdom-newspaper/

**Sự kiện**
- https://riseofkingdomsguides.com/alliance-mobilization-event-guide/
- https://heaven-guardian.com/ark-of-osiris-guide-dominate-rise-of-kingdoms/
- https://riseofkingdomsguides.com/ark-of-osiris-guide-and-strategy/
- https://riseofkingdomsguides.com/rise-of-kingdoms-osiris-league-betting-guide/
- https://riseofkingdomsguides.com/the-trial-of-kau-karuak-event-guide/
- https://heaven-guardian.com/rise-of-kingdoms-ceroli-crisis-guide-boss-tips/
- https://heaven-guardian.com/rise-of-kingdoms-events-dominate-with-this-guide/
- https://riseofkingdomsguides.com/champions-of-olympia-guide-in-rok/
- https://riseofkingdomsguides.com/the-mightiest-governor-event/
- https://riseofkingdomsguides.com/rise-of-kingdoms-barbarians-and-barbarian-forts/
- https://riseofkingdomsguides.com/alliance-quiz-event-answers/
- https://riseofkingdomsguides.com/the-lost-kingdom-kvk-guide/
- https://riseofkingdomsguides.com/rise-of-kingdoms-review/

**Patch note (tóm tắt của riseofkingdomsguides)**
- 1.0.71 (07/2023): https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-71ode-to-greece-update/
- 1.0.74 (09/2023): https://riseofkingdomsguides.com/1-0-74-anniversary-festivities-update/
- 1.0.75: https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-75-grand-prix-update/
- 1.0.76: https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-76-tides-of-war-update/
- 1.0.77: https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-77-winters-tale-update/
- 1.0.78: https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-78-live-loong-and-prosper-update/
- 1.0.79: https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-79-surging-spring-update/
- 1.0.80: https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-80-easter-elation-update/
- 1.0.81: https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-81-unearthing-history-update/
- 1.0.82: https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-82-dragon-boat-bash-update/
- 1.0.83 (06/2024): https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-83-eternal-city-update/
- 1.0.84 (07/2024): https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-84-magpies-song-update/
- 1.0.85 (08/2024): https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-85-poised-for-battle-update/
- 1.0.86: https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-86-anchors-aweigh-update/
- 1.0.87 (10/2024): https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-87-rex-totius-britanniae-update/
- 1.0.88 (11/2024): https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-88-giving-thanks-update/
- 1.0.89 (12/2024): https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-89-sleigh-all-day-update/

**Bản Việt (bối cảnh thị trường)**
- https://heaven-guardian.com/gamota-rok-vietnamese-rise-of-kingdoms/
