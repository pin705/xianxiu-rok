import type { ElderId, Items } from '@rok/rules'
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
  quiz: boolean
  unlock: number // Chủ điện vừa lên tầng này: màn Mở khoá (0: đóng)
  gift: Items | null // vật phẩm vừa nhận: dải Tạ lễ (null: tắt)
  elders: ElderId[] // trưởng lão vừa thu nhận, chờ màn Thu nhận lần lượt (trống: tắt)
}>({
  profile: null,
  dm: null,
  arena: false,
  market: false,
  honor: false,
  drill: false,
  quiz: false,
  unlock: 0,
  gift: null,
  elders: [],
})
