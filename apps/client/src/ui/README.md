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
  (viên mực), `--lacquer --gilt` (án son, chỉ vàng), `--rar2 --rar3 --rar4` (phẩm lam · tím · vàng).
- Da vẽ tay: `--sk-card` (khung đôi), `--sk-card-glow`, `--sk-card-silk`, `--img-mountains`, `--ui-seal-img`,
  `--ui-ribbon-img`, `--stroke-red`, `--stroke-ink`, `--paper-tex`.
- Khoảng cách `--sp-1…5`, chữ `--fs-1…7`, chuyển động `--dur-1…3 --ease --spring`.

## Lớp (theme.css)
- Bố cục: `.stack` (dọc) `.row` (ngang) `.wrap` `.between` `.center` `.grow` `.grid` (cột đều, `--cols`) `.fill` (tự xếp,
  ô tối thiểu `--min`) `.split` (cột co + cột giãn; `.end-side`: đảo) `.scroller` (hàng cuộn ngang) `.plain` (bỏ chấm danh
  sách) `.items-start/.items-end` `.justify-center/.justify-end` `.self-start/.self-center/.self-end` `.span-all` `.w-full`
  `.rel` `.sticky-top` `.mt-1…5` `.hidden-narrow`. Khoảng cách qua `--gap`.
- Chữ: `.t-title .t-head .t-strong .t-small .t-tiny .t-lore .t-soft .t-faint .t-good .t-bad .t-gold .t-num .t-ellipsis
  .t-center .t-right .nowrap .clamp` (`--lines`) `.dim` `.on-dark` `.sr`.
- Đồ vật nhỏ: `.stamp` (dấu son "Đã nhận"), `.path` + `li.hit` (đường mốc thưởng), `.rank-no.r1/r2/r3` (đồng tiền hạng),
  `.ledger` + `li.on/.good` (sổ dòng kẻ đứt).

## Component
| Component | Dùng cho |
|---|---|
| `Sheet` / `Page` | bảng trượt / trang của tab (tiêu đề nét cọ son) |
| `Banner` | băng rôn đầu màn: tên, dải lụa, tranh nghiêng (`art` hoặc snippet `pic`), phần con bên dưới |
| `Band` | dải lụa ghi giờ/cấp/trạng thái (`tone` red · ink · jade) |
| `Pill` | viên mực ghi số/giá trên tranh, cảnh |
| `Seal` | ấn son tròn: nút lớn (có `onclick`) hoặc dấu số đè góc tranh |
| `Altar` | án son bày lễ vật (chi phí, cung phụng) |
| `Note` | tờ giấy ghim son (bùa, cáo thị, thư); `tilt`, `ready`, `dim`, bấm được |
| `Board` | bảng gỗ ghim các `Note` |
| `Shelf` | tủ gỗ nhiều tầng kệ (túi đồ, tủ đan, kệ hàng, kệ bí kíp) |
| `Scroll` | cuộn tranh treo trục gỗ (trưởng lão, thẻ nhân vật) |
| `Plaque` | biển số liệu nhỏ (nhãn · số · dòng phụ) |
| `Face` | chân dung trong vòng ngọc |
| `Speech` | bong bóng lời nói (chat, cố vấn) |
| `InkArrow` | mũi tên nét mực "trước → sau" |
| `Tile` | lối vào bằng tranh đồ vật + nhãn (`look` paper · ink, `selected`) |
| `Cell` | ô trò chơi trên lưới `.grid` (lật bài, mê cung, khảo cổ): `back` card · fog · stone, `up`, `done`, `busy`, `ring`, `ratio` |
| `Rail` | cột thẻ tranh dọc bên trái (nhiều mục) |
| `Tabs` | thẻ kẹp sách (mặc định) · `switch` công tắc viên mực · `chips` thẻ tre có tranh |
| `Card` `Button` (`gold primary ghost quiet ink danger`) `Tag` `Meter` `Bag` `Medal` `Badge` `Stat` `Stepper` `Slider` `Toggle` `Painting` `Plate` `Bubble` `Hint` `Pointer` `Confirm` `Toasts` | như tên |
