<script lang="ts">
  // Dải menu HUD chứa các NavBadge: điện thoại — hàng đáy màn; desktop — cột trái dưới thanh trên.
  // ink: huy hiệu nổi trên dải sương mờ (desktop: giấy sương viền kép); tắt art: dải giấy bồi lụa.
  import type { Snippet } from 'svelte'

  let { ink = false, children }: { ink?: boolean; children: Snippet } = $props()
</script>

<nav class="tabs" class:strip={!ink} class:ink>{@render children()}</nav>

<style>
  .tabs {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    padding: 12px 14px calc(14px + var(--safe-b));
    pointer-events: auto;
    filter: drop-shadow(0 -4px 10px rgb(var(--shade) / 0.18));
  }
  .ink {
    padding: 22px 8px calc(10px + var(--safe-b));
    background: linear-gradient(transparent, rgb(var(--mist) / 0.88) 42%, rgb(var(--mist) / 0.97));
    filter: none;
  }
  @media (min-width: 1024px) and (min-height: 600px) {
    .tabs {
      top: var(--top);
      right: auto;
      bottom: 0;
      width: var(--rail);
      grid-template-columns: 1fr;
      grid-auto-rows: 58px;
      align-content: start;
      gap: 2px;
      padding: var(--sp-4) var(--sp-4) 0;
      filter: drop-shadow(4px 0 10px rgb(var(--shade) / 0.18));
    }
    .ink {
      padding: 22px 8px calc(10px + var(--safe-b));
      background: var(--paper) var(--paper-tex);
      background-size: 128px;
      border: 0 solid transparent;
      border-image: var(--sk-strip);
      filter: none;
    }
  }
</style>
