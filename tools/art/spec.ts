// node tools/art/spec.ts — keys.json (mọi key từng nướng, export.ts gộp thêm) + manifest → docs/ART_SPEC.md:
// danh sách tranh theo nhóm, cỡ nguồn đề xuất, và tiến độ (key nào đã có tranh).
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

type Seen = { kind: 'dom' | 'tex' | 'skin'; w: number; h: number; px: number; slice?: number[]; screens?: string[] }
const ROOT = join(import.meta.dirname, '..', '..')
const keys: Record<string, Seen> = JSON.parse(readFileSync(join(import.meta.dirname, 'keys.json'), 'utf8'))
const done: Record<string, unknown> = JSON.parse(
  readFileSync(join(ROOT, 'apps/client/public/art/manifest.json'), 'utf8'),
)

// một tranh phủ nhiều key: huy hiệu theo hình chạm (đĩa vẽ bằng code theo tông), yêu thú theo hệ (tint), sân trận theo cảnh (phủ mọi cỡ)
function painted(k: string) {
  if (k in done) return true
  const [p, a] = k.split(':')
  if (p === 'medal' || p === 'wmark') return `emblem:${a}` in done
  if (p === 'beast') return `beast:${a}` in done
  if (p === 'field') return `field:${a}` in done
  if (`${p}:*0` in done) return true // họ key động (mây): vài tranh chung
  return false
}

const GROUPS: { re: RegExp; title: string; note: string; make: string; fx?: boolean }[] = [
  {
    re: /^face:/,
    title: 'Chân dung',
    note: 'Bán thân, khung vuông cắt tròn. Key theo mã trưởng lão (`face:<mã>`), `face:master` là chưởng môn.',
    make: 'faces',
  },
  {
    re: /^(bld|panel):/,
    title: 'Công trình',
    note: '`bld:<mã>:<bậc>:<biến thể>` trên núi; `panel:<mã>:<bậc>` là cùng công trình ở đầu bảng chi tiết — trỏ cùng một file.',
    make: 'buildings',
  },
  {
    re: /^(peak|ledge|stair|far\d)(:|$)/,
    title: 'Núi, bậc đá, cầu thang',
    note: 'Vẽ đè giữ nguyên đường bao bản code (công trình đứng trên bậc đá).',
    make: 'scenery · far',
  },
  {
    re: /^(pine|rock|bamboo|blossom|lantern|plot|scaffold|crane|bird|walker|worker|disciple|flag|lotus|ring|pearl|fly|sun|moon)(:|$)/,
    title: 'Đồ trang trí',
    note: 'Cắt từ bảng 3×3, đặt theo chân khớp khung bao bản code.',
    make: 'props',
  },
  {
    re: /^skin:/,
    title: 'Da giao diện',
    note: '9 mảnh: `slice` (px ảnh) + `width` (px CSS) trong manifest. Ảnh nguyên tấm: vân giấy, nét cọ, đĩa, công tắc.',
    make: 'skins · paper · strokes',
  },
  { re: /^icon:/, title: 'Icon màu', note: 'Vật phẩm, tài nguyên, đan, pháp bảo, phù.', make: 'icons' },
  { re: /^mask:/, title: 'Icon thao tác đơn sắc', note: 'Game chỉ lấy alpha, tô bằng màu chữ nơi đặt.', make: 'masks' },
  {
    re: /^(tab:|pointer$)/,
    title: 'Icon thanh điều hướng',
    note: '5 thẻ dưới màn hình, tay chỉ hướng dẫn.',
    make: 'icons (bảng F)',
  },
  {
    re: /^(medal|wmark):/,
    title: 'Huy hiệu',
    note: '`medal:<hình chạm>:<tông>`. Chỉ vẽ hình chạm (`emblem:<tên>`), đĩa màu vẽ bằng code theo tông → mọi tổ hợp.',
    make: 'emblems',
  },
  {
    re: /^(map|march|wtoken)(:|$)/,
    title: 'Bản đồ',
    note: 'Nền bản đồ vùng (vẽ đè), tông môn trên bản đồ, quân hành quân.',
    make: 'map · props',
  },
  {
    re: /^(sold|beast|item|thunder|field):/,
    title: 'Chiến trường',
    note: 'Quân `sold:<hệ>:<phe>:<bậc>`; yêu thú một dáng xám mỗi hệ (`beast:<hệ>`, tint theo loài); sân `field:<cảnh>`.',
    make: 'troops · beasts · fields',
  },
  {
    re: /^(fog|cloud|mist|glow|spark|puff|ray|beam|radiance)(:|$)/,
    title: 'Hiệu ứng (giữ vẽ bằng code)',
    note: 'Sinh theo hạt ngẫu nhiên, không cần vẽ tay.',
    make: '—',
    fx: true,
  },
]
const OTHER = { re: /./, title: 'Khác', note: 'Chưa xếp nhóm — thêm vào GROUPS trong tools/art/spec.ts.', make: '?' }

const r4 = (n: number) => Math.ceil(n / 4) * 4
function source(s: Seen): [number, number] {
  // đủ nét trên màn 3x (keys.json ghi cỡ ở 2x)
  if (s.kind === 'skin') return [r4(s.w * 3), r4(s.h * 3)]
  if (s.kind === 'tex') return [r4(s.w * s.px * 1.5), r4(s.h * s.px * 1.5)]
  const long = Math.max(128, r4(s.px * 1.5))
  return [r4((s.w * long) / Math.max(s.w, s.h)), r4((s.h * long) / Math.max(s.w, s.h))]
}
const KIND = { dom: 'ảnh HTML', tex: 'texture cảnh', skin: 'da' }

const buckets = new Map<string, [string, Seen][]>()
for (const [k, s] of Object.entries(keys).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))) {
  const g = (GROUPS.find(x => x.re.test(k)) ?? OTHER).title
  buckets.set(g, [...(buckets.get(g) ?? []), [k, s]])
}
const all = [...GROUPS, OTHER].filter(g => buckets.has(g.title))
const count = (rows: [string, Seen][]) => rows.filter(([k]) => painted(k)).length
const real = all.filter(g => !('fx' in g && g.fx)).flatMap(g => buckets.get(g.title)!)
const total = real.length,
  have = count(real)

let md = `# Danh sách tranh

Mọi hình trong game có một **key**. Tranh vẽ tay nằm ở \`apps/client/public/art/\`, khai trong \`manifest.json\`; key chưa có tranh thì game vẽ bằng code như cũ.
Mở game với \`?art=0\` để tắt toàn bộ tranh (so trước/sau). Cách vẽ thêm, prompt và công cụ: [tools/art/README.md](../tools/art/README.md).

**Đã có tranh ${have}/${total} (${Math.round((have / total) * 100)}%)**, không tính hiệu ứng:

| Nhóm | Số key | Đã có tranh | Lệnh (\`make.py\`) |
| --- | ---: | ---: | --- |
${all.map(g => `| ${g.title} | ${buckets.get(g.title)!.length} | ${'fx' in g && g.fx ? '—' : count(buckets.get(g.title)!)} | ${g.make} |`).join('\n')}
`
for (const g of all) {
  const rows = buckets.get(g.title)!
  md += `\n## ${g.title}\n\n${g.note}\n\n`
  if ('fx' in g && g.fx) {
    const by = new Map<string, number>()
    for (const [k] of rows) by.set(k.split(':')[0], (by.get(k.split(':')[0]) ?? 0) + 1)
    md += [...by].map(([p, n]) => `- \`${p}:…\` — ${n} biến thể`).join('\n') + '\n'
    continue
  }
  const skin = rows.some(([, s]) => s.slice)
  md += `| Key | Loại | Hộp | Nguồn đề xuất |${skin ? ' Viền 9 mảnh (px CSS) |' : ''}\n| --- | --- | ---: | ---: |${skin ? ' --- |' : ''}\n`
  for (const [k, s] of rows) {
    const [sw, sh] = source(s)
    md += `| ${painted(k) ? '✓ ' : ''}\`${k}\` | ${KIND[s.kind]} | ${Math.round(s.w)}×${Math.round(s.h)} | ${sw}×${sh} |${skin ? ` ${s.slice?.join(' ') ?? ''} |` : ''}\n`
  }
}
writeFileSync(join(ROOT, 'docs/ART_SPEC.md'), md)
console.log(`${Object.keys(keys).length} key, có tranh ${have}/${total} → docs/ART_SPEC.md`)
