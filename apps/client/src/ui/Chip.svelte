<script lang="ts">
  // Thẻ tre nhỏ chọn một ô (trận đồ 1·2·3…): đang chọn nền trắng, viền son, vệt son trên đầu; bấm lại ô đang chọn vẫn gọi
  // onclick (nạp lại). Xếp bằng .row.wrap. tab: thẻ trong role="tablist" (aria-selected thay cho aria-pressed).
  import type { Snippet } from 'svelte'

  let {
    on = false,
    tab = false,
    onclick,
    children,
  }: { on?: boolean; tab?: boolean; onclick: () => void; children: Snippet } = $props()
</script>

<button
  type="button"
  class="chip"
  class:on
  role={tab ? 'tab' : undefined}
  aria-selected={tab ? on : undefined}
  aria-pressed={tab ? undefined : on}
  {onclick}>{@render children()}</button
>

<style>
  .chip {
    position: relative;
    min-width: 58px;
    min-height: 34px;
    padding: 4px 10px;
    font-size: var(--fs-2);
    font-weight: 800;
    color: var(--text-soft);
    background: var(--paper2);
    border: 1px solid var(--paper3);
    border-radius: 4px;
  }
  .on {
    color: var(--text);
    background: var(--paper);
    border-color: var(--cinnabar);
    box-shadow: 0 2px 5px rgb(var(--shade) / 0.12);
  }
  .on::before {
    content: '';
    position: absolute;
    inset: 2px 6px auto;
    height: 3px;
    border-radius: 2px;
    background: var(--cinnabar);
  }
</style>
