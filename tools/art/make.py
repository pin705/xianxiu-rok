# Vẽ và ghép tranh vào game. Mỗi nhóm: vẽ (bỏ qua ảnh đã có trong .work/raw) rồi ghép vào apps/client/public/art + manifest.
#   tools/art/.venv/bin/python tools/art/make.py <nhóm> [tên…] [--fit] [--dry]
#   --fit: chỉ ghép lại từ ảnh thô đã có (không gọi API) · --dry: in prompt, không gọi API
# Nhóm: buildings faces icons emblems figures landmarks masks props troops beasts skins scenery fields map far paper strokes
# Xong thì chạy `pack` (chia gói theo cảnh + dựng atlas) — game nạp theo gói.
import json, os, sys
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image
import prompts as P
import pipeline as X
from imgstudio import generate

args = [a for a in sys.argv[1:] if not a.startswith('--')]
FIT, DRY = '--fit' in sys.argv, '--dry' in sys.argv
STYLE = os.path.join(X.ANCHORS, 'style.jpg')     # công trình thủy mặc trên nền hồng: mẫu phong cách chung
ICONS = os.path.join(X.ANCHORS, 'icons.jpg')     # 4 icon sạch: mẫu cho bảng 3×3 và da giao diện
FACE = os.path.join(X.ANCHORS, 'face.jpg')       # chân dung chưởng môn: mẫu khung + phong cách chân dung

def run(jobs):
  """jobs: [(tên ảnh thô, prompt, ảnh mẫu, tỉ lệ, độ phân giải)] — 3 việc song song (API ~3 ảnh/phút)"""
  todo = [j for j in jobs if not os.path.exists(X.raw(j[0]))]
  if FIT or not todo: return
  if DRY:
    for name, prompt, refs, aspect, res in todo: print(f'— {name} [{aspect} {res}] refs={[os.path.basename(r) for r in refs]}\n{prompt}\n')
    sys.exit(0)
  def one(j):
    name, prompt, refs, aspect, res = j
    try: generate(X.raw(name), prompt, refs, aspect=aspect, resolution=res)
    except Exception as e: print('✗', e, flush=True)
  with ThreadPoolExecutor(3) as ex: list(ex.map(one, todo))

def pick(table):
  return {k: v for k, v in table.items() if not args[1:] or k in args[1:]}

# ---------- công trình ----------
def buildings():
  ids = pick(P.BUILDINGS)
  own = lambda bid: os.path.join(X.ART, 'bld', f'bld-{bid}-2.webp')  # bậc 2 đang có trong game: gốc để vẽ các bậc khác
  def keyed(name):  # ảnh thô nền hồng → PNG nền trong cạnh nó
    X.key_magenta(X.raw(name), X.raw(name) + '.png')
    return X.raw(name) + '.png'
  # bậc 2: bố cục lấy từ bản đang có, công trình mới thì từ bản vẽ code (.work/proc/bld-<id>-2-0.png, export.ts)
  run([(f'bld-{bid}-2', P.building_new(bid),
        [X.ref(STYLE), X.ref(own(bid) if os.path.exists(own(bid)) else os.path.join(X.WORK, 'proc', f'bld-{bid}-2-0.png'), magenta=True)],
        P.BUILDINGS[bid][2], '1K') for bid in ids])
  for bid in ids:  # ghép bậc 2 trước: các bậc khác sửa từ nó
    if os.path.exists(X.raw(f'bld-{bid}-2')): X.save_building(bid, 2, keyed(f'bld-{bid}-2'))
  run([(f'bld-{bid}-{t}', P.building_tier(bid, t), [X.ref(STYLE), X.ref(own(bid), magenta=True)],
        '16:9' if bid == 'chuDien' and t >= 3 else P.BUILDINGS[bid][2], '1K') for bid in ids for t in (1, 3, 4, 5)])
  for bid in ids:
    for t in (1, 3, 4, 5):
      if os.path.exists(X.raw(f'bld-{bid}-{t}')): X.save_building(bid, t, keyed(f'bld-{bid}-{t}'))

# ---------- chân dung ----------
def faces():
  ids = pick(P.FACES)
  def job(fid):
    bg, who = P.FACES[fid]
    old = os.path.join(X.ART, 'face', f'face-{fid}.webp')  # bản cũ (nếu có) giữ dáng nhân vật
    who_ref = 'Image 2 shows WHO to draw.' if os.path.exists(old) else ''
    return (f'face-{fid}', P.FACE.format(who_ref=who_ref, who=who, bg=bg), [X.ref(FACE)] + ([X.ref(old)] if who_ref else []), '1:1', '1K')
  run([job(f) for f in ids])
  for fid in ids:
    if os.path.exists(X.raw(f'face-{fid}')):
      im = Image.open(X.raw(f'face-{fid}')).convert('RGBA')
      X.save(f'face:{fid}', X.fit_square(im, max(288, X.dom_side(f'face:{fid}')), 0), 'face')

# ---------- các bảng 3×3 ----------
def sheets(tables, what, extra='', parts=False, skip=None):
  run([(f'sheet-{sid}', P.sheet(items, what, extra), [X.ref(ICONS)], '1:1', '2K') for sid, items in pick(tables).items()])
  cells = {}
  for sid, items in pick(tables).items():
    if os.path.exists(X.raw(f'sheet-{sid}')):
      k = X.raw(f'sheet-{sid}') + '.png'
      X.key_magenta(X.raw(f'sheet-{sid}'), k)
      cells.update(X.cut_sheet(k, items, parts, (skip or {}).get(sid, ())))
  return cells

def icons():
  for name, im in sheets(P.ICON_SHEETS, 'game item icons', skip=P.ICON_SKIP).items():
    key = name if name.startswith('tab:') or name == 'pointer' else f'icon:{name}'
    X.save(key, X.fit_square(im, X.dom_side(key, 144)), 'icon')

def emblems():
  for name, im in sheets(P.EMBLEM_SHEETS, 'emblem figures for round medallions', P.EMBLEM_NOTE, parts=True).items():
    X.save(f'emblem:{name}', X.fit_square(im, 128, 0.02), 'emblem', tex=True)  # medal() vẽ lên đĩa: nằm trong gói boot; 128 px đủ cho huy hiệu to nhất (logo 104 px CSS)

def figures():  # tổ sư chín đạo thống: một bảng; model hay xếp 4 + 5 hình, đổi chỗ (thứ tự thật: P.FIGURES_DRAWN)
  run([('sheet-figures', P.figures_sheet(), [X.ref(FACE)], '1:1', '2K')])
  if not os.path.exists(X.raw('sheet-figures')): return
  k = X.raw('sheet-figures') + '.png'
  X.key_magenta(X.raw('sheet-figures'), k)
  im = Image.open(k).convert('RGBA')
  bs = X.blobs(im)
  if len(bs) != len(P.FIGURES_DRAWN): sys.exit(f'sheet-figures: {len(bs)} hình ≠ {len(P.FIGURES_DRAWN)} — sửa FIGURES_DRAWN')
  for i, (ys, xs) in enumerate(bs):
    # mỗi hình lấy trọn khoảng tới giữa hai hình bên cạnh cùng hàng: giữ mảnh rời (lửa trên tay, hổ con), mảnh lấn mép thì main_blob bỏ
    prev = bs[i - 1][1] if i and bs[i - 1][1].start < xs.start else None
    nxt = bs[i + 1][1] if i + 1 < len(bs) and bs[i + 1][1].start > xs.start else None
    box = ((prev.stop + xs.start) // 2 if prev else 0, max(0, ys.start - 24), (xs.stop + nxt.start) // 2 if nxt else im.width, min(im.height, ys.stop + 24))
    c = X.trim(X.main_blob(X.depink(im.crop(box)), 0.015))  # lửa trên tay ~1,9 %, mẩu tay áo hình bên ~1,1 %
    X.save(f'fig:{P.FIGURES_DRAWN[i]}', X.fit_square(c, 720, 0.02, 0.75), 'fig')  # 3:4, ~360 px CSS trên màn 2x

def landmarks():  # trấn phái chi bảo: bảng 3×3, khớp hộp LANDMARK_BOX (chân chạm đáy), 3 px/DU (HD 6)
  w, h = P.LANDMARK_BOX
  box = Image.new('RGBA', (w * 4, h * 4), (0, 0, 0, 255))  # bản code "đầy hộp": fit_prop đặt tranh vừa hộp, chân chạm đáy
  for name, im in sheets({'L1': P.LANDMARKS}, 'scenery landmarks for a mountain sect scene', 'Each one stands upright on its own small stone base, seen from the front with a slight top-down angle. ', parts=True).items():
    X.save(f'lm:{name}', X.fit_prop(im, box, 1, 0.75), 'scene', tex=True, hd=X.fit_prop(im, box, 1, 1.5))

def masks():
  for name, im in sheets(P.MASK_SHEETS, 'UI glyph icons', P.MASK_NOTE, parts=True).items():
    a = np.asarray(X.fit_square(im, X.dom_side(f'mask:{name}'), 0.04)).copy()
    a[..., :3] = 0  # game chỉ dùng alpha, tô bằng màu chữ
    X.save(f'mask:{name}', Image.fromarray(a, 'RGBA'), 'icon', fmt='PNG')

def props():
  for name, im in sheets(P.PROP_SHEETS, 'scenery props for a mountain sect scene', 'Each prop stands upright on its own base. ').items():
    for key in P.PROP_KEYS.get(name, []):
      try:
        pim, _ = X.proc(key)
        X.save(key, X.fit_prop(im, pim), 'scene', tex=True, hd=X.fit_prop(im, pim, k=3))
      except (KeyError, FileNotFoundError):  # ảnh HTML (hoa sen, vòng sáng) không có trong cache texture: ghép theo hộp trong keys.json
        k = X.KEYS.get(key)
        if k and k['kind'] == 'dom': X.save(key, X.fit_square(im, X.dom_side(key), 0.03, k['w'] / k['h']), 'scene')

def troops():
  ref_im, _ = X.proc('sold:kiem:0:3')  # mọi quân cùng một hộp
  for key, im in sheets(P.TROOP_SHEETS, 'tiny chibi battle troops').items():
    X.save(key, X.fit_prop(im, ref_im), 'battle', tex=True, hd=X.fit_prop(im, ref_im, k=3))

def beasts():
  run([('sheet-beasts', P.sheet(P.BEAST_SHEET, 'battle beasts', P.BEAST_NOTE), [X.ref(ICONS)], '1:1', '2K')])
  if not os.path.exists(X.raw('sheet-beasts')): return
  k = X.raw('sheet-beasts') + '.png'
  X.key_magenta(X.raw('sheet-beasts'), k)
  ref_im, _ = X.proc('beast:the:#a8784a')  # ba hệ cùng một hộp
  for key, im in X.cut_sheet(k, P.BEAST_SHEET, False).items():
    X.save(key, X.fit_prop(im, ref_im, 1.0), 'battle', tex=True, hd=X.fit_prop(im, ref_im, 1.0, k=3))

# ---------- da giao diện ----------
def skins():
  meta = json.load(open(os.path.join(X.WORK, 'skins', 'meta.json')))
  names = pick(P.SKINS)
  pads = {n: X.padded(os.path.join(X.WORK, 'skins', f'{n}.png'), (255, 0, 255, 255), 'skin') for n in names}
  run([(f'skin-{n}', P.SKIN.format(design=P.SKINS[n]), [pads[n][0], X.ref(ICONS)], pads[n][1], '1K') for n in names])
  for n in names:
    if not os.path.exists(X.raw(f'skin-{n}')): continue
    k = X.raw(f'skin-{n}') + '.png'
    X.key_magenta(X.raw(f'skin-{n}'), k)
    base = Image.open(os.path.join(X.WORK, 'skins', f'{n}.png')).convert('RGBA')
    # 2 px ảnh mỗi px CSS (bản code S=2 → k=1): da nằm trong gói boot (đợi trước khi hiện game), 3x nặng gấp đôi mà viền mực mềm không nét hơn
    out = X.fit_trace(k, pads[n][2], base, 1.0)  # alpha của bản code: đúng đường bao
    m = meta[n]
    px = m['S'] * 1.0  # px ảnh mỗi px CSS
    extra = {}
    if m.get('slice') and any(m['slice']):
      extra = {'slice': [round(v * px) for v in m['slice']], 'width': m['slice'], 'outset': m.get('outset') or 0, 'repeat': m.get('repeat') or 'stretch'}
      if n not in ('scroll', 'strip'): out = X.calm(out, extra['slice'])  # hai da này không vẽ lòng
    X.save(f'skin:{n}', out, 'skin', extra=extra)

# mẫu gốc cắt thẳng từ ảnh vẽ: (bề ngang px ảnh 3x, hàm → viền 9 mảnh trên mẫu). ornate: góc chạm ~23% bề ngang, 36% bề cao;
# plaque: đầu bịt đồng ~6% bề ngang mỗi bên, góc bo ~20% bề cao
HIRES = {
  'ornate': (420, lambda im: [round(im.width * 0.24)] * 4),
  'plaque': (640, lambda im: [round(im.height * 0.3), round(im.height * 0.5), round(im.height * 0.3), round(im.height * 0.5)]),
}

# da khung viền (border-image): WebP chất lượng cao — PNG 3x nặng 2,5 MB chặn màn tải; WebP 92 còn ~0,3 MB, nét mực đôi vẫn sắc
SKIN_Q = 92

def kit():
  """bộ giao diện sạch: 3 mẫu gốc (KIT_BASES) → mọi da trong KIT, đúng khung + thông số 9 mảnh của từng da (bản vẽ code)"""
  meta = json.load(open(os.path.join(X.WORK, 'skins', 'meta.json')))
  pads = {b: X.padded(os.path.join(X.WORK, 'skins', f'{v[0]}.png'), (255, 0, 255, 255), 'kit') for b, v in P.KIT_BASES.items()}
  def refs(b):
    r = [pads[b][0]]
    c = getattr(P, 'KIT_REFS', {}).get(b)
    if c and os.path.exists(X.raw(c)): r.append(X.ref(X.raw(c)))
    return r
  run([(f'kit-{b}', (v[2] if len(v) > 2 else P.KIT_BASE).format(design=v[1]), refs(b), pads[b][1], '1K') for b, v in P.KIT_BASES.items()])
  bases = {}
  for b, v in P.KIT_BASES.items():
    src = v[0]
    if not os.path.exists(X.raw(f'kit-{b}')): continue
    k = X.raw(f'kit-{b}') + '.png'
    X.key_magenta(X.raw(f'kit-{b}'), k)
    if b in HIRES:  # khung/nút vẽ tay: cắt thẳng từ ảnh gốc ở độ nét 3x (không qua khổ bản code rồi phóng lên)
      img = X.raw_frame(k, HIRES[b][0])
      if b == 'ornate': img = X.symmetric(img)
      bases[b] = (img, HIRES[b][1](img))
      continue
    img = X.fit_trace(k, pads[b][2], Image.open(os.path.join(X.WORK, 'skins', f'{src}.png')).convert('RGBA'), 1.0)
    if b not in ('plate', 'plaque'): img = X.symmetric(img)  # tấm sơn mài giữ vệt sáng phía trên
    bases[b] = (img, [v * meta[src]['S'] for v in meta[src]['slice']])
  for n, entry in pick(P.KIT).items():
    b, dark, light = entry[:3]
    if b not in bases: continue
    m = meta[n]
    if b in HIRES:  # xuất 3x (px ảnh = px CSS × 3) — sắc trên iPhone, không phóng
      img, bins = bases[b]
      W, H = round(m['pw'] * 3 / m['S']), round(m['ph'] * 3 / m['S'])
      wcss = [entry[3]] * 4 if len(entry) > 3 else [round(v / 3) for v in bins]
      ins = [v * 3 for v in wcss]
      if dark: img = X.lacquer(img, dark)
      out = X.nine(img, bins, W, H, ins)
      X.save(f'skin:{n}', out, 'skin', extra={'slice': ins, 'width': wcss, 'outset': m.get('outset') or 0, 'repeat': 'stretch'}, q=SKIN_Q)
      continue
    ins = [v * m['S'] for v in m['slice']]  # ảnh 2x như bản code: px ảnh = px CSS × 2
    wcss = m['slice']
    if len(entry) > 3:  # mẫu có góc chạm: viền riêng (to hơn lát của bản code)
      wcss = [entry[3]] * 4
      ins = [entry[3] * m['S']] * 4
    if not any(ins): ins = [0, 0, 0, 0]  # ảnh nguyên tấm (đĩa, công tắc): co giãn cả tấm
    img, bins = bases[b]
    bins = getattr(P, 'KIT_BINS', {}).get(b, bins)
    if n in ('scroll', 'strip'):  # khung bảng/HUD: nền giấy của phần tử nằm dưới cả dải viền → cắt lề trong suốt, viền sát mép
      bx = img.getchannel('A').point(lambda v: 255 if v > 200 else 0).getbbox()
      img = img.crop(bx)
      bins = [max(2, bins[0] - bx[1]), max(2, bins[1] - (bases[b][0].width - bx[2])),
              max(2, bins[2] - (bases[b][0].height - bx[3])), max(2, bins[3] - bx[0])]
    if dark and b == 'plaque': img = X.tint_grey(img, dark)  # nút: nhuộm mặt, giữ viền đồng
    elif dark: img = X.tint(img, dark, light)  # (None, None): giữ màu vẽ sẵn — đổi màu trên cả mẫu gốc (đủ viền lẫn lòng) rồi mới co giãn: lòng phẳng không bị kéo nhiễu
    out = X.nine(img, bins, m['pw'], m['ph'], ins) if any(ins) else img.resize((m['pw'], m['ph']), Image.LANCZOS)
    extra = {'slice': ins, 'width': wcss, 'outset': m.get('outset') or 0, 'repeat': 'stretch' if len(entry) > 3 else (m.get('repeat') or 'stretch')}
    X.save(f'skin:{n}', out, 'skin', extra=extra)

def clouds():
  """mây: bảng 3×3 → 'fog:*0'…, 'cloud:*0'…, 'thunder:*0'… — khung 2:1, đáy mây ở 88% chiều cao (như neo của cloud() vẽ bằng code)"""
  def frame(im, W, H):
    s = min(W * 0.92 / im.width, H * 0.84 / im.height)
    a = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    out.alpha_composite(a, ((W - a.width) // 2, round(H * 0.88) - a.height))
    return out
  for key, im in sheets({'C1': P.CLOUD_SHEET}, 'cloud shapes', P.CLOUD_NOTE).items():
    X.save(key, frame(im, 512, 256), 'scene', tex=True, hd=frame(im, 1024, 512))

# ---------- vẽ đè giữ hình ----------
def trace(keys, k=1.5, sub='scene', res='2K'):
  metas = json.load(open(os.path.join(X.WORK, 'proc', 'meta.json')))
  keys = [key for key in keys if key in metas]
  pads = {key: X.padded(os.path.join(X.WORK, 'proc', X.fname(key) + '.png'), X.PAPER, 'trace') for key in keys}
  run([(f'trace-{X.fname(key)}', P.TRACE.format(what=P.TRACE_WHAT[key.split(':')[0]]), [pads[key][0], X.ref(STYLE)], pads[key][1], res) for key in keys])
  for key in keys:
    src = X.raw(f'trace-{X.fname(key)}')
    if os.path.exists(src):
      pim, _ = X.proc(key)
      k_hd = max(k, min(k * 2, X.raw_k(src, pads[key][2], pim)))  # bản HD: gấp đôi, không vượt độ phân giải thật của ảnh vẽ
      X.save(key, X.fit_trace(src, pads[key][2], pim, k), sub, tex=True, hd=X.fit_trace(src, pads[key][2], pim, k_hd))

def scenery():
  metas = json.load(open(os.path.join(X.WORK, 'proc', 'meta.json')))
  # vẽ ở 2K (ảnh 1K chỉ được 2–4 px/DU, desktop nhoè); bản thường 3 px/DU (k=1,5 trên bản code 2x), bản HD tới 6
  trace([key for key in metas if key.split(':')[0] in ('peak', 'ledge', 'stair') and (not args[1:] or key in args[1:])], 1.5)

def map_():
  trace(['map'], 0.75, 'map', '4K')  # 4K: bản đồ cao 1000 DU, desktop cần ~4 px/DU; bản thường 1,5 px/DU
  # tông môn trên bản đồ vùng: cùng hộp Chủ điện bậc 1, dùng tranh Chủ điện bậc 4 (mái lam) như bản vẽ code
  hd4 = os.path.join(X.WORK, 'hd', 'bld', 'bld-chuDien-4.webp')
  X.save('map:home', X.fit_building('chuDien', 1, os.path.join(X.ART, 'bld', 'bld-chuDien-4.webp')), 'map', tex=True,
         hd=X.fit_building('chuDien', 1, hd4 if os.path.exists(hd4) else os.path.join(X.ART, 'bld', 'bld-chuDien-4.webp'), S=X.S_HD))

def far():
  """dải núi xa 2600 DU: cắt 3 khúc chồng nhau, vẽ đè từng khúc, ghép lại mờ dần ở chỗ chồng, lấy alpha bản code"""
  for key in ('far1', 'far2'):
    try: pim, _ = X.proc(key)
    except (KeyError, FileNotFoundError): continue
    W, n, ov = pim.width, 3, 120
    step = (W - ov) / n
    parts = [(round(i * step), min(W, round((i + 1) * step + ov))) for i in range(n)]
    jobs, pads = [], []
    for i, (x0, x1) in enumerate(parts):
      src = os.path.join(X.WORK, 'ref', f'{key}-{i}.png')
      os.makedirs(os.path.dirname(src), exist_ok=True)
      pim.crop((x0, 0, x1, pim.height)).save(src)
      pads.append(X.padded(src, X.PAPER, 'trace'))
      jobs.append((f'trace-{key}-{i}', P.TRACE.format(what=P.TRACE_WHAT[key]), [pads[-1][0], X.ref(STYLE)], pads[-1][1], '1K'))
    run(jobs)
    if not all(os.path.exists(X.raw(f'trace-{key}-{i}')) for i in range(n)): continue
    acc = np.zeros((pim.height, W, 3), np.float32)
    wsum = np.zeros((pim.height, W, 1), np.float32)
    for i, (x0, x1) in enumerate(parts):
      tile = np.asarray(X.uncrop(Image.open(X.raw(f'trace-{key}-{i}')).convert('RGB'), pads[i][2]).resize((x1 - x0, pim.height), Image.LANCZOS), np.float32)
      ramp = np.clip(np.minimum(np.arange(x1 - x0) + 1, x1 - x0 - np.arange(x1 - x0)) / ov, 0.02, 1)[None, :, None]
      acc[:, x0:x1] += tile * ramp
      wsum[:, x0:x1] += ramp
    rgb = (acc / np.maximum(wsum, 1e-3)).astype(np.uint8)
    out = Image.fromarray(np.dstack([rgb, np.asarray(pim.getchannel('A'))]), 'RGBA')
    X.save(key, out, 'scene', tex=True)

def fields():
  wild = X.raw('trace-field-wild')
  pim, _ = X.proc('field:wild:400x866')
  pad = X.padded(os.path.join(X.WORK, 'proc', 'field-wild-400x866.png'), X.PAPER, 'trace')
  run([('trace-field-wild', P.TRACE.format(what='a battlefield background') + ' ' + P.FIELD_THEMES['wild'] + '.', [pad[0], X.ref(STYLE)], pad[1], '2K')])
  if not os.path.exists(wild): return
  full = X.uncrop(Image.open(wild).convert('RGB'), pad[2])
  hd = full.resize((min(1200, full.width), round(min(1200, full.width) * 866 / 400)), Image.LANCZOS)  # HD tới 3 px/DU
  base = full.resize((600, 1299), Image.LANCZOS)  # 1,5 px/DU: nền sau quân
  base_path = os.path.join(X.WORK, 'ref', 'field-wild-painted.png')
  hd.save(base_path)
  X.save('field:wild', base.convert('RGBA'), 'battle', tex=True, hd=hd.convert('RGBA'))
  themes = [t for t in P.FIELD_THEMES if t != 'wild' and (not args[1:] or t in args[1:])]
  run([(f'field-{t}', P.field_theme(t), [base_path, X.ref(STYLE)], '9:16', '2K') for t in themes])
  for t in themes:
    if os.path.exists(X.raw(f'field-{t}')):
      im = Image.open(X.raw(f'field-{t}')).convert('RGBA')
      hw = min(1200, im.width)
      X.save(f'field:{t}', im.resize((600, 1299), Image.LANCZOS), 'battle', tex=True, hd=im.resize((hw, round(hw * 866 / 400)), Image.LANCZOS))

# ---------- vân giấy, nét cọ ----------
def paper():
  run([('paper', P.PAPER, [], '1:1', '1K')])
  if not os.path.exists(X.raw('paper')): return
  N = 256  # lát 128 px CSS (theme.css background-size) ở 2x
  a = np.asarray(Image.open(X.raw('paper')).convert('RGB').resize((N, N), Image.LANCZOS), np.float32)
  rolled = np.roll(a, (N // 2, N // 2), (0, 1))  # mép của bản cuộn liền nhau khi lát
  d = np.minimum.outer(np.minimum(np.arange(N), N - 1 - np.arange(N)), np.minimum(np.arange(N), N - 1 - np.arange(N))) / (N // 2)
  wgt = np.clip(d * 2, 0, 1)[..., None]  # giữa lấy bản gốc (che đường nối giữa của bản cuộn), mép lấy bản cuộn
  tex = Image.fromarray((a * wgt + rolled * (1 - wgt)).astype(np.uint8)).convert('RGBA')
  # sơn mài: vân giấy nhuộm thành vân sơn lam sẫm, độ tương phản thấp (nền mọi bảng, trang)
  X.save('skin:paper', X.tint(tex, '#e6e8e3', '#f7f8f5'), 'skin')  # giấy sương lạnh, vân rất nhẹ

def strokes():
  run([('sheet-strokes', P.sheet(P.STROKES, 'ink brush marks'), [X.ref(ICONS)], '1:1', '2K')])
  if not os.path.exists(X.raw('sheet-strokes')): return
  k = X.raw('sheet-strokes') + '.png'
  X.key_magenta(X.raw('sheet-strokes'), k)
  for name, im in X.cut_sheet(k, P.STROKES, False).items():
    # nét cọ: CSS kéo giãn 100% bề ngang (ui/Section.svelte) → trải kín khung 320×28 (như bản code, 2x); vết mực: vuông
    X.save(f'skin:{name}', X.fit_square(im, 256, 0.01) if name == 'blot' else im.resize((320, 28), X.Image.LANCZOS), 'skin')

def concept():
  """concept toàn màn cho mỗi hướng (CONCEPT_STYLES) × mỗi ảnh chụp trong .work/concept/*-src.png → .work/raw/concept-<màn>-<hướng>"""
  import glob
  srcs = sorted(glob.glob(os.path.join(X.WORK, 'concept', '*-src.png')))
  pick_s = [a for a in args[1:] if a in P.CONCEPT_STYLES] or list(P.CONCEPT_STYLES)
  pick_m = [a for a in args[1:] if a not in P.CONCEPT_STYLES]
  jobs = []
  for src in srcs:
    scr = os.path.basename(src)[:-8]
    if pick_m and scr not in pick_m: continue
    w, h = Image.open(src).size
    for st in pick_s:
      jobs.append((f'concept-{scr}-{st}', P.CONCEPT_BASE.format(style=P.CONCEPT_STYLES[st]), [X.ref(src, side=1600)], '9:16' if h > w else '16:9', '2K'))
  run(jobs)

def chrome():
  """khung sắc nét vẽ bằng code (tools/art/chrome.py): thẻ, nhãn, viên, rãnh, thanh, công tắc, nút tròn — vát đồng, lòng chuyển sắc"""
  import chrome as C
  meta = json.load(open(os.path.join(X.WORK, 'skins', 'meta.json')))
  for n in (args[1:] or [*C.SKINS, *C.DOUBLE]):
    if n not in meta: continue
    im, extra = C.render_double(n, meta[n]) if n in C.DOUBLE else C.render(n, meta[n])
    X.save(f'skin:{n}', im, 'skin', extra=extra, q=SKIN_Q)


def creative():
  """concept sáng tạo (prompts.CREATIVE): ảnh bố cục của mình + ảnh mẫu phong cách → .work/raw/creative-<tên>"""
  d = os.path.join(X.WORK, 'concept')
  names = [n for n in P.CREATIVE if not args[1:] or n in args[1:]]
  run([(f'creative-{n}', P.CREATIVE[n][2] + P.CREATIVE_STYLE,
        [X.ref(os.path.join(d, P.CREATIVE[n][0]), side=1600), X.ref(os.path.join(d, P.CREATIVE[n][1]), side=1600)], '9:16', '2K') for n in names])

def ui():
  """đồ vật giao diện theo concept sáng tạo (prompts.UI_SHEETS) → public/art/ui/<tên>.webp, manifest 'ui:<tên>'"""
  anchor = X.ref(X.raw('creative-home'), side=1024)
  sheets_ = {k: v for k, v in P.UI_SHEETS.items() if not args[1:] or k in args[1:]}
  run([(f'sheet-{sid}', P.uisheet(items, 'game UI objects'), [anchor], '1:1', '2K') for sid, items in sheets_.items()])
  for sid, items in sheets_.items():
    if not os.path.exists(X.raw(f'sheet-{sid}')): continue
    k = X.raw(f'sheet-{sid}') + '.png'
    X.key_magenta(X.raw(f'sheet-{sid}'), k)
    # tờ tranh đóng khung: lòng khung tách mất (nền giấy trùng màu nền / tô hồng) thì khung và cảnh rời nhau khi cắt → bồi giấy trước
    if any(d.startswith(P.TILE) for _, d in items): X.fill_inside(Image.open(k)).save(k)
    for name, im in X.cut_sheet(k, items, name_ok := True).items():
      side = 192 if name.startswith(('nav-', 'frame-', 'sundial', 'ev-', 'fx-', 'ally-', 'rank-', 'power')) else 144
      X.save(f'ui:{name}', X.fit_square(im, side, 0.02, im.width / im.height if name in ('ribbon', 'signboard', 'back', 'ally-banner') else 1.0), 'ui')
  # núi mờ đáy bảng: cắt từ dải núi xa đã vẽ (không tốn tiền), nhạt thành vệt mực loang
  far = os.path.join(X.ART, 'scene', 'far1.webp')
  if os.path.exists(far):
    im = Image.open(far).convert('RGBA')
    im = im.crop((0, 0, min(im.width, 1400), im.height))
    a = np.asarray(im).astype(np.float32)
    L = a[..., :3] @ np.array([0.299, 0.587, 0.114], np.float32)
    a[..., :3] = (L[..., None] * 0.6 + np.array([96, 110, 112]) * 0.4)
    a[..., 3] *= 0.22
    X.save('ui:mountains', Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA'), 'ui')

GROUPS = {'pack': X.pack_all, 'ui': ui, 'creative': creative, 'chrome': chrome, 'concept': concept, 'kit': kit, 'clouds': clouds, 'buildings': buildings, 'faces': faces, 'icons': icons, 'emblems': emblems, 'figures': figures, 'landmarks': landmarks, 'masks': masks, 'props': props, 'troops': troops,
          'beasts': beasts, 'skins': skins, 'scenery': scenery, 'fields': fields, 'map': map_, 'far': far, 'paper': paper, 'strokes': strokes}

if __name__ == '__main__':
  if not args or args[0] not in GROUPS: sys.exit(f'dùng: make.py <nhóm> [tên…] [--fit] [--dry]\nnhóm: {" ".join(GROUPS)}')
  GROUPS[args[0]]()
  X.write_manifest()
  if args[0] != 'pack': print('→ nhớ chạy `make.py pack` để dựng lại atlas (tới lúc đó game tải file lẻ)')
