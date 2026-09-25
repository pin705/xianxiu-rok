# Vẽ và ghép tranh vào game. Mỗi nhóm: vẽ (bỏ qua ảnh đã có trong .work/raw) rồi ghép vào apps/client/public/art + manifest.
#   tools/art/.venv/bin/python tools/art/make.py <nhóm> [tên…] [--fit] [--dry]
#   --fit: chỉ ghép lại từ ảnh thô đã có (không gọi API) · --dry: in prompt, không gọi API
# Nhóm: buildings faces icons emblems masks props troops beasts skins scenery fields map far paper strokes
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
def sheets(tables, what, extra=''):
  run([(f'sheet-{sid}', P.sheet(items, what, extra), [X.ref(ICONS)], '1:1', '2K') for sid, items in pick(tables).items()])
  cells = {}
  for sid, items in pick(tables).items():
    if os.path.exists(X.raw(f'sheet-{sid}')):
      k = X.raw(f'sheet-{sid}') + '.png'
      X.key_magenta(X.raw(f'sheet-{sid}'), k)
      cells.update(X.cut_sheet(k, items))
  return cells

def icons():
  for name, im in sheets(P.ICON_SHEETS, 'game item icons').items():
    key = name if name.startswith('tab:') or name == 'pointer' else f'icon:{name}'
    X.save(key, X.fit_square(im, X.dom_side(key, 144)), 'icon')

def emblems():
  for name, im in sheets(P.EMBLEM_SHEETS, 'emblem figures for round medallions', P.EMBLEM_NOTE).items():
    X.save(f'emblem:{name}', X.fit_square(im, 128, 0.02), 'emblem', tex=True)  # medal() vẽ lên đĩa: nằm trong gói boot; 128 px đủ cho huy hiệu to nhất (logo 104 px CSS)

def masks():
  for name, im in sheets(P.MASK_SHEETS, 'UI glyph icons', P.MASK_NOTE).items():
    a = np.asarray(X.fit_square(im, X.dom_side(f'mask:{name}'), 0.04)).copy()
    a[..., :3] = 0  # game chỉ dùng alpha, tô bằng màu chữ
    X.save(f'mask:{name}', Image.fromarray(a, 'RGBA'), 'icon', fmt='PNG')

def props():
  for name, im in sheets(P.PROP_SHEETS, 'scenery props for a mountain sect scene', 'Each prop stands upright on its own base. ').items():
    for key in P.PROP_KEYS.get(name, []):
      try:
        pim, _ = X.proc(key)
        X.save(key, X.fit_prop(im, pim), 'scene', tex=True)
      except (KeyError, FileNotFoundError):  # ảnh HTML (hoa sen, vòng sáng) không có trong cache texture: ghép theo hộp trong keys.json
        k = X.KEYS.get(key)
        if k and k['kind'] == 'dom': X.save(key, X.fit_square(im, X.dom_side(key), 0.03, k['w'] / k['h']), 'scene')

def troops():
  ref_im, _ = X.proc('sold:kiem:0:3')  # mọi quân cùng một hộp
  for key, im in sheets(P.TROOP_SHEETS, 'tiny chibi battle troops').items():
    X.save(key, X.fit_prop(im, ref_im), 'battle', tex=True)

def beasts():
  run([('sheet-beasts', P.sheet(P.BEAST_SHEET, 'battle beasts', P.BEAST_NOTE), [X.ref(ICONS)], '1:1', '2K')])
  if not os.path.exists(X.raw('sheet-beasts')): return
  k = X.raw('sheet-beasts') + '.png'
  X.key_magenta(X.raw('sheet-beasts'), k)
  ref_im, _ = X.proc('beast:the:#a8784a')  # ba hệ cùng một hộp
  for key, im in X.cut_sheet(k, P.BEAST_SHEET).items():
    X.save(key, X.fit_prop(im, ref_im, 1.0), 'battle', tex=True)

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

# ---------- vẽ đè giữ hình ----------
def trace(keys, k=1.5, sub='scene'):
  metas = json.load(open(os.path.join(X.WORK, 'proc', 'meta.json')))
  keys = [key for key in keys if key in metas]
  pads = {key: X.padded(os.path.join(X.WORK, 'proc', X.fname(key) + '.png'), X.PAPER, 'trace') for key in keys}
  run([(f'trace-{X.fname(key)}', P.TRACE.format(what=P.TRACE_WHAT[key.split(':')[0]]), [pads[key][0], X.ref(STYLE)], pads[key][1], '1K') for key in keys])
  for key in keys:
    if os.path.exists(X.raw(f'trace-{X.fname(key)}')):
      pim, _ = X.proc(key)
      X.save(key, X.fit_trace(X.raw(f'trace-{X.fname(key)}'), pads[key][2], pim, k), sub, tex=True)

def scenery():
  metas = json.load(open(os.path.join(X.WORK, 'proc', 'meta.json')))
  # mảng mực mềm: 2 px/DU đủ (k=1 trên bản code 2x), nhẹ hơn 3x khoảng 55%
  trace([key for key in metas if key.split(':')[0] in ('peak', 'ledge', 'stair') and (not args[1:] or key in args[1:])], 1.0)

def map_():
  trace(['map'], 0.75, 'map')  # 1,5 px/DU: nền giấy mờ, không cần nét hơn
  # tông môn trên bản đồ vùng: cùng hộp Chủ điện bậc 1, dùng tranh Chủ điện bậc 4 (mái lam) như bản vẽ code
  X.save('map:home', X.fit_building('chuDien', 1, os.path.join(X.ART, 'bld', 'bld-chuDien-4.webp')), 'map', tex=True)

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
  run([('trace-field-wild', P.TRACE.format(what='a battlefield background') + ' ' + P.FIELD_THEMES['wild'] + '.', [pad[0], X.ref(STYLE)], pad[1], '1K')])
  if not os.path.exists(wild): return
  base = X.uncrop(Image.open(wild).convert('RGB'), pad[2]).resize((600, 1299), Image.LANCZOS)  # 1,5 px/DU: nền sau quân, không cần nét hơn
  base_path = os.path.join(X.WORK, 'ref', 'field-wild-painted.png')
  base.save(base_path)
  X.save('field:wild', base.convert('RGBA'), 'battle', tex=True)
  themes = [t for t in P.FIELD_THEMES if t != 'wild' and (not args[1:] or t in args[1:])]
  run([(f'field-{t}', P.field_theme(t), [base_path, X.ref(STYLE)], '9:16', '1K') for t in themes])
  for t in themes:
    if os.path.exists(X.raw(f'field-{t}')):
      X.save(f'field:{t}', Image.open(X.raw(f'field-{t}')).convert('RGBA').resize((600, 1299), Image.LANCZOS), 'battle', tex=True)

# ---------- vân giấy, nét cọ ----------
def paper():
  run([('paper', P.PAPER, [], '1:1', '1K')])
  if not os.path.exists(X.raw('paper')): return
  N = 256  # lát 128 px CSS (theme.css background-size) ở 2x
  a = np.asarray(Image.open(X.raw('paper')).convert('RGB').resize((N, N), Image.LANCZOS), np.float32)
  rolled = np.roll(a, (N // 2, N // 2), (0, 1))  # mép của bản cuộn liền nhau khi lát
  d = np.minimum.outer(np.minimum(np.arange(N), N - 1 - np.arange(N)), np.minimum(np.arange(N), N - 1 - np.arange(N))) / (N // 2)
  wgt = np.clip(d * 2, 0, 1)[..., None]  # giữa lấy bản gốc (che đường nối giữa của bản cuộn), mép lấy bản cuộn
  X.save('skin:paper', Image.fromarray((a * wgt + rolled * (1 - wgt)).astype(np.uint8)).convert('RGBA'), 'skin')

def strokes():
  run([('sheet-strokes', P.sheet(P.STROKES, 'ink brush marks'), [X.ref(ICONS)], '1:1', '2K')])
  if not os.path.exists(X.raw('sheet-strokes')): return
  k = X.raw('sheet-strokes') + '.png'
  X.key_magenta(X.raw('sheet-strokes'), k)
  for name, im in X.cut_sheet(k, P.STROKES).items():
    # nét cọ: CSS kéo giãn 100% bề ngang (ui/Section.svelte) → trải kín khung 320×28 (như bản code, 2x); vết mực: vuông
    X.save(f'skin:{name}', X.fit_square(im, 256, 0.01) if name == 'blot' else im.resize((320, 28), X.Image.LANCZOS), 'skin')

GROUPS = {'pack': X.pack_all, 'buildings': buildings, 'faces': faces, 'icons': icons, 'emblems': emblems, 'masks': masks, 'props': props, 'troops': troops,
          'beasts': beasts, 'skins': skins, 'scenery': scenery, 'fields': fields, 'map': map_, 'far': far, 'paper': paper, 'strokes': strokes}

if __name__ == '__main__':
  if not args or args[0] not in GROUPS: sys.exit(f'dùng: make.py <nhóm> [tên…] [--fit] [--dry]\nnhóm: {" ".join(GROUPS)}')
  GROUPS[args[0]]()
  X.write_manifest()
