<script module lang="ts">
  export type ButtonVariant = 'primary' | 'gold' | 'danger' | 'ghost' | 'quiet'
</script>

<script lang="ts">
  // Nút dạng thẻ bài góc vát: viền kim, mặt sơn có vân giấy, đế nổi — nhấn thì lún. Mọi nút tự phát tiếng gõ.
  import type { Snippet } from 'svelte'
  import { Icon, type IconName } from '@rok/art'
  import { sfx } from '../lib'

  let {
    variant = 'primary',
    size = 'md',
    wide = false,
    icon,
    trail,
    trailIcon,
    disabled = false,
    silent = false,
    type = 'button',
    label,
    onclick,
    children,
  }: {
    variant?: ButtonVariant
    size?: 'sm' | 'md' | 'lg'
    wide?: boolean
    icon?: IconName
    trail?: string // ô phụ cuối nút: thời gian, số lượng
    trailIcon?: IconName
    disabled?: boolean
    silent?: boolean
    type?: 'button' | 'submit'
    label?: string
    onclick?: (e: MouseEvent) => void
    children?: Snippet
  } = $props()

  const iconSize = $derived(size === 'sm' ? 15 : size === 'lg' ? 22 : 19)
</script>

<button
  class="btn {variant} {size}"
  class:wide
  {disabled}
  {type}
  aria-label={label}
  onclick={e => {
    if (!silent) sfx('tap')
    onclick?.(e)
  }}
>
  <span class="face">
    {#if icon}<Icon name={icon} size={iconSize} />{/if}
    {#if children}<span class="label">{@render children()}</span>{/if}
    {#if trail}<span class="trail">{#if trailIcon}<Icon name={trailIcon} size={13} />{/if}{trail}</span>{/if}
  </span>
</button>

<style>
  .btn {
    --rim: var(--gold-l);
    --fill: var(--azurite);
    --fill2: var(--azurite-d);
    --ink-c: var(--silk);
    --base: #10283d;
    display: inline-flex;
    flex: none;
    filter: drop-shadow(0 3px 0 var(--base)) drop-shadow(0 4px 5px rgb(20 14 10 / 0.28));
    transition: filter var(--dur-1) var(--ease);
  }
  .wide {
    display: flex;
    width: 100%;
  }
  .face {
    --c: var(--cut);
    position: relative;
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    gap: var(--sp-2);
    min-height: 46px;
    padding: 0 var(--sp-4);
    font-size: var(--fs-4);
    font-weight: 700;
    line-height: 1.1;
    color: var(--ink-c);
    background: var(--rim);
    clip-path: polygon(var(--c) 0, calc(100% - var(--c)) 0, 100% var(--c), 100% calc(100% - var(--c)), calc(100% - var(--c)) 100%, var(--c) 100%, 0 calc(100% - var(--c)), 0 var(--c));
    transition: transform var(--dur-1) var(--ease);
  }
  /* mặt sơn bên trong viền kim */
  .face::before {
    --i: var(--hair);
    content: '';
    position: absolute;
    inset: var(--i);
    background:
      linear-gradient(rgb(255 255 255 / 0.2), rgb(255 255 255 / 0) 48%),
      var(--paper-tex),
      linear-gradient(var(--fill), var(--fill2));
    background-size: auto, 128px, auto;
    background-blend-mode: normal, multiply, normal;
    clip-path: polygon(
      calc(var(--c) - 0.6px) 0,
      calc(100% - var(--c) + 0.6px) 0,
      100% calc(var(--c) - 0.6px),
      100% calc(100% - var(--c) + 0.6px),
      calc(100% - var(--c) + 0.6px) 100%,
      calc(var(--c) - 0.6px) 100%,
      0 calc(100% - var(--c) + 0.6px),
      0 calc(var(--c) - 0.6px)
    );
  }
  .face > :global(*) {
    position: relative;
  }
  .label {
    text-shadow: var(--label-shadow, 0 1px 1px rgb(0 0 0 / 0.35));
  }
  .trail {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    font-size: var(--fs-2);
    font-weight: 700;
    background: rgb(0 0 0 / 0.22);
    clip-path: polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px);
  }

  .gold {
    --rim: var(--gold-d);
    --fill: var(--gold-l);
    --fill2: var(--gold);
    --ink-c: var(--ink);
    --base: #5e461a;
    --label-shadow: 0 1px 0 rgb(255 255 255 / 0.35);
  }
  .danger {
    --rim: #f0c2a8;
    --fill: var(--cinnabar-l);
    --fill2: var(--cinnabar);
    --base: #4f160c;
  }
  .ghost {
    --rim: var(--ink2);
    --fill: var(--paper);
    --fill2: var(--paper2);
    --ink-c: var(--ink);
    --base: color-mix(in srgb, var(--ink2) 60%, transparent);
    --label-shadow: none;
  }
  .quiet {
    filter: none;
  }
  .quiet .face {
    min-height: 0;
    padding: 2px 4px;
    color: var(--cinnabar);
    background: none;
    text-decoration: underline 1.5px;
    text-underline-offset: 3px;
  }
  .quiet .face::before {
    display: none;
  }

  .sm .face {
    --c: 5px;
    min-height: 34px;
    padding: 0 var(--sp-3);
    font-size: var(--fs-2);
  }
  .lg .face {
    min-height: 54px;
    font-size: var(--fs-5);
  }

  .btn:active:not(:disabled) {
    filter: drop-shadow(0 1px 0 var(--base)) drop-shadow(0 2px 3px rgb(20 14 10 / 0.25));
  }
  .btn:active:not(:disabled) .face {
    transform: translateY(2px) scale(0.985);
  }
  .btn:disabled {
    --rim: color-mix(in srgb, var(--ink3) 70%, transparent);
    --fill: var(--paper2);
    --fill2: var(--paper3);
    --ink-c: color-mix(in srgb, var(--ink2) 70%, transparent);
    --base: transparent;
    --label-shadow: none;
    filter: none;
  }
</style>
