// Tải lại font ấn (Ma Shan Zheng, OFL) chỉ gồm đúng các chữ Hán đang có trong src/.
// Chạy sau khi thêm chữ Hán mới: npm run fonts -w client
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

const UA = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' }
const files = readdirSync('src', { recursive: true }).filter(f => /\.(ts|svelte|css)$/.test(f))
const text = [...new Set(files.map(f => readFileSync(`src/${f}`, 'utf8')).join('').match(/[一-鿿]/g))].sort().join('')
const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&text=${encodeURIComponent(text)}`, { headers: UA })).text()
const font = await fetch(css.match(/url\((.*?)\)/)[1], { headers: UA })
if (!font.ok) throw new Error(`Tải font lỗi ${font.status}`)
writeFileSync('public/fonts/seal.woff2', Buffer.from(await font.arrayBuffer()))
console.log(`seal.woff2: ${text.length} chữ — ${text}`)
