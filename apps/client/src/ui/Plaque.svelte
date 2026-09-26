<script lang="ts">
  // Biển số liệu nhỏ: nhãn trên, số to giữa, dòng phụ dưới; viền trên đậm như biển gỗ treo. Xếp nhiều biển bằng .grid.
  // pic: tranh nhỏ bên trái (đồng hồ mặt trời…), chữ canh trái cạnh tranh. on: viền son (của mình — phe mình).
  import type { Snippet } from 'svelte'

  let {
    label,
    value,
    sub,
    tone,
    pic,
    on = false,
    children,
  }: {
    label?: string
    value?: string | number
    sub?: string
    tone?: 'good' | 'bad'
    pic?: Snippet
    on?: boolean
    children?: Snippet
  } = $props()
</script>

{#if pic}
  <span class="plaque side {tone ?? ''}" class:on>
    {@render pic()}
    <span class="stack" style:--gap="0"
      >{#if label}<small>{label}</small>{/if}{#if children}{@render children()}{/if}</span
    >
  </span>
{:else}<span class="plaque {tone ?? ''}" class:on>
    {#if label}<small>{label}</small>{/if}
    {#if value !== undefined}<b class="t-num">{value}</b>{/if}
    {#if sub}<small class="sub">{sub}</small>{/if}
    {#if children}{@render children()}{/if}
  </span>{/if}

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
  .side {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    align-content: center;
    justify-items: start;
    gap: 8px;
    padding: 5px 10px 6px;
    text-align: left;
  }
  small {
    font-size: var(--fs-1);
    color: var(--text-soft);
  }
  b {
    font-size: var(--fs-4);
  }
  .on {
    border-color: var(--cinnabar);
    border-top-width: 3px;
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
