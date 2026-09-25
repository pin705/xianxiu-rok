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
}

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
TROOP_SHEETS = {'S0': soldier_items(0), 'S1': soldier_items(1)}
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
KIT = {  # da (ui/theme.ts) → (mẫu gốc, màu tối: viền / nền tối, màu sáng: lòng) — plate: màu chính, sáng tối tự suy
  'card': ('paper', '#2b2622', '#f3ead6'), 'card-plain': ('paper', '#8a7d6b', '#f3ead6'), 'card-sel': ('paper', '#b3372a', '#f5ead6'),
  'card-glow': ('paper', '#b8913a', '#f7eccc'), 'card-silk': ('paper', '#3f4d52', '#d9e1dd'), 'groove': ('paper', '#8b806f', '#e4d9c2'),
  'field': ('paper', '#6b6256', '#fbf6ea'), 'toast': ('paper', '#2b2622', '#f3ead6'), 'toast-bad': ('paper', '#b3372a', '#f6ddd4'),
  'slip': ('paper', '#4f6461', '#f3ead6'), 'slip-bad': ('paper', '#b3372a', '#f6ddd4'), 'btn-ghost': ('paper', '#2b2622', '#f3ead6'),
  'btn': ('plate', '#2d4c7c', None), 'btn-gold': ('plate', '#c79d3b', None), 'btn-danger': ('plate', '#b3372a', None),
  'btn-off': ('plate', '#ddd3c1', None),  # sáng: chữ nút khoá (mực nhạt) phải đọc được
  # khung: HUD, thanh tab, cột trái (strip), bảng (scroll) — dải xanh ngọc phẳng viền mực; lòng không vẽ (nền giấy của trang)
  'strip': ('paper', '#3f4d52', '#cddad6'), 'scroll': ('paper', '#3f4d52', '#b9cbc6'),
  'switch': ('pill', '#6b6256', '#e4d9c2'), 'switch-on': ('pill', '#2f6b3d', '#8fcf96'),
  'disc-paper': ('disc', '#5f5548', '#f3ead6'), 'disc-azure': ('disc', '#1f3a5f', '#8fb0d2'), 'disc-gold': ('disc', '#7a5a18', '#e0bb58'),
  'disc-silk': ('disc', '#3f4d52', '#cddad6'),
  'capsule': ('pill', '#5f5548', '#f3ead6'), 'plate': ('pill', '#5f5548', '#f3ead6'), 'tag': ('pill', '#6b6256', '#e9dec6'),
  'tag-good': ('pill', '#3f7a4f', '#dfeadb'), 'tag-bad': ('pill', '#b3372a', '#f5dcd5'), 'tag-gold': ('pill', '#a98530', '#f3e4b8'),
  'tag-dark': ('pill', '#c9a14a', '#3a3632'), 'tag-red': ('pill', '#7d2218', '#b3372a'), 'tag-silk': ('pill', '#3f4d52', '#d9e1dd'),
  'badge': ('pill', '#7d2218', '#c0392b'), 'badge-fresh': ('pill', '#8a6a1f', '#d4ab45'), 'track': ('pill', '#3a332c', '#8b806f'),
  'fill': ('pill', '#2f6f7a', '#6fc3cf'), 'fill-gold': ('pill', '#8a6a1f', '#e0bb58'), 'fill-good': ('pill', '#2f6b3d', '#7fbf7a'),
  'fill-bad': ('pill', '#7d2218', '#d45a45'), 'fill-azure': ('pill', '#2d4c7c', '#6f9fd8'),
}

# ---------- mây (key động: fog:<rộng>:<hạt>, cloud:…, thunder:…) ----------
# Mây vẽ bằng code (viền xoắn ốc đậm, kiểu hoạt hình) lệch hẳn nền thủy mặc — nhất là tài khoản mới, ô khoá phủ đầy mây.
# Game chọn 1 trong 3 biến thể theo key (stage.ts artFor: 'fog:*0'…'fog:*2') cho các đám cạnh nhau khỏi giống hệt.
CLOUD_NOTE = ('Soft traditional ink-wash clouds: pale white and very light grey washes with soft bleeding edges and only a faint, broken ink contour, '
              'a flat soft base, NO spiral curls, NO thick outlines, NO cartoon style. ')
CLOUD_SHEET = [(f'fog:*{i}', f'a wide soft bank of low mountain cloud, variant {i + 1}, wider than tall') for i in range(3)] + \
              [(f'cloud:*{i}', f'a small drifting sky cloud, variant {i + 1}, wider than tall') for i in range(3)] + \
              [(f'thunder:*{i}', f'a dark grey-violet storm cloud with a faint glow inside, variant {i + 1}, wider than tall') for i in range(3)]
