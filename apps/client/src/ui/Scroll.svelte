<script lang="ts">
  // Cuộn tranh treo: giấy trắng giữa hai trục gỗ. rar: phẩm (2 lam · 3 tím · 4 vàng — viền theo phẩm); off: chưa có (xám);
  // onclick: cả cuộn bấm được. Dùng cho trưởng lão, thẻ nhân vật, tranh trưng bày.
  import type { Snippet } from 'svelte'
  import { sfx } from '../lib'

  let {
    rar = 0,
    off = false,
    label,
    title,
    onclick,
    children,
  }: {
    rar?: number
    off?: boolean
    label?: string
    title?: string
    onclick?: (e: MouseEvent) => void
    children: Snippet
  } = $props()
</script>

{#if onclick}
  <button
    type="button"
    class="scroll rar{rar}"
    class:off
    disabled={off}
    aria-label={label}
    {title}
    onclick={e => {
      sfx('tap')
      onclick(e)
    }}>{@render children()}</button
  >
{:else}
  <div class="scroll rar{rar}" class:off {title}>{@render children()}</div>
{/if}

<style>
  .scroll {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 2px;
    width: 100%;
    padding: 14px 6px 16px;
    color: var(--text);
    background: linear-gradient(#fff, var(--paper2));
    border: 1px solid var(--paper3);
    box-shadow: 0 4px 8px rgb(var(--shade) / 0.14);
    transition: transform var(--dur-1) var(--ease);
  }
  button.scroll {
    cursor: pointer;
  }
  button.scroll:active:not(:disabled) {
    transform: scale(0.97);
  }
  .scroll::before,
  .scroll::after {
    content: '';
    position: absolute;
    left: -5px;
    right: -5px;
    height: 7px;
    background: linear-gradient(var(--wood), var(--wood-d));
    border-radius: 4px;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.3);
  }
  .scroll::before {
    top: -4px;
  }
  .scroll::after {
    bottom: -4px;
  }
  .rar3 {
    border-color: color-mix(in srgb, var(--rar3) 50%, white);
  }
  .rar4 {
    border-color: color-mix(in srgb, var(--rar4) 55%, white);
    box-shadow:
      0 4px 8px rgb(var(--shade) / 0.14),
      0 0 10px rgb(var(--gold-glow) / 0.5);
  }
  .off {
    background: linear-gradient(var(--paper2), var(--paper3));
    cursor: default;
  }
</style>
