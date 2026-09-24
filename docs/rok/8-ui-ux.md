# 8 · UI/UX của Rise of Kingdoms và so với Sơn Hà Tiên Tông

> Cập nhật 2026-09-24. Đi kèm [UX.md](../UX.md) (hệ thiết kế, luồng màn hình của game mình).
> Mục đích: biết RoK làm giao diện thế nào để người chơi thấy "rõ, sướng", rồi quyết định game mình lấy gì, bỏ gì, đổi gì cho hợp màn hình dọc và phong cách thủy mặc / giấy bồi lụa.

## 0. Cách đọc và giới hạn nguồn

**Ký hiệu**

- `✔[n]`: có nguồn, số trỏ tới mục 5. Nguồn được viết lại bằng lời mình, không chép.
- **(chưa xác minh)**: theo hiểu biết chung về RoK, **chưa** tìm được nguồn đọc được trong phiên này. Coi là giả thuyết, cần kiểm lại bằng cách chơi RoK thật (danh sách cần kiểm ở cuối mục 1).
- Game mình: ✅ có · 🟡 có một phần (ghi thiếu gì) · ❌ chưa có · — không cần (khác thiết kế).
- Ưu tiên: **P0** làm ngay (ảnh hưởng thẳng tới "rõ ràng" hoặc vòng chơi cốt lõi) · **P1** nên có trước khi mở rộng người chơi · **P2** để sau.
- Công sức: **S** ≤ 1 ngày · **M** 2–5 ngày · **L** hơn 1 tuần.

**Giới hạn của lần nghiên cứu này** (ghi rõ để khỏi hiểu nhầm độ chắc chắn):

- rok.guide trả lỗi 503 và riseofkingdoms.fandom.com trả lỗi 402 với công cụ đọc web, còn reddit thì bị chặn hẳn. Từ ba nơi này chỉ có **đoạn trích trong kết quả tìm kiếm** ([41], [42]), không đọc được trang đầy đủ.
- Hạn mức tìm kiếm web của phiên đã hết giữa chừng. Phần sau chỉ đọc được những trang có sẵn đường dẫn.
- Nguồn tốt nhất đọc được là **ghi chú các bản cập nhật 1.0.77 → 1.0.94 và bản kỷ niệm 7 năm (12/2023 → 9/2025)** [9]–[25], cùng hai bài phân tích sản phẩm [1], [2]. Nhờ vậy phần tiện lợi (QoL) và thay đổi gần đây có nguồn chắc. Riêng **vị trí từng nút trên HUD thành phố** thì phần lớn chưa xác minh được.
- Bản App Store hiện là 1.1.x (2026) [39], nhưng ghi chú phiên bản ít nói về UI. Những gì đổi sau 9/2025 có thể chưa có ở đây.
- **RoK chơi màn hình ngang trên điện thoại** (chưa xác minh bằng nguồn trong phiên, nhưng gần như chắc chắn). Game mình chơi **dọc 390×844**. Vì vậy mọi đề xuất "chuyển vị trí" bên dưới đều đã tính lại cho màn dọc.

---

## 1. Tóm tắt: triết lý UI/UX của RoK

**Thế giới là màn chính, UI là một lớp mỏng quanh mép.**

- RoK zoom liền mạch từ thành ra bản đồ, xoá cái đau của dòng game kiểu COK là phải chuyển giữa hai "trang" ✔[2].
- Quân được điều tự do trên bản đồ chứ không chỉ đi từ điểm tới điểm. Deconstructor of Fun coi đây là hệ bản đồ dễ chịu nhất dòng 4X ✔[1].
- HUD dồn ra bốn góc và hai mép, giữa màn để cho thế giới.

**Mỗi vùng HUD giữ một vai trò cố định, nên tay nhớ được** (vị trí cụ thể chưa xác minh hết):

- Góc trên trái: "tôi là ai": ảnh đại diện, VIP ✔[4], thanh điểm hành động ✔[5].
- Góc trên phải: kinh tế (tài nguyên, gem).
- Mép phải: những gì có hạn giờ (sự kiện, gói; chưa xác minh vị trí) và hàng đội quân đang ở ngoài ✔[15][27].
- Góc dưới phải: hệ thống cốt lõi. Hệ thống tướng được đưa hẳn ra đây thay vì giấu trong một công trình ✔[2].
- Góc dưới: nút chuyển thành ↔ bản đồ và dải chat (chưa xác minh góc).

**Màn nào cũng có "việc tiếp theo":**

- Nhiệm vụ có nút *Go* dẫn thẳng tới việc ✔[5].
- Biểu tượng hiện trên công trình khi có việc: bong bóng tài nguyên chuyển vàng khi đầy ✔[41], bàn tay giúp đỡ trên Alliance Center ✔[30], icon thương nhân trên Courier Station ✔[34].
- Chấm đỏ báo việc còn làm được ✔[22].

**Cắt thao tác lặp liên tục qua từng bản vá.** Các bản 2024–2025 dồn rất nhiều vào đây:

- bù tài nguyên thiếu một chạm (*Quick Replenish*) ✔[19];
- *claim all* ở nhiều nơi ✔[21], nhận rương hàng loạt ✔[16];
- lưu đội quân kèm trang bị tới 45 bộ ✔[13];
- nút giúp nhanh nổi (có từ trước, không rõ bản nào) ✔[36];
- tự nộp nhiệm vụ liên minh sau 24 giờ ✔[24];
- quay ×50 ✔[21], du hành ×10 ✔[23];
- "không hỏi lại hôm nay" cho hộp xác nhận ✔[10].

**Thông tin xếp theo lớp, xem đến đâu mở đến đó:**

- Hầu như cửa sổ nào cũng có nút "i" giải thích ✔[41].
- Mô tả kỹ năng có bản gọn và bản đầy đủ, kèm video xem trước kỹ năng ✔[23].
- Chat có chú giải thuật ngữ như "MGE" ✔[20].
- Mọi chiến báo có phần đánh giá trận ✔[20].
- Trang tài năng cho thấy bao nhiêu phần trăm người chơi chọn mỗi ô ✔[20].

**Khoảnh khắc lớn được dàn dựng:** hiệu ứng khi nhận tướng mới được làm lại ✔[9], thẻ trang bị lộ ra bằng cú vuốt ✔[17], màn mở rương trang bị được tối ưu ✔[12].

**Lịch sự kiện:** RoK là một trong những game di động đầu tiên có lịch sự kiện trong game. Người chơi biết trước sự kiện nào sắp tới để lên kế hoạch ✔[1].

**Sửa chi tiết nhỏ theo phản hồi người chơi**, ví dụ:

- đường hành quân vẽ mảnh lại cho đỡ che bản đồ ✔[23][24];
- bong bóng "về thành" dời sát mép cho đỡ bấm nhầm, và tắt được ✔[11];
- chạm một lần (thay vì giữ) để mở bong bóng thao tác trên bản đồ ✔[21];
- tướng đứng trong thành thu nhỏ bong bóng thoại để không che công trình ✔[19].

**Mặt trái, đừng chép:**

- Nhiều nguồn chê UI RoK nặng tính bán hàng: một nguồn gọi là "conversion-oriented" ✔[7], Wikipedia dẫn lời chê hệ VIP rối ✔[40].
- Chơi RoK chủ yếu qua các lớp menu ✔[29]; nhảy tới đúng chỗ trên bản đồ còn bất tiện, bản đồ nhỏ từng không đánh dấu nơi đang đánh ✔[2]. Về sau có bản đồ nhiệt và danh sách trận ✔[19][21].
- Cột icon sự kiện và gói ưu đãi dễ thành bãi rác (chưa xác minh số lượng, nhưng đây là nhận xét phổ biến về dòng game này).

**Vì sao người chơi thấy "rõ, sướng" (rút lại):**

1. Chỗ nào cũng ở đúng chỗ cũ.
2. Chữ số to, đậm, luôn nằm trên một tấm nền riêng, không đè lên tranh.
3. Màu mang nghĩa ổn định: đủ / thiếu / sẵn sàng.
4. Một chạm là tới nơi cần làm (*Go*, huy hiệu, icon trên công trình).
5. Hành động nào cũng có phản hồi ngay: âm thanh, hoạt ảnh, số bay (chưa xác minh chi tiết).
6. Việc lặp được gom lại (tất cả / nhanh / preset).
7. Có "sân khấu" cho những lúc đáng mừng.

Game mình đã có 3, 4, 5, 7 khá tốt (xem mục 2). Thiếu nhiều nhất ở 6 và ở chỗ **đưa thông tin ra ngoài núi trên điện thoại** (hàng đợi, đội, chat, sự kiện).

**Việc nên kiểm tra khi có máy chơi RoK thật** (các ý "chưa xác minh" quan trọng):

1. Góc nào có nút chuyển thành ↔ bản đồ.
2. Thứ tự các nút menu dưới.
3. Hàng đợi xây / nghiên cứu / huấn luyện hiện ở đâu và báo "rảnh" ra sao.
4. Chạm công trình thì nút xếp thành vòng hay thành hàng.
5. Cửa sổ tăng tốc có nút "dùng nhanh" tự chọn vật phẩm không.
6. Hiệu ứng "power +" khi xong việc.
7. Cảnh báo bị tấn công: viền màn đỏ, còi.
8. Nhân vật cố vấn và ngón tay trong phần hướng dẫn đầu game.
9. Các thẻ trong hộp thư.
10. Chat có dịch tự động không.

---

## 2. Danh mục chi tiết

Tên RoK viết theo tiếng Anh trong game. Mỗi mục gồm: RoK làm gì · cách tu tiên hoá · game mình đang ở đâu · ưu tiên và công sức.

### A. HUD thành phố (theo vị trí)

#### A1 · Governor Avatar: ảnh đại diện, góc trên trái

- **Governor Avatar**:
  - Ảnh đại diện tròn ở góc trên trái. Chạm vào mở Hồ sơ thống đốc, từ đó vào Cài đặt và Quản lý nhân vật ✔[41].
  - Khung ảnh lấy từ sự kiện ✔[3].
  - Gần ảnh có cấp VIP ✔[4], và thanh xanh điểm hành động nằm dưới tên ✔[5].
  - *Vì sao hiệu quả:* một điểm neo cho mọi thứ "về tôi". Người chơi không phải nhớ hồ sơ, thành tích, cài đặt nằm ở đâu.
- **Tu tiên hoá:**
  - Chân dung chưởng môn trong đĩa khung vàng vẽ tay (đã có), vòng lục khoáng khi đang có khiên (đã có).
  - Chạm → **Hồ sơ chưởng môn** (cuộn tranh). Nội dung: tên, cảnh giới, thế lực và nguồn thế lực, thành tích (đang nằm trong Bảo khố), kiếp luân hồi, xếp hạng, và lối sang Cài đặt / Cẩm nang.
- **Game mình:** 🟡
  - Có chân dung, tên tông môn, cảnh giới · tầng, vòng khiên và icon khiên có đồng hồ (`Hud.svelte`).
  - Chạm chân dung lại nhảy thẳng vào **Xếp hạng**, không có hồ sơ. Số liệu cá nhân (thắng, thua, đã tuyển, đã chữa…) nằm tận Bảo khố.
- **Ưu tiên:** P1 · **Công sức:** S (ghép lại Ranks + phần thành tích của Vault)

#### A2 · Power: con số sức mạnh

- **Power**:
  - Tổng sức mạnh từ quân, công trình, công nghệ, tự cập nhật. Hồ sơ còn ghi mức sức mạnh cao nhất, số địch hạ theo bậc, số trận thắng / thua ✔[3].
  - Số nằm cạnh ảnh đại diện (chưa xác minh vị trí chính xác). Có hiệu ứng "power +" khi xong việc (chưa xác minh).
  - *Vì sao hiệu quả:* một con số tổng hợp cho mọi nỗ lực. Mỗi lần nó tăng là một phần thưởng nhỏ.
- **Tu tiên hoá:**
  - Ô "Thế lực" (đã có). Khi tăng thì một nét "+128" màu vàng lá viền mực bay lên từ ô, kèm tiếng gõ nhẹ.
  - Chạm → bảng nhỏ tách nguồn: công trình / đệ tử / công pháp / trưởng lão / pháp bảo, và một dòng "tăng nhanh nhất: nâng Linh điền (+40)" có nút *Đi tới*.
- **Game mình:** 🟡
  - Số chạy mượt khi đổi (Tween 700 ms).
  - Không chạm được (chỉ là `span`), không tách nguồn, không có "+N" bay.
- **Ưu tiên:** P1 · **Công sức:** S

#### A3 · VIP Badge và rương hằng ngày

- **VIP Badge**:
  - Cấp VIP hiện ở góc trên trái. Chạm vào để nhận quà hằng ngày: điểm VIP miễn phí mỗi 24 giờ, rương miễn phí mỗi ngày ✔[4].
  - Hệ VIP bị chê là rối ✔[40].
  - *Vì sao hiệu quả:* lý do để mở game mỗi ngày, gắn với một chỗ cố định.
- **Tu tiên hoá:**
  - Không làm VIP trả phí. Thay bằng **"Điểm danh sơn môn" / "Linh mạch hằng ngày"**: đăng nhập nhận một túi nhỏ, chuỗi 7 ngày thì ngày thứ 7 thưởng lớn hơn.
  - Nút là một đĩa ở cột phải, có giọt son khi chưa nhận. Nên nhận ngay trong màn Xuất quan cho gọn.
- **Game mình:** ❌. Có Xuất quan và nhiệm vụ ngày, chưa có điểm danh.
- **Ưu tiên:** P2 · **Công sức:** S

#### A4 · Action Points: điểm hành động

- **Action Points**:
  - Thanh xanh dưới tên. Dùng để đánh mục tiêu trung lập (man rợ), trần 1000, nâng được theo VIP, hồi theo thời gian ✔[3][5].
  - *Vì sao hiệu quả:* giới hạn PvE được hiện ra ngay, người chơi biết còn đánh được bao nhiêu.
- **Tu tiên hoá:** "Chân nguyên", nếu sau này muốn giới hạn số trận PvE bằng điểm. Hiện game mình giới hạn bằng thời gian hồi của mục tiêu ("có lại sau") và số đội, nên chưa cần.
- **Game mình:** —. Không áp dụng với thiết kế hiện tại.
- **Ưu tiên:** P2 (chỉ khi thêm cơ chế) · **Công sức:** S

#### A5 · City Buffs: dải hiệu ứng đang hưởng

- **City Buffs**:
  - Các biểu tượng buff đang chạy (khiên hoà bình, tăng tốc…). Vị trí cụ thể chưa xác minh.
  - Bản 1.0.81 sắp xếp lại trang tổng quan buff theo loại buff và loại quân ✔[13].
  - *Vì sao hiệu quả:* người chơi thấy ngay mình đang được bảo vệ / tăng gì và còn bao lâu. Nhờ vậy họ không lỡ tay phá khiên hay lãng phí buff.
- **Tu tiên hoá:**
  - Một hàng huy hiệu nhỏ (18–22 px) sát dưới chân dung: khiên bảo hộ, Ngưng Thần Đan đang có hiệu lực, sự kiện cuối tuần…
  - Chạm → bảng "Đang hưởng" có đồng hồ từng dòng.
- **Game mình:** 🟡
  - Khiên có (vòng xanh + icon, đồng hồ trong `title`).
  - Buff đan chỉ thấy ở Bảo khố. Nhãn "Cuối tuần" nằm dưới nút nhiệm vụ ngày.
  - `title` không hiện trên điện thoại, nên người chơi di động không đọc được thời gian khiên.
- **Ưu tiên:** P1 · **Công sức:** S

#### A6 · Resource Bar: thanh tài nguyên

- **Resource Bar**:
  - Các ô lương thực, gỗ, đá, vàng (vàng mở muộn) ở phía trên bên phải (chưa xác minh chi tiết vị trí).
  - Chạm ô thì mở bảng tài nguyên có vật phẩm để dùng (chưa xác minh).
  - Kho (Storehouse) giữ một phần không bị cướp. Tài nguyên còn ở dạng vật phẩm trong túi thì luôn an toàn ✔[32].
  - Dùng gói tài nguyên làm vượt ngưỡng bảo vệ thì game cảnh báo ✔[26] (bản 1.0.39, nhiều khả năng năm 2020: cũ).
  - Túi đồ có thống kê tổng tài nguyên / tăng tốc đang giữ ✔[21].
  - *Vì sao hiệu quả:* con số luôn trước mắt. Chạm là biết cách có thêm, không phải đi tìm.
- **Tu tiên hoá:**
  - Ba viên giấy như hiện tại. Thanh sức chứa dưới số là điểm **hay hơn RoK**, nên giữ.
  - Chạm một viên → bảng "Linh thạch" gồm:
    - có / sức chứa, và bao lâu nữa thì đầy kho;
    - sản lượng mỗi giờ theo từng công trình, có nút *Đi tới*;
    - nguồn thêm: đổi ở Thương hội (1 chạm), nhiệm vụ đang cho loại này, sự kiện.
- **Game mình:** 🟡
  - Hiển thị tốt: số chạy, thanh sức chứa, số đỏ kèm nhãn "Đầy", "+N" bay khi nhận, icon bay vào đúng ô (`ui/fly.ts`).
  - Nhưng **chạm vào không làm gì**. Sản lượng mỗi giờ và sức chứa chỉ nằm trong `title`, tức chỉ desktop rê chuột mới thấy.
- **Ưu tiên:** P0 · **Công sức:** S

#### A7 · Gems: tiền cao cấp và nút "+"

- **Gems**:
  - Tiền cao cấp, có nút "+" dẫn vào cửa hàng (chưa xác minh vị trí). Đổi tên tốn 500 gems ✔[3]. Hoàn thành ngay bằng gems ✔[33].
  - Giao diện gói ưu đãi dạng vuốt trái / phải được khen, sau này nhiều game SLG chép theo ✔[2].
- **Tu tiên hoá:**
  - Nếu có tiền cao cấp (ví dụ "Tiên ngọc") thì đặt cuối hàng tài nguyên, nhỏ hơn, **không nhấp nháy, không chen vào luồng chính**.
  - Cửa hàng vào từ cột phải hoặc từ hồ sơ.
- **Game mình:** ❌. Chưa có kinh tế trả phí, tuỳ kế hoạch kinh doanh.
- **Ưu tiên:** P2 · **Công sức:** M–L

#### A8 · Event và Offer Column: cột sự kiện bên phải

- **Event & Offer Column**:
  - Cột icon bên phải: sự kiện (có lịch sự kiện ✔[1]), gói ưu đãi, v.v. Hình dáng, số icon, đồng hồ trên icon chưa xác minh.
  - Trang sự kiện có thanh bên liệt kê sự kiện, được chỉnh lại luật hiển thị ở 1.0.77 ✔[9].
  - Mô tả sự kiện được viết lại cho dễ đọc ✔[15].
  - Trang *Campaign* hiện điều kiện mở, phần thưởng chính và tiến độ của từng chế độ ✔[20].
  - *Vì sao hiệu quả:* mọi thứ có hạn giờ nằm một chỗ cố định. Lịch giúp người chơi lên kế hoạch dùng tài nguyên, tăng tốc.
- **Tu tiên hoá:**
  - Cột phải tối đa **3 đĩa lụa**:
    - **Sự kiện**: lịch tuần kiểu "Hoàng lịch", sự kiện tuần, cuối tuần, mùa của giới;
    - **Nhiệm vụ ngày** (đã có);
    - **Quà**: thư có quà, điểm danh.
  - Giọt son báo có thưởng. Chữ đồng hồ nhỏ chỉ hiện khi còn dưới 24 giờ.
  - Không bao giờ quá 3 đĩa. Thêm thứ mới thì gộp vào trang Sự kiện.
- **Game mình:** 🟡
  - Chỉ có nút Nhiệm vụ ngày. Bảng của nó gộp cả ngày, tuần, sự kiện tuần với các mốc, cộng nhãn "Cuối tuần" (`Daily.svelte`).
  - Không có lịch, không biết tuần sau có gì.
- **Ưu tiên:** P1 · **Công sức:** M

#### A9 · Troop Dispatch Queue: hàng đội quân ở mép phải

- **Troop Dispatch Queue**:
  - Hàng icon các đội đang ở ngoài, đặt ở mép phải màn hình ✔[15][27].
  - 1.0.83 cho hiện nhiều icon hơn, thêm tuỳ chọn hiện đủ 7 đội cùng lúc, icon tự co ✔[15].
  - Chạm đúp ảnh một đội để chọn cả đội ✔[27].
  - Có tuỳ chọn chống xuất quân nhầm ✔[42]. Trạng thái (đi, thu thập, về) hiện bằng hình (chưa xác minh).
  - *Vì sao hiệu quả:* đội nào rảnh, đội nào sắp về luôn thấy được, ở cả trong thành lẫn trên bản đồ.
- **Tu tiên hoá:**
  - Trên điện thoại: mỗi đội là một "chip" trong dải *Đang diễn ra* bên trái (xem A11). Chip gồm chân dung trưởng lão, cờ nhỏ chỉ trạng thái (đi / đánh / khai thác / về), đồng hồ.
  - Chạm chip → sang bản đồ, camera tới đội.
  - Đội về tới nơi → cờ cắm xuống kèm "+chiến lợi phẩm".
- **Game mình:** 🟡
  - Danh sách đội chỉ có ở tab Bản đồ: thẻ lụa, chân dung, trạng thái, đồng hồ, nút gọi về (`MapView.svelte`).
  - Desktop có trong mục "Đang diễn ra". Điện thoại ở tab Tông môn thì **không thấy đội**.
- **Ưu tiên:** P1 · **Công sức:** S (làm chung với A11)

#### A10 · Quest Tracker: nhiệm vụ đề xuất

- **Quest Tracker**:
  - Nhiệm vụ có nút *Go* để đi tới việc ✔[5]. Có tuyến nhiệm vụ chính dẫn từ phần hướng dẫn, thưởng lớn dần, và nhiệm vụ phụ ✔[41].
  - Một đoạn trích wiki nói bảng nhiệm vụ nằm bên trái, việc xong hiện hộp quà ✔[41]. Có thể đoạn đó tả bảng của một sự kiện, **chưa xác minh** là HUD chính.
  - *Vì sao hiệu quả:* người mới không phải nghĩ "làm gì tiếp". Một chạm là tới đúng công trình.
- **Tu tiên hoá:**
  - Thẻ giấy nhiệm vụ (đã có). Thêm tên chương cho có mạch truyện ("Chương 1: Dựng lại sơn môn", "Chương 2: Mở cửa núi"…).
  - Cho thu gọn còn một dòng khi người chơi đã quen (ví dụ sau Chủ điện tầng 6).
- **Game mình:** ✅
  - Thẻ nhiệm vụ có tiến độ x/y, phần thưởng, mũi tên *đi*. `goQuest` dẫn tới công trình / thẻ chức năng / mục tiêu bản đồ.
  - Xong thì thẻ ánh vàng với nhãn "Nhận thưởng". Nhận thì dấu son đóng, icon bay, nhiệm vụ mới trượt vào.
  - Chỉ hiện ở tab Tông môn. Chưa có chương.
- **Ưu tiên:** P2 (chương, thu gọn) · **Công sức:** S

#### A11 · Task Queues: hàng đợi việc đang chạy

- **Task Queues**:
  - Chỉ báo các hàng xây, nghiên cứu, huấn luyện, chữa, báo khi hàng nào rảnh (chưa xác minh hình thức và vị trí).
  - Thợ thứ hai tạm thời có qua vật phẩm *Builders Recruitment* ✔[5].
  - *Vì sao hiệu quả:* hàng rảnh là lãng phí. Các hướng dẫn tân thủ RoK đều dặn giữ xây, huấn luyện, nghiên cứu luôn chạy (đoạn trích tìm kiếm tổng hợp, không rõ trang gốc: chưa xác minh nguồn cụ thể).
- **Tu tiên hoá:**
  - Dải **"Đang diễn ra"** ở mép trái điện thoại, dưới thẻ nhiệm vụ. Mỗi việc là một chip giấy 32 px: icon + đồng hồ.
  - Việc gồm: tuyển, lĩnh ngộ, luyện đan / chữa thương, luyện khí, đội.
  - Chip rảnh đổi sang nền son với chữ "Rảnh", nhún nhẹ. Tối đa một chip nhún cùng lúc.
  - Chạm chip → `focus(công trình, thẻ)` như cột trái desktop đang làm.
  - Việc xây đã có nút Tạp dịch lớn nên không lặp trong dải.
  - Màn thấp: dải gộp thành một chip "3 việc · 1 rảnh ▾".
- **Game mình:** 🟡
  - Desktop có đủ: mục "Đang diễn ra" liệt kê mọi việc kèm đồng hồ, bấm là mở đúng công trình (`Hud.svelte`, `runs`).
  - **Điện thoại thì CSS ẩn mục này** (`.runs { display: none }`). Chỉ còn nút Tạp dịch (việc xây) và bong bóng trên từng công trình, phải cuộn núi mới thấy.
  - Người chơi dọc không biết Diễn võ trường đã tuyển xong hay Tàng Kinh Các đang rảnh nếu công trình nằm ngoài khung.
- **Ưu tiên:** **P0** · **Công sức:** M

#### A12 · Main Menu: cụm nút hệ thống ở dưới

- **Main Menu**:
  - Cụm nút hệ thống ở góc dưới phải. Phân tích GameRes nêu RoK đưa hệ thống tướng ra thẳng góc dưới phải màn chính ✔[2]. *Campaign* cũng là một mục menu ✔[28].
  - Các mục Items / Alliance / Mail và thứ tự: chưa xác minh.
  - *Vì sao hiệu quả:* hệ thống cốt lõi cách một chạm, không phải nhớ công trình nào chứa nó.
- **Tu tiên hoá:** thanh 5 tab dưới (đã có) hợp màn dọc hơn cụm nút góc: ngón cái với tới, nhãn đọc được.
- **Game mình:** ✅
  - 5 tab: Tông môn, Môn hạ, Bản đồ, Tiên minh, Bảo khố. Icon vẽ tay, tab đang mở nhô lên.
  - Tab khoá ghi "Tầng N".
  - Huy hiệu: số chiến báo chưa đọc ở Bản đồ, chấm son ở Môn hạ khi có thương binh chưa chữa, "!" vàng ở tab mới mở mà chưa ghé.
  - Desktop: phím 1–5.
- **Ưu tiên:** — · **Công sức:** —

#### A13 · Build Menu: danh sách công trình để xây

- **Build Menu**:
  - Nút búa mở danh sách công trình để đặt mới, chia thẻ Kinh tế / Quân sự / Trang trí ✔[30]. Nguồn này nói nút ở góc dưới trái, chưa đối chiếu được.
  - Có công cụ sắp xếp thành phố và nền tảng chia sẻ bố cục thành (*Cityscape*) ✔[15]. Bố cục lưu / chép / bật được giúp đỡ công thao tác ✔[2].
- **Tu tiên hoá:** công trình của tông môn có chỗ cố định trên núi (bóng mờ + nút búa). Cách này rõ hơn cho người mới, không cần menu xây.
- **Game mình:** — (thiết kế khác, tốt hơn cho người mới).
- **Ưu tiên:** — · **Công sức:** —

#### A14 · City/Map Toggle và zoom liền mạch

- **City/Map Toggle & Seamless Zoom**:
  - Zoom vô cấp nối thành với bản đồ ✔[2]. Nút chuyển nằm ở một góc dưới (chưa xác minh góc nào).
  - Trên bản đồ có nút về thành. Giữ lâu nút này thì mở vòng chọn mức zoom định sẵn ✔[20].
  - Bong bóng "về thành" hiện khi camera đi xa, được dời sát mép cho đỡ bấm nhầm và tắt được ✔[11].
  - 1.0.94 thêm tuỳ chọn thay nút *Search* bằng nút về thành nhanh khi đang chọn quân ✔[24].
  - Thu nhỏ hết cỡ thì có nút địa cầu góc dưới phải để xem danh sách vương quốc ✔[41].
  - *Vì sao hiệu quả:* không mất phương hướng. Luôn có đường về nhà một chạm.
- **Tu tiên hoá:**
  - Chuyển tab kèm vết mực loang (đã có).
  - Về sau: chụm hai ngón thu nhỏ trên núi → mây cuộn che → bản đồ vùng hiện ra, như thu một bức tranh cuộn.
  - Bản đồ Giới đã có nút "Về mình".
- **Game mình:** 🟡. Chuyển bằng tab với hiệu ứng mực. Không zoom liền mạch. Bản đồ Giới có "Về mình", bản đồ Vùng không cần.
- **Ưu tiên:** P2 · **Công sức:** L

#### A15 · Chat Bar: dải chat nổi

- **Chat Bar**:
  - Dải chat hiện tin mới, chạm mở cửa sổ chat (chưa xác minh vị trí và số dòng).
  - Tính năng chat đã có nguồn:
    - chia sẻ tướng, trang bị ✔[16], chiến báo ✔[14];
    - chạm thẻ đánh dấu (marker) trong chat để nhảy tới vị trí ✔[16];
    - quản trị viên ghim tin ✔[16];
    - kênh theo ngôn ngữ cho các vương quốc lân cận ✔[17];
    - chú giải thuật ngữ ✔[20];
    - chặn người bằng cách tìm tên / ID ✔[24].
  - *Vì sao hiệu quả:* cảm giác "có người khác đang sống ở đây" ngay trên màn chính, không phải mở menu.
- **Tu tiên hoá:**
  - "Truyền âm": một dải giấy mảnh 28 px nằm ngay trên thanh tab, **ở mọi tab**. Gồm dấu kênh (Giới / Minh), tên người, một dòng tin, số tin chưa đọc.
  - Chạm → Sheet chat (đã có).
  - Nên có nút ẩn cho ai muốn yên tĩnh.
- **Game mình:** 🟡. Có dải một dòng, kênh Giới / Minh, chặn, báo cáo (`Chat.svelte`). Nhưng **chỉ ở tab Bản đồ và Tiên minh**. Tab Tông môn là nơi người chơi ở lâu nhất thì không có.
- **Ưu tiên:** P1 · **Công sức:** S

#### A16 · Newspaper: tin toàn server

- **Newspaper**:
  - RoK có "báo" cho tin toàn server. Cài đặt có mục ẩn tin của chính mình trên báo ✔[42].
  - Tin chạy thành dải hay hiện ra sao: chưa xác minh.
  - *Vì sao hiệu quả:* tin người khác đạt mốc lớn tạo khát khao và cảm giác thế giới sống.
- **Tu tiên hoá:**
  - "Biên niên" (đã có trên bản đồ Giới). Thêm: tin lớn (ai đột phá Kim Đan, ai chiếm linh mạch, minh nào hạ yêu vương) chạy **một lần** như một nét mực quét ngang phía trên núi.
  - Tối đa 1 tin mỗi phút, tắt được trong Cài đặt. Chạm → mở Biên niên.
- **Game mình:** 🟡. Biên niên (dòng mới nhất, mở rộng 8 dòng) chỉ ở dải trên bản đồ Giới (`WorldView.svelte`).
- **Ưu tiên:** P2 · **Công sức:** S

#### A17 · Quick Help: nút giúp nhanh

- **Quick Help**:
  - Bật "Giúp nhanh" trong Cài đặt chung thì một nút hiện ở góc dưới phải. Chạm là giúp mọi thành viên đang xin ✔[36].
  - Mỗi lần giúp rút ngắn việc của người kia (theo nguồn: 1% tiến độ hiện tại, tối thiểu 1 phút) và cho điểm cá nhân, trần 10.000 mỗi ngày ✔[35].
  - *Vì sao hiệu quả:* việc xã hội mỗi ngày gói trong một chạm. Người chơi giúp nhau vì tiện, không cần mở menu liên minh.
- **Tu tiên hoá:**
  - Đĩa lụa hình **hai tay áo chắp quyền** nổi phía trên nút Tạp dịch khi có người xin, kèm giọt son ghi số.
  - Chạm → "Đã tương trợ 4 đồng môn", điểm cống hiến bay về, tiếng mõ.
  - Tự ẩn khi không còn ai xin.
- **Game mình:** 🟡. Có "Giúp tất cả (n)" và xin giúp từng việc, nhưng **chỉ trong trang Tiên minh** (`Alliance.svelte`).
- **Ưu tiên:** P1 · **Công sức:** S

#### A18 · Info Button và mô tả theo lớp

- **Info Button**:
  - Hầu như cửa sổ nào cũng có nút "i" giải thích ✔[41].
  - Kỹ năng tướng có bản mô tả gọn / đầy đủ bật tắt được ✔[23], kèm video xem trước ✔[23].
  - Chat có chú giải thuật ngữ ✔[20].
  - Từ 1.0.89 có mục *Gameplay Guides* (chiến đấu, điều khiển) vào từ hồ sơ ✔[21]. Sự kiện khó (Ceroli Crisis) có hướng dẫn chiến thuật dạng hoạt hình ✔[14].
  - *Vì sao hiệu quả:* người mới đọc gọn, người cũ xem sâu. Không nhồi chữ vào màn chính.
- **Tu tiên hoá:**
  - Nút **"?" hình dấu triện nhỏ** ở góc mỗi Sheet → mở đúng mục trong Cẩm nang (Cẩm nang đã lấy số từ `rules`, nên luôn đúng).
  - Công pháp: hai dòng mô tả gọn + "Xem đầy đủ".
- **Game mình:** 🟡. Có Cẩm nang 8 mục trong Cài đặt, lời dẫn nghiêng ở đầu mỗi bảng, "Nên dùng …" ở bảng mục tiêu. Chưa có "?" theo ngữ cảnh.
- **Ưu tiên:** P1 · **Công sức:** S

### B. Tương tác với công trình

#### B1 · Building Action Buttons: nút thao tác khi chạm công trình

- **Building Action Buttons**:
  - Chạm công trình thì hiện các nút thao tác (xếp vòng hay hàng: chưa xác minh). Ví dụ có nguồn:
    - Học viện có nút Nghiên cứu (lọ thuốc) mở cửa sổ công nghệ ✔[30];
    - Quán rượu có nút Tìm (kính lúp) để mở rương, góc phải trên có "i" xem tỉ lệ rơi ✔[30];
    - Toà thị chính có nút hình tháp để xem các kiểu dáng ✔[31], và nút biểu đồ xem chỉ số chi tiết ✔[6];
    - tăng tốc bằng nút **mũi tên đôi màu cam** ✔[41];
    - nút *Info* xem lợi ích nâng cấp ✔[5].
  - *Vì sao hiệu quả:* chọn việc ngay tại chỗ, thấy trước công trình này làm được gì.
- **Tu tiên hoá:**
  - Game mình mở thẳng bảng dưới (1 chạm), hợp màn dọc hơn vòng nút. **Giữ.**
  - Thêm (tuỳ chọn) các "chip nhanh" nổi trên công trình đang có việc: [Tụ khí] [Xin giúp]. Chạm chip thì làm luôn, không mở bảng.
- **Game mình:** 🟡. Chạm → cuộn tranh trượt lên, có thẻ chức năng và thẻ nâng cấp. Công trình nhún xuống rồi bật lên, bụi toả ra. Chưa có nút nhanh.
- **Ưu tiên:** P2 · **Công sức:** M

#### B2 · Construction State: trạng thái đang xây

- **Construction State**: giàn giáo và đồng hồ trên công trình đang xây, thanh tiến độ (chưa xác minh hình thức).
- **Tu tiên hoá:** giàn tre, thợ gõ búa, tia lửa, bong bóng đồng hồ viên giấy (đã có).
- **Game mình:** ✅. Còn né được chuyện bong bóng đè biển tên công trình bên cạnh (`bubbleY`).
- **Ưu tiên:** — · **Công sức:** —

#### B3 · Resource Bubbles: bong bóng thu tài nguyên

- **Resource Bubbles**:
  - Chạm công trình sản xuất để thu ✔[41]. Bong bóng trên công trình chuyển vàng khi đầy ✔[41].
  - Phải thu ít nhất mỗi 10 giờ, đầy thì ngừng sản xuất ✔[32][41]. Một chạm có thu hết mọi công trình cùng loại không: chưa xác minh.
  - *Vì sao hiệu quả:* nghi thức "nhặt tiền" ngắn và sướng. Nhưng cũng là việc vặt, và là lý do phải quay lại đều đặn.
- **Tu tiên hoá:**
  - Game mình tự đổ vào kho, ít phiền hơn. **Giữ.**
  - Nếu muốn cảm giác "nhặt": linh khí tụ thành quả cầu nhỏ trên công trình, chạm thì bay về ô tài nguyên. Chỉ là trình diễn, không chạm thì tự thu.
- **Game mình:** — / ✅ theo thiết kế: icon vật phẩm vẽ tay nổi lên định kỳ, "Đầy" trên công trình và trên ô tài nguyên.
- **Ưu tiên:** P2 (tuỳ chọn) · **Công sức:** S

#### B4 · Idle Hints: báo công trình rảnh

- **Idle Hints**: biểu tượng trên công trình khi hàng rảnh, nhắc khi thợ rảnh (chưa xác minh hình thức ở RoK).
- **Tu tiên hoá:** bong bóng gợi ý nhún (đã có).
- **Game mình:** ✅
  - Gợi ý tuyển / lĩnh ngộ / luyện đan / chữa thương / độ kiếp trên đúng công trình (`Home.svelte`, `idle()`).
  - Nút Tạp dịch có nhãn son "Rảnh" và nhấp nháy.
  - Mũi tên vàng chỉ công trình của nhiệm vụ khi thợ rảnh.
- **Ưu tiên:** — · **Công sức:** —

#### B5 · Visitors và icon đặc biệt trên cảnh

- **Visitors & Special Icons**:
  - Thương nhân bí ẩn ghé thì có icon trên Courier Station ✔[34].
  - Alliance Center hiện icon bàn tay khi có thể giúp, chạm để rút ngắn thời gian ✔[30].
  - Tướng đứng trong thành có bong bóng thoại, đã thu nhỏ để khỏi che thao tác với công trình ✔[19]. Truyện tướng dài chuyển sang xem trong màn tướng ✔[21].
  - *Vì sao hiệu quả:* thành "có người", và sự kiện tạm thời hiện ngay trong thế giới.
- **Tu tiên hoá:**
  - **Thương nhân vân du** ghé Tàng Bảo Các vài giờ (khi chợ Giới có client).
  - **Hạc đưa thư** đậu trên Chủ điện khi có thư có quà.
  - Trưởng lão đứng luyện công trước Diễn võ trường, thỉnh thoảng nói một câu. Bong bóng nhỏ, không che công trình.
- **Game mình:** ❌. Có hạc bay, đệ tử lên xuống bậc đá, nhưng chỉ để trang trí, không gắn chức năng. `world/market.ts` có luật chợ nhưng client chưa có giao diện.
- **Ưu tiên:** P2 · **Công sức:** M

### C. Luồng chính và từng màn hình

#### C1 · Upgrade Window: bảng nâng cấp

- **Upgrade Window**:
  - Bảng nâng cấp liệt kê điều kiện tiên quyết, chi phí từng tài nguyên, thời gian. Có nút nâng cấp thường và nút hoàn thành ngay bằng gems ✔[33]. Nút *Go* cạnh điều kiện thiếu: chưa xác minh.
  - Toà thị chính quyết định cấp tối đa của mọi công trình khác. Mỗi lần nâng có phần thưởng một lần (tài nguyên, tăng tốc, gems) ✔[31].
  - *Vì sao hiệu quả:* thiếu gì thấy ngay, đi tới chỗ thiếu một chạm.
- **Tu tiên hoá:** như bảng hiện có, thêm hai thứ:
  1. Ở Chủ điện: hàng **"Lên tầng N mở ra:"** gồm các huy hiệu công trình / tab / mục tiêu sẽ mở (dùng lại `unlocked()` trong `notices.ts`), cùng phần thưởng lên tầng nếu có.
  2. Dòng "Nâng cấp xong lúc 21:40" (giờ thật) cạnh thời gian.
- **Game mình:** ✅ gần như đủ:
  - hình, tên, tầng, lời dẫn;
  - chỉ số hiện tại → sau, thế lực +;
  - yêu cầu ✓/✗ kèm nút *Đi tới*;
  - chi phí thiếu tô đỏ và ghi "có X";
  - cảnh báo chi phí vượt sức chứa kho, có đường sang Tàng Bảo Các;
  - nút Nâng cấp kèm thời gian (`Panel.svelte`).
  - Thiếu: xem trước những gì mở khoá.
- **Ưu tiên:** P1 · **Công sức:** S

#### C2 · Quick Replenish: bù tài nguyên thiếu một chạm

- **Quick Replenish**:
  - 1.0.87 thêm nút bù nhanh tài nguyên thiếu ngay khi đang nghiên cứu, xây hay huấn luyện ✔[19].
  - Có cảnh báo nếu dùng gói tài nguyên làm vượt ngưỡng kho bảo vệ ✔[26].
  - *Vì sao hiệu quả:* chặn cảnh "thiếu 200 gỗ → thoát bảng → mở túi → tìm → dùng → quay lại". RoK phải tới 2024 mới thêm, chứng tỏ đây là nỗi đau thật.
- **Tu tiên hoá:** dưới chi phí thiếu, hiện một hàng:
  - **[Đổi ở Thương hội]**: tính sẵn đổi từ loại đang dư nhất, hiện phí, bấm một lần là xong, không mở Tàng Bảo Các;
  - hoặc **"Đủ sau ~12 phút"**: tính theo sản lượng mỗi giờ;
  - hoặc **[Đi tới: Linh điền]**: công trình sản xuất loại đang thiếu.
  - Thiếu mà Thương hội chưa mở thì chỉ hiện hai lựa chọn sau.
- **Game mình:** ❌. Có Thương hội (đổi tài nguyên có phí, mặc định đổi loại nhiều nhất lấy loại ít nhất; `Trade.svelte`) nhưng **không nối vào bảng nâng cấp / tuyển / lĩnh ngộ**. Bảng chỉ tô đỏ.
- **Ưu tiên:** **P0** · **Công sức:** M

#### C3 · Speedup Window: cửa sổ tăng tốc

- **Speedup Window**:
  - Chọn công trình, bấm nút mũi tên đôi cam, dùng vật phẩm để trừ đúng số thời gian ghi trên vật phẩm ✔[41].
  - Loại vật phẩm: vạn năng (đồng hồ cát + mũi tên), xây dựng (búa + bàn đá), huấn luyện, nghiên cứu, chữa ✔[41].
  - Bố cục danh sách, chọn số lượng, có nút "dùng tự động / vừa đủ" không: chưa xác minh.
  - *Vì sao hiệu quả:* một cửa sổ cho mọi loại tăng tốc, thấy ngay còn bao lâu sau khi dùng.
- **Tu tiên hoá:** Sheet **"Tụ khí"**:
  - thanh thời gian còn lại;
  - các viên đan xếp theo thời lượng, mỗi viên có ô số lượng;
  - nút vàng **"Dùng vừa đủ"**: tự chọn tổ hợp Đại Tụ Khí / Tụ Khí ít lãng phí nhất, xem trước "còn 0:12";
  - khi nuốt đan, linh khí xoáy vào bong bóng đồng hồ trên núi.
- **Game mình:** 🟡. JobRow có nút dùng **từng viên** Tụ Khí Đan (−15:00) / Đại Tụ Khí Đan (−2:00:00) (`JobRow.svelte`). Bảo khố cho chọn việc để dùng. Chưa có dùng nhiều viên, chưa có "vừa đủ", chưa xem trước kết quả.
- **Ưu tiên:** P1 · **Công sức:** S

#### C4 · Alliance Help: xin giúp từ chính việc đang chạy

- **Alliance Help (request)**:
  - Việc xây / nghiên cứu / chữa được thành viên giúp rút ngắn ✔[35]. Chữa thương thành đợt ngắn để tận dụng lượt giúp là mẹo phổ biến ✔[lootbar, xem 5].
  - Nút xin giúp đặt ở đâu (thường là biểu tượng bàn tay ở hàng đợi): chưa xác minh.
- **Tu tiên hoá:**
  - Trong JobRow và trên bong bóng đồng hồ: nút **"Xin tương trợ"** (tay chắp) khi đã vào minh.
  - Sau khi xin, bong bóng hiện "3/10" số người đã giúp.
- **Game mình:** 🟡. Xin giúp từng loại việc ở trang Tiên minh. Bảng công trình và bong bóng thì không có.
- **Ưu tiên:** P1 · **Công sức:** S

#### C5 · Troop Training: huấn luyện quân

- **Troop Training**:
  - Chạm trại lính → Huấn luyện → chọn bậc, kéo số lượng, xem chi phí và thời gian, bấm huấn luyện. Có nâng bậc quân (chưa xác minh chi tiết màn).
  - Bù tài nguyên nhanh áp dụng cả ở đây ✔[19].
- **Tu tiên hoá:** như `Train.svelte`. Thêm C2 (bù tài nguyên) và dòng "Tuyển xong lúc…".
- **Game mình:** ✅. Chọn hệ, bậc, kéo số; nút "Tối đa"; mặc định chọn hệ tuyển được nhiều nhất với kho hiện có. Tuyển xong có thông báo.
- **Ưu tiên:** P2 (thêm C2) · **Công sức:** S

#### C6 · Research: cây công nghệ

- **Research (Academy)**:
  - Chạm Học viện → nút Nghiên cứu (lọ thuốc) → cửa sổ hai thẻ: Kinh tế và Quân sự ✔[30].
  - Cây nút nối dây, nút khoá xám, nút đang học sáng: chưa xác minh chi tiết.
  - Đóng góp công nghệ liên minh có dấu "đề xuất" (chưa xác minh).
- **Tu tiên hoá:**
  - Tàng Kinh Các như **một bức cuộn dài**: 5 hàng công pháp nối bằng nét mực.
  - Công pháp đang lĩnh ngộ có vòng linh khí. Hàng chưa mở phủ sương ghi "Tàng Kinh Các tầng N".
  - Có một dấu son "Nên học" cho người mới.
- **Game mình:** 🟡. 20 công pháp 5 hàng, mở theo tầng, mỗi lúc một môn (`Library.svelte`). Nên kiểm lại xem đã có nối cây trực quan và gợi ý "nên học" chưa (chưa đọc kỹ file).
- **Ưu tiên:** P2 · **Công sức:** M

#### C7 · Hospital: chữa thương

- **Hospital**: thương binh vào viện, chữa theo đợt, dùng tăng tốc chữa. Viện đầy thì quân chết. Giao diện cụ thể chưa xác minh.
- **Tu tiên hoá:** Đan phòng (đã có). Khi Đan phòng sắp đầy thì cảnh báo ngay ở bảng mục tiêu trước lúc xuất quân.
- **Game mình:** ✅
  - Chữa cả lô, luyện đan 1–5 viên (`Alchemy.svelte`).
  - Tab Môn hạ có chấm son khi có thương binh chưa chữa.
  - Kết quả trận ghi "tử trận (Đan phòng hết chỗ)".
  - Chưa rõ có cảnh báo trước khi xuất quân lúc Đan phòng sắp đầy hay không.
- **Ưu tiên:** P2 · **Công sức:** S

#### C8 · Commander Roster: danh sách tướng

- **Commander Roster**:
  - Từ 1.0.87 đánh dấu yêu thích được, tướng yêu thích ghim lên đầu. Danh sách mở rộng từ 2 lên 3 cột trên máy màn rộng ✔[19].
  - Tặng Táo vàng ngay từ trang tướng ✔[15]. Nút *Switch Models* đổi mẫu hình cho tướng đã được làm lại ✔[20].
  - *Vì sao hiệu quả:* khi có hàng chục tướng, lọc và ghim là sống còn.
- **Tu tiên hoá:** lưới trưởng lão (đã có). Khi số trưởng lão nhiều hơn 8: lọc theo hệ / ngũ hành, ghim "môn hạ tâm phúc".
- **Game mình:** ✅ (12 trưởng lão, lưới 2 cột, khoá hiện điều kiện thu nhận: "Công phá …", "Qua tầng 5 …"; `Disciples.svelte`). Chưa cần ghim.
- **Ưu tiên:** P2 · **Công sức:** S

#### C9 · Commander Skills: kỹ năng tướng

- **Commander Skills**:
  - Mô tả gọn / đầy đủ bật tắt được ✔[23]. Video xem trước kỹ năng cho tướng chưa ra ✔[23].
  - Có vật phẩm đặt lại kỹ năng cho tướng đã mở chuyên tinh ✔[17].
- **Tu tiên hoá:**
  - Công pháp trưởng lão: 1 dòng gọn ("Mưa kiếm: 3 lượt, sát thương lan") + "Xem đầy đủ".
  - Nút **"Diễn thử"** phát 3 giây hiệu ứng công pháp. Đã có sẵn phòng thử `lab.html?view=battle&skill=…`, chỉ cần đưa vào.
- **Game mình:** 🟡. Trưởng lão có hành, pháp bảo, thiên phú, công pháp (chi tiết trong Sheet). Chưa có bản gọn / đầy đủ, chưa có diễn thử.
- **Ưu tiên:** P2 · **Công sức:** M

#### C10 · Commander Talents: cây tài năng

- **Commander Talents**:
  - Cây tài năng ✔[riseofkingdomsguides talent-tree, xem 5]. Từ 1.0.88 hiện phần trăm người chơi chọn mỗi ô ✔[20].
  - *Vì sao hiệu quả:* người mới biết "đa số chọn gì" mà khỏi tra mạng.
- **Tu tiên hoá:**
  - Thiên phú trưởng lão: nhãn nhỏ "72% chưởng môn chọn" (server đã có dữ liệu toàn giới).
  - Nút "Điểm theo gợi ý" cho người lười.
- **Game mình:** 🟡. Có thiên phú, có Tẩy Tuỷ Đan để tẩy (`Vault.svelte`). Chưa có gợi ý.
- **Ưu tiên:** P2 · **Công sức:** S–M

#### C11 · Equipment và Loadouts: trang bị

- **Equipment & Loadouts**:
  - Bộ trang bị lưu tối đa 30 ✔[12], làm lại để không gắn với một tướng cụ thể ✔[10].
  - Có "wishlist" và thanh tiến độ tới món hiếm ✔[17].
  - Rèn / tinh luyện đồ huyền thoại cần mật khẩu cấp hai ✔[15].
- **Tu tiên hoá:** pháp bảo (9 món) gắn vào trưởng lão. Hiện chưa cần bộ lưu. Khi có nhiều trưởng lão cùng xuất quân thì đổi pháp bảo theo đội bằng preset (C13).
- **Game mình:** ✅ (`Forge.svelte`, chọn pháp bảo trong Sheet trưởng lão).
- **Ưu tiên:** P2 · **Công sức:** S

#### C12 · March Screen: màn xuất quân

- **March Screen**:
  - Từ ô trên bản đồ → màn xuất quân: chọn tướng chính / phụ, quân (thanh trượt theo loại), thấy sức mạnh, sức chở, thời gian đi (chưa xác minh bố cục).
  - Màn xuất quân hiện rõ phần tăng sức chứa quân từ trang bị ✔[10].
  - Đội hình (formation) có hiệu ứng riêng. Ví dụ bản kỷ niệm 7 năm thêm đội hình hai hàng, +10% tốc hành quân khi đi đánh man rợ ✔[25].
  - Hệ thống tự gợi ý tướng, và từ 1.0.88 ít gợi ý tướng chuyên thu thập cho trận đánh man rợ hơn ✔[20].
  - *Vì sao hiệu quả:* mọi quyết định trên một màn, có số liệu so sánh.
- **Tu tiên hoá:** như `Army.svelte`, **và game mình hơn RoK ở một điểm**: có **tỉ lệ thắng ước lượng** (đánh thử 9 lần, tính hệ khắc, công pháp) với nhận định Áp đảo / Ngang ngửa / Yếu thế. Giữ và làm nổi bật.
- **Game mình:** ✅
  - tự chọn trưởng lão mạnh nhất đang rảnh;
  - mặc định mang hết quân, có Tất cả / Không;
  - thanh trượt từng loại quân;
  - lực chiến Ta / Địch, thanh tỉ lệ thắng;
  - nút Tuyển thêm khi yếu thế.
  - Thiếu: thời gian đi / về hiện ngay trên màn, và "mang hệ khắc" (tự chọn loại quân khắc địch).
- **Ưu tiên:** P1 (thêm thời gian đi, nút "Hệ khắc") · **Công sức:** S

#### C13 · Presets / Troop Loadouts: lưu đội

- **Presets / Troop Loadouts**:
  - 1.0.81 thêm hệ lưu đội: đội đã cấu hình kèm trang bị của tướng, tối đa 45 bộ ✔[13].
  - Nạp preset thì bỏ qua trang bị được (tuỳ chọn) ✔[15]. Xuất nhiều đội cùng lúc có luật chọn theo nhóm màu ✔[15].
  - Chọn trước 3 đội hình ưa thích ✔[11].
  - *Vì sao hiệu quả:* đánh lặp một loại mục tiêu thì chọn đội còn 1 chạm.
- **Tu tiên hoá:**
  - **"Trận đồ"**: lưu 3–5 đội (trưởng lão + số đệ tử mỗi hệ, hoặc "tỉ lệ %" để tự co theo quân đang có).
  - Chọn ở đầu màn xuất quân bằng 3–5 thẻ lụa nhỏ, đặt tên được ("Săn thú", "Độ kiếp", "Phá môn").
- **Game mình:** ❌. Mỗi lần phải chọn lại. Mặc định "mang hết" nên giảm được đau, nhưng từ Trúc Cơ có 2–3 đội thì cần.
- **Ưu tiên:** P1 · **Công sức:** M

#### C14 · Map Navigation: điều khiển và mức zoom bản đồ

- **Map Navigation & Zoom**:
  - Zoom vô cấp ✔[2]. Giữ lâu nút về thành → vòng chọn mức zoom ✔[20].
  - *Strategic View* là chế độ nhìn chiến lược:
    - mức hiển thị mở rộng, danh sách trận đang diễn ra ✔[19];
    - bản đồ nhiệt thể hiện phạm vi và độ căng các trận theo thời gian thật ✔[21];
    - ẩn ảnh đại diện, thu gọn giao diện một chạm ✔[13].
  - Bộ lọc gộp: quân mình / đồng minh / địch ✔[20].
  - Bản đồ làm lại (*remaster*) đang thử, đổi qua lại được với bản cũ ✔[23].
  - *Vì sao hiệu quả:* đọc được tình hình ở nhiều tầng: xa để hiểu thế trận, gần để ra lệnh.
- **Tu tiên hoá:**
  - Bản đồ Giới: 3 mức zoom có tên, gọi ra bằng giữ lâu nút "Về mình":
    - **Cận**: thấy quân;
    - **Trung**: thấy tên tông môn;
    - **Viễn**: thấy vùng / pha mùa.
  - Ở Viễn: chấm son nhấp nháy nơi đang đánh.
- **Game mình:** 🟡. Bản đồ Giới có kéo quán tính, chụm, con lăn, phím +/−, "Về mình". Bản đồ Vùng cuộn dọc có zoom. Chưa có mức zoom định sẵn, chưa có lớp tình hình.
- **Ưu tiên:** P2 · **Công sức:** M

#### C15 · Tile Tap: chạm ô bản đồ → bong bóng thao tác

- **Tile Tap → Action Bubble**:
  - Từ 1.0.89, chạm một lần (thay vì giữ) mở bong bóng thao tác. Ai quen kiểu cũ thì giữ bằng một cài đặt ✔[21].
  - Chạm mục tiêu là tấn công, chạm ô trống là di chuyển nếu bật *Quick Command* ✔[20].
  - Chạm để xem kỹ năng, cơ chế của quân địch ✔[22].
  - *Vì sao hiệu quả:* ít bước giữa "thấy" và "làm".
- **Tu tiên hoá:** như hiện có (chạm → TileSheet / TargetSheet). Thêm một hàng nút nhanh ở đầu Sheet: [Xuất quân] [Dò thám] [Đánh dấu].
- **Game mình:** ✅. Chạm yêu thú / tông môn / bí cảnh → bảng mục tiêu. Chạm trên Giới: cờ → tông môn → điểm → ô trống (`TileSheet.svelte`).
- **Ưu tiên:** — · **Công sức:** —

#### C16 · Map Search: tìm mục tiêu trên bản đồ

- **Map Search**:
  - Bản đồ có nút *Search*. Việc cho phép đổi nó thành nút về thành (1.0.94) cho thấy nó nằm trên HUD bản đồ ✔[24].
  - Tìm theo loại (man rợ, mỏ…) và cấp ✔[38]. Chạm kết quả thì camera bay tới và mở bong bóng (chưa xác minh).
  - Thuật toán tìm ưu tiên thấp những điểm tài nguyên đã có người thu hoặc còn ít ✔[23].
  - *Vì sao hiệu quả:* khỏi kéo bản đồ mỏi tay tìm mục tiêu hợp sức.
- **Tu tiên hoá:**
  - Nút **"Tầm"** (kính lúp nét mực) trên dải trên bản đồ Giới.
  - Chọn loại (linh mạch, mỏ, yêu vương, tông môn) và cấp −/+ → camera trượt tới điểm gần nhất phù hợp.
  - Bản đồ Vùng không cần: đã có vòng sáng quanh "yêu thú nên đánh tiếp".
- **Game mình:** ❌ trên bản đồ Giới. Bản đồ Vùng đã có gợi ý mục tiêu (vòng sáng).
- **Ưu tiên:** P1 · **Công sức:** M

#### C17 · Bookmarks, Coordinates, Sharing: đánh dấu, toạ độ, chia sẻ

- **Bookmarks / Coordinates / Sharing**:
  - Toạ độ chia sẻ được vào kênh vương quốc từ chính thành mình ✔[37].
  - Đánh dấu liên minh: thêm kiểu đếm ngược ✔[22]; đánh dấu liên minh (coalition) tăng từ 10 lên 20 ✔[20]; thẻ đánh dấu trong chat chạm để nhảy tới ✔[16]; đánh dấu chép được ✔[39].
  - Phân tích GameRes chê việc định vị / nhảy nhanh vẫn bất tiện so với game sa bàn ✔[2].
- **Tu tiên hoá:**
  - Nút "Ghi nhớ" (sao) trong TileSheet.
  - Danh sách "Chỗ đã ghi" ở dải trên bản đồ, chia sẻ vào chat Minh bằng thẻ chạm để bay tới.
  - Toạ độ chỉ hiện ở mức Cận.
- **Game mình:** ❌
- **Ưu tiên:** P2 · **Công sức:** M

#### C18 · Minimap: bản đồ nhỏ

- **Minimap**:
  - Bản đồ nhỏ được tối ưu hiển thị ở mọi chế độ ✔[11].
  - Trước đây bản đồ nhỏ không đánh dấu nơi đang đánh ✔[2]. Các bản sau có điểm nóng giao tranh (Lost Kingdom) ✔[13] và bản đồ nhiệt ✔[21].
  - Vị trí và kích thước bản đồ nhỏ: chưa xác minh.
- **Tu tiên hoá:** một **ô tranh nhỏ góc dưới phải** bản đồ Giới (84×84 px), vẽ tay giản lược: vùng, tông môn mình (son), minh (lam), chỗ đang đánh (chấm nhấp nháy). Chạm để nhảy.
- **Game mình:** ❌
- **Ưu tiên:** P2 · **Công sức:** M

#### C19 · Fog và Scouting: sương mù, dò thám

- **Fog & Scouting**:
  - Sương mù che bản đồ, bảo vệ người mới, bớt cảm giác "ngày nào cũng bị đánh" của dòng COK ✔[2].
  - Trinh sát khám phá làng, hang ✔[riseofkingdomsguides scout-camp, xem 5]. Từ 1.0.88 gửi nhiều trinh sát cùng lúc ✔[20].
  - Chạm thành địch → Dò thám. Báo cáo dò thám về hộp thư ✔[30].
- **Tu tiên hoá:** "Mây mù" trên bản đồ Giới đang có (theo pha mùa?). Dò thám = "Thám tử" (hạc giấy bay tới). Báo cáo dò thám là một tờ giấy vẽ tay ghi phòng thủ.
- **Game mình:** 🟡. Tranh đoạt có "xem dò thám" trước khi cướp (`Rivals.svelte`). Bản đồ Vùng dùng mây che mục tiêu khoá. Chưa rõ Giới có sương mù không.
- **Ưu tiên:** P2 · **Công sức:** M

#### C20 · Troop Control: điều quân trên bản đồ

- **Troop Control on Map**:
  - Điều quân tự do, tự vạch đường thay vì chỉ đi rồi về ✔[1][2].
  - *Quick Command* (chạm ô là đi, chạm mục tiêu là đánh, giữ là xuất quân đánh) ✔[20]. Lệnh tấn công mới đang thử để chỉ chính xác hơn, bớt bấm nhầm ✔[25].
  - Đường hành quân mảnh hơn ✔[23][24]. Chân dung quân trên màn ưu tiên hiện ở giữa khi quá nhiều ✔[20]. Biểu tượng "công thành" phân biệt đánh công trình với đánh quân ✔[17].
  - Rút quân nhanh có chế độ tự động ✔[25].
- **Tu tiên hoá:** game mình là "xuất quân rồi giải trận" (tất định, xem lại bằng Phát lại), không điều khiển thời gian thật. **Không cần.** Giữ Phát lại có tốc ×2 / xem kết quả (đã có).
- **Game mình:** — (thiết kế khác). Có cờ chạy trên đường nét đứt, gọi đội về.
- **Ưu tiên:** — · **Công sức:** —

#### C21 · Battle Reports: chiến báo

- **Battle Reports**:
  - Chiến báo nằm trong hộp thư.
  - Chiến báo gộp có đánh giá hiệu suất theo tỉ lệ hạ / mất ✔[14]. Từ 1.0.88 mọi chiến báo có phần "đánh giá trận" ✔[20].
  - Chia sẻ vào chat, mặc định thu gọn ✔[14]. Gắn sao lưu được ✔[17].
  - Hiệu ứng buff xếp để dễ so hai bên ✔[10].
  - *Vì sao hiệu quả:* thua thì hiểu vì sao, thắng thì khoe được.
- **Tu tiên hoá:**
  - Chiến báo giấy: dòng đầu là **đánh giá một câu** ("Thắng nhờ hệ khắc", "Thua: Thể tu bị Kiếm tu khắc"), kèm các nút lối đi (Tuyển thêm Pháp tu / Đổi trưởng lão / Chữa thương) như màn Độ kiếp thất bại đang làm.
  - Chia sẻ vào chat Minh (khi chat có thẻ).
- **Game mình:** 🟡. Có thư và chiến báo, Phát lại, kết quả chi tiết (thương binh, tử trận, thu được, kinh nghiệm), nút Báo thù (`Reports.svelte`, `Replay.svelte`). Chưa có đánh giá một câu + lối đi cho trận thường, chưa có sao, chưa chia sẻ.
- **Ưu tiên:** P1 (đánh giá + lối đi) · **Công sức:** S

#### C22 · Events Center và lịch sự kiện

- **Events Center & Calendar**:
  - Lịch sự kiện trong game ✔[1]. Trang sự kiện có thanh bên ✔[9]. Chấm đỏ khi có thử thách / lượt chơi ✔[22].
  - Mô tả sự kiện dễ đọc hơn ✔[15]. Một số sự kiện có "nhận hàng loạt" ✔[16].
  - Trang *Campaign* hiện điều kiện mở, thưởng chính, tiến độ ✔[20].
- **Tu tiên hoá:** trang **"Sự kiện"** (cuộn tranh), vào từ đĩa ở cột phải:
  - thanh bên trái dọc là **Hoàng lịch** 7 ngày (hôm nay tô son), các sự kiện ngày / tuần / cuối tuần / mùa;
  - mỗi sự kiện có huy hiệu, đồng hồ còn lại, mốc thưởng (thanh tiến độ nét bút), nút *Đi tới* việc cho điểm.
- **Game mình:** 🟡. Bảng Nhiệm vụ ngày chứa: sự kiện tuần theo chủ đề (mốc điểm, thưởng, top giới nhận thư), nhiệm vụ ngày 4 việc + rương, nhiệm vụ tuần + rương, thẻ cuối tuần. Chưa có lịch, chưa có "tuần sau".
- **Ưu tiên:** P1 · **Công sức:** M

#### C23 · Daily Objectives: mục tiêu ngày

- **Daily Objectives**: mỗi mục tiêu xong cho điểm hoạt động, có 5 rương mốc trong thẻ mục tiêu ngày ✔[34]. Người chơi được khuyên đăng nhập mỗi ngày để lấy tăng tốc, vật phẩm ✔[7].
- **Tu tiên hoá:** như hiện có. Nếu thêm việc thì chuyển sang "điểm công đức" + 3–5 rương mốc, đỡ bắt nhận từng việc.
- **Game mình:** ✅. 4 việc, rương khi xong hết, huy hiệu số việc chờ nhận trên nút, nút phát sáng.
- **Ưu tiên:** — · **Công sức:** —

#### C24 · Campaign Hub: gom các chế độ PvE

- **Campaign Hub**:
  - Menu *Campaign* chứa Expedition (màn tuyến tính, 3 sao theo mục tiêu, cửa hàng huân chương, làm mới hằng ngày) ✔[28], Sunset Canyon ✔[34]…
  - Từ 1.0.88 mỗi chế độ trong Campaign hiện điều kiện mở, thưởng chính, tiến độ ✔[20]. Không để khoảng trống cho chế độ chưa mở ✔[22].
- **Tu tiên hoá:** một thẻ **"Thí luyện"** trên bản đồ Vùng gom: bí cảnh (x/5), Thông Thiên Tháp (tầng kỷ lục), yêu thú (cấp tiếp theo). Mỗi mục có điều kiện mở và thưởng lần đầu.
- **Game mình:** 🟡. Mọi thứ nằm rải trên bản đồ Vùng dưới dạng huy hiệu, có cấp / tiến độ / đồng hồ hồi. Đã rõ, nhưng thiếu một chỗ nhìn tổng.
- **Ưu tiên:** P2 · **Công sức:** M

#### C25 · Alliance Hub: trang liên minh

- **Alliance Hub**:
  - Bảng liên minh có 8 mục ở phần dưới phải: Chiến tranh, Thánh địa, Lãnh thổ, Giúp đỡ, Kho, Công nghệ, Quà, Cửa hàng ✔[35].
  - Tìm thành viên ✔[23]. Thông báo duyệt đơn nhanh, không gây phiền ✔[23]. Mời vào minh qua kênh vương quốc ✔[23]. Danh sách chờ tự nhận khi có chỗ ✔[11]. Quyền hạn các cấp ghi rõ ✔[14].
- **Tu tiên hoá:** trang Tiên minh (đã có) chia thẻ: Tương trợ · Đồng môn · Bố cáo · Truyền âm · (sau) Minh khố / Công pháp minh.
- **Game mình:** 🟡. Có danh sách minh (vào ngay), lập minh, bố cáo, giúp đỡ, người trong minh (chức vị, đang chơi), chat kênh minh. Chưa có quà minh, công nghệ minh, cửa hàng minh, lãnh thổ.
- **Ưu tiên:** P2 (thêm tính năng) · **Công sức:** L

#### C26 · Alliance Gifts: quà liên minh

- **Alliance Gifts**:
  - Nhận quà khi thành viên mua gói, khi hạ thành man rợ, xong sự kiện ✔[35]. Mở quà tăng cấp quà. Quà có hạn 24 giờ, phải dọn kẻo mất ✔[ldshop, xem 5].
  - *Claim all*: chưa xác minh cho quà minh. Đã có cho phần thưởng làng ✔[21].
- **Tu tiên hoá:** "Lễ vật": minh hạ yêu vương → mọi người nhận hộp lễ vật. Nút **"Nhận tất cả"**.
- **Game mình:** ❌
- **Ưu tiên:** P2 · **Công sức:** M

#### C27 · Alliance Technology: công nghệ liên minh

- **Alliance Technology**: đóng góp bằng tài nguyên / gems, lượt đóng góp hồi theo thời gian, có xếp hạng đóng góp ngày / tuần ✔[35][36]. Dấu "đề xuất" của sĩ quan: chưa xác minh.
- **Tu tiên hoá:** "Minh pháp": trưởng minh đánh dấu một công pháp minh "đang tu", thành viên góp linh thạch. Xếp hạng tuần.
- **Game mình:** ❌
- **Ưu tiên:** P2 · **Công sức:** M–L

#### C28 · Alliance Territory và Markers: lãnh thổ, đánh dấu

- **Alliance Territory & Markers**:
  - Cờ, pháo đài đang xây hiện vùng kiểm soát dự kiến bằng nét đứt ✔[13]. Có thể lên kế hoạch cắm cờ trước, đủ điều kiện thì tự xây ✔[24].
  - Đánh dấu minh có đếm ngược ✔[22]. Thủ lĩnh đặt đánh dấu liên minh ✔[39].
- **Tu tiên hoá:** khi có lãnh thổ minh trên Giới: viền mực lam quanh vùng, cờ minh vẽ tay. Đánh dấu = cắm "lệnh kỳ".
- **Game mình:** ❌ (có điểm / linh mạch, chiếm / khai; chưa có lãnh thổ minh).
- **Ưu tiên:** P2 · **Công sức:** L

#### C29 · Rally: tập kết đánh chung

- **Rally**:
  - Trang tập kết hiện đội trưởng tập kết / đồn trú và loại quân nên gửi ✔[17].
  - Người gia nhập phải xem khoảng cách (thời gian hành quân), yêu cầu loại quân của người mở ✔[36].
  - Sĩ quan đổi đội trưởng đồn trú, rút quân khỏi hàng tập kết ✔[14][15].
- **Tu tiên hoá:** "Hợp kích": minh mở trận vây yêu vương. Mỗi người gửi một đội, thấy đồng hồ tập hợp, loại đệ tử nên gửi.
- **Game mình:** ❌ (chưa có tính năng).
- **Ưu tiên:** P2 · **Công sức:** L

#### C30 · Items / Inventory: túi đồ

- **Items / Inventory**:
  - Túi đồ có thống kê tài nguyên và tăng tốc đang giữ ✔[21]. Cảnh báo vượt kho khi dùng gói tài nguyên ✔[26].
  - Thẻ phân loại, nút dùng kèm số lượng: chưa xác minh.
- **Tu tiên hoá:** "Bảo khố" (đã có), đan dược dùng ngay. Thêm dòng tổng "Tụ khí đang có: 4:30:00".
- **Game mình:** ✅. Đan dược mỗi loại một cách dùng (chọn việc / chọn trưởng lão / dùng ngay / tự dùng khi độ kiếp), sản lượng mỗi giờ, thành tích (`Vault.svelte`). Thiếu tổng thời gian tụ khí.
- **Ưu tiên:** P2 · **Công sức:** S

#### C31 · Shops: các cửa hàng

- **Shops**: cửa hàng VIP, cửa hàng huân chương viễn chinh, cửa hàng liên minh, thương nhân bí ẩn ✔[34], cửa hàng Zenith (đổi huy hiệu sự kiện lấy giao diện thành…) ✔[25]. Gói ưu đãi dạng vuốt ✔[2].
- **Tu tiên hoá:** "Phường thị": chợ Giới (luật đã có trong `world/market.ts`), cửa hàng điểm sự kiện, thương nhân vân du. Một trang có thẻ, không rải icon khắp HUD.
- **Game mình:** ❌ (luật chợ có, client chưa có).
- **Ưu tiên:** P2 · **Công sức:** M

#### C32 · Mail: hộp thư

- **Mail**:
  - Báo cáo dò thám về hộp thư ✔[30]. Có thư thông báo khi được / bị bổ nhiệm chức ✔[13], khi vào / ra danh sách cho phép ✔[9].
  - Hộp thư tự lọc nội dung nhạy cảm ✔[26].
  - Các thẻ (cá nhân / báo cáo / liên minh / hệ thống…) và nút *Claim all*: chưa xác minh.
- **Tu tiên hoá:** "Hạc thư": thẻ Thư / Chiến báo (đã có). Thêm nút **"Nhận tất cả"** khi có từ 2 thư có quà trở lên, và "Đánh dấu đã đọc hết".
- **Game mình:** 🟡. Hai thẻ; nhận quà từng thư ngay tại chỗ, icon bay; tự mở thẻ Thư khi có quà chưa nhận; huy hiệu số trên nút thư. Chưa có nhận tất cả.
- **Ưu tiên:** P1 · **Công sức:** S

#### C33 · Chat: cửa sổ trò chuyện

- **Chat**: xem A15. Thêm: lobby chat cho giai đoạn lập đội của một số chế độ ✔[22]. Kênh Lost Kingdom thành dạng chủ đề trả lời theo luồng ✔[14]. Dịch tự động: chưa xác minh.
- **Tu tiên hoá:** Sheet chat (đã có), thêm: gửi thẻ chiến báo / thẻ vị trí / thẻ trưởng lão, ghim bố cáo của trưởng minh.
- **Game mình:** 🟡. Kênh Giới / Minh, chặn, báo cáo, chữ đã lọc ở server. Chưa có tin riêng, chưa có thẻ chia sẻ.
- **Ưu tiên:** P2 · **Công sức:** M

#### C34 · Governor Profile: hồ sơ thống đốc

- **Governor Profile**:
  - ID riêng, tên (3–15 ký tự, đổi tốn gems), ảnh đại diện và khung, album 6 ảnh (người khác "thả tim" được) ✔[3].
  - Sức mạnh và sức mạnh cao nhất, số địch hạ theo bậc, thắng / thua / thương vong / số lần dò thám, thanh điểm hành động ✔[3].
  - Tường thành tựu 5 ô trưng bày ✔[3][27]. Nền văn minh, danh hiệu theo ngưỡng sức mạnh ✔[3].
  - Biểu đồ "tổng quan phát triển" so với người cùng vương quốc (1.0.91) ✔[23]. Hướng dẫn cách chơi (1.0.89) ✔[21]. Trang thống kê cá nhân của một số chế độ ✔[11].
- **Tu tiên hoá:** "Hồ sơ chưởng môn": chân dung, danh hiệu cảnh giới, kiếp luân hồi, thế lực và đồ thị thế lực 7 ngày, thành tích (đang ở Bảo khố), trưởng lão mạnh nhất, minh. Chạm tên tông môn người khác ở Biên niên / Xếp hạng / Chat → xem hồ sơ của họ.
- **Game mình:** ❌ (xem A1).
- **Ưu tiên:** P1 · **Công sức:** S–M

#### C35 · Rankings: bảng xếp hạng

- **Rankings**: 9 loại bảng, mở ở Toà thị chính cấp 8 ✔[3]. Bảng thời gian hoàn thành theo đội ở một số chế độ ✔[22].
- **Tu tiên hoá:** như `Ranks.svelte`. Thêm dòng "Bạn: hạng 57 · cần 1.240 thế lực để lên hạng 50".
- **Game mình:** ✅. Lực chiến, cảnh giới, tháp, tranh đoạt, sự kiện tuần; điểm mùa theo phe; phong thần các mùa; mình tô đậm.
- **Ưu tiên:** P2 · **Công sức:** S

#### C36 · Settings: cài đặt

- **Settings**:
  - Thông báo chia theo loại (tin riêng, tin liên minh, chiến đấu…) ✔[42]. Đồ hoạ, âm lượng; tuỳ chọn đồ hoạ khi đông người đánh nhau ✔[42]. "Chế độ nhẹ" (*Lite Mode*) ✔[21]. Chất lượng hiệu ứng chiến đấu ✔[20].
  - Chống xuất quân nhầm ✔[42]. Ẩn tin của mình trên báo ✔[42]. Ẩn bong bóng về thành ✔[11]. "Không hỏi lại hôm nay" ✔[10].
  - Ngôn ngữ, liên kết tài khoản, chặn tới 999 người ✔[3]. Quản lý nhân vật ✔[41].
  - PC: cỡ con trỏ, quản lý tải nội dung thêm ✔[9], tải / hiển thị máy ✔[14], phím tắt thống nhất ✔[20].
- **Tu tiên hoá:** Cài đặt (đã có) thêm:
  - **Tiết kiệm pin** (tắt hạc, sương, lửa lò; giảm độ nét);
  - **Thông báo đẩy theo loại** (xây xong / đội về / bị cướp / sự kiện);
  - "Ẩn tin lớn";
  - "Giảm chuyển động" ngay trong game, không chỉ theo cài đặt hệ điều hành.
- **Game mình:** 🟡. Âm thanh, nhạc, ngôn ngữ, Cẩm nang, tài khoản (gắn email, mã chuyển máy, bật đẩy, đăng xuất, xoá), phiên bản. Giảm chuyển động theo `prefers-reduced-motion`. Chưa có chế độ nhẹ, chưa chọn loại thông báo.
- **Ưu tiên:** P1 (chế độ nhẹ) · **Công sức:** S

#### C37 · Tavern / Chest Opening: mở rương

- **Tavern / Chest Opening**: chạm Quán rượu → Tìm (kính lúp) → mở rương. Góc phải trên có "i" xem tỉ lệ rơi ✔[30]. Hiệu ứng nhận tướng mới được làm đẹp ✔[9]. Kết quả mở rương chia sẻ được vào chat minh ✔[19].
- **Tu tiên hoá:** game mình không quay thưởng. Trưởng lão thu nhận theo tiến độ. Khoảnh khắc "thu nhận trưởng lão" (sau khi phá tông môn / qua tầng 5 bí cảnh) nên là một màn riêng: cuộn tranh mở, chân dung hiện dần bằng mực, tên viết lớn.
- **Game mình:** 🟡. Kết quả trận ghi "Trưởng lão mới", chưa có màn riêng.
- **Ưu tiên:** P2 · **Công sức:** S

### D. Phản hồi thị giác và âm thanh

#### D1 · Collect Feedback: phản hồi khi thu / nhận

- **Collect Feedback**: chạm thu tài nguyên thì icon bay về thanh trên, số nhảy (chưa xác minh chi tiết).
- **Tu tiên hoá:** icon vẽ tay bay theo đường cong vào đúng ô, ô nảy lên, "+150" viền giấy (đã có).
- **Game mình:** ✅ (`ui/fly.ts`, `.float` trong HUD). Nhận thưởng nhiệm vụ, nhiệm vụ ngày, Xuất quan đều bay.
- **Ưu tiên:** — · **Công sức:** —

#### D2 · Power Up Popup: "thế lực +N"

- **Power Up Popup**: xong công trình / nghiên cứu / huấn luyện thì "Power +xxx" hiện ra (chưa xác minh hình thức).
- **Tu tiên hoá:** "+128 Thế lực" màu vàng lá viền mực, bay lên từ ô Thế lực. Nếu tăng lớn (≥5%) thì thêm một vòng 圆相 loang quanh ô.
- **Game mình:** 🟡. Số chạy tween, không có chữ "+N" (xem A2).
- **Ưu tiên:** P1 · **Công sức:** S

#### D3 · Construction Complete: khi công trình xong

- **Construction Complete**: công trình xong có hiệu ứng và âm thanh (chưa xác minh).
- **Tu tiên hoá:** vòng sóng vàng, 12 tia, "Tầng N" bay lên, chuông, rung nhẹ (đã có).
- **Game mình:** ✅. Đang ở tab khác thì chỉ có thông báo. Nên cân nhắc giữ lại hiệu ứng để diễn khi quay về núi (hiện `bursts` hết hạn sau 2 giây).
- **Ưu tiên:** P2 · **Công sức:** S

#### D4 · Milestone Moment: khoảnh khắc mốc lớn

- **Milestone Moment**: lên cấp Toà thị chính, mở thời đại mới, nhận tướng huyền thoại có màn riêng (chưa xác minh chi tiết). Nhận tướng mới có hiệu ứng làm lại ✔[9]. Thẻ trang bị lộ ra bằng cú vuốt ✔[17].
- **Tu tiên hoá:** độ kiếp (trời tím, sét 3 đợt) → màn ĐỘT PHÁ hoa sen, luân hồi (đã có). Nên thêm màn **"Mở khoá"** khi Chủ điện lên tầng có tính năng mới: một cuộn tranh hé ra các huy hiệu vừa mở, bấm từng cái là tới luôn. Hiện chỉ có một thông báo chữ.
- **Game mình:** 🟡. Khoảnh khắc lớn làm rất tốt. Mở khoá chỉ là một dòng thông báo.
- **Ưu tiên:** P1 · **Công sức:** S

#### D5 · Reward Popup: màn phần thưởng

- **Reward Popup**: nhận rương / sự kiện thì hiện bảng liệt kê phần thưởng (chưa xác minh). Nhận hàng loạt ở nhiều nơi ✔[16][21].
- **Tu tiên hoá:** "Tạ lễ": với phần thưởng có vật phẩm (rương ngày / tuần / sự kiện, thư có quà), hiện một dải giấy ngắn liệt kê vật phẩm vẽ tay, 1,2 giây rồi tự bay vào túi. Không bắt bấm đóng.
- **Game mình:** 🟡. Tài nguyên bay vào ô. Đan dược bay vào tab Bảo khố nhưng không liệt kê tên, người chơi dễ không biết vừa nhận gì.
- **Ưu tiên:** P1 · **Công sức:** S

#### D6 · Combat Feedback: phản hồi khi đánh

- **Combat Feedback**: thanh nộ trên đội quân và trong hàng đội ✔[14], số lượng địch hiện khi đang đánh ✔[14], biểu tượng công thành ✔[17], hiệu ứng chiến đấu chỉnh được chất lượng ✔[20].
- **Tu tiên hoá:** Phát lại (đã có) với nét mực, hit-stop, rung, "−12" bay, tên công pháp quét ngang.
- **Game mình:** ✅ (phần hình ảnh trận vượt RoK về chất riêng).
- **Ưu tiên:** — · **Công sức:** —

#### D7 · Sound và Haptics: âm thanh, rung

- **Sound & Haptics**: mỗi thao tác có tiếng, nhạc theo cảnh (chưa xác minh chi tiết ở RoK).
- **Tu tiên hoá:** mõ, chuông, ngũ cung, trống trận, ấn gỗ, đàn tranh / sáo sinh bằng máy (đã có).
- **Game mình:** ✅ (UX.md mục Âm thanh). Nhạc đổi theo cảnh: núi / bản đồ / trận.
- **Ưu tiên:** — · **Công sức:** —

### E. Thông báo

#### E1 · Red Dots và Badges: chấm đỏ, huy hiệu số

- **Red Dots & Badges**: chấm đỏ báo có việc còn làm được. Bản 1.0.90 sửa lỗi thiếu chấm đỏ cho hai chế độ ✔[22]. Việc sửa riêng lỗi này cho thấy người chơi dựa vào chấm đỏ để biết còn lượt.
- **Tu tiên hoá:** giọt son viền vàng (số), chấm son (việc cần làm), "!" giọt vàng (mới mở) (đã có). Quy tắc: **mọi chấm phải xoá được bằng một hành động rõ ràng**, không để chấm "treo".
- **Game mình:** ✅. Tab Bản đồ, tab Môn hạ, nút Thư, nút Nhiệm vụ ngày, "!" tab mới, chiến báo trong MapView. Thiếu chấm cho: Tiên minh (có người xin giúp), chat chưa đọc, sự kiện có mốc nhận.
- **Ưu tiên:** P1 (bổ sung chấm) · **Công sức:** S

#### E2 · Toasts / Banners: thông báo ngắn

- **Toasts / Banners**: thông báo ngắn khi xong việc, nhận thư, có đơn gia nhập ("thông báo duyệt nhanh, không phiền" ✔[23]).
- **Tu tiên hoá:** dải giấy hai đầu lụa hiện ra như nét bút đang vẽ, có nút phụ (đã có).
- **Game mình:** ✅. Tối đa 3; 2,6 giây, hoặc 6 giây nếu có nút; nút "Xem lại" cho chiến báo; thông báo lỗi dùng giấy ửng son.
- **Ưu tiên:** — · **Công sức:** —

#### E3 · Under Attack Warning: cảnh báo bị tấn công

- **Under Attack Warning**: có quân địch đang kéo tới thì cảnh báo (chưa xác minh chi tiết: viền màn đỏ, icon cảnh báo, thông tin từ Watchtower về quân tới, thông báo đẩy).
- **Tu tiên hoá:**
  - "Hộ Sơn Đại Trận cảnh giới": khi có tông môn đang kéo quân tới (đội cướp có thời gian đi `arriveAt`), mép màn loang **son nhạt** như mực thấm.
  - Một thẻ son ở đầu HUD: "Huyết Sát Môn đang kéo tới · 3:20 [Xem]". Thông báo đẩy nếu đang tắt game.
  - Lối đi: gọi đội về giữ nhà, chữa thương, xem Hộ Sơn Đại Trận.
- **Game mình:** ❌. Chỉ biết sau khi bị cướp (thông báo + chiến báo "bị cướp / đẩy lui").
- **Ưu tiên:** P1 · **Công sức:** M (server phải báo đội đang tới cho bên thủ)

#### E4 · Push Notifications: thông báo đẩy

- **Push Notifications**: bật / tắt theo loại (tin riêng, liên minh, chiến đấu…) ✔[42]. Bản PC có thông báo Windows ✔[10].
- **Tu tiên hoá:** hỏi đúng lúc (đã có). Thêm lựa chọn theo loại. Chữ theo giọng tu tiên ("Tàng Kinh Các đã lĩnh ngộ xong Thanh Phong Kiếm Quyết").
- **Game mình:** 🟡. Hỏi bật đẩy khi vừa giao việc dài từ 30 phút, bằng một thông báo có nút "Bật", mỗi máy một lần. Bật trong Tài khoản. Chưa chọn loại được.
- **Ưu tiên:** P1 · **Công sức:** M

#### E5 · Confirmations: hộp xác nhận

- **Confirmations**: hộp xác nhận có "không hỏi lại hôm nay" ✔[10]. Chống xuất quân nhầm ✔[42]. Mật khẩu cấp hai cho thao tác không đảo ngược được với đồ quý ✔[15].
- **Tu tiên hoá:** chỉ xác nhận việc không đảo ngược được: luân hồi (đã có 2 bước), rời minh, đổi tên. Còn lại để hoàn tác được.
- **Game mình:** ✅ (luân hồi 2 bước).
- **Ưu tiên:** — · **Công sức:** —

### F. Hướng dẫn tân thủ

#### F1 · Scripted Opening và Advisor: mở đầu có dàn dựng, nhân vật cố vấn

- **Scripted Opening & Advisor**: mở đầu bằng một trận có dàn dựng, nhân vật cố vấn nói chuyện dẫn từng bước (chưa xác minh chi tiết).
- **Tu tiên hoá:**
  - Một **trưởng lão dẫn đường** (Thanh Phong, chân dung đã có) hiện ở góc dưới với một bong bóng giấy 1–2 câu, ở 5–6 mốc đầu:
    - xây Tụ Linh Trận;
    - tuyển đệ tử;
    - xuất quân đánh yêu thú đầu;
    - chữa thương;
    - độ kiếp đầu.
  - Chạm để đi tiếp, có "Bỏ qua".
- **Game mình:** 🟡. Tiêu đề → lời dẫn 3 dòng → đặt tên → huy hiệu đập xuống → núi có mũi tên vàng. Chuỗi nhiệm vụ dẫn 30 phút đầu. Không có nhân vật nói chuyện.
- **Ưu tiên:** P1 · **Công sức:** M

#### F2 · Finger Pointer và Highlight: ngón tay chỉ, làm nổi

- **Finger Pointer & Highlight**: ngón tay chỉ nút cần bấm, phần còn lại tối đi (chưa xác minh).
- **Tu tiên hoá:** mũi tên vàng vẽ tay (đã có trên công trình). Mở rộng ra **trong bảng**: lần đầu mở Diễn võ trường thì mũi tên chỉ nút Tuyển; lần đầu mở bảng mục tiêu thì chỉ nút Xuất quân. Không làm tối màn, chỉ chỉ.
- **Game mình:** 🟡. Mũi tên chỉ công trình của nhiệm vụ khi thợ rảnh. Trong bảng thì không có.
- **Ưu tiên:** P1 · **Công sức:** S

#### F3 · Feature Gating: khoá tính năng, mở khoá dần

- **Feature Gating**:
  - Toà thị chính quyết định cấp tối đa công trình ✔[31]. Xếp hạng mở ở cấp 8 ✔[3]. Lost Kingdom từ cấp 16 ✔[riseofkingdomsguides map guide, xem 5].
  - Mở khoá theo tiến độ để người chơi nào cũng theo kịp nhịp ✔[2]. Kênh chat Lost Kingdom khoá theo cấp ✔[21].
- **Tu tiên hoá:** mây che tầng chưa mở + khoá "Tầng N", tab khoá "Tầng N", "!" khi vừa mở (đã có).
- **Game mình:** ✅ (UX.md mục 4). Thêm D4 (màn mở khoá) là trọn.
- **Ưu tiên:** — · **Công sức:** —

#### F4 · Newbie Protection: bảo vệ người mới

- **Newbie Protection**: sương mù bảo vệ người mới ✔[2]. Vật phẩm dịch chuyển tân thủ hiển thị rõ hơn ✔[26]. Dịch chuyển báo rõ khi không đặt được ✔[26].
- **Tu tiên hoá:** khiên tân thủ (đã có). Hiện rõ trên chân dung kèm đồng hồ **đọc được trên điện thoại** (xem A5).
- **Game mình:** ✅ (khiên tân thủ theo `NEWBIE_SHIELD`, gợi ý trong Guard). 🟡 hiển thị thời gian trên điện thoại.
- **Ưu tiên:** P1 (gộp A5) · **Công sức:** S

#### F5 · Later Tutorials: hướng dẫn cho tính năng mở sau

- **Later Tutorials**: hướng dẫn cách chơi vào từ hồ sơ ✔[21]. Hướng dẫn hoạt hình cho sự kiện khó ✔[14]. Hướng dẫn cửa hàng công trạng ✔[12].
- **Tu tiên hoá:** lần đầu mở một tính năng (Tranh đoạt, Tiên minh, Bản đồ Giới, Độ kiếp) → 3 thẻ giấy lật ngang, mỗi thẻ một hình và một câu. Xem lại được trong Cẩm nang.
- **Game mình:** 🟡. Cẩm nang 8 mục. Chưa có thẻ "lần đầu".
- **Ưu tiên:** P1 · **Công sức:** S

### G. Tiện lợi (QoL)

#### G1 · Help All: giúp tất cả

- **Help All**: xem A17 ✔[36].
- **Game mình:** 🟡 (chỉ trong trang Tiên minh) · **Ưu tiên:** P1 · **Công sức:** S

#### G2 · Claim All: nhận tất cả

- **Claim All**: nhận hết phần thưởng làng, hết thưởng nhiệm vụ mùa ✔[21], rương theo lô ✔[16].
- **Tu tiên hoá:** "Nhận tất cả" ở: Thư có quà, nhiệm vụ ngày (khi ≥2 việc chờ), mốc sự kiện.
- **Game mình:** ❌ (nhận từng cái).
- **Ưu tiên:** P1 · **Công sức:** S

#### G3 · Quick Replenish: bù nhanh

- **Quick Replenish**: xem C2 ✔[19].
- **Game mình:** ❌ · **Ưu tiên:** P0 · **Công sức:** M

#### G4 · Smart Speedup: dùng tăng tốc thông minh

- **Smart Speedup**: xem C3. Có nút tự chọn hay không: chưa xác minh ở RoK. Dù vậy đây là mẫu phổ biến trong dòng game.
- **Game mình:** 🟡 · **Ưu tiên:** P1 · **Công sức:** S

#### G5 · Presets: lưu đội

- **Presets**: xem C13 ✔[13].
- **Game mình:** ❌ · **Ưu tiên:** P1 · **Công sức:** M

#### G6 · Idle Visibility: thấy hàng / đội đang rảnh

- **Idle Visibility**: hàng đội mép phải ✔[15]. Hàng đợi rảnh báo rõ (chưa xác minh).
- **Game mình:** 🟡 (xem A9, A11) · **Ưu tiên:** P0 · **Công sức:** M

#### G7 · Go Everywhere: đi tới ở mọi nơi

- **Go Everywhere**: nút *Go* ở nhiệm vụ ✔[5]. Chạm thẻ đánh dấu trong chat để bay tới ✔[16].
- **Tu tiên hoá:** mọi thông báo, yêu cầu thiếu, việc rảnh đều có *Đi tới* (đã có nhiều chỗ).
- **Game mình:** ✅ (Đi tới Chủ điện / Tàng Bảo Các, `focus()` từ HUD / nhiệm vụ / Bảo khố / Môn hạ, thông báo có "Xem lại"). Thiếu ở: thanh tài nguyên (A6), cột sự kiện.
- **Ưu tiên:** P1 (gộp A6) · **Công sức:** S

#### G8 · Automation: tự động hoá

- **Automation**:
  - tự nộp nhiệm vụ liên minh đã xong sau 24 giờ ✔[24];
  - kỹ năng vai trò tự nhắm mục tiêu ✔[23], quân của đồng đội treo máy tự đánh ✔[23];
  - tự tái chế trang bị theo điều kiện ✔[19];
  - rút quân thua về tự động ✔[25];
  - danh sách chờ tự nhận vào minh ✔[11];
  - đội hình phòng thủ tự đặt ✔[17].
- **Tu tiên hoá:** "Tự vận hành" cho việc vặt:
  - thương binh về thì tự vào hàng chữa nếu Đan phòng rảnh (tuỳ chọn);
  - thưởng nhiệm vụ ngày tự nhận lúc qua ngày, gửi vào thư.
  - Không tự động những việc là "quyết định" (nâng gì, đánh ai).
- **Game mình:** ❌
- **Ưu tiên:** P2 · **Công sức:** M

#### G9 · Bulk Actions: thao tác hàng loạt

- **Bulk Actions**: quay 50 lần một lúc, có tooltip tổng thu ✔[21]; du hành ×10 ✔[23].
- **Tu tiên hoá:** tuyển / luyện đan đã có số lượng. Thêm "Dùng ×N" cho đan dược trong Bảo khố.
- **Game mình:** 🟡 · **Ưu tiên:** P2 · **Công sức:** S

#### G10 · Favorites và Search: yêu thích, tìm kiếm

- **Favorites & Search**: ghim tướng yêu thích ✔[19], gắn sao chiến báo gộp ✔[17], tìm thành viên minh ✔[23], tìm người để chặn ✔[24].
- **Game mình:** ❌ (chưa cần khi danh sách còn ngắn).
- **Ưu tiên:** P2 · **Công sức:** S

#### G11 · Low-friction Settings: cài đặt bớt vướng

- **Low-friction Settings**: ẩn bong bóng về thành ✔[11], chế độ nhẹ ✔[21], không hỏi lại hôm nay ✔[10].
- **Game mình:** 🟡 (xem C36) · **Ưu tiên:** P1 · **Công sức:** S

#### G12 · Keyboard Shortcuts: phím tắt desktop

- **Keyboard Shortcuts**: bản PC có phím tắt cho quân, được thống nhất ở 1.0.88 ✔[20]. Có "đội hình tuỳ chỉnh" điều cả đội cùng lúc ✔[13].
- **Tu tiên hoá:** desktop thêm phím:
  - `Space` núi ↔ bản đồ;
  - `Q` đi tới nhiệm vụ;
  - `H` giúp tất cả;
  - `B` mở việc Tạp dịch;
  - `M` thư;
  - `Esc` đóng (đã có).
  - Hiện gợi ý phím khi rê chuột (title).
- **Game mình:** 🟡 (phím 1–5, +/− trên bản đồ Giới) · **Ưu tiên:** P2 · **Công sức:** S

### H. Phong cách thị giác

#### H1 · Art Direction: định hướng mỹ thuật

- **Art Direction**:
  - Hoạt hình kiểu Mỹ màu sáng, không quá chibi cũng không tả thực ✔[2]. GameRes chê bản đồ lớn sơ sài (địa hình, cỏ ít chi tiết) và trận đông người vẫn rối dù có xoay chiều ✔[2]. Bản đồ đang được làm lại ✔[23].
  - Mỗi nền văn minh có kiến trúc, cờ riêng (chưa xác minh là giao diện đổi theo văn minh).
  - *Vì sao hiệu quả:* sáng và dễ đọc hình khối ở khoảng cách xa. Công trình khác nhau rõ về dáng.
- **Tu tiên hoá:** thanh lục sơn thủy + da giấy bồi lụa vẽ bằng bút lông (đã có). Chất riêng hơn RoK nhiều. Rủi ro là **đẹp mà khó đọc**, xem H2–H5.
- **Game mình:** ✅ (bản sắc mạnh).
- **Ưu tiên:** — · **Công sức:** —

#### H2 · Typography và Numbers: chữ và số

- **Typography & Numbers**: số viết gọn (K/M) cho số lớn. Chữ đậm có viền / bóng trên nền tối, số trên HUD luôn nằm trên một tấm nền (chưa xác minh chi tiết font).
- **Tu tiên hoá:**
  - Alegreya (có nét bút, đủ tiếng Việt), số `tabular-nums lining-nums` (đã có). Viết gọn bằng `Intl` từ 10.000 (đã có).
  - **Cần sửa:** cỡ nhỏ nhất đang là 10–11 px: nhãn "Tầng N" dưới tab khoá 10 px, số cấp trên huy hiệu bản đồ 10 px, `--fs-1` 11 px.
  - Hiện `ui/theme.css` nâng `--fs-1/2/3` lên 12 / 13,5 / 15,5 px **chỉ cho desktop**, còn điện thoại giữ 11 / 12,5 / 14,5 px. Như vậy là ngược với nhu cầu: màn nhỏ cầm tay mới cần chữ to hơn. Trên điện thoại nên:
    - nhãn phụ ≥ 12 px;
    - số quan trọng (tài nguyên, đồng hồ, thế lực) ≥ 16 px đậm 800;
    - nhãn đặt trên tranh luôn có viền giấy 3 px (như nhãn bản đồ đang làm).
- **Game mình:** 🟡
- **Ưu tiên:** **P0** · **Công sức:** S

#### H3 · Iconography: biểu tượng

- **Iconography**: icon lớn, hình bóng rõ, mỗi tài nguyên một hình và một màu (chưa xác minh). Loại tăng tốc phân biệt bằng hình phụ (búa + bàn đá cho xây dựng, đồng hồ cát cho vạn năng) ✔[41].
- **Tu tiên hoá:**
  - icon nét bút: hình bóng phải đọc được ở 16 px;
  - nét chính dày ≥ 2 px ở cỡ 24 px;
  - mỗi tài nguyên một **hình** (tinh thể / bông lúa / quặng) và một **sắc khoáng**;
  - icon thao tác đơn sắc tô theo màu chữ (đã có).
  - Kiểm bằng cách thu ảnh HUD xuống 50% xem còn nhận ra không.
- **Game mình:** ✅ (có lab `/lab.html?view=icons` để soát).
- **Ưu tiên:** P2 (soát ở 16 px) · **Công sức:** S

#### H4 · Contrast và Layering: tương phản, tách lớp

- **Contrast & Layering**: HUD là tấm nền đặc nằm trên thế giới, chữ không bao giờ đặt thẳng lên cảnh (chưa xác minh chi tiết màu nền). Đường hành quân mảnh lại để bớt che ✔[23][24]. Quân bạn / rune bị chặn hiện dạng viền ✔[23].
- **Tu tiên hoá:** tách **lớp tranh** và **lớp thông tin**:
  - lớp tranh được loang, sương, texture;
  - lớp thông tin (số, nút, nhãn) dùng giấy ngà gần phẳng (vân giấy ≤ 5–8% độ sáng), chữ mực đậm;
  - mực trên giấy ngà ~12:1, son trên giấy ~5:1 (chỉ dùng cho chữ đậm / lớn);
  - **không dùng chữ vàng trên giấy** (tương phản thấp), vàng chỉ để viền, ánh, huy hiệu;
  - ban đêm cảnh tối nhưng HUD vẫn giấy sáng. Ảnh chụp đêm cho thấy cách này đang ổn.
- **Game mình:** ✅ phần lớn. Cần soát các chỗ chữ `--gold-d` trên giấy (đồng hồ trong "Đang diễn ra" desktop, `+N`).
- **Ưu tiên:** P1 (soát tương phản) · **Công sức:** S

#### H5 · Color Semantics: màu mang nghĩa

- **Color Semantics**: xanh = đủ / đạt, đỏ = thiếu / nguy, vàng = sẵn sàng / có thưởng (mẫu chung của dòng game, chưa xác minh bảng màu RoK).
- **Tu tiên hoá:** bảng nghĩa màu khoáng, **luôn kèm hình** để không chỉ dựa vào màu:
  - **son (朱砂)**: thiếu, nguy, đang bị tấn công, rảnh cần làm (✗, khung son);
  - **lục khoáng (石绿)**: đủ, đạt, được bảo hộ (✓, vòng lục);
  - **vàng lá**: có thưởng, sẵn sàng nhận (ánh vàng, sao);
  - **lam khoáng (石青)**: thông tin, đang chạy, tiến độ;
  - **mực nhạt**: khoá, chưa mở (khoá).
- **Game mình:** ✅ (UX.md: "Màu không phải tín hiệu duy nhất").
- **Ưu tiên:** — · **Công sức:** —

#### H6 · HUD Density: độ phủ của HUD

- **HUD Density**: RoK để trống giữa màn cho thế giới, HUD dồn ra mép. Trên màn ngang, các góc rộng nên dồn được nhiều mà ít che.
- **Tu tiên hoá:**
  - Màn dọc chật hơn. Ước từ ảnh 390×844: dải trên ~118 px, thẻ nhiệm vụ ~75 px, thanh tab ~102 px, tức **~35% màn bị HUD che**.
  - Mục tiêu ≤ 28%:
    - dải trên gọn hơn ~16 px (bớt đệm dưới 18 → 8 px, thanh sức chứa sát số);
    - thẻ nhiệm vụ một dòng (~48 px), mở rộng khi chạm;
    - thanh tab ~84 px + vùng an toàn.
  - Mọi thứ nổi thêm (dải Đang diễn ra, cột phải) phải hẹp (≤ 44 px) và bám mép.
- **Game mình:** 🟡
- **Ưu tiên:** P1 · **Công sức:** S

#### H7 · City Themes / Cosmetics: giao diện thành

- **City Themes / Cosmetics**: giao diện thành đổi được, đổi lấy ở cửa hàng sự kiện ✔[25]. Từ 1.0.88 giao diện chỉ còn buff, không còn debuff ✔[20]. Giao diện thành hiện cả ở chiến trường một chế độ ✔[16].
- **Tu tiên hoá:** "Sơn môn cảnh sắc": đổi mùa cho núi (xuân hoa đào, đông tuyết), mái lưu ly màu khác. Chỉ trang trí.
- **Game mình:** ❌ (trời đổi theo giờ thật: điểm cộng lớn đã có).
- **Ưu tiên:** P2 · **Công sức:** L

**Tổng: 96 mục** (A 18 · B 5 · C 37 · D 7 · E 5 · F 5 · G 12 · H 7). Tính theo đầu mục: 6 mục G (G1, G3, G4, G5, G6, G11) trỏ lại mục A/C cùng nội dung, nên nội dung riêng là 90 mục.

---

## 3. Đề xuất bố cục HUD mới

Nguyên tắc chuyển từ RoK (ngang) sang màn dọc của game mình:

| RoK (ngang) | Sơn Hà Tiên Tông (dọc 390×844) |
|---|---|
| Góc trên trái: ảnh, sức mạnh, VIP | Dải trên, hàng 1: chân dung · tên / cảnh giới · Thế lực · thư · cài đặt |
| Góc trên phải: tài nguyên, gem | Dải trên, hàng 2: 3 viên tài nguyên có thanh sức chứa, **chạm được** |
| Mép phải: sự kiện, gói | Cột phải hẹp dưới dải trên: tối đa 3 đĩa (Sự kiện · Nhiệm vụ ngày · Quà) |
| Mép phải: hàng đội quân | Mép trái: dải **Đang diễn ra** (việc + đội), chip 32 px |
| Bên trái: nhiệm vụ | Thẻ nhiệm vụ một dòng ở góc trên trái (đã có, thu gọn) |
| Góc dưới phải: menu hệ thống | Thanh 5 tab dưới (đã có) |
| Góc dưới: nút thành ↔ bản đồ | Tab Bản đồ (đã có) + nút "Về tông môn" trên bản đồ |
| Dải chat dưới | Dải "Truyền âm" 1 dòng ngay trên thanh tab, ở **mọi tab** |
| Nút giúp nhanh góc dưới phải | Đĩa "Tương trợ" nổi trên nút Tạp dịch khi có người xin |

### 3.1 Điện thoại dọc 390×844: tab Tông môn

```
┌──────────────────────────────────────────────┐ ← env(safe-area-inset-top)
│ ◉  Thiên Kiếm Tông          ⚔ 1,2 N  ✉³  ⚙ │ hàng 1 · 52px
│    Luyện Khí · tầng 3   🛡11:20 ✦Ngưng Thần │   chân dung 44px (chạm → Hồ sơ)
│                                              │   dải buff nhỏ (chạm → "Đang hưởng")
│ ◆ 1.002 ▰▰▱   ❀ 993 ▰▰▱   ⛰ 988 ▰▰▱      │ hàng 2 · 34px · chạm viên → bảng nguồn thu / bù
├──────────────────────────────────────────────┤ ← hết dải trên ≈ 100px (hiện ≈ 118)
│ ┌Nhiệm vụ──────────────────────┐    (📅)•  │ thẻ 1 dòng ≈ 48px | đĩa 44px: Sự kiện
│ │ Nâng Chủ điện lên tầng 4   ▸ │    (📜)2  │                       Nhiệm vụ ngày
│ └──────────────────────────────┘    (🎁)•  │                       Quà / điểm danh
│ ┌──────────┐                                 │
│ │👥 Rảnh!  │ ← chip son nhún: Diễn võ trường │ Dải ĐANG DIỄN RA (mép trái, chip 32px)
│ │📖 12:04  │   chạm → focus(tangKinhCac)     │  tuyển · lĩnh ngộ · đan/chữa · luyện khí
│ │⚗ 3:10   │                                 │  đội hành quân (chân dung + cờ trạng thái)
│ │🚩 ↩ 2:10 │                                 │  > 4 chip: gộp thành "5 việc · 1 rảnh ▾"
│ └──────────┘        (cảnh núi — thế giới)    │
│                                              │
│                                              │
│                                       (🤝4)  │ ← đĩa Tương trợ (chỉ khi có người xin)
│                                      ( ⚒ )   │ ← nút Tạp dịch (giữ nguyên, vòng tiến độ)
│ 💬 Minh · Lão Tam: đa tạ chưởng môn!    ³   │ dải Truyền âm 28px (mọi tab)
├──────────────────────────────────────────────┤
│  🏯       👥       🗺       🚩       📦      │ thanh tab ≈ 72px + safe-area-inset-bottom
│Tông môn  Môn hạ  Bản đồ  Tiên minh Bảo khố   │
└──────────────────────────────────────────────┘
```

Ghi chú:

- Thông báo ngắn (toast) hiện dưới thẻ nhiệm vụ, lệch phải để không đè dải Đang diễn ra.
- Cảnh báo bị cướp (E3) là một thẻ son **chen vào giữa dải trên và thẻ nhiệm vụ**, kèm viền màn loang son. Không dùng hộp chặn.
- Khi mở bảng công trình (cuộn tranh từ dưới lên), dải Truyền âm và đĩa Tương trợ ẩn. Dải trên vẫn thấy để theo dõi tài nguyên.
- Dải Đang diễn ra và cột phải **không hiện ở tab Môn hạ / Bảo khố / Tiên minh** (trang giấy đã chiếm màn), chỉ ở Tông môn và Bản đồ.

### 3.2 Điện thoại dọc: bảng công trình khi thiếu tài nguyên (C2 + C4)

```
┌──────────────────────────────────────────────┐
│ (dải trên giữ nguyên)                         │
├──────────────────────────────────────────────┤
│ ══════ trục gỗ sơn mài ══════════════════ ✕ │
│  [hình]   Tàng Kinh Các · Tầng 3           ? │ ← "?" dấu triện → mục Cẩm nang
│           Lời dẫn nghiêng…                   │
│  Hàng công pháp ........ 2/5 → 3/5           │
│  Thế lực .............. +45                  │
│  Yêu cầu                                     │
│  ✓ Chủ điện tầng 4                           │
│  ◆ 1.200 (có 980) ✗   ❀ 800 ✓   ⛰ 600 ✓   │
│  ┌──────────────────────────────────────────┐│
│  │ Thiếu 220 linh thạch                     ││
│  │ [Đổi 367 ⛰ → 220 ◆ (giữ 60%)]  [Đợi ~9′] ││ ← Quick Replenish (C2); tỉ lệ lấy từ TRADE_KEEP
│  └──────────────────────────────────────────┘│
│  [ ⚒ Nâng cấp · 1:20:00 · xong 21:40      ]  │
│  (đang xây) ▰▰▰▰▱▱ 0:42:10                   │
│  [Tụ khí vừa đủ ▸]   [🤝 Xin tương trợ]      │ ← C3 + C4
└──────────────────────────────────────────────┘
```

### 3.3 Điện thoại dọc: tab Bản đồ (Giới)

```
┌──────────────────────────────────────────────┐
│ (dải trên)                                    │
├──────────────────────────────────────────────┤
│ [Giới|Vùng]  🚩 2/3   🔍Tầm  ★Ghi  📜³       │ tìm (C16), chỗ đã ghi (C17), chiến báo
│ Mùa 3 · Ngày 12/28 · Tranh mạch   Biên niên ▾│
│                                              │
│                 (bản đồ Giới)                │
│                                              │
│                                    ┌──────┐  │
│                                    │ ▪ ·  │  │ bản đồ nhỏ 84px (C18): chạm để nhảy
│                                    │  · ● │  │   ● mình (son) · chấm nhấp nháy = đang đánh
│                                    └──────┘  │
│ ┌ Thanh Phong · Linh mạch Đông · khai 12:30 ┐│ danh sách đội (đã có, thu gọn 1 dòng/đội)
│ 💬 Giới · …                         (🏯 Về) │ nút Về tông môn: giữ lâu → Cận / Trung / Viễn
├──────────────────────────────────────────────┤
│ tabs                                          │
└──────────────────────────────────────────────┘
```

### 3.4 Desktop (≥ 1024×600, ví dụ 1440×900)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ ◉ Thanh Huyền Tông │ ◆ 1.016 ▰▰▱  ❀ 1.006 ▰▰▱  ⛰ 1.144 ▰▰▱ │ ⚔ 114 │ 📅• 📜² 🎁 │ ✉³ ⚙ │ 84px
│   Luyện Khí · t.1  │  (chạm viên → bảng nguồn thu/bù)           │       │ cột sự kiện │      │
│   🛡 11:20          │                                            │       │ nằm ngang   │      │
├──────────────────┬────────────────────────────────────────────────────┬──────────────────┤
│ 🏯 Tông môn    1 │                                                    │ Ngăn kéo phải    │
│ 👥 Môn hạ      2 │                                                    │ (440px, mở khi   │
│ 🗺 Bản đồ      3 │                                                    │  chọn công trình │
│ 🚩 Tiên minh   4 │                                                    │  / mục tiêu —    │
│ 📦 Bảo khố     5 │             (cảnh núi / bản đồ)                    │  không chặn cảnh)│
│──────────────────│                                                    │                  │
│ Nhiệm vụ       ▸ │                                                    │                  │
│ Xây Khoáng mạch  │                                                    │                  │
│──────────────────│                                                    │                  │
│ ĐANG DIỄN RA     │                                                    │                  │
│ ⚒ Chủ điện  1:39 │                                                    │                  │
│ 👥 Rảnh  [Tuyển] │ ← dòng rảnh có nút làm ngay                        │                  │
│ 📖 Kiếm quyết 12′│                                                    │                  │
│ 🚩 Đội 1 ↩ 2:10  │                                         ( ⚒ )     │                  │
│──────────────────│ ┌ Truyền âm (thu gọn được) ─────────────┐          │                  │
│ TIÊN MINH        │ │ Minh · Lão Tam: đa tạ!                │          │                  │
│ 🤝 Tương trợ (4) │ │ Giới · Huyền Minh đột phá Kim Đan     │          │                  │
└──────────────────┴─┴───────────────────────────────────────┴──────────┴──────────────────┘
```

Desktop giữ bố cục hiện tại (cột trái 300 px, thanh trên 84 px, ngăn kéo phải 440 px), chỉ thêm:

- cột sự kiện nằm ngang trên thanh trên;
- dòng "rảnh" trong Đang diễn ra có nút làm ngay;
- khối Tiên minh (Tương trợ) cuối cột trái;
- khung chat thu gọn ở góc dưới trái vùng cảnh;
- phím tắt G12.

---

## 4. Bảng tổng kết khoảng cách

Chỉ liệt kê mục game mình 🟡 / ❌. Xếp theo ưu tiên, trong cùng ưu tiên thì việc ít công sức lên trước.

| Mục | Game mình | Ưu tiên | Công sức |
|---|---|---|---|
| A6 Chạm viên tài nguyên → bảng sản lượng / sức chứa / nguồn thêm (điện thoại hiện không phản hồi) | 🟡 | **P0** | S |
| H2 Cỡ chữ tối thiểu trên điện thoại (10–11 px → ≥12 px; số chính ≥16 px đậm) | 🟡 | **P0** | S |
| A11 + A9 + G6 Dải "Đang diễn ra" (việc + đội) trên điện thoại (hiện CSS ẩn, chỉ desktop có) | 🟡 | **P0** | M |
| C2 + G3 Bù tài nguyên thiếu một chạm (Thương hội ngay trong bảng / Đợi ~N phút / Đi tới) | ❌ | **P0** | M |
| A1 + C34 Hồ sơ chưởng môn (chân dung → hồ sơ; thành tích, thế lực, luân hồi, xếp hạng) | ❌ / 🟡 | P1 | S–M |
| A2 + D2 Thế lực: chạm xem nguồn, "+N Thế lực" bay lên | 🟡 | P1 | S |
| A5 + F4 Dải buff dưới chân dung (khiên, đan) đọc được trên điện thoại | 🟡 | P1 | S |
| A15 Dải Truyền âm 1 dòng ở mọi tab (hiện chỉ Bản đồ, Tiên minh) | 🟡 | P1 | S |
| A17 + G1 Đĩa "Tương trợ" (giúp tất cả) nổi trên HUD | 🟡 | P1 | S |
| A18 Nút "?" theo ngữ cảnh → đúng mục Cẩm nang | 🟡 | P1 | S |
| C1 Xem trước "Lên tầng N mở ra" + "xong lúc hh:mm" trong bảng | 🟡 | P1 | S |
| C3 + G4 Tụ khí: dùng nhiều viên, "Dùng vừa đủ", xem trước kết quả | 🟡 | P1 | S |
| C4 Xin tương trợ ngay từ bảng công trình / bong bóng | 🟡 | P1 | S |
| C12 Màn xuất quân: thời gian đi / về, nút "Mang hệ khắc" | 🟡 | P1 | S |
| C21 Chiến báo: đánh giá một câu + nút lối đi (như độ kiếp thất bại) | 🟡 | P1 | S |
| C32 + G2 "Nhận tất cả" (thư có quà, nhiệm vụ ngày, mốc sự kiện) | ❌ | P1 | S |
| C36 + G11 Chế độ nhẹ / tiết kiệm pin, giảm chuyển động trong game | 🟡 | P1 | S |
| D4 Màn "Mở khoá" khi Chủ điện lên tầng (huy hiệu bấm là tới) | 🟡 | P1 | S |
| D5 Dải "Tạ lễ" liệt kê vật phẩm nhận được | 🟡 | P1 | S |
| E1 Bổ sung chấm: Tiên minh có người xin giúp, chat chưa đọc, sự kiện có mốc nhận | 🟡 | P1 | S |
| F2 Mũi tên dẫn trong bảng cho lần đầu (Tuyển, Xuất quân, Độ kiếp) | 🟡 | P1 | S |
| F5 Thẻ "lần đầu" khi mở tính năng mới (Tranh đoạt, Tiên minh, Giới) | 🟡 | P1 | S |
| H4 Soát tương phản chữ vàng trên giấy | 🟡 | P1 | S |
| H6 Giảm độ phủ HUD trên điện thoại từ ~35% xuống ≤28% | 🟡 | P1 | S |
| A8 + C22 Cột sự kiện + trang Sự kiện có Hoàng lịch 7 ngày | 🟡 | P1 | M |
| C13 + G5 Trận đồ (preset đội) | ❌ | P1 | M |
| C16 Tìm mục tiêu trên bản đồ Giới (loại + cấp) | ❌ | P1 | M |
| E3 Cảnh báo có tông môn kéo quân tới (viền son, thẻ đồng hồ, đẩy) | ❌ | P1 | M |
| E4 Thông báo đẩy chọn theo loại | 🟡 | P1 | M |
| F1 Trưởng lão dẫn đường nói chuyện ở 5–6 mốc đầu | 🟡 | P1 | M |
| A3 Điểm danh sơn môn / chuỗi 7 ngày | ❌ | P2 | S |
| A10 Chương nhiệm vụ có tên, thẻ thu gọn | 🟡 | P2 | S |
| A16 Tin lớn toàn giới quét ngang trên núi (tắt được) | 🟡 | P2 | S |
| C5 Bù tài nguyên + "xong lúc" ở Diễn võ trường | 🟡 | P2 | S |
| C7 Cảnh báo Đan phòng sắp đầy ngay ở màn xuất quân (cần kiểm lại) | 🟡 | P2 | S |
| C30 + G9 Tổng thời gian tụ khí, "Dùng ×N" | 🟡 | P2 | S |
| C35 Xếp hạng: "cần X để lên hạng Y" | 🟡 | P2 | S |
| C37 Màn thu nhận trưởng lão | 🟡 | P2 | S |
| D3 Giữ hiệu ứng lên tầng để diễn khi quay lại núi | 🟡 | P2 | S |
| G10 Ghim / tìm kiếm trong danh sách dài | ❌ | P2 | S |
| G12 Phím tắt desktop mở rộng | 🟡 | P2 | S |
| H3 Soát icon ở 16 px | 🟡 | P2 | S |
| B1 Chip nhanh trên công trình đang có việc | 🟡 | P2 | M |
| B5 Khách lạ trên cảnh (thương nhân vân du, hạc đưa thư) | ❌ | P2 | M |
| C6 Cây công pháp trực quan + dấu "Nên học" (cần kiểm lại) | 🟡 | P2 | M |
| C9 Công pháp: bản gọn / đầy đủ, nút "Diễn thử" | 🟡 | P2 | M |
| C10 Thiên phú: "% chưởng môn chọn", điểm theo gợi ý | 🟡 | P2 | S–M |
| C14 Mức zoom định sẵn (Cận / Trung / Viễn), lớp tình hình | 🟡 | P2 | M |
| C17 Ghi nhớ vị trí, chia sẻ thẻ vị trí | ❌ | P2 | M |
| C18 Bản đồ nhỏ góc bản đồ Giới | ❌ | P2 | M |
| C19 Sương mù / thám tử trên Giới (cần kiểm lại) | 🟡 | P2 | M |
| C24 Thẻ "Thí luyện" gom PvE | 🟡 | P2 | M |
| C26 Lễ vật minh + nhận tất cả | ❌ | P2 | M |
| C31 Phường thị (chợ Giới đã có luật, thiếu client) | ❌ | P2 | M |
| C33 Chat: thẻ chia sẻ chiến báo / vị trí / trưởng lão, ghim bố cáo | 🟡 | P2 | M |
| G8 Tự vận hành việc vặt (tự chữa, tự nhận thưởng ngày) | ❌ | P2 | M |
| A7 Tiền cao cấp / cửa hàng (tuỳ kế hoạch kinh doanh) | ❌ | P2 | M–L |
| C27 Minh pháp (công nghệ minh) | ❌ | P2 | M–L |
| A14 Zoom liền mạch núi ↔ bản đồ | 🟡 | P2 | L |
| C25 Tiên minh đủ thẻ (kho, công pháp minh, lãnh thổ) | 🟡 | P2 | L |
| C28 Lãnh thổ minh + lệnh kỳ | ❌ | P2 | L |
| C29 Hợp kích (tập kết) | ❌ | P2 | L |
| H7 Sơn môn cảnh sắc (skin theo mùa) | ❌ | P2 | L |

**Game mình đã hơn hoặc ngang RoK** (giữ, đừng phá khi thêm tính năng):

- **Xuất quan**: tổng kết lúc vắng.
- **Tỉ lệ thắng ước lượng** kèm nhận định và nút Tuyển thêm.
- **Thanh sức chứa** dưới từng tài nguyên.
- **Đi tới** ở mọi yêu cầu thiếu.
- Trạng thái công trình trong thế giới: mây khoá, bóng mờ + búa, giàn tre, gợi ý rảnh.
- **Mũi tên dẫn đường** theo nhiệm vụ.
- **"!" cho tab mới mở.**
- **Hỏi bật đẩy đúng lúc.**
- Ngăn kéo desktop không chặn cảnh.
- Khoảnh khắc độ kiếp / đột phá / luân hồi.
- Âm thanh cho mọi thao tác, trời theo giờ thật, VFX nét mực.
- Giảm chuyển động theo hệ điều hành.

---

## 5. Nguồn

Đọc được toàn trang (qua công cụ đọc web):

1. Deconstructor of Fun: *2020 Predictions #5: The Clash of Ice and Phasers*. Lịch sự kiện, điều quân tự do. https://www.deconstructoroffun.com/blog/2020/1/9/2020-predictions-strategy
2. GameRes: *SLG品类进化：《万国觉醒》产品分析报告*. Zoom vô cấp, hệ tướng ở góc dưới phải, sương mù, lưu bố cục, UI gói vuốt, điểm yếu định vị / bản đồ nhỏ, phong cách mỹ thuật. https://www.gameres.com/871741.html
3. riseofkingdomsguides.com: *Governor Profile in RoK*. https://riseofkingdomsguides.com/governor-profile-in-rok/
4. riseofkingdomsguides.com: *How do you get VIP points*. VIP ở góc trên trái, nhận hằng ngày. https://riseofkingdomsguides.com/how-do-you-get-vip-points-in-rise-of-kingdoms/
5. riseofkingdomsguides.com: *Beginners Guide 2026*. Thanh AP dưới tên, nút Info, nút Go của nhiệm vụ, Builders Recruitment. https://riseofkingdomsguides.com/rise-of-kingdoms-beginners-guide/ — Cùng site, dẫn trong bài theo tên: *talent-tree* https://riseofkingdomsguides.com/talent-tree/ · *scout-camp* https://riseofkingdomsguides.com/scout-camp/ · *map guide* https://riseofkingdomsguides.com/rise-of-kingdoms-map-guide/ · *alliance credits* https://riseofkingdomsguides.com/how-to-get-alliance-and-individual-credits-in-rise-of-kingdoms/
6. riseofkingdomsguides.com: *Farming / Gathering Guide*. Nút biểu đồ ở Toà thị chính. https://riseofkingdomsguides.com/farming-gathering-guide/
7. riseofkingdomsguides.com: *Life hacks, tips and tricks*. UI hướng chuyển đổi, đăng nhập mỗi ngày. https://riseofkingdomsguides.com/rise-of-kingdoms-life-hacks-tips-and-tricks/
8. riseofkingdomsguides.com: *Updates* (danh sách bản cập nhật). https://riseofkingdomsguides.com/updates/
9. Bản 1.0.77 *Winter's Tale* (12/2023). https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-77-winters-tale-update/
10. Bản 1.0.78 *Live Loong and Prosper* (1/2024). https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-78-live-loong-and-prosper-update/
11. Bản 1.0.79 *Surging Spring* (2/2024). https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-79-surging-spring-update/
12. Bản 1.0.80 *Easter Elation* (3/2024). https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-80-easter-elation-update/
13. Bản 1.0.81 *Unearthing History* (4/2024). https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-81-unearthing-history-update/
14. Bản 1.0.82 *Dragon Boat Bash* (5/2024). https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-82-dragon-boat-bash-update/
15. Bản 1.0.83 *Eternal City* (6/2024). Hàng đội mép phải. https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-83-eternal-city-update/
16. Bản 1.0.84 *Magpie's Song* (7/2024). https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-84-magpies-song-update/
17. Bản 1.0.85 *Poised for Battle* (8/2024). https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-85-poised-for-battle-update/
18. Bản 1.0.86 *Anchors Aweigh* (9/2024). https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-86-anchors-aweigh-update/
19. Bản 1.0.87 *Rex Totius Britanniae* (10/2024). Quick Replenish, ghim tướng. https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-87-rex-totius-britanniae-update/
20. Bản 1.0.88 *Giving Thanks* (11/2024). Vòng mức zoom, Quick Command, đánh giá trận, % tài năng. https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-88-giving-thanks-update/
21. Bản 1.0.89 *Sleigh All Day* (12/2024). Chạm một lần, claim all, Lite Mode, hướng dẫn trong hồ sơ. https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-89-sleigh-all-day-update/
22. Bản 1.0.90 *Return of the King* (1/2025). Chấm đỏ, đánh dấu đếm ngược. https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-90-return-of-the-king-update/
23. Bản 1.0.91 *Moon and Star* (2/2025). Mô tả kỹ năng gọn, đường hành quân mảnh, tìm thành viên. https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-91-moon-and-star-update/
24. BlueStacks: *Frontiers of Knowledge*, bản 1.0.94 (13/5/2025). https://www.bluestacks.com/blog/updates/rise-of-kingdoms/rok-frontiers-of-knowledge-update-en.html
25. BlueStacks: *7th Anniversary Update* (16/9/2025). https://www.bluestacks.com/blog/updates/rise-of-kingdoms/rok-7th-anniversary-update-en.html
26. BlueStacks: *1.0.39 Optimization Update* (ngày 2/11, trang không ghi năm; theo số bản thì nhiều khả năng 2020: **cũ**). https://www.bluestacks.com/blog/updates/rise-of-kingdoms/rok-optimization-update-en.html
27. BlueStacks: *Spring Update 1.0.31* (9/3/2021; **cũ**). Chạm đúp đội ở bảng phải, tường thành tựu. https://www.bluestacks.com/blog/updates/rise-of-kingdoms/rok-spring-update-en.html
28. BlueStacks: *Expedition Mode guide*. https://www.bluestacks.com/blog/game-guides/rise-of-kingdoms/guide-expeditions-en.html
29. BlueStacks: *Benefits of Playing RoK on BlueStacks*. Nhận xét lối chơi qua nhiều menu. https://www.bluestacks.com/blog/game-guides/rise-of-kingdoms/rok-features-guide-en.html
30. MuMu Player: *Rise of Kingdoms building guide*. Búa danh sách công trình (3 thẻ), nút Nghiên cứu, kính lúp Quán rượu, bàn tay Alliance Center, dò thám → thư. https://www.mumuplayer.com/blog/rise-of-kingdoms-building-guide.html
31. Pocket Gamer: *City Hall upgrade requirements and designs*. https://www.pocketgamer.com/rise-of-kingdoms/city-hall/
32. Pocket Gamer: *All resources in RoK*. Thu mỗi 10 giờ, kho, vật phẩm an toàn. https://www.pocketgamer.com/rise-of-kingdoms/resources/
33. Pocket Gamer: *RoK guide: tips for beginners*. Hoàn thành ngay bằng gems. https://www.pocketgamer.com/rise-of-kingdoms/guide-tips/
34. Gamer Empire: *How to get speedups*. Icon thương nhân trên Courier Station, 5 rương mục tiêu ngày, các cửa hàng. https://gamerempire.net/rise-of-kingdoms-how-to-get-speedups/
35. 光环助手 (ghzs666): *新手进阶攻略（联盟介绍篇）*. 8 mục trong bảng liên minh, cơ chế giúp đỡ, quà, đóng góp. https://www.ghzs666.com/bbs/thread-24435
36. 光环助手 (ghzs666): *新手进阶攻略（联盟细节篇）*. Cài "Giúp nhanh", nút góc dưới phải, tập kết. https://www.ghzs666.com/bbs/thread-25324
37. 18183: *万国觉醒怎么分享坐标*. https://m.18183.com/wgjx/202010/3065389.html
38. 18183: *万国觉醒怎么找到野蛮人*. Tìm trên bản đồ theo loại / cấp. https://m.18183.com/wgjx/202010/3081175.html
39. App Store: *Rise of Kingdoms* (bản 1.1.x, ghi chú phiên bản). https://apps.apple.com/app/1354260888
40. Wikipedia: *Rise of Kingdoms*. https://en.wikipedia.org/wiki/Rise_of_Kingdoms

Chỉ đọc được **đoạn trích trong kết quả tìm kiếm** (trang chặn công cụ đọc web):

41. riseofkingdoms.fandom.com:
    - *Frequently Asked Questions*: nút "i" ở hầu hết cửa sổ, ảnh đại diện góc trên trái → cài đặt, nút địa cầu góc dưới phải khi thu nhỏ. https://riseofkingdoms.fandom.com/wiki/Frequently_Asked_Questions
    - *Quests*: nhiệm vụ chính / phụ, bảng bên trái có hộp quà. https://riseofkingdoms.fandom.com/wiki/Quests
    - *Items/Speedup*: mũi tên đôi cam, các loại tăng tốc. https://riseofkingdoms.fandom.com/wiki/Items/Speedup
    - *Buildings/Farm*: chạm để thu, bong bóng vàng khi đầy, 10 giờ. https://riseofkingdoms.fandom.com/wiki/Buildings/Farm
42. rok.guide: *Governor Profile & Settings*. Thông báo theo loại, đồ hoạ, chống xuất quân nhầm, ẩn tin mình trên báo. https://www.rok.guide/profile-settings/

Nguồn phụ dẫn theo tên trong bài: lootbar (chữa thương đợt ngắn để tận dụng lượt giúp) https://www.lootbar.com/blog/en/rise-of-kingdoms-speedups-resource-management-guide.html · ldshop (quà liên minh hạn 24 giờ) https://www.ldshop.gg/blog/rise-of-kingdoms/how-to-get-speedups.html

Nguồn trong repo (game mình): `docs/UX.md`; `apps/client/src/Hud.svelte`, `App.svelte`, `Panel.svelte`, `Daily.svelte`, `JobRow.svelte`, `Army.svelte`, `Reports.svelte`, `Chat.svelte`, `Alliance.svelte`, `Vault.svelte`, `Disciples.svelte`, `Settings.svelte`, `notices.ts`, `lib.ts`, `ui/*.svelte`, `ui/theme.css`, `world/Home.svelte`, `world/MapTab.svelte`, `world/MapView.svelte`, `world/WorldView.svelte`; `packages/rules/data.ts`, `packages/rules/world/raid.ts`, `packages/rules/world/market.ts`. Ảnh chụp playtest: `$TMPDIR/rok-play/shots/` (caothu-005, caothu-006, pvp1-010, quaylai-011: điện thoại 390×844; dohuu-016, b-001: desktop 1440×900).
