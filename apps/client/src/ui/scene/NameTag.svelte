<script lang="ts">
  // Biển tên tông môn trên bản đồ giới: viên mực mờ chữ ngà, treo dưới điểm (x, y px); mine: nền vàng chữ mực (của mình).
  import type { Snippet } from 'svelte'

  let { x, y, mine = false, children }: { x: number; y: number; mine?: boolean; children: Snippet } = $props()
</script>

<span class="tag" class:mine style:left="{x}px" style:top="{y}px">{@render children()}</span>

<style>
  .tag {
    position: absolute;
    translate: -50% 0;
    padding: 0 5px;
    font-size: var(--fs-1);
    font-weight: 700;
    color: var(--silk);
    white-space: nowrap;
    background: color-mix(in srgb, var(--ink) 62%, transparent);
    border-radius: 6px;
  }
  /* chữ mực trên nền vàng (màu gốc, không theo chữ ngà của giao diện tối) */
  .mine {
    color: var(--ink);
    background: color-mix(in srgb, var(--gold-l) 85%, transparent);
  }
</style>
