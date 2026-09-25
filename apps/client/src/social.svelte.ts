// Hồ sơ đang mở và cuộc truyền âm cần mở: màn nào cũng gọi được (chat, tiên minh, bản đồ giới) mà không phải truyền prop
// qua App. App vẽ bảng hồ sơ; Chat đang hiện (dải chat ở Bản đồ hoặc chat trong trang Tiên minh) mở cuộc truyền âm.
// arena: bảng Luận Kiếm Đài đang mở (HUD mở, App vẽ) · market: Phường thị đang mở (Thương hội mở, App vẽ)
// honor: bảng Công Huân mùa đang mở (thẻ mùa trên bản đồ Giới mở, App vẽ) · drill: Luận Võ Liên Hoàn (Diễn võ trường mở)
export const social = $state<{
  profile: number | null
  dm: { pid: number; name: string } | null
  arena: boolean
  market: boolean
  honor: boolean
  drill: boolean
}>({
  profile: null,
  dm: null,
  arena: false,
  market: false,
  honor: false,
  drill: false,
})
