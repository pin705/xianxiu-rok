# Công cụ vẽ tranh

Bộ tranh vẽ tay của game (thủy mặc, chốt 25/9/2026) được tạo bằng AI qua IMG Studio rồi ghép vào game bằng các script ở đây. Mọi prompt nằm trong `prompts.py`; muốn vẽ thêm hay vẽ lại món nào thì sửa bảng của món đó rồi chạy lệnh của nhóm.

- Game đọc tranh từ `apps/client/public/art/` qua `manifest.json` (key → file). Key chưa có tranh thì vẫn vẽ bằng code như cũ.
- Mở game với `?art=0` để tắt toàn bộ tranh (so trước/sau). Chế độ này cũng mở kho hình vẽ bằng code cho `export.ts` đọc.
- Danh sách mọi key, cỡ và tiến độ nằm ở [docs/ART_SPEC.md](../../docs/ART_SPEC.md) (`node tools/art/spec.ts`).

## Chuẩn bị (một lần)

```sh
# khoá API: IMG_STUDIO_KEY=img_… trong .env ở gốc repo (tạo ở https://imgstudio.site/billing). Không bao giờ in ra hay commit.
python3 -m venv tools/art/.venv
tools/art/.venv/bin/pip install -r tools/art/requirements.txt
```

## Quy trình

1. **Xuất bản vẽ code** (cần cho hộp, điểm neo và nguồn vẽ đè). Mở game với `?art=0`, đi qua các cảnh chứa hình cần vẽ (núi, bảng công trình, trận, bản đồ), rồi xuất sau mỗi cảnh:
   ```sh
   node apps/client/play.ts up art                            # một giới + một người chơi (PLAY_REF=worktree nếu code chưa commit)
   node apps/client/play.ts art js "location.search='?art=0'" # tải lại ở chế độ không tranh
   node apps/client/play.ts art tap "…"                       # đi tới cảnh cần xuất (hoặc dùng look / tap)
   node tools/art/export.ts --player art                      # → tools/art/.work/proc, .work/skins, gộp key mới vào keys.json
   ```
   Chrome nào đang bật remote debugging cũng được: `node tools/art/export.ts --port 9222`.
2. **Vẽ và ghép**:
   ```sh
   tools/art/.venv/bin/python tools/art/make.py <nhóm> [tên…]   # vẽ ảnh còn thiếu rồi ghép vào public/art + manifest
   tools/art/.venv/bin/python tools/art/make.py <nhóm> --dry     # chỉ in prompt, không tốn tiền
   tools/art/.venv/bin/python tools/art/make.py <nhóm> --fit     # ghép lại từ ảnh thô đã có (sửa cách ghép, không gọi API)
   ```
   Chạy từng nhóm một, không chạy song song (các lệnh cùng ghi `manifest.json`). Ảnh thô nằm ở `tools/art/.work/raw/` (không commit). Muốn vẽ lại một món thì xoá ảnh thô của nó rồi chạy lại.
   Lệnh tắt: `npm run art -- <nhóm> …`, `npm run art:export -- --player art`, `npm run art:spec`.
   Sau khi vẽ hay ghép bất cứ nhóm nào, chạy `make.py pack` để chia lại gói và dựng lại atlas (xem mục dưới).
3. **Xem**: chạy game bình thường và mở thêm `?art=0` để so. Chạy `node tools/art/spec.ts` để cập nhật tiến độ.
4. **Commit** `apps/client/public/art/` (ảnh + `manifest.json`), `tools/art/keys.json`, `docs/ART_SPEC.md`.

## Các nhóm

| Nhóm | Key | Cách làm | Ảnh mẫu |
| --- | --- | --- | --- |
| `buildings [mã…]` | `bld:<mã>:<bậc>:<biến thể>`, `panel:<mã>:<bậc>` | Bậc 2 vẽ trước (bố cục từ bản đang có, công trình mới thì từ bản vẽ code). Bậc 1, 3, 4, 5 sửa từ chính bậc 2 để giữ nhận diện. Đặt vừa hộp: rộng bằng công trình, chân chạm gốc. | `style.jpg` |
| `faces [mã…]` | `face:<mã trưởng lão>`, `face:master` | Bán thân, khung vuông (game cắt tròn). | `face.jpg` |
| `icons [A…F]` | `icon:<tên>`, `tab:<tab>`, `pointer` | Bảng 3×3, cắt theo ô, mỗi ô giữ khối liền lớn nhất. | `icons.jpg` |
| `emblems [M1…M5]` | `emblem:<hình chạm>` → mọi `medal:*`, `wmark:*` | Chỉ vẽ hình chạm; đĩa màu vẫn vẽ bằng code theo tông (`packages/art/emblems.ts` `medal()`). | `icons.jpg` |
| `figures` | `fig:<đạo thống>` | Tổ sư chín đạo thống, một bảng; model hay xếp 4 + 5 hình và đổi chỗ nên cắt theo hình rời với thứ tự thật `FIGURES_DRAWN` (xem ảnh thô rồi sửa khi vẽ lại). Mỗi hình lấy tới giữa hai hình bên cạnh để giữ mảnh rời (lửa, hổ con). | `face.jpg` |
| `masks [K1…K3]` | `mask:<tên>` | Icon đen; game chỉ lấy alpha, tô bằng màu chữ. | `icons.jpg` |
| `props [P1…P3]` | thông, đá, trúc, hoa, đèn, hạc, chim, bướm, người, cờ, giàn giáo, `march`, `wtoken` | Bảng 3×3, đặt theo chân khớp khung bao bản vẽ code (`PROP_KEYS`). | `icons.jpg` |
| `troops [S0 S1 S2]` | `sold:<hệ>:<phe>:<bậc 3–5>`, `sold:dao:<đạo>` | Bảng 3×3 theo phe (0 ta, 1 địch); S2 = đệ tử đặc trưng chín đạo thống (một dáng cho mọi bậc, cả khi là địch). | `icons.jpg` |
| `landmarks` | `lm:<đạo>` | Trấn phái chi bảo cạnh Tụ Linh Trận: bảng 3×3, khớp hộp `LANDMARK_BOX` 52×64 DU (chân chạm đáy) như `daoMark()` trong emblems.ts. Gói `home`. | `icons.jpg` |
| `beasts` | `beast:<hệ>` → mọi `beast:<hệ>:<màu>` | Một dáng lông xám mỗi hệ; game tô màu loài bằng tint (`world/battle/field.ts`). | `icons.jpg` |
| `concept [màn] [hướng]` | (không vào game) | Ảnh concept toàn màn từ ảnh chụp `.work/concept/<màn>-src.png`, mỗi hướng trong `CONCEPT_STYLES`. Chốt hướng trước khi vẽ mảnh giao diện; ảnh 2K giá gấp đôi. | ảnh chụp màn |
| `kit [tên…]` | `skin:<tên>` (thẻ, nút, nhãn, thanh) | **Cách đang dùng.** Vẽ 3 mẫu gốc sạch (`KIT_BASES`: giấy, sơn mài, nhãn), rồi suy ra mọi da trong `KIT`: co giãn 9 mảnh đúng thông số từng da (`nine`), đổi màu theo độ sáng (`tint`). Không hoa văn, không loang, nên giao diện yên và tranh nổi. | bản vẽ code |
| `skins [tên…]` | `skin:<tên>` | Cách cũ: thiết kế riêng từng da. Chỉ còn dùng cho khung bảng (`scroll`), `strip`, `rod`, đĩa, công tắc. Đừng dùng lại cho thẻ, nút, nhãn: mỗi món một hoa văn là giao diện rối và lòe loẹt, hoa văn ở góc 9 mảnh còn đè chữ nút nhỏ. | bản vẽ code + `icons.jpg` |
| `clouds` | `fog:*0…2`, `cloud:*…`, `thunder:*…` | Mây cho key động (`fog:<rộng>:<hạt>`): game chọn 1 trong 3 biến thể theo key (`stage.ts` `artFor`). | `icons.jpg` |
| `scenery [key…]` | `peak:*`, `ledge:*`, `stair:*` | Vẽ đè giữ nguyên hình, lấy alpha bản vẽ code (công trình đứng khớp trên bậc đá). | bản vẽ code + `style.jpg` |
| `far` | `far1`, `far2` | Như `scenery`, cắt 3 khúc chồng nhau rồi ghép mờ dần. | bản vẽ code + `style.jpg` |
| `map` | `map`, `map:home` | Bản đồ vùng vẽ đè; tông môn trên bản đồ dùng lại tranh Chủ điện. | bản vẽ code + `style.jpg` |
| `fields [cảnh…]` | `field:<cảnh>` | Bản `wild` vẽ đè từ bản vẽ code, các cảnh khác sửa từ bản `wild`; game phủ kín sân mọi cỡ màn. | bản vẽ code + `style.jpg` |
| `paper`, `strokes` | `skin:paper`, `skin:stroke*`, `skin:blot` | Vân giấy lát liền; nét cọ cắt từ bảng. | `icons.jpg` |

## Tải tài nguyên (như Godot)

Game tải hết tranh ngay lúc đầu rồi mới vào, vào rồi không cảnh nào phải đợi.
- Đợi gói `boot` (da giao diện, hình chạm huy hiệu) là hiện màn tiêu đề.
- Màn tiêu đề kiêm màn tải (vạch + %): tải hết các gói (`artAll` trong `packages/art/art.ts`) rồi mới cho vào. Người chơi mới vẫn xem lời dẫn, đặt tên trong lúc tải.
- Service worker giữ tranh trong kho `rok-art` qua mọi bản build. Đường dẫn mỗi tranh có `?v=<mã nội dung>` (`write_manifest`), nên lần mở sau không tải lại, bản cập nhật game cũng chỉ tải tranh nào thật sự đổi.

`make.py pack` gán mỗi mục manifest một `pack` theo bảng `PACKS` trong `pipeline.py`. Texture mỗi gói được gom vào vài trang atlas 2048² (`atlas/<gói>-<n>.webp`, mục ghi `page` và `frame`): ít lượt tải, Pixi gộp được lượt vẽ. File lẻ vẫn giữ để ảnh HTML dùng và để lần gói sau đọc lại.

| Gói | Có gì |
| --- | --- |
| `boot` | da giao diện, hình chạm huy hiệu (đợi trước khi hiện màn tiêu đề) |
| `home`, `bld1`…`bld5` | núi, đồ trang trí; công trình theo bậc |
| `map`, `world`, `battle` | bản đồ vùng; token bản đồ giới; quân, yêu thú, sân trận |
| (không gói) | icon, chân dung, icon thao tác, `panel:*` — trình duyệt tự tải khi hiện |

**Hai bộ độ nét** (như bản @1x/@2x của engine): bộ thường 3 px/DU cho điện thoại, bộ HD 6 px/DU (`atlas-hd/`, trang 4096, nguồn `.work/hd/`) cho màn to độ nét cao. `main.ts` chọn HD khi `cssPerDU() × DPR > 3,4`, tức desktop Retina (cảnh ~2,85 px CSS mỗi DU × 2). Mỗi mục có bản HD ghi `hd: { page, frame }`, hoặc `hd: { src }` khi quá khổ. Bản HD không phóng quá độ phân giải thật của ảnh vẽ (`raw_k`). Bộ thường khoảng 3,9 MB; bộ HD khoảng 10 MB, chỉ desktop tải và tải một lần.

Cảnh Pixi vẽ ở tỉ lệ điểm ảnh của màn, tối đa 3 (`stage.ts` `DPR`; máy dưới 6 nhân giữ 2). Cảnh 2x trên màn 3x bị phóng 1,5 lần, trông nhoè cạnh chữ HTML sắc nét.

Cảnh vẫn đợi gói của mình (`mountScene({ art })`). Texture thuộc gói chưa về thì game tạm vẽ bằng code rồi tự đổi sang tranh (`stage.ts` `painted`). Hai lớp này để phòng khi có người vào cảnh trước lúc tải xong.

Đo trên 4G giả lập (4 Mbps, trễ 150 ms, 390×844):

| | Bản nạp một lượt (trước 26/9) | Bản hiện tại |
| --- | ---: | ---: |
| Lần đầu: hiện màn đầu tiên | 12,5 s | 6,1 s |
| Lần đầu: tải xong hết, vào game | 12,5 s | 9,4 s |
| Lần sau: vào game | tải lại khi có bản mới | 2,3 s (1,6 s là màn chào), 8 KB qua mạng |

Trước màn tiêu đề, phần còn lại chủ yếu là JS (~1,1 MB, phần lớn là Pixi).

## Phong cách và công thức

- **Hướng 6 — thủy mặc, model Nano Banana Pro** (`nbp`, khoảng 150đ/ảnh, 3 ảnh mẫu, ~3 ảnh/phút). Đoạn mô tả phong cách chung là `INK` trong `prompts.py`. Bản GPT-Image (nền trong suốt sẵn) đã bị loại vì ra chất AI bóng, chi tiết li ti, không khớp nền giấy.
- **Nền hồng rồi tách**: model này không ra nền trong suốt, nên mọi prompt đều yêu cầu nền `#FF00FF` phẳng. `pipeline.key_magenta` ước alpha theo độ hồng rồi tách màu thật (F = (C − (1−a)·M) / a), nét mực loang không bị ám hồng.
- **Ảnh mẫu (`anchors/`)**: `style.jpg` (công trình) cho công trình và vẽ đè; `icons.jpg` (4 icon sạch) cho mọi bảng 3×3 và da; `face.jpg` cho chân dung. Không dùng `style.jpg` cho bảng icon: model vẽ lẫn đá và mái nhà vào khoảng trống.
- **Vẽ đè giữ hình** (núi, da, bản đồ, sân trận): gửi bản vẽ code đệm tới tỉ lệ model nhận; lấy alpha của bản vẽ code làm alpha cuối, nên đường bao và phần mờ dần khớp tuyệt đối. Cảnh dùng nền giấy chứ không dùng nền hồng, vì nền hồng lọt vào phần mờ thành vệt hồng.
- **Hướng giao diện: sơn mài** (chốt 27/9/2026 qua concept `make.py concept`, ảnh `.work/raw/concept-home-lacquer.webp`).
  - Bề mặt lam sẫm, chữ ngà. Kim loại chỉ là đồng cổ mảnh ở viền và góc chạm.
  - Nút chính dùng son, nút phụ dùng ngọc lam. **Không tô mảng vàng hay giấy ngà**: người chơi thấy "vàng quá, giống giấy, rẻ tiền".
  - Màu giao diện nằm ở `LACQUER` trong `apps/client/src/ui/theme.ts`, ghi đè các màu gốc chỉ cho HTML; cảnh Pixi vẫn dùng `PIGMENT`.
  - Khung (`card`, `card-glow`, `toast`, `scroll`, `strip`) dùng mẫu có góc chạm `ornate`, giữ nguyên màu vẽ.
  - Nút dùng mẫu `plaque`, chỉ nhuộm phần mặt xám (`tint_grey`), viền đồng giữ nguyên.
  - Hình chữ nhật trơn là thứ làm giao diện "như web app".
- **Giao diện phải yên**: trang trí chỉ ở khung bảng lớn, còn thẻ, nút, nhãn phẳng một màu với viền mực mảnh (nhóm `kit`). Tranh (công trình, icon, chân dung) mới là thứ nổi. Bài học 26/9: bộ 43 da mỗi món một hoa văn và loang màu nhìn lung tung, lòe loẹt; hoa văn trong vùng góc 9 mảnh đè chữ ở nút nhỏ.
- **Chữ giả**: model hay viết chữ Hán vô nghĩa lên biển hiệu; mọi prompt có "no writing / no text".
- **Độ phân giải ảnh gốc**: Nano Banana Pro khi sửa từ ảnh mẫu trả ảnh khoảng 2752 px dù chọn 1K hay 2K. Xem cỡ ảnh thô trong `.work/raw` trước khi trả tiền vẽ lại "cho nét hơn" (26/9: phí 2.700đ vì vẽ lại núi mà không tăng độ phân giải). Tạo mới không có ảnh mẫu ở 1K (sân trận cũ) mới chỉ ~768 px, và chọn 2K thì tăng thật.
- **Vẽ lại thì so từng tấm**: model có lúc vẽ chồng 2 tầng bậc đá, hoặc loang màu lạ. Tấm hỏng thì lấy lại bản cũ (`.work/old1k`).
- **Quầng sáng quanh mái** (bậc cao) thành mảng trắng mờ hình hộp sau khi tách nền: `fit_building` bỏ phần gần trong suốt (dưới 35%). Mây đỡ bậc 5 chạm mép ảnh thì `cloud_bank` cắt theo elip.
- **Khung HUD và bảng** (`strip`, `scroll`) cũng lấy từ nhóm `kit`: dải xanh ngọc phẳng, viền đều 4 cạnh (`symmetric`). Viền tay thường đậm hơn ở cạnh dưới, trông như bóng đổ nặng. Không vẽ họa tiết lặp dọc viền: lặp lại trông rẻ.
- **Mây bậc 5 chạm mép ảnh**: `feather` làm mờ 4% sát mép trước khi cắt sát.

## Soi lỗi hiển thị

- **Chữ khó đọc**: `node tools/art/contrast.ts --player <tên> <nhãn>` đo tương phản thật của mọi đoạn chữ đang hiện trên ảnh chụp, vì chữ nằm trên da vẽ tay nên CSS không biết màu nền. Ngưỡng là 4,5, hoặc 3 với chữ to/đậm. Nó in danh sách chỗ dưới ngưỡng và ảnh đánh dấu đỏ ở `.work/contrast/`. Chạy lại sau mỗi lần đổi da hay bảng màu.
- **Nền icon chưa sạch**: xem icon trên nền tối (nền giấy che mất vệt sót). Bảng bị lệch lưới (model vẽ 4 hình một hàng, thêm hình thừa) thì `cut_sheet` tách theo hình rời. Nếu có hình thừa thì khai `ICON_SKIP`; khi số hình không khớp, công cụ báo ra.
- **Nền không phải hồng thuần**: có khi model tô nền tím nhạt hay hồng đậm. `key_magenta` khi đó lấy màu nền từ mép ảnh và báo "nền không phải hồng thuần"; gặp thông báo này thì xem lại tranh.

## Nối vào game

| Chỗ | Việc |
| --- | --- |
| `packages/art/art.ts` | `setArt`/`artOf` (manifest), `noteArt`/`artKeys` (key đã nướng), `artOff`/`dump` (`?art=0`, `globalThis.__art`) |
| `packages/art/img.ts` `paintedUrl` | ảnh HTML: icon, chân dung, huy hiệu, `panel:*` |
| `apps/client/src/ui/theme.ts` | da giao diện: `slice` (px ảnh), `width` (px CSS), `outset`, `repeat`, `fill` |
| `apps/client/src/world/stage.ts` `painted` | texture Pixi: neo theo hộp bản vẽ code, cỡ theo ảnh (`tex: true` để bộ nạp tải sẵn) |
| `packages/art/emblems.ts` `medal` | hình chạm `emblem:*` vẽ lên đĩa màu code |
| `apps/client/src/world/battle/field.ts` | `field:<cảnh>` phủ kín sân, `beast:<hệ>` + tint |
| `apps/client/src/main.ts` `loadArt` | đọc manifest, đợi gói `boot`, rồi `artAll` tải hết theo thứ tự ưu tiên |
| `apps/client/src/Title.svelte` | màn tải: vạch + %, vào game khi `artAll` xong |
| `apps/client/public/sw.js` | kho `rok-art` giữ tranh (`?v=`) qua các bản build |
| `packages/art/art.ts` `artPack` | nạp một gói (ảnh hoặc trang atlas), tiến độ cho màn tiêu đề (`onArtProgress`) |

## Thêm món mới

- **Công trình mới**: thêm vào `BUILDINGS` (tên, dáng theo bậc, tỉ lệ) và `building_dims` trong `pipeline.py` (chép từ `buildings.ts`). Xuất bản vẽ code ở cảnh núi (`bld-<mã>-2-0.png`), rồi chạy `make.py buildings <mã>`.
- **Trưởng lão mới**: thêm vào `FACES`, rồi chạy `make.py faces <mã>`.
- **Icon, huy hiệu, icon thao tác mới**: thêm một bảng 3×3 mới vào `ICON_SHEETS` / `EMBLEM_SHEETS` / `MASK_SHEETS` (đủ 9 ô, ô thừa đặt tên `_…`), rồi chạy lệnh với tên bảng. Không sửa bảng cũ, vì sửa sẽ phải vẽ lại cả bảng.
- **Da mới**: thêm vào `SKINS` (tên trong `theme.ts`). Xuất bản vẽ code, rồi chạy `make.py skins <tên>`.
