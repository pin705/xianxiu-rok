<script lang="ts">
  // Tạ lễ (Reward Popup của RoK): vừa nhận vật phẩm (rương, thư có quà, sự kiện, cửa hàng…) thì một dải giấy ngắn liệt kê tên và
  // số lượng, tự tắt sau GIFT_MS (chạm để tắt) — người chơi biết mình vừa nhận gì mà không phải bấm đóng.
  // popover: lên lớp trên cùng như hộp thoại, mở sau nên nổi trên bảng đang mở (phần tử fixed thường bị hộp thoại modal che)
  import { Bag, Chit } from './ui'
  import { L } from './lib'
  import { social } from './social.svelte'

  const GIFT_MS = 1800
  let el = $state<HTMLElement>()
  let timer: ReturnType<typeof setTimeout> | undefined
  $effect(() => {
    if (!el?.showPopover) return
    if (!social.gift) return el.hidePopover()
    el.hidePopover() // mở lại để nổi trên hộp thoại vừa mở sau
    el.showPopover()
    clearTimeout(timer)
    timer = setTimeout(() => (social.gift = null), GIFT_MS) // quà dồn thêm thì hẹn lại từ đầu
  })
</script>

<!-- dải quà: hộp quà sơn son bên trái, tên và số vật phẩm bên phải -->
<Chit bind:el show={!!social.gift} art="ally-gift" title={L.gift.title} onclick={() => (social.gift = null)}>
  {#if social.gift}<Bag items={social.gift} size="sm" named />{/if}
</Chit>
