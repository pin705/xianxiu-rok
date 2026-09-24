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
| Items (túi đồ): speedups, resource packs, boosts, peace shield, tomes | Túi đồ: Thời Quang / Lỗ Ban / Luyện Binh / Ngộ Đạo / Diệu Thủ Phù (5p–24g), Linh Thạch/Thảo/Khoáng Nang (1K–100K), Tụ Linh / Thần Hành / Chiến Ý / Kim Cương / Hộ Thể Phù, Hộ Sơn Phù (8–72g), Tâm Đắc Kinh Thư | ✅ luật + giao diện (Bảo khố › Túi đồ, nút Tăng tốc ở mọi việc đang chờ) · ⬜ nguồn rơi đồ (chờ sự kiện/VIP/rương) |

## Lộ trình

Điền sau khi đủ 8 file nghiên cứu.
