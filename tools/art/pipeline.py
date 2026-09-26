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
S_HD = 6  # bản HD cho màn to độ nét cao (desktop Retina: cảnh ~2,85 px CSS/DU × 2) — chỉ máy cần mới tải (main.ts)
Q = 82  # chất lượng WebP: 90 nặng hơn ~40% mà mắt không thấy khác trên nét thủy mặc
KEYS = json.load(open(os.path.join(HERE, 'keys.json')))
RATIOS = {'1:1': 1, '3:2': 1.5, '4:3': 4 / 3, '16:9': 16 / 9, '2:3': 2 / 3, '3:4': 3 / 4, '9:16': 9 / 16}

def raw(name): return os.path.join(WORK, 'raw', f'{name}.webp')
def fname(key): return key.replace(':', '-').replace('#', '').replace('*', 'v')

# ---------- nền, cắt, viền ----------
def key_magenta(src, dst=None):
  """Nền phẳng → trong suốt, tách màu thật F = (C - (1-a)·B) / a (nét mực loang không ám màu nền).
  Nền #FF00FF: alpha theo độ hồng. Model đôi khi tô nền khác (tím nhạt, hồng đậm…): lấy màu nền từ mép ảnh, alpha theo khoảng cách màu."""
  c = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
  h, w = c.shape[:2]
  m = max(4, int(min(h, w) * 0.015))
  edge = np.concatenate([c[:m].reshape(-1, 3), c[-m:].reshape(-1, 3), c[:, :m].reshape(-1, 3), c[:, -m:].reshape(-1, 3)])
  B = np.median(edge, 0)
  if (np.abs(edge - np.array([1.0, 0.0, 1.0])).sum(1) < 0.25).mean() >= 0.3:  # đủ nhiều mép hồng thuần (mây/đế có thể chạm mép)
    pink = np.minimum(c[..., 0], c[..., 2]) - c[..., 1]
    a = 1 - np.clip((pink - 0.18) / (0.62 - 0.18), 0, 1)
    B = np.array([1.0, 0.0, 1.0])
  else:
    print(f'  {os.path.basename(src)}: nền không phải hồng thuần {np.round(B * 255).astype(int).tolist()} — tách theo màu mép ảnh')
    d = np.sqrt(((c - B) ** 2).sum(-1))
    a = np.clip((d - 0.07) / (0.28 - 0.07), 0, 1)
  F = np.clip((c - (1 - a)[..., None] * B) / np.maximum(a, 0.05)[..., None], 0, 1)
  a[a < 0.04] = 0
  im = Image.fromarray((np.dstack([F, a]) * 255).astype(np.uint8), 'RGBA')
  if dst: im.save(dst)
  return im

def fill_inside(im, color=(243, 244, 240)):
  """tranh đóng khung: lòng khung bị tách mất khi model tô nền giấy trùng màu nền (hoặc tô hồng cả lòng) → bồi lại giấy
  vào mọi lỗ kín trong hình (vùng trong suốt không thông ra mép ảnh)"""
  a = np.asarray(im).astype(np.float32) / 255
  inside = ndimage.binary_fill_holes(ndimage.binary_closing(a[..., 3] > 0.25, iterations=3))  # vá chỗ hở của nét khung mảnh
  k = a[..., 3:4]
  over = a[..., :3] * k + np.array(color, np.float32) / 255 * (1 - k)
  a[..., :3] = np.where(inside[..., None], over, a[..., :3])
  a[..., 3] = np.where(inside, 1, a[..., 3])
  return Image.fromarray((a * 255).astype(np.uint8), 'RGBA')

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

def blobs(im, min_frac=0.012):
  """các hình rời trên bảng (đã tách nền), xếp theo thứ tự đọc: gom hàng theo tâm dọc, trong hàng trái → phải"""
  a = ndimage.binary_closing(np.asarray(im.getchannel('A')) > 60, iterations=6)
  lab, n = ndimage.label(a)
  boxes = [b for i, b in enumerate(ndimage.find_objects(lab)) if (lab[b] == i + 1).sum() >= min_frac * a.size]
  boxes.sort(key=lambda b: (b[0].start + b[0].stop) / 2)
  rows, cur = [], []
  for b in boxes:
    cy = (b[0].start + b[0].stop) / 2
    if cur and cy - (cur[-1][0].start + cur[-1][0].stop) / 2 > im.height * 0.12: rows.append(cur); cur = []
    cur.append(b)
  if cur: rows.append(cur)
  return [b for r in rows for b in sorted(r, key=lambda b: b[1].start)]

def cut_sheet(path, items, parts=True, skip=()):
  """bảng 3×3 đã tách nền → {tên ô: ảnh}; ô tên '_…' là ô đệm, bỏ"""
  im = Image.open(path).convert('RGBA')
  cw, ch = im.width / 3, im.height / 3
  # model hay không xếp đúng lưới 3×3 (hàng 4 hình, thêm hình thừa): tách theo hình rời nếu đếm khớp (bỏ các chỉ số `skip`)
  found = [b for i, b in enumerate(blobs(im)) if i not in skip]
  by_blob = len(found) == len(items)
  if not by_blob: print(f'  {os.path.basename(path)}: {len(found)} hình ≠ {len(items)} ô — cắt theo lưới 3×3 (xem lại, thêm skip nếu có hình thừa)')
  out = {}
  for i, (name, _) in enumerate(items):
    if name.startswith('_'): continue
    if by_blob:
      ys, xs = found[i]
      m = round(min(im.width, im.height) * 0.01)
      c = im.crop((max(0, xs.start - m), max(0, ys.start - m), min(im.width, xs.stop + m), min(im.height, ys.stop + m)))
    else:
      c = im.crop((round((i % 3) * cw), round((i // 3) * ch), round((i % 3 + 1) * cw), round((i // 3 + 1) * ch)))
    c = main_blob(depink(c), 0.04 if parts else 1.01)  # parts=False: chỉ khối lớn nhất (đồ vật một khối — bỏ mảnh lạc của ô bên)
    if not parts:  # gọn quầng mờ quanh đồ vật: icon nhỏ cần mép rõ
      a = np.asarray(c).copy()
      a[..., 3] = (np.clip((a[..., 3].astype(np.float32) / 255 - 0.3) / 0.7, 0, 1) * 255).astype(np.uint8)
      c = Image.fromarray(a, 'RGBA')
    out[name] = trim(c)
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
      for o in (e, e.get('hd') or {}):
        for f in ('src', 'page'):
          if f in o: o[f] = o[f].split('?')[0]
  return _manifest

def save(key, im, sub, aliases=(), extra=None, tex=False, fmt='WEBP', hd=None):
  """ghi ảnh vào public/art/<sub>/ và dòng manifest cho key (+ các key dùng chung file). tex: texture cảnh (bộ nạp giải mã sẵn)."""
  name = fname(key) + ('.webp' if fmt == 'WEBP' else '.png')
  os.makedirs(os.path.join(ART, sub), exist_ok=True)
  im.save(os.path.join(ART, sub, name), fmt, **({'quality': Q, 'method': 6} if fmt == 'WEBP' else {}))
  for k in (key, *aliases):
    # giữ tên gói (theo key, không đổi); bỏ khung atlas cũ — game tải file lẻ (đúng ảnh mới) tới khi chạy lại `pack`
    keep = {'pack': manifest()[k]['pack']} if 'pack' in manifest().get(k, {}) else {}
    manifest()[k] = {'src': f'{sub}/{name}', **({'tex': True} if tex else {}), **keep, **(extra or {})}
  if hd is not None:  # bản HD: nguồn cho atlas HD (pack_all), không nằm trong public
    os.makedirs(os.path.join(WORK, 'hd', sub), exist_ok=True)
    hd.save(os.path.join(WORK, 'hd', sub, name), fmt, **({'quality': Q, 'method': 6} if fmt == 'WEBP' else {}))
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
  def vers(e):
    o = {**e, **{f: ver(e[f]) for f in ('src', 'page') if f in e}}
    if 'hd' in e: o['hd'] = {**e['hd'], **{f: ver(e['hd'][f]) for f in ('src', 'page') if f in e['hd']}}
    return o
  out = {k: vers(e) for k, e in sorted(manifest().items())}
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

def cloud_bank(im):
  """bậc 5: mây đỡ model hay vẽ thành khối kín chạm mép ảnh → cắt phần dưới theo hình elip (mây tụ giữa, tan dần hai bên)"""
  a = np.asarray(im).astype(np.float32)
  h, w = a.shape[:2]
  y = np.linspace(0, 1, h)[:, None]
  x = np.linspace(-1, 1, w)[None, :]
  d = np.sqrt((x / 0.95) ** 2 + (np.maximum(y - 0.42, 0) / 0.62) ** 2)  # elip tâm giữa, hơi dưới nửa ảnh
  keep = np.clip((1 - d) / 0.28 + 0.1, 0, 1)
  lower = np.clip((y - 0.4) / 0.15, 0, 1)                                 # nửa trên (công trình) giữ nguyên
  a[..., 3] *= 1 - lower * (1 - keep)
  return Image.fromarray(a.astype(np.uint8), 'RGBA')

def fit_building(bid, tier, src, lift=4, S=S):
  """tranh rộng bằng công trình, chân ở y=+lift (gốc hộp là giữa chân nền)"""
  w, top = building_dims(bid, tier)
  W, H = w + 16, top + 26 + (12 if tier == 5 else 0)
  im = Image.open(src).convert('RGBA')
  # quầng sáng model vẽ quanh mái trên nền hồng → sau khi tách thành mảng trắng mờ hình hộp: bỏ phần gần trong suốt
  arr = np.asarray(im).copy()
  arr[..., 3] = (np.clip((arr[..., 3].astype(np.float32) / 255 - 0.35) / 0.65, 0, 1) * 255).astype(np.uint8)
  im = feather(Image.fromarray(arr, 'RGBA'))
  im = trim(cloud_bank(trim(im)) if tier == 5 else im)
  s = min(w / im.width, (top + 16 + lift) / im.height)
  cw, ch = round(im.width * s * S), round(im.height * s * S)
  out = Image.new('RGBA', (round(W * S), round(H * S)), (0, 0, 0, 0))
  out.alpha_composite(im.resize((cw, ch), Image.LANCZOS), (round((w / 2 + 8) * S - cw / 2), max(0, round((top + 16 + lift) * S - ch))))
  return out

def save_building(bid, tier, src):
  """một tranh → mọi key của công trình ở bậc đó: bld (+ biến thể số hình nhân của Diễn võ trường) và panel (đầu bảng chi tiết)"""
  vs = range(1, 7) if bid == 'dienVoTruong' else [0]
  keys = [f'bld:{bid}:{tier}:{v}' for v in vs] + [f'panel:{bid}:{tier}']
  return save(f'bld:{bid}:{tier}', fit_building(bid, tier, src), 'bld', keys, tex=True, hd=fit_building(bid, tier, src, S=S_HD))

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

def fit_prop(art, proc_im, grow=1.05, k=1.5):
  """đồ trang trí, quân, yêu thú: khớp khung chữ nhật bao của bản vẽ code, chân chạm chân, giữa thẳng giữa"""
  W, H = round(proc_im.width * k), round(proc_im.height * k)
  bx = proc_im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox() or (0, 0, proc_im.width, proc_im.height)
  s = min((bx[2] - bx[0]) * k / art.width, (bx[3] - bx[1]) * k / art.height) * grow
  a = art.resize((max(1, round(art.width * s)), max(1, round(art.height * s))), Image.LANCZOS)
  out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
  out.alpha_composite(a, (round((bx[0] + bx[2]) / 2 * k - a.width / 2), max(0, round(bx[3] * k - a.height))))
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
  ('home', r'^(fog|cloud|peak|ledge|stair|far\d|pine|rock|bamboo|blossom|lantern|sun|moon|crane|bird|fly|pearl|walker|worker|disciple|flag|scaffold|lm)(:|$)'),
  ('map', r'^(map|march)(:|$)'),
  ('world', r'^wtoken$'),
  ('battle', r'^(sold|beast|field|thunder):'),
]
PAGE, PAD = 2048, 2

PAGE_HD = 4096  # atlas HD chỉ máy desktop tải: GPU nào cũng nhận texture 4096

def shelf(ims, page, prefix):
  """xếp ảnh vào các trang atlas theo kệ (cao trước, hết hàng xuống kệ, hết trang sang trang) → ({src: (trang, khung)}, ảnh quá khổ)"""
  fits = sorted((s for s in ims if ims[s].width <= page - 2 * PAD and ims[s].height <= page - 2 * PAD), key=lambda s: -ims[s].height)
  where, pages, x, y, row, cur = {}, [], PAD, PAD, 0, None
  for src in fits:
    im = ims[src]
    if x + im.width + PAD > page: x, y, row = PAD, y + row + PAD, 0
    if cur is None or y + im.height + PAD > page:
      cur = Image.new('RGBA', (page, page), (0, 0, 0, 0))
      pages.append([cur, 0])
      x, y, row = PAD, PAD, 0
    cur.alpha_composite(im, (x, y))
    pages[-1][1] = max(pages[-1][1], y + im.height + PAD)
    where[src] = (f'{prefix}-{len(pages) - 1}.webp', [x, y, im.width, im.height])
    x, row = x + im.width + PAD, max(row, im.height)
  for i, (pg, used) in enumerate(pages):  # cắt phần thừa dưới trang cuối cho nhẹ
    pg.crop((0, 0, page, min(page, used))).save(os.path.join(ART, f'{prefix}-{i}.webp'), 'WEBP', quality=Q, method=6)
  return where, [s for s in ims if s not in where], len(pages)

def pack_all():
  import re, glob, shutil
  m = manifest()
  for e in m.values():
    for f in ('pack', 'page', 'frame', 'hd'): e.pop(f, None)
  for d in ('atlas', 'atlas-hd'):
    for f in glob.glob(os.path.join(ART, d, '*.webp')): os.remove(f)
    os.makedirs(os.path.join(ART, d), exist_ok=True)
  shutil.rmtree(os.path.join(ART, 'hd'), ignore_errors=True)
  groups = {}
  for key, e in m.items():
    name = next((n for n, rx in PACKS if re.search(rx, key)), None)
    if name:
      e['pack'] = name
      if e.get('tex'): groups.setdefault(name, {}).setdefault(e['src'], []).append(key)
  for name, files in groups.items():
    ims = {src: Image.open(os.path.join(ART, src)).convert('RGBA') for src in files}
    where, big, n = shelf(ims, PAGE, f'atlas/{name}')
    for src, (pg, fr) in where.items():
      for key in files[src]: m[key].update(page=pg, frame=fr)
    # bản HD: nguồn .work/hd (thiếu thì bản thường), trang 4096; ảnh quá khổ giữ file lẻ ở art/hd
    hims = {}
    for src in files:
      hp = os.path.join(WORK, 'hd', src)
      hims[src] = Image.open(hp if os.path.exists(hp) else os.path.join(ART, src)).convert('RGBA')
    hwhere, hbig, hn = shelf(hims, PAGE_HD, f'atlas-hd/{name}')
    for src, (pg, fr) in hwhere.items():
      for key in files[src]: m[key]['hd'] = {'page': pg, 'frame': fr}
    for src in hbig:
      if src in big: continue  # bản thường cũng quá khổ (núi xa): không có HD
      os.makedirs(os.path.dirname(os.path.join(ART, 'hd', src)), exist_ok=True)
      hims[src].save(os.path.join(ART, 'hd', src), 'WEBP', quality=Q, method=6)
      for key in files[src]: m[key]['hd'] = {'src': f'hd/{src}'}
    print(f'gói {name}: {len(where)} ảnh → {n} trang' + (f', {len(big)} ảnh lớn giữ file lẻ' if big else '') + f' · HD {hn} trang 4096')

def raw_k(painted_src, box, proc_im):
  """độ phân giải thật của ảnh vẽ đè so với bản code (px ảnh gốc / px bản code 2x) — bản HD không phóng quá mức này"""
  x0, _, x1, _ = box
  return Image.open(painted_src).width * (x1 - x0) / proc_im.width

# ---------- bộ giao diện: co giãn 9 mảnh + đổi màu (make.py kit) ----------
def symmetric(img):
  """viền đều 4 cạnh: nửa dưới = nửa trên lật, nửa phải = nửa trái lật (nét tay thường đậm hơn ở cạnh dưới → như bóng đổ nặng)"""
  a = np.asarray(img).copy()
  h, w = a.shape[:2]
  a[h - h // 2:] = a[:h // 2][::-1]
  a[:, w - w // 2:] = a[:, :w // 2][:, ::-1]
  return Image.fromarray(a, 'RGBA')

def nine(img, bins, W, H, ins):
  """co giãn ảnh 9 mảnh (viền bins = trên, phải, dưới, trái px) sang khung W×H với viền ins — góc giữ hình, cạnh và lòng giãn"""
  bt, br, bb, bl = bins
  t, r, b, l = ins
  bw, bh = img.size
  out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
  xs = [(0, bl, 0, l), (bl, bw - br, l, W - r), (bw - br, bw, W - r, W)]
  ys = [(0, bt, 0, t), (bt, bh - bb, t, H - b), (bh - bb, bh, H - b, H)]
  for sx0, sx1, dx0, dx1 in xs:
    for sy0, sy1, dy0, dy1 in ys:
      if sx1 > sx0 and sy1 > sy0 and dx1 > dx0 and dy1 > dy0:
        out.paste(img.crop((sx0, sy0, sx1, sy1)).resize((dx1 - dx0, dy1 - dy0), Image.LANCZOS), (dx0, dy0))
  return out

def _rgb(h): return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32)

def tint(img, dark, light=None):
  """đổi màu theo độ sáng (giữ nét cọ, bỏ mọi màu cũ): tối → `dark`, sáng → `light`.
  light None (tấm sơn mài): `dark` là màu chính; lấy trung vị làm màu chính, không kéo giãn tương phản (kéo thì nhiễu li ti thành lốm đốm)"""
  a = np.asarray(img).astype(np.float32)
  L = a[..., :3] @ np.array([0.299, 0.587, 0.114], np.float32)
  vis = a[..., 3] > 128
  if light is None:
    med = np.median(L[vis]) if vis.any() else 128
    t = np.clip(0.5 + (L - med) / 140, 0, 1)[..., None]
    c = _rgb(dark)
    d, m, w = c * 0.45, c, c + (255 - c) * 0.45
    rgb = np.where(t < 0.5, d + (m - d) * (t * 2), m + (w - m) * ((t - 0.5) * 2))
  else:
    lo, hi = (np.percentile(L[vis], [3, 97]) if vis.any() else (0, 255))
    t = np.clip((L - lo) / max(1, hi - lo), 0, 1)[..., None]
    rgb = _rgb(dark) + (_rgb(light) - _rgb(dark)) * t
  a[..., :3] = rgb
  return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')

def tint_grey(img, color):
  """như tint (tấm một màu) nhưng chỉ đổi phần xám (mặt nút); phần có màu (viền, đầu bịt đồng) giữ nguyên"""
  a = np.asarray(img).astype(np.float32)
  mx, mn = a[..., :3].max(-1), a[..., :3].min(-1)
  sat = (mx - mn) / np.maximum(mx, 1)
  keep = np.clip((sat - 0.12) / 0.12, 0, 1)[..., None]   # 1 = có màu (đồng), 0 = xám (mặt)
  t = np.asarray(tint(img, color)).astype(np.float32)
  a[..., :3] = a[..., :3] * keep + t[..., :3] * (1 - keep)
  return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')

# ---------- khung/nút vẽ tay ở độ nét gốc (27/9: bản thu nhỏ về khổ bản code rồi phóng lên → mờ, mặt nút nhuộm phẳng → "nhựa") ----------
def despill(im):
  """tím/hồng còn sót ở mép sau khi tách nền (r > g và b > g) → xám. Chỉ dùng cho khung/nút (tranh tím thật như đan dược thì không)"""
  a = np.asarray(im).astype(np.int16).copy()
  r, g, b = a[..., 0], a[..., 1], a[..., 2]
  m = (r > g + 6) & (b > g + 6)
  a[..., 0] = np.where(m, g, r)
  a[..., 2] = np.where(m, g, b)
  return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')

def raw_frame(src, width):
  """mẫu gốc đã tách nền → cắt sát khối (alpha > 200), khử tím, thu về bề ngang `width` (px ảnh 3x)"""
  im = despill(Image.open(src).convert('RGBA'))
  bx = im.getchannel('A').point(lambda v: 255 if v > 200 else 0).getbbox()
  im = im.crop(bx)
  return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)

def lacquer(img, color, seed=7):
  """mặt nút sơn mài: phần xám → màu sơn có chiều sâu (sáng trên, tối dưới và hai đầu), vân lớp sơn rất nhẹ, không vệt bóng trắng;
  phần có màu (viền, đầu bịt đồng) giữ nguyên"""
  a = np.asarray(img).astype(np.float32)
  h, w = a.shape[:2]
  mx, mn = a[..., :3].max(-1), a[..., :3].min(-1)
  keep = np.clip(((mx - mn) / np.maximum(mx, 1) - 0.12) / 0.12, 0, 1)[..., None]  # 1 = đồng, 0 = mặt xám
  L = a[..., :3] @ np.array([0.299, 0.587, 0.114], np.float32)
  med = np.median(L[(a[..., 3] > 128) & (keep[..., 0] < 0.5)]) if ((a[..., 3] > 128) & (keep[..., 0] < 0.5)).any() else 128
  detail = np.clip((L - med) / 420, -0.12, 0.12)[..., None]      # giữ gờ vát của tranh, bỏ vệt sáng mạnh
  y = np.linspace(0, 1, h)[:, None, None]
  x = np.abs(np.linspace(-1, 1, w))[None, :, None]
  shade = 1.10 - 0.30 * y - 0.18 * x ** 4                          # sáng trên, tối dưới, hai đầu tối hơn
  rng = np.random.default_rng(seed)
  low = np.asarray(Image.fromarray((rng.random((h // 6 + 1, w // 6 + 1)) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC), np.float32)[..., None] / 255
  grain = rng.normal(0, 1, (h, w, 1)).astype(np.float32)
  c = _rgb(color)
  face = c * (shade + detail + (low - 0.5) * 0.06) + grain * 2.2
  a[..., :3] = a[..., :3] * keep + face * (1 - keep)
  return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
