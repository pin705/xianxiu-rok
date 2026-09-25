<script lang="ts">
  // Tạ lễ (Reward Popup của RoK): vừa nhận vật phẩm (rương, thư có quà, sự kiện, cửa hàng…) thì một dải giấy ngắn liệt kê tên và
  // số lượng, tự tắt sau GIFT_MS (chạm để tắt) — người chơi biết mình vừa nhận gì mà không phải bấm đóng.
  // popover: lên lớp trên cùng như hộp thoại, mở sau nên nổi trên bảng đang mở (phần tử fixed thường bị hộp thoại modal che)
  import { Bag } from './ui'
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

<div class="strip" popover="manual" bind:this={el}>
  {#if social.gift}
    <button aria-live="polite" onclick={() => (social.gift = null)}>
      <b class="t-small">{L.gift.title}</b>
      <Bag items={social.gift} size="sm" named />
    </button>
  {/if}
</div>

<style>
  .strip {
    position: fixed;
    inset: auto auto calc(96px + var(--safe-b, 0px)) 50%; /* trên thanh tab */
    width: min(100% - 32px, 420px);
    margin: 0;
    padding: 0;
    overflow: visible;
    color: var(--text);
    background: none;
    border: 0;
    translate: -50% 0;
  }
  button {
    display: grid;
    justify-items: center;
    gap: 6px;
    width: 100%;
    padding: 12px 28px 13px;
    border: 0 solid transparent;
    border-image: var(--sk-slip);
    filter: drop-shadow(0 4px 8px rgb(var(--shade) / 0.35));
    animation: rise var(--dur-3) var(--spring);
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    button {
      animation: none;
    }
  }
</style>
