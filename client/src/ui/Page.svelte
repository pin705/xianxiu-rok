<script lang="ts">
  // Trang toàn màn hình dưới HUD (Môn hạ, Bảo khố): cuộn giấy dài, tiêu đề có dấu triện.
  import type { Snippet } from 'svelte'
  import Seal from './Seal.svelte'

  let { title, glyph, aside, children }: { title: string; glyph: string; aside?: Snippet; children: Snippet } = $props()
</script>

<div class="page paper">
  <header class="row between">
    <h2 class="row"><Seal {glyph} size={30} tilt />{title}</h2>
    {#if aside}<div class="row t-small t-soft">{@render aside()}</div>{/if}
  </header>
  {@render children()}
</div>

<style>
  .page {
    position: fixed;
    inset: 0;
    z-index: var(--z-page);
    max-width: var(--col);
    margin: 0 auto;
    padding: calc(132px + var(--safe-t)) var(--sp-3) calc(104px + var(--safe-b));
    overflow-y: auto;
    overscroll-behavior: contain;
    box-shadow: 0 0 40px rgb(20 14 10 / 0.35);
  }
  h2 {
    font-size: var(--fs-6);
    font-weight: 800;
  }
</style>
