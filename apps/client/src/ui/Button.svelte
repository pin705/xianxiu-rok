<script module lang="ts">
  export type ButtonVariant = 'primary' | 'gold' | 'danger' | 'ghost' | 'quiet'
</script>

<script lang="ts">
  // Nút: mảng sơn khoáng vẽ tay (loang nhiều lớp, mép sắc tố đậm, viền mực dày mỏng theo hướng sáng) — nhấn thì lún.
  // Mọi nút tự phát tiếng gõ.
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

  const iconSize = $derived(size === 'sm' ? 16 : size === 'lg' ? 22 : 20)
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
  {#if icon}<Icon name={icon} size={iconSize} />{/if}
  {#if children}<span class="label">{@render children()}</span>{/if}
  {#if trail}<span class="trail"
      >{#if trailIcon}<Icon name={trailIcon} size={13} />{/if}{trail}</span
    >{/if}
</button>

<style>
  .btn {
    --sk: var(--sk-btn);
    --fg: var(--silk);
    --shade: 0 1px 1px rgb(0 0 0 / 0.4);
    position: relative;
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    gap: var(--sp-2);
    min-height: 50px;
    padding: 0 var(--sp-5) 4px;
    font-size: var(--fs-4);
    font-weight: 800;
    line-height: 1.1;
    color: var(--fg);
    border: 0 solid transparent;
    border-image: var(--sk);
    transition:
      transform var(--dur-1) var(--ease),
      filter var(--dur-1) var(--ease);
  }
  .wide {
    display: flex;
    width: 100%;
  }
  .label {
    text-shadow: var(--shade);
  }
  .gold {
    --sk: var(--sk-btn-gold);
    --fg: var(--ink);
    --shade: 0 1px 0 rgb(255 255 255 / 0.45);
  }
  .danger {
    --sk: var(--sk-btn-danger);
  }
  .ghost {
    --sk: var(--sk-btn-ghost);
    --fg: var(--ink);
    --shade: none;
  }
  .btn:disabled {
    --sk: var(--sk-btn-off);
    --fg: color-mix(in srgb, var(--ink2) 75%, transparent);
    --shade: none;
  }
  /* nút vàng: thỉnh thoảng một vệt sáng lướt qua mặt kim (trong lòng nút, không tràn ra mép vẽ) */
  .gold:not(:disabled)::after {
    content: '';
    position: absolute;
    inset: 5px 10px 9px;
    border-radius: 12px;
    background: linear-gradient(105deg, transparent 38%, rgb(255 255 255 / 0.5) 48%, transparent 58%) 130% 0 / 260% 100%
      no-repeat;
    animation: sheen 4.5s var(--ease) 1.2s infinite;
    pointer-events: none;
  }
  @keyframes sheen {
    0%,
    72% {
      background-position: 130% 0;
    }
    100% {
      background-position: -30% 0;
    }
  }
  .trail {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    font-size: var(--fs-2);
    font-weight: 700;
    color: var(--silk);
    text-shadow: none;
    border: 0 solid transparent;
    border-image: var(--sk-tag-dark);
  }
  .quiet {
    min-height: 0;
    padding: 2px 4px;
    color: var(--cinnabar);
    text-decoration: underline 1.5px;
    text-underline-offset: 3px;
    --sk: none; /* không viết border-image: none — bộ nén CSS của Vite biến thành `border-image:;` (bỏ qua) */
  }
  .quiet .label {
    text-shadow: none;
  }
  .sm {
    min-height: 38px;
    padding: 0 var(--sp-4) 3px;
    font-size: var(--fs-2);
  }
  .lg {
    min-height: 58px;
    font-size: var(--fs-5);
  }
  .btn:active:not(:disabled) {
    transform: translateY(2px) scale(0.985);
    filter: brightness(0.93);
  }
</style>
