<script lang="ts">
  // Mục lịch: viên giấy bầu dục nhỏ, tranh nhỏ đầu mục (ui:<art>, lùi về icon), tên. on: viền vàng chữ đậm, bấm được (mở
  // mục); không on: chữ nhạt, không bấm (chưa mở). Xếp bằng .row.wrap (lịch sự kiện 7 ngày).
  import { Icon, artOf, type IconName } from '@rok/art'

  let {
    art,
    icon,
    label,
    on = false,
    onclick,
  }: { art?: string; icon: IconName; label: string; on?: boolean; onclick: () => void } = $props()
  const src = $derived(art ? artOf(`ui:${art}`)?.src : undefined)
</script>

<button class="entry" class:on {onclick} disabled={!on}
  >{#if src}<img {src} alt="" />{:else}<Icon name={icon} size={14} />{/if}{label}</button
>

<style>
  .entry {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 1px 8px 2px 5px;
    font-size: var(--fs-1);
    color: var(--text-soft);
    background: var(--paper2);
    border: 1px solid var(--paper3);
    border-radius: 999px;
  }
  img {
    width: 18px;
    height: 18px;
    margin: -2px 0;
  }
  .on {
    color: var(--text);
    border-color: var(--gold);
    cursor: pointer;
  }
</style>
