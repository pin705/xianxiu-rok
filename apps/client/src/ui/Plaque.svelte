<script lang="ts">
  // Biển số liệu nhỏ: nhãn trên, số to giữa, dòng phụ dưới; viền trên đậm như biển gỗ treo. Xếp nhiều biển bằng .grid.
  import type { Snippet } from 'svelte'

  let {
    label,
    value,
    sub,
    tone,
    children,
  }: { label: string; value?: string | number; sub?: string; tone?: 'good' | 'bad'; children?: Snippet } = $props()
</script>

<span class="plaque {tone ?? ''}">
  <small>{label}</small>
  {#if value !== undefined}<b class="t-num">{value}</b>{/if}
  {#if sub}<small class="sub">{sub}</small>{/if}
  {#if children}{@render children()}{/if}
</span>

<style>
  .plaque {
    display: grid;
    align-content: start;
    justify-items: center;
    gap: 1px;
    min-width: 0;
    padding: 4px 6px 5px;
    text-align: center;
    background: rgb(255 255 255 / 0.7);
    border: 1px solid var(--paper3);
    border-top: 2px solid var(--rim, var(--ink3));
    border-radius: 3px;
  }
  small {
    font-size: var(--fs-1);
    color: var(--text-soft);
  }
  b {
    font-size: var(--fs-4);
  }
  .sub {
    color: var(--text-faint);
  }
  .good b {
    color: var(--good);
  }
  .bad b {
    color: var(--bad);
  }
</style>
