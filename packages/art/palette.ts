// Bảng màu khoáng của tranh thanh lục sơn thủy. Nguồn duy nhất: cả nét vẽ lẫn giao diện (client/src/ui) đọc từ đây.
export const PIGMENT = {
  ink: '#211c17', // 墨 mực đậm
  ink2: '#4b443c', // mực pha
  ink3: '#8a8175', // 淡墨 mực nhạt
  paper: '#efe6d2', // 宣纸 giấy xuyến chỉ
  paper2: '#e2d4b6', // giấy cũ
  paper3: '#cdb993', // mép giấy ố
  silk: '#f7f2e6', // 铅白 trắng chì
  azurite: '#2f6a8f', // 石青
  azuriteD: '#1b4566',
  azuriteL: '#78a6c2',
  malachite: '#3e8a6b', // 石绿
  malachiteD: '#285f4b',
  malachiteL: '#8cc09d',
  ochre: '#a8784a', // 赭石
  ochreL: '#cda97c',
  cinnabar: '#b8382a', // 朱砂
  cinnabarL: '#d9604a',
  gold: '#c9a14a', // 泥金
  goldL: '#ecd08a',
  goldD: '#8a672a',
  gamboge: '#e3b64c', // 藤黄
  indigo: '#34465e', // 花青
  lacquer: '#231713', // 漆
  lacquer2: '#3b281f',
  spirit: '#7fd6dc', // linh khí
} as const
export type Pigment = keyof typeof PIGMENT

// '#rrggbb' + độ đậm → chuỗi rgba cho canvas
export function rgba(hex: string, a = 1) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`
}

// Trộn hai màu hex theo t (0 → a, 1 → b)
export function mix(a: string, b: string, t: number) {
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16)
  const c = (s: number) => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t)
  return `#${((c(16) << 16) | (c(8) << 8) | c(0)).toString(16).padStart(6, '0')}`
}
