<script lang="ts">
  // Bong bóng lời nói: giấy trắng viền mực, đuôi chỉ về người nói. side: phía người nói (trái: người khác, phải: mình);
  // mine: tô son nhạt (lời của mình). fit: rộng theo chữ (tối đa 88%), dạt về phía người nói. onclick: cả bong bóng bấm được.
  import type { Snippet } from 'svelte'

  let {
    side = 'left',
    mine = false,
    fit = false,
    onclick,
    children,
  }: {
    side?: 'left' | 'right'
    mine?: boolean
    fit?: boolean
    onclick?: () => void
    children: Snippet
  } = $props()
</script>

{#if onclick}
  <button type="button" class="speech {side}" class:mine class:fit {onclick}>{@render children()}</button>
{:else}
  <div class="speech {side}" class:mine class:fit>{@render children()}</div>
{/if}

<style>
  .speech {
    position: relative;
    display: grid;
    gap: 3px;
    min-width: 0;
    padding: 8px 12px 9px;
    color: var(--text);
    background: rgb(255 255 255 / 0.96);
    border: 1.5px solid var(--rim, var(--ink3));
    border-radius: 14px 14px 14px 4px;
    box-shadow: 0 4px 12px rgb(var(--shade) / 0.18);
  }
  .speech::before {
    content: '';
    position: absolute;
    bottom: 12px;
    width: 12px;
    height: 12px;
    background: inherit;
    border-bottom: 1.5px solid var(--rim, var(--ink3));
    transform: rotate(45deg);
  }
  .left::before {
    left: -7.5px;
    border-left: 1.5px solid var(--rim, var(--ink3));
  }
  .right {
    border-radius: 14px 14px 4px 14px;
  }
  .right::before {
    right: -7.5px;
    border-right: 1.5px solid var(--rim, var(--ink3));
    transform: rotate(-45deg);
  }
  button.speech {
    text-align: left;
  }
  .fit {
    width: fit-content;
    max-width: 88%;
  }
  .fit.right {
    margin-left: auto;
  }
  .mine {
    background: color-mix(in srgb, var(--cinnabar) 8%, white);
  }
</style>
