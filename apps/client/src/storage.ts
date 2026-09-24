// Lưu trên máy (localStorage). Trình duyệt chặn storage (chế độ riêng tư, hết chỗ) thì vẫn chơi được, chỉ không lưu.
export const read = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
export const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v)
  } catch {}
}
