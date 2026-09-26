<script lang="ts" generics="T extends string">
  // Dải huy hiệu chọn một (radiogroup): mỗi mục một huy hiệu (snippet `item`), mục đang chọn phóng to + gạch vàng dưới, mục
  // khác mờ; `current`: chấm vàng góc (đang theo). Phím mũi tên đổi mục (onstep ±1). Dải chín đạo thống, chọn phe.
  import type { Snippet } from 'svelte'

  let {
    items,
    value,
    current,
    label,
    onpick,
    onstep,
    item,
  }: {
    items: readonly { id: T; label: string }[]
    value: T
    current?: T
    label: string
    onpick: (id: T) => void
    onstep: (d: number) => void
    item: Snippet<[T]>
  } = $props()
  function key(e: KeyboardEvent) {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!d) return
    e.preventDefault()
    onstep(d)
  }
</script>

<div class="emblems" style:--n={items.length} role="radiogroup" aria-label={label} tabindex="0" onkeydown={key}>
  {#each items as it (it.id)}
    <button
      type="button"
      role="radio"
      aria-checked={it.id === value}
      aria-label={it.label}
      tabindex="-1"
      class:on={it.id === value}
      onclick={() => onpick(it.id)}
    >
      {@render item(it.id)}
      {#if it.id === current}<i class="cur"></i>{/if}
    </button>
  {/each}
</div>

<style>
  .emblems {
    display: grid;
    grid-template-columns: repeat(var(--n), 1fr);
    width: 100%;
    margin-top: var(--sp-1);
    outline-offset: 4px;
  }
  button {
    position: relative;
    display: grid;
    place-items: center;
    padding: 6px 0 8px;
    background: none;
    border: 0;
    cursor: pointer;
    transition: transform var(--dur-2) var(--spring);
  }
  button:not(.on) {
    opacity: 0.62;
  }
  button.on {
    transform: scale(1.22);
  }
  button.on::after {
    content: '';
    position: absolute;
    bottom: 0;
    width: 60%;
    height: 3px;
    border-radius: 2px;
    background: var(--gold-l);
  }
  .cur {
    position: absolute;
    top: 2px;
    right: 8%;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--gold-l);
    box-shadow: 0 0 0 1.5px var(--rim, var(--ink3));
  }
</style>
