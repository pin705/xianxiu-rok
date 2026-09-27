<script module lang="ts">
  export type ButtonVariant = 'primary' | 'gold' | 'danger' | 'ghost' | 'quiet' | 'ink'
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
  /* nút chính: sơn son, chữ trắng (trắng sương 27/9) */
  .gold {
    --sk: var(--sk-btn-gold);
    --fg: #fff;
    --shade: 0 1px 2px rgb(0 0 0 / 0.45);
  }
  .danger {
    --sk: var(--sk-btn-danger);
  }
  /* nút phụ: giấy trắng viền mực đôi mảnh (cùng họ khung thẻ) — không phải tấm kim loại xám */
  .ghost {
    --sk: none;
    --fg: var(--text);
    --shade: none;
    background: #fff;
    border: 1.5px solid var(--rim, var(--ink3));
    border-radius: 6px;
    box-shadow:
      inset 0 0 0 2px #fff,
      inset 0 0 0 3px var(--paper3),
      0 1px 2px rgb(0 0 0 / 0.12);
  }
  .ghost.sm {
    padding-bottom: 1px;
  }
  /* chưa bấm được: giấy nhạt viền mờ, chữ nhạt (không phải thỏi kim loại xám) */
  .btn:disabled {
    --sk: none;
    --fg: var(--text-faint);
    --shade: none;
    background: var(--paper2);
    border: 1.5px solid var(--paper3);
    border-radius: 6px;
  }
  .ghost:disabled,
  .ink:disabled {
    --sk: none;
    opacity: 0.55;
  }
  /* nút vàng: thỉnh thoảng một vệt sáng lướt qua mặt kim (trong lòng nút, không tràn ra mép vẽ) */
  .gold:not(:disabled)::after {
    content: '';
    position: absolute;
    inset: 5px 10px 9px;
    border-radius: 12px;
    background: linear-gradient(105deg, transparent 38%, rgb(255 255 255 / 0.5) 48%, transparent 58%) 130% 0 / 260% 100%
      no-repeat;
    /* lướt 3 lần sau khi hiện rồi thôi: lặp mãi thì mỗi nút son trên màn bắt trình duyệt vẽ lại từng khung hình */
    animation: sheen 4.5s var(--ease) 1.2s 3;
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
  /* nút nổi trên cảnh (bản đồ, trận): viên mực đen chữ trắng như thanh trên của HUD */
  .ink {
    --sk: none;
    --fg: #f5f5f1;
    --shade: none;
    background: rgb(31 27 23 / 0.82);
    border: 1px solid rgb(255 255 255 / 0.2);
    border-radius: 999px;
    box-shadow: 0 2px 6px rgb(0 0 0 / 0.25);
    white-space: nowrap;
  }
  .ink.sm {
    min-height: 34px;
    padding: 0 14px 1px;
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
  .quiet:disabled {
    background: none;
    border: 0;
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
