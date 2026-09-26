<script lang="ts">
  // Dải lụa ghi chú ngắn (giờ còn lại, cấp, trạng thái): đuôi cắt én bên phải. tone: son (mặc định) · mực · lục.
  import type { Snippet } from 'svelte'
  import { Icon, type IconName } from '@rok/art'

  let { tone = 'red', icon, children }: { tone?: 'red' | 'ink' | 'jade'; icon?: IconName; children: Snippet } = $props()
</script>

<span class="band {tone}"
  >{#if icon}<Icon name={icon} size={12} />{/if}{@render children()}</span
>

<style>
  .band {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    justify-self: start;
    align-self: start;
    max-width: 100%;
    padding: 1px 14px 2px 8px;
    font-size: var(--fs-1);
    font-weight: 800;
    line-height: 1.35;
    color: var(--pill-fg);
    text-shadow: 0 1px 1px rgb(0 0 0 / 0.3);
    background: var(--cinnabar);
    clip-path: polygon(0 0, 100% 0, calc(100% - 7px) 50%, 100% 100%, 0 100%);
  }
  .ink {
    background: var(--pill);
  }
  .jade {
    background: var(--malachite);
  }
</style>
