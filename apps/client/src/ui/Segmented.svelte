<script lang="ts" generics="T extends string">
  // Nấc chọn liền nhau trong một khung viền mực (hệ đệ tử…): nấc chọn tô son chữ trắng.
  import { sfx } from '../lib'

  let { items, value, onchange }: { items: readonly { id: T; label: string }[]; value: T; onchange: (id: T) => void } =
    $props()
</script>

<div class="seg" style:--n={items.length}>
  {#each items as it (it.id)}
    <button
      type="button"
      class:on={it.id === value}
      aria-pressed={it.id === value}
      onclick={() => {
        sfx('tap')
        onchange(it.id)
      }}>{it.label}</button
    >
  {/each}
</div>

<style>
  .seg {
    display: grid;
    grid-template-columns: repeat(var(--n), 1fr);
    border: 1px solid var(--rim, var(--ink3));
    border-radius: 6px;
    overflow: hidden;
  }
  button {
    min-height: 34px;
    font-size: var(--fs-2);
    font-weight: 700;
    color: var(--text-soft);
    background: rgb(255 255 255 / 0.5);
  }
  button + button {
    border-left: 1px solid var(--paper3);
  }
  .on {
    color: var(--text-inv);
    background: var(--cinnabar);
  }
</style>
