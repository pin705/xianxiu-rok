<script lang="ts" generics="T extends string">
  // Thẻ chuyển trong bảng: như các dải thẻ đánh dấu sách; thẻ đang mở là sơn son.
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
    padding: 3px;
    margin-top: var(--sp-2);
    background: color-mix(in srgb, var(--ink) 14%, transparent);
    clip-path: polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px);
  }
  button {
    min-height: 38px;
    font-size: var(--fs-3);
    font-weight: 700;
    color: var(--text-soft);
    clip-path: polygon(5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px), 0 5px);
    transition: background var(--dur-2) var(--ease), color var(--dur-2) var(--ease);
  }
  .on {
    color: var(--silk);
    background: linear-gradient(rgb(255 255 255 / 0.15), transparent 50%), var(--cinnabar);
    text-shadow: 0 1px 1px rgb(0 0 0 / 0.3);
  }
</style>
