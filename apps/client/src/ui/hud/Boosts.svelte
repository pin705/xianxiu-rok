<script lang="ts">
  // Hàng chip tăng ích dưới chân dung (HUD): mỗi chip icon + giờ còn lại trên viên giấy viền vàng (jade: viền lục — khiên),
  // `more`: chip "+N"; cả hàng là một nút (mở bảng tăng ích). Vùng chạm cao hơn chip mà không đẩy bố cục.
  import { Icon, type IconName } from '@rok/art'

  type Chip = { key: string; icon: IconName; text?: string; jade?: boolean }
  let {
    items,
    more = 0,
    label,
    onclick,
  }: { items: Chip[]; more?: number; label: string; onclick: () => void } = $props()
</script>

<button class="boosts" {onclick} aria-label={label}>
  {#each items as c (c.key)}
    <span class="chip" class:jade={c.jade}
      ><Icon name={c.icon} size={16} />{#if c.text}<b class="t-num">{c.text}</b>{/if}</span
    >
  {/each}
  {#if more > 0}<span class="chip more">+{more}</span>{/if}
</button>

<style>
  .boosts {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
    padding: 6px 0;
    margin: -6px 0;
    background: none;
    border: 0;
    cursor: pointer;
  }
  .chip {
    display: inline-flex;
    gap: 2px;
    align-items: center;
    height: 22px;
    padding: 0 6px 0 3px;
    font-size: var(--fs-1);
    font-weight: 800;
    color: var(--text);
    background: color-mix(in srgb, var(--paper2) 88%, transparent);
    border: 1px solid color-mix(in srgb, var(--gold) 70%, transparent);
    border-radius: 11px;
  }
  .jade {
    border-color: var(--malachite);
  }
  .more {
    padding: 0 7px;
  }
</style>
