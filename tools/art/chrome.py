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
RIM = ('#a88d5a', '#4a3a20')         # đồng cổ: sáng trên, tối dưới — dịu, không vàng chói
RIM_SOFT = ('#5d7478', '#26383c')    # viền mờ (thẻ phụ)
RIM_RED = ('#f08f78', '#8a2a1e')
RIM_GOLD = ('#e6c682', '#7a5a22')
RIM_JADE = ('#8fd0a8', '#2f6b48')
FACE = ('#173238', '#0d2226')
FACE_UP = ('#1d3b40', '#122a2e')     # thẻ nổi
FACE_IN = ('#0c1618', '#152326')     # lõm (ô nhập, rãnh)

SKINS = {  # tên da → (hàm vẽ nhận (w_css, h_css) , bo góc px CSS hoặc 'pill' | 'disc')
  'groove': dict(r=6, face=FACE_IN, rim=('#0a1214', '#2a3e42'), rimw=1, hi=0, inset_shadow=0.5),
  'field': dict(r=5, face=FACE_IN, rim=('#3d5256', '#6f5a36'), rimw=1, hi=0, inset_shadow=0.55),
  'capsule': dict(r='pill', face=('#0f1b1e', '#162629'), rim=RIM, rimw=1, hi=0.05, inset_shadow=0.35),
  'plate': dict(r='pill', face=('#1d3034', '#122125'), rim=RIM, rimw=1),
  'tag': dict(r='pill', face=FACE_UP, rim=RIM_SOFT, rimw=1),
  'tag-silk': dict(r='pill', face=FACE_UP, rim=RIM_SOFT, rimw=1),
  'tag-good': dict(r='pill', face=('#1f3a2b', '#152a1f'), rim=RIM_JADE, rimw=1),
  'tag-bad': dict(r='pill', face=('#3a1d1a', '#241312'), rim=RIM_RED, rimw=1),
  'tag-gold': dict(r='pill', face=('#34301f', '#231f14'), rim=RIM_GOLD, rimw=1),
  'tag-dark': dict(r='pill', face=('#0e1719', '#0a1113'), rim=RIM, rimw=1),
  'tag-red': dict(r='pill', face=('#c0443a', '#8a2a20'), rim=('#f2a08c', '#5a1510'), rimw=1),
  'badge': dict(r='pill', face=('#e25442', '#9a2a20'), rim=('#ffc2b0', '#5a1510'), rimw=1, hi=0.25),
  'badge-fresh': dict(r='pill', face=('#d9b25f', '#8a6a28'), rim=('#fff0c0', '#5a4214'), rimw=1, hi=0.25),
  'track': dict(r='pill', face=FACE_IN, rim=('#0a1214', '#2a3e42'), rimw=1, hi=0, inset_shadow=0.5),
  'fill': dict(r='pill', face=('#7fd6e0', '#2f8894'), rim=None, rimw=0, hi=0, gloss=0.22),
  'fill-gold': dict(r='pill', face=('#ecc978', '#9a7428'), rim=None, rimw=0, hi=0, gloss=0.22),
  'fill-good': dict(r='pill', face=('#9ad98c', '#3e8a4a'), rim=None, rimw=0, hi=0, gloss=0.22),
  'fill-bad': dict(r='pill', face=('#f07a62', '#a8352a'), rim=None, rimw=0, hi=0, gloss=0.22),
  'fill-azure': dict(r='pill', face=('#9cc4f0', '#3a6aa8'), rim=None, rimw=0, hi=0, gloss=0.22),
  'switch': dict(r='pill', face=FACE_IN, rim=('#0a1214', '#3a4e52'), rimw=1, hi=0, inset_shadow=0.5),
  'switch-on': dict(r='pill', face=('#3f8a5c', '#24583a'), rim=RIM_JADE, rimw=1, hi=0.12),
  # nút tròn (IconButton, nút cạnh màn): huy hiệu đồng vát, lòng lam sẫm
  'disc-paper': dict(r='disc', face=('#2a4449', '#10201f'), rim=RIM, rimw=3, hi=0.12),
  'disc-silk': dict(r='disc', face=('#2a4449', '#10201f'), rim=RIM, rimw=3, hi=0.12),
  'disc-azure': dict(r='disc', face=('#3e6b96', '#15304a'), rim=RIM, rimw=3, hi=0.12),
  'disc-gold': dict(r='disc', face=('#e0bd6e', '#7a5a22'), rim=('#fff0c0', '#5a4214'), rimw=2, hi=0.2),
  'knob': dict(r='disc', face=('#f4ecdc', '#b9ad92'), rim=('#ffffff', '#7a6a4a'), rimw=1, hi=0.3),
}

def render(name, meta):
  """→ (ảnh, extra manifest) cho da `name` theo khung của bản vẽ code"""
  o = dict(SKINS[name])
  w_css, h_css = meta['pw'] / meta['S'], meta['ph'] / meta['S']
  r = o.pop('r')
  ellipse = r == 'disc'
  if r == 'pill': r = min(w_css, h_css) / 2
  if ellipse: r = 0
  im = frame(w_css, h_css, r=r, ellipse=ellipse, **o)
  sl = meta.get('slice') or [0, 0, 0, 0]
  extra = {}
  if any(sl):
    if o.get('rimw', 2) is not None and SKINS[name]['r'] == 'pill':  # lát ngang phủ trọn đầu tròn (không thì đầu tròn bị kéo méo)
      cap = int(np.ceil(min(w_css, h_css) / 2))
      sl = [sl[0], max(sl[1], cap), sl[2], max(sl[3], cap)]
    extra = {'slice': [round(v * S) for v in sl], 'width': sl, 'outset': meta.get('outset') or 0, 'repeat': 'stretch'}
  return im, extra

# ---------- gạch dưới tiêu đề (thay vệt cọ): đường kim loại mảnh, đậm ở trái, mờ dần về phải ----------
def underline(color, w=320, h=28):
  """ảnh 320×28 kéo giãn 100% bề ngang tiêu đề, cao 5–12 px CSS: đường nằm ở ~1/4 dưới ảnh (dày ~2 px khi hiện 7 px)"""
  a = np.zeros((h, w, 4), np.float32)
  c = np.array(_hex(color), np.float32)
  fade = np.clip(1.15 - np.linspace(0, 1, w) * 1.15, 0, 1) ** 1.4
  y0, y1 = int(h * 0.62), int(h * 0.86)
  a[y0:y1, :, :3] = c
  a[y0:y1, :, 3] = fade * 255
  a[y0, :, 3] *= 0.5  # mép mịn
  a[y1 - 1, :, 3] *= 0.5
  return Image.fromarray(a.astype(np.uint8), 'RGBA')

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

DOUBLE = {  # da → tham số viền kép; bề dày viền 9 mảnh = ow + gap + iw + 3 px CSS
  'card': dict(), 'card-plain': dict(outer='#4f6a6b', inner='#35504f'),
  'card-sel': dict(outer='#e57a66', inner='#9a4a3c', face=('#2a2224', '#1b1a1c')),
  'card-glow': dict(outer='#e0c27e', inner='#a88d5a', face=('#1d3634', '#132a2a')),
  'card-silk': dict(outer='#5d7a79', inner='#3e5857', face=('#1a383c', '#12292d')),
  'toast': dict(), 'toast-bad': dict(outer='#e57a66', inner='#9a4a3c', face=('#3a1d1a', '#241312')),
  'scroll': dict(ow=1.8, iw=1.1, gap=4.5, fill=False), 'strip': dict(ow=1.6, iw=1.0, gap=4.0, fill=False),
  'slip': dict(outer='#6f8a88', inner='#45605e'), 'slip-bad': dict(outer='#e57a66', inner='#9a4a3c', face=('#3a1d1a', '#241312')),
}

def render_double(name, meta):
  o = DOUBLE[name]
  w_css, h_css = meta['pw'] / meta['S'], meta['ph'] / meta['S']
  im = frame_double(w_css, h_css, **o)
  b = round(o.get('ow', 1.4) + o.get('gap', 3.5) + o.get('iw', 0.9) + 3)
  return im, {'slice': [b * S] * 4, 'width': [b] * 4, 'outset': 0, 'repeat': 'stretch'}
