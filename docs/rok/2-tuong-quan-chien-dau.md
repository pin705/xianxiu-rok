# RoK — Tướng, Quân đội & Chiến đấu (đối chiếu với Sơn Hà Tiên Tông)

> Tài liệu nghiên cứu, 24/09/2026. Phạm vi: tướng (commanders), trang bị, đội hình, quân, bệnh viện, cơ chế chiến đấu và nghiên cứu (Academy) của Rise of Kingdoms bản hiện hành (tới các bản 1.0.8x–1.0.9x, 2024–2025, cộng Season of Conquest). Đối chiếu với code hiện tại: `packages/rules/data.ts`, `combat.ts`, `core/battle.ts`, `sect/*`, `world/*`, cùng [PLAN.md](../PLAN.md) và [UX.md](../UX.md).
>
> **Độ tin cậy của số liệu RoK:** (2 nguồn) = đã khớp ít nhất 2 nguồn · (1 nguồn) = chỉ thấy ở một nguồn · (cộng đồng) = ước lượng của người chơi, Lilith không công bố · **chưa xác minh** = theo hiểu biết chung về RoK nhưng chưa đối chiếu được nguồn nào trong phiên này.
>
> **Hạn chế nguồn:** wiki Fandom (lỗi 402), rok.guide (503), rokhub (402) và Reddit (chặn) không đọc được qua công cụ. Hạn mức tìm kiếm web hết giữa chừng, nên phần lớn số liệu lấy từ riseofkingdomsguides.com, heaven-guardian.com, gamesguideinfo.com (cơ sở dữ liệu, một phần dữ liệu cũ khoảng 2019–2020), onechilledgamer.com, codexhelper.com và ghi chú các bản cập nhật. Số liệu RoK đổi theo mùa và bản cập nhật, nên chỉ dùng làm tham chiếu thiết kế, không phải hằng số.
>
> **Ký hiệu:** ✅ có tương đương · 🟡 có một phần · ❌ chưa có. **Ưu tiên:** P0 cốt lõi / P1 quan trọng / P2 thêm hương vị, xét theo mục tiêu "clone trải nghiệm RoK" (mục nào đụng danh sách "Không làm" ở PLAN §1 thì ghi rõ). **Công sức:** S (vài ngày) / M (1–2 tuần) / L (từ 3 tuần), ước cho codebase hiện tại: luật thuần TS, trận tất định, server trọng tài.

---

## 1. Tóm tắt mảng

### 1.1 Vị trí trong vòng lặp của RoK

Tướng, quân và chiến đấu là "động cơ" biến mọi tài nguyên của RoK thành sức mạnh và xung đột:

| Nhịp | Người chơi làm gì trong mảng này |
|---|---|
| Phiên ngắn | Xếp hàng huấn luyện ở 4 nhà lính; dùng sách EXP cho tướng; tiêu AP đánh man tộc để lấy EXP tướng và nguyên liệu trang bị; chữa quân ở bệnh viện; mở rương miễn phí ở Tavern |
| Ngày | Kết trận liên minh đánh pháo đài man tộc (Books of Covenant, EXP); đủ tượng thì nâng kỹ năng tướng; chế tạo trang bị; nghiên cứu ở Academy |
| Tuần / sự kiện | MGE (6 ngày, xếp hạng lấy tượng huyền thoại), Wheel of Fortune, Card King, Arms Training — hầu hết sự kiện quy về tướng, tượng và tốc lực quân |
| KvK (mùa liên server) | Mọi thứ dồn vào giao tranh: điểm tiêu diệt (KP), danh dự, chiếm công trình, quân chết được Hall of Heroes trả lại một phần, cửa hàng KvK đổi ra tượng hoặc chìa Sovereign, tức là tướng cho mùa sau |

Vòng xoáy: tướng mạnh hơn → hạ man tộc nhanh và ít hao AP hơn → EXP và nguyên liệu → trang bị → thắng giao tranh → KP, danh dự, xếp hạng → phần thưởng lại là tượng và tướng.

### 1.2 Vì sao người chơi thích

1. **Thấy trận đánh.** Mỗi đội là một khối quân chạy trên bản đồ; giao tranh diễn ra từng giây, số sát thương bay lên, kỹ năng nổ kèm chân dung tướng. Người chơi *thấy* mình thắng hay thua chứ không chỉ đọc thư.
2. **Điều khiển giữa trận.** Đổi mục tiêu, rút lui khi bệnh viện sắp đầy, kéo địch về phía tháp canh hay đồng minh, dồn nhiều đội vào một mục tiêu. Kỹ năng tay có thể thắng lực chiến.
3. **Theorycraft cặp tướng.** Hơn 100 tướng, mỗi tướng 3 cây thiên phú, kỹ năng AoE / khiên / hồi máu / giảm công, cặp chính–phụ, trang bị theo bộ, đội hình. Cộng đồng liên tục săn "meta".
4. **Nuôi dài hạn có mốc rõ.** Cấp 60, sao 1–6, kỹ năng 5-5-5-5 rồi expertise (690 tượng cho một tướng huyền thoại). Mục tiêu kéo dài nhiều tháng, mốc nào cũng hiện trên chân dung.
5. **Phối hợp liên minh.** Kết trận vào thành hay pháo đài, đồn trú, tiếp viện: chiến thắng thuộc về cả nhóm.
6. **Bảng điểm xã hội.** KP, số quân chết, danh dự hiện trên hồ sơ; liên minh dựa vào đó xét ai đã đóng góp.
7. **Rủi ro thật.** Quân chết khi bệnh viện đầy, thành bị "zero", nên mỗi quyết định giao tranh đều có sức nặng.

### 1.3 Khác biệt nền tảng với Sơn Hà Tiên Tông (nên đọc trước từng mục)

| Chủ đề | RoK | Game mình |
|---|---|---|
| Giải trận | Thời gian thực trên bản đồ, mỗi lượt 1 giây, kéo dài tới khi một bên hết quân hoặc rút | Tự động tối đa 10 lượt, giải ngay khi quân tới nơi, tất định theo seed; client phát lại bằng WebGL (PLAN §1 đưa trận kéo dài vào "Không làm") |
| Kỹ năng | Nộ tích tới 1.000 thì tung chủ động; 2 tướng mỗi đội | Công pháp chủ động nổ cố định ở lượt 3/6/9; 1 trưởng lão mỗi đội |
| Quân số và sát thương | Cộng đồng suy ra sát thương xấp xỉ √(quân số) (chưa có xác nhận chính thức) | Tuyến tính theo số đệ tử (kiểu Lanchester) |
| Chênh lệch bậc quân | T5 so với T1: công ×3,5, thủ và máu ×1,8, sức mạnh ×10 | Bậc 5 = 14× chỉ số bậc 1; thế lực ×36 |
| Nguồn tướng | Gacha ở Tavern + sự kiện + VIP | Cột mốc nội dung (không gacha, theo PLAN §1) |
| Điểm PvP | KP theo bậc quân, danh dự, số quân chết | Elo khi cướp tông môn, điểm mùa theo giờ giữ điểm |
| Quy mô một đội | Có trần theo cấp tướng chính (cộng thiên phú, kỹ năng, VIP, vật phẩm) | Không có trần: một đội mang được mọi đệ tử đang có |

---

## 2. Danh mục hệ thống

### A. Tướng (Commanders)

#### 2.1 Độ hiếm tướng

**Tên gốc (EN):** Commander Rarity — Legendary / Epic / Elite / Advanced
- *Mở khoá:* ngay từ đầu. Mỗi văn minh tặng một tướng khởi đầu (Wikipedia xác nhận có tướng khởi đầu riêng theo văn minh; danh sách hiện hành chưa xác minh).
- *Cơ chế:*
  - 4 bậc màu: Lục (Advanced), Lam (Elite), Tím (Epic), Vàng (Legendary) (2 nguồn).
  - Advanced và Elite có 4 kỹ năng (1 chủ động, 3 bị động); Epic và Legendary có 5 (thêm Expertise) (2 nguồn).
  - Mọi bậc đều tối đa cấp 60 và 6 sao (gamesguideinfo). Khác nhau ở độ mạnh kỹ năng, số tượng cần (250 / 350 / 450 / 700, đã gồm 10 tượng triệu hồi) và lượng EXP cần.
  - Số lượng năm 2026: hơn 80 huyền thoại, hơn 20 sử thi, tinh anh và cao cấp mỗi loại khoảng 10 (riseofkingdomsguides, 1 nguồn).
- *UI/UX:* khung chân dung đổi màu theo bậc; danh sách lọc và sắp xếp theo độ hiếm; từ bản 1.0.87 có đánh dấu "yêu thích" để ghim tướng lên đầu, lưới 3 cột.
- *Giữ chân:* màu khung báo giá trị ngay lập tức; tướng vàng là mục tiêu dài hạn và là lý do nạp.
- **Tu tiên hoá:** phẩm cấp **Thiên – Địa – Huyền – Hoàng** (vàng / tím / lam / lục) cho trưởng lão; phẩm Thiên và Địa có thêm "bản mệnh thần thông" (tương đương Expertise).
- **Game mình:** ❌ — 12 trưởng lão ngang phẩm, khác nhau ở hệ, ngũ hành và công pháp. Độ "quý" đến từ độ khó cột mốc (bí cảnh 4–5, tháp tầng 30/45, yêu vương).
- **Ưu tiên:** P1 · **Công sức:** S (thêm trường phẩm cấp vào `ElderDef`, khung chân dung theo phẩm, chi phí nâng theo phẩm).

#### 2.2 Chuyên môn và vai trò của tướng

**Tên gốc (EN):** Commander Specialties / Talent Trees
- *Cơ chế:*
  - 15 chuyên môn (gamesguideinfo): Infantry, Cavalry, Archer, Leadership (dẫn quân), Integration (quân hỗn hợp), Garrison (đồn trú), Peacekeeping (đánh man tộc), Gathering (thu thập), Conquering (đánh thành, kết trận), Skill (sát thương kỹ năng), Support, Mobility (tốc hành quân), Versatility, Attack, Defense. Có thêm **Engineering** (công thành) là nhánh mới (1 nguồn).
  - Mỗi tướng có đúng 3 chuyên môn, tức 3 cây thiên phú (2 nguồn). Onechilledgamer chia thành 3 nhóm: loại quân (Leadership, Infantry, Cavalry, Archer, Integration), vai trò (Peacekeeping, Versatility, Conquering, Garrison, Gathering), chức năng (Attack, Defense, Skill, Support, Mobility).
  - Việc dùng tướng: PvE (man tộc, pháo đài), thu thập, PvP (dã chiến, kết trận, đồn trú), công thành.
- *Ví dụ (thấy độ đa dạng)* — theo CSDL gamesguideinfo, riseofkingdomsguides, heaven-guardian (L = huyền thoại, E = sử thi, El = tinh anh, A = cao cấp):

| Chuyên môn | Tướng tiêu biểu |
|---|---|
| Bộ binh | Charles Martel (L), Richard I (L), Constantine I (L), Sun Tzu (E, nay có bản Prime L), Eulji Mundeok (E), City Keeper (A) |
| Kỵ binh | Cao Cao, Minamoto no Yoshitsune, Saladin, Attila, Takeda Shingen, Alexander Nevsky, Huo Qubing (L); Baibars, Belisarius, Pelagius (E); Lancelot (El); Dragon Lancer (A) |
| Cung thủ | Yi Seong-Gye, El Cid, Ashurbanipal, Henry V, Edward of Woodstock, Choe Yeong (L); Hermann, Kusunoki Masashige (E); Tomoe Gozen (El); Markswoman (A) |
| Dẫn quân / Chinh phạt | Julius Caesar, Hannibal Barca, Frederick I, Mehmed II (L); Scipio Africanus, Osman I (E); Gaius Marius (El) |
| Quân hỗn hợp | Cleopatra VII (L); Boudica, Joan of Arc, Lohar (E); Constance, Šárka (El); Centurion (A) |
| Đồn trú | Charles Martel, Richard I, Yi Seong-Gye, Constantine I, Gorgo (L); Hermann, Kusunoki, Pelagius, Eulji Mundeok (E) |
| Đánh man tộc | Cao Cao, Minamoto, Æthelflæd (L); Belisarius, Boudica, Lohar (E); Markswoman (A) |
| Thu thập | Cleopatra VII (L), Joan of Arc (E), Ishida Mitsunari, Constance, Šárka, Gaius Marius, Centurion |
| Kỹ năng | Sun Tzu, El Cid, Frederick I, Mehmed II, Yi Seong-Gye, Minamoto… (cây phổ biến nhất, khoảng 15 tướng trong CSDL cũ) |
| Hỗ trợ | Cleopatra VII, Constantine I, Saladin, Joan of Arc, Lohar |
| Cơ động | Cao Cao, Belisarius, Lancelot, Dragon Lancer |
| Đa năng | Sun Tzu, El Cid, Lancelot, Tomoe Gozen |
| Tấn công / Phòng thủ | Hannibal, Caesar, Eulji Mundeok, Scipio / Charles Martel, Richard I |

  CSDL gamesguideinfo phản ánh giai đoạn 2019–2020; nhiều tướng đã có bản làm lại (Prime) hoặc đổi độ hiếm. Tướng mới 2024–2025: King Arthur, Siyaj K'ak' (L), Wak Chanil Ajaw (E), Prime Ragnar Lodbrok, Vercingetorix, Hayam Wuruk, Alp Arslan, Subutai, Qin Shi Huang, Tokugawa Ieyasu, Zhuge Liang.
- *UI/UX:* 3 huy hiệu chuyên môn dưới tên tướng; màn tạo đội tự gợi ý tướng theo việc (bản 1.0.88: không còn gợi ý tướng thu thập khi đánh man tộc).
- *Giữ chân:* một người cần nhiều tướng cho nhiều việc, nên sưu tập có lý do.
- **Tu tiên hoá:** "đạo" của trưởng lão: Thể (bộ binh), Kiếm (kỵ binh), Pháp (cung thủ), Khôi Lỗi / Trận Khí (công thành), Thống Ngự (Leadership), Hỗn Nguyên (Integration), Trấn Thủ, Trảm Yêu (Peacekeeping), Khai Mạch (Gathering), Chinh Phạt, Thần Thông (Skill), Hộ Pháp (Support), Thân Pháp (Mobility), Vạn Biến (Versatility), Sát Phạt (Attack), Hộ Thể (Defense).
- **Game mình:** 🟡 — mỗi trưởng lão có 1 hệ (kiếm / pháp / thể) và 1 hành; bị động đã có vai trò riêng (chiến lợi phẩm, kinh nghiệm, độ kiếp, thủ…), nhưng không có cây theo chuyên môn. Thiên phú là 3 nhánh chung (công / thể / đạo) cho mọi người.
- **Ưu tiên:** P1 · **Công sức:** M (gắn 3 chuyên môn cho mỗi trưởng lão, đi kèm cây thiên phú ở mục 2.10).

#### 2.3 Nguồn tướng và tượng

**Tên gốc (EN):** Commander Acquisition (Tavern, MGE, Wheel of Fortune, Card King, VIP, Expedition, KvK)
- *Cơ chế (các kênh):*
  - Tavern (mục 2.4) và Legendary Tavern (chỉ trong Season of Conquest).
  - **MGE – Mightiest Governor:** 6 ngày, lặp định kỳ; xếp hạng điểm (huấn luyện, dùng tốc lực…) để lấy tượng huyền thoại của tướng được chọn. Các hạng đầu thường được thoả thuận trước; hạng 15–25 vẫn có tượng mà ít tốn (1 nguồn).
  - **Wheel of Fortune:** quay bằng gem, có "lưới an toàn" — tiêu đủ gem là chắc có tướng (1 nguồn). **Card King:** lật thẻ bằng gem (1 nguồn).
  - **VIP:** từ VIP 10, rương VIP hằng ngày cho 1 tượng huyền thoại vạn năng; VIP 12 cho 2, VIP 14 cho 3 (2 nguồn).
  - Gói Daily Special Offer: cứ 3 rương chắc 1 tượng huyền thoại (1 nguồn).
  - Sự kiện riêng: Lohar's Trial (Lohar), King's Trials / First Strike (King Arthur, Prime Ragnar — theo mùa KvK), đăng nhập 7 ngày (Wak Chanil Ajaw).
  - Cửa hàng Expedition đổi huy chương (Æthelflæd dễ lấy ở đây), Ark of Osiris, cửa hàng Lost Kingdom / KvK, sự kiện More Than Gems (2 nguồn).
  - Tượng vạn năng ("golden head") đổi được thành tượng của tướng cụ thể, nhưng không phải tướng nào cũng nhận; ví dụ Minamoto và Æthelflæd dùng kênh riêng (1 nguồn).
- *Tương tác:* MGE là cạnh tranh trực tiếp trong vương quốc, kèm thoả thuận ai lấy hạng nào.
- *UI/UX:* trang tướng chưa có hiện video kỹ năng (bản 1.0.91) và dẫn tới nơi có thể lấy.
- *Giữ chân:* lịch sự kiện xoay vòng tạo các "mùa săn" tướng; sợ lỡ cơ hội (FOMO).
- **Tu tiên hoá:** "cơ duyên thu đồ": Chiêu Hiền Đài (Tavern), Luận Đạo Đại Hội (MGE — thi điểm tu luyện 6 ngày, thưởng hồn ấn), Thiên Cơ Bàn (Wheel), bí cảnh, đăng nhập, sự kiện tông môn. Tượng vạn năng = "Vạn Hồn Ấn".
- **Game mình:** 🟡 — trưởng lão nhận qua cột mốc cố định: đầu game Mộc Thanh Phong; Hắc Phong Trại → Thạch Kiên; Thanh Mộc bí cảnh tầng 5 → Liễu Như Yên; Vạn Độc Cốc → Lôi Chấn; Xích Viêm tầng 5 → Vân Hạc; Huyền Băng tầng 5 → Hàn Băng; Lôi Trì tầng 5 → Bạch Vô Nhai; tháp tầng 30 → Mạc Sầu; Hỗn Độn tầng 5 → Hoắc Thiên Cương; sự kiện tuần mốc 5 → Tô Mị Nương; tháp tầng 45 → Diệp Cô Thành; yêu vương giữa giới → Huyền Minh. Không có mảnh hay tượng, không có trùng lặp.
- **Ưu tiên:** P1 · **Công sức:** M (thêm "hồn ấn" làm tiền tệ nâng, nguồn qua sự kiện tuần, mùa, xếp hạng).

#### 2.4 Tavern (rương tướng)

**Tên gốc (EN):** Tavern — Silver Chest / Golden Chest / Equipment Chest; Legendary Tavern (Sovereign Keys)
- *Mở khoá:* Tòa thị chính cấp 1 (2 nguồn); nâng tới 25, cần Tòa thị chính, Tường và Mỏ đá cùng cấp.
- *Cơ chế:*
  - **Rương Bạc** (chìa bạc): tướng Advanced / Elite, tượng tướng, tượng sao (Starlight), tài nguyên, tốc lực, sách EXP. Được mở miễn phí nhiều lần mỗi ngày, số lần tăng theo cấp Tavern. Một nguồn ghi 3 lần/ngày, lên 10 ở cấp tối đa; nguồn khác ghi 5 lần/ngày — **mâu thuẫn, chưa xác minh**.
  - **Rương Vàng** (chìa vàng): tướng Legendary / Epic / Elite, tượng, tượng sao, tài nguyên, tốc lực, sách. Không ra tướng độc quyền của sự kiện (Wheel, KvK, MGE). Miễn phí khoảng 2 ngày một lần (cấp thấp khoảng 3 ngày) (2 nguồn; chu kỳ theo từng cấp chưa xác minh).
  - Mỗi rương vàng có 4 "ô thưởng". Tỉ lệ niêm yết mỗi ô: tượng huyền thoại 3,023%, tượng sử thi 7,983%. Thử 201 chìa cho thấy tỉ lệ niêm yết đúng khi hiểu là tính theo ô; mở lẻ hay mở gộp cho kết quả như nhau (simonho, 1 nguồn có dữ liệu).
  - **Rương Trang bị** (chìa pha lê): bản vẽ, nguyên liệu, tài nguyên, tốc lực (1 nguồn). Mở gộp 10 rương một lần.
  - **Legendary Tavern** (chỉ Season of Conquest): dùng chìa Sovereign, chủ yếu đến từ thưởng KvK. Cứ 10 rương chắc chắn có ít nhất 1 tượng huyền thoại; đủ 200 rương được chọn thưởng; tối đa 2.000 rương/ngày; chìa thừa giữ sang lần sau; tượng trùng đổi thành "legendary marks" để mua tượng vạn năng ở Tavern Shop (2 nguồn).
- *UI/UX:* quán rượu trong thành hiện bong bóng khi có rương miễn phí; màn hình 2 rương lớn kèm đồng hồ miễn phí, nút "Mở ×1 / ×10", hoạt ảnh lật 4 thẻ, bảng tỉ lệ.
- *Giữ chân:* nghi thức hằng ngày (quay lại lấy rương free), cảm giác "trúng vàng", bảo hiểm (pity) chống nản.
- **Tu tiên hoá:** **Vấn Duyên Đài / Chiêu Hiền Đài** — Ngân Duyên Phù (rương bạc), Kim Duyên Phù (rương vàng), Luyện Khí Phù (rương trang bị); **Thiên Cơ Các** (Legendary Tavern) chỉ mở trong mùa giới.
- **Game mình:** ❌ — cố ý (PLAN §1: không gacha lớn, không bán sức mạnh PvP). Gần nhất là rương nhiệm vụ ngày và tuần (đan dược).
- **Ưu tiên:** P1 cho phần rương miễn phí hằng ngày có bảo hiểm; bán chìa là P2 và cần quyết định kinh doanh, pháp lý, công khai tỉ lệ · **Công sức:** M.

#### 2.5 Cấp tướng và EXP

**Tên gốc (EN):** Commander Level & EXP (Tome of Knowledge)
- *Cơ chế:*
  - Cấp 1–60; trần theo sao: 1★ tới cấp 10, 2★ tới 20 … 6★ tới 60 (3 nguồn). Lên sao ở cấp 10, 20, 30, 40, 50.
  - Nguồn EXP: đánh man tộc, pháo đài man tộc (ví dụ pháo đài cấp 5 khoảng 46.000 EXP, 1 nguồn), Holy Site Guardians (không tốn AP), Expedition, sự kiện.
  - Sách EXP (Tome of Knowledge): 100 / 500 / 1.000 / 5.000 / 10.000 / 20.000 / 50.000 EXP (codexhelper).
  - Lohar tăng EXP cho mọi tướng trong đội sau khi hạ man tộc: 70% ở cấp kỹ năng 5 theo heaven-guardian, riseofkingdomsguides ghi 35% — **mâu thuẫn**. Mẹo phổ biến: Lohar làm tướng chính, tướng cần luyện làm tướng phụ.
  - Tổng EXP để tướng huyền thoại lên cấp 60 khoảng 47,86 triệu (1 nguồn); bậc thấp hơn cần ít hơn.
  - Cấp tướng chính quyết định phần lớn sức chứa quân (mục 2.25), mỗi cấp thêm 1 điểm thiên phú.
- *UI/UX:* thanh EXP dưới chân dung; nút "Dùng sách" chọn số lượng, tự đề xuất đủ để chạm trần.
- *Giữ chân:* lên nhanh lúc đầu rồi chậm dần; sách EXP là phần thưởng sự kiện dễ hiểu.
- **Tu tiên hoá:** cảnh giới trưởng lão (60 tầng chia 6 đại cảnh, trùng với 6 sao); sách EXP = Bồi Nguyên Đan, ngọc giản truyền công.
- **Game mình:** ✅ — cấp 1–40 (EXP cần = 50·n·(n−1), cấp 40 là 78.000); EXP chỉ có khi thắng trận PvE, độ kiếp hoặc làm hộ pháp; Bồi Nguyên Đan +400 EXP mỗi viên; mỗi cấp +4% công và máu cả đội (cấp 40: +156%).
- **Ưu tiên:** P2 · **Công sức:** S (nâng trần hoặc đổi đường cong khi thêm sao).

#### 2.6 Sao và thăng sao

**Tên gốc (EN):** Star Promotion (Starlight Sculptures, Luck)
- *Mở khoá:* khi tướng chạm trần cấp của số sao hiện tại.
- *Cơ chế:*
  - 6 sao; mỗi sao nâng trần thêm 10 cấp. Kỹ năng thứ k mở khi tướng đạt k★, tới 4★ (3 nguồn khớp nhau). Sao 5 và 6 cho thêm 5 và 10 điểm thiên phú (1 nguồn, khớp tổng 74 = 59 + 5 + 10).
  - Nguyên liệu: tượng sao (Starlight Sculpture) cùng độ hiếm, có 3 loại: thường, blessed, bundle. Codexhelper ghi thường 100 EXP sao / 10% may mắn, blessed 400 / 20%, bundled 800 / 5% (1 nguồn, có thể chỉ cho một bậc hiếm). Theo appamped, dùng được cả tượng tướng (1 nguồn).
  - "May mắn" là xác suất chí mạng; chí mạng thì EXP sao nhân đôi. Mẹo: nạp từng ít một để chờ chí mạng (2 nguồn).
  - Tướng phụ chỉ gắn được khi tướng chính đạt từ 3★ (2 nguồn).
- *UI/UX:* màn "Thăng sao" có thanh EXP sao, ô đặt nguyên liệu, % may mắn; hoạt ảnh sao sáng dần.
- *Giữ chân:* trò canh chí mạng (mini-gamble); mốc mở kỹ năng mới.
- **Tu tiên hoá:** **Đạo Cơ phẩm 1–6** — "Tinh Thần Thạch" (thường / phúc / đại), ngộ tính (may mắn); chí mạng là "đốn ngộ" khi phá bình cảnh.
- **Game mình:** ❌ — trưởng lão chỉ có cấp; bị động mở ở cấp 5 và 12.
- **Ưu tiên:** P1 · **Công sức:** M.

#### 2.7 Tượng tướng và nâng kỹ năng

**Tên gốc (EN):** Commander Sculptures & Skill Upgrade (Skill Reset)
- *Cơ chế:*
  - Mỗi tướng có tượng riêng; có thêm tượng vạn năng theo độ hiếm.
  - 10 tượng để triệu hồi. Nâng 4 kỹ năng từ cấp 1 lên 5 là 16 lần nâng: tổng 690 tượng (huyền thoại), 440 (sử thi), 340 (tinh anh), 240 (cao cấp) (3 nguồn).
  - Chuỗi của huyền thoại, suy ra từ các mốc 50 / 190 / 380 / 690 (heaven-guardian) và khớp bảng của riseofkingdomsguides: 10, 10, 15, 15, 30, 30, 40, 40, 45, 45, 50, 50, 75, 75, 80, 80.
  - Mỗi lần nâng chọn **ngẫu nhiên** một kỹ năng đã mở và chưa tối đa (2 nguồn). Mẹo "5-1-1-1": nâng kỹ năng 1 lên 5 khi còn 1★ rồi mới lên sao. Các mốc hay nhắc: 5-1-1-1, 5-5-1-1, 5-5-5-1, 5-5-5-5.
  - Có vật phẩm Skill Reset để đặt lại kỹ năng; từ bản 1.0.85 dùng được cả cho tướng đã expertise (mức hoàn trả chưa xác minh).
- *UI/UX:* tab Kỹ năng có 4–5 ô với cấp 1–5; nút "Nâng kỹ năng (x tượng)"; hoạt ảnh vòng quay chọn kỹ năng.
- *Giữ chân:* nơi tiêu tài nguyên dài hạn; yếu tố ngẫu nhiên tạo hồi hộp; "5-5-5-5" là mốc để khoe.
- **Tu tiên hoá:** **Hồn ấn** (tàn hồn, tín vật của trưởng lão) dùng để "ngộ công pháp", mỗi lần ngẫu nhiên đốn ngộ một môn; mỗi công pháp 5 tầng: Sơ Khuy → Tiểu Thành → Đại Thành → Viên Mãn → Hoá Cảnh.
- **Game mình:** ❌ — công pháp cố định; sức công pháp chỉ tăng qua nhánh thiên phú "đạo" (+6% mỗi điểm) và cấp trưởng lão.
- **Ưu tiên:** P1 · **Công sức:** M.

#### 2.8 Kỹ năng: chủ động (nộ) và bị động

**Tên gốc (EN):** Active Skill (Rage) / Passive Skills
- *Cơ chế:*
  - 1 chủ động và 3 bị động; có bị động chỉ chạy trong điều kiện riêng (ví dụ chỉ khi đồn trú).
  - **Nộ (Rage):** chủ động tung khi thanh nộ đầy, thường là 1.000, một số tướng khác mức này (2 nguồn). Nộ tích từ đánh thường (cộng đồng ước khoảng 100 mỗi đòn), phản đòn, khi bị đánh, và từ bonus của thiên phú hay trang bị (2 nguồn). Các con số cụ thể không chính thức; rokdbot khuyên không coi là luật. Nộ thừa có bị mất hay không: nguồn mâu thuẫn, chưa xác minh.
  - Khi có hai tướng, chủ động của tướng chính nổ trước, của tướng phụ nổ ngay sau (BlueStacks, 1 nguồn).
  - Các dạng hiệu ứng (theo tướng tiêu biểu):
    - sát thương trực tiếp theo "hệ số" (damage factor; Yi Seong-Gye 1.400, sau expertise 1.700);
    - AoE tới 5 mục tiêu, hình quạt hoặc hình tròn, mỗi mục tiêu thêm làm giảm 15% sát thương mỗi mục tiêu;
    - sát thương theo thời gian; hồi máu (healing factor; Lohar 450);
    - khiên (Charles Martel: hệ số 1.200 trong 4 giây);
    - tăng hoặc giảm công / thủ / tốc (Cao Cao giảm công 40% và tốc 10% trong 3 giây);
    - hồi nộ khi đánh thường (Yi Seong-Gye: 10% cơ hội hồi 50–100 nộ); tăng sát thương phản đòn;
    - trạng thái: câm lặng, tước vũ khí, làm chậm; từ bản 1.0.88 gọi thống nhất "cleanse" (xoá debuff) và "dispel" (xoá buff);
    - dạng mới 2024–2025: **combo attack** (đòn liên kích) và **smite**; một số kỹ năng chỉ có tác dụng khi đồn trú (tăng công tháp canh).
- *UI/UX:* chân dung và tên kỹ năng hiện trên bản đồ khi nổ; mô tả đầy đủ hoặc rút gọn (bản 1.0.91); video xem trước kỹ năng.
- *Giữ chân:* khoảnh khắc "nổ chiêu" là cao trào của mỗi giao tranh; nhiều build xoay quanh việc tăng nộ.
- **Tu tiên hoá:** **Chân nguyên (1.000)** tụ qua mỗi chiêu thường và mỗi lần đỡ đòn, đầy thì phát "thần thông"; bị động là "tâm pháp"; câm lặng là phong ấn linh lực; combo là liên kích; smite là thiên phạt.
- **Game mình:** 🟡 — 1 công pháp chủ động (burst / shield / heal / weaken) nổ cố định ở lượt 3, 6, 9 và 2 bị động mở ở cấp 5 và 12. Không có thanh nộ, câm lặng, sát thương theo thời gian, hay AoE theo số mục tiêu (burst đánh toàn quân địch, chia theo máu).
- **Ưu tiên:** P0 (nộ là nhịp chiến đấu của RoK) · **Công sức:** M (thay `SKILL_EVERY` bằng nộ tích theo đòn trong `fight()`, vẫn tất định, chỉnh bằng sim).

#### 2.9 Expertise (thức tỉnh)

**Tên gốc (EN):** Expertise
- *Mở khoá:* chỉ Epic và Legendary; khi cả 4 kỹ năng đạt cấp 5 (2 nguồn). Suy từ tổng 690 / 440 thì không tốn thêm tượng (chưa xác minh).
- *Cơ chế:* kỹ năng thứ 5, hoặc cường hoá một kỹ năng cũ. Ví dụ: Yi Seong-Gye đổi mưa tên từ hình quạt sang hình tròn và hệ số 1.400 → 1.700; Charles Martel +20% máu / thủ / tốc bộ binh; Lohar hồi máu sau trận 1.000 → 2.000; Cao Cao +25% công kỵ đổi −10% thủ kỵ.
- *UI/UX:* ô kỹ năng thứ 5 sáng lên khi đủ điều kiện; chân dung có dấu "đã expertise".
- *Giữ chân:* mốc "tốt nghiệp" của một tướng.
- **Tu tiên hoá:** **Bản mệnh thần thông** — khi 4 công pháp đều Viên Mãn, trưởng lão ngộ ra thần thông riêng.
- **Game mình:** ❌
- **Ưu tiên:** P2 · **Công sức:** M (cần nội dung cho 12 trưởng lão).

#### 2.10 Thiên phú

**Tên gốc (EN):** Talents (3 Talent Trees, 74 points, Talent Reset)
- *Cơ chế:*
  - 1 điểm mỗi cấp (cấp 2–60 là 59 điểm), cộng 5 ở 5★ và 10 ở 6★ = tối đa 74 điểm (4 nguồn).
  - 3 cây theo 3 chuyên môn; 74 điểm không đủ lấp cả 3 cây nên phải chọn cây chính. Chỉ **tướng chính** dùng thiên phú, tướng phụ không (4 nguồn).
  - Nút cuối cây có hiệu ứng mạnh; ví dụ với bộ binh: tăng máu và thủ, tăng nộ, giảm sát thương nhận.
  - Đặt lại bằng vật phẩm Talent Reset hoặc gem (khoảng 1.000 gem theo 1 nguồn). Có thể lưu nhiều bộ thiên phú cho cùng một tướng (có; số trang chưa xác minh). Từ bản 1.0.88, mỗi nút hiện % người chơi đã chọn.
  - Build theo việc: dã chiến, kết trận, đồn trú, man tộc, thu thập.
- *UI/UX:* 3 cây nhánh; chạm nút xem hiệu ứng, bấm "+" để cộng điểm; nút đặt lại; lưu và tải bộ. Công cụ ngoài (Talent Tree Planner, MetaRoK với bộ 74 điểm) rất phổ biến.
- *Giữ chân:* theorycraft không hồi kết; chia sẻ build.
- **Tu tiên hoá:** **Linh căn ba mạch** theo 3 "đạo" của trưởng lão; Tẩy Tủy Đan để đặt lại; "đồ phổ" là bộ thiên phú đã lưu.
- **Game mình:** 🟡 — 1 điểm mỗi 5 cấp (cấp 40 có 8 điểm), 3 nhánh chung: công (+3% công mỗi điểm), thể (+4% máu), đạo (+6% sức công pháp); tối đa 5 điểm mỗi nhánh; Tẩy Tủy Đan (mở ở tầng 16) đặt lại. Không có cây riêng, nút đặc biệt, hay lưu bộ.
- **Ưu tiên:** P1 · **Công sức:** L (nội dung cây và UI cây).

#### 2.11 Cặp tướng chính và phụ

**Tên gốc (EN):** Primary / Secondary Commander
- *Mở khoá:* tướng chính đạt từ 3★ (2 nguồn).
- *Cơ chế:*
  - Tướng chính quyết định thiên phú và sức chứa quân (theo cấp). Hiểu biết chung cho rằng chỉ trang bị của tướng chính có hiệu lực — chưa xác minh.
  - Tướng phụ: chỉ các kỹ năng đã mở có tác dụng, kể cả chủ động; thiên phú và chuyên môn không có tác dụng (4 nguồn). Mẹo: tướng phụ chỉ cần lên cấp 30 (4★) là mở đủ 4 kỹ năng.
  - Cặp tiêu biểu (riseofkingdomsguides): bộ binh Charles Martel + Sun Tzu; kỵ Alexander Nevsky + Joan of Arc; cung Henry V + Ashurbanipal; đồn trú Gorgo + Constantine; kết trận kỵ Alexander Nevsky + Justinian; dã chiến Æthelflæd + Sun Tzu; man tộc Cao Cao + Belisarius; Lohar + tướng cần luyện.
- *UI/UX:* màn tạo đội có 2 ô chân dung (chính to, phụ nhỏ), nút đổi chỗ, gợi ý cặp.
- *Giữ chân:* số tổ hợp bùng nổ; mỗi tướng mới làm mới meta.
- **Tu tiên hoá:** **Chủ trận nhãn + Phó trận nhãn** (song tu trận); PLAN đã có ý "P3 thêm phó".
- **Game mình:** ❌ — mỗi đội 1 trưởng lão; phó trưởng lão có trong kế hoạch P3 nhưng chưa làm.
- **Ưu tiên:** P0 · **Công sức:** M (`Side` có 2 công pháp và bị động của phó; UI 2 ô; chỉnh bằng sim).

#### 2.12 Truyện tướng, Trust, giao diện danh sách

**Tên gốc (EN):** Commander Stories / Trust page / Roster QoL
- *Cơ chế:* truyện tướng có lồng tiếng cho các tướng mới (Theodora, Justinian I, Björn, Harald, Ragnar, Stephen III, Pericles…); trang Trust (đổi mô hình cũ / mới); 8 tướng cũ được làm lại mô hình (bản 1.0.88); video xem kỹ năng và mô tả rút gọn (1.0.91); yêu thích và ghim (1.0.87).
- Trong các nguồn đã đọc không thấy hệ "Commander Chronicle" riêng; gần nhất là Stories / Trust và Museum (mục 2.13).
- *Giữ chân:* gắn cảm xúc với nhân vật; tướng cũ được "làm mới".
- **Tu tiên hoá:** "Liệt truyện trưởng lão" kèm "hảo cảm / tâm cảnh" (mở truyện, đổi y phục).
- **Game mình:** 🟡 — mỗi trưởng lão có tên, danh hiệu, tên công pháp, chân dung vẽ tay và dòng "cách thu nhận"; chưa có truyện hay hảo cảm.
- **Ưu tiên:** P2 · **Công sức:** S–M.

#### 2.13 Museum (Season of Conquest)

**Tên gốc (EN):** Museum — Exhibits & Relics
- *Mở khoá:* công trình ra mắt cùng Season of Conquest; chỉ có hiệu lực trong mùa đó, tiến độ khôi phục ở mùa sau.
- *Cơ chế:*
  - Mở "Exhibit" (gian trưng bày) của tướng: ban đầu 14 tướng huyền thoại, sau thêm Attila, Takeda… Tiền là Exhibit Coins, giá tăng dần; Æthelflæd miễn phí.
  - Mua Relic (di vật) bằng Relic Coins để buff riêng cho tướng đó khi làm chính hoặc phụ: công quân +15–30%, sát thương kỹ năng +3–5%, máu +10–20%, giảm sát thương +3–10%, tốc +5–10%. Ví dụ Frederick: công +25%, giảm sát thương kỹ năng +10%.
  - Gỡ một exhibit hoàn lại 70 Exhibit Coins (1 nguồn, cộng ghi chú bản 1.0.81 và 1.0.86).
- *Giữ chân:* làm tướng cũ dùng lại được, chống cảm giác "tướng lỗi thời"; có phần trả phí.
- **Tu tiên hoá:** **Anh Linh Điện** của giới — thờ di vật tiền bối, chỉ linh nghiệm trong mùa giới.
- **Game mình:** ❌ — đã có mùa 49 ngày, nhưng không có buff theo trưởng lão trong mùa.
- **Ưu tiên:** P2 · **Công sức:** M.

#### 2.14 Đổi tướng (Commander Swap)

**Tên gốc (EN):** Commander Swap (swap tickets)
- *Cơ chế:* sự kiện dùng "vé đổi" để chuyển tiến độ kỹ năng từ tướng này sang tướng khác. Giá 2–120 vé tuỳ chênh lệch kỹ năng; shop gem bán 120 vé mỗi sự kiện với giá 12.000 gem; gói Fresh Faces 12 vé giá 5 USD, mua tối đa 10 lần (codexhelper, 1 nguồn).
- *Giữ chân:* giảm hối tiếc khi đầu tư nhầm tướng; người chơi dám nuôi tướng mới.
- **Tu tiên hoá:** **Truyền công** — chuyển tu vi công pháp từ trưởng lão này sang trưởng lão khác.
- **Game mình:** ❌ (chỉ cần khi đã có hồn ấn và nâng công pháp).
- **Ưu tiên:** P2 · **Công sức:** S.

#### 2.15 Tướng Prime và Artifact

**Tên gốc (EN):** Prime Commanders / Commander Artifacts
- *Cơ chế:* bản làm lại hạng huyền thoại của tướng cũ: Sun Tzu Prime, Belisarius Prime, Joan of Arc Prime, Hermann Prime, Ragnar Lodbrok Prime; Scipio và Boudica có bản Legendary. Artifact là vật riêng của tướng; ví dụ Megingjörð của Prime Ragnar làm mọi kỹ năng của ông áp cho mọi loại quân (bản 1.0.87).
- *Giữ chân:* tướng người chơi đã yêu được "hồi sinh" mạnh hơn.
- **Tu tiên hoá:** "Chân thân / chuyển thế" của trưởng lão cũ; "bản mệnh pháp bảo".
- **Game mình:** ❌
- **Ưu tiên:** P2 · **Công sức:** M.

### B. Trang bị và đội hình

#### 2.16 Lò rèn và trang bị

**Tên gốc (EN):** Blacksmith / Commander Equipment (materials, blueprints, sets)
- *Mở khoá:* công trình Blacksmith (cấp Tòa thị chính cần để mở chưa xác minh).
- *Cơ chế:*
  - 8 ô: vũ khí, mũ, giáp, găng, quần, giày và 2 phụ kiện (2 nguồn).
  - Độ hiếm: Normal → Advanced → Elite → Epic → Legendary (2 nguồn).
  - 4 loại nguyên liệu: da, quặng sắt, gỗ mun, xương thú, mỗi loại 5 phẩm; gộp 4 cái cùng loại thành 1 cái phẩm trên (2 nguồn); có rương chọn nguyên liệu.
  - Nguồn nguyên liệu: rơi từ man tộc và pháo đài, rương trang bị ở Tavern, sự kiện (Artisan's Forge, Holy Knight's Treasure, Hunt for History…). Blacksmith tự sản xuất ngẫu nhiên theo thời gian (chi tiết chưa xác minh).
  - Chế tạo cần bản vẽ, nguyên liệu và vàng: Advanced / Elite khoảng 1–3 triệu vàng, Epic khoảng 5–8 triệu, Legendary khoảng 15–50 triệu (1 nguồn).
  - Thưởng bộ 2 / 4 / 6 món. Ví dụ bộ Windswept: 2 món +2% công, 4 món +4% tốc hành quân. Bộ cung Dragon's Breath, bộ kỵ Hellish Wasteland, bộ bộ binh Eternal Empire (1 nguồn; số cụ thể của từng bộ chưa xác minh).
  - "Đặc tài" (special talent): món có đặc tài trùng một chuyên môn của tướng thì mạnh thêm 30% (thuộc tính Iconic ghi rõ +30%, 2 nguồn); tinh luyện giúp đạt đặc tài khớp. Cơ chế chế tạo chí mạng chưa xác minh.
  - Trang bị Engineering cho quân công thành (bản 1.0.81). Tháo trang bị hoàn lại một phần nguyên liệu (tỉ lệ chưa xác minh).
- *UI/UX:* Blacksmith có tab chế tạo lọc theo ô, phẩm, bộ; nguyên liệu thiếu hiện đỏ; tướng có hình nhân 8 ô; công cụ ngoài so sánh 2 bộ trang bị.
- *Giữ chân:* săn nguyên liệu cho việc đánh man tộc một mục tiêu; thưởng bộ gắn với build.
- **Tu tiên hoá:** **Luyện Khí Phòng** — linh tài (Huyền Thiết, Yêu Bì, Linh Mộc, Yêu Cốt), đồ phổ luyện khí; 8 ô: kiếm hay pháp khí, quan, đạo bào, hộ uyển, hộ tất, vân hài, 2 ngọc bội / giới chỉ; bộ pháp bảo (ví dụ "Chu Tước bộ" cho pháp tu, "Huyền Vũ bộ" cho thể tu).
- **Game mình:** 🟡 — Luyện Khí Phòng (tầng 8): 9 pháp bảo tất định, mỗi món 1 bonus, cấp tối đa ⌈tầng / 2⌉ và không quá 10; mỗi trưởng lão đeo 1 món; chỉ tốn tài nguyên và thời gian (cố ý không rơi đồ).
- **Ưu tiên:** P1 · **Công sức:** L.

#### 2.17 Tinh luyện, Thức tỉnh, Iconic

**Tên gốc (EN):** Refinement / Awakening (Iconic I–V) / Iconic Crystals
- *Cơ chế:*
  - **Tinh luyện:** tới "3 lần tinh luyện" (thang 100); có may rủi (tốt nhất / trung bình / xấu nhất); hướng tới đặc tài khớp (codexhelper, heaven-guardian).
  - **Thức tỉnh / Iconic I–V:** tốn Iconic Crystal, nguyên liệu, bản vẽ và vàng; chắc chắn thành công. Mỗi crystal tăng thuộc tính gốc của quân: 1 điểm (KvK mùa 1–2), 2 (mùa 3), 3 (SoC); đặc tài khớp +30% (2 nguồn). Iconic V có hiệu ứng riêng (Shattering Strike, Perplexing Ploy, Wily, Bewildering Barrage); bản 1.0.91 mở rộng để tác dụng lên combo và smite.
  - Crystal lấy từ Artisan's Forge, Crystal Quest, Lost Canyon Shop và 12 thành tựu trang bị (trần 6 crystal cũ nay đã bỏ).
  - Thứ tự nâng hay khuyên: phụ kiện (máu toàn quân) trước, rồi vũ khí và găng.
- *Giữ chân:* nơi tiêu tài nguyên cuối game; hiệu ứng Iconic V tạo cảm giác "thần khí".
- **Tu tiên hoá:** **Tế luyện** (tinh luyện) và **Khai linh / thức tỉnh khí linh** (Iconic) bằng "Khí Linh Tinh".
- **Game mình:** ❌ — chỉ nâng cấp tuyến tính.
- **Ưu tiên:** P2 · **Công sức:** M.

#### 2.18 Đội hình, Armament, Inscription

**Tên gốc (EN):** Formations / Armaments / Inscriptions (State Forum)
- *Cơ chế:*
  - 7 đội hình (1 nguồn). Tên đã xác minh: Wedge, Hollow Square, Echelon, Delta. Delta ra ở bản 1.0.85: +10% sát thương combo. Tên còn lại chưa xác minh.
  - Mỗi đội hình có armament riêng. Ô đã xác minh: Flag, Scroll (thường được nói là 4 ô, chưa xác minh đủ). Armament cho chỉ số cơ bản cộng inscription.
  - Inscription có 3 tầng: thường, hiếm (rare), đặc biệt (special); special gắn với đội hình và rất mạnh. Bảo hiểm: 9 món rare liên tiếp thì món rare kế tiếp thành special. Có wishlist. Conversion Stone đổi armament huyền thoại sang đội hình khác (inscription đổi theo; bản 1.0.90). Tên inscription (bản 1.0.86): Enraged, Tremors, Calm, Devious, Brawler, Daring, Artisan, Furious (trước tên là Combo).
  - Nguồn: State Forum — du hành 20 lượt/ngày bằng AP cộng 120 lượt bằng gem; phái sứ tối đa 6 lượt/ngày ở cấp 18; Armament Shop; rương; sự kiện; tiền "Sage's Testimony"; tái chế armament thành xu (2 nguồn).
  - Tổng buff từ armament ngang hoặc hơn trang bị (1 nguồn). Một đội hình dùng được cho nhiều đội.
- *UI/UX:* chọn đội hình ngay ở màn tạo đội; tab Armament có các ô và bảng inscription.
- *Giữ chân:* thêm một lớp tối ưu; RNG của inscription.
- **Tu tiên hoá:** **Trận pháp** — Phong Thỉ (Wedge), Phương Viên (Hollow Square), Nhạn Hành (Echelon), Tam Tài (Delta), cùng Yển Nguyệt, Hạc Dực, Trường Xà; armament là **trận khí** (trận kỳ ~ Flag, trận đồ ~ Scroll, trận bàn, pháp chung); inscription là **trận văn**; State Forum là **Vân Du Đường** (vân du, sai phái đệ tử).
- **Game mình:** ❌ — PLAN §4: trận đánh gộp theo nhóm, không có đội hình hay vị trí; chỉ thêm khi người chơi đòi.
- **Ưu tiên:** P2 · **Công sức:** L.

#### 2.19 Lưu cấu hình đội

**Tên gốc (EN):** Troop Loadout / March Presets
- *Cơ chế:* lưu tối đa 45 cấu hình đội, gồm tướng, armament và trang bị (bản 1.0.81).
- *Giữ chân:* bớt thao tác lặp khi có nhiều tướng, đội hình và việc.
- **Tu tiên hoá:** "Trận đồ lưu sẵn".
- **Game mình:** ❌ — mỗi lần xuất quân chọn trưởng lão và kéo số đệ tử (có tỉ lệ thắng ước lượng ngay dưới).
- **Ưu tiên:** P2 · **Công sức:** S.

### C. Quân

#### 2.20 Bốn loại quân và khắc chế

**Tên gốc (EN):** Troop Types — Infantry / Cavalry / Archer / Siege; Counters
- *Cơ chế:*
  - Bộ binh: thủ và máu cao, đỡ đòn. Kỵ binh: nhanh nhất. Cung thủ: công cao. Công thành: tải lớn nhất, mạnh khi đánh công trình, kém khi dã chiến (2 nguồn).
  - Vòng khắc: Bộ > Kỵ > Cung > Bộ (2 nguồn); công thành nằm ngoài vòng (1 nguồn ghi "yếu trước mọi loại"). % thưởng khắc chế: chưa xác minh.
  - Tốc độ: Kỵ > Cung > Bộ > Công thành (1 nguồn); đội đi theo tốc của loại chậm nhất (1 nguồn).
  - Có thể trộn quân; nhiều tướng buff riêng cho quân hỗn hợp (Integration, Leadership).
- *UI/UX:* icon loại quân; màn tạo đội hiện tốc, tải, sức mạnh.
- **Tu tiên hoá:** Thể tu = bộ binh, Kiếm tu = kỵ binh, Pháp tu = cung thủ — khớp đúng vòng khắc đang có (Kiếm > Pháp > Thể > Kiếm tương ứng Kỵ > Cung > Bộ > Kỵ). Công thành = **Khôi Lỗi / Trận Khí sư** (phá Hộ Sơn Đại Trận).
- **Game mình:** ✅ 3 hệ, khắc ×1,3 / ×0,8, bảng mục tiêu ghi rõ hệ nên dùng. ❌ loại thứ 4. ❌ tốc độ và tải theo hệ (sức mang chỉ theo bậc).
- **Ưu tiên:** loại công thành P2 · M; tốc và tải theo hệ P1 · S.

#### 2.21 Năm bậc quân và chỉ số

**Tên gốc (EN):** Troop Tiers T1–T5 (base stats)
- *Cơ chế:* bảng chỉ số gốc (gamesguideinfo, 1 nguồn; cung T4–T5 trong CSDL là bản Trung Hoa Chu-Ko-Nu, T4–T5 đổi theo văn minh):

| Loại | T1 | T2 | T3 | T4 | T5 |
|---|---|---|---|---|---|
| Bộ binh (công / thủ / máu · tải) | Warrior 62 / 120 / 120 · 7 | Swordsman 128 / 125 / 125 · 11 | Spearman 163 / 158 / 155 · 12 | Long Swordsman 192 / 192 / 187 · 13 | Royal Guard 220 / 212 / 216 · 15 |
| Cung thủ | Slinger 60 / 123 / 120 · 6 | Bowman 125 / 128 / 128 · 8 | Composite Bowman 158 / 155 / 163 · 9 | Chu-Ko-Nu 192 / 202 / 187 · 11 | Elite Chu-Ko-Nu 221 / 227 / 212 · 13 |
| Kỵ binh | Horseman 60 / 120 / 120 · 5 | Light Cavalry 128 / 125 / 125 · 7 | Heavy Cavalry 158 / 163 / 155 · 8 | Knight 187 / 192 / 192 · 10 | Royal Knight 220 / 212 / 216 · 12 |
| Công thành | Battering Ram 60 / 120 / 120 · 20 | Arcuballista 125 / 128 / 125 · 22 | Mangonel 163 / 155 / 155 · 24 | Ballista 192 / 192 / 187 · 26 | Trebuchet 220 / 216 / 212 · 30 |
| Sức mạnh mỗi lính | 1 | 2 | 3 | 4 | 10 (2 nguồn) |

  - Nhận xét: T5 so với T1 chỉ hơn khoảng ×3,5 công và ×1,8 thủ / máu, nhưng sức mạnh ×10 và KP ×100. Giá trị bậc cao nằm ở hiệu suất trên mỗi chỗ trong đội (vì đội có trần) và ở điểm số.
  - Quân đặc thù theo văn minh ở T4–T5 (Legionary La Mã, Samurai Nhật, Chu-Ko-Nu Trung Hoa…), chỉ số lệch về một hướng (2 nguồn). Tên cung T5 chung là Royal Crossbowman.
- *UI/UX:* màn huấn luyện có thẻ từng bậc kèm chỉ số và chi phí.
- **Tu tiên hoá:** Ngoại môn / Nội môn / Chân truyền / Hạch tâm / Thánh tử (đã có); đệ tử đặc thù theo đạo thống ở bậc 4–5.
- **Game mình:** ✅ 5 bậc, mở ở Diễn võ trường tầng 1 / 5 / 10 / 16 / 21; chỉ số ×1 / 2,2 / 4,4 / 8 / 14; chi phí ×1 / 2,6 / 5,8 / 11 / 20; thế lực 1 / 3 / 8 / 18 / 36. ❌ đệ tử đặc thù theo đạo thống. Lưu ý cân bằng: chênh bậc của mình lớn hơn RoK nhiều (×14 so với ×3,5).
- **Ưu tiên:** giữ nguyên; đệ tử đặc thù P2 · **Công sức:** M.

#### 2.22 Huấn luyện

**Tên gốc (EN):** Training — Barracks / Stable / Archery Range / Siege Workshop
- *Cơ chế:*
  - 4 nhà lính cho 4 loại quân, mỗi nhà một hàng đợi riêng, tức 4 hàng song song (hiểu biết chung, chưa xác minh). Số lính mỗi lượt tăng theo cấp nhà (CSDL ghi +2.000 ở cấp tối đa, chưa rõ nghĩa, chưa xác minh).
  - Chi phí và thời gian mỗi lính: T1 bộ 50 lương + 50 gỗ, 15 giây; T5 bộ 800 lương + 800 gỗ + 400 vàng, 120 giây; T5 kỵ 800 lương + 600 đá + 400 vàng (2 nguồn, tính ra khớp nhau).
  - Tăng tốc: nghiên cứu Military Discipline +20%; VIP 10 +15% tốc huấn luyện (1 nguồn).
  - Mở bậc: T2–T5 cần nghiên cứu ở Academy (mục 2.42). T5 cần Tòa thị chính 25, Academy 25, cùng Combat Tactics, Defensive Formation, Herbal Medicine cấp 10 và Cartography cấp 5 (2 nguồn); cần khoảng 1.000 tốc lực vạn năng cho lần mở T5 đầu tiên (1 nguồn).
  - Sự kiện gắn với huấn luyện (giai đoạn huấn luyện của MGE, Arms Training) biến tốc lực thành điểm.
- *UI/UX:* chạm nhà lính → chọn bậc → thanh trượt số lượng → "Huấn luyện" hoặc "Huấn luyện ngay" (gem); quân xong hiện bong bóng để thu.
- **Tu tiên hoá:** Diễn Võ Trường (thể tu), Kiếm Các (kiếm tu), Pháp Đàn (pháp tu), Khôi Lỗi Phường (công thành).
- **Game mình:** 🟡 — 1 nhà (Diễn võ trường) cho cả 3 hệ, 1 hàng đợi; mỗi lượt 20 + 20 × tầng (tầng 25 được 520); mỗi hệ ăn chủ yếu một loại tài nguyên; tiên minh giúp được.
- **Ưu tiên:** P2 · **Công sức:** S (thêm hàng đợi; PLAN đã ghi "thêm 1 hàng đợi" là món có thể bán).

#### 2.23 Nâng bậc quân

**Tên gốc (EN):** Troop Upgrade (promotion)
- *Cơ chế:* đổi lính bậc thấp lên bậc cao, trả phần chênh lệch chi phí và thời gian. Nâng T4 lên T5 là cách hiệu quả nhất để lấy điểm trong sự kiện tăng sức mạnh (1 nguồn; chi tiết "trả chênh lệch" theo hiểu biết chung, chưa xác minh).
- *Giữ chân:* quân cũ không thành đồ bỏ; bậc mới mở có ngay đội hình.
- **Tu tiên hoá:** **Thăng môn** (ngoại môn qua khảo hạch lên nội môn).
- **Game mình:** ❌
- **Ưu tiên:** P1 · **Công sức:** S.

#### 2.24 Hàng đợi hành quân

**Tên gốc (EN):** March Queues
- *Cơ chế:* ban đầu 1 đội; có thêm đội ở Tòa thị chính cấp 5 / 11 / 17 / 22, tối đa 5 (2 nguồn).
- **Tu tiên hoá:** số đội xuất quân theo cảnh giới chưởng môn (đã có).
- **Game mình:** ✅ 1–5 đội theo cảnh giới (tầng 1 / 6 / 11 / 16 / 21), gần như trùng với RoK.
- **Ưu tiên:** — (đã có).

#### 2.25 Sức chứa một đội

**Tên gốc (EN):** Troop Capacity (march size); Army Expansion
- *Cơ chế:*
  - Mỗi đội có trần quân, chủ yếu theo cấp (và sao) của tướng chính cộng cấp Tòa thị chính (2 nguồn, định tính). Con số cụ thể chưa xác minh; một kết quả tìm kiếm nêu khoảng 50.000 ở cấp 60 / 6★.
  - Cộng thêm từ thiên phú (Leadership, Conquering…), kỹ năng (Frederick I, Julius Caesar +15%; Scipio, Osman, Mehmed +10%; Centurion +5% — số theo CSDL cũ), VIP 14 +5% (2 nguồn), vật phẩm Army Expansion (+25% / +50% trong 4 giờ theo 2 hướng dẫn có thể chép nhau; chưa xác minh chính thức).
  - Kết trận có sức chứa riêng theo Castle (mục 2.33).
- *UI/UX:* thanh "x / trần" ở màn tạo đội; nút tự điền.
- *Vì sao quan trọng:* buộc chọn quân bậc cao, cho cấp tướng giá trị, và làm kết trận có nghĩa (một người không mang hết quân).
- **Tu tiên hoá:** **Trận dung** — số trận cơ (đệ tử) một trận nhãn khống chế được, theo cảnh giới trưởng lão; vật phẩm mở rộng là "Khuếch Trận Kỳ".
- **Game mình:** ❌ — một đội mang được mọi đệ tử đang có (`armyError` chỉ kiểm có đủ quân hay không).
- **Ưu tiên:** P0 · **Công sức:** M (trần theo cấp trưởng lão và công pháp; phải chỉnh lại sim, PvP và bot).

#### 2.26 Sức mạnh và chi phí duy trì

**Tên gốc (EN):** Power / Upkeep
- *Cơ chế:* sức mạnh mỗi lính T1 1, T2 2, T3 3, T4 4, T5 10 (2 nguồn). Tổng sức mạnh gồm công trình, nghiên cứu, quân, tướng, trang bị (hiểu biết chung). Theo hiểu biết chung, RoK không có hao lương theo giờ cho quân; chi phí nằm ở huấn luyện, chữa và tốc lực (chưa thấy nguồn nào nêu upkeep; chưa xác minh).
- **Tu tiên hoá:** "Thế lực" (đã có).
- **Game mình:** ✅ Thế lực (đệ tử 1 / 3 / 8 / 18 / 36) cộng "lực chiến" ước lượng trên bảng mục tiêu; không có upkeep (khớp RoK).
- **Ưu tiên:** — (đã có).

#### 2.27 Quân theo mùa và đánh xa

**Tên gốc (EN):** Seasonal units (Skirmisher, Artillery, shifter units) / Range Attacks
- *Cơ chế:*
  - Mùa SoC "Shifting Gears": Skirmisher đánh xa (tầm bắn giảm 15% ở bản 1.0.89); Artillery có chế độ Arrow Tower (tầm −12%, thời gian đổi chế độ 20 → 12 giây); "shifter units" được tăng tốc gốc.
  - King skill "Inspire": quân cận chiến trong vùng nhận ít sát thương tầm xa hơn và phản đòn tầm xa mạnh hơn; một số hiệu ứng Iconic có bản "Ranged".
  - Năm 2022 Lilith công bố đánh xa cho cung và công thành (bộ binh đứng trước, kỵ đuổi cung); bài viết là bản thử nghiệm, mức triển khai ngoài SoC chưa xác minh.
- **Tu tiên hoá:** pháp tu đánh xa (phi kiếm, phù lục); khôi lỗi hoá thành "tháp tiễn".
- **Game mình:** ❌
- **Ưu tiên:** P2 · **Công sức:** L.

### D. Bệnh viện

#### 2.28 Bệnh viện

**Tên gốc (EN):** Hospital (capacity, healing, alliance help)
- *Cơ chế:*
  - Tối đa 4 bệnh viện. Sức chứa mỗi viện theo cấp: 3.000 (cấp 1), 14.000 (cấp 10), 44.000 (cấp 20), 75.000 (cấp 25) (bảng 1 nguồn; CSDL khác ghi +75.000 ở cấp tối đa, nên 4 viện khoảng 300.000. Nguồn bảng lại ghi "tổng 75.000" — tổng chưa xác minh).
  - Chữa tốn khoảng 40% chi phí huấn luyện (T1: 20 + 20; T5 bộ: 320 lương + 320 gỗ + 160 vàng) và nhanh hơn nhiều (T1: 15 giây → 3 giây) (1 nguồn, tỉ lệ khớp).
  - Chữa theo lô (mẹo khoảng 1.000 lính mỗi lô để xin giúp); liên minh giúp giảm thời gian, tối đa 30 lượt theo Alliance Center (1 nguồn); có tốc lực chữa riêng.
  - Đang bị kết trận đánh vào thì không chữa được cho tới khi xong (1 nguồn).
  - Viện đầy thì quân trọng thương chết (2 nguồn).
- *UI/UX:* chạm bệnh viện → danh sách thương binh theo loại và bậc, chọn số lượng từng dòng (chưa xác minh) → "Chữa" / "Chữa ngay" / xin giúp; thành hiện bong bóng khi có thương binh.
- *Giữ chân:* bệnh viện là "đệm rủi ro" — càng lớn càng dám đánh; chữa và xin giúp kéo người chơi quay lại.
- **Tu tiên hoá:** Đan Phòng; "linh sàng" là chỗ nằm.
- **Game mình:** ✅ Đan phòng: 80 + 120 × tầng chỗ (Hộ Mạch Thuật +15% mỗi cấp, 3 cấp); chữa 40% chi phí và 30% thời gian; nhận bậc cao trước; đầy thì tử trận; Hồi Xuân Đan chữa ngay 300; tiên minh giúp được. Thiếu: chọn chữa một phần (hiện luôn chữa toàn bộ), nhiều viện.
- **Ưu tiên:** chọn số chữa P2 · **Công sức:** S.

#### 2.29 Ba mức thương vong và hồi sinh sau mùa

**Tên gốc (EN):** Slightly Wounded / Severely Wounded / Dead; Hall of Heroes
- *Cơ chế:*
  - Chiến báo chia 3 mức: bị thương nhẹ (tự hồi, về cùng đội), trọng thương (vào bệnh viện), tử trận (hiểu biết chung, chưa xác minh bằng nguồn trong phiên này).
  - Tỉ lệ phụ thuộc loại trận: dã chiến thường không chết nếu viện còn chỗ; đánh pháo đài liên minh thì quân đánh chết hết, đánh cờ liên minh thì chết một phần (1 nguồn).
  - KvK: Hall of Heroes trả lại một phần quân chết — 30% ở KvK 1, 30–60% tuỳ mùa (2 nguồn); ở SoC còn hoàn một phần tài nguyên đã chữa (bản 1.0.89).
- *Giữ chân:* rủi ro phân tầng — người chơi dám đánh nhỏ, cân nhắc khi đánh thành.
- **Tu tiên hoá:** khí huyết hao tổn (tự hồi) / trọng thương (Đan phòng) / vẫn lạc; **Chiêu Hồn Điện** (Hall of Heroes) gọi về một phần hồn đệ tử khi mùa giới khép lại.
- **Game mình:** 🟡 — 2 mức: thương binh (mọi thương vong PvE) và tử trận (khi Đan phòng đầy). Không có "thương nhẹ tự hồi", không có hồi sinh cuối mùa.
- **Ưu tiên:** P1 · **Công sức:** S.

### E. Chiến đấu

#### 2.30 Giao tranh dã chiến thời gian thực

**Tên gốc (EN):** Field Battle (1-second turns, normal attack, counterattack, rage)
- *Cơ chế:*
  - Mỗi lượt 1 giây, hai bên hành động đồng thời (1 nguồn). Mỗi đội đánh thường 1 mục tiêu mỗi lượt; khi bị đánh thì phản đòn. Số lần phản đòn không giới hạn; sát thương phản đòn như đánh thường và cũng tạo nộ (2 nguồn).
  - Trận kéo dài tới khi một bên hết quân khoẻ hoặc rút. Một đội có thể bị nhiều đội đánh cùng lúc (swarm), và mỗi đội đánh sẽ ăn phản đòn.
  - Sát thương: cộng đồng suy ra tỉ lệ xấp xỉ √(số quân) nhân công / thủ và các buff (chưa có xác nhận chính thức), nên quân đông lợi ít hơn tuyến tính; buff % và bậc quân quan trọng hơn.
  - Đánh vào sườn hay sau lưng được lợi thế: chưa xác minh.
  - AI: từ bản 1.0.91, quân đang tấn công ưu tiên địch ở gần, khó bị dụ sâu vào đội hình địch.
  - Strategic View (bản 1.0.87) có danh sách mọi trận đang diễn ra trên bản đồ.
- *UI/UX:* đội quân là mô hình lính di chuyển; khi giao tranh hiện thanh máu, số sát thương, thanh nộ, chân dung khi nổ kỹ năng; chạm đội để ra lệnh Tấn công / Di chuyển / Về thành / Đồn trú; "Quick Command" (1.0.88) ra lệnh trực tiếp; tuỳ chọn chất lượng hiệu ứng.
- *Giữ chân:* thấy trận, điều khiển được, có cú lật kèo.
- **Tu tiên hoá:** "Đấu pháp trên sơn hà đồ" — mỗi đội là một đoàn kiếm quang hay pháp vân, 1 giây là 1 hiệp.
- **Game mình:** ❌ (cố ý) — trận tự động tối đa 10 lượt, giải ngay khi tới nơi, tất định theo seed, server tính; client phát lại bằng WebGL (hai đội vẽ tay, hiệu ứng riêng từng công pháp, hit-stop, rung màn). Có **tỉ lệ thắng ước lượng** trước khi đánh (RoK không có).
- **Ưu tiên:** P0 (lõi trải nghiệm RoK) · **Công sức:** L — đụng PLAN §1 "Không làm" và kiến trúc thời gian lười. Hướng trung gian: (a) giữ trận tự động nhưng cho trận "diễn" trên bản đồ giới vài chục giây để người khác thấy; (b) cho rút lui giữa chừng (giải lại theo số lượt đã qua); (c) nhiều đội vào cùng một trận theo thứ tự tới.

#### 2.31 Giao tranh nhiều bên, AoE, swarm

**Tên gốc (EN):** Multi-army Combat / AoE / Swarming
- *Cơ chế:* một đội bị nhiều đội đánh sẽ phản đòn tất cả (2 nguồn), nên tướng phản đòn (Alexander, Harald) và tướng AoE (Yi Seong-Gye cùng Genghis Khan) là "máy cày KP" (1 nguồn). AoE đánh tối đa 5 mục tiêu, mỗi mục tiêu thêm giảm 15% (Yi Seong-Gye).
- *Giữ chân:* chiến thuật "một chọi nhiều" hoặc "dồn nhiều vào một".
- **Tu tiên hoá:** "Vạn kiếm quy tông" đánh nhiều đoàn cùng lúc.
- **Game mình:** 🟡 — kết trận và đồn trú gộp nhiều đội thành một bên; yêu vương chia "lát" theo đội. Không có trận nhiều bên độc lập cùng lúc, không có AoE theo đội.
- **Ưu tiên:** P1 · **Công sức:** M.

#### 2.32 Rút lui và điều khiển giữa trận

**Tên gốc (EN):** Retreat / Return / March Control
- *Cơ chế:* lệnh về thành hoặc rút lui để thoát giao tranh khi bệnh viện sắp đầy hay bị khắc; đội bị đánh bại (hết quân khoẻ) tự quay về (hiểu biết chung; chi tiết như bị đuổi đánh khi rút chưa xác minh).
- *Giữ chân:* quyết định "đánh tiếp hay rút" là kỹ năng người chơi.
- **Tu tiên hoá:** "Độn thuật" — rút lui là độn thổ hoặc ngự kiếm về núi.
- **Game mình:** 🟡 — hết 10 lượt chưa phân thắng bại thì bên đánh tự rút; gọi về được đội đang đóng quân, khai mỏ, viện binh; không rút được giữa trận.
- **Ưu tiên:** P1 · **Công sức:** M (phụ thuộc mục 2.30).

#### 2.33 Kết trận

**Tên gốc (EN):** Rally (Castle rally capacity)
- *Cơ chế:*
  - Người mở chọn mục tiêu (thành, pháo đài man tộc, cờ và pháo đài liên minh, công trình KvK) và thời gian chờ (5 / 10 / 30 / 60 phút — chưa xác minh đủ các mốc); thành viên gửi quân vào; hết giờ thì cả đoàn đi cùng tốc độ.
  - Sức chứa kết trận theo Castle: khoảng 2.000.000 ở cấp tối đa, khoảng 2,5 triệu khi có thêm công nghệ (2 nguồn).
  - Chỉ tướng của người mở (chính, phụ, thiên phú, trang bị) có tác dụng; quân của người khác chỉ góp số (hiểu biết chung; buff riêng của từng người có tính hay không chưa xác minh).
  - Trang War hiện "đội trưởng" kết trận / đồn trú và loại quân nên dùng khi bị đánh (bản 1.0.85).
- *UI/UX:* nút "Kết trận" trên mục tiêu → chọn thời gian → báo cho liên minh; tab War liệt kê kết trận đang mở với nút "Tham gia" và chọn đội; đồng hồ đếm ngược.
- *Giữ chân:* hẹn giờ đánh cùng nhau, cảm giác "raid".
- **Tu tiên hoá:** **Kết trận** (đã có); Castle là **Điểm Tướng Đài**, quyết định trận dung khi kết trận.
- **Game mình:** ✅ 8 đội, chờ 5 / 10 / 30 phút, dùng công pháp và hành của đội mở trận; dùng để chiếm điểm và đánh yêu vương (không đánh tông môn người chơi). Thiếu: trần quân theo công trình, mốc 60 phút, kết trận đánh tông môn.
- **Ưu tiên:** P1 · **Công sức:** S.

#### 2.34 Đồn trú và tiếp viện

**Tên gốc (EN):** Garrison / Reinforcement
- *Cơ chế:* thành đặt tướng đồn trú (chính và phụ) ở Tường; đồng minh gửi quân tiếp viện, sức chứa theo Alliance Center (1 nguồn). Công trình liên minh (cờ, pháo đài) và công trình KvK có đồn trú; trận thủ do một "đội trưởng" dẫn toàn bộ quân (hiểu biết chung). Tháp canh cùng đánh, có kỹ năng tăng công / thủ tháp canh (Yi Seong-Gye, Charles Martel). Đền (Temple) trong KvK có 2.000.000 quân T5 trấn giữ (1 nguồn).
- *Giữ chân:* thủ chung là một lý do ở lại liên minh.
- **Tu tiên hoá:** trấn thủ, viện binh (đã có).
- **Game mình:** ✅ trưởng lão trấn thủ cộng Hộ Sơn Đại Trận (+4% thủ và máu mỗi tầng); viện binh tối đa 3 đội ở nhà đồng minh; tối đa 6 đội đóng mỗi điểm trên bản đồ giới.
- **Ưu tiên:** sức chứa viện binh theo công trình P2 · **Công sức:** S.

#### 2.35 Công thành: tường, tháp canh, cháy thành, dời thành, khiên

**Tên gốc (EN):** City Siege — Wall Durability / Burning / Relocation; Watchtower; Peace Shield
- *Cơ chế:*
  - Tường có độ bền. Bị đánh thắng thì thành bốc cháy, độ bền giảm dần theo thời gian (phải dập lửa, sửa); độ bền về 0 thì thành bị dịch chuyển ngẫu nhiên (2 nguồn).
  - Cờ liên minh bị đốt tự hồi sau 1 giờ, pháo đài sau 8 giờ (1 nguồn). Quân công thành mạnh khi đánh công trình và tháp canh (1 nguồn).
  - Khiên hoà bình chặn tấn công và trinh sát, có vật phẩm 8 giờ / 24 giờ / 3 ngày (chưa xác minh); tấn công người khác thì mất khiên.
- *UI/UX:* thành cháy có lửa khói trên bản đồ; nút "Dập lửa"; thông báo "Thành bị tấn công".
- *Giữ chân:* thua có hậu quả nhìn thấy được; sợ bị dời thành thì lo phòng thủ.
- **Tu tiên hoá:** Hộ Sơn Đại Trận có **trận lực** (độ bền); thua thì "trận vỡ, linh khí rò" (trận lực giảm dần); trận lực về 0 thì sơn môn "phi độn" tới nơi khác; tháp canh là **Vọng Khí Tháp** bắn tên phù.
- **Game mình:** 🟡 — Hộ Sơn Đại Trận chỉ là bonus thủ và máu; thua thì mất tài nguyên (ngoài phần kho bảo hộ 30%) và nhận khiên 8 giờ; tân thủ có khiên 72 giờ. Không có độ bền, cháy, dời núi.
- **Ưu tiên:** P1 · **Công sức:** M.

#### 2.36 Trinh sát

**Tên gốc (EN):** Scouting (Scout Camp, Tracking / Camouflage)
- *Cơ chế:* Scout Camp cử trinh sát tới mục tiêu, nhận báo cáo quân, tướng, tài nguyên. Công nghệ Tracking và Camouflage (mỗi cái 5 cấp) nâng cấp trinh sát (gamesguideinfo). Chống trinh sát: chưa xác minh.
- **Tu tiên hoá:** "Thần thức dò xét", "Thiên Nhãn phù".
- **Game mình:** ✅ dò thám: danh sách đối thủ kèm phòng thủ làm tròn (từ 50 trở lên làm tròn tới hàng chục), trưởng lão trấn thủ, tầng Hộ Sơn Đại Trận; đủ để tính tỉ lệ thắng. Không tốn lượt, bên bị dò không được báo.
- **Ưu tiên:** P2 · **Công sức:** S.

#### 2.37 Chiến báo

**Tên gốc (EN):** Battle Report
- *Cơ chế:* lưu tối đa 100 báo cáo (1 nguồn). Nội dung: thắng / thua, tướng hai bên (cấp, kỹ năng), quân từng loại (tổng, tử, trọng thương, thương nhẹ, còn lại), KP nhận được, sức mạnh mất, chi tiết sát thương theo nguồn (đánh thường / kỹ năng / phản đòn / hồi máu) — theo hiểu biết chung, chi tiết chưa xác minh. Gộp nhiều trận thành một báo cáo và đánh dấu yêu thích (bản 1.0.85); chia sẻ lên chat.
- *Giữ chân:* phân tích trận để chỉnh build; khoe trận hay.
- **Tu tiên hoá:** chiến báo (đã có).
- **Game mình:** 🟡 — chiến báo (30 gần nhất) có số đệ tử mỗi lượt, lượt nào thi triển công pháp, thương binh, tử trận, thu được; có **phát lại** WebGL (RoK không có). Thiếu: tách sát thương theo nguồn, KP, chia sẻ lên chat, yêu thích.
- **Ưu tiên:** P1 · **Công sức:** S.

#### 2.38 Điểm tiêu diệt

**Tên gốc (EN):** Kill Points (KP) / Kill Statistics
- *Cơ chế:* KP cho mỗi lính địch bị hạ (trọng thương hoặc chết): T1 0,2 · T2 2 · T3 4 · T4 10 · T5 20 (con số phổ biến trong cộng đồng; chưa đối chiếu được nguồn thứ 2 trong phiên này). Hồ sơ hiện tổng KP, số giết theo bậc T1–T5 và số quân chết (rokstats theo dõi đúng các trường này). Dùng cho xếp hạng KP, sự kiện; liên minh tự tính "DKP" (KP cộng quân chết quy đổi — thông lệ cộng đồng, không phải hệ thống trong game) để chia thưởng KvK.
- *UI/UX:* hồ sơ thống đốc → Kill Statistics (bảng T1–T5).
- *Giữ chân:* bảng điểm biến giao tranh thành thành tích; KP là "tiền tệ uy tín" trong liên minh.
- **Tu tiên hoá:** **Chiến công** (sát nghiệp) — hạ một đệ tử Thánh tử được 20 chiến công.
- **Game mình:** ❌ — có Elo tranh đoạt và các bảng xếp hạng lực chiến, tháp, sự kiện tuần.
- **Ưu tiên:** P0 · **Công sức:** S (đếm trong `fight()` hoặc chiến báo, thêm bảng xếp hạng).

#### 2.39 Danh dự (KvK)

**Tên gốc (EN):** Honor Points
- *Cơ chế:* điểm cá nhân trong KvK. Ví dụ KvK 1: thu xong mỏ 3; man tộc cấp 26–30 được 5, 31–35 được 8, 36–40 được 10; pháo đài cấp 6 / 7 / 8 / 9 / 10 được 15 / 25 / 35 / 45 / 60; giữ Ancient Ruin 15 mỗi giờ; Dark Altar 75 mỗi 2 giờ; top 1.000 có thưởng (onechilledgamer; số liệu KvK 1, có thể đã cũ). Có công cụ tính danh dự theo AP.
- *Giữ chân:* người không thích PvP vẫn có đường đóng góp (man tộc, chiếm điểm).
- **Tu tiên hoá:** **Danh vọng giới**.
- **Game mình:** 🟡 — điểm mùa theo phe (giờ giữ linh mạch, trận nhãn, Thiên Môn; hạ yêu vương); chưa có điểm cá nhân kiểu danh dự.
- **Ưu tiên:** P2 · **Công sức:** S.

#### 2.40 "Zeroing"

**Tên gốc (EN):** Zeroing (thuật ngữ người chơi)
- *Cơ chế:* dồn kết trận và nhiều đội vào thành một người tới khi quân chết sạch, viện đầy, sức mạnh tụt, tường về 0 rồi bị dời thành. Là công cụ ép hoặc trừng phạt giữa các liên minh (hiểu biết chung).
- *Giữ chân (hai mặt):* tạo drama và thù hằn thúc đẩy chơi tiếp, nhưng cũng là lý do lớn khiến người chơi bỏ game.
- **Tu tiên hoá:** "Diệt môn".
- **Game mình:** ❌ — cố ý: PvP là cướp (kho bảo hộ 30%, cướp 30% phần vượt, khiên sau khi thua, chỉ đánh người có lực chiến từ 50% mình trở lên). Nên giữ không làm.
- **Ưu tiên:** P2 (khuyên không làm) · **Công sức:** M.

#### 2.41 Man tộc, pháo đài, AP

**Tên gốc (EN):** Barbarians / Barbarian Forts / Action Points
- *Cơ chế:*
  - Man tộc cấp 1–12 quanh thành, cấp cao hơn rải khắp vương quốc và bản đồ KvK (tới cấp 40); pháo đài man tộc cấp 1–6 (KvK tới 10), đánh bằng kết trận (2 nguồn).
  - AP tối đa 1.000 (2 nguồn), hồi khoảng 1 AP mỗi 45 giây (cộng đồng). Đánh man tộc tốn 50 AP; mỗi lần đánh tiếp mà không về thành bớt 2 AP, tối đa bớt 10 (2 nguồn). Thuốc AP 50 / 100 / 500 / 1.000 (2 nguồn). Thiên phú Peacekeeping giảm AP và tăng sát thương lên man tộc.
  - Thưởng: EXP tướng, tài nguyên, tốc lực, gem, nguyên liệu trang bị; pháo đài cho Books of Covenant.
- *Giữ chân:* "xả AP" là việc đều đặn mỗi phiên; nuôi tướng và trang bị.
- **Tu tiên hoá:** yêu thú, yêu động (đã có); AP là **Tinh lực**.
- **Game mình:** 🟡 — 15 yêu thú (hạ cấp n mới mở n+1, hang hồi sau 45 phút), 5 tông môn NPC, bí cảnh, Thông Thiên Tháp, yêu vương đánh theo lát; không có AP (giới hạn bằng thời gian hồi hang và hành quân).
- **Ưu tiên:** P2 · **Công sức:** S.

### F. Nghiên cứu

#### 2.42 Academy — cây Quân sự

**Tên gốc (EN):** Academy — Military Technology
- *Mở khoá:* Academy mở ở Tòa thị chính cấp 4. Tốc nghiên cứu +0,5% ở cấp 1, +25% ở cấp 25. Cấp 25 cần Watchtower 25, Tòa thị chính 25, Trading Post 25 và một Master's Blueprint (2.000 gem) (1–2 nguồn).
- *Cơ chế:* danh sách theo CSDL gamesguideinfo (thứ tự trong CSDL, gần với thứ tự mở trên cây; điều kiện tiên quyết chưa xác minh):

| Công nghệ | Tác dụng tối đa | Số cấp |
|---|---|---|
| Military Discipline | Tốc huấn luyện +20% | 1 (theo CSDL) |
| Iron Working / Improved Fletching / Horsemanship / Flaming Projectile | Công bộ / cung / kỵ / công thành +10% | 5 |
| Swordsman / Bowman / Light Cavalry / Arcuballista | Mở quân T2 | 1 |
| Pathfinding | Tốc hành quân +15% | 5 |
| Tracking | Trinh sát cấp 1 | 5 |
| Buckler / Leather Armor / Scale Armor / Enhanced Axle | Thủ bộ / cung / kỵ / công thành +10% | 5 |
| Spearman / Composite Bowman / Heavy Cavalry / Mangonel | Mở quân T3 | 1 |
| Camouflage | Trinh sát cấp 2 | 5 |
| Combat Tactics / Defensive Formation / Herbal Medicine | Công / thủ / máu toàn quân +15% | 10 |
| Cartography | Tốc hành quân +15% | 5 |
| Long Swordsman / Crossbowman (CSDL hiện Chu-Ko-Nu) / Knight / Ballista | Mở quân T4 | 1 |
| Wootz Steel / Bodkin Arrows / Stirrups / Ballistics | Công bộ / cung / kỵ / công thành +20% | 10 |
| Scutum / Pavise / Plate Armor / Heavy Frame | Thủ bộ / cung / kỵ / công thành +20% | 10 |
| Combined Arms / Encampment / Medical Corps | Công / thủ / máu toàn quân +25% | 10 |
| Royal Guard / Royal Crossbowman (CSDL hiện Elite Chu-Ko-Nu) / Royal Knight / Trebuchet | Mở quân T5 | 1 |

  - Thời gian rất dài ở cuối cây: Combat Tactics cấp 9 khoảng 65 ngày, cấp 10 khoảng 100 ngày (1 nguồn).
- *UI/UX:* cây nút nối nhau theo hàng; nút khoá hiện điều kiện (cấp Academy, công nghệ trước); đang nghiên cứu hiện thanh tiến độ; liên minh giúp.
- *Giữ chân:* mục tiêu dài hạn; mở bậc quân mới là mốc lớn.
- **Tu tiên hoá:** nhánh **Binh Thư** trong Tàng Kinh Các; mở bậc đệ tử bằng "truyền thừa" (một công pháp mở bậc).
- **Game mình:** 🟡 — Tàng Kinh Các 28 công pháp, 7 hàng (mở ở tầng 1 / 3 / 6 / 9 / 12 / 16 / 21), mỗi môn 3–5 cấp. Nhóm quân sự: Kiếm Tâm, Pháp Tâm, Thiết Quyền Công (+5% công theo hệ mỗi cấp); Kim Cương Quyết, Kiếm Thể Quyết, Pháp Thân Quyết (+6% máu theo hệ); Trận Cơ Đại Pháp, Hộ Sơn Quyết (+5% thủ); Vạn Kiếm Trận, Thiên Ma Chiến Pháp (+4% công); Trường Sinh Quyết (+4% máu); Thần Hành Thuật (+8% tốc hành quân); Luyện Binh Pháp (+6% tốc tuyển); Hồi Xuân Quyết (+8% tốc chữa); Hộ Mạch Thuật (+15% chỗ Đan phòng, 3 cấp); Độ Kiếp Tâm Pháp. Thiếu: mở bậc quân bằng nghiên cứu (hiện mở theo tầng Diễn võ trường), điều kiện tiên quyết dạng cây, 10 cấp mỗi môn, trinh sát.
- **Ưu tiên:** P1 · **Công sức:** M.

#### 2.43 Academy — cây Kinh tế (liệt kê ngắn)

**Tên gốc (EN):** Academy — Economic Technology
- *Cơ chế:* danh sách theo CSDL gamesguideinfo (CSDL ghi mới hoàn thiện khoảng 39%, có thể thiếu các môn cuối cây):
  - Mở thu thập (1 cấp): Quarrying (đá), Metallurgy (vàng), Jewelry (gem).
  - Sản lượng: Handsaw / Irrigation / Metalworking / Chisel +15% gỗ / lương / vàng / đá (5 cấp); Sawmill / Plow / Coinage / Open Pit Quarry +55% (10 cấp).
  - Tốc thu thập: Handaxe / Sickle / Placer Mining / Handcart +15% (5 cấp); Whipsaw / Scythe / Shaft Mining / Stone Saw / Cutting and Polishing +35% (10 cấp); Machinery +25% mọi loại (10 cấp).
  - Xây và nghiên cứu: Masonry +15% xây (5), Engineering +35% xây (10), Writing +10% nghiên cứu (5), Mathematics +15% nghiên cứu (10) — đây là 4 môn được khuyên làm trước (3 nguồn).
  - Khác: Multilayer Structure +15% bảo hộ tài nguyên (5); Wheel +15% tải (5), Carriage +25% tải (10).
- **Tu tiên hoá:** nhánh **Dân Sinh / Tụ Linh** trong Tàng Kinh Các.
- **Game mình:** 🟡 — Tụ Linh Quyết, Dưỡng Thảo Thuật, Khai Sơn Quyết (+6% sản lượng từng loại mỗi cấp), Lỗ Ban Thuật (+4% tốc xây), Càn Khôn Đại (+10% kho), Linh Mạch Quyết, Thái Ất Chân Kinh (+% mọi sản lượng), Tụ Bảo Quyết (chiến lợi phẩm), Đan Đạo Tâm Kinh, Thiên Diễn Thuật, Bách Chiến Tâm Kinh (kinh nghiệm), Luyện Khí Bí Lục. Chưa có thu thập trên bản đồ theo loại hay "tải" theo nghiên cứu (khai mỏ trên bản đồ giới dùng sức mang của đội).
- **Ưu tiên:** P2 · **Công sức:** M.

#### 2.44 Crystal Tech (mùa) và công nghệ liên minh

**Tên gốc (EN):** Crystal Tech (Season of Conquest) / Alliance Technology
- *Cơ chế:* cây nghiên cứu riêng trong Lost Kingdom mùa SoC, tiền là Crystal (từ man tộc tuần tra, pháo đài, Kahar the Hidden, Trial of Kau Karuak). Ví dụ: Plunder (thêm crystal), Karaku's Gift, Surprise Strike (quân trên bản đồ gây thêm sát thương vào đồn trú và đoàn kết trận); First Aid đã bị bỏ; lượng crystal theo công nghệ Barbarian Bounties (2 nguồn). Công nghệ liên minh ví dụ Territory Guardian (tăng công khi đánh trong lãnh thổ liên minh).
- *Giữ chân:* mỗi mùa có thứ để nghiên cứu lại từ đầu, người mới không bị bỏ xa.
- **Tu tiên hoá:** **Giới Tinh Thuật** — nghiên cứu theo mùa giới, đặt lại mỗi mùa; hợp với mùa 49 ngày đang có.
- **Game mình:** ❌ — P3 có buff linh mạch cho cả minh (gần với "lãnh thổ"), chưa có cây nghiên cứu theo mùa.
- **Ưu tiên:** P2 · **Công sức:** M.

### G. Điều làm chiến đấu RoK hấp dẫn

#### 2.45 Tổng hợp và bài học cho game mình

**Tên gốc (EN):** What makes RoK combat compelling
- *Các trụ:*
  1. **Khoảnh khắc nổ chiêu** (chân dung và tên kỹ năng giữa trận) — game mình đã có trong màn phát lại: nét mực quét ngang, chân dung trong khung vàng.
  2. **Trận diễn ra ở nơi người khác nhìn thấy** — game mình giải trận ngay và chỉ người trong cuộc xem lại. Cách rẻ: cho trận "diễn" trên bản đồ giới vài chục giây và ai đang xem vùng đó đều thấy.
  3. **Quyết định giữa trận** (rút, đổi mục tiêu, dồn quân) — chưa có; xem mục 2.30 và 2.32.
  4. **Tổ hợp tướng** — cần phó trưởng lão và nộ (mục 2.8, 2.11).
  5. **Bảng điểm** (KP, quân chết) — chưa có, công sức nhỏ (mục 2.38).
  6. **Rủi ro phân tầng** (thương nhẹ / nặng / chết) — thêm "thương nhẹ tự hồi" (mục 2.29).
  7. **Liên minh** (kết trận, đồn trú, tiếp viện) — đã có.
  8. **Vòng khép kín:** thưởng giao tranh quy ra tướng và tượng — cần có "hồn ấn" (mục 2.3, 2.7).
- **Tu tiên hoá:** như từng mục ở trên.
- **Game mình:** 🟡 — có phần trình diễn (phát lại WebGL, hiệu ứng từng công pháp, tỉ lệ thắng ước lượng) nhưng thiếu phần điều khiển và bảng điểm.
- **Ưu tiên:** P0 · **Công sức:** chia theo từng mục.

---

## 3. Bảng tổng kết khoảng cách

| # | Tính năng (RoK) | Game mình | Ưu tiên | Công sức |
|---|---|---|---|---|
| 2.1 | Độ hiếm tướng (4 bậc màu) | ✅ phẩm trưởng lão (`RARITY`) | P1 | S |
| 2.2 | Chuyên môn / vai trò tướng (15+ nhánh) | 🟡 1 hệ + 1 hành, bị động có vai trò | P1 | M |
| 2.3 | Nguồn tướng đa dạng (sự kiện, VIP, shop) | ✅ cột mốc + tín vật Chiêu Hiền Đài (thiếp từ sự kiện, cửa hàng) | P1 | M |
| 2.4 | Tavern (rương tướng, bảo hiểm) | ✅ Chiêu Hiền Đài (thiếp miễn phí, bảo hiểm thiếp vàng; không bán) | P1 (free) / P2 (bán) | M |
| 2.5 | Cấp tướng 60 và sách EXP | ✅ cấp 40, Bồi Nguyên Đan | P2 | S |
| 2.6 | Sao 1–6, tượng sao, may mắn | ✅ sao 1–6 bằng tín vật (tất định, không may rủi) | P1 | M |
| 2.7 | Tượng tướng, nâng kỹ năng ngẫu nhiên, Skill Reset | ✅ tín vật: thu nhận + nâng sao (mỗi sao: công pháp +5 %, công / máu +3 %); chưa có nâng ngẫu nhiên / reset kỹ năng | P1 | M |
| 2.8 | Kỹ năng chủ động theo nộ, bị động, trạng thái | ✅ chân nguyên (tụ theo lượt + khi mất máu) | P0 | M |
| 2.9 | Expertise | ❌ | P2 | M |
| 2.10 | Thiên phú 74 điểm, 3 cây, lưu bộ | 🟡 8 điểm, 3 nhánh chung, Tẩy Tủy Đan | P1 | L |
| 2.11 | Cặp tướng chính / phụ | ✅ phó trưởng lão (tâm pháp + công pháp nửa sức) | P0 | M |
| 2.12 | Truyện tướng, Trust, giao diện danh sách | 🟡 tên, danh hiệu, chân dung | P2 | S–M |
| 2.13 | Museum (buff tướng theo mùa) | ❌ | P2 | M |
| 2.14 | Đổi tướng (Commander Swap) | ❌ | P2 | S |
| 2.15 | Tướng Prime, Artifact | ❌ | P2 | M |
| 2.16 | Lò rèn: 8 ô, nguyên liệu, bản vẽ, bộ | 🟡 9 pháp bảo tất định, 1 món mỗi trưởng lão | P1 | L |
| 2.17 | Tinh luyện, thức tỉnh, Iconic I–V | ❌ | P2 | M |
| 2.18 | Đội hình, Armament, Inscription | ❌ (PLAN §4 để sau) | P2 | L |
| 2.19 | Lưu cấu hình đội | ✅ Trận đồ (3 ô lưu trưởng lão + đệ tử) | P2 | S |
| 2.20 | Loại quân thứ 4 (công thành) | ❌ | P2 | M |
| 2.20 | Khắc chế giữa các loại quân | ✅ 3 hệ ×1,3 / ×0,8 | — | — |
| 2.20 | Tốc độ và tải theo loại quân | ✅ tốc độ + sức mang theo hệ (bản đồ giới) | P1 | S |
| 2.21 | 5 bậc quân và chỉ số | ✅ (chênh bậc lớn hơn RoK) | — | — |
| 2.21 | Quân đặc thù theo văn minh | ❌ | P2 | M |
| 2.22 | Huấn luyện (4 nhà, 4 hàng song song) | 🟡 1 nhà, 1 hàng | P2 | S |
| 2.23 | Nâng bậc quân | ✅ nâng bậc đệ tử (Diễn võ trường) | P1 | S |
| 2.24 | Hàng đợi hành quân 1–5 | ✅ theo cảnh giới | — | — |
| 2.25 | Sức chứa một đội (và vật phẩm mở rộng) | ✅ trận dung theo cấp / sao chủ tướng (bản đồ giới) | P0 | M |
| 2.26 | Sức mạnh, không upkeep | ✅ | — | — |
| 2.27 | Quân theo mùa, đánh xa | ❌ | P2 | L |
| 2.28 | Bệnh viện (sức chứa, chữa, liên minh giúp) | ✅ Đan phòng | P2 (chọn số chữa) | S |
| 2.29 | 3 mức thương vong, Hall of Heroes | 🟡 2 mức | P1 | S |
| 2.30 | Giao tranh thời gian thực trên bản đồ | ❌ cố ý (PLAN §1) | P0 | L |
| 2.31 | Giao tranh nhiều bên, AoE, swarm | 🟡 gộp đội khi kết trận / đồn trú, yêu vương theo lát | P1 | M |
| 2.32 | Rút lui, điều khiển giữa trận | 🟡 tự rút sau 10 lượt, gọi về đội đóng quân | P1 | M |
| 2.33 | Kết trận (sức chứa theo Castle, 4 mốc giờ) | ✅ 8 đội, 5/10/30 phút | P1 | S |
| 2.34 | Đồn trú và tiếp viện | ✅ | P2 | S |
| 2.35 | Công thành: độ bền tường, cháy, dời thành, khiên | ✅ trận lực + linh hỏa thiêu sơn + sơn môn thất thủ (dời chỗ); khiên sau thua + Hộ Sơn Phù | P1 | M |
| 2.36 | Trinh sát | ✅ dò thám làm tròn | P2 | S |
| 2.37 | Chiến báo chi tiết (tách nguồn sát thương, chia sẻ) | 🟡 phát lại, chi tiết trận, chia sẻ vào chat; chưa tách sát thương theo nguồn | P1 | S |
| 2.38 | Điểm tiêu diệt (KP) | ✅ sát địch + bảng xếp hạng | P0 | S |
| 2.39 | Danh dự (KvK) | ✅ Công Huân (điểm cá nhân trong mùa) | P2 | S |
| 2.40 | Zeroing | ❌ cố ý, khuyên giữ | P2 | M |
| 2.41 | Man tộc, pháo đài, AP | ✅ yêu thú giới, yêu trại, hành lực | P2 | S |
| 2.42 | Academy — cây Quân sự | 🟡 Tàng Kinh Các 28 môn | P1 | M |
| 2.43 | Academy — cây Kinh tế | 🟡 | P2 | M |
| 2.44 | Crystal Tech, công nghệ liên minh | 🟡 Hộ Minh Đại Trận (công nghệ minh); chưa có Crystal Tech | P2 | M |
| 2.45 | Trải nghiệm chiến đấu (thấy trận, điều khiển, bảng điểm) | 🟡 có trình diễn, thiếu điều khiển | P0 | theo mục |

**5 khoảng cách lớn nhất** (ưu tiên cao, khác biệt rõ nhất với cảm giác RoK):
1. **Giao tranh thời gian thực trên bản đồ** (2.30, 2.31, 2.32) — P0 · L. Đụng PLAN §1; có hướng trung gian ở mục 2.30.
2. **Cặp trưởng lão chính / phó và kỹ năng theo nộ** (2.8, 2.11) — P0 · M. Làm được trong `fight()` tất định hiện có.
3. **Sức chứa một đội** (2.25), đi kèm nâng bậc quân (2.23) và tốc / tải theo hệ (2.20) — P0 · M. Không có trần thì kết trận và bậc quân mất nhiều ý nghĩa.
4. **Điểm tiêu diệt và chiến báo chi tiết** (2.38, 2.37) — P0 · S. Rẻ nhất trong nhóm P0, cho PvP một bảng điểm.
5. **Chiều sâu nuôi trưởng lão và pháp bảo**: phẩm cấp, sao, hồn ấn, công pháp nhiều tầng, 74 thiên phú, bản mệnh thần thông (2.1, 2.6, 2.7, 2.9, 2.10), cộng pháp bảo theo bộ chế từ linh tài (2.16) — P1 · M–L.

---

## 4. Nguồn

**riseofkingdomsguides.com**
- https://riseofkingdomsguides.com/tavern/
- https://riseofkingdomsguides.com/legendary-tavern-guide-rise-of-kingdoms/
- https://riseofkingdomsguides.com/rise-of-kingdoms-commander-guide/
- https://riseofkingdomsguides.com/rise-of-kingdoms-sculptures-guide/
- https://riseofkingdomsguides.com/talent-tree/
- https://riseofkingdomsguides.com/guides/commander-pairings/
- https://riseofkingdomsguides.com/all-rise-of-kingdoms-commanders/
- https://riseofkingdomsguides.com/rise-of-kingdoms-commander-leveling-guide/
- https://riseofkingdomsguides.com/rise-of-kingdoms-equipment-guide/
- https://riseofkingdomsguides.com/iconic-crystals-guide-and-priorities/
- https://riseofkingdomsguides.com/formations-armaments-and-inscriptions-guide-rok/
- https://riseofkingdomsguides.com/rise-of-kingdoms-troop-guide/
- https://riseofkingdomsguides.com/how-to-unlock-tier-5-units-fast/
- https://riseofkingdomsguides.com/rise-of-kingdoms-troop-capacity-and-march-queue-guide/
- https://riseofkingdomsguides.com/hospital/
- https://riseofkingdomsguides.com/wall/
- https://riseofkingdomsguides.com/rise-of-kingdoms-attacking-cities-and-flags-guide/
- https://riseofkingdomsguides.com/academy/
- https://riseofkingdomsguides.com/rise-of-kingdoms-barbarians-and-barbarian-forts/
- https://riseofkingdomsguides.com/rise-of-kingdoms-action-points/
- https://riseofkingdomsguides.com/the-museum-building-guide-rok/
- https://riseofkingdomsguides.com/season-of-conquest-crystal-tech-changes-in-rise-of-kingdoms/
- https://riseofkingdomsguides.com/range-attacks-are-coming-to-rise-of-kingdoms/
- https://riseofkingdomsguides.com/when-will-the-tier-6-troops-arrive-in-rise-of-kingdoms/
- https://riseofkingdomsguides.com/the-lost-kingdom-kvk-guide/
- https://riseofkingdomsguides.com/how-to-get-more-kill-points-in-rise-of-kingdoms/
- https://riseofkingdomsguides.com/faq/
- Ghi chú bản cập nhật: https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-81-unearthing-history-update/ · https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-85-poised-for-battle-update/ · https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-86-anchors-aweigh-update/ · https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-87-rex-totius-britanniae-update/ · https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-88-giving-thanks-update/ · https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-89-sleigh-all-day-update/ · https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-90-return-of-the-king-update/ · https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-91-moon-and-star-update/

**heaven-guardian.com**
- https://heaven-guardian.com/rise-of-kingdoms-commander-sculptures-guide/
- https://heaven-guardian.com/rise-of-kingdoms-level-up-commanders-fast-guide/
- https://heaven-guardian.com/rise-of-kingdoms-troop-capacity-march-queue-guide/
- https://heaven-guardian.com/rise-of-kingdoms-iconic-crystals-guide/
- https://heaven-guardian.com/rise-of-kingdoms-max-cavalry-march-speed-guide/
- https://heaven-guardian.com/rise-of-kingdoms-dominate-barbarians-forts-guide/
- https://heaven-guardian.com/rise-of-kingdoms-maximize-action-points-dominate/
- https://heaven-guardian.com/rise-of-kingdoms-alliance-guide-territory-flags-forts/
- https://heaven-guardian.com/rok-conquer-cities-flags-attack-guide-tips/
- https://heaven-guardian.com/charles-martel-rise-of-kingdoms-guide-talents-pairings/
- https://heaven-guardian.com/yi-seong-gye-rise-of-kingdoms-ultimate-guide/
- https://heaven-guardian.com/lohar-rise-of-kingdoms-barbarian-hunter-guide-build/
- https://heaven-guardian.com/rok-cao-cao-talent-tree/

**gamesguideinfo.com (CSDL; một phần dữ liệu cũ)**
- https://www.gamesguideinfo.com/rise-of-kingdoms/overview/troops
- https://www.gamesguideinfo.com/rise-of-kingdoms/troop/260000554-Warrior
- https://www.gamesguideinfo.com/rise-of-kingdoms/research-category/130000105-Military
- https://www.gamesguideinfo.com/rise-of-kingdoms/research-category/130000104-Economic
- https://www.gamesguideinfo.com/rise-of-kingdoms/overview/commander-talent-trees
- https://www.gamesguideinfo.com/rise-of-kingdoms/overview/commanders
- https://www.gamesguideinfo.com/rise-of-kingdoms/overview/commander-grades
- https://www.gamesguideinfo.com/rise-of-kingdoms/guide/commanders
- https://www.gamesguideinfo.com/rise-of-kingdoms/overview/buildings
- https://www.gamesguideinfo.com/rise-of-kingdoms/boost-type/160001684-Troop-Capacity-Increase

**onechilledgamer.com**
- https://onechilledgamer.com/rise-of-kingdoms-commander-guide/
- https://onechilledgamer.com/rise-of-kingdoms-troops-guide/
- https://onechilledgamer.com/how-to-get-commanders-in-rise-of-kingdoms/
- https://onechilledgamer.com/rise-of-kingdoms-kvk-1-guide/

**codexhelper.com / meta-rok.com**
- https://codexhelper.com/tools/calculators/
- https://codexhelper.com/tools/equipment/
- https://codexhelper.com/tools/early_game/
- https://codexhelper.com/tools/kvk_suite/
- https://meta-rok.com/

**Khác**
- https://www.bluestacks.com/blog/game-guides/rise-of-kingdoms/rok-combat-guide-en.html
- https://rokdbot.com/en/blog/rage-mechanics-skill-uptime-guide-rok-2026 (nêu rõ các con số về nộ không chính thức)
- https://www.appamped.com/rise-of-civilizations-commander-star-upgrade-guide-materials-luck-explained/
- https://www.simonho.ca/posts/rok-saving-gold-keys
- https://www.allclash.com/rise-of-kingdoms-academy-research-guide-best-path/
- https://theriagames.com/guide/rise-of-kingdoms-tavern-guide/
- https://theriagames.com/guide/rise-of-kingdoms-economic-technology-guide/
- https://www.empirebuildacademy.com/research/rise-of-kingdoms
- https://rokstats.com/
- https://en.wikipedia.org/wiki/Rise_of_Kingdoms

**Có trong kết quả tìm kiếm nhưng không đọc được** (chỉ dùng phần tóm tắt tìm kiếm để đối chiếu, đã ghi mức tin cậy tương ứng): https://riseofkingdoms.fandom.com/wiki/Commander_Guide · https://riseofkingdoms.fandom.com/wiki/Buildings/Tavern · https://riseofkingdoms.fandom.com/wiki/Troop_Guide · https://www.rok.guide/items/commander-sculptures/ · https://www.rok.guide/academy/ · https://www.playbite.com/q/how-to-add-secondary-commander-rise-of-kingdoms
