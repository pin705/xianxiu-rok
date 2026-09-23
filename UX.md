# Game flow & UI/UX

> Đi kèm [PLAN.md](PLAN.md). Màn Tông môn và Xuất quan đã chạy thật: `npm run dev` → http://localhost:5173

## 1. Chọn UI thế nào

**Công nghệ**

- **HTML/CSS + Svelte 5** cho mọi màn hình. Svelte cho ít code nhất, bundle nhỏ (bản hiện tại: 21KB gzip, quan trọng với WebView Android yếu), có sẵn transition/animation.
- **PixiJS chỉ cho bản đồ và phát lại trận đánh.** Không vẽ UI trong canvas — chữ tiếng Việt có dấu, co giãn theo màn hình, trợ năng đều thua HTML.
- **Không dùng UI kit** (Material, Bootstrap, DaisyUI…): game cần bản sắc riêng, mà cả game chỉ cần ~10 component tự làm (mục 7).
- Đã thạo React/Vue thì đổi được: chỉ viết lại `client/`, còn `rules/` giữ nguyên.

**Hướng hình ảnh: Thanh lục sơn thủy + ấn triện**

- *Thanh lục sơn thủy* (青绿山水) là lối vẽ núi sông bằng khoáng chất lam và lục, như bức "Thiên Lý Giang Sơn Đồ". Nền là sương lạnh; màu chủ đạo là lam–lục khoáng; đỏ chu sa chỉ dùng cho ấn.
- Cố ý **không** đi theo lối "giấy ngả vàng + mực + đỏ" quen thuộc: ai làm game cổ phong cũng chọn lối đó, nên nó không còn gì riêng.
- **Ấn triện là dấu nhận diện của game** (mục 7): mỗi công trình, tài nguyên và tab là một con dấu khắc chữ Hán bằng nét bút lông.

**Bố cục**

Màn hình dọc, chơi một tay; thứ cần bấm nằm ở nửa dưới. Trên PC là một cột 480px ở giữa màn hình.

## 2. Nguyên tắc UX

1. **Màn nào cũng trả lời "làm gì tiếp?"** — dải Tạp dịch luôn dính trên cùng; khi rảnh nó gợi ý việc nên làm, và thẻ được gợi ý có viền lục.
2. **Hành động chính chỉ cần 1 chạm**: nút Xây/Nâng nằm ngay trên thẻ, không qua popup xác nhận.
3. **Không làm được thì phải nói vì sao**: tài nguyên thiếu tô đỏ; "Cần Chủ điện tầng 3" hiện đúng chỗ của nút; công trình chưa mở chỉ hiện "Mở khi Chủ điện đạt tầng N".
4. **Không nói một điều hai lần**: tạp dịch bận thì dải trên đã báo, các thẻ không lặp lại.
5. **Chờ đợi phải có hình**: đếm ngược + thanh tiến độ; xong việc thì ấn "đóng dấu".
6. **Quay lại là có quà**: màn Xuất quan tổng kết thời gian vắng, tài nguyên thu được, công trình đã xong, và nhắc khi kho đầy.
7. **Mở dần tính năng theo tầng Chủ điện** (mục 4) — tránh lỗi "quá nhiều hệ thống ngay từ đầu" mà 《遮天世界》 bị chê.
8. **Màu không phải tín hiệu duy nhất**: kho đầy có chữ "đầy", thiếu tài nguyên có con số, ấn nào cũng có tên tiếng Việt đi kèm.

## 3. Bản đồ màn hình

```
Khởi động
├─ Lần đầu:  Mở đầu (3 khung) → Đặt tên tông môn → Tông môn + chỉ dẫn
└─ Quay lại: Xuất quan (nếu vắng > 1 phút) → Tông môn

Luôn hiện: tên tông môn · cảnh giới · 3 tài nguyên · dải Tạp dịch
Thanh dưới (5 tab):
├─ 宗 Tông môn   công trình ─┬─ Chủ điện       → Cảnh giới, Độ kiếp
│                            ├─ Diễn võ trường → Tuyển đệ tử
│                            ├─ Tàng Kinh Các  → Cây công pháp
│                            └─ Đan phòng      → Chữa thương, Luyện đan
├─ 徒 Môn hạ     trưởng lão, đệ tử, đội hình                  (tầng 2)
├─ 图 Bản đồ     yêu thú, tông môn NPC, bí cảnh → P3: giới     (tầng 3)
├─ 盟 Tiên minh  P3                                           (tầng 6)
└─ 宝 Bảo khố    đan dược, vật phẩm, nguyên liệu                (tầng 3)
Góc trên (sau này): Thư & chiến báo · Nhiệm vụ · Cài đặt (xuất/nhập save, ngôn ngữ, âm thanh)
```

## 4. Mở khóa theo tầng Chủ điện

| Tầng | Mở ra |
|---|---|
| 1 | Tụ Linh Trận, Linh điền, Khoáng mạch |
| 2 | Tàng Bảo Các, Diễn võ trường, tab Môn hạ, trưởng lão đầu tiên |
| 3 | Bản đồ (yêu thú quanh núi), Bảo khố |
| 4 | Tàng Kinh Các, Đan phòng |
| 5 → 6 | Độ kiếp lần đầu → **Trúc Cơ**: bí cảnh; (P2) luận võ với tông môn khác |
| 6+ | (P3) Tiên minh, vào giới |
| 10 → 11 | Độ kiếp → **Kim Đan** |
| 15 | Luân hồi (tự nguyện) |

## 5. Luồng chính

### 5.1 Mười phút đầu

| Phút | Người chơi làm | Game dạy điều gì |
|---|---|---|
| 0:00 | 3 khung mở đầu (bỏ qua được): tông môn đổ nát, bạn nhận truyền thừa | Bối cảnh |
| 0:30 | Đặt tên tông môn (có sẵn 3 gợi ý) | Cảm giác sở hữu |
| 0:45 | Xây Tụ Linh Trận (10 giây) → ấn đóng dấu | Xây, chờ, tài nguyên |
| 1:30 | Xây Linh điền, Khoáng mạch | Hàng đợi chỉ có 1 chỗ |
| 3:00 | Nâng Chủ điện lên tầng 2 → mở Tàng Bảo Các, Diễn võ trường | Mở khóa theo cảnh giới |
| 5:00 | Tuyển 10 kiếm tu; trưởng lão đầu tiên tìm đến | Quân + tướng |
| 7:00 | Tầng 3 mở Bản đồ: đánh yêu thú Lv1 (chắc thắng) → xem trận → nhặt đồ | Combat, Bảo khố |
| 10:00 | Đặt một công trình dài (~10 phút), kèm lời nhắn "Cứ rời đi, tông môn vẫn vận hành" | Vòng lặp idle |

Phiên đầu luôn kết thúc với một timer đang chạy → có lý do để quay lại.

### 5.2 Phiên quay lại (1–3 lần/ngày)

Mở game → Xuất quan → dải Tạp dịch rảnh + gợi ý → 1–3 lần nâng → (từ tầng 3) đánh yêu thú, gửi quân → đặt timer dài nhất → thoát.

### 5.3 Trạng thái thẻ công trình (đã làm)

| Trạng thái | Hiển thị |
|---|---|
| Chưa mở | Mờ, ấn nét đứt, chỉ một dòng "Mở khi Chủ điện đạt tầng N" |
| Xây / nâng được | Tác dụng + phần tăng (lục), chi phí, thời gian, nút **Xây** / **Nâng tầng N** |
| Thiếu tài nguyên | Chi phí thiếu tô đỏ, nút khóa |
| Vượt tầng Chủ điện | "Cần Chủ điện tầng N" nằm đúng chỗ của nút |
| Tạp dịch bận | Nút khóa (dải trên đã giải thích) |
| Đang xây | "Đang nâng lên tầng N · 0:42" |
| Vừa xong | Ấn đóng dấu, lên tầng mới |
| Tối đa | "Tầng tối đa" |

### 5.4 Xuất quân đánh yêu thú (mốc 1.2)

Bản đồ → chạm yêu thú → bảng dưới: cấp, hệ, thưởng dự kiến → **Xuất quân** → chọn đội (trưởng lão + đệ tử, có gợi ý hệ khắc) → quân đi theo đường thẳng, có timer → tới nơi thì đánh tự động → phát lại 5–10 giây (bỏ qua được) → chiến báo (thắng/thua, thương vong, thương binh về Đan phòng, chiến lợi phẩm) → quân về.

### 5.5 Độ kiếp (mốc 1.3)

Chủ điện đạt tầng 5 → nút **Độ kiếp** thay cho nút Nâng → màn độ kiếp: trời tối, kiếp vân kéo đến, 3 đợt lôi kiếp (dùng lại combat, đội của bạn hộ pháp) → qua được thì hiện màn đột phá **Trúc Cơ** — khoảnh khắc lớn nhất của game → mở tính năng mới. Thất bại: bị thương, chờ hồi phục rồi thử lại, không mất công trình.

### 5.6 Sau này

- **P2 luận võ** (PvP không cần cùng online): 3 đối thủ cùng tầm → xem phòng thủ → xuất quân → chiến báo. Bị đánh thì có khiên, và nút báo thù trong Thư.
- **P3 giới**: bản đồ chung, tiên minh, kết trận. Kiếp vân của người khác hiện ngay trên bản đồ.

## 6. Khung màn hình

**Tông môn** (đã làm)

```
┌──────────────────────────────────┐
│ [宗] Thanh Vân Tông                │
│      LUYỆN KHÍ · TẦNG 1            │
│  ～～ núi lam–lục mờ dần vào sương ～～ │
├──────────────────────────────────┤ ← dính trên khi cuộn
│ (石)1.000/2.000 (草)… (矿)…         │
│ Tạp dịch đang rảnh  Gợi ý: xây …   │
├──────────────────────────────────┤
│ [殿] Chủ điện  tầng 1              │
│      Giới hạn tầng của mọi công trình │
│      (石)160 (草)160    [Nâng tầng 2] │
│      (矿)160 (时)1:42               │
│ [阵] Tụ Linh Trận …                │
├──────────────────────────────────┤
│ [宗]   (徒)   (图)   (盟)   (宝)      │
└──────────────────────────────────┘
```

**Xuất quan** (đã làm): bảng trượt từ dưới lên, gồm thời gian vắng, "Thu được", "Hoàn thành", nhắc kho đầy, nút **Vào tông môn**.

**Chi tiết công trình** (mốc 1.1 — chạm vào thẻ)

```
┌──────────────────────────────────┐
│ [阵] Tụ Linh Trận · tầng 3          │
│ Hút linh khí quanh núi tụ thành đá. │
│ Hiện tại  1.800 linh thạch/giờ      │
│ Tầng 4    2.400  (+600)             │
│ (石)328 (矿)328 (时)0:49             │
│ [          Nâng tầng 4          ]   │
└──────────────────────────────────┘
```

**Bản đồ + bảng mục tiêu** (mốc 1.2)

```
┌──────────────────────────────────┐
│ (石)… (草)… (矿)…                   │
├──────────────────────────────────┤
│   ·    ·   [Yêu Lv3]   ·    ·       │
│   ·  [宗] - - - - ▸ [Yêu Lv1]        │ ← đường hành quân
│   ·    ·   [Tông NPC]  ·  [Bí cảnh] │
│      kéo để di chuyển · chụm để zoom │
├──────────────────────────────────┤
│ Yêu lang · Lv3 · Thể tu              │
│ Pháp tu khắc chế  ·  Thưởng: (石)300  │
│ [           Xuất quân           ]   │
└──────────────────────────────────┘
```

**Phát lại trận + chiến báo** (mốc 1.2)

```
┌──────────────────────────────────┐
│ Đội của bạn           Yêu lang Lv3  │
│ Kiếm tu ×120          ██████░░░░    │
│ ██████████░░                        │
│ Lượt 3/10 · kiếm quang −320  [Bỏ qua]│
├──────────────────────────────────┤
│ THẮNG                               │
│ Tử 12 · Thương binh 30 → Đan phòng   │
│ Thu được (石)300 (草)120 · Yêu đan ×1 │
│ [Về tông môn]        [Đánh tiếp]    │
└──────────────────────────────────┘
```

**Độ kiếp** (mốc 1.3)

```
┌──────────────────────────────────┐
│           trời tối, kiếp vân         │
│        Lôi kiếp · đợt 2/3            │
│  Chưởng môn  ████████░░              │
│  Hộ pháp: trưởng lão + 200 đệ tử      │
│  [Dùng Hộ Tâm Đan]                   │
└──────────────────────────────────┘
Qua → màn "TRÚC CƠ" với ấn lớn đóng giữa màn hình
Hỏng → bị thương 30 phút, công trình giữ nguyên
```

**Mở đầu + đặt tên** (mốc 1.3)

```
┌──────────────────────────────────┐
│ (tranh) Linh khí cạn, tông môn tàn… │
│                     [Tiếp] [Bỏ qua] │
├──────────────────────────────────┤
│ Đặt tên tông môn                     │
│ [ Thanh Vân Tông            ]        │
│ Gợi ý: Huyền Thiên · Lạc Hà · Tử Vi   │
│ [          Lập tông môn          ]  │
└──────────────────────────────────┘
```

## 7. Hệ thiết kế

### Màu (token trong `client/src/app.css`)

| Token | Hex | Dùng cho |
|---|---|---|
| `--mist` | `#E8EEEA` | Nền — sương sớm |
| `--silk` | `#F7F9F5` | Thẻ, thanh dưới, bảng dưới |
| `--ink` | `#17232A` | Chữ — mực lam đen |
| `--azurite` | `#1D4E73` | 石青: nút chính, tiến độ, cảnh giới |
| `--malachite` | `#29735F` | 石绿: sản lượng, phần tăng, gợi ý |
| `--cinnabar` | `#C23B22` | 朱砂: ấn triện, tài nguyên thiếu — dùng tiết kiệm |
| `--wash` / `--line` | `#5B6B70` / `#CFD9D4` | Chữ phụ / viền |

### Chữ

- **Be Vietnam Pro** 400/600 cho mọi chữ tiếng Việt. Font được thiết kế riêng cho tiếng Việt: dấu đẹp, số đều nhau nên không nhảy khi đếm.
- **Ma Shan Zheng** (bút lông) chỉ dùng cho chữ Hán trong ấn. Chỉ tải bộ con đúng các chữ có trong code (16 chữ, ~8KB). Thêm chữ mới thì chạy `npm run fonts -w client`.
- Cỡ chữ: 11 · 12 · 13 · 15 · 16 · 20 · 22.
- Cả hai font đều theo giấy phép OFL, tự host trong `client/public/fonts/` (chạy offline được). Khi phát hành, nhớ kèm file `OFL.txt`.

### Hệ ấn triện — dấu nhận diện của game

Các quy tắc lấy từ nghề khắc dấu thật:

- **Bạch văn** (chữ trắng trên nền đỏ, ấn vuông, nghiêng −2°): công trình đã xây, tab đang mở.
- **Chu văn** (chữ đỏ, viền đỏ, nền trống, ấn tròn): tài nguyên, tab chưa chọn. Riêng ấn 时 cho thời gian xây dùng màu xám.
- **Ấn chưa khắc** (viền nét đứt, chữ nhạt): công trình chưa xây.
- **Đóng dấu**: công trình xong thì ấn rơi xuống, xoay nhẹ, loang mực (450ms). Đây là chuyển động nổi bật duy nhất trên màn Tông môn.

### Chuyển động

- Chỉ có ba thứ chuyển động: một khoảnh khắc chính (đóng dấu), thanh tiến độ trượt, và bảng dưới trượt lên (`<dialog>` gốc). Không có animation trang trí.
- Khoảnh khắc lớn thứ hai (sau này): đột phá cảnh giới — toàn màn hình, 1.5–2 giây, bỏ qua được.
- Người dùng bật giảm chuyển động (`prefers-reduced-motion`) thì tắt hết.

### Component (tự làm)

Ấn · Ấn tài nguyên · Thanh tiến độ · Nút chính / nút khóa · Thẻ công trình · Dải Tạp dịch · Thanh tab dưới · Bảng dưới (`<dialog>`) · Chip chi phí · Toast (sau này).

### Giọng văn

- Nút nói đúng việc sẽ xảy ra: "Nâng tầng 3", "Vào tông môn" — không dùng "Xác nhận", "OK".
- Hán Việt cho thế giới game (Tụ Linh Trận, Xuất quan, Tạp dịch); tiếng Việt thường cho thao tác (Xây, Nâng).
- Báo lỗi phải kèm cách sửa: "Cần Chủ điện tầng 3", không phải "Không thể nâng cấp".
- Chữ hiển thị nằm trong object `L` (`client/src/lib.ts`); khi dịch thì thêm `en` cùng kiểu. Bảng thuật ngữ Việt–Anh ở PLAN.md.

### Số và thời gian

- Dưới 10.000 thì ghi đủ: "1.200". Từ 10.000 trở lên thì rút gọn theo `Intl`: "12,3 N", "1,2 Tr".
- Đếm ngược dạng đồng hồ: "0:42", "1:05:30". Trong câu văn thì viết chữ: "2 giờ 5 phút".

## 8. Đa nền tảng

- Điện thoại dọc là chuẩn (đã thử ở 390px và 360px).
- PC: cột 480px ở giữa. Sau này: bản đồ chiếm phần còn lại, còn chi tiết mở ở panel phải thay cho bảng dưới.
- Vùng an toàn (tai thỏ, thanh home) qua `env(safe-area-inset-*)`. Khi bọc Capacitor (P4) cần xử lý thêm cho dải dính trên cùng.
- Chạm và chuột dùng chung một bộ điều khiển; phím tắt cho PC để sau.

## 9. Trợ năng (đã làm)

- Chạm ≥ 40px; focus bàn phím hiện viền lam.
- Chữ Hán trong ấn gắn `aria-hidden`; tên tiếng Việt luôn nằm cạnh; nút có nhãn đầy đủ cho trình đọc màn hình ("Nâng Tụ Linh Trận lên tầng 2").
- Không dùng `aria-live` cho đồng hồ đếm ngược (tránh bị đọc liên tục 4 lần/giây).
- Tương phản (đã đo theo WCAG): chữ chính 13.6–15:1; chữ phụ, lục, đỏ chu sa ≥ 4.5:1 trên cả nền sương lẫn nền thẻ; chữ trên nút lam 8.3:1.

## 10. Việc UI tiếp theo

1. Bảng chi tiết công trình.
2. Cài đặt: xuất/nhập save (Safari có thể xóa dữ liệu web ít mở).
3. Mở đầu + đặt tên tông môn.
4. PWA: manifest + icon ấn 宗.
