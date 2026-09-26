<script lang="ts">
  // Tờ giấy ghim son: bùa ngày, cáo thị, lá thư, lệnh bài giấy… Nền giấy bùa, đinh son trên đầu, nghiêng nhẹ như ghim tay.
  // tilt: độ nghiêng (độ) — danh sách xen kẽ −1/1 cho tự nhiên; ready: viền son sáng (có thưởng chờ nhận); onclick: cả tờ bấm được.
  import type { Snippet } from 'svelte'
  import { sfx } from '../lib'

  let {
    tilt = 0,
    pin = true,
    ready = false,
    dim = false,
    label,
    onclick,
    children,
  }: {
    tilt?: number
    pin?: boolean
    ready?: boolean
    dim?: boolean
    label?: string
    onclick?: (e: MouseEvent) => void
    children: Snippet
  } = $props()
</script>

{#if onclick}
  <button
    type="button"
    class="note"
    class:pin
    class:ready
    class:dim
    style:rotate="{tilt}deg"
    aria-label={label}
    onclick={e => {
      sfx('tap')
      onclick(e)
    }}>{@render children()}</button
  >
{:else}
  <div class="note" class:pin class:ready class:dim style:rotate="{tilt}deg">{@render children()}</div>
{/if}

<style>
  .note {
    position: relative;
    display: grid;
    align-content: start;
    gap: 4px;
    width: 100%;
    padding: 12px 10px 10px;
    text-align: inherit;
    color: var(--text);
    background: var(--talisman);
    border: 1px solid var(--talisman-edge);
    border-radius: 3px;
    box-shadow: 0 3px 6px rgb(var(--shade) / 0.14);
  }
  .pin::before {
    content: '';
    position: absolute;
    top: -6px;
    left: calc(50% - 6px);
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--pin);
    box-shadow: 0 2px 2px rgb(0 0 0 / 0.3);
  }
  .ready {
    border-color: var(--cinnabar);
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--cinnabar) 35%, transparent),
      0 0 14px rgb(var(--gold-glow) / 0.6);
  }
  .dim {
    opacity: 0.62;
  }
  button.note:active {
    transform: translateY(1px);
  }
</style>
