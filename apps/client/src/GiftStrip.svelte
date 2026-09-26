<script lang="ts">
  // Tạ lễ (Reward Popup của RoK): vừa nhận vật phẩm (rương, thư có quà, sự kiện, cửa hàng…) thì một dải giấy ngắn liệt kê tên và
  // số lượng, tự tắt sau GIFT_MS (chạm để tắt) — người chơi biết mình vừa nhận gì mà không phải bấm đóng.
  // popover: lên lớp trên cùng như hộp thoại, mở sau nên nổi trên bảng đang mở (phần tử fixed thường bị hộp thoại modal che)
  import { artOf } from '@rok/art'
  import { Bag } from './ui'
  import { L } from './lib'
  import { social } from './social.svelte'

  const GIFT_MS = 1800
  const box = artOf('ui:ally-gift')?.src
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
    <!-- dải quà: hộp quà sơn son bên trái, tên và số vật phẩm bên phải -->
    <button aria-live="polite" class:boxed={!!box} onclick={() => (social.gift = null)}>
      {#if box}<img src={box} alt="" draggable="false" />{/if}
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
  .boxed {
    grid-template-columns: 52px minmax(0, 1fr);
    justify-items: start;
    column-gap: 12px;
    padding-left: 18px;
    text-align: left;
  }
  .boxed img {
    grid-row: span 2;
    width: 52px;
    height: 52px;
    object-fit: contain;
    rotate: -6deg;
    filter: drop-shadow(0 2px 3px rgb(var(--shade) / 0.25));
  }
  .boxed b {
    color: var(--cinnabar);
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
