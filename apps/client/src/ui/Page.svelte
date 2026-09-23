<script lang="ts">
  // Trang toàn màn hình dưới HUD (Môn hạ, Bảo khố): cuộn tranh dài bồi lụa, tiêu đề có icon vẽ tay.
  import type { Snippet } from 'svelte'
  import { paintedUrl, tabIcon, type TabIcon } from '@rok/art'

  let { title, icon, aside, children }: { title: string; icon: TabIcon; aside?: Snippet; children: Snippet } = $props()
</script>

<div class="page paper">
  <header class="row between">
    <h2 class="row"><img src={paintedUrl(`tab:${icon}`, () => tabIcon(icon), 38)} width="38" height="38" alt="" draggable="false" />{title}</h2>
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
    padding: calc(132px + var(--safe-t)) 26px calc(104px + var(--safe-b));
    overflow-y: auto;
    overscroll-behavior: contain;
    border: 0 solid transparent;
    border-image: var(--sk-scroll);
    box-shadow: 0 0 40px rgb(20 14 10 / 0.35);
  }
  h2 {
    --gap: var(--sp-2);
    font-size: var(--fs-6);
    font-weight: 800;
  }
</style>
