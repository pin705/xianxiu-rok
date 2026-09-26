<script lang="ts">
  // Khung HUD: lớp phủ cố định trên cảnh (chạm xuyên chỗ trống), giữ cột game trên điện thoại.
  // ink: bộ đồ vật vẽ tay (có tranh ui:nav-*) — thanh chat nhích lên trên dải huy hiệu menu.
  import type { Snippet } from 'svelte'

  let { ink = false, children }: { ink?: boolean; children: Snippet } = $props()
</script>

<div class="hud" class:ink>{@render children()}</div>

<style>
  .hud {
    position: fixed;
    inset: 0;
    z-index: var(--z-hud);
    max-width: var(--col);
    margin: 0 auto;
    pointer-events: none;
  }
  /* thanh chat nằm trên dải menu (cao hơn thanh tab cũ) */
  :global(html:has(.hud.ink)) {
    --nav-h: 122px;
  }
  @media (min-width: 1024px) and (min-height: 600px) {
    .hud {
      max-width: none;
    }
    :global(html:has(.hud.ink)) {
      --nav-h: 0px;
    }
  }
</style>
