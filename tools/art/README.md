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
3. **Xem**: chạy game bình thường và mở thêm `?art=0` để so. Chạy `node tools/art/spec.ts` để cập nhật tiến độ.
4. **Commit** `apps/client/public/art/` (ảnh + `manifest.json`), `tools/art/keys.json`, `docs/ART_SPEC.md`.

## Các nhóm

| Nhóm | Key | Cách làm | Ảnh mẫu |
| --- | --- | --- | --- |
| `buildings [mã…]` | `bld:<mã>:<bậc>:<biến thể>`, `panel:<mã>:<bậc>` | Bậc 2 vẽ trước (bố cục từ bản đang có, công trình mới thì từ bản vẽ code). Bậc 1, 3, 4, 5 sửa từ chính bậc 2 để giữ nhận diện. Đặt vừa hộp: rộng bằng công trình, chân chạm gốc. | `style.jpg` |
| `faces [mã…]` | `face:<mã trưởng lão>`, `face:master` | Bán thân, khung vuông (game cắt tròn). | `face.jpg` |
| `icons [A…F]` | `icon:<tên>`, `tab:<tab>`, `pointer` | Bảng 3×3, cắt theo ô, mỗi ô giữ khối liền lớn nhất. | `icons.jpg` |
| `emblems [M1…M5]` | `emblem:<hình chạm>` → mọi `medal:*`, `wmark:*` | Chỉ vẽ hình chạm; đĩa màu vẫn vẽ bằng code theo tông (`packages/art/emblems.ts` `medal()`). | `icons.jpg` |
| `masks [K1…K3]` | `mask:<tên>` | Icon đen; game chỉ lấy alpha, tô bằng màu chữ. | `icons.jpg` |
| `props [P1…P3]` | thông, đá, trúc, hoa, đèn, hạc, chim, bướm, người, cờ, giàn giáo, `march`, `wtoken` | Bảng 3×3, đặt theo chân khớp khung bao bản vẽ code (`PROP_KEYS`). | `icons.jpg` |
| `troops [S0 S1]` | `sold:<hệ>:<phe>:<bậc 3–5>` | Bảng 3×3 theo phe (0 ta, 1 địch). | `icons.jpg` |
| `beasts` | `beast:<hệ>` → mọi `beast:<hệ>:<màu>` | Một dáng lông xám mỗi hệ; game tô màu loài bằng tint (`world/battle/field.ts`). | `icons.jpg` |
| `skins [tên…]` | `skin:<tên>` (`ui/theme.ts`) | Thiết kế lại trong đúng đường bao bản vẽ code, giữ thông số 9 mảnh; làm dịu lòng da (`calm`). | bản vẽ code + `icons.jpg` |
| `scenery [key…]` | `peak:*`, `ledge:*`, `stair:*` | Vẽ đè giữ nguyên hình, lấy alpha bản vẽ code (công trình đứng khớp trên bậc đá). | bản vẽ code + `style.jpg` |
| `far` | `far1`, `far2` | Như `scenery`, cắt 3 khúc chồng nhau rồi ghép mờ dần. | bản vẽ code + `style.jpg` |
| `map` | `map`, `map:home` | Bản đồ vùng vẽ đè; tông môn trên bản đồ dùng lại tranh Chủ điện. | bản vẽ code + `style.jpg` |
| `fields [cảnh…]` | `field:<cảnh>` | Bản `wild` vẽ đè từ bản vẽ code, các cảnh khác sửa từ bản `wild`; game phủ kín sân mọi cỡ màn. | bản vẽ code + `style.jpg` |
| `paper`, `strokes` | `skin:paper`, `skin:stroke*`, `skin:blot` | Vân giấy lát liền; nét cọ cắt từ bảng. | `icons.jpg` |

## Phong cách và công thức

- **Hướng 6 — thủy mặc, model Nano Banana Pro** (`nbp`, khoảng 150đ/ảnh, 3 ảnh mẫu, ~3 ảnh/phút). Đoạn mô tả phong cách chung là `INK` trong `prompts.py`. Bản GPT-Image (nền trong suốt sẵn) đã bị loại vì ra chất AI bóng, chi tiết li ti, không khớp nền giấy.
- **Nền hồng rồi tách**: model này không ra nền trong suốt, nên mọi prompt đều yêu cầu nền `#FF00FF` phẳng. `pipeline.key_magenta` ước alpha theo độ hồng rồi tách màu thật (F = (C − (1−a)·M) / a), nét mực loang không bị ám hồng.
- **Ảnh mẫu (`anchors/`)**: `style.jpg` (công trình) cho công trình và vẽ đè; `icons.jpg` (4 icon sạch) cho mọi bảng 3×3 và da; `face.jpg` cho chân dung. Không dùng `style.jpg` cho bảng icon: model vẽ lẫn đá và mái nhà vào khoảng trống.
- **Vẽ đè giữ hình** (núi, da, bản đồ, sân trận): gửi bản vẽ code đệm tới tỉ lệ model nhận; lấy alpha của bản vẽ code làm alpha cuối, nên đường bao và phần mờ dần khớp tuyệt đối. Cảnh dùng nền giấy chứ không dùng nền hồng, vì nền hồng lọt vào phần mờ thành vệt hồng.
- **Da 9 mảnh**: hoa văn chỉ ở góc và hai đầu (phần giữa bị kéo giãn). `calm` giữ 35% độ lệch màu ở lòng. Món nào vẫn loang thì thêm `FLAT` vào thiết kế.
- **Chữ giả**: model hay viết chữ Hán vô nghĩa lên biển hiệu; mọi prompt có "no writing / no text".
- **Mây bậc 5 chạm mép ảnh**: `feather` làm mờ 4% sát mép trước khi cắt sát.

## Nối vào game

| Chỗ | Việc |
| --- | --- |
| `packages/art/art.ts` | `setArt`/`artOf` (manifest), `noteArt`/`artKeys` (key đã nướng), `artOff`/`dump` (`?art=0`, `globalThis.__art`) |
| `packages/art/img.ts` `paintedUrl` | ảnh HTML: icon, chân dung, huy hiệu, `panel:*` |
| `apps/client/src/ui/theme.ts` | da giao diện: `slice` (px ảnh), `width` (px CSS), `outset`, `repeat`, `fill` |
| `apps/client/src/world/stage.ts` `painted` | texture Pixi: neo theo hộp bản vẽ code, cỡ theo ảnh (`tex: true` để bộ nạp tải sẵn) |
| `packages/art/emblems.ts` `medal` | hình chạm `emblem:*` vẽ lên đĩa màu code |
| `apps/client/src/world/battle/field.ts` | `field:<cảnh>` phủ kín sân, `beast:<hệ>` + tint |
| `apps/client/src/main.ts` `loadArt` | đọc manifest, nạp sẵn các mục `tex` |

## Thêm món mới

- **Công trình mới**: thêm vào `BUILDINGS` (tên, dáng theo bậc, tỉ lệ) và `building_dims` trong `pipeline.py` (chép từ `buildings.ts`). Xuất bản vẽ code ở cảnh núi (`bld-<mã>-2-0.png`), rồi chạy `make.py buildings <mã>`.
- **Trưởng lão mới**: thêm vào `FACES`, rồi chạy `make.py faces <mã>`.
- **Icon, huy hiệu, icon thao tác mới**: thêm một bảng 3×3 mới vào `ICON_SHEETS` / `EMBLEM_SHEETS` / `MASK_SHEETS` (đủ 9 ô, ô thừa đặt tên `_…`), rồi chạy lệnh với tên bảng. Không sửa bảng cũ, vì sửa sẽ phải vẽ lại cả bảng.
- **Da mới**: thêm vào `SKINS` (tên trong `theme.ts`). Xuất bản vẽ code, rồi chạy `make.py skins <tên>`.
