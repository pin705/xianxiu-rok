# Khung giao diện sắc nét vẽ bằng code (27/9/2026): viền đồng có vát sáng/tối, lòng chuyển sắc, đường tối bên trong, vệt sáng trên.
# Thay các da nét mực run tay nhuộm màu (trông như bút dạ — "rẻ tiền"). Góc chạm vẽ tay chỉ còn ở khung lớn (make.py kit, mẫu ornate).
# Mỗi da: đúng khung + thông số 9 mảnh của bản vẽ code (.work/skins/meta.json), vẽ ở 3x cho màn iPhone.
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

K = 4  # siêu lấy mẫu để mép mịn
S = 3  # px ảnh mỗi px CSS

def _hex(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))

def _vgrad(w, h, top, bot):
  t = np.linspace(0, 1, h)[:, None, None]
  a = np.array(_hex(top), np.float32) * (1 - t) + np.array(_hex(bot), np.float32) * t
  return Image.fromarray(np.repeat(a, w, 1).astype(np.uint8), 'RGB')

def _rgrad(w, h, inner, outer, cx=0.42, cy=0.36):
  y, x = np.mgrid[0:h, 0:w]
  d = np.sqrt(((x - cx * w) / w) ** 2 + ((y - cy * h) / h) ** 2) / 0.75
  t = np.clip(d, 0, 1)[..., None]
  a = np.array(_hex(inner), np.float32) * (1 - t) + np.array(_hex(outer), np.float32) * t
  return Image.fromarray(a.astype(np.uint8), 'RGB')

def _mask(w, h, r, inset=0, ellipse=False):
  m = Image.new('L', (w, h), 0)
  d = ImageDraw.Draw(m)
  box = (inset, inset, w - 1 - inset, h - 1 - inset)
  if ellipse: d.ellipse(box, fill=255)
  else: d.rounded_rectangle(box, radius=max(0, r - inset), fill=255)
  return m

def frame(w_css, h_css, *, r=6, face=('#20353a', '#142328'), rim=('#caa96c', '#5f4a28'), rimw=2, inner='#0a1113',
          hi=0.10, inset_shadow=0.0, ellipse=False, gloss=0.0):
  """khung: viền kim loại vát (sáng trên → tối dưới), lòng chuyển sắc, đường tối trong viền, vệt sáng mảnh ở mép trên lòng"""
  W, H = round(w_css * S * K), round(h_css * S * K)
  R, RW = r * S * K, max(1, round(rimw * S * K))
  out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
  if rimw:
    out.paste(_vgrad(W, H, *rim), (0, 0), _mask(W, H, R, 0, ellipse))
  fm = _mask(W, H, R, RW, ellipse)
  f = _rgrad(W, H, *face) if ellipse else _vgrad(W, H, *face)
  out.paste(f, (0, 0), fm)
  # đường tối ngay trong viền (tách viền khỏi lòng — cảm giác gờ nổi)
  if rimw and inner:
    ring = ImageChops_sub(_mask(W, H, R, RW, ellipse), _mask(W, H, R, RW + max(1, S * K // 2), ellipse))
    out.paste(Image.new('RGB', (W, H), _hex(inner)), (0, 0), ring.point(lambda v: v * 0.7))
  if hi:  # vệt sáng mảnh ở mép trên lòng
    top = ImageChops_sub(_mask(W, H, R, RW + S * K // 2, ellipse), _shift(_mask(W, H, R, RW + S * K // 2, ellipse), S * K))
    out.paste(Image.new('RGB', (W, H), (255, 255, 255)), (0, 0), top.point(lambda v: v * hi))
  if inset_shadow:  # ô nhập, rãnh: bóng đổ vào trong từ mép trên
    sh = fm.filter(ImageFilter.GaussianBlur(3 * K))
    sh = ImageChops_sub(fm, _shift(sh, 2 * S * K))
    out.paste(Image.new('RGB', (W, H), (0, 0, 0)), (0, 0), sh.point(lambda v: v * inset_shadow))
  if gloss:  # thanh đầy: dải bóng nửa trên
    g = Image.new('L', (W, H), 0)
    ImageDraw.Draw(g).rectangle((0, 0, W, H // 2), fill=int(255 * gloss))
    g = ImageChops_mul(g, fm)
    out.paste(Image.new('RGB', (W, H), (255, 255, 255)), (0, 0), g)
  out = out.resize((W // K, H // K), Image.LANCZOS)
  # vân nhẹ (sơn mài, đồng đúc): mặt phẳng lì một màu là thứ làm khung trông như nhựa
  a = np.asarray(out).astype(np.float32)
  rng = np.random.default_rng(int(w_css * 7 + h_css * 13))
  a[..., :3] += rng.normal(0, 2.4, a.shape[:2] + (1,))
  return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')

def ImageChops_sub(a, b):
  return Image.fromarray(np.clip(np.asarray(a, np.int16) - np.asarray(b, np.int16), 0, 255).astype(np.uint8), 'L')

def ImageChops_mul(a, b):
  return Image.fromarray((np.asarray(a, np.float32) * np.asarray(b, np.float32) / 255).astype(np.uint8), 'L')

def _shift(m, dy):
  out = Image.new('L', m.size, 0)
  out.paste(m, (0, dy))
  return out

# ---------- bảng da ----------
# trắng sương (27/9/2026): viền mực, mặt giấy sương, điểm son / ngọc — theo concept sáng tạo
RIM = ('#4a443d', '#1f1b17')         # mực: sáng hơn chút ở trên
RIM_SOFT = ('#b6bab2', '#8f948b')    # viền nhạt (thẻ phụ)
RIM_RED = ('#d9604a', '#8a2a1e')
RIM_GOLD = ('#c9a45a', '#7a5a22')
RIM_JADE = ('#5aa77e', '#2f6b48')
FACE = ('#f8f9f6', '#eceee9')
FACE_UP = ('#ffffff', '#f1f2ee')     # thẻ nổi
FACE_IN = ('#e2e5df', '#eef0eb')     # lõm (ô nhập, rãnh)

SKINS = {  # tên da → tham số khung (bo góc px CSS hoặc 'pill' | 'disc')
  'groove': dict(r=6, face=FACE_IN, rim=('#b9bdb5', '#d6d9d2'), rimw=1, hi=0, inset_shadow=0.18),
  'field': dict(r=5, face=('#ffffff', '#f6f7f4'), rim=('#8f948b', '#6f6a62'), rimw=1, hi=0, inset_shadow=0.15),
  'capsule': dict(r='pill', face=('#fbfbf9', '#eef0eb'), rim=RIM, rimw=1, hi=0.3),
  'plate': dict(r='pill', face=('#fbfbf9', '#eef0eb'), rim=RIM, rimw=1, hi=0.3),
  'tag': dict(r='pill', face=('#f6f7f3', '#e9ebe6'), rim=RIM_SOFT, rimw=1),
  'tag-silk': dict(r='pill', face=('#ffffff', '#eef0eb'), rim=RIM_SOFT, rimw=1),
  'tag-good': dict(r='pill', face=('#e8f3ec', '#d6e9dd'), rim=RIM_JADE, rimw=1),
  'tag-bad': dict(r='pill', face=('#f8e6e2', '#f0d3cc'), rim=RIM_RED, rimw=1),
  'tag-gold': dict(r='pill', face=('#faf1dc', '#f0e2bf'), rim=RIM_GOLD, rimw=1),
  'tag-dark': dict(r='pill', face=('#2e2a26', '#1f1b17'), rim=('#6f6a62', '#1f1b17'), rimw=1),
  'tag-red': dict(r='pill', face=('#c0443a', '#9a2e24'), rim=('#e88a76', '#6a1a12'), rimw=1),
  'badge': dict(r='pill', face=('#d9493a', '#a8352a'), rim=('#ffffff', '#6a1a12'), rimw=1, hi=0.25),
  'badge-fresh': dict(r='pill', face=('#e0b95e', '#a8812e'), rim=('#ffffff', '#5a4214'), rimw=1, hi=0.25),
  'track': dict(r='pill', face=('#d9dcd5', '#e6e8e2'), rim=('#b3b7af', '#cfd2cb'), rimw=1, hi=0, inset_shadow=0.15),
  'fill': dict(r='pill', face=('#6cc3cf', '#2f8894'), rim=None, rimw=0, hi=0, gloss=0.25),
  'fill-gold': dict(r='pill', face=('#e6c070', '#a8812e'), rim=None, rimw=0, hi=0, gloss=0.25),
  'fill-good': dict(r='pill', face=('#8ccf84', '#3e8a4a'), rim=None, rimw=0, hi=0, gloss=0.25),
  'fill-bad': dict(r='pill', face=('#ee7a62', '#b3372a'), rim=None, rimw=0, hi=0, gloss=0.25),
  'fill-azure': dict(r='pill', face=('#8fb8e6', '#2d5a92'), rim=None, rimw=0, hi=0, gloss=0.25),
  'switch': dict(r='pill', face=('#dcdfd8', '#e8eae4'), rim=('#9a9e96', '#c0c3bb'), rimw=1, hi=0, inset_shadow=0.15),
  'switch-on': dict(r='pill', face=('#5aa77e', '#2f7a58'), rim=RIM_JADE, rimw=1, hi=0.2),
  # nút tròn: đĩa giấy sương vòng mực mảnh (như "Thư", "Sự kiện" của concept)
  'disc-paper': dict(r='disc', face=('#ffffff', '#e9ebe6'), rim=RIM, rimw=2, hi=0.3),
  'disc-silk': dict(r='disc', face=('#ffffff', '#e9ebe6'), rim=RIM, rimw=2, hi=0.3),
  'disc-azure': dict(r='disc', face=('#e9f0f7', '#cddbea'), rim=('#2d5a92', '#1b3a5e'), rimw=2, hi=0.3),
  'disc-gold': dict(r='disc', face=('#f6e3b0', '#d8b560'), rim=('#8a6a2a', '#4a3812'), rimw=2, hi=0.3),
  'knob': dict(r='disc', face=('#ffffff', '#dfe2db'), rim=('#6f6a62', '#2b2723'), rimw=1, hi=0.3),
}

def render(name, meta):
  """→ (ảnh, extra manifest) cho da `name` theo khung của bản vẽ code"""
  o = dict(SKINS[name])
  w_css, h_css = meta['pw'] / meta['S'], meta['ph'] / meta['S']
  r = o.pop('r')
  ellipse = r == 'disc'
  pill = r == 'pill'
  if pill: r = min(w_css, h_css) / 2
  if ellipse: r = 0
  im = frame(w_css, h_css, r=r, ellipse=ellipse, **o)
  sl = meta.get('slice') or [0, 0, 0, 0]
  extra = {}
  if any(sl):
    if pill:  # lát ngang phủ trọn đầu tròn (không thì đầu tròn bị kéo méo)
      cap = int(np.ceil(min(w_css, h_css) / 2))
      sl = [sl[0], max(sl[1], cap), sl[2], max(sl[3], cap)]
    extra = {'slice': [round(v * S) for v in sl], 'width': sl, 'outset': meta.get('outset') or 0, 'repeat': 'stretch'}
  return im, extra

UNDERLINES = {'stroke': '#b89c63', 'stroke-gold': '#e0c27e', 'stroke-red': '#e57a66'}

# ---------- viền kép mảnh (27/9: người chơi thích viền "nhẹ nhàng" kiểu bản vẽ bằng code: hai nét mảnh, không góc chạm nặng) ----------
def frame_double(w_css, h_css, *, r=3, face=('#12292d', '#0d2226'), outer='#a58c5c', inner='#6f5e3f', ow=1.4, iw=0.9, gap=3.5,
                 seed=3, fill=True):
  """nét ngoài + nét trong mảnh cách nhau `gap` px CSS, độ đậm nét thay đổi nhẹ dọc theo chiều dài (như nét bút thật, không cứng như nhựa)"""
  W, H = round(w_css * S * K), round(h_css * S * K)
  R = r * S * K
  out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
  if fill: out.paste(_vgrad(W, H, *face), (0, 0), _mask(W, H, R, 0))
  rng = np.random.default_rng(seed)
  def line(inset, width, color, amp):
    ring = ImageChops_sub(_mask(W, H, R, inset), _mask(W, H, max(0, R - width), inset + width))
    # độ đậm dao động chậm dọc theo viền (nhiễu mịn phóng to)
    n = np.asarray(Image.fromarray((rng.random((max(2, H // (40 * K)), max(2, W // (40 * K)))) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC), np.float32) / 255
    a = np.asarray(ring, np.float32) * (1 - amp + amp * n)
    out.paste(Image.new('RGB', (W, H), _hex(color)), (0, 0), Image.fromarray(a.astype(np.uint8), 'L'))
  line(0, round(ow * S * K), outer, 0.25)
  line(round((ow + gap) * S * K), round(iw * S * K), inner, 0.35)
  out = out.resize((W // K, H // K), Image.LANCZOS)
  a = np.asarray(out).astype(np.float32)
  a[..., :3] += np.random.default_rng(seed + 1).normal(0, 2.0, a.shape[:2] + (1,))
  return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')

DOUBLE = {  # da → tham số viền kép; bề dày viền 9 mảnh = ow + gap + iw + 3 px CSS — nét mực mảnh trên giấy sương
  'card': dict(face=FACE, outer='#2b2723', inner='#8f8a80'),
  'card-plain': dict(face=FACE, outer='#9a9e96', inner='#c6cac2'),
  'card-sel': dict(face=('#fdf3f0', '#f6e4df'), outer='#b3372a', inner='#d9907f'),
  'card-glow': dict(face=('#fffaf0', '#f7efdd'), outer='#a8812e', inner='#d8bf85'),
  'card-silk': dict(face=FACE_UP, outer='#8f948b', inner='#c6cac2'),
  'toast': dict(face=FACE_UP, outer='#2b2723', inner='#8f8a80'),
  'toast-bad': dict(face=('#fdf3f0', '#f6e4df'), outer='#b3372a', inner='#d9907f'),
  'scroll': dict(ow=1.8, iw=1.1, gap=4.5, fill=False, outer='#2b2723', inner='#7f7a71'),
  'strip': dict(ow=1.6, iw=1.0, gap=4.0, fill=False, outer='#2b2723', inner='#7f7a71'),
  'slip': dict(face=FACE, outer='#6f6a62', inner='#b6bab2'),
  'slip-bad': dict(face=('#fdf3f0', '#f6e4df'), outer='#b3372a', inner='#d9907f'),
}

def render_double(name, meta):
  o = DOUBLE[name]
  w_css, h_css = meta['pw'] / meta['S'], meta['ph'] / meta['S']
  im = frame_double(w_css, h_css, **o)
  b = round(o.get('ow', 1.4) + o.get('gap', 3.5) + o.get('iw', 0.9) + 3)
  return im, {'slice': [b * S] * 4, 'width': [b] * 4, 'outset': 0, 'repeat': 'stretch'}
