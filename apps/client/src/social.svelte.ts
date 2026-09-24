// Hồ sơ đang mở và cuộc truyền âm cần mở: màn nào cũng gọi được (chat, tiên minh, bản đồ giới) mà không phải truyền prop
// qua App. App vẽ bảng hồ sơ; Chat đang hiện (dải chat ở Bản đồ hoặc chat trong trang Tiên minh) mở cuộc truyền âm.
export const social = $state<{ profile: number | null; dm: { pid: number; name: string } | null }>({
  profile: null,
  dm: null,
})
