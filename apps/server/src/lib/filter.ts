// Lọc từ tục trong chat, tên tiên minh, bố cáo. Khớp nguyên từ trên chữ NFC GIỮ DẤU: "cặc" bị chặn mà "các", "lớn" thì không
// (bỏ dấu rồi so là chặn nhầm cả nửa tiếng Việt). Có cả teencode/viết tắt hay gặp.
// ponytail: danh sách từ — lách được bằng chèn ký tự; dùng dịch vụ kiểm duyệt ngoài khi cộng đồng lớn.
const WORDS = [
  'địt', 'đụ', 'đéo', 'lồn', 'buồi', 'cặc', 'đĩ', 'đm', 'đmm', 'đcm', 'dm', 'dmm', 'dcm', 'đkm', 'dkm', 'vcl', 'vkl', 'vãi lồn', 'clm', 'cmm', 'cmnr',
  'địt mẹ', 'đụ má', 'con đĩ', 'óc chó', 'ngu như chó', 'fuck', 'fucking', 'shit', 'bitch', 'cunt', 'dick', 'pussy',
]
const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const BAD = new RegExp(`(?<![\\p{L}\\p{N}])(${WORDS.map(w => escape(w.normalize('NFC'))).join('|')})(?![\\p{L}\\p{N}])`, 'giu')

export const clean = (text: string) => text.normalize('NFC').replace(/\s+/g, ' ').trim()
export const hasBad = (text: string) => new RegExp(BAD.source, 'iu').test(clean(text))
// Thay từ tục bằng dấu sao (giữ độ dài để câu vẫn đọc được)
export const mask = (text: string) => clean(text).replace(BAD, m => '*'.repeat([...m].length))
