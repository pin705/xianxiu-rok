<script lang="ts">
  // Nhãn bầu dục nhỏ (tên đạo hữu, thẻ trưởng lão chia sẻ, đội hình, link toạ độ/xem trận): nền giấy, viền mảnh; có onclick
  // thì bấm được. pic: chân dung/tranh đầu nhãn (lề trái hẹp) · icon · tone azure: link lam (nhảy tới) · rar 2–4: viền theo
  // phẩm · dot: chấm lục (đang chơi) · dashed: viền đứt (thêm vào).
  import type { Snippet } from 'svelte'
  import { Icon, type IconName } from '@rok/art'

  let {
    pic,
    icon,
    tone = 'paper',
    rar,
    dot = false,
    dashed = false,
    label,
    onclick,
    children,
  }: {
    pic?: Snippet
    icon?: IconName
    tone?: 'paper' | 'azure'
    rar?: number
    dot?: boolean
    dashed?: boolean
    label?: string
    onclick?: () => void
    children: Snippet
  } = $props()
</script>

{#snippet body()}{#if pic}{@render pic()}{/if}{#if icon}<Icon name={icon} size={12} />{/if}{#if dot}<i class="dot"
    ></i>{/if}{@render children()}{/snippet}
{#if onclick}
  <button type="button" class="cap {tone} rar{rar ?? 0}" class:pic={!!pic} class:dashed aria-label={label} {onclick}
    >{@render body()}</button
  >
{:else}
  <span class="cap {tone} rar{rar ?? 0}" class:pic={!!pic} class:dashed>{@render body()}</span>
{/if}

<style>
  .cap {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 28px;
    padding: 2px 10px;
    font-size: var(--fs-1);
    font-weight: 700;
    line-height: 1.2;
    text-align: left;
    color: var(--text);
    background: var(--paper2);
    border: 1px solid var(--paper3);
    border-radius: 999px;
  }
  .pic {
    padding-left: 2px;
  }
  .dashed {
    border: 1px dashed var(--rim, var(--ink3));
  }
  .azure {
    color: var(--azurite);
    background: color-mix(in srgb, var(--azurite) 12%, transparent);
    border-color: transparent;
  }
  .rar2,
  .rar3,
  .rar4 {
    border-width: 1.5px;
  }
  .rar2 {
    border-color: var(--rar2);
  }
  .rar3 {
    border-color: var(--rar3);
  }
  .rar4 {
    border-color: var(--rar4);
  }
  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--malachite);
  }
</style>
