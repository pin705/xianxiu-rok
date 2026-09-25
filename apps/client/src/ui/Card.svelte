<script lang="ts">
  // Thẻ giấy vẽ tay: mép xơ, ố vàng dọc mép, viền mực kẻ tay (một mục trong danh sách, ô thông tin). button: cả thẻ bấm được.
  // silk: thẻ lụa lam lục (mục nổi bật, hành quân trên bản đồ, rương thưởng); glow: ánh vàng (có thưởng để nhận).
  import type { Snippet } from 'svelte'
  import { sfx } from '../lib'

  let {
    tone = 'paper',
    onclick,
    disabled = false,
    selected = false,
    label,
    children,
  }: {
    tone?: 'paper' | 'silk' | 'glow'
    onclick?: (e: MouseEvent) => void
    disabled?: boolean
    selected?: boolean
    label?: string
    children: Snippet
  } = $props()
</script>

{#if onclick}
  <button
    class="card {tone}"
    class:selected
    {disabled}
    aria-label={label}
    aria-pressed={selected || undefined}
    onclick={e => {
      sfx('tap')
      onclick(e)
    }}
  >
    {@render children()}
  </button>
{:else}
  <div class="card {tone}" class:selected>{@render children()}</div>
{/if}

<style>
  .card {
    position: relative;
    display: block;
    width: 100%;
    padding: 13px 14px 14px;
    text-align: left;
    color: var(--text);
    border: 0 solid transparent;
    border-image: var(--sk-card);
  }
  .glow {
    border-image: var(--sk-card-glow);
  }
  .silk {
    border-image: var(--sk-card-silk);
  }
  .selected {
    border-image: var(--sk-card-sel);
  }
  button.card:active:not(:disabled) {
    transform: translateY(1px);
  }
  button.card:disabled {
    opacity: 0.72;
  }
</style>
