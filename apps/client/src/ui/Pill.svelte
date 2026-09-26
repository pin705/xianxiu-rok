<script lang="ts">
  // Viên mực: nhãn số/chữ ngắn nền mực chữ trắng, nổi được trên tranh và cảnh (giá, số lượng, "+x/giờ").
  // tone="red": viên son (cảnh báo, đang chờ).
  import type { Snippet } from 'svelte'
  import { Icon, type IconName } from '@rok/art'

  let { tone = 'ink', icon, children }: { tone?: 'ink' | 'red'; icon?: IconName; children: Snippet } = $props()
</script>

<span class="pill {tone}"
  >{#if icon}<Icon name={icon} size={13} />{/if}{@render children()}</span
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
</style>
