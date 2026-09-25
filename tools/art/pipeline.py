# Xử lý ảnh và ghép vào game: tách nền hồng, cắt bảng 3×3, đặt tranh vào đúng hộp asset, ghi manifest.
# Mọi hộp/điểm neo lấy từ bản vẽ code (.work/proc, .work/skins do export.ts xuất) hoặc keys.json.
import json, os, subprocess
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
ART = os.path.join(ROOT, 'apps', 'client', 'public', 'art')   # nơi game đọc
WORK = os.path.join(HERE, '.work')                              # ảnh thô, ảnh mẫu gửi lên, bản vẽ code (không commit)
ANCHORS = os.path.join(HERE, 'anchors')                         # ảnh mẫu phong cách (commit)
PAPER = (232, 222, 196, 255)
S = 3  # px mỗi DU của tranh xuất ra (màn 3x vẫn nét)
Q = 82  # chất lượng WebP: 90 nặng hơn ~40% mà mắt không thấy khác trên nét thủy mặc
KEYS = json.load(open(os.path.join(HERE, 'keys.json')))
RATIOS = {'1:1': 1, '3:2': 1.5, '4:3': 4 / 3, '16:9': 16 / 9, '2:3': 2 / 3, '3:4': 3 / 4, '9:16': 9 / 16}

def raw(name): return os.path.join(WORK, 'raw', f'{name}.webp')
def fname(key): return key.replace(':', '-').replace('#', '')

# ---------- nền, cắt, viền ----------
def key_magenta(src, dst=None):
  """Nền #FF00FF phẳng → trong suốt. Ước alpha theo độ hồng rồi tách màu thật F = (C - (1-a)·M) / a (nét mực loang không ám hồng)."""
  c = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
  pink = np.minimum(c[..., 0], c[..., 2]) - c[..., 1]
  a = 1 - np.clip((pink - 0.18) / (0.62 - 0.18), 0, 1)
  F = np.clip((c - (1 - a)[..., None] * np.array([1.0, 0.0, 1.0])) / np.maximum(a, 0.05)[..., None], 0, 1)
  a[a < 0.04] = 0
  im = Image.fromarray((np.dstack([F, a]) * 255).astype(np.uint8), 'RGBA')
  if dst: im.save(dst)
  return im

def trim(im, thr=10):
  box = im.getchannel('A').point(lambda v: 255 if v > thr else 0).getbbox()
  return im.crop(box) if box else im

def feather(im, frac=0.04):
  """mờ dần sát mép: phần chạm khung ảnh (mây bậc 5…) không bị cắt thẳng"""
  a = np.asarray(im).astype(np.float32)
  h, w = a.shape[:2]
  fx = np.clip(np.minimum(np.arange(w), w - 1 - np.arange(w)) / (w * frac), 0, 1)
  fy = np.clip(np.minimum(np.arange(h), h - 1 - np.arange(h)) / (h * frac), 0, 1)
  a[..., 3] *= np.minimum.outer(fy, fx)
  return Image.fromarray(a.astype(np.uint8), 'RGBA')

def main_blob(im, keep_ratio=0.04):
  """giữ hình trong ô: khối lớn nhất + mọi mảnh không chạm mép ô và đủ lớn (sóng loa, gạch chéo, giọt nước tách rời);
  bỏ mảnh chạm mép (phần ô bên cạnh lấn sang) và vụn nhỏ"""
  a = ndimage.binary_closing(np.asarray(im.getchannel('A')) > 90, iterations=3)
  lab, n = ndimage.label(a)
  if n == 0: return im
  sizes = ndimage.sum(a, lab, range(1, n + 1))
  big = 1 + int(np.argmax(sizes))
  edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
  ids = [big] + [i + 1 for i, sz in enumerate(sizes) if i + 1 != big and i + 1 not in edge and sz >= keep_ratio * sizes[big - 1]]
  keep = ndimage.binary_dilation(np.isin(lab, ids), iterations=4)
  arr = np.asarray(im).copy()
  arr[..., 3] = (arr[..., 3] * keep).astype(np.uint8)
  return Image.fromarray(arr, 'RGBA')

def depink(im):
  """vệt hồng mờ còn sót (quầng sáng model vẽ bằng màu hồng của nền): điểm nửa trong suốt ngả hồng tím → bỏ"""
  a = np.asarray(im).astype(np.int16)
  pink = (a[..., 0] - a[..., 1] > 50) & (a[..., 2] - a[..., 1] > 30) & (a[..., 3] < 242)
  a[pink, 3] = 0
  return Image.fromarray(a.astype(np.uint8), 'RGBA')

def cut_sheet(path, items):
  """bảng 3×3 đã tách nền → {tên ô: ảnh}; ô tên '_…' là ô đệm, bỏ"""
  im = Image.open(path).convert('RGBA')
  cw, ch = im.width / 3, im.height / 3
  out = {}
  for i, (name, _) in enumerate(items):
    if name.startswith('_'): continue
    c = im.crop((round((i % 3) * cw), round((i // 3) * ch), round((i % 3 + 1) * cw), round((i // 3 + 1) * ch)))
    out[name] = trim(main_blob(depink(c)))
  return out

def calm(im, ins, k=0.35):
  """lòng da 9 mảnh (bị kéo giãn, đặt chữ): kéo về màu trung vị, giữ k độ lệch — mất vết loang, còn vân giấy"""
  a = np.asarray(im).astype(np.float32)
  h, w = a.shape[:2]
  t, r, b, l = ins
  if w - l - r < 4 or h - t - b < 4: return im
  med = np.median(a[t:h - b, l:w - r, :3].reshape(-1, 3), axis=0)
  mask = np.zeros((h, w), np.float32)
  mask[t:h - b, l:w - r] = 1
  mask = ndimage.gaussian_filter(mask, sigma=max(2, min(ins) / 3))[..., None]
  a[..., :3] = a[..., :3] * (1 - mask) + (med + (a[..., :3] - med) * k) * mask
  return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')

def ref(src, magenta=False, side=1024):
  """ảnh mẫu gửi lên API: PNG cạnh dài 1024; magenta=True phủ nền hồng cho ảnh nền trong (cùng kiểu nền với ảnh cần vẽ)"""
  out = os.path.join(WORK, 'ref', fname(os.path.basename(src).rsplit('.', 1)[0]) + ('-m' if magenta else '') + '.png')
  if not os.path.exists(out):
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im = Image.open(src).convert('RGBA')
    im.thumbnail((side, side))
    if magenta:
      bg = Image.new('RGBA', im.size, (255, 0, 255, 255))
      bg.alpha_composite(im)
      im = bg
    im.save(out)
  return out

def padded(src, bg, tag):
  """bản vẽ code đặt giữa khung tỉ lệ model nhận (thêm 10% lề) → (file, tỉ lệ, hộp để cắt lại theo tỉ lệ 0..1)"""
  im = Image.open(src).convert('RGBA')
  r = im.width / im.height
  dim = lambda R: (round(im.height * R), im.height) if R >= r else (im.width, round(im.width / R))
  ratio, R = min(RATIOS.items(), key=lambda kv: dim(kv[1])[0] * dim(kv[1])[1])
  W, H = (int(v * 1.1) for v in dim(R))
  out = Image.new('RGBA', (W, H), bg)
  x, y = (W - im.width) // 2, (H - im.height) // 2
  out.alpha_composite(im, (x, y))
  path = os.path.join(WORK, 'ref', f'{tag}-{fname(os.path.basename(src)[:-4])}.png')
  os.makedirs(os.path.dirname(path), exist_ok=True)
  out.save(path)
  return path, ratio, (x / W, y / H, (x + im.width) / W, (y + im.height) / H)

def uncrop(im, box):
  x0, y0, x1, y1 = box
  return im.crop((round(x0 * im.width), round(y0 * im.height), round(x1 * im.width), round(y1 * im.height)))

# ---------- manifest ----------
_manifest = None
def manifest():
  global _manifest
  if _manifest is None:
    p = os.path.join(ART, 'manifest.json')
    _manifest = json.load(open(p)) if os.path.exists(p) else {}
    for e in _manifest.values():  # bỏ mã phiên bản (?v=) — write_manifest tính lại theo nội dung file
      for f in ('src', 'page'):
        if f in e: e[f] = e[f].split('?')[0]
  return _manifest

def save(key, im, sub, aliases=(), extra=None, tex=False, fmt='WEBP'):
  """ghi ảnh vào public/art/<sub>/ và dòng manifest cho key (+ các key dùng chung file). tex: texture cảnh (bộ nạp giải mã sẵn)."""
  name = fname(key) + ('.webp' if fmt == 'WEBP' else '.png')
  os.makedirs(os.path.join(ART, sub), exist_ok=True)
  im.save(os.path.join(ART, sub, name), fmt, **({'quality': Q, 'method': 6} if fmt == 'WEBP' else {}))
  for k in (key, *aliases):
    manifest()[k] = {'src': f'{sub}/{name}', **({'tex': True} if tex else {}), **(extra or {})}
  return name

def write_manifest():
  """ghi manifest; mỗi đường dẫn kèm ?v=<mã nội dung>: service worker giữ tranh qua mọi bản build (kho rok-art),
  bản cập nhật chỉ tải lại tranh thật sự đổi"""
  import hashlib
  vs = {}
  def ver(src):
    if src not in vs:
      path = os.path.join(ART, src)
      vs[src] = hashlib.sha1(open(path, 'rb').read()).hexdigest()[:10] if os.path.exists(path) else '0'
    return f'{src}?v={vs[src]}'
  out = {k: {**e, **{f: ver(e[f]) for f in ('src', 'page') if f in e}} for k, e in sorted(manifest().items())}
  p = os.path.join(ART, 'manifest.json')
  json.dump(out, open(p, 'w'), indent=2, ensure_ascii=False)
  subprocess.run(['npx', 'prettier', '--write', p], cwd=ROOT, capture_output=True)
  print(f'manifest: {len(manifest())} key')

# ---------- đặt tranh vào hộp ----------
def building_dims(bid, tier):
  """(rộng, đỉnh) theo packages/art/buildings.ts building() — hộp x=-w/2-8, y=-top-16, w+16 × top+26 (+12 ở bậc 5)"""
  return {
    'chuDien': (180 if tier >= 3 else 116, 66 if tier == 1 else 86), 'tangKinhCac': (70, 50 + min(3, tier) * 20),
    'danPhong': (110, 52), 'tangBaoCac': (80, 70), 'dienVoTruong': (124, 66), 'tuLinhTran': (104, 30),
    'khoangMach': (120, 72), 'linhDien': (128, 46), 'luyenKhiPhong': (116, 54), 'hoSonDaiTran': (124, 66),
  }[bid]

def fit_building(bid, tier, src, lift=4):
  """tranh rộng bằng công trình, chân ở y=+lift (gốc hộp là giữa chân nền)"""
  w, top = building_dims(bid, tier)
  W, H = w + 16, top + 26 + (12 if tier == 5 else 0)
  im = trim(feather(Image.open(src).convert('RGBA')))
  s = min(w / im.width, (top + 16 + lift) / im.height)
  cw, ch = round(im.width * s * S), round(im.height * s * S)
  out = Image.new('RGBA', (round(W * S), round(H * S)), (0, 0, 0, 0))
  out.alpha_composite(im.resize((cw, ch), Image.LANCZOS), (round((w / 2 + 8) * S - cw / 2), max(0, round((top + 16 + lift) * S - ch))))
  return out

def save_building(bid, tier, src):
  """một tranh → mọi key của công trình ở bậc đó: bld (+ biến thể số hình nhân của Diễn võ trường) và panel (đầu bảng chi tiết)"""
  vs = range(1, 7) if bid == 'dienVoTruong' else [0]
  keys = [f'bld:{bid}:{tier}:{v}' for v in vs] + [f'panel:{bid}:{tier}']
  return save(f'bld:{bid}:{tier}', fit_building(bid, tier, src), 'bld', keys, tex=True)

def fit_square(im, side, pad=0.03, aspect=1.0):
  """icon, chân dung, hình chạm: vào giữa khung (rộng/cao = aspect), chừa lề pad"""
  W, H = (side, round(side / aspect)) if aspect >= 1 else (round(side * aspect), side)
  s = min(W * (1 - 2 * pad) / im.width, H * (1 - 2 * pad) / im.height)
  im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
  out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
  out.alpha_composite(im, ((W - im.width) // 2, (H - im.height) // 2))
  return out

def dom_side(key, least=128):
  """cỡ ảnh HTML: 1,5 × cỡ lớn nhất từng thấy (lượt chụp chạy 2x) để nét trên màn 3x"""
  k = KEYS.get(key)
  return max(least, round((k['px'] if k else 96) * 1.5 / 8) * 8)

def proc(key):
  """bản vẽ code của key (export.ts): (ảnh, meta {w, h, anchor, scale})"""
  meta = json.load(open(os.path.join(WORK, 'proc', 'meta.json')))
  return Image.open(os.path.join(WORK, 'proc', fname(key) + '.png')).convert('RGBA'), meta[key]

def fit_prop(art, proc_im, grow=1.05):
  """đồ trang trí, quân, yêu thú: khớp khung chữ nhật bao của bản vẽ code, chân chạm chân, giữa thẳng giữa"""
  W, H = round(proc_im.width * 1.5), round(proc_im.height * 1.5)
  bx = proc_im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox() or (0, 0, proc_im.width, proc_im.height)
  s = min((bx[2] - bx[0]) * 1.5 / art.width, (bx[3] - bx[1]) * 1.5 / art.height) * grow
  a = art.resize((max(1, round(art.width * s)), max(1, round(art.height * s))), Image.LANCZOS)
  out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
  out.alpha_composite(a, (round((bx[0] + bx[2]) / 2 * 1.5 - a.width / 2), max(0, round(bx[3] * 1.5 - a.height))))
  return out

def fit_trace(painted_src, box, proc_im, k=1.5):
  """vẽ đè giữ hình: cắt bỏ phần đệm, phủ lên bản code (phóng k lần) rồi lấy alpha bản code — đúng đường bao, giữ phần mờ"""
  W, H = round(proc_im.width * k), round(proc_im.height * k)
  p = uncrop(Image.open(painted_src).convert('RGBA'), box).resize((W, H), Image.LANCZOS)
  base = proc_im.resize((W, H), Image.LANCZOS)
  out = base.copy()
  out.alpha_composite(p)
  out.putalpha(base.getchannel('A'))
  return out

# ---------- gói theo cảnh + atlas (như bundle/atlas của Godot, LayaAir) ----------
# Mỗi mục manifest được gán `pack` theo cảnh dùng nó; game chỉ đợi gói 'boot' rồi hiện, gói của cảnh nào thì cảnh đó đợi
# (packages/art/art.ts artPack), còn lại tải nền. Texture (tex) của một gói gom vào vài trang atlas 2048² (`page` + `frame`):
# ít lượt tải, Pixi gộp được lượt vẽ. File lẻ vẫn giữ (ảnh HTML như panel:* dùng file lẻ; lần gói sau đọc lại từ đây).
PACKS = [  # (gói, key) — mục đầu tiên khớp thì lấy; không khớp: không gói, trình duyệt tự tải khi cần (icon, chân dung…)
  ('boot', r'^(skin|emblem):'),  # giao diện nào cũng dùng: da, hình chạm huy hiệu (huy hiệu nướng lên canvas ngay khi hiện)
  *[(f'bld{t}', rf'^bld:\w+:{t}:') for t in range(1, 6)],  # công trình theo bậc: cảnh núi chỉ đợi các bậc đang hiện (Home.svelte)
  ('home', r'^(peak|ledge|stair|far\d|pine|rock|bamboo|blossom|lantern|sun|moon|crane|bird|fly|pearl|walker|worker|disciple|flag|scaffold)(:|$)'),
  ('map', r'^(map|march)(:|$)'),
  ('world', r'^wtoken$'),
  ('battle', r'^(sold|beast|field):'),
]
PAGE, PAD = 2048, 2

def pack_all():
  import re, glob
  m = manifest()
  for e in m.values():
    for f in ('pack', 'page', 'frame'): e.pop(f, None)
  for f in glob.glob(os.path.join(ART, 'atlas', '*.webp')): os.remove(f)
  groups = {}
  for key, e in m.items():
    name = next((n for n, rx in PACKS if re.search(rx, key)), None)
    if name:
      e['pack'] = name
      if e.get('tex'): groups.setdefault(name, {}).setdefault(e['src'], []).append(key)
  os.makedirs(os.path.join(ART, 'atlas'), exist_ok=True)
  for name, files in groups.items():
    ims = {src: Image.open(os.path.join(ART, src)).convert('RGBA') for src in files}
    fits = sorted((s for s in ims if ims[s].width <= PAGE - 2 * PAD and ims[s].height <= PAGE - 2 * PAD), key=lambda s: -ims[s].height)
    pages, x, y, row, cur = [], PAD, PAD, 0, None
    for src in fits:  # xếp theo kệ: cao trước, hết hàng xuống kệ mới, hết trang sang trang mới
      im = ims[src]
      if x + im.width + PAD > PAGE: x, y, row = PAD, y + row + PAD, 0
      if cur is None or y + im.height + PAD > PAGE:
        cur = Image.new('RGBA', (PAGE, PAGE), (0, 0, 0, 0)); pages.append([cur, 0])
        x, y, row = PAD, PAD, 0
      cur.alpha_composite(im, (x, y))
      pages[-1][1] = max(pages[-1][1], y + im.height + PAD)
      for key in files[src]: m[key].update(page=f'atlas/{name}-{len(pages) - 1}.webp', frame=[x, y, im.width, im.height])
      x, row = x + im.width + PAD, max(row, im.height)
    for i, (pg, used) in enumerate(pages):  # cắt phần thừa dưới trang cuối cho nhẹ
      pg.crop((0, 0, PAGE, min(PAGE, used))).save(os.path.join(ART, 'atlas', f'{name}-{i}.webp'), 'WEBP', quality=Q, method=6)
    big = len(ims) - len(fits)
    print(f'gói {name}: {len(fits)} ảnh → {len(pages)} trang atlas' + (f', {big} ảnh lớn giữ file lẻ' if big else ''))
