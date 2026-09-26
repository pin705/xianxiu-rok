<script lang="ts">
  // Sổ số liệu: mỗi ô nhãn nhỏ + số đậm, ngăn bằng nét mực đứt; `cols` ô mỗi hàng (nhiều hàng thì kẻ thêm vạch ngang).
  // size: lg (số to, một hàng chỉ số) · md (nhiều hàng, số vừa).
  type Cell = { label: string; value: string | number; tone?: 'good' | 'bad'; num?: boolean }
  let { items, cols = items.length, size = 'lg' }: { items: Cell[]; cols?: number; size?: 'lg' | 'md' } = $props()
</script>

<dl class="tally {size}" class:rows={items.length > cols} style:--cols={cols}>
  {#each items as it, i (i)}
    <div class:first={i % cols === 0}>
      <dt>{it.label}</dt>
      <dd class:t-num={it.num !== false} class:t-good={it.tone === 'good'} class:t-bad={it.tone === 'bad'}>
        {it.value}
      </dd>
    </div>
  {/each}
</dl>

<style>
  .tally {
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
    text-align: center;
  }
  div {
    padding: 6px 4px;
  }
  div:not(.first) {
    border-left: 1px dashed var(--paper3);
  }
  .rows div {
    border-bottom: 1px dashed var(--paper3);
  }
  dt {
    font-size: var(--fs-1);
    color: var(--text-soft);
  }
  dd {
    font-size: var(--fs-4);
    font-weight: 900;
  }
  .md dd {
    font-size: var(--fs-3);
  }
</style>
