# Danh sách tranh cần vẽ

Mọi hình trong game hiện vẽ bằng code (`packages/art`). Mỗi hình có một **key**; thả file tranh vào `apps/client/public/art/` và thêm một dòng vào `manifest.json` là game dùng tranh thay cho bản vẽ code, không phải sửa màn nào. Key chưa có tranh thì vẫn vẽ bằng code như cũ.

```json
{
  "bld:chuDien:1:0": { "src": "bld/chuDien-1.webp" },
  "icon:linhThach": { "src": "icon/linhThach.webp" },
  "skin:btn": { "src": "skin/btn.png", "slice": [36, 42, 36, 42], "width": [12, 14, 12, 14] }
}
```

- **Hộp**: khung của hình theo đơn vị vẽ (DU, ≈ 1 px CSS trên điện thoại). Tranh phải giữ đúng tỉ lệ hộp; texture cảnh giữ cả điểm neo (chân công trình, gốc cây) như bản code.
- **Nguồn đề xuất**: cỡ file tối thiểu để nét trên màn 3x. WebP cho tranh, PNG cho da 9 mảnh.
- Mở game với `?art=0` để tắt toàn bộ tranh và so với bản vẽ code.
- Bảng này gom từ lượt chụp 63 màn (commit f72efc9); hình chỉ hiện ở màn chưa chụp thì chưa có trong bảng.

**324 hình cần vẽ** (không tính hiệu ứng), **đã có tranh 193/324 (60%)**:

| Nhóm | Số hình | Đã có tranh | Giai đoạn |
| --- | ---: | ---: | --- |
| Chân dung | 13 | 13 | GĐ 0 + 4 |
| Công trình | 53 | 53 | GĐ 0 + 3 |
| Cảnh núi và vật trang trí | 60 | 34 | GĐ 0 + 3 |
| Da giao diện 9 mảnh | 49 | 43 | GĐ 1 |
| Icon màu | 44 | 44 | GĐ 2 |
| Icon thao tác đơn sắc | 22 | 0 | GĐ 2 |
| Icon thanh điều hướng | 6 | 6 | GĐ 2 |
| Huy hiệu tông môn và tiên minh | 65 | 0 | GĐ 2 |
| Bản đồ | 4 | 0 | GĐ 3 |
| Chiến trường | 8 | 0 | GĐ 3 + 4 |
| Hiệu ứng (giữ vẽ bằng code) | 19 | — | — |

## Chân dung

Bán thân, nhìn thẳng, nền trong. Key theo mã trưởng lão (`face:<mã>`), `face:master` là chưởng môn.

| Key | Loại | Hộp | Nguồn đề xuất | Màn |
| --- | --- | ---: | ---: | --- |
| ✓ `face:bachVoNhai` | ảnh HTML | 48×48 | 156×156 | Disciples, Elder, Vault +10 |
| ✓ `face:diepCoThanh` | ảnh HTML | 48×48 | 156×156 | Disciples, Elder, Vault +10 |
| ✓ `face:hanBang` | ảnh HTML | 48×48 | 156×156 | Disciples, Elder, Vault +11 |
| ✓ `face:hoacThienCuong` | ảnh HTML | 48×48 | 156×156 | Disciples, Elder, Vault +10 |
| ✓ `face:huyenMinh` | ảnh HTML | 48×48 | 156×156 | Disciples, Elder, Vault +10 |
| ✓ `face:loiChan` | ảnh HTML | 48×48 | 156×156 | Disciples, Elder, Vault +11 |
| ✓ `face:macSau` | ảnh HTML | 48×48 | 156×156 | Disciples, Elder, Vault +10 |
| ✓ `face:master` | ảnh HTML | 48×48 | 156×156 | Daily, Settings, Reports +57 |
| ✓ `face:nhuYen` | ảnh HTML | 48×48 | 156×156 | PanelGuard, Target, Rivals +21 |
| ✓ `face:thachKien` | ảnh HTML | 48×48 | 156×156 | PanelGuard, Replay, ReplayResult +26 |
| ✓ `face:thanhPhong` | ảnh HTML | 48×48 | 252×252 | Daily, Settings, Reports +54 |
| ✓ `face:toMiNuong` | ảnh HTML | 48×48 | 156×156 | Disciples, Elder, Vault +10 |
| ✓ `face:vanHac` | ảnh HTML | 48×48 | 156×156 | Disciples, Elder, Vault +16 |

## Công trình

`bld:<mã>:<bậc>:<biến thể>` trên núi; `panel:<mã>:<bậc>` là cùng công trình ở đầu bảng chi tiết — trỏ cùng một file tranh. Vẽ khít hộp, chân công trình chạm đáy hộp như bản vẽ code (xem trang Art trên canvas).

| Key | Loại | Hộp | Nguồn đề xuất | Màn |
| --- | --- | ---: | ---: | --- |
| ✓ `bld:chuDien:1:0` | texture cảnh | 132×92 | 644×452 | Daily, Settings, Reports +60 |
| ✓ `bld:chuDien:2:0` | texture cảnh | 132×112 | 644×548 | Daily, Settings, Reports +28 |
| ✓ `bld:chuDien:3:0` | texture cảnh | 196×112 | 588×336 | PanelRebirth, DisciplesLate, AllianceIn +15 |
| ✓ `bld:chuDien:4:0` | texture cảnh | 196×112 | 588×336 | PanelForge, ElderHigh, HomeHigh +4 |
| ✓ `bld:danPhong:1:0` | texture cảnh | 126×78 | 616×384 | Daily, Settings, Reports +60 |
| ✓ `bld:danPhong:2:0` | texture cảnh | 126×78 | 616×384 | Daily, Settings, Reports +27 |
| ✓ `bld:danPhong:3:0` | texture cảnh | 126×78 | 380×236 | PanelRebirth, DisciplesLate, AllianceIn +15 |
| ✓ `bld:danPhong:4:0` | texture cảnh | 126×78 | 380×236 | PanelForge, ElderHigh, HomeHigh +4 |
| ✓ `bld:dienVoTruong:1:1` | texture cảnh | 140×92 | 684×452 | Daily, Settings, Reports +60 |
| ✓ `bld:dienVoTruong:1:3` | texture cảnh | 140×92 | 420×276 | PanelTrib, Cloud, PanelCloud +2 |
| ✓ `bld:dienVoTruong:2:4` | texture cảnh | 140×92 | 684×452 | Daily, Settings, Reports +27 |
| ✓ `bld:dienVoTruong:3:6` | texture cảnh | 140×92 | 420×276 | PanelRebirth, DisciplesLate, AllianceIn +15 |
| ✓ `bld:dienVoTruong:4:6` | texture cảnh | 140×92 | 420×276 | PanelForge, ElderHigh, HomeHigh +4 |
| ✓ `bld:hoSonDaiTran:1:0` | texture cảnh | 140×92 | 684×452 | Daily, Settings, Reports +60 |
| ✓ `bld:hoSonDaiTran:2:0` | texture cảnh | 140×92 | 684×452 | Daily, Settings, Reports +27 |
| ✓ `bld:hoSonDaiTran:3:0` | texture cảnh | 140×92 | 420×276 | PanelRebirth, DisciplesLate, AllianceIn +15 |
| ✓ `bld:hoSonDaiTran:4:0` | texture cảnh | 140×92 | 420×276 | PanelForge, ElderHigh, HomeHigh +4 |
| ✓ `bld:khoangMach:1:0` | texture cảnh | 136×98 | 664×480 | Daily, Settings, Reports +60 |
| ✓ `bld:khoangMach:2:0` | texture cảnh | 136×98 | 664×480 | Daily, Settings, Reports +27 |
| ✓ `bld:khoangMach:3:0` | texture cảnh | 136×98 | 408×296 | PanelRebirth, DisciplesLate, AllianceIn +15 |
| ✓ `bld:khoangMach:4:0` | texture cảnh | 136×98 | 408×296 | PanelForge, ElderHigh, HomeHigh +4 |
| ✓ `bld:linhDien:1:0` | texture cảnh | 144×72 | 704×352 | Daily, Settings, Reports +60 |
| ✓ `bld:linhDien:2:0` | texture cảnh | 144×72 | 704×352 | Daily, Settings, Reports +27 |
| ✓ `bld:linhDien:3:0` | texture cảnh | 144×72 | 432×216 | PanelRebirth, DisciplesLate, AllianceIn +15 |
| ✓ `bld:linhDien:4:0` | texture cảnh | 144×72 | 432×216 | PanelForge, ElderHigh, HomeHigh +4 |
| ✓ `bld:luyenKhiPhong:1:0` | texture cảnh | 132×80 | 644×392 | Daily, Settings, Reports +60 |
| ✓ `bld:luyenKhiPhong:3:0` | texture cảnh | 132×80 | 396×240 | PanelRebirth, DisciplesLate, AllianceIn +15 |
| ✓ `bld:luyenKhiPhong:4:0` | texture cảnh | 132×80 | 396×240 | PanelForge, ElderHigh, HomeHigh +4 |
| ✓ `bld:tangBaoCac:1:0` | texture cảnh | 96×96 | 468×468 | Daily, Settings, Reports +60 |
| ✓ `bld:tangBaoCac:2:0` | texture cảnh | 96×96 | 468×468 | Daily, Settings, Reports +27 |
| ✓ `bld:tangBaoCac:3:0` | texture cảnh | 96×96 | 288×288 | PanelRebirth, DisciplesLate, AllianceIn +15 |
| ✓ `bld:tangBaoCac:4:0` | texture cảnh | 96×96 | 288×288 | PanelForge, ElderHigh, HomeHigh +4 |
| ✓ `bld:tangKinhCac:1:0` | texture cảnh | 86×96 | 420×468 | Daily, Settings, Reports +60 |
| ✓ `bld:tangKinhCac:2:0` | texture cảnh | 86×116 | 420×568 | Daily, Settings, Reports +27 |
| ✓ `bld:tangKinhCac:3:0` | texture cảnh | 86×136 | 260×408 | PanelRebirth, DisciplesLate, AllianceIn +15 |
| ✓ `bld:tangKinhCac:4:0` | texture cảnh | 86×136 | 260×408 | PanelForge, ElderHigh, HomeHigh +4 |
| ✓ `bld:tuLinhTran:1:0` | texture cảnh | 120×56 | 588×276 | Daily, Settings, Reports +60 |
| ✓ `bld:tuLinhTran:2:0` | texture cảnh | 120×56 | 588×276 | Daily, Settings, Reports +27 |
| ✓ `bld:tuLinhTran:3:0` | texture cảnh | 120×56 | 360×168 | PanelRebirth, DisciplesLate, AllianceIn +15 |
| ✓ `bld:tuLinhTran:4:0` | texture cảnh | 120×56 | 360×168 | PanelForge, ElderHigh, HomeHigh +4 |
| ✓ `panel:chuDien:1` | ảnh HTML | 132×92 | 360×252 | PanelTrib, Cloud, PanelCloud +2 |
| ✓ `panel:chuDien:2` | ảnh HTML | 132×112 | 360×308 | PanelHall, PanelMine, PanelTrain +8 |
| ✓ `panel:chuDien:3` | ảnh HTML | 196×112 | 360×208 | PanelRebirth, DisciplesLate, AllianceIn +3 |
| ✓ `panel:danPhong:2` | ảnh HTML | 126×78 | 360×224 | PanelAlchemy, PanelLibrary, PanelTrade +1 |
| ✓ `panel:dienVoTruong:2` | ảnh HTML | 140×92 | 360×240 | PanelTrain, PanelAlchemy, PanelLibrary +2 |
| ✓ `panel:dienVoTruong:4` | ảnh HTML | 140×92 | 360×240 | SpeedUp |
| ✓ `panel:hoSonDaiTran:2` | ảnh HTML | 140×92 | 360×240 | PanelGuard |
| ✓ `panel:khoangMach:2` | ảnh HTML | 136×98 | 360×260 | PanelMine, PanelTrain, PanelAlchemy +3 |
| ✓ `panel:luyenKhiPhong:4` | ảnh HTML | 132×80 | 360×220 | PanelForge, ElderHigh, HomeHigh |
| ✓ `panel:tangBaoCac:2` | ảnh HTML | 96×96 | 360×360 | PanelTrade, PanelGuard |
| ✓ `panel:tangBaoCac:3` | ảnh HTML | 96×96 | 360×360 | Merchant, Market |
| ✓ `panel:tangKinhCac:2` | ảnh HTML | 86×116 | 268×360 | PanelLibrary, PanelTrade, PanelGuard |
| ✓ `panel:tuLinhTran:2` | ảnh HTML | 120×56 | 360×168 | Refill |

## Cảnh núi và vật trang trí

Nền núi, bậc đá, cây, người đi lại. Giữ hộp và điểm neo như bản code.

| Key | Loại | Hộp | Nguồn đề xuất | Màn |
| --- | --- | ---: | ---: | --- |
| ✓ `bamboo:0.8:4` | texture cảnh | 29×43 | 144×212 | Daily, Settings, Reports +60 |
| ✓ `bamboo:0.85:8` | texture cảnh | 31×46 | 152×224 | Daily, Settings, Reports +60 |
| `bird:down` | texture cảnh | 12×8 | 60×40 | Daily, Settings, Reports +60 |
| `bird:up` | texture cảnh | 12×8 | 60×40 | Daily, Settings, Reports +60 |
| ✓ `blossom:0.8:7` | texture cảnh | 48×40 | 236×196 | Daily, Settings, Reports +60 |
| ✓ `blossom:0.9:13` | texture cảnh | 54×45 | 264×220 | Daily, Settings, Reports +60 |
| ✓ `blossom:0.95:3` | texture cảnh | 57×48 | 280×232 | Daily, Settings, Reports +60 |
| ✓ `blossom:1:11` | texture cảnh | 60×50 | 296×244 | Daily, Settings, Reports +60 |
| `crane:down` | texture cảnh | 44×26 | 216×128 | Daily, Settings, Reports +60 |
| `crane:up` | texture cảnh | 44×26 | 216×128 | Daily, Settings, Reports +60 |
| `disciple` | texture cảnh | 16×15 | 80×76 | Daily, Settings, Reports +56 |
| `far1` | texture cảnh | 2600×154 | 3900×232 | Daily, Settings, Reports +60 |
| `far2` | texture cảnh | 2600×124 | 3900×188 | Daily, Settings, Reports +60 |
| `flag` | texture cảnh | 16×16 | 80×80 | Daily, Settings, Reports +56 |
| `fly:open` | texture cảnh | 14×12 | 72×60 | Daily, Settings, Reports +60 |
| `fly:shut` | texture cảnh | 14×12 | 72×60 | Daily, Settings, Reports +60 |
| ✓ `lantern:0.8` | texture cảnh | 13×22 | 64×112 | Daily, Settings, Reports +60 |
| ✓ `lantern:0.9` | texture cảnh | 14×25 | 72×124 | Daily, Settings, Reports +60 |
| ✓ `ledge:0` | texture cảnh | 309×117 | 1508×576 | Daily, Settings, Reports +60 |
| ✓ `ledge:1` | texture cảnh | 266×108 | 1300×528 | Daily, Settings, Reports +60 |
| ✓ `ledge:2` | texture cảnh | 259×103 | 1268×508 | Daily, Settings, Reports +60 |
| ✓ `ledge:3` | texture cảnh | 538×119 | 2624×584 | Daily, Settings, Reports +60 |
| ✓ `ledge:4` | texture cảnh | 358×113 | 1748×552 | Daily, Settings, Reports +60 |
| ✓ `ledge:5` | texture cảnh | 400×123 | 1956×600 | Daily, Settings, Reports +60 |
| ✓ `ledge:6` | texture cảnh | 230×92 | 1124×452 | Daily, Settings, Reports +60 |
| ✓ `ledge:7` | texture cảnh | 266×90 | 1300×440 | Daily, Settings, Reports +60 |
| ✓ `ledge:8` | texture cảnh | 312×76 | 1524×372 | Daily, Settings, Reports +60 |
| `lotus` | ảnh HTML | 40×40 | 128×128 | Daily, Settings, Reports +57 |
| `moon` | texture cảnh | 44×44 | 216×216 | Daily, Settings, Reports +60 |
| ✓ `peak:cliff` | texture cảnh | 266×262 | 1300×1280 | Daily, Settings, Reports +60 |
| ✓ `peak:l` | texture cảnh | 236×142 | 1152×696 | Daily, Settings, Reports +60 |
| ✓ `peak:main` | texture cảnh | 316×202 | 1544×988 | Daily, Settings, Reports +60 |
| ✓ `peak:r` | texture cảnh | 246×162 | 1200×792 | Daily, Settings, Reports +60 |
| `pearl:1` | texture cảnh | 7×7 | 36×36 | Daily, Settings, Reports +56 |
| `pearl:1.2` | texture cảnh | 8×8 | 44×44 | Daily, Settings, Reports +51 |
| `pearl:1.5` | texture cảnh | 10×10 | 48×48 | Daily, Settings, Reports +56 |
| ✓ `pine:2` | texture cảnh | 68×62 | 332×304 | Daily, Settings, Reports +60 |
| ✓ `pine:5` | texture cảnh | 61×56 | 300×276 | Daily, Settings, Reports +60 |
| ✓ `pine:8` | texture cảnh | 54×50 | 268×244 | Daily, Settings, Reports +60 |
| ✓ `pine:14` | texture cảnh | 68×62 | 332×304 | Daily, Settings, Reports +60 |
| ✓ `pine:fg1` | texture cảnh | 129×118 | 632×576 | Daily, Settings, Reports +60 |
| ✓ `pine:fg2` | texture cảnh | 102×93 | 500×456 | Daily, Settings, Reports +60 |
| `plot:104` | texture cảnh | 112×18 | 548×88 | Daily, Settings, Reports +60 |
| `plot:120` | texture cảnh | 128×18 | 624×88 | Daily, Settings, Reports +60 |
| `plot:124` | texture cảnh | 132×18 | 396×56 | TribResult |
| `plot:128` | texture cảnh | 136×18 | 664×88 | Daily, Settings, Reports +60 |
| `ring` | ảnh HTML | 48×48 | 192×192 | Daily, Settings, Reports +57 |
| ✓ `rock:l` | texture cảnh | 122×80 | 596×392 | Daily, Settings, Reports +60 |
| ✓ `rock:r` | texture cảnh | 102×66 | 500×324 | Daily, Settings, Reports +60 |
| `scaffold:120:72` | texture cảnh | 116×76 | 568×376 | Daily, Settings, Reports +26 |
| `scaffold:128:46` | texture cảnh | 123×52 | 372×156 | PanelForge, ElderHigh, HomeHigh +4 |
| ✓ `stair:126,506` | texture cảnh | 46×104 | 228×508 | Daily, Settings, Reports +60 |
| ✓ `stair:150,606` | texture cảnh | 49×102 | 240×500 | Daily, Settings, Reports +60 |
| ✓ `stair:200,404` | texture cảnh | 50×100 | 244×488 | Daily, Settings, Reports +60 |
| ✓ `stair:216,708` | texture cảnh | 49×102 | 240×500 | Daily, Settings, Reports +60 |
| ✓ `stair:276,508` | texture cảnh | 47×100 | 232×488 | Daily, Settings, Reports +60 |
| `sun` | texture cảnh | 48×48 | 236×236 | Daily, Settings, Reports +60 |
| `walker:0` | texture cảnh | 16×15 | 80×76 | Daily, Settings, Reports +60 |
| `walker:1` | texture cảnh | 16×15 | 80×76 | Daily, Settings, Reports +60 |
| `worker` | texture cảnh | 16×15 | 80×76 | Daily, Settings, Reports +32 |

## Da giao diện 9 mảnh

Khung, nút, thẻ, thanh. Vẽ ở 3x; `slice` trong manifest tính theo px ảnh (= viền × 3), khai `width` = viền (px CSS).

| Key | Loại | Hộp | Nguồn đề xuất | Viền 9 mảnh (px CSS) | Màn |
| --- | --- | ---: | ---: | --- | --- |
| ✓ `skin:badge` | da 9 mảnh | 30×22 | 92×68 | 10 11 10 11 | Daily, Settings, Reports +60 |
| ✓ `skin:badge-fresh` | da 9 mảnh | 30×22 | 92×68 | 10 11 10 11 | Daily, Settings, Reports +60 |
| `skin:blot` | da 9 mảnh | 128×128 | 384×384 |  | Daily, Settings, Reports +60 |
| ✓ `skin:btn` | da 9 mảnh | 200×58 | 600×176 | 18 24 22 24 | Daily, Settings, Reports +60 |
| ✓ `skin:btn-danger` | da 9 mảnh | 200×58 | 600×176 | 18 24 22 24 | Daily, Settings, Reports +60 |
| ✓ `skin:btn-ghost` | da 9 mảnh | 200×58 | 600×176 | 18 24 22 24 | Daily, Settings, Reports +60 |
| ✓ `skin:btn-gold` | da 9 mảnh | 200×58 | 600×176 | 18 24 22 24 | Daily, Settings, Reports +60 |
| ✓ `skin:btn-off` | da 9 mảnh | 200×58 | 600×176 | 18 24 22 24 | Daily, Settings, Reports +60 |
| ✓ `skin:capsule` | da 9 mảnh | 120×34 | 360×104 | 13 15 13 15 | Daily, Settings, Reports +60 |
| ✓ `skin:card` | da 9 mảnh | 180×100 | 540×300 | 14 14 14 14 | Daily, Settings, Reports +60 |
| ✓ `skin:card-glow` | da 9 mảnh | 180×100 | 540×300 | 14 14 14 14 | Daily, Settings, Reports +60 |
| ✓ `skin:card-plain` | da 9 mảnh | 180×100 | 540×300 | 14 14 14 14 | Daily, Settings, Reports +60 |
| ✓ `skin:card-sel` | da 9 mảnh | 180×100 | 540×300 | 14 14 14 14 | Daily, Settings, Reports +60 |
| ✓ `skin:card-silk` | da 9 mảnh | 180×100 | 540×300 | 14 14 14 14 | Daily, Settings, Reports +60 |
| ✓ `skin:disc-azure` | da 9 mảnh | 48×48 | 144×144 | 0 0 0 0 | Daily, Settings, Reports +60 |
| ✓ `skin:disc-gold` | da 9 mảnh | 48×48 | 144×144 | 0 0 0 0 | Daily, Settings, Reports +60 |
| ✓ `skin:disc-paper` | da 9 mảnh | 48×48 | 144×144 | 0 0 0 0 | Daily, Settings, Reports +60 |
| ✓ `skin:disc-silk` | da 9 mảnh | 48×48 | 144×144 | 0 0 0 0 | Daily, Settings, Reports +60 |
| `skin:dots` | da 9 mảnh | 12×6 | 36×20 | 0 0 0 0 | Daily, Settings, Reports +60 |
| ✓ `skin:field` | da 9 mảnh | 100×38 | 300×116 | 8 10 10 10 | Daily, Settings, Reports +60 |
| ✓ `skin:fill` | da 9 mảnh | 120×12 | 360×36 | 5 7 5 6 | Daily, Settings, Reports +60 |
| ✓ `skin:fill-azure` | da 9 mảnh | 120×12 | 360×36 | 5 7 5 6 | Daily, Settings, Reports +60 |
| ✓ `skin:fill-bad` | da 9 mảnh | 120×12 | 360×36 | 5 7 5 6 | Daily, Settings, Reports +60 |
| ✓ `skin:fill-gold` | da 9 mảnh | 120×12 | 360×36 | 5 7 5 6 | Daily, Settings, Reports +60 |
| ✓ `skin:fill-good` | da 9 mảnh | 120×12 | 360×36 | 5 7 5 6 | Daily, Settings, Reports +60 |
| ✓ `skin:groove` | da 9 mảnh | 200×44 | 600×132 | 12 12 12 12 | Daily, Settings, Reports +60 |
| ✓ `skin:knob` | da 9 mảnh | 26×26 | 80×80 | 0 0 0 0 | Daily, Settings, Reports +60 |
| `skin:paper` | da 9 mảnh | 128×128 | 384×384 |  | Daily, Settings, Reports +60 |
| ✓ `skin:plate` | da 9 mảnh | 120×30 | 360×92 | 12 14 12 14 | Daily, Settings, Reports +60 |
| ✓ `skin:rod` | da 9 mảnh | 240×22 | 720×68 | 0 22 0 22 | Daily, Settings, Reports +60 |
| ✓ `skin:scroll` | da 9 mảnh | 144×144 | 432×432 | 24 24 24 24 | Daily, Settings, Reports +60 |
| ✓ `skin:slip` | da 9 mảnh | 240×44 | 720×132 | 12 22 13 22 | Daily, Settings, Reports +60 |
| ✓ `skin:slip-bad` | da 9 mảnh | 240×44 | 720×132 | 12 22 13 22 | Daily, Settings, Reports +60 |
| ✓ `skin:strip` | da 9 mảnh | 124×124 | 372×372 | 14 14 14 14 | Daily, Settings, Reports +60 |
| `skin:stroke` | da 9 mảnh | 160×14 | 480×44 |  | Daily, Settings, Reports +60 |
| `skin:stroke-gold` | da 9 mảnh | 160×14 | 480×44 |  | Daily, Settings, Reports +60 |
| `skin:stroke-red` | da 9 mảnh | 160×14 | 480×44 |  | Daily, Settings, Reports +60 |
| ✓ `skin:switch` | da 9 mảnh | 54×30 | 164×92 | 0 0 0 0 | Daily, Settings, Reports +60 |
| ✓ `skin:switch-on` | da 9 mảnh | 54×30 | 164×92 | 0 0 0 0 | Daily, Settings, Reports +60 |
| ✓ `skin:tag` | da 9 mảnh | 72×28 | 216×84 | 9 10 9 10 | Daily, Settings, Reports +60 |
| ✓ `skin:tag-bad` | da 9 mảnh | 72×28 | 216×84 | 9 10 9 10 | Daily, Settings, Reports +60 |
| ✓ `skin:tag-dark` | da 9 mảnh | 72×28 | 216×84 | 9 10 9 10 | Daily, Settings, Reports +60 |
| ✓ `skin:tag-gold` | da 9 mảnh | 72×28 | 216×84 | 9 10 9 10 | Daily, Settings, Reports +60 |
| ✓ `skin:tag-good` | da 9 mảnh | 72×28 | 216×84 | 9 10 9 10 | Daily, Settings, Reports +60 |
| ✓ `skin:tag-red` | da 9 mảnh | 72×28 | 216×84 | 9 10 9 10 | Daily, Settings, Reports +60 |
| ✓ `skin:tag-silk` | da 9 mảnh | 72×28 | 216×84 | 9 10 9 10 | Daily, Settings, Reports +60 |
| ✓ `skin:toast` | da 9 mảnh | 260×48 | 780×144 | 14 34 14 34 | Daily, Settings, Reports +60 |
| ✓ `skin:toast-bad` | da 9 mảnh | 260×48 | 780×144 | 14 34 14 34 | Daily, Settings, Reports +60 |
| ✓ `skin:track` | da 9 mảnh | 120×12 | 360×36 | 5 6 5 6 | Daily, Settings, Reports +60 |

## Icon màu

Vật phẩm, tài nguyên, pháp bảo. Nguồn tối thiểu 128 px, viền mực 3 px, nền trong.

| Key | Loại | Hộp | Nguồn đề xuất | Màn |
| --- | --- | ---: | ---: | --- |
| ✓ `icon:boiNguyen` | ảnh HTML | 24×24 | 132×132 | Daily, Settings, Reports +12 |
| ✓ `icon:bolt` | ảnh HTML | 24×24 | 128×128 | Elder, Vault, Alliance +16 |
| ✓ `icon:cauldron` | ảnh HTML | 24×24 | 128×128 | Daily, Settings, Reports +56 |
| ✓ `icon:chienY` | ảnh HTML | 24×24 | 144×144 | PanelTrade, PanelGuard, AllyTech +5 |
| ✓ `icon:daiTuKhi` | ảnh HTML | 24×24 | 132×132 | Daily, Settings, Reports +10 |
| ✓ `icon:dieuThu` | ảnh HTML | 24×24 | 144×144 | PanelTrade, PanelGuard, Vault +4 |
| ✓ `icon:doKiep` | ảnh HTML | 24×24 | 132×132 | Daily, Settings, Reports +20 |
| ✓ `icon:flag` | ảnh HTML | 24×24 | 128×128 | Daily, Settings, Reports +45 |
| ✓ `icon:heal` | ảnh HTML | 24×24 | 128×128 | Daily, Settings, Reports +38 |
| ✓ `icon:hoiXuan` | ảnh HTML | 24×24 | 132×132 | Daily, Settings, Reports +10 |
| ✓ `icon:hoSon` | ảnh HTML | 24×24 | 144×144 | Daily, Settings, Reports +57 |
| ✓ `icon:hoTam` | ảnh HTML | 24×24 | 128×128 | PanelForge, ElderHigh, HomeHigh |
| ✓ `icon:huyenVu` | ảnh HTML | 24×24 | 128×128 | PanelForge, ElderHigh, HomeHigh |
| ✓ `icon:khoangNang` | ảnh HTML | 24×24 | 144×144 | AllyMob, AllyShop, Vip +2 |
| ✓ `icon:kimCang` | ảnh HTML | 24×24 | 128×128 | PanelForge, ElderHigh, HomeHigh |
| ✓ `icon:kimCuong` | ảnh HTML | 24×24 | 128×128 | AllyTech, AllyMob, AllyShop |
| ✓ `icon:kimDuyen` | ảnh HTML | 24×24 | 168×168 | Daily, Settings, Reports +19 |
| ✓ `icon:kinhThu` | ảnh HTML | 24×24 | 144×144 | AllyMob, AllyShop, Events +5 |
| ✓ `icon:linhKhoang` | ảnh HTML | 24×24 | 128×128 | Daily, Settings, Reports +57 |
| ✓ `icon:linhThach` | ảnh HTML | 24×24 | 128×128 | Daily, Settings, Reports +57 |
| ✓ `icon:linhThao` | ảnh HTML | 24×24 | 128×128 | Daily, Settings, Reports +57 |
| ✓ `icon:loBan` | ảnh HTML | 24×24 | 144×144 | PanelTrade, PanelGuard, AllyTech +10 |
| ✓ `icon:luyenBinh` | ảnh HTML | 24×24 | 144×144 | AllyTech, AllyMob, AllyShop +10 |
| ✓ `icon:nganDuyen` | ảnh HTML | 24×24 | 168×168 | Daily, Settings, Reports +18 |
| ✓ `icon:ngocGian` | ảnh HTML | 24×24 | 128×128 | PanelForge, ElderHigh, HomeHigh |
| ✓ `icon:ngoDao` | ảnh HTML | 24×24 | 144×144 | AllyShop, Events, Arena +6 |
| ✓ `icon:ngungThan` | ảnh HTML | 24×24 | 132×132 | Daily, Settings, Reports +13 |
| ✓ `icon:phaCanh` | ảnh HTML | 24×24 | 132×132 | PanelAlchemy, PanelLibrary, PanelTrade +6 |
| ✓ `icon:scroll` | ảnh HTML | 24×24 | 128×128 | Daily, Settings, Reports +56 |
| ✓ `icon:shield` | ảnh HTML | 24×24 | 128×128 | Daily, Settings, Reports +57 |
| ✓ `icon:star` | ảnh HTML | 24×24 | 128×128 | Daily, Settings, Reports +57 |
| ✓ `icon:taiTuy` | ảnh HTML | 24×24 | 132×132 | Daily, Settings, Reports +11 |
| ✓ `icon:tapDich` | ảnh HTML | 24×24 | 128×128 | Honor |
| ✓ `icon:thachNang` | ảnh HTML | 24×24 | 144×144 | AllyMob, AllyShop, Vip +3 |
| ✓ `icon:thanHanh` | ảnh HTML | 24×24 | 144×144 | AllyTech, AllyMob, AllyShop +3 |
| ✓ `icon:thanhSuong` | ảnh HTML | 24×24 | 128×128 | PanelForge, ElderHigh, HomeHigh |
| ✓ `icon:thaoNang` | ảnh HTML | 24×24 | 144×144 | AllyMob, AllyShop, Vip +2 |
| ✓ `icon:thienLoi` | ảnh HTML | 24×24 | 128×128 | PanelForge, ElderHigh, HomeHigh |
| ✓ `icon:thoiQuang` | ảnh HTML | 24×24 | 144×144 | Daily, Settings, Reports +23 |
| ✓ `icon:tiLoi` | ảnh HTML | 24×24 | 128×128 | PanelForge, ElderHigh, HomeHigh |
| ✓ `icon:tuBao` | ảnh HTML | 24×24 | 128×128 | PanelForge, ElderHigh, HomeHigh |
| ✓ `icon:tuKhi` | ảnh HTML | 24×24 | 132×132 | Daily, Settings, Reports +9 |
| ✓ `icon:tuLinh` | ảnh HTML | 24×24 | 144×144 | AllyTech, AllyMob, AllyShop +5 |
| ✓ `icon:xichViem` | ảnh HTML | 24×24 | 128×128 | PanelForge, ElderHigh, HomeHigh |

## Icon thao tác đơn sắc

Chỉ lấy kênh alpha (tô bằng màu chữ nơi đặt) — vẽ đen trên nền trong.

| Key | Loại | Hộp | Nguồn đề xuất | Màn |
| --- | --- | ---: | ---: | --- |
| `mask:arrow` | ảnh HTML | 24×24 | 128×128 | Settings, Reports, HomeNew +6 |
| `mask:back` | ảnh HTML | 24×24 | 128×128 | AllianceIn, AllyTech, AllyMob +1 |
| `mask:check` | ảnh HTML | 24×24 | 128×128 | Daily, Settings, Reports +27 |
| `mask:clock` | ảnh HTML | 24×24 | 128×128 | Daily, Settings, Reports +22 |
| `mask:close` | ảnh HTML | 24×24 | 128×128 | Daily, Settings, Reports +48 |
| `mask:cross` | ảnh HTML | 24×24 | 128×128 | PanelHall, PanelMine, PanelTrain +9 |
| `mask:download` | ảnh HTML | 24×24 | 128×128 | Target, Rivals, Chat +13 |
| `mask:gear` | ảnh HTML | 24×24 | 128×128 | Daily, Settings, Reports +57 |
| `mask:globe` | ảnh HTML | 24×24 | 128×128 | Settings, Reports, World +7 |
| `mask:hammer` | ảnh HTML | 24×24 | 128×128 | Daily, Settings, Reports +57 |
| `mask:lock` | ảnh HTML | 24×24 | 128×128 | Daily, Settings, Reports +43 |
| `mask:mail` | ảnh HTML | 24×24 | 128×128 | Daily, Settings, Reports +57 |
| `mask:minus` | ảnh HTML | 24×24 | 128×128 | PanelAlchemy, PanelLibrary, PanelTrade +1 |
| `mask:music` | ảnh HTML | 24×24 | 128×128 | Settings, Reports |
| `mask:people` | ảnh HTML | 24×24 | 128×128 | Daily, Settings, Reports +56 |
| `mask:plus` | ảnh HTML | 24×24 | 128×128 | PanelAlchemy, PanelLibrary, PanelTrade +1 |
| `mask:power` | ảnh HTML | 24×24 | 128×128 | Daily, Settings, Reports +57 |
| `mask:rank` | ảnh HTML | 24×24 | 128×128 | Profile, Ranks, Events +4 |
| `mask:skull` | ảnh HTML | 24×24 | 128×128 | Events, Arena, Vip +2 |
| `mask:sound` | ảnh HTML | 24×24 | 128×128 | Settings, Reports |
| `mask:swords` | ảnh HTML | 24×24 | 128×128 | Daily, Settings, Reports +52 |
| `mask:upload` | ảnh HTML | 24×24 | 128×128 | Reports, Replay, ReplayResult |

## Icon thanh điều hướng

5 thẻ dưới màn hình, tay chỉ hướng dẫn.

| Key | Loại | Hộp | Nguồn đề xuất | Màn |
| --- | --- | ---: | ---: | --- |
| ✓ `pointer` | ảnh HTML | 24×31 | 100×128 | HomeNew |
| ✓ `tab:banDo` | ảnh HTML | 40×40 | 132×132 | Daily, Settings, Reports +57 |
| ✓ `tab:baoKho` | ảnh HTML | 40×40 | 132×132 | Daily, Settings, Reports +57 |
| ✓ `tab:monHa` | ảnh HTML | 40×40 | 132×132 | Daily, Settings, Reports +57 |
| ✓ `tab:tienMinh` | ảnh HTML | 40×40 | 132×132 | Daily, Settings, Reports +57 |
| ✓ `tab:tongMon` | ảnh HTML | 40×40 | 132×132 | Daily, Settings, Reports +57 |

## Huy hiệu tông môn và tiên minh

`medal:<hình>:<màu>` dùng trong giao diện, `wmark:` trên bản đồ giới. Mỗi hình × mỗi màu là một key: nên vẽ theo hình rồi xuất đủ màu, không vẽ tay từng tổ hợp.

| Key | Loại | Hộp | Nguồn đề xuất | Màn |
| --- | --- | ---: | ---: | --- |
| `medal:ape:beast` | ảnh HTML | 48×48 | 144×144 | Replay, ReplayResult, Map +8 |
| `medal:bear:beast` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:blood:sect` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:chaos:realm` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:crest:gold` | ảnh HTML | 48×48 | 312×312 | Daily, Settings, Reports +60 |
| `medal:crest:pvp` | ảnh HTML | 48×48 | 192×192 | Rivals, Chat, World +8 |
| `medal:demon:sect` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:dragon:beast` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:eagle:beast` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:fire:realm` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:fist:the` | ảnh HTML | 48×48 | 128×128 | PanelTrain, PanelAlchemy, PanelLibrary +27 |
| `medal:fox:beast` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:ghost:sect` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:hawk:beast` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:ice:realm` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:leopard:beast` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:lotus:jade` | ảnh HTML | 48×48 | 348×348 | TribResult |
| `medal:nineFox:beast` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:orb:phap` | ảnh HTML | 48×48 | 128×128 | PanelTrain, PanelAlchemy, PanelLibrary +27 |
| `medal:phoenix:beast` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:poison:sect` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:rhino:beast` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:snake:beast` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:sword:kiem` | ảnh HTML | 48×48 | 128×128 | PanelTrain, PanelAlchemy, PanelLibrary +27 |
| `medal:thunder:thunder` | ảnh HTML | 48×48 | 128×128 | PanelTrib, Cloud, PanelCloud +8 |
| `medal:thunderPool:realm` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:tiger:beast` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:tower:tower` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:turtle:beast` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:win:red` | ảnh HTML | 48×48 | 420×420 | Reports, Replay, ReplayResult |
| `medal:wind:sect` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:windWolf:beast` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `medal:wolf:beast` | ảnh HTML | 48×48 | 192×192 | Map, Target, Rivals +6 |
| `medal:wood:realm` | ảnh HTML | 48×48 | 128×128 | Map, Target, Rivals +6 |
| `wmark:ape:beast` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:bear:beast` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:blood:ink` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:blood:red` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:chaos:realm` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:crest:gold` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:crest:red` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:demon:ink` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:dragon:beast` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:eagle:beast` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:earth:gold` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:fox:beast` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:ghost:ink` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:ghost:realm` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:hawk:beast` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:leopard:beast` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:lotus:jade` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:lotus:realm` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:nineFox:beast` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:phoenix:beast` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:poison:ink` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:rebirth:gold` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:rhino:beast` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:snake:beast` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:tiger:beast` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:tower:ink` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:turtle:beast` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:wind:ink` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:windWolf:beast` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:wolf:beast` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |
| `wmark:wood:gold` | texture cảnh | 48×48 | 128×128 | World, WorldSect, Honor |

## Bản đồ

Nền bản đồ vùng, tông môn trên bản đồ, quân đang hành quân.

| Key | Loại | Hộp | Nguồn đề xuất | Màn |
| --- | --- | ---: | ---: | --- |
| `map` | texture cảnh | 400×1000 | 1800×4500 | Map, Target, Rivals +6 |
| `map:home` | texture cảnh | 132×92 | 596×416 | Map, Target, Rivals +6 |
| `march` | texture cảnh | 20×21 | 92×96 | Map, Target, Rivals +5 |
| `wtoken` | texture cảnh | 20×21 | 92×96 | World, WorldSect, Honor |

## Chiến trường

Nền chiến trường, quân theo hệ, phe, bậc; yêu thú; vật rơi.

| Key | Loại | Hộp | Nguồn đề xuất | Màn |
| --- | --- | ---: | ---: | --- |
| `beast:kiem:#a8784a` | texture cảnh | 60×32 | 180×96 | Replay, ReplayResult |
| `beast:the:#a8784a` | texture cảnh | 60×32 | 180×96 | Replay, ReplayResult |
| `field:wild:400x866` | texture cảnh | 400×866 | 1200×2600 | Replay, ReplayResult |
| `item:linhKhoang` | texture cảnh | 24×24 | 72×72 | Refill |
| `item:linhThach` | texture cảnh | 24×24 | 72×72 | Refill |
| `item:linhThao` | texture cảnh | 24×24 | 72×72 | Refill |
| `sold:kiem:0:3` | texture cảnh | 24×26 | 72×80 | Replay, ReplayResult |
| `sold:the:0:3` | texture cảnh | 24×26 | 72×80 | Replay, ReplayResult |

## Hiệu ứng (giữ vẽ bằng code)

Sương, mây, quầng sáng: sinh theo hạt ngẫu nhiên, không cần vẽ tay.

- `cloud:…` — 3 biến thể
- `fog:…` — 15 biến thể
- `radiance:…` — 1 biến thể
