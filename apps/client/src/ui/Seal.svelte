<script lang="ts">
  // Ấn son tròn: nút hành động lớn (nâng cấp, tuyển, luyện…) hoặc dấu ghi số (cấp, tầng) đè góc tranh.
  // Có onclick → nút; không → dấu tĩnh. size: đường kính px. big: dấu tĩnh số to đóng xuống như ấn (tầng vừa mở khoá).
  import type { Snippet } from 'svelte'
  import { sfx } from '../lib'

  let {
    size = 104,
    big = false,
    disabled = false,
    label,
    onclick,
    children,
  }: {
    size?: number
    big?: boolean
    disabled?: boolean
    label?: string
    onclick?: (e: MouseEvent) => void
    children: Snippet
  } = $props()
</script>

{#if onclick}
  <button
    type="button"
    class="seal"
    style:--size="{size}px"
    {disabled}
    aria-label={label}
    onclick={e => {
      sfx('tap')
      onclick(e)
    }}>{@render children()}</button
  >
{:else}
  <span class="seal still" class:big style:--size="{size}px" aria-label={label}>{@render children()}</span>
{/if}

<style>
  .seal {
    display: grid;
    flex: none;
    place-items: center;
    width: var(--size);
    height: var(--size);
    padding: calc(var(--size) * 0.12);
    font-size: clamp(11px, calc(var(--size) * 0.165), var(--fs-4));
    font-weight: 900;
    line-height: 1.1;
    text-align: center;
    color: var(--pill-fg);
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.45);
    background: var(--ui-seal-img, radial-gradient(circle at 40% 35%, var(--cinnabar-l, #e0604c), var(--cinnabar) 60%))
      center / 100% 100% no-repeat;
    border: 0;
    border-radius: 50%;
    filter: drop-shadow(0 4px 8px rgb(110 31 24 / 0.35));
    transition: transform var(--dur-1) var(--ease);
  }
  button.seal {
    cursor: pointer;
  }
  button.seal:active:not(:disabled) {
    transform: scale(0.94) rotate(-4deg);
  }
  .seal:disabled {
    filter: grayscale(0.85) opacity(0.7);
    cursor: default;
  }
  .still {
    rotate: -8deg;
  }
  .big {
    font-size: calc(var(--size) * 0.4);
    rotate: 0deg;
    animation: stamp 0.45s var(--spring) both;
  }
  @keyframes stamp {
    from {
      opacity: 0;
      transform: scale(1.8) rotate(-12deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .big {
      animation: none;
    }
  }
</style>
