// Hình vẽ của game. Không phụ thuộc game: chữ, luật, dữ liệu đều do bên dùng truyền vào.
// brush/noise/palette: bút lông vẽ ra canvas (dùng cho cảnh WebGL lẫn giao diện). Icon, Portrait: SVG cho HTML.
export { default as Art, type Kind } from './Art.svelte'
export { default as Defs } from './Defs.svelte'
export { default as Icon, type Name as IconName } from './Icon.svelte'
export { default as Portrait, type Look } from './Portrait.svelte'
export * from './brush'
export * from './noise'
export * from './palette'
export * from './paper'
export * from './landscape'
export * from './buildings'
