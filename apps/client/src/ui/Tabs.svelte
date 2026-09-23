<script lang="ts" generics="T extends string">
  // Thẻ chuyển trong bảng: rãnh mực nhạt vẽ tay, thẻ đang mở là mảng son loang viền mực.
  import { sfx } from '../lib'

  let { items, value, onchange }: { items: readonly { id: T; label: string }[]; value: T; onchange: (id: T) => void } = $props()
</script>

<div class="tabs" role="tablist">
  {#each items as it (it.id)}
    <button role="tab" aria-selected={it.id === value} class:on={it.id === value} onclick={() => it.id !== value && (sfx('tap'), onchange(it.id))}>{it.label}</button>
  {/each}
</div>

<style>
  .tabs {
    display: grid;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
    gap: 3px;
    padding: 4px;
    margin-top: var(--sp-2);
    border: 0 solid transparent;
    border-image: var(--sk-groove);
  }
  button {
    min-height: 40px;
    padding-bottom: 3px;
    font-size: var(--fs-3);
    font-weight: 700;
    color: var(--text-soft);
    border: 0 solid transparent;
    transition: color var(--dur-2) var(--ease);
  }
  .on {
    color: var(--silk);
    text-shadow: 0 1px 1px rgb(0 0 0 / 0.35);
    border-image: var(--sk-btn-danger);
  }
</style>
