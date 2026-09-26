<script lang="ts">
  // Góc người nói trên cảnh (cố vấn dẫn đường): chân dung + bong bóng lời (con cuối giãn hết chỗ, bấm được), trồi lên.
  // Điện thoại: trái, trên dải chat, chừa cột nút bên phải; desktop: cạnh cột trái, sát đáy.
  import type { Snippet } from 'svelte'

  let { label, children }: { label: string; children: Snippet } = $props()
</script>

<aside class="corner" aria-label={label}>{@render children()}</aside>

<style>
  .corner {
    position: fixed;
    left: 8px;
    bottom: calc(var(--safe-b) + var(--nav-h, 88px) + 44px);
    z-index: var(--z-hud);
    display: flex;
    gap: 12px;
    align-items: flex-end;
    width: min(calc(100vw - 96px), calc(var(--col) - 96px), 330px);
    pointer-events: none;
    animation: rise 0.4s var(--ease);
  }
  .corner > :global(:last-child) {
    flex: 1;
    pointer-events: auto;
  }
  @keyframes rise {
    from {
      opacity: 0;
      translate: 0 12px;
    }
  }
  @media (min-width: 1024px) and (min-height: 600px) {
    .corner {
      left: calc(var(--rail) + 24px);
      bottom: var(--sp-5);
      width: min(520px, 100% - var(--rail) - 140px);
    }
  }
</style>
