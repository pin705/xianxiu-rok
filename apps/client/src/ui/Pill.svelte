<script lang="ts">
  // Viên mực: nhãn số/chữ ngắn nền mực chữ trắng, nổi được trên tranh và cảnh (giá, số lượng, "+x/giờ").
  // tone="red": viên son (cảnh báo, đang chờ); tone="accent": màu --accent của khung ngoài (lối chơi của đạo).
  // big: viên lớn số to (tiền đang có ở đầu sạp chợ).
  import type { Snippet } from 'svelte'
  import { Icon, type IconName } from '@rok/art'

  let {
    tone = 'ink',
    icon,
    big = false,
    children,
  }: { tone?: 'ink' | 'red' | 'accent'; icon?: IconName; big?: boolean; children: Snippet } = $props()
</script>

<span class="pill {tone}" class:big
  >{#if icon}<Icon name={icon} size={big ? 20 : 13} />{/if}{@render children()}</span
>

<style>
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    padding: 1px 9px 2px;
    overflow: hidden;
    font-size: var(--fs-1);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--pill-fg);
    background: var(--pill);
    border-radius: 999px;
  }
  .red {
    background: var(--cinnabar);
  }
  .accent {
    background: var(--accent, var(--pill));
  }
  .big {
    justify-self: start;
    padding: 3px 12px 4px 6px;
    font-size: var(--fs-4);
  }
</style>
