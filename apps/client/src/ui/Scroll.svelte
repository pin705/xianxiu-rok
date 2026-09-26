<script lang="ts">
  // Cuộn tranh treo: giấy trắng giữa hai trục gỗ. rar: phẩm (2 lam · 3 tím · 4 vàng — viền theo phẩm); off: chưa có (xám);
  // onclick: cả cuộn bấm được. Dùng cho trưởng lão, thẻ nhân vật, tranh trưng bày.
  // Thẻ nhân vật (tuỳ chọn, dưới tranh là phần con): name viên giấy tên, sub dòng vàng (cấp · sao, ổ khoá), meter thanh
  // kinh nghiệm 0..1, stamp dấu trạng thái đóng góc (stampTone good: lục · bad: son).
  import type { Snippet } from 'svelte'
  import { sfx } from '../lib'
  import Meter from './Meter.svelte'

  let {
    rar = 0,
    off = false,
    label,
    title,
    name,
    sub,
    meter,
    stamp,
    stampTone = 'good',
    onclick,
    children,
  }: {
    rar?: number
    off?: boolean
    label?: string
    title?: string
    name?: string
    sub?: Snippet
    meter?: number
    stamp?: string
    stampTone?: 'good' | 'bad'
    onclick?: (e: MouseEvent) => void
    children: Snippet
  } = $props()
</script>

{#snippet card()}
  {#if name !== undefined}<b class="nm">{name}</b>{/if}
  {#if sub}<small class="lvl t-num">{@render sub()}</small>{/if}
  {#if meter !== undefined}<span class="bar"><Meter value={meter} tone="gold" size="xs" /></span>{/if}
  {#if stamp}<span class="mark {stampTone}">{stamp}</span>{/if}
{/snippet}

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
    }}>{@render children()}{@render card()}</button
  >
{:else}
  <div class="scroll rar{rar}" class:off {title}>{@render children()}{@render card()}</div>
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
    background: linear-gradient(#fff, color-mix(in srgb, var(--paper2) 60%, #fff));
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
    /* xám rất nhạt: tranh chưa có vẫn đọc được là giấy */
    background: linear-gradient(
      color-mix(in srgb, var(--paper2) 75%, #fff),
      color-mix(in srgb, var(--paper2) 88%, var(--paper3))
    );
    cursor: default;
  }
  .nm {
    max-width: 100%;
    margin-top: 4px;
    padding: 1px 8px 2px;
    overflow: hidden;
    font-size: var(--fs-2);
    font-weight: 800;
    white-space: nowrap;
    text-overflow: ellipsis;
    background: var(--paper2);
    border-radius: 999px;
  }
  .off .nm {
    color: var(--text-faint);
  }
  .lvl {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: var(--fs-1);
    font-weight: 700;
    color: var(--gold-d);
  }
  .bar {
    width: 70%;
  }
  /* dấu trạng thái: triện lục (ở nhà) / son (đang đi) đóng nghiêng góc trên */
  .mark {
    position: absolute;
    top: 8px;
    right: 4px;
    padding: 1px 5px;
    font-size: 10px;
    font-weight: 800;
    color: var(--malachite);
    border: 1.5px solid currentColor;
    border-radius: 4px;
    rotate: 8deg;
    background: rgb(255 255 255 / 0.7);
  }
  .mark.bad {
    color: var(--cinnabar);
  }
</style>
