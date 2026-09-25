# contrast.py <.work/contrast/nhãn> — đọc <nhãn>.json + <nhãn>-raw.png (contrast.ts), đo nền dưới từng đoạn chữ, in chỗ khó đọc
# và vẽ khung đỏ lên <nhãn>.png. Nền = trung vị các điểm trong khung chữ khác màu chữ nhất (nửa xa màu chữ), không tính nét chữ.
import json, re, sys
import numpy as np
from PIL import Image, ImageDraw

base = sys.argv[1]
data = json.load(open(base + '.json'))
im = Image.open(base + '-raw.png').convert('RGB')
px = np.asarray(im).astype(np.float32)
k = data['dpr']

def lum(c):
  c = np.asarray(c, np.float32) / 255
  c = np.where(c <= 0.03928, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * c[..., 0] + 0.7152 * c[..., 1] + 0.0722 * c[..., 2]

def ratio(a, b):
  la, lb = lum(a), lum(b)
  return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)

bad = []
for t in data['items']:
  m = re.match(r'rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?', t['color'])
  if not m: continue
  fg = np.array([float(m[1]), float(m[2]), float(m[3])])
  alpha = float(m[4]) if m[4] else 1
  x0, y0 = int(t['x'] * k), int(t['y'] * k)
  x1, y1 = int((t['x'] + t['w']) * k), int((t['y'] + t['h']) * k)
  box = px[max(0, y0):y1, max(0, x0):x1].reshape(-1, 3)
  if len(box) < 20: continue
  d = np.abs(box - fg).sum(1)
  bg = np.median(box[d >= np.median(d)], axis=0)
  fg_seen = fg * alpha + bg * (1 - alpha)
  r = float(ratio(fg_seen, bg))
  big = t['size'] >= 18 or (t['size'] >= 14 and t['weight'] >= 700)
  need = 3.0 if big else 4.5
  if r < need: bad.append((r, need, t, bg))

d = ImageDraw.Draw(im)
for r, need, t, bg in bad:
  d.rectangle([t['x'] * k, t['y'] * k, (t['x'] + t['w']) * k, (t['y'] + t['h']) * k], outline=(255, 0, 0), width=max(2, int(k)))
im.save(base + '.png')
print(f'{len(data["items"])} đoạn chữ, {len(bad)} khó đọc → {base}.png')
for r, need, t, bg in sorted(bad, key=lambda b: b[0]):
  print(f'  {r:4.1f} (cần {need:g})  {t["size"]:.0f}px  "{t["text"]}"  chữ {t["color"]}  nền rgb({int(bg[0])},{int(bg[1])},{int(bg[2])})')
