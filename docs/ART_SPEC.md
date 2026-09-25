# Danh sách tranh

Mọi hình trong game có một **key**. Tranh vẽ tay nằm ở `apps/client/public/art/`, khai trong `manifest.json`; key chưa có tranh thì game vẽ bằng code như cũ.
Mở game với `?art=0` để tắt toàn bộ tranh (so trước/sau). Cách vẽ thêm, prompt và công cụ: [tools/art/README.md](../tools/art/README.md).

**Đã có tranh 193/325 (59%)**, không tính hiệu ứng:

| Nhóm | Số key | Đã có tranh | Lệnh (`make.py`) |
| --- | ---: | ---: | --- |
| Chân dung | 13 | 13 | faces |
| Công trình | 53 | 53 | buildings |
| Núi, bậc đá, cầu thang | 20 | 18 | scenery · far |
| Đồ trang trí | 40 | 16 | props |
| Da giao diện | 49 | 43 | skins · paper · strokes |
| Icon màu | 44 | 44 | icons |
| Icon thao tác đơn sắc | 22 | 0 | masks |
| Icon thanh điều hướng | 6 | 6 | icons (bảng F) |
| Huy hiệu | 66 | 0 | emblems |
| Bản đồ | 4 | 0 | map · props |
| Chiến trường | 8 | 0 | troops · beasts · fields |
| Hiệu ứng (giữ vẽ bằng code) | 19 | — | — |

## Chân dung

Bán thân, khung vuông cắt tròn. Key theo mã trưởng lão (`face:<mã>`), `face:master` là chưởng môn.

| Key | Loại | Hộp | Nguồn đề xuất |
| --- | --- | ---: | ---: |
| ✓ `face:bachVoNhai` | ảnh HTML | 48×48 | 156×156 |
| ✓ `face:diepCoThanh` | ảnh HTML | 48×48 | 156×156 |
| ✓ `face:hanBang` | ảnh HTML | 48×48 | 156×156 |
| ✓ `face:hoacThienCuong` | ảnh HTML | 48×48 | 156×156 |
| ✓ `face:huyenMinh` | ảnh HTML | 48×48 | 156×156 |
| ✓ `face:loiChan` | ảnh HTML | 48×48 | 156×156 |
| ✓ `face:macSau` | ảnh HTML | 48×48 | 156×156 |
| ✓ `face:master` | ảnh HTML | 48×48 | 156×156 |
| ✓ `face:nhuYen` | ảnh HTML | 48×48 | 156×156 |
| ✓ `face:thachKien` | ảnh HTML | 48×48 | 156×156 |
| ✓ `face:thanhPhong` | ảnh HTML | 48×48 | 252×252 |
| ✓ `face:toMiNuong` | ảnh HTML | 48×48 | 156×156 |
| ✓ `face:vanHac` | ảnh HTML | 48×48 | 156×156 |

## Công trình

`bld:<mã>:<bậc>:<biến thể>` trên núi; `panel:<mã>:<bậc>` là cùng công trình ở đầu bảng chi tiết — trỏ cùng một file.

| Key | Loại | Hộp | Nguồn đề xuất |
| --- | --- | ---: | ---: |
| ✓ `bld:chuDien:1:0` | texture cảnh | 132×92 | 644×452 |
| ✓ `bld:chuDien:2:0` | texture cảnh | 132×112 | 644×548 |
| ✓ `bld:chuDien:3:0` | texture cảnh | 196×112 | 588×336 |
| ✓ `bld:chuDien:4:0` | texture cảnh | 196×112 | 588×336 |
| ✓ `bld:danPhong:1:0` | texture cảnh | 126×78 | 616×384 |
| ✓ `bld:danPhong:2:0` | texture cảnh | 126×78 | 616×384 |
| ✓ `bld:danPhong:3:0` | texture cảnh | 126×78 | 380×236 |
| ✓ `bld:danPhong:4:0` | texture cảnh | 126×78 | 380×236 |
| ✓ `bld:dienVoTruong:1:1` | texture cảnh | 140×92 | 684×452 |
| ✓ `bld:dienVoTruong:1:3` | texture cảnh | 140×92 | 420×276 |
| ✓ `bld:dienVoTruong:2:4` | texture cảnh | 140×92 | 684×452 |
| ✓ `bld:dienVoTruong:3:6` | texture cảnh | 140×92 | 420×276 |
| ✓ `bld:dienVoTruong:4:6` | texture cảnh | 140×92 | 420×276 |
| ✓ `bld:hoSonDaiTran:1:0` | texture cảnh | 140×92 | 684×452 |
| ✓ `bld:hoSonDaiTran:2:0` | texture cảnh | 140×92 | 684×452 |
| ✓ `bld:hoSonDaiTran:3:0` | texture cảnh | 140×92 | 420×276 |
| ✓ `bld:hoSonDaiTran:4:0` | texture cảnh | 140×92 | 420×276 |
| ✓ `bld:khoangMach:1:0` | texture cảnh | 136×98 | 664×480 |
| ✓ `bld:khoangMach:2:0` | texture cảnh | 136×98 | 664×480 |
| ✓ `bld:khoangMach:3:0` | texture cảnh | 136×98 | 408×296 |
| ✓ `bld:khoangMach:4:0` | texture cảnh | 136×98 | 408×296 |
| ✓ `bld:linhDien:1:0` | texture cảnh | 144×72 | 704×352 |
| ✓ `bld:linhDien:2:0` | texture cảnh | 144×72 | 704×352 |
| ✓ `bld:linhDien:3:0` | texture cảnh | 144×72 | 432×216 |
| ✓ `bld:linhDien:4:0` | texture cảnh | 144×72 | 432×216 |
| ✓ `bld:luyenKhiPhong:1:0` | texture cảnh | 132×80 | 644×392 |
| ✓ `bld:luyenKhiPhong:3:0` | texture cảnh | 132×80 | 396×240 |
| ✓ `bld:luyenKhiPhong:4:0` | texture cảnh | 132×80 | 396×240 |
| ✓ `bld:tangBaoCac:1:0` | texture cảnh | 96×96 | 468×468 |
| ✓ `bld:tangBaoCac:2:0` | texture cảnh | 96×96 | 468×468 |
| ✓ `bld:tangBaoCac:3:0` | texture cảnh | 96×96 | 288×288 |
| ✓ `bld:tangBaoCac:4:0` | texture cảnh | 96×96 | 288×288 |
| ✓ `bld:tangKinhCac:1:0` | texture cảnh | 86×96 | 420×468 |
| ✓ `bld:tangKinhCac:2:0` | texture cảnh | 86×116 | 420×568 |
| ✓ `bld:tangKinhCac:3:0` | texture cảnh | 86×136 | 260×408 |
| ✓ `bld:tangKinhCac:4:0` | texture cảnh | 86×136 | 260×408 |
| ✓ `bld:tuLinhTran:1:0` | texture cảnh | 120×56 | 588×276 |
| ✓ `bld:tuLinhTran:2:0` | texture cảnh | 120×56 | 588×276 |
| ✓ `bld:tuLinhTran:3:0` | texture cảnh | 120×56 | 360×168 |
| ✓ `bld:tuLinhTran:4:0` | texture cảnh | 120×56 | 360×168 |
| ✓ `panel:chuDien:1` | ảnh HTML | 132×92 | 360×252 |
| ✓ `panel:chuDien:2` | ảnh HTML | 132×112 | 360×308 |
| ✓ `panel:chuDien:3` | ảnh HTML | 196×112 | 360×208 |
| ✓ `panel:danPhong:2` | ảnh HTML | 126×78 | 360×224 |
| ✓ `panel:dienVoTruong:2` | ảnh HTML | 140×92 | 360×240 |
| ✓ `panel:dienVoTruong:4` | ảnh HTML | 140×92 | 360×240 |
| ✓ `panel:hoSonDaiTran:2` | ảnh HTML | 140×92 | 360×240 |
| ✓ `panel:khoangMach:2` | ảnh HTML | 136×98 | 360×260 |
| ✓ `panel:luyenKhiPhong:4` | ảnh HTML | 132×80 | 360×220 |
| ✓ `panel:tangBaoCac:2` | ảnh HTML | 96×96 | 360×360 |
| ✓ `panel:tangBaoCac:3` | ảnh HTML | 96×96 | 360×360 |
| ✓ `panel:tangKinhCac:2` | ảnh HTML | 86×116 | 268×360 |
| ✓ `panel:tuLinhTran:2` | ảnh HTML | 120×56 | 360×168 |

## Núi, bậc đá, cầu thang

Vẽ đè giữ nguyên đường bao bản code (công trình đứng trên bậc đá).

| Key | Loại | Hộp | Nguồn đề xuất |
| --- | --- | ---: | ---: |
| `far1` | texture cảnh | 2600×154 | 3900×232 |
| `far2` | texture cảnh | 2600×124 | 3900×188 |
| ✓ `ledge:0` | texture cảnh | 309×117 | 1508×576 |
| ✓ `ledge:1` | texture cảnh | 266×108 | 1300×528 |
| ✓ `ledge:2` | texture cảnh | 259×103 | 1268×508 |
| ✓ `ledge:3` | texture cảnh | 538×119 | 2624×584 |
| ✓ `ledge:4` | texture cảnh | 358×113 | 1748×552 |
| ✓ `ledge:5` | texture cảnh | 400×123 | 1956×600 |
| ✓ `ledge:6` | texture cảnh | 230×92 | 1124×452 |
| ✓ `ledge:7` | texture cảnh | 266×90 | 1300×440 |
| ✓ `ledge:8` | texture cảnh | 312×76 | 1524×372 |
| ✓ `peak:cliff` | texture cảnh | 266×262 | 1300×1280 |
| ✓ `peak:l` | texture cảnh | 236×142 | 1152×696 |
| ✓ `peak:main` | texture cảnh | 316×202 | 1544×988 |
| ✓ `peak:r` | texture cảnh | 246×162 | 1200×792 |
| ✓ `stair:126,506` | texture cảnh | 46×104 | 228×508 |
| ✓ `stair:150,606` | texture cảnh | 49×102 | 240×500 |
| ✓ `stair:200,404` | texture cảnh | 50×100 | 244×488 |
| ✓ `stair:216,708` | texture cảnh | 49×102 | 240×500 |
| ✓ `stair:276,508` | texture cảnh | 47×100 | 232×488 |

## Đồ trang trí

Cắt từ bảng 3×3, đặt theo chân khớp khung bao bản code.

| Key | Loại | Hộp | Nguồn đề xuất |
| --- | --- | ---: | ---: |
| ✓ `bamboo:0.8:4` | texture cảnh | 29×43 | 144×212 |
| ✓ `bamboo:0.85:8` | texture cảnh | 31×46 | 152×224 |
| `bird:down` | texture cảnh | 12×8 | 60×40 |
| `bird:up` | texture cảnh | 12×8 | 60×40 |
| ✓ `blossom:0.8:7` | texture cảnh | 48×40 | 236×196 |
| ✓ `blossom:0.9:13` | texture cảnh | 54×45 | 264×220 |
| ✓ `blossom:0.95:3` | texture cảnh | 57×48 | 280×232 |
| ✓ `blossom:1:11` | texture cảnh | 60×50 | 296×244 |
| `crane:down` | texture cảnh | 44×26 | 216×128 |
| `crane:up` | texture cảnh | 44×26 | 216×128 |
| `disciple` | texture cảnh | 16×15 | 80×76 |
| `flag` | texture cảnh | 16×16 | 80×80 |
| `fly:open` | texture cảnh | 14×12 | 72×60 |
| `fly:shut` | texture cảnh | 14×12 | 72×60 |
| ✓ `lantern:0.8` | texture cảnh | 13×22 | 64×112 |
| ✓ `lantern:0.9` | texture cảnh | 14×25 | 72×124 |
| `lotus` | ảnh HTML | 40×40 | 128×128 |
| `moon` | texture cảnh | 44×44 | 216×216 |
| `pearl:1` | texture cảnh | 7×7 | 36×36 |
| `pearl:1.2` | texture cảnh | 8×8 | 44×44 |
| `pearl:1.5` | texture cảnh | 10×10 | 48×48 |
| ✓ `pine:2` | texture cảnh | 68×62 | 332×304 |
| ✓ `pine:5` | texture cảnh | 61×56 | 300×276 |
| ✓ `pine:8` | texture cảnh | 54×50 | 268×244 |
| ✓ `pine:14` | texture cảnh | 68×62 | 332×304 |
| ✓ `pine:fg1` | texture cảnh | 129×118 | 632×576 |
| ✓ `pine:fg2` | texture cảnh | 102×93 | 500×456 |
| `plot:104` | texture cảnh | 112×18 | 548×88 |
| `plot:120` | texture cảnh | 128×18 | 624×88 |
| `plot:124` | texture cảnh | 132×18 | 396×56 |
| `plot:128` | texture cảnh | 136×18 | 664×88 |
| `ring` | ảnh HTML | 48×48 | 192×192 |
| ✓ `rock:l` | texture cảnh | 122×80 | 596×392 |
| ✓ `rock:r` | texture cảnh | 102×66 | 500×324 |
| `scaffold:120:72` | texture cảnh | 116×76 | 568×376 |
| `scaffold:128:46` | texture cảnh | 123×52 | 372×156 |
| `sun` | texture cảnh | 48×48 | 236×236 |
| `walker:0` | texture cảnh | 16×15 | 80×76 |
| `walker:1` | texture cảnh | 16×15 | 80×76 |
| `worker` | texture cảnh | 16×15 | 80×76 |

## Da giao diện

9 mảnh: `slice` (px ảnh) + `width` (px CSS) trong manifest. Ảnh nguyên tấm: vân giấy, nét cọ, đĩa, công tắc.

| Key | Loại | Hộp | Nguồn đề xuất | Viền 9 mảnh (px CSS) |
| --- | --- | ---: | ---: | --- |
| ✓ `skin:badge` | da | 30×22 | 92×68 | 10 11 10 11 |
| ✓ `skin:badge-fresh` | da | 30×22 | 92×68 | 10 11 10 11 |
| `skin:blot` | da | 128×128 | 384×384 |  |
| ✓ `skin:btn` | da | 200×58 | 600×176 | 18 24 22 24 |
| ✓ `skin:btn-danger` | da | 200×58 | 600×176 | 18 24 22 24 |
| ✓ `skin:btn-ghost` | da | 200×58 | 600×176 | 18 24 22 24 |
| ✓ `skin:btn-gold` | da | 200×58 | 600×176 | 18 24 22 24 |
| ✓ `skin:btn-off` | da | 200×58 | 600×176 | 18 24 22 24 |
| ✓ `skin:capsule` | da | 120×34 | 360×104 | 13 15 13 15 |
| ✓ `skin:card` | da | 180×100 | 540×300 | 14 14 14 14 |
| ✓ `skin:card-glow` | da | 180×100 | 540×300 | 14 14 14 14 |
| ✓ `skin:card-plain` | da | 180×100 | 540×300 | 14 14 14 14 |
| ✓ `skin:card-sel` | da | 180×100 | 540×300 | 14 14 14 14 |
| ✓ `skin:card-silk` | da | 180×100 | 540×300 | 14 14 14 14 |
| ✓ `skin:disc-azure` | da | 48×48 | 144×144 | 0 0 0 0 |
| ✓ `skin:disc-gold` | da | 48×48 | 144×144 | 0 0 0 0 |
| ✓ `skin:disc-paper` | da | 48×48 | 144×144 | 0 0 0 0 |
| ✓ `skin:disc-silk` | da | 48×48 | 144×144 | 0 0 0 0 |
| `skin:dots` | da | 12×6 | 36×20 | 0 0 0 0 |
| ✓ `skin:field` | da | 100×38 | 300×116 | 8 10 10 10 |
| ✓ `skin:fill` | da | 120×12 | 360×36 | 5 7 5 6 |
| ✓ `skin:fill-azure` | da | 120×12 | 360×36 | 5 7 5 6 |
| ✓ `skin:fill-bad` | da | 120×12 | 360×36 | 5 7 5 6 |
| ✓ `skin:fill-gold` | da | 120×12 | 360×36 | 5 7 5 6 |
| ✓ `skin:fill-good` | da | 120×12 | 360×36 | 5 7 5 6 |
| ✓ `skin:groove` | da | 200×44 | 600×132 | 12 12 12 12 |
| ✓ `skin:knob` | da | 26×26 | 80×80 | 0 0 0 0 |
| `skin:paper` | da | 128×128 | 384×384 |  |
| ✓ `skin:plate` | da | 120×30 | 360×92 | 12 14 12 14 |
| ✓ `skin:rod` | da | 240×22 | 720×68 | 0 22 0 22 |
| ✓ `skin:scroll` | da | 144×144 | 432×432 | 24 24 24 24 |
| ✓ `skin:slip` | da | 240×44 | 720×132 | 12 22 13 22 |
| ✓ `skin:slip-bad` | da | 240×44 | 720×132 | 12 22 13 22 |
| ✓ `skin:strip` | da | 124×124 | 372×372 | 14 14 14 14 |
| `skin:stroke` | da | 160×14 | 480×44 |  |
| `skin:stroke-gold` | da | 160×14 | 480×44 |  |
| `skin:stroke-red` | da | 160×14 | 480×44 |  |
| ✓ `skin:switch` | da | 54×30 | 164×92 | 0 0 0 0 |
| ✓ `skin:switch-on` | da | 54×30 | 164×92 | 0 0 0 0 |
| ✓ `skin:tag` | da | 72×28 | 216×84 | 9 10 9 10 |
| ✓ `skin:tag-bad` | da | 72×28 | 216×84 | 9 10 9 10 |
| ✓ `skin:tag-dark` | da | 72×28 | 216×84 | 9 10 9 10 |
| ✓ `skin:tag-gold` | da | 72×28 | 216×84 | 9 10 9 10 |
| ✓ `skin:tag-good` | da | 72×28 | 216×84 | 9 10 9 10 |
| ✓ `skin:tag-red` | da | 72×28 | 216×84 | 9 10 9 10 |
| ✓ `skin:tag-silk` | da | 72×28 | 216×84 | 9 10 9 10 |
| ✓ `skin:toast` | da | 260×48 | 780×144 | 14 34 14 34 |
| ✓ `skin:toast-bad` | da | 260×48 | 780×144 | 14 34 14 34 |
| ✓ `skin:track` | da | 120×12 | 360×36 | 5 6 5 6 |

## Icon màu

Vật phẩm, tài nguyên, đan, pháp bảo, phù.

| Key | Loại | Hộp | Nguồn đề xuất |
| --- | --- | ---: | ---: |
| ✓ `icon:boiNguyen` | ảnh HTML | 24×24 | 132×132 |
| ✓ `icon:bolt` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:cauldron` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:chienY` | ảnh HTML | 24×24 | 144×144 |
| ✓ `icon:daiTuKhi` | ảnh HTML | 24×24 | 132×132 |
| ✓ `icon:dieuThu` | ảnh HTML | 24×24 | 144×144 |
| ✓ `icon:doKiep` | ảnh HTML | 24×24 | 132×132 |
| ✓ `icon:flag` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:heal` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:hoiXuan` | ảnh HTML | 24×24 | 132×132 |
| ✓ `icon:hoSon` | ảnh HTML | 24×24 | 144×144 |
| ✓ `icon:hoTam` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:huyenVu` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:khoangNang` | ảnh HTML | 24×24 | 144×144 |
| ✓ `icon:kimCang` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:kimCuong` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:kimDuyen` | ảnh HTML | 24×24 | 168×168 |
| ✓ `icon:kinhThu` | ảnh HTML | 24×24 | 144×144 |
| ✓ `icon:linhKhoang` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:linhThach` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:linhThao` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:loBan` | ảnh HTML | 24×24 | 144×144 |
| ✓ `icon:luyenBinh` | ảnh HTML | 24×24 | 144×144 |
| ✓ `icon:nganDuyen` | ảnh HTML | 24×24 | 168×168 |
| ✓ `icon:ngocGian` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:ngoDao` | ảnh HTML | 24×24 | 144×144 |
| ✓ `icon:ngungThan` | ảnh HTML | 24×24 | 132×132 |
| ✓ `icon:phaCanh` | ảnh HTML | 24×24 | 132×132 |
| ✓ `icon:scroll` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:shield` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:star` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:taiTuy` | ảnh HTML | 24×24 | 132×132 |
| ✓ `icon:tapDich` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:thachNang` | ảnh HTML | 24×24 | 144×144 |
| ✓ `icon:thanHanh` | ảnh HTML | 24×24 | 144×144 |
| ✓ `icon:thanhSuong` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:thaoNang` | ảnh HTML | 24×24 | 144×144 |
| ✓ `icon:thienLoi` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:thoiQuang` | ảnh HTML | 24×24 | 144×144 |
| ✓ `icon:tiLoi` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:tuBao` | ảnh HTML | 24×24 | 128×128 |
| ✓ `icon:tuKhi` | ảnh HTML | 24×24 | 132×132 |
| ✓ `icon:tuLinh` | ảnh HTML | 24×24 | 144×144 |
| ✓ `icon:xichViem` | ảnh HTML | 24×24 | 128×128 |

## Icon thao tác đơn sắc

Game chỉ lấy alpha, tô bằng màu chữ nơi đặt.

| Key | Loại | Hộp | Nguồn đề xuất |
| --- | --- | ---: | ---: |
| `mask:arrow` | ảnh HTML | 24×24 | 128×128 |
| `mask:back` | ảnh HTML | 24×24 | 128×128 |
| `mask:check` | ảnh HTML | 24×24 | 128×128 |
| `mask:clock` | ảnh HTML | 24×24 | 128×128 |
| `mask:close` | ảnh HTML | 24×24 | 128×128 |
| `mask:cross` | ảnh HTML | 24×24 | 128×128 |
| `mask:download` | ảnh HTML | 24×24 | 128×128 |
| `mask:gear` | ảnh HTML | 24×24 | 128×128 |
| `mask:globe` | ảnh HTML | 24×24 | 128×128 |
| `mask:hammer` | ảnh HTML | 24×24 | 128×128 |
| `mask:lock` | ảnh HTML | 24×24 | 128×128 |
| `mask:mail` | ảnh HTML | 24×24 | 128×128 |
| `mask:minus` | ảnh HTML | 24×24 | 128×128 |
| `mask:music` | ảnh HTML | 24×24 | 128×128 |
| `mask:people` | ảnh HTML | 24×24 | 128×128 |
| `mask:plus` | ảnh HTML | 24×24 | 128×128 |
| `mask:power` | ảnh HTML | 24×24 | 128×128 |
| `mask:rank` | ảnh HTML | 24×24 | 128×128 |
| `mask:skull` | ảnh HTML | 24×24 | 128×128 |
| `mask:sound` | ảnh HTML | 24×24 | 128×128 |
| `mask:swords` | ảnh HTML | 24×24 | 128×128 |
| `mask:upload` | ảnh HTML | 24×24 | 128×128 |

## Icon thanh điều hướng

5 thẻ dưới màn hình, tay chỉ hướng dẫn.

| Key | Loại | Hộp | Nguồn đề xuất |
| --- | --- | ---: | ---: |
| ✓ `pointer` | ảnh HTML | 24×31 | 100×128 |
| ✓ `tab:banDo` | ảnh HTML | 40×40 | 132×132 |
| ✓ `tab:baoKho` | ảnh HTML | 40×40 | 132×132 |
| ✓ `tab:monHa` | ảnh HTML | 40×40 | 132×132 |
| ✓ `tab:tienMinh` | ảnh HTML | 40×40 | 132×132 |
| ✓ `tab:tongMon` | ảnh HTML | 40×40 | 132×132 |

## Huy hiệu

`medal:<hình chạm>:<tông>`. Chỉ vẽ hình chạm (`emblem:<tên>`), đĩa màu vẽ bằng code theo tông → mọi tổ hợp.

| Key | Loại | Hộp | Nguồn đề xuất |
| --- | --- | ---: | ---: |
| `medal:ape:beast` | ảnh HTML | 48×48 | 144×144 |
| `medal:bear:beast` | ảnh HTML | 48×48 | 128×128 |
| `medal:blood:sect` | ảnh HTML | 48×48 | 128×128 |
| `medal:chaos:realm` | ảnh HTML | 48×48 | 128×128 |
| `medal:crest:gold` | ảnh HTML | 48×48 | 312×312 |
| `medal:crest:ink` | ảnh HTML | 48×48 | 192×192 |
| `medal:crest:pvp` | ảnh HTML | 48×48 | 192×192 |
| `medal:demon:sect` | ảnh HTML | 48×48 | 128×128 |
| `medal:dragon:beast` | ảnh HTML | 48×48 | 128×128 |
| `medal:eagle:beast` | ảnh HTML | 48×48 | 128×128 |
| `medal:fire:realm` | ảnh HTML | 48×48 | 128×128 |
| `medal:fist:the` | ảnh HTML | 48×48 | 128×128 |
| `medal:fox:beast` | ảnh HTML | 48×48 | 128×128 |
| `medal:ghost:sect` | ảnh HTML | 48×48 | 128×128 |
| `medal:hawk:beast` | ảnh HTML | 48×48 | 128×128 |
| `medal:ice:realm` | ảnh HTML | 48×48 | 128×128 |
| `medal:leopard:beast` | ảnh HTML | 48×48 | 128×128 |
| `medal:lotus:jade` | ảnh HTML | 48×48 | 348×348 |
| `medal:nineFox:beast` | ảnh HTML | 48×48 | 128×128 |
| `medal:orb:phap` | ảnh HTML | 48×48 | 128×128 |
| `medal:phoenix:beast` | ảnh HTML | 48×48 | 128×128 |
| `medal:poison:sect` | ảnh HTML | 48×48 | 128×128 |
| `medal:rhino:beast` | ảnh HTML | 48×48 | 128×128 |
| `medal:snake:beast` | ảnh HTML | 48×48 | 128×128 |
| `medal:sword:kiem` | ảnh HTML | 48×48 | 128×128 |
| `medal:thunder:thunder` | ảnh HTML | 48×48 | 128×128 |
| `medal:thunderPool:realm` | ảnh HTML | 48×48 | 128×128 |
| `medal:tiger:beast` | ảnh HTML | 48×48 | 128×128 |
| `medal:tower:tower` | ảnh HTML | 48×48 | 128×128 |
| `medal:turtle:beast` | ảnh HTML | 48×48 | 128×128 |
| `medal:win:red` | ảnh HTML | 48×48 | 420×420 |
| `medal:wind:sect` | ảnh HTML | 48×48 | 128×128 |
| `medal:windWolf:beast` | ảnh HTML | 48×48 | 128×128 |
| `medal:wolf:beast` | ảnh HTML | 48×48 | 192×192 |
| `medal:wood:realm` | ảnh HTML | 48×48 | 128×128 |
| `wmark:ape:beast` | texture cảnh | 48×48 | 128×128 |
| `wmark:bear:beast` | texture cảnh | 48×48 | 128×128 |
| `wmark:blood:ink` | texture cảnh | 48×48 | 128×128 |
| `wmark:blood:red` | texture cảnh | 48×48 | 128×128 |
| `wmark:chaos:realm` | texture cảnh | 48×48 | 128×128 |
| `wmark:crest:gold` | texture cảnh | 48×48 | 128×128 |
| `wmark:crest:red` | texture cảnh | 48×48 | 128×128 |
| `wmark:demon:ink` | texture cảnh | 48×48 | 128×128 |
| `wmark:dragon:beast` | texture cảnh | 48×48 | 128×128 |
| `wmark:eagle:beast` | texture cảnh | 48×48 | 128×128 |
| `wmark:earth:gold` | texture cảnh | 48×48 | 128×128 |
| `wmark:fox:beast` | texture cảnh | 48×48 | 128×128 |
| `wmark:ghost:ink` | texture cảnh | 48×48 | 128×128 |
| `wmark:ghost:realm` | texture cảnh | 48×48 | 128×128 |
| `wmark:hawk:beast` | texture cảnh | 48×48 | 128×128 |
| `wmark:leopard:beast` | texture cảnh | 48×48 | 128×128 |
| `wmark:lotus:jade` | texture cảnh | 48×48 | 128×128 |
| `wmark:lotus:realm` | texture cảnh | 48×48 | 128×128 |
| `wmark:nineFox:beast` | texture cảnh | 48×48 | 128×128 |
| `wmark:phoenix:beast` | texture cảnh | 48×48 | 128×128 |
| `wmark:poison:ink` | texture cảnh | 48×48 | 128×128 |
| `wmark:rebirth:gold` | texture cảnh | 48×48 | 128×128 |
| `wmark:rhino:beast` | texture cảnh | 48×48 | 128×128 |
| `wmark:snake:beast` | texture cảnh | 48×48 | 128×128 |
| `wmark:tiger:beast` | texture cảnh | 48×48 | 128×128 |
| `wmark:tower:ink` | texture cảnh | 48×48 | 128×128 |
| `wmark:turtle:beast` | texture cảnh | 48×48 | 128×128 |
| `wmark:wind:ink` | texture cảnh | 48×48 | 128×128 |
| `wmark:windWolf:beast` | texture cảnh | 48×48 | 128×128 |
| `wmark:wolf:beast` | texture cảnh | 48×48 | 128×128 |
| `wmark:wood:gold` | texture cảnh | 48×48 | 128×128 |

## Bản đồ

Nền bản đồ vùng (vẽ đè), tông môn trên bản đồ, quân hành quân.

| Key | Loại | Hộp | Nguồn đề xuất |
| --- | --- | ---: | ---: |
| `map` | texture cảnh | 400×1000 | 1800×4500 |
| `map:home` | texture cảnh | 132×92 | 596×416 |
| `march` | texture cảnh | 20×21 | 92×96 |
| `wtoken` | texture cảnh | 20×21 | 92×96 |

## Chiến trường

Quân `sold:<hệ>:<phe>:<bậc>`; yêu thú một dáng xám mỗi hệ (`beast:<hệ>`, tint theo loài); sân `field:<cảnh>`.

| Key | Loại | Hộp | Nguồn đề xuất |
| --- | --- | ---: | ---: |
| `beast:kiem:#a8784a` | texture cảnh | 60×32 | 180×96 |
| `beast:the:#a8784a` | texture cảnh | 60×32 | 180×96 |
| `field:wild:400x866` | texture cảnh | 400×866 | 1200×2600 |
| `item:linhKhoang` | texture cảnh | 24×24 | 72×72 |
| `item:linhThach` | texture cảnh | 24×24 | 72×72 |
| `item:linhThao` | texture cảnh | 24×24 | 72×72 |
| `sold:kiem:0:3` | texture cảnh | 24×26 | 72×80 |
| `sold:the:0:3` | texture cảnh | 24×26 | 72×80 |

## Hiệu ứng (giữ vẽ bằng code)

Sinh theo hạt ngẫu nhiên, không cần vẽ tay.

- `cloud:…` — 3 biến thể
- `fog:…` — 15 biến thể
- `radiance:…` — 1 biến thể
