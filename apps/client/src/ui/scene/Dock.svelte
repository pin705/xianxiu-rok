<script lang="ts">
  // Thanh nổi cố định trên cảnh bản đồ (chạm xuyên chỗ trống xuống bản đồ): top — hàng dưới HUD (nút gạt Giới|Vùng, thẻ
  // mùa; fade: dải giấy mờ dần sau hàng nút); side — cột lối tắt bên phải; foot — danh sách đội trên thanh tab; tools — cột
  // công cụ góc phải dưới. Desktop căn theo vùng cảnh (bên phải cột trái). class: bố cục phần con (.row, .stack…).
  import type { Snippet } from 'svelte'

  let {
    at,
    fade = false,
    class: cls = '',
    el = $bindable(),
    children,
  }: {
    at: 'top' | 'side' | 'foot' | 'tools'
    fade?: boolean
    class?: string
    el?: HTMLDivElement
    children: Snippet
  } = $props()
</script>

<div class="dock {at} {cls}" class:fade bind:this={el}>{@render children()}</div>

<style>
  .dock {
    position: fixed;
    z-index: var(--z-page);
  }
  .top {
    top: calc(142px + var(--safe-t));
    left: 50%;
    width: min(100%, var(--col));
    padding: 0 var(--sp-3);
    translate: -50% 0;
    pointer-events: none;
  }
  .top > :global(*),
  .tools > :global(*) {
    pointer-events: auto;
  }
  /* dải giấy mờ dần sau hàng nút: nhãn mục tiêu cuộn qua thì chìm dần, không bị cắt ngang giữa chữ */
  .fade::before {
    content: '';
    position: absolute;
    inset: -14px 0 -22px;
    z-index: -1;
    background: linear-gradient(color-mix(in srgb, var(--paper) 88%, transparent) 55%, transparent);
  }
  .side {
    top: calc(196px + var(--safe-t));
    right: max(8px, (100% - var(--col)) / 2 + 8px);
    display: grid;
    gap: 10px;
    width: 72px;
  }
  .foot {
    bottom: calc(100px + var(--safe-b));
    left: 50%;
    width: min(100% - 24px, 456px);
    translate: -50% 0;
  }
  .tools {
    right: var(--sp-3);
    bottom: calc(var(--safe-b) + 150px);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    pointer-events: none;
  }
  /* bảng bật ra trong cột công cụ (lớp tình hình) không trải quá rộng che bản đồ */
  .tools > :global(*) {
    max-width: 256px;
  }
  @media (min-width: 1024px) and (min-height: 600px) {
    .top,
    .foot {
      left: calc(var(--rail) + (100% - var(--rail)) / 2);
    }
    .top {
      top: calc(var(--top) + var(--sp-4));
      width: min(100% - var(--rail), 640px);
    }
    .foot {
      bottom: var(--sp-5);
      width: min(100% - var(--rail) - 48px, 520px);
    }
    .side {
      top: calc(var(--top) + 76px);
      right: 20px;
    }
    .tools {
      bottom: calc(var(--safe-b) + 24px);
    }
  }
</style>
