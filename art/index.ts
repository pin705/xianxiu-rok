// Hình vẽ SVG thủ công, sinh theo tham số. Không phụ thuộc game: chữ, luật, dữ liệu đều do bên dùng truyền vào.
// Màu đọc từ CSS var (--tile, --wall, --gold, --spirit, --rock…), bên dùng tự định nghĩa theo giờ/theme.
export { default as Art, type Kind } from './Art.svelte'
export { default as Defs } from './Defs.svelte'
export { default as Icon, type Name as IconName } from './Icon.svelte'
export { default as Portrait, type Look } from './Portrait.svelte'
