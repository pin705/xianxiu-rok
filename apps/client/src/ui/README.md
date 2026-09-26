# Bộ giao diện (ui/)

**Luật: màn không có một dòng CSS riêng.** Mọi giao diện là component, lớp hoặc biến trong thư mục này; màn
(`apps/client/src/*.svelte`, `world/*.svelte`) chỉ ghép chúng lại. `architecture.test.ts` chặn khối `<style>`, `style:` tự
đặt kiểu (trừ biến tham số `style:--gap` / `--cols` / `--min` / `--lines` và vị trí tính từ dữ liệu `left/top/width/
height/translate/rotate`) và chuỗi `style="…"` cố định trong màn. Danh sách `PENDING` trong test là các màn cũ đang chờ
chuyển — chỉ được bớt, không được thêm.

Cần một kiểu chưa có → thêm component/lớp/biến vào đây (có tham số cho biến thể), rồi dùng ở màn. Không chép đồ vật từ màn
này sang màn khác, không viết mã màu trong màn.

Hướng hình: "đồ vật vẽ tay trên nền sương" — giấy trắng sương, mực, son, lục; khung viền đôi mảnh; mỗi màn một đồ vật làm
tâm điểm, chữ ngắn, hình + số. Tranh đồ vật: `artOf('ui:<tên>')` (danh sách ở `apps/client/public/art/ui/`), luôn lùi về
`Icon` khi tắt art (`?art=0`).

## Biến (theme.css, theme.ts)
- Màu vai trò: `--text --text-soft --text-faint --text-inv --good --bad`, khoáng `--paper --paper2 --paper3 --cinnabar
  --malachite --azurite --gold --rim`.
- Đồ vật: `--wood --wood-l --wood-d` (gỗ), `--talisman --talisman-edge` (giấy bùa), `--pin` (đinh son), `--pill --pill-fg`
  (viên mực; `--pill-hot`: số đầy trên viên mực), `--altar-top --gilt` (mặt án son, chỉ vàng; `--lacquer`: sơn mài tối), `--rar2 --rar3 --rar4` (phẩm lam · tím · vàng),
  `--mist` (sương trắng, kênh rgb: nền HUD mờ dần), `--jade` (ngọc lam lục: dải yên — bế quan).
- Da vẽ tay: `--sk-card` (khung đôi), `--sk-card-glow`, `--sk-card-silk`, `--img-mountains`, `--ui-seal-img`,
  `--ui-ribbon-img`, `--stroke-red`, `--stroke-ink`, `--paper-tex`.
- Khoảng cách `--sp-1…5`, chữ `--fs-1…7`, chuyển động `--dur-1…3 --ease --spring`.

## Lớp (theme.css)
- Bố cục: `.stack` (dọc) `.row` (ngang) `.wrap` `.between` `.center` `.grow` `.grid` (cột đều, `--cols`) `.fill` (tự xếp,
  ô tối thiểu `--min`) `.split` (cột co + cột giãn; `.end-side`: đảo) `.scroller` (hàng cuộn ngang) `.plain` (bỏ chấm danh
  sách) `.items-start/.items-end` `.justify-center/.justify-end` `.self-start/.self-center/.self-end` `.span-all` `.w-full`
  `.rel` `.sticky-top` `.mt-1…5` `.hidden-narrow` `.only-narrow` `.sr-narrow` (máy hẹp: chỉ còn cho trình đọc màn hình). Khoảng cách qua `--gap`.
- Chữ: `.t-title .t-head .t-strong .t-small .t-tiny .t-lore .t-soft .t-faint .t-good .t-bad .t-gold .t-num .t-ellipsis
  .t-center .t-right .t-left .t-italic .pre-line .nowrap .clamp` (`--lines`) `.t-code` (mã để chép) `.dim` `.on-dark` `.sr` `.t-link` (nút chữ phụ gạch chấm: Để sau, bỏ qua).
- Đồ vật nhỏ: `.stamp` (dấu son "Đã nhận"), `.path` + `li.hit` (đường mốc thưởng; `.slim`: mốc là dòng thấp), `.rank-no.r1/r2/r3` (đồng tiền hạng; `.lg` cỡ lớn),
  `.ledger` + `li.on/.good` (sổ dòng kẻ đứt); `li > button` dòng bấm được, `.mile` dòng mốc trên `.path` (số mốc rộng `--at`), `.ledge` kệ một ván dưới hàng đồ vật (`--ledge`), `.spot` sân khấu nhỏ giữa bảng cắt tràn (`--h`), `.trio` ba cột hai bên co giữa giãn (cán cân Ta — Địch), `.field` (ô nhập chữ: input, textarea), `.t-upper` (chữ in hoa), `.tray` (khay giấy một món trong quầy đổi),
  `.ruled` + `.on` (một dòng kẻ đứt đứng riêng), `.lamp` + `.on` (đèn trạng thái: đang chơi), `.ruled-top` (nét đứt phía trên nhóm nút), `.lamp.alert` (chấm son trong dòng: tin chưa đọc), `.quote` + `.on` (trích dẫn vạch trái / đang trả lời), `.scroll-box` (hộp cuộn dọc, `--max-h`), `.glyph-btn` (nút một ký tự: emoji, ×), `.vista` (thẻ khung đôi nền núi mờ: danh thiếp),
  `.t-action` (chữ bấm được có biểu tượng, vàng đậm), `.line-btn` (nút trần cả dòng canh trái: mở/thu chi tiết).

## Component
| Component | Dùng cho |
|---|---|
| `Sheet` / `Page` | bảng trượt / trang của tab (tiêu đề nét cọ son) |
| `Banner` | băng rôn đầu màn: tên, dải lụa, tranh nghiêng (`art` hoặc snippet `pic`), phần con bên dưới |
| `Band` | dải lụa ghi giờ/cấp/trạng thái (`tone` red · ink · jade) |
| `Pill` | viên mực ghi số/giá trên tranh, cảnh |
| `Seal` | ấn son tròn: nút lớn (có `onclick`) hoặc dấu số đè góc tranh; `big`: số to đóng xuống (tầng vừa mở) |
| `Altar` | án son bày lễ vật (chi phí, cung phụng) |
| `Note` | tờ giấy ghim son (bùa, cáo thị, thư); `tilt`, `ready`, `dim`, bấm được |
| `Board` | bảng gỗ ghim các `Note` |
| `Shelf` | tủ gỗ nhiều tầng kệ (túi đồ, tủ đan, kệ hàng, kệ bí kíp) |
| `Goods` | món đồ đứng trên `Shelf` để chọn: hình, mệnh giá góc trên (`tag`), số lượng (`n`); `look` cell (ô túi đồ) · jar (lọ đan), `faded`, `dot` |
| `Rays` | hào quang tia sáng xoay chậm sau đồ vật (ấn mở khoá, tranh thu nhận): `size`, `y`, `reach`, `alpha`, `tone` |
| `Trophy` | đồ vật vừa mở/nhận trên đĩa sáng: tranh (con), tên gạch son, dòng son nhỏ; bấm được, hiện lần lượt theo `i` |
| `Book` | cuốn bí kíp giấy gáy chỉ son (tên + lời ngắn), bấm để chọn — lựa chọn 1/3 xếp bằng `.fill` |
| `Chip` | thẻ tre nhỏ chọn một ô (trận đồ 1·2·3); bấm lại ô đang chọn vẫn gọi `onclick` |
| `Cameo` | chân dung trong vòng giấy để chọn người (chủ tướng, phó): tên, dòng phụ (`bad` tô son), `empty` vòng nét đứt; hàng `.scroller` |
| `Figure` | hình người vẽ tay đứng trên vệt đất (lính theo hệ + bậc); `faded` xám mờ |
| `Scroll` | cuộn tranh treo trục gỗ (trưởng lão, thẻ nhân vật) |
| `Plaque` | biển số liệu nhỏ (nhãn · số · dòng phụ; `pic` tranh bên trái; `on` viền son — của mình) |
| `Face` | chân dung trong vòng ngọc (`ring`: vòng khác — khung hồ sơ đặc biệt) |
| `Speech` | bong bóng lời nói (chat, cố vấn); `fit` rộng theo chữ, `onclick` bấm được |
| `InkArrow` | mũi tên nét mực "trước → sau" |
| `Tile` | lối vào bằng tranh đồ vật + nhãn (`look` paper · ink, `selected`, `dim`: ngăn chưa mở) |
| `Cell` | ô trò chơi trên lưới `.grid` (lật bài, mê cung, khảo cổ): `back` card · fog · stone, `up`, `done`, `busy`, `ring`, `ratio` |
| `Lattice` + `RingNode` | trận đồ lưới 3 cột nối nét mực đứt; trận nhãn đĩa tròn có vòng tiến độ, ấn son tầng, sao (đại trận minh) |
| `NodeMap` | sơ đồ chiến trường: ô tròn theo phe nối đường đứt, số trong ô, chạm chọn ô (Tranh Đoạt Linh Châu) |
| `Pennant` | cờ minh treo đung đưa, hiệu minh trong đĩa trắng (`mini`: cờ nhỏ đầu dòng) |
| `Expander` | nút mũi tên thu/mở thẻ gập (xoay khi mở) |
| `Rail` | cột thẻ tranh dọc bên trái (nhiều mục) |
| `Tabs` | thẻ kẹp sách (mặc định) · `switch` công tắc viên mực · `chips` thẻ tre có tranh |
| `HelpMark` | nút "?" tròn viền son cạnh tiêu đề mục (mở Cẩm nang tại chỗ) |
| `Veil` | màn che toàn màn hình, một thẻ giữa (`tone` ink · lacquer): mất mạng, lỗi vỡ màn |
| `Notice` | viên báo nhỏ giữa mép trên màn hình (đang nối lại…) |
| **HUD** (`ui/hud/`) | các đồ vật của HUD màn chính — `Hud.svelte` chỉ ghép; mọi cái nhận `ink` (có tranh `ui:nav-*`) · tắt art |
| `HudFrame` | khung HUD cố định trên cảnh (chạm xuyên chỗ trống); `ink` đẩy thanh chat lên trên dải menu |
| `TopBar` | thanh trên: snippet `avatar name power tools boosts res` + thẻ báo động (children); điện thoại hai tầng, desktop một hàng |
| `Avatar` | chân dung chưởng môn trong khung, vòng khiên khi được bảo hộ |
| `NamePlate` | biển tên: tên, cảnh giới (ink: dải lụa son), nhãn Hương Hỏa |
| `PowerPill` | thẻ thế lực + "+N" bay lên |
| `ResPill` | viên tài nguyên (`<li>`): vật chứa vẽ tay, số, vạch sức chứa, nhãn "Đầy", "+N" bay |
| `Alarm` | thẻ báo động dưới thanh trên (`tone` foe · calm · legion), nút hành động nhỏ |
| `HudSide` | cột nhiệm vụ: snippet `note events jobs`; desktop nằm trong cột trái |
| `QuestNote` | tờ nhiệm vụ (ink: cáo thị ghim son, ấn son nhận thưởng; `state` todo · done · held) |
| `EventTile` | lối vào sự kiện: ô tranh + nhãn mực (ink) hoặc đĩa lụa; `tag` dải lụa cuối tuần |
| `RunList` | việc đang chạy / nhà rảnh: sổ dọc (desktop), chip (điện thoại) |
| `Worker` / `WorkerSlot` | nút tạp dịch (chú thợ / đĩa có vòng tiến độ) · ô tạp dịch thứ hai + mảnh giấy nhắc |
| `HelpDisc` | đĩa vàng giúp đỡ đồng minh |
| `NavBar` / `NavBadge` | dải menu · một mục menu (huy hiệu tranh, nhãn lụa, khoá) |
| `Corner` | góc người nói trên cảnh (cố vấn): `Face` + `Speech` bên trong |
| `Select` | hàng chọn một mục (biểu tượng + ô chọn gạch chân mực, kẻ chấm dưới như `Toggle`) |
| `Fold` | mục gập (cẩm nang, hỏi đáp): tiêu đề mũi tên son, lời mở bên dưới |
| `Moment` | khoảnh khắc lớn (đột phá, luân hồi, thất bại): huy hiệu đập xuống, dải lụa son / dấu mực (`fail`), hào quang (`glory`) |
| `Chit` | mẩu giấy báo nổi trên thanh tab (popover): tranh nghiêng, tiêu đề son, phần con — vừa nhận quà |
| `Orb` | nút tròn chọn một trong hàng (chân dung, khung): `on` viền vàng, `lock` ổ khoá |
| `BigStat` | số liệu chính (thế lực): tranh đồ vật, nhãn nhỏ, số rất to, gạch son dưới |
| `Letter` | tờ thư giấy trắng: mỗi `section` một đoạn ngăn nét mực đứt, `warn` dòng son cuối thư |
| `Tablet` | bảng vinh danh sơn mài viền vàng, lòng giấy trắng; `head` ngăn nét mực đôi (thành tựu) |
| `ShareBar` | dải chia phần: mỗi nguồn một đoạn màu khoáng theo tỉ lệ (thế lực theo nguồn) |
| `Laurels` | bục vinh danh ba hạng đầu (cúp trên hạng nhất, bậc giấy, đồng tiền hạng); chạm được |
| `Pinned` | dải giấy ghim đáy bảng, dính khi cuộn (hạng của mình) |
| `Capsule` | nhãn bầu dục nhỏ: tên đạo hữu (`dot` đang chơi), thẻ trưởng lão chia sẻ (`pic`, `rar`), link lam (`tone="azure"`), thêm vào (`dashed`) |
| `FloatBar` | dải tin nổi đáy cảnh trên thanh tab (dòng chat mới nhất; `narrow` chừa chỗ bên phải) |
| `Card` `Button` (`gold primary ghost quiet ink danger`) `Tag` `Meter` `Bag` `Medal` `Badge` `Stat` `Stepper` `Slider` `Toggle` `Painting` `Plate` `Bubble` `Hint` `Pointer` `Confirm` `Toasts` | như tên |

## Cảnh (ui/scene/ — lớp HTML đè lên cảnh Pixi)
Vị trí tính từ dữ liệu truyền vào bằng prop `x`/`y` (px), component tự đặt `left/top`.
| Component | Dùng cho |
|---|---|
| `Stage` | khung cảnh cuộn dọc: lớp cuộn chứa nút chạm vô hình `.hit`, lớp ghim có viền tối (núi tông môn, bản đồ vùng) |
| `Pin` | ghim theo toạ độ cảnh (`at` center · up · below) |
| `Caption` | chữ nhãn viền giấy trên cảnh (`size`, `tone` red, `color`, `spaced`, `wrap`, `dim`, `shift`) |
| `Beacon` | mục tiêu bản đồ vùng: huy hiệu + giọt son cấp + dấu khoá/đã chinh phục + quầng hot + tên |
| `Dock` | thanh nổi cố định trên bản đồ (`at` top · side · foot · tools; `fade`) |
| `MapInset` | bản đồ nhỏ góc màn: canvas vẽ sẵn, chấm tông môn, khung đang nhìn, chạm/kéo để tới, nút thu |
| `Overlay` | lớp phủ toàn khung bản đồ giới: lớp ghim (không chặn chạm) hoặc `touch` (nhận cử chỉ) |
| `NameTag` | biển tên tông môn viên mực treo dưới điểm (`mine`: nền vàng) |
| `Marker` | dấu cắm bấm được: cờ + lời ghi (`tone` red: dấu minh · gold: ghi nhớ) |
| `Ping` | vòng son nháy loang chỗ vừa nhảy tới |
| `Visitor` | khách ghé trên cảnh: chân dung vòng giấy nhún nhẹ, hộp quà |
| `Yield` | bong bóng sản lượng chờ thu (`over`: kho đầy) |
| `LevelUp` | chữ lên tầng bay lên rồi tan |
