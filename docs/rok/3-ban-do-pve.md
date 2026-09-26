# RoK — Bản đồ vương quốc, khám phá & nội dung PvE → đối chiếu Sơn Hà Tiên Tông

> Nghiên cứu ngày 24/09/2026 cho mảng **bản đồ, khám phá, PvE** của Rise of Kingdoms (Lilith Games, bản hiện hành 2025–2026; bản mới nhất thấy được là 1.1.12 ngày 22/09/2026). Đối chiếu với mã hiện tại của game mình (`packages/rules/atlas.ts`, `packages/rules/world/*.ts`, `packages/rules/data.ts`, `apps/client/src/world/*`) và [PLAN.md](../PLAN.md), [UX.md](../UX.md).
>
> **Về nguồn:** rok.guide (trả lỗi 503) và riseofkingdoms.fandom.com (trả lỗi 402) không đọc được trực tiếp trong đợt này; dữ kiện từ hai nơi đó chỉ lấy qua đoạn trích của máy tìm kiếm và được ghi rõ. Phần lớn số liệu lấy từ nguồn thứ cấp: đáng tin nhất là các bản chép **ghi chú bản vá chính thức** và **FAQ trong game** trên riseofkingdomsguides.com (bản vá chép tới 1.0.91, 02/2025); sau đó là ajackof.com, gamesguideinfo.com (dữ liệu ~2019), heaven-guardian.com và theriagames.com (viết kiểu tổng hợp, ít số, có chỗ mâu thuẫn), rokdbot.com (quảng cáo bot — tin thấp). Thay đổi sau 02/2025 phần lớn **chưa xác minh**. Quy ước: số liệu có ≥ 2 nguồn khớp thì ghi thẳng; một nguồn thì ghi "(một nguồn)"; nguồn vênh nhau thì ghi **mâu thuẫn** kèm cả hai; không tìm được thì ghi **chưa xác minh**. Số trong ngoặc vuông `[n]` trỏ tới danh sách nguồn ở mục 4. Nội dung là tóm tắt bằng lời của mình, không chép nguyên văn.
>
> **Ký hiệu:** ✅ có tương đương · 🟡 có một phần · ❌ chưa có. Ưu tiên P0 (cốt lõi) / P1 (quan trọng) / P2 (thêm hương vị). Công sức S (≤ 1 tuần) / M (1–3 tuần) / L (> 3 tuần), tính cho một người full-time như PLAN mục 0.

## 1. Tóm tắt mảng

### Vai trò trong vòng lặp chơi của RoK

Bản đồ vương quốc là **sân khấu chung** nối mọi hệ thống của RoK. Thành phố sản xuất quân và tài nguyên; quân phải **ra bản đồ** mới sinh giá trị:

| Hoạt động trên bản đồ | Nuôi cái gì | Nhịp |
|---|---|---|
| Đánh man tộc bằng điểm hành động (AP) | Kinh nghiệm tướng (nguồn lớn), sách kinh nghiệm, tăng tốc, tài nguyên, gem hiếm | Mỗi ngày; AP đầy sau ~12 giờ |
| Kết trận pháo đài man tộc | Rương pháo đài, Book of Covenant, quà minh, tiến độ Monument | Mỗi ngày (trần thưởng/ngày: chưa xác minh) |
| Khai mỏ (2–5 đội đi vài giờ) | Tài nguyên — nguồn chính bên cạnh sản xuất trong thành; mỏ gem cho gem | Mỗi phiên |
| Trinh sát sương mù, hang, làng | Thưởng khám phá, mở bản đồ | Dày ở 1–2 tuần đầu |
| Tranh thánh địa, cửa ải | Buff cho cả minh, đường vào vùng trong | 3 ngày một kỳ |
| Sự kiện quái (Lohar, Ceroli, Karuak, Marauder…) | Vật phẩm sự kiện, tượng tướng, AP | Theo lịch sự kiện |
| PvE ngoài bản đồ (Great Expedition, Lyceum, Golden Kingdom) | Tượng tướng, tiền cửa hàng, gem | Phiên ngắn, định kỳ |

**Monument** (dòng thời gian vương quốc) xếp lịch toàn bộ nội dung bản đồ theo **mục tiêu chung** trong ~80 ngày đầu (man tộc → pháo đài → Sanctum → Altar → cửa ải → Shrine → Lost Temple), rồi dẫn vào KvK. Nhờ đó người mới luôn có "chương đang chạy" để hướng tới, cả server có cùng một câu chuyện.

**Một ngày điển hình (phần bản đồ):** gửi đội khai mỏ → xài hết AP đánh man tộc liên hoàn bằng một đội mạnh → vào kết trận pháo đài của minh → xem thánh địa đang tranh → nếu có sự kiện thì đánh quái sự kiện → thu đội về, gửi đội mới trước khi thoát.

### Vì sao người chơi thích

1. **Thế giới sống, thấy người khác**: hàng xóm, lãnh thổ minh tô màu, đội hành quân chạy ngang màn hình.
2. **Thưởng dày và ngẫu nhiên**: mỗi con man tộc rơi đồ; hang, làng cho quà; mốc Monument cho gem.
3. **Phối hợp dễ vào**: kết trận pháo đài chỉ cần bấm "tham gia"; giữ thánh địa là việc cả minh.
4. **Mục tiêu dài hạn nhìn thấy được**: zone 2, zone 3, Lost Temple, ngôi vua, KvK.
5. **Có chỗ cho kỹ năng**: đánh liên hoàn (chain farming), chọn cặp tướng AoE, canh 4 giờ giữ thánh địa, chặn đội địch giữa đường.
6. **Lịch sử server**: Monument lưu lại minh nào giữ Altar đầu tiên, ai lên ngôi — bản sắc cộng đồng.

### Game mình đang đứng ở đâu

P3 đã dựng đúng **khung RoK-lite** theo tinh thần PLAN (bản đồ theo vùng + cổng thay vì pathfinding theo ô, trận giải ngay khi tới): Giới 150 × 150 (25 vùng, 40 cổng trận nhãn mở theo pha mùa), **linh mạch** (≈ thánh địa, buff sản lượng), **mỏ** (≈ điểm tài nguyên), **yêu vương** kho máu chung (≈ pháo đài/boss), hành quân thời gian thực có đường đi, kết trận, viện binh, linh triều, thời tiết, biên niên giới, mùa 49 ngày. PvE riêng từ P1 rất đủ: 15 yêu thú, 5 tông môn NPC, 5 bí cảnh × 5 tầng, Thông Thiên Tháp. Mới thêm (commit 776ddfa): **túi đồ** (phù tăng tốc, nang tài nguyên, Thần Hành Phù, Hộ Sơn Phù…) và **Trung tâm sự kiện** (Thất Nhật Lễ, Tân Thủ Chi Lộ, Tông Môn Tranh Bá kiểu MGE, Săn Yêu Lệnh).

**Khoảng cách lớn nhất** (chi tiết ở mục 3):

1. **PvE lặp lại trên bản đồ chung** — RoK sống nhờ man tộc rải khắp bản đồ + AP; mình chỉ có 15 hang yêu thú cố định trên bản đồ riêng.
2. **Dòng thời gian có mục tiêu chung (Monument)** — mình mở cổng theo lịch cứng, không có mục tiêu toàn giới / tiên minh, không thưởng mốc.
3. **Khám phá & trinh sát** — không có sương mù, hang, làng; dò thám chỉ có trong bảng Tranh đoạt, không dò được quân ở linh mạch, không cảnh báo đội địch đang tới.
4. **Đa dạng linh địa + luật tranh chấp** — linh mạch chỉ một loại buff, luôn mở, không NPC giữ, không giữ 4 giờ.
5. **Dời sơn môn (dịch chuyển) và công cụ bản đồ** — chưa có dịch chuyển, tìm toạ độ, đánh dấu, dấu tiên minh.

## 2. Danh mục đầy đủ

### 2.A Cấu trúc vương quốc, thánh địa, Monument

#### A1. Kingdom Map — bản đồ vương quốc

- **Mở khoá:** có ngay khi lập thành (server mới mở).
- **Nhịp:** vĩnh viễn — vương quốc không reset; KvK diễn ra trên bản đồ riêng rồi quay về [8][19].
- **Cơ chế:** mỗi server là một bản đồ vuông khoảng **1200 × 1200** (đơn vị "km" trong game, toạ độ X/Y), bốn phía là núi không vượt được [8][7]. Địa hình (sông, rừng, núi) chỉ để nhìn và chia vùng; đi lại giữa các vùng phải qua cửa ải. Thành người chơi, mỏ, man tộc, pháo đài, thánh địa, cờ minh… đều là vật thể trên cùng một bản đồ chung.
- **Tương tác người chơi:** mọi người thấy nhau; hàng xóm vừa là đồng minh vừa là mối đe doạ; lãnh thổ minh tô màu lên bản đồ.
- **UI/UX:** kéo, chụm để phóng; ở mức gần thấy thành/quân, mức xa thấy lãnh thổ và biểu tượng (chi tiết ở mục G).
- **Vì sao giữ chân:** "thế giới sống" — đi xa mất thời gian thật nên vị trí có giá trị; mỗi server có lịch sử riêng.
- **Tu tiên hoá:** *Giới* (đã dùng).
- **Game mình:** ✅ **Giới** 150 × 150 ô sinh từ seed (`packages/rules/atlas.ts`), 12 giây/ô (băng ngang ≈ 30 phút), 100–300 người/giới, reset mỗi mùa 49 ngày (cố ý khác RoK — PLAN mục 2).
- **Ưu tiên:** P0 (đã có) · **Công sức:** —

#### A2. Zones 1–2–3 — vùng ngoài / giữa / tâm

- **Mở khoá:** người mới luôn sinh ở zone 1.
- **Nhịp:** cố định suốt đời server; vùng trong "mở" dần theo cửa ải (A3).
- **Cơ chế:** mỗi vương quốc có **6 vùng zone 1** (vòng ngoài), **3 vùng zone 2** (vòng giữa), **1 zone 3** (tâm) [7][15]. Vùng trong có mỏ cấp cao hơn, man tộc cấp cao hơn, thánh địa mạnh hơn: Sanctum và Altar ở zone 1, Shrine ở zone 2, Lost Temple ở zone 3 [6][7][9]. Vào zone 2 cần minh đang giữ cửa ải cấp 2 dẫn vào đó, hoặc đã có lãnh thổ minh bên trong (khi đó dùng dịch chuyển lãnh thổ nhảy thẳng vào) [7][15].
- **Tương tác:** cả server dồn dần từ ngoài vào tâm theo dòng thời gian Monument; minh mạnh "di cư" vào zone 2–3, minh yếu ở lại zone 1.
- **UI/UX:** ở mức thu nhỏ hết, ranh giới vùng là dãy núi, zone có màu nền khác nhau (chưa xác minh chi tiết màu).
- **Vì sao giữ chân:** mục tiêu dài hạn nhìn thấy được ("một ngày sẽ vào tâm"), phân tầng tự nhiên người mạnh/yếu.
- **Tu tiên hoá:** vòng ngoài *Phàm vực*, vòng giữa *Linh vực*, tâm *Thiên Môn* (đã có tên vòng: Vòng ngoài / Vòng giữa / Tâm giới).
- **Game mình:** ✅ 16 vùng ngoài + 8 vùng giữa + 1 tâm (vùng lồi Voronoi); vòng trong có linh mạch cấp cao hơn (tăng ích +3/5/8 %, loại theo cấp — `veinBuffs`), yêu thú giới cấp cao hơn (ngoài 1–8, giữa 7–15), yêu vương cấp 2 (vòng giữa) và cấp 3 (tâm); tông môn mới đặt ở vùng ngoài ít người nhất (`spawn()`). Khác: 25 vùng thay vì 10 — hợp giới nhỏ.
- **Ưu tiên:** P0 (đã có) · **Công sức:** —

#### A3. Passes Lv.1–3 — cửa ải

- **Mở khoá:** theo Monument — cửa ải cấp 1 mở sau mốc giữ Altar ("Rising of Heroes"/"Blessings of the Altars"), cấp 2 sau "Wild Competition", cấp 3 sau "Vanishing Threats" (bản 2026 ghi cửa ải cấp 3 mở 24 giờ sau khi mốc này kết thúc) [1][2]. Trước đó cửa ải được bảo hộ, không đánh được → người chơi chỉ đi trong vùng mình [15].
- **Nhịp:** mở một lần theo Monument; sau đó đánh chiếm được bất cứ lúc nào (có kỳ tranh chấp như thánh địa hay không: **chưa xác minh**).
- **Cơ chế:** cấp 1 ngăn các vùng zone 1 với nhau; cấp 2 nối zone 1 → zone 2; cấp 3 nối zone 2 → zone 3 [7][15]. Muốn đánh, lãnh thổ minh phải chạm cửa ải; hạ quân giữ (NPC) rồi chiếm. Quân giữ cửa là **đơn vị trung lập** như man tộc, pháo đài, thánh địa (FAQ) [B-FAQ-NEUTRAL]; minh **đầu tiên** chiếm một cửa ải hoặc thánh địa nhận **thưởng chiếm lần đầu** (FAQ) [B-FAQ-FIRST]. Minh giữ cửa ải thì thành viên đi qua được; người ngoài minh không qua được (phải đánh chiếm hoặc dùng dịch chuyển) [7][15]. Quân giữ cửa, số cửa mỗi cấp: **chưa xác minh**. (Một nguồn nói cửa ải "tới cấp 7" — đó là bản đồ KvK, không phải vương quốc gốc [9].)
- **Tương tác:** điểm nghẽn chiến lược — minh giữ cửa "khoá" cả vùng, sinh ngoại giao (cho mượn đường, hiệp ước không xâm phạm).
- **UI/UX:** biểu tượng pháo đài trên dãy núi, nhãn cấp; đang bảo hộ có đếm ngược; chạm → minh giữ, quân đóng, nút Tấn công / Kết trận / Đồn trú.
- **Vì sao giữ chân:** tạo "sự kiện mở cửa" cả server chờ; tranh cửa là trận lớn đầu tiên giữa các minh.
- **Tu tiên hoá:** *Kết giới quan ải*, mắt trận là *trận nhãn* (đã có).
- **Game mình:** ✅ 40 cổng trận nhãn mở theo **pha mùa** (ngày 5 vòng ngoài, ngày 14 vòng giữa, ngày 35 tâm — `PHASES`), đường đi Dijkstra qua cổng đang mở; cổng là điểm chiếm (tối đa 6 đội mỗi phe, 3 điểm mùa/giờ). Cửa ải (`shutGates` / `shutFrom` ở `world/points.ts`): trận nhãn phe khác đang giữ (không minh ước) chặn đường qua cổng đó — đội đi tới phải tìm đường vòng, hết đường thì báo "cửa ải bị chặn". Chưa có quân NPC giữ cổng lúc mới mở; cổng mở theo lịch ngày chứ không theo chương Biên Niên.
- **Ưu tiên:** P1 · **Công sức:** M (lọc cổng theo phe giữ trong `route()`, NPC giữ cổng khi vừa mở).

#### A4. Alliance Territory (Fortress, Flags) — lãnh thổ minh (phần liên quan bản đồ)

- **Mở khoá:** minh đủ điều kiện dựng Pháo đài trung tâm — nguồn 2026 ghi ≥ 20 thành viên, ≥ 500.000 lực chiến minh, 1.000.000 điểm minh (chưa đối chiếu) [17].
- **Nhịp:** lãnh thổ lớn dần theo ngày khi minh dựng thêm cờ; cờ bị đốt là mất đất ngay.
- **Cơ chế:** Pháo đài là gốc; thành viên dựng Cờ (cờ đầu ~50.000 điểm minh, càng nhiều cờ càng đắt: sau 400 cờ ~375.000 điểm minh + tài nguyên) để nối dài lãnh thổ; nhánh bị cắt khỏi pháo đài thì mất hiệu lực; mỗi 10 cờ thêm 1 chỗ thành viên [17]. Lãnh thổ là điều kiện để: đánh thánh địa / cửa ải (phải chạm), khai mỏ nhanh hơn (**+25 %** trên mỏ thường trong lãnh thổ), dịch chuyển lãnh thổ, xây điểm tài nguyên minh; công nghệ minh tăng công khi đánh trên lãnh thổ và tốc hành quân tới mục tiêu trên lãnh thổ [17][14].
- **Tương tác:** tô màu bản đồ = "đất của chúng ta"; đốt cờ địch là hoạt động PvP thường ngày.
- **UI/UX:** lãnh thổ tô màu minh, viền; chạm ô trống trong lãnh thổ → "Dựng cờ".
- **Vì sao giữ chân:** cảm giác sở hữu tập thể, thấy minh lớn dần trên bản đồ.
- **Tu tiên hoá:** *Linh địa tông minh* — cắm *trận kỳ* (cờ trận) nối từ *tổng đà*; hoặc rẻ hơn: minh giữ ≥ N linh mạch trong một vùng thì "chiếm vùng".
- **Game mình:** ✅ Lãnh thổ tiên minh (`claimsOf` / `ownerAt` / `territoryGrid` ở `world/points.ts`): mốc là tông môn người trong minh (3 ô) và điểm minh giữ (5 ô), tô màu minh trên bản đồ Giới; trận kỳ (nới 4 ô, phá / đóng giữ được) và Tổng đà (nới 7 ô, tăng ích cả minh) ở `world/flags.ts`; khai mỏ trong lãnh thổ minh mình +25 %, kho minh thu Minh khố theo số ô (`world/storehouse.ts`).
- **Ưu tiên:** P1 (bản rẻ: sở hữu theo vùng) / P2 (cờ từng ô) · **Công sức:** M (theo vùng) / L (cờ từng ô).

#### A5. Holy Sites — luật chung

- **Mở khoá:** từng loại mở theo Monument (Sanctum → Altar → Shrine → Lost Temple) [1][2].
- **Nhịp:** kỳ tranh chấp 3 ngày một lần, mỗi kỳ phải giữ đủ 4 giờ (xem dưới).
- **Cơ chế:** Sanctum, Altar, Shrine mở tranh chấp **3 ngày một lần**; minh chiếm và **giữ liên tục 4 giờ** thì được kiểm soát tới kỳ sau; lãnh thổ minh phải chạm thánh địa [5][9][11][12]. Buff cho **cả minh**; hai thánh địa cùng loại **không cộng dồn** (2 Earth Altar vẫn chỉ +5 %) [5][14]. Thánh địa chưa ai chiếm có quân trung lập giữ; quân số giữ từng loại: **chưa xác minh** (một bài ghi Shrine tới 2 triệu quân T3 [13] — đáng ngờ). Các con số hay được trích — Sanctum 10.000 quân T1, Altar ~15.000 T2, Shrine 30.000 T3 — là sức của **hộ vệ** (Guardian) sinh quanh thánh địa, không phải quân giữ (xem C12) [9][10][11][12]. Thương vong: FAQ trong game nói đánh quân trung lập (pháo đài, cửa ải, thánh địa, đền) trước khi chiếm thì thương binh về bệnh viện theo một luật chung [B-FAQ-CAS]; một nguồn khác nói ở Shrine một nửa số trọng thương chết luôn, ở Lost Temple chết hết [9][12] — có thể là luật khi tranh với người chơi; **mâu thuẫn / chưa rõ**. Minh đầu tiên chiếm một thánh địa nhận thưởng chiếm lần đầu [B-FAQ-FIRST]. Quân kết trận vào thánh địa có trần (một nguồn ghi 1,5 triệu — chưa xác minh) [12].
- **Tương tác:** trục xung đột minh – minh quanh năm; minh nhỏ tranh Sanctum, minh lớn tranh Shrine/Temple.
- **UI/UX:** biểu tượng thánh địa có cờ minh giữ, trạng thái "Đang tranh chấp / Bảo hộ còn …"; bảng thánh địa trong minh liệt kê buff đang có.
- **Vì sao giữ chân:** buff thấy ngay trên chỉ số, lịch 3 ngày tạo nhịp "trận cuối tuần" đều đặn.
- **Tu tiên hoá:** *Linh địa* các loại: linh mạch (sản lượng), *kiếm trủng* (công), *linh tuyền* (chữa thương), *ngộ đạo thạch* (nghiên cứu)…
- **Game mình:** 🟡 linh mạch (57 điểm: 2/vùng ngoài, 3/vùng giữa, 1 ở tâm) chiếm bằng đóng quân, tăng ích nhiều loại theo cấp (`veinBuffs`), cùng loại **cộng dồn** tới 30 %; chiếm lần đầu trong mùa cả minh có quà (`firstTake`). Thiếu: kỳ tranh chấp 3 ngày / giữ 4 giờ (chỉ Cổ Di Tích / Huyết Tế Đàn mở theo giờ — `world/ruins.ts`), luật tử trận riêng. Có hộ trận linh thú giữ điểm chưa thuần phục (`GUARDIANS`, `guardSide`): phải đánh bại mới chiếm lần đầu trong mùa.
- **Ưu tiên:** P1 · **Công sức:** M.

#### A6. Sanctum — thánh đường (zone 1)

- **Mở khoá:** sau mốc "Origin of Agriculture" / "Iron Age" (4.000 thống đốc vào Thời Sắt); mốc kế "First Sanctums" đòi 65 Sanctum bị chiếm lần đầu [1][2].
- **Nhịp:** như A5 (3 ngày một kỳ).
- **Cơ chế:** **70** Sanctum ở zone 1 (mỗi vùng 11–12) [10][9]. Buff:
  - Sanctum of Courage: kinh nghiệm tướng **+10 %** [10][6] — nguồn khác ghi **+5 %** [14][5] (**mâu thuẫn**);
  - Sanctum of Wind: tốc hành quân **+5 %** [5][10][14];
  - Sanctum of Blood: máu quân **+2 %** [5][10][14];
  - Sanctum of Hope: tốc khai thác **+5 %** [5][10][14] (một nguồn ghi tốc luyện quân — thiểu số [6]).
- **Tương tác / UI / giữ chân:** như A5; là mục tiêu đầu tiên của minh mới, dạy người chơi kết trận.
- **Tu tiên hoá:** *Tiểu linh địa*: Chiến Hồn Đài (kinh nghiệm trưởng lão), Phong Độn Đài (tốc hành quân), Huyết Tinh Trì (máu đệ tử), Linh Khoáng Nhãn (tốc khai mỏ).
- **Game mình:** ✅ linh mạch cấp 1 (vòng ngoài) cho phe giữ một trong sản lượng · xây · tuyển · chữa +3 % (`veinBuffs` ở `world/points.ts`), bảng điểm ghi rõ; luật tranh chấp như A5.
- **Ưu tiên:** P1 · **Công sức:** S (thêm kiểu buff cho điểm có sẵn).

#### A7. Altar — tế đàn (zone 1)

- **Mở khoá:** sau mốc dựng cờ ("Bigger is Better": 1.000 cờ; bản 2026 "Initial Expansion": 500 cờ) [1][2]; mốc kế đòi minh giữ một Altar lúc hết giờ ("Rising of Heroes" / "Blessings of the Altars", 5 ngày) [1][2].
- **Nhịp / tương tác / UI / giữ chân:** như A5; Altar là mục tiêu chính của chương "giữ Altar lúc hết giờ" nên cả server cùng đổ vào một đợt.
- **Cơ chế:** **37** Altar ở zone 1 [9][11][14]. Buff:
  - Earth Altar: tốc xây **+5 %**;
  - Harvest Altar: sản lượng **+5 %** [5][14] — nguồn khác ghi **+10 %** [11][6] (**mâu thuẫn**);
  - Surge Altar: phòng thủ quân **+3 %**; Flame Altar: công quân **+3 %**;
  - Storm Altar: tốc luyện quân **+5 %**; Wisdom Altar: tốc nghiên cứu **+5 %** [5][11][14].
- **Tu tiên hoá:** *Tế đàn ngũ hành*: Thổ Đàn (xây), Mộc Đàn (sản lượng), Thủy Đàn (thủ), Hỏa Đàn (công), Lôi Đàn (tuyển đệ tử), Văn Đàn (công pháp).
- **Game mình:** ✅ linh mạch cấp 2 (vòng giữa) cho phe giữ một trong công · thủ · sinh lực · hành quân +5 % (`veinBuffs`); luật tranh chấp như A5.
- **Ưu tiên:** P1 · **Công sức:** S.

#### A8. Shrine — thần miếu (zone 2)

- **Mở khoá:** sau mốc "Vanishing Threats" (minh hạ 100 pháo đài cấp 3+); bản 2026 ghi Shrine mở 24 giờ sau khi "Glory of the Shrines" bắt đầu/kết thúc — thứ tự hai nguồn khác nhau [1][2].
- **Nhịp / tương tác / UI / giữ chân:** như A5; Shrine ít (9 cái) và buff kép nên chỉ minh mạnh nhất zone 2 giữ được — biểu tượng địa vị.
- **Cơ chế:** **9** Shrine, 3 mỗi vùng zone 2 [9][12]. Buff:
  - Shrine of Order: thủ **+3 %** và máu **+3 %**;
  - Shrine of Honor: công quân kết trận **+5 %** và tốc khai thác **+5 %**;
  - Shrine of Radiance: hồi điểm hành động **+20 %** và tốc chữa thương **+20 %**;
  - Shrine of War: công **+3 %** và tốc luyện quân **+10 %** [5][12][14].
  Hộ vệ quanh Shrine 30.000 quân T3 (C12) [9][12]; luật "một nửa trọng thương chết" chỉ một nguồn và vênh với FAQ (xem A5) [12][B-FAQ-CAS].
- **Tu tiên hoá:** *Thần miếu tứ tượng*: Huyền Vũ miếu (thủ + máu), Chu Tước miếu (công kết trận + khai mỏ), Thanh Long miếu (hồi linh lực + chữa thương), Bạch Hổ miếu (công + tuyển đệ tử).
- **Game mình:** 🟡 chỉ linh mạch cấp 3 ở tâm (một điểm) có buff kép sản lượng + công +8 % (`veinBuffs`); linh mạch cấp 2 ở vòng giữa mỗi điểm một loại. Thiếu: bộ thần miếu buff kép ở vòng giữa.
- **Ưu tiên:** P1 · **Công sức:** S–M.

#### A9. Lost Temple & King — đền cổ ở tâm và ngôi vua

- **Mở khoá:** sau mốc "The Great Empire" (8 minh đủ 90 người; bản 2026 kéo 240 giờ), Lost Temple mở 24 giờ sau đó; mốc cuối "The Last Golden Apple" (9–10 ngày) thưởng minh đang giữ đền lúc hết giờ [1][2].
- **Nhịp:** tranh chấp 7 ngày một lần (một nguồn); chương cuối Monument kéo 9–10 ngày.
- **Cơ chế:** 1 đền ở tâm zone 3. Quân giữ đền: **2.000.000 quân T5 do High Priest chỉ huy** (FAQ trong game; khớp với [9]) [B-FAQ-TEMPLE][9]. Tranh chấp 7 ngày một lần, giữ 8 giờ mới kiểm soát (**một nguồn, chưa xác minh**) [9]. Minh chủ minh giữ đền thành **Vua**: phong **tước hiệu** cho bất kỳ ai trong vương quốc và bật buff toàn vương quốc (tốc xây, nghiên cứu, luyện quân, sản lượng) mỗi thứ một lần/ngày [5]. Tước hiệu theo một nguồn 2026 [16] (chưa đối chiếu):
  - tốt: King công/thủ/máu +5 %; Queen khai thác +15 %; General công +5 %, thủ +5 %; Prime Minister sản lượng +15 %, xây +10 %; Justice công +5 %, hành quân +10 %; Duke thủ +5 %, luyện quân +10 %; Architect xây +10 %; Scientist nghiên cứu +5 %, khai vàng +10 %;
  - xấu: Traitor công/thủ −3 %; Beggar sản lượng −10 %; Exile thủ −5 %; Slave máu −5 %; Sluggard hành quân/luyện quân −5 %; Fool xây/nghiên cứu −5 %.
- **Tương tác:** chính trị server — vua phong tước cho đồng minh, "đày" kẻ thù; đền là mục tiêu cuối trước KvK.
- **UI/UX:** đền lớn giữa bản đồ; bảng Vua: lưới tước hiệu, chọn người; thông báo toàn server khi phong tước.
- **Vì sao giữ chân:** danh vọng + quyền lực mềm; đỉnh của cả dòng thời gian.
- **Tu tiên hoá:** *Thiên Môn* → minh giữ lâu nhất thành *Giới Chủ*, ban *phong hào* ("Kiếm Thánh", "Đan Tôn"… và phạt "Phế Đồ", "Ma Đầu").
- **Game mình:** ✅ Thiên Môn ở tâm mở ngày 35, giữ được 12 điểm mùa/giờ; minh chủ tiên minh giữ Thiên Môn (chưa ai giữ: minh đầu bảng điểm mùa) là **Giới Chủ** (`world/lord.ts`): sắc phong 4 phúc / 4 hoạ (giữ 24 giờ), ban phúc cả giới mỗi ngày (`bless`), Thiên Ân lễ 3 phần mỗi tuần (`boon`). Thiên Môn không có quân NPC giữ.
- **Ưu tiên:** P2 · **Công sức:** M.

#### A10. Monument — dòng thời gian vương quốc

- **Mở khoá:** công trình Monument trong thành (một nguồn ghi cần Tòa thị chính 8, 1.000 gỗ — chưa đối chiếu) [4]; dựng xong là xem được cả dòng thời gian, mọi vương quốc cùng một kịch bản, các mốc bắt đầu/kết thúc lúc 0:00 UTC (đoạn trích fandom) [8][3].
- **Nhịp:** ~21 chương trong ~80 ngày đầu rồi tới KvK 1. Theo tracker của một vương quốc mở 08/2026: 12 chương đầu xong trong ~25 ngày (nhiều chương ghi xong cùng ngày — có vẻ chạy chồng nhau hoặc xong sớm khi đạt mục tiêu; **chưa xác minh**), 9 chương còn lại theo lịch cứng 1.368 giờ ≈ 57 ngày; tiền KvK dự kiến ở ngày ~88 [2]. Từ bản 1.0.78 (01/2024), vương quốc mới có **tỉnh bị khoá**: dịch chuyển tân thủ / di cư không vào được tới khi xong một số chương [PN78].
- **Cơ chế:** mỗi chương là một mục tiêu có hạn giờ ở một trong ba phạm vi: **cả vương quốc** (cộng dồn mọi người), **minh** (minh tự đạt) hoặc **top N**; đạt thì người/minh đủ điều kiện nhận thưởng, và chương mở nội dung mới (pháo đài cấp mới, thánh địa, cửa ải, Lost Temple, xoá sương mù). Bảng dưới gộp tên cũ [1] và tên bản 2026 [2]; thưởng lấy từ nguồn cũ [1] (**có thể đã đổi**):

| # | Tên 2026 (tên cũ) | Thời lượng | Mục tiêu (phạm vi) | Mở ra | Thưởng (nguồn cũ) |
|---|---|---|---|---|---|
| 1 | The Bud Awakens | 3 ngày | 20.000 thống đốc vào Thời Đồng (VQ) | — | 200 gem, 1 chìa vàng, 1 tượng tướng Elite |
| 2 | Uncovering Clouds | 3 ngày | Cả server khám phá 30.000.000 ô sương mù (VQ) | — | 200 gem, 1 chìa vàng, 1 tượng Elite |
| 3 | Cruel Conflict (World of Discord) | 2 ngày | Hạ 200.000 quân man tộc (VQ) | Pháo đài man tộc cấp 1 | 500 gem, 1 chìa vàng |
| 4 | Iron Age (Origin of Agriculture) | 4 ngày | 4.000 thống đốc vào Thời Sắt (VQ) | Sanctum | 500 gem, 1 chìa vàng |
| 5 | First Sanctums (The First Encounter) | ? | 65 Sanctum bị chiếm lần đầu (VQ) | Pháo đài cấp 2 | 1.000 gem, 1 chìa vàng |
| 6 | Clarion Call (Horn of Counterattack) | 4 ngày | Minh hạ 40 pháo đài cấp 1+ (minh) | "Barbarian Camp" | 1.500 gem, 3 chìa vàng |
| 7 | The Family | 3 ngày | 30 minh đủ 65 người (VQ) | — | 500 gem, 1 chìa vàng, 10 tượng Elite |
| 8 | Initial Expansion (Bigger is Better) | 3 ngày | 500 cờ minh (bản cũ: 1.000) trong VQ | Altar | 500 gem, 3 chìa vàng |
| 9 | Blessings of the Altars (Rising of Heroes) | 5 ngày | Minh giữ một Altar lúc hết giờ (minh) | Cửa ải cấp 1 | 2.000 gem, 20 tăng tốc 60 phút |
| 10 | Dark Age (Militarism) | ? | 1.000 thống đốc vào Thời Tối (VQ) | Pháo đài cấp 3 | 500 gem, 1 chìa vàng |
| 11 | Siegecraft (Pillage and Plunder) | 5 ngày | Minh hạ 100 pháo đài cấp 2+ (minh) | "Lv.10 Barbarian Camp" | 1.500 gem, 3 chìa vàng |
| 12 | Wild Competition | 5 ngày | Tranh top 20 minh (top 20) | Cửa ải cấp 2 | 3.000 gem, 3 tăng tốc 24 giờ |
| 13 | None Shall Pass (Pandora's Box) | 5 ngày | Minh giữ một cửa ải cấp 2 lúc hết giờ (minh) | "Lv.15 Barbarian Camp" | 2.000 gem, 3 chìa vàng |
| 14 | Barbarian Buster (Rules of Survival) | 5 ngày | Hạ 40.000 quân man tộc cấp 18+ (VQ) | Pháo đài cấp 4 | 500 gem, 3 chìa vàng |
| 15 | Vanishing Threats | 4 ngày | Minh hạ 100 pháo đài cấp 3+ (minh) | Shrine (bản 2026: cửa ải cấp 3, +24 giờ) | 500 gem, 3 chìa vàng |
| 16 | Glory of the Shrines (One More Step) | 7 ngày | Minh giữ một Shrine lúc hết giờ (minh) | Cửa ải cấp 3 (bản 2026: Shrine, +24 giờ) | 2.000 gem, 3 chìa vàng |
| 17 | Feudal Age (My Vassal's Vassal) | 5 ngày | 200 thống đốc vào Thời Phong Kiến (VQ) | Pháo đài cấp 5 | 500 gem, 1 chìa vàng |
| 18 | Coup de Grace (Deterrent) | 4 ngày | Minh hạ 50 pháo đài cấp 4+ (minh) | "Lv.20 Barbarian Camp" | 1.500 gem, 3 chìa vàng |
| 19 | Ultimate Clarity (Long Peace) | 7 ngày | Khám phá hết sương mù vương quốc (cá nhân) | Xoá toàn bộ sương mù | 500 gem, 10 chìa vàng |
| 20 | The Great Empire | 7 ngày (2026: 10 ngày) | 8 minh đủ 90 người (top 10) | Lost Temple (+24 giờ) | 500 gem, 2 chìa vàng |
| 21 | The Last Golden Apple | 9 ngày (2026: 10 ngày) | Minh giữ Lost Temple lúc hết giờ (1 minh) | — | 2.000 gem, 20 tăng tốc 60 phút, 5 chìa vàng |

  Sau chương 21: tiền KvK "Eve of the Crusade" 3 giai đoạn × 2 ngày (hạ Marauder → luyện quân → phá trại Marauder) rồi mở bản đồ Lost Kingdom [2][21] (bản 1.1.12 ngày 22/09/2026 đổi: Eve mở **cùng lúc** với Lost Kingdom — một nguồn [B-LD1112]; xem A11, C6). "Barbarian Camp Lv.10/15/20" là chữ của nguồn cũ — có thể là mốc mở man tộc cấp cao hơn; **chưa xác minh**. Nguồn 2026 [2] cho thấy tên và vài con số đã đổi so với nguồn cũ (500 cờ thay vì 1.000; 240 giờ thay vì 7–9 ngày) → thưởng cũng có thể đã đổi.
- **Tương tác:** mục tiêu chung ép cả server hợp tác (đánh man tộc, dựng cờ, tuyển thành viên), mục tiêu minh tạo cạnh tranh, top N tạo xếp hạng; mọi người cùng chờ "mở cửa".
- **UI/UX:** công trình Monument trong thành → dòng thời gian ngang các chương (đã xong / đang chạy có đếm ngược và thanh tiến độ chung / sắp tới bị khoá), mỗi chương có biểu tượng phần thưởng, nút Nhận; chương đã xong lưu lại như biên niên của server.
- **Vì sao giữ chân:** nhịp "có gì mới" 2–10 ngày một lần trong 3 tháng đầu, thưởng gem đều, cảm giác cả server là một cộng đồng đang viết lịch sử.
- **Tu tiên hoá:** *Giới Bia* (bia đá thiên đạo): mỗi chương là một *kỷ* — "Linh khí phục tô" (N tông môn đạt Trúc Cơ), "Vạn thú triều" (cả giới hạ N yêu thú), "Khai mạch" (N linh mạch bị chiếm lần đầu), "Tông minh tụ nghĩa" (N tiên minh đủ người), "Phá quan" (minh giữ trận nhãn), "Thiên Môn hiện thế"…
- **Game mình:** 🟡 Thiên Đạo Biên Niên (`world/book.ts`, `BOOK` ở `data.ts`): 13 chương mục tiêu chung của cả giới, hạn theo ngày mùa (từ 15 tông môn tầng 5 tới Thiên Môn có chủ; chương Tu Bổ Thiên Môn cả giới góp tài nguyên — `repair`), tiến độ + danh sách chương trên thẻ mùa bản đồ Giới, xong thì mọi tông môn nhận quà thư, hụt thì sang chương sau. Thiếu: chương chưa mở nội dung — cổng / Thiên Môn vẫn mở theo **pha mùa** ngày cứng (`PHASES`).
- **Ưu tiên:** P1 · **Công sức:** M (bộ đếm phía server + bảng mốc trong `data.ts` + màn Giới Bia).

#### A11. Eve of the Crusade & Lost Kingdom — tiền KvK và bản đồ KvK (tóm tắt, chi tiết ở file PvP)

- **Mở khoá:** KvK 1 khi vương quốc ~75–95 ngày tuổi, kéo 50 ngày không kể tiền KvK; vào bản đồ Lost Kingdom cần Tòa thị chính 16+ (nguồn khác ghi 17+; các mùa sau cao hơn) [20][19].
- **Nhịp:** mỗi mùa KvK khoảng 2 tháng, mùa sau cách mùa trước ~2 tháng [19].
- **Cơ chế (phần PvE):** tiền KvK 3 giai đoạn: hạ Marauder (rơi túi da, trong có mảnh giấy da; đủ bộ 7 mảnh đổi Rương tiếp tế vương quốc, cộng điểm thập tự chinh cá nhân và vương quốc), luyện quân, phá trại Marauder; xếp hạng liên server; điểm vương quốc cho buff dùng tiếp trong Lost Kingdom [21][2]; từ 1.1.12 (22/09/2026) Eve mở cùng lúc với Lost Kingdom và người chơi được tự xếp phe theo điểm Eve (một nguồn) [B-LD1112]. Trên bản đồ KvK: man tộc cấp 26–40 (một đoạn trích ghi từ 25) [20][29], pháo đài cấp 6–10 (Heroic Anthem từ 11) [20][B-HA]; thánh địa KvK có tên riêng (Crusader Fortress, Hieron, Sanctuary, Great Ziggurat…) [20].
- **Tương tác / UI / giữ chân:** cả vương quốc thành một phe đấu vương quốc khác; là đỉnh nội dung dài hạn (chi tiết ở file PvP).
- **Tu tiên hoá:** *Vạn giới đại chiến* — ngoài phạm vi (PLAN: không làm liên server). Phần PvE (lưu khấu tà tu trước đại chiến) có thể làm sự kiện cuối mùa trong một giới.
- **Game mình:** ❌ (cố ý — PLAN "Không làm": liên server). Phần PvE của Eve đã có ở đầu mùa: Khai Giới Trảm Tà (`world/eve.ts`, xem C6); cuối mùa là pha **Phi thăng**.
- **Ưu tiên:** P2 (chỉ phần sự kiện PvE cuối mùa) · **Công sức:** M.

### 2.B Sương mù, khám phá và trinh sát

#### B1. Fog of War — sương mù (riêng từng người)

- **Mở khoá:** từ đầu; mỗi thống đốc có **sương mù của riêng mình** (mốc Monument "Uncovering Clouds" cộng dồn 30 triệu ô sương của mọi người; "Long Peace/Ultimate Clarity" thưởng cho *từng* người khám phá hết bản đồ) [1][2][C-AJ-FOG].
- **Nhịp:** dày trong 1–2 tuần đầu, rồi thưa dần tới khi sạch.
- **Cơ chế:** một vương quốc có **160.000 ô sương** (một nguồn; khớp với bản đồ 1.200 × 1.200 nếu mỗi ô sương 3 × 3 — suy luận) [C-TG-SC]. Chỉ xoá được ô **chạm vùng đã mở** (tính cả chéo); trinh sát tự tìm đường vòng chướng ngại [C-TG-SC]; ra lệnh lại được khi trinh sát đang ở ngoài [C-AJ-FOG][HG-SCOUT]; từ 1.0.76 trinh sát đứng giữ chỗ **60 phút** sau khi xoá sương/vào hang [PN76]. Vào một minh thì sương quanh thành các thành viên được xoá một ít (một nguồn) [C-AJ-FOG]. Vật phẩm **Kingdom Map** xoá ngẫu nhiên một vùng **10 × 10** (không chọn chỗ) [C-RKG-VC][C-HG-VC]; khi đã sạch 100 % thì Kingdom Map đổi được ra tăng tốc 5 phút [C-AJ-FOG][C-AJ-TIPS]. Thời gian mỗi chuyến / bán kính theo ô: **chưa xác minh**. Trên bản đồ KvK Heroic Anthem, sương bị bỏ (trừ mùa chuẩn bị) từ 1.0.76 [PN76] (một hướng dẫn cũ hơn nói ngược lại — mâu thuẫn do thời điểm [B-HA]). Dịch chuyển không đặt được lên ô còn sương [RKG-TP].
- **Tương tác:** gián tiếp (mốc chung của server).
- **UI/UX:** bản đồ phủ mây xám; chạm vùng sương → "Trinh sát" → chọn trinh sát rảnh → biểu tượng trinh sát bay tới, mây tan dần; lọc "Explore View" [HG-SCOUT].
- **Vì sao giữ chân:** tò mò + thưởng tức thì ở tuần đầu (hang, làng lộ ra), "dọn sạch bản đồ" là mục tiêu hoàn tất cá nhân.
- **Tu tiên hoá:** *Mê vụ / chướng khí* che giới; chưởng môn thả *linh điểu* (giấy hạc truyền âm) *khai vụ*; *Sơn Hà Đồ* (Kingdom Map) mở ngẫu nhiên một góc.
- **Game mình:** ✅ Mê vụ (`core/fog.ts`, client `world/fog.ts`): mỗi tông môn một bản đồ sương riêng (ô sương 5 × 5 ô, lúc đầu khai quanh tông môn), mây che mọi thứ bên dưới (huy hiệu, tên, đường hành quân — không chọn được); Sơn Hà Đồ tan ngay 12 ô sương gần tông môn nhất (`revealNear`).
- **Ưu tiên:** P2 · **Công sức:** M (lưu bitmap đã mở theo người — 150 × 150 = 22.500 ô, ~3 KB; lớp mây trên cảnh WebGL).

#### B2. Scout Camp & Scouts — trại trinh sát

- **Mở khoá:** Tòa thị chính 2; tối đa cấp 25 (cần TTC 25, Watchtower 25, Trading Post 25) [C-SC][C-TG-CH].
- **Nhịp:** mỗi chuyến khám phá vài phút (thời gian chính xác chưa xác minh); dùng nhiều nhất trong 1–2 tuần đầu.
- **Cơ chế:** mỗi cấp +5 % tốc trinh sát (cấp 25: +125 %); **số trinh sát 1 → 2 (cấp 5) → 3 (cấp 11)**; tầm khám phá 5 → 15 (cấp 25) [C-SC][C-GGI-SC][HG-SCOUT]. Chi phí mẫu: cấp 1 300 lương/300 gỗ, 4 giây; cấp 10 31.300/31.300, 3 giờ 58 phút; cấp 20 127.500/127.500, 2 ngày 2 giờ; cấp 25 1 triệu/1 triệu, 7 ngày 8 giờ [C-SC]. **Bản 1.0.88 (11/2024) tăng hiệu quả nâng Scout Camp và cho gửi nhiều trinh sát cùng lúc** → bảng số trên có thể đã cũ [PN88].
- **UI/UX:** bảng Scout Camp: danh sách trinh sát (rảnh / đang đi / giữ chỗ), nút "Khám phá" tự chọn vùng sương gần nhất; **báo cáo trinh sát** liệt kê phát hiện (làng, hang, cửa ải) và cho bấm bay tới [C-HG-SCOUT2].
- **Vì sao giữ chân:** thêm một "hàng đợi" chạy song song, công trình rẻ ở đầu game cho cảm giác tiến bộ.
- **Tu tiên hoá:** *Thám Linh Các* nuôi *linh điểu*; cấp các = số linh điểu, tốc bay, tầm nhìn.
- **Game mình:** ✅ Linh điểu (`world/explore.ts`, `cranes` ở `core/fog.ts`): 1 + 1 mỗi 8 tầng Chủ điện (tối đa 3), thả vào ô sương kề vùng đã khai, bay 1 phút mỗi ô sương, tới nơi tan 3 × 3 ô sương rồi về. Không có công trình Thám Linh Các riêng (tốc bay cố định).
- **Ưu tiên:** P2 · **Công sức:** M (gộp với B1).

#### B3. Mysterious Caves — hang động bí ẩn

- **Mở khoá:** khi trinh sát làm lộ hang lúc xoá sương (cần Scout Camp — TTC 2).
- **Nhịp:** mỗi hang một lần cho mỗi người; dày ở tuần đầu.
- **Cơ chế:** trinh sát tìm thấy hang khi xoá sương (hang, làng, cửa ải, thánh địa là những thứ trinh sát làm lộ ra; thánh địa lộ kèm một vùng rộng, hang/làng trong vùng đó không hiện trong báo cáo) [C-FANDOM-SCOUT][C-TG-SC]; gửi trinh sát **vào hang vài giây** (lâu hơn theo cấp hang), **thưởng qua thư**, trinh sát không bao giờ gặp nguy [C-FANDOM-SCOUT][C-HG-VC]; hang 3 bậc thấp / vừa / cao [C-RKG-VC][C-HG-VC]; thưởng là rương có thể chứa gem, tăng tốc, tài nguyên, điểm VIP, chìa khoá, vật phẩm AP, đồ tướng, Kingdom Map [C-HG-VC][C-RKG-FAQ]. Tổng thưởng khi dọn hết hang + làng một vương quốc (một nguồn): **386 rương** (213 thấp, 117 vừa, 56 cao — tức ~386 hang, suy luận), 169 Kingdom Map, 150 gem, ~2,37 triệu kinh nghiệm dạng sách, hàng trăm gói tài nguyên và tăng tốc lẻ [C-AJ-FOG]. Người "nhảy server" có nhận lại thưởng ở server mới không: **mâu thuẫn** [C-AJ-FOG][C-HG-JUMP]. Danh sách toạ độ hang theo vùng được cộng đồng chia sẻ [AJ-CAVE].
- **UI/UX:** hang hiện trên bản đồ và trong báo cáo trinh sát → chạm → "Điều tra" → chọn trinh sát → thư báo thưởng.
- **Vì sao giữ chân:** "hộp quà bất ngờ" rải khắp bản đồ, thưởng người chịu khó.
- **Tu tiên hoá:** *Động phủ cổ tu / di tích thượng cổ* — linh điểu dò vào nhận *cơ duyên* (đan, phù, mảnh công pháp, đôi khi truyền thừa trưởng lão); ba phẩm: phàm / linh / tiên.
- **Game mình:** ✅ Động phủ cổ tu (`sitesOf` ở `atlas.ts`, `visit` ở `world/explore.ts`): rải theo seed, lộ ra khi tan mê vụ, mỗi người ghé một lần nhận quà theo vòng của vùng (phù tăng tốc, Tụ Khí Đan, Ngân / Kim Duyên Phù).
- **Ưu tiên:** P2 · **Công sức:** S (điểm mới trong `atlas` + thưởng một lần mỗi người).

#### B4. Tribal Villages — làng bộ lạc

- **Mở khoá · nhịp:** như B3 — mỗi làng một lần cho mỗi người.
- **Cơ chế:** trinh sát ghé làng → nhận **một phần thưởng mỗi làng** (không cần quay về lấy): lương, gỗ, quân T1, vài cấp công nghệ kinh tế miễn phí (Masonry, Sickle, Handaxe), tăng tốc, Kingdom Map, sách kinh nghiệm [C-RKG-VC][C-TG-SC][C-HG-VC]; từ 1.0.76 có nút nhảy tới làng chưa nhận kế tiếp [PN76]. Số làng mỗi vương quốc: **chưa xác minh**.
- **UI/UX:** làng hiện trên bản đồ → gửi trinh sát ghé thăm → quà vào thẳng kho; nút nhảy tới làng chưa nhận (1.0.76).
- **Vì sao giữ chân:** quà khởi đầu (quân, cấp công nghệ, sách kinh nghiệm) làm tuần đầu nhanh và vui.
- **Tu tiên hoá:** *Thôn trang phàm nhân* — ghé thăm được lễ vật (lương thảo, đệ tử phàm nhân muốn nhập môn, bí tịch rẻ).
- **Game mình:** ✅ Thôn trang (`sitesOf` ở `atlas.ts`, `visit` ở `world/explore.ts`): lộ ra khi tan mê vụ, mỗi người ghé một lần nhận nang tài nguyên + kinh thư theo vòng của vùng.
- **Ưu tiên:** P2 · **Công sức:** S (chung với B3).

#### B5. Scouting Enemies — trinh sát thành / đội địch

- **Mở khoá:** có từ đầu (dùng trinh sát của Scout Camp).
- **Nhịp:** trước mỗi lần tấn công; người thủ nhận thư báo bị trinh sát (nội dung chưa xác minh).
- **Cơ chế:** báo cáo trinh sát thành cho thấy tài nguyên, quân, tướng, quân đồn trú, tình trạng Watchtower và tường; độ chi tiết tuỳ **nghiên cứu trinh sát** [C-HG-CONQ][RKG-ATK]: **Tracking** (5 cấp, "Scout Level 1") cho dữ liệu chi tiết hơn, **Camouflage** (5 cấp, "Scout Level 2") giúp che giấu động tĩnh của mình [C-GGI-TRACK][C-GGI-CAMO][C-TG-MIL]. Khiên hoà bình chặn cả bị trinh sát; đi trinh sát người khác thì mất khiên [C-MF]. Giá mỗi lần trinh sát, trinh sát có bị chặn không: **chưa xác minh**.
- **Tương tác:** bước đầu của mọi cuộc tấn công; nhử bằng báo cáo giả.
- **UI/UX:** chạm thành → "Trinh sát" → thư báo cáo có các mục gập mở.
- **Vì sao giữ chân:** trò "mèo vờn chuột" thông tin.
- **Tu tiên hoá:** *Thần thức dò xét* / *Khuy Thiên Kính*; phản trinh sát là *Ẩn Nặc Trận*.
- **Game mình:** ✅ bảng **Tranh đoạt** có ước lượng miễn phí (`scout()` trong `world/fight.ts`) và **Do thám** (`world/spy.ts`): thả linh điểu tới tông môn khác (hai bên từ tầng 6), tốn 200 × tầng Chủ điện bên kia linh thạch, báo cáo qua thư (tài nguyên ước cướp, quân giữ nhà + lực chiến, viện binh, trấn thủ, trận lực, khiên); bên kia nhận thư + Web Push. **Do thám linh địa** (`spySpot`): nút "Do thám" ở bảng linh mạch / trận nhãn / Thiên Môn phe khác đang giữ — tốn 200 × (cấp điểm + 5) linh thạch, chiếm một linh điểu tới khi bay về, thư báo số đội đóng, tổng đệ tử, lực chiến. Ẩn Tung Phù chống do thám tông môn. Thiếu: công nghệ che giấu, báo cáo giả.
- **Ưu tiên:** P1 (dò quân ở linh mạch/trận nhãn trước khi đánh) · **Công sức:** S.

#### B6. Anti-scouting & Watchtower — chống trinh sát, vọng lâu

- **Mở khoá · nhịp:** Watchtower là công trình trong thành (cấp gắn với Tòa thị chính); vật phẩm chống trinh sát theo gói 24 giờ / 7 ngày.
- **Cơ chế:** vật phẩm **Anti-reconnaissance** 24 giờ (500 gem) / 7 ngày (3.000 gem) chặn trinh sát; **Deceptive Troops** 24 giờ (500 gem) làm báo cáo địch hiện gấp đôi quân [C-TG-SHOP][RKG-ATK]; khiên hoà bình cũng chặn trinh sát [C-MF]. **Watchtower** đánh kẻ tấn công thành và gánh một phần sát thương cho quân thủ, hồi 1 % máu/phút (một nguồn), cấp 1 → 25: công 1.000 → 500.000, máu 1.000 → 50.000; cần Watchtower 25 để mở quân T5 [C-TG-WT][C-GGI-WT][C-RKG-WT]; một nguồn nói Watchtower **không** có chức năng báo trước [C-TG-WT]. Nội dung dải cảnh báo "đang bị tấn công / bị trinh sát": **chưa xác minh**.
- **UI/UX:** dùng vật phẩm từ túi đồ; biểu tượng hiệu ứng trên thành; dải cảnh báo khi bị nhắm (chi tiết chưa xác minh).
- **Vì sao giữ chân:** cảm giác an toàn khi offline, trò đánh lừa đối thủ.
- **Tu tiên hoá:** *Ẩn Nặc Phù* (chống dò), *Huyễn Binh Phù* (báo cáo giả), *Vọng Nguyệt Lâu*.
- **Game mình:** 🟡 Tháp canh (`world/raid.ts`, `Hud.svelte`): đội địch vừa xuất quân (cướp tông môn, cướp khoáng, kết trận công sơn) là bên bị nhắm thấy thẻ son ở mọi tab (tên, giờ tới) + nút Bật khiên / Gọi về, offline thì Web Push; Hộ Sơn Đại Trận (thủ, máu bên thủ +4 %/tầng, trận lực) ≈ tường / vọng lâu. Chống do thám: Ẩn Tung Phù 8/24 giờ (`veil`) làm linh điểu về tay không. Thiếu: báo cáo giả; khiên không chặn do thám.
- **Ưu tiên:** P1 (cảnh báo "đội địch đang tới + giờ tới") / P2 (vật phẩm chống dò) · **Công sức:** S.

### 2.C Man tộc, pháo đài và quái bản đồ (PvE chiến đấu)

#### C1. Action Points (AP) — điểm hành động

- **Mở khoá:** có từ đầu.
- **Nhịp:** hồi liên tục; đầy thì ngừng hồi.
- **Cơ chế:**
  - **Trần 1.000** (FAQ trong game: điểm hoàn sau kết trận man tộc chỉ hoàn tới trần) [B-FAQ-AP][25][26]; vật phẩm đẩy vượt trần được, điểm hoàn thì không [B-FAQ-AP][22].
  - Hồi **~1 điểm mỗi 45 giây** (~80/giờ, ~1.920/ngày, rỗng → đầy ~12–12,5 giờ) — ước lượng cộng đồng, Lilith không công bố [25][26].
  - Vật phẩm AP mệnh giá 50 / 100 / 500 / 1.000 [25][26]; cửa hàng VIP bán **30 × 100 AP/tuần**, reset thứ Hai (một nguồn: 12.000 lương mỗi món, từ VIP 2) [27][26][B-VIPSHOP]; mua bằng gem khi hết: 100 gem lần đầu, mỗi lần sau +50, reset hằng ngày [26][25]; rương pháo đài / rương minh có cơ hội ra 50 AP [27][26].
  - Tăng tốc hồi: Shrine of Radiance **+20 %**, rune AP tới **+15 %** [27][26]; VIP cũng tăng tốc hồi nhưng hai bảng số **mâu thuẫn** (một bảng: VIP 13 → 30 %; bảng khác: VIP 15 → 30 %, VIP 16 → 35 %) [B-GGI-VIP][B-RKG-VIP].
  - Tiêu vào: đánh man tộc, kết trận pháo đài, Marauder, sự kiện (Karuak Ceremony, Protect the Supplies 50 AP/lượt, nhặt hàng Silk Road 80 AP) [27][26][RKG-PTS][PN79].
- **Tương tác:** không trực tiếp; AP là "nhiên liệu" để góp vào mục tiêu minh/vương quốc.
- **UI/UX:** thanh AP dưới chân dung thống đốc; bấm để dùng vật phẩm AP; khi thiếu AP có bảng mua nhanh.
- **Vì sao giữ chân:** nhịp quay lại **2 lần/ngày** (đầy sau ~12 giờ); để đầy là "phí" → thói quen đăng nhập.
- **Tu tiên hoá:** *Linh lực* (hoặc *tinh lực chưởng môn*) — hồi theo thời gian; *Hồi Linh Đan* là vật phẩm AP; Thanh Long miếu (+hồi linh lực).
- **Game mình:** ✅ Hành lực (`AP_MAX` 100, hồi 1 mỗi 3 phút — `apOf` / `spendAp` ở `core/stats.ts`): mỗi lần săn yêu thú giới tốn 10 (`AP_HUNT`), gọi về giữa đường thì hoàn; Hành Lực Đan +50, được vượt mức tối đa (Thương nhân vân du, Vân Du Khách…). PvE ở bản đồ vùng vẫn giới hạn bằng thời gian hồi như cũ.
- **Ưu tiên:** P1 (cần khi làm C2 trên giới) · **Công sức:** S (một số hồi lười như tài nguyên trong `advance()`).

#### C2. Barbarians — man tộc

- **Mở khoá:** thành mới chỉ đánh được **cấp 1**; hạ cấp n mới đánh được cấp n+1 [22]; khi server mới mở chỉ có các cấp thấp, cấp cao mở dần trên toàn server theo ngày (đoạn trích fandom) [22].
- **Nhịp:** mỗi ngày, giới hạn bởi AP; không thấy giới hạn số con/ngày (**chưa xác minh**).
- **Cơ chế:**
  - **Cấp:** vương quốc gốc có vẻ tối đa **cấp 25** (suy ra: hướng dẫn săn "cấp 20–25, chủ yếu ở zone 3", MGE cho điểm cao nhất ở cấp 25 — không nguồn nào ghi thẳng) [28][B-MGE]; Monument có mốc hạ 40.000 man tộc cấp 18+ [1]; bản đồ KvK **cấp 26–40** (một đoạn trích fandom ghi "từ 25") [20][29]; mùa Heroic Anthem man tộc rất mạnh, **100 AP/lần**, hiếm rơi gem, không kéo AoE được [B-HA].
  - **Sinh:** tìm kiếm man tộc cấp ≤ 12 không có quanh thành thì sinh ngay cạnh thành; cấp 13+ sinh theo đợt ở chỗ ngẫu nhiên [22][23]; man tộc/mỏ cấp cao sinh lại theo khoảng ngẫu nhiên (FAQ) [FAQ-SPAWN]; zone 2–3 có man tộc cấp cao hơn [7].
  - **Giá:** **50 AP/lần** [22][25]; đánh tiếp mà tướng chưa về thành thì mỗi lần **−2 AP**, tối đa **−10** [22][23][25]; thiên phú **Insight** cây Peacekeeping giảm thêm (đoạn trích fandom: tới 10; dữ liệu 2019: −9 ở cấp tối đa) [22][B-GGI-PK]; một hướng dẫn cho giá tối ưu ~30 AP/con [RKG-BEG]. Gọi quân về giữa chừng thì mất AP đã tiêu [RKG-BEG].
  - **Thưởng:** mỗi con cho **kinh nghiệm cố định cho cả tướng chính lẫn phó** và **3–4 vật phẩm**, trong đó luôn có Sách kinh nghiệm bằng đúng lượng kinh nghiệm đó (đoạn trích fandom) [22]; vật phẩm ngẫu nhiên: tăng tốc, gem, tài nguyên, sách kinh nghiệm, Arrows of Resistance [23]; KvK được nói là ra tăng tốc nhiều hơn [B-RKG-SPD]. Bảng kinh nghiệm theo cấp: **chưa xác minh**.
  - **Cây Peacekeeping** (dữ liệu 2019): +9 % sát thương lên man tộc, +15 % sát thương kỹ năng lên man tộc, **+15 % kinh nghiệm** từ man tộc, −9 AP, +9 % sát thương cho người mở kết trận man tộc, +15 gói tài nguyên, hồi 500 thương nhẹ sau trận man tộc [B-GGI-PK]; tướng có cây này: Belisarius, Boudica, Cao Cao, Lohar, Markswoman, Minamoto [B-GGI-PK]. Trang bị Savage Totem +3/5/10 % sát thương lên man tộc [B-RKG-EQ].
  - Man tộc là **đơn vị trung lập** (cùng nhóm với quân pháo đài, thánh địa, cửa ải) [B-FAQ-NEUTRAL].
- **Tương tác:** thi nhau "giành" man tộc cấp cao ở vùng đông người; cả server góp vào mốc Monument và điểm sự kiện.
- **UI/UX:** nút Tìm kiếm → chọn cấp → camera bay tới → chạm → Tấn công → chọn đội (gợi ý đội tự động, từ 1.0.88 tránh chọn tướng khai mỏ) [PN88] → báo cáo trận có vật phẩm rơi.
- **Vì sao giữ chân:** nguồn kinh nghiệm tướng chính, vòng "tìm – đánh – nhặt đồ" ngắn và có rơi ngẫu nhiên, dùng hết AP là "việc phải làm" mỗi ngày.
- **Tu tiên hoá:** *Yêu thú hoang dã* trên bản đồ giới: cấp 1–25 (vòng ngoài thấp, tâm cao), rơi *yêu đan* (kinh nghiệm trưởng lão), *phù tăng tốc*, tài nguyên; đánh bằng *linh lực*.
- **Game mình:** ✅ **Yêu thú giới** (`atlas.ts` kind `wild`, `hunt` ở `world/arrive.ts`): 6 con mỗi vùng ngoài / giữa (cấp 1–8 / 7–15), săn một mình tốn 10 hành lực, thắng thì chiến lợi phẩm gấp đôi yêu thú vùng + kinh nghiệm, con đó hồi sau 20 phút (ai tới sau thì về tay không); có trong bảng Tìm, có ước lượng tỉ lệ thắng; 15 yêu thú ở bản đồ vùng riêng vẫn giữ. Chưa rơi vật phẩm ngẫu nhiên (chỉ tài nguyên + kinh nghiệm; tàn quyển / yêu cốt theo sự kiện).
- **Ưu tiên:** **P0** · **Công sức:** M (điểm "yêu thú" sinh lại theo vùng trong `atlas`/`World.spots`, dùng lại `hit`/`fight`).

#### C3. Continuous Attack / Chain Farming — đánh liên hoàn

- **Mở khoá · nhịp:** từ đầu; mạnh nhất khi có tướng AoE + cây Peacekeeping; dùng mỗi phiên tiêu AP.
- **Cơ chế:** đội không về thành mà chạy sang con tiếp theo (giảm AP như C2; cộng đồng đặt đội "giữ vị trí sau trận" để không mất chuỗi, về thành là mất mức giảm) [22][RKG-BEG]; tướng phó có kỹ năng diện rộng (AoE) kéo thêm man tộc xung quanh vào trận → cộng đồng nói **2–5 con với ~40 AP** [28]; chỉ dùng một đội [28]; thương nhẹ ở lại trong đội nên cần tướng/thiên phú hồi quân [B-GGI-PK]. Heroic Anthem cấm kéo AoE [B-HA].
- **UI/UX:** đặt đội "giữ vị trí sau trận", chạm con kế tiếp; đội có kỹ năng diện rộng kéo cả bầy vào một trận.
- **Vì sao giữ chân:** chỗ thể hiện kỹ năng + ghép tướng (tạo nhu cầu nuôi tướng AoE).
- **Tu tiên hoá:** *Truy kích liên hoàn* — trưởng lão có công pháp quần công (đã có `burst`) dụ bầy yêu thú.
- **Game mình:** ✅ Săn liên hoàn (`huntChain` ở `world/spots.ts`): đội vừa săn yêu thú giới, đang về, chạm con khác là đi thẳng từ chỗ đang đứng; quân còn lại giữ nguyên (không hồi), chiến lợi phẩm + thương vong cộng dồn, tốn hành lực như một lần săn. Chưa giảm hành lực khi đánh liên tiếp, chưa kéo bầy bằng công pháp quần công.
- **Ưu tiên:** P2 · **Công sức:** S (giảm linh lực khi đánh liên tiếp) / M (kéo bầy).

#### C4. Barbarian Buster & Clarion Call — thưởng hạ lần đầu và sự kiện săn

- **Mở khoá · nhịp:** Barbarian Buster có từ đầu (nhiệm vụ phụ theo cấp man tộc); Clarion Call là sự kiện vương quốc vài ngày, lặp theo lịch (lịch cụ thể chưa xác minh).
- **Cơ chế:** **Barbarian Buster** là nhiệm vụ phụ thưởng cho lần đầu hạ man tộc **mỗi cấp** (đoạn trích fandom) [B-FANDOM-BB]; **Clarion Call** là sự kiện vương quốc: hạ man tộc lấy điểm (cấp càng cao càng nhiều), có bảng xếp hạng cá nhân + minh, rương mốc ~4.000 điểm [B-RKG-CC][B-AJ-EVT]; **MGE** giai đoạn "Hạ man tộc" 24 giờ: man tộc cấp 25 = 3.600 điểm, 45.000 điểm đổi 105 gem [B-MGE]. Tên "Clarion Call" và "Barbarian Buster" cũng là tên chương Monument bản 2026 [2].
- **UI/UX:** danh sách nhiệm vụ phụ "hạ man tộc cấp n lần đầu"; bảng sự kiện có điểm, mốc rương, xếp hạng cá nhân / minh.
- **Vì sao giữ chân:** thưởng lần đầu kéo người chơi thử cấp cao hơn; sự kiện biến việc cày thường ngày thành cuộc đua.
- **Tu tiên hoá:** *Trảm Yêu Lục* (sổ ghi lần đầu trảm mỗi cấp yêu thú) và sự kiện *Vạn Thú Triều*.
- **Game mình:** ✅ nhiệm vụ chính tuyến "Hạ yêu thú cấp n" (≈ Barbarian Buster); Trung tâm sự kiện có **Săn Yêu Lệnh** (Chủ nhật: điểm cho hạ yêu thú 10, qua tầng bí cảnh 12, tầng tháp 15, trận thắng 2; mốc 20/60/120) và **Trảm Yêu Lệnh** (≈ Clarion Call), **Liên Trảm Bất Hồi** (săn liên hoàn), **Tông Môn Tranh Bá** (như MGE, hôm 4 là săn yêu / bí cảnh); Công Huân tính săn yêu thú giới 2 × cấp. Trảm Yêu Lệnh (`FESTS.tramYeu`) chấm theo cấp: mỗi yêu thú +10 điểm mỗi cấp (`huntLv`), bí cảnh +30, 4 mốc rương, bảng xếp hạng tông môn (top 10) và bảng tiên minh (3 minh đầu) — `FEST_RANKED` / `FEST_ALLY`. Săn Yêu Lệnh vẫn điểm phẳng.
- **Ưu tiên:** P2 · **Công sức:** S.

#### C5. Barbarian Forts — pháo đài man tộc

- **Mở khoá:** theo Monument: cấp 1 sau "World of Discord/Cruel Conflict", cấp 2 sau "First Encounter", cấp 3 sau "Militarism/Dark Age", cấp 4 sau "Rules of Survival", cấp 5 sau "My Vassal's Vassal/Feudal Age"; cấp 6 **chưa xác minh** [1].
- **Nhịp:** hằng ngày; trần thưởng/ngày và thời gian sinh lại: **chưa xác minh** (bản đồ KvK có trần số lần hạ trại mỗi ngày, 1.0.77 đã nâng trần) [PN77].
- **Cơ chế:** chỉ đánh được bằng **kết trận của minh** [B-FAQ-AP][23]; vương quốc gốc **cấp 1–6** (1–3 dễ, 4–6 khó) [23][24]; bản đồ KvK cấp 6–10 (điểm danh dự 15/25/35/45/60) [20], Heroic Anthem từ cấp 11, về sau 14+ [B-HA]. AP tiêu cho kết trận man tộc được **hoàn lại** (tới trần 1.000) [B-FAQ-AP]; giá AP mỗi lần kết trận ở vương quốc gốc: **chưa xác minh** (Heroic Anthem: 300 AP) [B-HA]. Thưởng tăng theo cấp pháo đài và sát thương từng người: tài nguyên, tăng tốc, sách kinh nghiệm, quà minh, **Book of Covenant** (FAQ; ~50 % mỗi bậc thưởng theo một đoạn trích) [B-FAQ-BOC][24][B-FANDOM-FORT]; pháo đài cấp 5 ~46.000 kinh nghiệm tướng [B-RKG-LVL]. Monument có các chương minh phải hạ 40/100/100/50 pháo đài cấp 1+/2+/3+/4+ [1][2].
- **Tương tác:** hoạt động co-op hằng ngày của minh; người mạnh mở trận, người mới "ké" nhận thưởng.
- **UI/UX:** pháo đài trên bản đồ có cấp; chạm → Kết trận (chọn giờ chờ) → cả minh thấy thông báo, bấm Tham gia.
- **Vì sao giữ chân:** "đi cùng nhau" dễ vào, thưởng Book of Covenant (hiếm) — lý do mở game đúng giờ minh hẹn.
- **Tu tiên hoá:** *Yêu động / Yêu sào* cấp 1–6 (động hồ ly, sào huyệt lang vương…) chỉ phá được khi tiên minh kết trận.
- **Game mình:** ✅ **yêu trại** cấp 1 (mỗi vùng ngoài: 12.000 sức, 3 "lát", hồi 8 giờ — `BOSSES[1]`, minh mới kết trận được từ pha đầu), **yêu vương** cấp 2 (vòng giữa: 60.000, 5 lát, hồi 24 giờ) và cấp 3 (tâm: 150.000, 8 lát, hồi 72 giờ); kho máu chung, kết trận ≤ 8 đội, thưởng chia theo sát thương qua thư (cấp 3: người đánh nhiều nhất nhận trưởng lão Huyền Minh), cả minh nhận Minh lễ. Chưa có cấp 4–6, trần thưởng/ngày, mở cấp theo mốc.
- **Ưu tiên:** P1 · **Công sức:** S–M (thêm `BOSSES[1]` ở vòng ngoài + trần thưởng/ngày).

#### C6. Marauders & Encampments — lưu khấu (tiền KvK)

- **Mở khoá:** sự kiện **Eve of the Crusade** trước khi mở Lost Kingdom (khoảng 1 tuần trước KvK; KvK 1 khi vương quốc 75–95 ngày) [20][21][B-RKG-SPD]. **Bản 1.1.12 (22/09/2026)**: Eve of the Crusade mở **cùng lúc** với Lost Kingdom, người chơi được tự xếp phe theo buff trại tính từ điểm Eve (một nguồn) [B-LD1112].
- **Nhịp:** vài ngày quanh lúc mở KvK.
- **Cơ chế:** giai đoạn 1 (và theo một số nguồn cả 2) hạ Marauder → rơi túi da (có tăng tốc, gem, và mảnh giấy da); đủ bộ **7 mảnh** khác nhau đổi Rương tiếp tế vương quốc, mỗi lần đổi cộng điểm thập tự chinh cá nhân + vương quốc; giai đoạn cuối phá **trại Marauder**; xếp hạng liên server; điểm vương quốc đổi buff dùng tiếp trong Lost Kingdom [21][B-RKG-SPD]; hướng dẫn khuyên để dành bình AP cho đợt này [B-RKG-PIONEER]. Cấu trúc 3 giai đoạn **chưa xác minh chéo** (tracker 2026 ghi 3 giai đoạn × 2 ngày: hạ Marauder → luyện quân → phá trại) [2].
- **Tương tác:** cả vương quốc góp điểm, xếp hạng liên server.
- **UI/UX:** Marauder hiện khắp bản đồ; bảng ghép 7 mảnh đổi rương; bảng xếp hạng cá nhân / vương quốc.
- **Vì sao giữ chân:** chỗ tiêu AP đã dồn, rương lớn, cảm giác "cả server chuẩn bị ra trận".
- **Tu tiên hoá:** *Tà tu lưu khấu* tràn vào giới trước *Phi thăng*: hạ để lấy *tàn quyển* (7 mảnh ghép thành *bảo hạp*), cộng điểm cho cả giới.
- **Game mình:** ✅ Khai Giới Trảm Tà (`world/eve.ts`, `sect/eve.ts`): trong pha Khai giới (5 ngày đầu mùa) hạ yêu thú giới rơi tàn quyển (1–3 theo cấp), đủ 7 đổi một rương tiếp tế; mỗi tàn quyển cộng giới vận cho tiên minh, cổng mở thì 3 minh đầu sản lượng +10 % trong 24 giờ. Chưa có lưu khấu / trại lưu khấu riêng (dùng yêu thú giới).
- **Ưu tiên:** P2 · **Công sức:** M.

#### C7. Barbarian Camps & Keeps trên bản đồ KvK

- **Mở khoá · nhịp:** bản đồ Lost Kingdom (KvK); thủ lĩnh sinh lại bất định, có thông báo khi xuất hiện / bị hạ (1.0.34) [PN34].
- **Cơ chế:** trại và thành man tộc có **thủ lĩnh** (Ironhand Baulur, Bloodfist Bargha…), rơi bản vẽ trang bị (1.0.31), thủ lĩnh sinh lại bất định (1.0.33), thành gần tâm cấp cao hơn (1.0.34), thêm độ khó và Xương thú, hạ Baulur mở trung tâm tài nguyên của thành (1.0.77, 1.0.83), thêm trại ở Heroic Anthem (1.0.91) [PN31][PN33][PN34][PN77][PN83][PN91].
- **Tương tác · giữ chân:** các vương quốc giành thủ lĩnh; nguồn bản vẽ trang bị và Xương thú.
- **Tu tiên hoá:** *Yêu tộc cứ điểm* có *yêu tướng* canh giữ.
- **Game mình:** ❌ (ngoài phạm vi — bản đồ KvK).
- **Ưu tiên:** P2 · **Công sức:** M.

#### C8. Lohar's Trial — sự kiện Lohar

- **Mở khoá · nhịp:** sự kiện vương quốc lặp theo lịch (thời lượng, chu kỳ chưa xác minh).
- **Cơ chế:** hạ man tộc rơi **Bone Necklace** (mở ra gem, tăng tốc, Arrows of Resistance, cơ hội ra di vật Lohar như Longbow/Buckler và vật phẩm **Lohar's Army**); dùng vật phẩm thì đạo quân Lohar hiện gần thành, **chỉ hạ được bằng kết trận**, thắng được **tượng Lohar** [RKG-LOH][18][B-HG-LOH]. Giá AP riêng của sự kiện: **chưa xác minh**.
- **Tương tác:** cần kết trận của minh để hạ quân Lohar.
- **UI/UX:** Bone Necklace vào túi đồ → mở; dùng Lohar's Army → boss hiện cạnh thành → mở kết trận.
- **Vì sao giữ chân:** biến việc cày man tộc hằng ngày thành "săn vật phẩm triệu hồi boss" + có tướng miễn phí.
- **Tu tiên hoá:** *Yêu Vương Tuần Sơn*: yêu thú rơi *yêu cốt liên*; ghép đủ thì *triệu hồi yêu vương* trước cổng núi, tiên minh kết trận hạ → nhận *truyền thừa* trưởng lão.
- **Game mình:** ✅ Yêu Vương Tuần Sơn (`world/lohar.ts`): yêu cốt từ yêu thú giới cấp 6+, 10 cái triệu hồi bản mạnh (máu ×2, 2 giờ) trên một yêu vương sẵn có; quà thêm theo sát thương + phần người triệu hồi. Chưa có truyền thừa trưởng lão riêng.
- **Ưu tiên:** P1 · **Công sức:** M.

#### C9. Ceroli Crisis / Ceroli Assault / Realm of Mystique / Ian's Ballads — phó bản tổ đội

- **Mở khoá · nhịp:** nằm trong trang Campaign (Ceroli Crisis, từ 1.0.88) [PN88]; cấp mở, số lượt/ngày chưa xác minh; Ceroli Assault giới hạn bằng Horn tự hồi.
- **Cơ chế:**
  - **Ceroli Crisis:** 4 người (1 đỡ đòn, 2 sát thương, 1 hỗ trợ; riêng Ak & Hok cần 2 đỡ đòn), 5 độ khó Easy → Hell, các thủ lĩnh Dekar, Keira, Frida, Astrid, Ak & Hok, Torgny (+ Alamanda Shamans 1.0.82); boss nổi cuồng ("Royal Bloodline") ở giây 300/420/600 tuỳ boss; tiền riêng đổi bản vẽ Keira, War Helm; kỹ năng vai trò (1.0.84) [B-RKG-CER][HG-CER][B-TG-CER][PN82][PN84]. Giới hạn lượt, AP: **chưa xác minh**.
  - **Ceroli Assault:** 12 người; mỗi lượt tốn 50 Horn of Ceroli (tự hồi, hoàn lại khi thua); vé mở rương; buff công/thủ và mở rộng quân không có tác dụng [B-RKG-CA].
  - **Realm of Mystique** (1.0.89): đội ngẫu nhiên màn, 3 màn thủ lĩnh Ceroli (màn cuối là boss), chế độ thường / Legend / cân bằng; bảng xếp hạng thời gian (1.0.90) [PN89][PN90].
  - **Ian's Ballads** (1.0.32): nhiều người đánh thủ lĩnh [PN32].
- **Tương tác:** ghép đội 4 hoặc 12 người, có vai trò; có cửa hàng tiền riêng.
- **UI/UX:** phòng chờ ghép đội, chọn vai, trận điều khiển trực tiếp trong phó bản riêng.
- **Vì sao giữ chân:** co-op có vai trò rõ, "raid" cho người thích PvE.
- **Tu tiên hoá:** *Man Hoang Cổ Tộc* / *Thượng cổ hung thú* — tổ đội 4 người (hộ pháp / chủ công / trị liệu).
- **Game mình:** 🟡 Man Hoang Cổ Tộc (`world/party.ts`, `AllyParty.svelte` — như Ceroli Crisis): Chủ Điện ≥ 8, phòng tối đa 4 người trong minh, 3 vai (Hộ Pháp / Chủ Công / Trị Liệu), 5 độ khó; đội đầu Luận Kiếm Đài (đệ tử ảo) đánh 5 đợt hung thú mạnh dần, server giải tự động, quà qua thư. Thiếu: Ceroli Assault 12 người, Realm of Mystique, cửa hàng tiền riêng.
- **Ưu tiên:** P2 · **Công sức:** L.

#### C10. Karuak Ceremony & Trial of Kau Karuak

- **Mở khoá · nhịp:** Karuak Ceremony là sự kiện có lịch; Trial of Kau Karuak thuộc mùa KvK, mở độ khó theo Kingdom Chronicles.
- **Cơ chế:** **Karuak Ceremony** — chuỗi đối thủ khó dần, nhờ minh giúp được, tốn AP và chỗ bệnh viện, một vòng có thể ra tới 10 tượng tướng [18][RKG-SCULPT]; **Trial of Kau Karuak** (KvK) — solo, 5 độ khó × 30 cấp, mục tiêu hiện trên bản đồ có thời hạn, thưởng pha lê công nghệ KvK, có trần số lần đánh mỗi mục tiêu (1.0.60) [RKG-KAU][PN60].
- **Tương tác · UI:** nút nhờ minh giúp (Ceremony); mục tiêu hiện trên bản đồ có đồng hồ (Trial), thưởng qua thư.
- **Vì sao giữ chân:** tượng tướng (Ceremony), pha lê công nghệ KvK (Trial).
- **Tu tiên hoá:** *Tế Thiên Đại Điển* — mỗi vòng một "tế vật" mạnh hơn.
- **Game mình:** ✅ Thí Luyện Yêu Hoàng (`sect/trial.ts`, lễ `yeuHoang` 4 ngày mỗi 14 ngày, `Trial.svelte` trong Trung tâm sự kiện): chọn một trong 5 độ khó (Dễ → Địa ngục, khoá cả lượt), đánh lần lượt 50 cửa bằng quân thật (thương binh về Đan phòng, 10 hành lực mỗi trận), cửa 10 / 20… là yêu tướng tinh anh, điểm mỗi cửa = bậc độ khó, mốc quà theo điểm; kèm Thông Thiên Tháp và Luận Võ Liên Hoàn. Thiếu: nhờ minh giúp, mục tiêu có giờ trên bản đồ (bản KvK).
- **Ưu tiên:** P2 · **Công sức:** S–M.

#### C11. Shadow Legion (Dark Fortress) — minh thủ thành trước làn sóng

- **Mở khoá · nhịp:** minh ≥ 30 người + điều kiện cấp (mâu thuẫn, xem dưới); sự kiện có hạn giờ, 25 đợt.
- **Cơ chế:** man tộc từ **Dark Fortress** tấn công thành của các thành viên minh (minh 30 người); khiên hoà bình vô dụng; quân mình **không chết**; một nguồn: **25 đợt** (cứ 5 đợt có một đợt nhẹ), qua hết thì mở độ khó kế; thành bị phá 2 lần là bị loại (dịch chuyển cũng tính là bị phá); quân sự kiện chịu ít 75 % sát thương đòn thường và thêm 75 % từ kỹ năng; điều kiện tham gia **mâu thuẫn** ("thành cấp 4+" vs "minh cấp 4") [B-RKG-SL][B-TG-SL][18].
- **Tương tác:** gửi viện binh cho thành đồng minh đang bị đánh; bị loại khi thành bị phá 2 lần.
- **UI/UX:** Dark Fortress hiện trên bản đồ, đợt quân kéo tới thành từng người, bảng tiến độ đợt của minh.
- **Vì sao giữ chân:** viện binh cho nhau có ý nghĩa, không sợ mất quân.
- **Tu tiên hoá:** *Thú triều công sơn* — sóng yêu thú đánh vào các tông môn của tiên minh; đồng môn gửi viện binh chặn.
- **Game mình:** ✅ Ma Triều Công Sơn (`world/legion.ts`): tiên minh ghi danh cả tuần, tối thứ Tư 20h 5 đợt cách 5 phút đánh vào núi từng người trong minh, sức theo lực phòng thủ của chính người đó (0,5× → 1,35×); viện binh đồng minh đóng ở nhà cùng thủ, quân ngã chỉ bị thương; quà theo điểm, ba minh đầu thêm quà.
- **Ưu tiên:** P1 · **Công sức:** M (dùng lại trận thủ `defense()` + viện binh).

#### C12. Holy-site Guardians & Runes — hộ vệ thánh địa và rune

- **Mở khoá · nhịp:** khi thánh địa đã xuất hiện (theo Monument); hộ vệ sinh lại hai lần mỗi ngày.
- **Cơ chế:** hộ vệ sinh quanh thánh địa (cả vương quốc gốc lẫn KvK), **không tốn AP**, cho nhiều kinh nghiệm, rơi **rune** và hiếm khi rơi bản vẽ [RKG-BEG][B-RKG-RUNES][30]; mạnh dần Sanctum < Altar < Shrine < Temple [30]; lịch: một nguồn ghi sinh lúc **00:00 và 12:00 UTC, tồn tại 11 giờ** [9][10][11][12], nguồn khác chỉ nói chu kỳ 12 giờ (cộng đồng) [30] — giờ cụ thể **chưa xác minh chéo**. Sức và kinh nghiệm (một nguồn): hộ vệ Sanctum 10.000 quân T1, ~2.500 kinh nghiệm; Altar ~15.000 T2; Shrine 30.000 T3, ~7.000 kinh nghiệm [9][10][11][12]. Rune: 5 bậc Trắng 3 % / Lục 7 % / Lam 10 % / Tím 15 % / Cam 20 % (hai nguồn); mỗi lúc chỉ **một rune** có hiệu lực, ~1 giờ (cộng đồng); danh sách loại rune vênh nhau (12 loại theo một nguồn; nguồn khác thêm tốc luyện quân, chữa thương, kinh nghiệm tướng); trên bản đồ KvK hầu hết rune là bậc cao nhất [B-RKG-RUNES][30].
- **Tương tác:** giành hộ vệ và rune với người khác quanh thánh địa.
- **UI/UX:** hộ vệ đứng quanh thánh địa; rune là vật thể trên bản đồ (1.0.91 hiện viền khi khuất sau núi) [PN91]; biểu tượng rune đang có trên HUD (chi tiết chưa xác minh).
- **Vì sao giữ chân:** lý do ghé thánh địa hai lần mỗi ngày kể cả khi không tranh chấp; buff nhặt được tạo "cửa sổ vàng" để đánh.
- **Tu tiên hoá:** *Hộ linh thú* quanh linh địa; rơi *phù văn* (buff tạm 1 giờ, 5 phẩm).
- **Game mình:** ✅ Hộ trận linh thú (`GUARDIANS` ở `data.ts`, `guardSide` ở `world/points.ts`, `take` ở `world/arrive.ts`): linh mạch / trận nhãn / Thiên Môn chưa thuần phục có đội linh thú giữ, mạnh dần theo cấp — phải đánh bại mới chiếm được lần đầu trong mùa. **Phù văn** (`runesAt/runesLeft` ở `world/points.ts`, `rune` ở `world/encamp.ts`): mỗi 12 giờ quanh mỗi linh địa sinh một phù văn ở ô trống (loại: công / thủ / sinh lực / khai mỏ / hành quân / tuyển; phẩm Bạch → Cam, vòng trong cao hơn) theo mầm bản đồ + chu kỳ; xuất quân tới nhặt → tăng ích 1 giờ, mỗi lúc một phù văn, ai tới trước được; vẽ trên bản đồ, chạm được trước điểm bên cạnh. Thiếu: hộ vệ sinh lại mỗi ngày (thuần phục rồi thì cả mùa không hồi).
- **Ưu tiên:** P2 · **Công sức:** M.

#### C13. Sự kiện quái / PvE khác trên bản đồ

| Tên gốc | Cơ chế | Nguồn |
|---|---|---|
| **Race Against Time** | 5 phút giết càng nhiều man tộc càng tốt, cấp cao cho nhiều điểm và thêm giờ (tối đa +4 phút), 3 lượt/ngày, không bắt đầu được trong 15 phút cuối; top 100 có thưởng, top 10 tượng huyền thoại | [RKG-RAT][PN33][PN79] |
| **Protect the Supplies** | Hộ tống đoàn xe qua man tộc, 50 AP/lượt, độ khó 3–5★ | [RKG-PTS] |
| **Deadly Dash** (1.0.84) | Đua với man tộc rồi tinh binh của chúng — chi tiết **chưa xác minh** | [PN84] |
| **Barbarian Incursions** (1.0.74/82/86) | Giành lại hàng của Hội đồng thương mại — chi tiết **chưa xác minh** | [PN74] |
| **Silk Road Speculators** | Hàng rơi trên bản đồ, nhặt tốn 80 AP (1.0.79, trước là 100), mỗi lần một đội (1.0.38) | [PN79][PN38] |
| **Halloween witch** | Phù thuỷ sự kiện, đánh một mình hoặc kết trận | [RKG-HAL] |
| **Holy Knight's Treasure** | Sự kiện rương gem — không phải quái bản đồ | [B-TG-HKT] |

- **Mở khoá · nhịp:** sự kiện có lịch, lặp lại (lịch cụ thể chưa xác minh); Race Against Time 3 lượt/ngày; Protect the Supplies tính lượt tốt nhất.
- **Vì sao giữ chân:** biến man tộc thường ngày thành trò chơi ngắn có xếp hạng và tượng tướng.
- **Tu tiên hoá:** *Nhất Chú Hương* (Race Against Time), *Hộ Tống Linh Thuyền* (Protect the Supplies), *Thương đội phàm nhân gặp nạn* (Barbarian Incursions / Silk Road), *Quỷ tiết* (Halloween → Trung Nguyên, quỷ hồn hiện trên bản đồ).
- **Game mình:** ❌ chưa có Race Against Time, Hộ Tống, Silk Road hay quỷ hồn sự kiện trên bản đồ — Trung Nguyên Quỷ Tiết, Liên Trảm Bất Hồi chỉ đếm việc có sẵn. Vật thể sự kiện trên bản đồ mới có thôn trang cháy của Thôn Trang Gặp Nạn (`world/rescue.ts`) và Yêu Vương Tuần Sơn (C8).
- **Ưu tiên:** P2 · **Công sức:** S–M mỗi sự kiện.

### 2.D Điểm tài nguyên và khai thác

#### D1. Resource Points — điểm tài nguyên thường

- **Mở khoá:** từ đầu; riêng mỏ gem cần nghiên cứu Jewelry (D3).
- **Nhịp:** gửi đội đi vài giờ, thu về khi đội mang đủ / mỏ cạn.
- **Cơ chế:** loại điểm: **Cropland** (lương), **Logging Camp** (gỗ), **Stone Deposit** (đá), **Gold Deposit** (vàng), **Gem Deposit** (gem) [C-RKG-AT][17]. Zone 2–3 có điểm tốt hơn zone 1 [7]; bảng cấp và trữ lượng từng cấp, tốc khai gốc từng loại: **chưa xác minh** (nằm ở rok.guide/fandom, không đọc được). Điểm **sinh lại theo khoảng ngẫu nhiên**; nút Tìm kiếm tìm điểm gần nhất (tầm có hạn) [C-RKG-FAQ]; từ 1.0.91 kết quả tìm đẩy điểm đang có người tới hoặc sắp cạn xuống dưới, và không sinh điểm ở tỉnh trung tâm Lost Kingdom trước khi công trình trung tâm mở [PN91]. **Sức mang mỗi lính** (bộ / cung / kỵ / công thành, T1 → T5): bộ 7/11/12/13/15, cung 6/8/9/11/13, kỵ 5/7/8/10/12, công thành 20/22/24/26/30 (T4–T5 bộ/cung/kỵ có hai nguồn; phần còn lại một nguồn) [GGI-TROOPS][OCG]. Số đội khai cùng lúc = số hàng đội (2/3/4/5 ở TTC 5/11/17/22) [RKG-CAP][HG-CAP].
- **Tương tác:** giành mỏ tốt; đội đang khai ở mỏ thường **bị đánh được** (chỉ đội ở trung tâm tài nguyên minh là an toàn) [C-RKG-AT] — xem D5.
- **UI/UX:** Tìm kiếm → chọn loại + cấp → chạm mỏ → "Khai thác" → chọn tướng khai (gợi ý tự động) → thanh tiến độ trên đội ở mỏ, số còn lại của mỏ.
- **Vì sao giữ chân:** "đặt việc dài rồi thoát" — mỗi lần mở game đều có đội về mang quà; khác biệt tướng khai giữa người chơi.
- **Tu tiên hoá:** *Linh khoáng mạch* (linh khoáng), *Linh thảo viên* (linh thảo), *Linh thạch khoáng* (linh thạch), *Tiên ngọc mạch* (tiên ngọc — premium).
- **Game mình:** ✅ **144 mỏ** (6 mỗi vùng ngoài/giữa, không có ở tâm), mỗi mỏ **một loại** trong 3 tài nguyên (theo chỉ số), trữ **20.000** (cấp 1, vòng ngoài) / **40.000** (cấp 2, vòng giữa), khai **3.000 / 5.000 mỗi giờ**, cạn thì hồi đầy sau **2 giờ**; mang theo sức mang đội (40 × hệ số bậc mỗi đệ tử × hệ — `UNIT_CARRY`); nhiều người khai chung một mỏ tới khi cạn; mỗi người một đội mỗi điểm; linh triều ở vùng thì khai **+50 %**; gọi về mang phần đã khai theo tỉ lệ thời gian; có trong bảng Tìm. Thiếu: nhiều cấp (1–5) theo vòng, mỏ premium.
- **Ưu tiên:** P0 (đã có) · **Công sức:** —

#### D2. Gathering Buffs & Commanders — tốc khai thác, tướng khai mỏ

- **Mở khoá · nhịp:** tăng dần theo nghiên cứu, tướng, VIP; vật phẩm 8 / 24 giờ.
- **Cơ chế:** nguồn tốc khai / sức mang (các con số là mức tối đa):
  - **Nghiên cứu:** Machinery +25 % mọi loại; mỗi loại hai nấc 15 % + 35 % (Sickle/Scythe lương, Handaxe/Whipsaw gỗ, Handcart/Stone Saw đá, Placer/Shaft Mining vàng); sức mang Wheel 15 % + Carriage 25 % [C-GGI-GATHER].
  - **Thiên phú tướng:** Superior Tools 25 %, Gathering Mastery 30 % mỗi loại, "The More The Better" +6 % tài nguyên khi khai xong [C-HG-CLEO].
  - **VIP:** VIP 15 +30 % (hai nguồn) [C-GGI-GATHER][C-HG-VIP].
  - **Vật phẩm:** Enhanced Gathering +50 % trong 8 hoặc 24 giờ (bản 24 giờ 450 gem) [C-HG-GATHER][RKG-FARM][C-TG-SHOP].
  - **Thánh địa:** Sanctum of Hope +5 %, Shrine of Honor +5 % [10][12].
  - **Lãnh thổ minh:** khai điểm thường **trong lãnh thổ minh +25 %** (≥ 4 nguồn) [17][C-RKG-AT][C-GE-ALLY][C-RKG-HACKS]; công nghệ minh Nature's Gift (1.0.84) tăng tốc khai ở Lost Kingdom [PN84].
  - **Tước hiệu:** Queen +15 %, tước minh "Saint" +10 %, Scientist +10 % vàng [16][C-HG-GATHER][C-RKG-TITLES].
  - **Nền văn minh** (một nguồn): Rome +10 % lương, France +10 % gỗ, Byzantium +10 % đá, Japan +5 % mọi loại [C-OCG-FARM].
  - **Tướng khai mỏ** (kỹ năng tối đa, nguồn 2026 đối chiếu 2 nơi) [C-HG-CMD][C-GGI-GATHER]:

| Tướng | Bậc | Tốc khai | Sức mang | Thêm |
|---|---|---|---|---|
| Cleopatra VII | Huyền thoại | đá 30 %, còn lại 20 % | 50 % | gói tài nguyên |
| Seondeok | Huyền thoại | vàng 30 %, còn lại 20 % | 30 % (công thành) | +10 % tài nguyên khi xong |
| Ishida Mitsunari | — | lương 30 %, gỗ/đá 20 % | 50 % | không cộng vàng/gem |
| Joan of Arc | Sử thi | 25 % mọi loại | 25 % | — |
| Matilda of Flanders | Sử thi | đá 25 %, lương/gỗ 20 % | — | +10 % khi xong |
| Constance | Tinh anh | gỗ 20 %, lương/đá 15 % | 30 % | +10 % khi xong |
| Sarka | Tinh anh | 18 % mọi loại | 30 % | +10 % sức chứa quân |
| Gaius Marius | Tinh anh | lương 20 %, gỗ/đá 15 % | 30 % | +15 % tốc hành quân công thành |
| Centurion | Cao cấp | 10 % | 10 % | — |

- **UI/UX:** tốc khai và sức mang hiện khi chọn đội khai; đội hình gợi ý tự động chọn tướng khai (1.0.88 tránh chọn tướng khai khi đánh man tộc) [PN88].
- **Vì sao giữ chân:** tạo "nghề" khai mỏ (tài khoản phụ farm), cho tướng rẻ có đất dụng võ.
- **Tu tiên hoá:** *Khai khoáng thuật* (công pháp), trưởng lão thiên phú *Địa hành*; *Tầm Mạch Phù* (+50 %).
- **Game mình:** ✅ khoá tăng ích `gather` (`gather()` ở `world/arrive.ts` dùng `lead(…, 'gather')`): Khai Linh Phù 8 / 24 giờ +50 %, bị động khai mỏ của Vân Hạc Chân Nhân (+20 %) và Tô Mị Nương (+30 %) từ cấp 20 khi dẫn đội; cộng với linh triều (+50 %) và lãnh thổ minh (+25 %). Chưa có công pháp / Hương Hỏa / thiên phú khai mỏ, chưa có tăng sức mang.
- **Ưu tiên:** P1 · **Công sức:** S (thêm khoá `gather`, một công pháp, một thiên phú, một phù).

#### D3. Gem Deposits — mỏ gem

- **Mở khoá · nhịp:** sau nghiên cứu Jewelry; mỏ nhỏ, khai nhanh, sinh lại ngẫu nhiên.
- **Cơ chế:** phải nghiên cứu **Jewelry** mới khai được [C-HG-GEM][C-TG-ECO][C-GE-GEM]; mỏ gem cấp 1 chứa **10 gem**, cấp 2 **20 gem** [C-RKG-GEM][C-HG-GEM]; ~20 phút khai 10 gem (một nguồn) [C-GE-GEM]; nghiên cứu Cutting & Polishing +1 % → +35 % tốc khai gem [C-HG-GEM][C-GGI-GEM]; không tướng nào có kỹ năng riêng cho gem [C-HG-CMD]; người chơi báo ~200–400 gem/giờ khi nhiều đội khai mỏ cấp 2 [C-AJ-TIPS][C-RKG-HACKS].
- **UI/UX:** biểu tượng mỏ gem trên bản đồ; gửi đội như mỏ thường.
- **Vì sao giữ chân:** người không nạp vẫn "đào" được tiền premium → lý do mở game thường xuyên.
- **Tu tiên hoá:** *Tiên ngọc mạch* — chỉ khai được sau khi ngộ *Tầm Bảo Thuật*.
- **Game mình:** ❌ cố ý — không có tiên ngọc vì game không bán gì (README: gem ❌ cố ý); mỏ chỉ ra ba tài nguyên.
- **Ưu tiên:** P2 (gắn với kinh tế P4) · **Công sức:** S.

#### D4. Alliance Resource Points & Resource Centers — điểm tài nguyên minh

- **Mở khoá · nhịp:** minh có lãnh thổ; trung tâm tài nguyên cho thành viên TTC 8+, sống 3 ngày rồi dựng lại.
- **Cơ chế:**
  - **Điểm tài nguyên minh cố định trên bản đồ** (Alliance Cropland / Logging Camp / Stone Deposit / Gold Deposit; Crystal Field ở Lost Kingdom): minh kiểm soát khi lãnh thổ phủ tâm điểm (đoạn trích fandom); sản xuất tài nguyên vào kho minh (giữ 24 giờ); thành viên khai trong lãnh thổ còn góp thêm vào kho minh [C-RKG-AT][C-FANDOM-TERR][17].
  - **Trung tâm tài nguyên minh** (Alliance Granary / Wood Lot / Stone Pit / Mother Lode): mỗi minh **một cái mỗi lúc**, dựng trên lãnh thổ; thành viên từ TTC 8; mỗi người một đội mỗi trung tâm; **đội khai ở đây không bị đánh**; trữ lượng gần như vô tận; không dựng xong trong 3 ngày thì bị dỡ, dựng xong cũng tự dỡ sau 3 ngày [C-RKG-AT][C-GE-ALLY][17]. Chi phí dựng: **chưa xác minh**.
- **Tương tác:** cả minh góp dựng, cùng khai, kho minh tích tài nguyên.
- **UI/UX:** người có quyền trong minh chọn chỗ trong lãnh thổ → dựng; thành viên chạm → Khai thác.
- **Vì sao giữ chân:** khai an toàn cho người yếu, lý do ở gần minh.
- **Tu tiên hoá:** *Tông minh linh điền* — cả minh góp công dựng, khai không bị cướp.
- **Game mình:** ✅ Minh khoáng (`allyMine` / `allyGather` ở `world/flags.ts`): trưởng lão / minh chủ dựng ở ô trống trong lãnh thổ (2.000 Minh khố, 2 giờ, mỗi minh một), người trong minh gửi đội khai 30.000/giờ, không ai cướp được, cạn hay sau 3 ngày thì tự tháo; kho minh (`world/storehouse.ts`): mỗi ô lãnh thổ sinh 0,1 Minh khố mỗi giờ.
- **Ưu tiên:** P2 · **Công sức:** M.

#### D5. Attacked while Gathering — bị đánh khi đang khai

- **Mở khoá · nhịp:** bất cứ lúc nào đội đang đứng ở mỏ ngoài bản đồ (khiên của thành có bảo vệ đội khai không: **chưa xác minh**).
- **Cơ chế:** đội khai ở điểm thường là mục tiêu PvP (chỉ đội ở trung tâm tài nguyên minh được bảo vệ) [C-RKG-AT]; mất phần đã khai hay không, khai trong lãnh thổ minh địch được không: **chưa xác minh**.
- **Tương tác:** giao tranh nhỏ giữa người khai và kẻ đi săn; minh gửi quân hộ tống.
- **UI/UX:** chạm đội đang khai của người khác → Tấn công; hai bên nhận báo cáo trận.
- **Vì sao giữ chân:** tạo rủi ro – phần thưởng cho khai mỏ xa, là "mồi" giao tranh nhỏ hằng ngày.
- **Tu tiên hoá:** *Cướp khoáng* — tà tu (hoặc tông môn đối địch) phục kích đội khai linh khoáng.
- **Game mình:** ✅ *Cướp khoáng* (`world/rob.ts`): chạm đội đang khai (trên bản đồ, hay danh sách "Đội đang khai" ở bảng mỏ) → chọn quân → đi thẳng tới mỏ; tới nơi mà đội kia còn khai thì giao chiến. Thắng lấy 50 % phần đã khai (không quá sức mang), đội kia về với phần còn lại, phần chưa khai trả về mỏ; thua thì đội kia khai tiếp. Điều kiện như cướp tông môn (tầng 6, chênh lực chiến, không đồng minh / minh ước), khiên không che đội ngoài bản đồ; khai trong lãnh thổ minh mình thì an toàn. Bên bị nhắm thấy cảnh báo Tháp canh có nút *Gọi về*; gọi kịp thì đội cướp về tay không (không chặn giữa đường).
- **Ưu tiên:** P1 · **Công sức:** M (task `raidMine`: trận với đội đang khai, bên thắng lấy một phần `mine.amount`).

### 2.E Dịch chuyển và bảo vệ

#### E1. Beginner's Teleport — dịch chuyển tân thủ

- **Mở khoá:** có sẵn khi tạo nhân vật; tồn tại **10 ngày** và bị thu lại khi Tòa thị chính lên **8** (văn bản giống FAQ trong game) [C-RKG-FAQ][C-BS-F2P]. Được mấy lần: **mâu thuẫn** — 2 (một lúc đầu, một ở TTC 7) [C-ALPHR]; 1 lúc tạo tài khoản [RKG-TP]; 1 khi vào minh lần đầu (dữ liệu 2018) [C-GGI-BEG].
- **Nhịp:** một lần đầu đời (số lần mâu thuẫn, xem trên).
- **Cơ chế:** dùng để chuyển tới 6 tỉnh ngoài cùng của một vương quốc khác mở chưa quá 10 ngày, hoặc dùng thay dịch chuyển lãnh thổ / có đích trong vương quốc hiện tại [C-RKG-FAQ]; điều kiện: chưa vào minh, không trong trận, mọi đội ở nhà, vương quốc đích có ít hơn 3 nhân vật của mình [RKG-TP][C-ALPHR][C-GE-TP]. Từ 1.0.78 (01/2024), ở vương quốc mới mở, dịch chuyển tân thủ / di cư **không vào được tỉnh đang khoá** tới khi xong một số chương Chronicle [PN78].
- **Tương tác:** về cạnh bạn bè / minh.
- **UI/UX:** dùng vật phẩm trong túi → chọn vương quốc và ô → xác nhận; thành biến mất rồi hiện ở chỗ mới.
- **Vì sao giữ chân:** cho người mới về cạnh bạn bè / minh ngay tuần đầu → giữ nhóm chơi cùng nhau.
- **Tu tiên hoá:** *Tân thủ Na Di Phù* — tông môn mới được dời núi một lần trong 10 ngày đầu / trước tầng 8.
- **Game mình:** ✅ Dời núi tân thủ (`newbieMove` ở `world/territory.ts`): trước Chủ điện tầng 8, lần dời đầu tiên tới được mọi ô trống vùng ngoài (không cần tiên minh), mọi đội phải ở nhà; chỗ ngồi đầu vẫn do server chọn (`spawn()`), mỗi mùa xếp lại.
- **Ưu tiên:** **P1** · **Công sức:** S (thao tác `move` kiểm ô trống giống `spawn()`, chỉ cho khi chưa có đội ngoài).

#### E2. Random Teleport — dịch chuyển ngẫu nhiên

- **Mở khoá · nhịp:** vật phẩm mua bằng gem / cửa hàng; dùng khi cần.
- **Cơ chế:** **500 gem**; đưa thành tới chỗ ngẫu nhiên **trong zone hiện tại**, không vượt cửa ải minh mình không giữ [C-TG-SHOP][RKG-TP][C-GE-TP]. Thành cháy tới hết độ bền tường cũng bị dịch chuyển ngẫu nhiên (xem E7).
- **UI/UX:** dùng vật phẩm → xác nhận → thành hiện ở chỗ ngẫu nhiên.
- **Vì sao giữ chân:** lối thoát nhanh khi bị kẹt giữa vùng chiến.
- **Tu tiên hoá:** *Tùy Cơ Độn Phù*.
- **Game mình:** ✅ Di Sơn Phù (`moveRandom` ở `world/territory.ts`): dời tông môn tới chỗ trống ngẫu nhiên ở vùng ngoài (như lúc lập tông môn); mọi đội ở nhà, đang sát khí thì không dời được.
- **Ưu tiên:** P2 · **Công sức:** S (cùng E1).

#### E3. Targeted (Advanced) Teleport — dịch chuyển có đích

- **Mở khoá · nhịp:** vật phẩm mua / VIP 6 giảm giá / mốc TTC 23; dùng khi cần.
- **Cơ chế:** **1.500 gem** (cửa hàng VIP từ VIP 6: 750 gem) [C-TG-SHOP][C-GGI-BEG][B-VIPSHOP][C-ALPHR]; một lần miễn phí ở mốc Era Breakthrough TTC 23 (một nguồn) [C-ALPHR]; tới bất kỳ ô trống **đã khám phá** trong vương quốc mà không bị cửa ải chặn, chỉ khi mọi đội đã về [C-RKG-FAQ]; nhảy giữa hai vùng cần quyền qua cửa ải [C-HG-TP].
- **UI/UX:** chọn ô đích trên bản đồ, xem trước chỗ đặt thành (chi tiết menu chưa xác minh).
- **Vì sao giữ chân:** chọn vị trí chiến lược (cạnh mỏ tốt, sát minh, áp sát địch).
- **Tu tiên hoá:** *Định Hướng Truyền Tống Phù*.
- **Game mình:** ✅ Càn Khôn Phù (`move` có `item` ở `world/territory.ts`): tới ô trống bất kỳ ở vòng đã mở theo pha mùa, không cần lãnh thổ, không chờ 24 giờ; mọi đội ở nhà, đang sát khí thì không dời được.
- **Ưu tiên:** P2 · **Công sức:** S.

#### E4. Territorial Teleport — dịch chuyển lãnh thổ

- **Mở khoá · nhịp:** khi minh đã có lãnh thổ; dùng mỗi lần minh dời "căn cứ" (trước trận thánh địa, khi vào zone mới).
- **Cơ chế:** **750 gem**; tới bất kỳ chỗ nào **trong lãnh thổ minh**, kể cả ở zone khác mà không cần giữ cửa ải; chọn ô ngoài lãnh thổ thì tự thành dịch chuyển có đích [C-TG-SHOP][C-RKG-FAQ][7]. KvK Heroic Anthem: sau "Past Glory" dịch chuyển được tới lãnh thổ bất kỳ của liên quân [B-HA].
- **Tương tác:** gom cả minh về một khu.
- **UI/UX:** chọn ô trong lãnh thổ minh → xác nhận.
- **Vì sao giữ chân:** minh "gom quân" về một chỗ là nền của kết trận, phòng thủ chung, tranh thánh địa.
- **Tu tiên hoá:** *Tông Minh Truyền Tống Trận* — dời sơn môn về cạnh linh mạch minh đang giữ.
- **Game mình:** ✅ Dời tông môn vào ô trống trong lãnh thổ minh mình (`move` ở `world/territory.ts`): chỉ ở vùng ngoài, mọi đội ở nhà, 24 giờ một lần; đội địch đang kéo tới chỗ cũ quay về tay không.
- **Ưu tiên:** **P1** · **Công sức:** S–M (điều kiện "lãnh thổ" rẻ nhất: trong vùng có linh mạch minh đang giữ).

#### E5. Teleport Restrictions — luật chung khi dịch chuyển

- **Cơ chế:** không dịch chuyển được khi đang giao tranh / "war frenzy", khi còn đội ngoài bản đồ, khi đang giữ viện binh của người khác, lên ô có người hoặc còn sương [RKG-TP]; từ 1.0.87 quân man tộc không còn chặn việc chọn ô [PN87]; kỹ năng Vua "Banish" (1.0.74) đày thành mục tiêu tới chỗ ngẫu nhiên ở tỉnh góc trên trái [PN74]. Nguồn dịch chuyển: cửa hàng, cửa hàng VIP, thương nhân bí ẩn, cửa hàng minh, Era Breakthrough, sự kiện [C-OCG-TP][C-ALPHR][C-GE-TP].
- **Tu tiên hoá:** *Luật dời sơn môn*: không dời khi còn đội ngoài, khi đang giao chiến, khi đang có viện binh đóng ở nhà.
- **Game mình:** ✅ luật dời núi (`world/territory.ts`): mọi đội phải ở nhà, đang sát khí (vừa đi cướp) thì không dời được, ô đích phải trống (cách điểm / tông môn khác từ 3 ô), dời vào lãnh thổ 24 giờ một lần; đội địch đang kéo tới chỗ cũ quay về tay không.
- **Ưu tiên:** đi cùng E1–E4 · **Công sức:** —

#### E6. Migration — di cư sang vương quốc khác (tóm tắt)

- **Mở khoá · điều kiện:** TTC 16+ (xem dưới).
- **Nhịp:** tối đa một lần mỗi 30 ngày.
- **Cơ chế:** TTC 16+, rời minh, mọi đội ở nhà, không bị tấn công, tài nguyên để ngoài không quá mức kho bảo vệ, cách lần di cư trước 30 ngày, vương quốc đích ≥ ~120 ngày tuổi và không đang KvK [C-RKG-MIG][C-OCG-TP][C-HG-MIG]; tốn **Passport Page** (600.000 điểm cá nhân mỗi trang) theo lực chiến: 1 trang dưới 10 triệu … 20 trang ở 45–50 triệu … 75 trang từ 100 triệu [C-HG-MIG]; di cư khác mùa cần đặt cọc 20.000 gem (1.0.83) và mỗi vương quốc nhận tối đa 30 người/mùa [PN83][C-RKG-MIG][C-AJ-MIG].
- **UI/UX:** chọn vương quốc đích trong danh sách, xem số Passport Page cần.
- **Vì sao giữ chân:** cho người chơi tìm server hợp sức mình thay vì bỏ game.
- **Tu tiên hoá:** *Phi thăng sang giới khác* — không cần: mùa của mình đã reset và cho vào giới mới.
- **Game mình:** ❌ (cố ý — PLAN: không chuyển server; người mới vào giới tới ngày 21 `JOIN_DAYS`).
- **Ưu tiên:** P2 · **Công sức:** M.

#### E7. Beginner's Protection & Peace Shield — bảo hộ tân thủ và khiên hoà bình

- **Mở khoá · nhịp:** khiên tân thủ có từ đầu; khiên hoà bình dùng khi cần, 8 giờ – 30 ngày.
- **Cơ chế:**
  - **Khiên tân thủ:** thành mới có khiên, mất khi tấn công người khác [RKG-BEG][C-AJ-EARLY]; thời lượng và cấp TTC hết khiên: **chưa xác minh**.
  - **Khiên hoà bình** (gem): 8 giờ 500 · 12 giờ 700 · 24 giờ 1.000 · 3 ngày 2.500 · 30 ngày 45.000 [C-TG-SHOP][C-MF]; mua được ở cửa hàng VIP, cửa hàng minh (điểm cá nhân) [C-RKG-FAQ]; chặn cả tấn công lẫn trinh sát, **vỡ ngay** khi mình đánh / trinh sát người khác [C-MF]; khiên vô dụng trong sự kiện Shadow Legion [B-RKG-SL].
  - **Thành cháy:** bị đánh thắng thì thành bốc cháy, độ bền tường tụt dần tới khi hết bị đánh một lúc; về 0 thì thành **bị dịch chuyển ngẫu nhiên**; tự dập bằng sửa tường; độ bền tường 15.000 (cấp 1) → 40.000 (cấp 25) [C-RKG-WALL][RKG-ATK][C-HG-CONQ][C-TG-WALL]. Tài nguyên giữ dưới dạng vật phẩm không bị cướp; kho bảo vệ một phần tài nguyên để ngoài [C-HG-CONQ][C-HG-BLD].
- **Tương tác:** khiên vỡ khi chủ thành đi đánh / trinh sát.
- **UI/UX:** bong bóng bao quanh thành trên bản đồ, đồng hồ khiên (chi tiết HUD chưa xác minh).
- **Vì sao giữ chân:** người chơi ngủ yên (khiên), người mới không bị "farm" ngay; khiên là món bán chạy.
- **Tu tiên hoá:** *Hộ Sơn Kết Giới* / *Hộ Sơn Phù*; "sơn môn cháy" → *kết giới vỡ, sơn môn bị đẩy đi*.
- **Game mình:** ✅ khiên tân thủ **72 giờ**, khiên **8 giờ** sau khi thủ thua, **Hộ Sơn Phù 8/24/72 giờ**, Bế Quan Lệnh (`sect/seclude.ts`); đi cướp thì mất khiên, sát khí 30 phút không bật được khiên; báo thù 24 giờ; kho bảo hộ 45 % sức chứa (`PROTECT`); linh hỏa thiêu sơn — trận lực về 0 lúc cháy thì tông môn bị đánh bật sang chỗ ngẫu nhiên (`core/wall.ts`, `world/wall.ts`). Chưa có khiên chặn do thám.
- **Ưu tiên:** P1 (thêm nguồn Hộ Sơn Phù, khiên chặn dò thám) · **Công sức:** S.

### 2.F PvE ngoài bản đồ (chế độ riêng)

#### F1. Expedition ("Great Expedition") — viễn chinh theo màn

- **Mở khoá:** nằm trong trang **Campaign** (từ bản 1.0.88, 11/2024, trang này gom cả Champions of Olympia và Ceroli Crisis, hiện điều kiện mở, thưởng chính, tiến độ từng chế độ) [PN88]. Cấp Tòa thị chính cần để mở: **chưa xác minh**.
- **Nhịp:** không giới hạn lượt theo nguồn hướng dẫn (khuyên "nâng cấp rồi đánh lại") — giới hạn lượt **chưa xác minh** [HG-EXP]; rương ngày reset 0:00 UTC [BS-EXP].
- **Cơ chế:**
  - Chuỗi màn đánh các đội địch dựng sẵn; ít nhất **51 màn** (đoạn trích máy tìm kiếm) [SNIP]; bản vá 2022–02/2025 không thấy thêm chương [PN86]. Số chương hiện nay **chưa xác minh**.
  - Số đội được mang tăng theo màn: 1 đội lúc đầu, 2 từ màn 6, 3 từ màn 16, 4 từ màn 26, 5 từ màn 41 [SNIP] (các hướng dẫn khớp đại thể: "2 đội" đầu, "5 đội" về sau [RKG-EXP][HG-EXP]). Tướng địch lên sao theo chục màn: 1★ → 6★ ở màn 51 [SNIP] (một nguồn).
  - **Quân ảo:** mỗi thống đốc có một kho quân viễn chinh; luyện 1 lính thật thì kho thêm 1; lính chết trong viễn chinh **không trừ** quân thật [FAQ-EXP][HG-EXP]. Chỉ thiên phú và sức chứa của tướng chính có tác dụng [HG-EXP].
  - **Điều khiển thời gian thực:** kéo từng đội, chọn mục tiêu (ví dụ cho đội đỡ đòn lao vào trước) [HG-EXP]; kỹ năng tướng nổ khi đầy 1.000 nộ như trận thường [RB-COMBAT] — bấm tay được hay không **chưa xác minh**.
  - **3 sao** theo điều kiện hiện trước trận: diệt hết địch trong thời hạn, giữ tổn thất dưới %, bảo vệ đơn vị đồng minh, không để đội nào chết… Thắng chưa chắc 3 sao [HG-EXP][BS-EXP].
  - **Thưởng:** qua màn lần đầu: tượng tướng huyền thoại/sử thi, sách kinh nghiệm, tài nguyên, **Medal of the Conqueror**, rương có tượng Aethelflaed [RKG-EXP]; mỗi màn đạt 3 sao cộng một phần vào **rương ngày** (nhận ở góc trên trái bảng nhiệm vụ) [SNIP][RKG-EXP][AJ-BEG].
- **Tương tác người chơi:** không (thuần solo).
- **UI/UX:** bản đồ chương dạng đường đi qua các màn (sao dưới mỗi màn) → màn chuẩn bị: điều kiện sao, đội địch, chọn tướng + đội hình → trận điều khiển trực tiếp → kết quả sao; rương ngày luôn nhấp nháy khi đầy.
- **Vì sao giữ chân:** nơi dùng tướng "ngồi không", thưởng tượng tướng ổn định mỗi ngày, câu đố chiến thuật; không mất quân thật nên không sợ thử.
- **Tu tiên hoá:** *Tiên Lộ Viễn Chinh* / *Vạn Lý Hành* — mỗi chương là một châu (Đông Thắng Thần Châu…), màn là "trạm dừng"; điều kiện sao theo lore ("hộ tống thư đồng", "không để trưởng lão nào trọng thương").
- **Game mình:** 🟡 bí cảnh (5 × 5 tầng, đánh ngay, mỗi tầng một lần, thưởng đan + trưởng lão) và Thông Thiên Tháp (vô hạn tầng, thưởng lần đầu, trưởng lão ở tầng 30/45) là PvE solo tương tự; rương ngày Tĩnh tọa ngộ đạo theo tầng tháp đã qua (`towerChest`). Thiếu: sao / điều kiện phụ, quân ảo (vẫn đánh bằng đệ tử thật, có thương vong), nhiều đội cùng trận, tiền + cửa hàng riêng. Trận tự động (PLAN: không làm trận điều khiển nhiều phút).
- **Ưu tiên:** P2 · **Công sức:** M (sao + rương ngày trên bí cảnh/tháp có sẵn) / L (chương mới, nhiều đội).

#### F2. Expedition Store — cửa hàng huân chương

- **Mở khoá · nhịp:** cùng Expedition; hàng giới hạn mỗi ngày, tướng nổi bật đổi hằng tuần.
- **Cơ chế:** tiêu **Medals of the Conqueror** [RKG-EXP][HG-EXP][BS-EXP]. Hàng: tượng **Aethelflaed** (huyền thoại — nguồn chính để có tướng này; thường có tới 3 tượng mỗi ngày) [RKG-AETH][HG-AETH], tượng **Constance** (sử thi) và tướng sử thi khác [RKG-CONST], tướng nổi bật đổi hằng tuần [RKG-EXP], thỉnh thoảng tượng huyền thoại khác giá **2.500 huân chương** [RKG-SCULPT]; thêm tượng Dazzling Starlight, chìa bạc/vàng, tăng tốc [BS-EXP]. Có giới hạn mua mỗi ngày [HG-EXP]; giá và luật làm mới **chưa xác minh**.
- **UI/UX:** tab cửa hàng trong màn Expedition.
- **Vì sao giữ chân:** "tiền viễn chinh đổi ra tướng" — động lực đánh tiếp khi đã kẹt màn khó.
- **Tu tiên hoá:** *Công Huân Các* — đổi *chiến công* lấy truyền thừa trưởng lão, mảnh công pháp.
- **Game mình:** ✅ **Trấn Tháp Các** (màn Thông Thiên Tháp): Tháp Lệnh từ tầng tháp đã qua và rương Tĩnh tọa mỗi ngày; hàng có hạn mỗi tuần, tín vật trưởng lão của tuần như tướng nổi bật (`towerBuy`, `TOWER_SHOP`, `TOWER_STARS`). Bí cảnh chưa ra tiền riêng.
- **Ưu tiên:** P2 · **Công sức:** S (khi đã có F1).

#### F3. Lyceum of Wisdom / Peerless Scholar — đố vui

- **Mở khoá:** công trình Lyceum ở **Tòa thị chính 10** [GE-CH][TG-LYC][RB-LYC]; ra mắt bản 1.0.32 (04/2020) [PN32].
- **Nhịp:** vòng loại các ngày trong tuần + vòng trong cuối tuần / cuối tháng (dạng cổ điển) hoặc hai tuần một lần (dạng 2024).
- **Cơ chế — hai dạng, nguồn mâu thuẫn:**
  - **Dạng mới theo bản vá chính thức 1.0.79 (02/2024):** Mock Exam mỗi ngày thứ Hai–thứ Sáu (một lượt/ngày, không tính loại), Preliminary và Final **hai tuần một lần**, tính điểm theo ngưỡng — ai qua ngưỡng chia **quỹ gem**; Mock Exam cho **Flash of Insight**, mỗi cái loại một đáp án sai trong Preliminary/Final [PN79].
  - **Dạng cổ điển (các hướng dẫn 2025–2026 vẫn tả):** Preliminary thứ Hai–thứ Sáu (0:00–23:00 UTC), 10 câu không giới hạn giờ, được nhờ minh giúp 3 lần; đúng ≥ 6 thì vào Midterm, đúng ≥ 9 nhận vé mạng Midterm (tối đa 3/tuần). **Midterm** thứ Bảy 02:30 hoặc 12:30 UTC, 15 câu (15 giây câu 1–5, 12 giây câu 6–10, 10 giây câu 11–15), mốc thưởng 5/10/15 câu, ≥ 10 câu có thêm thưởng minh, 15/15 chia quỹ gem và vào **Final** (thứ Bảy cuối tháng 14:30 UTC, 20 câu, 3 vé mạng) [TG-LYC][RB-LYC][HG-LYC][QN-LYC]. (Final 15 hay 20 câu: **mâu thuẫn** [QN-LYC].)
  - Không rõ dạng nào đang chạy năm 2026 (hướng dẫn có thể đã cũ). Quỹ gem "6,5 triệu" chỉ từ một nguồn bán bot — **chưa xác minh** [RB-LYC]. Ngân hàng câu hỏi: các trang đáp án liệt kê từ ~500 tới 1.500+ câu [GE-LYC][RKG-LYC][RB-LYC].
- **Tương tác người chơi:** nhờ minh giúp câu hỏi; chia quỹ gem chung cả server.
- **UI/UX:** màn thi cổ phong, đồng hồ đếm giây từng câu, 4 đáp án, thanh "đúng liên tiếp", bảng xếp hạng.
- **Vì sao giữ chân:** lý do đăng nhập vào giờ cố định (hẹn giờ thi), học lịch sử (bản sắc RoK), gem cho người không nạp.
- **Tu tiên hoá:** *Vấn Đạo Đường / Luận Đạo Đại Hội* — câu hỏi về đạo điển, ngũ hành, đan phương, lore tông môn; vòng loại hằng ngày ở *Tàng Kinh Các*, "đại hội luận đạo" cuối tuần.
- **Game mình:** ✅ Vấn Đạo Đài (`sect/quiz.ts`, `Quiz.svelte`; thẻ đầu Tàng Kinh Các, từ Chủ điện tầng 3): mỗi ngày 5 câu rút tất định từ 15 câu về luật chơi, sai thì hiện đáp án đúng, quà theo số câu đúng. Chưa có vòng thi theo giờ / quỹ thưởng chung.
- **Ưu tiên:** P2 · **Công sức:** M (ngân hàng câu hỏi ×2 ngôn ngữ mới là phần tốn công; cơ chế đơn giản).

#### F4. Sunset Canyon — đấu trường thủ bất đồng bộ (chỉ tóm tắt)

- **Nhịp:** 5 lượt miễn phí mỗi ngày, mùa 7 ngày (xem trên).
- **Cơ chế:** xếp tối đa **5 đội** vào ô cố định, đánh đội hình phòng thủ của người khác, trận tự động; đội đánh đối thủ đối diện trước, hàng trước bị đánh trước [AC-SC][RKG-SC]; **5 lượt miễn phí/ngày**, thêm lượt bằng vé; mùa **7 ngày**, điểm reset mỗi mùa; thưởng ngày theo điểm, thưởng mùa theo hạng [SNIP-SC][RKG-SC]; chỉ tính cấp tướng, thiên phú, trang bị, sức chứa VIP [FAQ-SC]. Cấp mở **chưa xác minh**. Chi tiết ở file PvP.
- **Tương tác · UI:** đánh đội hình phòng thủ của người khác; xếp 5 đội vào lưới ô rồi xem trận tự động.
- **Vì sao giữ chân:** đấu trường không mất quân, thưởng ngày đều.
- **Tu tiên hoá:** *Luận Kiếm Đài*.
- **Game mình:** ✅ Luận Kiếm Đài (`sect/arena.ts`, `world/arena.ts`, `Arena.svelte`): đội hình thủ, đệ tử ảo (không mất quân), 5 lượt/ngày, Elo, rương ngày theo bậc, bảng tuần + thư quà top 10, Kiếm Ý đổi ở Thương Điếm, phục thù.
- **Ưu tiên:** P2 · **Công sức:** M.

#### F5. Các chế độ PvE solo khác (sự kiện)

| Tên gốc | Cơ chế chính | Thưởng | Nguồn |
|---|---|---|---|
| **Arms Training** | Đánh boss Lohar nhiều lần; sau mỗi lần thắng boss nhận thêm một kỹ năng do mình chọn; 10.000 điểm/lần hạ, màn thường trần 300.000 rồi Legend Mode; 3 ngày, 5 lượt/ngày | Top 10: bản vẽ mũ huyền thoại (trước là tượng) | [RKG-AT] |
| **Protect the Supplies** | Hộ tống đoàn xe qua các đợt man tộc, 50 AP mỗi lượt, tự chọn độ khó 3–5★, chỉ tính lượt tốt nhất | Top 10: tượng vàng | [RKG-PTS] |
| **Race Against Time** | Giết càng nhiều man tộc càng tốt trong 5 phút (cộng giờ tối đa 4 phút), 3 lượt/ngày, reset 0:00 UTC | Top 100 thưởng thêm; top 10 tượng huyền thoại | [RKG-RAT] |
| **Trial of Kau Karuak** | Solo, 5 độ khó mở theo Kingdom Chronicles, mỗi độ khó 30 màn đánh boss có giờ | Pha lê cho công nghệ KvK | [RKG-KAU] |
| **Golden Kingdom** (1.0.34) | Hầm solo 20 tầng, khám phá sương mù, 5 đội mình đánh 5 đội NPC, mỗi tầng 5 trận, điểm lưu mỗi 4 tầng, cửa hàng vàng Karaku ở tầng 4/8/12/16, mang tối đa 9 **di vật** (phúc lành kiểu roguelike); cần Tòa thị chính 17; mọi buff có tác dụng trừ mở rộng quân | Nguyên liệu tướng, di vật, tài nguyên | [RKG-GK][PN34][18] |

- **Mở khoá · nhịp:** sự kiện có lịch, lặp lại; Arms Training 3 ngày × 5 lượt; Golden Kingdom cần TTC 17.
- **Vì sao giữ chân:** biến thể ngắn, có xếp hạng, thưởng tướng / bản vẽ.
- **Tu tiên hoá:** Arms Training → *Thí Luyện Yêu Vương* (yêu vương học thêm thần thông sau mỗi lần thua); Protect the Supplies → *Hộ Tống Linh Thuyền*; Race Against Time → *Nhất Chú Hương* (đốt một nén nhang, giết yêu thú tới khi tàn); Golden Kingdom → *Luân Hồi Huyễn Cảnh* (mỗi tầng chọn một *cơ duyên*).
- **Game mình:** 🟡 Luận Võ Liên Hoàn (`sect/drill.ts`, như Arms Training): mỗi ngày một phiên, đội ảo đấu liên tiếp giáo đầu mạnh dần, cứ 3 trận thắng tự chọn 1 trong 3 công pháp cho giáo đầu, mốc quà 3 / 6 / 9 / 12 / 15 trận. Thiếu: Golden Kingdom (hầm chọn cơ duyên), Race Against Time, Protect the Supplies, Kau Karuak.
- **Ưu tiên:** P2 · **Công sức:** S mỗi sự kiện khi đã có khung (tháp + sự kiện tuần), M cho roguelike.

### 2.G UI bản đồ

#### G1. Zoom levels: Tactical View ↔ Strategic View — các mức thu phóng

- **Mở khoá · nhịp:** có từ đầu; dùng mỗi lần mở bản đồ.
- **Cơ chế · UI/UX:** chạm nút bản đồ để ra khỏi thành; kéo/chụm để phóng. Hai lớp được đặt tên chính thức: **Tactical View** (gần: thấy hình đại diện quân mình, hiệu ứng kỹ năng, số sát thương) và **Strategic View** (xa: quân mình thành "viên kim cương" kèm hình đại diện) [PN82]. Bản vá 2024–2025 thêm cho Strategic View: lớp "tổng quan trận", **danh sách mọi trận đang diễn ra**, một mức hiển thị rộng hơn (1.0.87); **bản đồ nhiệt** thời gian thực và tùy chọn phóng nhanh (1.0.89); tùy chọn kiểu đơn vị / biểu tượng quân, hiện số quân còn lại của mục tiêu, thanh nộ trên hình đại diện (1.0.82); một chạm gập hết bảng giao diện (1.0.81) [PN87][PN89][PN82][PN81]. **Giữ nút "Về thành"** mở vòng chọn các mức zoom đặt sẵn (1.0.88) [PN88]. Bản đồ làm lại (thử nghiệm 1.0.91): chuyển về bản đồ cũ được; rune ở thánh địa và quân mình khuất sau núi hiện viền [PN91]. Những gì hiện ở từng mức (thành → biểu tượng → lãnh thổ) chi tiết hơn: **chưa xác minh**.
- **Vì sao giữ chân:** nhìn toàn cục chiến trường (bản đồ nhiệt, danh sách trận) khiến người không tham chiến vẫn muốn mở bản đồ xem.
- **Tu tiên hoá:** *Thần thức* (gần) ↔ *Thiên nhãn* (xa); bản đồ nhiệt = *sát khí* bốc lên nơi đang giao chiến.
- **Game mình:** ✅ bản đồ giới WebGL: kéo quán tính, chụm, con lăn, phím mũi tên và +/−, địa hình nướng 3 mức chi tiết (LRU), ghim tên tông môn chỉ hiện khi đủ gần (tối đa 60 tông môn gần tâm nhìn), thu nhỏ hết thì cả giới nằm giữa màn (`WorldView.svelte`); xa tới mức ẩn tên thì hiện hiệu mỗi tiên minh giữa lãnh thổ (`terrTags`), nút Toàn giới / Phóng gần (`whole`), bản đồ nhỏ (`world/Minimap.svelte`). Thiếu: sát khí / bản đồ nhiệt, danh sách trận đang diễn ra.
- **Ưu tiên:** P2 · **Công sức:** S–M.

#### G2. Coordinates & Share — toạ độ, chia sẻ toạ độ

- **Mở khoá · nhịp:** có từ đầu; dùng mỗi lần phối hợp.
- **Cơ chế · UI/UX:** mọi ô có toạ độ X/Y (toạ độ hang động công bố lên tới ~1186 → bản đồ ~1.200 × 1.200) [AJ-CAVE]; chạm thành / cờ / mục tiêu → biểu tượng **chia sẻ** → chọn kênh chat; toạ độ trong chat là liên kết bấm để bay tới [FAQ-COORD]. Ô nhập "đi tới toạ độ" (kèm số vương quốc): **chưa xác minh** qua nguồn đọc được.
- **Tương tác:** chia toạ độ vào kênh minh / vương quốc để hẹn nhau.
- **Vì sao giữ chân:** phối hợp minh ("tập trung ở X:512 Y:640") là nền của mọi hoạt động nhóm.
- **Tu tiên hoá:** *Phương vị* / *Truyền âm phù* chứa toạ độ.
- **Game mình:** ✅ bảng chạm ô ghi toạ độ "(x,y)" và có nút gửi vào kênh minh / giới (`TileSheet`); toạ độ trong chat thành nút "Tới" — bản đồ Giới bay tới, vòng son nháy (`Chat`, `WorldView`). Chưa có ô nhập toạ độ.
- **Ưu tiên:** P1 · **Công sức:** S (toạ độ ô đã có trong `Pick`; thêm định dạng liên kết trong chat + ô nhập).

#### G3. Bookmarks — đánh dấu cá nhân

- **Mở khoá · nhịp:** chưa xác minh.
- **Cơ chế · UI/UX:** **chưa xác minh** qua nguồn đọc được trong đợt này (bản vá 1.0.87 chỉ nhắc "yêu thích" cho tướng) [PN87].
- **Vì sao giữ chân (dự đoán):** bớt công tìm lại mỏ, pháo đài, kẻ thù quen.
- **Tu tiên hoá:** *Ngọc giản ghi dấu*.
- **Game mình:** ✅ Ghi nhớ (`sect/pins.ts`): ★ tối đa 20 chỗ có lời ghi, lưu trong state nên máy nào cũng thấy; hiện trên bản đồ Giới và trong bảng Tìm, bấm là bay tới.
- **Ưu tiên:** P2 · **Công sức:** S.

#### G4. Alliance Markers — dấu tiên minh trên bản đồ

- **Mở khoá · nhịp:** trong minh (quyền cắm dấu chưa xác minh); dùng trước mỗi hoạt động tập thể.
- **Cơ chế · UI/UX:** minh cắm **dấu** lên bản đồ cho cả minh thấy; theo bản vá: dấu quân nhấp nháy khi chọn đội đó (1.0.71); dấu riêng cho Ark of Osiris, 4 điều phối viên AoO được cắm dấu (1.0.78, 1.0.82); **chạm dấu minh được chia sẻ trong chat thì bay tới chỗ đó** (1.0.84); số **dấu liên quân** tăng từ 10 lên 20 (1.0.88); thêm **2 dấu "đếm ngược"** cho minh, liên quân và điều phối viên AoO, có chữ tự đặt và giờ đếm ngược (1.0.90) [PN71][PN78][PN82][PN84][PN88][PN90]. Số dấu thường mỗi minh và ai được cắm: **chưa xác minh**.
- **Tương tác:** chỉ huy minh ra lệnh bằng dấu trên bản đồ.
- **Vì sao giữ chân:** chỉ huy minh "vẽ kế hoạch" ngay trên bản đồ (tập trung ở đây, 20:00 đánh chỗ kia) — tạo cảm giác tổ chức, hẹn giờ quay lại.
- **Tu tiên hoá:** *Trận kỳ* cắm trên bản đồ (minh chủ / trưởng lão cắm, cả minh thấy, kèm lời nhắn và *hương hẹn giờ* đếm ngược).
- **Game mình:** ✅ Dấu của minh (`allyMark` ở `world/guild.ts`): từ R3 đặt tối đa 5 dấu có lời ghi (≤ 20 chữ), cả minh thấy trên bản đồ Giới, bấm là bay tới. Chưa có dấu đếm ngược giờ hẹn (hẹn giờ nằm ở Minh sự lịch).
- **Ưu tiên:** P1 · **Công sức:** S (vài dấu mỗi minh, lưu trong `World.allies`; hiện trên cảnh và trong chat minh).

#### G5. Search — tìm man tộc / mỏ theo cấp

- **Mở khoá · nhịp:** có từ đầu; dùng mỗi lần đi săn / đi khai.
- **Cơ chế · UI/UX:** nút tìm kiếm chọn loại (man tộc, từng loại mỏ) và cấp, tìm điểm **gần nhất** trong tầm có hạn (man tộc cấp cao ngoài tầm thì phải tự thu nhỏ bản đồ mà tìm) [23][C-RKG-FAQ]; man tộc ≤ cấp 12 không có quanh thành thì **sinh ngay cạnh thành**, cấp 13+ chỉ sinh theo đợt ở chỗ ngẫu nhiên [22]; từ 1.0.91 kết quả tìm mỏ đẩy mỏ đang có người hoặc sắp cạn xuống dưới [PN91]; man tộc/mỏ sinh lại theo khoảng ngẫu nhiên [FAQ-SPAWN].
- **Vì sao giữ chân:** bớt thao tác lặp; vòng "tìm → đánh → tìm" chạy nhanh.
- **Tu tiên hoá:** *Tầm bảo la bàn* / *Linh thú bàn*.
- **Game mình:** ✅ nút Tìm trên thẻ mùa bản đồ Giới (`WorldView.svelte`): yêu thú giới (nhóm cấp 1–5 / 6–10 / 11–15), mỏ, linh mạch, yêu vương theo cấp — điểm gần nhất còn sống và có đường, bay tới và mở bảng điểm.
- **Ưu tiên:** P1 (đi kèm C2 yêu thú trên giới) · **Công sức:** S.

#### G6. Filters — bộ lọc hiển thị

- **Mở khoá · nhịp:** có từ đầu (Filter Mode từ 1.0.88).
- **Cơ chế · UI/UX:** lọc "Explore View" và "Alliance View" [HG-SCOUT]; **Filter Mode** gộp (1.0.88): lọc quân đồng minh / địch / mình, bật tắt chân dung và mô hình quân [PN88]; bộ lọc tổng quan trận khớp Strategic View, thấy pháo đài minh (1.0.91) [PN91].
- **Vì sao giữ chân:** bản đồ đông người vẫn đọc được.
- **Tu tiên hoá:** *Thiên nhãn* chọn "chỉ xem đồng môn / địch".
- **Game mình:** ✅ Lớp tình hình (`LAYERS` ở `world/WorldView.svelte`, `setHide` ở `worldmap.ts`): nút ở góc bản đồ Giới bật / tắt Yêu thú · Mỏ · Hành quân · Lãnh thổ, nhớ theo máy; huy hiệu tô màu theo quan hệ (`Rel`). Chưa lọc hành quân theo quan hệ (mình / đồng minh / địch).
- **Ưu tiên:** P2 · **Công sức:** S.

#### G7. March Lines — đường hành quân hiển thị

- **Mở khoá · nhịp:** luôn hiện.
- **Cơ chế · UI/UX:** mọi đội đang đi hiện đường nối điểm đi – điểm tới; bản 1.0.91 làm đường mảnh hơn [PN91]. Màu theo quan hệ (mình / minh / địch): **chưa xác minh** qua nguồn đọc được.
- **Vì sao giữ chân:** thấy thế giới chuyển động, biết ai đang tới đâu.
- **Tu tiên hoá:** *độn quang* — vệt sáng của đội bay qua giới (đã có: cờ quân trên nét đứt).
- **Game mình:** ✅ cờ quân chạy trên đường nét đứt vẽ tay, qua các cổng (đường Dijkstra), vị trí nội suy ở client; chạm cờ → bảng đội (của ai, đi đâu, tới lúc nào).
- **Ưu tiên:** P0 (đã có) · **Công sức:** —

#### G8. Tap Tile → Action Menu — chạm ô ra menu thao tác

- **Mở khoá · nhịp:** luôn có.
- **Cơ chế · UI/UX:** chạm vật thể → vòng nút thao tác theo loại (tấn công, trinh sát, kết trận, khai thác, đồn trú, chia sẻ…) [FAQ-COORD]; **Quick Commands** (1.0.88): chọn đội rồi chạm đất để đi, chạm mục tiêu để đánh, giữ để "vừa đi vừa đánh"; tự chọn loại mục tiêu được phép [PN88]. Danh sách đầy đủ nút theo từng vật thể: **chưa xác minh**.
- **Vì sao giữ chân:** mọi việc bắt đầu bằng một chạm — ít màn trung gian.
- **Tu tiên hoá:** chạm là *thần thức quét* — bảng hiện như cuộn giấy (đã có: Sheet cuộn tranh).
- **Game mình:** ✅ `TileSheet.svelte`: chạm tông môn (thông tin, đường đi, cướp), điểm (phe giữ, mỏ còn bao nhiêu, yêu vương còn máu, chiếm/khai/đánh, một mình / mở kết trận / góp đội, gọi về), đội hành quân, ô trống (vùng, vòng, địa hình, thời tiết); mọi ô có toạ độ, gửi kênh minh / giới, ghi nhớ ★, dấu minh; do thám nằm trong bảng Tranh đoạt (nút Tấn công).
- **Ưu tiên:** P0 (đã có) · **Công sức:** —

#### G9. Troop Dispatch Queue — danh sách đội ngoài bản đồ

- **Mở khoá · nhịp:** luôn có; số ô theo số hàng đội.
- **Cơ chế · UI/UX:** hàng biểu tượng đội ở **mép phải** màn hình; điện thoại hiện 5, bật "Show Full Dispatch Queue" hiện 7 (1.0.83) [PN83]; chạm đúp một đội chọn hết đội mình trên màn rồi kéo thả để đi cùng nhau [FAQ-MULTI][PN31]; điều khiển nhiều đội cùng lúc hoạt động với bộ đội hình lưu sẵn [PN83]. Nút tăng tốc / gọi về trên bảng: **chưa xác minh**.
- **Vì sao giữ chân:** biết ngay đội nào sắp về → lý do mở game đúng lúc.
- **Tu tiên hoá:** hàng *thẻ bài trưởng lão* đang xuất sơn.
- **Game mình:** ✅ bản đồ vùng có thẻ "đội: n/tối đa" + danh sách đội; HUD có mục **Đang diễn ra** (desktop: cột trái) liệt kê cả hành quân kèm đồng hồ, chạm → mở bản đồ. Thiếu: trên bản đồ giới (điện thoại) chưa có hàng đội riêng, chưa chọn nhiều đội.
- **Ưu tiên:** P1 · **Công sức:** S.

#### G10. Return to City — về thành

- **Mở khoá · nhịp:** luôn có.
- **Cơ chế · UI/UX:** nút góc dưới về thành / về vị trí thành trên bản đồ; giữ nút để mở vòng mức zoom (1.0.88) [PN88].
- **Vì sao giữ chân:** không bao giờ "lạc" trên bản đồ lớn.
- **Tu tiên hoá:** *Hồi sơn* — về tông môn.
- **Game mình:** ✅ nút "Tông môn của bạn" trên dải trên bản đồ giới đưa camera về chỗ ngồi; tab Tông môn là cảnh núi.
- **Ưu tiên:** P0 (đã có) · **Công sức:** —

#### G11. Kingdom Overview — tổng quan vương quốc

- **Mở khoá · nhịp:** luôn có.
- **Cơ chế · UI/UX:** thu nhỏ hết thấy toàn vương quốc, lãnh thổ các minh; lớp tổng quan trận + danh sách trận đang diễn ra (1.0.87) [PN87]; **báo cáo trinh sát** liệt kê mọi phát hiện (làng, hang, cửa ải) và cho bấm bay tới [C-HG-SCOUT2]. Danh sách thánh địa kèm minh giữ và bảng lọc: **chưa xác minh** qua nguồn đọc được.
- **Vì sao giữ chân:** thấy cục diện cả server, biết minh mình đứng đâu.
- **Tu tiên hoá:** *Sơn Hà Xã Tắc Đồ* — tấm bản đồ toàn giới, liệt kê linh địa và phe giữ.
- **Game mình:** ✅ Sơn Hà Xã Tắc Đồ (`world/Holdings.svelte`, nút ở bảng Tìm): mọi linh mạch / trận nhãn / Thiên Môn theo loại, phe giữ + số đội đóng, tăng ích linh mạch, cổng chưa mở theo pha, lọc "chỉ minh mình", bấm Tới bay tới và mở bảng điểm; thu nhỏ hết thấy cả giới với hiệu từng tiên minh.
- **Ưu tiên:** P1 · **Công sức:** S.

### 2.H Hành quân

#### H1. March Speed — tốc hành quân

- **Mở khoá · nhịp:** luôn áp dụng; tăng dần theo nghiên cứu, tướng, VIP.
- **Cơ chế:** đội đi theo tốc của **loại quân chậm nhất** trong đội; nhanh → chậm: kỵ, cung, bộ, công thành [RB-MARCH][OMD][OCG]. Tốc gốc từng loại: **chưa xác minh**. Cộng dồn kiểu cộng: tốc = gốc × (1 + tổng % thưởng) (nguồn bán bot, Lilith chưa xác nhận) [RB-MARCH]. Nguồn thưởng: nghiên cứu Pathfinding 15 % + Cartography 15 % (cấp 5) [GGI-MIL]; VIP 15 +5 % [GGI-MS]; thiên phú tướng (một bản dựng kỵ Cao Cao ~52 %) [RKG-CAV]; kỹ năng tướng (các nguồn vênh nhau vì là kỹ năng có điều kiện) [GGI-MS][RKG-CAV]; trang bị (mỗi món bộ Windswept 3 %, chỉ kỵ) [RKG-CAV]; Sanctum of Wind +5 % [6]; kết trận có kỹ năng lãnh chúa +9 % [GGI-RALLY]; công nghệ minh "Rapid March" tăng tốc khi tới mục tiêu trên lãnh thổ minh (không có thưởng tự động khi đứng trên lãnh thổ) [17][RB-MARCH]. Trinh sát nhanh tới +125 % nhờ Scout Camp [GGI-SCOUT].
- **UI/UX:** thời gian tới nơi hiện trước khi bấm xuất quân; đồng hồ trên đội đang đi.
- **Vì sao giữ chân:** tối ưu tốc là một "nghề" (bộ kỵ nhanh để chặn đường, đánh man tộc xa).
- **Tu tiên hoá:** *độn tốc* — công pháp độn thuật, *Thần Hành Phù* (đã có).
- **Game mình:** ✅ 12 giây/ô trên bản đồ giới (`TILE_TIME`), 0,5 giây/đơn vị (tối thiểu 20 giây) trên bản đồ vùng; giảm bằng công pháp **Thần Hành** (−8 %/cấp, 5 cấp) qua `cutOf(s, 'march')`, tối đa giảm `MAX_CUT` 60 %; túi đồ có **Thần Hành Phù** +25 % trong 8 giờ. Trên bản đồ Giới đội đi theo hệ chậm nhất (`UNIT_SPEED`: kiếm tu ×1,15 · pháp tu ×1 · thể tu ×0,85).
- **Ưu tiên:** P0 (đã có) · **Công sức:** —

#### H2. Redirect — đổi hướng giữa đường

- **Mở khoá · nhịp:** luôn có.
- **Cơ chế:** chọn đội đang đi rồi chạm đất / mục tiêu khác (Quick Commands 1.0.88), hoặc kéo lại [PN88][DEV20]; "vừa đi vừa đánh" (attack-march) từ 1.0.91 ưu tiên đánh địch ở gần, khó bị dụ [PN91].
- **UI/UX:** chọn đội trên bản đồ hoặc trong hàng đội → chạm đích mới.
- **Vì sao giữ chân:** phản ứng nhanh trong giao tranh; sửa sai không mất trắng thời gian.
- **Tu tiên hoá:** *Chuyển độn* — đổi hướng độn quang giữa không trung.
- **Game mình:** 🟡 đội đang đi chỉ quay đầu về được (`turnAround` ở `world/spots.ts`); riêng đội săn đang về thì chuyển thẳng sang yêu thú giới khác (`huntChain`). Thiếu: đổi đích tuỳ ý giữa đường (tính đường mới từ vị trí nội suy `marchAt`).
- **Ưu tiên:** P2 · **Công sức:** M (tính lại đường từ vị trí giữa đường; đường đi qua cổng nên phải chọn cổng gần nhất).

#### H3. Recall — gọi về

- **Mở khoá · nhịp:** luôn có.
- **Cơ chế:** gọi đội đang đi / đang đóng / đang khai mỏ quay về (đội đang khai mang về phần đã khai); vật phẩm "về ngay" / tăng tốc hành quân: **chưa xác minh** (một hướng dẫn tăng tốc 2026 không liệt kê loại tăng tốc hành quân) [HG-SPD].
- **UI/UX:** nút gọi về trên đội / trong hàng đội (chi tiết chưa xác minh).
- **Vì sao giữ chân:** sửa sai, né đòn đánh úp.
- **Tu tiên hoá:** *Thu binh hồi sơn*.
- **Game mình:** ✅ Gọi về (`recallable` / `turnAround` ở `world/spots.ts`): đội đang đi trên bản đồ Giới (không thuộc kết trận) quay đầu từ chỗ đang đứng, về mất bằng thời gian đã đi, đi săn thì hoàn hành lực, bên bị nhắm thôi thấy đội kéo tới; đội đóng quân, khai mỏ (mang phần đã khai theo tỉ lệ thời gian), viện binh, giữ trận kỳ cũng gọi về được.
- **Ưu tiên:** P1 · **Công sức:** S (quay đầu: `returnAt = now + (now − startAt)`, như `turnBack()` sẵn có).

#### H4. Station / Stand on the map — đóng quân ở ô trống

- **Mở khoá · nhịp:** luôn có.
- **Cơ chế:** đội có thể dừng ở ô bất kỳ (đi tới đất trống rồi đứng) để phục kích, chắn đường, chờ kết trận [FAQ-MULTI][PN88] — luật chi tiết (thời hạn, bị đánh) **chưa xác minh**. Trinh sát đứng giữ chỗ được 60 phút (1.0.76) [PN76].
- **UI/UX:** chọn đội → chạm ô trống → đội đứng yên chờ lệnh.
- **Vì sao giữ chân:** mở ra phục kích, chắn đường, dàn trận trước giờ hẹn.
- **Tu tiên hoá:** *Trú quân / bày trận giữa đường*.
- **Game mình:** ✅ Đóng trại ở ô trống đã khai (`world/encamp.ts`: `camp`, gọi về như đội đóng ở điểm); phe khác đánh trại được (`hitCamp`: như đi cướp, thắng thì trại tan). Ngoài ra đóng quân ở điểm, trận kỳ / Tổng đà (`flagGuard`) và nhà đồng minh (viện binh).
- **Ưu tiên:** P2 · **Công sức:** M.

#### H5. Open-field Battle & Interception — giao chiến giữa bản đồ, chặn đường

- **Mở khoá · nhịp:** luôn có ngoài bản đồ (trừ khi có khiên / ở vùng an toàn).
- **Cơ chế:** đội gặp nhau ở bất cứ đâu đều đánh được (đội đang đi, đang đóng, đang khai mỏ); trận kéo dài theo lượt 1 giây, quân phản đòn mọi kẻ tấn công trong cùng lượt → dồn đòn có lợi; khắc chế bộ > kỵ > cung > bộ [RB-COMBAT]; có thể rút lui giữa trận, nhiều đội đánh một đội.
- **Tương tác:** trung tâm của PvP RoK — nhiều người, nhiều đội cùng lao vào một điểm.
- **UI/UX:** chạm đội địch → Tấn công; trận diễn ra ngay trên bản đồ với số sát thương bay lên.
- **Vì sao giữ chân:** chiều sâu chiến thuật lớn nhất của RoK (chặn đội kết trận, "kéo" địch, bắt đội khai mỏ).
- **Tu tiên hoá:** *Chặn đường cướp đạo* / *đấu pháp giữa không trung*.
- **Game mình:** 🟡 đánh đội **đứng yên** ngoài bản đồ đã có: cướp khoáng (đội đang khai — `world/rob.ts`, D5), đánh trại (`hitCamp` ở `world/encamp.ts`), tranh điểm có quân đóng; cửa ải phe khác giữ chặn đường đi qua (`shutGates` ở `world/points.ts`). Chặn đội **đang đi** giữa đường vẫn **cố ý** không làm (PLAN mục 1; mục 4 ghi đường nâng cấp "tính giao điểm hai đường thẳng" nếu người chơi đòi).
- **Ưu tiên:** P2 · **Công sức:** L (chặn đội đang đi) / M (đánh đội đứng yên).

#### H6. March Queues & Capacity — số đội và sức chứa mỗi đội (tóm tắt)

- **Mở khoá · nhịp:** tăng theo Tòa thị chính.
- **Cơ chế:** bắt đầu 1 đội; Tòa thị chính 5 mở đội 2, 11 đội 3, 17 đội 4, 22 đội 5 (tối đa 5) [RKG-CAP][HG-CAP][GE-CAP]. Sức chứa mỗi đội từ 2.000 (TTC 1) tới 150.000 (TTC 25) + cấp tướng, thiên phú tướng chính, kỹ năng, VIP 14 +5 %, vật phẩm mở rộng quân +25/50 % trong 4 giờ [HG-CAP][GE-CAP]. Kết trận tối đa ~2,5 triệu quân với Castle tối đa + công nghệ; cả đoàn dùng công nghệ của người mở trận [RKG-ATK][FAQ-RALLYTECH].
- **UI/UX:** số ô đội trên hàng đội; chọn quân khi xuất quân bị chặn bởi sức chứa.
- **Vì sao giữ chân:** mỗi mốc TTC 5/11/17/22 là một bước nhảy sức mạnh rõ.
- **Tu tiên hoá:** số đội xuất sơn theo cảnh giới (đã có).
- **Game mình:** ✅ 1/2/3/4/5 đội theo cảnh giới (Luyện Khí → Hóa Thần, `MARCH_SLOTS`); trận dung mỗi đội ra bản đồ Giới 500 + 80 mỗi cấp chủ tướng trên 1 (+10 % mỗi sao, Khuếch Trận Kỳ +10 % — `capOf`), xuất chinh ở núi / độ kiếp không giới hạn; kết trận tối đa 8 đội, chờ 5/10/30 phút; mỗi điểm tối đa 6 đội đóng mỗi phe; viện binh tối đa 3 đội ở nhà đồng minh.
- **Ưu tiên:** P0 (đã có) · **Công sức:** —

## 3. Bảng tổng kết khoảng cách

| # | Tính năng RoK | Game mình | Ưu tiên | Công sức |
|---|---|---|---|---|
| A1 | Kingdom Map | ✅ Giới 150 × 150, sinh từ seed, reset theo mùa | P0 | — |
| A2 | Zones 1–2–3 | ✅ 16 vùng ngoài / 8 giữa / 1 tâm | P0 | — |
| A3 | Passes Lv.1–3 | ✅ 40 cổng trận nhãn mở theo pha; phe giữ chặn đường phe khác (trừ minh ước); chưa có NPC giữ | P1 | M |
| A4 | Alliance Territory (Fortress, Flags) | ✅ lãnh thổ + trận kỳ (phá / đóng giữ cờ) + Tổng đà | P1 (theo vùng) / P2 (cờ từng ô) | M / L |
| A5 | Holy Sites — luật chung (kỳ 3 ngày, giữ 4 giờ, không cộng dồn, NPC giữ) | 🟡 linh mạch nhiều loại tăng ích, quà chiếm lần đầu; luôn mở, cộng dồn tới 30 %, không NPC giữ | P1 | M |
| A6 | Sanctum (4 loại buff) | ✅ linh mạch cấp 1: sản lượng / xây / tuyển / chữa (25/09) | P1 | S |
| A7 | Altar (6 loại buff) | ✅ linh mạch cấp 2: công / thủ / sinh lực / hành quân (25/09) | P1 | S |
| A8 | Shrine (4 loại buff kép) | 🟡 chỉ linh mạch tâm có buff kép (sản lượng + công) | P1 | S–M |
| A9 | Lost Temple & King (tước hiệu, buff vương quốc) | ✅ Thiên Môn + Giới Chủ: sắc phong, ban phúc cả giới, Thiên Ân lễ (`world/lord.ts`) | P2 | M |
| A10 | Monument (dòng thời gian, mục tiêu chung, thưởng mốc) | ✅ Thiên Đạo Biên Niên: 13 chương mục tiêu chung + quà (`world/book.ts`), chương xong sớm mở pha sớm, bảng đóng góp + quà công đầu | P1 | M |
| A11 | Eve of the Crusade & Lost Kingdom | ❌ (cố ý: không liên server); phần PvE Eve: Khai Giới Trảm Tà (C6) | P2 | M |
| B1 | Fog of War | ✅ mê vụ riêng mỗi người | P2 | M |
| B2 | Scout Camp & scouts | ✅ linh điểu | P2 | M |
| B3 | Mysterious Caves | ✅ động phủ cổ tu | P2 | S |
| B4 | Tribal Villages | ✅ thôn trang | P2 | S |
| B5 | Scouting enemies (báo cáo trinh sát) | 🟡 Do thám tông môn (`world/spy.ts`: linh điểu, tốn linh thạch, báo cáo thư); chưa dò quân ở điểm | P1 | S |
| B6 | Anti-scouting & Watchtower / cảnh báo | 🟡 Tháp canh báo đội địch đang tới; chưa có vật phẩm chống dò thám | P1 / P2 | S |
| C1 | Action Points | ✅ hành lực săn yêu thú giới | P1 | S |
| C2 | Barbarians (man tộc trên bản đồ chung) | ✅ yêu thú giới (6 con mỗi vùng ngoài / giữa, cấp 1–15), tốn hành lực; chưa rơi vật phẩm | **P0** | M |
| C3 | Continuous attack / chain farming | ✅ săn liên hoàn yêu thú giới (25/09) | P2 | S / M |
| C4 | Barbarian Buster, Clarion Call | 🟡 nhiệm vụ "hạ yêu thú cấp n"; Săn Yêu Lệnh, Trảm Yêu Lệnh, Liên Trảm Bất Hồi, Tông Môn Tranh Bá; chưa xếp hạng săn yêu | P2 | S |
| C5 | Barbarian Forts (cấp 1–6, kết trận) | ✅ yêu trại / yêu vương 3 cấp (vòng ngoài 12.000 hồi 8 giờ · giữa · tâm), kết trận, chia thưởng theo sát thương; chưa có cấp 4–6 | P1 | S–M |
| C6 | Marauders & Encampments | ✅ Khai Giới Trảm Tà (`world/eve.ts`); chưa có trại lưu khấu | P2 | M |
| C7 | Barbarian Camps & Keeps (KvK) | ❌ (ngoài phạm vi) | P2 | M |
| C8 | Lohar's Trial (vật phẩm triệu hồi boss) | ✅ Yêu Vương Tuần Sơn (`world/lohar.ts`) | P1 | M |
| C9 | Ceroli Crisis / Assault / Realm of Mystique | 🟡 Man Hoang Cổ Tộc (`world/party.ts`): Crisis 4 người 3 vai 5 độ khó, giải tự động; thiếu Assault 12 người, Realm | P2 | L |
| C10 | Karuak Ceremony / Trial of Kau Karuak | ✅ Thí Luyện Yêu Hoàng (5 độ khó × 50 cửa); thiếu nhờ minh giúp | P2 | S–M |
| C11 | Shadow Legion (minh thủ sóng quái) | ✅ Ma Triều Công Sơn (`world/legion.ts`) | P1 | M |
| C12 | Holy-site Guardians & Runes | ✅ hộ trận linh thú + phù văn 12 giờ | P2 | M |
| C13 | Race Against Time, Protect the Supplies, Silk Road, Halloween… | ❌ | P2 | S–M |
| D1 | Resource Points | ✅ 144 mỏ, 2 cấp, hồi 2 giờ, linh triều +50 % | P0 | — |
| D2 | Gathering buffs & commanders | ✅ khoá `gather`: Khai Linh Phù, bị động khai mỏ của 2 trưởng lão (+ linh triều, lãnh thổ); chưa có công pháp / Hương Hỏa khai mỏ | P1 | S |
| D3 | Gem Deposits | ❌ | P2 | S |
| D4 | Alliance Resource Points / Centers | ✅ Minh khoáng + kho minh thu từ lãnh thổ | P2 | M |
| D5 | Attacked while gathering | ✅ Cướp khoáng (`world/rob.ts`) | P1 | M |
| E1 | Beginner's Teleport | ✅ dời núi tân thủ | **P1** | S |
| E2 | Random Teleport | ✅ Di Sơn Phù | P2 | S |
| E3 | Targeted Teleport | ✅ Càn Khôn Phù | P2 | S |
| E4 | Territorial Teleport | ✅ dời tông môn vào lãnh thổ | **P1** | S–M |
| E5 | Luật chung khi dịch chuyển | ✅ đội ở nhà, sát khí chặn dời, ô trống, dời lãnh thổ 24 giờ một lần | theo E1–E4 | — |
| E6 | Migration | ❌ (cố ý) | P2 | M |
| E7 | Beginner's protection & Peace Shield | ✅ khiên 72 / 8 giờ, Hộ Sơn Phù, Bế Quan Lệnh, linh hỏa thiêu sơn; khiên chưa chặn do thám | P1 | S |
| F1 | Expedition | 🟡 bí cảnh + Thông Thiên Tháp + rương ngày theo tầng tháp; thiếu sao, quân ảo | P2 | M / L |
| F2 | Expedition Store | ✅ Trấn Tháp Các (Tháp Lệnh) | P2 | S |
| F3 | Lyceum of Wisdom | ✅ Vấn Đạo Đài | P2 | M |
| F4 | Sunset Canyon | ✅ Luận Kiếm Đài (đệ tử ảo, không mất quân) | P2 | M |
| F5 | Arms Training, Golden Kingdom… (PvE sự kiện) | 🟡 Luận Võ Liên Hoàn (Arms Training); chưa có Golden Kingdom, Race Against Time… | P2 | S / M |
| G1 | Tactical / Strategic View | ✅ (có toàn giới + hiệu minh, bản đồ nhỏ; thiếu bản đồ nhiệt, danh sách trận) | P2 | S–M |
| G2 | Toạ độ, chia sẻ toạ độ vào chat | ✅ | P1 | S |
| G3 | Bookmarks | ✅ Ghi nhớ ★ (20 chỗ) | P2 | S |
| G4 | Alliance Markers | ✅ | P1 | S |
| G5 | Search (tìm theo cấp) | ✅ | P1 | S |
| G6 | Filters | ✅ lớp tình hình: yêu thú / mỏ / hành quân / lãnh thổ | P2 | S |
| G7 | March Lines | ✅ | P0 | — |
| G8 | Tap tile → action menu | ✅ (có chia sẻ, ghi nhớ, dấu minh; do thám qua bảng Tranh đoạt) | P0 | — |
| G9 | Troop Dispatch Queue | ✅ (thiếu hàng đội trên bản đồ giới – điện thoại) | P1 | S |
| G10 | Return to City | ✅ | P0 | — |
| G11 | Kingdom Overview (danh sách linh địa theo phe) | ✅ Sơn Hà Xã Tắc Đồ (`Holdings.svelte`) | P1 | S |
| H1 | March Speed | ✅ 12 giây/ô, công pháp Thần Hành, tốc theo hệ đệ tử | P0 | — |
| H2 | Redirect giữa đường | 🟡 quay đầu giữa đường, săn liên hoàn từ đường về; chưa đổi đích tuỳ ý | P2 | M |
| H3 | Recall | ✅ mọi đội đang đi (quay đầu giữa đường, hoàn hành lực) + đội đóng / khai / viện binh | P1 | S |
| H4 | Đóng quân ở ô trống | ✅ đóng trại ở ô trống đã khai (`world/encamp.ts`), phe khác đánh tan được | P2 | M |
| H5 | Open-field battle / chặn đường | ❌ (cố ý, PLAN "Không làm") | P2 | L / M |
| H6 | March queues & capacity | ✅ 1–5 đội theo cảnh giới, trận dung theo chủ tướng, kết trận 8 đội | P0 | — |

**Đếm:** 64 mục — ✅ 10 · 🟡 21 · ❌ 33 (trong đó A11, E6, H5 là cố ý theo PLAN "Không làm"; C7 ngoài phạm vi vì thuộc bản đồ KvK).

**Năm khoảng cách lớn nhất** (ảnh hưởng tới vòng chơi hằng ngày trên bản đồ giới):

1. **Yêu thú trên bản đồ giới + linh lực (C1, C2, G5):** RoK giữ chân mỗi ngày bằng "tìm – đánh – nhặt đồ" với AP; mình chưa có PvE lặp lại nào trên bản đồ chung.
2. **Giới Bia — mốc chung của giới (A10):** mục tiêu toàn giới / tiên minh có thưởng, mở nội dung theo tiến độ, thay cho pha mùa theo lịch cứng.
3. **Dời sơn môn + lãnh thổ theo vùng (E1, E4, A4):** tiên minh không gom quân về một chỗ được, nên kết trận, viện binh, hộ pháp đều chậm.
4. **Linh địa nhiều loại + luật tranh chấp + cổng chặn phe (A3, A5–A8):** linh mạch hiện chỉ buff sản lượng và luôn mở; thiếu nhịp "kỳ tranh 3 ngày, giữ 4 giờ", NPC giữ, và giá trị "khoá đường" của cổng.
5. **Trinh sát và cảnh báo (B5, B6), rồi khám phá (B1–B4):** không dò được quân ở linh mạch / trận nhãn, không biết đội địch đang tới; không có sương mù, hang, làng cho tuần đầu.

**Gợi ý thứ tự (rẻ trước, dùng lại mã sẵn có):** E1 + E4 (dời sơn môn, S) → G2 + G4 + H3 (toạ độ, dấu minh, gọi về giữa đường, S) → C1 + C2 + G5 (yêu thú giới, M) → C5 cấp thấp + D5 (S–M) → A5–A8 (linh địa nhiều loại, M) → A10 (Giới Bia, M) → phần P2.

## 4. Nguồn

Truy cập 24/09/2026. Mã trong ngoặc vuông ở trên trỏ tới đây.

**Nguồn đánh số**

- [1] https://www.ajackof.com/games/rise-of-kingdoms-lost-crusade/rok-monument-quest-and-rewards-in-rise-of-kingdoms/ — Monument: tên chương cũ, thời lượng, mục tiêu, mở khoá, thưởng
- [2] https://xtit3.github.io/Kingdom-Event-Tracker/ — tracker một vương quốc mở 08/2026; dữ liệu đọc từ https://raw.githubusercontent.com/xtit3/Kingdom-Event-Tracker/main/App.jsx
- [3] https://theriagames.com/guide/rise-of-kingdoms-monument-guide/
- [4] https://www.gamesguideinfo.com/rise-of-kingdoms/building/120000299-Monument — dữ liệu cũ
- [5] https://riseofkingdoms.fandom.com/wiki/Holy_Sites — chỉ đoạn trích máy tìm kiếm (trang trả 402)
- [6] https://riseofkingdomsguides.com/rise-of-kingdoms-map-guide/
- [7] https://riseofkingdomsguides.com/rise-of-kingdoms-zones-guide/
- [8] https://riseofkingdoms.fandom.com/wiki/Kingdom — và https://riseofkingdoms.fandom.com/wiki/Buildings/Monument — chỉ đoạn trích máy tìm kiếm
- [9] https://theriagames.com/guide/rise-of-kingdoms-holy-sites-guide/
- [10] https://theriagames.com/guide/rise-of-kingdoms-sanctums-guide/
- [11] https://theriagames.com/guide/rise-of-kingdoms-altar-guide/
- [12] https://theriagames.com/guide/rise-of-kingdoms-shrines-guide/
- [13] https://theriagames.com/guide/rise-of-kingdoms-shrine-of-radiance-guide/
- [14] https://www.bluestacks.com/blog/game-guides/rise-of-kingdoms/rok-ultimate-alliance-guide-en.html
- [15] https://heaven-guardian.com/rise-of-kingdoms-zones-guide/
- [16] https://heaven-guardian.com/rise-of-kingdoms-titles-guide-to-maximize-your-buffs/
- [17] https://heaven-guardian.com/rise-of-kingdoms-alliance-guide-territory-flags-forts/
- [18] https://heaven-guardian.com/rise-of-kingdoms-events-dominate-with-this-guide/ — lịch sự kiện 2026
- [19] https://riseofkingdomsguides.com/kvk-kingdom-vs-kingdom-guide-tips-for-all-seasons-in-rise-of-kingdoms/
- [20] https://onechilledgamer.com/rise-of-kingdoms-kvk-1-guide/ — và https://onechilledgamer.com/rise-of-kingdoms-kvk-2-guide/ (cùng tác giả)
- [21] https://riseofkingdoms.fandom.com/wiki/Lost_Kingdom/Eve_of_the_Crusade — chỉ đoạn trích máy tìm kiếm
- [22] https://riseofkingdoms.fandom.com/wiki/Barbarians — chỉ đoạn trích máy tìm kiếm
- [23] https://riseofkingdomsguides.com/rise-of-kingdoms-barbarians-and-barbarian-forts/
- [24] https://heaven-guardian.com/rise-of-kingdoms-dominate-barbarians-forts-guide/
- [25] https://heaven-guardian.com/rise-of-kingdoms-maximize-action-points-dominate/
- [26] https://rokdbot.com/en/blog/action-points-management-guide-rok-2026 — trang bán bot — tin thấp
- [27] https://riseofkingdomsguides.com/rise-of-kingdoms-action-points/
- [28] https://www.ajackof.com/games/rise-of-kingdoms-lost-crusade/rok-chain-farming-barbarians-guide-for-rise-of-kingdoms/
- [29] https://riseofkingdoms.fandom.com/wiki/Lost_Kingdom — chỉ đoạn trích máy tìm kiếm
- [30] https://heaven-guardian.com/rise-of-kingdoms-runes-find-use-magical-boosts/

**Ghi chú bản vá chính thức (bản chép trên riseofkingdomsguides.com)**

- [PN31] https://riseofkingdomsguides.com/rise-of-kingdoms-update-1-0-31-spring-has-sprung/ — 03/2020
- [PN32] https://riseofkingdomsguides.com/rise-of-kingdoms-update-1-0-32-ians-ballads/ — 04/2020
- [PN33] https://riseofkingdomsguides.com/rise-of-kingdoms-update-1-0-33-osiris-invitational/ — 04/2020
- [PN34] https://riseofkingdomsguides.com/rise-of-kingdoms-update-1-0-34-golden-kingdom/ — 06/2020
- [PN38] https://riseofkingdomsguides.com/update-1-0-38-anniversary-festival/ — 08/2020
- [PN60] https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-60-chorus-of-tides-update/ — 08/2022
- [PN71] https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-71ode-to-greece-update/ — 07/2023
- [PN74] https://riseofkingdomsguides.com/1-0-74-anniversary-festivities-update/ — 09/2023
- [PN76] https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-76-tides-of-war-update/ — 11/2023
- [PN77] https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-77-winters-tale-update/ — 12/2023
- [PN78] https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-78-live-loong-and-prosper-update/ — 01/2024
- [PN79] https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-79-surging-spring-update/ — 02/2024
- [PN81] https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-81-unearthing-history-update/ — 2024
- [PN82] https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-82-dragon-boat-bash-update/ — 05/2024
- [PN83] https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-83-eternal-city-update/ — 06/2024
- [PN84] https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-84-magpies-song-update/ — 07/2024
- [PN86] https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-86-anchors-aweigh-update/ — 09/2024
- [PN87] https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-87-rex-totius-britanniae-update/ — 10/2024
- [PN88] https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-88-giving-thanks-update/ — 11/2024
- [PN89] https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-89-sleigh-all-day-update/ — 12/2024
- [PN90] https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-90-return-of-the-king-update/ — 01/2025
- [PN91] https://riseofkingdomsguides.com/rise-of-kingdoms-1-0-91-moon-and-star-update/ — 02/2025
- [B-LD1112] https://www.ldshop.gg/blog/rise-of-kingdoms/halloween-guide.html — tóm tắt bản 1.1.12 (22/09/2026) — một nguồn
- [DEV20] https://riseofkingdomsguides.com/responses-from-rok-developers-01-09-2020/ — trả lời của nhà phát triển

**FAQ trong game (bản chép trên riseofkingdomsguides.com)**

- [B-FAQ-AP] https://riseofkingdomsguides.com/helpie_faq/after-participating-in-a-barbarian-rally-the-amount-of-action-points-refunded-to-me-was-not-equal-to-the-amount-expended-is-that-normal/
- [B-FAQ-NEUTRAL] https://riseofkingdomsguides.com/helpie_faq/what-does-a-neutral-unit-refer-to/
- [B-FAQ-BOC] https://riseofkingdomsguides.com/helpie_faq/how-do-i-get-books-of-covenant/
- [B-FAQ-TEMPLE] https://riseofkingdomsguides.com/helpie_faq/how-many-troops-are-there-in-the-temple/
- [B-FAQ-CAS] https://riseofkingdomsguides.com/helpie_faq/how-are-temple-battle-casualties-calculated/
- [B-FAQ-FIRST] https://riseofkingdomsguides.com/helpie_faq/how-do-i-earn-a-first-occupation-reward/
- [FAQ-EXP] https://riseofkingdomsguides.com/helpie_faq/how-are-expedition-mode-troops-calculated/
- [FAQ-SC] https://riseofkingdomsguides.com/helpie_faq/do-buffs-from-equipment-or-vip-levels-also-take-effect-in-sunset-canyon-and-lost-canyon/
- [FAQ-MULTI] https://riseofkingdomsguides.com/helpie_faq/can-i-command-multiple-troops-at-the-same-time/
- [FAQ-COORD] https://riseofkingdomsguides.com/helpie_faq/how-to-send-coordinates-in-rise-of-kingdoms/
- [FAQ-SPAWN] https://riseofkingdomsguides.com/helpie_faq/what-should-i-do-if-i-cant-find-high-level-barbarians-or-resource-points/
- [FAQ-RALLYTECH] https://riseofkingdomsguides.com/helpie_faq/can-you-benefit-from-other-governors-technologies-when-joining-a-rally/
- [C-RKG-FAQ] https://riseofkingdomsguides.com/faq/ — trang gom FAQ

**riseofkingdomsguides.com (hướng dẫn)**

- [RKG-BEG] https://riseofkingdomsguides.com/rise-of-kingdoms-beginners-guide/
- [RKG-EXP] https://riseofkingdomsguides.com/rise-of-kingdoms-expedition-guide/
- [RKG-SCULPT] https://riseofkingdomsguides.com/rise-of-kingdoms-sculptures-guide/
- [RKG-AETH] https://riseofkingdomsguides.com/talent-tree/aethelflaed/
- [RKG-CONST] https://riseofkingdomsguides.com/talent-tree/constance/
- [RKG-LYC] https://riseofkingdomsguides.com/lyceum-of-wisdom-rok-answers/
- [RKG-SC] https://riseofkingdomsguides.com/rise-of-kingdoms-sunset-canyon-guide/
- [RKG-AT] https://riseofkingdomsguides.com/rise-of-kingdoms-arms-training-event/
- [RKG-PTS] https://riseofkingdomsguides.com/protect-the-supplies-event-guide-rok/
- [RKG-RAT] https://riseofkingdomsguides.com/rise-of-kingdoms-race-against-time-event/
- [RKG-KAU] https://riseofkingdomsguides.com/the-trial-of-kau-karuak-event-guide/
- [RKG-LOH] https://riseofkingdomsguides.com/lohars-trial-event/
- [RKG-GK] https://riseofkingdomsguides.com/golden-kingdom-event-guide-rok/
- [RKG-HAL] https://riseofkingdomsguides.com/halloween-event-guide/
- [RKG-TP] https://riseofkingdomsguides.com/how-to-teleport-in-rise-of-kingdoms/
- [RKG-CAV] https://riseofkingdomsguides.com/fastest-cavalry-march-speed/
- [RKG-CAP] https://riseofkingdomsguides.com/rise-of-kingdoms-troop-capacity-and-march-queue-guide/
- [RKG-ATK] https://riseofkingdomsguides.com/rise-of-kingdoms-attacking-cities-and-flags-guide/
- [RKG-FARM] https://riseofkingdomsguides.com/farming-gathering-guide/
- [B-HA] https://riseofkingdomsguides.com/heroic-anthem-season-of-conquest-new-kvk-guide/
- [B-MGE] https://riseofkingdomsguides.com/the-mightiest-governor-event/ — và https://www.ajackof.com/games/rise-of-kingdoms-lost-crusade/the-mightiest-governor-event-mge-rise-of-kingdoms/
- [B-RKG-VIP] https://riseofkingdomsguides.com/how-do-you-get-vip-points-in-rise-of-kingdoms/
- [B-RKG-SPD] https://riseofkingdomsguides.com/how-to-get-speedups-in-rise-of-kingdoms/
- [B-RKG-EQ] https://riseofkingdomsguides.com/rise-of-kingdoms-equipment-guide/
- [B-RKG-CC] https://riseofkingdomsguides.com/clarion-call-event/ — chỉ đoạn trích máy tìm kiếm
- [B-RKG-LVL] https://riseofkingdomsguides.com/rise-of-kingdoms-commander-leveling-guide/
- [B-RKG-PIONEER] https://riseofkingdomsguides.com/the-pioneer-road-to-revival-event-guide/
- [B-RKG-CER] https://riseofkingdomsguides.com/rise-of-kingdoms-ceroli-crisis-guide/
- [B-RKG-CA] https://riseofkingdomsguides.com/rise-of-kingdoms-ceroli-assault-event/
- [B-RKG-SL] https://riseofkingdomsguides.com/shadow-legion-and-dark-fortress-guide/
- [B-RKG-RUNES] https://riseofkingdomsguides.com/rise-of-kingdoms-runes/
- [C-SC] https://riseofkingdomsguides.com/scout-camp/
- [C-RKG-VC] https://riseofkingdomsguides.com/scouting-tribal-village-and-mysterious-cave-guide/
- [C-RKG-WT] https://riseofkingdomsguides.com/watchtower/
- [C-RKG-AT] https://riseofkingdomsguides.com/rise-of-kingdoms-alliance-territory-guide/
- [C-RKG-HACKS] https://riseofkingdomsguides.com/rise-of-kingdoms-life-hacks-tips-and-tricks/
- [C-RKG-TITLES] https://riseofkingdomsguides.com/how-to-use-title-buffs-guide/
- [C-RKG-GEM] https://riseofkingdomsguides.com/how-to-gather-a-lot-of-gems-in-rise-of-kingdoms/
- [C-RKG-MIG] https://riseofkingdomsguides.com/rise-of-kingdoms-migration-and-passport-page-requirements/
- [C-RKG-WALL] https://riseofkingdomsguides.com/wall/

**heaven-guardian.com (bài 2025–2026, viết kiểu tổng hợp)**

- [HG-EXP] https://heaven-guardian.com/rise-of-kingdoms-expedition-guide-tips-rewards/
- [HG-AETH] https://heaven-guardian.com/aethelflaed-rise-of-kingdoms-guide-talents-pairings/
- [HG-LYC] https://heaven-guardian.com/rise-of-kingdoms-peerless-scholar-answers/
- [HG-CER] https://heaven-guardian.com/rise-of-kingdoms-ceroli-crisis-guide-boss-tips/
- [HG-SCOUT] https://heaven-guardian.com/rise-of-kingdoms-scout-camp-guide/
- [HG-CAP] https://heaven-guardian.com/rise-of-kingdoms-troop-capacity-march-queue-guide/
- [HG-SPD] https://heaven-guardian.com/rise-of-kingdoms-speedups-the-ultimate-guide-to-domination/
- [B-VIPSHOP] https://heaven-guardian.com/rise-of-kingdoms-vip-shop-guide-dominate-maximize-benefits/
- [B-HG-LOH] https://heaven-guardian.com/lohar-rise-of-kingdoms-barbarian-hunter-guide-build/
- [C-HG-SCOUT2] https://heaven-guardian.com/rise-of-kingdoms-scout-camp-guide-for-map-control/
- [C-HG-VC] https://heaven-guardian.com/rise-of-kingdoms-scout-villages-caves-for-fast-growth/
- [C-HG-JUMP] https://heaven-guardian.com/rise-of-kingdoms-jumper-account-guide-dominate-early-game/
- [C-HG-CONQ] https://heaven-guardian.com/rok-conquer-cities-flags-attack-guide-tips/
- [C-HG-CLEO] https://heaven-guardian.com/cleopatra-vii-best-gathering-build-guide-rise-of-kingdoms/
- [C-HG-VIP] https://heaven-guardian.com/rise-of-kingdoms-vip-guide-level-up-fast-get-rewards/
- [C-HG-GATHER] https://heaven-guardian.com/rise-of-kingdoms-gathering-guide/ — ngày 12/08/2026
- [C-HG-CMD] https://heaven-guardian.com/rise-of-kingdoms-seondeok-gathering-build/ — cùng các trang tướng khai mỏ: /rise-of-kingdoms-sarka-guide/, /constance-talent-tree-rise-of-kingdoms-gathering-guide/, /joan-of-arc-talent-guide-rise-of-kingdoms-2026-domination/, /rise-of-kingdoms-matilda-of-flanders-guide/, /rise-of-kingdoms-gaius-marius-guide/, /rise-of-kingdoms-ishida-mitsunari-gathering-guide/, /centurion-rise-of-kingdoms-gathering-guide-talents/
- [C-HG-GEM] https://heaven-guardian.com/rise-of-kingdoms-gem-farming-guide-best-commanders-tips/
- [C-HG-TP] https://heaven-guardian.com/rise-of-kingdoms-teleport-guide/
- [C-HG-MIG] https://heaven-guardian.com/rok-migration-guide-2026/
- [C-HG-BLD] https://heaven-guardian.com/rise-of-kingdoms-buildings-guide-city-development/

**theriagames.com (không ghi ngày, viết kiểu tổng hợp)**

- [TG-LYC] https://theriagames.com/guide/rise-of-kingdoms-lyceum-of-wisdom-guide/
- [B-TG-CER] https://theriagames.com/guide/rise-of-kingdoms-ceroli-crisis-guide/
- [B-TG-SL] https://theriagames.com/guide/rise-of-kingdoms-shadow-legion-invasion/
- [B-TG-HKT] https://theriagames.com/guide/rise-of-kingdoms-holy-knights-treasure-guide/
- [C-TG-SC] https://theriagames.com/guide/rise-of-kingdoms-scout-camp-guide/
- [C-TG-CH] https://theriagames.com/guide/rise-of-kingdoms-city-hall-guide/
- [C-TG-MIL] https://theriagames.com/guide/rise-of-kingdoms-military-technology-guide/
- [C-TG-ECO] https://theriagames.com/guide/rise-of-kingdoms-economic-technology-guide/
- [C-TG-SHOP] https://theriagames.com/guide/rise-of-kingdoms-shop-guide/
- [C-TG-WT] https://theriagames.com/guide/rise-of-kingdoms-watchtower-guide/
- [C-TG-WALL] https://theriagames.com/guide/rise-of-kingdoms-wall-guide/

**gamesguideinfo.com (dữ liệu game ~2018–2019)**

- [GGI-MS] https://www.gamesguideinfo.com/rise-of-kingdoms/boost-type/160001697-March-Speed
- [GGI-MIL] https://www.gamesguideinfo.com/rise-of-kingdoms/research-category/130000105-Military
- [GGI-RALLY] https://www.gamesguideinfo.com/rise-of-kingdoms/boost-type/160001832-Rallied-Army-March-Speed-Increase
- [GGI-SCOUT] https://www.gamesguideinfo.com/rise-of-kingdoms/boost-type/160001698-Scout-March-Speed
- [GGI-TROOPS] https://www.gamesguideinfo.com/rise-of-kingdoms/overview/troops
- [B-GGI-PK] https://www.gamesguideinfo.com/rise-of-kingdoms/commander-talent-tree/830000032-Peacekeeping
- [B-GGI-VIP] https://www.gamesguideinfo.com/rise-of-kingdoms/overview/vip-levels
- [C-GGI-SC] https://www.gamesguideinfo.com/rise-of-kingdoms/building/120000305-Scout-Camp
- [C-GGI-WT] https://www.gamesguideinfo.com/rise-of-kingdoms/building/120000308-Watchtower
- [C-GGI-TRACK] https://www.gamesguideinfo.com/rise-of-kingdoms/research-project/140002572-Tracking
- [C-GGI-CAMO] https://www.gamesguideinfo.com/rise-of-kingdoms/research-project/140002581-Camouflage
- [C-GGI-GATHER] https://www.gamesguideinfo.com/rise-of-kingdoms/boost-type/ — các trang tốc khai thác / sức mang, mã 160001675–160001680 và 160001727
- [C-GGI-GEM] https://www.gamesguideinfo.com/rise-of-kingdoms/boost-type/160001679-Gem-Gathering-Speed
- [C-GGI-BEG] https://www.gamesguideinfo.com/rise-of-kingdoms/guide/beginners

**ajackof.com**

- [AJ-BEG] https://www.ajackof.com/games/rise-of-kingdoms-lost-crusade/rok-beginners-guide-rise-of-kingdoms/
- [AJ-CAVE] https://www.ajackof.com/games/rise-of-kingdoms-lost-crusade/rok-cave-coordinate-in-rise-of-kingdoms/
- [B-AJ-EVT] https://www.ajackof.com/games/rise-of-kingdoms-lost-crusade/rise-of-kingdoms-events/
- [C-AJ-FOG] https://www.ajackof.com/games/rise-of-kingdoms-lost-crusade/rok-fog-clearing-guide/
- [C-AJ-TIPS] https://www.ajackof.com/games/rise-of-kingdoms-lost-crusade/rok-tips-and-tricks-in-rise-of-kingdoms/
- [C-AJ-MIG] https://www.ajackof.com/games/rise-of-kingdoms-lost-crusade/rok-immigration-guide-in-rise-of-kingdoms/
- [C-AJ-EARLY] https://www.ajackof.com/games/rise-of-kingdoms-lost-crusade/rok-early-mistakes-in-rise-of-kingdoms-5012/

**Nguồn khác**

- [BS-EXP] https://www.bluestacks.com/blog/game-guides/rise-of-kingdoms/guide-expeditions-en.html
- [C-BS-F2P] https://www.bluestacks.com/blog/game-guides/rise-of-kingdoms/rok-free-to-play-guide-en.html
- [GE-LYC] https://gamerempire.net/rise-of-kingdoms-all-peerless-scholar-questions-answers/
- [GE-CH] https://gamerempire.net/rise-of-kingdoms-city-hall-guide-upgrade-requirements-rewards/
- [GE-CAP] https://gamerempire.net/rise-of-kingdoms-how-to-increase-march-queue-slots-troop-capacity/
- [C-GE-ALLY] https://gamerempire.net/rise-of-kingdoms-alliance-guide/
- [C-GE-GEM] https://gamerempire.net/rise-of-kingdoms-how-to-get-gems/
- [C-GE-TP] https://gamerempire.net/rise-of-kingdoms-teleport-guide-how-to-teleport-get-teleport/
- [QN-LYC] https://qnnit.com/peerless-scholar-answers/ — 2022
- [AC-SC] https://www.allclash.com/sunset-canyon-guide-for-rise-of-kingdoms-tactics-commanders-to-use/
- [OMD] https://oldmanduck.wordpress.com/school-of-rok/troops-and-marches/
- [OCG] https://onechilledgamer.com/rise-of-kingdoms-troops-guide/
- [C-OCG-FARM] https://onechilledgamer.com/rise-of-kingdoms-farm-account-guide/
- [C-OCG-TP] https://onechilledgamer.com/rise-of-kingdoms-teleport-guide/
- [C-ALPHR] https://www.alphr.com/rise-of-kingdoms-get-teleports/
- [C-MF] https://medievalfun.com/rise-of-kingdoms-how-to-defend-city-and-troops/
- [RB-LYC] https://rokdbot.com/en/blog/lyceum-of-wisdom-peerless-scholar-strategy-rok-2026 — trang bán bot — tin thấp
- [RB-MARCH] https://rokdbot.com/en/blog/march-speed-mechanics-rally-reinforce-rok-2026 — trang bán bot — tin thấp
- [RB-COMBAT] https://rokdbot.com/en/blog/troop-counter-system-combat-mechanics-rok-2026 — trang bán bot — tin thấp

**Chỉ đoạn trích máy tìm kiếm (trang không đọc được)**

- [SNIP] đoạn trích máy tìm kiếm từ các trang Expedition của riseofkingdoms.fandom.com / appgamer.com (không mở được trang, không có URL chính xác)
- [SNIP-SC] đoạn trích máy tìm kiếm từ các trang Sunset Canyon của rok.guide / appgamer.com (không mở được trang, không có URL chính xác)
- [B-FANDOM-BB] https://riseofkingdoms.fandom.com/wiki/Quests/Barbarian_Buster
- [B-FANDOM-FORT] https://riseofkingdoms.fandom.com/wiki/Fort
- [C-FANDOM-SCOUT] https://riseofkingdoms.fandom.com/wiki/Scouting
- [C-FANDOM-TERR] https://riseofkingdoms.fandom.com/wiki/Territory
