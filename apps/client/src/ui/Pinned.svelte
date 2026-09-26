<script lang="ts">
  // Dải giấy ghim đáy bảng, dính lại khi cuộn (hạng của mình, việc đang theo): viền mực, vạch son trên, bóng hắt lên.
  import type { Snippet } from 'svelte'

  let { children }: { children: Snippet } = $props()
</script>

<div class="pinned">{@render children()}</div>

<style>
  .pinned {
    position: sticky;
    bottom: -28px;
    z-index: 1;
    display: grid;
    gap: 1px;
    margin: var(--sp-3) -6px 0;
    padding: 8px 10px 9px;
    background: var(--paper);
    border: 1px solid var(--rim, var(--ink3));
    border-top: 3px solid var(--cinnabar);
    border-radius: 6px;
    box-shadow: 0 -4px 12px rgb(0 0 0 / 0.12);
  }
</style>
