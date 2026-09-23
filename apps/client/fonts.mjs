// Tải font về tự host (chơi offline, không gọi Google lúc chạy) và sinh src/fonts.css.
// Mỗi họ font được Google cắt theo hệ chữ; @font-face kèm unicode-range nên trình duyệt chỉ tải phần chữ trang thật sự dùng —
// thêm tiếng Nga hay tiếng Nhật không làm nặng máy người chơi Việt. Thêm ngôn ngữ mới: thêm họ font vào FAMILIES rồi chạy
//   npm run fonts -w @rok/client
// font-display: block — chữ còn được vẽ lên canvas (cảnh núi, trận đánh): chờ font thật, không vẽ bằng font tạm rồi giữ nguyên.
// Alegreya (OFL): serif nét bút lông, đủ Latin, Latin mở rộng, Việt, Cyrillic, Hy Lạp.
// Hệ chữ Alegreya không có (Hán/Nhật/Hàn, Thái, Ả Rập, Devanagari…): thêm họ Noto Serif tương ứng — cùng tinh thần serif,
// Google cắt CJK thành ~100 lát nhỏ theo unicode-range nên cũng chỉ tải chữ cần.
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'

const FAMILIES = [
  { name: 'Alegreya', query: 'Alegreya:ital,wght@0,400..900;1,400..900' },
  // { name: 'Noto Serif SC', query: 'Noto+Serif+SC:wght@400..900' },  // khi có tiếng Trung giản thể
  // { name: 'Noto Serif JP', query: 'Noto+Serif+JP:wght@400..900' },  // tiếng Nhật
  // { name: 'Noto Serif Thai', query: 'Noto+Serif+Thai:wght@400..900' }, // tiếng Thái
]
const OUT = import.meta.dirname
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' }
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')

mkdirSync(`${OUT}/public/fonts`, { recursive: true })
for (const f of readdirSync(`${OUT}/public/fonts`)) if (/\.woff2$/.test(f) && f !== 'seal.woff2') rmSync(`${OUT}/public/fonts/${f}`)
let css = '/* Sinh bởi fonts.mjs — đừng sửa tay. */\n'
let files = 0
for (const fam of FAMILIES) {
  const src = await (await fetch(`https://fonts.googleapis.com/css2?family=${fam.query}&display=block`, { headers: UA })).text()
  for (const [, subset, block] of src.matchAll(/\/\* ([\w-]+) \*\/\s*(@font-face \{[^}]+\})/g)) {
    const style = block.match(/font-style: (\w+)/)[1]
    const file = `${slug(fam.name)}-${style === 'italic' ? 'i-' : ''}${subset}.woff2`
    const res = await fetch(block.match(/url\((.*?)\)/)[1], { headers: UA })
    if (!res.ok) throw new Error(`Tải ${file} lỗi ${res.status}`)
    writeFileSync(`${OUT}/public/fonts/${file}`, Buffer.from(await res.arrayBuffer()))
    css += `/* ${fam.name} · ${subset} */\n${block.replace(/src: url\(.*?\) format\('woff2'\);/, `src: url('/fonts/${file}') format('woff2');`)}\n`
    files++
  }
}
writeFileSync(`${OUT}/src/fonts.css`, css)
console.log(`${files} file font → public/fonts, src/fonts.css`)
