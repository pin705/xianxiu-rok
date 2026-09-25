# Gọi IMG Studio (https://imgstudio.site/docs/api). Khoá: IMG_STUDIO_KEY trong .env ở gốc repo — không bao giờ in ra.
# Tạo ảnh mới khi không có ảnh mẫu, sửa ảnh (edit) khi có. Chạy đồng bộ, chờ tới 5 phút mỗi ảnh; 202/429/5xx thì thử lại cùng khoá.
import json, os, time, uuid, mimetypes, urllib.request, urllib.error

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BASE = 'https://imgstudio.site'
MODELS = {  # tên ngắn → provider_id (GET /api/v1/providers để xem thêm)
  'nbp': 'flow-nano-banana-pro',                      # Nano Banana Pro: model của bộ tranh thủy mặc, ~150đ/ảnh sửa, 3 ảnh mẫu
  'pro': '301fed0f-82b9-47f7-b2a0-e710ae5e4d55',      # Gemini-3-Pro-Image, 8 ảnh mẫu
  'gpt25': '58529d86-ba18-442f-9e14-94595bb78631',    # GPT-Image-2.5 Flare, nền trong suốt (ra chất AI bóng — người dùng đã loại)
}
LOG = os.path.join(os.path.dirname(__file__), '.work', 'log.jsonl')

def _key():
  for line in open(os.path.join(ROOT, '.env')):
    if line.startswith('IMG_STUDIO_KEY='):
      return line.split('=', 1)[1].strip().strip('"\'')
  raise SystemExit('thiếu IMG_STUDIO_KEY trong .env')

def _req(method, path, body=None, headers=None):
  r = urllib.request.Request(BASE + path, data=body, method=method, headers={'Authorization': f'Bearer {_key()}', **(headers or {})})
  try:
    with urllib.request.urlopen(r, timeout=320) as res:
      return res.status, res.read()
  except urllib.error.HTTPError as e:
    return e.code, e.read()

def _multipart(fields, files):
  b = uuid.uuid4().hex
  out = bytearray()
  for k, v in fields.items():
    out += f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
  for path in files:
    ct = mimetypes.guess_type(path)[0] or 'image/png'
    out += f'--{b}\r\nContent-Disposition: form-data; name="images"; filename="{os.path.basename(path)}"\r\nContent-Type: {ct}\r\n\r\n'.encode()
    out += open(path, 'rb').read() + b'\r\n'
  out += f'--{b}--\r\n'.encode()
  return bytes(out), f'multipart/form-data; boundary={b}'

def generate(out, prompt, refs=(), model='nbp', aspect='1:1', resolution='1K', quality='high', transparent=False):
  """Ghi ảnh (webp) ra `out`. refs: ảnh mẫu (thứ tự = "Image 1, Image 2…" trong prompt)."""
  key = f'rok-{os.path.basename(out)}-{uuid.uuid4().hex[:8]}'  # giữ nguyên khi thử lại để không bị tính tiền hai lần
  fields = {'prompt': prompt, 'provider_id': MODELS.get(model, model), 'aspect_ratio': aspect, 'resolution': resolution,
            'quality': quality, 'background': 'transparent' if transparent else 'opaque'}
  for attempt in range(40):
    if refs:
      body, ct = _multipart(fields, refs)
      st, data = _req('POST', '/api/v1/images/edit', body, {'Content-Type': ct, 'Idempotency-Key': key})
    else:
      st, data = _req('POST', '/api/v1/images/generate', json.dumps({**fields, 'count': 1}).encode(),
                      {'Content-Type': 'application/json', 'Idempotency-Key': key})
    if st == 200: break
    if st in (202, 429) or st >= 500:
      time.sleep(3 if st == 202 else min(60, 5 * (attempt + 1)))
      continue
    raise RuntimeError(f'{os.path.basename(out)}: HTTP {st} {data[:300]!r}')
  else:
    raise RuntimeError(f'{os.path.basename(out)}: hết lượt thử')
  j = json.loads(data)
  st, img = _req('GET', j['url'])  # file trên server chỉ giữ ~6 giờ: tải ngay
  if st != 200: raise RuntimeError(f'{os.path.basename(out)}: tải ảnh HTTP {st}')
  os.makedirs(os.path.dirname(out), exist_ok=True)
  open(out, 'wb').write(img)
  os.makedirs(os.path.dirname(LOG), exist_ok=True)
  with open(LOG, 'a') as f:
    f.write(json.dumps({'out': os.path.relpath(out, ROOT), 'model': j.get('model'), 'aspect': aspect, 'refs': [os.path.relpath(r, ROOT) for r in refs],
                        'prompt': prompt, 'cost_vnd': j.get('cost_vnd'), 'balance_vnd': j.get('balance_vnd')}, ensure_ascii=False) + '\n')
  print(f'✓ {os.path.relpath(out, ROOT)} {j.get("cost_vnd")}đ, còn {j.get("balance_vnd")}đ', flush=True)
  return out
