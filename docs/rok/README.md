# Rise of Kingdoms → Sơn Hà Tiên Tông

> Mục tiêu (24/09/2026): game như Rise of Kingdoms nhưng bối cảnh tu tiên — đủ hoạt động, sự kiện, tương tác giữa người chơi,
> gameplay, và UI/UX rõ ràng, chất lượng như RoK. Thư mục này là bộ nghiên cứu bản gốc + đối chiếu với game mình + lộ trình làm.

## Bộ nghiên cứu (mỗi mảng một file)

| File | Mảng |
|---|---|
| [1-thanh-kinh-te.md](1-thanh-kinh-te.md) | Thành phố, công trình, tài nguyên, VIP, túi đồ, cửa hàng |
| [2-tuong-quan-chien-dau.md](2-tuong-quan-chien-dau.md) | Tướng (commander), quân, chiến đấu, nghiên cứu quân sự, trang bị |
| [3-ban-do-pve.md](3-ban-do-pve.md) | Bản đồ vương quốc, khám phá, man tộc, khai thác, PvE, Monument |
| [4-lien-minh-xa-hoi.md](4-lien-minh-xa-hoi.md) | Liên minh, chat, thư, tương tác giữa người chơi, PvP |
| [5-su-kien.md](5-su-kien.md) | Sự kiện thường kỳ, trung tâm sự kiện, lịch sự kiện |
| [6-mua-giai-pvp.md](6-mua-giai-pvp.md) | KvK, Lost Kingdom, Ark of Osiris, Olympia, Sunset Canyon |
| [7-tien-trinh-giu-chan.md](7-tien-trinh-giu-chan.md) | Hướng dẫn tân thủ, nhiệm vụ, giữ chân, nhịp tiến trình, kiếm tiền |
| [8-ui-ux.md](8-ui-ux.md) | HUD, luồng thao tác, phản hồi, thông báo, tiện lợi |

Mỗi mục trong các file có: cơ chế gốc · tu tiên hoá · **Game mình** (✅ có / 🟡 một phần / ❌ chưa) · ưu tiên P0–P2 · công sức S/M/L.

## Nguyên tắc chuyển thể

- **Luật thuần, tất định** như mọi hệ thống hiện có (`packages/rules`): server trọng tài chạy chính luật đó, client đoán trước.
- **Không P2W** (PLAN mục 7): cái gì RoK bán bằng gems thì mình cho kiếm bằng chơi (nhiệm vụ, sự kiện, rương theo giờ), có trần.
- **Nhịp theo mùa 49 ngày** (PLAN mục 2): phần thưởng mới (phù tăng tốc, nang tài nguyên…) phải qua `npm run sim` — không để
  người giỏi hết nội dung quá sớm, không để người thường tụt lại.
- **Trận tự động giải ngay khi tới** (PLAN mục 1 "Không làm"): chế độ RoK cần thời gian thực thì làm bản bất đồng bộ tương đương.

## Đã làm

| Hệ thống RoK | Bản tu tiên | Trạng thái |
|---|---|---|
| Items (túi đồ): speedups, resource packs, boosts, peace shield, tomes | Túi đồ: Thời Quang / Lỗ Ban / Luyện Binh / Ngộ Đạo / Diệu Thủ Phù (5p–24g), Linh Thạch/Thảo/Khoáng Nang (1K–100K), Tụ Linh / Thần Hành / Chiến Ý / Kim Cương / Hộ Thể Phù, Hộ Sơn Phù (8–72g), Tâm Đắc Kinh Thư | ✅ `sect/bag.ts`, Bảo khố › Túi đồ, bảng Tăng tốc ở mọi việc đang chờ |
| Event Center + các sự kiện | Trung tâm sự kiện (`core/fest.ts`): khung tân thủ / tuần / chu kỳ; kiểu đăng nhập / mục tiêu / tích điểm nhiều giai đoạn. Thất Nhật Lễ (7 ngày đăng nhập), Tân Thủ Chi Lộ (11 mục tiêu 7 ngày đầu), Tông Môn Tranh Bá (như Mightiest Governor, 6 giai đoạn thứ Hai–thứ Bảy), Săn Yêu Lệnh (Chủ nhật) | ✅ nút Sự kiện + chấm đỏ trên HUD |
| VIP (điểm danh chuỗi, cấp, rương ngày, free speedup) | Hương Hỏa: 40→200 điểm/ngày theo chuỗi, 12 cấp tăng ích nhỏ, lễ vật mỗi ngày, xong miễn phí việc còn ≤ 1–8 phút — không bán | ✅ `core/vip.ts`, huy hiệu dưới tên tông môn |
| Idle building hints, activity list | Dải "Đang diễn ra" trên điện thoại (chip biểu tượng + đồng hồ), chip "Rảnh" son cho Diễn võ trường / Tàng Kinh Các / Đan phòng | ✅ HUD |
| Chạm tài nguyên → nguồn thu | Bảng tài nguyên: sản lượng/giờ, bao lâu đầy, công trình, kho bảo hộ, mở nang, đi Thương hội | ✅ `ResSheet.svelte` |
| Use resource items / Quick Replenish | Bù tài nguyên thiếu một chạm: mở nang vừa đủ, đổi ở Thương hội, "đợi ~T" | ✅ `Refill.svelte` trong bảng công trình |
| Duplicate commander → sculptures | Trưởng lão trùng → 5.000 kinh nghiệm cho người đó | ✅ `grant()` |
| Readability | Chữ nhỏ nhất 12px trên điện thoại | ✅ `theme.css` |
| Tavern (Silver/Gold chest, sculptures, star) | Chiêu Hiền Đài: thiếp bạc miễn phí mỗi 6 giờ, thiếp vàng mỗi 24 giờ, bảo hiểm thiếp vàng; trưởng lão trùng → tín vật → sao 1–6 (mỗi sao tăng chỉ số khi dẫn đội). Mầm rút giấu ở server | ✅ `sect/tavern.ts`, trong Môn hạ |
| Daily Objectives (activity points, 5 chests) | Nhật Khóa: mỗi việc hằng ngày cộng điểm hoạt lực, 5 rương mốc, rương mốc 3 tính một "ngày" cho nhiệm vụ tuần — thay nhiệm vụ ngày cũ | ✅ `core/fest.ts` (kiểu `activity`), đầu bảng Nhật khoá |
| Achievements | Thành tựu: 12 chuỗi nhiều bậc (xây, đánh, săn, cướp, khai mỏ, tăng tốc, chiêu hiền…) có thưởng | ✅ `sect/ach.ts`, Bảo khố › Thành tựu |
| Event calendar + nhiều sự kiện xoay vòng | Thêm 7 sự kiện chu kỳ: Thổ Mộc Hưng Công, Luyện Binh Trảm Yêu, Tụ Khí Tranh Thời, Thu Linh Nhật Khóa, Tàng Kinh Ngộ Đạo, Trảm Yêu Lệnh, Liên Trảm Bất Hồi; lịch 7 ngày tới trong Trung tâm sự kiện | ✅ `FESTS`, `festCalendar` |
| Watchtower + War Frenzy | Tháp canh: đội địch vừa xuất quân là bên bị cướp thấy thẻ son ở mọi tab (tên, giờ tới) + nút "Bật khiên"; offline thì Web Push. Sát khí: vừa đi cướp thì 30 phút không bật được Hộ Sơn Phù | ✅ `world/raid.ts`, `Hud.svelte`, `notify.ts` |

Nhịp sau các thay đổi (`npm run sim`, 24/09): bot giỏi Chủ điện 15 ngày 9,3 (trước đợt này 11,3), tầng 20 ngày 17,9, tầng 25
ngày 30,5 (trước 34,5); người chơi thường (`45 3 --casual`) tầng 15 ngày 14,3 (trước 17,5), tầng 20 ngày 26,5, tầng 25 ngày
40,8 — vẫn trong mùa 49 ngày. Quà tân thủ, Nhật Khóa và sự kiện giúp người chơi thường nhiều hơn bot giỏi.

## Lộ trình (theo 8 file nghiên cứu, P0 trước, rẻ trước)

**Đợt B — giữ chân & kinh tế** (đã xong: Chiêu Hiền Đài, Nhật Khóa, Thành tựu, Tháp canh + sát khí)
1. Nhiệm vụ phụ (nhắc công pháp, công trình tài nguyên).
2. Tiền tệ tích luỹ + cửa hàng: Thương nhân vân du, cửa hàng Hương Hỏa, cửa hàng tháp/bí cảnh.
3. Kho bảo hộ theo tầng.
4. Tạp dịch thứ 2 (mở bằng Hương Hỏa hoặc thuê có hạn) — có trần, qua sim (bộ nhớ: bot 11→9 ngày, thường 19→14).

**Đợt C — tương tác người chơi**
1. Đánh dấu bản đồ cho minh; chia sẻ toạ độ / chiến báo vào chat; truyền âm 1-1.
2. Minh lễ (quà minh khi hạ yêu vương/yêu trại), yêu trại hằng ngày để kết trận.
3. Minh vụ đường (Alliance Mobilization), thưởng người giúp đỡ.
4. Hộ minh đại trận (công nghệ minh + quyên góp) + điểm cống hiến + Cống Hiến Các (cửa hàng minh).
5. Hồ sơ người chơi khác, Giới Chủ + sắc phong buff/debuff, minh ước (NAP).

**Đợt D — chiến đấu & trưởng lão**
1. Trưởng lão phó (cặp chính/phó) và công pháp theo nộ; trần quân mỗi đội; điểm tiêu diệt + bảng chiến công; chiến báo tách nguồn sát thương.
2. Phẩm cấp, sao, hồn ấn nâng công pháp; thiên phú sâu hơn; pháp bảo theo bộ.
3. Nâng bậc đệ tử; tốc độ và sức mang theo hệ.

**Đợt E — bản đồ & PvE, Đợt F — mùa giải & đấu trường** (chờ file 3, 5, 6)
- Điểm hành động + săn yêu thú, sương mù + thám tử + hang động, sự kiện yêu vương theo đợt (Lohar), tổ đội PvE (Ceroli),
  Luận Kiếm Đài (Sunset Canyon bất đồng bộ), chiến trường minh bất đồng bộ (Ark of Osiris), biên niên giới kiểu Monument.

**Đợt G — UI/UX** (file 8)
- Hồ sơ chưởng môn, "Nhận tất cả", lịch sự kiện 7 ngày, dải chat mọi tab, đĩa Tương trợ, trận đồ (preset), tìm mục tiêu +
  bản đồ nhỏ + ghi nhớ vị trí trên bản đồ Giới, trưởng lão dẫn đường nói chuyện ở các mốc đầu.
