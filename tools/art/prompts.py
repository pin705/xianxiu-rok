# Toàn bộ prompt và danh sách asset của bộ tranh thủy mặc (hướng 6, chốt 25/9/2026).
# Sửa phong cách ở INK, sửa món nào ở bảng của món đó. make.py đọc file này — không có prompt nào nằm chỗ khác.
# Chữ trong prompt viết tiếng Anh vì model hiểu tốt nhất; ghi chú tiếng Việt.

# ---------- phong cách chung ----------
INK = ('traditional Chinese ink-wash (shuimo) painting: loose calligraphic ink contour lines with natural wobble and varying weight, dry-brush texture, '
       'thin translucent mineral-pigment washes (malachite green, cinnabar, ochre, pale ink grey) with soft bleeding edges, imperfect and hand-made, '
       'simplified with far fewer details than a realistic render, no individual tiny ornaments')
MAGENTA = ('The background MUST be solid flat pure magenta (#FF00FF) filling the whole image — not white, not paper, not a gradient.'  # tách nền: pipeline.key_magenta
           ' No glow or aura that spills onto the background.')
NO_TEXT = 'No text, no letters, no characters, no labels, no numbers.'

# ---------- công trình (10 loại × 5 bậc) ----------
BASE = ('It stands on a small low base (a little rock and grass, or a thin stone footing), NOT a big rock island, NOT a marble terrace. '
        'Blank plaques and banners, absolutely no writing. Front view with a slight top-down angle, centered, the whole structure visible with margin. '
        + MAGENTA)
TIER = {
  1: 'Tier 1, humble early version: weathered dark slate-gray tile roofs, plain dark wood, simple grey stone base, very few ornaments.',
  2: 'Tier 2: jade-green glazed tile roofs with gold ridge ornaments, red lacquered pillars, pale stone base.',
  3: 'Tier 3: golden-yellow glazed tile roofs, rich gold trim, grander and more ornate, white marble base.',
  4: 'Tier 4: deep azure-blue glazed tile roofs with silver and gold trim, very grand and ornate, carved white marble base, faint spiritual glow.',
  5: 'Tier 5, celestial version: white jade and gold roofs, luminous, the base resting on soft white clouds, radiant immortal-realm splendor.',
}
# mã: (tên, {bậc từ đó trở lên: dáng}, tỉ lệ khung, ghi chú thêm). Dáng khoá 0 = mọi bậc cùng dáng.
BUILDINGS = {
  'chuDien': ('the sect Main Hall', {1: 'a single-roof traditional hall on a low terrace with front steps',
                                     2: 'a grand two-tier palace hall on a stone terrace with front steps and red lanterns',
                                     3: 'a grand palace complex: a two-tier main hall flanked by two smaller side pavilions, wide composition'}, '3:2', ''),
  'tangKinhCac': ('the Scripture Library pagoda', {1: 'a slender three-story pagoda tower with stacked eaves', 2: 'a slender four-story pagoda tower with stacked eaves',
                                                   3: 'a tall slender five-story pagoda tower with stacked eaves and a finial'}, '3:4', ''),
  'danPhong': ('the Alchemy Room', {0: 'a small single-story hall on the left and a large bronze three-legged alchemy cauldron on the right, wide composition'}, '3:2',
               ' No smoke, no steam, no vapor anywhere.'),
  'tangBaoCac': ('the Treasure Pavilion', {0: 'a compact square two-story pavilion with a treasure plaque, balcony railings and stacked roofs'}, '1:1', ''),
  'dienVoTruong': ('the Martial Training Ground', {0: 'a wide round flat stone training arena seen from slightly above, a small open gate pavilion at the back center, '
                   'a wooden weapon rack on the left, two tall banner poles on the right, four wooden training dummies on the arena, wide and low composition'}, '3:2', ''),
  'tuLinhTran': ('the Spirit Gathering Array', {0: 'a wide low circular stone formation platform seen from slightly above, a carved rune circle glowing softly cyan in the middle, '
                 'eight short stone lantern pillars around the rim, NO roof, NO gate, NO pavilion, NO arch, nothing tall'}, '16:9', ' Keep it very flat and wide, nothing tall.'),
  'khoangMach': ('the Spirit Mine', {0: 'a rocky mossy hill with a timber-framed mine entrance in the middle, glowing blue spirit crystals growing from the rocks, '
                 'a small mine cart of ore in front, wide composition'}, '3:2', ''),
  'linhDien': ('the Spirit Fields', {0: 'three stepped terraces of spirit-herb fields in neat rows, a tiny hut with a tiled roof on the right end, a small signpost on the left, '
               'very wide and low composition'}, '16:9', ' The terraces are full of rows of vivid fresh green spirit herbs with rich saturated greens and a little gold light.'),
  'luyenKhiPhong': ('the Artifact Forge', {0: 'a small single-story hall on the left and a brick forge furnace with glowing fire and a chimney on the right, an anvil in front, '
                    'wide composition'}, '3:2', ''),
  'hoSonDaiTran': ('the Mountain Guardian Array', {0: 'a wide octagonal stone platform with eight short talisman pillars around the edge and a taiji symbol carved in the center, '
                   'under a protective barrier dome'}, '3:2', ' The protective barrier dome is drawn ONLY as a few thin pale-cyan ink arcs outlining a dome shape; '
                   'the inside of the dome is completely empty and see-through, no fill, no tint, no glow wash.'),
}

def building_form(bid, tier):
  name, forms, _, _ = BUILDINGS[bid]
  return f'{name} — {forms[0] if 0 in forms else forms[max(k for k in forms if k <= tier)]}'

def building_new(bid):
  """bậc 2 vẽ mới. Ảnh 1 = mẫu phong cách, ảnh 2 (nếu có) = bố cục (bản vẽ code hoặc bản cũ)."""
  name, _, _, extra = BUILDINGS[bid]
  return ('Image 1 is the ART STYLE reference. Image 2 shows WHAT to draw. Redraw the building from image 2 in exactly the art style of image 1 — '
          f'{INK}. Keep its layout and key features: {building_form(bid, 2)}. {TIER[2]}{extra} {BASE}')

def building_tier(bid, tier):
  """bậc khác sửa từ chính bậc 2 của công trình (ảnh 2) để giữ nhận diện."""
  _, _, _, extra = BUILDINGS[bid]
  return ('Image 2 is a building from our game. Repaint it as its upgrade version, keeping exactly the same ink-wash art style (see image 1 and 2), '
          f'the same viewpoint and the same identity. {INK}. New form: {building_form(bid, tier)}. {TIER[tier]}{extra} {BASE}')

# ---------- chân dung (tròn trong game) ----------
FACE = ('Image 1 is the ART STYLE and FRAMING reference (a portrait from our game). {who_ref} Redraw as a bust portrait in exactly the style of image 1 — '
        f'{INK}. Head and shoulders, face centered in the square so it can be cropped to a circle. '
        'Character: {who}. Soft pale {bg} ink-wash background with visible paper grain. No text, no frame, no border.')
FACES = {  # mã trưởng lão (apps/client/src/lib.ts LOOK) → (màu nền, mô tả). 'master' = chưởng môn (Hud)
  'master': ('soft steel blue', 'a young sect master, calm and determined, black hair in a topknot bun with a jade hairpin, deep indigo-blue robe with gold trim, a small red cinnabar mark on the forehead'),
  'thanhPhong': ('pale teal', 'the grand elder: an old man with long white hair tied in a bun and a long flowing white beard, wise and stern, teal-blue robe with gold trim, a small cyan mark on the forehead, the hilt of a sword visible at his shoulder'),
  'thachKien': ('warm tan', 'a burly bald former bandit chief turned sect protector, short dark beard, rugged scarred face, loyal eyes, brown robe with black trim, broad shoulders'),
  'nhuYen': ('soft coral', 'a beautiful young woman with long straight black hair, crimson red robe with pale gold trim, a red flame mark on the forehead, a small flame floating above her raised palm'),
  'loiChan': ('pale lavender', 'a young swordsman with black hair tied in a high ponytail, indigo-violet robe with bright yellow trim, confident smirk, faint lightning crackling around him'),
  'vanHac': ('pale sage green', 'a kind old bald alchemist with a long white beard, white robe with red trim, gentle smile, a small medicine gourd at his shoulder'),
  'hanBang': ('pale icy blue', 'an ethereal ice fairy woman with long silver-white hair and a small crystal crown, pale icy blue robe with white trim, a blue mark on the forehead, cold serene expression, frost sparkles'),
  'bachVoNhai': ('cool grey', 'a handsome sword immortal in a pure white robe with grey trim, long silver-white hair, sharp fierce eyebrows, a sword hilt with a red tassel rising behind his shoulder'),
  'macSau': ('muted khaki', 'a melancholic female hermit with long brown hair under a woven bamboo hat, sorrowful eyebrows, never smiling, brown hemp robe with beige trim'),
  'hoacThienCuong': ('warm orange', 'a massive body-cultivator general with wild flame-like spiky dark red hair, short beard, fierce eyebrows, dark crimson armored robe with orange trim, an orange mark on the forehead, glowing ember sparks'),
  'toMiNuong': ('pale aqua', 'a charming playful female mage with black hair in a bun decorated with a pink flower, teal robe with pink trim, a pink mark on the forehead, a sly smile'),
  'diepCoThanh': ('soft green', 'a lone swordsman with black hair tied back by a pale green headband, forest-green robe with dark green trim, a gold sword hilt over his shoulder, calm intense gaze'),
  'huyenMinh': ('slate blue', 'an ancient sect ancestor, very old, long silver-white hair with a dark crown, long white beard, long drooping white eyebrows, deep navy robe with cyan trim, a cyan mark on the forehead, icy aura'),
}

# ---------- bảng 3×3 (icon, huy hiệu, icon thao tác, đồ trang trí, quân) ----------
# Ảnh mẫu là anchors/icons.jpg (4 icon sạch) — KHÔNG dùng ảnh công trình làm mẫu: model vẽ lẫn đá/mái vào nền.
def sheet(items, what='game item icons', extra=''):
  lst = ' '.join(f'{i + 1}) {d}.' for i, (_, d) in enumerate(items))
  return ('Image 1 shows 4 icons from our game: it is the ART STYLE reference only (do not repeat those objects). '
          f'Paint a NEW sheet of 9 separate {what} in exactly this art style — {INK}; with a confident dark ink outline slightly bolder than usual '
          f'so each one reads clearly at small size. {extra}Arrange them in a neat 3 by 3 grid, row by row from the top-left: {lst} '
          'Each one is a single object with a bold readable silhouette, seen from the front, centered in its own cell, all about the same size, '
          f'with wide empty gaps between them and nothing crossing into another cell. {NO_TEXT} No grid lines. {MAGENTA}')

# lá phù: dải giấy hẹp, hơi nghiêng, treo dây đỏ — không vẽ thành thẻ chữ nhật đứng (thu nhỏ trông như icon còn nền vuông)
TALI = 'a narrow pale-yellow paper talisman slip, slightly tilted and curled, hanging from a short red cord with a tassel, with a red ink rune of '
# tên ô → key manifest: 'tab:…' giữ nguyên, 'pointer' giữ nguyên, '_…' bỏ, còn lại thành 'icon:<tên>'
ICON_SKIP = {'D': [7]}  # bảng D: model vẽ thêm một túi vàng (hình thứ 8 theo thứ tự đọc)
ICON_SHEETS = {
  'A': [('linhThach', 'a faceted pale-blue spirit crystal'), ('linhThao', 'a spirit herb sprig with green leaves and a small golden flower'),
        ('linhKhoang', 'a grey ore rock with small purple crystals'), ('tuKhi', 'a round cyan pill with a white swirl'),
        ('boiNguyen', 'a round golden pill with a ring pattern'), ('doKiep', 'a round violet pill with a small lightning mark'),
        ('hoiXuan', 'a round green pill with a leaf mark'), ('ngungThan', 'a round red pill with an eye-shaped mark'),
        ('daiTuKhi', 'a large round gold pill with a cyan swirl')],
  'B': [('phaCanh', 'a round deep-violet pill with cracked lightning veins'), ('taiTuy', 'a round pearl-white pill with a water swirl'),
        ('thanhSuong', 'a straight blue-steel sword with a white hilt, diagonal'), ('xichViem', 'an open red folding fan with flames'),
        ('kimCang', 'a thick golden bracelet ring'), ('huyenVu', 'a dark teal tortoise-shell armor vest'),
        ('hoTam', 'a round bronze protective mirror with a red tassel'), ('thienLoi', 'a war hammer with a violet head crackling with lightning, diagonal'),
        ('tuBao', 'a golden treasure bowl heaped with gold ingots')],
  'C': [('ngocGian', 'a bundle of jade-green bamboo slips tied with red string'), ('tiLoi', 'a clear violet crystal orb on a small bronze stand'),
        ('thoiQuang', TALI + 'an hourglass'), ('loBan', TALI + 'a hammer'), ('luyenBinh', TALI + 'a sword'),
        ('ngoDao', TALI + 'an open book'), ('dieuThu', TALI + 'a medicine gourd'), ('tuLinh', TALI + 'a swirling spirit wave'),
        ('thanHanh', TALI + 'a flying cloud')],
  'D': [('chienY', TALI + 'a flame'), ('kimCuong', TALI + 'a diamond-shaped shield'), ('hoThe', TALI + 'a green jade disc'),
        ('hoSon', TALI + 'a mountain inside a shield'), ('thachNang', 'a small blue cloth pouch tied at the top, bulging with spirit stones'),
        ('thaoNang', 'a small green cloth pouch tied at the top with a herb sprout peeking out'), ('khoangNang', 'a small purple cloth pouch tied at the top, bulging with ore'),
        ('kinhThu', 'a closed dark-blue thread-bound sutra book'), ('tapDich', 'a wooden command token tablet with a red tassel')],
  'E': [('nganDuyen', 'a silver invitation envelope with a red wax seal'), ('kimDuyen', 'a golden invitation envelope with a red wax seal'),
        ('scroll', 'a rolled paper scroll with wooden ends'), ('cauldron', 'a bronze three-legged alchemy cauldron'),
        ('flag', 'a red triangular battle flag on a pole'), ('heal', 'a green medicine gourd with a red cord'),
        ('bolt', 'a golden lightning bolt'), ('star', 'a five-pointed golden star'), ('shield', 'a round bronze shield')],
  'F': [('tab:tongMon', 'a small Chinese sect gate archway with a jade-green roof'), ('tab:monHa', 'a young disciple in blue robes, bust'),
        ('tab:banDo', 'a partly unrolled old map scroll'), ('tab:tienMinh', 'two crossed red and blue banners'),
        ('tab:baoKho', 'a red lacquered treasure chest with gold fittings'), ('pointer', 'a pointing hand with index finger up'),
        ('_1', 'a small peach blossom branch'), ('_2', 'a small pine branch'), ('_3', 'a small red paper lantern')],
}

# Hình chạm huy hiệu (packages/art/emblems.ts): vẽ trên nền trong, đặt lên đĩa màu vẽ bằng code theo tông → một tranh cho mọi tông.
EMBLEM_NOTE = 'Each emblem will be placed in the middle of a small colored round medallion, so paint just the emblem figure itself, no disc, no circle, no frame. '
EMBLEM_SHEETS = {
  'M1': [('wolf', 'a grey wolf head in profile, snarling'), ('snake', 'a coiled green serpent'), ('bear', 'a brown bear head facing front'),
         ('fox', 'an orange fox head'), ('eagle', 'an eagle head in profile with a hooked beak'), ('ape', 'a fierce ape face'),
         ('windWolf', 'a pale blue wolf head with swirling wind'), ('leopard', 'a spotted leopard head'), ('rhino', 'an armored rhino head with a big horn')],
  'M2': [('nineFox', 'a white fox with nine fanned tails'), ('hawk', 'a hawk with spread wings'), ('turtle', 'a black tortoise with a snake coiled on its shell'),
         ('tiger', 'a striped tiger head facing front'), ('phoenix', 'a vermilion phoenix with spread wings'), ('dragon', 'an azure Chinese dragon head'),
         ('wind', 'a swirling gust of wind'), ('blood', 'a crimson blood drop'), ('poison', 'a green poison droplet with a tiny skull')],
  'M3': [('demon', 'a horned demon mask'), ('ghost', 'a pale ghost-fire wisp'), ('wood', 'a green leafy sprouting branch'),
         ('fire', 'a flame'), ('ice', 'an ice crystal snowflake'), ('thunderPool', 'a lightning bolt striking a small pool'),
         ('chaos', 'a swirling purple yin-yang chaos vortex'), ('sword', 'an upright sword'), ('orb', 'a glowing magic orb')],
  'M4': [('fist', 'a clenched fist'), ('metal', 'a silver-gold metal ingot'), ('water', 'a curling water wave'),
         ('earth', 'a brown mountain rock'), ('thunder', 'a lightning bolt'), ('win', 'two crossed swords under a small gold star'),
         ('lose', 'a broken sword'), ('rebirth', 'a phoenix feather curling into a circle'), ('lotus', 'a pink lotus flower')],
  'M5': [('crest', 'a small sect crest shield'), ('tick', 'a bold brush check mark'), ('tower', 'a small pagoda tower'),
         ('anvil', 'an anvil with a hammer'), ('_1', 'a small cloud'), ('_2', 'a small leaf'),
         ('_3', 'a small star'), ('_4', 'a small flame'), ('_5', 'a small drop')],
  # đạo thống của người chơi (rules DAOS, cùng thứ tự): màn chọn lúc lập tông môn, Chủ điện, hồ sơ
  'M6': [('kiemTong', 'a flying sword pointing up above a small curling cloud'), ('phapTong', 'a swirling ball of flame floating above an open palm'),
         ('theTong', 'a big bronze temple bell'), ('danTong', 'a small bronze three-legged cauldron with a golden pill rising above it'),
         ('tranTong', 'an octagonal bagua formation disc with trigram bars around a yin-yang centre'), ('khiTong', 'a forging hammer crossed over a glowing sword blade with sparks'),
         ('phuTong', 'a yellow paper talisman strip with red cinnabar swirl strokes and a tiny lightning spark'), ('thuTong', 'a green-maned qilin head in profile'),
         ('maTong', 'a crimson blood-red crescent moon with a black bat silhouette')],
}

# Tổ sư chín đạo thống (màn chọn đạo thống, Title.svelte / DaoChoose.svelte): cả người, cùng cỡ, cùng đường chân. Màu áo theo tông đĩa
# huy hiệu (emblems.ts DAO_TONES) để tranh và huy hiệu khớp nhau.
FIGURES = [
  ('kiemTong', 'a young sword immortal in a white robe with azure-blue trim, black hair in a high topknot, both hands resting on the pommel of a long straight sword planted point-down in front of him, calm piercing gaze'),
  ('phapTong', 'a graceful woman mage in a flowing cinnabar-red robe with gold trim, long black hair with a gold hairpin, one palm raised with a small ball of fire floating above it'),
  ('theTong', 'a burly bare-chested monk with bronze skin, bald head, ochre-yellow trousers and sash, big prayer beads around the neck, fists clenched in a powerful stance'),
  ('danTong', 'a kind old alchemist with a long white beard in a jade-green robe, a small golden pill held up in one hand, a medicine gourd hanging at his belt'),
  ('tranTong', 'a stern middle-aged strategist in a dark robe with gold trim and a neat black beard, holding a round bronze formation compass disc in both hands'),
  ('khiTong', 'a muscular smith cultivator in grey-silver robes with a leather apron, sleeves rolled up, a big forging hammer resting on his shoulder'),
  ('phuTong', 'a Taoist priest in a violet robe with a small black hat, a yellow paper talisman held between two raised fingers, a peachwood sword on his back'),
  ('thuTong', 'a wild young woman beast tamer in an indigo-blue robe with a fur collar, a small white spirit tiger cub sitting at her feet'),
  ('maTong', 'a menacing demonic cultivator in black robes with crimson lining, long loose black hair, pale face, red eyes, a crimson curved saber at his side'),
]
# thứ tự model thật sự vẽ trên sheet-figures (đọc trái → phải, trên → dưới; bảng 25/9: hàng 4 + hàng 5). Vẽ lại thì xem ảnh rồi sửa.
FIGURES_DRAWN = ['kiemTong', 'phapTong', 'theTong', 'danTong', 'phuTong', 'tranTong', 'thuTong', 'khiTong', 'maTong']
def figures_sheet():
  lst = ' '.join(f'{i + 1}) {d}.' for i, (_, d) in enumerate(FIGURES))
  return ('Image 1 is a portrait from our game: it is the ART STYLE reference for faces, hair and robes only (do not copy that person). '
          f'Paint a NEW sheet of 9 separate full-body characters, the founders of nine cultivation sects, in exactly this art style — {INK}; '
          'with a confident dark ink outline so each one reads clearly. Arrange them in a neat 3 by 3 grid, row by row from the top-left: ' + lst + ' '
          'Each character stands alone, the whole body from head to feet visible, about 6 heads tall, facing the viewer at a slight three-quarter angle, '
          'centered in its own cell, all the same height with the feet on the same line, wide empty gaps between them and nothing crossing into another cell. '
          f'No ground, no shadow, no glow, no aura. {NO_TEXT} No grid lines. {MAGENTA}')

# Icon thao tác đơn sắc (packages/art/actions.ts MONO): game chỉ lấy alpha rồi tô bằng màu chữ.
# Nghĩa theo bản vẽ code (trang Icon trên canvas thiết kế): power = lực chiến (thanh kiếm), minus = nét ngang, rank = bục xếp hạng.
MASK_NOTE = 'Paint each one as a SOLID BLACK ink brush glyph silhouette (pure black on the magenta background, no color, no grey fill), simple and bold like a UI icon. '
MASK_SHEETS = {
  'K1': [('hammer', 'a hammer'), ('lock', 'a padlock'), ('check', 'a check mark'), ('cross', 'an X cross'), ('close', 'a thin X close mark'),
         ('power', 'a single straight sword held diagonally (combat power)'), ('sound', 'a speaker with sound waves'), ('mute', 'a speaker with a slash'), ('music', 'a music note')],
  'K2': [('clock', 'a clock face'), ('arrow', 'an arrow pointing right'), ('back', 'an arrow pointing left'), ('plus', 'a plus sign'),
         ('minus', 'a minus sign'), ('gear', 'a gear cog'), ('people', 'two people silhouettes'), ('swords', 'two crossed swords'), ('skull', 'a skull')],
  'K3': [('download', 'an arrow pointing down into a tray'), ('upload', 'an arrow pointing up out of a tray'), ('globe', 'a globe'),
         ('mail', 'an envelope'), ('rank', 'a ranking podium'), ('_1', 'a star'), ('_2', 'a heart'), ('_3', 'a flag'), ('_4', 'a bell')],
}

# Đồ trang trí trên núi: cắt ô rồi đặt theo chân khớp khung bao của bản vẽ code (pipeline.fit_prop). Ô → các key dùng chung.
PROP_SHEETS = {
  'P1': [('pine-s', 'a small gnarled Chinese pine tree with flat layered needle clouds'), ('pine-m', 'a medium gnarled Chinese pine tree with flat layered needle clouds'),
         ('pine-l', 'a large tall gnarled Chinese pine tree with flat layered needle clouds'), ('rock-l', 'a big mossy grey scholar rock'),
         ('rock-r', 'a medium mossy grey scholar rock'), ('bamboo', 'a small clump of green bamboo stalks with leaves'),
         ('blossom', 'a small peach blossom tree with pink flowers'), ('lantern', 'a small grey stone garden lantern'), ('bamboo2', 'a slender clump of green bamboo')],
  'P2': [('sun', 'a round red ink sun'), ('moon', 'a pale cream full moon'), ('crane-up', 'a flying red-crowned crane seen from the side, wings raised up'),
         ('crane-down', 'the same flying red-crowned crane, wings pushed down'), ('bird-up', 'a small flying swallow, wings up'),
         ('bird-down', 'the same small flying swallow, wings down'), ('fly-open', 'a small butterfly with wings open'),
         ('fly-shut', 'the same small butterfly with wings nearly closed'), ('pearl', 'a softly glowing white spirit pearl')],
  'P3': [('walker-0', 'a tiny chibi disciple in blue robes walking to the right, left foot forward'), ('walker-1', 'the same tiny chibi disciple walking, right foot forward'),
         ('worker', 'a tiny chibi worker in brown clothes carrying a hammer'), ('disciple', 'a tiny chibi disciple in blue robes standing'),
         ('flag', 'a small red sect banner on a pole'), ('lotus', 'a pink lotus flower on a lily pad'), ('_ring', 'a thin golden ring'),
         ('march', 'a small round bronze token with a red banner'), ('scaffold', 'a bamboo scaffold frame tied with rope')],
}
PROP_KEYS = {  # ô → key trong manifest (key nào không có trong keys.json thì bỏ qua)
  'pine-s': ['pine:8', 'pine:5'], 'pine-m': ['pine:2', 'pine:14'], 'pine-l': ['pine:fg1', 'pine:fg2'], 'rock-l': ['rock:l'], 'rock-r': ['rock:r'],
  'bamboo': ['bamboo:0.8:4'], 'bamboo2': ['bamboo:0.85:8'], 'blossom': ['blossom:0.95:3', 'blossom:0.8:7', 'blossom:1:11', 'blossom:0.9:13'],
  'lantern': ['lantern:0.9', 'lantern:0.8'], 'sun': ['sun'], 'moon': ['moon'], 'crane-up': ['crane:up'], 'crane-down': ['crane:down'],
  'bird-up': ['bird:up'], 'bird-down': ['bird:down'], 'fly-open': ['fly:open'], 'fly-shut': ['fly:shut'], 'pearl': ['pearl:1', 'pearl:1.2', 'pearl:1.5'],
  'walker-0': ['walker:0'], 'walker-1': ['walker:1'], 'worker': ['worker'], 'disciple': ['disciple'], 'flag': ['flag'], 'lotus': ['lotus'],
  'march': ['march', 'wtoken'], 'scaffold': ['scaffold:120:72', 'scaffold:128:46'],
}

# Quân (packages/art/figures.ts soldier): key sold:<hệ>:<phe 0 ta / 1 địch>:<bậc 3–5>. Quay mặt sang phải.
TROOP = {'kiem': 'a sword cultivator holding a sword', 'phap': 'a mage cultivator holding a glowing orb', 'the': 'a bare-chested muscular body cultivator with raised fists'}
SIDE = {0: 'in a white-and-blue robe', 1: 'in dark crimson-black robes with a cinnabar sash, menacing'}
RANK = {3: '', 4: ', with a gold sash and gold trim', 5: ', in white-and-gold robes with ornate gold armor pieces'}  # không hào quang: vầng sáng trên nền hồng thành vệt hồng
def soldier_items(side):
  return [(f'sold:{t}:{side}:{r}', f'a tiny chibi {TROOP[t]} {SIDE[side]}{RANK[r] if side == 0 or r < 5 else ", with ornate dark red armor pieces"}, full body, facing right, no glow')
          for t in TROOP for r in (3, 4, 5)]
# Đệ tử đặc trưng của chín đạo thống (rules DAO_UNITS): một dáng mỗi đạo, dùng cho mọi bậc của hệ đó, cả khi là quân địch (field.ts)
DAO_TROOPS = {
  'kiemTong': 'sword cultivator in a white robe with azure trim, standing on a flying sword, another sword held forward',
  'phapTong': 'mage cultivator woman in a cinnabar-red robe, a small ball of fire above her raised palm',
  'theTong': 'bald bare-chested monk with bronze skin, ochre trousers and big prayer beads, fists raised',
  'danTong': 'alchemist cultivator in a jade-green robe holding up a small glowing golden gourd',
  'tranTong': 'guard in dark robes with gold trim holding a big round bronze shield with a bagua pattern',
  'khiTong': 'swordsman in grey-silver plate armor over a leather apron, holding a broad sword',
  'phuTong': 'Taoist in a violet robe holding up a yellow paper talisman, a peachwood sword at the hip',
  'thuTong': 'body cultivator in an indigo-blue robe riding a small white qilin',
  'maTong': 'demonic warrior in black robes with crimson lining holding a crimson curved saber',
}
TROOP_SHEETS = {'S0': soldier_items(0), 'S1': soldier_items(1),
                'S2': [(f'sold:dao:{k}', f'a tiny chibi {d}, full body, facing right, no glow') for k, d in DAO_TROOPS.items()]}
# Trấn phái chi bảo (kiến trúc riêng mỗi đạo thống, cảnh núi cạnh Chủ điện): key lm:<đạo>, hộp LANDMARK_BOX (DU, chân giữa đáy)
LANDMARK_BOX = (52, 64)  # khớp packages/art daoMark()
LANDMARKS = [
  ('kiemTong', 'a giant ancient sword thrust point-down into a mossy boulder'),
  ('phapTong', 'a carved stone altar pillar with an eternal red flame burning in a bronze bowl on top'),
  ('theTong', 'a big bronze temple bell hanging in a small dark wooden frame with a little tiled roof'),
  ('danTong', 'a tall bronze three-tiered pill furnace with a gourd-shaped lid'),
  ('tranTong', 'a tall stone obelisk carved with a bagua disc, on a stepped stone base'),
  ('khiTong', 'a small stone forge furnace with a glowing orange mouth, an anvil in front and swords leaning on it'),
  ('phuTong', 'a tall stone pillar wrapped with many yellow paper talismans'),
  ('thuTong', 'a stone statue of a sitting qilin on a square pedestal'),
  ('maTong', 'a black stone altar holding a small pool of crimson blood, two dark red banners on poles behind it'),
]
# Yêu thú: một dáng lông xám nhạt mỗi hệ, game tô màu loài bằng tint (field.ts) — nên vẽ sáng, gần như không màu.
BEAST_SHEET = [('beast:kiem', 'a lean wolf with a bushy tail, walking to the right'), ('beast:phap', 'a slender fox with a fan-shaped tail, walking to the right'),
               ('beast:the', 'a heavy bear, walking to the right'), ('_1', 'a small rock'), ('_2', 'a tuft of grass'), ('_3', 'a small bush'),
               ('_4', 'a small stone'), ('_5', 'a fallen leaf'), ('_6', 'a small flower')]
BEAST_NOTE = 'Paint the animals in very light neutral grey fur (almost white, no hue) with dark ink outlines: the game tints them per species. '

# ---------- da giao diện 9 mảnh (vẽ đè trong đường bao bản code) ----------
SKIN = ('Image 1 is a placeholder UI element from our game on a magenta background. Image 2 shows 4 icons from our game: it is the ART STYLE reference only '
        '(do not draw those objects). Redesign image 1 as a premium hand-painted game UI element: {design}. Painted in the style of image 2 — ' + INK + '. '
        'Keep EXACTLY the same outer silhouette, size and proportions as image 1 (it must fit the same place). '
        'The middle part will be stretched and text will be written on it, so keep it clean, plain and even — no stains, no blotches, no color patches; '
        'put ornaments ONLY right in the four corners / at the two extreme ends. No text, no icons, no symbols in the middle. '
        'Keep the solid flat pure magenta (#FF00FF) background around it.')
FLAT = ', one flat even color everywhere, NO watercolor stains, NO color blooms or blotches anywhere, only a clean ink brush outline'
SKINS = {  # tên da trong ui/theme.ts → thiết kế
  'btn': 'a premium lacquered deep indigo-blue wooden plaque button, one even indigo color across the whole face, a thin gold rim, small carved gold cloud ornaments at the left and right ends',
  'btn-gold': 'a premium lacquered golden-yellow wooden plaque button with a thin dark-brown rim and subtle brush texture, small carved cloud ornaments at the left and right ends',
  'btn-danger': 'a premium lacquered cinnabar-red wooden plaque button with a thin gold rim and subtle brush texture, small carved gold cloud ornaments at the left and right ends',
  'btn-ghost': 'a pale ivory rice-paper plaque button with a thin dark ink brush outline and tiny ink cloud marks at the left and right ends' + FLAT,
  'btn-off': 'a faded grey-beige worn wooden plaque button with a soft ink outline, muted, disabled look' + FLAT,
  'card': 'a sheet of clean even warm ivory rice paper with a hand-drawn dark ink brush border and tiny ink cloud motifs tucked into the four corners',
  'card-plain': 'a sheet of warm ivory rice paper with a thin soft ink brush border',
  'card-sel': 'a sheet of warm ivory rice paper with a bold cinnabar-red brush border and tiny red cloud motifs in the four corners',
  'card-glow': 'a sheet of warm ivory rice paper with a gold brush border glowing softly, tiny gold cloud motifs in the four corners',
  'card-silk': 'a panel of pale teal-grey silk with a thin dark brush border and small bronze studs in the four corners' + FLAT,
  'scroll': 'a hanging-scroll mounting frame: a pale teal silk border band with a thin gold inner line around a plain empty rice-paper center; '
            'small gold corner brackets drawn ON the silk band exactly at the four outer corners; nothing inside the paper center',
  'strip': 'a band of pale teal-grey silk-mounted paper with thin darker edges',
  'capsule': 'a small ivory rice-paper pill-shaped label with a soft ink brush outline',
  'plate': 'a small ivory rice-paper plaque label with a soft ink brush outline and tiny teal silk end caps',
  'slip': 'a long ivory paper slip banner with a soft ink outline and small teal silk end tabs with a notch',
  'slip-bad': 'a long pale-pink paper slip banner with a cinnabar ink outline and small red silk end tabs with a notch',
  'tag': 'a small beige paper tag with an ink brush outline',
  'tag-silk': 'a small pale teal silk tag with a thin dark outline',
  'tag-good': 'a small pale-green paper tag with a malachite-green brush outline',
  'tag-bad': 'a small pale-red paper tag with a cinnabar brush outline',
  'tag-gold': 'a small pale-gold paper tag with a darker gold brush outline',
  'tag-dark': 'a small dark ink-grey lacquer tag with a thin gold outline' + FLAT,
  'tag-red': 'a small cinnabar-red lacquer tag with a thin dark outline',
  'badge': 'a small round cinnabar-red seal badge with a thin darker rim',
  'badge-fresh': 'a small round bright gold badge with a thin dark rim',
  'track': 'a thin recessed dark groove track with a soft ink outline',
  'fill': 'a thin glossy spirit-cyan liquid bar with a soft highlight along the top',
  'fill-gold': 'a thin glossy gold liquid bar with a soft highlight along the top',
  'fill-good': 'a thin glossy malachite-green liquid bar with a soft highlight along the top',
  'fill-bad': 'a thin glossy cinnabar-red liquid bar with a soft highlight along the top',
  'fill-azure': 'a thin glossy azure-blue liquid bar with a soft highlight along the top',
  'field': 'a recessed ivory paper input field with a thin ink outline at the bottom',
  'groove': 'a recessed long slot carved into pale stone, soft ink outline',
  'toast': 'a long ivory rice-paper notice banner with an ink brush border and small scroll-roll ends',
  'toast-bad': 'a long pale-pink rice-paper notice banner with a cinnabar brush border and small scroll-roll ends',
  'disc-paper': 'a round ivory paper medallion with an ink brush rim',
  'disc-azure': 'a round azure-blue porcelain medallion with a thin white rim',
  'disc-gold': 'a round polished gold medallion with an engraved rim',
  'disc-silk': 'a round pale teal silk medallion with a thin dark rim',
  'switch': 'a small horizontal switch slot of pale carved stone, off state, plain',
  'switch-on': 'a small horizontal switch slot glowing soft jade green, on state',
  'knob': 'a round polished ivory jade bead',
  'rod': 'a dark lacquered wooden scroll rod with gold end caps',
}

# ---------- vẽ đè giữ nguyên hình (cảnh núi, bản đồ, sân trận, núi xa) ----------
# Gửi bản vẽ code trên nền giấy; alpha cuối lấy từ bản code nên không cần tách nền (nền hồng làm phần mờ ám hồng).
TRACE = ('Image 1 is a rough placeholder of {what} from our game, on a plain paper background. Image 2 is the ART STYLE reference. '
         'Repaint image 1 in exactly the art style of image 2 — ' + INK + '. '
         'Keep EXACTLY the same silhouette, outline, position, size and proportions as image 1 — trace over it, only change the painting inside. '
         'Keep the plain flat paper-colored background around it unchanged. ' + NO_TEXT)
TRACE_WHAT = {  # tiền tố key → mô tả
  'peak': 'a tall misty mountain peak, grey-blue rock with vertical ink texture strokes, a little malachite green at the summit, dissolving into mist at the bottom',
  'ledge': 'a flat-topped cliff ledge: a thin band of malachite-green grass on top, grey-blue rock cliff face below with vertical ink texture strokes, dissolving into mist at the bottom',
  'stair': 'a narrow winding stone staircase climbing a mountainside',
  'far1': 'a strip of distant misty mountain silhouettes, pale blue-grey ink wash',
  'far2': 'a strip of distant misty mountain silhouettes, very pale blue-grey ink wash',
  'map': 'a regional map painted on rice paper: small ink-wash mountains, a winding blue river, a few pine trees, faint paths',
}
# Sân trận: bản wild vẽ đè từ bản code, các cảnh khác sửa từ bản wild.
FIELD_THEMES = {
  'wild': 'a wild grassland battlefield: soft blue sky, distant misty mountains, a wide green meadow, a few grey rocks at the edges',
  'forest': 'a deep ancient forest clearing battlefield: tall dark green trees at the edges, mossy ground, soft green light',
  'fire': 'a scorched volcanic battlefield: red-orange sky, black rock, glowing lava cracks at the edges, embers',
  'ice': 'a frozen glacier battlefield: pale icy sky, snow-covered ground, blue ice crystals at the edges',
  'storm': 'an overcast battlefield under grey-violet thunderclouds, wet ground, faint lightning in the distance, medium brightness (the game tints it darker)',
}
def field_theme(theme):
  return ('Image 1 is a battlefield background from our game. Repaint it as ' + FIELD_THEMES[theme] + ', keeping exactly the same composition, '
          'horizon height, viewpoint and ink-wash art style (image 2 is the style reference) — ' + INK + '. Keep the middle of the field open and '
          'uncluttered for troops. ' + NO_TEXT)

# ---------- vân giấy, nét cọ ----------
PAPER = ('A seamless tileable texture of warm ivory handmade rice paper with subtle long fibers and very soft mottling, low contrast, evenly lit, '
         'no stains, no borders, no objects. ' + NO_TEXT)
STROKES = [('stroke', 'one long horizontal black ink brush stroke, dry-brush ends'), ('stroke-gold', 'one long horizontal gold paint brush stroke, dry-brush ends'),
           ('stroke-red', 'one long horizontal cinnabar-red brush stroke, dry-brush ends'), ('blot', 'one round black ink blot splash with soft bleeding edges'),
           ('_1', 'a small ink dot'), ('_2', 'a small ink dot'), ('_3', 'a small ink dot'), ('_4', 'a small ink dot'), ('_5', 'a small ink dot')]

# ---------- bộ giao diện sạch (26/9/2026) ----------
# Bản trước thiết kế riêng 43 da, món nào cũng hoa văn + loang màu → rối, lòe loẹt, hoa văn ở góc 9 mảnh đè chữ nút nhỏ.
# Nay chỉ vẽ 3 mẫu gốc sạch rồi suy ra mọi da: co giãn 9 mảnh đúng thông số từng da + đổi màu theo độ sáng (pipeline.nine, tint).
# Trang trí chỉ để ở khung bảng (scroll) và vài món riêng (đĩa, công tắc) — giao diện phải "yên" thì tranh mới nổi.
KIT_BASE = ('Image 1 is a placeholder UI element from our game on a magenta background. Repaint it as {design}, hand-painted with a light '
            'ink-brush touch on the outline only. ONE flat even color inside, NO ornaments, NO corner motifs, NO clouds, NO flowers, NO stains, '
            'NO watercolor blooms, NO texture patches — quiet and clean. Keep EXACTLY the same outer silhouette, size and proportions as image 1. '
            'Keep the solid flat pure magenta (#FF00FF) background around it.')
KIT_BASES = {  # mẫu gốc → (da vẽ bằng code làm khuôn, mô tả)
  'paper': ('card-plain', 'a clean sheet of warm ivory paper with a thin, even, dark ink brush border line along the edge'),
  'plate': ('btn', 'a flat lacquered plate in one even medium grey, with a thin darker rim line and a faint soft highlight along the top edge'),
  'pill': ('capsule', 'a flat rounded pill label in one even light grey, with a thin dark ink outline'),
  'disc': ('disc-paper', 'a flat round medallion in one even light grey, with a thin dark ink outline and a faint soft highlight on the upper left'),
}
# Sơn mài (27/9/2026): (mẫu gốc, màu phần tối = viền, màu phần sáng = lòng). Lòng lam sẫm, viền đồng cổ mảnh — không mảng vàng.
# Trước đó là tông giấy ngà: người chơi thấy "vàng quá, giống giấy, rẻ tiền".
RIM, FACE, FACE2, LINE, DEEP = '#9a8456', '#1b2c30', '#22363a', '#4f676b', '#0f1a1c'
# Mẫu gốc có trang trí (sơn mài): góc đồng chạm khắc — thứ làm khung "ra game" thay vì hình chữ nhật trơn. Ảnh 2 = concept đã chọn.
KIT_ORNATE = ('Image 1 is a placeholder UI element from our game on a magenta background. Image 2 is our approved UI concept (style reference). '
  'Repaint image 1 as {design}. Premium studio mobile game UI piece in the style of image 2: crafted, with subtle bevel and depth. '
  'The face is ONE flat even dark color with no texture patches, no stains and no pattern, so text can sit on it; the ornaments stay ONLY '
  'at the corners / the two ends. Restrained metal: thin antique bronze, not bright yellow gold. No text, no icons. '
  'Keep EXACTLY the same outer silhouette, size and proportions as image 1. Keep the solid flat pure magenta (#FF00FF) background around it.')
KIT_BASES.update({
  'ornate': ('card-plain', 'a dark teal lacquer panel with a thin engraved antique-bronze rim line and small ornate carved bronze '
             'corner brackets with a cloud-scroll motif at each of the four corners', KIT_ORNATE),
  'plaque': ('btn', 'a lacquered button plaque in one even medium grey, with a thin bronze rim and small carved bronze end caps on the '
             'left and right ends, a soft highlight along the top edge', KIT_ORNATE),
})
# viền 9 mảnh riêng của mẫu gốc có góc chạm (px ảnh 2x trên mẫu đã khớp khung) — góc chạm to hơn lát của da vẽ bằng code
KIT_BINS = {'ornate': [56, 56, 56, 56]}  # phủ trọn hoa văn góc — nhỏ hơn thì đuôi hoa văn lọt vào cạnh và bị lặp
KIT_REFS = {'ornate': 'concept-home-lacquer', 'plaque': 'concept-home-lacquer'}  # ảnh .work/raw/<tên>.webp gửi kèm làm ảnh 2
KIT = {  # da (ui/theme.ts) → (mẫu gốc, màu tối, màu sáng[, bề dày viền px CSS]). Thẻ, nhãn, viên, rãnh, nút tròn: tools/art/chrome.py
  # khung (thẻ, bảng, HUD): viền kép mảnh vẽ bằng code (chrome.py DOUBLE) — mẫu góc chạm 'ornate' vẫn còn nhưng không dùng: nặng, rẻ
  # nút: tấm sơn mài đầu bịt đồng, chỉ nhuộm mặt
  # màu sơn trầm (son đỏ thắm, ngọc lam) — không đỏ tươi bão hoà như nhựa
  'btn': ('plaque', '#2f6b64', None, 16), 'btn-gold': ('plaque', '#b3372a', None, 16), 'btn-danger': ('plaque', '#6e1f18', None, 16),
  'btn-off': ('plaque', '#c9ccc5', None, 16), 'btn-ghost': ('plaque', '#f3f4f0', None, 16),
}

# ---------- mây (key động: fog:<rộng>:<hạt>, cloud:…, thunder:…) ----------
# Mây vẽ bằng code (viền xoắn ốc đậm, kiểu hoạt hình) lệch hẳn nền thủy mặc — nhất là tài khoản mới, ô khoá phủ đầy mây.
# Game chọn 1 trong 3 biến thể theo key (stage.ts artFor: 'fog:*0'…'fog:*2') cho các đám cạnh nhau khỏi giống hệt.
CLOUD_NOTE = ('Soft traditional ink-wash clouds: pale white and very light grey washes with soft bleeding edges and only a faint, broken ink contour, '
              'a flat soft base, NO spiral curls, NO thick outlines, NO cartoon style. ')
CLOUD_SHEET = [(f'fog:*{i}', f'a wide soft bank of low mountain cloud, variant {i + 1}, wider than tall') for i in range(3)] + \
              [(f'cloud:*{i}', f'a small drifting sky cloud, variant {i + 1}, wider than tall') for i in range(3)] + \
              [(f'thunder:*{i}', f'a dark grey-violet storm cloud with a faint glow inside, variant {i + 1}, wider than tall') for i in range(3)]

# ---------- concept giao diện (27/9/2026) ----------
# Người dùng: giao diện "vẫn như web app, chưa ra chất RoK tu tiên, chưa như studio làm". Vẽ concept toàn màn trước khi làm
# từng mảnh (như studio): ảnh 1 = ảnh chụp màn hiện tại (giữ bố cục, cảnh, chữ), vẽ lại toàn bộ lớp giao diện theo hướng đã chọn.
CONCEPT_BASE = ('Image 1 is a screenshot of our mobile cultivation-sect strategy game (like Rise of Kingdoms, but Chinese xianxia). '
  'Redesign ONLY the user interface layer as a premium, studio-made mobile game UI — the painted mountain scene and buildings stay. '
  'Keep the same layout and the same elements in the same places (portrait, sect name, power, resources, quest card, side buttons, bottom tab bar, '
  'building name plates, chat line); keep the Vietnamese text as it is. The UI must NOT look like a web app: no flat rounded rectangles, '
  'no plain cards, no thin outlines. Instead: sculpted, layered game UI pieces with depth, bevels, carved ornamental corners, '
  'crafted materials, soft inner shadows, a clear hierarchy (one big glowing primary action), round medallion buttons with ornate rims, '
  'title plaques and ribbons, notification badges like red wax seals. Keep interiors clean and readable. {style}')
CONCEPT_STYLES = {
  'lacquer': 'Style: dark lacquered wood and deep teal enamel with engraved antique-gold trim, translucent dark HUD bars over the scene, '
             'gold-ringed medallion buttons, a carved dark-wood bottom tab bar where the selected tab rises in a glowing jade socket, '
             'warm gold highlights — rich and heroic like Rise of Kingdoms.',
  'jade': 'Style: white jade and pale celadon porcelain with gold cloud-pattern filigree corners, silk ribbon banners for titles, '
          'round jade disc buttons with gold rims, pale rice-paper panels inside carved jade frames — elegant, airy, immortal-realm xianxia '
          'like premium Chinese cultivation games.',
}

# ---------- concept sáng tạo (27/9/2026) ----------
# Người dùng: "HUD không sáng tạo, menu để như app, UI khác làm cho có". Hướng: giao diện là ĐỒ VẬT trong thế giới tông môn tu tiên,
# không phải widget web. Ảnh mẫu: game quảng cáo người dùng gửi (.work/concept/ad-*.png) — chibi thủy mặc, trắng sương, mực, son.
CREATIVE_STYLE = ('Palette: cool misty white paper, black ink linework, cinnabar red accents, soft jade and pale gold — NOT yellow paper, '
  'NOT dark panels. Hand-drawn, one consistent cute chibi ink-wash style like the reference image. Crafted, studio-quality mobile game UI, '
  'NOT a web app: no full-width bars, no app tab bar, no plain rectangular cards, no paragraphs of text. Vietnamese labels only, '
  'no Chinese characters. Portrait phone screen.')
CREATIVE = {  # tên → (ảnh bố cục của mình, ảnh mẫu phong cách, mô tả)
  'home': ('home-src.png', 'ad-home.png',
    'Image 1 is our current home screen (keep the painted mountain sect with its buildings and name plates). Image 2 is the style and '
    'quality reference. Redesign the HUD and navigation as diegetic objects of a xianxia sect: '
    'TOP-LEFT: the sect master portrait inside a round jade disc with a thin glowing qi ring around it showing cultivation progress, the realm '
    'name "Trúc Cơ · tầng 8" on a small red silk ribbon below. TOP-RIGHT: three resources shown as small illustrated containers — a jade bowl '
    'of blue spirit stones, a woven basket of spirit herbs, a small cart of ore — each with its number on a dark ink pill and a tiny "+". '
    'Beside them a small round sundial medallion showing daytime and the season. LEFT EDGE: two round ink-circle buttons with hand-lettered '
    'labels "Thư" and "Sự kiện". RIGHT EDGE: a vertical column of three small illustrated event paintings with characters and short labels, '
    'with a small red arrow tab to collapse it. The current quest is a paper notice pinned on a little wooden signboard standing in the scene, '
    'with a small red seal button "Nhận". A tiny chibi worker with a hammer stands near the bottom right with a hanging wooden timer tag. '
    'BOTTOM: five round illustrated medallions resting on a soft cloud band — sect gate "Tông môn", a disciple "Môn hạ", a map scroll "Bản đồ", '
    'two banners "Tiên minh", a treasure chest "Bảo khố" — each with a vertical red ribbon label; the selected one rises larger with a red seal '
    'stamp behind it. '),
  'monha': ('panel-src.png', 'ad-panel.png',
    'Image 1 is one of our current panels (layout reference only). Image 2 is the style and quality reference. Draw our DISCIPLES screen '
    '"Môn hạ" as a hall of hanging portrait scrolls: full screen on misty paper with faint ink mountains at the bottom; a hand-lettered brush '
    'title "Môn hạ" at the top-left with a brush stroke under it; on the left edge a vertical silk bookmark tab "Trưởng lão"; at the top the '
    'active team as five round portraits sitting on a wooden beam, each with a name ribbon and a power number; below, a grid of disciple '
    'portrait scrolls (chibi busts) with small name ribbons, a little status stamp "Rảnh" or "Đang tu", and a power number with an icon; '
    'at the bottom a dark ink strip with tabs where the active tab sits on a red seal; a back button shaped like a curling cloud. '),
  'nangcap': ('panel-src.png', 'ad-panel.png',
    'Image 1 is one of our current building panels (layout reference only). Image 2 is the style and quality reference. Draw the building '
    'UPGRADE screen for "Đan phòng" as a ceremony: a hand-lettered brush title at the top; in the middle, the current building painting on '
    'the left and the next, grander tier on the right glowing softly, joined by an ornate ink arrow; below, the required resources laid out '
    'as offerings on a small red lacquer altar table (spirit stones, herbs, ore, each with a number); a large round red seal button '
    '"Nâng cấp" with a small timer beside it; a tiny "?" to open the description; a back button shaped like a curling cloud. '),
}

# ---------- đồ vật giao diện theo concept sáng tạo (27/9/2026) ----------
# Ảnh 1 = concept màn chính đã chốt (.work/raw/creative-home.webp): vẽ đúng phong cách đó. Lưu thành 'ui:<tên>' trong manifest.
def uisheet(items, what):
  lst = ' '.join(f'{i + 1}) {d}.' for i, (_, d) in enumerate(items))
  return ('Image 1 is our approved game UI concept: it is the ART STYLE reference (hand-drawn chibi ink-wash, black ink lines, misty white, '
          f'cinnabar red, soft jade). Paint a sheet of 9 separate {what} in exactly this style, clean and readable at small size. '
          f'Arrange them in a neat 3 by 3 grid, row by row from the top-left: {lst} Each one is a single object centered in its own cell, '
          f'all about the same size, with wide empty gaps, nothing crossing into another cell. {NO_TEXT} {MAGENTA}')
MEDAL = 'a round medallion: a misty white paper disc with a thin black ink rim, a small painting inside of '
TILE = 'a small square framed painting: misty white paper inside a thin black ink line frame, painted inside: '
UI_SHEETS = {
  'U1': [('nav-tongMon', MEDAL + 'a small Chinese sect gate archway with a jade-green roof'),
         ('nav-monHa', MEDAL + 'a young chibi disciple in blue robes, bust'),
         ('nav-banDo', MEDAL + 'a partly unrolled old map scroll'),
         ('nav-tienMinh', MEDAL + 'two crossed red and blue banners'),
         ('nav-baoKho', MEDAL + 'a red lacquered treasure chest with gold fittings'),
         ('res-linhThach', 'a jade-green bowl heaped with glowing pale-blue spirit crystals'),
         ('res-linhThao', 'a small woven basket full of green spirit herbs with a golden flower'),
         ('res-linhKhoang', 'a small wooden cart loaded with grey ore and purple crystals'),
         ('sundial', 'a round stone sundial medallion with a jade rim, a small sun on one side and a crescent moon on the other')],
  'U2': [('frame-portrait', 'an empty round jade ring frame with a thin gold inner rim, the hollow center is empty magenta background'),
         ('ribbon', 'a horizontal red silk ribbon banner with swallowtail ends, blank'),
         ('signboard', 'a small wooden signboard standing on two posts with a blank white paper notice pinned by a red pin'),
         ('worker', 'a tiny chibi worker in grey work clothes holding a hammer over the shoulder, full body, standing'),
         ('tag', 'a small hanging wooden tag with a red cord and tassel, blank'),
         ('back', 'a curling ink-wash cloud shape with a bold left-pointing arrow inside'),
         ('seal', 'a round cinnabar red seal stamp with an inner ring, blank, slightly irregular edges'),
         ('ribbon-v', 'a vertical red ribbon label banner with a notched bottom, blank'),
         ('ring', 'a round black ink brush circle (enso) with an empty center')],
  'U3': [('ev-fest', TILE + 'a festival night with red lanterns and a chibi girl holding a lantern'),
         ('ev-arena', TILE + 'two chibi swordsmen dueling on a stone platform'),
         ('ev-daily', TILE + 'a wooden board with paper talismans pinned on it'),
         ('ev-vip', TILE + 'a bronze incense burner with rising smoke before a small shrine'),
         ('ev-mail', TILE + 'a white crane carrying a sealed letter'),
         ('ev-help', TILE + 'two chibi disciples joining hands, helping each other'),
         ('ev-tavern', TILE + 'a small recruitment hall with a red lantern and a guest arriving'),
         ('ev-market', TILE + 'a small market stall with goods and a chibi merchant'),
         ('ev-report', TILE + 'a sealed battle report scroll with crossed swords')],
}
