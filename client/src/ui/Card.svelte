<script lang="ts">
  // Thẻ giấy có viền mực mảnh (một mục trong danh sách, ô thông tin). button: cả thẻ bấm được.
  import type { Snippet } from 'svelte'
  import { sfx } from '../lib'

  let {
    tone = 'paper',
    onclick,
    disabled = false,
    selected = false,
    label,
    children,
  }: { tone?: 'paper' | 'lacquer' | 'glow'; onclick?: () => void; disabled?: boolean; selected?: boolean; label?: string; children: Snippet } = $props()
</script>

{#if onclick}
  <button class="card {tone}" class:selected {disabled} aria-label={label} aria-pressed={selected || undefined} onclick={() => (sfx('tap'), onclick())}>
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
    padding: var(--sp-3);
    text-align: left;
    color: var(--text);
    background:
      linear-gradient(rgb(255 255 255 / 0.28), transparent 70%),
      var(--paper) var(--paper-tex);
    background-size: auto, 128px;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ink) 38%, transparent), var(--shadow-1);
    clip-path: polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px);
  }
  .lacquer {
    color: var(--text-inv);
    background: var(--lacquer) var(--lacquer-tex);
    background-size: 96px;
    box-shadow: inset 0 0 0 1px var(--gold-d);
  }
  .glow {
    background:
      linear-gradient(rgb(255 255 255 / 0.3), transparent 70%),
      color-mix(in srgb, var(--gold-l) 45%, var(--paper)) var(--paper-tex);
    background-size: auto, 128px;
    background-blend-mode: normal, multiply;
    box-shadow: inset 0 0 0 1.5px var(--gold), var(--shadow-1);
  }
  .selected {
    box-shadow: inset 0 0 0 2px var(--cinnabar), var(--shadow-1);
  }
  button.card:active:not(:disabled) {
    transform: translateY(1px);
  }
  button.card:disabled {
    opacity: 0.72;
  }
</style>
